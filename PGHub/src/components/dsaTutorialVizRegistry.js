// Registry of tutorial-viz component names. Kept in a separate file so the
// .jsx component file can satisfy react-refresh's "only export components"
// rule. The shared markdown renderer imports the *names* (set membership)
// from here and the component from `dsaTutorialViz.jsx`.

export const TUT_VIZ_NAMES = new Set([
  'array-memory',
  'call-stack',
  'two-pointer-patterns',
  'hash-buckets',
  'knapsack-dp',
]);
