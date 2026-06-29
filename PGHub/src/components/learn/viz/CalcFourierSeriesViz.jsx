import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import katex from 'katex';
import { Play, Pause, RotateCcw, Waves } from 'lucide-react';
import './CalcFourierSeriesViz.css';

const MAX_HARM = 12; // number of odd harmonics at full ramp

const X_MIN = -Math.PI;
const X_MAX = Math.PI;
const Y_MIN = -1.6;
const Y_MAX = 1.6;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// k-th odd harmonic index (1, 3, 5, ...) for term j = 0,1,2,...
function oddK(j) { return 2 * j + 1; }

// square-wave partial sum using a fractional harmonic count: integer terms full,
// the newest one faded in by frac.
function partialSum(x, count) {
  const whole = Math.floor(count);
  const frac = count - whole;
  let total = 0;
  for (let j = 0; j < whole; j++) {
    const k = oddK(j);
    total += (4 / (Math.PI * k)) * Math.sin(k * x);
  }
  if (frac > 0) {
    const k = oddK(whole);
    total += frac * (4 / (Math.PI * k)) * Math.sin(k * x);
  }
  return total;
}

const HUES = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

export default function CalcFourierSeriesViz() {
  const reduced = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const [count, setCount] = useState(reduced ? 6 : 1);
  const [playing, setPlaying] = useState(!reduced);
  const [phase, setPhase] = useState(0); // drifting time for the epicycle inset
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const W = 760;
  const H = 440;
  const padL = 150; // leaves room for the epicycle inset on the left
  const padR = 24;
  const padT = 26;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const sx = useCallback((v) => padL + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((v) => padT + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);

  useEffect(() => {
    if (!playing || reduced) return undefined;
    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      // ramp harmonics up over ~9s, hold, then loop
      const cycle = 11;
      const t = elapsed % cycle;
      const ramp = t < 9 ? 1 + (MAX_HARM - 1) * (t / 9) : MAX_HARM;
      setCount(ramp);
      setPhase(elapsed * 0.6);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [playing, reduced]);

  const whole = Math.max(1, Math.round(count));

  // target square wave (faint reference)
  const squarePath = useMemo(() => {
    const seg = 200;
    const pts = [];
    for (let i = 0; i <= seg; i++) {
      const xv = X_MIN + (i / seg) * (X_MAX - X_MIN);
      const yv = xv >= 0 ? 1 : -1;
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(xv).toFixed(2)} ${sy(yv).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, sy]);

  // partial-sum bright curve
  const sumPath = useMemo(() => {
    const seg = 240;
    const pts = [];
    for (let i = 0; i <= seg; i++) {
      const xv = X_MIN + (i / seg) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(xv).toFixed(2)} ${sy(partialSum(xv, count)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, sy, count]);

  // peak overshoot (%) near the jump: sample fine grid just right of x=0
  const overshoot = useMemo(() => {
    let peak = 0;
    const seg = 400;
    for (let i = 0; i <= seg; i++) {
      const xv = 0.0001 + (i / seg) * 1.2; // window right of the jump
      peak = Math.max(peak, partialSum(xv, count));
    }
    return (peak - 1) * 100;
  }, [count]);

  const sampleX = Math.PI / 2;
  const sampleVal = partialSum(sampleX, count);

  // epicycle inset: stacked rotating circles tracing the wave at the current phase
  const inset = useMemo(() => {
    const cx = padL / 2 + 6;
    const cy = padT + plotH * 0.32;
    const scale = 26; // px per amplitude unit
    const circles = [];
    let px = cx;
    let py = cy;
    const tip = [];
    for (let j = 0; j < whole; j++) {
      const k = oddK(j);
      const amp = (4 / (Math.PI * k)) * scale;
      const ang = k * phase - Math.PI / 2; // align so vertical projection = sin
      circles.push({ cx: px, cy: py, r: amp, hue: HUES[j % HUES.length] });
      const nx = px + amp * Math.cos(ang);
      const ny = py + amp * Math.sin(ang);
      tip.push({ x1: px, y1: py, x2: nx, y2: ny });
      px = nx;
      py = ny;
    }
    return { circles, tip, tipX: px, tipY: py, cy, traceY: cy };
  }, [whole, phase, plotH]);

  const togglePlay = () => {
    if (!playing) startRef.current = null;
    setPlaying((p) => !p);
  };
  const onScrub = (e) => {
    setPlaying(false);
    setCount(Number(e.target.value));
  };
  const reset = () => {
    setPlaying(!reduced);
    setCount(reduced ? 6 : 1);
    setPhase(0);
    startRef.current = null;
  };

  const sumLatex = useMemo(() => {
    const terms = [];
    for (let j = 0; j < Math.min(whole, 4); j++) {
      const k = oddK(j);
      terms.push(k === 1 ? '\\sin x' : `\\tfrac{1}{${k}}\\sin ${k}x`);
    }
    let body = terms.join(' + ');
    if (whole > 4) body += ' + \\cdots';
    return `\\tfrac{4}{\\pi}\\left(${body}\\right)`;
  }, [whole]);

  return (
    <div className="cfs">
      <div className="cfs-head">
        <div className="cfs-head-icon"><Waves size={18} /></div>
        <div className="cfs-head-text">
          <h3 className="cfs-title">A square wave, one harmonic at a time</h3>
          <p className="cfs-sub">
            Stack the odd harmonics <span dangerouslySetInnerHTML={{ __html: km('\\sin x, \\tfrac{1}{3}\\sin 3x, \\tfrac{1}{5}\\sin 5x, \\dots') }} />
            and the wavy sum sharpens toward the flat square — except the
            <span dangerouslySetInnerHTML={{ __html: km('\\sim 9\\%') }} /> Gibbs overshoot beside each jump.
          </p>
        </div>
        <button type="button" className="cfs-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="cfs-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cfs-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="cfs-sum-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-pink)" />
              <stop offset="50%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--hue-sky)" />
            </linearGradient>
            <filter id="cfs-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={padL} y={padT} width={plotW} height={plotH} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* axes */}
          <line x1={padL} y1={sy(0)} x2={padL + plotW} y2={sy(0)} stroke="var(--text-dim)" strokeWidth={1} />
          <line x1={sx(0)} y1={padT} x2={sx(0)} y2={padT + plotH} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 4" />
          <line x1={padL} y1={sy(1)} x2={padL + plotW} y2={sy(1)} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="2 5" />
          <line x1={padL} y1={sy(-1)} x2={padL + plotW} y2={sy(-1)} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="2 5" />

          {/* faint target square wave */}
          <path d={squarePath} fill="none" stroke="var(--text-dim)" strokeWidth={1.6} strokeDasharray="6 5" opacity={0.7} />

          {/* bright partial sum */}
          <path d={sumPath} fill="none" stroke="url(#cfs-sum-grad)" strokeWidth={2.8} filter="url(#cfs-glow)" />

          {/* sample marker */}
          <circle cx={sx(sampleX)} cy={sy(sampleVal)} r={4.5} fill="var(--hue-mint)" stroke="var(--bg)" strokeWidth={1.5} />

          {/* axis labels */}
          <text x={sx(-Math.PI)} y={padT + plotH + 28} className="cfs-axis-lbl" textAnchor="middle">-π</text>
          <text x={sx(0)} y={padT + plotH + 28} className="cfs-axis-lbl" textAnchor="middle">0</text>
          <text x={sx(Math.PI)} y={padT + plotH + 28} className="cfs-axis-lbl" textAnchor="middle">π</text>
          <text x={padL - 8} y={sy(1) + 4} className="cfs-axis-lbl" textAnchor="end">+1</text>
          <text x={padL - 8} y={sy(-1) + 4} className="cfs-axis-lbl" textAnchor="end">-1</text>

          {/* epicycle inset */}
          <text x={padL / 2 + 6} y={padT + 10} className="cfs-inset-lbl" textAnchor="middle">epicycles</text>
          {inset.circles.map((c, i) => (
            <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={c.hue} strokeWidth={1} opacity={0.55} />
          ))}
          {inset.tip.map((t, i) => (
            <line key={`l${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--text-main)" strokeWidth={1.2} opacity={0.8} />
          ))}
          <circle cx={inset.tipX} cy={inset.tipY} r={3.4} fill="var(--hue-pink)" />
          {/* connector from epicycle tip to the curve's left edge */}
          <line x1={inset.tipX} y1={inset.tipY} x2={padL} y2={inset.tipY} stroke="var(--hue-pink)" strokeWidth={0.8} strokeDasharray="3 4" opacity={0.6} />
        </svg>
      </div>

      <div className="cfs-controls">
        <button type="button" className="cfs-play" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
        </button>
        <label className="cfs-slider">
          <span><Waves size={13} /> harmonics</span>
          <input type="range" min={1} max={MAX_HARM} step={0.1} value={count} onChange={onScrub} />
          <span className="cfs-slider-val">{whole}</span>
        </label>
      </div>

      <div className="cfs-stats">
        <div className="cfs-statcard cfs-accent">
          <span className="cfs-stat-label">odd harmonics</span>
          <span className="cfs-stat-val">{whole} · up to sin {oddK(whole - 1)}x</span>
        </div>
        <div className="cfs-statcard cfs-violet">
          <span className="cfs-stat-label">partial sum</span>
          <span className="cfs-stat-val" dangerouslySetInnerHTML={{ __html: km(sumLatex) }} />
        </div>
        <div className="cfs-statcard cfs-pink">
          <span className="cfs-stat-label">peak overshoot</span>
          <span className="cfs-stat-val" dangerouslySetInnerHTML={{ __html: km(`+${overshoot.toFixed(1)}\\%`) }} />
        </div>
        <div className="cfs-statcard cfs-mint">
          <span className="cfs-stat-label">value at x = π/2</span>
          <span className="cfs-stat-val" dangerouslySetInnerHTML={{ __html: km(sampleVal.toFixed(4)) }} />
        </div>
      </div>

      <div className="cfs-trace">
        <span className="cfs-trace-label">reading</span>
        <span className="cfs-trace-body">
          {`With ${whole} odd harmonic${whole === 1 ? '' : 's'} (up to sin ${oddK(whole - 1)}x), the sum reaches ${sampleVal.toFixed(4)} at x = π/2 versus the target +1. The corners steepen as harmonics pile on, yet the spike beside each jump holds near +${overshoot.toFixed(1)}% — the Gibbs overshoot that never goes away.`}
        </span>
      </div>
    </div>
  );
}
