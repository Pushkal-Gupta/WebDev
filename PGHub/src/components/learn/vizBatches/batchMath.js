// Interactive viz for math / number-theory / combinatorics concepts.
// All use the 'array' renderer. Cell semantics differ per concept and are
// explained in each helper's header. Highlight roles are limited to the set
// AlgoVisualizer supports: current | match | pivot | done | visited | low |
// high | frontier | tree. subRow carries a parallel row (running value,
// remainder, used-flags). Captions narrate every step. Pure JS, no imports.

// ---------------------------------------------------------------------------
// Shared helpers (self-contained — no import from conceptVisualizations.js).
// ---------------------------------------------------------------------------

// Big-endian bit array of `width` cells (index 0 = MSB) for a non-negative int.
function bitsOf(n, width) {
  const out = [];
  for (let b = width - 1; b >= 0; b--) out.push((n >> b) & 1);
  return out;
}

// Map LSB bit position (0 = least significant) to a big-endian cell index.
function lsbCell(pos, width) {
  return width - 1 - pos;
}

// ---------------------------------------------------------------------------
// math-pow-fast-exponentiation — binary exponentiation x^n.
// array  = big-endian bits of the ORIGINAL exponent n (leftmost = MSB).
// subRow = the same bits, with the bit currently being consumed labelled.
// We walk bits LSB->MSB; at each set bit we fold the running squared base
// (x^(2^k)) into `result`. Caption tracks base, result, and remaining n.
// ---------------------------------------------------------------------------
function fastPowFrames(xIn = 2, nIn = 10) {
  const x = xIn;
  const n0 = Math.abs(nIn | 0);
  const negative = nIn < 0;
  const width = Math.max(4, n0.toString(2).length);
  const origBits = bitsOf(n0, width);

  const frames = [];
  frames.push({
    array: origBits.slice(),
    subRow: { values: origBits.map(String), label: 'n bits' },
    caption: `Fast exponentiation of ${x}^${nIn}. Read the exponent in binary: n = ${n0} = ${n0.toString(2)} (each cell is one bit, leftmost = MSB). Total cost is one squaring per bit — O(log n), not O(n).`,
  });
  if (negative) {
    frames.push({
      array: origBits.slice(),
      subRow: { values: origBits.map(String), label: 'n bits' },
      caption: `n is negative: x^(-n) = (1/x)^n. Invert the base to ${(1 / x).toFixed(4)} and treat the exponent as the positive ${n0}. (In fixed-width int code, widen before negating to dodge the INT_MIN overflow trap.)`,
    });
  }
  frames.push({
    array: origBits.slice(),
    subRow: { values: origBits.map(String), label: 'n bits' },
    caption: `The identity: x^n = product over every set bit k of x^(2^k). Keep a running base = x^(2^k) (square it each step) and fold it into result only when bit k is 1. Start: result = 1, base = ${negative ? (1 / x).toFixed(4) : x}.`,
  });

  let result = 1;
  let base = negative ? 1 / x : x;
  let n = n0;
  let k = 0;
  while (n > 0) {
    const cell = lsbCell(k, width);
    const bit = n & 1;
    const fold = bit === 1;
    frames.push({
      array: bitsOf(n0, width),
      subRow: { values: bitsOf(n0, width).map(String), label: 'n bits' },
      highlights: { [cell]: fold ? 'current' : 'visited' },
      pointers: { [cell]: `bit ${k}` },
      caption: `Bit ${k} (value 2^${k} = ${1 << k}) is ${bit}. base now holds x^(2^${k}) = ${Number.isInteger(base) ? base : base.toFixed(4)}. ${fold ? `Bit is 1 → fold base into result: result = ${Number.isInteger(result) ? result : result.toFixed(4)} * ${Number.isInteger(base) ? base : base.toFixed(4)} = ${Number.isInteger(result * base) ? result * base : (result * base).toFixed(4)}.` : 'Bit is 0 → skip the multiply, leave result unchanged.'}`,
    });
    if (fold) result *= base;
    const nextBase = base * base;
    frames.push({
      array: bitsOf(n0, width),
      subRow: { values: bitsOf(n0, width).map(String), label: 'n bits' },
      highlights: { [cell]: 'match' },
      caption: `Square the base for the next bit: base = base^2 = ${Number.isInteger(nextBase) ? nextBase : nextBase.toFixed(4)} (this is x^(2^${k + 1})). Right-shift the exponent: n = ${n} >> 1 = ${n >> 1}. result = ${Number.isInteger(result) ? result : result.toFixed(4)}.`,
    });
    base = nextBase;
    n >>= 1;
    k += 1;
  }
  frames.push({
    array: bitsOf(n0, width),
    subRow: { values: bitsOf(n0, width).map(String), label: 'n bits' },
    highlights: Object.fromEntries(bitsOf(n0, width).map((b, i) => [i, b ? 'done' : null]).filter(([, r]) => r)),
    caption: `n reached 0 — every bit consumed. ${x}^${nIn} = ${Number.isInteger(result) ? result : result.toFixed(6)}. Folded the base at each set bit (${origBits.filter((b) => b).length} multiplies) plus ${width - 1} squarings: ~${origBits.filter((b) => b).length + width - 1} ops vs ${n0} for the naive loop.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// math-modular-inverse-fermat — Fermat: inv(a) = a^(p-2) mod p (p prime).
// array  = cells holding successive powers a^(2^k) mod p (squaring chain).
// subRow = the bits of the exponent e = p-2, marking which squared powers we
// multiply into the running inverse. Caption proves a * inv ≡ 1 (mod p) at end.
// ---------------------------------------------------------------------------
function fermatInverseFrames(aIn = 3, pIn = 7) {
  const p = pIn | 0;
  const a = ((aIn % p) + p) % p;
  const e = p - 2;
  const width = Math.max(3, e.toString(2).length);
  const eBits = bitsOf(e, width);

  const frames = [];
  frames.push({
    array: eBits.slice(),
    subRow: { values: eBits.map(String), label: 'e bits' },
    caption: `Modular inverse of ${a} mod ${p} via Fermat's little theorem. For prime p, a^(p-1) ≡ 1 (mod p), so a * a^(p-2) ≡ 1 — meaning a^(p-2) IS the inverse. Here exponent e = p-2 = ${e} = ${e.toString(2)} (cells = bits, MSB left).`,
  });
  frames.push({
    array: eBits.slice(),
    subRow: { values: eBits.map(String), label: 'e bits' },
    caption: `Compute a^${e} mod ${p} by fast exponentiation, taking mod ${p} after every multiply so values never exceed p^2. Start: inv = 1, base = ${a} mod ${p} = ${a}. Walk the exponent bits LSB to MSB.`,
  });

  let inv = 1;
  let base = a;
  let n = e;
  let k = 0;
  while (n > 0) {
    const cell = lsbCell(k, width);
    const bit = n & 1;
    const fold = bit === 1;
    const folded = fold ? (inv * base) % p : inv;
    frames.push({
      array: bitsOf(e, width),
      subRow: { values: bitsOf(e, width).map(String), label: 'e bits' },
      highlights: { [cell]: fold ? 'current' : 'visited' },
      pointers: { [cell]: `bit ${k}` },
      caption: `Bit ${k} of e is ${bit}. base = a^(2^${k}) mod ${p} = ${base}. ${fold ? `Bit 1 → inv = (inv * base) mod ${p} = (${inv} * ${base}) mod ${p} = ${folded}.` : `Bit 0 → skip, inv stays ${inv}.`}`,
    });
    if (fold) inv = folded;
    const nextBase = (base * base) % p;
    frames.push({
      array: bitsOf(e, width),
      subRow: { values: bitsOf(e, width).map(String), label: 'e bits' },
      highlights: { [cell]: 'match' },
      caption: `Square the base mod ${p}: base = (${base} * ${base}) mod ${p} = ${nextBase} (now a^(2^${k + 1})). Shift exponent: n = ${n} >> 1 = ${n >> 1}. inv = ${inv}.`,
    });
    base = nextBase;
    n >>= 1;
    k += 1;
  }
  const check = (a * inv) % p;
  frames.push({
    array: bitsOf(e, width),
    subRow: { values: bitsOf(e, width).map(String), label: 'e bits' },
    highlights: { 0: 'done' },
    caption: `Done: ${a}^${e} mod ${p} = ${inv}, so inv(${a}) = ${inv} (mod ${p}). Verify the definition: ${a} * ${inv} = ${a * inv}, and ${a * inv} mod ${p} = ${check} ≡ 1. ${check === 1 ? 'Correct.' : 'Mismatch — check that p is prime.'} (Fermat needs PRIME p; for composite m use extended Euclid.)`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// math-modular-inverse-fermat (case 2) — Extended Euclid inverse for ANY
// coprime (a, m). array = the running pair (a, b) of the gcd reduction shown
// as two cells; subRow = the (x, y) Bezout coefficients carried up during back
// substitution. Caption narrates a*x + m*y = gcd and returns x mod m.
// ---------------------------------------------------------------------------
function extEuclidInverseFrames(aIn = 3, mIn = 11) {
  const m = mIn | 0;
  const a0 = ((aIn % m) + m) % m;

  // Forward division sequence for gcd(a0, m), recorded for back-substitution.
  const steps = [];
  let a = a0;
  let b = m;
  const frames = [];
  frames.push({
    array: [a0, m],
    subRow: { values: ['?', '?'], label: 'x, y' },
    caption: `Inverse of ${a0} mod ${m} via the extended Euclidean algorithm — works for ANY modulus coprime to a, not just primes. Goal: integers x, y with ${a0}*x + ${m}*y = gcd(${a0}, ${m}). If gcd = 1 then ${a0}*x ≡ 1 (mod ${m}), so x mod ${m} is the inverse. Pair shown as [a, b].`,
  });
  while (b !== 0) {
    const q = Math.floor(a / b);
    const r = a % b;
    steps.push({ a, b, q, r });
    frames.push({
      array: [a, b],
      highlights: { 1: 'current' },
      subRow: { values: ['?', '?'], label: 'x, y' },
      caption: `Divide: ${a} = ${q}*${b} + ${r}. gcd(${a}, ${b}) = gcd(${b}, ${r}) — replace the pair with [${b}, ${r}]. Each step shrinks the second term fast (Euclid is O(log m)).`,
    });
    a = b;
    b = r;
  }
  const g = a;
  frames.push({
    array: [g, 0],
    highlights: { 0: 'done' },
    subRow: { values: ['?', '?'], label: 'x, y' },
    caption: `Second term hit 0 → gcd(${a0}, ${m}) = ${g}. ${g === 1 ? 'gcd = 1, so the inverse EXISTS — now back-substitute to recover x.' : 'gcd ≠ 1, so NO inverse exists; the algorithm reports failure.'}`,
  });

  if (g !== 1) {
    return frames;
  }

  // Back-substitution: maintain Bezout coeffs (x, y) for the current pair.
  let x = 1;
  let y = 0;
  for (let i = steps.length - 1; i >= 0; i--) {
    const { a: aa, b: bb, q } = steps[i];
    const nx = y;
    const ny = x - q * y;
    frames.push({
      array: [aa, bb],
      highlights: { 0: 'match', 1: 'pivot' },
      subRow: { values: [String(nx), String(ny)], label: 'x, y' },
      caption: `Back-substitute across ${aa} = ${q}*${bb} + (${aa - q * bb}): the coefficients for [${aa}, ${bb}] become x = ${nx}, y = ${ny}, satisfying ${aa}*${nx} + ${bb}*${ny} = ${aa * nx + bb * ny} = 1.`,
    });
    x = nx;
    y = ny;
  }
  const inv = ((x % m) + m) % m;
  const check = (a0 * inv) % m;
  frames.push({
    array: [a0, m],
    highlights: { 0: 'done' },
    subRow: { values: [String(x), String(y)], label: 'x, y' },
    caption: `Final Bezout: ${a0}*${x} + ${m}*${y} = 1. The raw x = ${x} may be negative, so normalise: inv = ((${x}) mod ${m} + ${m}) mod ${m} = ${inv}. Check: ${a0} * ${inv} mod ${m} = ${check} ≡ 1. ${check === 1 ? 'Correct.' : 'Mismatch.'}`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// strassen-matrix-mult — multiply two 2x2 matrices with SEVEN scalar products
// (M1..M7) instead of eight, the recursion that beats O(n^3). array = the seven
// products as cells; subRow = the four output entries C11..C22 as they get
// assembled from the M-values. Caption derives each Mi and each Cij and checks
// the result against the standard 8-multiply product.
// ---------------------------------------------------------------------------
function strassenFrames(Ain = [1, 2, 3, 4], Bin = [5, 6, 7, 8]) {
  const A = (Array.isArray(Ain) ? Ain : [1, 2, 3, 4]).slice(0, 4).map((x) => x | 0);
  const B = (Array.isArray(Bin) ? Bin : [5, 6, 7, 8]).slice(0, 4).map((x) => x | 0);
  while (A.length < 4) A.push(0);
  while (B.length < 4) B.push(0);
  const [a11, a12, a21, a22] = A;
  const [b11, b12, b21, b22] = B;

  const M1 = (a11 + a22) * (b11 + b22);
  const M2 = (a21 + a22) * b11;
  const M3 = a11 * (b12 - b22);
  const M4 = a22 * (b21 - b11);
  const M5 = (a11 + a12) * b22;
  const M6 = (a21 - a11) * (b11 + b12);
  const M7 = (a12 - a22) * (b21 + b22);
  const Ms = [M1, M2, M3, M4, M5, M6, M7];

  const C11 = M1 + M4 - M5 + M7;
  const C12 = M3 + M5;
  const C21 = M2 + M4;
  const C22 = M1 - M2 + M3 + M6;

  const blank = ['·', '·', '·', '·', '·', '·', '·'];
  const cRow = (vals) => [String(vals[0]), String(vals[1]), String(vals[2]), String(vals[3])];
  const frames = [];

  frames.push({
    array: blank.slice(),
    subRow: { values: ['·', '·', '·', '·'], label: 'C' },
    caption: `Strassen multiply of A = [${a11} ${a12} | ${a21} ${a22}] and B = [${b11} ${b12} | ${b21} ${b22}]. The naive product needs EIGHT scalar multiplies; Strassen needs only SEVEN cleverly-combined products M1..M7 (cells above) plus 18 add/subtracts. That single saved multiply is what turns T(n)=8T(n/2) into 7T(n/2) → O(n^2.807).`,
  });

  const defs = [
    [`(A11+A22)(B11+B22) = (${a11}+${a22})(${b11}+${b22}) = ${a11 + a22}·${b11 + b22}`, M1],
    [`(A21+A22)·B11 = (${a21}+${a22})·${b11} = ${a21 + a22}·${b11}`, M2],
    [`A11·(B12-B22) = ${a11}·(${b12}-${b22}) = ${a11}·${b12 - b22}`, M3],
    [`A22·(B21-B11) = ${a22}·(${b21}-${b11}) = ${a22}·${b21 - b11}`, M4],
    [`(A11+A12)·B22 = (${a11}+${a12})·${b22} = ${a11 + a12}·${b22}`, M5],
    [`(A21-A11)(B11+B12) = (${a21}-${a11})(${b11}+${b12}) = ${a21 - a11}·${b11 + b12}`, M6],
    [`(A12-A22)(B21+B22) = (${a12}-${a22})(${b21}+${b22}) = ${a12 - a22}·${b21 + b22}`, M7],
  ];
  const shown = blank.slice();
  for (let i = 0; i < 7; i++) {
    shown[i] = String(Ms[i]);
    frames.push({
      array: shown.slice(),
      subRow: { values: ['·', '·', '·', '·'], label: 'C' },
      highlights: { [i]: 'current' },
      pointers: { [i]: `M${i + 1}` },
      caption: `M${i + 1} = ${defs[i][0]} = ${defs[i][1]}. This is one recursive multiply (here scalars, but blocks at size n/2). Computing all seven uses each input block in at most a couple of sums — no eighth product is ever formed.`,
    });
  }

  frames.push({
    array: shown.slice(),
    subRow: { values: ['·', '·', '·', '·'], label: 'C' },
    highlights: Object.fromEntries(Ms.map((_, i) => [i, 'match'])),
    caption: `All seven products ready: M = [${Ms.join(', ')}]. Now recover the four output blocks with additions only — no more multiplies. C11 = M1+M4-M5+M7, C12 = M3+M5, C21 = M2+M4, C22 = M1-M2+M3+M6.`,
  });

  const cVals = [C11, C12, C21, C22];
  const cExpr = [
    `M1+M4-M5+M7 = ${M1}+${M4}-${M5}+${M7}`,
    `M3+M5 = ${M3}+${M5}`,
    `M2+M4 = ${M2}+${M4}`,
    `M1-M2+M3+M6 = ${M1}-${M2}+${M3}+${M6}`,
  ];
  const cNames = ['C11', 'C12', 'C21', 'C22'];
  const built = ['·', '·', '·', '·'];
  for (let i = 0; i < 4; i++) {
    built[i] = String(cVals[i]);
    frames.push({
      array: shown.slice(),
      subRow: { values: cRow(built), label: 'C' },
      highlights: Object.fromEntries(Ms.map((_, j) => [j, 'visited'])),
      caption: `${cNames[i]} = ${cExpr[i]} = ${cVals[i]}. Folding the M-values with adds and subtracts assembles output block ${cNames[i]} of C = A·B.`,
    });
  }

  const s11 = a11 * b11 + a12 * b21;
  const s12 = a11 * b12 + a12 * b22;
  const s21 = a21 * b11 + a22 * b21;
  const s22 = a21 * b12 + a22 * b22;
  const okMat = s11 === C11 && s12 === C12 && s21 === C21 && s22 === C22;
  frames.push({
    array: shown.slice(),
    subRow: { values: cRow([C11, C12, C21, C22]), label: 'C' },
    highlights: { 0: 'done' },
    caption: `Result C = [${C11} ${C12} | ${C21} ${C22}]. Cross-check the standard 8-multiply product: [${s11} ${s12} | ${s21} ${s22}] — ${okMat ? 'identical, Strassen is correct.' : 'MISMATCH.'} Seven multiplies vs eight; recursively that compounds to O(n^log2 7) ≈ O(n^2.807), with a crossover to naive for small n.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// dp-matrix-exponentiation — n-th Fibonacci via raising the 2x2 companion
// matrix M = [[1,1],[1,0]] to the n-th power by binary exponentiation.
// array  = big-endian bits of the exponent n; subRow = the four entries of the
// current `base` matrix (squared each step). Caption narrates fold/square and
// recovers f_n from R = M^n at the end.
// ---------------------------------------------------------------------------
function matrixExpoFibFrames(nIn = 10) {
  const n0 = Math.max(1, Math.min(40, nIn | 0));
  // We compute M^n, then f_n = (M^n)[0][1] with M=[[1,1],[1,0]] (f_0=0,f_1=1).
  const width = Math.max(3, n0.toString(2).length);
  const eBits = bitsOf(n0, width);
  const matStr = (m) => `[${m[0]} ${m[1]} | ${m[2]} ${m[3]}]`;
  const mul = (a, b) => [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
  ];

  const frames = [];
  frames.push({
    array: eBits.slice(),
    subRow: { values: ['1', '1', '1', '0'], label: 'M rows' },
    caption: `n-th Fibonacci in O(log n) via matrix exponentiation. The recurrence f_{n+1}=f_n+f_{n-1} is the matrix product M·[f_n, f_{n-1}]^T with M = [[1,1],[1,0]]. So [f_n, f_{n-1}]^T = M^n · [f_1, f_0]^T, and f_n = (M^n)[0][1]. Compute M^${n0}; exponent bits shown above (MSB left).`,
  });
  frames.push({
    array: eBits.slice(),
    subRow: { values: ['1', '0', '0', '1'], label: 'R rows' },
    caption: `Binary exponentiation of the MATRIX — same square-and-multiply as integers, with matrix multiply (O(2^3)=8 scalar ops per 2x2 product) as the operator. Start: R (result) = identity [[1,0],[0,1]], base = M = ${matStr([1, 1, 1, 0])}. Walk the bits of ${n0} LSB to MSB.`,
  });

  let R = [1, 0, 0, 1];
  let base = [1, 1, 1, 0];
  let n = n0;
  let k = 0;
  while (n > 0) {
    const cell = lsbCell(k, width);
    const bit = n & 1;
    const fold = bit === 1;
    const folded = fold ? mul(R, base) : R;
    frames.push({
      array: bitsOf(n0, width),
      subRow: { values: base.map(String), label: 'base' },
      highlights: { [cell]: fold ? 'current' : 'visited' },
      pointers: { [cell]: `bit ${k}` },
      caption: `Bit ${k} of ${n0} is ${bit}. base = M^(2^${k}) = ${matStr(base)}. ${fold ? `Bit 1 → R = R · base = ${matStr(folded)}.` : `Bit 0 → skip the multiply, R stays ${matStr(R)}.`}`,
    });
    if (fold) R = folded;
    const nextBase = mul(base, base);
    frames.push({
      array: bitsOf(n0, width),
      subRow: { values: nextBase.map(String), label: 'base²' },
      highlights: { [cell]: 'match' },
      caption: `Square the base: base = base · base = ${matStr(nextBase)} (now M^(2^${k + 1})). Shift exponent: n = ${n} >> 1 = ${n >> 1}. R = ${matStr(R)}.`,
    });
    base = nextBase;
    n >>= 1;
    k += 1;
  }
  const fib = R[1]; // (M^n)[0][1]
  frames.push({
    array: bitsOf(n0, width),
    subRow: { values: R.map(String), label: 'M^n' },
    highlights: { 0: 'done' },
    caption: `Every bit consumed → M^${n0} = ${matStr(R)}. Read off f_${n0} = (M^${n0})[0][1] = ${fib}. Did ~${eBits.length} matrix multiplies instead of ${n0} additions — O(k³ log n) total, the trick that makes f_(10^18) mod p instant.`,
  });
  return frames;
}


// ---------------------------------------------------------------------------
// minimax-game-theory — fold a single layer of game-tree leaf scores under a
// max (your move) or min (opponent) node, with alpha-beta cutoffs.
// array  = the leaf scores of the children, left to right.
// subRow = the running best / bound after each child is examined.
// Caption narrates max/min selection and which children alpha-beta prunes.
// ---------------------------------------------------------------------------
function minimaxFrames(leavesIn = [3, 12, 8, 2, 4, 6, 14, 5, 2], isMaxRoot = true) {
  const leaves = (Array.isArray(leavesIn) ? leavesIn : [3, 12, 8]).slice(0, 12).map((x) => x | 0);
  // Group leaves into children-of-children: 3 leaves per inner node when
  // divisible, else treat each leaf as a direct child.
  const groupSize = leaves.length % 3 === 0 && leaves.length >= 6 ? 3 : 1;
  const groups = [];
  for (let i = 0; i < leaves.length; i += groupSize) groups.push(leaves.slice(i, i + groupSize));

  const frames = [];
  frames.push({
    array: leaves.slice(),
    caption: `Minimax with alpha-beta pruning. Leaf scores (each cell) are evaluated positions; the root is a ${isMaxRoot ? 'MAX' : 'MIN'} node (your move). Internal nodes alternate: MAX picks the largest child, MIN (opponent) picks the smallest. α = best MAX can guarantee, β = best MIN can guarantee.`,
  });
  frames.push({
    array: leaves.slice(),
    subRow: { values: leaves.map(() => '·'), label: 'best' },
    caption: `Group the ${leaves.length} leaves into ${groups.length} inner ${groupSize === 1 ? 'leaf' : 'MIN'} node${groups.length === 1 ? '' : 's'} of ${groupSize}. The root MAX folds those inner results. Carry α = -inf, β = +inf down; whenever β ≤ α a whole subtree is provably irrelevant and we cut it.`,
  });

  let alpha = -Infinity;
  let rootBest = -Infinity;
  const bestRow = leaves.map(() => '·');
  let idx = 0;
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    // Inner MIN node: take the minimum, but prune once value <= alpha.
    let beta = Infinity;
    let innerBest = Infinity;
    let pruned = false;
    for (let j = 0; j < group.length; j++) {
      const leaf = group[j];
      innerBest = Math.min(innerBest, leaf);
      beta = Math.min(beta, innerBest);
      bestRow[idx] = String(innerBest);
      frames.push({
        array: leaves.slice(),
        subRow: { values: bestRow.slice(), label: 'best' },
        highlights: { [idx]: 'current' },
        pointers: { [idx]: groupSize === 1 ? 'leaf' : 'min' },
        caption: groupSize === 1
          ? `Root MAX examines leaf ${leaf}. Tentative best so far = max(${rootBest === -Infinity ? '-inf' : rootBest}, ${leaf}). α updates toward the best guaranteed score.`
          : `MIN node ${gi + 1} examines child ${leaf}: min-so-far = ${innerBest}, β = ${innerBest}. ${innerBest <= alpha ? `β (${innerBest}) ≤ α (${alpha === -Infinity ? '-inf' : alpha}) → PRUNE: the MAX parent already has ≥ α, so this MIN node can only do worse. Skip remaining children.` : `Still β (${innerBest}) > α (${alpha === -Infinity ? '-inf' : alpha}), keep looking.`}`,
      });
      idx += 1;
      if (innerBest <= alpha && groupSize > 1) {
        // Mark the skipped siblings visited.
        for (let s = j + 1; s < group.length; s++) {
          bestRow[idx] = '×';
          frames.push({
            array: leaves.slice(),
            subRow: { values: bestRow.slice(), label: 'best' },
            highlights: { [idx]: 'visited' },
            caption: `Alpha-beta cutoff: child ${group[s]} of MIN node ${gi + 1} is skipped entirely — never evaluated. This is the pruning that makes minimax tractable (best case O(b^(d/2)) instead of O(b^d)).`,
          });
          idx += 1;
        }
        pruned = true;
        break;
      }
    }
    const innerVal = groupSize === 1 ? group[0] : innerBest;
    const newBest = Math.max(rootBest, innerVal);
    frames.push({
      array: leaves.slice(),
      subRow: { values: bestRow.slice(), label: 'best' },
      highlights: { [Math.min(idx - 1, leaves.length - 1)]: 'match' },
      caption: `${groupSize === 1 ? `Leaf` : `MIN node ${gi + 1}`} resolves to ${innerVal}. Root MAX folds it: best = max(${rootBest === -Infinity ? '-inf' : rootBest}, ${innerVal}) = ${newBest}. α = ${newBest} (MAX now guarantees at least this).${pruned ? ' (children after the cutoff were never touched.)' : ''}`,
    });
    rootBest = newBest;
    alpha = Math.max(alpha, rootBest);
  }
  frames.push({
    array: leaves.slice(),
    subRow: { values: bestRow.slice(), label: 'best' },
    highlights: { 0: 'done' },
    caption: `Root value under perfect play = ${rootBest}. Minimax assumes the opponent also plays optimally, so this is the best score you can FORCE, not hope for. Alpha-beta returned the identical value while skipping the × cells — same answer, far fewer evaluations.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
export default {
  'math-pow-fast-exponentiation': {
    title: 'Fast exponentiation: square + bit-walk',
    renderer: 'array',
    cases: [
      { label: 'pow(2, 10)', frames: fastPowFrames(2, 10) },
      { label: 'pow(3, 13)', frames: fastPowFrames(3, 13) },
      { label: 'pow(2, -4)', frames: fastPowFrames(2, -4) },
    ],
    build: ({ x, n }) => fastPowFrames(Number(x), Number(n)),
    inputSchema: {
      fields: [
        { name: 'x', label: 'base x', type: 'number', default: 2, min: -10, max: 10 },
        { name: 'n', label: 'exponent n', type: 'number', default: 10, min: -20, max: 20 },
      ],
    },
  },
  'math-modular-inverse-fermat': {
    title: 'Modular inverse: Fermat vs extended Euclid',
    renderer: 'array',
    cases: [
      { label: 'Fermat inv(2) mod 11', frames: fermatInverseFrames(2, 11) },
      { label: 'Fermat inv(5) mod 13', frames: fermatInverseFrames(5, 13) },
      { label: 'Extended Euclid inv(3) mod 11', frames: extEuclidInverseFrames(3, 11) },
      { label: 'Extended Euclid inv(7) mod 26', frames: extEuclidInverseFrames(7, 26) },
    ],
    build: ({ a, p, m, mode }) => (String(mode) === 'euclid'
      ? extEuclidInverseFrames(Number(a), Number(m ?? p))
      : fermatInverseFrames(Number(a), Number(p))),
    inputSchema: {
      fields: [
        { name: 'a', label: 'a', type: 'number', default: 3, min: 1, max: 100 },
        { name: 'p', label: 'prime p (Fermat)', type: 'number', default: 7, min: 2, max: 101 },
        { name: 'm', label: 'modulus m (Euclid)', type: 'number', default: 11, min: 2, max: 200 },
        { name: 'mode', label: "mode ('fermat' | 'euclid')", type: 'string', default: 'fermat', placeholder: 'fermat' },
      ],
    },
  },
  'strassen-matrix-mult': {
    title: 'Strassen: 7 multiplies, not 8',
    renderer: 'array',
    cases: [
      { label: '[[1,2],[3,4]] · [[5,6],[7,8]]', frames: strassenFrames([1, 2, 3, 4], [5, 6, 7, 8]) },
      { label: '[[2,0],[1,3]] · [[1,4],[2,1]]', frames: strassenFrames([2, 0, 1, 3], [1, 4, 2, 1]) },
      { label: '[[3,-1],[0,2]] · [[1,2],[-2,3]]', frames: strassenFrames([3, -1, 0, 2], [1, 2, -2, 3]) },
    ],
    build: ({ a, b }) => strassenFrames(
      String(a ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
      String(b ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
    ),
    inputSchema: {
      fields: [
        { name: 'a', label: 'A (a11,a12,a21,a22)', type: 'string', default: '1,2,3,4', max: 20, placeholder: '1,2,3,4' },
        { name: 'b', label: 'B (b11,b12,b21,b22)', type: 'string', default: '5,6,7,8', max: 20, placeholder: '5,6,7,8' },
      ],
    },
  },
  'dp-matrix-exponentiation': {
    title: 'Matrix exponentiation: Fibonacci in O(log n)',
    renderer: 'array',
    cases: [
      { label: 'f(10) via M^10', frames: matrixExpoFibFrames(10) },
      { label: 'f(13) via M^13', frames: matrixExpoFibFrames(13) },
      { label: 'f(20) via M^20', frames: matrixExpoFibFrames(20) },
    ],
    build: ({ n }) => matrixExpoFibFrames(Number(n)),
    inputSchema: {
      fields: [
        { name: 'n', label: 'n (1-40)', type: 'number', default: 10, min: 1, max: 40 },
      ],
    },
  },
  'minimax-game-theory': {
    title: 'Minimax + alpha-beta pruning',
    renderer: 'array',
    cases: [
      { label: 'MAX root, 9 leaves', frames: minimaxFrames([3, 12, 8, 2, 4, 6, 14, 5, 2], true) },
      { label: 'Pruning-heavy tree', frames: minimaxFrames([5, 6, 7, 4, 5, 3, 6, 6, 9], true) },
      { label: 'Flat 6 leaves', frames: minimaxFrames([3, 5, 6, 9, 1, 2], true) },
    ],
    build: ({ leaves }) => minimaxFrames(
      String(leaves ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
      true,
    ),
    inputSchema: {
      fields: [
        { name: 'leaves', label: 'leaf scores (comma-separated)', type: 'string', default: '3,12,8,2,4,6,14,5,2', max: 60, placeholder: '3,12,8,2,4,6,14,5,2' },
      ],
    },
  },
};
