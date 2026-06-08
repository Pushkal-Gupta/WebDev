import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dice5, RotateCcw, Lock, Unlock } from 'lucide-react';
import './MLViz.css';

const W = 620;
const H = 360;

// Column x-anchors for the five panels.
const X_INPUT = 60;
const X_ENC   = 175;
const X_LAT   = 340;
const X_DEC   = 505;
const Y_MID   = H / 2;

const GRID_N = 4;
const CELL = 22;
const GRID_PX = GRID_N * CELL;

// Mulberry32 deterministic PRNG.
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller standard normal.
function randn(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Stylised "digits" on a 4x4 grid. Values in {0, 1}.
const DIGIT_TEMPLATES = [
  [0, 1, 1, 0,  1, 0, 0, 1,  1, 0, 0, 1,  0, 1, 1, 0],
  [0, 1, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 1, 1, 1],
  [1, 1, 1, 0,  0, 0, 1, 0,  0, 1, 0, 0,  1, 1, 1, 1],
  [1, 1, 1, 0,  0, 0, 1, 0,  0, 1, 1, 0,  1, 1, 1, 0],
  [1, 0, 1, 0,  1, 1, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0],
  [1, 1, 1, 1,  1, 0, 0, 0,  0, 1, 1, 0,  1, 1, 1, 0],
  [0, 1, 1, 1,  1, 0, 0, 0,  1, 1, 1, 0,  1, 1, 1, 0],
  [1, 1, 1, 1,  0, 0, 0, 1,  0, 0, 1, 0,  0, 1, 0, 0],
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Deterministic encoder weights so input changes drive μ / log σ² visibly.
function makeEncoderWeights(seed) {
  const rng = mulberry32(seed);
  const wMu = [[], []];
  const wLv = [[], []];
  for (let k = 0; k < 16; k++) {
    wMu[0].push(rng() * 2 - 1);
    wMu[1].push(rng() * 2 - 1);
    wLv[0].push((rng() * 2 - 1) * 0.6);
    wLv[1].push((rng() * 2 - 1) * 0.6);
  }
  const centre = (row) => {
    const m = row.reduce((s, v) => s + v, 0) / row.length;
    return row.map((v) => v - m);
  };
  return {
    wMu: [centre(wMu[0]), centre(wMu[1])],
    wLv: [centre(wLv[0]), centre(wLv[1])],
  };
}
const ENC = makeEncoderWeights(7);

function encode(image) {
  const mu = [0, 0];
  const lv = [0, 0];
  for (let i = 0; i < 16; i++) {
    mu[0] += ENC.wMu[0][i] * image[i];
    mu[1] += ENC.wMu[1][i] * image[i];
    lv[0] += ENC.wLv[0][i] * image[i];
    lv[1] += ENC.wLv[1][i] * image[i];
  }
  mu[0] = Math.max(-2.5, Math.min(2.5, mu[0] * 0.6));
  mu[1] = Math.max(-2.5, Math.min(2.5, mu[1] * 0.6));
  lv[0] = Math.max(-3, Math.min(2, lv[0] * 0.5 - 0.8));
  lv[1] = Math.max(-3, Math.min(2, lv[1] * 0.5 - 0.8));
  return { mu, lv };
}

// Decorative decoder: blend two prototype digits based on (z1, z2).
function decode(z) {
  const z1 = z[0];
  const z2 = z[1];
  const idxF = ((z1 + 2.5) / 5) * (DIGIT_TEMPLATES.length - 1);
  const lo = Math.max(0, Math.min(DIGIT_TEMPLATES.length - 1, Math.floor(idxF)));
  const hi = Math.max(0, Math.min(DIGIT_TEMPLATES.length - 1, lo + 1));
  const t = Math.max(0, Math.min(1, idxF - lo));
  const a = DIGIT_TEMPLATES[lo];
  const b = DIGIT_TEMPLATES[hi];
  const bright = 0.55 + 0.45 / (1 + Math.exp(-z2));
  const out = new Array(16);
  for (let i = 0; i < 16; i++) {
    const v = (a[i] * (1 - t) + b[i] * t) * bright;
    const row = Math.floor(i / 4);
    const col = i % 4;
    const dx = Math.min(row, col, 3 - row, 3 - col);
    const edge = dx === 0 ? 0.92 : 1.0;
    out[i] = Math.max(0, Math.min(1, v * edge));
  }
  return out;
}

function reconLoss(x, xHat) {
  let s = 0;
  for (let i = 0; i < 16; i++) s += (x[i] - xHat[i]) ** 2;
  return s / 16;
}

function klDivergence(mu, lv) {
  let s = 0;
  for (let i = 0; i < 2; i++) {
    s += mu[i] * mu[i] + Math.exp(lv[i]) - 1 - lv[i];
  }
  return 0.5 * s;
}

function PixelGrid({ cx, cy, values, accent = 'var(--accent)' }) {
  const x0 = cx - GRID_PX / 2;
  const y0 = cy - GRID_PX / 2;
  const cells = [];
  for (let r = 0; r < GRID_N; r++) {
    for (let c = 0; c < GRID_N; c++) {
      const i = r * GRID_N + c;
      const v = Math.max(0, Math.min(1, values[i] || 0));
      cells.push(
        <rect
          key={`px-${r}-${c}`}
          x={x0 + c * CELL + 0.5}
          y={y0 + r * CELL + 0.5}
          width={CELL - 1}
          height={CELL - 1}
          fill={accent}
          opacity={0.08 + v * 0.85}
          rx={2}
        />
      );
    }
  }
  return (
    <g>
      <rect
        x={x0 - 4}
        y={y0 - 4}
        width={GRID_PX + 8}
        height={GRID_PX + 8}
        rx={6}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={1}
      />
      {cells}
    </g>
  );
}

function LatentPlot({ cx, cy, size, mu, lv, z, eps, beta }) {
  const half = size / 2;
  const x0 = cx - half;
  const y0 = cy - half;
  const scale = size / 6;
  const toX = (v) => cx + v * scale;
  const toY = (v) => cy - v * scale;

  const sigma = [Math.exp(0.5 * lv[0]), Math.exp(0.5 * lv[1])];
  const rx = Math.max(2, sigma[0] * scale);
  const ry = Math.max(2, sigma[1] * scale);

  const muMag = Math.sqrt(mu[0] * mu[0] + mu[1] * mu[1]);
  const pullStrength = Math.min(1, beta * (muMag * 0.3 + 0.05));

  const muX = toX(mu[0]);
  const muY = toY(mu[1]);
  const zX = toX(z[0]);
  const zY = toY(z[1]);

  const lines = [];
  for (let v = -3; v <= 3; v++) {
    lines.push(
      <line
        key={`gx-${v}`}
        x1={toX(v)}
        y1={y0}
        x2={toX(v)}
        y2={y0 + size}
        stroke="var(--border)"
        strokeWidth={v === 0 ? 0.9 : 0.4}
        opacity={v === 0 ? 0.7 : 0.45}
      />
    );
    lines.push(
      <line
        key={`gy-${v}`}
        x1={x0}
        y1={toY(v)}
        x2={x0 + size}
        y2={toY(v)}
        stroke="var(--border)"
        strokeWidth={v === 0 ? 0.9 : 0.4}
        opacity={v === 0 ? 0.7 : 0.45}
      />
    );
  }

  return (
    <g>
      <rect
        x={x0}
        y={y0}
        width={size}
        height={size}
        rx={8}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={1}
      />
      {lines}
      <circle
        cx={cx}
        cy={cy}
        r={scale}
        fill="none"
        stroke="var(--text-dim)"
        strokeDasharray="2 3"
        strokeWidth={0.7}
        opacity={0.55}
      />
      {muMag > 0.05 && (
        <line
          x1={muX}
          y1={muY}
          x2={cx + (muX - cx) * (1 - pullStrength)}
          y2={cy + (muY - cy) * (1 - pullStrength)}
          stroke="var(--hue-violet, #b48cff)"
          strokeWidth={1.1}
          strokeDasharray="2 2"
          opacity={0.65}
        />
      )}
      <ellipse
        cx={muX}
        cy={muY}
        rx={rx * 2}
        ry={ry * 2}
        fill="var(--hue-mint, #6fe3a8)"
        opacity={0.08}
      />
      <ellipse
        cx={muX}
        cy={muY}
        rx={rx}
        ry={ry}
        fill="var(--hue-mint, #6fe3a8)"
        opacity={0.22}
        stroke="var(--hue-mint, #6fe3a8)"
        strokeWidth={1.1}
      />
      <circle cx={muX} cy={muY} r={3.4} fill="var(--hue-mint, #6fe3a8)" />
      <text
        x={muX + 7}
        y={muY - 5}
        fontSize="9"
        fill="var(--hue-mint, #6fe3a8)"
        fontFamily="var(--mono, monospace)"
        fontWeight={700}
      >
        μ
      </text>
      <defs>
        <marker
          id="vae-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink, #ff66cc)" />
        </marker>
      </defs>
      <line
        x1={muX}
        y1={muY}
        x2={zX}
        y2={zY}
        stroke="var(--hue-pink, #ff66cc)"
        strokeWidth={1.4}
        markerEnd="url(#vae-arrow)"
        opacity={0.9}
      />
      <text
        x={(muX + zX) / 2 + 6}
        y={(muY + zY) / 2 - 4}
        fontSize="9"
        fill="var(--hue-pink, #ff66cc)"
        fontFamily="var(--mono, monospace)"
      >
        σ·ε
      </text>
      <circle cx={zX} cy={zY} r={4} fill="var(--accent)" stroke="var(--bg)" strokeWidth={1.2} />
      <text
        x={zX + 7}
        y={zY + 11}
        fontSize="9"
        fill="var(--accent)"
        fontFamily="var(--mono, monospace)"
        fontWeight={700}
      >
        z
      </text>
      <text
        x={x0 + 6}
        y={y0 + 12}
        fontSize="8.5"
        fill="var(--text-dim)"
        fontFamily="var(--mono, monospace)"
      >
        ε = ({snap(eps[0], 2)}, {snap(eps[1], 2)})
      </text>
      <text
        x={x0 + size - 6}
        y={y0 + 12}
        fontSize="8.5"
        fill="var(--text-dim)"
        fontFamily="var(--mono, monospace)"
        textAnchor="end"
      >
        N(0, I) prior
      </text>
    </g>
  );
}

function Funnel({ x, y, w, h, dir = 'right', label, sub, tint = 'var(--hue-sky, #5ecbff)' }) {
  const inset = w * 0.55;
  let path;
  if (dir === 'right') {
    path = `M ${x} ${y} L ${x + w} ${y + inset / 2} L ${x + w} ${y + h - inset / 2} L ${x} ${y + h} Z`;
  } else {
    path = `M ${x + w} ${y} L ${x} ${y + inset / 2} L ${x} ${y + h - inset / 2} L ${x + w} ${y + h} Z`;
  }
  return (
    <g>
      <path
        d={path}
        fill={`color-mix(in srgb, ${tint} 12%, var(--surface))`}
        stroke={tint}
        strokeWidth={1.2}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - 4}
        fontSize="11"
        fill="var(--text-main)"
        fontFamily="var(--mono, monospace)"
        textAnchor="middle"
        fontWeight={700}
        letterSpacing="0.1em"
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 10}
          fontSize="8.5"
          fill="var(--text-dim)"
          fontFamily="var(--mono, monospace)"
          textAnchor="middle"
          letterSpacing="0.14em"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

export default function VAEViz() {
  const [seed, setSeed] = useState(3);
  const [beta, setBeta] = useState(1.0);
  const [eps, setEps] = useState(() => [randn(mulberry32(101)), randn(mulberry32(202))]);
  const [manualZ, setManualZ] = useState(false);
  const [zManual, setZManual] = useState([0, 0]);
  const [animT, setAnimT] = useState(1);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  const inputImage = useMemo(() => {
    const idx = ((seed % DIGIT_TEMPLATES.length) + DIGIT_TEMPLATES.length) % DIGIT_TEMPLATES.length;
    const tmpl = DIGIT_TEMPLATES[idx];
    const rng = mulberry32(seed * 9973 + 1);
    return tmpl.map((v) => {
      if (v === 0) return 0.03 + rng() * 0.05;
      return Math.max(0, Math.min(1, 0.78 + rng() * 0.22));
    });
  }, [seed]);

  const { mu, lv } = useMemo(() => encode(inputImage), [inputImage]);

  const zSampled = useMemo(() => {
    const sigma0 = Math.exp(0.5 * lv[0]);
    const sigma1 = Math.exp(0.5 * lv[1]);
    return [mu[0] + sigma0 * eps[0], mu[1] + sigma1 * eps[1]];
  }, [mu, lv, eps]);

  const zActive = manualZ ? zManual : zSampled;

  const lRec = useMemo(() => reconLoss(inputImage, decode(zActive)), [inputImage, zActive]);
  const lKl = useMemo(() => klDivergence(mu, lv), [mu, lv]);
  const lElbo = lRec + beta * lKl;

  const triggerSample = useCallback(() => {
    const rng = mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
    setEps([randn(rng), randn(rng)]);
    setManualZ(false);
    setAnimT(0);
    startRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (animT >= 1) return undefined;
    const tick = () => {
      const dt = (performance.now() - startRef.current) / 600;
      const t = Math.min(1, dt);
      setAnimT(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animT]);

  const zAnim = useMemo(() => {
    if (manualZ) return zActive;
    const e = animT * animT * (3 - 2 * animT);
    return [mu[0] + (zSampled[0] - mu[0]) * e, mu[1] + (zSampled[1] - mu[1]) * e];
  }, [manualZ, animT, mu, zSampled, zActive]);

  const xHatAnim = useMemo(() => decode(zAnim), [zAnim]);

  const reset = useCallback(() => {
    setSeed(3);
    setBeta(1.0);
    setEps([randn(mulberry32(101)), randn(mulberry32(202))]);
    setManualZ(false);
    setZManual([0, 0]);
    setAnimT(1);
  }, []);

  const nextSeed = useCallback(() => {
    setSeed((s) => s + 1);
    setAnimT(1);
  }, []);

  const handleZSlider = useCallback((idx, val) => {
    setManualZ(true);
    setZManual((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }, []);

  const z1Display = manualZ ? zManual[0] : zAnim[0];
  const z2Display = manualZ ? zManual[1] : zAnim[1];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: 620 }}>
          <text x={X_INPUT} y={28} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.18em">
            INPUT x · 4×4
          </text>
          <text x={X_ENC} y={28} fontSize="9.5" fill="var(--hue-sky, #5ecbff)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.18em" fontWeight={700}>
            ENCODER qφ
          </text>
          <text x={X_LAT} y={28} fontSize="9.5" fill="var(--hue-mint, #6fe3a8)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.18em" fontWeight={700}>
            LATENT z ∈ R²
          </text>
          <text x={X_DEC} y={28} fontSize="9.5" fill="var(--hue-sky, #5ecbff)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.18em" fontWeight={700}>
            DECODER pθ
          </text>
          <text x={W - 60} y={28} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.18em">
            RECON x̂
          </text>

          <line x1={X_INPUT + GRID_PX / 2 + 8} y1={Y_MID} x2={X_ENC - 38} y2={Y_MID} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="3 3" />
          <line x1={X_ENC + 38} y1={Y_MID} x2={X_LAT - 75} y2={Y_MID} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="3 3" />
          <line x1={X_LAT + 75} y1={Y_MID} x2={X_DEC - 38} y2={Y_MID} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="3 3" />
          <line x1={X_DEC + 38} y1={Y_MID} x2={W - 60 - GRID_PX / 2 - 8} y2={Y_MID} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="3 3" />

          <PixelGrid cx={X_INPUT} cy={Y_MID} values={inputImage} accent="var(--accent)" />

          <Funnel
            x={X_ENC - 38}
            y={Y_MID - 56}
            w={76}
            h={112}
            dir="right"
            label="qφ"
            sub="μ, log σ²"
            tint="var(--hue-sky, #5ecbff)"
          />
          <g>
            <text x={X_ENC} y={Y_MID + 78} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle">
              μ = ({snap(mu[0], 2)}, {snap(mu[1], 2)})
            </text>
            <text x={X_ENC} y={Y_MID + 92} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle">
              log σ² = ({snap(lv[0], 2)}, {snap(lv[1], 2)})
            </text>
          </g>

          <LatentPlot
            cx={X_LAT}
            cy={Y_MID}
            size={150}
            mu={manualZ ? zManual : mu}
            lv={manualZ ? [-2.5, -2.5] : lv}
            z={zAnim}
            eps={eps}
            beta={beta}
          />

          <Funnel
            x={X_DEC - 38}
            y={Y_MID - 56}
            w={76}
            h={112}
            dir="left"
            label="pθ"
            sub="z → x̂"
            tint="var(--hue-sky, #5ecbff)"
          />

          <PixelGrid cx={W - 60} cy={Y_MID} values={xHatAnim} accent="var(--hue-pink, #ff66cc)" />

          <text x={X_LAT} y={H - 20} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.1em">
            reparam: z = μ + σ · ε,  ε ~ N(0, I)
          </text>
        </svg>
      </div>

      <div className="mlviz-toggles">
        <button
          type="button"
          className={`mlviz-toggle ${manualZ ? 'is-on' : ''}`}
          onClick={() => setManualZ((v) => !v)}
          style={{ '--toggle-color': 'var(--hue-mint, #6fe3a8)' }}
        >
          <span className="mlviz-toggle-dot" />
          {manualZ ? <Unlock size={11} /> : <Lock size={11} />}
          <span>{manualZ ? 'manual z — explore' : 'sampled z — encoder driven'}</span>
        </button>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row" style={{ gap: '0.6rem' }}>
          <span className="mlviz-tag">x</span>
          <span className="mlviz-sub">
            seed digit · index {((seed % DIGIT_TEMPLATES.length) + DIGIT_TEMPLATES.length) % DIGIT_TEMPLATES.length}
          </span>
        </div>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">β (KL weight)</span>
          <input
            type="range"
            min="0"
            max="4"
            step="0.05"
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(beta, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">z₁</span>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.05"
            value={z1Display}
            onChange={(e) => handleZSlider(0, parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(z1Display, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">z₂</span>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.05"
            value={z2Display}
            onChange={(e) => handleZSlider(1, parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(z2Display, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">L_rec</span>
            <span
              className="mlviz-val"
              style={{ color: lRec < 0.08 ? 'var(--easy, #28c244)' : lRec < 0.2 ? 'var(--warning, #f4b740)' : 'var(--hard, #ef476f)' }}
            >
              {snap(lRec, 4)}
            </span>
            <span className="mlviz-sub">reconstruction loss · MSE(x, x̂)</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">KL</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-violet, #b48cff)' }}>
              {snap(lKl, 4)}
            </span>
            <span className="mlviz-sub">D_KL( q(z|x) ∥ N(0, I) )</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">ELBO</span>
            <span className="mlviz-val">{snap(lElbo, 4)}</span>
            <span className="mlviz-sub">= L_rec + β · KL</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={triggerSample}
          >
            <Dice5 size={13} />
            <span>Sample ε</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={nextSeed}
          >
            <span>Next digit</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reset}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {manualZ
            ? 'manual mode — sweep z₁ / z₂ to see how the decoder paints x̂'
            : 'sample ε to re-roll z = μ + σ · ε; β trades reconstruction for prior match'}
        </div>
      </div>
    </div>
  );
}
