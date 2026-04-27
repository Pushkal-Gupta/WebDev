// TurretSlots — the slim right-rail strip showing the three slots.
//
// Empty slot     → click opens TurretBuildModal
// Occupied slot  → click opens TurretManagePopover
//
// Slot art mirrors the per-era turret kind for clarity. The actual
// build / manage flows live in their dedicated modal/popover files
// (kept off-canvas so the battlefield stays uncluttered).

import { getTurretForEra } from '../content/turrets.js';
import { getEraByIndex } from '../content/eras.js';

export default function TurretSlots({ slots, eraIndex, gold, onSlotClick }) {
  const era = getEraByIndex(eraIndex);
  const def = era ? getTurretForEra(era.id) : null;
  return (
    <div className="es-rack2" role="group" aria-label="Turret slots">
      {slots.map((t, i) => {
        const empty = !t;
        const isOld = !empty && t.eraIndex < eraIndex;
        const isCurrent = !empty && t.eraIndex === eraIndex;
        const buildCost = def?.buildCost ?? 0;
        const tooPoor = empty && gold < buildCost;
        const label = empty
          ? `Build (${buildCost}g)`
          : isCurrent ? 'Manage' : 'Upgrade';
        return (
          <button
            key={i}
            type="button"
            className={`es-slot2${empty ? ' is-empty' : ''}${isOld ? ' is-old' : ''}${isCurrent ? ' is-current' : ''}${tooPoor ? ' is-poor' : ''}`}
            onClick={() => onSlotClick(i)}
            aria-label={`Turret slot ${i + 1}: ${label}`}
            title={label}>
            <span className="es-slot2-key" aria-hidden="true">{['Q', 'W', 'E'][i]}</span>
            <span className="es-slot2-state" aria-hidden="true">
              {empty ? <EmptyDot/> : <SlotMark kind={getMarkKind(t)}/>}
            </span>
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

function EmptyDot() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3"/>
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
