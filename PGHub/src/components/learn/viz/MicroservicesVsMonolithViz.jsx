import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Send, Box, Boxes, Rocket,
  Zap, AlertTriangle, Database, Network,
} from 'lucide-react';
import './MicroservicesVsMonolithViz.css';

// Monolith vs microservices — the SAME "place an order" feature request flowing
// through two architectures, plus what deploy / scale / failure cost in each.
//
//   monolith      one deployable process, one database. The request runs through
//                 modules as IN-PROCESS function calls (no network), then writes
//                 to the single DB. Deploying any change redeploys the whole
//                 thing; scaling means cloning the whole process; ONE module
//                 crashing takes the whole process — and the feature — down.
//   microservices N independent services, each with its own DB. The request hops
//                 service to service over the NETWORK (slower per call, but each
//                 hop is independent). Deploy one service alone; scale just the
//                 hot one; a crashed service is ISOLATED — the others keep
//                 serving, and a good caller degrades gracefully.
//
// Interactive: toggle architecture, fire a request to watch it traverse, scale
// or deploy a single unit, and inject a failure to compare the blast radius.

// shared modules/services for the order feature
const STAGES = [
  { key: 'api', label: 'API', sub: 'request entry' },
  { key: 'auth', label: 'Auth', sub: 'verify user' },
  { key: 'order', label: 'Orders', sub: 'create order' },
  { key: 'pay', label: 'Payments', sub: 'charge card' },
];

const STEP_MS = 720;

function freshState() {
  return {
    mode: 'monolith', // 'monolith' | 'microservices'
    inFlight: null, // { stage, blocked }
    completed: 0,
    failedReqs: 0,
    failedUnit: null, // index of failed stage (microservices: isolated; monolith: whole)
    scaled: {}, // stageIndex -> replica count (microservices)
    deployedUnit: null,
    note: 'Pick an architecture, then fire a request to watch it flow. Inject a failure to compare the blast radius: a microservice fails alone, a monolith module takes the whole process down.',
    tone: 'init',
  };
}

