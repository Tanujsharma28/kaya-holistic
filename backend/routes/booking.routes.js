import { Router } from 'express';
import { getAvailability, getBookedSlots, createBooking, confirmBooking, getAllBookings } from '../controllers/booking.controller.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/availability', getAvailability);
router.get('/booked-slots', getBookedSlots);
router.get('/', verifyAdmin, getAllBookings);
router.post('/confirm', confirmBooking);
router.post('/', createBooking);

export default router;