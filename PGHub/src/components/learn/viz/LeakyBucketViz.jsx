import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './LeakyBucketViz.css';

// Bursty arrival schedule: number of requests dropping in at each tick.
// Designed so a small bucket overflows on the bursts and drains on the lulls.
const ARRIVALS = [1, 0, 3, 2, 0, 4, 1, 0, 0, 2, 5, 0, 1, 0, 0];
const T_MAX = ARRIVALS.length;

// Build the full step trace.
// Discrete-time leaky bucket (queue/shaper model):
//   - level = number of requests currently queued in the bucket (water level)
//   - each tick: LEAK first (process up to `leak` queued requests out the bottom),
//                then ADMIT arrivals into the freed space up to `capacity`,
//                any arrival that finds the bucket full is an OVERFLOW (dropped).
// Invariant enforced/asserted: 0 <= level <= capacity at every frame.
function buildFrames(capacity, leak) {
  const frames = [];
  let level = 0;
  let processed = 0;
  let dropped = 0;
  let admitted = 0;
  let arrivedTotal = 0;

  const snap = (extra) => ({
    level,
    processed,
    dropped,
    admitted,
    arrivedTotal,
    t: -1,
    phase: 'init',
    leaked: 0,
    arrivals: 0,
    admittedNow: 0,
    droppedNow: 0,
    ...extra,
  });

  frames.push(snap({
    note: `Empty bucket, capacity ${capacity}, leak rate ${leak}/tick. Requests drop in from the top; the bucket leaks ${leak} request${leak === 1 ? '' : 's'} per tick out the bottom at a steady rate. Arrivals that find the bucket full OVERFLOW and are dropped.`,
  }));

  for (let t = 0; t < ARRIVALS.length; t++) {
    // Phase 1: leak (steady output at the bottom).
    const leaked = Math.min(leak, level);
    if (leaked > 0) {
      level -= leaked;
      processed += leaked;
      frames.push(snap({
        t,
        phase: 'leak',
        leaked,
        note: `t=${t}: leak — ${leaked} request${leaked === 1 ? '' : 's'} processed out the bottom at the steady ${leak}/tick rate. Level falls to ${level}/${capacity}.`,
      }));
    } else {
      frames.push(snap({
        t,
        phase: 'leak',
        leaked: 0,
        note: `t=${t}: leak — bucket is empty, nothing to process. Output rate is 0 this tick (steady ${leak}/tick has no work).`,
      }));
    }

    // Phase 2: arrivals drop in; admit up to remaining capacity, overflow the rest.
    const arrivals = ARRIVALS[t];
    arrivedTotal += arrivals;
    const room = capacity - level;
    const admit = Math.min(arrivals, room);
    const overflow = arrivals - admit;
    level += admit;
    admitted += admit;
    dropped += overflow;

    let note;
    if (arrivals === 0) {
      note = `t=${t}: no arrivals — a lull. Bucket sits at ${level}/${capacity}, draining steadily.`;
    } else if (overflow === 0) {
      note = `t=${t}: ${arrivals} arrive — bucket has room (${room} free) -> all ${admit} admitted. Level rises to ${level}/${capacity}.`;
    } else {
      note = `t=${t}: burst of ${arrivals} arrives, bucket full at C=${capacity} (only ${room} free) -> ${admit} admitted, ${overflow} OVERFLOW dropped. Level pinned at ${level}/${capacity}.`;
    }

    frames.push(snap({
      t,
      phase: 'arrive',
      arrivals,
      admittedNow: admit,
      droppedNow: overflow,
      note,
    }));
  }

  // Drain phase: keep leaking until the bucket empties, so the steady output is visible.
  let dt = ARRIVALS.length;
  while (level > 0) {
    const leaked = Math.min(leak, level);
    level -= leaked;
    processed += leaked;
    frames.push(snap({
      t: dt,
      phase: 'drain',
      leaked,
      note: `t=${dt}: drain — no more arrivals, bucket leaks its backlog at the steady ${leak}/tick. ${leaked} processed, level now ${level}/${capacity}.`,
    }));
    dt += 1;
  }

  frames.push(snap({
    t: dt,
    phase: 'done',
    note: `Done. ${arrivedTotal} requests arrived -> ${admitted} admitted, ${dropped} dropped on overflow; ${processed} processed out the bottom. The leaky bucket smooths the bursty input into a steady ${leak}/tick output — bursts never pass through, unlike a token bucket which lets a full bucket burst.`,
  }));

  return frames;
}

