import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Server, AlertTriangle } from 'lucide-react';
import './LamportClockViz.css';

// Lamport logical clocks (SCALAR) — one integer counter per process.
//
// Each process Pi keeps a single integer clock C. The rules:
//   - local event : C += 1
//   - send        : C += 1, then stamp the message with C
//   - receive     : C = max(C, msgTimestamp) + 1
//
// The clock value stamped on each event is its Lamport timestamp L(e). The
// guarantee Lamport's clocks give you is one-directional:
//   - if A happens-before B (A -> B, a causal chain through program order
//     and/or messages) then L(A) < L(B).            ALWAYS holds.
//   - the CONVERSE is FALSE: L(A) < L(B) does NOT imply A -> B. Two causally
//     independent (concurrent) events can have any relative timestamps.
//
// This is exactly the limitation that motivates vector clocks: a scalar clock
// can certify "happened-after" only in the strong direction; it cannot detect
// concurrency. The viz highlights one concrete misleading pair where the
// timestamp order suggests causality that does not exist.
//
// Fixed sequence (verified in node — causal-monotonicity A->B => L(A)<L(B) holds):
//   e0 P1 local            C1=1
//   e1 P1 send->P2 (ts=2)  C1=2
//   e2 P3 local            C3=1
//   e3 P2 recv e1          C2=max(0,2)+1=3
//   e4 P2 local            C2=4
//   e5 P3 local            C3=2
//   e6 P2 send->P3 (ts=5)  C2=5
//   e7 P3 recv e6          C3=max(2,5)+1=6
//   e8 P1 local            C1=3

const NUM = 3;
const PNAMES = ['P1', 'P2', 'P3'];

const EVENTS = [
  { p: 0, kind: 'local' },
  { p: 0, kind: 'send', to: 1 },
  { p: 2, kind: 'local' },
  { p: 1, kind: 'recv', from: 0, ref: 1 },
  { p: 1, kind: 'local' },
  { p: 2, kind: 'local' },
  { p: 1, kind: 'send', to: 2 },
  { p: 2, kind: 'recv', from: 1, ref: 6 },
  { p: 0, kind: 'local' },
];

// The misleading concurrent pair to spotlight: e5 (P3 local, L=2) and
// e3 (P2 recv, L=3). L(e5) < L(e3), yet neither happens-before the other.
const CONC_A = 5;
const CONC_B = 3;

// Build immutable frames. Each frame is the full world AFTER processing
// events 0..k, plus which event was just placed and a narration line.
function buildFrames() {
  const frames = [];
  const clocks = Array(NUM).fill(0);
  const msgTs = {}; // sendEventIndex -> attached scalar timestamp
  const placed = Array(EVENTS.length).fill(null); // { p, kind, L } once processed

  const snap = (extra) => ({
    clocks: [...clocks],
    placed: placed.map((e) => (e ? { ...e } : null)),
    active: -1,
    msgRef: -1,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: 'Three processes, each holding a single integer clock starting at 0. A local event adds 1. A send adds 1 then stamps the message with the new value. A receive sets the clock to max(local, message) + 1. Step through to stamp every event with its Lamport timestamp.',
  }));

  EVENTS.forEach((ev, i) => {
    let note;
    if (ev.kind === 'recv') {
      const ts = msgTs[ev.ref];
      const before = clocks[ev.p];
      clocks[ev.p] = Math.max(before, ts) + 1;
      note = `${PNAMES[ev.p]} receives a message stamped ts=${ts} (sent by ${PNAMES[ev.from]}). Its own clock was ${before}, so it jumps to max(${before}, ${ts}) + 1 = ${clocks[ev.p]}. The receive can never look earlier than the send that caused it.`;
    } else {
      clocks[ev.p] += 1;
      if (ev.kind === 'send') {
        msgTs[i] = clocks[ev.p];
        note = `${PNAMES[ev.p]} sends to ${PNAMES[ev.to]}: first bump its clock to ${clocks[ev.p]}, then stamp the in-flight message with ts=${clocks[ev.p]}. The receiver will fold this in.`;
      } else {
        note = `${PNAMES[ev.p]} does local work: bump only its own clock to ${clocks[ev.p]}. Nothing is exchanged, so the other two clocks stay frozen.`;
      }
    }
    placed[i] = { p: ev.p, kind: ev.kind, L: clocks[ev.p], from: ev.from, to: ev.to, ref: ev.ref };
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
    showConc: true,
    note: `All events stamped. Causality forces ordering: whenever A happens-before B (a chain through program order or messages), L(A) < L(B) — always. But the converse fails. Look at e${CONC_A} (P3 local, L=${last.placed[CONC_A].L}) and e${CONC_B} (P2 receive, L=${last.placed[CONC_B].L}): L(e${CONC_A}) < L(e${CONC_B}), yet there is no causal path between them — they are CONCURRENT. The smaller timestamp does NOT mean it happened first. A scalar clock cannot tell causality from coincidence; that is exactly why vector clocks exist.`,
  });

  return frames;
}

