import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Send, Gauge, ScrollText, GitBranch,
  AlertTriangle, Activity, Zap, Server,
} from 'lucide-react';
import './ObservabilityViz.css';

// Observability — the THREE PILLARS from a single request.
// One request flows through a service chain (gateway -> auth -> orders -> db).
// As it crosses each service it OPENS a span. Every signal is emitted from the
// same flow: the trace tree gets a waterfall bar, the metrics counters tick,
// and a structured log line is appended — all keyed to one trace id.
// A live setInterval advances the request one span-event per tick, so the
// trace builds top-down while metrics climb and the log stream scrolls.
//
// The teaching point: when the db span runs slow or errors, that single fault
// SURFACES IN ALL THREE PILLARS at once — a long/red bar in the trace, a spike
// in the latency/error metrics, and a WARN/ERROR line in the logs for the SAME
// trace id. One cause, three independent views that must agree.

// Deterministic per-service base durations (ms) and start offsets within the
// root span. No Math.random anywhere — the trace is reproducible every run.
const SERVICES = [
  { key: 'gateway', label: 'gateway', icon: 'server', start: 0, base: 30, depth: 0 },
  { key: 'auth', label: 'auth', icon: 'server', start: 30, base: 45, depth: 1 },
  { key: 'orders', label: 'orders', icon: 'server', start: 80, base: 70, depth: 1 },
  { key: 'db', label: 'db', icon: 'database', start: 155, base: 40, depth: 2 },
];

const SLOW_EXTRA = 300; // db span balloons by this when "slow span" is on
const ROOT_PAD = 25; // tail of the root span after the last child returns
const MAX_LOGS = 7; // visible log lines — older lines drop, NO inner scroll
const TICK_MS = 950; // base interval; divided by speed
const TRACE_IDS = ['a1b2', 'c3d4', 'e5f6', '07a8', 'b9c0', 'd1e2']; // deterministic ids

const SVC_INDEX = Object.fromEntries(SERVICES.map((s, i) => [s.key, i]));

// Build the span list for one request given the fault toggles. Each span has a
// start offset and duration (ms) relative to the root; the db span carries the
// fault. Returns { spans, rootDur, latency, errored }.
function buildSpans(slow, errored) {
  const spans = SERVICES.map((s) => {
    let dur = s.base;
    let level = 'INFO';
    let msg = `${s.label} handled segment`;
    if (s.key === 'db') {
      if (errored) {
        dur = s.base + 60;
        level = 'ERROR';
        msg = 'query failed: connection reset';
      } else if (slow) {
        dur = s.base + SLOW_EXTRA;
        level = 'WARN';
        msg = `slow query — ${dur}ms over budget`;
      } else {
        msg = 'fetched 3 rows';
      }
    } else if (s.key === 'orders') {
      msg = errored ? 'downstream db error bubbled up' : 'assembled 3 items';
      if (errored) level = 'WARN';
    } else if (s.key === 'auth') {
      msg = 'token verified';
    } else if (s.key === 'gateway') {
      msg = errored ? 'returned 500 to client' : 'routed request -> 200';
      if (errored) level = 'ERROR';
    }
    return { ...s, dur, level, msg };
  });

  // db is the deepest call; everything above it widens to contain its duration.
  // Recompute parent durations so the waterfall nests cleanly.
  const dbIdx = SVC_INDEX.db;
  const dbEnd = spans[dbIdx].start + spans[dbIdx].dur;
  // orders contains db
  const ordIdx = SVC_INDEX.orders;
  spans[ordIdx].dur = Math.max(spans[ordIdx].dur, dbEnd - spans[ordIdx].start) + 12;
  const ordEnd = spans[ordIdx].start + spans[ordIdx].dur;
  const rootDur = ordEnd + ROOT_PAD;
  const latency = rootDur;
  return { spans, rootDur, latency, errored };
}

// Each "event" the interval advances through: opening a span emits its log line
// and (on the last event) closes out metrics. We render spans progressively by
// how many events have fired.
const EVENT_COUNT = SERVICES.length + 1; // one per span open + a final "response" event

