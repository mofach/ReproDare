// src/socket/state/sessionState.js
/**
 * SessionStateManager (in-memory)
 *
 * Structure per session:
 * {
 *   sessionId: string,
 *   teacherId: string|null,
 *   categoryId: string|null,
 *   participants: Map<userId, { participantId, userId }>,
 *   queue: Array<userId>,
 *   currentTurn: { turnId, participantId, userId, cardId } | null,
 *   finishedSet: Set<userId>,
 *   lock: boolean,
 * }
 *
 * NOTE:
 * - All identifiers are stored as strings to avoid BigInt JSON issues in memory.
 * - This is ephemeral. For multi-instance use, persist essential state in Redis.
 */

export class SessionStateManager {
  constructor() {
    // internal map: sessionId (string) -> state object
    this._map = new Map();
  }

  /**
   * Ensure a state object exists for sessionId; return it.
   * @param {string|number|bigint} sessionId
   */
  ensure(sessionId) {
    const id = String(sessionId);
    if (!this._map.has(id)) {
      this._map.set(id, {
        sessionId: id,
        teacherId: null,
        categoryId: null,
        participants: new Map(), // userId -> { participantId, userId }
        queue: [],
        currentTurn: null,
        finishedSet: new Set(),
        lock: false,
      });
    }
    return this._map.get(id);
  }

  /**
   * Get state object or null if not exists
   * @param {string|number|bigint} sessionId
   */
  get(sessionId) {
    return this._map.get(String(sessionId)) || null;
  }

  /**
   * Replace state object entirely
   * @param {string|number|bigint} sessionId
   * @param {object} state
   */
  set(sessionId, state) {
    this._map.set(String(sessionId), state);
  }

  /**
   * Delete state
   * @param {string|number|bigint} sessionId
   */
  delete(sessionId) {
    this._map.delete(String(sessionId));
  }

  /**
   * Try to acquire lock. Returns true if lock acquired, false if already locked.
   * @param {string|number|bigint} sessionId
   */
  acquireLock(sessionId) {
    const st = this.ensure(sessionId);
    if (st.lock) return false;
    st.lock = true;
    return true;
  }

  /**
   * Release lock (idempotent)
   * @param {string|number|bigint} sessionId
   */
  releaseLock(sessionId) {
    const st = this.get(sessionId);
    if (!st) return;
    st.lock = false;
  }

  /**
   * For debugging: list all active session ids
   */
  listSessionIds() {
    return Array.from(this._map.keys());
  }
}

export default SessionStateManager;
