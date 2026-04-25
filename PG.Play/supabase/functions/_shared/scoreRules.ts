// Per-game score validation rules. The submit-score function rejects
// payloads that exceed these bounds. Keep this list tight — it's the
// only thing standing between a console-pasted "score: 999999" and the
// public leaderboard.

export type GameRule = {
  minScore: number;
  maxScore: number;
  // Maximum plausible session length in seconds. If meta.time exceeds
  // this, the run is rejected as obviously cooked.
  maxRunSeconds: number;
  // Maximum score-per-second across the whole run. A bot can hit
  // perfect-aim ratios; this is the believability ceiling.
  maxScorePerSecond?: number;
};

export const GAME_RULES: Record<string, GameRule> = {
  // The four originals
  slither:    { minScore: 0, maxScore: 5000,    maxRunSeconds: 900,  maxScorePerSecond: 8 },
  slipshot:   { minScore: 0, maxScore: 250000,  maxRunSeconds: 240,  maxScorePerSecond: 1500 },
  grudgewood: { minScore: 0, maxScore: 50000,   maxRunSeconds: 1800 },
  goalbound:  { minScore: 0, maxScore: 30,      maxRunSeconds: 600 },

  // Classics
  g2048:      { minScore: 0, maxScore: 200000,  maxRunSeconds: 7200 },
  connect4:   { minScore: 0, maxScore: 100,     maxRunSeconds: 1200 },

  // Restored catalog (single-player score-attack styles)
  vex:        { minScore: 0, maxScore: 100000,  maxRunSeconds: 1200, maxScorePerSecond: 200 },
  hook:       { minScore: 0, maxScore: 100000,  maxRunSeconds: 600,  maxScorePerSecond: 250 },
  fps:        { minScore: 0, maxScore: 100000,  maxRunSeconds: 600,  maxScorePerSecond: 200 },
  arena:      { minScore: 0, maxScore: 100,     maxRunSeconds: 1800 },
  basket:     { minScore: 0, maxScore: 5000,    maxRunSeconds: 180,  maxScorePerSecond: 30 },
  aow:        { minScore: 0, maxScore: 100,     maxRunSeconds: 3600 },
  bloons:     { minScore: 0, maxScore: 100000,  maxRunSeconds: 3600 },
  papa:       { minScore: 0, maxScore: 50000,   maxRunSeconds: 600 },
  bob:        { minScore: 0, maxScore: 100000,  maxRunSeconds: 1800 },
  badicecream:{ minScore: 0, maxScore: 100000,  maxRunSeconds: 1800 },
  fbwg:       { minScore: 0, maxScore: 100000,  maxRunSeconds: 1800 },
  cutrope:    { minScore: 0, maxScore: 30,      maxRunSeconds: 1800 },
  happywheels:{ minScore: 0, maxScore: 100000,  maxRunSeconds: 600 },
  eightball:  { minScore: 0, maxScore: 100,     maxRunSeconds: 3600 },
};

export function isKnownGame(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(GAME_RULES, id);
}

export function validateScore(
  gameId: string,
  score: number,
  meta: Record<string, unknown> = {},
): { ok: true } | { ok: false; reason: string } {
  const rule = GAME_RULES[gameId];
  if (!rule) return { ok: false, reason: 'unknown_game' };
  if (typeof score !== 'number' || !Number.isFinite(score)) return { ok: false, reason: 'score_not_finite' };
  if (score < rule.minScore || score > rule.maxScore) return { ok: false, reason: 'score_out_of_range' };

  const time = typeof meta.time === 'number' ? meta.time : null;
  if (time !== null) {
    if (time < 0 || time > rule.maxRunSeconds) return { ok: false, reason: 'time_out_of_range' };
    if (rule.maxScorePerSecond && time > 0 && score / time > rule.maxScorePerSecond) {
      return { ok: false, reason: 'score_per_second_too_high' };
    }
  }
  return { ok: true };
}
