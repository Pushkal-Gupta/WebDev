import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Trash2, RotateCcw, AlertTriangle, Ban, Check } from 'lucide-react';
import './BloomVsCuckooViz.css';

const STEP_MS = 520;
const BLOOM_M = 16;
const BLOOM_K = 3;
const NUM_BUCKETS = 8;
const SLOTS_PER_BUCKET = 4;
const MAX_KICKS = 8;
const INITIAL_KEYS = ['alpha', 'beta', 'gamma', 'delta'];

// FNV-1a 32-bit hash with a per-call salt so the k Bloom hashes and the two
// Cuckoo index hashes stay independent without any nondeterministic source.
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

function bloomHashes(key) {
  const out = [];
  for (let s = 0; s < BLOOM_K; s++) out.push(fnv1a(key, s + 1) % BLOOM_M);
  return out;
}

function fingerprintOf(key) {
  const fp = (fnv1a(key, 101) % 255) + 1;
  return fp.toString(16).padStart(2, '0');
}

function fpHash(fp) {
  return fnv1a(fp, 211) % NUM_BUCKETS;
}

function cuckooIndices(key) {
  const fp = fingerprintOf(key);
  const i1 = fnv1a(key, 53) % NUM_BUCKETS;
  const i2 = (i1 ^ fpHash(fp)) % NUM_BUCKETS;
  return { fp, i1, i2 };
}

function altIndex(idx, fp) {
  return (idx ^ fpHash(fp)) % NUM_BUCKETS;
}

function emptyBuckets() {
  return Array.from({ length: NUM_BUCKETS }, () => new Array(SLOTS_PER_BUCKET).fill(null));
}

function cloneBuckets(buckets) {
  return buckets.map((b) => b.slice());
}

function firstFreeSlot(bucket) {
  for (let s = 0; s < bucket.length; s++) if (bucket[s] === null) return s;
  return -1;
}

function buildBloom(keys) {
  const bits = new Array(BLOOM_M).fill(false);
  for (const key of keys) for (const h of bloomHashes(key)) bits[h] = true;
  return bits;
}

// Deterministic eviction victim: rotate through slots by key so repeated
// inserts do not always kick slot 0.
function victimSlot(seed) {
  return seed % SLOTS_PER_BUCKET;
}

function buildCuckoo(keys) {
  const buckets = emptyBuckets();
  let seed = 0;
  for (const key of keys) {
    const { fp, i1, i2 } = cuckooIndices(key);
    seed += 1;
    if (firstFreeSlot(buckets[i1]) >= 0) {
      buckets[i1][firstFreeSlot(buckets[i1])] = { fp, key };
      continue;
    }
    if (firstFreeSlot(buckets[i2]) >= 0) {
      buckets[i2][firstFreeSlot(buckets[i2])] = { fp, key };
      continue;
    }
    let curIdx = i1;
    let carry = { fp, key };
    for (let n = 0; n < MAX_KICKS; n++) {
      const s = victimSlot(seed + n);
      const evicted = buckets[curIdx][s];
      buckets[curIdx][s] = carry;
      carry = evicted;
      const nextIdx = altIndex(curIdx, carry.fp);
      const free = firstFreeSlot(buckets[nextIdx]);
      if (free >= 0) {
        buckets[nextIdx][free] = carry;
        carry = null;
        break;
      }
      curIdx = nextIdx;
    }
  }
  return buckets;
}

