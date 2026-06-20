import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ArrowDownNarrowWide } from 'lucide-react';
import './MoAlgorithmViz.css';

const ARR = [4, 1, 3, 1, 5, 2, 3, 4, 5, 1, 2, 3];
const QUERIES = [
  { l: 1, r: 5 },
  { l: 0, r: 3 },
  { l: 4, r: 9 },
  { l: 2, r: 7 },
  { l: 6, r: 11 },
];

const W = 940;
const H = 420;

// Build the full step-by-step trace of Mo's algorithm processing the queries.
// Each individual pointer move (one curL/curR shift = one add/remove) is its own
// frame, so the reader watches the window grow and shrink one element at a time.
function buildFrames(arr, queriesIn) {
  const n = arr.length;
  const block = Math.max(1, Math.floor(Math.sqrt(n)));

  const queries = queriesIn.map((q, i) => ({ ...q, idx: i, block: Math.floor(q.l / block) }));
  const ordered = [...queries].sort((a, b) => {
    if (a.block !== b.block) return a.block - b.block;
    // odd-even r ordering keeps total R-travel low across a block
    return a.block % 2 === 0 ? a.r - b.r : b.r - a.r;
  });

  const freq = new Map();
  let answer = 0;
  let curL = 0;
  let curR = -1;
  let moves = 0;

  const distinct = () => answer;
  const add = (i) => {
    const v = arr[i];
    const c = freq.get(v) || 0;
    if (c === 0) answer += 1;
    freq.set(v, c + 1);
  };
  const remove = (i) => {
    const v = arr[i];
    const c = freq.get(v) || 0;
    if (c === 1) answer -= 1;
    freq.set(v, c - 1);
  };

  const frames = [];
  const results = {};

  const snap = (extra) => ({
    curL,
    curR,
    moves,
    answer: distinct(),
    activeQuery: null,
    touched: null,
    touchedKind: null,
    results: { ...results },
    orderRank: extra.orderRank ?? null,
    ...extra,
  });

  frames.push(snap({
    phase: 'sort',
    note: `Offline trick: sort all ${queries.length} queries by (block of l, then r). Block size = floor(sqrt(${n})) = ${block}. Sorted order lets the two pointers drift instead of jumping, so total movement stays O((n+q)*sqrt(n)).`,
  }));

  for (let rank = 0; rank < ordered.length; rank += 1) {
    const q = ordered[rank];
    frames.push(snap({
      phase: 'open',
      activeQuery: q.idx,
      orderRank: rank,
      note: `Query ${q.idx} = [${q.l}, ${q.r}] (block ${q.block}). Move curL/curR from [${curL}, ${curR}] to [${q.l}, ${q.r}].`,
    }));

    while (curR < q.r) {
      curR += 1;
      add(curR);
      moves += 1;
      frames.push(snap({
        phase: 'add-r',
        activeQuery: q.idx,
        orderRank: rank,
        touched: curR,
        touchedKind: 'add',
        note: `R -> ${curR}: add a[${curR}] = ${arr[curR]}. distinct = ${answer}. moves = ${moves}.`,
      }));
    }
    while (curL > q.l) {
      curL -= 1;
      add(curL);
      moves += 1;
      frames.push(snap({
        phase: 'add-l',
        activeQuery: q.idx,
        orderRank: rank,
        touched: curL,
        touchedKind: 'add',
        note: `L -> ${curL}: add a[${curL}] = ${arr[curL]}. distinct = ${answer}. moves = ${moves}.`,
      }));
    }
    while (curR > q.r) {
      remove(curR);
      curR -= 1;
      moves += 1;
      frames.push(snap({
        phase: 'rem-r',
        activeQuery: q.idx,
        orderRank: rank,
        touched: curR + 1,
        touchedKind: 'remove',
        note: `R -> ${curR}: remove a[${curR + 1}] = ${arr[curR + 1]}. distinct = ${answer}. moves = ${moves}.`,
      }));
    }
    while (curL < q.l) {
      remove(curL);
      curL += 1;
      moves += 1;
      frames.push(snap({
        phase: 'rem-l',
        activeQuery: q.idx,
        orderRank: rank,
        touched: curL - 1,
        touchedKind: 'remove',
        note: `L -> ${curL}: remove a[${curL - 1}] = ${arr[curL - 1]}. distinct = ${answer}. moves = ${moves}.`,
      }));
    }

    results[q.idx] = answer;
    frames.push(snap({
      phase: 'answer',
      activeQuery: q.idx,
      orderRank: rank,
      note: `Window now exactly [${q.l}, ${q.r}]. answer[${q.idx}] = ${answer} distinct value${answer === 1 ? '' : 's'}.`,
    }));
  }

  frames.push(snap({
    phase: 'done',
    note: `All queries answered in ${moves} total pointer moves. Naive recompute would be O(q*n) = ${queries.length * n}; Mo keeps it near (n+q)*sqrt(n).`,
  }));

  return { frames, block, ordered, queries };
}

