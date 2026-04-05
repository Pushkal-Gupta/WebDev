/**
 * Sound Manager — generates chess sounds using Web Audio API.
 * No external audio files needed. All sounds are synthesized.
 *
 * Supports multiple sound themes, each defined as parameter configs
 * that feed the same synthesis primitives.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/* ---------- shared infrastructure ---------- */

function createCompressor(ctx) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 8;
  comp.attack.value = 0.002;
  comp.release.value = 0.05;
  return comp;
}

function createReverb(ctx, duration = 0.3, decay = 1.8) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

function createOutputChain(ctx, reverbMix = 0.15, vol) {
  const comp = createCompressor(ctx);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const reverb = createReverb(ctx, 0.25, 2.0);
  dryGain.gain.value = 1 - reverbMix;
  wetGain.gain.value = reverbMix;
  const masterGain = ctx.createGain();
  masterGain.gain.value = vol ?? _volume;
  comp.connect(dryGain);
  comp.connect(reverb);
  reverb.connect(wetGain);
  dryGain.connect(masterGain);
  wetGain.connect(masterGain);
  masterGain.connect(ctx.destination);
  return comp;
}

function createNoiseBuffer(ctx, duration) {
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playFilteredNoise(ctx, dest, freq, q, attack, decay, volume, startOffset = 0) {
  const now = ctx.currentTime + startOffset;
  const totalDuration = attack + decay + 0.02;
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, totalDuration);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  source.connect(bp);
  bp.connect(gain);
  gain.connect(dest);
  source.start(now);
  source.stop(now + totalDuration);
}

function playTone(ctx, dest, freq, type, attack, sustain, release, volume, startOffset = 0) {
  const now = ctx.currentTime + startOffset;
  const total = attack + sustain + release + 0.01;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.setValueAtTime(volume, now + attack + sustain);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + sustain + release);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + total);
}

/* ==========================================================
   Sound Theme Configs
   Each theme defines parameters for the 9 sound types.
   ========================================================== */

