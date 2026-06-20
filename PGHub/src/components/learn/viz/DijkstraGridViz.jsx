import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './DijkstraGridViz.css';

const COLS = 10;
const ROWS = 8;
const START = { c: 1, r: 6 };
const GOAL = { c: 8, r: 1 };
const WALL = -1;

// Terrain weights 1-9 (cost to ENTER the cell). WALL (-1) is impassable.
// A varied landscape so the lowest-cost route is not a straight line.
const DEFAULT_WEIGHTS = [
  [1, 1, 1, 2, 9, 9, 1, 1, 1, 1],
  [1, 3, 3, 2, 9, 1, 1, 4, 1, 1],
  [1, 3, WALL, WALL, WALL, 1, 6, 4, 1, 1],
  [1, 3, 1, 1, 5, 1, 6, WALL, WALL, 1],
  [1, 1, 1, 5, 5, 1, 6, 1, 1, 1],
  [1, 7, 7, 5, 1, 1, 1, 1, 2, 1],
  [1, 1, 7, 1, 1, 8, 8, 1, 2, 1],
  [1, 1, 1, 1, 1, 8, 1, 1, 1, 1],
];

const key = (c, r) => `${c},${r}`;

function buildFrames(grid) {
  const frames = [];
  const dist = {};
  const parent = {};
  const settled = new Set();
  const inFrontier = new Set();

  const sk = key(START.c, START.r);
  dist[sk] = 0;
  inFrontier.add(sk);

  const snap = (extra) => ({
    frontier: new Set(inFrontier),
    settled: new Set(settled),
    dist: { ...dist },
    current: null,
    relaxed: [],
    path: [],
    pathCost: null,
    note: '',
    found: false,
    ...extra,
  });

  frames.push(
    snap({
      note: `Start at (${START.c},${START.r}) with dist=0. Frontier holds the start only; every other cell is dist=∞.`,
    }),
  );

  const NEI = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  let foundGoal = false;
  let safety = 0;

  while (inFrontier.size > 0 && safety < 600) {
    safety += 1;
    // Pop the frontier cell with the smallest cumulative distance (PQ order).
    let bestK = null;
    let bestD = Infinity;
    for (const k of inFrontier) {
      if (dist[k] < bestD - 1e-9) {
        bestD = dist[k];
        bestK = k;
      }
    }
    const [cc, cr] = bestK.split(',').map(Number);
    inFrontier.delete(bestK);
    settled.add(bestK);

    if (bestK === key(GOAL.c, GOAL.r)) {
      const path = [];
      let p = bestK;
      while (p !== undefined) {
        path.push(p);
        p = parent[p];
      }
      path.reverse();
      frames.push(
        snap({
          current: bestK,
          path,
          pathCost: dist[bestK],
          found: true,
          note: `Pop goal (${cc},${cr}) dist=${dist[bestK]} — it is settled, so this is the cheapest route. Trace ${path.length} cells back via parents; path cost = ${dist[bestK]}.`,
        }),
      );
      foundGoal = true;
      break;
    }

    const relaxed = [];
    const relaxNotes = [];
    for (const [dc, dr] of NEI) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const w = grid[nr][nc];
      if (w === WALL) continue;
      const nk = key(nc, nr);
      if (settled.has(nk)) continue;
      const cand = dist[bestK] + w;
      if (!(nk in dist) || cand < dist[nk]) {
        const prev = nk in dist ? dist[nk] : '∞';
        parent[nk] = bestK;
        dist[nk] = cand;
        inFrontier.add(nk);
        relaxed.push(nk);
        relaxNotes.push(`(${nc},${nr}): ${dist[bestK]}+${w}=${cand} < ${prev}`);
      }
    }

    frames.push(
      snap({
        current: bestK,
        relaxed,
        note: relaxed.length
          ? `Pop (${cc},${cr}) dist=${dist[bestK]} (smallest in frontier); relax ${relaxNotes.join('; ')}.`
          : `Pop (${cc},${cr}) dist=${dist[bestK]}; no neighbour improves (walls / already settled / no shorter path).`,
      }),
    );
  }

  if (!foundGoal) {
    frames.push(snap({ note: 'Frontier drained without reaching the goal — walls seal off every route.' }));
  }

  return frames;
}