export default function MicroservicesVsMonolithViz() {
  const [mode, setMode] = useState('monolith');
  const [autoplay, setAutoplay] = useState(false);
  const [firing, setFiring] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [st, setSt] = useState(() => freshState());

  const runTimer = useRef(null);
  const fireTimer = useRef(null);
  const modeRef = useRef(mode);
  const autoRef = useRef(autoplay);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { autoRef.current = autoplay; }, [autoplay]);

  const delay = useMemo(() => Math.round(STEP_MS / Math.max(speed, 0.1)), [speed]);

  // advance the in-flight request one stage. In a monolith, a failed module
  // halts the request (whole process down). In microservices, a failed service
  // blocks only its own hop; a resilient caller marks the request degraded but
  // the request that doesn't need the dead service still completes.
  const advance = (prev) => {
    const s = { ...prev, mode: modeRef.current };
    const fly = s.inFlight;

    if (!fly) {
      // a monolith with a downed module can't even start serving
      if (s.mode === 'monolith' && s.failedUnit != null) {
        s.failedReqs += 1;
        s.tone = 'warn';
        s.note = `The monolith is one process. With the ${STAGES[s.failedUnit].label} module crashed, the whole process is down — even requests that never reach ${STAGES[s.failedUnit].label} fail. That is the monolith blast radius: everything.`;
        return s;
      }
      s.inFlight = { stage: 0, degraded: false };
      s.note = s.mode === 'monolith'
        ? 'Request enters the single process. From here every step is an in-process function call — no network hops, so each step is fast and there is nothing to time out.'
        : 'Request enters the API gateway. Each step is a separate service reached over the network — independent, but every hop adds latency and can fail on its own.';
      s.tone = 'run';
      return s;
    }

    const next = fly.stage + 1;

    // hitting the failed stage
    if (next < STAGES.length && s.failedUnit === next) {
      if (s.mode === 'monolith') {
        s.inFlight = null;
        s.failedReqs += 1;
        s.tone = 'warn';
        s.note = `The ${STAGES[next].label} module threw — and because it shares the process, it took the whole monolith down with it. The request dies here; so would every other in-flight request. No isolation.`;
        return s;
      }
      // microservices: this hop fails but is isolated
      const degradable = next === STAGES.length - 1; // last hop can degrade gracefully
      if (degradable) {
        s.inFlight = { stage: STAGES.length - 1, degraded: true, finishing: true };
        s.tone = 'warn';
        s.note = `The ${STAGES[next].label} service is down — but it is its own process, so only THIS call fails. The Orders service catches the error and degrades: the order is saved as "payment pending" instead of crashing. Failure stayed contained.`;
        return s;
      }
      s.inFlight = null;
      s.failedReqs += 1;
      s.tone = 'warn';
      s.note = `The ${STAGES[next].label} service is down. Only this request's ${STAGES[next].label} hop fails — every other service stays up and keeps serving its own traffic. The blast radius is one service, not the system.`;
      return s;
    }

    if (next >= STAGES.length || fly.finishing) {
      s.inFlight = null;
      s.completed += 1;
      s.tone = fly.degraded ? 'warn' : 'ok';
      s.note = fly.degraded
        ? `Request completed in DEGRADED mode: the dead Payments service was routed around, the order persisted as pending. Microservices traded a hard failure for a soft one — the user still got a response.`
        : s.mode === 'monolith'
          ? `Request completed: ${STAGES.length} in-process calls, one DB write, no network latency between steps. Simple and fast — until you need to scale or deploy just one piece.`
          : `Request completed: ${STAGES.length} network hops across independent services, each with its own DB. More moving parts and latency, but every piece scales and fails on its own.`;
      return s;
    }

    s.inFlight = { ...fly, stage: next };
    const st2 = STAGES[next];
    s.note = s.mode === 'monolith'
      ? `In-process call into the ${st2.label} module — ${st2.sub}. No serialization, no network: just a function call inside the one process sharing the one database.`
      : `Network hop to the ${st2.label} service — ${st2.sub}. A separate process with its own database; the call crosses the wire, so it adds latency and could time out independently.`;
    s.tone = 'run';
    return s;
  };

  useEffect(() => {
    if (!autoplay) return undefined;
    runTimer.current = setInterval(() => setSt((p) => advance(p)), delay);
    return () => {
      if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    };
  }, [autoplay, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
    if (fireTimer.current) clearInterval(fireTimer.current);
  }, []);

  const fireRequest = () => {
    if (autoRef.current || fireTimer.current) return;
    setFiring(true);
    setSt((p) => advance(p));
    fireTimer.current = setInterval(() => {
      setSt((p) => {
        const next = advance(p);
        if (next.inFlight == null) {
          if (fireTimer.current) { clearInterval(fireTimer.current); fireTimer.current = null; }
          setFiring(false);
        }
        return next;
      });
    }, delay);
  };

  const switchMode = (m) => {
    setMode(m);
    setSt((p) => ({ ...p, mode: m, inFlight: null, failedUnit: null, deployedUnit: null, scaled: {}, tone: 'init',
      note: m === 'monolith'
        ? 'Monolith: one deployable process, one database, in-process calls. Fire a request — every step is a function call. Then inject a failure to see the whole process go down.'
        : 'Microservices: independent services over the network, a database each. Fire a request — every step is a network hop. Inject a failure to see it stay isolated to one service.' }));
  };

  const scaleUnit = (i) => {
    if (modeRef.current !== 'microservices') return;
    setSt((p) => {
      const cur = p.scaled[i] || 1;
      const nextN = cur >= 4 ? 1 : cur + 1;
      return {
        ...p,
        scaled: { ...p.scaled, [i]: nextN },
        deployedUnit: null,
        tone: 'ok',
        note: `Scaled the ${STAGES[i].label} service to ${nextN} replica${nextN === 1 ? '' : 's'} — independently. Only the hot service gets more capacity; the rest stay at one. A monolith can't do this: scaling it clones the entire app, paying for capacity you don't need.`,
      };
    });
  };

  const deployUnit = (i) => {
    setSt((p) => {
      if (modeRef.current === 'monolith') {
        return {
          ...p,
          deployedUnit: 'all',
          tone: 'warn',
          note: `Deploying a change to the ${STAGES[i].label} module redeploys the ENTIRE monolith — every module restarts together. One small fix means a full-system release and a shared blast radius for every deploy.`,
        };
      }
      return {
        ...p,
        deployedUnit: i,
        tone: 'ok',
        note: `Deployed just the ${STAGES[i].label} service — its own pipeline, its own restart. The other services keep running untouched. Independent deployability is the core microservices payoff.`,
      };
    });
  };

  const injectFailure = () => {
    setSt((p) => {
      // fail the Payments unit (index 3) deterministically
      const i = 3;
      return {
        ...p,
        failedUnit: i,
        inFlight: null,
        tone: 'warn',
        note: modeRef.current === 'monolith'
          ? `Injected a crash in the ${STAGES[i].label} module. In a monolith that exception kills the shared process — fire a request and watch even unrelated steps fail. Blast radius: the whole app.`
          : `Injected a crash in the ${STAGES[i].label} service. It is isolated in its own process — fire a request and watch only the ${STAGES[i].label} hop fail while the rest keep serving.`,
      };
    });
  };

  const clearFailure = () => {
    setSt((p) => ({ ...p, failedUnit: null, tone: 'ok', note: 'Failure cleared — all units healthy again. Fire a request to confirm the path is whole.' }));
  };

  const reset = () => {
    setAutoplay(false);
    if (fireTimer.current) { clearInterval(fireTimer.current); fireTimer.current = null; }
    setFiring(false);
    setMode('monolith');
    setSt(freshState());
  };

  // ---- derived ----
  const inFlight = st.inFlight;
  const activeStage = inFlight ? inFlight.stage : -1;
  const isMicro = mode === 'microservices';

  // ---- SVG geometry ----
  const W = 960;
  const H = 380;
  const x0 = 30;
  const x1 = W - 30;
  const gap = isMicro ? 26 : 10;
  const boxW = (x1 - x0 - (STAGES.length - 1) * gap) / STAGES.length;
  const stageX = (i) => x0 + i * (boxW + gap);
  const boxTop = 130;
  const boxH = 78;

  const narrTone = st.tone === 'warn' ? 'is-warn' : st.tone === 'ok' ? 'is-ok' : '';

  return (
    <div className="mvmn">
      <div className="mvmn-head">
        <h3 className="mvmn-title">Monolith vs microservices — one feature, two shapes</h3>
        <p className="mvmn-sub">
          The same &ldquo;place an order&rdquo; request flows through one process or across independent
          services. Fire it to compare the path, scale or deploy a single unit, then inject a failure to
          watch the blast radius differ.
        </p>
      </div>

      <div className="mvmn-controls">
        <div className="mvmn-modes" role="group" aria-label="Architecture">
          <button
            type="button"
            className={`mvmn-mode ${!isMicro ? 'is-on' : ''}`}
            onClick={() => switchMode('monolith')}
            aria-pressed={!isMicro}
          >
            <Box size={13} /> monolith
          </button>
          <button
            type="button"
            className={`mvmn-mode ${isMicro ? 'is-on' : ''}`}
            onClick={() => switchMode('microservices')}
            aria-pressed={isMicro}
          >
            <Boxes size={13} /> microservices
          </button>
        </div>

        <label className="mvmn-speed">
          <span className="mvmn-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mvmn-speed-range" aria-label="Animation speed"
          />
          <span className="mvmn-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mvmn-spacer" aria-hidden="true" />

        <div className="mvmn-buttons">
          <button
            type="button" className="mvmn-btn mvmn-btn-primary"
            onClick={fireRequest} disabled={autoplay || firing}
          >
            <Send size={14} /> Fire request
          </button>
          {st.failedUnit == null ? (
            <button type="button" className="mvmn-btn mvmn-btn-warn" onClick={injectFailure}>
              <AlertTriangle size={14} /> Inject failure
            </button>
          ) : (
            <button type="button" className="mvmn-btn" onClick={clearFailure}>
              <Zap size={14} /> Heal
            </button>
          )}
          <button
            type="button" className={`mvmn-btn ${autoplay ? 'mvmn-btn-on' : ''}`}
            onClick={() => setAutoplay((v) => !v)}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Stop' : 'Auto'}
          </button>
          <button type="button" className="mvmn-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="mvmn-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mvmn-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mvmn-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mvmn-ah" />
            </marker>
          </defs>

          {/* monolith boundary: one big process box wrapping all modules + DB */}
          {!isMicro && (
            <g>
              <rect
                className={`mvmn-process ${st.failedUnit != null ? 'is-down' : ''}`}
                x={x0 - 14} y={boxTop - 40}
                width={x1 - x0 + 28} height={boxH + 130} rx={12}
              />
              <text className={`mvmn-process-label ${st.failedUnit != null ? 'is-down' : ''}`} x={x0 - 4} y={boxTop - 48} textAnchor="start">
                {st.failedUnit != null ? 'one process — CRASHED (whole app down)' : 'one process · one deployable · in-process calls'}
              </text>
            </g>
          )}
          {isMicro && (
            <text className="mvmn-process-label is-micro" x={x0 - 4} y={boxTop - 48} textAnchor="start">
              independent services · network calls · a database each
            </text>
          )}

          {/* request entry */}
          <line className={`mvmn-entry ${inFlight ? 'is-on' : ''}`} x1={x0 - 4} y1={boxTop + boxH / 2} x2={stageX(0)} y2={boxTop + boxH / 2} markerEnd="url(#mvmn-arr)" />
          <text className="mvmn-entry-label" x={x0 + 10} y={boxTop - 12} textAnchor="start">place order →</text>

          {STAGES.map((s, i) => {
            const x = stageX(i);
            const active = activeStage === i;
            const passed = inFlight && inFlight.stage > i;
            const failed = st.failedUnit === i || (!isMicro && st.failedUnit != null);
            const replicas = isMicro ? (st.scaled[i] || 1) : 1;
            const deployed = st.deployedUnit === i || (!isMicro && st.deployedUnit === 'all');
            return (
              <g key={s.key}>
                {i < STAGES.length - 1 && (
                  <line
                    className={`mvmn-edge ${isMicro ? 'is-network' : 'is-inproc'} ${passed ? 'is-passed' : ''}`}
                    x1={x + boxW} y1={boxTop + boxH / 2}
                    x2={stageX(i + 1)} y2={boxTop + boxH / 2}
                    markerEnd="url(#mvmn-arr)"
                  />
                )}
                {/* replica stack behind the box (microservices scaling) */}
                {isMicro && Array.from({ length: replicas - 1 }).map((_, r) => (
                  <rect key={r} className="mvmn-replica" x={x + (r + 1) * 5} y={boxTop - (r + 1) * 5} width={boxW} height={boxH} rx={9} />
                ))}
                <rect
                  className={`mvmn-box ${isMicro ? 'is-micro' : 'is-mono'} ${active ? 'is-active' : ''} ${passed ? 'is-passed' : ''} ${failed ? 'is-down' : ''} ${deployed ? 'is-deployed' : ''}`}
                  x={x} y={boxTop} width={boxW} height={boxH} rx={9}
                />
                <text className={`mvmn-box-label ${failed ? 'is-down' : ''}`} x={x + boxW / 2} y={boxTop + 28} textAnchor="middle">{s.label}</text>
                <text className="mvmn-box-sub" x={x + boxW / 2} y={boxTop + 46} textAnchor="middle">{s.sub}</text>
                {failed && (
                  <text className="mvmn-box-x" x={x + boxW / 2} y={boxTop + 66} textAnchor="middle">crashed</text>
                )}
                {isMicro && replicas > 1 && (
                  <text className="mvmn-box-rep" x={x + boxW / 2} y={boxTop + 66} textAnchor="middle">×{replicas}</text>
                )}

                {/* DB per stage (micro) or shared DB drawn once below (mono) */}
                {isMicro && (
                  <g>
                    <line className="mvmn-dbline" x1={x + boxW / 2} y1={boxTop + boxH} x2={x + boxW / 2} y2={boxTop + boxH + 22} />
                    <rect className={`mvmn-db is-micro ${failed ? 'is-down' : ''}`} x={x + boxW / 2 - 22} y={boxTop + boxH + 22} width={44} height={26} rx={5} />
                    <text className="mvmn-db-label" x={x + boxW / 2} y={boxTop + boxH + 39} textAnchor="middle">db</text>
                  </g>
                )}

                {/* per-unit controls */}
                <g transform={`translate(${x + boxW / 2}, ${boxTop + boxH + (isMicro ? 64 : 96)})`}>
                  {isMicro && (
                    <g className="mvmn-ctrl" onClick={() => scaleUnit(i)} role="button" tabIndex={0}>
                      <rect className="mvmn-ctrl-bg" x={-44} y={-12} width={42} height={22} rx={5} />
                      <text className="mvmn-ctrl-t" x={-23} y={3} textAnchor="middle">scale</text>
                    </g>
                  )}
                  <g className="mvmn-ctrl" onClick={() => deployUnit(i)} role="button" tabIndex={0}>
                    <rect className="mvmn-ctrl-bg" x={isMicro ? 4 : -23} y={-12} width={isMicro ? 44 : 46} height={22} rx={5} />
                    <text className="mvmn-ctrl-t" x={isMicro ? 26 : 0} y={3} textAnchor="middle">deploy</text>
                  </g>
                </g>
              </g>
            );
          })}

          {/* shared DB for monolith */}
          {!isMicro && (
            <g>
              <line className="mvmn-dbline" x1={W / 2} y1={boxTop + boxH} x2={W / 2} y2={boxTop + boxH + 26} />
              <rect className={`mvmn-db is-shared ${st.failedUnit != null ? 'is-down' : ''}`} x={W / 2 - 90} y={boxTop + boxH + 26} width={180} height={34} rx={7} />
              <text className="mvmn-db-label is-shared" x={W / 2} y={boxTop + boxH + 47} textAnchor="middle">one shared database</text>
            </g>
          )}
        </svg>
      </div>

      <div className="mvmn-metrics">
        <div className="mvmn-metric">
          <span className="mvmn-metric-label">architecture</span>
          <span className="mvmn-metric-value">{mode}</span>
        </div>
        <div className="mvmn-metric">
          <span className="mvmn-metric-label">call type</span>
          <span className="mvmn-metric-value">{isMicro ? 'network hops' : 'in-process'}</span>
        </div>
        <div className="mvmn-metric">
          <span className="mvmn-metric-label">completed</span>
          <span className="mvmn-metric-value is-ok">{st.completed}</span>
        </div>
        <div className="mvmn-metric">
          <span className="mvmn-metric-label">failed requests</span>
          <span className={`mvmn-metric-value ${st.failedReqs > 0 ? 'is-warn' : ''}`}>{st.failedReqs}</span>
        </div>
        <div className="mvmn-metric mvmn-metric-dim">
          <span className="mvmn-metric-label">blast radius</span>
          <span className={`mvmn-metric-value ${st.failedUnit != null ? 'is-warn' : ''}`}>
            {st.failedUnit == null ? 'none' : isMicro ? '1 service' : 'whole app'}
          </span>
        </div>
      </div>

      <div className={`mvmn-narration ${narrTone}`}>
        <span className={`mvmn-narration-label ${narrTone}`}>
          {st.tone === 'warn' ? 'failure' : st.tone === 'ok' ? 'done' : 'ready'}
        </span>
        <span className="mvmn-narration-body">{st.note}</span>
      </div>

      <div className="mvmn-legend">
        <span className="mvmn-legend-item"><Box size={13} className="mvmn-ic is-mono" /> monolith — one process, one DB, fast in-process calls</span>
        <span className="mvmn-legend-item"><Network size={13} className="mvmn-ic is-micro" /> microservices — network hops, independent scaling/deploy</span>
        <span className="mvmn-legend-item"><Rocket size={13} className="mvmn-ic" /> deploy/scale one unit vs the whole app</span>
        <span className="mvmn-legend-item"><AlertTriangle size={13} className="mvmn-ic is-warn" /> failure: isolated service vs whole-process crash</span>
        <span className="mvmn-legend-item"><Database size={13} className="mvmn-ic" /> shared DB vs a database per service</span>
      </div>
    </div>
  );
}
