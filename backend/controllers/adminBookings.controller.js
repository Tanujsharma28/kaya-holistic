import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { hasConflict, durationOf, typeOf, toMinutes, isPast, chicagoNow } from '../utils/slots.js';
import { sendMail } from '../utils/mailer.js';
import { createMeetEvent } from '../utils/googleMeet.js';
import { bookingConfirmationEmail } from '../utils/adminEmails.js';
import { audit } from '../utils/audit.js';
import { closedReason } from '../utils/settings.js';

const MEET_RE = /^https?:\/\/[^\s]+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });
const t = (v, max) => String(v ?? '').trim().slice(0, max);

// 645 -> "10:45 AM" (public booking wale slots jaisa hi format)
const label = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const enrich = (b) => ({
  ...b,
  duration: durationOf(db.data, b),
  type: typeOf(b),
  ref: String(b.id).slice(0, 8).toUpperCase(),
});

// ── Admin se naya booking (phone / walk-in) ──
export const createBookingAdmin = async (req, res) => {
  const b = req.body || {};
  if (![b.serviceId, b.date, b.slot, b.name, b.email].every((v) => typeof v === 'string' && v.trim())) {
    return bad(res, 'Please fill in service, date, time, name and email');
  }

  const service = db.data.services.find((s) => s.id === b.serviceId);
  if (!service) return bad(res, 'Please choose a valid service');

  const date = b.date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T12:00:00').getTime())) {
    return bad(res, 'Invalid date');
  }
  const closedMsg = closedReason(date);
  if (closedMsg) return bad(res, `${closedMsg}. You can change opening days in Settings.`);

  const mins = toMinutes(b.slot);
  if (mins === null) return bad(res, 'Invalid time');
  const slot = label(mins);

  const name = t(b.name, 100);
  const email = t(b.email, 150);
  if (!name) return bad(res, 'Please enter the client name');
  if (!EMAIL_RE.test(email)) return bad(res, 'Please enter a valid email');

  const status = b.status === 'completed' ? 'completed' : 'confirmed';
  if (status === 'confirmed' && isPast(date, slot)) {
    return bad(res, 'That time has already passed. If the visit already happened, choose "Already completed".');
  }

  const duration = Number(service.duration) || 60;
  if (hasConflict(db.data, { date, slot, duration })) {
    return bad(res, 'That time overlaps another appointment', 409);
  }

  const isOnline = service.id === 'virt' || b.mode === 'online';
  const meetLink = t(b.meetLink, 300);
  if (isOnline && meetLink && !MEET_RE.test(meetLink)) {
    return bad(res, 'Enter a valid Google Meet link, like https://meet.google.com/abc-defg-hij');
  }

  const booking = {
    id: uuid(),
    serviceId: service.id,
    serviceName: service.name,
    price: service.price,
    duration,
    type: typeOf({ serviceId: service.id }),
    date, slot,
    name, email,
    phone: t(b.phone, 30),
    note: t(b.note, 1000),
    addOns: [],
    mode: isOnline ? 'online' : 'in-person',
    meetLink: isOnline ? meetLink : '',
    meetLinkSent: false,
    reminderSent: false,
    status,
    source: 'admin',
    createdAt: new Date().toISOString(),
  };

  // Pehle slot lock karo, phir Meet link aur email
  db.data.bookings.push(booking);
  audit(req, 'booking.create', `Added booking: ${name} · ${service.name} · ${date} ${slot}${status === 'completed' ? ' (completed)' : ''}`);
  await db.write();

  if (status === 'confirmed' && isOnline && !booking.meetLink) {
    try {
      const ev = await createMeetEvent(booking);
      booking.meetLink = ev.link;
      booking.calendarEventId = ev.eventId;
      await db.write();
    } catch (e) {
      console.error('Meet link on admin booking failed:', e.message);
    }
  }

  let emailed = null;
  if (status === 'confirmed' && b.notify !== false) {
    emailed = !!(await sendMail({ to: booking.email, ...bookingConfirmationEmail(enrich(booking)) }));
  }

  res.status(201).json({ success: true, data: enrich(booking), emailed });
};

// ── Ek saath Completed / No-show ──
export const bulkUpdateStatus = async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x) => typeof x === 'string') : [];
  const status = req.body?.status;
  if (!ids.length) return bad(res, 'No bookings selected');
  if (!['completed', 'no-show'].includes(status)) return bad(res, 'Invalid status');

  const today = chicagoNow().date;
  let updated = 0;
  let skipped = 0;

  for (const id of ids) {
    const b = db.data.bookings.find((x) => x.id === id);
    const cur = String(b?.status || '').toLowerCase();
    // Sirf confirmed, aur jinki date aa chuki ho
    if (!b || (cur !== 'confirmed' && cur !== 'approved') || b.date > today) { skipped += 1; continue; }
    b.status = status;
    b.updatedAt = new Date().toISOString();
    updated += 1;
  }

  if (updated) audit(req, 'booking.bulk', `Marked ${updated} booking${updated === 1 ? '' : 's'} as ${status}`);
  await db.write();
  res.json({ success: true, updated, skipped });
};