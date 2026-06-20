import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './BitmaskDPViz.css';

// Held-Karp bitmask DP for the travelling salesman problem.
// dp[mask][i] = length of the shortest path that starts at START, visits
// exactly the set of cities in `mask`, and currently ends at city i.
// Transition: for each unvisited j, dp[mask|1<<j][j] = min(dp[mask|1<<j][j],
//   dp[mask][i] + dist[i][j]). Answer = min over i of dp[FULL][i] + dist[i][START].

const CITIES = [
  { id: 0, label: 'A', x: 150, y: 90 },
  { id: 1, label: 'B', x: 430, y: 70 },
  { id: 2, label: 'C', x: 150, y: 300 },
  { id: 3, label: 'D', x: 430, y: 320 },
];

const DIST = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

const N = CITIES.length;
const START = 0;
const FULL = (1 << N) - 1;
const INF = Infinity;

function maskBits(mask) {
  const out = [];
  for (let i = N - 1; i >= 0; i--) out.push((mask >> i) & 1);
  return out;
}

function maskStr(mask) {
  return maskBits(mask).join('');
}

function maskSet(mask) {
  const picked = [];
  for (let i = 0; i < N; i++) if ((mask >> i) & 1) picked.push(CITIES[i].label);
  return picked.length ? `{${picked.join(',')}}` : '{}';
}

function cloneDp(dp) {
  return dp.map((row) => row.slice());
}

// Reconstruct the partial tour START -> ... -> end city for state (mask, end).
function reconstruct(parent, mask, end) {
  const path = [];
  let m = mask;
  let cur = end;
  while (cur !== -1) {
    path.push(cur);
    const pr = parent[m][cur];
    m ^= 1 << cur;
    cur = pr;
  }
  path.reverse();
  return path;
}

function buildFrames() {
  const dp = Array.from({ length: 1 << N }, () => new Array(N).fill(INF));
  const parent = Array.from({ length: 1 << N }, () => new Array(N).fill(-1));
  dp[1 << START][START] = 0;

  const frames = [];

  frames.push({
    dp: cloneDp(dp),
    mask: 1 << START,
    end: START,
    next: null,
    nmask: null,
    value: 0,
    cand: null,
    accepted: null,
    path: [START],
    best: null,
    bestPath: null,
    phase: 'init',
    note: `Base case: dp[${maskStr(1 << START)}][${CITIES[START].label}] = 0. The tour starts at city ${CITIES[START].label}, having visited only itself.`,
  });

  // Iterate masks in increasing order; a transition only ever sets a larger mask.
  for (let mask = 0; mask <= FULL; mask++) {
    if (!((mask >> START) & 1)) continue; // every valid state includes START
    for (let i = 0; i < N; i++) {
      if (!((mask >> i) & 1)) continue;
      if (dp[mask][i] === INF) continue;
      for (let j = 0; j < N; j++) {
        if ((mask >> j) & 1) continue; // j already visited
        const nmask = mask | (1 << j);
        const cand = dp[mask][i] + DIST[i][j];
        const prev = dp[nmask][j];
        const accepted = cand < prev;
        if (accepted) {
          dp[nmask][j] = cand;
          parent[nmask][j] = i;
        }
        frames.push({
          dp: cloneDp(dp),
          mask,
          end: i,
          next: j,
          nmask,
          value: dp[mask][i],
          cand,
          prev,
          accepted,
          path: reconstruct(parent, accepted ? nmask : mask, accepted ? j : i),
          best: null,
          bestPath: null,
          phase: 'relax',
          note:
            `mask ${maskStr(mask)} ${maskSet(mask)} end at ${CITIES[i].label}: extend to ${CITIES[j].label} -> ` +
            `dp[${maskStr(nmask)}][${CITIES[j].label}] = dp[${maskStr(mask)}][${CITIES[i].label}] + dist[${CITIES[i].label}][${CITIES[j].label}] = ` +
            `${dp[mask][i]} + ${DIST[i][j]} = ${cand}. ` +
            (accepted
              ? `${prev === INF ? 'First value' : `Beats old ${prev}`} -> accept.`
              : `Not better than ${prev} -> keep old.`),
        });
      }
    }
  }

  // Close the tour: answer = min over i of dp[FULL][i] + dist[i][START].
  let best = INF;
  let bestEnd = -1;
  for (let i = 0; i < N; i++) {
    if (i === START) continue;
    if (dp[FULL][i] === INF) continue;
    const total = dp[FULL][i] + DIST[i][START];
    const better = total < best;
    if (better) {
      best = total;
      bestEnd = i;
    }
    frames.push({
      dp: cloneDp(dp),
      mask: FULL,
      end: i,
      next: START,
      nmask: FULL,
      value: dp[FULL][i],
      cand: total,
      accepted: better,
      path: [...reconstruct(parent, FULL, i), START],
      best: best === INF ? null : best,
      bestPath: bestEnd === -1 ? null : [...reconstruct(parent, FULL, bestEnd), START],
      phase: 'close',
      note:
        `Close the loop: dp[${maskStr(FULL)}][${CITIES[i].label}] + dist[${CITIES[i].label}][${CITIES[START].label}] = ` +
        `${dp[FULL][i]} + ${DIST[i][START]} = ${total}. ` +
        (better ? `New best tour cost = ${total}.` : `Best stays ${best}.`),
    });
  }

  frames.push({
    dp: cloneDp(dp),
    mask: FULL,
    end: bestEnd,
    next: START,
    nmask: FULL,
    value: bestEnd === -1 ? null : dp[FULL][bestEnd],
    cand: best === INF ? null : best,
    accepted: null,
    path: bestEnd === -1 ? [START] : [...reconstruct(parent, FULL, bestEnd), START],
    best: best === INF ? null : best,
    bestPath: bestEnd === -1 ? null : [...reconstruct(parent, FULL, bestEnd), START],
    phase: 'done',
    note: `Optimal tour cost = ${best}, returning to ${CITIES[START].label}. Held-Karp runs in O(2^n · n^2) vs O(n!) brute force.`,
  });

  return frames;
}

