import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sigma, Network, Workflow, ArrowRight, Zap, Layers } from 'lucide-react';
import './MLHub.css';

const PILLARS = [
  {
    to: '/ml/foundations',
    icon: Sigma,
    title: 'Linear Algebra & Calculus',
    summary: 'Vectors, matrices, dot products, norms, derivatives, gradients, Jacobians, Hessians. The bedrock every ML formula stands on, written without the academic fog.',
    items: ['Vector / matrix operations', 'Eigenvalues + SVD intuition', 'Gradients & directional derivatives', 'Chain rule for deep nets'],
    status: 'planned',
  },
  {
    to: '/ml/optimization',
    icon: Workflow,
    title: 'Optimization',
    summary: 'Gradient descent and its zoo of variants — SGD, momentum, RMSprop, Adam, AdamW, Lion. Why each one exists, what it fixes, when it breaks.',
    items: ['Convex vs non-convex landscapes', 'Learning-rate schedules', 'Second-order methods', 'Adaptive optimizers'],
    status: 'planned',
  },
  {
    to: '/ml/regularization',
    icon: Layers,
    title: 'Regularization & Generalization',
    summary: 'Overfitting is the default. L1, L2, dropout, batch norm, layer norm, early stopping, data augmentation — pick the right knob for the right symptom.',
    items: ['L1 / L2 / elastic-net', 'Dropout & DropConnect', 'BatchNorm vs LayerNorm', 'Label smoothing'],
    status: 'planned',
  },
  {
    to: '/ml/transformers',
    icon: Brain,
    title: 'Attention & Transformers',
    summary: 'Scaled dot-product attention, multi-head attention, positional encodings, encoder/decoder stacks, KV cache, RoPE, grouped-query attention — the architecture that ate the field.',
    items: ['Self-attention from scratch', 'Multi-head & masked attention', 'Position encodings (sinus, RoPE, ALiBi)', 'KV cache + inference math'],
    status: 'planned',
  },
  {
    to: '/ml/rl',
    icon: Zap,
    title: 'Reinforcement Learning',
    summary: 'Bellman equations, policy gradients, Q-learning, actor-critic, PPO. From bandits to robots to RLHF — one framework, many faces.',
    items: ['Markov Decision Processes', 'Q-learning + Deep Q-Networks', 'Policy gradients (REINFORCE, A2C)', 'PPO / GRPO / RLHF'],
    status: 'planned',
  },
  {
    to: '/ml/numerical',
    icon: Network,
    title: 'Numerical Methods',
    summary: 'Floating-point gotchas, root finding, ODE solvers, linear-system tricks, FFT. The "why is my loss NaN" toolkit.',
    items: ['Floating-point pitfalls', 'Newton + bisection', 'ODE / PDE numerical solvers', 'Fast Fourier Transform'],
    status: 'planned',
  },
];

export default function MLHub() {
  return (
    <div className="mlhub">
      <header className="mlhub-hero">
        <span className="mlhub-eyebrow">In development — content not written yet</span>
        <h1 className="mlhub-title">ML / DL / AI</h1>
        <p className="mlhub-sub">Linear algebra, optimization, deep nets, attention, RL, numerical methods.</p>
      </header>

      <section className="mlhub-pillars">
        {PILLARS.map(p => {
          const Icon = p.icon;
          return (
            <Link key={p.to} to={p.to} className="mlhub-pillar">
              <div className="mlhub-pillar-head">
                <Icon size={22} />
                <span className="mlhub-pillar-status">{p.status}</span>
              </div>
              <h2 className="mlhub-pillar-title">{p.title}</h2>
              <p className="mlhub-pillar-summary">{p.summary}</p>
              <ul className="mlhub-pillar-items">
                {p.items.map(i => <li key={i}>{i}</li>)}
              </ul>
              <span className="mlhub-pillar-cta">Preview <ArrowRight size={13} /></span>
            </Link>
          );
        })}
      </section>

    </div>
  );
}
