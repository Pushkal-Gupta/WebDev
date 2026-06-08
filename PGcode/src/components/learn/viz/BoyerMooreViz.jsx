import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, StepForward, RotateCcw, Plus, Trash2, ShieldCheck } from 'lucide-react';
import './BoyerMooreViz.css';

// Boyer-Moore majority element voting algorithm — step-through visualization.
// Standalone — render anywhere as <BoyerMooreViz />.

const DEFAULT_ARR = [3, 3, 4, 2, 3, 1, 3, 3, 5, 3, 3, 2];
const RUN_DELAY_MS = 700;

// SVG layout constants
const CELL_W = 46;
const CELL_GAP = 6;
const CELL_H = 56;
const PAD_X = 24;
const POINTER_BAND_H = 64;
const INDEX_BAND_H = 22;
const HEADER_BAND_H = 28;

function buildSteps(arr) {
  // Pre-compute every algorithmic frame so Step / Run / Reset all share a single source of truth.
  const steps = [];

  if (arr.length === 0) {
    steps.push({
      i: -1,
      candidate: null,
      count: 0,
      action: 'empty',
      flash: false,
      phase: 'done-empty',
      verified: null,
      verifyCounted: 0,
      verifyIndex: -1,
      narration: 'Empty array — no majority candidate exists.',
    });
    return steps;
  }

  let candidate = arr[0];
  let count = 1;

  steps.push({
    i: 0,
    candidate,
    count,
    action: 'init',
    flash: false,
    phase: 'voting',
    verified: null,
    verifyCounted: 0,
    verifyIndex: -1,
    narration: `Initialize: candidate = nums[0] = ${candidate}, count = 1. Treat the first element as the provisional majority and start counting votes.`,
  });

  for (let i = 1; i < arr.length; i++) {
    const cur = arr[i];
    if (count === 0) {
      const prev = candidate;
      candidate = cur;
      count = 1;
      steps.push({
        i,
        candidate,
        count,
        action: 'switch',
        flash: true,
        prevCandidate: prev,
        phase: 'voting',
        verified: null,
        verifyCounted: 0,
        verifyIndex: -1,
        narration: `count hit 0, so the previous candidate ${prev} is dethroned. Adopt nums[${i}] = ${cur} as the new candidate and reset count to 1.`,
      });
    } else if (cur === candidate) {
      count += 1;
      steps.push({
        i,
        candidate,
        count,
        action: 'support',
        flash: false,
        phase: 'voting',
        verified: null,
        verifyCounted: 0,
        verifyIndex: -1,
        narration: `nums[${i}] = ${cur} matches the candidate. It votes in favour — count rises to ${count}.`,
      });
    } else {
      count -= 1;
      steps.push({
        i,
        candidate,
        count,
        action: 'oppose',
        flash: false,
        phase: 'voting',
        verified: null,
        verifyCounted: 0,
        verifyIndex: -1,
        narration: `nums[${i}] = ${cur} disagrees with candidate ${candidate}. It cancels one supporting vote — count drops to ${count}.`,
      });
    }
  }

  // After voting: announce the survivor.
  steps.push({
    i: arr.length - 1,
    candidate,
    count,
    action: 'survivor',
    flash: false,
    phase: 'voting-done',
    verified: null,
    verifyCounted: 0,
    verifyIndex: -1,
    narration: `Voting complete. The survivor candidate is ${candidate}. This is the only value that *could* be the majority — now verify with a second pass.`,
  });

  // Verification pass — count actual occurrences.
  let counted = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === candidate) counted += 1;
    steps.push({
      i: arr.length - 1,
      candidate,
      count,
      action: 'verify',
      flash: false,
      phase: 'verifying',
      verified: null,
      verifyCounted: counted,
      verifyIndex: i,
      narration:
        arr[i] === candidate
          ? `Verify pass: nums[${i}] = ${arr[i]} equals candidate ${candidate}. Real count now ${counted}.`
          : `Verify pass: nums[${i}] = ${arr[i]} does not match candidate ${candidate}. Real count stays ${counted}.`,
    });
  }

  const isMajority = counted > arr.length / 2;
  steps.push({
    i: arr.length - 1,
    candidate,
    count,
    action: 'final',
    flash: false,
    phase: isMajority ? 'done-majority' : 'done-no-majority',
    verified: isMajority,
    verifyCounted: counted,
    verifyIndex: arr.length - 1,
    narration: isMajority
      ? `${candidate} appears ${counted} times in ${arr.length} elements — that is strictly more than ⌊n/2⌋ = ${Math.floor(arr.length / 2)}. ${candidate} is the majority element.`
      : `${candidate} appears only ${counted} times out of ${arr.length} — not strictly more than ⌊n/2⌋ = ${Math.floor(arr.length / 2)}. No majority element exists.`,
  });

  return steps;
}

