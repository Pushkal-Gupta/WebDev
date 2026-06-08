import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, RotateCcw, Activity, Trash2 } from 'lucide-react';
import './LRUCacheViz.css';

const INITIAL_CAPACITY = 4;
const INITIAL_ENTRIES = [
  { k: 1, v: 'A' },
  { k: 2, v: 'B' },
  { k: 3, v: 'C' },
  { k: 4, v: 'D' },
];

const STEP_MS = 620;
const LOG_LIMIT = 5;

const NODE_W = 96;
const NODE_H = 60;
const NODE_GAP = 28;
const LIST_PAD_X = 56;
const LIST_Y = 56;
const HEAD_LABEL_Y = 22;
const TAIL_NULL_W = 44;

const MAP_X = 32;
const MAP_Y = 168;
const MAP_ROW_H = 30;
const MAP_KEY_W = 60;
const MAP_PTR_W = 110;

function cloneCache(c) {
  return c.map((e) => ({ ...e }));
}

function makeFrame(cache, opts = {}) {
  return {
    cache: cloneCache(cache),
    activeKey: opts.activeKey ?? null,
    status: opts.status ?? 'idle',
    label: opts.label ?? '',
    incomingKey: opts.incomingKey ?? null,
    incomingValue: opts.incomingValue ?? null,
    movingKey: opts.movingKey ?? null,
    evictKey: opts.evictKey ?? null,
    hit: opts.hit ?? null,
    returnedValue: opts.returnedValue ?? null,
  };
}

function buildGetFrames(cache, key) {
  const frames = [];
  const idx = cache.findIndex((e) => e.k === key);
  frames.push(
    makeFrame(cache, {
      status: 'probe',
      activeKey: key,
      label: `get(${key}): probe hash map for key ${key}`,
    }),
  );

  if (idx === -1) {
    frames.push(
      makeFrame(cache, {
        status: 'miss',
        activeKey: key,
        label: `Miss. Key ${key} not in map. Return -1`,
        hit: false,
        returnedValue: -1,
      }),
    );
    return { frames, finalCache: cloneCache(cache), result: { hit: false, value: -1 } };
  }

  const entry = cache[idx];
  frames.push(
    makeFrame(cache, {
      status: 'found',
      activeKey: key,
      label: `Hit. Map points to node (${entry.k} → ${entry.v}). Value = ${entry.v}`,
      hit: true,
      returnedValue: entry.v,
    }),
  );

  if (idx === 0) {
    frames.push(
      makeFrame(cache, {
        status: 'done',
        activeKey: key,
        label: `Already at head (MRU). No relink needed`,
        hit: true,
        returnedValue: entry.v,
      }),
    );
    return { frames, finalCache: cloneCache(cache), result: { hit: true, value: entry.v } };
  }

  const next = cloneCache(cache);
  const [moved] = next.splice(idx, 1);
  next.unshift(moved);
  frames.push(
    makeFrame(next, {
      status: 'reorder',
      activeKey: key,
      movingKey: key,
      label: `Unlink (${entry.k}) and re-insert at head. It is now most-recently-used`,
      hit: true,
      returnedValue: entry.v,
    }),
  );
  frames.push(
    makeFrame(next, {
      status: 'done',
      activeKey: key,
      label: `Done. Returned ${entry.v}`,
      hit: true,
      returnedValue: entry.v,
    }),
  );
  return { frames, finalCache: next, result: { hit: true, value: entry.v } };
}

