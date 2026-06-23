import React, { useMemo, useState } from 'react';
import { Gauge, Crosshair } from 'lucide-react';
import './TDigestPercentilesViz.css';

// k-scale function controls bin size: shallow near q=0.5, steep near tails.
// We place centroid boundaries at equal k-spacing, then map back to q.
function kScale(q, comp) {
  // standard t-digest k_1 scale (approx): comp/(2π) * asin(2q-1)
  return (comp / (2 * Math.PI)) * Math.asin(2 * q - 1);
}
function invKScale(k, comp) {
  return 0.5 * (Math.sin((2 * Math.PI * k) / comp) + 1);
}

function buildCentroids(comp) {
  const kMin = kScale(0.0001, comp);
  const kMax = kScale(0.9999, comp);
  const count = Math.max(6, Math.round(comp / 4));
  const bounds = [];
  for (let i = 0; i <= count; i += 1) {
    const k = kMin + ((kMax - kMin) * i) / count;
    bounds.push(Math.min(1, Math.max(0, invKScale(k, comp))));
  }
  const centroids = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const qLo = bounds[i];
    const qHi = bounds[i + 1];
    const qMid = (qLo + qHi) / 2;
    centroids.push({ qLo, qHi, qMid, weight: qHi - qLo });
  }
  return centroids;
}

// Map quantile q to a value on an exponential-ish latency CDF (heavy right tail).
function valueAtQuantile(q) {
  // inverse-CDF of a long-tailed latency distribution, in ms
  return 10 + 6 * Math.tan(Math.min(0.999, q) * (Math.PI / 2) * 0.62) * 18;
}

