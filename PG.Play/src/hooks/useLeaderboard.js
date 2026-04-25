import { useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

/**
 * Public top-N leaderboard for a game. Reads from the leaderboard edge
 * function (which serves with a 15s edge cache). No auth required.
 */
export function useLeaderboard(gameId, limit = 10) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.functions.invoke('leaderboard', {
        method: 'GET',
        body: undefined,
        // Supabase JS doesn't support GET query strings directly; fall back to fetch.
      });
      // Fallback path for GET via fetch since Supabase functions.invoke is POST-by-default.
      let result = data;
      if (error || !result) {
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leaderboard?game_id=${encodeURIComponent(gameId)}&limit=${limit}`;
          const res = await fetch(url, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
          });
          if (res.ok) result = await res.json();
        } catch { /* ignore */ }
      }
      if (cancelled) return;
      setRows(result?.rows || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [gameId, limit]);

  return { rows, loading };
}