function buildPutFrames(cache, capacity, key, value) {
  const frames = [];
  const idx = cache.findIndex((e) => e.k === key);
  frames.push(
    makeFrame(cache, {
      status: 'probe',
      activeKey: key,
      incomingKey: key,
      incomingValue: value,
      label: `put(${key}, ${value}): probe hash map for key ${key}`,
    }),
  );

  if (idx !== -1) {
    // Update path
    const updated = cloneCache(cache);
    updated[idx] = { ...updated[idx], v: value };
    frames.push(
      makeFrame(updated, {
        status: 'update',
        activeKey: key,
        label: `Key ${key} exists. Update value to ${value}`,
        incomingKey: key,
        incomingValue: value,
      }),
    );

    if (idx === 0) {
      frames.push(
        makeFrame(updated, {
          status: 'done',
          activeKey: key,
          label: `Already at head. Update finished`,
        }),
      );
      return { frames, finalCache: updated, result: 'updated' };
    }

    const moved = cloneCache(updated);
    const [m] = moved.splice(idx, 1);
    moved.unshift(m);
    frames.push(
      makeFrame(moved, {
        status: 'reorder',
        activeKey: key,
        movingKey: key,
        label: `Move (${key}) to head`,
      }),
    );
    frames.push(
      makeFrame(moved, {
        status: 'done',
        activeKey: key,
        label: `Done. Key ${key} now MRU with value ${value}`,
      }),
    );
    return { frames, finalCache: moved, result: 'updated' };
  }

  // Insert path
  frames.push(
    makeFrame(cache, {
      status: 'miss',
      activeKey: key,
      incomingKey: key,
      incomingValue: value,
      label: `Miss. Key ${key} is new. Need to insert at head`,
    }),
  );

  let working = cloneCache(cache);
  let evicted = null;
  if (working.length >= capacity) {
    evicted = working[working.length - 1];
    frames.push(
      makeFrame(working, {
        status: 'evict-prepare',
        activeKey: key,
        evictKey: evicted.k,
        incomingKey: key,
        incomingValue: value,
        label: `Cache full (${working.length}/${capacity}). Evict LRU tail (${evicted.k} → ${evicted.v})`,
      }),
    );
    working = working.slice(0, -1);
    frames.push(
      makeFrame(working, {
        status: 'evict-done',
        activeKey: key,
        evictKey: evicted.k,
        incomingKey: key,
        incomingValue: value,
        label: `Removed tail (${evicted.k}) from list and map`,
      }),
    );
  }

  const inserted = [{ k: key, v: value }, ...working];
  frames.push(
    makeFrame(inserted, {
      status: 'insert',
      activeKey: key,
      incomingKey: key,
      incomingValue: value,
      label: `Insert (${key} → ${value}) at head. Size ${inserted.length}/${capacity}`,
    }),
  );
  frames.push(
    makeFrame(inserted, {
      status: 'done',
      activeKey: key,
      label: `Done. ${evicted ? `Evicted ${evicted.k}. ` : ''}Inserted ${key}`,
    }),
  );

  return {
    frames,
    finalCache: inserted,
    result: evicted ? 'inserted-evicted' : 'inserted',
    evicted,
  };
}

function nodeX(slot) {
  return LIST_PAD_X + slot * (NODE_W + NODE_GAP);
}

function svgDims(capacity) {
  const slots = Math.max(capacity, 3);
  const listWidth = LIST_PAD_X + slots * (NODE_W + NODE_GAP) + TAIL_NULL_W + 24;
  const mapWidth = MAP_X + MAP_KEY_W + 30 + MAP_PTR_W + 24;
  const width = Math.max(listWidth, mapWidth, 640);
  const height = MAP_Y + Math.max(capacity, 3) * (MAP_ROW_H + 6) + 28;
  return { width, height };
}

