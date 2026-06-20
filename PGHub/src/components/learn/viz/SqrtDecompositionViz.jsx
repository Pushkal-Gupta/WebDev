import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Edit3, Sigma, Boxes } from 'lucide-react';
import './SqrtDecompositionViz.css';

const INITIAL = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];
const W = 940;
const H = 300;

// Block size ~ sqrt(n). Block b owns indices [b*B, b*B + B - 1] (clamped to n-1).
function blockSizeOf(n) {
  return Math.max(1, Math.floor(Math.sqrt(n)));
}

function buildBlockSums(arr, B) {
  const n = arr.length;
  const numBlocks = Math.ceil(n / B);
  const sums = new Array(numBlocks).fill(0);
  for (let i = 0; i < n; i += 1) sums[Math.floor(i / B)] += arr[i];
  return sums;
}

// Build the step-by-step trace of QUERY(l, r) under sqrt-decomposition.
// Partial left block: walk elements one at a time. Whole interior blocks: add the
// precomputed block sum in a single op (the speedup). Partial right block: walk again.
function queryFrames(arr, blockSums, B, l, r) {
  const n = arr.length;
  const numBlocks = blockSums.length;
  const frames = [];
  let total = 0;
  let ops = 0;
  const cellsSummed = [];
  const blocksSummed = [];

  const snap = (extra) => ({
    mode: 'query',
    l,
    r,
    total,
    ops,
    cellsSummed: [...cellsSummed],
    blocksSummed: [...blocksSummed],
    activeCell: null,
    activeBlock: null,
    arr: [...arr],
    blockSums: [...blockSums],
    ...extra,
  });

  frames.push(snap({
    phase: 'start',
    caption: `QUERY([${l}, ${r}]) with block size B = floor(sqrt(${n})) = ${B}. Walk the partial edges cell-by-cell and jump over whole interior blocks via their precomputed sums.`,
  }));

  let i = l;
  // Partial left block: advance one element at a time until we hit a block boundary
  // (or pass r entirely if l and r share a block).
  const lBlock = Math.floor(l / B);
  const rBlock = Math.floor(r / B);

  if (lBlock === rBlock) {
    // Whole query lives inside a single block — no shortcut available, walk it all.
    while (i <= r) {
      total += arr[i];
      ops += 1;
      cellsSummed.push(i);
      frames.push(snap({
        phase: 'left',
        activeCell: i,
        caption: `Same block ${lBlock}: add a[${i}] = ${arr[i]} -> total = ${total}. ops = ${ops}.`,
      }));
      i += 1;
    }
    frames.push(snap({
      phase: 'done',
      caption: `QUERY([${l}, ${r}]) = ${total} in ${ops} op${ops === 1 ? '' : 's'}. Single-block range, so no block-sum shortcut applied.`,
    }));
    return frames;
  }

  // Partial left block.
  while (i <= r && i % B !== 0) {
    total += arr[i];
    ops += 1;
    cellsSummed.push(i);
    frames.push(snap({
      phase: 'left',
      activeCell: i,
      caption: `Partial left block ${lBlock}: add a[${i}] = ${arr[i]} -> total = ${total}. ops = ${ops}.`,
    }));
    i += 1;
  }

  // Whole interior blocks: jump in B-sized strides, one op per block.
  while (i + B - 1 <= r) {
    const b = Math.floor(i / B);
    total += blockSums[b];
    ops += 1;
    blocksSummed.push(b);
    frames.push(snap({
      phase: 'block',
      activeBlock: b,
      caption: `Whole block ${b} -> add blockSum[${b}] = ${blockSums[b]} (skips ${B} elements in 1 op) -> total = ${total}. ops = ${ops}.`,
    }));
    i += B;
  }

  // Partial right block.
  while (i <= r) {
    total += arr[i];
    ops += 1;
    cellsSummed.push(i);
    frames.push(snap({
      phase: 'right',
      activeCell: i,
      caption: `Partial right block ${rBlock}: add a[${i}] = ${arr[i]} -> total = ${total}. ops = ${ops}.`,
    }));
    i += 1;
  }

  const naive = r - l + 1;
  frames.push(snap({
    phase: 'done',
    caption: `QUERY([${l}, ${r}]) = ${total} in ${ops} op${ops === 1 ? '' : 's'} vs ${naive} for a naive scan. Block-sum jumps over ${blocksSummed.length} whole block${blocksSummed.length === 1 ? '' : 's'} keep it O(sqrt n) = O(${B + numBlocks}) worst case.`,
  }));

  return frames;
}

