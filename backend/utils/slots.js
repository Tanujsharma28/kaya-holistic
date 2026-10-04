export const toMinutes = (slot) => {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i.exec(String(slot || ''));
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};

export const durationOf = (data, b) =>
  Number(b.duration) ||
  Number(data.services.find((s) => s.id === b.serviceId)?.duration) ||
  60;

export const typeOf = (b) => b.type || (b.serviceId === 'virt' ? 'consultation' : 'visit');

export function hasConflict(data, { date, slot, duration = 45, ignoreId = null }) {
  const start = toMinutes(slot);
  return data.bookings.some((b) => {
    if (b.id === ignoreId || b.status === 'cancelled' || b.date !== date) return false;
    const bStart = toMinutes(b.slot);
    if (start === null || bStart === null) return b.slot === slot;
    const bEnd = bStart + durationOf(data, b);
    return start < bEnd && bStart < start + duration;
  });
}