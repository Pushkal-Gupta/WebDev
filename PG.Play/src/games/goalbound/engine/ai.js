// GOALBOUND — AI controller.
//
//   Simple state-machine AI. Every `reactTime` seconds it re-decides:
//     - target X position (where to stand / chase)
//     - whether to jump (contest aerial ball)
//     - whether to kick
//
//   Difficulty scales reaction time, aim noise, air-contest chance,
//   counter-press aggression, and mistake rate. Higher tiers read
//   preemptively; Casual wanders a beat behind the ball.

import { PHYSICS } from '../content.js';

const { P_W, P_H, FLOOR, KICK_RANGE, BALL_R, W } = PHYSICS;

export const createAI = (cfg, sideSign = -1) => {
  // sideSign: +1 for home (shouldn't happen — AI only opponent on bot mode), -1 for away.
  const state = { t: 0, action: null };

  // Compute a goal line to defend.
  const defendX = sideSign < 0 ? W - 90 : 90;

  const reset = () => { state.t = 0; state.action = null; };

  const decide = (s, me, ball) => {
    const ballHeadingToGoal = sideSign < 0 ? ball.vx > 80 : ball.vx < -80;
    const ballDist = Math.abs(ball.x - (me.x + P_W / 2));
    const ballAir  = ball.y < FLOOR - P_H - 8;

    const aimWobble = (Math.random() - 0.5) * cfg.aim * 90;

    // If ball is heading to my goal, intercept from behind.
    // Otherwise, reposition offensively near the ball.
    let goToX;
    if (ballHeadingToGoal) {
      goToX = sideSign < 0
        ? Math.max(me.x, Math.min(W - 96, ball.x - 24 + aimWobble))
        : Math.min(me.x, Math.max(96, ball.x + 24 + aimWobble));
    } else {
      goToX = sideSign < 0 ? ball.x + 22 + aimWobble : ball.x - 22 + aimWobble;
    }

    // Anti-frustration — small chance to hesitate / mis-position.
    if (Math.random() < cfg.mistakes) {
      goToX += (Math.random() - 0.5) * 120;
    }

    // If ball is behind me (closer to my goal than I am), chase back.
    if (sideSign < 0 && ball.x > me.x + P_W + 10 && ball.y > FLOOR - P_H - 4) {
      goToX = Math.min(W - 96, ball.x + 40);
    }

    const wantJump = ballAir && ballDist < 100 && me.onGround && Math.random() < cfg.contestAir;
    const wantKick = ballDist < KICK_RANGE + BALL_R + 6 &&
      (sideSign < 0 ? ball.x < me.x + P_W : ball.x > me.x);

    // Charge kick? AI holds briefly when ball is stationary-ish.
    const chargeMore = Math.abs(ball.vx) < 160 && Math.abs(ball.vy) < 160 && ballDist < KICK_RANGE + 10;

    return {
      goToX,
      jump: wantJump,
      kick: wantKick,
      chargeMore,
    };
  };

  const tick = (s, dt, me, ball, inject) => {
    state.t -= dt;
    if (state.t <= 0 || !state.action) {
      state.t = cfg.reactTime + Math.random() * 0.05;
      state.action = decide(s, me, ball);
    }
    const act = state.action;
    const center = me.x + P_W / 2;
    const dx = (act.goToX ?? center) - center;
    const wantLeft  = dx < -6;
    const wantRight = dx > 6;
    inject({
      left:  wantLeft,
      right: wantRight,
      jump:  act.jump,
      kick:  act.kick,
      charge: act.chargeMore && !act.kick,
    });
    // Aggression scales chase speed up to `cfg.chase`.
    me._aiChase = cfg.chase;
  };

  return { tick, reset };
};
