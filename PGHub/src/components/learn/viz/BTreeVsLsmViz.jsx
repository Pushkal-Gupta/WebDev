import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Plus, Shuffle, RotateCcw, GitBranch, Layers } from 'lucide-react';
import './BTreeVsLsmViz.css';

const ORDER = 4; // max keys per B-tree node before split
const MEMTABLE_CAP = 4; // memtable flushes at this many keys
const COMPACT_TRIGGER = 3; // SSTables at level-0 trigger a compaction
const MAX_KEYS = 24; // cap so the drawing always fits the viewBox

// Deterministic PRNG (mulberry32) seeded by an integer so "random" inserts replay.
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

// ---- B-tree (order ORDER) ---------------------------------------------------
function newLeaf() {
  return { keys: [], children: null };
}

function cloneNode(node) {
  return {
    keys: node.keys.slice(),
    children: node.children ? node.children.map(cloneNode) : null,
  };
}

// Insert into a B-tree, splitting overfull nodes. Mutates a clone; returns
// { root, splits, writes } where splits counts node splits this insert.
function btreeInsert(root, key) {
  const stats = { splits: 0, writes: 0 };

  function splitChild(parent, idx) {
    const child = parent.children[idx];
    const mid = Math.floor(child.keys.length / 2);
    const promoted = child.keys[mid];
    const left = {
      keys: child.keys.slice(0, mid),
      children: child.children ? child.children.slice(0, mid + 1) : null,
    };
    const right = {
      keys: child.keys.slice(mid + 1),
      children: child.children ? child.children.slice(mid + 1) : null,
    };
    parent.keys.splice(idx, 0, promoted);
    parent.children.splice(idx, 1, left, right);
    stats.splits += 1;
    stats.writes += 3; // left page, right page, parent page rewritten
  }

  function insertNonFull(node, k) {
    stats.writes += 1; // page touched on the path
    if (!node.children) {
      let i = node.keys.length - 1;
      while (i >= 0 && node.keys[i] > k) i -= 1;
      node.keys.splice(i + 1, 0, k);
      return;
    }
    let i = node.keys.length - 1;
    while (i >= 0 && node.keys[i] > k) i -= 1;
    i += 1;
    if (node.children[i].keys.length >= ORDER) {
      splitChild(node, i);
      if (node.keys[i] < k) i += 1;
    }
    insertNonFull(node.children[i], k);
  }

  const next = cloneNode(root);
  if (next.keys.length >= ORDER) {
    const fresh = { keys: [], children: [next] };
    splitChild(fresh, 0);
    insertNonFull(fresh, key);
    return { root: fresh, splits: stats.splits, writes: stats.writes };
  }
  insertNonFull(next, key);
  return { root: next, splits: stats.splits, writes: stats.writes };
}

function btreeHeight(node) {
  let h = 1;
  let cur = node;
  while (cur.children && cur.children.length) {
    h += 1;
    cur = cur.children[0];
  }
  return h;
}

function btreeKeyCount(node) {
  let total = node.keys.length;
  if (node.children) for (const c of node.children) total += btreeKeyCount(c);
  return total;
}

// ---- LSM-tree ---------------------------------------------------------------
// memtable: sorted array; level0: list of SSTables (each a sorted array);
// level1: single merged SSTable (sorted array). Insert -> memtable, flush at
// cap -> new level0 SSTable, compact when level0 count hits COMPACT_TRIGGER.
function lsmInsert(state, key) {
  const memtable = state.memtable.slice();
  let level0 = state.level0.map((s) => s.slice());
  let level1 = state.level1.slice();
  let flushes = state.flushes;
  let compactions = state.compactions;
  let writeAmp = state.writeAmp;

  const idx = (() => {
    let i = memtable.length - 1;
    while (i >= 0 && memtable[i] > key) i -= 1;
    return i + 1;
  })();
  memtable.splice(idx, 0, key);
  writeAmp += 1; // append to memtable / WAL

  let lastEvent = 'append';
  if (memtable.length >= MEMTABLE_CAP) {
    level0 = [...level0, memtable.slice()];
    writeAmp += memtable.length; // sequential flush rewrite
    flushes += 1;
    memtable.length = 0;
    lastEvent = 'flush';

    if (level0.length >= COMPACT_TRIGGER) {
      const merged = [...level1];
      for (const sst of level0) for (const v of sst) merged.push(v);
      merged.sort((a, b) => a - b);
      writeAmp += merged.length; // rewrite during compaction
      level1 = merged;
      level0 = [];
      compactions += 1;
      lastEvent = 'compact';
    }
  }

  return { memtable, level0, level1, flushes, compactions, writeAmp, lastEvent };
}

