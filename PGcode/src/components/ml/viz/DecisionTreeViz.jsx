import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Shuffle, RotateCcw, StepForward, FastForward } from 'lucide-react';
import './MLViz.css';

// --- Geometry / domain ----------------------------------------------------
const CANVAS_W = 760;
const CANVAS_H = 440;

// Plot area (left).
const PLOT_X0 = 36;
const PLOT_Y0 = 30;
const PLOT_W = 360;
const PLOT_H = 360;

// Tree area (right).
const TREE_X0 = PLOT_X0 + PLOT_W + 28;
const TREE_Y0 = 28;
const TREE_W = CANVAS_W - TREE_X0 - 12;
const TREE_H = CANVAS_H - TREE_Y0 - 28;

// Feature domain.
const X_LO = 0;
const X_HI = 10;
const Y_LO = 0;
const Y_HI = 10;

const N_POINTS = 40;
const N_CLASSES = 3;
const INITIAL_SEED = 20260607;

function toScreen(x, y) {
  const sx = PLOT_X0 + ((x - X_LO) / (X_HI - X_LO)) * PLOT_W;
  const sy = PLOT_Y0 + (1 - (y - Y_LO) / (Y_HI - Y_LO)) * PLOT_H;
  return { sx, sy };
}

function snap(v, p = 3) {
  if (!Number.isFinite(v)) return v;
  const mul = Math.pow(10, p);
  return Math.round(v * mul) / mul;
}

