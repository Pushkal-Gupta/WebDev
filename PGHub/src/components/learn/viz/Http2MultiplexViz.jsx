import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Send, Plus, Minus, Network, Layers,
  Clock, TimerReset, Hash, ArrowRight,
} from 'lucide-react';
import './Http2MultiplexViz.css';

// HTTP/1.1 head-of-line blocking VS HTTP/2 multiplexing, side by side on one
// timeline. In HTTP/1.1 the N requests serialize over one connection: request 2
// cannot begin until request 1's response fully returns, so the wall clock is
// the SUM of every request duration. In HTTP/2 every request opens a stream
// (odd ids 1,3,5,... for client-initiated) and the frames interleave over a
// single connection, so all N are in flight at once and the wall clock is the
// SLOWEST request, not the sum. A cursor sweeps the timeline as it plays and we
// read out the time each mode spends plus the multiplexing time saved.

const HUES = ['--hue-violet', '--hue-sky', '--hue-pink', '--hue-mint'];
const MIN_REQ = 3;
const MAX_REQ = 7;
const TICK_MS = 90;            // base wall-clock tick; divided by speed
const FRAME_TICKS = 3;         // interleave frame marker every N timeline units

// Per-request duration in abstract "time units". Deterministic, varied so the
// serial-vs-parallel gap is obvious (the slow one dominates HTTP/2's clock).
const DURATIONS = [8, 14, 6, 11, 9, 16, 7];

function streamId(i) {
  return i * 2 + 1;            // client-initiated streams: 1, 3, 5, 7, ...
}

// Build the per-request layout for both modes.
// HTTP/1.1: each request starts where the previous finished (serial).
// HTTP/2: every request starts at 0, all overlap (parallel lanes).
function buildPlan(n) {
  const count = Math.max(1, n);
  const durations = Array.from({ length: count }, (_, i) => DURATIONS[i % DURATIONS.length]);

  let cursor = 0;
  const serial = durations.map((d, i) => {
    const start = cursor;
    cursor += d;
    return { i, start, end: cursor, dur: d, hue: HUES[i % HUES.length], sid: streamId(i) };
  });
  const serialTotal = cursor;

  const parallel = durations.map((d, i) => ({
    i, start: 0, end: d, dur: d, hue: HUES[i % HUES.length], sid: streamId(i),
  }));
  const parallelTotal = parallel.reduce((m, r) => Math.max(m, r.end), 0);

  return { count, durations, serial, serialTotal, parallel, parallelTotal };
}

