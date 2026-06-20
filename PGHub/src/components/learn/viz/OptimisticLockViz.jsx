import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Database, GitCommit, RefreshCw, Check, X } from 'lucide-react';
import './OptimisticLockViz.css';

// Optimistic locking — version-based concurrency control (compare-and-swap).
//
// A shared record carries { value, version }. Each transaction:
//   1. READS the record (snapshots value + version v).
//   2. COMPUTES a new value locally (no lock held — readers never block).
//   3. COMMITS with a compare-and-swap: UPDATE ... SET value=new, version=v+1
//      WHERE version = v. If the stored version still equals v, the CAS wins:
//      value updates and version bumps. If another transaction already committed,
//      the stored version has moved on, the WHERE clause matches no row -> CONFLICT.
//   4. On conflict the transaction must RE-READ the fresh record and RETRY.
//
// We interleave N transactions so the first to commit wins and the rest discover
// a stale version, retry against the new value, and eventually all succeed. The
// trace is fully deterministic — interleaving is derived from a seeded schedule,
// never Math.random at render time.

const TXN_TONES = ['var(--hue-sky)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-mint)'];

// Each transaction adds a fixed delta to whatever value it reads. Deterministic.
const DELTAS = [10, 7, 3, 5];

// Seeded interleaving: contention 0..2 controls how tightly the reads cluster
// before the first commit. Higher contention => more transactions read the SAME
// version, so more of them lose the CAS and must retry.
//   contention 0 : staggered — each reads after the previous committed (few conflicts)
//   contention 1 : two share a version at a time
//   contention 2 : all read the same version up front (maximum conflicts)
function buildSchedule(n, contention) {
  // Returns the order in which transactions first READ, grouped into "read waves".
  // A wave is a set of txns that read the same version before any of them commits.
  if (contention <= 0) return Array.from({ length: n }, (_, i) => [i]);
  if (contention === 1) {
    const waves = [];
    for (let i = 0; i < n; i += 2) waves.push([i, i + 1].filter((k) => k < n));
    return waves;
  }
  return [Array.from({ length: n }, (_, i) => i)];
}

