import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Send, Mail, CheckCircle, XCircle, Crown, Server,
} from 'lucide-react';
import './PaxosMultiPaxosViz.css';

// Single-decree Paxos across one Proposer and a row of Acceptors, then the
// Multi-Paxos optimization where a stable leader skips the Prepare phase.
//
//   Phase 1a  Prepare(n)      proposer picks a ballot number n, asks acceptors to promise
//   Phase 1b  Promise(n, av)  acceptor promises not to accept ballots < n, reports any value
//                             it has already accepted (accepted = {an, av})
//   Phase 2a  Accept(n, v)    once a MAJORITY promised, proposer sends Accept with value v
//   Phase 2b  Accepted(n, v)  acceptors that still owe the promise accept; a majority decides
//
// A second proposer with a HIGHER ballot can preempt: acceptors that already
// promised the higher n reject the lower-n Accept, so the first proposer stalls.
// Multi-Paxos: once a leader is established it keeps the promise across many log
// slots, so steady state is just one round-trip of Accept/Accepted per slot.

const N = 5;
const MAJORITY = Math.floor(N / 2) + 1; // 3

// acceptor model: { id, promised, acceptedN, acceptedV, lit }
function acceptors() {
  return Array.from({ length: N }, (_, i) => ({
    id: i + 1, promised: null, acceptedN: null, acceptedV: null, lit: false,
  }));
}

function clone(st) {
  return {
    acc: st.acc.map((a) => ({ ...a })),
    msgs: st.msgs.map((m) => ({ ...m })),
    proposer: st.proposer,
    ballot: st.ballot,
    value: st.value,
    promises: [...st.promises],
    accepts: [...st.accepts],
    decided: st.decided,
    rival: st.rival ? { ...st.rival } : null,
  };
}

function snap(st, extra) {
  return { ...clone(st), active: -1, phase: 'prepare', note: '', ...extra };
}

function buildSingle() {
  const frames = [];
  const st = {
    acc: acceptors(), msgs: [], proposer: 'P1', ballot: 0, value: null,
    promises: [], accepts: [], decided: null, rival: null,
  };

  frames.push(snap(st, {
    phase: 'init',
    note: `One proposer wants the cluster to agree on a single value. Five acceptors will only ever decide ONE value, and a strict majority (${MAJORITY} of ${N}) is what makes a decision final. Watch the two-phase Prepare then Accept handshake.`,
  }));

  // Phase 1a — Prepare(n)
  st.ballot = 11;
  st.msgs = st.acc.map((a) => ({ from: 'P1', to: a.id, kind: 'prepare' }));
  frames.push(snap(st, {
    phase: 'prepare',
    active: -1,
    note: `Phase 1a. Proposer P1 picks ballot number n = ${st.ballot} and broadcasts Prepare(${st.ballot}) to every acceptor. It is asking each one for a promise: "don't accept anything numbered below ${st.ballot}".`,
  }));

  // Phase 1b — Promise from a majority
  [1, 2, 3].forEach((id, k) => {
    st.acc[id - 1].promised = 11;
    st.promises.push(id);
    st.msgs = [{ from: id, to: 'P1', kind: 'promise' }];
    frames.push(snap(st, {
      phase: 'promise',
      active: id,
      note: `Phase 1b. Acceptor A${id} has promised nothing higher, so it returns Promise(${st.ballot}) and reports it holds no accepted value yet — promises ${st.promises.length}/${N}.${k === 2 ? ` That is a majority (${MAJORITY}); P1 may now choose a value.` : ''}`,
    }));
  });

  // Phase 2a — Accept(n, v)
  st.value = 'X';
  st.msgs = st.acc.map((a) => ({ from: 'P1', to: a.id, kind: 'accept' }));
  frames.push(snap(st, {
    phase: 'accept',
    active: -1,
    note: `Phase 2a. No acceptor reported a previously accepted value, so P1 is free to pick its own: v = ${st.value}. It sends Accept(${st.ballot}, ${st.value}) to all acceptors.`,
  }));

  // Phase 2b — Accepted from a majority
  [1, 2, 3].forEach((id) => {
    st.acc[id - 1].acceptedN = 11;
    st.acc[id - 1].acceptedV = 'X';
    st.acc[id - 1].lit = true;
    st.accepts.push(id);
    st.msgs = [{ from: id, to: 'P1', kind: 'accepted' }];
    const reached = st.accepts.length >= MAJORITY;
    if (reached) st.decided = 'X';
    frames.push(snap(st, {
      phase: 'accepted',
      active: id,
      decided: reached ? 'X' : null,
      note: `Phase 2b. A${id} still owes its promise on ballot ${st.ballot}, so it accepts (${st.ballot}, ${st.value}) — accepts ${st.accepts.length}/${N}.${reached ? ` Majority reached: value ${st.value} is now DECIDED and can never change.` : ''}`,
    }));
  });

  frames.push(snap(st, {
    phase: 'decided',
    decided: 'X',
    note: `Chosen. A majority accepted (${st.ballot}, ${st.value}), so X is the cluster's single decided value. Any future proposer will discover X during its own Prepare phase and is forced to re-propose it — that is how Paxos guarantees one and only one value.`,
  }));

  return frames;
}

