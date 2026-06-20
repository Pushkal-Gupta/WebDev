import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './MonotonicStackViz.css';

const DEFAULT_ARRAY = [3, 7, 1, 4, 8, 2, 6, 5, 9, 4];
const TICK_MS = 900;

const BAR_W = 54;
const BAR_GAP = 10;
const BAR_AREA_H = 180;
const BAR_BASE_Y = 220;
const INDEX_LABEL_Y = 248;
const RESULT_Y = 296;
const PAD_X = 32;
const PAD_TOP = 96;
const PAD_BOTTOM = 60;
const STACK_PAD_X = 36;
const CHIP_W = 76;
const CHIP_H = 36;
const CHIP_GAP = 6;
const STACK_BASE_Y = 220;

function parseArrayInput(raw) {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((tok) => tok.trim())
    .filter(Boolean)
    .map((tok) => {
      const n = Number(tok);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v) => v !== null);
}

function buildFrames(array) {
  const frames = [];
  if (!array.length) return frames;

  const n = array.length;
  const result = new Array(n).fill(-1);
  const stack = [];

  frames.push({
    i: -1,
    stack: [],
    result: [...result],
    popped: null,
    poppedFromTo: null,
    note: 'Start: empty stack, result array filled with -1 (no next greater yet).',
    done: false,
    phase: 'start',
  });

  for (let i = 0; i < n; i += 1) {
    frames.push({
      i,
      stack: [...stack],
      result: [...result],
      popped: null,
      poppedFromTo: null,
      note: `i = ${i}, nums[i] = ${array[i]}. Compare against stack top while it is smaller.`,
      done: false,
      phase: 'visit',
    });

    while (stack.length && array[stack[stack.length - 1]] < array[i]) {
      const top = stack.pop();
      result[top] = array[i];
      frames.push({
        i,
        stack: [...stack],
        result: [...result],
        popped: { index: top, value: array[top] },
        poppedFromTo: { from: top, to: i, value: array[i] },
        note: `Popping index ${top} (value ${array[top]}): next greater is nums[${i}]=${array[i]}.`,
        done: false,
        phase: 'pop',
      });
    }

    stack.push(i);
    frames.push({
      i,
      stack: [...stack],
      result: [...result],
      popped: null,
      poppedFromTo: null,
      note: `Push index ${i} onto the stack. Stack stays decreasing top-to-bottom of unresolved indices.`,
      done: false,
      phase: 'push',
    });
  }

  frames.push({
    i: n,
    stack: [...stack],
    result: [...result],
    popped: null,
    poppedFromTo: null,
    note:
      stack.length > 0
        ? `Done. Indices still on the stack [${stack.join(', ')}] have no next greater (left as -1).`
        : 'Done. Every index found its next greater element.',
    done: true,
    phase: 'done',
  });

  return frames;
}

