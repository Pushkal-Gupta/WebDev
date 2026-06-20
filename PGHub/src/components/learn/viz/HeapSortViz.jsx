import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Shuffle, RotateCcw, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './HeapSortViz.css';

const DEFAULT_ARRAY = [7, 12, 3, 18, 9, 1, 14, 6, 11, 4, 16, 8];
const SVG_W = 760;
const SVG_H = 320;
const NODE_R = 18;
const STEP_MS = 750;

const parentIdx = (i) => Math.floor((i - 1) / 2);
const leftIdx = (i) => 2 * i + 1;
const rightIdx = (i) => 2 * i + 2;

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildFrames(input) {
  const frames = [];
  const a = [...input];
  const n = a.length;

  const push = (frame) => {
    frames.push({
      array: [...a],
      compare: null,
      swap: null,
      activeRoot: null,
      heapSize: n,
      sortedFromIdx: n,
      phase: 'build',
      action: '',
      ...frame,
    });
  };

  push({
    action: 'Start: build max-heap from the unsorted array.',
    phase: 'build',
    heapSize: n,
    sortedFromIdx: n,
  });

  // Phase 1: build max-heap (sift-down from last parent to root)
  const siftDown = (root, size, phase, sortedFromIdx) => {
    let i = root;
    while (true) {
      const l = leftIdx(i);
      const r = rightIdx(i);
      let largest = i;

      if (l < size) {
        push({
          phase,
          heapSize: size,
          sortedFromIdx,
          activeRoot: root,
          compare: { a: i, b: l },
          action: `Compare a[${i}] = ${a[i]} with left child a[${l}] = ${a[l]}.`,
        });
        if (a[l] > a[largest]) largest = l;
      }
      if (r < size) {
        push({
          phase,
          heapSize: size,
          sortedFromIdx,
          activeRoot: root,
          compare: { a: largest, b: r },
          action: `Compare a[${largest}] = ${a[largest]} with right child a[${r}] = ${a[r]}.`,
        });
        if (a[r] > a[largest]) largest = r;
      }

      if (largest === i) {
        push({
          phase,
          heapSize: size,
          sortedFromIdx,
          activeRoot: root,
          compare: null,
          action: `Heap property holds at index ${i}. Sift-down done.`,
        });
        return;
      }

      push({
        phase,
        heapSize: size,
        sortedFromIdx,
        activeRoot: root,
        swap: { a: i, b: largest },
        action: `Swap a[${i}] = ${a[i]} with a[${largest}] = ${a[largest]}.`,
      });
      [a[i], a[largest]] = [a[largest], a[i]];
      push({
        phase,
        heapSize: size,
        sortedFromIdx,
        activeRoot: root,
        swap: { a: i, b: largest },
        action: `After swap: a[${i}] = ${a[i]}, a[${largest}] = ${a[largest]}. Continue sifting down.`,
      });
      i = largest;
    }
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    push({
      phase: 'build',
      heapSize: n,
      sortedFromIdx: n,
      activeRoot: i,
      action: `Heapify subtree rooted at index ${i} (value ${a[i]}).`,
    });
    siftDown(i, n, 'build', n);
  }

  push({
    phase: 'built',
    heapSize: n,
    sortedFromIdx: n,
    action: 'Max-heap built. Root holds the maximum.',
  });

  // Phase 2: sort. Repeatedly pop max to end, shrink heap, sift down.
  for (let end = n - 1; end > 0; end--) {
    push({
      phase: 'sort',
      heapSize: end + 1,
      sortedFromIdx: end + 1,
      activeRoot: 0,
      compare: { a: 0, b: end },
      action: `Pop max: swap root a[0] = ${a[0]} with a[${end}] = ${a[end]}.`,
    });
    push({
      phase: 'sort',
      heapSize: end + 1,
      sortedFromIdx: end + 1,
      activeRoot: 0,
      swap: { a: 0, b: end },
      action: `Swap root with last heap element.`,
    });
    [a[0], a[end]] = [a[end], a[0]];
    push({
      phase: 'sort',
      heapSize: end,
      sortedFromIdx: end,
      activeRoot: 0,
      swap: { a: 0, b: end },
      action: `a[${end}] = ${a[end]} is now in its sorted position. Heap shrinks to size ${end}.`,
    });

    if (end > 1) {
      push({
        phase: 'sort',
        heapSize: end,
        sortedFromIdx: end,
        activeRoot: 0,
        action: `Restore heap: sift-down from root over heap of size ${end}.`,
      });
      siftDown(0, end, 'sort', end);
    }
  }

  push({
    phase: 'done',
    heapSize: 0,
    sortedFromIdx: 0,
    action: 'All elements placed. Array is sorted.',
  });

  return frames;
}