// --- RNG ------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Dataset --------------------------------------------------------------
// Three roughly Gaussian blobs in a 0..10 box, anchored so a tree can split them.
function buildDataset(seed) {
  const rand = mulberry32(seed);
  const gauss = () => {
    const u1 = Math.max(rand(), 1e-9);
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  // Centers picked to require at least two axis-aligned splits.
  const centers = [
    { cx: 2.5, cy: 7.5, label: 0 },
    { cx: 7.5, cy: 7.0, label: 1 },
    { cx: 5.0, cy: 2.5, label: 2 },
  ];
  const spread = 1.05;
  const per = Math.floor(N_POINTS / N_CLASSES);
  const remainder = N_POINTS - per * N_CLASSES;

  const pts = [];
  centers.forEach((c, idx) => {
    const n = per + (idx < remainder ? 1 : 0);
    for (let i = 0; i < n; i++) {
      let x = c.cx + gauss() * spread;
      let y = c.cy + gauss() * spread;
      x = Math.max(X_LO + 0.25, Math.min(X_HI - 0.25, x));
      y = Math.max(Y_LO + 0.25, Math.min(Y_HI - 0.25, y));
      pts.push({ x: snap(x, 3), y: snap(y, 3), label: c.label });
    }
  });
  return pts;
}

// --- CART tree (Gini) -----------------------------------------------------
function giniOf(counts, total) {
  if (total <= 0) return 0;
  let s = 0;
  for (let k = 0; k < counts.length; k++) {
    const p = counts[k] / total;
    s += p * p;
  }
  return 1 - s;
}

function classCounts(indices, points) {
  const c = new Array(N_CLASSES).fill(0);
  for (let i = 0; i < indices.length; i++) c[points[indices[i]].label]++;
  return c;
}

function majority(counts) {
  let best = 0;
  let bestC = counts[0];
  for (let k = 1; k < counts.length; k++) {
    if (counts[k] > bestC) { bestC = counts[k]; best = k; }
  }
  return best;
}

// Find best (feature, threshold) split by max Gini gain. Threshold is midpoint
// between consecutive unique sorted values of that feature.
function bestSplit(indices, points) {
  const total = indices.length;
  if (total < 2) return null;
  const parentCounts = classCounts(indices, points);
  const parentGini = giniOf(parentCounts, total);
  if (parentGini === 0) return null;

  let best = null;

  for (let f = 0; f < 2; f++) {
    const key = f === 0 ? 'x' : 'y';
    const sorted = indices.slice().sort((a, b) => points[a][key] - points[b][key]);
    const leftCounts = new Array(N_CLASSES).fill(0);
    const rightCounts = parentCounts.slice();

    for (let i = 0; i < sorted.length - 1; i++) {
      const idx = sorted[i];
      const cls = points[idx].label;
      leftCounts[cls]++;
      rightCounts[cls]--;

      const v = points[sorted[i]][key];
      const vNext = points[sorted[i + 1]][key];
      if (v === vNext) continue;
      const thr = (v + vNext) / 2;

      const nL = i + 1;
      const nR = total - nL;
      const gL = giniOf(leftCounts, nL);
      const gR = giniOf(rightCounts, nR);
      const weighted = (nL / total) * gL + (nR / total) * gR;
      const gain = parentGini - weighted;
      if (!best || gain > best.gain + 1e-12) {
        best = {
          feature: f,
          threshold: snap(thr, 4),
          gain,
          gini: weighted,
          parentGini,
          leftIdx: sorted.slice(0, nL),
          rightIdx: sorted.slice(nL),
          leftCounts: leftCounts.slice(),
          rightCounts: rightCounts.slice(),
        };
      }
    }
  }
  return best;
}

// Build a CART tree to a given maxDepth.
// Each node: { id, depth, indices, counts, gini, prediction, split? {feature, threshold, gain},
//              left?, right? }
function buildTree(points, maxDepth) {
  let nextId = 0;
  const allIdx = points.map((_, i) => i);

  function makeNode(indices, depth) {
    const counts = classCounts(indices, points);
    const total = indices.length;
    const gini = giniOf(counts, total);
    const node = {
      id: nextId++,
      depth,
      indices,
      counts,
      gini,
      total,
      prediction: majority(counts),
    };
    if (depth >= maxDepth || gini === 0 || total < 2) return node;
    const split = bestSplit(indices, points);
    if (!split || split.gain <= 1e-12) return node;
    node.split = {
      feature: split.feature,
      threshold: split.threshold,
      gain: split.gain,
      weightedGini: split.gini,
    };
    node.left = makeNode(split.leftIdx, depth + 1);
    node.right = makeNode(split.rightIdx, depth + 1);
    return node;
  }

  return makeNode(allIdx, 0);
}

function treeStats(root) {
  let leafCount = 0;
  let depth = 0;
  let nodes = 0;
  (function walk(n) {
    if (!n) return;
    nodes++;
    if (n.depth > depth) depth = n.depth;
    if (!n.split) leafCount++;
    else { walk(n.left); walk(n.right); }
  })(root);
  return { leafCount, depth, nodes };
}

function trainAccuracy(root, points) {
  if (!root) return 0;
  let correct = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    let n = root;
    while (n.split) {
      const v = n.split.feature === 0 ? p.x : p.y;
      n = v <= n.split.threshold ? n.left : n.right;
    }
    if (n.prediction === p.label) correct++;
  }
  return correct / points.length;
}

// Walk the tree and produce decision regions for the plot, plus the splits
// drawn as line segments within their bounding rectangle.
function collectRegionsAndSplits(root) {
  const regions = [];
  const splits = [];
  (function walk(n, box) {
    if (!n.split) {
      regions.push({
        x0: box.x0, x1: box.x1, y0: box.y0, y1: box.y1,
        prediction: n.prediction,
        counts: n.counts,
        gini: n.gini,
        nodeId: n.id,
      });
      return;
    }
    const { feature, threshold } = n.split;
    splits.push({
      feature, threshold,
      x0: box.x0, x1: box.x1, y0: box.y0, y1: box.y1,
      depth: n.depth,
      nodeId: n.id,
      gini: n.split.weightedGini,
    });
    if (feature === 0) {
      walk(n.left,  { x0: box.x0, x1: threshold, y0: box.y0, y1: box.y1 });
      walk(n.right, { x0: threshold, x1: box.x1, y0: box.y0, y1: box.y1 });
    } else {
      walk(n.left,  { x0: box.x0, x1: box.x1, y0: box.y0, y1: threshold });
      walk(n.right, { x0: box.x0, x1: box.x1, y0: threshold, y1: box.y1 });
    }
  })(root, { x0: X_LO, x1: X_HI, y0: Y_LO, y1: Y_HI });
  return { regions, splits };
}

