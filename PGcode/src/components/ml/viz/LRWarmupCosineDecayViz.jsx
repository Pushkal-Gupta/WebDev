import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sliders, RotateCcw, Play, Pause, TrendingDown } from 'lucide-react';
import './MLViz.css';

/*
 * LRWarmupCosineDecayViz
 *
 * Single LR schedule with three switchable decay shapes after warmup:
 *   - cosine   : 0.5 * (peak - min) * (1 + cos(pi * frac)) + min
 *   - linear   : (peak - min) * (1 - frac) + min
 *   - poly p=2 : (peak - min) * (1 - frac)^2 + min
 *
 * Sliders: warmup steps (0..2000), total steps (1000..50000), peak LR, min LR.
 * Animated current-step marker travels left → right. Play / pause / reset.
 */

const W = 720;
const H = 380;
const PAD_L = 60;
const PAD_R = 20;
const PAD_T = 22;
const PAD_B = 42;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const N_SAMPLES = 360;

const DECAYS = [
  { id: 'cosine', label: 'Cosine',     color: 'var(--accent)' },
  { id: 'linear', label: 'Linear',     color: 'var(--hue-sky)' },
  { id: 'poly',   label: 'Polynomial', color: 'var(--hue-violet)' },
];

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lrAt(decay, step, params) {
  const { peakLr, minLr, warmupSteps, totalSteps } = params;
  const t = clamp(step, 0, totalSteps);
  if (t < warmupSteps) {
    if (warmupSteps <= 0) return peakLr;
    return peakLr * (t / warmupSteps);
  }
  const denom = Math.max(1, totalSteps - warmupSteps);
  const frac = clamp((t - warmupSteps) / denom, 0, 1);
  const span = peakLr - minLr;
  if (decay === 'cosine') return minLr + 0.5 * span * (1 + Math.cos(Math.PI * frac));
  if (decay === 'linear') return minLr + span * (1 - frac);
  if (decay === 'poly')   return minLr + span * Math.pow(1 - frac, 2);
  return peakLr;
}

function xToPx(step, totalSteps) {
  const frac = totalSteps > 0 ? step / totalSteps : 0;
  return PAD_L + frac * PLOT_W;
}

function yToPx(lr, maxLr) {
  const frac = maxLr > 0 ? lr / maxLr : 0;
  return PAD_T + (1 - frac) * PLOT_H;
}

