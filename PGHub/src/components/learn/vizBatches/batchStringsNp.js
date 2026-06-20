// Interactive viz for advanced string concepts + two VisuAlgo-gap NP topics.
//
// Array renderer (frame shape mirrors batchStringMatch.js):
//   frame = { array:[chars], subRow?:{values,label}, pointers?:{idx:tag},
//             highlights?:{idx:role}, eliminated?:Set<idx>, caption }
//   highlight roles narrate intent: 'current' | 'match' | 'pivot' | 'done' | 'window'.
//
// Graph renderer (frame shape mirrors batchGraphTraversal.js):
//   frame = { nodes:[{id,label,state?}], edges:[{a,b,w?,state?}], caption }
//   node states: 'current' | 'frontier' | 'visited' | 'done'
//   edge states: 'current' | 'frontier' | 'tree' | 'visited' | 'rejected'
//
// All helpers are self-contained pure JS — no imports from conceptVisualizations.js.

// ===========================================================================
// Manacher's algorithm — longest palindromic substring in O(n).
// We run on the transformed string with '#' separators so even/odd palindromes
// are handled uniformly; the radius array p[i] is the half-length at center i.
// ===========================================================================
function manacherFrames(raw = 'abacabad') {
  const s = String(raw ?? '');
  if (!s.length) return [{ array: [''], caption: 'Empty string — no palindrome to find.' }];

  // Transform: ^ # a # b # ... # $  (sentinels avoid bounds checks).
  const t = ['#'];
  for (const c of s) { t.push(c); t.push('#'); }
  const arr = t.slice();
  const n = arr.length;
  const p = new Array(n).fill(0);
  const frames = [];

  const subP = () => ({ values: arr.map((_, i) => (p[i] ? String(p[i]) : '·')), label: 'radius p' });

  frames.push({
    array: arr,
    subRow: subP(),
    caption: `Manacher: insert '#' between every character (and at the ends) so a string of length ${s.length} becomes "${arr.join('')}" of length ${n}. Now EVERY palindrome has odd length and a single center — even and odd cases collapse into one.`,
  });
  frames.push({
    array: arr,
    subRow: subP(),
    caption: `Maintain a current palindrome [C-R … C+R] with center C and right edge R. The radius array p[i] = how far the palindrome centered at i reaches. We sweep i left to right, reusing the mirror i' = 2C - i whenever i sits inside the known palindrome.`,
  });

  let C = 0, R = 0, bestLen = 0, bestCenter = 0;
  for (let i = 1; i < n - 1; i++) {
    const mirror = 2 * C - i;
    if (i < R) {
      p[i] = Math.min(R - i, p[mirror]);
      frames.push({
        array: arr,
        subRow: subP(),
        pointers: { [i]: 'i', [mirror]: "i'", [C]: 'C', [R]: 'R' },
        highlights: { [i]: 'current', [mirror]: 'pivot' },
        eliminated: new Set(),
        caption: `i=${i} is inside the current palindrome (R=${R}). Mirror it to i'=2·${C}-${i}=${mirror}. Reuse p[i'] but cap it at R-i=${R - i} so we never claim past the known boundary → start p[${i}]=${p[i]} for free, skipping ${p[i]} comparisons.`,
      });
    } else {
      frames.push({
        array: arr,
        subRow: subP(),
        pointers: { [i]: 'i', [C]: 'C', [R]: 'R' },
        highlights: { [i]: 'current' },
        eliminated: new Set(),
        caption: `i=${i} is at or past R=${R}: no mirror information to reuse. Begin a fresh expansion from radius 0.`,
      });
    }
    // Attempt to expand around i.
    let expanded = 0;
    while (i - p[i] - 1 >= 0 && i + p[i] + 1 < n && arr[i - p[i] - 1] === arr[i + p[i] + 1]) {
      p[i]++;
      expanded++;
    }
    if (expanded) {
      frames.push({
        array: arr,
        subRow: subP(),
        pointers: { [i]: 'i', [i - p[i]]: 'L', [i + p[i]]: 'Rt' },
        highlights: Object.fromEntries(
          Array.from({ length: 2 * p[i] + 1 }, (_, k) => [i - p[i] + k, 'match']),
        ),
        eliminated: new Set(),
        caption: `Expand around i=${i}: matched ${expanded} more pair${expanded === 1 ? '' : 's'} of '#'-separated chars. p[${i}]=${p[i]} now spans "${arr.slice(i - p[i], i + p[i] + 1).join('')}".`,
      });
    }
    if (i + p[i] > R) {
      const oldR = R;
      C = i; R = i + p[i];
      frames.push({
        array: arr,
        subRow: subP(),
        pointers: { [C]: 'C', [R]: 'R' },
        highlights: { [C]: 'current', [R]: 'done' },
        eliminated: new Set(),
        caption: `Palindrome at ${i} reaches index ${i + p[i]} > old R=${oldR}. Slide the window: new center C=${C}, new right edge R=${R}. Future i' inside this span get free reuse.`,
      });
    }
    if (p[i] > bestLen) { bestLen = p[i]; bestCenter = i; }
  }

  // Recover the answer in the original string.
  const start = Math.floor((bestCenter - bestLen) / 2);
  const answer = s.slice(start, start + bestLen);
  frames.push({
    array: arr,
    subRow: subP(),
    pointers: { [bestCenter]: 'best' },
    highlights: Object.fromEntries(
      Array.from({ length: 2 * bestLen + 1 }, (_, k) => [bestCenter - bestLen + k, 'done']),
    ),
    eliminated: new Set(),
    caption: `Largest radius is p[${bestCenter}]=${bestLen}. Map back to the original string: start=${start}, length=${bestLen} → longest palindrome = "${answer}". Total work is O(n): R only ever moves forward, so the inner expansion is amortised O(1) per index.`,
  });
  return frames;
}

