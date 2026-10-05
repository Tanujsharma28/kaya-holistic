const ADDRESS = '1567 Sherman Avenue, Evanston, IL 60201';
const PHONE = '847-571-1910';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pretty = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const shell = (title, badgeText, intro, rows, callToAction = '') => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f2;padding:32px 12px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e6ddd0;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(44,37,32,0.06);">
        
        <!-- HEADER -->
        <tr>
          <td align="center" style="background-color:#241a13;padding:34px 30px;text-align:center;">
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c89b5c;font-weight:700;">Kaya Holistic Spa &middot; Evanston, IL</div>
            <div style="font-family:Georgia,serif;font-size:26px;color:#ffffff;margin-top:8px;font-weight:400;letter-spacing:0.5px;">${esc(title)}</div>
            ${badgeText ? `<div style="display:inline-block;margin-top:12px;background:rgba(200,155,92,0.2);border:1px solid #c89b5c;color:#e6cbab;font-size:11px;padding:4px 14px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">${esc(badgeText)}</div>` : ''}
            <div style="width:40px;height:2px;background:#c89b5c;margin:16px auto 0;"></div>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding:32px 36px 12px;">
            <p style="margin:0 0 10px;font-size:15px;color:#5c4f41;line-height:1.7;">${intro}</p>
          </td>
        </tr>

        <!-- DETAILS TABLE -->
        <tr>
          <td style="padding:0 36px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf8f4;border:1px solid #eee3d3;border-radius:12px;padding:8px 18px;">
              ${rows
                .map(
                  ([k, v]) => `<tr>
                    <td style="padding:10px 0;color:#8a7d6e;border-bottom:1px solid #efe5d7;width:34%;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">${esc(k)}</td>
                    <td style="padding:10px 0;color:#2b2016;font-weight:600;font-size:14px;border-bottom:1px solid #efe5d7;">${v}</td>
                  </tr>`
                )
                .join('')}
            </table>
          </td>
        </tr>

        <!-- CALL TO ACTION -->
        ${callToAction ? `<tr><td style="padding:10px 36px 28px;text-align:center;">${callToAction}</td></tr>` : ''}

        <!-- FOOTER -->
        <tr>
          <td align="center" style="background-color:#241a13;padding:24px 30px;text-align:center;color:#d9cdb8;">
            <p style="margin:0 0 6px;font-size:13px;color:#e6cbab;">Questions or need to reach us? Call <a href="tel:${PHONE}" style="color:#c89b5c;text-decoration:none;font-weight:600;">${PHONE}</a></p>
            <p style="margin:0;font-size:11px;color:#a89a84;">${ADDRESS} &middot; Licensed Esthetician Puja Gupta &middot; Closed Sundays</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

export const bookingConfirmationEmail = (b) => {
  const isOnline = (b.mode || b.type || '').toLowerCase().includes('online') || (b.mode || b.type || '').toLowerCase().includes('video');
  const meetLink = b.meetLink || process.env.GOOGLE_MEET_LINK || '';

  const cta = isOnline
    ? meetLink
      ? `<a href="${esc(meetLink)}" style="display:inline-block;background:#3b3027;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:13px 30px;border-radius:99px;box-shadow:0 4px 14px rgba(59,48,39,0.2);">🎥 Join Google Meet Session</a>
         <p style="margin:12px 0 0;font-size:12px;color:#8a7d6e;">Direct Link: <a href="${esc(meetLink)}" style="color:#7c5c38;">${esc(meetLink)}</a></p>`
      : `<p style="margin:0;font-size:13px;color:#7c5c38;">Your Google Meet video link will be sent to you prior to your appointment.</p>`
    : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}" style="display:inline-block;background:#3b3027;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:13px 28px;border-radius:99px;">📍 Get Directions to Evanston Spa</a>
       <p style="margin:12px 0 0;font-size:12px;color:#8a7d6e;">Please arrive 5 minutes early with a clean, makeup-free face.</p>`;

  return {
    subject: `Booking Confirmed: ${b.serviceName || 'Spa Treatment'} on ${pretty(b.date)}`,
    html: shell(
      'Appointment Confirmed',
      'Confirmed Session',
      `Dear <b>${esc(b.name)}</b>,<br><br>Thank you for choosing <b>Kaya Holistic Spa</b>. Your appointment has been officially confirmed. We look forward to welcoming you!`,
      [
        ['Service', esc(b.serviceName || 'Treatment')],
        ['Date', esc(pretty(b.date))],
        ['Time', `${esc(b.slot)} (Central Time)`],
        ['Format', isOnline ? 'Video Call (Google Meet)' : 'In-Person Evanston Studio'],
        ['Price', `$${b.price}`],
        ['Reference', esc(b.ref || String(b.id || '').slice(0, 8).toUpperCase())],
      ],
      cta
    ),
  };
};

export const rescheduleEmail = (b, prev = {}) => {
  const isOnline = (b.mode || '').toLowerCase().includes('online') || (b.mode || '').toLowerCase().includes('video');
  const meetLink = b.meetLink || process.env.GOOGLE_MEET_LINK || '';

  const cta = isOnline && meetLink
    ? `<a href="${esc(meetLink)}" style="display:inline-block;background:#3b3027;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:13px 30px;border-radius:99px;">🎥 Join Google Meet Session</a>`
    : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}" style="display:inline-block;border:1.5px solid #a67c52;color:#7c5c38;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 26px;border-radius:99px;">Get Directions</a>`;

  return {
    subject: `Appointment Rescheduled: ${b.serviceName || 'Spa Treatment'}`,
    html: shell(
      'Appointment Rescheduled',
      'Updated Time',
      `Dear <b>${esc(b.name)}</b>,<br><br>Your appointment with Puja Gupta at Kaya Holistic Spa has been rescheduled. Your updated time is detailed below.`,
      [
        ['Service', esc(b.serviceName || 'Treatment')],
        ['New Date', esc(pretty(b.date))],
        ['New Time', `${esc(b.slot)} (Central Time)`],
        prev.date ? ['Previous Time', `<span style="text-decoration:line-through;color:#8a7d6e;">${esc(pretty(prev.date))}, ${esc(prev.slot)}</span>`] : null,
        ['Format', isOnline ? 'Video Call (Google Meet)' : 'In-Person Studio'],
        ['Reference', esc(b.ref || String(b.id || '').slice(0, 8).toUpperCase())],
      ].filter(Boolean),
      cta
    ),
  };
};

