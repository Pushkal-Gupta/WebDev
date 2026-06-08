import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Flag,
  Target,
  Brush,
  Eraser,
  Check,
} from 'lucide-react';
import './AStarViz.css';

const MIN_DIM = 8;
const MAX_DIM = 15;
const DEFAULT_DIM = 10;
const TICK_MS = 220;

const MODES = [
  { id: 'start', label: 'Set start', icon: Flag },
  { id: 'goal', label: 'Set goal', icon: Target },
  { id: 'paint', label: 'Paint walls', icon: Brush },
  { id: 'erase', label: 'Erase walls', icon: Eraser },
];

function clampDim(value) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return DEFAULT_DIM;
  if (n < MIN_DIM) return MIN_DIM;
  if (n > MAX_DIM) return MAX_DIM;
  return n;
}

function key(r, c) {
  return `${r},${c}`;
}

function manhattan(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

function makeEmptyWalls(dim) {
  return new Set();
}

function defaultStartGoal(dim) {
  return {
    start: { r: 1, c: 1 },
    goal: { r: dim - 2, c: dim - 2 },
  };
}

function defaultWalls(dim) {
  const walls = new Set();
  // Carve a few wall segments so the demo shows pathing right away.
  const segments = [
    // vertical wall with a gap in the middle
    Array.from({ length: dim - 4 }, (_, i) => [i + 2, Math.floor(dim / 2)]).filter(
      ([r]) => r !== Math.floor(dim / 2)
    ),
    // shorter horizontal wall
    Array.from({ length: Math.floor(dim / 2) }, (_, i) => [Math.floor(dim / 3), i + 1]),
  ];
  segments.forEach((seg) => seg.forEach(([r, c]) => walls.add(key(r, c))));
  return walls;
}

// Priority queue (binary min-heap) keyed on f, tie-break g (lower g first).
function pqPush(heap, item) {
  heap.push(item);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (compare(heap[i], heap[p]) < 0) {
      [heap[i], heap[p]] = [heap[p], heap[i]];
      i = p;
    } else break;
  }
}

function pqPop(heap) {
  if (heap.length === 0) return null;
  const top = heap[0];
  const last = heap.pop();
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    const n = heap.length;
    while (true) {
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      let best = i;
      if (l < n && compare(heap[l], heap[best]) < 0) best = l;
      if (r < n && compare(heap[r], heap[best]) < 0) best = r;
      if (best === i) break;
      [heap[i], heap[best]] = [heap[best], heap[i]];
      i = best;
    }
  }
  return top;
}

function compare(a, b) {
  if (a.f !== b.f) return a.f - b.f;
  if (a.h !== b.h) return a.h - b.h;
  return a.seq - b.seq;
}