const SOUND_THEMES = {
  default: {
    label: 'Default',
    move:     { freq: 1000, q: 1.8, atk: 0.005, dec: 0.08, vol: 0.45, tFreq: 3500, tVol: 0.12, rev: 0.12 },
    capture:  { bFreq: 600, bQ: 1.5, bAtk: 0.004, bDec: 0.12, bVol: 0.5, cFreq: 1500, cVol: 0.35, sFreq: 250, sVol: 0.18, rev: 0.14 },
    check:    { freq: 1200, type: 'triangle', lfoFreq: 14, lfoDev: 18, vol: 0.3, atk: 0.005, dec: 0.22, rev: 0.2 },
    castle:   { f1: 1000, f2: 1050, q: 1.8, atk: 0.005, dec: 0.08, v1: 0.42, v2: 0.36, tVol: 0.1, tVol2: 0.09, gap: 0.08, rev: 0.12 },
    promote:  { startF: 400, endF: 800, type: 'sine', vol: 0.32, sparkF: 4000, sparkVol: 0.06, rev: 0.18 },
    gameStart:{ chord: [523, 659, 784], type: 'sine', vol: 0.2, atk: 0.05, sus: 0.1, rel: 0.2, rev: 0.22 },
    gameEnd:  { chord: [392, 494, 587], type: 'sine', vol: 0.18, atk: 0.03, sus: 0.12, rel: 0.3, rev: 0.25 },
    lowTime:  { freq: 800, type: 'sine', vol: 0.35, dec: 0.03, rev: 0 },
    illegal:  { freq: 150, type: 'sawtooth', lpFreq: 600, vol: 0.18, atk: 0.008, sus: 0.052, dec: 0.04, rev: 0 },
  },

  marble: {
    label: 'Marble',
    move:     { freq: 1400, q: 2.5, atk: 0.003, dec: 0.06, vol: 0.5, tFreq: 5000, tVol: 0.18, rev: 0.28 },
    capture:  { bFreq: 800, bQ: 2.0, bAtk: 0.003, bDec: 0.1, bVol: 0.55, cFreq: 2200, cVol: 0.38, sFreq: 350, sVol: 0.15, rev: 0.3 },
    check:    { freq: 1600, type: 'sine', lfoFreq: 10, lfoDev: 12, vol: 0.28, atk: 0.003, dec: 0.25, rev: 0.35 },
    castle:   { f1: 1400, f2: 1500, q: 2.5, atk: 0.003, dec: 0.06, v1: 0.48, v2: 0.4, tVol: 0.15, tVol2: 0.12, gap: 0.07, rev: 0.28 },
    promote:  { startF: 500, endF: 1000, type: 'sine', vol: 0.3, sparkF: 5500, sparkVol: 0.08, rev: 0.3 },
    gameStart:{ chord: [523, 659, 784], type: 'sine', vol: 0.22, atk: 0.04, sus: 0.12, rel: 0.25, rev: 0.35 },
    gameEnd:  { chord: [392, 494, 587], type: 'sine', vol: 0.2, atk: 0.03, sus: 0.15, rel: 0.35, rev: 0.38 },
    lowTime:  { freq: 900, type: 'sine', vol: 0.3, dec: 0.04, rev: 0.05 },
    illegal:  { freq: 180, type: 'sawtooth', lpFreq: 500, vol: 0.15, atk: 0.006, sus: 0.04, dec: 0.05, rev: 0.05 },
  },

  wood: {
    label: 'Wood',
    move:     { freq: 700, q: 1.2, atk: 0.008, dec: 0.12, vol: 0.5, tFreq: 2500, tVol: 0.08, rev: 0.1 },
    capture:  { bFreq: 450, bQ: 1.0, bAtk: 0.006, bDec: 0.15, bVol: 0.55, cFreq: 1100, cVol: 0.3, sFreq: 200, sVol: 0.22, rev: 0.1 },
    check:    { freq: 900, type: 'triangle', lfoFreq: 8, lfoDev: 12, vol: 0.28, atk: 0.008, dec: 0.2, rev: 0.15 },
    castle:   { f1: 700, f2: 750, q: 1.2, atk: 0.008, dec: 0.12, v1: 0.48, v2: 0.4, tVol: 0.07, tVol2: 0.06, gap: 0.1, rev: 0.1 },
    promote:  { startF: 350, endF: 650, type: 'sine', vol: 0.3, sparkF: 3000, sparkVol: 0.04, rev: 0.12 },
    gameStart:{ chord: [440, 554, 659], type: 'sine', vol: 0.2, atk: 0.06, sus: 0.12, rel: 0.25, rev: 0.18 },
    gameEnd:  { chord: [349, 440, 523], type: 'sine', vol: 0.18, atk: 0.04, sus: 0.14, rel: 0.35, rev: 0.2 },
    lowTime:  { freq: 600, type: 'sine', vol: 0.35, dec: 0.04, rev: 0 },
    illegal:  { freq: 120, type: 'sawtooth', lpFreq: 450, vol: 0.2, atk: 0.01, sus: 0.06, dec: 0.04, rev: 0 },
  },

  metal: {
    label: 'Metal',
    move:     { freq: 1800, q: 3.0, atk: 0.002, dec: 0.05, vol: 0.4, tFreq: 6000, tVol: 0.2, rev: 0.08 },
    capture:  { bFreq: 1000, bQ: 2.5, bAtk: 0.002, bDec: 0.08, bVol: 0.5, cFreq: 3000, cVol: 0.4, sFreq: 400, sVol: 0.15, rev: 0.1 },
    check:    { freq: 2000, type: 'sawtooth', lfoFreq: 20, lfoDev: 30, vol: 0.22, atk: 0.002, dec: 0.18, rev: 0.12 },
    castle:   { f1: 1800, f2: 1900, q: 3.0, atk: 0.002, dec: 0.05, v1: 0.38, v2: 0.32, tVol: 0.18, tVol2: 0.14, gap: 0.06, rev: 0.08 },
    promote:  { startF: 600, endF: 1200, type: 'sawtooth', vol: 0.25, sparkF: 7000, sparkVol: 0.1, rev: 0.1 },
    gameStart:{ chord: [659, 830, 988], type: 'triangle', vol: 0.18, atk: 0.03, sus: 0.08, rel: 0.15, rev: 0.15 },
    gameEnd:  { chord: [494, 622, 740], type: 'triangle', vol: 0.16, atk: 0.02, sus: 0.1, rel: 0.2, rev: 0.18 },
    lowTime:  { freq: 1000, type: 'triangle', vol: 0.35, dec: 0.025, rev: 0 },
    illegal:  { freq: 200, type: 'sawtooth', lpFreq: 800, vol: 0.2, atk: 0.005, sus: 0.04, dec: 0.03, rev: 0 },
  },

  glass: {
    label: 'Glass',
    move:     { freq: 2200, q: 4.0, atk: 0.002, dec: 0.04, vol: 0.3, tFreq: 7000, tVol: 0.15, rev: 0.4 },
    capture:  { bFreq: 1200, bQ: 3.0, bAtk: 0.002, bDec: 0.06, bVol: 0.4, cFreq: 3500, cVol: 0.3, sFreq: 500, sVol: 0.1, rev: 0.4 },
    check:    { freq: 2400, type: 'sine', lfoFreq: 6, lfoDev: 8, vol: 0.25, atk: 0.002, dec: 0.3, rev: 0.45 },
    castle:   { f1: 2200, f2: 2400, q: 4.0, atk: 0.002, dec: 0.04, v1: 0.28, v2: 0.24, tVol: 0.12, tVol2: 0.1, gap: 0.06, rev: 0.4 },
    promote:  { startF: 800, endF: 1600, type: 'sine', vol: 0.22, sparkF: 8000, sparkVol: 0.08, rev: 0.4 },
    gameStart:{ chord: [784, 988, 1175], type: 'sine', vol: 0.15, atk: 0.04, sus: 0.15, rel: 0.35, rev: 0.45 },
    gameEnd:  { chord: [587, 740, 880], type: 'sine', vol: 0.14, atk: 0.03, sus: 0.18, rel: 0.4, rev: 0.5 },
    lowTime:  { freq: 1200, type: 'sine', vol: 0.28, dec: 0.035, rev: 0.08 },
    illegal:  { freq: 250, type: 'sine', lpFreq: 400, vol: 0.12, atk: 0.005, sus: 0.03, dec: 0.05, rev: 0.1 },
  },

  retro: {
    label: 'Retro',
    move:     { freq: 800, q: 1.5, atk: 0.001, dec: 0.04, vol: 0.5, tFreq: 3000, tVol: 0.2, rev: 0.02 },
    capture:  { bFreq: 500, bQ: 1.2, bAtk: 0.001, bDec: 0.06, bVol: 0.55, cFreq: 1200, cVol: 0.4, sFreq: 200, sVol: 0.2, rev: 0.02 },
    check:    { freq: 1500, type: 'square', lfoFreq: 0, lfoDev: 0, vol: 0.2, atk: 0.001, dec: 0.12, rev: 0.02 },
    castle:   { f1: 800, f2: 900, q: 1.5, atk: 0.001, dec: 0.04, v1: 0.48, v2: 0.4, tVol: 0.18, tVol2: 0.14, gap: 0.06, rev: 0.02 },
    promote:  { startF: 300, endF: 900, type: 'square', vol: 0.2, sparkF: 4000, sparkVol: 0.1, rev: 0.02 },
    gameStart:{ chord: [523, 659, 784], type: 'square', vol: 0.12, atk: 0.01, sus: 0.08, rel: 0.1, rev: 0.02 },
    gameEnd:  { chord: [392, 494, 587], type: 'square', vol: 0.1, atk: 0.01, sus: 0.1, rel: 0.12, rev: 0.02 },
    lowTime:  { freq: 1000, type: 'square', vol: 0.3, dec: 0.02, rev: 0 },
    illegal:  { freq: 100, type: 'square', lpFreq: 500, vol: 0.22, atk: 0.002, sus: 0.05, dec: 0.03, rev: 0 },
  },
};

