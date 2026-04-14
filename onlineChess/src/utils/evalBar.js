/**
 * Eval-bar math + formatting, extracted so the analysis view and the live
 * game view render identical behavior.
 *
 * Score convention (from stockfishEngine.js): a plain number in centipawns,
 * always from WHITE's perspective. Mate is encoded as ±99_999. Caller never
 * passes `{mate}` objects — that normalization already happens upstream.
 */

// Magic values
const MATE_SENTINEL    = 9000;   // |cp| above this is treated as mate
const NORMALIZE_SCALE  = 400;    // cp/400 → tanh space; 400 matches chess.com "feel"
const CLAMP_MIN_PCT    = 2;      // never let the losing side visually disappear
const CLAMP_MAX_PCT    = 98;

/**
 * Convert centipawns → white-advantage percentage [0..100].
 * Uses tanh so small evals stay near 50% and big evals saturate smoothly.
 * @param {number|null|undefined} cp  centipawns from white's perspective
 * @returns {number} 0..100, 50 = equal
 */
export function scoreToWhitePct(cp) {
  if (cp == null || Number.isNaN(cp)) return 50;
  if (cp >  MATE_SENTINEL) return CLAMP_MAX_PCT;
  if (cp < -MATE_SENTINEL) return CLAMP_MIN_PCT;
  const normalized = Math.tanh(cp / NORMALIZE_SCALE);           // [-1, 1]
  const pct = 50 + normalized * 50;                              // [0, 100]
  return Math.max(CLAMP_MIN_PCT, Math.min(CLAMP_MAX_PCT, pct));
}

/**
 * Human-readable label.
 *   centipawns ±12  → "+0.1" / "-0.1"
 *   near-zero       → "0.0"
 *   mate in N plies → "M1" / "-M1" (ply → moves, rounded up)
 * @param {number|null|undefined} cp
 * @returns {string}
 */
export function formatEval(cp) {
  if (cp == null || Number.isNaN(cp)) return '…';
  if (cp >  MATE_SENTINEL) {
    const plies = 100_000 - cp;                                  // stockfishEngine encoding
    const moves = Math.max(1, Math.ceil(Math.abs(plies) / 2));
    return `M${moves}`;
  }
  if (cp < -MATE_SENTINEL) {
    const plies = 100_000 + cp;
    const moves = Math.max(1, Math.ceil(Math.abs(plies) / 2));
    return `-M${moves}`;
  }
  const pawns = cp / 100;
  const abs = Math.abs(pawns).toFixed(1);
  if (Math.abs(cp) < 5) return '0.0';
  return (cp >= 0 ? '+' : '-') + abs;
}

/**
 * Accessibility label.
 *   +80 cp  → "Evaluation: White better by 0.8 pawns"
 *   -120 cp → "Evaluation: Black better by 1.2 pawns"
 *   M2      → "Evaluation: White has mate in 2"
 */
export function ariaLabel(cp) {
  if (cp == null || Number.isNaN(cp)) return 'Evaluation pending';
  if (cp >  MATE_SENTINEL) {
    const plies = 100_000 - cp;
    const moves = Math.max(1, Math.ceil(Math.abs(plies) / 2));
    return `Evaluation: White has mate in ${moves}`;
  }
  if (cp < -MATE_SENTINEL) {
    const plies = 100_000 + cp;
    const moves = Math.max(1, Math.ceil(Math.abs(plies) / 2));
    return `Evaluation: Black has mate in ${moves}`;
  }
  if (Math.abs(cp) < 5) return 'Evaluation: equal';
  const pawns = Math.abs(cp / 100).toFixed(1);
  return `Evaluation: ${cp > 0 ? 'White' : 'Black'} better by ${pawns} pawns`;
}
