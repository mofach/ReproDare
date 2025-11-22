// src/routes/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const router = Router();

// Public
router.post('/signup', authController.signup);      // student self-register
router.post('/login', authController.login);        // login (all roles)
router.post('/refresh', authController.refresh);    // refresh tokens
router.post('/logout', authController.logout);      // logout (revoke refresh)
router.post('/create-teacher', authMiddleware, requireRole('admin'), authController.createTeacher);

export default router;