function buildPath(decay, params, yMax) {
  const { totalSteps } = params;
  const parts = [];
  for (let i = 0; i <= N_SAMPLES; i++) {
    const step = (i / N_SAMPLES) * totalSteps;
    const lr = lrAt(decay, step, params);
    const x = xToPx(step, totalSteps);
    const y = yToPx(lr, yMax);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return parts.join(' ');
}

function fmtStep(s) {
  const v = Math.round(s);
  if (v >= 1000) {
    const k = v / 1000;
    return `${k.toFixed(k % 1 === 0 ? 0 : 1)}k`;
  }
  return `${v}`;
}

function fmtLr(v) {
  if (v === 0) return '0';
  if (Math.abs(v) < 1e-4) return v.toExponential(2);
  return v.toPrecision(3);
}

function niceTickStep(range, target) {
  const raw = range / Math.max(1, target);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  let mult;
  if (norm < 1.5) mult = 1;
  else if (norm < 3.5) mult = 2;
  else if (norm < 7.5) mult = 5;
  else mult = 10;
  return mult * pow;
}

export default function LRWarmupCosineDecayViz() {
  const [warmupSteps, setWarmupSteps] = useState(500);
  const [totalSteps, setTotalSteps] = useState(10000);
  const [peakLr, setPeakLr] = useState(0.001);
  const [minLr, setMinLr] = useState(0.00005);
  const [decay, setDecay] = useState('cosine');
  const [step, setStep] = useState(0);
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

  // keep slider bounds sane
  const effectiveWarmup = Math.min(warmupSteps, Math.max(0, totalSteps - 1));
  const effectiveMin = Math.min(minLr, peakLr * 0.95);

  const params = useMemo(
    () => ({ peakLr, minLr: effectiveMin, warmupSteps: effectiveWarmup, totalSteps }),
    [peakLr, effectiveMin, effectiveWarmup, totalSteps]
  );

  const yMax = peakLr * 1.1;

  const paths = useMemo(() => {
    const out = {};
    for (const d of DECAYS) out[d.id] = buildPath(d.id, params, yMax);
    return out;
  }, [params, yMax]);

  // animation loop
  useEffect(() => {
    if (!playing || reducedMotion) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      setStep((s) => {
        const inc = (totalSteps / 6000) * dt;
        const next = s + inc;
        if (next >= totalSteps) {
          setPlaying(false);
          return totalSteps;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, reducedMotion, totalSteps]);

  // clamp step when totalSteps changes
  useEffect(() => {
    setStep((s) => clamp(s, 0, totalSteps));
  }, [totalSteps]);

  const togglePlay = () => {
    if (step >= totalSteps) setStep(0);
    setPlaying((p) => !p);
  };

  const resetAll = () => {
    setWarmupSteps(500);
    setTotalSteps(10000);
    setPeakLr(0.001);
    setMinLr(0.00005);
    setDecay('cosine');
    setStep(0);
    setPlaying(false);
  };

  const xTickStep = useMemo(() => niceTickStep(totalSteps, 6), [totalSteps]);
  const xTicks = useMemo(() => {
    const ticks = [];
    for (let v = 0; v <= totalSteps + 1e-6; v += xTickStep) ticks.push(Math.round(v));
    return ticks;
  }, [totalSteps, xTickStep]);

  const yTickStep = useMemo(() => niceTickStep(yMax, 5), [yMax]);
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let v = 0; v <= yMax + 1e-12; v += yTickStep) ticks.push(v);
    return ticks;
  }, [yMax, yTickStep]);

  const currentLr = lrAt(decay, step, params);
  const phaseLabel = step < params.warmupSteps ? 'WARMUP' : 'DECAY';
  const phaseColor = step < params.warmupSteps ? 'var(--warning)' : 'var(--accent)';

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
          {yTicks.map((v, i) => {
            const y = yToPx(v, yMax);
            return (
              <g key={`yt${i}`}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity={v === 0 ? 0.6 : 0.22}
                  strokeDasharray={v === 0 ? '' : '3 4'}
                />
                <text
                  x={PAD_L - 8}
                  y={y + 3}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="end"
                >
                  {fmtLr(v)}
                </text>
              </g>
            );
          })}

          {/* x ticks */}
          {xTicks.map((v, i) => {
            const x = xToPx(v, totalSteps);
            return (
              <g key={`xt${i}`}>
                <line
                  x1={x}
                  y1={PAD_T}
                  x2={x}
                  y2={H - PAD_B}
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity={v === 0 ? 0.6 : 0.18}
                  strokeDasharray={v === 0 ? '' : '3 4'}
                />
                <text
                  x={x}
                  y={H - PAD_B + 14}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                >
                  {fmtStep(v)}
                </text>
              </g>
            );
          })}

          {/* warmup band */}
          {params.warmupSteps > 0 && (
            <g>
              <rect
                x={PAD_L}
                y={PAD_T}
                width={xToPx(params.warmupSteps, totalSteps) - PAD_L}
                height={PLOT_H}
                fill="var(--warning)"
                opacity="0.08"
              />
              <line
                x1={xToPx(params.warmupSteps, totalSteps)}
                y1={PAD_T}
                x2={xToPx(params.warmupSteps, totalSteps)}
                y2={H - PAD_B}
                stroke="var(--warning)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.6"
              />
              <text
                x={xToPx(params.warmupSteps, totalSteps) + 4}
                y={PAD_T + 11}
                fontSize="9.5"
                fill="var(--warning)"
                fontFamily="var(--mono)"
                opacity="0.9"
                letterSpacing="0.08em"
              >
                warmup {fmtStep(params.warmupSteps)}
              </text>
            </g>
          )}

          {/* ghost curves (the two non-active decays) */}
          {DECAYS.map((d) =>
            d.id !== decay ? (
              <path
                key={`ghost-${d.id}`}
                d={paths[d.id]}
                fill="none"
                stroke={d.color}
                strokeWidth="1.2"
                strokeDasharray="3 4"
                opacity="0.4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null
          )}

          {/* active curve */}
          <path
            d={paths[decay]}
            fill="none"
            stroke={DECAYS.find((d) => d.id === decay).color}
            strokeWidth="2.2"
            strokeOpacity="0.98"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* current step marker */}
          {(() => {
            const cx = xToPx(step, totalSteps);
            const cy = yToPx(currentLr, yMax);
            return (
              <g>
                <line
                  x1={cx}
                  y1={PAD_T}
                  x2={cx}
                  y2={H - PAD_B}
                  stroke={phaseColor}
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.55"
                />
                <circle cx={cx} cy={cy} r="6" fill="none" stroke={phaseColor} strokeWidth="1.4" opacity="0.85" />
                <circle cx={cx} cy={cy} r="3" fill={phaseColor} />
              </g>
            );
          })()}

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
            learning rate
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem', letterSpacing: '0.08em' }}>
            <TrendingDown size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            decay shape
          </span>
          {DECAYS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`mlviz-toggle ${decay === d.id ? 'is-on' : ''}`}
              style={{ '--toggle-color': d.color }}
              onClick={() => setDecay(d.id)}
            >
              <span className="mlviz-toggle-dot" />
              <span>{d.label}</span>
            </button>
          ))}
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              warmup steps
            </span>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={Math.min(warmupSteps, 2000)}
              onChange={(e) => setWarmupSteps(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{fmtStep(effectiveWarmup)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">total steps</span>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={totalSteps}
              onChange={(e) => setTotalSteps(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{fmtStep(totalSteps)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">peak LR</span>
            <input
              type="range"
              min="0.0001"
              max="0.01"
              step="0.0001"
              value={peakLr}
              onChange={(e) => setPeakLr(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{fmtLr(peakLr)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">min LR</span>
            <input
              type="range"
              min="0"
              max="0.001"
              step="0.00001"
              value={Math.min(minLr, 0.001)}
              onChange={(e) => setMinLr(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{fmtLr(effectiveMin)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>phase</span>
            <span className="mlviz-val" style={{ color: phaseColor, fontWeight: 800 }}>{phaseLabel}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>step</span>
            <span className="mlviz-val" style={{ color: 'var(--text-main)', fontWeight: 800 }}>
              {fmtStep(step)} / {fmtStep(totalSteps)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>LR</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>{fmtLr(currentLr)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              {((currentLr / Math.max(peakLr, 1e-12)) * 100).toFixed(1)}% of peak
            </span>
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={togglePlay}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : step >= totalSteps ? 'Replay' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => { setPlaying(false); setStep(0); }}>
            <span>Rewind</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={resetAll}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            ghost lines = other decay shapes
          </span>
        </div>

        <div className="mlviz-hint">
          Warmup ramps LR linearly to peak so early random weights don't get blown up. Cosine + warmup is the modern default for transformers — linear decays harder upfront; polynomial p=2 holds high LR longer.
        </div>
      </div>
    </div>
  );
}
