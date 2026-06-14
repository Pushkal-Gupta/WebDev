import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Server } from 'lucide-react';
import './VectorClocksViz.css';

// Vector clocks — tracking causality across 3 processes (P1, P2, P3).
//
// Each process Pi keeps a vector V = [c1, c2, c3], one counter per process.
// Rules applied per event:
//   - local event : V[i]++                       (Pi did something on its own)
//   - send        : V[i]++, then attach a copy of V to the message
//   - receive     : V = elementwise-max(V, msg), then V[i]++
//
// The vector stamped on each event is a fingerprint of everything that could have
// causally influenced it. Comparing two stamps A and B:
//   - A -> B  (A happens-before B)  iff  A <= B componentwise and A != B
//   - B -> A  symmetrically
//   - otherwise the events are CONCURRENT — neither could have caused the other.
//
// The fixed sequence below threads three messages through the processes so the viz
// can show both causal chains (send/recv links) and concurrent pairs (P1's local
// work running independently of P2/P3's). Click any two events to compare them.

const NUM = 3;
const PNAMES = ['P1', 'P2', 'P3'];

// Ordered event sequence. `ref` on a recv points at the index of the send event
// whose vector is delivered. (Verified causality-correct in node — see commit notes.)
const EVENTS = [
  { p: 0, kind: 'local' },
  { p: 1, kind: 'local' },
  { p: 0, kind: 'send', to: 1 },
  { p: 2, kind: 'local' },
  { p: 1, kind: 'recv', from: 0, ref: 2 },
  { p: 1, kind: 'send', to: 2 },
  { p: 0, kind: 'local' },
  { p: 2, kind: 'recv', from: 1, ref: 5 },
  { p: 2, kind: 'send', to: 0 },
  { p: 0, kind: 'recv', from: 2, ref: 8 },
];

const fmt = (v) => `[${v.join(',')}]`;
const le = (a, b) => a.every((x, k) => x <= b[k]);
const eq = (a, b) => a.every((x, k) => x === b[k]);

function compareVecs(a, b) {
  if (eq(a, b)) return 'same';
  if (le(a, b)) return 'AtoB';
  if (le(b, a)) return 'BtoA';
  return 'concurrent';
}

// Build immutable frames. Each frame captures the full world AFTER processing
// events 0..k, plus which event was just placed and a narration line.
function buildFrames() {
  const frames = [];
  const clocks = PNAMES.map(() => Array(NUM).fill(0));
  const msgVec = {}; // sendEventIndex -> attached vector copy
  // placed[i] = { p, kind, vec, x } once the event has been processed
  const placed = Array(EVENTS.length).fill(null);

  const snap = (extra) => ({
    clocks: clocks.map((c) => [...c]),
    placed: placed.map((e) => (e ? { ...e, vec: [...e.vec] } : null)),
    active: -1,
    msgRef: -1,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `Three processes run on their own clocks. Each keeps a vector ${fmt([0, 0, 0])} — one counter per process. A local event bumps your own counter; a send bumps it and ships a copy of the vector; a receive takes the elementwise max with the incoming vector, then bumps your own. Step through to stamp every event.`,
  }));

  EVENTS.forEach((ev, i) => {
    const c = clocks[ev.p];
    let note;
    if (ev.kind === 'recv') {
      const m = msgVec[ev.ref];
      const before = [...c];
      const maxed = c.map((x, k) => Math.max(x, m[k]));
      for (let k = 0; k < NUM; k += 1) c[k] = maxed[k];
      c[ev.p] += 1;
      note = `${PNAMES[ev.p]} receives the message ${fmt(m)} (sent by ${PNAMES[ev.from]}). Take elementwise max of its clock ${fmt(before)} and the message ${fmt(m)} = ${fmt(maxed)}, then increment its own slot -> ${fmt(c)}. ${PNAMES[ev.p]} now knows everything the sender knew.`;
    } else {
      c[ev.p] += 1;
      if (ev.kind === 'send') {
        msgVec[i] = [...c];
        note = `${PNAMES[ev.p]} sends to ${PNAMES[ev.to]}. First increment its own slot -> ${fmt(c)}, then attach a copy ${fmt(c)} to the message in flight. The receiver will fold this in.`;
      } else {
        note = `${PNAMES[ev.p]} does local work: increment only its own slot -> ${fmt(c)}. Nothing is exchanged with the other processes, so their counters stay frozen.`;
      }
    }
    placed[i] = { p: ev.p, kind: ev.kind, vec: [...c], from: ev.from, to: ev.to, ref: ev.ref };
    frames.push(snap({
      active: i,
      msgRef: ev.kind === 'recv' ? ev.ref : -1,
      note,
    }));
  });

  const last = frames[frames.length - 1];
  frames.push({
    ...last,
    active: -1,
    msgRef: -1,
    note: 'All events stamped. Now click any TWO events to compare their vectors: if one vector is <= the other componentwise, the earlier one HAPPENS-BEFORE the later (a causal chain through some sequence of messages). If neither dominates, the events are CONCURRENT — they happened in causally independent parts of the system.',
  });

  return frames;
}

