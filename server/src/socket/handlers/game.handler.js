import * as sessionService from '../../services/session.service.js';

export default function registerGameHandlers(io, socket) {
  
  // 1. JOIN LOBBY
  socket.on('join_lobby', async ({ sessionId }) => {
    try {
      console.log(`[SOCKET] Join Request: User ${socket.user.name} -> Session ${sessionId}`);
      
      const room = `session_${sessionId}`;
      socket.join(room); 

      // PENTING: Simpan SessionID di socket ini untuk dipakai saat disconnect nanti
      socket.activeSessionId = sessionId;

      // Update DB
      const sessionData = await sessionService.joinSession(sessionId, socket.userId);

      // Broadcast update ke room
      io.to(room).emit('lobby_update', sessionData);
    } catch (err) {
      console.error("[SOCKET ERROR] Join failed:", err);
      socket.emit('error', { message: "Failed to join lobby" });
    }
  });

  // 2. DISCONNECT (HANDLE USER LEAVE)
  socket.on('disconnect', async () => {
    // Cek apakah user ini sedang tergabung di sesi?
    if (socket.activeSessionId) {
      console.log(`[SOCKET] User ${socket.user.name} disconnected from Session ${socket.activeSessionId}`);
      
      // Update DB set is_present = false
      const updatedSession = await sessionService.leaveSession(socket.activeSessionId, socket.userId);
      
      // Jika berhasil update, kabari sisa orang di lobby
      if (updatedSession) {
        io.to(`session_${socket.activeSessionId}`).emit('lobby_update', updatedSession);
      }
    }
  });

  // 3. START GAME (Teacher Only)
  socket.on('start_game', async ({ sessionId }) => {
    console.log(`[SOCKET] Start Game Request by ${socket.user.name} (Role: ${socket.user.role})`);

    // Validasi Role
    if (socket.user.role !== 'teacher') {
        console.warn("[SOCKET BLOCK] Non-teacher tried to start game");
        return; 
    }

    try {
      await sessionService.startGame(sessionId);
      const room = `session_${sessionId}`;
      
      console.log(`[SOCKET] Game Started! Broadcasting to room ${room}`);
      io.to(room).emit('game_started');
    } catch (err) {
      console.error("[SOCKET ERROR] Start Game failed:", err);
      socket.emit('error', { message: "Failed to start game" });
    }
  });

  // 4. SPIN ROULETTE
  socket.on('spin_roulette', async ({ sessionId, participants }) => {
    if (socket.user.role !== 'teacher') return;
    
    // Safety check jika participants kosong
    if (!participants || participants.length === 0) return;

    const randomIndex = Math.floor(Math.random() * participants.length);
    const selectedParticipant = participants[randomIndex]; 

    const room = `session_${sessionId}`;
    io.to(room).emit('roulette_spinning', { duration: 3000 });

    setTimeout(() => {
      io.to(room).emit('roulette_result', { 
        selectedUserId: selectedParticipant.user.id, 
        selectedParticipantId: selectedParticipant.id 
      });
    }, 3000);
  });

  // 5. DRAW CARD
  socket.on('draw_card', async ({ sessionId, categoryId, type }) => {
    try {
      // Pastikan categoryId dikirim, kalau tidak pakai default 1 (atau throw error)
      const catId = categoryId || 1; 
      const card = await sessionService.getRandomCard(catId, type);
      const room = `session_${sessionId}`;
      
      if (!card) {
        // Fallback dummy card jika DB kosong (biar game ga macet)
        io.to(room).emit('card_drawn', { card: { id: 0, type, content: "Kartu habis/tidak ditemukan di database!" } });
        return;
      }

      io.to(room).emit('card_drawn', { card });
    } catch (err) {
      console.error(err);
    }
  });

  // 6. SUBMIT ANSWER
  socket.on('submit_answer', ({ sessionId, answer }) => {
    const room = `session_${sessionId}`;
    io.to(room).emit('answer_submitted', { 
        userId: socket.userId.toString(),
        answer 
    });
  });

  // 7. SUBMIT GRADE
  socket.on('submit_grade', async (data) => {
    if (socket.user.role !== 'teacher') return;

    try {
      await sessionService.recordTurn(data);
      const room = `session_${data.sessionId}`;
      io.to(room).emit('turn_completed', {
        score: data.score,
        feedback: data.feedback
      });
    } catch (err) {
      console.error(err);
    }
  });
  
  // 8. END GAME
  socket.on('end_game', async ({ sessionId }) => {
      if (socket.user.role !== 'teacher') return;
      await sessionService.endGame(sessionId);
      io.to(`session_${sessionId}`).emit('game_ended');
  });
}