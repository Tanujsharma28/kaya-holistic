import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

export const verifyAdmin = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
        // Password badalne ke baad purane tokens kaam nahi karte
    const changedAt = Math.floor(Number(db.data.adminAuth?.changedAt || 0) / 1000);
    if (changedAt && Number(decoded.iat || 0) < changedAt) {
      return res.status(401).json({ success: false, message: 'Password was changed. Please sign in again.' });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Customer (Google login) ka token: role 'user'. Admin token isse pass nahi hota, aur user token admin routes pe pass nahi hota.
export const verifyUser = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'user') return res.status(401).json({ success: false, message: 'Invalid token.' });
    const user = (db.data.users || []).find((u) => u.id === decoded.uid);
    if (!user) return res.status(401).json({ success: false, message: 'Account not found.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
};