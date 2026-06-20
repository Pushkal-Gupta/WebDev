import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import './MLViz.css';

const W = 520;
const H = 360;
const PAD = 24;

const COLOR_CTRL = 'var(--accent)';
const COLOR_L1 = 'var(--hue-sky, #5ecbff)';
const COLOR_L2 = 'var(--hue-violet, #b288ff)';
const COLOR_L3 = 'var(--hue-pink, #ff66cc)';
const COLOR_CURVE = 'var(--hue-mint, #5ee0b8)';
const COLOR_GRID = 'var(--border)';

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
function snap(v) { return Math.round(v * 100) / 100; }

function casteljau(P, t) {
  const a = lerp(P[0], P[1], t);
  const b = lerp(P[1], P[2], t);
  const c = lerp(P[2], P[3], t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const f = lerp(d, e, t);
  return { level1: [a, b, c], level2: [d, e], point: f };
}

function buildCurveSamples(P, n = 80) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(casteljau(P, t).point);
  }
  return pts;
}

function buildPartialCurve(P, tMax, n = 80) {
  const pts = [];
  const steps = Math.max(2, Math.ceil(n * tMax));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax;
    pts.push(casteljau(P, t).point);
  }
  return pts;
}

function pointsToPath(pts) {
  if (!pts.length) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

function Grid() {
  const lines = [];
  const step = 40;
  for (let x = 0; x <= W; x += step) {
    lines.push(<line key={`vx${x}`} x1={x} y1={0} x2={x} y2={H} stroke={COLOR_GRID} strokeWidth="0.4" opacity="0.35" />);
  }
  for (let y = 0; y <= H; y += step) {
    lines.push(<line key={`hy${y}`} x1={0} y1={y} x2={W} y2={y} stroke={COLOR_GRID} strokeWidth="0.4" opacity="0.35" />);
  }
  return <g>{lines}</g>;
}

const INITIAL_POINTS = [
  { x: 70, y: 280 },
  { x: 160, y: 70 },
  { x: 360, y: 70 },
  { x: 450, y: 280 },
];

const LABELS = ['P0', 'P1', 'P2', 'P3'];

export default function BezierViz() {
  const svgRef = useRef(null);
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [t, setT] = useState(0.5);
  const [dragIndex, setDragIndex] = useState(-1);
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef(null);

  const cast = useMemo(() => casteljau(points, t), [points, t]);
  const fullCurve = useMemo(() => buildCurveSamples(points, 96), [points]);
  const tracedCurve = useMemo(() => buildPartialCurve(points, t, 96), [points, t]);

  const handleMove = useCallback((e) => {
    if (dragIndex < 0 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const sx = (cx - rect.left) * (W / rect.width);
    const sy = (cy - rect.top) * (H / rect.height);
    const nx = clamp(sx, PAD, W - PAD);
    const ny = clamp(sy, PAD, H - PAD);
    setPoints((prev) => prev.map((p, i) => (i === dragIndex ? { x: nx, y: ny } : p)));
  }, [dragIndex]);

  useEffect(() => {
    if (dragIndex < 0) return;
    const up = () => setDragIndex(-1);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [dragIndex, handleMove]);

  const startAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const dur = 2600;
    setAnimating(true);
    setT(0);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setT(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setAnimating(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
  };

  const resetPoints = () => {
    stopAnim();
    setPoints(INITIAL_POINTS);
    setT(0.5);
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const onSliderChange = (e) => {
    if (animating) stopAnim();
    setT(Number(e.target.value));
  };

  const ctrlPolyPath = pointsToPath(points);
  const lvl1Path = pointsToPath(cast.level1);
  const lvl2Path = pointsToPath(cast.level2);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <Grid />

          {/* full curve (faint background guide) */}
          <path
            d={pointsToPath(fullCurve)}
            stroke={COLOR_CURVE}
            strokeWidth="1.4"
            fill="none"
            opacity="0.22"
            strokeDasharray="3 4"
          />

          {/* control polygon */}
          <path d={ctrlPolyPath} stroke={COLOR_CTRL} strokeWidth="1.3" fill="none" opacity="0.55" strokeDasharray="6 4" />

          {/* level-1 segments between intermediate points */}
          <path d={lvl1Path} stroke={COLOR_L1} strokeWidth="1.8" fill="none" opacity="0.85" />

          {/* level-2 segment */}
          <path d={lvl2Path} stroke={COLOR_L2} strokeWidth="2" fill="none" opacity="0.9" />

          {/* traced curve up to current t */}
          <path
            d={pointsToPath(tracedCurve)}
            stroke={COLOR_CURVE}
            strokeWidth="2.6"
            fill="none"
            opacity="0.95"
            strokeLinecap="round"
          />

          {/* level-1 intermediate points */}
          {cast.level1.map((p, i) => (
            <g key={`l1-${i}`}>
              <circle cx={p.x} cy={p.y} r="5" fill={COLOR_L1} opacity="0.95" />
              <text
                x={p.x + 8}
                y={p.y - 8}
                fontSize="11"
                fontWeight="700"
                fill={COLOR_L1}
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
              >
                Q{i}
              </text>
            </g>
          ))}

          {/* level-2 intermediate points */}
          {cast.level2.map((p, i) => (
            <g key={`l2-${i}`}>
              <circle cx={p.x} cy={p.y} r="5" fill={COLOR_L2} opacity="0.95" />
              <text
                x={p.x + 8}
                y={p.y - 8}
                fontSize="11"
                fontWeight="700"
                fill={COLOR_L2}
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
              >
                R{i}
              </text>
            </g>
          ))}

          {/* final point on curve */}
          <circle cx={cast.point.x} cy={cast.point.y} r="7" fill={COLOR_L3} opacity="0.95" />
          <circle cx={cast.point.x} cy={cast.point.y} r="11" fill="none" stroke={COLOR_L3} strokeWidth="1.4" opacity="0.55" />
          <text
            x={cast.point.x + 12}
            y={cast.point.y + 4}
            fontSize="12"
            fontWeight="800"
            fill={COLOR_L3}
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
          >
            B(t)
          </text>

          {/* control points (draggable) */}
          {points.map((p, i) => (
            <g key={`cp-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="14"
                fill={COLOR_CTRL}
                opacity="0.18"
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => { e.preventDefault(); setDragIndex(i); }}
                onTouchStart={(e) => { e.preventDefault(); setDragIndex(i); }}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill={COLOR_CTRL}
                stroke="var(--bg)"
                strokeWidth="1.5"
                style={{ cursor: 'grab', pointerEvents: 'none' }}
              />
              <text
                x={p.x + 11}
                y={p.y - 11}
                fontSize="12"
                fontWeight="700"
                fill={COLOR_CTRL}
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
                style={{ pointerEvents: 'none' }}
              >
                {LABELS[i]}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mlviz-controls">
        <label className="mlviz-slider-label">
          <span>t</span>
          <span className="mlviz-slider-val">{snap(t).toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={t}
          onChange={onSliderChange}
          className="mlviz-slider"
        />
      </div>

      <div className="mlviz-btn-row" style={{ flexDirection: 'row', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="mlviz-btn mlviz-btn-primary"
          onClick={startAnim}
          disabled={animating}
        >
          Animate t 0→1
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={stopAnim}
          disabled={!animating}
        >
          Stop
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={resetPoints}
          disabled={animating}
        >
          Reset
        </button>
        <span className="mlviz-hint" style={{ marginTop: 0, alignSelf: 'center' }}>
          drag P0–P3 to reshape
        </span>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_CTRL }}>level 0</span>
          <span className="mlviz-val">4 control points</span>
          <span className="mlviz-sub">dashed polygon P0→P1→P2→P3</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_L1 }}>level 1</span>
          <span className="mlviz-val">Q0, Q1, Q2</span>
          <span className="mlviz-sub">lerp each adjacent pair by t</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_L2 }}>level 2</span>
          <span className="mlviz-val">R0, R1</span>
          <span className="mlviz-sub">lerp Q0Q1 and Q1Q2 by t</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: COLOR_L3 }}>B(t)</span>
          <span className="mlviz-val">[{snap(cast.point.x)}, {snap(cast.point.y)}]</span>
          <span className="mlviz-sub">lerp R0R1 by t — point on the curve</span>
        </div>
        <div className="mlviz-hint">
          de Casteljau: collapse a degree-n control polygon one lerp at a time. Numerically stable and works for any degree.
        </div>
      </div>
    </div>
  );
}
