// src/routes/user.routes.js
import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const router = Router();

// Middleware: Harus Login, dan Role harus 'teacher' atau 'admin'
router.use(authMiddleware);
router.use(requireRole('teacher', 'admin'));

// GET /users?role=student  -> List user (bisa filter role)
router.get('/', userController.listUsers);

// DELETE /users/:id -> Hapus user by ID
router.delete('/:id', userController.deleteUser);

export default router;