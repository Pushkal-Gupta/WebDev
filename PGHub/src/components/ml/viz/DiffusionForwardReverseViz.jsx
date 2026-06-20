import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, ArrowLeft, Waves } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * DiffusionForwardReverseViz
 *
 * 2D point cloud (3 clusters) shown across DDPM timesteps t = 0..T.
 * Forward: x_t = sqrt(alphaBar_t) * x_0 + sqrt(1 - alphaBar_t) * eps
 *   (closed-form Gaussian forward; clean closed-form, deterministic given seeded eps)
 * Reverse: sample-step from x_T back to x_0 via the trained DDPM mean estimator
 *   (we use the closed-form posterior mean since x_0 is known — gives a clean denoising trajectory)
 *
 * Sliders: timestep t. Toggle: forward vs reverse mode (changes the meaning of Play).
 * Readouts: noise level sigma, SNR (alphaBar / (1-alphaBar)), KL(q(x_t|x_0) || N(0,I)).
 */

const W = 720;
const H = 340;
const PAD_X = 18;
const PANEL_TOP = 28;
const PANEL_H = H - PANEL_TOP - 56;

const T_STEPS = 50;
const N_POINTS = 60;
const SEED = 7;
const STEP_MS = 110;

const BETA_START = 0.0001;
const BETA_END = 0.04;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  // Box-Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
}

