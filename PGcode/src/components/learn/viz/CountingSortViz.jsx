import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './CountingSortViz.css';

function buildFrames(input) {
  const n = input.length;
  const maxVal = Math.max(...input, 0);
  const k = maxVal + 1;
  const frames = [];

  const snap = (extra) => ({
    phase: 'init',
    count: new Array(k).fill(0),
    output: new Array(n).fill(null),
    inputFocus: null,
    countFocus: null,
    outputFocus: null,
    placedFrom: [],
    note: '',
    ...extra,
  });

  const count = new Array(k).fill(0);

  frames.push(snap({
    phase: 'init',
    count: [...count],
    note: `Start: ${n} integers, values in [0, ${maxVal}] so k = ${k} buckets. No comparisons — we sort by counting. Total work is O(n + k).`,
  }));

  // Phase 1: TALLY
  for (let i = 0; i < n; i++) {
    const v = input[i];
    count[v] += 1;
    frames.push(snap({
      phase: 'tally',
      count: [...count],
      inputFocus: i,
      countFocus: v,
      note: `Tally: read input[${i}] = ${v}, increment count[${v}] -> ${count[v]}. One linear scan fills every bucket.`,
    }));
  }

  frames.push(snap({
    phase: 'tally-done',
    count: [...count],
    note: `Tally complete. count[v] now holds how many times each value v appears. Next we turn these into positions.`,
  }));

  // Phase 2: PREFIX SUM (count[v] = number of elements <= v)
  for (let v = 1; v < k; v++) {
    const before = count[v];
    count[v] += count[v - 1];
    frames.push(snap({
      phase: 'prefix',
      count: [...count],
      countFocus: v,
      note: `Prefix sum: count[${v}] = ${before} + count[${v - 1}] = ${count[v]}. Now count[${v}] = how many values are <= ${v}, i.e. the end position of value ${v}.`,
    }));
  }

  frames.push(snap({
    phase: 'prefix-done',
    count: [...count],
    note: `Prefix sums done. count[v] is the index just past where the last v belongs. Placing right-to-left and pre-decrementing keeps equal keys in original order — that's stability.`,
  }));

  // Phase 3: PLACE STABLY (scan right to left)
  const output = new Array(n).fill(null);
  const placed = [];
  for (let i = n - 1; i >= 0; i--) {
    const v = input[i];
    count[v] -= 1;
    const pos = count[v];
    output[pos] = v;
    placed.push(pos);
    frames.push(snap({
      phase: 'place',
      count: [...count],
      output: [...output],
      inputFocus: i,
      countFocus: v,
      outputFocus: pos,
      placedFrom: [...placed],
      note: `Place: take input[${i}] = ${v}. Pre-decrement count[${v}] to ${pos}, write output[${pos}] = ${v}. Scanning right-to-left keeps duplicates stable.`,
    }));
  }

  frames.push(snap({
    phase: 'done',
    count: [...count],
    output: [...output],
    placedFrom: [...placed],
    note: `Sorted in O(n + k) with zero comparisons, and stable. Output is built straight from the prefix-summed counts.`,
  }));

  return frames;
}

function randomArray(size) {
  const out = [];
  for (let i = 0; i < size; i++) out.push(Math.floor(Math.random() * 9));
  return out;
}

const DEFAULT_ARR = [2, 5, 3, 0, 2, 3, 0, 3];

function parseInput(text) {
  const parts = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const nums = [];
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 9) return null;
    nums.push(v);
  }
  if (nums.length < 2 || nums.length > 12) return null;
  return nums;
}

