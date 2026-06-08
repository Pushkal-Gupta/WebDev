import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Brain, Sigma, Workflow, Calculator, Layers, Zap, Network } from 'lucide-react';
import { getGroup } from '../../content/mlGroups';
import { PILLARS as REGISTRY } from '../../content/mlContent';
import './MLHub.css';

const ICONS = { Sigma, Workflow, Brain };

const MODULE_ICONS = {
  foundations: Sigma,
  numerical: Calculator,
  optimization: Workflow,
  regularization: Layers,
  transformers: Brain,
  rl: Zap,
  architectures: Network,
};

export default function MLGroup() {
  const { groupSlug } = useParams();
  const group = getGroup(groupSlug);

  if (!group) {
    return (
      <div className="mlhub">
        <Link to="/ml" className="learn-crumb">
          <ArrowLeft size={13} />
          <span>ML-DL-AI</span>
        </Link>
        <h1 className="mlhub-title">Not found</h1>
        <p className="mlhub-sub">No group matches "{groupSlug}".</p>
      </div>
    );
  }

  const GroupIcon = ICONS[group.iconName] || Sigma;

  return (
    <div className="mlhub">
      <Link to="/ml" className="learn-crumb">
        <ArrowLeft size={13} />
        <span>ML-DL-AI</span>
        <span className="learn-crumb-sep">/</span>
        <span className="learn-crumb-here">{group.title}</span>
      </Link>

      <header className="mlhub-hero">
        <div className="mlhub-hero-icon">
          <GroupIcon size={26} />
        </div>
        <h1 className="mlhub-title">{group.title}</h1>
        <p className="mlhub-sub">{group.summary}</p>
      </header>

      <section className={`mlhub-pillars ${group.members.length === 3 ? 'mlhub-pillars-3' : 'mlhub-pillars-2'}`}>
        {group.members.map(m => {
          const mod = REGISTRY[m.slug];
          if (!mod) return null;
          const lessonCount = mod.lessons?.length || 0;
          const status = lessonCount > 0 ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}` : 'planned';
          const ModuleIcon = MODULE_ICONS[m.slug] || Sigma;
          return (
            <Link key={m.slug} to={`/ml/${m.slug}`} className="mlhub-pillar mlhub-pillar-group">
              <div className="mlhub-pillar-head">
                <ModuleIcon size={22} />
                <span className="mlhub-pillar-status">{status}</span>
              </div>
              <h2 className="mlhub-pillar-title">{m.label}</h2>
              <p className="mlhub-pillar-summary">{mod.oneLiner}</p>
              <span className="mlhub-card-cta">
                Open <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
