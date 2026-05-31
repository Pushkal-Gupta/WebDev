#!/usr/bin/env node
// Sanitize PGcode_problems.follow_up: strip algorithm/data-structure hints,
// rewrite as constraint-style ("Can you ...?" / "Without using ...").
//
// Usage:
//   node scripts/sanitize-follow-ups.js --dry              # scan all, no writes
//   node scripts/sanitize-follow-ups.js --dry --limit 50   # sample
//   node scripts/sanitize-follow-ups.js                    # apply to all
//   node scripts/sanitize-follow-ups.js --limit 50         # apply to first 50

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

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// --- Forbidden tokens (data-structure / algorithm / pattern names) -----------
// Matched case-insensitively as whole words / phrases.
const FORBIDDEN_PATTERNS = [
  // data structures
  /\b(hash[\s-]?maps?|hash[\s-]?sets?|hash[\s-]?tables?|hashing)\b/i,
  /\b(heaps?|priority[\s-]?queues?|min[\s-]?heaps?|max[\s-]?heaps?)\b/i,
  /\b(stacks?|queues?|deques?)\b/i,
  /\b(tries?|prefix[\s-]?trees?)\b/i,
  /\b(linked[\s-]?lists?)\b/i,
  /\b(binary[\s-]?(search[\s-]?)?trees?|bsts?|avl|red[\s-]?black|segment[\s-]?trees?|fenwick|bit[\s-]?(indexed[\s-]?)?trees?|treaps?)\b/i,
  /\b(union[\s-]?finds?|disjoint[\s-]?sets?|dsu)\b/i,
  /\b(graphs?|adjacency[\s-]?(list|matrix))\b/i,
  /\b(monotonic[\s-]?(stack|queue|deque))\b/i,
  /\b(bloom[\s-]?filters?|skip[\s-]?lists?|suffix[\s-]?(array|tree)|kd[\s-]?trees?)\b/i,

  // algorithms / patterns
  /\b(two[\s-]?pointers?)\b/i,
  /\b(sliding[\s-]?windows?)\b/i,
  /\b(binary[\s-]?search(ing)?)\b/i,
  /\b(dfs|bfs|depth[\s-]?first|breadth[\s-]?first)\b/i,
  /\b(dynamic[\s-]?programming|dp|memoi[sz]ation|tabulation|bottom[\s-]?up|top[\s-]?down)\b/i,
  /\b(backtrack(ing)?)\b/i,
  /\b(greedy)\b/i,
  /\b(divide[\s-]?and[\s-]?conquer)\b/i,
  /\b(topological[\s-]?sort(ing)?|topo[\s-]?sort)\b/i,
  /\b(dijkstra|bellman[\s-]?ford|floyd[\s-]?warshall|kruskal|prim|tarjan|kosaraju|kahn)\b/i,
  /\b(boyer[\s-]?moore|kadane|kmp|rabin[\s-]?karp|manacher|morris|hopcroft|hungarian)\b/i,
  /\b(floyd('s)?[\s-]?(cycle|tortoise|hare))\b/i,
  /\b(tortoise[\s-]?and[\s-]?hare)\b/i,
  /\b(reservoir[\s-]?sampling)\b/i,
  /\b(quick[\s-]?select|quick[\s-]?sort|merge[\s-]?sort|heap[\s-]?sort|counting[\s-]?sort|radix[\s-]?sort|bucket[\s-]?sort)\b/i,
  /\b(bit[\s-]?manipulation|bitmask(ing)?|xor[\s-]?trick)\b/i,
  /\b(prefix[\s-]?sums?|difference[\s-]?array)\b/i,
  /\b(sweep[\s-]?line|line[\s-]?sweep)\b/i,
  /\b(meet[\s-]?in[\s-]?the[\s-]?middle)\b/i,

  // direct giveaway hint verbs
  /\b(negat(e|ing)[\s-]?(the[\s-]?)?indices?)\b/i,
  /\b(mark[\s-]?(the[\s-]?)?indic(es|ies)[\s-]?negative)\b/i,
  /\bin[\s-]?place[\s-]?marker(s)?\b/i,
  /\b(use[\s-]?a[\s-]?(hash|set|map|stack|queue|heap|tree|trie|graph|counter|dict))/i,
  /\b(sort(ing)?[\s-]?the[\s-]?(array|input|list))/i,
  /\b(cycle[\s-]?detection)\b/i,
];

// Words that, on their own, are fine ("time", "space", "single pass", "without extra space")
// — we only reject the line if it contains a forbidden token above.

// Soft strip patterns: phrases we delete inline (e.g., "using a hash map" → "")
const INLINE_STRIPS = [
  /\s*(using|with|by[\s-]using|via)\s+(a|an|the)?\s*(hash[\s-]?maps?|hash[\s-]?sets?|hash[\s-]?tables?|heaps?|priority[\s-]?queues?|stacks?|queues?|tries?|tree[s]?|graph[s]?|set[s]?|map[s]?|dict(ionary)?|counter|two[\s-]?pointers?|sliding[\s-]?window|binary[\s-]?search|dp|memoi[sz]ation|recursion|sort(ing)?|bit[\s-]?manipulation|prefix[\s-]?sum)\b/gi,
];

const RE_OK_TIME = /\b(O\([^)]+\)|linear|constant|logarithmic|sub[\s-]?linear|single[\s-]?pass|one[\s-]?pass|in[\s-]?place|without\s+(extra|additional)\s+space)\b/i;

// --- Sanitizer ---------------------------------------------------------------

function isClean(text) {
  if (!text) return true;
  return !FORBIDDEN_PATTERNS.some((re) => re.test(text));
}

function classifyFlavor(text) {
  // Detect what kind of constraint to ask back about, based on what the
  // original hint hinted at.
  const t = text.toLowerCase();
  const timeMatch = t.match(/o\(\s*([^)]+)\s*\)/);
  const mentionsSpace = /\b(space|memory|in[\s-]?place|extra\s+(space|memory|array))\b/i.test(text);
  const mentionsOnePass = /\b(one|single)[\s-]?pass\b/i.test(text);
  const mentionsSorted = /\bsorted\b/i.test(text);
  const mentionsStream = /\bstream(ing|ed)?\b/i.test(text);
  const mentionsLarge = /\b(large|huge|massive|big|millions?|billions?|scale|huge\s+dataset)\b/i.test(text);
  const mentionsImmutable = /\b(read[\s-]?only|cannot\s+modify|without\s+modifying|immutable)\b/i.test(text);
  const mentionsDuplicates = /\bduplicates?\b/i.test(text);
  const mentionsNegative = /\bnegativ(e|es)\b/i.test(text);

  return {
    time: timeMatch ? timeMatch[1].trim() : null,
    space: mentionsSpace,
    onePass: mentionsOnePass,
    sorted: mentionsSorted,
    stream: mentionsStream,
    large: mentionsLarge,
    immutable: mentionsImmutable,
    duplicates: mentionsDuplicates,
    negative: mentionsNegative,
  };
}

