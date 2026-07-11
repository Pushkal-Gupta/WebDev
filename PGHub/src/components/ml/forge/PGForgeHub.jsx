import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sigma, ListChecks, FileText, Cpu, FolderGit2, Map, Route, Swords,
  ArrowRight, ArrowUpRight, Code2, BookOpen, Trophy, Table2,
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

function LossSurfaceViz() {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const { cells, path, project, hMin, hMax } = useMemo(() => {
    // Sample the grid heights.
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
    // Continuous isometric projection from (gridX, gridY, height) -> screen.
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

    // Build the mesh cells, back-to-front (painter's algorithm).
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

    // Gradient descent trajectory from a high corner into the nearest basin.
    let x = 1.75, y = -1.55;
    const lr = 0.16;
    const pts = [];
    for (let s = 0; s <= 34; s += 1) {
      const h = lossFn(x, y);
      pts.push({ x, y, h });
      const [gx, gy] = lossGrad(x, y);
      x = Math.max(-LOSS_RANGE, Math.min(LOSS_RANGE, x - lr * gx));
      y = Math.max(-LOSS_RANGE, Math.min(LOSS_RANGE, y - lr * gy));
    }
    return { cells: c, path: pts, project: projectXY, hMin: lo, hMax: hi };
  }, []);

  const [step, setStep] = useState(reduce ? path.length - 1 : 0);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => {
      setStep((s) => (s >= path.length - 1 ? 0 : s + 1));
    }, 130);
    return () => clearInterval(id);
  }, [reduce, path.length]);

  const cur = path[Math.min(step, path.length - 1)];
  const curPt = project(cur.x, cur.y, cur.h + 0.06);
  const trail = path.slice(0, step + 1)
    .map((p) => { const q = project(p.x, p.y, p.h + 0.06); return `${q[0].toFixed(1)},${q[1].toFixed(1)}`; })
    .join(' ');
  const lossRange = hMax - hMin || 1;
  const norm = (cur.h - hMin) / lossRange;

  return (
    <div className="forge-hero-viz">
      <div className="forge-hero-viz-head">
        <span className="forge-hero-viz-title">Loss surface L(w) — gradient descent</span>
        <span className="forge-hero-viz-read">step {step} · loss {cur.h.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 320 200" className="forge-hero-viz-svg" role="img"
        aria-label="3D loss surface with a gradient-descent path rolling into the valley">
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
      <p className="forge-hero-viz-cap">
        Each step follows &minus;&nabla;L downhill; the marker settles in the nearest basin. Warm ridges are saddles and local minima the optimizer must avoid.
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
