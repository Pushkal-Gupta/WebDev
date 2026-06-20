import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ShoppingCart, CreditCard, Package, Truck, Check, X, Undo2, AlertTriangle } from 'lucide-react';
import './SagaPatternViz.css';

// Saga pattern — a distributed transaction split into a chain of LOCAL
// transactions T1..Tn, one per service, each committed independently. There is
// no global two-phase lock; atomicity is recovered by COMPENSATION. Every
// forward step Ti has a semantic inverse Ci that undoes its committed effect.
//
// HAPPY PATH: run T1..Tn in order. Each Ti commits locally and the saga reaches
// the COMMITTED outcome — every service has applied its piece.
//
// FAILURE PATH: if step Tk FAILS (it cannot commit — out of stock, declined
// card, etc.), the already-committed steps T1..T(k-1) must be undone. The saga
// orchestrator runs the compensations in REVERSE order: C(k-1), C(k-2), ... C1.
// Tk itself committed nothing, so it needs no compensation. The system is left
// consistent (as if the transaction never happened) — the COMPENSATED outcome.
//
// Orchestration (a central orchestrator drives the calls, shown here) vs
// choreography (services emit events that trigger the next step) is the standard
// implementation split; the compensation logic is identical either way.

const SERVICES = [
  { key: 'order', label: 'Order', icon: ShoppingCart, forward: 'create order', compensate: 'cancel order' },
  { key: 'payment', label: 'Payment', icon: CreditCard, forward: 'charge card', compensate: 'refund payment' },
  { key: 'inventory', label: 'Inventory', icon: Package, forward: 'reserve stock', compensate: 'release stock' },
  { key: 'shipping', label: 'Shipping', icon: Truck, forward: 'schedule ship', compensate: 'cancel shipment' },
];

const N = SERVICES.length;

