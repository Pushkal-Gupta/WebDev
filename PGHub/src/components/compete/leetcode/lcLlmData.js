// Illustrative benchmark figures for how language models fare on rated
// contest-style problems, grouped by difficulty. Numbers are representative
// estimates for a teaching dashboard, not an official leaderboard.

export const LLM_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const LLM_MODELS = [
  {
    name: 'Opus-class frontier', slug: 'opus-frontier', vendor: 'Frontier', tier: 'Flagship',
    overall: 71, easy: 95, medium: 74, hard: 42,
    rating: 2180, contestPercentile: 96,
    note: 'Strongest on hard combinatorics; occasional off-by-one on tight constraints.',
  },
  {
    name: 'Fast frontier (mid)', slug: 'fast-frontier-mid', vendor: 'Frontier', tier: 'Balanced',
    overall: 63, easy: 93, medium: 66, hard: 31,
    rating: 1960, contestPercentile: 90,
    note: 'Near-flagship on easy/medium, drops on multi-step DP and geometry.',
  },
  {
    name: 'Open-weights 70B', slug: 'open-70b', vendor: 'Open', tier: 'Balanced',
    overall: 52, easy: 88, medium: 53, hard: 19,
    rating: 1710, contestPercentile: 78,
    note: 'Solid on standard patterns; struggles when the trick is non-obvious.',
  },
  {
    name: 'Reasoning-tuned mid', slug: 'reasoning-mid', vendor: 'Frontier', tier: 'Reasoning',
    overall: 68, easy: 94, medium: 71, hard: 38,
    rating: 2080, contestPercentile: 94,
    note: 'Long chain-of-thought helps hard problems but costs latency.',
  },
  {
    name: 'Compact 8B', slug: 'compact-8b', vendor: 'Open', tier: 'Compact',
    overall: 38, easy: 76, medium: 36, hard: 8,
    rating: 1390, contestPercentile: 58,
    note: 'Reliable on warm-ups; rarely finishes a hard problem within limits.',
  },
  {
    name: 'Code-specialized mid', slug: 'code-mid', vendor: 'Frontier', tier: 'Code',
    overall: 60, easy: 92, medium: 63, hard: 27,
    rating: 1880, contestPercentile: 86,
    note: 'Clean implementations; weaker at choosing the right algorithm first.',
  },
];

export const LLM_FAILURE_MODES = [
  { mode: 'Wrong complexity', detail: 'Picks an O(n^2) approach that times out on the largest hidden cases.', share: 28 },
  { mode: 'Edge-case miss', detail: 'Passes samples but mishandles empty input, single element, or integer overflow.', share: 24 },
  { mode: 'Misread constraint', detail: 'Overlooks a bound that changes the intended approach entirely.', share: 19 },
  { mode: 'Off-by-one', detail: 'Boundary indexing on windows, prefix sums, or binary-search midpoints.', share: 16 },
  { mode: 'Hallucinated API', detail: 'Calls a standard-library method that does not exist in the target language.', share: 13 },
];

export const LLM_TAKEAWAYS = [
  'Easy problems are effectively solved — the gap is entirely in medium and hard.',
  'A hard-problem solve rate above 40% tracks closely with a strong contest percentile.',
  'Reasoning-tuned models trade latency for a measurable bump on hard problems.',
  'Most failures are not syntax — they are complexity and edge-case errors a test suite catches.',
];
