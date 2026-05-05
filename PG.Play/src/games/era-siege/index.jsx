// Era Siege — React shell.
//
// Owns the canvas + RAF loop, mirrors a minimal subset of MatchState into
// React state for the HUD, and wires audio + telemetry to sim events.
//
// Sim is framework-agnostic (no React anywhere under sim/ or content/).
// All gameplay-tunable values come from src/games/era-siege/content/.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../../scoreBus.js';
import { sfx as _sharedSfx, isMuted as _sharedIsMuted } from '../../sound.js';

// Wrapper so the hover-SFX handler can call without re-importing on
// every render. Respects the global mute toggle and the per-game
// settings volumes.
function uiHoverSfx() {
  try { _sharedSfx.hover && _sharedSfx.hover(); } catch { /* swallow */ }
}
function uiHoverIsMuted() {
  try { return _sharedIsMuted(); } catch { return false; }
}
import { sizeCanvasFluid } from '../../util/canvasDpr.js';
import { storage } from './utils/storage.js';
import { telemetry } from './utils/telemetry.js';
import { readSettings, subscribeSettings, writeSettings, effectiveReduceMotion } from './utils/settings.js';
import { recordMatchResult, todaySeed, todayDateString, isDifficultyUnlocked, readStats } from './utils/stats.js';

import { createMatch, tick, setView, teardownMatch, scoreMatch } from './sim/world.js';
import { readGameSave, writeGameSave, clearGameSave, applyGameSave, AUTOSAVE_INTERVAL_MS } from './utils/gameSave.js';
import { startLoop } from './engine/loop.js';
import { makeRenderer } from './engine/renderer.js';
import { makeIntents, clearIntents, attachKeyboard } from './engine/input.js';
import { attachAudio } from './engine/audio.js';
import { esMusic } from './engine/music.js';
import { paletteFor, getEraByIndex, nextEra } from './content/eras.js';
import { validateContent } from './content/index.js';
import { BALANCE } from './content/balance.js';

import TopBar from './ui/TopBar.jsx';
import UnitDock from './ui/UnitDock.jsx';
import TurretSlots from './ui/TurretSlots.jsx';
import SpecialButton from './ui/SpecialButton.jsx';
import GeneralButton from './ui/GeneralButton.jsx';
import Tutorial from './ui/Tutorial.jsx';
import ResultPanel from './ui/ResultPanel.jsx';
import DifficultyChip from './ui/DifficultyChip.jsx';
import PauseOverlay from './ui/PauseOverlay.jsx';
import PerfOverlay from './ui/PerfOverlay.jsx';
import SettingsDrawer from './ui/SettingsDrawer.jsx';
import OrientationGuide from './ui/OrientationGuide.jsx';
import ShortcutsOverlay from './ui/ShortcutsOverlay.jsx';
import TurretBuildModal from './ui/TurretBuildModal.jsx';
import TurretManagePopover from './ui/TurretManagePopover.jsx';
import PowerUpsDrawer from './ui/PowerUpsDrawer.jsx';
import UpgradeStation from './ui/UpgradeStation.jsx';
import EvolutionPanel from './ui/EvolutionPanel.jsx';
import EraBanner from './ui/EraBanner.jsx';
import LootOrbs from './ui/LootOrbs.jsx';
import KillFeed from './ui/KillFeed.jsx';
import BossWaveWarning from './ui/BossWaveWarning.jsx';
import StatsPanel from './ui/StatsPanel.jsx';
import { makePerfMon, detectDeviceClass } from './engine/perf.js';
import { assets } from './engine/assets.js';
import { POWERUP_DEFS, getMultiplier } from './sim/powerups.js';

import './styles.css';

const STORAGE_TUTORIAL_KEY = 'era-siege:tutorial-dismissed';

// Map a GameIntro `mode` value to a difficulty id. Daily mode runs
// standard tuning under a stable seed; Endless runs standard tuning
// against a never-falling enemy.
function modeToDifficulty(mode) {
  // New ladder: easy / normal / medium / hard / insane.
  if (mode === 'easy' || mode === 'normal' || mode === 'medium'
   || mode === 'hard' || mode === 'insane') return mode;
  // Legacy aliases — keep so older intro buttons / saved sessions still
  // resolve. getDifficulty() also alias-maps for safety.
  if (mode === 'skirmish') return 'easy';
  if (mode === 'standard') return 'normal';
  if (mode === 'conquest') return 'hard';
  if (mode === 'daily' || mode === 'endless') return 'normal';
  return 'normal';
}
function modeIsDaily(mode)   { return mode === 'daily'; }
function modeIsEndless(mode) { return mode === 'endless'; }

