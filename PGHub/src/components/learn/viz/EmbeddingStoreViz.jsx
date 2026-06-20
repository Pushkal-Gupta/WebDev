import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Minus, Search, RefreshCw } from 'lucide-react';
import './EmbeddingStoreViz.css';

// 2D plane the embeddings live in (matches the SVG plot box below).
const PLANE = { x0: 24, y0: 24, x1: 396, y1: 376 };
const N_POINTS = 48;
const N_CELLS = 6;

// Seeded PRNG — mulberry32. Same seed -> same point cloud + query, every render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

// Seed N points + C centroids + a query, all inside the plane, from one seed.
function seedWorld(seed) {
  const rnd = mulberry32(seed);
  const span = (lo, hi) => lo + rnd() * (hi - lo);
  const points = [];
  for (let i = 0; i < N_POINTS; i += 1) {
    points.push({ id: i, x: span(PLANE.x0 + 14, PLANE.x1 - 14), y: span(PLANE.y0 + 14, PLANE.y1 - 14) });
  }
  const centroids = [];
  for (let c = 0; c < N_CELLS; c += 1) {
    centroids.push({ id: c, x: span(PLANE.x0 + 30, PLANE.x1 - 30), y: span(PLANE.y0 + 30, PLANE.y1 - 30) });
  }
  // Assign each point to its nearest centroid (IVF coarse buckets).
  for (const p of points) {
    let best = 0;
    let bd = Infinity;
    for (const c of centroids) {
      const d = dist2(p, c);
      if (d < bd) { bd = d; best = c.id; }
    }
    p.cell = best;
  }
  const query = { x: span(PLANE.x0 + 40, PLANE.x1 - 40), y: span(PLANE.y0 + 40, PLANE.y1 - 40) };
  return { points, centroids, query };
}

