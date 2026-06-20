import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Search } from 'lucide-react';
import './SkipListViz.css';

// Fixed sample skip list. Each entry: { value, height } where height = number of
// levels the node participates in (level 0 .. height-1). Hand-tuned so the express
// lanes look like a real coin-flip tower: lots of nodes on level 0, fewer up top.
const SAMPLE = [
  { value: 3, height: 1 },
  { value: 6, height: 4 },
  { value: 7, height: 1 },
  { value: 9, height: 2 },
  { value: 12, height: 1 },
  { value: 17, height: 3 },
  { value: 19, height: 2 },
  { value: 21, height: 1 },
  { value: 25, height: 2 },
  { value: 26, height: 1 },
];

const MAX_LEVEL = Math.max(...SAMPLE.map((n) => n.height)); // 4 levels: 0..3
const TOP_LEVEL = MAX_LEVEL - 1;

// Plain sorted-array search for cross-checking found/not-found correctness.
function arrayContains(values, target) {
  return values.includes(target);
}

// Build the frame trace of SEARCH(target). Mirrors the canonical skip-list search:
// start at the head tower's top level, advance right while next.value < target,
// drop a level when next is null or next.value > target, stop at level 0.
function buildSearchFrames(nodes, target) {
  const values = nodes.map((n) => n.value);
  const frames = [];
  const path = []; // list of { level, idx } visited as the staircase (-1 = head)

  const nextAtLevel = (fromIdx, level) => {
    for (let i = fromIdx + 1; i < nodes.length; i++) {
      if (nodes[i].height > level) return i;
    }
    return -1; // null forward pointer
  };

  let comparisons = 0;
  let cur = -1; // -1 represents the head tower
  let level = TOP_LEVEL;
  path.push({ level, idx: -1 });

  frames.push({
    level,
    curIdx: -1,
    comparisons,
    path: path.map((p) => ({ ...p })),
    found: null,
    done: false,
    caption: `Start at the head tower, top express lane (level ${level}). Walk right while the next node's value < ${target}.`,
  });

  while (level >= 0) {
    const nIdx = nextAtLevel(cur, level);
    if (nIdx !== -1) {
      comparisons += 1;
      const nv = nodes[nIdx].value;
      if (nv < target) {
        cur = nIdx;
        path.push({ level, idx: cur });
        frames.push({
          level,
          curIdx: cur,
          comparisons,
          path: path.map((p) => ({ ...p })),
          found: null,
          done: false,
          caption: `level ${level}: ${nv} < ${target} -> advance right to node ${nv}.`,
        });
        continue;
      }
      if (nv === target) {
        cur = nIdx;
        path.push({ level, idx: cur });
        frames.push({
          level,
          curIdx: cur,
          comparisons,
          path: path.map((p) => ({ ...p })),
          found: true,
          done: true,
          caption: `level ${level}: ${nv} == ${target} -> found ${target} after ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`,
        });
        return { frames, found: true };
      }
      // nv > target: next overshoots, drop a level.
      if (level === 0) {
        frames.push({
          level,
          curIdx: cur,
          comparisons,
          path: path.map((p) => ({ ...p })),
          found: false,
          done: true,
          caption: `level 0: ${nv} > ${target} and no lower lane -> ${target} is not in the list (${comparisons} comparisons).`,
        });
        return { frames, found: false };
      }
      level -= 1;
      path.push({ level, idx: cur });
      frames.push({
        level,
        curIdx: cur,
        comparisons,
        path: path.map((p) => ({ ...p })),
        found: null,
        done: false,
        caption: `level ${level + 1}: ${nv} > ${target} -> drop down to level ${level}.`,
      });
      continue;
    }

    // forward pointer is null at this level.
    if (level === 0) {
      frames.push({
        level,
        curIdx: cur,
        comparisons,
        path: path.map((p) => ({ ...p })),
        found: false,
        done: true,
        caption: `level 0: forward pointer is null (end of list) -> ${target} is not present (${comparisons} comparisons).`,
      });
      return { frames, found: false };
    }
    level -= 1;
    path.push({ level, idx: cur });
    frames.push({
      level,
      curIdx: cur,
      comparisons,
      path: path.map((p) => ({ ...p })),
      found: null,
      done: false,
      caption: `level ${level + 1}: no next node on this lane -> drop down to level ${level}.`,
    });
  }

  // Unreachable in practice; terminal safety frame.
  return { frames, found: arrayContains(values, target) };
}

const IDLE_FRAME = {
  level: TOP_LEVEL,
  curIdx: -1,
  comparisons: 0,
  path: [{ level: TOP_LEVEL, idx: -1 }],
  found: null,
  done: true,
  caption: 'Enter a target and press Search. The walk starts at the top express lane and steps down a staircase to level 0.',
};

