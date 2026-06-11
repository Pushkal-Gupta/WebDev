import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Search } from 'lucide-react';
import './SkipListViz.css';

const KEYS = [3, 6, 7, 9, 12, 19, 17, 26, 21, 25];
const MAX_LEVEL = 4;
const SEED = 0xBADC0DE;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns array indicating level for each key insertion
function planLevels(rng) {
  const out = [];
  for (let i = 0; i < KEYS.length; i++) {
    let lvl = 1;
    while (lvl < MAX_LEVEL && rng() < 0.5) lvl++;
    out.push(lvl);
  }
  return out;
}

function buildInsertFrames(levels) {
  // entries[i] = { key, level }
  // After step i, list contains first i+1 keys, sorted by key
  const frames = [];
  const entries = [];

  frames.push({
    phase: 'init',
    entries: [],
    activeKey: null,
    activeLevel: null,
    searchPath: [],
    foundAt: null,
    note: 'Empty skip list. Each insert flips coins until tails to decide its tower height.',
    queueIndex: -1,
  });

  for (let i = 0; i < KEYS.length; i++) {
    const key = KEYS[i];
    const lvl = levels[i];

    // Build search path through descending levels (from current entries)
    const sortedSoFar = entries.slice().sort((a, b) => a.key - b.key);
    const searchPath = [];
    // We model search as: at each level from MAX down to 1, find largest key < key at that level
    for (let L = MAX_LEVEL; L >= 1; L--) {
      const candidates = sortedSoFar.filter((e) => e.level >= L && e.key < key);
      const lastKey = candidates.length ? candidates[candidates.length - 1].key : null;
      searchPath.push({ level: L, predKey: lastKey });
    }

    frames.push({
      phase: 'search',
      entries: entries.map((e) => ({ ...e })),
      activeKey: key,
      activeLevel: lvl,
      searchPath,
      foundAt: null,
      note: `Insert ${key}. Coin flips gave level ${lvl}. Descend from top level finding the predecessor at each level.`,
      queueIndex: i,
    });

    entries.push({ key, level: lvl });

    frames.push({
      phase: 'insert',
      entries: entries.map((e) => ({ ...e })),
      activeKey: key,
      activeLevel: lvl,
      searchPath,
      foundAt: null,
      note: `Splice node ${key} into all ${lvl} level${lvl === 1 ? '' : 's'} below or equal to its tower height.`,
      queueIndex: i,
    });
  }

  frames.push({
    phase: 'done',
    entries: entries.map((e) => ({ ...e })),
    activeKey: null,
    activeLevel: null,
    searchPath: [],
    foundAt: null,
    note: 'Skip list built. Expected search / insert / delete in O(log n) with high probability.',
    queueIndex: KEYS.length,
  });

  return frames;
}

function buildSearchFrames(entries, target) {
  const frames = [];
  const sorted = entries.slice().sort((a, b) => a.key - b.key);
  const searchPath = [];
  let foundAt = null;

  for (let L = MAX_LEVEL; L >= 1; L--) {
    const candidates = sorted.filter((e) => e.level >= L && e.key < target);
    const predKey = candidates.length ? candidates[candidates.length - 1].key : null;
    searchPath.push({ level: L, predKey });
    // Check if next pointer at this level lands on target
    const successors = sorted.filter((e) => e.level >= L && e.key >= target);
    if (successors.length && successors[0].key === target && !foundAt) {
      foundAt = L;
    }
    frames.push({
      phase: 'searching',
      entries: entries.map((e) => ({ ...e })),
      activeKey: target,
      activeLevel: null,
      searchPath: [...searchPath],
      foundAt,
      note: `Level ${L}: predecessor of ${target} is ${predKey ?? 'head'}.${foundAt === L ? ` Found ${target} via level ${L} forward pointer.` : ''}`,
      queueIndex: -1,
    });
  }

  frames.push({
    phase: 'searchDone',
    entries: entries.map((e) => ({ ...e })),
    activeKey: target,
    activeLevel: null,
    searchPath,
    foundAt,
    note: foundAt
      ? `Found ${target} (first reached at level ${foundAt}). Total descent: ${searchPath.length} levels.`
      : `${target} not present in the list.`,
    queueIndex: -1,
  });

  return frames;
}

