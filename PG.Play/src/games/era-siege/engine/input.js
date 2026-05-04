// Keyboard + touch routing into a per-frame intents object. The React
// shell drains the intents at the start of each tick and resets them.

export function makeIntents() {
  return {
    spawn: [],            // [unitId, ...] — instant spawns (legacy, unused by player after queue)
    queue: [],            // [unitId, ...] — queue intents (player flow)
    cancelQueue: null,    // queue index to cancel
    buildTurret:     null,
    buildTurretSpot: null,
    sellTurret:      null,
    upgradeTurret:   null,
    unlockGenerals:  false,
    buyPowerup:    null,
    special:  false,    // Q — primary
    special2: false,    // W — secondary
    evolve:  false,
  };
}

export function clearIntents(intents) {
  intents.spawn.length = 0;
  intents.queue.length = 0;
  intents.cancelQueue  = null;
  intents.buildTurret     = null;
  intents.buildTurretSpot = null;
  intents.sellTurret      = null;
  intents.upgradeTurret   = null;
  intents.unlockGenerals  = false;
  intents.buyPowerup    = null;
  intents.special  = false;
  intents.special2 = false;
  intents.evolve   = false;
}

export function attachKeyboard({ getActiveUnitIds, requestSpawn, requestBuild, requestSpecial, requestSpecial2, requestEvolve, requestPause, requestSell, requestShortcuts, requestPowerUps }) {
  const onKey = (e) => {
    // Ignore keys when typing in form fields (none in our HUD, defensive only).
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    // Number keys spawn units 1-3.
    const activeUnits = getActiveUnitIds() || [];
    if (e.key === '1' && activeUnits[0]) { requestSpawn(activeUnits[0]); e.preventDefault(); }
    else if (e.key === '2' && activeUnits[1]) { requestSpawn(activeUnits[1]); e.preventDefault(); }
    else if (e.key === '3' && activeUnits[2]) { requestSpawn(activeUnits[2]); e.preventDefault(); }
    // Q / W → primary / secondary special (per Age of War 2 spec).
    // SPACE doubles for primary so the legacy single-special muscle
    // memory still works.
    else if (e.key === 'q' || e.key === 'Q')   { requestSpecial();  e.preventDefault(); }
    else if (e.key === 'w' || e.key === 'W')   { requestSpecial2 ? requestSpecial2() : requestSpecial(); e.preventDefault(); }
    else if (e.key === ' ')                     { requestSpecial();  e.preventDefault(); }
    // Turret slots — moved off Q/W/E to Z / X / C since Q+W are now
    // specials per the spec.
    else if (e.key === 'z' || e.key === 'Z')   { requestBuild(0); e.preventDefault(); }
    else if (e.key === 'x' || e.key === 'X')   { requestBuild(1); e.preventDefault(); }
    else if (e.key === 'c' || e.key === 'C')   { requestBuild(2); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R')   { requestEvolve();   e.preventDefault(); }
    else if (e.key === 'p' || e.key === 'P')   { requestPause();    e.preventDefault(); }
    else if (e.key === '?')                     { requestShortcuts?.(); e.preventDefault(); }
    else if (e.key === 'u' || e.key === 'U')   { requestPowerUps?.();  e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
