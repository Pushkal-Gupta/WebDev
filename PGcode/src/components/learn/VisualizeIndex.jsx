import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Play, Search, X } from 'lucide-react';
import AlgoVisualizer, { ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer, NumberGridRenderer, TreeRenderer } from './AlgoVisualizer';
import { VISUALIZATIONS } from './conceptVisualizations';
import { recordLocalVisit } from '../../lib/achievements';
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
  'monotonic-stack':        { module: 'stacks-queues',    blurb: 'Strictly increasing stack of indices; each element is pushed and popped at most once.' },
  'bellman-ford-detection': { module: 'graphs',           blurb: 'Run V−1 relax passes, then one more; any further relaxation proves a negative cycle.' },
  'kahns-algorithm':        { module: 'graphs',           blurb: 'Topological sort via BFS: emit any in-degree-0 node, decrement its out-neighbours, repeat.' },
  'cuckoo-hashing':         { module: 'hashing',          blurb: 'Two tables, two hash functions. Inserts displace residents until everyone finds a home.' },
  'convex-hull-trick':      { module: 'dp',               blurb: 'Maintain the lower envelope of m·x+b lines; min queries become O(1) amortised.' },
  'merkle-tree':            { module: 'system-design',    blurb: 'Hash-pair upward to a single root; verify any block in O(log n) with a sibling-hash path.' },
  'lru-cache-design':       { module: 'hashing',          blurb: 'Hashmap for O(1) lookup, doubly-linked list for O(1) reorder; tail is the eviction victim.' },
  'consistent-hashing':     { module: 'system-design',    blurb: 'Place servers + keys on a hash ring; removing a node only reshuffles its arc of keys.' },
  'paxos-basics':           { module: 'system-design',    blurb: 'Two phases — Prepare/Promise then Accept/Accepted — over a quorum of acceptors.' },
  'circuit-breaker':        { module: 'system-design',    blurb: 'Fail-fast state machine: CLOSED counts failures, OPEN short-circuits, HALF_OPEN probes for recovery.' },
  'raft-consensus':         { module: 'system-design',    blurb: 'Leader heartbeats keep followers calm; one timeout fires, election runs, new leader takes term+1.' },
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

  useEffect(() => {
    if (slug) recordLocalVisit('viz', slug);
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

  return <VisualizeIndexList />;
}

const MODULE_LABEL = {
  'arrays-searching': 'Arrays & Searching',
  'sorting-strings': 'Sorting & Strings',
  'linked-lists': 'Linked Lists',
  'stacks-queues': 'Stacks & Queues',
  'recursion-bt': 'Recursion & Backtracking',
  'trees': 'Trees',
  'graphs': 'Graphs',
  'heaps': 'Heaps',
  'hashing': 'Hashing',
  'dp': 'Dynamic Programming',
  'greedy': 'Greedy',
  'math': 'Math',
  'bitwise': 'Bitwise',
  'system-design': 'System Design',
  'cs-core': 'CS Core',
  'foundations': 'Foundations',
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
        <h1 className="learn-title">Algorithm visualizations</h1>
        <p className="learn-sub">
          Step through canonical algorithms frame by frame. Play, pause, scrub. {totalCount} visualizations across {orderedKeys.length} groups.
        </p>
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
