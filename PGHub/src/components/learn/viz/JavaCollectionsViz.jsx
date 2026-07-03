import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layers, Play, Pause, SkipForward, RotateCcw, List, Hash, Boxes } from 'lucide-react';
import './JavaCollectionsViz.css';

const NB = 4; // fixed bucket count so hashes are deterministic

function strHash(s) {
  let acc = 0;
  for (let i = 0; i < s.length; i += 1) acc += s.charCodeAt(i);
  return acc;
}

const MODES = {
  arraylist: {
    label: 'ArrayList',
    Icon: List,
    hue: 'is-list',
    title: 'ArrayList — contiguous, indexed',
    sub: 'A List backs an ordered shelf with one contiguous array, so get(i) jumps straight to a slot in O(1).',
    steps: [
      { op: 'add("ann")', kind: 'add', idx: 0, val: 'ann' },
      { op: 'add("bob")', kind: 'add', idx: 1, val: 'bob' },
      { op: 'add("cy")', kind: 'add', idx: 2, val: 'cy' },
      { op: 'add("dee")', kind: 'add', idx: 3, val: 'dee' },
      { op: 'get(2)', kind: 'get', idx: 2, val: 'cy' },
    ],
  },
  hashmap: {
    label: 'HashMap',
    Icon: Hash,
    hue: 'is-map',
    title: 'HashMap — key to bucket via hashCode',
    sub: 'A Map hashes each key to a bucket, chaining on collision. get(key) re-hashes and lands O(1) on average.',
    steps: [
      { op: 'put("cat", 3)', kind: 'put', key: 'cat', val: 3 },
      { op: 'put("cow", 5)', kind: 'put', key: 'cow', val: 5 },
      { op: 'put("fox", 9)', kind: 'put', key: 'fox', val: 9 },
      { op: 'get("cow")', kind: 'get', key: 'cow' },
    ],
  },
  hashset: {
    label: 'HashSet',
    Icon: Boxes,
    hue: 'is-set',
    title: 'HashSet — unique members, no duplicates',
    sub: 'A Set hashes each value to a bucket. Adding a value already in its bucket is rejected — the size stays put.',
    steps: [
      { op: 'add(7)', kind: 'add', val: 7 },
      { op: 'add(3)', kind: 'add', val: 3 },
      { op: 'add(7)', kind: 'add', val: 7 },
      { op: 'contains(3)', kind: 'contains', val: 3 },
    ],
  },
};

function bucketOf(mode, s) {
  if (mode === 'hashmap') return strHash(s.key) % NB;
  return s.val % NB; // hashset
}

