import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Send, Activity, ScrollText,
  GitBranch, AlertTriangle, Gauge,
} from 'lucide-react';
import './MetricsLogsTracesViz.css';

// Metrics vs logs vs traces — one request, three observability signals, each a
// different projection of the SAME event.
//
//   metric   a numeric time-series. The request becomes a +1 on a counter and a
//            latency bucket. Cheap to store, cheap to aggregate, but it keeps NO
//            per-request detail: you see "p95 latency rose", never which user.
//   log      a discrete, searchable event line. Full detail (user, path, status,
//            latency) but verbose — one line per request, expensive at volume.
//   trace    a span tree across services. One request fans into spans per hop
//            (gateway -> auth -> orders -> db); you see exactly where time went.
//
// The high-cardinality toggle is the teaching point: add a unique user_id label
// to the metric and the time-series count explodes (one series per user), while
// logs and traces shrug — they already carry per-request identity. That is why
// you don't put unbounded labels on metrics.

const SERVICES = ['gateway', 'auth', 'orders', 'db'];
// deterministic per-request data; no Math.random in the animation
const USERS = ['u-417', 'u-882', 'u-039', 'u-561', 'u-273', 'u-190', 'u-755', 'u-628'];
const PATHS = ['/checkout', '/cart', '/login', '/orders', '/search'];
const STATUSES = ['200', '200', '200', '500', '200', '404', '200', '200'];
const LATENCIES = [42, 88, 130, 61, 205, 37, 96, 154];
const SPAN_MS = [6, 9, 14, 17]; // per-service span durations cycled deterministically

const MAX_LOG = 5;
const TICK_MS = 900;

function freshState() {
  return {
    reqId: 0,
    inFlight: null, // { user, path, status, latency, signal: 'metric'|'log'|'trace' }
    metricTicks: 0, // total requests counted
    errorTicks: 0,
    latencySum: 0,
    logs: [],
    seriesSeen: new Set(['http_requests_total{path,status}']),
    note: 'Press Fire request. One request is recorded three ways at once — a metric tick, a log line, and a trace span tree. Toggle high-cardinality labels to watch the metric series count explode while logs and traces stay flat.',
    tone: 'init',
  };
}

function pushLog(logs, line) {
  const next = [...logs, line];
  return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next;
}

