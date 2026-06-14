import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ScrollText, MemoryStick, HardDrive, Flag, Zap } from 'lucide-react';
import './WALViz.css';

// Write-Ahead Logging: durability + crash recovery.
//
// Invariant (WAL rule): the log record for a change must be flushed (fsync'd)
// to durable storage BEFORE the corresponding data-file page is updated, and
// the COMMIT record must be durable before the transaction is acknowledged.
// The data file can lag arbitrarily far behind — it is brought up to date
// lazily by background flushes or, after a crash, by replaying the WAL.
//
// We run a fixed op sequence over two keys (x, y), insert a CHECKPOINT, then a
// CRASH wipes the in-memory buffer (and any data-file writes not yet flushed).
// RECOVERY replays the WAL from the last checkpoint, redoing committed txns —
// proving the data file converges to exactly the set of committed changes.

// Each op is one of: write (txn changes a key in the buffer, logged first),
// commit (txn's COMMIT record made durable), checkpoint (flush + barrier).
const OPS = [
  { kind: 'write', txn: 'T1', key: 'x', val: 10 },
  { kind: 'write', txn: 'T1', key: 'y', val: 20 },
  { kind: 'commit', txn: 'T1' },
  { kind: 'checkpoint' },
  { kind: 'write', txn: 'T2', key: 'x', val: 55 },
  { kind: 'commit', txn: 'T2' },
  { kind: 'write', txn: 'T3', key: 'y', val: 99 }, // never commits -> lost on crash
];

const BASE_LSN = 100;

