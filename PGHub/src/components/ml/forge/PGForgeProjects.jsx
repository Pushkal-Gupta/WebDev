import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FolderGit2, ArrowRight } from 'lucide-react';
import { PG_FORGE_PROJECTS } from './pgForgeProjectsData';
import ForgeThumb from './ForgeThumb';
import './PGForgeProjects.css';

export default function PGForgeProjects() {
  return (
    <div className="forge-pj">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">Projects</span>
      </nav>

      <header className="forge-pj-header">
        <h1 className="forge-pj-title">
          <FolderGit2 size={26} className="forge-pj-title-icon" />
          Build something real
        </h1>
        <p className="forge-pj-sub">
          End-to-end builds that turn the concepts into something that runs. Pick one, ship it, then read the code you wrote.
        </p>
      </header>

      <section className="forge-pj-grid">
        {PG_FORGE_PROJECTS.map((p) => (
          <Link key={p.slug} to={`/ml/projects/${p.slug}`} className="forge-pj-card">
            <div className="forge-thumb-frame forge-pj-card-thumb">
              <ForgeThumb seed={p.title} topic={p.tags && p.tags[0]} label={p.title} />
              <span className={`forge-pj-diff forge-pj-diff-${p.difficulty}`}>{p.difficulty}</span>
            </div>
            <div className="forge-pj-card-body">
              <h2 className="forge-pj-card-title">{p.title}</h2>
              <p className="forge-pj-card-goal">{p.tagline}</p>
              <div className="forge-pj-tags">
                {p.tags.map((t) => (
                  <span key={t} className="forge-pj-tag">{t}</span>
                ))}
              </div>
              <span className="forge-pj-card-cta">
                Build it <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