const RUN_DELAY_MS = 1150;

export default function VectorClocksViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [picks, setPicks] = useState([]); // up to 2 event indices to compare
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
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
    setPicks([]);
  };

  const togglePick = (i) => {
    // Only allow picking events that have already been placed in the current frame.
    if (!current.placed[i]) return;
    setPicks((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length >= 2) return [prev[1], i];
      return [...prev, i];
    });
  };

  // SVG geometry — 3 horizontal timelines, events spaced along the X axis by order.
  const W = 960;
  const H = 440;
  const laneX0 = 150;
  const laneX1 = W - 40;
  const laneY = [110, 220, 330];
  const slots = EVENTS.length;
  const evX = (orderIdx) => laneX0 + ((orderIdx + 1) / (slots + 1)) * (laneX1 - laneX0);

  // map each event index -> its order position along the shared X axis (chronological)
  const orderOf = (i) => i; // events array is already in global order

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // verdict between the two picked events
  const verdict = useMemo(() => {
    if (picks.length !== 2) return null;
    const [a, b] = picks;
    const ea = current.placed[a];
    const eb = current.placed[b];
    if (!ea || !eb) return null;
    const rel = compareVecs(ea.vec, eb.vec);
    return { a, b, ea, eb, rel };
  }, [picks, current]);

  const kindGlyph = (kind) => (kind === 'send' ? 'snd' : kind === 'recv' ? 'rcv' : 'loc');

  return (
    <div className="vcv">
      <div className="vcv-head">
        <h3 className="vcv-title">Vector clocks — tracking causality across processes</h3>
        <p className="vcv-sub">
          Step the event sequence to stamp each event with a vector clock, watching messages carry causality
          between the three timelines. Then click any two events to see whether one happens-before the other or
          they are concurrent.
        </p>
      </div>

      <div className="vcv-controls">
        <label className="vcv-speed">
          <span className="vcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="vcv-speed-range"
            aria-label="Playback speed"
          />
          <span className="vcv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="vcv-spacer" aria-hidden="true" />

        <div className="vcv-buttons">
          <button
            type="button"
            className="vcv-btn vcv-btn-primary"
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
            className="vcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="vcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="vcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="vcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="vcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="vcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="vcv-arrow-msg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="vcv-ah-msg" />
            </marker>
            <marker id="vcv-arrow-cmp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="vcv-ah-cmp" />
            </marker>
          </defs>

          {/* timelines */}
          {PNAMES.map((name, i) => (
            <g key={`lane-${i}`}>
              <line className="vcv-axis" x1={laneX0} y1={laneY[i]} x2={laneX1} y2={laneY[i]} />
              <g transform={`translate(${36}, ${laneY[i] - 18})`}>
                <rect className="vcv-proc-chip" x={0} y={0} width={96} height={36} rx={9} />
                <g transform="translate(11, 9)">
                  <Server width={16} height={16} className="vcv-ic" />
                </g>
                <text className="vcv-proc-name" x={34} y={16}>{name}</text>
                <text className="vcv-proc-vec" x={34} y={29}>{fmt(current.clocks[i])}</text>
              </g>
            </g>
          ))}

          {/* message arrows for already-placed send/recv pairs */}
          {EVENTS.map((ev, i) => {
            if (ev.kind !== 'recv') return null;
            const recvP = current.placed[i];
            if (!recvP) return null;
            const sendIdx = ev.ref;
            const x1 = evX(orderOf(sendIdx));
            const y1 = laneY[EVENTS[sendIdx].p];
            const x2 = evX(orderOf(i));
            const y2 = laneY[ev.p];
            const hot = current.msgRef === sendIdx && current.active === i;
            return (
              <line
                key={`msg-${i}`}
                className={`vcv-msg ${hot ? 'is-hot' : ''}`}
                x1={x1}
                y1={y1 + (y2 > y1 ? 9 : -9)}
                x2={x2}
                y2={y2 + (y2 > y1 ? -11 : 11)}
                markerEnd="url(#vcv-arrow-msg)"
              />
            );
          })}

          {/* comparison link between the two picked events */}
          {verdict && (() => {
            const xa = evX(orderOf(verdict.a));
            const ya = laneY[verdict.ea.p];
            const xb = evX(orderOf(verdict.b));
            const yb = laneY[verdict.eb.p];
            const midY = Math.min(ya, yb) - 44;
            return (
              <path
                className={`vcv-cmp is-${verdict.rel}`}
                d={`M ${xa} ${ya - 16} C ${xa} ${midY}, ${xb} ${midY}, ${xb} ${yb - 16}`}
                markerEnd={verdict.rel === 'concurrent' ? undefined : 'url(#vcv-arrow-cmp)'}
              />
            );
          })()}

          {/* event nodes */}
          {EVENTS.map((ev, i) => {
            const pe = current.placed[i];
            if (!pe) return null;
            const x = evX(orderOf(i));
            const y = laneY[ev.p];
            const isActive = current.active === i;
            const pickPos = picks.indexOf(i);
            const inVerdict = verdict && (i === verdict.a || i === verdict.b);
            return (
              <g
                key={`ev-${i}`}
                className={`vcv-event vcv-event-${kindGlyph(ev.kind)} ${isActive ? 'is-active' : ''} ${pickPos >= 0 ? 'is-picked' : ''}`}
                onClick={() => togglePick(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePick(i); } }}
              >
                <rect className="vcv-event-vec-bg" x={x - 30} y={y - 46} width={60} height={20} rx={6} />
                <text className={`vcv-event-vec ${inVerdict ? 'is-cmp' : ''}`} x={x} y={y - 32}>{fmt(pe.vec)}</text>
                <circle className="vcv-event-dot" cx={x} cy={y} r={pickPos >= 0 ? 13 : 11} />
                <text className="vcv-event-kind" x={x} y={y + 4}>{kindGlyph(ev.kind)}</text>
                {pickPos >= 0 && (
                  <text className="vcv-event-pick" x={x} y={y + 30}>{pickPos === 0 ? 'A' : 'B'}</text>
                )}
              </g>
            );
          })}

          <text className="vcv-hint" x={W / 2} y={H - 12} textAnchor="middle">
            {picks.length < 2 ? 'click two event nodes to compare their causality' : 'click an event to swap it out, or Reset to clear'}
          </text>
        </svg>
      </div>

      <div className="vcv-metrics">
        {PNAMES.map((name, i) => (
          <div className="vcv-metric" key={`m-${i}`}>
            <span className="vcv-metric-label">{name} clock</span>
            <span className="vcv-metric-value">{fmt(current.clocks[i])}</span>
          </div>
        ))}
        <div className="vcv-metric vcv-metric-wide">
          <span className="vcv-metric-label">compare</span>
          <span className={`vcv-metric-value ${verdict ? `is-${verdict.rel}` : ''}`}>
            {!verdict
              ? (picks.length === 1 ? `picked e${picks[0]} — pick one more` : 'pick two events')
              : verdict.rel === 'AtoB'
                ? `e${verdict.a} ${fmt(verdict.ea.vec)} -> e${verdict.b} ${fmt(verdict.eb.vec)}  (happens-before)`
                : verdict.rel === 'BtoA'
                  ? `e${verdict.b} ${fmt(verdict.eb.vec)} -> e${verdict.a} ${fmt(verdict.ea.vec)}  (happens-before)`
                  : verdict.rel === 'same'
                    ? 'same event'
                    : `e${verdict.a} ${fmt(verdict.ea.vec)}  ||  e${verdict.b} ${fmt(verdict.eb.vec)}  (concurrent)`}
          </span>
        </div>
      </div>

      <div className="vcv-narration">
        <span className={`vcv-narration-label vcv-kind-${current.active >= 0 ? EVENTS[current.active].kind : 'trace'}`}>
          {current.active >= 0 ? EVENTS[current.active].kind : 'trace'}
        </span>
        <span className="vcv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
