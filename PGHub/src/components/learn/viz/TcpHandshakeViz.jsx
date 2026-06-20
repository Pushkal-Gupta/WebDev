import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TcpHandshakeViz.css';

// Step a full TCP lifecycle: three-way handshake (SYN / SYN-ACK / ACK)
// then a four-way teardown (FIN / ACK / FIN / ACK). Each step carries
// sequence/ack numbers and moves each peer through its TCP state machine.
const ISN_C = 100; // client initial sequence number
const ISN_S = 300; // server initial sequence number

function buildFrames() {
  const frames = [];
  let client = 'CLOSED';
  let server = 'LISTEN';
  let cSeq = ISN_C;
  let sSeq = ISN_S;
  let cAck = 0;
  let sAck = 0;

  const snap = (extra) => ({
    client,
    server,
    cSeq,
    sSeq,
    cAck,
    sAck,
    dir: null, // 'c2s' | 's2c'
    flags: '',
    seg: '',
    note: '',
    phase: 'setup',
    ...extra,
  });

  frames.push(snap({
    note: 'Server is passively LISTENing on its port. The client socket is CLOSED. A connection needs both peers to agree on a starting sequence number before any data flows.',
  }));

  // --- SYN ---
  client = 'SYN-SENT';
  frames.push(snap({
    dir: 'c2s',
    flags: 'SYN',
    seg: `SEQ=${cSeq}`,
    note: `Client sends SYN with its initial sequence number SEQ=${cSeq}. Client moves CLOSED -> SYN-SENT. The SYN flag itself consumes one sequence number.`,
  }));

  // --- SYN-ACK ---
  sAck = cSeq + 1;
  server = 'SYN-RECEIVED';
  frames.push(snap({
    dir: 's2c',
    flags: 'SYN, ACK',
    seg: `SEQ=${sSeq} ACK=${sAck}`,
    note: `Server replies SYN+ACK: its own SEQ=${sSeq} and ACK=${sAck} (client SEQ+1) acknowledging the SYN. Server moves LISTEN -> SYN-RECEIVED.`,
  }));

  // --- ACK ---
  cSeq += 1; // SYN consumed a seq
  cAck = sSeq + 1;
  client = 'ESTABLISHED';
  server = 'ESTABLISHED';
  frames.push(snap({
    dir: 'c2s',
    flags: 'ACK',
    seg: `SEQ=${cSeq} ACK=${cAck}`,
    note: `Client sends final ACK: SEQ=${cSeq}, ACK=${cAck} (server SEQ+1). Both peers reach ESTABLISHED — the connection is open and data can flow in both directions.`,
    phase: 'open',
  }));

  frames.push(snap({
    phase: 'open',
    note: 'Connection ESTABLISHED on both sides. Each peer now knows the other\'s next expected sequence number. Application data (HTTP, TLS records) travels over this channel.',
  }));

  // --- Teardown: FIN ---
  sSeq += 1; // align server seq for teardown clarity
  client = 'FIN-WAIT-1';
  frames.push(snap({
    dir: 'c2s',
    flags: 'FIN, ACK',
    seg: `SEQ=${cSeq} ACK=${cAck}`,
    note: `Client is done sending and starts an active close: FIN. Client moves ESTABLISHED -> FIN-WAIT-1. The FIN also consumes one sequence number.`,
    phase: 'close',
  }));

  // --- ACK of FIN ---
  sAck = cSeq + 1;
  server = 'CLOSE-WAIT';
  client = 'FIN-WAIT-2';
  frames.push(snap({
    dir: 's2c',
    flags: 'ACK',
    seg: `SEQ=${sSeq} ACK=${sAck}`,
    note: `Server ACKs the FIN (ACK=${sAck}). Server -> CLOSE-WAIT (it may still have data to send); client -> FIN-WAIT-2 awaiting the server's own FIN.`,
    phase: 'close',
  }));

  // --- Server FIN ---
  server = 'LAST-ACK';
  frames.push(snap({
    dir: 's2c',
    flags: 'FIN, ACK',
    seg: `SEQ=${sSeq} ACK=${sAck}`,
    note: `Server finishes and sends its own FIN. Server -> LAST-ACK, waiting for the final acknowledgement before fully closing.`,
    phase: 'close',
  }));

  // --- Final ACK ---
  cAck = sSeq + 1;
  client = 'TIME-WAIT';
  server = 'CLOSED';
  frames.push(snap({
    dir: 'c2s',
    flags: 'ACK',
    seg: `SEQ=${cSeq + 1} ACK=${cAck}`,
    note: `Client ACKs the server FIN (ACK=${cAck}). Server -> CLOSED. Client enters TIME-WAIT, lingering ~2·MSL to absorb any straggling segments before it too closes.`,
    phase: 'close',
  }));

  client = 'CLOSED';
  frames.push(snap({
    phase: 'done',
    note: 'TIME-WAIT elapsed; client -> CLOSED. Both peers are CLOSED. Setup took 3 segments; teardown took 4 because each direction is closed independently.',
  }));

  return frames;
}

