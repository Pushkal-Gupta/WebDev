import React, { useCallback, useMemo, useState } from 'react';
import { Play, RotateCcw, RefreshCw } from 'lucide-react';
import './MLViz.css';

/* MANIM-style side-by-side compare of BatchNorm / LayerNorm / GroupNorm / RMSNorm
   on the same 4x8 mini-batch.
   - colored grid shows pre-norm activations
   - overlay rectangle shows which axis the mode aggregates over
   - "Apply" shows the post-norm grid alongside
   - readout reports mean / std of each aggregation group */

const ROWS = 4;
const COLS = 8;
const GROUPS = 2;       // GroupNorm groups
const GROUP_W = COLS / GROUPS;
const EPS = 1e-5;

const MODES = [
  { id: 'batch',  label: 'BatchNorm',  blurb: 'normalize per-feature across batch' },
  { id: 'layer',  label: 'LayerNorm',  blurb: 'normalize per-sample across features' },
  { id: 'group',  label: 'GroupNorm',  blurb: 'split features into g=2 groups, normalize per (sample, group)' },
  { id: 'rms',    label: 'RMSNorm',    blurb: 'divide by RMS of features per sample (no mean subtraction)' },
];

const CELL = 38;
const GAP = 4;
const PAD_L = 60;     // left for sample labels
const PAD_T = 32;     // top for feature labels
const PAD_R = 14;
const PAD_B = 18;

const GRID_W = COLS * CELL + (COLS - 1) * GAP;
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP;

const SVG_W = PAD_L + GRID_W + PAD_R;
const SVG_H = PAD_T + GRID_H + PAD_B;

// LCG so the batch is deterministic per regenerate-press
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function gaussian(rng, mean, std) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + std * z;
}

function generateMatrix(seed) {
  const rng = makeRng(seed);
  const m = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    // give each row its own mean / std so the differences across norms are visible
    const rowMean = -1 + 2 * (r / Math.max(1, ROWS - 1));
    const rowStd = 0.8 + 0.5 * rng();
    for (let c = 0; c < COLS; c++) {
      // and each column its own bias too, so BatchNorm vs LayerNorm look different
      const colBias = -0.5 + 1.2 * (c / Math.max(1, COLS - 1));
      row.push(gaussian(rng, rowMean + colBias, rowStd));
    }
    m.push(row);
  }
  return m;
}

function snap(v, p = 2) {
  if (!Number.isFinite(v)) return '–';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toFixed(p);
}

function meanStd(vals) {
  const n = vals.length;
  if (!n) return { mean: 0, std: 0 };
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const variance = vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
  return { mean, std: Math.sqrt(variance) };
}

function rmsOf(vals) {
  const n = vals.length;
  if (!n) return 0;
  return Math.sqrt(vals.reduce((a, b) => a + b * b, 0) / n);
}

/* Build per-mode aggregation groups + normalized matrix + per-group stats.
   "groups" is a list of { rows: number[], cols: number[], mean, std } used both to
   compute the normalized cells and to draw highlight overlays. */
function computeMode(mode, M) {
  const groups = [];
  if (mode === 'batch') {
    for (let c = 0; c < COLS; c++) {
      const vals = [];
      for (let r = 0; r < ROWS; r++) vals.push(M[r][c]);
      const { mean, std } = meanStd(vals);
      groups.push({ rows: Array.from({ length: ROWS }, (_, i) => i), cols: [c], mean, std, rms: 0, label: `f${c}` });
    }
  } else if (mode === 'layer') {
    for (let r = 0; r < ROWS; r++) {
      const vals = M[r].slice();
      const { mean, std } = meanStd(vals);
      groups.push({ rows: [r], cols: Array.from({ length: COLS }, (_, i) => i), mean, std, rms: 0, label: `s${r}` });
    }
  } else if (mode === 'group') {
    for (let r = 0; r < ROWS; r++) {
      for (let g = 0; g < GROUPS; g++) {
        const cols = [];
        const vals = [];
        for (let k = 0; k < GROUP_W; k++) {
          const c = g * GROUP_W + k;
          cols.push(c);
          vals.push(M[r][c]);
        }
        const { mean, std } = meanStd(vals);
        groups.push({ rows: [r], cols, mean, std, rms: 0, label: `s${r}·g${g}` });
      }
    }
  } else if (mode === 'rms') {
    for (let r = 0; r < ROWS; r++) {
      const vals = M[r].slice();
      const rms = rmsOf(vals);
      groups.push({ rows: [r], cols: Array.from({ length: COLS }, (_, i) => i), mean: 0, std: 0, rms, label: `s${r}` });
    }
  }

  const Y = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  groups.forEach((g) => {
    const denom = mode === 'rms'
      ? Math.sqrt(g.rms * g.rms + EPS)
      : Math.sqrt(g.std * g.std + EPS);
    g.rows.forEach((r) => {
      g.cols.forEach((c) => {
        const v = M[r][c];
        Y[r][c] = mode === 'rms'
          ? v / denom
          : (v - g.mean) / denom;
      });
    });
  });
  return { Y, groups };
}

