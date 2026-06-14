import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Server, Database, Check, X, HelpCircle, Zap } from 'lucide-react';
import './TwoPhaseCommitViz.css';

// Two-Phase Commit (2PC) — atomic commit across a coordinator and N participants.
//
// Phase 1 (PREPARE / voting):
//   The coordinator sends PREPARE to every participant. Each participant writes a
//   prepare record to its log (so it can honour the vote after a restart) and votes
//   YES (ready, locks held) or NO (cannot commit). A YES is a binding promise: the
//   participant must keep the option to commit open until it hears the decision.
//
// Phase 2 (COMMIT / ABORT):
//   If EVERY participant voted YES, the coordinator decides COMMIT, logs it, and
//   broadcasts COMMIT; participants commit and ack. If ANY participant voted NO
//   (or timed out), the coordinator decides ABORT and broadcasts ABORT; participants
//   roll back and ack. Outcome = COMMIT iff all votes are YES, else ABORT.
//
// The classic weakness: if the coordinator CRASHES after collecting YES votes but
// before broadcasting the decision, every participant that voted YES is stuck in
// the "prepared" state — it holds its locks and cannot unilaterally commit or abort.
// 2PC is a BLOCKING protocol: the participants wait, uncertain, until the
// coordinator recovers. That is the toggle this viz makes visible.

const NUM_PARTICIPANTS = 3;
const PNAMES = ['P1', 'P2', 'P3'];

const SCENARIOS = {
  'all commit': { noVoter: -1, crash: false },
  'P2 votes NO': { noVoter: 1, crash: false },
  'coordinator crash': { noVoter: -1, crash: true },
};

