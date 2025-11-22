// src/socket/handlers/teacher.handler.js
import { roomName, toBigInt } from '../utils.js';
import { pickRandomCardForCategory } from '../../services/card.service.js';

export default function teacherHandlers(io, socket, { prisma, sessionStateManager, userSocketMap }) {
  // Helper: ensure this socket is teacher
  function ensureTeacher(socket, sessionId) {
    if (!socket.data || !socket.data.userId) throw new Error('not authenticated');
    if (socket.data.role !== 'teacher' && socket.data.role !== 'admin') throw new Error('not teacher');
    // if sessionId provided, optionally verify teacher owns session
    if (sessionId) {
      const st = sessionStateManager.get(sessionId);
      if (st && st.teacherId && st.teacherId !== `${socket.data.userId}`) throw new Error('not session owner');
    }
  }

  // create session
  socket.on('teacher_create_session', async (payload, cb) => {
    try {
      ensureTeacher(socket);
      const { categoryId, title } = payload || {};
      if (!categoryId) throw new Error('categoryId required');

      const newSession = await prisma.session.create({
        data: {
          teacherId: toBigInt(socket.data.userId),
          categoryId: toBigInt(categoryId),
          title: title ?? null,
          status: 'waiting',
        },
      });

      // initialize in-memory state
      const st = sessionStateManager.ensure(newSession.id);
      st.teacherId = `${socket.data.userId}`;
      st.categoryId = `${categoryId}`;

      // teacher joins room
      socket.join(roomName(newSession.id));

      cb && cb({ ok: true, session: newSession });
    } catch (err) {
      console.error('teacher_create_session err', err);
      cb && cb({ ok: false, error: err.message });
    }
  });

  // start session
  socket.on('teacher_start_session', async ({ sessionId }, cb) => {
    try {
      ensureTeacher(socket, sessionId);
      const st = sessionStateManager.ensure(sessionId);

      if (st.participants.size === 0) {
        const parts = await prisma.sessionParticipant.findMany({ where: { sessionId: toBigInt(sessionId) } });
        for (const p of parts) st.participants.set(`${p.userId}`, { participantId: `${p.id}`, userId: `${p.userId}` });
      }

      const users = Array.from(st.participants.keys());
      for (let i = users.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [users[i], users[j]] = [users[j], users[i]];
      }
      st.queue = users.slice();

      await prisma.session.update({ where: { id: toBigInt(sessionId) }, data: { status: 'running', startedAt: new Date() } });

      io.to(roomName(sessionId)).emit('session_started', { sessionId, queue: st.queue });
      cb && cb({ ok: true });
    } catch (err) {
      console.error('teacher_start_session err', err);
      cb && cb({ ok: false, error: err.message });
    }
  });

  // grade turn
  socket.on('grade_turn', async ({ sessionId, turnId, score, feedback }, cb) => {
    try {
      ensureTeacher(socket, sessionId);
      if (!turnId) throw new Error('turnId required');

      await prisma.sessionTurn.update({
        where: { id: toBigInt(turnId) },
        data: { score: typeof score === 'number' ? score : undefined, feedback: feedback ?? undefined, graded_at: new Date() },
      });

      const turn = await prisma.sessionTurn.findUnique({ where: { id: toBigInt(turnId) }, include: { participant: true } });
      const participantUserId = `${turn.participant.userId}`;
      const sockId = userSocketMap.get(participantUserId);
      if (sockId) io.to(sockId).emit('turn_graded', { sessionId, turnId, score, feedback });

      const st = sessionStateManager.get(sessionId);
      if (st) st.finishedSet.add(participantUserId);

      cb && cb({ ok: true });
    } catch (err) {
      console.error('grade_turn err', err);
      cb && cb({ ok: false, error: err.message });
    }
  });

  // teacher end session
  socket.on('teacher_end_session', async ({ sessionId }, cb) => {
    try {
      ensureTeacher(socket, sessionId);
      if (!sessionId) throw new Error('sessionId required');
      await prisma.session.update({ where: { id: toBigInt(sessionId) }, data: { status: 'finished', endedAt: new Date() } });
      io.to(roomName(sessionId)).emit('session_finished', { sessionId });
      sessionStateManager.delete(sessionId);
      cb && cb({ ok: true });
    } catch (err) {
      console.error('teacher_end_session err', err);
      cb && cb({ ok: false, error: err.message });
    }
  });
}
