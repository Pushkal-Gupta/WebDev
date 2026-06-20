import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Minus, Cpu } from 'lucide-react';
import './DataParallelTrainingViz.css';

// Data-parallel training: N workers each hold a full model replica + a distinct data shard.
// One synchronous step:
//   (1) forward  -> each worker computes a local loss on its shard
//   (2) backward -> each worker computes a local gradient
//   (3) all-reduce -> gradients are averaged across ALL workers
//   (4) update   -> every replica applies the SAME averaged gradient (sync barrier)
// After the barrier all replicas hold identical weights again.

const PHASES = ['init', 'forward', 'backward', 'allreduce', 'update', 'done'];

// Seeded deterministic hash (FNV-1a) -> stable per-worker numbers. No Math.random.
function hash(workerIndex, seed, salt) {
  let h = 2166136261 >>> 0;
  const s = `${workerIndex}#${seed}#${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const W0 = 1.0; // shared starting weight on every replica

// Per-worker loss in ~[0.40, 2.40] and local gradient in ~[-1.0, 1.0], stable for a seed.
function workerStats(i, seed) {
  const loss = 0.4 + (hash(i, seed, 'loss') % 2000) / 1000; // 0.40 .. 2.40
  const grad = -1 + (hash(i, seed, 'grad') % 2000) / 1000; // -1.00 .. 1.00
  return { loss: Number(loss.toFixed(2)), grad: Number(grad.toFixed(2)) };
}

function mean(xs) {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

const LR = 0.3; // learning rate for the illustrative weight update

function buildFrames(n, seed) {
  const frames = [];
  const base = Array.from({ length: n }, (_, i) => workerStats(i, seed));
  const avgGrad = Number(mean(base.map((b) => b.grad)).toFixed(3));
  const newW = Number((W0 - LR * avgGrad).toFixed(3));

  // per-worker scratch revealed progressively across phases
  const blank = () => base.map(() => ({ loss: null, grad: null, weight: W0 }));

  const snap = (extra) => ({
    phase: 'init',
    active: [],
    workers: blank(),
    avgGrad: null,
    barrier: 'open',
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    active: [],
    workers: base.map(() => ({ loss: null, grad: null, weight: W0 })),
    avgGrad: null,
    barrier: 'open',
    note: `${n} workers, each holding an identical model replica (weight = ${W0.toFixed(2)}) and a distinct shard of the data. One synchronous step will run: forward, backward, all-reduce, then a synchronized update.`,
  }));

  frames.push(snap({
    phase: 'forward',
    active: base.map((_, i) => i),
    workers: base.map((b) => ({ loss: b.loss, grad: null, weight: W0 })),
    avgGrad: null,
    barrier: 'open',
    note: `Forward pass. Each worker runs its shard through its replica and gets a LOCAL loss — different per worker because the shards differ. Losses: ${base.map((b, i) => `w${i}=${b.loss.toFixed(2)}`).join(', ')}.`,
  }));

  frames.push(snap({
    phase: 'backward',
    active: base.map((_, i) => i),
    workers: base.map((b) => ({ loss: b.loss, grad: b.grad, weight: W0 })),
    avgGrad: null,
    barrier: 'open',
    note: `Backward pass. Each worker backprops its local loss into a LOCAL gradient: ${base.map((b, i) => `g${i}=${b.grad.toFixed(2)}`).join(', ')}. No communication yet — these gradients still disagree.`,
  }));

  const sum = Number(base.map((b) => b.grad).reduce((a, b) => a + b, 0).toFixed(3));
  frames.push(snap({
    phase: 'allreduce',
    active: base.map((_, i) => i),
    workers: base.map((b) => ({ loss: b.loss, grad: b.grad, weight: W0 })),
    avgGrad,
    barrier: 'closed',
    note: `All-reduce. Gradients are summed and divided by N: (${base.map((b) => b.grad.toFixed(2)).join(' + ')}) / ${n} = ${sum.toFixed(3)} / ${n} = ${avgGrad.toFixed(3)}. The barrier is CLOSED — no worker proceeds until every gradient has arrived.`,
  }));

  frames.push(snap({
    phase: 'update',
    active: base.map((_, i) => i),
    workers: base.map((b) => ({ loss: b.loss, grad: b.grad, weight: newW })),
    avgGrad,
    barrier: 'closed',
    note: `Synchronized update. Every replica applies the SAME averaged gradient: w = ${W0.toFixed(2)} − ${LR} × ${avgGrad.toFixed(3)} = ${newW.toFixed(3)}. All replicas move in lockstep, so they stay identical.`,
  }));

  frames.push(snap({
    phase: 'done',
    active: [],
    workers: base.map((b) => ({ loss: b.loss, grad: b.grad, weight: newW })),
    avgGrad,
    barrier: 'open',
    note: `Step complete. The barrier reopens; all ${n} replicas hold the identical updated weight ${newW.toFixed(3)}. Effective batch = N shards, but the model stays a single coherent copy — that is the data-parallel guarantee.`,
  }));

  return frames;
}

const MIN_N = 2;
const MAX_N = 6;
const WORKER_HUES = ['var(--hue-sky)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--medium)', 'var(--easy)'];

const PHASE_LABEL = {
  init: 'idle',
  forward: 'forward pass',
  backward: 'backward pass',
  allreduce: 'all-reduce',
  update: 'sync update',
  done: 'done',
};

export default function DataParallelTrainingViz() {
  const [n, setN] = useState(4);
  const [seed, setSeed] = useState(1);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(n, seed), [n, seed]);
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

  const setWorkers = (delta) => {
    const next = Math.max(MIN_N, Math.min(MAX_N, n + delta));
    if (next === n) return;
    setIsRunning(false);
    setN(next);
    setStep(0);
  };

  const reseed = () => {
    setIsRunning(false);
    setSeed((s) => s + 1);
    setStep(0);
  };

  const colorOf = (i) => WORKER_HUES[i % WORKER_HUES.length];

  // SVG geometry — workers across the top, the all-reduce bus + averaged gradient below.
  const W = 940;
  const H = 430;
  const padX = 36;
  const rowW = W - padX * 2;
  const gap = 14;
  const boxW = (rowW - gap * (n - 1)) / n;
  const boxH = 150;
  const boxY = 56;
  const busY = 268;
  const avgY = 332;
  const avgW = 240;
  const avgX = W / 2 - avgW / 2;

  const phase = current.phase;
  const barrierClosed = current.barrier === 'closed';
  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // worker glyph scales with N so it always fits — never horizontal scroll.
  const fsTag = Math.max(10, Math.min(13, boxW / 7));
  const fsVal = Math.max(11, Math.min(16, boxW / 8));
  const fsKey = Math.max(8, Math.min(10, boxW / 12));

  return (
    <div className="dpt">
      <div className="dpt-head">
        <h3 className="dpt-title">Data-parallel training — replicate, all-reduce, step in lockstep</h3>
        <p className="dpt-sub">
          Each worker holds a full model copy and a different data shard. Step through forward, backward, the
          gradient all-reduce, and the synchronized update that keeps every replica identical.
        </p>
      </div>

      <div className="dpt-controls">
        <div className="dpt-workers">
          <span className="dpt-input-label">workers</span>
          <button type="button" className="dpt-btn dpt-btn-step" onClick={() => setWorkers(-1)} disabled={n <= MIN_N}>
            <Minus size={13} />
          </button>
          <span className="dpt-workers-val"><Cpu size={13} /> {n}</span>
          <button type="button" className="dpt-btn dpt-btn-step" onClick={() => setWorkers(1)} disabled={n >= MAX_N}>
            <Plus size={13} />
          </button>
        </div>

        <label className="dpt-speed">
          <span className="dpt-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dpt-speed-range"
            aria-label="Playback speed"
          />
          <span className="dpt-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="dpt-spacer" aria-hidden="true" />

        <div className="dpt-buttons">
          <button
            type="button"
            className="dpt-btn dpt-btn-primary"
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
            className="dpt-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dpt-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dpt-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="dpt-btn" onClick={reseed}>
            <RotateCcw size={12} /> reshard
          </button>
        </div>
        <div className="dpt-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dpt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dpt-svg" preserveAspectRatio="xMidYMid meet">
          <text className="dpt-row-label" x={padX} y={34}>model replicas · one data shard each</text>

          {current.workers.map((w, i) => {
            const x = padX + i * (boxW + gap);
            const col = colorOf(i);
            const isActive = current.active.includes(i);
            const showLoss = ['forward', 'backward', 'allreduce', 'update', 'done'].includes(phase);
            const showGrad = ['backward', 'allreduce', 'update', 'done'].includes(phase);
            // connector from each worker down to the all-reduce bus during all-reduce
            const cxw = x + boxW / 2;
            return (
              <g key={`w-${i}`}>
                {phase === 'allreduce' && (
                  <line className="dpt-link is-reduce" x1={cxw} y1={boxY + boxH} x2={cxw} y2={busY} style={{ stroke: col }} />
                )}
                {phase === 'update' && (
                  <line className="dpt-link is-update" x1={cxw} y1={busY} x2={cxw} y2={boxY + boxH} />
                )}
                <rect
                  className={`dpt-worker ${isActive ? 'is-active' : ''}`}
                  x={x}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx={10}
                  style={{ stroke: isActive ? col : undefined }}
                />
                <circle cx={x + 16} cy={boxY + 18} r={8} fill={col} />
                <text className="dpt-worker-tag" x={x + 30} y={boxY + 22} style={{ fontSize: fsTag }}>{`w${i}`}</text>
                <text className="dpt-shard" x={x + boxW - 8} y={boxY + 22} style={{ fontSize: fsKey }}>{`shard ${i}`}</text>

                <line className="dpt-divider" x1={x + 10} y1={boxY + 34} x2={x + boxW - 10} y2={boxY + 34} />

                <text className="dpt-key" x={x + 12} y={boxY + 56} style={{ fontSize: fsKey }}>weight</text>
                <text className="dpt-val" x={x + boxW - 12} y={boxY + 57} style={{ fontSize: fsVal }} textAnchor="end">
                  {w.weight.toFixed(2)}
                </text>

                <text className="dpt-key" x={x + 12} y={boxY + 86} style={{ fontSize: fsKey }}>loss</text>
                <text
                  className={`dpt-val ${phase === 'forward' && isActive ? 'is-hot' : ''}`}
                  x={x + boxW - 12}
                  y={boxY + 87}
                  style={{ fontSize: fsVal }}
                  textAnchor="end"
                >
                  {showLoss && w.loss != null ? w.loss.toFixed(2) : '—'}
                </text>

                <text className="dpt-key" x={x + 12} y={boxY + 116} style={{ fontSize: fsKey }}>grad</text>
                <text
                  className={`dpt-val ${phase === 'backward' && isActive ? 'is-hot' : ''}`}
                  x={x + boxW - 12}
                  y={boxY + 117}
                  style={{ fontSize: fsVal }}
                  textAnchor="end"
                >
                  {showGrad && w.grad != null ? w.grad.toFixed(2) : '—'}
                </text>
              </g>
            );
          })}

          {/* all-reduce bus */}
          <line
            className={`dpt-bus ${phase === 'allreduce' ? 'is-on' : ''}`}
            x1={padX}
            y1={busY}
            x2={W - padX}
            y2={busY}
          />
          <text className="dpt-bus-label" x={padX} y={busY - 8}>
            all-reduce bus
          </text>

          {/* sync barrier indicator */}
          <g>
            <rect
              className={`dpt-barrier ${barrierClosed ? 'is-closed' : ''}`}
              x={W - padX - 150}
              y={busY - 26}
              width={150}
              height={20}
              rx={5}
            />
            <text className="dpt-barrier-text" x={W - padX - 75} y={busY - 11}>
              {`barrier: ${barrierClosed ? 'CLOSED' : 'open'}`}
            </text>
          </g>

          {/* averaged gradient box */}
          <rect
            className={`dpt-avg ${current.avgGrad != null ? 'is-on' : ''}`}
            x={avgX}
            y={avgY}
            width={avgW}
            height={64}
            rx={10}
          />
          <text className="dpt-avg-label" x={W / 2} y={avgY + 22}>averaged gradient</text>
          <text className="dpt-avg-val" x={W / 2} y={avgY + 50}>
            {current.avgGrad != null ? current.avgGrad.toFixed(3) : '—'}
          </text>
        </svg>
      </div>

      <div className="dpt-metrics">
        <div className="dpt-metric">
          <span className="dpt-metric-label">workers</span>
          <span className="dpt-metric-value">{n}</span>
        </div>
        <div className="dpt-metric">
          <span className="dpt-metric-label">phase</span>
          <span className="dpt-metric-value">{PHASE_LABEL[phase]}</span>
        </div>
        <div className="dpt-metric">
          <span className="dpt-metric-label">avg gradient</span>
          <span className="dpt-metric-value">{current.avgGrad != null ? current.avgGrad.toFixed(3) : '—'}</span>
        </div>
        <div className="dpt-metric">
          <span className="dpt-metric-label">barrier</span>
          <span className={`dpt-metric-value ${barrierClosed ? 'is-closed' : 'is-ok'}`}>
            {barrierClosed ? 'closed' : 'open'}
          </span>
        </div>
        <div className="dpt-metric dpt-metric-dim">
          <span className="dpt-metric-label">replicas synced</span>
          <span className="dpt-metric-value dpt-metric-dimval">
            {phase === 'done' || phase === 'init' ? 'identical' : '—'}
          </span>
        </div>
      </div>

      <div className="dpt-narration">
        <span className="dpt-narration-label">trace</span>
        <span className="dpt-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
