import { Router } from 'express';
import { getItems, createItem, updateItem, deleteItem } from '../controllers/items.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateProduct } from '../middleware/validate.js';

const router = Router();

// Apply requireAdmin middleware to ALL CRUD endpoints below
router.use(requireAdmin);

router.get('/', getItems);
router.post('/', validateProduct, createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
