import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

const GRID = 5;
const SIZE = 400;
const PAD = 22;
const CELL = (SIZE - PAD * 2) / GRID;

const START = { r: 0, c: 0 };
const GOAL = { r: GRID - 1, c: GRID - 1 };
const PIT = { r: 2, c: 1 };

const GOAL_REWARD = 10;
const PIT_REWARD = -10;
const STEP_REWARD = -0.1;

const GAMMA = 0.95;
const ALPHA = 0.25;

const MAX_STEPS = 60;
const RUN_BATCH = 25;
const STEP_DELAY = 28;

// Actions: 0=up, 1=right, 2=down, 3=left
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

function rngFrom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function softmax(logits) {
  const m = Math.max(...logits);
  const ex = logits.map((l) => Math.exp(l - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

function sampleAction(probs, rand) {
  const u = rand();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (u <= acc) return i;
  }
  return probs.length - 1;
}

function isTerminal(r, c) {
  if (r === GOAL.r && c === GOAL.c) return true;
  if (r === PIT.r && c === PIT.c) return true;
  return false;
}

function rewardAt(r, c) {
  if (r === GOAL.r && c === GOAL.c) return GOAL_REWARD;
  if (r === PIT.r && c === PIT.c) return PIT_REWARD;
  return STEP_REWARD;
}

function stepEnv(r, c, action) {
  const a = ACTIONS[action];
  const nr = Math.max(0, Math.min(GRID - 1, r + a.dr));
  const nc = Math.max(0, Math.min(GRID - 1, c + a.dc));
  const reward = rewardAt(nr, nc);
  const done = isTerminal(nr, nc);
  return { nr, nc, reward, done };
}

function initTheta() {
  // theta[r][c][a] — start at 0 → uniform policy
  const t = [];
  for (let r = 0; r < GRID; r++) {
    const row = [];
    for (let c = 0; c < GRID; c++) {
      row.push([0, 0, 0, 0]);
    }
    t.push(row);
  }
  return t;
}

function cloneTheta(t) {
  return t.map((row) => row.map((cell) => cell.slice()));
}

function policyAt(theta, r, c) {
  return softmax(theta[r][c]);
}

// Run one episode using current theta and a PRNG.
function runEpisode(theta, rand) {
  let r = START.r;
  let c = START.c;
  const traj = [];
  let totalR = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    const probs = policyAt(theta, r, c);
    const a = sampleAction(probs, rand);
    const { nr, nc, reward, done } = stepEnv(r, c, a);
    traj.push({ r, c, a, reward, probs });
    totalR += reward;
    r = nr;
    c = nc;
    if (done) break;
  }
  return { traj, totalReturn: totalR, endR: r, endC: c };
}

// REINFORCE update: theta_{s,a} += alpha * G_t * (1{a=a_t} - pi(a|s))
function reinforceUpdate(theta, traj) {
  const T = traj.length;
  // returns G_t (no baseline)
  const G = new Array(T).fill(0);
  let acc = 0;
  for (let t = T - 1; t >= 0; t--) {
    acc = traj[t].reward + GAMMA * acc;
    G[t] = acc;
  }
  // Normalize returns for stability — keeps gradients in sane range so plot lives.
  let mean = 0;
  for (let i = 0; i < T; i++) mean += G[i];
  mean /= T;
  let varG = 0;
  for (let i = 0; i < T; i++) varG += (G[i] - mean) * (G[i] - mean);
  const std = Math.sqrt(varG / Math.max(1, T)) + 1e-6;
  const Gn = G.map((g) => (g - mean) / std);

  const next = cloneTheta(theta);
  for (let t = 0; t < T; t++) {
    const { r, c, a, probs } = traj[t];
    for (let k = 0; k < 4; k++) {
      const indicator = k === a ? 1 : 0;
      next[r][c][k] += ALPHA * Gn[t] * (indicator - probs[k]);
    }
    // clip to avoid runaway logits making other actions vanish entirely
    for (let k = 0; k < 4; k++) {
      if (next[r][c][k] > 8) next[r][c][k] = 8;
      if (next[r][c][k] < -8) next[r][c][k] = -8;
    }
  }
  return next;
}

function policyEntropy(theta) {
  let total = 0;
  let count = 0;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (isTerminal(r, c)) continue;
      const p = policyAt(theta, r, c);
      let h = 0;
      for (let k = 0; k < 4; k++) {
        if (p[k] > 1e-9) h -= p[k] * Math.log(p[k]);
      }
      total += h;
      count += 1;
    }
  }
  return total / Math.max(1, count);
}

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function GridLayer() {
  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const x = PAD + c * CELL;
      const y = PAD + r * CELL;
      let fill = 'transparent';
      let fillOpacity = 1;
      if (r === GOAL.r && c === GOAL.c) { fill = 'var(--hue-mint)'; fillOpacity = 0.18; }
      else if (r === PIT.r && c === PIT.c) { fill = 'var(--hard)'; fillOpacity = 0.18; }
      else if (r === START.r && c === START.c) { fill = 'rgba(var(--accent-rgb), 0.10)'; }
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
  const p = cellCenter(PIT.r, PIT.c);
  labels.push(
    <text key="lbl-start" x={s.x} y={PAD + START.r * CELL + 14} fontSize="9" fill="var(--text-dim)" textAnchor="middle">START</text>
  );
  labels.push(
    <text key="lbl-goal" x={g.x} y={PAD + GOAL.r * CELL + 14} fontSize="9" fill="var(--hue-mint)" textAnchor="middle" fontWeight="600">GOAL +{GOAL_REWARD}</text>
  );
  labels.push(
    <text key="lbl-pit" x={p.x} y={PAD + PIT.r * CELL + 14} fontSize="9" fill="var(--hard)" textAnchor="middle" fontWeight="600">PIT {PIT_REWARD}</text>
  );
  return <g>{labels}</g>;
}

