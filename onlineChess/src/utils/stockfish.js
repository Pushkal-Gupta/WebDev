import { getStockfishMove } from './stockfishEngine';
import { getLocalBestMove } from './localAI';

// Map app strength (7-10) to Stockfish UCI parameters
const STRENGTH_MAP = {
  7:  { skillLevel: 5,  depth: 8,  movetime: 500  },
  8:  { skillLevel: 10, depth: 10, movetime: 800  },
  9:  { skillLevel: 15, depth: 12, movetime: 1200 },
  10: { skillLevel: 20, depth: 15, movetime: 2000 },
};

/**
 * Get best move using local Stockfish WASM engine, with local AI fallback.
 * @param {string} fen
 * @param {{ strength?: number }} opts
 * @returns {Promise<string>} UCI move like "e2e4"
 */
export async function getBestMove(fen, { strength = 10 } = {}) {
  const config = STRENGTH_MAP[Math.min(10, Math.max(7, strength))];
  try {
    return await getStockfishMove(fen, config);
  } catch (err) {
    console.warn('Stockfish WASM failed, using local AI:', err.message);
    return getLocalBestMove(fen, strength);
  }
}
