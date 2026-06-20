import React, { useMemo, useState } from 'react';
import {
  TreePine, Boxes, Database, Layers, ToggleLeft, ToggleRight,
} from 'lucide-react';
import './FlyweightPatternViz.css';

const SPECIES = [
  { key: 'oak', label: 'Oak', accent: 'var(--hue-mint)' },
  { key: 'pine', label: 'Pine', accent: 'var(--hue-sky)' },
  { key: 'birch', label: 'Birch', accent: 'var(--hue-violet)' },
  { key: 'maple', label: 'Maple', accent: 'var(--hue-pink)' },
];

// mesh + texture for one species; the whole point of flyweight is that this
// payload is shared, not copied per instance.
const HEAVY_BYTES = 4096;
// per-instance extrinsic state: x, y, scale -> a few small numbers.
const LIGHT_BYTES = 24;
const MAX_GLYPHS = 240;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fmtBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

export default function FlyweightPatternViz() {
  const [count, setCount] = useState(1000);
  const [shared, setShared] = useState(true);
  const speciesCount = SPECIES.length;

  const layout = useMemo(() => {
    const rng = mulberry32(0x5eed ^ count);
    const drawn = Math.min(count, MAX_GLYPHS);
    const cols = 24;
    const rows = Math.ceil(drawn / cols);
    const trees = [];
    const perSpecies = [0, 0, 0, 0];
    for (let i = 0; i < drawn; i += 1) {
      const sp = Math.floor(rng() * speciesCount);
      perSpecies[sp] += 1;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jx = (rng() - 0.5) * 10;
      const jy = (rng() - 0.5) * 8;
      const scale = 0.72 + rng() * 0.5;
      trees.push({ sp, col, row, jx, jy, scale });
    }
    // scale the full-count species split from the sampled ratio.
    const refCounts = perSpecies.map((c) => Math.round((c / Math.max(drawn, 1)) * count));
    const assigned = refCounts.reduce((a, b) => a + b, 0);
    refCounts[0] += count - assigned;
    return { trees, cols, rows, drawn, refCounts };
  }, [count, speciesCount]);

  const memory = useMemo(() => {
    const flyweights = shared ? speciesCount : count;
    const heavy = flyweights * HEAVY_BYTES;
    const light = count * LIGHT_BYTES;
    const total = heavy + light;
    const naive = count * HEAVY_BYTES + count * LIGHT_BYTES;
    const savings = naive > 0 ? Math.round((1 - total / naive) * 100) : 0;
    return { flyweights, heavy, light, total, naive, savings };
  }, [shared, count, speciesCount]);

  const W = 940;
  const H = 430;
  const cardTop = 16;
  const cardH = 84;
  const cardGap = 14;
  const cardW = (W - 40 - cardGap * (speciesCount - 1)) / speciesCount;
  const forestTop = cardTop + cardH + 40;
  const forestH = H - forestTop - 16;
  const cellW = (W - 40) / layout.cols;
  const cellH = forestH / Math.max(layout.rows, 1);

  const narration = shared
    ? `Flyweight ON. Every tree of a species points to ONE shared mesh+texture object — ${speciesCount} flyweights serve all ${count.toLocaleString()} trees. Each instance keeps only its extrinsic state (x, y, scale).`
    : `Flyweight OFF. Every one of the ${count.toLocaleString()} trees carries its own full copy of the heavy mesh+texture. The same pixels are duplicated ${count.toLocaleString()} times — memory scales with instance count.`;

  return (
    <div className="fwv">
      <div className="fwv-head">
        <h3 className="fwv-title">Flyweight — sharing intrinsic state across a thousand objects</h3>
        <p className="fwv-sub">
          A forest of trees. The heavy mesh and texture are intrinsic state shared by every tree of a species;
          position and scale are extrinsic state held per instance. Toggle sharing and watch the footprint move.
        </p>
      </div>

      <div className="fwv-controls">
        <div className="fwv-toggle-group">
          <span className="fwv-input-label">flyweight sharing</span>
          <div className="fwv-seg" role="tablist" aria-label="Flyweight sharing">
            <button
              type="button"
              className={`fwv-seg-btn ${!shared ? 'is-on is-danger' : ''}`}
              onClick={() => setShared(false)}
              aria-pressed={!shared}
            >
              <ToggleLeft size={14} /> OFF
            </button>
            <button
              type="button"
              className={`fwv-seg-btn ${shared ? 'is-on is-safe' : ''}`}
              onClick={() => setShared(true)}
              aria-pressed={shared}
            >
              <ToggleRight size={14} /> ON
            </button>
          </div>
        </div>

        <label className="fwv-slider">
          <span className="fwv-input-label">tree instances</span>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="fwv-range"
            aria-label="Tree instance count"
          />
          <span className="fwv-slider-val">{count.toLocaleString()}</span>
        </label>

        <span className="fwv-spacer" aria-hidden="true" />

        <div className="fwv-savings">
          <Database size={15} color={shared ? 'var(--easy)' : 'var(--warning)'} />
          <span className="fwv-savings-label">memory saved</span>
          <span className={`fwv-savings-val ${shared ? 'is-good' : 'is-bad'}`}>{memory.savings}%</span>
        </div>
      </div>

      <div className="fwv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fwv-svg" preserveAspectRatio="xMidYMid meet">
          {SPECIES.map((sp, i) => {
            const x = 20 + i * (cardW + cardGap);
            const refs = layout.refCounts[i] || 0;
            return (
              <g key={`card-${sp.key}`}>
                <rect
                  className={`fwv-card ${shared ? 'is-shared' : ''}`}
                  x={x}
                  y={cardTop}
                  width={cardW}
                  height={cardH}
                  rx={9}
                  style={{ stroke: sp.accent }}
                />
                <rect x={x} y={cardTop} width={cardW} height={5} rx={2.5} fill={sp.accent} opacity={0.8} />
                <g transform={`translate(${x + 14}, ${cardTop + 16})`}>
                  <Layers size={15} color={sp.accent} />
                </g>
                <text className="fwv-card-title" x={x + 36} y={cardTop + 28}>{sp.label}</text>
                <text className="fwv-card-sub" x={x + 14} y={cardTop + 48}>mesh + texture · {fmtBytes(HEAVY_BYTES)}</text>
                <text className="fwv-card-sub fwv-card-intrinsic" x={x + 14} y={cardTop + 64}>intrinsic · shared</text>
                <g transform={`translate(${x + cardW - 30}, ${cardTop + cardH - 22})`}>
                  <rect className="fwv-badge" x={-26} y={-13} width={52} height={20} rx={10} style={{ stroke: sp.accent }} />
                  <text className="fwv-badge-text" x={0} y={2} style={{ fill: sp.accent }}>×{refs.toLocaleString()}</text>
                </g>
              </g>
            );
          })}

          {shared && layout.trees.slice(0, layout.cols * 2).map((t, i) => {
            const sp = SPECIES[t.sp];
            const cx = 20 + (i % layout.cols) * cellW + cellW / 2;
            const cardCx = 20 + t.sp * (cardW + cardGap) + cardW / 2;
            return (
              <line
                key={`link-${i}`}
                className="fwv-link"
                x1={cx}
                y1={forestTop - 6}
                x2={cardCx}
                y2={cardTop + cardH}
                style={{ stroke: sp.accent }}
              />
            );
          })}

          <text className="fwv-forest-label" x={20} y={forestTop - 14}>
            forest — {layout.drawn < count ? `sample of ${layout.drawn} glyphs (math uses all ${count.toLocaleString()})` : `${count.toLocaleString()} trees`}
          </text>

          {layout.trees.map((t, i) => {
            const sp = SPECIES[t.sp];
            const cx = 20 + t.col * cellW + cellW / 2 + t.jx;
            const cy = forestTop + t.row * cellH + cellH / 2 + t.jy;
            const s = Math.min(cellW, cellH) * 0.42 * t.scale;
            return (
              <g key={`tree-${i}`} transform={`translate(${cx}, ${cy})`}>
                <path
                  className="fwv-tree-crown"
                  d={`M0 ${-s} L ${s * 0.62} ${s * 0.45} L ${-s * 0.62} ${s * 0.45} Z`}
                  style={{ fill: sp.accent }}
                />
                <rect
                  className="fwv-tree-trunk"
                  x={-s * 0.1}
                  y={s * 0.45}
                  width={s * 0.2}
                  height={s * 0.35}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fwv-metrics">
        <div className="fwv-metric">
          <span className="fwv-metric-label">tree instances</span>
          <span className="fwv-metric-value">{count.toLocaleString()}</span>
        </div>
        <div className="fwv-metric">
          <span className="fwv-metric-label">heavy copies</span>
          <span className={`fwv-metric-value ${shared ? 'is-good' : 'is-bad'}`}>
            {memory.flyweights.toLocaleString()}
          </span>
        </div>
        <div className="fwv-metric">
          <span className="fwv-metric-label">intrinsic memory</span>
          <span className={`fwv-metric-value ${shared ? 'is-good' : 'is-bad'}`}>{fmtBytes(memory.heavy)}</span>
        </div>
        <div className="fwv-metric">
          <span className="fwv-metric-label">extrinsic memory</span>
          <span className="fwv-metric-value">{fmtBytes(memory.light)}</span>
        </div>
        <div className="fwv-metric">
          <span className="fwv-metric-label">total footprint</span>
          <span className={`fwv-metric-value ${shared ? 'is-good' : 'is-bad'}`}>{fmtBytes(memory.total)}</span>
        </div>
      </div>

      <div className={`fwv-why ${shared ? 'is-good' : 'is-bad'}`}>
        <span className="fwv-why-label">{shared ? 'shared' : 'naive'}</span>
        <span className="fwv-why-body">
          {shared
            ? `${fmtBytes(memory.total)} vs ${fmtBytes(memory.naive)} if every tree copied its own mesh — a ${memory.savings}% cut.`
            : `${fmtBytes(memory.total)} — the same ${fmtBytes(HEAVY_BYTES)} mesh duplicated ${count.toLocaleString()} times. Flip sharing ON to collapse it.`}
        </span>
      </div>

      <div className="fwv-narration">
        <span className="fwv-narration-label">
          {shared ? <Boxes size={13} /> : <TreePine size={13} />} how
        </span>
        <span className="fwv-narration-body">{narration}</span>
      </div>
    </div>
  );
}
