import { db } from '../config/db.js';

export const getAllServices = (req, res) => {
  res.json({ success: true, data: db.data.services.filter((s) => s.active !== false) });
};

export const getServiceById = (req, res) => {
  const service = db.data.services.find((s) => s.id === req.params.id && s.active !== false);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, data: service });
};