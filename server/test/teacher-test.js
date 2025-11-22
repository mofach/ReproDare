// server/test/teacher-robust.js
// Node ESM: run with `node server/test/teacher-robust.js`
import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const BASE = 'http://localhost:4000';

// --- helpers ---
async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return r.json();
}

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

// --- main ---
(async () => {
  console.log('Teacher: logging in...');
  const loginRes = await login('pirda@example.com', 'pirda123');
  if (!loginRes?.accessToken) return console.error('login failed', loginRes);
  const token = loginRes.accessToken;

  const socket = io(BASE, { auth: { token: `Bearer ${token}` } });

  let sessionId = null;
  let running = false;
  let awaitingNext = false;

  // When teacher connects, create session
  socket.on('connect', () => {
    console.log('teacher connected', socket.id);
    // create session
    socket.emit('teacher_create_session', { categoryId: '1', title: 'Demo Robust' }, (res) => {
      console.log('create cb', res);
      if (!res.ok) return console.error('create failed', res);
      sessionId = String(res.session.id);
      console.log('Session created id=', sessionId);
      // Now WAIT for lobby updates. Do NOT start immediately.
    });
  });

  // When lobby updates (student joined), check count and start if >= 1
  socket.on('session_lobby_update', async (data) => {
    try {
      console.log('lobby update', data);
      const count = Array.isArray(data.participants) ? data.participants.length : 0;
      if (!running && sessionId && count >= 1) {
        console.log('Enough participants — starting session...');
        socket.emit('teacher_start_session', { sessionId }, (r) => {
          console.log('start cb', r);
          if (r.ok) {
            running = true;
            // after start, kick off first roulette_next (small delay to let state settle)
            setTimeout(() => {
              if (!awaitingNext) {
                awaitingNext = true;
                socket.emit('roulette_next', { sessionId }, (res) => {
                  console.log('roulette_next cb', res);
                  awaitingNext = false;
                  if (res.finished) {
                    console.log('Session finished (after initial next).');
                  }
                });
              }
            }, 800);
          }
        });
      }
    } catch (err) {
      console.error('session_lobby_update handler err', err);
    }
  });

  // When a turn starts (public), just log it
  socket.on('turn_started', (d) => {
    console.log('turn_started (public):', d);
  });

  // When a student submits answer, grade it immediately
  socket.on('answer_submitted', async (d) => {
    try {
      console.log('answer_submitted (teacher receives):', d);
      const { sessionId: sid, turnId, userId, answer_text } = d;
      // grade: pick random or fixed score
      const score = 8;
      const feedback = 'Terima kasih, sudah berbagi. Good job!';
      // send grade
      socket.emit('grade_turn', { sessionId: sid, turnId, score, feedback }, (gcb) => {
        console.log('grade_turn cb', gcb);
        // after grading, advance roulette (small delay)
        setTimeout(() => {
          if (!awaitingNext) {
            awaitingNext = true;
            socket.emit('roulette_next', { sessionId: sid }, (res) => {
              console.log('roulette_next cb after grade', res);
              awaitingNext = false;
              if (res.finished) {
                console.log('Session finished (all turns done).');
              }
            });
          }
        }, 600);
      });
    } catch (err) {
      console.error('answer_submitted handler error', err);
    }
  });

  socket.on('turn_graded', (d) => {
    console.log('turn_graded event (student receives, here teacher also logs):', d);
  });

  socket.on('session_finished', (d) => {
    console.log('session_finished', d);
    // optionally disconnect
    setTimeout(() => {
      console.log('teacher disconnecting...');
      socket.disconnect();
      process.exit(0);
    }, 1000);
  });

  socket.on('connect_error', (err) => {
    console.error('connect_error', err);
  });

})();
