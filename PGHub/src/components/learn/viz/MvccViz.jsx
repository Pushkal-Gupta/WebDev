import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Eye, Pencil, Database, Trash2, Check, Lock } from 'lucide-react';
import './MvccViz.css';

// Multi-version concurrency control. A single row is a CHAIN of versions, each
// stamped (xmin, xmax) = the txid that created it and the txid that superseded
// or deleted it. Every transaction takes a SNAPSHOT at begin: its own txid plus
// the set of txids still in flight. A version is visible to a txn when its xmin
// committed at-or-before the snapshot AND its xmax is null / in-flight / after
// the snapshot. UPDATE never overwrites — it inserts a NEW version and stamps
// the prior version's xmax. Reads take ZERO locks, so a writer never blocks a
// reader and a reader never blocks a writer; two writers to the same row still
// serialize through a row lock. Superseded versions become dead tuples that
// VACUUM reclaims once no live snapshot can still see them.
//
// TWO SCENARIOS:
//   concurrent — T1 (reader) holds an old snapshot while T2 (writer) inserts a
//                new version. They see different versions at the same moment; no
//                blocking. T1's open snapshot pins the old version as un-vacuumable.
//   conflict   — T2 and T3 both UPDATE the same row. The second writer blocks on
//                the row lock until the first commits, then re-reads and chains
//                its version on top. Write-write serializes; reads stay lock-free.

const TX_META = {
  101: { label: 'T1', role: 'reader', hue: 'sky' },
  102: { label: 'T2', role: 'writer', hue: 'mint' },
  103: { label: 'T3', role: 'writer', hue: 'pink' },
};

// A version visible to a snapshot { txid, inFlight:Set } iff xmin committed
// at-or-before us and xmax is null / in-flight / strictly after us.
function visibleVersion(versions, snapshot) {
  const committedToMe = (xid) => xid != null && xid < snapshot.txid && !snapshot.inFlight.includes(xid);
  // walk newest-first; the first version this snapshot can see is the one it reads.
  for (let i = versions.length - 1; i >= 0; i -= 1) {
    const v = versions[i];
    const xminOk = committedToMe(v.xmin);
    const xmaxHidesMe = v.xmax != null && committedToMe(v.xmax);
    if (xminOk && !xmaxHidesMe) return v.id;
  }
  return null;
}

function snapMaker(getState) {
  return (extra) => {
    const s = getState();
    return {
      versions: s.versions.map((v) => ({ ...v })),
      txns: s.txns.map((t) => ({ ...t, snapshotInFlight: [...t.snapshotInFlight] })),
      rowLock: s.rowLock,
      lockWaiters: [...s.lockWaiters],
      active: -1,
      phase: 'begin',
      note: '',
      ...extra,
    };
  };
}

