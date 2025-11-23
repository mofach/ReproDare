import { Router } from 'express';
import * as sessionController from '../controllers/session.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const router = Router();

router.use(authMiddleware);

router.get('/', sessionController.listSessions);
router.get('/history', sessionController.getHistory); // <--- Route Baru
router.get('/:id', sessionController.getSessionDetail);

router.post('/', requireRole('teacher'), sessionController.createSession);
router.patch('/:id/archive', requireRole('teacher'), sessionController.archiveSession); // <--- Route Baru

export default router;