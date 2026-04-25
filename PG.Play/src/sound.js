// Tiny Web Audio synth layer. No samples — everything is procedural
// tones + noise, so the bundle stays small and the brand stays neutral.
// Each sound is a short (~120-600ms) envelope. Respects a mute flag
// persisted to localStorage; reflected by useSoundMute().

let ctx = null;
const LS_KEY = 'pd-sound-muted';

const muted = () => localStorage.getItem(LS_KEY) === '1';

const ensure = () => {
  if (muted()) return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

const envTone = (freq, duration = 0.18, type = 'sine', gain = 0.18) => {
  const c = ensure(); if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
};

const blip = (f0, f1, duration = 0.14, type = 'triangle', gain = 0.18) => {
  const c = ensure(); if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(f1, c.currentTime + duration);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
};

const noise = (duration = 0.14, gain = 0.08) => {
  const c = ensure(); if (!c) return;
  const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = gain;
  src.buffer = buffer;
  src.connect(g).connect(c.destination);
  src.start();
  src.stop(c.currentTime + duration + 0.02);
};

export const sfx = {
  click:    () => envTone(720, 0.07, 'square', 0.06),
  hover:    () => envTone(820, 0.035, 'triangle', 0.03),
  open:     () => blip(440, 880, 0.18, 'triangle', 0.10),
  confirm:  () => blip(540, 820, 0.22, 'sine', 0.14),
  win:      () => { blip(523, 784, 0.22, 'triangle', 0.16); setTimeout(() => blip(659, 988, 0.30, 'triangle', 0.16), 100); },
  lose:     () => { blip(440, 196, 0.35, 'sawtooth', 0.12); noise(0.12, 0.04); },
  achievement: () => {
    blip(660, 990, 0.22, 'triangle', 0.14);
    setTimeout(() => blip(880, 1320, 0.30, 'triangle', 0.14), 120);
  },
  shot:     () => { blip(320, 80, 0.07, 'sawtooth', 0.08); noise(0.05, 0.04); },
  // Goalbound cues
  kick:     () => { blip(220, 120, 0.06, 'square', 0.10); noise(0.05, 0.06); },
  bounce:   () => envTone(360, 0.05, 'triangle', 0.06),
  goal:     () => {
    blip(523, 784, 0.18, 'sawtooth', 0.14);
    setTimeout(() => blip(659, 988, 0.22, 'triangle', 0.14), 90);
    setTimeout(() => blip(784, 1175, 0.30, 'triangle', 0.14), 210);
  },
  whistle:  () => { blip(2400, 2600, 0.18, 'square', 0.08); setTimeout(() => blip(2400, 2200, 0.12, 'square', 0.06), 160); },
  save:     () => { envTone(180, 0.09, 'square', 0.1); noise(0.06, 0.06); },
  // Grudgewood: woody snap + low resonant tone for the axe-altar reveal.
  axeReveal: () => {
    blip(120, 80, 0.18, 'sawtooth', 0.10);
    setTimeout(() => { envTone(220, 0.12, 'triangle', 0.08); noise(0.08, 0.05); }, 90);
    setTimeout(() => blip(440, 660, 0.30, 'sine', 0.10), 220);
  },
  // Soft descending blip for "nothing found" / "couldn't load" UI signals.
  error:    () => blip(420, 220, 0.18, 'triangle', 0.08),
};

// Cross-game mute event bus. Per-game audio modules subscribe so the
// GameShell mute toggle (which calls setMuted here) reaches everyone.
const muteListeners = new Set();
export const subscribeMute = (cb) => {
  muteListeners.add(cb);
  return () => muteListeners.delete(cb);
};
export const setMuted = (yes) => {
  const next = !!yes;
  const prev = muted();
  if (next) localStorage.setItem(LS_KEY, '1');
  else localStorage.removeItem(LS_KEY);
  if (prev !== next) {
    muteListeners.forEach((cb) => { try { cb(next); } catch {} });
  }
};
export const isMuted = muted;
