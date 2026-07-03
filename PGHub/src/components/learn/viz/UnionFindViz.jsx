import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GitMerge, Search, RotateCcw, Play, Pause, SkipForward } from 'lucide-react';
import './UnionFindViz.css';

const N = 10;
const SVG_W = 720;
const SVG_H = 360;
const NODE_R = 18;
const ROW_X_PAD = 50;
const BOTTOM_Y = SVG_H - 40;
const LEVEL_STEP = 70;
const STEP_MS = 850;

function makeInitialState() {
  return {
    parent: Array.from({ length: N }, (_, i) => i),
    rank: Array(N).fill(0),
  };
}

function cloneState(s) {
  return { parent: [...s.parent], rank: [...s.rank] };
}

function findRootRaw(parent, x) {
  let cur = x;
  const path = [cur];
  while (parent[cur] !== cur) {
    cur = parent[cur];
    path.push(cur);
  }
  return { root: cur, path };
}

function componentsCount(parent) {
  let c = 0;
  for (let i = 0; i < parent.length; i++) {
    if (parent[i] === i) c += 1;
  }
  return c;
}

function buildFindFrames(stateIn, x) {
  const frames = [];
  const startState = cloneState(stateIn);
  const { root, path } = findRootRaw(startState.parent, x);

  frames.push({
    kind: 'find-start',
    state: cloneState(startState),
    highlight: new Set([x]),
    pathEdges: new Set(),
    activePath: [x],
    op: { type: 'find', a: x },
    caption: `Find(${x}): start at node ${x} and walk parent pointers until we reach a root.`,
  });

  // Walk frames: highlight each step along the path
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    const edgeSet = new Set();
    for (let j = 1; j <= i; j++) {
      edgeSet.add(`${path[j - 1]}->${path[j]}`);
    }
    frames.push({
      kind: 'find-walk',
      state: cloneState(startState),
      highlight: new Set([to]),
      pathEdges: edgeSet,
      activePath: path.slice(0, i + 1),
      op: { type: 'find', a: x },
      caption:
        to === root
          ? `Reached root ${root}. The chain from ${x} to ${root} is the path we will compress.`
          : `Walk to parent: ${from} -> ${to}. Keep climbing.`,
    });
  }

  // Compression: re-point every non-root node on the path to root
  const needCompress = path.filter((n) => startState.parent[n] !== root);
  if (needCompress.length > 0) {
    const compressed = cloneState(startState);
    needCompress.forEach((n) => { compressed.parent[n] = root; });
    const compEdges = new Set(needCompress.map((n) => `${n}->${root}`));
    frames.push({
      kind: 'find-compress',
      state: compressed,
      highlight: new Set([...needCompress, root]),
      pathEdges: compEdges,
      activePath: path,
      op: { type: 'find', a: x },
      caption: `Path compression: point ${needCompress.join(', ')} directly to root ${root}. Future finds are O(1).`,
    });
  }

  const finalState = needCompress.length > 0
    ? (() => {
        const s = cloneState(startState);
        needCompress.forEach((n) => { s.parent[n] = root; });
        return s;
      })()
    : startState;

  frames.push({
    kind: 'find-done',
    state: finalState,
    highlight: new Set([root]),
    pathEdges: new Set(),
    activePath: [root],
    op: { type: 'find', a: x },
    caption: `Find(${x}) = ${root}.`,
  });

  return { frames, root };
}

