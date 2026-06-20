import React, { useRef, useState, useCallback, useEffect } from 'react';
import './MLViz.css';

const SIZE = 360;
const UNIT = 36;
const ORIGIN = SIZE / 2;

function snap(v) { return Math.round(v * 10) / 10; }

function toScreen(x, y) {
  return { sx: ORIGIN + x * UNIT, sy: ORIGIN - y * UNIT };
}

function fromScreen(sx, sy) {
  return { x: (sx - ORIGIN) / UNIT, y: (ORIGIN - sy) / UNIT };
}

function VectorArrow({ x, y, color, label, opacity = 1 }) {
  const { sx, sy } = toScreen(x, y);
  const angle = Math.atan2(sy - ORIGIN, sx - ORIGIN);
  const headLen = 10;
  const hx1 = sx - headLen * Math.cos(angle - 0.4);
  const hy1 = sy - headLen * Math.sin(angle - 0.4);
  const hx2 = sx - headLen * Math.cos(angle + 0.4);
  const hy2 = sy - headLen * Math.sin(angle + 0.4);
  const len = Math.hypot(x, y);
  return (
    <g opacity={opacity}>
      <line x1={ORIGIN} y1={ORIGIN} x2={sx} y2={sy} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <polygon points={`${sx},${sy} ${hx1},${hy1} ${hx2},${hy2}`} fill={color} />
      {label && len > 0.4 && (
        <text
          x={sx + 8 * Math.cos(angle)}
          y={sy + 8 * Math.sin(angle) - 4}
          fontSize="13"
          fontWeight="700"
          fill={color}
          fontFamily="var(--serif, serif)"
          fontStyle="italic"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Grid() {
  const lines = [];
  for (let i = -5; i <= 5; i++) {
    const { sy } = toScreen(0, i);
    const { sx } = toScreen(i, 0);
    lines.push(<line key={`h${i}`} x1="0" y1={sy} x2={SIZE} y2={sy} stroke="var(--border)" strokeWidth={i === 0 ? 1.2 : 0.4} />);
    lines.push(<line key={`v${i}`} x1={sx} y1="0" x2={sx} y2={SIZE} stroke="var(--border)" strokeWidth={i === 0 ? 1.2 : 0.4} />);
  }
  return <g>{lines}</g>;
}

export default function VectorPlayground({ mode = 'single' }) {
  const svgRef = useRef(null);
  const [v, setV] = useState({ x: 3, y: 2 });
  const [u, setU] = useState({ x: 1, y: 3 });
  const [dragging, setDragging] = useState(null);

  const handleMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (SIZE / rect.width);
    const sy = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (SIZE / rect.height);
    const { x, y } = fromScreen(sx, sy);
    const clamped = { x: Math.max(-5, Math.min(5, snap(x))), y: Math.max(-5, Math.min(5, snap(y))) };
    if (dragging === 'v') setV(clamped);
    if (dragging === 'u') setU(clamped);
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, handleMove]);

  const lenV = Math.hypot(v.x, v.y);
  const lenU = Math.hypot(u.x, u.y);
  const angV = (Math.atan2(v.y, v.x) * 180) / Math.PI;
  const angU = (Math.atan2(u.y, u.x) * 180) / Math.PI;
  const dot = v.x * u.x + v.y * u.y;
  const cosSim = lenV * lenU === 0 ? 0 : dot / (lenV * lenU);
  const angleBetween = (Math.acos(Math.max(-1, Math.min(1, cosSim))) * 180) / Math.PI;
  const sum = { x: v.x + u.x, y: v.y + u.y };

  const showU = mode === 'dot' || mode === 'add';
  const showSum = mode === 'add';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mlviz-svg"
          onMouseDown={(e) => { e.preventDefault(); }}
        >
          <Grid />
          <circle cx={ORIGIN} cy={ORIGIN} r="3" fill="var(--text-dim)" />

          {showSum && (
            <>
              <line
                x1={toScreen(v.x, v.y).sx} y1={toScreen(v.x, v.y).sy}
                x2={toScreen(sum.x, sum.y).sx} y2={toScreen(sum.x, sum.y).sy}
                stroke="var(--hue-pink, #ff66cc)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7"
              />
              <line
                x1={toScreen(u.x, u.y).sx} y1={toScreen(u.x, u.y).sy}
                x2={toScreen(sum.x, sum.y).sx} y2={toScreen(sum.x, sum.y).sy}
                stroke="var(--hue-pink, #ff66cc)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7"
              />
              <VectorArrow x={sum.x} y={sum.y} color="var(--hue-pink, #ff66cc)" label="v+u" opacity="0.85" />
            </>
          )}

          <VectorArrow x={v.x} y={v.y} color="var(--accent)" label="v" />
          {showU && <VectorArrow x={u.x} y={u.y} color="var(--hue-sky, #5ecbff)" label="u" />}

          {/* draggable handles */}
          <circle
            cx={toScreen(v.x, v.y).sx} cy={toScreen(v.x, v.y).sy} r="9"
            fill="var(--accent)" opacity="0.18"
            style={{ cursor: 'grab' }}
            onMouseDown={() => setDragging('v')}
            onTouchStart={() => setDragging('v')}
          />
          {showU && (
            <circle
              cx={toScreen(u.x, u.y).sx} cy={toScreen(u.x, u.y).sy} r="9"
              fill="var(--hue-sky, #5ecbff)" opacity="0.18"
              style={{ cursor: 'grab' }}
              onMouseDown={() => setDragging('u')}
              onTouchStart={() => setDragging('u')}
            />
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>v</span>
          <span className="mlviz-val">[{snap(v.x)}, {snap(v.y)}]</span>
          <span className="mlviz-sub">‖v‖ = {snap(lenV)}</span>
          <span className="mlviz-sub">θ = {snap(angV)}°</span>
        </div>
        {showU && (
          <div className="mlviz-row">
            <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)' }}>u</span>
            <span className="mlviz-val">[{snap(u.x)}, {snap(u.y)}]</span>
            <span className="mlviz-sub">‖u‖ = {snap(lenU)}</span>
            <span className="mlviz-sub">θ = {snap(angU)}°</span>
          </div>
        )}
        {mode === 'dot' && (
          <div className="mlviz-row mlviz-row-hi">
            <span className="mlviz-tag">v · u</span>
            <span className="mlviz-val">{snap(dot)}</span>
            <span className="mlviz-sub">cos θ = {snap(cosSim)}</span>
            <span className="mlviz-sub">angle = {snap(angleBetween)}°</span>
          </div>
        )}
        {mode === 'add' && (
          <div className="mlviz-row mlviz-row-hi">
            <span className="mlviz-tag" style={{ color: 'var(--hue-pink, #ff66cc)' }}>v + u</span>
            <span className="mlviz-val">[{snap(sum.x)}, {snap(sum.y)}]</span>
            <span className="mlviz-sub">tip-to-tail</span>
          </div>
        )}
        <div className="mlviz-hint">drag the dot{showU ? 's' : ''}</div>
      </div>
    </div>
  );
}
