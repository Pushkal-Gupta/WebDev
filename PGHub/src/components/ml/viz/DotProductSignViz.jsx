import React, { useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const PANEL_W = 200;
const PANEL_H = 200;
const PAD = 22;
const SPAN = 3.2;
const xScale = (PANEL_W - 2 * PAD) / (2 * SPAN);
const yScale = (PANEL_H - 2 * PAD) / (2 * SPAN);
const sx = (x) => PAD + (x + SPAN) * xScale;
const sy = (y) => PANEL_H - PAD - (y + SPAN) * yScale;

function rotate([x, y], deg) {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function colorFor(sign) {
  if (sign > 0.05) return 'var(--easy, #2dd4bf)';
  if (sign < -0.05) return 'var(--hard, #f87171)';
  return 'var(--warning, #facc15)';
}

function labelFor(d) {
  if (d > 0.05) return { text: 'u·v > 0', tag: 'aligned', tone: 'positive' };
  if (d < -0.05) return { text: 'u·v < 0', tag: 'anti-aligned', tone: 'negative' };
  return { text: 'u·v = 0', tag: 'orthogonal', tone: 'zero' };
}

function Panel({ u, v, idPrefix }) {
  const d = dot(u, v);
  const c = colorFor(d);
  const info = labelFor(d);
  const cosTheta = d / (Math.hypot(...u) * Math.hypot(...v) || 1);
  const angleDeg = (Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180) / Math.PI;
  const arrowId = `dps-arrow-${idPrefix}`;
  const arrowIdV = `dps-arrow-v-${idPrefix}`;

  return (
    <div className="dps-panel">
      <div className="dps-panel-label" style={{ color: c }}>{info.text}</div>
      <svg viewBox={`0 0 ${PANEL_W} ${PANEL_H}`} className="dps-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
          </marker>
          <marker id={arrowIdV} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={c} />
          </marker>
        </defs>

        <line x1={PAD - 4} y1={sy(0)} x2={PANEL_W - PAD + 4} y2={sy(0)} stroke="var(--text-dim)" strokeWidth="0.8" opacity="0.55" />
        <line x1={sx(0)} y1={PAD - 4} x2={sx(0)} y2={PANEL_H - PAD + 4} stroke="var(--text-dim)" strokeWidth="0.8" opacity="0.55" />

        {[-2, -1, 1, 2].map((g) => (
          <line key={`gx-${g}`} x1={sx(g)} y1={PAD - 2} x2={sx(g)} y2={PANEL_H - PAD + 2} stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
        ))}
        {[-2, -1, 1, 2].map((g) => (
          <line key={`gy-${g}`} x1={PAD - 2} y1={sy(g)} x2={PANEL_W - PAD + 2} y2={sy(g)} stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
        ))}

        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(u[0])}
          y2={sy(u[1])}
          stroke="var(--accent)"
          strokeWidth="2.4"
          markerEnd={`url(#${arrowId})`}
        />
        <text
          x={sx(u[0]) + 6}
          y={sy(u[1]) - 6}
          fontSize="12"
          fontFamily="var(--serif)"
          fontStyle="italic"
          fontWeight="700"
          fill="var(--accent)"
        >
          u
        </text>

        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(v[0])}
          y2={sy(v[1])}
          stroke={c}
          strokeWidth="2.4"
          markerEnd={`url(#${arrowIdV})`}
        />
        <text
          x={sx(v[0]) + 6}
          y={sy(v[1]) - 6}
          fontSize="12"
          fontFamily="var(--serif)"
          fontStyle="italic"
          fontWeight="700"
          fill={c}
        >
          v
        </text>

        <circle cx={sx(0)} cy={sy(0)} r="2.5" fill="var(--text-main)" />

        <text x={PANEL_W / 2} y={PANEL_H - 6} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="middle">
          {info.tag} · θ ≈ {angleDeg.toFixed(0)}°
        </text>
      </svg>
      <div className="dps-readout">
        <span className="dps-readout-num" style={{ color: c }}>u·v = {d.toFixed(2)}</span>
        <span className="dps-readout-sub">cos θ = {cosTheta.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function DotProductSignViz() {
  const [angle, setAngle] = useState(0);

  const u = useMemo(() => [2.2, 0], []);

  const panels = useMemo(() => {
    return [
      { id: 'a', label: 'aligned', delta: 30 + angle * 0.4 },
      { id: 'b', label: 'orthogonal', delta: 90 + angle * 0.4 },
      { id: 'c', label: 'anti-aligned', delta: 150 + angle * 0.4 },
    ].map((p) => ({ ...p, v: rotate([2.0, 0], p.delta) }));
  }, [angle]);

  return (
    <div className="mlviz-wrap">
      <div className="dps-grid">
        {panels.map((p) => (
          <Panel key={p.id} u={u} v={p.v} idPrefix={p.id} />
        ))}
      </div>

      <div className="mlviz-readout" style={{ padding: '0.5rem 1rem' }}>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>u</span>
          <span className="mlviz-val">= [{u[0].toFixed(1)}, {u[1].toFixed(1)}] is fixed.</span>
          <span className="mlviz-sub">v rotates around the origin; watch the sign of u·v flip.</span>
        </div>
      </div>

      <div className="mlviz-controls" style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="mlviz-slider" style={{ flex: 1, minWidth: 0 }}>
          <span className="mlviz-slider-label">rotate v</span>
          <input
            type="range"
            min="-60"
            max="60"
            step="1"
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{angle >= 0 ? '+' : ''}{angle}°</span>
        </div>
        <button type="button" className="mlviz-btn" onClick={() => setAngle(0)}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
