import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './AcidTransactionViz.css';

const MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'crash', label: 'Crash mid-txn' },
  { id: 'concurrent', label: 'Concurrent reader' },
  { id: 'power', label: 'Power loss after commit' },
];

const START_A = 500;
const START_B = 200;
const AMOUNT = 120;

function buildFrames(mode) {
  const frames = [];
  const initA = START_A;
  const initB = START_B;

  const snap = (extra) => ({
    op: '',
    balA: initA,
    balB: initB,
    durableA: initA,
    durableB: initB,
    state: 'idle',
    acid: [],
    readerVal: null,
    readerLabel: null,
    crashed: false,
    powerLoss: false,
    note: '',
    ...extra,
  });

  if (mode === 'normal') {
    frames.push(snap({ op: '—', note: `Before the transfer: account A holds ${initA}, account B holds ${initB}. Both values are durably stored on disk.` }));
    frames.push(snap({ op: 'BEGIN', state: 'active', acid: ['C'], note: 'BEGIN: the transaction starts. From here every change is provisional until COMMIT — the database can still undo all of it.' }));
    frames.push(snap({ op: 'READ A', state: 'active', acid: ['C'], note: `READ A: the engine reads A = ${initA} into the working set. Consistency means it only ever reads a valid committed value.` }));
    frames.push(snap({ op: 'DEBIT A', state: 'active', balA: initA - AMOUNT, acid: ['A', 'C'], note: `DEBIT A: subtract ${AMOUNT}, so A = ${initA - AMOUNT} in the transaction's view. Atomicity keeps this paired with the credit still to come.` }));
    frames.push(snap({ op: 'READ B', state: 'active', balA: initA - AMOUNT, acid: ['C'], note: `READ B: the engine reads B = ${initB}. The debit to A is held but not yet matched by a credit, so the books do not balance mid-flight.` }));
    frames.push(snap({ op: 'CREDIT B', state: 'active', balA: initA - AMOUNT, balB: initB + AMOUNT, acid: ['A', 'C'], note: `CREDIT B: add ${AMOUNT}, so B = ${initB + AMOUNT}. The total ${initA + initB} is conserved again — the invariant holds.` }));
    frames.push(snap({ op: 'COMMIT', state: 'committed', balA: initA - AMOUNT, balB: initB + AMOUNT, durableA: initA - AMOUNT, durableB: initB + AMOUNT, acid: ['A', 'C', 'I', 'D'], note: `COMMIT: both writes land atomically and are flushed to durable storage. A = ${initA - AMOUNT}, B = ${initB + AMOUNT} survive any crash from here on.` }));
    frames.push(snap({ op: 'DONE', state: 'committed', balA: initA - AMOUNT, balB: initB + AMOUNT, durableA: initA - AMOUNT, durableB: initB + AMOUNT, acid: ['A', 'C', 'I', 'D'], note: `Transfer complete. Total preserved (${initA + initB}), all four ACID guarantees exercised: atomic pair, consistent invariant, isolated execution, durable result.` }));
    return frames;
  }

  if (mode === 'crash') {
    frames.push(snap({ op: '—', note: `Before the transfer: A = ${initA}, B = ${initB}, both durable on disk.` }));
    frames.push(snap({ op: 'BEGIN', state: 'active', acid: ['C'], note: 'BEGIN: the transaction starts. Provisional changes accumulate in a redo/undo log, not yet on the durable copy.' }));
    frames.push(snap({ op: 'READ A', state: 'active', acid: ['C'], note: `READ A: A = ${initA} pulled into the working set.` }));
    frames.push(snap({ op: 'DEBIT A', state: 'active', balA: initA - AMOUNT, acid: ['A', 'C'], note: `DEBIT A: A = ${initA - AMOUNT} provisionally. B has not been credited yet — the money is mid-air. This is the dangerous moment.` }));
    frames.push(snap({ op: 'CRASH', state: 'active', balA: initA - AMOUNT, crashed: true, acid: ['A'], note: `CRASH: the process dies after the debit but before CREDIT B. Without atomicity the system would be left short ${AMOUNT} — money vanished.` }));
    frames.push(snap({ op: 'ROLLBACK', state: 'aborted', balA: initA, balB: initB, crashed: true, acid: ['A', 'C'], note: `ROLLBACK on recovery: the undo log reverts the partial debit. A snaps back to ${initA}, B stays ${initB}. Atomicity = all-or-nothing.` }));
    frames.push(snap({ op: 'ABORTED', state: 'aborted', balA: initA, balB: initB, acid: ['A', 'C'], note: `Transaction aborted cleanly. Durable state is exactly the pre-transaction values (${initA}, ${initB}); the invariant total ${initA + initB} never broke for any other observer.` }));
    return frames;
  }

  if (mode === 'concurrent') {
    frames.push(snap({ op: '—', readerVal: initA + initB, readerLabel: 'A+B = ' + (initA + initB), note: `A = ${initA}, B = ${initB}. A second read-only transaction will report the running total A+B = ${initA + initB} throughout.` }));
    frames.push(snap({ op: 'BEGIN', state: 'active', acid: ['C', 'I'], readerVal: initA + initB, readerLabel: 'A+B = ' + (initA + initB), note: 'BEGIN: the writer starts the transfer. The reader opens a snapshot of the last committed state at the same instant.' }));
    frames.push(snap({ op: 'DEBIT A', state: 'active', balA: initA - AMOUNT, acid: ['A', 'I'], readerVal: initA + initB, readerLabel: 'A+B = ' + (initA + initB), note: `DEBIT A: writer sees A = ${initA - AMOUNT}. The reader's snapshot still shows A+B = ${initA + initB} — it cannot see the half-applied debit.` }));
    frames.push(snap({ op: 'CREDIT B', state: 'active', balA: initA - AMOUNT, balB: initB + AMOUNT, acid: ['A', 'I'], readerVal: initA + initB, readerLabel: 'A+B = ' + (initA + initB), note: `CREDIT B: writer's view now A = ${initA - AMOUNT}, B = ${initB + AMOUNT}. The reader is still pinned to its snapshot total ${initA + initB} — isolation hides uncommitted writes.` }));
    frames.push(snap({ op: 'COMMIT', state: 'committed', balA: initA - AMOUNT, balB: initB + AMOUNT, durableA: initA - AMOUNT, durableB: initB + AMOUNT, acid: ['A', 'C', 'I', 'D'], readerVal: initA + initB, readerLabel: 'A+B = ' + (initA + initB), note: `COMMIT: writer's changes become visible. The reader that began earlier still finishes on its consistent snapshot total ${initA + initB} — no dirty or non-repeatable read.` }));
    frames.push(snap({ op: 'DONE', state: 'committed', balA: initA - AMOUNT, balB: initB + AMOUNT, durableA: initA - AMOUNT, durableB: initB + AMOUNT, acid: ['I'], readerVal: initA + initB, readerLabel: 'next reader: ' + (initA + initB), note: `Either way the total never changed (${initA + initB}). Any transaction that starts after the commit reads the new balances; the in-flight reader saw only the old consistent snapshot.` }));
    return frames;
  }

  frames.push(snap({ op: '—', note: `A = ${initA}, B = ${initB}, durable on disk. This run finishes the transfer, then yanks the power.` }));
  frames.push(snap({ op: 'DEBIT A', state: 'active', balA: initA - AMOUNT, acid: ['A'], note: `DEBIT A: A = ${initA - AMOUNT} in the transaction's working set.` }));
  frames.push(snap({ op: 'CREDIT B', state: 'active', balA: initA - AMOUNT, balB: initB + AMOUNT, acid: ['A'], note: `CREDIT B: B = ${initB + AMOUNT}. Both writes staged, total conserved.` }));
  frames.push(snap({ op: 'COMMIT', state: 'committed', balA: initA - AMOUNT, balB: initB + AMOUNT, durableA: initA - AMOUNT, durableB: initB + AMOUNT, acid: ['A', 'C', 'I', 'D'], note: `COMMIT: the write-ahead log is fsync'd to disk before the commit returns. A = ${initA - AMOUNT}, B = ${initB + AMOUNT} are now on durable media.` }));
  frames.push(snap({ op: 'POWER LOSS', state: 'committed', balA: initA - AMOUNT, balB: initB + AMOUNT, durableA: initA - AMOUNT, durableB: initB + AMOUNT, powerLoss: true, acid: ['D'], note: 'POWER LOSS: the machine loses power immediately after the commit. RAM is wiped. Only what reached durable storage matters now.' }));
  frames.push(snap({ op: 'RELOAD', state: 'committed', balA: initA - AMOUNT, balB: initB + AMOUNT, durableA: initA - AMOUNT, durableB: initB + AMOUNT, acid: ['D'], note: `RELOAD: recovery replays the log and reads back A = ${initA - AMOUNT}, B = ${initB + AMOUNT}. Durability means a committed result survives crashes and power loss.` }));
  return frames;
}

