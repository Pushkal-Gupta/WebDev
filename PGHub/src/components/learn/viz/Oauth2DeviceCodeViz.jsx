import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Tv, Smartphone, Server, Clock, Check, KeyRound, RefreshCw,
} from 'lucide-react';
import './Oauth2DeviceCodeViz.css';

// OAuth 2.0 Device Authorization Grant (RFC 8628) — how a device with no
// keyboard or browser (TV, CLI, IoT) gets a user-scoped token. Three actors:
//   Device          the input-constrained client (a TV).
//   Auth Server     issues the device_code, user_code, and finally the token.
//   User's phone    a second screen where the human actually logs in + approves.
//
// The flow the reader should leave with:
//   1. Device -> AS: "I want to authorize." AS returns a device_code (secret,
//      machine-facing), a user_code (short, human-facing), and a verification
//      URL. The device shows the short user_code on screen.
//   2. The user opens the URL on their phone, types the user_code, signs in, and
//      approves the scopes. The device is NOT involved in this — the credential
//      never touches the constrained device.
//   3. Meanwhile the device POLLS the token endpoint with its device_code. While
//      the user hasn't finished, the AS answers authorization_pending; if the
//      device polls too fast it answers slow_down (back off the interval). Once
//      the user approves, the next poll returns the access token.
//
// Interactive: step the flow, and a toggle makes the device poll too fast so the
// reader sees the slow_down response and the interval increasing.

const PHASE_LABEL = {
  init: 'setup',
  device_req: 'device request',
  device_resp: 'codes issued',
  show_code: 'show user code',
  user_open: 'user opens URL',
  poll_pending: 'poll → pending',
  poll_slow: 'poll → slow_down',
  user_approve: 'user approves',
  poll_granted: 'poll → token',
  done: 'authorized',
};

const USER_CODE = 'WDJB-MJHT';
const DEVICE_CODE = 'dc_9f2a…e71';
const VERIFY_URL = 'example.com/device';

