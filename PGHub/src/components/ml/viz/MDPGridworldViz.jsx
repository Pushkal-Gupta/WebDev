import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Play, StepForward, RotateCcw, Square, FastForward } from 'lucide-react';
import './MLViz.css';

const GRID = 4;
const SIZE = 420;
const PAD = 22;
const CELL = (SIZE - PAD * 2) / GRID;

const START = { r: 0, c: 0 };
const GOAL = { r: GRID - 1, c: GRID - 1 };
const PITS = [
  { r: 1, c: 3 },
  { r: 2, c: 0 },
];
const WALL = { r: 1, c: 1 };

const GOAL_REWARD = 10;
const PIT_REWARD = -10;
const STEP_REWARD = -0.04;

const MAX_ITERS = 200;
const STEP_DELAY = 130;
const CONVERGE_EPS = 1e-4;

// 0=up, 1=right, 2=down, 3=left
const ACTIONS = [
  { dr: -1, dc: 0, name: 'up' },
  { dr: 0, dc: 1, name: 'right' },
  { dr: 1, dc: 0, name: 'down' },
  { dr: 0, dc: -1, name: 'left' },
];

function cellCenter(r, c) {
  return {
    x: PAD + c * CELL + CELL / 2,
    y: PAD + r * CELL + CELL / 2,
  };
}

function isGoal(r, c) {
  return r === GOAL.r && c === GOAL.c;
}
function isPit(r, c) {
  return PITS.some((p) => p.r === r && p.c === c);
}
function isWall(r, c) {
  return r === WALL.r && c === WALL.c;
}
function isTerminal(r, c) {
  return isGoal(r, c) || isPit(r, c);
}

function rewardEnter(r, c) {
  if (isGoal(r, c)) return GOAL_REWARD;
  if (isPit(r, c)) return PIT_REWARD;
  return STEP_REWARD;
}

// Step env: walls bounce back; out-of-bounds bounces back.
function stepEnv(r, c, action) {
  const a = ACTIONS[action];
  let nr = r + a.dr;
  let nc = c + a.dc;
  if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID || isWall(nr, nc)) {
    nr = r;
    nc = c;
  }
  return { nr, nc, reward: rewardEnter(nr, nc) };
}

function initV() {
  const v = [];
  for (let r = 0; r < GRID; r++) {
    const row = [];
    for (let c = 0; c < GRID; c++) {
      if (isGoal(r, c)) row.push(GOAL_REWARD);
      else if (isPit(r, c)) row.push(PIT_REWARD);
      else row.push(0);
    }
    v.push(row);
  }
  return v;
}

function cloneV(v) {
  return v.map((row) => row.slice());
}

function argMax4(arr) {
  let bestI = 0;
  let bestV = arr[0];
  for (let i = 1; i < 4; i++) {
    if (arr[i] > bestV) {
      bestV = arr[i];
      bestI = i;
    }
  }
  return bestI;
}

// One value-iteration sweep. Returns { vNext, maxDelta }.
function vSweep(v, gamma) {
  const vNext = cloneV(v);
  let maxDelta = 0;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (isWall(r, c) || isTerminal(r, c)) continue;
      let best = -Infinity;
      for (let k = 0; k < 4; k++) {
        const { nr, nc, reward } = stepEnv(r, c, k);
        const q = reward + gamma * v[nr][nc];
        if (q > best) best = q;
      }
      const d = Math.abs(best - v[r][c]);
      if (d > maxDelta) maxDelta = d;
      vNext[r][c] = best;
    }
  }
  return { vNext, maxDelta };
}

function bestAction(v, r, c, gamma) {
  const qs = [0, 0, 0, 0];
  for (let k = 0; k < 4; k++) {
    const { nr, nc, reward } = stepEnv(r, c, k);
    qs[k] = reward + gamma * v[nr][nc];
  }
  return { action: argMax4(qs), qs };
}

function snap(v, p = 2) {
  if (v === null || v === undefined) return '—';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toFixed(p);
}

