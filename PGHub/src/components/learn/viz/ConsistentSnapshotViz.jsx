import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Server, Camera } from 'lucide-react';
import './ConsistentSnapshotViz.css';

// Chandy-Lamport global snapshot over 3 processes on a ring of directed channels.
//
// Topology: P1 -> P2 -> P3 -> P1 (one direction). Each process owns an integer
// balance. A few application messages are already in flight carrying values.
//
// Algorithm:
//   (1) The initiator (P1) records its OWN state, then sends a MARKER down every
//       outgoing channel.
//   (2) When a process sees a marker on a channel for the FIRST time, it records
//       its own state at once, marks THAT incoming channel's recorded state as
//       empty, and sends markers on all of its outgoing channels.
//   (3) A marker arriving on any OTHER (already-marked) incoming channel just
//       closes recording on that channel.
//   (4) An application message that arrives on a channel AFTER the process has
//       recorded but BEFORE the marker has come down that channel is captured as
//       in-flight channel state — it belongs to the cut.
//
// The fixed schedule below threads one such message (msg on P3->P1, value 30)
// past P1's recording point so the channel-capture rule is demonstrated.

const PNAMES = ['P1', 'P2', 'P3'];
const CHANNELS = [
  { id: 'c12', from: 0, to: 1 },
  { id: 'c23', from: 1, to: 2 },
  { id: 'c31', from: 2, to: 0 },
];

const fmt = (v) => (v === null || v === undefined ? '—' : `$${v}`);