export default function LRUCacheViz() {
  const [capacity, setCapacity] = useState(INITIAL_CAPACITY);
  const [cache, setCache] = useState(() =>
    INITIAL_ENTRIES.slice(0, INITIAL_CAPACITY).map((e) => ({ ...e })),
  );
  const [putKey, setPutKey] = useState('5');
  const [putValue, setPutValue] = useState('E');
  const [getKey, setGetKey] = useState('2');
  const [frames, setFrames] = useState([]);
  const [frameIdx, setFrameIdx] = useState(-1);
  const [pendingCache, setPendingCache] = useState(null);
  const [resultPill, setResultPill] = useState(null);
  const [operation, setOperation] = useState(
    `Pre-loaded ${INITIAL_CAPACITY} entries. Head = MRU, Tail = LRU`,
  );
  const [opLog, setOpLog] = useState([]);
  const [stats, setStats] = useState({ gets: 0, hits: 0, puts: 0, evictions: 0 });
  const playRef = useRef(null);

  const currentFrame =
    frameIdx >= 0 && frameIdx < frames.length ? frames[frameIdx] : null;
  const renderCache = currentFrame ? currentFrame.cache : cache;

  const dims = useMemo(() => svgDims(capacity), [capacity]);

  useEffect(() => {
    if (frameIdx < 0 || frameIdx >= frames.length - 1) return;
    playRef.current = setTimeout(() => setFrameIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [frameIdx, frames]);

  useEffect(() => {
    if (frames.length === 0 || pendingCache === null) return;
    if (frameIdx !== frames.length - 1) return;
    setCache(pendingCache);
    setPendingCache(null);
  }, [frameIdx, frames, pendingCache]);

  const parseIntKey = (raw) => {
    const trimmed = String(raw).trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || Math.abs(n) > 1e6) return null;
    return n;
  };

  const parseValue = (raw) => {
    const trimmed = String(raw).trim();
    if (trimmed.length === 0 || trimmed.length > 6) return null;
    return trimmed;
  };

  const pushLog = (entry) => {
    setOpLog((prev) => [entry, ...prev].slice(0, LOG_LIMIT));
  };

  const startAnimation = (newFrames, finalCache, pill, opLabel) => {
    setFrames(newFrames);
    setFrameIdx(0);
    setPendingCache(finalCache);
    setResultPill(pill);
    setOperation(opLabel);
  };

  const onPut = useCallback(() => {
    const k = parseIntKey(putKey);
    const v = parseValue(putValue);
    if (k === null) {
      setOperation('put: enter an integer key');
      setResultPill(null);
      return;
    }
    if (v === null) {
      setOperation('put: enter a non-empty value (max 6 chars)');
      setResultPill(null);
      return;
    }
    const { frames: f, finalCache, result, evicted } = buildPutFrames(cache, capacity, k, v);
    const pill =
      result === 'updated'
        ? { text: 'Updated', kind: 'warn' }
        : result === 'inserted-evicted'
          ? { text: 'Inserted + Evicted', kind: 'ok' }
          : { text: 'Inserted', kind: 'ok' };
    startAnimation(f, finalCache, pill, `put(${k}, ${v})`);
    setStats((s) => ({
      ...s,
      puts: s.puts + 1,
      evictions: s.evictions + (evicted ? 1 : 0),
    }));
    pushLog({
      kind: 'put',
      label: `put(${k}, ${v})`,
      result:
        result === 'updated'
          ? 'updated'
          : evicted
            ? `evicted ${evicted.k}`
            : 'inserted',
    });
  }, [putKey, putValue, cache, capacity]);

  const onGet = useCallback(() => {
    const k = parseIntKey(getKey);
    if (k === null) {
      setOperation('get: enter an integer key');
      setResultPill(null);
      return;
    }
    const { frames: f, finalCache, result } = buildGetFrames(cache, k);
    const pill = result.hit
      ? { text: `Hit → ${result.value}`, kind: 'ok' }
      : { text: 'Miss → -1', kind: 'fail' };
    startAnimation(f, finalCache, pill, `get(${k})`);
    setStats((s) => ({
      ...s,
      gets: s.gets + 1,
      hits: s.hits + (result.hit ? 1 : 0),
    }));
    pushLog({
      kind: 'get',
      label: `get(${k})`,
      result: result.hit ? `hit → ${result.value}` : 'miss → -1',
    });
  }, [getKey, cache]);

  const onReset = useCallback(() => {
    const fresh = INITIAL_ENTRIES.slice(0, capacity).map((e) => ({ ...e }));
    setCache(fresh);
    setFrames([]);
    setFrameIdx(-1);
    setPendingCache(null);
    setResultPill(null);
    setOpLog([]);
    setStats({ gets: 0, hits: 0, puts: 0, evictions: 0 });
    setOperation(`Reset. Pre-loaded ${fresh.length} entries`);
  }, [capacity]);

  const onClear = useCallback(() => {
    setCache([]);
    setFrames([]);
    setFrameIdx(-1);
    setPendingCache(null);
    setResultPill(null);
    setOperation('Cache cleared');
  }, []);

  const onCapacityChange = (e) => {
    const c = Number(e.target.value);
    setCapacity(c);
    setFrames([]);
    setFrameIdx(-1);
    setPendingCache(null);
    setResultPill(null);
    setCache((prev) => prev.slice(0, c));
    setOperation(`Capacity set to ${c}`);
  };

  const opLabel = currentFrame ? currentFrame.label : operation;
  const activeKey = currentFrame ? currentFrame.activeKey : null;
  const status = currentFrame ? currentFrame.status : null;
  const evictKey = currentFrame ? currentFrame.evictKey : null;
  const movingKey = currentFrame ? currentFrame.movingKey : null;
  const incomingKey = currentFrame ? currentFrame.incomingKey : null;
  const incomingValue = currentFrame ? currentFrame.incomingValue : null;
  const showIncomingFloat =
    status === 'probe' || status === 'miss' || status === 'evict-prepare' ||
    status === 'evict-done';

  const hitRate = stats.gets === 0 ? 0 : (stats.hits / stats.gets) * 100;

  return (
    <div className="lru-root">
      <div className="lru-head">
        <div className="lru-title-block">
          <h3 className="lru-title">LRU cache: doubly-linked list + hash map</h3>
          <p className="lru-sub">
            The map gives O(1) lookup. The list tracks recency — head is most-recently-used, tail
            is least-recently-used. Every get moves the node to head; every put either updates and
            promotes, or inserts at head and evicts the tail if the cache is full.
          </p>
        </div>
      </div>

      <div className="lru-controls">
        <div className="lru-control-group">
          <label className="lru-input-label" htmlFor="lru-cap">
            Capacity
          </label>
          <select
            id="lru-cap"
            className="lru-select"
            value={capacity}
            onChange={onCapacityChange}
          >
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>

        <div className="lru-control-group">
          <label className="lru-input-label" htmlFor="lru-put-k">
            Put
          </label>
          <input
            id="lru-put-k"
            type="text"
            value={putKey}
            onChange={(e) => setPutKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onPut();
            }}
            className="lru-input lru-input-narrow"
            placeholder="key"
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
          <input
            id="lru-put-v"
            type="text"
            value={putValue}
            onChange={(e) => setPutValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onPut();
            }}
            className="lru-input lru-input-narrow"
            placeholder="val"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="lru-btn lru-btn-primary" onClick={onPut}>
            <Plus size={14} /> Put
          </button>
        </div>

        <div className="lru-control-group">
          <label className="lru-input-label" htmlFor="lru-get-k">
            Get
          </label>
          <input
            id="lru-get-k"
            type="text"
            value={getKey}
            onChange={(e) => setGetKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onGet();
            }}
            className="lru-input lru-input-narrow"
            placeholder="key"
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="lru-btn lru-btn-accent" onClick={onGet}>
            <Search size={14} /> Get
          </button>
        </div>

        {resultPill && (
          <span className={`lru-result-pill lru-result-${resultPill.kind}`}>
            {resultPill.text}
          </span>
        )}

        <div className="lru-control-spacer" />

        <button type="button" className="lru-btn" onClick={onClear}>
          <Trash2 size={14} /> Clear
        </button>
        <button type="button" className="lru-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="lru-stage">
        <svg
          className="lru-svg"
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          role="img"
          aria-label="LRU cache visualization"
        >
          {/* Section labels */}
          <text x={LIST_PAD_X} y={HEAD_LABEL_Y} className="lru-section-label">
            Doubly-linked list (recency)
          </text>
          <text x={MAP_X} y={MAP_Y - 14} className="lru-section-label">
            Hash map (key → node)
          </text>

          {/* Head / Tail markers on list */}
          {renderCache.length > 0 && (
            <>
              <text
                x={nodeX(0) + NODE_W / 2}
                y={LIST_Y - 8}
                textAnchor="middle"
                className="lru-end-label lru-end-head"
              >
                HEAD · MRU
              </text>
              <text
                x={nodeX(renderCache.length - 1) + NODE_W / 2}
                y={LIST_Y - 8}
                textAnchor="middle"
                className="lru-end-label lru-end-tail"
              >
                TAIL · LRU
              </text>
            </>
          )}

          {/* List head sentinel arrow */}
          {renderCache.length === 0 && (
            <g>
              <rect
                x={LIST_PAD_X}
                y={LIST_Y}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                className="lru-empty-box"
              />
              <text
                x={LIST_PAD_X + NODE_W / 2}
                y={LIST_Y + NODE_H / 2 + 5}
                textAnchor="middle"
                className="lru-empty-label"
              >
                empty
              </text>
            </g>
          )}

          {/* List head pointer */}
          {renderCache.length > 0 && (
            <>
              <text
                x={LIST_PAD_X - 36}
                y={LIST_Y + NODE_H / 2 + 5}
                className="lru-anchor-label"
              >
                head
              </text>
              <line
                x1={LIST_PAD_X - 14}
                y1={LIST_Y + NODE_H / 2}
                x2={LIST_PAD_X}
                y2={LIST_Y + NODE_H / 2}
                className="lru-edge lru-edge-anchor"
              />
            </>
          )}

          {/* List nodes */}
          {renderCache.map((entry, slot) => {
            const x = nodeX(slot);
            const y = LIST_Y;
            const isActive = entry.k === activeKey;
            const isEvict = entry.k === evictKey;
            const isMoving = entry.k === movingKey;
            const isHit = isActive && status === 'found';
            const isInsert = isActive && status === 'insert';
            const isUpdate = isActive && status === 'update';
            const isProbe = isActive && status === 'probe';
            const isReorder = isMoving && status === 'reorder';
            const isMiss = isActive && status === 'miss';
            const cls = [
              'lru-node',
              isHit ? 'lru-node-hit' : '',
              isInsert ? 'lru-node-insert' : '',
              isUpdate ? 'lru-node-update' : '',
              isProbe ? 'lru-node-probe' : '',
              isReorder ? 'lru-node-reorder' : '',
              isMiss ? 'lru-node-miss' : '',
              isEvict ? 'lru-node-evict' : '',
            ]
              .filter(Boolean)
              .join(' ');

            const isLast = slot === renderCache.length - 1;
            const isFirst = slot === 0;

            return (
              <g key={`node-${entry.k}`} className={cls}>
                {/* Backward arrow (prev) — sits above forward arrow */}
                {!isFirst && (
                  <>
                    <line
                      x1={x}
                      y1={y + NODE_H / 2 - 8}
                      x2={nodeX(slot - 1) + NODE_W}
                      y2={y + NODE_H / 2 - 8}
                      className="lru-edge lru-edge-prev"
                    />
                    <polygon
                      points={`${nodeX(slot - 1) + NODE_W + 6},${y + NODE_H / 2 - 12} ${nodeX(slot - 1) + NODE_W},${y + NODE_H / 2 - 8} ${nodeX(slot - 1) + NODE_W + 6},${y + NODE_H / 2 - 4}`}
                      className="lru-arrow lru-arrow-prev"
                    />
                  </>
                )}

                {/* Forward arrow (next) */}
                {!isLast && (
                  <>
                    <line
                      x1={x + NODE_W}
                      y1={y + NODE_H / 2 + 8}
                      x2={nodeX(slot + 1)}
                      y2={y + NODE_H / 2 + 8}
                      className="lru-edge lru-edge-next"
                    />
                    <polygon
                      points={`${nodeX(slot + 1) - 6},${y + NODE_H / 2 + 4} ${nodeX(slot + 1)},${y + NODE_H / 2 + 8} ${nodeX(slot + 1) - 6},${y + NODE_H / 2 + 12}`}
                      className="lru-arrow lru-arrow-next"
                    />
                  </>
                )}

                {isLast && (
                  <text
                    x={x + NODE_W + 6}
                    y={y + NODE_H / 2 + 12}
                    className="lru-tail-null"
                  >
                    null
                  </text>
                )}

                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  className="lru-node-box"
                />
                <line
                  x1={x + 10}
                  y1={y + NODE_H / 2}
                  x2={x + NODE_W - 10}
                  y2={y + NODE_H / 2}
                  className="lru-node-divider"
                />
                <text
                  x={x + NODE_W / 2}
                  y={y + NODE_H / 2 - 6}
                  textAnchor="middle"
                  className="lru-node-key"
                >
                  key {entry.k}
                </text>
                <text
                  x={x + NODE_W / 2}
                  y={y + NODE_H / 2 + 16}
                  textAnchor="middle"
                  className="lru-node-val"
                >
                  val {entry.v}
                </text>
              </g>
            );
          })}

          {/* Incoming floating insert preview */}
          {showIncomingFloat && incomingKey !== null && (
            <g className="lru-incoming">
              <rect
                x={LIST_PAD_X - 4}
                y={LIST_Y - 44}
                width={NODE_W + 8}
                height={28}
                rx={6}
                className="lru-incoming-box"
              />
              <text
                x={LIST_PAD_X + NODE_W / 2}
                y={LIST_Y - 26}
                textAnchor="middle"
                className="lru-incoming-label"
              >
                incoming {incomingKey} → {incomingValue ?? '?'}
              </text>
            </g>
          )}

          {/* Hash map rows */}
          {renderCache.length === 0 && (
            <text
              x={MAP_X}
              y={MAP_Y + 18}
              className="lru-empty-label"
            >
              empty
            </text>
          )}
          {renderCache.map((entry, slot) => {
            const y = MAP_Y + slot * (MAP_ROW_H + 6);
            const isActive = entry.k === activeKey;
            const isEvict = entry.k === evictKey;
            const cls = [
              'lru-map-row',
              isActive ? 'lru-map-row-active' : '',
              isEvict ? 'lru-map-row-evict' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const targetX = nodeX(slot);
            const targetY = LIST_Y + NODE_H / 2;
            const ptrStartX = MAP_X + MAP_KEY_W + 4 + MAP_PTR_W;
            const ptrStartY = y + MAP_ROW_H / 2;

            return (
              <g key={`map-${entry.k}`} className={cls}>
                <rect
                  x={MAP_X}
                  y={y}
                  width={MAP_KEY_W}
                  height={MAP_ROW_H}
                  rx={6}
                  className="lru-map-key-box"
                />
                <text
                  x={MAP_X + MAP_KEY_W / 2}
                  y={y + MAP_ROW_H / 2 + 4}
                  textAnchor="middle"
                  className="lru-map-key-text"
                >
                  {entry.k}
                </text>
                <rect
                  x={MAP_X + MAP_KEY_W + 4}
                  y={y}
                  width={MAP_PTR_W}
                  height={MAP_ROW_H}
                  rx={6}
                  className="lru-map-ptr-box"
                />
                <text
                  x={MAP_X + MAP_KEY_W + 12}
                  y={y + MAP_ROW_H / 2 + 4}
                  className="lru-map-ptr-text"
                >
                  node*({entry.k},{entry.v})
                </text>
                {/* pointer line to the corresponding list node */}
                <path
                  d={`M ${ptrStartX} ${ptrStartY} C ${(ptrStartX + targetX) / 2} ${ptrStartY}, ${(ptrStartX + targetX) / 2} ${targetY + NODE_H / 2 + 18}, ${targetX + NODE_W / 2} ${targetY + NODE_H / 2 + 2}`}
                  className="lru-map-link"
                  fill="none"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="lru-meta-grid">
        <div className="lru-meta-card lru-meta-stats">
          <div className="lru-meta-card-title">
            <Activity size={14} /> Stats
          </div>
          <div className="lru-stat-row">
            <span className="lru-stat-label">Hit rate</span>
            <span className="lru-stat-value">
              {stats.gets === 0 ? '—' : `${hitRate.toFixed(0)}%`}
              <span className="lru-stat-sub">
                ({stats.hits}/{stats.gets})
              </span>
            </span>
          </div>
          <div className="lru-stat-row">
            <span className="lru-stat-label">Gets</span>
            <span className="lru-stat-value">{stats.gets}</span>
          </div>
          <div className="lru-stat-row">
            <span className="lru-stat-label">Puts</span>
            <span className="lru-stat-value">{stats.puts}</span>
          </div>
          <div className="lru-stat-row">
            <span className="lru-stat-label">Evictions</span>
            <span className="lru-stat-value">{stats.evictions}</span>
          </div>
          <div className="lru-stat-row">
            <span className="lru-stat-label">Size</span>
            <span className="lru-stat-value">
              {renderCache.length}/{capacity}
            </span>
          </div>
        </div>

        <div className="lru-meta-card lru-meta-log">
          <div className="lru-meta-card-title">Op log (last {LOG_LIMIT})</div>
          {opLog.length === 0 && (
            <div className="lru-log-empty">No operations yet</div>
          )}
          {opLog.length > 0 && (
            <ol className="lru-log-list">
              {opLog.map((entry, i) => (
                <li key={`${entry.label}-${i}`} className={`lru-log-item lru-log-${entry.kind}`}>
                  <span className="lru-log-call">{entry.label}</span>
                  <span className="lru-log-result">→ {entry.result}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="lru-meta-card lru-meta-op">
          <div className="lru-meta-card-title">Current step</div>
          <div className="lru-op-text">{opLabel}</div>
        </div>
      </div>
    </div>
  );
}
