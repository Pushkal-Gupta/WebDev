import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronRight, Target, Code2 } from 'lucide-react';
import { getCuda } from './pgForgeCudaData';
import './PGForgeCudaDetail.css';

export default function PGForgeCudaDetail() {
  const { slug } = useParams();
  const lesson = useMemo(() => getCuda(slug), [slug]);

  if (!lesson) return <Navigate to="/ml/cuda" replace />;

  return (
    <div className="forge-cd">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <Link to="/ml/cuda" className="forge-crumb-link">CUDA kernels</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">{lesson.title}</span>
      </nav>

      <div className="forge-cd-meta">
        <span className={`forge-cd-diff forge-cd-diff-${lesson.difficulty}`}>
          {lesson.difficulty}
        </span>
        <span className="forge-cd-cat">{lesson.category}</span>
      </div>
      <h1 className="forge-cd-title">{lesson.title}</h1>
      <p className="forge-cd-summary">{lesson.summary}</p>

      <div className="forge-cd-grid">
        <section className="forge-cd-left" aria-label="Walkthrough">
          <div className="forge-cd-goal">
            <div className="forge-cd-goal-head">
              <Target size={14} />
              <span>Goal</span>
            </div>
            <p className="forge-cd-goal-text">{lesson.goal}</p>
          </div>

          <h2 className="forge-cd-sec">Build it step by step</h2>
          <ol className="forge-cd-steps">
            {lesson.steps.map((step, i) => (
              <li key={i} className="forge-cd-step">
                <span className="forge-cd-step-num">{i + 1}</span>
                <div className="forge-cd-step-body">
                  <span className="forge-cd-step-title">{step.title}</span>
                  <span className="forge-cd-step-detail">{step.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="forge-cd-right" aria-label="Kernel source">
          <div className="forge-cd-code-head">
            <Code2 size={13} />
            <span>kernel.cu</span>
            <span className="forge-cd-code-lang">CUDA C++</span>
          </div>
          <pre className="forge-cd-code"><code>{lesson.code}</code></pre>
        </section>
      </div>
    </div>
  );
}
