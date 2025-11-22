// src/socket/state/sessionState.js
// SessionStateManager stores per-session ephemeral state
export class SessionStateManager {
  constructor() {
    // map sessionId -> state object
    this._map = new Map();
  }

  ensure(sessionId) {
    const id = `${sessionId}`;
    if (!this._map.has(id)) {
      this._map.set(id, {
        sessionId: id,
        teacherId: null,
        categoryId: null,
        participants: new Map(), // userId -> { participantId, userId }
        queue: [],
        currentTurn: null, // { turnId, participantId, userId, cardId }
        finishedSet: new Set(),
        lock: false, // concurrency guard
      });
    }
    return this._map.get(id);
  }

  get(sessionId) {
    return this._map.get(`${sessionId}`) || null;
  }

  set(sessionId, state) {
    this._map.set(`${sessionId}`, state);
  }

  delete(sessionId) {
    this._map.delete(`${sessionId}`);
  }

  // small helper lock semantics
  acquireLock(sessionId) {
    const st = this.ensure(sessionId);
    if (st.lock) return false;
    st.lock = true;
    return true;
  }

  releaseLock(sessionId) {
    const st = this.get(sessionId);
    if (!st) return;
    st.lock = false;
  }
}
