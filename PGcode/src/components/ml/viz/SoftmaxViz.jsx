import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 380;
const H = 320;
const PAD_L = 30;
const PAD_R = 16;
const PAD_T = 24;
const PAD_B = 24;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const ROW_GAP = 18;
const ROW_H = (PLOT_H - ROW_GAP) / 2;
const TOP_Y = PAD_T;
const BOT_Y = PAD_T + ROW_H + ROW_GAP;

const N = 5;
const BAR_GAP = 10;
const BAR_W = (PLOT_W - BAR_GAP * (N - 1)) / N;

const Z_MIN = -3;
const Z_MAX = 5;

const DEFAULT_Z = [1.0, 2.0, 0.5, 3.2, 0.8];
const DEFAULT_T = 1.0;

const BAR_COLOR_TOP = 'var(--hue-sky, #5ecbff)';
const BAR_COLOR_BOT = 'var(--accent)';

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function softmax(zs, tau) {
  const t = Math.max(0.0001, tau);
  const scaled = zs.map((z) => z / t);
  const maxZ = Math.max(...scaled);
  const exps = scaled.map((z) => Math.exp(z - maxZ));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

function barX(i) {
  return PAD_L + i * (BAR_W + BAR_GAP);
}

export default function SoftmaxViz() {
  const svgRef = useRef(null);
  const [zs, setZs] = useState(DEFAULT_Z);
  const [tau, setTau] = useState(DEFAULT_T);
  const [dragIdx, setDragIdx] = useState(null);

  const probs = useMemo(() => softmax(zs, tau), [zs, tau]);
  const sumProbs = probs.reduce((a, b) => a + b, 0);

  const updateZ = useCallback((i, v) => {
    setZs((prev) => {
      const next = [...prev];
      next[i] = Math.max(Z_MIN, Math.min(Z_MAX, v));
      return next;
    });
  }, []);

  const handleMove = useCallback((e) => {
    if (dragIdx == null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const sy = (clientY - rect.top) * (H / rect.height);
    // Top row baseline y = TOP_Y + ROW_H; map sy ∈ [TOP_Y, TOP_Y + ROW_H] → z ∈ [Z_MAX, Z_MIN]
    const t = (TOP_Y + ROW_H - sy) / ROW_H;
    const z = Z_MIN + t * (Z_MAX - Z_MIN);
    updateZ(dragIdx, snap(z, 1));
  }, [dragIdx, updateZ]);

  useEffect(() => {
    if (dragIdx == null) return;
    const up = () => setDragIdx(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [dragIdx, handleMove]);

  const handleReset = useCallback(() => {
    setZs(DEFAULT_Z);
    setTau(DEFAULT_T);
  }, []);

  const handleSharpen = useCallback(() => setTau(0.3), []);
  const handleFlatten = useCallback(() => setTau(3.0), []);

  const topBaseY = TOP_Y + ROW_H;
  const botBaseY = BOT_Y + ROW_H;

  // Top row: z spans full range; bar grows from baseline at z=0 upward.
  // We map z ∈ [Z_MIN, Z_MAX] → screen y. Baseline at z=0.
  const zeroY = TOP_Y + ROW_H * (Z_MAX / (Z_MAX - Z_MIN));
  function zToY(z) {
    return TOP_Y + (1 - (z - Z_MIN) / (Z_MAX - Z_MIN)) * ROW_H;
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          {/* row separators / baselines */}
          <line
            x1={PAD_L}
            y1={zeroY}
            x2={W - PAD_R}
            y2={zeroY}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1={PAD_L}
            y1={botBaseY}
            x2={W - PAD_R}
            y2={botBaseY}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* row labels */}
          <text
            x={PAD_L - 4}
            y={TOP_Y + 2}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="start"
            letterSpacing="0.12em"
          >
            LOGITS z
          </text>
          <text
            x={PAD_L - 4}
            y={BOT_Y + 2}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="start"
            letterSpacing="0.12em"
          >
            SOFTMAX p
          </text>

          {/* Top row: logits as bars (bidirectional from z=0). */}
          {zs.map((z, i) => {
            const x = barX(i);
            const y0 = zeroY;
            const yz = zToY(z);
            const top = Math.min(y0, yz);
            const h = Math.abs(y0 - yz);
            const isPos = z >= 0;
            const labelY = isPos ? top - 6 : top + h + 12;
            return (
              <g key={`z${i}`}>
                <rect
                  x={x}
                  y={top}
                  width={BAR_W}
                  height={Math.max(0.5, h)}
                  fill={BAR_COLOR_TOP}
                  opacity={dragIdx === i ? 0.95 : 0.78}
                  rx="2"
                />
                {/* drag handle covers the whole row column for easier grabbing */}
                <rect
                  x={x}
                  y={TOP_Y}
                  width={BAR_W}
                  height={ROW_H}
                  fill="transparent"
                  style={{ cursor: dragIdx === i ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => { e.preventDefault(); setDragIdx(i); }}
                  onTouchStart={(e) => { e.preventDefault(); setDragIdx(i); }}
                />
                <text
                  x={x + BAR_W / 2}
                  y={labelY}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {snap(z, 2).toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* arrow between rows showing transformation */}
          <g opacity="0.55">
            <line
              x1={W / 2}
              y1={topBaseY + 2}
              x2={W / 2}
              y2={BOT_Y - 4}
              stroke="var(--text-dim)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={W / 2 + 6}
              y={topBaseY + (BOT_Y - topBaseY) / 2 + 3}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              letterSpacing="0.1em"
            >
              softmax(z/τ)
            </text>
          </g>

          {/* Bottom row: probabilities, scaled from baseline upward to fit ROW_H. */}
          {probs.map((p, i) => {
            const x = barX(i);
            const h = p * ROW_H;
            const y = botBaseY - h;
            return (
              <g key={`p${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={Math.max(0.5, h)}
                  fill={BAR_COLOR_BOT}
                  opacity="0.85"
                  rx="2"
                />
                <text
                  x={x + BAR_W / 2}
                  y={y - 6}
                  fontSize="10"
                  fill="var(--accent)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {p.toFixed(2)}
                </text>
                <text
                  x={x + BAR_W / 2}
                  y={botBaseY + 14}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  textAnchor="middle"
                >
                  {`p${i + 1}`}
                </text>
              </g>
            );
          })}

          {/* sum readout (top-right) */}
          <text
            x={W - PAD_R}
            y={TOP_Y - 8}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
            letterSpacing="0.1em"
          >
            {`Σ p = ${sumProbs.toFixed(2)}`}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">temperature τ</span>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={tau}
              onChange={(e) => setTau(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(tau, 2).toFixed(2)}</span>
          </label>
        </div>

        {zs.map((z, i) => (
          <div className="mlviz-row" key={`zr${i}`}>
            <span className="mlviz-tag" style={{ color: BAR_COLOR_TOP }}>{`z${i + 1}`}</span>
            <input
              type="range"
              min={Z_MIN}
              max={Z_MAX}
              step="0.1"
              value={z}
              onChange={(e) => updateZ(i, parseFloat(e.target.value))}
              style={{ flex: 1, minWidth: 80, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span className="mlviz-val" style={{ minWidth: '2.8rem', textAlign: 'right' }}>
              {snap(z, 2).toFixed(2)}
            </span>
            <span className="mlviz-sub" style={{ minWidth: '3.6rem', textAlign: 'right' }}>
              {`p = ${probs[i].toFixed(2)}`}
            </span>
          </div>
        ))}

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag">Σ p</span>
          <span className="mlviz-val">{sumProbs.toFixed(2)}</span>
          <span className="mlviz-sub">probabilities sum to 1</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleSharpen}
          >
            <span>Sharpen (τ=0.3)</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleFlatten}
          >
            <span>Flatten (τ=3.0)</span>
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

        <div className="mlviz-hint">drag bars or use sliders</div>
      </div>
    </div>
  );
}