export default function MetricsLogsTracesViz() {
  const [highCard, setHighCard] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [firing, setFiring] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [st, setSt] = useState(() => freshState());

  const runTimer = useRef(null);
  const fireTimer = useRef(null);
  const cardRef = useRef(highCard);
  const autoRef = useRef(autoplay);
  useEffect(() => { cardRef.current = highCard; }, [highCard]);
  useEffect(() => { autoRef.current = autoplay; }, [autoplay]);

  const delay = useMemo(() => Math.round(TICK_MS / Math.max(speed, 0.1)), [speed]);

  // Each fire records one request into all three signals at once. Deterministic
  // values cycle by reqId so the animation never uses Math.random.
  const recordRequest = (prev) => {
    const s = { ...prev };
    const i = s.reqId;
    const user = USERS[i % USERS.length];
    const path = PATHS[i % PATHS.length];
    const status = STATUSES[i % STATUSES.length];
    const latency = LATENCIES[i % LATENCIES.length];
    const isErr = status !== '200';

    s.inFlight = { user, path, status, latency, isErr };
    s.metricTicks += 1;
    s.errorTicks += isErr ? 1 : 0;
    s.latencySum += latency;
    s.logs = pushLog(s.logs, {
      key: `${i}-${user}`,
      user, path, status, latency, isErr,
    });

    // series set: low-cardinality keeps one series; high-cardinality adds one
    // distinct series per user_id, so the count grows with traffic.
    const series = new Set(s.seriesSeen);
    if (cardRef.current) series.add(`http_requests_total{path,status,user_id="${user}"}`);
    s.seriesSeen = series;

    s.reqId = i + 1;
    s.tone = isErr ? 'warn' : 'ok';
    s.note = isErr
      ? `Request ${user} ${path} → ${status} in ${latency}ms. The metric counts it as one error tick (you see the error RATE rise, not who). The log line keeps the full detail — user, path, status. The trace shows the span where it failed.`
      : `Request ${user} ${path} → ${status} in ${latency}ms. Recorded three ways at once: a +1 metric tick (aggregate only), a searchable log line (full detail), and a ${SERVICES.length}-span trace across ${SERVICES.join(' → ')}.`;
    return s;
  };

  useEffect(() => {
    if (!autoplay) return undefined;
    runTimer.current = setInterval(() => setSt((p) => recordRequest(p)), delay);
    return () => {
      if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    };
  }, [autoplay, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
    if (fireTimer.current) clearTimeout(fireTimer.current);
  }, []);

  const fireRequest = () => {
    if (autoRef.current || fireTimer.current) return;
    setFiring(true);
    setSt((p) => recordRequest(p));
    fireTimer.current = setTimeout(() => {
      if (fireTimer.current) { clearTimeout(fireTimer.current); fireTimer.current = null; }
      setFiring(false);
    }, delay);
  };

  const reset = () => {
    setAutoplay(false);
    if (fireTimer.current) { clearTimeout(fireTimer.current); fireTimer.current = null; }
    setFiring(false);
    setSt(freshState());
  };

  // ---- derived ----
  const inFlight = st.inFlight;
  const avgLatency = st.metricTicks > 0
    ? Math.round(st.latencySum / Math.max(st.metricTicks, 1)) : 0;
  const errRate = st.metricTicks > 0
    ? Math.round((st.errorTicks / Math.max(st.metricTicks, 1)) * 100) : 0;
  const seriesCount = st.seriesSeen.size;

  // ---- SVG geometry ----
  const W = 960;
  const H = 430;
  const colW = (W - 48 - 2 * 16) / 3;
  const colX = (i) => 24 + i * (colW + 16);
  const colTop = 64;
  const colH = 300;

  const narrTone = st.tone === 'warn' ? 'is-warn' : st.tone === 'ok' ? 'is-ok' : '';

  // metric mini sparkline points from recent latencies (deterministic)
  const spark = useMemo(() => {
    const n = 12;
    const pts = [];
    for (let k = 0; k < n; k += 1) {
      const idx = st.reqId - n + k;
      const v = idx >= 0 ? LATENCIES[idx % LATENCIES.length] : 0;
      pts.push(v);
    }
    return pts;
  }, [st.reqId]);
  const sparkMax = Math.max(...spark, 1);

  return (
    <div className="mlt">
      <div className="mlt-head">
        <h3 className="mlt-title">Metrics, logs, traces — one request, three projections</h3>
        <p className="mlt-sub">
          Fire a request and watch it land in all three observability signals at once: a metric tick,
          a log line, and a span tree. Turn on high-cardinality labels to see the metric series count
          explode while logs and traces stay flat.
        </p>
      </div>

      <div className="mlt-controls">
        <button
          type="button"
          className={`mlt-toggle ${highCard ? 'is-on is-warn' : ''}`}
          onClick={() => setHighCard((v) => !v)}
          aria-pressed={highCard}
          title="Add a unique user_id label to the metric — one new time-series per user"
        >
          <AlertTriangle size={13} /> high-cardinality label {highCard ? 'on' : 'off'}
        </button>
        <span className={`mlt-tag ${highCard ? 'is-warn' : ''}`}>
          {highCard ? 'metric: 1 series per user_id' : 'metric: 1 shared series'}
        </span>

        <label className="mlt-speed">
          <span className="mlt-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mlt-speed-range" aria-label="Animation speed"
          />
          <span className="mlt-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mlt-spacer" aria-hidden="true" />

        <div className="mlt-buttons">
          <button
            type="button" className="mlt-btn mlt-btn-primary"
            onClick={fireRequest} disabled={autoplay || firing}
          >
            <Send size={14} /> Fire request
          </button>
          <button
            type="button" className={`mlt-btn ${autoplay ? 'mlt-btn-on' : ''}`}
            onClick={() => setAutoplay((v) => !v)}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Stop stream' : 'Auto stream'}
          </button>
          <button type="button" className="mlt-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="mlt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mlt-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mlt-ah" />
            </marker>
          </defs>

          {/* request banner */}
          <rect className={`mlt-req ${inFlight ? (inFlight.isErr ? 'is-err' : 'is-on') : ''}`} x={24} y={16} width={W - 48} height={34} rx={8} />
          <text className="mlt-req-label" x={36} y={37} textAnchor="start">
            {inFlight
              ? `request: ${inFlight.user}  ${inFlight.path}  →  ${inFlight.status}  ·  ${inFlight.latency}ms`
              : 'request: idle — press Fire request to emit one event into all three signals'}
          </text>

          {/* three columns */}
          {[0, 1, 2].map((ci) => {
            const x = colX(ci);
            return (
              <line
                key={`feed-${ci}`}
                className={`mlt-feed ${inFlight ? 'is-on' : ''}`}
                x1={W / 2} y1={50}
                x2={x + colW / 2} y2={colTop}
                markerEnd="url(#mlt-arr)"
              />
            );
          })}

          {/* metric column */}
          {(() => {
            const x = colX(0);
            return (
              <g>
                <rect className="mlt-col is-metric" x={x} y={colTop} width={colW} height={colH} rx={10} />
                <text className="mlt-col-title is-metric" x={x + 14} y={colTop + 24} textAnchor="start">metric</text>
                <text className="mlt-col-sub" x={x + 14} y={colTop + 40} textAnchor="start">aggregated time-series</text>

                {/* sparkline */}
                <g>
                  {spark.map((v, k) => {
                    const bw = (colW - 36) / spark.length;
                    const bx = x + 18 + k * bw;
                    const bh = (v / sparkMax) * 70;
                    const by = colTop + 140 - bh;
                    return <rect key={k} className="mlt-spark" x={bx} y={by} width={Math.max(bw - 2, 2)} height={Math.max(bh, 1)} rx={1.5} />;
                  })}
                  <text className="mlt-col-cap" x={x + 18} y={colTop + 158} textAnchor="start">latency p-series (last 12)</text>
                </g>

                <text className="mlt-col-row" x={x + 18} y={colTop + 188} textAnchor="start">requests_total</text>
                <text className="mlt-col-num is-metric" x={x + colW - 18} y={colTop + 188} textAnchor="end">{st.metricTicks}</text>
                <text className="mlt-col-row" x={x + 18} y={colTop + 210} textAnchor="start">avg latency</text>
                <text className="mlt-col-num is-metric" x={x + colW - 18} y={colTop + 210} textAnchor="end">{avgLatency}ms</text>
                <text className="mlt-col-row" x={x + 18} y={colTop + 232} textAnchor="start">error rate</text>
                <text className={`mlt-col-num ${errRate > 0 ? 'is-warn' : 'is-metric'}`} x={x + colW - 18} y={colTop + 232} textAnchor="end">{errRate}%</text>

                <text className={`mlt-col-row ${highCard ? 'is-warn' : ''}`} x={x + 18} y={colTop + 262} textAnchor="start">active series</text>
                <text className={`mlt-col-num ${highCard ? 'is-warn' : 'is-metric'}`} x={x + colW - 18} y={colTop + 262} textAnchor="end">{seriesCount}</text>
                {highCard && (
                  <text className="mlt-col-warn" x={x + 18} y={colTop + 284} textAnchor="start">cardinality blows up — one series per user</text>
                )}
                {!highCard && (
                  <text className="mlt-col-ok" x={x + 18} y={colTop + 284} textAnchor="start">no per-request detail — cheap to store</text>
                )}
              </g>
            );
          })()}

          {/* log column */}
          {(() => {
            const x = colX(1);
            return (
              <g>
                <rect className="mlt-col is-log" x={x} y={colTop} width={colW} height={colH} rx={10} />
                <text className="mlt-col-title is-log" x={x + 14} y={colTop + 24} textAnchor="start">logs</text>
                <text className="mlt-col-sub" x={x + 14} y={colTop + 40} textAnchor="start">discrete, searchable events</text>

                {st.logs.length === 0 && (
                  <text className="mlt-empty" x={x + 14} y={colTop + 80} textAnchor="start">log lines stream here</text>
                )}
                {st.logs.map((l, k) => {
                  const ly = colTop + 64 + k * 30;
                  return (
                    <g key={l.key}>
                      <rect className={`mlt-logrow ${l.isErr ? 'is-err' : ''}`} x={x + 12} y={ly} width={colW - 24} height={26} rx={5} />
                      <text className={`mlt-logline ${l.isErr ? 'is-err' : ''}`} x={x + 20} y={ly + 12} textAnchor="start">
                        {`${l.user} ${l.path}`}
                      </text>
                      <text className={`mlt-logmeta ${l.isErr ? 'is-err' : ''}`} x={x + 20} y={ly + 22} textAnchor="start">
                        {`status=${l.status} latency=${l.latency}ms`}
                      </text>
                    </g>
                  );
                })}
                <text className="mlt-col-ok" x={x + 14} y={colTop + colH - 16} textAnchor="start">full detail per request — verbose at volume</text>
              </g>
            );
          })()}

          {/* trace column */}
          {(() => {
            const x = colX(2);
            const baseLat = inFlight ? inFlight.latency : 0;
            return (
              <g>
                <rect className="mlt-col is-trace" x={x} y={colTop} width={colW} height={colH} rx={10} />
                <text className="mlt-col-title is-trace" x={x + 14} y={colTop + 24} textAnchor="start">trace</text>
                <text className="mlt-col-sub" x={x + 14} y={colTop + 40} textAnchor="start">per-request span tree</text>

                {SERVICES.map((svc, k) => {
                  const sy = colTop + 64 + k * 40;
                  const dur = SPAN_MS[k % SPAN_MS.length] + (inFlight ? (inFlight.latency % 7) : 0);
                  const indent = k * 14;
                  const barMax = colW - 36 - indent;
                  const totalDur = SPAN_MS.reduce((a, b) => a + b, 0) + (inFlight ? (inFlight.latency % 7) * SERVICES.length : 0);
                  const bw = (dur / Math.max(totalDur, 1)) * barMax + 24;
                  const errSpan = inFlight && inFlight.isErr && k === SERVICES.length - 2;
                  return (
                    <g key={svc}>
                      <text className="mlt-span-label" x={x + 18 + indent} y={sy + 4} textAnchor="start">{svc}</text>
                      <rect
                        className={`mlt-span ${inFlight ? 'is-on' : ''} ${errSpan ? 'is-err' : ''}`}
                        x={x + 18 + indent} y={sy + 10} width={Math.max(bw, 10)} height={14} rx={3}
                      />
                      <text className="mlt-span-dur" x={x + 22 + indent} y={sy + 21} textAnchor="start">
                        {`${dur}ms`}
                      </text>
                    </g>
                  );
                })}
                <text className="mlt-col-cap" x={x + 14} y={colTop + 64 + SERVICES.length * 40 + 4} textAnchor="start">
                  {inFlight ? `span tree: ${baseLat}ms across ${SERVICES.length} services` : 'fire a request to see its span tree'}
                </text>
                <text className="mlt-col-ok" x={x + 14} y={colTop + colH - 16} textAnchor="start">shows where time went — one request, end to end</text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mlt-table">
        <div className="mlt-trow mlt-thead">
          <span className="mlt-tcell mlt-tcell-h">signal</span>
          <span className="mlt-tcell mlt-tcell-h">what it stores</span>
          <span className="mlt-tcell mlt-tcell-h">cardinality</span>
          <span className="mlt-tcell mlt-tcell-h">cost</span>
          <span className="mlt-tcell mlt-tcell-h">best for</span>
        </div>
        <div className="mlt-trow is-metric">
          <span className="mlt-tcell is-metric"><Activity size={12} /> metric</span>
          <span className="mlt-tcell">aggregated numbers over time</span>
          <span className="mlt-tcell">must stay low</span>
          <span className="mlt-tcell">cheap</span>
          <span className="mlt-tcell">dashboards, alerts, trends</span>
        </div>
        <div className="mlt-trow is-log">
          <span className="mlt-tcell is-log"><ScrollText size={12} /> log</span>
          <span className="mlt-tcell">discrete event with full detail</span>
          <span className="mlt-tcell">unbounded ok</span>
          <span className="mlt-tcell">medium–high</span>
          <span className="mlt-tcell">debugging a specific event</span>
        </div>
        <div className="mlt-trow is-trace">
          <span className="mlt-tcell is-trace"><GitBranch size={12} /> trace</span>
          <span className="mlt-tcell">span tree across services</span>
          <span className="mlt-tcell">per-request id</span>
          <span className="mlt-tcell">high (sampled)</span>
          <span className="mlt-tcell">latency, cross-service flow</span>
        </div>
      </div>

      <div className="mlt-metrics">
        <div className="mlt-metric">
          <span className="mlt-metric-label">requests recorded</span>
          <span className="mlt-metric-value">{st.metricTicks}</span>
        </div>
        <div className="mlt-metric">
          <span className="mlt-metric-label">avg latency</span>
          <span className="mlt-metric-value">{avgLatency}ms</span>
        </div>
        <div className="mlt-metric">
          <span className="mlt-metric-label">error rate</span>
          <span className={`mlt-metric-value ${errRate > 0 ? 'is-warn' : 'is-ok'}`}>{errRate}%</span>
        </div>
        <div className="mlt-metric">
          <span className="mlt-metric-label">metric series</span>
          <span className={`mlt-metric-value ${highCard ? 'is-warn' : ''}`}>{seriesCount}</span>
        </div>
        <div className="mlt-metric mlt-metric-dim">
          <span className="mlt-metric-label">last event</span>
          <span className={`mlt-metric-value ${inFlight ? (inFlight.isErr ? 'is-warn' : 'is-ok') : ''}`}>
            {inFlight ? `${inFlight.user} ${inFlight.status}` : 'idle'}
          </span>
        </div>
      </div>

      <div className={`mlt-narration ${narrTone}`}>
        <span className={`mlt-narration-label ${narrTone}`}>
          {st.tone === 'warn' ? 'error recorded' : st.tone === 'ok' ? 'recorded' : 'ready'}
        </span>
        <span className="mlt-narration-body">{st.note}</span>
      </div>

      <div className="mlt-legend">
        <span className="mlt-legend-item"><Activity size={13} className="mlt-ic is-metric" /> metric — aggregate only, keep cardinality low</span>
        <span className="mlt-legend-item"><ScrollText size={13} className="mlt-ic is-log" /> log — full detail, searchable, verbose</span>
        <span className="mlt-legend-item"><GitBranch size={13} className="mlt-ic is-trace" /> trace — per-request span tree</span>
        <span className="mlt-legend-item"><Gauge size={13} className="mlt-ic is-warn" /> high cardinality breaks metrics, not logs/traces</span>
      </div>
    </div>
  );
}
