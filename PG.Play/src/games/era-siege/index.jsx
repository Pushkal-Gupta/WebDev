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
import { readSettings, subscribeSettings, writeSettings, effectiveReduceMotion } from './utils/settings.js';
import { recordMatchResult, todaySeed, todayDateString, isDifficultyUnlocked, readStats } from './utils/stats.js';

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
import SettingsDrawer from './ui/SettingsDrawer.jsx';
import TopActions from './ui/TopActions.jsx';
import OrientationGuide from './ui/OrientationGuide.jsx';
import ShortcutsOverlay from './ui/ShortcutsOverlay.jsx';
import { makePerfMon, detectDeviceClass } from './engine/perf.js';

import './styles.css';

const STORAGE_TUTORIAL_KEY = 'era-siege:tutorial-dismissed';

// Map a GameIntro `mode` value to a difficulty id. Daily mode runs
// standard tuning under a stable seed; Endless runs standard tuning
// against a never-falling enemy.
function modeToDifficulty(mode) {
  if (mode === 'skirmish' || mode === 'standard' || mode === 'conquest') return mode;
  if (mode === 'daily' || mode === 'endless') return 'standard';
  return 'standard';
}
function modeIsDaily(mode)   { return mode === 'daily'; }
function modeIsEndless(mode) { return mode === 'endless'; }

// Read URL flags once at module load. SSR-safe.
const SHOW_PERF = typeof window !== 'undefined' && /[?&]perf\b/.test(window.location?.search || '');

