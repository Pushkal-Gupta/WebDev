# explained-samples-backfill

How to ship 3 worked test cases per problem with quality prose explanations. We've shipped 144+ this way.

## The shape

```js
{
  inputs: ['[2,7,11,15]', '9'],  // each entry is a JSON-encoded string
  expected: '[0,1]',
  explanation_md: '60-120 word reader-direct paragraph',
  viz_anchor: null,              // leave null for now; future pass wires viz keys
}
```

## The 3 samples per problem

1. **Canonical LC example.** Small, demonstrative. Reader sees the algorithm work on a "normal" input.
2. **Edge case.** Empty input, single element, all-same, min-size, max-size, overflow boundary — whichever is most revealing for this algorithm.
3. **Algorithmically interesting case.** The one that exposes a bug a naive solution would have. For `3sum`, that's the dedup-by-anchor case `[-1,0,1,2,-1,-4]` → the second `-1` MUST be skipped. For `add-two-numbers`, that's the carry-overflow case `[9,9,9,9,9] + [9,9]` → result needs a trailing `1`.

## The explanation_md voice

60–120 words, reader-direct. Every paragraph should answer one of:
- What does the algorithm DO on this input, step by step?
- What would a NAIVE approach get wrong here?
- Why does THIS branch of the algorithm fire?

**Good example** (from `house-robber` sample 3):

> A greedy that grabs the largest available without checking adjacency would pick `9, 7` → adjacent → invalid, fall back to `9, 3` for total `12` — by luck, the right answer. But on `[2,7,9,3,1]` the correct DP trace is: `dp = [2, 7, 11, 11, 12]`. Houses 0+2+4 = `2+9+1 = 12`. The DP finds it without trial-and-error: at each index it just compares 'skip' vs 'take plus best two back'. Return `12`.

**Bad example** (would be rejected):

> This is the canonical LeetCode example. The algorithm returns 12 because of dynamic programming. We use a bottom-up approach to find the optimal solution.

That second one is filler. No insight, no learning. Don't ship it.

## Input format conventions

The harness parses each `inputs[i]` via `json.loads`. So:

- Integer: `'5'`
- Array: `'[1,2,3]'`
- String: `'"hello"'` (note: outer Python string quotes around a JSON-encoded string)
- Linked list: `'[1,2,3,4,5]'` (the harness `parse_linked_list` converts this to a `ListNode` chain)
- Tree: `'[3,9,20,null,null,15,7]'` (BFS-level serialization with `null` for missing children)
- Matrix: `'[[1,2],[3,4]]'`

## The backfill script template

```js
// scripts/backfill-explained-samples-batch<N>.mjs
import fs from 'node:fs';
import path from 'node:path';
const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
try { for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
} } catch {}
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PAYLOAD = {
  'two-sum': [
    { inputs: ['[2,7,11,15]', '9'], expected: '[0,1]', explanation_md: '...', viz_anchor: null },
    { inputs: ['[3,2,4]', '6'], expected: '[1,2]', explanation_md: '...', viz_anchor: null },
    { inputs: ['[3,3]', '6'], expected: '[0,1]', explanation_md: '...', viz_anchor: null },
  ],
  // ...29 more
};

let ok = 0, failed = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`✗ ${slug}: ${error.message}`); failed++; }
  else { console.log(`✓ ${slug}`); ok++; }
}
console.log(`ok=${ok} failed=${failed}`);
```

## After running

1. `node scripts/refresh-status.mjs` — the `explained_samples (==3)` count should increase by your batch size.
2. The Workspace's Examples panel automatically renders the new samples (rendering branch added in migration 47).

---
*Last updated: 2026-06-10 — 144/3788 backfilled across batches 1–6.*
