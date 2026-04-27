// Special button with a cooldown radial.

import { getEraByIndex } from '../content/eras.js';
import { getSpecial } from '../content/specials.js';

const ICON_BASE = '/games/era-siege/ui';

export default function SpecialButton({ eraIndex, cooldownMs, charging, onFire }) {
  const era = getEraByIndex(eraIndex);
  const def = era ? getSpecial(era.specialId) : null;
  if (!def) return null;
  const cdR = cooldownMs > 0 ? cooldownMs / def.cooldownMs : 0;
  const disabled = cooldownMs > 0 || charging;
  const ready = !disabled;
  return (
    <button
      type="button"
      className={`es-special${charging ? ' is-charging' : ''}${disabled ? ' is-disabled' : ''}${ready ? ' is-ready' : ''}`}
      onClick={onFire}
      disabled={disabled}
      title={`${def.name} — ${def.description}`}
      aria-label={`${def.name}, special attack`}>
      <img
        className="es-special-icon"
        src={`${ICON_BASE}/special-era${eraIndex + 1}.png`}
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
      <div className="es-special-key">space</div>
    </button>
  );
}
