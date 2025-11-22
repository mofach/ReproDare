// src/controllers/session.controller.js
import * as sessionService from '../services/session.service.js';
import { ok, created, error } from '../utils/response.js';

/**
 * Controllers for session REST endpoints.
 * - createSession (POST /sessions) -> teacher/admin only
 * - listSessions (GET /sessions) -> public (optionally filter by status)
 * - getSessionHistory (GET /sessions/:id/history) -> teacher/admin only
 * - getMyTurns (GET /sessions/me/turns) -> authenticated user (student)
 */

export async function createSession(req, res) {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) return error(res, 401, 'Authentication required');

    // req.validated.body if validation middleware used, else fallback to req.body
    const body = (req.validated && req.validated.body) ? req.validated.body : req.body;
    const { categoryId, title } = body;

    const s = await sessionService.createSession({ teacherId, categoryId, title });
    return created(res, { session: s });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function listSessions(req, res) {
  try {
    const query = (req.validated && req.validated.query) ? req.validated.query : req.query;
    const items = await sessionService.listSessions({ status: query.status });
    return ok(res, { items });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function getSessionHistory(req, res) {
  try {
    const id = (req.validated && req.validated.params) ? req.validated.params.id : req.params.id;
    const turns = await sessionService.getSessionTurns(id);
    return ok(res, { turns });
  } catch (err) {
    return error(res, 400, err.message);
  }
}

export async function getMyTurns(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return error(res, 401, 'Authentication required');
    const turns = await sessionService.getUserTurns(userId);
    return ok(res, { turns });
  } catch (err) {
    return error(res, 400, err.message);
  }
}
