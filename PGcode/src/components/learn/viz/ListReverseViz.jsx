import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import './ListReverseViz.css';

const DEFAULT_VALUES = [1, 2, 3, 4, 5, 6];
const TICK_MS = 900;
const NULL_INDEX = -1;
const NULL_LABEL = 'NULL';

const buildInitialState = (values) => ({
  values: values.slice(),
  next: values.map((_, i) => (i < values.length - 1 ? i + 1 : NULL_INDEX)),
  prev: NULL_INDEX,
  curr: values.length > 0 ? 0 : NULL_INDEX,
  nxt: NULL_INDEX,
  head: 0,
  steps: 0,
  phase: 'init',
  status: 'idle',
  lastAction: null,
});

const describeAction = (phase, prev, curr, nxt, valueOf) => {
  if (phase === 'init') {
    return 'prev = NULL, curr = head. Walk the list, flipping each next pointer as you go.';
  }
  if (phase === 'done') {
    return 'curr is NULL. The new head is the previous prev. Reversal complete.';
  }
  const prevLbl = prev === NULL_INDEX ? 'NULL' : `node(${valueOf(prev)})`;
  const currLbl = curr === NULL_INDEX ? 'NULL' : `node(${valueOf(curr)})`;
  const nxtLbl = nxt === NULL_INDEX ? 'NULL' : `node(${valueOf(nxt)})`;
  return `Saved next = ${nxtLbl}. Set curr.next = ${prevLbl}. Slid prev to ${currLbl}, curr to ${nxtLbl}.`;
};

