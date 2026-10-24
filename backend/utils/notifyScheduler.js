import cron from 'node-cron';
import { db } from '../config/db.js';
import { sendMail } from './mailer.js';
import { toMinutes, durationOf, typeOf } from './slots.js';
import { getBusiness } from './settings.js';
import { reminder24Email, reviewRequestEmail } from './notifyEmails.js';
import { audit } from './audit.js';

const SYSTEM = { admin: { email: 'system' } };
const TZ = 'America/Chicago';
const MAX_TRIES = 3;
const DAY = 86400000;
let running = false;

const emailKey = (e = '') => String(e).trim().toLowerCase();
const statusOf = (b) => {
  const s = String(b.status || '').toLowerCase();
  return s === 'approved' ? 'confirmed' : s;
};
const dayDiff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY);

const chicagoClock = () => {
  const now = new Date();
  const today = now.toLocaleDateString('en-CA', { timeZone: TZ });
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now);
  const nowMin = (Number(parts.find((p) => p.type === 'hour').value) % 24) * 60 + Number(parts.find((p) => p.type === 'minute').value);
  return { today, nowMin };
};

// Booking ke andar sirf tab likhte hain jab email bhejni ho (data saaf rahe)
const peek = (b, field, key) => (b[field] && b[field].key === key ? b[field] : { key, at: '', tries: 0 });

// Pehle flag lagao (double email na jaye), phir bhejo. Fail ho to 3 koshish tak dobara
const attempt = async (b, field, key, send) => {
  const st = peek(b, field, key);
  st.tries += 1;
  st.at = new Date().toISOString();
  b[field] = st;
  await db.write();
  const ok = !!(await send());
  if (!ok) {
    st.at = '';
    await db.write();
  }
  return ok;
};

const tick = async () => {
  const { reminders, reviews, reviewUrl, reviewDelayHours } = getBusiness().notifications;
  if (!reminders && !(reviews && reviewUrl)) return;

  const { today, nowMin } = chicagoClock();
  if (nowMin < 9 * 60 || nowMin > 20 * 60) return; // raat me email nahi

  for (const b of db.data.bookings) {
    if (!b.email) continue;
    const st = statusOf(b);
    const start = toMinutes(b.slot);
    if (start === null) continue;
    const days = dayDiff(today, b.date);

    // 1) Appointment se 24 ghante pehle reminder
    if (reminders && st === 'confirmed') {
      const key = `${b.date} ${b.slot}`;
      const r = peek(b, 'reminder24', key);
      const minsUntil = days * 1440 + start - nowMin;
      const sinceCreated = (Date.now() - new Date(b.createdAt || 0).getTime()) / 60000;
      if (!r.at && r.tries < MAX_TRIES && minsUntil >= 180 && minsUntil <= 1440 && sinceCreated >= 360) {
        const full = { ...b, duration: durationOf(db.data, b), type: typeOf(b), ref: String(b.id).slice(0, 8).toUpperCase() };
        const needsConsent =
          full.type === 'visit' &&
          !(db.data.consents || []).some((c) => c.bookingId === b.id || emailKey(c.email) === emailKey(b.email));
        const ok = await attempt(b, 'reminder24', key, () =>
          sendMail({ to: b.email, ...reminder24Email(full, { needsConsent }) })
        );
        if (ok) {
          audit(SYSTEM, 'notify.reminder', `Reminder emailed to ${b.name} for ${b.date} ${b.slot}`);
          await db.write();
        }
      }
    }

    // 2) Completed visit ke baad review request
    if (reviews && reviewUrl && st === 'completed') {
      const rr = peek(b, 'reviewReq', 'v1');
      const minsSinceEnd = -(days * 1440 + start + durationOf(db.data, b) - nowMin);
      if (!rr.at && rr.tries < MAX_TRIES && minsSinceEnd >= reviewDelayHours * 60 && days >= -2 && days <= 0) {
        // Is client ko pichhle 30 din me pooch chuke hain to dobara nahi
        const asked = db.data.bookings.some(
          (o) =>
            o.id !== b.id &&
            emailKey(o.email) === emailKey(b.email) &&
            o.reviewReq?.at &&
            !o.reviewReq.skipped &&
            Date.now() - new Date(o.reviewReq.at).getTime() < 30 * DAY
        );
        if (asked) {
          b.reviewReq = { key: 'v1', at: new Date().toISOString(), tries: 1, skipped: true };
          await db.write();
          continue;
        }
        const ok = await attempt(b, 'reviewReq', 'v1', () => sendMail({ to: b.email, ...reviewRequestEmail(b, reviewUrl) }));
        if (ok) {
          audit(SYSTEM, 'notify.review', `Review request emailed to ${b.name} for ${b.date} ${b.slot}`);
          await db.write();
        }
      }
    }
  }
};

export const initNotifyCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    if (running) return;
    running = true;
    try {
      await tick();
    } catch (e) {
      console.error('Notify cron error:', e.message);
    } finally {
      running = false;
    }
  });
  console.log('✉️  Reminder and review email scheduler started');
};