// src/socket/handlers/teacher.handler.js
/**
 * Teacher socket handlers:
 * - teacher_create_session
 * - teacher_start_session
 * - grade_turn
 * - teacher_end_session
 *
 * Context expected: { prisma, sessionStateManager, userSocketMap }
 */
import { roomName } from '../utils.js';
import { pickRandomCardForCategory } from '../../services/card.service.js';
import {
  socketTeacherCreateSession,
  socketTeacherStartSession,
  socketGradeTurn,
  socketTeacherEndSession,
} from '../../validators/index.js';
import { validateSocket } from '../validateSocket.js';

export default function teacherHandlers(io, socket, { prisma, sessionStateManager, userSocketMap }) {
  function ensureTeacher(socket, sessionId) {
    if (!socket.data || !socket.data.userId) throw new Error('not authenticated');
    if (socket.data.role !== 'teacher' && socket.data.role !== 'admin') throw new Error('not teacher');
    if (sessionId) {
      const st = sessionStateManager.get(sessionId);
      if (st && st.teacherId && st.teacherId !== `${socket.data.userId}`) throw new Error('not session owner');
    }
  }

  // Create session: teacher creates a session and joins the room
  socket.on('teacher_create_session', async (payload, cb) => {
    try {
      ensureTeacher(socket);
      const v = validateSocket(socket, socketTeacherCreateSession, payload);
      if (!v.ok) return cb && cb({ ok: false, error: v.error });
      const { categoryId, title } = v.data;

      const newSession = await prisma.session.create({
        data: {
          teacherId: BigInt(socket.data.userId),
          categoryId: BigInt(categoryId),
          title: title ?? null,
          status: 'waiting',
        },
      });

      const st = sessionStateManager.ensure(newSession.id);
      st.teacherId = `${socket.data.userId}`;
      st.categoryId = `${categoryId}`;

      socket.join(roomName(newSession.id));

      return cb && cb({ ok: true, session: newSession });
    } catch (err) {
      console.error('teacher_create_session err', err);
      return cb && cb({ ok: false, error: err.message });
    }
  });

  // Start session: shuffle participants into queue and set session running
  socket.on('teacher_start_session', async (payload, cb) => {
    try {
      const v = validateSocket(socket, socketTeacherStartSession, payload);
      if (!v.ok) return cb && cb({ ok: false, error: v.error });
      const { sessionId } = v.data;
      ensureTeacher(socket, sessionId);

      const st = sessionStateManager.ensure(sessionId);

      // load participants if memory empty
      if (st.participants.size === 0) {
        const parts = await prisma.sessionParticipant.findMany({ where: { sessionId: BigInt(sessionId) } });
        for (const p of parts) st.participants.set(`${p.userId}`, { participantId: `${p.id}`, userId: `${p.userId}` });
      }

      // shuffle
      const users = Array.from(st.participants.keys());
      for (let i = users.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [users[i], users[j]] = [users[j], users[i]];
      }
      st.queue = users.slice();

      await prisma.session.update({ where: { id: BigInt(sessionId) }, data: { status: 'running', startedAt: new Date() } });

      io.to(roomName(sessionId)).emit('session_started', { sessionId, queue: st.queue });
      return cb && cb({ ok: true });
    } catch (err) {
      console.error('teacher_start_session err', err);
      return cb && cb({ ok: false, error: err.message });
    }
  });

  // Grade a turn: teacher gives score & feedback (private to student)
  socket.on('grade_turn', async (payload, cb) => {
    try {
      const v = validateSocket(socket, socketGradeTurn, payload);
      if (!v.ok) return cb && cb({ ok: false, error: v.error });
      const { sessionId, turnId, score, feedback } = v.data;

      ensureTeacher(socket, sessionId);
      if (!turnId) throw new Error('turnId required');

      await prisma.sessionTurn.update({
        where: { id: BigInt(turnId) },
        data: { score: typeof score === 'number' ? score : undefined, feedback: feedback ?? undefined, graded_at: new Date() },
      });

      const turn = await prisma.sessionTurn.findUnique({ where: { id: BigInt(turnId) }, include: { participant: true } });
      const participantUserId = `${turn.participant.userId}`;
      const sockId = userSocketMap.get(participantUserId);
      if (sockId) io.to(sockId).emit('turn_graded', { sessionId, turnId, score, feedback });

      const st = sessionStateManager.get(sessionId);
      if (st) st.finishedSet.add(participantUserId);

      return cb && cb({ ok: true });
    } catch (err) {
      console.error('grade_turn err', err);
      return cb && cb({ ok: false, error: err.message });
    }
  });

  // End session: teacher manually ends session
  socket.on('teacher_end_session', async (payload, cb) => {
    try {
      const v = validateSocket(socket, socketTeacherEndSession, payload);
      if (!v.ok) return cb && cb({ ok: false, error: v.error });
      const { sessionId } = v.data;
      ensureTeacher(socket, sessionId);

      await prisma.session.update({ where: { id: BigInt(sessionId) }, data: { status: 'finished', endedAt: new Date() } });
      io.to(roomName(sessionId)).emit('session_finished', { sessionId });
      sessionStateManager.delete(sessionId);

      return cb && cb({ ok: true });
    } catch (err) {
      console.error('teacher_end_session err', err);
      return cb && cb({ ok: false, error: err.message });
    }
  });
}
