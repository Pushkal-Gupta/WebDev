import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sigma, Workflow, Layers, Brain, Sparkles, Zap, Network, ChevronRight, ArrowRight, Route,
} from 'lucide-react';
import { PILLARS } from '../../../content/mlContent';
import ForgeThumb from './ForgeThumb';
import './PGForgeRoadmaps.css';

const ICONS = { Sigma, Workflow, Layers, Brain, Sparkles, Zap, Network };

const TRACK = [
  { slug: 'foundations', note: 'Start here — the math under every formula.' },
  { slug: 'optimization', note: 'How models actually learn from the loss.' },
  { slug: 'regularization', note: 'Keep the model honest on data it has not seen.' },
  { slug: 'transformers', note: 'The architecture that reshaped the field.' },
  { slug: 'architectures', note: 'Generative templates: diffusion, VAEs, more.' },
  { slug: 'rl', note: 'Learning from reward instead of labels.' },
  { slug: 'numerical', note: 'The numerical toolkit that keeps training stable.' },
];

export default function PGForgeRoadmaps() {
  const steps = useMemo(
    () =>
      TRACK.map((t) => {
        const pillar = PILLARS[t.slug];
        return pillar
          ? { ...t, title: pillar.title, oneLiner: pillar.oneLiner, iconName: pillar.iconName, count: pillar.lessons?.length || 0 }
          : null;
      }).filter(Boolean),
    [],
  );

  const totalLessons = useMemo(() => steps.reduce((acc, s) => acc + s.count, 0), [steps]);

  return (
    <div className="forge-rm">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">Roadmaps</span>
      </nav>

      <header className="forge-rm-header">
        <h1 className="forge-rm-title">
          <Route size={26} className="forge-rm-title-icon" />
          Learning path
        </h1>
        <p className="forge-rm-sub">
          An ordered route through {steps.length} areas and {totalLessons} lessons — math foundations first,
          then how models learn, the architectures, and the numerical glue.
        </p>
      </header>

      <ol className="forge-rm-track">
        {steps.map((s, i) => {
          const Icon = ICONS[s.iconName] || Sigma;
          return (
            <li key={s.slug} className="forge-rm-step">
              <div className="forge-rm-rail">
                <span className="forge-rm-num">{i + 1}</span>
                {i < steps.length - 1 && <span className="forge-rm-line" />}
              </div>
              <Link to={`/ml/${s.slug}`} className="forge-rm-card">
                <div className="forge-thumb-frame forge-rm-card-thumb">
                  <ForgeThumb seed={s.title} />
                </div>
                <div className="forge-rm-card-body">
                  <div className="forge-rm-card-head">
                    <Icon size={20} className="forge-rm-card-icon" />
                    <h2 className="forge-rm-card-title">{s.title}</h2>
                    <span className="forge-rm-card-count">{s.count} lessons</span>
                  </div>
                  <p className="forge-rm-card-note">{s.note}</p>
                  <p className="forge-rm-card-desc">{s.oneLiner}</p>
                  <span className="forge-rm-card-cta">
                    Start <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