export default function TDigestPercentilesViz() {
  const [comp, setComp] = useState(100);
  const [targetP, setTargetP] = useState(99);

  const centroids = useMemo(() => buildCentroids(comp), [comp]);
  const tq = targetP / 100;

  const W = 920;
  const H = 320;
  const padL = 54;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xOf = (q) => padL + q * plotW;
  const vMax = valueAtQuantile(0.995);
  const yOf = (v) => padT + plotH - (Math.min(v, vMax) / vMax) * plotH;

  // CDF curve points
  const curve = [];
  for (let i = 0; i <= 100; i += 1) {
    const q = i / 100;
    curve.push(`${xOf(q).toFixed(1)},${yOf(valueAtQuantile(q)).toFixed(1)}`);
  }

  // find straddling centroid for target
  const straddle = centroids.find((c) => tq >= c.qLo && tq <= c.qHi) || centroids[centroids.length - 1];
  const estValue = valueAtQuantile(tq);
  const binWidthMs = valueAtQuantile(straddle.qHi) - valueAtQuantile(straddle.qLo);

  return (
    <div className="tdv">
      <div className="tdv-head">
        <h3 className="tdv-title"><Gauge size={18} className="tdv-ticon" /> t-digest — variable-resolution centroids on the CDF</h3>
        <p className="tdv-sub">
          Centroids cluster tightly at the tails (p1, p99, p99.9) and spread out in the middle, so the bins that matter for SLOs stay small. Drag compression to add resolution; pick a target percentile to see its straddling bin.
        </p>
      </div>

      <div className="tdv-controls">
        <label className="tdv-slider">
          <span className="tdv-slider-label">compression δ</span>
          <input type="range" min={20} max={300} step={10} value={comp} onChange={(e) => setComp(Number(e.target.value))} className="tdv-range" />
          <span className="tdv-slider-value">{comp}</span>
        </label>
        <label className="tdv-slider">
          <span className="tdv-slider-label"><Crosshair size={13} /> target</span>
          <input type="range" min={1} max={999} step={1} value={Math.round(targetP * 10)} onChange={(e) => setTargetP(Number(e.target.value) / 10)} className="tdv-range" />
          <span className="tdv-slider-value">p{targetP.toFixed(1)}</span>
        </label>
        <div className="tdv-count">{centroids.length} centroids</div>
      </div>

      <div className="tdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tdv-svg" preserveAspectRatio="xMidYMid meet">
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--border)" strokeWidth={1.2} />
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--border)" strokeWidth={1.2} />
          <text x={16} y={padT + plotH / 2} className="tdv-axis" transform={`rotate(-90 16 ${padT + plotH / 2})`} style={{ textAnchor: 'middle' }}>value (ms)</text>
          <text x={padL + plotW / 2} y={H - 6} className="tdv-axis" style={{ textAnchor: 'middle' }}>cumulative quantile q (0 → 1)</text>

          {/* centroid bins shaded — width shows resolution */}
          {centroids.map((c, i) => {
            const x0 = xOf(c.qLo);
            const x1 = xOf(c.qHi);
            const isTail = c.qMid < 0.1 || c.qMid > 0.9;
            const active = c === straddle;
            return (
              <g key={`c-${i}`}>
                <rect x={x0} y={padT} width={Math.max(0.5, x1 - x0)} height={plotH}
                  fill={active ? 'rgba(var(--accent-rgb),0.18)' : isTail ? 'var(--hue-violet)' : 'var(--accent)'}
                  opacity={active ? 1 : isTail ? 0.16 : 0.07}
                  stroke={active ? 'var(--accent)' : 'var(--border)'} strokeWidth={active ? 2 : 0.4} />
                <circle cx={xOf(c.qMid)} cy={yOf(valueAtQuantile(c.qMid))} r={active ? 5 : 3}
                  fill={isTail ? 'var(--hue-pink)' : 'var(--accent)'} stroke="var(--bg)" strokeWidth={1} />
              </g>
            );
          })}

          <polyline points={curve.join(' ')} fill="none" stroke="var(--text-main)" strokeWidth={2} opacity={0.85} />

          {/* target percentile crosshair */}
          <line x1={xOf(tq)} y1={padT} x2={xOf(tq)} y2={padT + plotH} stroke="var(--warning)" strokeWidth={1.6} strokeDasharray="4 3" />
          <line x1={padL} y1={yOf(estValue)} x2={xOf(tq)} y2={yOf(estValue)} stroke="var(--warning)" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7} />
          <circle cx={xOf(tq)} cy={yOf(estValue)} r={6} fill="var(--warning)" stroke="var(--bg)" strokeWidth={1.5} />
          <text x={xOf(tq) + 8} y={yOf(estValue) - 8} className="tdv-target">p{targetP.toFixed(1)} ≈ {Math.round(estValue)}ms</text>

          {/* legend */}
          <rect x={padL + 6} y={padT + 6} width={10} height={10} fill="var(--hue-violet)" opacity={0.4} />
          <text x={padL + 22} y={padT + 15} className="tdv-legend">tail bins (narrow)</text>
          <rect x={padL + 150} y={padT + 6} width={10} height={10} fill="var(--accent)" opacity={0.4} />
          <text x={padL + 166} y={padT + 15} className="tdv-legend">middle bins (wide)</text>
        </svg>
      </div>

      <div className="tdv-metrics">
        <div className="tdv-metric"><span className="tdv-metric-label">p{targetP.toFixed(1)} estimate</span><span className="tdv-metric-value">{Math.round(estValue)}ms</span></div>
        <div className="tdv-metric"><span className="tdv-metric-label">straddling bin width</span><span className="tdv-metric-value">±{Math.max(0, binWidthMs / 2).toFixed(1)}ms</span></div>
        <div className="tdv-metric"><span className="tdv-metric-label">centroids</span><span className="tdv-metric-value">{centroids.length}</span></div>
        <div className="tdv-metric tdv-metric-dim"><span className="tdv-metric-label">state size</span><span className="tdv-metric-value tdv-metric-dimval">~{Math.round(centroids.length * 16 / 1024 * 10) / 10 || 0.1} KiB</span></div>
      </div>

      <div className="tdv-trace">
        <span className="tdv-trace-label">why it works</span>
        <span className="tdv-trace-val">
          {`The k-scale gives a centroid budget ∝ 1/(q(1−q)) — small near q=0.5, large near the tails. At p${targetP.toFixed(1)} the straddling bin spans only ${binWidthMs.toFixed(1)}ms, so linear interpolation inside it stays accurate even on a billion-point stream. Higher δ buys more centroids and tighter bins everywhere.`}
        </span>
      </div>
    </div>
  );
}
