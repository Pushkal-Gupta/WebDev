// Interactive viz for advanced string / stream / palindrome concepts.
//   kmp-failure-function    → array  (LPS prefix-function build by prefix-suffix matching)
//   lis-patience-sorting    → array  (patience piles + binary-search placement on tails)
//   edit-distance-algorithm → array  (DP table laid out as tiles, fill + backtrace)
//   floyd-cycle-detection   → graph  (linked-list-as-graph, tortoise/hare + entry find)
//   random-reservoir-stream → array  (Vitter Algorithm R, seeded RNG for determinism)
//   palindrome-eertree      → tree   (palindromic tree: odd/even roots, suffix links)
//
// Self-contained: no imports from conceptVisualizations.js. Frame shapes mirror
// AlgoVisualizer renderers exactly (array / graph / tree). Semantic state flags
// only — no hardcoded colors, no emoji.

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) — keeps reservoir frame COUNT reproducible.
// ---------------------------------------------------------------------------
function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// uniform integer in [1, hi] inclusive
function randInt1(rng, hi) { return 1 + Math.floor(rng() * hi); }

// ===========================================================================
// 1. KMP failure function (prefix function) — array renderer
// ===========================================================================
function kmpFailureFrames(pattern = 'ABABABC') {
  const p = String(pattern ?? '');
  const m = p.length;
  const arr = p.split('');
  if (!m) return [{ array: [], caption: 'Empty pattern — the prefix function is empty.' }];

  const frames = [];
  const pi = new Array(m).fill(null);
  const piVals = () => pi.map((v) => (v == null ? '·' : String(v)));

  frames.push({
    array: arr,
    subRow: { values: piVals(), label: 'pi' },
    chip: { label: 'pattern', value: `"${p}"` },
    caption: `KMP prefix function: for every prefix pattern[0..i], pi[i] = length of the longest PROPER prefix that is also a suffix. Build it left-to-right; pi[0] is always 0 (a single char has no proper prefix).`,
  });
  pi[0] = 0;
  frames.push({
    array: arr,
    highlights: { 0: 'done' },
    subRow: { values: piVals(), label: 'pi' },
    chip: { label: 'k', value: 0 },
    caption: `pi[0] = 0. Set the running matched-prefix length k = 0 and scan i = 1..${m - 1}.`,
  });

  let k = 0;
  for (let i = 1; i < m; i++) {
    frames.push({
      array: arr,
      highlights: { [i]: 'current', [k]: k < i ? 'compared' : null },
      pointers: { [i]: 'i', ...(k < i ? { [k]: 'k' } : {}) },
      subRow: { values: piVals(), label: 'pi' },
      chip: [{ label: 'i', value: i }, { label: 'k', value: k }],
      caption: `i = ${i} (char '${p[i]}'). Try to extend the current matched prefix: compare pattern[k]='${p[k]}' with pattern[i]='${p[i]}'.`,
    });
    while (k > 0 && p[k] !== p[i]) {
      const prev = k;
      k = pi[k - 1];
      frames.push({
        array: arr,
        highlights: { [i]: 'current', [k]: 'pivot' },
        pointers: { [i]: 'i', [k]: 'k' },
        subRow: { values: piVals(), label: 'pi' },
        chip: [{ label: 'i', value: i }, { label: 'k', value: k, tone: 'pink' }],
        caption: `Mismatch '${p[prev]}' ≠ '${p[i]}'. Fall back via the table itself: k = pi[${prev - 1}] = ${k}. We never re-scan the text — we reuse the suffix-of-prefix structure already known.`,
      });
    }
    if (p[k] === p[i]) {
      k += 1;
      frames.push({
        array: arr,
        highlights: { [i]: 'match', [k - 1]: 'done' },
        pointers: { [i]: 'i' },
        subRow: { values: piVals(), label: 'pi' },
        chip: [{ label: 'i', value: i }, { label: 'k', value: k, tone: 'mint' }],
        caption: `Match '${p[i]}' — extend the matched prefix: k = ${k}. The longest border of pattern[0..${i}] now has length ${k}.`,
      });
    }
    pi[i] = k;
    frames.push({
      array: arr,
      highlights: { [i]: 'done' },
      subRow: { values: piVals(), label: 'pi' },
      chip: { label: `pi[${i}]`, value: k, tone: 'mint' },
      caption: `Record pi[${i}] = ${k}. ${k > 0 ? `Prefix "${p.slice(0, k)}" equals suffix "${p.slice(i - k + 1, i + 1)}".` : 'No proper prefix is also a suffix here.'}`,
    });
  }

  frames.push({
    array: arr,
    highlights: Object.fromEntries(arr.map((_, i) => [i, 'done'])),
    subRow: { values: piVals(), label: 'pi' },
    chip: { label: 'pi', value: `[${pi.join(', ')}]`, tone: 'accent' },
    caption: `Table complete: pi = [${pi.join(', ')}]. On a mismatch during search, slide the pattern by (matched − pi[matched−1]) and keep the text cursor in place — total work O(n + m).`,
  });
  return frames;
}

