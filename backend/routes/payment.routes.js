import { Router } from 'express';
import { createCheckoutSession, getBookingBySession } from '../controllers/payment.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Note: Stripe webhook (/api/webhooks/stripe) server.js me alag se mount hota hai
// kyunki usko raw body chahiye, JSON-parsed nahi.
router.post('/checkout', asyncHandler(createCheckoutSession));
router.get('/by-session/:sessionId', asyncHandler(getBookingBySession));

export default router;