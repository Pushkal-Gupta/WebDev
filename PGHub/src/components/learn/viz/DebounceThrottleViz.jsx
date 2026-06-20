import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Play, Pause, RotateCcw, ChevronRight, SkipForward, Sparkles } from 'lucide-react';
import './DebounceThrottleViz.css';

const T_MAX = 2000;

function lcg(seed) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function genEvents(seed) {
  const rand = lcg(seed * 2654435761 + 1);
  const events = [];
  let t = 40 + Math.floor(rand() * 80);
  const bursts = 2 + Math.floor(rand() * 2);
  for (let b = 0; b < bursts; b += 1) {
    const len = 3 + Math.floor(rand() * 5);
    for (let k = 0; k < len && t < T_MAX - 60; k += 1) {
      events.push(Math.round(t));
      t += 25 + Math.floor(rand() * 70);
    }
    t += 300 + Math.floor(rand() * 350);
  }
  return events.filter((e) => e <= T_MAX);
}

function buildFrames(events, wait, interval) {
  const frames = [];
  const seen = [];
  const debounceCalls = [];
  const throttleCalls = [];
  let pendingTimer = null;
  let lastFire = -Infinity;

  const snap = (extra) => ({
    t: 0,
    seen: seen.slice(),
    debounceCalls: debounceCalls.slice(),
    throttleCalls: throttleCalls.slice(),
    pending: pendingTimer,
    decision: null,
    fired: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `Type ${events.length} keystrokes. Debounce waits ${wait}ms of silence then fires once; throttle fires immediately then ignores events for ${interval}ms.`,
  }));

  const merged = [];
  events.forEach((t, i) => merged.push({ t, kind: 'event', i }));

  let idx = 0;
  while (idx < merged.length) {
    const ev = merged[idx];

    if (pendingTimer !== null && pendingTimer <= ev.t) {
      debounceCalls.push(pendingTimer);
      frames.push(snap({
        t: pendingTimer,
        decision: 'debounce-fire',
        fired: 'debounce',
        pending: null,
        note: `t=${pendingTimer}ms: ${wait}ms of silence since last keystroke -> debounce timer EXPIRES -> FIRE debounce call #${debounceCalls.length}.`,
      }));
      pendingTimer = null;
      continue;
    }

    seen.push(ev.i);
    const sincePrev = ev.i > 0 ? ev.t - events[ev.i - 1] : null;
    pendingTimer = ev.t + wait;

    const gap = ev.t - lastFire;
    if (gap >= interval) {
      throttleCalls.push(ev.t);
      lastFire = ev.t;
      frames.push(snap({
        t: ev.t,
        decision: 'throttle-fire',
        fired: 'throttle',
        pending: pendingTimer,
        note: `t=${ev.t}ms: keystroke #${ev.i + 1}${sincePrev !== null ? ` (${sincePrev}ms since last)` : ''} -> throttle interval ${interval}ms elapsed -> FIRE throttle #${throttleCalls.length}; debounce timer (re)armed for t=${pendingTimer}ms.`,
      }));
    } else {
      const remain = interval - gap;
      frames.push(snap({
        t: ev.t,
        decision: 'throttle-suppress',
        pending: pendingTimer,
        note: `t=${ev.t}ms: keystroke #${ev.i + 1}${sincePrev !== null ? ` (${sincePrev}ms since last)` : ''} -> only ${gap}ms since last throttle call < ${interval}ms -> throttle SUPPRESSED (${remain}ms left); debounce timer reset to t=${pendingTimer}ms.`,
      }));
    }
    idx += 1;
  }

  while (pendingTimer !== null) {
    debounceCalls.push(pendingTimer);
    frames.push(snap({
      t: pendingTimer,
      decision: 'debounce-fire',
      fired: 'debounce',
      pending: null,
      note: `t=${pendingTimer}ms: ${wait}ms of silence after the last keystroke -> debounce timer EXPIRES -> FIRE debounce call #${debounceCalls.length}.`,
    }));
    pendingTimer = null;
  }

  frames.push(snap({
    t: T_MAX,
    note: `Done. ${events.length} keystrokes collapsed to ${debounceCalls.length} debounce call${debounceCalls.length === 1 ? '' : 's'} (one per burst) and ${throttleCalls.length} throttle call${throttleCalls.length === 1 ? '' : 's'} (capped at one per ${interval}ms).`,
  }));

  return frames;
}

