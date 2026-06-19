import React, { useMemo, useState } from 'react';
import { Cpu, Layers, Activity, Server } from 'lucide-react';
import './MLViz.css';

const W = 760;
const H = 380;

const MODES = [
  { id: 'none', label: 'no batching', sub: 'one forward per request' },
  { id: 'static', label: 'static batching', sub: 'wait for batch full' },
  { id: 'cont', label: 'continuous', sub: 'PagedAttention style' },
];

const N = 8; // number of incoming requests
const PREFILL = 1; // ticks per request prefill
const DECODE_BASE = 4; // base decode length per request
const BATCH_SIZE_STATIC = 4;
const GPU_PEAK_TPS = 1200; // tokens/sec peak

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a timeline per mode. Each cell is { mode: 'idle'|'prefill'|'decode', util: 0..1 }
function buildTimeline(modeId, requests) {
  const TICKS = 28;
  // tracks: 4 GPU lanes
  const LANES = 4;
  const tracks = Array.from({ length: LANES }, () =>
    Array.from({ length: TICKS }, () => ({ kind: 'idle', reqId: -1 }))
  );

  if (modeId === 'none') {
    // serial: one request at a time on lane 0
    let t = 0;
    for (let r = 0; r < requests.length; r++) {
      const req = requests[r];
      if (t + PREFILL + req.decode > TICKS) break;
      for (let k = 0; k < PREFILL; k++) tracks[0][t + k] = { kind: 'prefill', reqId: r };
      for (let k = 0; k < req.decode; k++) tracks[0][t + PREFILL + k] = { kind: 'decode', reqId: r };
      t += PREFILL + req.decode;
    }
  } else if (modeId === 'static') {
    // batch up to BATCH_SIZE_STATIC, run as a unit. Wait until BATCH_SIZE_STATIC are available
    // For simplicity: arrival is staggered 0..3 ticks; we wait for the slowest arrival in the batch
    let bStart = 0;
    let i = 0;
    while (i < requests.length) {
      const batch = requests.slice(i, i + BATCH_SIZE_STATIC);
      const slowestArrival = Math.max(...batch.map((b) => b.arrival));
      const t0 = Math.max(bStart, slowestArrival);
      // batch runs in parallel — uses all LANES
      const maxDecode = Math.max(...batch.map((b) => b.decode));
      const span = PREFILL + maxDecode;
      if (t0 + span > TICKS) break;
      for (let lane = 0; lane < batch.length && lane < LANES; lane++) {
        const reqIdx = i + lane;
        for (let k = 0; k < PREFILL; k++) tracks[lane][t0 + k] = { kind: 'prefill', reqId: reqIdx };
        // decode for batch[lane].decode, idle for the rest
        for (let k = 0; k < batch[lane].decode; k++) tracks[lane][t0 + PREFILL + k] = { kind: 'decode', reqId: reqIdx };
      }
      bStart = t0 + span;
      i += BATCH_SIZE_STATIC;
    }
  } else if (modeId === 'cont') {
    // continuous batching: stream requests in, slot prefills and decodes whenever a lane is free
    // simple greedy: each tick, if a lane is free and a request has arrived, slot prefill+decode
    const remaining = requests.map((r, idx) => ({
      idx,
      arrival: r.arrival,
      decodeLeft: r.decode,
      prefilled: false,
    }));
    for (let t = 0; t < TICKS; t++) {
      for (let lane = 0; lane < LANES; lane++) {
        if (tracks[lane][t].kind !== 'idle') continue;
        // pick the earliest-arrived not-yet-prefilled
        const pre = remaining.find((r) => !r.prefilled && r.arrival <= t);
        if (pre) {
          tracks[lane][t] = { kind: 'prefill', reqId: pre.idx };
          pre.prefilled = true;
          continue;
        }
        // else pick a request that still has decode left (started or not)
        const dec = remaining.find((r) => r.prefilled && r.decodeLeft > 0);
        if (dec) {
          tracks[lane][t] = { kind: 'decode', reqId: dec.idx };
          dec.decodeLeft -= 1;
        }
      }
    }
  }

  // Compute utilization series (per tick: fraction of lanes busy)
  const util = Array.from({ length: TICKS }, (_, t) => {
    let busy = 0;
    for (let lane = 0; lane < LANES; lane++) if (tracks[lane][t].kind !== 'idle') busy++;
    return busy / LANES;
  });

  // last finish tick per request
  const lastFinish = new Array(requests.length).fill(-1);
  for (let lane = 0; lane < LANES; lane++) {
    for (let t = 0; t < TICKS; t++) {
      const c = tracks[lane][t];
      if (c.reqId >= 0) lastFinish[c.reqId] = Math.max(lastFinish[c.reqId], t);
    }
  }
  const latencies = requests
    .map((r, i) => (lastFinish[i] < 0 ? null : lastFinish[i] - r.arrival + 1))
    .filter((x) => x !== null)
    .sort((a, b) => a - b);
  const p = (arr, q) => (arr.length === 0 ? 0 : arr[Math.min(arr.length - 1, Math.floor(q * arr.length))]);
  const p50 = p(latencies, 0.5);
  const p99 = p(latencies, 0.99);

  // throughput approximation: avg GPU utilisation scaled to GPU_PEAK_TPS
  const avgUtil = util.reduce((a, b) => a + b, 0) / TICKS;
  const throughput = Math.round(avgUtil * GPU_PEAK_TPS);

  return { tracks, util, throughput, p50, p99, TICKS, LANES };
}

