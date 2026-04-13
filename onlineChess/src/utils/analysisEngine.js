/**
 * Main-thread wrapper for the analysis Web Worker.
 * Provides async API with LRU caching and cancellation support.
 */

import { getStockfishAnalysis, analysisNewGame } from './stockfishEngine';

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
 * Four-pass progressive Stockfish analysis.
 * Each pass evaluates all positions at increasing depth, updating the UI between positions.
 *
 * Pass depths and target timings (for ~38 move / ~39 FEN game):
 *   Pass 0: depth 12 → ~15-30s   (quick usable results)
 *   Pass 1: depth 15 → ~45s-1min (solid classifications)
 *   Pass 2: depth 18 → ~1-2min   (near-final accuracy)
 *   Pass 3: depth 22 → ~3-5min   (chess.com-grade depth)
 *
 * @param {string[]} fens - All unique FENs to evaluate
 * @param {object} opts
 * @returns {Promise<Map<string, { score: number, bestMove: string, depth: number }>>}
 */

export const ANALYSIS_PASSES = [
  { depth: 12, label: 'Quick scan' },
  { depth: 15, label: 'Refining' },
  { depth: 18, label: 'Deep analysis' },
  { depth: 22, label: 'Full depth' },
];

export async function analyzeGame(fens, {
  onPositionDone = null,
  onPassStart = null,
  onPassDone = null,
  onProgress = null,
  signal = null,
} = {}) {
  await analysisNewGame();
  const evals = new Map();

  for (let p = 0; p < ANALYSIS_PASSES.length; p++) {
    if (signal?.aborted) return evals;
    const { depth, label } = ANALYSIS_PASSES[p];
    onPassStart?.(p, depth, label);

    for (let i = 0; i < fens.length; i++) {
      if (signal?.aborted) return evals;
      const fen = fens[i];
      const existing = evals.get(fen);
      if (existing && existing.depth >= depth) {
        onProgress?.(i + 1, fens.length, p);
        continue;
      }
      try {
        const result = await getStockfishAnalysis(fen, { depth });
        evals.set(fen, { score: result.score, bestMove: result.bestMove, depth });
        onPositionDone?.(i, fen, result, p);
      } catch (err) {
        // Timeout or error — skip this position at this depth, keep previous eval
        console.warn(`Stockfish analysis failed for position ${i} at depth ${depth}:`, err.message);
      }
      onProgress?.(i + 1, fens.length, p);
    }
    onPassDone?.(p, evals);
  }
  return evals;
}
