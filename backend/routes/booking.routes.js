import { Router } from 'express';
import { getAvailability, getBookedSlots, createBooking } from '../controllers/booking.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/availability', getAvailability);
router.get('/booked-slots', getBookedSlots);
router.post('/', asyncHandler(createBooking));

export default router;