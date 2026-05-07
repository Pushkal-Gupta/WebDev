// TurretRack — Phase 4 polish.
//
// Replaces the old "three loose Lay-Spot buttons" right-rail with a
// single unified TURRETS panel. Header + cost-of-next-action + three
// horizontal slot cards. Each slot still drives the same modal flow:
//
//   empty       (no spot)        → click → BuildModal stage 1 (Lay Spot)
//   spot-only   ({ spotOnly })   → click → BuildModal stage 2 (Build Turret)
//   turret      ({ turretId, …}) → click → ManagePopover (upgrade / sell)
//
// Slot art uses the baked era-turret PNG when a turret is installed,
// falls back to a small SVG glyph for empty / spot-only states.

import { getTurretForEra } from '../content/turrets.js';
import { getEraByIndex } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';

const ERA_BY_ID = { 'ember-tribe': 1, 'iron-dominion': 2, 'sun-foundry': 3, 'storm-republic': 4, 'void-ascendancy': 5 };

export default function TurretSlots({ slots, eraIndex, gold, onSlotClick }) {
  const era = getEraByIndex(eraIndex);
  const def = era ? getTurretForEra(era.id) : null;
  const eraN = era ? (ERA_BY_ID[era.id] || (eraIndex + 1)) : 1;
  const turretCost = def?.buildCost ?? 0;
  const spotCost   = BALANCE.TURRET_SPOT_COST;

  return (
    <aside className="es-rack3" role="group" aria-label="Turrets">
      <header className="es-rack3-head">
        <span className="es-rack3-title">TURRETS</span>
        {def && <span className="es-rack3-sub">{def.name}</span>}
      </header>
      <div className="es-rack3-grid">
        {slots.map((t, i) => {
          const empty    = !t;
          const spotOnly = !!(t && t.spotOnly);
          const turret   = !!(t && !t.spotOnly);
          const isOld     = turret && t.eraIndex < eraIndex;
          const isCurrent = turret && t.eraIndex === eraIndex;
          let label, sub, cost, mark;
          if (empty) {
            label = 'Lay Spot';
            sub   = `${spotCost}g`;
            cost  = spotCost;
            // Show the era's turret as a faint preview so the player
            // sees what they'd build, not just an abstract dashed circle.
            mark  = <TurretArt eraN={eraN} ghost/>;
          } else if (spotOnly) {
            label = 'Build';
            sub   = `${turretCost}g`;
            cost  = turretCost;
            // Foundation slab + ghosted era turret icon.
            mark  = <TurretArt eraN={eraN} ghost/>;
          } else {
            label = isCurrent ? 'Manage' : 'Upgrade';
            sub   = isCurrent ? 'OK' : 'OLD';
            cost  = 0;
            mark  = <TurretArt eraN={t.eraIndex + 1} fallbackEraN={eraN}/>;
          }
          const tooPoor = cost > 0 && gold < cost;
          const stateClass = empty ? ' is-empty' : (spotOnly ? ' is-spot' : (isOld ? ' is-old' : ' is-current'));
          return (
            <button
              key={i}
              type="button"
              className={`es-rack3-slot${stateClass}${tooPoor ? ' is-poor' : ''}`}
              onClick={() => onSlotClick(i)}
              aria-label={`Turret slot ${i + 1}: ${label} (${sub})`}
              title={`${label} · ${sub}`}>
              <span className="es-rack3-slot-key" aria-hidden="true">{['Q', 'W', 'E'][i]}</span>
              <span className="es-rack3-slot-art" aria-hidden="true">{mark}</span>
              <span className="es-rack3-slot-text">
                <b>{label}</b>
                <em>{sub}</em>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// Build version cache-bust — see UnitDock.jsx for the same pattern.
const _TURRET_VER = (typeof BUILD_VERSION !== 'undefined' && BUILD_VERSION)
                 || `dev-${Math.floor(Math.random() * 1e9).toString(36)}`;

// Era turret PNG — uses the baked `turret/era<N>.png` cropped from the
// reference sheet. Falls back to an SVG glyph if the PNG hasn't loaded.
function TurretArt({ eraN, fallbackEraN, ghost }) {
  const src = `games/era-siege/turret/era${eraN || fallbackEraN || 1}.png?v=${_TURRET_VER}`;
  return (
    <img
      className={`es-rack3-slot-img${ghost ? ' is-ghost' : ''}`}
      src={src}
      alt=""
      loading="lazy"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function SpotDashed() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3"/>
    </svg>
  );
}

function FoundationMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="14" width="16" height="4" fill="currentColor"/>
      <rect x="4" y="18" width="16" height="1" fill="currentColor" opacity="0.5"/>
      <rect x="6"  y="11" width="2" height="3" fill="currentColor" opacity="0.7"/>
      <rect x="16" y="11" width="2" height="3" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}
