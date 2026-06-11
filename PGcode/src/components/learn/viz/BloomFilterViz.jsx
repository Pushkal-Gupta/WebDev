import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, RotateCcw, AlertTriangle } from 'lucide-react';
import './BloomFilterViz.css';

const STEP_MS = 480;
const SIZE_OPTIONS = [8, 16, 32];
const K_MIN = 1;
const K_MAX = 5;
const DEFAULT_SIZE = 16;
const DEFAULT_K = 3;
const INITIAL_KEYS = ['alpha', 'beta', 'gamma'];

// FNV-1a 32-bit hash. We mix in a per-hash salt so k hash functions are independent-ish.
function fnv1a(str, salt) {
  let h = 0x811c9dc5 ^ (salt * 0x01000193);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // djb2-style second mix for extra dispersion
  h ^= salt * 0x9e3779b9;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

function hashesFor(str, k, m) {
  const out = [];
  for (let s = 0; s < k; s++) {
    out.push(fnv1a(str, s + 1) % m);
  }
  return out;
}

function emptyBits(m) {
  return new Array(m).fill(false);
}

function buildFromKeys(keys, k, m) {
  const bits = emptyBits(m);
  const positions = [];
  for (const key of keys) {
    const hs = hashesFor(key, k, m);
    positions.push({ key, hs });
    for (const h of hs) bits[h] = true;
  }
  return { bits, positions };
}

function buildInsertFrames(bits, key, hashes) {
  // Frames: hash-reveal -> walk each hash position -> final
  const frames = [];
  frames.push({
    bits: bits.slice(),
    label: `Compute ${hashes.length} hashes of "${key}"`,
    activeBits: [],
    pendingBits: hashes.slice(),
    status: 'hash',
    key,
  });
  let working = bits.slice();
  for (let i = 0; i < hashes.length; i++) {
    const h = hashes[i];
    const wasSet = working[h];
    const next = working.slice();
    next[h] = true;
    frames.push({
      bits: next,
      label: wasSet
        ? `h${i + 1}("${key}") = ${h} — bit already set`
        : `h${i + 1}("${key}") = ${h} — flip bit on`,
      activeBits: [h],
      pendingBits: hashes.slice(i + 1),
      status: wasSet ? 'set-already' : 'set-new',
      key,
    });
    working = next;
  }
  frames.push({
    bits: working,
    label: `"${key}" inserted — ${hashes.length} bits marked`,
    activeBits: hashes.slice(),
    pendingBits: [],
    status: 'done-insert',
    key,
  });
  return { frames, finalBits: working };
}

function buildQueryFrames(bits, key, hashes) {
  const frames = [];
  frames.push({
    bits: bits.slice(),
    label: `Compute ${hashes.length} hashes of "${key}"`,
    activeBits: [],
    pendingBits: hashes.slice(),
    checked: [],
    status: 'hash',
    key,
  });
  const checked = [];
  let allSet = true;
  for (let i = 0; i < hashes.length; i++) {
    const h = hashes[i];
    const ok = bits[h];
    checked.push({ h, ok });
    frames.push({
      bits: bits.slice(),
      label: ok
        ? `h${i + 1}("${key}") = ${h} — bit is ON, continue`
        : `h${i + 1}("${key}") = ${h} — bit is OFF, definitely NOT present`,
      activeBits: [h],
      pendingBits: hashes.slice(i + 1),
      checked: checked.slice(),
      status: ok ? 'check-hit' : 'check-miss',
      key,
    });
    if (!ok) {
      allSet = false;
      break;
    }
  }
  if (allSet) {
    frames.push({
      bits: bits.slice(),
      label: `All ${hashes.length} bits ON — "${key}" might be present`,
      activeBits: hashes.slice(),
      pendingBits: [],
      checked: checked.slice(),
      status: 'done-maybe',
      key,
    });
  } else {
    frames.push({
      bits: bits.slice(),
      label: `At least one bit OFF — "${key}" is definitely NOT present`,
      activeBits: [],
      pendingBits: [],
      checked: checked.slice(),
      status: 'done-no',
      key,
    });
  }
  return { frames, allSet };
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const r = Math.round(n);
  if (r < min) return min;
  if (r > max) return max;
  return r;
}

function cellLayout(m) {
  // Up to 16 cells per row; if 32 we wrap to two rows.
  const perRow = m <= 16 ? m : 16;
  const rows = Math.ceil(m / perRow);
  const cellW = m <= 8 ? 56 : m <= 16 ? 44 : 40;
  const cellH = 44;
  const gap = 6;
  const padX = 24;
  const padY = 32;
  const width = padX * 2 + perRow * cellW + (perRow - 1) * gap;
  const height = padY * 2 + rows * cellH + (rows - 1) * 14 + 28;
  return { perRow, rows, cellW, cellH, gap, padX, padY, width, height };
}

function cellPos(idx, layout) {
  const row = Math.floor(idx / layout.perRow);
  const col = idx % layout.perRow;
  const x = layout.padX + col * (layout.cellW + layout.gap);
  const y = layout.padY + row * (layout.cellH + 14);
  return { x, y };
}

export default function BloomFilterViz() {
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [k, setK] = useState(DEFAULT_K);
  const [insertedKeys, setInsertedKeys] = useState(() => [...INITIAL_KEYS]);
  const [insertInput, setInsertInput] = useState('delta');
  const [queryInput, setQueryInput] = useState('beta');
  const [frames, setFrames] = useState([]);
  const [frameIdx, setFrameIdx] = useState(-1);
  const [, setPendingKey] = useState(null);
  const [operation, setOperation] = useState('Pre-loaded with 3 keys');
  const [verdict, setVerdict] = useState(null);
  const [truePos, setTruePos] = useState(0);
  const [falsePos, setFalsePos] = useState(0);
  const [trueNeg, setTrueNeg] = useState(0);
  const playRef = useRef(null);

  // Derived current bit array from inserted keys + config.
  const built = useMemo(() => buildFromKeys(insertedKeys, k, size), [insertedKeys, k, size]);
  const liveBits = built.bits;

  const currentFrame = frameIdx >= 0 && frameIdx < frames.length ? frames[frameIdx] : null;
  const renderBits = currentFrame ? currentFrame.bits : liveBits;

  const layout = useMemo(() => cellLayout(size), [size]);

  // Stats
  const bitsSet = useMemo(() => renderBits.reduce((a, b) => a + (b ? 1 : 0), 0), [renderBits]);
  const load = size === 0 ? 0 : bitsSet / size;
  const n = insertedKeys.length;
  // Theoretical FP rate: (1 - (1 - 1/m)^(k*n))^k
  const fpr = useMemo(() => {
    if (n === 0) return 0;
    const p = Math.pow(1 - 1 / size, k * n);
    return Math.pow(1 - p, k);
  }, [size, k, n]);

  const commitPendingKey = useCallback(() => {
    setPendingKey((current) => {
      if (current !== null) {
        setInsertedKeys((prev) => (prev.includes(current) ? prev : [...prev, current]));
      }
      return null;
    });
  }, []);

  // Animation loop. Commit pending key when we land on the final frame.
  useEffect(() => {
    if (frameIdx < 0 || frameIdx >= frames.length - 1) return;
    playRef.current = setTimeout(() => {
      setFrameIdx((i) => {
        const next = i + 1;
        if (next === frames.length - 1) commitPendingKey();
        return next;
      });
    }, STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [frameIdx, frames, commitPendingKey]);

  const startFrames = useCallback((newFrames) => {
    setFrames(newFrames);
    setFrameIdx(0);
    if (newFrames.length <= 1) commitPendingKey();
  }, [commitPendingKey]);

  const normalizeKey = (raw) => String(raw).trim();

  const onInsert = useCallback(() => {
    const key = normalizeKey(insertInput);
    if (!key) {
      setOperation('Insert: enter a non-empty key');
      setVerdict(null);
      return;
    }
    if (insertedKeys.includes(key)) {
      setOperation(`"${key}" is already in the inserted set`);
      setVerdict({ kind: 'warn', text: 'Duplicate' });
      return;
    }
    const hs = hashesFor(key, k, size);
    const { frames: fs } = buildInsertFrames(liveBits, key, hs);
    setPendingKey(key);
    setOperation(`Insert "${key}"`);
    setVerdict({ kind: 'ok', text: 'Inserted' });
    startFrames(fs);
  }, [insertInput, insertedKeys, k, size, liveBits, startFrames]);

  const onQuery = useCallback(() => {
    const key = normalizeKey(queryInput);
    if (!key) {
      setOperation('Query: enter a non-empty key');
      setVerdict(null);
      return;
    }
    const hs = hashesFor(key, k, size);
    const { frames: fs, allSet } = buildQueryFrames(liveBits, key, hs);
    const reallyIn = insertedKeys.includes(key);
    setPendingKey(null);
    setOperation(`Query "${key}"`);
    if (allSet && reallyIn) {
      setVerdict({ kind: 'ok', text: 'True positive' });
      setTruePos((c) => c + 1);
    } else if (allSet && !reallyIn) {
      setVerdict({ kind: 'fp', text: 'False positive' });
      setFalsePos((c) => c + 1);
    } else {
      setVerdict({ kind: 'fail', text: 'Definitely not present' });
      setTrueNeg((c) => c + 1);
    }
    startFrames(fs);
  }, [queryInput, k, size, liveBits, insertedKeys, startFrames]);

  const onFindFalsePositive = useCallback(() => {
    // Brute-force search for a short token that is NOT in inserted set but whose k hashes
    // all land on bits that are currently set. If none exists, surface that fact.
    if (insertedKeys.length === 0) {
      setOperation('Insert some keys first to demo a false positive');
      setVerdict(null);
      return;
    }
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const inserted = new Set(insertedKeys);
    const candidates = [];
    // try 2- and 3-letter strings
    for (const a of alphabet) candidates.push(a);
    for (const a of alphabet) for (const b of alphabet) candidates.push(a + b);
    // Prepend "fp-" prefixed candidates so we explore distinct hashes too
    for (let i = 0; i < 200; i++) candidates.push(`fp-${i}`);
    for (const cand of candidates) {
      if (inserted.has(cand)) continue;
      const hs = hashesFor(cand, k, size);
      let allSet = true;
      for (const h of hs) {
        if (!liveBits[h]) {
          allSet = false;
          break;
        }
      }
      if (allSet) {
        setQueryInput(cand);
        const { frames: fs } = buildQueryFrames(liveBits, cand, hs);
        setPendingKey(null);
        setOperation(`Found false-positive candidate "${cand}"`);
        setVerdict({ kind: 'fp', text: 'False positive' });
        setFalsePos((c) => c + 1);
        startFrames(fs);
        return;
      }
    }
    setOperation('No false-positive candidate found in the search budget — try inserting more keys');
    setVerdict({ kind: 'warn', text: 'No FP found' });
  }, [insertedKeys, k, size, liveBits, startFrames]);

  const onReset = useCallback(() => {
    setInsertedKeys([]);
    setFrames([]);
    setFrameIdx(-1);
    setPendingKey(null);
    setVerdict(null);
    setTruePos(0);
    setFalsePos(0);
    setTrueNeg(0);
    setOperation('Filter cleared');
  }, []);

  const onLoadDefaults = useCallback(() => {
    setInsertedKeys([...INITIAL_KEYS]);
    setFrames([]);
    setFrameIdx(-1);
    setPendingKey(null);
    setVerdict(null);
    setTruePos(0);
    setFalsePos(0);
    setTrueNeg(0);
    setOperation('Reloaded default keys');
  }, []);

  const onSizeChange = (e) => {
    const v = clampInt(e.target.value, 8, 32, DEFAULT_SIZE);
    setSize(v);
    setFrames([]);
    setFrameIdx(-1);
    setPendingKey(null);
    setVerdict(null);
    setOperation(`Bit array resized to ${v}`);
  };

  const onKChange = (e) => {
    const v = clampInt(e.target.value, K_MIN, K_MAX, DEFAULT_K);
    setK(v);
    setFrames([]);
    setFrameIdx(-1);
    setPendingKey(null);
    setVerdict(null);
    setOperation(`Using ${v} hash function${v === 1 ? '' : 's'}`);
  };

  const opLabel = currentFrame ? currentFrame.label : operation;
  const activeBits = currentFrame ? currentFrame.activeBits : [];
  const pendingBits = currentFrame ? currentFrame.pendingBits : [];
  const checked = currentFrame && currentFrame.checked ? currentFrame.checked : [];
  const activeStatus = currentFrame ? currentFrame.status : null;
  const activeKey = currentFrame ? currentFrame.key : null;
  const isFalsePosFrame = verdict && verdict.kind === 'fp';

  const activeSet = new Set(activeBits);
  const pendingSet = new Set(pendingBits);
  const checkedMap = new Map();
  for (const c of checked) checkedMap.set(c.h, c.ok);

  // Display hashes for the active key (if any), even between frames.
  const activeHashes = activeKey ? hashesFor(activeKey, k, size) : [];

  return (
    <div className="bf-root">
      <div className="bf-head">
        <div className="bf-title-block">
          <h3 className="bf-title">Bloom filter</h3>
          <p className="bf-sub">
            A bit array plus k hash functions. Insert flips k bits on. Query checks if all k
            bits are on — if any is off the key is definitely absent, if all are on the key
            might be present (false positives possible, false negatives impossible).
          </p>
        </div>
      </div>

      <div className="bf-controls">
        <div className="bf-control-group">
          <label className="bf-input-label" htmlFor="bf-size">
            Size m
          </label>
          <select id="bf-size" className="bf-select bf-select-narrow" value={size} onChange={onSizeChange}>
            {SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="bf-control-group">
          <label className="bf-input-label" htmlFor="bf-k">
            Hashes k
          </label>
          <select id="bf-k" className="bf-select bf-select-narrow" value={k} onChange={onKChange}>
            {Array.from({ length: K_MAX - K_MIN + 1 }, (_, i) => i + K_MIN).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="bf-control-group">
          <label className="bf-input-label" htmlFor="bf-insert">
            Insert
          </label>
          <input
            id="bf-insert"
            type="text"
            value={insertInput}
            onChange={(e) => setInsertInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInsert();
            }}
            className="bf-input"
            placeholder="key"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="bf-btn bf-btn-primary" onClick={onInsert}>
            <Plus size={14} /> Insert
          </button>
        </div>

        <div className="bf-control-group">
          <label className="bf-input-label" htmlFor="bf-query">
            Query
          </label>
          <input
            id="bf-query"
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onQuery();
            }}
            className="bf-input"
            placeholder="key"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="bf-btn bf-btn-accent" onClick={onQuery}>
            <Search size={14} /> Query
          </button>
        </div>

        {verdict && (
          <span className={`bf-result-pill bf-result-${verdict.kind}`}>
            {verdict.kind === 'fp' && <AlertTriangle size={12} />}
            {verdict.text}
          </span>
        )}

        <div className="bf-control-spacer" />

        <button type="button" className="bf-btn bf-btn-warn" onClick={onFindFalsePositive}>
          <AlertTriangle size={14} /> Find false positive
        </button>
        <button type="button" className="bf-btn" onClick={onLoadDefaults}>
          Defaults
        </button>
        <button type="button" className="bf-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="bf-formula-row">
        <span className="bf-formula-label">FPR ≈</span>
        <code className="bf-formula">(1 − (1 − 1/m)^(k·n))^k</code>
        <span className="bf-formula-sep">→</span>
        <code className="bf-formula bf-formula-result">
          m={size}, k={k}, n={n} ⇒ {(fpr * 100).toFixed(2)}%
        </code>
        {activeKey && activeHashes.length > 0 && (
          <>
            <span className="bf-formula-sep">·</span>
            <code className="bf-formula">
              hashes("{activeKey}") = [{activeHashes.join(', ')}]
            </code>
          </>
        )}
      </div>

      <div className="bf-stage">
        <svg
          className="bf-svg"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Bloom filter bit array visualization"
        >
          {/* Index labels above row 0 */}
          {Array.from({ length: size }).map((_, idx) => {
            const { x, y } = cellPos(idx, layout);
            const on = renderBits[idx];
            const isActive = activeSet.has(idx);
            const isPending = pendingSet.has(idx);
            const checkRes = checkedMap.has(idx) ? checkedMap.get(idx) : null;
            const cls = [
              'bf-cell',
              on ? 'bf-cell-on' : 'bf-cell-off',
              isActive ? 'bf-cell-active' : '',
              isPending ? 'bf-cell-pending' : '',
              checkRes === true ? 'bf-cell-check-hit' : '',
              checkRes === false ? 'bf-cell-check-miss' : '',
              isActive && activeStatus === 'set-new' ? 'bf-cell-flash' : '',
              isActive && activeStatus === 'set-already' ? 'bf-cell-already' : '',
              isActive && activeStatus === 'check-hit' ? 'bf-cell-hit-now' : '',
              isActive && activeStatus === 'check-miss' ? 'bf-cell-miss-now' : '',
              isActive && isFalsePosFrame && activeStatus && activeStatus.startsWith('done')
                ? 'bf-cell-fp'
                : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={`cell-${idx}`} className={cls}>
                <text x={x + layout.cellW / 2} y={y - 8} textAnchor="middle" className="bf-cell-idx">
                  {idx}
                </text>
                <rect
                  x={x}
                  y={y}
                  width={layout.cellW}
                  height={layout.cellH}
                  rx={6}
                  className="bf-cell-box"
                />
                <text
                  x={x + layout.cellW / 2}
                  y={y + layout.cellH / 2 + 5}
                  textAnchor="middle"
                  className="bf-cell-val"
                >
                  {on ? '1' : '0'}
                </text>
                {isPending && !isActive && (
                  <circle
                    cx={x + layout.cellW / 2}
                    cy={y + layout.cellH + 10}
                    r={3.5}
                    className="bf-pending-dot"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="bf-key-row">
        <span className="bf-key-row-label">Inserted ({insertedKeys.length})</span>
        <div className="bf-key-chips">
          {insertedKeys.length === 0 && <span className="bf-key-empty">Empty</span>}
          {insertedKeys.map((kk, idx) => (
            <span key={`${kk}-${idx}`} className="bf-key-chip">
              {kk}
            </span>
          ))}
        </div>
      </div>

      <div className="bf-footer">
        <div className="bf-stat">
          <span className="bf-stat-label">Bits set</span>
          <span className="bf-stat-value">
            {bitsSet} / {size}
          </span>
        </div>
        <div className="bf-stat">
          <span className="bf-stat-label">Load factor</span>
          <span className="bf-stat-value">{load.toFixed(3)}</span>
        </div>
        <div className="bf-stat">
          <span className="bf-stat-label">Theoretical FPR</span>
          <span className="bf-stat-value">{(fpr * 100).toFixed(2)}%</span>
        </div>
        <div className="bf-stat">
          <span className="bf-stat-label">True positives</span>
          <span className="bf-stat-value">{truePos}</span>
        </div>
        <div className="bf-stat">
          <span className="bf-stat-label">False positives</span>
          <span className="bf-stat-value">{falsePos}</span>
        </div>
        <div className="bf-stat">
          <span className="bf-stat-label">True negatives</span>
          <span className="bf-stat-value">{trueNeg}</span>
        </div>
        <div className="bf-stat bf-stat-grow">
          <span className="bf-stat-label">Current operation</span>
          <span className="bf-stat-value">{opLabel}</span>
        </div>
      </div>
    </div>
  );
}
