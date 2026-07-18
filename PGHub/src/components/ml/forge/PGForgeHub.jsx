import React, { useMemo, useState, useEffect, useRef, useId } from 'react';
import { Link } from 'react-router-dom';
import {
  Sigma, ListChecks, FileText, Cpu, FolderGit2, Map, Route,
  ArrowRight, ArrowUpRight, Code2, BookOpen, Trophy, Table2,
  Play, Pause, StepForward, RotateCcw,
} from 'lucide-react';
import { PILLARS } from '../../../content/mlContent';
import { MATH_MODULES } from './pgForgeMathData';
import { PG_FORGE_PROBLEMS } from './pgForgeProblemsData';
import { PAPERS } from './pgForgePapersData';
import {
  PapersThumb, FoundationsThumb, LessonsThumb, ProjectsThumb, ProblemsThumb,
  CudaThumb, RoadmapsThumb, StudyPlansThumb, ProgressThumb, SheetsThumb,
} from './ForgeHubThumbs';
import './PGForgeHub.css';

// The surfaces of PGForge. ML Math owns the foundations; Lessons owns the
// applied/architecture track — they no longer both advertise "linear algebra",
// which is what read as duplicated. Each card carries its own animated thumb —
// the shared ForgeHubThumb router keys on the legacy /ml paths, so mapping the
// component directly here keeps every card's preview on-topic instead of
// collapsing to the fallback.
const PILLAR_CARDS = [
  { to: '/forge/projects',    icon: FolderGit2, title: 'Projects',     Thumb: ProjectsThumb,
    desc: 'Build something real: a digit classifier, a small transformer, backprop from scratch.' },
  { to: '/forge/problems',    icon: ListChecks, title: 'Problems',     Thumb: ProblemsThumb,
    desc: 'Implement optimizers, activations, losses, and classic models from scratch — one runnable task each.' },
  { to: '/forge/papers',      icon: FileText,   title: 'Papers',       Thumb: PapersThumb,
    desc: 'Landmark reads rebuilt step by step — attention, residual nets, Adam, diffusion.' },
  { to: '/forge/learn',       icon: BookOpen,   title: 'Lessons',      Thumb: LessonsThumb,
    desc: 'Deep nets, attention, transformers, diffusion, and RL — the architectures, end to end.' },
  { to: '/forge/math',        icon: Sigma,      title: 'Foundations',  Thumb: FoundationsThumb,
    desc: 'Linear algebra, calculus, probability, optimization, and information theory — each with a live visual.' },
  { to: '/forge/cuda',        icon: Cpu,        title: 'CUDA Kernels', Thumb: CudaThumb,
    desc: 'Write the GPU kernels under the math — reductions, tiled matmul, softmax, scan.' },
  { to: '/forge/roadmaps',    icon: Map,        title: 'Roadmaps',     Thumb: RoadmapsThumb,
    desc: 'An ordered path from math foundations through architectures to reinforcement learning.' },
  { to: '/forge/study-plans', icon: Route,      title: 'Study Plans',  Thumb: StudyPlansThumb,
    desc: 'Guided tracks that string lessons, problems, papers, and math into one route.' },
  { to: '/forge/progress',    icon: Trophy,     title: 'Progress',     Thumb: ProgressThumb,
    desc: 'Your solved-problem ring, badges, submission streak, and recent activity.' },
  { to: '/forge/sheets',      icon: Table2,     title: 'Sheets',       Thumb: SheetsThumb,
    desc: 'Quick-reference cheat sheets — NumPy, PyTorch, CUDA, Triton, and ML interviews.' },
];

// Quick-jump chips under the hero stats — a compact set of on-topic entry points
// so the left column reads full alongside the tall loss-surface card.
const HERO_JUMP = [
  { to: '/forge/learn',    icon: BookOpen,   label: 'Transformers' },
  { to: '/forge/papers',   icon: FileText,   label: 'Attention paper' },
  { to: '/forge/cuda',     icon: Cpu,        label: 'CUDA kernels' },
  { to: '/forge/problems', icon: ListChecks, label: 'Optimizers' },
];

