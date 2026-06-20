// Plain-JS helpers shared between the DSA Tutorial index + topic pages.
// Kept separate from the JSX-returning components so Vite's fast-refresh rule
// (react-refresh/only-export-components) stays happy.

export function normName(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function passesFilter(item, filterKind, problemByName, byId) {
  if (filterKind === 'all') return true;
  if (filterKind === 'theory') return item.kind === 'theory' || item.kind === 'topic';
  if (filterKind === 'problems') return item.kind === 'problem';
  if (filterKind === 'unsolved') {
    if (item.kind !== 'problem') return false;
    const p = problemByName.get(normName(item.label));
    if (!p) return false;
    return !byId[p.id]?.is_completed;
  }
  return true;
}