export default function Http2MultiplexViz() {
  const [http2, setHttp2] = useState(true);
  const [reqCount, setReqCount] = useState(4);
  const [speed, setSpeed] = useState(1.5);
  const [isRunning, setIsRunning] = useState(false);
  const [clock, setClock] = useState(0);

  const runTimer = useRef(null);

  const plan = useMemo(() => buildPlan(reqCount), [reqCount]);
  const bars = http2 ? plan.parallel : plan.serial;
  const total = http2 ? plan.parallelTotal : plan.serialTotal;
  const safeTotal = total > 0 ? total : 1;
  const delay = useMemo(() => Math.max(16, Math.round(TICK_MS / speed)), [speed]);

  const done = clock >= total;

  useEffect(() => {
    if (!isRunning || done) return undefined;
    runTimer.current = setInterval(() => {
      setClock((c) => Math.min(c + 1, total));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearInterval(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, done, delay, total]);

  useEffect(() => {
    if (done && runTimer.current) {
      clearInterval(runTimer.current);
      runTimer.current = null;
    }
  }, [done]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
  }, []);

  const resetClock = () => {
    setIsRunning(false);
    setClock(0);
  };

  const toggleMode = () => {
    setIsRunning(false);
    setClock(0);
    setHttp2((v) => !v);
  };

  const changeCount = (next) => {
    const clamped = Math.max(MIN_REQ, Math.min(MAX_REQ, next));
    setIsRunning(false);
    setClock(0);
    setReqCount(clamped);
  };

  const play = () => {
    if (done) setClock(0);
    setIsRunning((v) => !v);
  };

  // Derived readouts. parallel clock is bounded by the slowest single request.
  const saved = Math.max(0, plan.serialTotal - plan.parallelTotal);
  const speedup = plan.parallelTotal > 0 ? plan.serialTotal / plan.parallelTotal : 0;
  const inFlight = bars.filter((b) => clock > b.start && clock < b.end).length;
  const finished = bars.filter((b) => clock >= b.end).length;

  // SVG geometry — a timeline track with one row per request lane.
  const W = 960;
  const labelW = 118;
  const trackX = labelW + 14;
  const trackRight = W - 70;     // room for duration tag
  const trackW = trackRight - trackX;
  const rowH = 34;
  const rowGap = 10;
  const topPad = 34;
  const botPad = 30;
  const H = topPad + plan.count * (rowH + rowGap) - rowGap + botPad;

  const xAt = (t) => trackX + (t / safeTotal) * trackW;
  const cursorX = xAt(clock);

  // interleave frame markers along the timeline (HTTP/2 only) — small ticks at
  // every FRAME_TICKS units, on each in-flight lane, to show frames overlapping.
  const frameTimes = [];
  for (let t = FRAME_TICKS; t < total; t += FRAME_TICKS) frameTimes.push(t);

  const modeLabel = http2 ? 'HTTP/2 multiplexing' : 'HTTP/1.1 serial';

  return (
    <div className="h2v">
      <div className="h2v-head">
        <h3 className="h2v-title">
          HTTP/1.1 head-of-line blocking vs HTTP/2 multiplexing
        </h3>
        <p className="h2v-sub">
          The same {plan.count} requests over one connection. In HTTP/1.1 they queue end to end —
          request 2 waits for request 1. In HTTP/2 each gets a stream id and the frames interleave,
          so the wall clock drops to the slowest single request.
        </p>
      </div>

      <div className="h2v-controls">
        <button
          type="button"
          className={`h2v-toggle ${http2 ? 'is-on' : ''}`}
          onClick={toggleMode}
          aria-pressed={http2}
          title="Switch between HTTP/1.1 serial and HTTP/2 multiplexed"
        >
          <Network size={14} /> {http2 ? 'HTTP/2' : 'HTTP/1.1'}
        </button>

        <div className="h2v-stepper" role="group" aria-label="Request count">
          <span className="h2v-input-label">requests</span>
          <button
            type="button"
            className="h2v-step-btn"
            onClick={() => changeCount(reqCount - 1)}
            disabled={reqCount <= MIN_REQ}
            aria-label="Fewer requests"
          >
            <Minus size={13} />
          </button>
          <input
            type="range"
            min={MIN_REQ}
            max={MAX_REQ}
            step={1}
            value={reqCount}
            onChange={(e) => changeCount(Number(e.target.value))}
            className="h2v-range"
            aria-label="Number of requests"
          />
          <button
            type="button"
            className="h2v-step-btn"
            onClick={() => changeCount(reqCount + 1)}
            disabled={reqCount >= MAX_REQ}
            aria-label="More requests"
          >
            <Plus size={13} />
          </button>
          <span className="h2v-range-value">{reqCount}</span>
        </div>

        <label className="h2v-speed">
          <span className="h2v-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h2v-range"
            aria-label="Playback speed"
          />
          <span className="h2v-range-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="h2v-spacer" aria-hidden="true" />

        <div className="h2v-buttons">
          <button type="button" className="h2v-btn h2v-btn-primary" onClick={play}>
            {isRunning && !done ? <Pause size={14} /> : <Play size={14} />}
            {isRunning && !done ? 'Pause' : (done ? 'Replay' : 'Send requests')}
          </button>
          <button type="button" className="h2v-btn" onClick={resetClock}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="h2v-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="h2v-svg" preserveAspectRatio="xMidYMid meet">
          {/* connection label */}
          <text className="h2v-conn-label" x={trackX} y={18} textAnchor="start">
            {http2
              ? 'one TCP connection — streams interleave, all in flight at once'
              : 'one TCP connection — requests serialize, one in flight at a time'}
          </text>
          <text className="h2v-clock-label" x={trackRight} y={18} textAnchor="end">
            {`t = ${clock} / ${total}`}
          </text>

          {/* baseline track */}
          <line
            className="h2v-axis"
            x1={trackX}
            y1={topPad - 6}
            x2={trackRight}
            y2={topPad - 6}
          />

          {/* HTTP/2 interleave frame ticks across in-flight lanes */}
          {http2 && frameTimes.map((t) => {
            const fx = xAt(t);
            return bars.map((b) => {
              if (t <= b.start || t >= b.end) return null;
              const y = topPad + b.i * (rowH + rowGap);
              return (
                <line
                  key={`frame-${b.i}-${t}`}
                  className={`h2v-frame ${clock >= t ? 'is-sent' : ''}`}
                  x1={fx}
                  y1={y + 6}
                  x2={fx}
                  y2={y + rowH - 6}
                  style={{ '--h2v-hue': `var(${b.hue})` }}
                />
              );
            });
          })}

          {bars.map((b) => {
            const y = topPad + b.i * (rowH + rowGap);
            const x0 = xAt(b.start);
            const x1Full = xAt(b.end);
            const progressed = Math.max(0, Math.min(clock, b.end) - b.start);
            const fillW = (progressed / safeTotal) * trackW;
            const isInFlight = clock > b.start && clock < b.end;
            const isDone = clock >= b.end;
            // HTTP/1.1: a request that has not started yet is HOL-blocked behind
            // the one currently in flight.
            const isBlocked = !http2 && clock < b.start && clock > 0;
            return (
              <g key={`bar-${b.i}`}>
                {/* lane label: request + stream id */}
                <text className="h2v-lane-req" x={0} y={y + rowH / 2 - 3}>
                  {`req ${b.i + 1}`}
                </text>
                <text
                  className={`h2v-lane-sid ${http2 ? 'is-on' : 'is-off'}`}
                  x={0}
                  y={y + rowH / 2 + 11}
                >
                  {http2 ? `stream ${b.sid}` : 'no stream id'}
                </text>

                {/* full duration track (planned span) */}
                <rect
                  className={`h2v-track ${isBlocked ? 'is-blocked' : ''}`}
                  x={x0}
                  y={y}
                  width={Math.max(2, x1Full - x0)}
                  height={rowH}
                  rx={6}
                  style={{ '--h2v-hue': `var(${b.hue})` }}
                />
                {/* progressed fill */}
                <rect
                  className={`h2v-fill ${isInFlight ? 'is-live' : ''} ${isDone ? 'is-done' : ''}`}
                  x={x0}
                  y={y}
                  width={Math.max(0, fillW)}
                  height={rowH}
                  rx={6}
                  style={{ '--h2v-hue': `var(${b.hue})` }}
                />
                {/* duration tag */}
                <text
                  className={`h2v-dur ${isDone ? 'is-done' : ''}`}
                  x={trackRight + 8}
                  y={y + rowH / 2 + 4}
                  textAnchor="start"
                >
                  {`${b.dur}u`}
                </text>

                {isBlocked && (
                  <text className="h2v-blocked-tag" x={(x0 + x1Full) / 2} y={y + rowH / 2 + 4} textAnchor="middle">
                    waiting
                  </text>
                )}
              </g>
            );
          })}

          {/* sweeping cursor */}
          <line
            className="h2v-cursor"
            x1={cursorX}
            y1={topPad - 12}
            x2={cursorX}
            y2={H - botPad + 6}
          />
          <text className="h2v-cursor-cap" x={cursorX} y={topPad - 16} textAnchor="middle">
            {modeLabel}
          </text>

          {/* total markers along the bottom */}
          <text className="h2v-total-mark" x={xAt(plan.serialTotal)} y={H - 8} textAnchor="middle">
            {`HTTP/1.1 = ${plan.serialTotal}u`}
          </text>
          {!http2 && (
            <line
              className="h2v-total-line is-serial"
              x1={xAt(plan.serialTotal)}
              y1={topPad - 6}
              x2={xAt(plan.serialTotal)}
              y2={H - botPad + 2}
            />
          )}
          {http2 && (
            <>
              <line
                className="h2v-total-line is-mux"
                x1={xAt(plan.parallelTotal)}
                y1={topPad - 6}
                x2={xAt(plan.parallelTotal)}
                y2={H - botPad + 2}
              />
              <text className="h2v-total-mark is-mux" x={xAt(plan.parallelTotal)} y={H - 8} textAnchor="middle">
                {`HTTP/2 = ${plan.parallelTotal}u`}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="h2v-metrics">
        <div className="h2v-metric">
          <span className="h2v-metric-label">mode</span>
          <span className={`h2v-metric-value ${http2 ? 'is-ok' : 'is-warn'}`}>
            {http2 ? 'HTTP/2 mux' : 'HTTP/1.1 serial'}
          </span>
        </div>
        <div className="h2v-metric">
          <span className="h2v-metric-label">{http2 ? 'streams' : 'requests'}</span>
          <span className="h2v-metric-value">{plan.count}</span>
        </div>
        <div className="h2v-metric">
          <span className="h2v-metric-label">HTTP/1.1 wall clock</span>
          <span className="h2v-metric-value is-warn">{`${plan.serialTotal}u`}</span>
        </div>
        <div className="h2v-metric">
          <span className="h2v-metric-label">HTTP/2 wall clock</span>
          <span className="h2v-metric-value is-ok">{`${plan.parallelTotal}u`}</span>
        </div>
        <div className="h2v-metric h2v-metric-dim">
          <span className="h2v-metric-label">time saved by mux</span>
          <span className="h2v-metric-value is-accent">
            {`${saved}u · ${speedup.toFixed(2)}× faster`}
          </span>
        </div>
        <div className="h2v-metric h2v-metric-dim">
          <span className="h2v-metric-label">{http2 ? 'in flight now' : 'sent / waiting'}</span>
          <span className="h2v-metric-value">
            {http2
              ? `${inFlight} / ${plan.count} streams`
              : `${finished} done · ${Math.max(0, plan.count - finished)} queued`}
          </span>
        </div>
      </div>

      <div className={`h2v-narration ${http2 ? 'is-ok' : 'is-warn'}`}>
        <span className={`h2v-narration-label ${http2 ? 'is-ok' : 'is-warn'}`}>
          {http2 ? 'multiplexed' : 'head-of-line'}
        </span>
        <span className="h2v-narration-body">
          {http2
            ? `Every request opens a client-initiated stream (odd ids ${plan.parallel
                .map((b) => b.sid).join(', ')}). Their frames interleave on one connection, so all ${plan.count} run concurrently and the wall clock is the slowest single request (${plan.parallelTotal}u), not the sum.`
            : `Requests run one at a time on the single connection. Request 2 cannot start until request 1's response fully returns — that is head-of-line blocking. The wall clock is the sum of every request (${plan.serialTotal}u), so the queue keeps the slow ones waiting.`}
        </span>
      </div>

      <div className="h2v-legend">
        <span className="h2v-legend-item"><Layers size={13} className="h2v-ic is-ok" /> HTTP/2: streams interleave, all in flight</span>
        <span className="h2v-legend-item"><Clock size={13} className="h2v-ic is-warn" /> HTTP/1.1: serial queue, sum of durations</span>
        <span className="h2v-legend-item"><Hash size={13} className="h2v-ic" /> stream ids 1, 3, 5, ... are client-initiated (odd)</span>
        <span className="h2v-legend-item"><TimerReset size={13} className="h2v-ic is-accent" /> time saved = serial − multiplexed</span>
        <span className="h2v-legend-item"><Send size={13} className="h2v-ic" /> frame ticks = interleaved DATA frames</span>
        <span className="h2v-legend-item"><ArrowRight size={13} className="h2v-ic" /> cursor sweeps the wall clock</span>
      </div>
    </div>
  );
}
