import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

/**
 * Personal bests per game for the signed-in user. Offline fallback is a
 * read-only localStorage snapshot so the UI still has something to show.
 */
export function useBests(user) {
  const [bests, setBests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pd-bests') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('pgplay_best')
        .select('game_id, best, plays, last_played')
        .eq('user_id', user.id);
      if (cancelled) return;
      const next = {};
      (data || []).forEach((row) => {
        next[row.game_id] = { best: row.best, plays: row.plays, last: row.last_played };
      });
      setBests(next);
      localStorage.setItem('pd-bests', JSON.stringify(next));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const submit = useCallback(async (gameId, score, meta = {}) => {
    setBests((prev) => {
      const cur = prev[gameId]?.best ?? 0;
      if (score <= cur) return prev;
      const next = { ...prev, [gameId]: { best: score, plays: (prev[gameId]?.plays ?? 0) + 1, last: new Date().toISOString() } };
      localStorage.setItem('pd-bests', JSON.stringify(next));
      return next;
    });
    if (user) {
      await supabase.from('pgplay_scores').insert({
        user_id: user.id,
        game_id: gameId,
        score,
        meta,
      });
    }
  }, [user]);

  return { bests, submit };
}
