import React, { useMemo, useState } from 'react';
import { Database, Binary, Search, RefreshCw } from 'lucide-react';
import './DatabaseIndexingViz.css';

// Deterministic LCG so the row keys are stable between renders.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Build a sorted set of distinct keys for a table of `size` rows.
function buildKeys(size) {
  const rand = lcg(1337 + size);
  const set = new Set();
  while (set.size < size) set.add(1 + Math.floor(rand() * (size * 3)));
  return [...set].sort((a, b) => a - b);
}

// Linear scan: walk rows left to right, count comparisons until the key matches.
function fullScan(keys, target) {
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === target) return { found: true, scanned: i + 1, hitIndex: i };
  }
  return { found: false, scanned: keys.length, hitIndex: -1 };
}

// B-tree descent simulated as binary search over the sorted key array.
// Returns the comparison count (≈ log2 n) plus the path of probed indices.
function indexDescent(keys, target) {
  let lo = 0;
  let hi = keys.length - 1;
  let probes = 0;
  const path = [];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    probes += 1;
    path.push(mid);
    if (keys[mid] === target) return { found: true, scanned: probes, hitIndex: mid, path };
    if (keys[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { found: false, scanned: probes, hitIndex: -1, path };
}

const MODES = ['no index', 'with index'];
const SIZES = [8, 16, 32, 64, 128, 256];

export default function DatabaseIndexingViz() {
  const [mode, setMode] = useState('no index');
  const [sizeIdx, setSizeIdx] = useState(2); // 32 rows
  const [targetSeed, setTargetSeed] = useState(0);

  const size = SIZES[sizeIdx];
  const keys = useMemo(() => buildKeys(size), [size]);

  // Pick a lookup target that exists in the table (seeded, not Math.random).
  const target = useMemo(() => {
    const rand = lcg(99 + targetSeed * 31 + size);
    return keys[Math.floor(rand() * keys.length)];
  }, [keys, targetSeed, size]);

  const scan = useMemo(() => fullScan(keys, target), [keys, target]);
  const descent = useMemo(() => indexDescent(keys, target), [keys, target]);
  const result = mode === 'no index' ? scan : descent;
  const probedSet = useMemo(
    () => (mode === 'with index' ? new Set(descent.path) : null),
    [mode, descent],
  );

  // Growth table: scan cost (linear) vs index cost (log) across all sizes.
  const growth = useMemo(
    () =>
      SIZES.map((n) => ({
        n,
        scan: n,
        index: Math.max(1, Math.ceil(Math.log2(n + 1))),
      })),
    [],
  );

  // SVG geometry.
  const W = 940;
  const cols = 16;
  const cellW = 52;
  const cellH = 34;
  const gridGap = 5;
  const gridLeft = 30;
  const gridTop = 64;
  const rows = Math.ceil(keys.length / cols);
  const gridH = rows * (cellH + gridGap);
  const chartTop = gridTop + gridH + 54;
  const chartH = 150;
  const H = chartTop + chartH + 36;

  const cellXY = (i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    return { x: gridLeft + c * (cellW + gridGap), y: gridTop + r * (cellH + gridGap) };
  };

  // Chart scales.
  const chartLeft = 70;
  const chartRight = W - 30;
  const chartW = chartRight - chartLeft;
  const maxN = SIZES[SIZES.length - 1];
  const maxCost = maxN;
  const cx = (n) => chartLeft + (Math.log2(n) / Math.log2(maxN)) * chartW;
  const cy = (cost) => chartTop + chartH - (cost / maxCost) * (chartH - 16) - 8;
  const scanPath = growth.map((g, i) => `${i === 0 ? 'M' : 'L'} ${cx(g.n)} ${cy(g.scan)}`).join(' ');
  const indexPath = growth.map((g, i) => `${i === 0 ? 'M' : 'L'} ${cx(g.n)} ${cy(g.index)}`).join(' ');

  const speedup = result.scanned > 0 ? (scan.scanned / descent.scanned) : 1;

  return (
    <div className="dix">
      <div className="dix-head">
        <h3 className="dix-title">Database indexing — full scan vs B-tree lookup</h3>
        <p className="dix-sub">
          Look up one key in a sorted table. Without an index the engine scans rows one by one; a B-tree
          index descends straight to the row in about log₂n comparisons.
        </p>
      </div>

      <div className="dix-controls">
        <div className="dix-modes" role="tablist" aria-label="Lookup strategy">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={`dix-mode ${mode === m ? 'is-on' : ''}`}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
            >
              {m === 'no index' ? <Database size={13} /> : <Binary size={13} />}
              {m}
            </button>
          ))}
        </div>

        <label className="dix-size">
          <span className="dix-input-label">table size</span>
          <input
            type="range"
            min={0}
            max={SIZES.length - 1}
            step={1}
            value={sizeIdx}
            onChange={(e) => setSizeIdx(Number(e.target.value))}
            className="dix-range"
            aria-label="Number of rows"
          />
          <span className="dix-size-val">{size} rows</span>
        </label>

        <button type="button" className="dix-btn" onClick={() => setTargetSeed((s) => s + 1)}>
          <RefreshCw size={12} /> new key
        </button>
        <div className="dix-target">
          <Search size={13} />
          <span className="dix-input-label">looking up</span>
          <span className="dix-target-val">{target}</span>
        </div>
      </div>

      <div className="dix-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dix-svg" preserveAspectRatio="xMidYMid meet">
          <text x={gridLeft} y={34} className="dix-row-label">
            {mode === 'no index'
              ? 'table rows scanned left → right (orange = compared, green = match)'
              : 'B-tree probes (violet = probed, green = match) — most rows never touched'}
          </text>

          {keys.map((k, i) => {
            const { x, y } = cellXY(i);
            const isHit = result.found && i === result.hitIndex;
            let cls = 'dix-cell';
            if (isHit) cls += ' is-hit';
            else if (mode === 'no index' && i < result.scanned) cls += ' is-scanned';
            else if (mode === 'with index' && probedSet && probedSet.has(i)) cls += ' is-probed';
            return (
              <g key={`cell-${i}`}>
                <rect className={cls} x={x} y={y} width={cellW} height={cellH} rx={5} />
                <text className="dix-cell-val" x={x + cellW / 2} y={y + cellH / 2 + 4}>{k}</text>
              </g>
            );
          })}

          {/* growth chart */}
          <text x={chartLeft} y={chartTop - 16} className="dix-row-label">
            comparisons vs table size — linear scan blows up, index stays flat
          </text>
          <line x1={chartLeft} y1={chartTop + chartH - 8} x2={chartRight} y2={chartTop + chartH - 8} className="dix-axis" />
          <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartTop + chartH - 8} className="dix-axis" />

          <path d={scanPath} className="dix-line is-scan" />
          <path d={indexPath} className="dix-line is-index" />

          {growth.map((g) => {
            const here = g.n === size;
            return (
              <g key={`pt-${g.n}`}>
                <circle cx={cx(g.n)} cy={cy(g.scan)} r={here ? 5 : 3} className="dix-dot is-scan" />
                <circle cx={cx(g.n)} cy={cy(g.index)} r={here ? 5 : 3} className="dix-dot is-index" />
                <text x={cx(g.n)} y={chartTop + chartH + 8} className="dix-axis-tick">{g.n}</text>
              </g>
            );
          })}
          {/* current size marker */}
          <line x1={cx(size)} y1={chartTop} x2={cx(size)} y2={chartTop + chartH - 8} className="dix-marker" />

          <g className="dix-legend">
            <rect x={chartRight - 168} y={chartTop + 2} width={11} height={11} rx={2} className="dix-swatch is-scan" />
            <text x={chartRight - 152} y={chartTop + 11} className="dix-legend-txt">full scan O(n)</text>
            <rect x={chartRight - 168} y={chartTop + 20} width={11} height={11} rx={2} className="dix-swatch is-index" />
            <text x={chartRight - 152} y={chartTop + 29} className="dix-legend-txt">index O(log n)</text>
          </g>
        </svg>
      </div>

      <div className="dix-metrics">
        <div className="dix-metric">
          <span className="dix-metric-label">strategy</span>
          <span className="dix-metric-value">{mode}</span>
        </div>
        <div className="dix-metric">
          <span className="dix-metric-label">rows scanned</span>
          <span className={`dix-metric-value ${mode === 'no index' ? 'is-scan' : 'is-index'}`}>
            {result.scanned}
          </span>
        </div>
        <div className="dix-metric">
          <span className="dix-metric-label">scan would cost</span>
          <span className="dix-metric-value is-scan">{scan.scanned}</span>
        </div>
        <div className="dix-metric">
          <span className="dix-metric-label">index would cost</span>
          <span className="dix-metric-value is-index">{descent.scanned}</span>
        </div>
        <div className="dix-metric">
          <span className="dix-metric-label">speedup</span>
          <span className="dix-metric-value">{speedup.toFixed(1)}×</span>
        </div>
      </div>

      <div className="dix-narration">
        <span className="dix-narration-label">trace</span>
        <span className="dix-narration-body">
          {mode === 'no index'
            ? `Full scan of ${size} rows: compared ${result.scanned} row(s) to find key ${target} at position ${result.hitIndex}. With twice the rows the cost roughly doubles.`
            : `B-tree descent: ${descent.scanned} probe(s) (path ${descent.path.map((i) => keys[i]).join(' → ')}) located key ${target}. Doubling the table adds only one probe.`}
        </span>
      </div>
    </div>
  );
}
