// TurretSlots — the slim right-rail strip showing the three slots.
//
// Three slot states:
//   empty       — null            → click → BuildModal stage 1 (Lay Spot)
//   spot-only   — { spotOnly }    → click → BuildModal stage 2 (Build Turret)
//   turret      — { turretId, …}  → click → ManagePopover (upgrade / sell)
//
// The label on the button reflects the next available action so the
// player knows what their click will do without opening the modal.

import { getTurretForEra } from '../content/turrets.js';
import { getEraByIndex } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';

export default function TurretSlots({ slots, eraIndex, gold, onSlotClick }) {
  const era = getEraByIndex(eraIndex);
  const def = era ? getTurretForEra(era.id) : null;
  const turretCost = def?.buildCost ?? 0;
  const spotCost = BALANCE.TURRET_SPOT_COST;
  return (
    <div className="es-rack2" role="group" aria-label="Turret slots">
      {slots.map((t, i) => {
        const empty    = !t;
        const spotOnly = !!(t && t.spotOnly);
        const turret   = !!(t && !t.spotOnly);
        const isOld     = turret && t.eraIndex < eraIndex;
        const isCurrent = turret && t.eraIndex === eraIndex;
        let label, cost, mark;
        if (empty) {
          label = `Lay Spot · ${spotCost}g`; cost = spotCost; mark = <SpotDot/>;
        } else if (spotOnly) {
          label = `Build · ${turretCost}g`; cost = turretCost; mark = <FoundationMark/>;
        } else {
          label = isCurrent ? 'Manage' : 'Upgrade'; cost = 0;
          mark = <SlotMark kind={getMarkKind(t)}/>;
        }
        const tooPoor = cost > 0 && gold < cost;
        return (
          <button
            key={i}
            type="button"
            className={`es-slot2${empty ? ' is-empty' : ''}${spotOnly ? ' is-spot' : ''}${isOld ? ' is-old' : ''}${isCurrent ? ' is-current' : ''}${tooPoor ? ' is-poor' : ''}`}
            onClick={() => onSlotClick(i)}
            aria-label={`Turret slot ${i + 1}: ${label}`}
            title={label}>
            <span className="es-slot2-key" aria-hidden="true">{['Q', 'W', 'E'][i]}</span>
            <span className="es-slot2-state" aria-hidden="true">{mark}</span>
            <span className="es-slot2-text">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function getMarkKind(slot) {
  return slot.turretId.split('-')[0]; // bone | iron | brass | volt | void
}

function SpotDot() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3"/>
    </svg>
  );
}

function FoundationMark() {
  // Slab silhouette — a laid spot waiting for a turret.
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="14" width="16" height="4" fill="currentColor"/>
      <rect x="4" y="18" width="16" height="1" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

function SlotMark({ kind }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="14" width="12" height="4" fill="currentColor"/>
      <rect x="11" y="6"  width="2"  height="8" fill="currentColor"/>
      <rect x="6"  y="6"  width="12" height="2" fill="currentColor" opacity={kind === 'void' ? 1 : 0.7}/>
    </svg>
  );
}
