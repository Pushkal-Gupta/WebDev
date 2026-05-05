// Era Siege — procedural music system.
//
// One synth bed per era (5 total). Same oscillator graph; the per-era
// "voice" is a parameter pack — root frequency, scale, filter cutoff,
// LFO depth, drum-pulse rate. Crossfade between beds is a 2-bed
// stagger: the outgoing bed's master gain ramps to 0 over 3 s while
// the incoming bed ramps from 0 to its base gain over 3 s.
//
//   esMusic.start(eraIdx)  — boots / re-keys to that era
//   esMusic.stop()         — fade out over 1.5 s, kill the graph
//   esMusic.duck(sec)      — temporary -85% master, recover over `sec`
//
// All gains stay below SFX so it always sits as a bed.

import { ensureCtx, muted, subscribeMute } from '../../../sound.js';

// Per-era voice. Frequencies pinned to a low triad in different modes
// so each era reads as its own thing without needing samples.
const ERAS = [
  // Ember Tribe — minor pentatonic over a low warm root
  { root: 138.59, fifth: 207.65, third: 165.81, oct: 277.18,
    cutoff: 1100, lfoRate: 0.18, pulseRate: 0.85,
    osc: 'sawtooth', subOsc: 'triangle', noiseGain: 0.012 },
  // Iron Dominion — open fifths, modal & cold
  { root: 130.81, fifth: 196.00, third: 156.00, oct: 261.63,
    cutoff: 900,  lfoRate: 0.12, pulseRate: 0.50,
    osc: 'square',  subOsc: 'triangle', noiseGain: 0.005 },
  // Sun Foundry — mechanical, brass overtones
  { root: 146.83, fifth: 220.00, third: 185.00, oct: 293.66,
    cutoff: 1500, lfoRate: 0.22, pulseRate: 0.70,
    osc: 'sawtooth', subOsc: 'square',   noiseGain: 0.018 },
  // Storm Republic — dark, tense, syncopated
  { root: 110.00, fifth: 164.81, third: 130.81, oct: 220.00,
    cutoff: 750,  lfoRate: 0.30, pulseRate: 1.20,
    osc: 'sawtooth', subOsc: 'sawtooth', noiseGain: 0.020 },
  // Void Ascendancy — sustained drone, glissando overtones
  { root: 103.83, fifth: 155.56, third: 123.47, oct: 207.65,
    cutoff: 600,  lfoRate: 0.08, pulseRate: 0.35,
    osc: 'sine',     subOsc: 'sawtooth', noiseGain: 0.028 },
];

const BASE_GAIN = 0.045;        // bed sits well under SFX
const FADE_IN   = 3.0;
const FADE_OUT  = 3.0;
const STOP_FADE = 1.5;

// Active beds. We allow up to TWO simultaneous beds during a
// crossfade — outgoing fades to 0, incoming ramps to BASE_GAIN.
const _beds = [];   // [{ era, ctx, master, oscs, lfos, noise, unsubMute, dying }]

function _disposeBed(bed) {
  const { ctx, master, oscs, lfos, noise, unsubMute } = bed;
  try {
    const t = ctx.currentTime;
    oscs.forEach((o) => { try { o.stop(t + 0.05); } catch { /* ignore */ } });
    lfos.forEach((l) => { try { l.stop(t + 0.05); } catch { /* ignore */ } });
    if (noise) { try { noise.stop(t + 0.05); } catch { /* ignore */ } }
    if (master) { try { master.disconnect(); } catch { /* ignore */ } }
  } catch { /* ignore */ }
  if (typeof unsubMute === 'function') { try { unsubMute(); } catch { /* ignore */ } }
  bed.dying = true;
}

