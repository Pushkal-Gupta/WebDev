// Grudgewood — top-level React component. Owns the canvas, the engine,
// the world manager, the player rig, the chase camera, and the orchestration
// that ties save state, menu screens, input, and the gameplay loop.

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import './styles.css';
import { makeEngine } from './engine.js';
import { ChaseCamera } from './camera.js';
import { World } from './world.js';
import { biomeFor } from './biomes.js';
import { makePlayer, PlayerController, PLAYER_RADIUS } from './player.js';
import { SEGMENTS } from './levels.js';
import { Input } from './input.js';
import { sfx, startAmbient, stopAmbient, setVolumes, unlockAudio } from './audio.js';
import { pickEpitaph, KIND_LABEL } from './epitaphs.js';
import {
  getSave, recordCheckpoint, recordDeath, unlockHat, equipHat as saveEquipHat,
  setSetting, resetProgress, unlockAxe, update as updateSave, setMedal,
} from './save.js';
import { gradeRun, modifiersFor } from './challenges.js';
import HUD from './ui/HUD.jsx';
import Menu from './ui/Menu.jsx';
import TouchControls from './ui/TouchControls.jsx';
import { submitScore } from '../../scoreBus.js';

const tmp = new THREE.Vector3();

export default function GrudgewoodGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const inputRef = useRef(null);  // exposed to TouchControls (analog stick + jump)

  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState('menu'); // 'menu' | 'play' | 'death' | 'paused' | 'finished'
  const [hudData, setHud] = useState({
    biomeName: 'Mosswake',
    segmentLabel: 'Walk Home',
    deaths: 0,
    time: 0,
    flashKey: 0,
    deathState: null,
    axeUnlocked: false,
    axeBeacon: '',
    toast: '',
  });
  const [save, setSave] = useState(() => ({ ...getSave() }));

  const refresh = useCallback(() => setSave({ ...getSave() }), []);

  // ── Engine / scene bootstrap (mounted once) ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const s = getSave();

    const engine = makeEngine({ canvas, qualitySetting: s.settings.quality });
    const cam = new ChaseCamera(engine.camera);
    // Reduced motion globally damps shake on top of the user-tuned multiplier.
    const effShake = (s.settings.reducedMotion ? 0.25 : 1) * (s.settings.cameraShake ?? 1);
    cam.setShakeMultiplier(effShake);

    const world = new World(engine.scene);
    const playerRig = makePlayer();
    playerRig.setHat(s.equippedHat || 'leaf-crown');
    playerRig.setAxeVisible(!!s.axeUnlocked);
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

    // Resize observer keeps the canvas pixel-correct when the shell resizes.
    const onResize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      engine.resize(Math.max(1, w), Math.max(1, h));
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    // Helper: load segment, place player at start of path, snap camera.
    const loadSegment = (idx, anchor = 0) => {
      const def = world.loadSegment(idx);
      if (!def) return null;
      engine.applyBiome(biomeFor(def.biome));
      // Spawn position: at z=2 along path; if a checkpoint anchor is given, use that.
      let spawn;
      if (anchor > 0) {
        const cp = world.checkpoints.find((c) => c.anchor.z >= anchor - 0.1);
        spawn = (cp || world.checkpoints[0])?.anchor.clone() || new THREE.Vector3(0, 0, 2);
        // Activate previously-passed checkpoints up to this one.
        for (const c of world.checkpoints) {
          if (c.anchor.z <= anchor + 0.5) { c.reached = true; c.obj.userData.activate?.(); }
        }
      } else {
        spawn = new THREE.Vector3(world.terrain.pathOffset(2), world.terrain.sampleHeight(world.terrain.pathOffset(2), 2), 2);
      }
      player.reset(spawn, 0);
      // Snap camera behind player.
      const camPos = new THREE.Vector3(spawn.x, spawn.y + 4, spawn.z - 8);
      cam.snapTo(camPos, new THREE.Vector3(spawn.x, spawn.y + 1.4, spawn.z));
      startAmbient(def.biome);
      return def;
    };

    // Wire pause/retry/esc handlers — these go through React state via the ref.
    input.onPause = () => stateRef.current?.togglePause();
    input.onRetry = () => stateRef.current?.retry();
    input.onEsc = () => stateRef.current?.openMenu();

    // Game state machine — exposed via ref so React handlers and the loop both read it.
    const gameState = {
      phase: 'menu',
      currentSegment: 0,
      runStartTime: 0,
      runtime: 0,
      sessionDeaths: 0,
      lastDeathKind: null,
      lastEpitaph: '',
      axeBeaconText: '',
      toastText: '',
      toastUntil: 0,
      flashKey: 0,
      deathTimer: 0,
      respawnDelay: 0,
      // Pending operations issued by trap/UI events.
      pendingHat: null,
      pendingAxe: false,
      // Challenge state. When activeChallenge is set, the loop tracks
      // sprintUsed (for noSprint) and grades the run on segment-finish.
      activeChallenge: null,
      challengeMods: null,
      sprintUsed: false,
      challengeResult: null, // { medal, finished, deaths, elapsed } shown in finish overlay

      startNewWalk() {
        const s2 = getSave();
        loadSegment(0, 0);
        gameState.currentSegment = 0;
        gameState.runStartTime = performance.now() / 1000;
        gameState.runtime = 0;
        gameState.sessionDeaths = 0;
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
      },
      continueRun() {
        const s2 = getSave();
        const segIdx = clampSegmentIndex(s2.checkpoint?.segment ?? 0);
        loadSegment(segIdx, s2.checkpoint?.anchor ?? 0);
        gameState.currentSegment = segIdx;
        gameState.runStartTime = performance.now() / 1000;
        gameState.runtime = 0;
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
      },
      pickSegment(segIdx) {
        const idx = clampSegmentIndex(segIdx);
        loadSegment(idx, 0);
        gameState.currentSegment = idx;
        gameState.runStartTime = performance.now() / 1000;
        gameState.runtime = 0;
        gameState.sessionDeaths = 0;
        gameState.activeChallenge = null;
        gameState.challengeMods = null;
        gameState.sprintUsed = false;
        gameState.challengeResult = null;
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
      },
      startChallenge(challenge) {
        const idx = clampSegmentIndex(challenge.segment ?? 0);
        loadSegment(idx, 0);
        gameState.currentSegment = idx;
        gameState.runStartTime = performance.now() / 1000;
        gameState.runtime = 0;
        gameState.sessionDeaths = 0;
        gameState.activeChallenge = challenge;
        gameState.challengeMods = modifiersFor(challenge);
        gameState.sprintUsed = false;
        gameState.challengeResult = null;
        // hatBait challenges visually equip the required hat for the run only.
        if (gameState.challengeMods.hatRequired) {
          playerRig.setHat(gameState.challengeMods.hatRequired);
        }
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
      },
      retry() {
        if (gameState.phase !== 'death' && gameState.phase !== 'play' && gameState.phase !== 'paused' && gameState.phase !== 'finished') return;
        const segIdx = gameState.currentSegment;
        if (gameState.activeChallenge) {
          // Challenge runs always restart from the segment start so the timer
          // and death counts measure a full clean attempt.
          loadSegment(segIdx, 0);
          gameState.runStartTime = performance.now() / 1000;
          gameState.runtime = 0;
          gameState.sessionDeaths = 0;
          gameState.sprintUsed = false;
          gameState.challengeResult = null;
        } else {
          const s2 = getSave();
          loadSegment(segIdx, s2.checkpoint?.segment === segIdx ? s2.checkpoint.anchor : 0);
        }
        gameState.phase = 'play';
        cam.setMode('chase');
        setPhase('play');
      },
      exitChallenge() {
        // Used after a graded run — drop back to the menu.
        gameState.activeChallenge = null;
        gameState.challengeMods = null;
        gameState.sprintUsed = false;
        gameState.challengeResult = null;
        // Restore equipped hat from save.
        playerRig.setHat(getSave().equippedHat || 'leaf-crown');
        gameState.phase = 'menu';
        cam.setMode('menu');
        setPhase('menu');
        stopAmbient();
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
      kill(kind) {
        player.kill(kind);
        gameState.lastDeathKind = kind;
        gameState.lastEpitaph = pickEpitaph(kind);
        gameState.sessionDeaths++;
        recordDeath(kind);
        gameState.phase = 'death';
        gameState.deathTimer = 0;
        gameState.respawnDelay = 1.6;
        cam.setMode('death');
        cam.bump(1.2);
        setPhase('death');
      },
      toast(msg, dur = 2.4) {
        gameState.toastText = msg;
        gameState.toastUntil = performance.now() / 1000 + dur;
      },
    };
    stateRef.current = gameState;
    // Expose internals for React-side setters that need to mutate the live scene.
    gameState.setHat = (id) => { playerRig.setHat(id); };
    gameState.setShake = (v) => {
      const sNow = getSave();
      cam.setShakeMultiplier((sNow.settings.reducedMotion ? 0.25 : 1) * v);
    };
    gameState.setReducedMotion = (rm) => {
      const sNow = getSave();
      cam.setShakeMultiplier((rm ? 0.25 : 1) * (sNow.settings.cameraShake ?? 1));
    };
    gameState.setVolumes = (vols) => setVolumes(vols);

    // Main loop.
    let raf = 0;
    let lastT = performance.now() / 1000;
    let lastHudPush = 0;
    const tickLoop = () => {
      const now = performance.now() / 1000;
      let dt = Math.min(0.05, now - lastT);
      lastT = now;

      const sNow = getSave();
      const reduced = sNow.settings.reducedMotion;
      const casual = sNow.settings.casualMode;

      if (gameState.phase === 'play') {
        const inSnap = input.snapshot();
        // Challenge: noSprint disables the sprint flag at input time so the
        // player physics never sees it. Track usage attempts for the toast.
        const mods = gameState.challengeMods;
        if (mods && !mods.sprintAllowed && inSnap.sprint) {
          if (!gameState.sprintUsed) {
            gameState.toast('Walk only. Sprint disabled.');
          }
          gameState.sprintUsed = true;
          inSnap.sprint = false;
        }
        const ctx = {
          input: inSnap,
          sampleHeight: (x, z) => world.sampleHeight(x, z),
          casualMode: casual,
        };
        player.update(dt, ctx);

        // Per-trap context with applyForce.
        const trapCtx = {
          player: player.pos,
          playerSpeedXZ: player.speedXZ(),
          playerGrounded: player.grounded,
          applyForce: (f, dts) => player.applyForce(f, dts),
        };
        world.update(dt, trapCtx);

        // Lethal hits.
        if (player.alive && player.invuln <= 0) {
          const trap = world.checkLethalHit(player.pos, PLAYER_RADIUS);
          if (trap) {
            if (casual && Math.random() < 0.35) {
              // Casual mode: occasionally convert a kill to a near-miss with knockback.
              player.applyForce({ x: -player.vel.x, y: 6, z: -player.vel.z * 0.4 }, dt);
              player.invuln = 0.5;
              player.stumble = 0.4;
              cam.bump(0.6);
              gameState.flashKey++;
            } else {
              gameState.kill(trap.kind);
            }
          }
        }

        // Checkpoint touches.
        const cpHit = world.checkCheckpointTouch(player.pos);
        if (cpHit) {
          recordCheckpoint(SEGMENTS[gameState.currentSegment].biome, gameState.currentSegment, cpHit.anchor.z);
          gameState.toast('Checkpoint reached.');
          cam.bump(0.3);
        }

        // Secret hat touches.
        const hatHit = world.checkSecretTouch(player.pos);
        if (hatHit) {
          updateSave((s) => {
            s.hats[hatHit.hat] = true;
            s.secretsFound = Array.from(new Set([...(s.secretsFound || []), hatHit.id]));
          });
          gameState.toast(`Hat unlocked: ${hatHit.hat.replace(/-/g, ' ')}`);
        }

        // Altar reach (axe unlock).
        if (world.checkAltarReach(player.pos)) {
          unlockAxe();
          unlockHat('axe-circlet');
          playerRig.setAxeVisible(true);
          sfx.axeReveal();
          gameState.toast('You took the Axe.');
          gameState.phase = 'finished';
          submitScore('grudgewood', Math.max(1, Math.round(10000 - gameState.sessionDeaths * 100 - gameState.runtime)),
            { deaths: gameState.sessionDeaths, time: Math.round(gameState.runtime), reachedAxe: true });
          // Stay on screen with a celebratory camera reveal.
          cam.setMode('reveal');
          setPhase('finished');
          refresh();
        }

        // Reached end of segment → grade challenge or advance to next biome.
        if (world.reachedEnd(player.pos) && gameState.phase === 'play') {
          if (gameState.activeChallenge) {
            const result = {
              finished: true,
              elapsed: gameState.runtime,
              deaths: gameState.sessionDeaths,
            };
            const medal = gradeRun(gameState.activeChallenge, result);
            if (medal) setMedal(gameState.activeChallenge.id, medal);
            gameState.challengeResult = { ...result, medal };
            gameState.phase = 'finished';
            cam.setMode('reveal');
            setPhase('finished');
            refresh();
          } else {
            const next = gameState.currentSegment + 1;
            if (next >= SEGMENTS.length) {
              gameState.phase = 'finished';
              cam.setMode('reveal');
              setPhase('finished');
            } else {
              recordCheckpoint(SEGMENTS[next].biome, next, 0);
              gameState.currentSegment = next;
              loadSegment(next, 0);
              gameState.toast(`Entering ${biomeFor(SEGMENTS[next].biome).name}.`);
              cam.setMode('reveal');
              setTimeout(() => cam.setMode('chase'), 1400);
            }
          }
        }

        gameState.runtime += dt;
      } else if (gameState.phase === 'death') {
        // Update player so the death tumble still animates.
        player.update(dt, { input: { left:false,right:false,fwd:false,back:false,sprint:false,jumpPressed:false }, sampleHeight: () => -10, casualMode: false });
        gameState.deathTimer += dt;
        gameState.respawnDelay -= dt;
        if (gameState.respawnDelay <= 0) {
          gameState.retry();
        }
      } else if (gameState.phase === 'paused' || gameState.phase === 'menu' || gameState.phase === 'finished') {
        // Idle camera; keep world updating subtly so traps still loop.
        const trapCtx = {
          player: player.pos,
          playerSpeedXZ: 0,
          playerGrounded: player.grounded,
          applyForce: () => {},
        };
        world.update(dt, trapCtx);
      }

      // Camera always updates so menu/death flyovers feel alive.
      cam.update(dt, {
        pos: player.pos,
        facing: player.facing,
        vel: player.vel,
        alive: player.alive,
        deathKind: player.deathKind,
      });

      engine.renderer.render(engine.scene, engine.camera);

      // Push HUD updates at ~12hz to keep React renders cheap.
      if (now - lastHudPush > 0.08) {
        lastHudPush = now;
        const seg = SEGMENTS[gameState.currentSegment];
        const biome = seg ? biomeFor(seg.biome) : biomeFor('mosswake');
        const sNow2 = getSave();
        const toast = (gameState.toastUntil > now) ? gameState.toastText : '';
        setHud({
          biomeName: biome.name,
          segmentLabel: seg?.intro || '',
          deaths: gameState.sessionDeaths,
          time: gameState.runtime,
          axeUnlocked: !!sNow2.axeUnlocked,
          flashKey: gameState.flashKey,
          deathState: gameState.phase === 'death' ? {
            kind: KIND_LABEL[gameState.lastDeathKind] || KIND_LABEL.unknown,
            epitaph: gameState.lastEpitaph,
            nearestCheckpoint: world.checkpoints.find((c) => c.reached)?.anchor.z.toFixed(0) || 'start',
          } : null,
          axeBeacon: gameState.axeBeaconText,
          toast,
        });
      }

      raf = requestAnimationFrame(tickLoop);
    };
    raf = requestAnimationFrame(tickLoop);

    // Initial menu render with a placeholder Mosswake scene behind it.
    loadSegment(0, 0);
    cam.setMode('menu');

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      input.detach();
      inputRef.current = null;
      stopAmbient();
      world.disposeSegment();
      engine.dispose();
      stateRef.current = null;
    };
  }, []);

  // ── React event handlers for menu/HUD ──────────────────────────────────
  const handleContinue = () => stateRef.current?.continueRun();
  const handleNewGame = () => stateRef.current?.startNewWalk();
  const handlePickSegment = (idx) => stateRef.current?.pickSegment(idx);
  const handlePickChallenge = (challenge) => stateRef.current?.startChallenge(challenge);
  const handleExitChallenge = () => stateRef.current?.exitChallenge();
  const handleRetry = () => stateRef.current?.retry();
  const handleEquipHat = (id) => {
    saveEquipHat(id);
    stateRef.current?.setHat?.(id);
    refresh();
  };
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
  const handleResetProgress = () => {
    resetProgress();
    refresh();
  };
  const handleUnlockAudio = () => unlockAudio();

  return (
    <div ref={wrapRef} className="gw-wrap">
      <canvas ref={canvasRef} className="gw-canvas" />

      {phase === 'menu' ? (
        <Menu
          save={save}
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          onPickSegment={handlePickSegment}
          onPickChallenge={handlePickChallenge}
          onEquipHat={handleEquipHat}
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


      {phase === 'finished' ? (
        <FinishOverlay
          challenge={stateRef.current?.activeChallenge}
          result={stateRef.current?.challengeResult}
          onMenu={() => stateRef.current?.openMenu()}
          onRetry={handleRetry}
          onExitChallenge={handleExitChallenge}
        />
      ) : null}
    </div>
  );
}

function clampSegmentIndex(i) {
  return Math.max(0, Math.min(SEGMENTS.length - 1, i | 0));
}

function FinishOverlay({ challenge, result, onMenu, onRetry, onExitChallenge }) {
  if (challenge && result) {
    const fmt = (s) => {
      const m = Math.floor(s / 60), r = Math.max(0, s - m * 60);
      return `${m}:${r.toFixed(2).padStart(5, '0')}`;
    };
    return (
      <div className="gw-finish">
        <div className="gw-finish-card">
          <div className="gw-menu-sub" style={{ marginBottom: 4 }}>{challenge.name}</div>
          <div className="gw-menu-title">
            {result.medal ? `${result.medal[0].toUpperCase()}${result.medal.slice(1)}` : 'Run complete'}
          </div>
          <div className="gw-finish-stats">
            <div><span>Time</span><strong>{fmt(result.elapsed)}</strong></div>
            <div><span>Deaths</span><strong>{result.deaths}</strong></div>
            <div><span>Medal</span><strong>{result.medal || '—'}</strong></div>
          </div>
          <div className="gw-finish-actions">
            <button className="gw-btn" onClick={onRetry}>Retry</button>
            <button className="gw-btn gw-btn--primary" onClick={onExitChallenge}>Back to challenges</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="gw-finish">
      <div className="gw-finish-card">
        <div className="gw-menu-title">The Axe.</div>
        <div className="gw-menu-sub">You found the quiet at the end of the forest.</div>
        <button className="gw-btn gw-btn--primary" onClick={onMenu}>Back to menu</button>
      </div>
    </div>
  );
}
