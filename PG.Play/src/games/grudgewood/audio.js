// Grudgewood — synthesized WebAudio. No asset pipeline; everything procedural.
// Supports: ambient layer per biome, trap stings, footsteps, checkpoints,
// hat unlock, near-miss whoosh, death sting.
//
// Mute is reflected from the platform's sound.js (GameShell mute button).

import { isMuted as platformIsMuted, subscribeMute } from '../../sound.js';

let ctx = null;
let master = null;
let sfxGain = null;
let musicGain = null;
let ambientNode = null;
let muted = false;
let muteSub = null;

function ensure() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    muted = platformIsMuted();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.4; musicGain.connect(master);
    // Subscribe once so the platform's mute toggle reaches us live.
    if (!muteSub) muteSub = subscribeMute((m) => { setMuted(m); });
  } catch { ctx = null; }
  return ctx;
}

export function unlockAudio() {
  const c = ensure(); if (!c) return;
  if (c.state === 'suspended') c.resume();
}

export function setVolumes({ master: m, sfx, music }) {
  ensure();
  if (!ctx) return;
  if (typeof m === 'number') master.gain.value = m;
  if (typeof sfx === 'number') sfxGain.gain.value = sfx;
  if (typeof music === 'number') musicGain.gain.value = music;
}

export function setMuted(v) { muted = !!v; if (master) master.gain.value = v ? 0 : 0.8; }

function tone({ freq = 220, dur = 0.18, type = 'sine', gain = 0.25, attack = 0.005, decay = 0.18, slide = 0, dest = sfxGain }) {
  const c = ensure(); if (!c || muted) return;
  const t = c.currentTime;
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise({ dur = 0.18, gain = 0.18, filter = 800, q = 0.8, type = 'lowpass', dest = sfxGain }) {
  const c = ensure(); if (!c || muted) return;
  const t = c.currentTime;
  const n = c.createBufferSource();
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = filter; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); g.connect(dest);
  n.start(t); n.stop(t + dur + 0.05);
}

export const sfx = {
  step()       { tone({ freq: 110 + Math.random() * 50, dur: 0.06, type: 'square', gain: 0.05, decay: 0.06 }); },
  jump()       { tone({ freq: 280, slide: 240, dur: 0.18, type: 'triangle', gain: 0.18 }); },
  land()       { noise({ dur: 0.10, gain: 0.16, filter: 600 }); },
  branchCreak(){ tone({ freq: 90, slide: -30, dur: 0.5, type: 'sawtooth', gain: 0.10, decay: 0.5 }); },
  branchSnap() { noise({ dur: 0.18, gain: 0.4, filter: 1800, q: 4, type: 'bandpass' }); tone({ freq: 220, slide: -120, dur: 0.18, type: 'square', gain: 0.18 }); },
  rootRumble() { noise({ dur: 0.4, gain: 0.22, filter: 220 }); },
  rootSnap()   { tone({ freq: 90, slide: 60, dur: 0.16, type: 'square', gain: 0.22 }); },
  mushPop()    { tone({ freq: 720, slide: -520, dur: 0.16, type: 'sine', gain: 0.28 }); noise({ dur: 0.08, gain: 0.14, filter: 1400 }); },
  logRoll()    { noise({ dur: 0.6, gain: 0.16, filter: 320 }); },
  logImpact()  { noise({ dur: 0.22, gain: 0.34, filter: 480 }); tone({ freq: 70, dur: 0.22, type: 'square', gain: 0.22, decay: 0.22 }); },
  pitFall()    { tone({ freq: 320, slide: -260, dur: 0.55, type: 'sawtooth', gain: 0.22 }); },
  predEye()    { tone({ freq: 1200, dur: 0.4, type: 'sine', gain: 0.10, decay: 0.4 }); },
  predStrike() { noise({ dur: 0.3, gain: 0.4, filter: 600 }); tone({ freq: 60, slide: 120, dur: 0.3, type: 'square', gain: 0.22 }); },
  windGust()   { noise({ dur: 0.7, gain: 0.18, filter: 800, q: 0.4 }); },
  emberHiss()  { noise({ dur: 0.18, gain: 0.10, filter: 3000, q: 2, type: 'highpass' }); },
  signCreak()  { tone({ freq: 180, slide: -60, dur: 0.34, type: 'triangle', gain: 0.10 }); },
  death()      {
    tone({ freq: 220, slide: -180, dur: 0.5, type: 'sawtooth', gain: 0.32, decay: 0.5 });
    noise({ dur: 0.4, gain: 0.18, filter: 240 });
  },
  checkpoint() {
    tone({ freq: 660, dur: 0.18, type: 'sine', gain: 0.22 });
    setTimeout(() => tone({ freq: 990, dur: 0.22, type: 'sine', gain: 0.22 }), 90);
  },
  hatUnlock() {
    [523, 659, 784, 988].forEach((f, i) => setTimeout(() => tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.22 }), i * 80));
  },
  axeReveal() {
    [220, 330, 440, 660, 880].forEach((f, i) => setTimeout(() => tone({ freq: f, dur: 0.4, type: 'sawtooth', gain: 0.18, decay: 0.4 }), i * 110));
  },
  uiTick()     { tone({ freq: 720, dur: 0.04, type: 'square', gain: 0.10, decay: 0.04 }); },
  uiConfirm()  { tone({ freq: 440, slide: 220, dur: 0.12, type: 'triangle', gain: 0.18 }); },
};

// Ambient: long evolving noise filtered + low pulse, biome-tinted.
export function startAmbient(biomeId) {
  const c = ensure(); if (!c) return;
  stopAmbient();
  const t = c.currentTime;
  // Pink-ish noise loop
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
  const f = c.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.value = biomeId === 'rotbog' ? 360 : biomeId === 'heart' ? 480 : 600;
  f.Q.value = 0.7;
  const g = c.createGain(); g.gain.value = 0;
  n.connect(f); f.connect(g); g.connect(musicGain);
  g.gain.linearRampToValueAtTime(biomeId === 'sanctum' ? 0.18 : 0.10, t + 1.5);
  n.start(t);

  // Drone tone for menace
  const drone = c.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = biomeId === 'heart' ? 55 : biomeId === 'rotbog' ? 41 : 65;
  const dg = c.createGain(); dg.gain.value = 0;
  drone.connect(dg); dg.connect(musicGain);
  dg.gain.linearRampToValueAtTime(0.04, t + 2);
  drone.start(t);

  ambientNode = { n, drone, g, dg };
}

export function stopAmbient() {
  if (!ctx || !ambientNode) return;
  const t = ctx.currentTime;
  try {
    ambientNode.g.gain.cancelScheduledValues(t);
    ambientNode.g.gain.linearRampToValueAtTime(0, t + 0.4);
    ambientNode.dg.gain.cancelScheduledValues(t);
    ambientNode.dg.gain.linearRampToValueAtTime(0, t + 0.4);
    ambientNode.n.stop(t + 0.5);
    ambientNode.drone.stop(t + 0.5);
  } catch {}
  ambientNode = null;
}
