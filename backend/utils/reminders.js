import { db } from '../config/db.js';
import { sendMail } from './mailer.js';
import { toMinutes, durationOf } from './slots.js';
import { reminderEmail } from './adminEmails.js';

const TZ = 'America/Chicago';
const LEAD_MIN = 30;

function chicagoNow() {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: TZ });
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour').value) % 24;
  const m = Number(parts.find((p) => p.type === 'minute').value);
  return { date, minutes: h * 60 + m };
}

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const { date, minutes } = chicagoNow();
    let changed = false;

    for (const b of db.data.bookings) {
      if (b.status !== 'confirmed' || b.reminderSent || !b.email || b.date !== date) continue;
      if (b.mode !== 'virtual' && b.mode !== 'online') continue;
      const start = toMinutes(b.slot);
      if (start === null) continue;

      const diff = start - minutes;
      if (diff > LEAD_MIN || diff < -10) continue;
      // just booked? the confirmation email already has the link
      if (Date.now() - new Date(b.createdAt).getTime() < 10 * 60 * 1000) continue;

      const link = b.meetLink || process.env.GOOGLE_MEET_LINK;
      if (!link) continue;

      const full = { ...b, duration: durationOf(db.data, b), ref: String(b.id).slice(0, 8).toUpperCase() };
      const ok = await sendMail({ to: b.email, ...reminderEmail(full, link) });
      if (!ok) console.error('Reminder email failed for', full.ref);
      b.reminderSent = true;
      changed = true;
    }
    if (changed) await db.write();
  } catch (e) {
    console.error('Reminder job error:', e.message);
  } finally {
    running = false;
  }
}

export function startReminders() {
  setInterval(tick, 60 * 1000);
  tick();
}