// Interactive viz for bitwise / counting concepts.
// Array renderer: for bit-level concepts each cell is one BIT (0/1) of an
// 8-cell little/big-endian word; a subRow carries the operand or running value;
// pointers mark the active bit; highlights flag set/cleared/pivot bits; captions
// narrate the operation. For boyer-moore-voting-extended the array is the input
// sequence and the candidate/count bookkeeping rides in the caption.

const BITS = 8;

// Render a number as a big-endian array of BITS cells (index 0 = MSB).
function toBits(n) {
  const v = n & 0xff;
  const out = [];
  for (let b = BITS - 1; b >= 0; b--) out.push((v >> b) & 1);
  return out;
}
// Convert a bit position (0 = LSB) to a bit-cell index (0 = MSB).
function idxOf(pos) {
  return BITS - 1 - pos;
}

// ---------------------------------------------------------------------------
// bit-counting-tricks — Brian Kernighan popcount (n &= n - 1) + lowest set bit
// ---------------------------------------------------------------------------
function bitCountingFrames(n = 22) {
  const start = n & 0xff;
  if (start === 0) {
    const z = toBits(0);
    return [
      { array: z, caption: 'n = 0 has no set bits — popcount is 0 and the loop body never runs.' },
      { array: z, caption: 'Each cell above is one bit (index 0 = most-significant). Every bit is 0, so n & (n - 1) is never reached.' },
    ];
  }
  const frames = [];
  frames.push({
    array: toBits(start),
    subRow: { values: toBits(start).map(String), label: 'n' },
    caption: `Brian Kernighan popcount: count the set bits of n = ${start} (binary ${start.toString(2).padStart(BITS, '0')}). Each cell is one bit, leftmost = bit 7 (MSB).`,
  });
  frames.push({
    array: toBits(start),
    subRow: { values: toBits(start).map(String), label: 'n' },
    highlights: Object.fromEntries(toBits(start).map((b, i) => [i, b ? 'current' : null]).filter(([, r]) => r)),
    caption: `The trick: n &= n - 1 clears the LOWEST set bit each pass, so the loop runs exactly once per set bit — O(popcount) not O(8).`,
  });

  let cur = start;
  let count = 0;
  let pass = 0;
  while (cur !== 0) {
    pass += 1;
    const low = cur & -cur & 0xff; // lowest set bit value
    const lowPos = Math.log2(low);
    const lowIdx = idxOf(lowPos);
    const minus = (cur - 1) & 0xff;

    frames.push({
      array: toBits(cur),
      subRow: { values: toBits(minus).map(String), label: 'n - 1' },
      highlights: { [lowIdx]: 'pivot' },
      pointers: { [lowIdx]: 'low' },
      caption: `Pass ${pass}: n = ${cur}. Its lowest set bit is at position ${lowPos} (value ${low}). n - 1 = ${minus} flips that bit to 0 and sets every bit below it to 1.`,
    });

    const next = cur & minus & 0xff;
    const cleared = {};
    const curB = toBits(cur);
    const nextB = toBits(next);
    for (let i = 0; i < BITS; i++) {
      if (curB[i] === 1 && nextB[i] === 0) cleared[i] = 'pivot';
      else if (nextB[i] === 1) cleared[i] = 'match';
    }
    count += 1;
    frames.push({
      array: nextB,
      subRow: { values: nextB.map(String), label: 'n' },
      highlights: cleared,
      caption: `n &= n - 1 → ${next}. The lowest set bit (pivot) is gone, the higher set bits (match) survive. count = ${count}.`,
    });
    cur = next;
  }
  frames.push({
    array: toBits(0),
    subRow: { values: toBits(start).map(String), label: 'orig' },
    caption: `n reached 0 after ${count} clears, so ${start} has ${count} set bit${count === 1 ? '' : 's'}.`,
  });
  const lowOnly = start & -start & 0xff;
  frames.push({
    array: toBits(lowOnly),
    subRow: { values: toBits(start).map(String), label: 'orig' },
    highlights: { [idxOf(Math.log2(lowOnly))]: 'pivot' },
    caption: `Bonus trick — isolate the lowest set bit: ${start} & -${start} = ${lowOnly}. Two's complement -n keeps only that bit, used by Fenwick trees for i += i & -i.`,
  });
  frames.push({
    array: toBits(start),
    subRow: { values: toBits(start).map(String), label: 'orig' },
    caption: `Power-of-two test: (n & (n - 1)) == 0 is ${(start & (start - 1)) === 0}. ${start} is ${(start & (start - 1)) === 0 ? '' : 'not '}a power of two (a power of two has exactly one set bit, cleared in a single pass).`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// bitwise-xor-properties — single-number: XOR all elements, duplicates cancel
// ---------------------------------------------------------------------------
function xorPropertiesFrames(nums = [4, 1, 2, 1, 2]) {
  const arr = nums.map((x) => x & 0xff);
  if (!arr.length) return [{ array: toBits(0), caption: 'Empty input — running XOR stays 0.' }];
  const frames = [];
  frames.push({
    array: toBits(0),
    subRow: { values: toBits(0).map(String), label: 'acc' },
    caption: `XOR is bitwise parity: a bit of the result is 1 iff an odd number of operands set it. Fold the array [${arr.join(', ')}] into one accumulator — every value that appears twice cancels (x ^ x = 0), leaving the unique one.`,
  });
  frames.push({
    array: toBits(0),
    subRow: { values: toBits(0).map(String), label: 'acc' },
    caption: `Start acc = 0. XOR with 0 changes nothing (x ^ 0 = x), so 0 is the safe identity to begin with. Each cell above is one bit of acc.`,
  });

  let acc = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    frames.push({
      array: toBits(acc),
      subRow: { values: toBits(v).map(String), label: `x[${i}]=${v}` },
      caption: `Fold in x[${i}] = ${v} (binary ${v.toString(2).padStart(BITS, '0')}). Compare its bits against acc = ${acc}; differing bits become 1, equal bits become 0.`,
    });
    const next = (acc ^ v) & 0xff;
    const accB = toBits(acc);
    const vB = toBits(v);
    const nextB = toBits(next);
    const hl = {};
    for (let b = 0; b < BITS; b++) {
      if (accB[b] !== vB[b]) hl[b] = 'match'; // bit toggled to 1
      else if (accB[b] === 1) hl[b] = 'pivot'; // two ones cancelled to 0
    }
    acc = next;
    frames.push({
      array: nextB,
      subRow: { values: nextB.map(String), label: 'acc' },
      highlights: hl,
      caption: `acc = acc ^ ${v} = ${acc}. Match cells flipped to 1 (one operand had the bit); pivot cells where two 1s met cancelled to 0.`,
    });
  }
  frames.push({
    array: toBits(acc),
    subRow: { values: toBits(acc).map(String), label: 'acc' },
    highlights: Object.fromEntries(toBits(acc).map((b, i) => [i, b ? 'done' : null]).filter(([, r]) => r)),
    caption: `Every paired value annihilated; the survivor is ${acc}. One pass, O(n) time, O(1) memory — the entire single-number algorithm.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// bitwise-gray-code — emit i ^ (i >> 1); consecutive codes differ by one bit
// ---------------------------------------------------------------------------
function grayCodeFrames(n = 3) {
  const bits = Math.max(1, Math.min(6, n | 0));
  const total = 1 << bits;
  const frames = [];

  const codeBits = (g) => {
    const out = [];
    for (let b = bits - 1; b >= 0; b--) out.push((g >> b) & 1);
    return out;
  };

  frames.push({
    array: codeBits(0),
    subRow: { values: codeBits(0).map(String), label: 'gray(0)' },
    caption: `Reflected Gray code on ${bits} bits: emit g = i ^ (i >> 1) for i = 0..${total - 1}. Consecutive codes differ in exactly one bit — no multi-bit transition window. Each cell is one bit (leftmost = bit ${bits - 1}).`,
  });
  frames.push({
    array: codeBits(0),
    subRow: { values: codeBits(0).map(String), label: 'gray(0)' },
    caption: `Why a single flip matters: plain binary counting flips many bits on a carry (3=011 to 4=100 flips three). Mid-transition a hardware bus shows garbage. Gray code reorders the ${total} integers so only one bit ever changes between neighbours.`,
  });

  let prev = 0;
  for (let i = 0; i < total; i++) {
    const g = i ^ (i >> 1);
    const gB = codeBits(g);
    frames.push({
      array: gB,
      subRow: { values: codeBits(i).map(String), label: `i=${i}` },
      highlights: Object.fromEntries(gB.map((b, idx) => [idx, b ? 'current' : null]).filter(([, r]) => r)),
      caption: `i = ${i} → i >> 1 = ${i >> 1}; XOR cancels every flip of the carry burst except the highest, so g = ${i} ^ ${i >> 1} = ${g} (gray ${g.toString(2).padStart(bits, '0')}).`,
    });
    if (i > 0) {
      const diff = (g ^ prev) & (total - 1);
      const diffPos = Math.log2(diff);
      const diffIdx = bits - 1 - diffPos;
      frames.push({
        array: gB,
        subRow: { values: codeBits(prev).map(String), label: 'prev' },
        highlights: { [diffIdx]: 'pivot' },
        caption: `Compare with previous code ${prev.toString(2).padStart(bits, '0')}: they differ only at bit ${diffPos} (XOR = ${diff}, a single set bit). Exactly one flip — the Gray guarantee holds.`,
      });
    }
    prev = g;
  }
  frames.push({
    array: codeBits(prev),
    subRow: { values: codeBits(total - 1).map(String), label: `i=${total - 1}` },
    caption: `Sequence complete: ${total} codes, each one flip apart, and the last (${prev.toString(2).padStart(bits, '0')}) differs from the first (${(0).toString(2).padStart(bits, '0')}) by one bit too — the cycle is closed. O(2^n) total, O(1) extra space.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// bitwise-power-set-bitmask — count mask 0..2^n-1, bit j = include nums[j]
// ---------------------------------------------------------------------------
function powerSetFrames(n = 3) {
  const k = Math.max(1, Math.min(6, n | 0));
  const total = 1 << k;
  const labels = ['a', 'b', 'c', 'd', 'e', 'f'].slice(0, k);
  const frames = [];

  const maskBits = (m) => {
    const out = [];
    for (let b = k - 1; b >= 0; b--) out.push((m >> b) & 1);
    return out;
  };

  frames.push({
    array: maskBits(0),
    subRow: { values: maskBits(0).map(String), label: 'mask' },
    caption: `The 2^${k} = ${total} subsets of {${labels.join(', ')}} are in bijection with the ${k}-bit integers 0..${total - 1}. Bit j of the mask answers "is element j in this subset?" Leftmost cell = bit ${k - 1}.`,
  });
  frames.push({
    array: maskBits(0),
    subRow: { values: maskBits(0).map(String), label: 'mask' },
    caption: `Enumerating subsets reduces to counting — the simplest control flow there is. The recursive include/exclude tree pays a function-call frame per node; the bitmask form pushes all that bookkeeping into one integer the CPU increments for free.`,
  });

  for (let mask = 0; mask < total; mask++) {
    const mB = maskBits(mask);
    const members = [];
    for (let j = 0; j < k; j++) if (mask & (1 << j)) members.push(labels[j]);
    frames.push({
      array: mB,
      subRow: { values: mB.map(String), label: `mask=${mask}` },
      highlights: Object.fromEntries(mB.map((b, idx) => [idx, b ? 'current' : null]).filter(([, r]) => r)),
      caption: `mask = ${mask} (binary ${mask.toString(2).padStart(k, '0')}). Set bits (highlighted) name the members → subset { ${members.join(', ')} }${members.length === 0 ? ' (the empty set)' : ''}.`,
    });
  }
  frames.push({
    array: maskBits(total - 1),
    subRow: { values: maskBits(total - 1).map(String), label: 'mask' },
    highlights: Object.fromEntries(maskBits(total - 1).map((b, idx) => [idx, b ? 'done' : null]).filter(([, r]) => r)),
    caption: `Counting from 0 to ${total - 1} enumerated all ${total} subsets in lexicographic-by-membership order — no recursion, no stack, just the increment the CPU does for free. O(n·2^n).`,
  });

  // Submask walk of the full set: s = (s - 1) & m — the bitmask-DP cornerstone.
  const full = total - 1;
  let s = full;
  let steps = 0;
  while (s > 0 && steps < total) {
    const sB = maskBits(s);
    frames.push({
      array: sB,
      subRow: { values: maskBits(full).map(String), label: `m=${full}` },
      highlights: Object.fromEntries(sB.map((b, idx) => [idx, b ? 'current' : null]).filter(([, r]) => r)),
      caption: `Submask walk s = (s - 1) & m over m = ${full}: visiting submask ${s} (${s.toString(2).padStart(k, '0')}). Across all masks this totals O(3^n) iterations — the cornerstone of bitmask DP.`,
    });
    s = (s - 1) & full;
    steps += 1;
  }
  frames.push({
    array: maskBits(0),
    subRow: { values: maskBits(full).map(String), label: `m=${full}` },
    caption: `The submask loop ends at s = 0 (the empty submask), included after the while-loop. Every (mask, submask) pair maps to one of three states per element, giving the 3^n bound.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// bitwise-bit-manipulation-tricks — set/clear/toggle/test one bit via masks
// ---------------------------------------------------------------------------
function bitTricksFrames(start = 0b00100101, target = 4) {
  const x0 = start & 0xff;
  const pos = Math.max(0, Math.min(BITS - 1, target | 0));
  const idx = idxOf(pos);
  const frames = [];

  frames.push({
    array: toBits(x0),
    subRow: { values: toBits(x0).map(String), label: 'x' },
    caption: `Four primitives on the mask 1 << ${pos}: SET (|), CLEAR (& ~), TOGGLE (^), TEST (& then compare). Start x = ${x0} (binary ${x0.toString(2).padStart(BITS, '0')}); we operate on bit position ${pos}.`,
  });
  frames.push({
    array: toBits(1 << pos),
    subRow: { values: toBits(1 << pos).map(String), label: 'mask' },
    highlights: { [idx]: 'pivot' },
    pointers: { [idx]: 'i' },
    caption: `Build the mask m = 1 << ${pos} = ${1 << pos}: a single 1 at position ${pos}, zeros elsewhere. Every trick targets exactly this bit.`,
  });

  // SET
  const setRes = (x0 | (1 << pos)) & 0xff;
  frames.push({
    array: toBits(setRes),
    subRow: { values: toBits(x0).map(String), label: 'before' },
    highlights: { [idx]: 'match' },
    pointers: { [idx]: 'i' },
    caption: `SET: x | m = ${setRes}. OR forces bit ${pos} to 1 and leaves all other bits untouched (OR with 0 is a no-op).`,
  });
  // CLEAR
  const clrRes = (x0 & ~(1 << pos)) & 0xff;
  frames.push({
    array: toBits(clrRes),
    subRow: { values: toBits(x0).map(String), label: 'before' },
    highlights: { [idx]: 'pivot' },
    pointers: { [idx]: 'i' },
    caption: `CLEAR: x & ~m = ${clrRes}. ~m is all 1s except position ${pos}; ANDing keeps every other bit and zeroes bit ${pos}.`,
  });
  // TOGGLE
  const togRes = (x0 ^ (1 << pos)) & 0xff;
  frames.push({
    array: toBits(togRes),
    subRow: { values: toBits(x0).map(String), label: 'before' },
    highlights: { [idx]: 'current' },
    pointers: { [idx]: 'i' },
    caption: `TOGGLE: x ^ m = ${togRes}. XOR flips bit ${pos} (was ${(x0 >> pos) & 1}, now ${(togRes >> pos) & 1}) and leaves the rest, since XOR with 0 is identity.`,
  });
  // TEST
  const testBit = (x0 >> pos) & 1;
  frames.push({
    array: toBits(x0),
    subRow: { values: toBits(x0).map(String), label: 'x' },
    highlights: { [idx]: testBit ? 'match' : 'pivot' },
    pointers: { [idx]: 'i' },
    caption: `TEST: (x >> ${pos}) & 1 = ${testBit}. Bit ${pos} is ${testBit ? 'set' : 'clear'}.`,
  });

  // Composed tricks: lowest set bit isolate + clear
  const low = x0 & -x0 & 0xff;
  if (low) {
    const lowPos = Math.log2(low);
    const lowIdx = idxOf(lowPos);
    frames.push({
      array: toBits(low),
      subRow: { values: toBits(x0).map(String), label: 'x' },
      highlights: { [lowIdx]: 'pivot' },
      caption: `Composed trick — isolate lowest set bit: x & -x = ${low} (position ${lowPos}). Two's complement -x flips everything above the lowest 1 and keeps that 1, so the AND leaves only it.`,
    });
    const cleared = (x0 & (x0 - 1)) & 0xff;
    frames.push({
      array: toBits(cleared),
      subRow: { values: toBits(x0).map(String), label: 'x' },
      highlights: { [lowIdx]: 'pivot' },
      caption: `Clear lowest set bit: x & (x - 1) = ${cleared}. Subtracting 1 borrows through the trailing zeros onto the lowest 1, which the AND then erases — the heart of Kernighan popcount.`,
    });
  }
  const isPow2 = x0 > 0 && (x0 & (x0 - 1)) === 0;
  frames.push({
    array: toBits(x0),
    subRow: { values: toBits(x0).map(String), label: 'x' },
    caption: `Power-of-two test: x > 0 && (x & (x - 1)) == 0 → ${isPow2}. ${x0} is ${isPow2 ? '' : 'not '}a power of two.`,
  });
  const popcount = toBits(x0).filter((b) => b).length;
  frames.push({
    array: toBits(x0),
    subRow: { values: toBits(x0).map(String), label: 'x' },
    highlights: Object.fromEntries(toBits(x0).map((b, i) => [i, b ? 'done' : null]).filter(([, r]) => r)),
    caption: `Popcount via repeated x &= x - 1 runs once per set bit: ${x0} has ${popcount} set bit${popcount === 1 ? '' : 's'}. Memorize the four primitives, then compose — every famous trick falls out of them.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// boyer-moore-voting-extended — Misra-Gries n/k candidate selection + verify
// ---------------------------------------------------------------------------
function boyerMooreExtendedFrames(nums = [1, 1, 1, 2, 3, 2, 2, 2, 3, 1], k = 3) {
  const arr = nums.map((x) => x | 0);
  const kk = Math.max(2, k | 0);
  if (!arr.length) return [{ array: [], caption: 'Empty stream — no heavy hitters.' }];

  const slotsStr = (counts) => {
    const e = Object.entries(counts);
    return e.length ? e.map(([v, c]) => `${v}:${c}`).join('  ') : '(empty)';
  };

  const frames = [];
  frames.push({
    array: arr,
    caption: `Misra-Gries / extended Boyer-Moore: find every value appearing more than n/${kk} times in n=${arr.length} elements, using only ${kk - 1} (candidate, count) slots — O(${kk}) memory regardless of stream length. Pass 1 selects candidates.`,
  });
  frames.push({
    array: arr,
    caption: `Pigeonhole: at most ${kk - 1} distinct values can each exceed n/${kk}, so ${kk - 1} slots suffice. Three rules per element — match: increment; free slot: seat with count 1; else: cancellation round (decrement all, drop zeros). Slots: (empty).`,
  });

  const counts = {};
  for (let i = 0; i < arr.length; i++) {
    const x = arr[i];
    const eliminated = new Set(Array.from({ length: i }, (_, j) => j));
    if (Object.prototype.hasOwnProperty.call(counts, x)) {
      counts[x] += 1;
      frames.push({
        array: arr,
        pointers: { [i]: 'i' },
        highlights: { [i]: 'match' },
        eliminated,
        caption: `Read nums[${i}] = ${x}. Rule 1 (match): ${x} already holds a slot → increment. Slots: ${slotsStr(counts)}.`,
      });
    } else if (Object.keys(counts).length < kk - 1) {
      counts[x] = 1;
      frames.push({
        array: arr,
        pointers: { [i]: 'i' },
        highlights: { [i]: 'current' },
        eliminated,
        caption: `Read nums[${i}] = ${x}. Rule 2 (free slot): ${x} is new and a slot is open → seat it with count 1. Slots: ${slotsStr(counts)}.`,
      });
    } else {
      for (const key of Object.keys(counts)) {
        counts[key] -= 1;
        if (counts[key] === 0) delete counts[key];
      }
      frames.push({
        array: arr,
        pointers: { [i]: 'i' },
        highlights: { [i]: 'pivot' },
        eliminated,
        caption: `Read nums[${i}] = ${x}. Rule 3 (cancellation): no match and all ${kk - 1} slots full → decrement every count by 1, drop any that hit 0. This pairs ${x} with one element from each slot and discards all ${kk} together. Slots: ${slotsStr(counts)}.`,
      });
    }
  }

  const candidates = Object.keys(counts).map(Number);
  frames.push({
    array: arr,
    eliminated: new Set(arr.map((_, j) => j)),
    caption: `Pass 1 done. Surviving candidates: {${candidates.join(', ') || 'none'}}. These are only POSSIBLE majorities — counts here are NOT true frequencies, so a verification pass is mandatory.`,
  });

  const threshold = Math.floor(arr.length / kk);
  const winners = [];
  for (const c of candidates) {
    const freq = arr.filter((v) => v === c).length;
    const pass = freq > threshold;
    if (pass) winners.push(c);
    const hl = {};
    arr.forEach((v, j) => { if (v === c) hl[j] = pass ? 'done' : 'pivot'; });
    frames.push({
      array: arr,
      highlights: hl,
      caption: `Pass 2 verify candidate ${c}: exact recount = ${freq}. Threshold = floor(${arr.length}/${kk}) = ${threshold}. ${freq} ${pass ? '>' : '<='} ${threshold} → ${pass ? 'KEEP (true >n/k majority)' : 'REJECT (false positive)'}.`,
    });
  }
  frames.push({
    array: arr,
    eliminated: new Set(arr.map((_, j) => j)),
    caption: `Answer: every value appearing more than n/${kk} = ${threshold} times is {${winners.join(', ') || 'none'}}. Two passes, O(n·k) time, O(k) memory — exact, with strict > (not >=) per the majority definition.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
export default {
  'bit-counting-tricks': {
    title: 'Bit counting: Kernighan popcount',
    renderer: 'array',
    cases: [
      { label: 'n = 22 (10110)', frames: bitCountingFrames(22) },
      { label: 'n = 255 (all ones)', frames: bitCountingFrames(255) },
      { label: 'n = 169 (10101001)', frames: bitCountingFrames(169) },
      { label: 'n = 117 (01110101)', frames: bitCountingFrames(117) },
    ],
    build: ({ n }) => bitCountingFrames(Number(n)),
    inputSchema: {
      fields: [
        { name: 'n', label: 'n (0-255)', type: 'number', default: 22, min: 0, max: 255 },
      ],
    },
  },
  'bitwise-xor-properties': {
    title: 'XOR properties: duplicates cancel',
    renderer: 'array',
    cases: [
      { label: 'Single number [4,1,2,1,2]', frames: xorPropertiesFrames([4, 1, 2, 1, 2]) },
      { label: 'Survivor 7 [3,5,3,5,7]', frames: xorPropertiesFrames([3, 5, 3, 5, 7]) },
      { label: 'All cancel [6,6,9,9]', frames: xorPropertiesFrames([6, 6, 9, 9]) },
    ],
    build: ({ nums }) => xorPropertiesFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'nums (comma-separated)', type: 'string', default: '4,1,2,1,2', max: 40, placeholder: '4,1,2,1,2' },
      ],
    },
  },
  'bitwise-gray-code': {
    title: 'Gray code: one bit flip per step',
    renderer: 'array',
    cases: [
      { label: 'n = 2 (4 codes)', frames: grayCodeFrames(2) },
      { label: 'n = 3 (8 codes)', frames: grayCodeFrames(3) },
      { label: 'n = 4 (16 codes)', frames: grayCodeFrames(4) },
    ],
    build: ({ n }) => grayCodeFrames(Number(n)),
    inputSchema: {
      fields: [
        { name: 'n', label: 'bits (1-6)', type: 'number', default: 3, min: 1, max: 6 },
      ],
    },
  },
  'bitwise-power-set-bitmask': {
    title: 'Power set: count masks 0..2^n-1',
    renderer: 'array',
    cases: [
      { label: 'n = 3 {a,b,c}', frames: powerSetFrames(3) },
      { label: 'n = 2 {a,b}', frames: powerSetFrames(2) },
      { label: 'n = 4 {a,b,c,d}', frames: powerSetFrames(4) },
    ],
    build: ({ n }) => powerSetFrames(Number(n)),
    inputSchema: {
      fields: [
        { name: 'n', label: 'elements (1-6)', type: 'number', default: 3, min: 1, max: 6 },
      ],
    },
  },
  'bitwise-bit-manipulation-tricks': {
    title: 'Bit tricks: set / clear / toggle / test',
    renderer: 'array',
    cases: [
      { label: 'x = 37, bit 4', frames: bitTricksFrames(0b00100101, 4) },
      { label: 'x = 200, bit 0', frames: bitTricksFrames(200, 0) },
      { label: 'x = 64 (pow2), bit 6', frames: bitTricksFrames(64, 6) },
    ],
    build: ({ x, bit }) => bitTricksFrames(Number(x), Number(bit)),
    inputSchema: {
      fields: [
        { name: 'x', label: 'x (0-255)', type: 'number', default: 37, min: 0, max: 255 },
        { name: 'bit', label: 'bit position (0-7)', type: 'number', default: 4, min: 0, max: 7 },
      ],
    },
  },
  'boyer-moore-voting-extended': {
    title: 'Boyer-Moore n/k: Misra-Gries voting',
    renderer: 'array',
    cases: [
      { label: 'n/3 majority', frames: boyerMooreExtendedFrames([1, 1, 1, 2, 3, 2, 2, 2, 3, 1], 3) },
      { label: 'Classic n/2 [2,2,1,1,2]', frames: boyerMooreExtendedFrames([2, 2, 1, 1, 2], 2) },
      { label: 'No majority n/3', frames: boyerMooreExtendedFrames([1, 2, 3, 4, 5, 6], 3) },
      { label: 'n/4 stream', frames: boyerMooreExtendedFrames([5, 5, 5, 1, 2, 5, 3, 5, 4, 5, 5, 6], 4) },
    ],
    build: ({ nums, k }) => boyerMooreExtendedFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
      Number(k),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'nums (comma-separated)', type: 'string', default: '1,1,1,2,3,2,2,2,3,1', max: 50, placeholder: '1,1,1,2,3,2,2,2,3,1' },
        { name: 'k', label: 'k (find > n/k)', type: 'number', default: 3, min: 2, max: 6 },
      ],
    },
  },
};
