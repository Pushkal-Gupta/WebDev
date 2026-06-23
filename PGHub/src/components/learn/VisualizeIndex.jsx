import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight, Play, Search, X, Code2, Film, ArrowLeft, Zap, Sparkles,
  BarChart3, Crosshair, Rows3, Layers, Link2, Network, Triangle, Hash,
  Ruler, Share2, Route, GitBranch, Combine, Workflow, Grid3x3, Spline,
  Type, Binary, Sigma, Server, Boxes,
} from 'lucide-react';
import AlgoVisualizer, { ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer, NumberGridRenderer, TreeRenderer } from './AlgoVisualizer';
import { VISUALIZATIONS } from './conceptVisualizations';
import { INTERACTIVE_TEMPLATES } from './interactiveTemplates';
import { INTERACTIVE_VIZ } from './interactiveViz';
import { recordLocalVisit } from '../../lib/achievements';
import { useConcept } from '../../lib/queries';
import RunnableCodePanel from '../RunnableCodePanel';
import ForgeThumb from '../ml/forge/ForgeThumb';
import '../ml/MLLesson.css';
import './Learn.css';

const InteractiveVisualizer = lazy(() => import('./InteractiveVisualizer'));

// Reference code lives on the matching concept (PGcode_concepts.code), keyed by
// language. Python is the canonical reference; fall back to whatever exists so a
// viz that ships only one language still surfaces a runnable panel.
const REF_LANG_ORDER = [
  { key: 'python', label: 'Python' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'java', label: 'Java' },
  { key: 'cpp', label: 'C++' },
];

function pickReferenceCode(code) {
  if (!code || typeof code !== 'object') return null;
  for (const { key, label } of REF_LANG_ORDER) {
    const body = code[key];
    if (typeof body === 'string' && body.trim().length > 0) {
      return { language: key, label, body: body.trim() };
    }
  }
  return null;
}

// Static-viz slug ↔ interactive-template slug.
// Walkthroughs were authored before the interactive mode; some names diverged.
const STATIC_TO_INTERACTIVE = {
  'binary-search':         'binary-search',
  'bfs-dfs':               'bfs',
  'dfs-traversal':         'dfs',
  'dijkstras-algorithm':   'dijkstra',
  'two-pointers':          'two-pointers',
  'sliding-window':        'sliding-window',
  'quicksort-partition':   'quicksort-partition',
  'merge-sort':            'merge-sort',
  'kadanes-algorithm':     'kadanes',
  'bubble-sort':           'bubble-sort',
  'insertion-sort':        'insertion-sort',
  'selection-sort':        'selection-sort',
  'heap-sort':             'heap-sort',
  'union-find':            'union-find',
  'kruskals-mst':          'kruskal-mst',
  'topological-sort':      'topological-sort-kahn',
  'kahns-algorithm':       'topological-sort-kahn',
  'loop-detection':        'floyd-cycle-detection',
  'kmp':                   'kmp-pattern-matching',
  'hash-rolling-rabin-karp':'rabin-karp',
  'trie-insert':           'trie-insert',
  'segment-tree':          'segment-tree-build',
  'fenwick-tree':          'fenwick-prefix-sum',
  'bst-insertion':         'bst-insert',
  'bellman-ford':          'bellman-ford',
  'floyd-warshall':        'floyd-warshall',
  // Batch viz slugs mapped to their matching editor template so each viz page
  // surfaces the "Edit and run your own implementation" panel.
  'dijkstra-on-grid':              'dijkstra',
  'dijkstra-with-path':            'dijkstra',
  'dijkstra-stops':                'dijkstra',
  'kahn-topological-sort':         'topological-sort-kahn',
  'topological-sort-dfs':          'topological-sort-kahn',
  'mst-prim':                      'prim-mst',
  'kruskals-algorithm':            'kruskal-mst',
  'union-find-data-structure':     'union-find',
  'heap-binary':                   'heap-insert',
  'heap-sort-algorithm':           'heap-sort',
  'floyd-cycle-detection':         'floyd-cycle-detection',
  'kmp-failure-function':          'kmp-pattern-matching',
  'fenwick-bit':                   'fenwick-prefix-sum',
  'segment-tree-merge':            'segment-tree-build',
  'binary-search-tree-operations': 'bst-insert',
  'bst-iterator-inorder':          'bst-search',
  'trie':                          'trie-insert',
  'boyer-moore-voting-extended':   'boyer-moore-majority',
  'graph-floyd-warshall':          'floyd-warshall',
};

// Walkthrough slug ↔ rich INTERACTIVE_VIZ React component key.
// Direct name matches (e.g. 'binary-search', 'two-pointers') resolve without
// an entry here; this map only covers slugs whose names diverged from the
// rich-viz registry. A slug that resolves here HEROES the full React viz.
const STATIC_TO_RICHVIZ = {
  'bubble-sort':                'bubble-sort-algorithm',
  'merge-sort':                 'merge-sort-algorithm',
  'quicksort-partition':        'quicksort-algorithm',
  'a-star-search':              'astar-search',
  'lca-binary-lifting':         'binary-lifting-lca',
  'binary-lifting-general':     'binary-lifting-lca',
  'bloom-filter':               'bloom-filter-tuning',
  'boyer-moore-majority':       'boyer-moore-voting-extended',
  'boyer-moore-string-search':  'boyer-moore-bad-char',
  'bst-insertion':              'binary-search-tree-operations',
  'bst-inorder':                'bst-iterator-inorder',
  'xor-tricks':                 'bitwise-xor-properties',
  'aho-corasick':               'aho-corasick-failure',
  'fenwick-tree':               'fenwick-bit',
  'lru-cache':                  'cache-eviction-policies',
  'lru-cache-design':           'cache-eviction-policies',
  'mos-algorithm':              'mo-algorithm',
  'topological-sort-kahn':      'kahn-topological-sort',
};

// Resolve the best rich (full React) interactive viz for a walkthrough slug:
// prefer a same-named INTERACTIVE_VIZ entry, then the divergent-name alias.
function richVizForSlug(slug) {
  return INTERACTIVE_VIZ[slug] || INTERACTIVE_VIZ[STATIC_TO_RICHVIZ[slug]] || null;
}

