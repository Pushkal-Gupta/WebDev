import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Play, Pause, Activity, Layers, Zap } from 'lucide-react';
import './NnBatchNormViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 14;           // neurons in the batch row
const STEPS = 60;       // timeline length
const DROP_P = 0.4;     // drop probability
const GAMMA = 1.15;     // learnable scale
const BETA = 0.35;      // learnable shift

// Per-step raw activations: an off-center, wide distribution that drifts a little each step.
function rawBatch(step) {
  const rand = mulberry32(1000 + step * 7);
  const drift = Math.sin(step * 0.12) * 0.8;
  const out = [];
  for (let i = 0; i < N; i++) {
    // base mean ~ 4.2, wide spread ~ 2.6, plus per-neuron structure
    const g = rand() + rand() + rand() - 1.5;   // approx normal, mean 0
    out.push(4.2 + drift + g * 2.6);
  }
  return out;
}

function stats(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const varr = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return { mean, std: Math.sqrt(varr) };
}

// Deterministic keep-mask per step (true = kept).
function keepMask(step) {
  const rand = mulberry32(9000 + step * 13);
  const m = [];
  for (let i = 0; i < N; i++) m.push(rand() > DROP_P);
  return m;
}

const VB_W = 380;
const VB_H = 230;
const PAD = 18;
const MID = VB_H / 2;              // zero baseline
const COL_W = (VB_W - 2 * PAD) / N;
const SCALE = 15;                 // px per unit value
const clampBar = (v) => Math.max(-6.2, Math.min(6.2, v));

