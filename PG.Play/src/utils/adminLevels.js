// Single source of truth for the admin level-jump panel.
// Lists every game that supports starting at an arbitrary level, with
// human-readable level names. The settings drawer renders pickers from
// this; the game components consume the override via consumeAdminStartLevel.

export const ADMIN_LEVELS = [
  {
    id: 'badicecream',
    name: 'Frost Fight',
    note: 'Cold Aisle theme — 20 rooms.',
    levels: Array.from({ length: 20 }, (_, i) => ({
      value: i,
      label: `Room ${i + 1}`,
    })),
  },
  {
    id: 'bricklands',
    name: 'Bricklands',
    note: 'Three handcrafted worlds.',
    levels: [
      { value: 0, label: 'World 1 — Meadow' },
      { value: 1, label: 'World 2 — Foundry' },
      { value: 2, label: 'World 3 — Sky' },
    ],
  },
  {
    id: 'fbwg',
    name: 'Ember & Tide',
    note: 'Three co-op chambers.',
    levels: [
      { value: 0, label: 'Chamber 1' },
      { value: 1, label: 'Chamber 2' },
      { value: 2, label: 'Chamber 3' },
    ],
  },
  {
    id: 'bob',
    name: 'Night Shift',
    note: 'Three stealth floors.',
    levels: [
      { value: 0, label: 'Floor 1' },
      { value: 1, label: 'Floor 2' },
      { value: 2, label: 'Floor 3' },
    ],
  },
  {
    id: 'vex',
    name: 'Trace',
    note: 'Six precision rooms.',
    levels: Array.from({ length: 6 }, (_, i) => ({
      value: i,
      label: `Room ${i + 1}`,
    })),
  },
  {
    id: 'hook',
    name: 'Swingwire',
    note: 'Three skyline courses.',
    levels: [
      { value: 0, label: 'Course 1' },
      { value: 1, label: 'Course 2' },
      { value: 2, label: 'Course 3' },
    ],
  },
  {
    id: 'cutrope',
    name: 'Snip',
    note: 'Twelve physics puzzles.',
    levels: Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: `Puzzle ${i + 1}`,
    })),
  },
  {
    id: 'bloons',
    name: 'Loft Defense',
    note: 'Ten waves on the line.',
    levels: Array.from({ length: 10 }, (_, i) => ({
      value: i,
      label: `Wave ${i + 1}`,
    })),
  },
];

export function getAdminLevels(gameId) {
  return ADMIN_LEVELS.find((g) => g.id === gameId) || null;
}