function buildBloomInsertFrames(bits, key) {
  const hs = bloomHashes(key);
  const frames = [];
  frames.push({
    bits: bits.slice(),
    label: `Bloom: hash "${key}" -> [${hs.join(', ')}]`,
    activeBits: [],
    pendingBits: hs.slice(),
  });
  let working = bits.slice();
  for (let i = 0; i < hs.length; i++) {
    const next = working.slice();
    const wasSet = next[hs[i]];
    next[hs[i]] = true;
    frames.push({
      bits: next,
      label: wasSet
        ? `Bloom: bit ${hs[i]} already on`
        : `Bloom: set bit ${hs[i]} on`,
      activeBits: [hs[i]],
      pendingBits: hs.slice(i + 1),
    });
    working = next;
  }
  frames.push({
    bits: working,
    label: `Bloom: "${key}" recorded across ${hs.length} bits`,
    activeBits: hs.slice(),
    pendingBits: [],
  });
  return frames;
}

function buildBloomQueryFrames(bits, key) {
  const hs = bloomHashes(key);
  const frames = [];
  const checked = [];
  frames.push({
    bits: bits.slice(),
    label: `Bloom: hash "${key}" -> [${hs.join(', ')}]`,
    activeBits: [],
    pendingBits: hs.slice(),
    checked: [],
  });
  let allSet = true;
  for (let i = 0; i < hs.length; i++) {
    const ok = bits[hs[i]];
    checked.push({ h: hs[i], ok });
    frames.push({
      bits: bits.slice(),
      label: ok
        ? `Bloom: bit ${hs[i]} is on, keep checking`
        : `Bloom: bit ${hs[i]} is off -> definitely absent`,
      activeBits: [hs[i]],
      pendingBits: hs.slice(i + 1),
      checked: checked.slice(),
    });
    if (!ok) {
      allSet = false;
      break;
    }
  }
  frames.push({
    bits: bits.slice(),
    label: allSet
      ? `Bloom: all bits on -> "${key}" might be present`
      : `Bloom: "${key}" is definitely not present`,
    activeBits: allSet ? hs.slice() : [],
    pendingBits: [],
    checked: checked.slice(),
  });
  return { frames, allSet };
}

function buildCuckooInsertFrames(buckets, key) {
  const { fp, i1, i2 } = cuckooIndices(key);
  const frames = [];
  frames.push({
    buckets: cloneBuckets(buckets),
    label: `Cuckoo: fp(${key}) = ${fp}, buckets ${i1} or ${i2}`,
    activeBucket: i1,
    altBucket: i2,
    flyingFp: null,
  });
  let working = cloneBuckets(buckets);
  let free1 = firstFreeSlot(working[i1]);
  if (free1 >= 0) {
    working[i1][free1] = { fp, key };
    frames.push({
      buckets: cloneBuckets(working),
      label: `Cuckoo: free slot in bucket ${i1} -> placed ${fp}`,
      activeBucket: i1,
      altBucket: i2,
      placedAt: { idx: i1, slot: free1 },
      flyingFp: null,
    });
    return { frames, finalBuckets: working };
  }
  let free2 = firstFreeSlot(working[i2]);
  if (free2 >= 0) {
    working[i2][free2] = { fp, key };
    frames.push({
      buckets: cloneBuckets(working),
      label: `Cuckoo: bucket ${i1} full, free slot in ${i2} -> placed ${fp}`,
      activeBucket: i2,
      altBucket: i1,
      placedAt: { idx: i2, slot: free2 },
      flyingFp: null,
    });
    return { frames, finalBuckets: working };
  }

  frames.push({
    buckets: cloneBuckets(working),
    label: `Cuckoo: bucket ${i1} and ${i2} both full -> evict to make room`,
    activeBucket: i1,
    altBucket: i2,
    flyingFp: fp,
  });

  let curIdx = i1;
  let carry = { fp, key };
  const seed = fnv1a(key, 7);
  for (let n = 0; n < MAX_KICKS; n++) {
    const s = victimSlot(seed + n);
    const evicted = working[curIdx][s];
    working = cloneBuckets(working);
    working[curIdx][s] = carry;
    frames.push({
      buckets: cloneBuckets(working),
      label: `Cuckoo: kick ${n + 1} -> ${evicted.fp} leaves bucket ${curIdx}`,
      activeBucket: curIdx,
      altBucket: altIndex(curIdx, evicted.fp),
      placedAt: { idx: curIdx, slot: s },
      flyingFp: evicted.fp,
    });
    carry = evicted;
    const nextIdx = altIndex(curIdx, carry.fp);
    const free = firstFreeSlot(working[nextIdx]);
    if (free >= 0) {
      working = cloneBuckets(working);
      working[nextIdx][free] = carry;
      frames.push({
        buckets: cloneBuckets(working),
        label: `Cuckoo: ${carry.fp} lands in alternate bucket ${nextIdx}`,
        activeBucket: nextIdx,
        altBucket: curIdx,
        placedAt: { idx: nextIdx, slot: free },
        flyingFp: null,
      });
      return { frames, finalBuckets: working };
    }
    curIdx = nextIdx;
  }
  frames.push({
    buckets: cloneBuckets(working),
    label: `Cuckoo: ${MAX_KICKS} kicks reached -> table too full to insert`,
    activeBucket: curIdx,
    altBucket: null,
    flyingFp: carry ? carry.fp : null,
    failed: true,
  });
  return { frames, finalBuckets: buckets };
}

