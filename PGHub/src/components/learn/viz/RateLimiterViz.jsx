import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './RateLimiterViz.css';

const MODES = [
  { id: 'token', label: 'TOKEN BUCKET' },
  { id: 'window', label: 'SLIDING WINDOW' },
];

// Fixed request arrival sequence (seconds). Bursty to exercise both algorithms.
const ARRIVALS = [0, 1, 1, 2, 3, 3, 3, 5, 6, 6, 8, 9, 9, 9, 10];
const T_MAX = 11;

// ---- Token-bucket trace ----------------------------------------------------
// Bucket starts full (capacity). Refills at `rate` tokens/sec, capped at capacity.
// Each arrival consumes one token if available (ALLOWED) else DENIED.
function buildTokenFrames(capacity, rate) {
  const frames = [];
  let tokens = capacity;
  let prevT = 0;
  let allowed = 0;
  let denied = 0;

  const snap = (extra) => ({
    tokens: Math.max(0, Math.min(capacity, tokens)),
    allowed,
    denied,
    t: prevT,
    decision: null,
    reqIndex: -1,
    ...extra,
  });

  frames.push(snap({
    note: `Bucket starts full: ${capacity}/${capacity} tokens. It refills at ${rate}/s up to ${capacity}. Each request spends one token, or is denied if the bucket is empty.`,
  }));

  ARRIVALS.forEach((t, i) => {
    // Refill for the elapsed gap since the previous event.
    const gap = t - prevT;
    if (gap > 0) {
      const before = tokens;
      tokens = Math.min(capacity, tokens + gap * rate);
      prevT = t;
      if (tokens !== before) {
        frames.push(snap({
          note: `t=${t}s: ${gap}s elapsed -> refill +${(gap * rate).toFixed(1)} -> bucket now ${tokens.toFixed(1)}/${capacity}.`,
        }));
      }
    }
    prevT = t;
    // Try to consume.
    if (tokens >= 1) {
      tokens -= 1;
      allowed += 1;
      frames.push(snap({
        decision: 'ALLOW', reqIndex: i,
        note: `t=${t}s: request #${i + 1} -> bucket has a token -> spend 1 -> ALLOWED (${tokens.toFixed(1)} left).`,
      }));
    } else {
      denied += 1;
      frames.push(snap({
        decision: 'DENY', reqIndex: i,
        note: `t=${t}s: request #${i + 1} -> bucket empty (${tokens.toFixed(1)}) -> DENIED.`,
      }));
    }
  });

  frames.push(snap({
    note: `Done. ${allowed} allowed, ${denied} denied across ${ARRIVALS.length} requests. The bucket smooths bursts: a full bucket absorbs up to ${capacity} back-to-back hits, then throttles to the ${rate}/s refill rate.`,
  }));
  return frames;
}

// ---- Sliding-window trace --------------------------------------------------
// Keeps a log of allowed timestamps. On each arrival, drop entries older than
// (t - window), then allow iff the in-window count < limit.
function buildWindowFrames(windowW, limit) {
  const frames = [];
  const log = []; // timestamps of allowed requests
  let allowed = 0;
  let denied = 0;

  const snap = (extra) => ({
    log: log.slice(),
    allowed,
    denied,
    t: 0,
    decision: null,
    reqIndex: -1,
    count: 0,
    ...extra,
  });

  frames.push(snap({
    note: `Sliding window of width ${windowW}s, limit ${limit} requests. Each arrival drops timestamps older than t-${windowW}, then is allowed only if fewer than ${limit} remain inside the window.`,
  }));

  ARRIVALS.forEach((t, i) => {
    const lo = t - windowW;
    while (log.length && log[0] <= lo) log.shift();
    const count = log.length;
    if (count < limit) {
      log.push(t);
      allowed += 1;
      frames.push(snap({
        decision: 'ALLOW', reqIndex: i, t, count: count + 1,
        note: `t=${t}s: request #${i + 1} -> window (${lo}, ${t}] holds ${count} < ${limit} -> ALLOWED (now ${count + 1} in window).`,
      }));
    } else {
      denied += 1;
      frames.push(snap({
        decision: 'DENY', reqIndex: i, t, count,
        note: `t=${t}s: request #${i + 1} -> window (${lo}, ${t}] already holds ${count} = limit ${limit} -> DENIED.`,
      }));
    }
  });

  frames.push(snap({
    note: `Done. ${allowed} allowed, ${denied} denied. The window counts only the last ${windowW}s, so old requests expire and free up capacity — no fixed-bucket reset edge to exploit.`,
  }));
  return frames;
}

