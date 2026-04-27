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

  // ── per-game stingers ─────────────────────────────────────────
  // Coil: pellet pickup — bright two-tone chirp that rises
  pellet:   () => { blip(880, 1320, 0.06, 'sine', 0.06); setTimeout(() => blip(1320, 1760, 0.05, 'sine', 0.04), 30); },

  // Bricklands: coin pickup — clean bell tone, classic platformer feel
  coin:     () => { blip(1568, 2093, 0.10, 'sine', 0.08); setTimeout(() => envTone(2349, 0.08, 'sine', 0.06), 40); },

  // Bricklands: stomp — soft thud + small pop
  stomp:    () => { blip(220, 90, 0.10, 'sine', 0.10); setTimeout(() => envTone(440, 0.04, 'triangle', 0.05), 30); },

  // Slipshot: reload — mechanical click-click
  reload:   () => { envTone(1200, 0.04, 'square', 0.05); setTimeout(() => envTone(900, 0.04, 'square', 0.05), 60); setTimeout(() => envTone(1500, 0.05, 'square', 0.06), 140); },

  // Grudgewood: branch creak — slow falling sawtooth + noise
  branchCreak: () => { blip(280, 140, 0.42, 'sawtooth', 0.06); noise(0.30, 0.03); },

  // Goalbound: crowd cheer — short noise wash with a sweep
  cheer:    () => { noise(0.35, 0.05); setTimeout(() => blip(440, 880, 0.20, 'triangle', 0.08), 50); },

  // Star pickup (Bricklands optional, also generic) — sparkle ascending
  star:     () => {
    blip(1318, 1760, 0.10, 'triangle', 0.08);
    setTimeout(() => blip(1760, 2349, 0.10, 'triangle', 0.08), 60);
    setTimeout(() => blip(2349, 2794, 0.14, 'triangle', 0.08), 120);
  },

  // ── Frost Fight ──────────────────────────────────────────────
  // Tile step — ultra-short tap, intentionally below the threshold of
  // attention so a held direction doesn't fatigue.
  frostStep:   () => envTone(420, 0.025, 'triangle', 0.025),
  // Freeze — short crystal shimmer (rising blip + pinch of noise).
  frostFreeze: () => { blip(880, 1480, 0.10, 'triangle', 0.07); noise(0.06, 0.025); },
  // Melt — softer descending wisp.
  frostMelt:   () => { blip(960, 480, 0.14, 'sine', 0.06); noise(0.04, 0.018); },
  // Fruit pickup — bright two-step chirp.
  frostFruit:  () => { blip(880, 1320, 0.07, 'triangle', 0.08); setTimeout(() => envTone(1760, 0.06, 'sine', 0.06), 40); },
  // Death — low descending sweep + noise burst.
  frostDeath:  () => { blip(420, 110, 0.32, 'sawtooth', 0.10); noise(0.18, 0.05); },
  // Room clear — three-note ascending chime, shorter than the full win.
  frostClear:  () => {
    blip(660, 880, 0.10, 'triangle', 0.10);
    setTimeout(() => blip(880, 1100, 0.10, 'triangle', 0.10), 70);
    setTimeout(() => blip(1100, 1480, 0.16, 'triangle', 0.10), 140);
  },
  // Room intro sting — a soft minor-third pad that rises and falls,
  // pitched per-room so each level entrance has its own tonal hint.
  // Roots: Pantry C5, Cold Room A4, The Aisle G4 — each minor-third
  // chord plays root + minor-3rd + 5th simultaneously, fading in/out.
  frostIntro:  (roomIdx = 0) => {
    const c = ensure(); if (!c) return;
    const roots = [523.25, 440.00, 392.00]; // C5 / A4 / G4
    const root = roots[Math.min(roomIdx, roots.length - 1)] || roots[0];
    const notes = [root, root * 1.2, root * 1.5]; // root, minor 3rd, perfect 5th
    const t0 = c.currentTime;
    const dur = 0.75;
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.05, t0 + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  },
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
