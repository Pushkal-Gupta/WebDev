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

// Auto-generated frames from raw test inputs only make sense for the array renderer;
// tree / graph / grid need structured shapes we can't infer from a stringified input.
const AUTO_FRAME_RENDERERS = new Set(['array', 'window']);

function inferRendererFromTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return 'array';
  const norm = tags
    .map((t) => (typeof t === 'string' ? t : t?.slug || t?.name || ''))
    .filter(Boolean)
    .map((t) => t.toLowerCase());
  const has = (needle) => norm.some((t) => t.includes(needle));

  if (has('tree') || has('binary-tree') || has('bst') || has('trie')) return 'tree';
  if (has('graph') || has('dfs') || has('bfs') || has('topological')) return 'graph';
  if (has('sliding-window') || has('sliding window')) return 'window';
  if (has('matrix') || has('grid')) return 'grid';
  return 'array';
}

// Tries (a) problem.viz_steps from the DB, (b) client-side RICH_CONTENT,
// (c) generic test-case walkthrough generated from test_cases + params,
// (d) friendly fallback when nothing is available.
//
// `vizAnchor` (optional) names the variant the solution page wants to step
// through. When `viz_steps` is shaped as a map of {anchorKey: {frames, ...}},
// or carries a `variants` map, we pick the matching variant; otherwise it's a
// no-op and the default viz renders.
export default function ProblemVisualizer({ problem, vizAnchor = null }) {
  if (!problem) return null;

  const baseViz = problem.viz_steps || RICH_CONTENT[problem.id]?.viz || null;
  let viz = baseViz;
  if (vizAnchor && baseViz && typeof baseViz === 'object') {
    const variant = baseViz.variants?.[vizAnchor] || baseViz[vizAnchor];
    if (variant && Array.isArray(variant.frames)) {
      viz = variant;
    }
  }

  if (!viz || !viz.frames?.length) {
    const inferred = inferRendererFromTags(problem.tags);
    if (AUTO_FRAME_RENDERERS.has(inferred)) {
      viz = buildGenericTestCaseFrames(problem);
      if (viz && inferred === 'window') viz = { ...viz, renderer: 'window' };
    } else {
      return (
        <div style={{ padding: '1.2rem' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            No visualization available for <strong style={{ color: 'var(--text-main)' }}>{problem.name}</strong> yet — open any test case to view inputs.
          </p>
        </div>
      );
    }
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