// ===========================================================================
// 2. LIS via patience sorting — array renderer
// ===========================================================================
// lower_bound on a strictly-increasing array: leftmost index with tails[idx] >= x
function lowerBound(tails, x) {
  let lo = 0, hi = tails.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (tails[mid] < x) lo = mid + 1; else hi = mid;
  }
  return lo;
}

function lisPatienceFrames(input) {
  const a = Array.isArray(input) ? input.slice() : [10, 9, 2, 5, 3, 7, 101, 18];
  const n = a.length;
  if (!n) return [{ array: [], caption: 'Empty array — LIS length is 0.' }];

  const frames = [];
  const tails = [];
  const tailsRow = () => ({ values: a.map((_, i) => (i < tails.length ? String(tails[i]) : '')), label: 'tails' });

  frames.push({
    array: a,
    subRow: tailsRow(),
    chip: { label: 'LIS', value: 0 },
    caption: `Longest Increasing Subsequence via patience sorting. Deal cards left-to-right; each value lands on the leftmost pile whose top is ≥ it. tails[k] = smallest possible tail of any increasing run of length k+1. Pile count = LIS length.`,
  });

  for (let i = 0; i < n; i++) {
    const x = a[i];
    const pos = lowerBound(tails, x);
    frames.push({
      array: a,
      highlights: { [i]: 'current' },
      pointers: { [i]: 'i' },
      subRow: tailsRow(),
      chip: [{ label: 'x', value: x }, { label: 'len', value: tails.length }],
      caption: `Process x = ${x}. Binary-search tails for the leftmost slot with value ≥ ${x} → position ${pos}${pos === tails.length ? ' (past the end)' : ` (currently ${tails[pos]})`}.`,
    });
    if (pos === tails.length) {
      tails.push(x);
      frames.push({
        array: a,
        highlights: { [i]: 'done' },
        subRow: { values: a.map((_, j) => (j < tails.length ? String(tails[j]) : '')), label: 'tails' },
        chip: { label: 'LIS', value: tails.length, tone: 'mint' },
        caption: `No pile has a top ≥ ${x}, so start a NEW pile: tails = [${tails.join(', ')}]. The longest increasing run grows to ${tails.length}.`,
      });
    } else {
      const old = tails[pos];
      tails[pos] = x;
      frames.push({
        array: a,
        highlights: { [i]: 'match' },
        subRow: { values: a.map((_, j) => (j < tails.length ? String(tails[j]) : '')), label: 'tails' },
        chip: { label: 'LIS', value: tails.length, tone: 'sky' },
        caption: `Replace tails[${pos}] = ${old} with the smaller ${x}: tails = [${tails.join(', ')}]. Length is unchanged, but a smaller tail leaves more room for future extensions.`,
      });
    }
  }

  frames.push({
    array: a,
    subRow: { values: a.map((_, j) => (j < tails.length ? String(tails[j]) : '')), label: 'tails' },
    chip: { label: 'LIS length', value: tails.length, tone: 'accent' },
    caption: `Done. The number of piles is ${tails.length}, so the LIS length is ${tails.length}. Note: tails = [${tails.join(', ')}] is a valid length-${tails.length} run only by coincidence — for the true subsequence you reconstruct via parent pointers.`,
  });
  return frames;
}

