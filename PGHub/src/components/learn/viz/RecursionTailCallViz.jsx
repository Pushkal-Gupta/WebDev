import React, { useMemo, useState } from 'react';
import { Layers, ChevronUp, ChevronDown, RotateCcw, GitBranch, ArrowDownToLine } from 'lucide-react';
import './RecursionTailCallViz.css';

// Tail-call optimization, made visible.
//
// sum(n) = n + sum(n-1) is NOT tail recursive: the call to sum(n-1) returns a
// value that the caller still has to add n to, so every frame must stay live on
// the stack until the base case unwinds. Stack depth grows O(n).
//
// sumTail(n, acc) = sumTail(n-1, acc+n) IS tail recursive: the recursive call is
// the LAST thing the frame does, so the compiler can drop the current frame and
// reuse its slot. Stack depth stays O(1) — one frame, mutated in place.

const PRESETS = [3, 4, 5, 6, 7];
const FRAME_TAGS = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];
const tag = (i) => FRAME_TAGS[i % FRAME_TAGS.length];

// Build the full step timeline for a given n + mode. Each step is a snapshot of
// the live stack (newest frame last) plus a one-line narration.
function buildSteps(n, tail) {
  const steps = [];
  if (tail) {
    // Tail mode: only ever one live frame; we mutate (n, acc) in place.
    let acc = 0;
    let cur = n;
    let allocated = 0;
    steps.push({
      stack: [{ id: 0, label: `sumTail(${cur}, ${acc})`, n: cur, acc }],
      depth: 1,
      allocated: ++allocated,
      note: `Enter sumTail(${cur}, ${acc}). One frame on the stack.`,
    });
    while (cur > 0) {
      const nextAcc = acc + cur;
      const nextN = cur - 1;
      allocated++;
      steps.push({
        stack: [{ id: 0, label: `sumTail(${nextN}, ${nextAcc})`, n: nextN, acc: nextAcc }],
        depth: 1,
        allocated,
        note: `Tail call: reuse the SAME slot. acc ${acc}+${cur}=${nextAcc}, n becomes ${nextN}.`,
      });
      acc = nextAcc;
      cur = nextN;
    }
    steps.push({
      stack: [{ id: 0, label: `return ${acc}`, n: 0, acc, done: true }],
      depth: 1,
      allocated,
      note: `Base case n=0. Return acc=${acc} directly — no unwinding to do.`,
    });
    return { steps, total: acc };
  }

  // Non-tail mode: frames pile up on the way down, then unwind adding n back.
  const stack = [];
  let allocated = 0;
  for (let k = n; k >= 1; k--) {
    allocated++;
    stack.push({ id: k, label: `sum(${k})`, n: k });
    steps.push({
      stack: stack.map((f) => ({ ...f })),
      depth: stack.length,
      allocated,
      note: `Call sum(${k}). Frame waits to add ${k} after sum(${k - 1}) returns.`,
    });
  }
  allocated++;
  stack.push({ id: 0, label: `sum(0)=0`, n: 0, base: true });
  steps.push({
    stack: stack.map((f) => ({ ...f })),
    depth: stack.length,
    allocated,
    note: `Base case sum(0)=0. Now ${stack.length - 1} frames must unwind, each adding its n.`,
  });
  // unwind
  let running = 0;
  // pop base
  stack.pop();
  for (let k = 1; k <= n; k++) {
    running += k;
    stack.pop();
    steps.push({
      stack: stack.map((f) => ({ ...f })),
      depth: stack.length,
      allocated,
      note: `Return from sum(${k}): ${running - k}+${k}=${running}. Pop frame.`,
    });
  }
  steps.push({
    stack: [{ id: -1, label: `return ${running}`, done: true }],
    depth: 1,
    allocated,
    note: `Final result ${running}. The deep stack peaked at ${n + 1} frames.`,
  });
  return { steps, total: running };
}

