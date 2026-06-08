import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Play, RotateCcw, Activity } from 'lucide-react';
import './MLViz.css';

// Two stacked plots. Time-domain on top, frequency-domain on bottom.
const W = 420;
const H_TIME = 150;
const H_FREQ = 150;
const GAP = 18;
const H = H_TIME + GAP + H_FREQ;

const PAD_L = 34;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 22;

const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H_TIME = H_TIME - PAD_T - PAD_B;
const PLOT_H_FREQ = H_FREQ - PAD_T - PAD_B;

const N = 64;           // FFT size (power of 2)
const T_DURATION = 1.0; // seconds shown on time axis
const MAX_FREQ_BIN = N / 2; // Nyquist limit shown on freq axis
const REVEAL_DELAY = 22;    // ms between bin reveals

const HUES = ['var(--accent)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

const DEFAULT_WAVES = [
  { amp: 1.0, freq: 3 },
  { amp: 0.6, freq: 7 },
  { amp: 0.0, freq: 12 },
  { amp: 0.0, freq: 20 },
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function tToPx(t) {
  return PAD_L + (t / T_DURATION) * PLOT_W;
}

function sigToPx(y, yMax) {
  const top = PAD_T;
  const mid = top + PLOT_H_TIME / 2;
  return mid - (y / yMax) * (PLOT_H_TIME / 2);
}

function freqToPx(k) {
  return PAD_L + (k / MAX_FREQ_BIN) * PLOT_W;
}

function magToPx(m, maxMag) {
  const base = H_TIME + GAP + PAD_T + PLOT_H_FREQ;
  if (maxMag <= 0) return base;
  return base - (m / maxMag) * PLOT_H_FREQ;
}

// Cooley-Tukey radix-2 DIT FFT, iterative, in-place.
function fft(re, im) {
  const n = re.length;
  // bit-reverse permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const aRe = re[i + k];
        const aIm = im[i + k];
        const bRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const bIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = aRe + bRe;
        im[i + k] = aIm + bIm;
        re[i + k + len / 2] = aRe - bRe;
        im[i + k + len / 2] = aIm - bIm;
        const nRe = curRe * wRe - curIm * wIm;
        const nIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
        curIm = nIm;
      }
    }
  }
}

