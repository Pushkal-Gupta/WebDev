import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './LearningHub.css';

function TutorialThumb() {
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Stacked essay lines">
      <rect x="18" y="20" width="120" height="11" rx="3" className="t-fill-strong" />
      <rect x="18" y="40" width="164" height="7" rx="3" className="t-fill" />
      <rect x="18" y="54" width="150" height="7" rx="3" className="t-fill" />
      <rect x="18" y="68" width="164" height="7" rx="3" className="t-fill" />
      <rect x="18" y="82" width="92" height="7" rx="3" className="t-fill" />
      <rect x="18" y="96" width="44" height="9" rx="4" className="t-fill-strong" />
      <rect x="18" y="40" width="3" height="65" rx="1.5" className="t-accent" />
    </svg>
  );
}

function ConceptsThumb() {
  const cells = [
    [22, 22], [80, 22], [138, 22],
    [22, 62], [80, 62], [138, 62],
  ];
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Grid of concept cards">
      {cells.map(([x, y], i) => (
        <g key={i} className={`c-card c-card-${i}`}>
          <rect x={x} y={y} width="40" height="36" rx="5" className="t-fill" />
          <rect x={x + 6} y={y + 7} width="20" height="4" rx="2" className="t-accent" />
          <rect x={x + 6} y={y + 16} width="28" height="3" rx="1.5" className="t-fill-strong" />
          <rect x={x + 6} y={y + 23} width="22" height="3" rx="1.5" className="t-fill-strong" />
        </g>
      ))}
    </svg>
  );
}

function CoursesThumb() {
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Lesson track with progress">
      <path d="M28 28 L172 28" className="t-track" />
      <path d="M28 60 L172 60" className="t-track" />
      <path d="M28 92 L172 92" className="t-track" />
      {[28, 72, 116, 160].map((x, i) => (
        <circle key={`a${i}`} cx={x} cy="28" r="6" className={i < 3 ? 't-node-done' : 't-node'} />
      ))}
      {[28, 72, 116, 160].map((x, i) => (
        <circle key={`b${i}`} cx={x} cy="60" r="6" className={i < 1 ? 't-node-done' : 't-node'} />
      ))}
      {[28, 72, 116, 160].map((x, i) => (
        <circle key={`c${i}`} cx={x} cy="92" r="6" className="t-node" />
      ))}
      <path d="M28 28 L116 28" className="t-track-done" />
      <path d="M28 60 L28 60" className="t-track-done" />
    </svg>
  );
}

function VisualizeThumb() {
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Animated bars with play control">
      {[
        [24, 64], [48, 42], [72, 78], [96, 30], [120, 54], [144, 70], [168, 46],
      ].map(([x, h], i) => (
        <rect key={i} x={x} y={100 - h} width="14" height={h} rx="3" className={`v-bar v-bar-${i}`} />
      ))}
      <circle cx="100" cy="60" r="20" className="v-play-ring" />
      <path d="M94 50 L94 70 L112 60 Z" className="t-accent" />
    </svg>
  );
}

function MLThumb() {
  const L0 = [30, 60, 90];
  const L1 = [38, 60, 82];
  const L2 = [50, 70];
  const nx = [44, 100, 156];
  const nodes = [
    ...L0.map(y => ({ x: nx[0], y })),
    ...L1.map(y => ({ x: nx[1], y })),
    ...L2.map(y => ({ x: nx[2], y })),
  ];
  const edges = [];
  L0.forEach(y0 => L1.forEach(y1 => edges.push([nx[0], y0, nx[1], y1])));
  L1.forEach(y1 => L2.forEach(y2 => edges.push([nx[1], y1, nx[2], y2])));
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Neural network sketch">
      {edges.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="m-edge" />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="8" className={`m-node m-node-${i % 3}`} />
      ))}
    </svg>
  );
}

function QuizThumb() {
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Quiz with answer options">
      <rect x="30" y="16" width="140" height="14" rx="4" className="t-fill-strong" />
      {[40, 62, 84].map((y, i) => (
        <g key={i} className={`q-opt q-opt-${i}`}>
          <circle cx="42" cy={y + 7} r="6" className={i === 1 ? 't-node-done' : 't-node'} />
          <rect x="56" y={y + 2} width={i === 1 ? 104 : 84} height="9" rx="4" className={i === 1 ? 't-accent' : 't-fill'} />
        </g>
      ))}
      <path d="M39 47 L41.5 50 L46 44" className="q-check" />
    </svg>
  );
}

const VERTICALS = [
  { to: '/tutorial', tag: 'Tutorial', title: 'DSA Tutorial', line: 'Deep topic essays with diagrams, complexity, and code.', hue: 'hue-violet', Thumb: TutorialThumb },
  { to: '/learn', tag: 'Concepts', title: 'Concept Reference', line: 'Problem-shaped intuition cards in four languages.', hue: 'hue-sky', Thumb: ConceptsThumb },
  { to: '/courses', tag: 'Courses', title: 'Structured Courses', line: 'Guided lesson tracks with exercises and worked examples.', hue: 'hue-mint', Thumb: CoursesThumb },
  { to: '/visualize', tag: 'Visualize', title: 'Visualizations', line: 'Step through every algorithm and data structure, frame by frame.', hue: 'hue-pink', Thumb: VisualizeThumb },
  { to: '/ml', tag: 'ML / DL / AI', title: 'Machine Learning', line: 'Linear algebra to transformers, built on interactive visuals.', hue: 'hue-violet', Thumb: MLThumb },
  { to: '/quiz', tag: 'Quizzes', title: 'Quizzes', line: 'Auto-graded checks to test recall on every topic.', hue: 'hue-sky', Thumb: QuizThumb },
];

export default function LearningHub() {
  return (
    <div className="lhub">
      <header className="lhub-hero">
        <h1 className="lhub-title">Learning</h1>
        <p className="lhub-sub">Essays, concept cards, courses, live visualizations, and machine learning.</p>
      </header>

      <section className="lhub-grid">
        {VERTICALS.map(v => {
          const { Thumb } = v;
          return (
            <Link key={v.to} to={v.to} className={`lhub-card ${v.hue}`}>
              <div className="lhub-thumb-wrap">
                <Thumb />
              </div>
              <div className="lhub-card-body">
                <span className="lhub-card-tag">{v.tag}</span>
                <h2 className="lhub-card-title">{v.title}</h2>
                <p className="lhub-card-line">{v.line}</p>
                <span className="lhub-card-cta">
                  Open <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
