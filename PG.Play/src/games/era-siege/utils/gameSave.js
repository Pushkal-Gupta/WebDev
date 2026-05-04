// Era Siege — mid-match save/resume.
//
// Why save mid-match at all? Sessions are 5-15 min and the player may
// switch tabs / sleep the laptop / get a notification. Without resume
// they'd lose all the era / gold / upgrade progress they invested in.
//
// What we serialise:
//   - both sides' era index, gold, xp, base HP
//   - both sides' powerups (all 7 trees)
//   - both sides' turret-spot built-flags + per-slot turret + stat upgrades
//   - generals-unlocked flag
//   - timeSec, difficulty
//   - schema version (for forward-compat patching)
//
// What we DON'T save:
//   - active unit list, projectile pool, particles — restoring a frozen
//     mid-fight is complex and any small AI rule change invalidates it.
//     On resume the lane is empty; the player picks up the strategic
//     state (gold, era, upgrades, turrets) and replays the tactical.
//
// Auto-save fires every AUTOSAVE_INTERVAL_MS during play. Save is
// cleared on win/loss (no point resuming a finished match).

import { storage } from './storage.js';

const KEY = 'era-siege:save';
const VERSION = 1;
export const AUTOSAVE_INTERVAL_MS = 30_000;

function dehydrateSide(side) {
  return {
    eraIndex: side.eraIndex | 0,
    gold:     side.gold | 0,
    xp:       side.xp | 0,
    baseHp:   side.base?.hp | 0,
    baseMaxHp: side.base?.maxHp | 0,
    powerups: side.powerups ? { ...side.powerups } : null,
    turretSpots: Array.isArray(side.turretSpots) ? side.turretSpots.slice() : [false, false, false],
    turretSlots: (side.turretSlots || []).map((t) => t ? {
      turretId:    t.turretId,
      eraIndex:    t.eraIndex | 0,
      buildCost:   t.buildCost | 0,
      damage:      t.damage,
      range:       t.range,
      cooldownMaxMs: t.cooldownMaxMs,
      rangeLevel:  t.rangeLevel | 0,
      damageLevel: t.damageLevel | 0,
      rateLevel:   t.rateLevel  | 0,
    } : null),
    generalsUnlocked: !!side.generalsUnlocked,
  };
}

export function writeGameSave(state) {
  if (!state) return;
  if (state.status !== 'playing') return;             // never save a finished match
  try {
    const payload = {
      v: VERSION,
      ts: Date.now(),
      timeSec:    Math.floor(state.timeSec || 0),
      difficulty: state.difficulty?.id || 'normal',
      seed:       state.seed,
      player: dehydrateSide(state.player),
      enemy:  dehydrateSide(state.enemy),
    };
    storage.set(KEY, JSON.stringify(payload));
  } catch { /* swallow — saves are best-effort */ }
}

export function readGameSave() {
  try {
    const raw = storage.get(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGameSave() {
  try { storage.remove(KEY); } catch { /* swallow */ }
}

export function hasGameSave() {
  return readGameSave() != null;
}

// Apply a saved snapshot back onto a fresh match — strict subset so
// the sim's own invariants (units list, pools, view geometry) stay
// consistent.
export function applyGameSave(state, save) {
  if (!state || !save) return;
  state.timeSec = save.timeSec || 0;
  state.timeMs  = (save.timeSec || 0) * 1000;
  for (const sideKey of ['player', 'enemy']) {
    const src = save[sideKey];
    const dst = state[sideKey];
    if (!src || !dst) continue;
    dst.eraIndex = src.eraIndex | 0;
    dst.gold     = src.gold | 0;
    dst.xp       = src.xp | 0;
    if (dst.base) {
      dst.base.maxHp = src.baseMaxHp || dst.base.maxHp;
      dst.base.hp    = src.baseHp || dst.base.hp;
    }
    if (src.powerups) dst.powerups = { ...dst.powerups, ...src.powerups };
    if (src.turretSpots) dst.turretSpots = src.turretSpots.slice();
    if (Array.isArray(src.turretSlots)) {
      // Restore turret instances enough that ManagePopover + tickTurrets work.
      dst.turretSlots = src.turretSlots.map((t, i) => {
        if (!t) return null;
        return {
          ...t,
          id: state.allocId(),
          kind: 'turret',
          team: dst.team,
          slot: i,
          x: 0, y: 0,                     // tickTurrets reseats
          facing: dst === state.player ? 1 : -1,
          cooldownMs: 0,
          projectileId: null,             // looked up from def at fire-time fallback
          visual: t.visual || {},
        };
      });
    }
    dst.generalsUnlocked = !!src.generalsUnlocked;
  }
}