// ===========================================================================
// Rolling hash (Rabin-Karp) — polynomial hash over a sliding window with O(1)
// rehash on each slide. We hunt for `pattern` inside `text`.
// ===========================================================================
function rollingHashFrames(text = 'abracadabra', pattern = 'cada') {
  const t = String(text ?? '');
  const p = String(pattern ?? '');
  if (!t.length || !p.length || p.length > t.length) {
    return [{ array: t.split(''), caption: 'Pattern is empty or longer than the text — nothing to roll.' }];
  }
  const arr = t.split('');
  const L = p.length;
  const B = 31;          // base
  const M = 1009;        // small prime modulus (kept tiny so numbers stay readable)
  const code = (c) => c.charCodeAt(0) - 96; // 'a' -> 1
  const frames = [];

  // Precompute B^(L-1) mod M for the leading-char removal.
  let highPow = 1;
  for (let k = 0; k < L - 1; k++) highPow = (highPow * B) % M;

  // Pattern hash.
  let ph = 0;
  for (let k = 0; k < L; k++) ph = (ph * B + code(p[k])) % M;

  const subFor = (s) => ({
    values: arr.map((_, i) => (i >= s && i < s + L ? p[i - s] : '')),
    label: 'pattern',
  });

  frames.push({
    array: arr,
    caption: `Rolling hash: treat a length-${L} window as a base-${B} number mod ${M}. hash = (c0·${B}^${L - 1} + c1·${B}^${L - 2} + … + c${L - 1}) mod ${M}, where 'a'=1, 'b'=2, … Equal hashes ⇒ candidate match (then verify char-by-char to rule out collisions).`,
  });
  frames.push({
    array: arr,
    subRow: subFor(0),
    caption: `Hash the pattern "${p}" once: H(p)=${ph}. Precompute ${B}^${L - 1} mod ${M} = ${highPow} — that constant lets us peel the leading char off the window in O(1) as it slides.`,
  });

  // Initial window hash.
  let wh = 0;
  for (let k = 0; k < L; k++) wh = (wh * B + code(arr[k])) % M;
  frames.push({
    array: arr,
    subRow: subFor(0),
    pointers: { 0: 'L', [L - 1]: 'R' },
    highlights: Object.fromEntries(Array.from({ length: L }, (_, k) => [k, 'window'])),
    eliminated: new Set(),
    caption: `First window "${t.slice(0, L)}" (indices 0..${L - 1}): build its hash directly = ${wh}. ${wh === ph ? 'Matches H(p)' : 'Differs from H(p)=' + ph}.`,
  });

  const eliminated = new Set();
  for (let s = 0; s <= t.length - L; s++) {
    if (s > 0) {
      // Roll: remove arr[s-1], add arr[s+L-1].
      const out = code(arr[s - 1]);
      const inc = code(arr[s + L - 1]);
      const prev = wh;
      wh = ((wh - out * highPow % M + M * (B)) % M); // remove leading (keep non-negative)
      wh = (wh * B + inc) % M;
      eliminated.add(s - 1);
      frames.push({
        array: arr,
        subRow: subFor(s),
        pointers: { [s]: 'L', [s + L - 1]: 'R' },
        highlights: Object.fromEntries(Array.from({ length: L }, (_, k) => [s + k, 'window'])),
        eliminated: new Set(eliminated),
        caption: `Slide to index ${s}: drop leading '${arr[s - 1]}' (subtract ${out}·${highPow}), shift left (×${B}), add trailing '${arr[s + L - 1]}' (+${inc}). Rehash O(1): ${prev} → ${wh}. No re-reading the window.`,
      });
    }
    if (wh === ph) {
      const win = t.slice(s, s + L);
      const real = win === p;
      frames.push({
        array: arr,
        subRow: subFor(s),
        pointers: { [s]: 'L', [s + L - 1]: 'R' },
        highlights: Object.fromEntries(Array.from({ length: L }, (_, k) => [s + k, real ? 'match' : 'pivot'])),
        eliminated: new Set(eliminated),
        caption: `Hash hit at index ${s}: window hash ${wh} == H(p)=${ph}. Verify chars: "${win}" ${real ? `== "${p}" → REAL MATCH at index ${s}.` : `!= "${p}" → spurious collision, discard.`}`,
      });
    }
  }
  frames.push({
    array: arr,
    eliminated: new Set(arr.map((_, k) => k)),
    caption: `Scan complete: every length-${L} window hashed in O(1) after the first, total O(n). Only hash-equal windows ever triggered a full comparison — that is Rabin-Karp's expected-linear search.`,
  });
  return frames;
}

