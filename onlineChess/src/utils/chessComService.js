// Chess.com Public API — no auth required, CORS-friendly
const BASE = 'https://api.chess.com/pub/player';

/**
 * Fetch up to `maxGames` recent games for a Chess.com username.
 * Returns array of { pgnStr, white, black, whiteRating, blackRating, result, timeControl, url }
 */
export async function fetchChessComGames(username, maxGames = 20) {
  const name = username.trim().toLowerCase();
  if (!name) throw new Error('Username required');

  const archivesRes = await fetch(`${BASE}/${encodeURIComponent(name)}/games/archives`);
  if (!archivesRes.ok) {
    if (archivesRes.status === 404) throw new Error(`"${username}" not found on Chess.com`);
    throw new Error(`Chess.com returned ${archivesRes.status}`);
  }
  const { archives } = await archivesRes.json();
  if (!archives?.length) return [];

  const results = [];
  for (let i = archives.length - 1; i >= 0 && results.length < maxGames; i--) {
    let monthRes;
    try { monthRes = await fetch(archives[i]); } catch { continue; }
    if (!monthRes.ok) continue;
    const { games: monthGames } = await monthRes.json();
    if (!monthGames?.length) continue;
    for (let j = monthGames.length - 1; j >= 0 && results.length < maxGames; j--) {
      const g = monthGames[j];
      if (!g.pgn) continue;
      const isWin  = g.white?.username?.toLowerCase() === name
        ? g.white?.result === 'win'
        : g.black?.result === 'win';
      const isLoss = g.white?.username?.toLowerCase() === name
        ? g.white?.result !== 'win' && g.black?.result === 'win'
        : g.black?.result !== 'win' && g.white?.result === 'win';
      results.push({
        pgnStr:       g.pgn,
        white:        g.white?.username,
        black:        g.black?.username,
        whiteRating:  g.white?.rating,
        blackRating:  g.black?.rating,
        color:        g.white?.username?.toLowerCase() === name ? 'white' : 'black',
        result:       isWin ? 'win' : isLoss ? 'loss' : 'draw',
        timeControl:  g.time_control,
        url:          g.url,
        source:       'chess.com',
      });
    }
  }
  return results;
}
