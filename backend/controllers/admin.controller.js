import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';
import { hasConflict, durationOf, typeOf, toMinutes, isPast } from '../utils/slots.js';
import { sendMail } from '../utils/mailer.js';
import { createMeetEvent, updateMeetEvent, deleteMeetEvent } from '../utils/googleMeet.js';
import { rescheduleEmail, cancellationEmail, meetLinkEmail, bookingConfirmationEmail } from '../utils/adminEmails.js';
const MEET_RE = /^https?:\/\/[^\s]+$/i;

// Helper function to check if booking is online/video call
const isVideo = (booking) => {
  if (!booking) return false;
  const mode = (booking.mode || booking.format || booking.type || '').toLowerCase();
  return mode.includes('online') || mode.includes('video') || mode.includes('virtual');
};

const STATUSES = ['confirmed', 'completed', 'cancelled', 'no-show', 'Approved', 'approved'];
const TZ = 'America/Chicago';
const chicagoToday = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });
const enrich = (b) => ({
  ...b,
  duration: durationOf(db.data, b),
  type: typeOf(b),
  ref: String(b.id).slice(0, 8).toUpperCase(),
});
const byWhen = (a, b) =>
  a.date.localeCompare(b.date) || (toMinutes(a.slot) ?? 0) - (toMinutes(b.slot) ?? 0);

// ── Login (with simple brute-force protection) ─────────────
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
const recent = (ip) => {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, list);
  return list;
};

export const login = async (req, res) => {
  const ip = req.ip;
  if (recent(ip).length >= MAX_FAILS) return bad(res, 'Too many attempts. Try again in 15 minutes.', 429);

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return bad(res, 'Email and password required');

  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH || !JWT_SECRET) {
    return bad(res, 'Admin login is not configured on the server', 500);
  }

  const ok = email === ADMIN_EMAIL.trim().toLowerCase() && (await bcrypt.compare(password, ADMIN_PASSWORD_HASH));
  if (!ok) {
    recent(ip).push(Date.now());
    return bad(res, 'Invalid credentials', 401);
  }
  attempts.delete(ip);
  const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, data: { token, email: ADMIN_EMAIL } });
};

export const adminLogin = login;

// ── Read ───────────────────────────────────────────────────
export const getAllBookingsAdmin = (req, res) => {
  const list = db.data.bookings
    .map(enrich)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: list });
};

export const getAllConsultationsAdmin = (req, res) => {
  const list = [...db.data.consultations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: list });
};

export const getDashboardStats = (req, res) => {
  const { bookings, consultations } = db.data;
  const today = chicagoToday();
  const weekEnd = addDays(today, 6);
  const live = bookings.filter((b) => b.status !== 'cancelled');
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.date >= today).sort(byWhen);

  const byStatus = {};
  bookings.forEach((b) => { byStatus[b.status] = (byStatus[b.status] || 0) + 1; });

  const svc = {};
  live.forEach((b) => { svc[b.serviceName] = (svc[b.serviceName] || 0) + 1; });

  res.json({
    success: true,
    data: {
      totalBookings: bookings.length,
      today: live.filter((b) => b.date === today).length,
      thisWeek: live.filter((b) => b.date >= today && b.date <= weekEnd).length,
      upcoming: upcoming.length,
      needsUpdate: bookings.filter((b) => b.status === 'confirmed' && b.date < today).length,
      revenueEarned: bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + (b.price || 0), 0),
      revenueExpected: upcoming.reduce((s, b) => s + (b.price || 0), 0),
      consultations: consultations.length,
      byStatus,
      nextUp: upcoming.slice(0, 6).map(enrich),
      daily: Array.from({ length: 14 }, (_, i) => {
        const d = addDays(today, i);
        return { date: d, count: live.filter((b) => b.date === d).length };
      }),
      topServices: Object.entries(svc).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
    },
  });
};

