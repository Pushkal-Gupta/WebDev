import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Gauge, AlertTriangle } from 'lucide-react';
import './BackpressureStreamsViz.css';

const N_TICKS = 34;

function buildFrames(produceRate, consumeRate, capacity, backpressure) {
  const frames = [];
  let buffer = 0;
  let dropped = 0;
  let delivered = 0;
  const history = [];

  const snap = (extra) => ({
    buffer,
    dropped,
    delivered,
    capacity,
    history: history.slice(),
    tick: 0,
    drainedNow: 0,
    addedNow: 0,
    droppedNow: 0,
    requested: 0,
    full: false,
    producerState: 'running',
    ...extra,
  });

  frames.push(snap({
    tick: 0,
    note: backpressure
      ? `Backpressure ON. Producer wants ${produceRate}/tick, consumer drains ${consumeRate}/tick, buffer holds ${capacity}. When the buffer fills, the producer is signaled to throttle — surplus items are never produced, nothing is lost.`
      : `Backpressure OFF. Producer pushes ${produceRate}/tick regardless, consumer drains ${consumeRate}/tick, buffer holds ${capacity}. When the buffer overflows, surplus items are dropped on the floor.`,
  }));

  for (let tick = 1; tick <= N_TICKS; tick += 1) {
    const drained = Math.min(consumeRate, buffer);
    buffer -= drained;
    delivered += drained;

    const free = capacity - buffer;
    let added = 0;
    let droppedNow = 0;
    let producerState = 'running';

    if (produceRate <= free) {
      added = produceRate;
      buffer += added;
    } else if (backpressure) {
      added = free;
      buffer += added;
      producerState = 'paused';
    } else {
      added = free;
      buffer += added;
      droppedNow = produceRate - free;
      dropped += droppedNow;
    }

    const full = buffer >= capacity;
    history.push(delivered);
    if (history.length > 24) history.shift();

    let note;
    if (producerState === 'paused') {
      note = `Tick ${tick}: consumer drained ${drained}, freeing space. Buffer full at ${buffer}/${capacity} — backpressure signal sent upstream, producer throttles from ${produceRate} to ${added}. No items lost. Delivered ${delivered} total.`;
    } else if (droppedNow > 0) {
      note = `Tick ${tick}: consumer drained ${drained}. Producer pushed ${produceRate} but only ${added} fit — ${droppedNow} OVERFLOW items dropped. Buffer ${buffer}/${capacity}. Lost ${dropped} so far, delivered ${delivered}.`;
    } else {
      note = `Tick ${tick}: consumer drained ${drained}, producer added ${added}. Buffer ${buffer}/${capacity}, flowing freely. Delivered ${delivered} total.`;
    }

    frames.push(snap({
      tick,
      drainedNow: drained,
      addedNow: added,
      droppedNow,
      requested: produceRate,
      full,
      producerState,
      note,
    }));
  }

  frames.push(snap({
    tick: N_TICKS,
    note: backpressure
      ? `Done. ${delivered} items delivered, 0 dropped. Backpressure kept the producer matched to the consumer's ${consumeRate}/tick — the fast producer slowed to a sustainable rate and the buffer never overflowed.`
      : `Done. ${delivered} delivered but ${dropped} dropped. Without backpressure the ${produceRate}/tick producer outran the ${consumeRate}/tick consumer; every overflow item was silently lost.`,
  }));

  return frames;
}