function PointerMarker({ index, label, cellOffsetX, yBaseline }) {
  if (index == null || index < 0) return null;
  const cx = cellOffsetX + index * (CELL_W + CELL_GAP) + CELL_W / 2;
  const arrowTipY = yBaseline - 4;
  const arrowBaseY = yBaseline - 18;
  const textY = yBaseline - 26;
  const labelY = yBaseline - 40;
  return (
    <g className="bmv-ptr" aria-hidden="true">
      <path
        className="bmv-ptr-arrow"
        d={`M ${cx} ${arrowTipY} L ${cx - 5} ${arrowBaseY} L ${cx + 5} ${arrowBaseY} Z`}
      />
      <line
        className="bmv-ptr-arrow"
        x1={cx}
        y1={arrowBaseY}
        x2={cx}
        y2={textY}
      />
      <text className="bmv-ptr-text" x={cx} y={labelY}>{label}</text>
    </g>
  );
}

function VerifyMarker({ index, cellOffsetX, yTop }) {
  if (index == null || index < 0) return null;
  const cx = cellOffsetX + index * (CELL_W + CELL_GAP) + CELL_W / 2;
  const y1 = yTop + CELL_H + 26;
  const y2 = yTop + CELL_H + 38;
  return (
    <g className="bmv-verify-ptr" aria-hidden="true">
      <path
        className="bmv-verify-arrow"
        d={`M ${cx} ${y1} L ${cx - 4} ${y2} L ${cx + 4} ${y2} Z`}
      />
      <text className="bmv-verify-text" x={cx} y={y2 + 12}>v</text>
    </g>
  );
}

