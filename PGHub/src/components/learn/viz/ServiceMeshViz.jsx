import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Server, Shield, Lock, RefreshCw, AlertTriangle, Check,
  Settings, ArrowLeftRight, Zap,
} from 'lucide-react';
import './ServiceMeshViz.css';

// A service mesh: two app services (A and B), each wrapped by its OWN sidecar
// proxy (the data plane), plus a central CONTROL PLANE. Every request leaves
// the app as a plain local call into its sidecar; the sidecars carry it across
// the network with mTLS, retries, load-balancing, and metrics — none of which
// the app code knows about. The control plane pushes config (retry policy,
// routing) DOWN to the sidecars without touching or redeploying the app.
//
// THREE SCENARIOS:
//   healthy  — A's app calls A's sidecar; the sidecar opens an mTLS tunnel to
//              B's sidecar; B's sidecar hands the request to B's app; the reply
//              flows back the same path. The app sent one plain call.
//   fault    — B is failing. B's sidecar returns errors; A's sidecar RETRIES
//              (with backoff). After N consecutive failures it trips the CIRCUIT
//              BREAKER and fails fast — no more doomed calls hammer B. The app
//              code never changed; the sidecar absorbed the fault.
//   config   — The control plane pushes a new retry policy + routing rule DOWN
//              to every sidecar over the config channel. The proxies reconfigure
//              live; the app processes are never restarted or edited.

const MAX_RETRIES = 3; // attempts before the circuit trips

function snap(extra) {
  return {
    phase: 'idle',
    note: '',
    // request token position along the path. null = nothing in flight.
    // 'appA' | 'sidecarA' | 'wire-out' | 'sidecarB' | 'appB' | 'wire-back' | 'done'
    token: null,
    dir: 'out', // 'out' | 'back'
    mtls: false, // is the A<->B tunnel encrypted right now
    bDown: false, // is service B injected-faulty
    attempt: 0, // current retry attempt number (0 = first try)
    retries: 0, // cumulative retries this scenario
    circuit: 'closed', // 'closed' | 'open'
    completed: 0,
    failed: 0,
    configPush: null, // null | 'sidecarA' | 'sidecarB' | 'both' — which sidecars are receiving config
    retryPolicy: 'retries 3, timeout 2s', // live policy on the sidecars
    routeRule: 'route v1 100%',
    ...extra,
  };
}

function carry(prev, extra) {
  // carry forward cumulative counters + sticky config so frames build a story.
  return snap({
    completed: prev.completed,
    failed: prev.failed,
    retries: prev.retries,
    circuit: prev.circuit,
    bDown: prev.bDown,
    retryPolicy: prev.retryPolicy,
    routeRule: prev.routeRule,
    ...extra,
  });
}

function buildHealthy() {
  const frames = [];
  let p = snap({
    phase: 'init',
    note: 'Service A wants to call Service B. Neither app speaks TLS, retries, or load-balancing itself — each runs beside a sidecar proxy that does all of it. Watch one request leave A as a plain local call and come back, fully secured, without the app knowing.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'app-out', token: 'appA', dir: 'out',
    note: 'A\'s application code makes an ordinary call to "service-b" on localhost. As far as the app is concerned this is a plain HTTP request to a neighbour — no certificates, no retry logic, no service discovery in the app at all.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'intercept', token: 'sidecarA', dir: 'out',
    note: 'A\'s sidecar transparently intercepts the outbound call. It resolves where Service B lives, picks a healthy instance (load-balancing), and prepares to open a secure tunnel. The app already moved on — it just sees a normal connection.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'mtls', token: 'wire-out', dir: 'out', mtls: true,
    note: 'The two sidecars complete a mutual-TLS handshake: each presents a certificate the mesh issued, each verifies the other. The request crosses the network fully encrypted and mutually authenticated — service-to-service identity the app never had to implement.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'deliver', token: 'sidecarB', dir: 'out', mtls: true,
    note: 'B\'s sidecar terminates the mTLS tunnel, checks the caller\'s identity against policy, records the request for metrics, and hands a plain local call to B\'s application — which, like A\'s, has no idea any of this happened.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'process', token: 'appB', dir: 'out', mtls: true,
    note: 'B\'s application processes the request and returns a normal response to its own sidecar. The reply now retraces the path: B\'s sidecar to A\'s sidecar over the same encrypted tunnel, then up to A\'s app.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'return', token: 'wire-back', dir: 'back', mtls: true,
    note: 'The response travels back across the mTLS tunnel from B\'s sidecar to A\'s sidecar. The mesh tags the call with latency and status so observability dashboards see it — again, free, with zero app instrumentation.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'done', token: 'done', dir: 'back', mtls: false,
    completed: p.completed + 1,
    note: 'A\'s sidecar returns the response to A\'s app as if it were a simple local reply. One plain call out, one plain reply back — yet it was encrypted, authenticated, load-balanced, and measured end to end. That is the data plane doing its job invisibly.',
  });
  frames.push(p);

  return frames;
}

