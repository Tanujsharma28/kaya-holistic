import { Router } from 'express';
import { verifyAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler as h } from '../middleware/errorHandler.js';
import {
  login, getAllBookingsAdmin, getAllConsultationsAdmin, getDashboardStats,
  updateBooking, deleteBooking, bulkDeleteBookings, deleteConsultation,
  getServicesAdmin, createService, updateService, deleteService, approveBooking
} from '../controllers/admin.controller.js';

const router = Router();

router.post('/login', h(login));
router.use(verifyAdmin); // iske neeche sab routes admin token maangte hain

router.get('/stats', h(getDashboardStats));
router.get('/bookings', h(getAllBookingsAdmin));
router.post('/bookings/bulk-delete', h(bulkDeleteBookings));
router.patch('/bookings/:id/approve', h(approveBooking));
router.patch('/bookings/:id', h(updateBooking));
router.delete('/bookings/:id', h(deleteBooking));
router.get('/consultations', h(getAllConsultationsAdmin));
router.delete('/consultations/:id', h(deleteConsultation));
router.get('/services', h(getServicesAdmin));
router.post('/services', h(createService));
router.patch('/services/:id', h(updateService));
router.delete('/services/:id', h(deleteService));

export default router;