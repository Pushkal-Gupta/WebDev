import React, { useMemo, useState } from 'react';
import { ChevronRight, RotateCcw, MousePointerClick, Search } from 'lucide-react';
import './QuadtreeSpatialViz.css';

// A quadtree indexes 2D points: a node holds up to `capacity` points; the
// (capacity + 1)-th insertion forces it to subdivide into four child quadrants
// (NW, NE, SW, SE) and re-home its points. Inserting fewer points keeps the
// tree shallow; clustered points drive depth up locally. A range query only
// descends into nodes whose bounds intersect the query rectangle.
//
// Deterministic: a fixed preset of points, inserted one-per-step. Clicking the
// canvas adds an extra point but the preset alone drives the whole demo.

// Coordinate space is 0..100 in both axes, mapped to the SVG below.
const SPACE = 100;

const PRESET_POINTS = [
  { x: 20, y: 22 }, { x: 30, y: 28 }, { x: 26, y: 18 }, { x: 22, y: 34 },
  { x: 72, y: 24 }, { x: 80, y: 30 }, { x: 76, y: 16 },
  { x: 18, y: 74 }, { x: 28, y: 80 }, { x: 24, y: 68 }, { x: 35, y: 78 },
  { x: 70, y: 72 }, { x: 84, y: 82 }, { x: 78, y: 66 },
  { x: 50, y: 50 }, { x: 58, y: 44 },
];

// Fixed query rectangle in space coords (x, y, w, h).
const QUERY_RECT = { x: 12, y: 12, w: 32, h: 32 };

function makeNode(x, y, size, depth) {
  return { x, y, size, depth, points: [], children: null };
}

function intersects(node, q) {
  return !(
    node.x > q.x + q.w ||
    node.x + node.size < q.x ||
    node.y > q.y + q.h ||
    node.y + node.size < q.y
  );
}

function pointInRect(p, q) {
  return p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h;
}

// Build the whole tree from the first `count` preset+extra points.
function buildTree(points, capacity) {
  const root = makeNode(0, 0, SPACE, 0);
  let nodeCount = 1;
  let maxDepth = 0;

  const subdivide = (node) => {
    const h = node.size / 2;
    node.children = [
      makeNode(node.x, node.y, h, node.depth + 1),          // NW
      makeNode(node.x + h, node.y, h, node.depth + 1),       // NE
      makeNode(node.x, node.y + h, h, node.depth + 1),       // SW
      makeNode(node.x + h, node.y + h, h, node.depth + 1),   // SE
    ];
    nodeCount += 4;
    maxDepth = Math.max(maxDepth, node.depth + 1);
    const moved = node.points;
    node.points = [];
    moved.forEach((p) => insert(node, p));
  };

  const childFor = (node, p) => {
    const h = node.size / 2;
    const east = p.x >= node.x + h;
    const south = p.y >= node.y + h;
    if (south) return east ? node.children[3] : node.children[2];
    return east ? node.children[1] : node.children[0];
  };

  function insert(node, p) {
    if (node.children) {
      insert(childFor(node, p), p);
      return;
    }
    node.points.push(p);
    // Subdivide past capacity, but cap depth so the demo never recurses forever.
    if (node.points.length > capacity && node.depth < 6) {
      subdivide(node);
    }
  }

  points.forEach((p) => insert(root, p));
  return { root, nodeCount, maxDepth };
}

// Range query: count nodes visited (every node whose bounds we test/descend).
function queryTree(root, q) {
  let visited = 0;
  const found = [];
  const walk = (node) => {
    if (!intersects(node, q)) return;
    visited += 1;
    if (node.children) {
      node.children.forEach(walk);
    } else {
      node.points.forEach((p) => {
        if (pointInRect(p, q)) found.push(p);
      });
    }
  };
  walk(root);
  return { visited, found };
}

// Flatten the tree to a list of leaf+internal rects for drawing borders.
function collectRects(root) {
  const rects = [];
  const walk = (node) => {
    rects.push(node);
    if (node.children) node.children.forEach(walk);
  };
  walk(root);
  return rects;
}

