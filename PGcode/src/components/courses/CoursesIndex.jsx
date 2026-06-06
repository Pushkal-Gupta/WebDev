import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Clock, Layers, ArrowLeft } from 'lucide-react';
import { COURSE_CARDS } from '../../content/courses';
import './Courses.css';

const LANG_ICON = {
  python: 'Py', javascript: 'JS', java: 'Ja', cpp: 'C++', sql: 'SQL',
};

export default function CoursesIndex() {
  return (
    <div className="courses-container">
      <header className="courses-header">
        <Link to="/learning" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Learning</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">Courses</span>
        </Link>
        <span className="courses-eyebrow"><BookOpen size={11} /> Courses</span>
        <h1 className="courses-title">Learn by doing</h1>
        <p className="courses-sub">
          Runnable code in every lesson, auto-graded against expected output. Pick a language, or
          dive into the SQL project.
        </p>
      </header>

      <div className="courses-grid">
        {COURSE_CARDS.map(c => (
          <a
            key={c.id}
            href={c.href}
            className="course-card"
            style={{ '--course-color': c.color }}
          >
            <div className="course-card-top">
              <span className="course-lang-badge" style={{ background: c.color }}>
                {LANG_ICON[c.language] || c.language.slice(0, 3).toUpperCase()}
              </span>
              <div className="course-card-meta">
                <span><Layers size={11} /> {c.lessonCount} lessons</span>
                <span><Clock size={11} /> ~{c.estimatedHours}h</span>
              </div>
            </div>
            <h2 className="course-card-title">{c.title}</h2>
            <p className="course-card-blurb">{c.blurb}</p>
            <span className="course-card-cta">
              Start course <ArrowRight size={13} />
            </span>
          </a>
        ))}
      </div>

      <div className="courses-foot">
        <p>
          For algorithms, head to{' '}
          <Link to="/learn">Concepts</Link> for written explanations or{' '}
          <Link to="/visualize">Visualizations</Link> for animated walkthroughs.
        </p>
      </div>
    </div>
  );
}
