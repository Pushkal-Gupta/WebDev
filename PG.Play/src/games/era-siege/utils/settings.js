// Per-game settings: audio, motion, low-fx override, game speed.
// Persisted to the storage adapter; falls back to memory if blocked.
//
// Audio mute is delegated to PG.Play's existing global mute (sound.js)
// so the platform mute toggle stays the source of truth across the
// arcade. Era Siege only owns Era-Siege-specific settings here.

import { storage } from './storage.js';

const KEY = 'era-siege:settings';
const VERSION = 1;

const DEFAULTS = {
  v: VERSION,
  reduceMotion: null,   // null = follow prefers-reduced-motion; true/false override
  lowFxOverride: null,  // null = follow auto-detect; true/false override
  speed: 1,             // 1 or 2
  cbSafePalette: false, // color-blind safe HP palette
};

let cache = null;
const listeners = new Set();

export function readSettings() {
  if (cache) return cache;
  try {
    const raw = storage.get(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cache = parsed && parsed.v === VERSION ? { ...DEFAULTS, ...parsed } : { ...DEFAULTS };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export function writeSettings(patch) {
  cache = { ...readSettings(), ...patch, v: VERSION };
  try { storage.set(KEY, JSON.stringify(cache)); } catch { /* fall through */ }
  for (const fn of listeners) {
    try { fn(cache); } catch { /* swallow */ }
  }
  return cache;
}

export function subscribeSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function effectiveReduceMotion(s = readSettings()) {
  if (s.reduceMotion === true) return true;
  if (s.reduceMotion === false) return false;
  // Follow OS / browser preference.
  if (typeof window !== 'undefined' && window.matchMedia) {
    return !!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function clamp01to2(v) {
  return v >= 2 ? 2 : 1;
}
