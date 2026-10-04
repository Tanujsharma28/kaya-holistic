const ADDRESS = '1567 Sherman Avenue, Evanston, IL 60201';
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pretty = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const shell = (title, intro, rows, note) => `<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e6ddd0;border-radius:14px;overflow:hidden">
<tr><td style="background:#241a13;padding:24px 30px;color:#fff"><div style="font-family:Georgia,serif;font-size:21px">Kaya Holistic Spa</div>
<div style="font-size:12px;color:#c89b5c;margin-top:4px">Evanston, Illinois</div></td></tr>
<tr><td style="padding:30px">
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:0 0 10px;color:#2b2016">${title}</h1>
<p style="color:#5c4f41;line-height:1.6;margin:0 0 18px">${intro}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows
  .map(([k, v]) => `<tr><td style="padding:9px 0;color:#8a7d6e;border-bottom:1px solid #eee3d3;width:34%">${k}</td><td style="padding:9px 0;color:#2b2016;font-weight:600;border-bottom:1px solid #eee3d3">${v}</td></tr>`)
  .join('')}</table>
<p style="color:#5c4f41;font-size:14px;line-height:1.6;margin:20px 0 0">${note}</p>
</td></tr>
<tr><td style="background:#faf7f2;padding:16px 30px;font-size:12px;color:#8a7d6e;border-top:1px solid #e6ddd0">${ADDRESS} &middot; 847-571-1910</td></tr>
</table></td></tr></table></body></html>`;

export const rescheduleEmail = (b, prev) => ({
  subject: `Your appointment has been rescheduled: ${b.serviceName}`,
  html: shell(
    'Your appointment has moved',
    `Hi ${esc(b.name)}, we have updated your appointment. Your new time is below.`,
    [
      ['Service', esc(b.serviceName)],
      ['New date', esc(pretty(b.date))],
      ['New time', esc(b.slot)],
      ['Previously', `<span style="text-decoration:line-through;color:#8a7d6e;font-weight:400">${esc(pretty(prev.date))}, ${esc(prev.slot)}</span>`],
      ['Reference', esc(b.ref)],
    ],
    'This time does not work for you? Please call 847-571-1910 and we will find another one.'
  ),
});

export const cancellationEmail = (b) => ({
  subject: `Your appointment has been cancelled: ${b.serviceName}`,
  html: shell(
    'Your appointment is cancelled',
    `Hi ${esc(b.name)}, your appointment has been cancelled.`,
    [
      ['Service', esc(b.serviceName)],
      ['Date', esc(pretty(b.date))],
      ['Time', esc(b.slot)],
      ['Reference', esc(b.ref)],
    ],
    'You are welcome to book a new time on our website, or call 847-571-1910.'
  ),
});

const joinButton = (link) =>
  `<a href="${esc(link)}" style="display:inline-block;background:#a67c52;color:#fff;text-decoration:none;font-weight:600;padding:13px 28px;border-radius:99px">Join Google Meet</a>
   <p style="font-size:12px;color:#8a7d6e;margin:12px 0 0">Or copy this link: ${esc(link)}</p>`;

const sessionRows = (b) => [
  ['Service', esc(b.serviceName)],
  ['Date', esc(pretty(b.date))],
  ['Time', `${esc(b.slot)} (Central Time)`],
  ['Format', 'Video call (Google Meet)'],
  ['Reference', esc(b.ref)],
];

export const meetLinkEmail = (b, link) => ({
  subject: `Your video link: ${b.serviceName} on ${pretty(b.date)}`,
  html: shell(
    'Your video link is ready',
    `Hi ${esc(b.name)}, here is the link for your online session. Please join a minute early.`,
    sessionRows(b),
    joinButton(link)
  ),
});

export const reminderEmail = (b, link) => ({
  subject: `Starting in 30 minutes: ${b.serviceName}`,
  html: shell(
    'Your session starts in 30 minutes',
    `Hi ${esc(b.name)}, a quick reminder about your online session with Puja.`,
    sessionRows(b),
    joinButton(link)
  ),
});