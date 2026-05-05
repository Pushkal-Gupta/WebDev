// In-game help / shortcuts panel. Toggled with `?`.
//
// Three sections:
//   1. How to play  — 5 short bullets so a first-time player can ramp
//   2. Controls     — current keybindings (kept in sync with input.js)
//   3. Tips         — short strategic notes

import { useEffect } from 'react';

const HOW_TO_PLAY = [
  'Spawn units from the bottom dock — gold is reserved on click and drains the spawn queue as the cooldown clears.',
  'Each kill earns gold + XP. Watch the gold-coin and xp-orb particles fly to the HUD.',
  'Lay a turret SPOT first (cheap 30g foundation), then place one of three turret tiers. Click a built turret to upgrade Range / Damage / Rate.',
  'When the EVOLVE badge glows, hit it. Each era unlocks new units, a new turret tier, and a new special.',
  'Two specials per era: Q is the cheap fast one, W is the long-cooldown clutch one. Watch the cooldown radials.',
];

const CONTROL_ROWS = [
  { keys: ['1', '2', '3'],     action: 'Queue unit (left / middle / right dock card)' },
  { keys: ['Q'],               action: 'Cast primary special' },
  { keys: ['W'],               action: 'Cast secondary special' },
  { keys: ['Space'],           action: 'Cast primary special (alias)' },
  { keys: ['Z', 'X', 'C'],     action: 'Open turret slot 1 / 2 / 3' },
  { keys: ['R'],               action: 'Evolve to next era (when ready)' },
  { keys: ['P'],               action: 'Pause / resume' },
  { keys: ['U'],               action: 'Open Power-ups drawer' },
  { keys: ['?'],               action: 'Toggle this card' },
  { keys: ['Esc'],             action: 'Close any open drawer' },
];

const TIPS = [
  'The General is locked at start — pay 300g to unlock, then deploy to flip a stalled lane.',
  'Power-ups in the U drawer are PERMANENT for the run — Treasury (gold trickle) and Long-Sighted (range) usually pay back fast.',
  'Selling a turret refunds 50%. The SPOT itself stays built; you can drop a different tier in the same slot for just the turret cost.',
  'Population caps at 10 alive + queued. Cancel a queued unit to free a slot (and recover 50% of its cost).',
  'Difficulty scales the AI — Insane gives the enemy more spawns and slows your gold trickle by 30%.',
];

export default function ShortcutsOverlay({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="es-shortcuts" role="dialog" aria-label="How to play & shortcuts" onClick={onClose}>
      <div className="es-shortcuts-card es-shortcuts-card-wide" onClick={(e) => e.stopPropagation()}>
        <header className="es-shortcuts-head">
          <h3>How to play</h3>
        </header>

        <section className="es-help-section">
          <h4>Game flow</h4>
          <ol className="es-help-list">
            {HOW_TO_PLAY.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </section>

        <section className="es-help-section">
          <h4>Controls</h4>
          <ul className="es-shortcuts-list">
            {CONTROL_ROWS.map((row, i) => (
              <li key={i} className="es-shortcuts-row">
                <span className="es-shortcuts-keys">
                  {row.keys.map((k, j) => (
                    <kbd key={j}>{k}</kbd>
                  ))}
                </span>
                <span className="es-shortcuts-action">{row.action}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="es-help-section">
          <h4>Tips</h4>
          <ul className="es-help-list es-help-list-tips">
            {TIPS.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>

        <footer className="es-shortcuts-foot">
          Click anywhere or press <kbd>?</kbd> / <kbd>Esc</kbd> to close
        </footer>
      </div>
    </div>
  );
}
