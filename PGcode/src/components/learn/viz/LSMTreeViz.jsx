import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, MemoryStick, HardDrive, Layers, Search, ArrowDownToLine, Trash2 } from 'lucide-react';
import './LSMTreeViz.css';

// Log-Structured Merge tree.
//
// Writes are cheap and sequential: every put/delete lands in an in-memory
// MEMTABLE (a sorted map) plus the WAL for durability. The memtable never
// updates a key in place on disk — when it fills past a threshold it is FROZEN
// and FLUSHED as a new immutable SSTable at level L0. SSTables are sorted runs
// of key->value (a delete is a tombstone). Newer data lives in a newer SSTable,
// so reads must check sources newest-first: memtable -> L0 (newest first) ->
// L1 -> ... and stop at the first hit. That is read amplification.
//
// COMPACTION bounds the fan-out: when a level holds too many SSTables they are
// merge-sorted into ONE table at the next level. During the merge, for each key
// only the newest version survives, and a tombstone for a key drops both the
// tombstone and every older copy. So compaction reclaims space, removes deleted
// keys, and keeps reads from having to scan an unbounded pile of tables.

// A fixed script of operations over a few keys, sized so the reader sees two
// flushes and at least one compaction L0 -> L1 occur. `put` writes a value;
// `del` writes a tombstone; `read` runs the newest-first lookup; `flush` and
// `compact` are forced explicitly so stepping is legible.
const OPS = [
  { kind: 'put', key: 'b', val: 1 },
  { kind: 'put', key: 'd', val: 2 },
  { kind: 'flush' },               // memtable full -> L0 SSTable #1
  { kind: 'put', key: 'a', val: 3 },
  { kind: 'put', key: 'b', val: 4 },   // overwrites b=1 (older copy now stale)
  { kind: 'flush' },               // L0 SSTable #2
  { kind: 'put', key: 'c', val: 5 },
  { kind: 'del', key: 'd' },           // tombstone for d
  { kind: 'flush' },               // L0 SSTable #3
  { kind: 'put', key: 'e', val: 6 },
  { kind: 'put', key: 'f', val: 7 },
  { kind: 'flush' },               // L0 SSTable #4 -> L0 over threshold
  { kind: 'compact' },             // merge all L0 -> one L1 table, drop stale + tombstones
  { kind: 'read', key: 'b' },          // expect newest b = 4 (from compacted L1)
  { kind: 'read', key: 'd' },          // expect MISS (tombstoned, dropped in compaction)
];

const L0_THRESHOLD = 4; // L0 SSTables that trigger a compaction into L1

