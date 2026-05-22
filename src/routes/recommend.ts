import { Router } from 'express';
import { getRecommendations } from '../controllers/recommend.js';
import { validateProfile } from '../middleware/validate.js';

const router = Router();

router.post('/', validateProfile, getRecommendations);

export default router;
