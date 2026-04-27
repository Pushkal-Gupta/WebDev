// Local persistent stats for Era Siege. Keys live under one prefix for
// easy bulk-clear. Falls back to the in-memory storage adapter when
// localStorage is unavailable (Safari private mode, embedded shells).

import { storage } from './storage.js';

const KEY = 'era-siege:stats';
const VERSION = 1;

const blank = () => ({
  v: VERSION,
  matches: 0,
  wins:    0,
  losses:  0,
  totalKills: 0,
  totalSpawns: 0,
  totalEvolves: 0,
  bestScore: { skirmish: 0, standard: 0, conquest: 0 },
  bestEra:   { skirmish: 0, standard: 0, conquest: 0 },
  fastestWinSec: { skirmish: 0, standard: 0, conquest: 0 },
  unlocks: { conquest: false },
  daily: { lastClaimedDate: null, lastDailyScore: 0, streak: 0, longestStreak: 0 },
  endless: { bestScore: 0, longestSec: 0, runs: 0 },
  lastDifficulty: 'standard',
});

export function readStats() {
  try {
    const raw = storage.get(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== VERSION) return blank();
    // Patch missing fields from blank — forward-compat for older saves.
    return { ...blank(), ...parsed, bestScore: { ...blank().bestScore, ...(parsed.bestScore || {}) },
                                    bestEra:   { ...blank().bestEra,   ...(parsed.bestEra   || {}) },
                                    fastestWinSec: { ...blank().fastestWinSec, ...(parsed.fastestWinSec || {}) },
                                    unlocks:   { ...blank().unlocks,   ...(parsed.unlocks   || {}) },
                                    daily:     { ...blank().daily,     ...(parsed.daily     || {}) },
                                    endless:   { ...blank().endless,   ...(parsed.endless   || {}) } };
  } catch {
    return blank();
  }
}

export function writeStats(stats) {
  try { storage.set(KEY, JSON.stringify(stats)); } catch { /* fall through */ }
}

export function recordMatchResult({ difficulty, won, era, timeSec, score, kills, spawns, evolves, isDaily, dailyDate, isEndless, endlessSec }) {
  const s = readStats();
  s.matches++;
  if (won)  s.wins++;
  else      s.losses++;
  s.totalKills   += kills | 0;
  s.totalSpawns  += spawns | 0;
  s.totalEvolves += evolves | 0;
  if (score > (s.bestScore[difficulty] || 0)) s.bestScore[difficulty] = score;
  if (era   > (s.bestEra[difficulty]   || 0)) s.bestEra[difficulty]   = era;
  if (won) {
    const fastest = s.fastestWinSec[difficulty] || 0;
    if (fastest === 0 || timeSec < fastest) s.fastestWinSec[difficulty] = timeSec;
  }
  // Conquest unlocks after the first Standard win.
  if (won && difficulty === 'standard') s.unlocks.conquest = true;
  // Daily — score is also surfaced separately so the user knows their best for the day.
  // Streak: increments when the user completes a new daily on the day
  // immediately after their previously-claimed daily; resets otherwise.
  if (isDaily && dailyDate) {
    const prev = s.daily.lastClaimedDate;
    const isNewDay = prev !== dailyDate;
    if (isNewDay) {
      const consecutive = isYesterday(prev, dailyDate);
      s.daily.streak = consecutive ? (s.daily.streak || 0) + 1 : 1;
      if (s.daily.streak > (s.daily.longestStreak || 0)) {
        s.daily.longestStreak = s.daily.streak;
      }
    }
    if (isNewDay || score > s.daily.lastDailyScore) {
      s.daily.lastClaimedDate = dailyDate;
      if (score > s.daily.lastDailyScore) s.daily.lastDailyScore = score;
    }
  }
  // Endless stats — separate space because the score formula is different.
  if (isEndless) {
    s.endless.runs++;
    if (score > (s.endless.bestScore || 0)) s.endless.bestScore = score;
    if ((endlessSec || 0) > (s.endless.longestSec || 0)) s.endless.longestSec = endlessSec || 0;
  }
  s.lastDifficulty = difficulty;
  writeStats(s);
  return s;
}

export function isDifficultyUnlocked(stats, id) {
  if (id === 'skirmish' || id === 'standard') return true;
  if (id === 'conquest') return !!stats.unlocks.conquest;
  return true;
}

// Daily seed — UTC-day hashed. Stable across all clients on the same day.
export function todaySeed() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm   = d.getUTCMonth() + 1;
  const dd   = d.getUTCDate();
  return hashSeed(`${yyyy}-${mm}-${dd}`);
}

export function todayDateString() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function hashSeed(s) {
  // FNV-1a 32-bit. Good enough for seeding our Mulberry32.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Returns true when `today` is exactly one UTC day after `prev`.
// Returns false if either string is missing or they're not consecutive.
export function isYesterday(prev, today) {
  if (!prev || !today) return false;
  const p = Date.parse(prev + 'T00:00:00Z');
  const t = Date.parse(today + 'T00:00:00Z');
  if (Number.isNaN(p) || Number.isNaN(t)) return false;
  return (t - p) === 86400000;
}

export function resetStats() {
  storage.remove(KEY);
  return blank();
}