// True k nearest neighbours by full scan — the ground truth recall is measured against.
function exactKNN(points, query, k) {
  return [...points]
    .map((p) => ({ id: p.id, d: dist2(p, query) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((r) => r.id);
}

// Build the step trace for the chosen mode. Pure — wrapped in useMemo by the caller.
function buildFrames({ mode, seed, k, nprobe }) {
  const { points, centroids, query } = seedWorld(seed);
  const total = points.length;
  const truth = exactKNN(points, query, k);
  const truthSet = new Set(truth);
  const frames = [];

  const base = () => ({
    points: points.map((p) => ({ ...p })),
    centroids: centroids.map((c) => ({ ...c })),
    query,
    truth,
    scanned: [],          // ids of vectors whose distance was computed
    probedCells: [],      // centroid ids being probed (approx)
    found: [],            // current candidate top-k
    cursor: null,         // id of the point under the scan head
    scannedCount: 0,
    region: 'plane',
    note: '',
  });

  frames.push({
    ...base(),
    note: mode === 'exact'
      ? `Exact kNN over ${total} vectors. A query arrives; we will compute its distance to every stored vector and keep the ${k} closest.`
      : `Approximate (IVF) search. ${total} vectors are bucketed into ${N_CELLS} coarse cells. We probe only the ${nprobe} cell(s) nearest the query — skipping the rest.`,
  });

  if (mode === 'exact') {
    const scanned = [];
    // Walk the cloud, computing distance to each vector in turn.
    for (let i = 0; i < points.length; i += 1) {
      scanned.push(points[i].id);
      const top = [...scanned]
        .map((id) => ({ id, d: dist2(points[id], query) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, k)
        .map((r) => r.id);
      frames.push({
        ...base(),
        scanned: [...scanned],
        found: top,
        cursor: points[i].id,
        scannedCount: scanned.length,
        region: 'plane',
        note: `Scan vector #${points[i].id} — distance computed. ${scanned.length}/${total} vectors examined; running top-${k} updated.`,
      });
    }
    frames.push({
      ...base(),
      scanned: points.map((p) => p.id),
      found: truth,
      scannedCount: total,
      region: 'result',
      note: `Done. Every one of the ${total} vectors was scanned, so the result is exact — recall is 1.00 by construction. Cost scales linearly with the corpus.`,
    });
    return { frames, truthSet, total };
  }

  // APPROXIMATE: rank cells by distance from query, probe the nearest nprobe.
  const cellRank = [...centroids]
    .map((c) => ({ id: c.id, d: dist2(c, query) }))
    .sort((a, b) => a.d - b.d)
    .map((r) => r.id);
  const probe = cellRank.slice(0, nprobe);
  const probeSet = new Set(probe);

  frames.push({
    ...base(),
    probedCells: [],
    region: 'cells',
    note: `Coarse step: measure the query against the ${N_CELLS} cell centroids and rank them. Nearest first: ${cellRank.map((c) => `C${c}`).join(' < ')}.`,
  });

  const scanned = [];
  for (let pi = 0; pi < probe.length; pi += 1) {
    const cellId = probe[pi];
    const members = points.filter((p) => p.cell === cellId);
    frames.push({
      ...base(),
      probedCells: probe.slice(0, pi + 1),
      scanned: [...scanned],
      found: [...scanned].map((id) => ({ id, d: dist2(points[id], query) })).sort((a, b) => a.d - b.d).slice(0, k).map((r) => r.id),
      scannedCount: scanned.length,
      region: 'cells',
      note: `Open cell C${cellId} (${members.length} vector${members.length === 1 ? '' : 's'}). Only its members will be scanned; all other cells stay closed.`,
    });
    for (const m of members) {
      scanned.push(m.id);
      const top = [...scanned]
        .map((id) => ({ id, d: dist2(points[id], query) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, k)
        .map((r) => r.id);
      frames.push({
        ...base(),
        probedCells: probe.slice(0, pi + 1),
        scanned: [...scanned],
        found: top,
        cursor: m.id,
        scannedCount: scanned.length,
        region: 'plane',
        note: `Scan vector #${m.id} inside cell C${cellId}. ${scanned.length} vectors examined so far — vs ${total} for a full scan.`,
      });
    }
  }

  const approxTop = [...scanned]
    .map((id) => ({ id, d: dist2(points[id], query) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((r) => r.id);
  const hits = approxTop.filter((id) => truthSet.has(id)).length;
  const recall = k ? hits / k : 0;
  const missed = truth.filter((id) => !approxTop.includes(id));

  frames.push({
    ...base(),
    probedCells: probe,
    scanned: [...scanned],
    found: approxTop,
    scannedCount: scanned.length,
    region: 'result',
    note: missed.length === 0
      ? `Done. Scanned ${scanned.length}/${total} vectors (${probeSet.size} of ${N_CELLS} cells) and recovered all ${k} true neighbours — recall 1.00 at a fraction of the work.`
      : `Done. Scanned ${scanned.length}/${total} vectors. Recall ${recall.toFixed(2)}: missed #${missed.join(', #')} — they sit in an unprobed cell. Raise nprobe to trade speed for recall.`,
  });

  return { frames, truthSet, total };
}

const DEFAULT_SEED = 12345;

export default function EmbeddingStoreViz() {
  const [mode, setMode] = useState('approx');
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [k, setK] = useState(4);
  const [nprobe, setNprobe] = useState(2);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2.5);
  const runTimer = useRef(null);

  const { frames, truthSet, total } = useMemo(
    () => buildFrames({ mode, seed, k, nprobe }),
    [mode, seed, k, nprobe],
  );
  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const setModeSafe = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setMode(m);
    setStep(0);
  };

  const stepK = (delta) => {
    const next = Math.max(1, Math.min(10, k + delta));
    if (next === k) return;
    setIsRunning(false);
    setK(next);
    setStep(0);
  };

  const stepNprobe = (delta) => {
    const next = Math.max(1, Math.min(N_CELLS, nprobe + delta));
    if (next === nprobe) return;
    setIsRunning(false);
    setNprobe(next);
    setStep(0);
  };

  const newQuery = () => {
    setIsRunning(false);
    setSeed((s) => (Math.imul(s, 1664525) + 1013904223) >>> 0);
    setStep(0);
  };

  const restart = () => {
    setIsRunning(false);
    setMode('approx');
    setSeed(DEFAULT_SEED);
    setK(4);
    setNprobe(2);
    setStep(0);
  };

  // Live readouts.
  const exactCost = total;
  const scannedNow = current.scannedCount;
  const speedup = scannedNow > 0 ? exactCost / scannedNow : exactCost;
  const foundIds = (current.found || []).map((f) => (typeof f === 'object' ? f.id : f));
  const hits = foundIds.filter((id) => truthSet.has(id)).length;
  const recall = k ? hits / k : 0;
  const isDone = current.region === 'result';

  const cellColor = (id) => {
    const palette = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--medium)', 'var(--warning)'];
    return palette[id % palette.length];
  };

  // SVG geometry — square plane on the left, legend column on the right.
  const W = 940;
  const H = 420;
  const plotX = 20;
  const plotY = 20;
  const plotS = 380;
  // Map plane coords (PLANE box) into the on-screen plot box.
  const mapX = (x) => plotX + ((x - PLANE.x0) / (PLANE.x1 - PLANE.x0)) * plotS;
  const mapY = (y) => plotY + ((y - PLANE.y0) / (PLANE.y1 - PLANE.y0)) * plotS;

  const panelX = 440;
  const truthSetLive = new Set(current.truth);
  const scannedSet = new Set(current.scanned);
  const foundSet = new Set(foundIds);
  const probedSet = new Set(current.probedCells);

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="esv">
      <div className="esv-head">
        <h3 className="esv-title">Vector store search — exact scan vs an approximate IVF index</h3>
        <p className="esv-sub">
          Embeddings are points in a plane. A query arrives and we want its nearest neighbours. Exact search
          touches every vector; an IVF index probes only the cells near the query — far less work, at the cost of
          some recall.
        </p>
      </div>

      <div className="esv-controls">
        <div className="esv-group esv-toggle">
          <button
            type="button"
            className={`esv-btn esv-seg ${mode === 'exact' ? 'is-on' : ''}`}
            onClick={() => setModeSafe('exact')}
          >
            Exact
          </button>
          <button
            type="button"
            className={`esv-btn esv-seg ${mode === 'approx' ? 'is-on' : ''}`}
            onClick={() => setModeSafe('approx')}
          >
            Approx (IVF)
          </button>
        </div>

        <div className="esv-stepper">
          <span className="esv-input-label">k</span>
          <button type="button" className="esv-btn esv-btn-step" onClick={() => stepK(-1)} disabled={k <= 1}>
            <Minus size={12} />
          </button>
          <span className="esv-stepper-val">{k}</span>
          <button type="button" className="esv-btn esv-btn-step" onClick={() => stepK(1)} disabled={k >= 10}>
            <Plus size={12} />
          </button>
        </div>

        <div className={`esv-stepper ${mode === 'approx' ? '' : 'is-off'}`}>
          <span className="esv-input-label">nprobe</span>
          <button type="button" className="esv-btn esv-btn-step" onClick={() => stepNprobe(-1)} disabled={mode !== 'approx' || nprobe <= 1}>
            <Minus size={12} />
          </button>
          <span className="esv-stepper-val">{nprobe}/{N_CELLS}</span>
          <button type="button" className="esv-btn esv-btn-step" onClick={() => stepNprobe(1)} disabled={mode !== 'approx' || nprobe >= N_CELLS}>
            <Plus size={12} />
          </button>
        </div>

        <button type="button" className="esv-btn" onClick={newQuery}>
          <Search size={13} /> New query
        </button>

        <label className="esv-speed">
          <span className="esv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="esv-speed-range"
            aria-label="Playback speed"
          />
          <span className="esv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="esv-spacer" aria-hidden="true" />

        <div className="esv-group">
          <button
            type="button"
            className="esv-btn esv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={totalSteps <= 1}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="esv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="esv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="esv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="esv-btn" onClick={restart}>
            <RefreshCw size={13} /> Restart
          </button>
        </div>
        <div className="esv-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="esv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="esv-svg" preserveAspectRatio="xMidYMid meet">
          {/* plot frame */}
          <rect className="esv-plane" x={plotX} y={plotY} width={plotS} height={plotS} rx={10} />

          {/* cell membership shading (approx only) — line each point to its centroid when its cell is probed */}
          {mode === 'approx' && current.points.map((p) => {
            const c = current.centroids[p.cell];
            const probed = probedSet.has(p.cell);
            if (!probed) return null;
            return (
              <line
                key={`spoke-${p.id}`}
                className="esv-spoke"
                x1={mapX(p.x)}
                y1={mapY(p.y)}
                x2={mapX(c.x)}
                y2={mapY(c.y)}
                style={{ stroke: cellColor(p.cell) }}
              />
            );
          })}

          {/* centroids (approx only) */}
          {mode === 'approx' && current.centroids.map((c) => {
            const probed = probedSet.has(c.id);
            return (
              <g key={`cen-${c.id}`}>
                <rect
                  className={`esv-centroid ${probed ? 'is-probed' : 'is-closed'}`}
                  x={mapX(c.x) - 9}
                  y={mapY(c.y) - 9}
                  width={18}
                  height={18}
                  rx={4}
                  style={{ stroke: cellColor(c.id), fill: probed ? cellColor(c.id) : 'var(--surface)' }}
                />
                <text className="esv-centroid-label" x={mapX(c.x)} y={mapY(c.y) + 3.5}>C{c.id}</text>
              </g>
            );
          })}

          {/* stored vectors */}
          {current.points.map((p) => {
            const isFound = foundSet.has(p.id);
            const isTruth = truthSetLive.has(p.id);
            const isScanned = scannedSet.has(p.id);
            const isCursor = current.cursor === p.id;
            const dimmed = mode === 'approx' && !probedSet.has(p.cell) && !isDone;
            let cls = 'esv-pt';
            if (dimmed) cls += ' is-dim';
            else if (isCursor) cls += ' is-cursor';
            else if (isFound) cls += ' is-found';
            else if (isScanned) cls += ' is-scanned';
            const fill = mode === 'approx' ? cellColor(p.cell) : 'var(--text-dim)';
            return (
              <g key={`pt-${p.id}`}>
                <circle
                  className={cls}
                  cx={mapX(p.x)}
                  cy={mapY(p.y)}
                  r={isCursor ? 7 : isFound ? 6 : 4.5}
                  style={!dimmed && (isFound || isScanned || isCursor) ? undefined : { fill }}
                />
                {isDone && isTruth && !isFound && (
                  <circle className="esv-pt-missed" cx={mapX(p.x)} cy={mapY(p.y)} r={9} />
                )}
              </g>
            );
          })}

          {/* query point + scan beam */}
          {current.cursor != null && (() => {
            const p = current.points[current.cursor];
            return (
              <line
                className="esv-beam"
                x1={mapX(current.query.x)}
                y1={mapY(current.query.y)}
                x2={mapX(p.x)}
                y2={mapY(p.y)}
              />
            );
          })()}
          <g>
            <circle className="esv-query-ring" cx={mapX(current.query.x)} cy={mapY(current.query.y)} r={12} />
            <circle className="esv-query" cx={mapX(current.query.x)} cy={mapY(current.query.y)} r={6} />
            <text className="esv-query-label" x={mapX(current.query.x)} y={mapY(current.query.y) - 16}>query</text>
          </g>

          {/* right panel — scan progress + cells legend */}
          <text className="esv-panel-label" x={panelX} y={36}>
            {mode === 'exact' ? 'full scan progress' : 'cell probing'}
          </text>

          {/* scan progress bar */}
          {(() => {
            const barX = panelX;
            const barY = 52;
            const barW = W - panelX - 30;
            const frac = total ? scannedNow / total : 0;
            return (
              <g>
                <rect className="esv-bar-bg" x={barX} y={barY} width={barW} height={16} rx={6} />
                <rect className="esv-bar" x={barX} y={barY} width={Math.max(2, barW * frac)} height={16} rx={6} />
                <text className="esv-bar-text" x={barX + barW} y={barY + 32} textAnchor="end">
                  {scannedNow} / {total} vectors scanned
                </text>
              </g>
            );
          })()}

          {/* cells legend (approx) */}
          {mode === 'approx' && current.centroids.map((c, i) => {
            const y = 112 + i * 30;
            const probed = probedSet.has(c.id);
            const count = current.points.filter((p) => p.cell === c.id).length;
            return (
              <g key={`leg-${c.id}`}>
                <rect
                  className={`esv-leg-swatch ${probed ? 'is-probed' : ''}`}
                  x={panelX}
                  y={y}
                  width={18}
                  height={18}
                  rx={4}
                  style={{ fill: probed ? cellColor(c.id) : 'var(--surface)', stroke: cellColor(c.id) }}
                />
                <text className="esv-leg-name" x={panelX + 26} y={y + 14}>cell C{c.id}</text>
                <text className="esv-leg-count" x={panelX + 130} y={y + 14}>{count} vec</text>
                <text className={`esv-leg-state ${probed ? 'is-probed' : ''}`} x={W - 30} y={y + 14} textAnchor="end">
                  {probed ? 'probed' : 'skipped'}
                </text>
              </g>
            );
          })}

          {/* exact mode legend rows */}
          {mode === 'exact' && (
            <g>
              <text className="esv-leg-name" x={panelX} y={120}>Every vector is compared to the query.</text>
              <text className="esv-leg-name" x={panelX} y={146}>No index, no skipping — the result is exact</text>
              <text className="esv-leg-name" x={panelX} y={166}>but cost grows with the corpus size.</text>
            </g>
          )}

          {/* result summary */}
          <text className="esv-panel-label" x={panelX} y={mode === 'approx' ? 320 : 320}>result</text>
          <rect className="esv-result-box" x={panelX} y={332} width={W - panelX - 30} height={62} rx={8} />
          <text className="esv-result-line" x={panelX + 14} y={356}>
            top-{k}: {foundIds.length ? `#${foundIds.join(', #')}` : '—'}
          </text>
          <text className="esv-result-line esv-result-recall" x={panelX + 14} y={380}>
            recall {isDone ? recall.toFixed(2) : '…'} · scanned {scannedNow}/{total} · speedup {speedup.toFixed(1)}×
          </text>
        </svg>
      </div>

      <div className="esv-metrics">
        <div className="esv-metric">
          <span className="esv-metric-label">mode</span>
          <span className="esv-metric-value">{mode === 'exact' ? 'exact kNN' : 'IVF approx'}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">vectors scanned</span>
          <span className="esv-metric-value is-scan">{scannedNow} / {total}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">speedup</span>
          <span className="esv-metric-value is-speed">{speedup.toFixed(1)}×</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">recall@{k}</span>
          <span className="esv-metric-value is-recall">{isDone ? recall.toFixed(2) : '…'}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">cells probed</span>
          <span className="esv-metric-value">{mode === 'approx' ? `${current.probedCells.length} / ${N_CELLS}` : '—'}</span>
        </div>
      </div>

      <div className="esv-narration">
        <span className="esv-narration-label">trace</span>
        <span className="esv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
