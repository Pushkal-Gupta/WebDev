import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { FlaskConical, Pause, Play, RotateCcw, Sigma } from 'lucide-react';
import './PsABTestViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// Abramowitz-Stegun 7.1.26
function erf(x) {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a);
  return s * y;
}

const PRA = 0.040;
const PRB = 0.052;
const DEFAULTS = { pa: PRA, pb: PRB, n: 600, seed: 7 };
const N_MIN = 200;
const N_MAX = 24000;

// Deterministic observed counts: round the true rate to whole conversions for given n.
function counts(p, n, seed) {
  // jitter the rounding deterministically so it does not sit on an exact fraction
  const rng = mulberry32(seed);
  const exact = p * n;
  const frac = exact - Math.floor(exact);
  const bump = rng() < frac ? 1 : 0;
  return Math.floor(exact) + bump;
}

function stats(pa, pb, n, seed) {
  const nA = n;
  const nB = n;
  const xA = counts(pa, nA, seed ^ 0x1111);
  const xB = counts(pb, nB, seed ^ 0x2222);
  const pA = xA / nA;
  const pB = xB / nB;
  const diff = pB - pA;
  const pooled = (xA + xB) / (nA + nB);
  const seTest = Math.sqrt(Math.max(1e-12, pooled * (1 - pooled) * (1 / nA + 1 / nB)));
  const z = diff / seTest;
  const pval = 2 * (1 - normalCdf(Math.abs(z)));
  const seCi = Math.sqrt(
    Math.max(1e-12, (pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB),
  );
  const ciLo = diff - 1.96 * seCi;
  const ciHi = diff + 1.96 * seCi;
  return { nA, nB, xA, xB, pA, pB, diff, pooled, seTest, seCi, z, pval, ciLo, ciHi };
}

export default function PsABTestViz() {
  const [pa, setPa] = useState(DEFAULTS.pa);
  const [pb, setPb] = useState(DEFAULTS.pb);
  const [n, setN] = useState(DEFAULTS.n);
  const [seed] = useState(DEFAULTS.seed);
  const [playing, setPlaying] = useState(true);

  const reduced = useRef(false);
  const raf = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    reduced.current = true;
    const id = requestAnimationFrame(() => {
      setN(N_MAX);
      setPlaying(false);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!playing || reduced.current) return undefined;
    last.current = 0;
    const tick = (ts) => {
      if (!last.current) last.current = ts;
      const dt = Math.min(64, ts - last.current);
      last.current = ts;
      setN((prev) => {
        // ramp on a log scale so the narrowing reads smoothly across the range
        const lo = Math.log(N_MIN);
        const hi = Math.log(N_MAX);
        const frac = (Math.log(prev) - lo) / (hi - lo);
        const nextFrac = frac + dt / 6500;
        if (nextFrac >= 1) {
          setPlaying(false);
          return N_MAX;
        }
        return Math.round(Math.exp(lo + nextFrac * (hi - lo)));
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const s = useMemo(() => stats(pa, pb, n, seed), [pa, pb, n, seed]);
  const significant = s.pval < 0.05;

  const reset = () => {
    setPa(DEFAULTS.pa);
    setPb(DEFAULTS.pb);
    setN(DEFAULTS.n);
    setPlaying(!reduced.current);
  };

  const replay = () => {
    if (reduced.current) return;
    setN(N_MIN);
    setPlaying(true);
  };

  const onSlide = (setter) => (e) => {
    setPlaying(false);
    setter(parseFloat(e.target.value));
  };

  const fmtPct = (x) => `${(x * 100).toFixed(2)}\\%`;
  const fmtSigned = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(2)}\\%`;

  // ---- difference-distribution panel geometry ----
  const W = 720;
  const H = 250;
  const pad = 34;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  // x-axis spans a symmetric window around 0 wide enough to hold the CI and the gap.
  const span = Math.max(Math.abs(s.diff) + 4 * s.seCi, 5 * DEFAULTS.pb * 0.3, 0.01);
  const xLo = -span;
  const xHi = span;
  const xToPx = (x) => pad + ((x - xLo) / (xHi - xLo)) * plotW;

  // Bell of the observed difference, std = seCi, centered at diff.
  const bell = useMemo(() => {
    const steps = 160;
    const peak = 1 / (s.seCi * Math.sqrt(2 * Math.PI));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const x = xLo + (i / steps) * (xHi - xLo);
      const zz = (x - s.diff) / s.seCi;
      const dens = Math.exp(-0.5 * zz * zz) / (s.seCi * Math.sqrt(2 * Math.PI));
      const h = (dens / peak) * plotH;
      const px = pad + ((x - xLo) / (xHi - xLo)) * plotW;
      pts.push(`${px.toFixed(2)},${(pad + plotH - h).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [s.diff, s.seCi, xLo, xHi, plotH, plotW]);

  const zeroX = xToPx(0);
  const diffX = xToPx(s.diff);
  const ciLoX = xToPx(s.ciLo);
  const ciHiX = xToPx(s.ciHi);
  const baseY = pad + plotH;

  return (
    <div className="psab">
      <div className="psab-head">
        <div className="psab-head-icon"><FlaskConical size={18} /></div>
        <div className="psab-head-text">
          <h3 className="psab-title">A/B test: is the lift real or just noise?</h3>
          <p className="psab-sub">
            The bell is the distribution of the observed gap{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\hat{p}_B-\\hat{p}_A') }} /> with width{' '}
            <span dangerouslySetInnerHTML={{ __html: km('SE=\\sqrt{\\hat{p}(1-\\hat{p})(1/n_A+1/n_B)}') }} />.
            As <span dangerouslySetInnerHTML={{ __html: km('n') }} /> grows it narrows until the 95% interval clears zero —
            then <span dangerouslySetInnerHTML={{ __html: km('z=(\\hat{p}_B-\\hat{p}_A)/SE') }} /> crosses into significance.
          </p>
        </div>
        <div className="psab-head-btns">
          <button type="button" className="psab-btn" onClick={() => (playing ? setPlaying(false) : replay())}>
            {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
          <button type="button" className="psab-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>

      <div className="psab-controls">
        <label className="psab-slider">
          <span className="psab-slider-key psab-keyA">control <span dangerouslySetInnerHTML={{ __html: km('p_A') }} /></span>
          <input type="range" min="0.01" max="0.10" step="0.001" value={pa} onChange={onSlide(setPa)} />
          <span className="psab-slider-val">{(pa * 100).toFixed(1)}%</span>
        </label>
        <label className="psab-slider">
          <span className="psab-slider-key psab-keyB">variant <span dangerouslySetInnerHTML={{ __html: km('p_B') }} /></span>
          <input type="range" min="0.01" max="0.10" step="0.001" value={pb} onChange={onSlide(setPb)} />
          <span className="psab-slider-val">{(pb * 100).toFixed(1)}%</span>
        </label>
        <label className="psab-slider">
          <span className="psab-slider-key">per-arm <span dangerouslySetInnerHTML={{ __html: km('n') }} /></span>
          <input
            type="range"
            min={N_MIN}
            max={N_MAX}
            step="50"
            value={n}
            onChange={onSlide((v) => setN(Math.round(v)))}
          />
          <span className="psab-slider-val">{n.toLocaleString()}</span>
        </label>
      </div>

      <div className="psab-panel">
        <div className="psab-panel-label">
          sampling distribution of the difference
          <span className={`psab-verdict${significant ? ' psab-verdict-on' : ''}`}>
            {significant ? 'significant — CI excludes 0' : 'not significant — CI straddles 0'}
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="psab-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="psab-bell-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="psab-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <line x1={pad} y1={baseY} x2={pad + plotW} y2={baseY} className="psab-axis" />

          <rect
            x={Math.max(pad, ciLoX)}
            y={pad}
            width={Math.max(0, Math.min(pad + plotW, ciHiX) - Math.max(pad, ciLoX))}
            height={plotH}
            className={`psab-ciband${significant ? ' psab-ciband-on' : ''}`}
          />

          <polyline points={bell} className="psab-bell-glow" filter="url(#psab-glow)" />
          <polyline points={bell} className="psab-bell" />

          <line x1={zeroX} y1={pad - 6} x2={zeroX} y2={baseY} className="psab-zeroline" />
          <text x={zeroX} y={pad - 9} className="psab-zerolabel" textAnchor="middle">null = 0</text>

          <line
            x1={ciLoX}
            y1={baseY + 11}
            x2={ciHiX}
            y2={baseY + 11}
            className={`psab-cibar${significant ? ' psab-cibar-on' : ''}`}
          />
          <line x1={ciLoX} y1={baseY + 6} x2={ciLoX} y2={baseY + 16} className={`psab-cibar${significant ? ' psab-cibar-on' : ''}`} />
          <line x1={ciHiX} y1={baseY + 6} x2={ciHiX} y2={baseY + 16} className={`psab-cibar${significant ? ' psab-cibar-on' : ''}`} />

          <line x1={diffX} y1={pad + 4} x2={diffX} y2={baseY} className="psab-diffline" />
          <circle cx={diffX} cy={pad + 4} r="4" className="psab-diffdot" />
          <text x={diffX} y={pad - 1} className="psab-difflabel" textAnchor="middle">
            gap {(s.diff * 100).toFixed(2)}%
          </text>
        </svg>
      </div>

      <div className="psab-stats">
        <div className="psab-statcard psab-cardA">
          <span className="psab-stat-label">control A</span>
          <span className="psab-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\hat{p}_A = ${fmtPct(s.pA)}`) }} />
          <span className="psab-stat-sub">{s.xA.toLocaleString()} / {s.nA.toLocaleString()}</span>
        </div>
        <div className="psab-statcard psab-cardB">
          <span className="psab-stat-label">variant B</span>
          <span className="psab-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\hat{p}_B = ${fmtPct(s.pB)}`) }} />
          <span className="psab-stat-sub">{s.xB.toLocaleString()} / {s.nB.toLocaleString()}</span>
        </div>
        <div className="psab-statcard">
          <span className="psab-stat-label">lift &amp; SE</span>
          <span className="psab-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\Delta = ${fmtSigned(s.diff)}`) }} />
          <span className="psab-stat-sub" dangerouslySetInnerHTML={{ __html: km(`SE = ${(s.seTest * 100).toFixed(3)}\\%`) }} />
        </div>
        <div className="psab-statcard psab-accent">
          <span className="psab-stat-label">test statistic</span>
          <span className="psab-stat-val" dangerouslySetInnerHTML={{ __html: km(`z = ${s.z.toFixed(2)}`) }} />
          <span className="psab-stat-sub" dangerouslySetInnerHTML={{ __html: km(`p = ${s.pval < 0.0001 ? '<0.0001' : s.pval.toFixed(4)}`) }} />
        </div>
        <div className={`psab-statcard${significant ? ' psab-ok' : ''}`}>
          <span className="psab-stat-label">95% CI on lift</span>
          <span className="psab-stat-val" dangerouslySetInnerHTML={{ __html: km(`[${fmtSigned(s.ciLo)},\\ ${fmtSigned(s.ciHi)}]`) }} />
          <span className="psab-stat-sub">{significant ? 'excludes 0' : 'contains 0'}</span>
        </div>
      </div>

      <div className="psab-trace">
        <span className="psab-trace-label"><Sigma size={12} /> reading</span>
        <span className="psab-trace-body">
          {significant
            ? `With ${s.nA.toLocaleString()} visitors per arm the standard error has shrunk enough that the 95% interval on the lift, [${(s.ciLo * 100).toFixed(2)}%, ${(s.ciHi * 100).toFixed(2)}%], sits entirely above zero. z = ${s.z.toFixed(2)} gives p = ${s.pval < 0.0001 ? '<0.0001' : s.pval.toFixed(4)} < 0.05, so the ${(s.diff * 100).toFixed(2)}% gap is unlikely to be noise — B beats A.`
            : `At ${s.nA.toLocaleString()} visitors per arm the bell is still wide: its 95% interval [${(s.ciLo * 100).toFixed(2)}%, ${(s.ciHi * 100).toFixed(2)}%] straddles zero, so the observed ${(s.diff * 100).toFixed(2)}% gap (z = ${s.z.toFixed(2)}, p = ${s.pval.toFixed(3)}) could easily be chance. Let n keep climbing — watch the bell tighten until the bracket clears the null line.`}
        </span>
      </div>
    </div>
  );
}
