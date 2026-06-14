import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck, ShieldX, Gauge } from 'lucide-react';
import './ApiGatewayViz.css';

const SERVICES = [
  { key: 'Users', label: 'Users', code: 200, hue: 'var(--hue-sky)' },
  { key: 'Orders', label: 'Orders', code: 200, hue: 'var(--hue-violet)' },
  { key: 'Payments', label: 'Payments', code: 200, hue: 'var(--hue-pink)' },
  { key: 'Search', label: 'Search', code: 200, hue: 'var(--hue-mint)' },
];

const RATE_BUDGET = 5;

const W = 940;
const H = 470;

const CLIENT = { x: 70, y: 235, w: 120, h: 84 };
const GW = { x: 300, y: 120, w: 230, h: 230 };
const STAGE_KEYS = ['auth', 'rate', 'route'];
const STAGE_LABELS = { auth: 'AUTH', rate: 'RATE LIMIT', route: 'ROUTE' };
const stageBox = (i) => ({
  x: GW.x + 22,
  y: GW.y + 54 + i * 58,
  w: GW.w - 44,
  h: 44,
});
const svcBox = (i) => ({ x: 700, y: 60 + i * 96, w: 190, h: 72 });

function center(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

// Pure trace builder: produces one frame per hop of a single request.
function buildFrames(targetKey, authFail, rateOn, requestsSoFar) {
  const frames = [];
  const svcIndex = SERVICES.findIndex((s) => s.key === targetKey);
  const svc = SERVICES[svcIndex];
  const usedBefore = rateOn ? requestsSoFar : 0;

  const c = center(CLIENT);
  const sAuth = center(stageBox(0));
  const sRate = center(stageBox(1));
  const sRoute = center(stageBox(2));
  const dest = center(svcBox(svcIndex));
  const gwEntry = { x: GW.x, y: center(GW).y };

  const snap = (extra) => ({
    packet: { x: c.x, y: c.y },
    activeEdge: null,
    activeStage: null,
    destIndex: -1,
    delivered: false,
    rejected: false,
    status: '—',
    http: '—',
    hop: 'Client',
    rateUsed: usedBefore,
    note: '',
    ...extra,
  });

  frames.push(snap({
    packet: { x: c.x, y: c.y },
    hop: 'Client',
    status: 'request created',
    note: `Client builds a request for ${svc.label}. It will pass through the gateway before any backend sees it.`,
  }));

  frames.push(snap({
    packet: { x: gwEntry.x, y: gwEntry.y },
    activeEdge: 'client-gw',
    hop: 'Client -> Gateway',
    status: 'in flight to gateway',
    note: 'The request leaves the client and arrives at the API gateway edge — the single entry point in front of every service.',
  }));

  frames.push(snap({
    packet: { x: sAuth.x, y: sAuth.y },
    activeStage: 'auth',
    hop: 'Gateway · AUTH',
    status: 'authenticating',
    note: 'Gateway stage 1: verify the caller token / credentials before doing any routing work.',
  }));

  if (authFail) {
    frames.push(snap({
      packet: { x: sAuth.x, y: sAuth.y },
      activeStage: 'auth',
      rejected: true,
      http: '401',
      hop: 'Gateway · AUTH',
      status: 'rejected 401',
      note: 'Token invalid — the gateway returns 401 Unauthorized and drops the request. No backend service is ever reached.',
    }));
    frames.push(snap({
      packet: { x: c.x, y: c.y },
      activeEdge: 'gw-client',
      rejected: true,
      http: '401',
      hop: 'Client',
      status: '401 delivered',
      note: 'Client receives 401. The gateway protected every backend without a single service handling the bad request.',
    }));
    return frames;
  }

  frames.push(snap({
    packet: { x: sAuth.x, y: sAuth.y },
    activeStage: 'auth',
    http: '—',
    hop: 'Gateway · AUTH',
    status: 'auth OK',
    note: 'Credentials valid — the request advances to rate limiting.',
  }));

  const usedAfter = usedBefore + 1;
  const overLimit = rateOn && usedAfter > RATE_BUDGET;

  frames.push(snap({
    packet: { x: sRate.x, y: sRate.y },
    activeStage: 'rate',
    rateUsed: usedBefore,
    hop: 'Gateway · RATE LIMIT',
    status: rateOn ? `rate check ${Math.min(usedAfter, RATE_BUDGET)}/${RATE_BUDGET}` : 'rate check off',
    note: rateOn
      ? `Gateway stage 2: this caller has used ${usedBefore}/${RATE_BUDGET} of its budget. Checking whether one more is allowed.`
      : 'Gateway stage 2: rate limiting disabled for this run — the request passes straight through.',
  }));

  if (overLimit) {
    frames.push(snap({
      packet: { x: sRate.x, y: sRate.y },
      activeStage: 'rate',
      rejected: true,
      http: '429',
      rateUsed: RATE_BUDGET,
      hop: 'Gateway · RATE LIMIT',
      status: 'rejected 429',
      note: `Budget exhausted (${RATE_BUDGET}/${RATE_BUDGET}). Gateway returns 429 Too Many Requests and drops the request at the rate-limit stage.`,
    }));
    frames.push(snap({
      packet: { x: c.x, y: c.y },
      activeEdge: 'gw-client',
      rejected: true,
      http: '429',
      rateUsed: RATE_BUDGET,
      hop: 'Client',
      status: '429 delivered',
      note: 'Client receives 429. Shedding load at the gateway keeps the backends from being overwhelmed.',
    }));
    return frames;
  }

  frames.push(snap({
    packet: { x: sRate.x, y: sRate.y },
    activeStage: 'rate',
    rateUsed: usedAfter,
    hop: 'Gateway · RATE LIMIT',
    status: rateOn ? `within budget ${usedAfter}/${RATE_BUDGET}` : 'rate OK',
    note: rateOn
      ? `Within budget (${usedAfter}/${RATE_BUDGET}). The request advances to routing.`
      : 'Rate check passed — the request advances to routing.',
  }));

  frames.push(snap({
    packet: { x: sRoute.x, y: sRoute.y },
    activeStage: 'route',
    rateUsed: usedAfter,
    hop: 'Gateway · ROUTE',
    status: `routing to ${svc.label}`,
    note: `Gateway stage 3: match the path and forward to the ${svc.label} service. The client never learns the backend address.`,
  }));

  frames.push(snap({
    packet: { x: dest.x, y: dest.y },
    activeEdge: `gw-svc-${svcIndex}`,
    destIndex: svcIndex,
    rateUsed: usedAfter,
    hop: `${svc.label} service`,
    status: `${svc.label} responding ${svc.code}`,
    http: String(svc.code),
    note: `${svc.label} handles the request and returns ${svc.code}. The response now travels back through the gateway.`,
  }));

  frames.push(snap({
    packet: { x: c.x, y: c.y },
    activeEdge: 'gw-client',
    delivered: true,
    destIndex: svcIndex,
    rateUsed: usedAfter,
    http: String(svc.code),
    hop: 'Client',
    status: 'response delivered',
    note: `Response delivered to the client (${svc.code}). One gateway hop fronted auth, rate limiting, and routing for the whole call.`,
  }));

  return frames;
}

export default function ApiGatewayViz() {
  const [target, setTarget] = useState('Orders');
  const [authFail, setAuthFail] = useState(false);
  const [rateOn, setRateOn] = useState(false);
  const [requests, setRequests] = useState(0);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => buildFrames(target, authFail, rateOn, requests),
    [target, authFail, rateOn, requests],
  );
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

  const switchTarget = (k) => {
    if (k === target) return;
    setIsRunning(false);
    setStep(0);
    setTarget(k);
  };

  const toggleAuth = () => {
    setIsRunning(false);
    setStep(0);
    setAuthFail((v) => !v);
  };

  const toggleRate = () => {
    setIsRunning(false);
    setStep(0);
    setRateOn((v) => !v);
    setRequests(0);
  };

  // Commit a request to the rate budget once a run reaches its end, so the
  // budget visibly fills as successive requests are sent.
  const sendNext = () => {
    if (rateOn && !authFail && requests < RATE_BUDGET) {
      setRequests((r) => r + 1);
    }
    setStep(0);
    setIsRunning(true);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Send next' : 'Play');

  const onPlay = () => {
    if (step >= totalSteps - 1) {
      sendNext();
      return;
    }
    setIsRunning((v) => !v);
  };

  const c = center(CLIENT);
  const gwEntry = { x: GW.x, y: center(GW).y };
  const gwExit = { x: GW.x + GW.w, y: center(GW).y };

  const budgetLabel = rateOn ? `${current.rateUsed}/${RATE_BUDGET}` : 'off';
  const statusTone = current.rejected ? 'is-bad' : current.delivered ? 'is-good' : '';
  const httpTone = current.http === '401' || current.http === '429'
    ? 'is-bad'
    : current.http === '200'
      ? 'is-good'
      : '';

  return (
    <div className="agw">
      <div className="agw-head">
        <h3 className="agw-title">API gateway — one front door for every service</h3>
        <p className="agw-sub">
          Trace a request through auth, rate limiting, and routing before it fans out to a backend — and watch it
          get rejected when a check fails.
        </p>
      </div>

      <div className="agw-controls">
        <div className="agw-modes" role="tablist" aria-label="Destination service">
          {SERVICES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`agw-mode ${target === s.key ? 'is-on' : ''}`}
              onClick={() => switchTarget(s.key)}
              aria-pressed={target === s.key}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`agw-btn ${authFail ? 'is-on' : ''}`}
          onClick={toggleAuth}
          aria-pressed={authFail}
        >
          {authFail ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
          auth fail
        </button>

        <button
          type="button"
          className={`agw-btn ${rateOn ? 'is-on' : ''}`}
          onClick={toggleRate}
          aria-pressed={rateOn}
        >
          <Gauge size={14} /> rate limit
        </button>

        <label className="agw-speed">
          <span className="agw-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="agw-speed-range"
            aria-label="Playback speed"
          />
          <span className="agw-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="agw-spacer" aria-hidden="true" />

        <div className="agw-buttons">
          <button type="button" className="agw-btn agw-btn-primary" onClick={onPlay}>
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="agw-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="agw-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="agw-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="agw-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="agw-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="agw-svg" preserveAspectRatio="xMidYMid meet">
          <line
            className={`agw-edge ${current.activeEdge === 'client-gw' ? 'is-active' : ''} ${current.activeEdge === 'gw-client' ? 'is-return' : ''}`}
            x1={CLIENT.x + CLIENT.w}
            y1={c.y}
            x2={gwEntry.x}
            y2={gwEntry.y}
          />
          {SERVICES.map((s, i) => {
            const d = center(svcBox(i));
            const active = current.activeEdge === `gw-svc-${i}`;
            return (
              <line
                key={`edge-${s.key}`}
                className={`agw-edge ${active ? 'is-active' : ''}`}
                x1={gwExit.x}
                y1={gwExit.y}
                x2={svcBox(i).x}
                y2={d.y}
              />
            );
          })}

          <rect className="agw-node agw-node-client" x={CLIENT.x} y={CLIENT.y} width={CLIENT.w} height={CLIENT.h} rx={12} />
          <text className="agw-node-label" x={c.x} y={c.y - 6}>Client</text>
          <text className="agw-node-sub" x={c.x} y={c.y + 16}>caller</text>

          <rect
            className={`agw-gw ${current.rejected ? 'is-reject' : ''}`}
            x={GW.x}
            y={GW.y}
            width={GW.w}
            height={GW.h}
            rx={14}
          />
          <text className="agw-gw-title" x={center(GW).x} y={GW.y + 30}>API Gateway</text>
          {STAGE_KEYS.map((sk, i) => {
            const b = stageBox(i);
            const on = current.activeStage === sk;
            const bad = on && current.rejected;
            const cls = ['agw-stage-box', on && (bad ? 'is-reject' : 'is-on')].filter(Boolean).join(' ');
            return (
              <g key={`stage-${sk}`}>
                <rect className={cls} x={b.x} y={b.y} width={b.w} height={b.h} rx={8} />
                <text className="agw-stage-label" x={b.x + b.w / 2} y={b.y + b.h / 2 + 4}>{STAGE_LABELS[sk]}</text>
                {i < STAGE_KEYS.length - 1 && (
                  <path
                    className="agw-stage-arrow"
                    d={`M ${b.x + b.w / 2} ${b.y + b.h + 2} l -5 0 l 5 8 l 5 -8 z`}
                  />
                )}
              </g>
            );
          })}

          {SERVICES.map((s, i) => {
            const b = svcBox(i);
            const sc = center(b);
            const arrived = current.destIndex === i && (current.delivered || current.activeEdge === `gw-svc-${i}`);
            return (
              <g key={`svc-${s.key}`}>
                <rect
                  className={`agw-svc ${arrived ? 'is-active' : ''}`}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={10}
                  style={{ stroke: arrived ? s.hue : undefined }}
                />
                <circle className="agw-svc-dot" cx={b.x + 18} cy={sc.y} r={6} style={{ fill: s.hue }} />
                <text className="agw-svc-label" x={b.x + 34} y={sc.y - 3}>{s.label}</text>
                <text className="agw-svc-sub" x={b.x + 34} y={sc.y + 16}>service</text>
              </g>
            );
          })}

          <circle
            className={`agw-packet ${current.rejected ? 'is-reject' : ''} ${current.delivered ? 'is-delivered' : ''}`}
            cx={current.packet.x}
            cy={current.packet.y}
            r={11}
          />
          <text className="agw-packet-tag" x={current.packet.x} y={current.packet.y - 18}>
            {current.http !== '—' ? current.http : 'req'}
          </text>
        </svg>
      </div>

      <div className="agw-metrics">
        <div className="agw-metric">
          <span className="agw-metric-label">current hop</span>
          <span className="agw-metric-value">{current.hop}</span>
        </div>
        <div className="agw-metric">
          <span className="agw-metric-label">status</span>
          <span className={`agw-metric-value ${statusTone}`}>{current.status}</span>
        </div>
        <div className="agw-metric">
          <span className="agw-metric-label">http</span>
          <span className={`agw-metric-value ${httpTone}`}>{current.http}</span>
        </div>
        <div className="agw-metric">
          <span className="agw-metric-label">target</span>
          <span className="agw-metric-value">{target}</span>
        </div>
        <div className="agw-metric">
          <span className="agw-metric-label">rate budget</span>
          <span className={`agw-metric-value ${rateOn && current.rateUsed >= RATE_BUDGET ? 'is-bad' : ''}`}>
            {budgetLabel}
          </span>
        </div>
      </div>

      <div className="agw-narration">
        <span className="agw-narration-label">trace</span>
        <span className="agw-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
