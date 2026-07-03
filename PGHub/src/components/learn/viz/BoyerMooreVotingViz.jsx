import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Play, Pause, StepForward, RotateCcw, RefreshCw, Shuffle } from 'lucide-react';
import './BoyerMooreVotingViz.css';

// Boyer-Moore Majority Vote — MANIM-style SVG step-through.
// Standalone — render as <BoyerMooreVotingViz />. Use site theme tokens only.
// Two modes: majority (n/2, one candidate) and extended (n/3, two candidates).

const DEFAULT_MAJORITY = [2, 2, 1, 1, 1, 2, 2];
const DEFAULT_EXTENDED = [1, 1, 1, 3, 3, 2, 2, 2];
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

// --- Majority (n/2) ---------------------------------------------------------
function buildMajoritySteps(arr) {
  const steps = [];

  if (arr.length === 0) {
    steps.push({
      mode: 'majority', i: -1, candidates: [null], counts: [0], activeSlot: -1,
      action: 'empty', flash: -1, phase: 'done-empty',
      verifyCount: 0, verifyIndex: -1, verified: null,
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
        mode: 'majority', i, candidates: [candidate], counts: [count], activeSlot: 0,
        action: i === 0 ? 'init' : 'switch', flash: 0, phase: 'voting',
        verifyCount: 0, verifyIndex: -1, verified: null,
        narration: i === 0
          ? `Start at index 0. count is 0, so adopt nums[0] = ${cur} as the candidate and set count = 1.`
          : `count hit 0 at index ${i}. Drop the old candidate ${prev} and adopt nums[${i}] = ${cur} as the new candidate with count = 1.`,
      });
    } else if (cur === candidate) {
      count += 1;
      steps.push({
        mode: 'majority', i, candidates: [candidate], counts: [count], activeSlot: 0,
        action: 'support', flash: -1, phase: 'voting',
        verifyCount: 0, verifyIndex: -1, verified: null,
        narration: `nums[${i}] = ${cur} matches the candidate. count rises to ${count}.`,
      });
    } else {
      count -= 1;
      steps.push({
        mode: 'majority', i, candidates: [candidate], counts: [count], activeSlot: 0,
        action: 'oppose', flash: -1, phase: 'voting',
        verifyCount: 0, verifyIndex: -1, verified: null,
        narration: `nums[${i}] = ${cur} disagrees with candidate ${candidate}. count drops to ${count}.`,
      });
    }
  }

  steps.push({
    mode: 'majority', i: arr.length - 1, candidates: [candidate], counts: [count], activeSlot: -1,
    action: 'survivor', flash: -1, phase: 'voting-done',
    verifyCount: 0, verifyIndex: -1, verified: null,
    narration: `Voting pass complete. Survivor candidate is ${candidate}. Run a verification pass to confirm strict majority.`,
  });

  let counted = 0;
  for (let i = 0; i < arr.length; i++) {
    const match = arr[i] === candidate;
    if (match) counted += 1;
    steps.push({
      mode: 'majority', i: arr.length - 1, candidates: [candidate], counts: [count], activeSlot: -1,
      action: 'verify', flash: -1, phase: 'verifying',
      verifyCount: counted, verifyIndex: i, verified: null,
      narration: match
        ? `Verify: nums[${i}] = ${arr[i]} matches ${candidate}. Real count = ${counted}.`
        : `Verify: nums[${i}] = ${arr[i]} does not match ${candidate}. Real count stays ${counted}.`,
    });
  }

  const isMajority = counted > arr.length / 2;
  steps.push({
    mode: 'majority', i: arr.length - 1, candidates: [candidate], counts: [count], activeSlot: -1,
    action: 'final', flash: -1, phase: isMajority ? 'done-majority' : 'done-no-majority',
    verifyCount: counted, verifyIndex: arr.length - 1, verified: isMajority ? candidate : false,
    narration: isMajority
      ? `${candidate} appears ${counted} of ${arr.length} times — strictly more than n/2 = ${arr.length / 2}. Confirmed majority element.`
      : `${candidate} appears ${counted} of ${arr.length} times — not strictly more than n/2 = ${arr.length / 2}. No majority element exists.`,
  });

  return steps;
}

