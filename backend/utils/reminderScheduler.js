import cron from 'node-cron';
import { db } from '../config/db.js';
import { sendMail, notifyOwner } from './mailer.js';
import { toMinutes, durationOf } from './slots.js';
import { meetLinkEmail, ownerMeetLinkEmail } from './adminEmails.js';
import { createMeetEvent } from './googleMeet.js';

const LEAD_MIN = 30;
let running = false;

export const initReminderCron = () => {
  cron.schedule('* * * * *', async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago', hour: 'numeric', minute: 'numeric', hour12: false,
      }).formatToParts(now);
      const nowMin = (Number(parts.find(p => p.type === 'hour').value) % 24) * 60
        + Number(parts.find(p => p.type === 'minute').value);

      for (const b of db.data.bookings) {
        if (b.mode !== 'online' || b.status !== 'confirmed' || b.date !== today || b.reminderSent) continue;
        const start = toMinutes(b.slot);
        if (start === null) continue;
        const dur = durationOf(db.data, b);
        const diff = start - nowMin;
        // 30 min pehle se session khatam hone tak (server down tha to bhi catch-up)
        if (diff > LEAD_MIN || diff < -dur) continue;

        if (!b.meetLink) {
          try {
            b.meetLink = await createMeetEvent({ ...b, duration: dur });
          } catch (err) {
            console.error('Meet link retry failed:', err.message);
            b.meetLink = process.env.GOOGLE_MEET_LINK || '';
          }
          if (!b.meetLink) continue;
        }

        console.log(`⏰ Sending reminder for booking ${b.id} (${b.email})`);
        b.reminderSent = true;
        b.meetLinkSent = true;
        await db.write();

        const full = { ...b, duration: dur, ref: String(b.id).slice(0, 8).toUpperCase() };
        await Promise.allSettled([
          sendMail({ to: b.email, ...meetLinkEmail(full, b.meetLink) }),
          notifyOwner(ownerMeetLinkEmail(full, b.meetLink)),
        ]);
      }
    } catch (error) {
      console.error('Reminder cron error:', error.message);
    } finally {
      running = false;
    }
  });

  console.log('⏰ Reminder scheduler shuru');
};