const VAL = (v) => (v === INF || v == null ? '∞' : v);

export default function BitmaskDPViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

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

  // City graph occupies the left half.
  const graphX0 = 20;
  const graphW = 540;

  // dp table occupies the right half: rows = mask (1<<N values), cols = end city.
  const tblX = graphX0 + graphW + 26;
  const tblTop = 60;
  const labelColW = 96;
  const cellGap = 4;
  const colW = (W - tblX - labelColW - 20 - cellGap * (N - 1)) / N;
  const rowsCount = 1 << N;
  const rowH = Math.min(22, (H - tblTop - 28) / rowsCount);

  const colX = (c) => tblX + labelColW + c * (colW + cellGap);
  const rowY = (m) => tblTop + m * rowH;

  // Tour path edges for the city graph (consecutive ids in current.path).
  const pathPairs = new Set();
  for (let i = 0; i + 1 < current.path.length; i++) {
    const a = current.path[i];
    const b = current.path[i + 1];
    pathPairs.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
  }
  const pathNodes = new Set(current.path);

  // All undirected city pairs for the faint base graph.
  const allEdges = [];
  for (let a = 0; a < N; a++) {
    for (let b = a + 1; b < N; b++) allEdges.push([a, b]);
  }

  const bits = maskBits(current.mask);

  return (
    <div className="bmd">
      <div className="bmd-head">
        <h3 className="bmd-title">Bitmask DP — Held-Karp for the travelling salesman</h3>
        <p className="bmd-sub">
          dp[mask][i] is the shortest route that visits exactly the cities in mask and ends at city i.
          Extend each state to an unvisited city, relaxing dp[mask | 1&lt;&lt;j][j]. The answer closes the loop
          back to the start.
        </p>
      </div>

      <div className="bmd-controls">
        <div className="bmd-buttons">
          <button
            type="button"
            className="bmd-btn bmd-btn-primary"
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
            className="bmd-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="bmd-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="bmd-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="bmd-speed">
          <span className="bmd-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bmd-speed-range"
          />
          <span className="bmd-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="bmd-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="bmd-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bmd-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- city graph panel ---- */}
          <rect x={graphX0} y={36} width={graphW} height={H - 56} rx={8} fill="var(--bg)" stroke="var(--border)" />
          <text x={graphX0 + 12} y={26} className="bmd-panel-label">
            cities — partial tour highlighted
          </text>

          {/* base edges with distance labels */}
          {allEdges.map(([a, b]) => {
            const key = `${a}-${b}`;
            const onPath = pathPairs.has(key);
            const ca = CITIES[a];
            const cb = CITIES[b];
            const mx = (ca.x + cb.x) / 2;
            const my = (ca.y + cb.y) / 2;
            return (
              <g key={`edge-${key}`}>
                <line
                  x1={ca.x}
                  y1={ca.y}
                  x2={cb.x}
                  y2={cb.y}
                  stroke={onPath ? 'var(--hue-pink)' : 'var(--border)'}
                  strokeWidth={onPath ? 3.4 : 1.2}
                  opacity={onPath ? 1 : 0.5}
                />
                <rect x={mx - 14} y={my - 10} width={28} height={16} rx={4} fill="var(--bg)" opacity={0.85} />
                <text
                  x={mx}
                  y={my + 2}
                  className="bmd-dist"
                  style={{ fill: onPath ? 'var(--hue-pink)' : 'var(--text-dim)' }}
                >
                  {DIST[a][b]}
                </text>
              </g>
            );
          })}

          {/* city nodes */}
          {CITIES.map((c) => {
            const isStart = c.id === START;
            const isEnd = c.id === current.end && current.phase !== 'init';
            const isNext = c.id === current.next && current.phase === 'relax';
            const onTour = pathNodes.has(c.id);
            let fill = 'var(--surface)';
            let stroke = 'var(--border)';
            if (isNext) {
              fill = 'var(--hue-sky)';
              stroke = 'var(--hue-sky)';
            } else if (isEnd) {
              fill = 'var(--accent)';
              stroke = 'var(--accent)';
            } else if (onTour) {
              fill = 'rgba(var(--accent-rgb), 0.22)';
              stroke = 'var(--accent)';
            } else if (isStart) {
              stroke = 'var(--hue-mint)';
            }
            const labelFill = isNext || isEnd ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`city-${c.id}`}>
                <circle cx={c.x} cy={c.y} r={26} fill={fill} stroke={stroke} strokeWidth={isEnd || isNext ? 3 : 2} />
                <text x={c.x} y={c.y + 6} className="bmd-city-label" style={{ fill: labelFill }}>
                  {c.label}
                </text>
                {isStart && (
                  <text x={c.x} y={c.y + 44} className="bmd-city-tag">
                    start
                  </text>
                )}
              </g>
            );
          })}

          {/* current tour order as a readout under the graph */}
          <text x={graphX0 + 12} y={H - 26} className="bmd-tour">
            tour: {current.path.map((id) => CITIES[id].label).join(' -> ') || '—'}
          </text>

          {/* ---- mask bit row ---- */}
          <text x={tblX} y={26} className="bmd-panel-label">
            mask {maskStr(current.mask)} = {maskSet(current.mask)}
          </text>
          {bits.map((v, c) => {
            const pos = N - 1 - c;
            const on = v === 1;
            const bw = 26;
            const bh = 22;
            const bx = tblX + labelColW + c * (bw + 4);
            return (
              <g key={`maskbit-${c}`}>
                <rect
                  x={bx}
                  y={36}
                  width={bw}
                  height={bh}
                  rx={4}
                  fill={on ? 'var(--accent)' : 'var(--bg)'}
                  stroke={on ? 'var(--accent)' : 'var(--border)'}
                />
                <text
                  x={bx + bw / 2}
                  y={36 + bh / 2 + 5}
                  className="bmd-maskbit"
                  style={{ fill: on ? 'var(--bg)' : 'var(--text-dim)' }}
                >
                  {v}
                </text>
                <text x={bx + bw / 2} y={36 - 4} className="bmd-maskcity">
                  {CITIES[pos].label}
                </text>
              </g>
            );
          })}

          {/* ---- dp table ---- */}
          <text x={tblX} y={tblTop - 22} className="bmd-panel-label">
            dp[mask][end city]
          </text>
          {/* column headers */}
          {CITIES.map((c, j) => (
            <text key={`colh-${j}`} x={colX(j) + colW / 2} y={tblTop - 6} className="bmd-colh">
              {c.label}
            </text>
          ))}
          <text x={tblX} y={tblTop - 6} className="bmd-colh-mask">
            mask
          </text>

          {Array.from({ length: rowsCount }).map((_, m) => {
            const includesStart = (m >> START) & 1;
            const isCurMask = m === current.mask;
            const isNMask = m === current.nmask && current.phase === 'relax';
            return (
              <g key={`row-${m}`}>
                <text
                  x={tblX}
                  y={rowY(m) + rowH / 2 + 4}
                  className="bmd-rowlabel"
                  style={{
                    fill: isCurMask
                      ? 'var(--accent)'
                      : isNMask
                        ? 'var(--hue-sky)'
                        : includesStart
                          ? 'var(--text-dim)'
                          : 'var(--border)',
                  }}
                >
                  {maskStr(m)}
                </text>
                {CITIES.map((_, j) => {
                  const val = current.dp[m][j];
                  const known = val !== INF;
                  const isSrcCell = isCurMask && j === current.end && current.phase === 'relax';
                  const isDstCell = isNMask && j === current.next;
                  let fill = 'var(--bg)';
                  let stroke = 'var(--border)';
                  if (isDstCell) {
                    fill = current.accepted ? 'var(--hue-sky)' : 'rgba(var(--accent-rgb), 0.10)';
                    stroke = 'var(--hue-sky)';
                  } else if (isSrcCell) {
                    fill = 'var(--accent)';
                    stroke = 'var(--accent)';
                  } else if (known) {
                    fill = 'rgba(var(--accent-rgb), 0.14)';
                    stroke = 'rgba(var(--accent-rgb), 0.4)';
                  }
                  const txtFill = isDstCell || isSrcCell ? 'var(--bg)' : known ? 'var(--text-main)' : 'var(--border)';
                  return (
                    <g key={`cell-${m}-${j}`}>
                      <rect
                        x={colX(j)}
                        y={rowY(m) + 1}
                        width={colW}
                        height={rowH - 2}
                        rx={3}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={isSrcCell || isDstCell ? 2 : 0.8}
                      />
                      <text
                        x={colX(j) + colW / 2}
                        y={rowY(m) + rowH / 2 + 4}
                        className="bmd-cellval"
                        style={{ fill: txtFill }}
                      >
                        {VAL(val)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="bmd-metrics">
        <div className="bmd-metric">
          <span className="bmd-metric-label">mask (binary)</span>
          <span className="bmd-metric-value">{maskStr(current.mask)}</span>
        </div>
        <div className="bmd-metric">
          <span className="bmd-metric-label">visited set</span>
          <span className="bmd-metric-value">{maskSet(current.mask)}</span>
        </div>
        <div className="bmd-metric">
          <span className="bmd-metric-label">end city</span>
          <span className="bmd-metric-value">{current.end >= 0 ? CITIES[current.end].label : '—'}</span>
        </div>
        <div className="bmd-metric">
          <span className="bmd-metric-label">dp value</span>
          <span className="bmd-metric-value">{VAL(current.value)}</span>
        </div>
        <div className="bmd-metric bmd-metric-best">
          <span className="bmd-metric-label">best tour cost</span>
          <span className="bmd-metric-value">{current.best == null ? '—' : current.best}</span>
        </div>
      </div>

      <div className="bmd-arith">
        <span className="bmd-arith-label">trace</span>
        <span className="bmd-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
