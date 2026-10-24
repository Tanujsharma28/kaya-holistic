import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { stripe } from '../config/stripe.js';
import { sendMail, notifyOwner } from '../utils/mailer.js';
import { giftBuyerEmail, giftRecipientEmail, giftOwnerEmail } from '../utils/giftEmails.js';
import { lookupGift } from '../utils/giftRedeem.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYMENTS_PAUSED = () => process.env.PAYMENTS_PAUSED === 'true';

export const GIFT_AMOUNTS = [100, 150];
const VALID_MONTHS = 6;
const HOLD_MINUTES = 31;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randChunk = (n) => Array.from(crypto.randomBytes(n), (b) => ALPHABET[b % ALPHABET.length]).join('');
const newCode = () => {
  for (;;) {
    const code = `KAYA-${randChunk(4)}-${randChunk(4)}`;
    if (!(db.data.giftCards || []).some((g) => g.code === code)) return code;
  }
};

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

const publicView = (g) => ({
  id: g.id, status: g.status, amount: g.amount,
  buyerName: g.buyerName, recipientName: g.recipientName, message: g.message,
  code: g.status === 'paid' || g.status === 'redeemed' ? g.code : '',
  createdAt: g.createdAt, expiresAt: g.expiresAt,
});

// 1) Checkout session
export const createGiftCheckout = async (req, res) => {
  const b = req.body || {};
  const fields = [b.amount, b.buyerName, b.buyerEmail, b.recipientName, b.recipientEmail, b.message];
  if (fields.some((v) => v !== undefined && v !== null && typeof v !== 'string' && typeof v !== 'number')) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  const amount = Number(b.amount);
  if (!GIFT_AMOUNTS.includes(amount)) {
    return res.status(400).json({ success: false, message: 'Please choose a $100 or $150 gift card' });
  }
  const buyerName = clean(b.buyerName, 100);
  const buyerEmail = clean(b.buyerEmail, 150);
  const recipientName = clean(b.recipientName, 100);
  const recipientEmail = clean(b.recipientEmail, 150);
  const message = clean(b.message, 300);

  if (!buyerName) return res.status(400).json({ success: false, message: 'Please enter your name' });
  if (!EMAIL_RE.test(buyerEmail)) return res.status(400).json({ success: false, message: 'Please enter a valid email for yourself' });
  if (recipientEmail && !EMAIL_RE.test(recipientEmail)) {
    return res.status(400).json({ success: false, message: 'The recipient email does not look right' });
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + VALID_MONTHS);

  const gift = {
    id: uuid(),
    code: newCode(),
    amount,
    buyerName, buyerEmail, recipientName, recipientEmail, message,
    status: 'pending-payment',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  db.data.giftCards ||= [];
  db.data.giftCards.push(gift);
  await db.write();

  // ── PAUSE MODE: payment ke bina seedha confirm aur email bhej do ──
  if (PAYMENTS_PAUSED()) {
    gift.status = 'paid';
    gift.paidAt = now.toISOString();
    gift.paymentSkipped = true; // admin ko pata rahe ki is gift card ka payment nahi liya gaya (test)
    await db.write();

    const sendRecipient = gift.recipientEmail && gift.recipientEmail.toLowerCase() !== gift.buyerEmail.toLowerCase();
    const jobs = [
      sendMail({ to: gift.buyerEmail, ...giftBuyerEmail(gift) }),
      notifyOwner(giftOwnerEmail(gift)),
    ];
    if (sendRecipient) jobs.push(sendMail({ to: gift.recipientEmail, ...giftRecipientEmail(gift) }));
    const results = await Promise.allSettled(jobs);
    results.forEach((r) => r.status === 'rejected' && console.error('Gift email error:', r.reason?.message));

    return res.status(201).json({ success: true, data: { paused: true, gift: publicView(gift) } });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: buyerEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amount * 100,
          product_data: {
            name: `Kaya Holistic Spa gift card ($${amount})`,
            description: `Digital gift card, valid ${VALID_MONTHS} months`,
          },
        },
        quantity: 1,
      }],
      metadata: { giftCardId: gift.id },
      success_url: `${process.env.CLIENT_URL}/gift-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/gift-cards?cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
    });
    gift.stripeSessionId = session.id;
    await db.write();
    res.status(201).json({ success: true, data: { url: session.url } });
  } catch (err) {
    db.data.giftCards = db.data.giftCards.filter((g) => g.id !== gift.id);
    await db.write();
    console.error('Gift card Stripe session error:', err.message);
    res.status(502).json({ success: false, message: 'Could not start payment. Please try again in a moment.' });
  }
};
// Gift card code check (balance kaatta nahi)
export const checkGiftCode = (req, res) => {
  const { code, date } = req.body || {};
  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your gift card code.' });
  }
  const r = lookupGift(db.data.giftCards, code, typeof date === 'string' ? date : undefined);
  if (!r.ok) return res.status(404).json({ success: false, message: r.message });
  res.json({ success: true, data: { code: r.gift.code, balance: r.balance, expiresAt: r.gift.expiresAt } });
};

// 2) Success page
export const getGiftBySession = (req, res) => {
  const g = (db.data.giftCards || []).find((x) => x.stripeSessionId === req.params.sessionId);
  if (!g) {
    return res.status(404).json({
      success: false,
      message: 'We could not find that gift card yet. If you just paid, wait a few seconds and refresh.',
    });
  }
  res.json({ success: true, data: publicView(g) });
};

// 3) Webhook se: payment confirm hone par
export async function handleGiftPaid(session) {
  const gift = (db.data.giftCards || []).find((g) => g.id === session.metadata?.giftCardId);
  if (!gift || gift.status !== 'pending-payment') return;
  gift.status = 'paid';
  gift.paidAt = new Date().toISOString();
  gift.stripePaymentIntentId = session.payment_intent || '';
  await db.write();

  const sendRecipient = gift.recipientEmail && gift.recipientEmail.toLowerCase() !== gift.buyerEmail.toLowerCase();
  const jobs = [
    sendMail({ to: gift.buyerEmail, ...giftBuyerEmail(gift) }),
    notifyOwner(giftOwnerEmail(gift)),
  ];
  if (sendRecipient) jobs.push(sendMail({ to: gift.recipientEmail, ...giftRecipientEmail(gift) }));
  const results = await Promise.allSettled(jobs);
  results.forEach((r) => r.status === 'rejected' && console.error('Gift email error:', r.reason?.message));
}

export async function handleGiftExpired(session) {
  const id = session.metadata?.giftCardId;
  const before = (db.data.giftCards || []).length;
  db.data.giftCards = (db.data.giftCards || []).filter((g) => !(g.id === id && g.status === 'pending-payment'));
  if (db.data.giftCards.length !== before) await db.write();
}

// ── Admin ──
export const getGiftCardsAdmin = (req, res) => {
  const list = (db.data.giftCards || [])
    .filter((g) => g.status !== 'pending-payment')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: list });
};

export const redeemGiftCard = async (req, res) => {
  const g = (db.data.giftCards || []).find((x) => x.id === req.params.id);
  if (!g || g.status === 'pending-payment') return res.status(404).json({ success: false, message: 'Gift card not found' });
  const redeem = req.body?.redeemed !== false;
  g.status = redeem ? 'redeemed' : 'paid';
  g.redeemedAt = redeem ? new Date().toISOString() : '';
  await db.write();
  res.json({ success: true, data: g });
};