// Era Siege — React shell.
//
// Owns the canvas + RAF loop, mirrors a minimal subset of MatchState into
// React state for the HUD, and wires audio + telemetry to sim events.
//
// Sim is framework-agnostic (no React anywhere under sim/ or content/).
// All gameplay-tunable values come from src/games/era-siege/content/.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../../scoreBus.js';
import { sizeCanvasFluid } from '../../util/canvasDpr.js';
import { storage } from './utils/storage.js';
import { telemetry } from './utils/telemetry.js';

import { createMatch, tick, setView, teardownMatch, scoreMatch } from './sim/world.js';
import { startLoop } from './engine/loop.js';
import { makeRenderer } from './engine/renderer.js';
import { makeIntents, clearIntents, attachKeyboard } from './engine/input.js';
import { attachAudio } from './engine/audio.js';
import { paletteFor, getEraByIndex } from './content/eras.js';
import { validateContent } from './content/index.js';
import { BALANCE } from './content/balance.js';

import HUD from './ui/HUD.jsx';
import UnitDock from './ui/UnitDock.jsx';
import TurretRack from './ui/TurretRack.jsx';
import EraBadge from './ui/EraBadge.jsx';
import SpecialButton from './ui/SpecialButton.jsx';
import Tutorial from './ui/Tutorial.jsx';
import ResultPanel from './ui/ResultPanel.jsx';
import DifficultyChip from './ui/DifficultyChip.jsx';
import PauseOverlay from './ui/PauseOverlay.jsx';
import PerfOverlay from './ui/PerfOverlay.jsx';
import { makePerfMon, detectDeviceClass } from './engine/perf.js';

import './styles.css';

const STORAGE_TUTORIAL_KEY = 'era-siege:tutorial-dismissed';

// Map a GameIntro `mode` value to a difficulty id. The lobby UI passes
// 'start' for the default story-style game; we accept explicit modes too
// so a future difficulty selector can drop straight in.
function modeToDifficulty(mode) {
  if (mode === 'skirmish' || mode === 'standard' || mode === 'conquest') return mode;
  return 'standard';
}

// Read URL flags once at module load. SSR-safe.
const SHOW_PERF = typeof window !== 'undefined' && /[?&]perf\b/.test(window.location?.search || '');

