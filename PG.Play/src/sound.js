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

// Expose the audio-context factory + the mute predicate so per-game
// music modules (e.g. era-siege/engine/music.js) can boot their own
// synth beds without re-implementing the gate.
export const ensureCtx = ensure;
export { muted };

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
  // ── Hoop Shot ────────────────────────────────────────────────
  // Ball bounce — pitch and gain scale with impact strength (0..1).
  hoopBounce: (strength = 0.5) => {
    const s = Math.max(0, Math.min(1, strength));
    blip(240 + s * 200, 110, 0.07, 'sine', 0.04 + s * 0.07);
  },
  // Rim clang — short metallic ping over a falling body tone.
  hoopRim:    () => { envTone(2400, 0.04, 'square', 0.045); blip(440, 170, 0.13, 'triangle', 0.09); },
  // Backboard thud — woody square knock + pinch of noise.
  hoopBoard:  () => { blip(200, 95, 0.08, 'square', 0.09); noise(0.05, 0.04); },
  // Swish — soft net noise wash with a rising shimmer.
  hoopSwish:  () => {
    noise(0.16, 0.05);
    blip(880, 1320, 0.12, 'sine', 0.07);
    setTimeout(() => blip(1320, 1760, 0.10, 'sine', 0.05), 60);
  },
  // Streak-up — pitched per consecutive make so a run audibly climbs.
  hoopStreak: (k = 1) => {
    const f = 523 * Math.pow(1.122, Math.min(Math.max(1, k), 8));
    blip(f, f * 1.5, 0.12, 'triangle', 0.10);
  },
  // Fire-mode ignition — rising sawtooth roar + crackle + bright sting.
  hoopFire:   () => {
    blip(180, 880, 0.28, 'sawtooth', 0.10);
    noise(0.30, 0.06);
    setTimeout(() => blip(660, 1320, 0.22, 'triangle', 0.12), 130);
  },
  // End-of-run buzzer — flat detuned blare, arena style.
  hoopBuzzer: () => { envTone(178, 0.7, 'sawtooth', 0.13); envTone(183, 0.7, 'square', 0.07); },

  // ── Faceplant ────────────────────────────────────────────────
  // Landing thud — pitch and weight scale with impact strength (0..1).
  faceLand: (strength = 0.5) => {
    const s = Math.max(0, Math.min(1, strength));
    blip(140 + s * 110, 55, 0.09, 'sine', 0.05 + s * 0.09);
    noise(0.04 + s * 0.06, 0.03 + s * 0.05);
  },
  // Crash crunch — low sawtooth drop + noise burst, then a clatter tail
  // as the bike parts bounce away.
  faceCrash: () => {
    blip(220, 50, 0.30, 'sawtooth', 0.14);
    noise(0.22, 0.10);
    setTimeout(() => { blip(170, 70, 0.14, 'square', 0.08); noise(0.10, 0.05); }, 150);
    setTimeout(() => noise(0.08, 0.04), 330);
  },
  // Air whoosh — soft rising sine under a noise wash; fires once per jump.
  faceAir: () => { blip(280, 880, 0.34, 'sine', 0.045); noise(0.28, 0.025); },
  // Big-air landing reward — quick two-step bright sting.
  faceBigAir: () => {
    blip(660, 990, 0.12, 'triangle', 0.10);
    setTimeout(() => blip(880, 1320, 0.16, 'triangle', 0.10), 70);
  },
  // Finish fanfare — three rising notes + a pinch of crowd noise.
  faceWin: () => {
    blip(523, 659, 0.14, 'triangle', 0.12);
    setTimeout(() => blip(659, 784, 0.14, 'triangle', 0.12), 110);
    setTimeout(() => { blip(784, 1046, 0.30, 'triangle', 0.14); noise(0.20, 0.04); }, 220);
  },

  // ── Raycaster FPS ────────────────────────────────────────────
  // Fire — sharper crack than the generic shot, with a noise tail.
  fpsFire:  () => { blip(440, 70, 0.09, 'sawtooth', 0.10); noise(0.07, 0.06); },
  // Enemy hit (non-fatal) — short mid-range thunk.
  fpsHit:   () => blip(300, 170, 0.06, 'square', 0.08),
  // Enemy kill — low thud + descending growl.
  fpsKill:  () => { blip(190, 60, 0.16, 'sawtooth', 0.10); noise(0.10, 0.05); },
  // Player hurt — dissonant low buzz, throttled by the game loop.
  fpsHurt:  () => { blip(160, 90, 0.18, 'square', 0.09); noise(0.08, 0.04); },
  // Wave cleared — two-step rising sting, shorter than the full win.
  fpsWave:  () => { blip(523, 784, 0.14, 'triangle', 0.12); setTimeout(() => blip(659, 1046, 0.20, 'triangle', 0.12), 90); },
  // Dry fire — tiny mechanical click.
  fpsDry:   () => envTone(900, 0.04, 'square', 0.04),

  // ── Night Shift ──────────────────────────────────────────────
  // Footstep — dull floor tap; tiptoe variant is shorter and much quieter.
  nightStep: (soft = false) => {
    if (soft) { blip(150, 95, 0.04, 'sine', 0.020); return; }
    blip(205, 115, 0.06, 'sine', 0.055);
    noise(0.03, 0.015);
  },
  // Heartbeat — lub-dub of two low sine thumps; gain scales with tension
  // (0..1) so the pulse gets physically louder as the meter fills.
  nightHeart: (k = 0.5) => {
    const g = 0.05 + Math.max(0, Math.min(1, k)) * 0.07;
    blip(95, 58, 0.10, 'sine', g);
    setTimeout(() => blip(78, 52, 0.09, 'sine', g * 0.8), 140);
  },
  // Alert sting — sharp two-step square stab when a guard fully spots you.
  nightAlert: () => {
    blip(740, 1180, 0.10, 'square', 0.10);
    setTimeout(() => blip(1180, 880, 0.16, 'square', 0.08), 100);
  },
  // Loot collect — bright chime with a sparkle tail.
  nightCollect: () => {
    blip(1046, 1568, 0.09, 'triangle', 0.09);
    setTimeout(() => envTone(2093, 0.10, 'sine', 0.06), 55);
  },
  // Night clear — short three-note ascending fanfare, softer than the
  // full win sting (which only plays on the final night).
  nightClear: () => {
    blip(587, 784, 0.10, 'triangle', 0.10);
    setTimeout(() => blip(784, 988, 0.10, 'triangle', 0.10), 80);
    setTimeout(() => blip(988, 1318, 0.18, 'triangle', 0.11), 160);
  },

  // ── Eight Ball ───────────────────────────────────────────────
  // Cue strike — woody tap; pitch and gain ride the shot power (0..1).
  poolStrike: (p = 0.5) => {
    const k = Math.max(0, Math.min(1, p));
    blip(200 + k * 180, 70, 0.07, 'square', 0.05 + k * 0.09);
    noise(0.04 + k * 0.04, 0.02 + k * 0.05);
  },
  // Ball-ball clack — bright phenolic click, scaled by impact speed (0..1).
  poolClack: (s = 0.5) => {
    const k = Math.max(0, Math.min(1, s));
    envTone(1700 + k * 900, 0.03, 'square', 0.015 + k * 0.05);
    blip(420 + k * 360, 180, 0.05, 'triangle', 0.02 + k * 0.07);
  },
  // Cushion thunk — low rubbery knock, scaled by approach speed (0..1).
  poolRail: (s = 0.5) => {
    const k = Math.max(0, Math.min(1, s));
    blip(170 + k * 90, 70, 0.07, 'square', 0.03 + k * 0.05);
  },
  // Pocket drop — hollow descending plop + leather thud.
  poolPocket: () => {
    blip(340, 120, 0.10, 'sine', 0.10);
    setTimeout(() => { envTone(150, 0.12, 'sine', 0.08); noise(0.06, 0.03); }, 70);
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
// Calm, slowly-modulating pad. No bell ostinato — the previous build's
// ringing high notes every 5.5 s were the loudest source of fatigue.
// Architecture (Phase 17 rewrite):
//   sub bass       sub-octave + root sines, slight detune for body
//   pad chord      i (minor) ↔ VI (major-relative) crossfade every 16 s
//                  via two triangle voicings on a slow LFO
//   air bed        deeply-LP-filtered noise for "winter air" texture
//   reverb tail    longer, lower-feedback delay for spatial depth (no
//                  slap-back metallic flutter)
//   low-pass       650-820 Hz, very slow (0.04 Hz) and shallow sweep
//   master breath  removed — was too noticeable at 0.2 Hz
//
// Per-room root rotates through a small modal palette. Maintains the
// existing API (start / stop / duck / mute-aware).

const ROOM_ROOTS = [
  // Lower roots than the previous build (was C5/A4 region) — sits
  // under the FX so it doesn't compete for attention. Span an octave
  // so consecutive rooms feel distinct without being abrasive.
  220.00, // 0  A3
  207.65, // 1  G♯3
  196.00, // 2  G3
  185.00, // 3  F♯3
  174.61, // 4  F3
  164.81, // 5  E3
  155.56, // 6  D♯3
  146.83, // 7  D3
  138.59, // 8  C♯3
  130.81, // 9  C3
  220.00, // 10 — restart the cycle for newer rooms
  207.65, 196.00, 185.00, 174.61, 164.81, 155.56, 146.83, 138.59, 130.81,
  123.47, 116.54,
];

const FF_BASE_GAIN = 0.040;   // sit lower as bed; the previous 0.060
                              // pushed past "ambient" into "foreground"

let _ff = null;        // active state
let _ffRoom = -1;      // last started room — re-keying calls stop() first

function _frostStop() {
  if (!_ff) return;
  const { ctx, master, oscs, lfos, noise, unsubMute } = _ff;
  try {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    oscs.forEach((o) => { try { o.stop(t + 0.7); } catch { /* ignore */ } });
    lfos.forEach((l) => { try { l.stop(t + 0.7); } catch { /* ignore */ } });
    if (noise) { try { noise.stop(t + 0.7); } catch { /* ignore */ } }
  } catch { /* ignore */ }
  if (typeof unsubMute === 'function') { try { unsubMute(); } catch { /* ignore */ } }
  _ff = null;
  _ffRoom = -1;
}

function _frostStart(roomIdx) {
  if (muted()) return;
  if (_ff && _ffRoom === roomIdx) return;
  if (_ff) _frostStop();
  const c = ensure(); if (!c) return;
  // jsdom's Web Audio shim returns AudioParam-less nodes for createDelay; bail
  // gracefully so test runs don't surface unhandled rejections.
  try {
    const probe = c.createDelay && c.createDelay(0.5);
    if (!probe || !probe.delayTime || typeof probe.delayTime.value !== 'number') return;
  } catch { return; }

  const root = ROOM_ROOTS[roomIdx] ?? ROOM_ROOTS[0];
  const t0 = c.currentTime;

  // ── Master + post-processing chain ────────────────────────
  // Two-stage low-pass keeps highs gentle without sounding muffled.
  // No master breath LFO — it was the second-most fatiguing element
  // after the bell. Slow shallow filter sweep does the breathing now.
  const master = c.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(FF_BASE_GAIN, t0 + 4.0);

  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.5;
  lp.frequency.setValueAtTime(740, t0);

  // Long, low-feedback delay → diffuse tail rather than slap-back
  // metallic flutter. 0.62 s + 18 % feedback ≈ a faint hall.
  const delay = c.createDelay(1.5);
  delay.delayTime.value = 0.62;
  const delayFb = c.createGain();
  delayFb.gain.value = 0.18;
  const delayWet = c.createGain();
  delayWet.gain.value = 0.16;

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
  const makeVoice = (freq, gain, type, pan = 0, t = t0) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    const p = c.createStereoPanner();
    p.pan.value = pan;
    o.connect(g).connect(p).connect(master);
    o.start(t);
    oscs.push(o);
    return { osc: o, gain: g };
  };

  // Sub bass — sub-octave + root, very slight detune chorus.
  // Lower gain than before since the new ROOM_ROOTS already sit in
  // the bass register; doubling the energy here would muddy the mix.
  makeVoice(root * 0.5,    0.22, 'sine',      0.0);
  makeVoice(root,          0.18, 'sine',      0.0);
  makeVoice(root * 1.004,  0.07, 'triangle', -0.12);
  makeVoice(root * 0.996,  0.07, 'triangle',  0.12);

  // Pad chord A — minor (i): root + m3 + p5 + m7
  // Pad chord B — relative major (VI): root*1.6 + m3*1.6 + p5*1.6 + m7*1.6
  // We crossfade A and B every 16 s via two opposing-phase LFOs on
  // their gain nodes. Result: the harmony slowly modulates instead
  // of holding a single static minor 7th the whole way through.
  const padGain = 0.085;
  const chordA = [
    makeVoice(root * 1.20,  padGain * 1.0,  'triangle', -0.28),  // m3
    makeVoice(root * 1.50,  padGain * 0.85, 'triangle',  0.28),  // p5
    makeVoice(root * 1.78,  padGain * 0.6,  'triangle',  0.0),   // m7
  ];
  const chordB = [
    makeVoice(root * 1.6,   padGain * 1.0,  'triangle', -0.22),  // VI root
    makeVoice(root * 2.0,   padGain * 0.85, 'triangle',  0.22),  // VI m3
    makeVoice(root * 2.4,   padGain * 0.6,  'triangle',  0.0),   // VI p5
  ];
  // Initial state: A audible, B muted. The crossfade LFO will
  // animate them once it starts.
  chordB.forEach((v) => v.gain.gain.setValueAtTime(0, t0));

  // ── LFO 1: chord A/B crossfade ────────────────────────────
  // 0.03125 Hz = 32 s period (16 s per swap). A custom DC offset on
  // each chord's gain is what gives the audible motion — the LFO
  // adds and subtracts equally so total gain stays balanced.
  const xfadeFreq = 0.03125;
  const xfadeLfoA = c.createOscillator();
  xfadeLfoA.frequency.setValueAtTime(xfadeFreq, t0);
  const xfadeAmpA = c.createGain();
  xfadeAmpA.gain.setValueAtTime(padGain * 0.5, t0);
  chordA.forEach((v) => xfadeAmpA.connect(v.gain.gain));
  xfadeLfoA.connect(xfadeAmpA);
  xfadeLfoA.start(t0);
  lfos.push(xfadeLfoA);

  const xfadeLfoB = c.createOscillator();
  xfadeLfoB.frequency.setValueAtTime(xfadeFreq, t0);
  // Phase-invert by using a -1 multiplier
  const xfadeAmpB = c.createGain();
  xfadeAmpB.gain.setValueAtTime(-padGain * 0.5, t0);
  chordB.forEach((v) => xfadeAmpB.connect(v.gain.gain));
  xfadeLfoB.connect(xfadeAmpB);
  xfadeLfoB.start(t0);
  lfos.push(xfadeLfoB);

  // ── LFO 2: very slow shallow filter sweep ─────────────────
  // 0.04 Hz = 25 s period; 90 Hz amplitude → cutoff 650-830 Hz.
  // Replaces the old master-breath LFO + steeper filter sweep.
  const filterLfo = c.createOscillator();
  filterLfo.frequency.setValueAtTime(0.04, t0);
  const filterAmp = c.createGain();
  filterAmp.gain.setValueAtTime(90, t0);
  filterLfo.connect(filterAmp).connect(lp.frequency);
  filterLfo.start(t0);
  lfos.push(filterLfo);

  // ── Air bed: heavily-LP-filtered noise ────────────────────
  // 1 s of pre-rolled white noise played as a looping buffer source,
  // pushed through a 220 Hz lowpass + tiny gain → "winter air"
  // texture under the pad. Inaudible as a discrete source; you only
  // notice it when it stops.
  let noise = null;
  try {
    const sr = c.sampleRate;
    const buf = c.createBuffer(1, sr * 1.0, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    noise = c.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const noiseLp = c.createBiquadFilter();
    noiseLp.type = 'lowpass';
    noiseLp.Q.value = 0.4;
    noiseLp.frequency.setValueAtTime(220, t0);
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0, t0);
    noiseGain.gain.linearRampToValueAtTime(0.020, t0 + 4.0);
    noise.connect(noiseLp).connect(noiseGain).connect(master);
    noise.start(t0);
  } catch {
    noise = null;
  }

  // Pause when the user toggles mute mid-game.
  const unsubMute = subscribeMute((isMute) => {
    if (isMute) _frostStop();
  });

  _ff = { ctx: c, master, oscs, lfos, noise, unsubMute };
  _ffRoom = roomIdx;
}

