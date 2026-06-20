import React, { useMemo, useState } from 'react';
import { RotateCcw, MousePointerClick, Zap, Timer } from 'lucide-react';
import './DistributedTracingViz.css';

// One request fans out across services, each emitting a span under a shared trace-id.
// Span tree (parent/child). A child starts after its parent has done `offset` ms of
// its own work, then runs for its own duration. Siblings under the same parent run
// concurrently. End-to-end latency is the latest finish; the critical path is the
// chain of spans (root -> ... -> latest-finishing leaf) that determines it.
const TRACE_ID = '7f3a-c1e9';
const INJECT_MS = 40;
const MAX_INJECT = 4; // per-span click cap

// id, name, parent, offset = ms into parent's span when this child kicks off, baseDuration.
const SPANS = [
  { id: 'gateway', name: 'api-gateway', parent: null, offset: 0, baseDuration: 30, color: 'var(--accent)' },
  { id: 'auth', name: 'auth-service', parent: 'gateway', offset: 12, baseDuration: 55, color: 'var(--hue-violet)' },
  { id: 'orders', name: 'orders-service', parent: 'gateway', offset: 20, baseDuration: 60, color: 'var(--hue-sky)' },
  { id: 'db', name: 'orders-db', parent: 'orders', offset: 18, baseDuration: 70, color: 'var(--hue-mint)' },
  { id: 'payments', name: 'payments-api', parent: 'orders', offset: 24, baseDuration: 90, color: 'var(--hue-pink)' },
];

const SPAN_BY_ID = SPANS.reduce((m, s) => { m[s.id] = s; return m; }, {});
const childrenOf = (id) => SPANS.filter((s) => s.parent === id);

// Resolve absolute timings from the injected-latency map. Deterministic, no randomness.
function computeTimings(injected) {
  const timings = {};
  const dur = (s) => s.baseDuration + (injected[s.id] || 0) * INJECT_MS;
  const walk = (span, parentStart) => {
    const start = parentStart + span.offset;
    const end = start + dur(span);
    timings[span.id] = { start, end, duration: dur(span) };
    for (const c of childrenOf(span.id)) walk(c, start);
  };
  walk(SPAN_BY_ID.gateway, 0);
  return timings;
}

// Critical path: from root, at each level pick the child whose subtree finishes latest.
function criticalPath(timings) {
  const path = [];
  let node = SPAN_BY_ID.gateway;
  const subtreeFinish = (id) => {
    const kids = childrenOf(id);
    let f = timings[id].end;
    for (const k of kids) f = Math.max(f, subtreeFinish(k.id));
    return f;
  };
  while (node) {
    path.push(node.id);
    const kids = childrenOf(node.id);
    if (kids.length === 0) break;
    let best = null;
    let bestFinish = -Infinity;
    for (const k of kids) {
      const f = subtreeFinish(k.id);
      if (f > bestFinish) { bestFinish = f; best = k; }
    }
    node = best;
  }
  return path;
}

