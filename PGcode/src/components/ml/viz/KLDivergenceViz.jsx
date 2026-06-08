import React, { useState, useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 420;
const H = 280;
const PAD_L = 38;
const PAD_R = 16;
const PAD_T = 22;
const PAD_B = 38;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const N = 5;
const SLOT_W = PLOT_W / N;
const BAR_W = SLOT_W * 0.34;
const BAR_OVERLAP = SLOT_W * 0.18;

const EPS = 1e-9;
const LN2 = Math.log(2);

const COLOR_P = 'var(--hue-sky, #5ecbff)';
const COLOR_Q = 'var(--hue-pink, #ff66cc)';
const COLOR_OVERLAP = 'var(--accent)';

const PRESETS = {
  same: { p: [0.2, 0.2, 0.2, 0.2, 0.2], q: [0.2, 0.2, 0.2, 0.2, 0.2] },
  sharpFlat: { p: [0.05, 0.05, 0.8, 0.05, 0.05], q: [0.2, 0.2, 0.2, 0.2, 0.2] },
  flatSharp: { p: [0.2, 0.2, 0.2, 0.2, 0.2], q: [0.05, 0.05, 0.8, 0.05, 0.05] },
  disjoint: { p: [0.5, 0.5, 0.0, 0.0, 0.0], q: [0.0, 0.0, 0.0, 0.5, 0.5] },
};

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function normalize(arr) {
  const s = arr.reduce((a, b) => a + b, 0);
  if (s <= 0) return arr.map(() => 1 / arr.length);
  return arr.map((v) => v / s);
}

function entropy(p) {
  let h = 0;
  for (const v of p) {
    if (v > EPS) h -= v * Math.log(v);
  }
  return h / LN2;
}

function crossEntropy(p, q) {
  let h = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = p[i];
    const qi = q[i];
    if (pi > EPS) {
      const qs = Math.max(qi, EPS);
      h -= pi * Math.log(qs);
    }
  }
  return h / LN2;
}

function klDivergence(p, q) {
  let d = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = p[i];
    const qi = q[i];
    if (pi > EPS) {
      const qs = Math.max(qi, EPS);
      d += pi * Math.log(pi / qs);
    }
  }
  return d / LN2;
}

function klContribs(p, q) {
  const out = new Array(p.length).fill(0);
  for (let i = 0; i < p.length; i++) {
    const pi = p[i];
    const qi = q[i];
    if (pi > EPS) {
      const qs = Math.max(qi, EPS);
      out[i] = pi * Math.log(pi / qs) / LN2;
    }
  }
  return out;
}

function jsDivergence(p, q) {
  const m = p.map((pi, i) => 0.5 * (pi + q[i]));
  return 0.5 * klDivergence(p, m) + 0.5 * klDivergence(q, m);
}

function slotX(i) {
  return PAD_L + i * SLOT_W + SLOT_W / 2;
}

