import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './AStarSearchViz.css';

const COLS = 10;
const ROWS = 8;
const START = { c: 1, r: 6 };
const GOAL = { c: 8, r: 1 };
// Walls form a partial barrier so A* must route around it.
const DEFAULT_WALLS = [
  '4,1', '4,2', '4,3', '4,4', '4,5', '4,6',
  '6,3', '6,4', '6,5', '6,6', '6,7',
  '2,3', '3,3',
];

const key = (c, r) => `${c},${r}`;
// Manhattan distance — admissible on a 4-connected grid.
const heuristic = (c, r) => Math.abs(c - GOAL.c) + Math.abs(r - GOAL.r);

function buildFrames(wallSet) {
  const frames = [];
  const g = {};
  const f = {};
  const parent = {};
  const open = new Set();
  const closed = new Set();

  const sk = key(START.c, START.r);
  g[sk] = 0;
  f[sk] = heuristic(START.c, START.r);
  open.add(sk);

  const snap = (extra) => ({
    open: new Set(open),
    closed: new Set(closed),
    g: { ...g },
    f: { ...f },
    current: null,
    frontier: [],
    path: [],
    note: '',
    found: false,
    ...extra,
  });

  frames.push(snap({
    note: `Start at (${START.c},${START.r}). g=0, h=${f[sk]}, so f=${f[sk]}. Open set holds the start only.`,
  }));

  const NEI = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let foundGoal = false;
  let safety = 0;

  while (open.size > 0 && safety < 500) {
    safety += 1;
    // Pop lowest f (ties broken by lower h, then insertion is irrelevant for the picture).
    let bestK = null;
    let bestF = Infinity;
    let bestH = Infinity;
    for (const k of open) {
      const [c, r] = k.split(',').map(Number);
      const h = heuristic(c, r);
      if (f[k] < bestF - 1e-9 || (Math.abs(f[k] - bestF) < 1e-9 && h < bestH)) {
        bestF = f[k];
        bestH = h;
        bestK = k;
      }
    }
    const [cc, cr] = bestK.split(',').map(Number);
    open.delete(bestK);
    closed.add(bestK);

    if (bestK === key(GOAL.c, GOAL.r)) {
      // Reconstruct path.
      const path = [];
      let p = bestK;
      while (p !== undefined) {
        path.push(p);
        p = parent[p];
      }
      path.reverse();
      frames.push(snap({
        current: bestK,
        path,
        found: true,
        note: `Popped goal (${cc},${cr}) with f=${f[bestK]}. Reconstruct path of ${path.length} cells via parent pointers.`,
      }));
      foundGoal = true;
      break;
    }

    const expanded = [];
    for (const [dc, dr] of NEI) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const nk = key(nc, nr);
      if (wallSet.has(nk) || closed.has(nk)) continue;
      const tentative = g[bestK] + 1;
      if (!(nk in g) || tentative < g[nk]) {
        parent[nk] = bestK;
        g[nk] = tentative;
        f[nk] = tentative + heuristic(nc, nr);
        open.add(nk);
        expanded.push(nk);
      }
    }

    frames.push(snap({
      current: bestK,
      frontier: expanded,
      note: expanded.length
        ? `Pop lowest f=${f[bestK]} at (${cc},${cr}); relax ${expanded.length} neighbour(s), each g=${g[bestK] + 1}.`
        : `Pop lowest f=${f[bestK]} at (${cc},${cr}); no new neighbours to relax (walls / already closed).`,
    }));
  }

  if (!foundGoal) {
    frames.push(snap({ note: 'Open set drained without reaching the goal — walls block every route.' }));
  }

  return frames;
}

