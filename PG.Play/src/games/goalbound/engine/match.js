// GOALBOUND — match engine.
//
//   The side-view arcade football simulation. Steps physics, resolves
//   collisions, handles goals, AI, kickoff freeze, and feeds the
//   renderer + overlay callbacks.
//
//   Designed as a pure module: create(cfg) → { step, draw, reset,
//   onGoal, onFinish, getSnapshot }. UI calls step(dt) in its own
//   rAF loop.

import { PHYSICS } from '../content.js';
import { createAI } from './ai.js';

const {
  W, H, FLOOR, P_W, P_H, BALL_R,
  GOAL_W, GOAL_H,
  GRAVITY, PLAYER_MOVE, PLAYER_ACCEL, PLAYER_DECEL, PLAYER_JUMP,
  BALL_FRICTION_AIR, BALL_BOUNCE_GROUND, BALL_BOUNCE_WALL,
  KICK_CD, KICK_RANGE, KICK_POWER, KICK_CHARGE_MAX,
  WIN_GOALS, GOLDEN_SECONDS,
} = PHYSICS;

const EFFECT_CAP = 120;
// Hard cap on AI charge accumulation so it can't exceed the kick model's max.
const MAX_CHARGE = KICK_CHARGE_MAX;
// After a goal crosses the line we lock further detections for this long
// so a ball lingering in the goal zone doesn't re-fire scoreGoal each frame.
const GOAL_LOCK_MS = 1500;
// Charge threshold above which the ball gets a strong-shot trail (>70%).
const TRAIL_CHARGE_THRESHOLD = 0.7 * KICK_CHARGE_MAX;
const TRAIL_LIFE = 0.4;       // seconds of fade
const TRAIL_POINTS = 6;