export default function EraSiegeGame({ mode }) {
  // Refs hold the heavy stuff — match, renderer, intents — so changing
  // them never triggers a React re-render.
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const matchRef = useRef(null);
  const intentsRef = useRef(makeIntents());
  const rendererRef = useRef(null);
  const loopStopRef = useRef(null);
  const audioStopRef = useRef(null);
  const kbStopRef = useRef(null);
  const submittedRef = useRef(false);
  const tutorialSpawnsLeft = useRef(BALANCE.TUTORIAL_SPAWN_CT);
  const dirtyRef = useRef(0);
  const pausedRef = useRef(false);
  const perfMonRef = useRef(null);
  const deviceClassRef = useRef('desktop');

  const [paused, setPaused] = useState(false);

  // Minimal HUD mirror.
  const [hud, setHud] = useState({
    gold: 110,
    xp: 0,
    eraIndex: 0,
    playerHP: BALANCE.BASE_HP,
    enemyHP: BALANCE.BASE_HP,
    cooldownsMs: {},
    turretSlots: [null, null, null],
    specialCooldownMs: 0,
    specialCharging: false,
    timeSec: 0,
    status: 'playing',
    score: 0,
    stats: { unitsSpawned: 0, turretsBuilt: 0, specialsUsed: 0, kills: 0 },
  });
  const [tutorialIdx, setTutorialIdx] = useState(() => {
    return storage.get(STORAGE_TUTORIAL_KEY) === '1' ? -1 : 0;
  });
  const [restartKey, setRestartKey] = useState(0);

  // ── Mount: build match, attach loop/renderer/audio/input.
  useEffect(() => {
    if (typeof window === 'undefined') return; // jsdom mount safety
    validateContent();

    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const difficulty = modeToDifficulty(mode);
    const match = createMatch({ difficulty, view: { w: 820, h: 420 } });
    matchRef.current = match;

    // Hook view sizing: writes to match.view on every resize.
    const disposeFluid = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      setView(match, cssW, cssH);
      rendererRef.current?.clearCache();
    });

    // Renderer
    const renderer = makeRenderer();
    rendererRef.current = renderer;

    // Perf monitor
    deviceClassRef.current = detectDeviceClass();
    perfMonRef.current = makePerfMon({ deviceClass: deviceClassRef.current });

    // Audio routing
    audioStopRef.current = attachAudio(match.bus);

    // Telemetry routing — events the host has wired stay no-op until a
    // real transport is plugged in.
    const offMs = match.bus.on('match_start', (e) => telemetry.emit('era_siege:match_start', e));
    const offMe = match.bus.on('match_end',   (e) => telemetry.emit('era_siege:match_end', e));
    const offEr = match.bus.on('era_reached', (e) => telemetry.emit('era_siege:era_reached', e));
    const offEv = match.bus.on('evolve_clicked', (e) => telemetry.emit('era_siege:evolve_clicked', e));
    const offUs = match.bus.on('unit_spawned', (e) => {
      // 1-in-4 sample on player spawns to bound event flood.
      if (e.team === 'player' && Math.random() < 0.25) {
        telemetry.emit('era_siege:unit_spawned', e);
      }
    });
    const offTb = match.bus.on('turret_built', (e) => telemetry.emit('era_siege:turret_built', e));
    const offSu = match.bus.on('special_used', (e) => telemetry.emit('era_siege:special_used', e));

    // Tutorial: tick down on player spawn until 0; stop showing.
    const offTut = match.bus.on('unit_spawned', (e) => {
      if (e.team !== 'player') return;
      if (tutorialSpawnsLeft.current > 0) {
        tutorialSpawnsLeft.current--;
        const next = BALANCE.TUTORIAL_SPAWN_CT - tutorialSpawnsLeft.current;
        // Show next hint only if the user hasn't dismissed.
        if (storage.get(STORAGE_TUTORIAL_KEY) !== '1') {
          if (next < 3) setTutorialIdx(next);
          else { setTutorialIdx(-1); storage.set(STORAGE_TUTORIAL_KEY, '1'); }
        }
      }
    });

    // Score submission on match end.
    const offEnd = match.bus.on('match_end', (e) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const score = scoreMatch(match);
      // Defer slightly so the result panel paints first.
      setTimeout(() => {
        submitScore('aow', score, {
          era:  e.era + 1,
          time: e.timeSec,
          difficulty: e.difficulty,
          defeat: !e.won,
          stats: e.stats,
        });
      }, BALANCE.RESULT_SUBMIT_DELAY_MS);
    });

    // Keyboard
    kbStopRef.current = attachKeyboard({
      getActiveUnitIds: () => {
        const era = getEraByIndex(matchRef.current?.player.eraIndex ?? 0);
        return era?.unitIds || [];
      },
      requestSpawn:   (id)  => { intentsRef.current.spawn.push(id); },
      requestBuild:   (i)   => { intentsRef.current.buildTurret = { slot: i }; },
      requestSell:    (i)   => { intentsRef.current.sellTurret = i; },
      requestSpecial: ()    => { intentsRef.current.special = true; },
      requestEvolve:  ()    => { intentsRef.current.evolve = true; },
      requestPause:   ()    => {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
      },
    });

    // Loop
    loopStopRef.current = startLoop({
      getMatch:   () => matchRef.current,
      getPaused:  () => pausedRef.current,
      getIntents: () => {
        const i = intentsRef.current;
        const drained = {
          spawn: i.spawn.slice(),
          buildTurret: i.buildTurret,
          sellTurret: i.sellTurret,
          special: i.special,
          evolve: i.evolve,
        };
        clearIntents(i);
        return drained;
      },
      render:    (m) => {
        renderer.render(ctx, m);
        // Sync HUD mirror — at most once per RAF, with shallow-equal guards.
        syncHud(m);
      },
      onFrame: (dt) => {
        const pm = perfMonRef.current;
        if (!pm || dt <= 0) return;
        pm.record(dt);
        const lowFx = pm.evaluateLowFx(performance.now());
        if (matchRef.current && matchRef.current.lowFx !== lowFx) {
          matchRef.current.lowFx = lowFx;
        }
      },
    });

    // Apply per-era CSS accent on the root.
    setRootAccent(wrap, getEraByIndex(0).id);

    return () => {
      try { offMs?.(); offMe?.(); offEr?.(); offEv?.(); offUs?.(); offTb?.(); offSu?.(); offTut?.(); offEnd?.(); } catch { /* ignore */ }
      try { audioStopRef.current?.(); } catch { /* ignore */ }
      try { kbStopRef.current?.(); } catch { /* ignore */ }
      try { loopStopRef.current?.(); } catch { /* ignore */ }
      try { disposeFluid?.(); } catch { /* ignore */ }
      try { teardownMatch(matchRef.current); } catch { /* ignore */ }
      matchRef.current = null;
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartKey]);

  function setRootAccent(wrap, eraId) {
    const pal = paletteFor(eraId);
    wrap.style.setProperty('--es-accent', pal.hudAccent);
  }

  // Pull the small mirror set out of the match into React state. Called
  // each frame, but only schedules a setState when something changed.
  function syncHud(match) {
    if (!match) return;
    // Cheap dirty bit by sampling integers: any change to these flips it.
    const next = {
      gold:     match.player.gold,
      xp:       match.player.xp,
      eraIndex: match.player.eraIndex,
      playerHP: match.player.base.hp,
      enemyHP:  match.enemy.base.hp,
      cooldownsMs: match.player._spawnCooldowns ? { ...match.player._spawnCooldowns } : {},
      turretSlots: [
        match.player.turretSlots[0] ? { eraIndex: match.player.turretSlots[0].eraIndex, turretId: match.player.turretSlots[0].turretId, buildCost: match.player.turretSlots[0].buildCost } : null,
        match.player.turretSlots[1] ? { eraIndex: match.player.turretSlots[1].eraIndex, turretId: match.player.turretSlots[1].turretId, buildCost: match.player.turretSlots[1].buildCost } : null,
        match.player.turretSlots[2] ? { eraIndex: match.player.turretSlots[2].eraIndex, turretId: match.player.turretSlots[2].turretId, buildCost: match.player.turretSlots[2].buildCost } : null,
      ],
      specialCooldownMs: match.player.specialCooldownMs,
      specialCharging:   !!match.player.specialActive,
      timeSec: Math.floor(match.timeSec),
      status:  match.status,
      score:   match.status === 'playing' ? 0 : scoreMatch(match),
      stats:   match.statsPlayer,
    };
    // Cheap shallow-equal: most fields are scalars; turretSlots is the only deep-ish one.
    if (cheapDiffers(hud, next)) {
      // Update accent for current era.
      if (next.eraIndex !== hud.eraIndex) {
        const era = getEraByIndex(next.eraIndex);
        if (era && wrapRef.current) setRootAccent(wrapRef.current, era.id);
      }
      setHud(next);
    }
    dirtyRef.current++;
  }

  // ── HUD intent helpers
  const onSpawn   = (id)  => { intentsRef.current.spawn.push(id); };
  const onBuild   = (i)   => { intentsRef.current.buildTurret = { slot: i }; };
  const onSell    = (i)   => { intentsRef.current.sellTurret = i; };
  const onSpecial = ()    => { intentsRef.current.special = true; };
  const onEvolve  = ()    => { intentsRef.current.evolve = true; };
  const onAgain   = ()    => {
    submittedRef.current = false;
    tutorialSpawnsLeft.current = BALANCE.TUTORIAL_SPAWN_CT;
    setRestartKey((k) => k + 1);
  };
  const onTutDismiss = () => { setTutorialIdx(-1); storage.set(STORAGE_TUTORIAL_KEY, '1'); };

  const era = getEraByIndex(hud.eraIndex);
  const unitIds = era?.unitIds || [];
  const difficulty = modeToDifficulty(mode);

  return (
    <div ref={wrapRef} className="es-root">
      <HUD
        gold={hud.gold}
        playerHP={hud.playerHP}
        enemyHP={hud.enemyHP}
        maxHP={BALANCE.BASE_HP}
        eraIndex={hud.eraIndex}
        timeSec={hud.timeSec}
      />
      <div className="es-stage" ref={(el) => { /* canvas's parent is the stage */ }}>
        <canvas ref={canvasRef} className="es-canvas" aria-label="Era Siege battlefield"/>
        <DifficultyChip difficultyId={difficulty}/>
        <EraBadge
          gold={hud.gold}
          xp={hud.xp}
          eraIndex={hud.eraIndex}
          onEvolve={onEvolve}
        />
        <SpecialButton
          eraIndex={hud.eraIndex}
          cooldownMs={hud.specialCooldownMs}
          charging={hud.specialCharging}
          onFire={onSpecial}
        />
        <TurretRack
          slots={hud.turretSlots}
          eraIndex={hud.eraIndex}
          gold={hud.gold}
          onBuild={onBuild}
          onSell={onSell}
        />
        <Tutorial activeIdx={tutorialIdx} onDismiss={onTutDismiss}/>
        <PauseOverlay
          paused={paused}
          onResume={() => { pausedRef.current = false; setPaused(false); }}
        />
        {SHOW_PERF && (
          <PerfOverlay
            perfMon={perfMonRef.current}
            deviceClass={deviceClassRef.current}
            lowFx={matchRef.current?.lowFx || false}
          />
        )}
        <ResultPanel
          status={hud.status}
          eraIndex={hud.eraIndex}
          timeSec={hud.timeSec}
          score={hud.score}
          stats={hud.stats}
          onAgain={onAgain}
        />
      </div>
      <UnitDock
        unitIds={unitIds}
        gold={hud.gold}
        cooldownsMs={hud.cooldownsMs}
        onSpawn={onSpawn}
      />
    </div>
  );
}

