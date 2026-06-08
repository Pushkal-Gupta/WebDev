export const GROUPS = {
  foundations: {
    iconName: 'Sigma',
    title: 'Foundations',
    summary: 'The math every model runs on — vectors, matrices, gradients, numerical stability.',
    members: [
      { slug: 'foundations', label: 'Linear Algebra & Calculus' },
      { slug: 'numerical', label: 'Numerical Methods' },
    ],
  },
  training: {
    iconName: 'Workflow',
    title: 'Training & Tuning',
    summary: 'How models actually learn — and what to do when they refuse to.',
    members: [
      { slug: 'optimization', label: 'Optimization' },
      { slug: 'regularization', label: 'Regularization & Generalization' },
    ],
  },
  architectures: {
    iconName: 'Brain',
    title: 'Architectures & Agents',
    summary: 'The architectures that ate the field, plus the framework that learns from reward.',
    members: [
      { slug: 'transformers', label: 'Attention & Transformers' },
      { slug: 'rl', label: 'Reinforcement Learning' },
      { slug: 'architectures', label: 'Generative Architectures' },
    ],
  },
};

export function getGroup(slug) {
  return GROUPS[slug] || null;
}

export function moduleToGroup(moduleSlug) {
  for (const [groupSlug, g] of Object.entries(GROUPS)) {
    if (g.members.some(m => m.slug === moduleSlug)) return groupSlug;
  }
  return null;
}