function freshState() {
  return {
    reqId: 0, // index into TRACE_IDS for the in-flight request
    activeTrace: null, // trace id string of the in-flight request
    eventsFired: 0, // 0..EVENT_COUNT — how far the in-flight request has progressed
    spans: [], // committed spans for the in-flight request
    plan: null, // { spans, rootDur, latency, errored } precomputed for this request
    totalRequests: 0,
    totalSpans: 0,
    errorCount: 0,
    lastLatency: 0,
    peakLatency: 0,
    sumLatency: 0,
    logs: [],
    note: 'Press Fire request. One request flows gateway -> auth -> orders -> db, emitting a trace span, metric ticks, and a log line at each hop.',
    tone: 'init',
    faultSurfaced: false,
  };
}

// Append a log line, capping to MAX_LOGS most-recent (oldest dropped — no scroll).
function pushLog(logs, line) {
  const next = [...logs, line];
  return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
}

// Deterministic timestamp string from request index + event index.
function stamp(reqIdx, evIdx) {
  const secBase = 1 + reqIdx; // 12:00:01, 12:00:02, ...
  const ms = 100 + evIdx * 95; // climbs within the request
  const ss = String(secBase % 60).padStart(2, '0');
  const mmm = String(ms % 1000).padStart(3, '0');
  return `12:00:${ss}.${mmm}`;
}