// --- Extended (n/3) ---------------------------------------------------------
function buildExtendedSteps(arr) {
  const steps = [];

  if (arr.length === 0) {
    steps.push({
      mode: 'extended', i: -1, candidates: [null, null], counts: [0, 0], activeSlot: -1,
      action: 'empty', flash: -1, phase: 'done-empty',
      verifyCounts: [0, 0], verifyIndex: -1, verified: [],
      narration: 'Empty array — nothing to vote on.',
    });
    return steps;
  }

  let c1 = null;
  let c2 = null;
  let n1 = 0;
  let n2 = 0;

  for (let i = 0; i < arr.length; i++) {
    const cur = arr[i];
    if (c1 !== null && cur === c1) {
      n1 += 1;
      steps.push({
        mode: 'extended', i, candidates: [c1, c2], counts: [n1, n2], activeSlot: 0,
        action: 'support', flash: -1, phase: 'voting',
        verifyCounts: [0, 0], verifyIndex: -1, verified: null,
        narration: `nums[${i}] = ${cur} matches candidate 1 (${c1}). count1 rises to ${n1}.`,
      });
    } else if (c2 !== null && cur === c2) {
      n2 += 1;
      steps.push({
        mode: 'extended', i, candidates: [c1, c2], counts: [n1, n2], activeSlot: 1,
        action: 'support', flash: -1, phase: 'voting',
        verifyCounts: [0, 0], verifyIndex: -1, verified: null,
        narration: `nums[${i}] = ${cur} matches candidate 2 (${c2}). count2 rises to ${n2}.`,
      });
    } else if (n1 === 0) {
      c1 = cur;
      n1 = 1;
      steps.push({
        mode: 'extended', i, candidates: [c1, c2], counts: [n1, n2], activeSlot: 0,
        action: 'switch', flash: 0, phase: 'voting',
        verifyCounts: [0, 0], verifyIndex: -1, verified: null,
        narration: `count1 is 0 at index ${i}. Adopt nums[${i}] = ${cur} as candidate 1 with count1 = 1.`,
      });
    } else if (n2 === 0) {
      c2 = cur;
      n2 = 1;
      steps.push({
        mode: 'extended', i, candidates: [c1, c2], counts: [n1, n2], activeSlot: 1,
        action: 'switch', flash: 1, phase: 'voting',
        verifyCounts: [0, 0], verifyIndex: -1, verified: null,
        narration: `count2 is 0 at index ${i}. Adopt nums[${i}] = ${cur} as candidate 2 with count2 = 1.`,
      });
    } else {
      n1 -= 1;
      n2 -= 1;
      steps.push({
        mode: 'extended', i, candidates: [c1, c2], counts: [n1, n2], activeSlot: -1,
        action: 'oppose', flash: -1, phase: 'voting',
        verifyCounts: [0, 0], verifyIndex: -1, verified: null,
        narration: `nums[${i}] = ${cur} matches neither candidate. Decrement both: count1 = ${n1}, count2 = ${n2}.`,
      });
    }
  }

  steps.push({
    mode: 'extended', i: arr.length - 1, candidates: [c1, c2], counts: [n1, n2], activeSlot: -1,
    action: 'survivor', flash: -1, phase: 'voting-done',
    verifyCounts: [0, 0], verifyIndex: -1, verified: null,
    narration: `Voting pass complete. Surviving candidates are ${c1} and ${c2}. Verify each against the n/3 threshold.`,
  });

  let occ1 = 0;
  let occ2 = 0;
  for (let i = 0; i < arr.length; i++) {
    if (c1 !== null && arr[i] === c1) occ1 += 1;
    else if (c2 !== null && arr[i] === c2) occ2 += 1;
    steps.push({
      mode: 'extended', i: arr.length - 1, candidates: [c1, c2], counts: [n1, n2], activeSlot: -1,
      action: 'verify', flash: -1, phase: 'verifying',
      verifyCounts: [occ1, occ2], verifyIndex: i, verified: null,
      narration: `Verify nums[${i}] = ${arr[i]}: count of ${c1} = ${occ1}, count of ${c2} = ${occ2}.`,
    });
  }

  const thr = Math.floor(arr.length / 3);
  const winners = [];
  if (c1 !== null && occ1 > thr) winners.push(c1);
  if (c2 !== null && occ2 > thr) winners.push(c2);
  steps.push({
    mode: 'extended', i: arr.length - 1, candidates: [c1, c2], counts: [n1, n2], activeSlot: -1,
    action: 'final', flash: -1, phase: winners.length ? 'done-majority' : 'done-no-majority',
    verifyCounts: [occ1, occ2], verifyIndex: arr.length - 1, verified: winners,
    narration: winners.length
      ? `Threshold > n/3 = ${thr}. ${c1} appears ${occ1}x, ${c2} appears ${occ2}x. Elements over n/3: {${winners.join(', ')}}.`
      : `Threshold > n/3 = ${thr}. ${c1} appears ${occ1}x, ${c2} appears ${occ2}x. Neither exceeds n/3 — no element appears more than n/3 times.`,
  });

  return steps;
}