// Replay bucket state up to (but not including) `upto` steps.
function replayBuckets(mode, steps, upto) {
  const buckets = Array.from({ length: NB }, () => []);
  for (let i = 0; i < upto; i += 1) {
    const s = steps[i];
    const b = bucketOf(mode, s);
    if (mode === 'hashmap' && s.kind === 'put') {
      const hit = buckets[b].find((e) => e.key === s.key);
      if (hit) hit.val = s.val;
      else buckets[b].push({ key: s.key, val: s.val });
    } else if (mode === 'hashset' && s.kind === 'add') {
      if (!buckets[b].some((e) => e.val === s.val)) buckets[b].push({ val: s.val });
    }
  }
  return buckets;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const W = 760;
const H = 340;

export default function JavaCollectionsViz() {
  const [mode, setMode] = useState('arraylist');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const conf = MODES[mode];
  const steps = conf.steps;
  const total = steps.length;
  const finished = step >= total;
  const showPause = playing && step < total;
  const cur = step > 0 ? steps[step - 1] : null;

  function pickMode(m) {
    setMode(m);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    const base = reduced() ? 360 : 1250;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), base / speed);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, mode, speed]);

  // ---- derived render state ----
  const isArray = mode === 'arraylist';
  const curBucket = cur && cur.kind !== undefined && !isArray ? bucketOf(mode, cur) : null;

  const buckets = useMemo(
    () => (isArray ? null : replayBuckets(mode, steps, step)),
    [isArray, mode, steps, step],
  );

  const listCells = useMemo(() => {
    if (!isArray) return [];
    return steps.slice(0, step).filter((s) => s.kind === 'add');
  }, [isArray, steps, step]);

  // duplicate rejected? (hashset re-add of an existing value)
  const curRejected = useMemo(() => {
    if (isArray || mode !== 'hashset' || !cur || cur.kind !== 'add') return false;
    const prev = replayBuckets(mode, steps, step - 1);
    return prev[cur.val % NB].some((e) => e.val === cur.val);
  }, [isArray, mode, cur, steps, step]);

  const size = useMemo(() => {
    if (isArray) return listCells.length;
    return buckets.reduce((n, b) => n + b.length, 0);
  }, [isArray, listCells, buckets]);

  // readout fields
  let hashKey = 'index';
  let hashVal = '—';
  let bucketVal = '—';
  if (cur) {
    if (isArray) {
      hashKey = 'index';
      hashVal = String(cur.idx);
      bucketVal = `slot ${cur.idx}`;
    } else if (mode === 'hashmap') {
      hashKey = 'hashCode';
      hashVal = String(strHash(cur.key));
      bucketVal = `bucket ${curBucket}`;
    } else {
      hashKey = 'value % 4';
      hashVal = String(cur.val % NB);
      bucketVal = `bucket ${curBucket}`;
    }
  }

  let note = 'pick a collection and press Step or Play to watch each operation land.';
  if (cur) {
    if (isArray) {
      note = cur.kind === 'add'
        ? `add appends "${cur.val}" to the next open slot, index ${cur.idx} — O(1) at the end.`
        : `get(${cur.idx}) computes base + ${cur.idx} x width and reads one cell — "${cur.val}", O(1).`;
    } else if (mode === 'hashmap') {
      if (cur.kind === 'put') {
        note = curBucket !== null && buckets[curBucket].length > 1
          ? `hashCode("${cur.key}") lands in bucket ${curBucket}, already occupied — chain the new entry in.`
          : `hashCode("${cur.key}") % 4 = bucket ${curBucket}; store the key=value pair there.`;
      } else {
        note = `get("${cur.key}") re-hashes to bucket ${curBucket} and walks the short chain — O(1) average.`;
      }
    } else if (curRejected) {
      note = `${cur.val} already sits in bucket ${curBucket} — the add is REJECTED, size stays ${size}.`;
    } else if (cur.kind === 'add') {
      note = buckets[curBucket].length > 1
        ? `${cur.val} hashes to bucket ${curBucket}, already used by another value — chain it in (a collision, not a duplicate).`
        : `${cur.val} hashes to bucket ${curBucket}, empty — store it, size now ${size}.`;
    } else {
      note = `contains(${cur.val}) hashes to bucket ${curBucket} and checks just that one bucket — O(1) average.`;
    }
  }

  // ---- SVG geometry ----
  const cellH = 68;
  const nSlots = 4;
  const slotW = 150;
  const rowH = 66;
  const bucketX = 46;
  const bucketW = 72;
  const entryX = 168;
  const entryW = 132;

  return (
    <div className="javacoll">
      <div className="javacoll-head">
        <div className="javacoll-head-icon"><Layers size={18} /></div>
        <div className="javacoll-head-text">
          <h3 className="javacoll-title">{conf.title}</h3>
          <p className="javacoll-sub">{conf.sub}</p>
        </div>
        <button type="button" className="javacoll-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="javacoll-tabs">
        {Object.entries(MODES).map(([key, m]) => {
          const TabIcon = m.Icon;
          return (
            <button
              key={key}
              type="button"
              className={`javacoll-tab ${m.hue}${mode === key ? ' is-active' : ''}`}
              onClick={() => pickMode(key)}
            >
              <TabIcon size={14} /> {m.label}
            </button>
          );
        })}
      </div>

      <div className="javacoll-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="javacoll-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="javacoll-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M1,1 L8,4.5 L1,8 Z" className="javacoll-arrowfill" />
            </marker>
          </defs>

          {isArray && (
            <g>
              <text x={W / 2} y={40} className="javacoll-axis" textAnchor="middle">
                contiguous backing array — one cell per index
              </text>
              {Array.from({ length: nSlots }, (_, i) => {
                const cell = listCells[i];
                const x = (W - nSlots * slotW) / 2 + i * slotW;
                const y = 120;
                const isHit = cur && cur.idx === i && (cur.kind === 'get' || (cur.kind === 'add' && i === step - 1));
                return (
                  <g key={`slot-${i}`} className={`javacoll-slot ${conf.hue}${cell ? ' is-filled' : ''}${isHit ? ' is-hit' : ''}`}>
                    <rect x={x + 6} y={y} width={slotW - 12} height={cellH} rx={9} className="javacoll-slot-rect" />
                    <text x={x + slotW / 2} y={y + cellH / 2 + 5} className="javacoll-slot-val" textAnchor="middle">
                      {cell ? `"${cell.val}"` : ''}
                    </text>
                    <text x={x + slotW / 2} y={y + cellH + 22} className="javacoll-slot-idx" textAnchor="middle">
                      index {i}
                    </text>
                  </g>
                );
              })}
              {cur && cur.kind === 'get' && (
                <g className="javacoll-getptr">
                  <line
                    x1={(W - nSlots * slotW) / 2 + cur.idx * slotW + slotW / 2}
                    y1={92}
                    x2={(W - nSlots * slotW) / 2 + cur.idx * slotW + slotW / 2}
                    y2={116}
                    className="javacoll-getptr-line"
                    markerEnd="url(#javacoll-arrow)"
                  />
                  <text
                    x={(W - nSlots * slotW) / 2 + cur.idx * slotW + slotW / 2}
                    y={84}
                    className="javacoll-getptr-label"
                    textAnchor="middle"
                  >
                    get({cur.idx})
                  </text>
                </g>
              )}
            </g>
          )}

          {!isArray && (
            <g>
              <text x={W / 2} y={30} className="javacoll-axis" textAnchor="middle">
                bucket array — {mode === 'hashmap' ? 'hashCode(key)' : 'value'} % 4 picks a bucket
              </text>
              {buckets.map((entries, b) => {
                const y = 52 + b * rowH;
                const active = curBucket === b;
                return (
                  <g key={`bkt-${b}`} className={`javacoll-bkt ${conf.hue}${active ? ' is-active' : ''}`}>
                    <rect x={bucketX} y={y} width={bucketW} height={rowH - 14} rx={8} className="javacoll-bkt-rect" />
                    <text x={bucketX + bucketW / 2} y={y + (rowH - 14) / 2 + 5} className="javacoll-bkt-label" textAnchor="middle">
                      b{b}
                    </text>
                    <line
                      x1={bucketX + bucketW}
                      y1={y + (rowH - 14) / 2}
                      x2={entryX - 6}
                      y2={y + (rowH - 14) / 2}
                      className="javacoll-bkt-link"
                      markerEnd="url(#javacoll-arrow)"
                    />
                    {entries.map((e, j) => {
                      const ex = entryX + j * (entryW + 22);
                      const isNew = active && cur && cur.kind !== 'get' && cur.kind !== 'contains'
                        && j === entries.length - 1;
                      const txt = mode === 'hashmap' ? `${e.key}=${e.val}` : String(e.val);
                      return (
                        <g key={`e-${b}-${j}`} className={`javacoll-entry${isNew ? ' is-new' : ''}`}>
                          {j > 0 && (
                            <line
                              x1={ex - 22}
                              y1={y + (rowH - 14) / 2}
                              x2={ex - 4}
                              y2={y + (rowH - 14) / 2}
                              className="javacoll-chain"
                              markerEnd="url(#javacoll-arrow)"
                            />
                          )}
                          <rect x={ex} y={y + 4} width={entryW} height={rowH - 22} rx={7} className="javacoll-entry-rect" />
                          <text x={ex + entryW / 2} y={y + (rowH - 14) / 2 + 5} className="javacoll-entry-val" textAnchor="middle">
                            {txt}
                          </text>
                        </g>
                      );
                    })}
                    {active && curRejected && (
                      <text x={entryX + entries.length * (entryW + 22)} y={y + (rowH - 14) / 2 + 5} className="javacoll-reject" textAnchor="start">
                        already present -&gt; rejected
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="javacoll-controls">
        <button type="button" className="javacoll-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="javacoll-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <span className="javacoll-progress">{step} / {total}</span>
        <label className="javacoll-speed">
          <span className="javacoll-speed-label">speed</span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="javacoll-speed-range"
          />
          <span className="javacoll-speed-val">{speed}x</span>
        </label>
        <code className="javacoll-curline">{cur ? cur.op : conf.steps[0].op}</code>
      </div>

      <div className="javacoll-readout">
        <div className={`javacoll-stat ${cur ? conf.hue : 'is-empty'}`}>
          <span className="javacoll-stat-key">op</span>
          <span className="javacoll-stat-val">{cur ? cur.kind : '—'}</span>
        </div>
        <div className={`javacoll-stat ${cur ? conf.hue : 'is-empty'}`}>
          <span className="javacoll-stat-key">{hashKey}</span>
          <span className="javacoll-stat-val">{hashVal}</span>
        </div>
        <div className={`javacoll-stat ${cur ? conf.hue : 'is-empty'}`}>
          <span className="javacoll-stat-key">{isArray ? 'target' : 'lands in'}</span>
          <span className="javacoll-stat-val">{cur ? bucketVal : '—'}</span>
        </div>
        <div className="javacoll-stat is-size">
          <span className="javacoll-stat-key">size</span>
          <span className="javacoll-stat-val">{size}</span>
        </div>
      </div>

      <div className="javacoll-note">
        <span className="javacoll-note-label">now</span>
        <span className="javacoll-note-body">{note}</span>
      </div>
    </div>
  );
}