// ===========================================================================
// Suffix array — sort all suffixes of s lexicographically. We use the simple
// O(n^2 log n) "sort the suffixes" view (correct + clearest to narrate); the
// real algorithms reach O(n log n) via prefix-doubling but the OUTPUT is this.
// ===========================================================================
function suffixArrayFrames(raw = 'banana') {
  const base = String(raw ?? '');
  if (!base.length) return [{ array: ['$'], caption: 'Empty string — only the sentinel suffix exists.' }];
  const s = base + '$';            // sentinel smaller than every letter
  const arr = s.split('');
  const n = s.length;
  const frames = [];

  // All suffixes with their start index.
  const suffixes = [];
  for (let i = 0; i < n; i++) suffixes.push({ i, str: s.slice(i) });

  frames.push({
    array: arr,
    caption: `Suffix array of "${base}". Append a sentinel '$' (lexicographically smallest) → "${s}". List every suffix by its start index 0..${n - 1}; the suffix array is these indices sorted by the suffix text.`,
  });

  // Show each suffix highlighted.
  for (let i = 0; i < n; i++) {
    frames.push({
      array: arr,
      pointers: { [i]: 'i' },
      highlights: Object.fromEntries(Array.from({ length: n - i }, (_, k) => [i + k, 'window'])),
      eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
      caption: `Suffix starting at index ${i}: "${suffixes[i].str}". There are ${n} suffixes total; sorting them is the whole job.`,
    });
  }

  // Sort them and animate the sorted order.
  const sorted = suffixes.slice().sort((a, b) => (a.str < b.str ? -1 : a.str > b.str ? 1 : 0));
  const sa = sorted.map((x) => x.i);

  frames.push({
    array: arr,
    subRow: { values: arr.map((_, i) => (sa.indexOf(i) >= 0 ? String(sa.indexOf(i)) : '')), label: 'rank' },
    caption: `Compare suffixes lexicographically (the sentinel '$' breaks ties cleanly). Sorted order of start indices: sa = [${sa.join(', ')}].`,
  });

  // Walk the sorted suffixes in order, computing LCP with predecessor (Kasai output).
  let prev = null;
  for (let r = 0; r < sorted.length; r++) {
    const { i, str } = sorted[r];
    let lcp = 0;
    if (prev) { while (lcp < prev.str.length && lcp < str.length && prev.str[lcp] === str[lcp]) lcp++; }
    frames.push({
      array: arr,
      pointers: { [i]: 'sa[' + r + ']' },
      highlights: Object.fromEntries(Array.from({ length: n - i }, (_, k) => [i + k, 'match'])),
      eliminated: new Set(),
      caption: `Rank ${r}: suffix "${str}" starts at index ${i}.${prev ? ` LCP with previous suffix "${prev.str}" = ${lcp} char${lcp === 1 ? '' : 's'}.` : ' First in sorted order — smallest suffix.'} The LCP array between adjacent sorted suffixes powers substring search and distinct-substring counts.`,
    });
    prev = { i, str };
  }

  // Distinct substring count = sum over suffixes of (len - lcp).
  let distinct = 0;
  prev = null;
  for (const { str } of sorted) {
    let lcp = 0;
    if (prev) { while (lcp < prev.length && lcp < str.length && prev[lcp] === str[lcp]) lcp++; }
    distinct += str.length - lcp;
    prev = str;
  }
  frames.push({
    array: arr,
    subRow: { values: arr.map((_, i) => (sa.indexOf(i) >= 0 ? String(sa.indexOf(i)) : '')), label: 'rank' },
    caption: `Application: distinct substrings of "${s}" = Σ (len(suffix) − LCP with predecessor) = ${distinct}. The same sorted structure answers "longest repeated substring" (max LCP) in one pass.`,
  });
  return frames;
}

