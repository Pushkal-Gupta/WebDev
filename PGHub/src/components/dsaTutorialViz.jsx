// Inline interactive visualizations used by DSA Tutorial theory bodies.
//
// Each component is small, themed-token only, no emoji, no external deps. They
// are wired to a fenced block in tutorial content via the marker
// ```tut-viz <name>``` (see TUT_VIZ_NAMES in dsaTutorialVizRegistry.js).
//
// Hard constraints (CLAUDE.md):
//   - Theme tokens only (var(--accent), var(--surface), var(--text-main), etc).
//   - Lucide icons only — no emoji.
//   - No internal scrollbars; SVGs use width: 100% + preserveAspectRatio.
//   - Interactive: every viz exposes at least a slider or step controls.

import React, { useMemo, useState, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, SkipForward, SkipBack,
  Hash, ArrowRight, Layers, Boxes,
} from 'lucide-react';
import { TUT_VIZ_NAMES } from './dsaTutorialVizRegistry';

// ---------------------------------------------------------------------------
// Shared step controls + auto-advance hook.
// ---------------------------------------------------------------------------

function StepControls({ step, total, onStep, playing, onPlay, onReset }) {
  const can = (d) => step + d >= 0 && step + d < total;
  return (
    <div className="tut-viz-controls">
      <button
        type="button"
        className="tut-viz-btn"
        onClick={() => onStep(0)}
        disabled={step === 0}
        aria-label="Restart"
      >
        <SkipBack size={12} />
      </button>
      <button
        type="button"
        className="tut-viz-btn"
        onClick={() => onStep(step - 1)}
        disabled={!can(-1)}
        aria-label="Previous step"
      >
        <ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} />
      </button>
      <button
        type="button"
        className="tut-viz-btn tut-viz-btn-primary"
        onClick={onPlay}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <button
        type="button"
        className="tut-viz-btn"
        onClick={() => onStep(step + 1)}
        disabled={!can(1)}
        aria-label="Next step"
      >
        <SkipForward size={12} />
      </button>
      <button
        type="button"
        className="tut-viz-btn"
        onClick={onReset}
        aria-label="Reset"
      >
        <RotateCcw size={12} />
      </button>
      <div className="tut-viz-step-readout">
        Step {step + 1} / {total}
      </div>
    </div>
  );
}

// Auto-advance hook — runs entirely off effect-driven deps; no ref-during-render.
function useAutoStep({ playing, step, max, intervalMs, onTick, onEnd }) {
  useEffect(() => {
    if (!playing) return undefined;
    if (step >= max - 1) {
      onEnd();
      return undefined;
    }
    const id = window.setTimeout(() => onTick(), intervalMs);
    return () => window.clearTimeout(id);
  }, [playing, step, max, intervalMs, onTick, onEnd]);
}

// ---------------------------------------------------------------------------
// 1. Array memory layout — index slider, live address arithmetic.
// ---------------------------------------------------------------------------

