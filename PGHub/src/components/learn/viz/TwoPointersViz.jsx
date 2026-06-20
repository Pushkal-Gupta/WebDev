import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import './TwoPointersViz.css';

const DEFAULT_ARRAY = [-4, -1, 0, 1, 2, 3, 5, 7, 9, 11];
const DEFAULT_TARGET = 5;
const TICK_MS = 900;

const parseArray = (raw) => {
  const parts = raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const nums = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isFinite(n)) return null;
    nums.push(Math.trunc(n));
  }
  if (nums.length < 2 || nums.length > 16) return null;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < nums[i - 1]) return null;
  }
  return nums;
};

const buildInitialState = (array) => ({
  left: 0,
  right: Math.max(0, array.length - 1),
  steps: 0,
  lastComparison: null,
  status: 'idle',
  pair: null,
});

function TwoPointersViz() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY.join(', '));
  const [targetInput, setTargetInput] = useState(String(DEFAULT_TARGET));
  const [array, setArray] = useState(DEFAULT_ARRAY);
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [state, setState] = useState(() => buildInitialState(DEFAULT_ARRAY));
  const [runningRaw, setRunning] = useState(false);
  const [inputError, setInputError] = useState(null);

  const timerRef = useRef(null);

  const stepOnce = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'found' || prev.status === 'none') return prev;
      const { left, right } = prev;
      if (left >= right) {
        return {
          ...prev,
          status: 'none',
          lastComparison: {
            left,
            right,
            sum: null,
            verdict: 'crossed',
          },
        };
      }
      const a = array[left];
      const b = array[right];
      const sum = a + b;
      const nextStep = prev.steps + 1;

      if (sum === target) {
        return {
          left,
          right,
          steps: nextStep,
          status: 'found',
          pair: { left, right, a, b },
          lastComparison: { left, right, sum, verdict: 'equal' },
        };
      }
      if (sum > target) {
        const nr = right - 1;
        const crossed = left >= nr;
        return {
          left,
          right: nr,
          steps: nextStep,
          status: crossed ? 'none' : 'searching',
          pair: null,
          lastComparison: { left, right, sum, verdict: 'greater' },
        };
      }
      const nl = left + 1;
      const crossed = nl >= right;
      return {
        left: nl,
        right,
        steps: nextStep,
        status: crossed ? 'none' : 'searching',
        pair: null,
        lastComparison: { left, right, sum, verdict: 'less' },
      };
    });
  }, [array, target]);

  // Derive `running` so the effect never has to call setRunning(false) when the
  // search terminates — avoids cascading-render lint.
  const running = runningRaw && state.status !== 'found' && state.status !== 'none';
  useEffect(() => {
    if (!running) return undefined;
    timerRef.current = window.setTimeout(stepOnce, TICK_MS);
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running, stepOnce]);

  const applyInputs = useCallback(() => {
    const parsed = parseArray(arrayInput);
    if (!parsed) {
      setInputError('Enter 2-16 comma-separated integers in non-decreasing order.');
      return false;
    }
    const t = Number(targetInput);
    if (!Number.isFinite(t)) {
      setInputError('Target must be an integer.');
      return false;
    }
    setInputError(null);
    setArray(parsed);
    setTarget(Math.trunc(t));
    setState(buildInitialState(parsed));
    setRunning(false);
    return true;
  }, [arrayInput, targetInput]);

  const handleReset = () => {
    setRunning(false);
    if (!applyInputs()) {
      setState(buildInitialState(array));
    }
  };

  const handleStep = () => {
    if (state.status === 'found' || state.status === 'none') return;
    setRunning(false);
    stepOnce();
  };

  const handleRun = () => {
    if (state.status === 'found' || state.status === 'none') return;
    setRunning((r) => !r);
  };

  const cellWidth = 56;
  const cellGap = 10;
  const padding = 28;
  const svgWidth = padding * 2 + array.length * cellWidth + (array.length - 1) * cellGap;
  const svgHeight = 220;
  const rowY = 60;
  const cellHeight = 56;

  const cellX = (i) => padding + i * (cellWidth + cellGap);

  const sumNow = useMemo(() => {
    if (state.left < state.right) return array[state.left] + array[state.right];
    if (state.left === state.right) return array[state.left] * 2;
    return null;
  }, [array, state.left, state.right]);

  const statusMessage = (() => {
    if (state.status === 'found' && state.pair) {
      return `Pair found: a[${state.pair.left}] + a[${state.pair.right}] = ${state.pair.a} + ${state.pair.b} = ${target}`;
    }
    if (state.status === 'none') {
      return 'Pointers crossed. No pair sums to target.';
    }
    if (state.lastComparison && state.lastComparison.sum !== null) {
      const { left, right, sum, verdict } = state.lastComparison;
      const sign = verdict === 'greater' ? '>' : verdict === 'less' ? '<' : '=';
      return `a[${left}] + a[${right}] = ${sum} ${sign} ${target} ${verdict === 'greater' ? '-> right--' : verdict === 'less' ? '-> left++' : '-> match'}`;
    }
    return `Searching for two values summing to ${target}.`;
  })();

  const cellState = (i) => {
    if (state.status === 'found' && state.pair && (i === state.pair.left || i === state.pair.right)) {
      return 'found';
    }
    if (state.status !== 'found' && state.status !== 'none') {
      if (i === state.left && i === state.right) return 'meet';
      if (i === state.left) return 'left';
      if (i === state.right) return 'right';
    }
    return 'idle';
  };

  return (
    <div className="tp-viz">
      <div className="tp-viz-header">
        <h3 className="tp-viz-title">Two pointers on a sorted array</h3>
        <p className="tp-viz-subtitle">
          Walk left and right toward each other. Sum too small, advance left. Too big, pull right back. Equal, you have your pair.
        </p>
      </div>

      <div className="tp-viz-controls">
        <label className="tp-viz-field">
          <span className="tp-viz-label">Sorted array</span>
          <input
            className="tp-viz-input"
            type="text"
            value={arrayInput}
            onChange={(e) => setArrayInput(e.target.value)}
            spellCheck={false}
            aria-label="Sorted array values"
          />
        </label>
        <label className="tp-viz-field tp-viz-field-target">
          <span className="tp-viz-label">Target sum</span>
          <input
            className="tp-viz-input"
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            aria-label="Target sum"
          />
        </label>
        <button type="button" className="tp-viz-apply" onClick={applyInputs}>
          Apply
        </button>
      </div>

      {inputError && <div className="tp-viz-error">{inputError}</div>}

      <div className="tp-viz-stage" role="img" aria-label="Two pointer visualization">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          className="tp-viz-svg"
        >
          <defs>
            <marker
              id="tp-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
          </defs>

          {array.map((value, i) => {
            const x = cellX(i);
            const s = cellState(i);
            return (
              <g key={i} className={`tp-cell tp-cell-${s}`}>
                <rect
                  x={x}
                  y={rowY}
                  width={cellWidth}
                  height={cellHeight}
                  rx={6}
                  ry={6}
                  className="tp-cell-rect"
                />
                <text
                  x={x + cellWidth / 2}
                  y={rowY + cellHeight / 2 + 5}
                  textAnchor="middle"
                  className="tp-cell-value"
                >
                  {value}
                </text>
                <text
                  x={x + cellWidth / 2}
                  y={rowY - 10}
                  textAnchor="middle"
                  className="tp-cell-index"
                >
                  {i}
                </text>
              </g>
            );
          })}

          {state.status !== 'found' && state.status !== 'none' && (
            <>
              <g className="tp-pointer tp-pointer-left">
                <line
                  x1={cellX(state.left) + cellWidth / 2}
                  y1={rowY + cellHeight + 36}
                  x2={cellX(state.left) + cellWidth / 2}
                  y2={rowY + cellHeight + 8}
                  markerEnd="url(#tp-arrow)"
                  className="tp-pointer-line"
                />
                <text
                  x={cellX(state.left) + cellWidth / 2}
                  y={rowY + cellHeight + 56}
                  textAnchor="middle"
                  className="tp-pointer-label"
                >
                  left
                </text>
              </g>
              <g className="tp-pointer tp-pointer-right">
                <line
                  x1={cellX(state.right) + cellWidth / 2}
                  y1={rowY + cellHeight + 36}
                  x2={cellX(state.right) + cellWidth / 2}
                  y2={rowY + cellHeight + 8}
                  markerEnd="url(#tp-arrow)"
                  className="tp-pointer-line"
                />
                <text
                  x={cellX(state.right) + cellWidth / 2}
                  y={rowY + cellHeight + 56}
                  textAnchor="middle"
                  className="tp-pointer-label"
                >
                  right
                </text>
              </g>
            </>
          )}

          {state.status === 'found' && state.pair && (
            <g className="tp-found-marker">
              <line
                x1={cellX(state.pair.left) + cellWidth / 2}
                y1={rowY + cellHeight + 18}
                x2={cellX(state.pair.right) + cellWidth / 2}
                y2={rowY + cellHeight + 18}
                className="tp-found-line"
              />
              <text
                x={(cellX(state.pair.left) + cellX(state.pair.right) + cellWidth) / 2}
                y={rowY + cellHeight + 42}
                textAnchor="middle"
                className="tp-found-label"
              >
                pair sums to {target}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="tp-viz-readout">
        <div className="tp-viz-readout-row">
          <span className="tp-viz-readout-label">left</span>
          <span className="tp-viz-readout-value tp-mono">{state.left}</span>
          <span className="tp-viz-readout-label">right</span>
          <span className="tp-viz-readout-value tp-mono">{state.right}</span>
          <span className="tp-viz-readout-label">sum</span>
          <span className="tp-viz-readout-value tp-mono">
            {sumNow === null ? '-' : sumNow}
          </span>
          <span className="tp-viz-readout-label">target</span>
          <span className="tp-viz-readout-value tp-mono">{target}</span>
          <span className="tp-viz-readout-label">steps</span>
          <span className="tp-viz-readout-value tp-mono">{state.steps}</span>
        </div>
        <div
          className={`tp-viz-status tp-viz-status-${state.status}`}
          aria-live="polite"
        >
          {statusMessage}
        </div>
      </div>

      <div className="tp-viz-buttons">
        <button
          type="button"
          className="tp-viz-btn tp-viz-btn-primary"
          onClick={handleRun}
          disabled={state.status === 'found' || state.status === 'none'}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'Pause' : 'Run'}
        </button>
        <button
          type="button"
          className="tp-viz-btn"
          onClick={handleStep}
          disabled={running || state.status === 'found' || state.status === 'none'}
        >
          <StepForward size={14} />
          Step
        </button>
        <button type="button" className="tp-viz-btn" onClick={handleReset}>
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}

export default TwoPointersViz;
