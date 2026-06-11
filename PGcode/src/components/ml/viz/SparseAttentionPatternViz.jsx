import React, { useMemo, useState } from 'react';
import { Grid3x3, Zap } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * SparseAttentionPatternViz
 *
 * N=16 query-by-key attention mask, with four togglable patterns:
 *   - full           : dense N×N (vanilla attention)
 *   - local window   : banded |i-j| <= w  (Sliding-Window / Longformer local)
 *   - strided        : global tokens + local block (BigBird-style)
 *   - random         : Longformer-style random scatter
 *
 * For each pattern, count attended positions, compute density, FLOPs ratio
 * against the full N² baseline. Hovering a row would be nice but the user
 * spec just asks for a live readout; we show per-pattern density + total.
 */

const W = 720;
const H = 360;
const N = 16;
const PAD_X = 18;
const PAD_TOP = 36;
const PANEL_GAP_X = 18;
const PANEL_GAP_Y = 22;
const COLS = 2;
const ROWS = 2;
const PANEL_W = (W - PAD_X * 2 - PANEL_GAP_X * (COLS - 1)) / COLS;
const PANEL_H = (H - PAD_TOP - 28 - PANEL_GAP_Y * (ROWS - 1)) / ROWS;
const CELL_PAD = 10;
const GRID_W = PANEL_W - CELL_PAD * 2;
const GRID_H = PANEL_H - CELL_PAD * 2 - 14;
const CELL = Math.min(GRID_W, GRID_H) / N;
const LOCAL_WINDOW = 2;
const STRIDE = 4;
const N_RANDOM = 2; // random keys per query (in addition to local + diag)
const SEED = 23;

const PATTERNS = [
  {
    id: 'full',
    label: 'full',
    sub: 'dense N²',
    color: 'var(--hue-sky)',
    desc: 'every query attends every key',
  },
  {
    id: 'local',
    label: 'local',
    sub: 'window w=2',
    color: 'var(--hue-mint)',
    desc: '|i − j| ≤ w  (sliding window)',
  },
  {
    id: 'strided',
    label: 'strided',
    sub: 'global + local',
    color: 'var(--hue-pink)',
    desc: 'BigBird: global + local + diag',
  },
  {
    id: 'random',
    label: 'random',
    sub: 'local + r=2 rand',
    color: 'var(--hue-violet)',
    desc: 'Longformer: local + r random keys',
  },
];

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

function buildMask(pattern, rng) {
  const mask = Array.from({ length: N }, () => new Array(N).fill(0));
  if (pattern === 'full') {
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) mask[i][j] = 1;
    return mask;
  }
  if (pattern === 'local') {
    for (let i = 0; i < N; i++) {
      for (let j = Math.max(0, i - LOCAL_WINDOW); j <= Math.min(N - 1, i + LOCAL_WINDOW); j++) {
        mask[i][j] = 1;
      }
    }
    return mask;
  }
  if (pattern === 'strided') {
    // BigBird-style: global tokens (first & last 2), local window, strided
    const globals = new Set([0, 1, N - 2, N - 1]);
    for (let i = 0; i < N; i++) {
      // global query rows attend everywhere
      if (globals.has(i)) {
        for (let j = 0; j < N; j++) mask[i][j] = 1;
        continue;
      }
      // global key columns visible to all queries
      globals.forEach((g) => {
        mask[i][g] = 1;
      });
      // diagonal
      mask[i][i] = 1;
      // strided
      for (let j = (i % STRIDE); j < N; j += STRIDE) mask[i][j] = 1;
      // small local window for cohesion
      mask[i][Math.max(0, i - 1)] = 1;
      mask[i][Math.min(N - 1, i + 1)] = 1;
    }
    return mask;
  }
  // random: local window + N_RANDOM random keys per query + diagonal
  for (let i = 0; i < N; i++) {
    mask[i][i] = 1;
    for (let j = Math.max(0, i - 1); j <= Math.min(N - 1, i + 1); j++) mask[i][j] = 1;
    let added = 0;
    let attempts = 0;
    while (added < N_RANDOM && attempts < 20) {
      const j = Math.floor(rng() * N);
      if (!mask[i][j]) {
        mask[i][j] = 1;
        added += 1;
      }
      attempts += 1;
    }
  }
  return mask;
}

function countPerRow(mask) {
  return mask.map((row) => row.reduce((a, b) => a + b, 0));
}

function densityOf(mask) {
  let s = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) s += mask[i][j];
  return s / (N * N);
}

