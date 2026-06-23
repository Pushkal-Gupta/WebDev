import React, { useMemo, useState } from 'react';
import { Timer, Layers, Copy } from 'lucide-react';
import './TailLatencyViz.css';

function mulberry32(a) {
  return function rng() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Each backend call: 95% fast (~10ms), 5% slow tail (~200ms).
function sampleLatency(rng) {
  if (rng() < 0.05) return 120 + rng() * 180; // slow tail 120-300ms
  return 6 + rng() * 12; // fast 6-18ms
}

// Page latency = max over fanout backends (parallel). With hedging, a second
// copy is dispatched at threshold; the effective latency is min(original, threshold + copy).
function simulate(fanout, hedge, hedgeThreshold, seed) {
  const rng = mulberry32(seed);
  const trials = 2000;
  const samples = [];
  for (let t = 0; t < trials; t += 1) {
    let pageMax = 0;
    for (let b = 0; b < fanout; b += 1) {
      let lat = sampleLatency(rng);
      if (hedge && lat > hedgeThreshold) {
        const copy = hedgeThreshold + sampleLatency(rng);
        lat = Math.min(lat, copy);
      }
      if (lat > pageMax) pageMax = lat;
    }
    samples.push(pageMax);
  }
  samples.sort((a, b) => a - b);
  const pct = (p) => samples[Math.min(samples.length - 1, Math.floor((p / 100) * samples.length))];
  return { p50: pct(50), p99: pct(99), p999: pct(99.9), samples };
}

export default function TailLatencyViz() {
  const [fanout, setFanout] = useState(50);
  const [hedge, setHedge] = useState(true);
  const [threshold, setThreshold] = useState(40);
  const seed = 1337;

  const withHedge = useMemo(() => simulate(fanout, hedge, threshold, seed), [fanout, hedge, threshold]);
  const without = useMemo(() => simulate(fanout, false, 0, seed), [fanout]);

  const W = 920;
  const H = 280;
  const padL = 50;
  const padR = 16;
  const padT = 20;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xMax = 320;

  // histogram of withHedge.samples
  const bins = 40;
  const hist = useMemo(() => {
    const arr = new Array(bins).fill(0);
    for (const v of withHedge.samples) {
      const idx = Math.min(bins - 1, Math.floor((v / xMax) * bins));
      arr[idx] += 1;
    }
    return arr;
  }, [withHedge]);
  const maxBin = Math.max(...hist, 1);

  const xOf = (ms) => padL + Math.min(1, ms / xMax) * plotW;

  return (
    <div className="tlv">
      <div className="tlv-head">
        <h3 className="tlv-title"><Timer size={18} className="tlv-ticon" /> Tail at scale — why p99 dominates a fan-out</h3>
        <p className="tlv-sub">
          Each backend returns fast 95% of the time, slow (the tail) 5%. A page that fans out to N backends waits for the slowest. Raise the fan-out and watch p99 climb; turn on hedging to mask the tail.
        </p>
      </div>

      <div className="tlv-controls">
        <label className="tlv-slider">
          <span className="tlv-slider-label"><Layers size={13} /> fan-out</span>
          <input type="range" min={1} max={100} step={1} value={fanout} onChange={(e) => setFanout(Number(e.target.value))} className="tlv-range" />
          <span className="tlv-slider-value">{fanout} backends</span>
        </label>
        <div className="tlv-toggle">
          <button type="button" className={`tlv-tg ${hedge ? 'tlv-tg-on' : ''}`} onClick={() => setHedge(true)}><Copy size={14} /> hedge on</button>
          <button type="button" className={`tlv-tg ${!hedge ? 'tlv-tg-on' : ''}`} onClick={() => setHedge(false)}>hedge off</button>
        </div>
        <label className="tlv-slider tlv-slider-thresh" data-disabled={!hedge}>
          <span className="tlv-slider-label">hedge @</span>
          <input type="range" min={20} max={120} step={5} value={threshold} disabled={!hedge} onChange={(e) => setThreshold(Number(e.target.value))} className="tlv-range" />
          <span className="tlv-slider-value">{threshold}ms</span>
        </label>
      </div>

      <div className="tlv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tlv-svg" preserveAspectRatio="xMidYMid meet">
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--border)" strokeWidth={1.2} />
          <text x={padL + plotW / 2} y={H - 6} className="tlv-axis" style={{ textAnchor: 'middle' }}>page latency (ms) — distribution over 2000 page loads</text>

          {hist.map((c, i) => {
            const bw = plotW / bins;
            const x = padL + i * bw;
            const h = (c / maxBin) * plotH;
            const mid = (i + 0.5) / bins * xMax;
            const inTail = mid > 60;
            return (
              <rect key={`b-${i}`} x={x + 1} y={padT + plotH - h} width={bw - 2} height={h}
                fill={inTail ? 'var(--hue-pink)' : 'var(--accent)'} opacity={inTail ? 0.85 : 0.7} rx={1.5} />
            );
          })}

          {/* p50 / p99 / p99.9 markers for current (hedge) config */}
          {[['p50', withHedge.p50, 'var(--easy)'], ['p99', withHedge.p99, 'var(--warning)'], ['p99.9', withHedge.p999, 'var(--hard)']].map(([lbl, v, c]) => {
            const x = xOf(v);
            return (
              <g key={lbl}>
                <line x1={x} y1={padT} x2={x} y2={padT + plotH} stroke={c} strokeWidth={1.6} strokeDasharray="4 3" />
                <text x={x + 4} y={padT + 14} className="tlv-pmark" style={{ fill: c }}>{lbl} {Math.round(v)}ms</text>
              </g>
            );
          })}

          {/* without-hedge p99 ghost */}
          {hedge && (
            <g>
              <line x1={xOf(without.p99)} y1={padT + 30} x2={xOf(without.p99)} y2={padT + plotH} stroke="var(--text-dim)" strokeWidth={1.2} strokeDasharray="2 4" opacity={0.6} />
              <text x={xOf(without.p99) - 4} y={padT + 28} className="tlv-pmark" style={{ fill: 'var(--text-dim)', textAnchor: 'end' }}>no-hedge p99 {Math.round(without.p99)}ms</text>
            </g>
          )}
        </svg>
      </div>

      <div className="tlv-metrics">
        <div className="tlv-metric"><span className="tlv-metric-label">p50</span><span className="tlv-metric-value" style={{ color: 'var(--easy)' }}>{Math.round(withHedge.p50)}ms</span></div>
        <div className="tlv-metric"><span className="tlv-metric-label">p99</span><span className="tlv-metric-value" style={{ color: 'var(--warning)' }}>{Math.round(withHedge.p99)}ms</span></div>
        <div className="tlv-metric"><span className="tlv-metric-label">p99.9</span><span className="tlv-metric-value" style={{ color: 'var(--hard)' }}>{Math.round(withHedge.p999)}ms</span></div>
        <div className="tlv-metric tlv-metric-dim"><span className="tlv-metric-label">p99 saved by hedge</span>
          <span className="tlv-metric-value tlv-metric-dimval">{hedge ? `${Math.max(0, Math.round(without.p99 - withHedge.p99))}ms` : '—'}</span>
        </div>
      </div>

      <div className="tlv-trace">
        <span className="tlv-trace-label">insight</span>
        <span className="tlv-trace-val">
          {`At fan-out ${fanout}, the chance all backends dodge the 5% tail is 0.95^${fanout} = ${(0.95 ** fanout * 100).toFixed(1)}% — so the page p99 is pinned to the tail. `}
          {hedge
            ? `Hedging a second copy after ${threshold}ms caps each backend near ${threshold}ms + a fast retry, dragging page p99 down to ${Math.round(withHedge.p99)}ms.`
            : 'Turn on hedging: a duplicate request after the threshold lets the fast copy win, masking the slow tail.'}
        </span>
      </div>
    </div>
  );
}
