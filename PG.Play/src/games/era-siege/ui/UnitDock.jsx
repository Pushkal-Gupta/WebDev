// Three unit cards for the player's current era.
// A failed click (insufficient gold) flashes the offending card red so
// the player gets immediate visual feedback even if audio is muted.

import { useRef, useState } from 'react';
import { getUnit } from '../content/units.js';

export default function UnitDock({ unitIds, gold, cooldownsMs, onSpawn }) {
  const [flashId, setFlashId] = useState(null);
  const flashTimeoutRef = useRef(null);

  const triggerPoorFlash = (id) => {
    setFlashId(id);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlashId(null), 360);
  };

  return (
    <div className="es-dock" role="group" aria-label="Spawn unit">
      {unitIds.map((id, idx) => {
        const def = getUnit(id);
        if (!def) return null;
        const cd = cooldownsMs[id] || 0;
        const cdR = cd > 0 ? cd / def.spawnCooldownMs : 0;
        const tooPoor = gold < def.cost;
        const disabled = cd > 0;
        const isFlashing = flashId === id;
        const click = () => {
          if (disabled) return;          // cooldown — silently ignore
          if (tooPoor) { triggerPoorFlash(id); return; }
          onSpawn(id);
        };
        return (
          <button
            key={id}
            type="button"
            className={`es-card${disabled ? ' is-disabled' : ''}${tooPoor ? ' is-poor' : ''}${isFlashing ? ' is-flash' : ''}`}
            onClick={click}
            // We let the button stay enabled when only gold-poor so the
            // flash feedback works. Cooldown still hard-disables.
            disabled={disabled}
            title={`${def.name} — ${def.role} · ${def.cost}g · ${def.hp}HP · ${def.damage}dmg`}
            aria-label={`Spawn ${def.name}, costs ${def.cost} gold`}>
            <div className="es-card-name" style={{ color: def.visual.colorBody }}>
              {def.name}
              <span className="es-card-key" aria-hidden="true">{idx + 1}</span>
            </div>
            <div className="es-card-meta">
              <span className="es-card-role">{def.role}</span>
              <span className={`es-card-cost${tooPoor ? ' is-poor' : ''}`}>{def.cost}g</span>
            </div>
            {cd > 0 && (
              <div className="es-card-cd" style={{ width: `${cdR * 100}%` }}/>
            )}
          </button>
        );
      })}
    </div>
  );
}
