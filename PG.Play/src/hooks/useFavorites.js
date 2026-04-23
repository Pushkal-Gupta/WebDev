import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase.js';

const LS_KEY = 'pd-favs';

const readLocal = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
};

/**
 * Favorites live in localStorage when signed-out, and in Supabase when signed-in.
 * On sign-in, local favorites merge up into the DB; on sign-out, DB copy stays
 * server-side while the UI falls back to localStorage.
 */
export function useFavorites(user) {
  const [favs, setFavs] = useState(readLocal);
  const lastUserId = useRef(null);

  // Load / merge on sign-in
  useEffect(() => {
    if (!user) { lastUserId.current = null; return; }
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;

    let cancelled = false;
    (async () => {
      const local = readLocal();
      const localIds = Object.keys(local).filter((k) => local[k]);

      // Merge local favorites into DB (ignore conflicts)
      if (localIds.length > 0) {
        await supabase.from('pgplay_favorites').upsert(
          localIds.map((game_id) => ({ user_id: user.id, game_id })),
          { onConflict: 'user_id,game_id' }
        );
      }

      const { data } = await supabase
        .from('pgplay_favorites')
        .select('game_id')
        .eq('user_id', user.id);

      if (cancelled) return;
      const next = {};
      (data || []).forEach((row) => { next[row.game_id] = true; });
      setFavs(next);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const toggle = useCallback(async (gameId) => {
    setFavs((prev) => {
      const next = { ...prev, [gameId]: !prev[gameId] };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
    if (user) {
      const already = !!favs[gameId];
      if (already) {
        await supabase.from('pgplay_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', gameId);
      } else {
        await supabase.from('pgplay_favorites')
          .upsert({ user_id: user.id, game_id: gameId });
      }
    }
  }, [user, favs]);

  const clear = useCallback(async () => {
    setFavs({});
    localStorage.setItem(LS_KEY, JSON.stringify({}));
    if (user) {
      await supabase.from('pgplay_favorites').delete().eq('user_id', user.id);
    }
  }, [user]);

  return { favs, toggle, clear };
}
