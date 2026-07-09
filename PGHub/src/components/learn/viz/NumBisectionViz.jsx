import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { Play, Pause, StepForward, RotateCcw, Gauge, Scissors } from 'lucide-react';
import './NumBisectionViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// f(x) = x^2 - 2, root sqrt(2) in [1, 2]. Deterministic.
const f = (x) => x * x - 2;
const ROOT = Math.SQRT2;

const START = { a: 1, b: 2 };

const X_MIN = 0.6;
const X_MAX = 2.4;
const Y_MIN = -1.6;
const Y_MAX = 4.2;

const W = 720;
const Hs = 360;
const PAD_L = 46;
const PAD_R = 20;
const PAD_T = 18;
const PAD_B = 34;
const plotW = W - PAD_L - PAD_R;
const plotH = Hs - PAD_T - PAD_B;

const sx = (x) => PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
const sy = (y) => PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

const SPEEDS = [
  { label: '0.5x', ms: 1600 },
  { label: '1x', ms: 900 },
  { label: '2x', ms: 450 },
];

function buildBrackets(a0, b0, steps = 14) {
  const out = [{ a: a0, b: b0 }];
  let a = a0;
  let b = b0;
  let fa = f(a);
  for (let i = 0; i < steps; i++) {
    const m = 0.5 * (a + b);
    const fm = f(m);
    if (fa * fm < 0) {
      b = m;
    } else {
      a = m;
      fa = fm;
    }
    out.push({ a, b });
    if (Math.abs(fm) < 1e-13 || 0.5 * (b - a) < 1e-13) break;
  }
  return out;
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function NumBisectionViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timer = useRef(null);

  const brackets = useMemo(() => buildBrackets(START.a, START.b, 14), []);
  const maxStep = brackets.length - 1;
  const reduced = prefersReduced();

  const reset = () => { setStep(0); setPlaying(false); };
  const doStep = () => setStep((s) => Math.min(s + 1, maxStep));

  useEffect(() => {
    if (!playing || reduced || step >= maxStep) return undefined;
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= maxStep) setPlaying(false);
        return Math.min(s + 1, maxStep);
      });
    }, SPEEDS[speedIdx].ms);
    return () => clearInterval(timer.current);
  }, [playing, speedIdx, maxStep, step, reduced]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const { a, b } = brackets[Math.min(step, maxStep)];
  const m = 0.5 * (a + b);
  const fm = f(m);
  const width = b - a;
  const converged = width < 1e-9;

  const curvePts = useMemo(() => {
    const pts = [];
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const x = X_MIN + (i / N) * (X_MAX - X_MIN);
      pts.push(`${sx(x).toFixed(2)},${sy(f(x)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, []);

  const widthHistory = useMemo(
    () => brackets.slice(0, step + 1).map((br) => br.b - br.a),
    [brackets, step]
  );
  const maxWidth = Math.max(...widthHistory, 1e-16);

  const axisY0 = sy(0);
  const speed = SPEEDS[speedIdx];

  const shadeX = sx(a);
  const shadeW = sx(b) - sx(a);

  const widthTex = `\\text{width}=\\dfrac{b-a}{2^{n}}`;

  return (
    <div className="numbis">
      <div className="numbis-head">
        <div className="numbis-head-icon"><Scissors size={18} /></div>
        <div className="numbis-head-text">
          <h3 className="numbis-title">Bisection: halving a bracket until the root has nowhere to hide</h3>
          <p className="numbis-sub">
            A sign change on{' '}
            <span dangerouslySetInnerHTML={{ __html: km('[a,b]') }} /> guarantees a root of{' '}
            <span dangerouslySetInnerHTML={{ __html: km('f(x)=x^2-2') }} /> inside it. Keep the
            sign-changing half each step and the interval width halves &mdash; slow, but unbreakable.
          </p>
        </div>
        <button type="button" className="numbis-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="numbis-stage">
        <svg viewBox={`0 0 ${W} ${Hs}`} className="numbis-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="numbis-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="numbis-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* shaded bracket */}
          <rect
            x={shadeX}
            y={PAD_T}
            width={Math.max(0, shadeW)}
            height={plotH}
            className={`numbis-shade${reduced ? '' : ' numbis-anim-rect'}`}
          />

          {/* axes */}
          <line x1={PAD_L} y1={axisY0} x2={W - PAD_R} y2={axisY0} className="numbis-axis" />
          <text x={W - PAD_R} y={axisY0 - 6} className="numbis-axis-label" textAnchor="end">x</text>

          {/* root marker */}
          <line x1={sx(ROOT)} y1={PAD_T} x2={sx(ROOT)} y2={Hs - PAD_B} className="numbis-rootline" />
          <text x={sx(ROOT)} y={PAD_T + 10} className="numbis-root-label" textAnchor="middle">
            root &radic;2
          </text>

          {/* curve */}
          <polyline points={curvePts} className="numbis-curve-glow" filter="url(#numbis-glow)" />
          <polyline points={curvePts} className="numbis-curve" />

          {/* a, b, m verticals */}
          <line x1={sx(a)} y1={PAD_T} x2={sx(a)} y2={Hs - PAD_B} className="numbis-edge numbis-edge-a" />
          <line x1={sx(b)} y1={PAD_T} x2={sx(b)} y2={Hs - PAD_B} className="numbis-edge numbis-edge-b" />
          <line
            x1={sx(m)} y1={PAD_T} x2={sx(m)} y2={Hs - PAD_B}
            className={`numbis-edge numbis-edge-m${reduced ? '' : ' numbis-anim-line'}`}
          />

          {/* endpoint dots on axis + curve */}
          <circle cx={sx(a)} cy={axisY0} r="5" className="numbis-dot numbis-dot-a" />
          <circle cx={sx(b)} cy={axisY0} r="5" className="numbis-dot numbis-dot-b" />
          <circle cx={sx(m)} cy={sy(fm)} r="5.5" className="numbis-dot numbis-dot-m" />

          <text x={sx(a)} y={axisY0 + 20} className="numbis-lbl numbis-lbl-a" textAnchor="middle">a</text>
          <text x={sx(b)} y={axisY0 + 20} className="numbis-lbl numbis-lbl-b" textAnchor="middle">b</text>
          <text x={sx(m)} y={PAD_T + 22} className="numbis-lbl numbis-lbl-m" textAnchor="middle">m</text>
        </svg>
      </div>

      <div className="numbis-controls">
        <button
          type="button"
          className="numbis-btn numbis-btn-primary"
          onClick={() => {
            if (step >= maxStep) { setStep(0); setPlaying(true); }
            else setPlaying((p) => !p);
          }}
          disabled={reduced}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="numbis-btn" onClick={doStep} disabled={step >= maxStep}>
          <StepForward size={14} /> Step
        </button>
        <div className="numbis-speed">
          <Gauge size={13} />
          <div className="numbis-speed-opts">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                className={`numbis-speed-btn${i === speedIdx ? ' numbis-speed-on' : ''}`}
                onClick={() => setSpeedIdx(i)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <span className="numbis-speed-note">{speed.label} &middot; iter {step}/{maxStep}</span>
      </div>

      <div className="numbis-stats">
        <div className="numbis-statcard numbis-sc-a">
          <span className="numbis-stat-label">left a</span>
          <span className="numbis-stat-val">{a.toFixed(7)}</span>
          <span className="numbis-stat-sub">f(a) &lt; 0</span>
        </div>
        <div className="numbis-statcard numbis-sc-b">
          <span className="numbis-stat-label">right b</span>
          <span className="numbis-stat-val">{b.toFixed(7)}</span>
          <span className="numbis-stat-sub">f(b) &gt; 0</span>
        </div>
        <div className="numbis-statcard numbis-sc-m">
          <span className="numbis-stat-label">midpoint m &middot; sign f(m)</span>
          <span className="numbis-stat-val">{m.toFixed(7)}</span>
          <span className="numbis-stat-sub">f(m) = {fm.toExponential(2)} ({fm < 0 ? 'neg' : 'pos'})</span>
        </div>
        <div className={`numbis-statcard numbis-sc-w${converged ? ' numbis-sc-done' : ''}`}>
          <span className="numbis-stat-label">interval width</span>
          <span className="numbis-stat-val">{width.toExponential(2)}</span>
          <span className="numbis-stat-sub">{converged ? 'converged' : 'halves each step'}</span>
        </div>
      </div>

      <div className="numbis-wbars">
        <span className="numbis-wbars-label">interval width per step (each bar half the last &mdash; guaranteed)</span>
        <div className="numbis-wbars-row">
          {widthHistory.map((wv, i) => {
            const frac = Math.max(0.03, wv / maxWidth);
            return (
              <div key={i} className="numbis-wbar-col">
                <div className="numbis-wbar-track">
                  <div
                    className={`numbis-wbar-fill${reduced ? '' : ' numbis-anim-bar'}`}
                    style={{ height: `${frac * 100}%` }}
                  />
                </div>
                <span className="numbis-wbar-idx">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="numbis-formula">
        <span className="numbis-formula-item" dangerouslySetInnerHTML={{ __html: km(widthTex, true) }} />
        <span className="numbis-formula-note">
          after n steps the root is pinned to an interval 2ⁿ times smaller than the start &mdash; linear
          convergence, no assumptions about the function beyond one sign change.
        </span>
      </div>
    </div>
  );
}
