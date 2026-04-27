// Single barrel for content imports + a dev-time validator.

export { ERAS, ERAS_BY_ID, getEra, getEraByIndex, nextEra, paletteFor } from './eras.js';
export { UNITS, UNITS_BY_ID, getUnit } from './units.js';
export { TURRETS, TURRETS_BY_ID, TURRETS_BY_ERA, getTurret, getTurretForEra, SELL_REFUND_PCT } from './turrets.js';
export { SPECIALS, SPECIALS_BY_ID, getSpecial } from './specials.js';
export { PROJECTILES, PROJECTILES_BY_ID, getProjectile } from './projectiles.js';
export { DIFFICULTIES, getDifficulty } from './difficulties.js';
export { PALETTES } from './palette.js';
export { BALANCE } from './balance.js';

import { ERAS, ERAS_BY_ID } from './eras.js';
import { UNITS_BY_ID } from './units.js';
import { TURRETS_BY_ID } from './turrets.js';
import { SPECIALS_BY_ID } from './specials.js';

// Boot-time content validator. Logs to console in dev; falls back gracefully
// in production by trusting the static data.
export function validateContent() {
  const errs = [];
  let lastXp = -1;
  for (const era of ERAS) {
    if (era.unitIds.length !== 3) errs.push(`era ${era.id} must have exactly 3 unit ids`);
    for (const uid of era.unitIds) if (!UNITS_BY_ID[uid]) errs.push(`era ${era.id} unit ${uid} not found`);
    if (!TURRETS_BY_ID[era.turretId]) errs.push(`era ${era.id} turret ${era.turretId} not found`);
    if (!SPECIALS_BY_ID[era.specialId]) errs.push(`era ${era.id} special ${era.specialId} not found`);
    if (era.xpToEvolve < lastXp) errs.push(`era ${era.id} xpToEvolve below previous`);
    lastXp = era.xpToEvolve;
  }
  if (errs.length && typeof console !== 'undefined') {
    console.warn('[era-siege] content validator:', errs);
  }
  return errs.length === 0;
}