export default function DistributedTracingViz() {
  const [injected, setInjected] = useState({});

  const model = useMemo(() => {
    const timings = computeTimings(injected);
    const total = Math.max(...SPANS.map((s) => timings[s.id].end));
    const path = criticalPath(timings);
    const pathSet = new Set(path);
    const injectedTotal = Object.values(injected).reduce((a, b) => a + b, 0) * INJECT_MS;
    return { timings, total, path, pathSet, injectedTotal };
  }, [injected]);

  const { timings, total, path, pathSet, injectedTotal } = model;

  const inject = (id) => {
    setInjected((prev) => {
      const cur = prev[id] || 0;
      if (cur >= MAX_INJECT) return prev;
      return { ...prev, [id]: cur + 1 };
    });
  };

  const reset = () => setInjected({});

  const pathLabel = path.map((id) => SPAN_BY_ID[id].name.replace('-service', '').replace('-api', '')).join(' → ');

  const onPath = (id) => pathSet.has(id);

  // SVG waterfall geometry.
  const W = 940;
  const rowH = 52;
  const top = 56;
  const labelW = 168;
  const trackX = labelW + 20;
  const trackW = W - trackX - 150;
  const H = top + SPANS.length * rowH + 24;

  const scale = (ms) => (ms / Math.max(1, total)) * trackW;

  // Gridlines every 50ms.
  const gridStep = 50;
  const gridLines = [];
  for (let t = 0; t <= total + 0.001; t += gridStep) gridLines.push(t);

  return (
    <div className="dtv">
      <div className="dtv-head">
        <h3 className="dtv-title">Distributed tracing — one request, one waterfall</h3>
        <p className="dtv-sub">
          A request fans through gateway, auth, orders, db and payments — each emitting a span under trace
          {' '}<span className="dtv-trace-id">{TRACE_ID}</span>. Click a service to inject latency and watch
          the waterfall shift and the critical path move.
        </p>
      </div>

      <div className="dtv-controls">
        <div className="dtv-inject-hint">
          <MousePointerClick size={14} />
          <span>click a span to add +{INJECT_MS}ms (up to {MAX_INJECT}×)</span>
        </div>
        <div className="dtv-chips">
          {SPANS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`dtv-chip ${(injected[s.id] || 0) > 0 ? 'is-hot' : ''} ${onPath(s.id) ? 'is-crit' : ''}`}
              onClick={() => inject(s.id)}
              disabled={(injected[s.id] || 0) >= MAX_INJECT}
              style={{ '--dtv-chip-color': s.color }}
            >
              <span className="dtv-chip-dot" style={{ background: s.color }} />
              {s.name}
              {(injected[s.id] || 0) > 0 ? <span className="dtv-chip-tag">+{(injected[s.id] || 0) * INJECT_MS}</span> : null}
            </button>
          ))}
        </div>
        <span className="dtv-spacer" aria-hidden="true" />
        <button type="button" className="dtv-btn" onClick={reset} disabled={injectedTotal === 0}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dtv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dtv-svg" preserveAspectRatio="xMidYMid meet">
          {/* time gridlines + axis labels */}
          {gridLines.map((t) => {
            const x = trackX + scale(t);
            return (
              <g key={`grid-${t}`}>
                <line className="dtv-grid" x1={x} y1={top - 14} x2={x} y2={top + SPANS.length * rowH - 8} />
                <text className="dtv-grid-label" x={x} y={top - 20} textAnchor="middle">{t}</text>
              </g>
            );
          })}
          <text className="dtv-axis-unit" x={trackX + trackW + 8} y={top - 20} textAnchor="start">ms</text>

          {/* span rows */}
          {SPANS.map((s, i) => {
            const t = timings[s.id];
            const y = top + i * rowH;
            const x = trackX + scale(t.start);
            const w = Math.max(3, scale(t.duration));
            const crit = onPath(s.id);
            const extra = (injected[s.id] || 0) * INJECT_MS;
            const depth = (() => { let d = 0; let p = s.parent; while (p) { d += 1; p = SPAN_BY_ID[p].parent; } return d; })();
            return (
              <g key={s.id} className="dtv-row" onClick={() => inject(s.id)}>
                {/* clickable row band */}
                <rect className="dtv-rowband" x={0} y={y - 4} width={W} height={rowH - 8} />

                {/* service label */}
                <text className="dtv-svc" x={16 + depth * 12} y={y + 21}>{s.name}</text>
                <text className="dtv-svc-sub" x={16 + depth * 12} y={y + 35}>
                  {s.parent ? `child of ${SPAN_BY_ID[s.parent].name}` : 'root span'}
                </text>

                {/* base track */}
                <line className="dtv-track" x1={trackX} y1={y + rowH / 2 - 4} x2={trackX + trackW} y2={y + rowH / 2 - 4} />

                {/* the span bar */}
                <rect
                  className={`dtv-bar ${crit ? 'is-crit' : ''}`}
                  x={x}
                  y={y + 4}
                  width={w}
                  height={rowH - 24}
                  rx={5}
                  style={{ fill: s.color }}
                />
                {/* injected-latency overlay segment at the tail of the bar */}
                {extra > 0 && (
                  <rect
                    className="dtv-bar-extra"
                    x={x + w - scale(extra)}
                    y={y + 4}
                    width={Math.max(2, scale(extra))}
                    height={rowH - 24}
                    rx={3}
                  />
                )}
                {/* timing readout at the end of the bar */}
                <text className="dtv-bar-ms" x={x + w + 8} y={y + rowH / 2 + 1}>
                  {t.duration}ms{extra > 0 ? ` (+${extra})` : ''}
                </text>
              </g>
            );
          })}

          {/* end-to-end marker */}
          <line className="dtv-end" x1={trackX + scale(total)} y1={top - 14} x2={trackX + scale(total)} y2={top + SPANS.length * rowH - 8} />
          <text className="dtv-end-label" x={trackX + scale(total)} y={top + SPANS.length * rowH + 4} textAnchor="middle">
            end-to-end {total}ms
          </text>
        </svg>
      </div>

      <div className="dtv-metrics">
        <div className="dtv-metric">
          <span className="dtv-metric-label"><Timer size={11} /> total latency</span>
          <span className="dtv-metric-value">{total}ms</span>
        </div>
        <div className="dtv-metric">
          <span className="dtv-metric-label">spans</span>
          <span className="dtv-metric-value">{SPANS.length}</span>
        </div>
        <div className="dtv-metric">
          <span className="dtv-metric-label"><Zap size={11} /> injected</span>
          <span className={`dtv-metric-value ${injectedTotal > 0 ? 'is-hot' : ''}`}>{injectedTotal}ms</span>
        </div>
        <div className="dtv-metric dtv-metric-wide">
          <span className="dtv-metric-label">critical path</span>
          <span className="dtv-metric-value is-crit">{pathLabel}</span>
        </div>
      </div>

      <div className="dtv-timings">
        <span className="dtv-timings-label">span timings</span>
        <div className="dtv-timings-list">
          {SPANS.map((s) => {
            const t = timings[s.id];
            return (
              <span key={s.id} className={`dtv-timing ${onPath(s.id) ? 'is-crit' : ''}`}>
                <span className="dtv-timing-dot" style={{ background: s.color }} />
                {s.name}
                <span className="dtv-timing-range">{t.start}–{t.end}ms</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="dtv-narration">
        <span className="dtv-narration-label">trace</span>
        <span className="dtv-narration-body">
          {injectedTotal === 0
            ? `All spans share trace ${TRACE_ID}. End-to-end is ${total}ms, bounded by the critical path ${pathLabel} — the chain whose finish time gates the response. Click ${SPAN_BY_ID.payments.name} to see a single slow dependency stretch the whole request.`
            : `Injected ${injectedTotal}ms of latency. End-to-end is now ${total}ms, still gated by ${pathLabel}. Speeding up any span off this path would not move the total — only the critical-path spans matter.`}
        </span>
      </div>
    </div>
  );
}
