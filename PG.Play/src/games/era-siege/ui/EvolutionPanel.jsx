// EvolutionPanel — preview of the next era. Triggered on Evolve hover
// (desktop) / long-press (touch). Shows the 3 incoming unit silhouettes,
// new turret silhouette, and new special name + description.

import { useEffect } from 'react';
import { getEraByIndex, nextEra } from '../content/eras.js';
import { getUnit } from '../content/units.js';
import { getTurretForEra } from '../content/turrets.js';
import { getSpecial } from '../content/specials.js';
import RoleIcon from './RoleIcon.jsx';

export default function EvolutionPanel({ open, eraIndex, gold, xp, onEvolve, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const cur  = getEraByIndex(eraIndex);
  const next = nextEra(cur?.id);
  if (!next) return null;
  const meetsXp   = xp   >= next.xpToEvolve;
  const meetsGold = gold >= next.evolveCost;
  const ready     = meetsXp && meetsGold;
  const newUnits  = next.unitIds.map(getUnit).filter(Boolean);
  const newTurret = getTurretForEra(next.id);
  const newSpec   = getSpecial(next.specialId);

  return (
    <div className="es-evo-scrim" role="dialog" aria-label={`Evolve to ${next.name}`} onClick={onClose}>
      <div className="es-evo-card" onClick={(e) => e.stopPropagation()}>
        <header className="es-evo-head">
          <span className="es-evo-eyebrow">Era {next.index + 1} of 5</span>
          <h2>{next.name}</h2>
          <p>{next.blurb}</p>
        </header>

        <section className="es-evo-section">
          <h3>New units</h3>
          <ul className="es-evo-units">
            {newUnits.map((u) => (
              <li key={u.id}>
                <RoleIcon role={u.role}/>
                <strong>{u.name}</strong>
                <span>{u.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="es-evo-section">
          <h3>New turret</h3>
          <p><strong>{newTurret?.name}</strong> · {newTurret?.damage} dmg, {(newTurret?.cooldownMs / 1000).toFixed(1)}s cooldown</p>
        </section>

        <section className="es-evo-section">
          <h3>New special</h3>
          <p><strong>{newSpec?.name}</strong> · {newSpec?.description}</p>
        </section>

        <footer className="es-evo-foot">
          <div className="es-evo-req">
            <span className={meetsXp   ? 'is-met' : 'is-need'}>XP {Math.min(xp, next.xpToEvolve)}/{next.xpToEvolve}</span>
            <span className={meetsGold ? 'is-met' : 'is-need'}>Gold {next.evolveCost}g</span>
          </div>
          <div className="es-evo-actions">
            <button type="button" className="es-evo-cancel" onClick={onClose}>Not yet</button>
            <button
              type="button"
              className={`es-evo-go${ready ? '' : ' is-disabled'}`}
              disabled={!ready}
              onClick={() => { if (ready) { onEvolve(); onClose(); } }}>
              Evolve
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
