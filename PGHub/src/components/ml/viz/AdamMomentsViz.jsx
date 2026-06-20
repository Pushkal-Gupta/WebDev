import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';
import './MLViz.css';

// Running-estimate angle on Adam: watch the first moment m (EMA of g) and the
// second moment v (EMA of g^2) track a noisy 1D gradient stream, then see the
// bias-corrected m_hat / (sqrt(v_hat) + eps) effective step settle.
// Distinct from AdamOptimizerViz (which shows a 2D trajectory in a bowl).

const W = 600;
const H = 320;
const EPS = 1e-8;
const N_STEPS = 60;
const STEP_MS = 280;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

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

// A noisy gradient stream with a steady drift: true gradient ~ -0.6 plus noise.
// Deterministic so the picture is the same every load.
function buildGradients() {
  const rand = mulberry32(2024);
  const g = [];
  for (let t = 0; t < N_STEPS; t++) {
    const drift = -0.6;
    const noise = (rand() - 0.5) * 1.6;
    g.push(drift + noise);
  }
  return g;
}

export default function AdamMomentsViz({ beta1: b10 = 0.9, beta2: b20 = 0.999 } = {}) {
  const [beta1, setBeta1] = useState(b10);
  const [beta2, setBeta2] = useState(b20);
  const [t, setT] = useState(1);          // current step index (1-based)
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const grads = useMemo(() => buildGradients(), []);

  // recompute the full m/v history for the chosen betas, up to step t
  const hist = useMemo(() => {
    let m = 0;
    let v = 0;
    const rows = [];
    for (let k = 0; k < t; k++) {
      const g = grads[k];
      m = beta1 * m + (1 - beta1) * g;
      v = beta2 * v + (1 - beta2) * g * g;
      const mHat = m / (1 - Math.pow(beta1, k + 1));
      const vHat = v / (1 - Math.pow(beta2, k + 1));
      const stepSize = mHat / (Math.sqrt(vHat) + EPS);
      rows.push({ g, m, v, mHat, vHat, stepSize });
    }
    return rows;
  }, [t, beta1, beta2, grads]);

  const cur = hist[hist.length - 1];

  useEffect(() => {
    if (!playing) {
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
      return undefined;
    }
    timer.current = setInterval(() => {
      setT((prev) => {
        if (prev >= N_STEPS) { setPlaying(false); return prev; }
        return prev + 1;
      });
    }, STEP_MS);
    return () => {
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
    };
  }, [playing]);

  // ---- layout: gradient stream sparkline on top, three running bars below ----
  const padL = 50;
  const padR = 20;
  const plotW = W - padL - padR;
  const streamTop = 38;
  const streamH = 70;
  const gMax = 2.0;

  function gx(i) { return padL + (i / (N_STEPS - 1)) * plotW; }
  function gy(val) {
    const mid = streamTop + streamH / 2;
    return mid - (val / gMax) * (streamH / 2);
  }

  const points = hist.map((r, i) => `${gx(i)},${gy(r.g)}`).join(' ');

  // running-estimate bars (compare |m|, sqrt(v), |effective step|)
  const barTop = 150;
  const barH = 120;
  const bars = cur
    ? [
        { key: 'm', label: 'm̂', sub: 'EMA of g', val: cur.mHat, color: 'var(--accent)' },
        { key: 'v', label: '√v̂', sub: 'EMA of g²', val: Math.sqrt(cur.vHat), color: 'var(--hue-violet)' },
        { key: 's', label: 'm̂/(√v̂+ε)', sub: 'effective step', val: cur.stepSize, color: 'var(--hue-mint)' },
      ]
    : [];
  const barRefMax = 1.6;
  const slotW = plotW / 3;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', maxWidth: '820px' }}
        >
          <text
            x={padL}
            y={24}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            NOISY GRADIENT STREAM gₜ · step {t} / {N_STEPS}
          </text>

          {/* zero line for the stream */}
          <line
            x1={padL}
            y1={gy(0)}
            x2={W - padR}
            y2={gy(0)}
            stroke="var(--border)"
            strokeWidth="0.6"
            strokeDasharray="2 3"
          />
          {/* m EMA trail over the stream */}
          <polyline
            points={hist.map((r, i) => `${gx(i)},${gy(r.m)}`).join(' ')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.6"
            opacity="0.85"
          />
          {/* raw gradients as faint dots + connecting line */}
          <polyline
            points={points}
            fill="none"
            stroke="var(--text-dim)"
            strokeWidth="0.8"
            opacity="0.55"
          />
          {hist.map((r, i) => (
            <circle key={`g-${i}`} cx={gx(i)} cy={gy(r.g)} r="1.6" fill="var(--text-dim)" opacity="0.6" />
          ))}
          {cur && (
            <circle cx={gx(hist.length - 1)} cy={gy(cur.g)} r="3" fill="var(--accent)" />
          )}
          <text x={padL} y={streamTop + streamH + 12} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            dots = raw gₜ · solid line = first moment m (the EMA smooths the noise)
          </text>

          {/* running-estimate bars */}
          <text
            x={padL}
            y={barTop - 12}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            BIAS-CORRECTED RUNNING ESTIMATES
          </text>
          <line
            x1={padL}
            y1={barTop + barH}
            x2={W - padR}
            y2={barTop + barH}
            stroke="var(--border)"
            strokeWidth="0.8"
          />
          {bars.map((b, i) => {
            const cx = padL + i * slotW + slotW / 2;
            const mag = Math.min(barRefMax, Math.abs(b.val));
            const bh = (mag / barRefMax) * (barH - 8);
            const bw = 46;
            return (
              <g key={b.key}>
                <rect
                  x={cx - bw / 2}
                  y={barTop + barH - bh}
                  width={bw}
                  height={bh}
                  rx="3"
                  fill={b.color}
                  opacity="0.8"
                />
                <text
                  x={cx}
                  y={barTop + barH - bh - 5}
                  fontSize="11"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {snap(b.val, 3)}
                </text>
                <text
                  x={cx}
                  y={barTop + barH + 13}
                  fontSize="9"
                  fill={b.color}
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {b.label}
                </text>
                <text
                  x={cx}
                  y={barTop + barH + 24}
                  fontSize="7.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                >
                  {b.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">β₁</span>
          <input
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            value={beta1}
            onChange={(e) => setBeta1(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(beta1, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">β₂</span>
          <input
            type="range"
            min="0.9"
            max="0.9999"
            step="0.0001"
            value={beta2}
            onChange={(e) => setBeta2(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(beta2, 4)}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          {cur && (
            <>
              <div className="mlviz-row" style={{ gap: '0.6rem' }}>
                <span className="mlviz-tag">m</span>
                <span className="mlviz-val">
                  β₁·m + (1−β₁)·g = {snap(cur.m, 3)} → m̂ = {snap(cur.mHat, 3)}
                </span>
                <span className="mlviz-sub">bias-corrected by 1−β₁^t</span>
              </div>
              <div className="mlviz-row" style={{ gap: '0.6rem' }}>
                <span className="mlviz-tag">v</span>
                <span className="mlviz-val">
                  β₂·v + (1−β₂)·g² = {snap(cur.v, 4)} → v̂ = {snap(cur.vHat, 4)}
                </span>
              </div>
              <div className="mlviz-row" style={{ gap: '0.6rem' }}>
                <span className="mlviz-tag">step</span>
                <span className="mlviz-val">
                  m̂/(√v̂+ε) = {snap(cur.stepSize, 4)}
                </span>
                <span className="mlviz-sub">effective per-parameter step (×α)</span>
              </div>
            </>
          )}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setT((s) => Math.min(N_STEPS, s + 1))}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setPlaying(false); setT(1); setBeta1(b10); setBeta2(b20); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          large β₂ keeps √v̂ smooth, so noisy gradients don't blow up the step · m̂ averages out the noise in gₜ
        </div>
      </div>
    </div>
  );
}