// A 3D loss surface with gradient descent rolling into the valley — projected to
// SVG (no external 3D dep). Height-coloured mesh (cool valleys, warm peaks) via
// theme hue tokens; a glowing marker follows −∇L downhill, smoothly interpolated
// frame-by-frame, then re-seeds to a fresh basin and loops forever. The homepage's
// always-alive "do something" hero, matching the "drag the visual" promise.
const LOSS_N = 20;            // mesh resolution
const LOSS_RANGE = 2.3;       // domain half-width in each axis
const lossFn = (x, y) => 0.16 * (x * x + y * y) + 0.9 * Math.sin(1.15 * x) * Math.cos(1.15 * y);
const lossGrad = (x, y) => [
  0.32 * x + 0.9 * 1.15 * Math.cos(1.15 * x) * Math.cos(1.15 * y),
  0.32 * y - 0.9 * 1.15 * Math.sin(1.15 * x) * Math.sin(1.15 * y),
];

const DESCENT_SPEED = 7.5;    // trajectory-steps rolled per second (interpolated)
const VALLEY_HOLD_S = 1.0;    // pause at the basin before re-seeding a new start
const clampDom = (v) => Math.max(-LOSS_RANGE, Math.min(LOSS_RANGE, v));

// Deterministic PRNG — never Math.random at module scope. Seeded by a frame
// counter so each loop drops into a fresh, reproducible basin.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function LossSurfaceViz() {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Document-global SVG defs ids must be unique per instance.
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const ids = {
    ball: `lossBall-${uid}`,
    glow: `lossGlow-${uid}`,
    trail: `lossTrail-${uid}`,
    vignette: `lossVig-${uid}`,
    sky: `lossSky-${uid}`,
  };

  // The mesh + projection are fixed (don't depend on the controls).
  const { cells, project, hMin, hMax } = useMemo(() => {
    const H = [];
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= LOSS_N; i += 1) {
      H[i] = [];
      for (let j = 0; j <= LOSS_N; j += 1) {
        const x = -LOSS_RANGE + (i / LOSS_N) * 2 * LOSS_RANGE;
        const y = -LOSS_RANGE + (j / LOSS_N) * 2 * LOSS_RANGE;
        const h = lossFn(x, y);
        H[i][j] = h;
        if (h < lo) lo = h;
        if (h > hi) hi = h;
      }
    }
    const hMid = (lo + hi) / 2;
    const CX = 160, CY = 118, SX = 5.6, SY = 2.8, HZ = 20;
    const proj = (gi, gj, h) => {
      const a = gi - LOSS_N / 2;
      const b = gj - LOSS_N / 2;
      return [CX + (a - b) * SX, CY + (a + b) * SY - (h - hMid) * HZ];
    };
    const projectXY = (x, y, h) => {
      const gi = ((x + LOSS_RANGE) / (2 * LOSS_RANGE)) * LOSS_N;
      const gj = ((y + LOSS_RANGE) / (2 * LOSS_RANGE)) * LOSS_N;
      return proj(gi, gj, h);
    };
    const c = [];
    for (let i = 0; i < LOSS_N; i += 1) {
      for (let j = 0; j < LOSS_N; j += 1) {
        const p0 = proj(i, j, H[i][j]);
        const p1 = proj(i + 1, j, H[i + 1][j]);
        const p2 = proj(i + 1, j + 1, H[i + 1][j + 1]);
        const p3 = proj(i, j + 1, H[i][j + 1]);
        const avg = (H[i][j] + H[i + 1][j] + H[i + 1][j + 1] + H[i][j + 1]) / 4;
        c.push({
          pts: `${p0[0].toFixed(1)},${p0[1].toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} ${p3[0].toFixed(1)},${p3[1].toFixed(1)}`,
          t: (avg - lo) / (hi - lo || 1),
          depth: i + j,
        });
      }
    }
    c.sort((u, v) => u.depth - v.depth);
    return { cells: c, project: projectXY, hMin: lo, hMax: hi };
  }, []);

  // ── interactive controls ─────────────────────────────────────────
  const [lr, setLr] = useState(0.16);
  const [start, setStart] = useState({ x: 1.75, y: -1.55 });
  const [playing, setPlaying] = useState(!reduce);
  const [progress, setProgress] = useState(0);   // fractional index into the path

  // The trajectory recomputes whenever the learning rate or start point changes.
  const path = useMemo(() => {
    let x = start.x, y = start.y;
    const pts = [];
    for (let s = 0; s <= 44; s += 1) {
      const h = lossFn(x, y);
      pts.push({ x, y, h });
      const [gx, gy] = lossGrad(x, y);
      x = clampDom(x - lr * gx);
      y = clampDom(y - lr * gy);
    }
    return pts;
  }, [lr, start]);

  const progRef = useRef(0);    // authoritative marker position (float, driven by rAF)
  const holdRef = useRef(0);    // seconds remaining in the valley pause
  const seedRef = useRef(7);    // advances every loop so each re-seed is distinct

  // Restart the walk whenever the trajectory is rebuilt (slider drag OR a re-seed).
  useEffect(() => {
    progRef.current = 0;
    holdRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(reduce ? path.length - 1 : 0);
  }, [path, reduce]);

  // Continuous auto-loop: smoothly interpolate down the surface, hold at the
  // basin ~1s, then re-seed to a fresh random start and descend again — forever.
  useEffect(() => {
    if (reduce || !playing) return undefined;
    let raf = 0;
    let last = performance.now();
    const end = path.length - 1;
    const tick = (ts) => {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      if (holdRef.current > 0) {
        holdRef.current -= dt;
        if (holdRef.current <= 0) {
          seedRef.current += 1;
          const rnd = mulberry32(Math.imul(seedRef.current, 0x9e3779b1));
          const nx = (rnd() * 2 - 1) * (LOSS_RANGE - 0.2);
          const ny = (rnd() * 2 - 1) * (LOSS_RANGE - 0.2);
          progRef.current = 0;
          setStart({ x: Number(nx.toFixed(2)), y: Number(ny.toFixed(2)) });
          return;   // path changes → this effect re-runs with a fresh loop
        }
      } else {
        progRef.current = Math.min(end, progRef.current + dt * DESCENT_SPEED);
        if (progRef.current >= end) { progRef.current = end; holdRef.current = VALLEY_HOLD_S; }
        setProgress(progRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, path, reduce]);

  // Interpolate the marker between the two nearest gradient-descent steps and
  // let it hug the surface (h from lossFn, not a lerp) so the roll looks physical.
  const end = path.length - 1;
  const fp = Math.min(Math.max(progress, 0), end);
  const i0 = Math.floor(fp);
  const i1 = Math.min(end, i0 + 1);
  const f = fp - i0;
  const mx = path[i0].x + (path[i1].x - path[i0].x) * f;
  const my = path[i0].y + (path[i1].y - path[i0].y) * f;
  const mh = lossFn(mx, my);
  const curPt = project(mx, my, mh + 0.06);

  const trailArr = [];
  for (let k = 0; k <= i0; k += 1) {
    const q = project(path[k].x, path[k].y, path[k].h + 0.06);
    trailArr.push(`${q[0].toFixed(1)},${q[1].toFixed(1)}`);
  }
  trailArr.push(`${curPt[0].toFixed(1)},${curPt[1].toFixed(1)}`);
  const trail = trailArr.join(' ');

  const lossRange = hMax - hMin || 1;
  const norm = (mh - hMin) / lossRange;

  // Diagnose the run so the reader learns what the learning rate does.
  const finalLoss = path[path.length - 1].h;
  const maxLoss = Math.max(...path.map((p) => p.h));
  const status = maxLoss > path[0].h + 0.4
    ? { label: 'diverging', cls: 'is-bad' }
    : (finalLoss > hMin + 0.12 * lossRange && maxLoss > path[0].h + 0.02)
      ? { label: 'oscillating', cls: 'is-warn' }
      : { label: 'converging', cls: 'is-good' };

  const doReset = () => {
    setPlaying(false);
    progRef.current = 0;
    holdRef.current = 0;
    setProgress(0);
  };
  const doStep = () => {
    setPlaying(false);
    holdRef.current = 0;
    progRef.current = Math.min(end, Math.floor(progRef.current + 1e-6) + 1);
    setProgress(progRef.current);
  };

  return (
    <div className="forge-hero-viz">
      <div className="forge-hero-viz-head">
        <span className="forge-hero-viz-title">Loss surface L(w) — gradient descent</span>
        <span className="forge-hero-viz-read">step {Math.floor(fp)} · loss {mh.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 320 200" className="forge-hero-viz-svg" role="img"
        preserveAspectRatio="xMidYMid meet"
        aria-label="3D loss surface with a gradient-descent marker rolling into the valley">
        <defs>
          <radialGradient id={ids.ball} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="var(--surface)" />
            <stop offset="42%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--accent) 55%, var(--hue-violet))" />
          </radialGradient>
          <linearGradient id={ids.trail} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--hue-sky)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.95" />
          </linearGradient>
          <filter id={ids.glow} x="-140%" y="-140%" width="380%" height="380%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* cinematic backdrop — a soft sky wash up top, a dark vignette hugging the edges */}
          <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--hue-violet) 26%, var(--bg))" />
            <stop offset="52%" stopColor="var(--bg)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--hue-sky) 12%, var(--bg))" />
          </linearGradient>
          <radialGradient id={ids.vignette} cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="var(--bg)" stopOpacity="0" />
            <stop offset="72%" stopColor="var(--bg)" stopOpacity="0" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--text-main) 34%, transparent)" stopOpacity="0.5" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="320" height="200" fill={`url(#${ids.sky})`} />
        <g className={reduce ? undefined : 'forge-hero-scene'} style={{ transformOrigin: '160px 118px' }}>
          <g>
          {cells.map((cell, i) => (
            <polygon
              key={i}
              className={reduce ? undefined : 'forge-hero-cell'}
              style={reduce ? undefined : { animationDelay: `${(cell.depth * -0.11).toFixed(2)}s` }}
              points={cell.pts}
              fill={`color-mix(in srgb, var(--hue-pink) ${Math.round(cell.t * 100)}%, var(--hue-sky))`}
              stroke="var(--surface)"
              strokeWidth="0.35"
              opacity={0.82 + 0.14 * cell.t}
            />
          ))}
          </g>
          {/* contour ripples spreading across the basin floor once the walk settles */}
          {!reduce && status.cls === 'is-good' && fp >= end - 1 && (
            <g>
              <ellipse className="forge-hero-ripple" cx={curPt[0]} cy={curPt[1]} rx="10" ry="5"
                fill="none" stroke="var(--hue-sky)" strokeWidth="1.1" />
              <ellipse className="forge-hero-ripple forge-hero-ripple-2" cx={curPt[0]} cy={curPt[1]}
                rx="10" ry="5" fill="none" stroke="var(--accent)" strokeWidth="1.1" />
            </g>
          )}
          {/* glowing comet trail */}
          <polyline points={trail} fill="none" stroke={`url(#${ids.trail})`} strokeWidth="5.5"
            strokeLinejoin="round" strokeLinecap="round" opacity="0.45" filter={`url(#${ids.glow})`} />
          <polyline points={trail} fill="none" stroke={`url(#${ids.trail})`} strokeWidth="2.4"
            strokeLinejoin="round" strokeLinecap="round" opacity="0.98" />
          {/* rhythmic pulse ring emanating from the marker */}
          {!reduce && (
            <circle className="forge-hero-pulse" cx={curPt[0]} cy={curPt[1]} r="5.4" fill="none"
              stroke="var(--accent)" strokeWidth="1.4" />
          )}
          <circle cx={curPt[0]} cy={curPt[1]} r={8.5} fill="none"
            stroke="var(--accent)" strokeWidth="1.2" opacity={0.22 + 0.34 * (1 - norm)} />
          <g filter={`url(#${ids.glow})`}>
            <circle cx={curPt[0]} cy={curPt[1]} r="6.2" fill={`url(#${ids.ball})`}
              stroke="var(--surface)" strokeWidth="0.8" />
          </g>
        </g>
        <rect x="0" y="0" width="320" height="200" fill={`url(#${ids.vignette})`} pointerEvents="none" />
      </svg>

      <div className="forge-hero-ctl">
        <button className="forge-hero-btn" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? 'Pause' : 'Play'}
        </button>
        <button className="forge-hero-btn" onClick={doStep} disabled={playing}>
          <StepForward size={13} /> Step
        </button>
        <button className="forge-hero-btn" onClick={doReset}><RotateCcw size={13} /> Reset</button>
        <span className={`forge-hero-status ${status.cls}`}>{status.label}</span>
      </div>

      <div className="forge-hero-sliders">
        <label className="forge-hero-sl">
          <span>learning rate <b>{lr.toFixed(2)}</b></span>
          <input type="range" min="0.02" max="0.6" step="0.01" value={lr}
            onChange={(e) => setLr(Number(e.target.value))} aria-label="learning rate" />
        </label>
        <label className="forge-hero-sl">
          <span>start&nbsp;w&#8321; <b>{start.x.toFixed(1)}</b></span>
          <input type="range" min={-LOSS_RANGE} max={LOSS_RANGE} step="0.05" value={start.x}
            onChange={(e) => setStart((s) => ({ ...s, x: Number(e.target.value) }))} aria-label="start weight 1" />
        </label>
        <label className="forge-hero-sl">
          <span>start&nbsp;w&#8322; <b>{start.y.toFixed(1)}</b></span>
          <input type="range" min={-LOSS_RANGE} max={LOSS_RANGE} step="0.05" value={start.y}
            onChange={(e) => setStart((s) => ({ ...s, y: Number(e.target.value) }))} aria-label="start weight 2" />
        </label>
      </div>

      <p className="forge-hero-viz-cap">
        The marker rolls down −∇L into the nearest basin, then re-seeds and drops again. Raise the <b>learning rate</b> and it overshoots and oscillates; too high and it diverges up the warm ridges. Move the start point to steer it into a different valley.
      </p>
    </div>
  );
}

