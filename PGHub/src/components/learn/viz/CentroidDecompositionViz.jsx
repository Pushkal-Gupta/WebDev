import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './CentroidDecompositionViz.css';

// 15-node tree, laid out top-down. Balanced enough that the centroid tree is
// shallow (depth 3 for n=15, i.e. O(log n)).
const NODES = [
  { id: 0, x: 300, y: 60 },
  { id: 1, x: 170, y: 130 },
  { id: 2, x: 430, y: 130 },
  { id: 3, x: 90, y: 210 },
  { id: 4, x: 240, y: 210 },
  { id: 5, x: 380, y: 210 },
  { id: 6, x: 510, y: 210 },
  { id: 7, x: 50, y: 290 },
  { id: 8, x: 140, y: 290 },
  { id: 9, x: 240, y: 290 },
  { id: 10, x: 340, y: 290 },
  { id: 11, x: 420, y: 290 },
  { id: 12, x: 510, y: 290 },
  { id: 13, x: 50, y: 360 },
  { id: 14, x: 240, y: 360 },
];
const EDGES = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [3, 7], [3, 8],
  [4, 9], [5, 10], [5, 11], [6, 12], [7, 13], [9, 14],
].map(([u, v], i) => ({ u, v, id: i }));

const N = NODES.length;
const ADJ = Array.from({ length: N }, () => []);
for (const e of EDGES) { ADJ[e.u].push(e.v); ADJ[e.v].push(e.u); }

// One color per centroid-decomposition LEVEL.
const LEVEL_COLORS = [
  'var(--accent)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-sky)',
];

function buildFrames() {
  const removed = new Array(N).fill(false);
  const centroidLevel = new Array(N).fill(-1);
  const centroidParent = new Array(N).fill(-1);
  const ctDepth = new Array(N).fill(0);
  const frames = [];
  let maxCtDepth = 0;
  let centroidsFound = 0;

  const componentMembers = (start) => {
    const seen = [];
    const stack = [start];
    const vis = new Set([start]);
    while (stack.length) {
      const u = stack.pop();
      seen.push(u);
      for (const v of ADJ[u]) if (!removed[v] && !vis.has(v)) { vis.add(v); stack.push(v); }
    }
    return seen;
  };

  const subSize = (u, p) => {
    let s = 1;
    for (const v of ADJ[u]) if (v !== p && !removed[v]) s += subSize(v, u);
    return s;
  };

  const findCentroid = (u, p, total) => {
    for (const v of ADJ[u]) {
      if (v !== p && !removed[v] && subSize(v, u) > total / 2) return findCentroid(v, u, total);
    }
    return u;
  };

  const snap = (extra) => ({
    removed: [...removed],
    centroidLevel: [...centroidLevel],
    centroidParent: [...centroidParent],
    ctDepth: [...ctDepth],
    component: [],
    activeCentroid: -1,
    sizeOf: {},
    childComps: [],
    level: 0,
    maxCtDepth,
    centroidsFound,
    stage: 'idle',
    note: '',
    ...extra,
  });

  frames.push(snap({
    stage: 'init',
    note: 'Centroid decomposition: repeatedly remove the centroid of each remaining piece. '
      + 'The centroid is the node whose removal leaves every fragment of size <= total/2.',
  }));

  // Recurse over components. `parentCentroid` is the centroid that removed
  // the parent component (gives the centroid tree edge), `level` is its depth.
  const decompose = (entry, parentCentroid, level) => {
    const comp = componentMembers(entry);
    const total = comp.length;

    const sizeOf = {};
    for (const u of comp) sizeOf[u] = subSize(u, -1);

    frames.push(snap({
      stage: 'size',
      level,
      component: comp,
      sizeOf,
      activeCentroid: -1,
      note: `Level ${level}: component of ${total} node(s) {${comp.slice().sort((a, b) => a - b).join(', ')}}. `
        + 'Compute subtree sizes rooted anywhere, then walk toward the heaviest child.',
    }));

    const c = findCentroid(entry, -1, total);

    // Sizes of the fragments left after removing c (for the caption + property check).
    removed[c] = true;
    const fragments = [];
    for (const v of ADJ[c]) if (!removed[v]) fragments.push({ root: v, size: componentMembers(v).length });
    removed[c] = false;
    const maxFrag = fragments.reduce((m, f) => Math.max(m, f.size), 0);

    frames.push(snap({
      stage: 'centroid',
      level,
      component: comp,
      sizeOf,
      activeCentroid: c,
      note: `Subtree sizes checked: removing node ${c} leaves max fragment ${maxFrag} <= ${total}/2 = ${total / 2} `
        + `-> node ${c} is the centroid of this component.`,
    }));

    // Record centroid-tree placement and remove c.
    centroidLevel[c] = level;
    centroidParent[c] = parentCentroid;
    ctDepth[c] = level;
    maxCtDepth = Math.max(maxCtDepth, level);
    centroidsFound += 1;
    removed[c] = true;

    const childRoots = [];
    for (const v of ADJ[c]) if (!removed[v]) childRoots.push(v);

    frames.push(snap({
      stage: 'split',
      level,
      activeCentroid: c,
      childComps: fragments.map((f) => f.size),
      note: parentCentroid === -1
        ? `Remove node ${c} (centroid-tree root, depth 0). It splits into ${childRoots.length} sub-component(s) `
          + `of size ${fragments.map((f) => f.size).join(', ') || '0'}; recurse into each.`
        : `Remove node ${c}; its centroid-tree parent is node ${parentCentroid} (the centroid that split its component). `
          + `Splits into ${childRoots.length} piece(s) of size ${fragments.map((f) => f.size).join(', ') || '0'}.`,
    }));

    for (const v of childRoots) decompose(v, c, level + 1);
  };

  decompose(0, -1, 0);

  frames.push(snap({
    stage: 'done',
    note: `Done. All ${N} nodes became centroids; centroid-tree depth is ${maxCtDepth} `
      + `(<= log2(${N}) ~ ${Math.log2(N).toFixed(1)}), so any root-to-node path is O(log n).`,
  }));

  return { frames, maxCtDepth };
}

