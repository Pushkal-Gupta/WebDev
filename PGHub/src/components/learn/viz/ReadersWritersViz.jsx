import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, BookOpen, Pencil, Lock } from 'lucide-react';
import './ReadersWritersViz.css';

// Read-Write lock: one writer XOR many readers.
//
//   Many readers may hold the lock CONCURRENTLY (shared mode).
//   A writer needs EXCLUSIVE access: it waits until every reader has left,
//   and while it holds the lock no reader may enter.
//
// Deterministic, seeded arrival schedule (no Math.random in render). Thread ids:
//   readers  R1..Rn   (shared, var(--hue-sky)/var(--easy))
//   writers  W1..Wm   (exclusive, var(--hue-pink)/var(--warning))
//
// policy:
//   'reader'  reader-preference  — readers may keep entering even while a writer waits.
//   'writer'  writer-preference  — once a writer is waiting, no NEW reader is admitted.
//
// Each frame snapshots: active readers (set), writer state, the wait queue, lock mode.

const SEED_EVENTS = [
  { kind: 'reader', tag: 'arrive' },
  { kind: 'reader', tag: 'arrive' },
  { kind: 'writer', tag: 'arrive' },
  { kind: 'reader', tag: 'arrive' },
  { kind: 'reader', tag: 'leave' },
  { kind: 'reader', tag: 'leave' },
  { kind: 'reader', tag: 'leave' },
  { kind: 'writer', tag: 'leave' },
  { kind: 'reader', tag: 'arrive' },
  { kind: 'writer', tag: 'arrive' },
  { kind: 'reader', tag: 'arrive' },
  { kind: 'reader', tag: 'leave' },
  { kind: 'reader', tag: 'leave' },
  { kind: 'writer', tag: 'leave' },
];

function lockMode(activeReaders, writer) {
  if (writer === 'writing') return 'exclusive-write';
  if (activeReaders.length > 0) return 'shared-read';
  return 'free';
}