export default function EraSiegeGame({ mode }) {
  // Refs hold the heavy stuff so changing them never triggers re-renders.
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
  const pausedRef = useRef(false);
  const perfMonRef = useRef(null);
  const deviceClassRef = useRef('desktop');
  const settingsRef = useRef(readSettings());

  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsRev, setSettingsRev] = useState(0);   // re-render trigger when settings change

  // Minimal HUD mirror.
  const [hud, setHud] = useState({
    gold: 110, xp: 0, eraIndex: 0,
    playerHP: BALANCE.BASE_HP, enemyHP: BALANCE.BASE_HP,
    cooldownsMs: {},
    turretSlots: [null, null, null],
    specialCooldownMs: 0, specialCharging: false,
    auraLeftMs: 0,
    timeSec: 0, status: 'playing', score: 0,
    endlessSec: 0,
    stats: { unitsSpawned: 0, turretsBuilt: 0, specialsUsed: 0, kills: 0 },
  });
  const [tutorialIdx, setTutorialIdx] = useState(() =>
    storage.get(STORAGE_TUTORIAL_KEY) === '1' ? -1 : 0,
  );
  const [restartKey, setRestartKey] = useState(0);

  // Settings subscription — re-render when any setting changes.
  useEffect(() => {
    return subscribeSettings((s) => { settingsRef.current = s; setSettingsRev((n) => n + 1); });
  }, []);

  // Pause when settings drawer is open. Restored on close.
  const wasPausedBeforeDrawerRef = useRef(false);
  useEffect(() => {
    if (settingsOpen) {
      wasPausedBeforeDrawerRef.current = pausedRef.current;
      pausedRef.current = true;
      setPaused(true);
    } else {
      pausedRef.current = wasPausedBeforeDrawerRef.current;
      setPaused(pausedRef.current);
    }
  }, [settingsOpen]);

  // ── Mount: build match, attach loop/renderer/audio/input.
  useEffect(() => {
    if (typeof window === 'undefined') return; // jsdom mount safety
    validateContent();

    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const difficulty = modeToDifficulty(mode);
    const isDaily = modeIsDaily(mode);
    const isEndless = modeIsEndless(mode);
    const seed = isDaily ? todaySeed() : undefined;
    const match = createMatch({
      difficulty,
      seed,
      endlessMode: isEndless,
      view: { w: 820, h: 420 },
    });
    matchRef.current = match;

    // Hook view sizing.
    const disposeFluid = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      setView(match, cssW, cssH);
      rendererRef.current?.clearCache();
    });

    // Renderer + perf monitor.
    const renderer = makeRenderer();
    rendererRef.current = renderer;
    deviceClassRef.current = detectDeviceClass();
    perfMonRef.current = makePerfMon({ deviceClass: deviceClassRef.current });

    // Audio.
    audioStopRef.current = attachAudio(match.bus);

    // Telemetry.
    const offMs = match.bus.on('match_start', (e) => telemetry.emit('era_siege:match_start', { ...e, isDaily }));
    const offMe = match.bus.on('match_end',   (e) => telemetry.emit('era_siege:match_end',   { ...e, isDaily }));
    const offEr = match.bus.on('era_reached', (e) => telemetry.emit('era_siege:era_reached', e));
    const offEv = match.bus.on('evolve_clicked', (e) => telemetry.emit('era_siege:evolve_clicked', e));
    const offUs = match.bus.on('unit_spawned', (e) => {
      if (e.team === 'player' && Math.random() < 0.25) telemetry.emit('era_siege:unit_spawned', e);
    });
    const offTb = match.bus.on('turret_built', (e) => telemetry.emit('era_siege:turret_built', e));
    const offSu = match.bus.on('special_used', (e) => telemetry.emit('era_siege:special_used', e));
    const offLg = match.bus.on('low_gold_error', () => { /* sampled in audio router */ });

    // Tutorial.
    const offTut = match.bus.on('unit_spawned', (e) => {
      if (e.team !== 'player') return;
      if (tutorialSpawnsLeft.current > 0) {
        tutorialSpawnsLeft.current--;
        const next = BALANCE.TUTORIAL_SPAWN_CT - tutorialSpawnsLeft.current;
        if (storage.get(STORAGE_TUTORIAL_KEY) !== '1') {
          if (next < 3) setTutorialIdx(next);
          else {
            setTutorialIdx(-1);
            storage.set(STORAGE_TUTORIAL_KEY, '1');
            telemetry.emit('era_siege:tutorial_complete', { skipped: false });
          }
        }
      }
    });

    // Match end: persist stats + submit score.
    const offEnd = match.bus.on('match_end', (e) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const score = scoreMatch(match);

      // Persist stats locally for the result panel + difficulty unlocks.
      try {
        recordMatchResult({
          difficulty: e.difficulty,
          won: e.won,
          era: e.era + 1,
          timeSec: e.timeSec,
          score,
          kills: match.statsPlayer.kills,
          spawns: match.statsPlayer.unitsSpawned,
          evolves: match.player.eraIndex,
          isDaily,
          dailyDate: isDaily ? todayDateString() : null,
        });
      } catch { /* don't block submission on storage failure */ }

      // Score submission via existing PG.Play infrastructure.
      // Endless mode is intentionally **not** submitted to the public
      // leaderboard — its score formula is different and would conflate
      // standard-mode bests with survival runs. Stats still persist
      // locally so the result panel + achievements work.
      if (!isEndless) {
        setTimeout(() => {
          submitScore('aow', score, {
            era:  e.era + 1,
            time: e.timeSec,
            difficulty: e.difficulty,
            defeat: !e.won,
            stats: e.stats,
            ...(isDaily ? { daily: true, dailyDate: todayDateString(), seed: match.seed } : {}),
          });
        }, BALANCE.RESULT_SUBMIT_DELAY_MS);
      }
    });

    // Keyboard.
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
      requestShortcuts: () => setShortcutsOpen((v) => !v),
    });

    // Loop.
    loopStopRef.current = startLoop({
      getMatch:   () => matchRef.current,
      getPaused:  () => pausedRef.current,
      getSpeed:   () => settingsRef.current.speed || 1,
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
        syncHud(m);
      },
      onFrame: (dt) => {
        const pm = perfMonRef.current;
        if (!pm || dt <= 0) return;
        pm.record(dt);
        // Resolve effective lowFx: explicit setting wins, else the auto detector.
        const sett = settingsRef.current;
        const auto = pm.evaluateLowFx(performance.now());
        const eff = sett.lowFxOverride === true ? true
                  : sett.lowFxOverride === false ? false
                  : auto;
        if (matchRef.current && matchRef.current.lowFx !== eff) {
          matchRef.current.lowFx = eff;
        }
        // Apply the effective reduce-motion to the screen-shake suppressor.
        const reduceMotion = effectiveReduceMotion(sett);
        if (matchRef.current) {
          matchRef.current.reduceMotion = reduceMotion;
          matchRef.current.cbSafe = !!sett.cbSafePalette;
        }
      },
    });

    setRootAccent(wrap, getEraByIndex(0).id);

    return () => {
      try { offMs?.(); offMe?.(); offEr?.(); offEv?.(); offUs?.(); offTb?.(); offSu?.(); offLg?.(); offTut?.(); offEnd?.(); } catch { /* ignore */ }
      try { audioStopRef.current?.(); } catch { /* ignore */ }
      try { kbStopRef.current?.(); } catch { /* ignore */ }
      try { loopStopRef.current?.(); } catch { /* ignore */ }
      try { disposeFluid?.(); } catch { /* ignore */ }
      try { teardownMatch(matchRef.current); } catch { /* ignore */ }
      matchRef.current = null;
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartKey, mode]);

  function setRootAccent(wrap, eraId) {
    const pal = paletteFor(eraId);
    wrap.style.setProperty('--es-accent', pal.hudAccent);
  }

  function syncHud(match) {
    if (!match) return;
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
      auraLeftMs: match.player.auraLeftMs || 0,
      timeSec: Math.floor(match.timeSec),
      status:  match.status,
      score:   match.endlessMode ? scoreMatch(match) : (match.status === 'playing' ? 0 : scoreMatch(match)),
      endlessSec: Math.floor(match.endlessTimeSec || 0),
      stats:   match.statsPlayer,
    };
    if (cheapDiffers(hud, next)) {
      if (next.eraIndex !== hud.eraIndex) {
        const era = getEraByIndex(next.eraIndex);
        if (era && wrapRef.current) setRootAccent(wrapRef.current, era.id);
      }
      setHud(next);
    }
  }

  // ── HUD intent helpers ─────────────────────────────────────────────
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
  const onTutDismiss = () => {
    setTutorialIdx(-1);
    storage.set(STORAGE_TUTORIAL_KEY, '1');
    telemetry.emit('era_siege:tutorial_complete', { skipped: true });
  };
  const onTogglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };
  const onCycleSpeed = () => {
    const cur = settingsRef.current.speed || 1;
    writeSettings({ speed: cur === 1 ? 2 : 1 });
  };

  const era = getEraByIndex(hud.eraIndex);
  const unitIds = era?.unitIds || [];
  const difficulty = modeToDifficulty(mode);
  const isDaily = modeIsDaily(mode);
  const isEndless = modeIsEndless(mode);
  const speed = settingsRef.current.speed || 1;
  const stats = readStats();

  return (
    <div ref={wrapRef} className="es-root" data-rev={settingsRev}>
      <HUD
        gold={hud.gold}
        playerHP={hud.playerHP}
        enemyHP={hud.enemyHP}
        maxHP={BALANCE.BASE_HP}
        eraIndex={hud.eraIndex}
        timeSec={hud.timeSec}
      />
      <div className="es-stage">
        <canvas ref={canvasRef} className="es-canvas" aria-label="Era Siege battlefield"/>
        <DifficultyChip difficultyId={difficulty}/>
        {isDaily && (
          <div className="es-daily-pill" title={`Daily seed for ${todayDateString()}`}>
            Daily · {todayDateString()}
          </div>
        )}
        {isEndless && (
          <div className="es-daily-pill" title={`Endless mode — score: ${hud.score}`}>
            Endless · {hud.endlessSec}s · {hud.score}/100
          </div>
        )}
        <TopActions
          paused={paused}
          speed={speed}
          onTogglePause={onTogglePause}
          onCycleSpeed={onCycleSpeed}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <EraBadge
          gold={hud.gold}
          xp={hud.xp}
          eraIndex={hud.eraIndex}
          onEvolve={onEvolve}
        />
        {hud.auraLeftMs > 0 && (
          <div className="es-aura-pill" title="Sun Forge: +25% damage to your units">
            Sun Forge · {Math.ceil(hud.auraLeftMs / 1000)}s
          </div>
        )}
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
          paused={paused && !settingsOpen}
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
          difficulty={difficulty}
          isDaily={isDaily}
          persistedStats={stats}
          onAgain={onAgain}
        />
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
        <OrientationGuide deviceClass={deviceClassRef.current}/>
        <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)}/>
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

