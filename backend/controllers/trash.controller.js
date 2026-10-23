import { v4 as uuid } from 'uuid';
import { db } from '../config/db.js';
import { hasConflict, durationOf } from '../utils/slots.js';
import { audit } from '../utils/audit.js';

const KEEP_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;
const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });

const labelOf = (kind, item) =>
  kind === 'booking'
    ? `${item.name} · ${item.serviceName} · ${item.date} ${item.slot}`
    : `${item.name || 'Unknown'} · ${item.email || ''}`;

export const purgeOldTrash = () => {
  db.data.trash ||= [];
  const cutoff = Date.now() - KEEP_DAYS * DAY;
  const before = db.data.trash.length;
  db.data.trash = db.data.trash.filter((t) => Date.parse(t.deletedAt) > cutoff);
  return db.data.trash.length !== before;
};

// Caller ko iske baad db.write() chalana hai
export const moveToTrash = (req, kind, item, related = []) => {
  db.data.trash ||= [];
  const label = labelOf(kind, item);
  db.data.trash.push({
    id: uuid(),
    kind,
    label,
    deletedAt: new Date().toISOString(),
    deletedBy: req?.admin?.email || 'admin',
    item,
    related,
  });
  audit(req, `${kind}.trash`, `Moved to Trash: ${label}`);
};

export const getTrashAdmin = async (req, res) => {
  if (purgeOldTrash()) await db.write();
  const list = [...(db.data.trash || [])]
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
    .map((t) => ({
      id: t.id,
      kind: t.kind,
      label: t.label,
      deletedAt: t.deletedAt,
      deletedBy: t.deletedBy,
      extra: (t.related || []).length,
      daysLeft: Math.max(0, Math.ceil((Date.parse(t.deletedAt) + KEEP_DAYS * DAY - Date.now()) / DAY)),
    }));
  res.json({ success: true, data: list });
};

export const restoreFromTrash = async (req, res) => {
  const t = (db.data.trash || []).find((x) => x.id === req.params.id);
  if (!t) return bad(res, 'Item not found in Trash', 404);

  if (t.kind === 'booking') {
    const b = t.item;
    if (db.data.bookings.some((x) => x.id === b.id)) return bad(res, 'This booking already exists', 409);
    const live = String(b.status).toLowerCase() !== 'cancelled';
    if (live && hasConflict(db.data, { date: b.date, slot: b.slot, duration: durationOf(db.data, b) })) {
      return bad(res, 'That time slot is now taken by another appointment. Move or cancel that one first, then restore.', 409);
    }
    db.data.bookings.push(b);
    (t.related || []).forEach((c) => {
      if (!db.data.consultations.some((x) => x.id === c.id)) db.data.consultations.push(c);
    });
  } else if (t.kind === 'consultation') {
    if (!db.data.consultations.some((x) => x.id === t.item.id)) db.data.consultations.push(t.item);
  } else if (t.kind === 'consent') {
    db.data.consents ||= [];
    if (!db.data.consents.some((x) => x.id === t.item.id)) db.data.consents.push(t.item);
  } else {
    return bad(res, 'Unknown item type');
  }

  db.data.trash = db.data.trash.filter((x) => x.id !== t.id);
  audit(req, `${t.kind}.restore`, `Restored from Trash: ${t.label}`);
  await db.write();
  res.json({ success: true });
};

export const deleteFromTrash = async (req, res) => {
  const t = (db.data.trash || []).find((x) => x.id === req.params.id);
  if (!t) return bad(res, 'Item not found in Trash', 404);
  db.data.trash = db.data.trash.filter((x) => x.id !== t.id);
  audit(req, `${t.kind}.purge`, `Deleted permanently: ${t.label}`);
  await db.write();
  res.json({ success: true });
};