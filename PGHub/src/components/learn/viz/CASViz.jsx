import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, RefreshCw } from 'lucide-react';
import './CASViz.css';

// Two threads each do one atomic increment of a shared cell via a CAS retry loop:
//   loop: old = read(mem); next = old + 1; if CAS(mem, expected=old, next) -> done; else retry
// We replay a fixed interleaving designed to force one CAS failure + retry on T2,
// proving no update is lost (final == initial + successful increments).

const INIT_VALUE = 5;

// An interleaving is an ordered list of micro-steps, each tagged with the thread.
// kinds: 'read' | 'compute' | 'cas'
const INTERLEAVINGS = {
  'race (T2 retries)': [
    { t: 0, kind: 'read' },
    { t: 1, kind: 'read' },     // T2 reads the SAME old value before T1 commits
    { t: 0, kind: 'compute' },
    { t: 0, kind: 'cas' },      // T1 commits first -> succeeds
    { t: 1, kind: 'compute' },
    { t: 1, kind: 'cas' },      // T2 expected==old but mem moved -> FAIL
    { t: 1, kind: 'read' },     // retry: re-read fresh value
    { t: 1, kind: 'compute' },
    { t: 1, kind: 'cas' },      // succeeds on fresh value
  ],
  'no contention': [
    { t: 0, kind: 'read' },
    { t: 0, kind: 'compute' },
    { t: 0, kind: 'cas' },      // T1 commits, no overlap
    { t: 1, kind: 'read' },
    { t: 1, kind: 'compute' },
    { t: 1, kind: 'cas' },      // T2 commits, no overlap
  ],
  'both stale (double retry)': [
    { t: 0, kind: 'read' },
    { t: 1, kind: 'read' },     // both read same old
    { t: 1, kind: 'compute' },
    { t: 1, kind: 'cas' },      // T2 commits first
    { t: 0, kind: 'compute' },
    { t: 0, kind: 'cas' },      // T1 stale -> FAIL
    { t: 0, kind: 'read' },     // T1 retries with fresh value
    { t: 0, kind: 'compute' },
    { t: 0, kind: 'cas' },      // T1 succeeds
  ],
};

