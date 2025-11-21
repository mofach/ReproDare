// src/routes/category.routes.js
import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
// future: import { authMiddleware } from '../middlewares/auth.js';
// future: import { requireRole } from '../middlewares/rbac.js';

const router = Router();

// Public read
router.get('/', categoryController.listCategories);
router.get('/:id', categoryController.getCategory);

// Teacher/Admin endpoints (currently unprotected)
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
