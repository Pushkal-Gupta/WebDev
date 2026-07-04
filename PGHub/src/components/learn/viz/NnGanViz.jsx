import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Play, Pause, Swords, Target, Bot } from 'lucide-react';
import './NnGanViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rand) {
  const u1 = Math.max(rand(), 1e-12);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const gauss = (x, mu, s) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
const sigmoid = (z) => 1 / (1 + Math.exp(-Math.max(Math.min(z, 30), -30)));

// Target data distribution N(MU_DATA, SIGMA). The generator's p_g starts far
// (wrong mean, too wide) and, round by round, converges toward p_data.
const MU_DATA = 2.1;
const SIGMA = 0.85;
const ROUNDS = 60;

// Precompute the training trajectory deterministically (no Math.random).
function buildTrajectory() {
  const rand = mulberry32(20260704);
  let muG = -2.4;
  let sigG = 1.9;
  let w = 0.0;
  let b = 0.0;
  const batch = 48;
  const frames = [];
  for (let r = 0; r <= ROUNDS; r++) {
    // record current state before the round's updates
    // sample real + fake batches
    const reals = [];
    const zs = [];
    const fakes = [];
    for (let i = 0; i < batch; i++) {
      reals.push(MU_DATA + SIGMA * randn(rand));
      const z = randn(rand);
      zs.push(z);
      fakes.push(muG + sigG * z);
    }
    // discriminator ascent
    let gw = 0;
    let gb = 0;
    for (const x of reals) { const d = sigmoid(w * x + b); gw += (1 - d) * x; gb += (1 - d); }
    for (const x of fakes) { const d = sigmoid(w * x + b); gw += -d * x; gb += -d; }
    // generator losses (non-saturating) for readout
    let dReal = 0;
    let dFake = 0;
    for (const x of reals) dReal += sigmoid(w * x + b);
    for (const x of fakes) dFake += sigmoid(w * x + b);
    dReal /= batch; dFake /= batch;
    const dLoss = -(Math.log(dReal + 1e-9) + Math.log(1 - dFake + 1e-9)) / 2;
    const gLoss = -Math.log(dFake + 1e-9);
    // overlap metric: 1 - total-variation-ish, via mean |D-0.5| inverse
    const meanConf = (Math.abs(dReal - 0.5) + Math.abs(dFake - 0.5)) / 2;
    const overlap = Math.max(0, 1 - meanConf / 0.5);

    frames.push({ muG, sigG, w, b, dLoss, gLoss, overlap, dReal, dFake });

    // apply updates for next round
    w += 0.06 * gw / (2 * batch);
    b += 0.06 * gb / (2 * batch);
    let gmu = 0;
    let gsig = 0;
    for (const z of zs) {
      const x = muG + sigG * z;
      const d = sigmoid(w * x + b);
      gmu += (1 - d) * w;
      gsig += (1 - d) * w * z;
    }
    muG += 0.11 * gmu / batch;
    sigG += 0.04 * gsig / batch;
    // pull scale gently toward the data scale (variance matching), keep positive
    sigG += 0.05 * (SIGMA - sigG);
    sigG = Math.max(0.25, sigG);
  }
  return frames;
}

const VB_W = 380;
const VB_H = 210;
const PAD = 16;
const X_LO = -6;
const X_HI = 6;
const plotW = VB_W - 2 * PAD;
const plotH = VB_H - 2 * PAD;
const sx = (x) => PAD + ((x - X_LO) / (X_HI - X_LO)) * plotW;
const baseY = VB_H - PAD;
const CURVE_H = plotH - 18;

// Sample deterministic point clouds for real + fake at a given frame.
function pointCloud(seed, mu, sig, n) {
  const rand = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(mu + sig * randn(rand));
  return pts;
}

const N_PTS = 26;