export default function SkipListViz() {
  const rng = useMemo(() => mulberry32(SEED), []);
  const levels = useMemo(() => planLevels(rng), [rng]);
  const insertFrames = useMemo(() => buildInsertFrames(levels), [levels]);

  const [mode, setMode] = useState('insert'); // 'insert' | 'search'
  const [searchInput, setSearchInput] = useState('19');
  const [searchFrames, setSearchFrames] = useState([]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = mode === 'insert' ? insertFrames : searchFrames;
  const totalSteps = frames.length || 1;
  const current = frames[Math.min(step, totalSteps - 1)] || {
    entries: [],
    activeKey: null,
    activeLevel: null,
    searchPath: [],
    foundAt: null,
    note: '',
    queueIndex: -1,
  };
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
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
    if (mode === 'search') {
      setMode('insert');
    }
  };

  const startSearch = () => {
    const target = parseInt(searchInput, 10);
    if (Number.isNaN(target)) return;
    // Use final state of insertions
    const finalEntries = insertFrames[insertFrames.length - 1].entries;
    const sf = buildSearchFrames(finalEntries, target);
    setSearchFrames(sf);
    setMode('search');
    setStep(0);
    setIsRunningRaw(false);
  };

  // Layout
  const sortedEntries = current.entries.slice().sort((a, b) => a.key - b.key);
  const cols = sortedEntries.length;
  const padX = 60;
  const padY = 20;
  const colW = 56;
  const rowH = 38;
  const W = Math.max(720, padX * 2 + (cols + 1) * colW);
  const H = padY * 2 + (MAX_LEVEL + 1) * rowH + 30;

  const headX = padX;
  const colX = (idx) => padX + (idx + 1) * colW;
  const rowY = (lvl) => padY + (MAX_LEVEL - lvl) * rowH + 16;

  // pred map for current search path: level -> predKey (or null=head)
  const predMap = new Map();
  current.searchPath.forEach((p) => predMap.set(p.level, p.predKey));

  return (
    <div className="skl">
      <div className="skl-head">
        <h3 className="skl-title">Skip list — probabilistic levels for O(log n) search</h3>
        <p className="skl-sub">
          Each node flips coins until tails to decide its tower height. Search descends from the top level,
          walking forward while the next key stays below the target.
        </p>
      </div>

      <div className="skl-controls">
        <div className="skl-buttons">
          <button
            type="button"
            className="skl-btn skl-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="skl-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="skl-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="skl-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="skl-field">
          <span className="skl-label">search key</span>
          <input
            className="skl-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <button type="button" className="skl-btn" onClick={startSearch}>
          <Search size={14} /> Search
        </button>

        <label className="skl-speed">
          <span className="skl-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="skl-speed-range"
          />
          <span className="skl-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="skl-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="skl-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="skl-svg" preserveAspectRatio="xMidYMid meet">
          {/* Row labels */}
          {Array.from({ length: MAX_LEVEL }, (_, i) => {
            const lvl = MAX_LEVEL - i;
            return (
              <text key={`row-${lvl}`} x={8} y={rowY(lvl) + 4} className="skl-level-label">
                L{lvl}
              </text>
            );
          })}

          {/* Head node */}
          {Array.from({ length: MAX_LEVEL }, (_, i) => {
            const lvl = MAX_LEVEL - i;
            return (
              <rect
                key={`head-${lvl}`}
                x={headX - 18}
                y={rowY(lvl) - 14}
                width={36}
                height={28}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth={1}
                rx={4}
              />
            );
          })}
          <text x={headX} y={rowY(MAX_LEVEL) + 4} className="skl-node-key" fill="var(--text-dim)">H</text>

          {/* Forward pointers per level */}
          {Array.from({ length: MAX_LEVEL }, (_, i) => {
            const lvl = MAX_LEVEL - i;
            // gather nodes with level >= lvl in sorted order
            const tower = sortedEntries
              .map((e, idx) => ({ ...e, idx }))
              .filter((e) => e.level >= lvl);
            const points = [{ x: headX + 18, key: null }, ...tower.map((e) => ({ x: colX(e.idx) - 18, x2: colX(e.idx) + 18, key: e.key }))];

            const segs = [];
            let prevX = headX + 18;
            let prevKey = null;
            tower.forEach((e) => {
              const xStart = prevX;
              const xEnd = colX(e.idx) - 18;
              const isOnPath = predMap.has(lvl) && predMap.get(lvl) === prevKey;
              segs.push({ x1: xStart, x2: xEnd, lvl, onPath: isOnPath, fromKey: prevKey, toKey: e.key });
              prevX = colX(e.idx) + 18;
              prevKey = e.key;
            });
            return (
              <g key={`ptr-${lvl}`}>
                {segs.map((seg, j) => (
                  <line
                    key={j}
                    x1={seg.x1}
                    y1={rowY(lvl)}
                    x2={seg.x2}
                    y2={rowY(lvl)}
                    stroke={seg.onPath ? 'var(--accent)' : 'var(--text-dim)'}
                    strokeWidth={seg.onPath ? 2.2 : 1.2}
                    markerEnd={seg.onPath ? 'url(#skl-arrow-on)' : 'url(#skl-arrow)'}
                  />
                ))}
              </g>
            );
          })}

          <defs>
            <marker id="skl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="skl-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Nodes */}
          {sortedEntries.map((e, idx) => {
            const x = colX(idx);
            const isActive = e.key === current.activeKey && current.phase !== 'searching' && current.phase !== 'searchDone';
            const isFound = e.key === current.activeKey && current.foundAt;
            return (
              <g key={`n-${e.key}`}>
                {Array.from({ length: e.level }, (_, k) => {
                  const lvl = k + 1;
                  return (
                    <rect
                      key={`box-${e.key}-${lvl}`}
                      x={x - 18}
                      y={rowY(lvl) - 14}
                      width={36}
                      height={28}
                      fill={
                        isFound
                          ? 'rgba(var(--easy-rgb, 34, 197, 94), 0.16)'
                          : isActive
                          ? 'rgba(var(--accent-rgb), 0.16)'
                          : 'var(--surface)'
                      }
                      stroke={isFound ? 'var(--easy)' : isActive ? 'var(--accent)' : 'var(--border)'}
                      strokeWidth={isFound || isActive ? 2 : 1}
                      rx={4}
                    />
                  );
                })}
                <text x={x} y={rowY(1) + 4} className="skl-node-key">{e.key}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="skl-metrics">
        <div className="skl-metric">
          <span className="skl-metric-label">{mode === 'search' ? 'searching' : 'inserting'}</span>
          <span className="skl-metric-value">{current.activeKey ?? '—'}</span>
        </div>
        <div className="skl-metric">
          <span className="skl-metric-label">level</span>
          <span className="skl-metric-value">{current.activeLevel ?? '—'}</span>
        </div>
        <div className="skl-metric">
          <span className="skl-metric-label">nodes</span>
          <span className="skl-metric-value">{current.entries.length}</span>
        </div>
        <div className="skl-metric">
          <span className="skl-metric-label">max level</span>
          <span className="skl-metric-value">
            {current.entries.length ? Math.max(...current.entries.map((e) => e.level)) : 0}
          </span>
        </div>
        <div className="skl-metric trv-metric-dim skl-metric-dim">
          <span className="skl-metric-label">phase</span>
          <span className="skl-metric-value skl-metric-dimval">{current.phase || 'idle'}</span>
        </div>
      </div>

      <div className="skl-arith">
        <span className="skl-arith-label">trace</span>
        <span className="skl-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