export default function NnBatchNormViz() {
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const [bnOn, setBnOn] = useState(true);
  const raf = useRef(null);
  const last = useRef(0);

  const reduced = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const reset = () => { setStep(0); setPlaying(true); };

  useEffect(() => {
    if (!playing) return undefined;
    const interval = reduced ? 380 : 150;
    const tick = (ts) => {
      if (ts - last.current >= interval) {
        last.current = ts;
        setStep((s) => (s + 1) % STEPS);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, step, reduced]);

  const { raw, output, rawStats, outStats, mask, keptCount } = useMemo(() => {
    const r = rawBatch(step);
    const rs = stats(r);
    const out = r.map((v) => GAMMA * ((v - rs.mean) / Math.sqrt(rs.std ** 2 + 1e-5)) + BETA);
    const shownVals = bnOn ? out : r;
    const os = stats(shownVals);
    const mk = keepMask(step);
    return {
      raw: r,
      output: out,
      rawStats: rs,
      outStats: os,
      mask: mk,
      keptCount: mk.filter(Boolean).length,
    };
  }, [step, bnOn]);

  const shown = bnOn ? output : raw;

  const barY = (v) => (v >= 0 ? MID - clampBar(v) * SCALE : MID);
  const barH = (v) => Math.abs(clampBar(v)) * SCALE;

  return (
    <div className="nbn">
      <div className="nbn-head">
        <div className="nbn-head-icon"><Activity size={18} /></div>
        <div className="nbn-head-text">
          <h3 className="nbn-title">Batch norm recenters, dropout thins the layer</h3>
          <p className="nbn-sub">
            A batch of {N} activations, off-center and wide. Batch norm maps each to
            <span dangerouslySetInnerHTML={{ __html: km('\\;\\hat x=\\frac{x-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}},\\; y=\\gamma\\hat x+\\beta') }} />
            then dropout silences some units.
          </p>
        </div>
        <button type="button" className="nbn-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="nbn-controls">
        <button type="button" className="nbn-btn nbn-btn-primary"
          onClick={() => setPlaying((p) => !p)}>
          {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}
        </button>
        <button type="button"
          className={`nbn-chip ${bnOn ? 'is-on' : ''}`}
          style={bnOn
            ? { borderColor: 'var(--hue-mint)', color: 'var(--hue-mint)', background: 'color-mix(in srgb, var(--hue-mint) 12%, var(--surface))' }
            : undefined}
          onClick={() => setBnOn((b) => !b)}>
          <Layers size={13} /> Batch norm {bnOn ? 'on' : 'off'}
        </button>
        <label className="nbn-slider">
          <span className="nbn-slider-lab">
            <span>step</span>
            <span className="nbn-slider-val">{step}</span>
          </span>
          <input type="range" min={0} max={STEPS - 1} step={1} value={step}
            onChange={(e) => { setPlaying(false); setStep(parseInt(e.target.value, 10)); }} />
        </label>
      </div>

      <div className="nbn-body">
        <div className="nbn-stage">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="nbn-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="nbn-pos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--hue-sky)" stopOpacity="0.95" />
                <stop offset="100%" stopColor="var(--hue-violet)" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="nbn-neg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--hue-pink)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="var(--hue-pink)" stopOpacity="0.95" />
              </linearGradient>
              <filter id="nbn-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <rect x={PAD - 6} y={PAD - 6} width={VB_W - 2 * PAD + 12} height={VB_H - 2 * PAD + 12}
              rx={12} className="nbn-plot" />

            {/* zero baseline + mean line */}
            <line x1={PAD} y1={MID} x2={VB_W - PAD} y2={MID} className="nbn-axis" />
            {bnOn && (
              <line x1={PAD} y1={MID - BETA * SCALE} x2={VB_W - PAD} y2={MID - BETA * SCALE}
                className="nbn-betaline" />
            )}

            {shown.map((v, i) => {
              const kept = mask[i];
              const x = PAD + i * COL_W + COL_W * 0.16;
              const w = COL_W * 0.68;
              const y = barY(v);
              const h = Math.max(1.5, barH(v));
              const fill = v >= 0 ? 'url(#nbn-pos)' : 'url(#nbn-neg)';
              return (
                <g key={i} className={kept ? 'nbn-bar-g' : 'nbn-bar-g is-dropped'}>
                  <rect x={x} y={y} width={w} height={h} rx={2.5}
                    fill={kept ? fill : 'var(--border)'}
                    opacity={kept ? 1 : 0.28}
                    filter={kept ? 'url(#nbn-glow)' : undefined} />
                  {!kept && (
                    <line x1={x} y1={MID} x2={x + w} y2={MID} className="nbn-dropx" />
                  )}
                </g>
              );
            })}

            <text x={PAD + 2} y={PAD + 4} className="nbn-axlab">activation value</text>
            <text x={VB_W - PAD - 2} y={VB_H - PAD + 2} className="nbn-axlab" textAnchor="end">
              {N} neurons ({keptCount} kept)
            </text>
          </svg>
        </div>

        <div className="nbn-side">
          <div className="nbn-stat" style={{ borderTopColor: 'var(--hue-sky)' }}>
            <span className="nbn-stat-name" style={{ color: 'var(--hue-sky)' }}>
              <span className="nbn-dot" style={{ background: 'var(--hue-sky)' }} /> raw batch
            </span>
            <span className="nbn-stat-vals">
              &mu; {rawStats.mean.toFixed(2)} &nbsp; &sigma; {rawStats.std.toFixed(2)}
            </span>
          </div>
          <div className="nbn-stat" style={{ borderTopColor: bnOn ? 'var(--hue-mint)' : 'var(--border)' }}>
            <span className="nbn-stat-name" style={{ color: bnOn ? 'var(--hue-mint)' : 'var(--text-dim)' }}>
              <span className="nbn-dot" style={{ background: bnOn ? 'var(--hue-mint)' : 'var(--border)' }} />
              {bnOn ? 'after BN' : 'BN off'}
            </span>
            <span className="nbn-stat-vals">
              &mu; {outStats.mean.toFixed(2)} &nbsp; &sigma; {outStats.std.toFixed(2)}
            </span>
          </div>
          <div className="nbn-stat" style={{ borderTopColor: 'var(--hue-pink)' }}>
            <span className="nbn-stat-name" style={{ color: 'var(--hue-pink)' }}>
              <Zap size={12} /> dropout
            </span>
            <span className="nbn-stat-vals">
              {keptCount}/{N} kept &nbsp; p={DROP_P}
            </span>
          </div>

          <div className="nbn-note">
            {bnOn
              ? <>BN pulls the batch to <b>&mu;&asymp;{BETA.toFixed(2)}</b>, <b>&sigma;&asymp;{GAMMA.toFixed(2)}</b> via learnable &gamma;,&beta; — a fixed target every step. Dimmed bars are dropped neurons.</>
              : <>Without BN the mean drifts to <b>{rawStats.mean.toFixed(2)}</b> and the spread stays wide — downstream layers chase a moving target. Toggle BN back on.</>}
          </div>
        </div>
      </div>
    </div>
  );
}
