// Snip — bespoke audio identity. Every cue is procedurally synthesised
// off the shared platform AudioContext (no sample assets), so the bundle
// stays tiny but each event sounds intentional rather than borrowed
// from the platform's generic UI bus. Mute is honoured via `muted()`.
//
// Sounds:
//   ropeCut    : short noise burst with a high-pass-ish tail — reads as "snip"
//   bubblePop  : down-sweep blip with a soft pluck
//   starGet    : ascending tone, brighter each consecutive star this level
//   targetChomp: low warm punch + body thud
//   levelClear : 3-note arpeggio in the sweet-shop key (C-E-G)
//   levelFail  : minor 2-note fall
//   buttonClick: tiny tick
//   blowerHum  : sustained gentle noise loop (started/stopped externally)
//   candySwing : reserved no-op (we don't want a swing sound — it'd be noisy)

import { ensureCtx, muted } from '../../sound.js';

// Track which star pickup we're on this level so each successive one
// rises in pitch ("1, 2, 3 stars!"). Reset between levels by the caller.
let starStreak = 0;

function noiseBurst({ duration = 0.08, gain = 0.10, hp = 800 }) {
  const c = ensureCtx(); if (!c || muted()) return;
  const n = c.sampleRate * duration;
  const buffer = c.createBuffer(1, n, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filt = c.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  src.connect(filt).connect(g).connect(c.destination);
  src.start();
  src.stop(c.currentTime + duration + 0.02);
}

function tone({ f0, f1 = f0, duration = 0.15, type = 'sine', gain = 0.12, decay = 'exp' }) {
  const c = ensureCtx(); if (!c || muted()) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, c.currentTime);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, c.currentTime + duration);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.01);
  if (decay === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  else g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

function chord(freqs, { duration = 0.34, type = 'triangle', gain = 0.08 } = {}) {
  for (const f of freqs) tone({ f0: f, duration, type, gain });
}

function arpeggio(notes, stepMs = 90, opts = {}) {
  let i = 0;
  const fire = () => {
    if (i >= notes.length) return;
    tone({ f0: notes[i], duration: 0.22, type: 'triangle', gain: 0.10, ...opts });
    i++;
    if (i < notes.length) setTimeout(fire, stepMs);
  };
  fire();
}

export const audio = {
  ropeCut() {
    // Sharp short noise burst — reads as a snip.
    noiseBurst({ duration: 0.07, gain: 0.14, hp: 2400 });
    tone({ f0: 1800, f1: 600, duration: 0.07, type: 'sawtooth', gain: 0.06 });
  },
  candySwing() {
    // No-op by design; the rope's verlet motion + the cut puff cover this.
  },
  starGet() {
    // Bright rising tone; pitch climbs with the streak so 1/2/3 stars
    // collected on the same level sound like 1/2/3 of a scale.
    const base = 880;   // A5
    const ratios = [1, 1.122, 1.260]; // ≈ A, B, C# — three pleasant steps
    const r = ratios[Math.min(2, starStreak)];
    tone({ f0: base * r, f1: base * r * 1.5, duration: 0.18, type: 'triangle', gain: 0.12 });
    tone({ f0: base * r * 2, duration: 0.08, type: 'sine', gain: 0.04 });
    starStreak++;
  },
  bubblePop() {
    // Down-sweep + soft pluck — sounds like a bubble bursting.
    tone({ f0: 760, f1: 240, duration: 0.12, type: 'sine', gain: 0.14 });
    noiseBurst({ duration: 0.04, gain: 0.06, hp: 1200 });
  },
  blowerHum() {
    // Reserved — would require a managed sustained source. Skip for now.
  },
  targetChomp() {
    // Warm low punch — Mochi's bite.
    tone({ f0: 220, f1: 110, duration: 0.18, type: 'sine', gain: 0.20 });
    tone({ f0: 440, f1: 220, duration: 0.10, type: 'triangle', gain: 0.06 });
    noiseBurst({ duration: 0.05, gain: 0.06, hp: 200 });
  },
  levelClear() {
    // C-E-G ascending; small overlap on a final shimmer.
    arpeggio([523.25, 659.25, 783.99], 90);
    setTimeout(() => chord([1046.5, 1318.5], { duration: 0.36, gain: 0.05 }), 280);
    starStreak = 0;
  },
  levelFail() {
    // Minor fall — two notes.
    tone({ f0: 440, duration: 0.16, type: 'triangle', gain: 0.10 });
    setTimeout(() => tone({ f0: 349.23, duration: 0.22, type: 'triangle', gain: 0.10 }), 140);
    starStreak = 0;
  },
  buttonClick() {
    tone({ f0: 1100, duration: 0.04, type: 'square', gain: 0.05 });
  },
  // Called by index.jsx when a level (re)loads so the next pickup starts
  // fresh at the first scale note.
  resetStreak() { starStreak = 0; },
};
