import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, RefreshCw, Activity, Cpu } from 'lucide-react';
import './EpollKqueueViz.css';

// Number of monitored file descriptors (sockets) on the grid.
const FD_COUNT = 28;
const COLS = 7;

// Deterministic PRNG (mulberry32). Seeded only — never Math.random.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick which fds are "ready" (have data) from a seed. Deterministic per seed.
function readyFromSeed(seed) {
  const rand = mulberry32(seed);
  const ready = [];
  for (let i = 0; i < FD_COUNT; i += 1) {
    // ~18% of fds become ready, but force at least a few.
    if (rand() < 0.18) ready.push(i);
  }
  if (ready.length === 0) {
    // guarantee a handful so the contrast is visible
    const r2 = mulberry32(seed ^ 0x9e3779b9);
    while (ready.length < 4) {
      const idx = Math.floor(r2() * FD_COUNT);
      if (!ready.includes(idx)) ready.push(idx);
    }
    ready.sort((p, q) => p - q);
  }
  return ready;
}

// Build the per-step trace for one syscall.
//   mode 'poll'   -> the app must scan EVERY fd to discover readiness: O(n).
//   mode 'epoll'  -> the kernel hands back a ready list; the app touches ONLY ready fds: O(ready).
function buildFrames(mode, readySet) {
  const frames = [];
  const ready = new Set(readySet);
  const n = FD_COUNT;
  const k = readySet.length;

  const snap = (extra) => ({
    cursor: -1,        // fd currently under the scan pointer (-1 = none)
    inspected: [],     // fds inspected so far this call
    returned: [],      // fds reported ready so far
    inspectedCount: 0,
    returnedCount: 0,
    note: '',
    ...extra,
  });

  if (mode === 'poll') {
    frames.push(snap({
      note: `poll()/select() call begins. The kernel knows nothing structural — the app must walk ALL ${n} fds itself, testing each for readiness. Work scales with how many you watch, not how many fired.`,
    }));
    const inspected = [];
    const returned = [];
    for (let i = 0; i < n; i += 1) {
      inspected.push(i);
      const hit = ready.has(i);
      if (hit) returned.push(i);
      frames.push(snap({
        cursor: i,
        inspected: [...inspected],
        returned: [...returned],
        inspectedCount: inspected.length,
        returnedCount: returned.length,
        note: hit
          ? `Scan fd ${i}: READY (has data). Counted as inspected (${inspected.length}/${n}) and collected. Even a hit still cost one check among the full sweep.`
          : `Scan fd ${i}: idle, no data. Still had to be inspected (${inspected.length}/${n}) just to learn that. This wasted work is the O(n) tax.`,
      }));
    }
    frames.push(snap({
      cursor: -1,
      inspected: [...inspected],
      returned: [...returned],
      inspectedCount: inspected.length,
      returnedCount: returned.length,
      note: `Call returns ${returned.length} ready fd(s) after inspecting ALL ${n}. Cost class O(n): every added socket slows every call, whether or not it ever has data.`,
    }));
  } else {
    frames.push(snap({
      note: `epoll_wait()/kevent() call begins. The kernel already maintains a READY LIST built by interrupt-time callbacks. The app does not scan — it reads back only the fds that fired.`,
    }));
    const inspected = [];
    const returned = [];
    const list = [...readySet];
    if (list.length === 0) {
      frames.push(snap({ note: 'Kernel ready list is empty this cycle — the call returns 0 fds without touching any socket. Zero scan work.' }));
    }
    for (let j = 0; j < list.length; j += 1) {
      const fd = list[j];
      inspected.push(fd);
      returned.push(fd);
      frames.push(snap({
        cursor: fd,
        inspected: [...inspected],
        returned: [...returned],
        inspectedCount: inspected.length,
        returnedCount: returned.length,
        note: `Pull fd ${fd} straight from the kernel ready list (item ${j + 1} of ${list.length}). The ${n - k} idle fds are never visited — they cost nothing this call.`,
      }));
    }
    frames.push(snap({
      cursor: -1,
      inspected: [...inspected],
      returned: [...returned],
      inspectedCount: inspected.length,
      returnedCount: returned.length,
      note: `Call returns ${returned.length} ready fd(s) after touching only those ${returned.length}. Cost class O(ready): monitoring 28 or 28,000 idle sockets adds nothing — work tracks events, not the watch set.`,
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 950;

export default function EpollKqueueViz() {
  const [mode, setMode] = useState('poll');
  const [seed, setSeed] = useState(1337);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const readySet = useMemo(() => readyFromSeed(seed), [seed]);
  const frames = useMemo(() => buildFrames(mode, readySet), [mode, readySet]);
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
    setMode(m);
    setStep(0);
  };

  const reseed = () => {
    setIsRunning(false);
    // deterministic next seed derived from current seed (no Math.random)
    setSeed((s) => (Math.imul(s ^ 0x85ebca6b, 0x9e3779b1) >>> 0) % 100000);
    setStep(0);
  };

  // SVG geometry — fd grid on the left, kernel ready list on the right.
  const W = 940;
  const H = 430;
  const gridX = 24;
  const gridTop = 70;
  const cellW = 70;
  const cellH = 56;
  const cellGapX = 8;
  const cellGapY = 8;
  const cellXY = (i) => {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    return {
      x: gridX + c * (cellW + cellGapX),
      y: gridTop + r * (cellH + cellGapY),
    };
  };

  const listX = gridX + COLS * (cellW + cellGapX) + 36;
  const listW = W - listX - 24;

  const readyArr = readySet;
  const inspectedSet = new Set(current.inspected);
  const returnedSet = new Set(current.returned);
  const isReady = (i) => readyArr.includes(i);

  const costLabel = mode === 'poll'
    ? `O(n) — scanned ${current.inspectedCount} of ${FD_COUNT}`
    : `O(ready) — returned ${current.returnedCount}`;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="ekv">
      <div className="ekv-head">
        <h3 className="ekv-title">Readiness notification — poll/select O(n) vs epoll/kqueue O(ready)</h3>
        <p className="ekv-sub">
          {FD_COUNT} sockets are monitored; a few have data. poll/select forces the app to scan every fd each call to
          find them. epoll/kqueue keeps a kernel ready list and hands back only the fds that fired.
        </p>
      </div>

      <div className="ekv-controls">
        <div className="ekv-modes" role="group" aria-label="Readiness mechanism">
          <button
            type="button"
            className={`ekv-mode ${mode === 'poll' ? 'is-active' : ''}`}
            onClick={() => switchMode('poll')}
          >
            <Activity size={13} /> poll / select
          </button>
          <button
            type="button"
            className={`ekv-mode ${mode === 'epoll' ? 'is-active' : ''}`}
            onClick={() => switchMode('epoll')}
          >
            <Cpu size={13} /> epoll / kqueue
          </button>
        </div>

        <button type="button" className="ekv-btn" onClick={reseed}>
          <RefreshCw size={13} /> reshuffle ready fds
        </button>

        <label className="ekv-speed">
          <span className="ekv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ekv-speed-range"
            aria-label="Playback speed"
          />
          <span className="ekv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="ekv-spacer" aria-hidden="true" />

        <div className="ekv-buttons">
          <button
            type="button"
            className="ekv-btn ekv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={totalSteps <= 1}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="ekv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="ekv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="ekv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="ekv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="ekv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ekv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="ekv-section-label" x={gridX} y={48}>
            {FD_COUNT} monitored sockets {mode === 'poll' ? '— app scans all' : '— app skips idle ones'}
          </text>

          {/* fd grid */}
          {Array.from({ length: FD_COUNT }, (_, i) => {
            const { x, y } = cellXY(i);
            const ready = isReady(i);
            const inspected = inspectedSet.has(i);
            const returned = returnedSet.has(i);
            const isCursor = current.cursor === i;
            let cls = 'ekv-cell';
            if (ready) cls += ' is-ready';
            if (inspected) cls += ' is-inspected';
            if (returned) cls += ' is-returned';
            if (isCursor) cls += ' is-cursor';
            return (
              <g key={`fd-${i}`}>
                <rect className={cls} x={x} y={y} width={cellW} height={cellH} rx={8} />
                <text className="ekv-cell-id" x={x + cellW / 2} y={y + 21}>fd {i}</text>
                <text className="ekv-cell-state" x={x + cellW / 2} y={y + 40}>
                  {ready ? 'data' : 'idle'}
                </text>
              </g>
            );
          })}

          {/* scan pointer for poll mode */}
          {mode === 'poll' && current.cursor >= 0 && (() => {
            const { x, y } = cellXY(current.cursor);
            return (
              <g>
                <path
                  className="ekv-scan-pointer"
                  d={`M ${x + cellW / 2 - 7} ${y - 12} L ${x + cellW / 2 + 7} ${y - 12} L ${x + cellW / 2} ${y - 2} Z`}
                />
              </g>
            );
          })()}

          {/* divider */}
          <line className="ekv-divider" x1={listX - 18} y1={gridTop - 8} x2={listX - 18} y2={H - 24} />

          {/* kernel ready list panel */}
          <text className="ekv-section-label" x={listX} y={48}>
            {mode === 'epoll' ? 'kernel ready list (maintained for you)' : 'no kernel list — app builds it by scanning'}
          </text>
          <rect
            className={`ekv-list ${mode === 'epoll' ? 'is-active' : 'is-dim'}`}
            x={listX}
            y={gridTop}
            width={listW}
            height={H - gridTop - 24}
            rx={9}
          />
          {mode === 'epoll' ? (
            readyArr.length === 0 ? (
              <text className="ekv-list-empty" x={listX + listW / 2} y={gridTop + (H - gridTop - 24) / 2}>empty this cycle</text>
            ) : (
              readyArr.map((fd, j) => {
                const ry = gridTop + 18 + j * 34;
                const handed = returnedSet.has(fd);
                return (
                  <g key={`rl-${fd}`}>
                    <rect
                      className={`ekv-list-item ${handed ? 'is-handed' : ''}`}
                      x={listX + 14}
                      y={ry}
                      width={listW - 28}
                      height={26}
                      rx={6}
                    />
                    <text className="ekv-list-text" x={listX + 26} y={ry + 17} textAnchor="start">fd {fd}</text>
                    <text className="ekv-list-tag" x={listX + listW - 26} y={ry + 17} textAnchor="end">
                      {handed ? 'handed to app' : 'queued'}
                    </text>
                  </g>
                );
              })
            )
          ) : (
            <text className="ekv-list-empty" x={listX + listW / 2} y={gridTop + (H - gridTop - 24) / 2}>
              every fd must be polled
            </text>
          )}
        </svg>
      </div>

      <div className="ekv-metrics">
        <div className="ekv-metric">
          <span className="ekv-metric-label">fds monitored</span>
          <span className="ekv-metric-value">{FD_COUNT}</span>
        </div>
        <div className="ekv-metric">
          <span className="ekv-metric-label">fds ready</span>
          <span className="ekv-metric-value is-ready">{readyArr.length}</span>
        </div>
        <div className="ekv-metric">
          <span className="ekv-metric-label">inspected this call</span>
          <span className="ekv-metric-value is-inspected">{current.inspectedCount}</span>
        </div>
        <div className="ekv-metric">
          <span className="ekv-metric-label">fds returned</span>
          <span className="ekv-metric-value is-returned">{current.returnedCount}</span>
        </div>
        <div className="ekv-metric">
          <span className="ekv-metric-label">cost class</span>
          <span className={`ekv-metric-value ${mode === 'poll' ? 'is-cost-on' : 'is-cost-good'}`}>{costLabel}</span>
        </div>
      </div>

      <div className="ekv-narration">
        <span className="ekv-narration-label">trace</span>
        <span className="ekv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
