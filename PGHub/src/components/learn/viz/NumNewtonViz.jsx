import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { Play, Pause, StepForward, RotateCcw, Gauge, TrendingDown } from 'lucide-react';
import './NumNewtonViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// f(x) = x^2 - 2, root sqrt(2); derivative 2x. Deterministic, no randomness.
const f = (x) => x * x - 2;
const df = (x) => 2 * x;
const ROOT = Math.SQRT2;

const PRESETS = {
  good: { x0: 2.6, label: 'Good start (x₀ = 2.6)' },
  far: { x0: 4.4, label: 'Far start (x₀ = 4.4)' },
  flat: { x0: 0.05, label: 'Near f′≈0 (x₀ = 0.05)' },
};

const X_MIN = -0.6;
const X_MAX = 4.8;
const Y_MIN = -3.2;
const Y_MAX = 8.5;

// SVG geometry
const W = 720;
const Hs = 380;
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

function buildIterates(x0, steps = 8) {
  const xs = [x0];
  let x = x0;
  for (let i = 0; i < steps; i++) {
    const d = df(x);
    if (d === 0 || !isFinite(x)) break;
    const nx = x - f(x) / d;
    if (!isFinite(nx)) break;
    xs.push(nx);
    x = nx;
    if (Math.abs(f(x)) < 1e-14) break;
  }
  return xs;
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function NumNewtonViz() {
  const [x0, setX0] = useState(PRESETS.good.x0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timer = useRef(null);

  const iterates = useMemo(() => buildIterates(x0, 8), [x0]);
  const maxStep = iterates.length - 1;
  const reduced = prefersReduced();

  const reset = () => {
    setStep(0);
    setPlaying(false);
  };

  const doStep = () => {
    setStep((s) => Math.min(s + 1, maxStep));
  };

  const pickStart = (v) => { setX0(v); setStep(0); setPlaying(false); };

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

  const xn = iterates[Math.min(step, maxStep)];
  const fxn = f(xn);
  const err = Math.abs(xn - ROOT);
  const nextX = step < maxStep ? iterates[step + 1] : null;

  // curve polyline
  const curvePts = useMemo(() => {
    const pts = [];
    const N = 160;
    for (let i = 0; i <= N; i++) {
      const x = X_MIN + (i / N) * (X_MAX - X_MIN);
      pts.push(`${sx(x).toFixed(2)},${sy(f(x)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, []);

  // error history bars
  const errHistory = useMemo(
    () => iterates.slice(0, step + 1).map((x) => Math.abs(x - ROOT)),
    [iterates, step]
  );
  const maxErr = Math.max(...errHistory, 1e-16);

  // tangent line endpoints across plot (clip to x range)
  const tangent = useMemo(() => {
    if (nextX === null) return null;
    const slope = df(xn);
    const y0 = fxn;
    // line: y = y0 + slope*(x - xn); draw from X_MIN..X_MAX
    const yL = y0 + slope * (X_MIN - xn);
    const yR = y0 + slope * (X_MAX - xn);
    return { x1: sx(X_MIN), y1: sy(yL), x2: sx(X_MAX), y2: sy(yR) };
  }, [xn, fxn, nextX]);

  const axisY0 = sy(0);
  const axisX0 = sx(0);

  const speed = SPEEDS[speedIdx];
  const converged = err < 1e-9;

  const orderTex = 'e_{n+1}\\approx C\\,e_n^{2}';
  const stepTex = `x_{n+1}=x_n-\\dfrac{f(x_n)}{f'(x_n)}`;

  return (
    <div className="numnewt">
      <div className="numnewt-head">
        <div className="numnewt-head-icon"><TrendingDown size={18} /></div>
        <div className="numnewt-head-text">
          <h3 className="numnewt-title">Newton&rsquo;s method: chasing the root down the tangent</h3>
          <p className="numnewt-sub">
            Drop a vertical from the guess to the curve{' '}
            <span dangerouslySetInnerHTML={{ __html: km('f(x)=x^2-2') }} />, ride the tangent to where it
            crosses zero, and that intercept is the next guess. Watch the error square each step.
          </p>
        </div>
        <button type="button" className="numnewt-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="numnewt-presets">
        {Object.entries(PRESETS).map(([key, pv]) => (
          <button
            key={key}
            type="button"
            className={`numnewt-chip${Math.abs(x0 - pv.x0) < 1e-9 ? ' numnewt-chip-on' : ''}`}
            onClick={() => pickStart(pv.x0)}
          >
            {pv.label}
          </button>
        ))}
      </div>

      <div className="numnewt-stage">
        <svg viewBox={`0 0 ${W} ${Hs}`} className="numnewt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="numnewt-curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="numnewt-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* axes */}
          <line x1={PAD_L} y1={axisY0} x2={W - PAD_R} y2={axisY0} className="numnewt-axis" />
          <line x1={axisX0} y1={PAD_T} x2={axisX0} y2={Hs - PAD_B} className="numnewt-axis" />
          <text x={W - PAD_R} y={axisY0 - 6} className="numnewt-axis-label" textAnchor="end">x</text>
          <text x={axisX0 + 6} y={PAD_T + 10} className="numnewt-axis-label">f(x)</text>

          {/* root marker */}
          <line x1={sx(ROOT)} y1={PAD_T} x2={sx(ROOT)} y2={Hs - PAD_B} className="numnewt-rootline" />
          <text x={sx(ROOT)} y={Hs - PAD_B + 22} className="numnewt-root-label" textAnchor="middle">
            root &radic;2
          </text>

          {/* curve, glow under + crisp over */}
          <polyline points={curvePts} className="numnewt-curve-glow" filter="url(#numnewt-glow)" />
          <polyline points={curvePts} className="numnewt-curve" />

          {/* tangent line */}
          {tangent && (
            <line
              x1={tangent.x1}
              y1={tangent.y1}
              x2={tangent.x2}
              y2={tangent.y2}
              className={`numnewt-tangent${reduced ? '' : ' numnewt-anim-line'}`}
            />
          )}

          {/* vertical from x_n to curve */}
          <line x1={sx(xn)} y1={axisY0} x2={sx(xn)} y2={sy(fxn)} className="numnewt-drop" />

          {/* point on curve */}
          <circle cx={sx(xn)} cy={sy(fxn)} r="5.5" className="numnewt-pt-curve" />

          {/* current guess on axis */}
          <circle cx={sx(xn)} cy={axisY0} r="6" className="numnewt-pt-axis" />
          <text x={sx(xn)} y={axisY0 + 20} className="numnewt-pt-label" textAnchor="middle">
            x{step}
          </text>

          {/* next guess */}
          {nextX !== null && (
            <>
              <circle cx={sx(nextX)} cy={axisY0} r="5" className="numnewt-pt-next" />
              <text x={sx(nextX)} y={axisY0 - 10} className="numnewt-pt-next-label" textAnchor="middle">
                x{step + 1}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="numnewt-controls">
        <button
          type="button"
          className="numnewt-btn numnewt-btn-primary"
          onClick={() => {
            if (step >= maxStep) { setStep(0); setPlaying(true); }
            else setPlaying((p) => !p);
          }}
          disabled={reduced}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="numnewt-btn"
          onClick={doStep}
          disabled={step >= maxStep}
        >
          <StepForward size={14} /> Step
        </button>
        <div className="numnewt-speed">
          <Gauge size={13} />
          <div className="numnewt-speed-opts">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                className={`numnewt-speed-btn${i === speedIdx ? ' numnewt-speed-on' : ''}`}
                onClick={() => setSpeedIdx(i)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <span className="numnewt-speed-note">{speed.label} &middot; iter {step}/{maxStep}</span>
      </div>

      <div className="numnewt-stats">
        <div className="numnewt-statcard numnewt-sc-iter">
          <span className="numnewt-stat-label">iteration</span>
          <span className="numnewt-stat-val">{step}</span>
          <span className="numnewt-stat-sub">of {maxStep} to converge</span>
        </div>
        <div className="numnewt-statcard numnewt-sc-x">
          <span className="numnewt-stat-label">current guess</span>
          <span className="numnewt-stat-val">{xn.toFixed(8)}</span>
          <span className="numnewt-stat-sub">x{step}</span>
        </div>
        <div className="numnewt-statcard numnewt-sc-f">
          <span className="numnewt-stat-label">residual f(x_n)</span>
          <span className="numnewt-stat-val">{fxn.toExponential(2)}</span>
          <span className="numnewt-stat-sub">wants 0</span>
        </div>
        <div className={`numnewt-statcard numnewt-sc-err${converged ? ' numnewt-sc-done' : ''}`}>
          <span className="numnewt-stat-label">error |x_n &minus; r|</span>
          <span className="numnewt-stat-val">{err.toExponential(2)}</span>
          <span className="numnewt-stat-sub">{converged ? 'converged' : 'squares each step'}</span>
        </div>
      </div>

      <div className="numnewt-errbars">
        <span className="numnewt-errbars-label">error history (log-scaled bars, quadratic drop)</span>
        <div className="numnewt-errbars-row">
          {errHistory.map((e, i) => {
            const logMax = Math.log10(maxErr + 1e-18);
            const logE = Math.log10(e + 1e-18);
            const frac = Math.max(0.02, (logE + 18) / (logMax + 18));
            return (
              <div key={i} className="numnewt-errbar-col">
                <div className="numnewt-errbar-track">
                  <div
                    className={`numnewt-errbar-fill${reduced ? '' : ' numnewt-anim-bar'}`}
                    style={{ height: `${frac * 100}%` }}
                  />
                </div>
                <span className="numnewt-errbar-idx">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="numnewt-formula">
        <span className="numnewt-formula-item" dangerouslySetInnerHTML={{ __html: km(stepTex, true) }} />
        <span className="numnewt-formula-item" dangerouslySetInnerHTML={{ __html: km(orderTex, true) }} />
      </div>

      <div className="numnewt-read">
        <span className="numnewt-read-body">
          {x0 < 0.5
            ? `Starting at x₀ = ${x0} sits almost on top of the minimum, where f′(x)=2x is tiny. The first tangent is nearly flat, so the step f/f′ flings the guess far to the right before it recovers — the "derivative near zero" failure mode, why Newton needs safeguarding.`
            : converged
            ? `Converged to √2 in ${step} steps. Notice the error column: it didn't shrink linearly, it collapsed — each value is roughly the square of the previous one. That doubling of correct digits is quadratic convergence, Newton's whole advantage over bisection.`
            : `From x₀ = ${x0}, each tangent intercept lands dramatically closer to the root. Step to watch the error square: an error near 10⁻¹ becomes 10⁻², then 10⁻⁴, then machine zero within a handful of iterations.`}
        </span>
      </div>
    </div>
  );
}
