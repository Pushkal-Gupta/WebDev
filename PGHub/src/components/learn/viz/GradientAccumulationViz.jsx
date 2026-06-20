import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ArrowDownToLine, Layers } from 'lucide-react';
import './GradientAccumulationViz.css';

const SEED_GRADS = [1.4, 0.8, 1.9, 0.5, 1.2, 1.7, 0.9, 1.3];

function microGrad(i) {
  return SEED_GRADS[i % SEED_GRADS.length];
}

function buildFrames(K, microSize) {
  const frames = [];
  const grads = Array.from({ length: K }, (_, i) => microGrad(i));
  const total = grads.reduce((a, b) => a + b, 0);
  const avg = total / K;
  const effBatch = K * microSize;
  const accPeak = microSize;
  const bigPeak = K * microSize;

  const snap = (extra) => ({
    K,
    microSize,
    effBatch,
    accPeak,
    bigPeak,
    grads,
    filled: 0,
    accum: 0,
    avg,
    cur: -1,
    phase: 'idle',
    updated: false,
    ...extra,
  });

  frames.push(snap({
    phase: 'idle',
    note: `Goal: an effective batch of ${effBatch} on memory that fits only ${microSize} samples. Split into ${K} micro-batches, sum their gradients into one buffer, and apply a single optimizer step at the end.`,
  }));

  let accum = 0;
  for (let i = 0; i < K; i += 1) {
    accum += grads[i];
    frames.push(snap({
      phase: 'accumulate',
      cur: i,
      filled: i + 1,
      accum,
      note: `Micro-batch ${i + 1} / ${K}: forward + backward on ${microSize} samples gives gradient ${grads[i].toFixed(2)}. Add to buffer -> running sum ${accum.toFixed(2)}. No weight update yet; activations for this micro-batch are freed before the next.`,
    }));
  }

  frames.push(snap({
    phase: 'ready',
    cur: K - 1,
    filled: K,
    accum,
    note: `All ${K} micro-batches processed. Buffer holds the summed gradient ${accum.toFixed(2)} (average ${avg.toFixed(2)}). Now — and only now — the optimizer fires.`,
  }));

  frames.push(snap({
    phase: 'update',
    cur: K - 1,
    filled: K,
    accum,
    updated: true,
    note: `Single optimizer step using the accumulated gradient, then zero the buffer. This matches one step on a real batch of ${effBatch}, yet peak memory stayed at ${accPeak} samples vs ${bigPeak} for the big-batch path.`,
  }));

  return frames;
}

