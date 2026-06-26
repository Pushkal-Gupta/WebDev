import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ListChecks, ArrowRight } from 'lucide-react';
import { PG_FORGE_STUDY_PLANS } from './pgForgeStudyPlansData';
import Breadcrumb from '../../common/Breadcrumb';
import ForgeThumb from './ForgeThumb';
import './PGForgeStudyPlans.css';

export default function PGForgeStudyPlans() {
  const plans = useMemo(
    () =>
      PG_FORGE_STUDY_PLANS.map((p) => ({
        ...p,
        stepCount: p.steps.length,
      })),
    [],
  );

  return (
    <div className="forge-sp">
      <Breadcrumb items={[{ label: 'PGForge', to: '/ml' }, { label: 'Study plans' }]} />

      <header className="forge-sp-header">
        <h1 className="forge-sp-title">Study Plans</h1>
        <p className="forge-sp-sub">Guided, ordered tracks that string lessons, problems, and papers into one path.</p>
      </header>

      <div className="forge-sp-grid">
        {plans.map((p, i) => (
          <Link key={p.slug} to={`/ml/study-plans/${p.slug}`} className="forge-sp-card">
            <div className="forge-thumb-frame forge-sp-card-thumb">
              <ForgeThumb seed={p.title} index={i} topic={p.slug} label={p.title} />
              <span className={`forge-sp-level forge-sp-level-${p.level}`}>{p.level}</span>
            </div>
            <div className="forge-sp-card-body">
              <h2 className="forge-sp-card-title">{p.title}</h2>
              <p className="forge-sp-card-blurb">{p.blurb}</p>
              <div className="forge-sp-card-foot">
                <span className="forge-sp-card-meta">
                  <Clock size={12} /> {p.estimatedHours}h
                  <span className="forge-sp-dot" />
                  <ListChecks size={12} /> {p.stepCount} steps
                </span>
                <ArrowRight size={15} className="forge-sp-card-arrow" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
