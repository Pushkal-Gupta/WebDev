// Era badge + xp arc + evolve button.

import { getEraByIndex, nextEra } from '../content/eras.js';
import { canEvolve } from '../sim/progression.js';

export default function EraBadge({ side, gold, xp, eraIndex, onEvolve }) {
  const era = getEraByIndex(eraIndex);
  const next = nextEra(era?.id);
  const canDo = next ? (xp >= next.xpToEvolve && gold >= next.evolveCost) : false;
  const xpR = next ? Math.min(1, xp / next.xpToEvolve) : 1;

  return (
    <div className="es-era">
      <div className="es-era-badge">
        <div className="es-era-num">{eraIndex + 1}/5</div>
        <div className="es-era-name">{era?.name || '—'}</div>
      </div>
      <div className="es-era-xp" aria-label="XP progress">
        <div className="es-era-xp-bar"><div className="es-era-xp-fill" style={{ width: `${xpR * 100}%` }}/></div>
        <div className="es-era-xp-label">
          {next ? `XP ${xp}/${next.xpToEvolve}` : 'Final era'}
        </div>
      </div>
      {next && (
        <button
          type="button"
          className={`es-era-evolve${canDo ? ' is-ready' : ''}`}
          onClick={onEvolve}
          disabled={!canDo}
          title={`Evolve into ${next.name} — ${next.evolveCost}g, ${next.xpToEvolve} XP`}
          aria-label={`Evolve into ${next.name}, ${next.evolveCost} gold`}>
          <span>Evolve</span>
          <span className="es-era-evolve-cost">{next.evolveCost}g</span>
        </button>
      )}
    </div>
  );
}

// Re-export so the React shell can import a single thing.
export { canEvolve };
