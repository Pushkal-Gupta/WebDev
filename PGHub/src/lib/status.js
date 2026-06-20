// Status taxonomy + legacy mapping for the 6-state problem progress system.
// Lives in lib/ (not components/StatusPill.jsx) so fast-refresh doesn't complain
// about a component file exporting non-component values.

export const STATUSES = [
  { value: 'not_started',    label: 'Not Started',    color: 'dim' },
  { value: 'attempted',      label: 'Attempted',      color: 'medium' },
  { value: 'solved',         label: 'Solved',         color: 'easy' },
  { value: 'mastered',       label: 'Mastered',       color: 'accent' },
  { value: 'bookmarked',     label: 'Bookmarked',     color: 'medium' },
  { value: 'needs_revision', label: 'Needs Revision', color: 'hard' },
];

export const STATUS_BY_VALUE = Object.fromEntries(STATUSES.map(s => [s.value, s]));

export function legacyToStatus(progress) {
  if (!progress) return 'not_started';
  if (progress.status) return progress.status;
  if (progress.is_completed) return 'solved';
  if (progress.is_starred) return 'bookmarked';
  return 'not_started';
}
