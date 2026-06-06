import React, { useRef, useState, useCallback, useEffect } from 'react';
import './MLViz.css';

const SIZE = 380;
const UNIT = 76;
const ORIGIN = SIZE / 2;
const RANGE = 2;

function snap(v) { return Math.round(v * 100) / 100; }
function fmt(v) { return Number.isFinite(v) ? snap(v).toFixed(2) : '—'; }

function toScreen(x, y) {
  return { sx: ORIGIN + x * UNIT, sy: ORIGIN - y * UNIT };
}

function fromScreen(sx, sy) {
  return { x: (sx - ORIGIN) / UNIT, y: (ORIGIN - sy) / UNIT };
}

function Grid() {
  const lines = [];
  for (let i = -RANGE; i <= RANGE; i++) {
    const { sy } = toScreen(0, i);
    const { sx } = toScreen(i, 0);
    const isAxis = i === 0;
    lines.push(
      <line key={`h${i}`} x1="0" y1={sy} x2={SIZE} y2={sy}
        stroke="var(--border)" strokeWidth={isAxis ? 1.2 : 0.4} />
    );
    lines.push(
      <line key={`v${i}`} x1={sx} y1="0" x2={sx} y2={SIZE}
        stroke="var(--border)" strokeWidth={isAxis ? 1.2 : 0.4} />
    );
    if (!isAxis) {
      lines.push(
        <text key={`tx${i}`} x={toScreen(i, 0).sx} y={ORIGIN + 14}
          fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)"
          textAnchor="middle">{i}</text>
      );
      lines.push(
        <text key={`ty${i}`} x={ORIGIN + 8} y={toScreen(0, i).sy + 3}
          fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)">{i}</text>
      );
    }
  }
  return <g>{lines}</g>;
}

function VectorArrow({ x, y, color }) {
  const { sx, sy } = toScreen(x, y);
  const angle = Math.atan2(sy - ORIGIN, sx - ORIGIN);
  const headLen = 11;
  const hx1 = sx - headLen * Math.cos(angle - 0.4);
  const hy1 = sy - headLen * Math.sin(angle - 0.4);
  const hx2 = sx - headLen * Math.cos(angle + 0.4);
  const hy2 = sy - headLen * Math.sin(angle + 0.4);
  const len = Math.hypot(x, y);
  return (
    <g>
      <line x1={ORIGIN} y1={ORIGIN} x2={sx} y2={sy}
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {len > 0.05 && (
        <polygon points={`${sx},${sy} ${hx1},${hy1} ${hx2},${hy2}`} fill={color} />
      )}
      {len > 0.3 && (
        <text
          x={sx + 10 * Math.cos(angle)}
          y={sy + 10 * Math.sin(angle) - 4}
          fontSize="13"
          fontWeight="700"
          fill={color}
          fontFamily="var(--serif, serif)"
          fontStyle="italic"
        >v</text>
      )}
    </g>
  );
}

