import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './HeapInsertViz.css';

const INITIAL_HEAP = [2, 4, 5, 8, 6, 9, 7];
const SVG_W = 720;
const SVG_H = 360;
const NODE_R = 22;
const STEP_MS = 900;

const parentIdx = (i) => Math.floor((i - 1) / 2);

function buildFrames(initial, value) {
  const frames = [];
  const heap = [...initial, value];
  let cur = heap.length - 1;

  frames.push({
    heap: [...heap],
    current: cur,
    parent: cur > 0 ? parentIdx(cur) : null,
    action: 'append',
    comparison: null,
    stepLabel: `Append ${value} at index ${cur}`,
  });

  while (cur > 0) {
    const p = parentIdx(cur);
    frames.push({
      heap: [...heap],
      current: cur,
      parent: p,
      action: 'compare',
      comparison: { a: heap[cur], b: heap[p], op: heap[cur] < heap[p] ? '<' : '>=' },
      stepLabel: `Compare heap[${cur}] = ${heap[cur]} with parent heap[${p}] = ${heap[p]}`,
    });

    if (heap[cur] < heap[p]) {
      const childVal = heap[cur];
      const parentVal = heap[p];
      heap[cur] = parentVal;
      heap[p] = childVal;
      frames.push({
        heap: [...heap],
        current: p,
        parent: p > 0 ? parentIdx(p) : null,
        action: 'swap',
        comparison: { a: childVal, b: parentVal, op: '<' },
        stepLabel: `Swap: ${childVal} bubbles up to index ${p}`,
      });
      cur = p;
    } else {
      frames.push({
        heap: [...heap],
        current: cur,
        parent: p,
        action: 'settle',
        comparison: { a: heap[cur], b: heap[p], op: '>=' },
        stepLabel: `Heap property holds. ${heap[cur]} stays at index ${cur}`,
      });
      return frames;
    }
  }

  frames.push({
    heap: [...heap],
    current: 0,
    parent: null,
    action: 'settle',
    comparison: null,
    stepLabel: `Reached root. ${heap[0]} is the new minimum`,
  });
  return frames;
}

// Compute (x, y) for a node at index i in a complete binary tree layout.
function nodePosition(i, total) {
  if (i >= total) return null;
  const depth = Math.floor(Math.log2(i + 1));
  const maxDepth = Math.floor(Math.log2(Math.max(total, 1)));
  const levelStart = (1 << depth) - 1;
  const indexInLevel = i - levelStart;
  const slotsInLevel = 1 << depth;
  const yTop = 50;
  const yStep = maxDepth === 0 ? 0 : (SVG_H - 100) / maxDepth;
  const y = yTop + depth * yStep;
  const xSpan = SVG_W - 80;
  const x = 40 + ((indexInLevel + 0.5) / slotsInLevel) * xSpan;
  return { x, y };
}

