// src/socket/state/userSocketMap.js
/**
 * Simple in-memory map userId -> socketId
 * - key: userId (string)
 * - value: socketId (string)
 *
 * Note: This is ephemeral (memory). For multi-instance scaling, replace
 * with Redis or another shared store and use socket.io-redis adapter.
 */

export const userSocketMap = new Map();

// Optional helpers (not required by handlers, but convenient if needed)
export function getSocketIdByUserId(userId) {
  return userSocketMap.get(String(userId));
}

export function setSocketIdForUser(userId, socketId) {
  userSocketMap.set(String(userId), socketId);
}

export function deleteSocketForUser(userId) {
  userSocketMap.delete(String(userId));
}

export default userSocketMap;