/* ---------- theme-aware sound builder ---------- */

function buildSoundsForTheme(cfg, vol) {
  const v = vol ?? _volume;
  return {
    move() {
      const p = cfg.move;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      playFilteredNoise(ctx, out, p.freq, p.q, p.atk, p.dec, v * p.vol);
      playFilteredNoise(ctx, out, p.tFreq, 2.0, 0.002, 0.025, v * p.tVol);
    },

    capture() {
      const p = cfg.capture;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      playFilteredNoise(ctx, out, p.bFreq, p.bQ, p.bAtk, p.bDec, v * p.bVol);
      playFilteredNoise(ctx, out, p.cFreq, 2.0, 0.003, 0.07, v * p.cVol);
      playFilteredNoise(ctx, out, p.sFreq, 1.0, 0.005, 0.09, v * p.sVol);
    },

    check() {
      const p = cfg.check;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = p.freq;

      if (p.lfoFreq > 0) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = p.lfoFreq;
        lfoGain.gain.value = p.lfoDev;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + p.dec + 0.03);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(v * p.vol, now + p.atk);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dec);

      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + p.dec + 0.03);
    },

    castle() {
      const p = cfg.castle;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      playFilteredNoise(ctx, out, p.f1, p.q, p.atk, p.dec, v * p.v1);
      playFilteredNoise(ctx, out, 3500, 2.0, 0.002, 0.025, v * p.tVol);
      playFilteredNoise(ctx, out, p.f2, p.q, p.atk, p.dec, v * p.v2, p.gap);
      playFilteredNoise(ctx, out, 3500, 2.0, 0.002, 0.025, v * p.tVol2, p.gap);
    },

    promote() {
      const p = cfg.promote;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.setValueAtTime(p.startF, now);
      osc.frequency.exponentialRampToValueAtTime(p.endF, now + 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(v * p.vol, now + 0.02);
      gain.gain.setValueAtTime(v * p.vol, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.25);
      playFilteredNoise(ctx, out, p.sparkF, 3.0, 0.05, 0.12, v * p.sparkVol);
    },

    gameStart() {
      const p = cfg.gameStart;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      for (const freq of p.chord) {
        playTone(ctx, out, freq, p.type, p.atk, p.sus, p.rel, v * p.vol);
      }
    },

    gameEnd() {
      const p = cfg.gameEnd;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      for (const freq of p.chord) {
        playTone(ctx, out, freq, p.type, p.atk, p.sus, p.rel, v * p.vol);
      }
    },

    lowTime() {
      const p = cfg.lowTime;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = p.freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(v * p.vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dec);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + p.dec + 0.01);
    },

    illegal() {
      const p = cfg.illegal;
      const ctx = getCtx();
      const out = createOutputChain(ctx, p.rev, v);
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = p.freq;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = p.lpFreq;
      lp.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(v * p.vol, now + p.atk);
      gain.gain.setValueAtTime(v * p.vol, now + p.atk + p.sus);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.atk + p.sus + p.dec);
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + p.atk + p.sus + p.dec + 0.02);
    },
  };
}

