import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { sendMail, notifyOwner } from '../utils/mailer.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const submitConsultation = async (req, res) => {
  const { bookingId, answers } = req.body || {};
  let { name, email } = req.body || {};

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ success: false, message: 'Missing answers' });
  }

  let booking = null;
  if (bookingId) {
    booking = db.data.bookings.find((b) => b.id === bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    name = booking.name;
    email = booking.email;
  }

  if (!name || !EMAIL_RE.test(String(email || '').trim())) {
    return res.status(400).json({ success: false, message: 'A valid name and email are required' });
  }

  const record = {
    id: uuid(),
    bookingId: booking?.id || null,
    name: String(name).trim().slice(0, 100),
    email: String(email).trim(),
    answers,
    createdAt: new Date().toISOString(),
  };

  // Ek booking ka ek hi intake: dobara submit kare to purana replace ho jaye
  if (booking) {
    db.data.consultations = db.data.consultations.filter((c) => c.bookingId !== booking.id);
  }
  db.data.consultations.push(record);
  await db.write();

  const when = booking ? `${booking.date} at ${booking.slot} (Central Time)` : 'Not linked to a booking';
  const answersHtml = Object.entries(answers)
    .map(([q, a]) => `<p><b>${esc(q)}</b><br>${esc(a)}</p>`)
    .join('');

  notifyOwner({
    subject: `Skin intake: ${record.name} (${booking ? booking.date + ' ' + booking.slot : 'no booking'})`,
    html: `<h3>New skin intake from ${esc(record.name)} (${esc(record.email)})</h3>
           <p>Session: ${esc(when)}</p>${answersHtml}`,
  }).catch((e) => console.error('Owner intake email failed:', e.message));

  const ref = booking ? booking.id.slice(0, 8).toUpperCase() : '';
  sendMail({
    to: record.email,
    subject: 'Kaya Holistic Spa: your skin profile is received',
    html: `<p>Hi ${esc(record.name)}, thank you! Puja will review your answers before your session.</p>
           <p>Please email 3 clear face photos (front, left, right, no makeup) and photos of your current products to
           kayaholisticspa@gmail.com with ${ref ? `reference <b>${ref}</b>` : 'your name'} in the subject line.</p>`,
  }).catch((e) => console.error('Client intake email failed:', e.message));

  res.status(201).json({ success: true, data: record });
};