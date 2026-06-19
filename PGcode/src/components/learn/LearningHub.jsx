import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './LearningHub.css';

function TutorialThumb() {
  /* a tree / flow diagram that draws itself in, node by node */
  const edges = [
    'M100 26 L56 60', 'M100 26 L144 60',
    'M56 72 L34 100', 'M56 72 L78 100',
    'M144 72 L122 100', 'M144 72 L166 100',
  ];
  const nodes = [
    [100, 26, 0], [56, 66, 1], [144, 66, 1],
    [34, 100, 2], [78, 100, 2], [122, 100, 2], [166, 100, 2],
  ];
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A tree diagram building itself out">
      <g className="tt-edges">
        {edges.map((d, i) => (
          <path key={i} d={d} className={`tt-edge tt-edge-${i}`} />
        ))}
      </g>
      {nodes.map(([cx, cy, lvl], i) => (
        <g key={i} className={`tt-node tt-node-${i}`} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r={lvl === 0 ? 11 : 8} className={lvl === 0 ? 't-node-done' : 't-node-soft'} />
          {lvl === 0 && <circle cx={cx} cy={cy} r="11" className="tt-pulse" />}
        </g>
      ))}
    </svg>
  );
}

function ConceptsThumb() {
  const cells = [
    [20, 18], [80, 18], [140, 18],
    [20, 56], [80, 56], [140, 56],
  ];
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A grid of concept cards drifting">
      {cells.map(([x, y], i) => (
        <g key={i} className={`cc-card cc-card-${i}`} style={{ transformOrigin: `${x + 21}px ${y + 22}px` }}>
          <rect x={x} y={y} width="42" height="44" rx="6" className="t-fill" />
          <rect x={x} y={y} width="42" height="44" rx="6" className="cc-edge" />
          <rect x={x + 7} y={y + 8} width="18" height="5" rx="2.5" className="t-accent" />
          <rect x={x + 7} y={y + 19} width="29" height="3.5" rx="1.75" className="t-fill-strong" />
          <rect x={x + 7} y={y + 27} width="24" height="3.5" rx="1.75" className="t-fill-strong" />
          <rect x={x + 7} y={y + 35} width="20" height="3.5" rx="1.75" className="t-fill-strong" />
        </g>
      ))}
    </svg>
  );
}

function CoursesThumb() {
  /* a stepped lesson path; a marker travels the track, nodes light as it passes */
  const nodes = [[30, 92], [70, 64], [110, 88], [150, 52], [180, 30]];
  const linkPath = 'M30 92 L70 64 L110 88 L150 52 L180 30';
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A lesson path with a moving progress marker">
      <path d={linkPath} className="cr-track" />
      <path d={linkPath} className="cr-track-fill" pathLength="100" />
      {nodes.map(([cx, cy], i) => (
        <g key={i} className={`cr-node cr-node-${i}`} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r="7" className="t-node-soft" />
          <circle cx={cx} cy={cy} r="3" className="cr-dot" />
        </g>
      ))}
      <circle r="5.5" className="cr-marker">
        <animateMotion dur="4.4s" repeatCount="indefinite" rotate="auto" keyPoints="0;0.22;0.5;0.72;1;1" keyTimes="0;0.22;0.5;0.72;0.92;1" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0 0 1 1" path={linkPath} />
      </circle>
    </svg>
  );
}

function VisualizeThumb() {
  /* sorting bars that continuously rise/settle, with a sweeping scan line */
  const bars = [
    [22, 58], [44, 36], [66, 74], [88, 28], [110, 50], [132, 66], [154, 42], [176, 60],
  ];
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Sorting bars rising and settling with a scanning highlight">
      {bars.map(([x, h], i) => (
        <rect key={i} x={x} y={100 - h} width="14" height={h} rx="3" className={`vz-bar vz-bar-${i}`} style={{ transformOrigin: `${x + 7}px 100px` }} />
      ))}
      <rect className="vz-scan" x="0" y="20" width="16" height="84" rx="4" />
    </svg>
  );
}

function QuizThumb() {
  /* multiple-choice options; selection cycles and a check stamps in */
  const opts = [22, 50, 78];
  return (
    <svg className="lhub-thumb" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Quiz options being answered and checked">
      <rect x="26" y="14" width="120" height="9" rx="4" className="t-fill-strong" />
      <rect x="26" y="27" width="78" height="6" rx="3" className="t-fill" />
      {opts.map((y, i) => (
        <g key={i} className={`qz-opt qz-opt-${i}`}>
          <rect x="26" y={y} width="148" height="20" rx="6" className="qz-box" />
          <circle cx="40" cy={y + 10} r="6" className="qz-mark" />
          <path d={`M36.5 ${y + 10} L39 ${y + 12.5} L43.5 ${y + 7.5}`} className="qz-check" />
          <rect x="54" y={y + 6.5} width={[70, 92, 56][i]} height="7" rx="3.5" className="t-fill" />
        </g>
      ))}
    </svg>
  );
}

const VERTICALS = [
  { to: '/visualize', tag: 'Visualize', title: 'Visualizations', line: 'Step through every algorithm and data structure, frame by frame.', Thumb: VisualizeThumb, hue: 'var(--hue-sky)' },
  { to: '/courses', tag: 'Courses', title: 'Structured Courses', line: 'Guided lesson tracks with exercises and worked examples.', Thumb: CoursesThumb, hue: 'var(--hue-mint)' },
  { to: '/learn', tag: 'Concepts', title: 'Concept Reference', line: 'Problem-shaped intuition cards in four languages.', Thumb: ConceptsThumb, hue: 'var(--hue-violet)' },
  { to: '/tutorial', tag: 'Tutorial', title: 'DSA Tutorial', line: 'Deep topic essays with diagrams, complexity, and code.', Thumb: TutorialThumb, hue: 'var(--hue-pink)' },
  { to: '/quiz', tag: 'Quizzes', title: 'Quizzes', line: 'Auto-graded checks to test recall on every topic.', Thumb: QuizThumb, hue: 'var(--warning)' },
];

export default function LearningHub() {
  return (
    <div className="lhub">
      <header className="lhub-hero">
        <h1 className="lhub-title"><span style={{ color: 'var(--text-dim)', fontSize: '0.6em', opacity: 0.55, fontWeight: 600 }}>PG</span>Learn</h1>
        <p className="lhub-sub">Visualizations, courses, concept cards, essays, and quizzes for every topic.</p>
      </header>

      <section className="lhub-grid">
        {VERTICALS.map(v => {
          const { Thumb } = v;
          return (
            <Link key={v.to} to={v.to} className="lhub-card" style={{ '--card-hue': v.hue }}>
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
