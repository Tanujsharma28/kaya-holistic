import { db } from '../config/db.js';
import { squareConfigured, deletePaymentLink } from './square.js';
import { releaseGift } from './giftRedeem.js';
import { syncSquareOrder } from '../controllers/payment.controller.js';

// Square payment link ki khud ki expiry nahi hoti (Stripe me thi). Isliye har 5 min me
// purane 'pending-payment' records dekhte hain: link band karke slot chhod dete hain.
const HOLD_MS = 31 * 60 * 1000;

async function sweepOne(rec, kind) {
  if (rec.squareOrderId) {
    try {
      if (await syncSquareOrder(rec.squareOrderId)) return; // paisa mil chuka tha, confirm ho gaya
    } catch (e) {
      console.error('Sweeper: order check fail:', e.message);
      return; // pakka nahi pata, is round me chhod do
    }
  }
  if (rec.squareLinkId) {
    try { await deletePaymentLink(rec.squareLinkId); } catch (e) {
      if (!/404|NOT_FOUND/i.test(e.message)) { console.error('Sweeper: link delete fail:', e.message); return; }
    }
  }
  if (kind === 'booking') {
    releaseGift(db.data.giftCards, rec.id);
    db.data.bookings = db.data.bookings.filter((b) => b.id !== rec.id);
  } else {
    db.data.giftCards = db.data.giftCards.filter((g) => g.id !== rec.id);
  }
  await db.write();
}

export async function sweepPendingPayments() {
  if (!squareConfigured() || process.env.PAYMENTS_PAUSED === 'true') return;
  const cutoff = Date.now() - HOLD_MS;
  const stale = (list) => (list || []).filter((x) => x.status === 'pending-payment' && new Date(x.createdAt).getTime() < cutoff);
  for (const b of stale(db.data.bookings)) await sweepOne(b, 'booking');
  for (const g of stale(db.data.giftCards)) await sweepOne(g, 'gift');
}

export function initPaymentSweeper() {
  setInterval(() => sweepPendingPayments().catch((e) => console.error('Sweeper error:', e.message)), 5 * 60 * 1000);
}