export default function RateLimiterViz() {
  const [mode, setMode] = useState('token');
  const [capacity, setCapacity] = useState(4);
  const [rate, setRate] = useState(1);
  const [windowW, setWindowW] = useState(3);
  const [limit, setLimit] = useState(3);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'token'
      ? buildTokenFrames(capacity, rate)
      : buildWindowFrames(windowW, limit)),
    [mode, capacity, rate, windowW, limit],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const changeParam = (setter, value, lo, hi) => {
    const next = Math.max(lo, Math.min(hi, value));
    setIsRunning(false);
    setStep(0);
    setter(next);
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

  // Token-bucket fill geometry
  const bucketX = 120;
  const bucketY = 56;
  const bucketW = 130;
  const bucketH = 150;
  const fillFrac = mode === 'token' ? current.tokens / capacity : 0;
  const fillH = bucketH * fillFrac;

  const winLo = mode === 'window' ? Math.max(0, current.t - windowW) : 0;

  return (
    <div className="rlv">
      <div className="rlv-head">
        <h3 className="rlv-title">Rate limiting — token bucket vs sliding window</h3>
        <p className="rlv-sub">
          Step a fixed request sequence through each limiter. Watch tokens drain and refill, or the
          window slide across timestamps, and see every request resolve to ALLOWED or DENIED.
        </p>
      </div>

      <div className="rlv-controls">
        <div className="rlv-modes" role="tablist" aria-label="Limiter algorithm">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`rlv-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'token' ? (
          <>
            <label className="rlv-slider">
              <span className="rlv-input-label">capacity</span>
              <input
                type="range" min={1} max={8} step={1} value={capacity}
                onChange={(e) => changeParam(setCapacity, Number(e.target.value), 1, 8)}
                className="rlv-range" aria-label="Bucket capacity"
              />
              <span className="rlv-slider-val">{capacity}</span>
            </label>
            <label className="rlv-slider">
              <span className="rlv-input-label">refill /s</span>
              <input
                type="range" min={0.5} max={3} step={0.5} value={rate}
                onChange={(e) => changeParam(setRate, Number(e.target.value), 0.5, 3)}
                className="rlv-range" aria-label="Refill rate per second"
              />
              <span className="rlv-slider-val">{rate.toFixed(1)}</span>
            </label>
          </>
        ) : (
          <>
            <label className="rlv-slider">
              <span className="rlv-input-label">window s</span>
              <input
                type="range" min={1} max={6} step={1} value={windowW}
                onChange={(e) => changeParam(setWindowW, Number(e.target.value), 1, 6)}
                className="rlv-range" aria-label="Window width seconds"
              />
              <span className="rlv-slider-val">{windowW}</span>
            </label>
            <label className="rlv-slider">
              <span className="rlv-input-label">limit</span>
              <input
                type="range" min={1} max={6} step={1} value={limit}
                onChange={(e) => changeParam(setLimit, Number(e.target.value), 1, 6)}
                className="rlv-range" aria-label="Request limit per window"
              />
              <span className="rlv-slider-val">{limit}</span>
            </label>
          </>
        )}

        <label className="rlv-slider">
          <span className="rlv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rlv-range" aria-label="Playback speed"
          />
          <span className="rlv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="rlv-spacer" aria-hidden="true" />

        <div className="rlv-buttons">
          <button
            type="button"
            className="rlv-btn rlv-btn-primary"
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
            className="rlv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="rlv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="rlv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="rlv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="rlv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rlv-svg" preserveAspectRatio="xMidYMid meet">
          {/* time axis shared by both modes */}
          <line className="rlv-axis" x1={axisLeft} y1={axisY} x2={axisRight} y2={axisY} />
          {Array.from({ length: T_MAX + 1 }).map((_, t) => (
            <g key={`tick-${t}`}>
              <line className="rlv-tick" x1={tx(t)} y1={axisY} x2={tx(t)} y2={axisY + 6} />
              <text className="rlv-tick-label" x={tx(t)} y={axisY + 20}>{t}</text>
            </g>
          ))}
          <text className="rlv-axis-label" x={axisRight} y={axisY + 38} textAnchor="end">time (s)</text>

          {/* request markers on the axis */}
          {ARRIVALS.map((t, i) => {
            const resolved = current.reqIndex >= i || (current.decision === null && step === totalSteps - 1);
            const isCur = current.reqIndex === i;
            // Determine per-request decision from frames is costly; reflect only current + done state via class.
            const cls = [
              'rlv-req',
              isCur && (current.decision === 'ALLOW' ? 'is-allow' : 'is-deny'),
              !isCur && resolved && 'is-past',
            ].filter(Boolean).join(' ');
            // stack overlapping requests at same t
            const sameBefore = ARRIVALS.slice(0, i).filter((x) => x === t).length;
            const cyOff = sameBefore * 18;
            return (
              <g key={`req-${i}`}>
                <circle className={cls} cx={tx(t)} cy={axisY - 14 - cyOff} r={6} />
                {isCur && (
                  <path
                    className={`rlv-req-ptr ${current.decision === 'ALLOW' ? 'is-allow' : 'is-deny'}`}
                    d={`M ${tx(t)} ${axisY - 26 - cyOff} L ${tx(t) - 6} ${axisY - 38 - cyOff} L ${tx(t) + 6} ${axisY - 38 - cyOff} Z`}
                  />
                )}
              </g>
            );
          })}
          <text className="rlv-row-label" x={axisLeft} y={28}>request arrivals (pointer = current request)</text>

          {mode === 'token' ? (
            <g>
              {/* bucket */}
              <rect className="rlv-bucket" x={bucketX} y={bucketY} width={bucketW} height={bucketH} rx={8} />
              <rect
                className={`rlv-bucket-fill ${current.decision === 'DENY' ? 'is-empty' : ''}`}
                x={bucketX + 3}
                y={bucketY + bucketH - fillH}
                width={bucketW - 6}
                height={Math.max(0, fillH)}
                rx={5}
              />
              <text className="rlv-bucket-cap" x={bucketX + bucketW / 2} y={bucketY - 10}>capacity {capacity}</text>
              <text className="rlv-bucket-val" x={bucketX + bucketW / 2} y={bucketY + bucketH / 2 + 8}>
                {current.tokens.toFixed(1)}
              </text>
              <text className="rlv-bucket-unit" x={bucketX + bucketW / 2} y={bucketY + bucketH / 2 + 28}>tokens</text>
              {/* refill arrow */}
              <path className="rlv-refill" d={`M ${bucketX + bucketW + 26} ${bucketY + 30} q -22 -22 -22 0`} />
              <text className="rlv-refill-label" x={bucketX + bucketW + 34} y={bucketY + 18}>+{rate.toFixed(1)}/s</text>
              {/* big decision badge */}
              {current.decision && (
                <text
                  className={`rlv-badge ${current.decision === 'ALLOW' ? 'is-allow' : 'is-deny'}`}
                  x={520}
                  y={140}
                >
                  {current.decision === 'ALLOW' ? 'ALLOWED' : 'DENIED'}
                </text>
              )}
              <text className="rlv-badge-sub" x={520} y={168}>request #{current.reqIndex + 1}</text>
            </g>
          ) : (
            <g>
              {/* sliding window band over the axis */}
              <rect
                className="rlv-window"
                x={tx(winLo)}
                y={axisY - 110}
                width={tx(current.t) - tx(winLo)}
                height={96}
                rx={6}
              />
              <text className="rlv-window-label" x={(tx(winLo) + tx(current.t)) / 2} y={axisY - 116}>
                window ({winLo} , {current.t}] · width {windowW}
              </text>
              {/* logged timestamps inside window highlighted */}
              {current.log.map((ts, k) => (
                <circle key={`log-${k}`} className="rlv-log" cx={tx(ts)} cy={axisY - 62} r={5} />
              ))}
              <text className="rlv-count" x={520} y={120}>
                {current.count} / {limit}
              </text>
              <text className="rlv-count-sub" x={520} y={146}>in window</text>
              {current.decision && (
                <text
                  className={`rlv-badge ${current.decision === 'ALLOW' ? 'is-allow' : 'is-deny'}`}
                  x={520}
                  y={184}
                >
                  {current.decision === 'ALLOW' ? 'ALLOWED' : 'DENIED'}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      <div className="rlv-metrics">
        <div className="rlv-metric">
          <span className="rlv-metric-label">mode</span>
          <span className="rlv-metric-value">{mode === 'token' ? 'token bucket' : 'sliding window'}</span>
        </div>
        <div className="rlv-metric">
          <span className="rlv-metric-label">{mode === 'token' ? 'tokens' : 'in window'}</span>
          <span className="rlv-metric-value">
            {mode === 'token' ? current.tokens.toFixed(1) : `${current.count} / ${limit}`}
          </span>
        </div>
        <div className="rlv-metric">
          <span className="rlv-metric-label">decision</span>
          <span className={`rlv-metric-value ${current.decision === 'ALLOW' ? 'is-allow' : current.decision === 'DENY' ? 'is-deny' : ''}`}>
            {current.decision || '—'}
          </span>
        </div>
        <div className="rlv-metric">
          <span className="rlv-metric-label">allowed</span>
          <span className="rlv-metric-value is-allow">{current.allowed}</span>
        </div>
        <div className="rlv-metric">
          <span className="rlv-metric-label">denied</span>
          <span className="rlv-metric-value is-deny">{current.denied}</span>
        </div>
      </div>

      <div className="rlv-narration">
        <span className="rlv-narration-label">trace</span>
        <span className="rlv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
