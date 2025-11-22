// src/utils/helper.js
/**
 * Small helper utilities used across the backend.
 * - toBigInt: converts number/string to BigInt (used before writing to Prisma)
 * - safeStringId: ensures ids in responses are strings (for tokens / JSON)
 * - nowIso: helper for timestamps (optional)
 *
 * Keep file minimal to avoid accidental heavy deps.
 */

/**
 * Convert value to BigInt. Accepts number, numeric-string, or BigInt.
 * Throws if value is falsy or not numeric.
 * @param {string|number|bigint} v
 * @returns {bigint}
 */
export function toBigInt(v) {
  if (v === undefined || v === null) {
    throw new Error('toBigInt: value is required');
  }
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(v);
  if (typeof v === 'string') {
    // allow numeric strings e.g. "123"
    if (!/^-?\d+$/.test(v)) throw new Error(`toBigInt: invalid numeric string "${v}"`);
    return BigInt(v);
  }
  throw new Error(`toBigInt: unsupported type ${typeof v}`);
}

/**
 * Normalize id for JSON responses (always string) to avoid BigInt JSON issues.
 * @param {any} id
 * @returns {string|undefined}
 */
export function safeStringId(id) {
  if (id === undefined || id === null) return undefined;
  return typeof id === 'bigint' ? id.toString() : String(id);
}

/**
 * Return current ISO timestamp string
 */
export function nowIso() {
  return new Date().toISOString();
}

export default {
  toBigInt,
  safeStringId,
  nowIso,
};
