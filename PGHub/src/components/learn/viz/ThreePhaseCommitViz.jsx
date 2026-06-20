import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, Skull,
  Server, Database, HelpCircle, CheckCircle, Lock, Clock, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import './ThreePhaseCommitViz.css';

// Distributed atomic commit across one COORDINATOR and N PARTICIPANTS.
//
// Two-phase commit (2PC):
//   vote     — coordinator asks canCommit?, each participant votes yes/no and
//              takes locks; a yes-voter is now UNCERTAIN — it has promised to
//              commit but does not yet know the global decision.
//   commit   — coordinator records the decision and tells everyone doCommit.
// The fatal gap: if the coordinator crashes after participants voted yes but
// before broadcasting doCommit, every yes-voter is stuck holding locks with no
// way to learn the outcome. 2PC BLOCKS.
//
// Three-phase commit (3PC) inserts a preCommit phase:
//   vote      — canCommit?, participants vote yes/no.
//   preCommit — coordinator tells everyone "prepare to commit"; participants
//               ack and enter a PRECOMMITTED state. Reaching this state proves
//               EVERYONE voted yes, so committing is now safe.
//   commit    — coordinator says doCommit.
// If the coordinator dies after participants are precommitted, a timeout lets
// the survivors agree to commit on their own — the protocol TERMINATES. 3PC is
// non-blocking under a single coordinator failure.
//
// Toggle 2PC vs 3PC, and choose where to kill the coordinator.

const N = 4;

// crashPoint: 'none' | 'after-vote' | 'after-precommit'
function freshParts() {
  return Array.from({ length: N }, (_, i) => ({ id: i + 1, state: 'uncertain' }));
}

function snapMaker(getState) {
  return (extra) => {
    const s = getState();
    return {
      coord: s.coord,
      parts: s.parts.map((p) => ({ ...p })),
      edges: s.edges.map((e) => ({ ...e })),
      phase: 'idle',
      active: 0,
      blocked: false,
      terminated: false,
      outcome: 'pending',
      note: '',
      ...extra,
    };
  };
}

