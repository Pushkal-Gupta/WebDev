import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Grid3x3, Play, Pause, SkipForward, RotateCcw, Gauge, Layers } from 'lucide-react';
import './GfxRasterizeViz.css';

// Deterministic edge-function rasterizer over a fixed pixel grid. No randomness.
const COLS = 12;
const ROWS = 9;
const CS = 30;                 // svg units per cell
const W = COLS * CS;           // 360
const H = ROWS * CS;           // 270
const TOTAL = COLS * ROWS;     // 108 scanned pixels

// Two triangles in grid units. Per-vertex depth (z); smaller z = nearer.
const TRI_A = {
  v: [[1, 1], [10, 2], [4, 7]],
  z: [0.30, 0.34, 0.28],
};
const TRI_B = {
  v: [[2, 6], [11, 4], [5, 0]],
  z: [0.55, 0.22, 0.60],
};

function edge(ax, ay, bx, by, px, py) {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

function testTri(tri, px, py) {
  const [v0, v1, v2] = tri.v;
  const area = edge(v0[0], v0[1], v1[0], v1[1], v2[0], v2[1]);
  const w0 = edge(v1[0], v1[1], v2[0], v2[1], px, py);
  const w1 = edge(v2[0], v2[1], v0[0], v0[1], px, py);
  const w2 = edge(v0[0], v0[1], v1[0], v1[1], px, py);
  const inside = (w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0);
  const l0 = w0 / area;
  const l1 = w1 / area;
  const l2 = w2 / area;
  const z = l0 * tri.z[0] + l1 * tri.z[1] + l2 * tri.z[2];
  return { area, w0, w1, w2, inside, l0, l1, l2, z };
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const sgn = (v) => (Math.abs(v) < 1e-9 ? '0' : v > 0 ? '+' : '−');
const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : '--');

export default function GfxRasterizeViz() {
  const [depthOn, setDepthOn] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  // Precompute every pixel's coverage / depth resolution in raster order.
  const cells = useMemo(() => {
    const out = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const a = testTri(TRI_A, px, py);
        const b = depthOn ? testTri(TRI_B, px, py) : null;
        let winner = null;
        if (depthOn) {
          if (a.inside && b.inside) winner = a.z <= b.z ? 'A' : 'B';
          else if (a.inside) winner = 'A';
          else if (b.inside) winner = 'B';
        } else {
          winner = a.inside ? 'A' : null;
        }
        out.push({ x, y, px, py, a, b, winner });
      }
    }
    return out;
  }, [depthOn]);

  const done = step >= TOTAL;
  const curIdx = Math.min(step, TOTAL - 1);
  const cur = cells[curIdx];

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (done) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function toggleDepth() {
    setDepthOn((d) => !d);
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || step >= TOTAL) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(TOTAL, s + 1)),
      Math.round((reduced() ? 60 : 130) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, speed]);

  const triPoints = (tri) => tri.v.map(([vx, vy]) => `${vx * CS},${vy * CS}`).join(' ');

  const covered = useMemo(() => {
    let a = 0;
    let b = 0;
    for (let i = 0; i < step; i++) {
      const w = cells[i].winner;
      if (w === 'A') a++;
      else if (w === 'B') b++;
    }
    return { a, b };
  }, [cells, step]);

  const curWinner = cur.winner;

  return (
    <div className="gfxr">
      <div className="gfxr-head">
        <div className="gfxr-head-icon"><Grid3x3 size={18} /></div>
        <div className="gfxr-head-text">
          <h3 className="gfxr-title">Rasterizing a triangle</h3>
          <p className="gfxr-sub">
            Scan pixels row by row; each one runs the three edge functions. Same sign on all
            three &rarr; the pixel is covered, and the edge values become barycentric weights.
          </p>
        </div>
        <button type="button" className="gfxr-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="gfxr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gfxr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="gfxr-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* pixel cells */}
          {cells.map((c, i) => {
            const resolved = i < step;
            const isCur = i === curIdx && !done;
            let cls = 'is-idle';
            if (isCur) cls = 'is-current';
            else if (resolved && c.winner === 'A') cls = 'is-a';
            else if (resolved && c.winner === 'B') cls = 'is-b';
            else if (resolved) cls = 'is-empty';
            return (
              <rect
                key={`c-${i}`}
                x={c.x * CS + 1}
                y={c.y * CS + 1}
                width={CS - 2}
                height={CS - 2}
                rx={4}
                className={`gfxr-cell ${cls}`}
              />
            );
          })}

          {/* faint dot marking tested-but-outside pixels */}
          {cells.map((c, i) => (
            i < step && !c.winner ? (
              <circle
                key={`d-${i}`}
                cx={c.x * CS + CS / 2}
                cy={c.y * CS + CS / 2}
                r={1.6}
                className="gfxr-out-dot"
              />
            ) : null
          ))}

          {/* triangle outlines */}
          <polygon points={triPoints(TRI_A)} className="gfxr-tri gfxr-tri-a" />
          {depthOn && <polygon points={triPoints(TRI_B)} className="gfxr-tri gfxr-tri-b" />}

          {/* current pixel highlight */}
          {!done && (
            <rect
              x={cur.x * CS + 1}
              y={cur.y * CS + 1}
              width={CS - 2}
              height={CS - 2}
              rx={4}
              className="gfxr-cursor"
              filter="url(#gfxr-glow)"
            />
          )}
        </svg>
      </div>

      <div className="gfxr-controls">
        <button type="button" className="gfxr-btn" onClick={togglePlay}>
          {playing && !done ? <Pause size={14} /> : <Play size={14} />}
          {playing && !done ? 'Pause' : (done ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="gfxr-btn" onClick={() => setStep((s) => Math.min(TOTAL, s + 1))} disabled={done}>
          <SkipForward size={14} /> Step
        </button>
        <button
          type="button"
          className={`gfxr-btn gfxr-toggle${depthOn ? ' is-on' : ''}`}
          onClick={toggleDepth}
        >
          <Layers size={14} /> {depthOn ? 'Z-buffer: on' : 'Z-buffer: off'}
        </button>
        <label className="gfxr-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="gfxr-speed-range"
          />
          <span className="gfxr-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="gfxr-progress">{Math.min(step, TOTAL)} / {TOTAL} px</span>
      </div>

      <div className="gfxr-readout">
        <div className="gfxr-stat is-edge">
          <span className="gfxr-stat-label">edge signs</span>
          <span className="gfxr-stat-val">
            <span className="gfxr-chip">E12 {sgn(cur.a.w0)}</span>
            <span className="gfxr-chip">E20 {sgn(cur.a.w1)}</span>
            <span className="gfxr-chip">E01 {sgn(cur.a.w2)}</span>
          </span>
        </div>
        <div className="gfxr-stat is-bary">
          <span className="gfxr-stat-label">barycentric &lambda; (tri A)</span>
          <span className="gfxr-stat-val">
            {fmt(cur.a.l0)}, {fmt(cur.a.l1)}, {fmt(cur.a.l2)}
          </span>
        </div>
        <div className={`gfxr-stat is-win${curWinner ? ` win-${curWinner.toLowerCase()}` : ''}`}>
          <span className="gfxr-stat-label">{depthOn ? 'winner @ z' : 'pixel'}</span>
          <span className="gfxr-stat-val">
            {curWinner
              ? (depthOn
                ? `${curWinner} (z=${fmt(curWinner === 'A' ? cur.a.z : cur.b.z)})`
                : 'covered')
              : 'outside'}
          </span>
        </div>
      </div>

      <div className="gfxr-note">
        <span className="gfxr-note-label">pixel ({cur.x}, {cur.y})</span>
        <span className="gfxr-note-body">
          {curWinner
            ? (depthOn
              ? <>All three edge functions agree in sign, so this pixel is inside. Depths compare and <em>{curWinner}</em> wins with the smaller z &mdash; {covered.a} px to A, {covered.b} px to B so far.</>
              : <>All three edge signs match &mdash; the pixel center lies inside the triangle. Its weights <em>&lambda; = ({fmt(cur.a.l0)}, {fmt(cur.a.l1)}, {fmt(cur.a.l2)})</em> interpolate every vertex attribute here.</>)
            : <>At least one edge function disagrees in sign, so this pixel is outside &mdash; rejected before any shading. The bounding box lets a real rasterizer skip most of these entirely.</>}
        </span>
      </div>
    </div>
  );
}