export default function GradientAccumulationViz() {
  const [K, setK] = useState(4);
  const [microSize, setMicroSize] = useState(8);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(K, microSize), [K, microSize]);
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

  const W = 940;
  const H = 380;

  const sumMax = current.grads.reduce((a, b) => a + b, 0) || 1;

  const boxTop = 70;
  const boxGap = 8;
  const boxAreaLeft = 50;
  const boxAreaRight = 360;
  const boxAreaW = boxAreaRight - boxAreaLeft;
  const boxW = Math.min(64, (boxAreaW - (K - 1) * boxGap) / K);
  const boxH = 56;
  const boxStride = boxW + boxGap;

  const bufX = 470;
  const bufY = boxTop;
  const bufW = 120;
  const bufH = 190;
  const fillFrac = current.accum / sumMax;
  const fillH = bufH * Math.min(1, fillFrac);

  const memX = 700;
  const memTop = boxTop;
  const memBarW = 70;
  const memBarH = 150;
  const memMax = current.bigPeak || 1;
  const accMemH = memBarH * (current.accPeak / memMax);
  const bigMemH = memBarH * (current.bigPeak / memMax);
  const memBaseY = memTop + memBarH;

  return (
    <div className="gav">
      <div className="gav-head">
        <h3 className="gav-title">Gradient accumulation — a big effective batch on small memory</h3>
        <p className="gav-sub">
          Sum gradients from K micro-batches into one buffer, then take a single optimizer step. Same averaged
          gradient as one large batch, at a fraction of the peak memory.
        </p>
      </div>

      <div className="gav-controls">
        <label className="gav-slider">
          <span className="gav-input-label">micro-batches K</span>
          <input
            type="range" min={2} max={8} step={1} value={K}
            onChange={(e) => changeParam(setK, Number(e.target.value), 2, 8)}
            className="gav-range" aria-label="Number of micro-batches"
          />
          <span className="gav-slider-val">{K}</span>
        </label>
        <label className="gav-slider">
          <span className="gav-input-label">micro size</span>
          <input
            type="range" min={2} max={32} step={2} value={microSize}
            onChange={(e) => changeParam(setMicroSize, Number(e.target.value), 2, 32)}
            className="gav-range" aria-label="Micro-batch size"
          />
          <span className="gav-slider-val">{microSize}</span>
        </label>
        <label className="gav-slider">
          <span className="gav-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="gav-range" aria-label="Playback speed"
          />
          <span className="gav-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="gav-spacer" aria-hidden="true" />

        <div className="gav-buttons">
          <button
            type="button"
            className="gav-btn gav-btn-primary"
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
            className="gav-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="gav-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="gav-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="gav-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="gav-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gav-svg" preserveAspectRatio="xMidYMid meet">
          <text className="gav-row-label" x={boxAreaLeft} y={44}>micro-batches (one in memory at a time)</text>

          {current.grads.map((g, i) => {
            const x = boxAreaLeft + i * boxStride;
            const isCur = current.cur === i && current.phase === 'accumulate';
            const done = i < current.filled && !(current.cur === i && current.phase === 'accumulate');
            const cls = [
              'gav-mb',
              isCur && 'is-active',
              done && 'is-done',
            ].filter(Boolean).join(' ');
            return (
              <g key={`mb-${i}`}>
                <rect className={cls} x={x} y={boxTop} width={boxW} height={boxH} rx={6} />
                <text className="gav-mb-idx" x={x + boxW / 2} y={boxTop + 20}>{i + 1}</text>
                <text className="gav-mb-grad" x={x + boxW / 2} y={boxTop + 42}>g={g.toFixed(2)}</text>
                {isCur && (
                  <path
                    className="gav-flow"
                    d={`M ${x + boxW / 2} ${boxTop + boxH + 4} L ${x + boxW / 2} ${boxTop + boxH + 26}`}
                  />
                )}
              </g>
            );
          })}

          <g className="gav-feed" transform={`translate(${boxAreaRight + 20}, ${bufY + bufH / 2})`}>
            <ArrowDownToLine size={22} x={-11} y={-11} className="gav-feed-icon" />
          </g>

          <text className="gav-row-label" x={bufX} y={44}>gradient buffer (running sum)</text>
          <rect className="gav-buf" x={bufX} y={bufY} width={bufW} height={bufH} rx={8} />
          <rect
            className={`gav-buf-fill ${current.updated ? 'is-flushed' : ''}`}
            x={bufX + 3}
            y={bufY + bufH - (current.updated ? 0 : fillH)}
            width={bufW - 6}
            height={current.updated ? 0 : Math.max(0, fillH)}
            rx={5}
          />
          <text className="gav-buf-val" x={bufX + bufW / 2} y={bufY + bufH / 2}>
            {current.updated ? '0.00' : current.accum.toFixed(2)}
          </text>
          <text className="gav-buf-unit" x={bufX + bufW / 2} y={bufY + bufH / 2 + 22}>
            {current.updated ? 'zeroed' : 'sum of g'}
          </text>

          <g transform={`translate(${bufX + bufW / 2}, ${bufY + bufH + 34})`}>
            <rect
              className={`gav-step-box ${current.phase === 'update' ? 'is-firing' : ''}`}
              x={-72} y={-18} width={144} height={40} rx={8}
            />
            <Layers size={16} x={-62} y={-9} className={`gav-step-icon ${current.phase === 'update' ? 'is-firing' : ''}`} />
            <text className={`gav-step-text ${current.phase === 'update' ? 'is-firing' : ''}`} x={6} y={6}>
              {current.phase === 'update' ? 'OPTIMIZER STEP' : 'no update'}
            </text>
          </g>

          <text className="gav-row-label" x={memX} y={44}>peak memory (samples)</text>
          <g>
            <rect className="gav-mem-track" x={memX} y={memTop} width={memBarW} height={memBarH} rx={5} />
            <rect
              className="gav-mem-acc"
              x={memX + 3}
              y={memBaseY - accMemH}
              width={memBarW - 6}
              height={Math.max(0, accMemH)}
              rx={4}
            />
            <text className="gav-mem-val" x={memX + memBarW / 2} y={memBaseY - accMemH - 8}>{current.accPeak}</text>
            <text className="gav-mem-cap" x={memX + memBarW / 2} y={memBaseY + 18}>accum</text>

            <rect className="gav-mem-track" x={memX + memBarW + 26} y={memTop} width={memBarW} height={memBarH} rx={5} />
            <rect
              className="gav-mem-big"
              x={memX + memBarW + 29}
              y={memBaseY - bigMemH}
              width={memBarW - 6}
              height={Math.max(0, bigMemH)}
              rx={4}
            />
            <text className="gav-mem-val" x={memX + memBarW + 26 + memBarW / 2} y={memBaseY - bigMemH - 8}>{current.bigPeak}</text>
            <text className="gav-mem-cap" x={memX + memBarW + 26 + memBarW / 2} y={memBaseY + 18}>big batch</text>
          </g>

          <text className="gav-same" x={memX + memBarW + 13} y={memBaseY + 48} textAnchor="middle">
            same gradient · {current.bigPeak / current.accPeak}× the memory
          </text>
        </svg>
      </div>

      <div className="gav-metrics">
        <div className="gav-metric">
          <span className="gav-metric-label">micro-batch</span>
          <span className="gav-metric-value">{Math.max(0, current.filled)} / {current.K}</span>
        </div>
        <div className="gav-metric">
          <span className="gav-metric-label">accum grad</span>
          <span className="gav-metric-value">{current.updated ? '0.00' : current.accum.toFixed(2)}</span>
        </div>
        <div className="gav-metric">
          <span className="gav-metric-label">effective batch</span>
          <span className="gav-metric-value is-hi">{current.effBatch}</span>
        </div>
        <div className="gav-metric">
          <span className="gav-metric-label">peak mem · accum</span>
          <span className="gav-metric-value is-good">{current.accPeak}</span>
        </div>
        <div className="gav-metric">
          <span className="gav-metric-label">peak mem · big</span>
          <span className="gav-metric-value is-bad">{current.bigPeak}</span>
        </div>
      </div>

      <div className="gav-narration">
        <span className="gav-narration-label">trace</span>
        <span className="gav-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