// failAt: 1-based index of the step that fails, or 0 for the happy path.
function buildFrames(failAt) {
  const frames = [];

  // per-service state: 'pending' | 'done' | 'failed' | 'compensated'
  const states = SERVICES.map(() => 'pending');

  const snap = (extra) => ({
    states: [...states],
    active: -1,        // index currently being acted on
    mode: 'forward',   // 'forward' | 'rollback'
    outcome: null,     // null | 'committed' | 'compensated'
    note: '',
    phase: 'run',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: failAt === 0
      ? `Saga over ${N} services. Each runs one local transaction Ti and commits independently — there is no global lock. Here every step succeeds, so the saga runs T1..T${N} forward and reaches a clean COMMIT.`
      : `Saga over ${N} services. Each Ti commits locally and has a compensating inverse Ci. Here ${SERVICES[failAt - 1].label} (T${failAt}) will FAIL, so after T1..T${failAt - 1} commit, the saga must roll them back with compensations in reverse — C${failAt - 1}..C1 — to leave the system consistent.`,
  }));

  // ---- Forward chain: T1 .. up to the failing step (or all N) ----
  const lastForward = failAt === 0 ? N : failAt; // 1-based index of last forward attempt
  for (let i = 0; i < lastForward; i += 1) {
    const isFail = failAt !== 0 && i === failAt - 1;
    if (isFail) {
      states[i] = 'failed';
      frames.push(snap({
        active: i, mode: 'forward', phase: 'fail',
        note: `T${i + 1} — ${SERVICES[i].label}: ${SERVICES[i].forward} FAILS. The local transaction cannot commit (e.g. out of stock / declined). Nothing is committed at ${SERVICES[i].label}, so it needs no compensation — but everything committed before it now must be undone.`,
      }));
    } else {
      states[i] = 'done';
      frames.push(snap({
        active: i, mode: 'forward', phase: 'forward',
        note: `T${i + 1} — ${SERVICES[i].label}: ${SERVICES[i].forward}. The local transaction commits and is durable. The saga advances to the next service.`,
      }));
    }
  }

  if (failAt === 0) {
    frames.push(snap({
      mode: 'forward', phase: 'done', outcome: 'committed',
      note: `DONE — saga COMMITTED. All ${N} local transactions committed in order; every service applied its step. With no failure, no compensation was needed.`,
    }));
    return frames;
  }

  // ---- Rollback wave: compensate committed steps in REVERSE ----
  frames.push(snap({
    mode: 'rollback', phase: 'rollback-begin', active: -1,
    note: `T${failAt} failed, so the saga ABORTS and switches to recovery. The committed steps T1..T${failAt - 1} are undone by their compensations, applied in REVERSE order so each effect is unwound on top of a consistent state.`,
  }));

  for (let i = failAt - 2; i >= 0; i -= 1) {
    states[i] = 'compensated';
    frames.push(snap({
      active: i, mode: 'rollback', phase: 'compensate',
      note: `C${i + 1} — ${SERVICES[i].label}: ${SERVICES[i].compensate}. The committed effect of T${i + 1} is reversed. Compensations run high-index to low so the undo mirrors the original order exactly.`,
    }));
  }

  frames.push(snap({
    mode: 'rollback', phase: 'done', outcome: 'compensated',
    note: `DONE — saga COMPENSATED. ${failAt - 1 === 0 ? 'No prior step had committed, so nothing needed undoing' : `Steps 1..${failAt - 1} were rolled back in reverse (C${failAt - 1}..C1)`}; T${failAt} never committed. The system is consistent — as if the transaction never ran.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1150;

const STATE_LABEL = {
  pending: 'pending',
  done: 'done',
  failed: 'failed',
  compensated: 'compensated',
};

export default function SagaPatternViz() {
  const [failAt, setFailAt] = useState(0); // 0 = happy path
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(failAt), [failAt]);
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

  const switchFail = (k) => {
    if (k === failAt) return;
    setIsRunning(false);
    setStep(0);
    setFailAt(k);
  };

  // SVG geometry
  const W = 940;
  const H = 360;

  const boxW = 188;
  const boxH = 108;
  const gap = (W - N * boxW) / (N + 1);
  const boxX = (i) => gap + i * (boxW + gap);
  const boxY = 96;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const stateTone = (st) => {
    if (st === 'done') return 'ok';
    if (st === 'failed') return 'bad';
    if (st === 'compensated') return 'warn';
    return 'neutral';
  };

  const doneCount = current.states.filter((s) => s === 'done').length;
  const compCount = current.states.filter((s) => s === 'compensated').length;

  const FAIL_OPTS = [
    { k: 0, label: 'happy path' },
    ...SERVICES.map((s, i) => ({ k: i + 1, label: `fail at T${i + 1} · ${s.label}` })),
  ];

  return (
    <div className="sgv">
      <div className="sgv-head">
        <h3 className="sgv-title">Saga pattern — local transactions with compensating rollback</h3>
        <p className="sgv-sub">
          Step a distributed transaction through a chain of services. On the happy path T1..T4 each commit locally.
          Force a step to fail and the saga unwinds the committed steps with compensations in reverse order — C(k-1)..C1 —
          leaving the system consistent.
        </p>
      </div>

      <div className="sgv-controls">
        <div className="sgv-modes" role="tablist" aria-label="Failure scenario">
          {FAIL_OPTS.map((o) => (
            <button
              key={o.k}
              type="button"
              className={`sgv-mode ${failAt === o.k ? 'is-on' : ''}`}
              onClick={() => switchFail(o.k)}
              aria-pressed={failAt === o.k}
            >
              {o.label}
            </button>
          ))}
        </div>

        <label className="sgv-speed">
          <span className="sgv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="sgv-speed-range"
            aria-label="Playback speed"
          />
          <span className="sgv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="sgv-spacer" aria-hidden="true" />

        <div className="sgv-buttons">
          <button
            type="button"
            className="sgv-btn sgv-btn-primary"
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
            className="sgv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="sgv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="sgv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="sgv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="sgv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sgv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="sgv-arrow-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="sgv-ah-fwd" />
            </marker>
            <marker id="sgv-arrow-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="sgv-ah-back" />
            </marker>
          </defs>

          {/* connecting edges between services */}
          {SERVICES.slice(0, N - 1).map((_, i) => {
            const rollback = current.mode === 'rollback';
            // a forward edge i->i+1 is "hot" when we just advanced onto i+1
            const fwdHot = !rollback && current.active === i + 1 && current.phase !== 'init';
            // a compensation edge (drawn as a return arc) is hot when compensating i (came from i+1)
            const backHot = rollback && current.active === i && current.phase === 'compensate';
            const x1 = boxX(i) + boxW;
            const x2 = boxX(i + 1);
            const yF = boxY + 34;
            const yB = boxY + boxH - 20;
            return (
              <g key={`edge-${i}`}>
                {/* forward arrow (top) */}
                <line
                  className={`sgv-edge sgv-edge-fwd ${fwdHot ? 'is-hot' : ''}`}
                  x1={x1 + 6}
                  y1={yF}
                  x2={x2 - 8}
                  y2={yF}
                  markerEnd="url(#sgv-arrow-fwd)"
                />
                <text className="sgv-edge-label sgv-edge-label-fwd" x={(x1 + x2) / 2} y={yF - 8}>{`T${i + 2}`}</text>
                {/* compensation arrow (bottom, points back) */}
                <line
                  className={`sgv-edge sgv-edge-back ${backHot ? 'is-hot' : ''}`}
                  x1={x2 - 8}
                  y1={yB}
                  x2={x1 + 6}
                  y2={yB}
                  markerEnd="url(#sgv-arrow-back)"
                />
                <text className={`sgv-edge-label sgv-edge-label-back ${backHot ? 'is-hot' : ''}`} x={(x1 + x2) / 2} y={yB + 18}>{`C${i + 1}`}</text>
              </g>
            );
          })}

          {/* service nodes */}
          {SERVICES.map((svc, i) => {
            const st = current.states[i];
            const tone = stateTone(st);
            const active = current.active === i;
            const Icon = svc.icon;
            const x = boxX(i);
            return (
              <g key={svc.key} className={`sgv-node ${active ? 'is-active' : ''}`}>
                <rect
                  className={`sgv-box is-${tone} ${active ? 'is-active' : ''}`}
                  x={x}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx={12}
                />
                <g transform={`translate(${x + 14}, ${boxY + 13})`}>
                  <Icon width={18} height={18} className="sgv-ic" />
                </g>
                <text className="sgv-box-title" x={x + 40} y={boxY + 27}>{svc.label}</text>
                <text className="sgv-box-tk" x={x + boxW - 14} y={boxY + 27}>{`T${i + 1}`}</text>
                <line className="sgv-box-rule" x1={x + 14} y1={boxY + 40} x2={x + boxW - 14} y2={boxY + 40} />

                <g transform={`translate(${x + 14}, ${boxY + 52})`}>
                  {st === 'done' && <Check width={15} height={15} className="sgv-ic is-ok" />}
                  {st === 'failed' && <X width={15} height={15} className="sgv-ic is-bad" />}
                  {st === 'compensated' && <Undo2 width={15} height={15} className="sgv-ic is-warn" />}
                </g>
                <text className={`sgv-box-state is-${tone}`} x={st === 'pending' ? x + 14 : x + 36} y={boxY + 65}>
                  {STATE_LABEL[st]}
                </text>

                <text className="sgv-box-op" x={x + 14} y={boxY + 88}>
                  {st === 'compensated' ? `C${i + 1}: ${svc.compensate}`
                    : st === 'failed' ? `${svc.forward} — failed`
                      : `T${i + 1}: ${svc.forward}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sgv-metrics">
        <div className="sgv-metric">
          <span className="sgv-metric-label">mode</span>
          <span className={`sgv-metric-value ${current.mode === 'rollback' ? 'is-warn' : ''}`}>
            {current.phase === 'init' ? 'idle' : current.mode === 'rollback' ? 'rollback' : 'forward'}
          </span>
        </div>
        <div className="sgv-metric">
          <span className="sgv-metric-label">committed</span>
          <span className="sgv-metric-value">{doneCount}</span>
        </div>
        <div className="sgv-metric">
          <span className="sgv-metric-label">compensated</span>
          <span className={`sgv-metric-value ${compCount > 0 ? 'is-warn' : ''}`}>{compCount}</span>
        </div>
        <div className="sgv-metric">
          <span className="sgv-metric-label">outcome</span>
          <span className={`sgv-metric-value ${current.outcome === 'committed' ? 'is-ok' : current.outcome === 'compensated' ? 'is-warn' : ''}`}>
            {current.outcome === 'committed' ? 'committed'
              : current.outcome === 'compensated' ? 'compensated'
                : '—'}
          </span>
        </div>
        <div className="sgv-metric sgv-metric-dim">
          <span className="sgv-metric-label">consistency</span>
          <span className="sgv-metric-value sgv-metric-dimval">
            {current.outcome ? 'restored' : current.mode === 'rollback' ? 'recovering' : 'in progress'}
          </span>
        </div>
      </div>

      <div className="sgv-note-row">
        <AlertTriangle width={13} height={13} className="sgv-ic is-dim" />
        <span className="sgv-note-text">
          Orchestration drives the calls from a central coordinator; choreography has each service emit an event that triggers
          the next. The compensation logic is identical either way.
        </span>
      </div>

      <div className="sgv-narration">
        <span className={`sgv-narration-label sgv-phase-${current.phase}`}>
          {current.phase === 'fail' ? 'fail'
            : current.phase === 'compensate' || current.phase === 'rollback-begin' ? 'compensate'
              : current.phase === 'done' ? (current.outcome === 'committed' ? 'commit' : 'compensated')
                : 'trace'}
        </span>
        <span className="sgv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
