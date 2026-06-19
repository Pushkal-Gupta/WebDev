import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Send, Filter, Layers,
  Activity, ScrollText, GitBranch, Database, AppWindow,
} from 'lucide-react';
import './ObservabilityOtelViz.css';

// OpenTelemetry pipeline — telemetry flows out of one request, through the
// Collector's stages, into the backends.
//
//   App SDK     a handled request emits three signals: spans (a trace),
//               metrics (counters), and a log line. All tagged with one trace id.
//   Collector   receivers ingest the OTLP payload -> processors run in order
//               (batch groups items; a tail-sampling processor may DROP whole
//               traces) -> exporters fan the survivors out to the right backend.
//   Backends    a tracing store, a metrics store, a logs store.
//
// The teaching point: a processor is where volume is shaped. Turn tail-sampling
// on and a deterministic fraction of traces are dropped between the processor
// and the exporter, so the "exported" throughput is lower than "received" —
// you trade fidelity for cost, and you can watch the numbers diverge live.

// One unit of work = one request -> 3 signals (1 trace, 1 metric set, 1 log).
// Deterministic: every Nth request's trace is sampled-out when tail sampling is
// on, so there is no Math.random in the animation.
const SAMPLE_KEEP_EVERY = 3; // tail sampling keeps 1 of every N traces

const STAGES = [
  { key: 'sdk', label: 'app SDK', icon: 'app', sub: 'emit spans/metrics/logs' },
  { key: 'recv', label: 'receivers', icon: 'in', sub: 'OTLP ingest' },
  { key: 'batch', label: 'batch', icon: 'layers', sub: 'group items' },
  { key: 'sample', label: 'tail sample', icon: 'filter', sub: 'drop traces' },
  { key: 'export', label: 'exporters', icon: 'out', sub: 'fan to backends' },
];

const BACKENDS = [
  { key: 'traces', label: 'tracing store', icon: 'trace' },
  { key: 'metrics', label: 'metrics store', icon: 'metric' },
  { key: 'logs', label: 'logs store', icon: 'log' },
];

const TICK_MS = 950;
const MAX_LOG = 6;
const TRACE_IDS = ['a1b2', 'c3d4', 'e5f6', '07a8', 'b9c0', 'd1e2', 'f3a4', '55c6'];

function freshState() {
  return {
    reqId: 0,
    inFlight: null, // { trace, stage, sampledOut }
    received: { traces: 0, metrics: 0, logs: 0 },
    afterSample: { traces: 0, metrics: 0, logs: 0 },
    exported: { traces: 0, metrics: 0, logs: 0 },
    droppedTraces: 0,
    logs: [],
    note: 'Press Fire request. One request emits a trace, a metric set, and a log line — all tagged with the same trace id — and they flow through the Collector into the backends.',
    tone: 'init',
  };
}

function pushLog(logs, line) {
  const next = [...logs, line];
  return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next;
}

const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

