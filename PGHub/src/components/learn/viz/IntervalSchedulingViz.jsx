import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './IntervalSchedulingViz.css';

// Weighted interval scheduling DP.
// Jobs sorted by end time. For job j, p(j) = the latest job (in sorted order)
// whose end <= start[j] (compatible, no overlap), found by binary search.
// dp[j] = max(dp[j-1] (skip j), weight[j] + dp[p(j)] (take j)).
// dp[0] = 0 sentinel; dp index i corresponds to the first i sorted jobs.

const JOBS = [
  { id: 'a', start: 1, end: 3, weight: 5 },
  { id: 'b', start: 2, end: 5, weight: 6 },
  { id: 'c', start: 4, end: 6, weight: 5 },
  { id: 'd', start: 6, end: 7, weight: 4 },
  { id: 'e', start: 5, end: 8, weight: 11 },
  { id: 'f', start: 7, end: 9, weight: 2 },
];

// Sort by end time, keep stable order; assign 1-based labels J1..Jn.
const SORTED = [...JOBS]
  .sort((x, y) => x.end - y.end || x.start - y.start)
  .map((j, i) => ({ ...j, label: `J${i + 1}` }));

const N = SORTED.length;
const TIME_MIN = Math.min(...SORTED.map((j) => j.start));
const TIME_MAX = Math.max(...SORTED.map((j) => j.end));

// p(j): latest sorted index k (1-based, 0 = none) with end[k] <= start[j].
// Binary search over sorted-by-end jobs.
function predecessor(jSortedIdx) {
  const s = SORTED[jSortedIdx].start;
  let lo = 0;
  let hi = jSortedIdx - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (SORTED[mid].end <= s) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans; // -1 = no compatible predecessor; otherwise 0-based sorted index
}

const P = SORTED.map((_, i) => predecessor(i)); // 0-based sorted idx or -1

function reconstruct(dp) {
  // Walk back from index N choosing take vs skip.
  const chosen = [];
  let i = N;
  while (i >= 1) {
    const j = i - 1; // 0-based sorted job
    const take = SORTED[j].weight + dp[P[j] + 1];
    const skip = dp[i - 1];
    if (take >= skip) {
      chosen.push(j);
      i = P[j] + 1;
    } else {
      i -= 1;
    }
  }
  return new Set(chosen);
}

function buildFrames() {
  const dp = new Array(N + 1).fill(0); // dp[0] = 0 sentinel
  const frames = [];

  frames.push({
    dp: [...dp],
    cur: -1,
    pj: null,
    take: null,
    skip: null,
    decision: null,
    best: 0,
    chosen: new Set(),
    phase: 'init',
    note:
      `Jobs sorted by finish time: ${SORTED.map((j) => `${j.label}[${j.start},${j.end},w${j.weight}]`).join(', ')}. ` +
      `dp[0]=0 is the empty-prefix base case. dp[i] = best total weight using the first i jobs.`,
  });

  for (let i = 1; i <= N; i++) {
    const j = i - 1; // 0-based sorted job
    const pIdx = P[j]; // 0-based predecessor sorted idx, or -1
    const dpPrev = dp[i - 1];
    const dpPred = dp[pIdx + 1]; // pIdx+1 maps to dp index (0 -> sentinel)
    const take = SORTED[j].weight + dpPred;
    const skip = dpPrev;
    const decision = take >= skip ? 'take' : 'skip';
    dp[i] = Math.max(take, skip);

    const pLabel = pIdx === -1 ? 'none (0)' : SORTED[pIdx].label;
    const pDpRef = pIdx === -1 ? 'dp[0]=0' : `dp[${pIdx + 1}]=${dpPred}`;
    frames.push({
      dp: [...dp],
      cur: j,
      pj: pIdx,
      take,
      skip,
      decision,
      best: dp[i],
      chosen: new Set(),
      phase: 'fill',
      note:
        `${SORTED[j].label} [${SORTED[j].start},${SORTED[j].end},w${SORTED[j].weight}]: ` +
        `p(${SORTED[j].label})=${pLabel}; ` +
        `take = ${SORTED[j].weight} + ${pDpRef} -> ${take} vs skip dp[${i - 1}]=${skip} -> ${Math.max(take, skip)} ` +
        `-> ${decision}, dp[${i}]=${dp[i]}.`,
    });
  }

  const chosen = reconstruct(dp);
  frames.push({
    dp: [...dp],
    cur: -1,
    pj: null,
    take: null,
    skip: null,
    decision: null,
    best: dp[N],
    chosen,
    phase: 'done',
    note:
      `Maximum total weight = dp[${N}] = ${dp[N]}. ` +
      `Backtracking the take/skip choices selects ${[...chosen]
        .sort((a, b) => a - b)
        .map((k) => SORTED[k].label)
        .join(', ')} — a non-overlapping set achieving the optimum.`,
  });

  return frames;
}

