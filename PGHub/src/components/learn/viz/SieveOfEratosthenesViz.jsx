import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import './SieveOfEratosthenesViz.css';

// Interactive Sieve of Eratosthenes.
// Builds a linear frame stream: each frame represents either
//  (a) the discovery of a new prime p, or
//  (b) marking a single multiple of p as composite.
// The grid replays them step by step. Numbers start at 2 — 0 and 1
// are intentionally absent because they are neither prime nor composite.

const RUN_DELAY_MS = 240;
const COLS = 10;

// state tags for each number:
//   'unmarked'        — still in play, not yet inspected
//   'prime-active'    — the p discovered on the current step (pulses)
//   'prime-settled'   — confirmed prime from a previous step
//   'composite-flash' — just marked composite on the current step
//   'composite'       — composite marked earlier

function sieveFrames(n) {
  const N = Math.max(2, n | 0);
  // value -> state. We index by value (0..N) and just ignore [0] and [1].
  const state = new Array(N + 1).fill('unmarked');
  state[0] = 'composite';
  state[1] = 'composite';

  const frames = [];

  const snapshot = (extra) => {
    frames.push({
      state: state.slice(),
      activePrime: null,
      activeMultiple: null,
      label: '',
      ...extra,
    });
  };

  snapshot({
    label: `Start with the numbers 2 through ${N}. None are marked yet — every cell is a candidate.`,
  });

  for (let p = 2; p * p <= N; p++) {
    if (state[p] === 'composite' || state[p] === 'composite-flash') {
      // already crossed out by a smaller prime, skip
      continue;
    }
    // promote p to active prime
    // first, demote any previous "active" / "flash" markers to their settled forms
    for (let v = 2; v <= N; v++) {
      if (state[v] === 'prime-active') state[v] = 'prime-settled';
      if (state[v] === 'composite-flash') state[v] = 'composite';
    }
    state[p] = 'prime-active';
    snapshot({
      activePrime: p,
      label: `Smallest unmarked number is ${p}. ${p} is prime. Now cross out its multiples starting at ${p}² = ${p * p}.`,
    });

    // mark multiples p*p, p*p+p, p*p+2p, ...
    const startMul = p * p;
    const multiples = [];
    for (let m = startMul; m <= N; m += p) multiples.push(m);

    if (multiples.length === 0) {
      snapshot({
        activePrime: p,
        label: `${p}² = ${p * p} already exceeds ${N}. Nothing to cross out for ${p}.`,
      });
    } else {
      multiples.forEach((m, i) => {
        // demote previous composite-flash to plain composite before flashing the next
        if (i > 0) {
          for (let v = 2; v <= N; v++) {
            if (state[v] === 'composite-flash') state[v] = 'composite';
          }
        }
        // only flash if the cell was previously unmarked
        // (a composite from a smaller prime stays composite — but we still
        // describe it in the caption so the user can see why we skip ahead).
        const wasUnmarked = state[m] === 'unmarked';
        if (wasUnmarked) {
          state[m] = 'composite-flash';
        }
        const tail = multiples.slice(i + 1, i + 4).join(', ');
        const more = multiples.length - i - 1 > 3 ? '…' : '';
        snapshot({
          activePrime: p,
          activeMultiple: m,
          label: wasUnmarked
            ? `Marking multiples of ${p}: ${m}${tail ? ', next ' + tail + more : ''}.`
            : `${m} is already composite (marked by a smaller prime). Skip ahead.`,
        });
      });
    }
  }

  // finalisation pass — promote remaining unmarked numbers to prime-settled,
  // demote any lingering flash states.
  for (let v = 2; v <= N; v++) {
    if (state[v] === 'unmarked') state[v] = 'prime-settled';
    if (state[v] === 'prime-active') state[v] = 'prime-settled';
    if (state[v] === 'composite-flash') state[v] = 'composite';
  }

  const primes = [];
  for (let v = 2; v <= N; v++) {
    if (state[v] === 'prime-settled') primes.push(v);
  }

  snapshot({
    activePrime: null,
    label: `p² now exceeds ${N}. Every number still unmarked is prime — ${primes.length} primes in [2, ${N}].`,
  });

  return { frames, primes };
}