const ACID = [
  { letter: 'A', name: 'Atomicity' },
  { letter: 'C', name: 'Consistency' },
  { letter: 'I', name: 'Isolation' },
  { letter: 'D', name: 'Durability' },
];

const STEP_ORDER = ['BEGIN', 'READ A', 'DEBIT A', 'READ B', 'CREDIT B', 'COMMIT'];

export default function AcidTransactionViz() {
  const [mode, setMode] = useState('normal');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode), [mode]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const W = 940;
  const H = 470;

  const total = current.balA + current.balB;
  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const stateClass = current.state === 'committed' ? 'is-committed' : current.state === 'aborted' ? 'is-aborted' : current.state === 'active' ? 'is-active' : '';

  const accBoxW = 230;
  const accBoxH = 110;
  const accAx = 80;
  const accBx = W - 80 - accBoxW;
  const accY = 70;

  const ladderX = 380;
  const ladderTop = 230;
  const rungH = 30;
  const rungGap = 6;

  const acidY = 230;
  const acidCellW = 118;
  const acidGap = 14;
  const acidLeft = W - 80 - (acidCellW * 2 + acidGap);

  return (
    <div className="atx">
      <div className="atx-head">
        <h3 className="atx-title">ACID transactions — a bank transfer, step by step</h3>
        <p className="atx-sub">
          Move {AMOUNT} from A to B one operation at a time and watch atomicity, consistency, isolation, and durability each do their job.
        </p>
      </div>

      <div className="atx-controls">
        <div className="atx-modes" role="tablist" aria-label="Scenario">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`atx-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="atx-speed">
          <span className="atx-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="atx-speed-range"
            aria-label="Playback speed"
          />
          <span className="atx-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="atx-spacer" aria-hidden="true" />

        <div className="atx-buttons">
          <button
            type="button"
            className="atx-btn atx-btn-primary"
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
            className="atx-btn atx-btn-step"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="atx-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="atx-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="atx-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="atx-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="atx-svg" preserveAspectRatio="xMidYMid meet">
          <text x={accAx} y={accY - 14} className="atx-row-label">accounts (transaction view)</text>

          <g>
            <rect className="atx-acc" x={accAx} y={accY} width={accBoxW} height={accBoxH} rx={12} />
            <text className="atx-acc-name" x={accAx + 18} y={accY + 28}>account A</text>
            <text className="atx-acc-bal" x={accAx + accBoxW / 2} y={accY + 74}>{current.balA}</text>
            <text className="atx-acc-durable" x={accAx + 18} y={accY + accBoxH - 12}>on disk: {current.durableA}</text>
          </g>

          <g>
            <rect className="atx-acc" x={accBx} y={accY} width={accBoxW} height={accBoxH} rx={12} />
            <text className="atx-acc-name" x={accBx + 18} y={accY + 28}>account B</text>
            <text className="atx-acc-bal" x={accBx + accBoxW / 2} y={accY + 74}>{current.balB}</text>
            <text className="atx-acc-durable" x={accBx + 18} y={accY + accBoxH - 12}>on disk: {current.durableB}</text>
          </g>

          <g>
            <line className="atx-flow" x1={accAx + accBoxW} y1={accY + accBoxH / 2} x2={accBx} y2={accY + accBoxH / 2} />
            <polygon className="atx-flow-head" points={`${accBx - 2},${accY + accBoxH / 2} ${accBx - 16},${accY + accBoxH / 2 - 7} ${accBx - 16},${accY + accBoxH / 2 + 7}`} />
            <text className="atx-flow-label" x={(accAx + accBoxW + accBx) / 2} y={accY + accBoxH / 2 - 12}>transfer {AMOUNT}</text>
            <text className={`atx-total ${total === START_A + START_B ? 'is-ok' : 'is-broken'}`} x={(accAx + accBoxW + accBx) / 2} y={accY + accBoxH / 2 + 24}>
              A + B = {total}
            </text>
          </g>

          <text x={ladderX} y={ladderTop - 12} className="atx-row-label">operation trace</text>
          {STEP_ORDER.map((label, i) => {
            const y = ladderTop + i * (rungH + rungGap);
            const isCur = current.op === label;
            const past = STEP_ORDER.indexOf(current.op) > i && current.op !== '' && STEP_ORDER.includes(current.op);
            const cls = ['atx-rung', isCur && 'is-cur', past && 'is-past'].filter(Boolean).join(' ');
            return (
              <g key={label}>
                <rect className={cls} x={ladderX} y={y} width={160} height={rungH} rx={6} />
                <text className={`atx-rung-label ${isCur ? 'is-cur' : ''}`} x={ladderX + 14} y={y + rungH / 2 + 4}>{label}</text>
                {isCur && (
                  <path className="atx-rung-ptr" d={`M ${ladderX + 160 - 16} ${y + rungH / 2 - 6} L ${ladderX + 160 - 8} ${y + rungH / 2} L ${ladderX + 160 - 16} ${y + rungH / 2 + 6} Z`} />
                )}
              </g>
            );
          })}

          {(current.op === 'COMMIT' || current.op === 'ROLLBACK' || current.op === 'DONE' || current.op === 'ABORTED' || current.op === 'RELOAD') && (
            <text className={`atx-special ${stateClass}`} x={ladderX + 80} y={ladderTop + STEP_ORDER.length * (rungH + rungGap) + 22}>
              {current.op}
            </text>
          )}

          {(current.crashed || current.powerLoss) && (
            <g transform={`translate(${ladderX + 210}, ${ladderTop + 30})`}>
              <circle className="atx-crash-ring" cx={0} cy={0} r={34} />
              <path className="atx-crash-bolt" d="M 6 -16 L -8 4 L 0 4 L -4 18 L 12 -4 L 2 -4 Z" />
              <text className="atx-crash-label" x={0} y={56}>{current.powerLoss ? 'power loss' : 'crash'}</text>
            </g>
          )}

          {mode === 'concurrent' && (
            <g>
              <rect className="atx-reader" x={ladderX - 250} y={ladderTop + 24} width={210} height={84} rx={10} />
              <text className="atx-reader-name" x={ladderX - 250 + 16} y={ladderTop + 48}>reader txn (snapshot)</text>
              <text className="atx-reader-val" x={ladderX - 250 + 105} y={ladderTop + 84}>{current.readerLabel}</text>
            </g>
          )}

          <text x={acidLeft} y={acidY - 12} className="atx-row-label">guarantees in play</text>
          {ACID.map((g, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = acidLeft + col * (acidCellW + acidGap);
            const y = acidY + row * (66 + 12);
            const on = current.acid.includes(g.letter);
            return (
              <g key={g.letter}>
                <rect className={`atx-acid ${on ? 'is-on' : ''}`} x={x} y={y} width={acidCellW} height={66} rx={10} />
                <text className={`atx-acid-letter ${on ? 'is-on' : ''}`} x={x + 18} y={y + 42}>{g.letter}</text>
                <text className={`atx-acid-name ${on ? 'is-on' : ''}`} x={x + 42} y={y + 30}>{g.name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="atx-metrics">
        <div className="atx-metric">
          <span className="atx-metric-label">balance A</span>
          <span className="atx-metric-value">{current.balA}</span>
        </div>
        <div className="atx-metric">
          <span className="atx-metric-label">balance B</span>
          <span className="atx-metric-value">{current.balB}</span>
        </div>
        <div className="atx-metric">
          <span className="atx-metric-label">total (invariant)</span>
          <span className={`atx-metric-value ${total === START_A + START_B ? 'is-ok' : 'is-broken'}`}>{total}</span>
        </div>
        <div className="atx-metric">
          <span className="atx-metric-label">txn state</span>
          <span className={`atx-metric-value ${stateClass}`}>{current.state}</span>
        </div>
        <div className="atx-metric">
          <span className="atx-metric-label">guarantees</span>
          <span className="atx-metric-value">{current.acid.length ? current.acid.join(' · ') : '—'}</span>
        </div>
      </div>

      <div className="atx-narration">
        <span className="atx-narration-label">trace</span>
        <span className="atx-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