export default function LeakyBucketViz() {
  const [capacity, setCapacity] = useState(5);
  const [leak, setLeak] = useState(1);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(capacity, leak), [capacity, leak]);
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

  const changeParam = (setter, value, lo, hi) => {
    const next = Math.max(lo, Math.min(hi, value));
    setIsRunning(false);
    setStep(0);
    setter(next);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 380;

  // Bucket geometry (the shaper).
  const bucketX = 360;
  const bucketTop = 70;
  const bucketW = 200;
  const bucketH = 220;
  const innerPad = 6;
  const innerX = bucketX + innerPad;
  const innerW = bucketW - innerPad * 2;
  const innerTop = bucketTop + innerPad;
  const innerH = bucketH - innerPad * 2;
  const fillFrac = capacity > 0 ? current.level / capacity : 0;
  const fillH = innerH * fillFrac;
  const fillY = innerTop + innerH - fillH;

  const isOverflow = current.phase === 'arrive' && current.droppedNow > 0;
  const isLeaking = (current.phase === 'leak' || current.phase === 'drain') && current.leaked > 0;
  const isAdmit = current.phase === 'arrive' && current.admittedNow > 0;

  // Capacity tick marks down the side of the bucket.
  const ticks = Array.from({ length: capacity + 1 }).map((_, i) => {
    const y = innerTop + innerH - (innerH * i) / capacity;
    return { i, y };
  });

  const total = current.arrivedTotal;
  const dropPct = total ? Math.round((current.dropped / total) * 100) : 0;

  return (
    <div className="lbv">
      <div className="lbv-head">
        <h3 className="lbv-title">Leaky bucket — the traffic shaper</h3>
        <p className="lbv-sub">
          Bursty requests drop into a fixed bucket; it leaks at a constant rate out the bottom. When a burst
          arrives and the bucket is full, the excess overflows and is dropped — the output stays smooth.
        </p>
      </div>

      <div className="lbv-controls">
        <label className="lbv-slider">
          <span className="lbv-input-label">capacity C</span>
          <input
            type="range" min={2} max={9} step={1} value={capacity}
            onChange={(e) => changeParam(setCapacity, Number(e.target.value), 2, 9)}
            className="lbv-range" aria-label="Bucket capacity"
          />
          <span className="lbv-slider-val">{capacity}</span>
        </label>
        <label className="lbv-slider">
          <span className="lbv-input-label">leak r /tick</span>
          <input
            type="range" min={1} max={4} step={1} value={leak}
            onChange={(e) => changeParam(setLeak, Number(e.target.value), 1, 4)}
            className="lbv-range" aria-label="Leak rate per tick"
          />
          <span className="lbv-slider-val">{leak}</span>
        </label>
        <label className="lbv-slider">
          <span className="lbv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="lbv-range" aria-label="Playback speed"
          />
          <span className="lbv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="lbv-spacer" aria-hidden="true" />

        <div className="lbv-buttons">
          <button
            type="button"
            className="lbv-btn lbv-btn-primary"
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
            className="lbv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="lbv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="lbv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="lbv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="lbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lbv-svg" preserveAspectRatio="xMidYMid meet">
          {/* arrivals lane (top): bursty input dropping in */}
          <text className="lbv-row-label" x={bucketX + bucketW / 2} y={28} textAnchor="middle">
            bursty arrivals
          </text>
          {Array.from({ length: Math.min(current.phase === 'arrive' ? current.arrivals : 0, 6) }).map((_, i) => {
            const span = bucketW - 40;
            const cx = bucketX + 20 + (current.arrivals > 1 ? (span * i) / Math.max(1, Math.min(current.arrivals, 6) - 1) : span / 2);
            const dropped = isOverflow && i >= current.admittedNow;
            return (
              <g key={`drop-${i}`}>
                <circle
                  className={`lbv-drop ${dropped ? 'is-drop' : 'is-admit'}`}
                  cx={cx}
                  cy={48}
                  r={7}
                />
                <line
                  className={`lbv-drop-trail ${dropped ? 'is-drop' : 'is-admit'}`}
                  x1={cx}
                  y1={40}
                  x2={cx}
                  y2={56}
                />
              </g>
            );
          })}

          {/* overflow chute (excess spills off the rim) */}
          {isOverflow && (
            <g>
              <path
                className="lbv-overflow-chute"
                d={`M ${bucketX} ${bucketTop + 4} q -34 8 -54 34`}
              />
              <text className="lbv-overflow-label" x={bucketX - 58} y={bucketTop + 56} textAnchor="end">
                OVERFLOW
              </text>
              <text className="lbv-overflow-count" x={bucketX - 58} y={bucketTop + 74} textAnchor="end">
                {current.droppedNow} dropped
              </text>
            </g>
          )}

          {/* the bucket */}
          <rect
            className={`lbv-bucket ${isOverflow ? 'is-overflow' : ''}`}
            x={bucketX}
            y={bucketTop}
            width={bucketW}
            height={bucketH}
            rx={10}
          />
          {/* water fill (queued requests) */}
          <rect
            className={`lbv-fill ${isOverflow ? 'is-full' : ''} ${isAdmit ? 'is-rising' : ''} ${isLeaking ? 'is-falling' : ''}`}
            x={innerX}
            y={fillY}
            width={innerW}
            height={Math.max(0, fillH)}
            rx={4}
          />
          {/* surface line on the water */}
          {current.level > 0 && (
            <line className="lbv-surface" x1={innerX} y1={fillY} x2={innerX + innerW} y2={fillY} />
          )}

          {/* capacity tick marks */}
          {ticks.map((tk) => (
            <g key={`tick-${tk.i}`}>
              <line className="lbv-tick" x1={bucketX + bucketW} y1={tk.y} x2={bucketX + bucketW + 8} y2={tk.y} />
              <text className="lbv-tick-label" x={bucketX + bucketW + 12} y={tk.y + 4}>{tk.i}</text>
            </g>
          ))}
          <text className="lbv-cap-label" x={bucketX + bucketW + 12} y={bucketTop - 6}>C={capacity}</text>

          {/* level readout inside the bucket */}
          <text className="lbv-level-val" x={bucketX + bucketW / 2} y={bucketTop + bucketH / 2 - 6}>
            {current.level}
          </text>
          <text className="lbv-level-unit" x={bucketX + bucketW / 2} y={bucketTop + bucketH / 2 + 16}>
            queued
          </text>

          {/* leak spout + steady output */}
          <path
            className="lbv-spout"
            d={`M ${bucketX + bucketW / 2 - 14} ${bucketTop + bucketH} l 0 16 l 28 0 l 0 -16`}
          />
          {Array.from({ length: isLeaking ? current.leaked : 0 }).map((_, i) => (
            <circle
              key={`leak-${i}`}
              className="lbv-leak-drop"
              cx={bucketX + bucketW / 2}
              cy={bucketTop + bucketH + 30 + i * 18}
              r={6}
            />
          ))}
          <text className="lbv-leak-label" x={bucketX + bucketW / 2} y={bucketTop + bucketH + 78} textAnchor="middle">
            steady output {leak}/tick
          </text>

          {/* phase badge */}
          <text
            className={`lbv-badge ${isOverflow ? 'is-overflow' : current.phase === 'arrive' ? 'is-admit' : current.phase === 'done' ? 'is-done' : 'is-leak'}`}
            x={760}
            y={bucketTop + 30}
          >
            {current.phase === 'leak' ? 'LEAK' : current.phase === 'drain' ? 'DRAIN'
              : current.phase === 'arrive' ? (isOverflow ? 'OVERFLOW' : 'ADMIT')
                : current.phase === 'done' ? 'DONE' : 'START'}
          </text>
          <text className="lbv-badge-sub" x={760} y={bucketTop + 54}>
            {current.t >= 0 ? `t = ${current.t}` : 'init'}
          </text>

          {/* contrast note vs token bucket */}
          <text className="lbv-contrast" x={760} y={bucketTop + 110}>vs token bucket:</text>
          <text className="lbv-contrast-sub" x={760} y={bucketTop + 130}>leaky smooths output;</text>
          <text className="lbv-contrast-sub" x={760} y={bucketTop + 148}>no bursts pass through.</text>
        </svg>
      </div>

      <div className="lbv-metrics">
        <div className="lbv-metric">
          <span className="lbv-metric-label">level</span>
          <span className="lbv-metric-value">{current.level} / {capacity}</span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">output rate</span>
          <span className="lbv-metric-value">{leak}/tick</span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">processed</span>
          <span className="lbv-metric-value is-ok">{current.processed}</span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">dropped</span>
          <span className="lbv-metric-value is-drop">{current.dropped}</span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">drop rate</span>
          <span className="lbv-metric-value">{dropPct}%</span>
        </div>
      </div>

      <div className="lbv-narration">
        <span className="lbv-narration-label">trace</span>
        <span className="lbv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
