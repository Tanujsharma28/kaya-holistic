import { db } from '../config/db.js';
import { v4 as uuid } from 'uuid';

// Sirf record push karta hai. Disk par save tab hota hai jab caller db.write() chalaye.
export const audit = (req, action, text) => {
  db.data.auditLog ||= [];
  db.data.auditLog.push({
    id: uuid(),
    at: new Date().toISOString(),
    by: req?.admin?.email || 'admin',
    action,
    text: String(text).slice(0, 300),
  });
  if (db.data.auditLog.length > 1000) db.data.auditLog = db.data.auditLog.slice(-1000);
};

export const getAuditLog = (req, res) => {
  const list = [...(db.data.auditLog || [])].reverse().slice(0, 300);
  res.json({ success: true, data: list });
};