import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Play, Pause, Gauge, Sigma, Activity } from 'lucide-react';
import './NumQuadratureViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const A = 0;
const B = 4;
// Fixed smooth, strictly-positive integrand on [A, B].
function f(x) {
  return 1.4 + Math.sin(x) + 0.35 * Math.sin(2.5 * x);
}

// Reference "true" value via a very fine Simpson rule (deterministic, no analytic form needed).
function fineIntegral() {
  const n = 2000;
  const h = (B - A) / n;
  let total = f(A) + f(B);
  for (let i = 1; i < n; i++) total += (i % 2 ? 4 : 2) * f(A + i * h);
  return (total * h) / 3;
}

function trapezoidValue(n) {
  const h = (B - A) / n;
  let total = 0.5 * (f(A) + f(B));
  for (let i = 1; i < n; i++) total += f(A + i * h);
  return total * h;
}

function simpsonValue(n) {
  const h = (B - A) / n;
  let total = f(A) + f(B);
  for (let i = 1; i < n; i++) total += (i % 2 ? 4 : 2) * f(A + i * h);
  return (total * h) / 3;
}

// Quadratic Lagrange interpolant through three points, evaluated at x.
function lagrange3(x, x0, y0, x1, y1, x2, y2) {
  const l0 = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2));
  const l1 = ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2));
  const l2 = ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
  return y0 * l0 + y1 * l1 + y2 * l2;
}

const W = 760;
const H = 320;
const padL = 34;
const padR = 22;
const padT = 20;
const padB = 34;
const plotW = W - padL - padR;
const plotH = H - padT - padB;

