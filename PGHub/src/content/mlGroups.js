// `parent` is the section each group sits under. It exists so breadcrumbs can
// show the real path instead of collapsing every page to "PGForge > here".
// Keep it in sync with what actually links to the group: MLHub lists `training`
// and `architectures` under Lessons and deliberately skips `foundations`, whose
// material lives under Foundations (/forge/math).
const LESSONS_PARENT = { label: 'Lessons', to: '/forge/learn' };
const FOUNDATIONS_PARENT = { label: 'Foundations', to: '/forge/math' };

export const GROUPS = {
  foundations: {
    parent: FOUNDATIONS_PARENT,
    iconName: 'Sigma',
    title: 'Foundations',
    summary: 'The math every model runs on — vectors, matrices, gradients, numerical stability.',
    members: [
      { slug: 'foundations', label: 'Linear Algebra & Calculus' },
      { slug: 'numerical', label: 'Numerical Methods' },
    ],
  },
  training: {
    parent: LESSONS_PARENT,
    iconName: 'Workflow',
    title: 'Training & Tuning',
    summary: 'How models actually learn — and what to do when they refuse to.',
    members: [
      { slug: 'optimization', label: 'Optimization' },
      { slug: 'regularization', label: 'Regularization & Generalization' },
    ],
  },
  architectures: {
    parent: LESSONS_PARENT,
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

// Builds the full ancestor chain for any page in the PGForge learn tree, in the
// shape <Breadcrumb> wants, so the group, module and lesson pages can never
// disagree about the path:
//
//   PGForge > Lessons > Training & Tuning > Optimization > Momentum
//
// Pass only the levels that are ANCESTORS of the page you are on; `current` is
// the page itself and <Breadcrumb> renders it inert. So the group page passes
// `{ current: group.title, groupSlug }`, a module page adds `moduleSlug`, and a
// lesson page adds `moduleSlug` + `moduleTitle`. `search` is threaded through so
// filter/query state survives a hop upward.
export function forgeTrail({ groupSlug, moduleSlug, moduleTitle, current, search = '' } = {}) {
  const trail = [{ label: 'PGForge', to: `/forge${search}` }];

  const gSlug = groupSlug || (moduleSlug ? moduleToGroup(moduleSlug) : null);
  const group = gSlug ? GROUPS[gSlug] : null;

  if (group?.parent) {
    trail.push({ label: group.parent.label, to: `${group.parent.to}${search}` });
  }

  // The group is an ancestor only when the page sits under it — i.e. when a
  // module was named. On the group page itself, `current` is the group.
  //
  // The dedupe guard is for `foundations`, whose group title and parent section
  // are both "Foundations" — without it the trail reads "PGForge > Foundations >
  // Foundations > Linear Algebra & Calculus". Comparing against whatever is
  // last keeps this general rather than special-casing that one slug.
  if (group && moduleSlug) {
    const above = trail[trail.length - 1]?.label;
    if (group.title.toLowerCase() !== String(above).toLowerCase()) {
      trail.push({ label: group.title, to: `/forge/g/${gSlug}${search}` });
    }
  }

  // Likewise the module: `moduleTitle` is supplied only by pages below it.
  if (moduleSlug && moduleTitle) {
    trail.push({ label: moduleTitle, to: `/forge/${moduleSlug}${search}` });
  }

  trail.push({ label: current });
  return trail;
}
