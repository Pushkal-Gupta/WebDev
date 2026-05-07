// Achievement definitions for Era Siege. Each entry is a predicate
// against the persisted stats object — when the predicate first
// flips true, the achievement unlocks (id appended to
// `stats.achievements`) and a toast fires.
//
// Pure data + a check function. The recordMatchResult flow calls
// `evaluateAchievements(stats)` after writing match deltas; any
// newly-flipped IDs come back as a list for the UI to toast.

export const ACHIEVEMENTS = [
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Defeat your first enemy unit.',
    test: (s) => s.totalKills >= 1,
  },
  {
    id: 'first-evolve',
    name: 'Step Forward',
    description: 'Evolve into a new era.',
    test: (s) => s.totalEvolves >= 1,
  },
  {
    id: 'first-win',
    name: 'Conquerer',
    description: 'Win your first match.',
    test: (s) => s.wins >= 1,
  },
  {
    id: 'apex-era',
    name: 'Reach the Apex',
    description: 'Reach the Void Ascendancy era (5/5).',
    test: (s) => Object.values(s.bestEra || {}).some((v) => (v | 0) >= 5),
  },
  {
    id: 'beat-normal',
    name: 'Drilled Edge',
    description: 'Win on Normal difficulty.',
    test: (s) => (s.bestEra?.normal || s.bestEra?.standard || 0) >= 1,
  },
  {
    id: 'beat-medium',
    name: 'Steady Hand',
    description: 'Win on Medium difficulty.',
    test: (s) => (s.bestEra?.medium || 0) >= 1,
  },
  {
    id: 'beat-hard',
    name: 'Hard-Won',
    description: 'Win on Hard difficulty.',
    test: (s) => (s.bestEra?.hard || s.bestEra?.conquest || 0) >= 1,
  },
  {
    id: 'beat-insane',
    name: 'Unbreakable',
    description: 'Win on Insane difficulty.',
    test: (s) => (s.bestEra?.insane || 0) >= 1,
  },
  {
    id: 'kills-100',
    name: 'Centurion',
    description: 'Defeat 100 enemy units in total.',
    test: (s) => s.totalKills >= 100,
  },
  {
    id: 'kills-1000',
    name: 'Field Marshal',
    description: 'Defeat 1,000 enemy units in total.',
    test: (s) => s.totalKills >= 1000,
  },
  {
    id: 'speedrun-180',
    name: 'Lightning Strike',
    description: 'Win any match in under 180 seconds.',
    test: (s) => Object.values(s.fastestWinSec || {})
                       .some((v) => v > 0 && v < 180),
  },
  {
    id: 'daily-streak-3',
    name: 'Habitual',
    description: 'Win 3 daily challenges in a row.',
    test: (s) => (s.daily?.longestStreak || 0) >= 3,
  },
  {
    id: 'endless-300',
    name: 'Marathon',
    description: 'Survive 300 seconds in Endless mode.',
    test: (s) => (s.endless?.longestSec || 0) >= 300,
  },
];

// Returns the list of achievement ids whose test() flipped from false
// to true on this evaluation. Mutates `stats.achievements` to include
// them. Idempotent — re-running on the same stats object is a no-op
// after the first call.
export function evaluateAchievements(stats) {
  if (!Array.isArray(stats.achievements)) stats.achievements = [];
  const already = new Set(stats.achievements);
  const newlyUnlocked = [];
  for (const def of ACHIEVEMENTS) {
    if (already.has(def.id)) continue;
    if (def.test(stats)) {
      stats.achievements.push(def.id);
      newlyUnlocked.push(def);
    }
  }
  return newlyUnlocked;
}
