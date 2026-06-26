import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowRight, Brain, Sigma, Workflow, Calculator, Layers, Zap, Network, BarChart3 } from 'lucide-react';
import { getGroup } from '../../content/mlGroups';
import { PILLARS as REGISTRY } from '../../content/mlContent';
import Breadcrumb from '../common/Breadcrumb';
import ForgeThumb from './forge/ForgeThumb';
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
  const location = useLocation();
  const group = getGroup(groupSlug);

  if (!group) {
    return (
      <div className="mlhub">
        <Breadcrumb items={[{ label: 'PGForge', to: '/ml' }, { label: 'Group' }]} />
        <h1 className="mlhub-title">Not found</h1>
        <p className="mlhub-sub">No group matches "{groupSlug}".</p>
      </div>
    );
  }

  const GroupIcon = ICONS[group.iconName] || Sigma;

  return (
    <div className="mlhub">
      <Breadcrumb items={[{ label: 'PGForge', to: '/ml' }, { label: group.title }]} />

      <header className="mlhub-hero">
        <div className="mlhub-hero-icon">
          <GroupIcon size={26} />
        </div>
        <h1 className="mlhub-title">{group.title}</h1>
        <p className="mlhub-sub">{group.summary}</p>
      </header>

      <section className={`mlhub-pillars ${group.members.length === 3 ? 'mlhub-pillars-3' : 'mlhub-pillars-2'}`}>
        {group.members.map((m, i) => {
          const mod = REGISTRY[m.slug];
          if (!mod) return null;
          const lessonCount = mod.lessons?.length || 0;
          const ModuleIcon = MODULE_ICONS[m.slug] || Sigma;
          return (
            <Link key={m.slug} to={`/ml/${m.slug}${location.search}`} className="mlhub-pillar mlhub-lesson-card">
              <span className="mlhub-pillar-stripe" aria-hidden="true" />
              <div className="mlhub-lesson-thumb" aria-hidden="true">
                <ForgeThumb seed={m.label} index={i} kind={m.slug} label={m.label.split(/\s+/)[0]} />
              </div>
              <div className="mlhub-lesson-body">
                <div className="mlhub-lesson-head">
                  <span className="mlhub-pillar-iconbox"><ModuleIcon size={16} /></span>
                  <ArrowRight size={16} className="mlhub-pillar-arrow" />
                </div>
                <h2 className="mlhub-lesson-title">{m.label}</h2>
                {mod.oneLiner && <p className="mlhub-lesson-summary">{mod.oneLiner}</p>}
                <div className="mlhub-pillar-chips">
                  <span className="mlhub-chip">
                    <BarChart3 size={12} />
                    {lessonCount > 0 ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}` : 'planned'}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