export default function ObservabilityViz() {
  const [slow, setSlow] = useState(false);
  const [errored, setErrored] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [firing, setFiring] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [st, setSt] = useState(() => freshState());

  const runTimer = useRef(null);
  const slowRef = useRef(slow);
  const errRef = useRef(errored);
  const autoRef = useRef(autoplay);
  useEffect(() => { slowRef.current = slow; }, [slow]);
  useEffect(() => { errRef.current = errored; }, [errored]);
  useEffect(() => { autoRef.current = autoplay; }, [autoplay]);

  const delay = useMemo(() => Math.round(TICK_MS / speed), [speed]);

  // Advance the in-flight request by one event. Pure-ish reducer over state.
  const advance = (prev) => {
    let s = { ...prev, logs: [...prev.logs] };
    const inFlight = s.activeTrace != null && s.eventsFired < EVENT_COUNT;

    if (!inFlight) {
      // start a new request
      const plan = buildSpans(slowRef.current, errRef.current);
      const reqId = s.reqId;
      const trace = TRACE_IDS[reqId % TRACE_IDS.length];
      s.activeTrace = trace;
      s.plan = plan;
      s.spans = [];
      s.eventsFired = 0;
      s.faultSurfaced = false;
      s.totalRequests += 1;
      s.note = `Request #${s.totalRequests} entered the gateway with trace=${trace}. As it hops each service it opens a span, ticks the metrics, and writes one log line — all tagged with the same trace id.`;
      s.tone = 'run';
    }

    const ev = s.eventsFired;
    if (ev < SERVICES.length) {
      // open span `ev`
      const planSpan = s.plan.spans[ev];
      const span = { ...planSpan, idx: ev };
      s.spans = [...s.spans, span];
      s.totalSpans += 1;
      const level = planSpan.level;
      const line = {
        ts: stamp(s.reqId, ev),
        level,
        svc: planSpan.label,
        trace: s.activeTrace,
        span: ev + 1,
        msg: planSpan.msg,
        key: `${s.activeTrace}-${ev}`,
      };
      s.logs = pushLog(s.logs, line);

      if (planSpan.key === 'db' && (errRef.current || slowRef.current)) {
        s.faultSurfaced = true;
        if (errRef.current) {
          s.tone = 'bad';
          s.note = `The db span errored (trace=${s.activeTrace}). The same fault now surfaces in all three pillars: the trace shows a red span, the error counter increments, and an ERROR log line appears for this trace.`;
        } else {
          s.tone = 'warn';
          s.note = `The db span ran ${planSpan.dur}ms — far over budget. One fault, three views: the trace shows a long bar, the latency gauge will spike, and a WARN log appears for trace=${s.activeTrace}.`;
        }
      } else {
        s.tone = s.faultSurfaced ? s.tone : 'run';
        if (!s.faultSurfaced) {
          s.note = `${planSpan.label} span opened (trace=${s.activeTrace}, span ${ev + 1}). The trace tree gains a bar, total-spans ticks up, and an ${level} log line is appended.`;
        }
      }
      s.eventsFired = ev + 1;
    } else {
      // final "response" event — close out the request metrics
      const { latency, errored: didErr } = s.plan;
      s.lastLatency = latency;
      s.peakLatency = Math.max(s.peakLatency, latency);
      s.sumLatency += latency;
      if (didErr) s.errorCount += 1;
      const respLevel = didErr ? 'ERROR' : 'INFO';
      const respMsg = didErr
        ? `responded 500 in ${latency}ms`
        : `responded 200 in ${latency}ms`;
      s.logs = pushLog(s.logs, {
        ts: stamp(s.reqId, EVENT_COUNT - 1),
        level: respLevel,
        svc: 'gateway',
        trace: s.activeTrace,
        span: 1,
        msg: respMsg,
        key: `${s.activeTrace}-resp`,
      });
      if (didErr) {
        s.tone = 'bad';
        s.note = `Request #${s.totalRequests} finished with an error in ${latency}ms. Cross-check: error counter +1, error-rate climbs, the trace root is red, and the ERROR log carries trace=${s.activeTrace} — every pillar agrees on the same failure.`;
      } else if (s.plan.spans[SVC_INDEX.db].dur > SERVICES[SVC_INDEX.db].base + 50) {
        s.tone = 'warn';
        s.note = `Request #${s.totalRequests} succeeded but took ${latency}ms — the latency gauge spikes well past a healthy baseline. The trace pinpoints the db span as the culprit; the logs confirm the slow query.`;
      } else {
        s.tone = 'run';
        s.note = `Request #${s.totalRequests} completed cleanly in ${latency}ms. All three pillars are quiet: a tidy waterfall, a low latency reading, and INFO-only logs for trace=${s.activeTrace}.`;
      }
      s.eventsFired = EVENT_COUNT;
      s.reqId = s.reqId + 1;
      s.activeTrace = null; // request done; next advance starts a new one if autoplay
    }
    return s;
  };

  // Fire exactly one request to completion by stepping the interval until the
  // request's events are all fired, then (unless autoplay) stop.
  useEffect(() => {
    const running = autoplay;
    if (!running) return undefined;
    runTimer.current = setInterval(() => {
      setSt((prev) => advance(prev));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearInterval(runTimer.current);
        runTimer.current = null;
      }
    };
    // advance reads live config via refs, so it need not be a dep.
  }, [autoplay, delay]);

  // Single-request driver: when not autoplaying, "Fire request" steps a private
  // interval that stops once the in-flight request closes.
  const fireTimer = useRef(null);
  const fireRequest = () => {
    if (autoRef.current) return; // autoplay already drives it
    if (fireTimer.current) return; // a fire is already in progress
    setFiring(true);
    // kick first event immediately for responsiveness
    setSt((prev) => advance(prev));
    fireTimer.current = setInterval(() => {
      setSt((prev) => {
        const next = advance(prev);
        if (next.activeTrace == null && next.eventsFired >= EVENT_COUNT) {
          if (fireTimer.current) {
            clearInterval(fireTimer.current);
            fireTimer.current = null;
          }
          setFiring(false);
        }
        return next;
      });
    }, delay);
  };

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
    if (fireTimer.current) clearInterval(fireTimer.current);
  }, []);

  const reset = () => {
    setAutoplay(false);
    if (fireTimer.current) {
      clearInterval(fireTimer.current);
      fireTimer.current = null;
    }
    setFiring(false);
    setSt(freshState());
  };

  const toggleAutoplay = () => setAutoplay((v) => !v);

  // ---- derived metrics ----
  const avgLatency = st.totalRequests > 0 ? Math.round(st.sumLatency / st.totalRequests) : 0;
  const errorRate = st.totalRequests > 0 ? (st.errorCount / st.totalRequests) * 100 : 0;
  const inFlight = st.activeTrace != null;
  const plan = st.plan;
  const traceDur = plan ? plan.rootDur : 200;

  // ---- SVG geometry ----
  const W = 960;
  const H = 540;

  // region 1: service chain (top band)
  const chainY = 44;
  const chainBoxH = 56;
  const chainX0 = 24;
  const chainX1 = W - 24;
  const chainW = chainX1 - chainX0;
  const svcGap = 22;
  const svcW = (chainW - (SERVICES.length - 1) * svcGap) / SERVICES.length;
  const svcX = (i) => chainX0 + i * (svcW + svcGap);
  // which service is the active span being opened
  const activeSvc = inFlight && st.eventsFired > 0 && st.eventsFired <= SERVICES.length
    ? st.eventsFired - 1 : -1;

  // region 2: trace waterfall (left-bottom)
  const traceX0 = 24;
  const traceTop = 158;
  const traceLabelW = 96;
  const traceBarX0 = traceX0 + traceLabelW;
  const traceBarW = 430;
  const traceRowH = 40;
  const traceBarH = 22;
  const msToX = (ms) => traceBarX0 + (ms / Math.max(1, traceDur)) * traceBarW;
  const msToW = (ms) => (ms / Math.max(1, traceDur)) * traceBarW;

  // region 3: metrics tiles (right-top) + region 4: logs (right-bottom)
  const rightX0 = traceBarX0 + traceBarW + 34;
  const rightW = chainX1 - rightX0;

  // sparkline of last few latencies (drawn from committed spans is overkill;
  // use a deterministic mini bar of the current request's span durations)
  const sparkVals = plan ? plan.spans.map((sp) => sp.dur) : [];
  const sparkMax = Math.max(1, ...sparkVals, 1);

  const levelClass = (lv) => (lv === 'ERROR' ? 'is-error' : lv === 'WARN' ? 'is-warn' : 'is-info');

  const narrTone = st.tone === 'bad' ? 'is-bad' : st.tone === 'warn' ? 'is-warn' : '';
  const narrLabel = st.tone === 'bad' ? 'fault'
    : st.tone === 'warn' ? 'spike'
      : st.tone === 'init' ? 'ready' : 'flow';

  const latencyHealthy = st.lastLatency > 0 && st.lastLatency < 250;
  const latencyTone = st.lastLatency === 0 ? '' : latencyHealthy ? 'is-ok' : 'is-warn';

  return (
    <div className="obv">
      <div className="obv-head">
        <h3 className="obv-title">Observability — one request, three pillars</h3>
        <p className="obv-sub">
          A single request flows gateway → auth → orders → db, emitting a trace span, metric ticks, and a
          structured log line at every hop. Make the db span slow or error and watch the same fault surface in all three pillars at once.
        </p>
      </div>

      <div className="obv-controls">
        <div className="obv-toggles" role="group" aria-label="Fault injection">
          <button
            type="button"
            className={`obv-toggle ${slow ? 'is-on is-warn' : ''}`}
            onClick={() => setSlow((v) => !v)}
            aria-pressed={slow}
            title="Make the db span run far over its latency budget"
          >
            <Gauge size={13} /> slow span
          </button>
          <button
            type="button"
            className={`obv-toggle ${errored ? 'is-on is-bad' : ''}`}
            onClick={() => setErrored((v) => !v)}
            aria-pressed={errored}
            title="Make the db span error — surfaces in trace, metrics, and logs"
          >
            <AlertTriangle size={13} /> error span
          </button>
        </div>

        <label className="obv-speed">
          <span className="obv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="obv-speed-range"
            aria-label="Animation speed"
          />
          <span className="obv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="obv-spacer" aria-hidden="true" />

        <div className="obv-buttons">
          <button
            type="button"
            className="obv-btn obv-btn-primary"
            onClick={fireRequest}
            disabled={autoplay || firing}
            title={autoplay ? 'Autoplay is firing a stream of requests' : 'Send one request through the chain'}
          >
            <Send size={14} /> Fire request
          </button>
          <button
            type="button"
            className={`obv-btn ${autoplay ? 'obv-btn-on' : ''}`}
            onClick={toggleAutoplay}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Stop stream' : 'Auto stream'}
          </button>
          <button type="button" className="obv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="obv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="obv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="obv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="obv-ah" />
            </marker>
          </defs>

          {/* ---- region 1: service chain ---- */}
          <text className="obv-region-label" x={chainX0} y={28} textAnchor="start">service chain — the request hops left to right</text>
          {SERVICES.map((s, i) => {
            const x = svcX(i);
            const active = activeSvc === i;
            const passed = inFlight && st.eventsFired > i + 1;
            const isFaultSvc = s.key === 'db' && (slow || errored);
            const tone = active && isFaultSvc ? (errored ? 'is-bad' : 'is-warn') : active ? 'is-active' : passed ? 'is-passed' : '';
            return (
              <g key={s.key}>
                {i < SERVICES.length - 1 && (
                  <line
                    className={`obv-chain-edge ${passed ? 'is-passed' : ''}`}
                    x1={x + svcW}
                    y1={chainY + chainBoxH / 2}
                    x2={svcX(i + 1)}
                    y2={chainY + chainBoxH / 2}
                    markerEnd="url(#obv-arrow)"
                  />
                )}
                <rect className={`obv-svc ${tone}`} x={x} y={chainY} width={svcW} height={chainBoxH} rx={9} />
                <g transform={`translate(${x + 12}, ${chainY + 12})`}>
                  <Server width={14} height={14} className="obv-ic" />
                </g>
                <text className="obv-svc-title" x={x + 32} y={chainY + 23}>{s.label}</text>
                <text className="obv-svc-sub" x={x + 12} y={chainY + 44}>
                  {active ? 'span open' : passed ? 'returned' : 'idle'}
                </text>
              </g>
            );
          })}

          {/* ---- region 2: trace waterfall ---- */}
          <text className="obv-region-label" x={traceX0} y={traceTop - 18} textAnchor="start">
            trace — spans nest under their parent, width = duration
          </text>
          {/* time axis */}
          <line className="obv-axis" x1={traceBarX0} y1={traceTop} x2={traceBarX0 + traceBarW} y2={traceTop} />
          <text className="obv-axis-tick" x={traceBarX0} y={traceTop - 4} textAnchor="start">0ms</text>
          <text className="obv-axis-tick" x={traceBarX0 + traceBarW} y={traceTop - 4} textAnchor="end">{`${Math.round(traceDur)}ms`}</text>

          {(st.spans.length ? st.spans : []).map((sp, i) => {
            const rowY = traceTop + 12 + i * traceRowH;
            const indent = sp.depth * 16;
            const bx = msToX(sp.start) + indent;
            const bw = Math.max(8, msToW(sp.dur) - indent);
            const isDb = sp.key === 'db';
            const tone = isDb && errored ? 'is-error' : isDb && slow ? 'is-warn' : '';
            return (
              <g key={`span-${sp.idx}`}>
                <text className="obv-span-label" x={traceX0} y={rowY + traceBarH / 2 + 4} textAnchor="start">
                  {`${'·'.repeat(sp.depth)}${sp.label}`}
                </text>
                <rect
                  className={`obv-span-bar ${tone}`}
                  x={bx}
                  y={rowY}
                  width={bw}
                  height={traceBarH}
                  rx={5}
                />
                <text className="obv-span-dur" x={bx + bw + 6} y={rowY + traceBarH / 2 + 4} textAnchor="start">
                  {`${sp.dur}ms`}
                </text>
              </g>
            );
          })}
          {st.spans.length === 0 && (
            <text className="obv-empty" x={traceBarX0} y={traceTop + 40} textAnchor="start">
              fire a request — the waterfall builds span by span
            </text>
          )}

          {/* ---- region 3: metric tiles ---- */}
          <text className="obv-region-label" x={rightX0} y={traceTop - 18} textAnchor="start">metrics</text>
          {[
            { k: 'requests', v: String(st.totalRequests), tone: '' },
            { k: 'errors', v: String(st.errorCount), tone: st.errorCount > 0 ? 'is-bad' : '' },
            { k: 'last latency', v: `${st.lastLatency}ms`, tone: latencyTone },
            { k: 'error rate', v: `${errorRate.toFixed(0)}%`, tone: errorRate > 0 ? 'is-bad' : '' },
          ].map((m, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const tileW = (rightW - 12) / 2;
            const tileH = 44;
            const tx = rightX0 + col * (tileW + 12);
            const ty = traceTop + row * (tileH + 12);
            return (
              <g key={m.k}>
                <rect className="obv-tile" x={tx} y={ty} width={tileW} height={tileH} rx={7} />
                <text className="obv-tile-k" x={tx + 10} y={ty + 16}>{m.k}</text>
                <text className={`obv-tile-v ${m.tone}`} x={tx + 10} y={ty + 36}>{m.v}</text>
              </g>
            );
          })}

          {/* latency gauge bar — spikes when the trace is slow/errored */}
          {(() => {
            const gy = traceTop + 2 * (44 + 12) + 6;
            const gw = rightW;
            const gh = 30;
            const budget = 250; // healthy ceiling
            const cap = 520;
            const fill = Math.min(1, st.lastLatency / cap);
            const budgetX = rightX0 + (budget / cap) * gw;
            const spiked = st.lastLatency > budget;
            return (
              <g>
                <text className="obv-gauge-label" x={rightX0} y={gy - 6} textAnchor="start">latency gauge</text>
                <rect className="obv-gauge-track" x={rightX0} y={gy} width={gw} height={gh} rx={6} />
                <rect
                  className={`obv-gauge-fill ${spiked ? 'is-spike' : ''}`}
                  x={rightX0}
                  y={gy}
                  width={Math.max(2, fill * gw)}
                  height={gh}
                  rx={6}
                />
                <line className="obv-gauge-budget" x1={budgetX} y1={gy - 3} x2={budgetX} y2={gy + gh + 3} />
                <text className="obv-gauge-budget-t" x={budgetX} y={gy + gh + 15} textAnchor="middle">budget 250ms</text>
                <text className={`obv-gauge-v ${spiked ? 'is-warn' : st.lastLatency ? 'is-ok' : ''}`} x={rightX0 + gw} y={gy + gh / 2 + 4} textAnchor="end">
                  {`${st.lastLatency}ms`}
                </text>
              </g>
            );
          })()}

          {/* per-span sparkline */}
          {sparkVals.length > 0 && (() => {
            const sy = traceTop + 2 * (44 + 12) + 6 + 30 + 30;
            const sw = rightW;
            const sh = 34;
            const bw = (sw - (sparkVals.length - 1) * 6) / sparkVals.length;
            return (
              <g>
                <text className="obv-gauge-label" x={rightX0} y={sy - 6} textAnchor="start">per-span ms (this trace)</text>
                {sparkVals.map((v, i) => {
                  const bh = Math.max(3, (v / sparkMax) * sh);
                  const bx = rightX0 + i * (bw + 6);
                  const isDb = SERVICES[i].key === 'db';
                  const cls = isDb && errored ? 'is-error' : isDb && slow ? 'is-warn' : '';
                  return (
                    <rect
                      key={`spark-${i}`}
                      className={`obv-spark ${cls}`}
                      x={bx}
                      y={sy + (sh - bh)}
                      width={bw}
                      height={bh}
                      rx={3}
                    />
                  );
                })}
              </g>
            );
          })()}

          {/* ---- region 4: log stream ---- */}
          <text className="obv-region-label" x={traceX0} y={H - 168} textAnchor="start">logs — structured lines, newest at the bottom (capped)</text>
          <rect className="obv-log-panel" x={traceX0} y={H - 160} width={chainW} height={148} rx={8} />
          {st.logs.length === 0 && (
            <text className="obv-empty" x={traceX0 + 14} y={H - 160 + 28} textAnchor="start">
              log lines stream in as the request progresses
            </text>
          )}
          {st.logs.map((l, i) => {
            const ly = H - 160 + 20 + i * 19;
            return (
              <g key={l.key}>
                <text className="obv-log-ts" x={traceX0 + 14} y={ly} textAnchor="start">{l.ts}</text>
                <text className={`obv-log-lvl ${levelClass(l.level)}`} x={traceX0 + 110} y={ly} textAnchor="start">{l.level}</text>
                <text className="obv-log-svc" x={traceX0 + 168} y={ly} textAnchor="start">{l.svc}</text>
                <text className="obv-log-meta" x={traceX0 + 248} y={ly} textAnchor="start">{`trace=${l.trace} span=${l.span}`}</text>
                <text className="obv-log-msg" x={traceX0 + 410} y={ly} textAnchor="start">{`"${l.msg}"`}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="obv-metrics">
        <div className="obv-metric">
          <span className="obv-metric-label">total requests</span>
          <span className="obv-metric-value">{st.totalRequests}</span>
        </div>
        <div className="obv-metric">
          <span className="obv-metric-label">total spans</span>
          <span className="obv-metric-value">{st.totalSpans}</span>
        </div>
        <div className="obv-metric">
          <span className="obv-metric-label">last latency</span>
          <span className={`obv-metric-value ${latencyTone}`}>{`${st.lastLatency}ms`}</span>
        </div>
        <div className="obv-metric">
          <span className="obv-metric-label">peak / avg latency</span>
          <span className={`obv-metric-value ${st.peakLatency > 250 ? 'is-warn' : ''}`}>{`${st.peakLatency} / ${avgLatency}ms`}</span>
        </div>
        <div className="obv-metric">
          <span className="obv-metric-label">errors</span>
          <span className={`obv-metric-value ${st.errorCount > 0 ? 'is-bad' : ''}`}>{st.errorCount}</span>
        </div>
        <div className="obv-metric">
          <span className="obv-metric-label">error rate</span>
          <span className={`obv-metric-value ${errorRate > 0 ? 'is-bad' : ''}`}>{`${errorRate.toFixed(0)}%`}</span>
        </div>
        <div className="obv-metric">
          <span className="obv-metric-label">log lines</span>
          <span className="obv-metric-value">{st.logs.length}</span>
        </div>
        <div className="obv-metric obv-metric-dim">
          <span className="obv-metric-label">in flight</span>
          <span className={`obv-metric-value ${inFlight ? 'is-ok' : ''}`}>{inFlight ? `trace=${st.activeTrace}` : 'idle'}</span>
        </div>
      </div>

      <div className={`obv-narration ${narrTone}`}>
        <span className={`obv-narration-label ${st.tone === 'bad' ? 'is-bad' : st.tone === 'warn' ? 'is-warn' : st.tone === 'run' ? 'is-ok' : ''}`}>
          {narrLabel}
        </span>
        <span className="obv-narration-body">{st.note}</span>
      </div>

      <div className="obv-legend">
        <span className="obv-legend-item"><GitBranch size={13} className="obv-ic" /> trace: a span per service hop</span>
        <span className="obv-legend-item"><Activity size={13} className="obv-ic" /> metrics: counters + latency gauge</span>
        <span className="obv-legend-item"><ScrollText size={13} className="obv-ic" /> logs: one structured line per event</span>
        <span className="obv-legend-item"><Zap size={13} className="obv-ic is-warn" /> one fault, three views that agree</span>
      </div>
    </div>
  );
}