// ── Reel mini-viz ───────────────────────────────────────────────────────────
// A Netflix-style row of tiny, always-moving ML visuals that glides left forever.
// Each viz is pure CSS-animated inline SVG (no SMIL ids, so the duplicated
// marquee track never collides), theme-tokened via the --reel-hue the tile sets.
const REEL_VB = '0 0 120 72';

function VizDescent() {
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <line className="reel-base" x1="10" y1="60" x2="110" y2="60" />
      <path className="reel-descent-curve" d="M12 16 Q60 78 108 16" />
      <circle className="reel-descent-dot" cx="12" cy="16" r="4.6" />
    </svg>
  );
}

function VizAttention() {
  const cells = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 6; c += 1) cells.push({ r, c });
  }
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {cells.map(({ r, c }) => (
        <rect key={`${r}-${c}`} className="reel-att-cell" x={16 + c * 15} y={9 + r * 14}
          width="12" height="11" rx="2.4" style={{ animationDelay: `${(r + c) * 0.16}s` }} />
      ))}
    </svg>
  );
}

function VizDiffusion() {
  const dots = [
    [24, 20], [40, 14], [58, 24], [76, 16], [94, 26], [30, 40],
    [48, 48], [66, 40], [84, 50], [100, 40], [20, 54], [58, 58],
  ];
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {dots.map(([x, y], i) => (
        <circle key={i} className="reel-diff-dot" cx={x} cy={y} r="4"
          style={{ animationDelay: `${(i % 6) * 0.28}s` }} />
      ))}
    </svg>
  );
}

