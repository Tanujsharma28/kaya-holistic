import { Router } from 'express';
import { submitConsultation } from '../controllers/consultation.controller.js';
import { asyncHandler } from '../middleware/errorHandler.js';
const router = Router();

router.post('/', asyncHandler(submitConsultation));

export default router;