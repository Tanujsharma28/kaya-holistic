import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { stripe } from '../config/stripe.js';
import { hasConflict, toMinutes, isPast } from '../utils/slots.js';
import { SLOT_LABELS, normSlot, finalizeConfirmedBooking } from './booking.controller.js';
import { handleGiftPaid, handleGiftExpired } from './giftcard.controller.js';
import { closedReason, slotsFor } from '../utils/settings.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Abhi sirf $45 wali Virtual Skin Consultation hi payment ke peeche hai.
// Baaki (in-person) Setmore khud handle karti hai.
const PAYABLE_SERVICE_ID = 'virt';

// Checkout session ka valid time — itni der tak slot "pending-payment" rehke hold rahega.
const HOLD_MINUTES = 20;
const PAYMENTS_PAUSED = () => process.env.PAYMENTS_PAUSED === 'true';

// ─── 1) Booking draft banao (slot hold) + Stripe Checkout session banao ───
export const createCheckoutSession = async (req, res) => {
  const { serviceId, date, slot, name, email, phone, note } = req.body || {};

  if (!serviceId || !date || !slot || !name || !email) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const isStr = (v) => typeof v === 'string';
  if (![serviceId, date, slot, name, email].every(isStr)
    || [phone, note].some((v) => v !== undefined && v !== null && !isStr(v))) {
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
    // ── PAUSE MODE: payment ke bina seedha confirm ──
  if (PAYMENTS_PAUSED()) {
    const booking = {
      id: uuid(),
      serviceId, serviceName: service.name, price: service.price, duration: service.duration,
      type: 'consultation',
      date, slot,
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

  // Pehle slot hold karo (status pending-payment), taaki koi aur isi slot pe
  // payment karte waqt book na kar sake.
  const booking = {
    id: uuid(),
    serviceId, serviceName: service.name, price: service.price, duration: service.duration,
    type: 'consultation',
    date, slot,
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

  db.data.bookings.push(booking);
  await db.write();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: booking.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(service.price) * 100),
          product_data: {
            name: service.name,
            description: `${service.duration} min online video consultation on ${date} at ${slot}`,
          },
        },
        quantity: 1,
      }],
      metadata: { bookingId: booking.id },
      success_url: `${process.env.CLIENT_URL}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/online-consultation?cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
    });

    booking.stripeSessionId = session.id;
    await db.write();

    res.status(201).json({ success: true, data: { url: session.url, bookingId: booking.id } });
  } catch (err) {
    // Stripe session nahi bana, toh hold kiya hua slot turant chhod do
    db.data.bookings = db.data.bookings.filter((b) => b.id !== booking.id);
    await db.write();
    console.error('Stripe checkout session banane me error:', err.message);
    res.status(502).json({ success: false, message: 'Could not start payment. Please try again in a moment.' });
  }
};

// ─── 2) Success page ke liye: session_id se booking dhoondo ───
export const getBookingBySession = (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ success: false, message: 'Missing session id' });

  const booking = db.data.bookings.find((b) => b.stripeSessionId === sessionId);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'We could not find that booking yet. If you just paid, please wait a few seconds and refresh.',
    });
  }
  const service = db.data.services.find((s) => s.id === booking.serviceId);
  res.json({ success: true, data: booking, service });
};

// ─── 3) Stripe Webhook: yahi se booking actually CONFIRM hoti hai ───
// Frontend ka "success" dikhana kabhi bhi bharosemand nahi — sirf Stripe ka
// server confirm kar sakta hai ki paisa actually mila. Isliye confirm-email,
// Meet link sab sirf is webhook ke andar hi trigger hote hain.
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe webhook signature invalid:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const session = event.data.object;

    // Gift card ka payment alag flow hai
    if (session.metadata?.giftCardId) {
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        if (session.payment_status === 'paid') await handleGiftPaid(session);
      } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
        await handleGiftExpired(session);
      }
      return res.json({ received: true });
    }

    const bookingId = session.metadata?.bookingId;

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const booking = bookingId && db.data.bookings.find((b) => b.id === bookingId);
      if (booking && booking.status === 'pending-payment') {
        // Bohot hi rare race-condition: isi slot pe koi aur beech me book ho gaya ho.
        if (hasConflict(db.data, { date: booking.date, slot: booking.slot, duration: booking.duration, ignoreId: booking.id })) {
          booking.status = 'cancelled';
          await db.write();
          try {
            await stripe.refunds.create({ payment_intent: session.payment_intent });
          } catch (refundErr) {
            console.error('❌ Auto-refund fail ho gaya, manually refund karna padega:', session.payment_intent, refundErr.message);
          }
        } else {
          booking.status = 'confirmed';
          booking.paidAt = new Date().toISOString();
          booking.amountPaid = (session.amount_total || 0) / 100;
          booking.stripePaymentIntentId = session.payment_intent || '';
          await db.write();
          const service = db.data.services.find((s) => s.id === booking.serviceId) || { name: booking.serviceName, price: booking.price, duration: booking.duration };
          await finalizeConfirmedBooking(booking, service);
        }
      }
    } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      // Payment complete nahi hua — hold kiya hua slot chhod do
      const idx = db.data.bookings.findIndex((b) => b.id === bookingId && b.status === 'pending-payment');
      if (idx !== -1) {
        db.data.bookings.splice(idx, 1);
        await db.write();
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('❌ Stripe webhook handler error:', err.message);
    res.status(500).json({ received: false });
  }
};