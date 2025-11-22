// src/index.js
import createApp from './app.js';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import dotenv from 'dotenv';
import { initSocket } from './socket/index.js'; // we'll create/ensure this when refactor socket

dotenv.config();

const app = createApp();
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: { origin: true, credentials: true }
});

// Keep conditional init so server starts even if socket/index.js not implemented yet.
// When we refactor socket folder, ensure it exports `initSocket(io)`.
if (typeof initSocket === 'function') {
  initSocket(io);
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
