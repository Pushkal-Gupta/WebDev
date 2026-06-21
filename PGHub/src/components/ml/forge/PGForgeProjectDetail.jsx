import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight, Clock, ArrowLeft, Target, Hammer, Wrench, Code2, ListChecks,
  Gauge, Layers, Flag, CheckCircle2, Play,
} from 'lucide-react';
import { getProject } from './pgForgeProjectsData';
import ForgeThumb from './ForgeThumb';
import RunnableCodePanel from '../../RunnableCodePanel';
import './PGForgeProjectDetail.css';

// Deterministic accent hue per project so each detail page reads distinctly but
// stays inside the theme palette. Mirrors the hash approach ForgeThumb uses.
const HUES = ['var(--accent)', 'var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];
function hueFor(seed) {
  let h = 2166136261;
  for (let i = 0; i < (seed || '').length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return HUES[Math.abs(h) % HUES.length];
}

export default function PGForgeProjectDetail() {
  const { slug } = useParams();
  const project = useMemo(() => getProject(slug), [slug]);
  const hue = useMemo(() => hueFor(project ? project.title : slug || ''), [project, slug]);

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

  const stepCount = project.buildSteps.length;

  return (
    <div className="forge-pjd" style={{ '--pjd-hue': hue }}>
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <Link to="/ml/projects" className="forge-crumb-link">Projects</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">{project.title}</span>
      </nav>

      {/* HERO */}
      <header className="forge-pjd-hero">
        <div className="forge-pjd-hero-main">
          <span className="forge-pjd-kicker">Build project</span>
          <h1 className="forge-pjd-title">{project.title}</h1>
          <p className="forge-pjd-tagline">{project.tagline}</p>
          <div className="forge-pjd-meta">
            <span className={`forge-pjd-diff forge-pjd-diff-${project.difficulty}`}>
              <Gauge size={12} /> {project.difficulty}
            </span>
            <span className="forge-pjd-meta-item"><Clock size={13} /> {project.estTime}</span>
            <span className="forge-pjd-meta-item"><Layers size={13} /> {stepCount} steps</span>
          </div>
          <div className="forge-pjd-tags">
            {project.tags.map((t) => (
              <span key={t} className="forge-pjd-tag">{t}</span>
            ))}
          </div>
        </div>
        <div className="forge-pjd-hero-thumb">
          <ForgeThumb seed={project.title} label={project.title} />
        </div>
      </header>

      <div className="forge-pjd-body">
        {/* OVERVIEW + WHAT YOU BUILD */}
        <div className="forge-pjd-split">
          <section className="forge-pjd-card forge-pjd-span">
            <h2 className="forge-pjd-section-title"><Target size={16} /> Overview</h2>
            <p className="forge-pjd-prose">{project.overview}</p>
          </section>

          <section className="forge-pjd-card forge-pjd-build">
            <h2 className="forge-pjd-section-title"><Hammer size={16} /> What you finish with</h2>
            <p className="forge-pjd-prose">{project.whatYouBuild}</p>
          </section>
        </div>

        {/* SKILLS */}
        <section className="forge-pjd-section">
          <h2 className="forge-pjd-section-title"><Wrench size={16} /> Skills you put to work</h2>
          <div className="forge-pjd-chips">
            {project.skills.map((s) => (
              <span key={s} className="forge-pjd-chip"><CheckCircle2 size={13} /> {s}</span>
            ))}
          </div>
        </section>

        {/* BUILD STEPS — stepper */}
        <section className="forge-pjd-section">
          <h2 className="forge-pjd-section-title"><ListChecks size={16} /> Build it step by step</h2>
          <ol className="forge-pjd-steps">
            {project.buildSteps.map((step, i) => (
              <li key={step.title} className="forge-pjd-step">
                <div className="forge-pjd-step-rail">
                  <span className="forge-pjd-step-num">{i + 1}</span>
                  {i < stepCount - 1 && <span className="forge-pjd-step-line" />}
                </div>
                <div className="forge-pjd-step-body">
                  <h3 className="forge-pjd-step-title">{step.title}</h3>
                  <p className="forge-pjd-step-detail">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* STARTER CODE — runnable */}
        {project.starterSnippet && (
          <section className="forge-pjd-section">
            <h2 className="forge-pjd-section-title"><Code2 size={16} /> Starter scaffold</h2>
            <p className="forge-pjd-prose forge-pjd-prose-sm">
              A correct scaffold to build on. Run it as is to see the baseline, then fill in the
              parts the steps describe and run again to watch it improve.
            </p>
            <div className="forge-pjd-runner">
              <RunnableCodePanel
                code={project.starterSnippet}
                lang="python"
                title={`${project.title} — starter`}
                storageKey={`pjd-${project.slug}`}
                minLines={6}
              />
            </div>
          </section>
        )}

        {/* OUTCOME */}
        <section className="forge-pjd-outcome">
          <Flag size={16} className="forge-pjd-outcome-icon" />
          <div>
            <h2 className="forge-pjd-outcome-title">When you reach the end</h2>
            <p className="forge-pjd-prose">
              You will have written {project.whatYouBuild.charAt(0).toLowerCase() + project.whatYouBuild.slice(1)}
              {' '}Read back the code you wrote, then start the next build.
            </p>
          </div>
        </section>

        <div className="forge-pjd-footer">
          <Link to="/ml/projects" className="forge-pjd-back"><ArrowLeft size={14} /> All projects</Link>
          {project.starterSnippet && (
            <span className="forge-pjd-footer-hint"><Play size={13} /> Run the scaffold above to begin</span>
          )}
        </div>
      </div>
    </div>
  );
}
