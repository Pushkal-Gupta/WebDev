import '@testing-library/jest-dom/vitest';

// jsdom is missing a few APIs games reach for; stub them so mounts don't crash.
//
// Most games dereference the result of getContext('2d') immediately
// (ctx.fillStyle = ...; ctx.beginPath(); etc.). A null return crashes
// the mount instantly. We provide a stub 2D context that no-ops draw
// calls and returns plausible defaults from measurement APIs.
//
// WebGL is left as null on purpose — Three.js's WebGLRenderer cannot be
// faked from a stub context, and the few games that need real WebGL
// are explicitly skipped in the mount test.
function makeFake2DContext(canvas) {
  const noop = () => {};
  const stub = {
    canvas,
    // Mutable state — assigned to by every game.
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    filter: 'none',
    lineDashOffset: 0,
    // Path / draw — all no-ops.
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    rect: noop,
    arc: noop,
    arcTo: noop,
    ellipse: noop,
    bezierCurveTo: noop,
    quadraticCurveTo: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    strokeRect: noop,
    clearRect: noop,
    fillText: noop,
    strokeText: noop,
    drawImage: noop,
    putImageData: noop,
    setLineDash: noop,
    getLineDash: () => [],
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    transform: noop,
    setTransform: noop,
    resetTransform: noop,
    clip: noop,
    isPointInPath: () => false,
    isPointInStroke: () => false,
    measureText: () => ({ width: 0, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 0,
      actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0,
      fontBoundingBoxAscent: 0, fontBoundingBoxDescent: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createConicGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    createImageData: (w = 1, h = 1) => ({
      width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
    }),
    getImageData: (_x, _y, w = 1, h = 1) => ({
      width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
    }),
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    drawFocusIfNeeded: noop,
    scrollPathIntoView: noop,
    roundRect: noop,
  };
  return stub;
}

// Replace getContext entirely so our 2D stub is returned regardless of
// previous calls. The setup file runs once per worker before any test,
// so reassigning the prototype property is safe.
HTMLCanvasElement.prototype.getContext = function getContext(type) {
  if (type === '2d') {
    if (!this.__pgPlay2DCtx) this.__pgPlay2DCtx = makeFake2DContext(this);
    return this.__pgPlay2DCtx;
  }
  // 'webgl' / 'webgl2' / 'bitmaprenderer' / etc. — null forces the consumer
  // to bail out (or, for Three.js, throw — which the mount test catches
  // via skip).
  return null;
};

// Mock IntersectionObserver / ResizeObserver — not used by smoke tests but
// some imports check for them.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver ??= NoopObserver;
globalThis.ResizeObserver ??= NoopObserver;

// Match-media stub for prefers-reduced-motion checks during import.
if (!globalThis.matchMedia) {
  globalThis.matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
}

// Pointer-lock and fullscreen are referenced by a couple of action games
// during mount/setup; jsdom doesn't ship them. Optional-chained calls
// elsewhere are safe; these stubs cover the non-optional sites.
if (!('pointerLockElement' in document)) {
  Object.defineProperty(document, 'pointerLockElement', {
    configurable: true, get: () => null,
  });
}
if (!HTMLElement.prototype.requestPointerLock) {
  HTMLElement.prototype.requestPointerLock = function () {};
}
if (!document.exitPointerLock) {
  document.exitPointerLock = () => {};
}
if (!HTMLElement.prototype.requestFullscreen) {
  HTMLElement.prototype.requestFullscreen = function () { return Promise.resolve(); };
}
if (!document.exitFullscreen) {
  document.exitFullscreen = () => Promise.resolve();
}

// AudioContext — Three.js / synth code wraps this in try/catch but a
// no-op makes the mount cleaner and avoids spurious console warnings.
class FakeOscillator {
  constructor() {
    this.frequency = { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} };
    this.detune = { value: 0, setValueAtTime: () => {} };
    this.type = 'sine';
  }
  connect() { return this; }
  disconnect() {}
  start() {}
  stop() {}
  addEventListener() {}
}
class FakeGain {
  constructor() {
    this.gain = { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} };
  }
  connect() { return this; }
  disconnect() {}
}
class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
    this.sampleRate = 44100;
  }
  createOscillator() { return new FakeOscillator(); }
  createGain() { return new FakeGain(); }
  createBiquadFilter() {
    // Real BiquadFilterNode exposes frequency, detune, Q, and gain as
    // AudioParam-like objects. FakeGain only ships `gain`, which trips
    // games that twiddle `.frequency.value` (e.g. Swingwire's lowpass).
    const param = () => ({ value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} });
    const node = new FakeGain();
    node.frequency = param();
    node.detune    = param();
    node.Q         = param();
    node.type      = 'lowpass';
    return node;
  }
  createDelay() { return new FakeGain(); }
  createBuffer() { return { duration: 0, getChannelData: () => new Float32Array(0) }; }
  createBufferSource() { return new FakeOscillator(); }
  createDynamicsCompressor() { return new FakeGain(); }
  createStereoPanner() { return new FakeGain(); }
  createWaveShaper() { return new FakeGain(); }
  createAnalyser() { return Object.assign(new FakeGain(), { fftSize: 2048, getByteFrequencyData: () => {}, getByteTimeDomainData: () => {} }); }
  decodeAudioData() { return Promise.resolve({ duration: 0 }); }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}
if (!globalThis.AudioContext) globalThis.AudioContext = FakeAudioContext;
if (!globalThis.webkitAudioContext) globalThis.webkitAudioContext = FakeAudioContext;

// import.meta.env shim for src/supabase.js (which throws if missing).
import.meta.env.VITE_SUPABASE_URL = 'http://localhost:0';
import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
