import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Play, StepForward, RotateCcw, Square, FastForward } from 'lucide-react';
import './MLViz.css';

const GRID = 5;
const SIZE = 420;
const PAD = 22;
const CELL = (SIZE - PAD * 2) / GRID;

const START = { r: 0, c: 0 };
const GOAL = { r: GRID - 1, c: GRID - 1 };
const PITS = [
  { r: 2, c: 1 },
  { r: 3, c: 3 },
];

const GOAL_REWARD = 10;
const PIT_REWARD = -10;
const STEP_REWARD = -0.1;

const MAX_STEPS = 80;
const BATCH_EPISODES = 100;
const STEP_DELAY = 26;

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

function isTerminal(r, c) {
  return isGoal(r, c) || isPit(r, c);
}

function rewardAt(r, c) {
  if (isGoal(r, c)) return GOAL_REWARD;
  if (isPit(r, c)) return PIT_REWARD;
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

function initQ() {
  const q = [];
  for (let r = 0; r < GRID; r++) {
    const row = [];
    for (let c = 0; c < GRID; c++) {
      row.push([0, 0, 0, 0]);
    }
    q.push(row);
  }
  return q;
}

function cloneQ(q) {
  return q.map((row) => row.map((cell) => cell.slice()));
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

function maxQ(arr) {
  let m = arr[0];
  for (let i = 1; i < 4; i++) if (arr[i] > m) m = arr[i];
  return m;
}

function epsilonGreedy(qsa, eps, rand) {
  if (rand() < eps) {
    return Math.floor(rand() * 4) % 4;
  }
  return argMax4(qsa);
}

function rngFrom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
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
      if (isGoal(r, c)) {
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
  return <g>{labels}</g>;
}

function QArrows({ q }) {
  // Global magnitude reference for coloring
  let absMax = 0;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      for (let k = 0; k < 4; k++) {
        const v = Math.abs(q[r][c][k]);
        if (v > absMax) absMax = v;
      }
    }
  }
  if (absMax < 1e-6) absMax = 1;

  const arrows = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (isTerminal(r, c)) continue;
      const qsa = q[r][c];
      const center = cellCenter(r, c);
      const maxLen = CELL * 0.36;
      const best = argMax4(qsa);
      const bestVal = qsa[best];
      const hasLearned = Math.abs(maxQ(qsa)) > 1e-6 || Math.min(...qsa) < -1e-6;

      for (let k = 0; k < 4; k++) {
        const a = ACTIONS[k];
        const v = qsa[k];
        const mag = Math.min(1, Math.abs(v) / absMax);
        // base length so structure stays readable even at init
        const len = Math.max(CELL * 0.12, maxLen * (0.35 + 0.65 * mag));
        const x2 = center.x + a.dc * len;
        const y2 = center.y + a.dr * len;
        const isMax = hasLearned && k === best && bestVal > -1e-6;
        const positive = v >= 0;
        const color = isMax
          ? 'var(--accent)'
          : positive
            ? 'var(--hue-sky)'
            : 'var(--hard)';
        const op = isMax ? 0.95 : 0.35 + 0.5 * mag;
        arrows.push(
          <line
            key={`arr-${r}-${c}-${k}`}
            x1={center.x}
            y1={center.y}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={isMax ? 1.9 : 1.0}
            opacity={op}
            strokeLinecap="round"
            markerEnd={
              isMax
                ? 'url(#ql-arrow-acc)'
                : positive
                  ? 'url(#ql-arrow-sky)'
                  : 'url(#ql-arrow-hard)'
            }
            style={{
              transition:
                'x2 0.18s ease, y2 0.18s ease, opacity 0.18s ease, stroke 0.18s ease',
            }}
          />
        );
      }
      arrows.push(
        <circle
          key={`dot-${r}-${c}`}
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

function ValueText({ q }) {
  // Show V(s) = max_a Q(s,a) faintly under each non-terminal cell.
  const texts = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (isTerminal(r, c)) continue;
      const v = maxQ(q[r][c]);
      if (Math.abs(v) < 0.01) continue;
      const cc = cellCenter(r, c);
      texts.push(
        <text
          key={`v-${r}-${c}`}
          x={cc.x}
          y={PAD + r * CELL + CELL - 5}
          fontSize="7.5"
          fill="var(--text-dim)"
          textAnchor="middle"
          opacity="0.75"
        >
          V {v.toFixed(2)}
        </text>
      );
    }
  }
  return <g>{texts}</g>;
}

