// src/socket/handlers/session.handler.js
import { roomName, toBigInt } from '../utils.js';
import { pickRandomCardForCategory } from '../../services/card.service.js';

export default function sessionHandlers(io, socket, { prisma, sessionStateManager, userSocketMap }) {
  // roulette_next with concurrency guard
  socket.on('roulette_next', async ({ sessionId }, cb) => {
    try {
      // must be authenticated teacher or admin to advance the roulette
      if (!socket.data || !socket.data.userId) throw new Error('not authenticated');
      const stCheck = sessionStateManager.get(sessionId);
      if (stCheck && stCheck.teacherId && stCheck.teacherId !== `${socket.data.userId}`) {
        throw new Error('only session teacher can advance roulette');
      }

      const locked = sessionStateManager.acquireLock(sessionId);
      if (!locked) return cb && cb({ ok: false, error: 'server busy, try again' });

      const st = sessionStateManager.get(sessionId);
      if (!st) {
        sessionStateManager.releaseLock(sessionId);
        throw new Error('session state not found');
      }

      if (!st.queue || st.queue.length === 0) {
        await prisma.session.update({ where: { id: toBigInt(sessionId) }, data: { status: 'finished', endedAt: new Date() } });
        io.to(roomName(sessionId)).emit('session_finished', { sessionId });
        sessionStateManager.releaseLock(sessionId);
        return cb && cb({ ok: true, finished: true });
      }

      const nextUserId = st.queue.shift();
      const participant = st.participants.get(`${nextUserId}`);
      if (!participant) {
        sessionStateManager.releaseLock(sessionId);
        throw new Error('participant not found');
      }

      if (!st.categoryId) {
        const s = await prisma.session.findUnique({ where: { id: toBigInt(sessionId) } });
        st.categoryId = s?.categoryId ? `${s.categoryId}` : null;
      }

      const card = await pickRandomCardForCategory(st.categoryId);
      if (!card) {
        io.to(roomName(sessionId)).emit('no_card_available', { sessionId });
        sessionStateManager.releaseLock(sessionId);
        return cb && cb({ ok: false, error: 'no card available' });
      }

      const turn = await prisma.sessionTurn.create({
        data: {
          sessionId: toBigInt(sessionId),
          participantId: toBigInt(participant.participantId),
          cardId: toBigInt(card.id),
        },
      });

      st.currentTurn = {
        turnId: `${turn.id}`,
        participantId: `${participant.participantId}`,
        userId: `${participant.userId}`,
        cardId: `${card.id}`,
      };

      // broadcast visible card content to room
      io.to(roomName(sessionId)).emit('turn_started', {
        sessionId,
        turnId: `${turn.id}`,
        userId: `${participant.userId}`,
        card: { id: `${card.id}`, type: card.type, content: card.content },
      });

      const chosenSocket = userSocketMap.get(`${participant.userId}`);
      if (chosenSocket) {
        io.to(chosenSocket).emit('your_turn', { sessionId, turnId: `${turn.id}`, card: { id: `${card.id}`, type: card.type, content: card.content } });
      }

      // done
      sessionStateManager.releaseLock(sessionId);
      cb && cb({ ok: true, turnId: `${turn.id}`, userId: `${participant.userId}` });
    } catch (err) {
      console.error('roulette_next err', err);
      try { sessionStateManager.releaseLock(sessionId); } catch(e){/*ignore*/}
      cb && cb({ ok: false, error: err.message });
    }
  });
}
