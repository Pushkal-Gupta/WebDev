import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Trash2, RotateCcw } from 'lucide-react';
import './HashTableViz.css';

const BUCKETS = 8;
const INITIAL_KEYS = [11, 19, 3, 27, 8];
const STEP_MS = 520;

const BUCKET_H = 46;
const BUCKET_W = 92;
const PAD_X = 24;
const PAD_Y = 28;
const NODE_W = 56;
const NODE_H = 34;
const NODE_GAP = 18;
const CHAIN_LEFT = PAD_X + BUCKET_W + 32;

const HASHES = {
  modulo: {
    id: 'modulo',
    label: 'Modulo: key % 8',
    formula: 'key % 8',
    fn: (key) => ((key % BUCKETS) + BUCKETS) % BUCKETS,
  },
  multiplicative: {
    id: 'multiplicative',
    label: 'Multiplicative: (key * 2654435769) >>> 28 & 7',
    formula: '(key * 2654435769) >>> 28 & 7',
    // Knuth multiplicative hash; >>> coerces to uint32, & 7 picks 3 bits.
    fn: (key) => ((Math.imul(key, 0x9e3779b9) >>> 28) & 7),
  },
  bad: {
    id: 'bad',
    label: 'Bad: always returns 3',
    formula: 'return 3',
    fn: () => 3,
  },
};

function emptyTable() {
  return Array.from({ length: BUCKETS }, () => []);
}

function buildTable(keys, hashFn) {
  const t = emptyTable();
  for (const k of keys) {
    const h = hashFn(k);
    if (!t[h].includes(k)) t[h].push(k);
  }
  return t;
}

function tableStats(table) {
  let total = 0;
  let max = 0;
  let nonEmpty = 0;
  for (const chain of table) {
    total += chain.length;
    if (chain.length > 0) nonEmpty += 1;
    if (chain.length > max) max = chain.length;
  }
  const avg = nonEmpty === 0 ? 0 : total / nonEmpty;
  return { total, max, avg, load: total / BUCKETS };
}

// Build animation frames for an operation.
// Each frame: { table, bucket, index, status, label, highlightKey }
//   status: 'hash' | 'walk' | 'found' | 'missing' | 'insert' | 'duplicate' | 'remove' | 'done'
function buildInsertFrames(table, hashFn, key) {
  const frames = [];
  const bucket = hashFn(key);
  frames.push({
    table: cloneTable(table),
    bucket,
    index: -1,
    status: 'hash',
    label: `Hash ${key} → bucket ${bucket}`,
    highlightKey: key,
  });
  const chain = table[bucket];
  for (let i = 0; i < chain.length; i++) {
    frames.push({
      table: cloneTable(table),
      bucket,
      index: i,
      status: chain[i] === key ? 'duplicate' : 'walk',
      label:
        chain[i] === key
          ? `Bucket ${bucket}[${i}] already holds ${key}. Skip insert`
          : `Walk bucket ${bucket}[${i}] = ${chain[i]}, not ${key}`,
      highlightKey: key,
    });
    if (chain[i] === key) {
      return { frames, finalTable: cloneTable(table), result: 'duplicate' };
    }
  }
  const next = cloneTable(table);
  next[bucket] = [...next[bucket], key];
  frames.push({
    table: next,
    bucket,
    index: next[bucket].length - 1,
    status: 'insert',
    label: `Append ${key} to tail of bucket ${bucket} (chain length ${next[bucket].length})`,
    highlightKey: key,
  });
  return { frames, finalTable: next, result: 'inserted' };
}

function buildSearchFrames(table, hashFn, key) {
  const frames = [];
  const bucket = hashFn(key);
  frames.push({
    table: cloneTable(table),
    bucket,
    index: -1,
    status: 'hash',
    label: `Hash ${key} → bucket ${bucket}`,
    highlightKey: key,
  });
  const chain = table[bucket];
  for (let i = 0; i < chain.length; i++) {
    frames.push({
      table: cloneTable(table),
      bucket,
      index: i,
      status: chain[i] === key ? 'found' : 'walk',
      label:
        chain[i] === key
          ? `Found ${key} at bucket ${bucket}[${i}]`
          : `Walk bucket ${bucket}[${i}] = ${chain[i]}, not ${key}`,
      highlightKey: key,
    });
    if (chain[i] === key) {
      return { frames, finalTable: cloneTable(table), result: 'found' };
    }
  }
  frames.push({
    table: cloneTable(table),
    bucket,
    index: -1,
    status: 'missing',
    label: `Walked entire bucket ${bucket}. ${key} not in table`,
    highlightKey: key,
  });
  return { frames, finalTable: cloneTable(table), result: 'missing' };
}