// ===========================================================================
// 3. Edit distance (Levenshtein) DP table — array renderer (tile mode)
// ===========================================================================
function editDistanceFrames(aWord, bWord) {
  const a = String(aWord ?? 'kitten');
  const b = String(bWord ?? 'sitting');
  const n = a.length, m = b.length;
  if (!n || !m) {
    return [{ array: [], caption: 'Both words must be non-empty to fill a 2D table.' }];
  }
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  // Render the (n+1)x(m+1) grid flattened to a single tile array.
  // Header row 0 = b chars, header col 0 = a chars. Cell label = number or '·'.
  const ROW_HDR = (i) => (i === 0 ? '·/·' : a[i - 1]);
  const COL_HDR = (j) => (j === 0 ? '·' : b[j - 1]);

  function flatten(filled, hi = {}) {
    // grid has (n+2) display rows x (m+2) display cols: extra top row + left col for headers.
    const dispCols = m + 2;
    const arr = [];
    const highlights = {};
    for (let r = 0; r <= n + 1; r++) {
      for (let cc = 0; cc <= m + 1; cc++) {
        const idx = arr.length;
        if (r === 0 && cc === 0) { arr.push(''); continue; }
        if (r === 0) { arr.push(cc === 1 ? '""' : COL_HDR(cc - 1)); highlights[idx] = 'frontier'; continue; }
        if (cc === 0) { arr.push(r === 1 ? '""' : ROW_HDR(r - 1)); highlights[idx] = 'frontier'; continue; }
        const i = r - 1, j = cc - 1;
        if (filled[i] && filled[i][j]) {
          arr.push(String(dp[i][j]));
          const key = `${i},${j}`;
          if (hi[key]) highlights[idx] = hi[key];
        } else {
          arr.push('');
        }
      }
    }
    return { arr, highlights, dispCols };
  }

  const filled = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
  const frames = [];

  frames.push((() => {
    const { arr, highlights } = flatten(filled);
    return {
      array: arr,
      highlights,
      chip: { label: 'goal', value: `"${a}" → "${b}"` },
      caption: `Edit distance (Levenshtein): minimum insert / delete / substitute edits to turn "${a}" into "${b}". Build a ${n + 1}×${m + 1} table; dp[i][j] = cost to align the first i chars of "${a}" with the first j of "${b}".`,
    };
  })());

  // Base row / col.
  for (let i = 0; i <= n; i++) filled[i][0] = true;
  for (let j = 0; j <= m; j++) filled[0][j] = true;
  {
    const hi = {};
    for (let i = 0; i <= n; i++) hi[`${i},0`] = 'visited';
    for (let j = 0; j <= m; j++) hi[`0,${j}`] = 'visited';
    const { arr, highlights } = flatten(filled, hi);
    frames.push({
      array: arr, highlights,
      caption: `Base cases: aligning with the empty string costs the other side's length. dp[i][0] = i (i deletions), dp[0][j] = j (j insertions).`,
    });
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = a[i - 1] === b[j - 1];
      const repl = dp[i - 1][j - 1] + (same ? 0 : 1);
      const del = dp[i - 1][j] + 1;
      const ins = dp[i][j - 1] + 1;
      dp[i][j] = same ? dp[i - 1][j - 1] : Math.min(repl, del, ins);
      filled[i][j] = true;
      const hi = {
        [`${i},${j}`]: 'current',
        [`${i - 1},${j - 1}`]: 'compared',
        [`${i - 1},${j}`]: 'compared',
        [`${i},${j - 1}`]: 'compared',
      };
      const { arr, highlights } = flatten(filled, hi);
      const reason = same
        ? `'${a[i - 1]}' == '${b[j - 1]}' → free diagonal: dp = dp[${i - 1}][${j - 1}] = ${dp[i][j]}.`
        : `'${a[i - 1]}' ≠ '${b[j - 1]}' → 1 + min(replace ${dp[i - 1][j - 1]}, delete ${dp[i - 1][j]}, insert ${dp[i][j - 1]}) = ${dp[i][j]}.`;
      frames.push({
        array: arr, highlights,
        chip: { label: `dp[${i}][${j}]`, value: dp[i][j], tone: same ? 'mint' : 'sky' },
        caption: `Cell (${i},${j}): ${reason}`,
      });
    }
  }

  // Backtrace from (n,m) to (0,0).
  {
    const path = new Set();
    let i = n, j = m;
    while (i > 0 || j > 0) {
      path.add(`${i},${j}`);
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) { i--; j--; }
      else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { i--; j--; }
      else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { i--; }
      else { j--; }
    }
    path.add('0,0');
    const hi = {};
    path.forEach((k) => { hi[k] = 'match'; });
    hi[`${n},${m}`] = 'done';
    const { arr, highlights } = flatten(filled, hi);
    frames.push({
      array: arr, highlights,
      chip: { label: 'edit distance', value: dp[n][m], tone: 'accent' },
      caption: `Answer dp[${n}][${m}] = ${dp[n][m]}. The highlighted path is one optimal alignment: a diagonal step = match or substitute, a vertical step = delete, a horizontal step = insert.`,
    });
  }

  return frames;
}