/* ==========================================================
   CDN Audio Backend — loads MP3s, caches as AudioBuffers
   ========================================================== */

import { getSoundThemeById, getSoundUrl } from '../data/assetRegistry';

const _audioBufferCache = {}; // { [themeId]: { [soundName]: AudioBuffer } }
const _loadingPromises = {};  // prevent duplicate fetches

async function loadCdnBuffer(themeId, soundName) {
  const cacheKey = `${themeId}:${soundName}`;
  if (_audioBufferCache[themeId]?.[soundName]) return _audioBufferCache[themeId][soundName];
  if (_loadingPromises[cacheKey]) return _loadingPromises[cacheKey];

  const theme = getSoundThemeById(themeId);
  const url = getSoundUrl(theme, soundName);
  if (!url) return null;

  _loadingPromises[cacheKey] = (async () => {
    try {
      const ctx = getCtx();
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      if (!_audioBufferCache[themeId]) _audioBufferCache[themeId] = {};
      _audioBufferCache[themeId][soundName] = audioBuf;
      return audioBuf;
    } catch {
      return null; // fallback to synth
    } finally {
      delete _loadingPromises[cacheKey];
    }
  })();

  return _loadingPromises[cacheKey];
}

function playCdnBuffer(buffer) {
  if (!buffer) return;
  const ctx = getCtx();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = _volume;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);
}

