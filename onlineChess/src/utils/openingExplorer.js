/**
 * Opening Explorer — uses the Lichess Explorer API.
 * Falls back to a Supabase Edge Function proxy if the direct API returns 401.
 */

const LICHESS_EXPLORER = 'https://explorer.lichess.ovh/lichess';
const MASTERS_EXPLORER = 'https://explorer.lichess.ovh/masters';
const PROXY_URL = 'https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/opening-explorer';

const cache = new Map();
let useProxy = true; // direct Lichess API requires auth; route through Edge Function proxy

/**
 * Fetch opening explorer data for a FEN position.
 * @param {string} fen
 * @param {'lichess'|'masters'} db
 * @returns {Promise<ExplorerData|null>}
 */
export async function fetchExplorerData(fen, db = 'lichess') {
  const key = `${db}:${fen}`;
  if (cache.has(key)) return cache.get(key);

  try {
    let data;

    if (!useProxy) {
      // Try direct Lichess API first
      const base = db === 'masters' ? MASTERS_EXPLORER : LICHESS_EXPLORER;
      const params = new URLSearchParams({ fen });
      if (db === 'lichess') {
        params.set('speeds', 'blitz,rapid,classical');
        params.set('ratings', '1600,1800,2000,2200,2500');
      }

      const res = await fetch(`${base}?${params}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (res.status === 401 || res.status === 403) {
        // Direct API blocked -- switch to proxy for this session
        useProxy = true;
      } else if (res.ok) {
        data = await res.json();
      } else {
        return null;
      }
    }

    if (useProxy && !data) {
      // Use Supabase Edge Function proxy
      const params = new URLSearchParams({ fen, db });
      if (db === 'lichess') {
        params.set('speeds', 'blitz,rapid,classical');
        params.set('ratings', '1600,1800,2000,2200,2500');
      }

      const res = await fetch(`${PROXY_URL}?${params}`, {
        headers: {
          Accept: 'application/json',
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return null;
      data = await res.json();
      if (data._error) {
        // Proxy also couldn't reach Lichess
        return null;
      }
    }

    if (!data) return null;

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

    if (cache.size > 500) cache.delete(cache.keys().next().value);
    cache.set(key, result);
    return result;
  } catch (err) {
    return null;
  }
}
