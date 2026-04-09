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

function handleMessage(line) {
  if (typeof line !== 'string') return;
  if (line === 'uciok') {
    isReady = true;
    if (readyResolve) { readyResolve(); readyResolve = null; }
  } else if (line === 'readyok') {
    if (readyResolve) { readyResolve(); readyResolve = null; }
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

export function terminateEngine() {
  if (worker) {
    worker.postMessage('quit');
    worker.terminate();
    worker = null;
    isReady = false;
  }
}
