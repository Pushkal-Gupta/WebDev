import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, Zap, Layers, GitBranch,
  CheckCircle2, Hourglass, Box, AlertTriangle,
} from 'lucide-react';
import './FiberReconcilerViz.css';

// React Fiber's interruptible work loop, made visible.
//
// Rendering is split into UNITS OF WORK — one fiber per component node. The
// RENDER PHASE walks the fiber tree, processing one unit at a time, and CAN
// PAUSE: a frame-budget bar drains as units are processed, and when the slice
// is exhausted the loop YIELDS back to the browser and resumes next tick. That
// pausing is what makes a high-priority update able to BARGE IN — clicking
// "Inject high-priority update" mid-render throws away the in-progress work
// tree and restarts from the root with the urgent work. The work already done
// at low priority is abandoned. Once the render phase finishes, the COMMIT
// PHASE flushes every change to the DOM in one ATOMIC step — it cannot be
// interrupted, paused, or restarted.

// A small, deterministic fiber tree (~7 nodes). depth gives the column; the
// order array below is the render-phase work order (depth-first, child then
// sibling — the order React's work loop actually walks the tree).
const FIBERS = [
  { id: 'root', label: 'App', depth: 0, parent: null },
  { id: 'header', label: 'Header', depth: 1, parent: 'root' },
  { id: 'list', label: 'List', depth: 1, parent: 'root' },
  { id: 'item1', label: 'Item', depth: 2, parent: 'list' },
  { id: 'item2', label: 'Item', depth: 2, parent: 'list' },
  { id: 'item3', label: 'Item', depth: 2, parent: 'list' },
  { id: 'footer', label: 'Footer', depth: 1, parent: 'root' },
];

// Depth-first work order: root, then its first subtree fully, then siblings.
const WORK_ORDER = ['root', 'header', 'list', 'item1', 'item2', 'item3', 'footer'];

const FIBER_BY_ID = Object.fromEntries(FIBERS.map((f) => [f.id, f]));
const ORDER_INDEX = Object.fromEntries(WORK_ORDER.map((id, i) => [i, id]));

const SLICE_BUDGET = 3; // units of work per frame slice before the loop yields
const TICK_MS = 950; // base interval; divided by speed

function freshState() {
  return {
    phase: 'idle', // idle | render | yielded | commit | committed
    priority: null, // 'low' | 'high' — priority of the in-progress render
    cursor: 0, // index into WORK_ORDER of the NEXT unit to process
    processed: [], // fiber ids processed in the current (work-in-progress) render
    sliceUsed: 0, // units processed in the current frame slice
    unitsProcessed: 0, // lifetime counter
    unitsAbandoned: 0, // lifetime counter — work thrown away by interrupts
    commits: 0, // atomic commits flushed to the DOM
    dom: [], // fiber ids currently painted to the "DOM" (only changes on commit)
    domPriority: null, // priority of the last commit
    note: 'Press Start render to walk the fiber tree. Each unit of work is one fiber; the render phase can pause when the frame budget runs out.',
    tone: 'idle',
  };
}

