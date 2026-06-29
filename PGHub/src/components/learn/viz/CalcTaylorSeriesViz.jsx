import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import katex from 'katex';
import { Play, Pause, RotateCcw, Sigma, Hash } from 'lucide-react';
import './CalcTaylorSeriesViz.css';

// Target: sin(x) on [-pi, pi]. Maclaurin series uses only odd powers.
const X_MIN = -Math.PI;
const X_MAX = Math.PI;
const Y_MIN = -1.6;
const Y_MAX = 1.6;

// Highest ODD order term index we animate up to. p sweeps 0..MAX_ORDERS.
const MAX_ORDERS = 8; // 8 odd terms => up to x^15
const SAMPLE_X = 2.0; // probe point for the value readout
const CYCLE_MS = 9000; // one full sweep of the partial-sum order

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// k-th odd term of sin's Maclaurin series via recurrence on the term value.
// term_0 = x ; term_j = term_{j-1} * (-x^2) / ((2j)(2j+1))
function taylorSin(x, orders, frac = 1) {
  if (orders <= 0) return 0;
  const x2 = x * x;
  let term = x;
  let total = term;
  const whole = Math.floor(orders);
  for (let j = 1; j < whole; j++) {
    term *= -x2 / ((2 * j) * (2 * j + 1));
    total += term;
  }
  // smoothly blend the newest term in by the fractional part of p
  if (frac > 0 && whole >= 1 && whole < MAX_ORDERS) {
    term *= -x2 / ((2 * whole) * (2 * whole + 1));
    total += term * frac;
  }
  return total;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// LaTeX for the Maclaurin polynomial up to `orders` odd terms.
function polyLatex(orders) {
  const pieces = ['x'];
  const dens = ['', '6', '120', '5040', '362880', '39916800', '6227020800', '1307674368000'];
  for (let j = 1; j < orders && j < MAX_ORDERS; j++) {
    const sign = j % 2 === 1 ? '-' : '+';
    const p = 2 * j + 1;
    pieces.push(`${sign} \\dfrac{x^{${p}}}{${dens[j]}}`);
  }
  let body = pieces.join(' ');
  if (orders < MAX_ORDERS) body += ' - \\cdots';
  return `\\sin x \\approx ${body}`;
}

export default function CalcTaylorSeriesViz() {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [p, setP] = useState(reduced ? 5 : 0.001);
  const [playing, setPlaying] = useState(!reduced);

  const rafRef = useRef(null);
  const startRef = useRef(null);

  const W = 760;
  const H = 420;
  const padL = 46;
  const padR = 24;
  const padT = 22;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const sx = useCallback((v) => padL + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((v) => padT + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);

  // animation loop: sweep p from 0 to MAX_ORDERS, then loop.
  useEffect(() => {
    if (reduced || !playing) return undefined;
    const tick = (now) => {
      if (startRef.current == null) startRef.current = now;
      const elapsed = (now - startRef.current) % CYCLE_MS;
      const eased = easeInOut(elapsed / CYCLE_MS);
      setP(Math.max(0.001, eased * MAX_ORDERS));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [playing, reduced]);

  const orders = Math.max(1, Math.floor(p) + (p >= 1 ? 0 : 1));
  const frac = p - Math.floor(p);
  const shownOrders = Math.min(MAX_ORDERS, Math.max(1, Math.floor(p) || 1));

  const trueCurve = useMemo(() => {
    const pts = [];
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const xv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(xv).toFixed(2)} ${sy(Math.sin(xv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, sy]);

  const approxCurve = useMemo(() => {
    const pts = [];
    const steps = 160;
    const whole = Math.max(1, Math.floor(p) || 1);
    for (let i = 0; i <= steps; i++) {
      const xv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      let yv = taylorSin(xv, whole, frac);
      yv = Math.max(Y_MIN - 1, Math.min(Y_MAX + 1, yv));
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(xv).toFixed(2)} ${sy(yv).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, sy, p, frac]);

  // max error on the window between true sin and the partial sum
  const maxErr = useMemo(() => {
    const whole = Math.max(1, Math.floor(p) || 1);
    let m = 0;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const xv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      m = Math.max(m, Math.abs(Math.sin(xv) - taylorSin(xv, whole, frac)));
    }
    return m;
  }, [p, frac]);

  const sampleApprox = taylorSin(SAMPLE_X, Math.max(1, Math.floor(p) || 1), frac);
  const sampleTrue = Math.sin(SAMPLE_X);

  const onScrub = useCallback((e) => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setP(Number(e.target.value));
  }, []);

  const togglePlay = useCallback(() => {
    if (reduced) return;
    setPlaying((prev) => {
      const next = !prev;
      if (next) startRef.current = null;
      return next;
    });
  }, [reduced]);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setP(reduced ? 5 : 0.001);
    setPlaying(!reduced);
  }, [reduced]);

  const ticks = [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI];
  const tickLabels = ['-π', '-π/2', '0', 'π/2', 'π'];

  return (
    <div className="cts">
      <div className="cts-head">
        <div className="cts-head-icon"><Sigma size={18} /></div>
        <div className="cts-head-text">
          <h3 className="cts-title">Taylor polynomial closing in on the curve</h3>
          <p className="cts-sub">
            The faint dashed wave is <span dangerouslySetInnerHTML={{ __html: km('\\sin x') }} />. Each new term of its
            Maclaurin series adds a power of <span dangerouslySetInnerHTML={{ __html: km('x') }} /> and the bright polynomial
            hugs more of the curve outward from the center.
          </p>
        </div>
        <div className="cts-btn-row">
          <button type="button" className="cts-btn" onClick={togglePlay} disabled={reduced}>
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="cts-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>

      <div className="cts-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cts-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="cts-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky)" />
              <stop offset="50%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="cts-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={padL} y={padT} width={plotW} height={plotH} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* gridlines at the x ticks */}
          {ticks.map((t, i) => (
            <line key={`g${i}`} x1={sx(t)} y1={padT} x2={sx(t)} y2={padT + plotH}
              stroke="var(--border)" strokeWidth={t === 0 ? 1.2 : 0.6} strokeDasharray={t === 0 ? 'none' : '2 4'} />
          ))}
          {/* horizontal axis */}
          <line x1={padL} y1={sy(0)} x2={padL + plotW} y2={sy(0)} stroke="var(--text-dim)" strokeWidth={1} />

          {/* true sin: faint dashed */}
          <path d={trueCurve} fill="none" stroke="var(--text-dim)" strokeWidth={1.6}
            strokeDasharray="5 4" opacity={0.55} />

          {/* taylor partial sum: bright gradient */}
          <path d={approxCurve} fill="none" stroke="url(#cts-curve-grad)" strokeWidth={3} filter="url(#cts-glow)" />

          {/* center marker — the expansion point */}
          <circle cx={sx(0)} cy={sy(0)} r={4} fill="var(--hue-pink)" stroke="var(--bg)" strokeWidth={1.5} />

          {/* probe at SAMPLE_X */}
          <line x1={sx(SAMPLE_X)} y1={sy(sampleTrue)} x2={sx(SAMPLE_X)} y2={sy(sampleApprox)}
            stroke="var(--hue-pink)" strokeWidth={1.4} />
          <circle cx={sx(SAMPLE_X)} cy={sy(sampleTrue)} r={3.4} fill="var(--text-dim)" />
          <circle cx={sx(SAMPLE_X)} cy={sy(sampleApprox)} r={4} fill="var(--accent)" stroke="var(--bg)" strokeWidth={1.4} />

          {/* x tick labels */}
          {ticks.map((t, i) => (
            <text key={`tl${i}`} x={sx(t)} y={padT + plotH + 24} className="cts-axis-lbl" textAnchor="middle">
              {tickLabels[i]}
            </text>
          ))}
          <text x={padL - 8} y={sy(1) + 4} className="cts-axis-lbl" textAnchor="end">1</text>
          <text x={padL - 8} y={sy(-1) + 4} className="cts-axis-lbl" textAnchor="end">-1</text>
        </svg>
      </div>

      <div className="cts-controls">
        <label className="cts-slider">
          <span><Hash size={13} /> terms</span>
          <input type="range" min={1} max={MAX_ORDERS} step={0.01} value={p} onChange={onScrub} />
          <span className="cts-slider-val">{shownOrders}</span>
        </label>
      </div>

      <div className="cts-formula" dangerouslySetInnerHTML={{ __html: km(polyLatex(shownOrders), true) }} />

      <div className="cts-stats">
        <div className="cts-statcard cts-accent">
          <span className="cts-stat-label">terms kept</span>
          <span className="cts-stat-val" dangerouslySetInnerHTML={{ __html: km(`n = ${shownOrders}`) }} />
        </div>
        <div className="cts-statcard cts-pink">
          <span className="cts-stat-label">max error on window</span>
          <span className="cts-stat-val" dangerouslySetInnerHTML={{ __html: km(`${maxErr.toFixed(4)}`) }} />
        </div>
        <div className="cts-statcard">
          <span className="cts-stat-label">{`approx at x=${SAMPLE_X}`}</span>
          <span className="cts-stat-val" dangerouslySetInnerHTML={{ __html: km(`${sampleApprox.toFixed(4)}`) }} />
        </div>
        <div className="cts-statcard cts-violet">
          <span className="cts-stat-label">{`true sin(${SAMPLE_X})`}</span>
          <span className="cts-stat-val" dangerouslySetInnerHTML={{ __html: km(`${sampleTrue.toFixed(4)}`) }} />
        </div>
      </div>

      <div className="cts-trace">
        <span className="cts-trace-label">reading</span>
        <span className="cts-trace-body">
          {`${shownOrders} term${shownOrders === 1 ? '' : 's'} of the Maclaurin series for sin x. ` +
            `Worst gap from the true curve across [-pi, pi] is ${maxErr.toFixed(4)}. ` +
            (maxErr < 0.01
              ? 'The polynomial now tracks sin x across the whole window.'
              : `The fit is tight near 0 and frays at the edges${orders < MAX_ORDERS ? ' — add terms to push the agreement outward.' : '.'}`)}
        </span>
      </div>
    </div>
  );
}
