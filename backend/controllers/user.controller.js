import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { toMinutes, isPast, durationOf } from '../utils/slots.js';
import { deleteMeetEvent } from '../utils/googleMeet.js';
import { sendMail } from '../utils/mailer.js';
import { cancellationEmail } from '../utils/adminEmails.js';

const norm = (e = '') => String(e).trim().toLowerCase();
const todayChicago = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const mins = (slot) => { try { return toMinutes(slot) || 0; } catch { return 0; } };
const byWhen = (a, b) => a.date.localeCompare(b.date) || mins(a.slot) - mins(b.slot);

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, picture: u.picture || '', phone: u.phone || '', createdAt: u.createdAt,
});

// Ek email ki saari activity (bookings, consent forms, intake). 'pending-payment' wali bookings customer ko nahi dikhti.
function collect(email) {
  const e = norm(email);
  return {
    bookings: (db.data.bookings || []).filter((b) => norm(b.email) === e && b.status !== 'pending-payment'),
    consents: (db.data.consents || []).filter((c) => norm(c.email) === e),
    consultations: (db.data.consultations || []).filter((c) => norm(c.email) === e),
  };
}

// ── Activity log (sirf logged-in customer ka) ──────────────
const QUIZ_NAMES = {
  advanced: 'Advanced Facial',
  'anti-aging': 'Anti-Aging Facial',
  acne: 'Acne & Deep Pore Cleansing',
  calming: 'Botanical Calming Facial',
  signature: 'Kaya Signature (Customize) Facial',
};

function logActivity(userId, type, text) {
  db.data.activity ||= [];
  const now = Date.now();
  // Same cheez 60 sec ke andar dobara aaye to ignore (refresh / double click)
  const dup = db.data.activity.some((a) => a.userId === userId && a.type === type && a.text === text && now - Date.parse(a.at) < 60000);
  if (dup) return false;
  db.data.activity.push({ id: uuid(), userId, type, text, at: new Date(now).toISOString() });
  // Har user ke sirf last 300 events rakho
  const mine = db.data.activity.filter((a) => a.userId === userId);
  if (mine.length > 300) {
    const drop = new Set(mine.slice(0, mine.length - 300).map((a) => a.id));
    db.data.activity = db.data.activity.filter((a) => !drop.has(a.id));
  }
  return true;
}

// Ek customer ne site pe jo kuch bhi kiya, naye se purana
function buildTimeline(email, user) {
  const { bookings, consents, consultations } = collect(email);
  const ev = [];
  if (user) {
    const mine = (db.data.activity || []).filter((a) => a.userId === user.id);
    for (const a of mine) ev.push({ id: a.id, at: a.at, type: a.type, text: a.text });
    if (!mine.some((a) => a.type === 'signup')) ev.push({ id: 'signup', at: user.createdAt, type: 'signup', text: 'Created an account with Google' });
  }
  for (const b of bookings) {
    const note = b.status === 'cancelled' ? ' (cancelled)' : b.status === 'completed' ? ' (completed)' : '';
    ev.push({ id: `b-${b.id}`, at: b.createdAt, type: 'booking', text: `Booked ${b.serviceName} for ${b.date} at ${b.slot}${note}` });
  }
  for (const c of consents) ev.push({ id: `c-${c.id}`, at: c.createdAt, type: 'consent', text: 'Signed the facial consent form' });
  for (const c of consultations) ev.push({ id: `i-${c.id}`, at: c.createdAt, type: 'intake', text: 'Submitted the skin intake form' });
  return ev.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

// ── Public: Google se sign in ───────────────────────────────
export const googleLogin = async (req, res) => {
  const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Sign-in is not configured on the server' });
  }
  const credential = req.body?.credential;
  if (!credential || typeof credential !== 'string' || credential.length > 4000) {
    return res.status(400).json({ success: false, message: 'Missing Google credential' });
  }

  let p;
  try {
    const ticket = await new google.auth.OAuth2(clientId).verifyIdToken({ idToken: credential, audience: clientId });
    p = ticket.getPayload();
  } catch {
    return res.status(401).json({ success: false, message: 'Google sign-in failed. Please try again.' });
  }
  if (!p?.email || !p.email_verified) {
    return res.status(401).json({ success: false, message: 'Your Google email is not verified.' });
  }

  const email = norm(p.email);
  const now = new Date().toISOString();
  db.data.users ||= [];
  let user = db.data.users.find((u) => u.googleId === p.sub || u.email === email);
  if (!user) {
    user = {
      id: uuid(), googleId: p.sub, email,
      name: String(p.name || email.split('@')[0]).slice(0, 100),
      picture: p.picture || '', phone: '',
      createdAt: now, lastLoginAt: now, loginCount: 1,
    };
    db.data.users.push(user);
    logActivity(user.id, 'signup', 'Created an account with Google');
  } else {
    user.googleId = p.sub;
    user.picture = p.picture || user.picture || '';
    user.name = user.name || String(p.name || email.split('@')[0]).slice(0, 100);
    user.lastLoginAt = now;
    user.loginCount = (user.loginCount || 0) + 1;
    logActivity(user.id, 'login', 'Signed in');
  }
  await db.write();

  const token = jwt.sign({ uid: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, data: { token, user: publicUser(user) } });
};
// ── Customer: apna account + history ────────────────────────
export const getMe = (req, res) => {
  const u = req.user;
  const today = todayChicago();
  const { bookings } = collect(u.email);
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.date >= today).sort(byWhen);
  const past = bookings
    .filter((b) => !(b.status === 'confirmed' && b.date >= today))
    .sort((a, b) => byWhen(b, a))
    .slice(0, 20);

  const timeline = buildTimeline(u.email, u).filter((e) => e.type !== 'booking');
  const count = (t) => timeline.filter((e) => e.type === t).length;

  res.json({
    success: true,
    data: {
      user: publicUser(u),
      upcoming,
      past,
      timeline: timeline.slice(0, 200),
      counts: {
        signins: count('login') + count('signup'),
        quizzes: count('quiz'),
        bookings: bookings.length,
        forms: count('consent') + count('intake'),
      },
    },
  });
};