export default function FFTViz() {
  const [waves, setWaves] = useState(DEFAULT_WAVES);
  const [revealed, setRevealed] = useState(0); // number of bins revealed in freq plot
  const [computing, setComputing] = useState(false);
  const revealRef = useRef(0);
  const timerRef = useRef(null);

  // Reset reveal whenever a wave parameter changes so the spectrum is honest.
  useEffect(() => {
    setRevealed(0);
    revealRef.current = 0;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setComputing(false);
  }, [waves]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const updateWave = useCallback((idx, key, val) => {
    setWaves((prev) => prev.map((w, i) => (i === idx ? { ...w, [key]: val } : w)));
  }, []);

  // Sample the combined signal at N points. f is bin number, so phase = 2*pi*f*n/N.
  const signal = useMemo(() => {
    const out = new Array(N);
    for (let n = 0; n < N; n++) {
      let s = 0;
      for (let w = 0; w < waves.length; w++) {
        const { amp, freq } = waves[w];
        if (amp === 0) continue;
        s += amp * Math.sin((2 * Math.PI * freq * n) / N);
      }
      out[n] = s;
    }
    return out;
  }, [waves]);

  const spectrum = useMemo(() => {
    const re = signal.slice();
    const im = new Array(N).fill(0);
    fft(re, im);
    const mags = new Array(MAX_FREQ_BIN);
    for (let k = 0; k < MAX_FREQ_BIN; k++) {
      mags[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / (N / 2);
    }
    return mags;
  }, [signal]);

  const maxMag = useMemo(() => {
    let m = 0;
    for (let i = 0; i < spectrum.length; i++) if (spectrum[i] > m) m = spectrum[i];
    return Math.max(m, 0.1);
  }, [spectrum]);

  const sigYMax = useMemo(() => {
    let m = 0;
    for (let i = 0; i < signal.length; i++) {
      const a = Math.abs(signal[i]);
      if (a > m) m = a;
    }
    return Math.max(m, 1.0);
  }, [signal]);

  // Smooth time-domain path: interpolate the discrete samples with a denser cosine-sum eval.
  const timePath = useMemo(() => {
    const STEPS = 240;
    const parts = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = (i / STEPS) * T_DURATION;
      let y = 0;
      for (let w = 0; w < waves.length; w++) {
        const { amp, freq } = waves[w];
        if (amp === 0) continue;
        y += amp * Math.sin(2 * Math.PI * freq * t);
      }
      const px = tToPx(t);
      const py = sigToPx(y, sigYMax);
      parts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`);
    }
    return parts.join(' ');
  }, [waves, sigYMax]);

  // Per-wave faint trace so the reader sees the components.
  const componentPaths = useMemo(() => {
    const STEPS = 200;
    return waves.map(({ amp, freq }) => {
      if (amp === 0) return '';
      const parts = [];
      for (let i = 0; i <= STEPS; i++) {
        const t = (i / STEPS) * T_DURATION;
        const y = amp * Math.sin(2 * Math.PI * freq * t);
        const px = tToPx(t);
        const py = sigToPx(y, sigYMax);
        parts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`);
      }
      return parts.join(' ');
    });
  }, [waves, sigYMax]);

  const handleCompute = useCallback(() => {
    if (computing) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    revealRef.current = 0;
    setRevealed(0);
    setComputing(true);
    const tick = () => {
      revealRef.current += 1;
      setRevealed(revealRef.current);
      if (revealRef.current >= MAX_FREQ_BIN) {
        setComputing(false);
        return;
      }
      timerRef.current = setTimeout(tick, REVEAL_DELAY);
    };
    timerRef.current = setTimeout(tick, REVEAL_DELAY);
  }, [computing]);

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRevealed(0);
    revealRef.current = 0;
    setComputing(false);
  }, []);

  const timeAxisY = PAD_T + PLOT_H_TIME / 2;
  const freqBaseY = H_TIME + GAP + PAD_T + PLOT_H_FREQ;
  const freqTopY = H_TIME + GAP + PAD_T;
  const freqBoxLeft = PAD_L;
  const freqBoxRight = W - PAD_R;

  // Identify dominant bins (top 4 magnitudes) for readout label.
  const dominant = useMemo(() => {
    const arr = spectrum.map((m, k) => ({ k, m })).sort((a, b) => b.m - a.m);
    return arr.slice(0, 4).filter((d) => d.m > 0.05);
  }, [spectrum]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <linearGradient id="fft-time-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fft-freq-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* time-domain frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H_TIME}
            fill="var(--surface)"
            opacity="0.35"
            stroke="var(--border)"
            strokeWidth="0.75"
          />
          {/* center zero-line */}
          <line
            x1={PAD_L}
            y1={timeAxisY}
            x2={W - PAD_R}
            y2={timeAxisY}
            stroke="var(--border)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.7"
          />

          {/* per-component faint traces */}
          {componentPaths.map((d, i) =>
            d ? (
              <path
                key={`cmp${i}`}
                d={d}
                fill="none"
                stroke={HUES[i % HUES.length]}
                strokeWidth="1"
                opacity="0.32"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null
          )}

          {/* combined time-domain signal */}
          <path d={timePath} fill="none" stroke="var(--accent)" strokeWidth="1.85" strokeLinejoin="round" strokeLinecap="round" />

          {/* sample dots */}
          {signal.map((y, i) => {
            const t = (i / N) * T_DURATION;
            return (
              <circle
                key={`s${i}`}
                cx={tToPx(t)}
                cy={sigToPx(y, sigYMax)}
                r="1.4"
                fill="var(--accent)"
                opacity="0.85"
              />
            );
          })}

          {/* time axis label */}
          <text
            x={PAD_L - 6}
            y={PAD_T + 8}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
          >
            signal
          </text>
          <text
            x={W - PAD_R}
            y={timeAxisY + PLOT_H_TIME / 2 + 14}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            t
          </text>
          <text
            x={PAD_L}
            y={timeAxisY + PLOT_H_TIME / 2 + 14}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="start"
          >
            0
          </text>

          {/* divider band */}
          <line
            x1={PAD_L}
            y1={H_TIME + GAP / 2}
            x2={W - PAD_R}
            y2={H_TIME + GAP / 2}
            stroke="var(--border)"
            strokeWidth="0.6"
            strokeDasharray="1 4"
            opacity="0.6"
          />
          <text
            x={(PAD_L + W - PAD_R) / 2}
            y={H_TIME + GAP / 2 - 4}
            fontSize="8.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="1.2"
          >
            FFT
          </text>

          {/* frequency-domain frame */}
          <rect
            x={freqBoxLeft}
            y={freqTopY}
            width={freqBoxRight - freqBoxLeft}
            height={PLOT_H_FREQ}
            fill="var(--surface)"
            opacity="0.35"
            stroke="var(--border)"
            strokeWidth="0.75"
          />

          {/* freq bins as bars, only up to `revealed` count */}
          {spectrum.map((m, k) => {
            const isRevealed = k < revealed;
            const x = freqToPx(k);
            const nextX = freqToPx(k + 1);
            const barW = Math.max(2, nextX - x - 1.4);
            const yTop = magToPx(m, maxMag);
            const h = freqBaseY - yTop;
            if (h <= 0.5) return null;
            return (
              <rect
                key={`b${k}`}
                x={x + 0.7}
                y={isRevealed ? yTop : freqBaseY}
                width={barW}
                height={isRevealed ? h : 0}
                fill="url(#fft-freq-fill)"
                stroke="var(--accent)"
                strokeWidth="0.6"
                opacity={isRevealed ? 1 : 0}
                style={{ transition: 'y 180ms ease, height 180ms ease, opacity 180ms ease' }}
              />
            );
          })}

          {/* freq axis baseline */}
          <line
            x1={freqBoxLeft}
            y1={freqBaseY}
            x2={freqBoxRight}
            y2={freqBaseY}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* freq x-ticks */}
          {[0, 8, 16, 24, 32].map((k) => {
            const px = freqToPx(k);
            return (
              <g key={`ft${k}`}>
                <line x1={px} y1={freqBaseY} x2={px} y2={freqBaseY + 3} stroke="var(--border)" strokeWidth="0.8" />
                <text
                  x={px}
                  y={freqBaseY + 13}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {k}
                </text>
              </g>
            );
          })}

          {/* freq axis labels */}
          <text
            x={PAD_L - 6}
            y={freqTopY + 8}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
          >
            |X[k]|
          </text>
          <text
            x={W - PAD_R}
            y={freqBaseY + 13}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            k (bin)
          </text>

          {/* sweep indicator while computing */}
          {computing && revealed < MAX_FREQ_BIN && (
            <line
              x1={freqToPx(revealed)}
              y1={freqTopY}
              x2={freqToPx(revealed)}
              y2={freqBaseY}
              stroke="var(--accent)"
              strokeWidth="1.2"
              opacity="0.65"
            />
          )}

          {/* highlight dominant bin labels once fully revealed */}
          {revealed >= MAX_FREQ_BIN &&
            dominant.map((d) => (
              <text
                key={`dl${d.k}`}
                x={freqToPx(d.k) + 4}
                y={magToPx(d.m, maxMag) - 4}
                fontSize="9"
                fill="var(--accent)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                k={d.k}
              </text>
            ))}
        </svg>
      </div>

      <div className="mlviz-readout">
        {waves.map((w, i) => (
          <div className="mlviz-row mlviz-controls" key={`wave${i}`}>
            <label className="mlviz-slider">
              <span className="mlviz-slider-label" style={{ color: HUES[i % HUES.length] }}>
                A{i + 1}
              </span>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={w.amp}
                onChange={(e) => updateWave(i, 'amp', parseFloat(e.target.value))}
              />
              <span className="mlviz-slider-val">{snap(w.amp, 2)}</span>
            </label>
            <label className="mlviz-slider">
              <span className="mlviz-slider-label" style={{ color: HUES[i % HUES.length] }}>
                f{i + 1}
              </span>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={w.freq}
                onChange={(e) => updateWave(i, 'freq', parseInt(e.target.value, 10))}
              />
              <span className="mlviz-slider-val">{w.freq}</span>
            </label>
          </div>
        ))}

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>spectrum</span>
          {revealed === 0 ? (
            <span className="mlviz-sub">press compute to reveal magnitudes</span>
          ) : revealed < MAX_FREQ_BIN ? (
            <span className="mlviz-sub">
              revealing bin {revealed} / {MAX_FREQ_BIN}
            </span>
          ) : dominant.length > 0 ? (
            <>
              {dominant.map((d) => (
                <span key={`tag${d.k}`} className="mlviz-val">
                  k={d.k} · |X|={snap(d.m, 2)}
                </span>
              ))}
            </>
          ) : (
            <span className="mlviz-sub">flat spectrum</span>
          )}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleCompute}
            disabled={computing}
          >
            {computing ? <Activity size={13} /> : <Play size={13} />}
            <span>{computing ? 'Computing' : 'Compute FFT'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={revealed === 0 && !computing}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          N = {N} samples · bins 0..{MAX_FREQ_BIN - 1} (Nyquist) · dominant bins match the active sine components
        </div>
      </div>
    </div>
  );
}
