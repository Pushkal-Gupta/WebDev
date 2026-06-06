import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Play, Search, X, Code2, Film, ArrowLeft } from 'lucide-react';
import AlgoVisualizer, { ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer, NumberGridRenderer, TreeRenderer } from './AlgoVisualizer';
import { VISUALIZATIONS } from './conceptVisualizations';
import { INTERACTIVE_TEMPLATES } from './interactiveTemplates';
import { recordLocalVisit } from '../../lib/achievements';
import './Learn.css';

const InteractiveVisualizer = lazy(() => import('./InteractiveVisualizer'));

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
};

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
  'bst-insertion':                  { module: 'trees',                      blurb: 'Walk left or right comparing the key; new node lands at the first null slot.' },
  'bst-inorder':                    { module: 'trees-traversal-bst',        blurb: 'Inorder walk visits BST keys in sorted order.' },
  'bubble-sort':                    { module: null,                         blurb: 'Adjacent compares + swaps. Canonical O(n²).' },
  'chinese-remainder':              { module: 'math-number-theory',         blurb: 'Stitch residues mod coprime moduli into a single residue.' },
  'circuit-breaker':                { module: 'system-design',              blurb: 'Fail-fast state machine: CLOSED counts failures, OPEN short-circuits, HALF_OPEN probes for recovery.' },
  'coin-change-variants':           { module: 'dp-classical',               blurb: 'Count ways or minimize coins via 1D DP over the amount axis.' },
  'consistent-hashing':             { module: 'system-design',              blurb: 'Place servers + keys on a hash ring; removing a node only reshuffles its arc of keys.' },
  'convex-hull-trick':              { module: 'dp',                         blurb: 'Maintain the lower envelope of m·x+b lines; min queries become O(1) amortised.' },
  'coordinate-compression':         { module: 'foundations-patterns',       blurb: 'Replace sparse coordinates with their sorted ranks.' },
  'counting-inversions':            { module: 'sorting-strings',            blurb: 'Merge-sort piggybacks on its merge step to count out-of-order pairs.' },
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
  'heap-sort':                      { module: 'heaps',                      blurb: 'Sift-down on a max-heap array, parent ↔ larger child.' },
  'heavy-light-decomposition':      { module: 'trees-advanced-queries',     blurb: 'Chain heavy edges so path queries hit at most O(log n) segments.' },
  'hopcroft-karp':                  { module: 'graphs-advanced',            blurb: 'BFS layers + DFS augmenting paths give O(E√V) bipartite matching.' },
  'huffman-coding':                 { module: 'strings-matching',           blurb: 'Greedy merge of lowest-frequency nodes builds an optimal prefix code.' },
  'insertion-sort':                 { module: null,                         blurb: 'Bubble each new element backward into the sorted prefix.' },
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
  'merge-sort':                     { module: null,                         blurb: 'The merge step: take from the smaller head of two sorted halves until both drain.' },
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
  'queue-ops':                      { module: 'stacks-queues',              blurb: 'Enqueue at the back, dequeue from the front. FIFO in motion.' },
  'quickhull':                      { module: 'math-geom-sampling',         blurb: 'Divide-and-conquer picks the farthest point off each hull edge.' },
  'quickselect':                    { module: 'sorting-strings',            blurb: 'Partition like quicksort, recurse only on the side containing the answer.' },
  'quicksort-partition':            { module: null,                         blurb: 'Lomuto partition: pivot, swap, place.' },
  'radix-tree':                     { module: 'cs-tools-encodings',         blurb: 'Compressed trie collapses single-child chains into edge labels.' },
  'raft-consensus':                 { module: 'system-design',              blurb: 'Leader heartbeats keep followers calm; one timeout fires, election runs, new leader takes term+1.' },
  'random-shuffle-fisher-yates':    { module: 'math-geom-sampling',         blurb: 'Swap each index with a random later index for a uniform permutation.' },
  'reservoir-sampling':             { module: 'math-geom-sampling',         blurb: 'Pick k uniform samples from a stream of unknown length in one pass.' },
  'segment-tree':                   { module: 'trees-advanced-queries',     blurb: 'Recursive halves answer range queries and point updates in O(log n).' },
  'segment-tree-beats':             { module: 'trees-advanced-queries',     blurb: 'Tag each node with second-max to support chmin / chmax range updates.' },
  'segment-tree-lazy':              { module: 'trees-advanced-queries',     blurb: 'Lazy propagation pushes pending range updates only when needed.' },
  'segment-tree-on-intervals':      { module: 'trees-advanced-queries',     blurb: 'Index by interval endpoints to answer overlap and stabbing queries.' },
  'segment-tree-persistent':        { module: 'trees-advanced-queries',     blurb: 'Each update clones a thin O(log n) path, preserving every version.' },
  'selection-sort':                 { module: null,                         blurb: 'Find min of remaining, swap into place. At most n−1 swaps.' },
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
  const { slug } = useParams();
  const [mode, setMode] = useState('walkthrough');

  useEffect(() => {
    if (slug) recordLocalVisit('viz', slug);
    // Default back to the walkthrough tab when navigating to a different viz.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode('walkthrough');
  }, [slug]);

  if (slug) {
    const viz = VISUALIZATIONS[slug];
    if (!viz) {
      return (
        <div className="learn-container">
          <div className="learn-header">
            <h1 className="learn-title">Not found</h1>
            <p className="learn-sub">No visualization exists for "{slug}".</p>
          </div>
          <div className="learn-breadcrumbs">
            <Link to="/visualize">All visualizations</Link>
          </div>
        </div>
      );
    }
    const meta = META[slug] || {};
    const interactiveSlug = STATIC_TO_INTERACTIVE[slug];
    const hasInteractive = Boolean(interactiveSlug && INTERACTIVE_TEMPLATES[interactiveSlug]);

    return (
      <div className="learn-container">
        <div className="learn-breadcrumbs">
          <Link to="/visualize">Visualizations</Link>
          <span>/</span>
          <span>{viz.title}</span>
        </div>
        <div className="learn-header">
          <h1 className="learn-title">{viz.title}</h1>
          {meta.blurb && <p className="learn-sub">{meta.blurb}</p>}
          {hasInteractive && (
            <div className="viz-mode-tabs" role="tablist" aria-label="Visualization mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'walkthrough'}
                className={`viz-mode-tab${mode === 'walkthrough' ? ' active' : ''}`}
                onClick={() => setMode('walkthrough')}
              >
                <Film size={13} /> Walkthrough
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'interactive'}
                className={`viz-mode-tab${mode === 'interactive' ? ' active' : ''}`}
                onClick={() => setMode('interactive')}
              >
                <Code2 size={13} /> Interactive
              </button>
            </div>
          )}
        </div>

        {mode === 'walkthrough' && (
          <AlgoVisualizer
            frames={viz.frames}
            cases={viz.cases}
            build={viz.build}
            inputSchema={viz.inputSchema}
            render={(frame) => renderForSlug(slug, frame)}
            autoPlay
          />
        )}
        {mode === 'interactive' && hasInteractive && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>Loading editor…</div>}>
            <InteractiveVisualizer slug={interactiveSlug} />
          </Suspense>
        )}

        {meta.module && (
          <p style={{ marginTop: '1.25rem', fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            See the full concept page —{' '}
            <Link to={`/learn/${meta.module}/${slug}`} style={{ color: 'var(--accent)' }}>
              /learn/{meta.module}/{slug} <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
            </Link>
          </p>
        )}
      </div>
    );
  }

  return <VisualizeIndexList />;
}

