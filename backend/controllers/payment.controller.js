import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { createPaymentLink, refundPayment, verifyWebhookSignature, getOrder } from '../utils/square.js';
import { hasConflict, toMinutes, isPast } from '../utils/slots.js';
import { SLOT_LABELS, normSlot, finalizeConfirmedBooking } from './booking.controller.js';
import { handleGiftPaid } from './giftcard.controller.js';
import { closedReason, slotsFor, staffOn, timeOffClash } from '../utils/settings.js';
import { lookupGift, splitPayment, spendGift, releaseGift } from '../utils/giftRedeem.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Abhi sirf $45 wali Virtual Skin Consultation hi payment ke peeche hai.
// Baaki (in-person) Setmore khud handle karti hai.
const PAYABLE_SERVICE_ID = 'virt';

// Itni der tak slot "pending-payment" rehke hold rahega (utils/paymentSweeper.js baad me chhod deta hai).
const PAYMENTS_PAUSED = () => process.env.PAYMENTS_PAUSED === 'true';

// ─── 1) Booking draft banao (slot hold) + Square payment link banao ───
export const createCheckoutSession = async (req, res) => {
  let { serviceId, date, slot, name, email, phone, note, giftCode } = req.body || {};

  if (!serviceId || !date || !slot || !name || !email) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const isStr = (v) => typeof v === 'string';
  if (![serviceId, date, slot, name, email].every(isStr)
    || [phone, note, giftCode].some((v) => v !== undefined && v !== null && !isStr(v))) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  if (serviceId !== PAYABLE_SERVICE_ID) {
    return res.status(400).json({ success: false, message: 'Online payment is only available for the virtual consultation' });
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T12:00:00').getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid date' });
  }
  const closedMsg = closedReason(date);
  if (closedMsg) return res.status(400).json({ success: false, message: closedMsg });
  if (toMinutes(slot) === null || !slotsFor(date).some((l) => normSlot(l) === normSlot(slot))) {
    return res.status(400).json({ success: false, message: 'Please choose one of the available time slots' });
  }
  slot = slotsFor(date).find((l) => normSlot(l) === normSlot(slot)); // canonical label
  if (isPast(date, slot)) {
    return res.status(400).json({ success: false, message: 'That time has already passed. Please pick a later slot.' });
  }

  const service = db.data.services.find((s) => s.id === serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Invalid service' });
  if (service.active === false) {
    return res.status(400).json({ success: false, message: 'This service is currently unavailable' });
  }
  if (!(Number(service.price) > 0)) {
    return res.status(400).json({ success: false, message: 'This service has no price set' });
  }

  if (hasConflict(db.data, { date, slot, duration: service.duration })) {
    return res.status(409).json({ success: false, message: 'Slot already booked' });
  }
  if (timeOffClash(date, slot, service.duration)) {
    return res.status(409).json({ success: false, message: 'That time is not available. Please pick another slot.' });
  }
    // ── PAUSE MODE: payment ke bina seedha confirm ──
  if (PAYMENTS_PAUSED()) {
    const booking = {
      id: uuid(),
      serviceId, serviceName: service.name, price: service.price, duration: service.duration,
      type: 'consultation',
      date, slot, staff: staffOn(date),
      name: String(name).trim().slice(0, 100),
      email: String(email).trim(),
      phone: String(phone || '').trim().slice(0, 30),
      note: String(note || '').slice(0, 1000),
      addOns: [],
      mode: 'online',
      meetLink: '',
      meetLinkSent: false,
      reminderSent: false,
      status: 'confirmed',
      paymentSkipped: true, // admin ko pata rahe ki is booking ka payment nahi liya gaya (test)
      createdAt: new Date().toISOString(),
    };
    db.data.bookings.push(booking);
    await db.write();
    await finalizeConfirmedBooking(booking, service);
    return res.status(201).json({ success: true, data: { paused: true, bookingId: booking.id, booking, service } });
  }

  // ── Gift card code (optional) ──
  let gift = null;
  let giftAmount = 0;
  let toPay = Number(service.price);
  if (typeof giftCode === 'string' && giftCode.trim()) {
    const r = lookupGift(db.data.giftCards, giftCode, date);
    if (!r.ok) return res.status(400).json({ success: false, message: r.message });
    gift = r.gift;
    ({ giftAmount, toPay } = splitPayment(service.price, r.balance));
  }

  // Pehle slot hold karo (status pending-payment), taaki koi aur isi slot pe
  // payment karte waqt book na kar sake.
  const booking = {
    id: uuid(),
    serviceId, serviceName: service.name, price: service.price, duration: service.duration,
    type: 'consultation',
    date, slot, staff: staffOn(date),
    name: String(name).trim().slice(0, 100),
    email: String(email).trim(),
    phone: String(phone || '').trim().slice(0, 30),
    note: String(note || '').slice(0, 1000),
    addOns: [],
    mode: 'online',
    meetLink: '',
    meetLinkSent: false,
    reminderSent: false,
    status: 'pending-payment',
    createdAt: new Date().toISOString(),
  };

  if (gift) {
    // Gift card ka paisa abhi hold (kaat) lete hain, payment fail/expire hone par wapas mil jaata hai
    const used = spendGift(gift, giftAmount, { note: `Online consultation ${date}`, by: 'website', bookingId: booking.id });
    booking.giftCardId = gift.id;
    booking.giftCode = gift.code;
    booking.giftAmount = used;
    toPay = Math.round((Number(service.price) - used) * 100) / 100;
  }

  // Gift card ne poora price cover kar diya: Square ki zarurat nahi, seedha confirm
  if (gift && toPay <= 0) {
    booking.status = 'confirmed';
    booking.paidAt = new Date().toISOString();
    booking.amountPaid = 0;
    db.data.bookings.push(booking);
    await db.write();
    await finalizeConfirmedBooking(booking, service);
    return res.status(201).json({ success: true, data: { free: true, bookingId: booking.id, booking, service } });
  }

  booking.amountDue = toPay;
  db.data.bookings.push(booking);
  await db.write();

  try {
    const link = await createPaymentLink({
      name: service.name,
      description: `${service.duration} min online video consultation on ${date} at ${slot}${gift ? ` (gift card -$${booking.giftAmount} applied)` : ''}`,
      amountCents: Math.round(toPay * 100),
      referenceId: booking.id,
      kind: 'booking',
      // Frontend ka purana "session_id" param hi use ho raha hai, usme ab booking id hai
      redirectUrl: `${process.env.CLIENT_URL}/confirmation?session_id=${booking.id}`,
      buyerEmail: booking.email,
    });

    booking.squareOrderId = link.orderId;
    booking.squareLinkId = link.linkId;
    await db.write();

    res.status(201).json({ success: true, data: { url: link.url, bookingId: booking.id } });
  } catch (err) {
    // Payment link nahi bana, toh hold kiya hua slot turant chhod do
    db.data.bookings = db.data.bookings.filter((b) => b.id !== booking.id);
    releaseGift(db.data.giftCards, booking.id);
    await db.write();
    console.error('Square payment link banane me error:', err.message);
    res.status(502).json({ success: false, message: 'Could not start payment. Please try again in a moment.' });
  }
};

