import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Server, PowerOff } from 'lucide-react';
import './CasVsPaxosViz.css';

// Two ways to agree on a value:
//   CAS  — one node, one atomic compare-and-swap. Instant, but the single node is the whole system.
//   Paxos — a proposer drives 5 acceptors through PREPARE/PROMISE/ACCEPT/ACCEPTED to CHOSEN.
//           A majority quorum (3 of 5) tolerates a minority of failed acceptors.
// buildFrames(mode, failedCount) replays a fixed run, one frame per phase, deterministically.

const ACCEPTORS = 5;
const QUORUM = Math.floor(ACCEPTORS / 2) + 1; // 3 of 5

const CAS_EXPECTED = 'A';
const CAS_NEW = 'B';
const CAS_INITIAL = 'A'; // matches expected -> swap succeeds

const PAXOS_BALLOT = 7;
const PAXOS_VALUE = 'X';

// Acceptor states: 'idle' | 'promised' | 'accepted' | 'down'
function paxosAcceptors(failedCount, state) {
  return Array.from({ length: ACCEPTORS }, (_, i) => ({
    id: i,
    state: i < failedCount ? 'down' : state,
  }));
}

function buildFrames(mode, failedCount) {
  const frames = [];

  if (mode === 'cas') {
    const snap = (extra) => ({
      mode: 'cas',
      cell: CAS_INITIAL,
      acceptors: [],
      ballot: null,
      value: null,
      quorum: 0,
      chosen: null,
      casResult: null,
      ...extra,
    });

    frames.push(snap({
      phase: 'idle',
      note: `One node holds a single value cell = "${CAS_INITIAL}". A compare-and-swap names the value it expects to see and the value to write. No cluster, no rounds — one instruction.`,
    }));
    frames.push(snap({
      phase: 'compare',
      casResult: 'pending',
      note: `CAS(expected="${CAS_EXPECTED}", new="${CAS_NEW}"). The node atomically checks: does the cell still equal "${CAS_EXPECTED}"? Nobody else can interleave — the compare and the write are one indivisible step.`,
    }));
    frames.push(snap({
      phase: 'swap',
      cell: CAS_NEW,
      casResult: 'ok',
      chosen: CAS_NEW,
      note: `Cell was "${CAS_EXPECTED}" -> SWAP. Cell atomically becomes "${CAS_NEW}". Instant, no quorum, no messages. But this one node IS the system: if it dies, the value dies with it. No fault tolerance of the node itself.`,
    }));
    return frames;
  }

  // Paxos
  const alive = ACCEPTORS - failedCount;
  const reaches = alive >= QUORUM;

  const snap = (extra) => ({
    mode: 'paxos',
    cell: null,
    failedCount,
    alive,
    ballot: PAXOS_BALLOT,
    value: PAXOS_VALUE,
    quorum: 0,
    chosen: null,
    casResult: null,
    acceptors: paxosAcceptors(failedCount, 'idle'),
    ...extra,
  });

  frames.push(snap({
    phase: 'idle',
    note: `Proposer + ${ACCEPTORS} acceptors. ${failedCount > 0 ? `${failedCount} acceptor(s) are DOWN, ${alive} alive. ` : 'All acceptors alive. '}A value is CHOSEN only when a majority quorum of ${QUORUM} acceptors agree. Consensus replaces the single node with a fault-tolerant cluster.`,
  }));

  frames.push(snap({
    phase: 'prepare',
    note: `Phase 1a — PREPARE(n=${PAXOS_BALLOT}). The proposer broadcasts ballot number ${PAXOS_BALLOT} to every acceptor, asking them to promise not to accept anything older.`,
  }));

  frames.push(snap({
    phase: 'promise',
    acceptors: paxosAcceptors(failedCount, 'promised'),
    quorum: alive,
    note: reaches
      ? `Phase 1b — PROMISE. ${alive} alive acceptor(s) reply with a promise. ${alive} >= ${QUORUM}: the proposer has a quorum and may proceed. Down acceptors simply never answer — Paxos waits on the majority, not on everyone.`
      : `Phase 1b — PROMISE. Only ${alive} acceptor(s) can promise. ${alive} < ${QUORUM}: no majority. The proposer is stuck — it cannot safely choose a value. Too many failures broke the quorum.`,
  }));

  if (!reaches) {
    frames.push(snap({
      phase: 'blocked',
      acceptors: paxosAcceptors(failedCount, 'promised'),
      quorum: alive,
      note: `No quorum (${alive}/${ACCEPTORS}, need ${QUORUM}). With ${failedCount} acceptors down, fewer than a majority remain. Paxos correctly refuses to choose — it never trades safety for liveness. Restore an acceptor to make progress.`,
    }));
    return frames;
  }

  frames.push(snap({
    phase: 'accept',
    acceptors: paxosAcceptors(failedCount, 'promised'),
    quorum: alive,
    value: PAXOS_VALUE,
    note: `Phase 2a — ACCEPT(n=${PAXOS_BALLOT}, v="${PAXOS_VALUE}"). Holding a promise-quorum, the proposer asks the same acceptors to accept value "${PAXOS_VALUE}" under ballot ${PAXOS_BALLOT}.`,
  }));

  frames.push(snap({
    phase: 'accepted',
    acceptors: paxosAcceptors(failedCount, 'accepted'),
    quorum: alive,
    value: PAXOS_VALUE,
    note: `Phase 2b — ACCEPTED. ${alive} alive acceptor(s) accept "${PAXOS_VALUE}". ${alive} >= ${QUORUM}: a majority has accepted, even with ${failedCount} node(s) down. That majority is the proof.`,
  }));

  frames.push(snap({
    phase: 'chosen',
    acceptors: paxosAcceptors(failedCount, 'accepted'),
    quorum: alive,
    value: PAXOS_VALUE,
    chosen: PAXOS_VALUE,
    note: `CHOSEN = "${PAXOS_VALUE}". A majority accepted under one ballot, so the value is permanent — any future quorum overlaps this one and will see it. ${failedCount} failure(s) and the cluster still agreed: that overlap of majorities is the whole trick.`,
  }));

  return frames;
}

