// Cut the Rope — progression state persisted to localStorage.
// Schema:
//   { levels: { [id]: { bestStars: 0..3, cleared: boolean } } }
// Access through readState/writeState/recordAttempt.

const KEY = 'pgplay-cutrope-progress';

export function readState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { levels: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.levels) return parsed;
    return { levels: {} };
  } catch {
    return { levels: {} };
  }
}

export function writeState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* quota / private mode — ignore */ }
}

// Record one level attempt. Returns the next state. Only writes if the
// new attempt clears the level for the first time, or beats the previous
// best star count.
export function recordAttempt(state, levelId, stars, cleared) {
  const prev = state.levels[levelId] || { bestStars: 0, cleared: false };
  const nextStars = Math.max(prev.bestStars, cleared ? stars : prev.bestStars);
  const nextCleared = prev.cleared || cleared;
  if (prev.bestStars === nextStars && prev.cleared === nextCleared) return state;
  const next = {
    ...state,
    levels: { ...state.levels, [levelId]: { bestStars: nextStars, cleared: nextCleared } },
  };
  writeState(next);
  return next;
}

// Total stars earned across all levels (for the HUD totals chip and the
// platform achievement check).
export function totalStars(state) {
  return Object.values(state.levels).reduce((acc, l) => acc + (l.bestStars || 0), 0);
}