export default function AStarSearchViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [walls, setWalls] = useState(() => new Set(DEFAULT_WALLS));
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(walls), [walls]);

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

  const toggleWall = (c, r) => {
    const k = key(c, r);
    if (k === key(START.c, START.r) || k === key(GOAL.c, GOAL.r)) return;
    setIsRunningRaw(false);
    setStep(0);
    setWalls((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  // Grid geometry.
  const GP = 30; // pad-left for grid
  const TP = 36; // pad-top for grid
  const CELL = 40;
  const gridW = COLS * CELL;
  const gridH = ROWS * CELL;
  const W = 940;
  const H = TP + gridH + 18;
  const panelX = GP + gridW + 24;
  const panelW = W - panelX - 24;

  const pathSet = useMemo(() => new Set(current.path), [current.path]);
  const frontierSet = useMemo(() => new Set(current.frontier), [current.frontier]);

  const cellFill = (k) => {
    if (k === key(START.c, START.r)) return 'var(--easy)';
    if (k === key(GOAL.c, GOAL.r)) return 'var(--hard)';
    if (walls.has(k)) return 'var(--text-dim)';
    if (pathSet.has(k)) return 'var(--accent)';
    if (k === current.current) return 'var(--hue-pink)';
    if (frontierSet.has(k)) return 'var(--hue-mint)';
    if (current.open.has(k)) return 'rgba(var(--accent-rgb), 0.20)';
    if (current.closed.has(k)) return 'rgba(var(--accent-rgb), 0.06)';
    return 'var(--bg)';
  };

  const labelDark = (k) => {
    if (walls.has(k)) return true;
    if (k === key(START.c, START.r) || k === key(GOAL.c, GOAL.r)) return true;
    if (pathSet.has(k) || k === current.current) return true;
    return false;
  };

  // Live readout for the current popped cell.
  const cur = current.current;
  const curG = cur ? current.g[cur] : null;
  const [curC, curR] = cur ? cur.split(',').map(Number) : [null, null];
  const curH = cur ? heuristic(curC, curR) : null;
  const curF = cur ? current.f[cur] : null;

  return (
    <div className="asv">
      <div className="asv-head">
        <h3 className="asv-title">A* search on a grid — f(n) = g(n) + h(n)</h3>
        <p className="asv-sub">
          Each step pops the open-set cell with the lowest f = (steps so far) + (Manhattan distance to goal), then
          relaxes its neighbours. The admissible heuristic keeps the first goal-pop optimal. Click a cell to toggle a wall.
        </p>
      </div>

      <div className="asv-controls">
        <div className="asv-actions">
          <div className="asv-buttons">
            <button
              type="button"
              className="asv-btn asv-btn-primary"
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
              className="asv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="asv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="asv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="asv-speed">
            <span className="asv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="asv-speed-range"
            />
            <span className="asv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="asv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="asv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="asv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={GP} y={TP - 14} className="asv-row-label">grid (click to toggle walls)</text>

          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((__, c) => {
              const k = key(c, r);
              const x = GP + c * CELL;
              const y = TP + r * CELL;
              const fill = cellFill(k);
              const dark = labelDark(k);
              const isStart = k === key(START.c, START.r);
              const isGoal = k === key(GOAL.c, GOAL.r);
              const isWall = walls.has(k);
              const showFG = (k in current.g) && !isWall && !isStart;
              return (
                <g key={`cell-${k}`} onClick={() => toggleWall(c, r)} className="asv-cell">
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
                      y={y + CELL / 2 + 4}
                      className="asv-cell-tag"
                      style={{ fill: 'var(--bg)' }}
                    >
                      {isStart ? 'S' : 'G'}
                    </text>
                  )}
                  {showFG && !isGoal && (
                    <>
                      <text
                        x={x + CELL / 2}
                        y={y + CELL / 2 + 1}
                        className="asv-cell-f"
                        style={{ fill: dark ? 'var(--bg)' : 'var(--text-main)' }}
                      >
                        {current.f[k]}
                      </text>
                      <text
                        x={x + CELL / 2}
                        y={y + CELL - 7}
                        className="asv-cell-gh"
                        style={{ fill: dark ? 'var(--bg)' : 'var(--text-dim)' }}
                      >
                        {current.g[k]}+{heuristic(c, r)}
                      </text>
                    </>
                  )}
                </g>
              );
            }),
          )}

          {/* legend / live readout panel */}
          <rect x={panelX - 12} y={TP - 12} width={panelW + 24} height={gridH + 12} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={TP + 6} className="asv-row-label">legend</text>
          {[
            { fill: 'var(--easy)', label: 'start' },
            { fill: 'var(--hard)', label: 'goal' },
            { fill: 'var(--hue-pink)', label: 'current pop' },
            { fill: 'var(--hue-mint)', label: 'just relaxed' },
            { fill: 'rgba(var(--accent-rgb), 0.20)', label: 'open set' },
            { fill: 'rgba(var(--accent-rgb), 0.06)', label: 'closed set' },
            { fill: 'var(--accent)', label: 'final path' },
            { fill: 'var(--text-dim)', label: 'wall' },
          ].map((row, i) => {
            const ly = TP + 26 + i * 24;
            return (
              <g key={`lg-${row.label}`}>
                <rect x={panelX} y={ly} width={16} height={16} rx={4} fill={row.fill} stroke="var(--border)" strokeWidth={1} />
                <text x={panelX + 24} y={ly + 12} className="asv-legend-text">{row.label}</text>
              </g>
            );
          })}

          <line x1={panelX} y1={TP + 222} x2={panelX + panelW} y2={TP + 222} stroke="var(--border)" strokeWidth={1} />
          <text x={panelX} y={TP + 244} className="asv-row-label">current f = g + h</text>
          <text x={panelX} y={TP + 272} className="asv-readout-big">
            {cur ? `f=${curF} = ${curG}+${curH}` : '—'}
          </text>
        </svg>
      </div>

      <div className="asv-metrics">
        <div className="asv-metric">
          <span className="asv-metric-label">open</span>
          <span className="asv-metric-value">{current.open.size}</span>
        </div>
        <div className="asv-metric">
          <span className="asv-metric-label">closed</span>
          <span className="asv-metric-value">{current.closed.size}</span>
        </div>
        <div className="asv-metric">
          <span className="asv-metric-label">current</span>
          <span className="asv-metric-value">{cur ? `(${curC},${curR})` : '—'}</span>
        </div>
        <div className="asv-metric asv-metric-dim">
          <span className="asv-metric-label">walls</span>
          <span className="asv-metric-value asv-metric-dimval">{walls.size}</span>
        </div>
      </div>

      <div className="asv-arith">
        <span className="asv-arith-label">trace</span>
        <span className="asv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