// ===========================================================================
// 4. Floyd cycle detection — graph renderer (linked list drawn as a graph)
// ===========================================================================
function floydCycleFrames(opts) {
  // labels: array of node labels (1..N). tail: index where the cycle re-enters
  // (0-based). If tail < 0 or >= n, the list has no cycle.
  const labels = (opts && opts.labels) || ['1', '2', '3', '4', '5', '6'];
  const tail = opts && Number.isInteger(opts.tail) ? opts.tail : 3;
  const n = labels.length;
  const hasCycle = tail >= 0 && tail < n;
  // next[i] = index of successor, or -1 for end.
  const next = labels.map((_, i) => (i + 1 < n ? i + 1 : (hasCycle ? tail : -1)));

  const frames = [];
  const baseNodes = () => labels.map((l, i) => ({ id: i, label: l }));
  const baseEdges = () => {
    const es = [];
    for (let i = 0; i < n; i++) if (next[i] >= 0) es.push({ a: i, b: next[i] });
    return es;
  };
  const snap = (slow, fast, extra, caption, chip) => {
    const nodes = baseNodes().map((nd) => {
      let state;
      if (nd.id === slow && nd.id === fast) state = 'current';
      else if (nd.id === slow) state = 'visited';
      else if (nd.id === fast) state = 'frontier';
      else if (extra && extra[nd.id]) state = extra[nd.id];
      return state ? { ...nd, state } : nd;
    });
    frames.push({ nodes, edges: baseEdges(), caption, chip });
  };

  snap(0, 0, null,
    `Floyd's tortoise & hare on this linked list. ${hasCycle ? `Node ${labels[tail]} is re-entered, so there IS a cycle.` : 'The list ends, so there is NO cycle.'} Slow (tortoise, marked visited) moves 1 step; fast (hare, frontier) moves 2. Both start at the head.`,
    { label: 'phase', value: '1: detect' });
  snap(0, 0, null,
    `Why it works: each step the hare gains exactly 1 node on the tortoise (relative speed 2 − 1 = 1). ${hasCycle ? 'Inside a cycle that gap shrinks modulo the cycle length until it hits 0 — a collision is unavoidable.' : 'On a straight list the hare simply runs off the end before any gap closes.'} O(1) extra space the whole way.`,
    { label: 'phase', value: '1: detect' });

  let slow = 0, fast = 0, step = 0, met = -1;
  const MAX = 4 * n + 6;
  while (step < MAX) {
    if (next[fast] < 0 || next[next[fast]] < 0) {
      snap(slow, fast, null,
        `Fast pointer reached the end of the list (no successor to take two steps). No meeting ever happened → the list is acyclic. Stop.`,
        { label: 'result', value: 'no cycle', tone: 'pink' });
      return frames;
    }
    slow = next[slow];
    fast = next[next[fast]];
    step += 1;
    if (slow === fast) {
      met = slow;
      snap(slow, fast, null,
        `Step ${step}: slow at ${labels[slow]}, fast at ${labels[fast]} — they COLLIDE. Inside a cycle the hare gains one node on the tortoise each step, so a meeting is guaranteed. Meeting node = ${labels[met]}.`,
        { label: 'meet', value: labels[met], tone: 'mint' });
      break;
    }
    snap(slow, fast, null,
      `Step ${step}: slow advances 1 → ${labels[slow]}, fast advances 2 → ${labels[fast]}. Not equal yet, keep walking.`,
      { label: 'step', value: step });
  }

  if (met < 0) return frames;

  // Phase 2: reset one pointer to head, walk both at speed 1; they meet at entry.
  let p = 0; let q = met; let s2 = 0;
  snap(p, q, { [met]: 'frontier' },
    `Phase 2 — find the cycle ENTRY. Reset p to the head; keep q at the meeting node ${labels[met]}. The algebra L = nC − k means both pointers, advancing 1 step each, land on the entry simultaneously.`,
    { label: 'phase', value: '2: entry' });

  while (p !== q && s2 < MAX) {
    p = next[p]; q = next[q]; s2 += 1;
    if (p === q) break;
    snap(p, q, null,
      `Advance both by 1: p at ${labels[p]}, q at ${labels[q]}. Still apart — continue.`,
      { label: 'step', value: s2 });
  }
  snap(p, p, { [p]: 'done' },
    `p and q meet at ${labels[p]} — that node is the CYCLE ENTRY. Total work O(n), extra space O(1): no hash set needed.`,
    { label: 'entry', value: labels[p], tone: 'accent' });

  return frames;
}

