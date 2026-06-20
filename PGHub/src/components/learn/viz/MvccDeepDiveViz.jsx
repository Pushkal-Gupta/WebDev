import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  ShieldCheck, ShieldOff, AlertTriangle, GitBranch, Ban, Check,
} from 'lucide-react';
import './MvccDeepDiveViz.css';

// MVCC deep dive — write skew under snapshot isolation, and how serializable
// snapshot isolation (SSI) catches it.
//
// The classic on-call example: a rule says "at least one doctor must stay on
// call." Two doctors are both on call. Alice and Bob each open a transaction and
// each take their OWN snapshot — at that snapshot BOTH doctors are on call, so
// each independently concludes "the other covers it" and removes THEMSELVES.
// Neither read the other's write (they touched DISJOINT rows), so there is no
// write-write conflict for MVCC to catch. Both commit. Now ZERO doctors are on
// call — the invariant is violated. This is WRITE SKEW: snapshot isolation does
// NOT prevent it, because SI only guards against writing the same row twice.
//
// SSI adds dependency tracking. It notices a dangerous structure: T1 read a row
// that T2 wrote, AND T2 read a row that T1 wrote — two read-write (rw) anti-
// dependency edges forming a cycle. That cycle is the signature of a
// serializability violation, so SSI ABORTS one transaction at commit. The
// survivor re-reads and sees a doctor is still on call, so it can't go off call.
//
// Interactive: step the two transactions into the skew; toggle SI (anomaly
// slips through, invariant broken) vs SSI (the rw-cycle is detected, one aborts).

// row state: two doctors both on call at the start
const DOCTORS = [
  { id: 'alice', label: 'Alice' },
  { id: 'bob', label: 'Bob' },
];

// scripted steps shared by both modes; the divergence is only at commit
const STEPS = [
  {
    t1: { act: 'begin', rw: null }, t2: { act: 'idle', rw: null },
    shared: 'Both doctors are on call. T1 (Alice) begins and takes a snapshot — at this instant on_call = { Alice: true, Bob: true }.',
    edges: [],
  },
  {
    t1: { act: 'snapshot', rw: null }, t2: { act: 'begin', rw: null },
    shared: 'T2 (Bob) begins and takes its OWN snapshot. It too sees both doctors on call. The two snapshots are independent — neither will see the other\'s later writes.',
    edges: [],
  },
  {
    t1: { act: 'read', rw: 'r-bob' }, t2: { act: 'read', rw: 'r-alice' },
    shared: 'Each transaction reads the OTHER doctor\'s row to check the rule. T1 reads Bob = on call; T2 reads Alice = on call. Both conclude "someone else covers it" — so each thinks it is safe to go off call.',
    edges: [],
  },
  {
    t1: { act: 'write', rw: 'w-alice' }, t2: { act: 'write', rw: 'w-bob' },
    shared: 'They write DISJOINT rows: T1 sets Alice = off call, T2 sets Bob = off call. No two transactions wrote the same row, so there is no write-write conflict for plain MVCC to flag.',
    edges: ['t1rt2', 't2rt1'],
  },
  {
    t1: { act: 'commit', rw: null }, t2: { act: 'commit', rw: null },
    shared: 'Commit time — this is where snapshot isolation and serializable diverge.',
    edges: ['t1rt2', 't2rt1'],
  },
];