function L1Ball({ r, active }) {
  const pts = [
    toScreen(r, 0),
    toScreen(0, r),
    toScreen(-r, 0),
    toScreen(0, -r),
  ];
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.sx},${p.sy}`).join(' ') + ' Z';
  return (
    <path d={d}
      fill={active ? 'var(--hue-pink, #ff66cc)' : 'transparent'}
      fillOpacity={active ? 0.08 : 0}
      stroke="var(--hue-pink, #ff66cc)"
      strokeWidth={active ? 2 : 1}
      strokeDasharray={active ? '0' : '4 4'}
      opacity={active ? 1 : 0.35}
    />
  );
}

function L2Ball({ r, active }) {
  return (
    <circle cx={ORIGIN} cy={ORIGIN} r={r * UNIT}
      fill={active ? 'var(--hue-sky, #5ecbff)' : 'transparent'}
      fillOpacity={active ? 0.08 : 0}
      stroke="var(--hue-sky, #5ecbff)"
      strokeWidth={active ? 2 : 1}
      strokeDasharray={active ? '0' : '4 4'}
      opacity={active ? 1 : 0.35}
    />
  );
}

function LInfBall({ r, active }) {
  const a = toScreen(-r, r);
  const b = toScreen(r, r);
  const c = toScreen(r, -r);
  const d = toScreen(-r, -r);
  const path = `M${a.sx},${a.sy} L${b.sx},${b.sy} L${c.sx},${c.sy} L${d.sx},${d.sy} Z`;
  return (
    <path d={path}
      fill={active ? 'var(--accent)' : 'transparent'}
      fillOpacity={active ? 0.08 : 0}
      stroke="var(--accent)"
      strokeWidth={active ? 2 : 1}
      strokeDasharray={active ? '0' : '4 4'}
      opacity={active ? 1 : 0.35}
    />
  );
}

export default function NormBall() {
  const svgRef = useRef(null);
  const [v, setV] = useState({ x: 1.2, y: 0.8 });
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState({ l1: true, l2: true, linf: true });

  const handleMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (SIZE / rect.width);
    const sy = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (SIZE / rect.height);
    const { x, y } = fromScreen(sx, sy);
    const clamp = (val) => Math.max(-RANGE, Math.min(RANGE, Math.round(val * 20) / 20));
    setV({ x: clamp(x), y: clamp(y) });
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
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

  const l1 = Math.abs(v.x) + Math.abs(v.y);
  const l2 = Math.hypot(v.x, v.y);
  const linf = Math.max(Math.abs(v.x), Math.abs(v.y));

  let dominant = 'l1';
  if (l2 >= l1 && l2 >= linf) dominant = 'l2';
  else if (linf >= l1 && linf >= l2) dominant = 'linf';
  else dominant = 'l1';

  const { sx: vsx, sy: vsy } = toScreen(v.x, v.y);

  const toggle = (k) => setActive((s) => ({ ...s, [k]: !s[k] }));

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

          {active.l1 && <L1Ball r={l1} active />}
          {active.l2 && <L2Ball r={l2} active />}
          {active.linf && <LInfBall r={linf} active />}

          <circle cx={ORIGIN} cy={ORIGIN} r="2.5" fill="var(--text-dim)" />

          <VectorArrow x={v.x} y={v.y} color="var(--text-main)" />

          <circle
            cx={vsx} cy={vsy} r="10"
            fill="var(--text-main)" opacity="0.18"
            style={{ cursor: 'grab' }}
            onMouseDown={() => setDragging(true)}
            onTouchStart={() => setDragging(true)}
          />
          <circle
            cx={vsx} cy={vsy} r="4"
            fill="var(--text-main)"
            style={{ cursor: 'grab', pointerEvents: 'none' }}
          />
        </svg>
      </div>

      <div className="mlviz-toggles">
        <button
          type="button"
          className={`mlviz-toggle${active.l1 ? ' is-on' : ''}`}
          onClick={() => toggle('l1')}
          style={{ '--toggle-color': 'var(--hue-pink, #ff66cc)' }}
        >
          <span className="mlviz-toggle-dot" />
          L1 · diamond
        </button>
        <button
          type="button"
          className={`mlviz-toggle${active.l2 ? ' is-on' : ''}`}
          onClick={() => toggle('l2')}
          style={{ '--toggle-color': 'var(--hue-sky, #5ecbff)' }}
        >
          <span className="mlviz-toggle-dot" />
          L2 · circle
        </button>
        <button
          type="button"
          className={`mlviz-toggle${active.linf ? ' is-on' : ''}`}
          onClick={() => toggle('linf')}
          style={{ '--toggle-color': 'var(--accent)' }}
        >
          <span className="mlviz-toggle-dot" />
          L∞ · square
        </button>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--text-main)' }}>v</span>
          <span className="mlviz-val">[{fmt(v.x)}, {fmt(v.y)}]</span>
        </div>
        <div className={`mlviz-row mlviz-norm-row${dominant === 'l1' ? ' is-dominant' : ''}`}>
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink, #ff66cc)' }}>‖v‖₁</span>
          <span className="mlviz-val">{fmt(l1)}</span>
          <span className="mlviz-sub">|x| + |y|</span>
        </div>
        <div className={`mlviz-row mlviz-norm-row${dominant === 'l2' ? ' is-dominant' : ''}`}>
          <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)' }}>‖v‖₂</span>
          <span className="mlviz-val">{fmt(l2)}</span>
          <span className="mlviz-sub">√(x² + y²)</span>
        </div>
        <div className={`mlviz-row mlviz-norm-row${dominant === 'linf' ? ' is-dominant' : ''}`}>
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>‖v‖∞</span>
          <span className="mlviz-val">{fmt(linf)}</span>
          <span className="mlviz-sub">max(|x|, |y|)</span>
        </div>
        <div className="mlviz-hint">drag the point · toggle a norm to see its unit ball at radius ‖v‖</div>
      </div>
    </div>
  );
}