const MODES = [
  { key: 'cas', label: 'CAS (single node)' },
  { key: 'paxos', label: 'Paxos (5 acceptors)' },
];

const STATE_FILL = {
  idle: 'var(--surface)',
  promised: 'var(--hue-sky)',
  accepted: 'var(--easy)',
  down: 'var(--surface)',
};

export default function CasVsPaxosViz() {
  const [mode, setMode] = useState('paxos');
  const [failedCount, setFailedCount] = useState(0);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode, failedCount), [mode, failedCount]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1200 / speed);

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

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const setFailed = (n) => {
    const next = Math.max(0, Math.min(ACCEPTORS - 1, n));
    if (next === failedCount) return;
    setIsRunning(false);
    setStep(0);
    setFailedCount(next);
  };

  // SVG geometry
  const W = 940;
  const H = 430;
  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const alive = ACCEPTORS - failedCount;
  const quorumReached = mode === 'paxos' ? current.quorum >= QUORUM : true;

  // CAS scene
  const renderCas = () => {
    const cellX = W / 2;
    const cellY = 150;
    const cellW = 150;
    const cellH = 96;
    const swapped = current.phase === 'swap';
    const comparing = current.phase === 'compare';
    return (
      <g>
        <text className="cvp-row-label" x={W / 2} y={48} textAnchor="middle">one node — atomic compare-and-swap</text>

        {/* single node housing */}
        <rect className="cvp-node-box" x={W / 2 - 220} y={80} width={440} height={250} rx={14} />
        <Server x={W / 2 - 210} y={92} width={18} height={18} className="cvp-node-icon" />
        <text className="cvp-node-cap" x={W / 2 - 186} y={106}>single node</text>

        {/* value cell */}
        <rect
          className={`cvp-cell ${swapped ? 'is-swap' : ''} ${comparing ? 'is-compare' : ''}`}
          x={cellX - cellW / 2}
          y={cellY}
          width={cellW}
          height={cellH}
          rx={12}
        />
        <text className="cvp-cell-val" x={cellX} y={cellY + cellH / 2 + 14}>{current.cell}</text>
        <text className="cvp-cell-cap" x={cellX} y={cellY + cellH + 22} textAnchor="middle">value cell</text>

        {/* CAS expression */}
        <text
          className={`cvp-cas-expr ${current.casResult === 'ok' ? 'is-ok' : ''}`}
          x={cellX}
          y={cellY - 22}
          textAnchor="middle"
        >
          {`CAS(expected "${CAS_EXPECTED}", new "${CAS_NEW}")`}
        </text>

        <text className="cvp-cas-foot" x={W / 2} y={312} textAnchor="middle">
          no quorum · no messages · no fault tolerance of the node itself
        </text>
      </g>
    );
  };

  // Paxos scene
  const renderPaxos = () => {
    const propX = 150;
    const propY = H / 2;
    const ringCx = 600;
    const ringCy = H / 2 + 4;
    const acceptors = current.acceptors;
    const showMsg = ['prepare', 'promise', 'accept', 'accepted'].includes(current.phase);
    const msgKind = (current.phase === 'prepare' || current.phase === 'promise') ? 'p1' : 'p2';

    return (
      <g>
        <text className="cvp-row-label" x={W / 2} y={42} textAnchor="middle">
          proposer drives 5 acceptors to consensus — quorum = {QUORUM} of {ACCEPTORS}
        </text>

        {/* proposer */}
        <rect className="cvp-proposer" x={propX - 64} y={propY - 52} width={128} height={104} rx={12} />
        <Server x={propX - 12} y={propY - 40} width={24} height={24} className="cvp-node-icon" />
        <text className="cvp-proposer-label" x={propX} y={propY + 18}>proposer</text>
        <text className="cvp-proposer-sub" x={propX} y={propY + 36}>{`n=${current.ballot} · v="${current.value}"`}</text>

        {/* acceptors arranged in an arc on the right */}
        {acceptors.map((a, i) => {
          const ang = (-Math.PI / 2) + (i - (ACCEPTORS - 1) / 2) * 0.52;
          const ax = ringCx + Math.cos(ang) * 0 + (i - (ACCEPTORS - 1) / 2) * 118;
          const ay = ringCy + (Math.abs(i - (ACCEPTORS - 1) / 2) * 26) - 30;
          const down = a.state === 'down';
          const fill = STATE_FILL[a.state] || 'var(--surface)';
          return (
            <g key={`acc-${a.id}`}>
              {showMsg && !down && (
                <line
                  className={`cvp-msg is-${msgKind}`}
                  x1={propX + 64}
                  y1={propY}
                  x2={ax}
                  y2={ay}
                />
              )}
              <rect
                className={`cvp-acc ${down ? 'is-down' : ''} ${a.state === 'accepted' ? 'is-accepted' : ''}`}
                x={ax - 42}
                y={ay - 32}
                width={84}
                height={64}
                rx={10}
                style={{ fill: down ? 'var(--surface)' : fill, stroke: down ? 'var(--hard)' : (a.state === 'idle' ? 'var(--border)' : fill) }}
              />
              {down
                ? <PowerOff x={ax - 10} y={ay - 24} width={20} height={20} className="cvp-acc-down-icon" />
                : <Server x={ax - 10} y={ay - 24} width={20} height={20} className="cvp-acc-icon" />}
              <text className="cvp-acc-label" x={ax} y={ay + 10}>{`acc ${a.id + 1}`}</text>
              <text className={`cvp-acc-state ${down ? 'is-down' : ''}`} x={ax} y={ay + 24}>
                {down ? 'DOWN' : a.state === 'idle' ? '—' : a.state}
              </text>
            </g>
          );
        })}

        {/* quorum gauge */}
        <text className="cvp-row-label" x={ringCx} y={H - 56} textAnchor="middle">
          quorum
        </text>
        <g>
          {Array.from({ length: ACCEPTORS }, (_, i) => {
            const gx = ringCx - (ACCEPTORS - 1) * 17 + i * 34;
            const filled = i < current.quorum;
            const within = i < QUORUM;
            return (
              <rect
                key={`q-${i}`}
                className={`cvp-q-pip ${filled ? 'is-filled' : ''} ${within ? 'is-needed' : ''}`}
                x={gx - 12}
                y={H - 44}
                width={24}
                height={16}
                rx={4}
              />
            );
          })}
        </g>
        <text
          className={`cvp-q-readout ${quorumReached ? 'is-ok' : 'is-bad'}`}
          x={ringCx}
          y={H - 8}
          textAnchor="middle"
        >
          {`${current.quorum} / ${ACCEPTORS} acquired · need ${QUORUM} · ${quorumReached && current.quorum >= QUORUM ? 'QUORUM' : current.quorum > 0 ? (current.quorum >= QUORUM ? 'QUORUM' : 'NO QUORUM') : 'waiting'}`}
        </text>
      </g>
    );
  };

  return (
    <div className="cvp">
      <div className="cvp-head">
        <h3 className="cvp-title">CAS vs Paxos — atomic on one node vs agreement across a cluster</h3>
        <p className="cvp-sub">
          Compare-and-swap settles a value on a single node in one instruction. Paxos drives five acceptors
          through prepare/accept to a majority quorum — so a minority can fail and the value is still chosen.
        </p>
      </div>

      <div className="cvp-controls">
        <div className="cvp-modes" role="tablist" aria-label="Mechanism">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`cvp-mode ${mode === m.key ? 'is-on' : ''}`}
              onClick={() => switchMode(m.key)}
              aria-pressed={mode === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className={`cvp-fail ${mode !== 'paxos' ? 'is-disabled' : ''}`}>
          <span className="cvp-input-label">acceptors down</span>
          <button
            type="button"
            className="cvp-btn cvp-btn-step"
            onClick={() => setFailed(failedCount - 1)}
            disabled={mode !== 'paxos' || failedCount <= 0}
          >
            −
          </button>
          <span className="cvp-fail-val">{mode === 'paxos' ? failedCount : 0}</span>
          <button
            type="button"
            className="cvp-btn cvp-btn-step"
            onClick={() => setFailed(failedCount + 1)}
            disabled={mode !== 'paxos' || failedCount >= ACCEPTORS - 1}
          >
            +
          </button>
        </div>

        <label className="cvp-speed">
          <span className="cvp-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cvp-speed-range"
            aria-label="Playback speed"
          />
          <span className="cvp-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="cvp-spacer" aria-hidden="true" />

        <div className="cvp-buttons">
          <button
            type="button"
            className="cvp-btn cvp-btn-primary"
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
            className="cvp-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cvp-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cvp-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cvp-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cvp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cvp-svg" preserveAspectRatio="xMidYMid meet">
          {mode === 'cas' ? renderCas() : renderPaxos()}
        </svg>
      </div>

      <div className="cvp-metrics">
        <div className="cvp-metric">
          <span className="cvp-metric-label">mechanism</span>
          <span className="cvp-metric-value">{mode === 'cas' ? 'CAS' : 'Paxos'}</span>
        </div>
        <div className="cvp-metric">
          <span className="cvp-metric-label">phase</span>
          <span className="cvp-metric-value">{current.phase}</span>
        </div>
        <div className="cvp-metric">
          <span className="cvp-metric-label">quorum</span>
          <span className={`cvp-metric-value ${mode === 'paxos' && current.quorum >= QUORUM ? 'is-ok' : ''}`}>
            {mode === 'paxos' ? `${current.quorum} / ${ACCEPTORS}` : 'n/a'}
          </span>
        </div>
        <div className="cvp-metric">
          <span className="cvp-metric-label">alive nodes</span>
          <span className="cvp-metric-value">{mode === 'paxos' ? `${alive} / ${ACCEPTORS}` : '1 / 1'}</span>
        </div>
        <div className="cvp-metric cvp-metric-dim">
          <span className="cvp-metric-label">chosen value</span>
          <span className="cvp-metric-value cvp-metric-dimval">{current.chosen == null ? '—' : `"${current.chosen}"`}</span>
        </div>
      </div>

      <div className="cvp-narration">
        <span className="cvp-narration-label">trace</span>
        <span className="cvp-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
