// Three turret slots. Each slot can build/upgrade to the player's current
// era. A slot already at current era shows a muted "ready" state.

import { getTurretForEra, SELL_REFUND_PCT } from '../content/turrets.js';
import { getEraByIndex } from '../content/eras.js';

export default function TurretRack({ slots, eraIndex, gold, onBuild, onSell }) {
  const era = getEraByIndex(eraIndex);
  const def = era ? getTurretForEra(era.id) : null;
  if (!def) return null;
  return (
    <div className="es-rack" role="group" aria-label="Turret slots">
      {slots.map((t, i) => {
        const isCurrentEra = t && t.eraIndex === eraIndex;
        const isOlderEra   = t && t.eraIndex < eraIndex;
        const empty = !t;
        const tooPoor = gold < def.buildCost;
        const disabled = isCurrentEra || tooPoor;
        const hint = empty ? `Build ${def.name}` : isOlderEra ? `Upgrade to ${def.name}` : 'Already current';
        const refund = t ? Math.round(t.buildCost * SELL_REFUND_PCT) : 0;
        return (
          <div key={i} className={`es-slot${empty ? ' is-empty' : ''}${isCurrentEra ? ' is-current' : ''}${isOlderEra ? ' is-old' : ''}`}>
            <button
              type="button"
              className={`es-slot-build${disabled ? ' is-disabled' : ''}`}
              onClick={() => onBuild(i)}
              disabled={disabled}
              title={`${hint} · ${def.buildCost}g`}
              aria-label={`Slot ${i + 1}: ${hint}, ${def.buildCost} gold`}>
              <div className="es-slot-key" aria-hidden="true">{['Q','W','E'][i]}</div>
              <div className="es-slot-label">
                {empty ? 'Empty' : t.turretId.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')}
              </div>
              <div className={`es-slot-cost${tooPoor ? ' is-poor' : ''}`}>
                {isCurrentEra ? 'ready' : `${def.buildCost}g`}
              </div>
            </button>
            {t && (
              <button
                type="button"
                className="es-slot-sell"
                onClick={() => onSell(i)}
                title={`Sell for ${refund}g (50% refund)`}
                aria-label={`Sell turret in slot ${i + 1} for ${refund} gold`}>
                sell · {refund}g
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