// Lay out the centroid tree (computed once, fully built) for the right panel.
function buildCentroidLayout(frames) {
  const last = frames[frames.length - 1];
  const parent = last.centroidParent;
  const depth = last.ctDepth;
  const children = Array.from({ length: N }, () => []);
  let root = -1;
  for (let i = 0; i < N; i += 1) {
    if (parent[i] === -1) root = i; else children[parent[i]].push(i);
  }
  const maxDepth = Math.max(...depth);
  // Assign an x slot per node via in-order over the centroid tree.
  let slot = 0;
  const order = [];
  const dfs = (u) => {
    if (children[u].length === 0) { order.push(u); slot += 1; return; }
    for (const v of children[u]) dfs(v);
    order.push(u);
  };
  dfs(root);
  const slotOf = {};
  order.forEach((u, i) => { slotOf[u] = i; });
  const leaves = slot || 1;
  return { parent, depth, maxDepth, slotOf, leaves, root };
}

export default function CentroidDecompositionViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const { frames, maxCtDepth } = useMemo(() => buildFrames(), []);
  const ct = useMemo(() => buildCentroidLayout(frames), [frames]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const W = 940;
  const H = 420;
  const panelX = 620;
  const panelW = W - panelX - 24;

  const levelColor = (lvl) => LEVEL_COLORS[lvl % LEVEL_COLORS.length];
  const componentSet = useMemo(() => new Set(current.component), [current.component]);

  // Centroid-tree panel geometry.
  const ctTop = 150;
  const ctBottom = H - 36;
  const ctLeft = panelX + 14;
  const ctRight = panelX + panelW - 4;
  const ctX = (u) => ctLeft + ((ct.slotOf[u] + 0.5) / ct.leaves) * (ctRight - ctLeft);
  const ctY = (u) => ctTop + (ct.maxDepth === 0 ? 0 : (ct.depth[u] / ct.maxDepth) * (ctBottom - ctTop));
  // A centroid is "placed" in the centroid tree once it has been chosen.
  const placed = (u) => current.centroidLevel[u] >= 0;

  return (
    <div className="cdv">
      <div className="cdv-head">
        <h3 className="cdv-title">Centroid decomposition — O(n log n)</h3>
        <p className="cdv-sub">
          Find each component&apos;s centroid (removing it leaves every fragment &lt;= total/2), record it, remove it, and
          recurse. Each centroid&apos;s parent is the centroid that split its component, so the centroid tree has depth O(log n).
        </p>
      </div>

      <div className="cdv-controls">
        <div className="cdv-actions">
          <div className="cdv-buttons">
            <button
              type="button"
              className="cdv-btn cdv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="cdv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="cdv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="cdv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="cdv-speed">
            <span className="cdv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="cdv-speed-range"
            />
            <span className="cdv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="cdv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="cdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cdv-svg" preserveAspectRatio="xMidYMid meet">
          {/* left: the original tree being decomposed */}
          <rect x={20} y={20} width={panelX - 44} height={H - 40} fill="var(--bg)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="cdv-row-label">tree (centroids removed as we go)</text>

          {EDGES.map((e) => {
            const a = NODES[e.u];
            const b = NODES[e.v];
            const gone = current.removed[e.u] || current.removed[e.v];
            const inComp = componentSet.has(e.u) && componentSet.has(e.v);
            return (
              <line
                key={`e-${e.id}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={inComp ? 'var(--accent)' : 'var(--text-dim)'}
                strokeWidth={inComp ? 2.4 : 1.3}
                opacity={gone ? 0.12 : inComp ? 0.9 : 0.4}
                strokeDasharray={gone ? '4 4' : undefined}
              />
            );
          })}

          {NODES.map((nd) => {
            const isCentroidNow = nd.id === current.activeCentroid;
            const lvl = current.centroidLevel[nd.id];
            const isRemoved = current.removed[nd.id];
            const inComp = componentSet.has(nd.id);
            const settled = lvl >= 0;
            const fill = isCentroidNow ? 'var(--hue-pink)'
              : settled ? levelColor(lvl)
              : inComp ? 'rgba(var(--accent-rgb), 0.18)'
              : 'var(--surface)';
            const stroke = isCentroidNow ? 'var(--hue-pink)'
              : settled ? levelColor(lvl)
              : inComp ? 'var(--accent)'
              : 'var(--border)';
            const labelFill = (isCentroidNow || settled) ? 'var(--bg)' : 'var(--text-main)';
            const showSize = current.stage === 'size' && current.sizeOf[nd.id] !== undefined && !settled;
            return (
              <g key={`n-${nd.id}`} opacity={isRemoved && !isCentroidNow && !settled ? 0.3 : 1}>
                <circle
                  cx={nd.x} cy={nd.y} r={16}
                  fill={fill} stroke={stroke}
                  strokeWidth={isCentroidNow ? 3 : 2}
                />
                <text x={nd.x} y={nd.y + 4} className="cdv-node-label" style={{ fill: labelFill }}>{nd.id}</text>
                {showSize && (
                  <text x={nd.x} y={nd.y - 22} className="cdv-node-size">sz {current.sizeOf[nd.id]}</text>
                )}
                {settled && (
                  <text x={nd.x + 18} y={nd.y - 12} className="cdv-node-lvl" style={{ fill: levelColor(lvl) }}>L{lvl}</text>
                )}
              </g>
            );
          })}

          {/* right: the centroid tree being built */}
          <rect x={panelX - 12} y={20} width={panelW + 24} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={40} className="cdv-row-label">centroid tree</text>

          <text x={panelX} y={64} className="cdv-row-meta">level</text>
          <text x={panelX} y={86} className="cdv-readout-big">{current.level}</text>
          <text x={panelX + 84} y={64} className="cdv-row-meta">ct depth</text>
          <text x={panelX + 84} y={86} className="cdv-readout-big">{current.maxCtDepth}</text>
          <text x={panelX + 168} y={64} className="cdv-row-meta">found</text>
          <text x={panelX + 168} y={86} className="cdv-readout-big">{current.centroidsFound}</text>

          <line x1={panelX} y1={104} x2={panelX + panelW} y2={104} stroke="var(--border)" strokeWidth={1} />
          <text x={panelX} y={124} className="cdv-row-meta">parent = centroid that split this piece</text>

          {/* centroid-tree edges */}
          {NODES.map((nd) => {
            const p = ct.parent[nd.id];
            if (p === -1 || !placed(nd.id) || !placed(p)) return null;
            return (
              <line
                key={`cte-${nd.id}`}
                x1={ctX(nd.id)} y1={ctY(nd.id)} x2={ctX(p)} y2={ctY(p)}
                stroke="var(--text-dim)" strokeWidth={1.4} opacity={0.7}
              />
            );
          })}
          {/* centroid-tree nodes */}
          {NODES.map((nd) => {
            if (!placed(nd.id)) return null;
            const lvl = current.centroidLevel[nd.id];
            const isCentroidNow = nd.id === current.activeCentroid;
            return (
              <g key={`ctn-${nd.id}`}>
                <circle
                  cx={ctX(nd.id)} cy={ctY(nd.id)} r={12}
                  fill={levelColor(lvl)}
                  stroke={isCentroidNow ? 'var(--hue-pink)' : 'var(--bg)'}
                  strokeWidth={isCentroidNow ? 3 : 1.5}
                />
                <text x={ctX(nd.id)} y={ctY(nd.id) + 3.5} className="cdv-ct-label">{nd.id}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cdv-metrics">
        <div className="cdv-metric">
          <span className="cdv-metric-label">stage</span>
          <span className="cdv-metric-value">{current.stage}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">current level</span>
          <span className="cdv-metric-value">{current.level}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">centroid chosen</span>
          <span className="cdv-metric-value">{current.activeCentroid >= 0 ? current.activeCentroid : '—'}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">component sizes</span>
          <span className="cdv-metric-value">
            {current.stage === 'split' && current.childComps.length
              ? current.childComps.join(', ')
              : current.component.length || '—'}
          </span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">centroid-tree depth</span>
          <span className="cdv-metric-value">{current.maxCtDepth}</span>
        </div>
        <div className="cdv-metric cdv-metric-dim">
          <span className="cdv-metric-label">bound</span>
          <span className="cdv-metric-value cdv-metric-dimval">log2({N}) ~ {Math.log2(N).toFixed(1)}, max {maxCtDepth}</span>
        </div>
      </div>

      <div className="cdv-arith">
        <span className="cdv-arith-label">trace</span>
        <span className="cdv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
