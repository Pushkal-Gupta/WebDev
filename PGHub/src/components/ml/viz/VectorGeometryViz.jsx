import React, { useState } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import './MLViz.css';

function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

export default function VectorGeometryViz() {
  const [v, setV] = useState([3, 2]);
  const [seed, setSeed] = useState(7);

  const W = 520;
  const H = 380;
  const PAD = 44;

  const span = Math.max(4, Math.abs(v[0]) + 1, Math.abs(v[1]) + 1);
  const minX = -1;
  const maxX = span;
  const minY = -1;
  const maxY = span;
  const xScale = (W - 2 * PAD) / (maxX - minX);
  const yScale = (H - 2 * PAD) / (maxY - minY);
  const sx = (x) => PAD + (x - minX) * xScale;
  const sy = (y) => H - PAD - (y - minY) * yScale;

  const len = Math.hypot(v[0], v[1]);
  const angleRad = Math.atan2(v[1], v[0]);
  const angleDeg = (angleRad * 180) / Math.PI;

  const reshuffle = () => {
    const r = lcg(seed + 1);
    setV([1 + Math.floor(r() * 4), 1 + Math.floor(r() * 4)]);
    setSeed(seed + 1);
  };

  const gridX = [];
  for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) gridX.push(x);
  const gridY = [];
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) gridY.push(y);

  const headX = sx(v[0]);
  const headY = sy(v[1]);
  const originX = sx(0);
  const originY = sy(0);

  const midX = (originX + headX) / 2;
  const midY = (originY + headY) / 2;
  const normLen = Math.hypot(headX - originX, headY - originY) || 1;
  const perpX = -(headY - originY) / normLen;
  const perpY = (headX - originX) / normLen;
  const labelOffset = 18;
  const lenLabelX = midX + perpX * labelOffset;
  const lenLabelY = midY + perpY * labelOffset;

  const arcR = Math.min(38, 0.55 * Math.min(headX - originX, originY - headY) || 30);
  const arcEndX = originX + arcR;
  const arcEndY = originY;
  const arcStartX = originX + arcR * Math.cos(-angleRad);
  const arcStartY = originY + arcR * Math.sin(-angleRad);
  const arcLabelAngle = -angleRad / 2;
  const arcLabelR = arcR + 14;
  const arcLabelX = originX + arcLabelR * Math.cos(arcLabelAngle);
  const arcLabelY = originY + arcLabelR * Math.sin(arcLabelAngle);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="vg-arrow-v" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="vg-arrow-x" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-sky)" />
            </marker>
            <marker id="vg-arrow-y" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {gridX.map((x) => (
            <line key={`vgx${x}`} x1={sx(x)} y1={PAD - 8} x2={sx(x)} y2={H - PAD + 8} stroke="var(--border)" strokeWidth="0.6" opacity="0.45" />
          ))}
          {gridY.map((y) => (
            <line key={`vgy${y}`} x1={PAD - 8} y1={sy(y)} x2={W - PAD + 8} y2={sy(y)} stroke="var(--border)" strokeWidth="0.6" opacity="0.45" />
          ))}

          <line x1={PAD - 8} y1={sy(0)} x2={W - PAD + 8} y2={sy(0)} stroke="var(--text-dim)" strokeWidth="1.2" />
          <line x1={sx(0)} y1={PAD - 8} x2={sx(0)} y2={H - PAD + 8} stroke="var(--text-dim)" strokeWidth="1.2" />

          {gridX.map((x) => x !== 0 && (
            <text key={`vgtx${x}`} x={sx(x)} y={sy(0) + 18} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="middle">{x}</text>
          ))}
          {gridY.map((y) => y !== 0 && (
            <text key={`vgty${y}`} x={sx(0) - 12} y={sy(y) + 4} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">{y}</text>
          ))}
          <text x={sx(0) - 12} y={sy(0) + 18} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">0</text>

          <line x1={originX} y1={originY} x2={sx(v[0])} y2={originY} stroke="var(--hue-sky)" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#vg-arrow-x)" opacity="0.85" />
          <line x1={sx(v[0])} y1={originY} x2={sx(v[0])} y2={sy(v[1])} stroke="var(--hue-pink)" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#vg-arrow-y)" opacity="0.85" />

          <text x={(originX + sx(v[0])) / 2} y={originY + 16} fontSize="11.5" fontFamily="var(--serif)" fontStyle="italic" fontWeight="700" fill="var(--hue-sky)" textAnchor="middle">{v[0]}</text>
          <text x={sx(v[0]) + 8} y={(originY + sy(v[1])) / 2 + 4} fontSize="11.5" fontFamily="var(--serif)" fontStyle="italic" fontWeight="700" fill="var(--hue-pink)" textAnchor="start">{v[1]}</text>

          <path
            d={`M ${arcEndX} ${arcEndY} A ${arcR} ${arcR} 0 0 0 ${arcStartX} ${arcStartY}`}
            fill="none"
            stroke="var(--hue-violet, var(--accent))"
            strokeWidth="1.8"
            opacity="0.85"
          />
          <text x={arcLabelX} y={arcLabelY + 4} fontSize="12" fontFamily="var(--serif)" fontStyle="italic" fontWeight="700" fill="var(--hue-violet, var(--accent))" textAnchor="middle">θ</text>

          <line x1={originX} y1={originY} x2={headX} y2={headY} stroke="var(--accent)" strokeWidth="3.5" markerEnd="url(#vg-arrow-v)" />
          <circle cx={headX} cy={headY} r="4.5" fill="var(--accent)" />
          <circle cx={originX} cy={originY} r="3" fill="var(--text-main)" />

          <text x={lenLabelX} y={lenLabelY + 4} fontSize="13" fontFamily="var(--serif)" fontWeight="800" fontStyle="italic" fill="var(--accent)" textAnchor="middle">|v|</text>
          <text x={headX + 10} y={headY - 8} fontSize="13" fontFamily="var(--serif)" fontWeight="700" fill="var(--accent)">v = [{v[0]}, {v[1]}]</text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>v</span>
          <span className="mlviz-val">[{v[0]}, {v[1]}]</span>
          <span className="mlviz-sub">tail at origin, head at ({v[0]}, {v[1]})</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>|v|</span>
          <span className="mlviz-val">= sqrt({v[0]}&sup2; + {v[1]}&sup2;) = sqrt({v[0] * v[0] + v[1] * v[1]}) &asymp; {len.toFixed(3)}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-violet, var(--accent))' }}>θ</span>
          <span className="mlviz-val">= atan2({v[1]}, {v[0]}) &asymp; {angleDeg.toFixed(1)}&deg;</span>
          <span className="mlviz-sub">measured from +x axis, counter-clockwise</span>
        </div>
      </div>

      <div className="mlviz-controls">
        <button type="button" className="mlviz-btn" onClick={reshuffle}><Shuffle size={14} /> New vector</button>
        <button type="button" className="mlviz-btn" onClick={() => { setV([3, 2]); setSeed(7); }}><RotateCcw size={14} /> Reset</button>
      </div>
    </div>
  );
}
