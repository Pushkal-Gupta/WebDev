import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { Play, Pause, StepForward, RotateCcw, Share2, Network } from 'lucide-react';
import './DmGraphTheoryViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// Deterministic circular layout for n vertices inside a viewBox of VBW x VBH.
const VBW = 520;
const VBH = 360;
const CX = 250;
const CY = 180;
const R = 132;

function circleLayout(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    // start at top, go clockwise; angle is fully deterministic
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    pts.push({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) });
  }
  return pts;
}

// Two-row layout for bipartite so the split reads visually.
function biLayout(left, right) {
  const pts = [];
  const topY = 78;
  const botY = 282;
  left.forEach((_, i) => {
    const x = 110 + (i * 280) / Math.max(1, left.length - 1);
    pts[left[i]] = { x, y: topY };
  });
  right.forEach((_, i) => {
    const x = 110 + (i * 280) / Math.max(1, right.length - 1);
    pts[right[i]] = { x, y: botY };
  });
  return pts;
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const PRESETS = {
  cycle: {
    name: 'Cycle C6',
    n: 6,
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
    layout: (n) => circleLayout(n),
  },
  bipartite: {
    name: 'Bipartite',
    n: 6,
    edges: [[0, 3], [0, 4], [1, 4], [1, 5], [2, 3], [2, 5]],
    layout: () => biLayout([0, 1, 2], [3, 4, 5]),
  },
  tree: {
    name: 'Tree',
    n: 7,
    edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]],
    layout: () => [
      { x: 250, y: 60 },
      { x: 150, y: 165 },
      { x: 350, y: 165 },
      { x: 90, y: 290 },
      { x: 210, y: 290 },
      { x: 290, y: 290 },
      { x: 410, y: 290 },
    ],
  },
  complete: {
    name: 'K4 complete',
    n: 4,
    edges: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
    layout: () => [
      { x: 250, y: 62 },
      { x: 120, y: 200 },
      { x: 380, y: 200 },
      { x: 250, y: 300 },
    ],
  },
  path: {
    name: 'Path P6',
    n: 6,
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    layout: (n) => {
      const pts = [];
      for (let i = 0; i < n; i++) {
        pts.push({ x: 70 + (i * 380) / (n - 1), y: 180 });
      }
      return pts;
    },
  },
};

function buildAdj(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    if (u !== v) adj[v].push(u);
  }
  return adj;
}

// Precompute the full BFS 2-coloring trace across all components.
function computeTrace(n, edges) {
  const adj = buildAdj(n, edges);
  const color = new Array(n).fill(-1);
  const steps = [];
  let conflictEdge = null;
  let bipartite = true;

  for (let start = 0; start < n && bipartite; start++) {
    if (color[start] !== -1) continue;
    color[start] = 0;
    steps.push({ colors: color.slice(), active: start, note: `color ${LABELS[start]} = 0 (new component)` });
    const q = [start];
    while (q.length && bipartite) {
      const u = q.shift();
      for (const w of adj[u]) {
        if (color[w] === -1) {
          color[w] = color[u] ^ 1;
          steps.push({
            colors: color.slice(),
            active: w,
            edge: [u, w],
            note: `${LABELS[u]} -> ${LABELS[w]}: color ${color[w]}`,
          });
          q.push(w);
        } else if (color[w] === color[u]) {
          conflictEdge = [u, w];
          bipartite = false;
          steps.push({
            colors: color.slice(),
            active: w,
            edge: [u, w],
            conflict: [u, w],
            note: `${LABELS[u]} and ${LABELS[w]} share color -> odd cycle`,
          });
          break;
        }
      }
    }
  }
  steps.push({
    colors: color.slice(),
    active: -1,
    note: bipartite ? 'no conflicts: bipartite (2-colorable)' : 'conflict found: not bipartite',
    done: true,
  });
  return { steps, bipartite, conflictEdge };
}