// UPDATE(i, v): set a[i] = v, adjust only that element's block sum by the delta.
function updateFrames(arr, blockSums, B, idx, newVal) {
  const frames = [];
  const b = Math.floor(idx / B);
  const old = arr[idx];
  const delta = newVal - old;
  const nextArr = [...arr];
  const nextSums = [...blockSums];

  const base = (extra) => ({
    mode: 'update',
    idx,
    activeCell: idx,
    activeBlock: b,
    delta,
    ops: 0,
    cellsSummed: [],
    blocksSummed: [],
    total: null,
    l: null,
    r: null,
    arr: [...arr],
    blockSums: [...blockSums],
    ...extra,
  });

  frames.push(base({
    phase: 'start',
    caption: `UPDATE(a[${idx}] = ${newVal}). a[${idx}] was ${old}, so delta = ${delta}. Only block ${b} (which owns index ${idx}) changes.`,
  }));

  nextArr[idx] = newVal;
  frames.push(base({
    phase: 'write',
    arr: [...nextArr],
    ops: 1,
    caption: `Write a[${idx}] = ${newVal}. ops = 1.`,
  }));

  nextSums[b] += delta;
  frames.push({
    ...base({}),
    phase: 'done',
    arr: [...nextArr],
    blockSums: [...nextSums],
    ops: 2,
    caption: `blockSum[${b}] += ${delta} -> ${nextSums[b]}. UPDATE done in O(1): one cell write + one block-sum adjust. No other block touched.`,
    committed: { arr: nextArr, blockSums: nextSums },
  });

  return frames;
}

