import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Activity, Gauge, Layers, Copy, RotateCcw } from 'lucide-react';
import './SystemDesignTailLatencyViz.css';

// Tail latency in fan-out systems — two linked ideas.
//
// (a) A single backend's response time is not a point, it's a distribution with
//     a long right tail. The median (p50) is cheap; p99 / p99.9 sit far to the
//     right. Averaging hides this — the mean is dragged up but still understates
//     how bad the worst 1% feels to a user.
// (b) Fan-out amplification: a request that fans out to n backends and waits for
//     ALL of them is only as fast as the SLOWEST. If each backend is "slow"
//     (above its p99) with probability p, then
//        P(at least one slow) = 1 - (1 - p)^n
//     so even p = 0.01 gives ~63% slow requests at n = 100. Hedged requests
//     (send a duplicate to a second replica after a short delay, take the first
//     reply) collapse that to roughly p^2 per backend. Dean & Barroso, "The
//     Tail at Scale", CACM 2013.

// Deterministic latency distribution (ms buckets -> relative frequency).
// A right-skewed shape: dense near the median, a long thin tail. No randomness.
const DIST = [
  { ms: 5, w: 2 }, { ms: 10, w: 9 }, { ms: 15, w: 22 }, { ms: 20, w: 31 },
  { ms: 25, w: 28 }, { ms: 30, w: 21 }, { ms: 35, w: 15 }, { ms: 40, w: 11 },
  { ms: 50, w: 8 }, { ms: 60, w: 6 }, { ms: 75, w: 4 }, { ms: 95, w: 3 },
  { ms: 120, w: 2 }, { ms: 160, w: 1.4 }, { ms: 210, w: 1 }, { ms: 280, w: 0.7 },
  { ms: 360, w: 0.4 }, { ms: 460, w: 0.2 },
];

// Percentile -> { rank in [0,1], color token, label }.
const PCTS = [
  { key: 'p50', q: 0.5, hue: 'var(--hue-mint)', label: 'p50 (median)' },
  { key: 'p95', q: 0.95, hue: 'var(--hue-sky)', label: 'p95' },
  { key: 'p99', q: 0.99, hue: 'var(--hue-violet)', label: 'p99' },
  { key: 'p999', q: 0.999, hue: 'var(--hue-pink)', label: 'p99.9' },
];

const N_PRESETS = [1, 5, 20, 50, 100, 200];

const km = (expr, display = false) =>
  katex.renderToString(expr, { throwOnError: false, displayMode: display, output: 'html' });

// Interpolate the latency at a given cumulative-probability quantile.
function quantile(buckets, total, q) {
  const target = q * total;
  let acc = 0;
  for (let i = 0; i < buckets.length; i += 1) {
    const next = acc + buckets[i].w;
    if (next >= target) {
      const prevMs = i === 0 ? 0 : buckets[i - 1].ms;
      const span = buckets[i].w || 1;
      const frac = (target - acc) / span;
      return Math.round(prevMs + (buckets[i].ms - prevMs) * frac);
    }
    acc = next;
  }
  return buckets[buckets.length - 1].ms;
}

const fmtPct = (x) => `${(x * 100).toFixed(x < 0.1 ? 2 : 1)}%`;

