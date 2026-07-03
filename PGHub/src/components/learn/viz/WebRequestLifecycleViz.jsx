import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Globe, Play, Pause, SkipForward, RotateCcw, Gauge, Zap } from 'lucide-react';
import './WebRequestLifecycleViz.css';

// Vertical request pipeline, top -> bottom. Every timing is a fixed constant;
// there is no randomness anywhere, so a given run is fully deterministic.
const STAGES = [
  { key: 'url', name: 'URL parse', detail: 'split scheme / host / path', ms: 1, net: false, hue: 'is-url' },
  { key: 'dns', name: 'DNS lookup', detail: 'host -> IP address', ms: 40, net: true, hue: 'is-dns' },
  { key: 'tcp', name: 'TCP handshake', detail: 'SYN / SYN-ACK / ACK', ms: 30, net: true, hue: 'is-tcp' },
  { key: 'tls', name: 'TLS handshake', detail: 'certificate + keys', ms: 50, net: true, hue: 'is-tls' },
  { key: 'req', name: 'HTTP request', detail: 'GET /index.html + headers', ms: 25, net: true, hue: 'is-req' },
  { key: 'resp', name: 'HTTP response', detail: '200 OK + body', ms: 60, net: true, hue: 'is-resp' },
  { key: 'render', name: 'Render', detail: 'parse -> paint', ms: 20, net: false, hue: 'is-render' },
];

// Stages a fresh cache hit skips entirely (no network trip at all).
const SKIP_ON_HIT = new Set(['dns', 'tcp', 'tls', 'req']);
const CACHE_RESP_MS = 2; // response served straight from disk cache

const NORMAL_TOTAL = STAGES.reduce((s, x) => s + x.ms, 0);
const CACHE_TOTAL = STAGES.reduce((s, x) => {
  if (SKIP_ON_HIT.has(x.key)) return s;
  if (x.key === 'resp') return s + CACHE_RESP_MS;
  return s + x.ms;
}, 0);
const SAVED = NORMAL_TOTAL - CACHE_TOTAL;

// A step is a resting state of the request at one stage, with elapsed time.
function buildSteps(cache) {
  const out = [];
  let elapsed = 0;
  STAGES.forEach((st, idx) => {
    if (cache && SKIP_ON_HIT.has(st.key)) return;
    const ms = cache && st.key === 'resp' ? CACHE_RESP_MS : st.ms;
    elapsed += ms;
    out.push({
      idx,
      ms,
      elapsed,
      fromCache: cache && st.key === 'resp',
      action:
        cache && st.key === 'resp'
          ? 'Fresh cache hit — the body is read from disk, no network trip.'
          : cache && st.key === 'url'
            ? 'Address parsed; a fresh cache entry means we can skip the network.'
            : st.key === 'url'
              ? 'Browser splits the URL into scheme, host, and path.'
              : st.key === 'dns'
                ? 'Resolver turns the host name into an IP address.'
                : st.key === 'tcp'
                  ? 'Three-way handshake opens a reliable channel.'
                  : st.key === 'tls'
                    ? 'Keys negotiated and the certificate verified.'
                    : st.key === 'req'
                      ? 'GET request sent with its headers.'
                      : st.key === 'resp'
                        ? 'Server returns 200 OK with headers and body.'
                        : 'HTML parsed and the page is painted.',
    });
  });
  return out;
}

// Geometry — a single centered vertical column.
const W = 380;
const H = 476;
const ROW_X = 92;
const ROW_W = 264;
const ROW_H = 44;
const PITCH = 64;
const ROW_TOP = 14;
const TRUNK_X = 52;