export default function RecursionTailCallViz() {
  const [n, setN] = useState(5);
  const [tail, setTail] = useState(false);
  const [step, setStep] = useState(0);

  const { steps, total } = useMemo(() => buildSteps(n, tail), [n, tail]);
  const clamped = Math.min(step, steps.length - 1);
  const frame = steps[clamped];
  const peak = useMemo(() => steps.reduce((m, s) => Math.max(m, s.depth), 0), [steps]);

  const reset = () => {
    setStep(0);
  };
  const setMode = (t) => {
    setTail(t);
    setStep(0);
  };
  const pickN = (v) => {
    setN(v);
    setStep(0);
  };
  const stepN = (dir) => {
    const idx = PRESETS.indexOf(n);
    const next = (idx + dir + PRESETS.length) % PRESETS.length;
    pickN(PRESETS[next]);
  };

  // SVG geometry — a single stack column growing upward from a baseline.
  const W = 940;
  const H = 470;
  const baseY = H - 48;
  const cellH = 40;
  const cellGap = 6;
  const colW = 260;
  const colX = (W - colW) / 2;
  const maxFrames = Math.max(n + 1, 1);

  return (
    <div className="rtc">
      <div className="rtc-head">
        <h3 className="rtc-title">Tail-call optimization — when the stack stops growing</h3>
        <p className="rtc-sub">
          A plain recursion piles a frame per call; a tail recursion carries an accumulator so each
          call reuses one slot. Step both and watch the stack column grow or stay flat.
        </p>
      </div>

      <div className="rtc-controls">
        <div className="rtc-presets">
          <span className="rtc-input-label">n</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`rtc-chip ${n === p ? 'is-active' : ''}`}
              onClick={() => pickN(p)}
            >
              {p}
            </button>
          ))}
          <span className="rtc-stepper">
            <button type="button" className="rtc-step-btn" onClick={() => stepN(1)} aria-label="Larger n">
              <ChevronUp size={13} />
            </button>
            <button type="button" className="rtc-step-btn" onClick={() => stepN(-1)} aria-label="Smaller n">
              <ChevronDown size={13} />
            </button>
          </span>
        </div>

        <div className="rtc-toggle">
          <button
            type="button"
            className={`rtc-seg ${!tail ? 'is-on' : ''}`}
            onClick={() => setMode(false)}
          >
            <GitBranch size={13} /> Non-tail
          </button>
          <button
            type="button"
            className={`rtc-seg ${tail ? 'is-on' : ''}`}
            onClick={() => setMode(true)}
          >
            <ArrowDownToLine size={13} /> Tail
          </button>
        </div>

        <span className="rtc-spacer" aria-hidden="true" />

        <button
          type="button"
          className="rtc-btn"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={clamped === 0}
        >
          <ChevronDown size={14} /> Back
        </button>
        <button
          type="button"
          className="rtc-btn rtc-btn-primary"
          onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          disabled={clamped === steps.length - 1}
        >
          <ChevronUp size={14} /> Step
        </button>
        <button type="button" className="rtc-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rtc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rtc-svg" preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(24, 22)`}>
            <Layers width={16} height={16} className="rtc-ic" />
          </g>
          <text className="rtc-stage-title" x={48} y={35}>
            {tail ? 'sumTail(n, acc) — constant stack' : 'sum(n) = n + sum(n-1) — O(n) stack'}
          </text>
          <text className="rtc-stage-sub" x={W - 24} y={35}>
            depth {frame.depth} / peak {peak}
          </text>

          {/* peak ghost outline so the reader sees the worst case footprint */}
          {!tail && Array.from({ length: maxFrames }).map((_, i) => {
            const y = baseY - (i + 1) * (cellH + cellGap);
            return (
              <rect
                key={`ghost-${i}`}
                className="rtc-ghost"
                x={colX}
                y={y}
                width={colW}
                height={cellH}
                rx={7}
              />
            );
          })}

          {/* live frames */}
          {frame.stack.map((f, i) => {
            const y = baseY - (i + 1) * (cellH + cellGap);
            const c = tail ? tag(0) : tag(i);
            return (
              <g key={`f-${f.id}-${i}`}>
                <rect
                  className={`rtc-frame ${f.done ? 'is-done' : ''} ${f.base ? 'is-base' : ''}`}
                  x={colX}
                  y={y}
                  width={colW}
                  height={cellH}
                  rx={7}
                  style={{ stroke: c }}
                />
                <rect x={colX} y={y} width={5} height={cellH} rx={2.5} fill={c} />
                <text className="rtc-frame-label" x={colX + 18} y={y + cellH / 2 + 5}>
                  {f.label}
                </text>
                {tail && f.acc !== undefined && !f.done && (
                  <text className="rtc-frame-meta" x={colX + colW - 14} y={y + cellH / 2 + 5}>
                    acc={f.acc}
                  </text>
                )}
              </g>
            );
          })}

          {/* baseline */}
          <line className="rtc-base-line" x1={colX - 20} y1={baseY} x2={colX + colW + 20} y2={baseY} />
          <text className="rtc-base-label" x={colX + colW / 2} y={baseY + 24}>
            stack base
          </text>

          {tail && (
            <text className="rtc-reuse-note" x={colX + colW / 2} y={baseY - (cellH + cellGap) - 14}>
              same slot, reused
            </text>
          )}
        </svg>
      </div>

      <div className="rtc-metrics">
        <div className="rtc-metric">
          <span className="rtc-metric-label">live stack depth</span>
          <span className="rtc-metric-value">{frame.depth}</span>
        </div>
        <div className="rtc-metric">
          <span className="rtc-metric-label">frames allocated</span>
          <span className="rtc-metric-value">{frame.allocated}</span>
        </div>
        <div className="rtc-metric">
          <span className="rtc-metric-label">peak depth</span>
          <span className={`rtc-metric-value ${tail ? 'is-good' : 'is-bad'}`}>
            {tail ? 'O(1)' : `O(n) = ${peak}`}
          </span>
        </div>
        <div className="rtc-metric">
          <span className="rtc-metric-label">result Σ 1..{n}</span>
          <span className="rtc-metric-value">{total}</span>
        </div>
      </div>

      <div className="rtc-narration">
        <span className="rtc-narration-label">step</span>
        <span className="rtc-narration-body">{frame.note}</span>
      </div>

      <div className="rtc-narration is-why">
        <span className="rtc-narration-label">why it matters</span>
        <span className="rtc-narration-body">
          The non-tail version keeps {peak} frames alive at once — deep enough and you get a stack
          overflow. Rewriting with an accumulator makes the recursive call the last action of each
          frame, so a compiler with TCO drops the old frame and the stack never grows past one.
          Same answer, O(n) memory collapses to O(1).
        </span>
      </div>
    </div>
  );
}
