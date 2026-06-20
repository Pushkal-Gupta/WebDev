#!/usr/bin/env node
// Pull LeetCode problem metadata via their public GraphQL endpoint and dump
// to content/leetcode/<slug>.json. Polite (configurable delay), resumable
// (skips slugs whose JSON already exists), and produces output that can be
// diffed against PGcode_problems for incremental import.
//
// Usage:
//   node scripts/scrape-leetcode.js --list                       # list all problems (1 call)
//   node scripts/scrape-leetcode.js --slug two-sum               # one problem
//   node scripts/scrape-leetcode.js --batch 50 [--delay 1200]    # process 50 (polite default 1.2s)
//   node scripts/scrape-leetcode.js --all                        # full catalog (slow)
//   node scripts/scrape-leetcode.js --import-to-supabase         # push downloaded JSON into PGcode_problems
//
// Output shape (per file):
//   {
//     slug, title, difficulty, tags,
//     description_html, hints, sample_test_cases,
//     content_signature, fetched_at
//   }
//
// Notes
// - LeetCode rate-limits aggressively. Default 1.2s delay between calls; back off on 429.
// - We only fetch publicly-available problem metadata (no premium content, no editorial).
// - Imported problems land with method_name/params blank; test_cases derived from samples
//   (then padded via scripts/multiply-test-cases.js).

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

const OUT_DIR = path.join(__dirname, '..', 'content', 'leetcode');
fs.mkdirSync(OUT_DIR, { recursive: true });
const INDEX_PATH = path.join(OUT_DIR, '_index.json');

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d = null) => {
  const i = args.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};

const DELAY_MS = Number(opt('delay') || 1200);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const GRAPHQL = 'https://leetcode.com/graphql';
const HEADERS = {
  'content-type': 'application/json',
  'user-agent': 'pgcode-personal-research/1.0 (single-user, polite)',
  'referer': 'https://leetcode.com/',
};

