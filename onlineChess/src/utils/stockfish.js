import { getStockfishMove } from './stockfishEngine';
import { getLocalBestMove } from './localAI';

// Map app strength (7-10) to Stockfish UCI parameters.
// Skill Level already enforces strength; movetime keeps responses snappy.
const STRENGTH_MAP = {
  7:  { skillLevel: 5,  depth: 6,  movetime: 200 },
  8:  { skillLevel: 10, depth: 8,  movetime: 350 },
  9:  { skillLevel: 15, depth: 10, movetime: 500 },
  10: { skillLevel: 20, depth: 12, movetime: 700 },
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
    return getLocalBestMove(fen, strength);
  }
}
