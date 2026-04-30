// Grudgewood — top-level React component for the maze-grid forest.
//
// Architecture:
//   engine.js        → Three.js renderer, scene, lights, sky, biome blend
//   mazeGrid.js      → cell coordinates, edge walls, deterministic doors
//   walls.js         → wall meshes + AABBs (shared between renderer + physics)
//   chunkManager.js  → 2D cell loader, ticks traps, exposes wall AABBs
//   player.js        → controller + animated rig + circle-vs-AABB collision
//   camera.js        → fixed isometric pan-cam
//   input.js         → keyboard + touch (absolute world axes)
//   spawn.js         → per-cell trap layouts based on door pattern
//   biomeProgression → biome by Euclidean distance from spawn
//
// One phase: walk in any direction, dodge what attacks you. Death sends
// you back to spawn. Score = furthest Euclidean distance reached.

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import './styles.css';
import { makeEngine } from './engine.js';
import { ChaseCamera } from './camera.js';
import { ChunkManager } from './chunkManager.js';
import { distanceFromSpawn } from './biomeProgression.js';
import { makePlayer, PlayerController, PLAYER_RADIUS } from './player.js';
import { Input } from './input.js';
import { sfx, startAmbient, stopAmbient, setVolumes, unlockAudio } from './audio.js';
import { pickEpitaph, KIND_LABEL } from './epitaphs.js';
import {
  getSave, recordDeath, setSetting, resetProgress, recordDistance, recordFlagRaise,
} from './save.js';
import { flagAnchorFor, FLAG_INTERVAL_CELLS } from './flags.js';
import { CELL_SIZE } from './mazeGrid.js';
import HUD from './ui/HUD.jsx';
import Menu from './ui/Menu.jsx';
import TouchControls from './ui/TouchControls.jsx';
import { submitScore } from '../../scoreBus.js';

const RESPAWN_RING = 50;        // metres of distance between auto-checkpoint pulses

