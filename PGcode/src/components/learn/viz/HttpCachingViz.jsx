import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './HttpCachingViz.css';

// Walk a single cached resource down a timeline of requests under different
// Cache-Control directives. Track the cache state (FRESH / STALE / revalidating)
// and the resource age against max-age, plus hit / miss / revalidation counts.
const MODES = [
  { id: 'max-age', label: 'MAX-AGE' },
  { id: 'no-cache', label: 'NO-CACHE' },
  { id: 'no-store', label: 'NO-STORE' },
  { id: 'swr', label: 'STALE-WHILE-REVALIDATE' },
];

// Request arrival times (seconds since the resource was first fetched).
const ARRIVALS = [0, 3, 7, 12, 18, 24, 30];
const T_MAX = 32;

const HEADERS = {
  'max-age': 'Cache-Control: max-age=10',
  'no-cache': 'Cache-Control: no-cache',
  'no-store': 'Cache-Control: no-store',
  swr: 'Cache-Control: max-age=10, stale-while-revalidate=10',
};

function buildFrames(mode) {
  const frames = [];
  const maxAge = 10;
  const swrWindow = 10;
  let stored = false;       // is a copy in the cache?
  let storedAt = -1;        // when the stored copy was fetched
  let hits = 0;
  let misses = 0;
  let revals = 0;

  const ageOf = (t) => (stored ? t - storedAt : 0);

  const snap = (extra) => ({
    mode,
    t: 0,
    stored,
    age: 0,
    maxAge,
    cacheState: stored ? 'FRESH' : 'EMPTY',
    decision: null, // 'HIT' | 'MISS' | 'REVALIDATE' | 'HIT-STALE'
    hits,
    misses,
    revals,
    reqIndex: -1,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `${HEADERS[mode]}. Step a sequence of requests for one resource. Watch the cached copy age against max-age and see each request resolve to a network MISS, a cache HIT, or a revalidation.`,
  }));

  ARRIVALS.forEach((t, i) => {
    const age = ageOf(t);
    if (mode === 'no-store') {
      misses += 1;
      frames.push(snap({
        t, reqIndex: i, age: 0, stored: false, cacheState: 'EMPTY', decision: 'MISS',
        note: `t=${t}s: req #${i + 1}. no-store forbids keeping any copy, so every request is a full network MISS. Nothing is ever cached.`,
      }));
      return;
    }

    if (!stored) {
      // first fetch -> store
      stored = true;
      storedAt = t;
      misses += 1;
      frames.push(snap({
        t, reqIndex: i, age: 0, cacheState: 'FRESH', decision: 'MISS',
        note: `t=${t}s: req #${i + 1}. Cache empty -> network MISS. Response stored with max-age=${maxAge}; copy is now FRESH.`,
      }));
      return;
    }

    if (mode === 'no-cache') {
      // stored, but must revalidate every time
      revals += 1;
      storedAt = t; // assume 304 refreshes freshness marker
      frames.push(snap({
        t, reqIndex: i, age: 0, cacheState: 'FRESH', decision: 'REVALIDATE',
        note: `t=${t}s: req #${i + 1}. no-cache keeps the copy but REQUIRES revalidation: send If-None-Match / If-Modified-Since. Server returns 304 -> reuse the body, no full download.`,
      }));
      return;
    }

    // max-age and swr share the freshness test
    if (age < maxAge) {
      hits += 1;
      frames.push(snap({
        t, reqIndex: i, age, cacheState: 'FRESH', decision: 'HIT',
        note: `t=${t}s: req #${i + 1}. age=${age}s < max-age=${maxAge}s -> still FRESH -> served straight from cache (HIT). No network at all.`,
      }));
      return;
    }

    // stale
    if (mode === 'swr' && age < maxAge + swrWindow) {
      // serve stale immediately, revalidate in background
      hits += 1;
      revals += 1;
      storedAt = t; // background refresh updates the copy
      frames.push(snap({
        t, reqIndex: i, age, cacheState: 'STALE', decision: 'HIT-STALE',
        note: `t=${t}s: req #${i + 1}. age=${age}s is past max-age but inside the stale-while-revalidate window (${maxAge}..${maxAge + swrWindow}s). Serve the STALE copy instantly, then refresh it in the background.`,
      }));
      return;
    }

    // plain max-age stale, or swr window expired -> revalidate / refetch
    revals += 1;
    storedAt = t;
    frames.push(snap({
      t, reqIndex: i, age, cacheState: 'STALE', decision: 'REVALIDATE',
      note: `t=${t}s: req #${i + 1}. age=${age}s >= max-age=${maxAge}s -> copy is STALE. Must revalidate with the server before reuse (conditional request -> 304 or fresh 200).`,
    }));
  });

  frames.push(snap({
    note: `Done. ${hits} cache hits, ${misses} network misses, ${revals} revalidations. ${
      mode === 'no-store' ? 'no-store never reuses anything.'
        : mode === 'no-cache' ? 'no-cache always revalidates but avoids re-downloading unchanged bodies.'
          : mode === 'swr' ? 'stale-while-revalidate trades a moment of staleness for zero blocking on the network.'
            : 'max-age serves freely until the copy expires, then revalidates.'
    }`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1200;

export default function HttpCachingViz() {
  const [mode, setMode] = useState('max-age');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode), [mode]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 360;
  const axisLeft = 60;
  const axisRight = W - 40;
  const axisY = 250;
  const axisW = axisRight - axisLeft;
  const tx = (t) => axisLeft + (t / T_MAX) * axisW;

  const showFresh = mode !== 'no-store';
  const freshEnd = current.stored ? Math.min(T_MAX, (current.t - current.age) + current.maxAge) : 0;
  const freshStart = current.stored ? current.t - current.age : 0;

  const decisionClass = current.decision === 'HIT' ? 'is-hit'
    : current.decision === 'MISS' ? 'is-miss'
      : current.decision === 'HIT-STALE' ? 'is-stale'
        : current.decision === 'REVALIDATE' ? 'is-reval' : '';

  // age gauge geometry
  const gaugeX = 700;
  const gaugeY = 70;
  const gaugeW = 180;
  const gaugeH = 22;
  const ageFrac = current.maxAge ? Math.min(1.2, current.age / current.maxAge) : 0;

  return (
    <div className="hcv">
      <div className="hcv-head">
        <h3 className="hcv-title">HTTP caching — freshness, expiry and revalidation</h3>
        <p className="hcv-sub">
          Step one resource through a request timeline under each Cache-Control directive. Watch the freshness
          lifetime fill, the copy go stale past max-age, and each request resolve to a hit, a miss or a
          revalidation.
        </p>
      </div>

      <div className="hcv-controls">
        <div className="hcv-modes" role="tablist" aria-label="Cache-Control directive">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`hcv-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="hcv-speed">
          <span className="hcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="hcv-range"
            aria-label="Playback speed"
          />
          <span className="hcv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="hcv-spacer" aria-hidden="true" />

        <div className="hcv-buttons">
          <button
            type="button"
            className="hcv-btn hcv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="hcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="hcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="hcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="hcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="hcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="hcv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="hcv-header-text" x={axisLeft} y={28}>{HEADERS[mode]}</text>

          {/* freshness band */}
          {showFresh && current.stored && (
            <g>
              <rect
                className="hcv-fresh"
                x={tx(freshStart)}
                y={axisY - 70}
                width={Math.max(0, tx(freshEnd) - tx(freshStart))}
                height={50}
                rx={5}
              />
              <text className="hcv-fresh-label" x={(tx(freshStart) + tx(freshEnd)) / 2} y={axisY - 78}>
                FRESH (max-age {current.maxAge}s)
              </text>
              {mode === 'swr' && (
                <rect
                  className="hcv-swr"
                  x={tx(freshEnd)}
                  y={axisY - 70}
                  width={Math.max(0, tx(Math.min(T_MAX, freshEnd + 10)) - tx(freshEnd))}
                  height={50}
                  rx={5}
                />
              )}
            </g>
          )}

          {/* time axis */}
          <line className="hcv-axis" x1={axisLeft} y1={axisY} x2={axisRight} y2={axisY} />
          {Array.from({ length: T_MAX / 2 + 1 }).map((_, k) => {
            const t = k * 2;
            return (
              <g key={`tick-${t}`}>
                <line className="hcv-tick" x1={tx(t)} y1={axisY} x2={tx(t)} y2={axisY + 6} />
                <text className="hcv-tick-label" x={tx(t)} y={axisY + 20}>{t}</text>
              </g>
            );
          })}
          <text className="hcv-axis-label" x={axisRight} y={axisY + 38} textAnchor="end">time (s)</text>

          {/* request markers */}
          {ARRIVALS.map((t, i) => {
            const isCur = current.reqIndex === i;
            const cls = ['hcv-req', isCur && `is-cur ${decisionClass}`, !isCur && current.reqIndex > i && 'is-past'].filter(Boolean).join(' ');
            return (
              <g key={`req-${i}`}>
                <circle className={cls} cx={tx(t)} cy={axisY} r={6} />
                {isCur && (
                  <path
                    className={`hcv-req-ptr ${decisionClass}`}
                    d={`M ${tx(t)} ${axisY - 12} L ${tx(t) - 6} ${axisY - 24} L ${tx(t) + 6} ${axisY - 24} Z`}
                  />
                )}
              </g>
            );
          })}
          <text className="hcv-row-label" x={axisLeft} y={axisY - 96}>resource freshness lifetime</text>

          {/* age gauge */}
          {showFresh && (
            <g>
              <text className="hcv-gauge-label" x={gaugeX} y={gaugeY - 6}>age vs max-age</text>
              <rect className="hcv-gauge-bg" x={gaugeX} y={gaugeY} width={gaugeW} height={gaugeH} rx={5} />
              <rect
                className={`hcv-gauge-fill ${current.age >= current.maxAge ? 'is-over' : ''}`}
                x={gaugeX}
                y={gaugeY}
                width={Math.min(gaugeW, gaugeW * ageFrac)}
                height={gaugeH}
                rx={5}
              />
              <line className="hcv-gauge-mark" x1={gaugeX + gaugeW} y1={gaugeY - 3} x2={gaugeX + gaugeW} y2={gaugeY + gaugeH + 3} />
              <text className="hcv-gauge-val" x={gaugeX} y={gaugeY + gaugeH + 18}>
                age {current.age}s / {current.maxAge}s
              </text>
            </g>
          )}

          {/* decision badge */}
          {current.decision && (
            <g>
              <text className={`hcv-badge ${decisionClass}`} x={gaugeX + gaugeW / 2} y={gaugeY + 70}>
                {current.decision}
              </text>
              <text className="hcv-badge-sub" x={gaugeX + gaugeW / 2} y={gaugeY + 92}>request #{current.reqIndex + 1}</text>
            </g>
          )}
        </svg>
      </div>

      <div className="hcv-metrics">
        <div className="hcv-metric">
          <span className="hcv-metric-label">cache state</span>
          <span className={`hcv-metric-value ${current.cacheState === 'FRESH' ? 'is-hit' : current.cacheState === 'STALE' ? 'is-stale' : ''}`}>
            {current.cacheState}
          </span>
        </div>
        <div className="hcv-metric">
          <span className="hcv-metric-label">age / max-age</span>
          <span className="hcv-metric-value">{current.age}s / {current.maxAge}s</span>
        </div>
        <div className="hcv-metric">
          <span className="hcv-metric-label">decision</span>
          <span className={`hcv-metric-value ${decisionClass}`}>{current.decision || '—'}</span>
        </div>
        <div className="hcv-metric">
          <span className="hcv-metric-label">hits</span>
          <span className="hcv-metric-value is-hit">{current.hits}</span>
        </div>
        <div className="hcv-metric">
          <span className="hcv-metric-label">misses</span>
          <span className="hcv-metric-value is-miss">{current.misses}</span>
        </div>
        <div className="hcv-metric">
          <span className="hcv-metric-label">revalidations</span>
          <span className="hcv-metric-value is-reval">{current.revals}</span>
        </div>
      </div>

      <div className="hcv-narration">
        <span className="hcv-narration-label">trace</span>
        <span className="hcv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
