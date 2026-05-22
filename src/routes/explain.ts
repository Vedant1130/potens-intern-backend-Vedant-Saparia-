import { Router } from 'express';
import { explainProduct } from '../controllers/explain.js';

const router = Router();

router.get('/:item_id', explainProduct);

export default router;