async function gql(query, variables, attempt = 1) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429) {
    const backoff = Math.min(30000, 2000 * attempt);
    console.log(`  rate-limited, backing off ${backoff}ms`);
    await sleep(backoff);
    if (attempt < 5) return gql(query, variables, attempt + 1);
    throw new Error('Rate-limited too many times');
  }
  if (!res.ok) throw new Error(`gql ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data;
}

const Q_LIST = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters
    ) {
      total: totalNum
      questions: data {
        titleSlug title difficulty acRate isPaidOnly
        topicTags { name slug }
      }
    }
  }`;

const Q_DETAIL = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId titleSlug title difficulty content hints
      topicTags { name slug }
      exampleTestcases sampleTestCase
      similarQuestions
      isPaidOnly
      codeSnippets { lang langSlug code }
    }
  }`;

async function fetchList() {
  console.log('Fetching problem list (paginated)...');
  const PAGE = 100;
  const all = [];
  let skip = 0, total = Infinity;
  while (skip < total) {
    const data = await gql(Q_LIST, { categorySlug: '', limit: PAGE, skip, filters: {} });
    const block = data.problemsetQuestionList;
    total = block.total;
    all.push(...block.questions);
    console.log(`  page ${Math.floor(skip / PAGE) + 1}: ${all.length}/${total}`);
    skip += PAGE;
    if (skip < total) await sleep(DELAY_MS);
  }
  const list = all
    .filter(q => !q.isPaidOnly)
    .map(q => ({
      slug: q.titleSlug,
      title: q.title,
      difficulty: q.difficulty,
      tags: q.topicTags.map(t => t.slug),
      ac_rate: q.acRate,
    }));
  fs.writeFileSync(INDEX_PATH, JSON.stringify({ fetched_at: new Date().toISOString(), count: list.length, problems: list }, null, 2));
  console.log(`Saved ${list.length} non-premium problems to ${INDEX_PATH}`);
  return list;
}

function parseExampleTestcases(raw) {
  if (!raw) return [];
  return raw.split('\n').filter(Boolean);
}

async function fetchOne(slug) {
  const out = path.join(OUT_DIR, `${slug}.json`);
  if (fs.existsSync(out)) {
    console.log(`  ${slug}: cached, skip`);
    return JSON.parse(fs.readFileSync(out, 'utf8'));
  }
  const data = await gql(Q_DETAIL, { titleSlug: slug });
  const q = data.question;
  if (!q) { console.log(`  ${slug}: no data`); return null; }
  if (q.isPaidOnly) { console.log(`  ${slug}: premium, skip`); return null; }
  const blob = {
    slug: q.titleSlug,
    leetcode_id: q.questionId,
    title: q.title,
    difficulty: q.difficulty,
    tags: q.topicTags.map(t => t.slug),
    description_html: q.content,
    hints: q.hints || [],
    sample_test_cases: parseExampleTestcases(q.exampleTestcases),
    code_snippets: (q.codeSnippets || []).map(s => ({ lang: s.lang, langSlug: s.langSlug, code: s.code })),
    content_signature: hash(q.content || ''),
    fetched_at: new Date().toISOString(),
  };
  fs.writeFileSync(out, JSON.stringify(blob, null, 2));
  console.log(`  ${slug}: saved`);
  return blob;
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

async function batchProcess() {
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const limit = Number(opt('batch') || 50);
  const pending = idx.problems.filter(p => !fs.existsSync(path.join(OUT_DIR, `${p.slug}.json`)));
  const slice = flag('all') ? pending : pending.slice(0, limit);
  console.log(`Processing ${slice.length}/${pending.length} pending (delay ${DELAY_MS}ms)...`);
  let ok = 0;
  for (const p of slice) {
    try { await fetchOne(p.slug); ok++; }
    catch (e) { console.log(`  ${p.slug}: ${e.message.slice(0, 100)}`); }
    await sleep(DELAY_MS);
  }
  console.log(`\nDone: ${ok}/${slice.length} fetched.`);
}

async function importToSupabase() {
  const URL = process.env.VITE_SUPABASE_URL;
  const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  const sb = createClient(URL, SVC);

  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.json') && f !== '_index.json');
  console.log(`Reading ${files.length} scraped files...`);

  // Pull existing slugs once so we don't clobber hand-curated flagships
  // (which already have method_name / params / test_cases / solutions).
  const existing = new Set();
  let page = 0;
  while (true) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id').range(page * 1000, page * 1000 + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data?.length) break;
    for (const r of data) existing.add(r.id);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`DB has ${existing.size} existing problem rows — those will be skipped.`);

  // Map LeetCode tag slugs → existing PGcode_topics ids. First tag wins;
  // unmapped tags fall through to 'arrays' which is the catch-all bucket.
  const LC_TAG_TO_TOPIC = {
    'array': 'arrays', 'matrix': 'arrays', 'hash-table': 'arrays', 'sorting': 'arrays',
    'string': 'strings', 'string-matching': 'strings',
    'dynamic-programming': 'dp', 'memoization': 'dp',
    'binary-search': 'binary-search', 'divide-and-conquer': 'binary-search',
    'math': 'math', 'number-theory': 'math', 'combinatorics': 'math', 'probability-and-statistics': 'math', 'geometry': 'geometry',
    'greedy': 'greedy',
    'depth-first-search': 'graphs', 'breadth-first-search': 'graphs', 'graph': 'graphs', 'union-find': 'graphs',
    'shortest-path': 'advanced-graphs', 'strongly-connected-component': 'advanced-graphs', 'topological-sort': 'advanced-graphs',
    'tree': 'trees', 'binary-tree': 'trees', 'binary-search-tree': 'trees',
    'trie': 'tries',
    'two-pointers': 'two-pointers',
    'stack': 'stack', 'monotonic-stack': 'stack',
    'queue': 'queue', 'monotonic-queue': 'queue',
    'heap-priority-queue': 'heap',
    'sliding-window': 'sliding-window',
    'bit-manipulation': 'bit-manipulation', 'bitmask': 'bit-manipulation',
    'backtracking': 'backtracking',
    'recursion': 'recursion',
    'linked-list': 'linkedlist', 'doubly-linked-list': 'linkedlist',
    'interval': 'intervals',
    'design': 'arrays', 'simulation': 'arrays',
  };
  const sampleTagToTopic = (tags) => {
    if (!Array.isArray(tags)) return 'arrays';
    for (const t of tags) {
      const mapped = LC_TAG_TO_TOPIC[t];
      if (mapped) return mapped;
    }
    return 'arrays';
  };

  const rows = [];
  for (const f of files) {
    const blob = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8'));
    if (existing.has(blob.slug)) continue;
    rows.push({
      id: blob.slug,
      name: blob.title,
      difficulty: blob.difficulty,
      description: blob.description_html || '',
      hints: blob.hints || [],
      tags: blob.tags || [],
      topic_id: sampleTagToTopic(blob.tags),
      leetcode_url: `https://leetcode.com/problems/${blob.slug}/`,
    });
  }
  console.log(`Inserting ${rows.length} NEW problems (existing ${existing.size} untouched)...`);

  let ok = 0, skip = 0;
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await sb.from('PGcode_problems').insert(slice);
    if (error) {
      console.log(`  batch ${i}: ${error.message.slice(0, 120)}`);
      skip += slice.length;
    } else {
      ok += slice.length;
      if ((i / BATCH) % 10 === 0) console.log(`  ${ok}/${rows.length}`);
    }
  }
  console.log(`\nInserted ${ok}, skipped ${skip}. (${existing.size} preexisting left intact.)`);
}

async function main() {
  if (flag('list')) { await fetchList(); return; }
  const s = opt('slug');
  if (s) { await fetchOne(s); return; }
  if (flag('import-to-supabase')) { await importToSupabase(); return; }
  if (flag('batch') || flag('all')) {
    if (!fs.existsSync(INDEX_PATH)) await fetchList();
    await batchProcess();
    return;
  }
  console.log('Pass --list, --slug <slug>, --batch <N>, --all, or --import-to-supabase');
}

main().catch(e => { console.error(e); process.exit(1); });
