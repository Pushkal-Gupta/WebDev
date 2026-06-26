import React, { useMemo, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, BarChart3, AlignVerticalJustifyStart } from 'lucide-react';
import './CalcRiemannViz.css';

// f(x) = x^2 on [0, 1]; true integral = 1/3.
function f(x) { return x * x; }
const A = 0;
const B = 1;
const TRUE_AREA = 1 / 3;

const X_MIN = 0;
const X_MAX = 1;
const Y_MIN = 0;
const Y_MAX = 1;

const SAMPLES = ['left', 'mid', 'right'];

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function riemann(n, where) {
  const dx = (B - A) / n;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const x = where === 'left' ? A + i * dx : where === 'right' ? A + (i + 1) * dx : A + (i + 0.5) * dx;
    total += f(x) * dx;
  }
  return total;
}

export default function CalcRiemannViz() {
  const [n, setN] = useState(6);
  const [where, setWhere] = useState('mid');

  const W = 760;
  const H = 420;
  const padL = 50;
  const padR = 24;
  const padT = 22;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const sx = useCallback((v) => padL + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((v) => padT + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);

  const sum = riemann(n, where);
  const err = sum - TRUE_AREA;

  const curvePath = useMemo(() => {
    const pts = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const xv = X_MIN + (i / steps) * (X_MAX - X_MIN);
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(xv).toFixed(2)} ${sy(f(xv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [sx, sy]);

  const rects = useMemo(() => {
    const dx = (B - A) / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      const xl = A + i * dx;
      const sample = where === 'left' ? xl : where === 'right' ? xl + dx : xl + dx / 2;
      const h = f(sample);
      out.push({ xl, xr: xl + dx, h, sample });
    }
    return out;
  }, [n, where]);

  const reset = () => { setN(6); setWhere('mid'); };

  return (
    <div className="crv">
      <div className="crv-head">
        <div className="crv-head-icon"><BarChart3 size={18} /></div>
        <div className="crv-head-text">
          <h3 className="crv-title">Riemann sum converging to the integral</h3>
          <p className="crv-sub">
            Approximate the area under <span dangerouslySetInnerHTML={{ __html: km('f(x) = x^2') }} /> on
            <span dangerouslySetInnerHTML={{ __html: km('[0,1]') }} /> with rectangles. Add slices and the
            staircase hugs the curve — the sum marches toward <span dangerouslySetInnerHTML={{ __html: km('\\tfrac{1}{3}') }} />.
          </p>
        </div>
        <button type="button" className="crv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="crv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="crv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="crv-rect-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.45)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.12)" />
            </linearGradient>
            <linearGradient id="crv-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-pink)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="crv-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={padL} y={padT} width={plotW} height={plotH} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* rectangles */}
          {rects.map((r, i) => {
            const x = sx(r.xl);
            const w = sx(r.xr) - sx(r.xl);
            const top = sy(r.h);
            const base = sy(0);
            return (
              <g key={i}>
                <rect x={x} y={top} width={Math.max(0.5, w - 1)} height={base - top}
                  fill="url(#crv-rect-grad)" stroke="var(--accent)" strokeWidth={n > 40 ? 0.4 : 1} />
                <circle cx={sx(r.sample)} cy={sy(r.h)} r={n > 30 ? 0 : 2.4} fill="var(--accent)" />
              </g>
            );
          })}

          {/* the curve on top */}
          <path d={curvePath} fill="none" stroke="url(#crv-curve-grad)" strokeWidth={2.6} filter="url(#crv-glow)" />

          {/* axes */}
          <line x1={padL} y1={sy(0)} x2={padL + plotW} y2={sy(0)} stroke="var(--text-dim)" strokeWidth={1} />
          <text x={sx(0)} y={padT + plotH + 26} className="crv-axis-lbl" textAnchor="middle">0</text>
          <text x={sx(1)} y={padT + plotH + 26} className="crv-axis-lbl" textAnchor="middle">1</text>
          <text x={padL - 8} y={sy(1) + 4} className="crv-axis-lbl" textAnchor="end">1</text>
        </svg>
      </div>

      <div className="crv-controls">
        <label className="crv-slider">
          <span><AlignVerticalJustifyStart size={13} /> rectangles N</span>
          <input type="range" min={1} max={80} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
          <span className="crv-slider-val">{n}</span>
        </label>
        <div className="crv-seg">
          {SAMPLES.map((s) => (
            <button key={s} type="button" className={`crv-seg-btn ${where === s ? 'crv-seg-on' : ''}`} onClick={() => setWhere(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="crv-stats">
        <div className="crv-statcard crv-accent">
          <span className="crv-stat-label">Riemann sum</span>
          <span className="crv-stat-val" dangerouslySetInnerHTML={{ __html: km(`S_{${n}} = ${sum.toFixed(5)}`) }} />
        </div>
        <div className="crv-statcard crv-green">
          <span className="crv-stat-label">true integral</span>
          <span className="crv-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\int_0^1 x^2\\,dx = ${TRUE_AREA.toFixed(5)}`) }} />
        </div>
        <div className="crv-statcard">
          <span className="crv-stat-label">error</span>
          <span className="crv-stat-val" dangerouslySetInnerHTML={{ __html: km(`${err >= 0 ? '+' : ''}${err.toFixed(5)}`) }} />
        </div>
        <div className="crv-statcard">
          <span className="crv-stat-label">strip width</span>
          <span className="crv-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\Delta x = ${(1 / n).toFixed(4)}`) }} />
        </div>
      </div>

      <div className="crv-trace">
        <span className="crv-trace-label">reading</span>
        <span className="crv-trace-body">
          {`${n} ${where}-sample rectangle${n === 1 ? '' : 's'} give ${sum.toFixed(5)}, ${Math.abs(err).toFixed(5)} ${err >= 0 ? 'above' : 'below'} the true area 1/3. ${n >= 60 ? 'The staircase already tracks the curve tightly.' : 'Slide N higher and the error shrinks toward zero.'}`}
        </span>
      </div>
    </div>
  );
}
