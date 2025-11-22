// src/socket/utils.js
/**
 * Small helpers for socket layer
 */

export function roomName(sessionId) {
  return `session:${sessionId}`;
}

/**
 * Utility to safely convert numeric inputs to BigInt if needed.
 * NOTE: DB commands use BigInt, but memory state uses string IDs.
 */
export function toBigIntSafe(v) {
  if (v === undefined || v === null) throw new Error('value required');
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(v);
  if (typeof v === 'string') {
    if (!/^-?\d+$/.test(v)) throw new Error(`invalid numeric string "${v}"`);
    return BigInt(v);
  }
  throw new Error(`invalid type for toBigIntSafe: ${typeof v}`);
}
