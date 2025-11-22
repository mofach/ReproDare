// src/socket/index.js
import prisma from '../prisma/index.js';
import teacherHandlers from './handlers/teacher.handler.js';
import studentHandlers from './handlers/student.handler.js';
import sessionHandlers from './handlers/session.handler.js';
import { userSocketMap } from './state/userSocketMap.js';
import { SessionStateManager } from './state/sessionState.js';
import { verifyToken } from '../utils/jwt.js';

// singletons
const sessionStateManager = new SessionStateManager();

/**
 * initSocket(io)
 * Enforce JWT auth on connect (strict): unauthenticated sockets will be disconnected.
 * Clients MUST connect with: io(url, { auth: { token: "Bearer <token>" } })
 */
export function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    // Authenticate on connect
    try {
      const raw = socket.handshake?.auth?.token || null;
      if (!raw) {
        console.log('no token provided - disconnecting socket', socket.id);
        socket.emit('error', { ok: false, error: 'authentication required' });
        socket.disconnect(true);
        return;
      }
      const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw;
      const payload = verifyToken(token);
      if (!payload || !payload.id) {
        console.log('invalid token - disconnecting socket', socket.id);
        socket.emit('error', { ok: false, error: 'invalid token' });
        socket.disconnect(true);
        return;
      }

      // set identity from token
      socket.data.userId = String(payload.id);
      socket.data.role = payload.role ?? null;
      userSocketMap.set(`${socket.data.userId}`, socket.id);
      console.log(`socket auth success user=${socket.data.userId} socket=${socket.id}`);
    } catch (e) {
      console.error('socket auth error', e);
      socket.emit('error', { ok: false, error: 'auth error' });
      socket.disconnect(true);
      return;
    }

    // register handlers (they will use socket.data.userId)
    teacherHandlers(io, socket, { prisma, sessionStateManager, userSocketMap });
    studentHandlers(io, socket, { prisma, sessionStateManager, userSocketMap });
    sessionHandlers(io, socket, { prisma, sessionStateManager, userSocketMap });

    socket.on('disconnect', () => {
      if (socket.data && socket.data.userId) userSocketMap.delete(`${socket.data.userId}`);
      console.log('socket disconnected', socket.id);
    });
  });
}
