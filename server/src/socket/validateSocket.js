// src/socket/validateSocket.js
/**
 * Wrapper for Zod validation on socket events.
 * - schema: a Zod object / Zod schema
 * - payload: the data sent by client
 *
 * Returns:
 *   { ok: true, data }
 *   { ok: false, error: "message" }
 */

export function validateSocket(socket, schema, payload) {
  try {
    const parsed = schema.parse(payload);
    return { ok: true, data: parsed };
  } catch (err) {
    if (err.errors) {
      // Aggregate Zod messages
      const msg = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { ok: false, error: msg };
    }
    return { ok: false, error: err.message };
  }
}
