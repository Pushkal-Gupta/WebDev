import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './SlidingWindowViz.css';

const DEFAULT_ARRAY = [2, 1, 5, 1, 3, 2, 4, 7, 2, 5, 1, 3];
const DEFAULT_WINDOW = 3;
const TICK_MS = 700;

const CELL_W = 56;
const CELL_H = 56;
const CELL_GAP = 8;
const PAD_X = 28;
const PAD_TOP = 96;
const PAD_BOTTOM = 56;

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

function buildFrames(array, windowSize) {
  const frames = [];
  if (!array.length || windowSize <= 0 || windowSize > array.length) {
    return frames;
  }

  let sum = 0;
  for (let i = 0; i < windowSize; i += 1) sum += array[i];
  let maxSum = sum;
  let maxStart = 0;

  frames.push({
    start: 0,
    end: windowSize - 1,
    sum,
    maxSum,
    maxStart,
    note: `Build the first window of size ${windowSize}. Sum = ${sum}.`,
    done: false,
  });

  for (let start = 1; start + windowSize - 1 < array.length; start += 1) {
    const removed = array[start - 1];
    const added = array[start + windowSize - 1];
    sum = sum - removed + added;
    if (sum > maxSum) {
      maxSum = sum;
      maxStart = start;
    }
    frames.push({
      start,
      end: start + windowSize - 1,
      sum,
      maxSum,
      maxStart,
      note: `Slide right: subtract ${removed}, add ${added}. Sum = ${sum}.`,
      done: false,
    });
  }

  const last = frames[frames.length - 1];
  frames.push({
    ...last,
    note: `Done. Best window starts at index ${maxStart} with sum ${maxSum}.`,
    done: true,
  });

  return frames;
}

