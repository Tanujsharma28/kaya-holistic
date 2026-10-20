import { Router } from 'express';
import { verifyUser } from '../middleware/auth.middleware.js';
import { asyncHandler as h } from '../middleware/errorHandler.js';
import { googleLogin, getMe, updateMe, trackActivity, cancelMyBooking } from '../controllers/user.controller.js';

const router = Router();

router.post('/google', h(googleLogin));
router.get('/me', verifyUser, h(getMe));
router.patch('/me', verifyUser, h(updateMe));
router.post('/activity', verifyUser, h(trackActivity));
router.patch('/bookings/:id/cancel', verifyUser, h(cancelMyBooking));

export default router;
