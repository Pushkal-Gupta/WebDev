import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Shuffle, RotateCcw, Trees } from 'lucide-react';
import './MLViz.css';

// --- Geometry -------------------------------------------------------------
const CANVAS_W = 820;
const CANVAS_H = 480;

// Left: main plot showing aggregate forest decision boundary.
const PLOT_X0 = 36;
const PLOT_Y0 = 30;
const PLOT_W = 380;
const PLOT_H = 380;

// Right: 2x3 grid of small tree previews.
const GRID_X0 = PLOT_X0 + PLOT_W + 36;
const GRID_Y0 = 30;
const GRID_W = CANVAS_W - GRID_X0 - 16;
const GRID_H = PLOT_H;
const GRID_COLS = 3;
const GRID_ROWS = 2;
const GRID_GAP = 8;
const CELL_W = (GRID_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const CELL_H = (GRID_H - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS;

// Feature domain.
const X_LO = 0;
const X_HI = 10;
const Y_LO = 0;
const Y_HI = 10;

const N_POINTS = 60;
const N_CLASSES = 2;
const INITIAL_SEED = 20260608;

// Boundary sampling resolution (aggregate plot vs preview).
const BOUNDARY_RES = 56;
const PREVIEW_RES = 22;

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

// --- Deterministic RNG ----------------------------------------------------
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
// Two interleaved blobs that require multiple axis-aligned splits to separate.
function buildDataset(seed) {
  const rand = mulberry32(seed);
  const gauss = () => {
    const u1 = Math.max(rand(), 1e-9);
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  // Two main clusters per class to make a non-linear boundary.
  const centers = [
    { cx: 2.8, cy: 7.0, label: 0 },
    { cx: 7.2, cy: 3.0, label: 0 },
    { cx: 7.4, cy: 7.4, label: 1 },
    { cx: 2.6, cy: 2.8, label: 1 },
  ];
  const spread = 1.05;
  const per = Math.floor(N_POINTS / centers.length);
  const remainder = N_POINTS - per * centers.length;

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

// --- CART tree with bagging + random feature subset ----------------------
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

// Best split scanning only the supplied feature subset.
function bestSplit(indices, points, featureSubset) {
  const total = indices.length;
  if (total < 2) return null;
  const parentCounts = classCounts(indices, points);
  const parentGini = giniOf(parentCounts, total);
  if (parentGini === 0) return null;

  let best = null;
  for (let fi = 0; fi < featureSubset.length; fi++) {
    const f = featureSubset[fi];
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
          leftIdx: sorted.slice(0, nL),
          rightIdx: sorted.slice(nL),
        };
      }
    }
  }
  return best;
}

// Build a random tree: bagged sample of points, random feature subset at each split.
// In 2D with mtry=1 we randomly pick a feature for every split; with mtry=2 we
// scan both. Returns a tree node tree.
function buildRandomTree(points, maxDepth, rand, mtry, bagIndices) {
  let nextId = 0;
  function pickFeatureSubset() {
    if (mtry >= 2) return [0, 1];
    return [rand() < 0.5 ? 0 : 1];
  }
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
    const subset = pickFeatureSubset();
    const split = bestSplit(indices, points, subset);
    if (!split || split.gain <= 1e-12) return node;
    node.split = {
      feature: split.feature,
      threshold: split.threshold,
      gain: split.gain,
    };
    node.left = makeNode(split.leftIdx, depth + 1);
    node.right = makeNode(split.rightIdx, depth + 1);
    return node;
  }
  return makeNode(bagIndices.slice(), 0);
}

// Predict for a single point using a tree.
function predictTree(root, x, y) {
  let n = root;
  while (n.split) {
    const v = n.split.feature === 0 ? x : y;
    n = v <= n.split.threshold ? n.left : n.right;
  }
  return n.prediction;
}

// Build the forest: array of { tree, bag (Set of indices used), oobIndices }.
function buildForest(points, treeCount, maxDepth, seed, mtry) {
  const rand = mulberry32(seed);
  const N = points.length;
  const trees = [];
  for (let t = 0; t < treeCount; t++) {
    // Bootstrap sample: N draws with replacement.
    const bag = new Set();
    const bagIndices = [];
    for (let i = 0; i < N; i++) {
      const j = Math.floor(rand() * N);
      bagIndices.push(j);
      bag.add(j);
    }
    const oobIndices = [];
    for (let i = 0; i < N; i++) if (!bag.has(i)) oobIndices.push(i);
    const tree = buildRandomTree(points, maxDepth, rand, mtry, bagIndices);
    trees.push({ tree, bag, bagIndices, oobIndices });
  }
  return trees;
}

