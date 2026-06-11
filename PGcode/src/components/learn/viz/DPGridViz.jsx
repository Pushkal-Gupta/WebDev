import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './DPGridViz.css';

const MIN_DIM = 2;
const MAX_DIM = 8;
const DEFAULT_M = 4;
const DEFAULT_N = 5;
const TICK_MS = 850;

function clampDim(value) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return MIN_DIM;
  if (n < MIN_DIM) return MIN_DIM;
  if (n > MAX_DIM) return MAX_DIM;
  return n;
}

function buildSteps(m, n) {
  const total = m * n;
  const steps = new Array(total);
  const dp = Array.from({ length: m }, () => new Array(n).fill(0));

  for (let k = 0; k < total; k += 1) {
    const i = Math.floor(k / n);
    const j = k % n;

    let value;
    let kind;
    let contributors = [];
    let from = { up: 0, left: 0 };

    if (i === 0 && j === 0) {
      value = 1;
      kind = 'origin';
    } else if (i === 0) {
      value = 1;
      kind = 'top';
    } else if (j === 0) {
      value = 1;
      kind = 'left-edge';
    } else {
      const up = dp[i - 1][j];
      const left = dp[i][j - 1];
      value = up + left;
      kind = 'interior';
      contributors = [
        { i: i - 1, j, role: 'up' },
        { i, j: j - 1, role: 'left' },
      ];
      from = { up, left };
    }

    dp[i][j] = value;

    const filled = [];
    for (let kk = 0; kk <= k; kk += 1) {
      filled.push([Math.floor(kk / n), kk % n, dp[Math.floor(kk / n)][kk % n]]);
    }

    steps[k] = {
      idx: k,
      i,
      j,
      kind,
      value,
      contributors,
      from,
      filled,
    };
  }

  return steps;
}

function cellId(i, j) {
  return `${i}-${j}`;
}

function describeStep(step) {
  if (!step) return '';
  const { i, j, kind, value, from } = step;
  if (kind === 'origin') {
    return `Start cell dp[0][0] = 1. There is exactly one way to stand at the origin.`;
  }
  if (kind === 'top') {
    return `dp[0][${j}] = 1. The top row has a single path: keep moving right.`;
  }
  if (kind === 'left-edge') {
    return `dp[${i}][0] = 1. The left column has a single path: keep moving down.`;
  }
  return `dp[${i}][${j}] = dp[${i - 1}][${j}] + dp[${i}][${j - 1}] = ${from.up} + ${from.left} = ${value}.`;
}

function formulaForStep(step) {
  if (!step) return '';
  const { i, j, kind, value, from } = step;
  if (kind === 'origin') return `dp[0][0] = 1`;
  if (kind === 'top') return `dp[0][${j}] = 1   (top row base case)`;
  if (kind === 'left-edge') return `dp[${i}][0] = 1   (left column base case)`;
  return `dp[${i}][${j}] = dp[${i - 1}][${j}] + dp[${i}][${j - 1}] = ${from.up} + ${from.left} = ${value}`;
}

