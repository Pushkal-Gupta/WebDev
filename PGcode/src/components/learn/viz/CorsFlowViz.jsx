import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Globe, Server, ShieldCheck, Ban,
} from 'lucide-react';
import './CorsFlowViz.css';

const REQUEST_ORIGINS = [
  'https://app.example.com',
  'https://evil.com',
  'http://app.example.com',
];

const ALLOWED_ORIGINS = [
  'https://app.example.com',
  '*',
  'https://other.com',
  'none',
];

function originReason(reqOrigin, allowOrigin) {
  if (allowOrigin === 'none') {
    return {
      allowed: false,
      why: `Server sent no Access-Control-Allow-Origin -> browser blocks the response from JS`,
    };
  }
  if (allowOrigin === '*') {
    return {
      allowed: true,
      why: `Wildcard * allows any origin -> browser exposes the response`,
    };
  }
  if (allowOrigin === reqOrigin) {
    return {
      allowed: true,
      why: `Origin matches Access-Control-Allow-Origin -> browser exposes the response`,
    };
  }
  const reqScheme = reqOrigin.split('://')[0];
  const allowScheme = allowOrigin.split('://')[0];
  if (reqScheme !== allowScheme) {
    return {
      allowed: false,
      why: `Scheme mismatch (${reqScheme} vs ${allowScheme}) -> not the allowed origin -> blocked`,
    };
  }
  return {
    allowed: false,
    why: `Origin ${reqOrigin} not in allow list (${allowOrigin}) -> browser blocks the response`,
  };
}

function buildFrames(reqOrigin, allowOrigin) {
  const verdict = originReason(reqOrigin, allowOrigin);
  const aclHeader = allowOrigin === 'none' ? '(absent)' : allowOrigin;
  const frames = [];

  const snap = (extra) => ({
    actor: null,
    decision: null,
    aclHeader,
    showPreflight: false,
    showPreflightResp: false,
    showReal: false,
    note: '',
    ...extra,
  });

  frames.push(snap({
    actor: 'origin',
    note: `Page at ${reqOrigin} runs fetch('${'https://api.other.com'}/data', { method: 'PUT' }). It is cross-origin and non-simple, so the browser steps in before the real request.`,
  }));

  frames.push(snap({
    actor: 'browser',
    note: `The browser sees a cross-origin, non-simple request. It pauses the real PUT and first sends a PREFLIGHT.`,
  }));

  frames.push(snap({
    actor: 'browser',
    showPreflight: true,
    note: `Preflight: OPTIONS /data with Origin: ${reqOrigin} and Access-Control-Request-Method: PUT — asking the server for permission.`,
  }));

  frames.push(snap({
    actor: 'server',
    showPreflight: true,
    note: `Server at https://api.other.com receives the OPTIONS preflight and decides which origin to allow.`,
  }));

  frames.push(snap({
    actor: 'server',
    showPreflight: true,
    showPreflightResp: true,
    note: `Server responds 204 with Access-Control-Allow-Origin: ${aclHeader} (and Allow-Methods). This header is the whole game.`,
  }));

  frames.push(snap({
    actor: 'browser',
    showPreflight: true,
    showPreflightResp: true,
    note: `Browser compares the request Origin (${reqOrigin}) against Access-Control-Allow-Origin (${aclHeader}).`,
  }));

  if (verdict.allowed) {
    frames.push(snap({
      actor: 'browser',
      decision: 'ALLOWED',
      showPreflight: true,
      showPreflightResp: true,
      showReal: true,
      note: `${verdict.why}. Preflight passes, so the browser sends the real PUT.`,
    }));
    frames.push(snap({
      actor: 'origin',
      decision: 'ALLOWED',
      showPreflight: true,
      showPreflightResp: true,
      showReal: true,
      note: `Real response comes back and the browser EXPOSES it to page JS. fetch() resolves normally. ${verdict.why}.`,
    }));
  } else {
    frames.push(snap({
      actor: 'browser',
      decision: 'BLOCKED',
      showPreflight: true,
      showPreflightResp: true,
      note: `${verdict.why}. The preflight check fails, so the real request is never exposed.`,
    }));
    frames.push(snap({
      actor: 'origin',
      decision: 'BLOCKED',
      showPreflight: true,
      showPreflightResp: true,
      note: `fetch() rejects with a CORS error. The server may still have processed work, but page JS never sees the response. ${verdict.why}.`,
    }));
  }

  return frames;
}