export default function SystemDesignTailLatencyViz() {
  const [active, setActive] = useState('p99');
  const [n, setN] = useState(100);
  const [hedge, setHedge] = useState(false);

  const total = useMemo(() => DIST.reduce((s, b) => s + b.w, 0), []);

  const stats = useMemo(() => {
    const maxMs = DIST[DIST.length - 1].ms;
    const marks = PCTS.map((p) => ({
      ...p,
      ms: quantile(DIST, total, p.q),
    }));
    const byKey = Object.fromEntries(marks.map((m) => [m.key, m]));
    return { maxMs, marks, byKey };
  }, [total]);

  // Per-backend "slow" probability is the chance of landing past p99 = 1%.
  // Hedging a backend takes the faster of two independent replicas -> p^2.
  const p = 0.01;
  const pEff = hedge ? p * p : p;
  const pAny = 1 - Math.pow(1 - p, n);
  const pAnyHedged = 1 - Math.pow(1 - pEff, n);
  const shown = hedge ? pAnyHedged : pAny;

  const reset = () => {
    setActive('p99');
    setN(100);
    setHedge(false);
  };

  // ---- histogram geometry (a genuine 2D plot — horizontal axis is fine) ----
  const W = 940;
  const H = 300;
  const padL = 46;
  const padR = 18;
  const padT = 18;
  const padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxW = Math.max(...DIST.map((b) => b.w));
  const barGap = 3;
  const barW = (plotW - barGap * (DIST.length - 1)) / DIST.length;
  const xForMs = (ms) => padL + (ms / stats.maxMs) * plotW;
  const yForW = (w) => padT + plotH - (w / maxW) * plotH;

  // ---- fan-out amplification curve (P vs n) ----
  const FW = 940;
  const FH = 230;
  const fpadL = 46;
  const fpadR = 60;
  const fpadT = 16;
  const fpadB = 34;
  const fplotW = FW - fpadL - fpadR;
  const fplotH = FH - fpadT - fpadB;
  const N_MAX = 200;
  const fx = (nn) => fpadL + (nn / N_MAX) * fplotW;
  const fy = (prob) => fpadT + fplotH - prob * fplotH;
  const curve = (pp) => {
    const pts = [];
    for (let nn = 1; nn <= N_MAX; nn += 2) {
      pts.push(`${fx(nn).toFixed(1)},${fy(1 - Math.pow(1 - pp, nn)).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  return (
    <div className="tlv">
      <div className="tlv-head">
        <h3 className="tlv-title">Tail latency at scale — why p99 beats the mean</h3>
        <p className="tlv-sub">
          One backend&apos;s response time is a skewed distribution with a long right tail; fan out to many of
          them and a request waits for the slowest, so rare tail events become the common case.
        </p>
      </div>

      <div className="tlv-controls">
        <div className="tlv-group">
          <span className="tlv-input-label">highlight</span>
          {PCTS.map((pc) => (
            <button
              key={pc.key}
              type="button"
              className={`tlv-chip ${active === pc.key ? 'is-active' : ''}`}
              style={active === pc.key ? { borderColor: pc.hue, color: pc.hue } : undefined}
              onClick={() => setActive(pc.key)}
            >
              {pc.key === 'p999' ? 'p99.9' : pc.key}
            </button>
          ))}
        </div>

        <span className="tlv-spacer" aria-hidden="true" />

        <div className="tlv-group">
          <span className="tlv-input-label">fan-out n</span>
          <input
            type="range"
            min={1}
            max={N_MAX}
            step={1}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="tlv-slider"
            aria-label="fan-out backend count"
          />
          <span className="tlv-n-readout">{n}</span>
          <span className="tlv-n-presets">
            {N_PRESETS.map((np) => (
              <button
                key={np}
                type="button"
                className={`tlv-mini ${n === np ? 'is-active' : ''}`}
                onClick={() => setN(np)}
              >
                {np}
              </button>
            ))}
          </span>
        </div>

        <button
          type="button"
          className={`tlv-btn ${hedge ? 'tlv-btn-primary' : ''}`}
          onClick={() => setHedge((v) => !v)}
        >
          <Copy size={14} /> {hedge ? 'Hedging on' : 'Hedge requests'}
        </button>
        <button type="button" className="tlv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* (a) latency distribution histogram */}
      <div className="tlv-stage">
        <div className="tlv-stage-head">
          <Activity size={15} className="tlv-ic" />
          <span className="tlv-stage-title">Single-backend latency distribution</span>
          <span className="tlv-stage-sub">the tail stretches far past the median</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="tlv-svg" preserveAspectRatio="xMidYMid meet">
          {/* baseline */}
          <line className="tlv-axis-line" x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} />
          {/* x ticks */}
          {[0, 100, 200, 300, 400].map((ms) => (
            <g key={ms}>
              <line
                className="tlv-grid"
                x1={xForMs(ms)}
                y1={padT}
                x2={xForMs(ms)}
                y2={padT + plotH}
              />
              <text className="tlv-tick" x={xForMs(ms)} y={padT + plotH + 18}>{ms}ms</text>
            </g>
          ))}
          <text className="tlv-axis-label" x={padL} y={padT + plotH + 32}>latency →</text>

          {/* bars: tint the tail (past p99) so the eye finds it */}
          {DIST.map((b, i) => {
            const x = padL + i * (barW + barGap);
            const y = yForW(b.w);
            const h = padT + plotH - y;
            const inTail = b.ms >= stats.byKey.p99.ms;
            return (
              <rect
                key={b.ms}
                className={`tlv-bar ${inTail ? 'is-tail' : ''}`}
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 1)}
                rx={2}
              />
            );
          })}

          {/* percentile markers */}
          {stats.marks.map((m) => {
            const x = xForMs(m.ms);
            const isOn = active === m.key;
            return (
              <g key={m.key} className={`tlv-mark ${isOn ? 'is-on' : ''}`}>
                <line
                  x1={x}
                  y1={padT - 2}
                  x2={x}
                  y2={padT + plotH}
                  stroke={m.hue}
                  strokeWidth={isOn ? 2.6 : 1.3}
                  strokeDasharray={isOn ? 'none' : '4 4'}
                  opacity={isOn ? 1 : 0.55}
                />
                <rect
                  x={x - 30}
                  y={isOn ? padT - 2 : padT + 8}
                  width={60}
                  height={17}
                  rx={4}
                  fill="var(--surface)"
                  stroke={m.hue}
                  strokeWidth={isOn ? 1.6 : 1}
                  opacity={isOn ? 1 : 0.8}
                />
                <text
                  x={x}
                  y={(isOn ? padT - 2 : padT + 8) + 12}
                  className="tlv-mark-label"
                  style={{ fill: m.hue }}
                >
                  {(m.key === 'p999' ? 'p99.9' : m.key)} {m.ms}ms
                </text>
              </g>
            );
          })}
        </svg>
        <div className="tlv-tail-note">
          <span style={{ color: stats.byKey.p50.hue }}>p50 = {stats.byKey.p50.ms}ms</span>
          {' '}vs{' '}
          <span style={{ color: stats.byKey.p99.hue }}>p99 = {stats.byKey.p99.ms}ms</span>
          {' '}— the worst 1% is {(stats.byKey.p99.ms / stats.byKey.p50.ms).toFixed(1)}× slower than typical.
        </div>
      </div>

      {/* (b) fan-out amplification */}
      <div className="tlv-stage">
        <div className="tlv-stage-head">
          <Layers size={15} className="tlv-ic" />
          <span className="tlv-stage-title">Fan-out amplification</span>
          <span className="tlv-stage-sub">wait for the slowest of n parallel backends</span>
        </div>

        <div className="tlv-math" dangerouslySetInnerHTML={{
          __html: km('P(\\text{slow request}) = 1 - (1 - p)^{n}', true),
        }} />

        <svg viewBox={`0 0 ${FW} ${FH}`} className="tlv-svg" preserveAspectRatio="xMidYMid meet">
          <line className="tlv-axis-line" x1={fpadL} y1={fpadT + fplotH} x2={FW - fpadR} y2={fpadT + fplotH} />
          {/* y gridlines at 0/.25/.5/.75/1 */}
          {[0, 0.25, 0.5, 0.75, 1].map((q) => (
            <g key={q}>
              <line className="tlv-grid" x1={fpadL} y1={fy(q)} x2={FW - fpadR} y2={fy(q)} />
              <text className="tlv-tick" x={fpadL - 6} y={fy(q) + 4} textAnchor="end">{fmtPct(q)}</text>
            </g>
          ))}
          {[1, 50, 100, 150, 200].map((nn) => (
            <text key={nn} className="tlv-tick" x={fx(nn)} y={fpadT + fplotH + 18}>{nn}</text>
          ))}
          <text className="tlv-axis-label" x={fpadL} y={fpadT + fplotH + 30}>backends n →</text>

          {/* baseline (no hedge) curve always shown, faint when hedging */}
          <polyline
            className="tlv-curve"
            points={curve(p)}
            fill="none"
            opacity={hedge ? 0.35 : 1}
          />
          {/* hedged curve */}
          {hedge && (
            <polyline
              className="tlv-curve is-hedge"
              points={curve(pEff)}
              fill="none"
            />
          )}

          {/* current-n marker */}
          <line
            className="tlv-now"
            x1={fx(n)}
            y1={fpadT}
            x2={fx(n)}
            y2={fpadT + fplotH}
          />
          <circle className="tlv-dot" cx={fx(n)} cy={fy(shown)} r={5} />
          <rect
            x={fx(n) + 8}
            y={fy(shown) - 13}
            width={62}
            height={20}
            rx={5}
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth={1.4}
          />
          <text className="tlv-dot-label" x={fx(n) + 12} y={fy(shown) + 2}>
            {fmtPct(shown)}
          </text>
        </svg>
      </div>

      {/* live readouts */}
      <div className="tlv-metrics">
        <div className="tlv-metric">
          <span className="tlv-metric-label">p50 / p99</span>
          <span className="tlv-metric-value">{stats.byKey.p50.ms} / {stats.byKey.p99.ms} ms</span>
        </div>
        <div className="tlv-metric">
          <span className="tlv-metric-label">fan-out n</span>
          <span className="tlv-metric-value">{n} backends</span>
        </div>
        <div className="tlv-metric">
          <span className="tlv-metric-label">per-backend slow p</span>
          <span className="tlv-metric-value">{fmtPct(pEff)}{hedge ? ' (p²)' : ''}</span>
        </div>
        <div className="tlv-metric">
          <span className="tlv-metric-label">P(slow request)</span>
          <span className="tlv-metric-value is-hot">{fmtPct(shown)}</span>
        </div>
        <div className="tlv-metric">
          <span className="tlv-metric-label">hedging effect</span>
          <span className="tlv-metric-value is-cool">
            {hedge ? `${fmtPct(pAny)} → ${fmtPct(pAnyHedged)}` : 'off'}
          </span>
        </div>
      </div>

      <div className="tlv-narration">
        <span className="tlv-narration-label">why it matters</span>
        <span className="tlv-narration-body">
          A service whose p99 is {stats.byKey.p99.ms}ms looks healthy on its {stats.byKey.p50.ms}ms median — but
          fan a request out to {n} of them and{' '}
          <Gauge size={13} className="tlv-inline-ic" /> {fmtPct(pAny)} of requests touch at least one slow
          backend. That is the tail-at-scale trap: the worst 1% of one machine becomes the common experience of
          the whole system, so latency SLOs are written on p99 / p99.9, never the mean. Hedged requests — fire a
          duplicate to a second replica after a short delay and take whichever answers first — square the slow
          probability per backend, dropping the fleet-wide figure to {fmtPct(pAnyHedged)} for a few percent of
          extra load.
        </span>
      </div>
    </div>
  );
}