function nodePosition(i, total) {
  if (i >= total) return null;
  const depth = Math.floor(Math.log2(i + 1));
  const maxDepth = Math.floor(Math.log2(Math.max(total, 1)));
  const levelStart = (1 << depth) - 1;
  const indexInLevel = i - levelStart;
  const slotsInLevel = 1 << depth;
  const yTop = 36;
  const yStep = maxDepth === 0 ? 0 : (SVG_H - 80) / maxDepth;
  const y = yTop + depth * yStep;
  const xSpan = SVG_W - 60;
  const x = 30 + ((indexInLevel + 0.5) / slotsInLevel) * xSpan;
  return { x, y };
}

const PHASE_LABEL = {
  build: 'Phase 1 - Build max-heap',
  built: 'Phase 1 complete',
  sort: 'Phase 2 - Sort (pop max)',
  done: 'Sorted',
};

export default function HeapSortViz() {
  const [baseArray, setBaseArray] = useState(DEFAULT_ARRAY);
  const [frames, setFrames] = useState(() => buildFrames(DEFAULT_ARRAY));
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const playRef = useRef(null);

  const currentFrame = frames[idx] || frames[0];
  const displayArr = currentFrame ? currentFrame.array : baseArray;
  const heapSize = currentFrame ? currentFrame.heapSize : baseArray.length;
  const sortedFromIdx = currentFrame ? currentFrame.sortedFromIdx : baseArray.length;
  // Derive `playing` from the raw toggle + bounds so the auto-run effect never
  // needs to call setPlaying(false) when we hit the end.
  const playing = playingRaw && idx < frames.length - 1;

  const rebuild = useCallback((arr) => {
    setFrames(buildFrames(arr));
    setIdx(0);
    setPlaying(false);
  }, []);

  const shuffle = useCallback(() => {
    const next = shuffleArr(baseArray);
    setBaseArray(next);
    rebuild(next);
  }, [baseArray, rebuild]);

  const reset = useCallback(() => {
    setBaseArray(DEFAULT_ARRAY);
    rebuild(DEFAULT_ARRAY);
  }, [rebuild]);

  useEffect(() => {
    if (!playing) return;
    playRef.current = setTimeout(() => setIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [playing, idx, frames]);

  const stepNext = () => {
    if (idx < frames.length - 1) setIdx(idx + 1);
  };
  const stepPrev = () => {
    if (idx > 0) setIdx(idx - 1);
  };
  const togglePlay = () => {
    if (frames.length === 0) return;
    if (idx >= frames.length - 1) {
      setIdx(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const positions = useMemo(() => {
    return displayArr.map((_, i) => nodePosition(i, displayArr.length));
  }, [displayArr]);

  const edges = useMemo(() => {
    const out = [];
    for (let i = 1; i < displayArr.length; i++) {
      const p = parentIdx(i);
      const a = positions[p];
      const b = positions[i];
      if (!a || !b) continue;
      const inHeap = i < heapSize && p < heapSize;
      const isActive =
        currentFrame &&
        ((currentFrame.compare &&
          ((currentFrame.compare.a === i && currentFrame.compare.b === p) ||
            (currentFrame.compare.a === p && currentFrame.compare.b === i))) ||
          (currentFrame.swap &&
            ((currentFrame.swap.a === i && currentFrame.swap.b === p) ||
              (currentFrame.swap.a === p && currentFrame.swap.b === i))));
      out.push({ a, b, inHeap, isActive });
    }
    return out;
  }, [displayArr, positions, heapSize, currentFrame]);

  const step = idx + 1;
  const totalSteps = frames.length;
  const phase = currentFrame ? currentFrame.phase : 'build';

  return (
    <div className="hsv-root">
      <div className="hsv-head">
        <div className="hsv-title-block">
          <h3 className="hsv-title">Heap Sort</h3>
          <p className="hsv-sub">
            Build a max-heap bottom-up, then repeatedly swap the root with the last heap slot and sift-down to grow the sorted tail.
          </p>
        </div>
        <div className="hsv-phase-pill" data-phase={phase}>
          {PHASE_LABEL[phase] || phase}
        </div>
      </div>

      <div className="hsv-controls">
        <button type="button" className="hsv-btn hsv-btn-primary" onClick={shuffle}>
          <Shuffle size={14} /> Shuffle
        </button>
        <button type="button" className="hsv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
        <div className="hsv-control-divider" />
        <button
          type="button"
          className="hsv-btn"
          onClick={stepPrev}
          disabled={idx <= 0}
          aria-label="Previous step"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="hsv-btn"
          onClick={togglePlay}
          disabled={frames.length === 0}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span className="hsv-btn-label">{playing ? 'Pause' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="hsv-btn"
          onClick={stepNext}
          disabled={idx >= frames.length - 1}
          aria-label="Next step"
        >
          <SkipForward size={14} />
          <span className="hsv-btn-label">Step</span>
        </button>
      </div>

      <div className="hsv-stage">
        <svg
          className="hsv-svg"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          role="img"
          aria-label="Heap sort tree visualization"
        >
          <defs>
            <marker
              id="hsv-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="hsv-arrow-head" />
            </marker>
          </defs>

          {edges.map((e, ei) => (
            <line
              key={`e${ei}`}
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              className={[
                'hsv-edge',
                !e.inHeap ? 'hsv-edge-dim' : '',
                e.isActive ? 'hsv-edge-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}

          {currentFrame && currentFrame.compare && positions[currentFrame.compare.a] && positions[currentFrame.compare.b] && (
            (() => {
              const pa = positions[currentFrame.compare.a];
              const pb = positions[currentFrame.compare.b];
              const dx = pb.x - pa.x;
              const dy = pb.y - pa.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              return (
                <line
                  x1={pa.x + ux * (NODE_R + 3)}
                  y1={pa.y + uy * (NODE_R + 3)}
                  x2={pb.x - ux * (NODE_R + 3)}
                  y2={pb.y - uy * (NODE_R + 3)}
                  className="hsv-cmp-arrow"
                  markerEnd="url(#hsv-arrow)"
                />
              );
            })()
          )}

          {displayArr.map((v, i) => {
            const p = positions[i];
            if (!p) return null;
            const inHeap = i < heapSize;
            const isSorted = i >= sortedFromIdx;
            const isCompare =
              currentFrame &&
              currentFrame.compare &&
              (currentFrame.compare.a === i || currentFrame.compare.b === i);
            const isSwap =
              currentFrame &&
              currentFrame.swap &&
              (currentFrame.swap.a === i || currentFrame.swap.b === i);
            const isRoot =
              currentFrame &&
              currentFrame.activeRoot !== null &&
              currentFrame.activeRoot === i &&
              !isCompare &&
              !isSwap;
            const cls = [
              'hsv-node',
              !inHeap && !isSorted ? 'hsv-node-out' : '',
              isSorted ? 'hsv-node-sorted' : '',
              isCompare ? 'hsv-node-compare' : '',
              isSwap ? 'hsv-node-swap' : '',
              isRoot ? 'hsv-node-root' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={i} className={cls}>
                {isRoot && <circle cx={p.x} cy={p.y} r={NODE_R + 5} className="hsv-node-ring" />}
                <circle cx={p.x} cy={p.y} r={NODE_R} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="hsv-node-value">
                  {v}
                </text>
                <text x={p.x} y={p.y - NODE_R - 6} textAnchor="middle" className="hsv-node-index">
                  [{i}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="hsv-array-row">
        <div className="hsv-array-labels">
          <span className="hsv-array-label">Array</span>
          <div className="hsv-legend">
            <span className="hsv-legend-item">
              <span className="hsv-legend-swatch hsv-swatch-heap" /> Heap
            </span>
            <span className="hsv-legend-item">
              <span className="hsv-legend-swatch hsv-swatch-sorted" /> Sorted
            </span>
            <span className="hsv-legend-item">
              <span className="hsv-legend-swatch hsv-swatch-active" /> Active
            </span>
          </div>
        </div>
        <div className="hsv-array-cells">
          {displayArr.map((v, i) => {
            const inHeap = i < heapSize;
            const isSorted = i >= sortedFromIdx;
            const isCompare =
              currentFrame &&
              currentFrame.compare &&
              (currentFrame.compare.a === i || currentFrame.compare.b === i);
            const isSwap =
              currentFrame &&
              currentFrame.swap &&
              (currentFrame.swap.a === i || currentFrame.swap.b === i);
            const cls = [
              'hsv-cell',
              isSorted ? 'hsv-cell-sorted' : '',
              inHeap && !isSorted ? 'hsv-cell-heap' : '',
              isCompare ? 'hsv-cell-compare' : '',
              isSwap ? 'hsv-cell-swap' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={i} className={cls}>
                <span className="hsv-cell-value">{v}</span>
                <span className="hsv-cell-index">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hsv-footer">
        <div className="hsv-stat">
          <span className="hsv-stat-label">Step</span>
          <span className="hsv-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="hsv-stat">
          <span className="hsv-stat-label">Phase</span>
          <span className="hsv-stat-value">{PHASE_LABEL[phase] || phase}</span>
        </div>
        <div className="hsv-stat">
          <span className="hsv-stat-label">Heap size</span>
          <span className="hsv-stat-value">{heapSize}</span>
        </div>
        <div className="hsv-stat hsv-stat-grow">
          <span className="hsv-stat-label">Action</span>
          <span className="hsv-stat-value">
            {currentFrame ? currentFrame.action : 'Press Run to begin'}
          </span>
        </div>
      </div>
    </div>
  );
}