function buildUnionFrames(stateIn, a, b) {
  const frames = [];
  const startState = cloneState(stateIn);

  if (a === b) {
    frames.push({
      kind: 'union-noop',
      state: cloneState(startState),
      highlight: new Set([a]),
      pathEdges: new Set(),
      activePath: [a],
      op: { type: 'union', a, b },
      caption: `Union(${a}, ${b}): same node — nothing to do.`,
    });
    return { frames, merged: false };
  }

  // Phase 1: find root of a (with compression)
  const findA = buildFindFrames(startState, a);
  findA.frames.forEach((f) => {
    frames.push({ ...f, op: { type: 'union', a, b, phase: `find ${a}` } });
  });
  const stateAfterA = cloneState(findA.frames[findA.frames.length - 1].state);
  const rootA = findA.root;

  // Phase 2: find root of b (with compression on the post-A state)
  const findB = buildFindFrames(stateAfterA, b);
  findB.frames.forEach((f) => {
    frames.push({ ...f, op: { type: 'union', a, b, phase: `find ${b}` } });
  });
  const stateAfterB = cloneState(findB.frames[findB.frames.length - 1].state);
  const rootB = findB.root;

  if (rootA === rootB) {
    frames.push({
      kind: 'union-same',
      state: cloneState(stateAfterB),
      highlight: new Set([rootA]),
      pathEdges: new Set(),
      activePath: [rootA],
      op: { type: 'union', a, b },
      caption: `${a} and ${b} already share root ${rootA}. No merge needed.`,
    });
    return { frames, merged: false };
  }

  // Compare ranks: highlight both subtree roots
  frames.push({
    kind: 'union-compare',
    state: cloneState(stateAfterB),
    highlight: new Set([rootA, rootB]),
    pathEdges: new Set(),
    activePath: [rootA, rootB],
    op: { type: 'union', a, b },
    caption: `Compare ranks: rank[${rootA}] = ${stateAfterB.rank[rootA]}, rank[${rootB}] = ${stateAfterB.rank[rootB]}. Smaller rank becomes child.`,
  });

  // Union by rank
  const next = cloneState(stateAfterB);
  let child, root;
  if (next.rank[rootA] < next.rank[rootB]) {
    next.parent[rootA] = rootB;
    child = rootA;
    root = rootB;
  } else if (next.rank[rootA] > next.rank[rootB]) {
    next.parent[rootB] = rootA;
    child = rootB;
    root = rootA;
  } else {
    next.parent[rootB] = rootA;
    next.rank[rootA] += 1;
    child = rootB;
    root = rootA;
  }

  frames.push({
    kind: 'union-link',
    state: next,
    highlight: new Set([child, root]),
    pathEdges: new Set([`${child}->${root}`]),
    activePath: [child, root],
    op: { type: 'union', a, b },
    caption: `Link ${child} under ${root}. rank[${root}] = ${next.rank[root]}.`,
  });

  return { frames, merged: true };
}

// Layout: nodes are drawn as forest trees with roots spread horizontally.
function computeLayout(parent) {
  // Group nodes by root
  const children = Array.from({ length: N }, () => []);
  const roots = [];
  for (let i = 0; i < N; i++) {
    if (parent[i] === i) roots.push(i);
    else children[parent[i]].push(i);
  }

  // Compute subtree size and depth for each tree
  const sizes = Array(N).fill(0);
  const depths = Array(N).fill(0);
  function dfs(u) {
    let size = 1;
    let depth = 0;
    for (const c of children[u]) {
      const s = dfs(c);
      size += s.size;
      if (s.depth + 1 > depth) depth = s.depth + 1;
    }
    sizes[u] = size;
    depths[u] = depth;
    return { size, depth };
  }
  roots.forEach((r) => dfs(r));

  // Sort roots so display is stable (by root index)
  roots.sort((a, b) => a - b);

  // Allocate horizontal slots per root proportional to subtree size
  const totalLeaves = roots.reduce((acc, r) => acc + Math.max(sizes[r], 1), 0);
  const usableW = SVG_W - ROW_X_PAD * 2;
  const slotPerLeaf = usableW / totalLeaves;

  const pos = Array(N).fill(null);
  let cursor = ROW_X_PAD;

  function place(u, depthFromRoot, leftX, slotWidth, treeMaxDepth) {
    // Recursively position children first to compute center
    const kids = children[u];
    const y = BOTTOM_Y - (treeMaxDepth - depthFromRoot) * LEVEL_STEP;
    if (kids.length === 0) {
      pos[u] = { x: leftX + slotWidth / 2, y };
      return;
    }
    let curX = leftX;
    let xs = [];
    for (const c of kids) {
      const w = Math.max(sizes[c], 1) * slotPerLeaf;
      place(c, depthFromRoot + 1, curX, w, treeMaxDepth);
      xs.push(pos[c].x);
      curX += w;
    }
    // Center parent above children
    const center = (Math.min(...xs) + Math.max(...xs)) / 2;
    pos[u] = { x: center, y };
  }

  roots.forEach((r) => {
    const w = Math.max(sizes[r], 1) * slotPerLeaf;
    place(r, 0, cursor, w, depths[r]);
    cursor += w;
  });

  // Fallback for any unplaced (shouldn't happen but safe)
  for (let i = 0; i < N; i++) {
    if (!pos[i]) pos[i] = { x: ROW_X_PAD + (i + 0.5) * (usableW / N), y: BOTTOM_Y };
  }
  return pos;
}

