import React, { useMemo, useState, useCallback } from 'react';
import { RotateCcw, Image as ImageIcon } from 'lucide-react';
import './MLViz.css';

const GRID = 16;
const TILE_PX = 96;
const SOURCE_PX = 160;
const AUG_COUNT = 8;

/* Mulberry32 — small deterministic seeded PRNG. */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* Hand-traced 16x16 pixel grids for digits "0".."9" — 1.0 = ink, 0 = blank.
   Used as the source image. Default is "5". */
function makeDigit5() {
  const g = Array.from({ length: GRID }, () => new Array(GRID).fill(0));
  const ink = (r, c) => { if (r >= 0 && r < GRID && c >= 0 && c < GRID) g[r][c] = 1; };
  // top bar: rows 2-3, cols 3-12
  for (let c = 3; c <= 12; c++) { ink(2, c); ink(3, c); }
  // left vertical of top: rows 4-7, cols 3-4
  for (let r = 4; r <= 7; r++) { ink(r, 3); ink(r, 4); }
  // middle bar: rows 7-8, cols 3-11
  for (let c = 3; c <= 11; c++) { ink(7, c); ink(8, c); }
  // right vertical of bottom: rows 9-12, cols 10-11
  for (let r = 9; r <= 12; r++) { ink(r, 10); ink(r, 11); }
  // bottom bar with curl: rows 12-13, cols 3-11
  for (let c = 3; c <= 11; c++) { ink(12, c); ink(13, c); }
  // small inner anti-aliasing taps
  ink(4, 5); ink(11, 9);
  return g;
}

const SOURCE = makeDigit5();

/* Sampling helpers — all augmentations operate on a continuous-coord [0..GRID) plane.
   Bilinear sampling lets RandomCrop / RandomRotate look like real image ops at this size. */
function sample(g, y, x) {
  // out-of-bounds → 0 (background)
  if (y < 0 || x < 0 || y >= GRID || x >= GRID) return 0;
  const r0 = Math.floor(y), c0 = Math.floor(x);
  const r1 = Math.min(GRID - 1, r0 + 1);
  const c1 = Math.min(GRID - 1, c0 + 1);
  const dy = y - r0, dx = x - c0;
  const a = g[r0][c0], b = g[r0][c1], c = g[r1][c0], d = g[r1][c1];
  const ab = a * (1 - dx) + b * dx;
  const cd = c * (1 - dx) + d * dx;
  return ab * (1 - dy) + cd * dy;
}

function emptyGrid() {
  return Array.from({ length: GRID }, () => new Array(GRID).fill(0));
}

/* RandomCrop — pick a 14x14 window inside the 16x16 and scale it back to 16x16. */
function applyCrop(grid, rng) {
  const W = 14;
  const off = GRID - W; // 2
  const oy = Math.floor(rng() * (off + 1));
  const ox = Math.floor(rng() * (off + 1));
  const out = emptyGrid();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const sy = oy + (r / (GRID - 1)) * (W - 1);
      const sx = ox + (c / (GRID - 1)) * (W - 1);
      out[r][c] = sample(grid, sy, sx);
    }
  }
  return out;
}

/* RandomFlip horizontal — 50% chance to mirror about the vertical axis. */
function applyFlip(grid, rng) {
  if (rng() < 0.5) return grid;
  const out = emptyGrid();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      out[r][c] = grid[r][GRID - 1 - c];
    }
  }
  return out;
}

/* RandomRotate — angle in [-15°, +15°], rotated about the center, bilinear sampling. */
function applyRotate(grid, rng) {
  const deg = (rng() * 2 - 1) * 15;
  const rad = (deg * Math.PI) / 180;
  const cosA = Math.cos(rad), sinA = Math.sin(rad);
  const cx = (GRID - 1) / 2;
  const out = emptyGrid();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const dy = r - cx, dx = c - cx;
      const sy = cosA * dy + sinA * dx + cx;
      const sx = -sinA * dy + cosA * dx + cx;
      out[r][c] = sample(grid, sy, sx);
    }
  }
  return out;
}

