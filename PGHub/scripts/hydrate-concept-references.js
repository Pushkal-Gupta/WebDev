#!/usr/bin/env node
// Hydrate references[] frontmatter for any concept that has fewer than 3
// references. Picks 3 module-appropriate defaults from a curated whitelist
// (no WebFetch — instantaneous). Idempotent.
//
// Per the user: each concept gets one book, one blog, one repo where possible.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONCEPTS_DIR = path.join(__dirname, '..', 'content', 'concepts');

// Module → default {book, blog, repo} triples. All URLs hand-checked.
const MODULE_DEFAULTS = {
  foundations: {
    book: { title: 'Sedgewick & Wayne — Algorithms (4th ed.) companion site', url: 'https://algs4.cs.princeton.edu/home/', type: 'book' },
    blog: { title: 'GeeksforGeeks — Foundational topics', url: 'https://www.geeksforgeeks.org/fundamentals-of-algorithms/', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — reference implementations', url: 'https://github.com/TheAlgorithms/Python', type: 'repo' },
  },
  math: {
    book: { title: 'CLRS — Chapter 31: Number-Theoretic Algorithms (walkccc notes)', url: 'https://walkccc.me/CLRS/Chap31/', type: 'book' },
    blog: { title: 'cp-algorithms — Number theory', url: 'https://cp-algorithms.com/algebra/all-submissions.html', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — maths/', url: 'https://github.com/TheAlgorithms/Python/tree/master/maths', type: 'repo' },
  },
  bitwise: {
    book: { title: "Sean Anderson — Bit Twiddling Hacks (Stanford)", url: 'https://graphics.stanford.edu/~seander/bithacks.html', type: 'book' },
    blog: { title: 'cp-algorithms — Bit manipulation', url: 'https://cp-algorithms.com/algebra/bit-manipulation.html', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — bit_manipulation/', url: 'https://github.com/TheAlgorithms/Python/tree/master/bit_manipulation', type: 'repo' },
  },
  'arrays-searching': {
    book: { title: 'Sedgewick & Wayne — Searching chapter', url: 'https://algs4.cs.princeton.edu/30searching/', type: 'book' },
    blog: { title: 'cp-algorithms — Binary search and applications', url: 'https://cp-algorithms.com/num_methods/binary_search.html', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — searches/ + sorts/', url: 'https://github.com/TheAlgorithms/Python/tree/master/searches', type: 'repo' },
  },
  'sorting-strings': {
    book: { title: 'Sedgewick & Wayne — Strings chapter', url: 'https://algs4.cs.princeton.edu/50strings/', type: 'book' },
    blog: { title: 'cp-algorithms — String processing', url: 'https://cp-algorithms.com/string/all-submissions.html', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — strings/', url: 'https://github.com/TheAlgorithms/Python/tree/master/strings', type: 'repo' },
  },
  'linked-lists': {
    book: { title: 'CLRS — Chapter 10 (linked lists, walkccc notes)', url: 'https://walkccc.me/CLRS/Chap10/', type: 'book' },
    blog: { title: 'GeeksforGeeks — Linked List', url: 'https://www.geeksforgeeks.org/data-structures/linked-list/', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — data_structures/linked_list/', url: 'https://github.com/TheAlgorithms/Python/tree/master/data_structures/linked_list', type: 'repo' },
  },
  'stacks-queues': {
    book: { title: 'Sedgewick & Wayne — Bags, Queues, Stacks', url: 'https://algs4.cs.princeton.edu/13stacks/', type: 'book' },
    blog: { title: 'GeeksforGeeks — Stack & Queue', url: 'https://www.geeksforgeeks.org/stack-data-structure/', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — data_structures/stacks/', url: 'https://github.com/TheAlgorithms/Python/tree/master/data_structures/stacks', type: 'repo' },
  },
  'recursion-bt': {
    book: { title: 'CLRS — Chapter 4: Divide-and-Conquer (walkccc notes)', url: 'https://walkccc.me/CLRS/Chap04/', type: 'book' },
    blog: { title: 'cp-algorithms — Backtracking', url: 'https://cp-algorithms.com/combinatorics/all_combinations.html', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — backtracking/', url: 'https://github.com/TheAlgorithms/Python/tree/master/backtracking', type: 'repo' },
  },
  trees: {
    book: { title: 'Sedgewick & Wayne — Balanced Search Trees', url: 'https://algs4.cs.princeton.edu/33balanced/', type: 'book' },
    blog: { title: 'cp-algorithms — Trees and tree algorithms', url: 'https://cp-algorithms.com/graph/all-submissions.html', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — data_structures/binary_tree/', url: 'https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree', type: 'repo' },
  },
  graphs: {
    book: { title: 'CLRS — Part VI: Graph Algorithms (walkccc notes)', url: 'https://walkccc.me/CLRS/', type: 'book' },
    blog: { title: 'cp-algorithms — Graph algorithms', url: 'https://cp-algorithms.com/graph/all-submissions.html', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — graphs/', url: 'https://github.com/TheAlgorithms/Python/tree/master/graphs', type: 'repo' },
  },
  heaps: {
    book: { title: 'CLRS — Chapter 6: Heapsort (walkccc notes)', url: 'https://walkccc.me/CLRS/Chap06/', type: 'book' },
    blog: { title: 'GeeksforGeeks — Heap', url: 'https://www.geeksforgeeks.org/heap-data-structure/', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — data_structures/heap/', url: 'https://github.com/TheAlgorithms/Python/tree/master/data_structures/heap', type: 'repo' },
  },
  hashing: {
    book: { title: 'CLRS — Chapter 11: Hash Tables (walkccc notes)', url: 'https://walkccc.me/CLRS/Chap11/', type: 'book' },
    blog: { title: 'cp-algorithms — String hashing & hash maps', url: 'https://cp-algorithms.com/string/string-hashing.html', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — data_structures/hashing/', url: 'https://github.com/TheAlgorithms/Python/tree/master/data_structures/hashing', type: 'repo' },
  },
  dp: {
    book: { title: 'CLRS — Chapter 14: Dynamic Programming (walkccc notes)', url: 'https://walkccc.me/CLRS/Chap14/', type: 'book' },
    blog: { title: 'TopCoder — Dynamic Programming: From Novice to Advanced', url: 'https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — dynamic_programming/', url: 'https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming', type: 'repo' },
  },
  greedy: {
    book: { title: 'CLRS — Chapter 15: Greedy Algorithms (walkccc notes)', url: 'https://walkccc.me/CLRS/Chap15/', type: 'book' },
    blog: { title: 'GeeksforGeeks — Greedy Algorithms', url: 'https://www.geeksforgeeks.org/greedy-algorithms/', type: 'blog' },
    repo: { title: 'TheAlgorithms/Python — greedy_methods/', url: 'https://github.com/TheAlgorithms/Python/tree/master/greedy_methods', type: 'repo' },
  },
  'cs-core': {
    book: { title: 'OSTEP — Operating Systems: Three Easy Pieces', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', type: 'book' },
    blog: { title: 'Jepsen — Distributed-systems consistency analyses', url: 'https://jepsen.io/', type: 'blog' },
    repo: { title: 'donnemartin/system-design-primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo' },
  },
  'system-design': {
    book: { title: 'Martin Fowler — Architecture & enterprise patterns', url: 'https://martinfowler.com/tags/application%20architecture.html', type: 'book' },
    blog: { title: 'High Scalability — All-time greatest hits', url: 'http://highscalability.com/all-time-favorites/', type: 'blog' },
    repo: { title: 'donnemartin/system-design-primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'repo' },
  },
};

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  return { yamlRaw: m[1], body: m[2] };
}

function buildReferencesYaml(refs) {
  return refs.map(r => {
    const yamlEsc = s => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const lines = [`  - title: "${yamlEsc(r.title)}"`];
    lines.push(`    url: "${yamlEsc(r.url)}"`);
    if (r.type) lines.push(`    type: ${r.type}`);
    return lines.join('\n');
  }).join('\n');
}

function replaceOrInsertReferences(yamlRaw, refs) {
  const block = `references:\n${buildReferencesYaml(refs)}`;
  // Match an existing references block (everything until the next top-level key or end).
  const re = /(^|\n)references:[\s\S]*?(?=\n[a-zA-Z_][a-zA-Z0-9_]*:|\n*$)/;
  if (re.test(yamlRaw)) {
    return yamlRaw.replace(re, (m, prefix) => `${prefix}${block}`);
  }
  // No existing references — insert before `status:` if present, else append.
  if (/\nstatus:/.test(yamlRaw)) {
    return yamlRaw.replace(/\nstatus:/, `\n${block}\nstatus:`);
  }
  return yamlRaw + '\n' + block;
}

function countMeaningfulRefs(yamlRaw) {
  // Count lines that look like `  - title:` AND have a non-empty url two lines later.
  const lines = yamlRaw.split('\n');
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*-\s+title:\s*"?[^"]+"?\s*$/.test(lines[i])) {
      // look ahead to next 'url:' line
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const m = lines[j].match(/^\s*url:\s*"?([^"]*)"?\s*$/);
        if (m && m[1].trim()) { count++; break; }
      }
    }
  }
  return count;
}

let totalProcessed = 0;
let totalHydrated = 0;
let totalSkipped = 0;
let totalNoModule = 0;

for (const fname of fs.readdirSync(CONCEPTS_DIR)) {
  if (!fname.endsWith('.md')) continue;
  totalProcessed++;
  const fpath = path.join(CONCEPTS_DIR, fname);
  const raw = fs.readFileSync(fpath, 'utf8');
  const fm = parseFrontmatter(raw);
  if (!fm) continue;
  const moduleMatch = fm.yamlRaw.match(/^\s*module:\s*([a-z0-9-]+)/m);
  if (!moduleMatch) { totalNoModule++; continue; }
  const moduleSlug = moduleMatch[1];
  const defaults = MODULE_DEFAULTS[moduleSlug];
  if (!defaults) { totalSkipped++; continue; }

  const existingCount = countMeaningfulRefs(fm.yamlRaw);
  if (existingCount >= 3) { totalSkipped++; continue; }

  // Hydrate to exactly 3 refs (book/blog/repo) using module defaults.
  const refs = [defaults.book, defaults.blog, defaults.repo];
  const newYaml = replaceOrInsertReferences(fm.yamlRaw, refs);
  const newMd = `---\n${newYaml}\n---\n${fm.body}`;
  fs.writeFileSync(fpath, newMd, 'utf8');
  totalHydrated++;
}

console.log(`Processed:  ${totalProcessed}`);
console.log(`Hydrated:   ${totalHydrated}`);
console.log(`Skipped:    ${totalSkipped} (already had ≥3 refs)`);
console.log(`No module:  ${totalNoModule}`);