export default function FiberReconcilerViz() {
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [st, setSt] = useState(() => freshState());

  const runTimer = useRef(null);
  const autoRef = useRef(autoplay);
  useEffect(() => { autoRef.current = autoplay; }, [autoplay]);

  const delay = useMemo(() => Math.round(TICK_MS / Math.max(speed, 0.1)), [speed]);

  const total = WORK_ORDER.length;

  // Begin a render at the given priority from the root, discarding any
  // in-progress work (used by Start and by the high-priority interrupt).
  const beginRender = (prev, priority, interrupted) => {
    const abandoned = interrupted ? prev.processed.length : 0;
    return {
      ...prev,
      phase: 'render',
      priority,
      cursor: 0,
      processed: [],
      sliceUsed: 0,
      unitsAbandoned: prev.unitsAbandoned + abandoned,
      note: interrupted
        ? `High-priority update injected. The in-progress low-priority render is abandoned — ${abandoned} unit${abandoned === 1 ? '' : 's'} of work thrown away — and the loop restarts from the root with urgent work.`
        : 'Render started at the root. The work loop processes one fiber per unit, depth-first: a child before its siblings.',
      tone: interrupted ? 'high' : 'low',
    };
  };

  // Advance the work loop by exactly one tick. Pure reducer over state.
  const advance = (prev) => {
    const s = { ...prev };

    // A finished commit resets to idle on the next tick so a new render is clean.
    if (s.phase === 'committed') {
      return { ...freshState(), commits: s.commits, dom: s.dom, domPriority: s.domPriority, unitsProcessed: s.unitsProcessed, unitsAbandoned: s.unitsAbandoned, note: 'Committed. The work-in-progress tree became the painted DOM in one shot. Start another render to go again.', tone: 'idle' };
    }

    if (s.phase === 'idle') {
      return beginRender(s, 'low', false);
    }

    // Yielded → resume the render next tick (this is the time-slice pause ending).
    if (s.phase === 'yielded') {
      s.phase = 'render';
      s.sliceUsed = 0;
      s.note = 'Resumed. The browser got its turn last frame; now the loop picks up exactly where it paused — no work repeated.';
      s.tone = s.priority === 'high' ? 'high' : 'low';
      return s;
    }

    if (s.phase === 'render') {
      if (s.cursor >= total) {
        // Render phase complete → enter the atomic commit phase.
        s.phase = 'commit';
        s.note = 'Render phase finished — the whole work-in-progress tree is built. The commit phase now flushes every change to the DOM in ONE atomic step that cannot be interrupted.';
        s.tone = 'commit';
        return s;
      }

      // Process exactly one unit of work.
      const fid = ORDER_INDEX[s.cursor];
      s.processed = [...s.processed, fid];
      s.cursor += 1;
      s.sliceUsed += 1;
      s.unitsProcessed += 1;
      const f = FIBER_BY_ID[fid];

      if (s.cursor >= total) {
        s.note = `Processed the ${f.label} fiber — the last unit. The work-in-progress tree is fully built and ready to commit.`;
        s.tone = s.priority === 'high' ? 'high' : 'low';
      } else if (s.sliceUsed >= SLICE_BUDGET) {
        // Slice exhausted → yield to the browser.
        s.phase = 'yielded';
        s.note = `Frame budget spent after ${s.sliceUsed} units. The loop YIELDS back to the browser instead of blocking it — paused on the ${f.label} fiber, it will resume next frame.`;
        s.tone = 'yield';
      } else {
        s.note = `Processing the ${f.label} fiber (unit ${s.unitsProcessed}). One fiber per unit of work; the loop can pause between any two units.`;
        s.tone = s.priority === 'high' ? 'high' : 'low';
      }
      return s;
    }

    if (s.phase === 'commit') {
      // The atomic flush: the entire work-in-progress tree becomes the DOM at
      // once. No partial commits — this step is indivisible.
      s.dom = [...s.processed];
      s.domPriority = s.priority;
      s.commits += 1;
      s.phase = 'committed';
      s.note = `Commit done atomically — all ${s.processed.length} fibers flushed to the DOM in a single indivisible step. Nothing could interrupt this phase.`;
      s.tone = 'commit';
      return s;
    }

    return s;
  };

  // Auto-step driver: advances one tick per interval while autoplay is on.
  useEffect(() => {
    if (!autoplay) return undefined;
    runTimer.current = setInterval(() => {
      setSt((prev) => {
        const next = advance(prev);
        return next;
      });
    }, delay);
    return () => {
      if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    };
    // advance is a pure reducer recreated each render; the interval only needs
    // to restart when autoplay or the tick delay changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, delay]);

  // Final unmount cleanup.
  useEffect(() => () => { if (runTimer.current) clearInterval(runTimer.current); }, []);

  const startRender = () => {
    setSt((prev) => {
      // From idle/committed, kick the first render unit immediately.
      if (prev.phase === 'idle' || prev.phase === 'committed') {
        return beginRender(prev.phase === 'committed'
          ? { ...freshState(), commits: prev.commits, dom: prev.dom, domPriority: prev.domPriority, unitsProcessed: prev.unitsProcessed, unitsAbandoned: prev.unitsAbandoned }
          : prev, 'low', false);
      }
      return prev;
    });
  };

  const stepOnce = () => setSt((prev) => advance(prev));

  const injectHighPriority = () => {
    setSt((prev) => {
      // Only meaningful mid-render (render or yielded). Commit cannot be broken.
      if (prev.phase !== 'render' && prev.phase !== 'yielded') return prev;
      return beginRender(prev, 'high', true);
    });
  };

  const reset = () => {
    setAutoplay(false);
    if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    setSt(freshState());
  };

  const toggleAutoplay = () => setAutoplay((v) => !v);

  // ---- derived ----
  const midRender = st.phase === 'render' || st.phase === 'yielded';
  const canInject = midRender;
  const canStart = st.phase === 'idle' || st.phase === 'committed';
  const phaseLabel = st.phase === 'idle' ? 'idle'
    : st.phase === 'render' ? 'render'
      : st.phase === 'yielded' ? 'yielded'
        : st.phase === 'commit' ? 'commit'
          : 'committed';
  const phaseTone = st.phase === 'commit' || st.phase === 'committed' ? 'is-commit'
    : st.phase === 'yielded' ? 'is-yield'
      : st.priority === 'high' ? 'is-high'
        : st.phase === 'render' ? 'is-low' : '';

  const sliceFrac = SLICE_BUDGET > 0 ? st.sliceUsed / SLICE_BUDGET : 0;

  // ---- SVG geometry ----
  const W = 960;
  const H = 540;

  // region 1: work-loop status strip (top band)
  const stripX0 = 24;
  const stripX1 = W - 24;
  const stripW = stripX1 - stripX0;
  const stripY = 44;
  const stripH = 40;
  const STAGES = [
    { key: 'render', label: 'render — interruptible', icon: 'layers' },
    { key: 'commit', label: 'commit — atomic', icon: 'box' },
  ];
  const stageGap = 18;
  const stageW = (stripW - (STAGES.length - 1) * stageGap) / STAGES.length;
  const stageX = (i) => stripX0 + i * (stageW + stageGap);
  const renderActive = st.phase === 'render' || st.phase === 'yielded';
  const commitActive = st.phase === 'commit' || st.phase === 'committed';

  // region 2: fiber tree (left-bottom)
  const treeX0 = 24;
  const treeTop = 150;
  const colW = 150;
  const nodeR = 19;
  const fiberX = (depth) => treeX0 + 40 + depth * colW;
  // vertical layout: spread the 7 fibers by their work order so edges read cleanly
  const FIBER_Y = {
    root: treeTop + 150,
    header: treeTop + 40,
    list: treeTop + 150,
    item1: treeTop + 70,
    item2: treeTop + 150,
    item3: treeTop + 230,
    footer: treeTop + 290,
  };
  const fiberY = (id) => FIBER_Y[id];

  // region 3: frame-budget bar + DOM panel (right)
  const rightX0 = fiberX(2) + nodeR + 70;
  const rightW = stripX1 - rightX0;

  // budget bar
  const budgetY = treeTop + 6;
  const budgetH = 28;

  // DOM panel
  const domTop = budgetY + budgetH + 64;
  const domW = rightW;
  const domRowH = 30;

  const fiberState = (id) => {
    if (st.phase === 'committed' && st.dom.includes(id)) return 'committed';
    if (st.phase === 'commit') return st.processed.includes(id) ? 'committing' : '';
    const idx = st.processed.indexOf(id);
    if (idx === -1) return '';
    // the most-recently processed fiber is the "current" unit
    if (idx === st.processed.length - 1 && (st.phase === 'render' || st.phase === 'yielded')) return 'current';
    return 'processed';
  };

  const narrLabel = st.tone === 'high' ? 'interrupt'
    : st.tone === 'commit' ? 'atomic'
      : st.tone === 'yield' ? 'yield'
        : st.tone === 'low' ? 'render'
          : 'ready';
  const narrTone = st.tone === 'high' ? 'is-high'
    : st.tone === 'commit' ? 'is-commit'
      : st.tone === 'yield' ? 'is-yield' : '';

  return (
    <div className="frv">
      <div className="frv-head">
        <h3 className="frv-title">React Fiber — the interruptible work loop</h3>
        <p className="frv-sub">
          Rendering is split into units of work, one fiber per component. The render phase can pause when the frame
          budget runs out and can be thrown away mid-flight by an urgent update; the commit phase flushes to the DOM in one atomic step.
        </p>
      </div>

      <div className="frv-controls">
        <div className="frv-buttons">
          <button
            type="button"
            className="frv-btn frv-btn-primary"
            onClick={startRender}
            disabled={!canStart || autoplay}
            title="Begin walking the fiber tree at low priority"
          >
            <Play size={14} /> Start render
          </button>
          <button
            type="button"
            className="frv-btn frv-btn-high"
            onClick={injectHighPriority}
            disabled={!canInject}
            title="Barge in: discard the in-progress render and restart from the root with urgent work"
          >
            <Zap size={14} /> Inject high-priority update
          </button>
        </div>

        <span className="frv-spacer" aria-hidden="true" />

        <label className="frv-speed">
          <span className="frv-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="frv-speed-range" aria-label="Auto-step speed"
          />
          <span className="frv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="frv-buttons">
          <button
            type="button"
            className={`frv-btn ${autoplay ? 'frv-btn-on' : ''}`}
            onClick={toggleAutoplay}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Pause' : 'Auto-step'}
          </button>
          <button
            type="button"
            className="frv-btn"
            onClick={stepOnce}
            disabled={autoplay}
            title="Advance the work loop one tick"
          >
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="frv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="frv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="frv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="frv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="frv-ah" />
            </marker>
          </defs>

          {/* ---- region 1: work-loop status strip ---- */}
          <text className="frv-region-label" x={stripX0} y={28} textAnchor="start">the two phases — render can pause, commit cannot</text>
          {STAGES.map((stg, i) => {
            const x = stageX(i);
            const active = stg.key === 'render' ? renderActive : commitActive;
            const tone = stg.key === 'commit'
              ? (active ? 'is-commit' : '')
              : (active ? (st.phase === 'yielded' ? 'is-yield' : st.priority === 'high' ? 'is-high' : 'is-low') : '');
            const Icon = stg.icon === 'layers' ? Layers : Box;
            return (
              <g key={stg.key}>
                {i < STAGES.length - 1 && (
                  <line
                    className={`frv-strip-edge ${commitActive ? 'is-on' : ''}`}
                    x1={x + stageW}
                    y1={stripY + stripH / 2}
                    x2={stageX(i + 1)}
                    y2={stripY + stripH / 2}
                    markerEnd="url(#frv-arrow)"
                  />
                )}
                <rect className={`frv-stage-box ${tone}`} x={x} y={stripY} width={stageW} height={stripH} rx={8} />
                <g transform={`translate(${x + 12}, ${stripY + 11})`}>
                  <Icon width={16} height={16} className="frv-ic" />
                </g>
                <text className="frv-stage-label" x={x + 38} y={stripY + 25} textAnchor="start">{stg.label}</text>
                {stg.key === 'render' && (
                  <text className="frv-stage-tag" x={x + stageW - 12} y={stripY + 25} textAnchor="end">⟲ yields</text>
                )}
                {stg.key === 'commit' && (
                  <text className="frv-stage-tag is-commit" x={x + stageW - 12} y={stripY + 25} textAnchor="end">no interrupt</text>
                )}
              </g>
            );
          })}

          {/* ---- region 2: fiber tree ---- */}
          <text className="frv-region-label" x={treeX0} y={treeTop - 14} textAnchor="start">
            fiber tree — one fiber per node, walked depth-first
          </text>
          {/* edges parent -> child */}
          {FIBERS.filter((f) => f.parent).map((f) => {
            const p = FIBER_BY_ID[f.parent];
            const x1 = fiberX(p.depth) + nodeR;
            const y1 = fiberY(p.id);
            const x2 = fiberX(f.depth) - nodeR;
            const y2 = fiberY(f.id);
            const childDone = st.processed.includes(f.id);
            return (
              <path
                key={`edge-${f.id}`}
                className={`frv-edge ${childDone ? 'is-on' : ''}`}
                d={`M ${x1} ${y1} C ${x1 + 30} ${y1}, ${x2 - 30} ${y2}, ${x2} ${y2}`}
                fill="none"
              />
            );
          })}
          {/* nodes */}
          {FIBERS.map((f) => {
            const cx = fiberX(f.depth);
            const cy = fiberY(f.id);
            const state = fiberState(f.id);
            return (
              <g key={f.id}>
                <circle className={`frv-node ${state}`} cx={cx} cy={cy} r={nodeR} />
                <text className="frv-node-label" x={cx} y={cy - 2} textAnchor="middle">{f.label}</text>
                <text className="frv-node-sub" x={cx} y={cy + 10} textAnchor="middle">
                  {state === 'current' ? 'WIP' : state === 'committed' ? 'live' : state === 'committing' || state === 'processed' ? 'built' : ''}
                </text>
              </g>
            );
          })}

          {/* ---- region 3a: frame-budget bar ---- */}
          <text className="frv-region-label" x={rightX0} y={budgetY - 12} textAnchor="start">frame budget — drains as units process, then yields</text>
          <rect className="frv-budget-track" x={rightX0} y={budgetY} width={rightW} height={budgetH} rx={6} />
          <rect
            className={`frv-budget-fill ${st.phase === 'yielded' ? 'is-spent' : st.priority === 'high' ? 'is-high' : ''}`}
            x={rightX0}
            y={budgetY}
            width={Math.max(2, sliceFrac * rightW)}
            height={budgetH}
            rx={6}
          />
          {Array.from({ length: SLICE_BUDGET - 1 }).map((_, k) => {
            const tx = rightX0 + ((k + 1) / SLICE_BUDGET) * rightW;
            return <line key={`tick-${k}`} className="frv-budget-tick" x1={tx} y1={budgetY} x2={tx} y2={budgetY + budgetH} />;
          })}
          <text className="frv-budget-v" x={rightX0 + rightW} y={budgetY + budgetH + 16} textAnchor="end">
            {`${st.sliceUsed} / ${SLICE_BUDGET} units this slice`}
          </text>
          {st.phase === 'yielded' && (
            <text className="frv-budget-yield" x={rightX0} y={budgetY + budgetH + 16} textAnchor="start">
              ⏸ yielded to browser
            </text>
          )}

          {/* ---- region 3b: DOM panel (only updates on commit) ---- */}
          <text className="frv-region-label" x={rightX0} y={domTop - 12} textAnchor="start">painted DOM — changes only on an atomic commit</text>
          <rect
            className={`frv-dom-panel ${st.phase === 'commit' ? 'is-flash' : ''}`}
            x={rightX0}
            y={domTop}
            width={domW}
            height={H - domTop - 16}
            rx={8}
          />
          {st.dom.length === 0 ? (
            <text className="frv-empty" x={rightX0 + 14} y={domTop + 28} textAnchor="start">
              empty until the first commit flushes the tree
            </text>
          ) : (
            st.dom.map((id, i) => {
              const f = FIBER_BY_ID[id];
              const ly = domTop + 22 + i * domRowH;
              return (
                <g key={`dom-${id}-${i}`}>
                  <CheckCircle2
                    x={rightX0 + 14}
                    y={ly - 12}
                    width={14}
                    height={14}
                    className="frv-dom-ic"
                  />
                  <text className="frv-dom-line" x={rightX0 + 36} y={ly} textAnchor="start">
                    {`${'  '.repeat(f.depth)}<${f.label} />`}
                  </text>
                </g>
              );
            })
          )}
          {st.phase === 'commit' && (
            <text className="frv-dom-flash-t" x={rightX0 + domW / 2} y={domTop + (H - domTop - 16) / 2} textAnchor="middle">
              flushing atomically…
            </text>
          )}
        </svg>
      </div>

      <div className="frv-metrics">
        <div className="frv-metric">
          <span className="frv-metric-label">phase</span>
          <span className={`frv-metric-value ${phaseTone}`}>{phaseLabel}</span>
        </div>
        <div className="frv-metric">
          <span className="frv-metric-label">priority</span>
          <span className={`frv-metric-value ${st.priority === 'high' ? 'is-high' : st.priority === 'low' ? 'is-low' : ''}`}>
            {st.priority || '—'}
          </span>
        </div>
        <div className="frv-metric">
          <span className="frv-metric-label">render progress</span>
          <span className="frv-metric-value">{`${st.processed.length} / ${total} fibers`}</span>
        </div>
        <div className="frv-metric">
          <span className="frv-metric-label">units processed</span>
          <span className="frv-metric-value">{st.unitsProcessed}</span>
        </div>
        <div className="frv-metric">
          <span className="frv-metric-label">units abandoned</span>
          <span className={`frv-metric-value ${st.unitsAbandoned > 0 ? 'is-high' : ''}`}>{st.unitsAbandoned}</span>
        </div>
        <div className="frv-metric">
          <span className="frv-metric-label">commits done</span>
          <span className={`frv-metric-value ${st.commits > 0 ? 'is-commit' : ''}`}>{st.commits}</span>
        </div>
        <div className="frv-metric frv-metric-dim">
          <span className="frv-metric-label">slice budget</span>
          <span className="frv-metric-value">{`${st.sliceUsed} / ${SLICE_BUDGET}`}</span>
        </div>
        <div className="frv-metric frv-metric-dim">
          <span className="frv-metric-label">DOM nodes live</span>
          <span className="frv-metric-value">{st.dom.length}</span>
        </div>
      </div>

      <div className={`frv-narration ${narrTone}`}>
        <span className={`frv-narration-label ${narrTone}`}>{narrLabel}</span>
        <span className="frv-narration-body">{st.note}</span>
      </div>

      <div className="frv-legend">
        <span className="frv-legend-item"><GitBranch size={13} className="frv-ic is-low" /> render phase — one fiber per unit, can pause</span>
        <span className="frv-legend-item"><Hourglass size={13} className="frv-ic is-yield" /> yield — frame budget spent, browser gets a turn</span>
        <span className="frv-legend-item"><Zap size={13} className="frv-ic is-high" /> interrupt — urgent work discards the WIP tree</span>
        <span className="frv-legend-item"><CheckCircle2 size={13} className="frv-ic is-commit" /> commit — atomic flush, no interruption</span>
        <span className="frv-legend-item"><AlertTriangle size={13} className="frv-ic" /> abandoned units = wasted low-priority work</span>
      </div>
    </div>
  );
}
