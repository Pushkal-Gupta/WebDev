import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Lock, Unlock, Clock, AlertTriangle, Check, Skull, BookOpen, Pencil, ArrowUp, ArrowDown,
} from 'lucide-react';
import './TwoPhaseLockingViz.css';

// Two-phase locking (2PL) for serializable transactions. Each transaction has a
// GROWING phase (it only acquires locks, never releases) followed by a SHRINKING
// phase (it only releases, never acquires a new one). That single rule — once you
// release any lock you may never acquire another — is what forces a serializable
// schedule.
//
// We model two transactions T1 and T2 contending for two data items X and Y, with
// SHARED (read, S) and EXCLUSIVE (write, X) lock modes. Compatibility: S+S is fine
// (many readers), but anything touching an X-lock conflicts, so the requester WAITS
// and a wait edge is drawn.
//
// THREE SCENARIOS:
//   wait     — T2 requests an X-lock that T1 already holds; T2 blocks, T1 finishes
//              its shrinking phase, releases, and T2 proceeds. No cycle.
//   deadlock — T1 holds X and waits for Y; T2 holds Y and waits for X. The wait-for
//              graph has a cycle (T1 -> T2 -> T1); the manager picks a victim, aborts
//              it, releases its locks, and the survivor proceeds.
//   noop placeholder handled by the same builder via the scenario arg.
//
// STRICT toggle: under strict 2PL a transaction holds ALL its locks until it commits
// or aborts (no early release in the shrinking phase). That removes cascading aborts
// at the cost of holding locks longer.

const ITEMS = ['X', 'Y'];

// lock table: item -> { holders: [{ txn, mode }], waiters: [{ txn, mode }] }
function blankTable() {
  return {
    X: { holders: [], waiters: [] },
    Y: { holders: [], waiters: [] },
  };
}

function cloneTable(t) {
  return {
    X: { holders: t.X.holders.map((h) => ({ ...h })), waiters: t.X.waiters.map((w) => ({ ...w })) },
    Y: { holders: t.Y.holders.map((h) => ({ ...h })), waiters: t.Y.waiters.map((w) => ({ ...w })) },
  };
}

// txn shape: { id, phase: 'growing'|'shrinking'|'committed'|'aborted'|'blocked', held: [{item,mode}] }
function freshTxn(id) {
  return { id, phase: 'growing', held: [], status: 'idle' };
}