const MODULE_LABEL = {
  'arrays-searching': 'Arrays & Searching',
  'arrays-binary-search': 'Binary Search',
  'arrays-counting-select': 'Counting & Selection',
  'arrays-pointers-windows': 'Two Pointers & Sliding Window',
  'arrays-range-structures': 'Range Structures',
  'bitwise': 'Bitwise',
  'cs-core': 'CS Core',
  'cs-db-transactions': 'Databases & Transactions',
  'cs-network-protocols': 'Network Protocols',
  'cs-os-concurrency': 'OS & Concurrency',
  'cs-tools-encodings': 'Tools & Encodings',
  'dp': 'Dynamic Programming',
  'dp-advanced': 'Dynamic Programming — Advanced',
  'dp-classical': 'Dynamic Programming — Classical',
  'foundations': 'Foundations',
  'foundations-analysis': 'Foundations — Analysis',
  'foundations-patterns': 'Foundations — Patterns',
  'graphs': 'Graphs',
  'graphs-advanced': 'Graphs — Advanced',
  'graphs-flow-grids': 'Graphs — Flow & Grids',
  'graphs-mst': 'Graphs — MST',
  'graphs-shortest-paths': 'Graphs — Shortest Paths',
  'graphs-traversal': 'Graphs — Traversal',
  'graphs-union-find': 'Graphs — Union-Find',
  'greedy': 'Greedy',
  'hashing': 'Hashing',
  'heaps': 'Heaps',
  'linked-lists': 'Linked Lists',
  'math': 'Math',
  'math-geom-sampling': 'Math — Geometry & Sampling',
  'math-number-theory': 'Math — Number Theory',
  'recursion-bt': 'Recursion & Backtracking',
  'sorting-strings': 'Sorting & Strings',
  'stacks-queues': 'Stacks & Queues',
  'strings-advanced': 'Strings — Advanced',
  'strings-matching': 'Strings — Pattern Matching',
  'system-design': 'System Design',
  'trees': 'Trees',
  'trees-advanced-queries': 'Trees — Advanced Queries',
  'trees-balanced-disk': 'Balanced & Disk-backed Trees',
  'trees-traversal-bst': 'Trees & BST',
  other: 'Other',
};