function buildCuckooQueryFrames(buckets, key) {
  const { fp, i1, i2 } = cuckooIndices(key);
  const frames = [];
  frames.push({
    buckets: cloneBuckets(buckets),
    label: `Cuckoo: fp(${key}) = ${fp}, check buckets ${i1} and ${i2}`,
    activeBucket: i1,
    altBucket: i2,
    flyingFp: null,
  });
  const inI1 = buckets[i1].some((slot) => slot && slot.fp === fp);
  frames.push({
    buckets: cloneBuckets(buckets),
    label: inI1
      ? `Cuckoo: found ${fp} in bucket ${i1} -> present`
      : `Cuckoo: ${fp} not in bucket ${i1}, check ${i2}`,
    activeBucket: i1,
    altBucket: i2,
    matchSlot: inI1 ? { idx: i1, fp } : null,
    flyingFp: null,
  });
  if (inI1) return { frames, found: true };
  const inI2 = buckets[i2].some((slot) => slot && slot.fp === fp);
  frames.push({
    buckets: cloneBuckets(buckets),
    label: inI2
      ? `Cuckoo: found ${fp} in bucket ${i2} -> present`
      : `Cuckoo: ${fp} in neither bucket -> not present`,
    activeBucket: i2,
    altBucket: i1,
    matchSlot: inI2 ? { idx: i2, fp } : null,
    flyingFp: null,
  });
  return { frames, found: inI2 };
}

function buildCuckooDeleteFrames(buckets, key) {
  const { fp, i1, i2 } = cuckooIndices(key);
  const frames = [];
  frames.push({
    buckets: cloneBuckets(buckets),
    label: `Cuckoo: delete fp(${key}) = ${fp} from bucket ${i1} or ${i2}`,
    activeBucket: i1,
    altBucket: i2,
    flyingFp: null,
  });
  let working = cloneBuckets(buckets);
  for (const idx of [i1, i2]) {
    const slot = working[idx].findIndex((sl) => sl && sl.fp === fp);
    if (slot >= 0) {
      working = cloneBuckets(working);
      working[idx][slot] = null;
      frames.push({
        buckets: cloneBuckets(working),
        label: `Cuckoo: removed ${fp} from bucket ${idx}`,
        activeBucket: idx,
        altBucket: idx === i1 ? i2 : i1,
        removedAt: { idx, slot },
        flyingFp: null,
      });
      return { frames, finalBuckets: working, removed: true };
    }
  }
  frames.push({
    buckets: cloneBuckets(working),
    label: `Cuckoo: ${fp} not stored -> nothing to delete`,
    activeBucket: i1,
    altBucket: i2,
    flyingFp: null,
  });
  return { frames, finalBuckets: buckets, removed: false };
}