function buildFrames(plan) {
  const frames = [];
  let mem = INIT_VALUE;
  // per-thread scratch state
  const th = [
    { read: null, next: null, casResult: null, retries: 0, done: false, pc: 'idle' },
    { read: null, next: null, casResult: null, retries: 0, done: false, pc: 'idle' },
  ];
  let success = 0;

  const snap = (extra) => ({
    mem,
    success,
    th: th.map((s) => ({ ...s })),
    actT: -1,
    kind: null,
    casOk: null,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Shared cell = ${INIT_VALUE}. Two threads each want to add 1 atomically with a CAS loop: read old -> compute old+1 -> CAS(expected=old, new). The expected (initial) total of successful increments is 2.`,
  }));

  for (const stepDef of plan) {
    const { t, kind } = stepDef;
    const s = th[t];
    if (kind === 'read') {
      const isRetry = s.casResult === 'FAIL';
      s.read = mem;
      s.next = null;
      s.casResult = null;
      s.pc = 'read';
      frames.push(snap({
        phase: 'read', actT: t, kind,
        note: `T${t + 1} ${isRetry ? 'retry: re-' : ''}reads shared cell -> old = ${s.read}.`,
      }));
    } else if (kind === 'compute') {
      s.next = s.read + 1;
      s.pc = 'compute';
      frames.push(snap({
        phase: 'compute', actT: t, kind,
        note: `T${t + 1} computes new = old + 1 = ${s.read} + 1 = ${s.next}.`,
      }));
    } else { // cas
      const expected = s.read;
      const proposed = s.next;
      if (mem === expected) {
        mem = proposed;
        s.casResult = 'OK';
        s.done = true;
        s.pc = 'done';
        success += 1;
        frames.push(snap({
          phase: 'cas-ok', actT: t, kind, casOk: true,
          note: `T${t + 1} CAS(expected=${expected}, new=${proposed}): memory is still ${expected} -> SUCCESS. Cell atomically becomes ${proposed}. T${t + 1} is done.`,
        }));
      } else {
        s.casResult = 'FAIL';
        s.retries += 1;
        s.pc = 'fail';
        frames.push(snap({
          phase: 'cas-fail', actT: t, kind, casOk: false,
          note: `T${t + 1} CAS(expected=${expected}, new=${proposed}): memory is ${mem} (another thread won) -> FAIL. No write happens. T${t + 1} loops back and retries with the fresh value.`,
        }));
      }
    }
  }

  frames.push(snap({
    phase: 'done',
    note: `Done. ${success} successful increments, final cell = ${mem} = ${INIT_VALUE} + ${success}. Every increment landed — no update was lost, even though a CAS failed and retried. That is the lock-free guarantee: contention causes a retry, never a corrupted or dropped write.`,
  }));

  return frames;
}

const PLANS = Object.keys(INTERLEAVINGS);

export default function CASViz() {
  const [planKey, setPlanKey] = useState(PLANS[0]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(INTERLEAVINGS[planKey]), [planKey]);
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

  const switchPlan = (p) => {
    if (p === planKey) return;
    setIsRunning(false);
    setStep(0);
    setPlanKey(p);
  };

  // SVG geometry
  const W = 940;
  const H = 420;
  const memX = W / 2;
  const memY = 86;
  const memW = 168;
  const memH = 70;
  const laneY = [232, 332];
  const laneX = 36;
  const laneW = W - laneX * 2;
  const laneH = 72;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const memArrowFrom = (ti) => {
    // visual cue: which lane the current action touches the shared cell from
    if (current.actT !== ti) return null;
    if (current.kind === 'read') return 'read';
    if (current.kind === 'cas') return current.casOk ? 'write' : 'fail';
    return null;
  };

  const lane = (ti) => {
    const s = current.th[ti];
    const y = laneY[ti];
    const active = current.actT === ti;
    const accent = ti === 0 ? 'var(--hue-sky)' : 'var(--hue-pink)';
    const arrow = memArrowFrom(ti);
    return (
      <g key={`lane-${ti}`}>
        {/* connector between this lane and the shared cell */}
        {arrow && (
          <line
            className={`casv-link is-${arrow}`}
            x1={memX}
            y1={memY + memH}
            x2={laneX + 150}
            y2={y}
          />
        )}
        <rect
          className={`casv-lane ${active ? 'is-active' : ''} ${s.done ? 'is-done' : ''}`}
          x={laneX}
          y={y}
          width={laneW}
          height={laneH}
          rx={10}
          style={{ stroke: active ? accent : undefined }}
        />
        <circle cx={laneX + 24} cy={y + laneH / 2} r={13} fill={accent} />
        <text className="casv-thread-tag" x={laneX + 24} y={y + laneH / 2 + 4}>{`T${ti + 1}`}</text>

        <text className="casv-lane-label" x={laneX + 48} y={y + 20}>
          {s.pc === 'idle' ? 'waiting' : s.done ? 'committed' : `pc: ${s.pc}`}
          {s.retries > 0 ? `   ·   retries: ${s.retries}` : ''}
        </text>

        {/* register readouts: read old / computed new / last CAS */}
        <g>
          <text className="casv-reg-k" x={laneX + 48} y={y + 46}>old</text>
          <text className="casv-reg-v" x={laneX + 88} y={y + 46}>{s.read == null ? '—' : s.read}</text>

          <text className="casv-reg-k" x={laneX + 150} y={y + 46}>new</text>
          <text className="casv-reg-v" x={laneX + 192} y={y + 46}>{s.next == null ? '—' : s.next}</text>

          <text className="casv-reg-k" x={laneX + 264} y={y + 46}>CAS</text>
          <text
            className={`casv-reg-cas ${s.casResult === 'OK' ? 'is-ok' : s.casResult === 'FAIL' ? 'is-fail' : ''}`}
            x={laneX + 308}
            y={y + 46}
          >
            {s.casResult == null ? '—' : s.casResult}
          </text>
        </g>

        {/* the CAS expression, shown while this thread is mid-CAS */}
        {active && current.kind === 'cas' && (
          <text
            className={`casv-cas-expr ${current.casOk ? 'is-ok' : 'is-fail'}`}
            x={laneX + laneW - 14}
            y={y + 46}
          >
            {`CAS(exp ${s.read}, new ${s.next}) · mem ${current.mem} · ${current.casOk ? 'SWAP' : 'RETRY'}`}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="casv">
      <div className="casv-head">
        <h3 className="casv-title">Compare-and-swap — lock-free atomic increment</h3>
        <p className="casv-sub">
          Two threads race to add 1 to one shared cell using a CAS retry loop. Step the interleaving to watch a
          CAS fail when another thread wins, then retry on the fresh value — and confirm no update is ever lost.
        </p>
      </div>

      <div className="casv-controls">
        <div className="casv-modes" role="tablist" aria-label="Interleaving">
          {PLANS.map((p) => (
            <button
              key={p}
              type="button"
              className={`casv-mode ${planKey === p ? 'is-on' : ''}`}
              onClick={() => switchPlan(p)}
              aria-pressed={planKey === p}
            >
              {p}
            </button>
          ))}
        </div>

        <label className="casv-speed">
          <span className="casv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="casv-speed-range"
            aria-label="Playback speed"
          />
          <span className="casv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="casv-spacer" aria-hidden="true" />

        <div className="casv-buttons">
          <button
            type="button"
            className="casv-btn casv-btn-primary"
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
            className="casv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="casv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="casv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="casv-btn" onClick={() => switchPlan(planKey === PLANS[0] ? PLANS[1] : PLANS[0])}>
            <RefreshCw size={12} /> swap order
          </button>
        </div>
        <div className="casv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="casv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="casv-svg" preserveAspectRatio="xMidYMid meet">
          {/* shared memory cell */}
          <text className="casv-row-label" x={memX} y={34} textAnchor="middle">shared memory cell (atomic)</text>
          <rect
            className={`casv-mem ${current.phase === 'cas-ok' ? 'is-write' : ''} ${current.phase === 'cas-fail' ? 'is-fail' : ''}`}
            x={memX - memW / 2}
            y={memY}
            width={memW}
            height={memH}
            rx={12}
          />
          <text className="casv-mem-val" x={memX} y={memY + memH / 2 + 13}>{current.mem}</text>
          <text className="casv-mem-cap" x={memX} y={memY + memH + 18} textAnchor="middle">
            base {INIT_VALUE} · +{current.success} committed
          </text>

          {laneY.map((_, i) => lane(i))}
        </svg>
      </div>

      <div className="casv-metrics">
        <div className="casv-metric">
          <span className="casv-metric-label">shared value</span>
          <span className="casv-metric-value">{current.mem}</span>
        </div>
        <div className="casv-metric">
          <span className="casv-metric-label">commits</span>
          <span className="casv-metric-value is-ok">{current.success}</span>
        </div>
        <div className="casv-metric">
          <span className="casv-metric-label">T1 retries</span>
          <span className="casv-metric-value">{current.th[0].retries}</span>
        </div>
        <div className="casv-metric">
          <span className="casv-metric-label">T2 retries</span>
          <span className="casv-metric-value">{current.th[1].retries}</span>
        </div>
        <div className="casv-metric casv-metric-dim">
          <span className="casv-metric-label">invariant</span>
          <span className="casv-metric-value casv-metric-dimval">
            {current.mem === INIT_VALUE + current.success ? 'no lost update' : '—'}
          </span>
        </div>
      </div>

      <div className="casv-narration">
        <span className="casv-narration-label">trace</span>
        <span className="casv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