export default function KLDivergenceViz() {
  const [pRaw, setPRaw] = useState(PRESETS.sharpFlat.p.slice());
  const [qRaw, setQRaw] = useState(PRESETS.sharpFlat.q.slice());

  const p = useMemo(() => normalize(pRaw), [pRaw]);
  const q = useMemo(() => normalize(qRaw), [qRaw]);

  const Hp = useMemo(() => entropy(p), [p]);
  const Hpq = useMemo(() => crossEntropy(p, q), [p, q]);
  const klPQ = useMemo(() => klDivergence(p, q), [p, q]);
  const klQP = useMemo(() => klDivergence(q, p), [p, q]);
  const js = useMemo(() => jsDivergence(p, q), [p, q]);
  const contribs = useMemo(() => klContribs(p, q), [p, q]);

  const maxContribAbs = useMemo(() => {
    let m = 0;
    for (const c of contribs) {
      const a = Math.abs(c);
      if (a > m) m = a;
    }
    return m;
  }, [contribs]);

  const updateP = useCallback((i, v) => {
    setPRaw((prev) => {
      const next = [...prev];
      next[i] = Math.max(0, Math.min(1, v));
      return next;
    });
  }, []);

  const updateQ = useCallback((i, v) => {
    setQRaw((prev) => {
      const next = [...prev];
      next[i] = Math.max(0, Math.min(1, v));
      return next;
    });
  }, []);

  const applyPreset = useCallback((key) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setPRaw(preset.p.slice());
    setQRaw(preset.q.slice());
  }, []);

  const handleReset = useCallback(() => applyPreset('sharpFlat'), [applyPreset]);

  const maxBarVal = useMemo(() => {
    const mp = Math.max(...p);
    const mq = Math.max(...q);
    return Math.max(0.25, Math.max(mp, mq) * 1.1);
  }, [p, q]);

  function barH(v) {
    return (v / maxBarVal) * PLOT_H;
  }

  const baseY = PAD_T + PLOT_H;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          {/* y-axis gridlines */}
          {[0.25, 0.5, 0.75, 1.0].map((tick) => {
            if (tick > maxBarVal) return null;
            const y = baseY - (tick / maxBarVal) * PLOT_H;
            return (
              <g key={`tick${tick}`}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                  opacity="0.6"
                />
                <text
                  x={PAD_L - 5}
                  y={y + 3}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  {tick.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* baseline */}
          <line
            x1={PAD_L}
            y1={baseY}
            x2={W - PAD_R}
            y2={baseY}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* axis label */}
          <text
            x={PAD_L - 4}
            y={PAD_T - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="start"
            letterSpacing="0.12em"
          >
            P(x)
          </text>
          <text
            x={W - PAD_R}
            y={PAD_T - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
            letterSpacing="0.1em"
          >
            <tspan fill={COLOR_P}>p</tspan>
            <tspan>  </tspan>
            <tspan fill={COLOR_Q}>q</tspan>
            <tspan>  </tspan>
            <tspan fill="var(--accent)">overlap</tspan>
          </text>

          {/* bars per bucket */}
          {p.map((pi, i) => {
            const qi = q[i];
            const cx = slotX(i);
            const pX = cx - BAR_W + BAR_OVERLAP / 2;
            const qX = cx - BAR_OVERLAP / 2;
            const pH = barH(pi);
            const qH = barH(qi);
            const overlapVal = Math.min(pi, qi);
            const overlapH = barH(overlapVal);
            const overlapW = BAR_OVERLAP;
            const overlapX = cx - overlapW / 2;
            const contrib = contribs[i];
            const isTopContrib = maxContribAbs > 1e-4 && Math.abs(contrib) >= maxContribAbs * 0.7;

            return (
              <g key={`bucket${i}`}>
                {/* p bar */}
                <rect
                  x={pX}
                  y={baseY - pH}
                  width={BAR_W}
                  height={Math.max(0.5, pH)}
                  fill={COLOR_P}
                  opacity="0.78"
                  rx="2"
                />
                {/* q bar */}
                <rect
                  x={qX}
                  y={baseY - qH}
                  width={BAR_W}
                  height={Math.max(0.5, qH)}
                  fill={COLOR_Q}
                  opacity="0.78"
                  rx="2"
                />
                {/* overlap band - drawn over both, using accent */}
                {overlapVal > EPS && (
                  <rect
                    x={overlapX}
                    y={baseY - overlapH}
                    width={overlapW}
                    height={Math.max(0.5, overlapH)}
                    fill={COLOR_OVERLAP}
                    opacity="0.85"
                    rx="1.5"
                  />
                )}
                {/* highlight ring around top contributors to KL */}
                {isTopContrib && (
                  <rect
                    x={cx - SLOT_W * 0.42}
                    y={PAD_T + 2}
                    width={SLOT_W * 0.84}
                    height={PLOT_H - 2}
                    fill="none"
                    stroke="var(--hard, #ff5d6a)"
                    strokeWidth="1.4"
                    strokeDasharray="4 3"
                    rx="6"
                    opacity="0.9"
                  />
                )}
                {/* bucket label */}
                <text
                  x={cx}
                  y={baseY + 14}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {`x${i + 1}`}
                </text>
                {/* contribution readout under label */}
                <text
                  x={cx}
                  y={baseY + 26}
                  fontSize="8.5"
                  fill={isTopContrib ? 'var(--hard, #ff5d6a)' : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight={isTopContrib ? 700 : 500}
                >
                  {`+${snap(contrib, 3).toFixed(3)}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        {/* presets */}
        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => applyPreset('same')}>
            <span>Same</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => applyPreset('sharpFlat')}>
            <span>Sharp p, flat q</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => applyPreset('flatSharp')}>
            <span>Flat p, sharp q</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => applyPreset('disjoint')}>
            <span>Disjoint</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* p sliders */}
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: COLOR_P }}>p</span>
          <span className="mlviz-sub">drag to set p(x); auto-normalised</span>
        </div>
        {p.map((pi, i) => (
          <div className="mlviz-row" key={`pr${i}`}>
            <span className="mlviz-tag" style={{ color: COLOR_P, fontSize: '0.78rem' }}>{`p${i + 1}`}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={pRaw[i]}
              onChange={(e) => updateP(i, parseFloat(e.target.value))}
              style={{ flex: 1, minWidth: 80, accentColor: COLOR_P, cursor: 'pointer' }}
            />
            <span className="mlviz-val" style={{ minWidth: '3.2rem', textAlign: 'right', color: COLOR_P }}>
              {pi.toFixed(3)}
            </span>
          </div>
        ))}

        {/* q sliders */}
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: COLOR_Q }}>q</span>
          <span className="mlviz-sub">drag to set q(x); auto-normalised</span>
        </div>
        {q.map((qi, i) => (
          <div className="mlviz-row" key={`qr${i}`}>
            <span className="mlviz-tag" style={{ color: COLOR_Q, fontSize: '0.78rem' }}>{`q${i + 1}`}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={qRaw[i]}
              onChange={(e) => updateQ(i, parseFloat(e.target.value))}
              style={{ flex: 1, minWidth: 80, accentColor: COLOR_Q, cursor: 'pointer' }}
            />
            <span className="mlviz-val" style={{ minWidth: '3.2rem', textAlign: 'right', color: COLOR_Q }}>
              {qi.toFixed(3)}
            </span>
          </div>
        ))}

        {/* readouts */}
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag">H(p)</span>
          <span className="mlviz-val">{Hp.toFixed(3)}</span>
          <span className="mlviz-sub">bits  ·  entropy of p</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">H(p,q)</span>
          <span className="mlviz-val">{Hpq.toFixed(3)}</span>
          <span className="mlviz-sub">bits  ·  cross-entropy</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>D(p‖q)</span>
          <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{klPQ.toFixed(3)}</span>
          <span className="mlviz-sub">= H(p,q) − H(p)</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_Q }}>D(q‖p)</span>
          <span className="mlviz-val" style={{ color: COLOR_Q }}>{klQP.toFixed(3)}</span>
          <span className="mlviz-sub">asymmetric: D(p‖q) ≠ D(q‖p)</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">JS(p,q)</span>
          <span className="mlviz-val">{js.toFixed(3)}</span>
          <span className="mlviz-sub">symmetric ·  bounded by 1</span>
        </div>

        <div className="mlviz-hint">red ring marks buckets contributing most to D(p‖q)</div>
      </div>
    </div>
  );
}
