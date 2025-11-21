// src/routes/card.routes.js
import { Router } from 'express';
import * as cardController from '../controllers/card.controller.js';
// future: import { authMiddleware } from '../middlewares/auth.js';
// future: import { requireRole } from '../middlewares/rbac.js';

const router = Router();

// Public read
router.get('/', cardController.listCards);
router.get('/:id', cardController.getCard);

// Teacher CRUD (unprotected for now)
router.post('/', cardController.createCard);
router.put('/:id', cardController.updateCard);
router.delete('/:id', cardController.deleteCard);

export default router;
