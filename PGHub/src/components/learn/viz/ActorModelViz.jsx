import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Send, Inbox, RefreshCw } from 'lucide-react';
import './ActorModelViz.css';

const ACTORS = ['A', 'B', 'C', 'D'];
const MAILBOX_SLOTS = 6;

// Deterministic FNV-style hash -> used to pick the next recipient when a message
// is processed. Keeps the whole simulation reproducible (no Math.random).
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// A "send" timeline event: enqueue message #id from `from` into `to`'s mailbox.
// `from === null` means an external send (the user / world seeding work).
function makeSend(id, from, to) {
  return { id, from, to };
}

const INIT_SENDS = [
  makeSend(1, null, 'A'),
  makeSend(2, null, 'B'),
  makeSend(3, null, 'A'),
  makeSend(4, null, 'D'),
];

// Decide whether processing a message spawns a follow-up send, and to whom.
// Seeded by the message id + handling actor so it is fully deterministic.
function spawnFor(msgId, handler) {
  const h = hashStr(`${handler}:${msgId}`);
  if (h % 5 < 2) return null;
  const others = ACTORS.filter((a) => a !== handler);
  return others[h % others.length];
}

// Replay the timeline as a sequence of frames. Each frame is one of:
//   - an external send landing in a mailbox
//   - an actor dequeuing + processing exactly one message (optionally spawning a send)
// Sequential per actor: an actor only processes when it has mail; we round-robin
// the actors so processing is interleaved but never concurrent on one actor.
function buildFrames(sends) {
  const frames = [];
  const mailboxes = {};
  const processed = {};
  for (const a of ACTORS) {
    mailboxes[a] = [];
    processed[a] = 0;
  }

  let nextId = sends.reduce((m, s) => Math.max(m, s.id), 0) + 1;

  const snap = (extra) => ({
    mailboxes: Object.fromEntries(ACTORS.map((a) => [a, [...mailboxes[a]]])),
    processed: { ...processed },
    actor: null,
    msg: null,
    target: null,
    kind: null,
    ...extra,
  });

  frames.push(snap({
    kind: 'init',
    note: `Four actors, each with a private mailbox and a private processed-count. Nothing is shared. ${sends.length} message(s) will be delivered; each actor handles its mailbox one message at a time.`,
  }));

  const externalQueue = [...sends];

  const deliver = (s) => {
    mailboxes[s.to].push({ id: s.id, from: s.from });
    frames.push(snap({
      kind: 'send',
      actor: s.from,
      target: s.to,
      msg: s.id,
      note: s.from
        ? `Actor ${s.from} sends msg #${s.id} to Actor ${s.to}. It lands at the back of ${s.to}'s mailbox (depth ${mailboxes[s.to].length}).`
        : `External send: msg #${s.id} is enqueued into Actor ${s.to}'s mailbox (depth ${mailboxes[s.to].length}).`,
    }));
  };

  for (const s of externalQueue) deliver(s);

  const pending = () => ACTORS.some((a) => mailboxes[a].length > 0);

  let guard = 0;
  let cursor = 0;
  while (pending() && guard < 400) {
    guard += 1;
    const a = ACTORS[cursor % ACTORS.length];
    cursor += 1;
    if (mailboxes[a].length === 0) continue;

    const m = mailboxes[a].shift();
    processed[a] += 1;
    const target = spawnFor(m.id, a);

    if (target) {
      const newId = nextId;
      nextId += 1;
      frames.push(snap({
        kind: 'process',
        actor: a,
        msg: m.id,
        target,
        note: `Actor ${a} dequeues msg #${m.id}${m.from ? ` (from ${m.from})` : ''}, processes it, and sends a new message to Actor ${target}. ${a}'s processed count is now ${processed[a]}.`,
      }));
      mailboxes[target].push({ id: newId, from: a });
      frames.push(snap({
        kind: 'send',
        actor: a,
        target,
        msg: newId,
        note: `Msg #${newId} from Actor ${a} arrives in Actor ${target}'s mailbox (depth ${mailboxes[target].length}). ${target} will handle it in turn — never concurrently with its other messages.`,
      }));
    } else {
      frames.push(snap({
        kind: 'process',
        actor: a,
        msg: m.id,
        target: null,
        note: `Actor ${a} dequeues msg #${m.id}${m.from ? ` (from ${m.from})` : ''} and processes it to completion — no follow-up message. ${a}'s processed count is now ${processed[a]}.`,
      }));
    }
  }

  const totalProcessed = ACTORS.reduce((n, a) => n + processed[a], 0);
  frames.push(snap({
    kind: 'done',
    note: `All mailboxes drained. ${totalProcessed} message(s) processed across the four actors, each strictly one-at-a-time on its own mailbox. No shared state was ever touched — only messages crossed between actors.`,
  }));

  return frames;
}

