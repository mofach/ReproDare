// server/test/teacher-test.js
import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const baseUrl = 'http://localhost:4000';

async function login(email, password) {
  const r = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

(async () => {
  const loginRes = await login('pirda@example.com','pirda123');
  if (!loginRes.accessToken) return console.error('login failed', loginRes);
  const token = loginRes.accessToken;
  const socket = io(baseUrl, { auth: { token: `Bearer ${token}` } });

  socket.on('connect', () => console.log('teacher connected', socket.id));
  socket.on('session_lobby_update', d => console.log('lobby update', d));
  socket.on('session_started', d => console.log('session_started', d));
  socket.on('turn_started', d => console.log('turn_started', d));
  socket.on('answer_submitted', d => console.log('answer_submitted', d));
  socket.on('turn_graded', d => console.log('turn_graded', d));
  socket.on('session_finished', d => console.log('session_finished', d));
  socket.on('connect_error', (err) => console.error('connect_error', err));

  // create a session
  socket.emit('teacher_create_session', { categoryId: '1', title: 'Demo' }, (res) => {
    console.log('create cb', res);
    if (!res.ok) return;
    const sessionId = String(res.session.id);

    // start after 1s
    setTimeout(() => {
      socket.emit('teacher_start_session', { sessionId }, (r) => console.log('start cb', r));
    }, 10000);

    // advance roulette after 3s
    setTimeout(() => {
      socket.emit('roulette_next', { sessionId }, (r) => console.log('next1 cb', r));
    }, 3000);

    // call next again later (simulate teacher clicking next)
    setTimeout(() => {
      socket.emit('roulette_next', { sessionId }, (r) => console.log('next2 cb', r));
    }, 9000);
  });

})();