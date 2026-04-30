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

// ── Frost Fight ambient bed ──────────────────────────────────
// Multi-layer pad with bell ostinato. Architecture:
//   bass drone     sub-octave + root sines, slight detune chorus
//   pad chord      minor-7th: root + b3 + 5 + b7, triangles,
//                  stereo-spread, gentle pitch wobble
//   bell ostinato  setInterval-driven sparse high notes every
//                  ~5.5 s — adds direction so the bed doesn't drone
//   delay line     slap-back at 340 ms, ~28 % feedback for spatial depth
//   low-pass       800-1100 Hz, modulated by a 0.07 Hz LFO for breath
//   master breath  0.2 Hz LFO on master gain, ±20 %
//
// Per-room key shifts the same chord shape. Maintains the existing
// API (start / stop / duck / mute-aware).

const ROOM_ROOTS = [
  523.25, // Pantry        C5
  440.00, // Cold Room     A4
  392.00, // The Aisle     G4
  466.16, // Walk-In       A♯4
  349.23, // Loading Dock  F4
  329.63, // Sub-Basement  E4
];

const FF_BASE_GAIN = 0.060;   // master target (was 0.045 — bumped to
                              // accommodate the busier graph without
                              // becoming louder per voice)

let _ff = null;        // active state
let _ffRoom = -1;      // last started room — re-keying calls stop() first

function _frostStop() {
  if (!_ff) return;
  const { ctx, master, oscs, lfos, bellInterval, unsubMute } = _ff;
  try {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.0001, t + 0.32);
    oscs.forEach((o) => { try { o.stop(t + 0.36); } catch { /* ignore */ } });
    lfos.forEach((l) => { try { l.stop(t + 0.36); } catch { /* ignore */ } });
  } catch { /* ignore */ }
  if (bellInterval) { try { clearInterval(bellInterval); } catch { /* ignore */ } }
  if (typeof unsubMute === 'function') { try { unsubMute(); } catch { /* ignore */ } }
  _ff = null;
  _ffRoom = -1;
}

