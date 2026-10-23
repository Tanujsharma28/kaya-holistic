import { db } from '../config/db.js';
import { getBusiness, SLOT_STEPS, hoursSummary, upcomingClosures } from '../utils/settings.js';
import { audit } from '../utils/audit.js';

const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const getSettingsAdmin = (req, res) => res.json({ success: true, data: getBusiness() });

export const saveSettingsAdmin = async (req, res) => {
  const body = req.body || {};
  const cur = getBusiness();
  const next = { ...cur };

  if (body.ownerName !== undefined) {
    const n = String(body.ownerName).trim();
    if (!n || n.length > 40) return bad(res, 'Owner name is required (max 40 characters)');
    next.ownerName = n;
  }

  if (body.slotMinutes !== undefined) {
    const s = Number(body.slotMinutes);
    if (!SLOT_STEPS.includes(s)) return bad(res, 'Appointment interval must be 15, 30, 45 or 60 minutes');
    next.slotMinutes = s;
  }

  if (body.hours !== undefined) {
    if (!body.hours || typeof body.hours !== 'object') return bad(res, 'Invalid opening hours');
    const hours = {};
    for (let d = 0; d < 7; d++) {
      const h = body.hours[d];
      if (!h || typeof h !== 'object') return bad(res, 'Invalid opening hours');
      if (!HHMM.test(String(h.from)) || !HHMM.test(String(h.to))) return bad(res, 'Please use valid opening and closing times');
      const open = !!h.open;
      if (open && h.from >= h.to) return bad(res, `${DAYS[d]}: closing time must be after opening time`);
      hours[d] = { open, from: h.from, to: h.to };
    }
    next.hours = hours;
  }

  if (body.closedDates !== undefined) {
    if (!Array.isArray(body.closedDates) || body.closedDates.length > 200) return bad(res, 'Invalid closed dates');
    const seen = new Set();
    const list = [];
    for (const c of body.closedDates) {
      const date = String(c?.date || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T12:00:00').getTime())) {
        return bad(res, 'Invalid closed date');
      }
      if (seen.has(date)) continue;
      seen.add(date);
      list.push({ date, reason: String(c?.reason || '').trim().slice(0, 60) });
    }
    next.closedDates = list.sort((a, b) => a.date.localeCompare(b.date));
  }

  const changed = [];
  if (next.ownerName !== cur.ownerName) changed.push('owner name');
  if (next.slotMinutes !== cur.slotMinutes) changed.push(`interval (${next.slotMinutes} min)`);
  if (!same(next.hours, cur.hours)) changed.push('opening hours');
  if (!same(next.closedDates, cur.closedDates)) changed.push('closed dates');

  if (changed.length) {
    db.data.settings.business = next;
    audit(req, 'settings.update', `Updated ${changed.join(', ')}`);
    await db.write();
  }
  res.json({ success: true, data: getBusiness() });
};

// Public: footer ke liye
export const getPublicHours = (req, res) =>
  res.json({ success: true, data: { lines: hoursSummary(), closures: upcomingClosures() } });