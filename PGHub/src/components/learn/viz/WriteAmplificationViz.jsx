import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './WriteAmplificationViz.css';

const ENGINES = [
  { id: 'lsm', label: 'LSM-tree', sub: 'RocksDB · Cassandra' },
  { id: 'btree', label: 'B-tree', sub: 'Postgres · InnoDB' },
];

const WAL_BYTES = 100;

// B-tree WA: a small row update forces a full page rewrite + WAL append.
// Coalescing (buffer pool) divides the page cost across rows flushed together.
function btreeWA(rowBytes, pageKB, coalesceRows) {
  const pageBytes = pageKB * 1024;
  const perRowPageCost = pageBytes / coalesceRows;
  return (perRowPageCost + WAL_BYTES) / rowBytes;
}

// LSM WA: each compaction pass rewrites the row once (per-level multiplier),
// plus the memtable flush write and the initial WAL.
function lsmWA(levels, overlap) {
  // memtable flush (1) + one rewrite per compaction pass (= levels),
  // scaled by an overlap factor for overlapping compactions / tombstones.
  return (1 + levels) * overlap;
}

export default function WriteAmplificationViz() {
  const [engine, setEngine] = useState('lsm');
  const [rowBytes, setRowBytes] = useState(100);
  const [pageKB, setPageKB] = useState(8);
  const [coalesce, setCoalesce] = useState(40);
  const [levels, setLevels] = useState(6);
  const [overlap, setOverlap] = useState(1.6);

  const reset = () => {
    setEngine('lsm');
    setRowBytes(100);
    setPageKB(8);
    setCoalesce(40);
    setLevels(6);
    setOverlap(1.6);
  };

  const wa = useMemo(() => {
    if (engine === 'btree') return btreeWA(rowBytes, pageKB, coalesce);
    return lsmWA(levels, overlap);
  }, [engine, rowBytes, pageKB, coalesce, levels, overlap]);

  const waText = wa >= 10 ? wa.toFixed(0) : wa.toFixed(1);
  const dominantCost = engine === 'btree' ? 'page rewrite' : 'compaction rewrites';
  const tradeoff =
    engine === 'btree'
      ? 'B-tree: lower write amplification, but worse random-write throughput — each small update drags a whole page to disk.'
      : 'LSM-tree: high write throughput, but higher write amplification and read amplification — data is rewritten once per compaction level.';

  // Gauge: map WA onto a 0..40 scale arc.
  const GAUGE_MAX = 40;
  const gaugeFrac = Math.min(wa / GAUGE_MAX, 1);
  const gaugeHue =
    wa <= 4 ? 'var(--easy)' : wa <= 12 ? 'var(--medium)' : 'var(--hard)';

  // SVG geometry
  const W = 940;
  const H = 380;

  // LSM level stack (vertical, data flows DOWN)
  const lsmLevels = useMemo(() => {
    const arr = [{ key: 'mem', name: 'memtable + WAL', tone: 'var(--hue-sky)' }];
    for (let i = 0; i < levels; i += 1) {
      arr.push({ key: `L${i}`, name: `L${i} SSTable`, tone: 'var(--hue-violet)' });
    }
    return arr;
  }, [levels]);

  // B-tree page: shaded wasted bytes for one small row update
  const pageBytes = pageKB * 1024;
  const usefulFrac = Math.min(rowBytes / pageBytes, 1);

  return (
    <div className="wav">
      <div className="wav-head">
        <h3 className="wav-title">Write amplification — LSM-tree vs B-tree</h3>
        <p className="wav-sub">
          One logical write costs many physical writes. Toggle the engine and drag the sliders to watch the
          write-amplification factor move, and see exactly where the wasted bytes go.
        </p>
      </div>

      <div className="wav-controls">
        <div className="wav-engines" role="tablist" aria-label="Storage engine">
          {ENGINES.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`wav-engine ${engine === e.id ? 'is-on' : ''}`}
              onClick={() => setEngine(e.id)}
              aria-pressed={engine === e.id}
            >
              <span className="wav-engine-label">{e.label}</span>
              <span className="wav-engine-sub">{e.sub}</span>
            </button>
          ))}
        </div>

        <span className="wav-spacer" aria-hidden="true" />

        <button type="button" className="wav-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="wav-sliders">
        <label className="wav-slider">
          <span className="wav-slider-label">row size</span>
          <input type="range" min={20} max={1000} step={10} value={rowBytes} onChange={(e) => setRowBytes(Number(e.target.value))} aria-label="Row size in bytes" />
          <span className="wav-slider-value">{rowBytes} B</span>
        </label>

        {engine === 'btree' ? (
          <>
            <label className="wav-slider">
              <span className="wav-slider-label">page size</span>
              <input type="range" min={4} max={16} step={2} value={pageKB} onChange={(e) => setPageKB(Number(e.target.value))} aria-label="Page size in KB" />
              <span className="wav-slider-value">{pageKB} KB</span>
            </label>
            <label className="wav-slider">
              <span className="wav-slider-label">rows / flush</span>
              <input type="range" min={1} max={120} step={1} value={coalesce} onChange={(e) => setCoalesce(Number(e.target.value))} aria-label="Rows coalesced per page flush" />
              <span className="wav-slider-value">{coalesce}×</span>
            </label>
          </>
        ) : (
          <>
            <label className="wav-slider">
              <span className="wav-slider-label">LSM levels</span>
              <input type="range" min={2} max={8} step={1} value={levels} onChange={(e) => setLevels(Number(e.target.value))} aria-label="Number of LSM levels" />
              <span className="wav-slider-value">{levels}</span>
            </label>
            <label className="wav-slider">
              <span className="wav-slider-label">overlap factor</span>
              <input type="range" min={1} max={3} step={0.1} value={overlap} onChange={(e) => setOverlap(Number(e.target.value))} aria-label="Compaction overlap factor" />
              <span className="wav-slider-value">{overlap.toFixed(1)}×</span>
            </label>
          </>
        )}
      </div>

      <div className="wav-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="wav-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="wav-gauge-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--easy)" />
              <stop offset="45%" stopColor="var(--medium)" />
              <stop offset="100%" stopColor="var(--hard)" />
            </linearGradient>
            <clipPath id="wav-gauge-clip">
              <rect x={540} y={170} width={360 * gaugeFrac} height={34} rx={6} />
            </clipPath>
          </defs>

          {engine === 'lsm' ? (
            <g>
              <text className="wav-diag-title" x={250} y={34}>compaction cascade — one row rewritten per level</text>
              {lsmLevels.map((lv, i) => {
                const boxW = 280;
                const boxH = 30;
                const gap = 8;
                const x = 110;
                const y = 50 + i * (boxH + gap);
                return (
                  <g key={lv.key}>
                    <rect className="wav-lsm-box" x={x} y={y} width={boxW} height={boxH} rx={6} style={{ stroke: lv.tone }} />
                    <rect x={x} y={y} width={5} height={boxH} rx={2.5} fill={lv.tone} />
                    <text className="wav-lsm-name" x={x + 16} y={y + boxH / 2 + 4}>{lv.name}</text>
                    <text className="wav-lsm-write" x={x + boxW - 12} y={y + boxH / 2 + 4}>write #{i + 1}</text>
                    {i < lsmLevels.length - 1 && (
                      <line className="wav-down" x1={x + boxW / 2} y1={y + boxH} x2={x + boxW / 2} y2={y + boxH + gap} markerEnd="url(#wav-arrow)" />
                    )}
                  </g>
                );
              })}
              <defs>
                <marker id="wav-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" className="wav-arrowhead" />
                </marker>
              </defs>
            </g>
          ) : (
            <g>
              <text className="wav-diag-title" x={250} y={34}>one small row update rewrites a whole page</text>
              {(() => {
                const px = 110;
                const py = 70;
                const pw = 280;
                const ph = 200;
                const usefulH = Math.max(ph * usefulFrac, 6);
                return (
                  <>
                    <rect className="wav-page" x={px} y={py} width={pw} height={ph} rx={8} />
                    <rect className="wav-page-wasted" x={px} y={py} width={pw} height={ph} rx={8} />
                    <rect className="wav-page-useful" x={px} y={py + ph - usefulH} width={pw} height={usefulH} rx={4} />
                    <text className="wav-page-label" x={px + pw / 2} y={py - 12}>{pageKB} KB page</text>
                    <text className="wav-page-useful-label" x={px + pw / 2} y={py + ph - usefulH / 2 + 4}>
                      {rowBytes} B row
                    </text>
                    <text className="wav-page-wasted-label" x={px + pw / 2} y={py + 28}>
                      rewritten bytes (wasted)
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* gauge + WA factor */}
          <text className="wav-gauge-title" x={720} y={120}>write amplification</text>
          <text className="wav-wa-big" x={720} y={158} style={{ fill: gaugeHue }}>{waText}×</text>
          <rect className="wav-gauge-track" x={540} y={170} width={360} height={34} rx={6} />
          <rect x={540} y={170} width={360} height={34} rx={6} fill="url(#wav-gauge-grad)" clipPath="url(#wav-gauge-clip)" opacity={0.85} />
          <text className="wav-gauge-min" x={540} y={228}>1×</text>
          <text className="wav-gauge-max" x={900} y={228}>{GAUGE_MAX}×+</text>

          <text className="wav-dom" x={720} y={272}>dominant cost</text>
          <text className="wav-dom-val" x={720} y={296} style={{ fill: gaugeHue }}>{dominantCost}</text>
        </svg>
      </div>

      <div className="wav-metrics">
        <div className="wav-metric">
          <span className="wav-metric-label">engine</span>
          <span className="wav-metric-value">{engine === 'btree' ? 'B-tree' : 'LSM-tree'}</span>
        </div>
        <div className="wav-metric">
          <span className="wav-metric-label">WA factor</span>
          <span className="wav-metric-value" style={{ color: gaugeHue }}>{waText}×</span>
        </div>
        <div className="wav-metric">
          <span className="wav-metric-label">dominant cost</span>
          <span className="wav-metric-value is-cost">{dominantCost}</span>
        </div>
        <div className="wav-metric">
          <span className="wav-metric-label">read amp</span>
          <span className="wav-metric-value">{engine === 'btree' ? '1–3 reads' : `${levels}+ reads`}</span>
        </div>
      </div>

      <div className="wav-narration" style={{ borderLeftColor: gaugeHue }}>
        <span className="wav-narration-label">tradeoff</span>
        <span className="wav-narration-body">{tradeoff}</span>
      </div>
    </div>
  );
}
