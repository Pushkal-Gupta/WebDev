// Derive related study material (concepts, tutorial topics, courses) for a
// company by counting topic frequency across that company's problems, then
// mapping each top topic to the modules / tutorial slugs / courses that
// cover it.
//
// The mappings live close to the consumer (CompanyDetail) so a future shift
// to an explicit `PGcode_companies.{concepts,tutorials,courses}` JSONB column
// stays a drop-in swap. Until then, this file is the source of truth.

import { DSA_TUTORIAL } from '../../content/dsaTutorial';
import { COURSES } from '../../content/courses';

// problem.topic_id (lowercase canonical roadmap topic) -> concept module slugs
// that cover the same ground. A topic can map to multiple modules so the
// concept picker has room to choose the highest-quality items.
const TOPIC_TO_MODULE_SLUGS = {
  arrays:            ['arrays-pointers-windows', 'arrays-counting-select', 'arrays-range-structures', 'arrays-searching'],
  strings:           ['strings-advanced', 'strings-matching', 'sorting-strings'],
  hashing:           ['hashing'],
  'sliding-window':  ['arrays-pointers-windows'],
  'two-pointers':    ['arrays-pointers-windows'],
  'binary-search':   ['arrays-binary-search', 'arrays-searching'],
  stack:             ['stacks-queues'],
  queue:             ['stacks-queues'],
  heap:              ['heaps'],
  trees:             ['trees-traversal-bst', 'trees-advanced-queries', 'trees-balanced-disk'],
  tries:             ['trees-advanced-queries'],
  graphs:            ['graphs-traversal', 'graphs-union-find', 'graphs-shortest-paths'],
  'advanced-graphs': ['graphs-advanced', 'graphs-flow-grids', 'graphs-mst', 'graphs-shortest-paths'],
  dp:                ['dp-classical', 'dp-advanced'],
  backtracking:      ['recursion-bt'],
  recursion:         ['recursion-bt', 'foundations-patterns'],
  greedy:            ['greedy'],
  'bit-manipulation':['bitwise'],
  linkedlist:        ['linked-lists'],
  intervals:         ['arrays-range-structures', 'sorting-strings'],
  geometry:          ['math-geom-sampling'],
  math:              ['math-number-theory', 'math-geom-sampling'],
};

// problem.topic_id -> DSA tutorial section slug (one canonical pick — the
// tutorial outline has a single section per topic).
const TOPIC_TO_TUTORIAL_SLUG = {
  arrays:            'array-string',
  strings:           'array-string',
  hashing:           'hashing',
  'sliding-window':  'sliding-window',
  'two-pointers':    'two-pointer',
  'binary-search':   'searching',
  stack:             'stack',
  queue:             'queue',
  heap:              'heap',
  trees:             'binary-tree',
  tries:             'trie',
  graphs:            'graph',
  'advanced-graphs': 'graph',
  dp:                'dp',
  backtracking:      'backtracking',
  recursion:         'maths-pattern-recursion',
  greedy:            'greedy',
  'bit-manipulation':'bit-manipulation',
  linkedlist:        'linked-list',
  intervals:         'sorting',
  geometry:          'maths-pattern-recursion',
  math:              'number-theory',
};

// problem.topic_id -> course ids that drill the surrounding skills. Language
// basics (Python/Java/C++) are universal so they appear for every topic but
// at low priority — the picker only surfaces them if a more specific course
// did not land.
const TOPIC_TO_COURSE_IDS = {
  arrays:            ['python-basics', 'cpp-basics'],
  strings:           ['python-basics', 'java-basics'],
  hashing:           ['python-basics', 'java-basics'],
  'sliding-window':  ['python-basics'],
  'two-pointers':    ['python-basics', 'cpp-basics'],
  'binary-search':   ['python-basics', 'cpp-basics'],
  stack:             ['python-basics', 'java-basics'],
  queue:             ['python-basics', 'java-basics'],
  heap:              ['cpp-basics', 'java-basics'],
  trees:             ['java-basics', 'cpp-basics'],
  tries:             ['python-basics', 'cpp-basics'],
  graphs:            ['python-basics', 'cpp-basics'],
  'advanced-graphs': ['cpp-basics'],
  dp:                ['python-basics', 'cpp-basics'],
  backtracking:      ['python-basics'],
  recursion:         ['python-basics'],
  greedy:            ['python-basics'],
  'bit-manipulation':['cpp-basics', 'java-basics'],
  linkedlist:        ['java-basics', 'cpp-basics'],
  intervals:         ['python-basics'],
  geometry:          ['ml-math', 'python-basics'],
  math:              ['ml-math', 'python-basics'],
};