/** Eagerly preload the most common sounds for a CDN theme. */
function preloadCdnTheme(themeId) {
  ['move', 'capture', 'check', 'castle'].forEach(s => loadCdnBuffer(themeId, s));
}

/* ---------- state ---------- */

let _enabled = true;
let _volume = 1.0;
let _soundToggles = {};
let _currentThemeId = 'synth-default';
let _currentThemeSource = 'synth';
let _currentSynthKey = 'default';
let _activeSynthSounds = null;

function getActiveSynthSounds() {
  if (!_activeSynthSounds) {
    _activeSynthSounds = buildSoundsForTheme(SOUND_THEMES[_currentSynthKey] || SOUND_THEMES.default);
  }
  return _activeSynthSounds;
}

/* ---------- public API ---------- */

export function setSoundEnabled(enabled) { _enabled = enabled; }
export function setSoundVolume(vol) { _volume = Math.max(0, Math.min(1, vol)); _activeSynthSounds = null; }
export function setSoundToggles(toggles) { _soundToggles = toggles || {}; }

export function setSoundTheme(themeId) {
  _currentThemeId = themeId;
  _activeSynthSounds = null;
  const theme = getSoundThemeById(themeId);
  _currentThemeSource = theme.source;
  if (theme.source === 'synth') {
    _currentSynthKey = theme.key;
  } else {
    preloadCdnTheme(themeId);
  }
}

/** Preview a theme by playing move → capture → check in sequence. */
export function previewTheme(themeId) {
  const theme = getSoundThemeById(themeId);
  if (theme.source === 'synth') {
    const cfg = SOUND_THEMES[theme.key] || SOUND_THEMES.default;
    const preview = buildSoundsForTheme(cfg, _volume);
    preview.move();
    setTimeout(() => preview.capture(), 280);
    setTimeout(() => preview.check(), 560);
  } else {
    // CDN preview: load and play sequentially
    loadCdnBuffer(themeId, 'move').then(buf => { if (buf) playCdnBuffer(buf); });
    setTimeout(() => loadCdnBuffer(themeId, 'capture').then(buf => { if (buf) playCdnBuffer(buf); }), 300);
    setTimeout(() => loadCdnBuffer(themeId, 'check').then(buf => { if (buf) playCdnBuffer(buf); }), 600);
  }
}

/**
 * Play a chess sound effect.
 */
export function playSound(name) {
  if (!_enabled || _volume <= 0) return;
  if (_soundToggles[name] === false) return;

  if (_currentThemeSource === 'synth') {
    const sounds = getActiveSynthSounds();
    const fn = sounds[name];
    if (fn) fn();
  } else {
    // CDN theme: try cached buffer first, then async load
    const cached = _audioBufferCache[_currentThemeId]?.[name];
    if (cached) {
      playCdnBuffer(cached);
    } else {
      // Async load + play, with synth fallback
      loadCdnBuffer(_currentThemeId, name).then(buf => {
        if (buf) {
          playCdnBuffer(buf);
        } else {
          // Fallback to synth default
          const fallback = buildSoundsForTheme(SOUND_THEMES.default);
          fallback[name]?.();
        }
      });
    }
  }
}

/**
 * Determine the right sound for a chess move result.
 */
export function playSoundForMove(moveResult, chess) {
  if (!_enabled || !moveResult) return;
  if (chess?.isCheck()) {
    playSound('check');
  } else if (moveResult.flags?.includes('k') || moveResult.flags?.includes('q')) {
    playSound('castle');
  } else if (moveResult.flags?.includes('p')) {
    playSound('promote');
  } else if (moveResult.captured) {
    playSound('capture');
  } else {
    playSound('move');
  }
}
