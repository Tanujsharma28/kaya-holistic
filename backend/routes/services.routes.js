import { Router } from 'express';
import { getAllServices, getServiceById, getQuizMap } from '../controllers/services.controller.js';
const router = Router();

router.get('/', getAllServices);
router.get('/quiz-map', getQuizMap); // /:id se pehle hona zaroori hai
router.get('/:id', getServiceById);

export default router;