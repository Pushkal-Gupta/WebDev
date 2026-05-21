#!/usr/bin/env node
// Batch 41: design + advanced data structures.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const FLAGSHIPS = [
  {
    id: 'lfu-cache',
    method_name: 'lfuCache',
    params: [{ name: 'capacity', type: 'int' }, { name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[int]',
    hints: [
      'Three structures: (1) key→(value, freq) map; (2) freq→linked-list-of-keys; (3) minFreq pointer.',
      'get: bump freq for the key; move it from its old list to its new freq list.',
      'put existing: same as get plus update value.',
      'put new at capacity: evict tail of list at minFreq.',
      'All ops O(1) amortized.',
    ],
    tags: ['design', 'hash-map', 'linked-list'],
    constraints: '1 ≤ capacity ≤ 10^4\n0 ≤ key, value ≤ 10^9\nUp to 2·10^5 calls',
    follow_up: 'Compare with LRU: LRU evicts least-recently-used; LFU evicts least-frequently-used.',
    pattern: 'frequency-bucketed-lists',
    test_cases: [
      { inputs: ['2', '[["put","1","1"],["put","2","2"],["get","1"],["put","3","3"],["get","2"],["get","3"],["put","4","4"],["get","1"],["get","3"],["get","4"]]'], expected: '[1,-1,3,-1,3,4]' },
      { inputs: ['1', '[["put","1","1"],["put","2","2"],["get","1"]]'], expected: '[-1]' },
      { inputs: ['3', '[["put","1","1"],["put","2","2"],["put","3","3"],["get","1"],["get","2"],["get","3"]]'], expected: '[1,2,3]' },
      { inputs: ['1', '[["get","1"]]'], expected: '[-1]' },
      { inputs: ['2', '[["put","1","1"],["get","1"],["put","1","2"],["get","1"]]'], expected: '[1,2]' },
      { inputs: ['2', '[["put","1","1"],["put","2","2"],["put","3","3"],["get","1"]]'], expected: '[-1]' },
    ],
  },
  {
    id: 'design-circular-queue',
    method_name: 'circularQueue',
    params: [{ name: 'k', type: 'int' }, { name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[number]',
    hints: [
      'Fixed-size array + head & tail indices + size counter.',
      'Wrap with (index + 1) % capacity.',
      'enQueue: if full → false; else write at tail, advance tail, increment size.',
      'deQueue: if empty → false; else advance head, decrement size.',
      'Front/Rear: empty → -1; else array[head] / array[(tail - 1 + cap) % cap].',
    ],
    tags: ['design', 'queue', 'array'],
    constraints: '1 ≤ k ≤ 1000\nUp to 3000 calls',
    follow_up: '"Design Circular Deque" — also support push/pop at both ends.',
    pattern: 'ring-buffer',
    test_cases: [
      { inputs: ['3', '[["enQueue","1"],["enQueue","2"],["enQueue","3"],["enQueue","4"],["Rear"],["isFull"],["deQueue"],["enQueue","4"],["Rear"]]'], expected: '[true,true,true,false,3,true,true,true,4]' },
      { inputs: ['1', '[["enQueue","5"],["isFull"],["Front"],["Rear"],["deQueue"],["isEmpty"]]'], expected: '[true,true,5,5,true,true]' },
      { inputs: ['2', '[["Front"],["Rear"],["isEmpty"]]'], expected: '[-1,-1,true]' },
      { inputs: ['3', '[["enQueue","1"],["deQueue"],["isEmpty"]]'], expected: '[true,true,true]' },
      { inputs: ['2', '[["enQueue","1"],["enQueue","2"],["enQueue","3"],["deQueue"],["enQueue","3"],["Rear"]]'], expected: '[true,true,false,true,true,3]' },
    ],
  },
  {
    id: 'maximum-frequency-stack',
    method_name: 'freqStack',
    params: [{ name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[number]',
    hints: [
      'Two maps: value→count, freq→stack-of-values.',
      'push x: count[x]++; bucket[count[x]].push(x); maxFreq = max(maxFreq, count[x]).',
      'pop: x = bucket[maxFreq].pop(); count[x]--; if bucket[maxFreq] empty, maxFreq--.',
      'All ops O(1).',
      'Each value appears in MULTIPLE buckets (one per frequency it had).',
    ],
    tags: ['stack', 'design', 'hash-map'],
    constraints: '0 ≤ val ≤ 10^9\nAt most 2·10^4 calls.',
    follow_up: 'Generalize to "k-th most frequent stack" — maintain ordered freq map.',
    pattern: 'frequency-bucket-stacks',
    test_cases: [
      { inputs: ['[["push","5"],["push","7"],["push","5"],["push","7"],["push","4"],["push","5"],["pop"],["pop"],["pop"],["pop"]]'], expected: '[5,7,5,4]' },
      { inputs: ['[["push","1"],["pop"]]'], expected: '[1]' },
      { inputs: ['[["push","1"],["push","1"],["push","1"],["pop"],["pop"],["pop"]]'], expected: '[1,1,1]' },
      { inputs: ['[["push","1"],["push","2"],["push","3"],["pop"]]'], expected: '[3]' },
      { inputs: ['[["push","1"],["push","2"],["push","1"],["pop"],["pop"]]'], expected: '[1,2]' },
      { inputs: ['[["push","1"],["push","2"],["push","3"],["push","1"],["push","2"],["push","3"],["push","1"],["pop"],["pop"],["pop"],["pop"]]'], expected: '[1,1,2,3]' },
    ],
  },
  {
    id: 'design-add-search-words',
    method_name: 'wordDictionary',
    params: [{ name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[number]',
    hints: [
      'Trie + DFS for wildcard.',
      'addWord: standard trie insert.',
      'search: char → descend; \'.\' → try every child.',
      'Recursion or explicit stack; both work.',
      'O(L) for adds; O(26^L) worst for searches with many \'.\'.',
    ],
    tags: ['trie', 'design', 'string'],
    constraints: 'word ≤ 25 chars\nUp to 10^4 calls; ≤ 3 wildcards per search',
    follow_up: 'Use suffix automaton for ANY substring search — heavier but generalizes well.',
    pattern: 'trie-with-wildcard-dfs',
    test_cases: [
      { inputs: ['[["addWord","bad"],["addWord","dad"],["addWord","mad"],["search","pad"],["search","bad"],["search",".ad"],["search","b.."]]'], expected: '[false,true,true,true]' },
      { inputs: ['[["addWord","a"],["search","a"],["search","."],["search","b"]]'], expected: '[true,true,false]' },
      { inputs: ['[["search","abc"]]'], expected: '[false]' },
      { inputs: ['[["addWord","abc"],["search","abc"],["search","ab"],["search","abcd"]]'], expected: '[true,false,false]' },
      { inputs: ['[["addWord","at"],["addWord","and"],["addWord","an"],["addWord","add"],["search","a"],["search",".at"],["addWord","bat"],["search",".at"],["search","an."],["search","a.d."],["search","b."],["search","a.d"],["search","."]]'], expected: '[false,false,true,true,false,true,false,false]' },
    ],
  },
  {
    id: 'stream-of-characters',
    method_name: 'streamChecker',
    params: [{ name: 'words', type: 'List[str]' }, { name: 'queries', type: 'List[str]' }],
    return_type: 'List[bool]',
    hints: [
      'Reverse-trie: insert each word reversed.',
      'Maintain a running deque/array of latest stream characters.',
      'On each query char, append to stream; walk the trie from latest char backward; return true if you hit a word-end.',
      'Limit stream length to max word length to keep memory bounded.',
      'O(L) per query where L = max word length.',
    ],
    tags: ['trie', 'design', 'string', 'queue'],
    constraints: '1 ≤ words.length ≤ 2000\n1 ≤ words[i].length ≤ 200\nLowercase English',
    follow_up: 'Aho-Corasick — single pass over the stream, no per-query walk. Faster for many short words.',
    pattern: 'reverse-trie-streaming',
    test_cases: [
      { inputs: ['["cd","f","kl"]', '["a","b","c","d","e","f","g","h","i","j","k","l"]'], expected: '[false,false,false,true,false,true,false,false,false,false,false,true]' },
      { inputs: ['["ab"]', '["a","b","a","b"]'], expected: '[false,true,false,true]' },
      { inputs: ['["abc"]', '["a","b","c","a","b","c"]'], expected: '[false,false,true,false,false,true]' },
      { inputs: ['["a"]', '["a","b","a"]'], expected: '[true,false,true]' },
      { inputs: ['["xyz"]', '["a","b","c"]'], expected: '[false,false,false]' },
    ],
  },
];

let updated = 0;
for (const f of FLAGSHIPS) {
  const { data: existing } = await sb.from('PGcode_problems').select('*').eq('id', f.id).maybeSingle();
  if (!existing) { console.log(`  SKIP ${f.id} (not in DB)`); continue; }
  const row = {
    id: f.id,
    name: existing.name,
    topic_id: existing.topic_id,
    difficulty: existing.difficulty,
    description: existing.description,
    roadmap_set: existing.roadmap_set || '100',
    method_name: f.method_name,
    params: f.params,
    return_type: f.return_type,
    hints: f.hints,
    tags: f.tags,
    constraints: f.constraints,
    follow_up: f.follow_up,
    pattern: f.pattern,
    test_cases: f.test_cases,
  };
  const { error } = await sb.from('PGcode_problems').upsert(row, { onConflict: 'id' });
  if (error) { console.error(`  ERROR ${f.id}: ${error.message}`); continue; }
  console.log(`  ✓ ${f.id}  — ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
