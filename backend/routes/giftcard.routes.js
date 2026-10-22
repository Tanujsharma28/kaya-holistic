import { Router } from 'express';
import { createGiftCheckout, getGiftBySession } from '../controllers/giftcard.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.post('/checkout', asyncHandler(createGiftCheckout));
router.get('/by-session/:sessionId', asyncHandler(getGiftBySession));
export default router;