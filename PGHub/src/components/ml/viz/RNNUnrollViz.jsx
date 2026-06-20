import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, SkipForward } from 'lucide-react';
import './MLViz.css';

/* RNN unrolled across time.
   - 5 cells drawn left-to-right with labels t=0..t=4
   - Each cell has input x_t coming up from below, hidden state h_t leaving the top
   - Horizontal arrows carry h_t into the next cell as h_{t-1}
   - The currently-selected timestep is highlighted in the accent colour
   - Each cell renders its hidden state as a small 3-component bar chart */

const W = 760;
const H = 360;
const STEPS = 5;
const DIM = 3;
const TOKENS = ['the', 'cat', 'sat', 'on', 'mat'];

function seedHash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function srand(seed, j) {
  const x = Math.sin((seed ^ (j * 374761393)) >>> 0) * 43758.5453;
  return x - Math.floor(x);
}
function xForToken(token) {
  const s = seedHash(`x:${token}`);
  const out = [];
  for (let j = 0; j < DIM; j++) out.push((srand(s, j) * 2 - 1) * 1.4);
  return out;
}
function tanh(z) { return Math.tanh(z); }

/* Deterministic shared "weights": one W_h matrix (DIM x DIM) and one W_x matrix
   (DIM x DIM) plus a bias, derived from a fixed seed so the unrolled trajectory
   is reproducible. Real weights would be learned. */
const W_SEED = seedHash('rnn-weights-v1');
const W_h = (() => {
  const m = [];
  for (let i = 0; i < DIM; i++) {
    const row = [];
    for (let j = 0; j < DIM; j++) row.push((srand(W_SEED, i * DIM + j) * 2 - 1) * 0.55);
    m.push(row);
  }
  return m;
})();
const W_x = (() => {
  const m = [];
  for (let i = 0; i < DIM; i++) {
    const row = [];
    for (let j = 0; j < DIM; j++) row.push((srand(W_SEED + 31, i * DIM + j) * 2 - 1) * 0.7);
    m.push(row);
  }
  return m;
})();
const B = (() => {
  const v = [];
  for (let j = 0; j < DIM; j++) v.push((srand(W_SEED + 97, j) * 2 - 1) * 0.15);
  return v;
})();

function stepRNN(hPrev, x) {
  const out = new Array(DIM).fill(0);
  for (let i = 0; i < DIM; i++) {
    let s = B[i];
    for (let j = 0; j < DIM; j++) s += W_h[i][j] * hPrev[j];
    for (let j = 0; j < DIM; j++) s += W_x[i][j] * x[j];
    out[i] = tanh(s);
  }
  return out;
}

/* Walk the whole sequence once so each cell knows its own hidden state.
   Index 0 in the returned array is h_0 (state after consuming the first token). */
function unroll() {
  const states = [];
  let h = new Array(DIM).fill(0);
  for (let t = 0; t < STEPS; t++) {
    h = stepRNN(h, xForToken(TOKENS[t]));
    states.push(h);
  }
  return states;
}

function MiniBars({ x, y, w, h, values, color, range = 1.1 }) {
  const bw = w / values.length;
  const cy = y + h / 2;
  return (
    <g>
      <line x1={x + 2} y1={cy} x2={x + w - 2} y2={cy}
            stroke="var(--border)" strokeWidth={0.6} strokeDasharray="2 3" />
      {values.map((v, j) => {
        const half = (h / 2) - 3;
        const vc = Math.max(-range, Math.min(range, v));
        const bh = Math.abs(vc) / range * half;
        const bx = x + j * bw + 2;
        const by = vc >= 0 ? cy - bh : cy;
        return (
          <rect key={j} x={bx} y={by} width={bw - 4} height={Math.max(1.2, bh)}
                rx={1.2} fill={color} opacity={0.9} />
        );
      })}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color, active }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={active ? color : 'var(--text-dim)'}
          strokeWidth={active ? 2 : 1.1}
          opacity={active ? 1 : 0.55}
          markerEnd="url(#rnn-arrow)" />
  );
}

