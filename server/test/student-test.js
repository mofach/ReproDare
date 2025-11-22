// server/test/student-test.js  (auto-join latest waiting session)
import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const baseUrl = 'http://localhost:4000';
async function login(email,password){
  const r = await fetch(`${baseUrl}/auth/login`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  return r.json();
}

async function getSessions(){
  const r = await fetch(`${baseUrl}/sessions`);
  return r.json();
}

(async () => {
  const res = await login('aqil@example.com','aqil123');
  if (!res.accessToken) return console.error('student login failed', res);
  const token = res.accessToken;
  const socket = io(baseUrl, { auth: { token: `Bearer ${token}` } });

  socket.on('connect', async () => {
    console.log('student connected', socket.id);

    // find latest waiting session and auto-join
    try {
      const sess = await getSessions();
      const waiting = Array.isArray(sess.items) ? sess.items.filter(s=>s.status==='waiting') : [];
      const latest = waiting.sort((a,b)=> (b.id - a.id))[0];
      if (latest) {
        console.log('auto-joining session', latest.id);
        socket.emit('student_join_session', { sessionId: String(latest.id) }, (cb) => {
          console.log('join cb', cb);
        });
      } else {
        console.log('no waiting session found. You can join manually later with session id.');
      }
    } catch (e) {
      console.error('failed to fetch sessions', e);
    }
  });

  socket.on('session_lobby_update', d => console.log('lobby update', d));
  socket.on('turn_started', d => console.log('turn_started public', d));
  socket.on('your_turn', d => {
    console.log('your_turn (private)', d);
    setTimeout(() => {
      socket.emit('submit_answer', { sessionId: d.sessionId, turnId: d.turnId, answer_text: 'Jawaban demo' }, (cb) => {
        console.log('submit cb', cb);
      });
    }, 1000);
  });
  socket.on('turn_graded', d => console.log('turn_graded', d));
})();
