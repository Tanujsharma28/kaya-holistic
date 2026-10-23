import { db } from '../config/db.js';
import { chicagoNow } from './slots.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const SLOT_STEPS = [15, 30, 45, 60];
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const defaultHours = {};
for (let d = 0; d < 7; d++) defaultHours[d] = { open: d !== 0, from: '10:00', to: '18:00' };

export const DEFAULT_BUSINESS = {
  ownerName: 'Puja',
  slotMinutes: 45,
  hours: defaultHours,
  closedDates: [],
};

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// 645 -> "10:45 AM" (public slots ke purane format jaisa)
const label = (m) => {
  const h = Math.floor(m / 60);
  const mi = m % 60;
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(mi).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// "18:00" -> "6PM", "14:30" -> "2:30PM"
const t12 = (hhmm) => {
  const m = toMin(hhmm);
  const h = Math.floor(m / 60);
  const mi = m % 60;
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}${mi ? ':' + String(mi).padStart(2, '0') : ''}${h >= 12 ? 'PM' : 'AM'}`;
};

// Saved settings + defaults mila ke hamesha poora, saaf object deta hai
export const getBusiness = () => {
  const s = db.data.settings?.business || {};
  const hours = {};
  for (let d = 0; d < 7; d++) {
    const base = DEFAULT_BUSINESS.hours[d];
    const cur = s.hours?.[d] || {};
    hours[d] = {
      open: typeof cur.open === 'boolean' ? cur.open : base.open,
      from: HHMM.test(cur.from || '') ? cur.from : base.from,
      to: HHMM.test(cur.to || '') ? cur.to : base.to,
    };
  }
  const closedDates = (Array.isArray(s.closedDates) ? s.closedDates : [])
    .filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c?.date || ''))
    .map((c) => ({ date: c.date, reason: String(c.reason || '') }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    ownerName: String(s.ownerName || '').trim() || DEFAULT_BUSINESS.ownerName,
    slotMinutes: SLOT_STEPS.includes(Number(s.slotMinutes)) ? Number(s.slotMinutes) : DEFAULT_BUSINESS.slotMinutes,
    hours,
    closedDates,
  };
};

// Band ho to wajah ka text, khula ho to null
export const closedReason = (date) => {
  const b = getBusiness();
  const hit = b.closedDates.find((c) => c.date === date);
  const d = new Date(date + 'T12:00:00');
  if (hit) {
    const nice = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `The spa is closed on ${nice}${hit.reason ? ` (${hit.reason})` : ''}`;
  }
  const day = d.getDay();
  if (!b.hours[day].open) return `The spa is closed on ${DAY_NAMES[day]}s`;
  return null;
};

// Us din ke saare slot labels (band din par khaali)
export const slotsFor = (date) => {
  if (closedReason(date)) return [];
  const b = getBusiness();
  const h = b.hours[new Date(date + 'T12:00:00').getDay()];
  const out = [];
  for (let m = toMin(h.from); m < toMin(h.to); m += b.slotMinutes) out.push(label(m));
  return out;
};

// Footer ke liye: ["Mon–Sat: 10AM–6PM", "Sunday: Closed"]
export const hoursSummary = () => {
  const b = getBusiness();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const txt = (d) => (b.hours[d].open ? `${t12(b.hours[d].from)}–${t12(b.hours[d].to)}` : 'Closed');
  const lines = [];
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && txt(order[j + 1]) === txt(order[i])) j++;
    const first = order[i];
    const last = order[j];
    const name = i === j ? DAY_NAMES[first] : `${SHORT[first]}–${SHORT[last]}`;
    lines.push(`${name}: ${txt(first)}`);
    i = j + 1;
  }
  return lines;
};

// Aane wale holidays (footer me dikhane ke liye)
export const upcomingClosures = (limit = 3) => {
  const today = chicagoNow().date;
  return getBusiness().closedDates
    .filter((c) => c.date >= today)
    .slice(0, limit)
    .map((c) => {
      const d = new Date(c.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { date: c.date, label: c.reason ? `${d} (${c.reason})` : d };
    });
};