export const createMatch = ({
  mode = 'bot',            // 'bot' | '2p' | 'practice' | 'challenge'
  difficulty,              // DIFFICULTY object
  duration = 60,
  ballCfg = { bounceMul:1, powerMul:1, dragMul:1 },
  weather  = { wind:0, rain:0, snow:0 },
  crowd    = { energy:0.7 },
  arena,                   // ARENA object (for render palette)
  home, away,              // TEAM objects
  homePlayer, awayPlayer,  // PLAYER objects
  goldenOnly = false,      // challenge: start directly in golden goal
  noJump = false,          // challenge: disable jump
  listeners = {},          // { onGoal, onFinish, onKick, onSave, onCrowd, onWhistle }
}) => {
  const state = {
    home: makePlayer(160,          +1, home.primary),
    away: makePlayer(W - 160 - P_W, -1, away.primary),
    ball: { x: W / 2, y: FLOOR - 160, vx: 0, vy: 0, spin: 0, trail: [], trailT: 0 },
    clock: duration,
    status: goldenOnly ? 'golden' : 'playing',
    golden: goldenOnly,
    scoreHome: 0,
    scoreAway: 0,
    celebT: 0,
    celebFor: null,
    kickOffT: 0.8,
    endReason: null,
    firstGoalAt: null,
    jumpCount: 0,
    peakAwayLead: 0,
    goalLog: [],                   // [{ t, side }]
    goalLockUntil: 0,              // ms timestamp; while > now, goals are ignored
    shake: { t: 0, amp: 0 },
    flash: 0,
    hitStop: 0,
    effects: [],                   // particles
    crowdPulse: 0,
    meta: { mode, difficulty: difficulty?.id, duration },
  };

  const ai = mode === 'bot' && difficulty ? createAI(difficulty, -1) : null;

  // Per-player input state (held + kick charge).
  const input = {
    p1: { left:false, right:false, jump:false, kick:false, charge:false, chargeT:0 },
    p2: { left:false, right:false, jump:false, kick:false, charge:false, chargeT:0 },
  };

  const setInput = (side, k) => { Object.assign(side === 'p1' ? input.p1 : input.p2, k); };

  // Public: apply a key event. Keyboard → intent mapping lives in UI,
  // but we expose convenience press/release helpers anyway.
  const api = {
    get state() { return state; },

    setP1: (k) => setInput('p1', k),
    setP2: (k) => setInput('p2', k),

    reset: (opts = {}) => {
      const keepScore = opts.keepScore;
      state.home.x = 160; state.home.y = FLOOR - P_H; state.home.vx = 0; state.home.vy = 0; state.home.kickCd = 0; state.home.kickAnim = 0; state.home.facing = 1;
      state.away.x = W - 160 - P_W; state.away.y = FLOOR - P_H; state.away.vx = 0; state.away.vy = 0; state.away.kickCd = 0; state.away.kickAnim = 0; state.away.facing = -1;
      state.ball.x = W / 2; state.ball.y = FLOOR - 180; state.ball.vx = 0; state.ball.vy = 0; state.ball.spin = 0;
      state.ball.trail.length = 0; state.ball.trailT = 0;
      state.goalLockUntil = 0;
      state.celebT = 0; state.celebFor = null;
      state.kickOffT = 0.8;
      state.hitStop = 0; state.shake.t = 0; state.shake.amp = 0; state.flash = 0;
      state.effects.length = 0;
      if (!keepScore) {
        state.scoreHome = 0; state.scoreAway = 0;
        state.clock = state.golden ? GOLDEN_SECONDS : duration;
        state.status = state.golden ? 'golden' : 'playing';
        state.firstGoalAt = null;
        state.jumpCount = 0;
        state.peakAwayLead = 0;
        state.goalLog.length = 0;
      }
      ai?.reset();
    },

    // One simulation step.
    step: (dt) => {
      if (state.status === 'ended') return;
      if (state.hitStop > 0) { state.hitStop -= dt; decayEffects(dt); return; }
      if (state.celebT > 0) { state.celebT -= dt; decayEffects(dt); return; }

      if (state.kickOffT > 0) {
        state.kickOffT -= dt;
        stepPlayer(state.home, { left:false, right:false, jump:false, kick:false }, dt);
        stepPlayer(state.away, { left:false, right:false, jump:false, kick:false }, dt);
        decayEffects(dt);
        return;
      }

      state.clock -= dt;
      if (state.clock <= 0) {
        // time up
        if (state.scoreHome > state.scoreAway) return finish('time', true);
        if (state.scoreAway > state.scoreHome) return finish('time', false);
        if (!state.golden) { state.golden = true; state.status = 'golden'; state.clock = GOLDEN_SECONDS; listeners.onWhistle?.(); }
        else {
          const homeWins = Math.random() > 0.5;
          if (homeWins) state.scoreHome += 1; else state.scoreAway += 1;
          return finish('flip', homeWins);
        }
      }

      // P1 (keyboard)
      updateCharge(input.p1, dt);
      stepPlayer(state.home, resolveInput(input.p1, noJump), dt, state);
      attemptKick(state.home, input.p1, state);

      // P2 or AI
      if (mode === 'bot' && ai) {
        const collect = {};
        ai.tick(state, dt, state.away, state.ball, (c) => Object.assign(collect, c));
        updateChargeAI(collect, input.p2, dt);
        stepPlayer(state.away, resolveInput(collect, noJump), dt, state);
        attemptKick(state.away, input.p2, state, collect.kick);
      } else if (mode === '2p') {
        updateCharge(input.p2, dt);
        stepPlayer(state.away, resolveInput(input.p2, noJump), dt, state);
        attemptKick(state.away, input.p2, state);
      }

      // Ball
      // Wind is a lateral acceleration. The factor used to be `* 60`
      // (a frame multiplier from a 60Hz era) which made the gust scale
      // with framerate. Use `* dt` so it's framerate-independent.
      const wind = weather.wind * dt; // lateral force this frame
      state.ball.vx += wind;
      state.ball.vy += GRAVITY * dt * (weather.snow ? 0.92 : 1);
      state.ball.vx *= Math.pow(BALL_FRICTION_AIR * (ballCfg.dragMul || 1), 60 * dt);
      state.ball.x  += state.ball.vx * dt;
      state.ball.y  += state.ball.vy * dt;
      state.ball.spin *= 0.985;

      // Strong-kick trail: while armed, push the ball position into a
      // ring buffer of TRAIL_POINTS. Renderer draws each as a fading
      // ghost. Decay age on existing samples; drop expired ones.
      if (state.ball.trailT > 0) {
        state.ball.trailT -= dt;
        state.ball.trail.unshift({ x: state.ball.x, y: state.ball.y, age: 0 });
        if (state.ball.trail.length > TRAIL_POINTS) state.ball.trail.length = TRAIL_POINTS;
      }
      if (state.ball.trail.length) {
        for (const t of state.ball.trail) t.age += dt;
        // Drop tail samples once they exceed the trail life.
        while (state.ball.trail.length && state.ball.trail[state.ball.trail.length - 1].age > TRAIL_LIFE) {
          state.ball.trail.pop();
        }
      }

      // Ground
      if (state.ball.y + BALL_R >= FLOOR) {
        state.ball.y = FLOOR - BALL_R;
        const absV = Math.abs(state.ball.vy);
        if (absV < 80) state.ball.vy = 0;
        else {
          state.ball.vy = -state.ball.vy * BALL_BOUNCE_GROUND * (ballCfg.bounceMul || 1) * (weather.rain ? 0.75 : 1) * (weather.snow ? 0.7 : 1);
          emitBounce(state, state.ball.x, FLOOR - 2);
          listeners.onBounce?.();
        }
        state.ball.vx *= weather.rain ? 0.84 : 0.92;
      }
      if (state.ball.y - BALL_R < 0) {
        state.ball.y = BALL_R;
        // Angle-dependent restitution: head-on impacts (cos=0) keep
        // most energy; glancing skims (cos→1) eat into it. Gives the
        // ball more weight than the old uniform multiplier.
        const r = wallRestitution(state.ball.vx, state.ball.vy, 'horizontal');
        state.ball.vy = -state.ball.vy * r;
      }
      const inLeftMouth  = state.ball.y > FLOOR - GOAL_H && state.ball.x < GOAL_W;
      const inRightMouth = state.ball.y > FLOOR - GOAL_H && state.ball.x > W - GOAL_W;
      if (state.ball.x - BALL_R < 0 && !inLeftMouth) {
        state.ball.x = BALL_R;
        const r = wallRestitution(state.ball.vx, state.ball.vy, 'vertical');
        state.ball.vx = -state.ball.vx * r;
        emitPostHit(state, 0, state.ball.y);
      }
      if (state.ball.x + BALL_R > W && !inRightMouth) {
        state.ball.x = W - BALL_R;
        const r = wallRestitution(state.ball.vx, state.ball.vy, 'vertical');
        state.ball.vx = -state.ball.vx * r;
        emitPostHit(state, W, state.ball.y);
      }

      // Goal — guard with goalLockUntil so a ball lingering in the
      // goal mouth for several frames doesn't fire scoreGoal each tick.
      const now = performance.now();
      if (now >= state.goalLockUntil) {
        if (inLeftMouth && state.ball.x < GOAL_W / 2) {
          state.goalLockUntil = now + GOAL_LOCK_MS;
          scoreGoal('away');
        } else if (inRightMouth && state.ball.x > W - GOAL_W / 2) {
          state.goalLockUntil = now + GOAL_LOCK_MS;
          scoreGoal('home');
        }
      }

      // Ball vs players
      collideBallPlayer(state, state.home);
      collideBallPlayer(state, state.away);

      // FX decay
      if (state.shake.t > 0) { state.shake.t -= dt; if (state.shake.t < 0) state.shake.t = 0; }
      if (state.flash > 0)   { state.flash -= dt * 3; if (state.flash < 0) state.flash = 0; }
      state.crowdPulse *= Math.pow(0.1, dt);
      decayEffects(dt);

      // Early win check
      if (!state.golden) {
        if (state.scoreHome >= WIN_GOALS) return finish('first-to-3', true);
        if (state.scoreAway >= WIN_GOALS) return finish('first-to-3', false);
      }
    },

    // Public: snapshot for persistence / hud.
    getSnapshot: () => ({
      scoreHome: state.scoreHome,
      scoreAway: state.scoreAway,
      clock: Math.max(0, Math.ceil(state.clock)),
      golden: state.golden,
      status: state.status,
    }),

    // Public: force finish (pause-quit, etc.)
    abort: () => { state.status = 'aborted'; listeners.onFinish?.({ reason:'abort' }); },
  };

  // ── helpers ──────────────────────────────────────────────────

  function finish(reason, homeWon) {
    state.status = 'ended';
    state.endReason = reason;
    listeners.onWhistle?.();
    listeners.onFinish?.({
      reason,
      won: homeWon,
      scoreHome: state.scoreHome,
      scoreAway: state.scoreAway,
      firstGoalAt: state.firstGoalAt,
      wasDownBy2: state.peakAwayLead >= 2,
      jumpCount: state.jumpCount,
      goalLog: state.goalLog.slice(),
    });
  }

  function scoreGoal(side) {
    const t = (duration - state.clock);
    if (side === 'home') state.scoreHome += 1; else state.scoreAway += 1;
    if (state.firstGoalAt == null) state.firstGoalAt = state.clock;
    state.peakAwayLead = Math.max(state.peakAwayLead, state.scoreAway - state.scoreHome);
    state.goalLog.push({ t: Math.round(t), side });
    state.celebT = 1.6; state.celebFor = side;
    state.kickOffT = 1.1;
    state.hitStop = 0.08;
    state.flash = 0.9;
    state.shake.t = 0.5; state.shake.amp = 12 * crowd.energy;
    state.crowdPulse = 1 * crowd.energy;
    emitGoalBurst(state, side);
    // reset positions
    state.ball.x = W / 2; state.ball.y = FLOOR - 180; state.ball.vx = 0; state.ball.vy = 0;
    state.ball.trail.length = 0; state.ball.trailT = 0;
    state.home.x = 160; state.home.y = FLOOR - P_H; state.home.vx = 0; state.home.vy = 0;
    state.away.x = W - 160 - P_W; state.away.y = FLOOR - P_H; state.away.vx = 0; state.away.vy = 0;
    listeners.onGoal?.(side, { scoreHome: state.scoreHome, scoreAway: state.scoreAway });
    // Golden goal or first-to-3 check handled each tick.
    if (state.golden) {
      finish('golden', side === 'home');
    }
  }

  function stepPlayer(p, ctl, dt) {
    // Horizontal accel/decel — smoother than the old raw-velocity toggle.
    const chase = p._aiChase || 1;
    const targetVx = ctl.left ? -PLAYER_MOVE * chase : ctl.right ? PLAYER_MOVE * chase : 0;
    const d = targetVx - p.vx;
    const a = targetVx === 0 ? PLAYER_DECEL : PLAYER_ACCEL;
    p.vx += Math.sign(d) * Math.min(Math.abs(d), a * dt);

    if (ctl.left)       p.facing = -1;
    else if (ctl.right) p.facing = 1;

    if (ctl.jump && p.onGround) {
      p.vy = PLAYER_JUMP;
      p.onGround = false;
      state.jumpCount += 1;
      // tiny squash flag for render
      p.squash = 0.35;
    }

    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.y + P_H >= FLOOR) {
      if (!p.onGround && Math.abs(p.vy) > 120) p.landing = 0.22;
      p.y = FLOOR - P_H; p.vy = 0; p.onGround = true;
    }
    if (p.x < 8) { p.x = 8; p.vx = 0; }
    if (p.x + P_W > W - 8) { p.x = W - 8 - P_W; p.vx = 0; }

    if (p.kickCd    > 0) p.kickCd    -= dt;
    if (p.kickAnim  > 0) p.kickAnim  -= dt;
    if (p.squash    > 0) p.squash    -= dt;
    if (p.landing   > 0) p.landing   -= dt;
  }

  function attemptKick(p, inp, s, forceKick) {
    // AI: forceKick bypasses hold/release; fire now if cooldown allows.
    if (forceKick) {
      if (p.kickCd > 0) return;
      launchKick(p, Math.min(KICK_CHARGE_MAX, inp.chargeAccum || 0), s);
      inp.chargeAccum = 0;
      inp.released = false;
      return;
    }
    // Keyboard: fire on release (tap = quick kick, hold = charged kick).
    if (inp.released) {
      if (p.kickCd > 0) { inp.released = false; return; }
      const charge = Math.min(KICK_CHARGE_MAX, inp.chargeAccum || 0);
      launchKick(p, charge, s);
      inp.released = false;
      inp.chargeAccum = 0;
    }
  }

  function launchKick(p, charge, s) {
    p.kickCd = KICK_CD;
    p.kickAnim = 0.22 + charge * 0.2;

    const bx = s.ball.x, by = s.ball.y;
    const cx = p.x + P_W / 2, cy = p.y + P_H / 2;
    const d = Math.hypot(bx - cx, by - cy);
    if (d < KICK_RANGE + BALL_R) {
      const upLift = Math.max(0, (p.y + P_H - by) / 60);
      const horizDir = p.facing;
      const power = KICK_POWER * (ballCfg.powerMul || 1) * (1.0 + charge * 1.2) * (1.03 + Math.random() * 0.08);
      s.ball.vx = horizDir * power;
      s.ball.vy = -180 - upLift * 80 - Math.random() * 60 - charge * 110;
      s.ball.spin = horizDir * (1 + charge * 2);
      s.hitStop = Math.max(s.hitStop, 0.04 + charge * 0.06);
      s.shake.t = Math.max(s.shake.t, 0.15 + charge * 0.1);
      s.shake.amp = Math.max(s.shake.amp, 4 + charge * 10);
      emitKickBurst(s, bx, by, horizDir, charge);
      // Strong kick: arm a fading trail behind the ball for ~400ms.
      if (charge >= TRAIL_CHARGE_THRESHOLD) {
        s.ball.trailT = TRAIL_LIFE;
        s.ball.trail.length = 0;
      }
      listeners.onKick?.({ charge });
    } else {
      emitKickWhiff(s, cx + p.facing * 16, cy);
    }
  }

  function updateCharge(slot, dt) {
    const wasHeld = !!slot.wasHeld;
    const isHeld  = !!slot.kick;
    if (isHeld) slot.chargeAccum = Math.min(MAX_CHARGE, (slot.chargeAccum || 0) + dt);
    // Release edge — fires exactly once per press/release cycle.
    if (wasHeld && !isHeld) slot.released = true;
    slot.wasHeld = isHeld;
  }
  function updateChargeAI(collect, slot, dt) {
    if (collect.charge) {
      // Clamp accumulation so the AI can't ramp charge unbounded
      // across frames — runaway values blew past KICK_CHARGE_MAX.
      slot.chargeAccum = Math.min(MAX_CHARGE, (slot.chargeAccum || 0) + dt);
    }
  }

  function resolveInput(ctl, disableJump) {
    return {
      left:  !!ctl.left,
      right: !!ctl.right,
      jump:  !!ctl.jump && !disableJump,
      kick:  !!ctl.kick,
    };
  }

  // Restitution as a function of incidence angle. Head-on (cos≈0)
  // returns ~0.6; glancing skim (cos≈1) returns ~0.2 so the ball
  // skims along the wall instead of bouncing wildly.
  // Honors BALL_BOUNCE_WALL as a global multiplier to keep tunability.
  function wallRestitution(vx, vy, wall) {
    const speed = Math.hypot(vx, vy);
    if (speed < 1e-3) return 0;
    // Wall normal: 'horizontal' wall (top) → normal is vertical (vy);
    // 'vertical' wall (left/right) → normal is horizontal (vx).
    const cosTheta = wall === 'horizontal'
      ? Math.abs(vy) / speed   // angle of incidence relative to normal
      : Math.abs(vx) / speed;
    // cosTheta=1 → head-on; cosTheta=0 → grazing.
    // Per spec: 0.6 - 0.4 * |cos(angleOfIncidence)|, where
    // angleOfIncidence is measured from the surface (so cos is the
    // tangential component). Glancing skims yield ~0.2, head-ons ~0.6.
    const tangentialCos = wall === 'horizontal'
      ? Math.abs(vx) / speed
      : Math.abs(vy) / speed;
    const r = 0.6 - 0.4 * tangentialCos;
    return r * BALL_BOUNCE_WALL;
  }

  function collideBallPlayer(s, p) {
    const cx = p.x + P_W / 2, cy = p.y + P_H / 2;
    const halfW = P_W / 2, halfH = P_H / 2;
    const dx = s.ball.x - cx;
    const dy = s.ball.y - cy;
    const absX = Math.abs(dx) - halfW;
    const absY = Math.abs(dy) - halfH;
    if (absX < BALL_R && absY < BALL_R) {
      const penX = BALL_R - absX;
      const penY = BALL_R - absY;
      if (penX < penY) {
        s.ball.x += (dx > 0 ? penX : -penX);
        s.ball.vx = Math.sign(dx) * Math.max(220, Math.abs(s.ball.vx));
        s.ball.vx += p.vx * 0.3;
      } else {
        s.ball.y += (dy > 0 ? penY : -penY);
        if (dy < 0) {
          s.ball.vy = -Math.max(280, Math.abs(s.ball.vy));
          s.ball.vx += p.vx * 0.4 + p.facing * 70;
          // header
          emitHeader(s, s.ball.x, p.y + 6);
        } else {
          s.ball.vy = Math.sign(dy) * 140;
        }
      }
      listeners.onBounce?.();
    }
  }

  function emitKickBurst(s, x, y, dir, charge) {
    for (let i = 0; i < 6 + charge * 8; i++) {
      if (s.effects.length >= EFFECT_CAP) break;
      s.effects.push({
        kind:'spark', x, y,
        vx: dir * (40 + Math.random() * 160),
        vy: -60 - Math.random() * 140,
        life: 0.4 + Math.random() * 0.3,
        age: 0,
        color: '#ffe6a8',
      });
    }
  }
  function emitKickWhiff(s, x, y) {
    for (let i = 0; i < 4; i++) {
      if (s.effects.length >= EFFECT_CAP) break;
      s.effects.push({
        kind:'spark', x, y,
        vx: (Math.random() - 0.5) * 80,
        vy: -20 - Math.random() * 40,
        life: 0.25, age: 0,
        color: 'rgba(255,255,255,0.6)',
      });
    }
  }
  function emitBounce(s, x, y) {
    for (let i = 0; i < 4; i++) {
      if (s.effects.length >= EFFECT_CAP) break;
      s.effects.push({
        kind:'dust', x: x + (Math.random() - 0.5) * 18, y,
        vx: (Math.random() - 0.5) * 40,
        vy: -10 - Math.random() * 25,
        life: 0.35, age: 0,
        color: 'rgba(240,245,248,0.8)',
      });
    }
  }
  function emitHeader(s, x, y) {
    for (let i = 0; i < 5; i++) {
      if (s.effects.length >= EFFECT_CAP) break;
      s.effects.push({
        kind:'spark', x, y,
        vx: (Math.random() - 0.5) * 120,
        vy: -30 - Math.random() * 80,
        life: 0.28, age: 0,
        color: '#ffffff',
      });
    }
  }
  function emitPostHit(s, x, y) {
    for (let i = 0; i < 8; i++) {
      if (s.effects.length >= EFFECT_CAP) break;
      s.effects.push({
        kind:'ring', x, y,
        vx: 0, vy: 0,
        life: 0.45, age: 0,
        color: 'rgba(255,255,255,0.9)',
        r0: 4, r1: 40,
      });
    }
  }
  function emitGoalBurst(s, side) {
    const x = side === 'home' ? W - GOAL_W - 10 : GOAL_W + 10;
    for (let i = 0; i < 38; i++) {
      if (s.effects.length >= EFFECT_CAP) break;
      const ang = Math.random() * Math.PI * 2;
      const sp  = 80 + Math.random() * 260;
      s.effects.push({
        kind:'confetti',
        x, y: FLOOR - GOAL_H / 2,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 120,
        life: 0.9 + Math.random() * 0.6, age: 0,
        color: side === 'home' ? home.primary : away.primary,
        size: 3 + Math.random() * 3,
      });
    }
  }

  function decayEffects(dt) {
    for (let i = state.effects.length - 1; i >= 0; i--) {
      const e = state.effects[i];
      e.age += dt;
      e.x += (e.vx || 0) * dt;
      e.y += (e.vy || 0) * dt;
      e.vy += (e.kind === 'confetti' ? 480 : 320) * dt;
      e.vx *= 0.98;
      if (e.age >= e.life) state.effects.splice(i, 1);
    }
  }

  return api;
};

const makePlayer = (x, facing, color) => ({
  x, y: FLOOR - P_H,
  vx: 0, vy: 0,
  onGround: true,
  kickCd: 0, kickAnim: 0,
  facing,
  squash: 0,
  landing: 0,
  color,
});
