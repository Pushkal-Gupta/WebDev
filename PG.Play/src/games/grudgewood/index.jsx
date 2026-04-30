// Grudgewood — top-level React component for the continuous, infinite forest.
//
// Architecture:
//   engine.js        → Three.js renderer, scene, lights, sky, biome blend
//   chunkManager.js  → streams terrain + props + traps as the player advances
//   player.js        → controller + animated rig
//   camera.js        → chase/death/menu camera modes
//   input.js         → keyboard + touch axis
//   spawn.js         → deterministic per-chunk content rules
//   biomeProgression → which biome lives at which Z, with crossfades
//
// The whole game is one phase: walk forward, dodge what attacks you. Death
// resets you to a respawn anchor at your furthest reached distance.

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import './styles.css';
import { makeEngine } from './engine.js';
import { ChaseCamera } from './camera.js';
import { ChunkManager } from './chunkManager.js';
import { biomeAt } from './biomeProgression.js';
import { makePlayer, PlayerController, PLAYER_RADIUS } from './player.js';
import { Input } from './input.js';
import { sfx, startAmbient, stopAmbient, setVolumes, unlockAudio } from './audio.js';
import { pickEpitaph, KIND_LABEL } from './epitaphs.js';
import {
  getSave, recordDeath, setSetting, resetProgress, recordDistance,
} from './save.js';
import HUD from './ui/HUD.jsx';
import Menu from './ui/Menu.jsx';
import TouchControls from './ui/TouchControls.jsx';
import { submitScore } from '../../scoreBus.js';

const tmp = new THREE.Vector3();
const RESPAWN_GRID = 50;        // meters between auto-respawn anchors
const SPAWN_Z = 2;              // initial spawn distance into the forest

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

    // Place player at a starting Z and snap the camera behind them.
    const placeAt = (z) => {
      // Snap to the path centerline so the player always spawns on solid ground.
      const x = 0;
      const y = chunks.sampleHeight(x, z);
      chunks.ensureLoadedAround(z);
      player.reset(new THREE.Vector3(x, y, z), 0);
      const camPos = new THREE.Vector3(x, y + 4, z - 8);
      cam.snapTo(camPos, new THREE.Vector3(x, y + 1.4, z));
      const { biome } = biomeAt(z);
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
      respawnZ: SPAWN_Z,
      furthestZ: SPAWN_Z,
      toastText: '',
      toastUntil: 0,
      flashKey: 0,
      respawnDelay: 0,
      timeScale: 1,           // 1=normal, 0=hit-stop, 0.32=slow-mo
      hitStopTimer: 0,        // seconds remaining of frame-freeze on impact
      slowMoTimer: 0,         // seconds remaining of slow-mo (after hit-stop)
      lastBiomeId: null,
      lastAnchorRecorded: 0,

      startNewWalk() {
        gameState.respawnZ = SPAWN_Z;
        gameState.furthestZ = SPAWN_Z;
        gameState.sessionDeaths = 0;
        gameState.runStartTime = performance.now() / 1000;
        gameState.runtime = 0;
        placeAt(SPAWN_Z);
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
      },

      continueRun() {
        const sNow = getSave();
        gameState.respawnZ = Math.max(SPAWN_Z, sNow.respawnAnchor || SPAWN_Z);
        gameState.furthestZ = Math.max(gameState.respawnZ, sNow.furthestDistance || SPAWN_Z);
        gameState.sessionDeaths = 0;
        gameState.runStartTime = performance.now() / 1000;
        gameState.runtime = 0;
        placeAt(gameState.respawnZ);
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
      },

      respawn() {
        if (gameState.phase !== 'death' && gameState.phase !== 'play' && gameState.phase !== 'paused') return;
        placeAt(gameState.respawnZ);
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
        gameState.lastDeathDistance = Math.max(0, Math.round(player.pos.z - SPAWN_Z));
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
        const distance = Math.round(gameState.furthestZ);
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
        const camFwd = tmp.set(0, 0, -1).applyQuaternion(engine.camera.quaternion);
        inSnap.cameraYaw = Math.atan2(camFwd.x, camFwd.z);

        player.update(dt, {
          input: inSnap,
          sampleHeight: (x, z) => chunks.sampleHeight(x, z),
          casualMode: casual,
        });

        // Stream chunks around the player.
        chunks.ensureLoadedAround(player.pos.z);

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

        // Track furthest distance and auto-record respawn anchors at every
        // RESPAWN_GRID meters so death doesn't dump the player back to start.
        if (player.pos.z > gameState.furthestZ) gameState.furthestZ = player.pos.z;
        const anchor = Math.floor(player.pos.z / RESPAWN_GRID) * RESPAWN_GRID;
        if (anchor > gameState.lastAnchorRecorded && anchor >= SPAWN_Z) {
          gameState.lastAnchorRecorded = anchor;
          gameState.respawnZ = Math.max(gameState.respawnZ, anchor);
          recordDistance(gameState.furthestZ, gameState.respawnZ);
          if (anchor > SPAWN_Z) {
            sfx.checkpoint();
            cam.bump(0.3);
            gameState.toast(`${anchor}m — checkpoint`);
          }
        }

        gameState.runtime += dt;
      } else if (gameState.phase === 'death') {
        player.update(dt, { input: { left: false, right: false, fwd: false, back: false, sprint: false, jumpPressed: false }, sampleHeight: () => -10, casualMode: false });
        gameState.respawnDelay -= realDt;       // respawn timer runs in real time so slow-mo doesn't drag it
        if (gameState.respawnDelay <= 0) gameState.respawn();
      } else {
        // Menu / paused: keep streaming chunks at the player's last position
        // so the menu's atmospheric scene stays alive, and let traps tick
        // (gives the menu motion). No input is consumed.
        chunks.ensureLoadedAround(player.pos.z);
        chunks.tickTraps(dt, {
          player: player.pos,
          playerSpeedXZ: 0,
          playerGrounded: player.grounded,
          applyForce: () => {},
        });
      }

      // Crossfade biome look as the player approaches the next biome boundary.
      const { biome, next, blend } = biomeAt(player.pos.z);
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

      // HUD ~12 Hz.
      if (now - lastHudPush > 0.08) {
        lastHudPush = now;
        const toast = (gameState.toastUntil > now) ? gameState.toastText : '';
        setHud({
          biomeName: biome.name,
          distance: Math.max(0, Math.round(player.pos.z - SPAWN_Z)),
          furthest: Math.max(0, Math.round(gameState.furthestZ - SPAWN_Z)),
          deaths: gameState.sessionDeaths,
          flashKey: gameState.flashKey,
          deathState: gameState.phase === 'death' ? {
            kind: KIND_LABEL[gameState.lastDeathKind] || KIND_LABEL.unknown,
            epitaph: gameState.lastEpitaph,
            distance: gameState.lastDeathDistance,
            respawnAt: Math.max(0, Math.round(gameState.respawnZ - SPAWN_Z)),
          } : null,
          toast,
        });
      }

      raf = requestAnimationFrame(tickLoop);
    };
    raf = requestAnimationFrame(tickLoop);

    // Boot directly into the first chunk so the menu has scenery behind it.
    placeAt(SPAWN_Z);
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
