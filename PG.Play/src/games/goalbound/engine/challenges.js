// GOALBOUND — challenge evaluator.
//
//   Given a match result + challenge id, compute star rating (0–3).
//   Rules live here to keep Match.jsx clean.

import { CHALLENGES } from '../content.js';

export const challengeById = (id) => CHALLENGES.find((c) => c.id === id) || null;

// Translate a finished match into a canonical "result" payload that
// challenge checks can evaluate.
export const buildResult = ({ scored, conceded, endReason, won, firstGoalAt, wasDownBy2, jumpCount, goalLog }) => ({
  scored, conceded, endReason,
  won, drawn: scored === conceded && !won,
  firstGoalAt, wasDownBy2, jumpCount, goalLog,
});

// Evaluate the challenge's pass/fail and award 1–3 stars. Passing earns
// the challenge's declared stars; failing earns 0.
export const evaluateChallenge = (challengeId, result) => {
  const c = challengeById(challengeId);
  if (!c) return 0;
  try { return c.check(result) ? c.stars : 0; }
  catch { return 0; }
};
