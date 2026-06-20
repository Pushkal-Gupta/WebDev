import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './CacheStrategyViz.css';

const MODES = [
  { key: 'aside', label: 'CACHE-ASIDE' },
  { key: 'through', label: 'WRITE-THROUGH' },
  { key: 'back', label: 'WRITE-BACK' },
];

// A fixed read/write workload, identical across modes so the path differences
// are the whole story. R = read key, W = write key=value.
const OPS = [
  { type: 'R', key: 'A' },
  { type: 'R', key: 'A' },
  { type: 'W', key: 'A', val: 9 },
  { type: 'R', key: 'A' },
  { type: 'W', key: 'B', val: 7 },
  { type: 'R', key: 'B' },
];

const fmtStore = (store) => {
  const keys = Object.keys(store);
  if (keys.length === 0) return '∅';
  return keys.map((k) => `${k}=${store[k]}`).join('  ');
};

// Build the entire step trace for one mode. Each frame is a fully-resolved
// snapshot: cache + db contents, hit/miss counts, which edge is lit, where the
// data currently "lands", and a narration line.
function buildFrames(mode) {
  const frames = [];
  const cache = {};   // hot copies
  const db = {};       // source of truth — seed it so reads can find something
  db.A = 5;
  db.B = 7;
  let hits = 0;
  let misses = 0;
  let dirty = [];      // keys written to cache but not yet flushed (write-back)

  const snap = (extra) => ({
    cache: { ...cache },
    db: { ...db },
    dirty: [...dirty],
    hits,
    misses,
    opIdx: -1,
    result: null,        // HIT | MISS | null
    edge: null,          // app-cache | cache-db | app-db | flush
    edgeDir: 'fwd',      // fwd (left->right) | back (right->left)
    landAt: null,        // cache | db — pulse target
    path: [],            // accumulated edges for this op (for the path readout)
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `${MODES.find((m) => m.key === mode).label}. DB pre-seeded A=5, B=7; cache cold. Reads check the cache first; writes differ by strategy. Step through to see the arrow path each op takes.`,
  }));

  OPS.forEach((op, i) => {
    if (op.type === 'R') {
      // Every read in every strategy is cache-aside on the read path:
      // app asks cache; hit returns, miss falls through to DB + populate.
      const inCache = Object.prototype.hasOwnProperty.call(cache, op.key);
      frames.push(snap({
        phase: 'read-lookup', opIdx: i, edge: 'app-cache', edgeDir: 'fwd', landAt: 'cache',
        path: ['app→cache'],
        note: `READ ${op.key}: app asks the cache for ${op.key}.`,
      }));
      if (inCache) {
        hits += 1;
        frames.push(snap({
          phase: 'read-hit', opIdx: i, result: 'HIT', edge: 'app-cache', edgeDir: 'back', landAt: 'cache',
          path: ['app→cache', 'HIT', 'cache→app'],
          note: `READ ${op.key}: cache HIT (${op.key}=${cache[op.key]}). Return from cache — the DB is never touched.`,
        }));
      } else {
        misses += 1;
        frames.push(snap({
          phase: 'read-miss', opIdx: i, result: 'MISS', edge: 'cache-db', edgeDir: 'fwd', landAt: 'db',
          path: ['app→cache', 'MISS', 'cache→db'],
          note: `READ ${op.key}: cache MISS. Fall through to the database to load ${op.key}.`,
        }));
        const v = Object.prototype.hasOwnProperty.call(db, op.key) ? db[op.key] : null;
        cache[op.key] = v;
        frames.push(snap({
          phase: 'read-populate', opIdx: i, result: 'MISS', edge: 'cache-db', edgeDir: 'back', landAt: 'cache',
          path: ['app→cache', 'MISS', 'cache→db', 'populate', 'cache→app'],
          note: `READ ${op.key}: DB returns ${op.key}=${v}. Populate the cache, then return ${v} to the app. Next read of ${op.key} will hit.`,
        }));
      }
    } else {
      // WRITE differs entirely by strategy.
      if (mode === 'aside') {
        // Lazy: write straight to DB, then invalidate (delete) the cache entry.
        frames.push(snap({
          phase: 'write-db', opIdx: i, edge: 'app-db', edgeDir: 'fwd', landAt: 'db',
          path: ['app→db'],
          note: `WRITE ${op.key}=${op.val}: cache-aside writes to the DB directly (the app owns the cache).`,
        }));
        db[op.key] = op.val;
        const had = Object.prototype.hasOwnProperty.call(cache, op.key);
        if (had) delete cache[op.key];
        dirty = dirty.filter((k) => k !== op.key);
        frames.push(snap({
          phase: 'write-invalidate', opIdx: i, edge: 'app-cache', edgeDir: 'fwd', landAt: 'cache',
          path: ['app→db', 'invalidate cache'],
          note: had
            ? `WRITE ${op.key}=${op.val}: DB updated. INVALIDATE the stale cache copy of ${op.key} so the next read reloads fresh.`
            : `WRITE ${op.key}=${op.val}: DB updated. ${op.key} was not cached — nothing to invalidate.`,
        }));
      } else if (mode === 'through') {
        // Synchronous: write cache AND db together; caller waits for both.
        cache[op.key] = op.val;
        frames.push(snap({
          phase: 'write-cache', opIdx: i, edge: 'app-cache', edgeDir: 'fwd', landAt: 'cache',
          path: ['app→cache'],
          note: `WRITE ${op.key}=${op.val}: write-through updates the cache first, synchronously.`,
        }));
        db[op.key] = op.val;
        dirty = dirty.filter((k) => k !== op.key);
        frames.push(snap({
          phase: 'write-db', opIdx: i, edge: 'cache-db', edgeDir: 'fwd', landAt: 'db',
          path: ['app→cache', 'cache→db'],
          note: `WRITE ${op.key}=${op.val}: same call writes through to the DB before returning. Cache and DB are always in sync — writes pay full DB latency.`,
        }));
      } else {
        // Write-back: write cache only, mark dirty; flush to DB happens async.
        cache[op.key] = op.val;
        if (!dirty.includes(op.key)) dirty.push(op.key);
        frames.push(snap({
          phase: 'write-cache', opIdx: i, edge: 'app-cache', edgeDir: 'fwd', landAt: 'cache',
          path: ['app→cache', 'mark dirty'],
          note: `WRITE ${op.key}=${op.val}: write-back updates the cache and returns immediately. ${op.key} is marked DIRTY — the DB is stale for now (fast write, risk on crash).`,
        }));
      }
    }
  });

  // Write-back: an async flush drains dirty entries to the DB at the end.
  if (mode === 'back' && dirty.length > 0) {
    frames.push(snap({
      phase: 'flush-start', edge: 'flush', edgeDir: 'fwd', landAt: 'db',
      path: [`flush ${dirty.join(', ')}`],
      note: `Async FLUSH: a background writer drains dirty keys [${dirty.join(', ')}] to the DB. This batches writes but means recent writes can be lost if the cache dies first.`,
    }));
    [...dirty].forEach((k) => {
      db[k] = cache[k];
    });
    dirty = [];
    frames.push(snap({
      phase: 'flush-done', edge: 'flush', edgeDir: 'fwd', landAt: 'db',
      path: ['flush complete'],
      note: `Flush complete. DB now matches the cache; no dirty entries remain.`,
    }));
  }

  const total = hits + misses;
  const ratio = total ? Math.round((hits / total) * 100) : 0;
  const tail = mode === 'aside'
    ? 'Writes bypass the cache and invalidate — the cache only ever holds read-populated copies.'
    : mode === 'through'
      ? 'Every write hit both cache and DB synchronously — strongest consistency, slowest writes.'
      : 'Writes landed in the cache and flushed to the DB lazily — fastest writes, weakest durability.';
  frames.push(snap({
    phase: 'done',
    note: `Done. ${hits} read hits, ${misses} read misses (ratio ${ratio}%). ${tail}`,
  }));

  return frames;
}