function VizVectorField() {
  const arrows = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 5; c += 1) arrows.push({ x: 20 + c * 20, y: 16 + r * 20, d: r + c });
  }
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {arrows.map(({ x, y, d }, i) => (
        <g key={i} className="reel-vec" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${d * 0.2}s` }}>
          <line className="reel-vec-line" x1={x - 7} y1={y} x2={x + 6} y2={y} />
          <path className="reel-vec-head" d={`M${x + 6} ${y - 3} L${x + 10} ${y} L${x + 6} ${y + 3} Z`} />
        </g>
      ))}
    </svg>
  );
}

function VizOptimizer() {
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path className="reel-opt-bowl" d="M14 20 Q60 82 106 20" />
      <ellipse className="reel-opt-shadow" cx="60" cy="60" rx="11" ry="3.4" />
      <circle className="reel-opt-ball" cx="60" cy="18" r="6" />
    </svg>
  );
}

function VizNeuralNet() {
  const cols = [24, 60, 96];
  const ys = [[18, 40, 62], [26, 54], [22, 50]];
  const edges = [];
  ys[0].forEach((y0, a) => ys[1].forEach((y1, b) => edges.push({ x1: cols[0], y1: y0, x2: cols[1], y2: y1, d: a + b })));
  ys[1].forEach((y1, a) => ys[2].forEach((y2, b) => edges.push({ x1: cols[1], y1, x2: cols[2], y2, d: a + b + 3 })));
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {edges.map((e, i) => (
        <line key={i} className="reel-net-edge" x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          style={{ animationDelay: `${e.d * 0.22}s` }} />
      ))}
      {ys.map((layer, li) => layer.map((y, i) => (
        <circle key={`${li}-${i}`} className="reel-net-node" cx={cols[li]} cy={y} r="5.4"
          style={{ animationDelay: `${(li * 3 + i) * 0.18}s` }} />
      )))}
    </svg>
  );
}

function VizSoftmax() {
  const bars = [0, 1, 2, 3, 4, 5];
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <line className="reel-base" x1="12" y1="62" x2="108" y2="62" />
      {bars.map((i) => (
        <rect key={i} className={`reel-bar reel-bar-${i}`} x={16 + i * 15} y="12" width="11" height="50"
          rx="2.4" style={{ transformOrigin: `${21 + i * 15}px 62px` }} />
      ))}
    </svg>
  );
}

function VizActivation() {
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <line className="reel-base" x1="10" y1="40" x2="110" y2="40" />
      <g className="reel-wave-scroll">
        <path className="reel-wave" d="M-60 40 Q-45 12 -30 40 T0 40 T30 40 T60 40 T90 40 T120 40 T150 40 T180 40" />
      </g>
      <circle className="reel-wave-node" cx="60" cy="40" r="4.4" />
    </svg>
  );
}

function VizWarp() {
  const cells = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 8; c += 1) cells.push({ r, c, d: r + c });
  }
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {cells.map(({ r, c, d }) => (
        <rect key={`${r}-${c}`} className="reel-warp-cell" x={12 + c * 12.5} y={11 + r * 13}
          width="10" height="10" rx="2" style={{ animationDelay: `${d * 0.1}s` }} />
      ))}
    </svg>
  );
}

function VizConvergence() {
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <circle className="reel-ring-track" cx="60" cy="36" r="24" />
      <circle className="reel-ring-fill" cx="60" cy="36" r="24" transform="rotate(-90 60 36)" pathLength="100" />
      <circle className="reel-ring-core" cx="60" cy="36" r="6" />
    </svg>
  );
}

// Featured-paper visual for "Attention Is All You Need" — a live attention
// heat-grid (query rows attending over key columns, the weights rippling in a
// diagonal wave) with source tokens on the left flowing into a target token via
// curved connection lines. Pure CSS motion, theme-tokened, reduced-motion safe.
function AttentionPaperViz() {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const N = 5;
  const G0 = 52, GS = 15;           // grid origin + cell stride
  const cells = [];
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) cells.push({ r, c });
  }
  // Left-column source tokens fanning into a single attended target on the grid.
  const tokY = [22, 40, 58, 76];
  const targetX = G0 + 2 * GS + GS / 2;
  const targetY = 8;
  return (
    <svg viewBox="0 0 140 105" className="forge-att-svg" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Attention heat-grid with tokens attending to tokens">
      <rect x="0" y="0" width="140" height="105" fill="var(--bg)" />
      {/* flowing connection lines from source tokens into the attended cell */}
      {tokY.map((y, i) => (
        <path
          key={`ln-${i}`}
          className={reduce ? 'forge-att-link-static' : 'forge-att-link'}
          style={reduce ? undefined : { animationDelay: `${i * 0.5}s` }}
          d={`M18 ${y} C34 ${y}, ${targetX - 16} ${targetY + 6}, ${targetX} ${targetY + 4}`}
          fill="none"
          stroke={`var(--hue-${['violet', 'sky', 'pink', 'mint'][i]})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ))}
      {tokY.map((y, i) => (
        <circle key={`tk-${i}`} cx="14" cy={y} r="4.6"
          fill={`color-mix(in srgb, var(--hue-${['violet', 'sky', 'pink', 'mint'][i]}) 82%, var(--surface))`}
          stroke="var(--surface)" strokeWidth="1" />
      ))}
      {/* the Q x K attention weight grid */}
      {cells.map(({ r, c }) => (
        <rect
          key={`${r}-${c}`}
          className={reduce ? 'forge-att-cell-static' : 'forge-att-cell'}
          style={reduce ? undefined : { animationDelay: `${(r + c) * 0.22}s` }}
          x={G0 + c * GS}
          y={22 + r * GS}
          width={GS - 3}
          height={GS - 3}
          rx="2.6"
          fill={`color-mix(in srgb, var(--hue-pink) ${28 + ((r * N + c) % 5) * 14}%, var(--hue-sky))`}
        />
      ))}
      {/* a highlight query-row sweeping down the grid */}
      {!reduce && (
        <rect className="forge-att-scan" x={G0 - 2} y="20" width={N * GS + 1} height={GS + 1}
          rx="3" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
      )}
    </svg>
  );
}