// Build the full immutable frame trace for a scenario.
// State carried across frames:
//   coord  : { decision: null|'COMMIT'|'ABORT', crashed: bool, phase }
//   parts  : per-participant { state, vote, logged }
//     state: 'working' | 'prepared' | 'committed' | 'aborted' | 'blocked'
//     vote : null | 'YES' | 'NO'
//   msg    : the in-flight message highlight { dir:'down'|'up', to|from, kind }
function buildFrames(scenario) {
  const { noVoter, crash } = SCENARIOS[scenario];
  const frames = [];

  const parts = PNAMES.map(() => ({ state: 'working', vote: null, logged: false }));
  const coord = { decision: null, crashed: false };
  const log = [];

  const snap = (extra) => ({
    coord: { ...coord },
    parts: parts.map((p) => ({ ...p })),
    log: [...log],
    msg: null,
    activeP: -1,
    phase: 'run',
    note: '',
    ...extra,
  });

  const pushLog = (line) => { log.push(line); };

  frames.push(snap({
    phase: 'init',
    note: `Two-phase commit over a coordinator and ${NUM_PARTICIPANTS} participants. The goal is an all-or-nothing decision: either every participant commits the transaction, or every participant aborts it — no partial commit, ever. ${
      scenario === 'all commit'
        ? 'Here every participant is able to commit, so the outcome will be COMMIT.'
        : scenario === 'P2 votes NO'
          ? 'Here P2 will be unable to commit and vote NO, which must force a global ABORT.'
          : 'Here the coordinator will crash after collecting votes but before announcing the decision — the participants will be left blocked.'
    }`,
  }));

  // ---- Phase 1: PREPARE / voting ----
  frames.push(snap({
    phase: 'prepare-bcast',
    msg: { dir: 'down', to: -1, kind: 'PREPARE' },
    note: 'PHASE 1 — PREPARE. The coordinator writes a "begin 2PC" record and broadcasts PREPARE to all participants, asking each: can you commit this transaction?',
  }));
  pushLog('coord: send PREPARE -> all');

  for (let i = 0; i < parts.length; i += 1) {
    const votesNo = i === noVoter;
    parts[i].logged = true;
    parts[i].vote = votesNo ? 'NO' : 'YES';
    parts[i].state = votesNo ? 'aborted' : 'prepared';
    pushLog(`${PNAMES[i]}: log ${votesNo ? 'ABORT' : 'PREPARE'}, vote ${votesNo ? 'NO' : 'YES'}`);
    frames.push(snap({
      phase: 'vote',
      activeP: i,
      msg: { dir: 'up', from: i, kind: votesNo ? 'NO' : 'YES' },
      note: votesNo
        ? `${PNAMES[i]} cannot commit (constraint violation / no resources). It logs an ABORT record, rolls back its own work, and votes NO. A single NO is enough to doom the whole transaction.`
        : `${PNAMES[i]} can commit. It force-writes a PREPARE record to its log (durable, so it survives a restart), holds its locks, enters the "prepared" state, and votes YES. YES is a binding promise: ${PNAMES[i]} must now wait for the coordinator's decision before releasing anything.`,
    }));
  }

  const allYes = parts.every((p) => p.vote === 'YES');

  // ---- Coordinator collects votes / decides ----
  if (crash) {
    // Coordinator crashes after collecting votes, before broadcasting the decision.
    coord.crashed = true;
    pushLog('coord: CRASH (votes in, no decision)');
    // Every participant that voted YES is now prepared-but-uncertain -> blocked.
    parts.forEach((p) => { if (p.vote === 'YES') p.state = 'blocked'; });
    frames.push(snap({
      phase: 'crash',
      msg: null,
      note: 'CRASH. The coordinator has collected the votes but DIES before it can log a decision or broadcast it. No COMMIT or ABORT message ever goes out.',
    }));
    frames.push(snap({
      phase: 'blocked',
      note: 'BLOCKED. Every participant voted YES and is "prepared": it holds its locks and may not unilaterally commit or abort — it promised to obey the coordinator. With the coordinator gone and no decision logged, the participants are stuck waiting, locks held, uncertain. This is the defining weakness of 2PC: it is a BLOCKING protocol. Recovery requires the coordinator to come back and read its log (or a 3PC / Paxos-commit variant that removes the single point of failure).',
      phaseFinal: true,
    }));
    return frames;
  }

  const decision = allYes ? 'COMMIT' : 'ABORT';
  coord.decision = decision;
  pushLog(`coord: log decision ${decision}`);
  frames.push(snap({
    phase: 'decide',
    note: allYes
      ? 'All votes are YES. The coordinator reaches its decision point: it force-writes a COMMIT record to its own log FIRST (this log entry is the moment of truth — once it is durable the transaction is committed), then proceeds to announce it.'
      : `At least one participant voted NO (${PNAMES[noVoter]}). The coordinator force-writes an ABORT record to its log and will tell everyone to roll back. Unanimity is required for COMMIT; one NO is a global ABORT.`,
  }));

  // ---- Phase 2: broadcast COMMIT / ABORT ----
  frames.push(snap({
    phase: 'decide-bcast',
    msg: { dir: 'down', to: -1, kind: decision },
    note: `PHASE 2 — ${decision}. The coordinator broadcasts ${decision} to every participant.`,
  }));
  pushLog(`coord: send ${decision} -> all`);

  for (let i = 0; i < parts.length; i += 1) {
    if (decision === 'COMMIT') {
      parts[i].state = 'committed';
      pushLog(`${PNAMES[i]}: COMMIT, ack`);
      frames.push(snap({
        phase: 'apply',
        activeP: i,
        msg: { dir: 'up', from: i, kind: 'ACK' },
        note: `${PNAMES[i]} receives COMMIT: it makes its prepared changes permanent, releases its locks, and acks. Because it had logged PREPARE, it would still commit even if it had crashed and restarted in between.`,
      }));
    } else {
      // ABORT: a participant that already voted NO is aborted; the YES voters roll back.
      const wasNo = parts[i].vote === 'NO';
      parts[i].state = 'aborted';
      pushLog(`${PNAMES[i]}: ${wasNo ? 'already rolled back' : 'ROLLBACK'}, ack`);
      frames.push(snap({
        phase: 'apply',
        activeP: i,
        msg: { dir: 'up', from: i, kind: 'ACK' },
        note: wasNo
          ? `${PNAMES[i]} already rolled back when it voted NO; it simply acks the ABORT. Nothing was committed anywhere.`
          : `${PNAMES[i]} had voted YES and was holding locks in the prepared state. On ABORT it rolls back its changes, releases its locks, and acks. Even though it was willing to commit, the global decision overrides it.`,
      }));
    }
  }

  const committedCount = parts.filter((p) => p.state === 'committed').length;
  frames.push(snap({
    phase: 'done',
    phaseFinal: true,
    note: decision === 'COMMIT'
      ? `DONE — global COMMIT. All ${committedCount} participants committed and acked. Atomicity holds: every participant applied the transaction, none is left partial.`
      : `DONE — global ABORT. Every participant rolled back; nothing was committed anywhere. Atomicity holds: the single NO from ${PNAMES[noVoter]} guaranteed an all-or-nothing abort.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1150;
const SCEN_KEYS = Object.keys(SCENARIOS);

const STATE_LABEL = {
  working: 'working',
  prepared: 'prepared',
  committed: 'committed',
  aborted: 'aborted',
  blocked: 'blocked',
};

export default function TwoPhaseCommitViz() {
  const [scenario, setScenario] = useState(SCEN_KEYS[0]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(scenario), [scenario]);
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

  const switchScenario = (s) => {
    if (s === scenario) return;
    setIsRunning(false);
    setStep(0);
    setScenario(s);
  };

  // SVG geometry
  const W = 940;
  const H = 470;

  const coordW = 280;
  const coordH = 96;
  const coordX = (W - coordW) / 2;
  const coordY = 40;

  const partW = 248;
  const partGap = 28;
  const partsTotal = NUM_PARTICIPANTS * partW + (NUM_PARTICIPANTS - 1) * partGap;
  const partLeft = (W - partsTotal) / 2;
  const partY = 300;
  const partH = 130;

  const partX = (i) => partLeft + i * (partW + partGap);
  const partCx = (i) => partX(i) + partW / 2;

  const coordCx = coordX + coordW / 2;
  const coordBottom = coordY + coordH;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const decision = current.coord.decision;
  const crashed = current.coord.crashed;

  // message edge style per participant for the current frame
  const edgeInfo = (i) => {
    const m = current.msg;
    if (!m) return null;
    if (m.dir === 'down' && (m.to === -1 || m.to === i)) {
      return { dir: 'down', kind: m.kind };
    }
    if (m.dir === 'up' && m.from === i) {
      return { dir: 'up', kind: m.kind };
    }
    return null;
  };

  const msgTone = (kind) => {
    if (kind === 'YES' || kind === 'COMMIT' || kind === 'ACK') return 'ok';
    if (kind === 'NO' || kind === 'ABORT') return 'bad';
    return 'neutral';
  };

  const stateTone = (st) => {
    if (st === 'committed') return 'ok';
    if (st === 'aborted') return 'bad';
    if (st === 'blocked') return 'warn';
    if (st === 'prepared') return 'prep';
    return 'neutral';
  };

  const coordStatus = crashed
    ? 'CRASHED'
    : decision
      ? `decided ${decision}`
      : current.phase === 'prepare-bcast'
        ? 'sent PREPARE'
        : current.phase === 'vote'
          ? 'collecting votes'
          : 'coordinating';

  const recentLog = current.log.slice(-7);

  return (
    <div className="tpcv">
      <div className="tpcv-head">
        <h3 className="tpcv-title">Two-Phase Commit — atomic commit across a coordinator and participants</h3>
        <p className="tpcv-sub">
          Step the protocol: the coordinator asks every participant to PREPARE and collects YES/NO votes, then
          broadcasts COMMIT only if all voted YES, else ABORT. Force a NO vote to see the abort path, or crash the
          coordinator after voting to see participants block — the defining weakness of 2PC.
        </p>
      </div>

      <div className="tpcv-controls">
        <div className="tpcv-modes" role="tablist" aria-label="Scenario">
          {SCEN_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              className={`tpcv-mode ${scenario === s ? 'is-on' : ''}`}
              onClick={() => switchScenario(s)}
              aria-pressed={scenario === s}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="tpcv-speed">
          <span className="tpcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="tpcv-speed-range"
            aria-label="Playback speed"
          />
          <span className="tpcv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="tpcv-spacer" aria-hidden="true" />

        <div className="tpcv-buttons">
          <button
            type="button"
            className="tpcv-btn tpcv-btn-primary"
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
            className="tpcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="tpcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="tpcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="tpcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="tpcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tpcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tpcv-arrow-ok" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpcv-ah-ok" />
            </marker>
            <marker id="tpcv-arrow-bad" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpcv-ah-bad" />
            </marker>
            <marker id="tpcv-arrow-neutral" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tpcv-ah-neutral" />
            </marker>
          </defs>

          {/* message edges coordinator <-> participants */}
          {PNAMES.map((_, i) => {
            const info = edgeInfo(i);
            if (!info) return null;
            const tone = msgTone(info.kind);
            const cx = partCx(i);
            // slight horizontal offset so down/up edges don't overlap
            const down = info.dir === 'down';
            const x1 = down ? coordCx - 26 + i * 26 : cx - 18;
            const x2 = down ? cx - 18 : coordCx - 26 + i * 26;
            const y1 = down ? coordBottom : partY;
            const y2 = down ? partY : coordBottom;
            const midY = (coordBottom + partY) / 2;
            const labelY = down ? midY - 8 : midY + 16;
            return (
              <g key={`edge-${i}`}>
                <path
                  className={`tpcv-edge is-${tone} is-hot`}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  markerEnd={`url(#tpcv-arrow-${tone})`}
                />
                <rect
                  className={`tpcv-msg-pill is-${tone}`}
                  x={(x1 + x2) / 2 - 30}
                  y={labelY - 13}
                  width={60}
                  height={20}
                  rx={10}
                />
                <text className="tpcv-msg-text" x={(x1 + x2) / 2} y={labelY + 2}>{info.kind}</text>
              </g>
            );
          })}

          {/* coordinator */}
          <g className={`tpcv-node ${crashed ? 'is-crashed' : ''}`}>
            <rect
              className={`tpcv-coord ${crashed ? 'is-crashed' : ''} ${decision === 'COMMIT' ? 'is-commit' : ''} ${decision === 'ABORT' ? 'is-abort' : ''}`}
              x={coordX}
              y={coordY}
              width={coordW}
              height={coordH}
              rx={12}
            />
            <g transform={`translate(${coordX + 16}, ${coordY + 15})`}>
              {crashed ? <Zap width={18} height={18} className="tpcv-ic is-bad" /> : <Server width={18} height={18} className="tpcv-ic" />}
            </g>
            <text className="tpcv-coord-title" x={coordX + 44} y={coordY + 30}>coordinator</text>
            <text className={`tpcv-coord-status ${crashed ? 'is-bad' : decision === 'COMMIT' ? 'is-ok' : decision === 'ABORT' ? 'is-bad' : ''}`} x={coordX + coordW - 16} y={coordY + 30}>
              {coordStatus}
            </text>
            <line className="tpcv-coord-rule" x1={coordX + 16} y1={coordY + 44} x2={coordX + coordW - 16} y2={coordY + 44} />
            <text className="tpcv-coord-decision-k" x={coordX + 16} y={coordY + 70}>decision</text>
            <text
              className={`tpcv-coord-decision-v ${decision === 'COMMIT' ? 'is-ok' : decision === 'ABORT' ? 'is-bad' : ''}`}
              x={coordX + 92}
              y={coordY + 70}
            >
              {crashed ? 'none logged' : decision || 'pending…'}
            </text>
            <text className="tpcv-coord-phase" x={coordX + coordW - 16} y={coordY + 70}>
              {current.phase.startsWith('prepare') || current.phase === 'vote' ? 'phase 1' : (decision || crashed ? 'phase 2' : '—')}
            </text>
          </g>

          {/* participants */}
          {PNAMES.map((name, i) => {
            const p = current.parts[i];
            const active = current.activeP === i;
            const tone = stateTone(p.state);
            const x = partX(i);
            return (
              <g key={`part-${i}`} className={`tpcv-node ${active ? 'is-active' : ''}`}>
                <rect
                  className={`tpcv-part is-${tone} ${active ? 'is-active' : ''}`}
                  x={x}
                  y={partY}
                  width={partW}
                  height={partH}
                  rx={12}
                />
                <g transform={`translate(${x + 16}, ${partY + 15})`}>
                  <Database width={17} height={17} className="tpcv-ic" />
                </g>
                <text className="tpcv-part-title" x={x + 42} y={partY + 30}>{name}</text>
                <text className={`tpcv-part-state is-${tone}`} x={x + partW - 16} y={partY + 30}>
                  {STATE_LABEL[p.state]}
                </text>
                <line className="tpcv-part-rule" x1={x + 16} y1={partY + 44} x2={x + partW - 16} y2={partY + 44} />

                {/* vote row */}
                <text className="tpcv-part-k" x={x + 16} y={partY + 70}>vote</text>
                <g transform={`translate(${x + 64}, ${partY + 58})`}>
                  {p.vote === 'YES' && <Check width={15} height={15} className="tpcv-ic is-ok" />}
                  {p.vote === 'NO' && <X width={15} height={15} className="tpcv-ic is-bad" />}
                  {p.vote == null && <HelpCircle width={15} height={15} className="tpcv-ic is-dim" />}
                </g>
                <text
                  className={`tpcv-part-vote ${p.vote === 'YES' ? 'is-ok' : p.vote === 'NO' ? 'is-bad' : 'is-dim'}`}
                  x={x + 86}
                  y={partY + 70}
                >
                  {p.vote || '—'}
                </text>

                {/* log row */}
                <text className="tpcv-part-k" x={x + 16} y={partY + 98}>log</text>
                <text className={`tpcv-part-log ${p.logged ? 'is-on' : 'is-dim'}`} x={x + 64} y={partY + 98}>
                  {p.state === 'committed' ? 'COMMIT written'
                    : p.state === 'aborted' ? 'ABORT written'
                      : p.state === 'blocked' ? 'PREPARE (waiting)'
                        : p.logged ? 'PREPARE written'
                          : 'empty'}
                </text>

                {p.state === 'blocked' && (
                  <text className="tpcv-part-blocked" x={x + partW / 2} y={partY + partH - 8}>locks held · uncertain</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tpcv-metrics">
        <div className="tpcv-metric">
          <span className="tpcv-metric-label">phase</span>
          <span className="tpcv-metric-value">
            {current.phase.startsWith('prepare') || current.phase === 'vote' ? '1 · prepare' : (decision || crashed ? '2 · decide' : 'idle')}
          </span>
        </div>
        <div className="tpcv-metric">
          <span className="tpcv-metric-label">votes</span>
          <span className="tpcv-metric-value">
            {current.parts.map((p, i) => `${PNAMES[i]}:${p.vote || '—'}`).join('  ')}
          </span>
        </div>
        <div className="tpcv-metric">
          <span className="tpcv-metric-label">decision</span>
          <span className={`tpcv-metric-value ${decision === 'COMMIT' ? 'is-ok' : decision === 'ABORT' ? 'is-bad' : ''}`}>
            {crashed ? 'none (blocked)' : decision || 'pending'}
          </span>
        </div>
        <div className="tpcv-metric">
          <span className="tpcv-metric-label">outcome</span>
          <span className={`tpcv-metric-value ${current.phase === 'done' && decision === 'COMMIT' ? 'is-ok' : (current.phase === 'done' || current.phase === 'blocked') ? 'is-bad' : ''}`}>
            {current.phase === 'done'
              ? (decision === 'COMMIT' ? 'all committed' : 'all aborted')
              : current.phase === 'blocked'
                ? 'blocked'
                : '—'}
          </span>
        </div>
        <div className="tpcv-metric tpcv-metric-dim">
          <span className="tpcv-metric-label">atomic</span>
          <span className="tpcv-metric-value tpcv-metric-dimval">
            {current.phase === 'done' ? 'all-or-nothing held' : current.phase === 'blocked' ? 'awaiting recovery' : '—'}
          </span>
        </div>
      </div>

      <div className="tpcv-log">
        <span className="tpcv-log-label">message log</span>
        <span className="tpcv-log-body">
          {recentLog.length ? recentLog.join('   ·   ') : 'no messages yet'}
        </span>
      </div>

      <div className="tpcv-narration">
        <span className={`tpcv-narration-label tpcv-phase-${current.phase}`}>
          {current.phase === 'crash' ? 'crash'
            : current.phase === 'blocked' ? 'blocked'
              : current.phase === 'done' ? (decision === 'COMMIT' ? 'commit' : 'abort')
                : 'trace'}
        </span>
        <span className="tpcv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
