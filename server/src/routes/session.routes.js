// src/routes/session.routes.js
import { Router } from 'express';
import * as sessionController from '../controllers/session.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validateRest } from '../middlewares/validate.js';
import { createSessionBody, listSessionsQuery, sessionIdParam } from '../validators/index.js';

const router = Router();

// Public: list sessions (optionally filter by status)
router.get('/', validateRest(listSessionsQuery, 'query'), sessionController.listSessions);

// Protected: create session (teacher/admin)
router.post('/', authMiddleware, requireRole('teacher','admin'), validateRest(createSessionBody), sessionController.createSession);

// Protected: teacher get session history
router.get('/:id/history',
  authMiddleware,
  requireRole('teacher','admin'),
  (req,res,next) => {
    try {
      const parsed = sessionIdParam.parse({ id: req.params.id });
      req.validated = req.validated || {}; req.validated.params = parsed;
      return next();
    } catch (e) {
      const message = e.errors ? e.errors.map(x=>`${x.path.join('.')} ${x.message}`).join('; ') : e.message;
      return res.status(400).json({ ok:false, error: message });
    }
  },
  sessionController.getSessionHistory
);

// Protected: student get own turns
router.get('/me/turns', authMiddleware, sessionController.getMyTurns);

export default router;