export default function SlidingWindowViz() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY.join(', '));
  const [windowInput, setWindowInput] = useState(String(DEFAULT_WINDOW));

  const array = useMemo(() => {
    const parsed = parseArrayInput(arrayInput);
    return parsed.length ? parsed : DEFAULT_ARRAY;
  }, [arrayInput]);

  const windowSize = useMemo(() => {
    const n = parseInt(windowInput, 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    if (n > array.length) return array.length;
    return n;
  }, [windowInput, array.length]);

  const frames = useMemo(() => buildFrames(array, windowSize), [array, windowSize]);

  const [step, setStep] = useState(0);
  const [runningRaw, setRunning] = useState(false);
  const timerRef = useRef(null);

  // Reset playhead when the input changes (prev-state-during-render pattern).
  const [prevArray, setPrevArray] = useState(array);
  const [prevWindow, setPrevWindow] = useState(windowSize);
  if (prevArray !== array || prevWindow !== windowSize) {
    setPrevArray(array);
    setPrevWindow(windowSize);
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

  const frame = frames[step] ?? { start: 0, end: windowSize - 1, sum: 0, maxSum: 0, maxStart: 0, note: '', done: false };
  const totalSteps = Math.max(frames.length, 1);
  const widthSvg = PAD_X * 2 + array.length * CELL_W + (array.length - 1) * CELL_GAP;
  const heightSvg = PAD_TOP + CELL_H + PAD_BOTTOM;

  const cellX = (i) => PAD_X + i * (CELL_W + CELL_GAP);
  const windowX = cellX(frame.start) - 6;
  const windowW = (frame.end - frame.start + 1) * CELL_W + (frame.end - frame.start) * CELL_GAP + 12;

  return (
    <div className="sw-viz" role="region" aria-label="Sliding window visualization">
      <header className="sw-viz-head">
        <h3 className="sw-viz-title">Sliding Window</h3>
        <p className="sw-viz-sub">
          Fixed-size window slides across the array. Each step adds one element on the right and drops one on the left, keeping
          the sum in O(1) per move.
        </p>
      </header>

      <div className="sw-viz-controls">
        <label className="sw-viz-field">
          <span className="sw-viz-label">Array</span>
          <input
            className="sw-viz-input"
            value={arrayInput}
            onChange={(e) => setArrayInput(e.target.value)}
            placeholder="comma-separated ints"
            spellCheck={false}
          />
        </label>
        <label className="sw-viz-field sw-viz-field-narrow">
          <span className="sw-viz-label">Window size</span>
          <input
            className="sw-viz-input"
            type="number"
            min={1}
            max={array.length}
            value={windowInput}
            onChange={(e) => setWindowInput(e.target.value)}
          />
        </label>
      </div>

      <div className="sw-viz-metrics">
        <div className="sw-viz-metric">
          <span className="sw-viz-metric-label">Window sum</span>
          <span className="sw-viz-metric-value">{frame.sum}</span>
        </div>
        <div className="sw-viz-metric sw-viz-metric-max">
          <span className="sw-viz-metric-label">Max sum so far</span>
          <span className="sw-viz-metric-value">{frame.maxSum}</span>
        </div>
        <div className="sw-viz-metric">
          <span className="sw-viz-metric-label">Step</span>
          <span className="sw-viz-metric-value">
            {step + 1}<span className="sw-viz-metric-dim"> / {totalSteps}</span>
          </span>
        </div>
        <div className="sw-viz-metric">
          <span className="sw-viz-metric-label">Window</span>
          <span className="sw-viz-metric-value">
            [{frame.start}, {frame.end}]
          </span>
        </div>
      </div>

      <div className="sw-viz-stage">
        <svg
          className="sw-viz-svg"
          viewBox={`0 0 ${widthSvg} ${heightSvg}`}
          width="100%"
          role="img"
          aria-label={`Array of ${array.length} elements with a window of size ${windowSize}`}
        >
          <defs>
            <linearGradient id="sw-win-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.14" />
            </linearGradient>
            <marker id="sw-arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
            </marker>
          </defs>

          <text
            x={windowX + windowW / 2}
            y={PAD_TOP - 60}
            className="sw-viz-svg-sum"
            textAnchor="middle"
          >
            sum = {frame.sum}
          </text>
          <line
            x1={windowX + windowW / 2}
            y1={PAD_TOP - 50}
            x2={windowX + windowW / 2}
            y2={PAD_TOP - 16}
            className="sw-viz-svg-arrow"
            markerEnd="url(#sw-arrow-head)"
          />

          <rect
            x={windowX}
            y={PAD_TOP - 8}
            width={windowW}
            height={CELL_H + 16}
            rx={10}
            ry={10}
            fill="url(#sw-win-grad)"
            stroke="var(--accent)"
            strokeWidth="1.5"
            className="sw-viz-window"
          />

          {array.map((value, i) => {
            const inWindow = i >= frame.start && i <= frame.end;
            const isMax = frame.done && i >= frame.maxStart && i < frame.maxStart + windowSize;
            const x = cellX(i);
            return (
              <g key={i} className={`sw-viz-cell ${inWindow ? 'sw-in' : ''} ${isMax ? 'sw-max' : ''}`}>
                <rect
                  x={x}
                  y={PAD_TOP}
                  width={CELL_W}
                  height={CELL_H}
                  rx={8}
                  ry={8}
                  className="sw-viz-cell-rect"
                />
                <text x={x + CELL_W / 2} y={PAD_TOP + CELL_H / 2 + 6} textAnchor="middle" className="sw-viz-cell-value">
                  {value}
                </text>
                <text x={x + CELL_W / 2} y={PAD_TOP + CELL_H + 22} textAnchor="middle" className="sw-viz-cell-index">
                  {i}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sw-viz-narration" aria-live="polite">
        {frame.note}
      </div>

      {frame.done && (
        <div className="sw-viz-result" role="status">
          <span className="sw-viz-result-label">Best window</span>
          <span className="sw-viz-result-value">
            indices [{frame.maxStart}, {frame.maxStart + windowSize - 1}] sum {frame.maxSum}
          </span>
        </div>
      )}

      <div className="sw-viz-actions">
        <button type="button" className="sw-viz-btn" onClick={handleStep} disabled={step >= frames.length - 1}>
          Step
        </button>
        {running ? (
          <button type="button" className="sw-viz-btn sw-viz-btn-primary" onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            className="sw-viz-btn sw-viz-btn-primary"
            onClick={handleRun}
            disabled={frames.length === 0}
          >
            {step >= frames.length - 1 ? 'Replay' : 'Run'}
          </button>
        )}
        <button type="button" className="sw-viz-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