// --- Tree layout (vertical, balanced by leaf width) -----------------------
// Returns flat list of placed nodes { node, x, y } plus edges.
function layoutTree(root) {
  // Assign horizontal slots in-order so the layout is leaf-balanced.
  const leaves = [];
  (function collect(n) {
    if (!n.split) { leaves.push(n); return; }
    collect(n.left); collect(n.right);
  })(root);

  const nLeaves = Math.max(1, leaves.length);
  const leafX = new Map();
  leaves.forEach((leaf, i) => {
    const frac = nLeaves === 1 ? 0.5 : i / (nLeaves - 1);
    leafX.set(leaf.id, frac);
  });

  function xOf(n) {
    if (!n.split) return leafX.get(n.id);
    return (xOf(n.left) + xOf(n.right)) / 2;
  }

  let maxDepth = 0;
  (function deep(n) {
    if (n.depth > maxDepth) maxDepth = n.depth;
    if (n.split) { deep(n.left); deep(n.right); }
  })(root);

  const placed = [];
  const edges = [];

  const innerW = TREE_W - 30;
  const innerH = TREE_H - 30;
  const colX0 = TREE_X0 + 15;
  const colY0 = TREE_Y0 + 12;
  const rowGap = maxDepth === 0 ? 0 : innerH / (maxDepth + 0.6);

  (function place(n) {
    const frac = xOf(n);
    const x = colX0 + frac * innerW;
    const y = colY0 + n.depth * rowGap + 14;
    placed.push({ node: n, x, y });
    if (n.split) {
      const lx = colX0 + xOf(n.left) * innerW;
      const ly = colY0 + (n.depth + 1) * rowGap + 14;
      edges.push({ x1: x, y1: y, x2: lx, y2: ly, side: 'L' });
      place(n.left);
      const rx = colX0 + xOf(n.right) * innerW;
      const ry = colY0 + (n.depth + 1) * rowGap + 14;
      edges.push({ x1: x, y1: y, x2: rx, y2: ry, side: 'R' });
      place(n.right);
    }
  })(root);

  return { placed, edges, maxDepth, nLeaves };
}

// --- Colors ---------------------------------------------------------------
const CLASS_COLORS = [
  'var(--hue-sky, #5ecbff)',
  'var(--hue-pink, #ff66cc)',
  'var(--hue-mint, #7be3b1)',
];

// Translucent fill via rgba — fall back when var() can't be used inline.
const CLASS_FILLS = [
  'rgba(94, 203, 255, 0.18)',
  'rgba(255, 102, 204, 0.16)',
  'rgba(123, 227, 177, 0.18)',
];

