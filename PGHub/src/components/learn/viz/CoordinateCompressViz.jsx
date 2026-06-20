import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle, Search } from 'lucide-react';
import './CoordinateCompressViz.css';

// Deterministic PRNG so a Shuffle/seed bump reproduces exactly. Mulberry32.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POOL = [5, 7, 42, 99, 128, 256, 333, 512, 777, 999, 1024, 4096, 9001, 42000, 100000, 524287, 999999, 1000000];

// Build a sparse multiset of large values from a seed: 6-8 picks with intentional dupes.
function generateValues(seed) {
  const rnd = mulberry32(seed);
  const n = 6 + Math.floor(rnd() * 3); // 6..8
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(POOL[Math.floor(rnd() * POOL.length)]);
  }
  // Force at least one duplicate so dedupe is visible.
  if (new Set(out).size === out.length && out.length > 1) {
    out[out.length - 1] = out[0];
  }
  return out;
}

function uniqueSorted(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const uniq = [];
  for (const v of sorted) {
    if (uniq.length === 0 || uniq[uniq.length - 1] !== v) uniq.push(v);
  }
  return { sorted, uniq };
}

// lower_bound binary search → compressed index of value in sorted-unique array.
function rankOf(uniq, value) {
  let lo = 0;
  let hi = uniq.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (uniq[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Pipeline frames: original → sorted → deduped → ranks assigned (one rank per step).
function buildFrames(values) {
  const { sorted, uniq } = uniqueSorted(values);
  const frames = [];

  frames.push({
    phase: 'original',
    stage: 'original',
    values: values.slice(),
    highlight: [],
    ranks: {},
    note: `Start with ${values.length} raw values spread across a huge range (max ${Math.max(...values)}). Direct indexing would need an array of that size — wasteful for a sparse set. Coordinate compression maps them to dense ranks 0..k-1.`,
  });

  frames.push({
    phase: 'sorted',
    stage: 'sorted',
    values: sorted.slice(),
    highlight: [],
    ranks: {},
    note: `Sort ascending: [${sorted.join(', ')}]. Sorting puts equal values next to each other so duplicates are trivial to collapse, and it makes rank assignment a single left-to-right sweep.`,
  });

  // Dedupe step-by-step: walk sorted, mark which survive.
  const kept = [];
  for (let i = 0; i < sorted.length; i++) {
    const isDup = i > 0 && sorted[i] === sorted[i - 1];
    if (!isDup) kept.push(sorted[i]);
    frames.push({
      phase: 'dedupe',
      stage: 'dedupe',
      values: sorted.slice(),
      sortedDupIndex: i,
      keptSoFar: kept.slice(),
      droppedIndex: isDup ? i : -1,
      highlight: [i],
      ranks: {},
      note: isDup
        ? `Index ${i}: value ${sorted[i]} equals the previous one — drop it as a duplicate. Unique values so far: ${kept.length}.`
        : `Index ${i}: value ${sorted[i]} is new — keep it. Unique values so far: ${kept.length}.`,
    });
  }

  // Assign ranks one at a time.
  const ranks = {};
  for (let r = 0; r < uniq.length; r++) {
    ranks[uniq[r]] = r;
    frames.push({
      phase: 'rank',
      stage: 'rank',
      values: uniq.slice(),
      highlight: [r],
      ranks: { ...ranks },
      assignedIndex: r,
      note: `Assign rank ${r} to value ${uniq[r]}. Every original occurrence of ${uniq[r]} now compresses to index ${r}. Ranks preserve order, so comparisons survive the remap.`,
    });
  }

  frames.push({
    phase: 'done',
    stage: 'rank',
    values: uniq.slice(),
    highlight: [],
    ranks: { ...ranks },
    note: `Done. ${values.length} originals → ${uniq.length} dense ranks (0..${uniq.length - 1}). Map any value with a binary search on the sorted-unique array — O(log k). Order-preserving, so it works anywhere only relative order matters.`,
  });

  return frames;
}

// Query frames: binary-search the value to its compressed index.
function buildQueryFrames(uniq, value) {
  const frames = [];
  let lo = 0;
  let hi = uniq.length;
  frames.push({
    lo, hi, mid: -1, found: -1,
    note: `Query ${value}: lower_bound over the sorted-unique array (k = ${uniq.length}). Start lo = 0, hi = ${uniq.length}.`,
  });
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const cmp = uniq[mid] < value;
    frames.push({
      lo, hi, mid, found: -1,
      note: `mid = ${mid}, uniq[${mid}] = ${uniq[mid]}. ${cmp ? `${uniq[mid]} < ${value} → move lo right to ${mid + 1}.` : `${uniq[mid]} ≥ ${value} → move hi to ${mid}.`}`,
    });
    if (cmp) lo = mid + 1;
    else hi = mid;
  }
  const present = uniq[lo] === value;
  frames.push({
    lo, hi: lo, mid: -1, found: lo,
    note: present
      ? `Converged: value ${value} maps to compressed index ${lo}.`
      : `Converged at index ${lo}, but uniq[${lo}] ${lo < uniq.length ? `= ${uniq[lo]}` : 'is out of range'} ≠ ${value} — ${value} is not in the compressed set (insertion point ${lo}).`,
    present,
  });
  return frames;
}

const DEFAULT_SEED = 1337;

export default function CoordinateCompressViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [queryValue, setQueryValue] = useState(null);
  const [queryStep, setQueryStep] = useState(0);
  const runTimer = useRef(null);

  const values = useMemo(() => generateValues(seed), [seed]);
  const { uniq } = useMemo(() => uniqueSorted(values), [values]);
  const rankTable = useMemo(() => uniq.map((v, i) => ({ value: v, rank: i })), [uniq]);

  const frames = useMemo(() => buildFrames(values), [values]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];

  const queryFrames = useMemo(
    () => (queryValue == null ? [] : buildQueryFrames(uniq, queryValue)),
    [uniq, queryValue],
  );
  const queryFrame = queryFrames.length ? queryFrames[Math.min(queryStep, queryFrames.length - 1)] : null;
  const queryResult = useMemo(() => {
    if (queryValue == null) return null;
    const idx = rankOf(uniq, queryValue);
    const present = uniq[idx] === queryValue;
    return { value: queryValue, index: idx, present };
  }, [uniq, queryValue]);

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

  const shuffle = () => {
    setIsRunningRaw(false);
    setStep(0);
    setQueryValue(null);
    setQueryStep(0);
    setSeed((s) => (s * 1664525 + 1013904223) >>> 0);
  };

  const runQuery = (v) => {
    setQueryValue(v);
    setQueryStep(0);
  };

  // Layout.
  const W = 940;
  const H = 300;
  const padX = 40;
  const usable = W - padX * 2;

  const row = current.values;
  const n = row.length;
  const cellGap = 10;
  const cellW = Math.min(96, (usable - cellGap * (n - 1)) / Math.max(n, 1));
  const cellH = 56;
  const rowY = 96;
  const cellX = (i) => padX + i * (cellW + cellGap) + (usable - (n * cellW + (n - 1) * cellGap)) / 2;

  // Number-line band: compress huge values to positions by index in sorted-unique.
  const lineY = 220;
  const lineLeft = padX;
  const lineRight = W - padX;
  const tickX = (idx) => {
    if (uniq.length <= 1) return (lineLeft + lineRight) / 2;
    return lineLeft + (idx / (uniq.length - 1)) * (lineRight - lineLeft);
  };

  const stageLabel = {
    original: 'Original multiset',
    sorted: 'Sorted',
    dedupe: 'Dedupe (drop equal neighbours)',
    rank: 'Dense ranks 0 .. k-1',
  }[current.stage];

  const isDedupe = current.stage === 'dedupe';
  const isRank = current.stage === 'rank';

  return (
    <div className="ccv">
      <div className="ccv-head">
        <h3 className="ccv-title">Coordinate compression — sparse values to dense ranks</h3>
        <p className="ccv-sub">
          Sort, dedupe, then assign ranks 0&hellip;k&minus;1 so a handful of huge coordinates fit a tiny
          array. Step the pipeline, then query any value to its compressed index via binary search.
        </p>
      </div>

      <div className="ccv-controls">
        <div className="ccv-actions">
          <div className="ccv-buttons">
            <button
              type="button"
              className="ccv-btn ccv-btn-primary"
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
              className="ccv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="ccv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="ccv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="ccv-btn ccv-btn-shuffle" onClick={shuffle}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <label className="ccv-speed">
            <span className="ccv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="ccv-speed-range"
            />
            <span className="ccv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="ccv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>

        <div className="ccv-query">
          <span className="ccv-query-label">query value</span>
          <div className="ccv-query-chips">
            {uniq.map((v) => (
              <button
                key={`q-${v}`}
                type="button"
                className={`ccv-query-chip ${queryValue === v ? 'ccv-query-chip-active' : ''}`}
                onClick={() => runQuery(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ccv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ccv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />

          <text x={32} y={44} className="ccv-row-label">{stageLabel}</text>
          <text x={W - 32} y={44} className="ccv-row-label ccv-row-label-right">
            n = {values.length} · k = {uniq.length}
          </text>

          {/* value cells */}
          {row.map((v, i) => {
            const active = current.highlight.includes(i);
            const dropped = isDedupe && current.droppedIndex === i;
            const assigned = isRank && current.ranks[v] != null;
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            let textFill = 'var(--text-main)';
            if (dropped) {
              fill = 'rgba(var(--accent-rgb), 0.08)'; stroke = 'var(--hard)'; textFill = 'var(--text-dim)';
            } else if (active) {
              fill = 'var(--hue-pink)'; stroke = 'var(--hue-pink)'; textFill = 'var(--bg)';
            } else if (assigned) {
              fill = 'rgba(var(--accent-rgb), 0.45)'; stroke = 'var(--accent)'; textFill = 'var(--bg)';
            }
            return (
              <g key={`cell-${i}`}>
                <rect x={cellX(i)} y={rowY} width={cellW} height={cellH} rx={7}
                  fill={fill} stroke={stroke} strokeWidth={active || dropped ? 2.6 : 1.2} />
                <text x={cellX(i) + cellW / 2} y={rowY + cellH / 2 + 6} className="ccv-cell-val"
                  style={{ fill: textFill }}>{v}</text>
                {isRank && (
                  <text x={cellX(i) + cellW / 2} y={rowY - 10} className="ccv-cell-rank">
                    [{i}]
                  </text>
                )}
                {dropped && (
                  <line x1={cellX(i) + 8} y1={rowY + 8} x2={cellX(i) + cellW - 8} y2={rowY + cellH - 8}
                    stroke="var(--hard)" strokeWidth={2.2} />
                )}
              </g>
            );
          })}

          {/* compressed number line */}
          <text x={32} y={lineY - 22} className="ccv-row-label">Compressed number line (rank positions)</text>
          <line x1={lineLeft} y1={lineY} x2={lineRight} y2={lineY} stroke="var(--border)" strokeWidth={1.6} />
          {uniq.map((v, idx) => {
            const x = tickX(idx);
            const lit = isRank && current.ranks[v] != null;
            const qHit = queryResult && queryResult.present && queryResult.index === idx;
            return (
              <g key={`tick-${idx}`}>
                <line x1={x} y1={lineY - 6} x2={x} y2={lineY + 6} stroke="var(--text-dim)" strokeWidth={1.4} />
                <circle cx={x} cy={lineY} r={qHit ? 8 : 6}
                  fill={qHit ? 'var(--hue-mint)' : lit ? 'var(--accent)' : 'var(--bg)'}
                  stroke={qHit ? 'var(--hue-mint)' : lit ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={1.6} />
                <text x={x} y={lineY + 26} className="ccv-tick-rank">{idx}</text>
                <text x={x} y={lineY - 16} className="ccv-tick-val">{v}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="ccv-readouts">
        <div className="ccv-table">
          <div className="ccv-table-head">value → rank</div>
          <div className="ccv-table-grid">
            {rankTable.map(({ value, rank }) => {
              const lit = isRank && current.ranks[value] != null;
              const isQ = queryResult && queryResult.value === value;
              return (
                <div
                  key={`rt-${value}`}
                  className={`ccv-table-cell ${lit ? 'ccv-table-cell-lit' : ''} ${isQ ? 'ccv-table-cell-query' : ''}`}
                >
                  <span className="ccv-table-val">{value}</span>
                  <ChevronRight size={12} className="ccv-table-arrow" />
                  <span className="ccv-table-rank">{rank}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ccv-metrics">
          <div className="ccv-metric">
            <span className="ccv-metric-label">originals (n)</span>
            <span className="ccv-metric-value">{values.length}</span>
          </div>
          <div className="ccv-metric">
            <span className="ccv-metric-label">unique (k)</span>
            <span className="ccv-metric-value">{uniq.length}</span>
          </div>
          <div className="ccv-metric ccv-metric-dim">
            <span className="ccv-metric-label">value range</span>
            <span className="ccv-metric-value ccv-metric-dimval">
              {Math.min(...values)} .. {Math.max(...values)}
            </span>
          </div>
          <div className="ccv-metric ccv-metric-dim">
            <span className="ccv-metric-label">query result</span>
            <span className="ccv-metric-value ccv-metric-dimval">
              {queryResult
                ? queryResult.present
                  ? `${queryResult.value} → [${queryResult.index}]`
                  : `${queryResult.value} absent (ins ${queryResult.index})`
                : 'pick a value'}
            </span>
          </div>
        </div>
      </div>

      {queryFrame && (
        <div className="ccv-querytrace">
          <div className="ccv-querytrace-head">
            <Search size={13} />
            <span>binary search lower_bound({queryValue})</span>
            <div className="ccv-querytrace-ctl">
              <button
                type="button"
                className="ccv-btn ccv-btn-mini"
                onClick={() => setQueryStep((s) => Math.min(s + 1, queryFrames.length - 1))}
                disabled={queryStep >= queryFrames.length - 1}
              >
                <ChevronRight size={13} /> step
              </button>
              <span className="ccv-querytrace-count">
                {queryStep + 1} / {queryFrames.length}
              </span>
            </div>
          </div>
          <div className="ccv-querytrace-bar">
            {uniq.map((v, idx) => {
              const inWindow = idx >= queryFrame.lo && idx < queryFrame.hi;
              const isMid = idx === queryFrame.mid;
              const isFound = idx === queryFrame.found;
              return (
                <span
                  key={`qb-${idx}`}
                  className={`ccv-querytrace-slot ${inWindow ? 'ccv-qt-window' : ''} ${isMid ? 'ccv-qt-mid' : ''} ${isFound ? 'ccv-qt-found' : ''}`}
                >
                  {v}
                </span>
              );
            })}
          </div>
          <span className="ccv-querytrace-note">{queryFrame.note}</span>
        </div>
      )}

      <div className="ccv-trace">
        <span className="ccv-trace-label">trace</span>
        <span className="ccv-trace-vals">{current.note}</span>
      </div>
    </div>
  );
}
