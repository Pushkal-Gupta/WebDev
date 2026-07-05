// grade-helpers.mjs — drop-in comparison helpers for the solutions backfill grader.
//
// WHY THIS EXISTS
// ---------------
// The shared in-app grader `src/lib/driverCode.js` (compareOutput / equalsNormalized)
// must stay byte-stable because the live multi-language judge depends on it. But its
// comparison has two known gaps that make *correct* backfill solutions fail grading:
//
//   1) STRING-RETURN QUOTE ASYMMETRY
//      Root cause: src/lib/driverCode.js
//        - Python str output:  wrapWithDriver() emits `print(_result)`  (line ~1847) → BARE   e.g.  aaabcbc
//        - JS str output:      `console.log(JSON.stringify(_result))`   (line ~1888) → QUOTED  e.g.  "aaabcbc"
//        - C++ str output:     `_pgc_ser_str(_result)`                  (line ~2272/625) → QUOTED
//        - Java str output:    `_jsonify((Object)_result)`             → QUOTED
//      Stored `expected` is inconsistent across problems: `decode-string` stores it
//      BARE (aaabcbc); `to-lower-case` stores it QUOTED ("hello"). equalsNormalized()
//      (driverCode.js ~2835) JSON-parses each side independently: a bare word is not
//      valid JSON, so only one side parses, the deep-compare branch is skipped, and the
//      string fallback compares `"aaabcbc"` (with literal quote chars) against `aaabcbc`
//      → spurious WA. So depending on which side is quoted, EITHER python OR js/java/cpp
//      fails — purely a serialization-format mismatch, not a wrong answer.
//
//   2) ORDER-INSENSITIVE LIST OUTPUT
//      Problems like subsets / combinations / combination-sum / k-closest /
//      find-all-duplicates accept ANY ordering of the rows (and sometimes of the
//      elements within a row). The stored `expected` fixes one particular order;
//      a correct solution that emits a different valid order fails the order-sensitive
//      deepEqual. These must be compared as multisets (sort both sides, then compare).
//
// HOW TO WIRE INTO backfill-solutions.mjs (do NOT edit that file while a run is live):
//   import { compareOutputSmart, ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';
//   // in gradeLanguage(), replace:
//   //   if (!compareOutput(r.stdout, tc.expected)) { ... }
//   // with:
//   //   if (!compareOutputSmart(r.stdout, tc.expected, { orderInsensitive: ORDER_INSENSITIVE.has(problem.id) })) { ... }
//
// This file changes ONLY the backfill grader's comparison. It does not touch the
// shared app grader, so the live judge is unaffected.

import { equalsNormalized } from '../../src/lib/driverCode.js';

// ── Problem ids whose stored test cases are order-insensitive at the TOP level.
// (rows may appear in any order; rows are sorted lexicographically before compare)
export const ORDER_INSENSITIVE = new Set([
  'subsets',
  'combinations',
  'combination-sum',
  'k-closest-points-to-origin',
  'find-all-duplicates-in-an-array',
  'permutations',
  // "return any valid grouping, any order" — the stored cases fix one arbitrary
  // ordering, so a correct-but-differently-ordered answer needs canonicalized compare.
  'convert-an-array-into-a-2d-array-with-conditions',
  // root-to-leaf path lists — stored cases mix DFS-order and sorted-order, so compare
  // order-insensitively (the set of paths is what matters).
  'binary-tree-paths',
  // "return any array with these sums" — the stored expected fixes one permutation.
  'find-missing-observations',
  // N-Queens proper (board lists) would belong here, but the stored `n-queens`
  // tests expect the integer COUNT, so it grades order-sensitively as a scalar.
]);

// Strip a single pair of matching outer double-quotes from a trimmed string.
// "aaabcbc" -> aaabcbc ; aaabcbc -> aaabcbc (unchanged)
function stripOuterQuotes(s) {
  const t = (s ?? '').toString().trim();
  if (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') {
    return t.slice(1, -1);
  }
  return t;
}