export default function NnGanViz() {
  const [playing, setPlaying] = useState(true);
  const [round, setRound] = useState(0);
  const raf = useRef(null);
  const last = useRef(0);

  const reduced = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const frames = useMemo(() => buildTrajectory(), []);
  const realPts = useMemo(() => pointCloud(777, MU_DATA, SIGMA, N_PTS), []);

  const reset = () => { setRound(0); setPlaying(true); };

  useEffect(() => {
    if (!playing || round >= ROUNDS) return undefined;
    const interval = reduced ? 260 : 130;
    const tick = (ts) => {
      if (ts - last.current >= interval) {
        last.current = ts;
        setRound((r) => {
          const next = Math.min(ROUNDS, r + 1);
          if (next >= ROUNDS) setPlaying(false);
          return next;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, round, reduced]);

  const f = frames[round];

  // Peak density for scaling the y-axis of the curves.
  const peak = Math.max(gauss(MU_DATA, MU_DATA, SIGMA), gauss(f.muG, f.muG, f.sigG));
  const dh = (v) => (v / peak) * CURVE_H;

  const curvePath = (mu, sig) => {
    let d = '';
    for (let i = 0; i <= 80; i++) {
      const x = X_LO + (i / 80) * (X_HI - X_LO);
      const y = baseY - dh(gauss(x, mu, sig));
      d += `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${y.toFixed(1)} `;
    }
    return d.trim();
  };
  const areaPath = (mu, sig) => `${curvePath(mu, sig)} L${sx(X_HI).toFixed(1)},${baseY} L${sx(X_LO).toFixed(1)},${baseY} Z`;

  const fakePts = pointCloud(4242, f.muG, f.sigG, N_PTS);

  // Discriminator score shading: sample D(x) across the axis -> band color.
  const shadeBands = [];
  for (let i = 0; i < 40; i++) {
    const x0 = X_LO + (i / 40) * (X_HI - X_LO);
    const x1 = X_LO + ((i + 1) / 40) * (X_HI - X_LO);
    const xm = (x0 + x1) / 2;
    const dv = sigmoid(f.w * xm + f.b);
    shadeBands.push({ x: sx(x0), w: sx(x1) - sx(x0), dv });
  }

  const distance = Math.abs(f.muG - MU_DATA);

  return (
    <div className="ngan">
      <div className="ngan-head">
        <div className="ngan-head-icon"><Swords size={18} /></div>
        <div className="ngan-head-text">
          <h3 className="ngan-title">The generator learns to match the real distribution</h3>
          <p className="ngan-sub">
            The discriminator is optimal at
            <span dangerouslySetInnerHTML={{ __html: km('\\;D^*(x)=\\tfrac{p_{data}}{p_{data}+p_g}') }} />.
            As the fake curve slides onto the real one, its shaded verdict fades to
            <span dangerouslySetInnerHTML={{ __html: km('\\;0.5') }} /> everywhere.
          </p>
        </div>
        <button type="button" className="ngan-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="ngan-controls">
        <button type="button" className="ngan-btn ngan-btn-primary"
          onClick={() => (round >= ROUNDS ? reset() : setPlaying((p) => !p))}>
          {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> {round >= ROUNDS ? 'Replay' : 'Play'}</>}
        </button>
        <label className="ngan-slider">
          <span className="ngan-slider-lab"><span>training round</span><span className="ngan-slider-val">{round}</span></span>
          <input type="range" min={0} max={ROUNDS} step={1} value={round}
            onChange={(e) => { setPlaying(false); setRound(parseInt(e.target.value, 10)); }} />
        </label>
      </div>

      <div className="ngan-body">
        <div className="ngan-stage">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="ngan-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="ngan-real-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--hue-mint)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--hue-mint)" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="ngan-fake-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--hue-pink)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--hue-pink)" stopOpacity="0.03" />
              </linearGradient>
              <filter id="ngan-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <rect x={PAD} y={PAD} width={plotW} height={plotH} rx={10} className="ngan-plot" />

            {/* discriminator decision shading: green-ish where D>0.5 (thinks real), pink where D<0.5 */}
            <g clipPath="none">
              {shadeBands.map((s, i) => (
                <rect key={i} x={s.x} y={PAD + 1} width={s.w + 0.6} height={plotH - 2}
                  fill={s.dv >= 0.5
                    ? 'var(--hue-mint)'
                    : 'var(--hue-pink)'}
                  opacity={Math.abs(s.dv - 0.5) * 0.34} />
              ))}
            </g>

            {/* real distribution */}
            <path d={areaPath(MU_DATA, SIGMA)} fill="url(#ngan-real-grad)" />
            <path d={curvePath(MU_DATA, SIGMA)} className="ngan-real-line" filter="url(#ngan-glow)" />
            {/* fake distribution */}
            <path d={areaPath(f.muG, f.sigG)} fill="url(#ngan-fake-grad)" />
            <path d={curvePath(f.muG, f.sigG)} className="ngan-fake-line" filter="url(#ngan-glow)" />

            {/* sampled points along the baseline */}
            {realPts.map((x, i) => (
              <circle key={`r${i}`} cx={sx(x)} cy={baseY + 5} r={1.7} className="ngan-dot-real" />
            ))}
            {fakePts.map((x, i) => (
              <circle key={`f${i}`} cx={sx(x)} cy={baseY + 9} r={1.7} className="ngan-dot-fake" />
            ))}

            <text x={sx(MU_DATA)} y={PAD + 12} className="ngan-lab ngan-lab-real" textAnchor="middle">p_data (real)</text>
            <text x={sx(f.muG)} y={PAD + 24} className="ngan-lab ngan-lab-fake" textAnchor="middle">p_g (fake)</text>
          </svg>
        </div>

        <div className="ngan-side">
          <div className="ngan-net ngan-net-g">
            <span className="ngan-net-ico"><Bot size={13} /></span>
            <span className="ngan-net-name">Generator</span>
            <span className="ngan-net-val">loss {f.gLoss.toFixed(3)}</span>
          </div>
          <div className="ngan-net ngan-net-d">
            <span className="ngan-net-ico"><Target size={13} /></span>
            <span className="ngan-net-name">Discriminator</span>
            <span className="ngan-net-val">loss {f.dLoss.toFixed(3)}</span>
          </div>

          <div className="ngan-metric">
            <div className="ngan-metric-row">
              <span className="ngan-metric-lab">mean gap |&mu;g &minus; &mu;data|</span>
              <span className="ngan-metric-num">{distance.toFixed(3)}</span>
            </div>
            <div className="ngan-bar">
              <div className="ngan-bar-fill" style={{ width: `${Math.round(f.overlap * 100)}%` }} />
            </div>
            <div className="ngan-metric-row">
              <span className="ngan-metric-lab">distribution overlap</span>
              <span className="ngan-metric-num ngan-metric-accent">{Math.round(f.overlap * 100)}%</span>
            </div>
          </div>

          <div className="ngan-note">
            Round {round}: the pink fake curve chases the green real one. When they overlap the
            discriminator&apos;s shading washes out &mdash; it can no longer tell real from fake, so
            <span dangerouslySetInnerHTML={{ __html: km('\\;D\\!\\to\\!0.5') }} /> and the generator has won.
          </div>
        </div>
      </div>
    </div>
  );
}
