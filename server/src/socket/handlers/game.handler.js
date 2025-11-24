import * as sessionService from '../../services/session.service.js';

// PENYIMPANAN STATE SEMENTARA DI MEMORI SERVER
const gameTimers = {};    // { sessionId: TimeoutObject }
const activePlayers = {}; // { sessionId: userId } <--- TRACKING PLAYER AKTIF

export default function registerGameHandlers(io, socket) {

  // --- HELPERS ---

  const startTimer = (sessionId, durationSec, callback) => {
    if (gameTimers[sessionId]) clearTimeout(gameTimers[sessionId]);

    const ms = durationSec * 1000;
    gameTimers[sessionId] = setTimeout(() => {
        console.log(`[TIMER] Session ${sessionId} expired!`);
        callback();
    }, ms);
  };

  const stopTimer = (sessionId) => {
    if (gameTimers[sessionId]) {
        clearTimeout(gameTimers[sessionId]);
        delete gameTimers[sessionId];
    }
  };

  const validateOwner = async (sessionId, userId) => {
      const session = await sessionService.getSessionDetail(sessionId);
      return String(session.teacher.id) === String(userId);
  };

  // --- HANDLERS ---

  // 1. JOIN LOBBY
  socket.on('join_lobby', async ({ sessionId }) => {
    try {
      if (socket.user.role === 'teacher') {
          const isOwner = await validateOwner(sessionId, socket.userId);
          if (!isOwner) return;
      }

      const room = `session_${sessionId}`;
      socket.join(room); 
      socket.activeSessionId = sessionId; 

      const sessionData = await sessionService.joinSession(sessionId, socket.userId);
      io.to(room).emit('lobby_update', sessionData);
    } catch (err) {
      console.error(err);
    }
  });

  // 2. DISCONNECT (LOGIC UTAMA DISINI)
  socket.on('disconnect', async () => {
    if (socket.activeSessionId) {
        const sessionId = socket.activeSessionId;
        const userId = socket.userId.toString();

        console.log(`[SOCKET] User ${socket.user.name} disconnected from ${sessionId}`);

        // A. Update DB Status Offline
        if (socket.user.role === 'student') {
            const updatedSession = await sessionService.leaveSession(sessionId, socket.userId);
            if (updatedSession) {
                io.to(`session_${sessionId}`).emit('lobby_update', updatedSession);
            }

            // B. CEK APAKAH DIA ACTIVE PLAYER?
            // Jika siswa yang sedang giliran keluar, jangan tunggu timer habis!
            if (activePlayers[sessionId] === userId) {
                console.log(`[GAME] Active player disconnected! Forcing next turn...`);
                
                // Matikan timer
                stopTimer(sessionId);
                
                // Hapus status active
                delete activePlayers[sessionId];

                // Broadcast Turn Selesai (Nilai 0)
                io.to(`session_${sessionId}`).emit('turn_completed', {
                    score: 0,
                    feedback: `Siswa ${socket.user.name} keluar dari permainan (Auto-Skip).`
                });
            }
        }
    }
  });

  // 3. START GAME
  socket.on('start_game', async ({ sessionId }) => {
    const isOwner = await validateOwner(sessionId, socket.userId);
    if (!isOwner) return;

    try {
      // Validasi minimal 1 siswa online
      const session = await sessionService.getSessionDetail(sessionId);
      const onlineStudents = session.participants.filter(p => p.user.role === 'student' && p.is_present);

      if (onlineStudents.length === 0) {
          socket.emit('error', { message: "Tidak ada siswa online!" });
          return;
      }

      const updatedSession = await sessionService.startGame(sessionId);
      io.to(`session_${sessionId}`).emit('game_started');
      io.to(`session_${sessionId}`).emit('lobby_update', updatedSession);
    } catch (err) {
      socket.emit('error', { message: "Failed to start" });
    }
  });

  // 4. SPIN ROULETTE
  socket.on('spin_roulette', async ({ sessionId, participants }) => {
    const isOwner = await validateOwner(sessionId, socket.userId);
    if (!isOwner) return;

    stopTimer(sessionId); // Safety clear

    // Random Pick
    const randomIndex = Math.floor(Math.random() * participants.length);
    const selectedParticipant = participants[randomIndex]; 
    
    // SIMPAN PLAYER AKTIF DI MEMORI
    // Agar kalau dia disconnect, kita tahu harus skip
    activePlayers[sessionId] = selectedParticipant.user.id.toString();

    const room = `session_${sessionId}`;
    io.to(room).emit('roulette_spinning');

    setTimeout(() => {
      io.to(room).emit('roulette_result', { 
        selectedUserId: selectedParticipant.user.id, 
        selectedParticipantId: selectedParticipant.id 
      });
    }, 3000);
  });

  // 5. DRAW CARD
  socket.on('draw_card', async ({ sessionId, categoryId, type }) => {
    const card = await sessionService.getRandomCard(categoryId || 1, type);
    const room = `session_${sessionId}`;
    
    io.to(room).emit('card_drawn', { card });

    // TIMER 1: Menjawab (30 Detik)
    console.log(`[TIMER] Start 30s answering for ${sessionId}`);
    startTimer(sessionId, 30, () => {
        // Waktu Habis Menjawab
        io.to(room).emit('answer_submitted', { 
            userId: 'SYSTEM', 
            answer: '(Waktu Habis - Tidak Menjawab)' 
        });
        
        // Lanjut ke Timer Guru (beri waktu guru menilai walau telat)
        // Atau auto-skip (tergantung preferensi). Disini kita kasih guru waktu menilai 0.
    });
  });

  // 6. SUBMIT ANSWER
  socket.on('submit_answer', ({ sessionId, answer }) => {
    const room = `session_${sessionId}`;
    
    // Pindah Timer -> Guru
    stopTimer(sessionId);

    io.to(room).emit('answer_submitted', { 
        userId: socket.userId.toString(),
        answer 
    });

    // TIMER 2: Guru Menilai (30 Detik)
    console.log(`[TIMER] Start 30s grading for ${sessionId}`);
    startTimer(sessionId, 30, () => {
        // Guru kelamaan -> Auto 0
        io.to(room).emit('turn_completed', {
            score: 0,
            feedback: 'Waktu Habis (Guru tidak merespon)'
        });
        delete activePlayers[sessionId]; // Clear active player
    });
  });

  // 7. SUBMIT GRADE
  socket.on('submit_grade', async (data) => {
    const isOwner = await validateOwner(data.sessionId, socket.userId);
    if (!isOwner) return;

    stopTimer(data.sessionId); // Stop semua timer
    delete activePlayers[data.sessionId]; // Clear active player

    await sessionService.recordTurn(data);
    
    io.to(`session_${data.sessionId}`).emit('turn_completed', {
        score: data.score,
        feedback: data.feedback
    });
  });
  
  // 8. END GAME
   socket.on('end_game', async ({ sessionId }) => {
      const isOwner = await validateOwner(sessionId, socket.userId);
      if (!isOwner) return;

      stopTimer(sessionId);
      delete activePlayers[sessionId];
      
      await sessionService.endGame(sessionId);
      io.to(`session_${sessionId}`).emit('game_ended');
   });
}