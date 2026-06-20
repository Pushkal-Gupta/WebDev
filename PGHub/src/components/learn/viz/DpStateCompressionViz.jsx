import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './DpStateCompressionViz.css';

// Bitmask DP — TSP-lite over N cities starting from city 0.
// dp[mask][i] = minimum cost of a path that has visited exactly the set of
// cities in `mask`, ending at city i (i must be in mask).
//   dp[1][0] = 0  (start at city 0, only city 0 visited)
//   dp[mask | (1<<j)][j] = min over i in mask of dp[mask][i] + dist[i][j]
// We iterate masks in increasing numeric order so every subset is final
// before any of its supersets are read. Answer = min over i of
// dp[full][i] + dist[i][0]  (return to start).

const N = 4;
const FULL = (1 << N) - 1; // 15

// Seeded symmetric distance matrix (hardcoded, no RNG needed).
const DIST = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

const INF = Infinity;

function emptyDp() {
  const dp = [];
  for (let m = 0; m <= FULL; m++) dp.push(new Array(N).fill(INF));
  return dp;
}

function cloneDp(dp) {
  return dp.map((r) => r.slice());
}

const bin = (mask) => mask.toString(2).padStart(N, '0');
const bitsOf = (mask) => {
  const out = [];
  for (let i = 0; i < N; i++) if (mask & (1 << i)) out.push(i);
  return out;
};

function buildFrames() {
  const dp = emptyDp();
  const frames = [];

  dp[1][0] = 0; // start: only city 0, ending at 0
  frames.push({
    dp: cloneDp(dp),
    mask: 1,
    from: 0,
    add: null,
    newMask: null,
    cost: 0,
    cand: null,
    accepted: null,
    best: null,
    phase: 'seed',
    note:
      `Seed: start at city 0 with only city 0 visited. mask = ${bin(1)} (=1), ` +
      `dp[${bin(1)}][0] = 0. Every tour grows from here by adding one unvisited city at a time.`,
  });

  // Iterate masks in increasing numeric order.
  for (let mask = 1; mask <= FULL; mask++) {
    if (!(mask & 1)) continue; // every valid path includes the start city 0
    for (let i = 0; i < N; i++) {
      if (!(mask & (1 << i))) continue;
      if (dp[mask][i] === INF) continue;
      for (let j = 0; j < N; j++) {
        if (mask & (1 << j)) continue; // already visited
        const newMask = mask | (1 << j);
        const cand = dp[mask][i] + DIST[i][j];
        const prev = dp[newMask][j];
        const accepted = cand < prev;
        if (accepted) dp[newMask][j] = cand;
        frames.push({
          dp: cloneDp(dp),
          mask,
          from: i,
          add: j,
          newMask,
          cost: dp[mask][i],
          edge: DIST[i][j],
          cand,
          prev: prev === INF ? null : prev,
          accepted,
          best: null,
          phase: 'relax',
          note:
            `From mask ${bin(mask)} ending at city ${i} (cost ${dp[mask][i]}), add city ${j}: ` +
            `new mask ${bin(newMask)}, dp = ${dp[mask][i]} + dist[${i}][${j}](${DIST[i][j]}) = ${cand}. ` +
            (accepted
              ? `${prev === INF ? 'First value' : `Better than ${prev}`} — set dp[${bin(newMask)}][${j}] = ${cand}.`
              : `Not better than ${prev}; keep it.`),
        });
      }
    }
  }

  // Close the tour: return to city 0 from each possible end.
  let answer = INF;
  let bestEnd = -1;
  for (let i = 0; i < N; i++) {
    if (dp[FULL][i] === INF) continue;
    const total = dp[FULL][i] + DIST[i][0];
    if (total < answer) {
      answer = total;
      bestEnd = i;
    }
    frames.push({
      dp: cloneDp(dp),
      mask: FULL,
      from: i,
      add: 0,
      newMask: FULL,
      cost: dp[FULL][i],
      edge: DIST[i][0],
      cand: total,
      prev: null,
      accepted: total === answer,
      best: answer === INF ? null : answer,
      phase: 'close',
      note:
        `Close tour from full mask ${bin(FULL)} ending at city ${i}: ` +
        `dp + dist[${i}][0] = ${dp[FULL][i]} + ${DIST[i][0]} = ${total}. ` +
        `Best round trip so far: ${answer}.`,
    });
  }

  frames.push({
    dp: cloneDp(dp),
    mask: FULL,
    from: bestEnd,
    add: 0,
    newMask: FULL,
    cost: dp[FULL][bestEnd],
    edge: DIST[bestEnd][0],
    cand: answer,
    prev: null,
    accepted: null,
    best: answer,
    phase: 'done',
    note:
      `Optimal tour cost = ${answer}, closing from city ${bestEnd} back to 0. ` +
      `Bitmask DP visits ${FULL + 1} masks × ${N} ends in O(2^n · n^2) time, O(2^n · n) space.`,
  });

  return frames;
}

