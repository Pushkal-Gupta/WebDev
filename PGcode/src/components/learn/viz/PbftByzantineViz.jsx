import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Crown, Server, ShieldCheck, ShieldAlert, Check,
} from 'lucide-react';
import './PbftByzantineViz.css';

// PBFT — Practical Byzantine Fault Tolerance across N = 3f + 1 replicas (f = 1,
// so N = 4). One replica is the primary; clients send a request and the cluster
// runs three phases. The reader should leave understanding WHY 3f + 1 replicas
// and a 2f + 1 quorum are the magic numbers:
//
//   Pre-Prepare  primary assigns a sequence number n to the request and
//                broadcasts <PRE-PREPARE, n, request> to all backups.
//   Prepare      every honest replica that accepts the pre-prepare broadcasts
//                <PREPARE, n>. A replica is "prepared" once it has collected
//                2f matching PREPAREs (plus the pre-prepare) — 2f + 1 total.
//   Commit       prepared replicas broadcast <COMMIT, n>. Once a replica sees
//                2f + 1 matching COMMITs it executes and replies to the client.
//
// A Byzantine replica can equivocate — send a PREPARE for one value to half the
// cluster and a conflicting value to the other half. With N = 3f + 1, the honest
// replicas (2f + 1 of them) still form a quorum that overlaps any other quorum
// in at least f + 1 honest nodes, so two conflicting requests can never both
// reach 2f + 1 honest agreement. Safety holds. If you tried N = 3f the faulty
// node would be the swing vote and could decide two values — that's why the
// total must be 3f + 1, not 3f.

const F = 1;
const N = 3 * F + 1; // 4
const QUORUM = 2 * F + 1; // 3

const PHASE_LABEL = {
  init: 'setup',
  request: 'client request',
  preprepare: 'pre-prepare',
  prepare: 'prepare',
  commit: 'commit',
  reply: 'reply',
  done: 'committed',
};

// replicas 0..3. Replica 0 is the primary.
function replicas(byz) {
  return Array.from({ length: N }, (_, i) => ({
    id: i,
    primary: i === 0,
    byzantine: i === byz,
  }));
}

function snap(extra) {
  return {
    phase: 'init',
    active: [],
    msgs: [], // { from, to, kind, conflict }
    prepared: [], // replica ids that reached 2f+1 PREPAREs
    committed: [], // replica ids that reached 2f+1 COMMITs
    prepareCount: 0,
    commitCount: 0,
    note: '',
    safe: true,
    ...extra,
  };
}

