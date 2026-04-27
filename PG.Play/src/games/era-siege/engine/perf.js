// Performance monitor. Tracks rolling frame time, exposes avg + p99.
// Used by the auto-low-effects detector and the ?perf debug overlay.

const SAMPLES = 60;             // rolling window
const LOWFX_THRESHOLD_MS = 22;  // mobile rolling avg above this → low-fx
const LOWFX_DETECT_WINDOW_MS = 3000;

export function makePerfMon({ deviceClass }) {
  const samples = new Array(SAMPLES).fill(16.67);
  let head = 0;
  let lastEvalAt = 0;
  let lowFx = false;
  let lowFxLatchedAt = 0;

  function record(dtSec) {
    const ms = dtSec * 1000;
    samples[head] = ms;
    head = (head + 1) % SAMPLES;
  }

  function avgMs() {
    let s = 0;
    for (let i = 0; i < SAMPLES; i++) s += samples[i];
    return s / SAMPLES;
  }

  function p99Ms() {
    const sorted = samples.slice().sort((a, b) => a - b);
    return sorted[Math.min(SAMPLES - 1, Math.floor(SAMPLES * 0.99))];
  }

  function evaluateLowFx(nowMs) {
    if (deviceClass !== 'mobile') return lowFx;
    if (nowMs - lastEvalAt < 250) return lowFx;
    lastEvalAt = nowMs;
    const a = avgMs();
    if (!lowFx && a > LOWFX_THRESHOLD_MS && nowMs - lowFxLatchedAt > LOWFX_DETECT_WINDOW_MS) {
      lowFx = true;
      lowFxLatchedAt = nowMs;
    }
    // Don't auto-disable once on — flicker between modes is worse than staying on.
    return lowFx;
  }

  function setLowFx(yes) { lowFx = !!yes; lowFxLatchedAt = performance.now(); }

  return { record, avgMs, p99Ms, evaluateLowFx, setLowFx, get lowFx() { return lowFx; } };
}

export function detectDeviceClass() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'desktop';
  const ua = (navigator.userAgent || '').toLowerCase();
  const isTouch = 'ontouchstart' in window;
  const isMobile = /(iphone|ipod|android.*mobile|windows phone|blackberry)/.test(ua);
  if (isMobile) return 'mobile';
  if (isTouch && window.innerWidth < 1100) return 'tablet';
  return 'desktop';
}
