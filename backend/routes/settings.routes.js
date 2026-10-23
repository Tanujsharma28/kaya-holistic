import { Router } from 'express';
import { getPublicHours } from '../controllers/settings.controller.js';

const router = Router();
router.get('/hours', getPublicHours);

export default router;