function buildPreempt() {
  const frames = [];
  const st = {
    acc: acceptors(), proposer: 'P1', ballot: 11, value: null,
    msgs: [], promises: [], accepts: [], decided: null,
    rival: { id: 'P2', ballot: 0 },
  };

  frames.push(snap(st, {
    phase: 'init',
    note: `Two proposers compete. P1 starts with ballot 11; a rival P2 will arrive with a HIGHER ballot. Higher numbers win promises, so P2 can preempt P1 mid-flight. Step through to see P1 stall and P2 take over.`,
  }));

  // P1 prepares and gets a majority of promises.
  st.msgs = st.acc.map((a) => ({ from: 'P1', to: a.id, kind: 'prepare' }));
  frames.push(snap(st, {
    phase: 'prepare',
    note: `P1 broadcasts Prepare(11). It needs ${MAJORITY} promises before it can send any Accept.`,
  }));

  [1, 2, 3].forEach((id) => {
    st.acc[id - 1].promised = 11;
    st.promises.push(id);
    st.msgs = [{ from: id, to: 'P1', kind: 'promise' }];
    frames.push(snap(st, {
      phase: 'promise',
      active: id,
      note: `A${id} promises ballot 11 — promises ${st.promises.length}/${N}. P1 has its majority and is about to send Accept.`,
    }));
  });

  // P2 arrives with a higher ballot and prepares.
  st.rival = { id: 'P2', ballot: 22 };
  st.msgs = st.acc.map((a) => ({ from: 'P2', to: a.id, kind: 'prepare-rival' }));
  frames.push(snap(st, {
    phase: 'preempt',
    note: `Before P1's Accept lands, rival P2 broadcasts Prepare(22). Because 22 > 11, acceptors are willing to make P2 a stronger promise and abandon their promise to P1.`,
  }));

  // Acceptors re-promise to the higher ballot.
  [2, 3, 4].forEach((id) => {
    st.acc[id - 1].promised = 22;
    st.msgs = [{ from: id, to: 'P2', kind: 'promise-rival' }];
    frames.push(snap(st, {
      phase: 'preempt',
      active: id,
      note: `A${id} now promises ballot 22 to P2. It will reject anything numbered below 22 from here on — including P1's older Accept(11, ...).`,
    }));
  });

  // P1's Accept(11) is rejected by the re-promised acceptors.
  st.value = 'X';
  st.msgs = [
    { from: 'P1', to: 2, kind: 'reject' },
    { from: 'P1', to: 3, kind: 'reject' },
    { from: 'P1', to: 4, kind: 'reject' },
  ];
  frames.push(snap(st, {
    phase: 'stall',
    note: `P1 finally sends Accept(11, X), but A2, A3, A4 already promised 22 > 11, so they reject it. P1 cannot reach a majority of accepts — it is preempted and must restart with a ballot above 22.`,
  }));

  // P2 sends Accept and wins.
  st.rival = { id: 'P2', ballot: 22 };
  st.value = 'Y';
  st.msgs = st.acc.map((a) => ({ from: 'P2', to: a.id, kind: 'accept' }));
  frames.push(snap(st, {
    phase: 'accept',
    note: `P2 has a majority of promises on ballot 22 and saw no previously accepted value, so it picks v = Y and sends Accept(22, Y).`,
  }));

  [2, 3, 4].forEach((id) => {
    st.acc[id - 1].acceptedN = 22;
    st.acc[id - 1].acceptedV = 'Y';
    st.acc[id - 1].lit = true;
    st.accepts.push(id);
    st.msgs = [{ from: id, to: 'P2', kind: 'accepted' }];
    const reached = st.accepts.length >= MAJORITY;
    if (reached) st.decided = 'Y';
    frames.push(snap(st, {
      phase: 'accepted',
      active: id,
      decided: reached ? 'Y' : null,
      note: `A${id} accepts (22, Y) — accepts ${st.accepts.length}/${N}.${reached ? ' Majority reached: Y is DECIDED. P1 lost the race purely on ballot number.' : ''}`,
    }));
  });

  frames.push(snap(st, {
    phase: 'decided',
    decided: 'Y',
    note: `Resolved. A higher ballot always wins the right to choose, so duelling proposers cannot both decide — only one value is ever chosen (Y). Endless duels are why production systems elect a single leader, which is exactly what Multi-Paxos does next.`,
  }));

  return frames;
}

