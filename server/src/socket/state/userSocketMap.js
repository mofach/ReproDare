// src/socket/state/userSocketMap.js
// simple wrapper around Map to keep API stable
export const userSocketMap = new Map();

export function getSocketIdForUser(userId) {
  return userSocketMap.get(`${userId}`);
}

export function setSocketIdForUser(userId, socketId) {
  return userSocketMap.set(`${userId}`, socketId);
}

export function deleteSocketForUser(userId) {
  return userSocketMap.delete(`${userId}`);
}
