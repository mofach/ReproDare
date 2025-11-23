// src/socket/index.js
import { verifyToken } from '../utils/jwt.js'; 
import registerGameHandlers from './handlers/game.handler.js';

let ioInstance;

// PERBAIKAN: Menerima 'io' yang sudah dibuat di src/index.js
export function initSocket(io) {
  ioInstance = io;

  // 1. Middleware: Cek Token
  io.use(async (socket, next) => {
    try {
      const tokenString = socket.handshake.auth.token;
      
      // Jika token tidak ada di handshake, cek header (opsional)
      if (!tokenString) {
          console.log("[Socket Auth] No token provided");
          return next(new Error("Authentication error"));
      }

      const token = tokenString.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (!decoded) {
          console.log("[Socket Auth] Invalid Token");
          return next(new Error("Invalid token"));
      }

      socket.user = decoded; 
      socket.userId = BigInt(decoded.id); 
      next();
    } catch (err) {
      console.error("[Socket Auth] Error:", err);
      next(new Error("Authentication error"));
    }
  });

  // 2. Event Connection
  io.on('connection', (socket) => {
    // LOG INI HARUS MUNCUL SEKARANG
    console.log(`✅ [SOCKET CONNECTED] User: ${socket.user.name} (ID: ${socket.userId}) | SocketID: ${socket.id}`);

    // Registrasi Handler Game
    registerGameHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`❌ [SOCKET DISCONNECT] User: ${socket.user.name} | Reason: ${reason}`);
    });
  });

  return io;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized!");
  }
  return ioInstance;
}