export default function UnionFindViz() {
  const [committedState, setCommittedState] = useState(makeInitialState);
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [log, setLog] = useState([]);
  const [unionA, setUnionA] = useState('0');
  const [unionB, setUnionB] = useState('1');
  const [findVal, setFindVal] = useState('0');
  const [, setPendingCommit] = useState(null);
  const timerRef = useRef(null);

  const currentFrame = frames.length > 0 ? frames[idx] : null;
  const displayState = currentFrame ? currentFrame.state : committedState;

  const positions = useMemo(() => computeLayout(displayState.parent), [displayState]);

  const components = useMemo(() => componentsCount(displayState.parent), [displayState]);

  const atEnd = frames.length === 0 || idx >= frames.length - 1;

  // Derive `playing` so the interval effect never has to call setPlaying(false)
  // when we reach the last frame — avoids cascading-render lint.
  const playing = playingRaw && frames.length > 0 && idx < frames.length - 1;
  const delay = Math.round(STEP_MS / speed);

  const commitPending = useCallback(() => {
    setPendingCommit((current) => {
      if (current !== null && frames.length > 0) {
        const final = frames[frames.length - 1].state;
        setCommittedState({ parent: [...final.parent], rank: [...final.rank] });
      }
      return null;
    });
  }, [frames]);

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= frames.length - 1) return i;
      const nextIdx = i + 1;
      if (nextIdx === frames.length - 1) commitPending();
      return nextIdx;
    });
  }, [frames.length, commitPending]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      next();
    }, delay);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next, delay]);

  const pushLog = (line) => {
    setLog((prev) => {
      const nextLog = [...prev, line];
      return nextLog.length > 5 ? nextLog.slice(nextLog.length - 5) : nextLog;
    });
  };

  const parseN = (raw) => {
    const v = Number.parseInt(raw, 10);
    if (Number.isNaN(v) || v < 0 || v >= N) return null;
    return v;
  };

  const handleUnion = () => {
    const a = parseN(unionA);
    const b = parseN(unionB);
    if (a === null || b === null) {
      pushLog(`union: invalid input (need 0..${N - 1}).`);
      return;
    }
    const built = buildUnionFrames(committedState, a, b);
    if (built.frames.length === 0) return;
    setPendingCommit('union');
    setFrames(built.frames);
    setIdx(0);
    setPlaying(true);
    pushLog(built.merged ? `union(${a}, ${b}) -> merged` : `union(${a}, ${b}) -> same set`);
    if (built.frames.length === 1) {
      const final = built.frames[0].state;
      setCommittedState({ parent: [...final.parent], rank: [...final.rank] });
      setPendingCommit(null);
    }
  };

  const handleFind = () => {
    const a = parseN(findVal);
    if (a === null) {
      pushLog(`find: invalid input (need 0..${N - 1}).`);
      return;
    }
    const built = buildFindFrames(committedState, a);
    setPendingCommit('find');
    setFrames(built.frames);
    setIdx(0);
    setPlaying(true);
    pushLog(`find(${a}) = ${built.root}`);
    if (built.frames.length === 1) {
      const final = built.frames[0].state;
      setCommittedState({ parent: [...final.parent], rank: [...final.rank] });
      setPendingCommit(null);
    }
  };

  const handleReset = () => {
    setPlaying(false);
    setFrames([]);
    setIdx(0);
    setCommittedState(makeInitialState());
    setLog([]);
    setPendingCommit(null);
  };

  // Build edge list for rendering: each non-root node has an edge child -> parent.
  const edges = useMemo(() => {
    const list = [];
    for (let i = 0; i < N; i++) {
      const p = displayState.parent[i];
      if (p !== i) list.push({ from: i, to: p, key: `${i}->${p}` });
    }
    return list;
  }, [displayState]);

  const activeEdgeSet = currentFrame ? currentFrame.pathEdges : new Set();
  const highlightSet = currentFrame ? currentFrame.highlight : new Set();
  const isRoot = (i) => displayState.parent[i] === i;

  const opLabel = (() => {
    if (!currentFrame) return null;
    const op = currentFrame.op;
    if (!op) return null;
    if (op.type === 'find') return `Find(${op.a})`;
    if (op.type === 'union') return op.phase ? `Union(${op.a}, ${op.b}) — ${op.phase}` : `Union(${op.a}, ${op.b})`;
    return null;
  })();

  // Stable list of node ids for the bottom roster (always 0..9).
  const allIds = Array.from({ length: N }, (_, i) => i);

  return (
    <div className="ufviz">
      <div className="ufviz-header">
        <div className="ufviz-title">Union-Find with path compression &amp; union by rank</div>
        <div className="ufviz-stats">
          <span className="ufviz-stat-label">Components</span>
          <span className="ufviz-stat-value">{components}</span>
        </div>
      </div>

      <div className="ufviz-ops">
        <div className="ufviz-op">
          <span className="ufviz-op-label">Union</span>
          <input
            className="ufviz-input"
            type="number"
            min="0"
            max={N - 1}
            value={unionA}
            onChange={(e) => setUnionA(e.target.value)}
            aria-label="Union first argument"
          />
          <input
            className="ufviz-input"
            type="number"
            min="0"
            max={N - 1}
            value={unionB}
            onChange={(e) => setUnionB(e.target.value)}
            aria-label="Union second argument"
          />
          <button
            type="button"
            className="ufviz-btn ufviz-btn-primary"
            onClick={handleUnion}
            disabled={playing}
          >
            <GitMerge size={14} />
            <span>Union</span>
          </button>
        </div>

        <div className="ufviz-op">
          <span className="ufviz-op-label">Find</span>
          <input
            className="ufviz-input"
            type="number"
            min="0"
            max={N - 1}
            value={findVal}
            onChange={(e) => setFindVal(e.target.value)}
            aria-label="Find argument"
          />
          <button
            type="button"
            className="ufviz-btn ufviz-btn-secondary"
            onClick={handleFind}
            disabled={playing}
          >
            <Search size={14} />
            <span>Find</span>
          </button>
        </div>

        <button
          type="button"
          className="ufviz-btn ufviz-btn-ghost"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="ufviz-body">
        <div className="ufviz-stage">
          <svg
            className="ufviz-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            role="img"
            aria-label="Union-Find forest visualization"
          >
            <defs>
              <marker
                id="ufviz-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className="ufviz-arrow-head" />
              </marker>
              <marker
                id="ufviz-arrow-active"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className="ufviz-arrow-head-active" />
              </marker>
            </defs>

            {/* Group separator hint: faint baseline */}
            <line
              className="ufviz-baseline"
              x1={ROW_X_PAD - 10}
              y1={BOTTOM_Y + 28}
              x2={SVG_W - ROW_X_PAD + 10}
              y2={BOTTOM_Y + 28}
            />

            <g className="ufviz-edges">
              {edges.map((e) => {
                const a = positions[e.from];
                const b = positions[e.to];
                if (!a || !b) return null;
                // Shorten so the arrow tip sits at the parent node's border.
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const len = Math.max(Math.hypot(dx, dy), 1);
                const ux = dx / len;
                const uy = dy / len;
                const x1 = a.x + ux * NODE_R;
                const y1 = a.y + uy * NODE_R;
                const x2 = b.x - ux * NODE_R;
                const y2 = b.y - uy * NODE_R;
                const active = activeEdgeSet.has(e.key);
                return (
                  <line
                    key={e.key}
                    className={`ufviz-edge ${active ? 'ufviz-edge-active' : ''}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    markerEnd={active ? 'url(#ufviz-arrow-active)' : 'url(#ufviz-arrow)'}
                  />
                );
              })}
            </g>

            <g className="ufviz-nodes">
              {allIds.map((id) => {
                const p = positions[id];
                if (!p) return null;
                const hi = highlightSet.has(id);
                const root = isRoot(id);
                return (
                  <g
                    key={id}
                    className={`ufviz-node ${root ? 'ufviz-node-root' : ''} ${hi ? 'ufviz-node-hi' : ''}`}
                    transform={`translate(${p.x}, ${p.y})`}
                  >
                    {hi && <circle className="ufviz-node-ring" r={NODE_R + 6} />}
                    <circle className="ufviz-node-circle" r={NODE_R} />
                    <text
                      className="ufviz-node-text"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {id}
                    </text>
                    {root && (
                      <text
                        className="ufviz-rank-tag"
                        x="0"
                        y={NODE_R + 14}
                        textAnchor="middle"
                      >
                        r{displayState.rank[id]}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="ufviz-sidebar">
          <div className="ufviz-panel">
            <div className="ufviz-panel-label">Now</div>
            <div className="ufviz-panel-value">{opLabel || 'idle'}</div>
          </div>
          <div className="ufviz-panel">
            <div className="ufviz-panel-label">Step</div>
            <div className="ufviz-panel-value">
              {frames.length === 0 ? '—' : `${idx + 1} / ${frames.length}`}
            </div>
          </div>
          <div className="ufviz-panel ufviz-panel-log">
            <div className="ufviz-panel-label">Log (last 5)</div>
            <ul className="ufviz-log">
              {log.length === 0 ? (
                <li className="ufviz-log-empty">no operations yet</li>
              ) : (
                log.slice().reverse().map((line, i) => (
                  <li key={`${line}-${log.length - i}`} className="ufviz-log-line">
                    {line}
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>

      <p className="ufviz-caption">
        {currentFrame
          ? currentFrame.caption
          : 'Each element starts as its own component. Run Union or Find to watch the forest evolve.'}
      </p>

      <div className="ufviz-controls">
        <button
          type="button"
          className="ufviz-btn ufviz-btn-ghost"
          onClick={() => {
            if (frames.length === 0) return;
            setPlaying(false);
            setIdx(0);
          }}
          disabled={frames.length === 0}
        >
          <RotateCcw size={14} />
          <span>Restart op</span>
        </button>
        <button
          type="button"
          className="ufviz-btn ufviz-btn-primary"
          onClick={() => {
            if (frames.length === 0) return;
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
          disabled={frames.length === 0}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="ufviz-btn ufviz-btn-ghost"
          onClick={next}
          disabled={frames.length === 0 || atEnd}
        >
          <SkipForward size={14} />
          <span>Step</span>
        </button>
        <label className="ufviz-speed">
          <span className="ufviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ufviz-speed-range"
          />
          <span className="ufviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>
    </div>
  );
}
