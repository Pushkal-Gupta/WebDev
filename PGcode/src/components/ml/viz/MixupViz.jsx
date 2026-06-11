import React, { useMemo, useState } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const LEFT_PAD = 40;
const TOP_PAD = 36;
const BOT_PAD = 36;
const PANEL_W = (W - LEFT_PAD * 2) / 2;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// log-gamma via Stirling for Beta-PDF normaliser (alpha used in (0.05, 4])
function logGamma(z) {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1395167222370,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaPdf(x, a, b) {
  if (x <= 0 || x >= 1) return 0;
  const log =
    (a - 1) * Math.log(x) +
    (b - 1) * Math.log(1 - x) +
    logGamma(a + b) -
    logGamma(a) -
    logGamma(b);
  return Math.exp(log);
}

function genPoints(seed) {
  const rand = mulberry32(seed);
  // class A: red triangles, lower-left cluster
  // class B: blue circles, upper-right cluster
  const A = [];
  const B = [];
  for (let i = 0; i < 6; i++) {
    A.push([0.22 + rand() * 0.22, 0.22 + rand() * 0.22]);
    B.push([0.58 + rand() * 0.22, 0.58 + rand() * 0.22]);
  }
  return { A, B };
}

export default function MixupViz() {
  const [lambda, setLambda] = useState(0.5);
  const [alpha, setAlpha] = useState(0.4);
  const [seed, setSeed] = useState(7);

  const { A, B } = useMemo(() => genPoints(seed), [seed]);

  // pair index for the active mix demo
  const [pairIdx, setPairIdx] = useState(0);
  const pa = A[pairIdx % A.length];
  const pb = B[pairIdx % B.length];
  // synthetic point
  const sx = lambda * pa[0] + (1 - lambda) * pb[0];
  const sy = lambda * pa[1] + (1 - lambda) * pb[1];

  // === Left panel: 2D class scatter w/ mix line ===
  const lx0 = LEFT_PAD;
  const ly0 = TOP_PAD;
  const lw = PANEL_W;
  const lh = H - TOP_PAD - BOT_PAD;
  const toX = (u) => lx0 + u * lw;
  const toY = (v) => ly0 + (1 - v) * lh;

  // === Right panel: Beta PDF ===
  const rx0 = LEFT_PAD + PANEL_W + LEFT_PAD;
  const ry0 = TOP_PAD;
  const rw = PANEL_W;
  const rh = H - TOP_PAD - BOT_PAD;

  const pdfPath = useMemo(() => {
    const N = 80;
    const samples = [];
    let maxY = 0;
    for (let i = 0; i <= N; i++) {
      const u = (i + 0.5) / (N + 1); // avoid 0/1 endpoints
      const y = betaPdf(u, alpha, alpha);
      samples.push([u, y]);
      if (y > maxY && Number.isFinite(y)) maxY = y;
    }
    // clip very tall PDFs (when alpha < 0.5) for a stable viewport
    const cap = Math.min(maxY, 6);
    const pts = samples.map(([u, y]) => {
      const x = rx0 + u * rw;
      const yPlot = ry0 + (1 - Math.min(y, cap) / cap) * rh;
      return [x, yPlot];
    });
    return {
      d: pts.map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`)).join(' '),
      cap,
    };
  }, [alpha, rx0, ry0, rw, rh]);

  const lambdaMarkerX = rx0 + lambda * rw;
  const pdfAtLambda = betaPdf(lambda, alpha, alpha);
  const lambdaMarkerY = ry0 + (1 - Math.min(pdfAtLambda, pdfPath.cap) / pdfPath.cap) * rh;

  const mixOpacity = 0.35 + 0.55 * lambda;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '620px' }}>
          {/* ---- LEFT PANEL: 2D mix ---- */}
          <g>
            {/* frame */}
            <rect
              x={lx0}
              y={ly0}
              width={lw}
              height={lh}
              fill="rgba(var(--accent-rgb), 0.03)"
              stroke="var(--border)"
              strokeWidth="0.6"
              rx="6"
            />
            <text
              x={lx0}
              y={ly0 - 14}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              letterSpacing="0.12em"
            >
              CLASS SCATTER · feature plane
            </text>

            {/* class A points: triangles */}
            {A.map(([u, v], i) => {
              const cx = toX(u);
              const cy = toY(v);
              const r = i === pairIdx ? 7 : 5;
              const stroke = i === pairIdx ? 'var(--accent)' : 'var(--hue-pink)';
              return (
                <polygon
                  key={`a${i}`}
                  points={`${cx},${cy - r} ${cx - r},${cy + r * 0.7} ${cx + r},${cy + r * 0.7}`}
                  fill="var(--hue-pink)"
                  fillOpacity="0.55"
                  stroke={stroke}
                  strokeWidth={i === pairIdx ? 1.8 : 1}
                />
              );
            })}

            {/* class B points: circles */}
            {B.map(([u, v], i) => {
              const cx = toX(u);
              const cy = toY(v);
              const r = i === pairIdx ? 6 : 4.5;
              const stroke = i === pairIdx ? 'var(--accent)' : 'var(--hue-sky)';
              return (
                <circle
                  key={`b${i}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="var(--hue-sky)"
                  fillOpacity="0.55"
                  stroke={stroke}
                  strokeWidth={i === pairIdx ? 1.8 : 1}
                />
              );
            })}

            {/* mix line */}
            <line
              x1={toX(pa[0])}
              y1={toY(pa[1])}
              x2={toX(pb[0])}
              y2={toY(pb[1])}
              stroke="var(--accent)"
              strokeWidth="1.3"
              strokeDasharray="3 3"
              opacity="0.8"
            />

            {/* synthetic mixed point */}
            <g>
              <circle
                cx={toX(sx)}
                cy={toY(sy)}
                r={9}
                fill="var(--accent)"
                fillOpacity={mixOpacity}
                stroke="var(--accent)"
                strokeWidth="1.8"
              />
              <text
                x={toX(sx)}
                y={toY(sy) - 14}
                fontSize="8"
                fill="var(--accent)"
                fontFamily="var(--mono)"
                textAnchor="middle"
                fontWeight="700"
              >
                x̃
              </text>
            </g>

            {/* legend */}
            <g transform={`translate(${lx0 + 6}, ${ly0 + lh - 30})`}>
              <polygon
                points="0,-4 -4,3 4,3"
                fill="var(--hue-pink)"
                fillOpacity="0.55"
                stroke="var(--hue-pink)"
                strokeWidth="0.9"
              />
              <text x={9} y={3} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
                class A
              </text>
              <circle
                cx={0}
                cy={14}
                r={3.5}
                fill="var(--hue-sky)"
                fillOpacity="0.55"
                stroke="var(--hue-sky)"
                strokeWidth="0.9"
              />
              <text x={9} y={17} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
                class B
              </text>
            </g>
          </g>

          {/* ---- RIGHT PANEL: Beta(α, α) PDF ---- */}
          <g>
            <rect
              x={rx0}
              y={ry0}
              width={rw}
              height={rh}
              fill="rgba(var(--accent-rgb), 0.03)"
              stroke="var(--border)"
              strokeWidth="0.6"
              rx="6"
            />
            <text
              x={rx0}
              y={ry0 - 14}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              letterSpacing="0.12em"
            >
              λ ~ Beta(α, α) · sampling PDF
            </text>

            {/* x-axis ticks at 0, 0.5, 1 */}
            {[0, 0.5, 1].map((tx) => (
              <g key={`tx-${tx}`}>
                <line
                  x1={rx0 + tx * rw}
                  y1={ry0 + rh}
                  x2={rx0 + tx * rw}
                  y2={ry0 + rh + 4}
                  stroke="var(--border)"
                  strokeWidth="0.6"
                />
                <text
                  x={rx0 + tx * rw}
                  y={ry0 + rh + 14}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                >
                  {tx}
                </text>
              </g>
            ))}

            {/* PDF curve */}
            <path
              d={pdfPath.d}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.8"
            />

            {/* fill under curve */}
            <path
              d={`${pdfPath.d} L${rx0 + rw} ${ry0 + rh} L${rx0} ${ry0 + rh} Z`}
              fill="rgba(var(--accent-rgb), 0.12)"
              stroke="none"
            />

            {/* lambda marker */}
            <line
              x1={lambdaMarkerX}
              y1={ry0}
              x2={lambdaMarkerX}
              y2={ry0 + rh}
              stroke="var(--accent)"
              strokeWidth="0.9"
              strokeDasharray="3 3"
              opacity="0.7"
            />
            <circle
              cx={lambdaMarkerX}
              cy={lambdaMarkerY}
              r={5}
              fill="var(--accent)"
              stroke="var(--bg)"
              strokeWidth="1.4"
            />
            <text
              x={lambdaMarkerX}
              y={ry0 + rh + 26}
              fontSize="8"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              textAnchor="middle"
              fontWeight="700"
            >
              λ = {snap(lambda, 2)}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">λ</span>
          <input
            type="range"
            min="0.02"
            max="0.98"
            step="0.02"
            value={lambda}
            onChange={(e) => setLambda(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(lambda, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">α</span>
          <input
            type="range"
            min="0.1"
            max="4"
            step="0.05"
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(alpha, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">x̃</span>
            <span className="mlviz-val">
              λ·x_a + (1−λ)·x_b = [{snap(sx, 2)}, {snap(sy, 2)}]
            </span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">ỹ</span>
            <span className="mlviz-val">
              λ·A + (1−λ)·B  →  {snap(lambda, 2)} A + {snap(1 - lambda, 2)} B
            </span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={() => setPairIdx((i) => (i + 1) % A.length)}
          >
            <Shuffle size={13} />
            <span>Next pair</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setSeed((s) => (s * 1103515245 + 12345) & 0x7fffffff)}
          >
            <Shuffle size={13} />
            <span>Resample points</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => {
              setLambda(0.5);
              setAlpha(0.4);
              setSeed(7);
              setPairIdx(0);
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          α &lt; 1 spikes near 0 and 1 (heavy mixing) · α &gt; 1 favors λ ≈ 0.5 (balanced blends)
        </div>
      </div>
    </div>
  );
}
