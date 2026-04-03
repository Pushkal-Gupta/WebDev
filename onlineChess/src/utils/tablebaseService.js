/**
 * Endgame Tablebase — uses the free Lichess Tablebase API.
 * Works for positions with 7 or fewer pieces on the board.
 * https://tablebase.lichess.ovh
 */

const BASE = 'https://tablebase.lichess.ovh/standard';
const cache = new Map();

/**
 * Count pieces in a FEN string.
 */
export function countPieces(fen) {
  const board = fen.split(' ')[0];
  return board.replace(/[/0-9]/g, '').length;
}

/**
 * @param {string} fen
 * @returns {Promise<TablebaseResult|null>}
 *
 * TablebaseResult: {
 *   category: 'win' | 'loss' | 'draw' | 'unknown',
 *   dtm: number|null,       // distance to mate (if available)
 *   dtz: number|null,       // distance to zeroing
 *   bestMove: { san, uci } | null,
 *   moves: [{ san, uci, category, dtz }]
 * }
 */
export async function fetchTablebase(fen) {
  if (countPieces(fen) > 7) return null;

  if (cache.has(fen)) return cache.get(fen);

  try {
    const res = await fetch(`${BASE}?fen=${encodeURIComponent(fen)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();

    // data.category: "win", "maybe-win", "cursed-win", "draw", "blessed-loss", "maybe-loss", "loss", "unknown"
    let category = 'unknown';
    if (['win', 'maybe-win', 'cursed-win'].includes(data.category)) category = 'win';
    else if (['loss', 'maybe-loss', 'blessed-loss'].includes(data.category)) category = 'loss';
    else if (data.category === 'draw') category = 'draw';

    const moves = (data.moves || []).slice(0, 8).map(m => {
      let mCat = 'unknown';
      if (['win', 'maybe-win', 'cursed-win'].includes(m.category)) mCat = 'loss'; // opponent wins = our loss after this move
      else if (['loss', 'maybe-loss', 'blessed-loss'].includes(m.category)) mCat = 'win';
      else if (m.category === 'draw') mCat = 'draw';
      return {
        san: m.san,
        uci: m.uci,
        category: mCat,
        dtz: m.dtz != null ? Math.abs(m.dtz) : null,
      };
    });

    const bestMove = moves.length > 0 ? { san: moves[0].san, uci: moves[0].uci } : null;

    const result = {
      category,
      dtm: data.dtm != null ? Math.abs(data.dtm) : null,
      dtz: data.dtz != null ? Math.abs(data.dtz) : null,
      bestMove,
      moves,
    };

    cache.set(fen, result);
    return result;
  } catch (err) {
    console.error('Tablebase fetch error:', err);
    return null;
  }
}
