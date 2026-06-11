import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

const IN_N = 16;
const K_N = 3;
const OUT_N = IN_N - K_N + 1; // 14
const STEP_DELAY = 120;

// SVG layout. Input grid left, output grid right.
const CELL = 16;
const GAP = 1.5;
const PAD = 14;
const HEADER = 14;
const INPUT_W = IN_N * CELL + (IN_N - 1) * GAP;
const OUTPUT_W = OUT_N * CELL + (OUT_N - 1) * GAP;
const SECTION_GAP = 28;
const STAGE_W = PAD * 2 + INPUT_W + SECTION_GAP + OUTPUT_W;
const STAGE_H = PAD * 2 + HEADER + INPUT_W;

const INPUT_X0 = PAD;
const INPUT_Y0 = PAD + HEADER;
const OUTPUT_X0 = PAD + INPUT_W + SECTION_GAP;
const OUTPUT_Y0 = PAD + HEADER + (INPUT_W - OUTPUT_W) / 2;

// Stylized digit "3" laid on a 16x16 grid. Values in 0..9, designed to give
// readable conv outputs (edges, corners, sharpen, blur all respond visibly).
const DEFAULT_INPUT = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 0, 0, 0],
  [0, 0, 0, 2, 6, 8, 9, 9, 9, 9, 9, 8, 6, 2, 0, 0],
  [0, 0, 2, 7, 9, 9, 7, 4, 3, 4, 7, 9, 9, 7, 2, 0],
  [0, 0, 3, 8, 9, 6, 1, 0, 0, 0, 2, 7, 9, 9, 3, 0],
  [0, 0, 1, 4, 5, 1, 0, 0, 0, 0, 1, 6, 9, 8, 2, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 9, 9, 6, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 2, 6, 9, 9, 9, 7, 2, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 2, 6, 9, 9, 9, 8, 3, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 9, 9, 6, 1, 0],
  [0, 0, 1, 4, 5, 1, 0, 0, 0, 0, 1, 6, 9, 8, 2, 0],
  [0, 0, 3, 8, 9, 6, 1, 0, 0, 0, 2, 7, 9, 9, 3, 0],
  [0, 0, 2, 7, 9, 9, 7, 4, 3, 4, 7, 9, 9, 7, 2, 0],
  [0, 0, 0, 2, 6, 8, 9, 9, 9, 9, 9, 8, 6, 2, 0, 0],
  [0, 0, 0, 0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const DEFAULT_KERNEL = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

const KERNEL_PRESETS = {
  Identity:  [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
  'Sobel X': [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
  'Sobel Y': [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
  Sharpen:   [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  'Box Blur':[[1, 1, 1], [1, 1, 1], [1, 1, 1]], // unnormalized; we normalize sum=1 below
  Gaussian:  [[1, 2, 1], [2, 4, 2], [1, 2, 1]], // unnormalized; gauss /16
  Emboss:    [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
};

// Which presets should be displayed normalized (1/N · matrix). The numeric inputs
// still hold the integer matrix; we apply a divisor at convolution time.
const PRESET_DIVISORS = {
  'Box Blur': 9,
  Gaussian: 16,
};

function cloneGrid(g) {
  return g.map((r) => r.slice());
}

function convolveCell(input, kernel, r, c, divisor) {
  let s = 0;
  for (let i = 0; i < K_N; i++) {
    for (let j = 0; j < K_N; j++) {
      s += input[r + i][c + j] * kernel[i][j];
    }
  }
  return divisor ? s / divisor : s;
}

function convolveAll(input, kernel, divisor) {
  const out = [];
  for (let r = 0; r < OUT_N; r++) {
    const row = [];
    for (let c = 0; c < OUT_N; c++) {
      row.push(convolveCell(input, kernel, r, c, divisor));
    }
    out.push(row);
  }
  return out;
}

function snap(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}

function heatFill(v, maxAbs) {
  if (v === 0 || maxAbs === 0) return 'rgba(var(--accent-rgb, 0, 255, 245), 0.04)';
  const t = Math.min(1, Math.abs(v) / maxAbs);
  if (v > 0) return `rgba(var(--accent-rgb, 0, 255, 245), ${0.08 + t * 0.5})`;
  return `rgba(255, 102, 204, ${0.08 + t * 0.5})`;
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

function Cell({ x, y, value, fill, stroke, strokeWidth = 1, textColor = 'var(--text-main)', fontWeight = 600, fontSize = 8, showText = true }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CELL}
        height={CELL}
        rx={2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {showText && value !== '' && value !== null && (
        <text
          x={x + CELL / 2}
          y={y + CELL / 2 + 3}
          fontSize={fontSize}
          fontFamily="var(--mono, monospace)"
          fontWeight={fontWeight}
          fill={textColor}
          textAnchor="middle"
        >
          {value}
        </text>
      )}
    </g>
  );
}

export default function ConvKernelViz() {
  const [input] = useState(() => cloneGrid(DEFAULT_INPUT));
  const [kernel, setKernel] = useState(() => cloneGrid(DEFAULT_KERNEL));
  const [divisor, setDivisor] = useState(1);
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [computed, setComputed] = useState(() =>
    Array.from({ length: OUT_N }, () => Array(OUT_N).fill(null))
  );
  const [running, setRunning] = useState(false);

  const runningRef = useRef(false);
  const timeoutRef = useRef(null);
  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const fullOutput = useMemo(() => convolveAll(input, kernel, divisor), [input, kernel, divisor]);
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

  const [prevReset, setPrevReset] = useState({ kernel, divisor });
  if (prevReset.kernel !== kernel || prevReset.divisor !== divisor) {
    setPrevReset({ kernel, divisor });
    setComputed(Array.from({ length: OUT_N }, () => Array(OUT_N).fill(null)));
    setPos({ r: 0, c: 0 });
    setRunning(false);
  }

  useEffect(() => {
    runningRef.current = false;
    clearTimers();
  }, [kernel, divisor, clearTimers]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimers();
  }, [clearTimers]);

  const advance = useCallback(() => {
    const { r, c } = posRef.current;
    const val = convolveCell(input, kernel, r, c, divisor);
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
    setPos({ r: OUT_N - 1, c: OUT_N - 1 });
    return false;
  }, [input, kernel, divisor]);

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    advance();
  }, [advance]);

  const handleRun = useCallback(() => {
    if (runningRef.current) {
      stopRun();
      return;
    }
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

  const setKernelSlider = (r, c) => (e) => {
    const n = Number(e.target.value);
    setKernel((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = Number.isFinite(n) ? n : 0;
      return next;
    });
  };

  const applyPreset = (name) => {
    setKernel(cloneGrid(KERNEL_PRESETS[name]));
    setDivisor(PRESET_DIVISORS[name] || 1);
  };

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
    return divisor ? s / divisor : s;
  }, [currentProducts, divisor]);

  const winPos = inputCellPos(pos.r, pos.c);
  const winSize = K_N * CELL + (K_N - 1) * GAP;
  const outPos = outputCellPos(pos.r, pos.c);

  return (
    <div className="mlviz-wrap cv-wrap ckv-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} className="mlviz-svg cv-svg" preserveAspectRatio="xMidYMid meet">
          <text
            x={INPUT_X0}
            y={INPUT_Y0 - 4}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            INPUT 16x16
          </text>
          <text
            x={OUTPUT_X0}
            y={OUTPUT_Y0 - 4}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            OUTPUT 14x14
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
                  fill={inWindow ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.22)' : heatFill(v, maxAbsIn)}
                  stroke={inWindow ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={inWindow ? 1.2 : 0.7}
                  fontSize={7.5}
                  showText={v !== 0}
                />
              );
            })
          )}

          {/* Sliding window outline */}
          <rect
            x={winPos.x - 2}
            y={winPos.y - 2}
            width={winSize + 4}
            height={winSize + 4}
            rx={4}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeDasharray="4 2.5"
            style={{ transition: 'x 0.18s ease, y 0.18s ease' }}
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
                    strokeWidth={isCurrent ? 1.2 : 0.7}
                    textColor="var(--text-dim)"
                    showText={false}
                  />
                );
              }
              return (
                <Cell
                  key={`out-${r}-${c}`}
                  x={x}
                  y={y}
                  value={Math.abs(v) >= 10 ? Math.round(v) : snap(v)}
                  fill={heatFill(v, maxAbsOut)}
                  stroke={isCurrent ? 'var(--hue-sky, #5ecbff)' : 'var(--border)'}
                  strokeWidth={isCurrent ? 1.3 : 0.7}
                  fontSize={6.5}
                />
              );
            })
          )}

          {/* Connector line from window to current output cell */}
          <g opacity="0.5">
            <line
              x1={winPos.x + winSize}
              y1={winPos.y + winSize / 2}
              x2={outPos.x}
              y2={outPos.y + CELL / 2}
              stroke="var(--hue-sky, #5ecbff)"
              strokeWidth="0.9"
              strokeDasharray="3 2"
              style={{ transition: 'all 0.18s ease' }}
            />
          </g>
        </svg>
      </div>

      {/* Kernel editor + presets */}
      <div className="mt-controls cv-kernel-row ckv-kernel-row">
        <div className="cv-kernel-block">
          <div className="cv-kernel-label">
            kernel 3x3{divisor !== 1 ? <span className="ckv-div"> · 1/{divisor}</span> : null}
          </div>
          <div className="mt-matrix">
            <span className="mt-bracket mt-bracket-l">[</span>
            <div className="cv-kernel-grid ckv-kernel-grid">
              {kernel.map((row, r) =>
                row.map((v, c) => (
                  <div className="ckv-kernel-cell" key={`k-${r}-${c}`}>
                    <input
                      type="number"
                      step="1"
                      value={v}
                      onChange={setKernelCell(r, c)}
                      className="mt-cell-input cv-kernel-input ckv-kernel-input"
                    />
                    <input
                      type="range"
                      min={-9}
                      max={9}
                      step={1}
                      value={v}
                      onChange={setKernelSlider(r, c)}
                      className="ckv-kernel-slider"
                      aria-label={`kernel ${r},${c}`}
                    />
                  </div>
                ))
              )}
            </div>
            <span className="mt-bracket mt-bracket-r">]</span>
          </div>
        </div>

        <div className="mt-presets ckv-presets">
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

      {/* Dot product side panel */}
      <div className="cv-product-strip ckv-product-strip">
        <div className="cv-product-block">
          <div className="cv-mini-label">receptive field</div>
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
        <span className="cv-op">{divisor !== 1 ? `÷${divisor} =` : '→'}</span>
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

        <div className="mlviz-hint">
          edit kernel cells, drag sliders, or pick a preset; step one position or run a fast sweep
        </div>
      </div>
    </div>
  );
}
