// First-run tutorial. Three inline hint chips that fire in sequence as
// the player makes their first three spawns.

import { useEffect, useState } from 'react';

const HINTS = [
  { id: 'spawn',   text: 'Spawn → march → engage. Each unit has a per-id cooldown.' },
  { id: 'gold',    text: 'Gold trickles in every second. Spend it or save for evolve.' },
  { id: 'evolve',  text: 'Kills earn XP. Evolve when the badge glows — new units await.' },
];

export default function Tutorial({ activeIdx, onDismiss }) {
  const [closing, setClosing] = useState(false);
  const hint = activeIdx >= 0 && activeIdx < HINTS.length ? HINTS[activeIdx] : null;

  useEffect(() => {
    if (!hint) return;
    setClosing(false);
    const t = setTimeout(() => setClosing(true), 4400);
    return () => clearTimeout(t);
  }, [activeIdx, hint?.id]);

  if (!hint) return null;
  return (
    <div className={`es-tutorial${closing ? ' is-closing' : ''}`} role="status" aria-live="polite">
      <div className="es-tutorial-step">{activeIdx + 1}/3</div>
      <div className="es-tutorial-text">{hint.text}</div>
      <button type="button" className="es-tutorial-dismiss" onClick={onDismiss}>skip</button>
    </div>
  );
}
