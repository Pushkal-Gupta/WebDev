/**
 * Main-thread wrapper for the analysis Web Worker.
 * Provides async API with LRU caching and cancellation support.
 */

let worker = null;
let requestId = 0;
const pending = new Map();
const cache = new Map();
const MAX_CACHE = 300;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./analysisWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, result } = e.data;
      const resolver = pending.get(id);
      if (resolver) {
        pending.delete(id);
        resolver(result);
      }
    };
  }
  return worker;
}

/**
 * Get top N engine lines for a position (async, off main thread).
 * Results are cached — repeated calls for the same FEN return instantly.
 */
export function getTopLinesAsync(fen, n = 3, depth = 2) {
  const key = `${fen}:${n}:${depth}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key));

  return new Promise((resolve) => {
    const id = ++requestId;
    pending.set(id, (result) => {
      if (cache.size >= MAX_CACHE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, result);
      resolve(result);
    });
    getWorker().postMessage({ type: 'getTopLines', id, fen, n, depth });
  });
}

/**
 * Review a single move off the main thread.
 * Returns { bestScore, bestUci, playedScore } with the same semantics as the
 * prior synchronous reviewEngine calls. Cached per (fenBefore, fenAfter, depth).
 */
export function reviewMoveAsync(fenBefore, fenAfter, depth = 2) {
  const key = `review:${fenBefore}:${fenAfter}:${depth}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key));

  return new Promise((resolve) => {
    const id = ++requestId;
    pending.set(id, (result) => {
      if (cache.size >= MAX_CACHE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, result);
      resolve(result);
    });
    getWorker().postMessage({ type: 'reviewMove', id, fenBefore, fenAfter, depth });
  });
}

/**
 * Cancel all pending computations by terminating the worker.
 * A new worker is created lazily on the next request.
 */
export function cancelPending() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  for (const resolver of pending.values()) {
    resolver([]);
  }
  pending.clear();
}

/**
 * Pre-compute evaluations for all FENs with progress callback.
 * Returns a promise that resolves when all positions are computed.
 * @param {string[]} fens - Array of FEN strings
 * @param {number} n - Number of top lines per position
 * @param {function} onProgress - Called with (completed, total)
 * @returns {Promise<void>}
 */
export async function precomputeAll(fens, n = 3, onProgress = null) {
  const total = fens.length;
  let completed = 0;
  for (const fen of fens) {
    await getTopLinesAsync(fen, n);
    completed++;
    if (onProgress) onProgress(completed, total);
  }
}

/**
 * Progressive two-pass precompute: shallow pass first (fast), then deep pass.
 * Each pass fires per-position callbacks so the UI can update incrementally.
 * @param {string[]} fens
 * @param {object} opts
 * @returns {Promise<void>}
 */
export async function precomputeProgressive(fens, {
  n = 3,
  shallowDepth = 1,
  deepDepth = 2,
  onProgress = null,
  onPositionDone = null,
  signal = null,
} = {}) {
  const total = fens.length;
  // Shallow pass — fast rough evals
  for (let i = 0; i < total; i++) {
    if (signal?.aborted) return;
    const result = await getTopLinesAsync(fens[i], n, shallowDepth);
    onPositionDone?.(i, fens[i], result, 'shallow');
    onProgress?.(i + 1, total, 'shallow');
  }
  // Deep pass — refined evals
  for (let i = 0; i < total; i++) {
    if (signal?.aborted) return;
    const result = await getTopLinesAsync(fens[i], n, deepDepth);
    onPositionDone?.(i, fens[i], result, 'deep');
    onProgress?.(i + 1, total, 'deep');
  }
}
