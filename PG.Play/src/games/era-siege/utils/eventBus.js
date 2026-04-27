// Tiny synchronous pub/sub. The sim emits events; the React HUD and audio
// router consume them. Synchronous on purpose — events fire inside the sim
// tick and the React HUD aggregates them per RAF.

export function makeBus() {
  const listeners = new Map();
  return {
    on(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
      return () => listeners.get(name)?.delete(fn);
    },
    emit(name, payload) {
      const set = listeners.get(name);
      if (!set) return;
      for (const fn of set) {
        try { fn(payload); } catch { /* swallow — sim tick must not throw */ }
      }
    },
    clear() { listeners.clear(); },
  };
}
