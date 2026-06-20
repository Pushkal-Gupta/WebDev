import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Lock, Users, Cpu } from 'lucide-react';
import './SemaphoreMutexViz.css';

// Mutex vs Semaphore: N worker threads contend for a synchronisation primitive.
//
//   A MUTEX has exactly 1 permit  -> at most one thread is ever inside the
//   critical section. A SEMAPHORE with k permits lets up to k threads in at once.
//
//   Each thread cycles:  idle -> acquire (or block in the WAIT QUEUE) ->
//   critical section (does WORK for a fixed number of ticks) -> release the
//   permit (handed to the head of the FIFO wait queue) -> done.
//
// Durations are deterministic per thread (a tiny seeded generator), so the trace
// is identical every run — no Math.random anywhere.

const N_THREADS = 5;

// Deterministic per-thread work length (ticks spent inside the critical section).
// Seeded so the animation is stable; values land in [2, 4].
function workTicks(i) {
  const h = (i * 2654435761) % 4294967296;
  return 2 + (h % 3);
}

const STATE = {
  IDLE: 'idle',
  QUEUED: 'queued',
  CRITICAL: 'critical',
  DONE: 'done',
};

// Build the immutable frame trace for the scenario.
//   mode: 'mutex' | 'semaphore'
//   k:    permit count (clamped to 1 for mutex, 1..nThreads for semaphore)
//   nThreads: number of contending threads
function buildFrames(mode, k, nThreads) {
  const permits = mode === 'mutex' ? 1 : Math.max(1, Math.min(k, nThreads));
  const total = permits;

  const threads = Array.from({ length: nThreads }, (_, i) => ({
    id: `T${i + 1}`,
    idx: i,
    state: STATE.IDLE,
    remaining: workTicks(i),
  }));

  const queue = [];      // ids waiting (FIFO)
  const inside = [];     // ids currently in the critical section
  let free = total;      // free permits
  const frames = [];

  const snap = (extra) => ({
    mode,
    permits: total,
    free,
    inside: [...inside],
    queue: [...queue],
    threads: threads.map((t) => ({ ...t })),
    active: null,
    phase: 'run',
    note: '',
    ...extra,
  });

  const modeWord = mode === 'mutex' ? 'mutex' : `semaphore (k=${total})`;

  frames.push(snap({
    phase: 'init',
    note: `${nThreads} threads want the critical section, guarded by a ${modeWord}. The permit pool starts with ${total} free permit${total === 1 ? '' : 's'}. A thread must take a permit to enter; if none are free it blocks in the FIFO wait queue. ${
      mode === 'mutex'
        ? 'A mutex is a binary lock: exactly one thread inside at any instant.'
        : `A counting semaphore allows up to ${total} threads inside at once.`
    }`,
  }));

  // Every thread tries to acquire, in id order. Those that get a permit enter;
  // the rest queue. This models the initial burst of contention.
  for (const t of threads) {
    if (free > 0) {
      free -= 1;
      t.state = STATE.CRITICAL;
      inside.push(t.id);
      frames.push(snap({
        phase: 'acquire',
        active: t.id,
        note: `${t.id} calls acquire(). A permit is free (${free + 1} -> ${free}), so ${t.id} takes it and enters the critical section. Inside now: [${inside.join(', ')}].`,
      }));
    } else {
      t.state = STATE.QUEUED;
      queue.push(t.id);
      frames.push(snap({
        phase: 'block',
        active: t.id,
        note: `${t.id} calls acquire() but 0 permits are free. ${t.id} BLOCKS and joins the back of the wait queue: [${queue.join(', ')}]. It will be woken when a permit is released.`,
      }));
    }
  }

  // Now run until every thread is done: each tick, threads inside do one unit of
  // work; when a thread finishes it releases its permit, which wakes the queue head.
  const byId = (id) => threads.find((t) => t.id === id);

  let guard = 0;
  while (inside.length > 0 && guard < 200) {
    guard += 1;

    // Pick the thread inside that is closest to finishing (smallest remaining),
    // tie-break by id order — fully deterministic.
    inside.sort((a, b) => {
      const ra = byId(a).remaining;
      const rb = byId(b).remaining;
      if (ra !== rb) return ra - rb;
      return byId(a).idx - byId(b).idx;
    });

    const headId = inside[0];
    const head = byId(headId);
    head.remaining -= 1;

    if (head.remaining > 0) {
      frames.push(snap({
        phase: 'work',
        active: headId,
        note: `${headId} does one unit of work in the critical section (${head.remaining} tick${head.remaining === 1 ? '' : 's'} left). Permits held by threads inside are NOT released until each finishes.`,
      }));
      continue;
    }

    // head finished -> release permit.
    head.state = STATE.DONE;
    const idx = inside.indexOf(headId);
    if (idx >= 0) inside.splice(idx, 1);
    free += 1;
    frames.push(snap({
      phase: 'release',
      active: headId,
      note: `${headId} finishes its work and calls release(). The permit returns to the pool (${free - 1} -> ${free}). ${headId} is done. Inside now: [${inside.join(', ') || 'empty'}].`,
    }));

    // wake the FIFO head if anyone is waiting.
    if (queue.length > 0 && free > 0) {
      const nextId = queue.shift();
      const next = byId(nextId);
      free -= 1;
      next.state = STATE.CRITICAL;
      inside.push(nextId);
      frames.push(snap({
        phase: 'wake',
        active: nextId,
        note: `A free permit wakes the head of the FIFO queue. ${nextId} is dequeued, takes the permit (${free + 1} -> ${free}), and enters the critical section. Queue now: [${queue.join(', ') || 'empty'}].`,
      }));
    }
  }

  frames.push(snap({
    phase: 'done',
    note: `All ${nThreads} threads have passed through. ${
      mode === 'mutex'
        ? 'With a mutex (1 permit) only one thread was ever inside — perfect mutual exclusion, but throughput is serialised.'
        : `With ${total} permits, up to ${total} threads ran concurrently — more throughput, at the cost of allowing ${total} simultaneous accesses (the resource itself must tolerate that).`
    } The queue drained in FIFO order, so no thread starved.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

const STATE_TONE = {
  [STATE.IDLE]: 'idle',
  [STATE.QUEUED]: 'queued',
  [STATE.CRITICAL]: 'critical',
  [STATE.DONE]: 'done',
};

export default function SemaphoreMutexViz() {
  const [mode, setMode] = useState('semaphore');
  const [k, setK] = useState(2);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const nThreads = N_THREADS;
  const effectiveK = mode === 'mutex' ? 1 : Math.max(1, Math.min(k, nThreads));

  const frames = useMemo(
    () => buildFrames(mode, effectiveK, nThreads),
    [mode, effectiveK, nThreads],
  );
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

  const changeMode = (next) => {
    setIsRunning(false);
    setStep(0);
    setMode(next);
  };

  const changeK = (next) => {
    setIsRunning(false);
    setStep(0);
    setK(next);
  };

  // SVG geometry
  const W = 940;
  const H = 440;

  // thread node lane (top)
  const laneTop = 64;
  const nodeR = 26;
  const laneGap = (W - 80) / nThreads;
  const nodeX = (i) => 40 + laneGap * i + laneGap / 2;
  const nodeY = laneTop + nodeR + 10;

  // permit pool box (left lower)
  const poolX = 40;
  const poolY = 200;
  const poolW = 250;
  const poolH = 150;

  // critical section box (center lower)
  const csX = poolX + poolW + 26;
  const csW = 330;
  const csY = poolY;
  const csH = poolH;

  // wait queue lane (right lower)
  const wqX = csX + csW + 26;
  const wqW = W - 40 - wqX;
  const wqY = poolY;
  const wqH = poolH;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // permit slot positions inside pool
  const permitSlots = Array.from({ length: current.permits }, (_, i) => i);
  const slotPerRow = Math.min(current.permits, 5);
  const slotGapX = (poolW - 36) / slotPerRow;
  const permitFreeCount = current.free;

  const csCount = current.inside.length;
  const queuedCount = current.queue.length;

  return (
    <div className="smv">
      <div className="smv-head">
        <h3 className="smv-title">Mutex vs semaphore — permits, the critical section, and the wait queue</h3>
        <p className="smv-sub">
          A mutex hands out one permit (one thread inside, ever); a counting semaphore with k permits lets up to k
          threads in at once — drag k and watch concurrency change.
        </p>
      </div>

      <div className="smv-controls">
        <div className="smv-modeset" role="group" aria-label="Primitive mode">
          <button
            type="button"
            className={`smv-mode ${mode === 'mutex' ? 'is-on' : ''}`}
            onClick={() => changeMode('mutex')}
            aria-pressed={mode === 'mutex'}
          >
            <Lock size={13} /> Mutex
          </button>
          <button
            type="button"
            className={`smv-mode ${mode === 'semaphore' ? 'is-on' : ''}`}
            onClick={() => changeMode('semaphore')}
            aria-pressed={mode === 'semaphore'}
          >
            <Users size={13} /> Semaphore
          </button>
        </div>

        <label className={`smv-kctl ${mode === 'mutex' ? 'is-disabled' : ''}`}>
          <span className="smv-input-label">permits k</span>
          <input
            type="range"
            min={1}
            max={nThreads}
            step={1}
            value={effectiveK}
            onChange={(e) => changeK(Number(e.target.value))}
            className="smv-k-range"
            disabled={mode === 'mutex'}
            aria-label="Semaphore permit count"
          />
          <span className="smv-k-value">{effectiveK}</span>
        </label>

        <span className="smv-spacer" aria-hidden="true" />

        <label className="smv-speed">
          <span className="smv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="smv-speed-range"
            aria-label="Playback speed"
          />
          <span className="smv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="smv-buttons">
          <button
            type="button"
            className="smv-btn smv-btn-primary"
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
            className="smv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="smv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="smv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="smv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="smv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="smv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="smv-lane-title" x={40} y={36}>threads</text>

          {/* thread nodes */}
          {current.threads.map((t) => {
            const x = nodeX(t.idx);
            const tone = STATE_TONE[t.state];
            const isActive = current.active === t.id;
            return (
              <g key={t.id}>
                <circle
                  className={`smv-node is-${tone} ${isActive ? 'is-active' : ''}`}
                  cx={x}
                  cy={nodeY}
                  r={nodeR}
                />
                <g transform={`translate(${x - 8}, ${nodeY - 16})`}>
                  <Cpu width={16} height={16} className="smv-ic" />
                </g>
                <text className="smv-node-label" x={x} y={nodeY + 6}>{t.id}</text>
                <text className={`smv-node-state is-${tone}`} x={x} y={nodeY + nodeR + 16}>{t.state}</text>
              </g>
            );
          })}

          {/* permit pool */}
          <rect className="smv-box" x={poolX} y={poolY} width={poolW} height={poolH} rx={9} />
          <rect x={poolX} y={poolY} width={poolW} height={5} rx={2.5} fill="var(--hue-mint)" />
          <text className="smv-box-title" x={poolX + 14} y={poolY + 26}>permit pool</text>
          <text className="smv-box-sub" x={poolX + poolW - 14} y={poolY + 26}>
            {permitFreeCount}/{current.permits} free
          </text>
          {permitSlots.map((i) => {
            const row = Math.floor(i / slotPerRow);
            const col = i % slotPerRow;
            const px = poolX + 18 + col * slotGapX + slotGapX / 2 - 16;
            const py = poolY + 46 + row * 44;
            const isFree = i < permitFreeCount;
            return (
              <g key={`permit-${i}`}>
                <rect
                  className={`smv-permit ${isFree ? 'is-free' : 'is-taken'}`}
                  x={px}
                  y={py}
                  width={32}
                  height={32}
                  rx={7}
                />
                <g transform={`translate(${px + 8}, ${py + 8})`}>
                  <Lock width={16} height={16} className={`smv-ic ${isFree ? 'is-free' : 'is-taken'}`} />
                </g>
              </g>
            );
          })}

          {/* critical section */}
          <rect
            className={`smv-box smv-cs ${csCount > 0 ? 'is-occupied' : ''}`}
            x={csX}
            y={csY}
            width={csW}
            height={csH}
            rx={9}
          />
          <rect x={csX} y={csY} width={csW} height={5} rx={2.5} fill="var(--accent)" />
          <text className="smv-box-title" x={csX + 14} y={csY + 26}>critical section</text>
          <text className="smv-box-sub" x={csX + csW - 14} y={csY + 26}>
            {csCount}/{current.permits} inside
          </text>
          {current.inside.length === 0 && (
            <text className="smv-box-empty" x={csX + csW / 2} y={csY + csH / 2 + 14}>empty</text>
          )}
          {current.inside.map((id, ii) => {
            const slot = Math.min(current.permits, 5);
            const gap = (csW - 36) / slot;
            const cx = csX + 18 + ii * gap + gap / 2;
            const cy = csY + 92;
            const tid = id;
            const t = current.threads.find((tt) => tt.id === id);
            const isActive = current.active === id;
            return (
              <g key={`cs-${tid}`}>
                <circle className={`smv-node is-critical ${isActive ? 'is-active' : ''}`} cx={cx} cy={cy} r={22} />
                <text className="smv-node-label" x={cx} y={cy + 5}>{tid}</text>
                <text className="smv-node-state is-critical" x={cx} y={cy + 36}>
                  {t ? `${t.remaining}t left` : ''}
                </text>
              </g>
            );
          })}

          {/* wait queue */}
          <rect className="smv-box" x={wqX} y={wqY} width={wqW} height={wqH} rx={9} />
          <rect x={wqX} y={wqY} width={wqW} height={5} rx={2.5} fill="var(--warning)" />
          <text className="smv-box-title" x={wqX + 14} y={wqY + 26}>wait queue</text>
          <text className="smv-box-sub" x={wqX + wqW - 14} y={wqY + 26}>FIFO</text>
          {current.queue.length === 0 && (
            <text className="smv-box-empty" x={wqX + wqW / 2} y={wqY + wqH / 2 + 14}>empty</text>
          )}
          {current.queue.map((id, qi) => {
            const slotW = (wqW - 30) / nThreads;
            const qx = wqX + 16 + qi * slotW;
            const qy = wqY + 70;
            const isActive = current.active === id;
            return (
              <g key={`wq-${id}`}>
                <rect className={`smv-qitem ${qi === 0 ? 'is-head' : ''} ${isActive ? 'is-active' : ''}`} x={qx} y={qy} width={slotW - 8} height={40} rx={7} />
                <text className="smv-qitem-text" x={qx + (slotW - 8) / 2} y={qy + 25}>{id}</text>
                {qi < current.queue.length - 1 && (
                  <text className="smv-q-arrow" x={qx + slotW - 6} y={qy + 25}>-&gt;</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="smv-metrics">
        <div className="smv-metric">
          <span className="smv-metric-label">mode</span>
          <span className="smv-metric-value">{current.mode === 'mutex' ? 'mutex (k=1)' : `semaphore k=${current.permits}`}</span>
        </div>
        <div className="smv-metric">
          <span className="smv-metric-label">permits free</span>
          <span className="smv-metric-value is-mint">{current.free} / {current.permits}</span>
        </div>
        <div className="smv-metric">
          <span className="smv-metric-label">in critical section</span>
          <span className="smv-metric-value">{csCount}</span>
        </div>
        <div className="smv-metric">
          <span className="smv-metric-label">queued</span>
          <span className="smv-metric-value is-warn">{queuedCount}</span>
        </div>
        <div className="smv-metric">
          <span className="smv-metric-label">phase</span>
          <span className="smv-metric-value">{current.phase}</span>
        </div>
      </div>

      <div className="smv-narration">
        <span className="smv-narration-label">trace</span>
        <span className="smv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
