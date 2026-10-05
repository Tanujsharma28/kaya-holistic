import { google } from 'googleapis';

const TZ = 'America/Chicago';

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:4000'
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

function slotToMinutes(slot) {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i.exec(String(slot));
  if (!m) throw new Error(`Invalid slot: ${slot}`);
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + parseInt(m[2], 10);
}

const toLocalISO = (date, mins) =>
  `${date}T${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:00`;

export async function createMeetEvent(booking) {
  const calendar = google.calendar({ version: 'v3', auth: getOAuthClient() });

  const startMin = slotToMinutes(booking.slot);
  const endMin = startMin + (Number(booking.duration) || 30);

  const res = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    resource: {
      summary: `${booking.serviceName} - ${booking.name}`,
      description: `Kaya Holistic Spa online consultation.\nClient: ${booking.name} (${booking.email})`,
      start: { dateTime: toLocalISO(booking.date, startMin), timeZone: TZ },
      end: { dateTime: toLocalISO(booking.date, endMin), timeZone: TZ },
      attendees: [{ email: booking.email }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 30 },
          { method: 'popup', minutes: 30 },
        ],
      },
      conferenceData: {
        createRequest: { requestId: String(booking.id), conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
    },
  });

  if (!res.data.hangoutLink) throw new Error('Google did not return a Meet link');
  return res.data.hangoutLink;
}