function buildFrames(protocol, crashPoint) {
  const frames = [];
  const state = {
    coord: 'alive',
    parts: freshParts(),
    edges: [],
  };
  const snap = snapMaker(() => state);
  const is3 = protocol === '3pc';

  const allIds = state.parts.map((p) => p.id);

  frames.push(snap({
    phase: 'init',
    note: `One coordinator drives ${N} participants toward an all-or-nothing decision. Every participant starts UNCERTAIN — it has not voted and does not know the outcome. ${is3
      ? 'Three-phase commit (3PC) adds a preCommit step so a coordinator crash cannot leave everyone blocked.'
      : 'Two-phase commit (2PC) goes straight from votes to the commit decision — simple, but vulnerable if the coordinator dies mid-flight.'}`,
  }));

  // PHASE 1 — canCommit? request
  state.edges = allIds.map((id) => ({ from: 0, to: id, kind: 'ask' }));
  frames.push(snap({
    phase: 'vote-ask',
    active: 0,
    note: `Phase 1 — canCommit?. The coordinator asks every participant whether it can commit. Each will check its constraints, take the locks it needs, and reply with a yes/no vote.`,
  }));

  // votes come back yes one at a time
  state.edges = [];
  allIds.forEach((id) => {
    state.parts[id - 1].state = 'yes-voted';
    const voted = state.parts.filter((p) => p.state !== 'uncertain').length;
    frames.push(snap({
      phase: 'vote-reply',
      active: id,
      edges: [{ from: id, to: 0, kind: 'yes' }],
      note: `Participant P${id} takes its locks and votes YES — it is now ${voted}/${N} committed-to-vote. A yes-voter is in a fragile spot: it has promised to commit and is holding locks, but it still does not know the global decision. Call this state "uncertain-but-willing".`,
    }));
  });

  // all voted yes
  frames.push(snap({
    phase: 'voted',
    note: `All ${N} participants voted YES and are holding locks. In a healthy run the coordinator now decides COMMIT. ${is3
      ? 'But 3PC will NOT commit yet — it first drives everyone into a precommit state so the decision survives a coordinator crash.'
      : 'In 2PC the coordinator is about to broadcast doCommit. The next instant is exactly where a crash is catastrophic.'}`,
  }));

  if (!is3) {
    // 2PC path
    if (crashPoint === 'after-vote') {
      state.coord = 'dead';
      frames.push(snap({
        phase: 'crash',
        coord: 'dead',
        active: 0,
        note: `CRASH. The coordinator dies right after collecting yes-votes but BEFORE it broadcast doCommit. It never told anyone the decision — and in 2PC it is the only node that knows one was being made.`,
      }));

      // participants time out, but cannot decide
      state.parts.forEach((p) => { p.state = 'blocked'; });
      frames.push(snap({
        phase: 'blocked',
        coord: 'dead',
        blocked: true,
        outcome: 'unknown',
        edges: allIds.map((id) => ({ from: id, to: 0, kind: 'timeout' })),
        note: `Each participant's timeout fires, but it cannot make progress. It voted YES, so it may NOT unilaterally abort (the coordinator might have decided commit); and it has not heard doCommit, so it may NOT unilaterally commit either. Every yes-voter is BLOCKED — frozen, still holding locks, waiting for a coordinator that is never coming back. This is the 2PC blocking problem.`,
      }));

      frames.push(snap({
        phase: 'stuck',
        coord: 'dead',
        blocked: true,
        outcome: 'unknown',
        note: `Stuck. The only safe move is to wait for the coordinator to recover and read its log. Until then locks stay held and dependent transactions queue behind them. 2PC is a BLOCKING protocol: a single coordinator failure at the wrong instant halts the whole cohort.`,
      }));
      return frames;
    }

    // 2PC clean commit
    state.edges = allIds.map((id) => ({ from: 0, to: id, kind: 'commit' }));
    frames.push(snap({
      phase: 'commit-send',
      active: 0,
      note: `Phase 2 — doCommit. The coordinator records COMMIT in its log, then broadcasts doCommit to every participant.`,
    }));

    state.parts.forEach((p) => { p.state = 'committed'; });
    state.edges = [];
    frames.push(snap({
      phase: 'committed',
      outcome: 'committed',
      terminated: true,
      note: `Every participant applies the commit, releases its locks, and acknowledges. The transaction is durably committed everywhere. 2PC works perfectly — as long as the coordinator survives the gap between collecting votes and announcing the decision.`,
    }));
    return frames;
  }

  // 3PC path
  // PHASE 2 — preCommit
  state.edges = allIds.map((id) => ({ from: 0, to: id, kind: 'pre' }));
  frames.push(snap({
    phase: 'pre-send',
    active: 0,
    note: `Phase 2 — preCommit. Because all votes were YES, the coordinator tells everyone "prepare to commit". This does not commit anything yet; it propagates the fact that the decision WILL be commit, so the knowledge no longer lives only in the coordinator.`,
  }));

  state.edges = [];
  allIds.forEach((id) => {
    state.parts[id - 1].state = 'precommitted';
    const pre = state.parts.filter((p) => p.state === 'precommitted').length;
    frames.push(snap({
      phase: 'pre-ack',
      active: id,
      edges: [{ from: id, to: 0, kind: 'ack' }],
      note: `Participant P${id} enters the PRECOMMITTED state and acknowledges — ${pre}/${N} precommitted. Now P${id} knows two things: everyone voted yes, and the intended decision is commit. A precommitted participant will commit on its own if it has to.`,
    }));
  });

  frames.push(snap({
    phase: 'precommitted',
    note: `All ${N} participants are precommitted. This is the key invariant 3PC buys: if ANY participant reached precommit, then EVERY participant voted yes, so commit is the only possible outcome. The decision is now safe to recover without the coordinator.`,
  }));

  if (crashPoint === 'after-precommit') {
    state.coord = 'dead';
    frames.push(snap({
      phase: 'crash',
      coord: 'dead',
      active: 0,
      note: `CRASH. The coordinator dies after everyone is precommitted but before it sent doCommit. In 2PC this exact timing would block forever — but the participants are no longer in the dark.`,
    }));

    // timeout -> elect/agree to commit
    frames.push(snap({
      phase: 'recover',
      coord: 'dead',
      edges: allIds.map((id) => ({ from: id, to: 0, kind: 'timeout' })),
      note: `Each participant's timeout fires. A surviving participant (or an elected backup coordinator) checks state: it is precommitted, which guarantees every peer voted yes. The timeout rule for a precommitted participant is simple — COMMIT. No coordinator required.`,
    }));

    state.parts.forEach((p) => { p.state = 'committed'; });
    state.edges = [];
    frames.push(snap({
      phase: 'terminated',
      coord: 'dead',
      outcome: 'committed',
      terminated: true,
      note: `Every survivor commits on its own and releases its locks. The protocol TERMINATES with a consistent outcome despite the dead coordinator. This is why 3PC is called NON-BLOCKING under a single coordinator failure: the extra preCommit phase moved the decision out of the coordinator before the crash could trap it.`,
    }));
    return frames;
  }

  // crash after-vote in 3PC (before precommit) -> still safe to abort
  if (crashPoint === 'after-vote') {
    // re-run: crash happens conceptually before precommit; rewind precommit states
    state.parts.forEach((p) => { p.state = 'yes-voted'; });
    state.coord = 'dead';
    frames.push(snap({
      phase: 'crash',
      coord: 'dead',
      active: 0,
      note: `CRASH (early). Imagine the coordinator instead died right after votes, before any preCommit was sent. No participant is precommitted yet, so none of them can know whether a peer's preCommit was already in flight.`,
    }));

    state.parts.forEach((p) => { p.state = 'committed'; });
    // actually safe path here is abort; reflect that
    state.parts.forEach((p) => { p.state = 'uncertain'; });
    frames.push(snap({
      phase: 'terminated',
      coord: 'dead',
      outcome: 'aborted',
      terminated: true,
      edges: allIds.map((id) => ({ from: id, to: 0, kind: 'timeout' })),
      note: `On timeout, a participant that is NOT precommitted knows no one could have committed yet, so the safe terminating decision is ABORT. Locks are released and the protocol still TERMINATES — no blocking. (3PC only commits on timeout once participants are precommitted.)`,
    }));
    return frames;
  }

  // 3PC clean commit
  state.edges = allIds.map((id) => ({ from: 0, to: id, kind: 'commit' }));
  frames.push(snap({
    phase: 'commit-send',
    active: 0,
    note: `Phase 3 — doCommit. With everyone precommitted, the coordinator broadcasts the final doCommit.`,
  }));

  state.parts.forEach((p) => { p.state = 'committed'; });
  state.edges = [];
  frames.push(snap({
    phase: 'committed',
    outcome: 'committed',
    terminated: true,
    note: `Every participant commits and releases its locks. The transaction is durably committed everywhere. 3PC paid for one extra round trip and gained a guarantee 2PC cannot offer: a single coordinator crash never leaves the cohort blocked.`,
  }));
  return frames;
}

