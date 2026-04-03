/**
 * Opening Explorer — uses the free Lichess Explorer API.
 * https://lichess.org/api#tag/Opening-Explorer
 */

const LICHESS_EXPLORER = 'https://explorer.lichess.ovh/lichess';
const MASTERS_EXPLORER = 'https://explorer.lichess.ovh/masters';

const cache = new Map();

/**
 * Fetch opening explorer data for a FEN position.
 * @param {string} fen
 * @param {'lichess'|'masters'} db
 * @returns {Promise<ExplorerData|null>}
 *
 * ExplorerData: { opening, moves, white, draws, black, topGames }
 *   moves[]: { san, uci, white, draws, black, averageRating }
 */
export async function fetchExplorerData(fen, db = 'lichess') {
  const key = `${db}:${fen}`;
  if (cache.has(key)) return cache.get(key);

  const base = db === 'masters' ? MASTERS_EXPLORER : LICHESS_EXPLORER;
  const params = new URLSearchParams({ fen });
  if (db === 'lichess') {
    params.set('speeds', 'blitz,rapid,classical');
    params.set('ratings', '1600,1800,2000,2200,2500');
  }

  try {
    const res = await fetch(`${base}?${params}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();

    const result = {
      opening: data.opening?.name || null,
      eco: data.opening?.eco || null,
      white: data.white || 0,
      draws: data.draws || 0,
      black: data.black || 0,
      moves: (data.moves || []).slice(0, 12).map(m => ({
        san: m.san,
        uci: m.uci,
        white: m.white || 0,
        draws: m.draws || 0,
        black: m.black || 0,
        averageRating: m.averageRating || 0,
      })),
      topGames: (data.topGames || []).slice(0, 4).map(g => ({
        id: g.id,
        white: g.white?.name || '?',
        whiteRating: g.white?.rating,
        black: g.black?.name || '?',
        blackRating: g.black?.rating,
        winner: g.winner,
        year: g.year,
      })),
    };

    cache.set(key, result);
    return result;
  } catch (err) {
    console.error('Explorer fetch error:', err);
    return null;
  }
}
