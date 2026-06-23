import React, { useMemo, useState } from 'react';
import { Layers, Database, ChevronUp, ChevronDown, RotateCcw, Users } from 'lucide-react';
import './RequestCoalescingViz.css';

// Request coalescing (a.k.a. single-flight) — when many concurrent callers ask
// for the same missing cache key at once, only ONE of them actually hits the
// backend. The first caller becomes the "leader" and launches the fetch; every
// other caller attaches as a "waiter" on the same in-flight promise. When the
// fetch resolves, the single result is fanned back to all of them.
//
// Without coalescing, N cache misses for the same key => N backend calls
// (cache stampede / thundering herd). With coalescing => exactly 1.

// Deterministic preset counts + stepper — never random.
const PRESETS = [3, 6, 10, 16];

export default function RequestCoalescingViz() {
  const [n, setN] = useState(6);
  const [coalesce, setCoalesce] = useState(true);

  const model = useMemo(() => {
    const backendCalls = coalesce ? 1 : n;
    const waiters = coalesce ? n - 1 : 0;
    const saved = n - backendCalls;
    const savedPct = n > 0 ? Math.round((saved / n) * 100) : 0;
    return { backendCalls, waiters, saved, savedPct };
  }, [n, coalesce]);

  const reset = () => {
    setN(6);
    setCoalesce(true);
  };

  const stepN = (dir) => {
    const idx = PRESETS.indexOf(n);
    if (idx === -1) {
      setN(PRESETS[0]);
      return;
    }
    setN(PRESETS[(idx + dir + PRESETS.length) % PRESETS.length]);
  };

  // SVG geometry — vertical: requests at top, coalescer, backend, result.
  const W = 940;
  const H = 560;
  const colX = W / 2;

  const reqY = 64;
  const reqR = 15;
  const reqSpan = Math.min(W - 120, n * 56);
  const reqStep = n > 1 ? reqSpan / (n - 1) : 0;
  const reqStartX = colX - reqSpan / 2;
  const reqXs = Array.from({ length: n }, (_, i) => (n > 1 ? reqStartX + i * reqStep : colX));

  const coalY = 196;
  const coalW = 360;
  const coalH = 64;
  const coalX = colX - coalW / 2;

  const backendY = 330;
  const backendW = 280;
  const backendH = 70;
  const backendX = colX - backendW / 2;

  const resultY = 462;
  const resultR = 15;

  const leaderHue = 'var(--hue-mint)';
  const waiterHue = 'var(--hue-sky)';

  return (
    <div className="rcv">
      <div className="rcv-head">
        <h3 className="rcv-title">Request coalescing — many identical misses, one backend call</h3>
        <p className="rcv-sub">
          When concurrent callers all miss the cache for the same key, the first becomes the leader and fetches;
          the rest wait on its in-flight promise and share the single result. One trip, not a stampede.
        </p>
      </div>

      <div className="rcv-controls">
        <div className="rcv-presets">
          <span className="rcv-input-label">concurrent requests</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`rcv-chip ${n === p ? 'is-active' : ''}`}
              onClick={() => setN(p)}
            >
              {p}
            </button>
          ))}
          <span className="rcv-stepper">
            <button type="button" className="rcv-step-btn" onClick={() => stepN(1)} aria-label="More requests">
              <ChevronUp size={13} />
            </button>
            <button type="button" className="rcv-step-btn" onClick={() => stepN(-1)} aria-label="Fewer requests">
              <ChevronDown size={13} />
            </button>
          </span>
        </div>

        <span className="rcv-spacer" aria-hidden="true" />

        <button
          type="button"
          className={`rcv-btn ${coalesce ? 'rcv-btn-primary' : ''}`}
          onClick={() => setCoalesce((v) => !v)}
        >
          <Layers size={14} /> {coalesce ? 'Coalescing on' : 'Coalescing off'}
        </button>
        <button type="button" className="rcv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="rcv-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="rcv-arrowhead" />
            </marker>
          </defs>

          <text className="rcv-row-label" x={24} y={reqY - 30}>
            {n} concurrent requests · key &quot;user:42&quot;
          </text>

          {/* request nodes + their edges down to the coalescer */}
          {reqXs.map((x, i) => {
            const isLeader = i === 0;
            const hue = coalesce && !isLeader ? waiterHue : leaderHue;
            return (
              <g key={`req-${i}`}>
                <line
                  className={`rcv-edge ${coalesce && !isLeader ? 'is-waiter' : ''}`}
                  x1={x}
                  y1={reqY + reqR}
                  x2={colX}
                  y2={coalY}
                  style={{ stroke: hue }}
                  markerEnd="url(#rcv-arrow)"
                />
                <circle className="rcv-node" cx={x} cy={reqY} r={reqR} style={{ stroke: hue }} />
                <text className="rcv-node-tag" x={x} y={reqY + 4}>{i + 1}</text>
                {coalesce && (
                  <text className="rcv-node-role" x={x} y={reqY - reqR - 6} style={{ fill: hue }}>
                    {isLeader ? 'leader' : 'wait'}
                  </text>
                )}
              </g>
            );
          })}

          {/* coalescer band */}
          <rect className="rcv-coal" x={coalX} y={coalY} width={coalW} height={coalH} rx={11} />
          <g transform={`translate(${coalX + 16}, ${coalY + 13})`}>
            <Layers width={16} height={16} className="rcv-ic" />
          </g>
          <text className="rcv-coal-title" x={colX} y={coalY + 27}>
            {coalesce ? 'single-flight coalescer' : 'no coalescer — pass-through'}
          </text>
          <text className="rcv-coal-sub" x={colX} y={coalY + 48}>
            {coalesce
              ? `1 in-flight promise · ${model.waiters} waiter${model.waiters === 1 ? '' : 's'} attached`
              : `${n} independent calls forwarded`}
          </text>

          {/* coalescer -> backend edge(s) */}
          {coalesce ? (
            <line
              className="rcv-edge is-leader"
              x1={colX}
              y1={coalY + coalH}
              x2={colX}
              y2={backendY}
              style={{ stroke: leaderHue }}
              markerEnd="url(#rcv-arrow)"
            />
          ) : (
            Array.from({ length: n }, (_, i) => {
              const spread = Math.min(backendW - 30, n * 18);
              const sx = colX - spread / 2 + (n > 1 ? (spread / (n - 1)) * i : 0);
              return (
                <line
                  key={`be-${i}`}
                  className="rcv-edge is-storm"
                  x1={colX}
                  y1={coalY + coalH}
                  x2={sx}
                  y2={backendY}
                  style={{ stroke: 'var(--warning)' }}
                  markerEnd="url(#rcv-arrow)"
                />
              );
            })
          )}

          {/* backend */}
          <rect
            className={`rcv-backend ${coalesce ? '' : 'is-stormed'}`}
            x={backendX}
            y={backendY}
            width={backendW}
            height={backendH}
            rx={11}
            style={{ stroke: coalesce ? leaderHue : 'var(--warning)' }}
          />
          <g transform={`translate(${backendX + 18}, ${backendY + 14})`}>
            <Database width={18} height={18} className="rcv-ic" style={{ color: coalesce ? leaderHue : 'var(--warning)' }} />
          </g>
          <text className="rcv-backend-title" x={colX + 14} y={backendY + 30}>backend / origin</text>
          <text
            className="rcv-backend-load"
            x={colX + 14}
            y={backendY + 52}
            style={{ fill: coalesce ? leaderHue : 'var(--warning)' }}
          >
            {model.backendCalls} call{model.backendCalls === 1 ? '' : 's'} {coalesce ? '' : '— stampede'}
          </text>

          {/* backend -> shared result */}
          <line
            className="rcv-edge is-leader"
            x1={colX}
            y1={backendY + backendH}
            x2={colX}
            y2={resultY - resultR}
            style={{ stroke: leaderHue }}
            markerEnd="url(#rcv-arrow)"
          />

          {/* shared result fanned back to every caller */}
          <text className="rcv-row-label rcv-row-label-center" x={colX} y={resultY - resultR - 10}>
            one result fanned back to all {n}
          </text>
          {coalesce && reqXs.map((x, i) => (
            <line
              key={`fan-${i}`}
              className="rcv-fan"
              x1={colX}
              y1={resultY}
              x2={x}
              y2={resultY + resultR + 8}
            />
          ))}
          <circle className="rcv-result" cx={colX} cy={resultY} r={resultR} />
          <g transform={`translate(${colX - 8}, ${resultY - 8})`}>
            <Users width={16} height={16} className="rcv-ic" style={{ color: 'var(--bg)' }} />
          </g>
        </svg>
      </div>

      <div className="rcv-metrics">
        <div className="rcv-metric">
          <span className="rcv-metric-label">requests in</span>
          <span className="rcv-metric-value">{n}</span>
        </div>
        <div className="rcv-metric">
          <span className="rcv-metric-label">backend calls</span>
          <span className={`rcv-metric-value ${coalesce ? 'is-ok' : 'is-storm'}`}>{model.backendCalls}</span>
        </div>
        <div className="rcv-metric">
          <span className="rcv-metric-label">waiters attached</span>
          <span className="rcv-metric-value is-waiter">{model.waiters}</span>
        </div>
        <div className="rcv-metric">
          <span className="rcv-metric-label">backend load saved</span>
          <span className={`rcv-metric-value ${coalesce ? 'is-ok' : 'is-storm'}`}>{model.savedPct}%</span>
        </div>
      </div>

      <div className="rcv-narration">
        <span className="rcv-narration-label">why it matters</span>
        <span className="rcv-narration-body">
          {coalesce
            ? `All ${n} callers missed the cache for the same key at once, but only the leader touched the backend — the other ${model.waiters} attached to its in-flight promise and got the shared result for free. One origin call instead of ${n}.`
            : `With coalescing off, every one of the ${n} cache misses fires its own backend call — a thundering herd that can topple the origin the instant a hot key expires.`}{' '}
          Single-flight turns a stampede into one request: the spike when a popular key expires becomes a single
          refresh that everyone shares.
        </span>
      </div>
    </div>
  );
}
