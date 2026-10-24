import crypto from 'crypto';

const r2 = (n) => Math.round(n * 100) / 100;

// "kaya-ab12-cd34", "KAYAAB12CD34" -> "KAYA-AB12-CD34" (galat format par '')
export const canonCode = (v) => {
  const s = String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^KAYA[A-Z0-9]{8}$/.test(s) ? `KAYA-${s.slice(4, 8)}-${s.slice(8)}` : '';
};

// Purane "redeemed" cards (redemptions list ke bina) ka balance 0 maana jata hai
export const giftBalance = (g) => {
  const uses = Array.isArray(g.redemptions) ? g.redemptions : [];
  if (!uses.length && g.status === 'redeemed') return 0;
  return Math.max(0, r2(Number(g.amount) - uses.reduce((s, r) => s + Number(r.amount), 0)));
};

const setStatus = (g) => {
  g.status = 'paid';
  const left = giftBalance(g);
  g.status = left <= 0 ? 'redeemed' : 'paid';
  const last = (g.redemptions || [])[(g.redemptions || []).length - 1];
  g.redeemedAt = left <= 0 ? (last?.at || new Date().toISOString()) : '';
};

// Code check (balance kaatna nahi). onDate = appointment ki date (YYYY-MM-DD)
export function lookupGift(cards, code, onDate) {
  const c = canonCode(code);
  const g = c && (cards || []).find((x) => x.code === c && x.status !== 'pending-payment');
  if (!g || g.voidedAt) return { ok: false, message: 'This gift card code is not valid.' };
  const balance = giftBalance(g);
  if (balance <= 0) return { ok: false, message: 'This gift card has no balance left.' };
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(onDate || '')) ? onDate : new Date().toISOString().slice(0, 10);
  if (String(g.expiresAt || '').slice(0, 10) < day) return { ok: false, message: 'This gift card has expired.' };
  return { ok: true, gift: g, balance };
}

// Price me se gift card kitna kaatega aur Stripe pe kitna bachega (Stripe ka minimum 50 cents)
export function splitPayment(price, balance) {
  const p = r2(Number(price));
  let giftAmount = r2(Math.min(balance, p));
  let toPay = r2(p - giftAmount);
  if (toPay > 0 && toPay < 0.5) {
    giftAmount = Math.max(0, r2(giftAmount - (0.5 - toPay)));
    toPay = r2(p - giftAmount);
  }
  return { giftAmount, toPay };
}

// Card se paisa kaato. Jitna asal me kata wo return hota hai.
export function spendGift(g, amount, { note = '', by = 'website', bookingId = '' } = {}) {
  const amt = r2(Math.min(Number(amount), giftBalance(g)));
  if (!(amt > 0) || g.voidedAt) return 0;
  g.redemptions = Array.isArray(g.redemptions) ? g.redemptions : [];
  g.redemptions.push({ id: crypto.randomUUID(), amount: amt, note: String(note).slice(0, 100), at: new Date().toISOString(), by, bookingId });
  setStatus(g);
  return amt;
}

// Payment fail/expire ho to us booking ka kata hua paisa wapas card me
export function releaseGift(cards, bookingId) {
  let changed = false;
  for (const g of cards || []) {
    const list = Array.isArray(g.redemptions) ? g.redemptions : [];
    const next = list.filter((r) => r.bookingId !== bookingId);
    if (next.length !== list.length) { g.redemptions = next; setStatus(g); changed = true; }
  }
  return changed;
}