const RUN_DELAY_MS = 1200;

export default function TcpHandshakeViz() {
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

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 380;
  const clientX = 150;
  const serverX = W - 150;
  const laneTop = 70;
  const laneBottom = H - 56;
  const arrowY = (laneTop + laneBottom) / 2;

  const showArrow = current.dir !== null;
  const isC2S = current.dir === 'c2s';
  const ax1 = isC2S ? clientX : serverX;
  const ax2 = isC2S ? serverX : clientX;

  const phaseClass = current.phase === 'open' ? 'is-open'
    : current.phase === 'close' ? 'is-close'
      : current.phase === 'done' ? 'is-done' : '';

  return (
    <div className="thv">
      <div className="thv-head">
        <h3 className="thv-title">TCP connection lifecycle — handshake and teardown</h3>
        <p className="thv-sub">
          Step the three-way handshake (SYN / SYN-ACK / ACK) that opens a connection, then the four-way
          FIN teardown that closes it. Each segment carries sequence and acknowledgement numbers, and both
          peers walk their TCP state machine.
        </p>
      </div>

      <div className="thv-controls">
        <label className="thv-speed">
          <span className="thv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="thv-range"
            aria-label="Playback speed"
          />
          <span className="thv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="thv-spacer" aria-hidden="true" />

        <div className="thv-buttons">
          <button
            type="button"
            className="thv-btn thv-btn-primary"
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
            className="thv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="thv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="thv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="thv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="thv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="thv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="thv-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" className="thv-arrowhead" />
            </marker>
          </defs>

          {/* peer headers */}
          <g>
            <rect className="thv-peer" x={clientX - 80} y={laneTop - 46} width={160} height={36} rx={8} />
            <text className="thv-peer-label" x={clientX} y={laneTop - 23}>CLIENT</text>
            <rect className="thv-peer" x={serverX - 80} y={laneTop - 46} width={160} height={36} rx={8} />
            <text className="thv-peer-label" x={serverX} y={laneTop - 23}>SERVER</text>
          </g>

          {/* lifelines */}
          <line className="thv-lifeline" x1={clientX} y1={laneTop} x2={clientX} y2={laneBottom} />
          <line className="thv-lifeline" x1={serverX} y1={laneTop} x2={serverX} y2={laneBottom} />

          {/* state pills under each lifeline */}
          <g>
            <rect className={`thv-state ${phaseClass}`} x={clientX - 90} y={laneBottom + 8} width={180} height={34} rx={8} />
            <text className="thv-state-text" x={clientX} y={laneBottom + 30}>{current.client}</text>
            <rect className={`thv-state ${phaseClass}`} x={serverX - 90} y={laneBottom + 8} width={180} height={34} rx={8} />
            <text className="thv-state-text" x={serverX} y={laneBottom + 30}>{current.server}</text>
          </g>

          {/* segment arrow */}
          {showArrow && (
            <g className={`thv-seg ${phaseClass}`}>
              <line
                className="thv-seg-line"
                x1={ax1}
                y1={arrowY}
                x2={ax2}
                y2={arrowY}
                markerEnd="url(#thv-arrow)"
              />
              <rect
                className="thv-seg-box"
                x={(clientX + serverX) / 2 - 130}
                y={arrowY - 52}
                width={260}
                height={34}
                rx={8}
              />
              <text className="thv-seg-flags" x={(clientX + serverX) / 2} y={arrowY - 30}>
                [{current.flags}]
              </text>
              <text className="thv-seg-nums" x={(clientX + serverX) / 2} y={arrowY + 22}>
                {current.seg}
              </text>
            </g>
          )}
          {!showArrow && (
            <text className="thv-idle" x={(clientX + serverX) / 2} y={arrowY}>
              {current.phase === 'done' ? 'connection closed' : 'awaiting first segment'}
            </text>
          )}
        </svg>
      </div>

      <div className="thv-metrics">
        <div className="thv-metric">
          <span className="thv-metric-label">client state</span>
          <span className="thv-metric-value is-client">{current.client}</span>
        </div>
        <div className="thv-metric">
          <span className="thv-metric-label">server state</span>
          <span className="thv-metric-value is-server">{current.server}</span>
        </div>
        <div className="thv-metric">
          <span className="thv-metric-label">client seq / ack</span>
          <span className="thv-metric-value">{current.cSeq} / {current.cAck}</span>
        </div>
        <div className="thv-metric">
          <span className="thv-metric-label">server seq / ack</span>
          <span className="thv-metric-value">{current.sSeq} / {current.sAck}</span>
        </div>
        <div className="thv-metric">
          <span className="thv-metric-label">phase</span>
          <span className="thv-metric-value">{current.phase}</span>
        </div>
      </div>

      <div className="thv-narration">
        <span className="thv-narration-label">trace</span>
        <span className="thv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
