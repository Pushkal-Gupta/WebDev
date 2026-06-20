import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sliders, RotateCcw, Play, Pause, Activity } from 'lucide-react';
import './MLViz.css';

/*
 * GradientNoiseViz
 *
 * Gradient magnitude across training steps under different batch sizes.
 *
 * Model: each step the "true" full-batch gradient norm follows a smooth
 * baseline curve g_true(t) that decays from ~1.0 → ~0.15 over training.
 * A minibatch estimate adds zero-mean Gaussian noise whose stddev scales
 * like 1/sqrt(B). Small B → huge variance (jagged), large B → smooth and
 * tightly clustered around g_true.
 *
 * Readouts:
 *   - sample variance over a rolling window
 *   - signal-to-noise ratio  SNR = mean / std
 *   - learning rate (informational; affects no math here, kept as a control
 *     because the lesson pairs it with batch size in the noise discussion)
 */

const W = 720;
const H = 380;
const PAD_L = 60;
const PAD_R = 20;
const PAD_T = 22;
const PAD_B = 42;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const N_STEPS = 240;
const Y_MAX = 1.8;
const SEED = 27;
const REF_NOISE = 0.55; // std at batch size 1

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function trueGrad(t) {
  // smooth decay with a small bump near step 70 to make signal visible
  const frac = t / N_STEPS;
  const decay = 0.15 + 0.85 * Math.exp(-2.2 * frac);
  const bump = 0.08 * Math.exp(-Math.pow((t - 60) / 22, 2));
  return decay + bump;
}

function xToPx(step) {
  return PAD_L + (step / N_STEPS) * PLOT_W;
}

function yToPx(g) {
  return PAD_T + (1 - Math.min(1, Math.max(0, g / Y_MAX))) * PLOT_H;
}

function buildTruePath() {
  const parts = [];
  for (let i = 0; i <= N_STEPS; i++) {
    const g = trueGrad(i);
    parts.push(`${i === 0 ? 'M' : 'L'}${xToPx(i).toFixed(2)},${yToPx(g).toFixed(2)}`);
  }
  return parts.join(' ');
}

function buildNoisyPath(samples, upto) {
  const parts = [];
  const n = Math.min(samples.length, upto + 1);
  for (let i = 0; i < n; i++) {
    parts.push(`${i === 0 ? 'M' : 'L'}${xToPx(i).toFixed(2)},${yToPx(samples[i]).toFixed(2)}`);
  }
  return parts.join(' ');
}

function fmtBatch(b) {
  if (b >= 1024) return `${(b / 1024).toFixed(b % 1024 === 0 ? 0 : 1)}k`;
  return `${b}`;
}

function fmtLr(v) {
  if (v === 0) return '0';
  if (Math.abs(v) < 1e-3) return v.toExponential(2);
  return v.toPrecision(3);
}