function GridLayer() {
  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const x = PAD + c * CELL;
      const y = PAD + r * CELL;
      let fill = 'transparent';
      let fillOpacity = 1;
      if (isWall(r, c)) {
        fill = 'var(--text-dim)';
        fillOpacity = 0.35;
      } else if (isGoal(r, c)) {
        fill = 'var(--hue-mint)';
        fillOpacity = 0.18;
      } else if (isPit(r, c)) {
        fill = 'var(--hard)';
        fillOpacity = 0.18;
      } else if (r === START.r && c === START.c) {
        fill = 'rgba(var(--accent-rgb), 0.10)';
      }
      cells.push(
        <rect
          key={`cell-${r}-${c}`}
          x={x}
          y={y}
          width={CELL}
          height={CELL}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke="var(--border)"
          strokeWidth="0.8"
        />
      );
    }
  }
  return <g>{cells}</g>;
}

function CellLabels() {
  const labels = [];
  const s = cellCenter(START.r, START.c);
  const g = cellCenter(GOAL.r, GOAL.c);
  labels.push(
    <text
      key="lbl-start"
      x={s.x}
      y={PAD + START.r * CELL + 12}
      fontSize="8.5"
      fill="var(--text-dim)"
      textAnchor="middle"
    >
      START
    </text>
  );
  labels.push(
    <text
      key="lbl-goal"
      x={g.x}
      y={PAD + GOAL.r * CELL + 12}
      fontSize="8.5"
      fill="var(--hue-mint)"
      textAnchor="middle"
      fontWeight="600"
    >
      GOAL +{GOAL_REWARD}
    </text>
  );
  PITS.forEach((p, i) => {
    const cc = cellCenter(p.r, p.c);
    labels.push(
      <text
        key={`lbl-pit-${i}`}
        x={cc.x}
        y={PAD + p.r * CELL + 12}
        fontSize="8.5"
        fill="var(--hard)"
        textAnchor="middle"
        fontWeight="600"
      >
        PIT {PIT_REWARD}
      </text>
    );
  });
  const w = cellCenter(WALL.r, WALL.c);
  labels.push(
    <text
      key="lbl-wall"
      x={w.x}
      y={w.y + 3}
      fontSize="9"
      fill="var(--text-dim)"
      textAnchor="middle"
      fontWeight="600"
    >
      WALL
    </text>
  );
  return <g>{labels}</g>;
}

function PolicyArrows({ v, gamma }) {
  // Magnitude reference for arrow opacity.
  let absMax = 0;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const a = Math.abs(v[r][c]);
      if (a > absMax) absMax = a;
    }
  }
  if (absMax < 1e-6) absMax = 1;

  const arrows = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (isWall(r, c) || isTerminal(r, c)) continue;
      const { action, qs } = bestAction(v, r, c, gamma);
      const bestVal = qs[action];
      const center = cellCenter(r, c);
      const a = ACTIONS[action];
      const mag = Math.min(1, Math.abs(bestVal) / absMax);
      const len = Math.max(CELL * 0.16, CELL * 0.34 * (0.4 + 0.6 * mag));
      const x2 = center.x + a.dc * len;
      const y2 = center.y + a.dr * len;
      const positive = bestVal >= 0;
      const color = positive ? 'var(--accent)' : 'var(--hard)';
      const op = 0.35 + 0.6 * mag;
      arrows.push(
        <line
          key={`pol-${r}-${c}`}
          x1={center.x}
          y1={center.y}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={1.4 + 1.4 * mag}
          opacity={op}
          strokeLinecap="round"
          markerEnd={positive ? 'url(#mdp-arrow-acc)' : 'url(#mdp-arrow-hard)'}
          style={{
            transition:
              'x2 0.22s ease, y2 0.22s ease, opacity 0.22s ease, stroke 0.22s ease, stroke-width 0.22s ease',
          }}
        />
      );
      arrows.push(
        <circle
          key={`pol-dot-${r}-${c}`}
          cx={center.x}
          cy={center.y}
          r={1.6}
          fill="var(--text-dim)"
          opacity="0.6"
        />
      );
    }
  }
  return <g>{arrows}</g>;
}

function ValueText({ v }) {
  const texts = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (isWall(r, c)) continue;
      const cc = cellCenter(r, c);
      const value = v[r][c];
      const isTerm = isTerminal(r, c);
      texts.push(
        <text
          key={`v-${r}-${c}`}
          x={cc.x}
          y={PAD + r * CELL + CELL - 5}
          fontSize="9"
          fill={
            isTerm
              ? value > 0
                ? 'var(--hue-mint)'
                : 'var(--hard)'
              : 'var(--text-dim)'
          }
          textAnchor="middle"
          fontWeight={isTerm ? 600 : 500}
          opacity={isTerm ? 0.95 : 0.85}
        >
          V {value.toFixed(2)}
        </text>
      );
    }
  }
  return <g>{texts}</g>;
}

