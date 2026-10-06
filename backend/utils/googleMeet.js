import { google } from 'googleapis';

const TZ = 'America/Chicago';
const calId = () => process.env.GOOGLE_CALENDAR_ID || 'primary';

function getCalendar() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:4000'
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth: client });
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

const timing = (b) => {
  const s = slotToMinutes(b.slot);
  const e = s + (Number(b.duration) || 30);
  return {
    start: { dateTime: toLocalISO(b.date, s), timeZone: TZ },
    end: { dateTime: toLocalISO(b.date, e), timeZone: TZ },
  };
};

// Returns { link, eventId }
export async function createMeetEvent(booking) {
  const res = await getCalendar().events.insert({
    calendarId: calId(),
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    resource: {
      summary: `${booking.serviceName} - ${booking.name}`,
      description: `Kaya Holistic Spa online consultation.\nClient: ${booking.name} (${booking.email})`,
      ...timing(booking),
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
  return { link: res.data.hangoutLink, eventId: res.data.id };
}

// Reschedule par: same event, naya time. Meet link wahi rehta hai.
export async function updateMeetEvent(booking) {
  if (!booking.calendarEventId) return;
  await getCalendar().events.patch({
    calendarId: calId(),
    eventId: booking.calendarEventId,
    sendUpdates: 'all',
    resource: timing(booking),
  });
}

// Cancel / delete par: event hata do (client ko Google cancel notice bhejta hai)
export async function deleteMeetEvent(eventId) {
  if (!eventId) return;
  try {
    await getCalendar().events.delete({ calendarId: calId(), eventId, sendUpdates: 'all' });
  } catch (e) {
    const code = e?.code || e?.response?.status;
    if (code === 404 || code === 410) return; // pehle hi hat chuka hai
    throw e;
  }
}