const PROTO = {
  '2PC (blocks on crash)': '2pc',
  '3PC (non-blocking)': '3pc',
};
const PROTO_KEYS = Object.keys(PROTO);

const CRASH_LABEL = {
  none: 'no crash — clean run',
  'after-vote': 'kill after votes',
  'after-precommit': 'kill after precommit',
};
const CRASH_KEYS = Object.keys(CRASH_LABEL);

const STATE_LABEL = {
  uncertain: 'uncertain',
  'yes-voted': 'yes-voted',
  precommitted: 'precommitted',
  committed: 'committed',
  blocked: 'blocked',
};

const PHASE_LABEL = {
  init: 'setup',
  'vote-ask': 'canCommit?',
  'vote-reply': 'voting',
  voted: 'all voted yes',
  'pre-send': 'preCommit',
  'pre-ack': 'precommit ack',
  precommitted: 'all precommitted',
  'commit-send': 'doCommit',
  committed: 'committed',
  crash: 'coordinator crash',
  blocked: 'blocked',
  stuck: 'blocked',
  recover: 'timeout recovery',
  terminated: 'terminated',
};

const RUN_DELAY_MS = 1500;

export default function ThreePhaseCommitViz() {
  const [protoKey, setProtoKey] = useState(PROTO_KEYS[0]);
  const [crashPoint, setCrashPoint] = useState('after-vote');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const protocol = PROTO[protoKey];
  const frames = useMemo(() => buildFrames(protocol, crashPoint), [protocol, crashPoint]);

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

  const switchProto = (k) => {
    if (k === protoKey) return;
    setIsRunning(false);
    setStep(0);
    setProtoKey(k);
  };

  const switchCrash = (k) => {
    if (k === crashPoint) return;
    setIsRunning(false);
    setStep(0);
    setCrashPoint(k);
  };

  // SVG geometry — coordinator on top, participants in a row below.
  const W = 940;
  const H = 440;
  const coordX = W / 2;
  const coordY = 78;
  const coordW = 220;
  const coordH = 70;
  const partY = 330;
  const partR = 44;
  const rowL = 130;
  const rowR = W - 130;
  const partX = (id) => rowL + ((id - 1) / (N - 1)) * (rowR - rowL);

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const coordAlive = current.coord === 'alive';
  const blocked = current.blocked;
  const terminated = current.terminated;
  const outcome = current.outcome;

  const partTone = (st) => {
    if (st === 'committed') return 'ok';
    if (st === 'precommitted') return 'pre';
    if (st === 'yes-voted') return 'warn';
    if (st === 'blocked') return 'bad';
    return 'neutral';
  };

  const edgeTone = (kind) => {
    if (kind === 'yes' || kind === 'ack') return 'grant';
    if (kind === 'commit') return 'commit';
    if (kind === 'pre') return 'pre';
    if (kind === 'timeout') return 'timeout';
    return 'ask';
  };

  const PartIcon = (st) => {
    if (st === 'committed') return <CheckCircle width={18} height={18} className="tpc-node-ic is-ok" />;
    if (st === 'precommitted') return <ShieldCheck width={18} height={18} className="tpc-node-ic is-pre" />;
    if (st === 'yes-voted') return <Lock width={16} height={16} className="tpc-node-ic is-warn" />;
    if (st === 'blocked') return <Lock width={16} height={16} className="tpc-node-ic is-bad" />;
    return <HelpCircle width={18} height={18} className="tpc-node-ic is-dim" />;
  };

  const outcomeTone = outcome === 'committed' ? 'is-ok'
    : outcome === 'aborted' ? 'is-warn'
      : outcome === 'unknown' ? 'is-bad' : '';

  return (
    <div className="tpc">
      <div className="tpc-head">
        <h3 className="tpc-title">Two-phase vs three-phase commit — why the extra round trip stops blocking</h3>
        <p className="tpc-sub">
          A coordinator drives four participants to an all-or-nothing decision. Kill the coordinator after
          the votes and watch 2PC freeze every yes-voter; switch to 3PC and the precommit phase lets the
          survivors finish on their own.
        </p>
      </div>

      <div className="tpc-controls">
        <div className="tpc-modes" role="tablist" aria-label="Protocol">
          {PROTO_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`tpc-mode ${protoKey === k ? 'is-on' : ''}`}
              onClick={() => switchProto(k)}
              aria-pressed={protoKey === k}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="tpc-kills" role="group" aria-label="Crash point">
          {CRASH_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`tpc-kill ${crashPoint === k ? 'is-on' : ''} ${k !== 'none' ? 'is-danger' : ''}`}
              onClick={() => switchCrash(k)}
              aria-pressed={crashPoint === k}
            >
              {k === 'none' ? <Clock size={13} /> : <Skull size={13} />} {CRASH_LABEL[k]}
            </button>
          ))}
        </div>

        <label className="tpc-speed">
          <span className="tpc-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="tpc-speed-range"
            aria-label="Playback speed"
          />
          <span className="tpc-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="tpc-spacer" aria-hidden="true" />

        <div className="tpc-buttons">
          <button
            type="button"
            className="tpc-btn tpc-btn-primary"
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
            className="tpc-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="tpc-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="tpc-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="tpc-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="tpc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tpc-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tpc-arr-ask" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpc-ah is-ask" />
            </marker>
            <marker id="tpc-arr-grant" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpc-ah is-grant" />
            </marker>
            <marker id="tpc-arr-pre" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpc-ah is-pre" />
            </marker>
            <marker id="tpc-arr-commit" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpc-ah is-commit" />
            </marker>
            <marker id="tpc-arr-timeout" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpc-ah is-timeout" />
            </marker>
          </defs>

          {/* edges between coordinator and participants */}
          {current.edges.map((e, i) => {
            const fromCoord = e.from === 0;
            const a = fromCoord ? { x: coordX, y: coordY + coordH / 2 } : { x: partX(e.from), y: partY - partR };
            const b = e.to === 0 ? { x: coordX, y: coordY + coordH / 2 } : { x: partX(e.to), y: partY - partR };
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const pad = 8;
            const sx = a.x + ux * pad;
            const sy = a.y + uy * pad;
            const ex = b.x - ux * pad;
            const ey = b.y - uy * pad;
            const tone = edgeTone(e.kind);
            return (
              <line
                key={`edge-${i}-${e.from}-${e.to}`}
                className={`tpc-edge is-${tone}`}
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                markerEnd={`url(#tpc-arr-${tone})`}
              />
            );
          })}

          {/* coordinator */}
          <g>
            <rect
              className={`tpc-coord ${coordAlive ? '' : 'is-dead'} ${current.active === 0 && coordAlive ? 'is-active' : ''}`}
              x={coordX - coordW / 2}
              y={coordY}
              width={coordW}
              height={coordH}
              rx={12}
            />
            <g transform={`translate(${coordX - coordW / 2 + 16}, ${coordY + 16})`}>
              {coordAlive
                ? <Server width={22} height={22} className="tpc-coord-ic" />
                : <Skull width={22} height={22} className="tpc-coord-ic is-dead" />}
            </g>
            <text className="tpc-coord-label" x={coordX - coordW / 2 + 46} y={coordY + 28} textAnchor="start">coordinator</text>
            <text className={`tpc-coord-state ${coordAlive ? '' : 'is-dead'}`} x={coordX - coordW / 2 + 46} y={coordY + 48} textAnchor="start">
              {coordAlive ? 'alive — driving the decision' : 'crashed — no decision sent'}
            </text>
          </g>

          {/* participants */}
          {current.parts.map((p) => {
            const x = partX(p.id);
            const tone = partTone(p.state);
            const active = current.active === p.id;
            return (
              <g key={`part-${p.id}`}>
                <circle
                  className={`tpc-node is-${tone} ${active ? 'is-active' : ''} ${p.state === 'blocked' ? 'is-blocked' : ''}`}
                  cx={x}
                  cy={partY}
                  r={partR}
                />
                <g transform={`translate(${x - 9}, ${partY - 26})`}>
                  {PartIcon(p.state)}
                </g>
                <text className="tpc-node-id" x={x} y={partY + 2} textAnchor="middle">{`P${p.id}`}</text>
                <text className={`tpc-node-state is-${tone}`} x={x} y={partY + partR + 16} textAnchor="middle">
                  {STATE_LABEL[p.state]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tpc-metrics">
        <div className="tpc-metric">
          <span className="tpc-metric-label">protocol</span>
          <span className="tpc-metric-value">{protocol === '3pc' ? '3PC' : '2PC'}</span>
        </div>
        <div className="tpc-metric">
          <span className="tpc-metric-label">phase</span>
          <span className={`tpc-metric-value ${blocked ? 'is-bad' : terminated ? 'is-ok' : ''}`}>
            {PHASE_LABEL[current.phase] || current.phase}
          </span>
        </div>
        <div className="tpc-metric">
          <span className="tpc-metric-label">coordinator</span>
          <span className={`tpc-metric-value ${coordAlive ? 'is-ok' : 'is-bad'}`}>
            {coordAlive ? 'alive' : 'crashed'}
          </span>
        </div>
        <div className="tpc-metric">
          <span className="tpc-metric-label">blocked?</span>
          <span className={`tpc-metric-value ${blocked ? 'is-bad' : terminated ? 'is-ok' : ''}`}>
            {blocked ? 'yes — frozen, holding locks' : terminated ? 'no — terminated' : 'not yet'}
          </span>
        </div>
        <div className="tpc-metric tpc-metric-dim">
          <span className="tpc-metric-label">outcome</span>
          <span className={`tpc-metric-value ${outcomeTone}`}>
            {outcome === 'committed' ? 'committed'
              : outcome === 'aborted' ? 'aborted'
                : outcome === 'unknown' ? 'unknown — undecidable' : 'pending'}
          </span>
        </div>
      </div>

      <div className={`tpc-narration ${blocked ? 'is-bad' : terminated ? 'is-ok' : ''}`}>
        <span className={`tpc-narration-label ${blocked ? 'is-bad' : terminated ? 'is-ok' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="tpc-narration-body">{current.note}</span>
      </div>

      <div className="tpc-legend">
        <span className="tpc-legend-item"><HelpCircle size={13} className="tpc-ic is-dim" /> uncertain — has not voted</span>
        <span className="tpc-legend-item"><Lock size={13} className="tpc-ic is-warn" /> yes-voted — holding locks, no decision yet</span>
        <span className="tpc-legend-item"><ShieldCheck size={13} className="tpc-ic is-pre" /> precommitted — knows commit is safe</span>
        <span className="tpc-legend-item"><CheckCircle size={13} className="tpc-ic is-ok" /> committed — done, locks released</span>
        <span className="tpc-legend-item"><AlertTriangle size={13} className="tpc-ic is-bad" /> blocked — frozen on coordinator crash (2PC)</span>
        <span className="tpc-legend-item"><Database size={13} className="tpc-ic" /> participant data node</span>
      </div>
    </div>
  );
}