export default function DPGridViz() {
  const [m, setM] = useState(DEFAULT_M);
  const [n, setN] = useState(DEFAULT_N);
  const steps = useMemo(() => buildSteps(m, n), [m, n]);
  const [idx, setIdx] = useState(-1);
  const [playingRaw, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const [prevSteps, setPrevSteps] = useState(steps);
  if (prevSteps !== steps) {
    setPrevSteps(steps);
    setIdx(-1);
    setPlaying(false);
  }

  const total = steps.length;
  const current = idx >= 0 ? steps[idx] : null;
  const finalAnswer = steps.length > 0 ? steps[steps.length - 1].value : 0;
  const atEnd = idx >= total - 1;
  // Derive `playing` from the raw toggle + bounds so the auto-run effect never
  // needs to call setPlaying(false) when we hit the end.
  const playing = playingRaw && idx < total - 1;

  const next = useCallback(() => {
    setIdx((i) => (i >= total - 1 ? i : i + 1));
  }, [total]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setInterval(() => {
      next();
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(-1);
  };

  const handleRun = () => {
    if (atEnd) {
      setIdx(-1);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const handleDimChange = (which) => (e) => {
    const v = clampDim(e.target.value);
    if (which === 'm') setM(v);
    else setN(v);
  };

  const filledMap = useMemo(() => {
    const map = new Map();
    if (!current) return map;
    current.filled.forEach(([ci, cj, val]) => {
      map.set(cellId(ci, cj), val);
    });
    return map;
  }, [current]);

  const contributorSet = useMemo(() => {
    const set = new Set();
    if (!current) return set;
    current.contributors.forEach((c) => set.add(cellId(c.i, c.j)));
    return set;
  }, [current]);

  // SVG layout
  const PADDING = 28;
  const cellSize = useMemo(() => {
    const maxCanvasW = 560;
    const maxCanvasH = 380;
    const availW = maxCanvasW - PADDING * 2;
    const availH = maxCanvasH - PADDING * 2;
    return Math.floor(Math.min(availW / n, availH / m));
  }, [m, n]);

  const gridW = cellSize * n;
  const gridH = cellSize * m;
  const viewW = gridW + PADDING * 2;
  const viewH = gridH + PADDING * 2;

  const cellX = (j) => PADDING + j * cellSize;
  const cellY = (i) => PADDING + i * cellSize;
  const cellCx = (j) => cellX(j) + cellSize / 2;
  const cellCy = (i) => cellY(i) + cellSize / 2;

  return (
    <div className="dpgridviz">
      <div className="dpgridviz-header">
        <div className="dpgridviz-title">Unique paths — bottom-up DP</div>
        <div className="dpgridviz-dims">
          <div className="dpgridviz-dim">
            <label htmlFor="dpgridviz-m">rows m</label>
            <input
              id="dpgridviz-m"
              type="number"
              min={MIN_DIM}
              max={MAX_DIM}
              value={m}
              onChange={handleDimChange('m')}
            />
          </div>
          <div className="dpgridviz-dim">
            <label htmlFor="dpgridviz-n">cols n</label>
            <input
              id="dpgridviz-n"
              type="number"
              min={MIN_DIM}
              max={MAX_DIM}
              value={n}
              onChange={handleDimChange('n')}
            />
          </div>
        </div>
      </div>

      <div className="dpgridviz-legend">
        <span className="dpgridviz-legend-item">
          <span className="dpgridviz-dot dpgridviz-dot-empty" /> not filled
        </span>
        <span className="dpgridviz-legend-item">
          <span className="dpgridviz-dot dpgridviz-dot-filled" /> filled
        </span>
        <span className="dpgridviz-legend-item">
          <span className="dpgridviz-dot dpgridviz-dot-contrib" /> contributor
        </span>
        <span className="dpgridviz-legend-item">
          <span className="dpgridviz-dot dpgridviz-dot-current" /> filling now
        </span>
      </div>

      <div className="dpgridviz-stage">
        <svg
          className="dpgridviz-svg"
          viewBox={`0 0 ${viewW} ${viewH}`}
          role="img"
          aria-label={`Dynamic programming grid ${m} by ${n}`}
        >
          <defs>
            <marker
              id="dpgridviz-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="dpgridviz-arrow-head" />
            </marker>
          </defs>

          <g className="dpgridviz-axes">
            {Array.from({ length: n }).map((_, j) => (
              <text
                key={`col-${j}`}
                className="dpgridviz-axis-label"
                x={cellCx(j)}
                y={PADDING - 8}
                textAnchor="middle"
              >
                {j}
              </text>
            ))}
            {Array.from({ length: m }).map((_, i) => (
              <text
                key={`row-${i}`}
                className="dpgridviz-axis-label"
                x={PADDING - 10}
                y={cellCy(i)}
                textAnchor="end"
                dominantBaseline="central"
              >
                {i}
              </text>
            ))}
          </g>

          <g className="dpgridviz-cells">
            {Array.from({ length: m }).flatMap((_, i) =>
              Array.from({ length: n }).map((__, j) => {
                const id = cellId(i, j);
                const isFilled = filledMap.has(id);
                const isCurrent = current && current.i === i && current.j === j;
                const isContrib = contributorSet.has(id);
                const isGoal = i === m - 1 && j === n - 1;
                let cls = 'dpgridviz-cell';
                if (isFilled && !isCurrent) cls += ' dpgridviz-cell-filled';
                if (isCurrent) cls += ' dpgridviz-cell-current';
                if (isContrib) cls += ' dpgridviz-cell-contrib';
                if (isGoal && atEnd) cls += ' dpgridviz-cell-goal';
                return (
                  <g key={id} className={cls}>
                    <rect
                      x={cellX(j)}
                      y={cellY(i)}
                      width={cellSize}
                      height={cellSize}
                      rx={6}
                      ry={6}
                    />
                    {isFilled ? (
                      <text
                        x={cellCx(j)}
                        y={cellCy(i)}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {filledMap.get(id)}
                      </text>
                    ) : (
                      <text
                        className="dpgridviz-cell-placeholder"
                        x={cellCx(j)}
                        y={cellCy(i)}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        ·
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </g>

          {current && current.contributors.length > 0 && (
            <g className="dpgridviz-arrows">
              {current.contributors.map((c) => {
                const x1 = cellCx(c.j);
                const y1 = cellCy(c.i);
                const x2 = cellCx(current.j);
                const y2 = cellCy(current.i);
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const inset = cellSize * 0.32;
                const sx = x1 + (dx / len) * inset;
                const sy = y1 + (dy / len) * inset;
                const ex = x2 - (dx / len) * inset;
                const ey = y2 - (dy / len) * inset;
                return (
                  <line
                    key={`arrow-${c.role}`}
                    className={`dpgridviz-arrow dpgridviz-arrow-${c.role}`}
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    markerEnd="url(#dpgridviz-arrow)"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="dpgridviz-status">
        <div className="dpgridviz-status-row">
          <span className="dpgridviz-status-label">Step</span>
          <span className="dpgridviz-status-value">
            {Math.max(idx + 1, 0)} / {total}
          </span>
        </div>
        <div className="dpgridviz-status-row">
          <span className="dpgridviz-status-label">Cell</span>
          <span className="dpgridviz-status-value">
            {current ? (
              <>dp[{current.i}][{current.j}]</>
            ) : (
              <span className="dpgridviz-muted">not started</span>
            )}
          </span>
        </div>
        <div className="dpgridviz-status-row">
          <span className="dpgridviz-status-label">Grid</span>
          <span className="dpgridviz-status-value">{m} × {n}</span>
        </div>
      </div>

      <div className="dpgridviz-formula">
        <span className="dpgridviz-formula-label">Recurrence</span>
        <code className="dpgridviz-formula-body">
          {current ? formulaForStep(current) : 'dp[i][j] = dp[i-1][j] + dp[i][j-1]'}
        </code>
      </div>

      <p className="dpgridviz-caption">
        {current
          ? describeStep(current)
          : `Press Step or Run to fill the ${m} × ${n} table in row-major order. The bottom-right cell will hold the number of unique paths.`}
      </p>

      {atEnd && (
        <div className="dpgridviz-answer">
          <span className="dpgridviz-answer-label">Answer</span>
          <span className="dpgridviz-answer-value">{finalAnswer}</span>
          <span className="dpgridviz-answer-note">
            unique paths from (0,0) to ({m - 1},{n - 1})
          </span>
        </div>
      )}

      <div className="dpgridviz-controls">
        <button
          type="button"
          className="dpgridviz-btn dpgridviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="dpgridviz-btn dpgridviz-btn-primary"
          onClick={handleRun}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="dpgridviz-btn dpgridviz-btn-secondary"
          onClick={next}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
      </div>
    </div>
  );
}
