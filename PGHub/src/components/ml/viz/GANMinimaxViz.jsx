import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StepForward, RotateCcw } from 'lucide-react';
import './MLViz.css';

/*
 * GAN minimax as 1-D densities.
 * Real data is a fixed Gaussian N(muReal, sigma). The generator output is a
 * Gaussian N(muG, sigma) that starts far away. The discriminator is the
 * Bayes-optimal D*(x) = pReal / (pReal + pGen) for the CURRENT generator.
 * Stepping alternates a D update (recompute D toward optimal) and a G update
 * (slide muG toward muReal, the non-saturating gradient direction). At
 * convergence pGen == pReal and D* flattens to 0.5 everywhere.
 */

const W = 600;
const H = 360;
const PAD_L = 46;
const PAD_R = 18;
const PAD_T = 22;
const PAD_B = 40;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const X_MIN = -6;
const X_MAX = 6;
const MU_REAL = 1.4;
const SIGMA = 1.0;
const MU_G_START = -3.6;

const N_SAMPLES = 160;
const G_RATE = 0.45; // fraction of remaining gap closed per G update
const D_RATE = 0.6; // how far D moves toward optimal per D update

const COLOR_REAL = 'var(--hue-sky)';
const COLOR_GEN = 'var(--hue-pink)';
const COLOR_D = 'var(--accent)';

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}
function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function densToPx(d, maxD) {
  return PAD_T + PLOT_H - (d / maxD) * PLOT_H;
}
function gauss(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

const XS = (() => {
  const arr = [];
  for (let i = 0; i <= N_SAMPLES; i++) {
    arr.push(X_MIN + (i / N_SAMPLES) * (X_MAX - X_MIN));
  }
  return arr;
})();

const MAX_DENS = gauss(0, 0, SIGMA);

function curvePath(fn) {
  let d = '';
  for (let i = 0; i < XS.length; i++) {
    const px = xToPx(XS[i]);
    const py = densToPx(fn(XS[i]), MAX_DENS);
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)} `;
  }
  return d.trim();
}
function fillPath(fn) {
  let d = `M${xToPx(XS[0]).toFixed(2)},${(PAD_T + PLOT_H).toFixed(2)} `;
  for (let i = 0; i < XS.length; i++) {
    d += `L${xToPx(XS[i]).toFixed(2)},${densToPx(fn(XS[i]), MAX_DENS).toFixed(2)} `;
  }
  d += `L${xToPx(XS[XS.length - 1]).toFixed(2)},${(PAD_T + PLOT_H).toFixed(2)} Z`;
  return d;
}

// Optimal discriminator for current generator mean, blended toward 0.5 by dStrength.
function makeD(muG, dStrength) {
  return (x) => {
    const pr = gauss(x, MU_REAL, SIGMA);
    const pg = gauss(x, muG, SIGMA);
    const opt = pr / (pr + pg + 1e-12);
    return 0.5 + (opt - 0.5) * dStrength;
  };
}

// Losses (Monte-Carlo-free: integrate over the grid).
function computeLosses(muG, dFn) {
  const dx = (X_MAX - X_MIN) / N_SAMPLES;
  let dLoss = 0; // -E_real[log D] - E_gen[log(1-D)]
  let gLoss = 0; // non-saturating: -E_gen[log D]
  for (let i = 0; i < XS.length; i++) {
    const x = XS[i];
    const pr = gauss(x, MU_REAL, SIGMA);
    const pg = gauss(x, muG, SIGMA);
    const d = Math.min(0.999, Math.max(0.001, dFn(x)));
    dLoss += -(pr * Math.log(d) + pg * Math.log(1 - d)) * dx;
    gLoss += -(pg * Math.log(d)) * dx;
  }
  return { dLoss, gLoss };
}

export default function GANMinimaxViz() {
  const [muG, setMuG] = useState(MU_G_START);
  const [dStrength, setDStrength] = useState(0.85);
  const [phase, setPhase] = useState('D'); // next update kind
  const [round, setRound] = useState(0);
  const muGRef = useRef(MU_G_START);
  const dStrRef = useRef(0.85);
  const phaseRef = useRef('D');

  const dFn = useMemo(() => makeD(muG, dStrength), [muG, dStrength]);
  const realFn = useMemo(() => (x) => gauss(x, MU_REAL, SIGMA), []);
  const genFn = useMemo(() => (x) => gauss(x, muG, SIGMA), [muG]);

  const { dLoss, gLoss } = useMemo(() => computeLosses(muG, dFn), [muG, dFn]);

  // average discriminator output on generated samples — diagnostic of "fooling".
  const dOnFake = useMemo(() => {
    const dx = (X_MAX - X_MIN) / N_SAMPLES;
    let acc = 0;
    for (let i = 0; i < XS.length; i++) acc += gauss(XS[i], muG, SIGMA) * dFn(XS[i]) * dx;
    return acc;
  }, [muG, dFn]);

  const gap = Math.abs(MU_REAL - muG);
  const converged = gap < 0.04;

  const doStep = useCallback(() => {
    if (phaseRef.current === 'D') {
      // D update: push discriminator toward Bayes-optimal for current G.
      const next = Math.min(1, dStrRef.current + (1 - dStrRef.current) * D_RATE);
      dStrRef.current = next;
      setDStrength(next);
      phaseRef.current = 'G';
      setPhase('G');
    } else {
      // G update: slide generator mean toward real, weaken D's edge (it must re-sharpen).
      const ng = muGRef.current + (MU_REAL - muGRef.current) * G_RATE;
      muGRef.current = ng;
      setMuG(ng);
      const weaker = Math.max(0.12, dStrRef.current * 0.55);
      dStrRef.current = weaker;
      setDStrength(weaker);
      phaseRef.current = 'D';
      setPhase('D');
      setRound((r) => r + 1);
    }
  }, []);

  const reset = useCallback(() => {
    muGRef.current = MU_G_START;
    dStrRef.current = 0.85;
    phaseRef.current = 'D';
    setMuG(MU_G_START);
    setDStrength(0.85);
    setPhase('D');
    setRound(0);
  }, []);

  const realPath = curvePath(realFn);
  const genPath = curvePath(genFn);
  const genFill = fillPath(genFn);
  const realFill = fillPath(realFn);

  // D curve scaled to plot height (D in [0,1]).
  let dPath = '';
  for (let i = 0; i < XS.length; i++) {
    const px = xToPx(XS[i]);
    const py = PAD_T + PLOT_H - dFn(XS[i]) * PLOT_H;
    dPath += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)} `;
  }
  const half = PAD_T + PLOT_H - 0.5 * PLOT_H;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" style={{ maxWidth: '820px' }}>
          {/* plot frame */}
          <line x1={PAD_L} y1={PAD_T + PLOT_H} x2={W - PAD_R} y2={PAD_T + PLOT_H} stroke="var(--border)" strokeWidth="1" />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + PLOT_H} stroke="var(--border)" strokeWidth="1" />

          {/* D = 0.5 reference line */}
          <line x1={PAD_L} y1={half} x2={W - PAD_R} y2={half} stroke="var(--text-dim)" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.6" />
          <text x={W - PAD_R} y={half - 4} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">D = 0.5 (coin flip)</text>

          {/* x ticks */}
          {[-4, -2, 0, 2, 4].map((tx) => (
            <text key={`xt${tx}`} x={xToPx(tx)} y={PAD_T + PLOT_H + 14} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">{tx}</text>
          ))}
          <text x={W - PAD_R} y={PAD_T + PLOT_H + 26} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end" fontStyle="italic">x</text>

          {/* densities */}
          <path d={realFill} fill={COLOR_REAL} opacity="0.14" />
          <path d={genFill} fill={COLOR_GEN} opacity="0.14" />
          <path d={realPath} fill="none" stroke={COLOR_REAL} strokeWidth="2.2" strokeLinejoin="round" />
          <path d={genPath} fill="none" stroke={COLOR_GEN} strokeWidth="2.2" strokeLinejoin="round" />

          {/* discriminator curve */}
          <path d={dPath} fill="none" stroke={COLOR_D} strokeWidth="2" strokeDasharray="5 3" strokeLinejoin="round" />

          {/* mean markers */}
          <line x1={xToPx(MU_REAL)} y1={PAD_T} x2={xToPx(MU_REAL)} y2={PAD_T + PLOT_H} stroke={COLOR_REAL} strokeWidth="0.8" opacity="0.5" />
          <line x1={xToPx(muG)} y1={PAD_T} x2={xToPx(muG)} y2={PAD_T + PLOT_H} stroke={COLOR_GEN} strokeWidth="0.8" opacity="0.5" />

          {/* legend */}
          <g transform={`translate(${PAD_L + 8}, ${PAD_T + 6})`}>
            <rect x="-6" y="-6" width="150" height="56" rx="6" fill="var(--surface)" opacity="0.9" stroke="var(--border)" />
            <line x1="0" y1="4" x2="16" y2="4" stroke={COLOR_REAL} strokeWidth="2.2" />
            <text x="22" y="7" fontSize="8.5" fill="var(--text-main)" fontFamily="var(--mono)">p_data (real)</text>
            <line x1="0" y1="20" x2="16" y2="20" stroke={COLOR_GEN} strokeWidth="2.2" />
            <text x="22" y="23" fontSize="8.5" fill="var(--text-main)" fontFamily="var(--mono)">p_g (generator)</text>
            <line x1="0" y1="36" x2="16" y2="36" stroke={COLOR_D} strokeWidth="2" strokeDasharray="5 3" />
            <text x="22" y="39" fontSize="8.5" fill="var(--text-main)" fontFamily="var(--mono)">D(x)</text>
          </g>

          {/* phase badge */}
          <g transform={`translate(${W - PAD_R - 132}, ${PAD_T + 6})`}>
            <rect x="0" y="0" width="120" height="22" rx="11" fill={converged ? COLOR_REAL : COLOR_D} opacity="0.16" stroke={converged ? COLOR_REAL : COLOR_D} />
            <text x="60" y="15" fontSize="9" fill={converged ? COLOR_REAL : COLOR_D} fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
              {converged ? 'EQUILIBRIUM' : phase === 'D' ? 'NEXT: train D' : 'NEXT: train G'}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">round</span>
            <span className="mlviz-val">{round}</span>
            <span className="mlviz-sub">gap |μ_real − μ_g| = {snap(gap, 3)}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">D loss</span>
            <span className="mlviz-val">{snap(dLoss, 3)}</span>
            <span className="mlviz-sub">rises toward log 4 ≈ 1.386 as fakes get harder to spot</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">G loss</span>
            <span className="mlviz-val">{snap(gLoss, 3)}</span>
            <span className="mlviz-sub">−E[log D(G(z))]: falls as the forger fools D more often</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">D(fake)</span>
            <span className="mlviz-val">{snap(dOnFake, 3)}</span>
            <span className="mlviz-sub">avg score on generated samples — climbs to 0.5 at the fixed point</span>
          </div>
        </div>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">μ_g</span>
          <input
            type="range"
            min={X_MIN + 0.5}
            max={X_MAX - 0.5}
            step="0.05"
            value={muG}
            onChange={(e) => { const v = parseFloat(e.target.value); muGRef.current = v; setMuG(v); }}
          />
          <span className="mlviz-slider-val">{snap(muG, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">D sharpness</span>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.01"
            value={dStrength}
            onChange={(e) => { const v = parseFloat(e.target.value); dStrRef.current = v; setDStrength(v); }}
          />
          <span className="mlviz-slider-val">{snap(dStrength, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={doStep} disabled={converged}>
            <StepForward size={13} />
            <span>{phase === 'D' ? 'Train D' : 'Train G'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          D updates sharpen the dashed curve toward the Bayes-optimal D* = p_data / (p_data + p_g) · G updates slide p_g toward p_data, forcing D to re-sharpen · at p_g = p_data the best D can do is 0.5 everywhere
        </div>
      </div>
    </div>
  );
}