function buildConcurrent() {
  const frames = [];
  const state = {
    // version chain; xmin/xmax are txids. v0 was created by a long-committed txn (100).
    versions: [{ id: 'v0', value: 'A', xmin: 100, xmax: null, dead: false }],
    txns: [],
    rowLock: null,
    lockWaiters: [],
  };
  const snap = snapMaker(() => state);

  const newTx = (txid, snapshotInFlight) => ({
    txid,
    state: 'begin',
    snapshotInFlight,
    reads: null,
  });

  frames.push(snap({
    phase: 'begin',
    note: 'The row holds one version v0 (value A, xmin=100) committed long ago. Two transactions are about to touch it at the same wall-clock moment — a reader and a writer.',
  }));

  // T1 begins, takes a snapshot.
  state.txns.push(newTx(101, []));
  frames.push(snap({
    active: 101,
    phase: 'begin',
    note: 'T1 (reader, txid 101) begins and takes a SNAPSHOT: nothing else is in flight, so it can see every version committed before 101. That snapshot is frozen for T1\'s whole lifetime.',
  }));

  // T1 reads v0.
  state.txns[0].state = 'read';
  state.txns[0].reads = 'v0';
  frames.push(snap({
    active: 101,
    phase: 'read',
    note: 'T1 reads the row: v0\'s xmin=100 committed before its snapshot and v0 has no xmax, so v0 is visible. The read took ZERO locks — nothing T1 does can block another transaction.',
  }));

  // T2 begins (with T1 still in flight).
  state.txns.push(newTx(102, [101]));
  frames.push(snap({
    active: 102,
    phase: 'begin',
    note: 'T2 (writer, txid 102) begins while T1 is still open. T2\'s snapshot records that 101 is in flight — so anything 101 later produces stays invisible to 102, and vice versa.',
  }));

  // T2 updates: new version v1, stamp v0.xmax = 102.
  state.versions[0].xmax = 102;
  state.versions.push({ id: 'v1', value: 'B', xmin: 102, xmax: null, dead: false });
  state.txns[1].state = 'write';
  frames.push(snap({
    active: 102,
    phase: 'write',
    note: 'T2 UPDATE sets the value to B. MVCC does NOT overwrite v0 — it inserts a new version v1 (xmin=102) and stamps v0\'s xmax=102. The chain is now v0 -> v1. T2 took a row lock on the write path only.',
  }));

  // T1 reads again — still sees v0, even though v1 now exists.
  frames.push(snap({
    active: 101,
    phase: 'read',
    note: 'T1 reads the row AGAIN. v1 was created by 102, which is in flight in T1\'s snapshot, so v1 is invisible. v0\'s xmax=102 is also in-flight, so v0 is NOT yet superseded for T1. T1 still reads A — the writer never blocked it.',
  }));

  // T2 commits.
  state.txns[1].state = 'commit';
  frames.push(snap({
    active: 102,
    phase: 'commit',
    note: 'T2 commits. v1 is now a committed version and v0 is officially superseded (dead for anyone whose snapshot is newer than 102). But T1\'s snapshot was taken BEFORE 102 committed — so for T1, nothing changed.',
  }));

  // T1 reads a third time — STILL v0 (snapshot isolation).
  frames.push(snap({
    active: 101,
    phase: 'read',
    note: 'T1 reads a third time and STILL sees A. Snapshot isolation: T1\'s view is pinned to the instant it began. v0 cannot be reclaimed yet — T1\'s live snapshot still depends on it. v0 is a dead tuple that VACUUM must skip.',
  }));

  // T1 commits / ends. Now v0 is reclaimable.
  state.txns[0].state = 'commit';
  state.versions[0].dead = true;
  frames.push(snap({
    active: 101,
    phase: 'commit',
    note: 'T1 ends. No live snapshot can see v0 any more, so v0 becomes a reclaimable dead tuple. A new transaction starting now would take a fresh snapshot and read v1 (B). Run VACUUM to reclaim v0.',
  }));

  return frames;
}

function buildConflict() {
  const frames = [];
  const state = {
    versions: [{ id: 'v0', value: 'A', xmin: 100, xmax: null, dead: false }],
    txns: [],
    rowLock: null,
    lockWaiters: [],
  };
  const snap = snapMaker(() => state);

  const newTx = (txid, snapshotInFlight) => ({
    txid,
    state: 'begin',
    snapshotInFlight,
    reads: null,
  });

  frames.push(snap({
    phase: 'begin',
    note: 'One version v0 (value A). This time two writers, T2 and T3, both try to UPDATE the SAME row. Reads are lock-free, but a row can only be written by one transaction at a time.',
  }));

  // Both writers begin.
  state.txns.push(newTx(102, []));
  state.txns.push(newTx(103, [102]));
  frames.push(snap({
    active: 102,
    phase: 'begin',
    note: 'T2 (102) and T3 (103) both begin. Each takes a snapshot; T3 records 102 as in flight. Both intend to change this row\'s value.',
  }));

  // T2 grabs the row lock and writes v1.
  state.rowLock = 102;
  state.versions[0].xmax = 102;
  state.versions.push({ id: 'v1', value: 'B', xmin: 102, xmax: null, dead: false });
  state.txns[0].state = 'write';
  frames.push(snap({
    active: 102,
    phase: 'write',
    note: 'T2 wins the row lock first. It inserts v1 (value B, xmin=102) and stamps v0.xmax=102. T2 now HOLDS the row lock until it commits or aborts.',
  }));

  // T3 tries to write -> blocks on the row lock.
  state.txns[1].state = 'blocked';
  state.lockWaiters = [103];
  frames.push(snap({
    active: 103,
    phase: 'blocked',
    note: 'T3 tries to UPDATE the same row and BLOCKS on the row lock T2 holds. Write-write conflicts serialize: T3 waits. Note that any pure READER could still proceed right now — only the second WRITER is stuck.',
  }));

  // T2 commits, releases lock.
  state.txns[0].state = 'commit';
  state.rowLock = null;
  frames.push(snap({
    active: 102,
    phase: 'commit',
    note: 'T2 commits and releases the row lock. v1 (B) is now the live version. T3, unblocked, must re-read the row to UPDATE the latest committed version rather than the stale v0 it first saw.',
  }));

  // T3 acquires lock, writes v2 on top of v1, marks v0 dead.
  state.rowLock = 103;
  state.lockWaiters = [];
  state.txns[1].state = 'write';
  state.versions[0].dead = true;
  state.versions[1].xmax = 103;
  state.versions.push({ id: 'v2', value: 'C', xmin: 103, xmax: null, dead: false });
  frames.push(snap({
    active: 103,
    phase: 'write',
    note: 'T3 takes the lock and chains its write on top of the COMMITTED v1: it inserts v2 (value C, xmin=103) and stamps v1.xmax=103. The chain is v0 -> v1 -> v2. v0 is already a dead tuple.',
  }));

  // T3 commits.
  state.txns[1].state = 'commit';
  state.rowLock = null;
  state.versions[1].dead = true;
  frames.push(snap({
    active: 103,
    phase: 'commit',
    note: 'T3 commits. v2 (C) is the live version; v0 and v1 are dead tuples. The two writers produced a clean serial chain A -> B -> C with no lost update — exactly what the row lock guaranteed.',
  }));

  return frames;
}

