import { Router } from 'express';
import { verifyAdmin, verifyAdmin as protect } from '../middleware/auth.middleware.js';
import {
  login, getAllBookingsAdmin, getAllConsultationsAdmin, getDashboardStats,
  updateBooking, deleteBooking, bulkDeleteBookings, deleteConsultation,
  getServicesAdmin, createService, updateService, approveBooking
} from '../controllers/admin.controller.js';

const router = Router();

router.post('/login', login);
router.get('/stats', protect, getDashboardStats);
router.get('/bookings', protect, getAllBookingsAdmin);
router.post('/bookings/bulk-delete', protect, bulkDeleteBookings);
router.patch('/bookings/:id/approve', verifyAdmin, approveBooking);
router.patch('/bookings/:id', protect, updateBooking);
router.delete('/bookings/:id', protect, deleteBooking);
router.get('/consultations', protect, getAllConsultationsAdmin);
router.delete('/consultations/:id', protect, deleteConsultation);
router.get('/services', protect, getServicesAdmin);
router.post('/services', protect, createService);
router.patch('/services/:id', protect, updateService);

export default router;