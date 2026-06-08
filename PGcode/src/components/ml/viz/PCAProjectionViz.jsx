import React, { useMemo, useState } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import './MLViz.css';

function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

function gaussian(rand) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildCloud(seed, sigma1, sigma2, angleDeg) {
  const rand = lcg(seed);
  const N = 90;
  const a = (angleDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const pts = [];
  for (let i = 0; i < N; i++) {
    const x0 = gaussian(rand) * sigma1;
    const y0 = gaussian(rand) * sigma2;
    pts.push([x0 * ca - y0 * sa, x0 * sa + y0 * ca]);
  }
  return pts;
}

const W = 540;
const H = 380;
const PAD = 36;
const SPAN = 4.2;
const xScale = (W - 2 * PAD) / (2 * SPAN);
const yScale = (H - 2 * PAD) / (2 * SPAN);
const sx = (x) => PAD + (x + SPAN) * xScale;
const sy = (y) => H - PAD - (y + SPAN) * yScale;

export default function PCAProjectionViz() {
  const [seed, setSeed] = useState(11);
  const [angle, setAngle] = useState(28);
  const [selected, setSelected] = useState(null);
  const [showProjection, setShowProjection] = useState(true);

  const sigma1 = 1.7;
  const sigma2 = 0.45;

  const points = useMemo(() => buildCloud(seed, sigma1, sigma2, angle), [seed, angle]);

  const a = (angle * Math.PI) / 180;
  const v1 = [Math.cos(a), Math.sin(a)];
  const v2 = [-Math.sin(a), Math.cos(a)];

  const lambda1 = sigma1 * sigma1;
  const lambda2 = sigma2 * sigma2;
  const explained = lambda1 / (lambda1 + lambda2);

  const proj = (p, v) => p[0] * v[0] + p[1] * v[1];
  const recon = (p) => {
    const z = proj(p, v1);
    return [z * v1[0], z * v1[1]];
  };

  const reshuffle = () => setSeed(seed + 1);

  const sel = selected !== null ? points[selected] : null;
  const selRecon = sel ? recon(sel) : null;
  const selScore = sel ? proj(sel, v1) : 0;

  const arrowMag1 = 2.6;
  const arrowMag2 = 1.0;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="pca-arrow-v1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="pca-arrow-v2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink, var(--warning))" />
            </marker>
          </defs>

          {[-3, -2, -1, 1, 2, 3].map((g) => (
            <line key={`gx${g}`} x1={sx(g)} y1={PAD - 4} x2={sx(g)} y2={H - PAD + 4} stroke="var(--border)" strokeWidth="0.5" opacity="0.35" />
          ))}
          {[-3, -2, -1, 1, 2, 3].map((g) => (
            <line key={`gy${g}`} x1={PAD - 4} y1={sy(g)} x2={W - PAD + 4} y2={sy(g)} stroke="var(--border)" strokeWidth="0.5" opacity="0.35" />
          ))}

          <line x1={PAD - 4} y1={sy(0)} x2={W - PAD + 4} y2={sy(0)} stroke="var(--text-dim)" strokeWidth="1" opacity="0.7" />
          <line x1={sx(0)} y1={PAD - 4} x2={sx(0)} y2={H - PAD + 4} stroke="var(--text-dim)" strokeWidth="1" opacity="0.7" />

          {showProjection && (
            <line
              x1={sx(-v1[0] * SPAN * 0.9)}
              y1={sy(-v1[1] * SPAN * 0.9)}
              x2={sx(v1[0] * SPAN * 0.9)}
              y2={sy(v1[1] * SPAN * 0.9)}
              stroke="var(--accent)"
              strokeWidth="1.2"
              strokeDasharray="6 4"
              opacity="0.45"
            />
          )}

          {points.map((p, i) => {
            const isSel = i === selected;
            return (
              <circle
                key={`pt${i}`}
                cx={sx(p[0])}
                cy={sy(p[1])}
                r={isSel ? 5.5 : 2.8}
                fill={isSel ? 'var(--warning, #facc15)' : 'var(--text-main)'}
                opacity={isSel ? 1 : 0.55}
                stroke={isSel ? 'var(--bg)' : 'none'}
                strokeWidth={isSel ? 1.5 : 0}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(i === selected ? null : i)}
              />
            );
          })}

          {sel && showProjection && (
            <>
              <line
                x1={sx(sel[0])}
                y1={sy(sel[1])}
                x2={sx(selRecon[0])}
                y2={sy(selRecon[1])}
                stroke="var(--warning, #facc15)"
                strokeWidth="1.4"
                strokeDasharray="3 3"
              />
              <circle cx={sx(selRecon[0])} cy={sy(selRecon[1])} r="5" fill="var(--easy, #2dd4bf)" stroke="var(--bg)" strokeWidth="1.5" />
              <text
                x={sx(selRecon[0]) + 9}
                y={sy(selRecon[1]) - 8}
                fontSize="11"
                fontFamily="var(--mono)"
                fontWeight="700"
                fill="var(--easy, #2dd4bf)"
              >
                x̂
              </text>
            </>
          )}

          <line
            x1={sx(0)}
            y1={sy(0)}
            x2={sx(v1[0] * arrowMag1)}
            y2={sy(v1[1] * arrowMag1)}
            stroke="var(--accent)"
            strokeWidth="3"
            markerEnd="url(#pca-arrow-v1)"
          />
          <text
            x={sx(v1[0] * arrowMag1) + 8}
            y={sy(v1[1] * arrowMag1) - 6}
            fontSize="13"
            fontFamily="var(--serif)"
            fontStyle="italic"
            fontWeight="800"
            fill="var(--accent)"
          >
            v₁
          </text>

          <line
            x1={sx(0)}
            y1={sy(0)}
            x2={sx(v2[0] * arrowMag2)}
            y2={sy(v2[1] * arrowMag2)}
            stroke="var(--hue-pink, var(--warning))"
            strokeWidth="2.2"
            markerEnd="url(#pca-arrow-v2)"
          />
          <text
            x={sx(v2[0] * arrowMag2) + 8}
            y={sy(v2[1] * arrowMag2) - 4}
            fontSize="12"
            fontFamily="var(--serif)"
            fontStyle="italic"
            fontWeight="700"
            fill="var(--hue-pink, var(--warning))"
          >
            v₂
          </text>

          <circle cx={sx(0)} cy={sy(0)} r="3" fill="var(--text-main)" />

          <text x={W - PAD} y={PAD - 8} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">
            click a point to project onto v₁
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>v₁</span>
          <span className="mlviz-val">λ₁ = {lambda1.toFixed(2)}</span>
          <span className="mlviz-sub">long axis — keeps {(explained * 100).toFixed(1)}% of variance on its own</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink, var(--warning))' }}>v₂</span>
          <span className="mlviz-val">λ₂ = {lambda2.toFixed(2)}</span>
          <span className="mlviz-sub">short axis — {((1 - explained) * 100).toFixed(1)}% variance, drop it to compress 2D → 1D</span>
        </div>
        {sel ? (
          <div className="mlviz-row mlviz-row-hi">
            <span className="mlviz-tag" style={{ color: 'var(--warning, #facc15)' }}>x</span>
            <span className="mlviz-val">
              = [{sel[0].toFixed(2)}, {sel[1].toFixed(2)}] · z = v₁·x = {selScore.toFixed(2)}
            </span>
            <span className="mlviz-sub">
              x̂ = z·v₁ = [{selRecon[0].toFixed(2)}, {selRecon[1].toFixed(2)}]
            </span>
          </div>
        ) : (
          <div className="mlviz-row mlviz-row-hi">
            <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>x</span>
            <span className="mlviz-val">click any point</span>
            <span className="mlviz-sub">to see its projection score z and reconstruction x̂ on the v₁ line</span>
          </div>
        )}
      </div>

      <div className="mt-controls">
        <div className="mlviz-slider" style={{ flex: 1, minWidth: 200 }}>
          <span className="mlviz-slider-label">cloud angle</span>
          <input
            type="range"
            min="-90"
            max="90"
            step="1"
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{angle}°</span>
        </div>
        <button
          type="button"
          className="mlviz-btn"
          onClick={() => setShowProjection(!showProjection)}
        >
          {showProjection ? 'hide' : 'show'} v₁ line
        </button>
        <button type="button" className="mlviz-btn" onClick={reshuffle}>
          <Shuffle size={14} /> Resample
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={() => { setSeed(11); setAngle(28); setSelected(null); setShowProjection(true); }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