// Build the immutable frame trace for nReaders readers and nWriters writers,
// under the chosen admission policy. Arrival/leave order is taken from SEED_EVENTS,
// clamped to the available thread pool, so it is fully deterministic.
function buildFrames(nReaders, nWriters, policy) {
  const readerPool = Array.from({ length: nReaders }, (_, i) => `R${i + 1}`);
  const writerPool = Array.from({ length: nWriters }, (_, i) => `W${i + 1}`);

  let active = [];        // reader ids currently reading (shared holders)
  let writer = 'idle';    // 'idle' | 'waiting' | 'writing'
  let holder = null;      // writer id currently writing (or null)
  let queue = [];         // blocked threads, FIFO: { id, kind }

  // round-robin cursors into each pool so reuse stays deterministic.
  let rIdle = [...readerPool];
  let wIdle = [...writerPool];
  let admittedReaders = 0;
  let admittedWrites = 0;

  const frames = [];
  const snap = (extra) => ({
    active: [...active],
    writer,
    holder,
    queue: queue.map((q) => ({ ...q })),
    mode: lockMode(active, writer),
    admittedReaders,
    admittedWrites,
    activeId: null,
    region: null,        // resource | queue
    phase: 'run',
    note: '',
    ...extra,
  });

  const writerWaiting = () => writer === 'waiting' || queue.some((q) => q.kind === 'writer');

  // Try to admit threads from the front of the queue under the current lock state.
  const drainQueue = () => {
    let progressed = true;
    while (progressed && queue.length > 0) {
      progressed = false;
      const head = queue[0];
      if (head.kind === 'writer') {
        // writer can only enter when no readers hold and nobody writes.
        if (active.length === 0 && writer !== 'writing') {
          queue.shift();
          writer = 'writing';
          holder = head.id;
          admittedWrites += 1;
          frames.push(snap({
            phase: 'grant', region: 'resource', activeId: head.id, writer: 'writing',
            note: `${head.id} is at the head of the queue and the resource is empty — it takes the lock in EXCLUSIVE mode. No reader or other writer may enter until it releases.`,
          }));
          progressed = true;
        }
      } else {
        // reader can enter if no writer is writing; writer-preference blocks new
        // readers while a writer is queued ahead, but a reader already at the head
        // (no writer ahead of it) is fine.
        // reader at the FIFO head is admitted unless a writer is actively writing;
        // a writer queued strictly behind it does not block the head reader.
        if (writer !== 'writing') {
          queue.shift();
          active.push(head.id);
          admittedReaders += 1;
          frames.push(snap({
            phase: 'grant', region: 'resource', activeId: head.id, writer,
            note: `${head.id} leaves the queue and enters in SHARED mode. ${active.length} reader${active.length === 1 ? '' : 's'} now hold the lock together.`,
          }));
          progressed = true;
        }
      }
    }
  };

  frames.push(snap({
    phase: 'init',
    note: `A read-write lock guards one shared resource. ${nReaders} reader${nReaders === 1 ? '' : 's'} and ${nWriters} writer${nWriters === 1 ? '' : 's'} contend for it. Readers share the lock; a writer needs it exclusively. Policy: ${policy}-preference — ${policy === 'reader' ? 'readers may keep entering even while a writer waits (writers can starve)' : 'once a writer is waiting, no new reader is admitted (readers wait behind it)'}.`,
  }));

  for (const ev of SEED_EVENTS) {
    if (ev.kind === 'reader' && ev.tag === 'arrive') {
      if (rIdle.length === 0) continue;
      const id = rIdle.shift();
      const blockedByWriting = writer === 'writing';
      const blockedByPolicy = policy === 'writer' && writerWaiting();
      if (blockedByWriting || blockedByPolicy) {
        queue.push({ id, kind: 'reader' });
        frames.push(snap({
          phase: 'block', region: 'queue', activeId: id,
          note: blockedByWriting
            ? `${id} wants to READ, but a writer (${holder}) holds the lock EXCLUSIVELY. Readers cannot share with a writer, so ${id} blocks in the wait queue.`
            : `${id} wants to READ, but a writer is already WAITING and the policy is writer-preference — no new reader may jump ahead of it. ${id} joins the queue so the writer does not starve.`,
        }));
      } else {
        active.push(id);
        admittedReaders += 1;
        frames.push(snap({
          phase: 'enter', region: 'resource', activeId: id,
          note: `${id} acquires the lock in SHARED mode. ${active.length} reader${active.length === 1 ? '' : 's'} now read concurrently — sharing the resource is allowed because no one is writing.`,
        }));
      }
    } else if (ev.kind === 'reader' && ev.tag === 'leave') {
      if (active.length === 0) continue;
      const id = active[0];
      active = active.slice(1);
      frames.push(snap({
        phase: 'leave', region: 'resource', activeId: id,
        note: active.length > 0
          ? `${id} finishes reading and releases its share. ${active.length} reader${active.length === 1 ? '' : 's'} still hold the lock.`
          : `${id} finishes reading. The last reader has left — the resource is now empty, so a waiting writer can finally proceed.`,
      }));
      drainQueue();
    } else if (ev.kind === 'writer' && ev.tag === 'arrive') {
      if (wIdle.length === 0) continue;
      const id = wIdle.shift();
      if (active.length === 0 && writer !== 'writing') {
        writer = 'writing';
        holder = id;
        admittedWrites += 1;
        frames.push(snap({
          phase: 'enter', region: 'resource', activeId: id, writer: 'writing',
          note: `${id} wants to WRITE and the resource is empty, so it takes the lock in EXCLUSIVE mode immediately. Now no reader and no other writer may enter.`,
        }));
      } else {
        queue.push({ id, kind: 'writer' });
        if (writer === 'idle') writer = 'waiting';
        frames.push(snap({
          phase: 'block', region: 'queue', activeId: id, writer: writer === 'writing' ? 'writing' : 'waiting',
          note: `${id} wants to WRITE, but ${active.length} reader${active.length === 1 ? '' : 's'} currently hold the lock in shared mode. A writer needs EXCLUSIVE access, so ${id} must WAIT for every reader to drain.`,
        }));
      }
    } else if (ev.kind === 'writer' && ev.tag === 'leave') {
      if (writer !== 'writing') continue;
      const id = holder;
      writer = queue.some((q) => q.kind === 'writer') ? 'waiting' : 'idle';
      holder = null;
      frames.push(snap({
        phase: 'leave', region: 'resource', activeId: id, writer,
        note: `${id} finishes writing and RELEASES the exclusive lock. The resource is open again — waiting threads can now be admitted.`,
      }));
      drainQueue();
    }
  }

  frames.push(snap({
    phase: 'done',
    note: `Done. The lock served ${admittedReaders} reader entr${admittedReaders === 1 ? 'y' : 'ies'} (often several at once) and ${admittedWrites} exclusive write${admittedWrites === 1 ? '' : 's'}. The invariant held throughout: many readers OR one writer, never both.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1150;

// resource box geometry
const W = 720;
const H = 430;
const BOX_X = 250;
const BOX_Y = 70;
const BOX_W = 320;
const BOX_H = 210;

export default function ReadersWritersViz() {
  const [nReaders, setNReaders] = useState(4);
  const [nWriters, setNWriters] = useState(2);
  const [policy, setPolicy] = useState('writer');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(nReaders, nWriters, policy), [nReaders, nWriters, policy]);
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

  const changeReaders = (v) => {
    setIsRunning(false);
    setStep(0);
    setNReaders(v);
  };
  const changeWriters = (v) => {
    setIsRunning(false);
    setStep(0);
    setNWriters(v);
  };
  const changePolicy = (p) => {
    setIsRunning(false);
    setStep(0);
    setPolicy(p);
  };

  const mode = current.mode;
  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // layout the active readers in a grid inside the resource box.
  const readerSlots = current.active.map((id, i) => {
    const perRow = 3;
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const cellW = (BOX_W - 40) / perRow;
    const cx = BOX_X + 20 + cellW * col + cellW / 2;
    const cy = BOX_Y + 86 + row * 60;
    return { id, cx, cy };
  });

  const writerInBox = current.writer === 'writing';

  return (
    <div className="rwv">
      <div className="rwv-head">
        <h3 className="rwv-title">Read-Write lock — many readers, or one writer</h3>
        <p className="rwv-sub">
          Step contending threads through a shared resource: readers share the lock concurrently, but a writer needs it exclusively and must wait for every reader to drain.
        </p>
      </div>

      <div className="rwv-controls">
        <div className="rwv-buttons">
          <button
            type="button"
            className="rwv-btn rwv-btn-primary"
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
            className="rwv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="rwv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="rwv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <label className="rwv-speed">
          <span className="rwv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rwv-range"
            aria-label="Playback speed"
          />
          <span className="rwv-range-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="rwv-spacer" aria-hidden="true" />

        <label className="rwv-speed">
          <span className="rwv-input-label">readers</span>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={nReaders}
            onChange={(e) => changeReaders(Number(e.target.value))}
            className="rwv-range"
            aria-label="Number of readers"
          />
          <span className="rwv-range-value">{nReaders}</span>
        </label>

        <label className="rwv-speed">
          <span className="rwv-input-label">writers</span>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={nWriters}
            onChange={(e) => changeWriters(Number(e.target.value))}
            className="rwv-range"
            aria-label="Number of writers"
          />
          <span className="rwv-range-value">{nWriters}</span>
        </label>

        <div className="rwv-policy" role="group" aria-label="Admission policy">
          <span className="rwv-input-label">policy</span>
          <button
            type="button"
            className={`rwv-toggle ${policy === 'reader' ? 'is-on' : ''}`}
            onClick={() => changePolicy('reader')}
            aria-pressed={policy === 'reader'}
          >
            reader-pref
          </button>
          <button
            type="button"
            className={`rwv-toggle ${policy === 'writer' ? 'is-on' : ''}`}
            onClick={() => changePolicy('writer')}
            aria-pressed={policy === 'writer'}
          >
            writer-pref
          </button>
        </div>
      </div>

      <div className="rwv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rwv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="rwv-legend" x={20} y={26}>
            shared resource · readers share · writer is exclusive
          </text>

          {/* shared resource box — border/fill swings between modes */}
          <rect
            className={`rwv-resource is-${mode}`}
            x={BOX_X}
            y={BOX_Y}
            width={BOX_W}
            height={BOX_H}
            rx={12}
          />
          <g transform={`translate(${BOX_X + BOX_W / 2 - 9}, ${BOX_Y + 14})`}>
            <Lock width={18} height={18} className={`rwv-ic is-${mode}`} />
          </g>
          <text className={`rwv-resource-mode is-${mode}`} x={BOX_X + BOX_W / 2} y={BOX_Y + 52}>
            {mode === 'free' ? 'FREE' : mode === 'shared-read' ? 'SHARED · READ' : 'EXCLUSIVE · WRITE'}
          </text>

          {/* writer occupying the resource (exclusive) */}
          {writerInBox && (
            <g>
              <rect
                className="rwv-writer is-writing"
                x={BOX_X + BOX_W / 2 - 56}
                y={BOX_Y + 96}
                width={112}
                height={78}
                rx={10}
              />
              <g transform={`translate(${BOX_X + BOX_W / 2 - 9}, ${BOX_Y + 110})`}>
                <Pencil width={18} height={18} className="rwv-ic is-writer" />
              </g>
              <text className="rwv-node-label is-writer" x={BOX_X + BOX_W / 2} y={BOX_Y + 150}>{current.holder}</text>
              <text className="rwv-node-state is-writer" x={BOX_X + BOX_W / 2} y={BOX_Y + 166}>writing</text>
            </g>
          )}

          {/* active readers sharing the resource concurrently */}
          {!writerInBox && readerSlots.length === 0 && (
            <text className="rwv-empty" x={BOX_X + BOX_W / 2} y={BOX_Y + BOX_H / 2 + 18}>no thread holds the lock</text>
          )}
          {!writerInBox && readerSlots.map((r) => {
            const isHot = current.activeId === r.id;
            return (
              <g key={`act-${r.id}`}>
                <circle className={`rwv-reader is-reading ${isHot ? 'is-hot' : ''}`} cx={r.cx} cy={r.cy} r={26} />
                <g transform={`translate(${r.cx - 8}, ${r.cy - 15})`}>
                  <BookOpen width={16} height={16} className="rwv-ic is-reader" />
                </g>
                <text className="rwv-node-label is-reader" x={r.cx} y={r.cy + 16}>{r.id}</text>
              </g>
            );
          })}

          {/* wait queue lane */}
          <text className="rwv-lane-title" x={20} y={BOX_Y + BOX_H + 56}>wait queue (blocked) · FIFO</text>
          <rect
            className={`rwv-lane ${current.region === 'queue' ? 'is-active' : ''}`}
            x={20}
            y={BOX_Y + BOX_H + 66}
            width={W - 40}
            height={64}
            rx={9}
          />
          {current.queue.length === 0 && (
            <text className="rwv-empty" x={W / 2} y={BOX_Y + BOX_H + 66 + 38}>no thread is waiting</text>
          )}
          {current.queue.map((q, i) => {
            const qx = 40 + i * 78;
            const qy = BOX_Y + BOX_H + 66 + 12;
            const isHot = current.activeId === q.id;
            const isWriter = q.kind === 'writer';
            return (
              <g key={`q-${q.id}`}>
                <rect
                  className={`rwv-qitem is-${q.kind} ${isHot ? 'is-hot' : ''}`}
                  x={qx}
                  y={qy}
                  width={64}
                  height={40}
                  rx={8}
                />
                <g transform={`translate(${qx + 9}, ${qy + 8})`}>
                  {isWriter
                    ? <Pencil width={14} height={14} className="rwv-ic is-writer" />
                    : <BookOpen width={14} height={14} className="rwv-ic is-reader" />}
                </g>
                <text className={`rwv-qitem-label is-${q.kind}`} x={qx + 42} y={qy + 26}>{q.id}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rwv-metrics">
        <div className="rwv-metric">
          <span className="rwv-metric-label">lock mode</span>
          <span className={`rwv-metric-value is-mode-${mode}`}>{mode}</span>
        </div>
        <div className="rwv-metric">
          <span className="rwv-metric-label">active readers</span>
          <span className="rwv-metric-value is-reader">{current.active.length}</span>
        </div>
        <div className="rwv-metric">
          <span className="rwv-metric-label">writer state</span>
          <span className={`rwv-metric-value ${current.writer === 'writing' ? 'is-writer' : current.writer === 'waiting' ? 'is-wait' : ''}`}>
            {current.writer}
          </span>
        </div>
        <div className="rwv-metric">
          <span className="rwv-metric-label">threads waiting</span>
          <span className={`rwv-metric-value ${current.queue.length ? 'is-wait' : ''}`}>{current.queue.length}</span>
        </div>
        <div className="rwv-metric">
          <span className="rwv-metric-label">step</span>
          <span className="rwv-metric-value">{step + 1} / {totalSteps}</span>
        </div>
      </div>

      <div className={`rwv-narration is-${mode}`}>
        <span className="rwv-narration-label">
          {mode === 'exclusive-write' ? 'exclusive' : mode === 'shared-read' ? 'shared' : 'trace'}
        </span>
        <span className="rwv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
