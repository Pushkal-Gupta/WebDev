import React, { useMemo, useState, useCallback } from 'react';
import { RotateCcw, Sparkles, MousePointerClick } from 'lucide-react';
import './MLViz.css';

const W = 640;
const H = 360;
const PLOT_SIZE = 240;
const PLOT_Y = 60;
const LEFT_X = 90;
const RIGHT_X = 360;
const N_POINTS = 12;

// Deterministic PRNG so the scene is stable across renders / re-mounts.
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

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// 12 stylised 4x4 "training images" used as decode previews when a latent is clicked.
const TRAIN_TEMPLATES = [
  [0,1,1,0, 1,0,0,1, 1,0,0,1, 0,1,1,0],   // 0
  [0,0,1,0, 0,1,1,0, 0,0,1,0, 0,1,1,1],   // 1
  [1,1,1,0, 0,0,1,0, 0,1,0,0, 1,1,1,1],   // 2
  [1,1,1,0, 0,0,1,0, 0,1,1,0, 1,1,1,0],   // 3
  [1,0,1,0, 1,1,1,0, 0,0,1,0, 0,0,1,0],   // 4
  [1,1,1,1, 1,0,0,0, 0,1,1,0, 1,1,1,0],   // 5
  [0,1,1,1, 1,0,0,0, 1,1,1,0, 1,1,1,0],   // 6
  [1,1,1,1, 0,0,0,1, 0,0,1,0, 0,1,0,0],   // 7
  [0,1,1,0, 1,0,0,1, 0,1,1,0, 1,0,0,1],   // 8
  [0,1,1,0, 1,0,1,1, 0,1,1,1, 0,0,1,0],   // 9
  [1,0,0,1, 0,1,1,0, 0,1,1,0, 1,0,0,1],   // X
  [1,1,1,1, 1,0,0,0, 1,0,0,0, 1,0,0,0],   // L
];

// Vanilla AE latents — deliberately scattered all over the plane, no structure.
// Hand-laid so 12 points actually fill the available area.
const AE_RAW = [
  [-2.4, 2.1], [ 1.8, 2.6], [ 2.7,-1.2], [-1.6,-2.4],
  [ 0.4, 2.9], [-2.9, 0.6], [ 2.3, 0.3], [-0.7,-2.7],
  [ 1.2,-2.1], [-2.7,-0.4], [ 0.1, 0.7], [ 2.6, 2.4],
];

// VAE μ — already pulled inward; β slider squeezes further toward origin.
const VAE_MU_BASE = [
  [-1.1, 0.9], [ 0.8, 1.2], [ 1.3,-0.4], [-0.8,-1.1],
  [ 0.2, 1.4], [-1.4, 0.2], [ 1.1, 0.1], [-0.3,-1.3],
  [ 0.6,-0.9], [-1.2,-0.2], [ 0.05, 0.3],[ 1.2, 1.1],
];

// per-blob base σ that the slider can shrink (high β) or relax toward zero (β=0).
const VAE_SIGMA_BASE = [
  0.55, 0.50, 0.60, 0.45, 0.52, 0.58, 0.48, 0.50,
  0.55, 0.62, 0.40, 0.47,
];

// Spread-axis labels (just a few ticks).
function gridLines(cx, cy, size, scale) {
  const half = size / 2;
  const x0 = cx - half;
  const y0 = cy - half;
  const lines = [];
  for (let v = -3; v <= 3; v++) {
    const px = cx + v * scale;
    const py = cy - v * scale;
    lines.push(
      <line
        key={`vx-${cx}-${v}`}
        x1={px}
        y1={y0}
        x2={px}
        y2={y0 + size}
        stroke="var(--border)"
        strokeWidth={v === 0 ? 1.0 : 0.4}
        opacity={v === 0 ? 0.7 : 0.4}
      />,
    );
    lines.push(
      <line
        key={`vy-${cx}-${v}`}
        x1={x0}
        y1={py}
        x2={x0 + size}
        y2={py}
        stroke="var(--border)"
        strokeWidth={v === 0 ? 1.0 : 0.4}
        opacity={v === 0 ? 0.7 : 0.4}
      />,
    );
  }
  return lines;
}

