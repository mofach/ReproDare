// server/test/student-autojoin.js
// Node ESM: run with `node server/test/student-autojoin.js`
import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const BASE = 'http://localhost:4000';

async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

async function fetchSessions() {
  const r = await fetch(`${BASE}/sessions`);
  return r.json();
}

function delay(ms) { return new Promise(res=>setTimeout(res, ms)); }

(async () => {
  console.log('Student: logging in...');
  const loginRes = await login('aqil@example.com', 'aqil123');
  if (!loginRes?.accessToken) return console.error('login failed', loginRes);
  const token = loginRes.accessToken;

  const socket = io(BASE, { auth: { token: `Bearer ${token}` } });

  socket.on('connect', async () => {
    console.log('student connected', socket.id);

    // find latest waiting session and join
    try {
      const sessRes = await fetchSessions();
      // sessRes may be { items: [...] } or array — adapt
      const items = sessRes.items ?? sessRes;
      const waiting = Array.isArray(items) ? items.filter(s => s.status === 'waiting') : [];
      const latest = waiting.sort((a,b) => (Number(b.id) - Number(a.id)))[0];
      if (latest) {
        console.log('auto-joining session', latest.id);
        socket.emit('student_join_session', { sessionId: String(latest.id) }, (cb) => {
          console.log('join cb', cb);
        });
      } else {
        console.log('no waiting session found');
      }
    } catch (e) {
      console.error('failed to auto-join', e);
    }
  });

  socket.on('session_lobby_update', (d) => {
    console.log('lobby update', d);
  });

  socket.on('turn_started', (d) => {
    console.log('turn_started public', d);
  });

  socket.on('your_turn', (d) => {
    console.log('your_turn (private)', d);
    // auto-answer after 700ms
    setTimeout(() => {
      socket.emit('submit_answer', { sessionId: d.sessionId, turnId: d.turnId, answer_text: 'Jawaban otomatis dari student' }, (cb) => {
        console.log('submit cb', cb);
      });
    }, 700);
  });

  socket.on('turn_graded', (d) => {
    console.log('turn_graded (student got grade):', d);
  });

  socket.on('session_finished', (d) => {
    console.log('session_finished', d);
    setTimeout(() => {
      socket.disconnect();
      process.exit(0);
    }, 800);
  });

  socket.on('connect_error', (err) => {
    console.error('connect_error', err);
  });

})();