export default function QuadtreeSpatialViz() {
  const [capacity, setCapacity] = useState(2);
  const [step, setStep] = useState(PRESET_POINTS.length);
  const [extra, setExtra] = useState([]);
  const [showQuery, setShowQuery] = useState(true);

  const activePoints = useMemo(() => {
    return [...PRESET_POINTS.slice(0, step), ...extra];
  }, [step, extra]);

  const { root, nodeCount, maxDepth } = useMemo(
    () => buildTree(activePoints, capacity),
    [activePoints, capacity],
  );

  const query = useMemo(
    () => (showQuery ? queryTree(root, QUERY_RECT) : { visited: 0, found: [] }),
    [root, showQuery],
  );

  const rects = useMemo(() => collectRects(root), [root]);

  const reset = () => {
    setCapacity(2);
    setStep(PRESET_POINTS.length);
    setExtra([]);
    setShowQuery(true);
  };

  // SVG geometry
  const PAD = 24;
  const SIZE = 420; // drawing square in px
  const W = SIZE + PAD * 2;
  const H = SIZE + PAD * 2;
  const toPx = (v) => PAD + (v / SPACE) * SIZE;
  const scale = SIZE / SPACE;

  const queriedSet = useMemo(() => {
    const s = new Set();
    query.found.forEach((p) => s.add(`${p.x},${p.y}`));
    return s;
  }, [query.found]);

  const handleCanvasClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const x = ((px - PAD) / SIZE) * SPACE;
    const y = ((py - PAD) / SIZE) * SPACE;
    if (x < 0 || x > SPACE || y < 0 || y > SPACE) return;
    setExtra((prev) => [...prev, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }]);
  };

  const stepNext = () => setStep((s) => Math.min(s + 1, PRESET_POINTS.length));

  return (
    <div className="qtv">
      <div className="qtv-head">
        <h3 className="qtv-title">Quadtree — points that split space as they crowd</h3>
        <p className="qtv-sub">
          Each cell holds up to the capacity in points; one more and it splits into four quadrants and re-homes
          them. Step the preset in or click the square to drop a point. The range query only descends into cells
          its rectangle overlaps.
        </p>
      </div>

      <div className="qtv-controls">
        <label className="qtv-slider">
          <span className="qtv-input-label">capacity {capacity}</span>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </label>

        <button
          type="button"
          className="qtv-btn"
          onClick={stepNext}
          disabled={step >= PRESET_POINTS.length}
        >
          <ChevronRight size={14} /> Insert next ({step}/{PRESET_POINTS.length})
        </button>

        <button
          type="button"
          className="qtv-btn"
          onClick={() => { setStep(0); setExtra([]); }}
        >
          Clear points
        </button>

        <span className="qtv-spacer" aria-hidden="true" />

        <button
          type="button"
          className={`qtv-btn ${showQuery ? 'qtv-btn-primary' : ''}`}
          onClick={() => setShowQuery((v) => !v)}
        >
          <Search size={14} /> {showQuery ? 'Range query on' : 'Range query off'}
        </button>
        <button type="button" className="qtv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="qtv-stage">
        <div className="qtv-hint">
          <MousePointerClick size={13} /> click anywhere on the square to drop a point
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="qtv-svg"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleCanvasClick}
        >
          <defs>
            <linearGradient id="qtv-query-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* outer space border */}
          <rect
            className="qtv-space"
            x={PAD}
            y={PAD}
            width={SIZE}
            height={SIZE}
            rx={6}
          />

          {/* node borders, deepest drawn lighter */}
          {rects.map((n, i) => {
            if (n.depth === 0) return null;
            const visited = showQuery && intersects(n, QUERY_RECT);
            return (
              <rect
                key={`n-${i}`}
                className={`qtv-cell ${visited ? 'is-visited' : ''}`}
                x={toPx(n.x)}
                y={toPx(n.y)}
                width={n.size * scale}
                height={n.size * scale}
                style={{ opacity: 1 - n.depth * 0.07 }}
              />
            );
          })}

          {/* query rectangle */}
          {showQuery && (
            <rect
              className="qtv-query"
              x={toPx(QUERY_RECT.x)}
              y={toPx(QUERY_RECT.y)}
              width={QUERY_RECT.w * scale}
              height={QUERY_RECT.h * scale}
              rx={4}
              fill="url(#qtv-query-fill)"
            />
          )}

          {/* points */}
          {activePoints.map((p, i) => {
            const inQ = showQuery && queriedSet.has(`${p.x},${p.y}`);
            return (
              <circle
                key={`p-${i}`}
                className={`qtv-point ${inQ ? 'is-found' : ''}`}
                cx={toPx(p.x)}
                cy={toPx(p.y)}
                r={inQ ? 6 : 5}
              />
            );
          })}
        </svg>
      </div>

      <div className="qtv-metrics">
        <div className="qtv-metric">
          <span className="qtv-metric-label">points</span>
          <span className="qtv-metric-value">{activePoints.length}</span>
        </div>
        <div className="qtv-metric">
          <span className="qtv-metric-label">nodes</span>
          <span className="qtv-metric-value is-nodes">{nodeCount}</span>
        </div>
        <div className="qtv-metric">
          <span className="qtv-metric-label">max depth</span>
          <span className="qtv-metric-value is-depth">{maxDepth}</span>
        </div>
        <div className="qtv-metric">
          <span className="qtv-metric-label">capacity / cell</span>
          <span className="qtv-metric-value">{capacity}</span>
        </div>
        <div className="qtv-metric">
          <span className="qtv-metric-label">query visited</span>
          <span className="qtv-metric-value is-visited">{showQuery ? query.visited : '—'}</span>
        </div>
        <div className="qtv-metric">
          <span className="qtv-metric-label">query hits</span>
          <span className="qtv-metric-value is-found">{showQuery ? query.found.length : '—'}</span>
        </div>
      </div>

      <div className="qtv-narration">
        <span className="qtv-narration-label">why it matters</span>
        <span className="qtv-narration-body">
          A flat list answers “which points fall in this box?” by scanning all {activePoints.length} of them.
          The quadtree puts dense regions into small cells and leaves empty regions as one big cell, so the same
          query touches only {showQuery ? query.visited : 'the overlapping'} nodes
          {showQuery ? ` and returns ${query.found.length} hits` : ''} — most of space is pruned without ever
          looking inside it. Lower the capacity to force finer cells, raise it to keep the tree shallow.
        </span>
      </div>
    </div>
  );
}
