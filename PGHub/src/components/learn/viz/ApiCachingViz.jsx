import React, { useMemo, useState, useEffect, useRef } from 'react';
import { DatabaseZap, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './ApiCachingViz.css';

// A fixed, deterministic script of requests. Each step both exercises the
// cache path (miss / hit / 304) and spends a token from the bucket; when the
// bucket is empty the request is rejected with 429 before it reaches origin.
// No randomness anywhere -- a given run is fully reproducible.
const CAPACITY = 5;      // bucket depth (burst)
const REFILL_EVERY = 3;  // one token drips back every N steps

// cacheState transitions: 'empty' -> after a miss the body is cached ('warm').
// A 304 is a revalidation of a warm entry; a hit reuses a warm entry.
const SCRIPT = [
  { kind: 'miss', label: 'GET /profile/42', note: 'Cold cache: MISS travels to origin, origin returns 200 + ETag, body cached at edge.' },
  { kind: 'hit', label: 'GET /profile/42', note: 'Fresh within max-age: HIT served from edge, zero origin trip.' },
  { kind: 'hit', label: 'GET /profile/42', note: 'Still fresh: another HIT, no network past the edge.' },
  { kind: 'revalidate', label: 'If-None-Match "v7"', note: 'Stale: conditional request revalidates, origin replies 304 Not Modified, no body.' },
  { kind: 'hit', label: 'GET /profile/42', note: 'Revalidated copy reused: HIT again.' },
  { kind: 'miss', label: 'GET /orders/9', note: 'Different key: cold MISS to origin, cached fresh.' },
  { kind: 'hit', label: 'GET /orders/9', note: 'Fresh HIT from the edge.' },
  { kind: 'miss', label: 'GET /cart/7', note: 'Burst continues: MISS to origin.' },
  { kind: 'limited', label: 'GET /cart/7', note: 'Bucket empty: rejected with 429 Too Many Requests before reaching origin.' },
  { kind: 'limited', label: 'GET /cart/7', note: 'Still throttled: 429, Retry-After counts down to the next token.' },
];

// Simulate token bucket deterministically across the script. Refill drips one
// token every REFILL_EVERY steps (fixed schedule, not wall-clock, not random).
function buildSteps() {
  const out = [];
  let tokens = CAPACITY;
  let cacheWarm = new Set();
  for (let i = 0; i < SCRIPT.length; i += 1) {
    const s = SCRIPT[i];
    // Refill on a fixed cadence before spending.
    if (i > 0 && i % REFILL_EVERY === 0 && tokens < CAPACITY) tokens += 1;

    let verdict = 'allowed';
    let cacheResult = s.kind; // miss | hit | revalidate

    if (tokens >= 1) {
      tokens -= 1;
      if (s.kind === 'miss') cacheWarm = new Set([...cacheWarm, s.label]);
    } else {
      verdict = 'limited';
      cacheResult = 'blocked';
    }
    if (s.kind === 'limited') { cacheResult = 'blocked'; verdict = 'limited'; }

    out.push({
      idx: i,
      label: s.label,
      note: s.note,
      cacheResult, // miss | hit | revalidate | blocked
      verdict,     // allowed | limited
      tokens: Math.max(0, tokens),
      retryAfter: verdict === 'limited' ? REFILL_EVERY - (i % REFILL_EVERY) : 0,
    });
  }
  return out;
}

const STEPS = buildSteps();
const TOTAL = STEPS.length - 1;

// --- lane diagram geometry (top SVG) ---------------------------------------
const LW = 380;
const LH = 150;
const LANE_Y = { client: 26, cache: 75, origin: 124 };
const LANE_X0 = 96;
const LANE_X1 = 356;

// --- token bucket geometry (bottom SVG) ------------------------------------
const BW = 380;
const BH = 132;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const RESULT_META = {
  miss: { text: 'MISS', cls: 'is-miss' },
  hit: { text: 'HIT', cls: 'is-hit' },
  revalidate: { text: '304', cls: 'is-revalidate' },
  blocked: { text: '429', cls: 'is-blocked' },
};

export default function ApiCachingViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const cur = STEPS[Math.min(step, TOTAL)];
  const safeStep = Math.min(step, TOTAL);
  const result = RESULT_META[cur.cacheResult];

  // Which lane does the packet reach? blocked/hit stop at cache; miss/304 hit origin.
  const reachesOrigin = cur.cacheResult === 'miss' || cur.cacheResult === 'revalidate';
  const blocked = cur.verdict === 'limited';

  function togglePlay() {
    if (safeStep >= TOTAL) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function reset() { setStep(0); setPlaying(false); }

  useEffect(() => {
    if (!playing || safeStep >= TOTAL) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(TOTAL, s + 1)),
      Math.round((reduced() ? 380 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, speed]);

  // Token dots: filled up to cur.tokens, hollow beyond.
  const dots = useMemo(() => Array.from({ length: CAPACITY }, (_, i) => i < cur.tokens), [cur.tokens]);

  return (
    <div className="acg">
      <div className="acg-head">
        <div className="acg-head-icon"><DatabaseZap size={18} /></div>
        <div className="acg-head-text">
          <h3 className="acg-title">Caching &amp; the token bucket</h3>
          <p className="acg-sub">
            Step a stream of requests: the top lanes show cache MISS, HIT, and a 304 revalidation;
            the bucket below drains one token per request and refills on a schedule &mdash; empty means 429.
          </p>
        </div>
        <button type="button" className="acg-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="acg-stage">
        {/* ---- lane diagram: client / cache-edge / origin ---- */}
        <svg viewBox={`0 0 ${LW} ${LH}`} className="acg-svg acg-lanes" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="acg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="acg-arrow-head" />
            </marker>
            <filter id="acg-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* lane rails */}
          {['client', 'cache', 'origin'].map((k) => (
            <g key={k} className="acg-lane">
              <line x1={LANE_X0} y1={LANE_Y[k]} x2={LANE_X1} y2={LANE_Y[k]} className="acg-lane-rail" />
              <text x={LANE_X0 - 10} y={LANE_Y[k] + 4} textAnchor="end" className="acg-lane-label">
                {k === 'cache' ? 'cache edge' : k}
              </text>
            </g>
          ))}

          {/* client -> cache segment (always travelled) */}
          <line
            x1={LANE_X0 + 40} y1={LANE_Y.client} x2={LANE_X0 + 40} y2={LANE_Y.cache - 6}
            className={`acg-hop ${blocked ? 'is-blocked' : 'is-active'}`} markerEnd="url(#acg-arrow)"
          />
          {/* cache -> origin segment (only miss / 304) */}
          <line
            x1={LANE_X0 + 160} y1={LANE_Y.cache} x2={LANE_X0 + 160} y2={LANE_Y.origin - 6}
            className={`acg-hop ${reachesOrigin ? `is-active ${result.cls}` : 'is-idle'}`}
            markerEnd="url(#acg-arrow)"
          />
          {/* origin -> cache return (miss brings body; 304 brings nothing) */}
          <line
            x1={LANE_X0 + 200} y1={LANE_Y.origin} x2={LANE_X0 + 200} y2={LANE_Y.cache + 6}
            className={`acg-hop ${reachesOrigin ? `is-active ${result.cls}` : 'is-idle'}`}
            markerEnd="url(#acg-arrow)"
          />

          {/* result badge riding the cache lane */}
          <g className={`acg-badge ${result.cls}`} filter="url(#acg-glow)">
            <rect x={LANE_X0 + 74} y={LANE_Y.cache - 13} width={62} height={26} rx={7} className="acg-badge-box" />
            <text x={LANE_X0 + 105} y={LANE_Y.cache + 5} textAnchor="middle" className="acg-badge-text">
              {result.text}
            </text>
          </g>

          {/* request packet at client */}
          <circle cx={LANE_X0 + 40} cy={LANE_Y.client} r={7} className="acg-packet" filter="url(#acg-glow)" />
        </svg>

        {/* ---- token bucket ---- */}
        <svg viewBox={`0 0 ${BW} ${BH}`} className="acg-svg acg-bucket" preserveAspectRatio="xMidYMid meet">
          <text x={20} y={20} className="acg-bucket-title">token bucket</text>
          <text x={BW - 20} y={20} textAnchor="end" className="acg-bucket-meta">
            capacity {CAPACITY} &middot; +1 / {REFILL_EVERY} steps
          </text>

          {/* bucket body */}
          <path
            d={`M 40 40 L 40 108 Q 40 118 50 118 L 190 118 Q 200 118 200 108 L 200 40`}
            className="acg-bucket-wall"
          />
          {/* token dots inside the bucket */}
          {dots.map((filled, i) => (
            <circle
              key={`tok-${i}`}
              cx={64 + i * 30}
              cy={90}
              r={11}
              className={`acg-token ${filled ? 'is-full' : 'is-empty'}`}
            />
          ))}

          {/* verdict panel */}
          <g className={`acg-verdict ${blocked ? 'is-limited' : 'is-allowed'}`}>
            <rect x={232} y={44} width={126} height={64} rx={10} className="acg-verdict-box" />
            <text x={295} y={68} textAnchor="middle" className="acg-verdict-label">
              {blocked ? '429' : '200'}
            </text>
            <text x={295} y={90} textAnchor="middle" className="acg-verdict-sub">
              {blocked ? `Retry-After ${cur.retryAfter}s` : 'allowed'}
            </text>
          </g>
        </svg>
      </div>

      <div className="acg-controls">
        <button type="button" className="acg-btn" onClick={togglePlay}>
          {playing && safeStep < TOTAL ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < TOTAL ? 'Pause' : (safeStep >= TOTAL ? 'Replay' : 'Play')}
        </button>
        <button
          type="button" className="acg-btn"
          onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}
          disabled={safeStep >= TOTAL}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="acg-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="acg-speed-range"
          />
          <span className="acg-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="acg-progress">{safeStep} / {TOTAL}</span>
      </div>

      <div className="acg-readout">
        <div className={`acg-stat ${result.cls}`}>
          <span className="acg-stat-label">cache</span>
          <span className="acg-stat-val">{result.text}</span>
        </div>
        <div className="acg-stat is-tokens">
          <span className="acg-stat-label">tokens</span>
          <span className="acg-stat-val">{cur.tokens} / {CAPACITY}</span>
        </div>
        <div className={`acg-stat ${blocked ? 'is-blocked' : 'is-hit'}`}>
          <span className="acg-stat-label">verdict</span>
          <span className="acg-stat-val">{blocked ? '429 limited' : 'allowed'}</span>
        </div>
      </div>

      <div className="acg-note">
        <span className="acg-note-label">{cur.label}</span>
        <span className="acg-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