const REEL_TILES = [
  { to: '/forge/math',     title: 'Gradient descent', hue: 'var(--hue-sky)',    Viz: VizDescent },
  { to: '/forge/learn',    title: 'Self-attention',   hue: 'var(--hue-violet)', Viz: VizAttention },
  { to: '/forge/papers',   title: 'Diffusion',        hue: 'var(--hue-pink)',   Viz: VizDiffusion },
  { to: '/forge/math',     title: 'Vector fields',    hue: 'var(--hue-mint)',   Viz: VizVectorField },
  { to: '/forge/problems', title: 'Optimizers',       hue: 'var(--accent)',     Viz: VizOptimizer },
  { to: '/forge/learn',    title: 'Neural nets',      hue: 'var(--hue-sky)',    Viz: VizNeuralNet },
  { to: '/forge/problems', title: 'Softmax',          hue: 'var(--hue-violet)', Viz: VizSoftmax },
  { to: '/forge/math',     title: 'Activations',      hue: 'var(--hue-mint)',   Viz: VizActivation },
  { to: '/forge/cuda',     title: 'Warp scheduling',  hue: 'var(--warning)',    Viz: VizWarp },
  { to: '/forge/progress', title: 'Convergence',      hue: 'var(--hue-pink)',   Viz: VizConvergence },
];