// Aggregate prediction at (x,y): majority vote across trees.
function forestPredict(trees, x, y) {
  const counts = new Array(N_CLASSES).fill(0);
  for (let i = 0; i < trees.length; i++) {
    counts[predictTree(trees[i].tree, x, y)]++;
  }
  return majority(counts);
}

// Bag accuracy: forest prediction on the full training set.
function bagAccuracy(trees, points) {
  if (trees.length === 0 || points.length === 0) return 0;
  let correct = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (forestPredict(trees, p.x, p.y) === p.label) correct++;
  }
  return correct / points.length;
}

// OOB error: for each point, average vote of trees that did NOT see it; count mismatches.
function oobError(trees, points) {
  if (trees.length === 0 || points.length === 0) return null;
  let oobChecked = 0;
  let oobWrong = 0;
  for (let i = 0; i < points.length; i++) {
    const counts = new Array(N_CLASSES).fill(0);
    let voters = 0;
    for (let t = 0; t < trees.length; t++) {
      if (trees[t].bag.has(i)) continue;
      counts[predictTree(trees[t].tree, points[i].x, points[i].y)]++;
      voters++;
    }
    if (voters === 0) continue;
    oobChecked++;
    const pred = majority(counts);
    if (pred !== points[i].label) oobWrong++;
  }
  if (oobChecked === 0) return null;
  return oobWrong / oobChecked;
}

// Sample a tree's decision regions over a regular grid → returns rectangles.
function sampleTreeRegions(tree, res, plotX0, plotY0, plotW, plotH) {
  const cellW = plotW / res;
  const cellH = plotH / res;
  const rects = [];
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const x = X_LO + ((i + 0.5) / res) * (X_HI - X_LO);
      const y = Y_LO + ((j + 0.5) / res) * (Y_HI - Y_LO);
      const pred = predictTree(tree, x, y);
      const sx = plotX0 + i * cellW;
      // Flip y for screen.
      const sy = plotY0 + (res - 1 - j) * cellH;
      rects.push({ sx, sy, w: cellW + 0.6, h: cellH + 0.6, pred });
    }
  }
  return rects;
}

// Sample the forest's aggregate boundary by majority vote.
function sampleForestRegions(trees, res, plotX0, plotY0, plotW, plotH) {
  if (trees.length === 0) return [];
  const cellW = plotW / res;
  const cellH = plotH / res;
  const rects = [];
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const x = X_LO + ((i + 0.5) / res) * (X_HI - X_LO);
      const y = Y_LO + ((j + 0.5) / res) * (Y_HI - Y_LO);
      const counts = new Array(N_CLASSES).fill(0);
      for (let t = 0; t < trees.length; t++) {
        counts[predictTree(trees[t].tree, x, y)]++;
      }
      const total = trees.length;
      const pred = majority(counts);
      const confidence = counts[pred] / total;
      const sx = plotX0 + i * cellW;
      const sy = plotY0 + (res - 1 - j) * cellH;
      rects.push({ sx, sy, w: cellW + 0.6, h: cellH + 0.6, pred, confidence });
    }
  }
  return rects;
}

// --- Colors ---------------------------------------------------------------
const CLASS_COLORS = [
  'var(--hue-sky, #5ecbff)',
  'var(--hue-pink, #ff66cc)',
];

const CLASS_FILLS_FAINT = [
  'rgba(94, 203, 255, 0.10)',
  'rgba(255, 102, 204, 0.10)',
];

const CLASS_FILLS_STRONG = [
  'rgba(94, 203, 255, 0.22)',
  'rgba(255, 102, 204, 0.20)',
];