// Build the full step trace as immutable frames. State carried across frames:
//   wal       : durable log records [{ lsn, kind, txn, key, val, durable }]
//   buffer    : in-memory page map { key: { val, lsn } } (volatile)
//   dataFile  : on-disk page map  { key: { val, lsn } } (durable, lazy)
//   checkpointLsn : LSN of last CHECKPOINT record
//   committed : Set of committed txn ids (for the correctness check)
function buildFrames() {
  const frames = [];
  const wal = [];
  let buffer = {};
  let dataFile = {};
  let nextLsn = BASE_LSN;
  let checkpointLsn = null;
  const committed = new Set();
  let crashed = false;
  let recovered = false;

  const snap = (extra) => ({
    wal: wal.map((w) => ({ ...w })),
    buffer: Object.fromEntries(Object.entries(buffer).map(([k, v]) => [k, { ...v }])),
    dataFile: Object.fromEntries(Object.entries(dataFile).map(([k, v]) => [k, { ...v }])),
    checkpointLsn,
    committed: [...committed],
    crashed,
    recovered,
    region: null, // wal | buffer | data | checkpoint
    activeLsn: null,
    redoKey: null,
    phase: 'run',
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: 'Write-Ahead Logging guarantees durability without flushing the data file on every change. The rule: the log record (and the COMMIT record) must be fsync\'d to disk BEFORE the change is acknowledged. The data file is updated lazily and can lag far behind — the WAL is the source of truth.',
  }));

  for (let i = 0; i < OPS.length; i += 1) {
    const op = OPS[i];

    if (op.kind === 'write') {
      const lsn = nextLsn; nextLsn += 1;
      // 1. append the change record to the WAL and fsync it (durable) FIRST.
      wal.push({ lsn, kind: 'write', txn: op.txn, key: op.key, val: op.val, durable: true });
      frames.push(snap({
        region: 'wal', activeLsn: lsn,
        note: `${op.txn} wants to set ${op.key} = ${op.val}. WAL-first: append a write record at LSN ${lsn} and fsync it to disk BEFORE touching the page. If we crash right now, recovery can still redo this change.`,
      }));
      // 2. only now update the in-memory page buffer (volatile).
      buffer = { ...buffer, [op.key]: { val: op.val, lsn } };
      frames.push(snap({
        region: 'buffer',
        note: `Record is durable, so now update the in-memory page: buffer[${op.key}] = ${op.val} (dirty, pageLSN ${lsn}). The on-disk data file is NOT touched — it stays stale. A dirty page in RAM is fine; the WAL already protects the change.`,
      }));
    } else if (op.kind === 'commit') {
      const lsn = nextLsn; nextLsn += 1;
      wal.push({ lsn, kind: 'commit', txn: op.txn, durable: true });
      committed.add(op.txn);
      frames.push(snap({
        region: 'wal', activeLsn: lsn,
        note: `commit ${op.txn}: append a COMMIT record at LSN ${lsn} and fsync -> ${op.txn} is now durable and acknowledged to the client. The data file is STILL stale until a later flush — durability comes from the log, not the data pages.`,
      }));
    } else if (op.kind === 'checkpoint') {
      const lsn = nextLsn; nextLsn += 1;
      // flush all dirty buffer pages to the data file, then write a checkpoint
      // barrier. Recovery may start its redo pass from here, not LSN 0.
      dataFile = Object.fromEntries(Object.entries(buffer).map(([k, v]) => [k, { ...v }]));
      checkpointLsn = lsn;
      wal.push({ lsn, kind: 'checkpoint', durable: true });
      frames.push(snap({
        region: 'checkpoint', activeLsn: lsn,
        note: `CHECKPOINT at LSN ${lsn}: flush every dirty buffer page to the data file, then write a checkpoint barrier to the WAL. The data file now matches the buffer (x=10, y=20). Recovery can start its redo scan from here instead of replaying the whole log.`,
      }));
    }
  }

  // --- CRASH: lose all volatile state (buffer + any unflushed data writes) ---
  crashed = true;
  buffer = {}; // RAM is gone
  // dataFile keeps only what was flushed at the checkpoint (T1's x=10,y=20).
  frames.push(snap({
    phase: 'crash', region: 'buffer', crashed: true,
    note: 'CRASH. Power loss wipes RAM: the in-memory page buffer is GONE, including T2\'s committed x=55 and T3\'s uncommitted y=99. The data file holds only what the last checkpoint flushed (x=10, y=20). The WAL on disk survived — it is durable.',
  }));

  // --- RECOVERY: replay WAL from last checkpoint, redo committed changes ---
  frames.push(snap({
    phase: 'recover', region: 'wal', crashed: true,
    note: 'RECOVERY begins. Scan the WAL forward from the last checkpoint (LSN ' + checkpointLsn + '). First pass finds which transactions have a COMMIT record — only those will be redone (T1, T2 committed; T3 did not).',
  }));

  // determine committed set strictly from durable COMMIT records in the WAL
  const durableCommitted = new Set(
    wal.filter((w) => w.kind === 'commit').map((w) => w.txn),
  );

  // redo pass: walk records after the checkpoint; apply writes of committed txns.
  const startIdx = wal.findIndex((w) => w.lsn === checkpointLsn);
  for (let j = startIdx + 1; j < wal.length; j += 1) {
    const rec = wal[j];
    if (rec.kind === 'write') {
      if (durableCommitted.has(rec.txn)) {
        dataFile = { ...dataFile, [rec.key]: { val: rec.val, lsn: rec.lsn } };
        frames.push(snap({
          phase: 'recover', region: 'data', activeLsn: rec.lsn, redoKey: rec.key, crashed: true,
          note: `REDO LSN ${rec.lsn}: ${rec.txn} is committed, so re-apply its write to the data file: ${rec.key} = ${rec.val}. We replay the change straight from the durable log — no original page needed.`,
        }));
      } else {
        frames.push(snap({
          phase: 'recover', region: 'wal', activeLsn: rec.lsn, crashed: true,
          note: `SKIP LSN ${rec.lsn}: ${rec.txn} has no COMMIT record in the WAL, so it never committed. Its write (${rec.key} = ${rec.val}) is discarded — recovery restores exactly the committed state, never a partial transaction.`,
        }));
      }
    } else if (rec.kind === 'commit') {
      frames.push(snap({
        phase: 'recover', region: 'wal', activeLsn: rec.lsn, crashed: true,
        note: `LSN ${rec.lsn}: COMMIT ${rec.txn} confirmed during the scan. Its redone changes are now durable in the data file.`,
      }));
    }
  }

  recovered = true;
  const finalKeys = Object.entries(dataFile)
    .map(([k, v]) => `${k}=${v.val}`)
    .join(', ');
  frames.push(snap({
    phase: 'done', region: 'data', crashed: true, recovered: true,
    note: `RECOVERED. The data file is now { ${finalKeys} } — exactly the committed transactions T1 (x=10, y=20) and T2 (x=55), with T3 correctly dropped. Durability and atomicity both hold: the WAL replayed every acknowledged change and nothing else.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1200;

export default function WALViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  // crash / recover jump targets within the fixed trace
  const crashStep = useMemo(() => frames.findIndex((f) => f.phase === 'crash'), [frames]);
  const recoverStep = useMemo(() => frames.findIndex((f) => f.phase === 'recover'), [frames]);

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

  const jumpTo = (idx) => {
    if (idx < 0) return;
    setIsRunning(false);
    setStep(idx);
  };

  // SVG geometry
  const W = 940;
  const H = 470;

  const bufX = 24; const bufY = 64; const bufW = 250; const bufH = 168;
  const dataX = 24; const dataY = 268; const dataW = 250; const dataH = 168;
  const walX = 320; const walY = 64; const walW = W - walX - 24; const walH = 372;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const bufEntries = Object.entries(current.buffer);
  const dataEntries = Object.entries(current.dataFile);
  const maxWalRows = 8;
  const walTail = current.wal.length ? current.wal[current.wal.length - 1] : null;
  const lastLsn = walTail ? walTail.lsn : '—';

  return (
    <div className="walv">
      <div className="walv-head">
        <h3 className="walv-title">Write-Ahead Logging — durability and crash recovery</h3>
        <p className="walv-sub">
          Step a transaction through WAL: log the change and fsync it before the in-memory page changes; the data
          file lags lazily behind. Then crash to wipe RAM, and replay the WAL from the last checkpoint to redo
          every committed change — and only those.
        </p>
      </div>

      <div className="walv-controls">
        <label className="walv-speed">
          <span className="walv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="walv-speed-range"
            aria-label="Playback speed"
          />
          <span className="walv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="walv-spacer" aria-hidden="true" />

        <div className="walv-buttons">
          <button
            type="button"
            className="walv-btn walv-btn-primary"
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
            className="walv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="walv-btn walv-btn-crash"
            onClick={() => jumpTo(crashStep)}
            disabled={crashStep < 0 || step >= crashStep}
          >
            <Zap size={14} /> Crash
          </button>
          <button
            type="button"
            className="walv-btn"
            onClick={() => jumpTo(recoverStep)}
            disabled={recoverStep < 0 || step >= recoverStep}
          >
            <SkipForward size={14} /> Recover
          </button>
          <button type="button" className="walv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="walv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="walv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="walv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="walv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="walv-arrowhead" />
            </marker>
          </defs>

          {/* edges: WAL -> buffer (write applied), checkpoint/redo: WAL -> data */}
          <path
            className={`walv-edge ${current.region === 'buffer' ? 'is-hot' : ''}`}
            d={`M ${walX} ${bufY + 40} C ${walX - 24} ${bufY + 40}, ${bufX + bufW + 24} ${bufY + 60}, ${bufX + bufW} ${bufY + 60}`}
            markerEnd="url(#walv-arrow)"
          />
          <path
            className={`walv-edge ${current.region === 'data' || current.region === 'checkpoint' ? 'is-hot' : ''}`}
            d={`M ${walX} ${walY + walH - 40} C ${walX - 30} ${walY + walH - 40}, ${dataX + dataW + 30} ${dataY + 60}, ${dataX + dataW} ${dataY + 60}`}
            markerEnd="url(#walv-arrow)"
          />

          {/* in-memory page buffer (volatile) */}
          <g className={`walv-node ${current.region === 'buffer' ? 'is-active' : ''}`}>
            <rect
              className={`walv-box walv-box-buffer ${current.crashed && !current.recovered ? 'is-lost' : ''}`}
              x={bufX} y={bufY} width={bufW} height={bufH} rx={11}
            />
            <g transform={`translate(${bufX + 14}, ${bufY + 14})`}><MemoryStick width={17} height={17} className="walv-ic" /></g>
            <text className="walv-box-title" x={bufX + 40} y={bufY + 28}>page buffer</text>
            <text className="walv-box-tag" x={bufX + bufW - 12} y={bufY + 28}>RAM · volatile</text>
            {current.crashed && bufEntries.length === 0 && (
              <text className="walv-box-empty walv-lost-text" x={bufX + bufW / 2} y={bufY + bufH / 2 + 14}>
                lost on crash
              </text>
            )}
            {!current.crashed && bufEntries.length === 0 && (
              <text className="walv-box-empty" x={bufX + bufW / 2} y={bufY + bufH / 2 + 14}>no dirty pages</text>
            )}
            {bufEntries.map(([k, v], ri) => {
              const y = bufY + 52 + ri * 36;
              return (
                <g key={`buf-${k}`}>
                  <rect className="walv-page-row is-dirty" x={bufX + 12} y={y} width={bufW - 24} height={28} rx={6} />
                  <text className="walv-page-key" x={bufX + 24} y={y + 19}>{k}</text>
                  <text className="walv-page-val" x={bufX + 74} y={y + 19}>= {v.val}</text>
                  <text className="walv-page-lsn" x={bufX + bufW - 24} y={y + 19}>LSN {v.lsn}</text>
                </g>
              );
            })}
          </g>

          {/* data file (durable, lazy) */}
          <g className={`walv-node ${current.region === 'data' ? 'is-active' : ''}`}>
            <rect
              className={`walv-box walv-box-data ${current.recovered ? 'is-restored' : ''}`}
              x={dataX} y={dataY} width={dataW} height={dataH} rx={11}
            />
            <g transform={`translate(${dataX + 14}, ${dataY + 14})`}><HardDrive width={17} height={17} className="walv-ic" /></g>
            <text className="walv-box-title" x={dataX + 40} y={dataY + 28}>data file</text>
            <text className="walv-box-tag" x={dataX + dataW - 12} y={dataY + 28}>disk · lazy</text>
            {dataEntries.length === 0 && (
              <text className="walv-box-empty" x={dataX + dataW / 2} y={dataY + dataH / 2 + 14}>empty / stale</text>
            )}
            {dataEntries.map(([k, v], ri) => {
              const y = dataY + 52 + ri * 36;
              const isRedo = current.redoKey === k;
              return (
                <g key={`data-${k}`}>
                  <rect className={`walv-page-row is-clean ${isRedo ? 'is-redo' : ''}`} x={dataX + 12} y={y} width={dataW - 24} height={28} rx={6} />
                  <text className="walv-page-key" x={dataX + 24} y={y + 19}>{k}</text>
                  <text className="walv-page-val" x={dataX + 74} y={y + 19}>= {v.val}</text>
                  <text className="walv-page-lsn" x={dataX + dataW - 24} y={y + 19}>LSN {v.lsn}</text>
                </g>
              );
            })}
          </g>

          {/* WAL (append-only, durable) */}
          <g className={`walv-node ${current.region === 'wal' ? 'is-active' : ''}`}>
            <rect className="walv-box walv-box-wal" x={walX} y={walY} width={walW} height={walH} rx={11} />
            <g transform={`translate(${walX + 14}, ${walY + 14})`}><ScrollText width={17} height={17} className="walv-ic" /></g>
            <text className="walv-box-title" x={walX + 40} y={walY + 28}>write-ahead log</text>
            <text className="walv-box-tag" x={walX + walW - 12} y={walY + 28}>disk · append-only · durable</text>
            {current.wal.length === 0 && (
              <text className="walv-box-empty" x={walX + walW / 2} y={walY + walH / 2 + 10}>no records yet</text>
            )}
            {current.wal.slice(-maxWalRows).map((rec, ri) => {
              const y = walY + 48 + ri * 40;
              const isActive = current.activeLsn === rec.lsn;
              const label = rec.kind === 'write'
                ? `${rec.txn}: ${rec.key} = ${rec.val}`
                : rec.kind === 'commit'
                  ? `COMMIT ${rec.txn}`
                  : 'CHECKPOINT';
              return (
                <g key={`wal-${rec.lsn}`}>
                  <rect className={`walv-wal-row walv-row-${rec.kind} ${isActive ? 'is-active-row' : ''}`} x={walX + 12} y={y} width={walW - 24} height={30} rx={6} />
                  <text className="walv-wal-lsn" x={walX + 24} y={y + 20}>LSN {rec.lsn}</text>
                  {rec.kind === 'checkpoint' && (
                    <g transform={`translate(${walX + 96}, ${y + 8})`}><Flag width={14} height={14} className="walv-ic-row" /></g>
                  )}
                  <text className={`walv-wal-body walv-body-${rec.kind}`} x={walX + (rec.kind === 'checkpoint' ? 118 : 100)} y={y + 20}>{label}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="walv-metrics">
        <div className="walv-metric">
          <span className="walv-metric-label">WAL entries</span>
          <span className="walv-metric-value">{current.wal.length} · last LSN {lastLsn}</span>
        </div>
        <div className="walv-metric">
          <span className="walv-metric-label">last checkpoint</span>
          <span className="walv-metric-value">{current.checkpointLsn == null ? '—' : `LSN ${current.checkpointLsn}`}</span>
        </div>
        <div className="walv-metric">
          <span className="walv-metric-label">buffer (RAM)</span>
          <span className={`walv-metric-value ${current.crashed && !current.recovered ? 'is-lost' : ''}`}>
            {bufEntries.length ? bufEntries.map(([k, v]) => `${k}=${v.val}`).join(', ') : (current.crashed ? 'wiped' : '—')}
          </span>
        </div>
        <div className="walv-metric">
          <span className="walv-metric-label">data file (disk)</span>
          <span className={`walv-metric-value ${current.recovered ? 'is-restored' : ''}`}>
            {dataEntries.length ? dataEntries.map(([k, v]) => `${k}=${v.val}`).join(', ') : 'stale'}
          </span>
        </div>
        <div className="walv-metric">
          <span className="walv-metric-label">committed</span>
          <span className="walv-metric-value">[{current.committed.join(', ') || '—'}]</span>
        </div>
      </div>

      <div className="walv-narration">
        <span className={`walv-narration-label walv-phase-${current.phase}`}>
          {current.phase === 'crash' ? 'crash' : current.phase === 'recover' ? 'recovery' : current.phase === 'done' ? 'recovered' : 'trace'}
        </span>
        <span className="walv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
