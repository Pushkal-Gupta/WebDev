// Snip — ambient music bed. One slow detuned pad per world, generated
// procedurally on the shared platform AudioContext. No sample assets;
// the bundle stays small and the audio never feels stock.
//
// Each "bed" is a triad of low oscillators with a slow gain LFO so the
// pad breathes. We keep one instance alive at a time (start/stop swaps);
// fades are 1.0s so transitions never click.

import { ensureCtx, muted } from '../../sound.js';

const FADE = 1.0;          // seconds — both attack on start and release on stop
const BASE_GAIN = 0.035;   // floor of the LFO sweep (very quiet — it's a bed)
const PEAK_GAIN = 0.055;
const LFO_RATE  = 0.10;    // Hz — full breath every 10 seconds

// Each pad is described by a tonic Hz and an interval pattern (in
// semitone offsets) that builds the chord. Hz values are tuned ~3 octaves
// below "lead" range so the pad sits under the SFX without masking it.
//
// sweet  → C major triad   (C3, E3, G3)  : warm, friendly
// green  → A major triad   (A2, C#3, E3) : open, airy
// work   → F minor triad   (F2, G#2, C3) : darker, mechanical
const PADS = {
  sweet: { tonic: 130.81, intervals: [0, 4, 7], waveform: 'sine'      },
  green: { tonic: 110.00, intervals: [0, 4, 7], waveform: 'triangle'  },
  work:  { tonic:  87.31, intervals: [0, 3, 7], waveform: 'sine'      },
};

let active = null;   // { ctx, master, voices: [{osc,gain}], lfo, lfoGain, fading }

export function startBed(theme) {
  if (muted()) return;
  const c = ensureCtx();
  if (!c) return;
  // Same theme already running? leave it.
  if (active && active.theme === theme && !active.fading) return;
  // Different theme running — fade it out first, then start the new one.
  if (active) stopBed(/* immediate */ false);

  const pad = PADS[theme] || PADS.sweet;
  const master = c.createGain();
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(BASE_GAIN, c.currentTime + FADE);
  master.connect(c.destination);

  // LFO multiplies the master gain on top of the fade-in floor.
  const lfo = c.createOscillator();
  lfo.frequency.value = LFO_RATE;
  const lfoGain = c.createGain();
  lfoGain.gain.value = (PEAK_GAIN - BASE_GAIN) * 0.5;
  lfo.connect(lfoGain).connect(master.gain);
  lfo.start();

  // Voices: one osc per chord interval, with a slightly detuned partner
  // so the pad has movement without sounding like a pure sine.
  const voices = [];
  for (const semi of pad.intervals) {
    const f = pad.tonic * Math.pow(2, semi / 12);
    const g = c.createGain();
    g.gain.value = 0.55;
    g.connect(master);
    const oscA = c.createOscillator(); oscA.type = pad.waveform; oscA.frequency.value = f;
    const oscB = c.createOscillator(); oscB.type = pad.waveform; oscB.frequency.value = f * 1.005; // ~+8 cents
    oscA.connect(g); oscB.connect(g);
    oscA.start(); oscB.start();
    voices.push({ oscA, oscB, g });
  }
  active = { ctx: c, theme, master, voices, lfo, lfoGain, fading: false };
}

export function stopBed(immediate = false) {
  if (!active) return;
  const cur = active;
  cur.fading = true;
  const now = cur.ctx.currentTime;
  const release = immediate ? 0.05 : FADE;
  try {
    cur.master.gain.cancelScheduledValues(now);
    cur.master.gain.setValueAtTime(cur.master.gain.value || BASE_GAIN, now);
    cur.master.gain.linearRampToValueAtTime(0.0001, now + release);
  } catch { /* context may have closed */ }
  setTimeout(() => {
    try {
      for (const v of cur.voices) { v.oscA.stop(); v.oscB.stop(); }
      cur.lfo.stop();
      cur.master.disconnect();
    } catch { /* already torn down */ }
  }, release * 1000 + 60);
  if (active === cur) active = null;
}

// Cheap check that the platform's mute flag may have flipped since we
// started the bed — caller passes the world theme on each level load
// and we re-apply mute state.
export function syncMute(theme) {
  if (muted()) stopBed(true);
  else if (!active && theme) startBed(theme);
}
