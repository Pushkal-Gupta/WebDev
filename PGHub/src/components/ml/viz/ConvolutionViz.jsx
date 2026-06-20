import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

const IN_N = 6;
const K_N = 3;
const OUT_N = IN_N - K_N + 1; // 4
const STEP_DELAY = 520;

// SVG layout. Two grids side-by-side: input (left), output (right). Kernel + product strip below.
const CELL = 30;
const GAP = 3;
const PAD = 14;
const INPUT_W = IN_N * CELL + (IN_N - 1) * GAP;
const OUTPUT_W = OUT_N * CELL + (OUT_N - 1) * GAP;
const SECTION_GAP = 36;
const STAGE_W = PAD * 2 + INPUT_W + SECTION_GAP + OUTPUT_W;
const STAGE_H = PAD * 2 + INPUT_W; // input is the taller of the two

const INPUT_X0 = PAD;
const INPUT_Y0 = PAD;
const OUTPUT_X0 = PAD + INPUT_W + SECTION_GAP;
// Vertically center output grid against input grid.
const OUTPUT_Y0 = PAD + (INPUT_W - OUTPUT_W) / 2;

// Default input: an "X" shape on a 6x6 board.
const DEFAULT_INPUT = [
  [5, 0, 0, 0, 0, 5],
  [0, 7, 0, 0, 7, 0],
  [0, 0, 9, 9, 0, 0],
  [0, 0, 9, 9, 0, 0],
  [0, 7, 0, 0, 7, 0],
  [5, 0, 0, 0, 0, 5],
];

const DEFAULT_KERNEL = [
  [1, 0, -1],
  [1, 0, -1],
  [1, 0, -1],
];