export default function CountingSortViz() {
  const [data, setData] = useState(DEFAULT_ARR);
  const [draft, setDraft] = useState(DEFAULT_ARR.join(' '));
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(data), [data]);

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

  const applyDraft = () => {
    const parsed = parseInput(draft);
    if (!parsed) return;
    setIsRunningRaw(false);
    setStep(0);
    setData(parsed);
    setDraft(parsed.join(' '));
  };

  const reshuffle = () => {
    const arr = randomArray(data.length);
    setIsRunningRaw(false);
    setStep(0);
    setData(arr);
    setDraft(arr.join(' '));
  };

  const draftValid = parseInput(draft) !== null;

  const n = data.length;
  const k = current.count.length;

  // layout
  const W = 960;
  const H = 470;
  const padX = 40;
  const cellGap = 8;
  const inputW = (W - padX * 2 - cellGap * (n - 1)) / n;
  const countW = (W - padX * 2 - cellGap * (k - 1)) / k;
  const cellH = 40;

  const inputY = 56;
  const countY = 184;
  const outputY = 380;

  const inputX = (i) => padX + i * (inputW + cellGap);
  const countX = (v) => padX + v * (countW + cellGap);
  const outputX = (i) => padX + i * (inputW + cellGap);

  const phaseLabel = {
    init: 'initialise',
    tally: 'phase 1 — tally',
    'tally-done': 'phase 1 — tally done',
    prefix: 'phase 2 — prefix sum',
    'prefix-done': 'phase 2 — prefix done',
    place: 'phase 3 — place stably',
    done: 'sorted',
  }[current.phase] || current.phase;

  const inPhase1 = current.phase === 'tally' || current.phase === 'tally-done' || current.phase === 'init';
  const inPhase2 = current.phase === 'prefix' || current.phase === 'prefix-done';
  const inPhase3 = current.phase === 'place' || current.phase === 'done';

  return (
    <div className="csv">
      <div className="csv-head">
        <h3 className="csv-title">Counting sort — sort by counting, no comparisons, O(n + k)</h3>
        <p className="csv-sub">
          Tally each value into a bucket, prefix-sum the buckets into end positions, then place each
          element right-to-left so equal keys stay in their original order. Stable, comparison-free, linear.
        </p>
      </div>

      <div className="csv-controls">
        <div className="csv-actions">
          <div className="csv-buttons">
            <button
              type="button"
              className="csv-btn csv-btn-primary"
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
              className="csv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="csv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="csv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="csv-btn" onClick={reshuffle}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <label className="csv-speed">
            <span className="csv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="csv-speed-range"
            />
            <span className="csv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="csv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
        <div className="csv-edit">
          <span className="csv-edit-label">array (0–9, comma/space, 2–12 vals)</span>
          <input
            type="text"
            className={`csv-edit-input${draftValid ? '' : ' csv-edit-invalid'}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyDraft();
            }}
            spellCheck={false}
          />
          <button type="button" className="csv-btn" onClick={applyDraft} disabled={!draftValid}>
            Apply
          </button>
        </div>
      </div>

      <div className="csv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="csv-svg" preserveAspectRatio="xMidYMid meet">
          {/* INPUT ROW */}
          <text x={padX} y={inputY - 14} className="csv-row-label">
            input{inPhase3 ? '  (scanning right → left)' : ''}
          </text>
          {data.map((v, i) => {
            const focus = current.inputFocus === i;
            return (
              <g key={`in-${i}`}>
                <rect
                  x={inputX(i)}
                  y={inputY}
                  width={inputW}
                  height={cellH}
                  rx={5}
                  fill={focus ? 'var(--hue-pink)' : 'rgba(var(--accent-rgb), 0.10)'}
                  stroke={focus ? 'var(--hue-pink)' : 'var(--border)'}
                  strokeWidth={focus ? 2.4 : 1.2}
                />
                <text x={inputX(i) + inputW / 2} y={inputY + cellH / 2 + 5} className={`csv-cell-val${focus ? ' csv-cell-val-focus' : ''}`}>
                  {v}
                </text>
                <text x={inputX(i) + inputW / 2} y={inputY + cellH + 15} className="csv-cell-idx">{i}</text>
              </g>
            );
          })}

          {/* COUNT ROW */}
          <text x={padX} y={countY - 14} className="csv-row-label">
            count[v] {inPhase1 ? '— bucket fill' : inPhase2 ? '— prefix-summed (count of values ≤ v)' : '— next write position for v'}
          </text>
          {current.count.map((c, v) => {
            const focus = current.countFocus === v;
            const maxC = Math.max(...current.count, 1);
            const barH = inPhase1 ? Math.max(2, (c / maxC) * 28) : 0;
            return (
              <g key={`cnt-${v}`}>
                <rect
                  x={countX(v)}
                  y={countY}
                  width={countW}
                  height={cellH}
                  rx={5}
                  fill={focus ? 'rgba(var(--accent-rgb), 0.28)' : 'var(--surface)'}
                  stroke={focus ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={focus ? 2.4 : 1.2}
                />
                {inPhase1 && c > 0 && (
                  <rect
                    x={countX(v) + 4}
                    y={countY + cellH - barH - 4}
                    width={countW - 8}
                    height={barH}
                    rx={2}
                    fill="rgba(var(--accent-rgb), 0.30)"
                  />
                )}
                <text x={countX(v) + countW / 2} y={countY + cellH / 2 + 5} className={`csv-cell-val${focus ? ' csv-cell-val-focus' : ''}`}>
                  {c}
                </text>
                <text x={countX(v) + countW / 2} y={countY + cellH + 15} className="csv-cell-idx">v={v}</text>
              </g>
            );
          })}

          {/* placement arrow: count -> output */}
          {current.phase === 'place' && current.outputFocus != null && current.countFocus != null && (
            <line
              x1={countX(current.countFocus) + countW / 2}
              y1={countY + cellH + 22}
              x2={outputX(current.outputFocus) + inputW / 2}
              y2={outputY - 18}
              stroke="var(--hue-mint)"
              strokeWidth={2}
              strokeDasharray="5 4"
              markerEnd="url(#csv-arrow)"
            />
          )}
          <defs>
            <marker id="csv-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--hue-mint)" />
            </marker>
          </defs>

          {/* OUTPUT ROW */}
          <text x={padX} y={outputY - 14} className="csv-row-label">output (sorted, stable)</text>
          {Array.from({ length: n }).map((_, i) => {
            const v = current.output[i];
            const focus = current.outputFocus === i;
            const filled = v != null;
            return (
              <g key={`out-${i}`}>
                <rect
                  x={outputX(i)}
                  y={outputY}
                  width={inputW}
                  height={cellH}
                  rx={5}
                  fill={focus ? 'var(--hue-mint)' : filled ? 'rgba(var(--accent-rgb), 0.16)' : 'var(--bg)'}
                  stroke={focus ? 'var(--hue-mint)' : filled ? 'var(--easy)' : 'var(--border)'}
                  strokeWidth={focus ? 2.4 : 1.2}
                  strokeDasharray={filled ? 'none' : '4 4'}
                />
                {filled && (
                  <text x={outputX(i) + inputW / 2} y={outputY + cellH / 2 + 5} className={`csv-cell-val${focus ? ' csv-cell-val-focus' : ''}`}>
                    {v}
                  </text>
                )}
                <text x={outputX(i) + inputW / 2} y={outputY + cellH + 15} className="csv-cell-idx">{i}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="csv-metrics">
        <div className="csv-metric">
          <span className="csv-metric-label">phase</span>
          <span className="csv-metric-value">{phaseLabel}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">current value</span>
          <span className="csv-metric-value">{current.countFocus != null ? current.countFocus : '—'}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">n + k</span>
          <span className="csv-metric-value">{n} + {k} = {n + k}</span>
        </div>
        <div className="csv-metric csv-metric-dim">
          <span className="csv-metric-label">comparisons</span>
          <span className="csv-metric-value csv-metric-dimval">0</span>
        </div>
        <div className="csv-metric csv-metric-dim">
          <span className="csv-metric-label">placed</span>
          <span className="csv-metric-value csv-metric-dimval">{current.placedFrom.length} of {n}</span>
        </div>
      </div>

      <div className="csv-arith">
        <span className="csv-arith-label">trace</span>
        <span className="csv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
