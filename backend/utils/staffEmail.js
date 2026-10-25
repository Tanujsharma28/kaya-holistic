import { profileFor } from './staffProfiles.js';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const staffEmailBlock = (staffName) => {
  const p = profileFor(staffName);
  const chips = [p.experience, ...p.specialties]
    .map((x) => `<span style="display:inline-block;margin:3px 4px 0 0;padding:4px 11px;border-radius:99px;background:#f1e8da;color:#7c5c38;font-size:12px;font-weight:600">${esc(x)}</span>`)
    .join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e6ddd0;border-radius:12px"><tr><td style="padding:18px 22px">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7c5c38;font-weight:700">Your esthetician</p>
    <p style="margin:0;font-family:Georgia,serif;font-size:19px;color:#241a13">${esc(p.fullName)}</p>
    <p style="margin:2px 0 8px;font-size:13px;color:#8a7d6e">${esc(p.role)}</p>
    <p style="margin:0 0 6px;font-size:14px;color:#5c4f41;line-height:1.6">${esc(p.bio)}</p>
    <div>${chips}</div>
  </td></tr></table>`;
};