// ===========================================================================
// Suffix automaton (SAM) — online construction, one character at a time.
// We narrate the canonical Blumer/cp-algorithms extend(): clone-on-split,
// suffix links, and the length (len) of each state's longest endpos-equivalent.
// ===========================================================================
function suffixAutomatonFrames(raw = 'abb') {
  const s = String(raw ?? '');
  if (!s.length) return [{ array: ['ε'], caption: 'Empty string — the automaton has only the initial state.' }];
  const arr = s.split('');
  const frames = [];

  // SAM state: { len, link, next:{char:stateId} }.
  const st = [{ len: 0, link: -1, next: {} }];
  let last = 0;

  frames.push({
    array: arr,
    caption: `Suffix automaton of "${s}". Build it ONLINE: append one char at a time, keeping at most 2n−1 states. Each state owns a set of substrings sharing the same end-positions; len = length of its longest such substring, link = suffix link to the next-shorter end-position class.`,
  });

  const stateSummary = () => st.map((x, id) => `q${id}(len ${x.len}, link ${x.link})`).join('  ');

  for (let pos = 0; pos < arr.length; pos++) {
    const c = arr[pos];
    frames.push({
      array: arr,
      pointers: { [pos]: 'c' },
      highlights: { [pos]: 'current' },
      eliminated: new Set(Array.from({ length: pos }, (_, k) => k)),
      caption: `Extend by '${c}' (position ${pos}). Create a new state cur for the whole prefix "${s.slice(0, pos + 1)}", with len = ${st[last].len + 1}. Then walk suffix links from 'last' adding '${c}'-transitions.`,
    });

    const cur = st.length;
    st.push({ len: st[last].len + 1, link: -1, next: {} });
    let p = last;
    while (p !== -1 && !(c in st[p].next)) {
      st[p].next[c] = cur;
      p = st[p].link;
    }
    frames.push({
      array: arr,
      pointers: { [pos]: 'c' },
      highlights: { [pos]: 'window' },
      eliminated: new Set(Array.from({ length: pos }, (_, k) => k)),
      caption: `Walk suffix links from q${last} adding '${c}' → q${cur} on every state that had no '${c}' edge. Stopped at ${p === -1 ? 'the root boundary (p = −1)' : `q${p}, which already has a '${c}' transition`}. States so far: ${stateSummary()}.`,
    });

    if (p === -1) {
      st[cur].link = 0;
      frames.push({
        array: arr,
        highlights: { [pos]: 'done' },
        eliminated: new Set(Array.from({ length: pos }, (_, k) => k)),
        caption: `Reached the root: every suffix is brand-new, so link(q${cur}) = q0. No split needed.`,
      });
    } else {
      const q = st[p].next[c];
      if (st[p].len + 1 === st[q].len) {
        st[cur].link = q;
        frames.push({
          array: arr,
          highlights: { [pos]: 'done' },
          eliminated: new Set(Array.from({ length: pos }, (_, k) => k)),
          caption: `q${p} --'${c}'--> q${q} is "solid" (len(q${p})+1 = ${st[p].len + 1} = len(q${q})). Just set link(q${cur}) = q${q}. No clone needed.`,
        });
      } else {
        // Clone q.
        const clone = st.length;
        st.push({ len: st[p].len + 1, link: st[q].link, next: { ...st[q].next } });
        frames.push({
          array: arr,
          highlights: { [pos]: 'pivot' },
          eliminated: new Set(Array.from({ length: pos }, (_, k) => k)),
          caption: `SPLIT: edge q${p}--'${c}'-->q${q} is non-solid (len(q${p})+1=${st[p].len + 1} ≠ len(q${q})=${st[q].len}). Clone q${q} → q${clone} with len ${st[p].len + 1}, copying its transitions and suffix link. This separates the short end-position class from the long one.`,
        });
        while (p !== -1 && st[p].next[c] === q) { st[p].next[c] = clone; p = st[p].link; }
        st[q].link = clone;
        st[cur].link = clone;
        frames.push({
          array: arr,
          highlights: { [pos]: 'done' },
          eliminated: new Set(Array.from({ length: pos }, (_, k) => k)),
          caption: `Redirect the '${c}'-edges that pointed to q${q} so they now point to the clone q${clone}; set link(q${q}) = link(q${cur}) = q${clone}. States: ${stateSummary()}.`,
        });
      }
    }
    last = cur;
  }

  // Distinct substrings = sum over states (len - len[link]).
  let distinct = 0;
  for (let id = 1; id < st.length; id++) distinct += st[id].len - st[st[id].link].len;
  frames.push({
    array: arr,
    eliminated: new Set(arr.map((_, k) => k)),
    caption: `Built in ${st.length} states for |s|=${s.length} (≤ 2n−1). Application: distinct substrings = Σ (len(q) − len(link(q))) over all states = ${distinct}. Each query "is t a substring?" now runs in O(|t|) by following transitions from the root.`,
  });
  return frames;
}

