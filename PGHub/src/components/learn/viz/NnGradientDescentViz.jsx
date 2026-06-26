import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Play, Pause, SkipForward, TrendingDown, AlertTriangle, Check } from 'lucide-react';
import './NnGradientDescentViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// Loss L(w) = (w - 3)^2  (minimum at w = 3, L = 0). Gradient = 2(w - 3).
const MIN_W = 3;
const loss = (w) => (w - MIN_W) ** 2;
const grad = (w) => 2 * (w - MIN_W);
const START_W = -3.4;

const VB_W = 360;
const VB_H = 240;
const PAD_X = 30;
const PAD_Y = 22;
const W_LO = -5;
const W_HI = 11;
const L_HI = 64;
const plotW = VB_W - 2 * PAD_X;
const plotH = VB_H - 2 * PAD_Y;
const sx = (w) => PAD_X + ((w - W_LO) / (W_HI - W_LO)) * plotW;
const sy = (l) => PAD_Y + (1 - Math.min(l, L_HI) / L_HI) * plotH;

const curvePath = (() => {
  let d = '';
  for (let i = 0; i <= 140; i++) {
    const w = W_LO + (i / 140) * (W_HI - W_LO);
    d += `${i === 0 ? 'M' : 'L'}${sx(w).toFixed(2)},${sy(loss(w)).toFixed(2)} `;
  }
  return d.trim();
})();

function regime(eta) {
  if (eta < 0.08) return { key: 'undershoot', label: 'Undershoot — too slow', color: 'var(--warning)' };
  if (eta <= 0.6) return { key: 'good', label: 'Good — converges smoothly', color: 'var(--easy)' };
  if (eta < 1.0) return { key: 'overshoot', label: 'Overshoot — bounces but settles', color: 'var(--hue-violet)' };
  return { key: 'diverge', label: 'Diverges — loss explodes', color: 'var(--hard)' };
}