export default function SqrtDecompositionViz() {
  const [arr, setArr] = useState(INITIAL);
  const [ql, setQl] = useState('2');
  const [qr, setQr] = useState('13');
  const [ui, setUi] = useState('5');
  const [uv, setUv] = useState('1');
  const [frames, setFrames] = useState([]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const n = arr.length;
  const B = useMemo(() => blockSizeOf(n), [n]);
  const blockSums = useMemo(() => buildBlockSums(arr, B), [arr, B]);
  const numBlocks = blockSums.length;

  const totalSteps = frames.length;
  const current = totalSteps > 0 ? frames[Math.min(step, totalSteps - 1)] : null;
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => {
        const next = Math.min(s + 1, totalSteps - 1);
        // Commit an update's mutated state when it lands on the final frame.
        if (next === totalSteps - 1) {
          const last = frames[next];
          if (last && last.mode === 'update' && last.committed) setArr(last.committed.arr);
        }
        return next;
      });
    }, delay);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps, frames]);

  const runQuery = () => {
    const a = Number(ql);
    const b = Number(qr);
    if (!Number.isInteger(a) || !Number.isInteger(b)) return;
    if (a < 0 || b >= n || a > b) return;
    setFrames(queryFrames(arr, blockSums, B, a, b));
    setStep(0);
    setIsRunningRaw(true);
  };

  const runUpdate = () => {
    const i = Number(ui);
    const v = Number(uv);
    if (!Number.isInteger(i) || !Number.isFinite(v)) return;
    if (i < 0 || i >= n) return;
    setFrames(updateFrames(arr, blockSums, B, i, v));
    setStep(0);
    setIsRunningRaw(true);
  };

  const reset = () => {
    setIsRunningRaw(false);
    setArr(INITIAL);
    setFrames([]);
    setStep(0);
    setQl('2');
    setQr('13');
    setUi('5');
    setUv('1');
  };

  const stepNext = () => {
    setStep((s) => {
      const next = Math.min(s + 1, totalSteps - 1);
      if (next === totalSteps - 1) {
        const last = frames[next];
        if (last && last.mode === 'update' && last.committed) setArr(last.committed.arr);
      }
      return next;
    });
  };

  // ---- geometry ----
  const padX = 30;
  const rowY = 88;
  const usableW = W - padX * 2;
  const gap = 6;
  const cellW = (usableW - gap * (n - 1)) / n;
  const cellH = 50;
  const cellX = (i) => padX + i * (cellW + gap);

  // Display state: while a query runs we read the live arr; while an update runs we
  // read the frame's snapshot so the changed cell + block-sum animate before commit.
  const dispArr = current && current.mode === 'update' ? current.arr : arr;
  const dispSums = current && current.mode === 'update' ? current.blockSums : blockSums;

  const summedCells = useMemo(() => new Set(current ? current.cellsSummed : []), [current]);
  const summedBlocks = useMemo(() => new Set(current ? current.blocksSummed : []), [current]);

  const inQueryRange = (i) =>
    current && current.mode === 'query' && current.l !== null && i >= current.l && i <= current.r;

  // Block-sum panel geometry (row of block boxes under the array).
  const sumRowY = rowY + cellH + 56;
  const sumBoxH = 44;

  const caption = current ? current.caption : 'Run a range query or an update to begin.';
  const opsLabel = current && current.ops !== undefined && current.ops !== null ? current.ops : '—';
  const runningTotal = current && current.mode === 'query' ? current.total : null;
  const playable = totalSteps > 0;

  return (
    <div className="sdv">
      <div className="sdv-head">
        <h3 className="sdv-title">Sqrt decomposition — range sum in O(sqrt n)</h3>
        <p className="sdv-sub">
          Split the array into blocks of size B = floor(sqrt(n)); cache each block&apos;s sum. A range query
          walks the two partial edge blocks element-by-element and jumps over every whole interior block by
          adding its cached sum in a single op. An update touches one cell and one block sum.
        </p>
      </div>

      <div className="sdv-controls">
        <div className="sdv-group">
          <span className="sdv-group-label">Range sum</span>
          <label className="sdv-input-label">
            l
            <input type="number" className="sdv-input" value={ql} onChange={(e) => setQl(e.target.value)} min={0} max={n - 1} />
          </label>
          <label className="sdv-input-label">
            r
            <input type="number" className="sdv-input" value={qr} onChange={(e) => setQr(e.target.value)} min={0} max={n - 1} />
          </label>
          <button type="button" className="sdv-btn sdv-btn-primary" onClick={runQuery}>
            <Sigma size={14} /> Query
          </button>
        </div>

        <div className="sdv-group">
          <span className="sdv-group-label">Update</span>
          <label className="sdv-input-label">
            i
            <input type="number" className="sdv-input" value={ui} onChange={(e) => setUi(e.target.value)} min={0} max={n - 1} />
          </label>
          <label className="sdv-input-label">
            =val
            <input type="number" className="sdv-input" value={uv} onChange={(e) => setUv(e.target.value)} />
          </label>
          <button type="button" className="sdv-btn sdv-btn-primary" onClick={runUpdate}>
            <Edit3 size={14} /> Update
          </button>
        </div>

        <div className="sdv-group sdv-group-end">
          <button
            type="button"
            className="sdv-btn"
            onClick={() => {
              if (!playable) return;
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}
            disabled={!playable}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="sdv-btn" onClick={stepNext} disabled={!playable || step >= totalSteps - 1}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="sdv-btn" onClick={() => setStep(totalSteps - 1)} disabled={!playable || step >= totalSteps - 1}>
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="sdv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <label className="sdv-speed">
            <span className="sdv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="sdv-speed-range"
            />
            <span className="sdv-speed-value">{speed.toFixed(1)}×</span>
          </label>
        </div>
      </div>

      <div className="sdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sdv-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Sqrt decomposition visualization">
          <text x={padX} y={32} className="sdv-section-label">array a (B = floor(sqrt {n}) = {B})</text>
          <text x={W - padX} y={32} textAnchor="end" className="sdv-block-note">{numBlocks} blocks of size {B}</text>

          {/* alternating block bands behind the array */}
          {Array.from({ length: n }, (_, i) => i).map((i) => {
            const b = Math.floor(i / B);
            if (b % 2 === 1) return null;
            return (
              <rect
                key={`band-${i}`}
                x={cellX(i) - gap / 2}
                y={rowY - 14}
                width={cellW + gap}
                height={cellH + 28}
                className="sdv-band"
              />
            );
          })}

          {/* query range highlight */}
          {current && current.mode === 'query' && current.l !== null && (
            <rect
              x={cellX(current.l) - gap / 2}
              y={rowY - 5}
              width={cellX(current.r) + cellW - (cellX(current.l) - gap / 2) + gap / 2}
              height={cellH + 10}
              className="sdv-range-band"
              rx={6}
            />
          )}

          {/* array cells */}
          {dispArr.map((v, i) => {
            const isActive = current && current.activeCell === i;
            const wasSummed = summedCells.has(i);
            const cls = [
              'sdv-cell',
              inQueryRange(i) ? 'sdv-cell-range' : '',
              wasSummed ? 'sdv-cell-summed' : '',
              isActive ? 'sdv-cell-active' : '',
            ].filter(Boolean).join(' ');
            return (
              <g key={`c-${i}`} className={cls}>
                <rect x={cellX(i)} y={rowY} width={cellW} height={cellH} rx={6} className="sdv-cell-box" />
                <text x={cellX(i) + cellW / 2} y={rowY + cellH / 2 + 6} textAnchor="middle" className="sdv-cell-val">{v}</text>
                <text x={cellX(i) + cellW / 2} y={rowY + cellH + 15} textAnchor="middle" className="sdv-cell-idx">{i}</text>
              </g>
            );
          })}

          {/* block-sum boxes — each spans the width of its block's cells */}
          <text x={padX} y={sumRowY - 12} className="sdv-section-label">blockSum[] (cached per block — the speedup)</text>
          {dispSums.map((s, b) => {
            const startIdx = b * B;
            const endIdx = Math.min(startIdx + B - 1, n - 1);
            const x = cellX(startIdx) - gap / 2;
            const wBox = cellX(endIdx) + cellW - x;
            const isActive = current && current.activeBlock === b;
            const wasJumped = summedBlocks.has(b);
            const cls = [
              'sdv-sumbox',
              wasJumped ? 'sdv-sumbox-jumped' : '',
              isActive ? 'sdv-sumbox-active' : '',
            ].filter(Boolean).join(' ');
            return (
              <g key={`s-${b}`} className={cls}>
                <rect x={x + 2} y={sumRowY} width={wBox - 4} height={sumBoxH} rx={6} className="sdv-sumbox-box" />
                <text x={x + wBox / 2} y={sumRowY + 18} textAnchor="middle" className="sdv-sumbox-label">blk {b}</text>
                <text x={x + wBox / 2} y={sumRowY + 36} textAnchor="middle" className="sdv-sumbox-val">{s}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sdv-metrics">
        <div className="sdv-metric">
          <span className="sdv-metric-label">mode</span>
          <span className="sdv-metric-value">{current ? current.mode : 'idle'}</span>
        </div>
        <div className="sdv-metric">
          <span className="sdv-metric-label">step</span>
          <span className="sdv-metric-value">{totalSteps === 0 ? '0 / 0' : `${step + 1} / ${totalSteps}`}</span>
        </div>
        <div className="sdv-metric">
          <span className="sdv-metric-label">ops counted</span>
          <span className="sdv-metric-value sdv-metric-emph">{opsLabel}</span>
        </div>
        {runningTotal !== null && (
          <div className="sdv-metric">
            <span className="sdv-metric-label">running total</span>
            <span className="sdv-metric-value sdv-metric-emph">{runningTotal}</span>
          </div>
        )}
        <div className="sdv-metric sdv-metric-dim">
          <span className="sdv-metric-label">O(sqrt n) bound</span>
          <span className="sdv-metric-value sdv-metric-dimval">~{B + numBlocks} ops/query</span>
        </div>
      </div>

      <div className="sdv-caption">
        <span className="sdv-caption-icon"><Boxes size={14} /></span>
        <span className="sdv-caption-label">trace</span>
        <span className="sdv-caption-text">{caption}</span>
      </div>
    </div>
  );
}