// ===========================================================================
// Steiner tree — connect a set of TERMINAL nodes with a minimum-weight tree,
// allowed to use extra (Steiner) nodes. We narrate a greedy/MST-style growth:
// repeatedly attach the cheapest path connecting a new terminal to the tree.
// (Demonstration order is the classic 2-approximation: grow over terminals.)
// ===========================================================================
function steinerFrames({ nodes, edges, terminals, chosen, label }) {
  // chosen: ordered list of edge keys "a-b" that the algorithm commits, each
  // annotated with the terminal it connects. We replay them as tree growth.
  const inTree = new Set();
  const treeEdges = new Set();
  const termSet = new Set(terminals);
  const frames = [];
  let total = 0;

  const key = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;

  const snap = (currentId, caption) => {
    const ns = nodes.map((n) => ({
      ...n,
      label: `${n.id}${termSet.has(n.id) ? '*' : ''}`,
      state: n.id === currentId ? 'current'
        : termSet.has(n.id) && inTree.has(n.id) ? 'done'
        : inTree.has(n.id) ? 'visited'
        : termSet.has(n.id) ? 'frontier'
        : undefined,
    }));
    const es = edges.map((e) => (treeEdges.has(key(e.a, e.b)) ? { ...e, state: 'tree' } : { ...e }));
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `${label}: terminals are marked with * = {${terminals.join(', ')}}. Goal: a minimum-weight connected subtree spanning all of them. Extra "Steiner" (non-terminal) nodes may be borrowed if they make the connection cheaper.`);

  // Seed the tree with the first terminal.
  const first = terminals[0];
  inTree.add(first);
  snap(first, `Seed the tree with terminal ${first}. The tree currently spans just {${first}}; we grow it terminal by terminal, always splicing in the cheapest path to a still-disconnected terminal.`);

  for (const step of chosen) {
    const w = edges.find((e) => key(e.a, e.b) === key(step.a, step.b))?.w ?? 0;
    const newNode = inTree.has(step.a) ? step.b : step.a;
    const anchor = inTree.has(step.a) ? step.a : step.b;
    // Candidate-consideration frame (mark the edge as 'frontier' before committing).
    {
      const ns = nodes.map((n) => ({
        ...n,
        label: `${n.id}${termSet.has(n.id) ? '*' : ''}`,
        state: n.id === newNode ? 'frontier'
          : termSet.has(n.id) && inTree.has(n.id) ? 'done'
          : inTree.has(n.id) ? 'visited'
          : termSet.has(n.id) ? 'frontier'
          : undefined,
      }));
      const es = edges.map((e) => (treeEdges.has(key(e.a, e.b)) ? { ...e, state: 'tree' }
        : key(e.a, e.b) === key(step.a, step.b) ? { ...e, state: 'frontier' } : { ...e }));
      frames.push({ nodes: ns, edges: es, caption: `Cheapest way to reach ${newNode} from the current tree (at node ${anchor}) is edge ${step.a}–${step.b}, weight ${w}. Consider committing it.` });
    }
    treeEdges.add(key(step.a, step.b));
    inTree.add(step.a); inTree.add(step.b);
    total += w;
    const isSteiner = !termSet.has(newNode);
    snap(newNode, `Add edge ${step.a}–${step.b} (weight ${w}). ${isSteiner ? `Node ${newNode} is a Steiner node — not a terminal, but routing through it is cheaper than a direct link. ` : `This pulls terminal ${newNode} into the tree. `}Tree weight so far = ${total}.`);
  }

  const allIn = terminals.every((t) => inTree.has(t));
  snap(null, `${label}: all terminals {${terminals.join(', ')}} ${allIn ? 'are connected' : 'targeted'}. Final Steiner tree weight = ${total}. Unlike an MST over only terminals, the optimum may dip through non-terminal nodes — that detour is exactly what makes the Steiner tree problem NP-hard.`);
  snap(null, `Why NP-hard: choosing WHICH non-terminal (Steiner) nodes to include is a combinatorial choice over a power set. With 2 terminals it is just a shortest path; with k terminals the best subset has no known polynomial recipe. The growth shown here is the classic metric 2-approximation, not guaranteed optimal.`);
  return frames;
}

