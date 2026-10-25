import { db } from '../config/db.js';
import { chicagoNow } from './slots.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const SLOT_STEPS = [15, 30, 45, 60];
export const REVIEW_DELAYS = [1, 2, 3, 6, 24];
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const STAFF = ['Puja', 'Sia'];
// Default: Thursday & Friday = Sia, baaki din = Puja
const defaultStaff = (d) => (d === 4 || d === 5 ? 'Sia' : 'Puja');

const defaultHours = {};
for (let d = 0; d < 7; d++) defaultHours[d] = { open: d !== 0, from: '10:00', to: '18:00', staff: defaultStaff(d) };

export const DEFAULT_BUSINESS = {
  ownerName: 'Puja',
  slotMinutes: 45,
  hours: defaultHours,
  closedDates: [],
  timeOff: [],
  notifications: { reminders: true, reviews: false, reviewUrl: '', reviewDelayHours: 3 },
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
      staff: STAFF.includes(cur.staff) ? cur.staff : base.staff,
    };
  }
  const closedDates = (Array.isArray(s.closedDates) ? s.closedDates : [])
    .filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c?.date || ''))
    .map((c) => ({ date: c.date, reason: String(c.reason || '') }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const timeOff = (Array.isArray(s.timeOff) ? s.timeOff : [])
    .filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t?.date || '') && HHMM.test(t?.from || '') && HHMM.test(t?.to || '') && t.from < t.to)
    .map((t, i) => ({
      id: String(t.id || `${t.date}-${t.from}-${i}`),
      date: t.date, from: t.from, to: t.to,
      staff: STAFF.includes(t.staff) ? t.staff : defaultStaff(new Date(t.date + 'T12:00:00').getDay()),
      reason: String(t.reason || ''),
    }))
    .sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from));
  const n = s.notifications || {};
  const url = String(n.reviewUrl || '').trim();
  return {
    ownerName: String(s.ownerName || '').trim() || DEFAULT_BUSINESS.ownerName,
    slotMinutes: SLOT_STEPS.includes(Number(s.slotMinutes)) ? Number(s.slotMinutes) : DEFAULT_BUSINESS.slotMinutes,
    hours,
    closedDates,
    timeOff,
    staffOptions: STAFF,
    notifications: {
      reminders: typeof n.reminders === 'boolean' ? n.reminders : true,
      reviews: typeof n.reviews === 'boolean' ? n.reviews : false,
      reviewUrl: /^https:\/\/\S+$/.test(url) ? url.slice(0, 300) : '',
      reviewDelayHours: REVIEW_DELAYS.includes(Number(n.reviewDelayHours)) ? Number(n.reviewDelayHours) : 3,
    },
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
// Us din kaun kaam kar raha hai ("Puja" / "Sia")
export const staffOn = (date) => getBusiness().hours[new Date(date + 'T12:00:00').getDay()].staff;

// Slot (start label + duration min) kisi time-off se takraata hai? Ho to us entry, warna null
export const timeOffClash = (date, slot, duration = 45) => {
  const m = String(slot).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  const start = (Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2]);
  const end = start + Number(duration || 45);
  return getBusiness().timeOff.find((t) => t.date === date && start < toMin(t.to) && toMin(t.from) < end) || null;
};
// "Mon, Tue, Wed" -> "Mon–Wed" (3+ lagatar din), warna comma se
const dayRuns = (days) => {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const idx = days.map((d) => order.indexOf(d)).sort((a, b) => a - b);
  const parts = [];
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
    const a = SHORT[order[idx[i]]];
    const z = SHORT[order[idx[j]]];
    if (j - i >= 2) parts.push(`${a}–${z}`);
    else for (let k = i; k <= j; k++) parts.push(SHORT[order[idx[k]]]);
    i = j + 1;
  }
  return parts.join(', ');
};

// [{ name, schedule: ["Mon–Wed, Sat · 10AM–6PM"] }] — admin Settings ke hours se banta hai
export const staffSchedule = () => {
  const b = getBusiness();
  return STAFF.map((name) => {
    const groups = new Map();
    for (let d = 0; d < 7; d++) {
      const h = b.hours[d];
      if (!h.open || h.staff !== name) continue;
      const k = `${t12(h.from)}–${t12(h.to)}`;
      groups.set(k, [...(groups.get(k) || []), d]);
    }
    return { name, schedule: [...groups].map(([time, days]) => `${dayRuns(days)} · ${time}`) };
  });
};