import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, ArrowDown, ArrowUp, ArrowUpDown,
  RefreshCw, Radio,
} from 'lucide-react';
import './SseVsWebsocketsViz.css';

const MODES = [
  { id: 'sse', label: 'SERVER-SENT EVENTS' },
  { id: 'ws', label: 'WEBSOCKET' },
];

// dir: 'up'   = browser → server  (request / upstream)
// dir: 'down' = server  → browser (push / response)
function buildSseFrames() {
  return [
    {
      note: 'Browser opens a long-lived GET to /events, advertising it wants a text/event-stream. This is the only request the browser sends to start the channel.',
      msg: { dir: 'up', label: 'GET /events', sub: 'Accept: text/event-stream', kind: 'req' },
      direction: 'one-way', proto: 'HTTP/1.1', overhead: '~1 KB / chunk',
      reconnect: 'yes', bestFor: 'notifications · AI streams',
    },
    {
      note: 'Server replies 200 and keeps the response body open. It will write chunks into this same connection indefinitely instead of closing it.',
      msg: { dir: 'down', label: '200 OK', sub: 'Content-Type: text/event-stream', kind: 'resp' },
      direction: 'one-way', proto: 'HTTP/1.1', overhead: '~1 KB / chunk',
      reconnect: 'yes', bestFor: 'notifications · AI streams',
    },
    {
      note: 'Now the server pushes a data: frame down the open stream. The browser fires an onmessage event for each one. No new request is made.',
      msg: { dir: 'down', label: 'data: {"id":1}', sub: 'event chunk', kind: 'stream' },
      direction: 'one-way', proto: 'HTTP/1.1', overhead: '~1 KB / chunk',
      reconnect: 'yes', bestFor: 'notifications · AI streams',
    },
    {
      note: 'Another chunk flows down the same connection — server → browser only. The stream is one-way; the browser cannot answer on this channel.',
      msg: { dir: 'down', label: 'data: {"id":2}', sub: 'event chunk', kind: 'stream' },
      direction: 'one-way', proto: 'HTTP/1.1', overhead: '~1 KB / chunk',
      reconnect: 'yes', bestFor: 'notifications · AI streams',
    },
    {
      note: 'A third pushed chunk. The browser keeps receiving without polling — but it still has no way to send back over this stream.',
      msg: { dir: 'down', label: 'data: {"id":3}', sub: 'event chunk', kind: 'stream' },
      direction: 'one-way', proto: 'HTTP/1.1', overhead: '~1 KB / chunk',
      reconnect: 'yes', bestFor: 'notifications · AI streams',
    },
    {
      note: 'To send anything upstream the browser must open a SEPARATE HTTP POST — a whole extra round-trip outside the event stream.',
      msg: { dir: 'up', label: 'POST /api/send', sub: 'separate request', kind: 'extra' },
      direction: 'one-way', proto: 'HTTP/1.1', overhead: '~1 KB / chunk',
      reconnect: 'yes', bestFor: 'notifications · AI streams',
    },
    {
      note: 'ONE-WAY push plus a separate POST for upstream. If the stream drops, the browser auto-reconnects and replays from Last-Event-ID. Best when the client mostly listens.',
      msg: { dir: 'down', label: 'data: {"id":4}', sub: 'event chunk', kind: 'stream' },
      direction: 'one-way', proto: 'HTTP/1.1', overhead: '~1 KB / chunk',
      reconnect: 'yes', bestFor: 'notifications · AI streams',
    },
  ];
}