function buildFault() {
  const frames = [];
  let p = snap({
    phase: 'init', bDown: true,
    note: `Now Service B is failing — its instances return errors. The app code in A is unchanged; it still makes one plain call. Watch A's sidecar handle the fault on its own: retry up to ${MAX_RETRIES} times, then trip the circuit breaker and fail fast so it stops hammering a dead service.`,
  });
  frames.push(p);

  p = carry(p, {
    phase: 'app-out', token: 'appA', dir: 'out',
    note: 'A\'s app makes the same ordinary local call it always does. It has no retry loop, no error-handling for B\'s outage — it trusts the mesh. The sidecar is where resilience lives.',
  });
  frames.push(p);

  // retry attempts
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    p = carry(p, {
      phase: 'attempt', token: 'wire-out', dir: 'out', mtls: true,
      attempt,
      note: `Attempt ${attempt}: A's sidecar opens the mTLS tunnel and forwards the request to B's sidecar. The connection is fine — but B's app is broken behind it.`,
    });
    frames.push(p);

    p = carry(p, {
      phase: 'fail', token: 'sidecarB', dir: 'back', mtls: true,
      attempt,
      retries: p.retries + 1,
      note: `B's sidecar returns a 503 from the failing app. A's sidecar sees the error. ${attempt < MAX_RETRIES
        ? `Retry budget remains, so it waits a short backoff and tries again (retry ${attempt} of ${MAX_RETRIES}). The app still waits on its single call, unaware.`
        : `That was attempt ${MAX_RETRIES} — the retry budget is now spent. ${MAX_RETRIES} consecutive failures is the breaker's threshold.`}`,
    });
    frames.push(p);
  }

  p = carry(p, {
    phase: 'trip', token: null, dir: 'out', circuit: 'open',
    note: `Circuit breaker TRIPS. After ${MAX_RETRIES} consecutive failures A's sidecar marks B as unhealthy and OPENS the circuit. Further calls will fail instantly instead of waiting on timeouts — this protects A's threads and gives B room to recover instead of being buried in retries.`,
  });
  frames.push(p);

  p = carry(p, {
    phase: 'failfast', token: 'appA', dir: 'back', circuit: 'open',
    failed: p.failed + 1,
    note: 'The next call from A\'s app returns an error IMMEDIATELY from A\'s own sidecar — the request never even leaves the host. "Fail fast": no tunnel, no timeout, no load on B. The app sees a fast error and can fall back, exactly as if it had hand-written a circuit breaker — but it wrote none.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'contrast', token: null, dir: 'out', circuit: 'open',
    note: 'The point: A\'s and B\'s application code never changed across all of this. Retries, backoff, the breaker, fail-fast — every resilience behaviour lived in the sidecars. Move that logic into apps and you reimplement it per language, per service; in the mesh it is one consistent policy.',
  });
  frames.push(p);

  return frames;
}

