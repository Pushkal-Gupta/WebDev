// GeneralButton — deploy the era's general (one living per side).
//
// Sits next to SpecialButton on the bottom rail. Disabled if:
//   - on cooldown (the def.spawnCooldownMs after a previous deploy)
//   - a general is already alive on the player side
//   - gold below cost
//
// Like every tactical action, this does NOT pause the sim — the deploy
// happens live and the player commits to the timing.

import { getEraByIndex } from '../content/eras.js';
import { getUnit } from '../content/units.js';

export default function GeneralButton({ eraIndex, gold, cooldownMs, alive, onDeploy }) {
  const era = getEraByIndex(eraIndex);
  const def = era ? getUnit(era.generalId) : null;
  if (!def) return null;
  const cdR = (cooldownMs > 0 && def.spawnCooldownMs > 0)
    ? Math.max(0, Math.min(1, cooldownMs / def.spawnCooldownMs))
    : 0;
  const tooPoor = gold < def.cost;
  const disabled = cooldownMs > 0 || alive || tooPoor;
  const ready = !disabled;
  const status = alive
    ? 'On the field'
    : cooldownMs > 0 ? `Reform ${Math.ceil(cooldownMs / 1000)}s`
    : tooPoor       ? `Need ${def.cost}g`
    : 'READY';
  // Era N is 1-indexed for the asset path.
  const eraN = eraIndex + 1;
  const portraitSrc = `games/era-siege/unit/era${eraN}/general.png`;
  return (
    <button
      type="button"
      className={`es-general${disabled ? ' is-disabled' : ''}${ready ? ' is-ready' : ''}${alive ? ' is-alive' : ''}`}
      onClick={onDeploy}
      disabled={disabled}
      title={`${def.name} — ${def.cost}g · long cooldown · one living at a time`}
      aria-label={`Deploy ${def.name}`}>
      <img
        className="es-general-icon"
        src={portraitSrc}
        alt=""
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <span className="es-general-eyebrow">General</span>
      <span className="es-general-name">{def.name}</span>
      <span className="es-general-cost">{def.cost}g</span>
      <div className="es-general-cd-track">
        <div className="es-general-cd-fill" style={{ width: `${(1 - cdR) * 100}%` }}/>
      </div>
      <span className="es-general-status">{status}</span>
    </button>
  );
}