export default function DebounceThrottleViz() {
  const [wait, setWait] = useState(200);
  const [interval, setInterval] = useState(200);
  const [seed, setSeed] = useState(1);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const events = useMemo(() => genEvents(seed), [seed]);
  const frames = useMemo(() => buildFrames(events, wait, interval), [events, wait, interval]);
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

  const typeBurst = () => {
    setIsRunning(false);
    setStep(0);
    setSeed((s) => s + 1);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const W = 940;
  const H = 380;
  const axisLeft = 70;
  const axisRight = W - 30;
  const axisW = axisRight - axisLeft;
  const tx = (t) => axisLeft + (t / T_MAX) * axisW;

  const laneEvents = 70;
  const laneDebounce = 175;
  const laneThrottle = 280;
  const playheadX = tx(current.t);

  const tickStep = 250;
  const ticks = [];
  for (let t = 0; t <= T_MAX; t += tickStep) ticks.push(t);

  return (
    <div className="dtv">
      <div className="dtv-head">
        <h3 className="dtv-title">Debounce vs throttle — taming a flood of events</h3>
        <p className="dtv-sub">
          A burst of keystrokes hits one timeline. Debounce collapses each burst to a single trailing call;
          throttle fires once then ignores events for a fixed interval. Step through to see every decision.
        </p>
      </div>

      <div className="dtv-controls">
        <label className="dtv-slider">
          <span className="dtv-input-label">wait (debounce)</span>
          <input
            type="range" min={100} max={600} step={50} value={wait}
            onChange={(e) => changeParam(setWait, Number(e.target.value), 100, 600)}
            className="dtv-range" aria-label="Debounce wait milliseconds"
          />
          <span className="dtv-slider-val">{wait}ms</span>
        </label>

        <label className="dtv-slider">
          <span className="dtv-input-label">interval (throttle)</span>
          <input
            type="range" min={100} max={600} step={50} value={interval}
            onChange={(e) => changeParam(setInterval, Number(e.target.value), 100, 600)}
            className="dtv-range" aria-label="Throttle interval milliseconds"
          />
          <span className="dtv-slider-val">{interval}ms</span>
        </label>

        <button type="button" className="dtv-btn dtv-btn-type" onClick={typeBurst}>
          <Keyboard size={14} /> Type
        </button>

        <label className="dtv-slider">
          <span className="dtv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dtv-range" aria-label="Playback speed"
          />
          <span className="dtv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="dtv-spacer" aria-hidden="true" />

        <div className="dtv-buttons">
          <button
            type="button"
            className="dtv-btn dtv-btn-primary"
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
            className="dtv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dtv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dtv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="dtv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dtv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dtv-svg" preserveAspectRatio="xMidYMid meet">
          {/* playhead */}
          <line className="dtv-playhead" x1={playheadX} y1={laneEvents - 30} x2={playheadX} y2={laneThrottle + 30} />

          {/* lane labels + baselines */}
          <text className="dtv-lane-label" x={axisLeft - 8} y={laneEvents + 4} textAnchor="end">input</text>
          <text className="dtv-lane-label" x={axisLeft - 8} y={laneDebounce + 4} textAnchor="end">debounce</text>
          <text className="dtv-lane-label" x={axisLeft - 8} y={laneThrottle + 4} textAnchor="end">throttle</text>

          <line className="dtv-lane-line" x1={axisLeft} y1={laneEvents} x2={axisRight} y2={laneEvents} />
          <line className="dtv-lane-line" x1={axisLeft} y1={laneDebounce} x2={axisRight} y2={laneDebounce} />
          <line className="dtv-lane-line" x1={axisLeft} y1={laneThrottle} x2={axisRight} y2={laneThrottle} />

          {/* input event ticks */}
          {events.map((t, i) => {
            const cls = ['dtv-event', current.seen.includes(i) ? 'is-seen' : ''].filter(Boolean).join(' ');
            return (
              <g key={`ev-${i}`}>
                <line className={cls} x1={tx(t)} y1={laneEvents - 16} x2={tx(t)} y2={laneEvents} />
                <circle className={cls} cx={tx(t)} cy={laneEvents - 16} r={4} />
              </g>
            );
          })}

          {/* pending debounce timer bar */}
          {current.pending !== null && current.t < current.pending && (
            <g>
              <line
                className="dtv-pending"
                x1={playheadX}
                y1={laneDebounce}
                x2={tx(current.pending)}
                y2={laneDebounce}
              />
              <circle className="dtv-pending-end" cx={tx(current.pending)} cy={laneDebounce} r={4} />
            </g>
          )}

          {/* debounce fired calls */}
          {current.debounceCalls.map((t, i) => (
            <g key={`db-${i}`}>
              <circle className="dtv-call is-debounce" cx={tx(t)} cy={laneDebounce} r={7} />
              <text className="dtv-call-num" x={tx(t)} y={laneDebounce + 4}>{i + 1}</text>
            </g>
          ))}

          {/* throttle interval shadows + fired calls */}
          {current.throttleCalls.map((t, i) => (
            <g key={`th-${i}`}>
              <rect
                className="dtv-throttle-block"
                x={tx(t)}
                y={laneThrottle - 10}
                width={Math.min(tx(t + interval), axisRight) - tx(t)}
                height={20}
                rx={4}
              />
              <circle className="dtv-call is-throttle" cx={tx(t)} cy={laneThrottle} r={7} />
              <text className="dtv-call-num" x={tx(t)} y={laneThrottle + 4}>{i + 1}</text>
            </g>
          ))}

          {/* current decision marker */}
          {current.decision && (
            <g>
              <circle
                className={`dtv-marker ${current.fired ? 'is-fire' : 'is-suppress'}`}
                cx={playheadX}
                cy={current.decision.startsWith('throttle') ? laneThrottle : laneDebounce}
                r={11}
              />
            </g>
          )}

          {/* time ticks */}
          {ticks.map((t) => (
            <g key={`tick-${t}`}>
              <line className="dtv-tick" x1={tx(t)} y1={laneThrottle + 18} x2={tx(t)} y2={laneThrottle + 24} />
              <text className="dtv-tick-label" x={tx(t)} y={laneThrottle + 38}>{t}</text>
            </g>
          ))}
          <text className="dtv-axis-label" x={axisRight} y={laneThrottle + 56} textAnchor="end">time (ms)</text>
        </svg>
      </div>

      <div className="dtv-metrics">
        <div className="dtv-metric">
          <span className="dtv-metric-label">events in</span>
          <span className="dtv-metric-value is-event">{current.seen.length}</span>
        </div>
        <div className="dtv-metric">
          <span className="dtv-metric-label">debounce calls</span>
          <span className="dtv-metric-value is-debounce">{current.debounceCalls.length}</span>
        </div>
        <div className="dtv-metric">
          <span className="dtv-metric-label">throttle calls</span>
          <span className="dtv-metric-value is-throttle">{current.throttleCalls.length}</span>
        </div>
        <div className="dtv-metric">
          <span className="dtv-metric-label">t</span>
          <span className="dtv-metric-value">{current.t}ms</span>
        </div>
        <div className="dtv-metric">
          <span className="dtv-metric-label">decision</span>
          <span className={`dtv-metric-value ${current.fired ? 'is-fire' : current.decision ? 'is-suppress' : ''}`}>
            {current.fired ? `${current.fired} FIRE` : current.decision === 'throttle-suppress' ? 'suppressed' : '—'}
          </span>
        </div>
      </div>

      <div className="dtv-narration">
        <span className="dtv-narration-label"><Sparkles size={12} /> trace</span>
        <span className="dtv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