function cheapDiffers(a, b) {
  if (a.gold !== b.gold) return true;
  if (a.xp !== b.xp) return true;
  if (a.eraIndex !== b.eraIndex) return true;
  if (a.playerHP !== b.playerHP) return true;
  if (a.enemyHP !== b.enemyHP) return true;
  if (a.specialCooldownMs !== b.specialCooldownMs) return true;
  if (a.specialCharging !== b.specialCharging) return true;
  if ((a.auraLeftMs > 0) !== (b.auraLeftMs > 0)) return true;
  if (Math.abs((a.auraLeftMs || 0) - (b.auraLeftMs || 0)) > 250) return true;
  if (a.timeSec !== b.timeSec) return true;
  if (a.status !== b.status) return true;
  if (a.score !== b.score) return true;
  const ak = Object.keys(a.cooldownsMs);
  const bk = Object.keys(b.cooldownsMs);
  if (ak.length !== bk.length) return true;
  for (const k of bk) {
    if (Math.abs((a.cooldownsMs[k] || 0) - (b.cooldownsMs[k] || 0)) > 8) return true;
  }
  for (let i = 0; i < 3; i++) {
    const ai = a.turretSlots[i], bi = b.turretSlots[i];
    if (!ai !== !bi) return true;
    if (ai && bi && (ai.eraIndex !== bi.eraIndex || ai.turretId !== bi.turretId)) return true;
  }
  if (a.stats?.kills !== b.stats?.kills) return true;
  return false;
}

// Re-export the unlock helper so the lobby can read it cheaply.
export { isDifficultyUnlocked };