// Recursively sort an array (and its sub-arrays) into a canonical order so that
// two multisets compare equal regardless of ordering. Non-array values pass
// through. Sort key is the JSON serialization of each (already-canonicalized) item.
function canonicalize(value) {
  if (Array.isArray(value)) {
    const mapped = value.map(canonicalize);
    mapped.sort((a, b) => {
      const sa = JSON.stringify(a);
      const sb = JSON.stringify(b);
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    });
    return mapped;
  }
  return value;
}

function tryParse(s) {
  try { return { ok: true, value: JSON.parse(s) }; } catch { return { ok: false }; }
}

// Order-insensitive structural compare: both sides parsed as JSON, canonicalized
// (sorted at every array level), then deep-compared via JSON string equality.
function equalsOrderInsensitive(expected, actual) {
  const pe = tryParse((expected ?? '').toString().trim());
  const pa = tryParse((actual ?? '').toString().trim());
  if (pe.ok && pa.ok) {
    return JSON.stringify(canonicalize(pe.value)) === JSON.stringify(canonicalize(pa.value));
  }
  return false;
}

/**
 * Smart comparison used by the backfill grader.
 *
 * @param {string} actual    raw stdout from Judge0
 * @param {string} expected  stored test-case expected
 * @param {{orderInsensitive?: boolean}} [opts]
 * @returns {boolean}
 *
 * Strategy:
 *   1. Try the shared equalsNormalized first (preserves existing passing behavior).
 *   2. Quote-normalize: strip matching outer quotes from BOTH sides, retry
 *      equalsNormalized. Fixes the string-return quote asymmetry symmetrically
 *      (works whether the expected OR the actual carries the extra quotes).
 *   3. If the problem is flagged order-insensitive, canonicalize (sort) both
 *      parsed shapes and compare as multisets.
 */
// Float-tolerant comparison: LeetCode accepts answers within 1e-5. The grader stores
// fixed-precision strings ("0.66667", "14.50000") that str(float) can't reproduce.
// Compare the NUMERIC content positionally with tolerance, but only when the bracket/
// comma skeleton (numbers blanked) matches — so order and nesting still matter and a
// reordered or restructured array can't sneak through.
function numericEqual(actual, expected, tol = 1e-5) {
  const a = (actual ?? '').toString().trim();
  const e = (expected ?? '').toString().trim();
  if (!/\d/.test(a) || !/\d/.test(e)) return false;
  if (!/^[\s[\](),\-+.eE0-9]+$/.test(a) || !/^[\s[\](),\-+.eE0-9]+$/.test(e)) return false;
  const numRe = /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g;
  const skel = (s) => s.replace(numRe, '#').replace(/\s+/g, '');
  if (skel(a) !== skel(e)) return false;
  const na = a.match(numRe).map(Number), ne = e.match(numRe).map(Number);
  if (na.length !== ne.length || na.length === 0) return false;
  for (let i = 0; i < na.length; i++) {
    const d = Math.abs(na[i] - ne[i]);
    if (d > tol && d > tol * Math.abs(ne[i])) return false;
  }
  return true;
}

export function compareOutputSmart(actual, expected, opts = {}) {
  // 1) baseline shared comparison
  if (equalsNormalized(expected, actual)) return true;

  // 2) quote-stripped comparison (string-return fix, applied both directions)
  const aStripped = stripOuterQuotes(actual);
  const eStripped = stripOuterQuotes(expected);
  if (equalsNormalized(eStripped, aStripped)) return true;

  // 3) float tolerance (scalars + numeric arrays, order/structure preserved)
  if (numericEqual(aStripped, eStripped)) return true;

  // 4) order-insensitive comparison (gated)
  if (opts.orderInsensitive && equalsOrderInsensitive(expected, actual)) return true;

  return false;
}

export { stripOuterQuotes, canonicalize, equalsOrderInsensitive };