export default function BoyerMooreViz({ initialArray = DEFAULT_ARR }) {
  const [arr, setArr] = useState(initialArray);
  const [addInput, setAddInput] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const runTimer = useRef(null);

  const steps = useMemo(() => buildSteps(arr), [arr]);
  const current = steps[stepIdx] || steps[0];
  const totalSteps = steps.length;
  const isTerminal =
    current.phase === 'done-majority' ||
    current.phase === 'done-no-majority' ||
    current.phase === 'done-empty';

  useEffect(() => {
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, []);

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

  const reset = useCallback(() => {
    stop();
    setStepIdx(0);
  }, [stop]);

  // Auto-run loop
  useEffect(() => {
    if (!isRunning) return;
    if (stepIdx >= totalSteps - 1) {
      setIsRunning(false);
      return;
    }
    runTimer.current = setTimeout(() => {
      setStepIdx((i) => Math.min(i + 1, totalSteps - 1));
    }, RUN_DELAY_MS);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, stepIdx, totalSteps]);

  const handleRunToggle = () => {
    if (isRunning) {
      stop();
      return;
    }
    if (stepIdx >= totalSteps - 1) {
      setStepIdx(0);
      requestAnimationFrame(() => setIsRunning(true));
      return;
    }
    setIsRunning(true);
  };

  const addToArray = () => {
    const n = Number(addInput);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return;
    if (arr.length >= 24) return; // soft cap to keep layout sane
    stop();
    setArr((prev) => [...prev, n]);
    setAddInput('');
    setStepIdx(0);
  };

  const clearArray = () => {
    stop();
    setArr([]);
    setStepIdx(0);
  };

  const loadDefault = () => {
    stop();
    setArr(DEFAULT_ARR);
    setStepIdx(0);
  };

  // ── SVG geometry ──
  const cols = Math.max(arr.length, 1);
  const svgWidth = PAD_X * 2 + cols * CELL_W + (cols - 1) * CELL_GAP;
  const svgHeight =
    HEADER_BAND_H +
    POINTER_BAND_H +
    CELL_H +
    INDEX_BAND_H +
    (current.phase === 'verifying' || current.phase === 'done-majority' || current.phase === 'done-no-majority' ? 36 : 12);

  const headerBandY = 16;
  const cellRowY = HEADER_BAND_H + POINTER_BAND_H;
  const indexBandY = cellRowY + CELL_H + 14;
  const pointerBaselineY = cellRowY;

  const showVotingPointer =
    current.phase === 'voting' || current.phase === 'voting-done';
  const showVerifyPointer = current.phase === 'verifying';

  const chipFlash = current.flash;
  const countTone =
    current.count === 0
      ? 'is-zero'
      : current.action === 'support'
        ? 'is-up'
        : current.action === 'oppose'
          ? 'is-down'
          : '';

  const phaseLabel =
    current.phase === 'voting'
      ? 'Voting'
      : current.phase === 'voting-done'
        ? 'Voting complete'
        : current.phase === 'verifying'
          ? 'Verifying'
          : current.phase === 'done-majority'
            ? 'Majority confirmed'
            : current.phase === 'done-no-majority'
              ? 'No majority'
              : 'Empty';

  const actionLabel = (() => {
    switch (current.action) {
      case 'init':
        return 'init';
      case 'support':
        return 'count + 1';
      case 'oppose':
        return 'count - 1';
      case 'switch':
        return 'swap candidate';
      case 'survivor':
        return 'survivor';
      case 'verify':
        return 'verify scan';
      case 'final':
        return current.verified ? 'majority found' : 'not majority';
      case 'empty':
        return 'empty';
      default:
        return '';
    }
  })();

  return (
    <div className="bmv" role="group" aria-label="Boyer-Moore majority voting step-through">
      <div className="bmv-head">
        <h3 className="bmv-title">Boyer-Moore Voting · Step-Through</h3>
        <div className="bmv-step-counter">
          step <strong>{stepIdx}</strong> / {Math.max(totalSteps - 1, 0)}
        </div>
      </div>

      <div className="bmv-controls">
        <label className="bmv-input-group">
          <span className="bmv-input-label">value</span>
          <input
            className="bmv-input"
            type="number"
            value={addInput}
            placeholder="n"
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addToArray(); }}
            aria-label="Integer to append to the array"
          />
          <button
            type="button"
            className="bmv-btn"
            onClick={addToArray}
            aria-label="Add value to array"
            disabled={arr.length >= 24}
          >
            <Plus size={12} /> add
          </button>
        </label>

        <button
          type="button"
          className="bmv-btn"
          onClick={clearArray}
          aria-label="Clear array"
        >
          <Trash2 size={12} /> clear
        </button>

        <button
          type="button"
          className="bmv-btn"
          onClick={loadDefault}
          aria-label="Reset to default array"
        >
          <ShieldCheck size={12} /> sample
        </button>

        <span className="bmv-spacer" aria-hidden="true" />

        <button
          type="button"
          className="bmv-btn"
          onClick={stepOnce}
          disabled={isRunning || isTerminal || arr.length === 0}
        >
          <StepForward size={14} /> Step
        </button>

        <button
          type="button"
          className="bmv-btn bmv-btn-primary"
          onClick={handleRunToggle}
          disabled={arr.length === 0}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'Pause' : (isTerminal ? 'Replay' : 'Run')}
        </button>

        <button
          type="button"
          className="bmv-btn bmv-btn-danger"
          onClick={reset}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="bmv-status-row">
        <div className={`bmv-chip ${chipFlash ? 'is-flash' : ''}`}>
          <span className="bmv-chip-label">candidate</span>
          <span className="bmv-chip-value">
            {current.candidate == null ? '—' : current.candidate}
          </span>
        </div>
        <div className={`bmv-chip bmv-chip-count ${countTone} ${chipFlash ? 'is-flash' : ''}`}>
          <span className="bmv-chip-label">count</span>
          <span className="bmv-chip-value">{current.count}</span>
        </div>
        <div className="bmv-chip bmv-chip-phase">
          <span className="bmv-chip-label">phase</span>
          <span className="bmv-chip-value">{phaseLabel}</span>
        </div>
        {actionLabel && (
          <div className="bmv-chip bmv-chip-action">
            <span className="bmv-chip-label">action</span>
            <span className="bmv-chip-value">{actionLabel}</span>
          </div>
        )}
        {(current.phase === 'verifying' || current.phase === 'done-majority' || current.phase === 'done-no-majority') && (
          <div className="bmv-chip bmv-chip-verify">
            <span className="bmv-chip-label">real count</span>
            <span className="bmv-chip-value">{current.verifyCounted}</span>
          </div>
        )}
      </div>

      <div className="bmv-stage-wrap">
        {arr.length === 0 ? (
          <div className="bmv-empty">Add values or load the sample to begin.</div>
        ) : (
          <svg
            className="bmv-stage"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width={svgWidth}
            height={svgHeight}
            role="img"
            aria-label="Boyer-Moore voting visualization stage"
          >
            <text className="bmv-header-line" x={PAD_X} y={headerBandY + 12}>
              n = <tspan className="k">{arr.length}</tspan>
              <tspan dx="14" fill="var(--text-dim)">majority threshold &gt; {Math.floor(arr.length / 2)}</tspan>
            </text>

            {arr.map((v, i) => {
              const x = PAD_X + i * (CELL_W + CELL_GAP);
              const isCurrent =
                (current.phase === 'voting' || current.phase === 'voting-done') &&
                current.i === i;
              const isCandidateMatch =
                current.candidate != null &&
                v === current.candidate &&
                current.phase !== 'done-empty';
              const isVerifyMatch =
                current.phase === 'verifying' &&
                current.verifyIndex >= i &&
                v === current.candidate;
              const isVerifyCurrent =
                current.phase === 'verifying' && current.verifyIndex === i;
              const isFinalMajorityCell =
                (current.phase === 'done-majority') && v === current.candidate;

              const rectCls = [
                'bmv-cell-rect',
                isCurrent && 'is-current',
                isCandidateMatch && !isCurrent && 'is-cand-match',
                isVerifyCurrent && 'is-verify-current',
                isVerifyMatch && !isVerifyCurrent && 'is-verify-match',
                isFinalMajorityCell && 'is-final-majority',
              ].filter(Boolean).join(' ');

              const txtCls = [
                'bmv-cell-value',
                isCurrent && 'is-current',
                isCandidateMatch && 'is-cand-match',
                isFinalMajorityCell && 'is-final-majority',
              ].filter(Boolean).join(' ');

              return (
                <g key={i}>
                  <rect
                    className={rectCls}
                    x={x}
                    y={cellRowY}
                    width={CELL_W}
                    height={CELL_H}
                    rx={6}
                    ry={6}
                  />
                  <text
                    className={txtCls}
                    x={x + CELL_W / 2}
                    y={cellRowY + CELL_H / 2}
                  >
                    {v}
                  </text>
                  <text
                    className="bmv-cell-idx"
                    x={x + CELL_W / 2}
                    y={indexBandY}
                  >
                    {i}
                  </text>
                </g>
              );
            })}

            {showVotingPointer && current.i >= 0 && (
              <PointerMarker
                index={current.i}
                label="i"
                cellOffsetX={PAD_X}
                yBaseline={pointerBaselineY}
              />
            )}

            {showVerifyPointer && current.verifyIndex >= 0 && (
              <VerifyMarker
                index={current.verifyIndex}
                cellOffsetX={PAD_X}
                yTop={cellRowY}
              />
            )}
          </svg>
        )}
      </div>

      <div className="bmv-narration">
        <div className="bmv-card">
          <span className="bmv-card-label">Step narration</span>
          <div className="bmv-card-body">{current.narration}</div>
        </div>
      </div>

      {current.phase === 'done-majority' && (
        <div className="bmv-status is-found" role="status">
          <span className="bmv-status-dot" />
          Majority element: {current.candidate} ({current.verifyCounted} of {arr.length})
        </div>
      )}
      {current.phase === 'done-no-majority' && (
        <div className="bmv-status is-missing" role="status">
          <span className="bmv-status-dot" />
          No majority — survivor {current.candidate} only appears {current.verifyCounted} of {arr.length} times
        </div>
      )}

      <div className="bmv-legend" aria-hidden="true">
        <span className="bmv-legend-item"><span className="bmv-legend-swatch current" /> current i</span>
        <span className="bmv-legend-item"><span className="bmv-legend-swatch cand" /> matches candidate</span>
        <span className="bmv-legend-item"><span className="bmv-legend-swatch verify" /> verify scan</span>
        <span className="bmv-legend-item"><span className="bmv-legend-swatch final" /> majority element</span>
      </div>
    </div>
  );
}
