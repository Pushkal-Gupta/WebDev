import React, { useMemo, useState } from 'react';
import { Sliders, RotateCw, MoveRight } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * RotaryEmbeddingViz
 *
 * Two vectors on a circle — a query at position i and a key at position j —
 * each rotated by (position × θ). The right panel plots q·k against the
 * offset j−i: slide either position and the marker moves; shift BOTH by the
 * same amount and the dot product does not move at all. That invariance is
 * the entire point of RoPE.
 */

const W = 720;
const H = 330;
const CX = 150;
const CY = 168;
const R = 100;
const PLOT_L = 330;
const PLOT_R = W - 26;
const PLOT_T = 64;
const PLOT_B = 272;

const Q_BASE = 0.35; // content angle of the un-rotated query (rad)
const K_BASE = 0.95; // content angle of the un-rotated key (rad)
const THETAS = [0.42, 0.21, 0.1, 0.05]; // angular frequency ladder (illustrative)
const MAX_POS = 24;

function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
}

function deg(rad) {
  return ((rad * 180) / Math.PI) % 360;
}

function Arrow({ angle, color, label, dashed }) {
  const x2 = CX + R * Math.cos(-angle);
  const y2 = CY + R * Math.sin(-angle);
  const tipA = angle + 0.18;
  const tipB = angle - 0.18;
  return (
    <g>
      <line
        x1={CX} y1={CY} x2={x2} y2={y2}
        stroke={color} strokeWidth="2.2"
        strokeDasharray={dashed ? '4 4' : 'none'}
        opacity={dashed ? 0.4 : 0.95}
      />
      {!dashed && (
        <polygon
          points={`${x2},${y2} ${CX + (R - 12) * Math.cos(-tipA)},${CY + (R - 12) * Math.sin(-tipA)} ${CX + (R - 12) * Math.cos(-tipB)},${CY + (R - 12) * Math.sin(-tipB)}`}
          fill={color}
        />
      )}
      <text
        x={CX + (R + 16) * Math.cos(-angle)}
        y={CY + (R + 16) * Math.sin(-angle) + 4}
        fontSize="11" fill={color} fontFamily="var(--mono)" fontWeight="700" textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

export default function RotaryEmbeddingViz() {
  const [posI, setPosI] = useState(12);
  const [posJ, setPosJ] = useState(8);
  const [pairM, setPairM] = useState(0);

  const theta = THETAS[pairM];
  const qAngle = Q_BASE + posI * theta;
  const kAngle = K_BASE + posJ * theta;
  const offset = posJ - posI;
  // unit-vector dot product after rotation = cos of the angle gap
  const dot = Math.cos(kAngle - qAngle);

  const curve = useMemo(() => {
    const pts = [];
    for (let off = -MAX_POS; off <= MAX_POS; off += 0.5) {
      const d = Math.cos(K_BASE - Q_BASE + off * theta);
      const x = PLOT_L + ((off + MAX_POS) / (2 * MAX_POS)) * (PLOT_R - PLOT_L);
      const y = PLOT_T + ((1 - d) / 2) * (PLOT_B - PLOT_T);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [theta]);

  const markX = PLOT_L + ((offset + MAX_POS) / (2 * MAX_POS)) * (PLOT_R - PLOT_L);
  const markY = PLOT_T + ((1 - dot) / 2) * (PLOT_B - PLOT_T);

  const shiftBoth = (d) => {
    const ni = posI + d;
    const nj = posJ + d;
    if (ni < 0 || nj < 0 || ni > MAX_POS || nj > MAX_POS) return;
    setPosI(ni);
    setPosJ(nj);
  };

  const formulaHtml = useMemo(
    () => katexHtml('(R_i q)^\\top (R_j k) = q^\\top R_{j-i}\\, k'),
    []
  );

  const caption = `Position ${posI} turns the query by ${deg(posI * theta).toFixed(0)}°; position ${posJ} turns the key by ${deg(posJ * theta).toFixed(0)}°; the dot product reads only the ${Math.abs(deg((posJ - posI) * theta)).toFixed(0)}° gap between them.`;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text x={26} y={24} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            ROTATED q AND k  ·  PAIR m={pairM}  θ={theta}
          </text>
          <text x={PLOT_L} y={24} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            q·k AS A FUNCTION OF OFFSET j−i
          </text>

          {/* circle panel */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.7" />
          <line x1={CX - R - 8} y1={CY} x2={CX + R + 8} y2={CY} stroke="var(--border)" strokeWidth="0.7" opacity="0.5" />
          <line x1={CX} y1={CY - R - 8} x2={CX} y2={CY + R + 8} stroke="var(--border)" strokeWidth="0.7" opacity="0.5" />

          <Arrow angle={Q_BASE} color="var(--hue-sky)" label="" dashed />
          <Arrow angle={K_BASE} color="var(--hue-pink)" label="" dashed />
          <Arrow angle={qAngle} color="var(--hue-sky)" label={`q @ ${posI}`} />
          <Arrow angle={kAngle} color="var(--hue-pink)" label={`k @ ${posJ}`} />

          <text x={CX} y={CY + R + 34} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.08em">
            dashed = content before rotation
          </text>

          {/* dot-vs-offset plot */}
          <rect x={PLOT_L} y={PLOT_T} width={PLOT_R - PLOT_L} height={PLOT_B - PLOT_T} fill="var(--bg)" stroke="var(--border)" strokeWidth="1" rx="6" opacity="0.8" />
          <line x1={PLOT_L} y1={(PLOT_T + PLOT_B) / 2} x2={PLOT_R} y2={(PLOT_T + PLOT_B) / 2} stroke="var(--border)" strokeWidth="0.7" opacity="0.6" />
          <line x1={(PLOT_L + PLOT_R) / 2} y1={PLOT_T} x2={(PLOT_L + PLOT_R) / 2} y2={PLOT_B} stroke="var(--border)" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.6" />
          <polyline points={curve} fill="none" stroke="var(--accent)" strokeWidth="1.8" opacity="0.85" />
          <circle cx={markX} cy={markY} r="6" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />

          <text x={PLOT_L} y={PLOT_B + 16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">−{MAX_POS}</text>
          <text x={(PLOT_L + PLOT_R) / 2} y={PLOT_B + 16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">0</text>
          <text x={PLOT_R} y={PLOT_B + 16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">+{MAX_POS}</text>
          <text x={markX} y={PLOT_T - 8} fontSize="10" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
            offset {offset > 0 ? '+' : ''}{offset} · q·k = {dot.toFixed(3)}
          </text>

          <text x={W / 2} y={H - 8} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.06em">
            {caption}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls" style={{ flexWrap: 'wrap', gap: '0.8rem' }}>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              query position i
            </span>
            <input type="range" min="0" max={MAX_POS} step="1" value={posI} onChange={(e) => setPosI(parseInt(e.target.value, 10))} />
            <span className="mlviz-slider-val">{posI}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">key position j</span>
            <input type="range" min="0" max={MAX_POS} step="1" value={posJ} onChange={(e) => setPosJ(parseInt(e.target.value, 10))} />
            <span className="mlviz-slider-val">{posJ}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <RotateCw size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              frequency pair m
            </span>
            <input type="range" min="0" max={THETAS.length - 1} step="1" value={pairM} onChange={(e) => setPairM(parseInt(e.target.value, 10))} />
            <span className="mlviz-slider-val">{pairM}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={() => shiftBoth(4)}>
            <MoveRight size={13} />
            <span>Shift both +4</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => shiftBoth(-4)}>
            <span>Shift both −4</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            same shift, same offset — q·k stays {dot.toFixed(3)}
          </span>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">q angle</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{deg(qAngle).toFixed(0)}°</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">k angle</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{deg(kAngle).toFixed(0)}°</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">offset j−i</span>
            <span className="mlviz-val">{offset}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">q·k</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>{dot.toFixed(3)}</span>
          </span>
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formulaHtml }} />
        </div>

        <div className="mlviz-hint">
          slide i alone and q·k changes · shift both positions together and nothing moves — RoPE encodes the offset, never the absolute position
        </div>
      </div>
    </div>
  );
}
