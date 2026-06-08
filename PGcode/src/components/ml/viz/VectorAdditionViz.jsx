import React, { useState } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';

function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

export default function VectorAdditionViz() {
  const [a, setA] = useState([3, 1]);
  const [b, setB] = useState([1, 2]);
  const [seed, setSeed] = useState(7);

  const sum = [a[0] + b[0], a[1] + b[1]];

  const W = 520;
  const H = 380;
  const PAD = 44;
  const minX = Math.min(0, a[0], sum[0]) - 1;
  const maxX = Math.max(0, a[0], sum[0]) + 1;
  const minY = Math.min(0, a[1], sum[1]) - 1;
  const maxY = Math.max(0, a[1], sum[1]) + 1;
  const xScale = (W - 2 * PAD) / (maxX - minX);
  const yScale = (H - 2 * PAD) / (maxY - minY);
  const sx = (x) => PAD + (x - minX) * xScale;
  const sy = (y) => H - PAD - (y - minY) * yScale;

  const reshuffle = () => {
    const r = lcg(seed + 1);
    setA([1 + Math.floor(r() * 4), 1 + Math.floor(r() * 3)]);
    setB([1 + Math.floor(r() * 3), 1 + Math.floor(r() * 4)]);
    setSeed(seed + 1);
  };

  const gridX = [];
  for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) gridX.push(x);
  const gridY = [];
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) gridY.push(y);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="va-arrow-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-sky)" />
            </marker>
            <marker id="va-arrow-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink)" />
            </marker>
            <marker id="va-arrow-sum" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>

          {gridX.map((x) => (
            <line key={`vx${x}`} x1={sx(x)} y1={PAD - 8} x2={sx(x)} y2={H - PAD + 8} stroke="var(--border)" strokeWidth="0.6" opacity="0.45" />
          ))}
          {gridY.map((y) => (
            <line key={`vy${y}`} x1={PAD - 8} y1={sy(y)} x2={W - PAD + 8} y2={sy(y)} stroke="var(--border)" strokeWidth="0.6" opacity="0.45" />
          ))}

          <line x1={PAD - 8} y1={sy(0)} x2={W - PAD + 8} y2={sy(0)} stroke="var(--text-dim)" strokeWidth="1.2" />
          <line x1={sx(0)} y1={PAD - 8} x2={sx(0)} y2={H - PAD + 8} stroke="var(--text-dim)" strokeWidth="1.2" />

          {gridX.map((x) => x !== 0 && (
            <text key={`tx${x}`} x={sx(x)} y={sy(0) + 18} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="middle">{x}</text>
          ))}
          {gridY.map((y) => y !== 0 && (
            <text key={`ty${y}`} x={sx(0) - 12} y={sy(y) + 4} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">{y}</text>
          ))}
          <text x={sx(0) - 12} y={sy(0) + 18} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">0</text>

          <line x1={sx(0)} y1={sy(0)} x2={sx(a[0])} y2={sy(a[1])} stroke="var(--hue-sky)" strokeWidth="3" markerEnd="url(#va-arrow-a)" />
          <line x1={sx(a[0])} y1={sy(a[1])} x2={sx(sum[0])} y2={sy(sum[1])} stroke="var(--hue-pink)" strokeWidth="3" markerEnd="url(#va-arrow-b)" />
          <line x1={sx(0)} y1={sy(0)} x2={sx(sum[0])} y2={sy(sum[1])} stroke="var(--accent)" strokeWidth="3.5" strokeDasharray="0" opacity="0.9" markerEnd="url(#va-arrow-sum)" />

          <circle cx={sx(a[0])} cy={sy(a[1])} r="4" fill="var(--hue-sky)" />
          <circle cx={sx(sum[0])} cy={sy(sum[1])} r="4.5" fill="var(--accent)" />

          <text x={(sx(0) + sx(a[0])) / 2 - 14} y={(sy(0) + sy(a[1])) / 2 - 8} fontSize="13" fontFamily="var(--serif)" fontWeight="700" fill="var(--hue-sky)">a = [{a[0]}, {a[1]}]</text>
          <text x={(sx(a[0]) + sx(sum[0])) / 2 + 10} y={(sy(a[1]) + sy(sum[1])) / 2 - 6} fontSize="13" fontFamily="var(--serif)" fontWeight="700" fill="var(--hue-pink)">b = [{b[0]}, {b[1]}]</text>
          <text x={sx(sum[0]) + 8} y={sy(sum[1]) - 6} fontSize="13" fontFamily="var(--serif)" fontWeight="800" fill="var(--accent)">a + b = [{sum[0]}, {sum[1]}]</text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
          <span><span style={{ color: 'var(--hue-sky)' }}>a</span> = [{a[0]}, {a[1]}]</span>
          <span><span style={{ color: 'var(--hue-pink)' }}>b</span> = [{b[0]}, {b[1]}]</span>
          <span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>a + b</span> = [{sum[0]}, {sum[1]}]</span>
        </div>
      </div>

      <div className="mlviz-controls">
        <button type="button" className="mlviz-btn" onClick={reshuffle}><Shuffle size={14} /> New vectors</button>
        <button type="button" className="mlviz-btn" onClick={() => { setA([3, 1]); setB([1, 2]); setSeed(7); }}><RotateCcw size={14} /> Reset</button>
      </div>
    </div>
  );
}