export default function ObservabilityOtelViz() {
  const [tailSample, setTailSample] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [firing, setFiring] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [st, setSt] = useState(() => freshState());

  const runTimer = useRef(null);
  const fireTimer = useRef(null);
  const sampleRef = useRef(tailSample);
  const autoRef = useRef(autoplay);
  useEffect(() => { sampleRef.current = tailSample; }, [tailSample]);
  useEffect(() => { autoRef.current = autoplay; }, [autoplay]);

  const delay = useMemo(() => Math.round(TICK_MS / Math.max(speed, 0.1)), [speed]);

  // Advance the in-flight request by one stage. When it leaves the SDK we
  // commit the received signals; when it crosses the sample stage we decide
  // (deterministically) whether the trace survives; at export we commit the
  // survivors. A new request starts when there is none in flight.
  const advance = (prev) => {
    let s = { ...prev };
    const fly = s.inFlight;

    if (!fly) {
      const trace = TRACE_IDS[s.reqId % TRACE_IDS.length];
      const sampleOn = sampleRef.current;
      // keep every Nth trace when sampling; keep all when off
      const sampledOut = sampleOn ? (s.reqId % SAMPLE_KEEP_EVERY !== 0) : false;
      s.inFlight = { trace, stage: 0, sampledOut };
      s.note = `Request entered with trace=${trace}. The SDK emits one span, one metric set, and one log line. They travel together through the receivers, then the processors decide what survives.`;
      s.tone = 'run';
      return s;
    }

    const nextStage = fly.stage + 1;

    if (nextStage === STAGE_INDEX.recv) {
      s.received = {
        traces: s.received.traces + 1,
        metrics: s.received.metrics + 1,
        logs: s.received.logs + 1,
      };
      s.inFlight = { ...fly, stage: nextStage };
      s.note = `Receivers ingested the OTLP payload for trace=${fly.trace}: 1 span, 1 metric set, 1 log. received-traces is now ${s.received.traces}.`;
      s.tone = 'run';
      return s;
    }

    if (nextStage === STAGE_INDEX.batch) {
      s.inFlight = { ...fly, stage: nextStage };
      s.note = `The batch processor groups items so exports go out in bulk rather than one network call per signal. Nothing is dropped here — batching only amortizes I/O.`;
      s.tone = 'run';
      return s;
    }

    if (nextStage === STAGE_INDEX.sample) {
      // metrics + logs always pass; traces may be dropped
      s.afterSample = {
        traces: s.afterSample.traces + (fly.sampledOut ? 0 : 1),
        metrics: s.afterSample.metrics + 1,
        logs: s.afterSample.logs + 1,
      };
      s.inFlight = { ...fly, stage: nextStage };
      if (fly.sampledOut) {
        s.droppedTraces += 1;
        s.tone = 'warn';
        s.note = `Tail sampling DROPPED the trace for ${fly.trace} to cut volume. Its metric and log still pass — only the span is discarded. dropped-traces is now ${s.droppedTraces}.`;
      } else {
        s.tone = 'run';
        s.note = `Tail sampling KEPT the trace for ${fly.trace}. ${sampleRef.current ? `Sampling keeps 1 of every ${SAMPLE_KEEP_EVERY} traces; this one survived.` : 'Sampling is off, so every trace passes through untouched.'}`;
      }
      return s;
    }

    if (nextStage === STAGE_INDEX.export) {
      const keptTrace = !fly.sampledOut;
      s.exported = {
        traces: s.exported.traces + (keptTrace ? 1 : 0),
        metrics: s.exported.metrics + 1,
        logs: s.exported.logs + 1,
      };
      s.logs = pushLog(s.logs, {
        key: `${fly.trace}-${s.reqId}`,
        trace: fly.trace,
        kept: keptTrace,
        text: keptTrace
          ? `exported trace+metric+log → backends`
          : `exported metric+log; trace sampled out`,
      });
      s.inFlight = null;
      s.reqId += 1;
      if (keptTrace) {
        s.tone = 'ok';
        s.note = `Exporters fan the survivors to their backends: the span lands in the tracing store, the metric in the metrics store, the log in the logs store. Full fidelity for ${fly.trace}.`;
      } else {
        s.tone = 'warn';
        s.note = `Exporters sent only the metric and log for ${fly.trace} — its trace was sampled out upstream. exported-traces (${s.exported.traces}) now trails received-traces (${s.received.traces}); that gap is the cost saving.`;
      }
      return s;
    }

    // safety: should not reach here
    s.inFlight = { ...fly, stage: Math.min(nextStage, STAGES.length - 1) };
    return s;
  };

  useEffect(() => {
    if (!autoplay) return undefined;
    runTimer.current = setInterval(() => setSt((p) => advance(p)), delay);
    return () => {
      if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    };
    // advance reads live config via refs
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

  const reset = () => {
    setAutoplay(false);
    if (fireTimer.current) { clearInterval(fireTimer.current); fireTimer.current = null; }
    setFiring(false);
    setSt(freshState());
  };

  // ---- derived ----
  const inFlight = st.inFlight;
  const activeStage = inFlight ? inFlight.stage : -1;
  const total = st.exported.metrics; // requests fully exported
  const keepRate = st.received.traces > 0
    ? Math.round((st.exported.traces / st.received.traces) * 100) : 100;

  // ---- SVG geometry ----
  const W = 960;
  const H = 470;
  const pipeY = 120;
  const boxH = 70;
  const x0 = 24;
  const x1 = W - 24;
  const gap = 20;
  const boxW = (x1 - x0 - (STAGES.length - 1) * gap) / STAGES.length;
  const stageX = (i) => x0 + i * (boxW + gap);

  // backend lane
  const beTop = 270;
  const beW = 200;
  const beH = 52;
  const beGap = 22;
  const beX = (i) => x0 + 230 + i * (beW + beGap);
  const exportX = stageX(STAGE_INDEX.export) + boxW / 2;

  const stageIcon = (s, active) => {
    const cls = `ootv-stage-ic ${active ? 'is-on' : ''}`;
    if (s.icon === 'app') return <AppWindow width={18} height={18} className={cls} />;
    if (s.icon === 'in') return <Send width={18} height={18} className={cls} />;
    if (s.icon === 'layers') return <Layers width={18} height={18} className={cls} />;
    if (s.icon === 'filter') return <Filter width={18} height={18} className={cls} />;
    return <Send width={18} height={18} className={cls} />;
  };

  const beIcon = (k) => {
    if (k === 'traces') return <GitBranch width={16} height={16} className="ootv-be-ic is-trace" />;
    if (k === 'metrics') return <Activity width={16} height={16} className="ootv-be-ic is-metric" />;
    return <ScrollText width={16} height={16} className="ootv-be-ic is-log" />;
  };

  const narrTone = st.tone === 'warn' ? 'is-warn' : st.tone === 'ok' ? 'is-ok' : '';

  return (
    <div className="ootv">
      <div className="ootv-head">
        <h3 className="ootv-title">OpenTelemetry pipeline — one request, three signals, one Collector</h3>
        <p className="ootv-sub">
          A request emits a trace, a metric set, and a log line. Watch them flow through the Collector&rsquo;s
          receivers, batch, and tail-sampling stages into the backends. Turn tail sampling on and exported traces
          fall below received as some are dropped to cut cost.
        </p>
      </div>

      <div className="ootv-controls">
        <button
          type="button"
          className={`ootv-toggle ${tailSample ? 'is-on is-warn' : ''}`}
          onClick={() => setTailSample((v) => !v)}
          aria-pressed={tailSample}
          title="Drop a deterministic fraction of traces to cut telemetry volume"
        >
          <Filter size={13} /> tail sampling {tailSample ? 'on' : 'off'}
        </button>
        <span className={`ootv-tag ${tailSample ? 'is-warn' : ''}`}>
          {tailSample ? `keep 1 of ${SAMPLE_KEEP_EVERY} traces` : 'keep every trace'}
        </span>

        <label className="ootv-speed">
          <span className="ootv-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ootv-speed-range" aria-label="Animation speed"
          />
          <span className="ootv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="ootv-spacer" aria-hidden="true" />

        <div className="ootv-buttons">
          <button
            type="button" className="ootv-btn ootv-btn-primary"
            onClick={fireRequest} disabled={autoplay || firing}
            title="Send one request through the pipeline"
          >
            <Send size={14} /> Fire request
          </button>
          <button
            type="button" className={`ootv-btn ${autoplay ? 'ootv-btn-on' : ''}`}
            onClick={() => setAutoplay((v) => !v)}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Stop stream' : 'Auto stream'}
          </button>
          <button type="button" className="ootv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="ootv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ootv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ootv-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="ootv-ah" />
            </marker>
            <marker id="ootv-arr-drop" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="ootv-ah is-drop" />
            </marker>
          </defs>

          {/* collector boundary */}
          <rect className="ootv-collector" x={stageX(1) - 12} y={pipeY - 34} width={stageX(STAGES.length - 1) + boxW - stageX(1) + 24} height={boxH + 56} rx={12} />
          <text className="ootv-collector-label" x={stageX(1) - 4} y={pipeY - 42} textAnchor="start">OTel Collector — receivers → processors → exporters</text>

          {/* pipeline stages */}
          {STAGES.map((s, i) => {
            const x = stageX(i);
            const active = activeStage === i;
            const passed = inFlight && inFlight.stage > i;
            const isSample = s.key === 'sample';
            const tone = active && isSample && tailSample ? 'is-warn' : active ? 'is-active' : passed ? 'is-passed' : '';
            return (
              <g key={s.key}>
                {i < STAGES.length - 1 && (
                  <line
                    className={`ootv-edge ${passed ? 'is-passed' : ''}`}
                    x1={x + boxW} y1={pipeY + boxH / 2}
                    x2={stageX(i + 1)} y2={pipeY + boxH / 2}
                    markerEnd="url(#ootv-arr)"
                  />
                )}
                <rect className={`ootv-stagebox ${tone} ${isSample && tailSample ? 'is-sampling' : ''}`} x={x} y={pipeY} width={boxW} height={boxH} rx={9} />
                <g transform={`translate(${x + 12}, ${pipeY + 12})`}>{stageIcon(s, active)}</g>
                <text className="ootv-stage-label" x={x + boxW / 2} y={pipeY + 44} textAnchor="middle">{s.label}</text>
                <text className="ootv-stage-sub" x={x + boxW / 2} y={pipeY + 60} textAnchor="middle">{s.sub}</text>
              </g>
            );
          })}

          {/* in-flight signal dots riding the active stage */}
          {inFlight && (
            <g>
              {['traces', 'metrics', 'logs'].map((sig, k) => {
                const x = stageX(activeStage) + boxW / 2;
                const dropped = sig === 'traces' && inFlight.sampledOut && inFlight.stage >= STAGE_INDEX.sample;
                return (
                  <circle
                    key={sig}
                    className={`ootv-signal is-${sig} ${dropped ? 'is-dropped' : ''}`}
                    cx={x - 18 + k * 18}
                    cy={pipeY - 14}
                    r={5}
                  />
                );
              })}
              <text className="ootv-signal-trace" x={stageX(activeStage) + boxW / 2} y={pipeY - 24} textAnchor="middle">
                {`trace=${inFlight.trace}`}
              </text>
            </g>
          )}

          {/* export -> backends fan */}
          {BACKENDS.map((b, i) => {
            const bx = beX(i);
            const by = beTop;
            const k = b.key;
            const dropEdge = k === 'traces' && tailSample;
            return (
              <g key={b.key}>
                <path
                  className={`ootv-fan is-${k} ${dropEdge ? 'is-thin' : ''}`}
                  d={`M ${exportX} ${pipeY + boxH} C ${exportX} ${pipeY + boxH + 50}, ${bx + beW / 2} ${by - 50}, ${bx + beW / 2} ${by}`}
                  fill="none"
                  markerEnd={`url(#ootv-arr)`}
                />
                <rect className={`ootv-be is-${k}`} x={bx} y={by} width={beW} height={beH} rx={9} />
                <g transform={`translate(${bx + 12}, ${by + beH / 2 - 8})`}>{beIcon(k)}</g>
                <text className="ootv-be-label" x={bx + 36} y={by + beH / 2 - 2} textAnchor="start">{b.label}</text>
                <text className={`ootv-be-count is-${k}`} x={bx + 36} y={by + beH / 2 + 14} textAnchor="start">
                  {`${st.exported[k]} stored`}
                </text>
              </g>
            );
          })}

          {/* throughput gauge: received vs exported traces */}
          {(() => {
            const gy = 358;
            const gx = x0;
            const gw = W - 48;
            const barH = 18;
            const cap = Math.max(1, st.received.traces);
            const recvW = gw;
            const expW = (st.exported.traces / cap) * gw;
            return (
              <g>
                <text className="ootv-gauge-label" x={gx} y={gy - 8} textAnchor="start">trace throughput — received vs exported</text>
                <rect className="ootv-gauge-track" x={gx} y={gy} width={recvW} height={barH} rx={5} />
                <rect className="ootv-gauge-recv" x={gx} y={gy} width={recvW} height={barH} rx={5} />
                <rect className="ootv-gauge-exp" x={gx} y={gy} width={Math.max(2, expW)} height={barH} rx={5} />
                <text className="ootv-gauge-v" x={gx + recvW} y={gy + barH + 16} textAnchor="end">
                  {`received ${st.received.traces} · exported ${st.exported.traces} · keep ${keepRate}%`}
                </text>
                <text className={`ootv-gauge-drop ${st.droppedTraces > 0 ? 'is-warn' : ''}`} x={gx} y={gy + barH + 16} textAnchor="start">
                  {`dropped traces: ${st.droppedTraces}`}
                </text>
              </g>
            );
          })()}

          {/* export log stream */}
          <text className="ootv-log-label" x={x0} y={H - 64} textAnchor="start">exporter log — newest at bottom (capped)</text>
          <rect className="ootv-log-panel" x={x0} y={H - 56} width={W - 48} height={48} rx={8} />
          {st.logs.length === 0 && (
            <text className="ootv-empty" x={x0 + 12} y={H - 56 + 18} textAnchor="start">export lines stream here as requests complete</text>
          )}
          {st.logs.slice(-3).map((l, i) => (
            <text key={l.key} className={`ootv-log-line ${l.kept ? 'is-ok' : 'is-warn'}`} x={x0 + 12} y={H - 56 + 16 + i * 14} textAnchor="start">
              {`trace=${l.trace}  ${l.text}`}
            </text>
          ))}
        </svg>
      </div>

      <div className="ootv-metrics">
        <div className="ootv-metric">
          <span className="ootv-metric-label">requests done</span>
          <span className="ootv-metric-value">{total}</span>
        </div>
        <div className="ootv-metric">
          <span className="ootv-metric-label">traces received</span>
          <span className="ootv-metric-value">{st.received.traces}</span>
        </div>
        <div className="ootv-metric">
          <span className="ootv-metric-label">traces exported</span>
          <span className={`ootv-metric-value ${st.droppedTraces > 0 ? 'is-warn' : 'is-ok'}`}>{st.exported.traces}</span>
        </div>
        <div className="ootv-metric">
          <span className="ootv-metric-label">traces dropped</span>
          <span className={`ootv-metric-value ${st.droppedTraces > 0 ? 'is-warn' : ''}`}>{st.droppedTraces}</span>
        </div>
        <div className="ootv-metric">
          <span className="ootv-metric-label">trace keep rate</span>
          <span className={`ootv-metric-value ${keepRate < 100 ? 'is-warn' : 'is-ok'}`}>{`${keepRate}%`}</span>
        </div>
        <div className="ootv-metric ootv-metric-dim">
          <span className="ootv-metric-label">in flight</span>
          <span className={`ootv-metric-value ${inFlight ? 'is-ok' : ''}`}>{inFlight ? `trace=${inFlight.trace}` : 'idle'}</span>
        </div>
      </div>

      <div className={`ootv-narration ${narrTone}`}>
        <span className={`ootv-narration-label ${narrTone}`}>
          {st.tone === 'warn' ? 'sampled' : st.tone === 'ok' ? 'exported' : st.tone === 'init' ? 'ready' : 'flow'}
        </span>
        <span className="ootv-narration-body">{st.note}</span>
      </div>

      <div className="ootv-legend">
        <span className="ootv-legend-item"><GitBranch size={13} className="ootv-ic is-trace" /> trace — spans, droppable by sampling</span>
        <span className="ootv-legend-item"><Activity size={13} className="ootv-ic is-metric" /> metric — always exported</span>
        <span className="ootv-legend-item"><ScrollText size={13} className="ootv-ic is-log" /> log — always exported</span>
        <span className="ootv-legend-item"><Database size={13} className="ootv-ic" /> three backends behind one Collector</span>
      </div>
    </div>
  );
}