export default function HeapInsertViz() {
  const [heap, setHeap] = useState(INITIAL_HEAP);
  const [inputVal, setInputVal] = useState('3');
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const playRef = useRef(null);

  const delay = Math.round(STEP_MS / speed);
  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;
  const displayHeap = currentFrame ? currentFrame.heap : heap;
  // Derive `playing` from the raw toggle + bounds so the auto-run effect never
  // needs to call setPlaying(false) when we hit the end.
  const playing = playingRaw && idx >= 0 && idx < frames.length - 1;

  const insert = useCallback(() => {
    const n = Number(inputVal);
    if (!Number.isFinite(n)) return;
    const built = buildFrames(heap, n);
    setFrames(built);
    setIdx(0);
    setPlaying(true);
  }, [inputVal, heap]);

  const reset = useCallback(() => {
    setPlaying(false);
    setHeap(INITIAL_HEAP);
    setFrames([]);
    setIdx(-1);
    setInputVal('3');
  }, []);

  // Play loop. `playing` is derived above from the raw toggle + bounds so the
  // effect never needs to call setPlaying(false) at the end.
  useEffect(() => {
    if (!playing) return;
    playRef.current = setTimeout(() => {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      // Commit the final heap when the animation lands on the last frame.
      if (nextIdx === frames.length - 1) setHeap(frames[nextIdx].heap);
    }, delay);
    return () => clearTimeout(playRef.current);
  }, [playing, idx, frames, delay]);

  const stepNext = () => {
    if (idx < frames.length - 1) {
      const next = idx + 1;
      setIdx(next);
      if (next === frames.length - 1) setHeap(frames[next].heap);
    }
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
    return displayHeap.map((_, i) => nodePosition(i, displayHeap.length));
  }, [displayHeap]);

  const edges = useMemo(() => {
    const out = [];
    for (let i = 1; i < displayHeap.length; i++) {
      const p = parentIdx(i);
      const a = positions[p];
      const b = positions[i];
      if (!a || !b) continue;
      const onPath =
        currentFrame &&
        ((i === currentFrame.current && p === currentFrame.parent) ||
          (i === currentFrame.parent && currentFrame.current === p));
      out.push({ a, b, i, p, onPath });
    }
    return out;
  }, [displayHeap, positions, currentFrame]);

  const step = idx + 1;
  const totalSteps = frames.length;

  return (
    <div className="hiv-root">
      <div className="hiv-head">
        <div className="hiv-title-block">
          <h3 className="hiv-title">Min-heap insert (sift-up)</h3>
          <p className="hiv-sub">
            Append to the array, then bubble the new value up while it is smaller than its parent.
          </p>
        </div>
      </div>

      <div className="hiv-controls">
        <label className="hiv-input-label">
          Insert value
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="hiv-input"
            placeholder="e.g. 3"
          />
        </label>
        <button type="button" className="hiv-btn hiv-btn-primary" onClick={insert}>
          <Plus size={14} /> Insert
        </button>
        <button type="button" className="hiv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
        <div className="hiv-control-divider" />
        <button
          type="button"
          className="hiv-btn"
          onClick={stepPrev}
          disabled={frames.length === 0 || idx <= 0}
          aria-label="Previous step"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="hiv-btn"
          onClick={togglePlay}
          disabled={frames.length === 0}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          className="hiv-btn"
          onClick={stepNext}
          disabled={frames.length === 0 || idx >= frames.length - 1}
          aria-label="Next step"
        >
          <SkipForward size={14} />
        </button>
        <label className="hiv-speed">
          <span className="hiv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="hiv-speed-range"
          />
          <span className="hiv-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>

      <div className="hiv-stage">
        <svg
          className="hiv-svg"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          role="img"
          aria-label="Min-heap binary tree"
        >
          <defs>
            <marker
              id="hiv-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="hiv-arrow-head" />
            </marker>
          </defs>

          {edges.map((e, ei) => (
            <line
              key={`e${ei}`}
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              className={`hiv-edge ${e.onPath ? 'hiv-edge-active' : ''}`}
            />
          ))}

          {/* Comparison arrow between current node and its parent */}
          {currentFrame && currentFrame.parent !== null && positions[currentFrame.current] && positions[currentFrame.parent] && (
            (() => {
              const child = positions[currentFrame.current];
              const par = positions[currentFrame.parent];
              const midX = (child.x + par.x) / 2;
              const midY = (child.y + par.y) / 2;
              const dx = child.x - par.x;
              const dy = child.y - par.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const nx = -dy / len;
              const ny = dx / len;
              const offset = 26;
              const lx = midX + nx * offset;
              const ly = midY + ny * offset;
              const op = currentFrame.comparison?.op || '?';
              return (
                <g>
                  <line
                    x1={par.x + (dx / len) * (NODE_R + 4)}
                    y1={par.y + (dy / len) * (NODE_R + 4)}
                    x2={child.x - (dx / len) * (NODE_R + 4)}
                    y2={child.y - (dy / len) * (NODE_R + 4)}
                    className="hiv-cmp-arrow"
                    markerEnd="url(#hiv-arrow)"
                  />
                  <rect
                    x={lx - 28}
                    y={ly - 12}
                    width={56}
                    height={22}
                    rx={6}
                    className="hiv-cmp-pill"
                  />
                  <text x={lx} y={ly + 4} textAnchor="middle" className="hiv-cmp-text">
                    {currentFrame.comparison
                      ? `${currentFrame.comparison.a} ${op} ${currentFrame.comparison.b}`
                      : 'compare'}
                  </text>
                </g>
              );
            })()
          )}

          {displayHeap.map((v, i) => {
            const p = positions[i];
            if (!p) return null;
            const isCurrent = currentFrame && currentFrame.current === i;
            const isParent = currentFrame && currentFrame.parent === i;
            const isJustSwapped =
              currentFrame && currentFrame.action === 'swap' && (i === currentFrame.current || i === currentFrame.parent);
            const isAppend = currentFrame && currentFrame.action === 'append' && i === currentFrame.current;
            const cls = [
              'hiv-node',
              isCurrent ? 'hiv-node-current' : '',
              isParent ? 'hiv-node-parent' : '',
              isJustSwapped ? 'hiv-node-swap' : '',
              isAppend ? 'hiv-node-append' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={i} className={cls}>
                {isCurrent && <circle cx={p.x} cy={p.y} r={NODE_R + 6} className="hiv-node-ring" />}
                <circle cx={p.x} cy={p.y} r={NODE_R} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="hiv-node-value">
                  {v}
                </text>
                <text x={p.x} y={p.y - NODE_R - 8} textAnchor="middle" className="hiv-node-index">
                  [{i}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="hiv-array-row">
        <span className="hiv-array-label">Array</span>
        <div className="hiv-array-cells">
          {displayHeap.map((v, i) => {
            const isCurrent = currentFrame && currentFrame.current === i;
            const isParent = currentFrame && currentFrame.parent === i;
            return (
              <div
                key={i}
                className={`hiv-cell ${isCurrent ? 'hiv-cell-current' : ''} ${isParent ? 'hiv-cell-parent' : ''}`}
              >
                <span className="hiv-cell-value">{v}</span>
                <span className="hiv-cell-index">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hiv-footer">
        <div className="hiv-stat">
          <span className="hiv-stat-label">Step</span>
          <span className="hiv-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="hiv-stat hiv-stat-grow">
          <span className="hiv-stat-label">Last comparison</span>
          <span className="hiv-stat-value">
            {currentFrame && currentFrame.comparison
              ? `heap[${currentFrame.current}] = ${currentFrame.comparison.a} ${currentFrame.comparison.op} heap[${currentFrame.parent}] = ${currentFrame.comparison.b}`
              : '—'}
          </span>
        </div>
        <div className="hiv-stat hiv-stat-grow">
          <span className="hiv-stat-label">Action</span>
          <span className="hiv-stat-value">
            {currentFrame ? currentFrame.stepLabel : 'Press Insert to begin'}
          </span>
        </div>
      </div>
    </div>
  );
}