function buildWsFrames() {
  return [
    {
      note: 'Browser sends GET /ws with an Upgrade: websocket header, asking to switch the HTTP connection into the WebSocket protocol.',
      msg: { dir: 'up', label: 'GET /ws', sub: 'Upgrade: websocket', kind: 'req' },
      direction: 'full-duplex', proto: 'ws upgrade', overhead: '~14 B / frame',
      reconnect: 'no (DIY)', bestFor: 'chat · collab · games',
    },
    {
      note: 'Server agrees with 101 Switching Protocols. From here the same TCP connection carries framed messages in either direction.',
      msg: { dir: 'down', label: '101 Switching', sub: 'Protocols', kind: 'resp' },
      direction: 'full-duplex', proto: 'ws upgrade', overhead: '~14 B / frame',
      reconnect: 'no (DIY)', bestFor: 'chat · collab · games',
    },
    {
      note: 'Browser sends a frame up to the server — and it does not need to wait for a request first. Either side may speak at any time.',
      msg: { dir: 'up', label: 'frame: "hi"', sub: '~14 B header', kind: 'frame' },
      direction: 'full-duplex', proto: 'ws upgrade', overhead: '~14 B / frame',
      reconnect: 'no (DIY)', bestFor: 'chat · collab · games',
    },
    {
      note: 'Server pushes a frame straight back down the same connection — no fresh handshake, no new request. This is full-duplex.',
      msg: { dir: 'down', label: 'frame: "ack"', sub: '~14 B header', kind: 'frame' },
      direction: 'full-duplex', proto: 'ws upgrade', overhead: '~14 B / frame',
      reconnect: 'no (DIY)', bestFor: 'chat · collab · games',
    },
    {
      note: 'Browser speaks again. Frames are tiny — about 14 bytes of overhead each — so chat-like back-and-forth is cheap.',
      msg: { dir: 'up', label: 'frame: "typing"', sub: '~14 B header', kind: 'frame' },
      direction: 'full-duplex', proto: 'ws upgrade', overhead: '~14 B / frame',
      reconnect: 'no (DIY)', bestFor: 'chat · collab · games',
    },
    {
      note: 'Server replies once more. Messages interleave in both directions over one TCP connection — exactly what live chat, collab editing, and games need.',
      msg: { dir: 'down', label: 'frame: "msg"', sub: '~14 B header', kind: 'frame' },
      direction: 'full-duplex', proto: 'ws upgrade', overhead: '~14 B / frame',
      reconnect: 'no (DIY)', bestFor: 'chat · collab · games',
    },
    {
      note: 'FULL-DUPLEX over one TCP connection. There is no built-in reconnect — if the socket drops you must detect and reopen it yourself. Best when both sides talk.',
      msg: { dir: 'up', label: 'frame: "bye"', sub: '~14 B header', kind: 'frame' },
      direction: 'full-duplex', proto: 'ws upgrade', overhead: '~14 B / frame',
      reconnect: 'no (DIY)', bestFor: 'chat · collab · games',
    },
  ];
}

