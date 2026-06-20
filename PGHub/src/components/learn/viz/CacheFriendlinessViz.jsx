import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Rows, Columns } from 'lucide-react';
import './CacheFriendlinessViz.css';

const ROWS = 4;
const COLS = 16;
const TOTAL = ROWS * COLS;
const INT_BYTES = 4;
const LINE_BYTES = 64;
const INTS_PER_LINE = LINE_BYTES / INT_BYTES; // 16 — one row == one cache line here

const idx = (r, c) => r * COLS + c;
const addrOf = (lin) => lin * INT_BYTES;
const lineOf = (lin) => Math.floor(addrOf(lin) / LINE_BYTES); // which 64-byte block

// Direct-mapped-ish demo cache: a small fixed set of slots holding whole lines.
// 2 slots is enough to show column-major thrashing while row-major stays warm.
const CACHE_SLOTS = 2;

function buildFrames(order) {
  const frames = [];
  // LRU list of line indices currently resident (most-recent at the end)
  let resident = [];
  let hits = 0;
  let misses = 0;

  const snap = (extra) => ({
    resident: [...resident],
    hits,
    misses,
    active: -1,
    activeLine: -1,
    verdict: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `A ${ROWS}×${COLS} int array sits in row-major memory: row 0 fills addresses 0..${addrOf(COLS) - INT_BYTES}, then row 1, and so on. Each int is ${INT_BYTES} bytes; a ${LINE_BYTES}-byte cache line holds ${INTS_PER_LINE} ints — exactly one full row. The cache keeps ${CACHE_SLOTS} lines (LRU). Walking ${order === 'row' ? 'ROW-MAJOR' : 'COLUMN-MAJOR'}: step through and watch each access hit or miss.`,
  }));

  const sequence = [];
  if (order === 'row') {
    for (let r = 0; r < ROWS; r += 1) for (let c = 0; c < COLS; c += 1) sequence.push([r, c]);
  } else {
    for (let c = 0; c < COLS; c += 1) for (let r = 0; r < ROWS; r += 1) sequence.push([r, c]);
  }

  sequence.forEach(([r, c]) => {
    const lin = idx(r, c);
    const ln = lineOf(lin);
    const addr = addrOf(lin);
    const hit = resident.includes(ln);
    let verdict;
    let note;
    if (hit) {
      hits += 1;
      resident = resident.filter((x) => x !== ln).concat(ln);
      verdict = 'hit';
      note = `Access A[${r}][${c}] — element ${lin}, byte address ${addr}. It lives in cache line ${ln} (ints ${ln * INTS_PER_LINE}..${ln * INTS_PER_LINE + INTS_PER_LINE - 1}), which is already resident. HIT — no memory traffic.`;
    } else {
      misses += 1;
      const evicted = resident.length >= CACHE_SLOTS ? resident[0] : null;
      resident = resident.slice(resident.length >= CACHE_SLOTS ? 1 : 0).concat(ln);
      verdict = 'miss';
      note = `Access A[${r}][${c}] — element ${lin}, byte address ${addr}. Cache line ${ln} (the whole ${LINE_BYTES}-byte block, ints ${ln * INTS_PER_LINE}..${ln * INTS_PER_LINE + INTS_PER_LINE - 1}) is not resident. MISS — fetch the entire line from memory${evicted !== null ? `, evicting line ${evicted}` : ''}.`;
    }
    frames.push(snap({ active: lin, activeLine: ln, verdict, note }));
  });

  const total = hits + misses;
  const rate = total ? Math.round((misses / total) * 100) : 0;
  frames.push(snap({
    note: order === 'row'
      ? `Done. ${hits} hits, ${misses} misses (${rate}% miss rate). Row-major matches memory layout: every line is read once and fully consumed before moving on. Only the first touch of each row misses — ${INTS_PER_LINE - 1} of every ${INTS_PER_LINE} accesses are free hits.`
      : `Done. ${hits} hits, ${misses} misses (${rate}% miss rate). Column-major strides by a full row each step, so consecutive accesses fall in different lines. With only ${CACHE_SLOTS} slots, every line is evicted before its other ${INTS_PER_LINE - 1} ints are reused — almost every access misses. Same data, same loop body, wildly different cost.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 700;

export default function CacheFriendlinessViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [order, setOrder] = useState('row');
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(order), [order]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const setOrderAndReset = (next) => {
    if (next === order) return;
    setIsRunning(false);
    setStep(0);
    setOrder(next);
  };

  // SVG geometry
  const W = 960;
  const H = 470;
  // grid
  const gridX = 40;
  const gridY = 78;
  const cellW = 50;
  const cellH = 50;
  const gridW = COLS * cellW;
  const gridH = ROWS * cellH;
  // linear memory strip
  const stripY = gridY + gridH + 64;
  const stripX = 40;
  const stripCellW = (W - 80) / TOTAL;
  const stripH = 34;

  const total = current.hits + current.misses;
  const missRate = total ? Math.round((current.misses / total) * 100) : 0;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const residentLabel = current.resident.length
    ? current.resident.map((l) => `L${l}`).join(', ')
    : '—';

  const activeAddr = current.active >= 0 ? addrOf(current.active) : null;
  const activeRC = current.active >= 0
    ? [Math.floor(current.active / COLS), current.active % COLS]
    : null;

  const cellState = (lin, ln) => {
    if (lin === current.active) return current.verdict === 'hit' ? 'is-hit' : 'is-miss';
    if (current.resident.includes(ln)) return 'is-resident';
    return '';
  };

  return (
    <div className="cfv">
      <div className="cfv-head">
        <h3 className="cfv-title">CPU cache friendliness — row-major vs column-major traversal</h3>
        <p className="cfv-sub">
          The same {ROWS}×{COLS} array walked two ways. Memory loads whole {LINE_BYTES}-byte lines; matching the
          row-major layout turns most accesses into free hits, while striding down columns evicts each line before
          it pays off.
        </p>
      </div>

      <div className="cfv-controls">
        <div className="cfv-toggle" role="group" aria-label="Traversal order">
          <button
            type="button"
            className={`cfv-toggle-btn ${order === 'row' ? 'is-on' : ''}`}
            onClick={() => setOrderAndReset('row')}
          >
            <Rows size={14} /> Row-major
          </button>
          <button
            type="button"
            className={`cfv-toggle-btn ${order === 'col' ? 'is-on' : ''}`}
            onClick={() => setOrderAndReset('col')}
          >
            <Columns size={14} /> Column-major
          </button>
        </div>

        <span className="cfv-spacer" aria-hidden="true" />

        <label className="cfv-speed">
          <span className="cfv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cfv-speed-range"
            aria-label="Playback speed"
          />
          <span className="cfv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="cfv-buttons">
          <button
            type="button"
            className="cfv-btn cfv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="cfv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cfv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cfv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cfv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cfv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cfv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="cfv-section-label" x={gridX} y={gridY - 22}>2D array A[{ROWS}][{COLS}]</text>

          {/* cache line band backgrounds behind each row (one line == one row) */}
          {Array.from({ length: ROWS }).map((_, r) => {
            const ln = lineOf(idx(r, 0));
            const resident = current.resident.includes(ln);
            return (
              <rect
                key={`band-${r}`}
                className={`cfv-line-band ${resident ? 'is-resident' : ''}`}
                x={gridX - 6}
                y={gridY + r * cellH - 3}
                width={gridW + 12}
                height={cellH + 6}
                rx={7}
              />
            );
          })}

          {/* grid cells */}
          {Array.from({ length: ROWS }).map((_, r) => (
            Array.from({ length: COLS }).map((__, c) => {
              const lin = idx(r, c);
              const ln = lineOf(lin);
              const x = gridX + c * cellW;
              const y = gridY + r * cellH;
              return (
                <g key={`cell-${lin}`}>
                  <rect
                    className={`cfv-cell ${cellState(lin, ln)}`}
                    x={x + 2}
                    y={y + 2}
                    width={cellW - 4}
                    height={cellH - 4}
                    rx={5}
                  />
                  <text className="cfv-cell-rc" x={x + cellW / 2} y={y + cellH / 2 - 3}>
                    {r},{c}
                  </text>
                  <text className="cfv-cell-lin" x={x + cellW / 2} y={y + cellH / 2 + 12}>
                    #{lin}
                  </text>
                </g>
              );
            })
          ))}

          {/* row -> line labels */}
          {Array.from({ length: ROWS }).map((_, r) => {
            const ln = lineOf(idx(r, 0));
            return (
              <text key={`ln-${r}`} className="cfv-line-tag" x={gridX + gridW + 14} y={gridY + r * cellH + cellH / 2 + 4}>
                line {ln}
              </text>
            );
          })}

          {/* linear memory strip */}
          <text className="cfv-section-label" x={stripX} y={stripY - 16}>linear memory (row-major) · {INT_BYTES} bytes / int · {INTS_PER_LINE} ints / {LINE_BYTES}-byte line</text>
          {Array.from({ length: TOTAL }).map((_, lin) => {
            const ln = lineOf(lin);
            const x = stripX + lin * stripCellW;
            const stateActive = lin === current.active;
            const resident = current.resident.includes(ln);
            const lineStart = ln % 2 === 0;
            return (
              <g key={`mem-${lin}`}>
                <rect
                  className={`cfv-mem ${resident ? 'is-resident' : ''} ${stateActive ? (current.verdict === 'hit' ? 'is-hit' : 'is-miss') : ''} ${lineStart ? 'is-even-line' : 'is-odd-line'}`}
                  x={x + 0.5}
                  y={stripY}
                  width={stripCellW - 1}
                  height={stripH}
                />
              </g>
            );
          })}
          {/* cache-line separators on the strip */}
          {Array.from({ length: ROWS + 1 }).map((_, k) => (
            <line
              key={`sep-${k}`}
              className="cfv-mem-sep"
              x1={stripX + k * INTS_PER_LINE * stripCellW + 0.5}
              y1={stripY - 4}
              x2={stripX + k * INTS_PER_LINE * stripCellW + 0.5}
              y2={stripY + stripH + 4}
            />
          ))}
          {/* address ticks at line boundaries */}
          {Array.from({ length: ROWS }).map((_, k) => (
            <text
              key={`tick-${k}`}
              className="cfv-mem-tick"
              x={stripX + k * INTS_PER_LINE * stripCellW + 3}
              y={stripY + stripH + 18}
            >
              {addrOf(k * INTS_PER_LINE)}B
            </text>
          ))}
        </svg>
      </div>

      <div className="cfv-metrics">
        <div className="cfv-metric">
          <span className="cfv-metric-label">hits</span>
          <span className="cfv-metric-value is-hit">{current.hits}</span>
        </div>
        <div className="cfv-metric">
          <span className="cfv-metric-label">misses</span>
          <span className="cfv-metric-value is-miss">{current.misses}</span>
        </div>
        <div className="cfv-metric">
          <span className="cfv-metric-label">miss rate</span>
          <span className="cfv-metric-value is-rate">{missRate}%</span>
        </div>
        <div className="cfv-metric">
          <span className="cfv-metric-label">cache lines</span>
          <span className="cfv-metric-value">{residentLabel}</span>
        </div>
        <div className="cfv-metric cfv-metric-wide">
          <span className="cfv-metric-label">current access</span>
          <span className="cfv-metric-value">
            {activeRC
              ? `A[${activeRC[0]}][${activeRC[1]}] · elem #${current.active} · addr ${activeAddr}B · line ${current.activeLine} · ${current.verdict === 'hit' ? 'HIT' : 'MISS'}`
              : 'not started'}
          </span>
        </div>
      </div>

      <div className="cfv-narration">
        <span className={`cfv-narration-label cfv-kind-${current.verdict || 'trace'}`}>
          {current.verdict || 'trace'}
        </span>
        <span className="cfv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
