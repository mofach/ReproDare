// src/routes/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Public
router.post('/signup', authController.signup);      // student self-register
router.post('/login', authController.login);        // login (all roles)
router.post('/refresh', authController.refresh);    // refresh tokens
router.post('/logout', authController.logout);      // logout (revoke refresh)

// Admin-only action: create teacher (we do NOT enforce RBAC here now)
// Later you'll mount authMiddleware + requireRole('admin') to this route
router.post('/create-teacher', authController.createTeacher);

export default router;
