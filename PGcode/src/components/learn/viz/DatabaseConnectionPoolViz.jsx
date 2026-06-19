import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Minus } from 'lucide-react';
import './DatabaseConnectionPoolViz.css';

// Deterministic LCG for request service durations — stable per request id.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Simulate a fixed-size pool over discrete ticks.
// Events: queued requests acquire a free connection (in arrival order); each
// in-use connection runs for `service` ticks then releases.
// Each request: { id, service }. We replay the whole timeline into frames.
function buildFrames(poolSize, requestCount) {
  const rand = lcg(2025 + poolSize * 7 + requestCount * 13);
  const requests = [];
  for (let i = 0; i < requestCount; i++) {
    requests.push({ id: i + 1, service: 2 + Math.floor(rand() * 3) }); // 2..4 ticks
  }

  const frames = [];
  // conns[i] = { reqId, remaining } | null
  const conns = Array.from({ length: poolSize }, () => null);
  const queue = requests.map((r) => r.id);
  const serviceOf = {};
  requests.forEach((r) => { serviceOf[r.id] = r.service; });
  const done = [];
  let totalWait = 0;
  let waitingTickAccum = 0;

  const snap = (note, justAcquired, justReleased) => {
    const inUse = conns.filter(Boolean).length;
    frames.push({
      conns: conns.map((c) => (c ? { ...c } : null)),
      queue: [...queue],
      done: [...done],
      inUse,
      idle: poolSize - inUse,
      queued: queue.length,
      totalWait,
      note,
      justAcquired: justAcquired ?? null,
      justReleased: justReleased ?? null,
    });
  };

  snap(`Pool of ${poolSize} connection(s). ${queue.length} request(s) waiting. Each tick, free connections pick up the next queued request; busy ones count down their service time.`);

  let tick = 0;
  const MAX_TICKS = 60;
  while ((queue.length > 0 || conns.some(Boolean)) && tick < MAX_TICKS) {
    tick += 1;

    // 1) Release finished connections.
    let released = null;
    for (let i = 0; i < poolSize; i++) {
      if (conns[i]) {
        conns[i].remaining -= 1;
        if (conns[i].remaining <= 0) {
          released = conns[i].reqId;
          done.push(conns[i].reqId);
          conns[i] = null;
        }
      }
    }

    // accumulate wait for everyone still queued this tick
    waitingTickAccum += queue.length;

    // 2) Acquire: free connections take the head of the queue.
    let acquired = null;
    for (let i = 0; i < poolSize && queue.length > 0; i++) {
      if (!conns[i]) {
        const reqId = queue.shift();
        conns[i] = { reqId, remaining: serviceOf[reqId] };
        if (acquired === null) acquired = reqId;
        totalWait = waitingTickAccum;
      }
    }

    let note;
    if (acquired !== null && released !== null) {
      note = `tick ${tick}: req#${released} released its connection; req#${acquired} acquired one. ${queue.length} still queued.`;
    } else if (acquired !== null) {
      note = `tick ${tick}: req#${acquired} acquired a free connection. ${queue.length} still waiting in the queue.`;
    } else if (released !== null) {
      note = `tick ${tick}: req#${released} finished and released its connection. ${queue.length ? `${queue.length} queued can now be served.` : 'Queue empty.'}`;
    } else if (queue.length > 0) {
      note = `tick ${tick}: pool exhausted (${poolSize}/${poolSize} busy) — ${queue.length} request(s) blocked, waiting for a release.`;
    } else {
      note = `tick ${tick}: connections busy, no one waiting.`;
    }
    snap(note, acquired, released);
  }

  const lastInUse = conns.filter(Boolean).length;
  frames.push({
    conns: conns.map((c) => (c ? { ...c } : null)),
    queue: [...queue],
    done: [...done],
    inUse: lastInUse,
    idle: poolSize - lastInUse,
    queued: queue.length,
    totalWait,
    note: `Done in ${tick} tick(s). All ${requestCount} request(s) served. Total accumulated wait across queued requests: ${totalWait} request-ticks — shrink it by enlarging the pool.`,
    justAcquired: null,
    justReleased: null,
  });

  return frames;
}

