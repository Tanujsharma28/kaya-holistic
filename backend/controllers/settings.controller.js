import { db } from '../config/db.js';
import { getBusiness, STAFF, SLOT_STEPS, REVIEW_DELAYS, hoursSummary, upcomingClosures } from '../utils/settings.js';
import { audit } from '../utils/audit.js';
import { sendMail } from '../utils/mailer.js';
import { reminder24Email, reviewRequestEmail } from '../utils/notifyEmails.js';
const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const getSettingsAdmin = (req, res) => res.json({ success: true, data: getBusiness() });

export const saveSettingsAdmin = async (req, res) => {
  const body = req.body || {};
  const cur = getBusiness();
  const next = { ...cur };

  if (body.ownerName !== undefined) {
    const n = String(body.ownerName).trim();
    if (!n || n.length > 40) return bad(res, 'Owner name is required (max 40 characters)');
    next.ownerName = n;
  }

  if (body.slotMinutes !== undefined) {
    const s = Number(body.slotMinutes);
    if (!SLOT_STEPS.includes(s)) return bad(res, 'Appointment interval must be 15, 30, 45 or 60 minutes');
    next.slotMinutes = s;
  }

  if (body.hours !== undefined) {
    if (!body.hours || typeof body.hours !== 'object') return bad(res, 'Invalid opening hours');
    const hours = {};
    for (let d = 0; d < 7; d++) {
      const h = body.hours[d];
      if (!h || typeof h !== 'object') return bad(res, 'Invalid opening hours');
      if (!HHMM.test(String(h.from)) || !HHMM.test(String(h.to))) return bad(res, 'Please use valid opening and closing times');
      const open = !!h.open;
            if (!STAFF.includes(h.staff)) return bad(res, `${DAYS[d]}: choose who is working`);
      hours[d] = { open, from: h.from, to: h.to, staff: h.staff };
    }
    next.hours = hours;
  }

  if (body.closedDates !== undefined) {
    if (!Array.isArray(body.closedDates) || body.closedDates.length > 200) return bad(res, 'Invalid closed dates');
    const seen = new Set();
    const list = [];
    for (const c of body.closedDates) {
      const date = String(c?.date || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T12:00:00').getTime())) {
        return bad(res, 'Invalid closed date');
      }
      if (seen.has(date)) continue;
      seen.add(date);
      list.push({ date, reason: String(c?.reason || '').trim().slice(0, 60) });
    }
    next.closedDates = list.sort((a, b) => a.date.localeCompare(b.date));
  }
    if (body.timeOff !== undefined) {
    if (!Array.isArray(body.timeOff) || body.timeOff.length > 300) return bad(res, 'Invalid time off');
    const list = [];
    for (const t of body.timeOff) {
      const date = String(t?.date || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T12:00:00').getTime())) return bad(res, 'Invalid time-off date');
      if (!HHMM.test(String(t?.from)) || !HHMM.test(String(t?.to)) || t.from >= t.to) return bad(res, 'Time off: "to" must be after "from"');
      const staff = (next.hours || cur.hours)[new Date(date + 'T12:00:00').getDay()].staff;
      list.push({
        id: String(t.id || `${date}-${t.from}-${Date.now()}-${list.length}`).slice(0, 60),
        date, from: t.from, to: t.to, staff, reason: String(t?.reason || '').trim().slice(0, 60),
      });
    }
    next.timeOff = list.sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from));
  }

  if (body.notifications !== undefined) {
    const n = body.notifications;
    if (!n || typeof n !== 'object') return bad(res, 'Invalid email settings');
    const url = String(n.reviewUrl || '').trim();
    if (url && (!/^https:\/\/\S+$/.test(url) || url.length > 300)) return bad(res, 'The review link must start with https://');
    const delay = Number(n.reviewDelayHours);
    if (!REVIEW_DELAYS.includes(delay)) return bad(res, 'Choose when to send the review request');
    const reviews = !!n.reviews;
    if (reviews && !url) return bad(res, 'Add your Google review link before turning review requests on');
    next.notifications = { reminders: !!n.reminders, reviews, reviewUrl: url, reviewDelayHours: delay };
  }

  const changed = [];
  if (next.ownerName !== cur.ownerName) changed.push('owner name');
  if (next.slotMinutes !== cur.slotMinutes) changed.push(`interval (${next.slotMinutes} min)`);
  if (!same(next.hours, cur.hours)) changed.push('opening hours');
  if (!same(next.closedDates, cur.closedDates)) changed.push('closed dates');
  if (!same(next.notifications, cur.notifications)) changed.push('client emails');

  if (changed.length) {
    db.data.settings.business = next;
    audit(req, 'settings.update', `Updated ${changed.join(', ')}`);
    await db.write();
  }
  res.json({ success: true, data: getBusiness() });
};

// Test email: sirf admin ke apne email par jaati hai
export const sendTestNotification = async (req, res) => {
  const type = req.body?.type;
  const to = String(process.env.ADMIN_2FA_EMAIL || process.env.ADMIN_EMAIL || '').trim();
  if (!to) return bad(res, 'No admin email is configured on the server', 500);

  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const sample = {
    id: 'test', ref: 'TEST1234', name: 'Sample Client', email: to,
    serviceName: 'Express Facial', price: 75, date: tomorrow, slot: '2:00 PM',
    duration: 30, mode: 'in-person', type: 'visit',
  };

  let mail;
  if (type === 'reminder') {
    mail = reminder24Email(sample, { needsConsent: true });
  } else if (type === 'review') {
    const url = getBusiness().notifications.reviewUrl;
    if (!url) return bad(res, 'Save your Google review link first');
    mail = reviewRequestEmail(sample, url);
  } else {
    return bad(res, 'Unknown email type');
  }

  const sent = await sendMail({ to, ...mail, subject: `[Test] ${mail.subject}` });
  res.json({ success: true, emailed: !!sent, sentTo: to });
};

// Public: footer ke liye
export const getPublicHours = (req, res) =>
  res.json({ success: true, data: { lines: hoursSummary(), closures: upcomingClosures() } });