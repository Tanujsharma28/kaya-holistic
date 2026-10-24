import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { sendMail } from '../utils/mailer.js';
import { giftBuyerEmail, giftRecipientEmail } from '../utils/giftEmails.js';
import { audit } from '../utils/audit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TZ = 'America/Chicago';
const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });
const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const r2 = (n) => Math.round(n * 100) / 100;
const usd = (n) => `$${Number.isInteger(n) ? n : Number(n).toFixed(2)}`;
const todayChicago = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const niceDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ });

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const chunk = (n) => Array.from(crypto.randomBytes(n), (b) => ALPHABET[b % ALPHABET.length]).join('');
const newCode = () => {
  for (;;) {
    const code = `KAYA-${chunk(4)}-${chunk(4)}`;
    if (!(db.data.giftCards || []).some((g) => g.code === code)) return code;
  }
};

const find = (id) => (db.data.giftCards || []).find((g) => g.id === id && g.status !== 'pending-payment');

// Purane cards (jinme balance nahi tha) ko bhi sahi dikhata hai
const normalize = (g) => {
  let uses = Array.isArray(g.redemptions) ? g.redemptions : [];
  if (!uses.length && g.status === 'redeemed') {
    uses = [{ id: 'legacy', amount: g.amount, at: g.redeemedAt || g.paidAt || g.createdAt, note: 'Marked as redeemed', by: '' }];
  }
  const used = uses.reduce((s, r) => s + r.amount, 0);
  return { ...g, redemptions: uses, balance: Math.max(0, r2(g.amount - used)), voided: !!g.voidedAt };
};

// Balance dekh ke status theek rakho
const refresh = (g) => {
  const { balance, redemptions } = normalize(g);
  g.status = balance <= 0 ? 'redeemed' : 'paid';
  g.redeemedAt = balance <= 0 ? (redemptions[redemptions.length - 1]?.at || new Date().toISOString()) : '';
};

export const listGiftCardsAdmin = (req, res) => {
  const list = (db.data.giftCards || [])
    .filter((g) => g.status !== 'pending-payment')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(normalize);
  res.json({ success: true, data: list });
};

// ── Store me bika hua naya gift card ──
export const createGiftCardAdmin = async (req, res) => {
  const b = req.body || {};
  const amount = r2(Number(b.amount));
  if (!Number.isFinite(amount) || amount < 1 || amount > 1000) return bad(res, 'Amount must be between $1 and $1000');

  const buyerName = clean(b.buyerName, 100);
  const buyerEmail = clean(b.buyerEmail, 150);
  const recipientName = clean(b.recipientName, 100);
  const recipientEmail = clean(b.recipientEmail, 150);
  const message = clean(b.message, 300);
  if (!buyerName) return bad(res, 'Please enter the buyer name');
  if (buyerEmail && !EMAIL_RE.test(buyerEmail)) return bad(res, 'The buyer email does not look right');
  if (recipientEmail && !EMAIL_RE.test(recipientEmail)) return bad(res, 'The recipient email does not look right');

  const months = [3, 6, 12, 24].includes(Number(b.validMonths)) ? Number(b.validMonths) : 6;
  const now = new Date();
  const exp = new Date(now);
  exp.setMonth(exp.getMonth() + months);

  const gift = {
    id: uuid(),
    code: newCode(),
    amount,
    buyerName, buyerEmail, recipientName, recipientEmail, message,
    status: 'paid',
    createdAt: now.toISOString(),
    paidAt: now.toISOString(),
    expiresAt: exp.toISOString(),
    source: 'admin',
    redemptions: [],
  };
  db.data.giftCards ||= [];
  db.data.giftCards.push(gift);
  audit(req, 'giftcard.create', `Created gift card ${usd(amount)} for ${buyerName} (${gift.code})`);
  await db.write();

  let emailed = null;
  if (b.sendEmail !== false && (buyerEmail || recipientEmail)) {
    const jobs = [];
    if (buyerEmail) jobs.push(sendMail({ to: buyerEmail, ...giftBuyerEmail(gift) }));
    if (recipientEmail && recipientEmail.toLowerCase() !== buyerEmail.toLowerCase()) {
      jobs.push(sendMail({ to: recipientEmail, ...giftRecipientEmail(gift) }));
    }
    const results = await Promise.all(jobs);
    emailed = results.length > 0 && results.every(Boolean);
  }
  res.status(201).json({ success: true, data: normalize(gift), emailed });
};

