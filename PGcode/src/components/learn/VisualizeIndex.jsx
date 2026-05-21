import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import AlgoVisualizer, { ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer, NumberGridRenderer, TreeRenderer } from './AlgoVisualizer';
import { VISUALIZATIONS } from './conceptVisualizations';
import './Learn.css';

const META = {
  'binary-search':         { module: 'arrays-searching', blurb: 'Halve the search space at every step.' },
  'bfs-dfs':               { module: 'trees',            blurb: 'Breadth-first traversal frontier expansion.' },
  'sliding-window':        { module: 'arrays-searching', blurb: 'Longest substring without repeating chars.' },
  'two-pointers':          { module: 'arrays-searching', blurb: 'Pair sum on a sorted array, O(n).' },
  'kadanes-algorithm':     { module: 'dp',               blurb: 'Maximum subarray sum, single linear pass.' },
  'loop-detection':        { module: 'linked-lists',     blurb: "Floyd's tortoise-and-hare cycle detection." },
  'sieve-of-eratosthenes': { module: 'math',             blurb: 'All primes up to N by crossing out multiples.' },
  'quicksort-partition':   { module: null,               blurb: 'Lomuto partition: pivot, swap, place.' },
  'bubble-sort':           { module: null,               blurb: 'Adjacent compares + swaps. Canonical O(n²).' },
  'insertion-sort':        { module: null,               blurb: 'Bubble each new element backward into the sorted prefix.' },
  'heap-sort':             { module: 'heaps',            blurb: 'Sift-down on a max-heap array, parent ↔ larger child.' },
  'dijkstras-algorithm':   { module: 'graphs',           blurb: 'Shortest paths from source with relaxation, distance labels live.' },
  'selection-sort':        { module: null,               blurb: 'Find min of remaining, swap into place. At most n−1 swaps.' },
  'bst-insertion':         { module: 'trees',            blurb: 'Walk left or right comparing the key; new node lands at the first null slot.' },
  'merge-sort':            { module: null,               blurb: 'The merge step: take from the smaller head of two sorted halves until both drain.' },
  'fibonacci-recursion':   { module: null,               blurb: 'See the exponential call tree of naive fib — and why memoization collapses it.' },
  'linear-vs-binary':      { module: 'arrays-searching', blurb: 'Side-by-side: linear scan vs binary halving on the same sorted array.' },
  'stack-ops':             { module: 'stacks-queues',    blurb: 'Push, pop, peek — LIFO semantics in motion.' },
  'queue-ops':             { module: 'stacks-queues',    blurb: 'Enqueue at the back, dequeue from the front. FIFO in motion.' },
  'dfs-traversal':         { module: 'graphs',           blurb: 'Stack-based DFS expansion with spanning-tree edges highlighted.' },
  'union-find':            { module: 'graphs',           blurb: 'Disjoint-set forest with path compression. Depth bars shrink as queries flatten the trees.' },
  'zero-one-knapsack':     { module: 'dp',               blurb: 'Fill the n×W table row by row; final cell is the optimal value.' },
  'topological-sort':      { module: 'graphs',           blurb: "Kahn's algorithm: repeatedly remove 0-in-degree nodes." },
  'sliding-window-max':    { module: 'arrays-searching', blurb: 'Monotonic-decreasing deque keeps the window max at the front in O(n).' },
  'longest-common-subseq': { module: 'dp',               blurb: 'Match → diagonal+1, mismatch → max(up, left). Classic 2D DP.' },
  'prefix-sum':            { module: 'arrays-searching', blurb: 'O(n) preprocessing for O(1) range-sum queries.' },
  'quickselect':           { module: 'sorting-strings',  blurb: 'Partition like quicksort, recurse only on the side containing the answer.' },
  'trie-insert':           { module: null,               blurb: 'Insert characters one by one; share prefixes; mark word ends.' },
  'hash-collision':        { module: null,               blurb: 'Bars = bucket length. Watch collisions cluster, then notice when resizing would kick in.' },
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
        </div>
        <AlgoVisualizer
          frames={viz.frames}
          cases={viz.cases}
          build={viz.build}
          inputSchema={viz.inputSchema}
          render={(frame) => renderForSlug(slug, frame)}
          autoPlay
        />
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

  const entries = Object.entries(VISUALIZATIONS);
  return (
    <div className="learn-container">
      <div className="learn-header">
        <h1 className="learn-title">Algorithm visualizations</h1>
        <p className="learn-sub">Step through canonical algorithms frame by frame. Play, pause, scrub.</p>
      </div>
      <div className="learn-module-grid">
        {entries.map(([s, viz]) => {
          const meta = META[s] || {};
          return (
            <Link key={s} to={`/visualize/${s}`} className="learn-module-card">
              <div className="learn-module-card-head">
                <Play size={16} />
                <span className="learn-module-card-title">{viz.title}</span>
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
    </div>
  );
}