// Build frames. `tooFast` injects an extra slow_down round when the device polls
// faster than the server's interval.
function buildFrames(tooFast) {
  const frames = [];
  const base = {
    phase: 'init',
    deviceState: 'idle',
    phoneState: 'idle',
    msg: null, // { from, to, label, tone }
    interval: 5,
    polls: 0,
    note: '',
  };

  frames.push({
    ...base,
    note: `A TV needs a user-scoped token but has no keyboard or browser. OAuth's device flow splits the job: the device gets codes from the auth server and shows a short user code, the human approves on their phone, and the device polls in the background until a token appears.${tooFast ? ' Polling is set too fast, so the server will answer slow_down.' : ''} Step through it.`,
  });

  frames.push({
    ...base,
    phase: 'device_req',
    deviceState: 'requesting',
    msg: { from: 'device', to: 'as', label: 'POST /device_authorization', tone: 'fwd' },
    note: 'The device asks the auth server to start a device authorization. It sends its client_id and the scopes it wants. No user is involved yet — this is machine-to-machine.',
  });

  frames.push({
    ...base,
    phase: 'device_resp',
    deviceState: 'has_codes',
    msg: { from: 'as', to: 'device', label: 'device_code, user_code, verification_uri, interval=5', tone: 'back' },
    interval: 5,
    note: `The server returns four things: a secret device_code the device keeps, a short user_code "${USER_CODE}" the human will type, a verification URL, and a polling interval (5s). The device_code never leaves the device; the user_code is the only thing a person handles.`,
  });

  frames.push({
    ...base,
    phase: 'show_code',
    deviceState: 'showing',
    note: `The device displays "Go to ${VERIFY_URL} and enter ${USER_CODE}". That is all an input-constrained device can do — surface a short code and a URL for the user to take to a real browser.`,
  });

  frames.push({
    ...base,
    phase: 'user_open',
    deviceState: 'showing',
    phoneState: 'opened',
    msg: { from: 'phone', to: 'as', label: `GET ${VERIFY_URL} + enter ${USER_CODE}`, tone: 'user' },
    note: `On their phone, the user opens the verification URL and types ${USER_CODE}. This screen has a full browser, so the user signs in normally — the device is completely out of this loop and never sees the password.`,
  });

  frames.push({
    ...base,
    phase: 'poll_pending',
    deviceState: 'polling',
    phoneState: 'signing_in',
    msg: { from: 'device', to: 'as', label: 'POST /token (device_code) → authorization_pending', tone: 'pending' },
    interval: 5,
    polls: 1,
    note: 'In parallel, the device starts polling the token endpoint with its device_code. The user has not finished approving, so the server answers error=authorization_pending. The device waits one interval and tries again — that is the whole polling loop.',
  });

  if (tooFast) {
    frames.push({
      ...base,
      phase: 'poll_slow',
      deviceState: 'polling',
      phoneState: 'signing_in',
      msg: { from: 'device', to: 'as', label: 'POST /token (too soon) → slow_down', tone: 'slow' },
      interval: 10,
      polls: 2,
      note: 'The device polled again before the 5s interval elapsed. The server pushes back with error=slow_down, and the client must ADD to its interval — here it jumps from 5s to 10s. Respecting slow_down is mandatory; ignoring it gets the device rate-limited or rejected.',
    });
  }

  frames.push({
    ...base,
    phase: 'user_approve',
    deviceState: 'polling',
    phoneState: 'approved',
    msg: { from: 'phone', to: 'as', label: 'approve scopes', tone: 'user' },
    interval: tooFast ? 10 : 5,
    polls: tooFast ? 2 : 1,
    note: 'On the phone the user reviews the requested scopes and taps Approve. The auth server now binds the approval to the device_code it issued earlier — the device, still polling, is about to get a different answer.',
  });

  frames.push({
    ...base,
    phase: 'poll_granted',
    deviceState: 'granted',
    phoneState: 'approved',
    msg: { from: 'device', to: 'as', label: 'POST /token (device_code) → access_token', tone: 'granted' },
    interval: tooFast ? 10 : 5,
    polls: tooFast ? 3 : 2,
    note: 'On its next poll the device sends the same device_code, and because the user has approved, the server finally returns an access_token (and usually a refresh_token). The pending → granted transition is the moment the loop ends.',
  });

  frames.push({
    ...base,
    phase: 'done',
    deviceState: 'granted',
    phoneState: 'approved',
    interval: tooFast ? 10 : 5,
    polls: tooFast ? 3 : 2,
    note: 'Authorized. The TV holds a user-scoped token it earned without ever rendering a login form — the human authenticated on a capable second screen, and the device only ever handled opaque codes. That separation is what makes the device flow safe for keyboard-less clients.',
  });

  return frames;
}

const RUN_DELAY_MS = 1600;

