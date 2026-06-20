import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 420;
const PAD = 36;
const PANEL_W = 124;
const STAGE_W = W - PANEL_W - PAD * 2;
const STAGE_H = H - PAD * 2;
const STAGE_X = PAD;
const STAGE_Y = PAD;
const N = 30;
const PER_CLASS = 10;
const SEED = 0xC0FFEE17;

const CLASS_COLORS = [
  'var(--accent)',
  'var(--hue-pink)',
  'var(--hue-mint)',
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  const u = Math.max(rng(), 1e-9);
  const v = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Build 30 points in 5D, 10 per class around three well-separated centers.
function build5D(rng) {
  const centers = [
    [2.0, 0, 0, 0, 0],
    [-1.0, 1.8, 0, 0, 0],
    [-1.0, -1.8, 0, 0, 0],
  ];
  const pts = [];
  for (let i = 0; i < N; i += 1) {
    const cls = Math.floor(i / PER_CLASS);
    const c = centers[cls];
    const p = c.map((v) => v + gauss(rng) * 0.35);
    pts.push({ x5: p, cls });
  }
  return pts;
}

function dist5(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 2D projection (low-perplexity flavor): preserves local neighborhoods well but
// the global cluster centroids are scattered (noisier inter-cluster geometry).
function projectLocal(pts5, rng) {
  const centers2d = [
    { x: -0.6, y: 0.55 },
    { x: 0.85, y: 0.05 },
    { x: -0.05, y: -0.8 },
  ];
  return pts5.map((p) => {
    const c = centers2d[p.cls];
    // Spread per-class wide, so clusters mix at the edges.
    return {
      x: c.x + gauss(rng) * 0.42,
      y: c.y + gauss(rng) * 0.42,
      cls: p.cls,
    };
  });
}

// 2D projection (high-perplexity flavor): tight, well-separated globular clusters.
function projectGlobal(pts5, rng) {
  const centers2d = [
    { x: 0.95, y: 0.7 },
    { x: -1.0, y: 0.55 },
    { x: 0.0, y: -0.95 },
  ];
  return pts5.map((p) => {
    const c = centers2d[p.cls];
    return {
      x: c.x + gauss(rng) * 0.18,
      y: c.y + gauss(rng) * 0.18,
      cls: p.cls,
    };
  });
}

// Map [-1.6, 1.6] -> stage screen coords.
function toScreen(x, y) {
  const cx = STAGE_X + STAGE_W / 2 + (x / 1.7) * (STAGE_W / 2 - 14);
  const cy = STAGE_Y + STAGE_H / 2 - (y / 1.7) * (STAGE_H / 2 - 14);
  return { sx: cx, sy: cy };
}

function knnIndices(idx, distRow, k) {
  const arr = distRow
    .map((d, j) => ({ d, j }))
    .filter((e) => e.j !== idx)
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((e) => e.j);
  return new Set(arr);
}

// Trustworthiness-like score in [0,1]: fraction of original kNN pairs preserved
// in the 2D projection. Also returns the raw preserved count.
function trustworthiness(pts5, pts2, k = 5) {
  const dist5Mat = pts5.map((a) => pts5.map((b) => dist5(a.x5, b.x5)));
  const dist2Mat = pts2.map((a) => pts2.map((b) => dist2(a, b)));
  let preserved = 0;
  let total = 0;
  for (let i = 0; i < pts5.length; i += 1) {
    const knn5 = knnIndices(i, dist5Mat[i], k);
    const knn2 = knnIndices(i, dist2Mat[i], k);
    knn5.forEach((j) => {
      total += 1;
      if (knn2.has(j)) preserved += 1;
    });
  }
  return { score: total === 0 ? 0 : preserved / total, preserved, total };
}

function lerpPoints(a, b, t) {
  return a.map((pa, i) => ({
    x: pa.x * (1 - t) + b[i].x * t,
    y: pa.y * (1 - t) + b[i].y * t,
    cls: pa.cls,
  }));
}

export default function EmbeddingProjectionUmapViz() {
  const [perplexity, setPerplexity] = useState(0.5);

  // Pre-compute 5D pts and the two anchor projections once.
  const { pts5, low2, high2 } = useMemo(() => {
    const rng5 = mulberry32(SEED);
    const rngLo = mulberry32(SEED ^ 0x111);
    const rngHi = mulberry32(SEED ^ 0x222);
    const p5 = build5D(rng5);
    return {
      pts5: p5,
      low2: projectLocal(p5, rngLo),
      high2: projectGlobal(p5, rngHi),
    };
  }, []);

  const pts2 = useMemo(
    () => lerpPoints(low2, high2, perplexity),
    [low2, high2, perplexity],
  );

  const trust = useMemo(() => trustworthiness(pts5, pts2, 5), [pts5, pts2]);

  const reset = () => setPerplexity(0.5);

  // Same-class connectors for visual cohesion.
  const sameClassPairs = useMemo(() => {
    const out = [];
    for (let i = 0; i < pts2.length; i += 1) {
      for (let j = i + 1; j < pts2.length; j += 1) {
        if (pts2[i].cls !== pts2[j].cls) continue;
        if (dist2(pts2[i], pts2[j]) > 0.9) continue;
        out.push([i, j]);
      }
    }
    return out;
  }, [pts2]);

  // 5D sidebar: show the first 3 dims as a tiny coordinate table for 6 sample points.
  const dimDisplay = useMemo(() => {
    const sample = [0, 5, 10, 15, 20, 25];
    return sample.map((i) => ({
      idx: i,
      cls: pts5[i].cls,
      x: pts5[i].x5.slice(0, 3).map((v) => v.toFixed(2)),
    }));
  }, [pts5]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}` }}
        >
          {/* 5D source panel (left edge sliver) */}
          <rect
            x={STAGE_X - 10}
            y={STAGE_Y - 10}
            width={STAGE_W + 20}
            height={STAGE_H + 20}
            rx={12}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />

          <text
            x={STAGE_X + 8}
            y={STAGE_Y + 14}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            UMAP 2D PROJECTION · from 5D
          </text>

          {/* Same-class connectors */}
          {sameClassPairs.map(([i, j]) => {
            const a = toScreen(pts2[i].x, pts2[i].y);
            const b = toScreen(pts2[j].x, pts2[j].y);
            return (
              <line
                key={`sc-${i}-${j}`}
                x1={a.sx}
                y1={a.sy}
                x2={b.sx}
                y2={b.sy}
                stroke={CLASS_COLORS[pts2[i].cls]}
                strokeWidth={0.7}
                opacity={0.32}
              />
            );
          })}

          {/* Points */}
          {pts2.map((p, i) => {
            const { sx, sy } = toScreen(p.x, p.y);
            return (
              <g key={`pt-${i}`}>
                <circle cx={sx} cy={sy} r={8} fill={CLASS_COLORS[p.cls]} opacity={0.22} />
                <circle cx={sx} cy={sy} r={3.6} fill={CLASS_COLORS[p.cls]} />
              </g>
            );
          })}

          {/* Bottom mode label */}
          <g>
            <rect
              x={STAGE_X + 4}
              y={STAGE_Y + STAGE_H - 26}
              width={184}
              height={20}
              rx={6}
              fill="var(--bg)"
              stroke="var(--border)"
              strokeWidth={0.8}
            />
            <text
              x={STAGE_X + 12}
              y={STAGE_Y + STAGE_H - 12}
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
              letterSpacing="0.1em"
              fontWeight={700}
            >
              {perplexity < 0.33
                ? 'LOCAL · neighbors preserved'
                : perplexity > 0.66
                  ? 'GLOBAL · clusters tight'
                  : 'MIXED · interpolating'}
            </text>
          </g>

          {/* Right metrics panel */}
          <g>
            <rect
              x={W - PANEL_W - PAD / 2 + 4}
              y={STAGE_Y - 10}
              width={PANEL_W}
              height={STAGE_H + 20}
              rx={10}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            {(() => {
              const px = W - PANEL_W - PAD / 2 + 16;
              return (
                <g>
                  <text x={px} y={STAGE_Y + 6} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.14em">METRICS</text>

                  <text x={px} y={STAGE_Y + 28} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">perplexity</text>
                  <text x={px} y={STAGE_Y + 44} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--text-main)">{(5 + perplexity * 45).toFixed(0)}</text>

                  <text x={px} y={STAGE_Y + 68} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">trustworthiness</text>
                  <text x={px} y={STAGE_Y + 84} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--accent)">{trust.score.toFixed(3)}</text>

                  <text x={px} y={STAGE_Y + 108} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">5-NN preserved</text>
                  <text x={px} y={STAGE_Y + 124} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--text-main)">{trust.preserved}/{trust.total}</text>

                  <text x={px} y={STAGE_Y + 148} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">N points</text>
                  <text x={px} y={STAGE_Y + 164} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--text-main)">{N}</text>

                  <text x={px} y={STAGE_Y + 188} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">5D SAMPLE</text>

                  {dimDisplay.map((d, k) => (
                    <g key={`d-${k}`}>
                      <circle cx={px + 3} cy={STAGE_Y + 204 + k * 14} r={3} fill={CLASS_COLORS[d.cls]} />
                      <text
                        x={px + 12}
                        y={STAGE_Y + 207 + k * 14}
                        fontSize="9"
                        fontFamily="var(--mono, monospace)"
                        fill="var(--text-main)"
                      >
                        [{d.x.join(', ')}]
                      </text>
                    </g>
                  ))}

                  <text x={px} y={STAGE_Y + STAGE_H - 14} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.14em">CLASSES</text>
                </g>
              );
            })()}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">perplexity</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={perplexity}
              onChange={(e) => setPerplexity(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{(5 + perplexity * 45).toFixed(0)}</span>
          </label>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag">trustworthiness</span>
          <span className="mlviz-val">{trust.score.toFixed(3)}</span>
          <span className="mlviz-sub">fraction of original 5-NN neighbor pairs preserved in 2D</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag">5-NN preserved</span>
          <span className="mlviz-val">{trust.preserved} / {trust.total}</span>
          <span className="mlviz-sub">raw count across all 30 source points</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset perplexity</span>
          </button>
        </div>

        <div className="mlviz-hint">
          low perplexity favors local neighborhoods — tight micro-structure but cluster centers scatter · high perplexity favors global structure — clusters compress into tight blobs
        </div>
      </div>
    </div>
  );
}
