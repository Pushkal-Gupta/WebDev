/**
 * Singleton wrapper for Stockfish 18 WASM running in a Web Worker.
 * Communicates via UCI protocol (postMessage / onmessage).
 */

let worker = null;
let isReady = false;
let readyResolve = null;
let bestMoveResolve = null;
let bestMoveReject = null;
let bestMoveTimer = null;

// Analysis state — captures the latest score from `info` lines before `bestmove`
let lastInfoScore = null;  // { cp: number } or { mate: number }
let lastInfoPv = null;     // PV string (first move = best move from info)

function parseInfoLine(line) {
  // Parse: info depth 15 seldepth 22 multipv 1 score cp -31 nodes ... pv e2e4 e7e5 ...
  const scoreMatch = line.match(/\bscore (cp (-?\d+)|mate (-?\d+))/);
  if (scoreMatch) {
    if (scoreMatch[2] !== undefined) {
      lastInfoScore = { cp: parseInt(scoreMatch[2]) };
    } else if (scoreMatch[3] !== undefined) {
      lastInfoScore = { mate: parseInt(scoreMatch[3]) };
    }
  }
  const pvMatch = line.match(/\bpv (.+)$/);
  if (pvMatch) {
    lastInfoPv = pvMatch[1].trim();
  }
}

function handleMessage(line) {
  if (typeof line !== 'string') return;
  if (line === 'uciok') {
    isReady = true;
    if (readyResolve) { readyResolve(); readyResolve = null; }
  } else if (line === 'readyok') {
    if (readyResolve) { readyResolve(); readyResolve = null; }
  } else if (line.startsWith('info') && line.includes('score')) {
    parseInfoLine(line);
  } else if (line.startsWith('bestmove')) {
    const move = line.split(' ')[1];
    clearTimeout(bestMoveTimer);
    if (bestMoveResolve) { bestMoveResolve(move); bestMoveResolve = null; bestMoveReject = null; }
  }
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker('./stockfish/stockfish-18-lite-single.js');
  worker.onmessage = (e) => handleMessage(e.data);
  worker.postMessage('uci');
  return worker;
}

function waitForReady() {
  return new Promise((resolve) => {
    if (isReady) { resolve(); return; }
    readyResolve = resolve;
  });
}

function waitForIsReady() {
  return new Promise((resolve) => {
    readyResolve = resolve;
    getWorker().postMessage('isready');
  });
}

function waitForBestMove(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    bestMoveResolve = resolve;
    bestMoveReject = reject;
    bestMoveTimer = setTimeout(() => {
      bestMoveReject = null;
      bestMoveResolve = null;
      reject(new Error('Stockfish WASM timeout'));
    }, timeoutMs);
  });
}

/**
 * Get best move from local Stockfish WASM engine.
 * @param {string} fen
 * @param {{ depth?: number, movetime?: number, skillLevel?: number }} opts
 * @returns {Promise<string>} UCI move like "e2e4" or "e7e8q"
 */
export async function getStockfishMove(fen, { depth = 12, movetime, skillLevel } = {}) {
  const w = getWorker();
  await waitForReady();

  // Configure skill level
  if (skillLevel !== undefined) {
    w.postMessage(`setoption name Skill Level value ${skillLevel}`);
  }

  w.postMessage('ucinewgame');
  await waitForIsReady();

  w.postMessage(`position fen ${fen}`);

  if (movetime) {
    w.postMessage(`go movetime ${movetime}`);
  } else {
    w.postMessage(`go depth ${depth}`);
  }

  return waitForBestMove();
}

/**
 * Send `ucinewgame` + `isready` once at the start of an analysis session.
 * Preserving the hash table across positions in the same game makes deeper depths faster.
 */
export async function analysisNewGame() {
  const w = getWorker();
  await waitForReady();
  w.postMessage('setoption name Skill Level value 20');
  w.postMessage('ucinewgame');
  await waitForIsReady();
}

/**
 * Analyze a single position with Stockfish at a given depth.
 * Returns the best move, centipawn score (from white's POV), and mate-in if applicable.
 * @param {string} fen
 * @param {{ depth?: number }} opts
 * @returns {Promise<{ bestMove: string, score: number, mateIn: number|null }>}
 */
export async function getStockfishAnalysis(fen, { depth = 12 } = {}) {
  const w = getWorker();
  await waitForReady();

  // Reset info capture
  lastInfoScore = null;
  lastInfoPv = null;

  w.postMessage(`position fen ${fen}`);
  w.postMessage(`go depth ${depth}`);

  // Timeout scales with depth — deep positions can take a while
  const timeoutMs = Math.max(10000, depth * 2500);
  const bestMove = await waitForBestMove(timeoutMs);

  // Determine which side is to move for score normalization
  const isBlackToMove = fen.split(' ')[1] === 'b';

  let score = 0;
  let mateIn = null;

  if (lastInfoScore) {
    if (lastInfoScore.cp !== undefined) {
      score = lastInfoScore.cp;
    } else if (lastInfoScore.mate !== undefined) {
      mateIn = lastInfoScore.mate;
      // Convert mate distance to large cp value (99999 scale)
      score = lastInfoScore.mate > 0 ? 99999 : -99999;
    }
    // Stockfish reports from side-to-move's perspective; normalize to white's POV
    if (isBlackToMove) score = -score;
  }

  return { bestMove, score, mateIn };
}

export function terminateEngine() {
  if (worker) {
    worker.postMessage('quit');
    worker.terminate();
    worker = null;
    isReady = false;
  }
}
