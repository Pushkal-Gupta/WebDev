import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Server, Laptop, Play, Pause, SkipForward, RotateCcw, Gauge, Lock,
} from 'lucide-react';
import './CryptoTlsHandshakeViz.css';

// Fixed TLS 1.3 message sequence between a client (left lane) and server
// (right lane). Every value is a constant — no randomness — so a given run is
// fully deterministic. `dir`: c2s = client->server, s2c = server->client,
// local = a client-side computation with no wire message.
const MSGS = [
  {
    key: 'clienthello', label: 'ClientHello', dir: 'c2s', encrypted: false, verify: false,
    detail: 'cipher suites, client random',
    now: 'The client opens with the cipher suites it supports and a fresh client random.',
  },
  {
    key: 'serverhello', label: 'ServerHello', dir: 's2c', encrypted: false, verify: false,
    detail: 'chosen suite, server random, key share',
    now: 'The server picks a suite, replies with its server random and ECDHE key share.',
  },
  {
    key: 'certificate', label: 'Certificate', dir: 's2c', encrypted: false, verify: false,
    detail: 'server cert + intermediate chain',
    now: 'The server presents its leaf certificate together with the intermediate chain.',
  },
  {
    key: 'verify', label: 'Verify chain', dir: 'local', encrypted: false, verify: true,
    detail: 'walk leaf -> intermediate -> trusted root',
    now: 'The client verifies every signature up to a trusted root and checks the hostname.',
  },
  {
    key: 'keyexchange', label: 'Key exchange', dir: 'local', encrypted: false, verify: false,
    detail: 'ECDHE shares -> shared session key',
    now: 'Both ECDHE key shares are mixed into one shared symmetric session key.',
  },
  {
    key: 'finished', label: 'Finished', dir: 's2c', encrypted: true, verify: false,
    detail: 'handshake authenticated, switch to encrypted',
    now: 'Finished messages authenticate the handshake; both sides switch to encryption.',
  },
  {
    key: 'appdata', label: 'Application data', dir: 's2c', encrypted: true, verify: false,
    detail: 'AES-GCM authenticated session',
    now: 'Application data now flows over the fast AES-GCM authenticated channel.',
  },
];

const DIR_LABEL = {
  c2s: 'client -> server',
  s2c: 'server -> client',
  local: 'local (client)',
};

// Geometry — two vertical lanes with a horizontal message arrow per step.
const W = 460;
const H = 300;
const CLIENT_X = 74;
const SERVER_X = 386;
const LANE_TOP = 58;
const LANE_BOT = 268;
const ROW_TOP = 78;
const ROW_PITCH = 27;