export const cancellationEmail = (b) => ({
  subject: `Appointment Cancelled: ${b.serviceName || 'Spa Treatment'}`,
  html: shell(
    'Appointment Cancelled',
    'Status: Cancelled',
    `Dear <b>${esc(b.name)}</b>,<br><br>Your appointment for <b>${esc(b.serviceName || 'Spa Treatment')}</b> scheduled for ${esc(pretty(b.date))} at ${esc(b.slot)} has been cancelled.`,
    [
      ['Service', esc(b.serviceName || 'Treatment')],
      ['Original Date', esc(pretty(b.date))],
      ['Original Time', esc(b.slot)],
      ['Reference', esc(b.ref || String(b.id || '').slice(0, 8).toUpperCase())],
    ],
    `<p style="margin:0;font-size:13px;color:#7c5c38;">If you wish to reschedule or book a new treatment, please visit our website or call us directly at <b>${PHONE}</b>.</p>`
  ),
});

export const meetLinkEmail = (b, link) => ({
  subject: `Your Google Meet Link: ${b.serviceName || 'Video Session'} on ${pretty(b.date)}`,
  html: shell(
    'Google Meet Video Link',
    'Video Session Ready',
    `Dear <b>${esc(b.name)}</b>,<br><br>Here is your official Google Meet video link for your upcoming session with Puja Gupta.`,
    [
      ['Service', esc(b.serviceName || 'Session')],
      ['Date', esc(pretty(b.date))],
      ['Time', `${esc(b.slot)} (Central Time)`],
      ['Format', 'Video Call (Google Meet)'],
      ['Reference', esc(b.ref || String(b.id || '').slice(0, 8).toUpperCase())],
    ],
    `<a href="${esc(link)}" style="display:inline-block;background:#3b3027;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:14px 32px;border-radius:99px;box-shadow:0 4px 14px rgba(59,48,39,0.25);">🎥 Join Google Meet Session</a>
     <p style="margin:12px 0 0;font-size:12px;color:#8a7d6e;">Direct Link: <a href="${esc(link)}" style="color:#7c5c38;">${esc(link)}</a></p>`
  ),
});

export const reminderEmail = (b, link) => ({
  subject: `Starting in 30 minutes: ${b.serviceName || 'Spa Session'}`,
  html: shell(
    'Reminder: 30 Minutes Away',
    'Upcoming Session',
    `Dear <b>${esc(b.name)}</b>,<br><br>A friendly reminder that your online session with Puja Gupta begins in 30 minutes!`,
    [
      ['Service', esc(b.serviceName || 'Session')],
      ['Date', esc(pretty(b.date))],
      ['Time', `${esc(b.slot)} (Central Time)`],
      ['Reference', esc(b.ref || String(b.id || '').slice(0, 8).toUpperCase())],
    ],
    `<a href="${esc(link)}" style="display:inline-block;background:#3b3027;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:14px 32px;border-radius:99px;">🎥 Join Google Meet Session Now</a>`
  ),
});
export const ownerMeetLinkEmail = (b, link) => ({
  subject: `Meet link ready: ${b.name} — ${b.serviceName} at ${b.slot}`,
  html: shell(
    'Google Meet link generated',
    `Is online session ka auto-generated video link ban gaya hai aur client ko email ho chuka hai.`,
    [...sessionRows(b), ['Client', `${esc(b.name)} (${esc(b.email)})`]],
    joinButton(link)
  ),
});