import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Lock, Unlock, ArrowRight, Box } from 'lucide-react';
import './ProducerConsumerViz.css';

// Bounded-buffer producer/consumer under PESSIMISTIC LOCKING.
//
// A shared queue of K slots is the contended resource. Access is serialized by a
// mutex (only one actor may touch the buffer at a time) and two counting semaphores:
//   empty  = number of free slots   (a producer waits on it; full buffer -> blocks)
//   full   = number of filled slots (a consumer waits on it; empty buffer -> blocks)
//
// Producer:  wait(empty); lock(mutex); insert; unlock(mutex); signal(full)
// Consumer:  wait(full);  lock(mutex); remove; unlock(mutex); signal(empty)
//
// Lock-then-mutate is the whole point: every read/write of the shared buffer happens
// behind the mutex, so concurrent access is forced to take turns (pessimistic = assume
// conflict, serialize up front). When a guard semaphore is zero the actor BLOCKS rather
// than corrupting the structure.

// Deterministic, seeded interleaving — no Math.random in render or build.
// A linear congruential generator gives a repeatable schedule keyed by rates.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Build the immutable frame trace.
// bufSize     : number of slots K in the bounded buffer.
// producerRate: relative scheduling weight for the producer (1..5).
// consumerRate: relative scheduling weight for the consumer (1..5).
function buildFrames(bufSize, producerRate, consumerRate) {
  const frames = [];
  const buffer = new Array(bufSize).fill(null); // each cell: null or an item id
  let head = 0; // next remove index (FIFO)
  let tail = 0; // next insert index
  let count = 0; // filled slots
  let produced = 0;
  let consumed = 0;
  let nextId = 1;

  const state = {
    producer: 'idle', // idle | acquiring | inserting | blocked-full | signalling
    consumer: 'idle', // idle | acquiring | removing | blocked-empty | signalling
  };
  let holder = null; // 'producer' | 'consumer' | null  — who holds the mutex

  const snap = (extra) => ({
    buffer: buffer.map((c) => c),
    head,
    tail,
    count,
    produced,
    consumed,
    producer: state.producer,
    consumer: state.consumer,
    holder,
    flow: null, // 'in' | 'out' | null  — arrow to animate
    phase: 'run',
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `A bounded buffer of ${bufSize} slot${bufSize === 1 ? '' : 's'} is the shared resource. The producer fills it; the consumer drains it. A mutex serializes every touch of the buffer, and two counting semaphores (empty, full) make an actor BLOCK instead of corrupting a full or empty buffer. Watch lock-then-mutate take turns.`,
  }));

  // Seeded schedule: pick producer or consumer each tick, weighted by the rates.
  const rand = lcg((bufSize * 131 + producerRate * 17 + consumerRate * 7) | 0);
  const pWeight = producerRate / (producerRate + consumerRate);
  const STEPS = 26;

  for (let t = 0; t < STEPS; t += 1) {
    const wantProducer = rand() < pWeight;

    if (wantProducer) {
      // Producer path: wait(empty) -> lock(mutex) -> insert -> unlock -> signal(full)
      if (count >= bufSize) {
        state.producer = 'blocked-full';
        frames.push(snap({
          phase: 'block',
          note: `Producer calls wait(empty), but empty = 0 — the buffer is FULL (${count}/${bufSize}). It cannot acquire the mutex or insert. The producer BLOCKS until a consumer frees a slot. This back-pressure is exactly what pessimistic locking buys: no overwrite of live data.`,
        }));
        continue;
      }
      if (holder !== null) {
        state.producer = 'acquiring';
        frames.push(snap({
          phase: 'wait',
          note: `Producer passed wait(empty) (a free slot exists) and now needs lock(mutex), but the ${holder} holds it. Only one actor may touch the buffer at a time, so the producer waits for the mutex.`,
        }));
        continue;
      }
      // acquire mutex
      holder = 'producer';
      state.producer = 'acquiring';
      state.consumer = state.consumer === 'blocked-empty' ? 'blocked-empty' : 'idle';
      frames.push(snap({
        phase: 'lock',
        note: `Producer takes the mutex (lock-then-mutate). It now has exclusive access to the buffer — no consumer can read or write while it holds the lock.`,
      }));
      // insert
      const id = nextId;
      nextId += 1;
      buffer[tail] = id;
      tail = (tail + 1) % bufSize;
      count += 1;
      produced += 1;
      state.producer = 'inserting';
      frames.push(snap({
        phase: 'insert',
        flow: 'in',
        note: `Producer writes item #${id} into the buffer (now ${count}/${bufSize}). Because it holds the mutex, this write is serialized — guaranteed conflict-free.`,
      }));
      // unlock + signal(full)
      holder = null;
      state.producer = 'signalling';
      frames.push(snap({
        phase: 'unlock',
        note: `Producer releases the mutex and signals full (a filled slot is ready). If a consumer was blocked on an empty buffer, it can now wake up. The producer goes idle.`,
      }));
      state.producer = 'idle';
      // a blocked consumer can now wake
      if (state.consumer === 'blocked-empty' && count > 0) {
        state.consumer = 'idle';
      }
    } else {
      // Consumer path: wait(full) -> lock(mutex) -> remove -> unlock -> signal(empty)
      if (count <= 0) {
        state.consumer = 'blocked-empty';
        frames.push(snap({
          phase: 'block',
          note: `Consumer calls wait(full), but full = 0 — the buffer is EMPTY. There is nothing to take, so the consumer BLOCKS until a producer adds an item. No spinning, no reading garbage from an empty slot.`,
        }));
        continue;
      }
      if (holder !== null) {
        state.consumer = 'acquiring';
        frames.push(snap({
          phase: 'wait',
          note: `Consumer passed wait(full) (an item exists) and now needs lock(mutex), but the ${holder} holds it. The consumer waits its turn — access is strictly serialized.`,
        }));
        continue;
      }
      holder = 'consumer';
      state.consumer = 'acquiring';
      state.producer = state.producer === 'blocked-full' ? 'blocked-full' : 'idle';
      frames.push(snap({
        phase: 'lock',
        note: `Consumer takes the mutex. It now has exclusive access — the producer cannot touch the buffer until this lock is released.`,
      }));
      const id = buffer[head];
      buffer[head] = null;
      head = (head + 1) % bufSize;
      count -= 1;
      consumed += 1;
      state.consumer = 'removing';
      frames.push(snap({
        phase: 'remove',
        flow: 'out',
        note: `Consumer reads and removes item #${id} (FIFO) — buffer now ${count}/${bufSize}. Serialized by the mutex, so it never races a producer mid-write.`,
      }));
      holder = null;
      state.consumer = 'signalling';
      frames.push(snap({
        phase: 'unlock',
        note: `Consumer releases the mutex and signals empty (a slot is free). A producer blocked on a full buffer can now proceed. The consumer goes idle.`,
      }));
      state.consumer = 'idle';
      if (state.producer === 'blocked-full' && count < bufSize) {
        state.producer = 'idle';
      }
    }
  }

  frames.push(snap({
    phase: 'done',
    note: `Run complete: ${produced} produced, ${consumed} consumed. Every insert and remove happened behind the mutex, and the empty/full semaphores forced an actor to block whenever the buffer hit a boundary. That is pessimistic locking — assume conflict, serialize access, never let two actors mutate the shared structure at once.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function ProducerConsumerViz() {
  const [bufSize, setBufSize] = useState(5);
  const [producerRate, setProducerRate] = useState(3);
  const [consumerRate, setConsumerRate] = useState(2);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => buildFrames(bufSize, producerRate, consumerRate),
    [bufSize, producerRate, consumerRate],
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

  const changeBuf = (v) => {
    setIsRunning(false);
    setStep(0);
    setBufSize(v);
  };
  const changeProducer = (v) => {
    setIsRunning(false);
    setStep(0);
    setProducerRate(v);
  };
  const changeConsumer = (v) => {
    setIsRunning(false);
    setStep(0);
    setConsumerRate(v);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 920;
  const H = 360;
  const actorW = 150;
  const actorH = 96;
  const prodX = 24;
  const consX = W - 24 - actorW;
  const actorY = 132;

  const K = current.buffer.length;
  const cellGap = 8;
  const bufAreaW = consX - (prodX + actorW) - 80;
  const cellW = Math.min(58, (bufAreaW - (K - 1) * cellGap) / K);
  const cellH = 52;
  const bufTotalW = K * cellW + (K - 1) * cellGap;
  const bufStartX = (prodX + actorW) + 40 + ((bufAreaW + 0) - bufTotalW) / 2;
  const bufY = 150;

  const mutexX = W / 2;
  const mutexY = 70;

  const producerBlocked = current.producer === 'blocked-full';
  const consumerBlocked = current.consumer === 'blocked-empty';
  const producerActive = current.holder === 'producer';
  const consumerActive = current.holder === 'consumer';

  const blockedList = [];
  if (producerBlocked) blockedList.push('producer (buffer full)');
  if (consumerBlocked) blockedList.push('consumer (buffer empty)');

  const stateClass = (s, blocked) => (blocked ? 'is-blocked' : (s === 'idle' || s === 'signalling' ? '' : 'is-busy'));

  return (
    <div className="pcv">
      <div className="pcv-head">
        <h3 className="pcv-title">Pessimistic locking — the bounded-buffer producer/consumer</h3>
        <p className="pcv-sub">
          One mutex plus two counting semaphores force every actor to lock-then-mutate the shared queue, blocking on a full or empty buffer instead of racing.
        </p>
      </div>

      <div className="pcv-controls">
        <div className="pcv-buttons">
          <button
            type="button"
            className="pcv-btn pcv-btn-primary"
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
            className="pcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="pcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="pcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <span className="pcv-spacer" aria-hidden="true" />

        <label className="pcv-slider">
          <span className="pcv-input-label">buffer K</span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={bufSize}
            onChange={(e) => changeBuf(Number(e.target.value))}
            className="pcv-range"
            aria-label="Buffer size"
          />
          <span className="pcv-slider-value">{bufSize}</span>
        </label>

        <label className="pcv-slider">
          <span className="pcv-input-label">producer</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={producerRate}
            onChange={(e) => changeProducer(Number(e.target.value))}
            className="pcv-range"
            aria-label="Producer rate"
          />
          <span className="pcv-slider-value">{producerRate}</span>
        </label>

        <label className="pcv-slider">
          <span className="pcv-input-label">consumer</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={consumerRate}
            onChange={(e) => changeConsumer(Number(e.target.value))}
            className="pcv-range"
            aria-label="Consumer rate"
          />
          <span className="pcv-slider-value">{consumerRate}</span>
        </label>

        <label className="pcv-slider">
          <span className="pcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pcv-range"
            aria-label="Playback speed"
          />
          <span className="pcv-slider-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="pcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="pcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="pcv-arrow-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pcv-ah-in" />
            </marker>
            <marker id="pcv-arrow-out" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pcv-ah-out" />
            </marker>
          </defs>

          {/* mutex indicator */}
          <g transform={`translate(${mutexX - 70}, ${mutexY - 24})`}>
            <rect
              className={`pcv-mutex ${current.holder ? 'is-locked' : ''}`}
              x={0}
              y={0}
              width={140}
              height={44}
              rx={10}
            />
            <g transform="translate(12, 11)">
              {current.holder
                ? <Lock width={20} height={20} className="pcv-ic is-locked" />
                : <Unlock width={20} height={20} className="pcv-ic" />}
            </g>
            <text className="pcv-mutex-title" x={42} y={19}>mutex</text>
            <text className={`pcv-mutex-state ${current.holder ? 'is-locked' : ''}`} x={42} y={34}>
              {current.holder ? `held · ${current.holder}` : 'free'}
            </text>
          </g>

          {/* mutex tethers to whoever holds it */}
          <line
            className={`pcv-tether ${producerActive ? 'is-on' : ''}`}
            x1={mutexX - 70}
            y1={mutexY}
            x2={prodX + actorW / 2}
            y2={actorY}
          />
          <line
            className={`pcv-tether ${consumerActive ? 'is-on' : ''}`}
            x1={mutexX + 70}
            y1={mutexY}
            x2={consX + actorW / 2}
            y2={actorY}
          />

          {/* producer actor */}
          <g>
            <rect
              className={`pcv-actor ${stateClass(current.producer, producerBlocked)} ${producerActive ? 'is-holder' : ''}`}
              x={prodX}
              y={actorY}
              width={actorW}
              height={actorH}
              rx={10}
            />
            <text className="pcv-actor-title" x={prodX + actorW / 2} y={actorY + 26}>Producer</text>
            <text className={`pcv-actor-state ${producerBlocked ? 'is-blocked' : ''}`} x={prodX + actorW / 2} y={actorY + 50}>
              {current.producer}
            </text>
            <text className="pcv-actor-sub" x={prodX + actorW / 2} y={actorY + 72}>
              wait(empty)·lock·insert
            </text>
          </g>

          {/* consumer actor */}
          <g>
            <rect
              className={`pcv-actor ${stateClass(current.consumer, consumerBlocked)} ${consumerActive ? 'is-holder' : ''}`}
              x={consX}
              y={actorY}
              width={actorW}
              height={actorH}
              rx={10}
            />
            <text className="pcv-actor-title" x={consX + actorW / 2} y={actorY + 26}>Consumer</text>
            <text className={`pcv-actor-state ${consumerBlocked ? 'is-blocked' : ''}`} x={consX + actorW / 2} y={actorY + 50}>
              {current.consumer}
            </text>
            <text className="pcv-actor-sub" x={consX + actorW / 2} y={actorY + 72}>
              wait(full)·lock·remove
            </text>
          </g>

          {/* flow arrows */}
          <line
            className={`pcv-flow ${current.flow === 'in' ? 'is-on' : ''}`}
            x1={prodX + actorW + 6}
            y1={bufY + cellH / 2}
            x2={bufStartX - 8}
            y2={bufY + cellH / 2}
            markerEnd="url(#pcv-arrow-in)"
          />
          <line
            className={`pcv-flow is-out-flow ${current.flow === 'out' ? 'is-on' : ''}`}
            x1={bufStartX + bufTotalW + 8}
            y1={bufY + cellH / 2}
            x2={consX - 6}
            y2={bufY + cellH / 2}
            markerEnd="url(#pcv-arrow-out)"
          />

          {/* bounded buffer label */}
          <text className="pcv-buf-label" x={bufStartX + bufTotalW / 2} y={bufY - 14}>
            bounded buffer · {current.count}/{K} filled
          </text>

          {/* buffer cells */}
          {current.buffer.map((cell, i) => {
            const x = bufStartX + i * (cellW + cellGap);
            const isHead = i === current.head && current.count > 0;
            const isTail = i === current.tail && current.count < K;
            return (
              <g key={`cell-${i}`}>
                <rect
                  className={`pcv-cell ${cell != null ? 'is-filled' : ''}`}
                  x={x}
                  y={bufY}
                  width={cellW}
                  height={cellH}
                  rx={7}
                />
                {cell != null
                  ? <text className="pcv-cell-text" x={x + cellW / 2} y={bufY + cellH / 2 + 5}>#{cell}</text>
                  : (
                    <g transform={`translate(${x + cellW / 2 - 9}, ${bufY + cellH / 2 - 9})`}>
                      <Box width={18} height={18} className="pcv-ic-empty" />
                    </g>
                  )}
                {isHead && (
                  <text className="pcv-cell-tag is-head" x={x + cellW / 2} y={bufY + cellH + 15}>head</text>
                )}
                {isTail && !isHead && (
                  <text className="pcv-cell-tag" x={x + cellW / 2} y={bufY + cellH + 15}>tail</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pcv-metrics">
        <div className="pcv-metric">
          <span className="pcv-metric-label">occupancy</span>
          <span className="pcv-metric-value">{current.count}/{K}</span>
        </div>
        <div className="pcv-metric">
          <span className="pcv-metric-label">produced</span>
          <span className="pcv-metric-value is-in">{current.produced}</span>
        </div>
        <div className="pcv-metric">
          <span className="pcv-metric-label">consumed</span>
          <span className="pcv-metric-value is-out">{current.consumed}</span>
        </div>
        <div className="pcv-metric">
          <span className="pcv-metric-label">mutex holder</span>
          <span className="pcv-metric-value">{current.holder || 'free'}</span>
        </div>
        <div className="pcv-metric pcv-metric-wide">
          <span className="pcv-metric-label">blocked</span>
          <span className={`pcv-metric-value ${blockedList.length ? 'is-blocked' : 'is-ok'}`}>
            {blockedList.length ? blockedList.join(' · ') : 'none'}
          </span>
        </div>
      </div>

      <div className={`pcv-narration ${current.phase === 'block' ? 'is-blocked' : current.phase === 'done' ? 'is-done' : ''}`}>
        <span className="pcv-narration-label">
          {current.phase === 'block' ? 'blocked' : current.phase === 'done' ? 'done' : (
            <span className="pcv-narration-icon"><ArrowRight width={11} height={11} /> trace</span>
          )}
        </span>
        <span className="pcv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