// Read URL flags once at module load. SSR-safe.
const SHOW_PERF = typeof window !== 'undefined' && /[?&]perf\b/.test(window.location?.search || '');
// `?es-debug` toggles a tiny overlay reporting how many era-siege image
// assets loaded. Failures already log to console; the overlay is the
// at-a-glance check the user can run without opening devtools.
const SHOW_ES_DEBUG = typeof window !== 'undefined' && /[?&]es-debug\b/.test(window.location?.search || '');
function urlSeed() {
  if (typeof window === 'undefined') return null;
  try {
    const m = (window.location.search || '').match(/[?&]es-seed=(-?\d+)/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? (n >>> 0) : null;
  } catch { return null; }
}

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
  const [statsOpen, setStatsOpen] = useState(false);
  const [powerUpsOpen, setPowerUpsOpen] = useState(false);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [turretBuildSlot, setTurretBuildSlot] = useState(null);
  const [turretManageSlot, setTurretManageSlot] = useState(null);
  const [eraBannerVer, setEraBannerVer] = useState(null);
  const [settingsRev, setSettingsRev] = useState(0);   // re-render trigger when settings change

  // Minimal HUD mirror.
  // Bus-subscribing children (KillFeed, LootOrbs, BossWaveWarning) need
  // a way to know that matchRef.current has been populated. React effects
  // fire child→parent, so a child's effect captures matchRef.current === null
  // at mount; we flip this flag *after* createMatch so the children's
  // effects re-run with the live match in hand.
  const [matchReady, setMatchReady] = useState(false);
  const [hud, setHud] = useState({
    gold: 110, goldRate: 0, xp: 0, eraIndex: 0,
    playerHP: BALANCE.BASE_HP, enemyHP: BALANCE.BASE_HP,
    maxHP: BALANCE.BASE_HP, enemyMaxHP: BALANCE.BASE_HP,
    cooldownsMs: {},
    enemyAuraLeftMs: 0,
    enemyEraIndex: 0,
    turretSlots: [null, null, null],
    specialCooldownMs: 0, specialCharging: false,
    specialCooldownMs2: 0, specialCharging2: false,
    generalCooldownMs: 0, generalAlive: false, generalsUnlocked: false,
    population: 0, populationMax: BALANCE.MAX_UNITS_PER_SIDE,
    spawnQueue: [],
    auraLeftMs: 0,
    timeSec: 0, status: 'playing', score: 0,
    endlessSec: 0,
    powerups: { economy: 0, base: 0, special: 0, turret: 0, troopDmg: 0, troopHp: 0, troopRng: 0 },
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

  // Pause sim while any blocking surface is open (settings / power-ups /
  // evolution preview / turret build / turret manage). Restored on close.
  const wasPausedBeforeDrawerRef = useRef(false);
  // Pause-on-overlay split into two cohorts:
  //   READ-MODE (auto-pause): settings, shortcuts cheat-sheet — these
  //     are explanations, not tactical decisions; pausing prevents the
  //     player getting flanked while reading keys.
  //   TACTICAL (no-pause): evolve, power-ups, turret build/manage —
  //     these are battlefield decisions made under pressure. Forcing
  //     a pause robs them of weight and feels jarring.
  const overlayOpen = settingsOpen || shortcutsOpen || statsOpen;
  // Kept for the PauseOverlay's "is the canvas obscured by anything?"
  // check (so the Resume click target is suppressed while a tactical
  // overlay is on top of the canvas).
  const anyOverlayOpen = overlayOpen
                      || powerUpsOpen || evolutionOpen
                      || turretBuildSlot != null || turretManageSlot != null;
  useEffect(() => {
    if (overlayOpen) {
      // Capture current pause state on the first open of an overlay session.
      if (!pausedRef.current) wasPausedBeforeDrawerRef.current = false;
      else                    wasPausedBeforeDrawerRef.current = true;
      pausedRef.current = true;
      setPaused(true);
    } else {
      pausedRef.current = wasPausedBeforeDrawerRef.current;
      setPaused(pausedRef.current);
    }
  }, [overlayOpen]);

  // ── Mount: build match, attach loop/renderer/audio/input.
  useEffect(() => {
    if (typeof window === 'undefined') return; // jsdom mount safety
    validateContent();
    // Begin loading any present art; placeholders carry the visuals
    // until images decode. Vite serves under `/` in dev and the
    // current dist under the configured base — we resolve relative.
    // No baseUrl arg → manifest resolves against document.baseURI so
    // assets work both in dev (localhost:5180/) and prod
    // (pushkalgupta.com/PG.Play/dist/).
    try { assets.preloadAll(); } catch { /* placeholder path is fine */ }

    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const difficulty = modeToDifficulty(mode);
    const isDaily = modeIsDaily(mode);
    const isEndless = modeIsEndless(mode);
    // URL-pinned seed wins over daily seed except in daily mode (the
    // whole point of daily is "the same seed for everyone today").
    const sharedSeed = !isDaily ? urlSeed() : null;
    const seed = isDaily ? todaySeed() : (sharedSeed != null ? sharedSeed : undefined);
    const match = createMatch({
      difficulty,
      seed,
      endlessMode: isEndless,
      view: { w: 820, h: 420 },
    });
    matchRef.current = match;
    setMatchReady(true);

    // ── Save / resume ──────────────────────────────────────────────
    // Daily + endless runs are skipped for save/resume — daily must
    // start fresh each day; endless is competitive runs that shouldn't
    // be paused-and-continued. Standard / difficulty modes restore
    // and auto-save.
    const canSave = !isDaily && !isEndless;
    if (canSave) {
      const save = readGameSave();
      if (save && save.difficulty === difficulty) {
        applyGameSave(match, save);
      }
    }
    const autoSaveTimer = canSave ? window.setInterval(() => {
      writeGameSave(match);
    }, AUTOSAVE_INTERVAL_MS) : null;
    const stopAutoSave = () => { if (autoSaveTimer) window.clearInterval(autoSaveTimer); };

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

    // Music bed — start the era-1 voice now; era_reached re-keys to
    // the new era's bed with a 3 s crossfade. Special impacts duck
    // the bed briefly so the impact-cue reads punchier.
    esMusic.start(match.player.eraIndex || 0);

    // Telemetry.
    const offMs = match.bus.on('match_start', (e) => telemetry.emit('era_siege:match_start', { ...e, isDaily }));
    const offMe = match.bus.on('match_end',   (e) => telemetry.emit('era_siege:match_end',   { ...e, isDaily }));
    const offEr = match.bus.on('era_reached', (e) => {
      telemetry.emit('era_siege:era_reached', e);
      // Player evolutions trigger the EraBanner overlay AND the music
      // crossfade — the new era's synth bed ramps in over 3 s while
      // the old one ramps down.
      if (e.team === 'player') {
        setEraBannerVer((v) => (v == null ? 1 : v + 1));
        try { esMusic.start(e.era | 0); } catch { /* swallow */ }
      }
    });
    // Special impact ducks the music bed for ~600 ms so the impact
    // cue reads punchier without permanently lowering the bed.
    const offSp = match.bus.on('special_used', () => {
      try { esMusic.duck(0.6); } catch { /* swallow */ }
    });
    const offEv = match.bus.on('evolve_clicked', (e) => telemetry.emit('era_siege:evolve_clicked', e));
    const offUs = match.bus.on('unit_spawned', (e) => {
      if (e.team === 'player' && Math.random() < 0.25) telemetry.emit('era_siege:unit_spawned', e);
    });
    const offTb = match.bus.on('turret_built', (e) => telemetry.emit('era_siege:turret_built', e));
    const offSu = match.bus.on('special_used', (e) => telemetry.emit('era_siege:special_used', e));
    const offLg = match.bus.on('low_gold_error', (e) => {
      // Visual feedback for failed buys — flash the gold counter red
      // for 300 ms. Only when reason indicates a money problem
      // (`gold` reason), not for other rejections (cooldown, era_locked).
      if (e?.reason !== 'gold') return;
      const root = wrapRef.current;
      if (!root) return;
      root.classList.add('es-shake-gold');
      window.clearTimeout(root._lowGoldTimer);
      root._lowGoldTimer = window.setTimeout(() => {
        root.classList.remove('es-shake-gold');
      }, 380);
    });

    // Player base took a hit → red strobe edge on the canvas wrap so the
    // damage reads even when the player's eyes are on the unit dock or
    // a popover. The class clears after 360 ms regardless of new hits
    // (timer reset on each hit, so steady fire keeps the strobe on).
    const offBh = match.bus.on('base_hit', (e) => {
      if (e?.team !== 'player') return;
      const root = wrapRef.current;
      if (!root) return;
      root.classList.add('es-base-hit');
      window.clearTimeout(root._baseHitTimer);
      root._baseHitTimer = window.setTimeout(() => {
        root.classList.remove('es-base-hit');
      }, 360);
    });

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
      // Drop the autosave the moment the match ends — no point resuming
      // a finished match, and a stale save would confuse "Continue".
      clearGameSave();
      stopAutoSave();
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
          isEndless,
          endlessSec: Math.round(match.endlessTimeSec || 0),
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
      requestBuild:   (i)   => {
        // Same flow as clicking the turret slot in the action bar:
        // an installed turret opens the manage popover, an empty
        // (or spot-only) slot opens the build modal so the player
        // can pick a tier. Without this the Z/X/C keys silently
        // submitted a buildTurret intent with no turretId and the
        // sim rejected it for missing data.
        const t = matchRef.current?.player.turretSlots[i];
        if (t && !t.spotOnly) setTurretManageSlot(t);
        else                  setTurretBuildSlot(i);
      },
      requestSell:    (i)   => { intentsRef.current.sellTurret = i; },
      requestSpecial:  ()    => { intentsRef.current.special  = true; },
      requestSpecial2: ()    => { intentsRef.current.special2 = true; },
      requestEvolve:  ()    => { intentsRef.current.evolve = true; },
      requestPause:   ()    => {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
      },
      requestShortcuts: () => setShortcutsOpen((v) => !v),
      requestPowerUps:  () => setPowerUpsOpen((v) => !v),
    });

    // Loop.
    loopStopRef.current = startLoop({
      getMatch:   () => matchRef.current,
      getPaused:  () => pausedRef.current,
      getSpeed:   () => settingsRef.current.speed || 1,
      getIntents: () => {
        const i = intentsRef.current;
        // Drain *every* intent field — earlier this clipped to 5
        // fields and silently dropped unlockGenerals, special2,
        // upgradeTurret, buildTurretSpot, queue, etc. The user
        // saw "click does nothing" because their intent never
        // reached the sim.
        const drained = {
          spawn:           i.spawn.slice(),
          queue:           i.queue.slice(),
          cancelQueue:     i.cancelQueue,
          buildTurret:     i.buildTurret,
          buildTurretSpot: i.buildTurretSpot,
          sellTurret:      i.sellTurret,
          upgradeTurret:   i.upgradeTurret,
          unlockGenerals:  i.unlockGenerals,
          buyPowerup:      i.buyPowerup,
          special:         i.special,
          special2:        i.special2,
          evolve:          i.evolve,
        };
        clearIntents(i);
        return drained;
      },
      render:    (m, dt) => {
        renderer.render(ctx, m, dt);
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
      // If the match is still in-flight when the component unmounts, the
      // player closed the tab / hit Back / changed games mid-run. Telemetry
      // calls this rage_quit so we can track sad-path drop-offs separate
      // from natural defeats. We ALSO write a final save so they can
      // resume next time.
      try {
        const m = matchRef.current;
        if (m && m.status === 'playing' && !submittedRef.current) {
          if (canSave) writeGameSave(m);
          telemetry.emit('era_siege:rage_quit', {
            era: m.player.eraIndex + 1,
            timeSec: Math.round(m.timeSec),
            hpRatio: m.player.base.hp / m.player.base.maxHp,
            difficulty: m.difficulty.id,
            isDaily,
            isEndless,
          });
        }
      } catch { /* swallow */ }
      try { stopAutoSave(); } catch { /* ignore */ }
      try { offMs?.(); offMe?.(); offEr?.(); offEv?.(); offUs?.(); offTb?.(); offSu?.(); offLg?.(); offBh?.(); offTut?.(); offEnd?.(); offSp?.(); } catch { /* ignore */ }
      try { esMusic.stop(); } catch { /* ignore */ }
      try { audioStopRef.current?.(); } catch { /* ignore */ }
      try { kbStopRef.current?.(); } catch { /* ignore */ }
      try { loopStopRef.current?.(); } catch { /* ignore */ }
      try { disposeFluid?.(); } catch { /* ignore */ }
      try { teardownMatch(matchRef.current); } catch { /* ignore */ }
      matchRef.current = null;
      setMatchReady(false);
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
      // Predictable gold trickle: era * powerup * difficulty. Kill
      // bounties + base-hit chip aren't included here (they're spiky).
      goldRate: (() => {
        const era = getEraByIndex(match.player.eraIndex);
        const eco = 1 + 0.10 * ((match.player.powerups?.economy) | 0);
        const dif = match.difficulty?.playerGoldRateMul ?? 1;
        return Math.round((era?.goldPerSec || 12) * eco * dif * 10) / 10;
      })(),
      xp:       match.player.xp,
      eraIndex: match.player.eraIndex,
      playerHP: match.player.base.hp,
      enemyHP:  match.enemy.base.hp,
      cooldownsMs: match.player._spawnCooldowns ? { ...match.player._spawnCooldowns } : {},
      enemyAuraLeftMs: match.enemy.auraLeftMs || 0,
      turretSlots: [0, 1, 2].map((i) => {
        const t = match.player.turretSlots[i];
        const spotBuilt = !!(match.player.turretSpots && match.player.turretSpots[i]);
        if (!t) return spotBuilt ? { spotOnly: true } : null;
        return { eraIndex: t.eraIndex, turretId: t.turretId, buildCost: t.buildCost, spotBuilt: true };
      }),
      specialCooldownMs: match.player.specialCooldownMs,
      specialCharging:   !!match.player.specialActive,
      specialCooldownMs2: match.player.specialCooldownMs2 || 0,
      specialCharging2:   !!match.player.specialActive2,
      generalCooldownMs:
        match.player._spawnCooldowns?.[getEraByIndex(match.player.eraIndex)?.generalId] || 0,
      generalAlive: match.player.units.some((u) => u.role === 'general' && !u.dead && u.hp > 0),
      generalsUnlocked: !!match.player.generalsUnlocked,
      population:    match.player.units.filter((u) => !u.dead && u.hp > 0).length,
      populationMax: BALANCE.MAX_UNITS_PER_SIDE,
      spawnQueue:    Array.isArray(match.player.spawnQueue)
        ? match.player.spawnQueue.map((q) => q.unitId)
        : [],
      auraLeftMs: match.player.auraLeftMs || 0,
      timeSec: Math.floor(match.timeSec),
      status:  match.status,
      score:   match.endlessMode ? scoreMatch(match) : (match.status === 'playing' ? 0 : scoreMatch(match)),
      endlessSec: Math.floor(match.endlessTimeSec || 0),
      maxHP:    match.player.base.maxHp,
      enemyMaxHP: match.enemy.base.maxHp,
      enemyEraIndex: match.enemy.eraIndex,
      powerups: match.player.powerups
        ? { ...match.player.powerups }
        : { economy: 0, base: 0, special: 0, turret: 0, troopDmg: 0, troopHp: 0, troopRng: 0 },
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
  // Player spawns go through the queue — gold is reserved on click and
  // the head spawns automatically when cooldown / pop-cap allow.
  const onSpawn   = (id)  => { intentsRef.current.queue.push(id); };
  const onCancelQueued = (i) => { intentsRef.current.cancelQueue = i; };
  const onBuild   = (i)   => { intentsRef.current.buildTurret = { slot: i }; };
  const onSell    = (i)   => { intentsRef.current.sellTurret = i; };
  const onSpecial  = ()   => { intentsRef.current.special  = true; };
  const onSpecial2 = ()   => { intentsRef.current.special2 = true; };
  const onDeployGeneral = () => {
    const cur = getEraByIndex(matchRef.current?.player.eraIndex || 0);
    if (cur?.generalId) intentsRef.current.spawn.push(cur.generalId);
  };
  const onUnlockGenerals = () => { intentsRef.current.unlockGenerals = true; };
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
  // Cycle speed 1 → 2 → 3 → 1. Per the Age of War 2 spec — three game
  // speeds. Clamped both ways so future settings reads see a valid value.
  const onCycleSpeed = () => {
    const cur = settingsRef.current.speed || 1;
    const next = cur === 1 ? 2 : cur === 2 ? 3 : 1;
    writeSettings({ speed: next });
  };
  const onBuyPowerup = (treeId) => { intentsRef.current.buyPowerup = treeId; };
  const onSlotClick = (i) => {
    const t = matchRef.current?.player.turretSlots[i];
    if (t) setTurretManageSlot(t);
    else   setTurretBuildSlot(i);   // modal handles spot-vs-turret state
  };
  // Spot-first flow: empty + no-spot → BuildSpot, empty + spot-built → BuildTurret.
  const onConfirmBuildSpot = (slot) => {
    intentsRef.current.buildTurretSpot = slot;
    setTurretBuildSlot(null);
  };
  // turretId is optional — when supplied (from the picker) the player
  // explicitly chose a tier; otherwise the era-default medium tier
  // builds (legacy + AI path).
  const onConfirmBuild = (slot, turretId) => {
    intentsRef.current.buildTurret = { slot, turretId };
    setTurretBuildSlot(null);
  };
  const onConfirmUpgrade = () => {
    if (turretManageSlot) intentsRef.current.buildTurret = { slot: turretManageSlot.slot };
    setTurretManageSlot(null);
  };
  const onConfirmSell = () => {
    if (turretManageSlot) intentsRef.current.sellTurret = turretManageSlot.slot;
    setTurretManageSlot(null);
  };
  // Per-turret stat upgrade (range / damage / rate). Stays open after
  // a buy so the player can stack levels.
  const onUpgradeTurretStat = (slot, statId) => {
    intentsRef.current.upgradeTurret = { slot, statId };
  };

  const era = getEraByIndex(hud.eraIndex);
  const unitIds = era?.unitIds || [];
  const difficulty = modeToDifficulty(mode);
  const isDaily = modeIsDaily(mode);
  const isEndless = modeIsEndless(mode);
  const stats = readStats();

  // Evolve readiness — exposed here so the TopBar's Evolve CTA can read it.
  const nextDef = era ? nextEra(era.id) : null;
  const evolveReady = !!nextDef && hud.xp >= nextDef.xpToEvolve && hud.gold >= nextDef.evolveCost;
  const specialReady = hud.specialCooldownMs <= 0 && !hud.specialCharging;

  // UI hover SFX — delegated handler so we don't need to wire onMouseEnter
  // on every button. Throttled (one chirp per 90 ms total) to avoid a
  // sound wall when the cursor sweeps a row of cards.
  const lastHoverMsRef = useRef(0);
  const onRootMouseOver = (e) => {
    if (uiHoverIsMuted()) return;
    const t = e.target;
    if (!t || !t.closest) return;
    // Match interactive surfaces only — avoid firing on bare panel space.
    if (!t.closest('button, .es-card2, .es-rack3-slot, .es-tb-tier, .es-pu-row, .es-tm-upg-row')) return;
    const now = performance.now();
    if (now - (lastHoverMsRef.current || 0) < 90) return;
    lastHoverMsRef.current = now;
    try { uiHoverSfx(); } catch { /* swallow */ }
  };

  return (
    <div ref={wrapRef} className="es-root" data-rev={settingsRev} onMouseOver={onRootMouseOver}>
      <TopBar
        gold={hud.gold}
        goldRate={hud.goldRate}
        xp={hud.xp}
        eraIndex={hud.eraIndex}
        playerHP={hud.playerHP}
        enemyHP={hud.enemyHP}
        maxHP={hud.maxHP}
        enemyEraIndex={hud.enemyEraIndex}
        timeSec={hud.timeSec}
        speed={settingsRef.current.speed || 1}
        population={hud.population}
        populationMax={hud.populationMax}
        paused={paused}
        specialReady={specialReady}
        evolveReady={evolveReady}
        onEvolve={() => setEvolutionOpen(true)}
        onTogglePause={onTogglePause}
        onCycleSpeed={onCycleSpeed}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPowerUps={() => setPowerUpsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
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
        {hud.auraLeftMs > 0 && (
          <div className="es-aura-pill" title="Sun Forge: +25% damage to your units">
            Sun Forge · {Math.ceil(hud.auraLeftMs / 1000)}s
          </div>
        )}
        {hud.enemyAuraLeftMs > 0 && (
          <div className="es-aura-pill is-enemy" title="Enemy Sun Forge: their units are buffed">
            Enemy Forge · {Math.ceil(hud.enemyAuraLeftMs / 1000)}s
          </div>
        )}

        {/* Action bar — single horizontal row pinned to the top of
            the stage. Houses the two specials (Q/W), the general,
            the turret-slot strip, and the upgrade station. Replaces
            the old right-rail vertical stack that floated in the
            middle of the canvas. */}
        <div className="es-action-bar" role="toolbar" aria-label="Battle actions">
          <SpecialButton
            eraIndex={hud.eraIndex}
            cooldownMs={hud.specialCooldownMs}
            charging={hud.specialCharging}
            onFire={onSpecial}
          />
          <SpecialButton
            eraIndex={hud.eraIndex}
            slot="secondary"
            cooldownMs={hud.specialCooldownMs2}
            charging={hud.specialCharging2}
            onFire={onSpecial2}
          />
          <GeneralButton
            eraIndex={hud.eraIndex}
            gold={hud.gold}
            cooldownMs={hud.generalCooldownMs}
            alive={hud.generalAlive}
            onDeploy={onDeployGeneral}
          />
          <TurretSlots
            slots={hud.turretSlots}
            eraIndex={hud.eraIndex}
            gold={hud.gold}
            onSlotClick={onSlotClick}
          />
          <UpgradeStation
            gold={hud.gold}
            powerups={hud.powerups}
            onOpen={() => setPowerUpsOpen(true)}
          />
        </div>

        <Tutorial activeIdx={tutorialIdx} onDismiss={onTutDismiss}/>
        <EraBanner eraIndex={hud.eraIndex} version={eraBannerVer}/>

        <LootOrbs matchRef={matchRef} canvasRef={canvasRef} matchReady={matchReady}/>
        <KillFeed matchRef={matchRef} matchReady={matchReady}/>
        <BossWaveWarning matchRef={matchRef} matchReady={matchReady}/>

        <PauseOverlay
          paused={paused && !anyOverlayOpen}
          onResume={() => { pausedRef.current = false; setPaused(false); }}
        />

        {SHOW_PERF && (
          <PerfOverlay
            perfMon={perfMonRef.current}
            deviceClass={deviceClassRef.current}
            lowFx={matchRef.current?.lowFx || false}
          />
        )}

        {SHOW_ES_DEBUG && <AssetDebugOverlay/>}

        <ResultPanel
          status={hud.status}
          eraIndex={hud.eraIndex}
          timeSec={hud.timeSec}
          score={hud.score}
          stats={hud.stats}
          difficulty={difficulty}
          seed={matchRef.current?.seed}
          isDaily={isDaily}
          persistedStats={stats}
          onAgain={onAgain}
        />

        <TurretBuildModal
          open={turretBuildSlot != null}
          slotIndex={turretBuildSlot ?? 0}
          eraIndex={hud.eraIndex}
          gold={hud.gold}
          /* Spot already laid? Modal switches to "Build Turret" mode;
             otherwise it shows "Build Spot" first. */
          spotBuilt={turretBuildSlot != null
            && !!matchRef.current?.player.turretSpots?.[turretBuildSlot]}
          onBuildSpot={onConfirmBuildSpot}
          onBuild={onConfirmBuild}
          onClose={() => setTurretBuildSlot(null)}
        />

        <TurretManagePopover
          open={turretManageSlot != null}
          /* Re-derive the slot from the live match each render so stat
             upgrades reflect immediately. The state holds the original
             snapshot only for the open/close trigger. */
          slot={turretManageSlot != null
            ? matchRef.current?.player.turretSlots[turretManageSlot.slot] || turretManageSlot
            : null}
          gold={hud.gold}
          eraIndex={hud.eraIndex}
          onUpgrade={onConfirmUpgrade}
          onSell={onConfirmSell}
          onUpgradeStat={onUpgradeTurretStat}
          onClose={() => setTurretManageSlot(null)}
        />

        <PowerUpsDrawer
          open={powerUpsOpen}
          gold={hud.gold}
          powerups={hud.powerups}
          onBuy={onBuyPowerup}
          onClose={() => setPowerUpsOpen(false)}
        />

        <EvolutionPanel
          open={evolutionOpen}
          eraIndex={hud.eraIndex}
          gold={hud.gold}
          xp={hud.xp}
          onEvolve={onEvolve}
          onClose={() => setEvolutionOpen(false)}
        />

        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
        <OrientationGuide deviceClass={deviceClassRef.current}/>
        <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)}/>
        <StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)}/>
      </div>

      <UnitDock
        unitIds={unitIds}
        generalId={era?.generalId}
        generalsUnlocked={hud.generalsUnlocked}
        generalUnlockCost={BALANCE.GENERAL_UNLOCK_COST}
        generalCooldownMs={hud.generalCooldownMs}
        generalAlive={hud.generalAlive}
        gold={hud.gold}
        cooldownsMs={hud.cooldownsMs}
        spawnQueue={hud.spawnQueue}
        onSpawn={onSpawn}
        onCancelQueued={onCancelQueued}
        onUnlockGenerals={onUnlockGenerals}
      />
    </div>
  );
}


// Tiny overlay shown when the URL has `?es-debug`. Polls the asset
// manifest twice a second and reports loaded/total/failed for the
// era-siege image keys. Useful for diagnosing the user's
// "troops aren't showing up" complaints — if the count says 50/50/0
// the issue is rendering or layout, not loading.
function AssetDebugOverlay() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);
  // Count keys via the registry export; ignores keys we explicitly
  // never load (clouds, turrets — see assets.js preloadAll).
  const reg = assets._registry;
  let total = 0, ready = 0;
  if (reg) {
    for (const [key, entry] of reg) {
      if (!entry.src) continue;
      if (key.endsWith('/clouds') || key.startsWith('turret/era')) continue;
      total++;
      if (entry.ready) ready++;
    }
  }
  const lr = assets._lastLoadReport;
  const failed = lr ? lr.failed.length : 0;
  void tick; // re-render trigger
  return (
    <div style={{
      position: 'absolute', bottom: 8, right: 8, zIndex: 20,
      padding: '6px 10px',
      background: 'rgba(0,0,0,0.7)', color: '#fff',
      font: '11px JetBrains Mono, monospace',
      borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
      pointerEvents: 'none',
    }}>
      assets {ready}/{total}{failed ? ` · ${failed} failed` : ''}
    </div>
  );
}