const HUE_TOKENS = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

function VisualizeIndexList() {
  const [query, setQuery] = useState('');
  const [activeMod, setActiveMod] = useState(null);
  const containerRef = useRef(null);

  const { groups, orderedKeys, totalCount } = useMemo(() => {
    const entries = Object.entries(VISUALIZATIONS);
    const g = {};
    for (const [s, viz] of entries) {
      const mod = META[s]?.module || 'other';
      if (!g[mod]) g[mod] = [];
      g[mod].push([s, viz]);
    }
    const keys = Object.keys(MODULE_LABEL).filter(k => g[k]?.length);
    return { groups: g, orderedKeys: keys, totalCount: entries.length };
  }, []);

  const q = query.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!q) return groups;
    const out = {};
    for (const mod of orderedKeys) {
      const matches = groups[mod].filter(([s, viz]) => {
        const blurb = (META[s]?.blurb || '').toLowerCase();
        const title = (viz.title || '').toLowerCase();
        return title.includes(q) || blurb.includes(q) || s.includes(q);
      });
      if (matches.length) out[mod] = matches;
    }
    return out;
  }, [q, groups, orderedKeys]);

  const visibleKeys = useMemo(
    () => orderedKeys.filter(k => filteredGroups[k]?.length),
    [orderedKeys, filteredGroups],
  );
  const filteredTotal = visibleKeys.reduce((n, k) => n + filteredGroups[k].length, 0);
  const visibleKey = visibleKeys.join('|');

  const currentActive = activeMod && visibleKeys.includes(activeMod) ? activeMod : visibleKeys[0] || null;

  useEffect(() => {
    if (!visibleKeys.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveMod(visible[0].target.dataset.mod);
      },
      {
        root: containerRef.current || null,
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0, 0.1, 0.5, 1],
      },
    );
    visibleKeys.forEach(k => {
      const el = document.getElementById(`viz-group-${k}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey]);

  const handleJump = (mod) => (e) => {
    e.preventDefault();
    const el = document.getElementById(`viz-group-${mod}`);
    if (!el) return;
    const scroller = containerRef.current;
    if (scroller) {
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12;
      scroller.scrollTo({ top, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveMod(mod);
  };

  return (
    <div className="learn-container viz-index-container" ref={containerRef}>
      <div className="learn-header">
        <Link to="/learning" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Learning</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">Visualize</span>
        </Link>
        <h1 className="learn-title">Visualize</h1>
        <p className="learn-sub">Step through algorithms frame by frame.</p>
        <div className="viz-search">
          <Search size={14} className="viz-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or description…"
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
            {filteredTotal} match{filteredTotal === 1 ? '' : 'es'} across {visibleKeys.length} group{visibleKeys.length === 1 ? '' : 's'}.
          </p>
        )}
      </div>

      <nav className="viz-chip-bar" aria-label="Jump to group">
        {visibleKeys.map((mod, i) => (
          <button
            key={mod}
            type="button"
            onClick={handleJump(mod)}
            className={`viz-chip${currentActive === mod ? ' active' : ''}`}
            style={{ '--chip-accent': HUE_TOKENS[i % HUE_TOKENS.length] }}
          >
            <span className="viz-chip-dot" aria-hidden="true" />
            <span className="viz-chip-label">{MODULE_LABEL[mod]}</span>
            <span className="viz-chip-count">{filteredGroups[mod].length}</span>
          </button>
        ))}
      </nav>

      <div className="viz-index-layout">
        <aside className="viz-side" aria-label="Groups">
          <nav className="viz-side-nav">
            <h3 className="viz-side-title">Groups</h3>
            <ul className="viz-side-list">
              {visibleKeys.map((mod, i) => (
                <li key={mod}>
                  <a
                    href={`#viz-group-${mod}`}
                    onClick={handleJump(mod)}
                    className={`viz-side-link${currentActive === mod ? ' active' : ''}`}
                    style={{ '--side-accent': HUE_TOKENS[i % HUE_TOKENS.length] }}
                  >
                    <span className="viz-side-rail" aria-hidden="true" />
                    <span className="viz-side-label">{MODULE_LABEL[mod]}</span>
                    <span className="viz-side-count">{filteredGroups[mod].length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="viz-index-main">
          {visibleKeys.length === 0 && (
            <div className="viz-empty">
              <p>No visualizations match "{query}".</p>
              <button type="button" className="viz-empty-clear" onClick={() => setQuery('')}>Clear search</button>
            </div>
          )}
          {visibleKeys.map((mod, i) => (
            <section
              key={mod}
              id={`viz-group-${mod}`}
              data-mod={mod}
              className="learn-group viz-group"
              style={{ '--group-accent': HUE_TOKENS[i % HUE_TOKENS.length] }}
            >
              <h2 className="learn-group-title viz-group-title">
                <span className="viz-group-dot" aria-hidden="true" />
                {MODULE_LABEL[mod]}
                <span className="learn-group-count">({filteredGroups[mod].length})</span>
              </h2>
              <div className="learn-module-grid">
                {filteredGroups[mod].map(([s, viz]) => {
                  const meta = META[s] || {};
                  const hasInteractive = Boolean(STATIC_TO_INTERACTIVE[s] && INTERACTIVE_TEMPLATES[STATIC_TO_INTERACTIVE[s]]);
                  return (
                    <Link
                      key={s}
                      to={`/visualize/${s}`}
                      className="learn-module-card viz-card"
                      style={{ '--card-accent': HUE_TOKENS[i % HUE_TOKENS.length] }}
                    >
                      <div className="learn-module-card-head">
                        <Play size={16} />
                        <span className="learn-module-card-title">{viz.title}</span>
                        {hasInteractive && (
                          <span
                            title="Has Interactive mode — edit the code and re-run"
                            style={{
                              marginLeft: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontFamily: 'var(--mono)',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.42rem',
                              borderRadius: '4px',
                              background: 'rgba(var(--accent-rgb), 0.12)',
                              color: 'var(--accent)',
                              border: '1px solid rgba(var(--accent-rgb), 0.35)',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                            }}
                          >
                            <Code2 size={10} /> Live
                          </span>
                        )}
                      </div>
                      <p className="learn-module-card-desc">{meta.blurb || `${vizStepCount(viz)} steps.`}</p>
                      <div className="learn-module-card-foot">
                        <span className="learn-module-count">{vizStepCount(viz)} steps</span>
                        <ArrowRight size={14} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