function _frostDuck(durationSec = 0.6) {
  if (!_ff) return;
  const { ctx, master } = _ff;
  const t = ctx.currentTime;
  try {
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(FF_BASE_GAIN * 0.08, t + 0.12);
    master.gain.linearRampToValueAtTime(FF_BASE_GAIN, t + Math.max(durationSec, 0.4));
  } catch { /* ignore */ }
}

// ── HTML5-audio bed (preferred) ────────────────────────────────
// Tries a real ambient music file first, falls back to the synth bed
// above. The audio file is expected at the path below; if it 404s or
// fails to play, we silently fall back to the synth bed so playback
// never goes silent.
//
// Drop the file at:   public/games/frost-fight/audio/bed.mp3
// (Recommended: a CC0 / public-domain ambient loop, ~30-90s. The first
// successful play triggers the real bed; subsequent rooms re-key by
// nudging playbackRate slightly so each room feels distinct without
// needing a dedicated track per room.)

const FF_BED_URLS = [
  // Vite serves /public/* at the root, so this resolves to
  // /games/frost-fight/audio/bed.mp3 in dev and dist builds. Phase
  // 22d: the in-game bed is bgm.mp3 (the user's preferred short loop
  // for gameplay). The home page uses a different track (Soft Game
  // Drift) with its own loop-window clamp.
  './games/frost-fight/audio/bed.mp3',
];
// Phase 22e — user requested +150% on top of 0.08 → 0.20. Still well
// below SFX so it stays a bed, just more present.
const FF_HTML5_GAIN = 0.20;
let _ffEl = null;               // HTMLAudioElement
let _ffElTested = false;        // we've already probed availability
let _ffElAvailable = false;     // probe result
let _ffElPlaying = false;
let _ffElUnsubMute = null;

