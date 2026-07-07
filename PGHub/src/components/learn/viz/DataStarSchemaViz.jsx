import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Star, Play, Pause, SkipForward, RotateCcw, Gauge, GitBranch } from 'lucide-react';
import './DataStarSchemaViz.css';

// A star schema: a central fact table surrounded by dimensions. A query
// "revenue by category and region" animates its joins. In STAR mode category
// and region are denormalized into the product/customer dimensions -> 2 joins.
// In SNOWFLAKE mode they live in outrigger tables -> 4 joins for the same
// answer. Columnar scan highlights only the fact columns the query touches.
// Deterministic: no randomness anywhere.

const FACT_COLS = [
  { key: 'date_key', read: false },
  { key: 'product_key', read: true },
  { key: 'customer_key', read: true },
  { key: 'store_key', read: false },
  { key: 'amount', read: true },
  { key: 'quantity', read: false },
];
const READ_COLS = FACT_COLS.filter((c) => c.read).length;

// Node geometry (data-model diagram, radial is correct here -- not a pipeline).
const NODES = {
  fact: { x: 178, y: 122, w: 104, h: 118, cx: 230, cy: 181, label: 'fact_sales' },
  product: { x: 20, y: 60, w: 96, h: 44, cx: 68, cy: 82, label: 'dim_product', attr: 'name · category' },
  customer: { x: 344, y: 60, w: 96, h: 44, cx: 392, cy: 82, label: 'dim_customer', attr: 'name · region' },
  category: { x: 20, y: 214, w: 96, h: 40, cx: 68, cy: 234, label: 'dim_category', attr: 'category name' },
  region: { x: 344, y: 214, w: 96, h: 40, cx: 392, cy: 234, label: 'dim_region', attr: 'region name' },
};

const EDGES = {
  product: ['fact', 'product'],
  customer: ['fact', 'customer'],
  category: ['product', 'category'],
  region: ['customer', 'region'],
};

const PLANS = {
  star: ['product', 'customer'],
  snowflake: ['product', 'category', 'customer', 'region'],
};

function buildSteps(mode) {
  const plan = PLANS[mode];
  const steps = [{ joined: [], edge: null, scan: true, joins: 0,
    action: `Columnar scan: read only the ${READ_COLS} fact columns the query needs (product_key, customer_key, amount) — the rest stay on disk.` }];
  const joined = [];
  plan.forEach((target) => {
    joined.push(target);
    const via = EDGES[target][0];
    const label = NODES[target].label;
    steps.push({
      joined: [...joined],
      edge: target,
      scan: false,
      joins: joined.length,
      action: mode === 'snowflake' && (target === 'category' || target === 'region')
        ? `Extra hop: join ${NODES[via].label} → ${label} to reach the attribute a star would have kept inline.`
        : `Join fact_sales → ${label} on its foreign key.`,
    });
  });
  steps.push({
    joined: [...joined], edge: null, scan: false, joins: joined.length,
    action: mode === 'star'
      ? 'Result: revenue grouped by category and region in just 2 joins — the star kept those attributes inside the dimensions.'
      : 'Result: the same answer, but 4 joins — normalizing into outrigger tables added a hop per attribute.',
  });
  return steps;
}

const W = 460;
const H = 288;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DataStarSchemaViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState('star');
  const timer = useRef(null);

  const steps = useMemo(() => buildSteps(mode), [mode]);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];
  const visibleNodes = mode === 'star'
    ? ['fact', 'product', 'customer']
    : ['fact', 'product', 'customer', 'category', 'region'];

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function toggleMode() {
    setMode((m) => (m === 'star' ? 'snowflake' : 'star'));
    setStep(0); setPlaying(false);
  }
  function reset() { setStep(0); setPlaying(false); }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const colH = 15;
  const colTop = NODES.fact.y + 30;

  return (
    <div className="dss">
      <div className="dss-head">
        <div className="dss-head-icon"><Star size={18} /></div>
        <div className="dss-head-text">
          <h3 className="dss-title">Joining a star, one dimension at a time</h3>
          <p className="dss-sub">
            The central fact table holds measures and foreign keys; dimensions radiate around it.
            Watch the query join outward, and toggle snowflake to see normalizing an attribute into
            an outrigger table cost an extra hop.
          </p>
        </div>
        <button type="button" className="dss-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dss-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dss-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="dss-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.8" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* edges */}
          {Object.entries(EDGES).map(([key, [a, b]]) => {
            if (!visibleNodes.includes(b)) return null;
            const active = cur.joined.includes(key);
            const na = NODES[a]; const nb = NODES[b];
            return (
              <line
                key={`e-${key}`}
                x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
                className={`dss-edge${active ? ' is-active' : ''}`}
              />
            );
          })}

          {/* dimension nodes */}
          {visibleNodes.filter((k) => k !== 'fact').map((k) => {
            const n = NODES[k];
            const joinKey = k;
            const active = cur.joined.includes(joinKey);
            return (
              <g key={k} className={`dss-dim${active ? ' is-joined' : ''}`} filter={active ? 'url(#dss-glow)' : undefined}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={8} className="dss-dim-box" />
                <text x={n.x + n.w / 2} y={n.y + 18} className="dss-dim-name" textAnchor="middle">{n.label}</text>
                <text x={n.x + n.w / 2} y={n.y + 33} className="dss-dim-attr" textAnchor="middle">{n.attr}</text>
              </g>
            );
          })}

          {/* fact table with columnar highlight */}
          <g className={`dss-fact${cur.scan ? ' is-scan' : ''}`}>
            <rect x={NODES.fact.x} y={NODES.fact.y} width={NODES.fact.w} height={NODES.fact.h} rx={9} className="dss-fact-box" />
            <text x={NODES.fact.cx} y={NODES.fact.y + 18} className="dss-fact-name" textAnchor="middle">{NODES.fact.label}</text>
            {FACT_COLS.map((c, i) => (
              <g key={c.key} className={`dss-col${c.read ? ' is-read' : ''}${cur.scan && c.read ? ' is-scanning' : ''}`}>
                <rect x={NODES.fact.x + 8} y={colTop + i * colH} width={NODES.fact.w - 16} height={colH - 2} rx={3} className="dss-col-box" />
                <text x={NODES.fact.x + 13} y={colTop + i * colH + 10} className="dss-col-label">{c.key}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="dss-controls">
        <button type="button" className="dss-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="dss-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className={`dss-btn dss-mode${mode === 'snowflake' ? ' is-snow' : ''}`} onClick={toggleMode}>
          <GitBranch size={14} /> {mode === 'star' ? 'Star' : 'Snowflake'}
        </button>
        <label className="dss-speed">
          <Gauge size={13} />
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="dss-speed-range" />
          <span className="dss-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="dss-progress">{safeStep} / {total}</span>
      </div>

      <div className="dss-readout">
        <div className="dss-stat is-mode">
          <span className="dss-stat-label">schema</span>
          <span className="dss-stat-val">{mode === 'star' ? 'star' : 'snowflake'}</span>
        </div>
        <div className="dss-stat is-joins">
          <span className="dss-stat-label">joins</span>
          <span className="dss-stat-val">{cur.joins}</span>
        </div>
        <div className="dss-stat is-cols">
          <span className="dss-stat-label">columns scanned</span>
          <span className="dss-stat-val">{READ_COLS} / {FACT_COLS.length}</span>
        </div>
      </div>

      <div className="dss-note">
        <span className="dss-note-label">now</span>
        <span className="dss-note-body">{cur.action}</span>
      </div>
    </div>
  );
}
