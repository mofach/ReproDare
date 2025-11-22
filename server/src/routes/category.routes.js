// src/routes/category.routes.js
import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const router = Router();

// Public read
router.get('/', authMiddleware, categoryController.listCategories);
router.get('/:id', authMiddleware, categoryController.getCategory);

// Teacher/Admin endpoints (currently unprotected)
router.post('/', authMiddleware, requireRole('admin', 'teacher'), categoryController.createCategory);
router.put('/:id', authMiddleware, requireRole('admin', 'teacher'), categoryController.updateCategory);
router.delete('/:id', authMiddleware, requireRole('admin', 'teacher'), categoryController.deleteCategory);

export default router;