function buildDeleteFrames(table, hashFn, key) {
  const frames = [];
  const bucket = hashFn(key);
  frames.push({
    table: cloneTable(table),
    bucket,
    index: -1,
    status: 'hash',
    label: `Hash ${key} → bucket ${bucket}`,
    highlightKey: key,
  });
  const chain = table[bucket];
  for (let i = 0; i < chain.length; i++) {
    frames.push({
      table: cloneTable(table),
      bucket,
      index: i,
      status: chain[i] === key ? 'remove' : 'walk',
      label:
        chain[i] === key
          ? `Match at bucket ${bucket}[${i}]. Splice out ${key}`
          : `Walk bucket ${bucket}[${i}] = ${chain[i]}, not ${key}`,
      highlightKey: key,
    });
    if (chain[i] === key) {
      const next = cloneTable(table);
      next[bucket] = next[bucket].filter((_, j) => j !== i);
      frames.push({
        table: next,
        bucket,
        index: -1,
        status: 'done',
        label: `Removed ${key}. Bucket ${bucket} now holds ${next[bucket].length} item(s)`,
        highlightKey: key,
      });
      return { frames, finalTable: next, result: 'removed' };
    }
  }
  frames.push({
    table: cloneTable(table),
    bucket,
    index: -1,
    status: 'missing',
    label: `Walked entire bucket ${bucket}. ${key} not present — nothing to delete`,
    highlightKey: key,
  });
  return { frames, finalTable: cloneTable(table), result: 'missing' };
}

function cloneTable(t) {
  return t.map((c) => [...c]);
}

function svgDims(table) {
  let maxChain = 0;
  for (const c of table) if (c.length > maxChain) maxChain = c.length;
  const chainCells = Math.max(maxChain, 4); // reserve some headroom
  const width = CHAIN_LEFT + chainCells * (NODE_W + NODE_GAP) + PAD_X;
  const height = PAD_Y * 2 + BUCKETS * BUCKET_H + (BUCKETS - 1) * 8;
  return { width, height };
}

function bucketY(i) {
  return PAD_Y + i * (BUCKET_H + 8);
}

function nodeX(slot) {
  return CHAIN_LEFT + slot * (NODE_W + NODE_GAP);
}