function buildMulti() {
  const frames = [];
  const st = {
    acc: acceptors(), proposer: 'Leader', ballot: 30, value: null,
    msgs: [], promises: [], accepts: [], decided: null, rival: null,
  };

  frames.push(snap(st, {
    phase: 'init',
    note: `Multi-Paxos. Running full two-phase Paxos for every log slot is wasteful. Instead one proposer is elected stable leader for ballot 30 — it runs Prepare ONCE, then commits a whole log of slots with Accept-only round trips.`,
  }));

  // One-time leader election (Prepare once).
  st.msgs = st.acc.map((a) => ({ from: 'Leader', to: a.id, kind: 'prepare' }));
  frames.push(snap(st, {
    phase: 'prepare',
    note: `One-time setup. The leader runs Prepare(30) across the cluster — the only time Phase 1 happens. The promise it earns covers EVERY future slot, not just one value.`,
  }));

  [1, 2, 3, 4, 5].forEach((id) => {
    st.acc[id - 1].promised = 30;
    st.promises.push(id);
  });
  st.msgs = [1, 2, 3, 4, 5].map((id) => ({ from: id, to: 'Leader', kind: 'promise' }));
  frames.push(snap(st, {
    phase: 'promise',
    note: `All five promise ballot 30 for all slots. The leader is now established — it can skip Prepare entirely and go straight to Accept for as many slots as it likes.`,
  }));

  // Stream of Accept-only slots.
  const slots = [
    { slot: 1, v: 'set x=1' },
    { slot: 2, v: 'set y=7' },
    { slot: 3, v: 'del z' },
  ];
  slots.forEach((s) => {
    st.value = s.v;
    st.accepts = [];
    st.acc.forEach((a) => { a.lit = false; });
    st.msgs = st.acc.map((a) => ({ from: 'Leader', to: a.id, kind: 'accept' }));
    frames.push(snap(st, {
      phase: 'accept',
      note: `Slot ${s.slot}. No Prepare needed — the leader sends Accept(30, "${s.v}") directly. Steady state is a single round trip per command.`,
    }));

    [1, 2, 3].forEach((id) => {
      st.acc[id - 1].acceptedN = 30;
      st.acc[id - 1].acceptedV = s.v;
      st.acc[id - 1].lit = true;
      st.accepts.push(id);
      const reached = st.accepts.length >= MAJORITY;
      st.msgs = [{ from: id, to: 'Leader', kind: 'accepted' }];
      if (reached) st.decided = `slot ${s.slot}: ${s.v}`;
      frames.push(snap(st, {
        phase: 'accepted',
        active: id,
        decided: reached ? `slot ${s.slot}: ${s.v}` : null,
        note: `A${id} accepts slot ${s.slot} — accepts ${st.accepts.length}/${N}.${reached ? ` Majority: "${s.v}" committed to the log at slot ${s.slot}.` : ''}`,
      }));
    });
  });

  frames.push(snap(st, {
    phase: 'decided',
    decided: 'log committed: 3 slots',
    note: `Stable. One Prepare bought the leadership; from then on each command is one Accept/Accepted round trip. That is the throughput win of Multi-Paxos over re-running single-decree Paxos per slot — and if the leader fails, a successor simply runs Prepare once on a higher ballot and takes over.`,
  }));

  return frames;
}

const SCENARIOS = {
  'Single-decree Paxos': 'single',
  'Rival preempts (higher ballot)': 'preempt',
  'Multi-Paxos leader': 'multi',
};
const SCEN_KEYS = Object.keys(SCENARIOS);

const PHASE_LABEL = {
  init: 'setup',
  prepare: 'prepare 1a',
  promise: 'promise 1b',
  accept: 'accept 2a',
  accepted: 'accepted 2b',
  preempt: 'preempted',
  stall: 'stalled',
  decided: 'decided',
};

const RUN_DELAY_MS = 1300;

