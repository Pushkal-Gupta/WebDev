import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Crosshair } from 'lucide-react';
import './KdTreeViz.css';

const SEED = 0x5EED;
const N_POINTS = 10;
const PLANE_MIN = 0;
const PLANE_MAX = 100;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildKdTree(points, depth = 0) {
  if (points.length === 0) return null;
  const axis = depth % 2; // 0 = x, 1 = y
  const sorted = points.slice().sort((a, b) => (axis === 0 ? a.x - b.x : a.y - b.y));
  const mid = Math.floor(sorted.length / 2);
  return {
    point: sorted[mid],
    axis,
    depth,
    left: buildKdTree(sorted.slice(0, mid), depth + 1),
    right: buildKdTree(sorted.slice(mid + 1), depth + 1),
  };
}

function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// k-NN search with bounding box tracking for visualization
function knnSearch(root, query, k) {
  const visited = []; // ordered list of visited nodes
  const best = []; // {point, d2}
  const boxes = []; // candidate boxes pruned/explored

  function recurse(node, box) {
    if (!node) return;
    visited.push({ point: node.point, axis: node.axis });
    boxes.push({ ...box });

    const d2 = dist2(query, node.point);
    best.push({ point: node.point, d2 });
    best.sort((a, b) => a.d2 - b.d2);
    if (best.length > k) best.length = k;

    const axis = node.axis;
    const goLeft = axis === 0 ? query.x < node.point.x : query.y < node.point.y;
    const splitVal = axis === 0 ? node.point.x : node.point.y;

    const leftBox = { ...box };
    const rightBox = { ...box };
    if (axis === 0) {
      leftBox.xMax = splitVal;
      rightBox.xMin = splitVal;
    } else {
      leftBox.yMax = splitVal;
      rightBox.yMin = splitVal;
    }

    const nearBox = goLeft ? leftBox : rightBox;
    const farBox = goLeft ? rightBox : leftBox;
    const nearNode = goLeft ? node.left : node.right;
    const farNode = goLeft ? node.right : node.left;

    recurse(nearNode, nearBox);

    // Should we explore far side? Distance from query to far box plane.
    const planeDist = Math.abs((axis === 0 ? query.x : query.y) - splitVal);
    const worstBest = best.length < k ? Infinity : best[best.length - 1].d2;
    if (planeDist * planeDist < worstBest) {
      recurse(farNode, farBox);
    }
  }

  recurse(root, { xMin: PLANE_MIN, xMax: PLANE_MAX, yMin: PLANE_MIN, yMax: PLANE_MAX });

  return { visited, best, boxes };
}

function layoutKdTree(root) {
  const positions = new Map();
  if (!root) return positions;

  const order = [];
  let inorderIdx = 0;
  let maxDepth = 0;
  const walk = (node) => {
    if (!node) return;
    walk(node.left);
    positions.set(node.point.id, { x: inorderIdx++, depth: node.depth });
    if (node.depth > maxDepth) maxDepth = node.depth;
    walk(node.right);
  };
  walk(root);
  return { positions, maxDepth };
}

