import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, GraduationCap, ArrowRight, Play } from 'lucide-react';
import './LearningHub.css';

const VERTICALS = [
  {
    to: '/tutorial',
    icon: BookOpen,
    tag: 'Tutorial',
    title: 'DSA Tutorial',
    summary: 'Deep topic essays — theory, ASCII diagrams, complexity, pitfalls.',
    bullets: ['25+ topics', 'Python code', 'Linked problems'],
    hue: 'hue-violet',
  },
  {
    to: '/learn',
    icon: Layers,
    tag: 'Concepts',
    title: 'Concept Reference',
    summary: 'Problem-shaped intuition cards with brute, optimal, and 4-language code.',
    bullets: ['200+ cards', 'Python / JS / Java / C++', 'Inline visualizations'],
    hue: 'hue-sky',
  },
  {
    to: '/courses',
    icon: GraduationCap,
    tag: 'Courses',
    title: 'Structured Courses',
    summary: 'Multi-lesson tracks: theory + worked example + exercise + common-mistake.',
    bullets: ['10-15 lessons each', 'Monaco editor exercises', 'Multi-language'],
    hue: 'hue-mint',
  },
];

const SECONDARY = [
  {
    to: '/visualize',
    icon: Play,
    title: 'Visualize',
    summary: 'Step through algorithms frame by frame.',
  },
  {
    to: '/quiz',
    icon: BookOpen,
    title: 'Quizzes',
    summary: 'Five-question concept checks per topic.',
  },
];

export default function LearningHub() {
  return (
    <div className="lhub">
      <header className="lhub-hero">
        <h1 className="lhub-title">Learning</h1>
        <p className="lhub-sub">Three ways in: tutorial essays, concept cards, guided courses.</p>
      </header>

      <section className="lhub-verticals">
        {VERTICALS.map(v => {
          const Icon = v.icon;
          return (
            <Link key={v.to} to={v.to} className={`lhub-vert ${v.hue}`}>
              <div className="lhub-vert-head">
                <Icon size={20} />
                <span className="lhub-vert-tag">{v.tag}</span>
              </div>
              <h2 className="lhub-vert-title">{v.title}</h2>
              <p className="lhub-vert-summary">{v.summary}</p>
              <ul className="lhub-vert-bullets">
                {v.bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
              <span className="lhub-vert-cta">
                Open {v.tag.toLowerCase()} <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="lhub-secondary">
        {SECONDARY.map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.to} to={s.to} className="lhub-side">
              <div className="lhub-side-head">
                <Icon size={16} />
                <span>{s.title}</span>
              </div>
              <p>{s.summary}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