export default function GradientNoiseViz() {
  // log-batch slider: 0 → 1, 1 → 2, ... 9 → 512  (log2)
  const [log2Batch, setLog2Batch] = useState(3); // 8
  const [logLr, setLogLr] = useState(-2.5);      // 3.16e-3
  const [step, setStep] = useState(N_STEPS);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const batchSize = Math.pow(2, log2Batch);
  const lr = Math.pow(10, logLr);

  // Pre-generate a deterministic standard-normal stream so the curve is
  // stable across renders. Noise std scales as 1/sqrt(B).
  const noiseStream = useMemo(() => {
    const rng = mulberry32(SEED);
    const out = new Array(N_STEPS + 1);
    for (let i = 0; i <= N_STEPS; i++) out[i] = gauss(rng);
    return out;
  }, []);

  const samples = useMemo(() => {
    const sigma = REF_NOISE / Math.sqrt(batchSize);
    const out = new Array(N_STEPS + 1);
    for (let i = 0; i <= N_STEPS; i++) {
      const g = trueGrad(i) + sigma * noiseStream[i];
      out[i] = Math.max(0, g);
    }
    return out;
  }, [batchSize, noiseStream]);

  const truePath = useMemo(buildTruePath, []);
  const noisyPath = useMemo(() => buildNoisyPath(samples, step), [samples, step]);

  // animation loop
  useEffect(() => {
    if (!playing || reducedMotion) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      setStep((s) => {
        const next = s + Math.max(1, Math.round(dt / 14));
        if (next >= N_STEPS) {
          setPlaying(false);
          return N_STEPS;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, reducedMotion]);

  const togglePlay = () => {
    if (step >= N_STEPS) setStep(0);
    setPlaying((p) => !p);
  };

  const resetAll = () => {
    setLog2Batch(3);
    setLogLr(-2.5);
    setStep(N_STEPS);
    setPlaying(false);
  };

  // Rolling-window stats over the last 40 visible samples
  const stats = useMemo(() => {
    const upto = Math.min(samples.length - 1, step);
    const start = Math.max(0, upto - 39);
    let n = 0, sum = 0, sumSq = 0;
    for (let i = start; i <= upto; i++) {
      sum += samples[i];
      sumSq += samples[i] * samples[i];
      n++;
    }
    if (n === 0) return { mean: 0, variance: 0, std: 0, snr: 0 };
    const mean = sum / n;
    const variance = Math.max(0, sumSq / n - mean * mean);
    const std = Math.sqrt(variance);
    const snr = std > 1e-9 ? mean / std : Infinity;
    return { mean, variance, std, snr };
  }, [samples, step]);

  // Theoretical std for this batch (for comparison readout)
  const theoreticalStd = REF_NOISE / Math.sqrt(batchSize);

  const yTicks = [0, 0.5, 1.0, 1.5];
  const xTicks = [0, 60, 120, 180, 240];

  // Confidence band: true ± sigma_B
  const bandTop = (i) => Math.max(0, trueGrad(i) + theoreticalStd);
  const bandBot = (i) => Math.max(0, trueGrad(i) - theoreticalStd);
  const bandPath = useMemo(() => {
    let d = '';
    for (let i = 0; i <= N_STEPS; i++) {
      d += `${i === 0 ? 'M' : 'L'}${xToPx(i).toFixed(2)},${yToPx(bandTop(i)).toFixed(2)} `;
    }
    for (let i = N_STEPS; i >= 0; i--) {
      d += `L${xToPx(i).toFixed(2)},${yToPx(bandBot(i)).toFixed(2)} `;
    }
    return d.trim() + ' Z';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theoreticalStd]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.6"
          />

          {/* y ticks */}
          {yTicks.map((v, i) => (
            <g key={`yt${i}`}>
              <line
                x1={PAD_L}
                y1={yToPx(v)}
                x2={W - PAD_R}
                y2={yToPx(v)}
                stroke="var(--border)"
                strokeWidth="1"
                opacity={v === 0 ? 0.6 : 0.22}
                strokeDasharray={v === 0 ? '' : '3 4'}
              />
              <text
                x={PAD_L - 8}
                y={yToPx(v) + 3}
                fontSize="10"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="end"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* x ticks */}
          {xTicks.map((v, i) => (
            <g key={`xt${i}`}>
              <line
                x1={xToPx(v)}
                y1={PAD_T}
                x2={xToPx(v)}
                y2={H - PAD_B}
                stroke="var(--border)"
                strokeWidth="1"
                opacity={v === 0 ? 0.6 : 0.18}
                strokeDasharray={v === 0 ? '' : '3 4'}
              />
              <text
                x={xToPx(v)}
                y={H - PAD_B + 14}
                fontSize="10"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="middle"
              >
                {v}
              </text>
            </g>
          ))}

          {/* ±σ confidence band around the true gradient */}
          <path
            d={bandPath}
            fill="var(--accent)"
            opacity="0.1"
            stroke="none"
          />

          {/* true gradient (signal) */}
          <path
            d={truePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeOpacity="0.9"
            strokeDasharray="4 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* minibatch estimate (noisy) */}
          <path
            d={noisyPath}
            fill="none"
            stroke="var(--hue-pink)"
            strokeWidth="1.5"
            strokeOpacity="0.92"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* current step crosshair */}
          {(() => {
            const cx = xToPx(Math.min(step, N_STEPS));
            const cy = yToPx(samples[Math.min(step, N_STEPS)]);
            return (
              <g>
                <line
                  x1={cx}
                  y1={PAD_T}
                  x2={cx}
                  y2={H - PAD_B}
                  stroke="var(--text-dim)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.5"
                />
                <circle cx={cx} cy={cy} r="3.5" fill="var(--hue-pink)" stroke="var(--bg)" strokeWidth="1.4" />
              </g>
            );
          })()}

          {/* legend */}
          <g transform={`translate(${PAD_L + 12}, ${PAD_T + 12})`}>
            <rect x="-6" y="-8" width="188" height="34" rx="5" fill="var(--surface)" stroke="var(--border)" opacity="0.92" />
            <line x1="2" y1="2" x2="22" y2="2" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" />
            <text x="28" y="5" fontSize="9.5" fill="var(--text-main)" fontFamily="var(--mono)">true ∥g∥ (full batch)</text>
            <line x1="2" y1="17" x2="22" y2="17" stroke="var(--hue-pink)" strokeWidth="1.5" />
            <text x="28" y="20" fontSize="9.5" fill="var(--text-main)" fontFamily="var(--mono)">minibatch estimate</text>
          </g>

          {/* axis labels */}
          <text
            x={PAD_L + PLOT_W / 2}
            y={H - 4}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            training step
          </text>
          <text
            x={14}
            y={PAD_T + PLOT_H / 2}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            transform={`rotate(-90 14 ${PAD_T + PLOT_H / 2})`}
            letterSpacing="0.1em"
          >
            ∥gradient∥
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              batch size
            </span>
            <input
              type="range"
              min="0"
              max="9"
              step="1"
              value={log2Batch}
              onChange={(e) => setLog2Batch(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">B = {fmtBatch(batchSize)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">learning rate</span>
            <input
              type="range"
              min="-4"
              max="-1"
              step="0.1"
              value={logLr}
              onChange={(e) => setLogLr(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">η = {fmtLr(lr)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <Activity size={11} style={{ color: 'var(--hue-pink)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>variance</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)', fontWeight: 800 }}>
              {stats.variance.toFixed(4)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>σ measured</span>
            <span className="mlviz-val" style={{ color: 'var(--text-main)', fontWeight: 800 }}>
              {stats.std.toFixed(3)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>σ theory (σ₀/√B)</span>
            <span className="mlviz-val" style={{ color: 'var(--text-dim)', fontWeight: 800 }}>
              {theoreticalStd.toFixed(3)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>SNR</span>
            <span
              className="mlviz-val"
              style={{
                color: stats.snr > 4 ? 'var(--accent)' : stats.snr > 1.5 ? 'var(--warning)' : 'var(--hue-pink)',
                fontWeight: 800,
              }}
            >
              {Number.isFinite(stats.snr) ? stats.snr.toFixed(2) : '∞'}
            </span>
          </span>
          <span className="mlviz-sub">
            rolling window of 40 steps
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={togglePlay}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : step >= N_STEPS ? 'Replay' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => { setPlaying(false); setStep(N_STEPS); }}>
            <span>Skip to end</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={resetAll}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            step {Math.min(step, N_STEPS)} / {N_STEPS}
          </span>
        </div>

        <div className="mlviz-hint">
          Doubling B halves the variance only by √2 — so going from B=1 to B=256 cuts noise 16×. The band shows ±σ around the true gradient; small batches spike outside it constantly, large batches hug it.
        </div>
      </div>
    </div>
  );
}
