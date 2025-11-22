// src/socket/index.js
import { verifyToken } from '../utils/jwt.js';
import userSocketMap from './state/userSocketMap.js';
import SessionStateManager from './state/sessionState.js';

// handlers
import teacherHandlers from './handlers/teacher.handler.js';
import studentHandlers from './handlers/student.handler.js';
import sessionHandlers from './handlers/session.handler.js';

import prisma from '../prisma/index.js';

const sessionStateManager = new SessionStateManager();

/**
 * Normalize token value: accept "Bearer <token>" or raw token.
 */
function normalizeToken(raw) {
  if (!raw) return null;
  if (typeof raw !== 'string') return null;
  raw = raw.trim();
  if (raw.toLowerCase().startsWith('bearer ')) return raw.slice(7).trim();
  return raw;
}

/**
 * initSocket(io)
 */
export function initSocket(io) {
  // authenticate on initial handshake using socket.io middleware
  io.use((socket, next) => {
    try {
      // prefer auth token (client: io(url, { auth: { token: 'Bearer ...' } }))
      const authToken = socket.handshake?.auth?.token ?? socket.handshake?.auth?.authorization;
      // fallback to common header (some clients put it in 'authorization')
      const headerToken = socket.handshake?.headers?.authorization ?? socket.handshake?.headers?.Authorization;

      const raw = authToken ?? headerToken ?? null;
      const token = normalizeToken(raw);

      if (!token) {
        const e = new Error('authentication token required');
        e.data = { code: 'AUTH_REQUIRED' }; // optional data
        return next(e);
      }

      const payload = verifyToken(token);
      if (!payload || !payload.id) {
        const e = new Error('invalid token');
        e.data = { code: 'AUTH_INVALID' };
        return next(e);
      }

      // attach identity to socket.data
      socket.data.userId = String(payload.id);
      socket.data.role = payload.role ?? null;
      socket.data.email = payload.email ?? null;
      socket.data.name = payload.name ?? null;

      // register mapping
      userSocketMap.set(socket.data.userId, socket.id);

      return next();
    } catch (err) {
      console.error('socket auth error:', err);
      const e = new Error('authentication failed');
      e.data = { code: 'AUTH_ERROR' };
      return next(e);
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data?.userId ?? 'unknown';
    console.log(`socket connected: ${socket.id} (user: ${uid})`);

    const ctx = {
      prisma,
      sessionStateManager,
      userSocketMap,
    };

    // attach handlers
    try {
      teacherHandlers(io, socket, ctx);
      studentHandlers(io, socket, ctx);
      sessionHandlers(io, socket, ctx);
    } catch (err) {
      console.error('error attaching socket handlers', err);
    }

    // cleanup on disconnect
    socket.on('disconnect', (reason) => {
      const uid2 = socket.data?.userId;
      if (uid2 && userSocketMap.get(uid2) === socket.id) {
        userSocketMap.delete(uid2);
      }
      console.log(`socket disconnected: ${socket.id} (user: ${uid2}) reason=${reason}`);
    });
  });
}

export default initSocket;
