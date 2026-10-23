import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { sendMail, notifyOwner } from '../utils/mailer.js';
import { hasConflict, toMinutes, typeOf, isPast } from '../utils/slots.js';
import { createMeetEvent } from '../utils/googleMeet.js';
import { closedReason, slotsFor } from '../utils/settings.js';
const ADDRESS = '1567 Sherman Avenue, Evanston, IL 60201';
const PHONE = '847-571-1910';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ─── Slots: 10 AM to 6 PM, 45 min gaps, Mon to Sat ───
const buildSlotLabels = () => {
  const out = [];
  let hour = 10, min = 0;
  while (hour < 18) {
    out.push(`${hour > 12 ? hour - 12 : hour}:${min === 0 ? '00' : min} ${hour >= 12 ? 'PM' : 'AM'}`);
    min += 45;
    if (min >= 60) { min -= 60; hour++; }
  }
  return out;
};
export const SLOT_LABELS = buildSlotLabels();
export const normSlot = (s) => String(s).trim().toUpperCase().replace(/^0/, '').replace(/\s+/g, ' ');
export const getAvailability = (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ success: false, message: 'date query required' });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T12:00:00').getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid date' });
  }

  // Band din (hafte ka din ya holiday): koi slot nahi, wajah ke saath
  const closed = closedReason(date);
  if (closed) return res.json({ success: true, data: [], closed });

  // serviceId diya ho to us service ki duration se overlap check hoga
  const svc = req.query.serviceId ? db.data.services.find((x) => x.id === req.query.serviceId) : null;
  const duration = Number(svc?.duration) || 45;

  const slots = slotsFor(date).map((label) => ({
    time: label,
    available: !(isPast(date, label) || hasConflict(db.data, { date, slot: label, duration })),
  }));
  res.json({ success: true, data: slots });
};

// Booked slot times for a given date (flat array for frontend)
export const getBookedSlots = (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ success: false, message: 'date query required' });

  const bookings = db.data.bookings || [];

  // Us date ke non-cancelled bookings filter karo aur sirf slot time return karo
  const bookedTimes = bookings
    .filter((b) => b.date === date && String(b.status).toLowerCase() !== 'cancelled')
    .map((b) => b.slot); // e.g., ['10:00 AM', '11:15 AM']

  res.json({ success: true, bookedTimes });
};

// ─── Email pieces (espresso, gold, cream) ───
const row = (k, v) =>
  `<tr><td style="padding:11px 0;border-bottom:1px solid #eee3d3;width:36%;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a7d6e;font-weight:600">${k}</td>
   <td style="padding:11px 0;border-bottom:1px solid #eee3d3;font-size:15px;color:#2b2016;font-weight:600">${v}</td></tr>`;

