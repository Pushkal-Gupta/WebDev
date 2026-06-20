import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight, Clock, ListChecks, ArrowRight,
  BookOpen, Code2, FileText, Sigma, Hammer,
} from 'lucide-react';
import { getStudyPlan } from './pgForgeStudyPlansData';
import './PGForgeStudyPlanDetail.css';

const KIND_ICON = {
  lesson: BookOpen,
  problem: Code2,
  paper: FileText,
  math: Sigma,
  project: Hammer,
};

const KIND_LABEL = {
  lesson: 'Lesson',
  problem: 'Problem',
  paper: 'Paper',
  math: 'Math',
  project: 'Project',
};

export default function PGForgeStudyPlanDetail() {
  const { slug } = useParams();
  const plan = useMemo(() => getStudyPlan(slug), [slug]);

  if (!plan) {
    return (
      <div className="forge-spd">
        <nav className="forge-crumb">
          <Link to="/ml" className="forge-crumb-link">PGForge</Link>
          <ChevronRight size={13} />
          <Link to="/ml/study-plans" className="forge-crumb-link">Study Plans</Link>
          <ChevronRight size={13} />
          <span className="forge-crumb-cur">Not found</span>
        </nav>
        <div className="forge-spd-empty">
          <p>That study plan does not exist.</p>
          <Link to="/ml/study-plans" className="forge-spd-back">Back to all plans</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forge-spd">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <Link to="/ml/study-plans" className="forge-crumb-link">Study Plans</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">{plan.title}</span>
      </nav>

      <header className="forge-spd-header">
        <h1 className="forge-spd-title">{plan.title}</h1>
        <div className="forge-spd-meta">
          <span className={`forge-spd-level forge-spd-level-${plan.level}`}>{plan.level}</span>
          <span className="forge-spd-meta-item"><Clock size={13} /> {plan.estimatedHours}h</span>
          <span className="forge-spd-meta-item"><ListChecks size={13} /> {plan.steps.length} steps</span>
        </div>
        <p className="forge-spd-blurb">{plan.blurb}</p>
      </header>

      <ol className="forge-spd-track">
        {plan.steps.map((step, i) => {
          const Icon = KIND_ICON[step.kind] || BookOpen;
          const last = i === plan.steps.length - 1;
          const inner = (
            <>
              <div className="forge-spd-rail">
                <span className="forge-spd-num">{i + 1}</span>
                {!last && <span className="forge-spd-line" />}
              </div>
              <div className="forge-spd-body">
                <div className="forge-spd-row-top">
                  <span className={`forge-spd-chip forge-spd-chip-${step.kind}`}>
                    <Icon size={12} /> {KIND_LABEL[step.kind] || step.kind}
                  </span>
                  <h3 className="forge-spd-step-title">{step.title}</h3>
                  {step.to && <ArrowRight size={16} className="forge-spd-arrow" />}
                </div>
                <p className="forge-spd-detail">{step.detail}</p>
              </div>
            </>
          );

          return (
            <li key={`${step.title}-${i}`} className="forge-spd-step">
              {step.to ? (
                <Link to={step.to} className="forge-spd-stepinner is-link">{inner}</Link>
              ) : (
                <div className="forge-spd-stepinner">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