// ─── 2) Success page ke liye: booking id (redirect me session_id naam se aati hai) se booking dhoondo ───
export const getBookingBySession = async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ success: false, message: 'Missing session id' });

  let booking = db.data.bookings.find((b) => b.id === sessionId);
  // Webhook late ho ya na aaye (jaise local test), to Square se seedha order pooch lete hain
  if (booking && booking.status === 'pending-payment' && booking.squareOrderId) {
    try { await syncSquareOrder(booking.squareOrderId); } catch (e) { console.error('Square order sync fail:', e.message); }
    booking = db.data.bookings.find((b) => b.id === sessionId);
  }
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'We could not find that booking yet. If you just paid, please wait a few seconds and refresh.',
    });
  }
  const service = db.data.services.find((s) => s.id === booking.serviceId);
  res.json({ success: true, data: booking, service });
};

// ─── 3) Square Webhook: yahi se booking actually CONFIRM hoti hai ───
// Frontend ka "success" dikhana kabhi bhi bharosemand nahi — sirf Square ka
// signed webhook batata hai ki paisa actually mila. Confirm-email, Meet link
// sab sirf yahin se trigger hote hain.
// Dhyan: client ke Square account me POS ke dusre payments ke events bhi aate hain.
// Jo order hamari bookings/gift cards se match na ho, usse ignore karte hain.
export async function handleSquarePaid(payment) {
  const orderId = payment?.order_id;
  if (!orderId || payment.status !== 'COMPLETED') return;
  const paidCents = Number(payment.amount_money?.amount || 0);

  // Gift card ka payment
  const gift = (db.data.giftCards || []).find((g) => g.squareOrderId === orderId);
  if (gift) {
    if (paidCents < gift.amount * 100) {
      console.error('❌ Gift card payment amount kam hai, confirm nahi kiya:', orderId, paidCents);
      return;
    }
    await handleGiftPaid(gift, payment);
    return;
  }

  const booking = db.data.bookings.find((b) => b.squareOrderId === orderId);
  if (!booking || booking.status !== 'pending-payment') return;

  const dueCents = Math.round(Number(booking.amountDue ?? booking.price) * 100);
  if (paidCents < dueCents) {
    console.error('❌ Booking payment amount kam hai, confirm nahi kiya:', orderId, paidCents, 'chahiye', dueCents);
    return;
  }

  // Bohot hi rare race-condition: isi slot pe koi aur beech me book ho gaya ho.
  if (hasConflict(db.data, { date: booking.date, slot: booking.slot, duration: booking.duration, ignoreId: booking.id })) {
    booking.status = 'cancelled';
    releaseGift(db.data.giftCards, booking.id);
    await db.write();
    try {
      await refundPayment(payment.id, paidCents);
    } catch (refundErr) {
      console.error('❌ Auto-refund fail ho gaya, manually refund karna padega:', payment.id, refundErr.message);
    }
    return;
  }

  booking.status = 'confirmed';
  booking.paidAt = new Date().toISOString();
  booking.amountPaid = paidCents / 100;
  booking.squarePaymentId = payment.id;
  await db.write();
  const service = db.data.services.find((s) => s.id === booking.serviceId) || { name: booking.serviceName, price: booking.price, duration: booking.duration };
  await finalizeConfirmedBooking(booking, service);
}

// Square se order check karke payment confirm karo (webhook ka backup).
// Sandbox testing panel me order OPEN rehta hai, isliye state nahi, tender (payment) dekhte hain.
export async function syncSquareOrder(orderId) {
  const order = await getOrder(orderId);
  const tender = (order?.tenders || [])[0];
  if (!tender) return false;
  if (tender.card_details && tender.card_details.status !== 'CAPTURED') return false;
  await handleSquarePaid({ id: tender.id, order_id: orderId, status: 'COMPLETED', amount_money: tender.amount_money || order.total_money });
  return true;
}

export const squareWebhook = async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!verifyWebhookSignature(raw, req.headers['x-square-hmacsha256-signature'])) {
    console.error('❌ Square webhook signature invalid (SQUARE_WEBHOOK_URL / signature key check kar)');
    return res.status(400).send('Invalid signature');
  }
  let event;
  try { event = JSON.parse(raw); } catch { return res.status(400).send('Bad JSON'); }

  try {
    if (event.type === 'payment.updated' || event.type === 'payment.created') {
      await handleSquarePaid(event.data?.object?.payment);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('❌ Square webhook handler error:', err.message);
    res.status(500).json({ received: false });
  }
};