function buildFrames(scenario, strict) {
  const frames = [];
  const st = {
    table: blankTable(),
    txns: { T1: freshTxn('T1'), T2: freshTxn('T2') },
    waitEdges: [], // [{from,to,item}]
    cycle: false,
    victim: null,
  };

  const snap = (extra) => ({
    table: cloneTable(st.table),
    txns: {
      T1: { ...st.txns.T1, held: st.txns.T1.held.map((h) => ({ ...h })) },
      T2: { ...st.txns.T2, held: st.txns.T2.held.map((h) => ({ ...h })) },
    },
    waitEdges: st.waitEdges.map((e) => ({ ...e })),
    cycle: st.cycle,
    victim: st.victim,
    phase: 'idle',
    actor: null,
    note: '',
    ...extra,
  });

  const acquire = (txn, item, mode) => {
    st.table[item].holders.push({ txn, mode });
    st.txns[txn].held.push({ item, mode });
  };
  const release = (txn, item) => {
    st.table[item].holders = st.table[item].holders.filter((h) => h.txn !== txn);
    st.txns[txn].held = st.txns[txn].held.filter((h) => h.item !== item);
  };
  const strictLabel = strict ? 'strict 2PL' : 'basic 2PL';

  frames.push(snap({
    phase: 'init',
    note: `Two transactions, T1 and T2, contend for data items X and Y under ${strictLabel}. Each takes shared (S, read) or exclusive (X, write) locks. The 2PL rule: every txn grows its lock set first, then shrinks it — once it releases any lock it may never acquire another. ${strict ? 'Strict mode holds every lock until commit.' : ''}`,
  }));

  if (scenario === 'wait') {
    // T1 grows: S on X, then X on Y.
    acquire('T1', 'X', 'S');
    frames.push(snap({
      phase: 'grow', actor: 'T1',
      note: `T1 requests a SHARED lock on X to read it. X is unheld, so the lock is granted. T1 is in its GROWING phase — lock count 1.`,
    }));
    acquire('T1', 'Y', 'X');
    frames.push(snap({
      phase: 'grow', actor: 'T1',
      note: `T1 now requests an EXCLUSIVE lock on Y to write it. Y is free, granted. T1 still growing — lock count 2. It has every lock it needs.`,
    }));

    // T2 wants X-lock on Y -> conflict, waits.
    st.table.Y.waiters.push({ txn: 'T2', mode: 'X' });
    st.txns.T2.phase = 'blocked';
    st.txns.T2.status = 'blocked';
    st.waitEdges = [{ from: 'T2', to: 'T1', item: 'Y' }];
    frames.push(snap({
      phase: 'wait', actor: 'T2',
      note: `T2 requests an EXCLUSIVE lock on Y, but T1 already holds Y exclusively. X-locks conflict with everything, so T2 cannot proceed — it WAITS. A wait edge T2 -> T1 appears. The wait-for graph has no cycle, so this is just a delay, not a deadlock.`,
    }));

    // T1 shrinks.
    if (!strict) {
      release('T1', 'X');
      st.txns.T1.phase = 'shrinking';
      frames.push(snap({
        phase: 'shrink', actor: 'T1',
        note: `T1 finished reading X, so it RELEASES the S-lock on X. That release flips T1 into its SHRINKING phase — from now on it may only release, never acquire. Lock count drops to 1.`,
      }));
    }

    // T1 commits, releases Y.
    st.txns.T1.phase = strict ? 'shrinking' : 'shrinking';
    st.txns.T1.status = 'committed';
    if (strict) release('T1', 'X');
    release('T1', 'Y');
    st.txns.T1.phase = 'committed';
    // grant Y to waiter T2
    st.table.Y.waiters = st.table.Y.waiters.filter((w) => w.txn !== 'T2');
    st.waitEdges = [];
    acquire('T2', 'Y', 'X');
    st.txns.T2.phase = 'growing';
    st.txns.T2.status = 'idle';
    frames.push(snap({
      phase: 'shrink', actor: 'T1',
      note: strict
        ? `T1 commits. Under strict 2PL it held BOTH locks until this commit point, then releases them all at once. Y is now free, so the lock manager hands it to the waiting T2 — T2 unblocks and resumes its growing phase.`
        : `T1 commits and releases its remaining lock on Y. The lock manager grants Y to the waiting T2. T2 unblocks and resumes its growing phase with the X-lock on Y it wanted.`,
    }));

    st.txns.T2.phase = 'committed';
    st.txns.T2.status = 'committed';
    release('T2', 'Y');
    frames.push(snap({
      phase: 'done', actor: 'T2',
      note: `T2 writes Y, commits, and releases. Both transactions completed in a serializable order (T1 then T2) — the wait forced exactly the ordering 2PL guarantees. A wait costs latency but never correctness.`,
    }));
    return frames;
  }

  // DEADLOCK scenario.
  acquire('T1', 'X', 'X');
  frames.push(snap({
    phase: 'grow', actor: 'T1',
    note: `T1 takes an EXCLUSIVE lock on X to write it. Granted — T1 is growing, lock count 1.`,
  }));
  acquire('T2', 'Y', 'X');
  frames.push(snap({
    phase: 'grow', actor: 'T2',
    note: `T2 takes an EXCLUSIVE lock on Y to write it. Granted — T2 is growing, lock count 1. So far no contention: they hold different items.`,
  }));

  // T1 wants Y (held by T2) -> waits.
  st.table.Y.waiters.push({ txn: 'T1', mode: 'X' });
  st.txns.T1.phase = 'blocked';
  st.txns.T1.status = 'blocked';
  st.waitEdges = [{ from: 'T1', to: 'T2', item: 'Y' }];
  frames.push(snap({
    phase: 'wait', actor: 'T1',
    note: `Now T1 also needs Y. But T2 holds Y exclusively, so T1 WAITS — edge T1 -> T2. T1 still holds its X-lock on X while it blocks. No cycle yet.`,
  }));

  // T2 wants X (held by T1) -> waits -> cycle.
  st.table.X.waiters.push({ txn: 'T2', mode: 'X' });
  st.txns.T2.phase = 'blocked';
  st.txns.T2.status = 'blocked';
  st.waitEdges = [
    { from: 'T1', to: 'T2', item: 'Y' },
    { from: 'T2', to: 'T1', item: 'X' },
  ];
  st.cycle = true;
  frames.push(snap({
    phase: 'deadlock', actor: 'T2',
    note: `T2 now needs X, which T1 holds. T2 WAITS on T1 — edge T2 -> T1. The wait-for graph is now T1 -> T2 -> T1: a CYCLE. Neither can move; this is a DEADLOCK. Both are stuck holding what the other needs.`,
  }));

  // Manager picks a victim.
  st.victim = 'T2';
  st.txns.T2.phase = 'aborted';
  st.txns.T2.status = 'aborted';
  frames.push(snap({
    phase: 'abort', actor: 'T2',
    note: `The lock manager runs deadlock detection, finds the cycle, and breaks it by choosing a VICTIM — here T2 (often the txn with less work done or a younger timestamp). T2 is aborted and rolled back.`,
  }));

  // Release T2's locks, clear its wait, grant Y to T1.
  release('T2', 'Y');
  st.table.X.waiters = st.table.X.waiters.filter((w) => w.txn !== 'T2');
  st.table.Y.waiters = st.table.Y.waiters.filter((w) => w.txn !== 'T1');
  st.waitEdges = [];
  st.cycle = false;
  acquire('T1', 'Y', 'X');
  st.txns.T1.phase = 'growing';
  st.txns.T1.status = 'idle';
  frames.push(snap({
    phase: 'recover', actor: 'T1',
    note: `Aborting T2 releases its lock on Y and drops both wait edges, so the cycle is gone. The manager grants Y to the waiting T1. T1 unblocks and resumes growing — it now holds both X and Y.`,
  }));

  // T1 commits.
  st.txns.T1.phase = strict ? 'shrinking' : 'shrinking';
  st.txns.T1.status = 'committed';
  release('T1', 'X');
  release('T1', 'Y');
  st.txns.T1.phase = 'committed';
  frames.push(snap({
    phase: 'done', actor: 'T1',
    note: strict
      ? `T1 writes both items and commits, releasing all locks at once (strict 2PL). T2 will be restarted from scratch by the scheduler. The deadlock cost one wasted transaction, but the survivor ran serializably.`
      : `T1 writes both items, commits, and releases. T2 is restarted by the scheduler and will retry. Deadlock detection turned a permanent hang into one re-run — correctness preserved.`,
  }));

  return frames;
}

