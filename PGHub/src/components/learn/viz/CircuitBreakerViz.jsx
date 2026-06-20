import React, { useMemo, useState } from 'react';
import { Send, Clock, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import './CircuitBreakerViz.css';

// Circuit-breaker state machine: CLOSED -> OPEN -> HALF-OPEN -> (CLOSED | OPEN).
// Requests are graded by a seeded LCG so the trace is reproducible. Failures in
// CLOSED accumulate; hitting the threshold trips the breaker OPEN and starts a
// cooldown. While OPEN, calls are short-circuited. After enough cooldown ticks
// (>= timeout) the breaker moves to HALF-OPEN and admits one trial request:
// success closes it again, failure re-opens and restarts the cooldown.

const SEED = 1337;

// Park–Miller minimal-standard LCG -> deterministic [0,1).
function lcgNext(state) {
  const next = (state * 1103515245 + 12345) & 0x7fffffff;
  return { state: next, value: next / 0x7fffffff };
}

const STATES = {
  CLOSED: { key: 'CLOSED', label: 'CLOSED', token: 'easy', blurb: 'requests pass through' },
  OPEN: { key: 'OPEN', label: 'OPEN', token: 'hard', blurb: 'short-circuit, reject fast' },
  HALF: { key: 'HALF', label: 'HALF-OPEN', token: 'warning', blurb: 'one trial request' },
};

const LOG_MAX = 6;
// Request success probability (seeded). Low enough that CLOSED trips with a few clicks.
const SUCCESS_P = 0.55;

const initialMachine = () => ({
  state: 'CLOSED',
  failures: 0,
  cooldown: 0,
  rng: SEED,
  totalReq: 0,
  shortCircuited: 0,
  trips: 0,
  pulse: 0,
  log: [],
});

export default function CircuitBreakerViz() {
  const [threshold, setThreshold] = useState(3);
  const [timeout, setTimeoutTicks] = useState(4);
  const [m, setM] = useState(initialMachine);
  const [note, setNote] = useState(
    'CLOSED. Requests flow straight through. Each failure bumps the counter; reach the threshold and the breaker trips OPEN.',
  );

  const pushLog = (log, entry) => [entry, ...log].slice(0, LOG_MAX);

  const sendRequest = () => {
    setM((prev) => {
      const { state: rngState, value } = lcgNext(prev.rng);
      const next = { ...prev, rng: rngState, totalReq: prev.totalReq + 1, pulse: prev.pulse + 1 };

      if (prev.state === 'OPEN') {
        next.shortCircuited = prev.shortCircuited + 1;
        next.log = pushLog(prev.log, { kind: 'short', text: `#${next.totalReq} short-circuited` });
        setNote(
          `OPEN: request #${next.totalReq} is rejected immediately without touching the backend. `
          + `Wait out the cooldown (${prev.cooldown}/${timeout}) to reach HALF-OPEN.`,
        );
        return next;
      }

      const success = value < SUCCESS_P;

      if (prev.state === 'CLOSED') {
        if (success) {
          next.failures = 0;
          next.log = pushLog(prev.log, { kind: 'ok', text: `#${next.totalReq} success` });
          setNote(`CLOSED: request #${next.totalReq} succeeded. Failure counter resets to 0.`);
        } else {
          next.failures = prev.failures + 1;
          if (next.failures >= threshold) {
            next.state = 'OPEN';
            next.cooldown = 0;
            next.trips = prev.trips + 1;
            next.log = pushLog(prev.log, { kind: 'trip', text: `#${next.totalReq} fail -> TRIP` });
            setNote(
              `CLOSED: request #${next.totalReq} failed -> ${next.failures}/${threshold}. `
              + `Threshold hit -> breaker trips OPEN and starts the cooldown timer.`,
            );
          } else {
            next.log = pushLog(prev.log, { kind: 'fail', text: `#${next.totalReq} fail (${next.failures}/${threshold})` });
            setNote(
              `CLOSED: request #${next.totalReq} failed -> failures ${next.failures}/${threshold}. `
              + `One more away from tripping? Keep going.`,
            );
          }
        }
        return next;
      }

      // HALF-OPEN: a single trial request decides the outcome.
      if (success) {
        next.state = 'CLOSED';
        next.failures = 0;
        next.cooldown = 0;
        next.log = pushLog(prev.log, { kind: 'ok', text: `#${next.totalReq} trial OK -> CLOSE` });
        setNote(
          `HALF-OPEN: trial request #${next.totalReq} succeeded -> backend looks healthy -> `
          + `breaker CLOSES and the failure counter resets.`,
        );
      } else {
        next.state = 'OPEN';
        next.cooldown = 0;
        next.trips = prev.trips + 1;
        next.log = pushLog(prev.log, { kind: 'trip', text: `#${next.totalReq} trial fail -> OPEN` });
        setNote(
          `HALF-OPEN: trial request #${next.totalReq} failed -> still unhealthy -> `
          + `breaker re-OPENS and restarts the cooldown.`,
        );
      }
      return next;
    });
  };

  const waitTick = () => {
    setM((prev) => {
      if (prev.state !== 'OPEN') {
        setNote('Cooldown only ticks while the breaker is OPEN. Send a request to drive the machine.');
        return prev;
      }
      const cd = prev.cooldown + 1;
      const next = { ...prev, pulse: prev.pulse + 1 };
      if (cd >= timeout) {
        next.state = 'HALF';
        next.cooldown = 0;
        next.log = pushLog(prev.log, { kind: 'half', text: 'cooldown done -> HALF-OPEN' });
        setNote(
          `Cooldown elapsed (${timeout}/${timeout}) -> breaker moves to HALF-OPEN. `
          + `It will admit ONE trial request to probe the backend.`,
        );
      } else {
        next.cooldown = cd;
        setNote(`OPEN: cooldown tick ${cd}/${timeout}. At ${timeout} the breaker probes with HALF-OPEN.`);
      }
      return next;
    });
  };

  const reset = () => {
    setM(initialMachine());
    setNote(
      'CLOSED. Requests flow straight through. Each failure bumps the counter; reach the threshold and the breaker trips OPEN.',
    );
  };

  const cur = STATES[m.state];

  // SVG geometry
  const W = 940;
  const H = 360;
  const nodeR = 52;
  const nodes = useMemo(() => ({
    CLOSED: { x: 170, y: 130, ...STATES.CLOSED },
    OPEN: { x: W - 170, y: 130, ...STATES.OPEN },
    HALF: { x: W / 2, y: 290, ...STATES.HALF },
  }), []);

  // Edge helper: line between two node rims with a labelled arrowhead.
  const edge = (from, to, label, active, dyLabel = -10, curve = 0) => {
    const a = nodes[from];
    const b = nodes[to];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const x1 = a.x + ux * nodeR;
    const y1 = a.y + uy * nodeR;
    const x2 = b.x - ux * nodeR;
    const y2 = b.y - uy * nodeR;
    const mx = (x1 + x2) / 2 + (uy * curve);
    const my = (y1 + y2) / 2 - (ux * curve);
    const d = curve
      ? `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
      : `M ${x1} ${y1} L ${x2} ${y2}`;
    // arrowhead at the target end
    const ax = x2;
    const ay = y2;
    const head = 9;
    const baseX = curve ? (x2 - (x2 - mx)) : x2 - ux * head;
    const baseY = curve ? (y2 - (y2 - my)) : y2 - uy * head;
    const hx = ax - baseX;
    const hy = ay - baseY;
    const hlen = Math.hypot(hx, hy) || 1;
    const nhx = hx / hlen;
    const nhy = hy / hlen;
    const perpX = -nhy;
    const perpY = nhx;
    const tip1x = ax - nhx * head + perpX * (head * 0.6);
    const tip1y = ay - nhy * head + perpY * (head * 0.6);
    const tip2x = ax - nhx * head - perpX * (head * 0.6);
    const tip2y = ay - nhy * head - perpY * (head * 0.6);
    return (
      <g className={`cbv-edge-g ${active ? 'is-active' : ''}`}>
        <path className={`cbv-edge ${active ? 'is-active' : ''}`} d={d} fill="none" />
        <path
          className={`cbv-edge-head ${active ? 'is-active' : ''}`}
          d={`M ${ax} ${ay} L ${tip1x} ${tip1y} L ${tip2x} ${tip2y} Z`}
        />
        <text
          className={`cbv-edge-label ${active ? 'is-active' : ''}`}
          x={mx}
          y={my + dyLabel}
          textAnchor="middle"
        >
          {label}
        </text>
      </g>
    );
  };

  const renderNode = (key) => {
    const n = nodes[key];
    const isCur = m.state === key;
    return (
      <g key={`node-${key}`} className={`cbv-node-g ${isCur ? 'is-cur' : ''}`}>
        <circle
          className={`cbv-node tok-${n.token} ${isCur ? 'is-cur' : ''}`}
          cx={n.x}
          cy={n.y}
          r={nodeR}
          style={isCur ? { animationDuration: '0.6s' } : undefined}
        />
        <text className={`cbv-node-label ${isCur ? 'is-cur' : ''}`} x={n.x} y={n.y - 2} textAnchor="middle">
          {n.label}
        </text>
        <text className="cbv-node-sub" x={n.x} y={n.y + 16} textAnchor="middle">
          {n.blurb}
        </text>
      </g>
    );
  };

  return (
    <div className="cbv">
      <div className="cbv-head">
        <h3 className="cbv-title">Circuit breaker — CLOSED · OPEN · HALF-OPEN</h3>
        <p className="cbv-sub">
          Fire requests at a flaky backend (graded by a seeded RNG). Watch failures pile up, trip the breaker
          OPEN, wait out the cooldown into HALF-OPEN, then let one trial request close or re-open it.
        </p>
      </div>

      <div className="cbv-controls">
        <label className="cbv-slider">
          <span className="cbv-input-label">threshold</span>
          <input
            type="range" min={1} max={6} step={1} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="cbv-range" aria-label="Failure threshold"
          />
          <span className="cbv-slider-val">{threshold}</span>
        </label>
        <label className="cbv-slider">
          <span className="cbv-input-label">timeout</span>
          <input
            type="range" min={1} max={8} step={1} value={timeout}
            onChange={(e) => setTimeoutTicks(Number(e.target.value))}
            className="cbv-range" aria-label="Cooldown timeout ticks"
          />
          <span className="cbv-slider-val">{timeout}</span>
        </label>

        <span className="cbv-spacer" aria-hidden="true" />

        <div className="cbv-buttons">
          <button type="button" className="cbv-btn cbv-btn-primary" onClick={sendRequest}>
            <Send size={14} /> Send request
          </button>
          <button
            type="button"
            className="cbv-btn"
            onClick={waitTick}
            disabled={m.state !== 'OPEN'}
          >
            <Clock size={14} /> Wait (cooldown tick)
          </button>
          <button type="button" className="cbv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="cbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cbv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="cbv-row-label" x={36} y={28}>state machine — highlighted node is the current state</text>

          {/* edges */}
          {edge('CLOSED', 'OPEN', 'failures ≥ threshold', m.state === 'OPEN' && m.cooldown === 0, -12, 0)}
          {edge('OPEN', 'HALF', 'cooldown elapsed', m.state === 'HALF', 14, 46)}
          {edge('HALF', 'CLOSED', 'trial success', m.state === 'CLOSED' && m.totalReq > 0, -10, 46)}
          {edge('HALF', 'OPEN', 'trial failure', m.state === 'OPEN' && m.cooldown === 0, -10, 46)}

          {/* nodes */}
          {['CLOSED', 'OPEN', 'HALF'].map((k) => renderNode(k))}

          {/* current-state badge */}
          <g>
            <rect
              className={`cbv-badge-box tok-${cur.token}`}
              x={W / 2 - 110}
              y={42}
              width={220}
              height={48}
              rx={10}
            />
            <text className={`cbv-badge-label tok-${cur.token}`} x={W / 2} y={64} textAnchor="middle">
              {cur.label}
            </text>
            <text className="cbv-badge-sub" x={W / 2} y={82} textAnchor="middle">
              {m.state === 'OPEN'
                ? `cooldown ${m.cooldown} / ${timeout}`
                : m.state === 'CLOSED'
                  ? `failures ${m.failures} / ${threshold}`
                  : 'awaiting trial request'}
            </text>
          </g>

          {/* failure meter (CLOSED) / cooldown meter (OPEN) on the right */}
          <g>
            <text className="cbv-meter-label" x={W - 36} y={232} textAnchor="end">
              {m.state === 'OPEN' ? 'cooldown' : 'failures'}
            </text>
            {Array.from({ length: m.state === 'OPEN' ? timeout : threshold }).map((_, i) => {
              const filled = m.state === 'OPEN' ? i < m.cooldown : i < m.failures;
              const cellW = 22;
              const gap = 6;
              const total = (m.state === 'OPEN' ? timeout : threshold) * (cellW + gap) - gap;
              const x0 = W - 36 - total;
              return (
                <rect
                  key={`meter-${i}`}
                  className={`cbv-meter-cell ${filled ? 'is-filled' : ''} ${m.state === 'OPEN' ? 'is-cd' : ''}`}
                  x={x0 + i * (cellW + gap)}
                  y={242}
                  width={cellW}
                  height={22}
                  rx={4}
                />
              );
            })}
          </g>

          {/* request log as SVG chips (no scrollable list) */}
          <g>
            <text className="cbv-log-title" x={36} y={232}>recent events</text>
            {m.log.length === 0 && (
              <text className="cbv-log-empty" x={36} y={258}>no requests yet — press Send request</text>
            )}
            {m.log.map((ev, i) => (
              <g key={`log-${m.totalReq}-${i}`} className="cbv-log-row">
                <rect
                  className={`cbv-log-chip kind-${ev.kind}`}
                  x={36}
                  y={244 + i * 17}
                  width={360}
                  height={14}
                  rx={4}
                />
                <text className={`cbv-log-text kind-${ev.kind}`} x={44} y={254 + i * 17}>
                  {ev.text}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="cbv-metrics">
        <div className="cbv-metric">
          <span className="cbv-metric-label">state</span>
          <span className={`cbv-metric-value tok-${cur.token}`}>{cur.label}</span>
        </div>
        <div className="cbv-metric">
          <span className="cbv-metric-label">failures</span>
          <span className="cbv-metric-value">{m.failures} / {threshold}</span>
        </div>
        <div className="cbv-metric">
          <span className="cbv-metric-label">cooldown</span>
          <span className="cbv-metric-value">{m.state === 'OPEN' ? `${m.cooldown} / ${timeout}` : '—'}</span>
        </div>
        <div className="cbv-metric">
          <span className="cbv-metric-label">requests</span>
          <span className="cbv-metric-value">{m.totalReq}</span>
        </div>
        <div className="cbv-metric">
          <span className="cbv-metric-label">short-circuited</span>
          <span className="cbv-metric-value tok-hard">{m.shortCircuited}</span>
        </div>
        <div className="cbv-metric">
          <span className="cbv-metric-label">trips</span>
          <span className="cbv-metric-value tok-warning">{m.trips}</span>
        </div>
      </div>

      <div className="cbv-narration">
        <span className="cbv-narration-label">
          {m.state === 'OPEN' ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
          trace
        </span>
        <span className="cbv-narration-body">{note}</span>
      </div>
    </div>
  );
}