function PolicyArrows({ theta }) {
  const arrows = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (isTerminal(r, c)) continue;
      const probs = policyAt(theta, r, c);
      const center = cellCenter(r, c);
      const maxLen = CELL * 0.36;
      for (let k = 0; k < 4; k++) {
        const a = ACTIONS[k];
        const len = maxLen * probs[k];
        if (len < 1.2) continue;
        const x2 = center.x + a.dc * len;
        const y2 = center.y + a.dr * len;
        const op = 0.35 + 0.65 * probs[k];
        const isMax = probs[k] === Math.max(...probs);
        const color = isMax ? 'var(--accent)' : 'var(--text-dim)';
        arrows.push(
          <line
            key={`arr-${r}-${c}-${k}`}
            x1={center.x}
            y1={center.y}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={isMax ? 1.7 : 1.0}
            opacity={op}
            strokeLinecap="round"
            markerEnd={isMax ? 'url(#pg-arrow-acc)' : 'url(#pg-arrow-dim)'}
            style={{ transition: 'x2 0.18s ease, y2 0.18s ease, opacity 0.18s ease' }}
          />
        );
      }
      arrows.push(
        <circle key={`dot-${r}-${c}`} cx={center.x} cy={center.y} r={1.6} fill="var(--text-dim)" opacity="0.6" />
      );
    }
  }
  return <g>{arrows}</g>;
}

