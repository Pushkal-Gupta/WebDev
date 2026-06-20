import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sigma, ListChecks, FileText, Cpu, FolderGit2, Map, Route, Swords,
  ArrowRight, ArrowUpRight, Code2, BookOpen, Trophy, Table2,
} from 'lucide-react';
import { PILLARS } from '../../../content/mlContent';
import { MATH_MODULES } from './pgForgeMathData';
import { PG_FORGE_PROBLEMS } from './pgForgeProblemsData';
import { PAPERS } from './pgForgePapersData';
import ForgeThumb from './ForgeThumb';
import './PGForgeHub.css';

// The eight surfaces of PGForge. ML Math owns the foundations; Lessons owns the
// applied/architecture track — they no longer both advertise "linear algebra",
// which is what read as duplicated.
const PILLAR_CARDS = [
  { to: '/ml/math',        icon: Sigma,      title: 'Foundations',  thumb: 'matrix',
    desc: 'Linear algebra, calculus, probability, optimization, and information theory — each with a live visual.' },
  { to: '/ml/learn',       icon: BookOpen,   title: 'Lessons',      thumb: 'network',
    desc: 'Deep nets, attention, transformers, diffusion, and RL — the architectures, end to end.' },
  { to: '/ml/problems',    icon: ListChecks, title: 'Problems',     thumb: 'descent',
    desc: 'Implement optimizers, activations, losses, and classic models from scratch — one runnable task each.' },
  { to: '/ml/papers',      icon: FileText,   title: 'Papers',       thumb: 'paper',
    desc: 'Landmark reads rebuilt step by step — attention, residual nets, Adam, diffusion.' },
  { to: '/ml/cuda',        icon: Cpu,        title: 'CUDA Kernels', thumb: 'cuda',
    desc: 'Write the GPU kernels under the math — reductions, tiled matmul, softmax, scan.' },
  { to: '/ml/projects',    icon: FolderGit2, title: 'Projects',     thumb: 'diffusion',
    desc: 'Build something real: a digit classifier, a small transformer, backprop from scratch.' },
  { to: '/ml/roadmaps',    icon: Map,        title: 'Roadmaps',     thumb: 'orbit',
    desc: 'An ordered path from math foundations through architectures to reinforcement learning.' },
  { to: '/ml/study-plans', icon: Route,      title: 'Study Plans',  thumb: 'wave',
    desc: 'Guided tracks that string lessons, problems, papers, and math into one route.' },
  { to: '/ml/progress',    icon: Trophy,     title: 'Progress',     thumb: 'bars',
    desc: 'Your solved-problem ring, badges, submission streak, and recent activity.' },
  { to: '/ml/sheets',      icon: Table2,     title: 'Sheets',       thumb: 'matrix',
    desc: 'Quick-reference cheat sheets — NumPy, PyTorch, CUDA, Triton, and ML interviews.' },
];

// A self-contained interactive: larger batches average out gradient noise.
// Pure local state, deterministic scatter — the kind of "do something" element
// the homepage should lead with.
function GradientNoiseViz() {
  const [batch, setBatch] = useState(128);
  const noise = 150 / Math.sqrt(batch);
  const dots = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 40; i += 1) {
      const x = 16 + (i / 39) * 268;
      // deterministic pseudo-random in [-1,1]
      const r = Math.sin(i * 12.9898) * 43758.5453;
      const jitter = (r - Math.floor(r)) * 2 - 1;
      pts.push({ x, jitter });
    }
    return pts;
  }, []);

  return (
    <div className="forge-hero-viz">
      <div className="forge-hero-viz-head">
        <span className="forge-hero-viz-title">Gradient noise vs batch size</span>
        <span className="forge-hero-viz-read">batch = {batch}</span>
      </div>
      <svg viewBox="0 0 300 120" className="forge-hero-viz-svg" role="img" aria-label="gradient noise scatter">
        <line x1="8" y1="60" x2="292" y2="60" className="forge-hero-viz-axis" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={60 + d.jitter * noise} r="2.6"
            fill="var(--accent)" opacity={0.75} />
        ))}
      </svg>
      <input
        className="forge-hero-slider"
        type="range" min="8" max="1024" step="8"
        value={batch}
        onChange={(e) => setBatch(Number(e.target.value))}
        aria-label="batch size"
      />
      <p className="forge-hero-viz-cap">
        Bigger batches shrink the spread of the gradient estimate by about 1/&radic;n — smoother steps, fewer updates.
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
        <GradientNoiseViz />
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
                  <ForgeThumb kind={s.thumb} seed={s.title} />
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
                <ForgeThumb kind="paper" seed={featured.title} />
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
