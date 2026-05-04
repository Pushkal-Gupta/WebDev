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

// Phase 22 — DIFF_KEY bumped to v2 because the difficulty semantics
// changed (lives pool replaced with behavior-based tiers). Old 'easy'
// picks from prior versions silently roll back to the new 'normal'
// default, which is what we want — the old 'easy' meant "infinite
// lives", the new one means "respawn in place". Treating them as the
// same setting would surprise existing players.
const DIFF_KEY  = 'pgplay-ff-difficulty-v2';
const THEME_KEY = 'pgplay-ff-theme';
const SKIN_KEY  = 'pgplay-ff-skin';
const PROG_KEY  = 'pgplay-ff-progress';
const PROG_VER  = 1;

// Phase 22d — player ice-cream skin. Five values: the canonical pink
// 'default' (the existing player.png) plus the four sheet-5 variants.
export const SKIN_IDS = ['default', 'vanilla', 'sundae', 'triple', 'sandwich'];

export function readSkin(fallback = 'default') {
  try {
    const raw = localStorage.getItem(SKIN_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string' && SKIN_IDS.includes(parsed.id)) {
      return parsed.id;
    }
  } catch { /* ignore */ }
  return fallback;
}

export function writeSkin(id) {
  try { localStorage.setItem(SKIN_KEY, JSON.stringify({ id })); }
  catch { /* ignore */ }
}

export const DIFFICULTY_RANK = ['easy', 'normal', 'hard', 'expert', 'insane'];
// Phase 22 — added 'harvest' (animated bot theme) to the allow-list
// so theme persistence accepts it.
export const THEME_IDS = ['cold', 'orchard', 'harvest', 'trinkets'];

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
