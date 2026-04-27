// Tiny object pool. Used for projectiles, particles, and damage numbers —
// the three high-churn allocations in the hot path.

export function makePool(factory, reset, capacity = 256) {
  const free = [];
  const live = [];
  for (let i = 0; i < capacity; i++) free.push(factory());
  return {
    live,
    acquire(init) {
      const obj = free.pop() || factory();
      reset(obj);
      if (init) init(obj);
      live.push(obj);
      return obj;
    },
    release(obj) {
      const idx = live.indexOf(obj);
      if (idx >= 0) {
        // Swap-pop — O(1) removal.
        const last = live.length - 1;
        if (idx !== last) live[idx] = live[last];
        live.pop();
        free.push(obj);
      }
    },
    // Drain dead objects in-place. The predicate returns true to keep.
    sweep(keep) {
      let w = 0;
      for (let i = 0; i < live.length; i++) {
        const o = live[i];
        if (keep(o)) {
          live[w++] = o;
        } else {
          free.push(o);
        }
      }
      live.length = w;
    },
    clear() {
      while (live.length) free.push(live.pop());
    },
  };
}