const SCENARIOS = {
  'Concurrent read + write': 'concurrent',
  'Write-write conflict': 'conflict',
};
const SCEN_KEYS = Object.keys(SCENARIOS);

const TX_STATE_LABEL = {
  begin: 'begin',
  read: 'reading',
  write: 'writing',
  blocked: 'blocked',
  commit: 'committed',
};

const PHASE_LABEL = {
  begin: 'begin',
  read: 'read',
  write: 'write',
  blocked: 'blocked',
  commit: 'commit',
};

const RUN_DELAY_MS = 1500;

export default function MvccViz() {
  const [scenario, setScenario] = useState(SCEN_KEYS[0]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [focusTx, setFocusTx] = useState(null);
  const [vacuumNote, setVacuumNote] = useState(null);
  const runTimer = useRef(null);

  const mode = SCENARIOS[scenario];
  const frames = useMemo(
    () => (mode === 'conflict' ? buildConflict() : buildConcurrent()),
    [mode],
  );

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  // advancing the frame in any way clears the previous VACUUM message.
  const goToStep = (next) => {
    setVacuumNote(null);
    setStep(next);
  };
  const advance = () => goToStep(Math.min(step + 1, totalSteps - 1));

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setVacuumNote(null);
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
    setFocusTx(null);
    setVacuumNote(null);
  };

  const switchScenario = (s) => {
    if (s === scenario) return;
    setIsRunning(false);
    setStep(0);
    setFocusTx(null);
    setVacuumNote(null);
    setScenario(s);
  };

  // live (non-dead) txns are those still open — anyone not committed pins a snapshot.
  const liveTxns = current.txns.filter((t) => t.state !== 'commit');
  const deadVersions = current.versions.filter((v) => v.dead);

  // a dead version can only be reclaimed if no live snapshot can still see it.
  const pinnedBy = (versionId) => liveTxns
    .map((t) => ({ t, sees: visibleVersion(current.versions, { txid: t.txid, inFlight: t.snapshotInFlight }) }))
    .filter((x) => x.sees === versionId)
    .map((x) => TX_META[x.t.txid].label);

  const reclaimable = deadVersions.filter((v) => pinnedBy(v.id).length === 0);
  const blockedReclaim = deadVersions.filter((v) => pinnedBy(v.id).length > 0);

  const runVacuum = () => {
    if (deadVersions.length === 0) {
      setVacuumNote({ tone: 'neutral', text: 'No dead tuples to reclaim — every version in the chain is still live.' });
      return;
    }
    if (blockedReclaim.length > 0) {
      const v = blockedReclaim[0];
      const who = pinnedBy(v.id).join(', ');
      setVacuumNote({
        tone: 'warn',
        text: `VACUUM refused for ${v.id}: ${who}'s open snapshot can still see it. A long-lived reader pins dead tuples — they cannot be reclaimed until that snapshot closes.`,
      });
      return;
    }
    setVacuumNote({
      tone: 'ok',
      text: `VACUUM reclaimed ${reclaimable.map((v) => v.id).join(', ')} — no live snapshot depended on them. Reset to replay; this preview does not mutate the scripted chain.`,
    });
  };

  // SVG geometry.
  const W = 960;
  const H = 470;

  // version chain (top band).
  const chainY = 86;
  const cellH = 78;
  const chainLeft = 40;
  const chainRight = W - 40;
  const versions = current.versions;
  const vGap = 64; // gap reserved for the chain arrow between cells.
  const vCount = versions.length;
  const cellW = Math.min(184, (chainRight - chainLeft - (vCount - 1) * vGap) / vCount);

  // transaction lanes (bottom band).
  const laneTop = 250;
  const laneGap = 18;
  const txns = current.txns;
  const laneCount = Math.max(txns.length, 1);
  const laneW = (W - 80 - (laneCount - 1) * laneGap) / laneCount;
  const laneH = 150;
  const laneX = (i) => 40 + i * (laneW + laneGap);

  // which version does the focused (or active) txn currently see?
  const focusedTxid = focusTx != null
    ? focusTx
    : (current.active !== -1 ? current.active : (txns[0] ? txns[0].txid : null));
  const focusedTx = txns.find((t) => t.txid === focusedTxid) || null;
  const focusVisibleId = focusedTx
    ? visibleVersion(versions, { txid: focusedTx.txid, inFlight: focusedTx.snapshotInFlight })
    : null;

  const liveCount = versions.filter((v) => !v.dead).length;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const txTone = (st) => {
    if (st === 'commit') return 'ok';
    if (st === 'write') return 'busy';
    if (st === 'blocked') return 'bad';
    if (st === 'read') return 'read';
    return 'neutral';
  };

  const RoleIcon = (txid) => {
    const role = TX_META[txid].role;
    return role === 'reader'
      ? <Eye width={15} height={15} className="mvc-ic is-read" />
      : <Pencil width={15} height={15} className="mvc-ic is-write" />;
  };

  return (
    <div className="mvc">
      <div className="mvc-head">
        <h3 className="mvc-title">Multi-version concurrency control — a row as a version chain</h3>
        <p className="mvc-sub">
          Every write inserts a new version instead of overwriting, so each transaction reads from the
          snapshot it took at begin — readers never block writers, writers never block readers, and dead
          versions wait for VACUUM.
        </p>
      </div>

      <div className="mvc-controls">
        <div className="mvc-modes" role="tablist" aria-label="Scenario">
          {SCEN_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              className={`mvc-mode ${scenario === s ? 'is-on' : ''}`}
              onClick={() => switchScenario(s)}
              aria-pressed={scenario === s}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="mvc-speed">
          <span className="mvc-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mvc-speed-range"
            aria-label="Playback speed"
          />
          <span className="mvc-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mvc-spacer" aria-hidden="true" />

        <div className="mvc-buttons">
          <button
            type="button"
            className="mvc-btn mvc-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) goToStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="mvc-btn"
            onClick={advance}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="mvc-btn"
            onClick={() => goToStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button
            type="button"
            className="mvc-btn mvc-btn-vacuum"
            onClick={runVacuum}
            disabled={deadVersions.length === 0}
            title={deadVersions.length === 0 ? 'No dead tuples yet' : 'Reclaim dead tuples no live snapshot can see'}
          >
            <Trash2 size={14} /> Run VACUUM
          </button>
          <button type="button" className="mvc-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="mvc-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="mvc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mvc-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mvc-arr-chain" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mvc-ah is-chain" />
            </marker>
            <marker id="mvc-arr-see" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mvc-ah is-see" />
            </marker>
          </defs>

          <text className="mvc-col-label" x={chainLeft} y={56} textAnchor="start">version chain (one row · newest at right)</text>
          <g transform={`translate(${chainLeft + 4}, 30)`}>
            <Database width={14} height={14} className="mvc-ic is-dim" />
          </g>

          {/* version cells */}
          {versions.map((v, i) => {
            const x = chainLeft + i * (cellW + vGap);
            const seen = focusVisibleId === v.id;
            const isReclaimable = v.dead && pinnedBy(v.id).length === 0;
            const cls = `${v.dead ? 'is-dead' : 'is-live'} ${seen ? 'is-seen' : ''} ${isReclaimable ? 'is-reclaim' : ''}`;
            return (
              <g key={`ver-${v.id}`}>
                {/* chain arrow to the next version */}
                {i < versions.length - 1 && (
                  <line
                    className="mvc-chain-edge"
                    x1={x + cellW}
                    y1={chainY + cellH / 2}
                    x2={x + cellW + vGap - 6}
                    y2={chainY + cellH / 2}
                    markerEnd="url(#mvc-arr-chain)"
                  />
                )}
                <rect className={`mvc-ver ${cls}`} x={x} y={chainY} width={cellW} height={cellH} rx={9} />
                <text className="mvc-ver-id" x={x + 12} y={chainY + 20} textAnchor="start">{v.id}</text>
                <text className="mvc-ver-val" x={x + cellW - 12} y={chainY + 22} textAnchor="end">{`val ${v.value}`}</text>
                <line className="mvc-rule" x1={x + 10} y1={chainY + 30} x2={x + cellW - 10} y2={chainY + 30} />
                <text className="mvc-ver-stamp" x={x + 12} y={chainY + 48} textAnchor="start">
                  {`xmin ${v.xmin}`}
                </text>
                <text className="mvc-ver-stamp" x={x + 12} y={chainY + 64} textAnchor="start">
                  {`xmax ${v.xmax == null ? '—' : v.xmax}`}
                </text>
                {v.dead && (
                  <text className={`mvc-ver-tag ${isReclaimable ? 'is-reclaim' : 'is-pinned'}`} x={x + cellW - 12} y={chainY + 60} textAnchor="end">
                    {isReclaimable ? 'reclaimable' : 'pinned'}
                  </text>
                )}
                {seen && (
                  <text className="mvc-ver-seen" x={x + cellW - 12} y={chainY + 60} textAnchor="end">
                    {!v.dead ? 'visible' : ''}
                  </text>
                )}
              </g>
            );
          })}

          {/* "sees" connector from the focused txn lane up to the version it reads */}
          {focusedTx && focusVisibleId && (() => {
            const vi = versions.findIndex((v) => v.id === focusVisibleId);
            const li = txns.findIndex((t) => t.txid === focusedTx.txid);
            if (vi < 0 || li < 0) return null;
            const vx = chainLeft + vi * (cellW + vGap) + cellW / 2;
            const lx = laneX(li) + laneW / 2;
            return (
              <line
                className="mvc-see-edge"
                x1={lx}
                y1={laneTop - 4}
                x2={vx}
                y2={chainY + cellH + 6}
                markerEnd="url(#mvc-arr-see)"
              />
            );
          })()}

          <text className="mvc-col-label" x={chainLeft} y={laneTop - 18} textAnchor="start">transactions (click a lane to see its visible version)</text>

          {/* transaction lanes */}
          {txns.map((t, i) => {
            const x = laneX(i);
            const meta = TX_META[t.txid];
            const tone = txTone(t.state);
            const active = current.active === t.txid;
            const focused = focusedTx && focusedTx.txid === t.txid;
            const sees = visibleVersion(versions, { txid: t.txid, inFlight: t.snapshotInFlight });
            const blocked = t.state === 'blocked';
            return (
              <g
                key={`lane-${t.txid}`}
                className="mvc-lane-g"
                onClick={() => setFocusTx(focused ? null : t.txid)}
                role="button"
                tabIndex={0}
              >
                <rect
                  className={`mvc-lane is-${meta.hue} ${focused ? 'is-focus' : ''} ${active ? 'is-active' : ''} ${blocked ? 'is-blocked' : ''}`}
                  x={x}
                  y={laneTop}
                  width={laneW}
                  height={laneH}
                  rx={11}
                />
                <g transform={`translate(${x + 13}, ${laneTop + 13})`}>
                  {RoleIcon(t.txid)}
                </g>
                <text className="mvc-lane-title" x={x + 34} y={laneTop + 25} textAnchor="start">
                  {`${meta.label} · ${meta.role}`}
                </text>
                <text className={`mvc-lane-state is-${tone}`} x={x + laneW - 13} y={laneTop + 25} textAnchor="end">
                  {TX_STATE_LABEL[t.state]}
                </text>
                <line className="mvc-rule" x1={x + 12} y1={laneTop + 38} x2={x + laneW - 12} y2={laneTop + 38} />

                <text className="mvc-lane-k" x={x + 13} y={laneTop + 60} textAnchor="start">txid</text>
                <text className="mvc-lane-v" x={x + laneW - 13} y={laneTop + 60} textAnchor="end">{t.txid}</text>

                <text className="mvc-lane-k" x={x + 13} y={laneTop + 82} textAnchor="start">snapshot</text>
                <text className="mvc-lane-v" x={x + laneW - 13} y={laneTop + 82} textAnchor="end">
                  {t.snapshotInFlight.length === 0 ? 'clean' : `inflight ${t.snapshotInFlight.join(',')}`}
                </text>

                <text className="mvc-lane-k" x={x + 13} y={laneTop + 104} textAnchor="start">sees</text>
                <text className={`mvc-lane-v ${sees ? 'is-seen' : 'is-dim'}`} x={x + laneW - 13} y={laneTop + 104} textAnchor="end">
                  {sees || 'none'}
                </text>

                {blocked && (
                  <g transform={`translate(${x + laneW / 2 - 8}, ${laneTop + laneH - 30})`}>
                    <Lock width={16} height={16} className="mvc-ic is-bad" />
                  </g>
                )}
                {t.state === 'commit' && (
                  <g transform={`translate(${x + laneW / 2 - 8}, ${laneTop + laneH - 30})`}>
                    <Check width={16} height={16} className="mvc-ic is-ok" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mvc-metrics">
        <div className="mvc-metric">
          <span className="mvc-metric-label">versions in chain</span>
          <span className="mvc-metric-value">{versions.length}</span>
        </div>
        <div className="mvc-metric">
          <span className="mvc-metric-label">live versions</span>
          <span className="mvc-metric-value is-ok">{liveCount}</span>
        </div>
        <div className="mvc-metric">
          <span className="mvc-metric-label">dead tuples</span>
          <span className={`mvc-metric-value ${deadVersions.length > 0 ? 'is-warn' : ''}`}>{deadVersions.length}</span>
        </div>
        <div className="mvc-metric">
          <span className="mvc-metric-label">reclaimable now</span>
          <span className={`mvc-metric-value ${blockedReclaim.length > 0 ? 'is-warn' : 'is-ok'}`}>
            {`${reclaimable.length} / ${deadVersions.length}`}
          </span>
        </div>
        <div className="mvc-metric">
          <span className="mvc-metric-label">row lock held by</span>
          <span className={`mvc-metric-value ${current.rowLock ? 'is-warn' : ''}`}>
            {current.rowLock ? TX_META[current.rowLock].label : 'free'}
          </span>
        </div>
        <div className="mvc-metric mvc-metric-dim">
          <span className="mvc-metric-label">phase</span>
          <span className={`mvc-metric-value ${current.phase === 'commit' ? 'is-ok' : current.phase === 'blocked' ? 'is-bad' : ''}`}>
            {PHASE_LABEL[current.phase] || current.phase}
          </span>
        </div>
      </div>

      <div className={`mvc-narration ${current.phase === 'blocked' ? 'is-bad' : ''}`}>
        <span className={`mvc-narration-label ${current.phase === 'blocked' ? 'is-bad' : current.phase === 'commit' ? 'is-ok' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="mvc-narration-body">{current.note}</span>
      </div>

      {vacuumNote && (
        <div className={`mvc-narration mvc-vacuum ${vacuumNote.tone === 'warn' ? 'is-warn' : vacuumNote.tone === 'ok' ? 'is-ok' : ''}`}>
          <span className={`mvc-narration-label ${vacuumNote.tone === 'warn' ? 'is-warn' : vacuumNote.tone === 'ok' ? 'is-ok' : ''}`}>
            vacuum
          </span>
          <span className="mvc-narration-body">{vacuumNote.text}</span>
        </div>
      )}

      <div className="mvc-legend">
        <span className="mvc-legend-item"><Pencil size={13} className="mvc-ic is-write" /> UPDATE inserts a new version, stamps the old xmax</span>
        <span className="mvc-legend-item"><Eye size={13} className="mvc-ic is-read" /> highlighted cell = the version the focused txn sees</span>
        <span className="mvc-legend-item"><Lock size={13} className="mvc-ic is-bad" /> second writer blocks on the row lock</span>
        <span className="mvc-legend-item"><Trash2 size={13} className="mvc-ic is-dim" /> dead tuples reclaimed only when unpinned</span>
      </div>
    </div>
  );
}