export default function PaxosMultiPaxosViz() {
  const [scenario, setScenario] = useState(SCEN_KEYS[0]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const mode = SCENARIOS[scenario];
  const frames = useMemo(() => {
    if (mode === 'preempt') return buildPreempt();
    if (mode === 'multi') return buildMulti();
    return buildSingle();
  }, [mode]);

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

  // SVG geometry — proposer(s) on the left, acceptors in a vertical column.
  const W = 940;
  const H = 470;
  const propX = 150;
  const propY = current.rival ? 175 : 235;
  const rivalY = 320;
  const accX = 700;
  const accTop = 70;
  const accGap = 78;
  const accR = 30;
  const accPos = (id) => ({ x: accX, y: accTop + (id - 1) * accGap });

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const msgFromX = (from) => {
    if (from === 'P2') return propX;
    if (typeof from === 'number') return accPos(from).x;
    return propX;
  };
  const msgFromY = (from) => {
    if (from === 'P2') return rivalY;
    if (typeof from === 'number') return accPos(from).y;
    return propY;
  };
  const msgToX = (to) => (typeof to === 'number' ? accPos(to).x : propX);
  const msgToY = (to) => {
    if (typeof to === 'number') return accPos(to).y;
    if (to === 'P2') return rivalY;
    return propY;
  };

  const edgeTone = (kind) => {
    if (kind === 'prepare' || kind === 'prepare-rival') return 'prepare';
    if (kind === 'promise' || kind === 'promise-rival') return 'promise';
    if (kind === 'accept') return 'accept';
    if (kind === 'accepted') return 'accepted';
    return 'reject';
  };

  const decided = current.decided;
  const promiseCount = current.promises.length;
  const acceptCount = current.accepts.length;

  return (
    <div className="pxv">
      <div className="pxv-head">
        <h3 className="pxv-title">Paxos and Multi-Paxos — agreeing on one value, then a whole log</h3>
        <p className="pxv-sub">
          A proposer asks acceptors to Promise on a ballot, then to Accept a value; a strict majority
          (3 of 5) decides. A higher ballot preempts a lower one. Multi-Paxos elects a leader that runs
          Prepare once and commits a log of slots with Accept-only round trips.
        </p>
      </div>

      <div className="pxv-controls">
        <div className="pxv-modes" role="tablist" aria-label="Scenario">
          {SCEN_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              className={`pxv-mode ${scenario === s ? 'is-on' : ''}`}
              onClick={() => switchScenario(s)}
              aria-pressed={scenario === s}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="pxv-speed">
          <span className="pxv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pxv-speed-range"
            aria-label="Playback speed"
          />
          <span className="pxv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="pxv-spacer" aria-hidden="true" />

        <div className="pxv-buttons">
          <button
            type="button"
            className="pxv-btn pxv-btn-primary"
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
            className="pxv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="pxv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="pxv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="pxv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="pxv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pxv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            {['prepare', 'promise', 'accept', 'accepted', 'reject'].map((t) => (
              <marker key={t} id={`pxv-arr-${t}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className={`pxv-ah is-${t}`} />
              </marker>
            ))}
          </defs>

          {/* edges */}
          {current.msgs.map((m, i) => {
            const ax = msgFromX(m.from);
            const ay = msgFromY(m.from);
            const bx = msgToX(m.to);
            const by = msgToY(m.to);
            const dx = bx - ax;
            const dy = by - ay;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const sx = ax + ux * 44;
            const sy = ay + uy * 44;
            const ex = bx - ux * (accR + 8);
            const ey = by - uy * (accR + 8);
            const tone = edgeTone(m.kind);
            return (
              <line
                key={`m-${i}-${m.from}-${m.to}`}
                className={`pxv-edge is-${tone}`}
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                markerEnd={`url(#pxv-arr-${tone})`}
              />
            );
          })}

          {/* proposer */}
          <g>
            <rect className={`pxv-prop ${decided ? 'is-done' : ''}`} x={propX - 56} y={propY - 34} width={112} height={68} rx={10} />
            <g transform={`translate(${propX - 10}, ${propY - 26})`}>
              {decided ? <Crown width={20} height={20} className="pxv-prop-ic is-done" /> : <Send width={20} height={20} className="pxv-prop-ic" />}
            </g>
            <text className="pxv-prop-label" x={propX} y={propY + 8} textAnchor="middle">{current.proposer}</text>
            <text className="pxv-prop-sub" x={propX} y={propY + 24} textAnchor="middle">{`ballot n=${current.ballot}`}</text>
          </g>

          {/* rival proposer */}
          {current.rival && (
            <g>
              <rect className={`pxv-prop is-rival ${current.phase === 'preempt' || current.phase === 'stall' ? 'is-on' : ''}`} x={propX - 56} y={rivalY - 34} width={112} height={68} rx={10} />
              <g transform={`translate(${propX - 10}, ${rivalY - 26})`}>
                <Send width={20} height={20} className="pxv-prop-ic is-rival" />
              </g>
              <text className="pxv-prop-label is-rival" x={propX} y={rivalY + 8} textAnchor="middle">{current.rival.id}</text>
              <text className="pxv-prop-sub is-rival" x={propX} y={rivalY + 24} textAnchor="middle">{`ballot n=${current.rival.ballot}`}</text>
            </g>
          )}

          {/* majority bracket on the acceptor column */}
          <g>
            <line className="pxv-maj-line" x1={accX + 64} y1={accTop - 14} x2={accX + 64} y2={accTop + (N - 1) * accGap + 14} />
            <text className="pxv-maj-label" x={accX + 72} y={accTop + (N - 1) * accGap / 2} textAnchor="start">{`majority ${MAJORITY}/${N}`}</text>
          </g>

          {/* acceptors */}
          {current.acc.map((a) => {
            const p = accPos(a.id);
            const active = current.active === a.id;
            const hasAccepted = a.acceptedV != null;
            return (
              <g key={`acc-${a.id}`}>
                <circle
                  className={`pxv-acc ${active ? 'is-active' : ''} ${hasAccepted ? 'is-lit' : ''}`}
                  cx={p.x}
                  cy={p.y}
                  r={accR}
                />
                <g transform={`translate(${p.x - 9}, ${p.y - 18})`}>
                  {hasAccepted
                    ? <CheckCircle width={17} height={17} className="pxv-acc-ic is-lit" />
                    : <Server width={16} height={16} className="pxv-acc-ic" />}
                </g>
                <text className="pxv-acc-id" x={p.x} y={p.y + 6} textAnchor="middle">{`A${a.id}`}</text>
                <text className="pxv-acc-state" x={p.x - accR - 10} y={p.y - 4} textAnchor="end">
                  {a.promised != null ? `promised ${a.promised}` : 'no promise'}
                </text>
                <text className="pxv-acc-val" x={p.x - accR - 10} y={p.y + 11} textAnchor="end">
                  {hasAccepted ? `accepted (${a.acceptedN}, ${a.acceptedV})` : '—'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pxv-metrics">
        <div className="pxv-metric">
          <span className="pxv-metric-label">phase</span>
          <span className={`pxv-metric-value ${decided ? 'is-ok' : current.phase === 'preempt' || current.phase === 'stall' ? 'is-bad' : ''}`}>
            {PHASE_LABEL[current.phase] || current.phase}
          </span>
        </div>
        <div className="pxv-metric">
          <span className="pxv-metric-label">promises</span>
          <span className={`pxv-metric-value ${promiseCount >= MAJORITY ? 'is-ok' : ''}`}>{`${promiseCount} / ${N}`}</span>
        </div>
        <div className="pxv-metric">
          <span className="pxv-metric-label">accepts</span>
          <span className={`pxv-metric-value ${acceptCount >= MAJORITY ? 'is-ok' : ''}`}>{`${acceptCount} / ${N}, maj = ${MAJORITY}`}</span>
        </div>
        <div className="pxv-metric pxv-metric-dim">
          <span className="pxv-metric-label">decided value</span>
          <span className={`pxv-metric-value ${decided ? 'is-ok' : 'is-warn'}`}>{decided || 'none yet'}</span>
        </div>
      </div>

      <div className={`pxv-narration ${decided ? 'is-ok' : current.phase === 'preempt' || current.phase === 'stall' ? 'is-bad' : ''}`}>
        <span className={`pxv-narration-label ${decided ? 'is-ok' : current.phase === 'preempt' || current.phase === 'stall' ? 'is-bad' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="pxv-narration-body">{current.note}</span>
      </div>

      <div className="pxv-legend">
        <span className="pxv-legend-item"><Mail size={13} className="pxv-ic is-prepare" /> Prepare(n) — request a promise</span>
        <span className="pxv-legend-item"><CheckCircle size={13} className="pxv-ic is-promise" /> Promise(n) — won&rsquo;t accept below n</span>
        <span className="pxv-legend-item"><Send size={13} className="pxv-ic is-accept" /> Accept(n, v) — propose a value</span>
        <span className="pxv-legend-item"><XCircle size={13} className="pxv-ic is-reject" /> reject — promised a higher ballot</span>
      </div>
    </div>
  );
}