export default function DijkstraGridViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [editMode, setEditMode] = useState('wall');
  const [grid, setGrid] = useState(() => DEFAULT_WEIGHTS.map((row) => [...row]));
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(grid), [grid]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

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

  const editCell = (c, r) => {
    const k = key(c, r);
    if (k === key(START.c, START.r) || k === key(GOAL.c, GOAL.r)) return;
    setIsRunningRaw(false);
    setStep(0);
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      const cur = next[r][c];
      if (editMode === 'wall') {
        next[r][c] = cur === WALL ? 1 : WALL;
      } else {
        // Cycle weight 1..9, skipping wall -> back to 1.
        next[r][c] = cur === WALL ? 1 : (cur % 9) + 1;
      }
      return next;
    });
  };

  // Grid geometry.
  const GP = 30;
  const TP = 36;
  const CELL = 40;
  const gridW = COLS * CELL;
  const gridH = ROWS * CELL;
  const W = 940;
  const H = TP + gridH + 18;
  const panelX = GP + gridW + 24;
  const panelW = W - panelX - 24;

  const pathSet = useMemo(() => new Set(current.path), [current.path]);
  const relaxedSet = useMemo(() => new Set(current.relaxed), [current.relaxed]);

  const cellFill = (k, w) => {
    if (k === key(START.c, START.r)) return 'var(--easy)';
    if (k === key(GOAL.c, GOAL.r)) return 'var(--hard)';
    if (w === WALL) return 'var(--text-dim)';
    if (pathSet.has(k)) return 'var(--accent)';
    if (k === current.current) return 'var(--hue-pink)';
    if (relaxedSet.has(k)) return 'var(--hue-mint)';
    if (current.frontier.has(k)) return 'rgba(var(--accent-rgb), 0.20)';
    if (current.settled.has(k)) return 'rgba(var(--accent-rgb), 0.06)';
    return 'var(--bg)';
  };

  const labelDark = (k, w) => {
    if (w === WALL) return true;
    if (k === key(START.c, START.r) || k === key(GOAL.c, GOAL.r)) return true;
    if (pathSet.has(k) || k === current.current) return true;
    return false;
  };

  // Live readout for the current popped cell.
  const cur = current.current;
  const curD = cur ? current.dist[cur] : null;
  const [curC, curR] = cur ? cur.split(',').map(Number) : [null, null];

  return (
    <div className="dgv">
      <div className="dgv-head">
        <h3 className="dgv-title">Dijkstra on a weighted grid — expand by cumulative distance</h3>
        <p className="dgv-sub">
          Each step pops the frontier cell with the smallest dist-so-far, then relaxes its four neighbours with
          dist = current + cell weight. Dijkstra explores by pure distance (no goal heuristic) — A* would bias toward
          the goal. Click a cell to {editMode === 'wall' ? 'toggle a wall' : 'cycle its weight 1-9'}.
        </p>
      </div>

      <div className="dgv-controls">
        <div className="dgv-actions">
          <div className="dgv-buttons">
            <button
              type="button"
              className="dgv-btn dgv-btn-primary"
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
              className="dgv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="dgv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="dgv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <div className="dgv-edit">
            <span className="dgv-edit-label">click</span>
            <button
              type="button"
              className={`dgv-toggle ${editMode === 'wall' ? 'dgv-toggle-on' : ''}`}
              onClick={() => setEditMode('wall')}
            >
              wall
            </button>
            <button
              type="button"
              className={`dgv-toggle ${editMode === 'weight' ? 'dgv-toggle-on' : ''}`}
              onClick={() => setEditMode('weight')}
            >
              weight
            </button>
          </div>
          <label className="dgv-speed">
            <span className="dgv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="dgv-speed-range"
            />
            <span className="dgv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="dgv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="dgv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dgv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={GP} y={TP - 14} className="dgv-row-label">
            grid — small number = cell weight, big number = dist
          </text>

          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((__, c) => {
              const k = key(c, r);
              const x = GP + c * CELL;
              const y = TP + r * CELL;
              const w = grid[r][c];
              const fill = cellFill(k, w);
              const dark = labelDark(k, w);
              const isStart = k === key(START.c, START.r);
              const isGoal = k === key(GOAL.c, GOAL.r);
              const isWall = w === WALL;
              const hasDist = k in current.dist;
              return (
                <g key={`cell-${k}`} onClick={() => editCell(c, r)} className="dgv-cell">
                  <rect
                    x={x + 1.5}
                    y={y + 1.5}
                    width={CELL - 3}
                    height={CELL - 3}
                    rx={5}
                    fill={fill}
                    stroke={k === current.current ? 'var(--hue-pink)' : 'var(--border)'}
                    strokeWidth={k === current.current ? 2.4 : 1}
                  />
                  {(isStart || isGoal) && (
                    <text
                      x={x + CELL / 2}
                      y={y + 13}
                      className="dgv-cell-tag"
                      style={{ fill: 'var(--bg)' }}
                    >
                      {isStart ? 'S' : 'G'}
                    </text>
                  )}
                  {!isWall && (
                    <text
                      x={x + CELL - 6}
                      y={y + 12}
                      className="dgv-cell-w"
                      style={{ fill: dark ? 'var(--bg)' : 'var(--text-dim)' }}
                    >
                      {w}
                    </text>
                  )}
                  {hasDist && !isWall && (
                    <text
                      x={x + CELL / 2}
                      y={y + CELL - 9}
                      className="dgv-cell-d"
                      style={{ fill: dark ? 'var(--bg)' : 'var(--text-main)' }}
                    >
                      {current.dist[k]}
                    </text>
                  )}
                </g>
              );
            }),
          )}

          {/* legend / live readout panel */}
          <rect
            x={panelX - 12}
            y={TP - 12}
            width={panelW + 24}
            height={gridH + 12}
            fill="var(--surface)"
            stroke="var(--border)"
            rx={6}
          />
          <text x={panelX} y={TP + 6} className="dgv-row-label">
            legend
          </text>
          {[
            { fill: 'var(--easy)', label: 'start' },
            { fill: 'var(--hard)', label: 'goal' },
            { fill: 'var(--hue-pink)', label: 'current pop' },
            { fill: 'var(--hue-mint)', label: 'just relaxed' },
            { fill: 'rgba(var(--accent-rgb), 0.20)', label: 'frontier (PQ)' },
            { fill: 'rgba(var(--accent-rgb), 0.06)', label: 'settled' },
            { fill: 'var(--accent)', label: 'shortest path' },
            { fill: 'var(--text-dim)', label: 'wall' },
          ].map((row, i) => {
            const ly = TP + 26 + i * 24;
            return (
              <g key={`lg-${row.label}`}>
                <rect
                  x={panelX}
                  y={ly}
                  width={16}
                  height={16}
                  rx={4}
                  fill={row.fill}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text x={panelX + 24} y={ly + 12} className="dgv-legend-text">
                  {row.label}
                </text>
              </g>
            );
          })}

          <line x1={panelX} y1={TP + 222} x2={panelX + panelW} y2={TP + 222} stroke="var(--border)" strokeWidth={1} />
          <text x={panelX} y={TP + 244} className="dgv-row-label">
            current pop · dist
          </text>
          <text x={panelX} y={TP + 272} className="dgv-readout-big">
            {cur ? `(${curC},${curR}) dist=${curD}` : '—'}
          </text>
        </svg>
      </div>

      <div className="dgv-metrics">
        <div className="dgv-metric">
          <span className="dgv-metric-label">frontier</span>
          <span className="dgv-metric-value">{current.frontier.size}</span>
        </div>
        <div className="dgv-metric">
          <span className="dgv-metric-label">settled</span>
          <span className="dgv-metric-value">{current.settled.size}</span>
        </div>
        <div className="dgv-metric">
          <span className="dgv-metric-label">popped</span>
          <span className="dgv-metric-value">{cur ? `(${curC},${curR}) d=${curD}` : '—'}</span>
        </div>
        <div className="dgv-metric">
          <span className="dgv-metric-label">path cost</span>
          <span className="dgv-metric-value">{current.pathCost != null ? current.pathCost : '—'}</span>
        </div>
      </div>

      <div className="dgv-arith">
        <span className="dgv-arith-label">trace</span>
        <span className="dgv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