async function _probeBed() {
  if (_ffElTested) return _ffElAvailable;
  _ffElTested = true;
  try {
    for (const url of FF_BED_URLS) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          _ffElAvailable = true;
          _ffElUrl = url;
          return true;
        }
      } catch { /* try next */ }
    }
  } catch { /* ignore */ }
  _ffElAvailable = false;
  return false;
}

let _ffElUrl = null;

function _frostHtml5Stop() {
  if (!_ffEl) return;
  try { _ffEl.pause(); } catch { /* ignore */ }
  if (_ffElUnsubMute) { try { _ffElUnsubMute(); } catch { /* ignore */ } _ffElUnsubMute = null; }
  _ffElPlaying = false;
}

function _frostHtml5Start(roomIdx) {
  if (muted()) return false;
  if (!_ffEl) {
    try {
      _ffEl = new Audio(_ffElUrl);
      // bgm.mp3 is already a short clean loop; just let the native
      // HTML5 loop attribute handle the seam.
      _ffEl.loop = true;
      _ffEl.volume = 0;
      _ffEl.preload = 'auto';
    } catch { return false; }
  }
  // Per-room rate nudge so each room feels distinct without separate files.
  // Range 0.92 .. 1.08 across the 22 rooms.
  const room = Math.max(0, roomIdx | 0);
  const phase = (room % 8) / 8;                 // 0..0.875
  _ffEl.playbackRate = 0.92 + phase * 0.16;
  // Fade in to FF_HTML5_GAIN over ~1.6s. We can't schedule volume on
  // the HTMLAudioElement, so step it on a short timer.
  const start = performance.now();
  const fadeMs = 1600;
  const tick = () => {
    if (!_ffEl || !_ffElPlaying) return;
    const t = Math.min(1, (performance.now() - start) / fadeMs);
    _ffEl.volume = FF_HTML5_GAIN * t;
    if (t < 1) requestAnimationFrame(tick);
  };
  const playPromise = _ffEl.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.then(() => { _ffElPlaying = true; requestAnimationFrame(tick); })
      .catch(() => { _ffElAvailable = false; _ffElPlaying = false; });
  } else {
    _ffElPlaying = true;
    requestAnimationFrame(tick);
  }
  if (!_ffElUnsubMute) {
    _ffElUnsubMute = subscribeMute((isMute) => {
      if (isMute) _frostHtml5Stop();
    });
  }
  return true;
}