export default function Oauth2DeviceCodeViz() {
  const [tooFast, setTooFast] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(tooFast), [tooFast]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

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

  const reset = () => { setIsRunning(false); setStep(0); };
  const toggleFast = () => {
    setIsRunning(false);
    setStep(0);
    setTooFast((v) => !v);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ---- SVG geometry: three lanes (device, auth server, phone) ----
  const W = 940;
  const H = 380;
  const laneY = {
    device: 110,
    as: 235,
    phone: 110,
  };
  const deviceX = 130;
  const asX = 470;
  const phoneX = 810;
  const boxW = 150;
  const boxH = 88;

  const granted = current.deviceState === 'granted';

  // message arrow between actors
  const actorXY = (key) => {
    if (key === 'device') return { x: deviceX, y: laneY.device };
    if (key === 'phone') return { x: phoneX, y: laneY.phone };
    return { x: asX, y: laneY.as };
  };

  const msg = current.msg;
  let arrow = null;
  if (msg) {
    const a = actorXY(msg.from);
    const b = actorXY(msg.to);
    arrow = { a, b, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  }

  return (
    <div className="odcv">
      <div className="odcv-head">
        <h3 className="odcv-title">OAuth device flow — a token for a screen with no keyboard</h3>
        <p className="odcv-sub">
          The device shows a short code, the user approves on their phone, and the device polls in the
          background until the token appears. Toggle fast polling to see the server answer slow_down and
          the interval back off.
        </p>
      </div>

      <div className="odcv-controls">
        <button
          type="button"
          className={`odcv-toggle ${tooFast ? 'is-on is-warn' : ''}`}
          onClick={toggleFast}
          aria-pressed={tooFast}
          title="Make the device poll faster than the server interval"
        >
          {tooFast ? <RefreshCw size={13} /> : <Clock size={13} />}
          poll too fast {tooFast ? 'on' : 'off'}
        </button>

        <span className={`odcv-tag ${tooFast ? 'is-warn' : ''}`}>
          {tooFast ? 'expect slow_down' : 'respects interval'}
        </span>

        <span className="odcv-tag">
          <RefreshCw size={11} /> interval {current.interval}s · polls {current.polls}
        </span>

        <label className="odcv-speed">
          <span className="odcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="odcv-speed-range"
            aria-label="Playback speed"
          />
          <span className="odcv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="odcv-spacer" aria-hidden="true" />

        <div className="odcv-buttons">
          <button
            type="button"
            className="odcv-btn odcv-btn-primary"
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
            className="odcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="odcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="odcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="odcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="odcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="odcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            {['fwd', 'back', 'user', 'pending', 'slow', 'granted'].map((t) => (
              <marker key={t} id={`odcv-arr-${t}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className={`odcv-ah is-${t}`} />
              </marker>
            ))}
          </defs>

          {/* message arrow */}
          {arrow && (
            <g>
              <line
                className={`odcv-msg is-${msg.tone}`}
                x1={arrow.a.x + (arrow.b.x >= arrow.a.x ? boxW / 2 : -boxW / 2)}
                y1={arrow.a.y}
                x2={arrow.b.x + (arrow.b.x >= arrow.a.x ? -boxW / 2 - 8 : boxW / 2 + 8)}
                y2={arrow.b.y}
                markerEnd={`url(#odcv-arr-${msg.tone})`}
              />
              <rect
                className={`odcv-msg-pill is-${msg.tone}`}
                x={arrow.mid.x - 165}
                y={arrow.mid.y - 14}
                width={330}
                height={28}
                rx={6}
              />
              <text className={`odcv-msg-label is-${msg.tone}`} x={arrow.mid.x} y={arrow.mid.y + 4} textAnchor="middle">
                {msg.label}
              </text>
            </g>
          )}

          {/* device box (TV) */}
          <g>
            <rect className={`odcv-actor ${current.deviceState !== 'idle' ? 'is-on' : ''} ${granted ? 'is-done' : ''}`} x={deviceX - boxW / 2} y={laneY.device - boxH / 2} width={boxW} height={boxH} rx={10} />
            <g transform={`translate(${deviceX - 11}, ${laneY.device - boxH / 2 + 10})`}>
              <Tv width={22} height={22} className={`odcv-actor-ic ${granted ? 'is-done' : ''}`} />
            </g>
            <text className="odcv-actor-label" x={deviceX} y={laneY.device + 6} textAnchor="middle">Device (TV)</text>
            {current.deviceState === 'showing' && (
              <text className="odcv-actor-code" x={deviceX} y={laneY.device + 26} textAnchor="middle">{USER_CODE}</text>
            )}
            {current.deviceState === 'polling' && (
              <text className="odcv-actor-sub" x={deviceX} y={laneY.device + 26} textAnchor="middle">polling…</text>
            )}
            {granted && (
              <text className="odcv-actor-sub is-done" x={deviceX} y={laneY.device + 26} textAnchor="middle">token held</text>
            )}
            {current.deviceState === 'has_codes' && (
              <text className="odcv-actor-sub" x={deviceX} y={laneY.device + 26} textAnchor="middle">{DEVICE_CODE}</text>
            )}
          </g>

          {/* auth server box */}
          <g>
            <rect className={`odcv-actor is-as ${msg ? 'is-on' : ''}`} x={asX - boxW / 2} y={laneY.as - boxH / 2} width={boxW} height={boxH} rx={10} />
            <g transform={`translate(${asX - 11}, ${laneY.as - boxH / 2 + 10})`}>
              <Server width={22} height={22} className="odcv-actor-ic is-as" />
            </g>
            <text className="odcv-actor-label" x={asX} y={laneY.as + 6} textAnchor="middle">Auth Server</text>
            <text className="odcv-actor-sub" x={asX} y={laneY.as + 26} textAnchor="middle">/device · /token</text>
          </g>

          {/* phone box */}
          <g>
            <rect className={`odcv-actor is-phone ${current.phoneState !== 'idle' ? 'is-on' : ''} ${current.phoneState === 'approved' ? 'is-done' : ''}`} x={phoneX - boxW / 2} y={laneY.phone - boxH / 2} width={boxW} height={boxH} rx={10} />
            <g transform={`translate(${phoneX - 11}, ${laneY.phone - boxH / 2 + 10})`}>
              <Smartphone width={22} height={22} className={`odcv-actor-ic is-phone ${current.phoneState === 'approved' ? 'is-done' : ''}`} />
            </g>
            <text className="odcv-actor-label" x={phoneX} y={laneY.phone + 6} textAnchor="middle">User&rsquo;s phone</text>
            <text className={`odcv-actor-sub ${current.phoneState === 'approved' ? 'is-done' : ''}`} x={phoneX} y={laneY.phone + 26} textAnchor="middle">
              {current.phoneState === 'approved' ? 'approved' : current.phoneState === 'signing_in' ? 'signing in…' : current.phoneState === 'opened' ? 'entered code' : 'idle'}
            </text>
          </g>
        </svg>
      </div>

      <div className="odcv-metrics">
        <div className="odcv-metric">
          <span className="odcv-metric-label">phase</span>
          <span className="odcv-metric-value">{PHASE_LABEL[current.phase] || current.phase}</span>
        </div>
        <div className="odcv-metric">
          <span className="odcv-metric-label">poll interval</span>
          <span className={`odcv-metric-value ${current.phase === 'poll_slow' ? 'is-warn' : ''}`}>{`${current.interval}s`}</span>
        </div>
        <div className="odcv-metric">
          <span className="odcv-metric-label">poll attempts</span>
          <span className="odcv-metric-value">{current.polls}</span>
        </div>
        <div className="odcv-metric">
          <span className="odcv-metric-label">user code</span>
          <span className="odcv-metric-value">{USER_CODE}</span>
        </div>
        <div className="odcv-metric odcv-metric-dim">
          <span className="odcv-metric-label">token</span>
          <span className={`odcv-metric-value ${granted ? 'is-ok' : ''}`}>{granted ? 'granted' : 'not yet'}</span>
        </div>
      </div>

      <div className={`odcv-narration ${granted ? 'is-ok' : current.phase === 'poll_slow' ? 'is-warn' : ''}`}>
        <span className={`odcv-narration-label ${granted ? 'is-ok' : current.phase === 'poll_slow' ? 'is-warn' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="odcv-narration-body">{current.note}</span>
      </div>

      <div className="odcv-legend">
        <span className="odcv-legend-item"><KeyRound size={13} className="odcv-ic is-as" /> device_code — secret, never shown to the user</span>
        <span className="odcv-legend-item"><Smartphone size={13} className="odcv-ic is-phone" /> user_code — short, approved on a second screen</span>
        <span className="odcv-legend-item"><Clock size={13} className="odcv-ic is-warn" /> slow_down — back off the polling interval</span>
        <span className="odcv-legend-item"><Check size={13} className="odcv-ic is-ok" /> pending → token once the user approves</span>
      </div>
    </div>
  );
}