export default function SseVsWebsocketsViz() {
  const [mode, setMode] = useState('sse');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);
  const uid = useId().replace(/:/g, '');

  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const frames = useMemo(
    () => (mode === 'sse' ? buildSseFrames() : buildWsFrames()),
    [mode],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1 && !reduceMotion;
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

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry — two VERTICAL lanes, time flows DOWNWARD.
  const W = 940;
  const H = 470;
  const laneTop = 64;
  const laneBottom = H - 28;
  const browserX = 200;   // left vertical lane = Browser
  const serverX = 740;    // right vertical lane = Server
  const firstY = laneTop + 60;
  const rowGap = (laneBottom - firstY - 18) / Math.max(1, totalSteps - 1);

  // Shown messages = all frames up to current step.
  const shown = frames.slice(0, step + 1);

  const arrowHueUp = 'var(--hue-pink)';   // browser → server
  const arrowHueDown = 'var(--hue-sky)';  // server → browser

  return (
    <div className="swsv">
      <div className="swsv-head">
        <span className="swsv-head-icon"><Radio size={18} /></span>
        <div className="swsv-head-text">
          <h3 className="swsv-title">SSE vs WebSockets — server push channels</h3>
          <p className="swsv-sub">
            Step the handshake and message flow down the time axis. Toggle modes to compare a one-way
            event stream against a full-duplex socket.
          </p>
        </div>
      </div>

      <div className="swsv-controls">
        <div className="swsv-modes" role="tablist" aria-label="Push channel">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`swsv-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="swsv-slider">
          <span className="swsv-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="swsv-range" aria-label="Playback speed"
          />
          <span className="swsv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="swsv-spacer" aria-hidden="true" />

        <div className="swsv-buttons">
          <button
            type="button"
            className="swsv-btn swsv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={reduceMotion && step >= totalSteps - 1}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="swsv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="swsv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="swsv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="swsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="swsv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id={`swsv-${uid}-down`} markerWidth="9" markerHeight="9"
              refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill={arrowHueDown} />
            </marker>
            <marker
              id={`swsv-${uid}-up`} markerWidth="9" markerHeight="9"
              refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill={arrowHueUp} />
            </marker>
          </defs>

          {/* Lane headers */}
          <g>
            <rect className="swsv-lane-head is-browser" x={browserX - 90} y={laneTop - 36} width={180} height={32} rx={7} />
            <text className="swsv-lane-label" x={browserX} y={laneTop - 15} textAnchor="middle">BROWSER</text>
            <rect className="swsv-lane-head is-server" x={serverX - 90} y={laneTop - 36} width={180} height={32} rx={7} />
            <text className="swsv-lane-label" x={serverX} y={laneTop - 15} textAnchor="middle">SERVER</text>
          </g>

          {/* Vertical lifelines (time axis downward) */}
          <line className="swsv-lifeline" x1={browserX} y1={laneTop} x2={browserX} y2={laneBottom} />
          <line className="swsv-lifeline" x1={serverX} y1={laneTop} x2={serverX} y2={laneBottom} />

          {/* time axis (downward) */}
          <g className="swsv-time-axis">
            <line className="swsv-time-line" x1={44} y1={firstY - 24} x2={44} y2={laneBottom} />
            <text className="swsv-time-label" x={44} y={firstY - 32} textAnchor="middle">time</text>
            <ArrowDown x={36} y={laneBottom + 2} width={16} height={16} className="swsv-time-arrow" />
          </g>

          {/* Messages — arrows between the two vertical lanes, stacked downward over time */}
          {shown.map((f, i) => {
            const y = firstY + i * rowGap;
            const isUp = f.msg.dir === 'up';
            const x1 = isUp ? browserX : serverX;
            const x2 = isUp ? serverX : browserX;
            const isLatest = i === step;
            const marker = isUp ? `url(#swsv-${uid}-up)` : `url(#swsv-${uid}-down)`;
            const labelX = (browserX + serverX) / 2;
            return (
              <g key={`msg-${mode}-${i}`} className={`swsv-msg ${isLatest ? 'is-latest' : ''} ${isUp ? 'is-up' : 'is-down'}`}>
                <line
                  className="swsv-msg-line"
                  x1={x1 + (isUp ? 8 : -8)}
                  y1={y}
                  x2={x2 + (isUp ? -10 : 10)}
                  y2={y}
                  markerEnd={marker}
                />
                <rect
                  className={`swsv-msg-tag ${isUp ? 'is-up' : 'is-down'} kind-${f.msg.kind}`}
                  x={labelX - 132}
                  y={y - 30}
                  width={264}
                  height={24}
                  rx={6}
                />
                <text className="swsv-msg-label" x={labelX} y={y - 17} textAnchor="middle">{f.msg.label}</text>
                <text className="swsv-msg-sub" x={labelX} y={y + 14} textAnchor="middle">{f.msg.sub}</text>
                {isUp
                  ? <ArrowUp x={labelX - 156} y={y - 26} width={15} height={15} className="swsv-dir-icon is-up" />
                  : <ArrowDown x={labelX + 142} y={y - 26} width={15} height={15} className="swsv-dir-icon is-down" />}
              </g>
            );
          })}

          {/* Mode label badge */}
          <g>
            <rect className="swsv-mode-badge" x={W - 256} y={H - 30} width={232} height={22} rx={6} />
            {mode === 'sse'
              ? <ArrowDown x={W - 248} y={H - 27} width={14} height={14} className="swsv-badge-icon" />
              : <ArrowUpDown x={W - 248} y={H - 27} width={14} height={14} className="swsv-badge-icon" />}
            <text className="swsv-mode-badge-text" x={W - 228} y={H - 14}>
              {mode === 'sse' ? 'ONE-WAY push + separate POST' : 'FULL-DUPLEX · one TCP connection'}
            </text>
          </g>
        </svg>
      </div>

      <div className="swsv-metrics">
        <div className="swsv-metric">
          <span className="swsv-metric-label">direction</span>
          <span className={`swsv-metric-value ${mode === 'ws' ? 'is-duplex' : 'is-oneway'}`}>{current.direction}</span>
        </div>
        <div className="swsv-metric">
          <span className="swsv-metric-label">protocol</span>
          <span className="swsv-metric-value">{current.proto}</span>
        </div>
        <div className="swsv-metric">
          <span className="swsv-metric-label">overhead</span>
          <span className="swsv-metric-value">{current.overhead}</span>
        </div>
        <div className="swsv-metric">
          <span className="swsv-metric-label">auto-reconnect</span>
          <span className={`swsv-metric-value ${current.reconnect.startsWith('yes') ? 'is-ok' : 'is-warn'}`}>
            {current.reconnect}
          </span>
        </div>
        <div className="swsv-metric">
          <span className="swsv-metric-label">best for</span>
          <span className="swsv-metric-value is-best">{current.bestFor}</span>
        </div>
      </div>

      <div className="swsv-badges">
        {mode === 'sse' ? (
          <>
            <span className="swsv-badge is-ok"><RefreshCw size={13} /> auto-reconnect via Last-Event-ID</span>
            <span className="swsv-badge is-info"><ArrowDown size={13} /> server → browser only</span>
          </>
        ) : (
          <>
            <span className="swsv-badge is-warn"><RefreshCw size={13} /> no auto-reconnect (DIY)</span>
            <span className="swsv-badge is-info"><ArrowUpDown size={13} /> both directions, any time</span>
          </>
        )}
      </div>

      <div className="swsv-narration">
        <span className="swsv-narration-label">flow</span>
        <span className="swsv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