function cheapDiffers(a, b) {
  if (a.gold !== b.gold) return true;
  if ((a.goldRate || 0) !== (b.goldRate || 0)) return true;
  if (a.xp !== b.xp) return true;
  if (a.eraIndex !== b.eraIndex) return true;
  if (a.playerHP !== b.playerHP) return true;
  if (a.enemyHP !== b.enemyHP) return true;
  if (a.specialCooldownMs !== b.specialCooldownMs) return true;
  if ((a.specialCooldownMs2 || 0) !== (b.specialCooldownMs2 || 0)) return true;
  if (a.specialCharging2 !== b.specialCharging2) return true;
  if (a.generalAlive !== b.generalAlive) return true;
  if (a.generalsUnlocked !== b.generalsUnlocked) return true;
  if (Math.abs((a.generalCooldownMs || 0) - (b.generalCooldownMs || 0)) > 250) return true;
  if (a.population !== b.population) return true;
  if ((a.spawnQueue?.length || 0) !== (b.spawnQueue?.length || 0)) return true;
  for (let i = 0; i < (b.spawnQueue?.length || 0); i++) {
    if (a.spawnQueue?.[i] !== b.spawnQueue[i]) return true;
  }
  if (a.specialCharging !== b.specialCharging) return true;
  if ((a.auraLeftMs > 0) !== (b.auraLeftMs > 0)) return true;
  if (Math.abs((a.auraLeftMs || 0) - (b.auraLeftMs || 0)) > 250) return true;
  if ((a.enemyAuraLeftMs > 0) !== (b.enemyAuraLeftMs > 0)) return true;
  if (Math.abs((a.enemyAuraLeftMs || 0) - (b.enemyAuraLeftMs || 0)) > 250) return true;
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
  if (a.maxHP !== b.maxHP) return true;
  if (a.enemyMaxHP !== b.enemyMaxHP) return true;
  if (a.enemyEraIndex !== b.enemyEraIndex) return true;
  // Powerups change rarely (purchase only) — full shallow compare.
  const ap = a.powerups || {}, bp = b.powerups || {};
  if (ap.economy !== bp.economy || ap.base !== bp.base || ap.special !== bp.special || ap.turret !== bp.turret) return true;
  return false;
}

// Re-export the unlock helper so the lobby can read it cheaply.
export { isDifficultyUnlocked };