function ReelTile(tile) {
  const { to, title, hue, Viz } = tile;
  return (
    <Link to={to} className="reel-tile" style={{ '--reel-hue': hue }}>
      <div className="reel-tile-stage"><Viz /></div>
      <div className="reel-tile-cap">
        <span className="reel-tile-title">{title}</span>
        <ArrowUpRight size={13} className="reel-tile-arr" />
      </div>
    </Link>
  );
}

function ForgeReel() {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const head = (
    <div className="forge-section-head">
      <h2 className="forge-section-title">See the ideas move</h2>
    </div>
  );

  if (reduce) {
    return (
      <section className="forge-section">
        {head}
        <div className="reel-static">
          {REEL_TILES.map((t) => <ReelTile key={`${t.to}-${t.title}`} {...t} />)}
        </div>
      </section>
    );
  }

  return (
    <section className="forge-section">
      {head}
      <div className="reel-viewport">
        <div className="reel-track">
          {REEL_TILES.map((t) => <ReelTile key={`a-${t.to}-${t.title}`} {...t} />)}
          {REEL_TILES.map((t) => <ReelTile key={`b-${t.to}-${t.title}`} {...t} />)}
        </div>
      </div>
    </section>
  );
}

export default function PGForgeHub() {
  const lessonCount = useMemo(
    () => Object.values(PILLARS).reduce((acc, p) => acc + (p.lessons?.length || 0), 0),
    [],
  );
  const mathTopicCount = useMemo(
    () => MATH_MODULES.reduce((acc, m) => acc + m.topics.length, 0),
    [],
  );
  const sampleProblems = PG_FORGE_PROBLEMS.slice(0, 6);
  const featured = PAPERS[0];

  const stats = [
    { n: mathTopicCount, label: 'math topics' },
    { n: lessonCount, label: 'lessons' },
    { n: PG_FORGE_PROBLEMS.length, label: 'problems' },
    { n: PAPERS.length, label: 'papers rebuilt' },
  ];

  return (
    <div className="forge-hub">
      <section className="forge-hero">
        <div className="forge-hero-left">
          <h1 className="forge-hero-title">
            <span className="forge-hero-pg">PG</span>Forge
          </h1>
          <p className="forge-hero-tag">
            The math, the code, and the papers behind machine learning — read the intuition, drag the visual, then build it yourself.
          </p>
          <div className="forge-hero-ctas">
            <Link to="/ml/math" className="forge-hero-cta forge-hero-cta-primary">
              Start with the math <ArrowRight size={15} />
            </Link>
            <Link to="/ml/problems" className="forge-hero-cta forge-hero-cta-ghost">
              <Code2 size={15} /> Solve a problem
            </Link>
          </div>
          <div className="forge-hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="forge-hero-stat">
                <span className="forge-hero-stat-n">{s.n}</span>
                <span className="forge-hero-stat-l">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="forge-hero-jump">
            <span className="forge-hero-jump-lead">Jump in</span>
            {HERO_JUMP.map((j) => {
              const Icon = j.icon;
              return (
                <Link key={j.to} to={j.to} className="forge-hero-chip">
                  <Icon size={13} /> {j.label}
                </Link>
              );
            })}
          </div>
        </div>
        <LossSurfaceViz />
      </section>

      <ForgeReel />

      <section className="forge-section">
        <div className="forge-section-head">
          <h2 className="forge-section-title">Pick a surface</h2>
        </div>
        <div className="forge-pillar-grid">
          {PILLAR_CARDS.map((s) => {
            const Icon = s.icon;
            const Thumb = s.Thumb;
            return (
              <Link key={s.to} to={s.to} className="forge-pillar">
                <div className="forge-thumb-frame forge-pillar-thumb">
                  <Thumb />
                  <span className="forge-pillar-badge"><Icon size={15} /></span>
                </div>
                <div className="forge-pillar-body">
                  <h3 className="forge-pillar-title">{s.title}</h3>
                  <p className="forge-pillar-desc">{s.desc}</p>
                  <span className="forge-pillar-cta">Open <ArrowRight size={13} /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="forge-split">
        <div className="forge-feature">
          <div className="forge-feature-head">
            <FileText size={16} />
            <span>Paper, rebuilt</span>
          </div>
          {featured && (
            <Link to="/ml/papers" className="forge-feature-card">
              <div className="forge-thumb-frame forge-feature-thumb">
                <AttentionPaperViz />
              </div>
              <div className="forge-feature-text">
                <h3 className="forge-feature-title">{featured.title}</h3>
                {featured.summary && <p className="forge-feature-sub">{featured.summary}</p>}
                <span className="forge-pillar-cta">Read the walkthrough <ArrowUpRight size={13} /></span>
              </div>
            </Link>
          )}
        </div>

        <div className="forge-feature">
          <div className="forge-feature-head">
            <ListChecks size={16} />
            <span>Warm up on a problem</span>
          </div>
          <div className="forge-problem-list">
            {sampleProblems.map((p) => (
              <Link key={p.slug} to={`/ml/problems/${p.slug}`} className="forge-problem-row">
                <Code2 size={14} className="forge-problem-icon" />
                <span className="forge-problem-name">{p.title}</span>
                <span className={`forge-problem-diff forge-problem-diff-${p.difficulty}`}>{p.difficulty}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
