// src/socket/utils.js
export const toBigInt = (v) => (typeof v === 'bigint' ? v : BigInt(v));

export function roomName(sessionId) {
  return `session:${sessionId}`;
}