function buildSteps(arr, mode) {
  return mode === 'extended' ? buildExtendedSteps(arr) : buildMajoritySteps(arr);
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

export default function BoyerMooreVotingViz() {
  const [mode, setMode] = useState('majority');
  const [arr, setArr] = useState(DEFAULT_MAJORITY);
  const [draft, setDraft] = useState(DEFAULT_MAJORITY.join(','));
  const [stepIdx, setStepIdx] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const runTimer = useRef(null);

  const isExt = mode === 'extended';
  const steps = useMemo(() => buildSteps(arr, mode), [arr, mode]);
  const current = steps[stepIdx] || steps[0];
  const totalSteps = steps.length;
  const isTerminal =
    current.phase === 'done-majority' ||
    current.phase === 'done-no-majority' ||
    current.phase === 'done-empty';
  const isRunning = isRunningRaw && stepIdx < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  const candidates = current.candidates;
  const counts = current.counts;

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

  // Auto-run loop. `isRunning` is derived above from a raw toggle + bounds check
  // so the effect never needs to call setIsRunning(false) at the end.
  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStepIdx((i) => Math.min(i + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, stepIdx, delay, totalSteps]);

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

  const switchMode = (m) => {
    if (m === mode) return;
    stop();
    const next = m === 'extended' ? DEFAULT_EXTENDED : DEFAULT_MAJORITY;
    setMode(m);
    setArr(next);
    setDraft(next.join(','));
    setStepIdx(0);
  };

  const applyDraft = () => {
    const parsed = draft
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map(Number)
      .filter((x) => Number.isFinite(x) && Number.isInteger(x));
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
    const next = isExt ? DEFAULT_EXTENDED : DEFAULT_MAJORITY;
    setArr(next);
    setDraft(next.join(','));
    setStepIdx(0);
  };

  const randomize = () => {
    const n = 8 + Math.floor(Math.random() * 5); // 8-12
    const next = [];
    if (isExt) {
      const a = 1 + Math.floor(Math.random() * 4);
      const b = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const r = Math.random();
        if (r < 0.4) next.push(a);
        else if (r < 0.75) next.push(b);
        else next.push(1 + Math.floor(Math.random() * 6));
      }
    } else {
      const maj = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        next.push(Math.random() < 0.58 ? maj : 1 + Math.floor(Math.random() * 6));
      }
    }
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

  const countTone = (idx) => {
    if (counts[idx] === 0) return 'is-zero';
    if (current.action === 'support' && current.activeSlot === idx) return 'is-up';
    if (current.action === 'oppose') return 'is-down';
    return '';
  };

  const phaseLabel =
    current.phase === 'voting'
      ? 'Voting'
      : current.phase === 'voting-done'
        ? 'Voting done'
        : current.phase === 'verifying'
          ? 'Verifying'
          : current.phase === 'done-majority'
            ? (isExt ? 'Found' : 'Majority')
            : current.phase === 'done-no-majority'
              ? 'None'
              : 'Empty';

  const actionLabel = (() => {
    switch (current.action) {
      case 'init': return 'init candidate';
      case 'support': return 'count + 1';
      case 'oppose': return isExt ? 'both count - 1' : 'count - 1';
      case 'switch': return 'adopt candidate';
      case 'survivor': return 'survivor';
      case 'verify': return 'verify pass';
      case 'final': return current.phase === 'done-majority' ? 'confirmed' : 'rejected';
      case 'empty': return 'empty';
      default: return '';
    }
  })();

  const thresholdLabel = isExt
    ? `n/3 threshold > ${Math.floor(arr.length / 3)}`
    : `strict majority threshold > ${Math.floor(arr.length / 2)}`;

  // Candidate slot + count panel: centered group, supports 1 or 2 candidate pairs.
  const panelCx = stageW / 2;
  const slotW = 96;
  const slotH = PANEL_H;
  const slotGap = 22;
  const groupGap = 56;
  const pairW = slotW * 2 + slotGap;
  const slotKey = isExt ? candidates.length : 1;
  // x of left edge of slot group(s)
  const groupLeft = isExt
    ? panelCx - pairW - groupGap / 2
    : panelCx - pairW / 2;

  // Renders one candidate+count pair starting at left edge x.
  const renderPair = (slotIdx, leftX, labelSuffix) => {
    const candX = leftX;
    const countX = leftX + slotW + slotGap;
    const cand = candidates[slotIdx];
    return (
      <g key={`pair-${slotIdx}`}>
        <rect
          className={`bmvv-slot bmvv-slot-cand ${current.flash === slotIdx ? 'is-flash' : ''}`}
          x={candX} y={panelY} width={slotW} height={slotH} rx={10} ry={10}
        />
        <text className="bmvv-slot-label" x={candX + slotW / 2} y={panelY + 18}>
          {`candidate${labelSuffix}`}
        </text>
        <text
          className="bmvv-slot-value bmvv-slot-cand-value"
          x={candX + slotW / 2} y={panelY + slotH / 2 + 12}
        >
          {cand == null ? '—' : cand}
        </text>

        <rect
          className={`bmvv-slot bmvv-slot-count ${countTone(slotIdx)}`}
          x={countX} y={panelY} width={slotW} height={slotH} rx={10} ry={10}
        />
        <text className="bmvv-slot-label" x={countX + slotW / 2} y={panelY + 18}>
          {`count${labelSuffix}`}
        </text>
        <text
          className={`bmvv-slot-value bmvv-slot-count-value ${countTone(slotIdx)}`}
          x={countX + slotW / 2} y={panelY + slotH / 2 + 12}
        >
          {counts[slotIdx]}
        </text>
      </g>
    );
  };

  const verifiedReadout = (() => {
    if (current.verified == null) return '—';
    if (isExt) {
      return current.verified.length ? `{${current.verified.join(', ')}}` : 'none';
    }
    return current.verified === false ? 'none' : String(current.verified);
  })();

  return (
    <div className="bmvv" role="group" aria-label="Boyer-Moore majority voting visualization">
      <div className="bmvv-head">
        <h3 className="bmvv-title">Boyer-Moore Voting</h3>
        <div className="bmvv-step-counter">
          step <strong>{stepIdx}</strong> / {Math.max(totalSteps - 1, 0)}
        </div>
      </div>

      <div className="bmvv-controls">
        <div className="bmvv-modes" role="tablist" aria-label="Voting variant">
          <button
            type="button"
            className={`bmvv-mode ${!isExt ? 'is-on' : ''}`}
            onClick={() => switchMode('majority')}
            aria-pressed={!isExt}
          >
            majority (n/2)
          </button>
          <button
            type="button"
            className={`bmvv-mode ${isExt ? 'is-on' : ''}`}
            onClick={() => switchMode('extended')}
            aria-pressed={isExt}
          >
            extended (n/3)
          </button>
        </div>

        <label className="bmvv-input-group">
          <span className="bmvv-input-label">array</span>
          <input
            className="bmvv-input"
            type="text"
            value={draft}
            placeholder={isExt ? '1,1,1,3,3,2,2,2' : '2,2,1,1,1,2,2'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyDraft(); }}
            aria-label="Comma-separated integers"
          />
          <button type="button" className="bmvv-btn" onClick={applyDraft} aria-label="Apply array">
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
        <button type="button" className="bmvv-btn bmvv-btn-danger" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
        <label className="bmvv-speed">
          <span className="bmvv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bmvv-speed-range"
          />
          <span className="bmvv-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>

      <div className="bmvv-stage-wrap">
        {arr.length === 0 ? (
          <div className="bmvv-empty">Enter at least one integer to begin.</div>
        ) : (
          <svg
            className="bmvv-stage"
            viewBox={`0 0 ${stageW} ${stageH}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Boyer-Moore voting stage"
          >
            <text className="bmvv-header-line" x={PAD_X} y={headerY + 12}>
              n = <tspan className="k">{arr.length}</tspan>
              <tspan dx="16" fill="var(--text-dim)">{thresholdLabel}</tspan>
              <tspan dx="16" fill="var(--text-dim)">
                phase: <tspan className="k">{phaseLabel}</tspan>
              </tspan>
            </text>

            {arr.map((v, i) => {
              const x = PAD_X + i * (CELL_W + CELL_GAP);
              const isCurrent =
                (current.phase === 'voting' || current.phase === 'voting-done') &&
                current.i === i;
              const matchesCand =
                current.phase !== 'done-empty' &&
                ((candidates[0] != null && v === candidates[0]) ||
                  (isExt && candidates[1] != null && v === candidates[1]));
              const isVerifyMatch =
                current.phase === 'verifying' &&
                current.verifyIndex >= i &&
                matchesCand;
              const isVerifyCurrent =
                current.phase === 'verifying' && current.verifyIndex === i;
              const isFinalMaj =
                current.phase === 'done-majority' && matchesCand;

              const rectCls = [
                'bmvv-cell-rect',
                isCurrent && 'is-current',
                matchesCand && !isCurrent && 'is-cand-match',
                isVerifyCurrent && 'is-verify-current',
                isVerifyMatch && !isVerifyCurrent && 'is-verify-match',
                isFinalMaj && 'is-final-majority',
              ].filter(Boolean).join(' ');

              const txtCls = [
                'bmvv-cell-value',
                isCurrent && 'is-current',
                matchesCand && 'is-cand-match',
                isFinalMaj && 'is-final-majority',
              ].filter(Boolean).join(' ');

              return (
                <g key={i}>
                  <rect className={rectCls} x={x} y={rowY} width={CELL_W} height={CELL_H} rx={7} ry={7} />
                  <text className={txtCls} x={x + CELL_W / 2} y={rowY + CELL_H / 2}>{v}</text>
                  <text className="bmvv-cell-idx" x={x + CELL_W / 2} y={indexY}>{i}</text>
                </g>
              );
            })}

            {showVotingPointer && current.i >= 0 && (
              <Pointer index={current.i} label="i" offsetX={PAD_X} baselineY={pointerBaseline} />
            )}

            {showVerifyPointer && current.verifyIndex >= 0 && (
              <VerifyTick index={current.verifyIndex} offsetX={PAD_X} yTop={rowY} />
            )}

            {/* Candidate + count panel(s) */}
            <g className="bmvv-panel" key={`panel-${slotKey}`}>
              {!isExt && renderPair(0, groupLeft, '')}
              {isExt && renderPair(0, groupLeft, ' 1')}
              {isExt && renderPair(1, groupLeft + pairW + groupGap, ' 2')}

              {actionLabel && (
                <text className="bmvv-action-line" x={panelCx} y={panelY + slotH + 18}>
                  action: <tspan className="k">{actionLabel}</tspan>
                </text>
              )}

              {showVerify && !isExt && (
                <text className="bmvv-verify-line" x={panelCx} y={panelY + slotH + 34}>
                  real count: <tspan className="k">{current.verifyCount}</tspan>
                  <tspan dx="10" fill="var(--text-dim)">of {arr.length}</tspan>
                </text>
              )}
              {showVerify && isExt && (
                <text className="bmvv-verify-line" x={panelCx} y={panelY + slotH + 34}>
                  real counts: <tspan className="k">{current.verifyCounts[0]}</tspan>
                  <tspan dx="6" fill="var(--text-dim)">/ {candidates[0] == null ? '—' : candidates[0]}</tspan>
                  <tspan dx="14" className="k">{current.verifyCounts[1]}</tspan>
                  <tspan dx="6" fill="var(--text-dim)">/ {candidates[1] == null ? '—' : candidates[1]}</tspan>
                </text>
              )}
            </g>
          </svg>
        )}
      </div>

      <div className="bmvv-readout">
        <div className="bmvv-readout-item">
          <span className="bmvv-readout-label">{isExt ? 'candidate 1' : 'candidate'}</span>
          <span className="bmvv-readout-value">
            {candidates[0] == null ? '—' : candidates[0]}
            <span className="bmvv-readout-sub"> · cnt {counts[0]}</span>
          </span>
        </div>
        {isExt && (
          <div className="bmvv-readout-item">
            <span className="bmvv-readout-label">candidate 2</span>
            <span className="bmvv-readout-value">
              {candidates[1] == null ? '—' : candidates[1]}
              <span className="bmvv-readout-sub"> · cnt {counts[1]}</span>
            </span>
          </div>
        )}
        <div className="bmvv-readout-item">
          <span className="bmvv-readout-label">{isExt ? 'verified (> n/3)' : 'verified majority'}</span>
          <span className="bmvv-readout-value">{verifiedReadout}</span>
        </div>
      </div>

      <div className="bmvv-narration">
        <span className="bmvv-card-label">Step narration</span>
        <div className="bmvv-card-body">{current.narration}</div>
      </div>

      {current.phase === 'done-majority' && (
        <div className="bmvv-status is-found" role="status">
          <span className="bmvv-status-dot" />
          {isExt
            ? `Elements appearing more than n/3 times: {${current.verified.join(', ')}}`
            : `Majority element: ${candidates[0]} (${current.verifyCount} of ${arr.length})`}
        </div>
      )}
      {current.phase === 'done-no-majority' && (
        <div className="bmvv-status is-missing" role="status">
          <span className="bmvv-status-dot" />
          {isExt
            ? 'No element appears more than n/3 times'
            : `No majority — survivor ${candidates[0]} only appears ${current.verifyCount} of ${arr.length} times`}
        </div>
      )}

      <div className="bmvv-legend" aria-hidden="true">
        <span className="bmvv-legend-item"><span className="bmvv-legend-swatch current" /> current i</span>
        <span className="bmvv-legend-item"><span className="bmvv-legend-swatch cand" /> matches candidate</span>
        <span className="bmvv-legend-item"><span className="bmvv-legend-swatch verify" /> verify scan</span>
        <span className="bmvv-legend-item"><span className="bmvv-legend-swatch final" /> confirmed element</span>
      </div>
    </div>
  );
}