// ===========================================================================
// 5. Reservoir sampling (Vitter Algorithm R) — array renderer, seeded RNG
// ===========================================================================
function reservoirFrames(opts) {
  const stream = (opts && opts.stream) || ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const k = opts && Number.isInteger(opts.k) ? opts.k : 2;
  const seed = opts && Number.isInteger(opts.seed) ? opts.seed : 12345;
  const n = stream.length;
  if (!n || k <= 0) return [{ array: [], caption: 'Need a non-empty stream and k ≥ 1.' }];
  const kk = Math.min(k, n);

  const rng = makeRng(seed);
  const frames = [];
  const reservoir = [];
  const resRow = () => ({ values: stream.map((_, i) => (i < kk ? (reservoir[i] ?? '·') : '')), label: 'reservoir' });

  frames.push({
    array: stream,
    subRow: resRow(),
    chip: { label: 'k', value: kk },
    caption: `Reservoir sampling (Vitter Algorithm R): pick a uniform random ${kk}-subset of a stream whose length you do NOT know in advance, using only O(${kk}) memory. Invariant: after each item, the reservoir is a uniform random ${kk}-subset of everything seen so far.`,
  });

  for (let i = 1; i <= n; i++) {
    const item = stream[i - 1];
    if (i <= kk) {
      reservoir[i - 1] = item;
      frames.push({
        array: stream,
        highlights: { [i - 1]: 'match' },
        pointers: { [i - 1]: 'i' },
        subRow: resRow(),
        chip: { label: 'fill', value: `${i}/${kk}`, tone: 'mint' },
        caption: `Fill phase: the first ${kk} items go in deterministically. Place '${item}' into reservoir slot ${i}. This trivially satisfies the uniform-subset invariant.`,
      });
      continue;
    }
    const j = randInt1(rng, i); // uniform in [1, i]
    const accept = j <= kk;
    if (accept) {
      const replaced = reservoir[j - 1];
      reservoir[j - 1] = item;
      frames.push({
        array: stream,
        highlights: { [i - 1]: 'current' },
        pointers: { [i - 1]: 'i' },
        subRow: resRow(),
        chip: [{ label: 'j', value: `${j} of [1,${i}]` }, { label: 'p(keep)', value: `${kk}/${i}`, tone: 'sky' }],
        caption: `Item ${i} = '${item}'. Draw j = ${j} uniformly in [1, ${i}]. j ≤ ${kk} → ACCEPT: overwrite slot ${j} (was '${replaced}') with '${item}'. New item enters with probability ${kk}/${i}.`,
      });
    } else {
      frames.push({
        array: stream,
        highlights: { [i - 1]: 'rejected' },
        pointers: { [i - 1]: 'i' },
        subRow: resRow(),
        chip: [{ label: 'j', value: `${j} of [1,${i}]` }, { label: 'p(drop)', value: `${i - kk}/${i}`, tone: 'pink' }],
        caption: `Item ${i} = '${item}'. Draw j = ${j} in [1, ${i}]. j > ${kk} → DISCARD '${item}'. The reservoir is unchanged; the range INCLUDING i is what makes the keep-probability exactly ${kk}/${i}.`,
      });
    }
  }

  frames.push({
    array: stream,
    subRow: resRow(),
    chip: { label: 'sample', value: `[${reservoir.join(', ')}]`, tone: 'accent' },
    caption: `Stream done. Final reservoir = [${reservoir.join(', ')}]. Telescoping the survive-probabilities shows every one of the ${n} items ended up sampled with equal probability ${kk}/${n} — uniform over all ${kk}-subsets.`,
  });
  return frames;
}

