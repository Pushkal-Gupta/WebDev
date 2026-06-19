import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 320;
// two tiles: original (left) and augmented (right)
const TILE = 150;
const GAP = 70;
const TILE_Y = 40;
const LEFT_X = (W - (TILE * 2 + GAP)) / 2;
const RIGHT_X = LEFT_X + TILE + GAP;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

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

// A small 6x6 "image": a stylised arrow/glyph so flips and rotations are visible.
// 1 = filled cell. The shape is deliberately asymmetric (an arrow pointing right + a corner dot).
const GLYPH = [
  [0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 1],
];
const N = 6;

// Build the list of filled cells with a base intensity.
function baseCells() {
  const out = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (GLYPH[r][c]) out.push({ r, c });
    }
  }
  return out;
}

function renderTile(x, y, opts) {
  const { flip, rotate, scale, crop, bright, noise, seed } = opts;
  const cell = TILE / N;
  const cx = x + TILE / 2;
  const cy = y + TILE / 2;
  const rad = (rotate * Math.PI) / 180;
  const rand = mulberry32(seed);

  const cells = baseCells();

  return (
    <g>
      {/* tile border + faint grid */}
      <rect x={x} y={y} width={TILE} height={TILE} fill="var(--bg)" stroke="var(--border)" strokeWidth="1" rx="6" />
      {Array.from({ length: N - 1 }).map((_, i) => (
        <g key={`grid-${i}`}>
          <line x1={x + (i + 1) * cell} y1={y} x2={x + (i + 1) * cell} y2={y + TILE} stroke="var(--border)" strokeWidth="0.3" opacity="0.4" />
          <line x1={x} y1={y + (i + 1) * cell} x2={x + TILE} y2={y + (i + 1) * cell} stroke="var(--border)" strokeWidth="0.3" opacity="0.4" />
        </g>
      ))}

      {/* crop window outline */}
      {crop < 1 && (
        <rect
          x={cx - (TILE * crop) / 2}
          y={cy - (TILE * crop) / 2}
          width={TILE * crop}
          height={TILE * crop}
          fill="none"
          stroke="var(--hue-sky)"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.8"
        />
      )}

      {/* transform group: translate to center, rotate, scale, optional flip */}
      <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${(flip ? -1 : 1) * scale} ${scale})`}>
        {cells.map(({ r, c }, i) => {
          // local cell center relative to tile center (in original orientation)
          const lx = (c - (N - 1) / 2) * cell;
          const ly = (r - (N - 1) / 2) * cell;
          // deterministic per-cell brightness with noise
          let intensity = bright;
          if (noise > 0) intensity += (rand() - 0.5) * 2 * noise;
          intensity = Math.max(0.12, Math.min(1, intensity));
          return (
            <rect
              key={`cell-${i}`}
              x={lx - cell / 2 + 0.6}
              y={ly - cell / 2 + 0.6}
              width={cell - 1.2}
              height={cell - 1.2}
              rx="2"
              fill="var(--accent)"
              opacity={intensity}
            />
          );
        })}
      </g>

      {/* crop mask: dim the area outside the crop window after the fact, via overlay strokes */}
      {/* (kept visual-only via the dashed window above; no clip to avoid scrollable overflow) */}

      {/* unrotated rotation guide */}
      {Math.abs(rotate) > 0.5 && (
        <line
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(rad - Math.PI / 2) * (TILE / 2 - 6)}
          y2={cy + Math.sin(rad - Math.PI / 2) * (TILE / 2 - 6)}
          stroke="var(--hue-pink)"
          strokeWidth="1"
          opacity="0.6"
        />
      )}
    </g>
  );
}

export default function DataAugmentationViz() {
  const [flip, setFlip] = useState(true);
  const [rotate, setRotate] = useState(12);
  const [crop, setCrop] = useState(0.85);
  const [scale, setScale] = useState(1.0);
  const [bright, setBright] = useState(0.85);
  const [noise, setNoise] = useState(0.18);
  const [seed, setSeed] = useState(7);

  // How many "distinct" variants this pipeline can produce (rough multiplicative estimate).
  const variants = useMemo(() => {
    let v = 1;
    if (flip) v *= 2; // 2 flip states
    if (Math.abs(rotate) > 0.5) v *= 30; // ~continuous rotation buckets
    if (crop < 0.999) v *= 25; // crop positions/sizes
    if (Math.abs(scale - 1) > 0.01) v *= 8;
    if (noise > 0.01) v *= 100; // effectively unbounded
    return v;
  }, [flip, rotate, crop, scale, noise]);

  const reset = () => {
    setFlip(true);
    setRotate(12);
    setCrop(0.85);
    setScale(1.0);
    setBright(0.85);
    setNoise(0.18);
    setSeed(7);
  };

  const activeList = [
    flip && 'h-flip',
    Math.abs(rotate) > 0.5 && `rotate ${rotate}°`,
    crop < 0.999 && `crop ${Math.round(crop * 100)}%`,
    Math.abs(scale - 1) > 0.01 && `scale ${snap(scale, 2)}×`,
    Math.abs(bright - 1) > 0.01 && `bright ${snap(bright, 2)}`,
    noise > 0.01 && `noise ${snap(noise, 2)}`,
  ].filter(Boolean);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}` }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* original */}
          {renderTile(LEFT_X, TILE_Y, { flip: false, rotate: 0, scale: 1, crop: 1, bright: 0.9, noise: 0, seed })}
          <text x={LEFT_X + TILE / 2} y={TILE_Y - 12} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.12em">
            ORIGINAL
          </text>
          <text x={LEFT_X + TILE / 2} y={TILE_Y + TILE + 20} fontSize="8.5" fill="var(--hue-violet)" fontFamily="var(--mono)" textAnchor="middle">
            label: class A
          </text>

          {/* arrow between */}
          <g>
            <line x1={LEFT_X + TILE + 12} y1={TILE_Y + TILE / 2} x2={RIGHT_X - 12} y2={TILE_Y + TILE / 2} stroke="var(--text-dim)" strokeWidth="1.2" />
            <path d={`M${RIGHT_X - 12},${TILE_Y + TILE / 2} l-7,-4 l0,8 Z`} fill="var(--text-dim)" />
            <text x={(LEFT_X + TILE + RIGHT_X) / 2} y={TILE_Y + TILE / 2 - 8} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
              augment
            </text>
          </g>

          {/* augmented */}
          {renderTile(RIGHT_X, TILE_Y, { flip, rotate, scale, crop, bright, noise, seed })}
          <text x={RIGHT_X + TILE / 2} y={TILE_Y - 12} fontSize="10" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.12em">
            AUGMENTED
          </text>
          <text x={RIGHT_X + TILE / 2} y={TILE_Y + TILE + 20} fontSize="8.5" fill="var(--hue-violet)" fontFamily="var(--mono)" textAnchor="middle">
            label: class A (unchanged)
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-toggles">
          <button type="button" className={`mlviz-toggle${flip ? ' is-on' : ''}`} onClick={() => setFlip((f) => !f)}>
            <span className="mlviz-toggle-dot" />
            <span>horizontal flip</span>
          </button>
          <button type="button" className="mlviz-toggle" onClick={() => setSeed((s) => (s + 1) % 9973)} style={{ '--toggle-color': 'var(--hue-pink)' }}>
            <span className="mlviz-toggle-dot" />
            <span>resample noise</span>
          </button>
        </div>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">rotate</span>
          <input type="range" min="-30" max="30" step="1" value={rotate} onChange={(e) => setRotate(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{rotate}°</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">crop</span>
          <input type="range" min="0.6" max="1" step="0.01" value={crop} onChange={(e) => setCrop(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{Math.round(crop * 100)}%</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">scale</span>
          <input type="range" min="0.7" max="1.3" step="0.01" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(scale, 2)}×</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">brightness</span>
          <input type="range" min="0.4" max="1" step="0.01" value={bright} onChange={(e) => setBright(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(bright, 2)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">noise</span>
          <input type="range" min="0" max="0.5" step="0.01" value={noise} onChange={(e) => setNoise(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(noise, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">on</span>
            <span className="mlviz-val">{activeList.length ? activeList.join(' · ') : 'identity (no transforms)'}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">×N</span>
            <span className="mlviz-val">≈ {variants >= 100000 ? '∞' : variants.toLocaleString()} variants per image</span>
            <span className="mlviz-sub">one labelled sample → many fresh training inputs</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">∴</span>
            <span className="mlviz-val">1,000 images × 100 epochs ≈ 100,000 near-unique views</span>
            <span className="mlviz-sub">continuous params mean the model rarely sees the same pixels twice</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          the label stays class A through every transform · that is the whole rule — augment only what preserves the answer
        </div>
      </div>
    </div>
  );
}