const rowY = (i) => ROW_TOP + i * ROW_PITCH;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CryptoTlsHandshakeViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = MSGS.length - 1;
  const safeStep = Math.min(step, total);
  const cur = MSGS[safeStep];

  const verified = useMemo(
    () => MSGS.slice(0, safeStep + 1).some((m) => m.verify),
    [safeStep],
  );
  const encrypted = useMemo(
    () => MSGS.slice(0, safeStep + 1).some((m) => m.encrypted),
    [safeStep],
  );

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 420 : 1000) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const y = rowY(safeStep);
  const leftToRight = cur.dir === 'c2s';
  const arrowX1 = cur.dir === 'local'
    ? CLIENT_X : (leftToRight ? CLIENT_X : SERVER_X);
  const arrowX2 = cur.dir === 'local'
    ? CLIENT_X + 60 : (leftToRight ? SERVER_X : CLIENT_X);

  return (
    <div className="cts">
      <div className="cts-head">
        <div className="cts-head-icon"><ShieldCheck size={18} /></div>
        <div className="cts-head-text">
          <h3 className="cts-title">The TLS 1.3 handshake, message by message</h3>
          <p className="cts-sub">
            Step through the exchange between client and server &mdash; hello, certificate,
            chain verification, ephemeral key agreement &mdash; then watch the channel flip to
            encrypted AES-GCM.
          </p>
        </div>
        <button type="button" className="cts-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cts-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cts-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="cts-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="cts-arrow-head" />
            </marker>
            <filter id="cts-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* lane headers */}
          <g className="cts-lane-head">
            <rect x={CLIENT_X - 44} y={16} width={88} height={30} rx={8} className="cts-lane-box" />
            <foreignObject x={CLIENT_X - 44} y={16} width={88} height={30}>
              <div className="cts-lane-label" xmlns="http://www.w3.org/1999/xhtml">
                <Laptop size={13} /> Client
              </div>
            </foreignObject>
          </g>
          <g className="cts-lane-head">
            <rect x={SERVER_X - 44} y={16} width={88} height={30} rx={8} className="cts-lane-box" />
            <foreignObject x={SERVER_X - 44} y={16} width={88} height={30}>
              <div className="cts-lane-label" xmlns="http://www.w3.org/1999/xhtml">
                <Server size={13} /> Server
              </div>
            </foreignObject>
          </g>

          {/* the two lifelines */}
          <line x1={CLIENT_X} y1={LANE_TOP} x2={CLIENT_X} y2={LANE_BOT} className={`cts-lane${encrypted ? ' is-enc' : ''}`} />
          <line x1={SERVER_X} y1={LANE_TOP} x2={SERVER_X} y2={LANE_BOT} className={`cts-lane${encrypted ? ' is-enc' : ''}`} />

          {/* per-message rows (dim rail with a tick per message) */}
          {MSGS.map((m, i) => {
            const done = i < safeStep;
            const active = i === safeStep;
            return (
              <g key={m.key} className={`cts-row${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}>
                <circle cx={CLIENT_X} cy={rowY(i)} r={3.2} className="cts-tick" />
                <circle cx={SERVER_X} cy={rowY(i)} r={3.2} className="cts-tick" />
              </g>
            );
          })}

          {/* the active message arrow */}
          {cur.dir === 'local' ? (
            <g className="cts-msg is-local" filter="url(#cts-glow)">
              <circle cx={CLIENT_X} cy={y} r={7} className={`cts-msg-node${cur.verify ? ' is-verify' : ''}`} />
              <text x={CLIENT_X + 16} y={y - 8} className="cts-msg-label">{cur.label}</text>
              <text x={CLIENT_X + 16} y={y + 6} className="cts-msg-detail">{cur.detail}</text>
            </g>
          ) : (
            <g className={`cts-msg${cur.encrypted ? ' is-enc' : ''}`} filter="url(#cts-glow)">
              <line x1={arrowX1} y1={y} x2={arrowX2} y2={y} className="cts-msg-line" markerEnd="url(#cts-arrow)" />
              <text
                x={(CLIENT_X + SERVER_X) / 2}
                y={y - 7}
                className="cts-msg-label"
                textAnchor="middle"
              >
                {cur.label}
              </text>
              <text
                x={(CLIENT_X + SERVER_X) / 2}
                y={y + 15}
                className="cts-msg-detail"
                textAnchor="middle"
              >
                {cur.detail}
              </text>
            </g>
          )}

          {/* trust + lock badges under each lane */}
          <g className={`cts-badge${verified ? ' is-on' : ''}`}>
            <foreignObject x={CLIENT_X - 40} y={LANE_BOT + 6} width={80} height={22}>
              <div className="cts-badge-chip" xmlns="http://www.w3.org/1999/xhtml">
                <ShieldCheck size={12} /> {verified ? 'chain ok' : 'unverified'}
              </div>
            </foreignObject>
          </g>
          <g className={`cts-badge${encrypted ? ' is-on' : ''}`}>
            <foreignObject x={SERVER_X - 40} y={LANE_BOT + 6} width={80} height={22}>
              <div className="cts-badge-chip" xmlns="http://www.w3.org/1999/xhtml">
                <Lock size={12} /> {encrypted ? 'encrypted' : 'plaintext'}
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <div className="cts-controls">
        <button type="button" className="cts-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="cts-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={safeStep >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="cts-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="cts-speed-range"
          />
          <span className="cts-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="cts-progress">{safeStep + 1} / {MSGS.length}</span>
      </div>

      <div className="cts-readout">
        <div className="cts-stat is-msg">
          <span className="cts-stat-label">message</span>
          <span className="cts-stat-val">{cur.label}</span>
        </div>
        <div className="cts-stat is-dir">
          <span className="cts-stat-label">direction</span>
          <span className="cts-stat-val">{DIR_LABEL[cur.dir]}</span>
        </div>
        <div className={`cts-stat is-state${encrypted ? ' is-enc' : ''}`}>
          <span className="cts-stat-label">session</span>
          <span className="cts-stat-val">{encrypted ? 'encrypted' : 'handshaking'}</span>
        </div>
      </div>

      <div className="cts-note">
        <span className="cts-note-label">now</span>
        <span className="cts-note-body">{cur.now}</span>
      </div>
    </div>
  );
}