// Build the frame list. `byz` is the id of the Byzantine replica (or -1 = none).
function buildFrames(byz) {
  const frames = [];
  const reps = replicas(byz);
  const honest = reps.filter((r) => !r.byzantine).map((r) => r.id);
  const byzNote = byz >= 0
    ? `Replica R${byz} is Byzantine — it will equivocate, sending a PREPARE for one value to some peers and a conflicting one to others.`
    : 'All four replicas are honest this run; toggle a Byzantine replica to see equivocation handled.';

  frames.push(snap({
    phase: 'init',
    note: `Four replicas, R0 the primary. PBFT tolerates f = ${F} faulty node out of N = 3f + 1 = ${N}; a decision needs a quorum of 2f + 1 = ${QUORUM}. ${byzNote} Step through the three phases.`,
  }));

  // Client request -> primary
  frames.push(snap({
    phase: 'request',
    active: [0],
    msgs: [{ from: 'client', to: 0, kind: 'request' }],
    note: 'The client sends its request to the primary R0. Only the primary may assign the request a sequence number — that single ordering is what every honest replica must agree on.',
  }));

  // Pre-prepare: primary -> all backups
  frames.push(snap({
    phase: 'preprepare',
    active: [0, 1, 2, 3],
    msgs: [1, 2, 3].map((to) => ({ from: 0, to, kind: 'preprepare' })),
    note: 'PRE-PREPARE. R0 assigns sequence number n = 12 to the request and broadcasts <PRE-PREPARE, n, request> to every backup. Backups accept it only if they have not already accepted a different request at n — this pins the order.',
  }));

  // Prepare: every honest replica broadcasts PREPARE. Byzantine one equivocates.
  const prepMsgs = [];
  reps.forEach((r) => {
    reps.forEach((t) => {
      if (r.id === t.id) return;
      if (r.primary) return; // primary already sent pre-prepare; backups send prepare
      const conflict = r.byzantine;
      prepMsgs.push({ from: r.id, to: t.id, kind: 'prepare', conflict });
    });
  });
  // honest replicas collect 2f matching PREPAREs + the pre-prepare = 2f+1 -> prepared
  frames.push(snap({
    phase: 'prepare',
    active: honest,
    msgs: prepMsgs,
    prepareCount: QUORUM,
    prepared: byz >= 0 ? honest : [0, 1, 2, 3],
    note: byz >= 0
      ? `PREPARE. Honest backups broadcast <PREPARE, n>. R${byz} equivocates — its conflicting PREPAREs (dashed) reach only part of the cluster. Each honest replica still gathers 2f = ${2 * F} matching honest PREPAREs plus the pre-prepare = ${QUORUM}, so it becomes "prepared" on the genuine request. The fake votes never reach a quorum.`
      : `PREPARE. Each backup broadcasts <PREPARE, n> and collects ${2 * F} matching peers plus the pre-prepare = ${QUORUM} total. Every replica is now "prepared": they agree on the order, but have not yet committed.`,
  }));

  // Commit: prepared replicas broadcast COMMIT.
  const commitMsgs = [];
  const preparedSet = byz >= 0 ? honest : [0, 1, 2, 3];
  preparedSet.forEach((from) => {
    [0, 1, 2, 3].forEach((to) => {
      if (from === to) return;
      commitMsgs.push({ from, to, kind: 'commit' });
    });
  });
  frames.push(snap({
    phase: 'commit',
    active: honest,
    msgs: commitMsgs,
    prepared: preparedSet,
    commitCount: QUORUM,
    committed: honest,
    note: byz >= 0
      ? `COMMIT. Prepared replicas broadcast <COMMIT, n>. The ${QUORUM} honest replicas exchange matching COMMITs and each crosses the 2f + 1 = ${QUORUM} threshold. Because any two quorums of ${QUORUM} in a cluster of ${N} overlap in at least f + 1 = ${F + 1} honest nodes, no conflicting value can also reach ${QUORUM} — safety is mathematically guaranteed.`
      : `COMMIT. Each prepared replica broadcasts <COMMIT, n> and waits for ${QUORUM} matching COMMITs. Crossing 2f + 1 means a majority of HONEST replicas have locked in this order even if one were to fail next.`,
  }));

  // Reply to client
  frames.push(snap({
    phase: 'reply',
    active: honest,
    prepared: preparedSet,
    committed: honest,
    commitCount: QUORUM,
    msgs: honest.map((from) => ({ from, to: 'client', kind: 'reply' })),
    note: `REPLY. Each committed replica executes the request and sends its result to the client. The client waits for f + 1 = ${F + 1} matching replies — that many agreeing answers must include at least one honest replica, so the client trusts the result even though it cannot tell which single node might be lying.`,
  }));

  frames.push(snap({
    phase: 'done',
    active: [0, 1, 2, 3],
    prepared: preparedSet,
    committed: honest,
    commitCount: QUORUM,
    safe: true,
    note: byz >= 0
      ? `Committed and safe. ${QUORUM} honest replicas agreed on the same order despite R${byz} equivocating. Try N = 3f instead of 3f + 1 and the faulty node becomes the swing vote — two quorums could disagree. The extra replica is exactly what keeps overlapping quorums honest.`
      : `Committed. Three matching phases (pre-prepare, prepare, commit) and a 2f + 1 quorum at each step give Byzantine agreement: order fixed, request executed, client answered. Flip on a Byzantine replica to watch equivocation get absorbed.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1500;

export default function PbftByzantineViz() {
  const [byz, setByz] = useState(-1); // -1 none, else replica id
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(byz), [byz]);
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
  const toggleByz = (id) => {
    setIsRunning(false);
    setStep(0);
    setByz((prev) => (prev === id ? -1 : id));
  };

  // SVG geometry — client on the left, four replicas around a column.
  const W = 940;
  const H = 460;
  const clientX = 120;
  const clientY = 230;
  const repCx = 560;
  const repCy = 230;
  const ringR = 150;
  const repR = 34;
  const repPos = (id) => {
    const ang = (-90 + id * (360 / N)) * (Math.PI / 180);
    return { x: repCx + ringR * Math.cos(ang), y: repCy + ringR * Math.sin(ang) };
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const fromXY = (from) => (from === 'client' ? { x: clientX, y: clientY } : repPos(from));
  const toXY = (to) => (to === 'client' ? { x: clientX, y: clientY } : repPos(to));

  const edgeTone = (kind) => {
    if (kind === 'request' || kind === 'reply') return 'client';
    return kind; // preprepare | prepare | commit
  };

  const quorumMet = current.committed.length >= QUORUM;

  return (
    <div className="pbv">
      <div className="pbv-head">
        <h3 className="pbv-title">PBFT — agreeing despite a liar in the cluster</h3>
        <p className="pbv-sub">
          Four replicas, one primary, three phases. A quorum of 2f + 1 at each phase lets the honest
          majority pin one order even when a Byzantine replica sends conflicting messages. Toggle which
          replica lies and watch safety hold.
        </p>
      </div>

      <div className="pbv-controls">
        <div className="pbv-byz" role="group" aria-label="Byzantine replica">
          <span className="pbv-input-label">byzantine</span>
          {[0, 1, 2, 3].map((id) => (
            <button
              key={id}
              type="button"
              className={`pbv-byz-btn ${byz === id ? 'is-on' : ''} ${id === 0 ? 'is-primary' : ''}`}
              onClick={() => toggleByz(id)}
              aria-pressed={byz === id}
              title={id === 0 ? 'Make the primary R0 Byzantine' : `Make backup R${id} Byzantine`}
            >
              R{id}{id === 0 ? ' (primary)' : ''}
            </button>
          ))}
          <button
            type="button"
            className={`pbv-byz-btn ${byz === -1 ? 'is-on' : ''}`}
            onClick={() => { setIsRunning(false); setStep(0); setByz(-1); }}
            aria-pressed={byz === -1}
          >
            none
          </button>
        </div>

        <label className="pbv-speed">
          <span className="pbv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pbv-speed-range"
            aria-label="Playback speed"
          />
          <span className="pbv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="pbv-spacer" aria-hidden="true" />

        <div className="pbv-buttons">
          <button
            type="button"
            className="pbv-btn pbv-btn-primary"
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
            className="pbv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="pbv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="pbv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="pbv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="pbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pbv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            {['client', 'preprepare', 'prepare', 'commit'].map((t) => (
              <marker key={t} id={`pbv-arr-${t}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className={`pbv-ah is-${t}`} />
              </marker>
            ))}
            <marker id="pbv-arr-conflict" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pbv-ah is-conflict" />
            </marker>
          </defs>

          {/* edges */}
          {current.msgs.map((m, i) => {
            const a = fromXY(m.from);
            const b = toXY(m.to);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const sx = a.x + ux * (repR + 6);
            const sy = a.y + uy * (repR + 6);
            const ex = b.x - ux * (repR + 8);
            const ey = b.y - uy * (repR + 8);
            const tone = m.conflict ? 'conflict' : edgeTone(m.kind);
            return (
              <line
                key={`m-${i}-${m.from}-${m.to}`}
                className={`pbv-edge is-${tone}`}
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                markerEnd={`url(#pbv-arr-${tone})`}
              />
            );
          })}

          {/* client */}
          <g>
            <rect className={`pbv-client ${quorumMet && current.phase === 'done' ? 'is-done' : ''}`} x={clientX - 52} y={clientY - 32} width={104} height={64} rx={10} />
            <text className="pbv-client-label" x={clientX} y={clientY - 2} textAnchor="middle">client</text>
            <text className="pbv-client-sub" x={clientX} y={clientY + 16} textAnchor="middle">{`waits f+1 = ${F + 1}`}</text>
          </g>

          {/* replicas */}
          {replicas(byz).map((r) => {
            const p = repPos(r.id);
            const active = current.active.includes(r.id);
            const isPrepared = current.prepared.includes(r.id);
            const isCommitted = current.committed.includes(r.id);
            const tone = r.byzantine ? 'is-byz' : isCommitted ? 'is-committed' : isPrepared ? 'is-prepared' : active ? 'is-active' : '';
            return (
              <g key={`rep-${r.id}`}>
                <circle className={`pbv-rep ${tone}`} cx={p.x} cy={p.y} r={repR} />
                <g transform={`translate(${p.x - 10}, ${p.y - 19})`}>
                  {r.byzantine
                    ? <ShieldAlert width={19} height={19} className="pbv-rep-ic is-byz" />
                    : r.primary
                      ? <Crown width={19} height={19} className="pbv-rep-ic is-primary" />
                      : isCommitted
                        ? <ShieldCheck width={19} height={19} className="pbv-rep-ic is-committed" />
                        : <Server width={18} height={18} className="pbv-rep-ic" />}
                </g>
                <text className="pbv-rep-id" x={p.x} y={p.y + 9} textAnchor="middle">{`R${r.id}`}</text>
                <text className={`pbv-rep-state ${r.byzantine ? 'is-byz' : isCommitted ? 'is-committed' : ''}`} x={p.x} y={p.y + repR + 16} textAnchor="middle">
                  {r.byzantine ? 'byzantine' : isCommitted ? 'committed' : isPrepared ? 'prepared' : r.primary ? 'primary' : 'backup'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pbv-metrics">
        <div className="pbv-metric">
          <span className="pbv-metric-label">phase</span>
          <span className="pbv-metric-value">{PHASE_LABEL[current.phase] || current.phase}</span>
        </div>
        <div className="pbv-metric">
          <span className="pbv-metric-label">prepare votes</span>
          <span className={`pbv-metric-value ${current.prepareCount >= QUORUM ? 'is-ok' : ''}`}>{`${current.prepareCount} / need ${QUORUM}`}</span>
        </div>
        <div className="pbv-metric">
          <span className="pbv-metric-label">commit votes</span>
          <span className={`pbv-metric-value ${current.commitCount >= QUORUM ? 'is-ok' : ''}`}>{`${current.commitCount} / need ${QUORUM}`}</span>
        </div>
        <div className="pbv-metric">
          <span className="pbv-metric-label">N = 3f+1</span>
          <span className="pbv-metric-value">{`${N} (f = ${F})`}</span>
        </div>
        <div className="pbv-metric pbv-metric-dim">
          <span className="pbv-metric-label">safety</span>
          <span className={`pbv-metric-value ${current.safe ? 'is-ok' : 'is-bad'}`}>{current.safe ? 'held' : 'violated'}</span>
        </div>
      </div>

      <div className="pbv-narration">
        <span className="pbv-narration-label">{PHASE_LABEL[current.phase] || current.phase}</span>
        <span className="pbv-narration-body">{current.note}</span>
      </div>

      <div className="pbv-legend">
        <span className="pbv-legend-item"><Crown size={13} className="pbv-ic is-primary" /> primary — assigns the sequence number</span>
        <span className="pbv-legend-item"><Check size={13} className="pbv-ic is-prepare" /> 2f+1 quorum at prepare and commit</span>
        <span className="pbv-legend-item"><ShieldAlert size={13} className="pbv-ic is-conflict" /> byzantine — equivocates (dashed)</span>
        <span className="pbv-legend-item"><ShieldCheck size={13} className="pbv-ic is-committed" /> committed — safe order locked</span>
      </div>
    </div>
  );
}