function wrapOrigin(s, max = 22) {
  if (s.length <= max) return [s];
  const cut = s.lastIndexOf('.', max);
  const idx = cut > 8 ? cut + 1 : max;
  return [s.slice(0, idx), s.slice(idx)];
}

const RUN_DELAY_MS = 1200;

export default function CorsFlowViz() {
  const [reqOrigin, setReqOrigin] = useState(REQUEST_ORIGINS[0]);
  const [allowOrigin, setAllowOrigin] = useState(ALLOWED_ORIGINS[0]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => buildFrames(reqOrigin, allowOrigin),
    [reqOrigin, allowOrigin],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  const verdict = useMemo(
    () => originReason(reqOrigin, allowOrigin),
    [reqOrigin, allowOrigin],
  );

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

  const changeParam = (setter, value) => {
    setIsRunning(false);
    setStep(0);
    setter(value);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 380;
  const laneW = 220;
  const laneGap = (W - 40 - laneW * 3) / 2;
  const laneX = (i) => 20 + i * (laneW + laneGap);
  const laneTop = 64;
  const laneH = 76;
  const cx = (i) => laneX(i) + laneW / 2;
  const browserMid = cx(1);
  const originMid = cx(0);
  const serverMid = cx(2);

  const lanes = [
    {
      key: 'origin', title: 'Page Origin', icon: Globe, accent: 'var(--accent)',
      lines: wrapOrigin(reqOrigin),
    },
    {
      key: 'browser', title: 'Browser', icon: ShieldCheck, accent: 'var(--hue-sky)',
      lines: ['enforces CORS'],
    },
    {
      key: 'server', title: 'Server', icon: Server, accent: 'var(--hue-violet)',
      lines: wrapOrigin('https://api.other.com'),
    },
  ];

  const msgY = laneTop + laneH + 36;
  const rowH = 40;

  const messages = [
    {
      show: true, from: originMid, to: browserMid, y: msgY,
      label: `fetch() PUT  ->  cross-origin`,
    },
    {
      show: current.showPreflight, from: browserMid, to: serverMid, y: msgY + rowH,
      label: `OPTIONS preflight · Origin: ${reqOrigin}`,
    },
    {
      show: current.showPreflightResp, from: serverMid, to: browserMid, y: msgY + rowH * 2,
      label: `204 · Access-Control-Allow-Origin: ${current.aclHeader}`,
    },
    {
      show: current.showReal, from: browserMid, to: serverMid, y: msgY + rowH * 3,
      label: `real PUT /data  ->  response exposed to JS`,
    },
  ];

  return (
    <div className="cfv">
      <div className="cfv-head">
        <h3 className="cfv-title">CORS — how the browser allows or blocks a cross-origin response</h3>
        <p className="cfv-sub">
          Pick a request origin and the server&apos;s Access-Control-Allow-Origin, then step through the
          preflight handshake. The browser compares the two and either exposes the response or blocks it.
        </p>
      </div>

      <div className="cfv-controls">
        <label className="cfv-select">
          <span className="cfv-input-label">request origin</span>
          <select
            value={reqOrigin}
            onChange={(e) => changeParam(setReqOrigin, e.target.value)}
            className="cfv-dropdown"
            aria-label="Request origin"
          >
            {REQUEST_ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label className="cfv-select">
          <span className="cfv-input-label">allow-origin</span>
          <select
            value={allowOrigin}
            onChange={(e) => changeParam(setAllowOrigin, e.target.value)}
            className="cfv-dropdown"
            aria-label="Server Access-Control-Allow-Origin"
          >
            {ALLOWED_ORIGINS.map((o) => (
              <option key={o} value={o}>{o === 'none' ? '(none — header absent)' : o}</option>
            ))}
          </select>
        </label>

        <label className="cfv-slider">
          <span className="cfv-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cfv-range" aria-label="Playback speed"
          />
          <span className="cfv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="cfv-spacer" aria-hidden="true" />

        <div className="cfv-buttons">
          <button
            type="button"
            className="cfv-btn cfv-btn-primary"
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
            className="cfv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cfv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cfv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cfv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cfv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cfv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="cfv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3.2" orient="auto">
              <path d="M0,0 L7,3.2 L0,6.4 Z" className="cfv-arrowhead" />
            </marker>
          </defs>

          {lanes.map((lane, i) => {
            const x = laneX(i);
            const active = current.actor === lane.key;
            const Icon = lane.icon;
            return (
              <g key={`lane-${lane.key}`}>
                <rect
                  className={`cfv-lane ${active ? 'is-active' : ''}`}
                  x={x}
                  y={laneTop}
                  width={laneW}
                  height={laneH}
                  rx={9}
                  style={active ? { stroke: lane.accent } : undefined}
                />
                <rect x={x} y={laneTop} width={5} height={laneH} rx={2.5} fill={lane.accent} opacity={active ? 1 : 0.5} />
                <foreignObject x={x + 14} y={laneTop + 12} width={22} height={22}>
                  <Icon size={18} color={lane.accent} />
                </foreignObject>
                <text className="cfv-lane-title" x={x + 44} y={laneTop + 26}>{lane.title}</text>
                {lane.lines.map((ln, li) => (
                  <text key={`ll-${li}`} className="cfv-lane-sub" x={x + 44} y={laneTop + 44 + li * 14}>{ln}</text>
                ))}
                {/* lifeline */}
                <line className="cfv-lifeline" x1={cx(i)} y1={laneTop + laneH} x2={cx(i)} y2={H - 24} />
              </g>
            );
          })}

          {messages.map((m, mi) => {
            if (!m.show) return null;
            const dir = m.to >= m.from ? 1 : -1;
            const x2 = m.to - dir * 7;
            const midX = (m.from + m.to) / 2;
            return (
              <g key={`msg-${mi}`} className="cfv-msg">
                <line
                  className="cfv-msg-line"
                  x1={m.from}
                  y1={m.y}
                  x2={x2}
                  y2={m.y}
                  markerEnd="url(#cfv-arrow)"
                />
                <text
                  className="cfv-msg-label"
                  x={midX}
                  y={m.y - 6}
                  textAnchor="middle"
                >
                  {m.label}
                </text>
              </g>
            );
          })}

          {current.decision && (
            <g>
              <foreignObject x={browserMid - 110} y={H - 78} width={22} height={22}>
                {current.decision === 'ALLOWED'
                  ? <ShieldCheck size={18} color="var(--easy)" />
                  : <Ban size={18} color="var(--hard)" />}
              </foreignObject>
              <text
                className={`cfv-verdict ${current.decision === 'ALLOWED' ? 'is-allow' : 'is-block'}`}
                x={browserMid - 80}
                y={H - 60}
              >
                {current.decision}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="cfv-metrics">
        <div className="cfv-metric">
          <span className="cfv-metric-label">request origin</span>
          <span className="cfv-metric-value">{reqOrigin}</span>
        </div>
        <div className="cfv-metric">
          <span className="cfv-metric-label">allow-origin header</span>
          <span className="cfv-metric-value">{current.aclHeader}</span>
        </div>
        <div className="cfv-metric">
          <span className="cfv-metric-label">verdict</span>
          <span className={`cfv-metric-value ${verdict.allowed ? 'is-allow' : 'is-block'}`}>
            {verdict.allowed ? 'ALLOWED' : 'BLOCKED'}
          </span>
        </div>
        <div className="cfv-metric cfv-metric-wide">
          <span className="cfv-metric-label">why</span>
          <span className="cfv-metric-value cfv-metric-why">{verdict.why}</span>
        </div>
      </div>

      <div className="cfv-narration">
        <span className="cfv-narration-label">trace</span>
        <span className="cfv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
