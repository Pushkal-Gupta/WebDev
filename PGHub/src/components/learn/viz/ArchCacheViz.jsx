import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Database, Play, Pause, SkipForward, RotateCcw, Target, XCircle } from 'lucide-react';
import './ArchCacheViz.css';

// 8-bit address space. Block size 4 bytes (2 offset bits), 4 sets (2 index bits),
// remaining 4 bits are the tag:  [ TAG:4 | INDEX:2 | OFFSET:2 ]
const ADDR_BITS = 8;
const OFF_BITS = 2;
const IDX_BITS = 2;
const TAG_BITS = ADDR_BITS - IDX_BITS - OFF_BITS;
const SETS = 1 << IDX_BITS;

// Crafted stream: alternating tags collide on the same set in direct-mapped
// (conflict misses) but coexist in a 2-way set. 0x05 shares 0x04's block to
// show a spatial-locality hit that lands in BOTH organizations.
const STREAM = [0x04, 0x05, 0x24, 0x04, 0x24, 0x08, 0x28, 0x08, 0x28, 0x04];

const hx = (n) => `0x${n.toString(16).toUpperCase().padStart(2, '0')}`;
const bin = (n, bits) => n.toString(2).padStart(bits, '0');

const MODES = [
  { id: 1, label: 'Direct-mapped (1 way)' },
  { id: 2, label: '2-way set-associative' },
];

function emptyCache(ways) {
  return Array.from({ length: SETS }, () =>
    Array.from({ length: ways }, () => ({ valid: false, tag: null, lru: 0 })));
}

// Deterministic simulation with explicit LRU counter (no Math.random).
function simulate(ways) {
  const sets = emptyCache(ways);
  let hits = 0;
  let clock = 0;
  const records = [];
  STREAM.forEach((addr) => {
    clock += 1;
    const offset = addr & ((1 << OFF_BITS) - 1);
    const index = (addr >> OFF_BITS) & ((1 << IDX_BITS) - 1);
    const tag = (addr >> (OFF_BITS + IDX_BITS)) & ((1 << TAG_BITS) - 1);
    const set = sets[index];

    let outcome; let way; let evicted = null;
    const matchWay = set.findIndex((w) => w.valid && w.tag === tag);
    if (matchWay >= 0) {
      outcome = 'hit';
      way = matchWay;
      hits += 1;
      set[matchWay].lru = clock;
    } else {
      outcome = 'miss';
      const free = set.findIndex((w) => !w.valid);
      if (free >= 0) {
        way = free;
      } else {
        let lruWay = 0;
        for (let i = 1; i < set.length; i += 1) {
          if (set[i].lru < set[lruWay].lru) lruWay = i;
        }
        way = lruWay;
        evicted = { tag: set[way].tag, index };
      }
      set[way] = { valid: true, tag, lru: clock };
    }

    records.push({
      addr, tag, index, offset, outcome, way, evicted,
      hits, accesses: records.length + 1,
      snapshot: sets.map((s) => s.map((w) => ({ ...w }))),
    });
  });
  return records;
}

const W = 760;
const H = 306;