function _frostHtml5Duck(durationSec = 0.6) {
  if (!_ffEl || !_ffElPlaying) return;
  // Quick attenuate, gradual restore. Mirrors the synth duck behaviour.
  const ductMs = 120;
  const restoreMs = Math.max(120, durationSec * 1000);
  const startVol = _ffEl.volume;
  const duckTarget = Math.max(0.04, startVol * 0.18);
  const duckStart = performance.now();
  const duckTick = () => {
    if (!_ffEl || !_ffElPlaying) return;
    const t = Math.min(1, (performance.now() - duckStart) / ductMs);
    _ffEl.volume = startVol + (duckTarget - startVol) * t;
    if (t < 1) requestAnimationFrame(duckTick);
    else {
      const restoreStart = performance.now();
      const restoreTick = () => {
        if (!_ffEl || !_ffElPlaying) return;
        const u = Math.min(1, (performance.now() - restoreStart) / restoreMs);
        _ffEl.volume = duckTarget + (FF_HTML5_GAIN - duckTarget) * u;
        if (u < 1) requestAnimationFrame(restoreTick);
      };
      requestAnimationFrame(restoreTick);
    }
  };
  requestAnimationFrame(duckTick);
}

// Public dispatcher: prefer HTML5 file when available, otherwise synth.
async function _frostStartDispatch(roomIdx) {
  const ok = await _probeBed();
  if (ok && _frostHtml5Start(roomIdx)) {
    if (_ff) _frostStop();           // make sure the synth isn't double-playing
    return;
  }
  _frostStart(roomIdx);
}
function _frostStopDispatch() {
  _frostHtml5Stop();
  _frostStop();
}
function _frostDuckDispatch(durationSec) {
  if (_ffElPlaying) _frostHtml5Duck(durationSec);
  else _frostDuck(durationSec);
}