const VAL = (v) => (v === INF || v == null ? '·' : v);

export default function DpStateCompressionViz() {
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

  // City graph occupies a panel on the right; dp table on the left.
  const tblX = 30;
  const tblTop = 56;
  const rowH = 24;
  const headerW = 96; // mask label column
  const colW = 56; // per-node column
  const tableW = headerW + N * colW;

  // City positions (square layout) in the right panel.
  const graphX0 = tableW + tblX + 60;
  const graphW = W - graphX0 - 24;
  const graphCx = graphX0 + graphW / 2;
  const graphCy = tblTop + (N * rowH) / 2 + 30;
  const graphR = Math.min(graphW, N * rowH) / 2 - 8;
  const cityPos = [
    { x: graphCx - graphR, y: graphCy - graphR },
    { x: graphCx + graphR, y: graphCy - graphR },
    { x: graphCx + graphR, y: graphCy + graphR },
    { x: graphCx - graphR, y: graphCy + graphR },
  ];

  const dp = current.dp;
  const maskBits = new Set(bitsOf(current.mask));
  const fromCity = current.from;
  const addCity = current.add;

  return (
    <div className="scv">
      <div className="scv-head">
        <h3 className="scv-title">Bitmask DP — subset states (TSP over 4 cities)</h3>
        <p className="scv-sub">
          dp[mask][i] is the cheapest path visiting exactly the cities in mask, ending at city i.
          Masks fill in increasing order, so each subset is final before its supersets read it.
        </p>
      </div>

      <div className="scv-controls">
        <div className="scv-buttons">
          <button
            type="button"
            className="scv-btn scv-btn-primary"
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
            className="scv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="scv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="scv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="scv-speed">
          <span className="scv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="scv-speed-range"
          />
          <span className="scv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="scv-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="scv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="scv-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- dp table ---- */}
          <text x={tblX} y={tblTop - 30} className="scv-panel-label">
            dp[mask][i] — rows = subset (binary), cols = end city
          </text>
          {/* column headers */}
          <text x={tblX + headerW / 2} y={tblTop - 10} className="scv-axh">
            mask
          </text>
          {Array.from({ length: N }).map((_, c) => (
            <text
              key={`colh-${c}`}
              x={tblX + headerW + c * colW + colW / 2}
              y={tblTop - 10}
              className="scv-axh"
            >
              i={c}
            </text>
          ))}

          {Array.from({ length: FULL + 1 }).map((_, mask) => {
            const y = tblTop + mask * rowH;
            const isActiveMask = mask === current.mask;
            const isNewMask = mask === current.newMask && current.phase === 'relax';
            const labelFill = isActiveMask
              ? 'var(--accent)'
              : isNewMask
                ? 'var(--hue-pink)'
                : 'var(--text-dim)';
            return (
              <g key={`row-${mask}`}>
                {/* mask label: binary + decimal */}
                <rect
                  x={tblX}
                  y={y}
                  width={headerW}
                  height={rowH - 2}
                  rx={3}
                  fill={isActiveMask ? 'rgba(var(--accent-rgb), 0.14)' : 'var(--surface)'}
                  stroke={isActiveMask ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isActiveMask ? 1.6 : 1}
                />
                <text
                  x={tblX + 8}
                  y={y + rowH / 2 + 3}
                  className="scv-masklabel"
                  style={{ fill: labelFill }}
                >
                  {bin(mask)}
                </text>
                <text
                  x={tblX + headerW - 8}
                  y={y + rowH / 2 + 3}
                  className="scv-maskdec"
                  style={{ fill: labelFill }}
                >
                  {mask}
                </text>
                {Array.from({ length: N }).map((__, c) => {
                  const val = dp[mask][c];
                  const known = val !== INF;
                  const x = tblX + headerW + c * colW;
                  const isFromCell = isActiveMask && c === fromCity && current.phase !== 'seed';
                  const isNewCell = isNewMask && c === addCity;
                  let fill = 'var(--bg)';
                  let stroke = 'var(--border)';
                  if (isNewCell && current.accepted) {
                    fill = 'var(--hue-pink)';
                    stroke = 'var(--hue-pink)';
                  } else if (isNewCell) {
                    fill = 'rgba(var(--accent-rgb), 0.10)';
                    stroke = 'var(--hue-pink)';
                  } else if (isFromCell) {
                    fill = 'var(--accent)';
                    stroke = 'var(--accent)';
                  } else if (known) {
                    fill = 'rgba(var(--accent-rgb), 0.12)';
                    stroke = 'rgba(var(--accent-rgb), 0.4)';
                  }
                  const txtFill =
                    isFromCell || (isNewCell && current.accepted)
                      ? 'var(--bg)'
                      : known
                        ? 'var(--text-main)'
                        : 'var(--border)';
                  return (
                    <g key={`cell-${mask}-${c}`}>
                      <rect
                        x={x + 2}
                        y={y}
                        width={colW - 4}
                        height={rowH - 2}
                        rx={3}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={isFromCell || isNewCell ? 2 : 1}
                      />
                      <text
                        x={x + colW / 2}
                        y={y + rowH / 2 + 3}
                        className="scv-cellval"
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

          {/* ---- city graph ---- */}
          <text x={graphX0} y={tblTop - 30} className="scv-panel-label">
            cities — current subset highlighted
          </text>
          {/* edges among cities in the current mask */}
          {cityPos.map((a, i) =>
            cityPos.map((b, j) => {
              if (j <= i) return null;
              return (
                <line
                  key={`edge-${i}-${j}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--border)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              );
            }),
          )}
          {/* the active transition edge from -> add */}
          {fromCity != null && addCity != null && current.phase !== 'seed' && (
            <line
              x1={cityPos[fromCity].x}
              y1={cityPos[fromCity].y}
              x2={cityPos[addCity].x}
              y2={cityPos[addCity].y}
              stroke={current.phase === 'close' || current.phase === 'done' ? 'var(--hue-mint)' : 'var(--hue-pink)'}
              strokeWidth={3}
            />
          )}
          {cityPos.map((p, idx) => {
            const inMask = maskBits.has(idx);
            const isFrom = idx === fromCity && current.phase !== 'seed';
            const isAdd = idx === addCity && current.phase === 'relax';
            let fill = 'var(--surface)';
            let stroke = 'var(--border)';
            if (isFrom) {
              fill = 'var(--accent)';
              stroke = 'var(--accent)';
            } else if (isAdd) {
              fill = 'var(--hue-pink)';
              stroke = 'var(--hue-pink)';
            } else if (inMask) {
              fill = 'rgba(var(--accent-rgb), 0.18)';
              stroke = 'var(--accent)';
            }
            const txtFill = isFrom || isAdd ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`city-${idx}`}>
                <circle cx={p.x} cy={p.y} r={20} fill={fill} stroke={stroke} strokeWidth={isFrom || isAdd || inMask ? 2.4 : 1} />
                <text x={p.x} y={p.y + 5} className="scv-citylabel" style={{ fill: txtFill }}>
                  {idx}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="scv-metrics">
        <div className="scv-metric">
          <span className="scv-metric-label">current mask</span>
          <span className="scv-metric-value">{bin(current.mask)}</span>
        </div>
        <div className="scv-metric">
          <span className="scv-metric-label">end city i</span>
          <span className="scv-metric-value">{current.from != null ? current.from : '—'}</span>
        </div>
        <div className="scv-metric">
          <span className="scv-metric-label">add city j</span>
          <span className="scv-metric-value">
            {current.phase === 'relax' ? current.add : '—'}
          </span>
        </div>
        <div className="scv-metric">
          <span className="scv-metric-label">candidate cost</span>
          <span className="scv-metric-value">
            {current.cand == null ? '—' : current.cand}
          </span>
        </div>
        <div className="scv-metric scv-metric-best">
          <span className="scv-metric-label">best tour</span>
          <span className="scv-metric-value">{current.best == null ? '—' : current.best}</span>
        </div>
      </div>

      <div className="scv-arith">
        <span className="scv-arith-label">trace</span>
        <span className="scv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