// Each SSTable: { id, level, seq, entries: [{ key, val, tomb }] sorted by key }.
// `seq` is a monotonic flush sequence — bigger seq = newer data = wins on read.
function sortEntries(entries) {
  return [...entries].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

// Build the entire step trace as immutable frames. Carried state:
//   mem      : sorted in-memory entries [{ key, val, tomb }]
//   levels   : { 0: [sstable...], 1: [...], ... } each sstable immutable
//   writeAmp : count of bytes-equivalent writes (mem flush + compaction rewrites)
//   logical  : count of logical user writes (put/del) — for write amplification
function buildFrames() {
  const frames = [];
  let mem = [];                 // [{ key, val, tomb }]
  const levels = { 0: [], 1: [], 2: [] };
  let nextId = 1;
  let nextSeq = 1;
  let logical = 0;              // user-issued writes
  let physical = 0;            // SSTable entries actually written to disk (flush + rewrite)

  const cloneLevels = (lv) => {
    const out = {};
    Object.keys(lv).forEach((k) => {
      out[k] = lv[k].map((t) => ({ ...t, entries: t.entries.map((e) => ({ ...e })) }));
    });
    return out;
  };

  const snap = (extra) => ({
    mem: mem.map((e) => ({ ...e })),
    levels: cloneLevels(levels),
    logical,
    physical,
    region: null,        // mem | l0 | l1 | compact
    activeKey: null,
    readKey: null,
    readPath: [],        // [{ where, hit, val, tomb }]
    readResult: null,    // { key, found, val }
    phase: 'run',
    note: '',
    ...extra,
  });

  // upsert a key into the sorted memtable (in-place semantics, newest wins).
  const memPut = (key, val, tomb) => {
    const idx = mem.findIndex((e) => e.key === key);
    if (idx >= 0) mem[idx] = { key, val, tomb };
    else mem.push({ key, val, tomb });
    mem = sortEntries(mem);
  };

  frames.push(snap({
    phase: 'init',
    note: 'Log-Structured Merge tree. Every write goes to a sorted in-memory MEMTABLE (and the WAL, for durability) — never an in-place disk update. When the memtable fills it is flushed as an immutable SSTable at L0. Reads check sources newest-first; compaction merges tables down a level to bound that work.',
  }));

  for (let i = 0; i < OPS.length; i += 1) {
    const op = OPS[i];

    if (op.kind === 'put') {
      logical += 1;
      memPut(op.key, op.val, false);
      frames.push(snap({
        region: 'mem', activeKey: op.key,
        note: `put ${op.key} = ${op.val}. The value lands in the in-memory memtable (kept sorted by key) and is appended to the WAL. No disk SSTable is touched — sequential in-memory writes are why LSM ingest is fast. If ${op.key} already existed in an old SSTable, that copy is now stale; reads will prefer this newer one.`,
      }));
    } else if (op.kind === 'del') {
      logical += 1;
      memPut(op.key, null, true);
      frames.push(snap({
        region: 'mem', activeKey: op.key,
        note: `delete ${op.key}. LSM never erases on disk; it writes a TOMBSTONE — a marker that says "${op.key} is gone as of now". The tombstone shadows every older copy of ${op.key} in lower SSTables until a future compaction physically drops them all.`,
      }));
    } else if (op.kind === 'flush') {
      if (mem.length === 0) continue;
      const entries = sortEntries(mem).map((e) => ({ ...e }));
      const table = { id: nextId, level: 0, seq: nextSeq, entries };
      nextId += 1; nextSeq += 1;
      physical += entries.length;
      levels[0] = [...levels[0], table];
      mem = [];
      frames.push(snap({
        region: 'l0', activeKey: null,
        note: `Memtable full -> FLUSH. The frozen memtable is written sequentially as one immutable SSTable (#${table.id}) at L0, holding [${entries.map((e) => (e.tomb ? `${e.key}:x` : `${e.key}=${e.val}`)).join(', ')}]. The memtable resets empty. L0 now holds ${levels[0].length} table${levels[0].length === 1 ? '' : 's'}.${levels[0].length >= L0_THRESHOLD ? ` That hits the L0 threshold (${L0_THRESHOLD}) — a compaction is due.` : ''}`,
      }));
    } else if (op.kind === 'compact') {
      // merge ALL L0 tables (newest seq wins) into one L1 table, dropping stale
      // duplicates and resolving tombstones (since L1 is the bottom here).
      const src = [...levels[0]].sort((a, b) => a.seq - b.seq); // oldest..newest
      const merged = new Map(); // key -> { key, val, tomb }
      src.forEach((t) => {
        t.entries.forEach((e) => { merged.set(e.key, { ...e }); }); // later (newer) overwrites
      });
      // bottom level: a tombstone with nothing below it can be discarded entirely.
      const liveEntries = sortEntries([...merged.values()].filter((e) => !e.tomb));
      const droppedTombs = [...merged.values()].filter((e) => e.tomb).map((e) => e.key);
      const inputCount = src.reduce((n, t) => n + t.entries.length, 0);
      const table = { id: nextId, level: 1, seq: nextSeq, entries: liveEntries };
      nextId += 1; nextSeq += 1;
      physical += liveEntries.length;
      levels[0] = [];
      levels[1] = [...levels[1], table];
      frames.push(snap({
        region: 'compact', activeKey: null,
        note: `COMPACTION: L0 had ${src.length} SSTables -> merge-sort them into one L1 table (#${table.id}). Across ${inputCount} input entries, only the newest version of each key survives${droppedTombs.length ? `, and tombstoned key${droppedTombs.length === 1 ? '' : 's'} [${droppedTombs.join(', ')}] plus every older copy are physically dropped` : ''}. Result: [${liveEntries.map((e) => `${e.key}=${e.val}`).join(', ')}]. L0 is now empty; reads get shorter.`,
      }));
    } else if (op.kind === 'read') {
      // newest-first lookup: memtable, then L0 newest->oldest, then L1, L2...
      const path = [];
      let result = null;
      // memtable first
      const inMem = mem.find((e) => e.key === op.key);
      if (inMem) {
        path.push({ where: 'memtable', hit: true, val: inMem.val, tomb: inMem.tomb });
        result = inMem.tomb ? { key: op.key, found: false } : { key: op.key, found: true, val: inMem.val };
      } else {
        path.push({ where: 'memtable', hit: false });
      }
      if (!result) {
        const order = [];
        // L0 newest-first (higher seq first), then L1, L2 in level order
        [...levels[0]].sort((a, b) => b.seq - a.seq).forEach((t) => order.push(t));
        [...levels[1]].sort((a, b) => b.seq - a.seq).forEach((t) => order.push(t));
        [...levels[2]].sort((a, b) => b.seq - a.seq).forEach((t) => order.push(t));
        for (let j = 0; j < order.length; j += 1) {
          const t = order[j];
          const hit = t.entries.find((e) => e.key === op.key);
          if (hit) {
            path.push({ where: `L${t.level} #${t.id}`, hit: true, val: hit.val, tomb: hit.tomb });
            result = hit.tomb ? { key: op.key, found: false } : { key: op.key, found: true, val: hit.val };
            break;
          }
          path.push({ where: `L${t.level} #${t.id}`, hit: false });
        }
        if (!result) result = { key: op.key, found: false };
      }
      const probes = path.length;
      const summary = result.found
        ? `found ${op.key} = ${result.val}`
        : `${op.key} not present (miss${path.some((p) => p.tomb) ? ' via tombstone' : ''})`;
      frames.push(snap({
        region: 'mem', readKey: op.key, readPath: path, readResult: result, phase: 'read',
        note: `READ ${op.key}. Check sources newest-first and stop at the first hit: ${path.map((p) => `${p.where}${p.hit ? (p.tomb ? ' (tombstone -> deleted)' : ` -> ${p.val}`) : ' miss'}`).join(' -> ')}. Verdict: ${summary}. That took ${probes} probe${probes === 1 ? '' : 's'} — a per-SSTable Bloom filter would skip the tables that can't hold ${op.key}, cutting read amplification.`,
      }));
    }
  }

  return frames;
}

const RUN_DELAY_MS = 1300;

export default function LSMTreeViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  // SVG geometry
  const W = 940;
  const H = 480;

  const memX = 24; const memY = 60; const memW = 250; const memH = 196;
  const readX = 24; const readY = 280; const readW = 250; const readH = 176;
  const diskX = 312; const diskY = 60; const diskW = W - diskX - 24; const diskH = 396;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const memEntries = current.mem;
  const l0 = current.levels[0] || [];
  const l1 = current.levels[1] || [];
  const l2 = current.levels[2] || [];

  const totalSST = l0.length + l1.length + l2.length;
  const writeAmp = current.logical > 0 ? (current.physical / current.logical) : 0;
  const readProbes = current.readPath.length;

  // per-level layout inside the disk panel
  const lanePad = 14;
  const laneTop = diskY + 44;
  const laneH = (diskH - 44 - lanePad) / 3;
  const lanes = [
    { lvl: 0, tables: l0, label: 'L0', tag: `newest · flush target · ${L0_THRESHOLD === l0.length ? 'over' : 'cap'} ${L0_THRESHOLD}` },
    { lvl: 1, tables: l1, label: 'L1', tag: 'compacted run' },
    { lvl: 2, tables: l2, label: 'L2', tag: 'oldest' },
  ];

  // small immutable SSTable card renderer
  const tableCardW = 128;
  const tableCardGap = 12;

  return (
    <div className="lsmv">
      <div className="lsmv-head">
        <h3 className="lsmv-title">Log-Structured Merge tree — flush, compaction, and read amplification</h3>
        <p className="lsmv-sub">
          Writes land in a sorted memtable, flush to immutable L0 SSTables, then compact down a level — newest copy
          wins and tombstones drop. Reads scan sources newest-first and stop at the first hit.
        </p>
      </div>

      <div className="lsmv-controls">
        <label className="lsmv-speed">
          <span className="lsmv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="lsmv-speed-range"
            aria-label="Playback speed"
          />
          <span className="lsmv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="lsmv-spacer" aria-hidden="true" />

        <div className="lsmv-buttons">
          <button
            type="button"
            className="lsmv-btn lsmv-btn-primary"
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
            className="lsmv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="lsmv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="lsmv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="lsmv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lsmv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="lsmv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="lsmv-arrowhead" />
            </marker>
          </defs>

          {/* flush edge: memtable -> L0 */}
          <path
            className={`lsmv-edge ${current.region === 'l0' ? 'is-hot' : ''}`}
            d={`M ${memX + memW} ${memY + 70} C ${memX + memW + 28} ${memY + 70}, ${diskX - 28} ${laneTop + laneH / 2}, ${diskX} ${laneTop + laneH / 2}`}
            markerEnd="url(#lsmv-arrow)"
          />
          {/* compaction edge: L0 lane -> L1 lane */}
          <path
            className={`lsmv-edge lsmv-edge-compact ${current.region === 'compact' ? 'is-hot' : ''}`}
            d={`M ${diskX + 30} ${laneTop + laneH} L ${diskX + 30} ${laneTop + laneH + 8}`}
            markerEnd="url(#lsmv-arrow)"
          />

          {/* MEMTABLE (RAM, sorted) */}
          <g className={`lsmv-node ${current.region === 'mem' ? 'is-active' : ''}`}>
            <rect className="lsmv-box lsmv-box-mem" x={memX} y={memY} width={memW} height={memH} rx={11} />
            <g transform={`translate(${memX + 14}, ${memY + 13})`}><MemoryStick width={17} height={17} className="lsmv-ic" /></g>
            <text className="lsmv-box-title" x={memX + 40} y={memY + 27}>memtable</text>
            <text className="lsmv-box-tag" x={memX + memW - 12} y={memY + 27}>RAM · sorted</text>
            {memEntries.length === 0 && (
              <text className="lsmv-box-empty" x={memX + memW / 2} y={memY + memH / 2 + 12}>empty (just flushed)</text>
            )}
            {memEntries.map((e, ri) => {
              const y = memY + 44 + ri * 30;
              const active = current.activeKey === e.key;
              return (
                <g key={`mem-${e.key}`}>
                  <rect className={`lsmv-entry ${e.tomb ? 'is-tomb' : ''} ${active ? 'is-active-entry' : ''}`} x={memX + 12} y={y} width={memW - 24} height={24} rx={5} />
                  <text className="lsmv-entry-key" x={memX + 24} y={y + 16}>{e.key}</text>
                  {e.tomb ? (
                    <g transform={`translate(${memX + 66}, ${y + 5})`}><Trash2 width={12} height={12} className="lsmv-ic-tomb" /></g>
                  ) : (
                    <text className="lsmv-entry-val" x={memX + 66} y={y + 16}>= {e.val}</text>
                  )}
                  <text className="lsmv-entry-tag" x={memX + memW - 24} y={y + 16}>{e.tomb ? 'tombstone' : 'live'}</text>
                </g>
              );
            })}
          </g>

          {/* READ path panel */}
          <g className={`lsmv-node ${current.phase === 'read' ? 'is-active' : ''}`}>
            <rect className="lsmv-box lsmv-box-read" x={readX} y={readY} width={readW} height={readH} rx={11} />
            <g transform={`translate(${readX + 14}, ${readY + 13})`}><Search width={16} height={16} className="lsmv-ic" /></g>
            <text className="lsmv-box-title" x={readX + 38} y={readY + 27}>read path</text>
            <text className="lsmv-box-tag" x={readX + readW - 12} y={readY + 27}>newest first</text>
            {current.readPath.length === 0 && (
              <text className="lsmv-box-empty" x={readX + readW / 2} y={readY + readH / 2 + 12}>step a read op to trace a lookup</text>
            )}
            {current.readPath.map((p, ri) => {
              const y = readY + 44 + ri * 24;
              return (
                <g key={`rp-${ri}`}>
                  <rect className={`lsmv-probe ${p.hit ? (p.tomb ? 'is-tomb-hit' : 'is-hit') : 'is-miss'}`} x={readX + 12} y={y} width={readW - 24} height={20} rx={4} />
                  <text className="lsmv-probe-where" x={readX + 22} y={y + 14}>{p.where}</text>
                  <text className="lsmv-probe-res" x={readX + readW - 22} y={y + 14}>
                    {p.hit ? (p.tomb ? 'tombstone' : `= ${p.val}`) : 'miss'}
                  </text>
                </g>
              );
            })}
            {current.readResult && (
              <text className={`lsmv-read-verdict ${current.readResult.found ? 'is-found' : 'is-gone'}`} x={readX + readW / 2} y={readY + readH - 12}>
                {current.readResult.found ? `${current.readResult.key} = ${current.readResult.val}` : `${current.readResult.key} -> not found`}
              </text>
            )}
          </g>

          {/* DISK: leveled SSTables */}
          <g className={`lsmv-node ${current.region === 'l0' || current.region === 'compact' ? 'is-active' : ''}`}>
            <rect className="lsmv-box lsmv-box-disk" x={diskX} y={diskY} width={diskW} height={diskH} rx={11} />
            <g transform={`translate(${diskX + 14}, ${diskY + 13})`}><HardDrive width={17} height={17} className="lsmv-ic" /></g>
            <text className="lsmv-box-title" x={diskX + 40} y={diskY + 27}>SSTable levels</text>
            <text className="lsmv-box-tag" x={diskX + diskW - 12} y={diskY + 27}>disk · immutable · sorted runs</text>

            {lanes.map((lane, li) => {
              const ly = laneTop + li * laneH;
              const over = lane.lvl === 0 && lane.tables.length >= L0_THRESHOLD;
              return (
                <g key={`lane-${lane.lvl}`}>
                  <line className="lsmv-lane-sep" x1={diskX + 12} y1={ly} x2={diskX + diskW - 12} y2={ly} />
                  <g transform={`translate(${diskX + 16}, ${ly + 8})`}><Layers width={13} height={13} className="lsmv-ic-row" /></g>
                  <text className={`lsmv-lane-label ${over ? 'is-over' : ''}`} x={diskX + 36} y={ly + 19}>{lane.label}</text>
                  <text className="lsmv-lane-tag" x={diskX + 64} y={ly + 19}>{lane.tag}</text>
                  {lane.tables.length === 0 && (
                    <text className="lsmv-lane-empty" x={diskX + diskW / 2} y={ly + laneH / 2 + 14}>empty</text>
                  )}
                  {lane.tables.map((t, ti) => {
                    const cx = diskX + 36 + ti * (tableCardW + tableCardGap);
                    const cy = ly + 26;
                    const cardH = laneH - 34;
                    const fresh = (current.region === 'l0' && lane.lvl === 0 && ti === lane.tables.length - 1)
                      || (current.region === 'compact' && lane.lvl === 1 && ti === lane.tables.length - 1);
                    const probed = current.readPath.some((p) => p.where === `L${t.level} #${t.id}`);
                    const probeHit = current.readPath.some((p) => p.where === `L${t.level} #${t.id}` && p.hit);
                    return (
                      <g key={`t-${t.id}`}>
                        <rect
                          className={`lsmv-sst ${fresh ? 'is-fresh' : ''} ${probed ? (probeHit ? 'is-probe-hit' : 'is-probe') : ''}`}
                          x={cx} y={cy} width={tableCardW} height={cardH} rx={6}
                        />
                        <text className="lsmv-sst-id" x={cx + 8} y={cy + 14}>#{t.id}</text>
                        <text className="lsmv-sst-seq" x={cx + tableCardW - 8} y={cy + 14}>seq {t.seq}</text>
                        {t.entries.slice(0, 4).map((e, ei) => (
                          <text key={`te-${t.id}-${e.key}`} className={`lsmv-sst-entry ${e.tomb ? 'is-tomb' : ''}`} x={cx + 8} y={cy + 30 + ei * 14}>
                            {e.tomb ? `${e.key}: x` : `${e.key} = ${e.val}`}
                          </text>
                        ))}
                        {t.entries.length > 4 && (
                          <text className="lsmv-sst-more" x={cx + 8} y={cy + 30 + 4 * 14}>+{t.entries.length - 4} more</text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>

          {/* flush / compact tags floating near edges */}
          <g transform={`translate(${memX + memW + 8}, ${memY + 54})`}>
            <ArrowDownToLine width={13} height={13} className={`lsmv-flow-ic ${current.region === 'l0' ? 'is-hot' : ''}`} />
          </g>
        </svg>
      </div>

      <div className="lsmv-metrics">
        <div className="lsmv-metric">
          <span className="lsmv-metric-label">memtable</span>
          <span className="lsmv-metric-value">
            {memEntries.length ? memEntries.map((e) => (e.tomb ? `${e.key}:x` : `${e.key}=${e.val}`)).join(', ') : 'empty'}
          </span>
        </div>
        <div className="lsmv-metric">
          <span className="lsmv-metric-label">L0 SSTables</span>
          <span className={`lsmv-metric-value ${l0.length >= L0_THRESHOLD ? 'is-warn' : ''}`}>
            {l0.length} / {L0_THRESHOLD} cap
          </span>
        </div>
        <div className="lsmv-metric">
          <span className="lsmv-metric-label">L1 SSTables</span>
          <span className="lsmv-metric-value">{l1.length}</span>
        </div>
        <div className="lsmv-metric">
          <span className="lsmv-metric-label">total tables</span>
          <span className="lsmv-metric-value">{totalSST}</span>
        </div>
        <div className="lsmv-metric">
          <span className="lsmv-metric-label">write amp</span>
          <span className="lsmv-metric-value">{writeAmp ? `${writeAmp.toFixed(1)}×` : '—'}</span>
        </div>
        <div className="lsmv-metric">
          <span className="lsmv-metric-label">read probes</span>
          <span className="lsmv-metric-value">{readProbes || '—'}</span>
        </div>
      </div>

      <div className="lsmv-narration">
        <span className={`lsmv-narration-label lsmv-phase-${current.region || current.phase}`}>
          {current.region === 'l0' ? 'flush'
            : current.region === 'compact' ? 'compaction'
            : current.phase === 'read' ? 'read'
            : current.region === 'mem' ? 'write'
            : 'lsm'}
        </span>
        <span className="lsmv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
