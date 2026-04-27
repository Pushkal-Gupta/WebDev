// RAF loop for Era Siege. Drives the sim via tick(), then renders.
// Auto-pauses on tab hidden. Manual pause supported via getPaused().
// Speed multiplier supported via getSpeed() (1 or 2; applied as a dt
// scalar so the fixed-step accumulator handles the extra steps).
// Cleans up on stop().

import { tick } from '../sim/world.js';

export function startLoop({ getMatch, getIntents, render, onFrame, getPaused, getSpeed }) {
  let raf = 0;
  let lastTime = performance.now();
  let stopped = false;
  let pausedByVisibility = false;

  const onVis = () => {
    if (document.visibilityState === 'hidden') {
      pausedByVisibility = true;
    } else {
      pausedByVisibility = false;
      lastTime = performance.now();   // avoid catch-up after a long hide
    }
  };
  document.addEventListener('visibilitychange', onVis);

  const frame = () => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    let dt = (now - lastTime) / 1000;
    lastTime = now;

    const manualPaused = !!getPaused?.();
    const match = getMatch();
    if (!pausedByVisibility && !manualPaused && match) {
      const intents = getIntents();
      const speed = Math.max(1, Math.min(4, getSpeed?.() || 1));
      tick(match, dt * speed, intents);
    } else if (match) {
      // Still render when paused so the canvas reflects current state.
      // Don't drain intents while paused — they queue for resume.
      dt = 0;
    }
    if (match) render(match, dt);
    onFrame?.(dt);
  };
  raf = requestAnimationFrame(frame);

  return function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVis);
  };
}