function lsmSstableCount(state) {
  return state.level0.length + (state.level1.length ? 1 : 0);
}

const EMPTY_LSM = {
  memtable: [],
  level0: [],
  level1: [],
  flushes: 0,
  compactions: 0,
  writeAmp: 0,
  lastEvent: 'idle',
};

function makeInitial() {
  return { btree: newLeaf(), btSplits: 0, btWrites: 0, lsm: EMPTY_LSM, history: [], seq: 0 };
}

// ---- SVG layout helpers -----------------------------------------------------
const W = 480;
const H = 360;

function layoutBTree(root) {
  // BFS into levels; place nodes evenly within each level band.
  const levels = [];
  let frontier = [{ node: root }];
  while (frontier.length) {
    levels.push(frontier.map((f) => f.node));
    const nextFrontier = [];
    for (const f of frontier) {
      if (f.node.children) for (const c of f.node.children) nextFrontier.push({ node: c });
    }
    frontier = nextFrontier;
  }
  const topY = 70;
  const bandH = levels.length > 1 ? (H - topY - 40) / (levels.length - 1) : 0;
  const positions = new Map();
  levels.forEach((nodes, li) => {
    const slot = (W - 40) / (nodes.length + 1);
    nodes.forEach((n, ni) => {
      positions.set(n, { x: 20 + slot * (ni + 1), y: topY + bandH * li });
    });
  });
  // edges
  const edges = [];
  function walk(node) {
    if (!node.children) return;
    const p = positions.get(node);
    for (const c of node.children) {
      const cp = positions.get(c);
      edges.push({ x1: p.x, y1: p.y + 14, x2: cp.x, y2: cp.y - 14 });
      walk(c);
    }
  }
  walk(root);
  return { positions, edges, levels };
}