function buildFrames(nTxns, contention) {
  const n = Math.max(2, Math.min(4, nTxns));
  const frames = [];

  const record = { value: 100, version: 1 };
  // txn state: idle | reading | computing | committing | conflict | retrying | committed
  const txns = Array.from({ length: n }, (_, i) => ({
    id: i,
    label: `T${i + 1}`,
    state: 'idle',
    readVersion: null,
    readValue: null,
    localValue: null,
    delta: DELTAS[i % DELTAS.length],
    retries: 0,
  }));

  let commits = 0;
  let conflicts = 0;

  const snap = (extra) => ({
    record: { ...record },
    txns: txns.map((t) => ({ ...t })),
    commits,
    conflicts,
    active: null,
    phase: 'run',
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `A shared record holds value ${record.value} at version ${record.version}. ${n} transactions will each read it, compute a new value locally, and commit with a compare-and-swap that only succeeds if the version has not changed since the read. Readers never block — conflicts surface only at commit time.`,
  }));

  const schedule = buildSchedule(n, contention);
  const pending = new Set(txns.map((t) => t.id));

  // Process read-waves. Within a wave, every still-pending txn reads the current
  // version, computes locally, then they attempt to commit in id order — the first
  // wins, the rest hit a version mismatch and are rescheduled for a retry wave.
  const queue = schedule.map((w) => w.filter((id) => pending.has(id)));

  let guard = 0;
  while (pending.size > 0 && guard < 40) {
    guard += 1;
    // Pull the next wave; if the static schedule is exhausted, retry whatever is left.
    let wave = queue.shift();
    if (!wave || wave.length === 0) wave = [...pending];
    wave = wave.filter((id) => pending.has(id));
    if (wave.length === 0) continue;

    // READ phase for this wave — everyone reads the same current version.
    for (const id of wave) {
      const t = txns[id];
      t.state = 'reading';
      t.readVersion = record.version;
      t.readValue = record.value;
      frames.push(snap({
        phase: 'read',
        active: id,
        note: `${t.label} READS the record: value ${record.value}, version ${record.version}. No lock is taken — the read is a cheap snapshot it will validate later.`,
      }));
    }
    for (const id of wave) {
      const t = txns[id];
      t.state = 'computing';
      t.localValue = t.readValue + t.delta;
      frames.push(snap({
        phase: 'compute',
        active: id,
        note: `${t.label} COMPUTES locally: ${t.readValue} + ${t.delta} = ${t.localValue}. This happens in the transaction's own memory; the shared record is untouched so far.`,
      }));
    }

    // COMMIT phase — attempt CAS in id order against the live version.
    for (const id of wave) {
      const t = txns[id];
      t.state = 'committing';
      frames.push(snap({
        phase: 'commit',
        active: id,
        note: `${t.label} attempts COMMIT: UPDATE record SET value=${t.localValue}, version=${t.readVersion + 1} WHERE version=${t.readVersion}. The CAS compares its read-version ${t.readVersion} against the live version ${record.version}.`,
      }));

      if (record.version === t.readVersion) {
        // CAS wins.
        record.value = t.localValue;
        record.version = t.readVersion + 1;
        t.state = 'committed';
        commits += 1;
        pending.delete(id);
        frames.push(snap({
          phase: 'success',
          active: id,
          note: `CAS WINS. The live version matched ${t.readVersion}, so ${t.label} commits: record becomes value ${record.value}, version ${record.version}. The version bump invalidates any other transaction still holding version ${t.readVersion}.`,
        }));
      } else {
        // CAS fails — version moved on.
        t.state = 'conflict';
        conflicts += 1;
        frames.push(snap({
          phase: 'conflict',
          active: id,
          note: `CONFLICT. ${t.label} read version ${t.readVersion}, but the live version is now ${record.version} — another transaction committed first. The WHERE clause matches no row, so the CAS fails and ${t.label}'s work is discarded. It must re-read and retry.`,
        }));
        t.retries += 1;
        t.state = 'retrying';
        t.readVersion = null;
        t.readValue = null;
        t.localValue = null;
        frames.push(snap({
          phase: 'retry',
          active: id,
          note: `${t.label} RETRIES (attempt ${t.retries + 1}). It throws away the stale snapshot and will re-read the current record on the next read wave — this time seeing version ${record.version}.`,
        }));
      }
    }
  }

  frames.push(snap({
    phase: 'done',
    note: `All ${n} transactions committed. ${commits} commits succeeded after ${conflicts} CAS conflict${conflicts === 1 ? '' : 's'}; the record ended at value ${record.value}, version ${record.version}. Optimistic locking let every reader proceed without blocking — only the losers paid, by re-reading and retrying.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1150;

const STATE_LABEL = {
  idle: 'idle',
  reading: 'reading',
  computing: 'computing',
  committing: 'committing',
  conflict: 'CAS failed',
  retrying: 'retrying',
  committed: 'committed',
};

export default function OptimisticLockViz() {
  const [nTxns, setNTxns] = useState(3);
  const [contention, setContention] = useState(2);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(nTxns, contention), [nTxns, contention]);
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

  const changeN = (v) => {
    setIsRunning(false);
    setStep(0);
    setNTxns(v);
  };

  const changeContention = (v) => {
    setIsRunning(false);
    setStep(0);
    setContention(v);
  };

  const n = current.txns.length;

  // SVG geometry — central record box at top, transaction lanes below.
  const W = 940;
  const recX = W / 2 - 150;
  const recY = 24;
  const recW = 300;
  const recH = 70;

  const laneTop = 150;
  const laneGap = 16;
  const laneH = 78;
  const laneW = (W - 40 - laneGap * (n - 1)) / n;
  const laneX = (i) => 20 + i * (laneW + laneGap);
  const H = laneTop + laneH + 24;

  const recCenterX = recX + recW / 2;
  const recBottomY = recY + recH;

  const phaseTone = (phase) => {
    if (phase === 'success' || phase === 'done') return 'var(--easy)';
    if (phase === 'conflict') return 'var(--hard)';
    if (phase === 'retry') return 'var(--warning)';
    return 'var(--accent)';
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const stateClass = (st) => {
    if (st === 'committed') return 'is-committed';
    if (st === 'conflict') return 'is-conflict';
    if (st === 'retrying') return 'is-retrying';
    if (st === 'idle') return 'is-idle';
    return 'is-active';
  };

  return (
    <div className="olv">
      <div className="olv-head">
        <h3 className="olv-title">Optimistic locking — version-based compare-and-swap</h3>
        <p className="olv-sub">
          Transactions read a versioned record freely, compute new values locally, then commit with a CAS — the first wins, the rest detect a stale version and retry.
        </p>
      </div>

      <div className="olv-controls">
        <div className="olv-buttons">
          <button
            type="button"
            className="olv-btn olv-btn-primary"
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
            className="olv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="olv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="olv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <span className="olv-spacer" aria-hidden="true" />

        <label className="olv-field">
          <span className="olv-input-label">txns</span>
          <input
            type="range"
            min={2}
            max={4}
            step={1}
            value={nTxns}
            onChange={(e) => changeN(Number(e.target.value))}
            className="olv-range"
            aria-label="Number of transactions"
          />
          <span className="olv-field-value">{nTxns}</span>
        </label>

        <label className="olv-field">
          <span className="olv-input-label">contention</span>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={contention}
            onChange={(e) => changeContention(Number(e.target.value))}
            className="olv-range"
            aria-label="Contention level"
          />
          <span className="olv-field-value">{['low', 'med', 'high'][contention]}</span>
        </label>

        <label className="olv-field">
          <span className="olv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="olv-range olv-range-speed"
            aria-label="Playback speed"
          />
          <span className="olv-field-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="olv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="olv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="olv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="olv-arrow-read" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="olv-ah-read" />
            </marker>
            <marker id="olv-arrow-commit" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="olv-ah-commit" />
            </marker>
            <marker id="olv-arrow-fail" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="olv-ah-fail" />
            </marker>
          </defs>

          {/* connecting arrows between active txn and the record */}
          {current.active != null && (() => {
            const i = current.active;
            const lx = laneX(i) + laneW / 2;
            const phase = current.phase;
            const isRead = phase === 'read';
            const isCommit = phase === 'commit' || phase === 'success';
            const isFail = phase === 'conflict';
            if (!isRead && !isCommit && !isFail) return null;
            const tone = isRead ? 'read' : isFail ? 'fail' : 'commit';
            // read: record -> txn ; commit/fail: txn -> record
            const x1 = isRead ? recCenterX : lx;
            const y1 = isRead ? recBottomY + 4 : laneTop - 4;
            const x2 = isRead ? lx : recCenterX;
            const y2 = isRead ? laneTop - 4 : recBottomY + 4;
            return (
              <line
                className={`olv-flow is-${tone}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                markerEnd={`url(#olv-arrow-${tone})`}
              />
            );
          })()}

          {/* central shared record */}
          <g>
            <rect
              className={`olv-record ${current.phase === 'success' ? 'is-bumped' : ''}`}
              x={recX}
              y={recY}
              width={recW}
              height={recH}
              rx={10}
            />
            <g transform={`translate(${recX + 14}, ${recY + 14})`}>
              <Database width={20} height={20} className="olv-ic" />
            </g>
            <text className="olv-record-label" x={recX + 44} y={recY + 28}>shared record</text>
            <text className="olv-record-value" x={recX + 44} y={recY + 54}>value = {current.record.value}</text>
            <g className="olv-vbadge" transform={`translate(${recX + recW - 96}, ${recY + 18})`}>
              <rect className={`olv-vbadge-bg ${current.phase === 'success' ? 'is-bumped' : ''}`} x={0} y={0} width={84} height={34} rx={8} />
              <text className="olv-vbadge-label" x={42} y={13}>version</text>
              <text className="olv-vbadge-num" x={42} y={28}>v{current.record.version}</text>
            </g>
          </g>

          {/* transaction lanes */}
          {current.txns.map((t, i) => {
            const x = laneX(i);
            const tone = TXN_TONES[i % TXN_TONES.length];
            const cls = stateClass(t.state);
            const isActive = current.active === i;
            return (
              <g key={`txn-${t.id}`}>
                <rect
                  className={`olv-lane ${cls} ${isActive ? 'is-hot' : ''}`}
                  x={x}
                  y={laneTop}
                  width={laneW}
                  height={laneH}
                  rx={9}
                  style={isActive ? { stroke: tone } : undefined}
                />
                <rect x={x} y={laneTop} width={laneW} height={5} rx={2.5} fill={tone} opacity={t.state === 'idle' ? 0.4 : 0.9} />

                <text className="olv-lane-title" x={x + 12} y={laneTop + 24}>{t.label}</text>

                {/* state pill */}
                <g transform={`translate(${x + laneW - 12}, ${laneTop + 12})`}>
                  <rect
                    className={`olv-pill ${cls}`}
                    x={-88}
                    y={0}
                    width={88}
                    height={20}
                    rx={10}
                  />
                  {t.state === 'committed' && <g transform="translate(-82, 3)"><Check width={13} height={13} className="olv-pill-ic is-ok" /></g>}
                  {t.state === 'conflict' && <g transform="translate(-82, 3)"><X width={13} height={13} className="olv-pill-ic is-bad" /></g>}
                  {t.state === 'retrying' && <g transform="translate(-82, 3)"><RefreshCw width={13} height={13} className="olv-pill-ic is-warn" /></g>}
                  {t.state === 'committing' && <g transform="translate(-82, 3)"><GitCommit width={13} height={13} className="olv-pill-ic" /></g>}
                  <text className={`olv-pill-text ${cls}`} x={t.state === 'idle' || t.state === 'reading' || t.state === 'computing' ? -44 : -34} y={14}>
                    {STATE_LABEL[t.state]}
                  </text>
                </g>

                <text className="olv-lane-row" x={x + 12} y={laneTop + 46}>
                  read: {t.readVersion != null ? `v${t.readVersion} · ${t.readValue}` : '—'}
                </text>
                <text className="olv-lane-row" x={x + 12} y={laneTop + 64}>
                  local: {t.localValue != null ? t.localValue : '—'}
                  {t.retries > 0 ? `  (retries ${t.retries})` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="olv-metrics">
        <div className="olv-metric">
          <span className="olv-metric-label">record version</span>
          <span className="olv-metric-value">v{current.record.version}</span>
        </div>
        <div className="olv-metric">
          <span className="olv-metric-label">record value</span>
          <span className="olv-metric-value">{current.record.value}</span>
        </div>
        <div className="olv-metric">
          <span className="olv-metric-label">commits</span>
          <span className="olv-metric-value is-ok">{current.commits}</span>
        </div>
        <div className="olv-metric">
          <span className="olv-metric-label">conflicts / retries</span>
          <span className="olv-metric-value is-bad">{current.conflicts}</span>
        </div>
        <div className="olv-metric">
          <span className="olv-metric-label">step</span>
          <span className="olv-metric-value">{step + 1} / {totalSteps}</span>
        </div>
      </div>

      <div
        className={`olv-narration ${current.phase === 'success' || current.phase === 'done' ? 'is-success' : current.phase === 'conflict' ? 'is-conflict' : current.phase === 'retry' ? 'is-retry' : ''}`}
        style={{ borderLeftColor: phaseTone(current.phase) }}
      >
        <span className="olv-narration-label">
          {current.phase === 'success' ? 'CAS win' : current.phase === 'conflict' ? 'conflict' : current.phase === 'retry' ? 'retry' : current.phase === 'done' ? 'done' : 'trace'}
        </span>
        <span className="olv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
