// Tiny chip showing the current difficulty.

import { DIFFICULTIES } from '../content/difficulties.js';

export default function DifficultyChip({ difficultyId }) {
  const d = DIFFICULTIES[difficultyId] || DIFFICULTIES.standard;
  return (
    <div className={`es-diff-chip is-${d.id}`} title={d.blurb}>
      {d.label}
    </div>
  );
}