// --- Component ------------------------------------------------------------
export default function DecisionTreeViz() {
  const seedRef = useRef(INITIAL_SEED);
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [points, setPoints] = useState(() => buildDataset(INITIAL_SEED));
  const [maxDepth, setMaxDepth] = useState(3);
  const [grownDepth, setGrownDepth] = useState(1);

  const tree = useMemo(() => buildTree(points, grownDepth), [points, grownDepth]);
  const { regions, splits } = useMemo(() => collectRegionsAndSplits(tree), [tree]);
  const stats = useMemo(() => treeStats(tree), [tree]);
  const acc = useMemo(() => trainAccuracy(tree, points), [tree, points]);
  const layout = useMemo(() => layoutTree(tree), [tree]);

  const handleShuffle = useCallback(() => {
    seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0;
    const ns = seedRef.current;
    setSeed(ns);
    setPoints(buildDataset(ns));
    setGrownDepth(1);
  }, []);

  const handleReset = useCallback(() => {
    seedRef.current = INITIAL_SEED;
    setSeed(INITIAL_SEED);
    setPoints(buildDataset(INITIAL_SEED));
    setMaxDepth(3);
    setGrownDepth(1);
  }, []);

  const handleStep = useCallback(() => {
    setGrownDepth((d) => Math.min(maxDepth, d + 1));
  }, [maxDepth]);

  const handleGrowMax = useCallback(() => {
    setGrownDepth(maxDepth);
  }, [maxDepth]);

  const handleMaxDepth = useCallback((e) => {
    const v = parseInt(e.target.value, 10);
    setMaxDepth(v);
    setGrownDepth((d) => Math.min(d, v));
  }, []);

  const canStep = grownDepth < maxDepth;

  // Mark misclassified points for clarity.
  const classified = useMemo(() => {
    return points.map((p) => {
      let n = tree;
      while (n.split) {
        const v = n.split.feature === 0 ? p.x : p.y;
        n = v <= n.split.threshold ? n.left : n.right;
      }
      return { ...p, pred: n.prediction };
    });
  }, [points, tree]);

  // Render helpers --------------------------------------------------------
  const plotGrid = [];
  for (let i = 0; i <= 10; i += 2) {
    const { sx } = toScreen(i, 0);
    const { sy } = toScreen(0, i);
    plotGrid.push(
      <line
        key={`gv${i}`}
        x1={sx} y1={PLOT_Y0}
        x2={sx} y2={PLOT_Y0 + PLOT_H}
        stroke="var(--border)" strokeWidth="0.4"
      />
    );
    plotGrid.push(
      <line
        key={`gh${i}`}
        x1={PLOT_X0} y1={sy}
        x2={PLOT_X0 + PLOT_W} y2={sy}
        stroke="var(--border)" strokeWidth="0.4"
      />
    );
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.5rem' }}>
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="mlviz-svg"
          style={{ maxWidth: 880, aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        >
          {/* === Plot area === */}
          <rect
            x={PLOT_X0} y={PLOT_Y0} width={PLOT_W} height={PLOT_H}
            fill="var(--surface)" stroke="var(--border)" strokeWidth="0.8"
          />

          {/* Decision regions */}
          {regions.map((r, i) => {
            const a = toScreen(r.x0, r.y1);
            const b = toScreen(r.x1, r.y0);
            return (
              <rect
                key={`r${i}`}
                x={a.sx} y={a.sy}
                width={Math.max(0, b.sx - a.sx)}
                height={Math.max(0, b.sy - a.sy)}
                fill={CLASS_FILLS[r.prediction] || CLASS_FILLS[0]}
                stroke="none"
              />
            );
          })}

          {plotGrid}

          {/* Split lines: drawn within each split's box (not edge-to-edge) */}
          {splits.map((s, i) => {
            const opacity = Math.max(0.45, 1 - s.depth * 0.18);
            if (s.feature === 0) {
              const { sx } = toScreen(s.threshold, 0);
              const { sy: y1 } = toScreen(0, s.y1);
              const { sy: y2 } = toScreen(0, s.y0);
              return (
                <g key={`sp${i}`}>
                  <line
                    x1={sx} y1={y1} x2={sx} y2={y2}
                    stroke="var(--accent)" strokeWidth="1.6"
                    strokeDasharray={s.depth === 0 ? 'none' : '5 4'}
                    opacity={opacity}
                  />
                  <text
                    x={sx + 3} y={y1 + 10}
                    fontSize="9" fill="var(--accent)"
                    fontFamily="var(--mono, monospace)"
                  >x{'≤'}{snap(s.threshold, 2)}</text>
                </g>
              );
            }
            const { sy } = toScreen(0, s.threshold);
            const { sx: x1 } = toScreen(s.x0, 0);
            const { sx: x2 } = toScreen(s.x1, 0);
            return (
              <g key={`sp${i}`}>
                <line
                  x1={x1} y1={sy} x2={x2} y2={sy}
                  stroke="var(--accent)" strokeWidth="1.6"
                  strokeDasharray={s.depth === 0 ? 'none' : '5 4'}
                  opacity={opacity}
                />
                <text
                  x={x1 + 4} y={sy - 3}
                  fontSize="9" fill="var(--accent)"
                  fontFamily="var(--mono, monospace)"
                >y{'≤'}{snap(s.threshold, 2)}</text>
              </g>
            );
          })}

          {/* Axis ticks */}
          {[0, 2, 4, 6, 8, 10].map((t) => {
            const { sx } = toScreen(t, 0);
            const { sy } = toScreen(0, t);
            return (
              <g key={`tk${t}`}>
                <text
                  x={sx} y={PLOT_Y0 + PLOT_H + 12}
                  fontSize="9" fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)" textAnchor="middle"
                >{t}</text>
                <text
                  x={PLOT_X0 - 6} y={sy + 3}
                  fontSize="9" fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)" textAnchor="end"
                >{t}</text>
              </g>
            );
          })}
          <text
            x={PLOT_X0 + PLOT_W / 2} y={PLOT_Y0 + PLOT_H + 24}
            fontSize="10" fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)" textAnchor="middle"
          >feature x</text>
          <text
            x={PLOT_X0 - 22} y={PLOT_Y0 + PLOT_H / 2}
            fontSize="10" fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)" textAnchor="middle"
            transform={`rotate(-90 ${PLOT_X0 - 22} ${PLOT_Y0 + PLOT_H / 2})`}
          >feature y</text>

          {/* Data points */}
          {classified.map((p, i) => {
            const { sx, sy } = toScreen(p.x, p.y);
            const color = CLASS_COLORS[p.label];
            const miss = p.pred !== p.label;
            if (p.label === 0) {
              return (
                <g key={`pt${i}`}>
                  {miss && (
                    <circle cx={sx} cy={sy} r="7"
                      fill="none" stroke="var(--hard, #ff5c7a)" strokeWidth="1.3" opacity="0.9" />
                  )}
                  <circle cx={sx} cy={sy} r="4"
                    fill={color} stroke="var(--bg)" strokeWidth="1" />
                </g>
              );
            }
            if (p.label === 1) {
              return (
                <g key={`pt${i}`}>
                  {miss && (
                    <rect x={sx - 6} y={sy - 6} width="12" height="12"
                      fill="none" stroke="var(--hard, #ff5c7a)" strokeWidth="1.3" opacity="0.9" />
                  )}
                  <rect x={sx - 3.6} y={sy - 3.6} width="7.2" height="7.2"
                    fill={color} stroke="var(--bg)" strokeWidth="1" />
                </g>
              );
            }
            // class 2 — triangle
            const t = 4.4;
            const tri = `${sx},${sy - t} ${sx - t},${sy + t * 0.8} ${sx + t},${sy + t * 0.8}`;
            return (
              <g key={`pt${i}`}>
                {miss && (
                  <circle cx={sx} cy={sy} r="7"
                    fill="none" stroke="var(--hard, #ff5c7a)" strokeWidth="1.3" opacity="0.9" />
                )}
                <polygon points={tri} fill={color} stroke="var(--bg)" strokeWidth="1" />
              </g>
            );
          })}

          {/* === Tree area divider === */}
          <line
            x1={TREE_X0 - 14} y1={PLOT_Y0}
            x2={TREE_X0 - 14} y2={PLOT_Y0 + PLOT_H}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"
          />

          <text
            x={TREE_X0} y={TREE_Y0 - 10}
            fontSize="10" fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >tree</text>

          {/* Tree edges */}
          {layout.edges.map((e, i) => {
            const midY = (e.y1 + e.y2) / 2;
            return (
              <g key={`ed${i}`}>
                <path
                  d={`M${e.x1} ${e.y1 + 12} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2 - 14}`}
                  stroke="var(--border)" strokeWidth="1" fill="none"
                />
                <text
                  x={(e.x1 + e.x2) / 2}
                  y={midY + 3}
                  fontSize="8" fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >{e.side === 'L' ? 'yes' : 'no'}</text>
              </g>
            );
          })}

          {/* Tree nodes */}
          {layout.placed.map(({ node, x, y }) => {
            const isLeaf = !node.split;
            const w = isLeaf ? 56 : 78;
            const h = isLeaf ? 28 : 34;
            const fill = isLeaf
              ? CLASS_FILLS[node.prediction]
              : 'var(--surface)';
            const stroke = isLeaf
              ? CLASS_COLORS[node.prediction]
              : 'var(--accent)';
            return (
              <g key={`nd${node.id}`}>
                <rect
                  x={x - w / 2} y={y}
                  width={w} height={h}
                  rx="5"
                  fill={fill} stroke={stroke} strokeWidth="1.1"
                />
                {!isLeaf ? (
                  <>
                    <text
                      x={x} y={y + 13}
                      fontSize="9" fill="var(--text-main)"
                      fontFamily="var(--mono, monospace)"
                      textAnchor="middle"
                    >{node.split.feature === 0 ? 'x' : 'y'} {'≤'} {snap(node.split.threshold, 2)}</text>
                    <text
                      x={x} y={y + 24}
                      fontSize="8" fill="var(--text-dim)"
                      fontFamily="var(--mono, monospace)"
                      textAnchor="middle"
                    >gini {snap(node.gini, 2)} n={node.total}</text>
                  </>
                ) : (
                  <>
                    <text
                      x={x} y={y + 12}
                      fontSize="9" fill="var(--text-main)"
                      fontFamily="var(--mono, monospace)" textAnchor="middle"
                    >class {node.prediction}</text>
                    <text
                      x={x} y={y + 22}
                      fontSize="8" fill="var(--text-dim)"
                      fontFamily="var(--mono, monospace)" textAnchor="middle"
                    >n={node.total} g={snap(node.gini, 2)}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Class legend */}
          <g>
            <circle cx={PLOT_X0 + 10} cy={PLOT_Y0 + PLOT_H + 38} r="3.6"
              fill={CLASS_COLORS[0]} stroke="var(--bg)" strokeWidth="1" />
            <text x={PLOT_X0 + 20} y={PLOT_Y0 + PLOT_H + 41}
              fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)"
            >class 0</text>
            <rect x={PLOT_X0 + 70} y={PLOT_Y0 + PLOT_H + 35} width="6.6" height="6.6"
              fill={CLASS_COLORS[1]} stroke="var(--bg)" strokeWidth="1" />
            <text x={PLOT_X0 + 82} y={PLOT_Y0 + PLOT_H + 41}
              fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)"
            >class 1</text>
            <polygon
              points={`${PLOT_X0 + 134},${PLOT_Y0 + PLOT_H + 35} ${PLOT_X0 + 130},${PLOT_Y0 + PLOT_H + 42} ${PLOT_X0 + 138},${PLOT_Y0 + PLOT_H + 42}`}
              fill={CLASS_COLORS[2]} stroke="var(--bg)" strokeWidth="1" />
            <text x={PLOT_X0 + 144} y={PLOT_Y0 + PLOT_H + 41}
              fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)"
            >class 2</text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>CART</span>
          <span className="mlviz-val">depth {stats.depth}/{maxDepth}</span>
          <span className="mlviz-sub">leaves {stats.leafCount}</span>
          <span className="mlviz-sub">nodes {stats.nodes}</span>
          <span className="mlviz-sub">train acc {snap(acc * 100, 1)}%</span>
          <span className="mlviz-sub">root gini {snap(tree.gini, 3)}</span>
          <span className="mlviz-sub">seed {seed}</span>
        </div>

        {splits.length > 0 && (
          <div className="mlviz-row">
            <span className="mlviz-sub" style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              splits
            </span>
            {splits.slice(0, 6).map((s, i) => (
              <span key={`spl${i}`} className="mlviz-sub">
                d{s.depth}: {s.feature === 0 ? 'x' : 'y'}{'≤'}{snap(s.threshold, 2)}
                {' '}gini {snap(s.gini, 3)}
              </span>
            ))}
            {splits.length > 6 && (
              <span className="mlviz-sub">+{splits.length - 6} more</span>
            )}
          </div>
        )}

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">max depth</span>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={maxDepth}
              onChange={handleMaxDepth}
            />
            <span className="mlviz-slider-val">{maxDepth}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={!canStep}
          >
            <StepForward size={13} />
            <span>Step grow</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleGrowMax}
            disabled={grownDepth >= maxDepth}
          >
            <FastForward size={13} />
            <span>Grow to max</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleShuffle}
          >
            <Shuffle size={13} />
            <span>Re-shuffle data</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          Each split picks the (feature, threshold) maximizing Gini gain.
          Pure leaves stop early. Red-ringed points are misclassified by the
          current tree.
        </div>
      </div>
    </div>
  );
}