function clientEmail({ b, service, formattedDate, isOnline, link }) {
  const intakeUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/consultation?booking=${b.id}`;
  const consentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/consent?booking=${b.id}`;
  const online = isOnline
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3e7;border:1px solid #e6d3b3;border-radius:12px"><tr><td style="padding:22px;text-align:center">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7c5c38;font-weight:700">Online session on Google Meet</p>
        ${link
          ? `<p style="margin:0 0 16px;font-size:14px;color:#5c4f41;line-height:1.6">Join with the button below at your appointment time. You will also get a reminder 30 minutes before.</p>
             <a href="${esc(link)}" style="display:inline-block;background:#a67c52;color:#fff;text-decoration:none;font-weight:600;padding:13px 28px;border-radius:99px">Join Google Meet</a>
             <p style="margin:12px 0 0;font-size:12px;color:#8a7d6e">Or copy: ${esc(link)}</p>`
          : `<p style="margin:0;font-size:14px;color:#5c4f41;line-height:1.6">Your video link will be emailed to you before the session.</p>`}
      </td></tr></table>`
    : `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3e7;border:1px solid #e6d3b3;border-radius:12px"><tr><td style="padding:20px 24px;font-size:14px;color:#5c4f41;line-height:1.8">
        <b style="color:#7c5c38;letter-spacing:1px;text-transform:uppercase;font-size:12px">Before your visit</b><br>
        Please arrive 5 minutes early with a clean, makeup-free face.<br>Let us know about any allergies.<br>${ADDRESS}
        <br><br>Please complete your <a href="${consentUrl}" style="color:#7c5c38;font-weight:700">Facial Consent Form</a> before your visit (2 minutes).
      </td></tr></table>`;

  return `<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e6ddd0;border-radius:16px;overflow:hidden">
<tr><td align="center" style="background:#241a13;padding:34px 30px">
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c89b5c">Kaya Holistic Spa &middot; Evanston, Illinois</div>
  <div style="font-family:Georgia,serif;font-size:28px;color:#fff;margin-top:8px">Appointment confirmed</div>
  <div style="width:44px;height:2px;background:#c89b5c;margin:16px auto 0"></div>
</td></tr>
<tr><td style="padding:32px 36px 8px">
  <p style="margin:0 0 8px;font-size:16px;color:#2b2016">Dear <b>${esc(b.name)}</b>,</p>
  <p style="margin:0;font-size:15px;color:#5c4f41;line-height:1.7">Thank you for booking with us. Your appointment is confirmed. Here are your details.</p>
</td></tr>
<tr><td style="padding:18px 36px 8px">
  <div style="background:#fbf3e7;border-radius:10px;padding:10px 16px;font-size:13px;color:#7c5c38;margin-bottom:10px">Booking reference: <b>${esc(b.id.slice(0, 8).toUpperCase())}</b></div>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${row('Treatment', esc(service.name))}
    ${row('Date', esc(formattedDate))}
    ${row('Time', `${esc(b.slot)} (Central Time)`)}
    ${row('Duration', `${service.duration} minutes`)}
    ${row('Format', isOnline ? 'Online (Google Meet)' : 'In-person at our studio')}
    ${row('Total', `<span style="font-size:19px;color:#7c5c38">$${service.price}</span>`)}
  </table>
</td></tr>
<tr><td style="padding:20px 36px 8px">${online}</td></tr>
${isOnline ? `<tr><td style="padding:12px 36px 8px;text-align:center">
  <p style="margin:0 0 12px;font-size:14px;color:#5c4f41;line-height:1.6">One more step: tell Puja about your skin (2 minutes) so she can prepare for your session.</p>
  <a href="${esc(intakeUrl)}" style="display:inline-block;background:#241a13;color:#fff;text-decoration:none;font-weight:600;padding:12px 26px;border-radius:99px">Complete your skin profile</a>
</td></tr>` : ''}
<tr><td style="padding:20px 36px 34px;text-align:center">
  <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}" style="display:inline-block;border:1.5px solid #a67c52;color:#7c5c38;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:12px 28px;border-radius:99px">Get directions</a>
</td></tr>
<tr><td align="center" style="background:#241a13;padding:22px 30px">
  <p style="margin:0 0 4px;font-size:12px;color:#d9cdb8">Need to reschedule? Call <b style="color:#c89b5c">${PHONE}</b></p>
  <p style="margin:0;font-size:11px;color:#a89a84">${ADDRESS} &middot; By appointment only &middot; Closed Sundays</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function ownerEmail({ b, service, formattedDate, isOnline, link }) {
  const r = (k, v) => `<tr><td style="padding:9px 0;border-bottom:1px solid #eee3d3;color:#8a7d6e;width:32%;font-size:13px">${k}</td><td style="padding:9px 0;border-bottom:1px solid #eee3d3;color:#2b2016;font-weight:600;font-size:14px">${v}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e6ddd0;border-radius:14px;overflow:hidden">
<tr><td style="background:#241a13;padding:20px 28px"><div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c89b5c">Kaya admin alert</div>
<div style="font-family:Georgia,serif;font-size:21px;color:#fff;margin-top:4px">New appointment booked</div></td></tr>
<tr><td style="padding:22px 28px"><table width="100%" cellpadding="0" cellspacing="0">
${r('Client', esc(b.name))}
${r('Email', `<a href="mailto:${esc(b.email)}" style="color:#7c5c38">${esc(b.email)}</a>`)}
${r('Phone', esc(b.phone) || 'Not provided')}
${r('Treatment', esc(service.name))}
${r('When', `${esc(formattedDate)} at ${esc(b.slot)}`)}
${r('Format', isOnline ? `Online${link ? ` (<a href="${esc(link)}" style="color:#7c5c38">Meet link</a>)` : ''}` : 'In-person')}
${r('Price', `$${service.price}`)}
${b.note ? r('Client note', `<i>${esc(b.note)}</i>`) : ''}
</table>
<p style="margin:16px 0 0;font-size:12px;color:#8a7d6e">Ref ${esc(b.id.slice(0, 8).toUpperCase())}. Manage it in the admin dashboard.</p>
</td></tr></table></td></tr></table></body></html>`;
}