// ===========================================================================
// 6. Palindromic tree (eertree) — tree renderer
// ===========================================================================
// Build an eertree for string s; emit a tree frame after each character.
// Node model for the renderer: { _id, value, state?, left, right }.
// We map the two roots + real nodes onto a binary { left, right } layout: each
// node keeps an ordered list of children, rendered left-to-right by splitting
// into left/right halves recursively (purely for drawing — structure is correct).
function eertreeFrames(input) {
  const s = String(input ?? 'abba');
  if (!s.length) return [{ tree: null, caption: 'Empty string — only the two imaginary roots exist.' }];

  // Eertree nodes: index 0 = odd root (len -1), 1 = even root (len 0).
  const len = [-1, 0];
  const link = [0, 0];          // odd root links to itself; even root links to odd root
  const to = [{}, {}];          // transition maps: char -> node id
  const parentChar = [null, null];
  const parentId = [null, null];
  let last = 1;                 // longest palindromic suffix node id
  const chars = [];

  const getLink = (v, i) => {
    // walk suffix links until s[i - len[v] - 1] === s[i]
    while (true) {
      const j = i - len[v] - 1;
      if (j >= 0 && chars[j] === chars[i]) return v;
      v = link[v];
    }
  };

  // Build a display tree rooted at a synthetic super-root holding the two roots.
  // Each eertree node may have many char-children; we lay them out by recursively
  // bisecting the ordered child list into a binary left/right tree for the SVG.
  const labelFor = (id) => {
    if (id === 0) return '−1';
    if (id === 1) return '0';
    // spell the palindrome by following parentChar/parentId chain
    return spell(id);
  };
  const spell = (id) => {
    // reconstruct palindrome string for node id
    if (id === 0) return '';
    if (id === 1) return '';
    const inner = spell(parentId[id]);
    const c = parentChar[id];
    return c + inner + c;
  };

  const childrenOf = (id) => {
    const out = [];
    for (let v = 0; v < len.length; v++) {
      if (parentId[v] === id) out.push(v);
    }
    return out;
  };

  // recursively bisect an ordered list of node-ids into a binary display node
  const buildDisplay = (id, newId, suffixHi) => {
    const kids = childrenOf(id);
    const node = {
      _id: `e${id}`,
      value: id <= 1 ? labelFor(id) : `"${spell(id)}"`,
      state: id === newId ? 'new'
        : (suffixHi && suffixHi.has(id) ? 'current'
          : (id <= 1 ? 'frontier' : undefined)),
      left: null,
      right: null,
    };
    if (kids.length === 0) return node;
    const childNodes = kids.map((cid) => buildDisplay(cid, newId, suffixHi));
    // chain children down the right spine so they all render distinctly
    let cursor = node;
    for (let ci = 0; ci < childNodes.length; ci++) {
      if (ci === 0) { cursor.left = childNodes[ci]; }
      else {
        // attach subsequent siblings to previous sibling's right to avoid overlap
        let tail = cursor.left;
        for (let t = 1; t < ci; t++) tail = tail.right || tail;
        tail.right = childNodes[ci];
      }
    }
    return node;
  };

  const makeTree = (newId, suffixHi) => {
    const odd = buildDisplay(0, newId, suffixHi);
    const even = buildDisplay(1, newId, suffixHi);
    // synthetic root joining both imaginary roots
    return { _id: 'root', value: 'ε', state: undefined, left: odd, right: even };
  };

  const frames = [];
  frames.push({
    tree: makeTree(null, null),
    chip: { label: 'string', value: `"${s}"` },
    caption: `Palindromic tree (eertree) for "${s}". Two imaginary roots seed it: the ODD root (length −1, parent of single-char palindromes) and the EVEN root (length 0, parent of even-length palindromes). Each real node is one distinct palindromic substring.`,
  });

  for (let i = 0; i < s.length; i++) {
    chars.push(s[i]);
    const c = s[i];
    const cur = getLink(last, i);
    const curLabel = cur <= 1 ? `root(${labelFor(cur)})` : `"${spell(cur)}"`;
    frames.push({
      tree: makeTree(null, new Set([cur, last])),
      chip: { label: `add '${c}'`, value: `i=${i}` },
      caption: `Append '${c}'. Walk suffix links from last (= ${last <= 1 ? `root(${labelFor(last)})` : `"${spell(last)}"`}) to the node ${curLabel} whose left-neighbour char also equals '${c}' — that is the only palindrome we can wrap with '${c}' on both sides.`,
    });

    if (c in to[cur]) {
      last = to[cur][c];
      frames.push({
        tree: makeTree(null, new Set([last])),
        chip: { label: 'existing', value: `"${spell(last)}"`, tone: 'sky' },
        caption: `The palindrome '${c}'+"${spell(cur)}"+'${c}' = "${spell(last)}" already exists (transition present). No new node — just move last to it. (At most one NEW palindrome per character; here it is zero.)`,
      });
      continue;
    }

    const u = len.length;
    len.push(len[cur] + 2);
    to.push({});
    parentChar.push(c);
    parentId.push(cur);
    if (len[u] === 1) {
      link.push(1); // single char palindromes link to even root
    } else {
      const w = getLink(link[cur], i);
      link.push(to[w][c]);
    }
    to[cur][c] = u;
    last = u;

    frames.push({
      tree: makeTree(u, new Set([link[u]])),
      chip: { label: 'NEW node', value: `"${spell(u)}" (len ${len[u]})`, tone: 'mint' },
      caption: `New distinct palindrome "${spell(u)}" of length ${len[u]} added as a child of ${cur <= 1 ? `root(${labelFor(cur)})` : `"${spell(cur)}"`} on edge '${c}'. Its suffix link points to ${link[u] <= 1 ? `root(${labelFor(link[u])})` : `"${spell(link[u])}"`} — the longest proper palindromic suffix.`,
    });
  }

  const realCount = len.length - 2;
  frames.push({
    tree: makeTree(null, null),
    chip: { label: 'distinct palindromes', value: realCount, tone: 'accent' },
    caption: `"${s}" has ${realCount} distinct palindromic substrings (eertree theorem caps this at n = ${s.length}). The whole build is O(n) amortized: each char adds ≤ 1 node and suffix-link hops are paid for by the bounded growth of last.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
export default {
  'kmp-failure-function': {
    title: 'KMP failure function (prefix function)',
    renderer: 'array',
    cases: [
      { label: 'ABABABC', frames: kmpFailureFrames('ABABABC') },
      { label: 'AABAACAABAA', frames: kmpFailureFrames('AABAACAABAA') },
      { label: 'AAAA (all equal)', frames: kmpFailureFrames('AAAA') },
    ],
    build: ({ pattern }) => kmpFailureFrames(pattern),
    inputSchema: {
      fields: [
        { name: 'pattern', label: 'Pattern', type: 'string', default: 'ABABABC', max: 16, placeholder: 'ABABABC' },
      ],
    },
  },
  'lis-patience-sorting': {
    title: 'LIS via patience sorting',
    renderer: 'array',
    cases: [
      { label: 'Classic [10,9,2,5,3,7,101,18]', frames: lisPatienceFrames([10, 9, 2, 5, 3, 7, 101, 18]) },
      { label: 'Already sorted [1,2,3,4,5]', frames: lisPatienceFrames([1, 2, 3, 4, 5]) },
      { label: 'Decreasing [5,4,3,2,1]', frames: lisPatienceFrames([5, 4, 3, 2, 1]) },
    ],
    build: ({ nums }) => lisPatienceFrames(nums),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'Array', type: 'intArray', default: [10, 9, 2, 5, 3, 7, 101, 18], max: 16, placeholder: '10, 9, 2, 5, 3, 7, 101, 18' },
      ],
    },
  },
  'edit-distance-algorithm': {
    title: 'Edit distance DP table',
    renderer: 'array',
    cases: [
      { label: 'kitten → sitting', frames: editDistanceFrames('kitten', 'sitting') },
      { label: 'horse → ros', frames: editDistanceFrames('horse', 'ros') },
      { label: 'abc → abc (no edits)', frames: editDistanceFrames('abc', 'abc') },
    ],
    build: ({ a, b }) => editDistanceFrames(a, b),
    inputSchema: {
      fields: [
        { name: 'a', label: 'Word A', type: 'string', default: 'kitten', max: 9, placeholder: 'kitten' },
        { name: 'b', label: 'Word B', type: 'string', default: 'sitting', max: 9, placeholder: 'sitting' },
      ],
    },
  },
  'floyd-cycle-detection': {
    title: "Floyd's tortoise & hare",
    renderer: 'graph',
    cases: [
      { label: 'Cycle (enter at 4)', frames: floydCycleFrames({ labels: ['1', '2', '3', '4', '5', '6', '7'], tail: 3 }) },
      { label: 'No cycle', frames: floydCycleFrames({ labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'], tail: -1 }) },
      { label: 'Whole list is a loop', frames: floydCycleFrames({ labels: ['1', '2', '3', '4', '5', '6'], tail: 0 }) },
    ],
  },
  'random-reservoir-stream': {
    title: 'Reservoir sampling (Algorithm R)',
    renderer: 'array',
    cases: [
      { label: 'k=2, A..H (seed 12345)', frames: reservoirFrames({ stream: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], k: 2, seed: 12345 }) },
      { label: 'k=3, A..J (seed 7)', frames: reservoirFrames({ stream: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], k: 3, seed: 7 }) },
      { label: 'k=1, A..J (reservoir of one)', frames: reservoirFrames({ stream: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], k: 1, seed: 99 }) },
    ],
  },
  'palindrome-eertree': {
    title: 'Palindromic tree (eertree)',
    renderer: 'tree',
    cases: [
      { label: 'abacaba', frames: eertreeFrames('abacaba') },
      { label: 'eertree', frames: eertreeFrames('eertree') },
      { label: 'aaaa (all equal)', frames: eertreeFrames('aaaa') },
    ],
    build: ({ text }) => eertreeFrames(text),
    inputSchema: {
      fields: [
        { name: 'text', label: 'String', type: 'string', default: 'abba', max: 12, placeholder: 'abba' },
      ],
    },
  },
};