export default function DatabaseConnectionPoolViz() {
  const [poolSize, setPoolSize] = useState(3);
  const [requestCount, setRequestCount] = useState(8);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(poolSize, requestCount), [poolSize, requestCount]);
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

  const changePool = (delta) => {
    const next = Math.max(1, Math.min(6, poolSize + delta));
    if (next === poolSize) return;
    setIsRunning(false);
    setPoolSize(next);
    setStep(0);
  };

  const changeReqs = (delta) => {
    const next = Math.max(1, Math.min(14, requestCount + delta));
    if (next === requestCount) return;
    setIsRunning(false);
    setRequestCount(next);
    setStep(0);
  };

  // SVG geometry.
  const W = 940;
  const poolTop = 64;
  const connW = 130;
  const connH = 76;
  const connGap = 20;
  const poolRowW = poolSize * connW + (poolSize - 1) * connGap;
  const poolLeft = (W - poolRowW) / 2;
  const queueTop = poolTop + connH + 70;
  const qCellW = 50;
  const qGap = 8;
  const qLeft = 30;
  const H = queueTop + qCellW + 56;

  const connX = (i) => poolLeft + i * (connW + connGap);
  const qFits = qLeft * 2 + current.queue.length * (qCellW + qGap) <= W;
  const qScale = qFits ? 1 : (W - qLeft * 2) / Math.max(1, current.queue.length * (qCellW + qGap));

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="dcp">
      <div className="dcp-head">
        <h3 className="dcp-title">Connection pool — acquire, release, and queue under load</h3>
        <p className="dcp-sub">
          A fixed set of connections serves incoming requests. When every connection is busy, new requests
          wait in a queue until one is released. Widen the pool to drain the queue faster.
        </p>
      </div>

      <div className="dcp-controls">
        <div className="dcp-cap">
          <span className="dcp-input-label">pool size</span>
          <button type="button" className="dcp-btn dcp-btn-step" onClick={() => changePool(-1)} disabled={poolSize <= 1}>−</button>
          <span className="dcp-cap-val">{poolSize}</span>
          <button type="button" className="dcp-btn dcp-btn-step" onClick={() => changePool(1)} disabled={poolSize >= 6}>+</button>
        </div>

        <div className="dcp-cap">
          <span className="dcp-input-label">requests</span>
          <button type="button" className="dcp-btn dcp-btn-step" onClick={() => changeReqs(-1)} disabled={requestCount <= 1}><Minus size={12} /></button>
          <span className="dcp-cap-val">{requestCount}</span>
          <button type="button" className="dcp-btn dcp-btn-step" onClick={() => changeReqs(1)} disabled={requestCount >= 14}><Plus size={12} /></button>
        </div>

        <label className="dcp-speed">
          <span className="dcp-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dcp-speed-range"
            aria-label="Playback speed"
          />
          <span className="dcp-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="dcp-spacer" aria-hidden="true" />

        <div className="dcp-buttons">
          <button
            type="button"
            className="dcp-btn dcp-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button type="button" className="dcp-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="dcp-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dcp-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="dcp-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dcp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dcp-svg" preserveAspectRatio="xMidYMid meet">
          <text x={poolLeft} y={poolTop - 16} className="dcp-row-label">
            connection pool ({current.inUse}/{poolSize} in use)
          </text>

          {Array.from({ length: poolSize }).map((_, i) => {
            const x = connX(i);
            const c = current.conns[i];
            const isAcquire = c && current.justAcquired === c.reqId;
            const cls = ['dcp-conn', !c && 'is-idle', c && 'is-busy', isAcquire && 'is-acquire'].filter(Boolean).join(' ');
            return (
              <g key={`conn-${i}`}>
                <rect className={cls} x={x} y={poolTop} width={connW} height={connH} rx={10} />
                <text className="dcp-conn-idx" x={x + 12} y={poolTop + 20}>conn {i}</text>
                {c ? (
                  <>
                    <text className="dcp-conn-req" x={x + connW / 2} y={poolTop + 46}>req#{c.reqId}</text>
                    <text className="dcp-conn-meta" x={x + connW / 2} y={poolTop + 65}>
                      {c.remaining} tick{c.remaining === 1 ? '' : 's'} left
                    </text>
                  </>
                ) : (
                  <text className="dcp-conn-empty" x={x + connW / 2} y={poolTop + connH / 2 + 8}>idle</text>
                )}
              </g>
            );
          })}

          <text x={qLeft} y={queueTop - 14} className="dcp-row-label">
            waiting queue ({current.queue.length}) {current.queue.length === 0 ? '— empty' : '→ next served left-first'}
          </text>

          <g transform={qFits ? undefined : `translate(${qLeft - qLeft * qScale}, 0) scale(${qScale}, 1)`}>
            {current.queue.map((reqId, i) => {
              const x = qLeft + i * (qCellW + qGap);
              const isHead = i === 0;
              return (
                <g key={`q-${reqId}`}>
                  <rect className={`dcp-q-cell ${isHead ? 'is-head' : ''}`} x={x} y={queueTop} width={qCellW} height={qCellW} rx={7} />
                  <text className="dcp-q-val" x={x + qCellW / 2} y={queueTop + qCellW / 2 + 5}>#{reqId}</text>
                </g>
              );
            })}
            {current.queue.length === 0 && (
              <text className="dcp-q-empty" x={qLeft} y={queueTop + qCellW / 2 + 5}>no requests waiting</text>
            )}
          </g>
        </svg>
      </div>

      <div className="dcp-metrics">
        <div className="dcp-metric">
          <span className="dcp-metric-label">in use</span>
          <span className="dcp-metric-value is-busy">{current.inUse}</span>
        </div>
        <div className="dcp-metric">
          <span className="dcp-metric-label">idle</span>
          <span className="dcp-metric-value is-idle">{current.idle}</span>
        </div>
        <div className="dcp-metric">
          <span className="dcp-metric-label">queued</span>
          <span className="dcp-metric-value is-queued">{current.queued}</span>
        </div>
        <div className="dcp-metric">
          <span className="dcp-metric-label">served</span>
          <span className="dcp-metric-value">{current.done.length}</span>
        </div>
        <div className="dcp-metric">
          <span className="dcp-metric-label">total wait</span>
          <span className="dcp-metric-value">{current.totalWait}</span>
        </div>
      </div>

      <div className="dcp-narration">
        <span className="dcp-narration-label">trace</span>
        <span className="dcp-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
