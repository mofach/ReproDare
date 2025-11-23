import * as sessionService from '../services/session.service.js';
import { ok, created, error } from '../utils/response.js';

// GET /sessions (List Sesi)
export async function listSessions(req, res) {
    try {
        const sessions = await sessionService.getAllSessions();
        return ok(res, { items: sessions });
    } catch (err) {
        return error(res, 500, err.message);
    }
}

// POST /sessions (Buat Sesi Baru)
export async function createSession(req, res) {
    try {
        const teacherId = req.user.id; // Dari middleware auth
        const session = await sessionService.createSession(teacherId, req.body);
        return created(res, { session });
    } catch (err) {
        return error(res, 400, err.message);
    }
}

// GET /sessions/:id (Detail Sesi - Opsional jika mau fetch via HTTP selain Socket)
export async function getSessionDetail(req, res) {
    try {
        const session = await sessionService.getSessionDetail(req.params.id);
        if (!session) return error(res, 404, "Session not found");
        return ok(res, { session });
    } catch (err) {
        return error(res, 500, err.message);
    }
}

// NEW: Get History
export async function getHistory(req, res) {
    try {
        const { id, role } = req.user;
        const history = await sessionService.getUserHistory(id, role);
        return ok(res, { items: history });
    } catch (err) {
        return error(res, 500, err.message);
    }
}

// NEW: Archive/Delete Session
export async function archiveSession(req, res) {
    try {
        const { id } = req.params;
        await sessionService.archiveSession(id);
        return ok(res, { message: "Session archived" });
    } catch (err) {
        return error(res, 500, err.message);
    }
}