export default function NumQuadratureViz() {
  const [mode, setMode] = useState('simpson');
  const [nRaw, setNRaw] = useState(6);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const timerRef = useRef(null);

  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Simpson consumes points in panels of two strips -> force an even count.
  const n = mode === 'simpson' ? Math.max(2, nRaw - (nRaw % 2)) : Math.max(1, nRaw);

  const truth = useMemo(() => fineIntegral(), []);

  const approx = mode === 'simpson' ? simpsonValue(n) : trapezoidValue(n);
  const absErr = Math.abs(approx - truth);

  const reset = () => {
    setPlaying(false);
    setMode('simpson');
    setNRaw(6);
    setSpeed(1.5);
  };

  useEffect(() => {
    if (!playing) return undefined;
    const stepMs = Math.max(120, 900 / speed);
    timerRef.current = window.setInterval(() => {
      setNRaw((prev) => {
        const next = prev + (mode === 'simpson' ? 2 : 1);
        if (next >= 40) {
          setPlaying(false);
          return 40;
        }
        return next;
      });
    }, stepMs);
    return () => window.clearInterval(timerRef.current);
  }, [playing, speed, mode]);

  useEffect(() => () => window.clearInterval(timerRef.current), []);

  // Vertical scale from the curve's peak, with headroom.
  const ymax = useMemo(() => {
    let m = 0;
    for (let i = 0; i <= 400; i++) {
      const x = A + ((B - A) * i) / 400;
      m = Math.max(m, f(x));
    }
    return m * 1.12;
  }, []);

  const sx = useCallback((x) => padL + ((x - A) / (B - A)) * plotW, []);
  const sy = useCallback((y) => padT + plotH - (Math.max(0, y) / ymax) * plotH, [ymax]);
  const baseY = useMemo(() => sy(0), [sy]);

  // Smooth true-curve path (filled area + stroke).
  const curve = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const x = A + ((B - A) * i) / 240;
      pts.push([sx(x), sy(f(x))]);
    }
    const stroke = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    const fill = `M${sx(A).toFixed(2)},${baseY.toFixed(2)} ` + stroke.slice(1)
      + ` L${sx(B).toFixed(2)},${baseY.toFixed(2)} Z`;
    return { stroke, fill };
  }, [sx, sy, baseY]);

  // Approximating shapes.
  const shapes = useMemo(() => {
    const h = (B - A) / n;
    const out = [];
    if (mode === 'trapezoid') {
      for (let i = 0; i < n; i++) {
        const xa = A + i * h;
        const xb = A + (i + 1) * h;
        out.push(
          `M${sx(xa).toFixed(2)},${baseY.toFixed(2)}`
          + ` L${sx(xa).toFixed(2)},${sy(f(xa)).toFixed(2)}`
          + ` L${sx(xb).toFixed(2)},${sy(f(xb)).toFixed(2)}`
          + ` L${sx(xb).toFixed(2)},${baseY.toFixed(2)} Z`,
        );
      }
    } else {
      const S = 18;
      for (let p = 0; p < n / 2; p++) {
        const x0 = A + 2 * p * h;
        const x1 = x0 + h;
        const x2 = x0 + 2 * h;
        const y0 = f(x0);
        const y1 = f(x1);
        const y2 = f(x2);
        let d = `M${sx(x0).toFixed(2)},${baseY.toFixed(2)}`;
        for (let s = 0; s <= S; s++) {
          const x = x0 + ((x2 - x0) * s) / S;
          const y = lagrange3(x, x0, y0, x1, y1, x2, y2);
          d += ` L${sx(x).toFixed(2)},${sy(y).toFixed(2)}`;
        }
        d += ` L${sx(x2).toFixed(2)},${baseY.toFixed(2)} Z`;
        out.push(d);
      }
    }
    return out;
  }, [mode, n, sx, sy, baseY]);

  const nodes = useMemo(() => {
    const h = (B - A) / n;
    const arr = [];
    for (let i = 0; i <= n; i++) {
      const x = A + i * h;
      arr.push([sx(x), sy(f(x))]);
    }
    return arr;
  }, [n, sx, sy]);

  const errPct = truth > 0 ? (absErr / truth) * 100 : 0;
  // Log-scaled error bar: 1e-6 .. 1 maps to 0..1.
  const errBar = Math.min(1, Math.max(0, (Math.log10(Math.max(absErr, 1e-7)) + 6) / 6));

  const orderTex = mode === 'simpson' ? 'O(h^4)' : 'O(h^2)';
  const ruleTex = mode === 'simpson'
    ? '\\tfrac{h}{3}\\,(f_0+4f_1+2f_2+\\cdots+4f_{n-1}+f_n)'
    : '\\tfrac{h}{2}\\,(f_0+2f_1+2f_2+\\cdots+2f_{n-1}+f_n)';

  return (
    <div className="numquad">
      <div className="numquad-head">
        <div className="numquad-head-icon"><Sigma size={18} /></div>
        <div className="numquad-head-text">
          <h3 className="numquad-title">Trapezoid vs. Simpson: approximating the area under a curve</h3>
          <p className="numquad-sub">
            The shaded region is the exact integral{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\int_a^b f(x)\\,dx') }} />. Each panel approximates it with a
            straight-topped trapezoid or a fitted parabola. Raise{' '}
            <span dangerouslySetInnerHTML={{ __html: km('n') }} /> and watch Simpson&rsquo;s error collapse far faster.
          </p>
        </div>
        <button type="button" className="numquad-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="numquad-toggle" role="group" aria-label="quadrature rule">
        <button
          type="button"
          className={`numquad-seg ${mode === 'trapezoid' ? 'is-active' : ''}`}
          onClick={() => setMode('trapezoid')}
        >
          Trapezoid <span className="numquad-seg-tag" dangerouslySetInnerHTML={{ __html: km('O(h^2)') }} />
        </button>
        <button
          type="button"
          className={`numquad-seg ${mode === 'simpson' ? 'is-active' : ''}`}
          onClick={() => setMode('simpson')}
        >
          Simpson <span className="numquad-seg-tag" dangerouslySetInnerHTML={{ __html: km('O(h^4)') }} />
        </button>
      </div>

      <div className="numquad-controls">
        <label className="numquad-slider">
          <span className="numquad-slider-key">subintervals <span dangerouslySetInnerHTML={{ __html: km('n') }} /></span>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={nRaw}
            onChange={(e) => { setPlaying(false); setNRaw(parseInt(e.target.value, 10)); }}
          />
          <span className="numquad-slider-val">{n}{mode === 'simpson' && nRaw % 2 ? ' (even)' : ''}</span>
        </label>

        <button
          type="button"
          className="numquad-play"
          onClick={() => setPlaying((v) => !v)}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : 'Play'}
        </button>

        <label className="numquad-slider numquad-speed">
          <span className="numquad-slider-key"><Gauge size={13} /> speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span className="numquad-slider-val">{speed.toFixed(1)}x</span>
        </label>
      </div>

      <div className="numquad-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="numquad-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="numquad-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky)" />
              <stop offset="50%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="numquad-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <line x1={padL} y1={baseY} x2={W - padR} y2={baseY} className="numquad-axis" />

          <path d={curve.fill} className="numquad-truefill" />

          {shapes.map((d, i) => (
            <path
              key={i}
              d={d}
              className={`numquad-panel ${mode === 'simpson' ? 'numquad-panel-simp' : 'numquad-panel-trap'} ${reduced ? '' : 'numquad-anim'}`}
            />
          ))}

          <path d={curve.stroke} className="numquad-curve" filter="url(#numquad-glow)" />

          {nodes.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={3.2} className="numquad-node" />
          ))}

          <text x={padL} y={H - 10} className="numquad-tick">a = {A}</text>
          <text x={W - padR} y={H - 10} className="numquad-tick" textAnchor="end">b = {B}</text>
        </svg>
      </div>

      <div className="numquad-stats">
        <div className="numquad-statcard numquad-approx">
          <span className="numquad-stat-label"><Activity size={12} /> approximation ({mode})</span>
          <span className="numquad-stat-val">{approx.toFixed(7)}</span>
        </div>
        <div className="numquad-statcard numquad-true">
          <span className="numquad-stat-label">true value</span>
          <span className="numquad-stat-val">{truth.toFixed(7)}</span>
        </div>
        <div className="numquad-statcard numquad-err">
          <span className="numquad-stat-label">absolute error</span>
          <span className="numquad-stat-val">{absErr.toExponential(2)}</span>
          <span className="numquad-stat-sub">{errPct.toFixed(4)}% of true</span>
          <div className="numquad-errbar">
            <div
              className={`numquad-errbar-fill ${reduced ? '' : 'numquad-anim-w'}`}
              style={{ width: `${errBar * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="numquad-formula">
        <span className="numquad-formula-label"><Sigma size={12} /> active rule &amp; error order</span>
        <span
          className="numquad-formula-math"
          dangerouslySetInnerHTML={{ __html: km(`\\int_a^b f\\approx ${ruleTex}\\quad\\text{error }=${orderTex}`, true) }}
        />
      </div>

      <div className="numquad-trace">
        <span className="numquad-trace-label">reading</span>
        <span className="numquad-trace-body">
          {mode === 'simpson'
            ? `Simpson fits a parabola across every pair of strips, capturing curvature the straight line misses. With n = ${n} its error is ${absErr.toExponential(2)}; each time you double n it falls about 16x (O(h^4)). Switch to Trapezoid at the same n to see the error jump by orders of magnitude.`
            : `Trapezoid caps each strip with a straight line, so it can only miss by the curvature it ignores. With n = ${n} its error is ${absErr.toExponential(2)}; doubling n cuts it about 4x (O(h^2)). Switch to Simpson at the same n and the same samples deliver a far smaller error.`}
        </span>
      </div>
    </div>
  );
}