const META = {
  'a-star-search':                  { module: 'graphs-shortest-paths',      blurb: 'Greedy best-first with a heuristic guiding relaxation toward the goal.' },
  'aho-corasick':                   { module: 'strings-matching',           blurb: 'Multi-pattern matching via a trie augmented with failure links.' },
  'amortized-analysis':             { module: 'foundations-analysis',       blurb: 'Aggregate, accounting, potential — three lenses on average cost.' },
  'array-cyclic-sort':              { module: 'arrays-pointers-windows',    blurb: 'Place each value at its index in one pass; O(n) for 1..n arrays.' },
  'best-stock-multiple-tx':         { module: 'arrays-pointers-windows',    blurb: 'Greedy sum of every upward delta captures maximum profit.' },
  'bellman-ford':                   { module: 'graphs-shortest-paths',      blurb: 'V−1 relaxation passes find shortest paths even with negative edges.' },
  'bellman-ford-detection':         { module: 'graphs',                     blurb: 'Run V−1 relax passes, then one more; any further relaxation proves a negative cycle.' },
  'bfs-dfs':                        { module: 'trees',                      blurb: 'Breadth-first traversal frontier expansion.' },
  'binary-lifting-general':         { module: 'trees-advanced-queries',     blurb: 'Precompute 2^k jumps for O(log n) ancestor and path queries.' },
  'binary-search':                  { module: 'arrays-binary-search',       blurb: 'Halve the search space at every step.' },
  'binary-search-on-answer':        { module: 'arrays-binary-search',       blurb: 'Binary-search a monotone predicate instead of a value.' },
  'bipartite-check':                { module: 'graphs-traversal',           blurb: 'Two-color BFS detects odd cycles and proves bipartiteness.' },
  'bit-dp':                         { module: 'dp-advanced',                blurb: 'State as a subset bitmask; classic for travelling-salesman style DP.' },
  'bloom-filter':                   { module: 'cs-tools-encodings',         blurb: 'k hashes flip bits; queries say "definitely not" or "probably yes".' },
  'boyer-moore-majority':           { module: 'strings-matching',           blurb: 'Cancel pairs to find a strict majority element in O(n), O(1) space.' },
  'boyer-moore-string-search':      { module: 'strings-matching',           blurb: 'Compare right-to-left; bad-character skips slide the pattern past whole chunks of text.' },
  'bst-insertion':                  { module: 'trees',                      blurb: 'Walk left or right comparing the key; new node lands at the first null slot.' },
  'bst-inorder':                    { module: 'trees-traversal-bst',        blurb: 'Inorder walk visits BST keys in sorted order.' },
  'bubble-sort':                    { module: 'sorting-strings',            blurb: 'Adjacent compares + swaps. Canonical O(n²).' },
  'chinese-remainder':              { module: 'math-number-theory',         blurb: 'Stitch residues mod coprime moduli into a single residue.' },
  'circuit-breaker':                { module: 'system-design',              blurb: 'Fail-fast state machine: CLOSED counts failures, OPEN short-circuits, HALF_OPEN probes for recovery.' },
  'coin-change-variants':           { module: 'dp-classical',               blurb: 'Count ways or minimize coins via 1D DP over the amount axis.' },
  'consistent-hashing':             { module: 'system-design',              blurb: 'Place servers + keys on a hash ring; removing a node only reshuffles its arc of keys.' },
  'convex-hull-trick':              { module: 'dp',                         blurb: 'Maintain the lower envelope of m·x+b lines; min queries become O(1) amortised.' },
  'coordinate-compression':         { module: 'foundations-patterns',       blurb: 'Replace sparse coordinates with their sorted ranks.' },
  'counting-inversions':            { module: 'sorting-strings',            blurb: 'Merge-sort piggybacks on its merge step to count out-of-order pairs.' },
  'counting-sort':                  { module: 'sorting-strings',            blurb: 'Tally values, prefix-sum the counts, place stably — O(n + k), no comparisons.' },
  'cuckoo-hashing':                 { module: 'hashing',                    blurb: 'Two tables, two hash functions. Inserts displace residents until everyone finds a home.' },
  'cycle-detection-graph':          { module: 'graphs-traversal',           blurb: 'DFS colors detect back-edges that close a cycle.' },
  'dfs-iterative':                  { module: 'graphs-traversal',           blurb: 'Explicit stack replays recursive DFS without blowing the call stack.' },
  'dfs-traversal':                  { module: 'graphs',                     blurb: 'Stack-based DFS expansion with spanning-tree edges highlighted.' },
  'digit-dp':                       { module: 'dp-advanced',                blurb: 'Walk number digits with tight/loose state to count constrained integers.' },
  'dijkstra-pq':                    { module: 'graphs-shortest-paths',      blurb: 'Min-heap version of Dijkstra runs in O((V+E) log V).' },
  'dijkstras-algorithm':            { module: 'graphs',                     blurb: 'Shortest paths from source with relaxation, distance labels live.' },
  'disjoint-set-rank':              { module: 'graphs-union-find',          blurb: 'Union by rank keeps the DSU forest near-flat.' },
  'dp-coin-change-min-coins':       { module: 'dp-classical',               blurb: 'Fill dp[amount] = min over coins of dp[amount−coin] + 1.' },
  'dp-edit-distance-levenshtein':   { module: 'dp-classical',               blurb: 'Insert, delete, substitute — minimum operations between two strings.' },
  'dp-knapsack-bounded-unbounded':  { module: 'dp-classical',               blurb: 'Two table orientations switch between 0/1 and unbounded knapsack.' },
  'dp-on-trees':                    { module: 'trees-advanced-queries',     blurb: 'Post-order combines children answers into parents.' },
  'dsu-on-tree':                    { module: 'trees-advanced-queries',     blurb: 'Small-to-large merging answers subtree queries in O(n log n).' },
  'dutch-national-flag':            { module: 'arrays-pointers-windows',    blurb: 'Three-way partition sorts {0,1,2} arrays in one pass.' },
  'euclidean-gcd':                  { module: 'math-number-theory',         blurb: 'gcd(a,b) = gcd(b, a mod b) — terminates in O(log min).' },
  'euler-tour-tree':                { module: 'trees-advanced-queries',     blurb: 'Flatten a tree into an array so subtrees become contiguous ranges.' },
  'fenwick-tree':                   { module: 'trees-advanced-queries',     blurb: 'Binary-indexed tree gives O(log n) prefix sums and point updates.' },
  'fft-basics':                     { module: 'math-geom-sampling',         blurb: 'Divide-and-conquer evaluation of polynomials at roots of unity.' },
  'fibonacci-recursion':            { module: null,                         blurb: 'See the exponential call tree of naive fib — and why memoization collapses it.' },
  'find-peak-element':              { module: 'arrays-binary-search',       blurb: 'Binary-search the half whose neighbour rises — a peak must live there.' },
  'floyd-warshall':                 { module: 'graphs-shortest-paths',      blurb: 'Triple loop relaxes through every intermediate vertex.' },
  'gale-shapley':                   { module: 'graphs-advanced',            blurb: 'Stable matching via deferred-acceptance proposals.' },
  'gas-station-circular':           { module: 'arrays-pointers-windows',    blurb: 'Greedy linear scan finds the start index for the circular tour.' },
  'hash-collision':                 { module: null,                         blurb: 'Bars = bucket length. Watch collisions cluster, then notice when resizing would kick in.' },
  'hash-rolling-rabin-karp':        { module: 'strings-matching',           blurb: 'Roll a polynomial hash window to find substring matches in O(n+m).' },
  'heap-sort':                      { module: 'sorting-strings',            blurb: 'Build a max-heap, then repeatedly swap the root to the shrinking tail.' },
  'heavy-light-decomposition':      { module: 'trees-advanced-queries',     blurb: 'Chain heavy edges so path queries hit at most O(log n) segments.' },
  'hopcroft-karp':                  { module: 'graphs-advanced',            blurb: 'BFS layers + DFS augmenting paths give O(E√V) bipartite matching.' },
  'huffman-coding':                 { module: 'strings-matching',           blurb: 'Greedy merge of lowest-frequency nodes builds an optimal prefix code.' },
  'insertion-sort':                 { module: 'sorting-strings',            blurb: 'Bubble each new element backward into the sorted prefix.' },
  'interval-merge':                 { module: 'arrays-range-structures',    blurb: 'Sort by start, then sweep merging any overlap with the running interval.' },
  'island-count-bfs':               { module: 'graphs-traversal',           blurb: 'BFS floods each unvisited land cell to count grid components.' },
  'jump-game-i-ii':                 { module: 'arrays-pointers-windows',    blurb: 'Greedy reach tracking solves can-jump and min-jumps in O(n).' },
  'kadanes-algorithm':              { module: 'dp',                         blurb: 'Maximum subarray sum, single linear pass.' },
  'kahns-algorithm':                { module: 'graphs',                     blurb: 'Topological sort via BFS: emit any in-degree-0 node, decrement its out-neighbours, repeat.' },
  'kmp':                            { module: 'strings-matching',           blurb: 'Failure function skips redundant comparisons for O(n+m) matching.' },
  'kruskals-mst':                   { module: 'graphs-mst',                 blurb: 'Sort edges, add the cheapest that does not close a cycle via DSU.' },
  'kth-smallest-bst':               { module: 'trees-traversal-bst',        blurb: 'Inorder traversal stops at the k-th visited node.' },
  'largest-rectangle-histogram':    { module: 'stacks-queues',              blurb: 'Monotonic stack of indices finds the maximal-area rectangle in O(n).' },
  'lca-binary-lifting':             { module: 'trees-advanced-queries',     blurb: 'Precomputed jumps answer lowest-common-ancestor queries in O(log n).' },
  'linear-vs-binary':               { module: 'arrays-binary-search',       blurb: 'Side-by-side: linear scan vs binary halving on the same sorted array.' },
  'longest-common-subseq':          { module: 'dp',                         blurb: 'Match → diagonal+1, mismatch → max(up, left). Classic 2D DP.' },
  'longest-increasing-subseq':      { module: 'dp-classical',               blurb: 'Patience-sorting piles give the LIS length in O(n log n).' },
  'loop-detection':                 { module: 'linked-lists',               blurb: "Floyd's tortoise-and-hare cycle detection." },
  'lru-cache':                      { module: 'cs-tools-encodings',         blurb: 'Hashmap + doubly-linked list give O(1) get and put with LRU eviction.' },
  'lru-cache-design':               { module: 'hashing',                    blurb: 'Hashmap for O(1) lookup, doubly-linked list for O(1) reorder; tail is the eviction victim.' },
  'manachers-algorithm':            { module: 'strings-matching',           blurb: 'Find every palindromic substring in linear time using mirror reuse.' },
  'matrix-exponentiation':          { module: 'math-number-theory',         blurb: 'Fast-power a transition matrix to leap linear recurrences in O(log n).' },
  'max-flow':                       { module: 'graphs-advanced',            blurb: 'Ford-Fulkerson pushes flow along augmenting paths in the residual graph.' },
  'merge-sort':                     { module: 'sorting-strings',            blurb: 'The merge step: take from the smaller head of two sorted halves until both drain.' },
  'merkle-tree':                    { module: 'system-design',              blurb: 'Hash-pair upward to a single root; verify any block in O(log n) with a sibling-hash path.' },
  'min-stack':                      { module: 'stacks-queues',              blurb: 'Auxiliary stack of running minima makes getMin O(1).' },
  'monotonic-deque':                { module: 'stacks-queues',              blurb: 'Decreasing deque of indices answers window-max queries in O(1) amortised.' },
  'monotonic-stack':                { module: 'stacks-queues',              blurb: 'Strictly increasing stack of indices; each element is pushed and popped at most once.' },
  'morris-traversal':               { module: 'trees-traversal-bst',        blurb: 'Thread predecessor links so inorder walks run in O(1) space.' },
  'mos-algorithm':                  { module: 'arrays-range-structures',    blurb: 'Block-sorted offline queries amortise to O((n+q)√n).' },
  'mst-kruskal':                    { module: 'graphs-mst',                 blurb: 'Sorted edges plus union-find build the minimum spanning tree.' },
  'n-queens':                       { module: 'recursion-bt',               blurb: 'Backtracking places queens column by column, pruning attacked squares.' },
  'next-greater-element':           { module: 'stacks-queues',              blurb: 'Right-to-left monotonic stack answers every next-greater query in O(n).' },
  'paxos-basics':                   { module: 'system-design',              blurb: 'Two phases — Prepare/Promise then Accept/Accepted — over a quorum of acceptors.' },
  'prefix-sum':                     { module: 'arrays-range-structures',    blurb: 'O(n) preprocessing for O(1) range-sum queries.' },
  'prims-algorithm':                { module: 'graphs-mst',                 blurb: 'Grow one tree from a start vertex; always take the cheapest edge crossing the cut.' },
  'queue-ops':                      { module: 'stacks-queues',              blurb: 'Enqueue at the back, dequeue from the front. FIFO in motion.' },
  'quickhull':                      { module: 'math-geom-sampling',         blurb: 'Divide-and-conquer picks the farthest point off each hull edge.' },
  'quickselect':                    { module: 'sorting-strings',            blurb: 'Partition like quicksort, recurse only on the side containing the answer.' },
  'quicksort-partition':            { module: 'sorting-strings',            blurb: 'Lomuto partition: pivot, swap, place.' },
  'radix-sort-algorithm':           { module: 'sorting-strings',            blurb: 'Stable bucket passes digit by digit sort fixed-width integers in O(d(n + k)).' },
  'radix-tree':                     { module: 'cs-tools-encodings',         blurb: 'Compressed trie collapses single-child chains into edge labels.' },
  'raft-consensus':                 { module: 'system-design',              blurb: 'Leader heartbeats keep followers calm; one timeout fires, election runs, new leader takes term+1.' },
  'random-shuffle-fisher-yates':    { module: 'math-geom-sampling',         blurb: 'Swap each index with a random later index for a uniform permutation.' },
  'reservoir-sampling':             { module: 'math-geom-sampling',         blurb: 'Pick k uniform samples from a stream of unknown length in one pass.' },
  'segment-tree':                   { module: 'trees-advanced-queries',     blurb: 'Recursive halves answer range queries and point updates in O(log n).' },
  'segment-tree-beats':             { module: 'trees-advanced-queries',     blurb: 'Tag each node with second-max to support chmin / chmax range updates.' },
  'segment-tree-lazy':              { module: 'trees-advanced-queries',     blurb: 'Lazy propagation pushes pending range updates only when needed.' },
  'segment-tree-on-intervals':      { module: 'trees-advanced-queries',     blurb: 'Index by interval endpoints to answer overlap and stabbing queries.' },
  'segment-tree-persistent':        { module: 'trees-advanced-queries',     blurb: 'Each update clones a thin O(log n) path, preserving every version.' },
  'selection-sort':                 { module: 'sorting-strings',            blurb: 'Find min of remaining, swap into place. At most n−1 swaps.' },
  'shell-sort':                     { module: 'sorting-strings',            blurb: 'Gapped insertion-sort passes with a shrinking gap herd elements home fast.' },
  'sieve-of-eratosthenes':          { module: 'math',                       blurb: 'All primes up to N by crossing out multiples.' },
  'sliding-window':                 { module: 'arrays-pointers-windows',    blurb: 'Longest substring without repeating chars.' },
  'sliding-window-max':             { module: 'arrays-pointers-windows',    blurb: 'Monotonic-decreasing deque keeps the window max at the front in O(n).' },
  'sparse-table':                   { module: 'trees-advanced-queries',     blurb: 'Precompute idempotent range queries for O(1) lookups after O(n log n) prep.' },
  'stack-ops':                      { module: 'stacks-queues',              blurb: 'Push, pop, peek — LIFO semantics in motion.' },
  'string-edit-distance':           { module: 'strings-matching',           blurb: 'DP table of insert / delete / substitute costs between two strings.' },
  'string-hashing':                 { module: 'strings-matching',           blurb: 'Polynomial hashes give O(1) substring comparison after O(n) prep.' },
  'string-min-window-substring':    { module: 'strings-matching',           blurb: 'Sliding window plus a need-count hash finds the smallest covering window.' },
  'subarray-product-less-k':        { module: 'arrays-pointers-windows',    blurb: 'Shrink the window whenever the running product hits k.' },
  'subarray-sum-equals-k':          { module: 'arrays-range-structures',    blurb: 'Prefix-sum hashmap counts subarrays that sum to k in O(n).' },
  'suffix-array':                   { module: 'strings-advanced',           blurb: 'Sorted suffix indices enable O(log n) substring search.' },
  'suffix-automaton':               { module: 'strings-advanced',           blurb: 'Minimal DFA accepting every substring; linear-size index of a string.' },
  'sweep-line':                     { module: 'math-geom-sampling',         blurb: 'Process events in x-order to count overlaps or intersections.' },
  'ternary-search':                 { module: 'math-geom-sampling',         blurb: 'Trisect a unimodal range to find its extremum in O(log n).' },
  'topological-sort':               { module: 'graphs',                     blurb: "Kahn's algorithm: repeatedly remove 0-in-degree nodes." },
  'treap':                          { module: 'trees-balanced-disk',        blurb: 'Random priorities + BST keys keep heights logarithmic in expectation.' },
  'tree-diameter':                  { module: 'trees-traversal-bst',        blurb: 'Two BFS passes from opposite ends find the longest path.' },
  'tree-right-side-view':           { module: 'trees-traversal-bst',        blurb: 'Level-order traversal records the rightmost node of each depth.' },
  'trie-autocomplete':              { module: 'cs-tools-encodings',         blurb: 'Walk to the prefix node, then DFS the subtree for completions.' },
  'trie-insert':                    { module: null,                         blurb: 'Insert characters one by one; share prefixes; mark word ends.' },
  'two-pointers':                   { module: 'arrays-pointers-windows',    blurb: 'Pair sum on a sorted array, O(n).' },
  'two-sat':                        { module: 'graphs-advanced',            blurb: 'Implication graph + SCCs decide 2-SAT formulas in linear time.' },
  'union-find':                     { module: 'graphs',                     blurb: 'Disjoint-set forest with path compression. Depth bars shrink as queries flatten the trees.' },
  'unique-paths-grid':              { module: 'dp-classical',               blurb: '2D DP counts lattice paths under blocked-cell constraints.' },
  'validate-bst':                   { module: 'trees-traversal-bst',        blurb: 'Carry min/max bounds down each recursion to verify BST order.' },
  'word-ladder-bfs':                { module: 'graphs-traversal',           blurb: 'BFS over one-letter transformations finds the shortest word chain.' },
  'xor-tricks':                     { module: 'bitwise',                    blurb: 'XOR pairs cancel — single-number and missing-number tricks fall out.' },
  'z-algorithm':                    { module: 'strings-matching',           blurb: 'Z-array gives substring matches and palindrome work in linear time.' },
  'zero-one-bfs':                   { module: 'graphs-shortest-paths',      blurb: 'Deque BFS handles 0/1-weighted graphs in O(V+E).' },
  'zero-one-knapsack':              { module: 'dp',                         blurb: 'Fill the n×W table row by row; final cell is the optimal value.' },
};

