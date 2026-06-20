// Interactive viz for advanced string-matching concepts.
// Array renderer: text characters become the array cells. The pattern (or the
// current trie node's spelled string) rides along in a subRow; pointers mark
// the scan position; captions narrate the skip / failure-link decisions.

// ---------------------------------------------------------------------------
// Boyer-Moore bad-character heuristic
// ---------------------------------------------------------------------------
function badCharFrames(text = 'HERE-IS-A-SIMPLE-EXAMPLE', pattern = 'EXAMPLE') {
  const t = String(text ?? '');
  const p = String(pattern ?? '');
  if (!t.length || !p.length || p.length > t.length) {
    return [{ array: t.split(''), caption: 'Pattern is empty or longer than the text — nothing to search.' }];
  }
  const arr = t.split('');
  const frames = [];

  const last = {};
  for (let i = 0; i < p.length; i++) last[p[i]] = i;
  const subFor = (s) => ({
    values: arr.map((_, i) => (i >= s && i < s + p.length ? p[i - s] : '')),
    label: 'pattern',
  });

  frames.push({
    array: arr,
    subRow: subFor(0),
    caption: `Boyer-Moore bad-character: align "${p}" under the text and compare RIGHT to LEFT. The rightmost mismatch is the most informative — it can disqualify a whole alignment at once.`,
  });
  frames.push({
    array: arr,
    subRow: subFor(0),
    caption: `Bad-character table — rightmost index of each char in "${p}": ${Object.entries(last).map(([c, i]) => `'${c}'→${i}`).join(', ')}. Any text char absent here is set to -1, which shifts the pattern entirely past it.`,
  });

  const eliminated = new Set();
  let s = 0;
  let alignment = 0;
  while (s <= arr.length - p.length) {
    alignment += 1;
    frames.push({
      array: arr,
      subRow: subFor(s),
      pointers: { [s + p.length - 1]: 'j' },
      eliminated: new Set(eliminated),
      caption: `Alignment ${alignment}: pattern at shift ${s}. Begin at the RIGHT end — compare text index ${s + p.length - 1} with pattern's last char '${p[p.length - 1]}'.`,
    });
    let j = p.length - 1;
    while (j >= 0 && p[j] === arr[s + j]) {
      const matched = {};
      for (let k = j; k < p.length; k++) matched[s + k] = 'match';
      frames.push({
        array: arr,
        subRow: subFor(s),
        highlights: matched,
        pointers: { [s + j]: 'j' },
        eliminated: new Set(eliminated),
        caption: `text[${s + j}]='${arr[s + j]}' == pattern[${j}]='${p[j]}' — match. Step the comparison pointer left.`,
      });
      j -= 1;
    }
    if (j < 0) {
      const allMatch = {};
      for (let k = 0; k < p.length; k++) allMatch[s + k] = 'match';
      frames.push({
        array: arr,
        subRow: subFor(s),
        highlights: allMatch,
        eliminated: new Set(eliminated),
        caption: `Every character matched — "${p}" found at text index ${s}.`,
      });
      frames.push({
        array: arr,
        subRow: subFor(s),
        highlights: allMatch,
        eliminated: new Set(eliminated),
        caption: `Solved in ${alignment} alignment${alignment === 1 ? '' : 's'}. The grayed cells were never even read — that is Boyer-Moore's sublinear O(n/m) behaviour on natural text.`,
      });
      return frames;
    }
    const bad = arr[s + j];
    const lastIdx = Object.prototype.hasOwnProperty.call(last, bad) ? last[bad] : -1;
    const shift = Math.max(1, j - lastIdx);
    frames.push({
      array: arr,
      subRow: subFor(s),
      highlights: { [s + j]: 'pivot' },
      pointers: { [s + j]: 'j' },
      eliminated: new Set(eliminated),
      caption: `Mismatch: text[${s + j}]='${bad}' vs pattern[${j}]='${p[j]}'. '${bad}' ${lastIdx >= 0 ? `last occurs at pattern index ${lastIdx}` : 'never occurs in the pattern'} → shift = max(1, ${j} − ${lastIdx}) = ${shift}.`,
    });
    for (let k = s; k < Math.min(s + shift, arr.length); k++) eliminated.add(k);
    s += shift;
    if (s <= arr.length - p.length) {
      frames.push({
        array: arr,
        subRow: subFor(s),
        eliminated: new Set(eliminated),
        caption: `Slide the pattern right by ${shift}. Every skipped alignment would have struck the same bad character '${bad}', so leaping past them is safe.`,
      });
    }
  }
  frames.push({
    array: arr,
    eliminated: new Set(eliminated),
    caption: `Ran out of room: the pattern can no longer fit (shift ${s} > ${arr.length - p.length}). "${p}" does not occur in the text.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// Aho-Corasick failure links — multi-pattern scan over the text
// ---------------------------------------------------------------------------
function ahoCorasickFrames(text = 'ushers', patternStr = 'he,she,his,hers') {
  const t = String(text ?? '');
  const patterns = String(patternStr ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  if (!t.length || !patterns.length) {
    return [{ array: t.split(''), caption: 'Need a text and at least one pattern to scan.' }];
  }
  const arr = t.split('');

  // Build the goto trie. Node 0 = root. Each node: {str, children:{c:id}, fail, out:[patterns]}.
  const nodes = [{ str: '', children: {}, fail: 0, out: [] }];
  for (const pat of patterns) {
    let cur = 0;
    for (const c of pat) {
      if (!(c in nodes[cur].children)) {
        nodes.push({ str: nodes[cur].str + c, children: {}, fail: 0, out: [] });
        nodes[cur].children[c] = nodes.length - 1;
      }
      cur = nodes[cur].children[c];
    }
    nodes[cur].out.push(pat);
  }

  // BFS failure links + output-link merge.
  const queue = [];
  for (const c in nodes[0].children) {
    const child = nodes[0].children[c];
    nodes[child].fail = 0;
    queue.push(child);
  }
  while (queue.length) {
    const u = queue.shift();
    for (const c in nodes[u].children) {
      const v = nodes[u].children[c];
      let f = nodes[u].fail;
      while (f !== 0 && !(c in nodes[f].children)) f = nodes[f].fail;
      nodes[v].fail = (c in nodes[f].children && nodes[f].children[c] !== v) ? nodes[f].children[c] : 0;
      nodes[v].out = [...nodes[v].out, ...nodes[nodes[v].fail].out];
      queue.push(v);
    }
  }

  const spelled = (id) => (nodes[id].str === '' ? 'root' : `"${nodes[id].str}"`);
  const failList = nodes
    .map((n, id) => (id === 0 ? null : `${spelled(id)}→${spelled(n.fail)}`))
    .filter(Boolean);

  const frames = [];
  frames.push({
    array: arr,
    caption: `Aho-Corasick searches for ALL of {${patterns.join(', ')}} in one left-to-right pass. First build a trie of the patterns, then add failure links so a dead end falls back to the longest matched suffix instead of restarting.`,
  });
  frames.push({
    array: arr,
    caption: `Failure links (longest proper suffix that is also a trie prefix): ${failList.join(', ')}. They turn the trie into an automaton: every text char advances the scan by O(1) amortised.`,
  });

  let node = 0;
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i];
    const before = node;
    frames.push({
      array: arr,
      pointers: { [i]: 'i' },
      highlights: { [i]: 'current' },
      eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
      caption: `Read text[${i}]='${c}'. Current automaton node spells ${spelled(before)}. Look for a child edge labelled '${c}'.`,
    });

    // Follow failure links until a child labelled c exists or we hit root.
    let hops = 0;
    while (node !== 0 && !(c in nodes[node].children)) {
      const from = node;
      node = nodes[node].fail;
      hops += 1;
      frames.push({
        array: arr,
        pointers: { [i]: 'i' },
        highlights: { [i]: 'pivot' },
        eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
        caption: `No '${c}' edge from ${spelled(from)}. Follow its failure link → ${spelled(node)} (keep the longest matched suffix) and retry the same char.`,
      });
    }

    if (c in nodes[node].children) {
      node = nodes[node].children[c];
      frames.push({
        array: arr,
        pointers: { [i]: 'i' },
        highlights: { [i]: 'match' },
        eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
        caption: `Edge '${c}' found${hops ? ' after the fallback' : ''} → advance to node spelling ${spelled(node)}.`,
      });
    } else {
      frames.push({
        array: arr,
        pointers: { [i]: 'i' },
        eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
        caption: `No '${c}' edge even at the root — stay at root. Nothing currently matched; continue with the next char.`,
      });
    }

    if (nodes[node].out.length) {
      const outs = nodes[node].out;
      const hl = {};
      // Highlight the matched span(s) ending at i for each output pattern.
      for (const pat of outs) {
        for (let k = 0; k < pat.length; k++) hl[i - pat.length + 1 + k] = 'done';
      }
      hl[i] = 'match';
      frames.push({
        array: arr,
        pointers: { [i]: 'i' },
        highlights: hl,
        eliminated: new Set(Array.from({ length: Math.max(0, i - Math.max(...outs.map((o) => o.length)) + 1) }, (_, k) => k)),
        caption: `Output at node ${spelled(node)}: ${outs.map((o) => `"${o}" ends at index ${i} (starts ${i - o.length + 1})`).join('; ')}. The output-link merge reports the suffix patterns too, not just the deepest one.`,
      });
    }
  }

  frames.push({
    array: arr,
    eliminated: new Set(arr.map((_, k) => k)),
    caption: `Scan complete in one pass of ${arr.length} characters — total work O(|text| + Σ|pattern| + #matches), independent of how many patterns are in the dictionary.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
export default {
  'boyer-moore-bad-char': {
    title: 'Boyer-Moore: bad-character skips',
    renderer: 'array',
    cases: [
      { label: 'Classic EXAMPLE (found)', frames: badCharFrames('HERE-IS-A-SIMPLE-EXAMPLE', 'EXAMPLE') },
      { label: 'Big jumps (FOX)', frames: badCharFrames('THE-QUICK-BROWN-FOX', 'FOX') },
      { label: 'Worst case AAAB', frames: badCharFrames('AAAAAAAAAB', 'AAAB') },
      { label: 'Not found (ABCG)', frames: badCharFrames('ABCDABCEABCFABCD', 'ABCG') },
    ],
    build: ({ text, pattern }) => badCharFrames(text, pattern),
    inputSchema: {
      fields: [
        { name: 'text', label: 'Text', type: 'string', default: 'HERE-IS-A-SIMPLE-EXAMPLE', max: 40, placeholder: 'HERE-IS-A-SIMPLE-EXAMPLE' },
        { name: 'pattern', label: 'Pattern', type: 'string', default: 'EXAMPLE', max: 12, placeholder: 'EXAMPLE' },
      ],
    },
  },
  'aho-corasick-failure': {
    title: 'Aho-Corasick: failure-link scan',
    renderer: 'array',
    cases: [
      { label: 'Classic {he,she,his,hers}', frames: ahoCorasickFrames('ushers', 'he,she,his,hers') },
      { label: 'Overlap {a,ab,abc,bca}', frames: ahoCorasickFrames('abccab', 'a,ab,abc,bca') },
      { label: 'DNA {ACG,CGT,GTA}', frames: ahoCorasickFrames('ACGTACGT', 'ACG,CGT,GTA') },
      { label: 'No match {xyz,zzz}', frames: ahoCorasickFrames('aabbaabb', 'xyz,zzz') },
    ],
    build: ({ text, patterns }) => ahoCorasickFrames(text, patterns),
    inputSchema: {
      fields: [
        { name: 'text', label: 'Text', type: 'string', default: 'ushers', max: 32, placeholder: 'ushers' },
        { name: 'patterns', label: 'Patterns (comma-separated)', type: 'string', default: 'he,she,his,hers', max: 40, placeholder: 'he,she,his,hers' },
      ],
    },
  },
};