/* RandomBrightness — additive shift in [-0.2, +0.2], clamped to [0, 1]. */
function applyBrightness(grid, rng) {
  const shift = (rng() * 2 - 1) * 0.2;
  const out = emptyGrid();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      out[r][c] = Math.max(0, Math.min(1, grid[r][c] + shift));
    }
  }
  return out;
}

/* RandomContrast — scale around mean by factor in [0.7, 1.3], clamp. */
function applyContrast(grid, rng) {
  const factor = 0.7 + rng() * 0.6;
  let mean = 0;
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) mean += grid[r][c];
  mean /= GRID * GRID;
  const out = emptyGrid();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const v = (grid[r][c] - mean) * factor + mean;
      out[r][c] = Math.max(0, Math.min(1, v));
    }
  }
  return out;
}

/* GaussianNoise — Box-Muller noise, sigma=0.12, clamp to [0, 1]. */
function applyNoise(grid, rng) {
  const sigma = 0.12;
  const out = emptyGrid();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const u1 = Math.max(1e-9, rng());
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const v = grid[r][c] + z * sigma;
      out[r][c] = Math.max(0, Math.min(1, v));
    }
  }
  return out;
}

/* Cutout — zero a random 4x4 patch inside the grid. */
function applyCutout(grid, rng) {
  const SZ = 4;
  const oy = Math.floor(rng() * (GRID - SZ + 1));
  const ox = Math.floor(rng() * (GRID - SZ + 1));
  const out = grid.map((row) => row.slice());
  for (let r = oy; r < oy + SZ; r++) {
    for (let c = ox; c < ox + SZ; c++) {
      out[r][c] = 0;
    }
  }
  return out;
}

/* Pipeline order is fixed; toggling each op decides if it runs.
   Order rationale: geometry first (crop→flip→rotate), then photometric
   (brightness→contrast→noise), then masking (cutout). Real torchvision
   pipelines do the same so the masked patch stays an axis-aligned hole. */
const PIPELINE = [
  { key: 'crop',       label: 'RandomCrop',       desc: 'crop 14x14 -> scale 16x16', fn: applyCrop },
  { key: 'flip',       label: 'RandomFlip',       desc: 'horizontal mirror p=0.5',   fn: applyFlip },
  { key: 'rotate',     label: 'RandomRotate',     desc: '+/-15 degrees',             fn: applyRotate },
  { key: 'brightness', label: 'RandomBrightness', desc: 'additive +/-0.2',           fn: applyBrightness },
  { key: 'contrast',   label: 'RandomContrast',   desc: 'scale around mean 0.7-1.3', fn: applyContrast },
  { key: 'noise',      label: 'GaussianNoise',    desc: 'sigma = 0.12',              fn: applyNoise },
  { key: 'cutout',     label: 'Cutout',           desc: 'zero a 4x4 region',         fn: applyCutout },
];

const DEFAULT_ENABLED = {
  crop: true, flip: true, rotate: true, brightness: true,
  contrast: true, noise: true, cutout: true,
};

function applyPipeline(source, enabled, rng) {
  let g = source;
  for (const op of PIPELINE) {
    if (enabled[op.key]) g = op.fn(g, rng);
  }
  return g;
}

/* Render a 16x16 grid as a packed SVG of squares filled by intensity.
   Background is var(--bg); ink colour leans on accent-rgb so each palette tints the digit. */