// Step count for a viz entry — handles both legacy `frames` and the new
// multi-case shape where step counts vary per case (we pick the default case).
function vizStepCount(viz) {
  if (Array.isArray(viz?.frames)) return viz.frames.length;
  const cs = viz?.cases;
  if (Array.isArray(cs) && cs[0] && Array.isArray(cs[0].frames)) return cs[0].frames.length;
  return 0;
}

function renderForSlug(slug, frame) {
  const r = VISUALIZATIONS[slug]?.renderer;
  if (r === 'graph')  return <GraphRenderer frame={frame} />;
  if (r === 'window') return <SlidingWindowRenderer frame={frame} />;
  if (r === 'grid')   return <NumberGridRenderer frame={frame} />;
  if (r === 'tree')   return <TreeRenderer frame={frame} />;
  return <ArrayBarRenderer frame={frame} />;
}

export default function VisualizeIndex() {
  const { slug, category } = useParams();

  useEffect(() => {
    if (slug) recordLocalVisit('viz', slug);
  }, [slug]);

  if (slug) return <VizDetail slug={slug} />;
  if (category) return <VizCategory category={category} />;
  return <VisualizeIndexList />;
}

// ── Detail / walkthrough page ──────────────────────────────────────────────
// Heroes the BEST available visual for the slug: a rich interactive React viz
// when one exists, otherwise the frame-based walkthrough. The frame walkthrough
// becomes a complementary section beneath the hero, and the code-editor mode is
// an optional "write your own" disclosure rather than an empty default tab.