export default function BackpressureStreamsViz() {
  const [produceRate, setProduceRate] = useState(4);
  const [consumeRate, setConsumeRate] = useState(2);
  const [capacity, setCapacity] = useState(6);
  const [backpressure, setBackpressure] = useState(true);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => buildFrames(produceRate, consumeRate, capacity, backpressure),
    [produceRate, consumeRate, capacity, backpressure],
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

  const changeParam = (setter, value, lo, hi) => {
    const next = Math.max(lo, Math.min(hi, value));
    setIsRunning(false);
    setStep(0);
    setter(next);
  };

  const toggleBackpressure = () => {
    setIsRunning(false);
    setStep(0);
    setBackpressure((v) => !v);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const W = 940;
  const H = 380;
  const prodX = 70;
  const prodY = 120;
  const boxW = 150;
  const boxH = 110;
  const consX = W - 70 - boxW;
  const consY = 120;

  const bufX = prodX + boxW + 90;
  const bufRight = consX - 90;
  const bufW = bufRight - bufX;
  const slotGap = 6;
  const slotW = (bufW - slotGap * (capacity - 1)) / capacity;
  const slotH = 64;
  const bufY = prodY + (boxH - slotH) / 2;

  const full = current.full;
  const paused = current.producerState === 'paused';
  const showSignal = backpressure && full;

  const sparkY = 300;
  const sparkH = 50;
  const sparkX = bufX;
  const sparkW = bufW;
  const maxDelivered = Math.max(1, ...current.history);
  const sparkPts = current.history.map((d, i) => {
    const n = current.history.length;
    const x = n <= 1 ? sparkX : sparkX + (i / (n - 1)) * sparkW;
    const y = sparkY + sparkH - (d / maxDelivered) * sparkH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="bsv">
      <div className="bsv-head">
        <h3 className="bsv-title">Backpressure — a fast producer, a slow consumer, a bounded buffer</h3>
        <p className="bsv-sub">
          Step the stream tick by tick. The consumer drains the buffer slowly while the producer pushes fast.
          With backpressure the producer throttles to match; without it, the full buffer overflows and items are dropped.
        </p>
      </div>

      <div className="bsv-controls">
        <button
          type="button"
          className={`bsv-toggle ${backpressure ? 'is-on' : 'is-off'}`}
          onClick={toggleBackpressure}
          aria-pressed={backpressure}
        >
          <Gauge size={14} />
          backpressure {backpressure ? 'ON' : 'OFF'}
        </button>

        <label className="bsv-slider">
          <span className="bsv-input-label">produce /tick</span>
          <input
            type="range" min={1} max={8} step={1} value={produceRate}
            onChange={(e) => changeParam(setProduceRate, Number(e.target.value), 1, 8)}
            className="bsv-range" aria-label="Producer rate per tick"
          />
          <span className="bsv-slider-val">{produceRate}</span>
        </label>

        <label className="bsv-slider">
          <span className="bsv-input-label">consume /tick</span>
          <input
            type="range" min={1} max={8} step={1} value={consumeRate}
            onChange={(e) => changeParam(setConsumeRate, Number(e.target.value), 1, 8)}
            className="bsv-range" aria-label="Consumer rate per tick"
          />
          <span className="bsv-slider-val">{consumeRate}</span>
        </label>

        <label className="bsv-slider">
          <span className="bsv-input-label">capacity</span>
          <input
            type="range" min={2} max={12} step={1} value={capacity}
            onChange={(e) => changeParam(setCapacity, Number(e.target.value), 2, 12)}
            className="bsv-range" aria-label="Buffer capacity"
          />
          <span className="bsv-slider-val">{capacity}</span>
        </label>

        <label className="bsv-slider">
          <span className="bsv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bsv-range" aria-label="Playback speed"
          />
          <span className="bsv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="bsv-spacer" aria-hidden="true" />

        <div className="bsv-buttons">
          <button
            type="button"
            className="bsv-btn bsv-btn-primary"
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
            className="bsv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="bsv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="bsv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="bsv-stepcount">
          tick <strong>{current.tick}</strong> / {N_TICKS}
        </div>
      </div>

      <div className="bsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bsv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="bsv-row-label" x={20} y={28}>fast producer -&gt; bounded buffer -&gt; slow consumer</text>

          {/* producer */}
          <rect
            className={`bsv-node bsv-producer ${paused ? 'is-paused' : ''}`}
            x={prodX} y={prodY} width={boxW} height={boxH} rx={10}
          />
          <text className="bsv-node-title" x={prodX + boxW / 2} y={prodY + 30}>PRODUCER</text>
          <text className="bsv-node-rate" x={prodX + boxW / 2} y={prodY + 56}>
            {paused ? `throttled -> ${current.addedNow}` : `+${current.requested || produceRate}/tick`}
          </text>
          <text className={`bsv-node-state ${paused ? 'is-paused' : 'is-run'}`} x={prodX + boxW / 2} y={prodY + 82}>
            {paused ? 'paused (backpressure)' : 'running'}
          </text>

          {/* producer -> buffer arrow */}
          <line className="bsv-flow" x1={prodX + boxW} y1={prodY + boxH / 2} x2={bufX - 10} y2={bufY + slotH / 2} />
          <path className="bsv-flow-head" d={`M ${bufX - 10} ${bufY + slotH / 2} l -10 -5 l 0 10 z`} />

          {/* backpressure signal arrow (buffer -> producer) */}
          {showSignal && (
            <g>
              <path
                className="bsv-signal"
                d={`M ${bufX - 6} ${bufY - 14} C ${(bufX + prodX + boxW) / 2} ${bufY - 50}, ${prodX + boxW + 10} ${prodY - 6}, ${prodX + boxW} ${prodY + 14}`}
              />
              <path className="bsv-signal-head" d={`M ${prodX + boxW} ${prodY + 14} l 11 -2 l -6 -9 z`} />
              <text className="bsv-signal-label" x={(bufX + prodX + boxW) / 2} y={bufY - 40} textAnchor="middle">slow down</text>
            </g>
          )}

          {/* buffer container */}
          <rect
            className={`bsv-buffer ${full ? (backpressure ? 'is-bp' : 'is-overflow') : ''}`}
            x={bufX - 8} y={bufY - 8} width={bufW + 16} height={slotH + 16} rx={8}
          />
          <text className="bsv-buffer-cap" x={bufX + bufW / 2} y={bufY - 18}>
            buffer {current.buffer}/{capacity}
          </text>

          {Array.from({ length: capacity }).map((_, i) => {
            const x = bufX + i * (slotW + slotGap);
            const filled = i < current.buffer;
            return (
              <rect
                key={`slot-${i}`}
                className={`bsv-slot ${filled ? 'is-filled' : ''}`}
                x={x} y={bufY} width={slotW} height={slotH} rx={4}
              />
            );
          })}

          {/* overflow badge */}
          {current.droppedNow > 0 && (
            <text className="bsv-overflow-badge" x={bufX + bufW / 2} y={bufY + slotH + 30}>
              dropped {current.droppedNow}
            </text>
          )}

          {/* buffer -> consumer arrow */}
          <line className="bsv-flow" x1={bufX + bufW + 10} y1={bufY + slotH / 2} x2={consX} y2={consY + boxH / 2} />
          <path className="bsv-flow-head" d={`M ${consX} ${consY + boxH / 2} l -10 -5 l 0 10 z`} />

          {/* consumer */}
          <rect className="bsv-node bsv-consumer" x={consX} y={consY} width={boxW} height={boxH} rx={10} />
          <text className="bsv-node-title" x={consX + boxW / 2} y={consY + 30}>CONSUMER</text>
          <text className="bsv-node-rate" x={consX + boxW / 2} y={consY + 56}>-{current.drainedNow || consumeRate}/tick</text>
          <text className="bsv-node-state is-run" x={consX + boxW / 2} y={consY + 82}>draining</text>

          {/* throughput sparkline */}
          <text className="bsv-spark-label" x={sparkX} y={sparkY - 8}>cumulative throughput delivered</text>
          <rect className="bsv-spark-frame" x={sparkX} y={sparkY} width={sparkW} height={sparkH} rx={6} />
          {current.history.length > 1 && (
            <polyline className="bsv-spark-line" points={sparkPts} />
          )}
          {current.history.length > 0 && (
            <text className="bsv-spark-val" x={sparkX + sparkW + 12} y={sparkY + sparkH / 2 + 5}>{current.delivered}</text>
          )}
        </svg>
      </div>

      <div className="bsv-metrics">
        <div className="bsv-metric">
          <span className="bsv-metric-label">mode</span>
          <span className="bsv-metric-value">{backpressure ? 'backpressure' : 'unbounded'}</span>
        </div>
        <div className="bsv-metric">
          <span className="bsv-metric-label">buffer</span>
          <span className={`bsv-metric-value ${full ? (backpressure ? 'is-bp' : 'is-drop') : ''}`}>
            {current.buffer} / {capacity}
          </span>
        </div>
        <div className="bsv-metric">
          <span className="bsv-metric-label">producer</span>
          <span className={`bsv-metric-value ${paused ? 'is-bp' : 'is-ok'}`}>
            {paused ? 'paused' : 'running'}
          </span>
        </div>
        <div className="bsv-metric">
          <span className="bsv-metric-label">delivered</span>
          <span className="bsv-metric-value is-ok">{current.delivered}</span>
        </div>
        <div className="bsv-metric">
          <span className="bsv-metric-label">dropped</span>
          <span className="bsv-metric-value is-drop">
            {current.dropped > 0 && <AlertTriangle size={12} />}
            {current.dropped}
          </span>
        </div>
      </div>

      <div className="bsv-narration">
        <span className="bsv-narration-label">trace</span>
        <span className="bsv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
