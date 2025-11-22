// src/socket/handlers/student.handler.js
/**
 * Student handlers:
 * - student_join_session
 * - submit_answer
 *
 * Context expected: { prisma, sessionStateManager, userSocketMap }
 */
import { roomName } from '../utils.js';
import { validateSocket } from '../validateSocket.js';
import { socketStudentJoinSession, socketSubmitAnswer } from '../../validators/index.js';

export default function studentHandlers(io, socket, { prisma, sessionStateManager, userSocketMap }) {
  function ensureAuth(socket) {
    if (!socket.data || !socket.data.userId) throw new Error('not authenticated');
  }

  // Student join session (adds participant in DB if needed, updates memory state, notifies room)
  socket.on('student_join_session', async (payload, cb) => {
    try {
      ensureAuth(socket);
      const v = validateSocket(socket, socketStudentJoinSession, payload);
      if (!v.ok) return cb && cb({ ok: false, error: v.error });
      const { sessionId } = v.data;
      const userId = socket.data.userId;

      const existing = await prisma.sessionParticipant.findFirst({
        where: { sessionId: BigInt(sessionId), userId: BigInt(userId) },
      });

      let participant;
      if (existing) participant = existing;
      else participant = await prisma.sessionParticipant.create({
        data: { sessionId: BigInt(sessionId), userId: BigInt(userId) },
      });

      const st = sessionStateManager.ensure(sessionId);
      st.participants.set(`${userId}`, { participantId: `${participant.id}`, userId: `${userId}` });

      const r = roomName(sessionId);
      socket.join(r);

      const lobbyList = Array.from(st.participants.values()).map((p) => ({ userId: p.userId }));
      io.to(r).emit('session_lobby_update', { participants: lobbyList });

      return cb && cb({ ok: true, participant });
    } catch (err) {
      console.error('student_join_session err', err);
      return cb && cb({ ok: false, error: err.message });
    }
  });

  // Student submit answer (must own turn)
  socket.on('submit_answer', async (payload, cb) => {
    try {
      ensureAuth(socket);
      const v = validateSocket(socket, socketSubmitAnswer, payload);
      if (!v.ok) return cb && cb({ ok: false, error: v.error });
      const { sessionId, turnId, answer_text } = v.data;
      const userId = socket.data.userId;

      const turn = await prisma.sessionTurn.findUnique({ where: { id: BigInt(turnId) }, include: { participant: true } });
      if (!turn) throw new Error('turn not found');
      if (String(turn.participant.userId) !== String(userId)) throw new Error('not owner of this turn');

      await prisma.sessionTurn.update({
        where: { id: BigInt(turnId) },
        data: { answer_text: answer_text ?? null, answered_at: new Date() },
      });

      const s = await prisma.session.findUnique({ where: { id: BigInt(sessionId) } });
      const teacherSock = userSocketMap.get(`${s.teacherId}`);
      const msg = { sessionId, turnId, userId, answer_text };
      if (teacherSock) io.to(teacherSock).emit('answer_submitted', msg);

      return cb && cb({ ok: true });
    } catch (err) {
      console.error('submit_answer err', err);
      return cb && cb({ ok: false, error: err.message });
    }
  });
}
