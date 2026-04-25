// GOALBOUND — persistent store.
//
//   Single source of truth for everything we keep across reload:
//     - last route (screen)
//     - last selections (teams, players, arena, etc.)
//     - tournament progress
//     - stats / unlocks
//     - settings (duration, difficulty, weather, ball, crowd, sfx mute)
//     - partial match resume (score, clock, status)
//
//   Schema is versioned. On load we validate, migrate if possible,
//   and fall back to a clean default if anything's corrupted.

import { useEffect, useSyncExternalStore } from 'react';

const LS_KEY = 'pd-goalbound-v1';
export const SCHEMA_VERSION = 1;

// Defaults — everything a fresh player would see on first boot.
const DEFAULT_STATE = Object.freeze({
  v: SCHEMA_VERSION,
  route: 'boot',                // first-launch splash → menu
  // (subsequent launches overwrite this with the last-visited screen)
  selections: {
    mode:           null,       // 'quick' | 'tournament' | 'shootout' | 'challenge' | 'practice'
    homeTeam:       'cyan-falcons',
    awayTeam:       'ember-lions',
    homePlayer:     'fal-k',
    awayPlayer:     'emb-t',
    difficulty:     'pro',
    duration:       '60',
    arena:          'dusk-bowl',
    weather:        'clear',
    ball:           'classic',
    crowd:          'normal',
    templateId:     'continental',
    seededDraw:     true,
  },
  settings: {
    sfx:            true,
    music:          false,      // stub — no music track shipped
    reducedMotion:  false,
    staticStadium:  false,
  },
  tournament: null,             // set during active tournament, else null
  challenge: null,              // id of active challenge, else null
  match: null,                  // last live match snapshot {score, clock, status, meta}
  stats: {
    matchesPlayed:  0,
    wins:           0,
    draws:          0,
    losses:         0,
    goalsScored:    0,
    goalsConceded:  0,
    cleanSheets:    0,
    hatTricks:      0,
    trophies:       [],         // [{templateId, teamId, at}]
    challengeStars: {},         // { [challengeId]: 0..3 }
    favoriteTeamId: 'cyan-falcons',
    streak:         { w:0, current:0, best:0 },
  },
  meta: {
    bootedOnce:     false,
    lastPlayedAt:   null,
  },
});

const cloneDefault = () => JSON.parse(JSON.stringify(DEFAULT_STATE));

// Read + validate. If anything is off, nuke and return default.
const loadState = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return cloneDefault();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return cloneDefault();
    if (parsed.v !== SCHEMA_VERSION) return migrate(parsed);
    return validate(parsed);
  } catch {
    return cloneDefault();
  }
};

// Future schema migrations live here. For v1, just sanity-validate.
const migrate = (prev) => {
  // Single-version file: if the version tag is wrong, reset cleanly
  // rather than hack-patching unknown shapes.
  return cloneDefault();
};

// Heavy-handed validation: deep-merge prev over defaults. Missing
// fields inherit defaults, unknown fields are preserved, wrong types
// collapse back to default for their slot.
const validate = (prev) => {
  const out = cloneDefault();
  const mergeInto = (target, src) => {
    if (!src || typeof src !== 'object') return;
    for (const key of Object.keys(target)) {
      if (!(key in src)) continue;
      const a = target[key]; const b = src[key];
      if (a && typeof a === 'object' && !Array.isArray(a)) {
        if (b && typeof b === 'object' && !Array.isArray(b)) mergeInto(a, b);
      } else if (typeof a === typeof b) {
        target[key] = b;
      }
    }
  };
  mergeInto(out, prev);
  out.v = SCHEMA_VERSION;
  return out;
};

let STATE = loadState();
const listeners = new Set();

const persist = () => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(STATE)); }
  catch { /* quota / private mode — ignore */ }
};
const emit = () => { for (const l of listeners) l(); };

export const getState = () => STATE;

export const setState = (patch, opts = {}) => {
  STATE = typeof patch === 'function'
    ? patch(STATE)
    : deepPatch(STATE, patch);
  if (opts.persist !== false) persist();
  emit();
};

const deepPatch = (state, patch) => {
  const out = { ...state };
  for (const key of Object.keys(patch)) {
    const v = patch[key];
    if (v && typeof v === 'object' && !Array.isArray(v) && state[key] && typeof state[key] === 'object' && !Array.isArray(state[key])) {
      out[key] = { ...state[key], ...v };
    } else {
      out[key] = v;
    }
  }
  return out;
};

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// React binding — re-render when the store changes.
export const useGoalboundStore = (selector = (s) => s) =>
  useSyncExternalStore(subscribe, () => selector(STATE), () => selector(STATE));

// Convenience setters used widely.
export const setRoute = (route) => setState({ route });
export const setSelections = (patch) => setState((s) => ({ ...s, selections: { ...s.selections, ...patch } }));
export const setSettings   = (patch) => setState((s) => ({ ...s, settings:   { ...s.settings,   ...patch } }));
export const setTournament = (tournament) => setState({ tournament });
export const setMatch      = (match)  => setState({ match });
export const setChallenge  = (challenge) => setState({ challenge });

export const recordMatchResult = ({ scored, conceded, won, drawn, endReason, templateId, teamId, challengeId, challengeStars }) => {
  setState((s) => {
    const stats = { ...s.stats };
    stats.matchesPlayed += 1;
    stats.goalsScored += scored;
    stats.goalsConceded += conceded;
    if (won)   { stats.wins += 1;   stats.streak = { ...stats.streak, current: stats.streak.current + 1, best: Math.max(stats.streak.best, stats.streak.current + 1) }; }
    else if (drawn) { stats.draws += 1; }
    else       { stats.losses += 1; stats.streak = { ...stats.streak, current: 0 }; }
    if (conceded === 0 && won) stats.cleanSheets += 1;
    if (scored >= 3) stats.hatTricks += 1;
    if (templateId && won && teamId) {
      stats.trophies = [...stats.trophies, { templateId, teamId, at: Date.now() }];
    }
    if (challengeId && challengeStars) {
      const prev = stats.challengeStars[challengeId] || 0;
      stats.challengeStars = { ...stats.challengeStars, [challengeId]: Math.max(prev, challengeStars) };
    }
    return { ...s, stats, meta: { ...s.meta, lastPlayedAt: Date.now() } };
  });
};

export const clearProgress = () => {
  setState(cloneDefault());
};

// Small utility — mark that the game has booted at least once. Used
// by the boot screen to skip its long intro after first launch.
export const markBooted = () => setState((s) => ({ ...s, meta: { ...s.meta, bootedOnce: true } }));

// Convenience hook: re-subscribe automatically to a selector.
export const useSelection = () => useGoalboundStore((s) => s.selections);
export const useRoute     = () => useGoalboundStore((s) => s.route);
export const useSettings  = () => useGoalboundStore((s) => s.settings);
export const useStats     = () => useGoalboundStore((s) => s.stats);

// Optional: keep a `document.documentElement` class in sync with
// reducedMotion so CSS can gate transitions.
export const useReducedMotionClass = () => {
  const rm = useGoalboundStore((s) => s.settings.reducedMotion);
  useEffect(() => {
    const root = document.documentElement;
    if (rm) root.classList.add('gb-reduced-motion');
    else root.classList.remove('gb-reduced-motion');
    return () => root.classList.remove('gb-reduced-motion');
  }, [rm]);
};