export default function SparseAttentionPatternViz() {
  const [active, setActive] = useState('local');

  const rng = useMemo(() => mulberry32(SEED), []);

  const masks = useMemo(() => {
    const r = mulberry32(SEED);
    return {
      full: buildMask('full', r),
      local: buildMask('local', r),
      strided: buildMask('strided', r),
      random: buildMask('random', r),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rng]);

  const activeMask = masks[active];
  const activePerRow = useMemo(() => countPerRow(activeMask), [activeMask]);
  const minRow = Math.min(...activePerRow);
  const maxRow = Math.max(...activePerRow);
  const avgRow = activePerRow.reduce((a, b) => a + b, 0) / N;
  const density = densityOf(activeMask);
  const flopsRatio = density; // FLOPs scale linearly with non-zero attention cells (illustrative)

  const activeMeta = PATTERNS.find((p) => p.id === active);

  const sparsityHtml = useMemo(
    () => katexHtml('\\text{FLOPs}/\\text{FLOPs}_{\\text{full}} = \\rho', false),
    []
  );

  function panelOrigin(idx) {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = PAD_X + col * (PANEL_W + PANEL_GAP_X);
    const y = PAD_TOP + row * (PANEL_H + PANEL_GAP_Y);
    return { x, y };
  }

  function renderPanel(pat, idx) {
    const { x, y } = panelOrigin(idx);
    const mask = masks[pat.id];
    const d = densityOf(mask);
    const isActive = pat.id === active;
    const gridX = x + CELL_PAD;
    const gridY = y + CELL_PAD + 14;
    return (
      <g
        key={pat.id}
        style={{ cursor: 'pointer' }}
        onClick={() => setActive(pat.id)}
      >
        <rect
          x={x}
          y={y}
          width={PANEL_W}
          height={PANEL_H}
          rx="8"
          fill="var(--bg)"
          stroke={isActive ? pat.color : 'var(--border)'}
          strokeWidth={isActive ? 1.6 : 1}
          opacity={isActive ? 0.95 : 0.7}
        />
        <text
          x={x + 10}
          y={y + 14}
          fontSize="10"
          fill={isActive ? pat.color : 'var(--text-dim)'}
          fontFamily="var(--mono)"
          letterSpacing="0.14em"
          fontWeight={isActive ? 700 : 500}
        >
          {pat.label.toUpperCase()}  ·  {pat.sub}
        </text>
        <text
          x={x + PANEL_W - 10}
          y={y + 14}
          fontSize="9"
          fill={pat.color}
          fontFamily="var(--mono)"
          textAnchor="end"
          fontWeight="700"
        >
          ρ = {(d * 100).toFixed(1)}%
        </text>

        {mask.map((row, i) =>
          row.map((v, j) => {
            if (!v) return null;
            return (
              <rect
                key={`${i}-${j}`}
                x={gridX + j * CELL}
                y={gridY + i * CELL}
                width={CELL - 0.5}
                height={CELL - 0.5}
                fill={pat.color}
                opacity={isActive ? 0.78 : 0.42}
              />
            );
          })
        )}
        {/* grid outline */}
        <rect
          x={gridX}
          y={gridY}
          width={CELL * N}
          height={CELL * N}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.8"
          opacity="0.6"
        />
      </g>
    );
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x={PAD_X}
            y={20}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            ATTENTION MASK  N×N  (N={N})
          </text>
          <text
            x={W - PAD_X}
            y={20}
            fontSize="10"
            fill={activeMeta.color}
            fontFamily="var(--mono)"
            textAnchor="end"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            ACTIVE · {activeMeta.label.toUpperCase()}
          </text>

          {PATTERNS.map((p, idx) => renderPanel(p, idx))}

          <text
            x={W / 2}
            y={H - 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            click a pattern · rows = queries · cols = keys · highlighted cells = attended
          </text>
        </svg>
      </div>

      <div className="mlviz-toggles" style={{ borderBottom: 'none' }}>
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`mlviz-toggle ${active === p.id ? 'is-on' : ''}`}
            onClick={() => setActive(p.id)}
            style={{ '--toggle-color': p.color }}
          >
            <span className="mlviz-toggle-dot" />
            {p.label}
          </button>
        ))}
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <Grid3x3 size={11} style={{ color: 'var(--text-dim)' }} />
            <span className="mlviz-sub">density ρ</span>
            <span className="mlviz-val" style={{ color: activeMeta.color }}>
              {(density * 100).toFixed(1)}%
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <Zap size={11} style={{ color: 'var(--text-dim)' }} />
            <span className="mlviz-sub">FLOPs vs full</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {(flopsRatio * 100).toFixed(1)}%
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">per-query attended</span>
            <span className="mlviz-val">{minRow}</span>
            <span className="mlviz-sub">min ·</span>
            <span className="mlviz-val">{avgRow.toFixed(1)}</span>
            <span className="mlviz-sub">avg ·</span>
            <span className="mlviz-val">{maxRow}</span>
            <span className="mlviz-sub">max</span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.2rem' }}>
          <span
            className="ml-imath"
            style={{ fontSize: '0.82rem' }}
            dangerouslySetInnerHTML={{ __html: sparsityHtml }}
          />
          <span className="mlviz-sub" style={{ marginLeft: '0.6rem' }}>
            {activeMeta.desc}
          </span>
        </div>

        <div className="mlviz-hint">
          full N² is the wall · structured sparsity keeps long-range info while cutting FLOPs
        </div>
      </div>
    </div>
  );
}