const BLOOM_PER_ROW = 8;
const BLOOM_ROWS = Math.ceil(BLOOM_M / BLOOM_PER_ROW);
const BLOOM_CELL = 40;
const BLOOM_GAP = 6;
const BLOOM_PAD = 18;
const BLOOM_W = BLOOM_PAD * 2 + BLOOM_PER_ROW * BLOOM_CELL + (BLOOM_PER_ROW - 1) * BLOOM_GAP;
const BLOOM_H = BLOOM_PAD * 2 + BLOOM_ROWS * (BLOOM_CELL + 22) + 8;

function bloomCellPos(idx) {
  const row = Math.floor(idx / BLOOM_PER_ROW);
  const col = idx % BLOOM_PER_ROW;
  return {
    x: BLOOM_PAD + col * (BLOOM_CELL + BLOOM_GAP),
    y: BLOOM_PAD + 16 + row * (BLOOM_CELL + 22),
  };
}

const CK_PAD_X = 18;
const CK_PAD_Y = 22;
const CK_LABEL_W = 26;
const CK_SLOT_W = 40;
const CK_SLOT_H = 24;
const CK_SLOT_GAP = 4;
const CK_ROW_GAP = 8;
const CK_W =
  CK_PAD_X * 2 + CK_LABEL_W + SLOTS_PER_BUCKET * CK_SLOT_W + (SLOTS_PER_BUCKET - 1) * CK_SLOT_GAP;
const CK_H = CK_PAD_Y * 2 + NUM_BUCKETS * (CK_SLOT_H + CK_ROW_GAP) - CK_ROW_GAP;

function ckRowY(idx) {
  return CK_PAD_Y + idx * (CK_SLOT_H + CK_ROW_GAP);
}

function ckSlotX(slot) {
  return CK_PAD_X + CK_LABEL_W + slot * (CK_SLOT_W + CK_SLOT_GAP);
}