function VizDetail({ slug }) {
  const [showEditor, setShowEditor] = useState(true);
  const codePanelRef = useRef(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setShowEditor(true); }, [slug]);

  // HashRouter treats href="#..." as a route change, so the chip programmatically
  // scrolls to the panel (and expands the collapsed editor) instead of anchoring.
  const scrollToCodePanel = () => {
    setShowEditor(true);
    const node = codePanelRef.current;
    if (!node) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const { data: concept } = useConcept(slug);
  const refCode = useMemo(() => pickReferenceCode(concept?.code), [concept]);

  const viz = VISUALIZATIONS[slug];
  if (!viz) {
    return (
      <div className="learn-container">
        <div className="learn-breadcrumbs">
          <Link to="/visualize">Visualizations</Link>
        </div>
        <div className="learn-header">
          <h1 className="learn-title">Not found</h1>
          <p className="learn-sub">No visualization exists for "{slug}".</p>
        </div>
      </div>
    );
  }

  const meta = META[slug] || {};
  const cat = categoryForSlug(slug);
  const catDef = CAT_BY_KEY[cat];
  const RichViz = INTERACTIVE_VIZ[slug] || INTERACTIVE_VIZ[STATIC_TO_RICHVIZ[slug]] || null;
  const editorSlug = INTERACTIVE_TEMPLATES[slug]
    ? slug
    : (STATIC_TO_INTERACTIVE[slug] && INTERACTIVE_TEMPLATES[STATIC_TO_INTERACTIVE[slug]]
      ? STATIC_TO_INTERACTIVE[slug]
      : null);
  const hasEditor = Boolean(editorSlug);
  const hasWalkthrough = vizStepCount(viz) > 0;
  // The editable code surface, in priority order:
  //   1. the concept's reference implementation (multi-language, from the DB)
  //   2. the interactive template's starter code (JavaScript, runs in-browser)
  // Whichever exists is rendered as a REAL editable + runnable RunnableCodePanel
  // so the "Editable code" pill always reveals something the user can edit/run.
  const templateCode = editorSlug ? INTERACTIVE_TEMPLATES[editorSlug]?.initialCode : null;
  const panelCode = (concept?.code && typeof concept.code === 'object')
    ? concept.code
    : (refCode ? refCode.body : templateCode);
  const panelLang = refCode ? refCode.language : 'javascript';
  // The "Editable code" badge must promise something real: it shows only when
  // the page actually renders an editable surface.
  const hasCodePanel = Boolean(panelCode) || hasEditor;

  const walkthrough = hasWalkthrough ? (
    <AlgoVisualizer
      frames={viz.frames}
      cases={viz.cases}
      build={viz.build}
      inputSchema={viz.inputSchema}
      render={(frame) => renderForSlug(slug, frame)}
      autoPlay
    />
  ) : null;

  return (
    <div className="learn-container viz-detail">
      <div className="learn-breadcrumbs">
        <Link to="/visualize">Visualize</Link>
        {catDef && (
          <>
            <span>/</span>
            <Link to={`/visualize/c/${cat}`}>{catDef.label}</Link>
          </>
        )}
        <span>/</span>
        <span>{viz.title}</span>
      </div>

      <header className="viz-detail-hero">
        <div className="viz-detail-hero-text">
          <h1 className="viz-detail-title">{viz.title}</h1>
          {meta.blurb && <p className="viz-detail-blurb">{meta.blurb}</p>}
        </div>
        <div className="viz-detail-chips">
          {RichViz && <span className="viz-detail-chip primary"><Sparkles size={12} /> Interactive</span>}
          {hasWalkthrough && <span className="viz-detail-chip"><Film size={12} /> {vizStepCount(viz)}-step walkthrough</span>}
          {hasCodePanel && (
            <button type="button" onClick={scrollToCodePanel} className="viz-detail-chip viz-detail-chip-link">
              <Code2 size={12} /> Editable code
            </button>
          )}
        </div>
      </header>

      {RichViz ? (
        <>
          <section className="viz-detail-stage" aria-label="Interactive visualization">
            <RichViz />
          </section>
          {walkthrough && (
            <section className="viz-detail-section" aria-label="Step-by-step walkthrough">
              <div className="viz-detail-section-head">
                <Film size={14} />
                <span>Step-by-step walkthrough</span>
              </div>
              {walkthrough}
            </section>
          )}
        </>
      ) : (
        <section className="viz-detail-stage" aria-label="Step-by-step walkthrough">
          {walkthrough || (
            <p className="viz-detail-empty">This visualization has no frames yet.</p>
          )}
        </section>
      )}

      {hasCodePanel && <div ref={codePanelRef} className="viz-detail-anchor" aria-hidden="true" />}

      {panelCode && (
        <section className="viz-detail-section" aria-label="Editable code">
          <div className="viz-detail-section-head">
            <Code2 size={14} />
            <span>Editable code — edit and run it</span>
          </div>
          <RunnableCodePanel code={panelCode} lang={panelLang} />
        </section>
      )}

      {hasEditor && (
        <details className="viz-detail-advanced" open={showEditor} onToggle={(e) => setShowEditor(e.currentTarget.open)}>
          <summary className="viz-detail-advanced-summary">
            <Code2 size={14} />
            <span>Trace it frame by frame — edit the visualizer code</span>
            <span className="viz-detail-advanced-hint">JavaScript, runs in your browser</span>
          </summary>
          <div className="viz-detail-advanced-body">
            {showEditor && (
              <Suspense fallback={<div className="viz-detail-empty">Loading editor…</div>}>
                <InteractiveVisualizer slug={editorSlug} />
              </Suspense>
            )}
          </div>
        </details>
      )}

      {meta.module && (
        <Link to={`/learn/${meta.module}/${slug}`} className="viz-detail-concept-link">
          <span>Read the full concept — intuition, complexity, and code in four languages</span>
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

// ── Category model ─────────────────────────────────────────────────────────
// Each viz slug carries a `module` in META. We fold those modules into a
// smaller set of structure/algorithm CATEGORIES. New viz auto-appear: a slug
// whose module isn't mapped lands in 'misc', as does a slug with no META.
// Each category declares a `preview` kind that drives a tiny animated SVG.

const CATEGORIES = [
  { key: 'sorting',     label: 'Sorting',                 preview: 'bars',    icon: BarChart3, blurb: 'Compare, swap, partition — watch order emerge from chaos.' },
  { key: 'searching',   label: 'Searching',               preview: 'search',  icon: Crosshair, blurb: 'Halve the space, probe the midpoint, converge on the target.' },
  { key: 'arrays',      label: 'Arrays & Windows',        preview: 'window',  icon: Rows3,     blurb: 'Two pointers, sliding windows, prefix sums over a flat sequence.' },
  { key: 'stacks',      label: 'Stacks & Queues',         preview: 'stack',   icon: Layers,    blurb: 'LIFO pushes, FIFO drains, and the monotonic structures built on them.' },
  { key: 'linked',      label: 'Linked Lists',            preview: 'list',    icon: Link2,     blurb: 'Pointer chasing, cycle detection, and in-place rewiring.' },
  { key: 'trees',       label: 'Trees & BST',             preview: 'tree',    icon: Network,   blurb: 'Ordered insertion, traversal orders, and self-balancing rotations.' },
  { key: 'heaps',       label: 'Heaps',                   preview: 'heap',    icon: Triangle,  blurb: 'The shape + heap property that make the min or max an O(1) peek.' },
  { key: 'hashing',     label: 'Hashing',                 preview: 'ring',    icon: Hash,      blurb: 'Buckets, collisions, probing rings, and membership filters.' },
  { key: 'range',       label: 'Range Structures',        preview: 'segbars', icon: Ruler,     blurb: 'Segment trees, Fenwick trees, sparse tables for range queries.' },
  { key: 'graphs',      label: 'Graph Traversal',         preview: 'graph',   icon: Share2,    blurb: 'BFS frontiers, DFS spanning trees, topological order, cycles.' },
  { key: 'shortest',    label: 'Shortest Paths',          preview: 'paths',   icon: Route,     blurb: 'Relax edges with Dijkstra, Bellman-Ford, Floyd-Warshall, A*.' },
  { key: 'mst',         label: 'Minimum Spanning Tree',   preview: 'mst',     icon: GitBranch, blurb: 'Grow or merge the cheapest cycle-free edge set with Prim / Kruskal.' },
  { key: 'unionfind',   label: 'Union-Find (DSU)',        preview: 'dsu',     icon: Combine,   blurb: 'Disjoint sets with path compression and union by rank.' },
  { key: 'graphsadv',   label: 'Advanced Graphs',         preview: 'graph',   icon: Workflow,  blurb: 'Flow, matching, SCCs, articulation points, 2-SAT.' },
  { key: 'dp',          label: 'Dynamic Programming',     preview: 'grid',    icon: Grid3x3,   blurb: 'Fill a table cell by cell; each answer reuses the ones before it.' },
  { key: 'recursion',   label: 'Recursion & Backtracking',preview: 'rectree', icon: Spline,    blurb: 'Branch the search space, prune dead ends, unwind the call tree.' },
  { key: 'strings',     label: 'Strings & Matching',      preview: 'text',    icon: Type,      blurb: 'Failure functions, rolling hashes, suffix structures for matching.' },
  { key: 'bitwise',     label: 'Bit Manipulation',        preview: 'bits',    icon: Binary,    blurb: 'XOR cancellation, masks, and subset enumeration over bits.' },
  { key: 'math',        label: 'Math & Geometry',         preview: 'numline', icon: Sigma,     blurb: 'Number theory, sampling, sweep lines, and convex hulls.' },
  { key: 'systems',     label: 'Systems & Encodings',     preview: 'nodes',   icon: Server,    blurb: 'Caches, consensus, hashing rings, and the structures behind them.' },
  { key: 'misc',        label: 'More',                    preview: 'cells',   icon: Boxes,     blurb: 'Foundations, analysis, and everything else worth stepping through.' },
];

const CAT_ORDER = CATEGORIES.map(c => c.key);
const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

// Module slug -> category key. Modules not listed fall through MODULE_PREFIX
// matching, then to 'misc'. This is the single place to retune grouping.
const MODULE_TO_CAT = {
  'sorting-strings':           'sorting',
  'arrays-binary-search':      'searching',
  'arrays-searching':          'searching',
  'arrays-pointers-windows':   'arrays',
  'arrays-range-structures':   'range',
  'arrays-counting-select':    'sorting',
  'stacks-queues':             'stacks',
  'linked-lists':              'linked',
  'trees':                     'trees',
  'trees-traversal-bst':       'trees',
  'trees-balanced-disk':       'trees',
  'trees-advanced-queries':    'range',
  'heaps':                     'heaps',
  'hashing':                   'hashing',
  'graphs':                    'graphs',
  'graphs-traversal':          'graphs',
  'graphs-shortest-paths':     'shortest',
  'graphs-mst':                'mst',
  'graphs-union-find':         'unionfind',
  'graphs-flow-grids':         'graphsadv',
  'graphs-advanced':           'graphsadv',
  'dp':                        'dp',
  'dp-classical':              'dp',
  'dp-advanced':               'dp',
  'recursion-bt':              'recursion',
  'strings-matching':          'strings',
  'strings-advanced':          'strings',
  'bitwise':                   'bitwise',
  'math':                      'math',
  'math-number-theory':        'math',
  'math-geom-sampling':        'math',
  'cs-tools-encodings':        'systems',
  'system-design':             'systems',
  'foundations':               'misc',
  'foundations-analysis':      'misc',
  'foundations-patterns':      'misc',
  'greedy':                    'misc',
  'cs-core':                   'systems',
  'cs-db-transactions':        'systems',
  'cs-network-protocols':      'systems',
  'cs-os-concurrency':         'systems',
};

// A handful of un-moduled slugs (module:null in META) get a direct category.
const SLUG_TO_CAT = {
  'fibonacci-recursion': 'recursion',
  'hash-collision':      'hashing',
  'trie-insert':         'strings',
  // Tree / balanced-tree viz batch
  'avl-tree':                       'trees',
  'avl-tree-rotations':             'trees',
  'b-tree':                         'trees',
  'b-tree-classic':                 'trees',
  'b-plus-tree':                    'trees',
  'bplus-tree-internals':           'trees',
  'bst-iterator-inorder':           'trees',
  'binary-search-tree-operations':  'trees',
  'binary-lifting-lca':             'trees',
  // Graph traversal / structure viz batch
  'bfs-algorithm':                  'graphs',
  'astar-search':                   'shortest',
  'articulation-bridges':           'graphsadv',
  'bipartite-matching-kuhn':        'graphsadv',
  // Bitwise viz batch
  'bit-counting-tricks':            'bitwise',
  'bitwise-xor-properties':         'bitwise',
  'bitwise-gray-code':              'bitwise',
  'bitwise-power-set-bitmask':      'bitwise',
  'bitwise-bit-manipulation-tricks':'bitwise',
  'boyer-moore-voting-extended':    'arrays',
  // String-matching viz batch
  'aho-corasick-failure':           'strings',
  'boyer-moore-bad-char':           'strings',
  // VisuAlgo-gap viz batch
  'tsp-bitmask-dp':                 'graphsadv',
  'hash-table-probing':             'hashing',
  'min-vertex-cover':               'graphsadv',
  'suffix-tree-construction':       'strings',
  // DP viz batch
  'dp-bitmask':                     'dp',
  'dp-interval-mcm':                'dp',
  'dp-tree':                        'dp',
  'dp-digit':                       'dp',
  'dp-game-theory':                 'dp',
  'dp-optimal-bst':                 'dp',
  'dp-job-scheduling':              'dp',
  'dp-longest-arithmetic-seq':      'dp',
  // Advanced-graph viz batch
  'graph-floyd-warshall':           'shortest',
  'graph-tarjan-scc':               'graphsadv',
  'graph-eulerian':                 'graphsadv',
  'graph-coloring-greedy':          'graphsadv',
  'graph-bipartite-coloring':       'graphs',
  'graph-2sat':                     'graphsadv',
  // Strings + NP viz batch
  'string-manacher':                'strings',
  'string-rolling-hash':            'strings',
  'string-suffix-array':            'strings',
  'string-suffix-automaton':        'strings',
  'steiner-tree':                   'graphsadv',
  'np-reductions':                  'graphsadv',
  // Heaps / stacks / queues viz batch
  'heap-binary':                    'heaps',
  'heap-sort-algorithm':            'heaps',
  'priority-queue-array':           'heaps',
  'queue-using-stacks':             'stacks',
  // Trees-advanced viz batch
  'fenwick-bit':                    'range',
  'segment-tree-merge':             'range',
  'tree-morris-traversal':          'trees',
  'tree-iterative-traversals':      'trees',
  'euler-tour-flatten':             'trees',
  'trie':                           'strings',
  // Backtracking viz batch
  'subsets-power-set':              'recursion',
  'permutations-backtrack':         'recursion',
  'combinations-backtrack':         'recursion',
  'n-queens-backtrack':             'recursion',
  'recursion-tail-call':            'recursion',
  // Math / number-theory viz batch
  'math-pow-fast-exponentiation':   'math',
  'math-modular-inverse-fermat':    'math',
  'strassen-matrix-mult':           'math',
  'dp-matrix-exponentiation':       'dp',
  'minimax-game-theory':            'dp',
  // Shortest-path / topo viz batch
  'dijkstra-on-grid':               'shortest',
  'dijkstra-with-path':             'shortest',
  'dijkstra-stops':                 'shortest',
  'johnson-all-pairs':              'shortest',
  'kahn-topological-sort':          'graphs',
  'topological-sort-dfs':           'graphs',
  // MST / SCC viz batch
  'mst-prim':                       'mst',
  'kruskals-algorithm':             'mst',
  'mst-boruvka':                    'mst',
  'kosaraju-2pass':                 'graphsadv',
  'tarjan-scc-algorithm':           'graphsadv',
  'tarjan-articulation':            'graphsadv',
  // Advanced data structures viz batch
  'red-black-tree':                 'trees',
  'splay-tree':                     'trees',
  'treap-randomized-bst':           'trees',
  'skip-list':                      'linked',
  'union-find-data-structure':      'unionfind',
  'quickselect-deterministic':      'sorting',
  'heaps-median-from-stream':       'heaps',
  // Strings / streams viz batch
  'kmp-failure-function':           'strings',
  'lis-patience-sorting':           'dp',
  'edit-distance-algorithm':        'dp',
  'floyd-cycle-detection':          'linked',
  'random-reservoir-stream':        'misc',
  'palindrome-eertree':             'strings',
  // Advanced data structures viz batch 2
  'red-black-tree-properties':      'trees',
  'heaps-skew-leftist':             'heaps',
  'quadtree-spatial':               'trees',
  'link-cut-tree':                  'trees',
  'persistent-segment-tree':        'range',
  'skiplist-concurrent':            'linked',
  // Strings / greedy / graph viz batch
  'string-z-function':              'strings',
  'sliding-window-medians':         'arrays',
  'interval-scheduling':            'misc',
  'set-cover-greedy':               'misc',
  'graph-eulerian-path-circuit':    'graphsadv',
  'dp-state-compression':           'dp',
  // Graph / DP / trie viz batch
  'dijkstra-fibonacci-heap':        'shortest',
  'graph-bridges-articulation':     'graphsadv',
  'dp-recursion-vs-iteration':      'dp',
  'dp-knuth-optimization':          'dp',
  'string-trie-radix':              'strings',
  'queue-priority-fair-sched':      'heaps',
  // More algorithms batch A
  'insertion-sort-algorithm':       'sorting',
  'kmp-deep-dive':                  'strings',
  'kahn-cycle-detect':             'graphs',
  'lowest-common-ancestor-bst':     'trees',
  'median-of-medians':              'sorting',
  'meet-in-the-middle':             'arrays',
  // More algorithms batch B
  'misra-gries':                    'arrays',
  'master-theorem':                 'recursion',
  'network-bridge-finding':         'graphsadv',
  'mst-rerooting':                  'mst',
  'mo-on-trees':                    'graphsadv',
  // More algorithms batch C
  'selection-sort-algorithm':       'sorting',
  'sparse-table-rmq':               'range',
  'range-sum-2d':                   'range',
  'range-update-range-query':       'range',
  'topk-streaming':                 'heaps',
  // More algorithms batch D
  'strongly-connected':             'graphsadv',
  'prim-vs-kruskal':                'mst',
  'topo-shortest-dag':              'shortest',
  'tortoise-and-hare-multi':        'linked',
  'pigeonhole-principle':           'arrays',
  'random-weighted-sampling':       'arrays',
};

// Map a category to a ForgeThumb motif so every member card in a family shares a
// fitting visual register, while per-card seeds keep each card visibly distinct.
const CAT_TO_THUMB = {
  sorting:   'bars',
  searching: 'scatter',
  arrays:    'bars',
  stacks:    'bars',
  linked:    'network',
  trees:     'tree',
  heaps:     'tree',
  hashing:   'heat',
  range:     'matrix',
  graphs:    'network',
  shortest:  'network',
  mst:       'network',
  unionfind: 'network',
  graphsadv: 'network',
  dp:        'matrix',
  recursion: 'tree',
  strings:   'bits',
  bitwise:   'bits',
  math:      'field',
  systems:   'rings',
  misc:      'scatter',
};

// Per-viz override when the slug describes something more specific than its
// category's default motif. First matching pattern wins.
const THUMB_RULES = [
  [/two.?pointer|sliding.?window|window|prefix|kadane|subarray/i, 'bars'],
  [/binary.?search|search|peak|find/i,                            'scatter'],
  [/tree|bst|trie|heap|avl|splay|treap|b-?tree|segment|fenwick/i, 'tree'],
  [/hash|bloom|cuckoo|probing|cache|lru/i,                        'heat'],
  [/dp|knapsack|edit.?distance|subseq|lis|lcs|matrix.?exp/i,      'matrix'],
  [/graph|bfs|dfs|dijkstra|bellman|floyd|topolog|scc|flow|kahn|prim|kruskal|union|mst/i, 'network'],
  [/recursion|backtrack|n-?queens|permut|combinat|subset|power.?set/i, 'tree'],
  [/string|kmp|rabin|manacher|suffix|aho|boyer|z-?(algo|function)|palindrome/i, 'bits'],
  [/xor|bit|gray.?code|mask/i,                                    'bits'],
  [/sieve|gcd|prime|modular|number|geom|sweep|hull|sampl|reservoir|fourier|fft/i, 'field'],
  [/sort|partition|quickselect|merge|bubble|insertion|selection|radix|counting|heap.?sort/i, 'bars'],
];

function thumbKindForViz(slug, cat) {
  for (const [re, kind] of THUMB_RULES) if (re.test(slug)) return kind;
  return CAT_TO_THUMB[cat] || 'scatter';
}

function categoryForSlug(slug) {
  if (SLUG_TO_CAT[slug]) return SLUG_TO_CAT[slug];
  const mod = META[slug]?.module;
  if (mod && MODULE_TO_CAT[mod]) return MODULE_TO_CAT[mod];
  if (mod) {
    // prefix fallback: e.g. an unseen 'graphs-foo' module still lands in graphs
    if (mod.startsWith('graphs')) return 'graphs';
    if (mod.startsWith('trees'))  return 'trees';
    if (mod.startsWith('dp'))     return 'dp';
    if (mod.startsWith('arrays')) return 'arrays';
    if (mod.startsWith('strings'))return 'strings';
    if (mod.startsWith('math'))   return 'math';
    if (mod.startsWith('sorting'))return 'sorting';
    if (mod.startsWith('cs-'))    return 'systems';
  }
  return 'misc';
}

// Gallery of categories — color variety is wanted here (like the Learn-hub
// cards). Each category gets a DISTINCT hue rotating through the palette tokens
// so adjacent cards differ; the token drives stripe, icon-box tint, hover
// border, CTA, and the mini-viz preview. Brand chrome elsewhere stays teal.
const HUES = [
  'var(--accent)',
  'var(--hue-violet)',
  'var(--hue-sky)',
  'var(--hue-pink)',
  'var(--hue-mint)',
  'var(--medium)',
  'var(--hard)',
  'var(--warning)',
  'var(--easy)',
];

// Stable hue per category — keyed off the locked CAT_ORDER index so a category
// always renders the same color regardless of how many have members. The
// step (+4) walks the palette so neighbouring cards never share a hue.
function hueForCategory(key) {
  const i = CAT_ORDER.indexOf(key);
  if (i < 0) return 'var(--accent)';
  return HUES[(i * 4) % HUES.length];
}

function hasLive(slug) {
  return Boolean(
    (STATIC_TO_INTERACTIVE[slug] && INTERACTIVE_TEMPLATES[STATIC_TO_INTERACTIVE[slug]]) ||
    richVizForSlug(slug),
  );
}

// Does this slug surface the editable-code "Advanced" panel? Mirrors the
// editorSlug resolution inside VizDetail.
function hasEditor(slug) {
  return Boolean(
    INTERACTIVE_TEMPLATES[slug] ||
    (STATIC_TO_INTERACTIVE[slug] && INTERACTIVE_TEMPLATES[STATIC_TO_INTERACTIVE[slug]]),
  );
}

// ── Mini animated SVG previews ─────────────────────────────────────────────
// Each is a self-contained, theme-token-coloured, viewBox-scaled loop. The
// accent CSS var is set on the wrapper so each card tints to its hue. No
// external deps, no emoji. width:100% + preserveAspectRatio keeps them fluid.

function Preview({ kind, accent }) {
  const a = accent;
  const dim = 'var(--text-dim)';
  const common = {
    width: '100%',
    height: '100%',
    preserveAspectRatio: 'xMidYMid meet',
    'aria-hidden': true,
  };
  switch (kind) {
    case 'bars': {
      const hs = [22, 38, 14, 46, 30, 52, 18, 42];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {hs.map((h, i) => (
            <rect key={i} x={6 + i * 14} y={56 - h} width="9" height={h} rx="1.5"
              fill={i % 2 ? a : dim} opacity={i % 2 ? 0.9 : 0.45}>
              <animate attributeName="height" values={`${h};${h * 0.5};${h}`} dur="2.4s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${56 - h};${56 - h * 0.5};${56 - h}`} dur="2.4s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </svg>
      );
    }
    case 'search': {
      const xs = [10, 24, 38, 52, 66, 80, 94, 108];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {xs.map((x, i) => (
            <rect key={i} x={x} y={24} width="10" height="12" rx="2" fill={dim} opacity="0.4" />
          ))}
          <rect x="52" y="22" width="10" height="16" rx="2" fill={a}>
            <animate attributeName="x" values="10;108;52" dur="3s" repeatCount="indefinite" />
          </rect>
          <path d="M10 48 H108" stroke={dim} strokeWidth="1" opacity="0.3" />
        </svg>
      );
    }
    case 'window': {
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {[...Array(8)].map((_, i) => (
            <rect key={i} x={8 + i * 14} y={22} width="10" height="16" rx="2" fill={dim} opacity="0.4" />
          ))}
          <rect x="8" y="18" width="38" height="24" rx="4" fill="none" stroke={a} strokeWidth="2">
            <animate attributeName="x" values="8;64;8" dur="3.2s" repeatCount="indefinite" />
          </rect>
        </svg>
      );
    }
    case 'stack': {
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={38} y={44 - i * 11} width="44" height="9" rx="2"
              fill={i === 3 ? a : dim} opacity={i === 3 ? 0.95 : 0.5}>
              {i === 3 && <animate attributeName="y" values="-10;11;11" dur="2.6s" repeatCount="indefinite" />}
            </rect>
          ))}
        </svg>
      );
    }
    case 'list': {
      const xs = [8, 38, 68, 98];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {xs.map((x, i) => (
            <g key={i}>
              <rect x={x} y={22} width="18" height="16" rx="3" fill={i === 0 ? a : dim} opacity={i === 0 ? 0.95 : 0.55} />
              {i < 3 && <path d={`M${x + 18} 30 H${x + 30}`} stroke={a} strokeWidth="1.6" opacity="0.8" />}
            </g>
          ))}
          <circle cx="6" cy="30" r="3" fill={a}>
            <animate attributeName="cx" values="6;112;6" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    case 'tree': {
      const nodes = [[60, 12], [34, 32], [86, 32], [20, 52], [48, 52], [100, 52]];
      const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {edges.map(([u, v], i) => (
            <line key={i} x1={nodes[u][0]} y1={nodes[u][1]} x2={nodes[v][0]} y2={nodes[v][1]} stroke={dim} strokeWidth="1.4" opacity="0.5" />
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="6" fill={i === 0 ? a : dim} opacity={i === 0 ? 0.95 : 0.6}>
              <animate attributeName="r" values="6;7.5;6" dur="2.4s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );
    }
    case 'heap': {
      const nodes = [[60, 12], [38, 34], [82, 34], [24, 54], [52, 54], [96, 54]];
      const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {edges.map(([u, v], i) => (
            <line key={i} x1={nodes[u][0]} y1={nodes[u][1]} x2={nodes[v][0]} y2={nodes[v][1]} stroke={dim} strokeWidth="1.4" opacity="0.5" />
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill={i === 0 ? a : dim} opacity={i === 0 ? 0.95 : 0.55} />
          ))}
          <circle cx={60} cy={12} r="7" fill="none" stroke={a} strokeWidth="2">
            <animate attributeName="r" values="7;11;7" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    case 'ring': {
      const N = 8;
      const cx = 60, cy = 30, r = 20;
      return (
        <svg viewBox="0 0 120 60" {...common}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={dim} strokeWidth="1.4" opacity="0.4" />
          {[...Array(N)].map((_, i) => {
            const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
            return <circle key={i} cx={cx + Math.cos(ang) * r} cy={cy + Math.sin(ang) * r} r="4" fill={i % 3 === 0 ? a : dim} opacity={i % 3 === 0 ? 0.9 : 0.5} />;
          })}
          <circle cx={cx + r} cy={cy} r="4.5" fill={a}>
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="4s" repeatCount="indefinite" />
          </circle>
        </svg>
      );
    }
    case 'segbars': {
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {[...Array(8)].map((_, i) => (
            <rect key={i} x={6 + i * 14} y={44} width="10" height="10" rx="1.5" fill={dim} opacity="0.5" />
          ))}
          {[...Array(4)].map((_, i) => (
            <rect key={i} x={6 + i * 28} y={28} width="24" height="10" rx="1.5" fill={dim} opacity="0.4" />
          ))}
          <rect x="6" y="12" width="108" height="10" rx="1.5" fill={a} opacity="0.85">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" repeatCount="indefinite" />
          </rect>
        </svg>
      );
    }
    case 'graph': {
      const nodes = [[24, 16], [62, 12], [98, 26], [40, 44], [82, 48]];
      const edges = [[0, 1], [1, 2], [0, 3], [1, 3], [2, 4], [3, 4]];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {edges.map(([u, v], i) => (
            <line key={i} x1={nodes[u][0]} y1={nodes[u][1]} x2={nodes[v][0]} y2={nodes[v][1]} stroke={dim} strokeWidth="1.4" opacity="0.5" />
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="6" fill={i === 0 ? a : dim} opacity={i === 0 ? 0.95 : 0.6}>
              <animate attributeName="fill" values={`${dim};${a};${dim}`} dur="3s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      );
    }
    case 'paths': {
      const nodes = [[14, 30], [44, 14], [44, 46], [78, 30], [106, 30]];
      const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {edges.map(([u, v], i) => (
            <line key={i} x1={nodes[u][0]} y1={nodes[u][1]} x2={nodes[v][0]} y2={nodes[v][1]} stroke={dim} strokeWidth="1.4" opacity="0.45" />
          ))}
          <polyline points={[nodes[0], nodes[1], nodes[3], nodes[4]].map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={a} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="80" strokeDashoffset="80">
            <animate attributeName="stroke-dashoffset" values="80;0;0;80" dur="3.4s" repeatCount="indefinite" />
          </polyline>
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill={i === 0 || i === 4 ? a : dim} opacity={i === 0 || i === 4 ? 0.95 : 0.55} />
          ))}
        </svg>
      );
    }
    case 'mst': {
      const nodes = [[20, 18], [58, 12], [96, 22], [34, 48], [80, 50]];
      const tree = [[0, 1], [1, 2], [0, 3], [2, 4]];
      const extra = [[1, 3], [3, 4]];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {extra.map(([u, v], i) => (
            <line key={`e${i}`} x1={nodes[u][0]} y1={nodes[u][1]} x2={nodes[v][0]} y2={nodes[v][1]} stroke={dim} strokeWidth="1.2" opacity="0.3" strokeDasharray="3 3" />
          ))}
          {tree.map(([u, v], i) => (
            <line key={`t${i}`} x1={nodes[u][0]} y1={nodes[u][1]} x2={nodes[v][0]} y2={nodes[v][1]} stroke={a} strokeWidth="2.2" opacity="0.85">
              <animate attributeName="opacity" values="0.15;0.9;0.85" dur="2.8s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
            </line>
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5.5" fill={a} opacity="0.85" />
          ))}
        </svg>
      );
    }
    case 'dsu': {
      const roots = [[28, 16], [92, 16]];
      const kids = [[14, 44], [40, 44], [78, 44], [106, 44]];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          <line x1={28} y1={16} x2={14} y2={44} stroke={a} strokeWidth="1.8" opacity="0.7" />
          <line x1={28} y1={16} x2={40} y2={44} stroke={a} strokeWidth="1.8" opacity="0.7" />
          <line x1={92} y1={16} x2={78} y2={44} stroke={dim} strokeWidth="1.8" opacity="0.5" />
          <line x1={92} y1={16} x2={106} y2={44} stroke={dim} strokeWidth="1.8" opacity="0.5" />
          {roots.map(([x, y], i) => <circle key={`r${i}`} cx={x} cy={y} r="6.5" fill={i === 0 ? a : dim} opacity={i === 0 ? 0.95 : 0.6} />)}
          {kids.map(([x, y], i) => <circle key={`k${i}`} cx={x} cy={y} r="5" fill={i < 2 ? a : dim} opacity={i < 2 ? 0.7 : 0.5} />)}
          <line x1={40} y1={44} x2={78} y2={44} stroke={a} strokeWidth="1.6" strokeDasharray="3 3" opacity="0">
            <animate attributeName="opacity" values="0;0.9;0" dur="3s" repeatCount="indefinite" />
          </line>
        </svg>
      );
    }
    case 'grid': {
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {[...Array(4)].map((_, r) => [...Array(7)].map((__, c) => {
            const on = r === 0 || c === 0 || (r <= c && (r + c) % 3 === 0);
            return <rect key={`${r}-${c}`} x={6 + c * 16} y={4 + r * 14} width="13" height="11" rx="2"
              fill={on ? a : dim} opacity={on ? 0.85 : 0.3}>
              {on && <animate attributeName="opacity" values="0.2;0.85;0.85" dur="2.6s" begin={`${(r + c) * 0.1}s`} repeatCount="indefinite" />}
            </rect>;
          }))}
        </svg>
      );
    }
    case 'rectree': {
      const nodes = [[60, 10], [34, 30], [86, 30], [20, 50], [48, 50], [74, 50], [100, 50]];
      const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {edges.map(([u, v], i) => (
            <line key={i} x1={nodes[u][0]} y1={nodes[u][1]} x2={nodes[v][0]} y2={nodes[v][1]} stroke={a} strokeWidth="1.4" opacity="0.4">
              <animate attributeName="opacity" values="0.1;0.8;0.1" dur="2.8s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
            </line>
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.5" fill={i === 0 ? a : dim} opacity={i === 0 ? 0.95 : 0.55} />
          ))}
        </svg>
      );
    }
    case 'text': {
      const cells = ['A', 'B', 'A', 'B', 'A', 'C', 'A', 'B'];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {cells.map((ch, i) => (
            <g key={i}>
              <rect x={6 + i * 14} y={20} width="11" height="16" rx="2" fill={dim} opacity="0.25" />
              <text x={11.5 + i * 14} y={32} fontSize="9" fontFamily="var(--mono)" textAnchor="middle" fill={dim} opacity="0.8">{ch}</text>
            </g>
          ))}
          <rect x="6" y="18" width="25" height="20" rx="3" fill="none" stroke={a} strokeWidth="2">
            <animate attributeName="x" values="6;81;6" dur="3.4s" repeatCount="indefinite" />
          </rect>
        </svg>
      );
    }
    case 'bits': {
      const bits = [1, 0, 1, 1, 0, 0, 1, 0];
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {bits.map((b, i) => (
            <g key={i}>
              <rect x={6 + i * 14} y={20} width="11" height="18" rx="2" fill={b ? a : dim} opacity={b ? 0.85 : 0.3}>
                <animate attributeName="opacity" values={b ? '0.85;0.35;0.85' : '0.3;0.6;0.3'} dur="2.6s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
              </rect>
              <text x={11.5 + i * 14} y={33} fontSize="9" fontFamily="var(--mono)" textAnchor="middle" fill="var(--bg)" opacity={b ? 0.9 : 0}>{b}</text>
            </g>
          ))}
        </svg>
      );
    }
    case 'numline': {
      return (
        <svg viewBox="0 0 120 60" {...common}>
          <line x1="8" y1="30" x2="112" y2="30" stroke={dim} strokeWidth="1.4" opacity="0.5" />
          {[...Array(8)].map((_, i) => (
            <g key={i}>
              <line x1={12 + i * 13} y1="26" x2={12 + i * 13} y2="34" stroke={dim} strokeWidth="1.2" opacity="0.5" />
              {(i === 2 || i === 3 || i === 5 || i === 7) && (
                <circle cx={12 + i * 13} cy="30" r="4" fill={a} opacity="0.9">
                  <animate attributeName="r" values="2;5;2" dur="2.4s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ))}
        </svg>
      );
    }
    case 'nodes': {
      const cx = 60, cy = 30, r = 20, N = 6;
      const pts = [...Array(N)].map((_, i) => {
        const ang = (i / N) * Math.PI * 2;
        return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
      });
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {pts.map(([x, y], i) => (
            <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={dim} strokeWidth="1.2" opacity="0.4" />
          ))}
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.5" fill={dim} opacity="0.6">
              <animate attributeName="fill" values={`${dim};${a};${dim}`} dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <circle cx={cx} cy={cy} r="6" fill={a} opacity="0.95" />
        </svg>
      );
    }
    case 'cells':
    default: {
      return (
        <svg viewBox="0 0 120 60" {...common}>
          {[...Array(8)].map((_, i) => (
            <rect key={i} x={6 + i * 14} y={22} width="11" height="16" rx="2"
              fill={i % 3 === 0 ? a : dim} opacity={i % 3 === 0 ? 0.85 : 0.4}>
              <animate attributeName="opacity" values="0.3;0.85;0.3" dur="2.6s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </svg>
      );
    }
  }
}

// Fold every registered viz into its category. Newly-registered slugs (added
// to VISUALIZATIONS) auto-appear without touching call sites.
function buildByCat() {
  const m = {};
  for (const [s, viz] of Object.entries(VISUALIZATIONS)) {
    const cat = categoryForSlug(s);
    (m[cat] ||= []).push([s, viz]);
  }
  for (const cat of Object.keys(m)) {
    m[cat].sort((x, y) => (x[1].title || '').localeCompare(y[1].title || ''));
  }
  return m;
}

function VisualizeIndexList() {
  const [query, setQuery] = useState('');

  const byCat = useMemo(() => buildByCat(), []);

  const orderedCats = useMemo(
    () => CAT_ORDER.filter(k => byCat[k]?.length),
    [byCat],
  );

  const q = query.trim().toLowerCase();

  // When searching, flatten to matching viz across all categories.
  const searchHits = useMemo(() => {
    if (!q) return null;
    const hits = [];
    for (const cat of orderedCats) {
      for (const [s, viz] of byCat[cat]) {
        const blurb = (META[s]?.blurb || '').toLowerCase();
        const title = (viz.title || '').toLowerCase();
        if (title.includes(q) || blurb.includes(q) || s.includes(q)) hits.push([cat, s, viz]);
      }
    }
    return hits;
  }, [q, orderedCats, byCat]);

  return (
    <div className="learn-container viz-gallery-container">
      <div className="learn-header">
        <Link to="/learning" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Learning</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">Visualize</span>
        </Link>
        <h1 className="learn-title">Visualize</h1>
        <p className="learn-sub">Pick a data structure or algorithm family and step through it frame by frame.</p>
        <div className="viz-search">
          <Search size={14} className="viz-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search every visualization…"
            className="viz-search-input"
            aria-label="Filter visualizations"
          />
          {query && (
            <button type="button" className="viz-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        {q && (
          <p className="viz-search-meta">
            {searchHits.length} match{searchHits.length === 1 ? '' : 'es'} across {new Set(searchHits.map(h => h[0])).size} categor{new Set(searchHits.map(h => h[0])).size === 1 ? 'y' : 'ies'}.
          </p>
        )}
      </div>

      {q ? (
        searchHits.length === 0 ? (
          <div className="viz-empty">
            <p>No visualizations match "{query}".</p>
            <button type="button" className="viz-empty-clear" onClick={() => setQuery('')}>Clear search</button>
          </div>
        ) : (
          <div className="viz-result-grid">
            {searchHits.map(([cat, s, viz]) => {
              return (
                <Link key={s} to={`/visualize/${s}`} className="viz-result-card" style={{ '--card-accent': hueForCategory(cat) }}>
                  <Play size={15} />
                  <span className="viz-result-title">{viz.title}</span>
                  <span className="viz-result-cat">{CAT_BY_KEY[cat]?.label}</span>
                  {hasLive(s) && <span className="viz-live-tag"><Zap size={9} /> Live</span>}
                  <ArrowRight size={14} className="viz-result-arrow" />
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <div className="viz-cat-grid">
          {orderedCats.map((cat) => {
            const def = CAT_BY_KEY[cat];
            const members = byCat[cat];
            const liveCount = members.filter(([s]) => hasLive(s)).length;
            const Icon = def.icon;
            const hue = hueForCategory(cat);
            return (
              <Link
                key={cat}
                to={`/visualize/c/${cat}`}
                className="viz-cat-card"
                style={{ '--card-accent': hue }}
              >
                <span className="viz-cat-stripe" aria-hidden="true" />
                <span className="viz-cat-banner" aria-hidden="true">
                  <Preview kind={def.preview} accent={hue} />
                </span>
                <span className="viz-cat-head">
                  <span className="viz-cat-iconbox">{Icon && <Icon size={18} />}</span>
                  <span className="viz-cat-title">{def.label}</span>
                </span>
                <span className="viz-cat-blurb">{def.blurb}</span>
                <span className="viz-cat-tags">
                  <span className="viz-cat-tag">{members.length} viz</span>
                  {liveCount > 0 && <span className="viz-cat-tag live"><Zap size={9} /> {liveCount} interactive</span>}
                  <span className="viz-cat-cta"><ArrowRight size={14} /></span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Category / module page ─────────────────────────────────────────────────
// /visualize/c/:category — header (title + one-line blurb) plus a grid of viz
// cards, each a mini preview + title + tags, linking to the viz detail page.

function VizCategory({ category }) {
  const def = CAT_BY_KEY[category];
  const byCat = useMemo(() => buildByCat(), []);
  const members = byCat[category] || [];
  const accent = hueForCategory(category);

  if (!def) {
    return (
      <div className="learn-container viz-gallery-container">
        <div className="learn-header">
          <Link to="/visualize" className="learn-crumb">
            <ArrowLeft size={13} /> <span>Visualize</span>
            <span className="learn-crumb-sep">/</span>
            <span className="learn-crumb-here">Not found</span>
          </Link>
          <h1 className="learn-title">Not found</h1>
          <p className="learn-sub">No category matches "{category}".</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-container viz-gallery-container" style={{ '--card-accent': accent }}>
      <div className="learn-header">
        <Link to="/visualize" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Visualize</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">{def.label}</span>
        </Link>
        <h1 className="learn-title">{def.label}</h1>
        <p className="learn-sub">{def.blurb}</p>
      </div>

      {members.length === 0 ? (
        <div className="viz-empty">
          <p>No visualizations in this category yet.</p>
          <Link to="/visualize" className="viz-empty-clear">Back to all categories</Link>
        </div>
      ) : (
        <div className="viz-member-grid">
          {members.map(([s, viz]) => (
            <Link key={s} to={`/visualize/${s}`} className="viz-member-card" style={{ '--card-accent': accent }}>
              <span className="viz-member-preview">
                <ForgeThumb seed={viz.title || s} kind={thumbKindForViz(s, category)} />
              </span>
              <span className="viz-member-body">
                <span className="viz-member-title">{viz.title}</span>
                {META[s]?.blurb && <span className="viz-member-blurb">{META[s].blurb}</span>}
                <span className="viz-member-tags">
                  {hasLive(s) && <span className="viz-cat-tag live"><Sparkles size={9} /> Interactive</span>}
                  {hasEditor(s) && <span className="viz-cat-tag"><Code2 size={9} /> Editable code</span>}
                  {vizStepCount(viz) > 0 && <span className="viz-cat-tag">{vizStepCount(viz)} steps</span>}
                </span>
              </span>
              <ArrowRight size={15} className="viz-member-arrow" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