// Frontend se aane wala activity: sirf whitelist wale types, text server banata hai (user ka likha text kabhi nahi)
export const trackActivity = async (req, res) => {
  const { type, data } = req.body || {};
  let text = null;
  if (type === 'quiz' && QUIZ_NAMES[data?.result]) text = `Took the Skin Quiz. Result: ${QUIZ_NAMES[data.result]}`;
  else if (type === 'book_click' && typeof data?.service === 'string') text = `Clicked Book on ${data.service.trim().slice(0, 80)}`;
  else if (type === 'booking_page') text = 'Opened the booking page';
  if (!text) return res.status(400).json({ success: false, message: 'Unknown activity' });
  if (logActivity(req.user.id, type, text)) await db.write();
  res.json({ success: true });
};

// ── Customer: apni booking khud cancel kare ─────────────────
export const cancelMyBooking = async (req, res) => {
  const b = (db.data.bookings || []).find((x) => x.id === req.params.id);
  if (!b || norm(b.email) !== norm(req.user.email)) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  if (b.status === 'cancelled') return res.status(400).json({ success: false, message: 'This is already cancelled' });
  if (b.status !== 'confirmed') return res.status(400).json({ success: false, message: 'This appointment cannot be cancelled' });
  if (isPast(b.date, b.slot)) return res.status(400).json({ success: false, message: 'That time has already passed' });

  b.status = 'cancelled';
  b.updatedAt = new Date().toISOString();

  try {
    if (b.calendarEventId) { await deleteMeetEvent(b.calendarEventId); b.calendarEventId = ''; }
  } catch (e) { console.error('Calendar sync failed:', e.message); }

  logActivity(req.user.id, 'cancel', `Cancelled ${b.serviceName} on ${b.date} at ${b.slot}`);
  await db.write();

  if (b.email) {
    sendMail({ to: b.email, ...cancellationEmail({ ...b, duration: durationOf(db.data, b) }) }).catch(() => {});
  }
  res.json({ success: true, data: b });
};

export const updateMe = async (req, res) => {
  const name = String(req.body?.name ?? req.user.name).trim().slice(0, 100);
  const phone = String(req.body?.phone ?? req.user.phone ?? '').trim().slice(0, 30);
  if (!name) return res.status(400).json({ success: false, message: 'Name cannot be empty' });
  req.user.name = name;
  req.user.phone = phone;
  await db.write();
  res.json({ success: true, data: publicUser(req.user) });
};

// ── Admin: saare customers + unhone kya kya kiya ────────────
export const getCustomersAdmin = (req, res) => {
  const today = todayChicago();
  const emails = new Map(); // email -> user | null (guest)
  for (const u of db.data.users || []) emails.set(norm(u.email), u);
  for (const b of db.data.bookings || []) {
    if (b.status === 'pending-payment') continue;
    if (!emails.has(norm(b.email))) emails.set(norm(b.email), null);
  }

  const list = [...emails.entries()].map(([email, u]) => {
    const { bookings, consents, consultations } = collect(email);
    const sorted = [...bookings].sort(byWhen);
    const next = sorted.find((b) => b.status === 'confirmed' && b.date >= today);
    const events = buildTimeline(email, u);

    return {
      email,
      name: u?.name || bookings[0]?.name || email,
      phone: u?.phone || bookings.find((b) => b.phone)?.phone || '',
      picture: u?.picture || '',
      registered: !!u,
      createdAt: u?.createdAt || null,
      lastLoginAt: u?.lastLoginAt || null,
      loginCount: u?.loginCount || 0,
      stats: {
        bookings: bookings.length,
        upcoming: bookings.filter((b) => b.status === 'confirmed' && b.date >= today).length,
        completed: bookings.filter((b) => b.status === 'completed').length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
        spent: bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + (b.price || 0), 0),
        consents: consents.length,
        intakes: consultations.length,
      },
      next: next ? { serviceName: next.serviceName, date: next.date, slot: next.slot } : null,
      lastActivity: events[0]?.at || null,
      events: events.slice(0, 40),
    };
  }).sort((a, b) => String(b.lastActivity || '').localeCompare(String(a.lastActivity || '')));

  res.json({ success: true, data: list });
};