const ACTOR_COLORS = {
  A: 'var(--hue-sky)',
  B: 'var(--hue-pink)',
  C: 'var(--hue-mint)',
  D: 'var(--hue-violet)',
};

export default function ActorModelViz() {
  const [sends, setSends] = useState(INIT_SENDS);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [sendTarget, setSendTarget] = useState('C');
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(sends), [sends]);
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

  const injectSend = () => {
    const nextId = sends.reduce((m, s) => Math.max(m, s.id), 0) + 1;
    setIsRunning(false);
    setSends((ss) => [...ss, makeSend(nextId, null, sendTarget)]);
    setStep(0);
  };

  const restart = () => {
    setIsRunning(false);
    setSends(INIT_SENDS);
    setStep(0);
  };

  // SVG geometry — four actor columns across the stage, each a head + mailbox row.
  const W = 940;
  const H = 420;
  const pad = 28;
  const colGap = 18;
  const colW = (W - pad * 2 - colGap * (ACTORS.length - 1)) / ACTORS.length;
  const headY = 64;
  const headH = 56;
  const mailY = 150;
  const slotH = 30;
  const slotGap = 8;

  const colX = (i) => pad + i * (colW + colGap);

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const totalProcessed = ACTORS.reduce((n, a) => n + (current.processed[a] || 0), 0);
  const totalQueued = ACTORS.reduce((n, a) => n + current.mailboxes[a].length, 0);
  const busyActor = current.kind === 'process' ? current.actor : null;

  return (
    <div className="amv">
      <div className="amv-head">
        <h3 className="amv-title">Actor model — sequential mailbox processing, shared-nothing</h3>
        <p className="amv-sub">
          Each actor owns a private mailbox and handles one message at a time. Messages are the only thing that
          crosses between actors — there is no shared memory to lock, so an actor never races with itself.
        </p>
      </div>

      <div className="amv-controls">
        <div className="amv-send">
          <span className="amv-input-label">send to</span>
          <div className="amv-target" role="group" aria-label="Recipient actor">
            {ACTORS.map((a) => (
              <button
                key={a}
                type="button"
                className={`amv-target-btn ${sendTarget === a ? 'is-on' : ''}`}
                onClick={() => setSendTarget(a)}
                aria-pressed={sendTarget === a}
                style={sendTarget === a ? { background: ACTOR_COLORS[a], borderColor: ACTOR_COLORS[a] } : undefined}
              >
                {a}
              </button>
            ))}
          </div>
          <button type="button" className="amv-btn" onClick={injectSend}>
            <Send size={13} /> message
          </button>
        </div>

        <label className="amv-speed">
          <span className="amv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="amv-speed-range"
            aria-label="Playback speed"
          />
          <span className="amv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="amv-spacer" aria-hidden="true" />

        <div className="amv-buttons">
          <button
            type="button"
            className="amv-btn amv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={totalSteps <= 1}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="amv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="amv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="amv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="amv-btn" onClick={restart}>
            <RefreshCw size={13} /> Restart
          </button>
        </div>
        <div className="amv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="amv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="amv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="amv-row-label" x={pad} y={34}>four independent actors · private mailbox each</text>

          {/* message-in-flight connector for the current send */}
          {current.kind === 'send' && current.target && (() => {
            const ti = ACTORS.indexOf(current.target);
            const fi = current.actor ? ACTORS.indexOf(current.actor) : ti;
            const tx = colX(ti) + colW / 2;
            const fx = current.actor ? colX(fi) + colW / 2 : tx;
            const fy = current.actor ? headY + headH : 18;
            return (
              <line
                className="amv-flight"
                x1={fx}
                y1={fy}
                x2={tx}
                y2={mailY - 6}
                style={{ stroke: ACTOR_COLORS[current.target] }}
              />
            );
          })()}

          {ACTORS.map((a, i) => {
            const x = colX(i);
            const col = ACTOR_COLORS[a];
            const box = current.mailboxes[a];
            const isBusy = busyActor === a;
            const isTarget = current.kind === 'send' && current.target === a;
            const justProcessedId = current.kind === 'process' && current.actor === a ? current.msg : null;
            return (
              <g key={`col-${a}`}>
                {/* actor head */}
                <rect
                  className={`amv-actor ${isBusy ? 'is-busy' : ''}`}
                  x={x}
                  y={headY}
                  width={colW}
                  height={headH}
                  rx={10}
                  style={{ stroke: col, fill: isBusy ? undefined : 'var(--surface)' }}
                />
                <circle cx={x + 22} cy={headY + headH / 2} r={13} style={{ fill: col }} />
                <text className="amv-actor-tag" x={x + 22} y={headY + headH / 2 + 4}>{a}</text>
                <text className="amv-actor-state" x={x + 42} y={headY + 23}>
                  {isBusy ? 'handling' : box.length ? 'has mail' : 'idle'}
                </text>
                <text className="amv-actor-done" x={x + 42} y={headY + 41}>
                  done {current.processed[a] || 0}
                </text>

                {/* mailbox slots */}
                {Array.from({ length: MAILBOX_SLOTS }).map((_, si) => {
                  const sy = mailY + si * (slotH + slotGap);
                  const item = box[si];
                  const isHead = si === 0 && item;
                  return (
                    <g key={`slot-${a}-${si}`}>
                      <rect
                        className={`amv-slot ${item ? 'is-full' : ''} ${isHead ? 'is-head' : ''} ${isTarget && si === box.length - 1 ? 'is-incoming' : ''}`}
                        x={x}
                        y={sy}
                        width={colW}
                        height={slotH}
                        rx={6}
                        style={item ? { stroke: col } : undefined}
                      />
                      {item && (
                        <text className="amv-slot-label" x={x + colW / 2} y={sy + slotH / 2 + 4}>
                          {`#${item.id}${item.from ? ` ←${item.from}` : ''}`}
                        </text>
                      )}
                      {!item && si === 0 && box.length === 0 && (
                        <text className="amv-slot-empty" x={x + colW / 2} y={sy + slotH / 2 + 4}>empty</text>
                      )}
                    </g>
                  );
                })}

                {/* depth readout under the mailbox */}
                <text className="amv-depth" x={x + colW / 2} y={mailY + MAILBOX_SLOTS * (slotH + slotGap) + 8}>
                  queue {box.length}{justProcessedId ? `  ·  -#${justProcessedId}` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="amv-metrics">
        <div className="amv-metric">
          <span className="amv-metric-label">in flight</span>
          <span className="amv-metric-value">{totalQueued}</span>
        </div>
        {ACTORS.map((a) => (
          <div className="amv-metric" key={`m-${a}`}>
            <span className="amv-metric-label">{a} · queue / done</span>
            <span className="amv-metric-value" style={{ color: ACTOR_COLORS[a] }}>
              {current.mailboxes[a].length} / {current.processed[a] || 0}
            </span>
          </div>
        ))}
        <div className="amv-metric amv-metric-dim">
          <span className="amv-metric-label"><Inbox size={11} /> processed</span>
          <span className="amv-metric-value amv-metric-dimval">{totalProcessed}</span>
        </div>
      </div>

      <div className="amv-narration">
        <span className="amv-narration-label">trace</span>
        <span className="amv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
