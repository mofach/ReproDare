// src/socket/handlers/student.handler.js
import { roomName, toBigInt } from '../utils.js';

export default function studentHandlers(io, socket, { prisma, sessionStateManager, userSocketMap }) {
  function ensureAuth(socket) {
    if (!socket.data || !socket.data.userId) throw new Error('not authenticated');
  }

  socket.on('student_join_session', async (payload, cb) => {
    try {
      ensureAuth(socket);
      const { sessionId } = payload || {};
      const userId = socket.data.userId;
      if (!sessionId) throw new Error('sessionId required');

      const existing = await prisma.sessionParticipant.findFirst({
        where: { sessionId: toBigInt(sessionId), userId: toBigInt(userId) },
      });

      let participant;
      if (existing) participant = existing;
      else participant = await prisma.sessionParticipant.create({
        data: { sessionId: toBigInt(sessionId), userId: toBigInt(userId) },
      });

      const st = sessionStateManager.ensure(sessionId);
      st.participants.set(`${userId}`, { participantId: `${participant.id}`, userId: `${userId}` });

      const r = roomName(sessionId);
      socket.join(r);

      const lobbyList = Array.from(st.participants.values()).map((p) => ({ userId: p.userId }));
      io.to(r).emit('session_lobby_update', { participants: lobbyList });

      cb && cb({ ok: true, participant });
    } catch (err) {
      console.error('student_join_session err', err);
      cb && cb({ ok: false, error: err.message });
    }
  });

  socket.on('submit_answer', async (payload, cb) => {
    try {
      ensureAuth(socket);
      const { sessionId, turnId, answer_text } = payload || {};
      const userId = socket.data.userId;
      if (!turnId || !sessionId) throw new Error('turnId & sessionId required');

      // confirm participant owns this turn? optional check
      const turn = await prisma.sessionTurn.findUnique({ where: { id: toBigInt(turnId) }, include: { participant: true } });
      if (!turn) throw new Error('turn not found');
      if (String(turn.participant.userId) !== String(userId)) throw new Error('not owner of this turn');

      await prisma.sessionTurn.update({
        where: { id: toBigInt(turnId) },
        data: { answer_text: answer_text ?? null, answered_at: new Date() },
      });

      const s = await prisma.session.findUnique({ where: { id: toBigInt(sessionId) } });
      const teacherSock = userSocketMap.get(`${s.teacherId}`);
      const msg = { sessionId, turnId, userId, answer_text };
      if (teacherSock) io.to(teacherSock).emit('answer_submitted', msg);

      cb && cb({ ok: true });
    } catch (err) {
      console.error('submit_answer err', err);
      cb && cb({ ok: false, error: err.message });
    }
  });
}
