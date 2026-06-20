import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Grid3x3, RotateCcw } from 'lucide-react';
import './MLViz.css';

// Deterministic input grid via mulberry32 — no Math.random, stable across renders.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const IN_N = 8;
const rng = mulberry32(20260619);
const INPUT = Array.from({ length: IN_N }, () =>
  Array.from({ length: IN_N }, () => Math.round(rng() * 9))
);

// Edge-detect-ish kernels keyed by size; values normalised for readable products.
const KERNELS = {
  3: [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],
  5: [
    [-1, -1, 0, 1, 1],
    [-1, -1, 0, 1, 1],
    [-2, -2, 0, 2, 2],
    [-1, -1, 0, 1, 1],
    [-1, -1, 0, 1, 1],
  ],
};

const VB = 600;
const VBH = 360;
const PAD = 16;
const GRID_PX = 248;
const CELL = GRID_PX / IN_N;
const IN_X = PAD;
const IN_Y = (VBH - GRID_PX) / 2;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function outSize(n, k, s) {
  return Math.floor((n - k) / s) + 1;
}

export default function ConvKernelExplorerViz({ kernelSize = 3, stride = 1 }) {
  const [k, setK] = useState(KERNELS[kernelSize] ? kernelSize : 3);
  const [s, setS] = useState(clamp(stride, 1, 3));
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const svgRef = useRef(null);
  const dragRef = useRef(false);

  const oN = outSize(IN_N, k, s);
  const kernel = KERNELS[k];

  // clamp drag position to valid output coords
  const cr = clamp(pos.r, 0, oN - 1);
  const cc = clamp(pos.c, 0, oN - 1);
  const topR = cr * s;
  const topC = cc * s;

  // element-wise products + accumulate at current window
  const { products, dot } = useMemo(() => {
    const prods = [];
    let acc = 0;
    for (let i = 0; i < k; i++) {
      const row = [];
      for (let j = 0; j < k; j++) {
        const iv = INPUT[topR + i][topC + j];
        const kv = kernel[i][j];
        const p = iv * kv;
        row.push({ iv, kv, p });
        acc += p;
      }
      prods.push(row);
    }
    return { products: prods, dot: acc };
  }, [k, kernel, topR, topC]);

  // full output feature map (for the lit output grid)
  const outMap = useMemo(() => {
    const m = [];
    let mn = Infinity;
    let mx = -Infinity;
    for (let or = 0; or < oN; or++) {
      const row = [];
      for (let oc = 0; oc < oN; oc++) {
        let acc = 0;
        for (let i = 0; i < k; i++)
          for (let j = 0; j < k; j++)
            acc += INPUT[or * s + i][oc * s + j] * kernel[i][j];
        row.push(acc);
        if (acc < mn) mn = acc;
        if (acc > mx) mx = acc;
      }
      m.push(row);
    }
    return { m, mn, mx };
  }, [k, kernel, s, oN]);

  const outCellPx = GRID_PX / oN;
  const OUT_X = VB - PAD - GRID_PX;
  const OUT_Y = IN_Y;

  const moveToClient = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * VB;
      const y = ((clientY - rect.top) / rect.height) * VBH;
      const gx = (x - IN_X) / CELL;
      const gy = (y - IN_Y) / CELL;
      const nr = clamp(Math.round((gy - k / 2) / s), 0, oN - 1);
      const nc = clamp(Math.round((gx - k / 2) / s), 0, oN - 1);
      setPos({ r: nr, c: nc });
    },
    [k, s, oN]
  );

  const onDown = useCallback(
    (e) => {
      dragRef.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      moveToClient(e.clientX, e.clientY);
    },
    [moveToClient]
  );
  const onMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      moveToClient(e.clientX, e.clientY);
    },
    [moveToClient]
  );
  const onUp = useCallback((e) => {
    dragRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => {
    setK(KERNELS[kernelSize] ? kernelSize : 3);
    setS(clamp(stride, 1, 3));
    setPos({ r: 0, c: 0 });
  }, [kernelSize, stride]);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reduced ? 'none' : 'x 0.08s ease, y 0.08s ease';

  const winX = IN_X + topC * CELL;
  const winY = IN_Y + topR * CELL;
  const winW = k * CELL;

  const litX = OUT_X + cc * outCellPx;
  const litY = OUT_Y + cr * outCellPx;

  const outNorm = (v) => {
    const { mn, mx } = outMap;
    if (mx === mn) return 0.5;
    return (v - mn) / (mx - mn);
  };

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Grid3x3 size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Convolution kernel explorer</span>
          <span className="aev-head-sub">
            drag the window — the kernel multiplies, sums, and writes one output cell
          </span>
        </span>
        <span className="aev-chip">
          {cr},{cc} → {dot}
        </span>
      </div>

      <div className="aev-body cke-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB} ${VBH}`}
            className="aev-svg cke-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            <defs>
              <linearGradient id="cke-winglow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--hue-violet)" />
              </linearGradient>
              <filter id="cke-blur" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            {/* input grid */}
            <text x={IN_X} y={IN_Y - 6} className="cke-axis" fontSize="11">
              input {IN_N}×{IN_N}
            </text>
            {INPUT.map((row, i) =>
              row.map((v, j) => {
                const inWin =
                  i >= topR && i < topR + k && j >= topC && j < topC + k;
                return (
                  <g key={`in-${i}-${j}`}>
                    <rect
                      x={IN_X + j * CELL}
                      y={IN_Y + i * CELL}
                      width={CELL - 1}
                      height={CELL - 1}
                      rx="2"
                      fill={
                        inWin
                          ? 'color-mix(in srgb, var(--hue-sky) 28%, transparent)'
                          : 'var(--viz-card)'
                      }
                      stroke="var(--viz-line)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={IN_X + j * CELL + CELL / 2}
                      y={IN_Y + i * CELL + CELL / 2}
                      fontSize="11"
                      fill={inWin ? 'var(--text-main)' : 'var(--text-dim)'}
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {v}
                    </text>
                  </g>
                );
              })
            )}

            {/* sliding window glow + frame */}
            <rect
              x={winX}
              y={winY}
              width={winW}
              height={winW}
              rx="3"
              fill="none"
              stroke="url(#cke-winglow)"
              strokeWidth="6"
              filter="url(#cke-blur)"
              opacity="0.6"
              style={{ transition: trans }}
            />
            <rect
              x={winX}
              y={winY}
              width={winW}
              height={winW}
              rx="3"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              style={{ transition: trans, cursor: 'grab' }}
            />

            {/* connector */}
            <line
              x1={winX + winW}
              y1={winY + winW / 2}
              x2={litX}
              y2={litY + outCellPx / 2}
              stroke="var(--hue-violet)"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              opacity="0.7"
            />

            {/* kernel readout in the middle */}
            <text
              x={VB / 2}
              y={IN_Y - 6}
              className="cke-axis"
              fontSize="11"
              textAnchor="middle"
            >
              kernel {k}×{k} · Σ(in·w)
            </text>
            {products.map((row, i) =>
              row.map((cell, j) => {
                const px = VB / 2 - (k * 22) / 2 + j * 22;
                const py = IN_Y + 18 + i * 22;
                const isPos = cell.p > 0;
                const neg = cell.p < 0;
                return (
                  <g key={`pr-${i}-${j}`}>
                    <rect
                      x={px}
                      y={py}
                      width={20}
                      height={20}
                      rx="2"
                      fill={
                        isPos
                          ? 'color-mix(in srgb, var(--hue-mint) 22%, transparent)'
                          : neg
                            ? 'color-mix(in srgb, var(--hue-pink) 22%, transparent)'
                            : 'var(--viz-card)'
                      }
                      stroke="var(--viz-line)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={px + 10}
                      y={py + 10}
                      fontSize="8.5"
                      fill="var(--text-main)"
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {cell.p}
                    </text>
                  </g>
                );
              })
            )}
            <text
              x={VB / 2}
              y={IN_Y + 18 + k * 22 + 16}
              fontSize="13"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              fontWeight="700"
              textAnchor="middle"
            >
              dot = {dot}
            </text>

            {/* output feature map */}
            <text
              x={OUT_X}
              y={OUT_Y - 6}
              className="cke-axis"
              fontSize="11"
            >
              output {oN}×{oN}
            </text>
            {outMap.m.map((row, i) =>
              row.map((v, j) => {
                const lit = i === cr && j === cc;
                const t = outNorm(v);
                return (
                  <g key={`out-${i}-${j}`}>
                    <rect
                      x={OUT_X + j * outCellPx}
                      y={OUT_Y + i * outCellPx}
                      width={outCellPx - 1}
                      height={outCellPx - 1}
                      rx="2"
                      fill={`color-mix(in srgb, var(--hue-violet) ${Math.round(
                        12 + t * 70
                      )}%, var(--viz-card))`}
                      stroke={lit ? 'var(--accent)' : 'var(--viz-line)'}
                      strokeWidth={lit ? 2 : 0.5}
                      style={{ transition: reduced ? 'none' : 'fill 0.15s' }}
                    />
                    {lit && (
                      <text
                        x={OUT_X + j * outCellPx + outCellPx / 2}
                        y={OUT_Y + i * outCellPx + outCellPx / 2}
                        fontSize="10"
                        fill="var(--text-main)"
                        fontFamily="var(--mono)"
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {v}
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>

        <div className="mlviz-statcol cke-cards">
          <div className="mlviz-statcard mlviz-statcard-sky">
            <span className="mlviz-statcard-label">window pos</span>
            <span className="mlviz-statcard-val">
              r{cr} c{cc}
            </span>
            <span className="mlviz-statcard-sub">top-left {topR},{topC}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">dot product</span>
            <span className="mlviz-statcard-val">{dot}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">output size</span>
            <span className="mlviz-statcard-val">
              {oN}×{oN}
            </span>
            <span className="mlviz-statcard-sub">⌊(8−{k})/{s}⌋+1</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">kernel</span>
          <input
            type="range"
            min={0}
            max={1}
            step={1}
            value={k === 3 ? 0 : 1}
            onChange={(e) => {
              const nk = e.target.value === '0' ? 3 : 5;
              setK(nk);
              setPos({ r: 0, c: 0 });
            }}
          />
          <span className="mlviz-slider-val">{k}×{k}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">stride</span>
          <input
            type="range"
            min={1}
            max={3}
            step={1}
            value={s}
            onChange={(e) => {
              setS(parseInt(e.target.value, 10));
              setPos({ r: 0, c: 0 });
            }}
          />
          <span className="mlviz-slider-val">{s}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          green products push the cell up · pink products pull it down · larger stride skips positions and shrinks the map
        </div>
      </div>
    </div>
  );
}