export default function InferenceBatchingViz() {
  const [mode, setMode] = useState('cont');
  const [seed, setSeed] = useState(11);

  const rng = useMemo(() => mulberry32(seed), [seed]);
  const requests = useMemo(() => {
    const arr = [];
    for (let i = 0; i < N; i++) {
      arr.push({
        arrival: Math.floor(rng() * 6),
        decode: DECODE_BASE + Math.floor(rng() * 4), // 4..7
      });
    }
    return arr;
  }, [rng]);

  const sim = useMemo(() => buildTimeline(mode, requests), [mode, requests]);
  const allSims = useMemo(
    () => ({
      none: buildTimeline('none', requests),
      static: buildTimeline('static', requests),
      cont: buildTimeline('cont', requests),
    }),
    [requests]
  );

  // SVG geometry
  const padL = 92;
  const padR = 12;
  const timelineTop = 90;
  const laneH = 22;
  const laneGap = 6;
  const cellW = (W - padL - padR) / sim.TICKS;

  const utilTop = timelineTop + sim.LANES * (laneH + laneGap) + 26;
  const utilH = 60;

  const reqColor = (id) => {
    if (id < 0) return 'var(--surface)';
    const palette = ['var(--accent)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--hue-violet, var(--accent))'];
    return palette[id % palette.length];
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ width: '100%', height: 'auto', aspectRatio: `${W} / ${H}` }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Title */}
          <text x={16} y={22} fontSize="11" fill="var(--accent)" fontFamily="var(--mono, monospace)" letterSpacing="0.14em" fontWeight="700">
            INFERENCE BATCHING — {N} REQUESTS, 4 GPU LANES
          </text>
          <text x={16} y={38} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
            timeline · prefill (solid) then decode (lighter) · grey = idle GPU
          </text>

          {/* Tick axis */}
          <line x1={padL} y1={timelineTop - 8} x2={W - padR} y2={timelineTop - 8} stroke="var(--border)" strokeWidth="1" />
          {Array.from({ length: sim.TICKS }, (_, t) => {
            if (t % 4 !== 0) return null;
            return (
              <g key={t}>
                <line
                  x1={padL + t * cellW}
                  y1={timelineTop - 10}
                  x2={padL + t * cellW}
                  y2={timelineTop - 6}
                  stroke="var(--text-dim)"
                  strokeWidth="0.6"
                />
                <text
                  x={padL + t * cellW + 2}
                  y={timelineTop - 14}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                >
                  t{t}
                </text>
              </g>
            );
          })}

          {/* Lanes */}
          {sim.tracks.map((lane, laneIdx) => {
            const ly = timelineTop + laneIdx * (laneH + laneGap);
            return (
              <g key={laneIdx}>
                <text
                  x={padL - 8}
                  y={ly + laneH / 2 + 3}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  GPU{laneIdx}
                </text>
                <rect
                  x={padL}
                  y={ly}
                  width={sim.TICKS * cellW}
                  height={laneH}
                  fill="var(--surface)"
                  stroke="var(--border)"
                  strokeWidth="0.6"
                  rx={3}
                />
                {lane.map((cell, t) => {
                  if (cell.kind === 'idle') return null;
                  const cx = padL + t * cellW;
                  const fill = reqColor(cell.reqId);
                  const op = cell.kind === 'prefill' ? 0.95 : 0.55;
                  return (
                    <rect
                      key={t}
                      x={cx + 0.6}
                      y={ly + 1.2}
                      width={cellW - 1.2}
                      height={laneH - 2.4}
                      rx={2}
                      fill={fill}
                      opacity={op}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Utilization curve */}
          <text
            x={padL - 8}
            y={utilTop + 10}
            fontSize="9"
            fill="var(--accent)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
          >
            GPU util
          </text>
          <rect x={padL} y={utilTop} width={sim.TICKS * cellW} height={utilH} fill="var(--surface)" stroke="var(--border)" rx={4} />
          {/* zero/full guides */}
          <line
            x1={padL}
            y1={utilTop + utilH}
            x2={padL + sim.TICKS * cellW}
            y2={utilTop + utilH}
            stroke="var(--border)"
            strokeWidth="0.6"
          />
          <line
            x1={padL}
            y1={utilTop}
            x2={padL + sim.TICKS * cellW}
            y2={utilTop}
            stroke="var(--border)"
            strokeWidth="0.4"
            strokeDasharray="2 3"
          />
          {(() => {
            // build path from util series
            const pts = sim.util.map((u, t) => {
              const x = padL + (t + 0.5) * cellW;
              const y = utilTop + utilH - u * utilH;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            });
            const d = `M ${pts[0]} L ${pts.slice(1).join(' L ')}`;
            // area fill
            const dArea = `M ${padL},${utilTop + utilH} L ${pts.join(' L ')} L ${(padL + sim.TICKS * cellW).toFixed(1)},${utilTop + utilH} Z`;
            return (
              <g>
                <path d={dArea} fill="rgba(var(--accent-rgb, 0,255,245), 0.16)" />
                <path d={d} stroke="var(--accent)" strokeWidth="1.4" fill="none" />
              </g>
            );
          })()}
          <text x={padL + 4} y={utilTop + 12} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">100%</text>
          <text x={padL + 4} y={utilTop + utilH - 4} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">0%</text>

          {/* Request legend */}
          {(() => {
            const lx = padL;
            const ly = H - 18;
            return (
              <g>
                <text
                  x={lx}
                  y={ly - 2}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  letterSpacing="0.12em"
                >
                  REQUESTS
                </text>
                {requests.map((r, i) => {
                  const x = lx + 70 + i * 70;
                  return (
                    <g key={i}>
                      <rect x={x} y={ly - 10} width={10} height={10} rx={2} fill={reqColor(i)} opacity="0.9" />
                      <text
                        x={x + 14}
                        y={ly - 2}
                        fontSize="9"
                        fill="var(--text-main)"
                        fontFamily="var(--mono, monospace)"
                      >
                        r{i}·t={r.arrival}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
          <div className="mlviz-toggles">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mlviz-toggle ${mode === m.id ? 'is-on' : ''}`}
                onClick={() => setMode(m.id)}
              >
                <span className="mlviz-toggle-dot" />
                {m.id === 'none' ? <Cpu size={12} /> : m.id === 'static' ? <Layers size={12} /> : <Server size={12} />}
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Activity size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              workload seed
            </span>
            <input
              type="range"
              min="1"
              max="64"
              step="1"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{seed}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>throughput</span>
          <span className="mlviz-val" style={{ color: 'var(--accent)' }}>
            {sim.throughput} tok/s
          </span>
          <span className="mlviz-tag" style={{ color: 'var(--hue-sky)' }}>p50 latency</span>
          <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
            {sim.p50}t
          </span>
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink)' }}>p99 latency</span>
          <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
            {sim.p99}t
          </span>
          <span className="mlviz-sub">
            {mode === 'none'
              ? 'serial decode leaves the GPU idle for everyone but the front of the queue'
              : mode === 'static'
              ? 'batch pads to the slowest sequence, head-of-line blocking on long decodes'
              : 'prefill + decode interleave; new arrivals slot into freed cache pages immediately'}
          </span>
        </div>

        <div className="mlviz-row" style={{ gap: '0.8rem', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
          <span className="mlviz-sub">
            comparison · throughput · no batch: <strong style={{ color: 'var(--hue-pink)' }}>{allSims.none.throughput}</strong> ·
            static: <strong style={{ color: 'var(--hue-sky)' }}>{allSims.static.throughput}</strong> ·
            continuous: <strong style={{ color: 'var(--accent)' }}>{allSims.cont.throughput}</strong> tok/s
          </span>
        </div>
        <div className="mlviz-row" style={{ gap: '0.8rem', flexWrap: 'wrap' }}>
          <span className="mlviz-sub">
            p50 latency · no batch: <strong style={{ color: 'var(--hue-pink)' }}>{allSims.none.p50}t</strong> ·
            static: <strong style={{ color: 'var(--hue-sky)' }}>{allSims.static.p50}t</strong> ·
            continuous: <strong style={{ color: 'var(--accent)' }}>{allSims.cont.p50}t</strong>
            {' · '}continuous cuts p50 by{' '}
            <strong style={{ color: 'var(--accent)' }}>
              {allSims.cont.p50 > 0
                ? (allSims.static.p50 / Math.max(1, allSims.cont.p50)).toFixed(1)
                : '∞'}
              ×
            </strong>{' '}
            vs static
          </span>
        </div>

        <div className="mlviz-hint">
          toggle a strategy · drag seed to reshape the arrival/decode-length mix · watch the utilization curve fill in as you go from serial to PagedAttention
        </div>
      </div>
    </div>
  );
}