const KERNEL_PRESETS = {
  'Edge X': [[1, 0, -1], [1, 0, -1], [1, 0, -1]],
  'Edge Y': [[1, 1, 1], [0, 0, 0], [-1, -1, -1]],
  'Sharpen': [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  'Blur': [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  'Identity': [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
};

function cloneGrid(g) {
  return g.map((r) => r.slice());
}

function convolveCell(input, kernel, r, c) {
  let s = 0;
  for (let i = 0; i < K_N; i++) {
    for (let j = 0; j < K_N; j++) {
      s += input[r + i][c + j] * kernel[i][j];
    }
  }
  return s;
}

function convolveAll(input, kernel) {
  const out = [];
  for (let r = 0; r < OUT_N; r++) {
    const row = [];
    for (let c = 0; c < OUT_N; c++) {
      row.push(convolveCell(input, kernel, r, c));
    }
    out.push(row);
  }
  return out;
}

function snap(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}

// Color a numeric value as a heat-coded fill. Positive → accent, negative → pink, zero → near surface.
function heatFill(v, maxAbs) {
  if (v === 0 || maxAbs === 0) return 'rgba(var(--accent-rgb, 0, 255, 245), 0.04)';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  const pct = Math.round((0.08 + t * 0.42) * 100);
  if (v > 0) return `rgba(var(--accent-rgb, 0, 255, 245), ${0.08 + t * 0.42})`;
  return `color-mix(in srgb, var(--hue-pink) ${pct}%, transparent)`;
}

function inputCellPos(r, c) {
  return {
    x: INPUT_X0 + c * (CELL + GAP),
    y: INPUT_Y0 + r * (CELL + GAP),
  };
}

function outputCellPos(r, c) {
  return {
    x: OUTPUT_X0 + c * (CELL + GAP),
    y: OUTPUT_Y0 + r * (CELL + GAP),
  };
}

function Cell({ x, y, value, fill, stroke, strokeWidth = 1, textColor = 'var(--text-main)', fontWeight = 600, fontSize = 12 }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CELL}
        height={CELL}
        rx={4}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text
        x={x + CELL / 2}
        y={y + CELL / 2 + 4}
        fontSize={fontSize}
        fontFamily="var(--mono, monospace)"
        fontWeight={fontWeight}
        fill={textColor}
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );
}

export default function ConvolutionViz() {
  const [input] = useState(() => cloneGrid(DEFAULT_INPUT));
  const [kernel, setKernel] = useState(() => cloneGrid(DEFAULT_KERNEL));
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [computed, setComputed] = useState(() => {
    // start with all output cells already greyed-out, populate as we step
    return Array.from({ length: OUT_N }, () => Array(OUT_N).fill(null));
  });
  const [running, setRunning] = useState(false);

  const runningRef = useRef(false);
  const timeoutRef = useRef(null);
  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const fullOutput = useMemo(() => convolveAll(input, kernel), [input, kernel]);
  const maxAbsOut = useMemo(() => {
    let m = 0;
    for (const row of fullOutput) for (const v of row) if (Math.abs(v) > m) m = Math.abs(v);
    return m || 1;
  }, [fullOutput]);
  const maxAbsIn = useMemo(() => {
    let m = 0;
    for (const row of input) for (const v of row) if (Math.abs(v) > m) m = Math.abs(v);
    return m || 1;
  }, [input]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    clearTimers();
  }, [clearTimers]);

  // Re-blank computed cells when kernel changes.
  const [prevKernel, setPrevKernel] = useState(kernel);
  if (prevKernel !== kernel) {
    setPrevKernel(kernel);
    setComputed(Array.from({ length: OUT_N }, () => Array(OUT_N).fill(null)));
    setPos({ r: 0, c: 0 });
    setRunning(false);
  }

  useEffect(() => {
    runningRef.current = false;
    clearTimers();
  }, [kernel, clearTimers]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimers();
  }, [clearTimers]);

  const advance = useCallback(() => {
    const { r, c } = posRef.current;
    const val = convolveCell(input, kernel, r, c);
    setComputed((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = val;
      return next;
    });
    const nc = c + 1;
    if (nc < OUT_N) {
      setPos({ r, c: nc });
      return true;
    }
    const nr = r + 1;
    if (nr < OUT_N) {
      setPos({ r: nr, c: 0 });
      return true;
    }
    // Reached the end. Pin position at last cell.
    setPos({ r: OUT_N - 1, c: OUT_N - 1 });
    return false;
  }, [input, kernel]);

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    advance();
  }, [advance]);

  const handleRun = useCallback(() => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    // If we are at the final filled cell, restart from the beginning.
    const allFilled = computed.every((row) => row.every((v) => v !== null));
    if (allFilled) {
      setComputed(Array.from({ length: OUT_N }, () => Array(OUT_N).fill(null)));
      setPos({ r: 0, c: 0 });
    }
    runningRef.current = true;
    setRunning(true);
    const tick = () => {
      if (!runningRef.current) return;
      const more = advance();
      if (!more) {
        stopRun();
        return;
      }
      timeoutRef.current = setTimeout(tick, STEP_DELAY);
    };
    timeoutRef.current = setTimeout(tick, STEP_DELAY);
  }, [advance, computed, stopRun]);

  const handleReset = useCallback(() => {
    stopRun();
    setPos({ r: 0, c: 0 });
    setComputed(Array.from({ length: OUT_N }, () => Array(OUT_N).fill(null)));
  }, [stopRun]);

  const setKernelCell = (r, c) => (e) => {
    const n = Number(e.target.value);
    setKernel((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = Number.isFinite(n) ? n : 0;
      return next;
    });
  };

  const applyPreset = (name) => {
    setKernel(cloneGrid(KERNEL_PRESETS[name]));
  };

  // Current window product grid and sum.
  const currentProducts = useMemo(() => {
    const p = [];
    for (let i = 0; i < K_N; i++) {
      const row = [];
      for (let j = 0; j < K_N; j++) {
        row.push(input[pos.r + i][pos.c + j] * kernel[i][j]);
      }
      p.push(row);
    }
    return p;
  }, [input, kernel, pos]);

  const currentSum = useMemo(() => {
    let s = 0;
    for (const row of currentProducts) for (const v of row) s += v;
    return s;
  }, [currentProducts]);

  // Window rect on input
  const winPos = inputCellPos(pos.r, pos.c);
  const winSize = K_N * CELL + (K_N - 1) * GAP;
  // The target output cell that just lit up (or will).
  const outPos = outputCellPos(pos.r, pos.c);

  return (
    <div className="mlviz-wrap cv-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} className="mlviz-svg cv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="cv-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {/* Section labels */}
          <text
            x={INPUT_X0}
            y={INPUT_Y0 - 4}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            INPUT 6x6
          </text>
          <text
            x={OUTPUT_X0}
            y={OUTPUT_Y0 - 4}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            OUTPUT 4x4
          </text>

          {/* Input grid */}
          {input.map((row, r) =>
            row.map((v, c) => {
              const { x, y } = inputCellPos(r, c);
              const inWindow = r >= pos.r && r < pos.r + K_N && c >= pos.c && c < pos.c + K_N;
              return (
                <Cell
                  key={`in-${r}-${c}`}
                  x={x}
                  y={y}
                  value={v}
                  fill={inWindow ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.18)' : heatFill(v, maxAbsIn)}
                  stroke={inWindow ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={inWindow ? 1.4 : 1}
                />
              );
            })
          )}

          {/* Sliding window outline (animated translation via CSS transition on rect attrs) */}
          <rect
            x={winPos.x - 2}
            y={winPos.y - 2}
            width={winSize + 4}
            height={winSize + 4}
            rx={6}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            filter="url(#cv-glow)"
            opacity="0.5"
            style={{ transition: 'x 0.32s ease, y 0.32s ease' }}
          />
          <rect
            x={winPos.x - 2}
            y={winPos.y - 2}
            width={winSize + 4}
            height={winSize + 4}
            rx={6}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray="5 3"
            style={{ transition: 'x 0.32s ease, y 0.32s ease' }}
          />

          {/* Active output cell halo */}
          <rect
            x={outPos.x - 2}
            y={outPos.y - 2}
            width={CELL + 4}
            height={CELL + 4}
            rx={6}
            fill="var(--hue-sky)"
            filter="url(#cv-glow)"
            opacity="0.4"
            style={{ transition: 'x 0.32s ease, y 0.32s ease' }}
          />

          {/* Output grid */}
          {computed.map((row, r) =>
            row.map((v, c) => {
              const { x, y } = outputCellPos(r, c);
              const isCurrent = r === pos.r && c === pos.c;
              if (v === null) {
                return (
                  <Cell
                    key={`out-${r}-${c}`}
                    x={x}
                    y={y}
                    value=""
                    fill="var(--bg)"
                    stroke={isCurrent ? 'var(--hue-sky, #5ecbff)' : 'var(--border)'}
                    strokeWidth={isCurrent ? 1.4 : 1}
                    textColor="var(--text-dim)"
                  />
                );
              }
              return (
                <Cell
                  key={`out-${r}-${c}`}
                  x={x}
                  y={y}
                  value={snap(v)}
                  fill={heatFill(v, maxAbsOut)}
                  stroke={isCurrent ? 'var(--hue-sky, #5ecbff)' : 'var(--border)'}
                  strokeWidth={isCurrent ? 1.6 : 1}
                />
              );
            })
          )}

          {/* Connector arrow from window to current output cell */}
          <g opacity="0.55">
            <line
              x1={winPos.x + winSize}
              y1={winPos.y + winSize / 2}
              x2={outPos.x}
              y2={outPos.y + CELL / 2}
              stroke="var(--hue-sky, #5ecbff)"
              strokeWidth="1"
              strokeDasharray="3 3"
              style={{ transition: 'all 0.32s ease' }}
            />
          </g>
        </svg>
      </div>

      {/* Kernel editor + presets */}
      <div className="mt-controls cv-kernel-row">
        <div className="cv-kernel-block">
          <div className="cv-kernel-label">kernel 3x3</div>
          <div className="mt-matrix">
            <span className="mt-bracket mt-bracket-l">[</span>
            <div className="cv-kernel-grid">
              {kernel.map((row, r) =>
                row.map((v, c) => (
                  <input
                    key={`k-${r}-${c}`}
                    type="number"
                    step="1"
                    value={v}
                    onChange={setKernelCell(r, c)}
                    className="mt-cell-input cv-kernel-input"
                  />
                ))
              )}
            </div>
            <span className="mt-bracket mt-bracket-r">]</span>
          </div>
        </div>

        <div className="mt-presets">
          {Object.keys(KERNEL_PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              className="mt-preset-btn"
              onClick={() => applyPreset(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Current-step elementwise product strip */}
      <div className="cv-product-strip">
        <div className="cv-product-block">
          <div className="cv-mini-label">window</div>
          <div className="cv-mini-grid">
            {Array.from({ length: K_N }).map((_, i) =>
              Array.from({ length: K_N }).map((_, j) => (
                <span key={`w-${i}-${j}`} className="cv-mini-cell">
                  {input[pos.r + i][pos.c + j]}
                </span>
              ))
            )}
          </div>
        </div>
        <span className="cv-op">·</span>
        <div className="cv-product-block">
          <div className="cv-mini-label">kernel</div>
          <div className="cv-mini-grid">
            {kernel.map((row, i) =>
              row.map((v, j) => (
                <span key={`mk-${i}-${j}`} className="cv-mini-cell cv-mini-cell-kernel">
                  {v}
                </span>
              ))
            )}
          </div>
        </div>
        <span className="cv-op">=</span>
        <div className="cv-product-block">
          <div className="cv-mini-label">products</div>
          <div className="cv-mini-grid">
            {currentProducts.map((row, i) =>
              row.map((v, j) => (
                <span
                  key={`p-${i}-${j}`}
                  className="cv-mini-cell cv-mini-cell-prod"
                  style={{
                    color:
                      v > 0 ? 'var(--accent)' :
                      v < 0 ? 'var(--hue-pink, #ff66cc)' :
                      'var(--text-dim)',
                  }}
                >
                  {snap(v)}
                </span>
              ))
            )}
          </div>
        </div>
        <span className="cv-op">→</span>
        <div className="cv-sum-block">
          <div className="cv-mini-label">sum</div>
          <div className="cv-sum-val">{snap(currentSum)}</div>
        </div>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>pos</span>
          <span className="mlviz-val">({pos.r}, {pos.c})</span>
          <span className="mlviz-sub">window top-left in input</span>
          <span className="mlviz-sub">output cell ({pos.r}, {pos.c})</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Pause' : 'Run'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">edit kernel cells or pick a preset; step to slide the window</div>
      </div>
    </div>
  );
}
