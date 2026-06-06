import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sigma, Workflow, ArrowRight } from 'lucide-react';
import { PILLARS as REGISTRY } from '../../content/mlContent';
import './MLHub.css';

const GROUPS = [
  {
    icon: Sigma,
    title: 'Foundations',
    summary: 'The math every model runs on — vectors, matrices, gradients, numerical stability.',
    members: [
      { slug: 'foundations', label: 'Linear Algebra & Calculus' },
      { slug: 'numerical', label: 'Numerical Methods' },
    ],
    items: [
      'Vectors, dot products, projections',
      'Eigenvalues, SVD, PCA intuition',
      'Gradients, Jacobians, chain rule',
      'Floating-point pitfalls and stable computation',
    ],
  },
  {
    icon: Workflow,
    title: 'Training & Tuning',
    summary: 'How models actually learn — and what to do when they refuse to.',
    members: [
      { slug: 'optimization', label: 'Optimization' },
      { slug: 'regularization', label: 'Regularization & Generalization' },
    ],
    items: [
      'SGD, momentum, RMSprop, Adam, Lion',
      'Learning-rate schedules, warmup, cosine',
      'L1 / L2, dropout, batch / layer norm',
      'Convex vs non-convex landscapes',
    ],
  },
  {
    icon: Brain,
    title: 'Architectures & Agents',
    summary: 'The architectures that ate the field, plus the framework that learns from reward.',
    members: [
      { slug: 'transformers', label: 'Attention & Transformers' },
      { slug: 'rl', label: 'Reinforcement Learning' },
    ],
    items: [
      'Self-attention, multi-head, masking',
      'Position encodings (sinus, RoPE, ALiBi)',
      'KV cache + inference math',
      'Q-learning, policy gradients, PPO, RLHF',
    ],
  },
];

function totalLessons(slugs) {
  return slugs.reduce((acc, slug) => acc + (REGISTRY[slug]?.lessons?.length || 0), 0);
}

export default function MLHub() {
  return (
    <div className="mlhub">
      <header className="mlhub-hero">
        <h1 className="mlhub-title">ML-DL-AI</h1>
        <p className="mlhub-sub">Linear algebra, optimization, deep nets, attention, RL, numerical methods.</p>
      </header>

      <section className="mlhub-pillars mlhub-pillars-3">
        {GROUPS.map(g => {
          const Icon = g.icon;
          const lessonCount = totalLessons(g.members.map(m => m.slug));
          const status = lessonCount > 0 ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}` : 'planned';
          return (
            <article key={g.title} className="mlhub-pillar mlhub-pillar-group">
              <div className="mlhub-pillar-head">
                <Icon size={26} />
                <span className="mlhub-pillar-status">{status}</span>
              </div>
              <h2 className="mlhub-pillar-title">{g.title}</h2>
              <p className="mlhub-pillar-summary">{g.summary}</p>

              <ul className="mlhub-pillar-items">
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>

              <div className="mlhub-group-modules">
                {g.members.map(m => (
                  <Link key={m.slug} to={`/ml/${m.slug}`} className="mlhub-group-chip">
                    {m.label} <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
