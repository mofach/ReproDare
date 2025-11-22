// src/routes/card.routes.js
import { Router } from 'express';
import * as cardController from '../controllers/card.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const router = Router();

// Public read
router.get('/', authMiddleware, cardController.listCards);
router.get('/:id', authMiddleware, cardController.getCard);

// Teacher CRUD (unprotected for now)
router.post('/', authMiddleware, requireRole('admin', 'teacher'), cardController.createCard);
router.put('/:id', authMiddleware, requireRole('admin', 'teacher'), cardController.updateCard);
router.delete('/:id', authMiddleware, requireRole('admin', 'teacher'), cardController.deleteCard);

export default router;
