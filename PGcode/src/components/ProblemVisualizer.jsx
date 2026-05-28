import React from 'react';
import AlgoVisualizer, {
  ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer,
  NumberGridRenderer, TreeRenderer,
} from './learn/AlgoVisualizer';
import { RICH_CONTENT } from '../content/problemContent';
import { buildGenericTestCaseFrames } from './genericTestCaseViz';

const RENDERERS = {
  array:  ArrayBarRenderer,
  graph:  GraphRenderer,
  window: SlidingWindowRenderer,
  grid:   NumberGridRenderer,
  tree:   TreeRenderer,
};

// Tries (a) problem.viz_steps from the DB, (b) client-side RICH_CONTENT,
// (c) generic test-case walkthrough generated from test_cases + params,
// (d) friendly fallback when nothing is available.
export default function ProblemVisualizer({ problem }) {
  if (!problem) return null;

  let viz = problem.viz_steps || RICH_CONTENT[problem.id]?.viz || null;
  if (!viz || !viz.frames?.length) {
    viz = buildGenericTestCaseFrames(problem);
  }

  if (!viz || !viz.frames?.length) {
    return (
      <div style={{ padding: '1.2rem' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          No visualization for <strong style={{ color: 'var(--text-main)' }}>{problem.name}</strong> yet.
        </p>
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
