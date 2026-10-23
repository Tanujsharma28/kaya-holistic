import { db } from '../config/db.js';
import { audit } from '../utils/audit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (e = '') => String(e).trim().toLowerCase();
const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });

// email -> { tags: [], notes: '', updatedAt }
export const getCustomerMeta = (req, res) =>
  res.json({ success: true, data: db.data.customerMeta || {} });

export const saveCustomerMeta = async (req, res) => {
  const email = norm(req.params.email);
  if (!EMAIL_RE.test(email)) return bad(res, 'Invalid email');

  db.data.customerMeta ||= {};
  const cur = db.data.customerMeta[email] || { tags: [], notes: '' };
  const { tags: tagsIn, notes: notesIn } = req.body || {};

  if (tagsIn !== undefined && !Array.isArray(tagsIn)) return bad(res, 'Invalid tags');
  if (notesIn !== undefined && typeof notesIn !== 'string') return bad(res, 'Invalid notes');

  const tags = tagsIn === undefined
    ? cur.tags
    : [...new Map(
        tagsIn
          .map((t) => String(t).trim().slice(0, 24))
          .filter(Boolean)
          .map((t) => [t.toLowerCase(), t])
      ).values()].slice(0, 12);
  const notes = notesIn === undefined ? cur.notes : notesIn.slice(0, 2000);

  if (!tags.length && !notes.trim()) {
    delete db.data.customerMeta[email];
  } else {
    db.data.customerMeta[email] = { tags, notes, updatedAt: new Date().toISOString() };
  }
  // Notes private hain, isliye log me sirf email jaata hai
  audit(req, 'customer.update', `Updated tags/notes for ${email}`);
  await db.write();
  res.json({ success: true, data: db.data.customerMeta[email] || { tags: [], notes: '' } });
};