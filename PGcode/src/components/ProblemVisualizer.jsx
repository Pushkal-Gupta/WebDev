import React from 'react';
import { Link } from 'react-router-dom';
import AlgoVisualizer, {
  ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer,
  NumberGridRenderer, TreeRenderer,
} from './learn/AlgoVisualizer';
import { RICH_CONTENT } from '../content/problemContent';
import { ArrowRight } from 'lucide-react';

const RENDERERS = {
  array:  ArrayBarRenderer,
  graph:  GraphRenderer,
  window: SlidingWindowRenderer,
  grid:   NumberGridRenderer,
  tree:   TreeRenderer,
};

// Tries (a) problem.viz_steps from the DB, (b) client-side RICH_CONTENT,
// (c) shows a friendly fallback pointing to the closest concept walkthrough.
export default function ProblemVisualizer({ problem }) {
  if (!problem) return null;

  const viz = problem.viz_steps || RICH_CONTENT[problem.id]?.viz || null;

  if (!viz || !viz.frames?.length) {
    return (
      <div style={{ padding: '1.2rem' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
          No per-problem visualization yet for <strong style={{ color: 'var(--text-main)' }}>{problem.name}</strong>.
          Try the closest concept walkthrough:
        </p>
        <Link
          to="/visualize"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--accent)',
            color: 'var(--bg)',
            padding: '0.5rem 0.95rem',
            borderRadius: '6px',
            fontFamily: 'var(--mono)',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textDecoration: 'none',
          }}
        >
          Browse 20 algorithm visualizations <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const Renderer = RENDERERS[viz.renderer] || ArrayBarRenderer;

  return (
    <div style={{ padding: '1rem' }}>
      <AlgoVisualizer
        title={viz.title}
        frames={viz.frames}
        render={(frame) => <Renderer frame={frame} />}
      />
    </div>
  );
}
