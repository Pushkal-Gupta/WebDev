// Achievement unlock toast — slides in from the top edge after a
// match ends, one card per newly-unlocked achievement. Auto-dismisses
// after 4 seconds. Stacks vertically when multiple unlock at once.

import { useEffect } from 'react';

const TOAST_LIFE_MS = 4500;

export default function AchievementToast({ unlocked, onClear }) {
  useEffect(() => {
    if (!unlocked.length) return;
    const t = setTimeout(() => onClear(), TOAST_LIFE_MS);
    return () => clearTimeout(t);
  }, [unlocked, onClear]);

  if (!unlocked.length) return null;

  return (
    <div className="es-ach-toast-wrap" role="status" aria-live="polite">
      {unlocked.map((a) => (
        <div key={a.id} className="es-ach-toast">
          <div className="es-ach-toast-tag">ACHIEVEMENT UNLOCKED</div>
          <div className="es-ach-toast-name">{a.name}</div>
          <div className="es-ach-toast-desc">{a.description}</div>
        </div>
      ))}
    </div>
  );
}
