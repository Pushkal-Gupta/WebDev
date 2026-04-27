// Storage adapter: localStorage if available, in-memory if not. PG.Play
// sometimes loads inside the embedded shell where localStorage throws
// in Safari private mode; the fallback keeps the tutorial-dismissed flag
// session-local in that case.

const mem = new Map();
let lsOK = null;

function probe() {
  if (lsOK !== null) return lsOK;
  try {
    const k = '__es_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    lsOK = true;
  } catch {
    lsOK = false;
  }
  return lsOK;
}

export const storage = {
  get(key) {
    if (probe()) {
      try { return localStorage.getItem(key); } catch { return mem.get(key) ?? null; }
    }
    return mem.get(key) ?? null;
  },
  set(key, value) {
    if (probe()) {
      try { localStorage.setItem(key, value); return; } catch { /* fall through */ }
    }
    mem.set(key, value);
  },
  remove(key) {
    if (probe()) {
      try { localStorage.removeItem(key); return; } catch { /* fall through */ }
    }
    mem.delete(key);
  },
};