export default function CacheStrategyViz() {
  const [mode, setMode] = useState('aside');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode), [mode]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1200 / speed);

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

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  // SVG geometry
  const W = 940;
  const H = 430;
  const boxW = 188;
  const boxH = 116;
  const boxY = 150;
  const appX = 40;
  const cacheX = (W - boxW) / 2;
  const dbX = W - boxW - 40;
  const cx = (x) => x + boxW / 2;
  const appC = cx(appX);
  const dbC = cx(dbX);

  const total = current.hits + current.misses;
  const ratio = total ? Math.round((current.hits / total) * 100) : 0;
  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const curOp = current.opIdx >= 0 ? OPS[current.opIdx] : null;
  const opText = curOp
    ? (curOp.type === 'R' ? `READ ${curOp.key}` : `WRITE ${curOp.key}=${curOp.val}`)
    : (current.phase.startsWith('flush') ? 'ASYNC FLUSH' : '—');

  // Edge metadata: which box pair an edge connects, its label, vertical offset.
  const edgeIsBack = current.edgeDir === 'back';
  const appCacheActive = current.edge === 'app-cache';
  const cacheDbActive = current.edge === 'cache-db';
  const appDbActive = current.edge === 'app-db';
  const flushActive = current.edge === 'flush';

  const arrowColor = (active, type) => {
    if (!active) return 'var(--border)';
    if (type === 'hit') return 'var(--easy)';
    if (type === 'miss') return 'var(--hard)';
    return 'var(--accent)';
  };

  const readResult = current.result; // HIT | MISS | null
  const appCacheType = appCacheActive
    ? (readResult === 'HIT' ? 'hit' : readResult === 'MISS' ? 'miss' : 'op')
    : 'op';
  const cacheDbType = cacheDbActive
    ? (readResult === 'MISS' ? 'miss' : 'op')
    : 'op';

  const boxLit = (which) => {
    if (current.landAt === which) return true;
    return false;
  };

  return (
    <div className="csv">
      <div className="csv-head">
        <h3 className="csv-title">Cache strategies — aside vs write-through vs write-back</h3>
        <p className="csv-sub">
          The same read/write workload runs through three caching strategies. Step it to watch where each
          request flows — cache hit or miss, which box the data lands in, and when the database is touched.
        </p>
      </div>

      <div className="csv-controls">
        <div className="csv-modes" role="tablist" aria-label="Cache strategy">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`csv-mode ${mode === m.key ? 'is-on' : ''}`}
              onClick={() => switchMode(m.key)}
              aria-pressed={mode === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="csv-speed">
          <span className="csv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="csv-speed-range"
            aria-label="Playback speed"
          />
          <span className="csv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="csv-spacer" aria-hidden="true" />

        <div className="csv-buttons">
          <button
            type="button"
            className="csv-btn csv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="csv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="csv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="csv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="csv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="csv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="csv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="csv-arrow-border" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border)" />
            </marker>
            <marker id="csv-arrow-accent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="csv-arrow-hit" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--easy)" />
            </marker>
            <marker id="csv-arrow-miss" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hard)" />
            </marker>
          </defs>

          {/* op banner */}
          <text x={W / 2} y={40} className="csv-op-banner" textAnchor="middle">
            {opText}
          </text>

          {/* ---- App <-> Cache edge (upper line) ---- */}
          {(() => {
            const y = boxY + 42;
            const x1 = appX + boxW;
            const x2 = cacheX;
            const color = arrowColor(appCacheActive, appCacheType);
            const marker = !appCacheActive
              ? 'csv-arrow-border'
              : appCacheType === 'hit' ? 'csv-arrow-hit'
                : appCacheType === 'miss' ? 'csv-arrow-miss' : 'csv-arrow-accent';
            const reverse = appCacheActive && edgeIsBack;
            return (
              <g>
                <line
                  className={`csv-edge ${appCacheActive ? 'is-active' : ''}`}
                  x1={reverse ? x2 : x1}
                  y1={y}
                  x2={reverse ? x1 : x2}
                  y2={y}
                  stroke={color}
                  markerEnd={`url(#${marker})`}
                />
                <text x={(x1 + x2) / 2} y={y - 12} className="csv-edge-label" textAnchor="middle">
                  app · cache
                </text>
                {appCacheActive && readResult && (
                  <text
                    x={(x1 + x2) / 2}
                    y={y + 24}
                    className={`csv-edge-verdict ${readResult === 'HIT' ? 'is-hit' : 'is-miss'}`}
                    textAnchor="middle"
                  >
                    {readResult}
                  </text>
                )}
              </g>
            );
          })()}

          {/* ---- Cache <-> DB edge (upper line) ---- */}
          {(() => {
            const y = boxY + 42;
            const x1 = cacheX + boxW;
            const x2 = dbX;
            const color = arrowColor(cacheDbActive, cacheDbType);
            const marker = !cacheDbActive
              ? 'csv-arrow-border'
              : cacheDbType === 'miss' ? 'csv-arrow-miss' : 'csv-arrow-accent';
            const reverse = cacheDbActive && edgeIsBack;
            return (
              <g>
                <line
                  className={`csv-edge ${cacheDbActive ? 'is-active' : ''}`}
                  x1={reverse ? x2 : x1}
                  y1={y}
                  x2={reverse ? x1 : x2}
                  y2={y}
                  stroke={color}
                  markerEnd={`url(#${marker})`}
                />
                <text x={(x1 + x2) / 2} y={y - 12} className="csv-edge-label" textAnchor="middle">
                  cache · db
                </text>
              </g>
            );
          })()}

          {/* ---- App -> DB edge (cache-aside write / lower curved line) ---- */}
          {(() => {
            const yBox = boxY + boxH;
            const dipY = yBox + 56;
            const x1 = appC;
            const x2 = dbC;
            const color = appDbActive ? 'var(--accent)' : 'var(--border)';
            const marker = appDbActive ? 'csv-arrow-accent' : 'csv-arrow-border';
            return (
              <g>
                <path
                  className={`csv-edge ${appDbActive ? 'is-active' : ''}`}
                  d={`M ${x1} ${yBox} C ${x1} ${dipY}, ${x2} ${dipY}, ${x2} ${yBox}`}
                  fill="none"
                  stroke={color}
                  strokeDasharray="6 5"
                  markerEnd={appDbActive ? `url(#${marker})` : undefined}
                />
                <text x={(x1 + x2) / 2} y={dipY + 4} className="csv-edge-label" textAnchor="middle">
                  app · db (direct write)
                </text>
              </g>
            );
          })()}

          {/* ---- async flush badge (write-back) ---- */}
          {flushActive && (
            <g>
              <line
                className="csv-edge is-active"
                x1={cacheX + boxW}
                y1={boxY + 78}
                x2={dbX}
                y2={boxY + 78}
                stroke="var(--hue-mint)"
                strokeDasharray="3 4"
                markerEnd="url(#csv-arrow-accent)"
              />
              <text x={(cacheX + boxW + dbX) / 2} y={boxY + 98} className="csv-edge-flush" textAnchor="middle">
                async flush
              </text>
            </g>
          )}

          {/* ---- boxes ---- */}
          {[
            { x: appX, title: 'App', sub: 'client', store: null, lit: false },
            { x: cacheX, title: 'Cache', sub: 'hot, in-memory', store: current.cache, lit: boxLit('cache') },
            { x: dbX, title: 'Database', sub: 'source of truth', store: current.db, lit: boxLit('db') },
          ].map((b) => (
            <g key={b.title}>
              <rect
                className={`csv-box ${b.lit ? 'is-lit' : ''}`}
                x={b.x}
                y={boxY}
                width={boxW}
                height={boxH}
                rx={12}
              />
              <text x={b.x + boxW / 2} y={boxY + 28} className="csv-box-title" textAnchor="middle">{b.title}</text>
              <text x={b.x + boxW / 2} y={boxY + 46} className="csv-box-sub" textAnchor="middle">{b.sub}</text>
              {b.store !== null && (
                <>
                  <line
                    x1={b.x + 16}
                    y1={boxY + 58}
                    x2={b.x + boxW - 16}
                    y2={boxY + 58}
                    className="csv-box-rule"
                  />
                  <text x={b.x + boxW / 2} y={boxY + 84} className="csv-box-store" textAnchor="middle">
                    {fmtStore(b.store)}
                  </text>
                  {b.title === 'Cache' && current.dirty.length > 0 && (
                    <text x={b.x + boxW / 2} y={boxY + 104} className="csv-box-dirty" textAnchor="middle">
                      dirty: {current.dirty.join(', ')}
                    </text>
                  )}
                </>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="csv-metrics">
        <div className="csv-metric">
          <span className="csv-metric-label">strategy</span>
          <span className="csv-metric-value">{MODES.find((m) => m.key === mode).label}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">current op</span>
          <span className="csv-metric-value">{opText}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">result</span>
          <span className={`csv-metric-value ${current.result === 'HIT' ? 'is-hit' : current.result === 'MISS' ? 'is-miss' : ''}`}>
            {current.result || '—'}
          </span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">read hits</span>
          <span className="csv-metric-value is-hit">{current.hits}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">read misses</span>
          <span className="csv-metric-value is-miss">{current.misses}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">hit ratio</span>
          <span className="csv-metric-value">{ratio}%</span>
        </div>
        <div className="csv-metric csv-metric-wide">
          <span className="csv-metric-label">cache</span>
          <span className="csv-metric-value csv-store-val">{fmtStore(current.cache)}</span>
        </div>
        <div className="csv-metric csv-metric-wide">
          <span className="csv-metric-label">database</span>
          <span className="csv-metric-value csv-store-val">{fmtStore(current.db)}</span>
        </div>
        <div className="csv-metric csv-metric-wide">
          <span className="csv-metric-label">last op path</span>
          <span className="csv-metric-value csv-path-val">
            {current.path.length ? current.path.join('  ›  ') : '—'}
          </span>
        </div>
      </div>

      <div className="csv-narration">
        <span className="csv-narration-label">trace</span>
        <span className="csv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