const rowTop = (i) => ROW_TOP + i * PITCH;
const rowMid = (i) => rowTop(i) + ROW_H / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function WebRequestLifecycleViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [cache, setCache] = useState(false);
  const timer = useRef(null);

  const steps = useMemo(() => buildSteps(cache), [cache]);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];
  const curStage = STAGES[cur.idx];

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function toggleCache() {
    setCache((c) => !c);
    setStep(0);
    setPlaying(false);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 340 : 820) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const packetY = rowMid(cur.idx);

  return (
    <div className="wrl">
      <div className="wrl-head">
        <div className="wrl-head-icon"><Globe size={18} /></div>
        <div className="wrl-head-text">
          <h3 className="wrl-title">The request lifecycle, top to bottom</h3>
          <p className="wrl-sub">
            A request falls down the pipeline &mdash; parse, resolve, connect, encrypt, ask, receive,
            paint &mdash; accumulating round-trip time. Turn the cache on and a hit skips straight past
            the network.
          </p>
        </div>
        <button type="button" className="wrl-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="wrl-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="wrl-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="wrl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="wrl-arrow-head" />
            </marker>
            <filter id="wrl-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* vertical trunk with downward arrows between consecutive rows */}
          <line
            x1={TRUNK_X} y1={rowMid(0)} x2={TRUNK_X} y2={rowMid(STAGES.length - 1)}
            className="wrl-trunk"
          />
          {STAGES.slice(0, -1).map((s, i) => (
            <line
              key={`arr-${s.key}`}
              x1={TRUNK_X} y1={rowMid(i) + 6}
              x2={TRUNK_X} y2={rowMid(i + 1) - 6}
              className="wrl-trunk-seg"
              markerEnd="url(#wrl-arrow)"
            />
          ))}

          {/* stage rows */}
          {STAGES.map((s, i) => {
            const skipped = cache && SKIP_ON_HIT.has(s.key);
            const active = !skipped && cur.idx === i;
            const done = !skipped && cur.idx > i;
            return (
              <g
                key={s.key}
                className={`wrl-row ${s.hue}${active ? ' is-active' : ''}${skipped ? ' is-skipped' : ''}${done ? ' is-done' : ''}`}
              >
                <rect x={ROW_X} y={rowTop(i)} width={ROW_W} height={ROW_H} rx={9} className="wrl-row-box" />
                <text x={ROW_X + 14} y={rowTop(i) + 19} className="wrl-row-name">{s.name}</text>
                <text x={ROW_X + 14} y={rowTop(i) + 34} className="wrl-row-detail">{s.detail}</text>
                <text x={ROW_X + ROW_W - 12} y={rowTop(i) + 27} className="wrl-row-ms" textAnchor="end">
                  {skipped ? 'skip' : `${s.key === 'resp' && cur.fromCache && cur.idx === i ? CACHE_RESP_MS : s.ms}ms`}
                </text>
              </g>
            );
          })}

          {/* the request packet riding the trunk */}
          <circle
            cx={TRUNK_X} cy={packetY} r={9}
            className={`wrl-packet${cur.fromCache ? ' is-cache' : ''}`}
            filter="url(#wrl-glow)"
          />
        </svg>
      </div>

      <div className="wrl-controls">
        <button type="button" className="wrl-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="wrl-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className={`wrl-btn wrl-cache${cache ? ' is-on' : ''}`} onClick={toggleCache}>
          <Zap size={14} /> Cache {cache ? 'on' : 'off'}
        </button>
        <label className="wrl-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="wrl-speed-range"
          />
          <span className="wrl-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="wrl-progress">{safeStep} / {total}</span>
      </div>

      <div className="wrl-readout">
        <div className="wrl-stat is-stage">
          <span className="wrl-stat-label">stage</span>
          <span className="wrl-stat-val">{curStage.name}</span>
        </div>
        <div className="wrl-stat is-time">
          <span className="wrl-stat-label">elapsed</span>
          <span className="wrl-stat-val">{cur.elapsed}ms</span>
        </div>
        <div className="wrl-stat is-cache">
          <span className="wrl-stat-label">cache</span>
          <span className="wrl-stat-val">{cache ? `hit — saved ${SAVED}ms` : 'off'}</span>
        </div>
      </div>

      <div className="wrl-note">
        <span className="wrl-note-label">now</span>
        <span className="wrl-note-body">{cur.action}</span>
      </div>
    </div>
  );
}
