import { Router } from 'express';
import { submitConsent } from '../controllers/consent.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';
const router = Router();

router.post('/', asyncHandler(submitConsent));

export default router;