// ── Update / reschedule / cancel ───────────────────────────
export const updateBooking = async (req, res) => {
  const b = db.data.bookings.find((x) => x.id === req.params.id);
  if (!b) return bad(res, 'Booking not found', 404);

  const { status, adminNote, date, slot, meetLink, notify = true } = req.body || {};
  if (status !== undefined && !STATUSES.includes(status)) return bad(res, 'Invalid status');
  if (adminNote !== undefined && typeof adminNote !== 'string') return bad(res, 'Invalid note');
  if (meetLink !== undefined) {
    if (typeof meetLink !== 'string') return bad(res, 'Invalid link');
    if (meetLink.trim() && !MEET_RE.test(meetLink.trim())) {
      return bad(res, 'Enter a valid Google Meet link, like https://meet.google.com/abc-defg-hij');
    }
  }

  const newDate = date ?? b.date;
  const newSlot = slot ?? b.slot;
  const dateChanged = date !== undefined && date !== b.date;
  const slotChanged = slot !== undefined && (toMinutes(slot) === null || toMinutes(slot) !== toMinutes(b.slot));
  const moved = dateChanged || slotChanged;
  const dateSubmitted = date !== undefined || slot !== undefined;
  const nextStatus = status ?? b.status;

  if (moved || dateSubmitted) {
    const dt = new Date(newDate + 'T12:00:00');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) || Number.isNaN(dt.getTime())) return bad(res, 'Invalid date');
    if (dt.getDay() === 0) return bad(res, 'The spa is closed on Sundays');
    if (toMinutes(newSlot) === null) return bad(res, 'Invalid time');
    if (moved && isPast(newDate, newSlot)) return bad(res, 'That time has already passed');
  }

  const reactivating = b.status === 'cancelled' && nextStatus !== 'cancelled';
  if (
    nextStatus !== 'cancelled' && (moved || reactivating) &&
    hasConflict(db.data, { date: newDate, slot: newSlot, duration: durationOf(db.data, b), ignoreId: b.id })
  ) {
    return bad(res, 'That time overlaps another appointment', 409);
  }

  const prev = { date: b.date, slot: b.slot, status: b.status, meetLink: b.meetLink || '' };
  if (status !== undefined) b.status = status;
  if (date !== undefined) b.date = newDate;
  if (slot !== undefined) b.slot = newSlot;
  if (adminNote !== undefined) b.adminNote = adminNote.slice(0, 1000);
  if (meetLink !== undefined) b.meetLink = meetLink.trim();
  const linkChanged = meetLink !== undefined && b.meetLink !== prev.meetLink;
  if (moved || linkChanged) b.reminderSent = false;
  b.updatedAt = new Date().toISOString();
  await db.write();

  // Google Calendar ko sync rakho (cancel / reschedule / restore)
  try {
    const nowCancelled = b.status === 'cancelled';
    if (nowCancelled && prev.status !== 'cancelled' && b.calendarEventId) {
      await deleteMeetEvent(b.calendarEventId);
      b.calendarEventId = '';
    } else if (!nowCancelled && moved && b.calendarEventId) {
      await updateMeetEvent({ ...b, duration: durationOf(db.data, b) });
    } else if (!nowCancelled && reactivating && isVideo(b) && !b.calendarEventId) {
      const ev = await createMeetEvent({ ...b, duration: durationOf(db.data, b) });
      b.meetLink = ev.link;
      b.calendarEventId = ev.eventId;
      b.reminderSent = false;
    }
    await db.write();
  } catch (e) {
    console.error('Calendar sync failed:', e.message);
  }

  let emailed = null;
  if (notify && b.email) {
    if (b.status === 'cancelled' && prev.status !== 'cancelled') {
      emailed = !!(await sendMail({ to: b.email, ...cancellationEmail(enrich(b)) }));
    } else if ((dateSubmitted || moved) && b.status !== 'cancelled') {
      emailed = !!(await sendMail({ to: b.email, ...rescheduleEmail(enrich(b), prev) }));
    } else if (linkChanged && b.meetLink && isVideo(b) && b.status !== 'cancelled') {
      emailed = !!(await sendMail({ to: b.email, ...meetLinkEmail(enrich(b), b.meetLink) }));
    } else if ((b.status === 'confirmed' || b.status === 'Approved') && prev.status !== b.status) {
      emailed = !!(await sendMail({ to: b.email, ...bookingConfirmationEmail(enrich(b)) }));
    }
  }
  res.json({ success: true, data: enrich(b), emailed });
};

export const deleteBooking = async (req, res) => {
  const idx = db.data.bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return bad(res, 'Booking not found', 404);
  const [removed] = db.data.bookings.splice(idx, 1);
  db.data.consultations = db.data.consultations.filter((c) => c.bookingId !== removed.id);
  await db.write();
  if (removed.calendarEventId) {
    deleteMeetEvent(removed.calendarEventId).catch((e) => console.error('Calendar delete failed:', e.message));
  }
  res.json({ success: true, message: 'Booking deleted' });
};

