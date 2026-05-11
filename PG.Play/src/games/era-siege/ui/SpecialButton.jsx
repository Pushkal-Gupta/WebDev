// Special button with a cooldown radial.
//
// `slot` selects which special on the era this button drives:
//   'primary'   (default) → era.specialId          → Q hotkey
//   'secondary'           → era.secondarySpecialId → W hotkey

import { getEraByIndex } from '../content/eras.js';
import { getSpecial } from '../content/specials.js';

const ICON_BASE = '/games/era-siege/ui';

export default function SpecialButton({ eraIndex, slot, cooldownMs, charging, onFire }) {
  const era = getEraByIndex(eraIndex);
  const isSecondary = slot === 'secondary';
  const specialId = era ? (isSecondary ? era.secondarySpecialId : era.specialId) : null;
  const def = specialId ? getSpecial(specialId) : null;
  if (!def) return null;
  const cdR = cooldownMs > 0 ? cooldownMs / def.cooldownMs : 0;
  const disabled = cooldownMs > 0 || charging;
  const ready = !disabled;
  return (
    <button
      type="button"
      className={`es-special${isSecondary ? ' is-secondary' : ''}${charging ? ' is-charging' : ''}${disabled ? ' is-disabled' : ''}${ready ? ' is-ready' : ''}`}
      onClick={onFire}
      disabled={disabled}
      title={`${def.name} — ${def.description}`}
      aria-label={`${def.name}, special attack`}>
      <img
        className="es-special-icon"
        src={`${ICON_BASE}/special-era${Math.min(5, Math.max(1, (eraIndex | 0) + 1))}${isSecondary ? '-2' : ''}.png`}
        alt=""
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="es-special-name">
        {def.name}
        {ready && <span className="es-special-ready">READY</span>}
      </div>
      <div className="es-special-cd-track">
        <div className="es-special-cd-fill" style={{ width: `${(1 - cdR) * 100}%` }}/>
      </div>
      <div className="es-special-key">{isSecondary ? 'w' : 'q'}</div>
    </button>
  );
}