export default function KdTreeViz() {
  const points = useMemo(() => {
    const rng = mulberry32(SEED);
    return Array.from({ length: N_POINTS }, (_, i) => ({
      id: i,
      x: Math.round(rng() * (PLANE_MAX - 10) + 5),
      y: Math.round(rng() * (PLANE_MAX - 10) + 5),
    }));
  }, []);

  const root = useMemo(() => buildKdTree(points), [points]);
  const { positions, maxDepth } = useMemo(() => layoutKdTree(root), [root]);

  const [query, setQuery] = useState({ x: 50, y: 50 });
  const [k, setK] = useState(3);
  const [dragging, setDragging] = useState(false);
  const planeRef = useRef(null);

  const { visited, best, boxes } = useMemo(() => knnSearch(root, query, k), [root, query, k]);

  // Plane SVG
  const planeW = 360;
  const planeH = 360;
  const planePad = 24;
  const planeSize = planeW - planePad * 2;
  const px = (x) => planePad + (x / PLANE_MAX) * planeSize;
  const py = (y) => planePad + (1 - y / PLANE_MAX) * planeSize;

  const onPlanePointer = (e) => {
    if (!planeRef.current) return;
    const rect = planeRef.current.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * planeW;
    const sy = ((e.clientY - rect.top) / rect.height) * planeH;
    const qx = Math.max(0, Math.min(PLANE_MAX, ((sx - planePad) / planeSize) * PLANE_MAX));
    const qy = Math.max(0, Math.min(PLANE_MAX, (1 - (sy - planePad) / planeSize) * PLANE_MAX));
    setQuery({ x: Math.round(qx), y: Math.round(qy) });
  };

  // Split lines (recursive draw)
  const splits = [];
  const collectSplits = (node, box) => {
    if (!node) return;
    if (node.axis === 0) {
      splits.push({
        x1: px(node.point.x),
        y1: py(box.yMax),
        x2: px(node.point.x),
        y2: py(box.yMin),
        depth: node.depth,
      });
      collectSplits(node.left, { ...box, xMax: node.point.x });
      collectSplits(node.right, { ...box, xMin: node.point.x });
    } else {
      splits.push({
        x1: px(box.xMin),
        y1: py(node.point.y),
        x2: px(box.xMax),
        y2: py(node.point.y),
        depth: node.depth,
      });
      collectSplits(node.left, { ...box, yMax: node.point.y });
      collectSplits(node.right, { ...box, yMin: node.point.y });
    }
  };
  collectSplits(root, { xMin: PLANE_MIN, xMax: PLANE_MAX, yMin: PLANE_MIN, yMax: PLANE_MAX });

  const visitedIds = new Set(visited.map((v) => v.point.id));
  const bestIds = new Set(best.map((b) => b.point.id));

  // Tree SVG layout
  const treeW = 520;
  const cols = positions.size || 1;
  const treePadX = 30;
  const treePadY = 30;
  const xStep = (treeW - treePadX * 2) / Math.max(cols - 1, 1);
  const yStep = 60;
  const treeH = treePadY * 2 + maxDepth * yStep + 60;

  const nodeXY = (id) => {
    const p = positions.get(id);
    if (!p) return null;
    const x = cols === 1 ? treeW / 2 : treePadX + p.x * xStep;
    const y = treePadY + p.depth * yStep + 16;
    return { x, y };
  };

  const treeEdges = [];
  const collectEdges = (node) => {
    if (!node) return;
    if (node.left) {
      treeEdges.push([node.point.id, node.left.point.id]);
      collectEdges(node.left);
    }
    if (node.right) {
      treeEdges.push([node.point.id, node.right.point.id]);
      collectEdges(node.right);
    }
  };
  collectEdges(root);

  // Build a per-axis count for traversal description
  const reset = () => {
    setQuery({ x: 50, y: 50 });
    setK(3);
  };

  return (
    <div className="kdt">
      <div className="kdt-head">
        <h3 className="kdt-title">k-d tree — recursive axis-aligned splits</h3>
        <p className="kdt-sub">
          Each node splits on x (even depth) or y (odd depth). Drag the query point and slide k to see the
          k-nearest-neighbors search prune branches it can't beat.
        </p>
      </div>

      <div className="kdt-controls">
        <div className="kdt-field">
          <span className="kdt-label">k (neighbors)</span>
          <input
            type="range"
            min={1}
            max={Math.min(7, N_POINTS)}
            step={1}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="kdt-range"
          />
          <span className="kdt-value">k = {k}</span>
        </div>

        <div className="kdt-field">
          <span className="kdt-label">query x</span>
          <input
            type="range"
            min={0}
            max={PLANE_MAX}
            step={1}
            value={query.x}
            onChange={(e) => setQuery((q) => ({ ...q, x: Number(e.target.value) }))}
            className="kdt-range"
          />
          <span className="kdt-value">x = {query.x}</span>
        </div>

        <div className="kdt-field">
          <span className="kdt-label">query y</span>
          <input
            type="range"
            min={0}
            max={PLANE_MAX}
            step={1}
            value={query.y}
            onChange={(e) => setQuery((q) => ({ ...q, y: Number(e.target.value) }))}
            className="kdt-range"
          />
          <span className="kdt-value">y = {query.y}</span>
        </div>

        <div className="kdt-buttons">
          <button type="button" className="kdt-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="kdt-stage">
        <div className="kdt-panel">
          <span className="kdt-panel-title">2D plane — drag the crosshair</span>
          <svg
            ref={planeRef}
            viewBox={`0 0 ${planeW} ${planeH}`}
            className="kdt-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={(e) => {
              setDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              onPlanePointer(e);
            }}
            onPointerMove={(e) => { if (dragging) onPlanePointer(e); }}
            onPointerUp={(e) => {
              setDragging(false);
              try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
            }}
          >
            {/* Plane background */}
            <rect
              x={planePad}
              y={planePad}
              width={planeSize}
              height={planeSize}
              fill="var(--bg)"
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* Axis labels */}
            <text x={planeW / 2} y={planeH - 4} className="kdt-axis-label" textAnchor="middle">x</text>
            <text x={6} y={planeH / 2} className="kdt-axis-label">y</text>

            {/* Split lines */}
            {splits.map((s, i) => (
              <line
                key={`split-${i}`}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke={s.depth % 2 === 0 ? 'var(--hue-sky)' : 'var(--hue-pink)'}
                strokeWidth={1.2}
                strokeOpacity={0.55}
                strokeDasharray="3 3"
              />
            ))}

            {/* Search bounding boxes (faint) */}
            {boxes.map((b, i) => (
              <rect
                key={`box-${i}`}
                x={px(b.xMin)}
                y={py(b.yMax)}
                width={px(b.xMax) - px(b.xMin)}
                height={py(b.yMin) - py(b.yMax)}
                fill="rgba(var(--accent-rgb), 0.04)"
                stroke="var(--accent)"
                strokeWidth={0.8}
                strokeOpacity={0.3}
                strokeDasharray="2 2"
              />
            ))}

            {/* Best-k circle (worst of k radius) */}
            {best.length > 0 && (
              <circle
                cx={px(query.x)}
                cy={py(query.y)}
                r={(Math.sqrt(best[best.length - 1].d2) / PLANE_MAX) * planeSize}
                fill="rgba(var(--easy-rgb, 34, 197, 94), 0.08)"
                stroke="var(--easy)"
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
            )}

            {/* Points */}
            {points.map((p) => {
              const isBest = bestIds.has(p.id);
              const isVisited = visitedIds.has(p.id);
              return (
                <g key={`pt-${p.id}`}>
                  <circle
                    cx={px(p.x)}
                    cy={py(p.y)}
                    r={isBest ? 7 : 5}
                    fill={isBest ? 'var(--easy)' : isVisited ? 'var(--accent)' : 'var(--surface)'}
                    stroke={isBest ? 'var(--easy)' : isVisited ? 'var(--accent)' : 'var(--text-dim)'}
                    strokeWidth={1.5}
                  />
                  <text x={px(p.x) + 8} y={py(p.y) - 6} fontSize={9} fontFamily="var(--mono)" fill="var(--text-dim)">
                    {p.id}
                  </text>
                </g>
              );
            })}

            {/* Query point */}
            <g>
              <circle
                cx={px(query.x)}
                cy={py(query.y)}
                r={6}
                fill="var(--hard)"
                stroke="var(--bg)"
                strokeWidth={2}
              />
              <line x1={px(query.x) - 9} y1={py(query.y)} x2={px(query.x) + 9} y2={py(query.y)} stroke="var(--hard)" strokeWidth={1.4} />
              <line x1={px(query.x)} y1={py(query.y) - 9} x2={px(query.x)} y2={py(query.y) + 9} stroke="var(--hard)" strokeWidth={1.4} />
            </g>
          </svg>
        </div>

        <div className="kdt-panel">
          <span className="kdt-panel-title">tree (sky = x-split, pink = y-split)</span>
          <svg
            viewBox={`0 0 ${treeW} ${treeH}`}
            className="kdt-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {treeEdges.map(([a, b], i) => {
              const A = nodeXY(a);
              const B = nodeXY(b);
              if (!A || !B) return null;
              const both = visitedIds.has(a) && visitedIds.has(b);
              return (
                <line
                  key={`te-${i}`}
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke={both ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={both ? 2 : 1.4}
                />
              );
            })}

            {Array.from(positions.entries()).map(([id]) => {
              const p = nodeXY(id);
              if (!p) return null;
              const pt = points.find((pp) => pp.id === id);
              const isBest = bestIds.has(id);
              const isVisited = visitedIds.has(id);
              // depth/axis lookup
              let nodeRef = null;
              const find = (node) => {
                if (!node) return;
                if (node.point.id === id) { nodeRef = node; return; }
                find(node.left); find(node.right);
              };
              find(root);
              const axis = nodeRef ? nodeRef.axis : 0;
              return (
                <g key={`tn-${id}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={18}
                    fill={
                      isBest
                        ? 'rgba(var(--easy-rgb, 34, 197, 94), 0.16)'
                        : isVisited
                        ? 'rgba(var(--accent-rgb), 0.16)'
                        : 'var(--surface)'
                    }
                    stroke={isBest ? 'var(--easy)' : isVisited ? 'var(--accent)' : axis === 0 ? 'var(--hue-sky)' : 'var(--hue-pink)'}
                    strokeWidth={isBest || isVisited ? 2.2 : 1.4}
                  />
                  <text x={p.x} y={p.y - 1} className="kdt-node-key">
                    {pt.x},{pt.y}
                  </text>
                  <text x={p.x} y={p.y + 12} className="kdt-node-axis">
                    {axis === 0 ? 'x' : 'y'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="kdt-metrics">
        <div className="kdt-metric">
          <span className="kdt-metric-label">visited</span>
          <span className="kdt-metric-value">{visited.length}</span>
        </div>
        <div className="kdt-metric">
          <span className="kdt-metric-label">pruned</span>
          <span className="kdt-metric-value">{N_POINTS - visited.length}</span>
        </div>
        <div className="kdt-metric">
          <span className="kdt-metric-label">best dist</span>
          <span className="kdt-metric-value">
            {best.length ? Math.sqrt(best[0].d2).toFixed(1) : '—'}
          </span>
        </div>
        <div className="kdt-metric">
          <span className="kdt-metric-label">worst of k</span>
          <span className="kdt-metric-value">
            {best.length ? Math.sqrt(best[best.length - 1].d2).toFixed(1) : '—'}
          </span>
        </div>
        <div className="kdt-metric kdt-metric-dim">
          <span className="kdt-metric-label">query</span>
          <span className="kdt-metric-value kdt-metric-dimval">
            ({query.x}, {query.y})
          </span>
        </div>
      </div>

      <div className="kdt-arith">
        <span className="kdt-arith-label">trace</span>
        <span className="kdt-arith-vals">
          <Crosshair size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Visited {visited.length}/{N_POINTS} nodes. Best {k} = [{best.map((b) => `(${b.point.x},${b.point.y})`).join(', ')}].
          Pruning skips subtrees whose bounding box can't fit a point closer than the current worst-of-k.
        </span>
      </div>
    </div>
  );
}