export default function MonotonicStackViz() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY.join(', '));

  const array = useMemo(() => {
    const parsed = parseArrayInput(arrayInput);
    return parsed.length ? parsed : DEFAULT_ARRAY;
  }, [arrayInput]);

  const frames = useMemo(() => buildFrames(array), [array]);

  const [step, setStep] = useState(0);
  const [runningRaw, setRunning] = useState(false);
  const timerRef = useRef(null);

  // Reset playhead when the input changes (prev-state-during-render pattern).
  const [prevArray, setPrevArray] = useState(array);
  if (prevArray !== array) {
    setPrevArray(array);
    setStep(0);
    setRunning(false);
  }

  const running = runningRaw && step < frames.length - 1;
  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, frames.length - 1));
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, frames.length]);

  const handleStep = useCallback(() => {
    setRunning(false);
    setStep((s) => Math.min(s + 1, frames.length - 1));
  }, [frames.length]);

  const handleRun = useCallback(() => {
    if (step >= frames.length - 1) setStep(0);
    setRunning(true);
  }, [step, frames.length]);

  const handlePause = useCallback(() => setRunning(false), []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setStep(0);
  }, []);

  const frame = frames[step] ?? {
    i: -1,
    stack: [],
    result: array.map(() => -1),
    popped: null,
    poppedFromTo: null,
    note: '',
    done: false,
    phase: 'start',
  };

  const totalSteps = Math.max(frames.length, 1);
  const maxValue = Math.max(1, ...array);

  const arrayWidth = array.length * BAR_W + (array.length - 1) * BAR_GAP;
  const stackWidth = CHIP_W + STACK_PAD_X * 2;
  const widthSvg = PAD_X * 2 + arrayWidth + 60 + stackWidth;
  const heightSvg = PAD_TOP + BAR_AREA_H + PAD_BOTTOM;

  const barX = (i) => PAD_X + i * (BAR_W + BAR_GAP);
  const barH = (v) => Math.max(8, (v / maxValue) * BAR_AREA_H);
  const stackOriginX = PAD_X + arrayWidth + 60;

  const chipY = (depthFromTop) => STACK_BASE_Y - (depthFromTop + 1) * (CHIP_H + CHIP_GAP);

  const onStackSet = new Set(frame.stack);
  const isResolved = (i) => frame.result[i] !== undefined && frame.result[i] !== -1;

  let popArrow = null;
  if (frame.poppedFromTo) {
    const { from, to } = frame.poppedFromTo;
    const x1 = barX(from) + BAR_W / 2;
    const y1 = BAR_BASE_Y - barH(array[from]) - 14;
    const x2 = barX(to) + BAR_W / 2;
    const y2 = BAR_BASE_Y - barH(array[to]) - 14;
    const midX = (x1 + x2) / 2;
    const midY = Math.min(y1, y2) - 36;
    popArrow = { x1, y1, x2, y2, midX, midY };
  }

  return (
    <div className="ms-viz" role="region" aria-label="Monotonic stack visualization">
      <header className="ms-viz-head">
        <h3 className="ms-viz-title">Monotonic Stack &middot; Next Greater Element</h3>
        <p className="ms-viz-sub">
          A decreasing stack of indices waits for the first value that exceeds it. Each scan-right step either pops resolved
          indices or parks the current one until later.
        </p>
      </header>

      <div className="ms-viz-controls">
        <label className="ms-viz-field">
          <span className="ms-viz-label">Array</span>
          <input
            className="ms-viz-input"
            value={arrayInput}
            onChange={(e) => setArrayInput(e.target.value)}
            placeholder="comma-separated ints"
            spellCheck={false}
          />
        </label>
      </div>

      <div className="ms-viz-metrics">
        <div className="ms-viz-metric">
          <span className="ms-viz-metric-label">i</span>
          <span className="ms-viz-metric-value">{frame.i < 0 ? '-' : frame.i >= array.length ? 'done' : frame.i}</span>
        </div>
        <div className="ms-viz-metric">
          <span className="ms-viz-metric-label">nums[i]</span>
          <span className="ms-viz-metric-value">
            {frame.i >= 0 && frame.i < array.length ? array[frame.i] : '-'}
          </span>
        </div>
        <div className="ms-viz-metric">
          <span className="ms-viz-metric-label">Stack depth</span>
          <span className="ms-viz-metric-value">{frame.stack.length}</span>
        </div>
        <div className="ms-viz-metric">
          <span className="ms-viz-metric-label">Step</span>
          <span className="ms-viz-metric-value">
            {step + 1}
            <span className="ms-viz-metric-dim"> / {totalSteps}</span>
          </span>
        </div>
      </div>

      <div className="ms-viz-stage">
        <svg
          className="ms-viz-svg"
          viewBox={`0 0 ${widthSvg} ${heightSvg}`}
          width="100%"
          role="img"
          aria-label={`Array of ${array.length} bars with monotonic stack to the right`}
        >
          <defs>
            <linearGradient id="ms-bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="ms-bar-grad-stack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-violet, var(--accent))" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--hue-violet, var(--accent))" stopOpacity="0.32" />
            </linearGradient>
            <linearGradient id="ms-bar-grad-resolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--easy)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--easy)" stopOpacity="0.2" />
            </linearGradient>
            <marker id="ms-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--warning, var(--accent))" />
            </marker>
            <marker
              id="ms-arrow-head-cursor"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
            </marker>
          </defs>

          {frame.i >= 0 && frame.i < array.length && (
            <g className="ms-viz-cursor">
              <text
                x={barX(frame.i) + BAR_W / 2}
                y={PAD_TOP - 30}
                textAnchor="middle"
                className="ms-viz-cursor-label"
              >
                i = {frame.i}
              </text>
              <line
                x1={barX(frame.i) + BAR_W / 2}
                y1={PAD_TOP - 22}
                x2={barX(frame.i) + BAR_W / 2}
                y2={BAR_BASE_Y - barH(array[frame.i]) - 6}
                className="ms-viz-cursor-line"
                markerEnd="url(#ms-arrow-head-cursor)"
              />
            </g>
          )}

          <line
            x1={PAD_X - 8}
            y1={BAR_BASE_Y}
            x2={PAD_X + arrayWidth + 8}
            y2={BAR_BASE_Y}
            className="ms-viz-baseline"
          />

          {array.map((value, i) => {
            const h = barH(value);
            const x = barX(i);
            const y = BAR_BASE_Y - h;
            const onStack = onStackSet.has(i);
            const resolved = isResolved(i);
            const isCurrent = i === frame.i && (frame.phase === 'visit' || frame.phase === 'push' || frame.phase === 'pop');
            const isPopped = frame.popped && frame.popped.index === i;
            const fill = resolved
              ? 'url(#ms-bar-grad-resolved)'
              : onStack
              ? 'url(#ms-bar-grad-stack)'
              : 'url(#ms-bar-grad)';
            return (
              <g
                key={`bar-${i}`}
                className={`ms-viz-bar ${onStack ? 'is-stack' : ''} ${resolved ? 'is-resolved' : ''} ${
                  isCurrent ? 'is-current' : ''
                } ${isPopped ? 'is-popped' : ''}`}
              >
                <rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={h}
                  rx={6}
                  ry={6}
                  fill={fill}
                  className="ms-viz-bar-rect"
                />
                <text x={x + BAR_W / 2} y={y - 8} textAnchor="middle" className="ms-viz-bar-value">
                  {value}
                </text>
                <text x={x + BAR_W / 2} y={INDEX_LABEL_Y} textAnchor="middle" className="ms-viz-bar-index">
                  {i}
                </text>
                <g className="ms-viz-result-cell">
                  <rect
                    x={x + 4}
                    y={RESULT_Y}
                    width={BAR_W - 8}
                    height={28}
                    rx={5}
                    ry={5}
                    className={`ms-viz-result-rect ${resolved ? 'is-set' : ''}`}
                  />
                  <text
                    x={x + BAR_W / 2}
                    y={RESULT_Y + 19}
                    textAnchor="middle"
                    className={`ms-viz-result-text ${resolved ? 'is-set' : ''}`}
                  >
                    {frame.result[i] === -1 ? '-1' : frame.result[i]}
                  </text>
                </g>
              </g>
            );
          })}

          <text x={PAD_X - 18} y={RESULT_Y + 19} textAnchor="end" className="ms-viz-row-label">
            result
          </text>
          <text x={PAD_X - 18} y={INDEX_LABEL_Y} textAnchor="end" className="ms-viz-row-label-dim">
            index
          </text>

          {popArrow && (
            <g className="ms-viz-pop-arrow">
              <path
                d={`M ${popArrow.x1} ${popArrow.y1} Q ${popArrow.midX} ${popArrow.midY} ${popArrow.x2} ${popArrow.y2}`}
                fill="none"
                className="ms-viz-pop-arrow-path"
                markerEnd="url(#ms-arrow-head)"
              />
              <text
                x={popArrow.midX}
                y={popArrow.midY + 4}
                textAnchor="middle"
                className="ms-viz-pop-arrow-label"
              >
                next greater
              </text>
            </g>
          )}

          <g className="ms-viz-stack" transform={`translate(${stackOriginX}, 0)`}>
            <text x={CHIP_W / 2 + STACK_PAD_X / 2} y={PAD_TOP - 30} textAnchor="middle" className="ms-viz-stack-title">
              stack (top)
            </text>
            <line
              x1={STACK_PAD_X / 2 - 4}
              y1={PAD_TOP - 22}
              x2={STACK_PAD_X / 2 - 4}
              y2={STACK_BASE_Y}
              className="ms-viz-stack-rail"
            />
            <line
              x1={STACK_PAD_X / 2 - 4 + CHIP_W + 8}
              y1={PAD_TOP - 22}
              x2={STACK_PAD_X / 2 - 4 + CHIP_W + 8}
              y2={STACK_BASE_Y}
              className="ms-viz-stack-rail"
            />
            <line
              x1={STACK_PAD_X / 2 - 8}
              y1={STACK_BASE_Y}
              x2={STACK_PAD_X / 2 - 4 + CHIP_W + 12}
              y2={STACK_BASE_Y}
              className="ms-viz-stack-floor"
            />
            <text
              x={CHIP_W / 2 + STACK_PAD_X / 2}
              y={STACK_BASE_Y + 22}
              textAnchor="middle"
              className="ms-viz-stack-foot"
            >
              bottom
            </text>

            {frame.stack
              .slice()
              .reverse()
              .map((idx, depthFromTop) => {
                const y = chipY(depthFromTop);
                const value = array[idx];
                return (
                  <g key={`chip-${idx}`} className="ms-viz-chip">
                    <rect
                      x={STACK_PAD_X / 2}
                      y={y}
                      width={CHIP_W}
                      height={CHIP_H}
                      rx={8}
                      ry={8}
                      className={`ms-viz-chip-rect ${depthFromTop === 0 ? 'is-top' : ''}`}
                    />
                    <text
                      x={STACK_PAD_X / 2 + 14}
                      y={y + CHIP_H / 2 + 5}
                      className="ms-viz-chip-index"
                    >
                      [{idx}]
                    </text>
                    <text
                      x={STACK_PAD_X / 2 + CHIP_W - 14}
                      y={y + CHIP_H / 2 + 5}
                      textAnchor="end"
                      className="ms-viz-chip-value"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

            {frame.popped && (
              <g className="ms-viz-chip ms-viz-chip-popped">
                <rect
                  x={STACK_PAD_X / 2 + CHIP_W + 18}
                  y={chipY(0)}
                  width={CHIP_W}
                  height={CHIP_H}
                  rx={8}
                  ry={8}
                  className="ms-viz-chip-rect is-popped"
                />
                <text
                  x={STACK_PAD_X / 2 + CHIP_W + 18 + 14}
                  y={chipY(0) + CHIP_H / 2 + 5}
                  className="ms-viz-chip-index"
                >
                  [{frame.popped.index}]
                </text>
                <text
                  x={STACK_PAD_X / 2 + CHIP_W + 18 + CHIP_W - 14}
                  y={chipY(0) + CHIP_H / 2 + 5}
                  textAnchor="end"
                  className="ms-viz-chip-value"
                >
                  {frame.popped.value}
                </text>
                <text
                  x={STACK_PAD_X / 2 + CHIP_W + 18 + CHIP_W / 2}
                  y={chipY(0) - 6}
                  textAnchor="middle"
                  className="ms-viz-chip-tag"
                >
                  pop
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      <div className="ms-viz-narration" aria-live="polite">
        {frame.note}
      </div>

      {frame.done && (
        <div className="ms-viz-result" role="status">
          <span className="ms-viz-result-label">Result</span>
          <span className="ms-viz-result-value">
            [{frame.result.join(', ')}]
          </span>
        </div>
      )}

      <div className="ms-viz-actions">
        <button type="button" className="ms-viz-btn" onClick={handleStep} disabled={step >= frames.length - 1}>
          Step
        </button>
        {running ? (
          <button type="button" className="ms-viz-btn ms-viz-btn-primary" onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            className="ms-viz-btn ms-viz-btn-primary"
            onClick={handleRun}
            disabled={frames.length === 0}
          >
            {step >= frames.length - 1 ? 'Replay' : 'Run'}
          </button>
        )}
        <button type="button" className="ms-viz-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