function PreviewGrid({ values, label, accent }) {
  const cell = 14;
  const pad = 6;
  const side = cell * 4 + pad * 2;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.55rem 0.7rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.15em',
          color: 'var(--text-dim)',
          fontFamily: 'var(--mono, monospace)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <svg width={side} height={side} role="img" aria-label={label}>
        <rect x={0} y={0} width={side} height={side} rx={4} fill="var(--bg)" stroke="var(--border)" />
        {values.map((v, i) => {
          const r = Math.floor(i / 4);
          const c = i % 4;
          return (
            <rect
              key={`pv-${i}`}
              x={pad + c * cell + 1}
              y={pad + r * cell + 1}
              width={cell - 2}
              height={cell - 2}
              rx={2}
              fill={accent}
              opacity={0.08 + v * 0.85}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function VAELatentViz() {
  const [beta, setBeta] = useState(1.0);
  const [selected, setSelected] = useState({ side: 'vae', idx: 4 });

  // Use β to interpolate the VAE means/sigmas.
  //   β = 0  -> behaves like vanilla AE: means pushed outward, σ shrinks toward 0.05.
  //   β = 1  -> baseline VAE — moderate pull, broad blobs.
  //   β = 5  -> over-regularised: all means crushed to origin, σ shrinks to share one blob.
  const vaePoints = useMemo(() => {
    return VAE_MU_BASE.map((mu, i) => {
      let pullToOrigin;
      let sigma;
      if (beta <= 1) {
        // 0..1 transition: AE-like spread -> baseline VAE.
        const t = beta;
        pullToOrigin = t;
        sigma = 0.05 + (VAE_SIGMA_BASE[i] - 0.05) * t;
      } else {
        // 1..5 transition: keep pulling inward, slowly shrink blobs (over-regularised).
        const t = Math.min(1, (beta - 1) / 4);
        pullToOrigin = 1 + t * 1.3; // overshoot — means pile up near origin
        sigma = VAE_SIGMA_BASE[i] * (1 - t * 0.65);
      }
      // Interpolate from "AE outer" toward "origin".
      const outer = AE_RAW[i];
      const mx = outer[0] * (1 - pullToOrigin) + mu[0] * (pullToOrigin <= 1 ? 1 : 1);
      const my = outer[1] * (1 - pullToOrigin) + mu[1] * (pullToOrigin <= 1 ? 1 : 1);
      // For β > 1 we keep shrinking μ further toward (0,0).
      let cx = mx;
      let cy = my;
      if (beta > 1) {
        const extra = Math.min(1, (beta - 1) / 4);
        cx = mu[0] * (1 - extra);
        cy = mu[1] * (1 - extra);
      }
      return { mu: [cx, cy], sigma: Math.max(0.03, sigma) };
    });
  }, [beta]);

  // KL approximation across the 12 points: 0.5 * sum(mu^2 + sigma^2 - 1 - log sigma^2)/N.
  const klApprox = useMemo(() => {
    let s = 0;
    vaePoints.forEach(({ mu, sigma }) => {
      const v = sigma * sigma;
      s += 0.5 * (mu[0] * mu[0] + mu[1] * mu[1] + 2 * v - 2 - 2 * Math.log(v));
    });
    return s / vaePoints.length;
  }, [vaePoints]);

  const avgDistVAE = useMemo(() => {
    let s = 0;
    vaePoints.forEach(({ mu }) => {
      s += Math.sqrt(mu[0] * mu[0] + mu[1] * mu[1]);
    });
    return s / vaePoints.length;
  }, [vaePoints]);

  const avgDistAE = useMemo(() => {
    let s = 0;
    AE_RAW.forEach(([x, y]) => {
      s += Math.sqrt(x * x + y * y);
    });
    return s / AE_RAW.length;
  }, []);

  // Decode the selected latent into a pseudo-reconstruction (4x4 image).
  const reconstruction = useMemo(() => {
    if (!selected) return null;
    const base = TRAIN_TEMPLATES[selected.idx];
    if (selected.side === 'ae') {
      // Vanilla AE: clean reconstruction at training points; off-point random would be garbage.
      return base.map((v) => (v ? 0.92 : 0.05));
    }
    // VAE: reconstruction quality degrades as β grows (blobs merge → information lost).
    const cleanT = Math.max(0, 1 - Math.max(0, beta - 1) / 3);
    const rng = mulberry32(selected.idx * 173 + Math.round(beta * 100));
    return base.map((v) => {
      const noise = (rng() - 0.5) * 0.3 * (1 - cleanT);
      const clean = v ? 0.88 : 0.08;
      return Math.max(0, Math.min(1, clean + noise));
    });
  }, [selected, beta]);

  const reset = useCallback(() => {
    setBeta(1.0);
    setSelected({ side: 'vae', idx: 4 });
  }, []);

  const scaleAE = (PLOT_SIZE / 2) / 3.2;
  const scaleVAE = (PLOT_SIZE / 2) / 3.2;
  const aeCX = LEFT_X + PLOT_SIZE / 2;
  const aeCY = PLOT_Y + PLOT_SIZE / 2;
  const vaeCX = RIGHT_X + PLOT_SIZE / 2;
  const vaeCY = PLOT_Y + PLOT_SIZE / 2;

  const toAEx = (v) => aeCX + v * scaleAE;
  const toAEy = (v) => aeCY - v * scaleAE;
  const toVAEx = (v) => vaeCX + v * scaleVAE;
  const toVAEy = (v) => vaeCY - v * scaleVAE;

  const regionR = scaleVAE * 1.0; // visual N(0, I) "regularisation region"

  const selectedLabel = selected
    ? `${selected.side === 'ae' ? 'vanilla AE point' : 'VAE blob'} #${selected.idx + 1}`
    : 'click a latent';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px' }}>
          {/* Panel headings */}
          <text
            x={aeCX}
            y={36}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.18em"
          >
            VANILLA AE — discrete points
          </text>
          <text
            x={vaeCX}
            y={36}
            fontSize="10.5"
            fill="var(--hue-mint, #6fe3a8)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.18em"
            fontWeight={700}
          >
            VAE — Gaussian blobs · β = {snap(beta, 2)}
          </text>

          {/* LEFT plot — vanilla AE */}
          <rect
            x={LEFT_X}
            y={PLOT_Y}
            width={PLOT_SIZE}
            height={PLOT_SIZE}
            rx={10}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          {gridLines(aeCX, aeCY, PLOT_SIZE, scaleAE)}
          {/* No prior region — vanilla AE has no concept of one. */}
          <text
            x={LEFT_X + 8}
            y={PLOT_Y + 16}
            fontSize="8.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >
            no prior — empty space everywhere
          </text>
          {AE_RAW.map(([x, y], i) => {
            const isSel = selected.side === 'ae' && selected.idx === i;
            return (
              <g
                key={`ae-${i}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected({ side: 'ae', idx: i })}
              >
                <circle
                  cx={toAEx(x)}
                  cy={toAEy(y)}
                  r={isSel ? 9 : 6}
                  fill="transparent"
                />
                <circle
                  cx={toAEx(x)}
                  cy={toAEy(y)}
                  r={isSel ? 6.5 : 4.5}
                  fill="var(--accent)"
                  stroke={isSel ? 'var(--text-main)' : 'var(--bg)'}
                  strokeWidth={isSel ? 1.6 : 1}
                />
                <text
                  x={toAEx(x) + 8}
                  y={toAEy(y) - 7}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* RIGHT plot — VAE */}
          <rect
            x={RIGHT_X}
            y={PLOT_Y}
            width={PLOT_SIZE}
            height={PLOT_SIZE}
            rx={10}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          {gridLines(vaeCX, vaeCY, PLOT_SIZE, scaleVAE)}
          {/* Prior region — dashed unit circle for N(0,I). */}
          <circle
            cx={vaeCX}
            cy={vaeCY}
            r={regionR * 2}
            fill="color-mix(in srgb, var(--hue-violet, #b48cff) 6%, transparent)"
            stroke="var(--hue-violet, #b48cff)"
            strokeWidth={0.9}
            strokeDasharray="3 4"
            opacity={0.55}
          />
          <circle
            cx={vaeCX}
            cy={vaeCY}
            r={regionR}
            fill="none"
            stroke="var(--hue-violet, #b48cff)"
            strokeWidth={0.9}
            strokeDasharray="2 3"
            opacity={0.7}
          />
          <text
            x={RIGHT_X + 8}
            y={PLOT_Y + 16}
            fontSize="8.5"
            fill="var(--hue-violet, #b48cff)"
            fontFamily="var(--mono, monospace)"
          >
            N(0, I) prior — KL pulls blobs into here
          </text>

          {vaePoints.map(({ mu, sigma }, i) => {
            const isSel = selected.side === 'vae' && selected.idx === i;
            const rx = Math.max(2, sigma * scaleVAE);
            return (
              <g
                key={`vae-${i}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected({ side: 'vae', idx: i })}
              >
                <ellipse
                  cx={toVAEx(mu[0])}
                  cy={toVAEy(mu[1])}
                  rx={rx * 2}
                  ry={rx * 2}
                  fill="var(--hue-mint, #6fe3a8)"
                  opacity={isSel ? 0.18 : 0.08}
                />
                <ellipse
                  cx={toVAEx(mu[0])}
                  cy={toVAEy(mu[1])}
                  rx={rx}
                  ry={rx}
                  fill="var(--hue-mint, #6fe3a8)"
                  opacity={isSel ? 0.45 : 0.28}
                  stroke="var(--hue-mint, #6fe3a8)"
                  strokeWidth={isSel ? 1.6 : 1}
                />
                <circle
                  cx={toVAEx(mu[0])}
                  cy={toVAEy(mu[1])}
                  r={isSel ? 3.4 : 2.4}
                  fill={isSel ? 'var(--text-main)' : 'var(--hue-mint, #6fe3a8)'}
                />
                <text
                  x={toVAEx(mu[0]) + 7}
                  y={toVAEy(mu[1]) - 6}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Footer caption */}
          <text
            x={W / 2}
            y={H - 14}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            click any latent to decode · slide β to watch the prior squeeze the blobs
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">β (KL weight)</span>
          <input
            type="range"
            min="0"
            max="5"
            step="0.05"
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(beta, 2)}</span>
        </label>

        <div className="mlviz-row" style={{ gap: '0.6rem' }}>
          <span className="mlviz-tag">‖μ‖ AE</span>
          <span className="mlviz-val">{snap(avgDistAE, 3)}</span>
          <span className="mlviz-sub">avg distance to origin (vanilla AE)</span>
        </div>
        <div className="mlviz-row" style={{ gap: '0.6rem' }}>
          <span className="mlviz-tag">‖μ‖ VAE</span>
          <span
            className="mlviz-val"
            style={{
              color:
                avgDistVAE < 0.5
                  ? 'var(--warning, #f4b740)'
                  : avgDistVAE < 1.8
                  ? 'var(--easy, #28c244)'
                  : 'var(--hard, #ef476f)',
            }}
          >
            {snap(avgDistVAE, 3)}
          </span>
          <span className="mlviz-sub">avg distance to origin (current β)</span>
        </div>
        <div className="mlviz-row" style={{ gap: '0.6rem' }}>
          <span className="mlviz-tag">KL</span>
          <span className="mlviz-val" style={{ color: 'var(--hue-violet, #b48cff)' }}>
            {snap(klApprox, 3)}
          </span>
          <span className="mlviz-sub">avg D_KL( q(z|x) ∥ N(0,I) ) across 12 inputs</span>
        </div>

        <div
          className="mlviz-row"
          style={{
            gap: '0.9rem',
            alignItems: 'center',
            padding: '0.55rem 0',
            borderTop: '1px solid var(--border)',
            marginTop: '0.3rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.7rem',
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono, monospace)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <MousePointerClick size={13} />
            {selectedLabel}
          </div>
          {reconstruction && (
            <PreviewGrid
              values={reconstruction}
              label={selected.side === 'ae' ? 'AE recon' : 'VAE recon'}
              accent={selected.side === 'ae' ? 'var(--accent)' : 'var(--hue-mint, #6fe3a8)'}
            />
          )}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setBeta(0)}
            title="collapse VAE to vanilla AE behaviour"
          >
            <Sparkles size={13} />
            <span>β = 0 (AE mode)</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setBeta(1.0)}
          >
            <span>β = 1 (balanced)</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setBeta(5)}
            title="over-regularise — every blob piles onto the origin"
          >
            <span>β = 5 (collapse)</span>
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
          {beta < 0.15
            ? 'β ≈ 0 — the VAE behaves like a vanilla AE: blobs shrink to points, gaps everywhere.'
            : beta > 3.5
            ? 'β ≫ 1 — over-regularised: every input maps to the origin, the decoder loses its labels.'
            : 'baseline β ≈ 1 — blobs cover the prior region, sampling z ~ N(0, I) lands inside a known blob.'}
        </div>
      </div>
    </div>
  );
}