export default function DmGraphTheoryViz() {
  const [presetKey, setPresetKey] = useState('cycle');
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const preset = PRESETS[presetKey];

  const positions = useMemo(() => preset.layout(preset.n), [preset]);

  const adj = useMemo(() => buildAdj(preset.n, preset.edges), [preset]);
  const degrees = useMemo(() => adj.map((lst) => lst.length), [adj]);
  const degreeSum = degrees.reduce((a, b) => a + b, 0);
  const edgeCount = preset.edges.length;

  const trace = useMemo(() => computeTrace(preset.n, preset.edges), [preset]);
  const steps = trace.steps;
  const maxStep = steps.length - 1;
  const current = steps[Math.min(stepIdx, maxStep)];
  const atEnd = stepIdx >= maxStep;

  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resetSteps = useCallback(() => {
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const selectPreset = useCallback((key) => {
    setPresetKey(key);
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const stepForward = useCallback(() => {
    setStepIdx((i) => Math.min(i + 1, maxStep));
  }, [maxStep]);

  // autoplay
  useEffect(() => {
    if (!playing || atEnd) return undefined;
    const delay = reduced ? 700 : Math.max(220, 900 / speed);
    timer.current = setTimeout(() => {
      setStepIdx((i) => {
        const next = Math.min(i + 1, maxStep);
        if (next >= maxStep) setPlaying(false);
        return next;
      });
    }, delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [playing, stepIdx, atEnd, speed, maxStep, reduced]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const colors = current.colors;
  const activeEdge = current.edge || null;
  const conflictEdge = current.conflict || null;

  const colorClass = (c) => (c === 0 ? 'dmgt-c0' : c === 1 ? 'dmgt-c1' : 'dmgt-cx');

  const handshakeTex = `\\sum_{v}\\deg(v)=${degreeSum}=2\\lvert E\\rvert=2\\times ${edgeCount}`;
  const isTree = !hasCycle(preset.n, preset.edges) && isConnected(preset.n, adj) ;
  const treeTex = `\\lvert E\\rvert=${edgeCount}${isTree ? `=\\lvert V\\rvert-1=${preset.n - 1}` : ''}`;

  return (
    <div className="dmgt">
      <div className="dmgt-head">
        <div className="dmgt-head-icon"><Network size={18} /></div>
        <div className="dmgt-head-text">
          <h3 className="dmgt-title">Graphs, degrees &amp; 2-coloring</h3>
          <p className="dmgt-sub">
            Pick a graph, read each vertex&rsquo;s degree, verify the handshaking identity{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\sum \\deg(v)=2|E|') }} />, then step a BFS
            that 2-colors it &mdash; a same-color clash is an odd cycle, so the graph is not bipartite.
          </p>
        </div>
        <button type="button" className="dmgt-reset" onClick={resetSteps}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dmgt-presets">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            className={`dmgt-chip${key === presetKey ? ' dmgt-chip-on' : ''}`}
            onClick={() => selectPreset(key)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="dmgt-body">
        <div className="dmgt-stage">
          <svg viewBox={`0 0 ${VBW} ${VBH}`} className="dmgt-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="dmgt-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {preset.edges.map(([u, v], i) => {
              const a = positions[u];
              const b = positions[v];
              const isActive = activeEdge && ((activeEdge[0] === u && activeEdge[1] === v) || (activeEdge[0] === v && activeEdge[1] === u));
              const isConflict = conflictEdge && ((conflictEdge[0] === u && conflictEdge[1] === v) || (conflictEdge[0] === v && conflictEdge[1] === u));
              let cls = 'dmgt-edge';
              if (isConflict) cls += ' dmgt-edge-conflict';
              else if (isActive) cls += ' dmgt-edge-active';
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  className={cls}
                  filter={isConflict ? 'url(#dmgt-glow)' : undefined}
                />
              );
            })}

            {positions.map((pt, i) => {
              const c = colors[i];
              const isActive = current.active === i;
              return (
                <g key={i} className={reduced ? 'dmgt-node' : 'dmgt-node dmgt-node-anim'}>
                  <circle
                    cx={pt.x} cy={pt.y} r={17}
                    className={`dmgt-node-circ ${colorClass(c)}${isActive ? ' dmgt-node-active' : ''}`}
                    filter={isActive ? 'url(#dmgt-glow)' : undefined}
                  />
                  <text x={pt.x} y={pt.y} className="dmgt-node-label" textAnchor="middle" dominantBaseline="central">
                    {LABELS[i]}
                  </text>
                  <text
                    x={pt.x} y={pt.y - 26}
                    className="dmgt-deg-label" textAnchor="middle"
                  >
                    deg {degrees[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="dmgt-side">
          <div className="dmgt-statrow">
            <div className="dmgt-statcard">
              <span className="dmgt-stat-label">vertices</span>
              <span className="dmgt-stat-val">{preset.n}</span>
            </div>
            <div className="dmgt-statcard">
              <span className="dmgt-stat-label">edges</span>
              <span className="dmgt-stat-val">{edgeCount}</span>
            </div>
            <div className={`dmgt-statcard${trace.bipartite ? ' dmgt-ok' : ' dmgt-bad'}`}>
              <span className="dmgt-stat-label">bipartite</span>
              <span className="dmgt-stat-val">{current.done ? (trace.bipartite ? 'YES' : 'NO') : '?'}</span>
            </div>
          </div>

          <div className="dmgt-formula">
            <span className="dmgt-formula-label">handshaking</span>
            <span dangerouslySetInnerHTML={{ __html: km(handshakeTex, true) }} />
          </div>
          <div className="dmgt-formula">
            <span className="dmgt-formula-label">edge count</span>
            <span dangerouslySetInnerHTML={{ __html: km(treeTex, true) }} />
          </div>

          <div className="dmgt-trace">
            <span className="dmgt-trace-label"><Share2 size={12} /> BFS step {Math.min(stepIdx, maxStep)} / {maxStep}</span>
            <span className="dmgt-trace-body">{current.note}</span>
          </div>
        </div>
      </div>

      <div className="dmgt-controls">
        <button
          type="button"
          className="dmgt-btn dmgt-btn-primary"
          onClick={() => { if (atEnd) setStepIdx(0); setPlaying((p) => !p); }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </button>
        <button type="button" className="dmgt-btn" onClick={stepForward} disabled={atEnd}>
          <StepForward size={14} /> Step
        </button>
        <label className="dmgt-speed">
          <span>Speed</span>
          <input
            type="range" min={0.5} max={3} step={0.5}
            value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span className="dmgt-speed-val">{speed.toFixed(1)}x</span>
        </label>
        <div className="dmgt-legend">
          <span className="dmgt-leg"><i className="dmgt-sw dmgt-c0" /> color 0</span>
          <span className="dmgt-leg"><i className="dmgt-sw dmgt-c1" /> color 1</span>
          <span className="dmgt-leg"><i className="dmgt-sw dmgt-cx" /> uncolored</span>
        </div>
      </div>
    </div>
  );
}

function isConnected(n, adj) {
  if (n === 0) return true;
  const seen = new Array(n).fill(false);
  const stack = [0];
  seen[0] = true;
  let count = 1;
  while (stack.length) {
    const u = stack.pop();
    for (const w of adj[u]) {
      if (!seen[w]) { seen[w] = true; count++; stack.push(w); }
    }
  }
  return count === n;
}

function hasCycle(n, edges) {
  // union-find; a repeated union means a cycle in an undirected simple graph
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    while (parent[x] !== r) { const nx = parent[x]; parent[x] = r; x = nx; }
    return r;
  };
  for (const [u, v] of edges) {
    if (u === v) return true;
    const ru = find(u);
    const rv = find(v);
    if (ru === rv) return true;
    parent[ru] = rv;
  }
  return false;
}
