import { shell } from './adminEmails.js';
import { toMinutes } from './slots.js';
import { profileFor } from './staffProfiles.js';

const ADDRESS = '1567 Sherman Avenue, Evanston, IL 60201';
const PHONE = '847-571-1910';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pretty = (iso) => {
  const d = new Date(String(iso) + 'T12:00:00');
  return Number.isNaN(d.getTime())
    ? esc(iso)
    : d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const label = (m) => {
  const h = Math.floor(m / 60) % 24;
  const mi = m % 60;
  return `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const timeRange = (b) => {
  const s = toMinutes(b.slot);
  return s === null ? esc(b.slot) : `${esc(b.slot)} to ${label(s + (Number(b.duration) || 0))}`;
};

const button = (href, text) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#7c5c38;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:30px;font-size:14px;font-weight:600;">${esc(text)}</a>`;

const isOnline = (b) =>
  /online|video|virtual/.test(String(b.mode || '').toLowerCase()) || b.type === 'consultation';

// 24 ghante pehle ka reminder
export const reminder24Email = (b, { needsConsent = false } = {}) => {
  const online = isOnline(b);
  const where = online
    ? b.meetLink
      ? `Video call &middot; <a href="${esc(b.meetLink)}" style="color:#7c5c38;">Join link</a>`
      : 'Video call. Your link will be emailed before the session.'
    : esc(ADDRESS);

  const shortDate = new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const consentUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/consent?booking=${b.id}` : '';
  const consentBlock = needsConsent && !online && consentUrl
    ? `<p style="margin:0 0 14px;font-size:14px;color:#5c4f41;line-height:1.6;">Please fill out your facial consent form before you arrive. It takes about two minutes.</p>${button(consentUrl, 'Fill out consent form')}`
    : '';

  const cta = `${consentBlock}<p style="margin:${consentBlock ? '18px' : '0'} 0 0;font-size:13px;color:#8a7d6e;line-height:1.6;">Need to reschedule or cancel? Please call ${PHONE} as early as you can.</p>`;

  return {
    subject: `Reminder: ${b.serviceName} on ${shortDate} at ${b.slot}`,
    html: shell(
      'See You Soon',
      'Appointment Reminder',
      `Dear <b>${esc(b.name)}</b>,<br><br>This is a friendly reminder of your upcoming appointment with us.`,
      [
        ['Service', esc(b.serviceName)],
        ['Date', pretty(b.date)],
        ['Time', timeRange(b)],
        ...(b.staff ? [['With', `${esc(profileFor(b.staff).fullName)}, ${esc(profileFor(b.staff).role)}`]] : []),
        ['Where', where],
        ...(b.ref ? [['Reference', esc(b.ref)]] : []),
      ],
      cta
    ),
  };
};

// Visit ke baad review request
export const reviewRequestEmail = (b, url) => ({
  subject: 'How was your visit at Kaya Holistic Spa?',
  html: shell(
    'Thank You',
    'We Value Your Feedback',
    `Dear <b>${esc(b.name)}</b>,<br><br>Thank you for visiting Kaya Holistic Spa. If you enjoyed your ${esc(b.serviceName)}, a short Google review would mean a lot to us and helps other skincare lovers find us.`,
    [
      ['Service', esc(b.serviceName)],
      ['Visit date', pretty(b.date)],
    ],
    `${button(url, 'Leave a Google review')}<p style="margin:16px 0 0;font-size:13px;color:#8a7d6e;line-height:1.6;">It takes less than a minute. If anything was not right, just reply to this email and we will make it better.</p>`
  ),
});