export default function BloomVsCuckooViz() {
  const [keys, setKeys] = useState(() => [...INITIAL_KEYS]);
  const [insertInput, setInsertInput] = useState('epsilon');
  const [queryInput, setQueryInput] = useState('beta');
  const [deleteInput, setDeleteInput] = useState('alpha');

  const [bloomFrames, setBloomFrames] = useState([]);
  const [bloomIdx, setBloomIdx] = useState(-1);
  const [ckFrames, setCkFrames] = useState([]);
  const [ckIdx, setCkIdx] = useState(-1);

  const [operation, setOperation] = useState('Pre-loaded with 4 items on both sides');
  const [bloomVerdict, setBloomVerdict] = useState(null);
  const [ckVerdict, setCkVerdict] = useState(null);
  const [bloomDeleteBlocked, setBloomDeleteBlocked] = useState(false);

  const pendingRef = useRef(null);
  const bloomTimer = useRef(null);
  const ckTimer = useRef(null);

  const liveBloom = useMemo(() => buildBloom(keys), [keys]);
  const liveCuckoo = useMemo(() => buildCuckoo(keys), [keys]);

  const bloomFrame = bloomIdx >= 0 && bloomIdx < bloomFrames.length ? bloomFrames[bloomIdx] : null;
  const ckFrame = ckIdx >= 0 && ckIdx < ckFrames.length ? ckFrames[ckIdx] : null;

  const renderBloom = bloomFrame ? bloomFrame.bits : liveBloom;
  const renderCuckoo = ckFrame ? ckFrame.buckets : liveCuckoo;

  const commitPending = useCallback(() => {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    if (p.type === 'insert') {
      setKeys((prev) => (prev.includes(p.key) ? prev : [...prev, p.key]));
    } else if (p.type === 'delete') {
      setKeys((prev) => prev.filter((kk) => kk !== p.key));
    }
  }, []);

  useEffect(() => {
    if (bloomIdx < 0 || bloomIdx >= bloomFrames.length - 1) return;
    bloomTimer.current = setTimeout(() => setBloomIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(bloomTimer.current);
  }, [bloomIdx, bloomFrames]);

  useEffect(() => {
    if (ckIdx < 0 || ckIdx >= ckFrames.length - 1) {
      if (ckIdx >= 0 && ckFrames.length > 0 && ckIdx === ckFrames.length - 1) commitPending();
      return;
    }
    ckTimer.current = setTimeout(() => {
      setCkIdx((i) => {
        const next = i + 1;
        if (next === ckFrames.length - 1) commitPending();
        return next;
      });
    }, STEP_MS);
    return () => clearTimeout(ckTimer.current);
  }, [ckIdx, ckFrames, commitPending]);

  const norm = (raw) => String(raw).trim();

  const onInsert = useCallback(() => {
    const key = norm(insertInput);
    setBloomDeleteBlocked(false);
    if (!key) {
      setOperation('Insert: enter a non-empty item');
      return;
    }
    if (keys.includes(key)) {
      setOperation(`"${key}" already present in both filters`);
      setBloomVerdict({ kind: 'warn', text: 'Duplicate' });
      setCkVerdict({ kind: 'warn', text: 'Duplicate' });
      return;
    }
    pendingRef.current = { type: 'insert', key };
    setOperation(`Insert "${key}" into both filters`);
    setBloomVerdict({ kind: 'ok', text: 'Inserted' });
    const bf = buildBloomInsertFrames(liveBloom, key);
    const { frames: cf, finalBuckets } = buildCuckooInsertFrames(liveCuckoo, key);
    const failed = finalBuckets === liveCuckoo;
    setCkVerdict(failed ? { kind: 'fail', text: 'Table full' } : { kind: 'ok', text: 'Inserted' });
    if (failed) pendingRef.current = null;
    setBloomFrames(bf);
    setBloomIdx(0);
    setCkFrames(cf);
    setCkIdx(0);
  }, [insertInput, keys, liveBloom, liveCuckoo]);

  const onQuery = useCallback(() => {
    const key = norm(queryInput);
    setBloomDeleteBlocked(false);
    if (!key) {
      setOperation('Query: enter a non-empty item');
      return;
    }
    const reallyIn = keys.includes(key);
    const { frames: bf, allSet } = buildBloomQueryFrames(liveBloom, key);
    const { frames: cf, found } = buildCuckooQueryFrames(liveCuckoo, key);
    pendingRef.current = null;
    setOperation(`Query "${key}" on both filters`);
    if (allSet && reallyIn) setBloomVerdict({ kind: 'ok', text: 'Maybe present' });
    else if (allSet && !reallyIn) setBloomVerdict({ kind: 'fp', text: 'False positive' });
    else setBloomVerdict({ kind: 'fail', text: 'Definitely absent' });
    setCkVerdict(found ? { kind: 'ok', text: 'Present' } : { kind: 'fail', text: 'Not present' });
    setBloomFrames(bf);
    setBloomIdx(0);
    setCkFrames(cf);
    setCkIdx(0);
  }, [queryInput, keys, liveBloom, liveCuckoo]);

  const onDelete = useCallback(() => {
    const key = norm(deleteInput);
    if (!key) {
      setOperation('Delete: enter a non-empty item');
      return;
    }
    setBloomDeleteBlocked(true);
    setBloomVerdict({ kind: 'fail', text: 'Cannot delete' });
    setBloomFrames([]);
    setBloomIdx(-1);
    const { frames: cf, removed } = buildCuckooDeleteFrames(liveCuckoo, key);
    pendingRef.current = removed ? { type: 'delete', key } : null;
    setCkVerdict(removed ? { kind: 'ok', text: 'Removed' } : { kind: 'warn', text: 'Not stored' });
    setOperation(
      removed
        ? `Delete "${key}": Bloom can't delete, Cuckoo removes the fingerprint`
        : `Delete "${key}": not stored in the Cuckoo filter`
    );
    setCkFrames(cf);
    setCkIdx(0);
  }, [deleteInput, liveCuckoo]);

  const onDefaults = useCallback(() => {
    setKeys([...INITIAL_KEYS]);
    setBloomFrames([]);
    setBloomIdx(-1);
    setCkFrames([]);
    setCkIdx(-1);
    pendingRef.current = null;
    setBloomVerdict(null);
    setCkVerdict(null);
    setBloomDeleteBlocked(false);
    setOperation('Reloaded default items');
  }, []);

  const onReset = useCallback(() => {
    setKeys([]);
    setBloomFrames([]);
    setBloomIdx(-1);
    setCkFrames([]);
    setCkIdx(-1);
    pendingRef.current = null;
    setBloomVerdict(null);
    setCkVerdict(null);
    setBloomDeleteBlocked(false);
    setOperation('Both filters cleared');
  }, []);

  const bloomBitsSet = useMemo(() => renderBloom.reduce((a, b) => a + (b ? 1 : 0), 0), [renderBloom]);
  const bloomFpr = useMemo(() => {
    const n = keys.length;
    if (n === 0) return 0;
    const p = Math.pow(1 - 1 / BLOOM_M, BLOOM_K * n);
    return Math.pow(1 - p, BLOOM_K);
  }, [keys.length]);

  const ckOccupied = useMemo(
    () => renderCuckoo.reduce((a, b) => a + b.filter(Boolean).length, 0),
    [renderCuckoo]
  );
  const ckTotal = NUM_BUCKETS * SLOTS_PER_BUCKET;
  const ckLoad = ckOccupied / ckTotal;

  const bloomLabel = bloomFrame ? bloomFrame.label : null;
  const ckLabel = ckFrame ? ckFrame.label : null;
  const opLabel = bloomLabel || ckLabel || operation;

  const bloomActive = bloomFrame ? new Set(bloomFrame.activeBits) : new Set();
  const bloomPending = bloomFrame ? new Set(bloomFrame.pendingBits) : new Set();
  const bloomChecked = new Map();
  if (bloomFrame && bloomFrame.checked) for (const c of bloomFrame.checked) bloomChecked.set(c.h, c.ok);

  return (
    <div className="bvc-root">
      <div className="bvc-head">
        <h3 className="bvc-title">Bloom filter vs Cuckoo filter</h3>
        <p className="bvc-sub">
          Both answer set membership in tiny space. A Bloom filter flips k bits and can never
          delete; a Cuckoo filter stores short fingerprints in two candidate buckets, kicks
          occupants when full, and deletes by removing a matching fingerprint.
        </p>
      </div>

      <div className="bvc-controls">
        <div className="bvc-control-group">
          <label className="bvc-input-label" htmlFor="bvc-insert">
            Insert
          </label>
          <input
            id="bvc-insert"
            type="text"
            value={insertInput}
            onChange={(e) => setInsertInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInsert();
            }}
            className="bvc-input"
            placeholder="item"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="bvc-btn bvc-btn-primary" onClick={onInsert}>
            <Plus size={14} /> Insert
          </button>
        </div>

        <div className="bvc-control-group">
          <label className="bvc-input-label" htmlFor="bvc-query">
            Query
          </label>
          <input
            id="bvc-query"
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onQuery();
            }}
            className="bvc-input"
            placeholder="item"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="bvc-btn bvc-btn-accent" onClick={onQuery}>
            <Search size={14} /> Query
          </button>
        </div>

        <div className="bvc-control-group">
          <label className="bvc-input-label" htmlFor="bvc-delete">
            Delete
          </label>
          <input
            id="bvc-delete"
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onDelete();
            }}
            className="bvc-input"
            placeholder="item"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="bvc-btn bvc-btn-warn" onClick={onDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>

        <div className="bvc-control-spacer" />

        <button type="button" className="bvc-btn" onClick={onDefaults}>
          Defaults
        </button>
        <button type="button" className="bvc-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="bvc-panes">
        <div className="bvc-pane">
          <div className="bvc-pane-head">
            <span className="bvc-pane-title">Bloom filter</span>
            {bloomVerdict && (
              <span className={`bvc-pill bvc-pill-${bloomVerdict.kind}`}>
                {bloomVerdict.kind === 'fp' && <AlertTriangle size={11} />}
                {bloomVerdict.kind === 'fail' && bloomDeleteBlocked && <Ban size={11} />}
                {bloomVerdict.text}
              </span>
            )}
          </div>

          {bloomDeleteBlocked && (
            <div className="bvc-block-banner">
              <Ban size={14} />
              Bloom filters can&apos;t delete: clearing shared bits would create false negatives.
            </div>
          )}

          <div className="bvc-stage">
            <svg
              className="bvc-svg"
              viewBox={`0 0 ${BLOOM_W} ${BLOOM_H}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Bloom filter bit array"
            >
              {Array.from({ length: BLOOM_M }).map((_, idx) => {
                const { x, y } = bloomCellPos(idx);
                const on = renderBloom[idx];
                const isActive = bloomActive.has(idx);
                const isPending = bloomPending.has(idx);
                const checkRes = bloomChecked.has(idx) ? bloomChecked.get(idx) : null;
                const cls = [
                  'bvc-cell',
                  on ? 'bvc-cell-on' : 'bvc-cell-off',
                  isActive ? 'bvc-cell-active' : '',
                  isPending ? 'bvc-cell-pending' : '',
                  checkRes === true ? 'bvc-cell-hit' : '',
                  checkRes === false ? 'bvc-cell-miss' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <g key={`bb-${idx}`} className={cls}>
                    <text x={x + BLOOM_CELL / 2} y={y - 6} textAnchor="middle" className="bvc-cell-idx">
                      {idx}
                    </text>
                    <rect x={x} y={y} width={BLOOM_CELL} height={BLOOM_CELL} rx={6} className="bvc-cell-box" />
                    <text
                      x={x + BLOOM_CELL / 2}
                      y={y + BLOOM_CELL / 2 + 5}
                      textAnchor="middle"
                      className="bvc-cell-val"
                    >
                      {on ? '1' : '0'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="bvc-pane-stats">
            <div className="bvc-stat">
              <span className="bvc-stat-label">Items</span>
              <span className="bvc-stat-value">{keys.length}</span>
            </div>
            <div className="bvc-stat">
              <span className="bvc-stat-label">Bits set</span>
              <span className="bvc-stat-value">
                {bloomBitsSet} / {BLOOM_M}
              </span>
            </div>
            <div className="bvc-stat">
              <span className="bvc-stat-label">Theoretical FPR</span>
              <span className="bvc-stat-value">{(bloomFpr * 100).toFixed(2)}%</span>
            </div>
            <div className="bvc-stat">
              <span className="bvc-stat-label">Delete support</span>
              <span className="bvc-stat-value bvc-stat-no">
                <Ban size={12} /> No
              </span>
            </div>
          </div>
        </div>

        <div className="bvc-pane">
          <div className="bvc-pane-head">
            <span className="bvc-pane-title">Cuckoo filter</span>
            {ckVerdict && (
              <span className={`bvc-pill bvc-pill-${ckVerdict.kind}`}>
                {ckVerdict.kind === 'ok' && <Check size={11} />}
                {ckVerdict.kind === 'fail' && <AlertTriangle size={11} />}
                {ckVerdict.text}
              </span>
            )}
          </div>

          <div className="bvc-stage">
            <svg
              className="bvc-svg"
              viewBox={`0 0 ${CK_W} ${CK_H}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Cuckoo filter buckets"
            >
              {renderCuckoo.map((bucket, bIdx) => {
                const y = ckRowY(bIdx);
                const isActive = ckFrame && ckFrame.activeBucket === bIdx;
                const isAlt = ckFrame && ckFrame.altBucket === bIdx;
                const rowCls = [
                  'bvc-ck-row',
                  isActive ? 'bvc-ck-row-active' : '',
                  isAlt ? 'bvc-ck-row-alt' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <g key={`ckr-${bIdx}`} className={rowCls}>
                    <text x={CK_PAD_X + CK_LABEL_W - 8} y={y + CK_SLOT_H / 2 + 4} textAnchor="end" className="bvc-ck-idx">
                      {bIdx}
                    </text>
                    {bucket.map((slot, sIdx) => {
                      const x = ckSlotX(sIdx);
                      const placed =
                        ckFrame && ckFrame.placedAt && ckFrame.placedAt.idx === bIdx && ckFrame.placedAt.slot === sIdx;
                      const removed =
                        ckFrame && ckFrame.removedAt && ckFrame.removedAt.idx === bIdx && ckFrame.removedAt.slot === sIdx;
                      const matched =
                        ckFrame && ckFrame.matchSlot && ckFrame.matchSlot.idx === bIdx && slot && slot.fp === ckFrame.matchSlot.fp;
                      const slotCls = [
                        'bvc-ck-slot',
                        slot ? 'bvc-ck-slot-full' : 'bvc-ck-slot-empty',
                        placed ? 'bvc-ck-slot-placed' : '',
                        removed ? 'bvc-ck-slot-removed' : '',
                        matched ? 'bvc-ck-slot-match' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <g key={`cks-${bIdx}-${sIdx}`} className={slotCls}>
                          <rect x={x} y={y} width={CK_SLOT_W} height={CK_SLOT_H} rx={4} className="bvc-ck-box" />
                          <text x={x + CK_SLOT_W / 2} y={y + CK_SLOT_H / 2 + 4} textAnchor="middle" className="bvc-ck-fp">
                            {slot ? slot.fp : ''}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
              {ckFrame && ckFrame.flyingFp && (
                <g className="bvc-ck-flying">
                  <rect
                    x={CK_W / 2 - 24}
                    y={CK_H - 16}
                    width={48}
                    height={14}
                    rx={4}
                    className="bvc-ck-fly-box"
                  />
                  <text x={CK_W / 2} y={CK_H - 5} textAnchor="middle" className="bvc-ck-fly-fp">
                    {ckFrame.flyingFp}
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="bvc-pane-stats">
            <div className="bvc-stat">
              <span className="bvc-stat-label">Items</span>
              <span className="bvc-stat-value">{keys.length}</span>
            </div>
            <div className="bvc-stat">
              <span className="bvc-stat-label">Occupied slots</span>
              <span className="bvc-stat-value">
                {ckOccupied} / {ckTotal}
              </span>
            </div>
            <div className="bvc-stat">
              <span className="bvc-stat-label">Load factor</span>
              <span className="bvc-stat-value">{ckLoad.toFixed(3)}</span>
            </div>
            <div className="bvc-stat">
              <span className="bvc-stat-label">Delete support</span>
              <span className="bvc-stat-value bvc-stat-yes">
                <Check size={12} /> Yes
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bvc-key-row">
        <span className="bvc-key-row-label">Items ({keys.length})</span>
        <div className="bvc-key-chips">
          {keys.length === 0 && <span className="bvc-key-empty">Empty</span>}
          {keys.map((kk, idx) => (
            <span key={`${kk}-${idx}`} className="bvc-key-chip">
              {kk}
            </span>
          ))}
        </div>
      </div>

      <div className="bvc-footer">
        <div className="bvc-stat bvc-stat-grow">
          <span className="bvc-stat-label">Current operation</span>
          <span className="bvc-stat-value">{opLabel}</span>
        </div>
      </div>
    </div>
  );
}
