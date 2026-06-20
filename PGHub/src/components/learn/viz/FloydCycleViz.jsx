import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, StepForward, RotateCcw, Target } from 'lucide-react';
import './FloydCycleViz.css';

const NODE_COUNT = 8;
const CYCLE_TARGET = 3;
const NODE_WIDTH = 64;
const NODE_HEIGHT = 50;
const NODE_GAP = 44;
const PADDING_X = 40;
const ROW_Y = 130;
const TICK_MS = 700;

const VALUES = [11, 4, 7, 9, 2, 14, 5, 8];

const buildList = (hasCycle) => {
  const nodes = VALUES.map((value, i) => ({
    id: `n${i}`,
    value,
    index: i,
    next: i < NODE_COUNT - 1 ? i + 1 : (hasCycle ? CYCLE_TARGET : null),
  }));
  return nodes;
};

const initialState = () => ({
  slow: 0,
  fast: 0,
  steps: 0,
  phase: 'idle',
  metAt: null,
  cycleStart: null,
  caption: 'Both pointers start at the head. Press Step or Run to begin.',
});

function FloydCycleViz() {
  const [hasCycle, setHasCycle] = useState(true);
  const [state, setState] = useState(initialState);
  const [running, setRunning] = useState(false);
  const [flash, setFlash] = useState(false);

  const nodes = useMemo(() => buildList(hasCycle), [hasCycle]);

  const timeoutsRef = useRef([]);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const queueTimeout = useCallback((fn, delay) => {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);
  const clearQueued = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => () => clearQueued(), [clearQueued]);

  const handleToggleCycle = () => {
    setRunning(false);
    clearQueued();
    setFlash(false);
    setHasCycle((prev) => !prev);
    setState(initialState());
  };

  const handleReset = () => {
    setRunning(false);
    clearQueued();
    setFlash(false);
    setState(initialState());
  };

  const advancePhase1 = useCallback(() => {
    const cur = stateRef.current;
    if (cur.phase === 'detected' || cur.phase === 'nocycle' || cur.phase === 'searching-start' || cur.phase === 'cycle-start-found') {
      return false;
    }

    const slowNode = nodes[cur.slow];
    const slowNext = slowNode.next;
    if (slowNext === null) {
      setState({
        ...cur,
        phase: 'nocycle',
        steps: cur.steps + 1,
        caption: `Slow reached NULL at node ${cur.slow}. No cycle.`,
      });
      return false;
    }

    const fastNode = nodes[cur.fast];
    const fastMid = fastNode.next;
    if (fastMid === null) {
      setState({
        ...cur,
        phase: 'nocycle',
        steps: cur.steps + 1,
        caption: `Fast reached NULL at node ${cur.fast}. No cycle.`,
      });
      return false;
    }
    const fastEndNode = nodes[fastMid];
    const fastEnd = fastEndNode.next;
    if (fastEnd === null) {
      setState({
        ...cur,
        slow: slowNext,
        fast: fastMid,
        phase: 'nocycle',
        steps: cur.steps + 1,
        caption: `Fast walked off the end at node ${fastMid}. No cycle.`,
      });
      return false;
    }

    const newSlow = slowNext;
    const newFast = fastEnd;
    const met = newSlow === newFast;
    const nextSteps = cur.steps + 1;

    if (met) {
      setState({
        ...cur,
        slow: newSlow,
        fast: newFast,
        steps: nextSteps,
        phase: 'detected',
        metAt: newSlow,
        caption: `Slow + Fast met at node ${newSlow}! Cycle detected.`,
      });
      setFlash(true);
      queueTimeout(() => setFlash(false), 900);
      return false;
    }

    setState({
      ...cur,
      slow: newSlow,
      fast: newFast,
      steps: nextSteps,
      phase: 'running',
      caption: `Slow advances to node ${newSlow}; fast jumps to node ${newFast}.`,
    });
    return true;
  }, [nodes, queueTimeout]);

  const advancePhase2 = useCallback(() => {
    const cur = stateRef.current;
    if (cur.phase !== 'searching-start') return false;

    const slowNode = nodes[cur.slow];
    const fastNode = nodes[cur.fast];
    const newSlow = slowNode.next;
    const newFast = fastNode.next;

    if (newSlow === null || newFast === null) {
      setState({
        ...cur,
        phase: 'detected',
        caption: 'Cycle start search failed (unexpected null).',
      });
      return false;
    }

    const nextSteps = cur.steps + 1;
    if (newSlow === newFast) {
      setState({
        ...cur,
        slow: newSlow,
        fast: newFast,
        steps: nextSteps,
        phase: 'cycle-start-found',
        cycleStart: newSlow,
        caption: `Slow and fast meet at node ${newSlow}: that's the cycle entry.`,
      });
      setFlash(true);
      queueTimeout(() => setFlash(false), 900);
      return false;
    }

    setState({
      ...cur,
      slow: newSlow,
      fast: newFast,
      steps: nextSteps,
      caption: `Phase 2: slow walks to node ${newSlow}; fast walks to node ${newFast}.`,
    });
    return true;
  }, [nodes, queueTimeout]);

  const handleStep = () => {
    if (running) return;
    const cur = stateRef.current;
    if (cur.phase === 'searching-start') {
      advancePhase2();
    } else {
      advancePhase1();
    }
  };

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const cur = stateRef.current;
      let keepGoing;
      if (cur.phase === 'searching-start') {
        keepGoing = advancePhase2();
      } else {
        keepGoing = advancePhase1();
      }
      if (!keepGoing) {
        setRunning(false);
      }
    };
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, advancePhase1, advancePhase2]);

  const handleRun = () => {
    if (state.phase === 'nocycle' || state.phase === 'cycle-start-found') return;
    setRunning((r) => !r);
  };

  const handleFindCycleStart = () => {
    if (state.phase !== 'detected') return;
    clearQueued();
    setFlash(false);
    setState((cur) => ({
      ...cur,
      slow: 0,
      phase: 'searching-start',
      steps: cur.steps,
      caption: 'Phase 2: reset slow to head. Now advance both by 1 step until they meet.',
    }));
  };

  const svgWidth = PADDING_X * 2 + NODE_COUNT * NODE_WIDTH + (NODE_COUNT - 1) * NODE_GAP + 60;
  const svgHeight = 320;

  const nodeX = (i) => PADDING_X + i * (NODE_WIDTH + NODE_GAP);
  const nodeCenterX = (i) => nodeX(i) + NODE_WIDTH / 2;
  const nodeCenterY = ROW_Y + NODE_HEIGHT / 2;
  const nullX = PADDING_X + NODE_COUNT * (NODE_WIDTH + NODE_GAP) + 6;

  const edges = useMemo(() => {
    const arr = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const nxt = nodes[i].next;
      if (nxt === null) {
        arr.push({
          key: `e-${i}-null`,
          type: 'tail-null',
          fromIdx: i,
          toIdx: null,
        });
      } else if (nxt === i + 1) {
        arr.push({
          key: `e-${i}-${nxt}`,
          type: 'straight',
          fromIdx: i,
          toIdx: nxt,
        });
      } else {
        arr.push({
          key: `e-${i}-${nxt}-loop`,
          type: 'loop',
          fromIdx: i,
          toIdx: nxt,
        });
      }
    }
    return arr;
  }, [nodes]);

  const phaseBanner = (() => {
    if (state.phase === 'detected') return { text: 'Cycle detected!', tone: 'success' };
    if (state.phase === 'nocycle') return { text: 'No cycle', tone: 'warn' };
    if (state.phase === 'cycle-start-found') {
      return { text: `Cycle starts at node ${state.cycleStart}`, tone: 'success' };
    }
    if (state.phase === 'searching-start') return { text: 'Phase 2: finding cycle entry', tone: 'info' };
    return null;
  })();

  const slowCx = nodeCenterX(state.slow);
  const fastCx = nodeCenterX(state.fast);

  const canRun = state.phase !== 'nocycle' && state.phase !== 'cycle-start-found';
  const canStep = !running && canRun;
  const canFindStart = !running && state.phase === 'detected';

  return (
    <div className="fcv-viz">
      <div className="fcv-header">
        <h3 className="fcv-title">Floyd's cycle detection: tortoise and hare</h3>
        <p className="fcv-subtitle">
          Two pointers walk the list at different speeds. If a cycle exists, the fast pointer laps the slow one and they meet inside the loop.
          Phase 2 finds the exact node where the cycle starts.
        </p>
      </div>

      <div className="fcv-stage" role="img" aria-label="Floyd's cycle detection visualization">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          className="fcv-svg"
        >
          <defs>
            <marker
              id="fcv-arrow-default"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
            <marker
              id="fcv-arrow-loop"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker
              id="fcv-arrow-slow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-sky)" />
            </marker>
            <marker
              id="fcv-arrow-fast"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {edges.map((e) => {
            if (e.type === 'tail-null') {
              const fromX = nodeX(e.fromIdx) + NODE_WIDTH;
              const toX = nullX;
              const d = `M ${fromX} ${nodeCenterY} L ${toX} ${nodeCenterY}`;
              return (
                <path
                  key={e.key}
                  d={d}
                  className="fcv-edge fcv-edge-tail"
                  fill="none"
                  markerEnd="url(#fcv-arrow-default)"
                />
              );
            }
            if (e.type === 'straight') {
              const fromX = nodeX(e.fromIdx) + NODE_WIDTH;
              const toX = nodeX(e.toIdx);
              const d = `M ${fromX} ${nodeCenterY} L ${toX} ${nodeCenterY}`;
              return (
                <path
                  key={e.key}
                  d={d}
                  className="fcv-edge"
                  fill="none"
                  markerEnd="url(#fcv-arrow-default)"
                />
              );
            }
            const fromCx = nodeCenterX(e.fromIdx);
            const fromTopY = ROW_Y + NODE_HEIGHT;
            const toCx = nodeCenterX(e.toIdx);
            const toTopY = ROW_Y + NODE_HEIGHT;
            const dipY = ROW_Y + NODE_HEIGHT + 86;
            const c1x = fromCx - 18;
            const c2x = toCx + 18;
            const d = `M ${fromCx} ${fromTopY} C ${c1x} ${dipY}, ${c2x} ${dipY}, ${toCx} ${toTopY}`;
            return (
              <path
                key={e.key}
                d={d}
                className="fcv-edge fcv-edge-loop"
                fill="none"
                markerEnd="url(#fcv-arrow-loop)"
              />
            );
          })}

          {!hasCycle && (
            <g className="fcv-null">
              <rect
                x={nullX + 4}
                y={nodeCenterY - 14}
                width={42}
                height={28}
                rx={6}
                ry={6}
                className="fcv-null-rect"
              />
              <text
                x={nullX + 25}
                y={nodeCenterY + 5}
                textAnchor="middle"
                className="fcv-null-text"
              >
                NULL
              </text>
            </g>
          )}

          {nodes.map((node, i) => {
            const x = nodeX(i);
            const isSlow = state.slow === i;
            const isFast = state.fast === i;
            const isMeet = state.metAt === i && (state.phase === 'detected' || state.phase === 'searching-start');
            const isCycleStart = state.cycleStart === i && state.phase === 'cycle-start-found';
            let cls = 'fcv-node';
            if (isSlow && isFast) cls += ' fcv-node-meet';
            else if (isSlow) cls += ' fcv-node-slow';
            else if (isFast) cls += ' fcv-node-fast';
            if (isMeet) cls += ' fcv-node-met';
            if (isCycleStart) cls += ' fcv-node-cycle-start';
            if (flash && (isSlow || isFast)) cls += ' fcv-node-flash';
            return (
              <g key={node.id} className={cls}>
                <rect
                  x={x}
                  y={ROW_Y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={8}
                  ry={8}
                  className="fcv-node-rect"
                />
                <text
                  x={x + NODE_WIDTH / 2}
                  y={ROW_Y + NODE_HEIGHT / 2 + 5}
                  textAnchor="middle"
                  className="fcv-node-value"
                >
                  {node.value}
                </text>
                <text
                  x={x + NODE_WIDTH / 2}
                  y={ROW_Y - 10}
                  textAnchor="middle"
                  className="fcv-node-index"
                >
                  {i}
                </text>
              </g>
            );
          })}

          <g
            className="fcv-pointer fcv-pointer-fast"
            style={{ transform: `translateX(${fastCx}px)` }}
          >
            <text
              x={0}
              y={ROW_Y - 60}
              textAnchor="middle"
              className="fcv-pointer-label fcv-pointer-label-fast"
            >
              FAST
            </text>
            <line
              x1={0}
              y1={ROW_Y - 50}
              x2={0}
              y2={ROW_Y - 12}
              className="fcv-pointer-line fcv-pointer-line-fast"
              markerEnd="url(#fcv-arrow-fast)"
            />
          </g>

          <g
            className="fcv-pointer fcv-pointer-slow"
            style={{ transform: `translateX(${slowCx}px)` }}
          >
            <line
              x1={0}
              y1={ROW_Y + NODE_HEIGHT + 14}
              x2={0}
              y2={ROW_Y + NODE_HEIGHT + 52}
              className="fcv-pointer-line fcv-pointer-line-slow"
              markerEnd="url(#fcv-arrow-slow)"
            />
            <text
              x={0}
              y={ROW_Y + NODE_HEIGHT + 70}
              textAnchor="middle"
              className="fcv-pointer-label fcv-pointer-label-slow"
            >
              SLOW
            </text>
          </g>

          {phaseBanner && (
            <g className={`fcv-banner fcv-banner-${phaseBanner.tone}`}>
              <rect
                x={svgWidth / 2 - 140}
                y={20}
                width={280}
                height={42}
                rx={10}
                ry={10}
                className="fcv-banner-rect"
              />
              <text
                x={svgWidth / 2}
                y={47}
                textAnchor="middle"
                className="fcv-banner-text"
              >
                {phaseBanner.text}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="fcv-readout">
        <div className="fcv-readout-row">
          <span className="fcv-readout-label">step</span>
          <span className="fcv-readout-value fcv-mono">{state.steps}</span>
          <span className="fcv-readout-label">slow</span>
          <span className="fcv-readout-value fcv-mono fcv-slow-text">node {state.slow}</span>
          <span className="fcv-readout-label">fast</span>
          <span className="fcv-readout-value fcv-mono fcv-fast-text">node {state.fast}</span>
          <span className="fcv-readout-label">phase</span>
          <span className="fcv-readout-value fcv-mono">
            {state.phase === 'searching-start' || state.phase === 'cycle-start-found' ? '2' : '1'}
          </span>
        </div>
        <div className="fcv-caption">{state.caption}</div>
      </div>

      <div className="fcv-controls">
        <label className="fcv-toggle">
          <input
            type="checkbox"
            checked={hasCycle}
            onChange={handleToggleCycle}
            className="fcv-toggle-input"
          />
          <span className="fcv-toggle-track">
            <span className="fcv-toggle-thumb" />
          </span>
          <span className="fcv-toggle-text">Has cycle</span>
        </label>

        <div className="fcv-control-group">
          <button
            type="button"
            className="fcv-btn fcv-btn-primary"
            onClick={handleStep}
            disabled={!canStep}
          >
            <StepForward size={14} />
            Step
          </button>

          <button
            type="button"
            className="fcv-btn"
            onClick={handleRun}
            disabled={!canRun}
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pause' : 'Run'}
          </button>

          <button
            type="button"
            className="fcv-btn"
            onClick={handleFindCycleStart}
            disabled={!canFindStart}
          >
            <Target size={14} />
            Find cycle start
          </button>

          <button
            type="button"
            className="fcv-btn fcv-btn-ghost"
            onClick={handleReset}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div className="fcv-legend">
        <span className="fcv-legend-item">
          <span className="fcv-legend-swatch fcv-legend-slow" />
          Slow (tortoise) advances 1
        </span>
        <span className="fcv-legend-item">
          <span className="fcv-legend-swatch fcv-legend-fast" />
          Fast (hare) advances 2
        </span>
        <span className="fcv-legend-item">
          <span className="fcv-legend-swatch fcv-legend-loop" />
          Cycle back-edge
        </span>
      </div>
    </div>
  );
}

export default FloydCycleViz;