export default function NnGradientDescentViz() {
  const [eta, setEta] = useState(0.3);
  const [w, setW] = useState(START_W);
  const [steps, setSteps] = useState(0);
  const [trail, setTrail] = useState([START_W]);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(null);
  const last = useRef(0);

  const reduced = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const reg = regime(eta);
  const diverged = Math.abs(w) > 1e4 || !Number.isFinite(w);
  const converged = !diverged && Math.abs(grad(w)) < 1e-3;

  const stepOnce = () => {
    setW((prev) => {
      const next = prev - eta * grad(prev);
      setTrail((t) => (t.length > 60 ? [...t.slice(-60), next] : [...t, next]));
      return next;
    });
    setSteps((s) => s + 1);
  };

  const reset = () => {
    setPlaying(false);
    setW(START_W);
    setSteps(0);
    setTrail([START_W]);
  };

  useEffect(() => {
    if (!playing) return undefined;
    if (diverged || converged) { setPlaying(false); return undefined; }
    const interval = reduced ? 220 : 110;
    const tick = (ts) => {
      if (ts - last.current >= interval) {
        last.current = ts;
        stepOnce();
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, eta, diverged, converged, reduced]);

  const onEta = (v) => { setEta(v); reset(); };

  const ballW = diverged ? W_HI : Math.max(W_LO, Math.min(W_HI, w));
  const ballL = diverged ? L_HI : loss(w);
  const curLoss = diverged ? Infinity : loss(w);

  return (
    <div className="ngd">
      <div className="ngd-head">
        <div className="ngd-head-icon"><TrendingDown size={18} /></div>
        <div className="ngd-head-text">
          <h3 className="ngd-title">Gradient descent: roll the ball downhill, and let the learning rate decide its fate</h3>
          <p className="ngd-sub">
            Each step is <span dangerouslySetInnerHTML={{ __html: km('w \\leftarrow w - \\eta\\,\\nabla L') }} />.
            Slide <span dangerouslySetInnerHTML={{ __html: km('\\eta') }} /> to move between undershoot, a clean descent,
            overshoot, and full divergence.
          </p>
        </div>
        <button type="button" className="ngd-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="ngd-controls">
        <button type="button" className="ngd-btn ngd-btn-primary"
          disabled={diverged || converged}
          onClick={() => setPlaying((p) => !p)}>
          {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}
        </button>
        <button type="button" className="ngd-btn"
          disabled={playing || diverged || converged}
          onClick={stepOnce}><SkipForward size={13} /> Step</button>
        <span className="ngd-regime" style={{ color: reg.color, borderColor: `color-mix(in srgb, ${reg.color} 45%, var(--border))` }}>
          {reg.label}
        </span>
      </div>

      <div className="ngd-body">
        <div className="ngd-stage">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="ngd-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="ngd-curvefill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            <rect x={PAD_X} y={PAD_Y} width={plotW} height={plotH} rx={8} className="ngd-plot" />

            <path d={`${curvePath} L${sx(W_HI)},${sy(0)} L${sx(W_LO)},${sy(0)} Z`} fill="url(#ngd-curvefill)" stroke="none" />
            <path d={curvePath} className="ngd-curve" />

            {/* minimum marker */}
            <line x1={sx(MIN_W)} y1={sy(0)} x2={sx(MIN_W)} y2={PAD_Y} className="ngd-minline" />
            <text x={sx(MIN_W)} y={PAD_Y - 6} className="ngd-minlab" textAnchor="middle">min</text>

            {/* trail of past positions */}
            {trail.map((tw, i) => {
              if (!Number.isFinite(tw) || Math.abs(tw) > 1e4) return null;
              return <circle key={i} cx={sx(Math.max(W_LO, Math.min(W_HI, tw)))} cy={sy(loss(tw))} r={2.6}
                className="ngd-trail" style={{ opacity: 0.18 + 0.6 * (i / Math.max(1, trail.length - 1)) }} />;
            })}

            {/* tangent (gradient direction) at the ball */}
            {!diverged && Math.abs(ballW - MIN_W) > 0.05 && (() => {
              const g = grad(w);
              const dw = 1.0;
              const x1 = ballW - dw, x2 = ballW + dw;
              const y1 = loss(w) - g * dw, y2 = loss(w) + g * dw;
              return <line x1={sx(x1)} y1={sy(Math.max(0, y1))} x2={sx(x2)} y2={sy(Math.max(0, y2))} className="ngd-tangent" />;
            })()}

            {/* the ball */}
            <circle cx={sx(ballW)} cy={sy(ballL)} r={7} className="ngd-ball" />

            <text x={PAD_X + plotW - 4} y={sy(0) - 5} className="ngd-axlab" textAnchor="end">w</text>
            <text x={PAD_X + 4} y={PAD_Y + 11} className="ngd-axlab">loss</text>
          </svg>
        </div>

        <div className="ngd-side">
          <div className="ngd-readouts">
            <div className="ngd-stat">
              <span className="ngd-stat-lab">steps</span>
              <span className="ngd-stat-val">{steps}</span>
            </div>
            <div className="ngd-stat ngd-stat-loss">
              <span className="ngd-stat-lab">loss L(w)</span>
              <span className="ngd-stat-val">{diverged ? '∞' : curLoss.toFixed(4)}</span>
            </div>
            <div className="ngd-stat">
              <span className="ngd-stat-lab">w</span>
              <span className="ngd-stat-val">{diverged ? '—' : w.toFixed(3)}</span>
            </div>
          </div>

          <label className="ngd-slider">
            <span className="ngd-slider-lab">
              <span dangerouslySetInnerHTML={{ __html: km('\\text{learning rate }\\eta') }} />
              <span className="ngd-slider-val" style={{ color: reg.color }}>{eta.toFixed(2)}</span>
            </span>
            <input type="range" min={0.02} max={1.2} step={0.01} value={eta}
              onChange={(e) => onEta(parseFloat(e.target.value))} />
          </label>

          {diverged ? (
            <div className="ngd-flag ngd-flag-bad">
              <AlertTriangle size={13} /> Each step overshoots farther than the last — the loss climbs to infinity. Lower η.
            </div>
          ) : converged ? (
            <div className="ngd-flag ngd-flag-good">
              <Check size={13} /> Landed in the valley: gradient ≈ 0, loss ≈ 0. The ball stops on its own.
            </div>
          ) : (
            <div className="ngd-flag ngd-flag-info">
              <TrendingDown size={13} /> The tangent shows the local slope; the step moves opposite to it, shrinking the loss.
            </div>
          )}

          <div className="ngd-note">
            {reg.key === 'undershoot' && 'Tiny steps creep toward the minimum — safe but it can take hundreds of steps to arrive.'}
            {reg.key === 'good' && 'A well-chosen rate glides into the valley in a handful of steps without overshooting.'}
            {reg.key === 'overshoot' && 'Steps jump past the minimum and bounce across it, but each bounce is smaller, so it still settles.'}
            {reg.key === 'diverge' && 'With η ≥ 1 on this curve every step overshoots more than the last — the ball flies off and the loss explodes.'}
          </div>
        </div>
      </div>
    </div>
  );
}