const SCENARIOS = {
  'Lock wait (no cycle)': 'wait',
  'Deadlock -> abort victim': 'deadlock',
};
const SCEN_KEYS = Object.keys(SCENARIOS);

const PHASE_LABEL = {
  init: 'setup',
  grow: 'growing',
  wait: 'waiting',
  shrink: 'shrinking',
  deadlock: 'deadlock',
  abort: 'abort victim',
  recover: 'recovering',
  done: 'committed',
};

const RUN_DELAY_MS = 1600;

export default function TwoPhaseLockingViz() {
  const [scenario, setScenario] = useState(SCEN_KEYS[0]);
  const [strict, setStrict] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const mode = SCENARIOS[scenario];
  const frames = useMemo(() => buildFrames(mode, strict), [mode, strict]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

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

  const reset = () => { setIsRunning(false); setStep(0); };

  const switchScenario = (s) => {
    if (s === scenario) return;
    setIsRunning(false);
    setStep(0);
    setScenario(s);
  };

  const toggleStrict = () => {
    setIsRunning(false);
    setStep(0);
    setStrict((v) => !v);
  };

  // SVG geometry.
  const W = 940;
  const H = 420;
  const t1x = 200;
  const t2x = 740;
  const txnY = 110;
  const txnW = 240;
  const txnH = 116;
  const itemY = 318;
  const itemXx = 360;
  const itemYx = 580;
  const itemR = 40;

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const T1 = current.txns.T1;
  const T2 = current.txns.T2;
  const cycle = current.cycle;
  const victim = current.victim;

  const txnPos = { T1: { x: t1x, y: txnY }, T2: { x: t2x, y: txnY } };
  const itemPos = { X: { x: itemXx, y: itemY }, Y: { x: itemYx, y: itemY } };

  const phaseTone = (ph) => {
    if (ph === 'committed') return 'ok';
    if (ph === 'aborted') return 'bad';
    if (ph === 'blocked') return 'warn';
    if (ph === 'shrinking') return 'shrink';
    return 'grow';
  };

  const PhaseIcon = (ph) => {
    if (ph === 'committed') return <Check width={15} height={15} className="tpl-txn-ic is-ok" />;
    if (ph === 'aborted') return <Skull width={15} height={15} className="tpl-txn-ic is-bad" />;
    if (ph === 'blocked') return <Clock width={15} height={15} className="tpl-txn-ic is-warn" />;
    if (ph === 'shrinking') return <ArrowDown width={15} height={15} className="tpl-txn-ic is-shrink" />;
    return <ArrowUp width={15} height={15} className="tpl-txn-ic is-grow" />;
  };

  const TxnBox = (txn) => {
    const p = txnPos[txn.id];
    const active = current.actor === txn.id;
    const tone = phaseTone(txn.phase);
    return (
      <g key={txn.id}>
        <rect
          className={`tpl-txn is-${tone} ${active ? 'is-active' : ''}`}
          x={p.x - txnW / 2}
          y={p.y - txnH / 2}
          width={txnW}
          height={txnH}
          rx={12}
        />
        <g transform={`translate(${p.x - txnW / 2 + 14}, ${p.y - txnH / 2 + 12})`}>
          {PhaseIcon(txn.phase)}
        </g>
        <text className="tpl-txn-id" x={p.x - txnW / 2 + 36} y={p.y - txnH / 2 + 25} textAnchor="start">{txn.id}</text>
        <text className={`tpl-txn-phase is-${tone}`} x={p.x + txnW / 2 - 14} y={p.y - txnH / 2 + 25} textAnchor="end">
          {txn.phase}
        </text>
        <line className="tpl-txn-div" x1={p.x - txnW / 2 + 14} y1={p.y - txnH / 2 + 38} x2={p.x + txnW / 2 - 14} y2={p.y - txnH / 2 + 38} />
        <text className="tpl-txn-meta" x={p.x - txnW / 2 + 16} y={p.y - txnH / 2 + 58} textAnchor="start">
          {`locks held: ${txn.held.length}`}
        </text>
        {txn.held.length === 0 ? (
          <text className="tpl-txn-locks is-dim" x={p.x - txnW / 2 + 16} y={p.y - txnH / 2 + 78} textAnchor="start">none</text>
        ) : (
          txn.held.map((h, i) => (
            <g key={`${txn.id}-${h.item}`} transform={`translate(${p.x - txnW / 2 + 16 + i * 86}, ${p.y - txnH / 2 + 66})`}>
              <rect className={`tpl-lockchip is-${h.mode === 'X' ? 'excl' : 'shared'}`} x={0} y={0} width={78} height={22} rx={6} />
              <text className="tpl-lockchip-t" x={39} y={15} textAnchor="middle">
                {`${h.mode === 'X' ? 'X-lock' : 'S-lock'} ${h.item}`}
              </text>
            </g>
          ))
        )}
        {victim === txn.id && (
          <text className="tpl-txn-victim" x={p.x} y={p.y + txnH / 2 + 16} textAnchor="middle">VICTIM — aborted</text>
        )}
      </g>
    );
  };

  // wait edges between txn boxes (curved through the middle).
  const waitEdge = (e, i) => {
    const a = txnPos[e.from];
    const b = txnPos[e.to];
    const sx = a.x + (b.x > a.x ? txnW / 2 : -txnW / 2);
    const ex = b.x + (b.x > a.x ? -txnW / 2 : txnW / 2);
    const dir = e.from === 'T1' ? -1 : 1;
    const sy = a.y + dir * 18;
    const ey = b.y + dir * 18;
    const my = txnY + dir * 64;
    return (
      <g key={`wait-${i}-${e.from}-${e.to}`}>
        <path
          className={`tpl-wait ${cycle ? 'is-cycle' : ''}`}
          d={`M ${sx} ${sy} Q ${(sx + ex) / 2} ${my} ${ex} ${ey}`}
          markerEnd={`url(#tpl-arr-wait${cycle ? '-cycle' : ''})`}
          fill="none"
        />
        <text className={`tpl-wait-label ${cycle ? 'is-cycle' : ''}`} x={(sx + ex) / 2} y={my + (dir < 0 ? -4 : 14)} textAnchor="middle">
          {`waits for ${e.item}`}
        </text>
      </g>
    );
  };

  // lock-acquire lines from txn to held item.
  const heldLines = [];
  ['T1', 'T2'].forEach((tid) => {
    current.txns[tid].held.forEach((h) => {
      heldLines.push({ txn: tid, item: h.item, mode: h.mode });
    });
  });

  const lockTableRows = ITEMS.map((it) => {
    const cell = current.table[it];
    const holders = cell.holders.map((h) => `${h.txn}:${h.mode}`).join(', ') || '—';
    const waiters = cell.waiters.map((w) => `${w.txn}:${w.mode}`).join(', ') || '—';
    return { item: it, holders, waiters, conflict: cell.waiters.length > 0 };
  });

  return (
    <div className="tpl">
      <div className="tpl-head">
        <h3 className="tpl-title">Two-phase locking — growing, shrinking, and the deadlock it can cause</h3>
        <p className="tpl-sub">
          T1 and T2 acquire shared and exclusive locks on X and Y. Locks only grow, then only
          shrink; conflicting requests wait. Step through a plain wait or a wait-for cycle that
          forces the manager to abort a victim, and toggle strict 2PL to hold locks until commit.
        </p>
      </div>

      <div className="tpl-controls">
        <div className="tpl-modes" role="tablist" aria-label="Scenario">
          {SCEN_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              className={`tpl-mode ${scenario === s ? 'is-on' : ''}`}
              onClick={() => switchScenario(s)}
              aria-pressed={scenario === s}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`tpl-strict ${strict ? 'is-on' : ''}`}
          onClick={toggleStrict}
          aria-pressed={strict}
          title="Strict 2PL holds all locks until commit/abort"
        >
          {strict ? <Lock size={13} /> : <Unlock size={13} />} strict 2PL {strict ? 'on' : 'off'}
        </button>

        <label className="tpl-speed">
          <span className="tpl-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="tpl-speed-range"
            aria-label="Playback speed"
          />
          <span className="tpl-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="tpl-spacer" aria-hidden="true" />

        <div className="tpl-buttons">
          <button
            type="button"
            className="tpl-btn tpl-btn-primary"
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
            className="tpl-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="tpl-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="tpl-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="tpl-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="tpl-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tpl-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tpl-arr-wait" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpl-ah is-wait" />
            </marker>
            <marker id="tpl-arr-wait-cycle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpl-ah is-cycle" />
            </marker>
            <marker id="tpl-arr-hold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpl-ah is-hold" />
            </marker>
          </defs>

          {/* hold lines txn -> item */}
          {heldLines.map((hl) => {
            const a = txnPos[hl.txn];
            const b = itemPos[hl.item];
            const sy = a.y + txnH / 2;
            return (
              <g key={`hold-${hl.txn}-${hl.item}`}>
                <line
                  className={`tpl-hold is-${hl.mode === 'X' ? 'excl' : 'shared'}`}
                  x1={a.x}
                  y1={sy}
                  x2={b.x}
                  y2={b.y - itemR - 4}
                  markerEnd="url(#tpl-arr-hold)"
                />
              </g>
            );
          })}

          {/* wait edges */}
          {current.waitEdges.map((e, i) => waitEdge(e, i))}

          {/* data items */}
          {ITEMS.map((it) => {
            const p = itemPos[it];
            const cell = current.table[it];
            const conflict = cell.waiters.length > 0;
            const held = cell.holders.length > 0;
            return (
              <g key={`item-${it}`}>
                <circle
                  className={`tpl-item ${held ? 'is-held' : ''} ${conflict ? 'is-conflict' : ''}`}
                  cx={p.x}
                  cy={p.y}
                  r={itemR}
                />
                <g transform={`translate(${p.x - 9}, ${p.y - 22})`}>
                  {held ? (
                    <Lock width={18} height={18} className={`tpl-item-ic ${conflict ? 'is-conflict' : 'is-held'}`} />
                  ) : (
                    <Unlock width={18} height={18} className="tpl-item-ic is-free" />
                  )}
                </g>
                <text className="tpl-item-id" x={p.x} y={p.y + 12} textAnchor="middle">{it}</text>
                <text className="tpl-item-sub" x={p.x} y={p.y + itemR + 16} textAnchor="middle">
                  {held ? cell.holders.map((h) => `${h.txn}:${h.mode}`).join(', ') : 'free'}
                </text>
              </g>
            );
          })}

          {TxnBox(T1)}
          {TxnBox(T2)}

          {cycle && (
            <g>
              <g transform={`translate(${W / 2 - 11}, ${txnY - 12})`}>
                <AlertTriangle width={22} height={22} className="tpl-cycle-ic" />
              </g>
              <text className="tpl-cycle-label" x={W / 2} y={txnY + 28} textAnchor="middle">wait-for cycle</text>
            </g>
          )}
        </svg>
      </div>

      <div className="tpl-metrics">
        <div className="tpl-metric">
          <span className="tpl-metric-label">T1 phase</span>
          <span className={`tpl-metric-value is-${phaseTone(T1.phase)}`}>{T1.phase} · {T1.held.length} locks</span>
        </div>
        <div className="tpl-metric">
          <span className="tpl-metric-label">T2 phase</span>
          <span className={`tpl-metric-value is-${phaseTone(T2.phase)}`}>{T2.phase} · {T2.held.length} locks</span>
        </div>
        <div className="tpl-metric">
          <span className="tpl-metric-label">wait-for cycle</span>
          <span className={`tpl-metric-value ${cycle ? 'is-bad' : 'is-ok'}`}>{cycle ? 'yes — deadlock' : 'no'}</span>
        </div>
        <div className="tpl-metric">
          <span className="tpl-metric-label">victim</span>
          <span className={`tpl-metric-value ${victim ? 'is-bad' : ''}`}>{victim || 'none'}</span>
        </div>
        <div className="tpl-metric tpl-metric-dim">
          <span className="tpl-metric-label">mode</span>
          <span className="tpl-metric-value">{strict ? 'strict 2PL' : 'basic 2PL'}</span>
        </div>
      </div>

      <div className="tpl-table">
        <div className="tpl-table-head">
          <span>item</span>
          <span>holder(s) + mode</span>
          <span>waiting</span>
        </div>
        {lockTableRows.map((r) => (
          <div key={`row-${r.item}`} className={`tpl-table-row ${r.conflict ? 'is-conflict' : ''}`}>
            <span className="tpl-table-item">{r.item}</span>
            <span className="tpl-table-hold">{r.holders}</span>
            <span className={`tpl-table-wait ${r.conflict ? 'is-conflict' : ''}`}>{r.waiters}</span>
          </div>
        ))}
      </div>

      <div className={`tpl-narration ${cycle ? 'is-bad' : current.phase === 'done' ? 'is-ok' : current.phase === 'wait' ? 'is-warn' : ''}`}>
        <span className={`tpl-narration-label ${cycle ? 'is-bad' : current.phase === 'done' ? 'is-ok' : current.phase === 'wait' ? 'is-warn' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="tpl-narration-body">{current.note}</span>
      </div>

      <div className="tpl-legend">
        <span className="tpl-legend-item"><BookOpen size={13} className="tpl-ic is-shared" /> S-lock — shared read, S+S compatible</span>
        <span className="tpl-legend-item"><Pencil size={13} className="tpl-ic is-excl" /> X-lock — exclusive write, conflicts with all</span>
        <span className="tpl-legend-item"><Clock size={13} className="tpl-ic is-warn" /> conflicting request waits</span>
        <span className="tpl-legend-item"><AlertTriangle size={13} className="tpl-ic is-bad" /> wait-for cycle — abort a victim</span>
      </div>
    </div>
  );
}