export const frostMusic = {
  start: _frostStartDispatch,
  stop:  _frostStopDispatch,
  duck:  _frostDuckDispatch,
};

// ── Home-page ambient bed (Phase 22) ───────────────────────────────
// Plays a clean middle slice of `public/audio/home-bed.mp3` on loop.
// The user's source track has rough sections at the head and tail
// (slate marker, gear noise, and a louder coda after ~45 s), so we
// hard-clamp playback to the [HOME_BED_LOOP_START, HOME_BED_LOOP_END]
// window. The seek is jitter-free because we drive it from the
// `timeupdate` event (which fires ~4×/sec on most engines) rather
// than a frame-rate loop.
const HOME_BED_URL = './audio/home-bed.mp3';
const HOME_BED_LOOP_START = 4;    // seconds — skip slate/lead-in
const HOME_BED_LOOP_END   = 45;   // seconds — clamp before the loud tail
const HOME_BED_GAIN       = 0.15; // +150% of the prior 0.06 — soft but audible
let _homeEl = null;
let _homePlaying = false;
let _homeUnsubMute = null;
let _homeTested = false;
let _homeAvailable = false;
// Sticky "stop was requested" flag. _homeStart awaits a HEAD probe and
// has to construct the Audio element before it can call pause(); if
// _homeStop runs in that window (the common case when a click both
// starts the bed and immediately navigates to a game route) it'd
// previously no-op because _homeEl was still null. The flag survives
// across the async boundaries so a started-but-not-yet-playing bed
// gets cancelled the moment it has anything to cancel.
let _homeAbort = false;