function buildSteps({ dim, start, goal, walls }) {
  const steps = [];
  if (!start || !goal || start.r === undefined || goal.r === undefined) {
    steps.push({
      kind: 'idle',
      open: [],
      closed: [],
      gScore: {},
      fScore: {},
      hScore: {},
      current: null,
      neighbor: null,
      path: [],
      found: false,
      noPath: false,
      caption: 'Place a start and a goal to begin.',
    });
    return steps;
  }

  if (walls.has(key(start.r, start.c)) || walls.has(key(goal.r, goal.c))) {
    steps.push({
      kind: 'idle',
      open: [],
      closed: [],
      gScore: {},
      fScore: {},
      hScore: {},
      current: null,
      neighbor: null,
      path: [],
      found: false,
      noPath: true,
      caption: 'Start or goal sits on a wall. Move it to an open cell.',
    });
    return steps;
  }

  const gScore = {};
  const fScore = {};
  const hScore = {};
  const cameFrom = {};
  const closed = new Set();
  const openSet = new Set();
  const heap = [];
  let seq = 0;

  const startKey = key(start.r, start.c);
  const goalKey = key(goal.r, goal.c);
  const h0 = manhattan(start, goal);
  gScore[startKey] = 0;
  hScore[startKey] = h0;
  fScore[startKey] = h0;
  pqPush(heap, { r: start.r, c: start.c, f: h0, g: 0, h: h0, seq: seq++ });
  openSet.add(startKey);

  steps.push({
    kind: 'init',
    open: [...openSet],
    closed: [],
    gScore: { ...gScore },
    fScore: { ...fScore },
    hScore: { ...hScore },
    current: null,
    neighbor: null,
    path: [],
    found: false,
    noPath: false,
    caption: `Initialize: push start (${start.r}, ${start.c}) with f = g + h = 0 + ${h0} = ${h0}.`,
  });

  const DIRS = [
    [-1, 0, 'up'],
    [1, 0, 'down'],
    [0, -1, 'left'],
    [0, 1, 'right'],
  ];

  let found = false;
  let noPath = false;
  let finalPath = [];

  const MAX_STEPS = dim * dim * 8 + 64;
  let safety = 0;

  while (heap.length > 0 && safety < MAX_STEPS) {
    safety += 1;
    const cur = pqPop(heap);
    const curKey = key(cur.r, cur.c);
    if (!openSet.has(curKey)) continue;
    openSet.delete(curKey);
    // Stale entry: if popped g is larger than known g, skip.
    if (cur.g > gScore[curKey]) continue;

    steps.push({
      kind: 'pop',
      open: [...openSet],
      closed: [...closed],
      gScore: { ...gScore },
      fScore: { ...fScore },
      hScore: { ...hScore },
      current: { r: cur.r, c: cur.c },
      neighbor: null,
      path: [],
      found: false,
      noPath: false,
      caption: `Pop lowest-f node (${cur.r}, ${cur.c}): f = ${cur.f}, g = ${cur.g}, h = ${cur.h}.`,
    });

    if (cur.r === goal.r && cur.c === goal.c) {
      // Reconstruct path
      const path = [];
      let k = curKey;
      while (k) {
        const [pr, pc] = k.split(',').map(Number);
        path.push({ r: pr, c: pc });
        k = cameFrom[k];
      }
      path.reverse();
      finalPath = path;
      found = true;
      steps.push({
        kind: 'found',
        open: [...openSet],
        closed: [...closed, curKey],
        gScore: { ...gScore },
        fScore: { ...fScore },
        hScore: { ...hScore },
        current: { r: cur.r, c: cur.c },
        neighbor: null,
        path,
        found: true,
        noPath: false,
        caption: `Goal reached. Reconstruct path: ${path.length} cells, total cost ${cur.g}.`,
      });
      break;
    }

    closed.add(curKey);

    for (const [dr, dc] of DIRS) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (nr < 0 || nc < 0 || nr >= dim || nc >= dim) continue;
      const nKey = key(nr, nc);
      if (walls.has(nKey)) continue;
      if (closed.has(nKey)) continue;
      const tentativeG = cur.g + 1;
      const prevG = gScore[nKey];
      const better = prevG === undefined || tentativeG < prevG;
      if (better) {
        cameFrom[nKey] = curKey;
        gScore[nKey] = tentativeG;
        const h = manhattan({ r: nr, c: nc }, goal);
        hScore[nKey] = h;
        const f = tentativeG + h;
        fScore[nKey] = f;
        pqPush(heap, { r: nr, c: nc, f, g: tentativeG, h, seq: seq++ });
        openSet.add(nKey);
        steps.push({
          kind: 'relax',
          open: [...openSet],
          closed: [...closed],
          gScore: { ...gScore },
          fScore: { ...fScore },
          hScore: { ...hScore },
          current: { r: cur.r, c: cur.c },
          neighbor: { r: nr, c: nc },
          path: [],
          found: false,
          noPath: false,
          caption:
            prevG === undefined
              ? `Discover (${nr}, ${nc}): g = ${tentativeG}, h = ${h}, f = ${f}. Push to open set.`
              : `Improve (${nr}, ${nc}): g ${prevG} -> ${tentativeG}, h = ${h}, f = ${f}. Reinsert.`,
        });
      }
    }
  }

  if (!found) {
    noPath = true;
    steps.push({
      kind: 'no-path',
      open: [],
      closed: [...closed],
      gScore: { ...gScore },
      fScore: { ...fScore },
      hScore: { ...hScore },
      current: null,
      neighbor: null,
      path: [],
      found: false,
      noPath: true,
      caption: 'Open set exhausted with no path to the goal. Walls fully enclose start or goal.',
    });
  }

  return steps;
}