// ── SVG grid ───────────────────────────────────────────────────

const CELL = 9.6;          // cell width in viewBox units
const CELL_H = 9.6;
const GAP = 1.1;
const PAD_X = 2;
const PAD_Y = 2;

function SieveGrid({ frame, n }) {
  const cols = COLS;
  const numbers = useMemo(() => {
    const out = [];
    for (let v = 2; v <= n; v++) out.push(v);
    return out;
  }, [n]);
  const rows = Math.ceil(numbers.length / cols);
  const viewW = PAD_X * 2 + cols * CELL + (cols - 1) * GAP;
  const viewH = PAD_Y * 2 + rows * CELL_H + (rows - 1) * GAP;

  return (
    <svg
      className="sev-svg"
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Sieve of Eratosthenes grid"
    >
      {numbers.map((v) => {
        const idx = v - 2;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = PAD_X + col * (CELL + GAP);
        const y = PAD_Y + row * (CELL_H + GAP);
        const s = frame.state[v];
        const isActiveMul = frame.activeMultiple === v;
        const isActivePrime = frame.activePrime === v && s === 'prime-active';

        const cls = [
          'sev-cell',
          s === 'unmarked' && 'is-unmarked',
          s === 'prime-active' && 'is-prime-active',
          s === 'prime-settled' && 'is-prime-settled',
          s === 'composite-flash' && 'is-composite-flash',
          s === 'composite' && 'is-composite',
          isActiveMul && 'is-active-mul',
          isActivePrime && 'is-active-prime',
        ].filter(Boolean).join(' ');

        return (
          <g key={v}>
            <rect
              className={cls}
              x={x}
              y={y}
              width={CELL}
              height={CELL_H}
              rx={1.3}
              ry={1.3}
            />
            <text
              className={`sev-num ${s === 'composite' || s === 'composite-flash' ? 'is-struck' : ''}`}
              x={x + CELL / 2}
              y={y + CELL_H / 2 + 0.2}
            >
              {v}
            </text>
            {(s === 'composite' || s === 'composite-flash') && (
              <line
                className="sev-strike"
                x1={x + 1.4}
                y1={y + CELL_H - 1.4}
                x2={x + CELL - 1.4}
                y2={y + 1.4}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────

export default function SieveOfEratosthenesViz() {
  const [n, setN] = useState(50);
  const [stepIdx, setStepIdx] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const runTimer = useRef(null);

  const { frames, primes } = useMemo(() => sieveFrames(n), [n]);
  const totalSteps = frames.length;

  const safeStep = Math.min(stepIdx, totalSteps - 1);
  const frame = frames[safeStep];
  const isTerminal = safeStep >= totalSteps - 1;
  const isRunning = isRunningRaw && stepIdx < totalSteps - 1;

  // Count primes so far at the current frame, by looking at confirmed primes.
  const primesSoFar = useMemo(() => {
    let count = 0;
    const list = [];
    for (let v = 2; v <= n; v++) {
      const s = frame.state[v];
      if (s === 'prime-active' || s === 'prime-settled') {
        count++;
        list.push(v);
      }
    }
    return { count, list };
  }, [frame, n]);

  useEffect(() => {
    return () => {
      if (runTimer.current) clearTimeout(runTimer.current);
      runTimer.current = null;
    };
  }, []);

  // Reset playhead when n changes (prev-state-during-render pattern).
  // The active run-loop effect's cleanup handles the timer; no need to touch it here.
  const [prevN, setPrevN] = useState(n);
  if (prevN !== n) {
    setPrevN(n);
    setStepIdx(0);
    setIsRunning(false);
  }

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStepIdx((i) => Math.min(i + 1, totalSteps - 1));
    }, RUN_DELAY_MS);
    return () => {
      if (runTimer.current) clearTimeout(runTimer.current);
      runTimer.current = null;
    };
  }, [isRunning, totalSteps]);

  const stop = useCallback(() => {
    if (runTimer.current) {
      clearTimeout(runTimer.current);
      runTimer.current = null;
    }
    setIsRunning(false);
  }, []);

  const stepOnce = useCallback(() => {
    setStepIdx((i) => Math.min(i + 1, totalSteps - 1));
  }, [totalSteps]);

  const restart = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  const handleRunToggle = useCallback(() => {
    if (isRunning) { stop(); return; }
    if (stepIdx >= totalSteps - 1) {
      setStepIdx(0);
      requestAnimationFrame(() => setIsRunning(true));
      return;
    }
    setIsRunning(true);
  }, [isRunning, stepIdx, totalSteps, stop]);

  return (
    <div className="sev" role="group" aria-label="Sieve of Eratosthenes interactive visualization">
      <div className="sev-head">
        <h3 className="sev-title">Sieve of Eratosthenes &middot; primes up to n</h3>
        <div className="sev-step-counter">
          step <strong>{safeStep}</strong> / {totalSteps - 1}
        </div>
      </div>

      <div className="sev-controls">
        <div className="sev-control-group sev-n-group">
          <label className="sev-n-label" htmlFor="sev-n-slider">
            n = <strong>{n}</strong>
          </label>
          <input
            id="sev-n-slider"
            type="range"
            min={10}
            max={100}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="sev-slider"
            aria-label="upper bound n"
          />
          <span className="sev-n-hint">(find primes in [2, {n}])</span>
        </div>
        <div className="sev-control-group">
          <button
            type="button"
            className="sev-btn"
            onClick={stepOnce}
            disabled={isRunning || isTerminal}
          >
            <StepForward size={14} /> Step
          </button>
          <button
            type="button"
            className="sev-btn sev-btn-primary"
            onClick={handleRunToggle}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : (isTerminal ? 'Replay' : 'Run')}
          </button>
          <button
            type="button"
            className="sev-btn"
            onClick={restart}
            disabled={safeStep === 0}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="sev-canvas">
        <SieveGrid frame={frame} n={n} />
      </div>

      <div className="sev-caption" role="status" aria-live="polite">
        {frame.label}
      </div>

      <div className="sev-summary">
        <div className="sev-summary-cell">
          <span className="sev-summary-label">current prime</span>
          <span className="sev-summary-val">
            {frame.activePrime != null ? frame.activePrime : '—'}
          </span>
        </div>
        <div className="sev-summary-cell">
          <span className="sev-summary-label">marking</span>
          <span className="sev-summary-val">
            {frame.activeMultiple != null ? frame.activeMultiple : '—'}
          </span>
        </div>
        <div className={`sev-summary-cell${isTerminal ? ' is-found' : ''}`}>
          <span className="sev-summary-label">primes found</span>
          <span className="sev-summary-val">
            {isTerminal ? primes.length : primesSoFar.count}
          </span>
        </div>
        <div className="sev-summary-cell">
          <span className="sev-summary-label">range</span>
          <span className="sev-summary-val">[2, {n}]</span>
        </div>
      </div>

      <div className="sev-primes">
        <div className="sev-primes-label">
          {isTerminal ? `All ${primes.length} primes in [2, ${n}]` : `Primes confirmed so far (${primesSoFar.count})`}
        </div>
        <div className="sev-primes-list">
          {(isTerminal ? primes : primesSoFar.list).length === 0
            ? <span className="sev-primes-empty">none yet</span>
            : (isTerminal ? primes : primesSoFar.list).map((p) => (
                <span key={p} className="sev-prime-chip">{p}</span>
              ))}
        </div>
      </div>

      <div className="sev-legend" aria-hidden="true">
        <span className="sev-legend-item"><span className="sev-legend-swatch unmarked" /> unmarked</span>
        <span className="sev-legend-item"><span className="sev-legend-swatch active-prime" /> current prime</span>
        <span className="sev-legend-item"><span className="sev-legend-swatch confirmed-prime" /> confirmed prime</span>
        <span className="sev-legend-item"><span className="sev-legend-swatch flash" /> just crossed out</span>
        <span className="sev-legend-item"><span className="sev-legend-swatch composite" /> composite</span>
      </div>
    </div>
  );
}