function Agent({ r, c }) {
  const p = cellCenter(r, c);
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={9} fill="var(--accent)" opacity="0.22" />
      <circle
        cx={p.x}
        cy={p.y}
        r={5.5}
        fill="var(--accent)"
        stroke="var(--bg)"
        strokeWidth="1.5"
      />
    </g>
  );
}

function TrailLine({ trail }) {
  if (!trail || trail.length < 2) return null;
  const pts = trail
    .map(({ r, c }) => {
      const p = cellCenter(r, c);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <polyline
      points={pts}
      fill="none"
      stroke="var(--hue-pink)"
      strokeWidth="1.5"
      strokeDasharray="3 3"
      opacity="0.7"
      strokeLinecap="round"
    />
  );
}

export default function QLearningViz() {
  const timerRef = useRef(null);
  const runningRef = useRef(false);
  const seedRef = useRef(7);
  const stateRef = useRef({ r: START.r, c: START.c });

  const [q, setQ] = useState(() => initQ());
  const [alpha, setAlpha] = useState(0.2);
  const [gamma, setGamma] = useState(0.95);
  const [epsilon, setEpsilon] = useState(0.2);

  const [episodeCount, setEpisodeCount] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [lastReturn, setLastReturn] = useState(null);
  const [avgReturn, setAvgReturn] = useState(null);
  const [episodeReturn, setEpisodeReturn] = useState(0);

  const [agentPos, setAgentPos] = useState({ r: START.r, c: START.c });
  const [lastAction, setLastAction] = useState(null);
  const [trail, setTrail] = useState([{ r: START.r, c: START.c }]);

  const [running, setRunning] = useState(false);
  const [fastRunning, setFastRunning] = useState(false);

  const randRef = useRef(rngFrom(7));

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

  // One environment step + Q update. Returns { done, reward, action }.
  const performStep = useCallback(
    (qLocal, pos) => {
      const rand = randRef.current;
      const { r, c } = pos;
      const action = epsilonGreedy(qLocal[r][c], epsilon, rand);
      const { nr, nc, reward, done } = stepEnv(r, c, action);
      const nextMax = done ? 0 : maxQ(qLocal[nr][nc]);
      const oldQ = qLocal[r][c][action];
      const target = reward + gamma * nextMax;
      const newQ = oldQ + alpha * (target - oldQ);
      const qNext = cloneQ(qLocal);
      qNext[r][c][action] = newQ;
      return { qNext, nr, nc, reward, done, action };
    },
    [alpha, gamma, epsilon]
  );

  // Single step in current episode (interactive). Resets if terminal reached.
  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    setQ((prev) => {
      const pos = stateRef.current;
      const { qNext, nr, nc, reward, done, action } = performStep(prev, pos);
      setLastAction(action);
      setEpisodeReturn((er) => er + reward);
      setTotalSteps((s) => s + 1);
      setTrail((t) => {
        const nt = t.concat([{ r: nr, c: nc }]);
        return nt.length > 80 ? nt.slice(nt.length - 80) : nt;
      });
      if (done) {
        setEpisodeCount((n) => n + 1);
        setEpisodeReturn((er) => {
          const finalR = er; // already includes this step's reward via setter above
          setLastReturn(finalR);
          setAvgReturn((prev) =>
            prev === null ? finalR : prev * 0.9 + finalR * 0.1
          );
          return 0;
        });
        stateRef.current = { r: START.r, c: START.c };
        setAgentPos({ r: START.r, c: START.c });
        setTrail([{ r: START.r, c: START.c }]);
      } else {
        stateRef.current = { r: nr, c: nc };
        setAgentPos({ r: nr, c: nc });
      }
      return qNext;
    });
  }, [performStep]);

  // Run one full episode until terminal; optionally animate.
  const runEpisode = useCallback(
    async (animate = true) => {
      let pos = { r: START.r, c: START.c };
      stateRef.current = pos;
      setAgentPos(pos);
      setTrail([pos]);
      let total = 0;
      let qLocal = q;
      // Read latest from setter to avoid stale closure
      setQ((cur) => {
        qLocal = cur;
        return cur;
      });
      // Wait a tick so qLocal reflects state
      await Promise.resolve();

      let steps = 0;
      while (steps < MAX_STEPS) {
        const res = performStep(qLocal, pos);
        qLocal = res.qNext;
        total += res.reward;
        steps += 1;
        pos = { r: res.nr, c: res.nc };
        if (animate) {
          setQ(qLocal);
          setAgentPos(pos);
          setLastAction(res.action);
          setEpisodeReturn(total);
          setTotalSteps((s) => s + 1);
          setTrail((t) => t.concat([pos]));
          await new Promise((r) => {
            timerRef.current = setTimeout(r, STEP_DELAY);
          });
          if (!runningRef.current && !animate) break;
        }
        if (res.done) break;
      }
      if (!animate) {
        setQ(qLocal);
        setAgentPos(pos);
        setTotalSteps((s) => s + steps);
        setTrail((t) => t.concat([pos]));
      }
      setEpisodeCount((n) => n + 1);
      setLastReturn(total);
      setAvgReturn((prev) => (prev === null ? total : prev * 0.9 + total * 0.1));
      setEpisodeReturn(0);
      // reset agent to start for next episode display
      stateRef.current = { r: START.r, c: START.c };
      return { total, steps };
    },
    [q, performStep]
  );

  const handleRunEpisode = useCallback(async () => {
    if (runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      clearTimer();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    await runEpisode(true);
    runningRef.current = false;
    setRunning(false);
    // park agent at start
    setAgentPos({ r: START.r, c: START.c });
    setTrail([{ r: START.r, c: START.c }]);
  }, [runEpisode, clearTimer]);

  // Fast batch — no per-step animation, computes synchronously then renders once.
  const handleRunBatch = useCallback(async () => {
    if (runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      setFastRunning(false);
      clearTimer();
      return;
    }
    runningRef.current = true;
    setFastRunning(true);
    setRunning(true);

    // Snapshot Q synchronously for batch updates.
    let qLocal;
    setQ((cur) => {
      qLocal = cloneQ(cur);
      return cur;
    });
    await Promise.resolve();

    let stepsAccum = 0;
    let lastEpReturn = 0;
    let avgEMA = null;
    setAvgReturn((cur) => {
      avgEMA = cur;
      return cur;
    });
    await Promise.resolve();

    for (let ep = 0; ep < BATCH_EPISODES; ep++) {
      if (!runningRef.current) break;
      let pos = { r: START.r, c: START.c };
      let total = 0;
      let steps = 0;
      while (steps < MAX_STEPS) {
        const res = performStep(qLocal, pos);
        qLocal = res.qNext;
        total += res.reward;
        steps += 1;
        pos = { r: res.nr, c: res.nc };
        if (res.done) break;
      }
      stepsAccum += steps;
      lastEpReturn = total;
      avgEMA = avgEMA === null ? total : avgEMA * 0.9 + total * 0.1;
      // Yield occasionally so UI stays responsive.
      if ((ep & 7) === 7) {
        await new Promise((r) => {
          timerRef.current = setTimeout(r, 0);
        });
      }
    }

    setQ(qLocal);
    setEpisodeCount((n) => n + BATCH_EPISODES);
    setTotalSteps((s) => s + stepsAccum);
    setLastReturn(lastEpReturn);
    setAvgReturn(avgEMA);
    setAgentPos({ r: START.r, c: START.c });
    setTrail([{ r: START.r, c: START.c }]);
    stateRef.current = { r: START.r, c: START.c };
    setEpisodeReturn(0);

    runningRef.current = false;
    setRunning(false);
    setFastRunning(false);
  }, [performStep, clearTimer]);

  const handleReset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setFastRunning(false);
    clearTimer();
    seedRef.current = 7;
    randRef.current = rngFrom(7);
    setQ(initQ());
    setEpisodeCount(0);
    setTotalSteps(0);
    setLastReturn(null);
    setAvgReturn(null);
    setEpisodeReturn(0);
    setAgentPos({ r: START.r, c: START.c });
    setLastAction(null);
    setTrail([{ r: START.r, c: START.c }]);
    stateRef.current = { r: START.r, c: START.c };
  }, [clearTimer]);

  const actionName = lastAction !== null ? ACTIONS[lastAction].name : '—';

  // Convergence heuristic: percentage of non-terminal cells whose best action
  // matches a hand-rolled near-optimal policy heuristic (right/down toward goal).
  const convergence = useMemo(() => {
    let agree = 0;
    let total = 0;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (isTerminal(r, c)) continue;
        total += 1;
        const best = argMax4(q[r][c]);
        // Optimal: prefer the axis that needs more travel; avoid pits.
        const dr = GOAL.r - r;
        const dc = GOAL.c - c;
        const preferred = [];
        if (Math.abs(dr) >= Math.abs(dc) && dr > 0) preferred.push(2);
        if (Math.abs(dc) >= Math.abs(dr) && dc > 0) preferred.push(1);
        if (preferred.length === 0) preferred.push(1, 2);
        // Penalize stepping into a pit.
        const a = ACTIONS[best];
        const nr = Math.max(0, Math.min(GRID - 1, r + a.dr));
        const nc = Math.max(0, Math.min(GRID - 1, c + a.dc));
        if (isPit(nr, nc)) continue;
        if (preferred.includes(best)) agree += 1;
      }
    }
    return total > 0 ? agree / total : 0;
  }, [q]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <defs>
            <marker
              id="ql-arrow-acc"
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
              id="ql-arrow-sky"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-sky)" />
            </marker>
            <marker
              id="ql-arrow-hard"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hard)" />
            </marker>
          </defs>

          <GridLayer />
          <CellLabels />
          <ValueText q={q} />
          <QArrows q={q} />
          <TrailLine trail={trail} />
          <Agent r={agentPos.r} c={agentPos.c} />
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
            Q-LEARNING
          </span>
          <span className="mlviz-val">episode {episodeCount}</span>
          <span className="mlviz-sub">steps {totalSteps}</span>
          <span className="mlviz-sub">
            state ({agentPos.r},{agentPos.c})
          </span>
          <span className="mlviz-sub">action {actionName}</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-sub">
            current return {snap(episodeReturn, 2)}
          </span>
          <span className="mlviz-sub">last {snap(lastReturn, 2)}</span>
          <span className="mlviz-sub">avg {snap(avgReturn, 2)}</span>
          <span className="mlviz-sub">
            policy fit {Math.round(convergence * 100)}%
          </span>
        </div>

        <div className="mlviz-controls">
          <div className="mlviz-slider">
            <div className="mlviz-slider-label">
              <span>alpha (learning rate)</span>
              <span className="mlviz-slider-val">{alpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              disabled={running}
            />
          </div>
          <div className="mlviz-slider">
            <div className="mlviz-slider-label">
              <span>gamma (discount)</span>
              <span className="mlviz-slider-val">{gamma.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.99"
              step="0.01"
              value={gamma}
              onChange={(e) => setGamma(parseFloat(e.target.value))}
              disabled={running}
            />
          </div>
          <div className="mlviz-slider">
            <div className="mlviz-slider-label">
              <span>epsilon (exploration)</span>
              <span className="mlviz-slider-val">{epsilon.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
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
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRunEpisode}
            disabled={fastRunning}
          >
            {running && !fastRunning ? <Square size={13} /> : <Play size={13} />}
            <span>{running && !fastRunning ? 'Stop' : 'Run episode'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleRunBatch}
            disabled={running && !fastRunning}
          >
            {fastRunning ? <Square size={13} /> : <FastForward size={13} />}
            <span>{fastRunning ? 'Stop' : `Run x${BATCH_EPISODES}`}</span>
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
          Q(s,a) &lt;- Q(s,a) + alpha * (r + gamma * max Q(s&apos;,a&apos;) - Q(s,a))
        </div>
      </div>
    </div>
  );
}