export default function GrudgewoodGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const inputRef = useRef(null);

  const [phase, setPhase] = useState('menu');
  const [hudData, setHud] = useState({
    biomeName: 'Mosswake',
    distance: 0,
    furthest: 0,
    deaths: 0,
    flashKey: 0,
    deathState: null,
    toast: '',
  });
  const [save, setSave] = useState(() => ({ ...getSave() }));
  const refresh = useCallback(() => setSave({ ...getSave() }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const s = getSave();

    const engine = makeEngine({ canvas, qualitySetting: s.settings.quality });
    const cam = new ChaseCamera(engine.camera);
    cam.setShakeMultiplier((s.settings.reducedMotion ? 0.25 : 1) * (s.settings.cameraShake ?? 1));

    const chunks = new ChunkManager(engine.scene);
    const playerRig = makePlayer();
    playerRig.setHat(s.equippedHat || 'leaf-crown');
    engine.scene.add(playerRig.root);

    const player = new PlayerController(playerRig);
    const input = new Input();
    input.attach();
    inputRef.current = input;

    setVolumes({
      master: s.settings.masterVolume,
      sfx: s.settings.sfxVolume,
      music: s.settings.musicVolume,
    });

    const onResize = () => engine.resize(Math.max(1, wrap.clientWidth), Math.max(1, wrap.clientHeight));
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    // Place the player at a world-space anchor (defaults to the spawn-cell
    // centre). Camera snaps to the iso offset so respawn doesn't slew —
    // keep this in sync with camera.js ISO_OFFSET.
    const placeAt = (x = 12, z = 12) => {
      const y = chunks.sampleHeight(x, z);
      chunks.ensureLoadedAround(x, z);
      player.reset(new THREE.Vector3(x, y, z), 0);
      const camPos = new THREE.Vector3(x, y + 7.0, z - 7.5);
      cam.snapTo(camPos, new THREE.Vector3(x, y + 1.4, z));
      const { biome } = chunks.biomeAt(x, z);
      startAmbient(biome.id);
    };

    input.onPause = () => stateRef.current?.togglePause();
    input.onRetry = () => stateRef.current?.respawn();
    input.onEsc = () => stateRef.current?.openMenu();

    const gameState = {
      phase: 'menu',
      runStartTime: 0,
      runtime: 0,
      sessionDeaths: 0,
      lastDeathKind: null,
      lastDeathDistance: 0,
      lastEpitaph: '',
      furthestDistance: 0,    // best Euclidean distance reached this profile
      respawnAnchor: { x: 12, z: 12 },   // current checkpoint flag's world pos
      level: 0,                          // last flag index reached (0 = start)
      toastText: '',
      toastUntil: 0,
      flashKey: 0,
      respawnDelay: 0,
      timeScale: 1,           // 1=normal, 0=hit-stop, 0.32=slow-mo
      hitStopTimer: 0,        // seconds remaining of frame-freeze on impact
      slowMoTimer: 0,         // seconds remaining of slow-mo (after hit-stop)
      lastBiomeId: null,
      lastDistancePulse: 0,   // last RESPAWN_RING multiple we toasted at

      startNewWalk() {
        gameState.furthestDistance = 0;
        gameState.lastDistancePulse = 0;
        gameState.sessionDeaths = 0;
        gameState.runStartTime = performance.now() / 1000;
        gameState.runtime = 0;
        gameState.respawnAnchor = { x: 12, z: 12 };
        gameState.level = 0;
        // Always include flag 0 in the raised set on a fresh walk. The
        // first flag is the spawn flag — visible from the start, raised
        // by default so the player sees "this is a checkpoint" before
        // they walk anywhere.
        const sNow = getSave();
        chunks.raisedFlags = new Set(sNow.raisedFlags || []);
        chunks.raisedFlags.add(0);
        placeAt(gameState.respawnAnchor.x, gameState.respawnAnchor.z);
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
        // Tutorial toast — shown long enough that the player can read it
        // before the forest gets aggressive. Uses the shared toast slot.
        gameState.toast('WASD or arrows to move · reach the next red flag', 6.0);
      },

      continueRun() {
        const sNow = getSave();
        gameState.furthestDistance = sNow.furthestDistance || 0;
        gameState.lastDistancePulse = 0;
        gameState.sessionDeaths = 0;
        gameState.runStartTime = performance.now() / 1000;
        gameState.runtime = 0;
        const a = sNow.respawnAnchor || { x: 12, z: 12 };
        gameState.respawnAnchor = { x: a.x, z: a.z };
        gameState.level = sNow.highestLevel || 0;
        chunks.raisedFlags = new Set(sNow.raisedFlags || []);
        chunks.raisedFlags.add(0);    // spawn flag is always raised on continue
        placeAt(gameState.respawnAnchor.x, gameState.respawnAnchor.z);
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
      },

      respawn() {
        if (gameState.phase !== 'death' && gameState.phase !== 'play' && gameState.phase !== 'paused') return;
        gameState.lastDistancePulse = 0;
        placeAt(gameState.respawnAnchor.x, gameState.respawnAnchor.z);
        gameState.phase = 'play';
        gameState.timeScale = 1;
        gameState.hitStopTimer = 0;
        gameState.slowMoTimer = 0;
        cam.setMode('chase');
        setPhase('play');
      },

      togglePause() {
        if (gameState.phase === 'play') { gameState.phase = 'paused'; setPhase('paused'); }
        else if (gameState.phase === 'paused') { gameState.phase = 'play'; setPhase('play'); }
      },

      openMenu() {
        if (gameState.phase === 'menu') return;
        gameState.phase = 'menu';
        cam.setMode('menu');
        setPhase('menu');
        stopAmbient();
      },

      kill(kind, trapAnchor) {
        player.kill(kind);
        gameState.lastDeathKind = kind;
        gameState.lastDeathDistance = Math.round(distanceFromSpawn(player.pos.x, player.pos.z));
        gameState.lastEpitaph = pickEpitaph(kind);
        gameState.sessionDeaths++;
        recordDeath(kind);
        gameState.phase = 'death';
        // Death-cam tempo:
        //   1) hit-stop:   ~90ms total freeze (timeScale=0). Sells the impact.
        //   2) slow-mo:    ~360ms at 0.32× so the player reads the trap.
        //   3) settle:     remaining real-time until respawnDelay expires.
        // We schedule the slow-mo to begin after the freeze ends; the loop
        // ticks gameState.hitStopTimer and gameState.slowMoTimer in real
        // time so this sequence is frame-rate independent.
        gameState.respawnDelay = 1.3;
        gameState.hitStopTimer = 0.09;
        gameState.timeScale = 0;
        gameState.slowMoTimer = 0.36;
        cam.setMode('death', trapAnchor);
        cam.bump(1.4);
        setPhase('death');
        const distance = Math.round(gameState.furthestDistance);
        submitScore('grudgewood', Math.max(1, distance), {
          distance,
          deaths: gameState.sessionDeaths,
          deathKind: kind,
        });
      },

      toast(msg, dur = 2.4) {
        gameState.toastText = msg;
        gameState.toastUntil = performance.now() / 1000 + dur;
      },

      setShake(v) {
        const sNow = getSave();
        cam.setShakeMultiplier((sNow.settings.reducedMotion ? 0.25 : 1) * v);
      },
      setReducedMotion(rm) {
        const sNow = getSave();
        cam.setShakeMultiplier((rm ? 0.25 : 1) * (sNow.settings.cameraShake ?? 1));
      },
      setVolumes(vols) { setVolumes(vols); },
      setHat(id) { playerRig.setHat(id); },
    };
    stateRef.current = gameState;

    let raf = 0;
    let lastT = performance.now() / 1000;
    let lastHudPush = 0;

    const tickLoop = () => {
      const now = performance.now() / 1000;
      const realDt = Math.min(0.05, now - lastT);
      lastT = now;

      const sNow = getSave();
      const casual = sNow.settings.casualMode;

      // Death-cam tempo:
      //   hitStopTimer first (timeScale held at 0 — frame freeze),
      //   then slowMoTimer (timeScale ramped to 0.32 — slow-motion replay),
      //   finally back to normal. All timers tick in real time.
      if (gameState.hitStopTimer > 0) {
        gameState.hitStopTimer = Math.max(0, gameState.hitStopTimer - realDt);
        if (gameState.hitStopTimer === 0) gameState.timeScale = 0.32;
      } else if (gameState.slowMoTimer > 0) {
        gameState.slowMoTimer = Math.max(0, gameState.slowMoTimer - realDt);
        if (gameState.slowMoTimer === 0) gameState.timeScale = 1;
      }
      const dt = realDt * gameState.timeScale;

      if (gameState.phase === 'play') {
        const inSnap = input.snapshot();
        // Stream cells around the player BEFORE physics so wall AABBs are
        // up to date when the player tries to walk through them.
        chunks.ensureLoadedAround(player.pos.x, player.pos.z);

        // Collect every wall AABB from currently-loaded cells. Cheap because
        // only ~12 walls are loaded at once.
        const wallList = Array.from(chunks.wallAABBs());
        player.update(dt, {
          input: inSnap,
          sampleHeight: (x, z) => chunks.sampleHeight(x, z),
          casualMode: casual,
          walls: wallList,
        });

        // Tick traps with the player context. applySlow lets area-effect
        // traps (spore cloud) tax the player's speed without killing.
        chunks.tickTraps(dt, {
          player: player.pos,
          playerSpeedXZ: player.speedXZ(),
          playerGrounded: player.grounded,
          applyForce: (f, dts) => player.applyForce(f, dts),
          applySlow: (factor, duration) => player.applySlow(factor, duration),
        });

        // Predator near-miss feedback.
        for (const trap of chunks.traps()) {
          if (trap.kind !== 'predator' || !trap.lethalActive) continue;
          const d = trap.swingDistanceTo?.(player.pos) ?? Infinity;
          if (d < 2.0 && d > trap.hitRadius + PLAYER_RADIUS) {
            if (!trap._nearMissed) {
              trap._nearMissed = true;
              cam.bump(0.55);
              player.stumble = 0.25;
            }
          } else if (trap.phase !== 'strike') {
            trap._nearMissed = false;
          }
        }

        // Lethal hits.
        if (player.alive && player.invuln <= 0) {
          const trap = chunks.checkLethalHit(player.pos, PLAYER_RADIUS);
          if (trap) {
            if (casual && Math.random() < 0.35) {
              player.applyForce({ x: -player.vel.x, y: 6, z: -player.vel.z * 0.4 }, dt);
              player.invuln = 0.5;
              player.stumble = 0.4;
              cam.bump(0.6);
              gameState.flashKey++;
            } else {
              // Kill: pass the trap's anchor so the death camera knows
              // where to look. trap.anchor is a world-space Vector3.
              gameState.kill(trap.kind, trap.anchor);
            }
          }
        }

        // Flag checkpoint detection. When the player is within the touch
        // radius of an unraised flag, raise it: latch state, persist to
        // save, move the respawn anchor, bump the level counter, and toast.
        for (const f of chunks.flagsNear(player.pos.x, player.pos.z)) {
          if (chunks.raiseFlag(f.level)) {
            gameState.respawnAnchor = { x: f.anchor.x, z: f.anchor.z };
            if (f.level > gameState.level) gameState.level = f.level;
            recordFlagRaise(f.level, f.anchor);
            sfx.checkpoint();
            cam.bump(0.4);
            if (f.level === 0) {
              gameState.toast('Flag raised. Walk forward.');
            } else {
              gameState.toast(`Level ${f.level} cleared — checkpoint set.`);
            }
          }
        }

        // Track furthest Euclidean distance reached for the leaderboard.
        const distNow = distanceFromSpawn(player.pos.x, player.pos.z);
        if (distNow > gameState.furthestDistance) {
          gameState.furthestDistance = distNow;
          recordDistance(gameState.furthestDistance);
        }

        gameState.runtime += dt;
      } else if (gameState.phase === 'death') {
        player.update(dt, {
          input: { left: false, right: false, fwd: false, back: false, sprint: false, jumpPressed: false },
          sampleHeight: () => -10,
          casualMode: false,
          walls: [],          // skip collision while body tumbles below ground
        });
        gameState.respawnDelay -= realDt;       // respawn timer runs in real time so slow-mo doesn't drag it
        if (gameState.respawnDelay <= 0) gameState.respawn();
      } else {
        // Menu / paused: keep streaming cells at the player's last position
        // so the menu's atmospheric scene stays alive, and let traps tick
        // (gives the menu motion). No input is consumed.
        chunks.ensureLoadedAround(player.pos.x, player.pos.z);
        chunks.tickTraps(dt, {
          player: player.pos,
          playerSpeedXZ: 0,
          playerGrounded: player.grounded,
          applyForce: () => {},
          applySlow: () => {},
        });
      }

      // Crossfade biome look as the player crosses biome ring boundaries.
      const { biome, next, blend } = chunks.biomeAt(player.pos.x, player.pos.z);
      engine.applyBiome(biome, next, blend);
      if (gameState.lastBiomeId !== biome.id && gameState.phase === 'play') {
        gameState.lastBiomeId = biome.id;
        startAmbient(biome.id);
        gameState.toast(`Entering ${biome.name}.`);
      }

      cam.update(dt, {
        pos: player.pos,
        facing: player.facing,
        vel: player.vel,
        alive: player.alive,
        deathKind: player.deathKind,
      });

      engine.renderer.render(engine.scene, engine.camera);

      // HUD ~12 Hz. Distance is Euclidean from spawn; we surface the
      // current level, the metres to the next unraised flag, and a screen
      // angle so the HUD can render an arrow pointing the player there.
      // The camera mirrors X (see player.js for the why), so screen-X is
      // world -X; we mirror dx the same way when computing the angle.
      if (now - lastHudPush > 0.08) {
        lastHudPush = now;
        const toast = (gameState.toastUntil > now) ? gameState.toastText : '';
        const nextLevel = gameState.level + 1;
        const nextAnchor = flagAnchorFor(nextLevel);
        const dx = nextAnchor.x - player.pos.x;
        const dz = nextAnchor.z - player.pos.z;
        const distToFlag = Math.round(Math.hypot(dx, dz));
        // Screen-up = +Z, screen-right = -X (camera at south flips X).
        // CSS rotate is clockwise from screen-up, so:
        //   angle = atan2(screen-x, screen-y) = atan2(-dx, dz)
        const angleDeg = (Math.atan2(-dx, dz) * 180) / Math.PI;
        setHud({
          biomeName: biome.name,
          level: gameState.level,
          nextLevel,
          toNextFlag: distToFlag,
          waypointAngle: angleDeg,
          deaths: gameState.sessionDeaths,
          flashKey: gameState.flashKey,
          deathState: gameState.phase === 'death' ? {
            kindLabel: KIND_LABEL[gameState.lastDeathKind] || KIND_LABEL.unknown,
            kindRaw: gameState.lastDeathKind || 'unknown',
            epitaph: gameState.lastEpitaph,
            level: gameState.level,
          } : null,
          toast,
        });
      }

      raf = requestAnimationFrame(tickLoop);
    };
    raf = requestAnimationFrame(tickLoop);

    // Boot at spawn cell so the menu has scenery behind it.
    placeAt();
    cam.setMode('menu');

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      input.detach();
      inputRef.current = null;
      stopAmbient();
      chunks.disposeAll();
      engine.dispose();
      stateRef.current = null;
    };
  }, []);

  const handleContinue = () => stateRef.current?.continueRun();
  const handleNewGame = () => stateRef.current?.startNewWalk();
  const handleRetry = () => stateRef.current?.respawn();
  const handleSettingsChange = (k, v) => {
    setSetting(k, v);
    if (k === 'cameraShake') stateRef.current?.setShake?.(v);
    if (k === 'reducedMotion') stateRef.current?.setReducedMotion?.(v);
    if (k === 'masterVolume' || k === 'sfxVolume' || k === 'musicVolume') {
      const s2 = getSave();
      setVolumes({ master: s2.settings.masterVolume, sfx: s2.settings.sfxVolume, music: s2.settings.musicVolume });
    }
    refresh();
  };
  const handleResetProgress = () => { resetProgress(); refresh(); };
  const handleUnlockAudio = () => unlockAudio();

  return (
    <div ref={wrapRef} className="gw-wrap">
      <canvas ref={canvasRef} className="gw-canvas" />

      {phase === 'menu' ? (
        <Menu
          save={save}
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          onSettingsChange={handleSettingsChange}
          onResetProgress={handleResetProgress}
          onUnlockAudio={handleUnlockAudio}
        />
      ) : (
        <HUD
          {...hudData}
          paused={phase === 'paused'}
          onRetry={handleRetry}
        />
      )}

      <TouchControls inputRef={inputRef} active={phase === 'play'} />
    </div>
  );
}