const RUN_DELAY_MS = 1150;

export default function LamportClockViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [spotlight, setSpotlight] = useState(false);
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
    setSpotlight(false);
  };

  // The concurrent-pair overlay shows once both events exist, and either when
  // the trace reaches its final frame or the reader toggles the spotlight on.
  const bothPlaced = current.placed[CONC_A] && current.placed[CONC_B];
  const showConc = bothPlaced && (spotlight || current.showConc);

  // Total order by (timestamp, pid) tiebreak over the events placed so far.
  const totalOrder = useMemo(() => {
    const idxs = [];
    for (let i = 0; i < EVENTS.length; i += 1) {
      if (current.placed[i]) idxs.push(i);
    }
    idxs.sort((a, b) => {
      const pa = current.placed[a];
      const pb = current.placed[b];
      return pa.L - pb.L || pa.p - pb.p;
    });
    return idxs;
  }, [current]);

  // SVG geometry — 3 horizontal timelines, events spaced along the X axis.
  const W = 960;
  const H = 430;
  const laneX0 = 150;
  const laneX1 = W - 40;
  const laneY = [105, 215, 325];
  const slots = EVENTS.length;
  const evX = (i) => laneX0 + ((i + 1) / (slots + 1)) * (laneX1 - laneX0);

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');
  const kindGlyph = (kind) => (kind === 'send' ? 'snd' : kind === 'recv' ? 'rcv' : 'loc');

  return (
    <div className="lcv">
      <div className="lcv-head">
        <h3 className="lcv-title">Lamport clocks — one integer per process</h3>
        <p className="lcv-sub">
          Step the event sequence to stamp each event with a scalar Lamport timestamp, watching messages drag
          the receiver&apos;s clock forward. Causality always forces L(A) &lt; L(B) — but a smaller timestamp does
          not prove causality, the gap that vector clocks fill.
        </p>
      </div>

      <div className="lcv-controls">
        <button
          type="button"
          className={`lcv-mode ${spotlight ? 'is-on' : ''}`}
          onClick={() => setSpotlight((v) => !v)}
          aria-pressed={spotlight}
          disabled={!bothPlaced}
        >
          <AlertTriangle size={13} /> spotlight the misleading pair
        </button>

        <label className="lcv-speed">
          <span className="lcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="lcv-speed-range"
            aria-label="Playback speed"
          />
          <span className="lcv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="lcv-spacer" aria-hidden="true" />

        <div className="lcv-buttons">
          <button
            type="button"
            className="lcv-btn lcv-btn-primary"
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
            className="lcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="lcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="lcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="lcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="lcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="lcv-arrow-msg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="lcv-ah-msg" />
            </marker>
            <marker id="lcv-arrow-conc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="lcv-ah-conc" />
            </marker>
          </defs>

          {/* timelines */}
          {PNAMES.map((name, i) => (
            <g key={`lane-${i}`}>
              <line className="lcv-axis" x1={laneX0} y1={laneY[i]} x2={laneX1} y2={laneY[i]} markerEnd="url(#lcv-arrow-msg)" />
              <g transform={`translate(${34}, ${laneY[i] - 18})`}>
                <rect className="lcv-proc-chip" x={0} y={0} width={98} height={36} rx={9} />
                <g transform="translate(11, 9)">
                  <Server width={16} height={16} className="lcv-ic" />
                </g>
                <text className="lcv-proc-name" x={36} y={16}>{name}</text>
                <text className="lcv-proc-clock" x={36} y={29}>{`C = ${current.clocks[i]}`}</text>
              </g>
            </g>
          ))}

          {/* message arrows for placed send/recv pairs */}
          {EVENTS.map((ev, i) => {
            if (ev.kind !== 'recv') return null;
            if (!current.placed[i]) return null;
            const sendIdx = ev.ref;
            const x1 = evX(sendIdx);
            const y1 = laneY[EVENTS[sendIdx].p];
            const x2 = evX(i);
            const y2 = laneY[ev.p];
            const hot = current.msgRef === sendIdx && current.active === i;
            return (
              <line
                key={`msg-${i}`}
                className={`lcv-msg ${hot ? 'is-hot' : ''}`}
                x1={x1}
                y1={y1 + (y2 > y1 ? 11 : -11)}
                x2={x2}
                y2={y2 + (y2 > y1 ? -13 : 13)}
                markerEnd="url(#lcv-arrow-msg)"
              />
            );
          })}

          {/* concurrent-pair spotlight link */}
          {showConc && (() => {
            const xa = evX(CONC_A);
            const ya = laneY[EVENTS[CONC_A].p];
            const xb = evX(CONC_B);
            const yb = laneY[EVENTS[CONC_B].p];
            const midY = Math.min(ya, yb) - 46;
            return (
              <path
                className="lcv-conc"
                d={`M ${xa} ${ya - 16} C ${xa} ${midY}, ${xb} ${midY}, ${xb} ${yb - 16}`}
              />
            );
          })()}

          {/* event nodes */}
          {EVENTS.map((ev, i) => {
            const pe = current.placed[i];
            if (!pe) return null;
            const x = evX(i);
            const y = laneY[ev.p];
            const isActive = current.active === i;
            const inConc = showConc && (i === CONC_A || i === CONC_B);
            return (
              <g
                key={`ev-${i}`}
                className={`lcv-event lcv-event-${kindGlyph(ev.kind)} ${isActive ? 'is-active' : ''} ${inConc ? 'is-conc' : ''}`}
              >
                <rect className="lcv-event-ts-bg" x={x - 16} y={y - 46} width={32} height={20} rx={6} />
                <text className="lcv-event-ts" x={x} y={y - 32}>{pe.L}</text>
                <circle className="lcv-event-dot" cx={x} cy={y} r={isActive ? 13 : 11} />
                <text className="lcv-event-kind" x={x} y={y + 4}>{kindGlyph(ev.kind)}</text>
                <text className="lcv-event-id" x={x} y={y + 30}>{`e${i}`}</text>
                {inConc && (
                  <text className="lcv-event-tag" x={x} y={y - 52}>{i === CONC_A ? 'A' : 'B'}</text>
                )}
              </g>
            );
          })}

          <text className="lcv-hint" x={W / 2} y={H - 12} textAnchor="middle">
            timestamp sits above each event · arrows carry a send&apos;s stamp into the receiver
          </text>
        </svg>
      </div>

      <div className="lcv-metrics">
        {PNAMES.map((name, i) => (
          <div className="lcv-metric" key={`m-${i}`}>
            <span className="lcv-metric-label">{name} clock</span>
            <span className="lcv-metric-value">{current.clocks[i]}</span>
          </div>
        ))}
        <div className="lcv-metric lcv-metric-wide">
          <span className="lcv-metric-label">total order — (timestamp, pid) tiebreak</span>
          <span className="lcv-metric-value lcv-metric-order">
            {totalOrder.length
              ? totalOrder
                .map((i) => `e${i}(${current.placed[i].L},${PNAMES[current.placed[i].p]})`)
                .join('  <  ')
              : 'no events yet'}
          </span>
        </div>
        {showConc && (
          <div className="lcv-metric lcv-metric-wide lcv-metric-conc">
            <span className="lcv-metric-label">concurrency check</span>
            <span className="lcv-metric-value is-conc">
              {`L(e${CONC_A}) = ${current.placed[CONC_A].L} < L(e${CONC_B}) = ${current.placed[CONC_B].L}, yet e${CONC_A} || e${CONC_B} — concurrent, no causal order`}
            </span>
          </div>
        )}
      </div>

      <div className="lcv-narration">
        <span className={`lcv-narration-label lcv-kind-${current.active >= 0 ? EVENTS[current.active].kind : 'trace'}`}>
          {current.active >= 0 ? EVENTS[current.active].kind : 'trace'}
        </span>
        <span className="lcv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
