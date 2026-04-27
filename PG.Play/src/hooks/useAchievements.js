import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase.js';
import { sfx } from '../sound.js';

// Opinionated achievement set. Triggered locally off score-submits +
// play-open events. Persisted to localStorage always; synced to Supabase
// pgplay_achievements when signed in.
export const ACHIEVEMENTS = [
  { id: 'first-play',       label: 'First run',           desc: 'Opened any game.' },
  { id: 'first-score',      label: 'On the board',         desc: 'Submitted your first score.' },
  { id: 'three-in-a-row',   label: 'Three in a sitting',   desc: 'Played three different games in one session.' },
  { id: 'breadth-10',       label: 'Curious type',         desc: 'Played 10 different games.' },
  { id: 'all-originals',    label: 'Originals tour',       desc: 'Played all four PG.Play originals.' },
  { id: 'slipshot-10',      label: 'Slipshot cleared',    desc: 'Cleared a Slipshot round (10 kills).' },
  { id: 'fps-clear',        label: 'Sector cleared',      desc: 'Cleared the single-level FPS.' },
  { id: 'cutrope-perfect',  label: 'Three stars',         desc: 'Won a Cut-the-Rope level with all stars.' },
  { id: '2048-2048',        label: 'Hit 2048',            desc: 'Merged the elusive tile.' },
  { id: 'arena-champ',      label: 'Arena champion',      desc: 'Won an Arena round.' },
  { id: 'grudge-clear',     label: 'Made it through',     desc: 'Reached the flag in Grudgewood.' },
  { id: 'bricklands-finish', label: 'World traveller',    desc: 'Cleared all three Bricklands worlds.' },
  { id: 'bests-5',          label: 'Five bests',          desc: 'Holds personal bests in five different games.' },
  // Era Siege
  { id: 'era-siege-victor',   label: 'First crown',          desc: 'Won an Era Siege match.' },
  { id: 'era-siege-era5',     label: 'Void Ascendancy',     desc: 'Reached era 5 in Era Siege.' },
  { id: 'era-siege-conquest', label: 'Conquest victor',     desc: 'Won an Era Siege match on Conquest.' },
  { id: 'era-siege-fast-win', label: 'Lightning campaign', desc: 'Won an Era Siege match in under 90 seconds.' },
  { id: 'era-siege-daily',    label: 'Daily commander',    desc: 'Completed an Era Siege daily challenge.' },
];

const ORIGINAL_IDS = ['grudgewood', 'goalbound', 'slither', 'slipshot'];

const LS_KEY = 'pd-achievements';

const readLocal = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
};

export function useAchievements(user, bests) {
  const [unlocked, setUnlocked] = useState(readLocal);
  const [toast, setToast] = useState(null);
  const lastUserId = useRef(null);
  const unlockQueue = useRef([]);

  // Load / merge from DB on sign-in
  useEffect(() => {
    if (!user) { lastUserId.current = null; return; }
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;
    let cancelled = false;
    (async () => {
      const local = readLocal();
      const localIds = Object.keys(local).filter((k) => local[k]);
      if (localIds.length > 0) {
        await supabase.from('pgplay_achievements').upsert(
          localIds.map((achievement) => ({ user_id: user.id, achievement })),
          { onConflict: 'user_id,achievement' }
        );
      }
      const { data } = await supabase
        .from('pgplay_achievements')
        .select('achievement')
        .eq('user_id', user.id);
      if (cancelled) return;
      const merged = { ...local };
      (data || []).forEach((r) => { merged[r.achievement] = true; });
      setUnlocked(merged);
      localStorage.setItem(LS_KEY, JSON.stringify(merged));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const unlock = useCallback(async (id) => {
    setUnlocked((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: true };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      unlockQueue.current.push(id);
      return next;
    });
    if (user) {
      await supabase.from('pgplay_achievements')
        .upsert({ user_id: user.id, achievement: id }, { onConflict: 'user_id,achievement' });
    }
  }, [user]);

  // Flush queue into the toast one at a time so stacked unlocks don't mash.
  useEffect(() => {
    if (toast) return;
    const id = unlockQueue.current.shift();
    if (!id) return;
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach) return;
    sfx.achievement();
    setToast(ach);
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast, unlocked]);

  // Per-session breadth tracking — survives across route changes within
  // one tab, resets on reload. Used by the "three-in-a-sitting"
  // achievement and the originals-tour cumulative check.
  const sessionGames = useRef(new Set());
  const playedGames = useRef(new Set(
    Object.keys(readLocal()).filter((k) => k.startsWith('played:')).map((k) => k.slice(7))
  ));

  // Score bus hook: listen for pgplay:score events + open events, derive unlocks.
  useEffect(() => {
    const onOpen = (e) => {
      const gameId = e?.detail?.gameId;
      unlock('first-play');
      if (!gameId) return;

      sessionGames.current.add(gameId);
      if (sessionGames.current.size >= 3) unlock('three-in-a-row');

      // Persistent breadth — store as `played:<id>` keys in the same blob
      // so we don't need a new schema. New game opened → mark played.
      if (!playedGames.current.has(gameId)) {
        playedGames.current.add(gameId);
        const blob = readLocal();
        blob[`played:${gameId}`] = true;
        try { localStorage.setItem(LS_KEY, JSON.stringify(blob)); } catch {}
      }
      const breadth = playedGames.current.size;
      if (breadth >= 10) unlock('breadth-10');
      const seenAll = ORIGINAL_IDS.every((id) => playedGames.current.has(id));
      if (seenAll) unlock('all-originals');
    };
    const onScore = (e) => {
      const { gameId, score, meta = {} } = e.detail || {};
      if (!gameId || typeof score !== 'number') return;
      unlock('first-score');
      if (gameId === 'slipshot' && (meta.kills ?? 0) >= 10) unlock('slipshot-10');
      if (gameId === 'fps') unlock('fps-clear');
      if (gameId === 'cutrope' && (meta.stars ?? 0) >= 3) unlock('cutrope-perfect');
      if (gameId === 'arena') unlock('arena-champ');
      if (gameId === 'grudgewood') unlock('grudge-clear');
      // Bricklands clears all three worlds: meta.level >= 3 OR raw score
      // crosses the level-3 finish bonus (~100k threshold).
      if (gameId === 'bricklands' && ((meta.level ?? 0) >= 3 || score >= 100000)) {
        unlock('bricklands-finish');
      }
      // 2048: derive from bests since the submit just carries the score
      if (gameId === 'g2048' && score >= 20480) unlock('2048-2048');
      // Era Siege — meta carries { era, time, difficulty, defeat, daily }
      if (gameId === 'aow' && !meta.defeat) {
        unlock('era-siege-victor');
        if (meta.difficulty === 'conquest') unlock('era-siege-conquest');
        if ((meta.time ?? 9999) <= 90)      unlock('era-siege-fast-win');
        if (meta.daily === true)            unlock('era-siege-daily');
      }
      if (gameId === 'aow' && (meta.era ?? 0) >= 5) unlock('era-siege-era5');
    };
    window.addEventListener('pgplay:score', onScore);
    window.addEventListener('pgplay:open', onOpen);
    return () => {
      window.removeEventListener('pgplay:score', onScore);
      window.removeEventListener('pgplay:open', onOpen);
    };
  }, [unlock]);

  // Five-bests achievement derived from bests shape
  useEffect(() => {
    const ct = Object.keys(bests || {}).length;
    if (ct >= 5 && !unlocked['bests-5']) unlock('bests-5');
  }, [bests, unlocked, unlock]);

  return { unlocked, toast, ACHIEVEMENTS };
}