function steinerSmall() {
  // 6 nodes; terminals 0,3,5. Steiner node 1 routes 0->3 cheaply.
  const nodes = [0, 1, 2, 3, 4, 5].map((id) => ({ id }));
  const edges = [
    { a: 0, b: 1, w: 2 }, { a: 1, b: 3, w: 2 }, { a: 0, b: 3, w: 7 },
    { a: 1, b: 2, w: 4 }, { a: 3, b: 4, w: 3 }, { a: 4, b: 5, w: 2 },
    { a: 3, b: 5, w: 6 }, { a: 2, b: 5, w: 5 },
  ];
  const terminals = [0, 3, 5];
  // Optimal-ish tree: 0-1 (2), 1-3 (2), 3-4 (3), 4-5 (2) total 9 — uses Steiner nodes 1,4.
  const chosen = [
    { a: 0, b: 1 }, { a: 1, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 5 },
  ];
  return steinerFrames({ nodes, edges, terminals, chosen, label: 'Steiner tree (route through Steiner nodes)' });
}

function steinerStar() {
  // A central hub makes connecting 3 terminals much cheaper than pairwise edges.
  const nodes = [0, 1, 2, 3].map((id) => ({ id }));
  const edges = [
    { a: 0, b: 3, w: 1 }, { a: 1, b: 3, w: 1 }, { a: 2, b: 3, w: 1 },
    { a: 0, b: 1, w: 5 }, { a: 1, b: 2, w: 5 }, { a: 0, b: 2, w: 5 },
  ];
  const terminals = [0, 1, 2];
  // Star through hub 3: total 3, vs any 2 direct edges = 10.
  const chosen = [
    { a: 0, b: 3 }, { a: 1, b: 3 }, { a: 2, b: 3 },
  ];
  return steinerFrames({ nodes, edges, terminals, chosen, label: 'Steiner tree (hub beats direct edges)' });
}

// ===========================================================================
// NP reductions — Independent Set <-> Vertex Cover complement, and a 3-SAT ->
// Independent Set gadget. We show the reduction AS A GRAPH transformation so
// the viewer sees why a yes-instance maps to a yes-instance.
// ===========================================================================
function vcIsComplementFrames() {
  // Same graph; show that S is an Independent Set iff V\S is a Vertex Cover.
  const nodes = [0, 1, 2, 3, 4].map((id) => ({ id }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 4, b: 0 }, { a: 0, b: 2 },
  ];
  const indep = new Set([1, 3]);            // an independent set
  const cover = new Set([0, 2, 4]);          // its complement = a vertex cover
  const frames = [];

  const paint = (set, role, caption, edgeRole) => {
    const ns = nodes.map((n) => ({
      ...n,
      state: set.has(n.id) ? role : undefined,
    }));
    const es = edges.map((e) => ({
      ...e,
      state: edgeRole ? edgeRole(e) : undefined,
    }));
    frames.push({ nodes: ns, edges: es, caption });
  };

  paint(new Set(), undefined, 'Reduction: Vertex Cover ≤ₚ Independent Set (and back). Claim — in any graph, a set S is an INDEPENDENT SET if and only if its complement V∖S is a VERTEX COVER. So solving one solves the other with zero extra cost.');
  paint(indep, 'done', `Pick the independent set S = {${[...indep].join(', ')}} (highlighted): no edge has BOTH endpoints in S — verify each edge touches at most one highlighted node. Size |S| = ${indep.size}.`,
    (e) => (indep.has(e.a) && indep.has(e.b) ? 'rejected' : 'visited'));
  paint(cover, 'current', `Now take the complement V∖S = {${[...cover].join(', ')}}. Every edge must have at least one endpoint here — because if an edge missed the cover, both its endpoints would be in S, contradicting independence. So the complement is a VERTEX COVER of size ${cover.size}.`,
    (e) => (cover.has(e.a) || cover.has(e.b) ? 'tree' : 'rejected'));
  // Edge-by-edge verification of the cover.
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const covered = cover.has(e.a) || cover.has(e.b);
    frames.push({
      nodes: nodes.map((n) => ({ ...n, state: cover.has(n.id) ? 'current' : undefined })),
      edges: edges.map((x, j) => ({ ...x, state: j === i ? 'frontier' : (cover.has(x.a) || cover.has(x.b)) ? 'tree' : undefined })),
      caption: `Check edge ${e.a}–${e.b}: covered by {${[e.a, e.b].filter((v) => cover.has(v)).join(', ')}}. ${covered ? 'At least one endpoint is in the cover — good.' : 'UNCOVERED — would break the reduction.'}`,
    });
  }
  paint(indep, 'done', `Conclusion: maximising the independent set = minimising the vertex cover. |max IS| + |min VC| = |V| = ${nodes.length}. A polynomial transformation maps a yes-instance of one to a yes-instance of the other, which is exactly what a reduction must do.`,
    (e) => (cover.has(e.a) || cover.has(e.b) ? 'tree' : undefined));
  return frames;
}

