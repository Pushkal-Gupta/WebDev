import React, { useCallback, useMemo, useRef, useState } from 'react';
import { BarChart3, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 320;
const LEFT = 40;
const RIGHT = 18;
const TOP = 28;
const BOT = 54;
const PLOT_W = W - LEFT - RIGHT;
const PLOT_H = H - TOP - BOT;
const AXIS_Y = TOP + PLOT_H;

const SYMBOLS = ['A', 'B', 'C', 'D', 'E'];
const HUES = ['var(--hue-pink)', 'var(--hue-sky)', 'var(--hue-violet)', 'var(--hue-mint)', 'var(--accent)'];
const STATCARD = ['mlviz-statcard-pink', 'mlviz-statcard-sky', 'mlviz-statcard-violet', 'mlviz-statcard-mint', 'mlviz-statcard-accent'];
const N = SYMBOLS.length;

const DEF = [0.45, 0.25, 0.15, 0.1, 0.05];

function fmt(v, p = 3) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

function normalize(arr) {
  const s = arr.reduce((a, b) => a + b, 0);
  if (s <= 0) return arr.map(() => 1 / arr.length);
  return arr.map((v) => v / s);
}

export default function EntropyExplorerViz() {
  const [weights, setWeights] = useState(DEF);
  const [dragIdx, setDragIdx] = useState(null);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const reset = useCallback(() => setWeights(DEF), []);
  const setUniform = useCallback(() => setWeights(Array(N).fill(1 / N)), []);

  const p = useMemo(() => normalize(weights), [weights]);

  const contrib = p.map((pi) => (pi > 0 ? -pi * Math.log2(pi) : 0));
  const entropy = contrib.reduce((a, b) => a + b, 0);
  const maxEntropy = Math.log2(N);
  const maxIdx = contrib.reduce((best, c, i) => (c > contrib[best] ? i : best), 0);

  const barW = PLOT_W / N;
  const innerW = barW * 0.56;

  const updateDrag = useCallback((clientY) => {
    const svg = svgRef.current;
    if (!svg || dragRef.current === null) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientY - rect.top) / rect.height;
    const svgY = ratio * H;
    let frac = (AXIS_Y - svgY) / PLOT_H;
    frac = Math.max(0.01, Math.min(1, frac));
    setWeights((arr) => {
      const next = arr.slice();
      next[dragRef.current] = frac;
      return next;
    });
  }, []);

  const onDown = useCallback(
    (i) => (e) => {
      dragRef.current = i;
      setDragIdx(i);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateDrag(e.clientY);
    },
    [updateDrag]
  );
  const onMove = useCallback(
    (e) => {
      if (dragRef.current === null) return;
      updateDrag(e.clientY);
    },
    [updateDrag]
  );
  const onUp = useCallback((e) => {
    dragRef.current = null;
    setDragIdx(null);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'height 0.1s ease, y 0.1s ease';

  // entropy meter (bottom): how close to max
  const meterFrac = maxEntropy > 0 ? entropy / maxEntropy : 0;

  return (
    <div className="mlviz-wrap aev-wrap entx-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <BarChart3 size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Entropy explorer</span>
          <span className="aev-head-sub">
            drag the probability bars — H(p) = −Σ p·log₂ p peaks when the distribution is uniform
          </span>
        </span>
        <span className="aev-chip">H = {fmt(entropy, 2)} bits</span>
      </div>

      <div className="aev-body entx-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg entx-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            <defs>
              <filter id="entx-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.8" />
              </filter>
            </defs>

            {/* baseline */}
            <line x1={LEFT} y1={AXIS_Y} x2={LEFT + PLOT_W} y2={AXIS_Y} stroke="var(--border)" strokeWidth="1" />

            {/* uniform reference line (p = 1/N) */}
            <line
              x1={LEFT}
              y1={AXIS_Y - (1 / N) * PLOT_H}
              x2={LEFT + PLOT_W}
              y2={AXIS_Y - (1 / N) * PLOT_H}
              stroke="var(--text-dim)"
              strokeWidth="0.8"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            <text x={LEFT + 2} y={AXIS_Y - (1 / N) * PLOT_H - 4} fontSize="7.4" fill="var(--text-dim)" fontFamily="var(--mono)">
              uniform p = {fmt(1 / N, 2)}
            </text>

            {/* y ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <text key={`yt-${t}`} x={LEFT - 6} y={AXIS_Y - t * PLOT_H + 3} fontSize="7.6" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
                {t.toFixed(2)}
              </text>
            ))}

            {p.map((pi, i) => {
              const cx = LEFT + barW * i + barW / 2;
              const h = pi * PLOT_H;
              const y = AXIS_Y - h;
              const cFrac = entropy > 0 ? contrib[i] / entropy : 0;
              const isMax = i === maxIdx;
              return (
                <g key={`bar-${i}`}>
                  {/* probability bar */}
                  <rect
                    x={cx - innerW / 2}
                    y={y}
                    width={innerW}
                    height={h}
                    rx="4"
                    fill={HUES[i]}
                    opacity="0.85"
                    filter={isMax ? 'url(#entx-glow)' : undefined}
                    style={{ transition: dragIdx === i ? 'none' : trans, cursor: 'ns-resize' }}
                    onPointerDown={onDown(i)}
                  />
                  {/* contribution overlay (−p log p), scaled to its own share of total height) */}
                  <rect
                    x={cx - innerW / 2}
                    y={y}
                    width={innerW}
                    height={Math.min(h, cFrac * h)}
                    rx="4"
                    fill="var(--surface)"
                    opacity="0.18"
                    pointerEvents="none"
                  />
                  {/* drag handle cap */}
                  <circle cx={cx} cy={y} r="4.5" fill={HUES[i]} stroke="var(--surface)" strokeWidth="1" style={{ cursor: 'ns-resize' }} onPointerDown={onDown(i)} />

                  {/* symbol label */}
                  <text x={cx} y={AXIS_Y + 14} fontSize="10" fill={HUES[i]} fontFamily="var(--mono)" fontWeight="700" textAnchor="middle">
                    {SYMBOLS[i]}
                  </text>
                  <text x={cx} y={AXIS_Y + 26} fontSize="8" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="middle">
                    p={fmt(pi, 2)}
                  </text>
                  <text x={cx} y={AXIS_Y + 37} fontSize="7.4" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                    {fmt(contrib[i], 2)} b
                  </text>
                </g>
              );
            })}

            {/* entropy meter top-right */}
            <text x={LEFT + PLOT_W} y={TOP - 12} fontSize="8.6" fill="var(--accent)" fontFamily="var(--mono)" fontWeight="700" textAnchor="end">
              H = {fmt(entropy, 3)} / {fmt(maxEntropy, 2)} bits
            </text>
            <rect x={LEFT + PLOT_W - 130} y={TOP - 8} width="130" height="5" rx="2.5" fill="var(--viz-card)" stroke="var(--viz-line)" strokeWidth="0.6" />
            <rect x={LEFT + PLOT_W - 130} y={TOP - 8} width={130 * meterFrac} height="5" rx="2.5" fill="var(--accent)" style={{ transition: trans }} />
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards entx-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">entropy</span>
            <span className="mlviz-statcard-val">{fmt(entropy, 2)}</span>
            <span className="mlviz-statcard-sub">bits</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">max entropy</span>
            <span className="mlviz-statcard-val">{fmt(maxEntropy, 2)}</span>
            <span className="mlviz-statcard-sub">log₂({N}) uniform</span>
          </div>
          <div className={`mlviz-statcard ${STATCARD[maxIdx]}`}>
            <span className="mlviz-statcard-label">top contributor</span>
            <span className="mlviz-statcard-val">{SYMBOLS[maxIdx]}</span>
            <span className="mlviz-statcard-sub">{fmt(contrib[maxIdx], 2)} bits</span>
          </div>
          <div className="aev-expr">H = −Σ pᵢ log₂ pᵢ</div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={setUniform}>
            <span>Make uniform (max H)</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          drag any bar up or down · probabilities auto-renormalize · the shaded cap shows each symbol's bit contribution
        </div>
      </div>
    </div>
  );
}