function ArrayMemoryViz() {
  const ELEMENT_SIZE = 4;
  const BASE = 1000;
  const data = [7, 3, 14, 9, 2, 11, 8, 5];
  const [i, setI] = useState(2);
  const address = BASE + i * ELEMENT_SIZE;

  const CELL_W = 70;
  const CELL_H = 56;
  const PAD_X = 30;
  const PAD_Y = 30;
  const totalW = PAD_X * 2 + data.length * CELL_W;
  const totalH = 180;

  return (
    <div className="tut-viz tut-viz-array-memory">
      <div className="tut-viz-head">
        <Layers size={12} />
        <span>Array memory layout</span>
      </div>
      <div className="tut-viz-svg-wrap">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          preserveAspectRatio="xMidYMid meet"
          className="tut-viz-svg"
          role="img"
          aria-label={`Array of ${data.length} elements, currently highlighting index ${i}`}
        >
          {data.map((v, idx) => {
            const x = PAD_X + idx * CELL_W;
            const active = idx === i;
            return (
              <g key={idx}>
                <text x={x + (CELL_W - 6) / 2} y={PAD_Y - 8} textAnchor="middle"
                  className={`tut-viz-idx ${active ? 'is-active' : ''}`}>
                  {idx}
                </text>
                <rect
                  x={x}
                  y={PAD_Y}
                  width={CELL_W - 6}
                  height={CELL_H}
                  rx={4}
                  className={`tut-viz-cell ${active ? 'is-active' : ''}`}
                />
                <text x={x + (CELL_W - 6) / 2} y={PAD_Y + CELL_H / 2 + 5}
                  textAnchor="middle" className="tut-viz-cell-text">
                  {v}
                </text>
                <text x={x + (CELL_W - 6) / 2} y={PAD_Y + CELL_H + 22}
                  textAnchor="middle" className="tut-viz-addr">
                  {BASE + idx * ELEMENT_SIZE}
                </text>
              </g>
            );
          })}
          <text x={PAD_X - 8} y={PAD_Y + CELL_H + 22} textAnchor="end"
            className="tut-viz-axis-label">addr</text>
          <text x={PAD_X - 8} y={PAD_Y + CELL_H / 2 + 5} textAnchor="end"
            className="tut-viz-axis-label">arr</text>
          <g transform={`translate(${PAD_X + i * CELL_W + (CELL_W - 6) / 2}, ${PAD_Y + CELL_H + 38})`}>
            <line x1="0" y1="0" x2="0" y2="22"
              className="tut-viz-pointer-line" />
            <polygon points="0,0 -5,8 5,8" className="tut-viz-pointer-arrow" />
            <text x="0" y="42" textAnchor="middle" className="tut-viz-pointer-label">
              arr[{i}]
            </text>
          </g>
        </svg>
      </div>

      <div className="tut-viz-formula">
        <span className="tut-viz-formula-label">addr(arr[<strong>{i}</strong>])</span>
        <span className="tut-viz-formula-eq">=</span>
        <span className="tut-viz-formula-body">
          base + <strong>{i}</strong> × {ELEMENT_SIZE}
        </span>
        <span className="tut-viz-formula-eq">=</span>
        <span className="tut-viz-formula-result">{address}</span>
      </div>

      <div className="tut-viz-slider-row">
        <label className="tut-viz-slider-label">Index</label>
        <input
          type="range"
          min={0}
          max={data.length - 1}
          value={i}
          onChange={(e) => setI(Number(e.target.value))}
          className="tut-viz-slider"
          aria-label="Array index"
        />
        <span className="tut-viz-slider-readout">{i}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Call stack — step through factorial(N).
// ---------------------------------------------------------------------------

const CALL_STACK_STEPS = (() => {
  const N = 3;
  const out = [];
  out.push({ frames: [{ name: 'main', n: null, ret: null }], note: 'main is running.' });
  for (let k = N; k >= 1; k--) {
    const frames = [{ name: 'main', n: null, ret: null }];
    for (let j = N; j >= k; j--) frames.push({ name: 'factorial', n: j, ret: j === N ? 'main' : `f(${j + 1})` });
    out.push({ frames, note: `factorial(${k}) called.` });
  }
  // Base case
  {
    const frames = [{ name: 'main', n: null, ret: null }];
    for (let j = N; j >= 2; j--) frames.push({ name: 'factorial', n: j, ret: j === N ? 'main' : `f(${j + 1})` });
    frames.push({ name: 'factorial', n: 1, ret: 'f(2)', returning: 1 });
    out.push({ frames, note: 'Base case hit — factorial(1) returns 1.' });
  }
  // Unwind
  let lastResult = 1;
  for (let k = 2; k <= N; k++) {
    lastResult = k * lastResult;
    const remaining = [{ name: 'main', n: null, ret: null }];
    for (let j = N; j >= k; j--) remaining.push({ name: 'factorial', n: j, ret: j === N ? 'main' : `f(${j + 1})` });
    remaining[remaining.length - 1].returning = lastResult;
    out.push({ frames: remaining, note: `factorial(${k}) returns ${k} × ${lastResult / k} = ${lastResult}.` });
  }
  out.push({
    frames: [{ name: 'main', n: null, ret: null, returning: lastResult }],
    note: `Stack unwound — main resumes with ${lastResult}.`,
  });
  return out;
})();

function CallStackViz() {
  const steps = CALL_STACK_STEPS;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const handleTick = useMemo(
    () => () => setStep((s) => Math.min(s + 1, steps.length - 1)),
    [steps.length]
  );
  const handleEnd = useMemo(() => () => setPlaying(false), []);
  useAutoStep({
    playing,
    step,
    max: steps.length,
    intervalMs: 1100,
    onTick: handleTick,
    onEnd: handleEnd,
  });

  const cur = steps[step];
  const maxFrames = Math.max(...steps.map(s => s.frames.length));
  const FRAME_W = 280;
  const FRAME_H = 56;
  const PAD_X = 30;
  const PAD_Y = 20;
  const totalH = PAD_Y * 2 + maxFrames * (FRAME_H + 6);
  const totalW = PAD_X * 2 + FRAME_W;

  return (
    <div className="tut-viz tut-viz-call-stack">
      <div className="tut-viz-head">
        <Boxes size={12} />
        <span>Call stack — factorial(3)</span>
      </div>
      <div className="tut-viz-svg-wrap">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          preserveAspectRatio="xMidYMid meet"
          className="tut-viz-svg"
          role="img"
          aria-label="Call stack visualization"
        >
          <text x={PAD_X - 4} y={PAD_Y - 4} className="tut-viz-axis-label">top</text>
          {cur.frames.slice().reverse().map((f, idx) => {
            const y = PAD_Y + idx * (FRAME_H + 6);
            const isTop = idx === 0;
            const isReturning = f.returning != null;
            return (
              <g key={`${f.name}-${f.n ?? 'main'}-${idx}`}>
                <rect
                  x={PAD_X}
                  y={y}
                  width={FRAME_W}
                  height={FRAME_H}
                  rx={5}
                  className={`tut-viz-frame ${isTop ? 'is-top' : ''} ${isReturning ? 'is-returning' : ''}`}
                />
                <text x={PAD_X + 14} y={y + 22} className="tut-viz-frame-name">
                  {f.name}{f.n != null ? `(${f.n})` : '()'}
                </text>
                <text x={PAD_X + 14} y={y + 42} className="tut-viz-frame-meta">
                  {f.n != null
                    ? `n=${f.n}   ret → ${f.ret}`
                    : 'caller'}
                  {isReturning ? `   ⇒ returns ${f.returning}` : ''}
                </text>
                {isTop && (
                  <text x={PAD_X + FRAME_W - 14} y={y + 22}
                    textAnchor="end" className="tut-viz-frame-tag">
                    running
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="tut-viz-caption">{cur.note}</p>
      <StepControls
        step={step}
        total={steps.length}
        onStep={(n) => setStep(Math.max(0, Math.min(steps.length - 1, n)))}
        playing={playing}
        onPlay={() => {
          if (step >= steps.length - 1) setStep(0);
          setPlaying((p) => !p);
        }}
        onReset={() => { setStep(0); setPlaying(false); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Two-pointer patterns — tabs + step-through.
// ---------------------------------------------------------------------------

const TP_PATTERNS = {
  opposing: {
    label: 'Opposing',
    data: [1, 2, 4, 7, 8, 11, 12, 15],
    steps: [
      { L: 0, R: 7, note: 'sum 1+15=16, too big — shrink right.' },
      { L: 0, R: 6, note: 'sum 1+12=13, target 13 — found pair.' },
    ],
  },
  same: {
    label: 'Same direction',
    data: [3, 1, 0, 2, 0, 0, 5, 0],
    steps: [
      { L: 0, R: 0, note: 'slow=0, fast=0. arr[fast]=3 ≠ 0 — write & advance both.' },
      { L: 1, R: 1, note: 'slow=1, fast=1. arr[fast]=1 ≠ 0 — write & advance both.' },
      { L: 2, R: 3, note: 'slow=2, fast=3. arr[fast]=2 ≠ 0 — write & advance both.' },
      { L: 3, R: 6, note: 'slow=3, fast=6. arr[fast]=5 ≠ 0 — write & advance both.' },
      { L: 4, R: 7, note: 'fast past last non-zero. Zeros packed to the right.' },
    ],
  },
  window: {
    label: 'Sliding window',
    data: [4, 1, 1, 3, 2, 5, 1, 2],
    steps: [
      { L: 0, R: 0, note: 'window=[4], sum=4, target 7.' },
      { L: 0, R: 2, note: 'expand right — window=[4,1,1], sum=6.' },
      { L: 0, R: 3, note: 'expand right — window=[4,1,1,3], sum=9 > 7.' },
      { L: 1, R: 3, note: 'shrink left — window=[1,1,3], sum=5.' },
      { L: 1, R: 4, note: 'expand right — window=[1,1,3,2], sum=7 — match.' },
    ],
  },
};

function TwoPointerVizInner({ pattern }) {
  const cur = TP_PATTERNS[pattern];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const handleTick = useMemo(
    () => () => setStep((s) => Math.min(s + 1, cur.steps.length - 1)),
    [cur.steps.length]
  );
  const handleEnd = useMemo(() => () => setPlaying(false), []);
  useAutoStep({
    playing,
    step,
    max: cur.steps.length,
    intervalMs: 1100,
    onTick: handleTick,
    onEnd: handleEnd,
  });

  const data = cur.data;
  const CELL_W = 60;
  const CELL_H = 56;
  const PAD_X = 40;
  const PAD_Y = 40;
  const totalW = PAD_X * 2 + data.length * CELL_W;
  const totalH = 200;
  const { L, R, note } = cur.steps[step];

  return (
    <>
      <div className="tut-viz-svg-wrap">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          preserveAspectRatio="xMidYMid meet"
          className="tut-viz-svg"
          role="img"
          aria-label={`Two pointer ${pattern} pattern, step ${step + 1}`}
        >
          {data.map((v, idx) => {
            const x = PAD_X + idx * CELL_W;
            const inWindow = pattern === 'window' && idx >= L && idx <= R;
            const isEndpoint = idx === L || idx === R;
            return (
              <g key={idx}>
                <rect
                  x={x}
                  y={PAD_Y}
                  width={CELL_W - 6}
                  height={CELL_H}
                  rx={4}
                  className={`tut-viz-cell ${isEndpoint ? 'is-active' : ''} ${inWindow && !isEndpoint ? 'is-window' : ''}`}
                />
                <text x={x + (CELL_W - 6) / 2} y={PAD_Y + CELL_H / 2 + 5}
                  textAnchor="middle" className="tut-viz-cell-text">{v}</text>
                <text x={x + (CELL_W - 6) / 2} y={PAD_Y - 8}
                  textAnchor="middle" className="tut-viz-idx">{idx}</text>
              </g>
            );
          })}
          <g transform={`translate(${PAD_X + L * CELL_W + (CELL_W - 6) / 2}, ${PAD_Y + CELL_H + 12})`}>
            <line x1="0" y1="0" x2="0" y2="20" className="tut-viz-pointer-line" />
            <polygon points="0,0 -5,8 5,8" className="tut-viz-pointer-arrow" />
            <text x="0" y="40" textAnchor="middle" className="tut-viz-pointer-label">
              {pattern === 'same' ? 'slow' : 'L'}
            </text>
          </g>
          {R !== L && (
            <g transform={`translate(${PAD_X + R * CELL_W + (CELL_W - 6) / 2}, ${PAD_Y + CELL_H + 12})`}>
              <line x1="0" y1="0" x2="0" y2="20" className="tut-viz-pointer-line is-alt" />
              <polygon points="0,0 -5,8 5,8" className="tut-viz-pointer-arrow is-alt" />
              <text x="0" y="40" textAnchor="middle" className="tut-viz-pointer-label is-alt">
                {pattern === 'same' ? 'fast' : 'R'}
              </text>
            </g>
          )}
        </svg>
      </div>
      <p className="tut-viz-caption">{note}</p>
      <StepControls
        step={step}
        total={cur.steps.length}
        onStep={(n) => setStep(Math.max(0, Math.min(cur.steps.length - 1, n)))}
        playing={playing}
        onPlay={() => {
          if (step >= cur.steps.length - 1) setStep(0);
          setPlaying((p) => !p);
        }}
        onReset={() => { setStep(0); setPlaying(false); }}
      />
    </>
  );
}

function TwoPointerViz() {
  const [pattern, setPattern] = useState('opposing');
  return (
    <div className="tut-viz tut-viz-two-pointer">
      <div className="tut-viz-head">
        <ArrowRight size={12} />
        <span>Two-pointer patterns</span>
      </div>
      <div className="tut-viz-tabs" role="tablist" aria-label="Two-pointer pattern">
        {Object.entries(TP_PATTERNS).map(([key, val]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={pattern === key}
            className={`tut-viz-tab ${pattern === key ? 'is-active' : ''}`}
            onClick={() => setPattern(key)}
          >{val.label}</button>
        ))}
      </div>
      {/* keyed remount resets inner step + playing state without a setState-in-effect */}
      <TwoPointerVizInner key={pattern} pattern={pattern} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Hash table — type a key, see which bucket it hashes to.
// ---------------------------------------------------------------------------

function hashStr(s, mod) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

const HASH_INITIAL = [
  { k: 'ada', v: 31 },
  { k: 'ben', v: 12 },
  { k: 'mia', v: 19 },
  { k: 'kai', v: 42 },
  { k: 'zoe', v: 7 },
];

function HashTableViz() {
  const CAPACITY = 8;
  const [pending, setPending] = useState('lex');

  const buckets = useMemo(() => {
    const b = Array.from({ length: CAPACITY }, () => []);
    HASH_INITIAL.forEach(({ k, v }) => {
      const idx = hashStr(k, CAPACITY);
      b[idx].push({ k, v });
    });
    return b;
  }, [CAPACITY]);

  const pendingIdx = pending ? hashStr(pending, CAPACITY) : -1;

  const BUCKET_W = 240;
  const ROW_H = 36;
  const PAD_X = 60;
  const PAD_Y = 28;
  const totalW = PAD_X * 2 + BUCKET_W + 40;
  const totalH = PAD_Y * 2 + CAPACITY * ROW_H;

  return (
    <div className="tut-viz tut-viz-hash">
      <div className="tut-viz-head">
        <Hash size={12} />
        <span>Hash table — keys → bucket index</span>
      </div>

      <div className="tut-viz-hash-row">
        <label className="tut-viz-slider-label">Key</label>
        <input
          value={pending}
          onChange={(e) => setPending(e.target.value.slice(0, 10))}
          placeholder="type a key..."
          className="tut-viz-input"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
        />
        <span className="tut-viz-hash-arrow">→ hash() → bucket</span>
        <span className="tut-viz-hash-result">
          {pending ? pendingIdx : '—'}
        </span>
      </div>

      <div className="tut-viz-svg-wrap">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          preserveAspectRatio="xMidYMid meet"
          className="tut-viz-svg"
          role="img"
          aria-label="Hash table buckets"
        >
          {buckets.map((entries, idx) => {
            const y = PAD_Y + idx * ROW_H;
            const isTarget = idx === pendingIdx;
            return (
              <g key={idx}>
                <text x={PAD_X - 14} y={y + ROW_H / 2 + 4} textAnchor="end"
                  className={`tut-viz-idx ${isTarget ? 'is-active' : ''}`}>
                  {idx}
                </text>
                <rect
                  x={PAD_X}
                  y={y + 4}
                  width={BUCKET_W}
                  height={ROW_H - 8}
                  rx={4}
                  className={`tut-viz-bucket ${isTarget ? 'is-active' : ''}`}
                />
                {entries.length === 0 && (
                  <text x={PAD_X + 12} y={y + ROW_H / 2 + 4}
                    className="tut-viz-bucket-empty">empty</text>
                )}
                {entries.map((e, j) => (
                  <g key={`${e.k}-${j}`}>
                    <rect
                      x={PAD_X + 8 + j * 90}
                      y={y + 8}
                      width={80}
                      height={ROW_H - 16}
                      rx={3}
                      className="tut-viz-chip"
                    />
                    <text x={PAD_X + 8 + j * 90 + 40} y={y + ROW_H / 2 + 4}
                      textAnchor="middle" className="tut-viz-chip-text">
                      {e.k}:{e.v}
                    </text>
                    {j < entries.length - 1 && (
                      <text x={PAD_X + 8 + j * 90 + 84} y={y + ROW_H / 2 + 4}
                        className="tut-viz-chain-arrow">→</text>
                    )}
                  </g>
                ))}
                {isTarget && pending && (
                  <g>
                    <rect
                      x={PAD_X + 8 + entries.length * 90}
                      y={y + 8}
                      width={80}
                      height={ROW_H - 16}
                      rx={3}
                      className="tut-viz-chip is-pending"
                    />
                    <text x={PAD_X + 8 + entries.length * 90 + 40} y={y + ROW_H / 2 + 4}
                      textAnchor="middle" className="tut-viz-chip-text is-pending">
                      {pending}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="tut-viz-caption">
        {pending
          ? buckets[pendingIdx].length > 0
            ? `Collision — "${pending}" lands in bucket ${pendingIdx} and chains onto ${buckets[pendingIdx].length} existing entr${buckets[pendingIdx].length === 1 ? 'y' : 'ies'}.`
            : `"${pending}" hashes to empty bucket ${pendingIdx} — clean insert.`
          : 'Type a key to watch it hash into a bucket.'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Knapsack DP table — step-through cell fill with skip/take dependency
// highlighting.
// ---------------------------------------------------------------------------

const KNAPSACK_ITEMS = [
  { w: 2, v: 3 },
  { w: 3, v: 4 },
  { w: 4, v: 5 },
  { w: 5, v: 6 },
];
const KNAPSACK_W = 5;

const KNAPSACK_STEPS = (() => {
  const items = KNAPSACK_ITEMS;
  const W = KNAPSACK_W;
  const N = items.length;
  const dp = Array.from({ length: N + 1 }, () => Array(W + 1).fill(0));
  const out = [];
  out.push({ i: 0, c: -1, dp: dp.map(r => r.slice()), note: 'Row i=0 — no items, every capacity yields 0.', itemW: 0, take: -1, skip: 0 });
  for (let i = 1; i <= N; i++) {
    for (let c = 0; c <= W; c++) {
      const skip = dp[i - 1][c];
      const item = items[i - 1];
      const take = c >= item.w ? dp[i - 1][c - item.w] + item.v : -1;
      const best = take >= 0 ? Math.max(skip, take) : skip;
      dp[i][c] = best;
      out.push({
        i, c,
        dp: dp.map(r => r.slice()),
        skip, take,
        itemW: item.w, itemV: item.v,
        note: take >= 0
          ? `dp[${i}][${c}] = max(skip ${skip}, take ${take}) = ${best}.`
          : `dp[${i}][${c}] = skip ${skip} (item ${i} too heavy for c=${c}).`,
      });
    }
  }
  return out;
})();

function KnapsackDPViz() {
  const items = KNAPSACK_ITEMS;
  const W = KNAPSACK_W;
  const N = items.length;
  const steps = KNAPSACK_STEPS;

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const handleTick = useMemo(
    () => () => setStep((s) => Math.min(s + 1, steps.length - 1)),
    [steps.length]
  );
  const handleEnd = useMemo(() => () => setPlaying(false), []);
  useAutoStep({
    playing,
    step,
    max: steps.length,
    intervalMs: 700,
    onTick: handleTick,
    onEnd: handleEnd,
  });

  const cur = steps[step];

  const CELL_W = 56;
  const CELL_H = 38;
  const PAD_X = 60;
  const PAD_Y = 50;
  const totalW = PAD_X * 2 + (W + 1) * CELL_W;
  const totalH = PAD_Y + (N + 1) * CELL_H + 36;

  return (
    <div className="tut-viz tut-viz-knapsack">
      <div className="tut-viz-head">
        <Layers size={12} />
        <span>0/1 Knapsack DP table (W={W})</span>
      </div>
      <div className="tut-viz-svg-wrap">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          preserveAspectRatio="xMidYMid meet"
          className="tut-viz-svg"
          role="img"
          aria-label="Knapsack dynamic programming table"
        >
          {Array.from({ length: W + 1 }, (_, c) => (
            <text key={`ch-${c}`}
              x={PAD_X + c * CELL_W + CELL_W / 2}
              y={PAD_Y - 16}
              textAnchor="middle" className="tut-viz-idx">
              c={c}
            </text>
          ))}
          {Array.from({ length: N + 1 }, (_, i) => (
            <text key={`rh-${i}`}
              x={PAD_X - 14}
              y={PAD_Y + i * CELL_H + CELL_H / 2 + 4}
              textAnchor="end" className="tut-viz-idx">
              i={i}
            </text>
          ))}
          {cur.dp.map((row, i) =>
            row.map((val, c) => {
              const x = PAD_X + c * CELL_W;
              const y = PAD_Y + i * CELL_H;
              const isCurrent = i === cur.i && c === cur.c;
              const isSkipDep = cur.i > 0 && cur.c >= 0 && i === cur.i - 1 && c === cur.c;
              const isTakeDep = cur.i > 0 && cur.c >= 0 && i === cur.i - 1
                && c === cur.c - cur.itemW && cur.take >= 0;
              const filled = i < cur.i || (i === cur.i && c <= cur.c);
              return (
                <g key={`cell-${i}-${c}`}>
                  <rect
                    x={x}
                    y={y}
                    width={CELL_W - 4}
                    height={CELL_H - 4}
                    rx={3}
                    className={`tut-viz-dp-cell ${isCurrent ? 'is-current' : ''} ${isSkipDep ? 'is-skip-dep' : ''} ${isTakeDep ? 'is-take-dep' : ''} ${filled ? 'is-filled' : ''}`}
                  />
                  <text x={x + (CELL_W - 4) / 2} y={y + (CELL_H - 4) / 2 + 4}
                    textAnchor="middle"
                    className={`tut-viz-dp-text ${filled ? 'is-filled' : ''}`}>
                    {filled ? val : ''}
                  </text>
                </g>
              );
            })
          )}
          <g transform={`translate(0, ${PAD_Y + (N + 1) * CELL_H + 6})`}>
            <text x={PAD_X - 14} y={14} textAnchor="end" className="tut-viz-axis-label">items</text>
            {items.map((it, k) => (
              <g key={k} transform={`translate(${PAD_X + k * 100}, 0)`}>
                <rect x={0} y={0} width={90} height={20} rx={3} className="tut-viz-legend-pill" />
                <text x={45} y={14} textAnchor="middle" className="tut-viz-legend-text">
                  i={k + 1}: w={it.w}, v={it.v}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <p className="tut-viz-caption">{cur.note}</p>
      <StepControls
        step={step}
        total={steps.length}
        onStep={(n) => setStep(Math.max(0, Math.min(steps.length - 1, n)))}
        playing={playing}
        onPlay={() => {
          if (step >= steps.length - 1) setStep(0);
          setPlaying((p) => !p);
        }}
        onReset={() => { setStep(0); setPlaying(false); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher — the only export from this module so react-refresh stays happy.
// ---------------------------------------------------------------------------

const COMPONENTS = {
  'array-memory': ArrayMemoryViz,
  'call-stack': CallStackViz,
  'two-pointer-patterns': TwoPointerViz,
  'hash-buckets': HashTableViz,
  'knapsack-dp': KnapsackDPViz,
};

export default function TutorialViz({ name }) {
  if (!TUT_VIZ_NAMES.has(name)) return null;
  const Comp = COMPONENTS[name];
  if (!Comp) return null;
  return <Comp />;
}