async function _homeProbe() {
  if (_homeTested) return _homeAvailable;
  _homeTested = true;
  try {
    const res = await fetch(HOME_BED_URL, { method: 'HEAD' });
    _homeAvailable = res.ok;
  } catch { _homeAvailable = false; }
  return _homeAvailable;
}

async function _homeStart() {
  _homeAbort = false;
  if (muted()) return;
  if (!(await _homeProbe())) return;
  if (_homeAbort) return;
  if (!_homeEl) {
    try {
      _homeEl = new Audio(HOME_BED_URL);
      _homeEl.preload = 'auto';
      _homeEl.volume = 0;
      // Start at the loop start (skip the rough lead-in). canplay fires
      // the moment enough buffer is available; we set currentTime then
      // so the seek lands instantly when play() resolves.
      _homeEl.addEventListener('canplay', () => {
        if (_homeEl && _homeEl.currentTime < HOME_BED_LOOP_START) {
          _homeEl.currentTime = HOME_BED_LOOP_START;
        }
      }, { once: true });
      // Snap back to the loop start before the source's loud tail. The
      // jump is essentially a hard loop; the gain is so low (0.06)
      // that the seam is inaudible.
      _homeEl.addEventListener('timeupdate', () => {
        if (!_homeEl) return;
        if (_homeEl.currentTime >= HOME_BED_LOOP_END) {
          _homeEl.currentTime = HOME_BED_LOOP_START;
        }
      });
    } catch { return; }
  }
  if (_homeAbort) return;
  // Fade in over ~2 s so it doesn't pop in.
  const start = performance.now();
  const fadeMs = 2000;
  const tick = () => {
    if (!_homeEl || !_homePlaying || _homeAbort) return;
    const t = Math.min(1, (performance.now() - start) / fadeMs);
    _homeEl.volume = HOME_BED_GAIN * t;
    if (t < 1) requestAnimationFrame(tick);
  };
  const playPromise = _homeEl.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.then(() => {
      // Race guard: if _homeStop ran between play() and this resolve,
      // either the element is paused or _homeAbort is set. In either
      // case we MUST NOT restart the fade-in tick (which would set
      // _homePlaying = true and re-mix the home bed under whatever
      // game audio is playing) — and we also explicitly pause + zero
      // volume so a play() that landed after our stop() can't keep
      // bleeding through.
      if (!_homeEl || _homeEl.paused || _homeAbort) {
        try { _homeEl?.pause(); } catch { /* ignore */ }
        try { if (_homeEl) _homeEl.volume = 0; } catch { /* ignore */ }
        _homePlaying = false;
        return;
      }
      _homePlaying = true;
      requestAnimationFrame(tick);
    }).catch(() => { _homePlaying = false; _homeAvailable = false; });
  } else {
    _homePlaying = true;
    requestAnimationFrame(tick);
  }
  if (!_homeUnsubMute) {
    _homeUnsubMute = subscribeMute((isMute) => {
      if (isMute) _homeStop();
    });
  }
}

function _homeStop() {
  // Mark abort first so any in-flight _homeStart bails at its next
  // checkpoint — stop() ran while _homeEl was still null is the most
  // common stuck-music case.
  _homeAbort = true;
  if (_homeUnsubMute) {
    try { _homeUnsubMute(); } catch { /* ignore */ }
    _homeUnsubMute = null;
  }
  if (!_homeEl) {
    _homePlaying = false;
    return;
  }
  // Pause + zero volume so even if a stale play() promise tries to
  // restart playback (race with React unmount cleanup) it can't be
  // heard. The home Audio element is reused across mounts so we keep
  // it allocated; only the playback state is cleared.
  try { _homeEl.pause(); } catch { /* ignore */ }
  try { _homeEl.volume = 0; } catch { /* ignore */ }
  _homePlaying = false;
}

export const homeMusic = {
  start: _homeStart,
  stop:  _homeStop,
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
