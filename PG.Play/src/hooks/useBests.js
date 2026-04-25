import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase.js';
import { getRunId, clearRun } from '../lib/runToken.js';

/**
 * Personal bests per game for the signed-in user. Reads the pgplay_best
 * view; writes go through the submit-score edge function so the leaderboard
 * stays trustworthy. Offline / signed-out users just keep a local snapshot.
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
      const next = {
        ...prev,
        [gameId]: { best: score, plays: (prev[gameId]?.plays ?? 0) + 1, last: new Date().toISOString() },
      };
      localStorage.setItem('pd-bests', JSON.stringify(next));
      return next;
    });

    if (!user) return;
    const run_id = getRunId(gameId);
    if (!run_id) return; // No run token — game forgot to call startRun. Drop server submit.

    const { error } = await supabase.functions.invoke('submit-score', {
      body: { game_id: gameId, score, run_id, meta },
    });
    if (error) {
      console.warn('submit-score failed', error);
    }
    clearRun(gameId);
  }, [user]);

  return { bests, submit };
}
