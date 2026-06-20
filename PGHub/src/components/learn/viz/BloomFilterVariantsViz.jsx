import React, { useCallback, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Ban,
  Layers,
  Hash,
  SplitSquareHorizontal,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import './BloomFilterVariantsViz.css';

const K_MIN = 2;
const K_MAX = 5;
const SIZE_MIN = 12;
const SIZE_MAX = 30;
const DEFAULT_SIZE = 18;
const DEFAULT_K = 3;
const COUNTER_CAP = 9;

const MODES = [
  { id: 'standard', label: 'Standard', icon: Hash },
  { id: 'counting', label: 'Counting', icon: Layers },
  { id: 'partitioned', label: 'Partitioned', icon: SplitSquareHorizontal },
];

const DELETE_NOTE = {
  standard:
    'Delete is blocked. Clearing k bits could zero a bit another element relies on, producing a false negative — and a Bloom filter must never report a present element as absent.',
  counting:
    'Delete decrements k counters by one. A slot stays positive while any other element still maps to it, so removals never corrupt other members. Safe deletes are the whole point of the counting variant.',
  partitioned:
    'Each hash owns one slice, so its bit is independent of the other hashes. Deletes are still unsafe here for the same reason as standard — combine with counters per slice if you need removal. To scale instead, stack a fresh filter layer when the current one saturates.',
};

const INITIAL_KEYS = ['cat', 'dog', 'fox'];

// FNV-1a 32-bit with a per-hash salt so the k hashes are independent-ish. Deterministic — no Math.random.
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

// For partitioned mode each hash maps into its own equal slice of the array.
function sliceBounds(m, k) {
  const base = Math.floor(m / k);
  const extra = m % k;
  const bounds = [];
  let start = 0;
  for (let s = 0; s < k; s++) {
    const len = base + (s < extra ? 1 : 0);
    bounds.push({ start, end: start + len, len });
    start += len;
  }
  return bounds;
}

function hashesFor(str, k, m, mode) {
  const out = [];
  if (mode === 'partitioned') {
    const bounds = sliceBounds(m, k);
    for (let s = 0; s < k; s++) {
      const b = bounds[s];
      out.push(b.start + (fnv1a(str, s + 1) % Math.max(1, b.len)));
    }
    return out;
  }
  for (let s = 0; s < k; s++) out.push(fnv1a(str, s + 1) % m);
  return out;
}

function buildArray(keys, k, m, mode) {
  const arr = new Array(m).fill(0);
  const positions = [];
  for (const key of keys) {
    const hs = hashesFor(key, k, m, mode);
    positions.push({ key, hs });
    for (const h of hs) {
      if (mode === 'counting') arr[h] = Math.min(COUNTER_CAP, arr[h] + 1);
      else arr[h] = 1;
    }
  }
  return { arr, positions };
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const r = Math.round(n);
  if (r < min) return min;
  if (r > max) return max;
  return r;
}

function layoutFor(m, k, mode) {
  const perRow = m <= 18 ? m : Math.ceil(m / 2);
  const rows = Math.ceil(m / perRow);
  const cellW = 42;
  const cellH = 46;
  const gap = 7;
  const padX = 22;
  const padTop = 30;
  const padBottom = mode === 'partitioned' ? 40 : 24;
  const rowGap = 30;
  const width = padX * 2 + perRow * cellW + (perRow - 1) * gap;
  const height = padTop + rows * cellH + (rows - 1) * rowGap + padBottom;
  return { perRow, rows, cellW, cellH, gap, padX, padTop, rowGap, width, height };
}

function cellPos(idx, layout) {
  const row = Math.floor(idx / layout.perRow);
  const col = idx % layout.perRow;
  const x = layout.padX + col * (layout.cellW + layout.gap);
  const y = layout.padTop + row * (layout.cellH + layout.rowGap);
  return { x, y, row, col };
}

export default function BloomFilterVariantsViz() {
  const [mode, setMode] = useState('standard');
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [k, setK] = useState(DEFAULT_K);
  const [keys, setKeys] = useState(() => [...INITIAL_KEYS]);
  const [addInput, setAddInput] = useState('owl');
  const [queryInput, setQueryInput] = useState('dog');
  const [deleteInput, setDeleteInput] = useState('cat');
  const [touched, setTouched] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [operation, setOperation] = useState('Pre-loaded with three keys');

  const { arr, positions } = useMemo(
    () => buildArray(keys, k, size, mode),
    [keys, k, size, mode],
  );
  const layout = useMemo(() => layoutFor(size, k, mode), [size, k, mode]);
  const bounds = useMemo(
    () => (mode === 'partitioned' ? sliceBounds(size, k) : null),
    [mode, size, k],
  );

  const isCounting = mode === 'counting';
  const deleteAllowed = isCounting;

  const slotsSet = useMemo(() => arr.reduce((a, v) => a + (v > 0 ? 1 : 0), 0), [arr]);
  const totalCount = useMemo(() => arr.reduce((a, v) => a + v, 0), [arr]);
  const n = keys.length;

  // Theoretical FP rate: (1 - (1 - 1/m)^(k*n))^k
  const fpr = useMemo(() => {
    if (n === 0) return 0;
    const p = Math.pow(1 - 1 / size, k * n);
    return Math.pow(1 - p, k);
  }, [size, k, n]);

  const sliceOf = useCallback(
    (idx) => {
      if (!bounds) return -1;
      return bounds.findIndex((b) => idx >= b.start && idx < b.end);
    },
    [bounds],
  );

  const resetTransient = () => {
    setTouched([]);
    setVerdict(null);
  };

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    resetTransient();
    setOperation(`Switched to ${next} variant`);
  };

  const onAdd = useCallback(() => {
    const key = String(addInput).trim();
    if (!key) {
      setOperation('Add: enter a non-empty key');
      setVerdict(null);
      return;
    }
    if (keys.includes(key)) {
      setOperation(`"${key}" is already inserted`);
      setVerdict({ kind: 'warn', text: 'Duplicate' });
      setTouched(hashesFor(key, k, size, mode));
      return;
    }
    const hs = hashesFor(key, k, size, mode);
    setKeys((prev) => [...prev, key]);
    setTouched(hs);
    setOperation(
      isCounting
        ? `Added "${key}" — incremented ${k} counters`
        : `Added "${key}" — set ${k} bits`,
    );
    setVerdict({ kind: 'ok', text: 'Added' });
  }, [addInput, keys, k, size, mode, isCounting]);

  const onQuery = useCallback(() => {
    const key = String(queryInput).trim();
    if (!key) {
      setOperation('Query: enter a non-empty key');
      setVerdict(null);
      return;
    }
    const hs = hashesFor(key, k, size, mode);
    const allHit = hs.every((h) => arr[h] > 0);
    const reallyIn = keys.includes(key);
    setTouched(hs);
    if (!allHit) {
      setOperation(`Query "${key}" — a slot is empty`);
      setVerdict({ kind: 'no', text: 'Definitely not present' });
    } else if (reallyIn) {
      setOperation(`Query "${key}" — every slot occupied`);
      setVerdict({ kind: 'yes', text: 'Possibly present' });
    } else {
      setOperation(`Query "${key}" — slots collide with other keys`);
      setVerdict({ kind: 'fp', text: 'Possibly present (false positive)' });
    }
  }, [queryInput, k, size, mode, arr, keys]);

  const onDelete = useCallback(() => {
    if (!deleteAllowed) {
      const key = String(deleteInput).trim();
      if (key) setTouched(hashesFor(key, k, size, mode));
      setOperation(`Delete blocked in ${mode} mode`);
      setVerdict({ kind: 'blocked', text: 'Delete unsafe' });
      return;
    }
    const key = String(deleteInput).trim();
    if (!key) {
      setOperation('Delete: enter a non-empty key');
      setVerdict(null);
      return;
    }
    if (!keys.includes(key)) {
      setOperation(`"${key}" was never added — nothing to decrement`);
      setVerdict({ kind: 'warn', text: 'Not a member' });
      setTouched(hashesFor(key, k, size, mode));
      return;
    }
    const hs = hashesFor(key, k, size, mode);
    setKeys((prev) => prev.filter((x) => x !== key));
    setTouched(hs);
    setOperation(`Deleted "${key}" — decremented ${k} counters`);
    setVerdict({ kind: 'ok', text: 'Deleted' });
  }, [deleteAllowed, deleteInput, keys, k, size, mode]);

  const onReset = () => {
    setKeys([...INITIAL_KEYS]);
    setMode('standard');
    setSize(DEFAULT_SIZE);
    setK(DEFAULT_K);
    resetTransient();
    setOperation('Reset to defaults');
  };

  const onSizeChange = (e) => {
    setSize(clampInt(e.target.value, SIZE_MIN, SIZE_MAX, DEFAULT_SIZE));
    resetTransient();
  };
  const onKChange = (e) => {
    setK(clampInt(e.target.value, K_MIN, K_MAX, DEFAULT_K));
    resetTransient();
  };

  const touchedSet = new Set(touched);
  const positionsForTouched = positions;

  const SLICE_HUES = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--accent)'];

  return (
    <div className="bfv-root">
      <div className="bfv-head">
        <h3 className="bfv-title">Bloom filter variants — delete, count, partition</h3>
        <p className="bfv-sub">
          The same k-hash membership trick, reshaped three ways. Toggle a variant to see why
          standard filters refuse deletes, how counters make removal safe, and how partitioning
          gives every hash its own slice.
        </p>
      </div>

      <div className="bfv-modebar">
        {MODES.map((mdef) => {
          const Icon = mdef.icon;
          const active = mode === mdef.id;
          return (
            <button
              key={mdef.id}
              type="button"
              className={`bfv-mode ${active ? 'bfv-mode-active' : ''}`}
              onClick={() => switchMode(mdef.id)}
            >
              <Icon size={15} /> {mdef.label}
            </button>
          );
        })}
        <div className="bfv-mode-spacer" />
        <button type="button" className="bfv-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="bfv-explainer">
        <span className="bfv-explainer-tag">
          {deleteAllowed ? <ShieldCheck size={14} /> : <Ban size={14} />}
          Delete semantics
        </span>
        <span className="bfv-explainer-text">{DELETE_NOTE[mode]}</span>
      </div>

      <div className="bfv-controls">
        <div className="bfv-control-group">
          <label className="bfv-input-label" htmlFor="bfv-size">
            Size m
          </label>
          <input
            id="bfv-size"
            type="range"
            className="bfv-range"
            min={SIZE_MIN}
            max={SIZE_MAX}
            step={1}
            value={size}
            onChange={onSizeChange}
          />
          <span className="bfv-range-value">{size}</span>
        </div>

        <div className="bfv-control-group">
          <label className="bfv-input-label" htmlFor="bfv-k">
            Hashes k
          </label>
          <input
            id="bfv-k"
            type="range"
            className="bfv-range"
            min={K_MIN}
            max={K_MAX}
            step={1}
            value={k}
            onChange={onKChange}
          />
          <span className="bfv-range-value">{k}</span>
        </div>

        <div className="bfv-control-group">
          <label className="bfv-input-label" htmlFor="bfv-add">
            Add
          </label>
          <input
            id="bfv-add"
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAdd();
            }}
            className="bfv-input"
            placeholder="key"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="bfv-btn bfv-btn-primary" onClick={onAdd}>
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="bfv-control-group">
          <label className="bfv-input-label" htmlFor="bfv-query">
            Query
          </label>
          <input
            id="bfv-query"
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onQuery();
            }}
            className="bfv-input"
            placeholder="key"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="bfv-btn bfv-btn-accent" onClick={onQuery}>
            <Search size={14} /> Query
          </button>
        </div>

        <div className="bfv-control-group">
          <label className="bfv-input-label" htmlFor="bfv-del">
            Delete
          </label>
          <input
            id="bfv-del"
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && deleteAllowed) onDelete();
            }}
            className="bfv-input"
            placeholder="key"
            spellCheck={false}
            autoComplete="off"
            disabled={!deleteAllowed}
          />
          <button
            type="button"
            className={`bfv-btn ${deleteAllowed ? 'bfv-btn-danger' : 'bfv-btn-blocked'}`}
            onClick={onDelete}
            disabled={!deleteAllowed}
            title={deleteAllowed ? 'Decrement k counters' : DELETE_NOTE.standard}
          >
            {deleteAllowed ? <Trash2 size={14} /> : <Ban size={14} />} Delete
          </button>
        </div>

        {verdict && (
          <span className={`bfv-pill bfv-pill-${verdict.kind}`}>{verdict.text}</span>
        )}
      </div>

      <div className="bfv-stage">
        <svg
          className="bfv-svg"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${mode} bloom filter variant array`}
        >
          {/* Partition slice backgrounds + boundary labels */}
          {mode === 'partitioned' &&
            bounds &&
            bounds.map((b, s) => {
              const startCell = cellPos(b.start, layout);
              const endCell = cellPos(b.end - 1, layout);
              if (startCell.row !== endCell.row) return null;
              const hue = SLICE_HUES[s % SLICE_HUES.length];
              const x = startCell.x - 4;
              const w = endCell.x + layout.cellW - startCell.x + 8;
              return (
                <g key={`slice-${s}`}>
                  <rect
                    x={x}
                    y={startCell.y - 6}
                    width={w}
                    height={layout.cellH + 12}
                    rx={8}
                    className="bfv-slice-box"
                    style={{ stroke: hue }}
                  />
                  <text
                    x={x + w / 2}
                    y={startCell.y + layout.cellH + 22}
                    textAnchor="middle"
                    className="bfv-slice-label"
                    style={{ fill: hue }}
                  >
                    h{s + 1} slice
                  </text>
                </g>
              );
            })}

          {Array.from({ length: size }).map((_, idx) => {
            const { x, y } = cellPos(idx, layout);
            const v = arr[idx];
            const occupied = v > 0;
            const touchedHere = touchedSet.has(idx);
            const slice = mode === 'partitioned' ? sliceOf(idx) : -1;
            const hue = slice >= 0 ? SLICE_HUES[slice % SLICE_HUES.length] : null;
            const cls = [
              'bfv-cell',
              occupied ? 'bfv-cell-on' : 'bfv-cell-off',
              touchedHere ? 'bfv-cell-touched' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const boxStyle =
              mode === 'partitioned' && occupied && hue
                ? { fill: `color-mix(in srgb, ${hue} 24%, var(--surface))`, stroke: hue }
                : undefined;
            return (
              <g key={`cell-${idx}`} className={cls}>
                <text
                  x={x + layout.cellW / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="bfv-cell-idx"
                >
                  {idx}
                </text>
                <rect
                  x={x}
                  y={y}
                  width={layout.cellW}
                  height={layout.cellH}
                  rx={6}
                  className="bfv-cell-box"
                  style={boxStyle}
                />
                <text
                  x={x + layout.cellW / 2}
                  y={y + layout.cellH / 2 + 5}
                  textAnchor="middle"
                  className="bfv-cell-val"
                >
                  {isCounting ? v : occupied ? '1' : '0'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="bfv-keyrow">
        <span className="bfv-keyrow-label">Members ({n})</span>
        <div className="bfv-chips">
          {n === 0 && <span className="bfv-chip-empty">Empty</span>}
          {positionsForTouched.map((p, idx) => (
            <span key={`${p.key}-${idx}`} className="bfv-chip">
              {p.key}
              <span className="bfv-chip-hashes">[{p.hs.join(',')}]</span>
            </span>
          ))}
        </div>
      </div>

      <div className="bfv-footer">
        <div className="bfv-stat">
          <span className="bfv-stat-label">{isCounting ? 'Counters > 0' : 'Bits set'}</span>
          <span className="bfv-stat-value">
            {slotsSet} / {size}
          </span>
        </div>
        <div className="bfv-stat">
          <span className="bfv-stat-label">{isCounting ? 'Counter sum' : 'Total writes'}</span>
          <span className="bfv-stat-value">{totalCount}</span>
        </div>
        <div className="bfv-stat">
          <span className="bfv-stat-label">Members n</span>
          <span className="bfv-stat-value">{n}</span>
        </div>
        <div className="bfv-stat">
          <span className="bfv-stat-label">False-positive prob.</span>
          <span className="bfv-stat-value">{(fpr * 100).toFixed(2)}%</span>
        </div>
        <div className="bfv-stat">
          <span className="bfv-stat-label">Delete</span>
          <span className="bfv-stat-value">
            {deleteAllowed ? 'safe (decrement)' : 'blocked'}
          </span>
        </div>
        <div className="bfv-stat bfv-stat-grow">
          <span className="bfv-stat-label">Current operation</span>
          <span className="bfv-stat-value">{operation}</span>
        </div>
      </div>

      <div className="bfv-formula">
        <span className="bfv-formula-label">FP prob ≈</span>
        <code className="bfv-formula-code">(1 − (1 − 1/m)^(k·n))^k</code>
        <span className="bfv-formula-sep">→</span>
        <code className="bfv-formula-code bfv-formula-result">
          m={size}, k={k}, n={n} ⇒ {(fpr * 100).toFixed(2)}%
        </code>
      </div>
    </div>
  );
}
