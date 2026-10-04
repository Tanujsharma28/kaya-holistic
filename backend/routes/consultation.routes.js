import { Router } from 'express';
import { submitConsultation } from '../controllers/consultation.controller.js';
const router = Router();

router.post('/', submitConsultation);

export default router;