export default function BTreeVsLsmViz() {
  const [state, setState] = useState(makeInitial);
  const [keyInput, setKeyInput] = useState('');
  const [lastKey, setLastKey] = useState(null);
  const [op, setOp] = useState('Insert a key into both structures to compare in-place vs log-structured writes');
  const seedRef = useRef(7);

  const doInsert = useCallback(
    (rawKey) => {
      setState((prev) => {
        if (prev.seq >= MAX_KEYS) {
          setOp(`Reached ${MAX_KEYS}-key cap — reset to keep exploring`);
          return prev;
        }
        const key = rawKey;
        const bt = btreeInsert(prev.btree, key);
        const lsm = lsmInsert(prev.lsm, key);
        const eventLabel =
          lsm.lastEvent === 'compact'
            ? `compaction merged level-0 into level-1`
            : lsm.lastEvent === 'flush'
            ? `memtable full → flushed a new SSTable`
            : `appended to memtable (O(1))`;
        const btLabel = bt.splits
          ? `${bt.splits} node split${bt.splits === 1 ? '' : 's'}, ${bt.writes} page writes`
          : `${bt.writes} page write${bt.writes === 1 ? '' : 's'}, no split`;
        setOp(`Inserted ${key} · B-tree: ${btLabel} · LSM: ${eventLabel}`);
        setLastKey(key);
        return {
          btree: bt.root,
          btSplits: prev.btSplits + bt.splits,
          btWrites: prev.btWrites + bt.writes,
          lsm,
          history: [...prev.history, key],
          seq: prev.seq + 1,
        };
      });
    },
    [],
  );

  const onInsertTyped = useCallback(() => {
    const v = Number(keyInput);
    if (!Number.isFinite(v) || keyInput.trim() === '') {
      setOp('Enter an integer key to insert');
      return;
    }
    doInsert(Math.trunc(v));
    setKeyInput('');
  }, [keyInput, doInsert]);

  const onRandom = useCallback(() => {
    const rng = mulberry32(seedRef.current);
    seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0;
    const key = 1 + Math.floor(rng() * 99);
    doInsert(key);
  }, [doInsert]);

  const onReset = useCallback(() => {
    seedRef.current = 7;
    setState(makeInitial());
    setLastKey(null);
    setOp('Reset — both structures empty');
  }, []);

  const btLayout = useMemo(() => layoutBTree(state.btree), [state.btree]);
  const btHeight = useMemo(() => btreeHeight(state.btree), [state.btree]);
  const btKeys = useMemo(() => btreeKeyCount(state.btree), [state.btree]);
  const sstCount = useMemo(() => lsmSstableCount(state.lsm), [state.lsm]);
  const lsmKeys = useMemo(() => {
    let n = state.lsm.memtable.length + state.lsm.level1.length;
    for (const s of state.lsm.level0) n += s.length;
    return n;
  }, [state.lsm]);
  const readAmp = sstCount + (state.lsm.memtable.length ? 1 : 0);
  const writeAmpRatio = btKeys ? (state.lsm.writeAmp / Math.max(1, lsmKeys)).toFixed(2) : '0.00';
  const btWriteRatio = btKeys ? (state.btWrites / btKeys).toFixed(2) : '0.00';

  // ---- LSM SVG geometry ----
  const lsmCellW = 30;
  const lsmGap = 5;
  const lsmRowKeys = (arr, x, y, kind, highlight) =>
    arr.map((k, i) => {
      const cx = x + i * (lsmCellW + lsmGap);
      const isLast = highlight && k === lastKey && i === arr.length - 1;
      return (
        <g key={`${kind}-${i}-${k}`} className={`btl-lsm-cell btl-lsm-${kind} ${isLast ? 'btl-flash' : ''}`}>
          <rect x={cx} y={y} width={lsmCellW} height={26} rx={5} className="btl-lsm-box" />
          <text x={cx + lsmCellW / 2} y={y + 17} textAnchor="middle" className="btl-lsm-val">
            {k}
          </text>
        </g>
      );
    });

  return (
    <div className="btl">
      <div className="btl-head">
        <h3 className="btl-title">B-tree vs LSM-tree — read-optimized vs write-optimized</h3>
        <p className="btl-sub">
          The same key lands in both. A B-tree updates pages in place and splits full nodes; an
          LSM-tree appends to a memtable, flushes immutable SSTables, then compacts them. Watch the
          write- and read-amplification trade-off.
        </p>
      </div>

      <div className="btl-controls">
        <div className="btl-control-group">
          <label className="btl-input-label" htmlFor="btl-key">
            Key
          </label>
          <input
            id="btl-key"
            type="number"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInsertTyped();
            }}
            className="btl-input"
            placeholder="int"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="btl-btn btl-btn-primary" onClick={onInsertTyped}>
            <Plus size={14} /> Insert
          </button>
        </div>
        <button type="button" className="btl-btn btl-btn-accent" onClick={onRandom}>
          <Shuffle size={14} /> Random key
        </button>
        <div className="btl-control-spacer" />
        <button type="button" className="btl-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="btl-stage">
        <div className="btl-panel">
          <div className="btl-panel-head">
            <GitBranch size={14} />
            <span className="btl-panel-title">B-tree</span>
            <span className="btl-panel-tag">in-place · read-optimized</span>
          </div>
          <svg
            className="btl-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="B-tree structure"
          >
            {btLayout.edges.map((e, i) => (
              <line
                key={`edge-${i}`}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                className="btl-edge"
              />
            ))}
            {[...btLayout.positions.entries()].map(([node, p], ni) => {
              const cellW = 26;
              const totalW = Math.max(1, node.keys.length) * cellW;
              const startX = p.x - totalW / 2;
              const hasNew = node.keys.includes(lastKey);
              return (
                <g key={`node-${ni}`} className={`btl-bt-node ${hasNew ? 'btl-flash' : ''}`}>
                  <rect
                    x={startX - 4}
                    y={p.y - 14}
                    width={totalW + 8}
                    height={28}
                    rx={6}
                    className="btl-bt-box"
                  />
                  {node.keys.map((k, ki) => (
                    <g key={`k-${ki}`}>
                      {ki > 0 && (
                        <line
                          x1={startX + ki * cellW}
                          y1={p.y - 14}
                          x2={startX + ki * cellW}
                          y2={p.y + 14}
                          className="btl-bt-sep"
                        />
                      )}
                      <text
                        x={startX + ki * cellW + cellW / 2}
                        y={p.y + 5}
                        textAnchor="middle"
                        className={`btl-bt-key ${k === lastKey ? 'btl-bt-key-new' : ''}`}
                      >
                        {k}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
            {btKeys === 0 && (
              <text x={W / 2} y={H / 2} textAnchor="middle" className="btl-empty">
                empty — insert a key
              </text>
            )}
          </svg>
          <div className="btl-mini-stats">
            <span className="btl-mini">
              height <strong>{btHeight}</strong>
            </span>
            <span className="btl-mini">
              keys <strong>{btKeys}</strong>
            </span>
            <span className="btl-mini">
              splits <strong>{state.btSplits}</strong>
            </span>
            <span className="btl-mini">
              page writes <strong>{state.btWrites}</strong>
            </span>
          </div>
        </div>

        <div className="btl-panel">
          <div className="btl-panel-head">
            <Layers size={14} />
            <span className="btl-panel-title">LSM-tree</span>
            <span className="btl-panel-tag">append · write-optimized</span>
          </div>
          <svg
            className="btl-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="LSM-tree structure"
          >
            <text x={20} y={28} className="btl-lsm-label">
              memtable (sorted buffer)
            </text>
            <rect
              x={16}
              y={36}
              width={W - 32}
              height={36}
              rx={6}
              className="btl-lsm-tier btl-lsm-tier-mem"
            />
            {lsmRowKeys(state.lsm.memtable, 24, 41, 'mem', true)}
            {state.lsm.memtable.length === 0 && (
              <text x={W / 2} y={59} textAnchor="middle" className="btl-empty btl-empty-sm">
                empty buffer
              </text>
            )}

            <text x={20} y={102} className="btl-lsm-label">
              level-0 SSTables (immutable, newest first)
            </text>
            {state.lsm.level0.length === 0 && (
              <text x={W / 2} y={138} textAnchor="middle" className="btl-empty btl-empty-sm">
                no flushed tables
              </text>
            )}
            {state.lsm.level0.map((sst, si) => {
              const y = 112 + si * 42;
              return (
                <g key={`l0-${si}`}>
                  <rect
                    x={16}
                    y={y}
                    width={W - 32}
                    height={34}
                    rx={6}
                    className="btl-lsm-tier btl-lsm-tier-l0"
                  />
                  {lsmRowKeys(sst, 24, y + 4, 'l0', false)}
                </g>
              );
            })}

            <text x={20} y={H - 60} className="btl-lsm-label">
              level-1 (compacted, merged run)
            </text>
            <rect
              x={16}
              y={H - 52}
              width={W - 32}
              height={36}
              rx={6}
              className="btl-lsm-tier btl-lsm-tier-l1"
            />
            {lsmRowKeys(state.lsm.level1.slice(0, 14), 24, H - 47, 'l1', false)}
            {state.lsm.level1.length > 14 && (
              <text x={W - 30} y={H - 30} textAnchor="end" className="btl-lsm-more">
                +{state.lsm.level1.length - 14}
              </text>
            )}
            {state.lsm.level1.length === 0 && (
              <text x={W / 2} y={H - 30} textAnchor="middle" className="btl-empty btl-empty-sm">
                no compaction yet
              </text>
            )}
          </svg>
          <div className="btl-mini-stats">
            <span className="btl-mini">
              flushes <strong>{state.lsm.flushes}</strong>
            </span>
            <span className="btl-mini">
              SSTables <strong>{sstCount}</strong>
            </span>
            <span className="btl-mini">
              compactions <strong>{state.lsm.compactions}</strong>
            </span>
            <span className="btl-mini">
              keys <strong>{lsmKeys}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="btl-compare">
        <div className="btl-compare-col btl-compare-read">
          <span className="btl-compare-head">B-tree read path</span>
          <span className="btl-compare-line">
            1 lookup, O(log n) — descend {btHeight} level{btHeight === 1 ? '' : 's'}, low read
            amplification
          </span>
          <span className="btl-compare-line btl-compare-dim">
            write cost: in-place page rewrites + splits → write amp ≈ {btWriteRatio}× / key
          </span>
        </div>
        <div className="btl-compare-col btl-compare-write">
          <span className="btl-compare-head">LSM write path</span>
          <span className="btl-compare-line">
            append O(1) amortized, sequential flushes — read may touch {readAmp} run
            {readAmp === 1 ? '' : 's'}
          </span>
          <span className="btl-compare-line btl-compare-dim">
            compaction write amp ≈ {writeAmpRatio}× / key · higher read amplification
          </span>
        </div>
      </div>

      <div className="btl-footer">
        <div className="btl-stat">
          <span className="btl-stat-label">B-tree write amp</span>
          <span className="btl-stat-value">{btWriteRatio}×</span>
        </div>
        <div className="btl-stat">
          <span className="btl-stat-label">LSM write amp</span>
          <span className="btl-stat-value">{writeAmpRatio}×</span>
        </div>
        <div className="btl-stat">
          <span className="btl-stat-label">B-tree read amp</span>
          <span className="btl-stat-value">1 lookup</span>
        </div>
        <div className="btl-stat">
          <span className="btl-stat-label">LSM read amp</span>
          <span className="btl-stat-value">{readAmp} run{readAmp === 1 ? '' : 's'}</span>
        </div>
        <div className="btl-stat btl-stat-grow">
          <span className="btl-stat-label">Last operation</span>
          <span className="btl-stat-value">{op}</span>
        </div>
      </div>
    </div>
  );
}
