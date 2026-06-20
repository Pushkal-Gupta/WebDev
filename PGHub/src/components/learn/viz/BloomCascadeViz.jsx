import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, RotateCcw, CheckCircle2, ShieldOff, ShieldCheck } from 'lucide-react';
import './BloomCascadeViz.css';

const STEP_MS = 620;
const M_MIN = 8;
const M_MAX = 48;
const DEFAULT_M = 20;
const K = 3;
const MAX_LAYERS = 6;

const INCLUDE_SET = Array.from({ length: 8 }, (_, i) => `revoked-${i + 1}`);
const EXCLUDE_SET = Array.from({ length: 30 }, (_, i) => `valid-${i + 1}`);

function fnv1a(str, salt) {
  let h = 0x811c9dc5 ^ (salt * 0x01000193);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= salt * 0x9e3779b9;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

function hashesFor(str, k, m) {
  const out = [];
  for (let s = 0; s < k; s++) out.push(fnv1a(str, s + 1) % m);
  return out;
}

function buildBits(keys, k, m) {
  const bits = new Array(m).fill(false);
  for (const key of keys) {
    for (const h of hashesFor(key, k, m)) bits[h] = true;
  }
  return bits;
}

function testBits(bits, key, k, m) {
  for (const h of hashesFor(key, k, m)) {
    if (!bits[h]) return false;
  }
  return true;
}

function buildCascade(include, exclude, k, m) {
  const layers = [];
  let driveSet = include.slice();
  let otherSet = exclude.slice();
  let isIncludeLayer = true;

  for (let depth = 0; depth < MAX_LAYERS; depth++) {
    const bits = buildBits(driveSet, k, m);
    const falsePositives = otherSet.filter((item) => testBits(bits, item, k, m));
    layers.push({
      depth,
      isIncludeLayer,
      built: driveSet.slice(),
      bits,
      falsePositives,
    });
    if (falsePositives.length === 0) break;
    driveSet = falsePositives;
    otherSet = isIncludeLayer ? include.slice() : exclude.slice();
    isIncludeLayer = !isIncludeLayer;
  }
  return layers;
}

function buildQueryFrames(layers, key, knownInclude, k, m) {
  const frames = [];
  let resolvedAt = -1;
  let verdict = null;

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const hs = hashesFor(key, k, m);
    const positive = testBits(layer.bits, key, k, m);
    const isLast = i === layers.length - 1;

    if (!positive) {
      const includeVerdict = !layer.isIncludeLayer;
      verdict = includeVerdict ? 'include' : 'exclude';
      resolvedAt = i;
      frames.push({
        active: i,
        hashes: hs,
        outcome: 'miss',
        label: `Layer ${i}: not present — resolved as ${
          includeVerdict ? 'IN the include set' : 'NOT in the include set'
        }`,
        resolvedAt: i,
        verdict,
      });
      break;
    }

    if (isLast) {
      verdict = layer.isIncludeLayer ? 'include' : 'exclude';
      resolvedAt = i;
      frames.push({
        active: i,
        hashes: hs,
        outcome: 'final',
        label: `Layer ${i}: positive at the final layer — definitively ${
          verdict === 'include' ? 'IN the include set' : 'NOT in the include set'
        }`,
        resolvedAt: i,
        verdict,
      });
      break;
    }

    frames.push({
      active: i,
      hashes: hs,
      outcome: 'hit',
      label: `Layer ${i}: positive — could be a false positive, descend to layer ${i + 1}`,
      resolvedAt: -1,
      verdict: null,
    });
  }

  const groundTruth = knownInclude.has(key) ? 'include' : 'exclude';
  return { frames, resolvedAt, verdict, groundTruth };
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const r = Math.round(n);
  if (r < min) return min;
  if (r > max) return max;
  return r;
}

function layerCellLayout(m) {
  const perRow = Math.min(m, 24);
  const cellW = m <= 12 ? 26 : m <= 24 ? 20 : 16;
  const gap = 3;
  const padX = 132;
  return { perRow, cellW, cellH: 22, gap, padX };
}