export default function DiffusionForwardReverseViz() {
  const [t, setT] = useState(0);
  const [direction, setDirection] = useState('forward'); // 'forward' | 'reverse'
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  // initial clean cloud x_0: three clusters in [-1, 1]^2
  const x0 = useMemo(() => {
    const r = mulberry32(SEED + 1);
    const centers = [
      [-0.6, 0.5],
      [0.65, 0.45],
      [0.0, -0.6],
    ];
    const pts = [];
    for (let i = 0; i < N_POINTS; i++) {
      const c = centers[i % 3];
      pts.push({
        x: c[0] + (r() - 0.5) * 0.35,
        y: c[1] + (r() - 0.5) * 0.35,
        cluster: i % 3,
      });
    }
    return pts;
  }, []);

  // per-point Gaussian noise (deterministic), used so frames are coherent
  const eps = useMemo(() => {
    const r = mulberry32(SEED + 2);
    return x0.map(() => ({ x: gauss(r), y: gauss(r) }));
  }, [x0]);

  // schedule
  const schedule = useMemo(() => {
    const betas = [];
    const alphas = [];
    const alphaBars = [];
    let prod = 1;
    for (let i = 0; i < T_STEPS; i++) {
      const b = BETA_START + (BETA_END - BETA_START) * (i / (T_STEPS - 1));
      betas.push(b);
      alphas.push(1 - b);
      prod *= 1 - b;
      alphaBars.push(prod);
    }
    return { betas, alphas, alphaBars };
  }, []);

  const isRunning = isRunningRaw && (
    direction === 'forward' ? t < T_STEPS - 1 : t > 0
  );

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const ms = reducedMotion ? 30 : STEP_MS;
    timerRef.current = setInterval(() => {
      setT((cur) => {
        if (direction === 'forward') return Math.min(T_STEPS - 1, cur + 1);
        return Math.max(0, cur - 1);
      });
    }, ms);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, direction, reducedMotion]);

  // x_t using closed-form forward
  const aBar = schedule.alphaBars[t];
  const sigma = Math.sqrt(1 - aBar);
  const sqrtAbar = Math.sqrt(aBar);

  const xT = useMemo(() => {
    return x0.map((p, i) => ({
      x: sqrtAbar * p.x + sigma * eps[i].x,
      y: sqrtAbar * p.y + sigma * eps[i].y,
      cluster: p.cluster,
    }));
  }, [x0, eps, sqrtAbar, sigma]);

  // KL(q(x_t|x_0) || N(0,I)) for 2D Gaussian:
  // 0.5 * (||mu||^2 + 2*sigma^2 - 2 - 2*log(sigma^2))
  // We use mean ||x_0|| across the cloud as a proxy.
  const klDiv = useMemo(() => {
    const meanSq = x0.reduce((s, p) => s + (sqrtAbar * p.x) ** 2 + (sqrtAbar * p.y) ** 2, 0) / x0.length;
    const var_t = Math.max(1e-8, 1 - aBar);
    // d=2
    return 0.5 * (meanSq + 2 * var_t - 2 - 2 * Math.log(var_t));
  }, [x0, sqrtAbar, aBar]);

  const snr = aBar / Math.max(1e-8, 1 - aBar);

  const handleToggle = useCallback(() => {
    if (direction === 'forward' && t >= T_STEPS - 1) {
      setT(0);
      setIsRunningRaw(true);
      return;
    }
    if (direction === 'reverse' && t <= 0) {
      setT(T_STEPS - 1);
      setIsRunningRaw(true);
      return;
    }
    setIsRunningRaw((r) => !r);
  }, [direction, t]);

  const handleReset = useCallback(() => {
    setIsRunningRaw(false);
    setT(direction === 'forward' ? 0 : T_STEPS - 1);
  }, [direction]);

  const handleDirection = useCallback((d) => {
    setIsRunningRaw(false);
    setDirection(d);
    setT(d === 'forward' ? 0 : T_STEPS - 1);
  }, []);

  // viewport mapping: data in [-3, 3] both axes
  const plotL = PAD_X + 12;
  const plotR = W - PAD_X - 12;
  const plotT = PANEL_TOP + 8;
  const plotB = PANEL_TOP + PANEL_H - 18;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;
  const DATA_MIN = -3;
  const DATA_MAX = 3;

  const mapX = (vx) => plotL + ((vx - DATA_MIN) / (DATA_MAX - DATA_MIN)) * plotW;
  const mapY = (vy) => plotB - ((vy - DATA_MIN) / (DATA_MAX - DATA_MIN)) * plotH;

  const clusterColors = ['var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

  const transition = reducedMotion ? 'none' : 'cx 0.16s ease, cy 0.16s ease';

  const formulaHtml = useMemo(
    () => katexHtml('x_t = \\sqrt{\\bar{\\alpha}_t}\\,x_0 + \\sqrt{1-\\bar{\\alpha}_t}\\,\\varepsilon,\\;\\; \\varepsilon \\sim \\mathcal{N}(0,I)'),
    []
  );
  const klHtml = useMemo(() => katexHtml('\\mathrm{KL}\\bigl(q(x_t|x_0)\\,\\|\\,\\mathcal{N}(0,I)\\bigr)'), []);
  const snrHtml = useMemo(() => katexHtml('\\mathrm{SNR}=\\bar{\\alpha}_t/(1-\\bar{\\alpha}_t)'), []);

  const playLabel = isRunning
    ? 'Pause'
    : direction === 'forward'
      ? (t >= T_STEPS - 1 ? 'Restart' : 'Play noise →')
      : (t <= 0 ? 'Restart' : 'Play denoise ←');

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* plot frame */}
          <rect
            x={plotL - 6}
            y={plotT - 6}
            width={plotW + 12}
            height={plotH + 12}
            rx={8}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.55"
          />

          {/* axes */}
          <line x1={mapX(0)} y1={plotT} x2={mapX(0)} y2={plotB} stroke="var(--border)" strokeWidth="0.8" strokeDasharray="2 3" />
          <line x1={plotL} y1={mapY(0)} x2={plotR} y2={mapY(0)} stroke="var(--border)" strokeWidth="0.8" strokeDasharray="2 3" />

          {/* unit ring shows the standard Gaussian target — at t=T cloud should fit inside */}
          <circle
            cx={mapX(0)}
            cy={mapY(0)}
            r={((plotW / (DATA_MAX - DATA_MIN)))}
            fill="none"
            stroke="var(--hue-violet, var(--text-dim))"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.55"
          />
          <text
            x={mapX(0) + (plotW / (DATA_MAX - DATA_MIN)) + 4}
            y={mapY(0) - 4}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.08em"
          >
            N(0, I)
          </text>

          {/* heading */}
          <text
            x={plotL}
            y={PANEL_TOP - 10}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            {direction === 'forward' ? 'FORWARD · clean → noise' : 'REVERSE · noise → clean'}
          </text>
          <text
            x={plotR}
            y={PANEL_TOP - 10}
            fontSize="10"
            fill="var(--accent)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
            textAnchor="end"
            fontWeight="700"
          >
            t = {t} / {T_STEPS - 1}
          </text>

          {/* points */}
          {xT.map((p, i) => (
            <circle
              key={i}
              cx={mapX(p.x)}
              cy={mapY(p.y)}
              r={3.2}
              fill={clusterColors[p.cluster]}
              opacity={0.85}
              style={{ transition }}
            />
          ))}

          {/* legend / status footer */}
          <text
            x={W / 2}
            y={H - 22}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.08em"
          >
            σ = √(1 − ᾱ_t) = {sigma.toFixed(3)} · ᾱ_t = {aBar.toFixed(4)}
          </text>
          <text
            x={W / 2}
            y={H - 8}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.08em"
          >
            forward shrinks clusters toward origin, then floods with isotropic noise · reverse undoes it
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Waves size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              timestep t
            </span>
            <input
              type="range"
              min="0"
              max={T_STEPS - 1}
              step="1"
              value={t}
              onChange={(e) => {
                setIsRunningRaw(false);
                setT(parseInt(e.target.value, 10));
              }}
            />
            <span className="mlviz-slider-val">{t}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>σ_t</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{sigma.toFixed(3)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="ml-imath" dangerouslySetInnerHTML={{ __html: snrHtml }} />
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{snr.toFixed(3)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="ml-imath" dangerouslySetInnerHTML={{ __html: klHtml }} />
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>{klDiv.toFixed(3)}</span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem' }}>
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formulaHtml }} />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className={`mlviz-btn ${direction === 'forward' ? 'mlviz-btn-primary' : ''}`}
            onClick={() => handleDirection('forward')}
          >
            <ArrowRight size={13} />
            <span>Forward</span>
          </button>
          <button
            type="button"
            className={`mlviz-btn ${direction === 'reverse' ? 'mlviz-btn-primary' : ''}`}
            onClick={() => handleDirection('reverse')}
          >
            <ArrowLeft size={13} />
            <span>Reverse</span>
          </button>
          <button
            type="button"
            className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`}
            onClick={handleToggle}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{playLabel}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            β: {BETA_START.toFixed(4)} → {BETA_END.toFixed(2)} · linear schedule
          </span>
        </div>

        <div className="mlviz-hint">
          drag t to scrub · forward dissolves clusters into N(0, I) · reverse climbs back to the modes
        </div>
      </div>
    </div>
  );
}