function _spawnBed(eraIdx) {
  if (muted()) return null;
  const ctx = ensureCtx();
  if (!ctx) return null;
  const v = ERAS[Math.max(0, Math.min(ERAS.length - 1, eraIdx | 0))];
  const t0 = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(BASE_GAIN, t0 + FADE_IN);

  // Two-stage low-pass — gentler highs than a single 12 dB filter
  const lp1 = ctx.createBiquadFilter();
  lp1.type = 'lowpass';
  lp1.frequency.setValueAtTime(v.cutoff, t0);
  lp1.Q.value = 0.6;
  const lp2 = ctx.createBiquadFilter();
  lp2.type = 'lowpass';
  lp2.frequency.setValueAtTime(v.cutoff * 1.4, t0);
  lp2.Q.value = 0.4;

  master.connect(lp1).connect(lp2).connect(ctx.destination);

  // Slow filter sweep so the bed "breathes"
  const lfoFilter = ctx.createOscillator();
  lfoFilter.type = 'sine';
  lfoFilter.frequency.setValueAtTime(v.lfoRate, t0);
  const lfoFilterGain = ctx.createGain();
  lfoFilterGain.gain.setValueAtTime(v.cutoff * 0.30, t0);
  lfoFilter.connect(lfoFilterGain).connect(lp1.frequency);
  lfoFilter.start(t0);

  // Triad — root + fifth + third overlap to sketch the era's mode
  const oscs = [];
  for (const [freq, level] of [[v.root, 0.18], [v.fifth, 0.10], [v.third, 0.08], [v.oct * 0.5, 0.07]]) {
    const o = ctx.createOscillator();
    o.type = v.osc;
    o.frequency.setValueAtTime(freq, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t0);
    o.connect(g).connect(master);
    o.start(t0);
    oscs.push(o);
  }

  // Sub-oscillator at the octave — adds warmth + body
  {
    const o = ctx.createOscillator();
    o.type = v.subOsc;
    o.frequency.setValueAtTime(v.root * 0.5, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.07, t0);
    o.connect(g).connect(master);
    o.start(t0);
    oscs.push(o);
  }

  // Pulse — slow tempo accent that gives the era a heartbeat. Rate
  // varies per era (Ember = 0.85 Hz, Storm = 1.20 Hz, Void = 0.35 Hz).
  const pulseOsc = ctx.createOscillator();
  pulseOsc.type = 'sine';
  pulseOsc.frequency.setValueAtTime(v.pulseRate, t0);
  const pulseGain = ctx.createGain();
  pulseGain.gain.setValueAtTime(0.04, t0);
  pulseOsc.connect(pulseGain).connect(master);
  pulseOsc.start(t0);

  // Soft noise wash — colour by era. Ember = warm hiss; Void = cold
  // drone-noise.
  let noise = null;
  if (v.noiseGain > 0) {
    try {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(v.noiseGain, t0);
      const nLp = ctx.createBiquadFilter();
      nLp.type = 'lowpass';
      nLp.frequency.setValueAtTime(v.cutoff * 0.8, t0);
      src.connect(nLp).connect(ng).connect(master);
      src.start(t0);
      noise = src;
    } catch { /* ignore */ }
  }

  const unsubMute = subscribeMute((isMute) => { if (isMute) esMusic.stop(); });

  return {
    era: eraIdx,
    ctx,
    master,
    oscs: [...oscs, pulseOsc],
    lfos: [lfoFilter],
    noise,
    unsubMute,
    dying: false,
  };
}

export const esMusic = {
  start(eraIdx) {
    if (muted()) return;
    // No-op if the active (newest) bed already matches the requested era.
    const live = _beds.find((b) => !b.dying);
    if (live && live.era === (eraIdx | 0)) return;
    // Crossfade: ramp ALL existing beds out, spawn the new one in.
    for (const b of _beds) {
      if (b.dying) continue;
      try {
        const t = b.ctx.currentTime;
        b.master.gain.cancelScheduledValues(t);
        b.master.gain.setValueAtTime(b.master.gain.value, t);
        b.master.gain.linearRampToValueAtTime(0.0001, t + FADE_OUT);
        // Schedule disposal slightly after the ramp completes.
        window.setTimeout(() => { _disposeBed(b); }, (FADE_OUT + 0.2) * 1000);
      } catch { /* ignore */ }
    }
    const fresh = _spawnBed(eraIdx);
    if (fresh) _beds.push(fresh);
    // Reap any disposed beds.
    setTimeout(() => {
      for (let i = _beds.length - 1; i >= 0; i--) if (_beds[i].dying) _beds.splice(i, 1);
    }, (FADE_OUT + 0.4) * 1000);
  },

  stop() {
    for (const b of _beds) {
      if (b.dying) continue;
      try {
        const t = b.ctx.currentTime;
        b.master.gain.cancelScheduledValues(t);
        b.master.gain.setValueAtTime(b.master.gain.value, t);
        b.master.gain.linearRampToValueAtTime(0.0001, t + STOP_FADE);
        window.setTimeout(() => { _disposeBed(b); }, (STOP_FADE + 0.2) * 1000);
      } catch { /* ignore */ }
    }
    setTimeout(() => {
      for (let i = _beds.length - 1; i >= 0; i--) if (_beds[i].dying) _beds.splice(i, 1);
    }, (STOP_FADE + 0.4) * 1000);
  },

  duck(durationSec = 0.6) {
    for (const b of _beds) {
      if (b.dying) continue;
      try {
        const t = b.ctx.currentTime;
        b.master.gain.cancelScheduledValues(t);
        b.master.gain.setValueAtTime(b.master.gain.value, t);
        b.master.gain.linearRampToValueAtTime(BASE_GAIN * 0.08, t + 0.12);
        b.master.gain.linearRampToValueAtTime(BASE_GAIN,        t + Math.max(durationSec, 0.4));
      } catch { /* ignore */ }
    }
  },
};