// global min/max for color mapping (so the original and normalized show with the same colormap on left)
function matExtent(...mats) {
  let lo = Infinity, hi = -Infinity;
  mats.forEach((M) => {
    M.forEach((row) => row.forEach((v) => {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }));
  });
  if (lo === Infinity) { lo = -1; hi = 1; }
  const mag = Math.max(Math.abs(lo), Math.abs(hi), 1e-6);
  return { lo: -mag, hi: mag };
}

function cellFill(v, mag) {
  // diverging: negative -> hue-pink-ish, zero -> surface, positive -> hue-mint-ish
  const t = Math.max(-1, Math.min(1, v / Math.max(mag, 1e-6)));
  if (t >= 0) {
    return `color-mix(in srgb, var(--hue-mint, #7dd3a4) ${Math.round(t * 78 + 6)}%, var(--surface) ${Math.round((1 - t) * 94 + 22)}%)`;
  }
  return `color-mix(in srgb, var(--hue-pink, #ff7aa8) ${Math.round(-t * 78 + 6)}%, var(--surface) ${Math.round((1 + t) * 94 + 22)}%)`;
}

function GridSvg({ title, M, groups, mag, applied, modeId, highlightIndex }) {
  const cellX = (c) => PAD_L + c * (CELL + GAP);
  const cellY = (r) => PAD_T + r * (CELL + GAP);

  // group bounding rects (for overlay)
  const overlays = groups.map((g, i) => {
    const xs = g.cols.map(cellX);
    const ys = g.rows.map(cellY);
    const x = Math.min(...xs) - 3;
    const y = Math.min(...ys) - 3;
    const w = (Math.max(...xs) + CELL + 3) - x;
    const h = (Math.max(...ys) + CELL + 3) - y;
    return { i, x, y, w, h, label: g.label };
  });

  return (
    <div className="ncv-grid-block">
      <div className="ncv-grid-title">{title}</div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mlviz-svg ncv-svg" role="img" aria-label={title}>
        {/* feature header */}
        {Array.from({ length: COLS }).map((_, c) => (
          <text
            key={`fh${c}`}
            x={cellX(c) + CELL / 2}
            y={PAD_T - 12}
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            textAnchor="middle"
            letterSpacing="0.08em"
          >
            f{c}
          </text>
        ))}
        <text
          x={PAD_L + GRID_W / 2}
          y={PAD_T - 24}
          fontSize="9"
          fontFamily="var(--mono, monospace)"
          fill="var(--text-dim)"
          textAnchor="middle"
          letterSpacing="0.14em"
        >
          features →
        </text>

        {/* sample header */}
        {Array.from({ length: ROWS }).map((_, r) => (
          <text
            key={`sh${r}`}
            x={PAD_L - 10}
            y={cellY(r) + CELL / 2 + 4}
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            textAnchor="end"
            letterSpacing="0.08em"
          >
            s{r}
          </text>
        ))}
        <text
          x={PAD_L - 44}
          y={PAD_T + GRID_H / 2}
          fontSize="9"
          fontFamily="var(--mono, monospace)"
          fill="var(--text-dim)"
          textAnchor="middle"
          letterSpacing="0.14em"
          transform={`rotate(-90 ${PAD_L - 44} ${PAD_T + GRID_H / 2})`}
        >
          batch ↓
        </text>

        {/* cells */}
        {M.map((row, r) =>
          row.map((v, c) => (
            <g key={`${r}-${c}`}>
              <rect
                x={cellX(c)}
                y={cellY(r)}
                width={CELL}
                height={CELL}
                rx={5}
                ry={5}
                fill={cellFill(v, mag)}
                stroke="var(--border)"
                strokeWidth="0.6"
                style={{ transition: 'fill 0.5s ease' }}
              />
              <text
                x={cellX(c) + CELL / 2}
                y={cellY(r) + CELL / 2 + 3}
                fontSize="9.5"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-main)"
                textAnchor="middle"
                style={{ transition: 'all 0.5s ease' }}
              >
                {snap(v, 1)}
              </text>
            </g>
          ))
        )}

        {/* aggregation overlays — different color per mode, only on the PRE grid */}
        {!applied && overlays.map(({ i, x, y, w, h }) => (
          <rect
            key={`ov${i}`}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={6}
            ry={6}
            fill={modeId === 'batch'
              ? 'var(--hue-sky, #5ecbff)'
              : modeId === 'layer'
              ? 'var(--hue-violet, #b58cff)'
              : modeId === 'group'
              ? 'var(--hue-mint, #7dd3a4)'
              : 'var(--warning, #ffb86b)'}
            opacity={highlightIndex === i ? 0.28 : 0.12}
            stroke={modeId === 'batch'
              ? 'var(--hue-sky, #5ecbff)'
              : modeId === 'layer'
              ? 'var(--hue-violet, #b58cff)'
              : modeId === 'group'
              ? 'var(--hue-mint, #7dd3a4)'
              : 'var(--warning, #ffb86b)'}
            strokeWidth={highlightIndex === i ? 2 : 1.1}
            strokeDasharray="4 3"
            style={{ transition: 'opacity 0.25s ease' }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function NormalizationCompareViz() {
  const [seed, setSeed] = useState(42);
  const [mode, setMode] = useState('batch');
  const [applied, setApplied] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const M = useMemo(() => generateMatrix(seed), [seed]);
  const { Y, groups } = useMemo(() => computeMode(mode, M), [mode, M]);

  const { lo, hi } = useMemo(() => matExtent(M, Y), [M, Y]);
  const mag = Math.max(Math.abs(lo), Math.abs(hi));

  const handleMode = useCallback((id) => {
    setMode(id);
    setHighlight(-1);
  }, []);

  const handleApply = useCallback(() => setApplied(true), []);
  const handleReset = useCallback(() => { setApplied(false); setHighlight(-1); }, []);
  const handleRegen = useCallback(() => {
    setSeed((s) => (s * 1103515245 + 12345) >>> 0);
    setApplied(false);
    setHighlight(-1);
  }, []);

  const modeMeta = MODES.find((m) => m.id === mode);

  // global post-norm sanity check (mean / std across whole Y)
  const allY = useMemo(() => Y.flat(), [Y]);
  const globalY = useMemo(() => meanStd(allY), [allY]);

  const accentForMode = mode === 'batch'
    ? 'var(--hue-sky, #5ecbff)'
    : mode === 'layer'
    ? 'var(--hue-violet, #b58cff)'
    : mode === 'group'
    ? 'var(--hue-mint, #7dd3a4)'
    : 'var(--warning, #ffb86b)';

  return (
    <div className="mlviz-wrap ncv-wrap">
      <div className="mlviz-toggles" role="tablist" aria-label="Normalization mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={`mlviz-toggle${mode === m.id ? ' is-on' : ''}`}
            style={{ '--toggle-color': m.id === 'batch'
              ? 'var(--hue-sky, #5ecbff)'
              : m.id === 'layer'
              ? 'var(--hue-violet, #b58cff)'
              : m.id === 'group'
              ? 'var(--hue-mint, #7dd3a4)'
              : 'var(--warning, #ffb86b)' }}
            onClick={() => handleMode(m.id)}
          >
            <span className="mlviz-toggle-dot" />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <div className="ncv-stage">
        <GridSvg
          title="x (pre-norm)"
          M={M}
          groups={groups}
          mag={mag}
          applied={false}
          modeId={mode}
          highlightIndex={highlight}
        />
        <div className="ncv-arrow" aria-hidden>
          <div className="ncv-arrow-cap" style={{ background: accentForMode }} />
          <div className="ncv-arrow-line" style={{ background: accentForMode }} />
          <div className="ncv-arrow-head" style={{ borderLeftColor: accentForMode }} />
          <div className="ncv-arrow-label" style={{ color: accentForMode }}>{modeMeta.label}</div>
        </div>
        <GridSvg
          title={applied ? 'y (normalized)' : 'y (apply to see)'}
          M={applied ? Y : M.map((row) => row.map(() => 0))}
          groups={groups}
          mag={mag}
          applied={true}
          modeId={mode}
          highlightIndex={-1}
        />
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: accentForMode }}>{modeMeta.label}</span>
          <span className="mlviz-sub">{modeMeta.blurb}</span>
        </div>

        <div className="ncv-groups">
          <div className="ncv-groups-head">
            <span>group</span>
            <span>{mode === 'rms' ? 'rms' : 'μ'}</span>
            <span>{mode === 'rms' ? '—' : 'σ'}</span>
            <span>cells</span>
          </div>
          <div className="ncv-groups-body">
            {groups.map((g, i) => (
              <button
                key={`g${i}`}
                type="button"
                className={`ncv-group-row${highlight === i ? ' is-on' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseLeave={() => setHighlight(-1)}
                onFocus={() => setHighlight(i)}
                onBlur={() => setHighlight(-1)}
                style={{ '--toggle-color': accentForMode }}
              >
                <span className="ncv-group-label">{g.label}</span>
                <span className="ncv-group-val">{mode === 'rms' ? snap(g.rms) : snap(g.mean)}</span>
                <span className="ncv-group-val">{mode === 'rms' ? '—' : snap(g.std)}</span>
                <span className="ncv-group-sub">
                  {g.rows.length}×{g.cols.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {applied && (
          <div className="mlviz-row">
            <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>y all</span>
            <span className="mlviz-val">μ = {snap(globalY.mean)}</span>
            <span className="mlviz-sub">σ = {snap(globalY.std)}</span>
            <span className="mlviz-sub">
              {mode === 'rms' ? '(RMS = 1 per row; global μ free)' : '(group μ ≈ 0, σ ≈ 1)'}
            </span>
          </div>
        )}

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleApply}
            disabled={applied}
          >
            <Play size={13} />
            <span>Apply</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={!applied}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleRegen}
          >
            <RefreshCw size={13} />
            <span>Regenerate batch</span>
          </button>
        </div>

        <div className="mlviz-hint">
          The dashed overlay shows the slice each statistic is aggregated over.
          Hover a group to spotlight it on the pre-norm grid.
        </div>
      </div>

      <style>{`
        .ncv-wrap { gap: 0.75rem; }
        .ncv-stage {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
        }
        .ncv-grid-block {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          min-width: 0;
        }
        .ncv-grid-title {
          font-family: var(--mono, monospace);
          font-size: 11px;
          letter-spacing: 0.14em;
          color: var(--text-dim);
          text-transform: uppercase;
          padding-left: 0.25rem;
        }
        .ncv-svg {
          width: 100%;
          height: auto;
          background: color-mix(in srgb, var(--surface) 86%, transparent);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 6px 4px;
        }
        .ncv-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 0 4px;
          min-width: 78px;
        }
        .ncv-arrow-cap {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          opacity: 0.85;
        }
        .ncv-arrow-line {
          width: 2px;
          height: 56px;
          opacity: 0.6;
        }
        .ncv-arrow-head {
          width: 0; height: 0;
          border-top: 7px solid transparent;
          border-bottom: 7px solid transparent;
          border-left: 10px solid var(--accent);
          transform: rotate(90deg);
          margin-top: -4px;
        }
        .ncv-arrow-label {
          font-family: var(--mono, monospace);
          font-size: 10px;
          letter-spacing: 0.12em;
          margin-top: 4px;
          font-weight: 700;
          text-align: center;
          white-space: nowrap;
        }
        .ncv-groups {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 0.25rem 0 0.4rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px 8px;
          background: color-mix(in srgb, var(--surface) 92%, transparent);
        }
        .ncv-groups-head {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 0.7fr;
          gap: 8px;
          font-family: var(--mono, monospace);
          font-size: 9.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          padding: 0 6px 4px;
          border-bottom: 1px dashed var(--border);
        }
        .ncv-groups-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-height: 168px;
          overflow-y: auto;
        }
        .ncv-group-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 0.7fr;
          gap: 8px;
          padding: 4px 6px;
          font-family: var(--mono, monospace);
          font-size: 11px;
          background: transparent;
          color: var(--text-main);
          border: 1px solid transparent;
          border-radius: 5px;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .ncv-group-row:hover,
        .ncv-group-row.is-on {
          background: color-mix(in srgb, var(--toggle-color, var(--accent)) 12%, transparent);
          border-color: color-mix(in srgb, var(--toggle-color, var(--accent)) 38%, var(--border));
        }
        .ncv-group-label {
          color: var(--toggle-color, var(--accent));
          font-weight: 700;
          letter-spacing: 0.08em;
        }
        .ncv-group-val { color: var(--text-main); }
        .ncv-group-sub { color: var(--text-dim); }
        @media (max-width: 720px) {
          .ncv-stage { grid-template-columns: 1fr; }
          .ncv-arrow { flex-direction: row; min-width: 0; height: 28px; }
          .ncv-arrow-line { height: 2px; width: 56px; }
          .ncv-arrow-head { transform: none; margin: 0; }
        }
      `}</style>
    </div>
  );
}