function threeSatToIsFrames() {
  // 3-SAT -> Independent Set. Formula: (x ∨ y ∨ z) ∧ (¬x ∨ y ∨ ¬z).
  // Build a triangle gadget per clause; connect a literal to its negation across clauses.
  // Node ids: clause1 {0:x, 1:y, 2:z}, clause2 {3:¬x, 4:y, 5:¬z}.
  const lit = { 0: 'x', 1: 'y', 2: 'z', 3: '¬x', 4: 'y', 5: '¬z' };
  const nodes = [0, 1, 2, 3, 4, 5].map((id) => ({ id, label: `${id}:${lit[id]}` }));
  // Triangle edges inside each clause (pick exactly one literal per clause).
  const clauseEdges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 0, b: 2 },     // clause 1 triangle
    { a: 3, b: 4 }, { a: 4, b: 5 }, { a: 3, b: 5 },     // clause 2 triangle
  ];
  // Conflict edges: a literal and its negation cannot both be chosen.
  const conflictEdges = [
    { a: 0, b: 3 },  // x vs ¬x
    { a: 2, b: 5 },  // z vs ¬z
  ];
  const edges = [...clauseEdges, ...conflictEdges];
  const frames = [];

  const snap = (chosen, edgeRole, caption) => {
    const ns = nodes.map((n) => ({ ...n, state: chosen && chosen.has(n.id) ? 'done' : undefined }));
    const es = edges.map((e) => ({ ...e, state: edgeRole ? edgeRole(e) : undefined }));
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, null, '3-SAT ≤ₚ Independent Set. Formula (x ∨ y ∨ z) ∧ (¬x ∨ y ∨ ¬z): each node is a literal in a clause. Build one TRIANGLE per clause so any independent set picks at most one literal from it.');
  snap(null, (e) => (e.a < 3 === e.b < 3 ? 'tree' : undefined),
    'Clause gadget: the three literals of a clause form a triangle (highlighted). An independent set can include at most ONE triangle vertex → it represents choosing exactly one literal to satisfy that clause.');
  snap(null, (e) => (e.a < 3 !== e.b < 3 ? 'rejected' : undefined),
    'Consistency gadget: add an edge between every literal and its negation across clauses (x—¬x, z—¬z, shown rejected). Picking both endpoints is now forbidden, so the truth assignment stays consistent.');
  // Walk each clause triangle so the viewer sees the per-clause structure.
  snap(new Set([0, 1, 2]), (e) => (e.a < 3 && e.b < 3 ? 'tree' : undefined),
    'Clause 1 = (x ∨ y ∨ z): its three literals {0:x, 1:y, 2:z} form a triangle. An independent set takes at most one of them — picking node v means "satisfy clause 1 using literal v".');
  snap(new Set([3, 4, 5]), (e) => (e.a >= 3 && e.b >= 3 ? 'tree' : undefined),
    'Clause 2 = (¬x ∨ y ∨ ¬z): triangle over {3:¬x, 4:y, 5:¬z}. Same rule — one literal per clause. With 2 clauses we will demand an independent set of size exactly 2.');
  // A satisfying assignment: x=T,y=*,z=T → choose x in clause1, y in clause2 (y true) ...
  // Pick {0 (x), 4 (y)} : independent? 0-4 not an edge; 0-3 conflict but 3 not chosen. Good, but that's only 2 — need one per clause = 2 total. k=2 clauses.
  const chosen = new Set([0, 4]);
  snap(chosen, (e) => {
    if (chosen.has(e.a) && chosen.has(e.b)) return 'rejected';
    if (chosen.has(e.a) || chosen.has(e.b)) return 'visited';
    return undefined;
  }, `Ask for an independent set of size k = #clauses = 2. Found {0:x, 4:y}: one literal per clause, no conflict edge inside the set. This corresponds to the assignment x = true, y = true (z free) — which satisfies BOTH clauses.`);
  // Verify each chosen vertex has no neighbour in the set.
  for (const v of chosen) {
    const nbrs = edges.filter((e) => e.a === v || e.b === v).map((e) => (e.a === v ? e.b : e.a));
    const conflict = nbrs.some((x) => chosen.has(x));
    frames.push({
      nodes: nodes.map((n) => ({ ...n, state: chosen.has(n.id) ? (n.id === v ? 'current' : 'done') : undefined })),
      edges: edges.map((e) => ({ ...e, state: (e.a === v || e.b === v) ? 'frontier' : undefined })),
      caption: `Verify literal ${v}:${lit[v]} — neighbours {${nbrs.join(', ')}}. None are in the chosen set (${conflict ? 'CONFLICT' : 'independent'}), so the selection is a valid independent set.`,
    });
  }
  snap(chosen, (e) => (chosen.has(e.a) || chosen.has(e.b) ? 'visited' : undefined),
    'Read off the assignment: chosen literals {x, y} are set true. Clause 1 (x ∨ y ∨ z) is satisfied by x; clause 2 (¬x ∨ y ∨ ¬z) is satisfied by y. Both clauses true → the formula is satisfiable.');
  snap(chosen, (e) => (chosen.has(e.a) || chosen.has(e.b) ? 'visited' : undefined),
    'Reduction works both ways: an independent set of size k exists if and only if the formula is satisfiable. Since the gadget graph is built in polynomial time, a fast Independent-Set solver would yield a fast 3-SAT solver — which is why Independent Set is NP-hard.');
  return frames;
}