function ListReverseViz() {
  const [state, setState] = useState(() => buildInitialState(DEFAULT_VALUES));
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const valueOf = useCallback(
    (idx) => (idx === NULL_INDEX ? null : state.values[idx]),
    [state.values],
  );

  const stepOnce = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'done') return prev;
      const { values, next, curr } = prev;
      if (curr === NULL_INDEX) {
        return {
          ...prev,
          phase: 'done',
          status: 'done',
          head: prev.prev,
          nxt: NULL_INDEX,
          lastAction: 'done',
        };
      }
      const savedNext = next[curr];
      const newNext = next.slice();
      newNext[curr] = prev.prev;
      const newPrev = curr;
      const newCurr = savedNext;
      const newPhase = newCurr === NULL_INDEX ? 'done' : 'running';
      const newStatus = newCurr === NULL_INDEX ? 'done' : 'running';
      return {
        values,
        next: newNext,
        prev: newPrev,
        curr: newCurr,
        nxt: savedNext,
        head: newCurr === NULL_INDEX ? newPrev : prev.head,
        steps: prev.steps + 1,
        phase: newPhase,
        status: newStatus,
        lastAction: 'iter',
      };
    });
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    if (state.status === 'done') {
      setRunning(false);
      return undefined;
    }
    timerRef.current = window.setTimeout(stepOnce, TICK_MS);
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running, state, stepOnce]);

  const handleStep = () => {
    if (state.status === 'done') return;
    setRunning(false);
    stepOnce();
  };

  const handleRun = () => {
    if (state.status === 'done') return;
    setRunning((r) => !r);
  };

  const handleReset = () => {
    setRunning(false);
    setState(buildInitialState(DEFAULT_VALUES));
  };

  const n = state.values.length;
  const nodeWidth = 64;
  const nodeHeight = 56;
  const nodeGap = 50;
  const padding = 36;
  const svgWidth = padding * 2 + n * nodeWidth + (n - 1) * nodeGap + 90;
  const svgHeight = 280;
  const rowY = 96;

  const nodeX = (i) => padding + i * (nodeWidth + nodeGap);
  const nodeCenterX = (i) => nodeX(i) + nodeWidth / 2;
  const nodeCenterY = rowY + nodeHeight / 2;
  const nullX = padding + n * (nodeWidth + nodeGap) + 18;
  const nullY = nodeCenterY;

  const edgeEndpoints = (from, to) => {
    const fromX = nodeX(from) + nodeWidth;
    const fromY = nodeCenterY;
    const toX = to === NULL_INDEX ? nullX : nodeX(to);
    const toY = to === NULL_INDEX ? nullY : nodeCenterY;
    return { fromX, fromY, toX, toY };
  };

  const edges = useMemo(() => {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const target = state.next[i];
      const isForward = target === i + 1;
      const isBackward = target === i - 1;
      const isNullEdge = target === NULL_INDEX;
      const { fromX, fromY, toX, toY } = edgeEndpoints(i, target);
      arr.push({
        key: `e-${i}`,
        from: i,
        to: target,
        fromX,
        fromY,
        toX,
        toY,
        direction: isForward ? 'forward' : isBackward ? 'backward' : isNullEdge ? 'null' : 'other',
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.next, n]);

  const pointerY = rowY + nodeHeight + 28;
  const pointerLabelY = rowY + nodeHeight + 58;

  const pointerX = (idx) => (idx === NULL_INDEX ? padding - 24 : nodeCenterX(idx));

  const caption = describeAction(state.phase, state.prev, state.curr, state.nxt, (i) => state.values[i]);

  const newHeadIdx = state.status === 'done' ? state.head : null;

  return (
    <div className="lrv-viz">
      <div className="lrv-viz-header">
        <h3 className="lrv-viz-title">Iterative singly-linked list reversal</h3>
        <p className="lrv-viz-subtitle">
          Three pointers, one pass. Save the next node, flip the current edge backward, then slide prev and curr forward.
        </p>
      </div>

      <div className="lrv-viz-stage" role="img" aria-label="Linked list reversal visualization">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          className="lrv-viz-svg"
        >
          <defs>
            <marker
              id="lrv-arrow-forward"
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
              id="lrv-arrow-backward"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker
              id="lrv-arrow-null"
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
              id="lrv-arrow-prev"
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
              id="lrv-arrow-curr"
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
              id="lrv-arrow-next"
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
            const isBackward = e.direction === 'backward';
            const isForward = e.direction === 'forward';
            const isNullEdge = e.direction === 'null';
            const markerId = isBackward
              ? 'lrv-arrow-backward'
              : isNullEdge
                ? 'lrv-arrow-null'
                : 'lrv-arrow-forward';
            const cls = isBackward
              ? 'lrv-edge lrv-edge-backward'
              : isForward
                ? 'lrv-edge lrv-edge-forward'
                : 'lrv-edge lrv-edge-null';
            const midX = (e.fromX + e.toX) / 2;
            const arcLift = isBackward ? -22 : 0;
            const midY = nodeCenterY + arcLift;
            const d = `M ${e.fromX} ${e.fromY} Q ${midX} ${midY} ${e.toX} ${e.toY}`;
            return (
              <path
                key={e.key}
                className={cls}
                d={d}
                fill="none"
                markerEnd={`url(#${markerId})`}
              />
            );
          })}

          <g className="lrv-null lrv-null-tail">
            <rect
              x={nullX - 6}
              y={nodeCenterY - 14}
              width={44}
              height={28}
              rx={6}
              ry={6}
              className="lrv-null-rect"
            />
            <text
              x={nullX + 16}
              y={nodeCenterY + 5}
              textAnchor="middle"
              className="lrv-null-text"
            >
              {NULL_LABEL}
            </text>
          </g>

          {state.values.map((value, i) => {
            const x = nodeX(i);
            const isCurr = i === state.curr;
            const isPrev = i === state.prev;
            const isNxt = i === state.nxt;
            const isHead = state.status === 'done' && i === state.head;
            let cls = 'lrv-node';
            if (isHead) cls += ' lrv-node-head';
            else if (isCurr) cls += ' lrv-node-curr';
            else if (isPrev) cls += ' lrv-node-prev';
            else if (isNxt) cls += ' lrv-node-next';
            return (
              <g key={`node-${i}`} className={cls}>
                <rect
                  x={x}
                  y={rowY}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={8}
                  ry={8}
                  className="lrv-node-rect"
                />
                <line
                  x1={x + nodeWidth - 18}
                  y1={rowY + 6}
                  x2={x + nodeWidth - 18}
                  y2={rowY + nodeHeight - 6}
                  className="lrv-node-divider"
                />
                <text
                  x={x + (nodeWidth - 18) / 2}
                  y={rowY + nodeHeight / 2 + 5}
                  textAnchor="middle"
                  className="lrv-node-value"
                >
                  {value}
                </text>
                <text
                  x={x + nodeWidth - 9}
                  y={rowY + nodeHeight / 2 + 4}
                  textAnchor="middle"
                  className="lrv-node-nextfield"
                >
                  *
                </text>
                <text
                  x={x + nodeWidth / 2}
                  y={rowY - 12}
                  textAnchor="middle"
                  className="lrv-node-index"
                >
                  {i}
                </text>
              </g>
            );
          })}

          {state.status !== 'done' && (
            <>
              <g
                className="lrv-pointer lrv-pointer-prev"
                style={{ transform: `translateX(${pointerX(state.prev)}px)` }}
              >
                <line
                  x1={0}
                  y1={pointerY + 26}
                  x2={0}
                  y2={pointerY + 4}
                  className="lrv-pointer-line lrv-pointer-line-prev"
                  markerEnd="url(#lrv-arrow-prev)"
                />
                <text
                  x={0}
                  y={pointerLabelY + 8}
                  textAnchor="middle"
                  className="lrv-pointer-label lrv-pointer-label-prev"
                >
                  prev
                </text>
                {state.prev === NULL_INDEX && (
                  <text
                    x={0}
                    y={pointerLabelY + 24}
                    textAnchor="middle"
                    className="lrv-pointer-sub"
                  >
                    NULL
                  </text>
                )}
              </g>

              <g
                className="lrv-pointer lrv-pointer-curr"
                style={{ transform: `translateX(${pointerX(state.curr)}px)` }}
              >
                <line
                  x1={0}
                  y1={pointerY + 26}
                  x2={0}
                  y2={pointerY + 4}
                  className="lrv-pointer-line lrv-pointer-line-curr"
                  markerEnd="url(#lrv-arrow-curr)"
                />
                <text
                  x={0}
                  y={pointerLabelY + 8}
                  textAnchor="middle"
                  className="lrv-pointer-label lrv-pointer-label-curr"
                >
                  curr
                </text>
                {state.curr === NULL_INDEX && (
                  <text
                    x={0}
                    y={pointerLabelY + 24}
                    textAnchor="middle"
                    className="lrv-pointer-sub"
                  >
                    NULL
                  </text>
                )}
              </g>

              {state.nxt !== NULL_INDEX && state.steps > 0 && (
                <g
                  className="lrv-pointer lrv-pointer-next"
                  style={{ transform: `translateX(${pointerX(state.nxt)}px)` }}
                >
                  <line
                    x1={0}
                    y1={pointerY + 26}
                    x2={0}
                    y2={pointerY + 4}
                    className="lrv-pointer-line lrv-pointer-line-next"
                    markerEnd="url(#lrv-arrow-next)"
                  />
                  <text
                    x={0}
                    y={pointerLabelY + 8}
                    textAnchor="middle"
                    className="lrv-pointer-label lrv-pointer-label-next"
                  >
                    next
                  </text>
                </g>
              )}
            </>
          )}

          {newHeadIdx !== null && newHeadIdx !== NULL_INDEX && (
            <g
              className="lrv-newhead"
              style={{ transform: `translateX(${nodeCenterX(newHeadIdx)}px)` }}
            >
              <text
                x={0}
                y={rowY - 36}
                textAnchor="middle"
                className="lrv-newhead-label"
              >
                new head
              </text>
              <line
                x1={0}
                y1={rowY - 28}
                x2={0}
                y2={rowY - 6}
                className="lrv-newhead-line"
                markerEnd="url(#lrv-arrow-curr)"
              />
            </g>
          )}
        </svg>
      </div>

      <div className="lrv-viz-readout">
        <div className="lrv-viz-readout-row">
          <span className="lrv-viz-readout-label">step</span>
          <span className="lrv-viz-readout-value lrv-mono">{state.steps}</span>
          <span className="lrv-viz-readout-label">prev</span>
          <span className="lrv-viz-readout-value lrv-mono">
            {state.prev === NULL_INDEX ? 'NULL' : state.values[state.prev]}
          </span>
          <span className="lrv-viz-readout-label">curr</span>
          <span className="lrv-viz-readout-value lrv-mono">
            {state.curr === NULL_INDEX ? 'NULL' : state.values[state.curr]}
          </span>
          <span className="lrv-viz-readout-label">next</span>
          <span className="lrv-viz-readout-value lrv-mono">
            {state.nxt === NULL_INDEX ? 'NULL' : state.values[state.nxt]}
          </span>
          <span className="lrv-viz-readout-label">head</span>
          <span className="lrv-viz-readout-value lrv-mono">
            {state.status === 'done' && state.head !== NULL_INDEX
              ? state.values[state.head]
              : state.values[state.head] ?? '-'}
          </span>
        </div>
        <div
          className={`lrv-viz-status lrv-viz-status-${state.status}`}
          aria-live="polite"
        >
          {caption}
        </div>
      </div>

      <div className="lrv-viz-buttons">
        <button
          type="button"
          className="lrv-viz-btn lrv-viz-btn-primary"
          onClick={handleRun}
          disabled={state.status === 'done'}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'Pause' : 'Run'}
        </button>
        <button
          type="button"
          className="lrv-viz-btn"
          onClick={handleStep}
          disabled={running || state.status === 'done'}
        >
          <StepForward size={14} />
          Step
        </button>
        <button type="button" className="lrv-viz-btn" onClick={handleReset}>
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}

export default ListReverseViz;
