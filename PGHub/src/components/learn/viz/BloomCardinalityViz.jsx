import React, { useCallback, useMemo, useState } from 'react';
import { RotateCcw, Crosshair, AlertTriangle } from 'lucide-react';
import './BloomCardinalityViz.css';

const N_MIN = 1;
const N_MAX = 5000;
const M_MIN = 8;
const M_MAX = 40000;
const K_MIN = 1;
const K_MAX = 16;
const DEFAULT_N = 1000;
const DEFAULT_M = 10000;
const DEFAULT_K = 7;

const PLOT_W = 720;
const PLOT_H = 300;
const PAD_L = 56;
const PAD_R = 24;
const PAD_T = 24;
const PAD_B = 48;

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const r = Math.round(n);
  if (r < min) return min;
  if (r > max) return max;
  return r;
}

// Expected bit-fill ratio for a Bloom filter: 1 - e^(-k n / m).
function fillRatio(k, n, m) {
  if (m <= 0) return 0;
  return 1 - Math.exp((-k * n) / m);
}

// False-positive probability ≈ (fill)^k.
function fpProb(k, n, m) {
  return Math.pow(fillRatio(k, n, m), k);
}

export default function BloomCardinalityViz() {
  const [n, setN] = useState(DEFAULT_N);
  const [m, setM] = useState(DEFAULT_M);
  const [k, setK] = useState(DEFAULT_K);

  const derived = useMemo(() => {
    const safeN = Math.max(1, n);
    const fill = fillRatio(k, n, m);
    const p = fpProb(k, n, m);
    const kOptExact = m > 0 ? (m / safeN) * Math.LN2 : 0;
    const kOptRounded = Math.max(1, Math.round(kOptExact));
    const pAtOpt = fpProb(kOptRounded, n, m);
    const bitsPerItem = m / safeN;
    return { fill, p, kOptExact, kOptRounded, pAtOpt, bitsPerItem };
  }, [n, m, k]);

  // Curve: p(k) over the visible k range for the current n, m.
  const plot = useMemo(() => {
    const xToPx = (kx) =>
      PAD_L + ((kx - K_MIN) / (K_MAX - K_MIN)) * (PLOT_W - PAD_L - PAD_R);
    const yToPx = (py) => PAD_T + (1 - py) * (PLOT_H - PAD_T - PAD_B);

    const pts = [];
    const samples = 96;
    for (let i = 0; i <= samples; i++) {
      const kx = K_MIN + (i / samples) * (K_MAX - K_MIN);
      const py = fpProb(kx, n, m);
      pts.push({ kx, py, x: xToPx(kx), y: yToPx(py) });
    }
    const path = pts
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
      .join(' ');

    const areaPath =
      `${path} L ${xToPx(K_MAX).toFixed(2)} ${yToPx(0).toFixed(2)}` +
      ` L ${xToPx(K_MIN).toFixed(2)} ${yToPx(0).toFixed(2)} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((v) => ({ v, y: yToPx(v) }));
    const xTicks = [1, 4, 7, 10, 13, 16].map((v) => ({ v, x: xToPx(v) }));

    const optClamped = Math.min(K_MAX, Math.max(K_MIN, derived.kOptExact));
    return {
      path,
      areaPath,
      yTicks,
      xTicks,
      xToPx,
      yToPx,
      curX: xToPx(Math.min(K_MAX, Math.max(K_MIN, k))),
      curY: yToPx(fpProb(k, n, m)),
      optX: xToPx(optClamped),
      optY: yToPx(fpProb(optClamped, n, m)),
      optInRange: derived.kOptExact >= K_MIN && derived.kOptExact <= K_MAX,
    };
  }, [n, m, k, derived.kOptExact]);

  const onSnapOptimal = useCallback(() => {
    setK(clampInt(derived.kOptRounded, K_MIN, K_MAX, DEFAULT_K));
  }, [derived.kOptRounded]);

  const onReset = useCallback(() => {
    setN(DEFAULT_N);
    setM(DEFAULT_M);
    setK(DEFAULT_K);
  }, []);

  const fmt = (v) => Math.round(v).toLocaleString('en-US');
  const pct = (v) => `${(v * 100).toFixed(2)}%`;
  const farFromOpt = Math.abs(k - derived.kOptRounded) >= 3;

  return (
    <div className="bct-root">
      <div className="bct-head">
        <div className="bct-title-block">
          <h3 className="bct-title">Bloom filter size / accuracy tradeoff</h3>
          <p className="bct-sub">
            Three dials set the whole filter: items inserted (n), bits allocated (m), and
            hash functions (k). More bits per item lowers the false-positive rate; for fixed
            m and n there is one k that minimizes it. Drag the sliders and watch the curve.
          </p>
        </div>
      </div>

      <div className="bct-controls">
        <div className="bct-control-group">
          <label className="bct-input-label" htmlFor="bct-n">
            Items n
          </label>
          <input
            id="bct-n"
            type="range"
            className="bct-range"
            min={N_MIN}
            max={N_MAX}
            step={1}
            value={n}
            onChange={(e) => setN(clampInt(e.target.value, N_MIN, N_MAX, DEFAULT_N))}
          />
          <span className="bct-range-value">{fmt(n)}</span>
        </div>

        <div className="bct-control-group">
          <label className="bct-input-label" htmlFor="bct-m">
            Bits m
          </label>
          <input
            id="bct-m"
            type="range"
            className="bct-range"
            min={M_MIN}
            max={M_MAX}
            step={1}
            value={m}
            onChange={(e) => setM(clampInt(e.target.value, M_MIN, M_MAX, DEFAULT_M))}
          />
          <span className="bct-range-value">{fmt(m)}</span>
        </div>

        <div className="bct-control-group">
          <label className="bct-input-label" htmlFor="bct-k">
            Hashes k
          </label>
          <input
            id="bct-k"
            type="range"
            className="bct-range"
            min={K_MIN}
            max={K_MAX}
            step={1}
            value={k}
            onChange={(e) => setK(clampInt(e.target.value, K_MIN, K_MAX, DEFAULT_K))}
          />
          <span className="bct-range-value">{k}</span>
        </div>

        <div className="bct-control-spacer" />

        <button type="button" className="bct-btn bct-btn-accent" onClick={onSnapOptimal}>
          <Crosshair size={14} /> Snap k to optimal
        </button>
        <button type="button" className="bct-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="bct-formula-row">
        <span className="bct-formula-label">FP ≈</span>
        <code className="bct-formula">(1 − e^(−kn/m))^k</code>
        <span className="bct-formula-sep">·</span>
        <code className="bct-formula">k* = (m/n)·ln 2</code>
        <span className="bct-formula-sep">→</span>
        <code className="bct-formula bct-formula-result">
          k*={derived.kOptExact.toFixed(2)} (≈{derived.kOptRounded}), FP={pct(derived.p)}
        </code>
        {farFromOpt && (
          <span className="bct-warn-pill">
            <AlertTriangle size={12} /> k is far from optimal
          </span>
        )}
      </div>

      <div className="bct-stage">
        <svg
          className="bct-svg"
          viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="False-positive probability as a function of the number of hash functions"
        >
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W - PAD_L - PAD_R}
            height={PLOT_H - PAD_T - PAD_B}
            className="bct-plot-bg"
          />

          {plot.yTicks.map((t) => (
            <g key={`yt-${t.v}`}>
              <line
                x1={PAD_L}
                y1={t.y}
                x2={PLOT_W - PAD_R}
                y2={t.y}
                className="bct-gridline"
              />
              <text x={PAD_L - 10} y={t.y + 4} textAnchor="end" className="bct-axis-label">
                {Math.round(t.v * 100)}%
              </text>
            </g>
          ))}

          {plot.xTicks.map((t) => (
            <text
              key={`xt-${t.v}`}
              x={t.x}
              y={PLOT_H - PAD_B + 20}
              textAnchor="middle"
              className="bct-axis-label"
            >
              {t.v}
            </text>
          ))}

          <text
            x={PAD_L + (PLOT_W - PAD_L - PAD_R) / 2}
            y={PLOT_H - 8}
            textAnchor="middle"
            className="bct-axis-title"
          >
            hash functions k
          </text>
          <text
            x={16}
            y={PAD_T + (PLOT_H - PAD_T - PAD_B) / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${PAD_T + (PLOT_H - PAD_T - PAD_B) / 2})`}
            className="bct-axis-title"
          >
            false-positive rate
          </text>

          <path d={plot.areaPath} className="bct-curve-area" />
          <path d={plot.path} className="bct-curve" />

          {plot.optInRange && (
            <g className="bct-opt-marker">
              <line
                x1={plot.optX}
                y1={PAD_T}
                x2={plot.optX}
                y2={PLOT_H - PAD_B}
                className="bct-opt-line"
              />
              <circle cx={plot.optX} cy={plot.optY} r={5} className="bct-opt-dot" />
              <text
                x={plot.optX}
                y={PAD_T - 6}
                textAnchor="middle"
                className="bct-opt-text"
              >
                k* optimal
              </text>
            </g>
          )}

          <g className="bct-cur-marker">
            <line
              x1={plot.curX}
              y1={PAD_T}
              x2={plot.curX}
              y2={PLOT_H - PAD_B}
              className="bct-cur-line"
            />
            <circle cx={plot.curX} cy={plot.curY} r={6} className="bct-cur-dot" />
            <text x={plot.curX} y={plot.curY - 12} textAnchor="middle" className="bct-cur-text">
              k = {k}
            </text>
          </g>
        </svg>
      </div>

      <div className="bct-fill-row">
        <span className="bct-fill-label">Bit fill</span>
        <div className="bct-fill-track">
          <div
            className="bct-fill-bar"
            style={{ width: `${Math.min(100, derived.fill * 100).toFixed(2)}%` }}
          />
        </div>
        <span className="bct-fill-pct">{pct(derived.fill)}</span>
      </div>

      <div className="bct-footer">
        <div className="bct-stat bct-stat-emph">
          <span className="bct-stat-label">False-positive rate</span>
          <span className="bct-stat-value bct-stat-big">{pct(derived.p)}</span>
        </div>
        <div className="bct-stat">
          <span className="bct-stat-label">Bit fill ratio</span>
          <span className="bct-stat-value">{pct(derived.fill)}</span>
        </div>
        <div className="bct-stat">
          <span className="bct-stat-label">Optimal k*</span>
          <span className="bct-stat-value">
            {derived.kOptRounded} <span className="bct-stat-aux">({derived.kOptExact.toFixed(2)})</span>
          </span>
        </div>
        <div className="bct-stat">
          <span className="bct-stat-label">FP at optimal k</span>
          <span className="bct-stat-value">{pct(derived.pAtOpt)}</span>
        </div>
        <div className="bct-stat">
          <span className="bct-stat-label">Bits per item m/n</span>
          <span className="bct-stat-value">{derived.bitsPerItem.toFixed(2)}</span>
        </div>
        <div className="bct-stat bct-stat-grow">
          <span className="bct-stat-label">Current setting</span>
          <span className="bct-stat-value">
            n={fmt(n)}, m={fmt(m)}, k={k} → {pct(derived.p)} FP at {derived.bitsPerItem.toFixed(1)} bits/item
          </span>
        </div>
      </div>
    </div>
  );
}