// ===========================================================================
export default {
  'string-manacher': {
    title: "Manacher's algorithm: O(n) longest palindrome",
    renderer: 'array',
    cases: [
      { label: 'abacabad', frames: manacherFrames('abacabad') },
      { label: 'Even palindrome (abba)', frames: manacherFrames('cabbad') },
      { label: 'All same (aaaa)', frames: manacherFrames('aaaa') },
    ],
    build: ({ text }) => manacherFrames(text),
    inputSchema: {
      fields: [
        { name: 'text', label: 'String', type: 'string', default: 'abacabad', max: 18, placeholder: 'abacabad' },
      ],
    },
  },
  'string-rolling-hash': {
    title: 'Rolling hash: O(1) window rehash (Rabin-Karp)',
    renderer: 'array',
    cases: [
      { label: 'Find "cada" in abracadabra', frames: rollingHashFrames('abracadabra', 'cada') },
      { label: 'Repeated "ana" in bananabanana', frames: rollingHashFrames('bananabanana', 'ana') },
      { label: 'No match', frames: rollingHashFrames('mississippi', 'abc') },
    ],
    build: ({ text, pattern }) => rollingHashFrames(text, pattern),
    inputSchema: {
      fields: [
        { name: 'text', label: 'Text', type: 'string', default: 'abracadabra', max: 24, placeholder: 'abracadabra' },
        { name: 'pattern', label: 'Pattern', type: 'string', default: 'cada', max: 10, placeholder: 'cada' },
      ],
    },
  },
  'string-suffix-array': {
    title: 'Suffix array: sort all suffixes + LCP',
    renderer: 'array',
    cases: [
      { label: 'banana', frames: suffixArrayFrames('banana') },
      { label: 'abracad', frames: suffixArrayFrames('abracad') },
      { label: 'mississ', frames: suffixArrayFrames('mississ') },
    ],
    build: ({ text }) => suffixArrayFrames(text),
    inputSchema: {
      fields: [
        { name: 'text', label: 'String', type: 'string', default: 'banana', max: 10, placeholder: 'banana' },
      ],
    },
  },
  'string-suffix-automaton': {
    title: 'Suffix automaton: online linear-size DFA',
    renderer: 'array',
    cases: [
      { label: 'abb (split case)', frames: suffixAutomatonFrames('abb') },
      { label: 'abcbc', frames: suffixAutomatonFrames('abcbc') },
      { label: 'aabb', frames: suffixAutomatonFrames('aabb') },
    ],
    build: ({ text }) => suffixAutomatonFrames(text),
    inputSchema: {
      fields: [
        { name: 'text', label: 'String', type: 'string', default: 'abb', max: 10, placeholder: 'abb' },
      ],
    },
  },
  'steiner-tree': {
    title: 'Steiner tree: connect terminals via cheapest tree',
    renderer: 'graph',
    cases: [
      { label: 'Route through Steiner nodes', frames: steinerSmall() },
      { label: 'Hub beats direct edges', frames: steinerStar() },
    ],
  },
  'np-reductions': {
    title: 'NP reductions: VC ↔ IS, 3-SAT → IS',
    renderer: 'graph',
    cases: [
      { label: 'Vertex Cover = complement of Independent Set', frames: vcIsComplementFrames() },
      { label: '3-SAT → Independent Set gadget', frames: threeSatToIsFrames() },
    ],
  },
};
