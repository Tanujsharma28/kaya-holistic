import { Router } from 'express';
import { createGiftCheckout, getGiftBySession, checkGiftCode } from '../controllers/giftcard.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.post('/checkout', asyncHandler(createGiftCheckout));
router.post('/check', asyncHandler(checkGiftCode));
router.get('/by-session/:sessionId', asyncHandler(getGiftBySession));
router.post('/check', asyncHandler(checkGiftCode));
export default router;