// Layout constants for the SVG.
const SVG_W = 940;
const HEAD_X = 64;
const COL0_X = 150;
const COL_GAP = (SVG_W - 40 - COL0_X) / (SAMPLE.length - 1);
const ROW_GAP = 56;
const TOP_Y = 48;
const NODE_W = 52;
const NODE_H = 30;
const SVG_H = TOP_Y + TOP_LEVEL * ROW_GAP + NODE_H + 40;
const SVG_RIGHT = SVG_W - 20;

export default function SkipListViz() {
  const [inputVal, setInputVal] = useState('19');
  const [frames, setFrames] = useState([IDLE_FRAME]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

  const xOfIdx = (idx) => (idx < 0 ? HEAD_X : COL0_X + idx * COL_GAP);
  const yOfLevel = (level) => TOP_Y + (TOP_LEVEL - level) * ROW_GAP;

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const startSearch = () => {
    const v = parseInt(inputVal, 10);
    if (Number.isNaN(v)) return;
    setIsRunningRaw(false);
    const { frames: f } = buildSearchFrames(SAMPLE, v);
    setFrames(f);
    setStep(0);
    setIsRunningRaw(true);
  };

  const reset = () => {
    setIsRunningRaw(false);
    setFrames([IDLE_FRAME]);
    setStep(0);
  };

  const playing = isRunningRaw && step < totalSteps - 1;

  // Forward pointers per level: for each node (and the head) the next node that
  // also reaches that level. Used to draw the express-lane arrows.
  const forwardEdges = useMemo(() => {
    const edges = [];
    for (let level = 0; level <= TOP_LEVEL; level++) {
      let prevIdx = -1; // head
      for (let i = 0; i < SAMPLE.length; i++) {
        if (SAMPLE[i].height > level) {
          edges.push({ level, from: prevIdx, to: i });
          prevIdx = i;
        }
      }
      edges.push({ level, from: prevIdx, to: -1 }); // tail (null) pointer
    }
    return edges;
  }, []);

  // Set of "level:idx" keys currently on the traversed staircase.
  const pathKeys = useMemo(() => {
    const s = new Set();
    for (const p of current.path) s.add(`${p.level}:${p.idx}`);
    return s;
  }, [current.path]);

  // Path segments (consecutive entries) to draw the staircase overlay.
  const pathSegments = useMemo(() => {
    const segs = [];
    for (let i = 1; i < current.path.length; i++) {
      segs.push([current.path[i - 1], current.path[i]]);
    }
    return segs;
  }, [current.path]);

  const onPath = (level, idx) => pathKeys.has(`${level}:${idx}`);

  const target = parseInt(inputVal, 10);
  const pathText = current.path
    .map((p) => `L${p.level}:${p.idx < 0 ? 'H' : SAMPLE[p.idx].value}`)
    .join(' -> ');

  const resultText =
    current.found === true ? 'found'
      : current.found === false ? 'not found'
        : current.done ? 'ready' : 'searching';

  return (
    <div className="slv">
      <div className="slv-head">
        <h3 className="slv-title">Skip list — search in O(log n) expected</h3>
        <p className="slv-sub">
          Level 0 is the full sorted list. Higher levels are express lanes holding fewer
          nodes. Search starts top-left, runs right while the next value fits, and drops a
          level whenever the next node overshoots — tracing a staircase down to level 0.
        </p>
      </div>

      <div className="slv-controls">
        <div className="slv-opbar">
          <input
            type="number"
            className="slv-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            aria-label="target value to search"
          />
          <button type="button" className="slv-btn slv-btn-primary" onClick={startSearch}>
            <Search size={14} /> Search
          </button>
        </div>
        <div className="slv-buttons">
          <button
            type="button"
            className="slv-btn"
            onClick={() => {
              if (step >= totalSteps - 1) return;
              setIsRunningRaw((v) => !v);
            }}
            disabled={totalSteps <= 1}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="slv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="slv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="slv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="slv-speed">
          <span className="slv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="slv-speed-range"
          />
          <span className="slv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="slv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="slv-stage">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="slv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="slv-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--border)" />
            </marker>
            <marker id="slv-arrow-path" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
            </marker>
          </defs>

          <rect x={12} y={12} width={SVG_W - 24} height={SVG_H - 24} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* level lane labels on the left */}
          {Array.from({ length: MAX_LEVEL }, (_, k) => TOP_LEVEL - k).map((level) => (
            <text key={`lane-${level}`} x={22} y={yOfLevel(level) + NODE_H / 2 + 4} className="slv-lane-label">
              L{level}
            </text>
          ))}

          {/* forward pointer arrows per level */}
          {forwardEdges.map((e, i) => {
            const y = yOfLevel(e.level) + NODE_H / 2;
            const x1 = e.from < 0 ? HEAD_X + NODE_W / 2 : xOfIdx(e.from) + NODE_W / 2;
            const x2 = e.to < 0 ? SVG_RIGHT : xOfIdx(e.to) - NODE_W / 2;
            const active = onPath(e.level, e.from) && e.to >= 0 && onPath(e.level, e.to);
            return (
              <line
                key={`fe-${i}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={active ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={active ? 2.4 : 1.4}
                opacity={active ? 1 : 0.55}
                markerEnd={active ? 'url(#slv-arrow-path)' : 'url(#slv-arrow)'}
              />
            );
          })}

          {/* staircase overlay connecting visited cells (drop = vertical, advance = horizontal) */}
          {pathSegments.map(([a, b], i) => {
            const ax = a.idx < 0 ? HEAD_X : xOfIdx(a.idx);
            const ay = yOfLevel(a.level) + NODE_H / 2;
            const bx = b.idx < 0 ? HEAD_X : xOfIdx(b.idx);
            const by = yOfLevel(b.level) + NODE_H / 2;
            return (
              <line
                key={`seg-${i}`}
                x1={ax}
                y1={ay}
                x2={bx}
                y2={by}
                stroke="var(--accent)"
                strokeWidth={3.4}
                strokeLinecap="round"
                opacity={0.3}
              />
            );
          })}

          {/* head tower */}
          {Array.from({ length: MAX_LEVEL }, (_, k) => TOP_LEVEL - k).map((level) => {
            const isCur = current.curIdx === -1 && current.level === level;
            const visited = onPath(level, -1);
            return (
              <g key={`head-${level}`}>
                <rect
                  x={HEAD_X - NODE_W / 2}
                  y={yOfLevel(level)}
                  width={NODE_W}
                  height={NODE_H}
                  rx={5}
                  fill={isCur ? 'var(--medium)' : visited ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={isCur ? 'var(--medium)' : visited ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isCur ? 3 : 2}
                />
                <text
                  x={HEAD_X}
                  y={yOfLevel(level) + NODE_H / 2 + 4}
                  className="slv-node-label"
                  style={{ fill: isCur ? 'var(--bg)' : 'var(--text-dim)' }}
                >
                  H
                </text>
              </g>
            );
          })}

          {/* nodes: one box per (node, level it reaches) */}
          {SAMPLE.map((nd, idx) =>
            Array.from({ length: nd.height }, (_, level) => {
              const isCur = current.curIdx === idx && current.level === level;
              const isFoundHit = current.found === true && current.done && current.curIdx === idx && current.level === level;
              const visited = onPath(level, idx);
              let fill = 'var(--bg)';
              let stroke = 'var(--border)';
              let labelFill = 'var(--text-main)';
              if (isFoundHit) {
                fill = 'var(--easy)'; stroke = 'var(--easy)'; labelFill = 'var(--bg)';
              } else if (isCur) {
                fill = 'var(--medium)'; stroke = 'var(--medium)'; labelFill = 'var(--bg)';
              } else if (visited) {
                fill = 'rgba(var(--accent-rgb), 0.18)'; stroke = 'var(--accent)';
              } else if (level > 0) {
                fill = 'var(--surface)';
              }
              return (
                <g key={`n-${idx}-${level}`}>
                  <rect
                    x={xOfIdx(idx) - NODE_W / 2}
                    y={yOfLevel(level)}
                    width={NODE_W}
                    height={NODE_H}
                    rx={5}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isCur || isFoundHit ? 3 : 2}
                  />
                  <text
                    x={xOfIdx(idx)}
                    y={yOfLevel(level) + NODE_H / 2 + 4}
                    className="slv-node-label"
                    style={{ fill: labelFill }}
                  >
                    {nd.value}
                  </text>
                </g>
              );
            }),
          )}

          {/* target chip */}
          {!Number.isNaN(target) && (
            <g>
              <rect x={SVG_W - 150} y={20} width={128} height={28} rx={6} fill="var(--bg)" stroke="var(--accent)" strokeWidth={1.4} />
              <text x={SVG_W - 138} y={38} className="slv-target-label">
                search {target}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="slv-metrics">
        <div className="slv-metric">
          <span className="slv-metric-label">current level</span>
          <span className="slv-metric-value">L{current.level}</span>
        </div>
        <div className="slv-metric">
          <span className="slv-metric-label">current node</span>
          <span className="slv-metric-value">{current.curIdx < 0 ? 'HEAD' : SAMPLE[current.curIdx].value}</span>
        </div>
        <div className="slv-metric">
          <span className="slv-metric-label">comparisons</span>
          <span className="slv-metric-value">{current.comparisons}</span>
        </div>
        <div className="slv-metric slv-metric-dim">
          <span className="slv-metric-label">result</span>
          <span className="slv-metric-value slv-metric-dimval">{resultText}</span>
        </div>
      </div>

      <div className="slv-path">
        <span className="slv-path-label">search path</span>
        <span className="slv-path-vals">{pathText}</span>
      </div>

      <div className="slv-arith">
        <span className="slv-arith-label">narration</span>
        <span className="slv-arith-vals">{current.caption}</span>
      </div>
    </div>
  );
}