// ── Card se paisa use karna (poora ya thoda) ──
export const spendGiftCard = async (req, res) => {
  const g = find(req.params.id);
  if (!g) return bad(res, 'Gift card not found', 404);
  const n = normalize(g);
  if (n.voided) return bad(res, 'This gift card is void');
  if (n.balance <= 0) return bad(res, 'This gift card has no balance left');
  if (new Date(g.expiresAt) < new Date()) {
    return bad(res, `This gift card expired on ${niceDate(g.expiresAt)}. Extend its validity first, then redeem.`);
  }
  const amount = r2(Number(req.body?.amount));
  if (!Number.isFinite(amount) || amount <= 0) return bad(res, 'Enter an amount greater than 0');
  if (amount > n.balance) return bad(res, `Only ${usd(n.balance)} is left on this card`);

  g.redemptions ||= [];
  g.redemptions.push({
    id: uuid(),
    amount,
    note: clean(req.body?.note, 100),
    at: new Date().toISOString(),
    by: req.admin?.email || 'admin',
  });
  refresh(g);
  const left = normalize(g).balance;
  audit(req, 'giftcard.use', `Used ${usd(amount)} of ${g.code} (${usd(left)} left)`);
  await db.write();
  res.json({ success: true, data: normalize(g) });
};

// ── Galat entry hata do ──
export const undoGiftUse = async (req, res) => {
  const g = find(req.params.id);
  if (!g) return bad(res, 'Gift card not found', 404);
  const { rid } = req.params;

  if (rid === 'legacy') {
    if (g.status !== 'redeemed' || (g.redemptions || []).length) return bad(res, 'Nothing to undo');
    g.redemptions = [];
    g.status = 'paid';
    g.redeemedAt = '';
  } else {
    const idx = (g.redemptions || []).findIndex((r) => r.id === rid);
    if (idx === -1) return bad(res, 'Redemption not found', 404);
    g.redemptions.splice(idx, 1);
    refresh(g);
  }
  audit(req, 'giftcard.undo', `Undid a redemption on ${g.code} (${usd(normalize(g).balance)} now available)`);
  await db.write();
  res.json({ success: true, data: normalize(g) });
};

// ── Validity badhana ──
export const extendGiftCard = async (req, res) => {
  const g = find(req.params.id);
  if (!g) return bad(res, 'Gift card not found', 404);
  const d = String(req.body?.expiresOn || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(new Date(`${d}T12:00:00`).getTime())) return bad(res, 'Choose a valid date');
  if (d < todayChicago()) return bad(res, 'Choose a date that is today or later');
  const max = new Date();
  max.setFullYear(max.getFullYear() + 3);
  if (new Date(`${d}T12:00:00`) > max) return bad(res, 'Validity can be set up to 3 years from today');

  g.expiresAt = new Date(`${d}T23:59:59-06:00`).toISOString();
  audit(req, 'giftcard.expiry', `Changed expiry of ${g.code} to ${d}`);
  await db.write();
  res.json({ success: true, data: normalize(g) });
};

// ── Email dobara bhejna ──
export const resendGiftCard = async (req, res) => {
  const g = find(req.params.id);
  if (!g) return bad(res, 'Gift card not found', 404);
  if (g.voidedAt) return bad(res, 'This gift card is void');
  const to = req.body?.to;
  if (!['buyer', 'recipient', 'both'].includes(to)) return bad(res, 'Choose who to email');

  const jobs = [];
  if (to === 'buyer' || to === 'both') {
    if (!g.buyerEmail) return bad(res, 'This card has no buyer email');
    jobs.push(sendMail({ to: g.buyerEmail, ...giftBuyerEmail(g) }));
  }
  if (to === 'recipient' || to === 'both') {
    if (!g.recipientEmail) return bad(res, 'This card has no recipient email');
    jobs.push(sendMail({ to: g.recipientEmail, ...giftRecipientEmail(g) }));
  }
  const results = await Promise.all(jobs);
  audit(req, 'giftcard.resend', `Emailed gift card ${g.code} to ${to}`);
  await db.write();
  res.json({ success: true, emailed: results.every(Boolean) });
};

// ── Void / un-void ──
export const voidGiftCard = async (req, res) => {
  const g = find(req.params.id);
  if (!g) return bad(res, 'Gift card not found', 404);
  const makeVoid = req.body?.void !== false;
  g.voidedAt = makeVoid ? new Date().toISOString() : '';
  audit(req, 'giftcard.void', `${makeVoid ? 'Voided' : 'Restored'} gift card ${g.code}`);
  await db.write();
  res.json({ success: true, data: normalize(g) });
};