// ─── Create booking ───
export const createBooking = async (req, res) => {
  const { serviceId, date, slot, name, email, phone, note, addOns = [], mode = 'in-person', videoLink = '', type } = req.body || {};

  if (!serviceId || !date || !slot || !name || !email) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  // Har field string hona chahiye. Array/object bhejne par DB me kharab data jaata tha aur admin stats crash ho jaate the.
  const isStr = (v) => typeof v === 'string';
  if (![serviceId, date, slot, name, email].every(isStr)
    || [phone, note, mode, videoLink, type].some((v) => v !== undefined && v !== null && !isStr(v))) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T12:00:00').getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid date' });
  }
    const closedMsg = closedReason(date);
  if (closedMsg) {
    return res.status(400).json({ success: false, message: closedMsg });
  }
    if (toMinutes(slot) === null || !slotsFor(date).some((l) => normSlot(l) === normSlot(slot))) {
    return res.status(400).json({ success: false, message: 'Please choose one of the available time slots' });
  }
  if (isPast(date, slot)) {
    return res.status(400).json({ success: false, message: 'That time has already passed. Please pick a later slot.' });
  }

  if (typeof serviceId !== 'string' || typeof name !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  const cleanAddOns = Array.isArray(addOns)
    ? addOns.filter((a) => typeof a === 'string').slice(0, 10).map((a) => a.trim().slice(0, 80))
    : [];

  const service = db.data.services.find((s) => s.id === serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Invalid service' });
  if (service.active === false) {
    return res.status(400).json({ success: false, message: 'This service is currently unavailable' });
  }

  if (hasConflict(db.data, { date, slot, duration: service.duration })) {
    return res.status(409).json({ success: false, message: 'Slot already booked' });
  }

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const isOnline = mode === 'online' || mode === 'virtual';
  const ownLink = isOnline && /^https:\/\/meet\.google\.com\//i.test(String(videoLink).trim()) ? String(videoLink).trim() : '';

   const booking = {
    id: uuid(),
    serviceId, serviceName: service.name, price: service.price, duration: service.duration,
    type: typeOf({ serviceId, type: type === 'consultation' || type === 'visit' ? type : undefined }),
    date, slot,
    name: String(name).trim().slice(0, 100),
    email: String(email).trim(),
    phone: String(phone || '').trim().slice(0, 30),
    note: String(note || '').slice(0, 1000),
    addOns: cleanAddOns,
    mode: isOnline ? 'online' : 'in-person',
    meetLink: ownLink,
    meetLinkSent: false,
    reminderSent: false,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  // Slot pehle lock karo (double booking se bachne ke liye), phir link banao
  db.data.bookings  .push(booking);
  await db.write();

  await finalizeConfirmedBooking(booking, service);

  res.status(201).json({ success: true, data: booking });
};

// Confirmed ho chuki booking (free flow se ya Stripe payment ke baad) ke liye
// Meet link banana aur confirmation emails bhejna — dono jagah se reuse hota hai.
export async function finalizeConfirmedBooking(booking, service) {
  const formattedDate = new Date(booking.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const isOnline = booking.mode === 'online' || booking.mode === 'virtual';

  if (isOnline && !booking.meetLink) {
    try {
      const ev = await createMeetEvent(booking);
      booking.meetLink = ev.link;
      booking.calendarEventId = ev.eventId;
      await db.write();
    } catch (err) {
      console.error('Meet link booking ke time nahi bana, cron retry karega:', err.message);
    }
  }

  const link = isOnline ? booking.meetLink : '';
  const ctx = { b: booking, service, formattedDate, isOnline, link };

  const results = await Promise.allSettled([
    sendMail({
      to: booking.email,
      subject: `Appointment confirmed: ${service.name} on ${formattedDate}`,
      html: clientEmail(ctx),
    }),
    notifyOwner({
      subject: `New booking: ${booking.name}, ${service.name}, ${formattedDate} at ${booking.slot}`,
      html: ownerEmail(ctx),
    }),
  ]);
  results.forEach((r) => r.status === 'rejected' && console.error('Email error:', r.reason?.message));
}