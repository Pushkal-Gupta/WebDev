import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight, Clock, ArrowLeft, Target, Hammer, Wrench, Code2, ListChecks,
} from 'lucide-react';
import { getProject } from './pgForgeProjectsData';
import './PGForgeProjectDetail.css';

export default function PGForgeProjectDetail() {
  const { slug } = useParams();
  const project = useMemo(() => getProject(slug), [slug]);

  if (!project) {
    return (
      <div className="forge-pjd">
        <nav className="forge-crumb">
          <Link to="/ml" className="forge-crumb-link">PGForge</Link>
          <ChevronRight size={13} />
          <Link to="/ml/projects" className="forge-crumb-link">Projects</Link>
          <ChevronRight size={13} />
          <span className="forge-crumb-cur">Not found</span>
        </nav>
        <div className="forge-pjd-empty">
          <p>That project does not exist.</p>
          <Link to="/ml/projects" className="forge-pjd-back"><ArrowLeft size={14} /> Back to all projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forge-pjd">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <Link to="/ml/projects" className="forge-crumb-link">Projects</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">{project.title}</span>
      </nav>

      <header className="forge-pjd-header">
        <h1 className="forge-pjd-title">{project.title}</h1>
        <p className="forge-pjd-tagline">{project.tagline}</p>
        <div className="forge-pjd-meta">
          <span className={`forge-pjd-diff forge-pjd-diff-${project.difficulty}`}>{project.difficulty}</span>
          <span className="forge-pjd-meta-item"><Clock size={13} /> {project.estTime}</span>
          {project.tags.map((t) => (
            <span key={t} className="forge-pjd-tag">{t}</span>
          ))}
        </div>
      </header>

      <section className="forge-pjd-section">
        <h2 className="forge-pjd-section-title"><Target size={16} /> Overview</h2>
        <p className="forge-pjd-prose">{project.overview}</p>
      </section>

      <section className="forge-pjd-section">
        <h2 className="forge-pjd-section-title"><Hammer size={16} /> What you&apos;ll build</h2>
        <p className="forge-pjd-prose">{project.whatYouBuild}</p>
      </section>

      <section className="forge-pjd-section">
        <h2 className="forge-pjd-section-title"><Wrench size={16} /> Skills you&apos;ll practice</h2>
        <div className="forge-pjd-chips">
          {project.skills.map((s) => (
            <span key={s} className="forge-pjd-chip">{s}</span>
          ))}
        </div>
      </section>

      <section className="forge-pjd-section">
        <h2 className="forge-pjd-section-title"><ListChecks size={16} /> Build steps</h2>
        <ol className="forge-pjd-steps">
          {project.buildSteps.map((step, i) => (
            <li key={step.title} className="forge-pjd-step">
              <span className="forge-pjd-step-num">{i + 1}</span>
              <div className="forge-pjd-step-body">
                <h3 className="forge-pjd-step-title">{step.title}</h3>
                <p className="forge-pjd-step-detail">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="forge-pjd-section">
        <h2 className="forge-pjd-section-title"><Code2 size={16} /> Starter code</h2>
        <p className="forge-pjd-prose forge-pjd-prose-sm">A correct scaffold to build on — fill in the training loop and the parts the steps describe.</p>
        <pre className="forge-pjd-code"><code>{project.starterSnippet}</code></pre>
      </section>

      <Link to="/ml/projects" className="forge-pjd-back"><ArrowLeft size={14} /> Back to all projects</Link>
    </div>
  );
}
