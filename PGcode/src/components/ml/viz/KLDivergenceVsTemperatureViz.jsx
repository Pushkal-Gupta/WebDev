import React, { useState, useMemo } from 'react';
import { Thermometer, RotateCcw } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

function mulberry32(a) {
  return function () {
    let t = (a = (a + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 720;
const H = 340;
const SEED = 0xBADBEEF;

const N = 5;
const CLASS_LABELS = ['A', 'B', 'C', 'D', 'E'];

const P_LOGITS_REF = [2.4, 1.6, 0.4, -0.6, -1.2];
const Q_BASE_LOGITS_REF = [1.8, 0.9, 1.4, -0.3, -0.5];

const PANEL_PAD_X = 32;
const PANEL_GAP = 24;
const PANEL_W = (W - PANEL_PAD_X * 2 - PANEL_GAP) / 2;
const PANEL_TOP = 30;
const PANEL_H = H - PANEL_TOP - 80;
const BAR_GAP = 10;
const BAR_W = (PANEL_W - BAR_GAP * (N + 1) - 16) / N;
const PROB_AREA_H = PANEL_H - 50;

const P_X = PANEL_PAD_X;
const Q_X = PANEL_PAD_X + PANEL_W + PANEL_GAP;

function softmaxWithTemp(logits, T) {
  const t = Math.max(0.0001, T);
  const scaled = logits.map((z) => z / t);
  const m = Math.max(...scaled);
  const ex = scaled.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

function kl(p, q) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = Math.max(p[i], 1e-12);
    const qi = Math.max(q[i], 1e-12);
    s += pi * Math.log(pi / qi);
  }
  return Math.max(0, s);
}

function entropy(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = Math.max(p[i], 1e-12);
    s += -pi * Math.log(pi);
  }
  return s;
}

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

export default function KLDivergenceVsTemperatureViz() {
  const rng = useMemo(() => mulberry32(SEED), []);
  const [T, setT] = useState(1.0);

  const { pLogits, qBase } = useMemo(() => {
    const jitter = () => (rng() - 0.5) * 0.08;
    return {
      pLogits: P_LOGITS_REF.map((x) => x + jitter()),
      qBase: Q_BASE_LOGITS_REF.map((x) => x + jitter()),
    };
  }, [rng]);

  const P = useMemo(() => softmaxWithTemp(pLogits, 1.0), [pLogits]);
  const Q = useMemo(() => softmaxWithTemp(qBase, T), [qBase, T]);

  const klPQ = useMemo(() => kl(P, Q), [P, Q]);
  const klQP = useMemo(() => kl(Q, P), [P, Q]);
  const HQ = useMemo(() => entropy(Q), [Q]);
  const HP = useMemo(() => entropy(P), [P]);

  // KL curve over T sweep
  const curve = useMemo(() => {
    const pts = [];
    const Ts = [];
    const NSAMP = 80;
    const tMin = 0.1;
    const tMax = 5.0;
    for (let i = 0; i < NSAMP; i++) {
      const tt = tMin + (i / (NSAMP - 1)) * (tMax - tMin);
      const q = softmaxWithTemp(qBase, tt);
      pts.push(kl(P, q));
      Ts.push(tt);
    }
    return { pts, Ts, tMin, tMax };
  }, [qBase, P]);

  const curveMax = useMemo(() => Math.max(0.01, ...curve.pts), [curve]);

  const handleReset = () => setT(1.0);

  const klFormulaHtml = useMemo(
    () => katexHtml('\\mathrm{KL}(P\\,\\|\\,Q) = \\sum_i P(i)\\,\\log\\frac{P(i)}{Q(i)}', false),
    []
  );

  function panel(originX, label, sublabel, probs, color, fadeColor, baseColor) {
    const baselineY = PANEL_TOP + PANEL_H - 24;
    return (
      <g>
        <text
          x={originX}
          y={PANEL_TOP - 12}
          fontSize="10"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
          letterSpacing="0.14em"
        >
          {label}
        </text>
        <text
          x={originX + PANEL_W}
          y={PANEL_TOP - 12}
          fontSize="9.5"
          fill={color}
          fontFamily="var(--mono)"
          textAnchor="end"
          fontWeight="700"
        >
          {sublabel}
        </text>
        <rect
          x={originX}
          y={PANEL_TOP - 4}
          width={PANEL_W}
          height={PANEL_H}
          fill={baseColor || 'var(--bg)'}
          stroke="var(--border)"
          rx="8"
          opacity="0.6"
        />
        <line
          x1={originX + 6}
          y1={baselineY}
          x2={originX + PANEL_W - 6}
          y2={baselineY}
          stroke="var(--border)"
        />
        {probs.map((p, i) => {
          const h = Math.max(1, p * PROB_AREA_H);
          const x = originX + 8 + BAR_GAP + i * (BAR_W + BAR_GAP);
          const y = baselineY - h;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={h}
                fill={color}
                opacity="0.9"
                rx="2"
                style={{ transition: 'height 0.28s ease, y 0.28s ease' }}
              />
              <text
                x={x + BAR_W / 2}
                y={y - 4}
                fontSize="9"
                fill={color}
                fontFamily="var(--mono)"
                textAnchor="middle"
                fontWeight="700"
              >
                {p.toFixed(2)}
              </text>
              <text
                x={x + BAR_W / 2}
                y={baselineY + 14}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--serif)"
                fontStyle="italic"
                textAnchor="middle"
              >
                {CLASS_LABELS[i]}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  // curve viz coords (within bottom strip below the panels)
  const curveStripX = 32;
  const curveStripY = PANEL_TOP + PANEL_H + 18;
  const curveStripW = W - 64;
  const curveStripH = H - curveStripY - 14;

  const curvePath = useMemo(() => {
    const { pts, Ts, tMin, tMax } = curve;
    if (!pts.length) return '';
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const x = curveStripX + ((Ts[i] - tMin) / (tMax - tMin)) * curveStripW;
      const y = curveStripY + curveStripH - 4 - (pts[i] / curveMax) * (curveStripH - 14);
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return d;
  }, [curve, curveMax, curveStripX, curveStripY, curveStripW, curveStripH]);

  const cursorX = curveStripX + ((T - curve.tMin) / (curve.tMax - curve.tMin)) * curveStripW;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', maxWidth: '100%', height: 'auto', aspectRatio: `${W} / ${H}`, display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {panel(
            P_X,
            'REFERENCE  P  (fixed)',
            `H(P) = ${HP.toFixed(3)} nats`,
            P,
            'var(--hue-sky)',
            'var(--hue-sky)',
            'var(--bg)'
          )}
          {panel(
            Q_X,
            `MODEL  Q(T=${T.toFixed(2)})`,
            `H(Q) = ${HQ.toFixed(3)} nats`,
            Q,
            'var(--hue-pink)',
            'var(--hue-pink)',
            'var(--bg)'
          )}

          {/* curve strip */}
          <rect
            x={curveStripX}
            y={curveStripY}
            width={curveStripW}
            height={curveStripH}
            fill="var(--bg)"
            stroke="var(--border)"
            rx="6"
            opacity="0.5"
          />
          <text
            x={curveStripX}
            y={curveStripY - 4}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            KL(P‖Q) vs T
          </text>
          <text
            x={curveStripX + curveStripW}
            y={curveStripY - 4}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
          >
            T: {curve.tMin.toFixed(1)} → {curve.tMax.toFixed(1)}
          </text>

          <path d={curvePath} fill="none" stroke="var(--accent)" strokeWidth="1.6" />
          <line
            x1={cursorX}
            y1={curveStripY + 2}
            x2={cursorX}
            y2={curveStripY + curveStripH - 4}
            stroke="var(--accent)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <circle
            cx={cursorX}
            cy={curveStripY + curveStripH - 4 - (klPQ / curveMax) * (curveStripH - 14)}
            r="4"
            fill="var(--accent)"
            stroke="var(--bg)"
            strokeWidth="1.4"
          />
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Thermometer size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              temperature T
            </span>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.05"
              value={T}
              onChange={(e) => setT(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{T.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>KL(P‖Q)</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>{klPQ.toFixed(4)}</span>
          </span>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>KL(Q‖P)</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{klQP.toFixed(4)}</span>
          </span>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>H(Q)</span>
            <span className="mlviz-val">{HQ.toFixed(3)}</span>
          </span>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>H(P)</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{HP.toFixed(3)}</span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.2rem' }}>
          <span
            className="ml-imath"
            style={{ fontSize: '0.85rem' }}
            dangerouslySetInnerHTML={{ __html: klFormulaHtml }}
          />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset T=1</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            high T → flat Q → larger KL · low T → sharp Q
          </span>
        </div>

        <div className="mlviz-hint">
          KL is asymmetric · Q(T→∞) → uniform · Q(T→0) → argmax one-hot
        </div>
      </div>
    </div>
  );
}
