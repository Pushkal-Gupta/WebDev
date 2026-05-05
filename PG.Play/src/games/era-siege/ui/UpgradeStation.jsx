// UpgradeStation — a visible on-stage button anchored to the player
// base. Clicking it opens the PowerUps drawer where the player spends
// gold on the seven upgrade trees (economy / base HP / special / turret
// / troop dmg / hp / range).
//
// AoW2 has a dedicated "upgrade station" UI in front of each base —
// without it, players don't know they can upgrade, since the only
// alternative is the small bolt icon in the top-bar's tools row.
//
// The button shows:
//   - icon (Lucide ArrowUp inside a circle)
//   - small "UPGRADE" label
//   - the player's CURRENT total upgrade level (sum of all trees)
//     so spending feels measurable. Clicking opens the drawer.
//
// Affordability is computed against the cheapest available upgrade
// tier so the button only flashes "is-affordable" when at least one
// tree can still be bought right now.

import { useMemo } from 'react';
import { POWERUP_DEFS } from '../sim/powerups.js';
import { Icon } from '../../../icons.jsx';

export default function UpgradeStation({ gold, powerups, onOpen }) {
  const totalLevel = useMemo(() => {
    if (!powerups) return 0;
    return Object.values(powerups).reduce((s, v) => s + (v | 0), 0);
  }, [powerups]);

  // Cheapest available tier across all trees — ignore trees already
  // at their max level (the next tier index is undefined).
  const cheapest = useMemo(() => {
    if (!powerups) return Infinity;
    let best = Infinity;
    for (const def of POWERUP_DEFS) {
      const lvl = (powerups[def.id] | 0);
      const next = def.levels?.[lvl];   // undefined when at cap
      if (next && next.cost < best) best = next.cost;
    }
    return best;
  }, [powerups]);

  const canAfford = gold >= cheapest;

  return (
    <button
      type="button"
      className={`es-upgrade-station${canAfford ? ' is-affordable' : ''}`}
      onClick={onOpen}
      title="Upgrade base — buy power-ups (U)"
      aria-label="Open upgrade station">
      <span className="es-upgrade-icon" aria-hidden="true">
        {Icon.bolt}
      </span>
      <span className="es-upgrade-stack">
        <span className="es-upgrade-label">UPGRADE</span>
        <span className="es-upgrade-level">LV {totalLevel}</span>
      </span>
    </button>
  );
}
