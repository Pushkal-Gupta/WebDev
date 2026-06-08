import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, StepForward, RotateCcw, RefreshCw, Shuffle } from 'lucide-react';
import './BoyerMooreVotingViz.css';

// Boyer-Moore Majority Vote — MANIM-style SVG step-through.
// Standalone — render as <BoyerMooreVotingViz />. Use site theme tokens only.

const DEFAULT_ARR = [2, 2, 1, 1, 1, 2, 2];
const RUN_DELAY_MS = 750;

// SVG layout
const CELL_W = 54;
const CELL_GAP = 8;
const CELL_H = 60;
const PAD_X = 28;
const HEADER_H = 30;
const POINTER_H = 60;
const INDEX_H = 22;
const PANEL_GAP_Y = 36;
const PANEL_H = 96;

function buildSteps(arr) {
  const steps = [];

  if (arr.length === 0) {
    steps.push({
      i: -1,
      candidate: null,
      count: 0,
      action: 'empty',
      flash: false,
      phase: 'done-empty',
      verifyCount: 0,
      verifyIndex: -1,
      verified: null,
      narration: 'Empty array — nothing to vote on.',
    });
    return steps;
  }

  let candidate = null;
  let count = 0;

  for (let i = 0; i < arr.length; i++) {
    const cur = arr[i];

    if (count === 0) {
      const prev = candidate;
      candidate = cur;
      count = 1;
      steps.push({
        i,
        candidate,
        count,
        action: i === 0 ? 'init' : 'switch',
        flash: true,
        prevCandidate: prev,
        phase: 'voting',
        verifyCount: 0,
        verifyIndex: -1,
        verified: null,
        narration:
          i === 0
            ? `Start at index 0. count is 0, so adopt nums[0] = ${cur} as the candidate and set count = 1.`
            : `count hit 0 at index ${i}. Drop the old candidate ${prev} and adopt nums[${i}] = ${cur} as the new candidate with count = 1.`,
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
        verifyCount: 0,
        verifyIndex: -1,
        verified: null,
        narration: `nums[${i}] = ${cur} matches the candidate. count rises to ${count}.`,
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
        verifyCount: 0,
        verifyIndex: -1,
        verified: null,
        narration: `nums[${i}] = ${cur} disagrees with candidate ${candidate}. count drops to ${count}.`,
      });
    }
  }

  steps.push({
    i: arr.length - 1,
    candidate,
    count,
    action: 'survivor',
    flash: false,
    phase: 'voting-done',
    verifyCount: 0,
    verifyIndex: -1,
    verified: null,
    narration: `Voting pass complete. Survivor candidate is ${candidate}. Run a verification pass to confirm strict majority.`,
  });

  let counted = 0;
  for (let i = 0; i < arr.length; i++) {
    const match = arr[i] === candidate;
    if (match) counted += 1;
    steps.push({
      i: arr.length - 1,
      candidate,
      count,
      action: 'verify',
      flash: false,
      phase: 'verifying',
      verifyCount: counted,
      verifyIndex: i,
      verified: null,
      narration: match
        ? `Verify: nums[${i}] = ${arr[i]} matches ${candidate}. Real count = ${counted}.`
        : `Verify: nums[${i}] = ${arr[i]} does not match ${candidate}. Real count stays ${counted}.`,
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
    verifyCount: counted,
    verifyIndex: arr.length - 1,
    verified: isMajority,
    narration: isMajority
      ? `${candidate} appears ${counted} of ${arr.length} times — strictly more than n/2 = ${arr.length / 2}. Confirmed majority element.`
      : `${candidate} appears ${counted} of ${arr.length} times — not strictly more than n/2 = ${arr.length / 2}. No majority element exists.`,
  });

  return steps;
}

function Pointer({ index, label, offsetX, baselineY }) {
  if (index == null || index < 0) return null;
  const cx = offsetX + index * (CELL_W + CELL_GAP) + CELL_W / 2;
  const tipY = baselineY - 4;
  const baseY = baselineY - 20;
  const textY = baselineY - 30;
  const labelY = baselineY - 44;
  return (
    <g className="bmvv-ptr" aria-hidden="true">
      <path
        className="bmvv-ptr-arrow"
        d={`M ${cx} ${tipY} L ${cx - 6} ${baseY} L ${cx + 6} ${baseY} Z`}
      />
      <line className="bmvv-ptr-stem" x1={cx} y1={baseY} x2={cx} y2={textY} />
      <text className="bmvv-ptr-text" x={cx} y={labelY}>
        {label}
      </text>
    </g>
  );
}

function VerifyTick({ index, offsetX, yTop }) {
  if (index == null || index < 0) return null;
  const cx = offsetX + index * (CELL_W + CELL_GAP) + CELL_W / 2;
  const y1 = yTop + CELL_H + 14;
  const y2 = yTop + CELL_H + 26;
  return (
    <g className="bmvv-verify-ptr" aria-hidden="true">
      <path
        className="bmvv-verify-arrow"
        d={`M ${cx} ${y1} L ${cx - 5} ${y2} L ${cx + 5} ${y2} Z`}
      />
    </g>
  );
}

export default function BoyerMooreVotingViz({ initialArray = DEFAULT_ARR }) {
  const [arr, setArr] = useState(initialArray);
  const [draft, setDraft] = useState(initialArray.join(','));
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

  const applyDraft = () => {
    const parsed = draft
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map(Number)
      .filter((n) => Number.isFinite(n) && Number.isInteger(n));
    if (parsed.length === 0) return;
    if (parsed.length > 24) {
      parsed.length = 24;
    }
    stop();
    setArr(parsed);
    setStepIdx(0);
  };

  const loadDefault = () => {
    stop();
    setArr(DEFAULT_ARR);
    setDraft(DEFAULT_ARR.join(','));
    setStepIdx(0);
  };

  const randomize = () => {
    const n = 7 + Math.floor(Math.random() * 6); // 7-12
    const pool = [1, 2, 3, 4];
    const next = Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]);
    stop();
    setArr(next);
    setDraft(next.join(','));
    setStepIdx(0);
  };

  // SVG geometry
  const cols = Math.max(arr.length, 1);
  const stageW = PAD_X * 2 + cols * CELL_W + (cols - 1) * CELL_GAP;
  const showVerify =
    current.phase === 'verifying' ||
    current.phase === 'done-majority' ||
    current.phase === 'done-no-majority';
  const stageH =
    HEADER_H +
    POINTER_H +
    CELL_H +
    INDEX_H +
    (showVerify ? 30 : 10) +
    PANEL_GAP_Y +
    PANEL_H +
    16;

  const headerY = 18;
  const rowY = HEADER_H + POINTER_H;
  const indexY = rowY + CELL_H + 16;
  const pointerBaseline = rowY;
  const panelY = rowY + CELL_H + INDEX_H + (showVerify ? 30 : 10) + PANEL_GAP_Y;

  const showVotingPointer =
    current.phase === 'voting' || current.phase === 'voting-done';
  const showVerifyPointer = current.phase === 'verifying';

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
        ? 'Voting done'
        : current.phase === 'verifying'
          ? 'Verifying'
          : current.phase === 'done-majority'
            ? 'Majority'
            : current.phase === 'done-no-majority'
              ? 'No majority'
              : 'Empty';

  const actionLabel = (() => {
    switch (current.action) {
      case 'init': return 'init candidate';
      case 'support': return 'count + 1';
      case 'oppose': return 'count - 1';
      case 'switch': return 'swap candidate';
      case 'survivor': return 'survivor';
      case 'verify': return 'verify pass';
      case 'final': return current.verified ? 'majority confirmed' : 'rejected';
      case 'empty': return 'empty';
      default: return '';
    }
  })();

  // Candidate slot + count panel: SVG centered group.
  const panelCx = stageW / 2;
  const slotW = 96;
  const slotH = PANEL_H;
  const slotGap = 22;
  const candX = panelCx - slotW - slotGap / 2;
  const countX = panelCx + slotGap / 2;

  return (
    <div className="bmvv" role="group" aria-label="Boyer-Moore majority voting visualization">
      <div className="bmvv-head">
        <h3 className="bmvv-title">Boyer-Moore Majority Vote</h3>
        <div className="bmvv-step-counter">
          step <strong>{stepIdx}</strong> / {Math.max(totalSteps - 1, 0)}
        </div>
      </div>

      <div className="bmvv-controls">
        <label className="bmvv-input-group">
          <span className="bmvv-input-label">array</span>
          <input
            className="bmvv-input"
            type="text"
            value={draft}
            placeholder="2,2,1,1,1,2,2"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyDraft(); }}
            aria-label="Comma-separated integers"
          />
          <button
            type="button"
            className="bmvv-btn"
            onClick={applyDraft}
            aria-label="Apply array"
          >
            apply
          </button>
        </label>

        <button type="button" className="bmvv-btn" onClick={loadDefault}>
          <RefreshCw size={12} /> sample
        </button>
        <button type="button" className="bmvv-btn" onClick={randomize}>
          <Shuffle size={12} /> random
        </button>

        <span className="bmvv-spacer" aria-hidden="true" />

        <button
          type="button"
          className="bmvv-btn"
          onClick={stepOnce}
          disabled={isRunning || isTerminal || arr.length === 0}
        >
          <StepForward size={14} /> Step
        </button>
        <button
          type="button"
          className="bmvv-btn bmvv-btn-primary"
          onClick={handleRunToggle}
          disabled={arr.length === 0}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'Pause' : (isTerminal ? 'Replay' : 'Run')}
        </button>
        <button
          type="button"
          className="bmvv-btn bmvv-btn-danger"
          onClick={reset}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="bmvv-stage-wrap">
        {arr.length === 0 ? (
          <div className="bmvv-empty">Enter at least one integer to begin.</div>
        ) : (
          <svg
            className="bmvv-stage"
            viewBox={`0 0 ${stageW} ${stageH}`}
            width={stageW}
            height={stageH}
            role="img"
            aria-label="Boyer-Moore voting stage"
          >
            <text className="bmvv-header-line" x={PAD_X} y={headerY + 12}>
              n = <tspan className="k">{arr.length}</tspan>
              <tspan dx="16" fill="var(--text-dim)">
                strict majority threshold &gt; {Math.floor(arr.length / 2)}
              </tspan>
              <tspan dx="16" fill="var(--text-dim)">
                phase: <tspan className="k">{phaseLabel}</tspan>
              </tspan>
            </text>

            {arr.map((v, i) => {
              const x = PAD_X + i * (CELL_W + CELL_GAP);
              const isCurrent =
                (current.phase === 'voting' || current.phase === 'voting-done') &&
                current.i === i;
              const isCandMatch =
                current.candidate != null &&
                v === current.candidate &&
                current.phase !== 'done-empty';
              const isVerifyMatch =
                current.phase === 'verifying' &&
                current.verifyIndex >= i &&
                v === current.candidate;
              const isVerifyCurrent =
                current.phase === 'verifying' && current.verifyIndex === i;
              const isFinalMaj =
                current.phase === 'done-majority' && v === current.candidate;

              const rectCls = [
                'bmvv-cell-rect',
                isCurrent && 'is-current',
                isCandMatch && !isCurrent && 'is-cand-match',
                isVerifyCurrent && 'is-verify-current',
                isVerifyMatch && !isVerifyCurrent && 'is-verify-match',
                isFinalMaj && 'is-final-majority',
              ].filter(Boolean).join(' ');

              const txtCls = [
                'bmvv-cell-value',
                isCurrent && 'is-current',
                isCandMatch && 'is-cand-match',
                isFinalMaj && 'is-final-majority',
              ].filter(Boolean).join(' ');

              return (
                <g key={i}>
                  <rect
                    className={rectCls}
                    x={x}
                    y={rowY}
                    width={CELL_W}
                    height={CELL_H}
                    rx={7}
                    ry={7}
                  />
                  <text
                    className={txtCls}
                    x={x + CELL_W / 2}
                    y={rowY + CELL_H / 2}
                  >
                    {v}
                  </text>
                  <text
                    className="bmvv-cell-idx"
                    x={x + CELL_W / 2}
                    y={indexY}
                  >
                    {i}
                  </text>
                </g>
              );
            })}

            {showVotingPointer && current.i >= 0 && (
              <Pointer
                index={current.i}
                label="i"
                offsetX={PAD_X}
                baselineY={pointerBaseline}
              />
            )}

            {showVerifyPointer && current.verifyIndex >= 0 && (
              <VerifyTick
                index={current.verifyIndex}
                offsetX={PAD_X}
                yTop={rowY}
              />
            )}

            {/* Candidate + count slot panel */}
            <g className="bmvv-panel">
              {/* Candidate slot */}
              <rect
                className={`bmvv-slot bmvv-slot-cand ${current.flash ? 'is-flash' : ''}`}
                x={candX}
                y={panelY}
                width={slotW}
                height={slotH}
                rx={10}
                ry={10}
              />
              <text className="bmvv-slot-label" x={candX + slotW / 2} y={panelY + 18}>
                candidate
              </text>
              <text
                className="bmvv-slot-value bmvv-slot-cand-value"
                x={candX + slotW / 2}
                y={panelY + slotH / 2 + 12}
              >
                {current.candidate == null ? '—' : current.candidate}
              </text>

              {/* Count slot */}
              <rect
                className={`bmvv-slot bmvv-slot-count ${countTone}`}
                x={countX}
                y={panelY}
                width={slotW}
                height={slotH}
                rx={10}
                ry={10}
              />
              <text className="bmvv-slot-label" x={countX + slotW / 2} y={panelY + 18}>
                count
              </text>
              <text
                className={`bmvv-slot-value bmvv-slot-count-value ${countTone}`}
                x={countX + slotW / 2}
                y={panelY + slotH / 2 + 12}
              >
                {current.count}
              </text>

              {/* Action label below */}
              {actionLabel && (
                <text
                  className="bmvv-action-line"
                  x={panelCx}
                  y={panelY + slotH + 18}
                >
                  action: <tspan className="k">{actionLabel}</tspan>
                </text>
              )}

              {/* Verify count */}
              {showVerify && (
                <text
                  className="bmvv-verify-line"
                  x={panelCx}
                  y={panelY + slotH + 34}
                >
                  real count: <tspan className="k">{current.verifyCount}</tspan>
                  <tspan dx="10" fill="var(--text-dim)">
                    of {arr.length}
                  </tspan>
                </text>
              )}
            </g>
          </svg>
        )}
      </div>

      <div className="bmvv-narration">
        <span className="bmvv-card-label">Step narration</span>
        <div className="bmvv-card-body">{current.narration}</div>
      </div>

      {current.phase === 'done-majority' && (
        <div className="bmvv-status is-found" role="status">
          <span className="bmvv-status-dot" />
          Majority element: {current.candidate} ({current.verifyCount} of {arr.length})
        </div>
      )}
      {current.phase === 'done-no-majority' && (
        <div className="bmvv-status is-missing" role="status">
          <span className="bmvv-status-dot" />
          No majority — survivor {current.candidate} only appears {current.verifyCount} of {arr.length} times
        </div>
      )}

      <div className="bmvv-legend" aria-hidden="true">
        <span className="bmvv-legend-item"><span className="bmvv-legend-swatch current" /> current i</span>
        <span className="bmvv-legend-item"><span className="bmvv-legend-swatch cand" /> matches candidate</span>
        <span className="bmvv-legend-item"><span className="bmvv-legend-swatch verify" /> verify scan</span>
        <span className="bmvv-legend-item"><span className="bmvv-legend-swatch final" /> majority element</span>
      </div>
    </div>
  );
}