export default function BloomCascadeViz() {
  const [m, setM] = useState(DEFAULT_M);
  const [queryInput, setQueryInput] = useState('revoked-3');
  const [frames, setFrames] = useState([]);
  const [frameIdx, setFrameIdx] = useState(-1);
  const [operation, setOperation] = useState('Cascade built — query an item to trace it down the layers');
  const [verdict, setVerdict] = useState(null);
  const [resolvedLayer, setResolvedLayer] = useState(null);
  const playRef = useRef(null);

  const knownInclude = useMemo(() => new Set(INCLUDE_SET), []);

  const cascade = useMemo(
    () => buildCascade(INCLUDE_SET, EXCLUDE_SET, K, m),
    [m]
  );

  const currentFrame = frameIdx >= 0 && frameIdx < frames.length ? frames[frameIdx] : null;

  const totalBits = useMemo(() => cascade.length * m, [cascade, m]);
  const layout = useMemo(() => layerCellLayout(m), [m]);

  const svgWidth = useMemo(() => {
    const { perRow, cellW, gap, padX } = layout;
    return padX + perRow * cellW + (perRow - 1) * gap + 24;
  }, [layout]);

  const rowH = 64;
  const svgHeight = useMemo(() => 24 + cascade.length * rowH + 16, [cascade]);

  useEffect(() => {
    if (frameIdx < 0 || frameIdx >= frames.length - 1) return;
    playRef.current = setTimeout(() => setFrameIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [frameIdx, frames]);

  const onQuery = useCallback(() => {
    const key = String(queryInput).trim();
    if (!key) {
      setOperation('Enter an item to query');
      setVerdict(null);
      setResolvedLayer(null);
      return;
    }
    const { frames: fs, resolvedAt, verdict: v, groundTruth } = buildQueryFrames(
      cascade,
      key,
      knownInclude,
      K,
      m
    );
    setFrames(fs);
    setFrameIdx(0);
    setResolvedLayer(resolvedAt);
    const known = knownInclude.has(key) || EXCLUDE_SET.includes(key);
    setVerdict({
      kind: v === 'include' ? 'include' : 'exclude',
      truth: known ? groundTruth : null,
      correct: known ? v === groundTruth : null,
    });
    setOperation(`Query "${key}"`);
  }, [queryInput, cascade, knownInclude, m]);

  const onSampleInclude = useCallback(() => {
    const pick = INCLUDE_SET[fnv1a('inc', m) % INCLUDE_SET.length];
    setQueryInput(pick);
    setOperation(`Picked include sample "${pick}" — press Query`);
    setFrames([]);
    setFrameIdx(-1);
    setVerdict(null);
    setResolvedLayer(null);
  }, [m]);

  const onSampleExclude = useCallback(() => {
    const pick = EXCLUDE_SET[fnv1a('exc', m) % EXCLUDE_SET.length];
    setQueryInput(pick);
    setOperation(`Picked exclude sample "${pick}" — press Query`);
    setFrames([]);
    setFrameIdx(-1);
    setVerdict(null);
    setResolvedLayer(null);
  }, [m]);

  const onMChange = (e) => {
    const v = clampInt(e.target.value, M_MIN, M_MAX, DEFAULT_M);
    setM(v);
    setFrames([]);
    setFrameIdx(-1);
    setVerdict(null);
    setResolvedLayer(null);
    setOperation(`Per-layer bit size m = ${v} — smaller m means more collisions and more layers`);
  };

  const onReset = useCallback(() => {
    setM(DEFAULT_M);
    setQueryInput('revoked-3');
    setFrames([]);
    setFrameIdx(-1);
    setVerdict(null);
    setResolvedLayer(null);
    setOperation('Cascade rebuilt with defaults');
  }, []);

  const opLabel = currentFrame ? currentFrame.label : operation;
  const activeLayer = currentFrame ? currentFrame.active : -1;
  const activeHashes = currentFrame ? currentFrame.hashes : [];
  const activeOutcome = currentFrame ? currentFrame.outcome : null;
  const liveResolved = currentFrame && currentFrame.resolvedAt >= 0 ? currentFrame.resolvedAt : resolvedLayer;
  const activeHashSet = new Set(activeHashes);

  return (
    <div className="bcc-root">
      <div className="bcc-head">
        <div className="bcc-title-block">
          <h3 className="bcc-title">Bloom filter cascade</h3>
          <p className="bcc-sub">
            One Bloom filter has irreducible false positives. Stack a filter over the items that
            collide, then a filter over the items that collide with that, and the structure answers
            exactly right for every item in the known universe — the false-positive rate falls to zero.
          </p>
        </div>
      </div>

      <div className="bcc-controls">
        <div className="bcc-control-group">
          <label className="bcc-input-label" htmlFor="bcc-m">
            Bits m / layer
          </label>
          <input
            id="bcc-m"
            type="range"
            className="bcc-range"
            min={M_MIN}
            max={M_MAX}
            step={1}
            value={m}
            onChange={onMChange}
          />
          <span className="bcc-range-value">{m}</span>
        </div>

        <div className="bcc-control-group">
          <label className="bcc-input-label" htmlFor="bcc-query">
            Query
          </label>
          <input
            id="bcc-query"
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onQuery();
            }}
            className="bcc-input"
            placeholder="item"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="bcc-btn bcc-btn-accent" onClick={onQuery}>
            <Search size={14} /> Query
          </button>
        </div>

        {verdict && (
          <span className={`bcc-result-pill bcc-result-${verdict.kind}`}>
            {verdict.kind === 'include' ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
            {verdict.kind === 'include' ? 'In include set' : 'Not in include set'}
            {verdict.correct === true && <CheckCircle2 size={12} />}
          </span>
        )}

        <div className="bcc-control-spacer" />

        <button type="button" className="bcc-btn bcc-btn-primary" onClick={onSampleInclude}>
          <ShieldOff size={14} /> Sample include
        </button>
        <button type="button" className="bcc-btn" onClick={onSampleExclude}>
          <ShieldCheck size={14} /> Sample exclude
        </button>
        <button type="button" className="bcc-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="bcc-formula-row">
        <span className="bcc-formula-label">Universe</span>
        <code className="bcc-formula">include = {INCLUDE_SET.length} items</code>
        <span className="bcc-formula-sep">·</span>
        <code className="bcc-formula">exclude = {EXCLUDE_SET.length} items</code>
        <span className="bcc-formula-sep">·</span>
        <code className="bcc-formula bcc-formula-result">
          {cascade.length} layer{cascade.length === 1 ? '' : 's'} · {totalBits} bits
        </code>
        {currentFrame && activeHashes.length > 0 && (
          <>
            <span className="bcc-formula-sep">·</span>
            <code className="bcc-formula">
              hashes = [{activeHashes.join(', ')}]
            </code>
          </>
        )}
      </div>

      <div className="bcc-stage">
        <svg
          className="bcc-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Bloom filter cascade visualization"
        >
          {cascade.map((layer) => {
            const top = 24 + layer.depth * rowH;
            const isActive = activeLayer === layer.depth;
            const isResolved = liveResolved === layer.depth;
            const driveLabel = layer.isIncludeLayer ? 'include items' : 'exclude items';
            const rowCls = [
              'bcc-layer',
              layer.isIncludeLayer ? 'bcc-layer-inc' : 'bcc-layer-exc',
              isActive ? 'bcc-layer-active' : '',
              isResolved ? 'bcc-layer-resolved' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={`layer-${layer.depth}`} className={rowCls}>
                <text x={8} y={top + 14} className="bcc-layer-tag">
                  Layer {layer.depth}
                </text>
                <text x={8} y={top + 30} className="bcc-layer-meta">
                  over {layer.built.length} {driveLabel}
                </text>
                <text x={8} y={top + 46} className="bcc-layer-fp">
                  {layer.falsePositives.length} false-pos
                </text>
                {layer.bits.map((on, bi) => {
                  const x = layout.padX + bi * (layout.cellW + layout.gap);
                  const y = top + 8;
                  const hot = isActive && activeHashSet.has(bi);
                  const cellCls = [
                    'bcc-cell',
                    on ? 'bcc-cell-on' : 'bcc-cell-off',
                    hot ? 'bcc-cell-hot' : '',
                    hot && on ? 'bcc-cell-hit' : '',
                    hot && !on ? 'bcc-cell-miss' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <rect
                      key={`b-${layer.depth}-${bi}`}
                      className={cellCls}
                      x={x}
                      y={y}
                      width={layout.cellW}
                      height={layout.cellH}
                      rx={3}
                    />
                  );
                })}
                {isActive && (
                  <text
                    x={layout.padX}
                    y={top + rowH - 6}
                    className={`bcc-layer-outcome bcc-outcome-${activeOutcome || 'hit'}`}
                  >
                    {activeOutcome === 'miss'
                      ? 'not present — resolved here'
                      : activeOutcome === 'final'
                        ? 'positive at final layer — definitive'
                        : 'positive — descend'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="bcc-footer">
        <div className="bcc-stat">
          <span className="bcc-stat-label">Layers built</span>
          <span className="bcc-stat-value">{cascade.length}</span>
        </div>
        <div className="bcc-stat">
          <span className="bcc-stat-label">Resolved at layer</span>
          <span className="bcc-stat-value">{liveResolved == null || liveResolved < 0 ? '—' : liveResolved}</span>
        </div>
        <div className="bcc-stat">
          <span className="bcc-stat-label">Verdict</span>
          <span className="bcc-stat-value">
            {verdict ? (verdict.kind === 'include' ? 'In include set' : 'Not in include set') : '—'}
          </span>
        </div>
        <div className="bcc-stat">
          <span className="bcc-stat-label">Per-layer FPs</span>
          <span className="bcc-stat-value">
            [{cascade.map((l) => l.falsePositives.length).join(', ')}]
          </span>
        </div>
        <div className="bcc-stat">
          <span className="bcc-stat-label">Total bits</span>
          <span className="bcc-stat-value">{totalBits}</span>
        </div>
        <div className="bcc-stat bcc-stat-grow">
          <span className="bcc-stat-label">Current operation</span>
          <span className="bcc-stat-value">{opLabel}</span>
        </div>
      </div>
    </div>
  );
}