function GridSVG({ grid, sizePx, hi }) {
  const cell = sizePx / GRID;
  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const v = grid[r][c];
      if (v <= 0.02) continue;
      const a = 0.18 + Math.min(1, v) * 0.7;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * cell}
          y={r * cell}
          width={cell + 0.6}
          height={cell + 0.6}
          fill={`rgba(var(--accent-rgb, 0, 255, 245), ${a.toFixed(3)})`}
        />
      );
    }
  }
  return (
    <svg
      viewBox={`0 0 ${sizePx} ${sizePx}`}
      width={sizePx}
      height={sizePx}
      style={{ display: 'block' }}
    >
      <rect x="0" y="0" width={sizePx} height={sizePx} fill="var(--bg)" />
      {/* faint gridlines so the pixel structure is visible */}
      <g opacity="0.18" stroke="var(--border)" strokeWidth="0.4">
        {Array.from({ length: GRID + 1 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * cell} x2={sizePx} y2={i * cell} />
        ))}
        {Array.from({ length: GRID + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={i * cell} y1="0" x2={i * cell} y2={sizePx} />
        ))}
      </g>
      {cells}
      <rect
        x="0.5"
        y="0.5"
        width={sizePx - 1}
        height={sizePx - 1}
        fill="none"
        stroke={hi ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={hi ? 1.4 : 1}
        rx="4"
      />
    </svg>
  );
}

export default function ImageAugmentationViz() {
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED);
  const [seed, setSeed] = useState(20260608);

  const variants = useMemo(() => {
    const out = [];
    for (let i = 0; i < AUG_COUNT; i++) {
      // each tile gets its own deterministic stream off the master seed so toggles re-render cleanly
      const rng = mulberry32(seed + i * 9301 + 49297);
      out.push(applyPipeline(SOURCE, enabled, rng));
    }
    return out;
  }, [enabled, seed]);

  const toggle = useCallback((key) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const reroll = useCallback(() => {
    setSeed((s) => (s * 1664525 + 1013904223) >>> 0 || 1);
  }, []);

  const activeCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="mlviz-wrap" style={{ background: 'var(--bg)' }}>
      <div
        className="mlviz-stage"
        style={{ flexDirection: 'column', gap: '0.9rem', padding: '1rem' }}
      >
        {/* Source + variant grid side-by-side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '1.1rem',
            alignItems: 'start',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.16em',
                color: 'var(--text-dim)',
                fontFamily: 'var(--mono)',
                textTransform: 'uppercase',
              }}
            >
              Source 16x16
            </div>
            <GridSVG grid={SOURCE} sizePx={SOURCE_PX} hi />
            <div
              style={{
                fontSize: '0.66rem',
                color: 'var(--text-dim)',
                fontFamily: 'var(--mono)',
              }}
            >
              digit "5"
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.16em',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                  textTransform: 'uppercase',
                }}
              >
                Augmented batch (8)
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.06em',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                }}
              >
                seed {seed.toString(16)} | ops {activeCount}/{PIPELINE.length}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(4, ${TILE_PX}px)`,
                gap: '0.5rem',
                justifyContent: 'start',
              }}
            >
              {variants.map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <GridSVG grid={g} sizePx={TILE_PX} />
                  <span
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-dim)',
                      fontFamily: 'var(--mono)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    sample {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Augmentation toggles */}
      <div className="mt-controls" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.7rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <span
            style={{
              fontSize: '0.66rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
            }}
          >
            Pipeline
          </span>
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={reroll}>
            <RotateCcw size={13} />
            <span>Re-roll</span>
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
          }}
        >
          {PIPELINE.map((op) => {
            const on = enabled[op.key];
            return (
              <button
                key={op.key}
                type="button"
                onClick={() => toggle(op.key)}
                title={op.desc}
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.15rem',
                  padding: '0.45rem 0.7rem',
                  borderRadius: 8,
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  background: on
                    ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.1)'
                    : 'var(--bg)',
                  color: on ? 'var(--accent)' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  textAlign: 'left',
                  transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <ImageIcon size={11} />
                  {op.label}
                </span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    letterSpacing: '0.04em',
                    color: 'var(--text-dim)',
                  }}
                >
                  {op.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>aug</span>
          <span className="mlviz-val">{activeCount} active</span>
          <span className="mlviz-sub">applied left-to-right; geometry then photometric then mask</span>
        </div>
        <div className="mlviz-hint">toggle ops to mix the policy, re-roll for a fresh seed</div>
      </div>
    </div>
  );
}
