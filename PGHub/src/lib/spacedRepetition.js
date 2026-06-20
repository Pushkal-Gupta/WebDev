// SM-2-lite spaced repetition scheduler.
//
// Confidence 1-5 (1 = Again, 2 = Hard, 3 = Good, 4 = Easy, 5 = Mastered).
// Solve count is how many times the problem has been correctly solved.
//
// Confidence-of-1 always resets the interval to 1 day (the problem feels new again).
// Higher confidence grows the interval geometrically with each successful solve.

const CONFIDENCE_DAYS = {
  1: 1,    // Again — see it tomorrow
  2: 2,    // Hard — short interval
  3: 5,    // Good — moderate
  4: 10,   // Easy — long
  5: 21,   // Mastered — very long
};

// Multiplier applied to the base interval per additional successful solve.
// Caps at 5 to keep the final interval sane.
const SOLVE_MULTIPLIER = {
  1: 1.0,
  2: 1.3,
  3: 1.7,
  4: 2.2,
  5: 2.8,
};

export function intervalDays(confidence, solveCount = 1) {
  const c = Math.max(1, Math.min(5, Math.floor(confidence) || 3));
  const base = CONFIDENCE_DAYS[c];
  const factor = c === 1 ? 1 : Math.pow(SOLVE_MULTIPLIER[c], Math.min(5, Math.max(0, solveCount - 1)));
  return Math.round(base * factor);
}

export function nextReviewAt(confidence, solveCount = 1, fromDate = new Date()) {
  const days = intervalDays(confidence, solveCount);
  return new Date(fromDate.getTime() + days * 86400000).toISOString();
}

export const CONFIDENCE_LABELS = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
  5: 'Mastered',
};

export function describeInterval(confidence, solveCount = 1) {
  const days = intervalDays(confidence, solveCount);
  if (days <= 1) return 'tomorrow';
  if (days < 7) return `in ${days} days`;
  if (days < 30) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30)} months`;
}
