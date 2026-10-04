import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { sendMail } from './mailer.js';

const dbPath = path.resolve('db.json');

export const initReminderCron = () => {
  // Har 1 minute par check karo
  cron.schedule('* * * * *', async () => {
    try {
      if (!fs.existsSync(dbPath)) return;
      const data = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(data);

      const now = new Date();

      db.bookings = await Promise.all(db.bookings.map(async (booking) => {
        // Sirf online, approved aur jinhe reminder nahi gaya unhe target karo
        if (booking.mode === 'online' && booking.status === 'Approved' && !booking.reminderSent) {
          
          // Booking date + time combine karke Date object banao
          const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
          const diffInMinutes = Math.floor((bookingDateTime - now) / (1000 * 60));

          // Agar meeting exact 30 mins baad hai (25 se 31 min ke bich safety margin)
          if (diffInMinutes >= 0 && diffInMinutes <= 30) {
            console.log(`⏰ Sending 30-min reminder to: ${booking.email}`);

            const reminderHtml = `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #2c2a29;">
                <h2 style="color: #b8973c;">Starting in 30 Minutes! ⏳</h2>
                <p>Dear ${booking.name},</p>
                <p>Your online skincare consultation with <strong>Kaya Holistic Spa</strong> is starting in 30 minutes.</p>
                <div style="background-color: #f9f8f6; padding: 15px; border-left: 4px solid #b8973c; margin: 20px 0;">
                  <p style="margin:0; font-weight: bold;">🎥 Direct Google Meet Link:</p>
                  <a href="${booking.meetLink}" style="color: #b8973c; font-size: 16px; font-weight: bold;">Click Here to Join Meeting</a>
                </div>
                <p>See you online soon!</p>
              </div>
            `;

            try {
              await sendMail({
                to: booking.email,
                subject: `REMINDER: Your Consultation Starts in 30 Mins!`,
                html: reminderHtml
              });
              booking.reminderSent = true; // Mark as sent
            } catch (err) {
              console.error("Reminder mail error:", err);
            }
          }
        }
        return booking;
      }));

      // Update db.json
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    } catch (error) {
      console.error("Cron Error:", error);
    }
  });

  console.log("⏰ 30-Minute Reminder Cron Scheduler Initialized!");
};