// grid geometry
const GX = 24;
const HEAD_Y = 52;
const ROW_Y0 = 60;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ArchCacheViz() {
  const [ways, setWays] = useState(2);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const records = useMemo(() => simulate(ways), [ways]);
  const total = records.length;

  function pickMode(id) {
    setWays(id);
    setStep(0);
    setPlaying(false);
  }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s2) => Math.min(total, s2 + 1)),
      Math.round((reduced() ? 360 : 950) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const finished = step >= total;
  const showPause = playing && step < total;

  const cur = step > 0 ? records[step - 1] : null;
  const snapshot = cur ? cur.snapshot : emptyCache(ways);
  const preview = cur || records[0];

  const accesses = step;
  const hitCount = cur ? cur.hits : 0;
  const missCount = accesses - hitCount;
  const hitRate = accesses > 0 ? Math.round((hitCount / accesses) * 100) : 0;

  const rowH = ways === 1 ? 42 : 26;
  const setBlockH = rowH * ways;

  // LRU-victim way per set (lowest lru among valid ways) — only meaningful for >1 way
  function lruWayOf(setArr) {
    let best = -1; let bestLru = Infinity;
    setArr.forEach((w, i) => {
      if (w.valid && w.lru < bestLru) { bestLru = w.lru; best = i; }
    });
    return best;
  }

  const bitFields = []; // per bit: field name for coloring
  for (let i = 0; i < ADDR_BITS; i += 1) {
    if (i < TAG_BITS) bitFields.push('tag');
    else if (i < TAG_BITS + IDX_BITS) bitFields.push('idx');
    else bitFields.push('off');
  }
  const addrBin = bin(preview.addr, ADDR_BITS);

  const setCenterY = cur ? ROW_Y0 + cur.index * setBlockH + setBlockH / 2 : null;

  return (
    <div className="archcache">
      <div className="archcache-head">
        <div className="archcache-head-icon"><Database size={18} /></div>
        <div className="archcache-head-text">
          <h3 className="archcache-title">Cache lookups: tag, index &amp; the LRU race</h3>
          <p className="archcache-sub">
            Each address splits into tag, index and offset. The index picks a set; the tag is
            compared against the resident line(s). A direct-mapped cache thrashes on conflicts a
            2-way set absorbs.
          </p>
        </div>
        <button type="button" className="archcache-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="archcache-chips">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`archcache-chip${m.id === ways ? ' is-active' : ''}`}
            onClick={() => pickMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="archcache-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="archcache-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="archcache-ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" className="archcache-ah" />
            </marker>
          </defs>

          {/* column headers */}
          <text x={GX + 23} y={HEAD_Y} className="archcache-colh" textAnchor="middle">index</text>
          <text x={GX + 92} y={HEAD_Y} className="archcache-colh" textAnchor="middle">valid</text>
          <text x={GX + 151} y={HEAD_Y} className="archcache-colh" textAnchor="middle">tag</text>
          <text x={GX + 246} y={HEAD_Y} className="archcache-colh" textAnchor="middle">data (block)</text>

          {/* connector from decomposition panel to the active set */}
          {cur && (
            <line
              x1={340}
              y1={setCenterY}
              x2={GX + 306}
              y2={setCenterY}
              className="archcache-connect"
              markerEnd="url(#archcache-ah)"
            />
          )}

          {/* cache grid */}
          {snapshot.map((setArr, si) => {
            const victim = ways > 1 ? lruWayOf(setArr) : -1;
            const setTop = ROW_Y0 + si * setBlockH;
            const activeSet = cur && cur.index === si;
            return (
              <g key={si}>
                {/* index cell spanning the set's ways */}
                <rect
                  x={GX}
                  y={setTop}
                  width={46}
                  height={setBlockH}
                  rx={7}
                  className={`archcache-idxcell${activeSet ? ' is-on' : ''}`}
                />
                <text x={GX + 23} y={setTop + setBlockH / 2 + 4} textAnchor="middle" className="archcache-idxnum">
                  {si}
                </text>
                {setArr.map((w, wi) => {
                  const rowTop = setTop + wi * rowH;
                  const cy = rowTop + rowH / 2;
                  const isTarget = cur && cur.index === si && cur.way === wi;
                  const hitRow = isTarget && cur.outcome === 'hit';
                  const loadRow = isTarget && cur.outcome === 'miss';
                  const block = w.valid ? hx((w.tag << (IDX_BITS + OFF_BITS)) | (si << OFF_BITS)) : '—';
                  let rowCls = 'archcache-line';
                  if (hitRow) rowCls += ' is-hit';
                  else if (loadRow) rowCls += ' is-load';
                  else if (!w.valid) rowCls += ' is-empty';
                  return (
                    <g key={wi} className={rowCls}>
                      <rect x={GX + 50} y={rowTop + 2} width={256} height={rowH - 4} rx={6} className="archcache-linebox" />
                      {/* valid bit */}
                      <text x={GX + 92} y={cy + 4} textAnchor="middle" className="archcache-cellv">
                        {w.valid ? '1' : '0'}
                      </text>
                      {/* tag */}
                      <text x={GX + 151} y={cy + 4} textAnchor="middle" className="archcache-cellt">
                        {w.valid ? hx(w.tag) : '—'}
                      </text>
                      {/* data block */}
                      <text x={GX + 246} y={cy + 4} textAnchor="middle" className="archcache-celld">
                        {block}
                      </text>
                      {/* LRU victim marker */}
                      {ways > 1 && w.valid && wi === victim && (
                        <text x={GX + 300} y={cy + 4} textAnchor="end" className="archcache-lru">LRU</text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* address decomposition panel */}
          <g className="archcache-panel">
            <rect x={340} y={ROW_Y0 - 8} width={396} height={168} rx={11} className="archcache-panelbox" />
            <text x={356} y={ROW_Y0 + 12} className="archcache-paneltitle">address {hx(preview.addr)}</text>

            {/* bit boxes */}
            {addrBin.split('').map((b, i) => {
              const bx = 356 + i * 26;
              return (
                <g key={i} className={`archcache-bit is-${bitFields[i]}`}>
                  <rect x={bx} y={ROW_Y0 + 26} width={22} height={30} rx={5} className="archcache-bitbox" />
                  <text x={bx + 11} y={ROW_Y0 + 46} textAnchor="middle" className="archcache-bitv">{b}</text>
                </g>
              );
            })}
            {/* field brackets */}
            <text x={356 + (TAG_BITS * 26) / 2} y={ROW_Y0 + 74} textAnchor="middle" className="archcache-fieldlbl is-tag">TAG</text>
            <text x={356 + TAG_BITS * 26 + (IDX_BITS * 26) / 2} y={ROW_Y0 + 74} textAnchor="middle" className="archcache-fieldlbl is-idx">INDEX</text>
            <text x={356 + (TAG_BITS + IDX_BITS) * 26 + (OFF_BITS * 26) / 2} y={ROW_Y0 + 74} textAnchor="middle" className="archcache-fieldlbl is-off">OFFSET</text>

            {/* decoded values */}
            <text x={356} y={ROW_Y0 + 104} className="archcache-decode">
              tag <tspan className="archcache-decv is-tag">{hx(preview.tag)}</tspan>
              {'   '}index <tspan className="archcache-decv is-idx">{preview.index}</tspan>
              {'   '}offset <tspan className="archcache-decv is-off">{preview.offset}</tspan>
            </text>
            <text x={356} y={ROW_Y0 + 126} className="archcache-decode">
              → maps to set <tspan className="archcache-decv is-idx">{preview.index}</tspan>
            </text>

            {/* outcome badge */}
            {cur && (
              <text
                x={720}
                y={ROW_Y0 + 12}
                textAnchor="end"
                className={`archcache-verdict ${cur.outcome === 'hit' ? 'is-hit' : 'is-miss'}`}
              >
                {cur.outcome === 'hit' ? 'HIT' : 'MISS'}
              </text>
            )}
            {cur && cur.evicted && (
              <text x={720} y={ROW_Y0 + 126} textAnchor="end" className="archcache-evict">
                evict tag {hx(cur.evicted.tag)}
              </text>
            )}
          </g>
        </svg>
      </div>

      {/* reference stream track */}
      <div className="archcache-stream">
        <span className="archcache-stream-label">stream</span>
        {STREAM.map((addr, i) => {
          const done = i < step;
          const rec = records[i];
          let cls = 'archcache-tok';
          if (i === step - 1) cls += ' is-cur';
          if (done) cls += rec.outcome === 'hit' ? ' is-hit' : ' is-miss';
          return <span key={i} className={cls}>{hx(addr)}</span>;
        })}
      </div>

      <div className="archcache-controls">
        <button type="button" className="archcache-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}
          {showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="archcache-btn" onClick={() => setStep((x) => Math.min(total, x + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="archcache-speed">
          <span className="archcache-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="archcache-speed-range"
          />
          <span className="archcache-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="archcache-progress">{step} / {total}</span>
      </div>

      <div className="archcache-readout">
        <div className="archcache-stat is-good">
          <Target size={13} />
          <span className="archcache-stat-label">hits</span>
          <span className="archcache-stat-val">{hitCount}</span>
        </div>
        <div className="archcache-stat is-bad">
          <XCircle size={13} />
          <span className="archcache-stat-label">misses</span>
          <span className="archcache-stat-val">{missCount}</span>
        </div>
        <div className="archcache-stat is-rate">
          <span className="archcache-stat-label">hit rate</span>
          <span className="archcache-stat-val">{hitRate}%</span>
        </div>
      </div>

      <div className="archcache-note">
        <span className="archcache-note-label">now</span>
        <span className="archcache-note-body">
          {cur
            ? `${hx(cur.addr)} → index ${cur.index}, tag ${hx(cur.tag)}: ${cur.outcome === 'hit'
              ? 'tag matched a valid line → HIT'
              : `no matching valid line → MISS${cur.evicted ? `, evicted LRU tag ${hx(cur.evicted.tag)}` : ''}, loaded tag ${hx(cur.tag)}`}`
            : 'press Step or Play to walk the reference stream through the cache'}
        </span>
      </div>
    </div>
  );
}
