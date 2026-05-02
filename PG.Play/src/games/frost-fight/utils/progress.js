// Frost Fight — local progress + difficulty persistence.
//
// Two LS keys, both forward-compatible (object shapes you can extend):
//   pgplay-ff-difficulty  → { id: 'normal' }
//   pgplay-ff-progress    → { v: 1, cleared: { 'Pantry': true, ... },
//                              lastReached: 0, hardest: 'normal' }
//
// Cleared rooms unlock the next room in the campaign for level-select.
// `lastReached` tracks the highest room index the player has *entered*
// (set when a room loads), so a fresh save can resume from the lobby.

const DIFF_KEY  = 'pgplay-ff-difficulty';
const THEME_KEY = 'pgplay-ff-theme';
const PROG_KEY  = 'pgplay-ff-progress';
const PROG_VER  = 1;

export const DIFFICULTY_RANK = ['easy', 'normal', 'hard', 'expert', 'insane'];
export const THEME_IDS = ['cold', 'orchard'];

export function readDifficulty(fallback = 'normal') {
  try {
    const raw = localStorage.getItem(DIFF_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string' && DIFFICULTY_RANK.includes(parsed.id)) {
      return parsed.id;
    }
  } catch { /* ignore */ }
  return fallback;
}

export function writeDifficulty(id) {
  try { localStorage.setItem(DIFF_KEY, JSON.stringify({ id })); }
  catch { /* ignore */ }
}

// Phase 18 — theme picker persistence. The id is opaque to this
// module beyond the THEME_IDS allow-list so adding new themes later
// (e.g. 'forge', 'storm') is a one-array push.
export function readTheme(fallback = 'cold') {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string' && THEME_IDS.includes(parsed.id)) {
      return parsed.id;
    }
  } catch { /* ignore */ }
  return fallback;
}

export function writeTheme(id) {
  try { localStorage.setItem(THEME_KEY, JSON.stringify({ id })); }
  catch { /* ignore */ }
}

function emptyProgress() {
  return { v: PROG_VER, cleared: {}, lastReached: 0, hardest: null };
}

export function readProgress() {
  try {
    const raw = localStorage.getItem(PROG_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyProgress();
    return {
      v: PROG_VER,
      cleared: parsed.cleared && typeof parsed.cleared === 'object' ? parsed.cleared : {},
      lastReached: typeof parsed.lastReached === 'number' ? parsed.lastReached : 0,
      hardest: typeof parsed.hardest === 'string' ? parsed.hardest : null,
    };
  } catch { return emptyProgress(); }
}

function writeProgress(prog) {
  try { localStorage.setItem(PROG_KEY, JSON.stringify(prog)); }
  catch { /* ignore */ }
}

export function markRoomReached(idx) {
  const prog = readProgress();
  if (idx > prog.lastReached) {
    prog.lastReached = idx;
    writeProgress(prog);
  }
}

export function markRoomCleared(name) {
  const prog = readProgress();
  if (!prog.cleared[name]) {
    prog.cleared[name] = true;
    writeProgress(prog);
  }
}

export function markRunCleared(difficultyId) {
  const prog = readProgress();
  const rank = DIFFICULTY_RANK.indexOf(difficultyId);
  const prev = prog.hardest ? DIFFICULTY_RANK.indexOf(prog.hardest) : -1;
  if (rank > prev) {
    prog.hardest = difficultyId;
    writeProgress(prog);
  }
}

// Level-select gating: a room is unlocked when the previous one is
// cleared (or it's the first room). The level select UI consumes
// this directly.
export function isRoomUnlocked(idx, levelNames) {
  if (idx <= 0) return true;
  const prog = readProgress();
  const prev = levelNames[idx - 1];
  return !!prog.cleared[prev];
}