// --- Component ------------------------------------------------------------
export default function RandomForestViz() {
  const seedRef = useRef(INITIAL_SEED);
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [points, setPoints] = useState(() => buildDataset(INITIAL_SEED));
  const [treeCount, setTreeCount] = useState(8);
  const [maxDepth, setMaxDepth] = useState(3);
  const [selectedTree, setSelectedTree] = useState(null);

  // Random feature subset: in 2D we use mtry=1 (one random feature per split)
  // to make trees actually diverge — classic Random Forest behavior.
  const mtry = 1;

  const forest = useMemo(
    () => buildForest(points, treeCount, maxDepth, seed, mtry),
    [points, treeCount, maxDepth, seed, mtry]
  );

  const aggregateRegions = useMemo(
    () => sampleForestRegions(forest, BOUNDARY_RES, PLOT_X0, PLOT_Y0, PLOT_W, PLOT_H),
    [forest]
  );

  const bagAcc = useMemo(() => bagAccuracy(forest, points), [forest, points]);
  const oob = useMemo(() => oobError(forest, points), [forest, points]);

  // Preview trees: show first 6 trees in the 2x3 grid.
  const previewSlots = useMemo(() => {
    const slots = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const idx = r * GRID_COLS + c;
        const x = GRID_X0 + c * (CELL_W + GRID_GAP);
        const y = GRID_Y0 + r * (CELL_H + GRID_GAP);
        slots.push({ idx, x, y });
      }
    }
    return slots;
  }, []);

  // Pre-sample preview regions for visible preview trees.
  const previewRegions = useMemo(() => {
    return previewSlots.map((slot) => {
      if (slot.idx >= forest.length) return null;
      return sampleTreeRegions(
        forest[slot.idx].tree,
        PREVIEW_RES,
        slot.x + 6,
        slot.y + 14,
        CELL_W - 12,
        CELL_H - 20
      );
    });
  }, [forest, previewSlots]);

  // Enlarged single-tree regions when one is selected.
  const enlargedRegions = useMemo(() => {
    if (selectedTree == null || selectedTree >= forest.length) return null;
    return sampleTreeRegions(
      forest[selectedTree].tree,
      BOUNDARY_RES,
      PLOT_X0,
      PLOT_Y0,
      PLOT_W,
      PLOT_H
    );
  }, [forest, selectedTree]);

  const handleShuffle = useCallback(() => {
    seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0;
    const ns = seedRef.current;
    setSeed(ns);
    setPoints(buildDataset(ns));
    setSelectedTree(null);
  }, []);

  const handleReset = useCallback(() => {
    seedRef.current = INITIAL_SEED;
    setSeed(INITIAL_SEED);
    setPoints(buildDataset(INITIAL_SEED));
    setTreeCount(8);
    setMaxDepth(3);
    setSelectedTree(null);
  }, []);

  const handleTreeCount = useCallback((e) => {
    setTreeCount(parseInt(e.target.value, 10));
    setSelectedTree(null);
  }, []);

  const handleMaxDepth = useCallback((e) => {
    setMaxDepth(parseInt(e.target.value, 10));
    setSelectedTree(null);
  }, []);

  const handlePreviewClick = useCallback((idx) => {
    setSelectedTree((cur) => (cur === idx ? null : idx));
  }, []);

  // Plot grid lines.
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

  const displayRegions = enlargedRegions || aggregateRegions;
  const displayingForest = enlargedRegions == null;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.5rem' }}>
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="mlviz-svg"
          style={{ maxWidth: 960, aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        >
          {/* === Main plot === */}
          <rect
            x={PLOT_X0} y={PLOT_Y0} width={PLOT_W} height={PLOT_H}
            fill="var(--surface)" stroke="var(--border)" strokeWidth="0.8"
          />

          {/* Decision region cells (forest aggregate OR enlarged single tree) */}
          {displayRegions.map((r, i) => {
            const fill = displayingForest
              ? (CLASS_FILLS_STRONG[r.pred] || CLASS_FILLS_STRONG[0])
              : (CLASS_FILLS_STRONG[r.pred] || CLASS_FILLS_STRONG[0]);
            // For forest, modulate opacity by confidence (consensus).
            const opacity = displayingForest
              ? Math.max(0.35, (r.confidence - 0.5) * 2)
              : 0.9;
            return (
              <rect
                key={`agg${i}`}
                x={r.sx} y={r.sy} width={r.w} height={r.h}
                fill={fill}
                opacity={opacity}
                shapeRendering="crispEdges"
              />
            );
          })}

          {plotGrid}

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

          {/* Plot title */}
          <text
            x={PLOT_X0} y={PLOT_Y0 - 10}
            fontSize="10" fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >
            {displayingForest
              ? `forest aggregate · ${forest.length} trees · majority vote`
              : `tree #${selectedTree + 1} only`}
          </text>

          {/* Data points */}
          {points.map((p, i) => {
            const { sx, sy } = toScreen(p.x, p.y);
            const color = CLASS_COLORS[p.label];
            if (p.label === 0) {
              return (
                <circle
                  key={`pt${i}`}
                  cx={sx} cy={sy} r="3.6"
                  fill={color} stroke="var(--bg)" strokeWidth="1"
                />
              );
            }
            return (
              <rect
                key={`pt${i}`}
                x={sx - 3.2} y={sy - 3.2}
                width="6.4" height="6.4"
                fill={color} stroke="var(--bg)" strokeWidth="1"
              />
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
            <text
              x={PLOT_X0 + 130} y={PLOT_Y0 + PLOT_H + 41}
              fontSize="9" fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >shade = vote consensus</text>
          </g>

          {/* === Grid divider === */}
          <line
            x1={GRID_X0 - 18} y1={PLOT_Y0}
            x2={GRID_X0 - 18} y2={PLOT_Y0 + PLOT_H}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"
          />

          <text
            x={GRID_X0} y={GRID_Y0 - 10}
            fontSize="10" fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >individual trees · click to enlarge</text>

          {/* Preview grid */}
          {previewSlots.map((slot) => {
            const tIdx = slot.idx;
            const hasTree = tIdx < forest.length;
            const isSelected = selectedTree === tIdx;
            const cellFill = isSelected
              ? 'rgba(var(--accent-rgb, 124 92 255), 0.10)'
              : 'var(--surface)';
            const cellStroke = isSelected
              ? 'var(--accent)'
              : 'var(--border)';
            const innerX = slot.x + 6;
            const innerY = slot.y + 14;
            const innerW = CELL_W - 12;
            const innerH = CELL_H - 20;
            const regions = previewRegions[tIdx];
            return (
              <g
                key={`cell${tIdx}`}
                style={{ cursor: hasTree ? 'pointer' : 'default' }}
                onClick={hasTree ? () => handlePreviewClick(tIdx) : undefined}
              >
                <rect
                  x={slot.x} y={slot.y}
                  width={CELL_W} height={CELL_H}
                  rx="4"
                  fill={cellFill}
                  stroke={cellStroke}
                  strokeWidth={isSelected ? 1.4 : 0.8}
                />
                <text
                  x={slot.x + 6} y={slot.y + 10}
                  fontSize="8" fill={isSelected ? 'var(--accent)' : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                >
                  {hasTree ? `tree #${tIdx + 1}` : '—'}
                </text>
                {hasTree && (
                  <text
                    x={slot.x + CELL_W - 6} y={slot.y + 10}
                    fontSize="8" fill="var(--text-dim)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="end"
                  >
                    bag {forest[tIdx].bag.size}/{points.length}
                  </text>
                )}

                {/* Inner plot frame */}
                <rect
                  x={innerX} y={innerY}
                  width={innerW} height={innerH}
                  fill="var(--bg)"
                  stroke="var(--border)"
                  strokeWidth="0.4"
                />

                {/* Preview decision regions */}
                {regions && regions.map((r, ri) => (
                  <rect
                    key={`pr${ri}`}
                    x={r.sx} y={r.sy} width={r.w} height={r.h}
                    fill={CLASS_FILLS_STRONG[r.pred] || CLASS_FILLS_STRONG[0]}
                    opacity={0.8}
                    shapeRendering="crispEdges"
                  />
                ))}

                {/* Preview data points (downscaled into the cell). */}
                {hasTree && points.map((p, pi) => {
                  const px = innerX + ((p.x - X_LO) / (X_HI - X_LO)) * innerW;
                  const py = innerY + (1 - (p.y - Y_LO) / (Y_HI - Y_LO)) * innerH;
                  const inBag = forest[tIdx].bag.has(pi);
                  const color = CLASS_COLORS[p.label];
                  return (
                    <circle
                      key={`pp${pi}`}
                      cx={px} cy={py}
                      r={inBag ? 1.6 : 1.1}
                      fill={color}
                      opacity={inBag ? 0.95 : 0.35}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Selection hint if enlarged */}
          {!displayingForest && (
            <g
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedTree(null)}
            >
              <rect
                x={PLOT_X0 + PLOT_W - 110} y={PLOT_Y0 + 6}
                width="104" height="18" rx="4"
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="0.8"
              />
              <text
                x={PLOT_X0 + PLOT_W - 58} y={PLOT_Y0 + 18}
                fontSize="9" fill="var(--accent)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >back to forest</text>
            </g>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>RANDOM FOREST</span>
          <span className="mlviz-val">trees {forest.length}</span>
          <span className="mlviz-sub">max depth {maxDepth}</span>
          <span className="mlviz-sub">mtry {mtry}/2</span>
          <span className="mlviz-sub">bag acc {snap(bagAcc * 100, 1)}%</span>
          <span className="mlviz-sub">
            oob err {oob == null ? '—' : `${snap(oob * 100, 1)}%`}
          </span>
          <span className="mlviz-sub">seed {seed}</span>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">tree count</span>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={treeCount}
              onChange={handleTreeCount}
            />
            <span className="mlviz-slider-val">{treeCount}</span>
          </label>
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
          {selectedTree != null && (
            <button
              type="button"
              className="mlviz-btn"
              onClick={() => setSelectedTree(null)}
            >
              <Trees size={13} />
              <span>Show forest</span>
            </button>
          )}
        </div>

        <div className="mlviz-hint">
          Each tree trains on a bootstrap sample (sampling with replacement) and
          picks from a random feature subset at every split, so trees disagree.
          The forest predicts by majority vote — the shaded plot shows where
          trees agree (solid) versus disagree (faded). Out-of-bag error scores
          each point using only the trees that did not see it.
        </div>
      </div>
    </div>
  );
}
