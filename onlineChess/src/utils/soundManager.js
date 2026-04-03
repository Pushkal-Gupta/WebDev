/**
 * Sound Manager — generates chess sounds using Web Audio API.
 * No external audio files needed. All sounds are synthesized.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.08) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

const sounds = {
  move() {
    // Soft thud
    playTone(150, 0.08, 'sine', 0.2);
    playNoise(0.05, 0.06);
  },

  capture() {
    // Sharper impact
    playTone(200, 0.06, 'square', 0.12);
    playTone(100, 0.1, 'sine', 0.15);
    playNoise(0.08, 0.1);
  },

  check() {
    // Alert tone
    playTone(880, 0.08, 'sine', 0.15);
    setTimeout(() => playTone(1100, 0.08, 'sine', 0.12), 80);
  },

  castle() {
    // Double thud (two pieces moving)
    playTone(150, 0.06, 'sine', 0.18);
    playNoise(0.04, 0.05);
    setTimeout(() => {
      playTone(170, 0.06, 'sine', 0.15);
      playNoise(0.04, 0.04);
    }, 100);
  },

  promote() {
    // Rising tone
    playTone(440, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(660, 0.1, 'sine', 0.12), 80);
    setTimeout(() => playTone(880, 0.15, 'sine', 0.1), 160);
  },

  gameStart() {
    // Three ascending tones
    playTone(330, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(440, 0.1, 'sine', 0.1), 120);
    setTimeout(() => playTone(550, 0.15, 'sine', 0.1), 240);
  },

  gameEnd() {
    // Descending resolution
    playTone(550, 0.15, 'sine', 0.12);
    setTimeout(() => playTone(440, 0.15, 'sine', 0.12), 150);
    setTimeout(() => playTone(330, 0.25, 'sine', 0.1), 300);
  },

  lowTime() {
    // Urgent tick
    playTone(1000, 0.05, 'square', 0.08);
  },

  illegal() {
    // Buzzer
    playTone(200, 0.15, 'sawtooth', 0.06);
  },
};

// Global enabled state (reads from themeStore)
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
