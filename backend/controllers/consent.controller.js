import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { notifyOwner, sendMail } from '../utils/mailer.js';
import { moveToTrash } from './trash.controller.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const txt = (v, max = 300) => String(v ?? '').trim().slice(0, max);
const yn = (v) => (v === 'Yes' || v === 'No' ? v : '');

const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];
const CONDITIONS = ['Redness', 'Breakouts', 'Flaky', 'Sunburn', 'Itchy', 'Tight', 'Dark spots', 'Other'];

export const submitConsent = async (req, res) => {
  const b = req.body || {};
  const bad = (message) => res.status(400).json({ success: false, message });

  const name = txt(b.name, 100);
  const email = txt(b.email, 150);
  if (!name) return bad('Please enter your name');
  if (!EMAIL_RE.test(email)) return bad('Please enter a valid email');
  if (!txt(b.phone, 30)) return bad('Please enter your phone number');
  if (!txt(b.dob, 20)) return bad('Please enter your date of birth');

  const h = b.health || {};
  const health = {
    allergies: yn(h.allergies), allergiesDetail: txt(h.allergiesDetail),
    skinProblems: yn(h.skinProblems),
    recentTreatments: yn(h.recentTreatments),
    pregnantOrBreastfeeding: yn(h.pregnantOrBreastfeeding),
    medications: yn(h.medications), medicationsDetail: txt(h.medicationsDetail),
    keloid: yn(h.keloid),
  };
  if (Object.entries(health).some(([k, v]) => !k.endsWith('Detail') && !v)) {
    return bad('Please answer all Yes / No health questions');
  }

  const sk = b.skin || {};
  const skin = {
    concern: txt(sk.concern, 300),
    type: SKIN_TYPES.includes(sk.type) ? sk.type : '',
    conditions: (Array.isArray(sk.conditions) ? sk.conditions : []).filter((c) => CONDITIONS.includes(c)),
    conditionOther: txt(sk.conditionOther, 150),
    products: txt(sk.products, 500),
    area: txt(sk.area, 300),
  };

  const a = b.agreements || {};
  if (!(a.understand && a.tellDiscomfort && a.honest && a.consent)) {
    return bad('Please accept all consent statements');
  }
  const signature = txt(b.signature, 120);
  if (!signature) return bad('Please type your full name as signature');

  const bookingId = b.bookingId ? String(b.bookingId) : null;
  const booking = bookingId ? db.data.bookings.find((x) => x.id === bookingId) : null;

  const record = {
    id: uuid(),
    bookingId: booking?.id || null,
    name, email,
    phone: txt(b.phone, 30),
    address: txt(b.address, 250),
    dob: txt(b.dob, 20),
    health, skin,
    agreements: { understand: true, tellDiscomfort: true, honest: true, consent: true },
    signature,
    signedDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };

  db.data.consents ||= [];
  if (booking) db.data.consents = db.data.consents.filter((c) => c.bookingId !== booking.id);
  db.data.consents.push(record);
  await db.write();

  const flags = [];
  if (health.allergies === 'Yes') flags.push(`Allergies: ${esc(health.allergiesDetail || 'yes')}`);
  if (health.pregnantOrBreastfeeding === 'Yes') flags.push('Pregnant / breastfeeding');
  if (health.keloid === 'Yes') flags.push('History of keloid scarring');
  if (health.medications === 'Yes') flags.push(`Medications: ${esc(health.medicationsDetail || 'yes')}`);
  if (health.recentTreatments === 'Yes') flags.push('Recent face surgery/treatments');

  notifyOwner({
    subject: `Consent form signed: ${record.name}${flags.length ? ' ⚠️' : ''}`,
    html: `<h3>${esc(record.name)} signed the facial consent form</h3>
           <p>${esc(record.email)} · ${esc(record.phone)}${booking ? ` · Booking ${esc(booking.date)} ${esc(booking.slot)}` : ''}</p>
           ${flags.length ? `<p><b>⚠️ Please review:</b><br>${flags.join('<br>')}</p>` : '<p>No health flags.</p>'}
           <p>Full form is in the admin dashboard → Consent Forms.</p>`,
  }).catch((e) => console.error('Owner consent email failed:', e.message));

  sendMail({
    to: record.email,
    subject: 'Kaya Holistic Spa: your consent form is received',
    html: `<p>Hi ${esc(record.name)}, thank you for completing the facial consent form. We look forward to seeing you!</p>
           <p>Kaya Holistic Spa · 1567 Sherman Avenue, Evanston, IL 60201 · 847-571-1910</p>`,
  }).catch((e) => console.error('Client consent email failed:', e.message));

  res.status(201).json({ success: true, data: { id: record.id } });
};

export const getConsentsAdmin = (req, res) => {
  const list = [...(db.data.consents || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: list });
};

export const deleteConsent = async (req, res) => {
  const idx = (db.data.consents || []).findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  const [removed] = db.data.consents.splice(idx, 1);
  moveToTrash(req, 'consent', removed);
  await db.write();
  res.json({ success: true });
};