export default function IntervalSchedulingViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1000 / speed);

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

  // ---- geometry ----
  const W = 940;
  const H = 470;

  // Timeline panel (top): bars along x = time, one row per sorted job.
  const tlX0 = 24;
  const tlW = W - 48;
  const tlTop = 56;
  const laneH = 34;
  const laneGap = 6;
  const axisY = tlTop + N * (laneH + laneGap) + 10;

  const span = TIME_MAX - TIME_MIN;
  const labelColW = 56;
  const trackX0 = tlX0 + labelColW;
  const trackW = tlW - labelColW - 12;
  const timeX = (t) => trackX0 + ((t - TIME_MIN) / span) * trackW;

  // dp table (bottom): N+1 cells dp[0..N].
  const tblTop = axisY + 50;
  const tblX0 = 24;
  const dpCellGap = 6;
  const dpCols = N + 1;
  const dpCellW = (W - 48 - dpCellGap * (dpCols - 1)) / dpCols;
  const dpY = tblTop + 18;
  const dpCellH = 38;
  const dpCellX = (i) => tblX0 + i * (dpCellW + dpCellGap);

  const curJob = current.cur >= 0 ? SORTED[current.cur] : null;
  const pj = current.pj;

  return (
    <div className="wis">
      <div className="wis-head">
        <h3 className="wis-title">Weighted interval scheduling — pick the heaviest non-overlapping set</h3>
        <p className="wis-sub">
          Sort jobs by finish time. For each job j, p(j) is the latest job that ends before j starts. Then
          dp[j] = max(skip j = dp[j-1], take j = weight[j] + dp[p(j)]). The optimum is dp[n].
        </p>
      </div>

      <div className="wis-controls">
        <div className="wis-buttons">
          <button
            type="button"
            className="wis-btn wis-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="wis-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="wis-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="wis-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="wis-speed">
          <span className="wis-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="wis-speed-range"
          />
          <span className="wis-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="wis-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="wis-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="wis-svg" preserveAspectRatio="xMidYMid meet">
          {/* timeline panel */}
          <rect x={tlX0 - 4} y={36} width={tlW + 8} height={axisY - 30} rx={8} fill="var(--bg)" stroke="var(--border)" />
          <text x={tlX0} y={28} className="wis-panel-label">
            jobs on the timeline (sorted by finish time)
          </text>

          {/* time grid ticks */}
          {Array.from({ length: span + 1 }).map((_, k) => {
            const t = TIME_MIN + k;
            const gx = timeX(t);
            return (
              <g key={`tick-${t}`}>
                <line x1={gx} y1={tlTop - 6} x2={gx} y2={axisY} stroke="var(--border)" strokeWidth={0.8} opacity={0.45} />
                <text x={gx} y={axisY + 16} className="wis-tick">
                  {t}
                </text>
              </g>
            );
          })}
          <text x={trackX0 + trackW / 2} y={axisY + 32} className="wis-axis-label">
            time
          </text>

          {/* job bars */}
          {SORTED.map((job, idx) => {
            const y = tlTop + idx * (laneH + laneGap);
            const x = timeX(job.start);
            const x2 = timeX(job.end);
            const isCur = idx === current.cur;
            const isPred = pj != null && idx === pj && current.phase === 'fill';
            const isChosen = current.chosen.has(idx);
            let fill = 'rgba(var(--accent-rgb), 0.16)';
            let stroke = 'rgba(var(--accent-rgb), 0.5)';
            let txt = 'var(--text-main)';
            if (isChosen) {
              fill = 'var(--easy)';
              stroke = 'var(--easy)';
              txt = 'var(--bg)';
            } else if (isCur) {
              fill = 'var(--accent)';
              stroke = 'var(--accent)';
              txt = 'var(--bg)';
            } else if (isPred) {
              fill = 'var(--hue-sky)';
              stroke = 'var(--hue-sky)';
              txt = 'var(--bg)';
            }
            return (
              <g key={`bar-${job.id}`}>
                <text x={tlX0 + 6} y={y + laneH / 2 + 4} className="wis-job-label">
                  {job.label}
                </text>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(8, x2 - x)}
                  height={laneH}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCur || isPred || isChosen ? 2.4 : 1.2}
                />
                <text x={(x + x2) / 2} y={y + laneH / 2 + 4} className="wis-bar-text" style={{ fill: txt }}>
                  w{job.weight}
                </text>
                {isCur && current.phase === 'fill' && (
                  <text x={(x + x2) / 2} y={y - 4} className="wis-bar-tag" style={{ fill: 'var(--accent)' }}>
                    j
                  </text>
                )}
                {isPred && (
                  <text x={(x + x2) / 2} y={y - 4} className="wis-bar-tag" style={{ fill: 'var(--hue-sky)' }}>
                    p(j)
                  </text>
                )}
              </g>
            );
          })}

          {/* compatibility guide line: where current job starts */}
          {curJob && current.phase === 'fill' && (
            <line
              x1={timeX(curJob.start)}
              y1={tlTop - 6}
              x2={timeX(curJob.start)}
              y2={axisY}
              stroke="var(--accent)"
              strokeWidth={1.6}
              strokeDasharray="4 4"
            />
          )}

          {/* dp table */}
          <text x={tblX0} y={tblTop} className="wis-panel-label">
            dp[i] — best total weight using the first i sorted jobs
          </text>
          {current.dp.map((val, i) => {
            const isCurCell = current.phase === 'fill' && i === current.cur + 1;
            const isPredCell =
              current.phase === 'fill' && pj != null && i === pj + 1;
            const isSkipCell = current.phase === 'fill' && i === current.cur;
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            let txt = 'var(--text-main)';
            if (isCurCell) {
              fill = 'var(--accent)';
              stroke = 'var(--accent)';
              txt = 'var(--bg)';
            } else if (isPredCell) {
              fill = 'var(--hue-sky)';
              stroke = 'var(--hue-sky)';
              txt = 'var(--bg)';
            } else if (isSkipCell) {
              fill = 'rgba(var(--accent-rgb), 0.16)';
              stroke = 'var(--accent)';
            }
            return (
              <g key={`dp-${i}`}>
                <rect
                  x={dpCellX(i)}
                  y={dpY}
                  width={dpCellW}
                  height={dpCellH}
                  rx={5}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCurCell || isPredCell ? 2.4 : 1}
                />
                <text x={dpCellX(i) + dpCellW / 2} y={dpY + dpCellH / 2 + 5} className="wis-dp-val" style={{ fill: txt }}>
                  {val}
                </text>
                <text x={dpCellX(i) + dpCellW / 2} y={dpY - 6} className="wis-dp-idx">
                  dp[{i}]
                </text>
                {isPredCell && (
                  <text x={dpCellX(i) + dpCellW / 2} y={dpY + dpCellH + 14} className="wis-dp-note" style={{ fill: 'var(--hue-sky)' }}>
                    p(j)
                  </text>
                )}
                {isSkipCell && (
                  <text x={dpCellX(i) + dpCellW / 2} y={dpY + dpCellH + 14} className="wis-dp-note" style={{ fill: 'var(--accent)' }}>
                    skip
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="wis-metrics">
        <div className="wis-metric">
          <span className="wis-metric-label">current job</span>
          <span className="wis-metric-value">
            {curJob ? `${curJob.label} [${curJob.start},${curJob.end}] w${curJob.weight}` : '—'}
          </span>
        </div>
        <div className="wis-metric">
          <span className="wis-metric-label">p(j)</span>
          <span className="wis-metric-value">
            {current.phase === 'fill' ? (pj === -1 ? 'none' : SORTED[pj].label) : '—'}
          </span>
        </div>
        <div className="wis-metric">
          <span className="wis-metric-label">take vs skip</span>
          <span className="wis-metric-value">
            {current.take == null ? '—' : `${current.take} vs ${current.skip}`}
          </span>
        </div>
        <div className="wis-metric">
          <span className="wis-metric-label">decision</span>
          <span className="wis-metric-value">{current.decision || '—'}</span>
        </div>
        <div className="wis-metric wis-metric-best">
          <span className="wis-metric-label">running best</span>
          <span className="wis-metric-value">{current.best}</span>
        </div>
      </div>

      <div className="wis-arith">
        <span className="wis-arith-label">trace</span>
        <span className="wis-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
