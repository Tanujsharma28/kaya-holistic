export const toMinutes = (slot) => {
  if (!slot) return null;
  const str = String(slot).trim();
  // 12-hour format with AM/PM (e.g., "10:00 AM", "4:00 PM", "04:00 PM")
  const m12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(str);
  if (m12) {
    let h = Number(m12[1]) % 12;
    if (m12[3].toUpperCase() === 'PM') h += 12;
    return h * 60 + Number(m12[2]);
  }
  // 24-hour format (e.g., "16:00", "09:30", "10:00")
  const m24 = /^(\d{1,2}):(\d{2})$/.exec(str);
  if (m24) {
    const h = Number(m24[1]);
    const mi = Number(m24[2]);
    if (h >= 0 && h < 24 && mi >= 0 && mi < 60) {
      return h * 60 + mi;
    }
  }
  return null;
};

export const durationOf = (data, b) =>
  Number(b.duration) ||
  Number((data.services || []).find((s) => s.id === b.serviceId)?.duration) ||
  60;

export const typeOf = (b) => b.type || (b.serviceId === 'virt' ? 'consultation' : 'visit');

export function hasConflict(data, { date, slot, duration = 45, ignoreId = null }) {
  const start = toMinutes(slot);
  if (start === null) return false;
  return (data.bookings || []).some((b) => {
    const bId = String(b.id || b._id || '');
    const ignId = String(ignoreId || '');
    if ((ignId && bId === ignId) || (b.status || '').toLowerCase() === 'cancelled' || b.date !== date) {
      return false;
    }
    const bStart = toMinutes(b.slot);
    if (bStart === null) return false;
    const bEnd = bStart + durationOf(data, b);
    return start < bEnd && bStart < start + duration;
  });
}