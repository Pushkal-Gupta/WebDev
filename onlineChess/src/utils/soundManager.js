/**
 * Sound Manager — generates chess sounds using Web Audio API.
 * No external audio files needed. All sounds are synthesized.
 *
 * Produces natural, satisfying sounds inspired by chess.com / lichess
 * using filtered noise, shaped envelopes, and subtle reverb.
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

/**
 * Create a dynamics compressor to prevent clipping on any output chain.
 */
function createCompressor(ctx) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 8;
  comp.attack.value = 0.002;
  comp.release.value = 0.05;
  return comp;
}

/**
 * Tiny convolution-based reverb (simulated impulse response).
 * Adds subtle spatial depth without loading external files.
 */
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

/**
 * Build an output chain: source -> compressor -> dry/wet reverb -> destination.
 * Returns the node to connect sources into (the compressor input).
 */
function createOutputChain(ctx, reverbMix = 0.15) {
  const comp = createCompressor(ctx);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const reverb = createReverb(ctx, 0.25, 2.0);

  dryGain.gain.value = 1 - reverbMix;
  wetGain.gain.value = reverbMix;

  const masterGain = ctx.createGain();
  masterGain.gain.value = _volume;

  comp.connect(dryGain);
  comp.connect(reverb);
  reverb.connect(wetGain);

  dryGain.connect(masterGain);
  wetGain.connect(masterGain);
  masterGain.connect(ctx.destination);

  return comp;
}

/**
 * Generate a white-noise buffer of a given duration.
 */
function createNoiseBuffer(ctx, duration) {
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Play a bandpass-filtered noise burst — the core "wood thock" sound.
 *
 * @param {AudioContext} ctx
 * @param {AudioNode} dest   - node to connect into (the compressor)
 * @param {number} freq      - bandpass centre frequency
 * @param {number} q         - bandpass Q (narrower = more tonal)
 * @param {number} attack    - gain ramp-up time in seconds
 * @param {number} decay     - gain ramp-down time in seconds
 * @param {number} volume    - peak gain
 * @param {number} [startOffset=0] - schedule offset from ctx.currentTime
 */
function playFilteredNoise(ctx, dest, freq, q, attack, decay, volume, startOffset = 0) {
  const now = ctx.currentTime + startOffset;
  const totalDuration = attack + decay + 0.02; // small tail

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

/**
 * Play a shaped oscillator tone.
 */
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

/* ---------- individual sound designs ---------- */

const sounds = {

  /**
   * move — clean wooden "thock".
   * Bandpass-filtered noise at 800-1200 Hz, quick attack, fast decay.
   */
  move() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.12);
    // Primary thock body
    playFilteredNoise(ctx, out, 1000, 1.8, 0.005, 0.08, _volume * 0.45);
    // Tiny high-frequency transient for "click" at contact
    playFilteredNoise(ctx, out, 3500, 2.0, 0.002, 0.025, _volume * 0.12);
  },

  /**
   * capture — aggressive "thwack" with more body.
   * Two layered noise bursts: low body (600 Hz) + high crack (1500 Hz).
   */
  capture() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.14);
    // Body thud
    playFilteredNoise(ctx, out, 600, 1.5, 0.004, 0.12, _volume * 0.5);
    // Upper crack / impact
    playFilteredNoise(ctx, out, 1500, 2.0, 0.003, 0.07, _volume * 0.35);
    // Sub thump for weight
    playFilteredNoise(ctx, out, 250, 1.0, 0.005, 0.09, _volume * 0.18);
  },

  /**
   * check — sharp metallic "ping".
   * Triangle wave at ~1200 Hz with slight vibrato, medium decay.
   */
  check() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.2);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 1200;

    // Slight vibrato via LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 14; // subtle wobble
    lfoGain.gain.value = 18;  // +-18 Hz deviation
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(_volume * 0.3, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.25);
    lfo.start(now);
    lfo.stop(now + 0.25);
  },

  /**
   * castle — two quick thuds in succession (~80 ms apart).
   * Reuses the "move" noise profile triggered twice.
   */
  castle() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.12);

    // First thud
    playFilteredNoise(ctx, out, 1000, 1.8, 0.005, 0.08, _volume * 0.42);
    playFilteredNoise(ctx, out, 3500, 2.0, 0.002, 0.025, _volume * 0.1);

    // Second thud 80 ms later, slightly softer
    playFilteredNoise(ctx, out, 1050, 1.8, 0.005, 0.08, _volume * 0.36, 0.08);
    playFilteredNoise(ctx, out, 3500, 2.0, 0.002, 0.025, _volume * 0.09, 0.08);
  },

  /**
   * promote — satisfying rising sweep.
   * Sine wave sweeping 400 Hz -> 800 Hz over 150 ms with gentle envelope.
   */
  promote() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.18);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(_volume * 0.32, now + 0.02);
    gain.gain.setValueAtTime(_volume * 0.32, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.25);

    // Small sparkle on top
    playFilteredNoise(ctx, out, 4000, 3.0, 0.05, 0.12, _volume * 0.06);
  },

  /**
   * gameStart — clean uplifting C-major chord (C5 + E5 + G5).
   * Sine waves with gentle attack, medium sustain, soft release.
   */
  gameStart() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.22);
    const vol = _volume * 0.2;

    // C5, E5, G5
    playTone(ctx, out, 523, 'sine', 0.05, 0.1, 0.2, vol);
    playTone(ctx, out, 659, 'sine', 0.05, 0.1, 0.2, vol);
    playTone(ctx, out, 784, 'sine', 0.05, 0.1, 0.2, vol);
  },

  /**
   * gameEnd — soft resolution G-major chord (G4 + B4 + D5).
   * Slow attack, longer release for a gentle outro.
   */
  gameEnd() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.25);
    const vol = _volume * 0.18;

    // G4, B4, D5
    playTone(ctx, out, 392, 'sine', 0.03, 0.12, 0.3, vol);
    playTone(ctx, out, 494, 'sine', 0.03, 0.12, 0.3, vol);
    playTone(ctx, out, 587, 'sine', 0.03, 0.12, 0.3, vol);
  },

  /**
   * lowTime — urgent tick. Very short click at 800 Hz.
   */
  lowTime() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.0); // no reverb for crisp tick
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(_volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.04);
  },

  /**
   * illegal — soft buzz. Low sawtooth at 150 Hz, 100 ms.
   */
  illegal() {
    const ctx = getCtx();
    const out = createOutputChain(ctx, 0.0);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 150;

    // Low-pass to soften the harsh harmonics
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    lp.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(_volume * 0.18, now + 0.008);
    gain.gain.setValueAtTime(_volume * 0.18, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(out);

    osc.start(now);
    osc.stop(now + 0.12);
  },
};

/* ---------- public API (unchanged) ---------- */

let _enabled = true;
let _volume = 1.0;

export function setSoundEnabled(enabled) { _enabled = enabled; }
export function setSoundVolume(vol) { _volume = Math.max(0, Math.min(1, vol)); }

/**
 * Play a chess sound effect.
 * @param {'move'|'capture'|'check'|'castle'|'promote'|'gameStart'|'gameEnd'|'lowTime'|'illegal'} name
 */
export function playSound(name) {
  if (!_enabled || _volume <= 0) return;
  const fn = sounds[name];
  if (fn) fn();
}

/**
 * Determine the right sound for a chess move result.
 * @param {object} moveResult - chess.js verbose move result
 * @param {object} chess - chess.js instance (after the move)
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