export default function AStarViz() {
  const [dim, setDim] = useState(DEFAULT_DIM);
  const [mode, setMode] = useState('paint');
  const [start, setStart] = useState(() => defaultStartGoal(DEFAULT_DIM).start);
  const [goal, setGoal] = useState(() => defaultStartGoal(DEFAULT_DIM).goal);
  const [walls, setWalls] = useState(() => defaultWalls(DEFAULT_DIM));
  const [dragPaint, setDragPaint] = useState(null); // 'add' | 'remove' | null
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const steps = useMemo(
    () => buildSteps({ dim, start, goal, walls }),
    [dim, start, goal, walls]
  );

  // Reset playhead when grid or set of obstacles changes.
  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [dim, start, goal, walls]);

  const step = steps[Math.min(idx, steps.length - 1)] || steps[0];
  const atEnd = idx >= steps.length - 1;

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= steps.length - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setInterval(() => {
      next();
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  useEffect(() => {
    if (idx >= steps.length - 1 && playing) setPlaying(false);
  }, [idx, steps.length, playing]);

  const handleDimChange = (raw) => {
    const next = clampDim(raw);
    if (next === dim) return;
    const fresh = defaultStartGoal(next);
    setDim(next);
    setStart(fresh.start);
    setGoal(fresh.goal);
    setWalls(makeEmptyWalls(next));
  };

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const handleClearWalls = () => {
    setWalls(makeEmptyWalls(dim));
  };

  const handleCellDown = (r, c) => {
    const k = key(r, c);
    if (mode === 'start') {
      if (walls.has(k)) return;
      if (goal.r === r && goal.c === c) return;
      setStart({ r, c });
      return;
    }
    if (mode === 'goal') {
      if (walls.has(k)) return;
      if (start.r === r && start.c === c) return;
      setGoal({ r, c });
      return;
    }
    if (mode === 'paint') {
      if (start.r === r && start.c === c) return;
      if (goal.r === r && goal.c === c) return;
      setWalls((prev) => {
        const next = new Set(prev);
        next.add(k);
        return next;
      });
      setDragPaint('add');
      return;
    }
    if (mode === 'erase') {
      setWalls((prev) => {
        if (!prev.has(k)) return prev;
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
      setDragPaint('remove');
    }
  };

  const handleCellEnter = (r, c) => {
    if (!dragPaint) return;
    const k = key(r, c);
    if (dragPaint === 'add') {
      if (start.r === r && start.c === c) return;
      if (goal.r === r && goal.c === c) return;
      setWalls((prev) => {
        if (prev.has(k)) return prev;
        const next = new Set(prev);
        next.add(k);
        return next;
      });
    } else if (dragPaint === 'remove') {
      setWalls((prev) => {
        if (!prev.has(k)) return prev;
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
    }
  };

  const stopDrag = useCallback(() => setDragPaint(null), []);

  useEffect(() => {
    if (!dragPaint) return undefined;
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseleave', stopDrag);
    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('mouseleave', stopDrag);
    };
  }, [dragPaint, stopDrag]);

  const openSet = useMemo(() => new Set(step.open), [step.open]);
  const closedSet = useMemo(() => new Set(step.closed), [step.closed]);
  const pathSet = useMemo(
    () => new Set(step.path.map((p) => key(p.r, p.c))),
    [step.path]
  );
  const expansions = step.closed.length;
  const openCount = step.open.length;

  // Compute SVG sizing.
  const CELL = 38;
  const GAP = 2;
  const PAD = 6;
  const boardSize = dim * CELL + (dim - 1) * GAP + PAD * 2;

  return (
    <div className="astarviz">
      <div className="astarviz-header">
        <div className="astarviz-title">A* pathfinding</div>
        <div className="astarviz-dim">
          <label htmlFor="astarviz-dim">Grid</label>
          <input
            id="astarviz-dim"
            type="number"
            min={MIN_DIM}
            max={MAX_DIM}
            value={dim}
            onChange={(e) => handleDimChange(e.target.value)}
          />
          <span className="astarviz-dim-x">x</span>
          <span className="astarviz-dim-val">{dim}</span>
        </div>
      </div>

      <div className="astarviz-modes" role="toolbar" aria-label="Edit mode">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              className={`astarviz-mode ${active ? 'astarviz-mode-active' : ''}`}
              onClick={() => setMode(m.id)}
              aria-pressed={active}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{m.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="astarviz-mode astarviz-mode-ghost"
          onClick={handleClearWalls}
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Clear walls</span>
        </button>
      </div>

      <div className="astarviz-legend">
        <span className="astarviz-legend-item">
          <span className="astarviz-swatch astarviz-swatch-start" /> start
        </span>
        <span className="astarviz-legend-item">
          <span className="astarviz-swatch astarviz-swatch-goal" /> goal
        </span>
        <span className="astarviz-legend-item">
          <span className="astarviz-swatch astarviz-swatch-wall" /> wall
        </span>
        <span className="astarviz-legend-item">
          <span className="astarviz-swatch astarviz-swatch-open" /> in open set
        </span>
        <span className="astarviz-legend-item">
          <span className="astarviz-swatch astarviz-swatch-closed" /> visited
        </span>
        <span className="astarviz-legend-item">
          <span className="astarviz-swatch astarviz-swatch-current" /> expanding
        </span>
        <span className="astarviz-legend-item">
          <span className="astarviz-swatch astarviz-swatch-path" /> final path
        </span>
      </div>

      <div className="astarviz-stage">
        <svg
          className="astarviz-svg"
          viewBox={`0 0 ${boardSize} ${boardSize}`}
          role="img"
          aria-label={`A* pathfinding on ${dim} by ${dim} grid`}
        >
          {Array.from({ length: dim }).map((_, r) =>
            Array.from({ length: dim }).map((__, c) => {
              const k = key(r, c);
              const x = PAD + c * (CELL + GAP);
              const y = PAD + r * (CELL + GAP);
              const isStart = start.r === r && start.c === c;
              const isGoal = goal.r === r && goal.c === c;
              const isWall = walls.has(k);
              const inOpen = openSet.has(k);
              const inClosed = closedSet.has(k);
              const isCurrent =
                step.current && step.current.r === r && step.current.c === c;
              const isNeighbor =
                step.neighbor && step.neighbor.r === r && step.neighbor.c === c;
              const inPath = pathSet.has(k);

              let cellClass = 'astarviz-cell';
              if (isWall) cellClass += ' astarviz-cell-wall';
              else if (inPath) cellClass += ' astarviz-cell-path';
              else if (isCurrent) cellClass += ' astarviz-cell-current';
              else if (isNeighbor) cellClass += ' astarviz-cell-neighbor';
              else if (inClosed) cellClass += ' astarviz-cell-closed';
              else if (inOpen) cellClass += ' astarviz-cell-open';
              if (isStart) cellClass += ' astarviz-cell-start';
              if (isGoal) cellClass += ' astarviz-cell-goal';

              const g = step.gScore[k];
              const h = step.hScore[k];
              const f = step.fScore[k];
              const showScores =
                !isWall && (g !== undefined || h !== undefined || f !== undefined);

              return (
                <g
                  key={k}
                  transform={`translate(${x},${y})`}
                  className={cellClass}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCellDown(r, c);
                  }}
                  onMouseEnter={() => handleCellEnter(r, c)}
                  role="button"
                  tabIndex={-1}
                  aria-label={`Cell ${r}, ${c}${
                    isWall
                      ? ', wall'
                      : isStart
                        ? ', start'
                        : isGoal
                          ? ', goal'
                          : inPath
                            ? ', path'
                            : inClosed
                              ? ', visited'
                              : inOpen
                                ? ', in open set'
                                : ''
                  }`}
                >
                  <rect
                    className="astarviz-cell-rect"
                    width={CELL}
                    height={CELL}
                    rx={4}
                  />
                  {isStart && (
                    <g className="astarviz-marker" transform={`translate(${CELL / 2},${CELL / 2})`}>
                      <text
                        className="astarviz-marker-text"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        S
                      </text>
                    </g>
                  )}
                  {isGoal && (
                    <g className="astarviz-marker" transform={`translate(${CELL / 2},${CELL / 2})`}>
                      <text
                        className="astarviz-marker-text"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        G
                      </text>
                    </g>
                  )}
                  {!isStart && !isGoal && showScores && (
                    <g className="astarviz-scores">
                      <text
                        className="astarviz-score astarviz-score-f"
                        x={CELL / 2}
                        y={CELL / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {f !== undefined ? f : ''}
                      </text>
                      <text
                        className="astarviz-score astarviz-score-g"
                        x={3}
                        y={3}
                        textAnchor="start"
                        dominantBaseline="hanging"
                      >
                        {g !== undefined ? `g${g}` : ''}
                      </text>
                      <text
                        className="astarviz-score astarviz-score-h"
                        x={CELL - 3}
                        y={3}
                        textAnchor="end"
                        dominantBaseline="hanging"
                      >
                        {h !== undefined ? `h${h}` : ''}
                      </text>
                    </g>
                  )}
                  {isCurrent && (
                    <rect
                      className="astarviz-cell-ring"
                      x={-1.5}
                      y={-1.5}
                      width={CELL + 3}
                      height={CELL + 3}
                      rx={6}
                    />
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>

      <div className="astarviz-status">
        <div className="astarviz-status-row">
          <span className="astarviz-status-label">Step</span>
          <span className="astarviz-status-value">
            {idx} / {steps.length - 1}
          </span>
        </div>
        <div className="astarviz-status-row">
          <span className="astarviz-status-label">Open</span>
          <span className="astarviz-status-value">{openCount}</span>
        </div>
        <div className="astarviz-status-row">
          <span className="astarviz-status-label">Visited</span>
          <span className="astarviz-status-value">{expansions}</span>
        </div>
        <div className="astarviz-status-row">
          <span className="astarviz-status-label">Path</span>
          <span className="astarviz-status-value">
            {step.found ? `${step.path.length} cells` : (
              <span className="astarviz-muted">{step.noPath ? 'none' : 'searching'}</span>
            )}
          </span>
        </div>
      </div>

      <p className="astarviz-caption">
        {step.found && <Check size={14} className="astarviz-caption-icon" aria-hidden="true" />}
        <span>{step.caption}</span>
      </p>

      <div className="astarviz-controls">
        <button
          type="button"
          className="astarviz-btn astarviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="astarviz-btn astarviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="astarviz-btn astarviz-btn-secondary"
          onClick={next}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
      </div>
    </div>
  );
}