export const bulkDeleteBookings = async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (!ids.length) return bad(res, 'No bookings selected');
  const removed = db.data.bookings.filter((b) => ids.includes(b.id));
  db.data.bookings = db.data.bookings.filter((b) => !ids.includes(b.id));
  db.data.consultations = db.data.consultations.filter((c) => !ids.includes(c.bookingId));
  await db.write();
  removed.forEach((b) => {
    if (b.calendarEventId) deleteMeetEvent(b.calendarEventId).catch((e) => console.error('Calendar delete failed:', e.message));
  });
  res.json({ success: true, deleted: removed.length });
};

export const deleteConsultation = async (req, res) => {
  const idx = db.data.consultations.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return bad(res, 'Record not found', 404);
  db.data.consultations.splice(idx, 1);
  await db.write();
  res.json({ success: true, message: 'Deleted' });
};

// ── Services ───────────────────────────────────────────────
const parseService = (body, base = {}) => {
  const out = { ...base };
  if (body.name !== undefined) {
    const n = String(body.name).trim();
    if (!n || n.length > 80) return { error: 'Name is required (max 80 characters)' };
    out.name = n;
  }
  if (body.category !== undefined) out.category = String(body.category).trim();
  if (body.image !== undefined) out.image = String(body.image).trim();
  if (body.imageUrl !== undefined) out.imageUrl = String(body.imageUrl).trim();
  if (body.desc !== undefined) out.desc = String(body.desc).trim().slice(0, 500);
  if (body.price !== undefined) {
    const p = Number(body.price);
    if (!Number.isFinite(p) || p < 0 || p > 5000) return { error: 'Price must be between 0 and 5000' };
    out.price = p;
  }
  if (body.duration !== undefined) {
    const d = Number(body.duration);
    if (!Number.isInteger(d) || d < 5 || d > 300) return { error: 'Duration must be 5 to 300 minutes' };
    out.duration = d;
  }
  if (body.active !== undefined) out.active = !!body.active;
  return { value: out };
};

export const getServicesAdmin = (req, res) => res.json({ success: true, data: db.data.services });

export const createService = async (req, res) => {
  const b = req.body || {};
  if (!b.name || b.price === undefined || b.duration === undefined) return bad(res, 'Name, price and duration are required');
  const { error, value } = parseService(b, { desc: '', active: true, category: 'Facials', imageUrl: '' });
  if (error) return bad(res, error);
  const slug = value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'service';
  let id = slug, i = 2;
  while (db.data.services.some((s) => s.id === id)) id = `${slug}-${i++}`;
  const service = { id, ...value };
  db.data.services.push(service);
  await db.write();
  res.status(201).json({ success: true, data: service });
};

export const updateService = async (req, res) => {
  const s = db.data.services.find((x) => x.id === req.params.id);
  if (!s) return bad(res, 'Service not found', 404);
  const { error, value } = parseService(req.body || {}, s);
  if (error) return bad(res, error);
  Object.assign(s, value);
  await db.write();
  res.json({ success: true, data: s });
};

export const deleteService = async (req, res) => {
  if (req.params.id === 'virt') return bad(res, 'The online consultation service cannot be deleted.');
  const idx = db.data.services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return bad(res, 'Service not found', 404);
  db.data.services.splice(idx, 1);
  await db.write();
  res.json({ success: true, message: 'Service deleted successfully' });
};

// Booking Approve route
export const approveBooking = async (req, res) => {
  const { id } = req.params;
  const { meetLink } = req.body;

  try {
    let bookingIndex = db.data.bookings.findIndex(b => b.id === id || b._id === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = db.data.bookings[bookingIndex];
    booking.status = 'confirmed';
    if (meetLink) booking.meetLink = meetLink.trim();
    booking.updatedAt = new Date().toISOString();
    await db.write();

    const enriched = enrich(booking);
    const emailed = !!(await sendMail({ to: booking.email, ...bookingConfirmationEmail(enriched) }));

    res.status(200).json({ success: true, message: "Booking approved and email sent!", booking: enriched, emailed });
  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};