function buildFrames() {
  const balance = [100, 60, 40];
  const recorded = [null, null, null];
  const recording = PNAMES.map(() => false);
  const channelState = { c12: null, c23: null, c31: null };
  const channelClosed = { c12: false, c23: false, c31: false };
  const markerSent = { c12: false, c23: false, c31: false };
  const markers = [];
  const appMsgs = [];

  const snap = (extra) => ({
    balance: [...balance],
    recorded: [...recorded],
    recording: [...recording],
    channelState: { ...channelState },
    channelClosed: { ...channelClosed },
    markerSent: { ...markerSent },
    markers: markers.map((m) => ({ ...m })),
    appMsgs: appMsgs.map((m) => ({ ...m })),
    activeProc: -1,
    activeChannel: null,
    phase: 'trace',
    note: '',
    ...extra,
  });

  const frames = [];

  frames.push(snap({
    phase: 'init',
    note: `Three processes on a directed ring: ${CHANNELS.map((c) => `${PNAMES[c.from]}->${PNAMES[c.to]}`).join(', ')}. Balances are P1 ${fmt(balance[0])}, P2 ${fmt(balance[1])}, P3 ${fmt(balance[2])}. A snapshot must capture each process's state AND any money still moving on the channels — without freezing the whole system.`,
  }));

  recorded[0] = balance[0];
  recording[0] = true;
  frames.push(snap({
    activeProc: 0,
    phase: 'record',
    note: `Initiator P1 records its OWN state first: recorded[P1] = ${fmt(balance[0])}. It now starts recording everything arriving on its incoming channel (P3->P1) until a marker comes down it.`,
  }));

  CHANNELS.filter((c) => c.from === 0).forEach((c) => {
    markerSent[c.id] = true;
    markers.push({ ch: c.id, status: 'in-transit' });
    frames.push(snap({
      activeProc: 0,
      activeChannel: c.id,
      phase: 'marker',
      note: `P1 sends a MARKER on ${PNAMES[c.from]}->${PNAMES[c.to]}. The marker is a beacon: it tells the receiver "everything before me on this channel is pre-snapshot; everything after me is post-snapshot".`,
    }));
  });

  appMsgs.push({ ch: 'c31', value: 30, status: 'in-transit' });
  frames.push(snap({
    activeChannel: 'c31',
    phase: 'app',
    note: `Meanwhile P3 had already sent an application message of ${fmt(30)} toward P1 on P3->P1 BEFORE P3 saw any marker. P1 has recorded its state and is recording channel P3->P1, but the marker has not yet arrived on it.`,
  }));

  appMsgs[0].status = 'captured';
  channelState.c31 = 30;
  frames.push(snap({
    activeProc: 0,
    activeChannel: 'c31',
    phase: 'capture',
    note: `That ${fmt(30)} arrives at P1 while it is still recording P3->P1 (no marker yet on this channel). Rule 4: capture it as in-flight CHANNEL STATE — channel[P3->P1] = ${fmt(30)}. This money was already "in the wire" at the cut.`,
  }));

  const m12 = markers.find((m) => m.ch === 'c12');
  m12.status = 'delivered';
  recorded[1] = balance[1];
  recording[1] = true;
  channelState.c12 = null;
  channelClosed.c12 = true;
  frames.push(snap({
    activeProc: 1,
    activeChannel: 'c12',
    phase: 'record',
    note: `The marker reaches P2 on P1->P2 — its FIRST marker. Rule 2: P2 records its own state recorded[P2] = ${fmt(balance[1])}, marks channel[P1->P2] = empty (nothing was in flight ahead of the marker), and will now relay markers downstream.`,
  }));

  CHANNELS.filter((c) => c.from === 1).forEach((c) => {
    markerSent[c.id] = true;
    markers.push({ ch: c.id, status: 'in-transit' });
    frames.push(snap({
      activeProc: 1,
      activeChannel: c.id,
      phase: 'marker',
      note: `P2 forwards a MARKER on ${PNAMES[c.from]}->${PNAMES[c.to]}, propagating the cut to P3.`,
    }));
  });

  const m23 = markers.find((m) => m.ch === 'c23');
  m23.status = 'delivered';
  recorded[2] = balance[2];
  recording[2] = true;
  channelState.c23 = null;
  channelClosed.c23 = true;
  frames.push(snap({
    activeProc: 2,
    activeChannel: 'c23',
    phase: 'record',
    note: `The marker reaches P3 on P2->P3 — its FIRST marker. P3 records recorded[P3] = ${fmt(balance[2])}, sets channel[P2->P3] = empty, and sends a marker on its own outgoing channel P3->P1.`,
  }));

  CHANNELS.filter((c) => c.from === 2).forEach((c) => {
    markerSent[c.id] = true;
    markers.push({ ch: c.id, status: 'in-transit' });
    frames.push(snap({
      activeProc: 2,
      activeChannel: c.id,
      phase: 'marker',
      note: `P3 sends a MARKER on ${PNAMES[c.from]}->${PNAMES[c.to]}. This is the marker P1 has been waiting for to close its incoming channel.`,
    }));
  });

  const m31 = markers.find((m) => m.ch === 'c31');
  m31.status = 'delivered';
  recording[0] = false;
  channelClosed.c31 = true;
  frames.push(snap({
    activeProc: 0,
    activeChannel: 'c31',
    phase: 'close',
    note: `The marker finally arrives at P1 on P3->P1. P1 has already recorded its state, so Rule 3 applies: it simply STOPS recording this channel. The ${fmt(30)} captured earlier is the final value of channel[P3->P1]. Every process and channel is now recorded.`,
  }));

  const total = recorded.reduce((a, b) => a + b, 0)
    + Object.values(channelState).reduce((a, b) => a + (b || 0), 0);
  frames.push(snap({
    phase: 'done',
    note: `Consistent global cut complete. Process states: P1 ${fmt(recorded[0])}, P2 ${fmt(recorded[1])}, P3 ${fmt(recorded[2])}. Channel state: P3->P1 ${fmt(channelState.c31)} (others empty). Summed conserved quantity = ${fmt(total)} — equal to the system total, because the in-flight money was counted exactly once. No process was ever frozen.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1200;

const PROC_POS = [
  { x: 480, y: 120 },
  { x: 740, y: 360 },
  { x: 220, y: 360 },
];

export default function ConsistentSnapshotViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
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
  };

  const W = 960;
  const H = 470;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const edgePath = (from, to) => {
    const a = PROC_POS[from];
    const b = PROC_POS[to];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const r = 46;
    const x1 = a.x + nx * r;
    const y1 = a.y + ny * r;
    const x2 = b.x - nx * r;
    const y2 = b.y - ny * r;
    // bow the edge outward so opposite ring legs do not overlap
    const mx = (x1 + x2) / 2 - ny * 36;
    const my = (y1 + y2) / 2 + nx * 36;
    return { d: `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`, mx, my };
  };

  const markerByChannel = (chId) => current.markers.find((m) => m.ch === chId);

  const channelLabel = (chId) => {
    const cs = current.channelState[chId];
    if (current.channelClosed[chId]) return cs === null ? 'empty' : fmt(cs);
    return cs === null ? '' : fmt(cs);
  };

  return (
    <div className="csv">
      <div className="csv-head">
        <h3 className="csv-title">Chandy-Lamport snapshot — a consistent global cut without freezing</h3>
        <p className="csv-sub">
          Step the marker protocol across a three-process ring. Each process records its own balance when its
          first marker arrives; money still travelling on a channel is captured as that channel&apos;s state,
          so the cut conserves the total without ever stopping the system.
        </p>
      </div>

      <div className="csv-controls">
        <label className="csv-speed">
          <span className="csv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="csv-speed-range"
            aria-label="Playback speed"
          />
          <span className="csv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="csv-spacer" aria-hidden="true" />

        <div className="csv-buttons">
          <button
            type="button"
            className="csv-btn csv-btn-primary"
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
            className="csv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="csv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="csv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="csv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="csv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="csv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="csv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="csv-ah" />
            </marker>
            <marker id="csv-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="csv-ah-hot" />
            </marker>
          </defs>

          {CHANNELS.map((c) => {
            const { d, mx, my } = edgePath(c.from, c.to);
            const hot = current.activeChannel === c.id;
            const closed = current.channelClosed[c.id];
            const marker = markerByChannel(c.id);
            const hasMarkerOnWire = marker && marker.status === 'in-transit';
            const cs = current.channelState[c.id];
            const label = channelLabel(c.id);
            return (
              <g key={c.id}>
                <path
                  className={`csv-edge ${hot ? 'is-hot' : ''} ${closed ? 'is-closed' : ''}`}
                  d={d}
                  markerEnd={hot ? 'url(#csv-arrow-hot)' : 'url(#csv-arrow)'}
                />
                {hasMarkerOnWire && (
                  <g transform={`translate(${mx}, ${my})`}>
                    <rect className="csv-marker-tok" x={-16} y={-11} width={32} height={22} rx={5} />
                    <text className="csv-marker-tok-text" x={0} y={4}>MRK</text>
                  </g>
                )}
                {cs !== null && !closed && (
                  <g transform={`translate(${mx}, ${my + 26})`}>
                    <rect className="csv-msg-tok" x={-18} y={-11} width={36} height={22} rx={5} />
                    <text className="csv-msg-tok-text" x={0} y={4}>{fmt(cs)}</text>
                  </g>
                )}
                {label && (
                  <g transform={`translate(${mx}, ${my + (cs !== null && !closed ? -20 : 0)})`}>
                    <rect
                      className={`csv-chan-chip ${closed && cs !== null ? 'is-captured' : ''}`}
                      x={-30}
                      y={-11}
                      width={60}
                      height={22}
                      rx={5}
                    />
                    <text className="csv-chan-chip-text" x={0} y={4}>{label}</text>
                  </g>
                )}
              </g>
            );
          })}

          {PNAMES.map((name, i) => {
            const pos = PROC_POS[i];
            const active = current.activeProc === i;
            const rec = current.recorded[i] !== null;
            const recording = current.recording[i];
            return (
              <g key={name} className={`csv-proc ${active ? 'is-active' : ''} ${rec ? 'is-recorded' : ''}`}>
                <circle className="csv-proc-ring" cx={pos.x} cy={pos.y} r={46} />
                {recording && (
                  <circle className="csv-proc-recording" cx={pos.x} cy={pos.y} r={53} />
                )}
                <g transform={`translate(${pos.x - 9}, ${pos.y - 30})`}>
                  <Server width={18} height={18} className="csv-proc-ic" />
                </g>
                <text className="csv-proc-name" x={pos.x} y={pos.y + 2}>{name}</text>
                <text className="csv-proc-live" x={pos.x} y={pos.y + 18}>live {fmt(current.balance[i])}</text>
                <g transform={`translate(${pos.x}, ${pos.y + 64})`}>
                  <rect className={`csv-proc-rec ${rec ? 'is-set' : ''}`} x={-46} y={-15} width={92} height={28} rx={7} />
                  {rec ? (
                    <g transform="translate(-36, -10)">
                      <Camera width={13} height={13} className="csv-proc-rec-ic" />
                    </g>
                  ) : null}
                  <text className="csv-proc-rec-text" x={rec ? 8 : 0} y={4}>
                    {rec ? `rec ${fmt(current.recorded[i])}` : 'not recorded'}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="csv-metrics">
        {PNAMES.map((name, i) => (
          <div className="csv-metric" key={`pm-${i}`}>
            <span className="csv-metric-label">{name} recorded</span>
            <span className={`csv-metric-value ${current.recorded[i] !== null ? 'is-set' : 'is-dim'}`}>
              {current.recorded[i] !== null ? fmt(current.recorded[i]) : '—'}
            </span>
          </div>
        ))}
        {CHANNELS.map((c) => {
          const cs = current.channelState[c.id];
          const closed = current.channelClosed[c.id];
          const text = closed ? (cs === null ? 'empty' : fmt(cs)) : (cs === null ? 'open' : `${fmt(cs)} (open)`);
          return (
            <div className="csv-metric" key={`cm-${c.id}`}>
              <span className="csv-metric-label">{PNAMES[c.from]}-&gt;{PNAMES[c.to]}</span>
              <span className={`csv-metric-value ${cs !== null ? 'is-cap' : 'is-dim'}`}>{text}</span>
            </div>
          );
        })}
        <div className="csv-metric csv-metric-wide">
          <span className="csv-metric-label">markers sent</span>
          <span className="csv-metric-value">
            {CHANNELS.filter((c) => current.markerSent[c.id]).map((c) => `${PNAMES[c.from]}->${PNAMES[c.to]}`).join('  ·  ') || 'none yet'}
          </span>
        </div>
      </div>

      <div className="csv-narration">
        <span className={`csv-narration-label csv-phase-${current.phase}`}>{current.phase}</span>
        <span className="csv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