export default function MoAlgorithmViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, block, ordered, queries } = useMemo(() => buildFrames(ARR, QUERIES), []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

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

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const n = ARR.length;

  // ---- array row geometry ----
  const padX = 36;
  const rowY = 92;
  const usableW = W - padX * 2;
  const gap = 8;
  const cellW = (usableW - gap * (n - 1)) / n;
  const cellH = 52;
  const cellX = (i) => padX + i * (cellW + gap);

  const inWindow = (i) => current.curR >= current.curL && i >= current.curL && i <= current.curR;

  // ---- query list geometry (lower panel) ----
  const listX = padX;
  const listY = rowY + cellH + 78;
  const rowH = 30;
  const rankOf = (qIdx) => ordered.findIndex((q) => q.idx === qIdx);

  return (
    <div className="mov">
      <div className="mov-head">
        <h3 className="mov-title">Mo&apos;s algorithm — offline range queries by sqrt-decomposition</h3>
        <p className="mov-sub">
          Sort queries by (block of l, then r), then sweep two pointers across the array, adding and removing
          one element at a time to morph the window from each query&apos;s range into the next. Answer here is the
          count of distinct values in [l, r].
        </p>
      </div>

      <div className="mov-controls">
        <div className="mov-buttons">
          <button
            type="button"
            className="mov-btn mov-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="mov-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="mov-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="mov-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="mov-speed">
          <span className="mov-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mov-speed-range"
          />
          <span className="mov-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="mov-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="mov-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mov-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mo's algorithm visualization">
          <text x={padX} y={36} className="mov-section-label">array a (window = current [curL, curR])</text>
          <text x={W - padX} y={36} textAnchor="end" className="mov-block-note">
            block size = floor(sqrt {n}) = {block}
          </text>

          {/* block boundary shading bands behind the array */}
          {Array.from({ length: n }, (_, i) => i).map((i) => {
            const b = Math.floor(i / block);
            if (b % 2 === 1) return null;
            return (
              <rect
                key={`blk-${i}`}
                x={cellX(i) - gap / 2}
                y={rowY - 16}
                width={cellW + gap}
                height={cellH + 32}
                className="mov-block-band"
              />
            );
          })}

          {/* block separators + labels */}
          {Array.from({ length: Math.ceil(n / block) }, (_, b) => b).map((b) => {
            const start = b * block;
            if (start >= n) return null;
            const x = cellX(start) - gap / 2;
            return (
              <g key={`bsep-${b}`}>
                {b > 0 && (
                  <line x1={x} y1={rowY - 18} x2={x} y2={rowY + cellH + 18} className="mov-block-sep" />
                )}
                <text x={cellX(start) + 2} y={rowY - 22} className="mov-block-tag">blk {b}</text>
              </g>
            );
          })}

          {/* window highlight band */}
          {current.curR >= current.curL && (
            <rect
              x={cellX(current.curL) - gap / 2}
              y={rowY - 6}
              width={cellX(current.curR) + cellW - (cellX(current.curL) - gap / 2) + gap / 2}
              height={cellH + 12}
              className="mov-window-band"
              rx={6}
            />
          )}

          {/* array cells */}
          {ARR.map((v, i) => {
            const x = cellX(i);
            const isTouched = current.touched === i;
            const kind = isTouched ? current.touchedKind : null;
            const cls = [
              'mov-cell',
              inWindow(i) ? 'mov-cell-in' : '',
              kind === 'add' ? 'mov-cell-add' : '',
              kind === 'remove' ? 'mov-cell-remove' : '',
            ].filter(Boolean).join(' ');
            return (
              <g key={`c-${i}`} className={cls}>
                <rect x={x} y={rowY} width={cellW} height={cellH} rx={6} className="mov-cell-box" />
                <text x={x + cellW / 2} y={rowY + cellH / 2 + 6} textAnchor="middle" className="mov-cell-val">{v}</text>
                <text x={x + cellW / 2} y={rowY + cellH + 16} textAnchor="middle" className="mov-cell-idx">{i}</text>
              </g>
            );
          })}

          {/* curL / curR pointers */}
          {current.curR >= current.curL && (
            <g>
              <g className="mov-ptr mov-ptr-l">
                <path
                  d={`M ${cellX(current.curL) + cellW / 2} ${rowY - 30} l -6 -10 l 12 0 z`}
                  className="mov-ptr-tri"
                />
                <text x={cellX(current.curL) + cellW / 2} y={rowY - 46} textAnchor="middle" className="mov-ptr-label">curL={current.curL}</text>
              </g>
              <g className="mov-ptr mov-ptr-r">
                <path
                  d={`M ${cellX(current.curR) + cellW / 2} ${rowY + cellH + 30} l -6 10 l 12 0 z`}
                  className="mov-ptr-tri"
                />
                <text x={cellX(current.curR) + cellW / 2} y={rowY + cellH + 52} textAnchor="middle" className="mov-ptr-label">curR={current.curR}</text>
              </g>
            </g>
          )}

          {/* query processing order panel */}
          <text x={listX} y={listY - 14} className="mov-section-label">queries (sorted: block of l, then r)</text>
          {ordered.map((q, rank) => {
            const y = listY + rank * rowH;
            const isActive = current.activeQuery === q.idx;
            const isDone = current.results[q.idx] !== undefined;
            const cls = [
              'mov-qrow',
              isActive ? 'mov-qrow-active' : '',
              isDone && !isActive ? 'mov-qrow-done' : '',
            ].filter(Boolean).join(' ');
            return (
              <g key={`q-${q.idx}`} className={cls}>
                <rect x={listX} y={y} width={300} height={rowH - 6} rx={5} className="mov-qrow-box" />
                <text x={listX + 12} y={y + rowH / 2 + 1} className="mov-qrow-rank">#{rank + 1}</text>
                <text x={listX + 52} y={y + rowH / 2 + 1} className="mov-qrow-text">
                  q{q.idx}: [{q.l}, {q.r}] · blk {q.block}
                </text>
                <text x={listX + 290} y={y + rowH / 2 + 1} textAnchor="end" className="mov-qrow-ans">
                  {isDone ? current.results[q.idx] : '—'}
                </text>
              </g>
            );
          })}

          {/* original (unsorted) query order, for contrast */}
          <text x={listX + 360} y={listY - 14} className="mov-section-label">original input order</text>
          {queries.map((q) => {
            const y = listY + q.idx * rowH;
            const rank = rankOf(q.idx);
            const isActive = current.activeQuery === q.idx;
            return (
              <g key={`oq-${q.idx}`} className={`mov-oqrow ${isActive ? 'mov-oqrow-active' : ''}`}>
                <rect x={listX + 360} y={y} width={250} height={rowH - 6} rx={5} className="mov-oqrow-box" />
                <text x={listX + 372} y={y + rowH / 2 + 1} className="mov-oqrow-text">
                  q{q.idx}: [{q.l}, {q.r}]
                </text>
                <text x={listX + 600} y={y + rowH / 2 + 1} textAnchor="end" className="mov-oqrow-rank">
                  runs #{rank + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mov-metrics">
        <div className="mov-metric">
          <span className="mov-metric-label">phase</span>
          <span className="mov-metric-value">{current.phase}</span>
        </div>
        <div className="mov-metric">
          <span className="mov-metric-label">current query</span>
          <span className="mov-metric-value">
            {current.activeQuery === null ? '—' : `q${current.activeQuery}`}
          </span>
        </div>
        <div className="mov-metric">
          <span className="mov-metric-label">curL / curR</span>
          <span className="mov-metric-value">
            {current.curR >= current.curL ? `[${current.curL}, ${current.curR}]` : 'empty'}
          </span>
        </div>
        <div className="mov-metric">
          <span className="mov-metric-label">answer (distinct)</span>
          <span className="mov-metric-value">{current.answer}</span>
        </div>
        <div className="mov-metric">
          <span className="mov-metric-label">total moves</span>
          <span className="mov-metric-value">{current.moves}</span>
        </div>
        <div className="mov-metric mov-metric-dim">
          <span className="mov-metric-label">naive bound</span>
          <span className="mov-metric-value mov-metric-dimval">{queries.length * n} ops</span>
        </div>
      </div>

      <div className="mov-caption">
        <span className="mov-caption-icon"><ArrowDownNarrowWide size={14} /></span>
        <span className="mov-caption-label">trace</span>
        <span className="mov-caption-text">{current.note}</span>
      </div>
    </div>
  );
}