export default function MvccDeepDiveViz() {
  const [mode, setMode] = useState('si'); // 'si' | 'ssi'
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.4);
  const runTimer = useRef(null);

  const totalSteps = STEPS.length;
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = useMemo(() => Math.round(1700 / Math.max(speed, 0.1)), [speed]);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), delay);
    return () => {
      if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => { if (runTimer.current) clearTimeout(runTimer.current); }, []);

  const reset = () => { setIsRunning(false); setStep(0); };

  const cur = STEPS[Math.min(step, totalSteps - 1)];
  const atCommit = step >= totalSteps - 1;
  const isSsi = mode === 'ssi';

  // outcome only resolves at the commit step
  // SI: both commit -> 0 doctors on call -> invariant violated
  // SSI: rw-cycle detected -> T2 aborted -> T1 commits -> 1 doctor still on call
  const t1Outcome = !atCommit ? 'pending' : 'committed';
  const t2Outcome = !atCommit ? 'pending' : (isSsi ? 'aborted' : 'committed');

  // final on-call state
  const aliceOnCall = !(atCommit); // T1 always commits Alice off
  const bobOnCall = !atCommit ? true : (isSsi ? true : false); // SSI aborts T2, Bob stays on
  // before commit, writes are only staged (not visible) — show staged flags
  const aliceStaged = step >= 3;
  const bobStaged = step >= 3;
  const onCallCount = (atCommit
    ? ((isSsi ? 1 : 0))
    : 2);
  const violated = atCommit && !isSsi;

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ---- SVG geometry ----
  const W = 960;
  const H = 420;
  const laneTop = 70;
  const laneH = 220;
  const t1X = 30;
  const t2X = W - 30 - 360;
  const laneW = 360;

  const narrTone = violated ? 'is-warn' : (atCommit && isSsi) ? 'is-ok' : '';

  // edge endpoints for the rw-dependency cycle (drawn at write/commit steps)
  const showEdges = cur.edges.length > 0;
  const dbCx = W / 2;
  const aliceRowY = laneTop + 80;
  const bobRowY = laneTop + 150;

  const txState = (tx) => {
    const act = tx.act;
    const labels = {
      begin: 'BEGIN', snapshot: 'snapshot taken', read: 'SELECT (read)',
      write: 'UPDATE (staged)', commit: 'COMMIT', idle: 'waiting',
    };
    return labels[act] || act;
  };

  return (
    <div className="mdd">
      <div className="mdd-head">
        <h3 className="mdd-title">MVCC deep dive — write skew, and how serializable catches it</h3>
        <p className="mdd-sub">
          Two transactions each read that the other doctor is on call, then each take themselves off — disjoint
          writes, so MVCC sees no conflict. Snapshot isolation lets both commit and breaks the rule; serializable
          detects the read-write cycle and aborts one.
        </p>
      </div>

      <div className="mdd-controls">
        <div className="mdd-modes" role="group" aria-label="Isolation level">
          <button
            type="button"
            className={`mdd-mode ${!isSsi ? 'is-on is-warn' : ''}`}
            onClick={() => { setMode('si'); }}
            aria-pressed={!isSsi}
          >
            <ShieldOff size={13} /> snapshot isolation
          </button>
          <button
            type="button"
            className={`mdd-mode ${isSsi ? 'is-on is-ok' : ''}`}
            onClick={() => { setMode('ssi'); }}
            aria-pressed={isSsi}
          >
            <ShieldCheck size={13} /> serializable (SSI)
          </button>
        </div>

        <label className="mdd-speed">
          <span className="mdd-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mdd-speed-range" aria-label="Playback speed"
          />
          <span className="mdd-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mdd-spacer" aria-hidden="true" />

        <div className="mdd-buttons">
          <button
            type="button" className="mdd-btn mdd-btn-primary"
            onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunning((v) => !v); }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button type="button" className="mdd-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="mdd-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
            <SkipForward size={14} /> To commit
          </button>
          <button type="button" className="mdd-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
        <div className="mdd-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="mdd-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mdd-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mdd-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mdd-ah" />
            </marker>
            <marker id="mdd-arr-rw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mdd-ah is-rw" />
            </marker>
          </defs>

          {/* T1 lane */}
          <rect className={`mdd-lane is-t1 ${t1Outcome === 'committed' ? 'is-committed' : ''}`} x={t1X} y={laneTop} width={laneW} height={laneH} rx={10} />
          <text className="mdd-lane-title is-t1" x={t1X + 14} y={laneTop + 24} textAnchor="start">T1 — Alice goes off call</text>
          <text className="mdd-lane-state is-t1" x={t1X + laneW - 14} y={laneTop + 24} textAnchor="end">{txState(cur.t1)}</text>

          {/* T2 lane */}
          <rect className={`mdd-lane is-t2 ${t2Outcome === 'committed' ? 'is-committed' : ''} ${t2Outcome === 'aborted' ? 'is-aborted' : ''}`} x={t2X} y={laneTop} width={laneW} height={laneH} rx={10} />
          <text className="mdd-lane-title is-t2" x={t2X + 14} y={laneTop + 24} textAnchor="start">T2 — Bob goes off call</text>
          <text className="mdd-lane-state is-t2" x={t2X + laneW - 14} y={laneTop + 24} textAnchor="end">{txState(cur.t2)}</text>

          {/* operation log lines per tx */}
          {STEPS.slice(0, step + 1).map((s, i) => {
            const ly = laneTop + 44 + i * 30;
            if (ly > laneTop + laneH - 12) return null;
            const t1act = s.t1.act;
            const t2act = s.t2.act;
            return (
              <g key={i}>
                {t1act !== 'idle' && (
                  <text className={`mdd-op ${i === step ? 'is-cur' : ''} ${t1act === 'write' ? 'is-w' : ''} ${t1act === 'read' ? 'is-r' : ''}`} x={t1X + 16} y={ly} textAnchor="start">
                    {`${i + 1}. ${opText(s.t1, 'alice', 'bob')}`}
                  </text>
                )}
                {t2act !== 'idle' && (
                  <text className={`mdd-op ${i === step ? 'is-cur' : ''} ${t2act === 'write' ? 'is-w' : ''} ${t2act === 'read' ? 'is-r' : ''}`} x={t2X + 16} y={ly} textAnchor="start">
                    {`${i + 1}. ${opText(s.t2, 'bob', 'alice')}`}
                  </text>
                )}
              </g>
            );
          })}

          {/* shared DB rows in the middle */}
          <rect className="mdd-db" x={dbCx - 86} y={laneTop + 30} width={172} height={150} rx={10} />
          <text className="mdd-db-title" x={dbCx} y={laneTop + 50} textAnchor="middle">on_call table</text>

          {DOCTORS.map((d, i) => {
            const ry = i === 0 ? aliceRowY : bobRowY;
            const staged = i === 0 ? aliceStaged : bobStaged;
            const onCall = i === 0 ? aliceOnCall : bobOnCall;
            return (
              <g key={d.id}>
                <rect className={`mdd-row ${onCall ? 'is-on' : 'is-off'} ${staged && !atCommit ? 'is-staged' : ''}`} x={dbCx - 74} y={ry} width={148} height={40} rx={7} />
                <text className="mdd-row-name" x={dbCx - 62} y={ry + 17} textAnchor="start">{d.label}</text>
                <text className={`mdd-row-val ${onCall ? 'is-on' : 'is-off'}`} x={dbCx - 62} y={ry + 31} textAnchor="start">
                  {onCall ? 'on call' : 'OFF call'}
                  {staged && !atCommit ? ' (staged off)' : ''}
                </text>
              </g>
            );
          })}

          {/* rw-dependency edges forming the dangerous cycle */}
          {showEdges && (
            <g className={`mdd-edges ${isSsi && atCommit ? 'is-detected' : ''}`}>
              {/* T1 read Bob (rw with T2's write on Bob) */}
              <path
                className="mdd-rw-edge"
                d={`M ${t1X + laneW} ${laneTop + 120} C ${dbCx - 140} ${laneTop + 120}, ${dbCx - 110} ${bobRowY + 20}, ${dbCx - 78} ${bobRowY + 20}`}
                fill="none" markerEnd="url(#mdd-arr-rw)"
              />
              {/* T2 read Alice (rw with T1's write on Alice) */}
              <path
                className="mdd-rw-edge"
                d={`M ${t2X} ${laneTop + 120} C ${dbCx + 140} ${laneTop + 120}, ${dbCx + 110} ${aliceRowY + 20}, ${dbCx + 78} ${aliceRowY + 20}`}
                fill="none" markerEnd="url(#mdd-arr-rw)"
              />
              <text className="mdd-rw-label" x={dbCx} y={laneTop + laneH + 6} textAnchor="middle">
                two rw anti-dependency edges → a cycle
              </text>
            </g>
          )}

          {/* outcome banner */}
          {atCommit && (
            <g>
              <rect className={`mdd-outcome ${violated ? 'is-bad' : 'is-good'}`} x={30} y={H - 56} width={W - 60} height={42} rx={9} />
              <g transform={`translate(${46}, ${H - 45})`}>
                {violated
                  ? <AlertTriangle width={18} height={18} className="mdd-outcome-ic is-bad" />
                  : <ShieldCheck width={18} height={18} className="mdd-outcome-ic is-good" />}
              </g>
              <text className={`mdd-outcome-text ${violated ? 'is-bad' : 'is-good'}`} x={74} y={H - 35} textAnchor="start">
                {violated
                  ? `SI committed BOTH — 0 doctors on call. Invariant VIOLATED: write skew slipped through snapshot isolation.`
                  : `SSI found the rw-cycle and ABORTED T2. T1 commits; Bob stays on call. ${onCallCount} doctor on call — invariant held.`}
              </text>
            </g>
          )}

          {/* commit-status chips on each lane */}
          {atCommit && (
            <g>
              <g transform={`translate(${t1X + laneW / 2 - 40}, ${laneTop + laneH - 28})`}>
                <rect className="mdd-chip is-good" x={0} y={0} width={80} height={20} rx={5} />
                <text className="mdd-chip-t is-good" x={40} y={14} textAnchor="middle">committed</text>
              </g>
              <g transform={`translate(${t2X + laneW / 2 - 40}, ${laneTop + laneH - 28})`}>
                <rect className={`mdd-chip ${isSsi ? 'is-bad' : 'is-good'}`} x={0} y={0} width={80} height={20} rx={5} />
                <text className={`mdd-chip-t ${isSsi ? 'is-bad' : 'is-good'}`} x={40} y={14} textAnchor="middle">{isSsi ? 'aborted' : 'committed'}</text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div className="mdd-metrics">
        <div className="mdd-metric">
          <span className="mdd-metric-label">isolation</span>
          <span className="mdd-metric-value">{isSsi ? 'serializable' : 'snapshot'}</span>
        </div>
        <div className="mdd-metric">
          <span className="mdd-metric-label">T1 (Alice)</span>
          <span className={`mdd-metric-value ${t1Outcome === 'committed' ? 'is-ok' : ''}`}>{t1Outcome}</span>
        </div>
        <div className="mdd-metric">
          <span className="mdd-metric-label">T2 (Bob)</span>
          <span className={`mdd-metric-value ${t2Outcome === 'aborted' ? 'is-warn' : t2Outcome === 'committed' ? 'is-ok' : ''}`}>{t2Outcome}</span>
        </div>
        <div className="mdd-metric">
          <span className="mdd-metric-label">doctors on call</span>
          <span className={`mdd-metric-value ${violated ? 'is-warn' : atCommit ? 'is-ok' : ''}`}>{onCallCount}</span>
        </div>
        <div className="mdd-metric mdd-metric-dim">
          <span className="mdd-metric-label">invariant</span>
          <span className={`mdd-metric-value ${violated ? 'is-warn' : atCommit ? 'is-ok' : ''}`}>
            {!atCommit ? 'pending' : violated ? 'VIOLATED' : 'held'}
          </span>
        </div>
      </div>

      <div className={`mdd-narration ${narrTone}`}>
        <span className={`mdd-narration-label ${narrTone}`}>
          {violated ? 'anomaly' : (atCommit && isSsi) ? 'safe' : 'step'}
        </span>
        <span className="mdd-narration-body">
          {atCommit
            ? (isSsi
              ? `Commit under SSI: the engine had tracked that T1 read a row T2 wrote AND T2 read a row T1 wrote — a read-write dependency cycle, the signature of a non-serializable schedule. It aborts T2. On retry T2 re-reads and sees Alice already off call, so it refuses to take Bob off. The rule survives.`
              : `Commit under snapshot isolation: each transaction only checks for write-write conflicts on the SAME row. T1 wrote Alice, T2 wrote Bob — different rows, no conflict, so both commit. Their reads happened against stale snapshots where both doctors were on call. Result: zero on call. This is write skew, and SI cannot stop it.`)
            : cur.shared}
        </span>
      </div>

      <div className="mdd-legend">
        <span className="mdd-legend-item"><GitBranch size={13} className="mdd-ic is-rw" /> rw edge — read a row another tx writes</span>
        <span className="mdd-legend-item"><ShieldOff size={13} className="mdd-ic is-warn" /> snapshot isolation — misses write skew</span>
        <span className="mdd-legend-item"><ShieldCheck size={13} className="mdd-ic is-ok" /> serializable — detects the rw-cycle</span>
        <span className="mdd-legend-item"><Ban size={13} className="mdd-ic is-warn" /> abort — SSI sacrifices one tx to stay correct</span>
        <span className="mdd-legend-item"><Check size={13} className="mdd-ic is-ok" /> invariant — at least one doctor on call</span>
      </div>
    </div>
  );
}

function opText(tx, self, other) {
  const names = { alice: 'Alice', bob: 'Bob' };
  switch (tx.act) {
    case 'begin': return 'BEGIN; take snapshot';
    case 'snapshot': return 'snapshot: both on call';
    case 'read': return `SELECT ${names[other]} → on call`;
    case 'write': return `UPDATE ${names[self]} = off call`;
    case 'commit': return 'COMMIT';
    default: return tx.act;
  }
}