// Returns true if any visible HUD field changed enough to warrant a render.
function cheapDiffers(a, b) {
  if (a.gold !== b.gold) return true;
  if (a.xp !== b.xp) return true;
  if (a.eraIndex !== b.eraIndex) return true;
  if (a.playerHP !== b.playerHP) return true;
  if (a.enemyHP !== b.enemyHP) return true;
  if (a.specialCooldownMs !== b.specialCooldownMs) return true;
  if (a.specialCharging !== b.specialCharging) return true;
  if (a.timeSec !== b.timeSec) return true;
  if (a.status !== b.status) return true;
  if (a.score !== b.score) return true;
  // Cooldowns: same keys, scalar values; check by key set + magnitude.
  const ak = Object.keys(a.cooldownsMs);
  const bk = Object.keys(b.cooldownsMs);
  if (ak.length !== bk.length) return true;
  for (const k of bk) {
    if (Math.abs((a.cooldownsMs[k] || 0) - (b.cooldownsMs[k] || 0)) > 8) return true;
  }
  // Turret slots: shape change only.
  for (let i = 0; i < 3; i++) {
    const ai = a.turretSlots[i], bi = b.turretSlots[i];
    if (!ai !== !bi) return true;
    if (ai && bi && (ai.eraIndex !== bi.eraIndex || ai.turretId !== bi.turretId)) return true;
  }
  // Stats: only the kill count moves often.
  if (a.stats?.kills !== b.stats?.kills) return true;
  return false;
}