function buildConfig() {
  const frames = [];
  let p = snap({
    phase: 'init',
    note: 'The mesh has a CONTROL PLANE separate from the data plane. You change one policy there — a new retry rule, a routing split — and it is pushed down to every sidecar. The application processes are never edited or restarted.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'author', token: null,
    note: 'An operator updates the config in the control plane: bump retries from 3 to 5, add a route sending 20% of traffic to a canary "v2" of Service B. Nothing has reached the sidecars yet — this is just declared intent at the center.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'push-a', configPush: 'sidecarA',
    note: 'The control plane pushes the new config DOWN to A\'s sidecar over the config channel (the dashed line from the center). A\'s proxy receives the updated retry policy and routing table and applies it live, in place.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'push-b', configPush: 'both',
    retryPolicy: 'retries 5, timeout 2s',
    note: 'The same push lands on B\'s sidecar. Both proxies now hold the new policy. The config plane fans the update out to the whole fleet — one source of truth, every data-plane proxy in sync.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'applied', configPush: null,
    retryPolicy: 'retries 5, timeout 2s',
    routeRule: 'route v1 80% / v2 20%',
    note: 'Config applied across the mesh: retries are now 5, and 20% of calls to Service B route to the v2 canary. This took effect WITHOUT touching, rebuilding, or redeploying a single application. Policy is data the control plane ships, not code the app carries.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'verify', token: 'wire-out', dir: 'out', mtls: true,
    retryPolicy: 'retries 5, timeout 2s',
    routeRule: 'route v1 80% / v2 20%',
    note: 'Fire a request under the new rules: A\'s sidecar now load-balances across v1 and the v2 canary per the routing split, and would retry up to 5 times if needed — all decided by config the control plane pushed, all invisible to the apps on either side.',
  });
  frames.push(p);

  p = carry(p, {
    phase: 'done', token: 'done', dir: 'back', mtls: false,
    completed: p.completed + 1,
    retryPolicy: 'retries 5, timeout 2s',
    routeRule: 'route v1 80% / v2 20%',
    note: 'Response returns cleanly under the updated policy. The control plane is the brain (it decides), the sidecars are the muscle (they enforce), and the apps stay blissfully unaware. Separating the two is what lets you change mesh behaviour fleet-wide in seconds.',
  });
  frames.push(p);

  return frames;
}

const SCENARIOS = {
  'Healthy request': 'healthy',
  'Fault -> retry + circuit break': 'fault',
  'Control plane push': 'config',
};
const SCEN_KEYS = Object.keys(SCENARIOS);

const PHASE_LABEL = {
  init: 'setup',
  'app-out': 'app call',
  intercept: 'intercepted',
  mtls: 'mTLS tunnel',
  deliver: 'delivered',
  process: 'processing',
  return: 'returning',
  done: 'done',
  attempt: 'attempt',
  fail: 'error',
  trip: 'circuit open',
  failfast: 'fail fast',
  contrast: 'app unchanged',
  author: 'config edited',
  'push-a': 'config push',
  'push-b': 'config push',
  applied: 'applied',
  verify: 'verify',
};

const RUN_DELAY_MS = 1600;

