import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sigma, ListChecks, FileText, Cpu, FolderGit2, Map, Route, Swords,
  ArrowRight, ArrowUpRight, Code2, BookOpen, Trophy, Table2,
  Play, Pause, StepForward, RotateCcw,
} from 'lucide-react';
import { PILLARS } from '../../../content/mlContent';
import { MATH_MODULES } from './pgForgeMathData';
import { PG_FORGE_PROBLEMS } from './pgForgeProblemsData';
import { PAPERS } from './pgForgePapersData';
import ForgeHubThumb, { PapersThumb } from './ForgeHubThumbs';
import './PGForgeHub.css';

// The eight surfaces of PGForge. ML Math owns the foundations; Lessons owns the
// applied/architecture track — they no longer both advertise "linear algebra",
// which is what read as duplicated.
const PILLAR_CARDS = [
  { to: '/ml/math',        icon: Sigma,      title: 'Foundations',  thumb: 'matrix',
    desc: 'Linear algebra, calculus, probability, optimization, and information theory — each with a live visual.' },
  { to: '/ml/learn',       icon: BookOpen,   title: 'Lessons',      thumb: 'network',
    desc: 'Deep nets, attention, transformers, diffusion, and RL — the architectures, end to end.' },
  { to: '/ml/projects',    icon: FolderGit2, title: 'Projects',     thumb: 'diffusion',
    desc: 'Build something real: a digit classifier, a small transformer, backprop from scratch.' },
  { to: '/ml/problems',    icon: ListChecks, title: 'Problems',     thumb: 'descent',
    desc: 'Implement optimizers, activations, losses, and classic models from scratch — one runnable task each.' },
  { to: '/ml/papers',      icon: FileText,   title: 'Papers',       thumb: 'paper',
    desc: 'Landmark reads rebuilt step by step — attention, residual nets, Adam, diffusion.' },
  { to: '/ml/cuda',        icon: Cpu,        title: 'CUDA Kernels', thumb: 'cuda',
    desc: 'Write the GPU kernels under the math — reductions, tiled matmul, softmax, scan.' },
  { to: '/ml/roadmaps',    icon: Map,        title: 'Roadmaps',     thumb: 'orbit',
    desc: 'An ordered path from math foundations through architectures to reinforcement learning.' },
  { to: '/ml/study-plans', icon: Route,      title: 'Study Plans',  thumb: 'wave',
    desc: 'Guided tracks that string lessons, problems, papers, and math into one route.' },
  { to: '/ml/progress',    icon: Trophy,     title: 'Progress',     thumb: 'bars',
    desc: 'Your solved-problem ring, badges, submission streak, and recent activity.' },
  { to: '/ml/sheets',      icon: Table2,     title: 'Sheets',       thumb: 'matrix',
    desc: 'Quick-reference cheat sheets — NumPy, PyTorch, CUDA, Triton, and ML interviews.' },
];

// A 3D loss surface with gradient descent rolling into the valley — projected to
// SVG (no external 3D dep). Height-coloured mesh (cool valleys, warm peaks) via
// theme hue tokens; a marker follows −∇L downhill and loops. The homepage's
// "do something" hero, matching the "drag the visual" promise.
const LOSS_N = 20;            // mesh resolution
const LOSS_RANGE = 2.3;       // domain half-width in each axis
const lossFn = (x, y) => 0.16 * (x * x + y * y) + 0.9 * Math.sin(1.15 * x) * Math.cos(1.15 * y);
const lossGrad = (x, y) => [
  0.32 * x + 0.9 * 1.15 * Math.cos(1.15 * x) * Math.cos(1.15 * y),
  0.32 * y - 0.9 * 1.15 * Math.sin(1.15 * x) * Math.sin(1.15 * y),
];

const STEP_MS = 150;
const clampDom = (v) => Math.max(-LOSS_RANGE, Math.min(LOSS_RANGE, v));

function LossSurfaceViz() {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const timer = useRef(null);

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

  // Restart the walk when the path is rebuilt (new lr / start).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setStep(0); }, [lr, start]);

  const last = step >= path.length - 1;
  useEffect(() => {
    if (!playing || reduce || last) return undefined;
    timer.current = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(timer.current);
  }, [playing, step, last, reduce]);

  const cur = path[Math.min(step, path.length - 1)];
  const curPt = project(cur.x, cur.y, cur.h + 0.06);
  const trail = path.slice(0, step + 1)
    .map((p) => { const q = project(p.x, p.y, p.h + 0.06); return `${q[0].toFixed(1)},${q[1].toFixed(1)}`; })
    .join(' ');
  const lossRange = hMax - hMin || 1;
  const norm = (cur.h - hMin) / lossRange;

  // Diagnose the run so the reader learns what the learning rate does.
  const finalLoss = path[path.length - 1].h;
  const maxLoss = Math.max(...path.map((p) => p.h));
  const status = maxLoss > path[0].h + 0.4
    ? { label: 'diverging', cls: 'is-bad' }
    : (finalLoss > hMin + 0.12 * lossRange && maxLoss > path[0].h + 0.02)
      ? { label: 'oscillating', cls: 'is-warn' }
      : { label: 'converging', cls: 'is-good' };

  const reset = () => { setPlaying(false); setStep(0); };

  return (
    <div className="forge-hero-viz">
      <div className="forge-hero-viz-head">
        <span className="forge-hero-viz-title">Loss surface L(w) — gradient descent</span>
        <span className="forge-hero-viz-read">step {step} · loss {cur.h.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 320 200" className="forge-hero-viz-svg" role="img"
        aria-label="3D loss surface with an interactive gradient-descent path">
        <g>
          {cells.map((cell, i) => (
            <polygon
              key={i}
              points={cell.pts}
              fill={`color-mix(in srgb, var(--warning) ${Math.round(cell.t * 100)}%, var(--hue-sky))`}
              stroke="var(--surface)"
              strokeWidth="0.35"
              opacity="0.92"
            />
          ))}
        </g>
        <polyline points={trail} fill="none" stroke="var(--text-main)" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
        <circle cx={curPt[0]} cy={curPt[1]} r="6" fill="none"
          stroke="var(--accent)" strokeWidth="1.5" opacity={0.35 + 0.4 * (1 - norm)} />
        <circle cx={curPt[0]} cy={curPt[1]} r="3.4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1" />
      </svg>

      <div className="forge-hero-ctl">
        <button className="forge-hero-btn" onClick={() => (last ? reset() : setPlaying((p) => !p))}>
          {playing && !last ? <Pause size={13} /> : <Play size={13} />}{playing && !last ? 'Pause' : (last ? 'Replay' : 'Play')}
        </button>
        <button className="forge-hero-btn" onClick={() => setStep((s) => Math.min(path.length - 1, s + 1))} disabled={last}>
          <StepForward size={13} /> Step
        </button>
        <button className="forge-hero-btn" onClick={reset}><RotateCcw size={13} /> Reset</button>
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
        Drag the sliders: raise the <b>learning rate</b> and the marker overshoots and oscillates; too high and it diverges up the warm ridges. Move the start point to drop into a different basin.
      </p>
    </div>
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
        </div>
        <LossSurfaceViz />
      </section>

      <section className="forge-section">
        <div className="forge-section-head">
          <h2 className="forge-section-title">Pick a surface</h2>
        </div>
        <div className="forge-pillar-grid">
          {PILLAR_CARDS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.to} to={s.to} className="forge-pillar">
                <div className="forge-thumb-frame forge-pillar-thumb">
                  <ForgeHubThumb to={s.to} />
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
                <PapersThumb />
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
