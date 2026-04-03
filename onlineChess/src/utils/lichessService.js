// Lichess Public API — no auth required
const BASE = 'https://lichess.org/api';

/**
 * Fetch up to `maxGames` recent games for a Lichess username.
 * Returns array of { pgnStr, white, black, whiteRating, blackRating, result, timeControl, opening, url }
 */
export async function fetchLichessGames(username, maxGames = 20) {
  const name = username.trim();
  if (!name) throw new Error('Username required');

  const res = await fetch(
    `${BASE}/games/user/${encodeURIComponent(name)}?max=${maxGames}&opening=true&pgnInJson=true`,
    { headers: { Accept: 'application/x-ndjson' } }
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error(`"${username}" not found on Lichess`);
    throw new Error(`Lichess returned ${res.status}`);
  }

  const text = await res.text();
  const lines = text.trim().split('\n').filter(Boolean);
  const nameLower = name.toLowerCase();

  return lines.map(line => {
    try {
      const g = JSON.parse(line);
      const wName = g.players?.white?.user?.name || g.players?.white?.user?.id || '';
      const bName = g.players?.black?.user?.name || g.players?.black?.user?.id || '';
      const isWhite = wName.toLowerCase() === nameLower;
      const isWin  = isWhite ? g.winner === 'white' : g.winner === 'black';
      const isLoss = isWhite ? g.winner === 'black' : g.winner === 'white';

      // Build PGN from JSON fields
      const pgnStr = buildPgn(g, wName, bName);

      return {
        pgnStr,
        white:       wName,
        black:       bName,
        whiteRating: g.players?.white?.rating,
        blackRating: g.players?.black?.rating,
        color:       isWhite ? 'white' : 'black',
        result:      isWin ? 'win' : isLoss ? 'loss' : 'draw',
        timeControl: g.clock ? `${g.clock.initial / 60}+${g.clock.increment}` : null,
        opening:     g.opening?.name,
        url:         `https://lichess.org/${g.id}`,
        source:      'lichess',
      };
    } catch { return null; }
  }).filter(Boolean);
}

function buildPgn(g, wName, bName) {
  const headers = [];
  if (wName) headers.push(`[White "${wName}"]`);
  if (bName) headers.push(`[Black "${bName}"]`);
  if (g.players?.white?.rating) headers.push(`[WhiteElo "${g.players.white.rating}"]`);
  if (g.players?.black?.rating) headers.push(`[BlackElo "${g.players.black.rating}"]`);
  if (g.opening?.name) headers.push(`[Opening "${g.opening.name}"]`);
  if (g.opening?.eco) headers.push(`[ECO "${g.opening.eco}"]`);

  const result = g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2';
  headers.push(`[Result "${result}"]`);

  // If pgn field exists in JSON response, use it directly
  if (g.pgn) return g.pgn;

  // Otherwise build from moves string
  const moves = g.moves || '';
  return headers.join('\n') + '\n\n' + moves + ' ' + result;
}