export default function ServiceMeshViz() {
  const [scenario, setScenario] = useState(SCEN_KEYS[0]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const mode = SCENARIOS[scenario];
  const frames = useMemo(() => {
    if (mode === 'fault') return buildFault();
    if (mode === 'config') return buildConfig();
    return buildHealthy();
  }, [mode]);

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
  const switchScenario = (s) => {
    if (s === scenario) return;
    setIsRunning(false);
    setStep(0);
    setScenario(s);
  };

  // ---- SVG geometry ----
  // Control plane centered up top; Service A (left) and Service B (right), each
  // an app box wrapped by a sidecar box, on a lower row. mTLS tunnel between
  // the two sidecars; config channels dashed from control plane down to each.
  const W = 960;
  const H = 440;

  const cpX = W / 2;
  const cpY = 64;
  const cpW = 300;
  const cpH = 70;

  const rowY = 250; // vertical center of the service row
  const podW = 300;
  const podH = 150;
  const appW = 116;
  const innerH = 96;
  const aPodX = 40; // left edge of pod A
  const bPodX = W - 40 - podW; // left edge of pod B

  // app + sidecar geometry within a pod
  const aAppX = aPodX + 16;
  const aSideX = aPodX + podW - 16 - appW;
  const bSideX = bPodX + 16;
  const bAppX = bPodX + podW - 16 - appW;
  const innerY = rowY - innerH / 2;

  const sidecarACx = aSideX + appW / 2;
  const sidecarBCx = bSideX + appW / 2;

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const token = current.token;
  const mtls = current.mtls;
  const circuit = current.circuit;
  const circuitOpen = circuit === 'open';
  const bDown = current.bDown;
  const configPush = current.configPush;
  const pushA = configPush === 'sidecarA' || configPush === 'both';
  const pushB = configPush === 'both';

  const tone = circuitOpen || current.phase === 'fail' || current.phase === 'trip' || current.phase === 'failfast'
    ? 'bad'
    : (current.phase === 'done' || current.phase === 'applied') ? 'ok' : 'neutral';

  // which inner element holds the token right now
  const tokenAt = (where) => token === where;
  const sidecarAActive = tokenAt('sidecarA') || tokenAt('wire-out') || tokenAt('wire-back') || tokenAt('done') || tokenAt('appA');
  const sidecarBActive = tokenAt('sidecarB') || (tokenAt('wire-out') && current.dir === 'out');

  // mTLS tunnel midpoint for the lock badge
  const tunnelY = rowY;
  const tunnelMidX = (sidecarACx + sidecarBCx) / 2;

  return (
    <div className="smv">
      <div className="smv-head">
        <h3 className="smv-title">Service mesh — sidecars do mTLS, retries, and circuit-breaking so the app does not</h3>
        <p className="smv-sub">
          Each service runs beside a sidecar proxy (the data plane); a control plane configures them all.
          Fire a request through the mesh, inject a fault to watch the sidecar retry then circuit-break, or
          push new config down from the control plane — the app code never changes.
        </p>
      </div>

      <div className="smv-controls">
        <div className="smv-modes" role="tablist" aria-label="Scenario">
          {SCEN_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              className={`smv-mode ${scenario === s ? 'is-on' : ''}`}
              onClick={() => switchScenario(s)}
              aria-pressed={scenario === s}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="smv-speed">
          <span className="smv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="smv-speed-range"
            aria-label="Playback speed"
          />
          <span className="smv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="smv-spacer" aria-hidden="true" />

        <div className="smv-buttons">
          <button
            type="button"
            className="smv-btn smv-btn-primary"
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
            className="smv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="smv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="smv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="smv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="smv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="smv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="smv-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="smv-ah" />
            </marker>
            <marker id="smv-arr-mtls" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="smv-ah is-mtls" />
            </marker>
            <marker id="smv-arr-cfg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="smv-ah is-cfg" />
            </marker>
            <marker id="smv-arr-bad" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="smv-ah is-bad" />
            </marker>
          </defs>

          {/* ---- control plane ---- */}
          <g>
            <rect
              className={`smv-cp ${configPush ? 'is-pushing' : ''}`}
              x={cpX - cpW / 2} y={cpY - cpH / 2} width={cpW} height={cpH} rx={10}
            />
            <g transform={`translate(${cpX - cpW / 2 + 16}, ${cpY - cpH / 2 + 14})`}>
              <Settings width={20} height={20} className={`smv-cp-ic ${configPush ? 'is-pushing' : ''}`} />
            </g>
            <text className="smv-cp-label" x={cpX - cpW / 2 + 44} y={cpY - cpH / 2 + 24} textAnchor="start">control plane</text>
            <text className="smv-cp-sub" x={cpX - cpW / 2 + 44} y={cpY - cpH / 2 + 40} textAnchor="start">issues certs · pushes policy + routes</text>
            <text className="smv-cp-policy" x={cpX} y={cpY + cpH / 2 + 16} textAnchor="middle">
              {`${current.retryPolicy} · ${current.routeRule}`}
            </text>
          </g>

          {/* ---- config-push channels (control plane -> each sidecar) ---- */}
          <line
            className={`smv-cfg-line ${pushA ? 'is-active' : ''}`}
            x1={cpX - 40} y1={cpY + cpH / 2}
            x2={sidecarACx} y2={innerY}
            markerEnd={pushA ? 'url(#smv-arr-cfg)' : undefined}
          />
          <line
            className={`smv-cfg-line ${pushB ? 'is-active' : ''}`}
            x1={cpX + 40} y1={cpY + cpH / 2}
            x2={sidecarBCx} y2={innerY}
            markerEnd={pushB ? 'url(#smv-arr-cfg)' : undefined}
          />
          {configPush && (
            <text className="smv-cfg-label" x={cpX} y={cpY + cpH / 2 + 44} textAnchor="middle">
              config push (data plane reconfigures live)
            </text>
          )}

          {/* ---- mTLS tunnel between the two sidecars ---- */}
          <g>
            <line
              className={`smv-tunnel ${mtls ? 'is-on' : ''} ${tone === 'bad' && (current.phase === 'fail' || current.phase === 'attempt') ? 'is-bad' : ''}`}
              x1={sidecarACx + appW / 2 + 4} y1={tunnelY}
              x2={sidecarBCx - appW / 2 - 4} y2={tunnelY}
            />
            {/* directional token on the wire */}
            {tokenAt('wire-out') && (
              <line
                className={`smv-flow ${tone === 'bad' ? 'is-bad' : 'is-mtls'}`}
                x1={sidecarACx + appW / 2 + 6} y1={tunnelY - 14}
                x2={sidecarBCx - appW / 2 - 10} y2={tunnelY - 14}
                markerEnd={`url(#smv-arr-${tone === 'bad' ? 'bad' : 'mtls'})`}
              />
            )}
            {(tokenAt('wire-back') || (current.phase === 'fail')) && (
              <line
                className={`smv-flow ${tone === 'bad' ? 'is-bad' : 'is-mtls'}`}
                x1={sidecarBCx - appW / 2 - 6} y1={tunnelY + 14}
                x2={sidecarACx + appW / 2 + 10} y2={tunnelY + 14}
                markerEnd={`url(#smv-arr-${tone === 'bad' ? 'bad' : 'mtls'})`}
              />
            )}
            {/* lock badge on an active encrypted tunnel */}
            {mtls && (
              <g transform={`translate(${tunnelMidX - 9}, ${tunnelY - 34})`}>
                <Lock width={18} height={18} className="smv-lock-ic" />
              </g>
            )}
            <text className={`smv-tunnel-label ${mtls ? 'is-on' : ''}`} x={tunnelMidX} y={tunnelY - 42} textAnchor="middle">
              {mtls ? 'mTLS tunnel' : 'network'}
            </text>
            {/* circuit-breaker badge sits on the wire when open */}
            {circuitOpen && (
              <g>
                <rect className="smv-cb" x={tunnelMidX - 60} y={tunnelY + 22} width={120} height={26} rx={13} />
                <g transform={`translate(${tunnelMidX - 50}, ${tunnelY + 27})`}>
                  <Zap width={16} height={16} className="smv-cb-ic" />
                </g>
                <text className="smv-cb-text" x={tunnelMidX + 8} y={tunnelY + 39} textAnchor="middle">circuit OPEN</text>
              </g>
            )}
          </g>

          {/* ---- Service A pod (app + sidecar) ---- */}
          <g>
            <rect className="smv-pod" x={aPodX} y={rowY - podH / 2} width={podW} height={podH} rx={12} />
            <text className="smv-pod-label" x={aPodX + 12} y={rowY - podH / 2 - 10} textAnchor="start">Service A pod</text>

            {/* app A */}
            <rect
              className={`smv-app ${tokenAt('appA') ? 'is-active' : ''}`}
              x={aAppX} y={innerY} width={appW} height={innerH} rx={9}
            />
            <g transform={`translate(${aAppX + appW / 2 - 10}, ${innerY + 16})`}>
              <Server width={20} height={20} className={`smv-app-ic ${tokenAt('appA') ? 'is-active' : ''}`} />
            </g>
            <text className="smv-app-label" x={aAppX + appW / 2} y={innerY + 56} textAnchor="middle">app A</text>
            <text className="smv-app-sub" x={aAppX + appW / 2} y={innerY + 72} textAnchor="middle">unchanged code</text>

            {/* local hop app A -> sidecar A */}
            <line
              className={`smv-local ${tokenAt('appA') || tokenAt('sidecarA') ? 'is-on' : ''}`}
              x1={aAppX + appW} y1={rowY} x2={aSideX} y2={rowY}
              markerEnd="url(#smv-arr)"
            />

            {/* sidecar A */}
            <rect
              className={`smv-sidecar ${sidecarAActive ? 'is-active' : ''} ${circuitOpen ? 'is-cb' : ''} ${pushA ? 'is-config' : ''}`}
              x={aSideX} y={innerY} width={appW} height={innerH} rx={9}
            />
            <g transform={`translate(${aSideX + appW / 2 - 10}, ${innerY + 16})`}>
              <Shield width={20} height={20} className={`smv-sidecar-ic ${sidecarAActive ? 'is-active' : ''}`} />
            </g>
            <text className="smv-sidecar-label" x={aSideX + appW / 2} y={innerY + 56} textAnchor="middle">sidecar</text>
            <text className="smv-sidecar-sub" x={aSideX + appW / 2} y={innerY + 72} textAnchor="middle">
              {circuitOpen ? 'breaker open' : 'mTLS · retry · LB'}
            </text>
          </g>

          {/* ---- Service B pod (sidecar + app) ---- */}
          <g>
            <rect className={`smv-pod ${bDown ? 'is-down' : ''}`} x={bPodX} y={rowY - podH / 2} width={podW} height={podH} rx={12} />
            <text className={`smv-pod-label ${bDown ? 'is-down' : ''}`} x={bPodX + 12} y={rowY - podH / 2 - 10} textAnchor="start">
              {bDown ? 'Service B pod — failing' : 'Service B pod'}
            </text>

            {/* sidecar B */}
            <rect
              className={`smv-sidecar ${sidecarBActive ? 'is-active' : ''} ${pushB ? 'is-config' : ''}`}
              x={bSideX} y={innerY} width={appW} height={innerH} rx={9}
            />
            <g transform={`translate(${bSideX + appW / 2 - 10}, ${innerY + 16})`}>
              <Shield width={20} height={20} className={`smv-sidecar-ic ${sidecarBActive ? 'is-active' : ''}`} />
            </g>
            <text className="smv-sidecar-label" x={bSideX + appW / 2} y={innerY + 56} textAnchor="middle">sidecar</text>
            <text className="smv-sidecar-sub" x={bSideX + appW / 2} y={innerY + 72} textAnchor="middle">mTLS · retry · LB</text>

            {/* local hop sidecar B -> app B */}
            <line
              className={`smv-local ${tokenAt('sidecarB') || tokenAt('appB') ? 'is-on' : ''} ${bDown && (tokenAt('sidecarB')) ? 'is-bad' : ''}`}
              x1={bSideX + appW} y1={rowY} x2={bAppX} y2={rowY}
              markerEnd={`url(#smv-arr${bDown && tokenAt('sidecarB') ? '-bad' : ''})`}
            />

            {/* app B */}
            <rect
              className={`smv-app ${tokenAt('appB') ? 'is-active' : ''} ${bDown ? 'is-down' : ''}`}
              x={bAppX} y={innerY} width={appW} height={innerH} rx={9}
            />
            <g transform={`translate(${bAppX + appW / 2 - 10}, ${innerY + 16})`}>
              <Server width={20} height={20} className={`smv-app-ic ${tokenAt('appB') ? 'is-active' : ''} ${bDown ? 'is-down' : ''}`} />
            </g>
            <text className={`smv-app-label ${bDown ? 'is-down' : ''}`} x={bAppX + appW / 2} y={innerY + 56} textAnchor="middle">app B</text>
            <text className={`smv-app-sub ${bDown ? 'is-down' : ''}`} x={bAppX + appW / 2} y={innerY + 72} textAnchor="middle">
              {bDown ? 'returning 503' : 'unchanged code'}
            </text>
          </g>
        </svg>
      </div>

      <div className="smv-metrics">
        <div className="smv-metric">
          <span className="smv-metric-label">phase</span>
          <span className={`smv-metric-value ${tone === 'bad' ? 'is-bad' : tone === 'ok' ? 'is-ok' : ''}`}>
            {PHASE_LABEL[current.phase] || current.phase}
          </span>
        </div>
        <div className="smv-metric">
          <span className="smv-metric-label">mTLS</span>
          <span className={`smv-metric-value ${mtls ? 'is-ok' : ''}`}>{mtls ? 'on — encrypted' : 'off'}</span>
        </div>
        <div className="smv-metric">
          <span className="smv-metric-label">retries</span>
          <span className={`smv-metric-value ${current.retries > 0 ? 'is-warn' : ''}`}>
            {`${current.retries}${current.phase === 'attempt' || current.phase === 'fail' ? ` (try ${current.attempt}/${MAX_RETRIES})` : ''}`}
          </span>
        </div>
        <div className="smv-metric">
          <span className="smv-metric-label">circuit</span>
          <span className={`smv-metric-value ${circuitOpen ? 'is-bad' : 'is-ok'}`}>{circuitOpen ? 'open — fail fast' : 'closed'}</span>
        </div>
        <div className="smv-metric">
          <span className="smv-metric-label">completed</span>
          <span className="smv-metric-value is-ok">{current.completed}</span>
        </div>
        <div className="smv-metric smv-metric-dim">
          <span className="smv-metric-label">failed</span>
          <span className={`smv-metric-value ${current.failed > 0 ? 'is-bad' : ''}`}>{current.failed}</span>
        </div>
      </div>

      <div className={`smv-narration ${tone === 'bad' ? 'is-bad' : tone === 'ok' ? 'is-ok' : ''}`}>
        <span className={`smv-narration-label ${tone === 'bad' ? 'is-bad' : tone === 'ok' ? 'is-ok' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="smv-narration-body">{current.note}</span>
      </div>

      <div className="smv-legend">
        <span className="smv-legend-item"><Server size={13} className="smv-ic" /> app — plain code, no mesh logic</span>
        <span className="smv-legend-item"><Shield size={13} className="smv-ic is-mtls" /> sidecar proxy — the data plane</span>
        <span className="smv-legend-item"><Lock size={13} className="smv-ic is-mtls" /> mTLS — encrypted, mutually authenticated hop</span>
        <span className="smv-legend-item"><RefreshCw size={13} className="smv-ic is-warn" /> retry on failure, backoff between tries</span>
        <span className="smv-legend-item"><Zap size={13} className="smv-ic is-bad" /> circuit breaker — fail fast after N errors</span>
        <span className="smv-legend-item"><Settings size={13} className="smv-ic is-cfg" /> control plane pushes config to every sidecar</span>
        <span className="smv-legend-item"><ArrowLeftRight size={13} className="smv-ic" /> request out, response back</span>
        <span className="smv-legend-item"><Check size={13} className="smv-ic is-ok" /> completed without touching app code</span>
      </div>
    </div>
  );
}