function Trajectory({ traj, currentStep }) {
  if (!traj || traj.length === 0) return null;
  const pts = [];
  for (let i = 0; i <= Math.min(currentStep, traj.length - 1); i++) {
    const { r, c } = traj[i];
    const p = cellCenter(r, c);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  // Add the next cell that the action led to, for the active step.
  if (currentStep < traj.length) {
    const t = traj[currentStep];
    const a = ACTIONS[t.a];
    const nr = Math.max(0, Math.min(GRID - 1, t.r + a.dr));
    const nc = Math.max(0, Math.min(GRID - 1, t.c + a.dc));
    const p = cellCenter(nr, nc);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return (
    <polyline
      points={pts.join(' ')}
      fill="none"
      stroke="var(--hue-pink)"
      strokeWidth="1.6"
      strokeDasharray="3 3"
      opacity="0.75"
      strokeLinecap="round"
    />
  );
}

function Agent({ r, c }) {
  const p = cellCenter(r, c);
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={9} fill="var(--accent)" opacity="0.2" />
      <circle cx={p.x} cy={p.y} r={5.5} fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5" />
    </g>
  );
}

export default function PolicyGradientViz() {
  const timerRef = useRef(null);
  const runningRef = useRef(false);
  const seedRef = useRef(1);

  const [theta, setTheta] = useState(() => initTheta());
  const [episodeCount, setEpisodeCount] = useState(0);
  const [lastReturn, setLastReturn] = useState(null);
  const [avgReturn, setAvgReturn] = useState(null);
  const [currentTraj, setCurrentTraj] = useState(null);
  const [animStep, setAnimStep] = useState(0);
  const [running, setRunning] = useState(false);

  const entropy = useMemo(() => policyEntropy(theta), [theta]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    clearTimer();
  }, [clearTimer]);

  // Reusable PRNG that survives across episodes for variety.
  const nextRand = useCallback(() => {
    seedRef.current = (seedRef.current + 0x9E3779B1) >>> 0;
    return rngFrom(seedRef.current);
  }, []);

  const animateEpisode = useCallback(async (traj) => {
    setCurrentTraj(traj);
    for (let i = 0; i < traj.length; i++) {
      setAnimStep(i);
      await new Promise((res) => {
        timerRef.current = setTimeout(res, STEP_DELAY);
      });
      if (!runningRef.current && i > 0) break;
    }
    setAnimStep(traj.length);
  }, []);

  const stepOnce = useCallback(async (animate = true) => {
    const rand = nextRand();
    let nextTheta;
    let ep;
    setTheta((prev) => {
      ep = runEpisode(prev, rand);
      nextTheta = reinforceUpdate(prev, ep.traj);
      return nextTheta;
    });
    // Wait a microtask so state batching settles.
    await Promise.resolve();
    setEpisodeCount((n) => n + 1);
    setLastReturn(ep.totalReturn);
    setAvgReturn((prev) => prev === null ? ep.totalReturn : prev * 0.9 + ep.totalReturn * 0.1);
    if (animate) {
      await animateEpisode(ep.traj);
    } else {
      setCurrentTraj(ep.traj);
      setAnimStep(ep.traj.length);
    }
  }, [nextRand, animateEpisode]);

  const handleStep = useCallback(async () => {
    if (runningRef.current) return;
    await stepOnce(true);
  }, [stepOnce]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimer();
  }, [clearTimer]);

  const handleRun = useCallback(async () => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    for (let i = 0; i < RUN_BATCH; i++) {
      if (!runningRef.current) break;
      // Animate the first few episodes, then run fast (skip animation) for the rest.
      await stepOnce(i < 2);
      if (!runningRef.current) break;
      await new Promise((res) => {
        timerRef.current = setTimeout(res, i < 2 ? 60 : 14);
      });
    }
    runningRef.current = false;
    setRunning(false);
  }, [stepOnce, stopRun]);

  const handleReset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimer();
    seedRef.current = 1;
    setTheta(initTheta());
    setEpisodeCount(0);
    setLastReturn(null);
    setAvgReturn(null);
    setCurrentTraj(null);
    setAnimStep(0);
  }, [clearTimer]);

  // Agent's current display cell during animation
  const agentCell = useMemo(() => {
    if (!currentTraj || currentTraj.length === 0) return START;
    if (animStep >= currentTraj.length) {
      // show the final cell after last action
      const last = currentTraj[currentTraj.length - 1];
      const a = ACTIONS[last.a];
      return {
        r: Math.max(0, Math.min(GRID - 1, last.r + a.dr)),
        c: Math.max(0, Math.min(GRID - 1, last.c + a.dc)),
      };
    }
    const t = currentTraj[animStep];
    return { r: t.r, c: t.c };
  }, [currentTraj, animStep]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <defs>
            <marker
              id="pg-arrow-acc"
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
              id="pg-arrow-dim"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
          </defs>

          <GridLayer />
          <CellLabels />
          <PolicyArrows theta={theta} />
          {currentTraj && <Trajectory traj={currentTraj} currentStep={animStep} />}
          <Agent r={agentCell.r} c={agentCell.c} />
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>REINFORCE</span>
          <span className="mlviz-val">episode {episodeCount}</span>
          <span className="mlviz-sub">last return {lastReturn !== null ? snap(lastReturn, 2) : '—'}</span>
          <span className="mlviz-sub">avg {avgReturn !== null ? snap(avgReturn, 2) : '—'}</span>
          <span className="mlviz-sub">H(pi) {snap(entropy, 3)}</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : `Run x${RUN_BATCH}`}</span>
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
          sample trajectory · compute returns · theta &lt;- theta + alpha * G_t * grad log pi
        </div>
      </div>
    </div>
  );
}