export default function RNNUnrollViz() {
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const states = useMemo(() => unroll(), []);
  const xs = useMemo(() => TOKENS.map(xForToken), []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleStep = useCallback(() => {
    setT((cur) => (cur + 1) % STEPS);
  }, []);

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(false);
    setT(0);
  }, []);

  const handleRun = useCallback(() => {
    if (running) return;
    setRunning(true);
    setT(0);
    let cur = 0;
    const tick = () => {
      cur += 1;
      if (cur >= STEPS) {
        setRunning(false);
        return;
      }
      setT(cur);
      timerRef.current = setTimeout(tick, 650);
    };
    timerRef.current = setTimeout(tick, 650);
  }, [running]);

  // Layout
  const padX = 40;
  const padY = 40;
  const cellW = 102;
  const cellH = 92;
  const gap = (W - padX * 2 - cellW * STEPS) / (STEPS - 1);
  const cellY = padY + 80;

  const cellX = (k) => padX + k * (cellW + gap);

  const accentRGB = 'rgba(var(--accent-rgb, 0, 255, 245), 0.18)';
  const hiddenColor = 'var(--hue-violet, #b08bff)';
  const inputColor = 'var(--accent)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg"
             style={{ maxWidth: 780, aspectRatio: `${W} / ${H}` }}>
          <defs>
            <marker id="rnn-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {/* Side labels */}
          <text x={12} y={20} fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)" letterSpacing="0.14em">
            RNN UNROLLED — SHARED WEIGHTS ACROSS TIME
          </text>
          <text x={W - 12} y={20} fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)" textAnchor="end" letterSpacing="0.14em">
            dim = {DIM}
          </text>

          {/* Top hidden-state rail label */}
          <text x={padX} y={padY + 12} fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill={hiddenColor} letterSpacing="0.12em">
            HIDDEN STATE h_t
          </text>

          {/* h_0 = 0 pill on the left, feeding the first cell */}
          <g>
            <rect x={padX - 28} y={cellY + cellH / 2 - 14}
                  width={28} height={28} rx={14}
                  fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
            <text x={padX - 14} y={cellY + cellH / 2 + 4}
                  textAnchor="middle" fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)">
              0
            </text>
          </g>

          {/* Cells + arrows */}
          {Array.from({ length: STEPS }).map((_, k) => {
            const cx = cellX(k);
            const isCur = k === t;
            const isPast = k < t;
            const hVals = states[k];
            const tokY = cellY + cellH + 78;
            const stateColor = hiddenColor;

            return (
              <g key={k}>
                {/* horizontal arrow into this cell (h_{t-1}) */}
                {k > 0 && (
                  <Arrow
                    x1={cellX(k - 1) + cellW + 4}
                    y1={cellY + cellH / 2}
                    x2={cx - 4}
                    y2={cellY + cellH / 2}
                    color={hiddenColor}
                    active={k <= t}
                  />
                )}
                {/* arrow from h_0 pill into the first cell */}
                {k === 0 && (
                  <Arrow
                    x1={padX}
                    y1={cellY + cellH / 2}
                    x2={cx - 4}
                    y2={cellY + cellH / 2}
                    color={hiddenColor}
                    active={t >= 0}
                  />
                )}

                {/* input arrow x_t coming up into the cell */}
                <Arrow
                  x1={cx + cellW / 2}
                  y1={cellY + cellH + 44}
                  x2={cx + cellW / 2}
                  y2={cellY + cellH + 4}
                  color={inputColor}
                  active={k <= t}
                />

                {/* hidden-state output arrow going up out of the cell */}
                <Arrow
                  x1={cx + cellW / 2}
                  y1={cellY - 4}
                  x2={cx + cellW / 2}
                  y2={cellY - 40}
                  color={hiddenColor}
                  active={k <= t}
                />

                {/* cell box */}
                <rect
                  x={cx}
                  y={cellY}
                  width={cellW}
                  height={cellH}
                  rx={12}
                  fill={isCur ? accentRGB : 'var(--surface)'}
                  stroke={isCur ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isCur ? 2 : 1.2}
                  opacity={isPast ? 0.85 : 1}
                />

                {/* RNN label */}
                <text
                  x={cx + cellW / 2}
                  y={cellY + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill={isCur ? 'var(--accent)' : 'var(--text-dim)'}
                  letterSpacing="0.14em"
                >
                  RNN
                </text>

                {/* timestep label */}
                <text
                  x={cx + cellW / 2}
                  y={cellY - 50}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight="700"
                  fill={isCur ? 'var(--accent)' : 'var(--text-dim)'}
                >
                  {`t=${k}`}
                </text>

                {/* h_t label above arrow */}
                <text
                  x={cx + cellW / 2 + 8}
                  y={cellY - 22}
                  fontSize="10"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight="700"
                  fill={isCur ? 'var(--accent)' : hiddenColor}
                >
                  {`h_${k}`}
                </text>

                {/* mini bar chart of hidden state inside the cell */}
                <MiniBars
                  x={cx + 10}
                  y={cellY + 26}
                  w={cellW - 20}
                  h={cellH - 36}
                  values={hVals}
                  color={isCur ? 'var(--accent)' : stateColor}
                />

                {/* x_t label below the cell */}
                <text
                  x={cx + cellW / 2 + 8}
                  y={cellY + cellH + 30}
                  fontSize="10"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight="700"
                  fill={inputColor}
                >
                  {`x_${k}`}
                </text>

                {/* token pill */}
                <rect
                  x={cx + 12}
                  y={tokY - 14}
                  width={cellW - 24}
                  height={26}
                  rx={6}
                  fill={isCur ? accentRGB : 'var(--bg)'}
                  stroke={isCur ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isCur ? 1.6 : 1}
                  opacity={isPast ? 0.65 : 1}
                />
                <text
                  x={cx + cellW / 2}
                  y={tokY + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight="700"
                  fill={isCur ? 'var(--accent)' : 'var(--text-main)'}
                >
                  {TOKENS[k]}
                </text>
              </g>
            );
          })}

          {/* Trailing h_T arrow exit on the right */}
          <Arrow
            x1={cellX(STEPS - 1) + cellW + 4}
            y1={cellY + cellH / 2}
            x2={cellX(STEPS - 1) + cellW + 30}
            y2={cellY + cellH / 2}
            color={hiddenColor}
            active={t === STEPS - 1}
          />
          <text
            x={cellX(STEPS - 1) + cellW + 34}
            y={cellY + cellH / 2 + 4}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
          >
            out
          </text>

          {/* footer: shared-weights caption */}
          <g>
            <rect x={padX} y={H - 30} width={W - padX * 2} height={22} rx={6}
                  fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
            <text x={padX + 10} y={H - 14} fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--accent)" letterSpacing="0.12em">
              SHARED
            </text>
            <text x={padX + 70} y={H - 14} fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-main)">
              W_h, W_x, b reused at every step  —  h_t = tanh(W_h h_{`{t-1}`} + W_x x_t + b)
            </text>
            <text x={W - padX - 10} y={H - 14} fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)" textAnchor="end">
              {`t = ${t} / ${STEPS - 1}`}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>step</span>
          <span className="mlviz-val">{`t = ${t}  (token "${TOKENS[t]}")`}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: hiddenColor }}>{`h_${t}`}</span>
          <span className="mlviz-val">
            [{states[t].map((v) => v.toFixed(3)).join(', ')}]
          </span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: inputColor }}>{`x_${t}`}</span>
          <span className="mlviz-val">
            [{xs[t].map((v) => v.toFixed(3)).join(', ')}]
          </span>
        </div>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{
            color: 'var(--text-dim)', fontFamily: 'var(--mono)',
            fontStyle: 'normal', fontSize: '0.72rem', letterSpacing: '0.12em',
          }}>
            TIMESTEP
          </span>
          <input
            type="range"
            min={0}
            max={STEPS - 1}
            step={1}
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            disabled={running}
            style={{ flex: 1, minWidth: 0, accentColor: 'var(--accent)' }}
          />
          <span className="mlviz-val" style={{ minWidth: 32, textAlign: 'right' }}>
            {t}
          </span>
        </div>
        <div className="mlviz-row mlviz-btn-row">
          <button type="button"
                  className="mlviz-btn mlviz-btn-primary"
                  onClick={handleStep}
                  disabled={running}>
            <SkipForward size={13} />
            <span>Step</span>
          </button>
          <button type="button"
                  className="mlviz-btn"
                  onClick={handleRun}
                  disabled={running}>
            <Play size={13} />
            <span>Run</span>
          </button>
          <button type="button"
                  className="mlviz-btn"
                  onClick={handleReset}
                  disabled={running}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
        <div className="mlviz-hint">
          one cell, applied five times. drag the slider or step through to watch the
          hidden state thread left-to-right while the input token enters from below.
        </div>
      </div>
    </div>
  );
}
