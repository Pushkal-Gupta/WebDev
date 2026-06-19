import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Layers, ArrowLeft } from 'lucide-react';
import { COURSE_CARDS } from '../../content/courses';
import ForgeThumb from '../ml/forge/ForgeThumb';
import BrandLogo from '../common/BrandLogo';
import './Courses.css';

export default function CoursesIndex() {
  return (
    <div className="courses-container">
      <header className="courses-header">
        <Link to="/learning" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Learning</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">Courses</span>
        </Link>
        <h1 className="courses-title">Courses</h1>
        <p className="courses-sub">Runnable lessons in every language, auto-graded against expected output.</p>
      </header>

      <div className="courses-grid">
        {COURSE_CARDS.map(c => (
          <a
            key={c.id}
            href={c.href}
            className="course-card"
            style={c.color ? { '--course-color': c.color } : undefined}
          >
            <div className="course-card-thumb" aria-hidden="true">
              <ForgeThumb seed={c.title} label={c.language} />
              <span className="course-card-thumb-tint" />
            </div>
            <div className="course-card-body">
              <div className="course-card-top">
                <span className="course-lang-badge">
                  <BrandLogo kind="language" name={c.language} size={20} />
                </span>
                <div className="course-card-meta">
                  <span><Layers size={11} /> {c.lessonCount} lessons</span>
                  <span><Clock size={11} /> ~{c.estimatedHours}h</span>
                </div>
                <ArrowRight size={15} className="course-card-arrow" />
              </div>
              <h2 className="course-card-title">{c.title}</h2>
              <p className="course-card-blurb">{c.blurb}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
