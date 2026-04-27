// Keyboard + touch routing into a per-frame intents object. The React
// shell drains the intents at the start of each tick and resets them.

export function makeIntents() {
  return {
    spawn: [],
    buildTurret: null,
    sellTurret: null,
    special: false,
    evolve: false,
  };
}

export function clearIntents(intents) {
  intents.spawn.length = 0;
  intents.buildTurret = null;
  intents.sellTurret = null;
  intents.special = false;
  intents.evolve = false;
}

export function attachKeyboard({ getActiveUnitIds, requestSpawn, requestBuild, requestSpecial, requestEvolve, requestPause, requestSell, requestShortcuts }) {
  const onKey = (e) => {
    // Ignore keys when typing in form fields (none in our HUD, defensive only).
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const activeUnits = getActiveUnitIds() || [];
    if (e.key === '1' && activeUnits[0]) { requestSpawn(activeUnits[0]); e.preventDefault(); }
    else if (e.key === '2' && activeUnits[1]) { requestSpawn(activeUnits[1]); e.preventDefault(); }
    else if (e.key === '3' && activeUnits[2]) { requestSpawn(activeUnits[2]); e.preventDefault(); }
    else if (e.key === 'q' || e.key === 'Q') { requestBuild(0); e.preventDefault(); }
    else if (e.key === 'w' || e.key === 'W') { requestBuild(1); e.preventDefault(); }
    else if (e.key === 'e' || e.key === 'E') { requestBuild(2); e.preventDefault(); }
    else if (e.key === ' ')                   { requestSpecial(); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R') { requestEvolve(); e.preventDefault(); }
    else if (e.key === 'p' || e.key === 'P') { requestPause(); e.preventDefault(); }
    else if (e.key === '?') { requestShortcuts?.(); e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