const READABLE_TOPIC = {
  arrays: 'Arrays',
  strings: 'Strings',
  hashing: 'Hashing',
  'sliding-window': 'Sliding window',
  'two-pointers': 'Two pointers',
  'binary-search': 'Binary search',
  stack: 'Stacks',
  queue: 'Queues',
  heap: 'Heaps',
  trees: 'Trees',
  tries: 'Tries',
  graphs: 'Graphs',
  'advanced-graphs': 'Advanced graphs',
  dp: 'Dynamic programming',
  backtracking: 'Backtracking',
  recursion: 'Recursion',
  greedy: 'Greedy',
  'bit-manipulation': 'Bit manipulation',
  linkedlist: 'Linked lists',
  intervals: 'Intervals',
  geometry: 'Geometry',
  math: 'Math',
};

export function readableTopic(topicId) {
  if (!topicId) return '';
  return READABLE_TOPIC[topicId] || topicId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Walk the company's problems and return the topics ordered by frequency.
// Returns up to `limit` entries (default 8) — anything beyond that is noise.
export function topTopics(problems, limit = 8) {
  if (!Array.isArray(problems) || !problems.length) return [];
  const counts = {};
  for (const p of problems) {
    if (!p?.topic_id) continue;
    counts[p.topic_id] = (counts[p.topic_id] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic_id, count]) => ({ topic_id, count }));
}

// Pick up to `limit` concepts (default 10) from the supplied concepts list
// whose module_slug matches one of the modules linked to the company's top
// topics. Order: follows the topic-frequency order so the most-asked subject
// surfaces first. Inside one module we take concepts in their natural
// position order and round-robin across modules so a single huge module
// (graphs-advanced) does not crowd the section.
export function pickConcepts(topics, allConcepts, limit = 10) {
  if (!topics?.length || !allConcepts?.length) return [];

  // module_slug -> sorted concepts (memoized into a Map for fast lookup)
  const conceptsByModule = new Map();
  for (const c of allConcepts) {
    if (!c?.module_slug) continue;
    if (!conceptsByModule.has(c.module_slug)) conceptsByModule.set(c.module_slug, []);
    conceptsByModule.get(c.module_slug).push(c);
  }

  // Build ordered module list: walk topics in frequency order, expand each to
  // its mapped modules, de-dupe.
  const orderedModules = [];
  const seenModules = new Set();
  for (const { topic_id } of topics) {
    const mods = TOPIC_TO_MODULE_SLUGS[topic_id] || [];
    for (const m of mods) {
      if (!seenModules.has(m) && conceptsByModule.has(m)) {
        seenModules.add(m);
        orderedModules.push(m);
      }
    }
  }

  // Round-robin pick from each module's queue.
  const positions = new Array(orderedModules.length).fill(0);
  const out = [];
  while (out.length < limit) {
    let added = false;
    for (let i = 0; i < orderedModules.length && out.length < limit; i++) {
      const queue = conceptsByModule.get(orderedModules[i]) || [];
      if (positions[i] < queue.length) {
        out.push(queue[positions[i]++]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

// Pick up to `limit` tutorial topics (default 6). One DSA tutorial section
// per topic; topic-frequency order; de-duped.
export function pickTutorials(topics, limit = 6) {
  if (!topics?.length) return [];
  const seen = new Set();
  const out = [];
  for (const { topic_id, count } of topics) {
    const slug = TOPIC_TO_TUTORIAL_SLUG[topic_id];
    if (!slug || seen.has(slug)) continue;
    const section = DSA_TUTORIAL.find(s => s.slug === slug);
    if (!section) continue;
    seen.add(slug);
    out.push({
      slug,
      title: section.title,
      note: section.note,
      topic_id,
      count,
    });
    if (out.length >= limit) break;
  }
  return out;
}

// Pick up to `limit` courses (default 4). Same topic-frequency walk, de-duped
// by course id, with a soft fallback to `python-basics` so the section is
// never empty.
export function pickCourses(topics, limit = 4) {
  const seen = new Set();
  const out = [];
  const push = (id) => {
    if (seen.has(id)) return;
    const course = COURSES[id];
    if (!course) return;
    seen.add(id);
    out.push({
      id: course.id,
      title: course.title,
      blurb: course.blurb,
      language: course.language,
      lessonCount: course.lessons?.length || 0,
      estimatedHours: course.estimatedHours,
    });
  };
  for (const { topic_id } of (topics || [])) {
    const ids = TOPIC_TO_COURSE_IDS[topic_id] || [];
    for (const id of ids) {
      if (out.length >= limit) return out;
      push(id);
    }
  }
  // Fallback so the panel always has at least one card.
  if (!out.length) push('python-basics');
  return out;
}