export default function HashTableViz() {
  const [hashId, setHashId] = useState('modulo');
  const [keys, setKeys] = useState(() => [...INITIAL_KEYS]);
  const [insertInput, setInsertInput] = useState('15');
  const [searchInput, setSearchInput] = useState('19');
  const [deleteInput, setDeleteInput] = useState('3');
  const [frames, setFrames] = useState([]);
  const [frameIdx, setFrameIdx] = useState(-1);
  const [, setPendingTable] = useState(null);
  const [resultPill, setResultPill] = useState(null);
  const [operation, setOperation] = useState('Pre-loaded with 5 keys');
  const playRef = useRef(null);

  const hash = HASHES[hashId];

  // Live table derived from current keys + hash choice. Whenever the user changes the
  // hash function, every key gets re-hashed automatically.
  const table = useMemo(() => buildTable(keys, hash.fn), [keys, hash]);

  // While an animation is mid-flight we render the frame's table; otherwise we render
  // the live table.
  const currentFrame =
    frameIdx >= 0 && frameIdx < frames.length ? frames[frameIdx] : null;
  const renderTable = currentFrame ? currentFrame.table : table;

  const stats = useMemo(() => tableStats(renderTable), [renderTable]);
  const dims = useMemo(() => svgDims(renderTable), [renderTable]);

  // Commit the pending table once the animation reaches its final frame.
  const commitPendingTable = useCallback(() => {
    setPendingTable((current) => {
      if (current) setKeys(current.flat());
      return null;
    });
  }, []);

  // Animation loop.
  useEffect(() => {
    if (frameIdx < 0 || frameIdx >= frames.length - 1) return;
    playRef.current = setTimeout(() => {
      setFrameIdx((i) => {
        const next = i + 1;
        if (next === frames.length - 1) commitPendingTable();
        return next;
      });
    }, STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [frameIdx, frames, commitPendingTable]);

  const parseKey = (raw) => {
    const trimmed = String(raw).trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || Math.abs(n) > 1e9) return null;
    return n;
  };

  const startAnimation = (frames, finalTable, result, key, opLabel) => {
    setFrames(frames);
    setFrameIdx(0);
    setPendingTable(finalTable);
    setResultPill(result);
    setOperation(opLabel);
    if (frames.length <= 1 && finalTable) {
      setPendingTable(null);
      setKeys(finalTable.flat());
    }
  };

  const onInsert = useCallback(() => {
    const k = parseKey(insertInput);
    if (k === null) {
      setOperation('Insert: enter an integer key');
      setResultPill(null);
      return;
    }
    const { frames, finalTable, result } = buildInsertFrames(table, hash.fn, k);
    startAnimation(
      frames,
      finalTable,
      result === 'inserted' ? { text: 'Inserted', kind: 'ok' } : { text: 'Duplicate', kind: 'warn' },
      k,
      `Insert ${k}`,
    );
  }, [insertInput, table, hash]);

  const onSearch = useCallback(() => {
    const k = parseKey(searchInput);
    if (k === null) {
      setOperation('Search: enter an integer key');
      setResultPill(null);
      return;
    }
    const { frames, finalTable, result } = buildSearchFrames(table, hash.fn, k);
    startAnimation(
      frames,
      finalTable,
      result === 'found' ? { text: 'Found', kind: 'ok' } : { text: 'Not found', kind: 'fail' },
      k,
      `Search ${k}`,
    );
  }, [searchInput, table, hash]);

  const onDelete = useCallback(() => {
    const k = parseKey(deleteInput);
    if (k === null) {
      setOperation('Delete: enter an integer key');
      setResultPill(null);
      return;
    }
    const { frames, finalTable, result } = buildDeleteFrames(table, hash.fn, k);
    startAnimation(
      frames,
      finalTable,
      result === 'removed'
        ? { text: 'Removed', kind: 'ok' }
        : { text: 'Not found', kind: 'fail' },
      k,
      `Delete ${k}`,
    );
  }, [deleteInput, table, hash]);

  const onReset = useCallback(() => {
    setKeys([]);
    setFrames([]);
    setFrameIdx(-1);
    setPendingTable(null);
    setResultPill(null);
    setOperation('Table cleared');
  }, []);

  const onLoadDefaults = useCallback(() => {
    setKeys([...INITIAL_KEYS]);
    setFrames([]);
    setFrameIdx(-1);
    setPendingTable(null);
    setResultPill(null);
    setOperation('Reloaded default keys');
  }, []);

  const onHashChange = (e) => {
    setHashId(e.target.value);
    setFrames([]);
    setFrameIdx(-1);
    setPendingTable(null);
    setResultPill(null);
    setOperation(`Switched hash: ${HASHES[e.target.value].label}`);
  };

  const opLabel = currentFrame ? currentFrame.label : operation;
  const activeBucket = currentFrame ? currentFrame.bucket : -1;
  const activeIndex = currentFrame ? currentFrame.index : -1;
  const activeStatus = currentFrame ? currentFrame.status : null;
  const highlightKey = currentFrame ? currentFrame.highlightKey : null;

  return (
    <div className="hv-root">
      <div className="hv-head">
        <div className="hv-title-block">
          <h3 className="hv-title">Hash table with separate chaining</h3>
          <p className="hv-sub">
            Pick a hash function, insert keys, then watch the bucket chain walk during search and
            delete. The bad hash dumps every key into bucket 3 to expose worst-case behavior.
          </p>
        </div>
      </div>

      <div className="hv-controls">
        <div className="hv-control-group">
          <label className="hv-input-label" htmlFor="hv-hash">
            Hash
          </label>
          <select id="hv-hash" className="hv-select" value={hashId} onChange={onHashChange}>
            {Object.values(HASHES).map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hv-control-group">
          <label className="hv-input-label" htmlFor="hv-insert">
            Insert
          </label>
          <input
            id="hv-insert"
            type="text"
            value={insertInput}
            onChange={(e) => setInsertInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInsert();
            }}
            className="hv-input"
            inputMode="numeric"
            placeholder="42"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="hv-btn hv-btn-primary" onClick={onInsert}>
            <Plus size={14} /> Insert
          </button>
        </div>

        <div className="hv-control-group">
          <label className="hv-input-label" htmlFor="hv-search">
            Search
          </label>
          <input
            id="hv-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
            className="hv-input"
            inputMode="numeric"
            placeholder="19"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="hv-btn hv-btn-accent" onClick={onSearch}>
            <Search size={14} /> Search
          </button>
        </div>

        <div className="hv-control-group">
          <label className="hv-input-label" htmlFor="hv-delete">
            Delete
          </label>
          <input
            id="hv-delete"
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onDelete();
            }}
            className="hv-input"
            inputMode="numeric"
            placeholder="3"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="hv-btn hv-btn-danger" onClick={onDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>

        {resultPill && (
          <span className={`hv-result-pill hv-result-${resultPill.kind}`}>{resultPill.text}</span>
        )}

        <div className="hv-control-spacer" />

        <button type="button" className="hv-btn" onClick={onLoadDefaults}>
          Defaults
        </button>
        <button type="button" className="hv-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="hv-formula-row">
        <span className="hv-formula-label">h(key) =</span>
        <code className="hv-formula">{hash.formula}</code>
        {highlightKey !== null && (
          <>
            <span className="hv-formula-sep">→</span>
            <code className="hv-formula hv-formula-result">
              h({highlightKey}) = {hash.fn(highlightKey)}
            </code>
          </>
        )}
      </div>

      <div className="hv-stage">
        <svg
          className="hv-svg"
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          role="img"
          aria-label="Hash table visualization"
        >
          {/* Header line above buckets */}
          {Array.from({ length: BUCKETS }).map((_, i) => {
            const y = bucketY(i);
            const chain = renderTable[i];
            const isActive = i === activeBucket;
            const bucketCls = [
              'hv-bucket',
              isActive ? 'hv-bucket-active' : '',
              chain.length === 0 ? 'hv-bucket-empty' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <g key={`bucket-${i}`} className={bucketCls}>
                <rect
                  x={PAD_X}
                  y={y}
                  width={BUCKET_W}
                  height={BUCKET_H}
                  rx={6}
                  className="hv-bucket-box"
                />
                <text
                  x={PAD_X + 12}
                  y={y + BUCKET_H / 2 + 5}
                  className="hv-bucket-index"
                >
                  [{i}]
                </text>
                <text
                  x={PAD_X + BUCKET_W - 12}
                  y={y + BUCKET_H / 2 + 5}
                  textAnchor="end"
                  className="hv-bucket-count"
                >
                  {chain.length === 0 ? 'null' : `n=${chain.length}`}
                </text>

                {/* Edge from bucket to first chain node */}
                {chain.length > 0 && (
                  <>
                    <line
                      x1={PAD_X + BUCKET_W}
                      y1={y + BUCKET_H / 2}
                      x2={nodeX(0)}
                      y2={y + BUCKET_H / 2}
                      className={`hv-edge ${isActive ? 'hv-edge-active' : ''}`}
                    />
                    <polygon
                      points={`${nodeX(0) - 6},${y + BUCKET_H / 2 - 4} ${nodeX(0)},${
                        y + BUCKET_H / 2
                      } ${nodeX(0) - 6},${y + BUCKET_H / 2 + 4}`}
                      className={`hv-arrow ${isActive ? 'hv-arrow-active' : ''}`}
                    />
                  </>
                )}

                {/* Chain nodes */}
                {chain.map((val, slot) => {
                  const cx = nodeX(slot);
                  const cy = y + (BUCKET_H - NODE_H) / 2;
                  const isHere = isActive && slot === activeIndex;
                  const isInsertTarget =
                    isHere && (activeStatus === 'insert' || activeStatus === 'duplicate');
                  const isFound = isHere && activeStatus === 'found';
                  const isRemove = isHere && activeStatus === 'remove';
                  const isWalking = isHere && activeStatus === 'walk';
                  const nodeCls = [
                    'hv-node',
                    isInsertTarget ? 'hv-node-insert' : '',
                    isFound ? 'hv-node-found' : '',
                    isRemove ? 'hv-node-remove' : '',
                    isWalking ? 'hv-node-walk' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const isLast = slot === chain.length - 1;
                  return (
                    <g key={`node-${i}-${slot}-${val}`} className={nodeCls}>
                      {isHere && (
                        <rect
                          x={cx - 4}
                          y={cy - 4}
                          width={NODE_W + 8}
                          height={NODE_H + 8}
                          rx={8}
                          className="hv-node-ring"
                        />
                      )}
                      <rect
                        x={cx}
                        y={cy}
                        width={NODE_W}
                        height={NODE_H}
                        rx={6}
                        className="hv-node-box"
                      />
                      <text
                        x={cx + NODE_W / 2}
                        y={cy + NODE_H / 2 + 5}
                        textAnchor="middle"
                        className="hv-node-label"
                      >
                        {val}
                      </text>

                      {!isLast && (
                        <>
                          <line
                            x1={cx + NODE_W}
                            y1={cy + NODE_H / 2}
                            x2={nodeX(slot + 1)}
                            y2={cy + NODE_H / 2}
                            className={`hv-edge ${isActive ? 'hv-edge-active' : ''}`}
                          />
                          <polygon
                            points={`${nodeX(slot + 1) - 6},${cy + NODE_H / 2 - 4} ${nodeX(
                              slot + 1,
                            )},${cy + NODE_H / 2} ${nodeX(slot + 1) - 6},${cy + NODE_H / 2 + 4}`}
                            className={`hv-arrow ${isActive ? 'hv-arrow-active' : ''}`}
                          />
                        </>
                      )}
                      {isLast && (
                        <text
                          x={cx + NODE_W + 14}
                          y={cy + NODE_H / 2 + 5}
                          className="hv-tail-null"
                        >
                          / null
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Insert preview: when this bucket is the insert target and we're about to append,
                    show the highlight key floating in the next slot. Only at the 'insert' status do
                    we add it to the chain (already in renderTable via the next frame). */}
                {isActive &&
                  activeStatus === 'hash' &&
                  highlightKey !== null &&
                  !renderTable[i].includes(highlightKey) && (
                    <g className="hv-incoming">
                      <rect
                        x={nodeX(renderTable[i].length)}
                        y={y + (BUCKET_H - NODE_H) / 2}
                        width={NODE_W}
                        height={NODE_H}
                        rx={6}
                        className="hv-incoming-box"
                      />
                      <text
                        x={nodeX(renderTable[i].length) + NODE_W / 2}
                        y={y + BUCKET_H / 2 + 5}
                        textAnchor="middle"
                        className="hv-incoming-label"
                      >
                        {highlightKey}
                      </text>
                    </g>
                  )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="hv-key-row">
        <span className="hv-key-row-label">Keys</span>
        <div className="hv-key-chips">
          {keys.length === 0 && <span className="hv-key-empty">Empty</span>}
          {keys.map((k, idx) => (
            <span key={`${k}-${idx}`} className="hv-key-chip">
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="hv-footer">
        <div className="hv-stat">
          <span className="hv-stat-label">Load factor</span>
          <span className="hv-stat-value">
            {stats.total} / {BUCKETS} = {stats.load.toFixed(2)}
          </span>
        </div>
        <div className="hv-stat">
          <span className="hv-stat-label">Avg chain</span>
          <span className="hv-stat-value">{stats.avg.toFixed(2)}</span>
        </div>
        <div className="hv-stat">
          <span className="hv-stat-label">Max chain</span>
          <span className="hv-stat-value">{stats.max}</span>
        </div>
        <div className="hv-stat hv-stat-grow">
          <span className="hv-stat-label">Current operation</span>
          <span className="hv-stat-value">{opLabel}</span>
        </div>
      </div>
    </div>
  );
}