function rewriteOne(text) {
  // 1) Try inline strip first — if the sentence becomes clean, keep it.
  let stripped = text;
  for (const re of INLINE_STRIPS) stripped = stripped.replace(re, '');
  stripped = stripped.replace(/\s{2,}/g, ' ').replace(/\s+([,.?!])/g, '$1').trim();
  if (stripped && isClean(stripped) && stripped.length >= 10) {
    if (!/[.?!]$/.test(stripped)) stripped += '?';
    return stripped;
  }

  // 2) Otherwise synthesize from flavor.
  const f = classifyFlavor(text);
  const parts = [];
  if (f.time) parts.push(`O(${f.time}) time`);
  if (f.space) parts.push('O(1) extra space');
  if (f.onePass && !f.time) parts.push('a single pass');

  if (parts.length) {
    const joined = parts.length === 2 ? `${parts[0]} and ${parts[1]}` : parts.join(', ');
    return `Can you solve this in ${joined}?`;
  }
  if (f.sorted) return 'What changes if the input is already sorted?';
  if (f.stream) return 'What if the input arrives as an infinite stream?';
  if (f.immutable) return 'Can you solve this without modifying the input?';
  if (f.large) return 'Can you scale this to very large inputs?';
  if (f.duplicates) return 'How does your approach handle duplicate values?';
  if (f.negative) return 'How does your approach handle negative values?';

  // Fallback: generic constraint.
  return 'Can you improve the time and space complexity of your solution?';
}

function sanitize(raw) {
  if (!raw || !raw.trim()) return { text: raw, changed: false };
  const text = raw.trim();

  // Split into sentences/lines; rewrite any dirty ones.
  const segments = text
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) return { text: raw, changed: false };

  let changed = false;
  const out = [];
  const seen = new Set();
  for (const seg of segments) {
    let next = seg;
    if (!isClean(seg)) {
      next = rewriteOne(seg);
      changed = true;
    } else if (!RE_OK_TIME.test(seg) && /^(use|try|apply|consider|implement)\b/i.test(seg)) {
      // imperative "Use X" lines with no forbidden token but still hint-shaped
      next = rewriteOne(seg);
      changed = true;
    }
    const key = next.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
  }

  const joined = out.join(' ').replace(/\s{2,}/g, ' ').trim();
  return { text: joined, changed: changed && joined !== text };
}

// --- Main --------------------------------------------------------------------

async function main() {
  let query = sb
    .from('PGcode_problems')
    .select('id, name, follow_up')
    .not('follow_up', 'is', null)
    .order('id');
  if (LIMIT) query = query.limit(LIMIT);

  const { data, error } = await query;
  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  console.log(`Scanning ${data.length} rows${DRY ? ' (DRY RUN)' : ''}...`);

  let rewritten = 0;
  let untouched = 0;
  let empty = 0;
  const samples = [];

  for (const row of data) {
    if (!row.follow_up || !row.follow_up.trim()) {
      empty++;
      continue;
    }
    const { text, changed } = sanitize(row.follow_up);
    if (!changed) {
      untouched++;
      continue;
    }
    rewritten++;
    if (samples.length < 20) samples.push({ id: row.id, before: row.follow_up, after: text });

    if (!DRY) {
      const { error: upErr } = await sb
        .from('PGcode_problems')
        .update({ follow_up: text })
        .eq('id', row.id);
      if (upErr) {
        console.error(`  ! update failed for ${row.id}:`, upErr.message);
      }
    }
    if (VERBOSE) {
      console.log(`\n[${row.id}] ${row.name}`);
      console.log(`  BEFORE: ${row.follow_up}`);
      console.log(`  AFTER : ${text}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`  scanned   : ${data.length}`);
  console.log(`  rewritten : ${rewritten}${DRY ? ' (dry — no writes)' : ''}`);
  console.log(`  untouched : ${untouched}`);
  console.log(`  empty     : ${empty}`);

  if (samples.length) {
    console.log('\n=== SAMPLE REWRITES (first 20) ===');
    for (const s of samples) {
      console.log(`\n[${s.id}]`);
      console.log(`  BEFORE: ${s.before}`);
      console.log(`  AFTER : ${s.after}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