export default function MDPGridworldViz() {
  const timerRef = useRef(null);
  const runningRef = useRef(false);

  const [v, setV] = useState(() => initV());
  const [gamma, setGamma] = useState(0.9);
  const [iter, setIter] = useState(0);
  const [maxDelta, setMaxDelta] = useState(null);
  const [running, setRunning] = useState(false);
  const [converged, setConverged] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      runningRef.current = false;
      clearTimer();
    },
    [clearTimer]
  );

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    setV((prev) => {
      const { vNext, maxDelta: d } = vSweep(prev, gamma);
      setIter((n) => n + 1);
      setMaxDelta(d);
      setConverged(d < CONVERGE_EPS);
      return vNext;
    });
  }, [gamma]);

  const handleRun = useCallback(async () => {
    if (runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      clearTimer();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    setConverged(false);
    // Snapshot current v from state.
    let vLocal;
    setV((cur) => {
      vLocal = cur;
      return cur;
    });
    await Promise.resolve();

    let i = 0;
    while (runningRef.current && i < MAX_ITERS) {
      const { vNext, maxDelta: d } = vSweep(vLocal, gamma);
      vLocal = vNext;
      i += 1;
      setV(vLocal);
      setIter((n) => n + 1);
      setMaxDelta(d);
      if (d < CONVERGE_EPS) {
        setConverged(true);
        break;
      }
      await new Promise((res) => {
        timerRef.current = setTimeout(res, STEP_DELAY);
      });
    }
    runningRef.current = false;
    setRunning(false);
  }, [gamma, clearTimer]);

  const handleFast = useCallback(() => {
    if (runningRef.current) return;
    setV((prev) => {
      let vLocal = prev;
      let d = Infinity;
      let i = 0;
      let last = null;
      while (i < MAX_ITERS && d >= CONVERGE_EPS) {
        const res = vSweep(vLocal, gamma);
        vLocal = res.vNext;
        d = res.maxDelta;
        last = d;
        i += 1;
      }
      setIter((n) => n + i);
      setMaxDelta(last);
      setConverged(last !== null && last < CONVERGE_EPS);
      return vLocal;
    });
  }, [gamma]);

  const handleReset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimer();
    setV(initV());
    setIter(0);
    setMaxDelta(null);
    setConverged(false);
  }, [clearTimer]);

  const startVal = useMemo(() => v[START.r][START.c], [v]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <defs>
            <marker
              id="mdp-arrow-acc"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker
              id="mdp-arrow-hard"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hard)" />
            </marker>
          </defs>

          <GridLayer />
          <CellLabels />
          <ValueText v={v} />
          <PolicyArrows v={v} gamma={gamma} />
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
            VALUE ITERATION
          </span>
          <span className="mlviz-val">iter {iter}</span>
          <span className="mlviz-sub">
            max delta {maxDelta === null ? '—' : maxDelta.toExponential(2)}
          </span>
          <span className="mlviz-sub">V*(start) {snap(startVal, 2)}</span>
          <span
            className="mlviz-sub"
            style={{ color: converged ? 'var(--hue-mint)' : 'var(--text-dim)' }}
          >
            {converged ? 'converged' : 'running'}
          </span>
        </div>

        <div className="mlviz-controls">
          <div className="mlviz-slider">
            <div className="mlviz-slider-label">
              <span>gamma (discount)</span>
              <span className="mlviz-slider-val">{gamma.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={gamma}
              onChange={(e) => setGamma(parseFloat(e.target.value))}
              disabled={running}
            />
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running}
          >
            <StepForward size={13} />
            <span>Sweep</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Run value iteration'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleFast}
            disabled={running}
          >
            <FastForward size={13} />
            <span>Solve</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          V(s) &lt;- max_a [ R(s,a,s&apos;) + gamma * V(s&apos;) ] — sweep until max
          delta &lt; {CONVERGE_EPS}
        </div>
      </div>
    </div>
  );
}