function _frostStart(roomIdx) {
  if (muted()) return;
  if (_ff && _ffRoom === roomIdx) return;
  if (_ff) _frostStop();
  const c = ensure(); if (!c) return;

  const root = ROOM_ROOTS[roomIdx] ?? ROOM_ROOTS[0];
  const t0 = c.currentTime;

  // ── Master + post-processing chain ────────────────────────
  const master = c.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(FF_BASE_GAIN, t0 + 2.4);

  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(900, t0);

  // Slap-back delay for spatial depth — short feedback so the room
  // feels alive without smearing into reverb mush.
  const delay = c.createDelay(1.0);
  delay.delayTime.value = 0.34;
  const delayFb = c.createGain();
  delayFb.gain.value = 0.28;
  const delayWet = c.createGain();
  delayWet.gain.value = 0.22;

  master.connect(lp);
  lp.connect(c.destination);            // dry
  lp.connect(delay);
  delay.connect(delayFb);
  delayFb.connect(delay);                // feedback loop
  delay.connect(delayWet);
  delayWet.connect(c.destination);      // wet

  // ── Voices ────────────────────────────────────────────────
  const oscs = [];
  const lfos = [];
  const makeVoice = (freq, gain, type, pan = 0) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t0);
    const p = c.createStereoPanner();
    p.pan.value = pan;
    o.connect(g).connect(p).connect(master);
    o.start(t0);
    oscs.push(o);
    return o;
  };

  // Bass — sub-octave + root, slight detune chorus on the root.
  makeVoice(root * 0.5,    0.36, 'sine',     0.0);
  makeVoice(root,          0.30, 'sine',     0.0);
  makeVoice(root * 1.005,  0.14, 'triangle', -0.10);
  makeVoice(root * 0.995,  0.14, 'triangle',  0.10);

  // Pad chord — minor 7th: root + b3 + 5 + b7. The b3 + b7 land the
  // pad in cool / wistful territory, fitting a frozen-pantry mood.
  makeVoice(root * 1.20,   0.13, 'triangle', -0.28); // m3
  makeVoice(root * 1.50,   0.11, 'triangle',  0.28); // p5
  makeVoice(root * 1.78,   0.08, 'triangle',  0.0);  // m7

  // ── LFO 1: master breath ──────────────────────────────────
  const breathLfo = c.createOscillator();
  breathLfo.frequency.setValueAtTime(0.20, t0);
  const breathAmp = c.createGain();
  breathAmp.gain.setValueAtTime(0.012, t0); // ±20 % around base 0.06
  breathLfo.connect(breathAmp).connect(master.gain);
  breathLfo.start(t0);
  lfos.push(breathLfo);

  // ── LFO 2: low-pass sweep ─────────────────────────────────
  const filterLfo = c.createOscillator();
  filterLfo.frequency.setValueAtTime(0.07, t0);
  const filterAmp = c.createGain();
  filterAmp.gain.setValueAtTime(220, t0);   // 900 ± 220 Hz
  filterLfo.connect(filterAmp).connect(lp.frequency);
  filterLfo.start(t0);
  lfos.push(filterLfo);

  // ── Bell ostinato ─────────────────────────────────────────
  // Sparse high notes pinned to the chord. Pattern walks through a
  // 4-note cell (octave / m3 / p5 / 2-octave) so each pass feels
  // like a fresh phrase.
  const bellPattern = [
    root * 2.0,   // 1 (octave)
    root * 2.4,   // m3
    root * 3.0,   // 5
    root * 4.0,   // 2-octave
    root * 2.4,   // m3 (return)
    root * 3.0,   // 5
  ];
  let bellIdx = 0;
  const playBell = () => {
    if (!_ff || muted()) return;
    const tn = c.currentTime;
    const f = bellPattern[bellIdx % bellPattern.length];
    bellIdx++;
    // Two-oscillator bell: fundamental + slightly inharmonic 2x for
    // sparkle. ~1.7 s exponential decay.
    const harmonics = [
      { mul: 1.0,  type: 'sine',     gain: 0.13 },
      { mul: 2.01, type: 'triangle', gain: 0.05 },
    ];
    const pan = c.createStereoPanner();
    pan.pan.value = (Math.random() * 0.6) - 0.3;
    pan.connect(master);
    harmonics.forEach((h) => {
      const o = c.createOscillator();
      o.type = h.type;
      o.frequency.setValueAtTime(f * h.mul, tn);
      const g = c.createGain();
      g.gain.setValueAtTime(0, tn);
      g.gain.linearRampToValueAtTime(h.gain, tn + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, tn + 1.7);
      o.connect(g).connect(pan);
      o.start(tn);
      o.stop(tn + 1.8);
    });
  };
  // 5.5 s base interval with light jitter on the very first hit so
  // multiple rooms in one session don't all chime in lockstep.
  const firstHitDelay = 1500 + Math.random() * 2000;
  const bellInterval = setTimeout(() => {
    playBell();
    _ff && (_ff.bellInterval = setInterval(playBell, 5500));
  }, firstHitDelay);

  // Pause when the user toggles mute mid-game.
  const unsubMute = subscribeMute((isMute) => {
    if (isMute) _frostStop();
  });

  _ff = { ctx: c, master, oscs, lfos, bellInterval, unsubMute };
  _ffRoom = roomIdx;
}

function _frostDuck(durationSec = 0.6) {
  if (!_ff) return;
  const { ctx, master } = _ff;
  const t = ctx.currentTime;
  try {
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.005, t + 0.12);
    master.gain.linearRampToValueAtTime(FF_BASE_GAIN, t + durationSec);
  } catch { /* ignore */ }
}

export const frostMusic = {
  start: _frostStart,
  stop:  _frostStop,
  duck:  _frostDuck,
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
