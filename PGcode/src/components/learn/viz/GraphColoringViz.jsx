import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './GraphColoringViz.css';

const NODES = [
  { id: 'A', x: 280, y: 60 },
  { id: 'B', x: 460, y: 140 },
  { id: 'C', x: 440, y: 310 },
  { id: 'D', x: 280, y: 380 },
  { id: 'E', x: 120, y: 310 },
  { id: 'F', x: 100, y: 140 },
  { id: 'G', x: 280, y: 220 },
];

const EDGES = [
  ['A', 'B'],
  ['B', 'C'],
  ['C', 'D'],
  ['D', 'E'],
  ['E', 'F'],
  ['F', 'A'],
  ['A', 'G'],
  ['C', 'G'],
  ['E', 'G'],
  ['B', 'D'],
];

const ADJ = (() => {
  const map = {};
  NODES.forEach((n) => { map[n.id] = []; });
  EDGES.forEach(([u, v]) => {
    map[u].push(v);
    map[v].push(u);
  });
  Object.values(map).forEach((list) => list.sort());
  return map;
})();

const ORDER = NODES.map((n) => n.id);

const COLOR_TOKENS = [
  '--hue-sky',
  '--hue-pink',
  '--hue-mint',
  '--warning',
  '--easy',
];

const COLOR_LABELS = ['C1', 'C2', 'C3', 'C4', 'C5'];

const edgeKey = (u, v) => (u < v ? `${u}-${v}` : `${v}-${u}`);

function buildSteps(k) {
  const steps = [];
  const colors = {};
  ORDER.forEach((id) => { colors[id] = 0; });

  const pushStep = (over) => {
    steps.push({
      kind: 'init',
      colors: { ...colors },
      current: null,
      tryColor: 0,
      stack: [],
      conflictWith: null,
      caption: `Initialize: ${ORDER.length} nodes uncoloured, k = ${k} colours available. Begin with node ${ORDER[0]}.`,
      ...over,
    });
  };

  pushStep({});

  // Iterative backtracking simulation that emits one step per micro-action.
  const stack = [];
  let pos = 0;
  let tryColor = 1;
  let solved = false;
  let exhausted = false;
  let guard = 0;
  const GUARD_MAX = 5000;

  while (!solved && !exhausted) {
    guard += 1;
    if (guard > GUARD_MAX) break;

    if (pos === ORDER.length) {
      steps.push({
        kind: 'done',
        colors: { ...colors },
        current: null,
        tryColor: 0,
        stack: stack.map((s) => ({ ...s })),
        conflictWith: null,
        caption: `All ${ORDER.length} nodes coloured with ${k} colours. Valid colouring found.`,
      });
      solved = true;
      break;
    }

    const nodeId = ORDER[pos];

    if (tryColor > k) {
      // exhausted at this node — backtrack
      if (stack.length === 0) {
        steps.push({
          kind: 'fail',
          colors: { ...colors },
          current: nodeId,
          tryColor: 0,
          stack: [],
          conflictWith: null,
          caption: `No colour 1..${k} works for ${nodeId} and the stack is empty. Graph is not ${k}-colourable.`,
        });
        exhausted = true;
        break;
      }
      const top = stack.pop();
      colors[top.nodeId] = 0;
      steps.push({
        kind: 'backtrack',
        colors: { ...colors },
        current: top.nodeId,
        tryColor: 0,
        stack: stack.map((s) => ({ ...s })),
        conflictWith: null,
        caption: `Node ${nodeId} has no colour left to try. Backtrack: clear ${top.nodeId} and try the next colour there.`,
      });
      pos = ORDER.indexOf(top.nodeId);
      tryColor = top.color + 1;
      continue;
    }

    // Announce the attempt
    steps.push({
      kind: 'try',
      colors: { ...colors },
      current: nodeId,
      tryColor,
      stack: stack.map((s) => ({ ...s })),
      conflictWith: null,
      caption: `Trying colour ${COLOR_LABELS[tryColor - 1]} on node ${nodeId}. Check its neighbours for a clash.`,
    });

    // Check conflicts
    let conflictWith = null;
    for (const nb of ADJ[nodeId]) {
      if (colors[nb] === tryColor) {
        conflictWith = nb;
        break;
      }
    }

    if (conflictWith) {
      steps.push({
        kind: 'conflict',
        colors: { ...colors },
        current: nodeId,
        tryColor,
        stack: stack.map((s) => ({ ...s })),
        conflictWith,
        caption: `Conflict: neighbour ${conflictWith} already has ${COLOR_LABELS[tryColor - 1]}. Try the next colour on ${nodeId}.`,
      });
      tryColor += 1;
      continue;
    }

    // OK — commit colour and advance
    colors[nodeId] = tryColor;
    stack.push({ nodeId, color: tryColor });
    steps.push({
      kind: 'ok',
      colors: { ...colors },
      current: nodeId,
      tryColor,
      stack: stack.map((s) => ({ ...s })),
      conflictWith: null,
      caption: `OK: ${COLOR_LABELS[tryColor - 1]} is safe on ${nodeId}. Push onto the stack and recurse to ${ORDER[pos + 1] ?? 'finish'}.`,
    });
    pos += 1;
    tryColor = 1;
  }

  return steps;
}

export default function GraphColoringViz() {
  const [k, setK] = useState(3);
  const [steps, setSteps] = useState(() => buildSteps(3));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setSteps(buildSteps(k));
    setIdx(0);
    setPlaying(false);
  }, [k]);

  const step = steps[idx];

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= steps.length - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      next();
    }, 800);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  useEffect(() => {
    if (idx >= steps.length - 1 && playing) setPlaying(false);
  }, [idx, steps.length, playing]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const atEnd = idx >= steps.length - 1;
  const isDone = step.kind === 'done';
  const isFail = step.kind === 'fail';

  const edgeState = useMemo(() => {
    const map = {};
    EDGES.forEach(([u, v]) => { map[edgeKey(u, v)] = 'idle'; });
    if (step.conflictWith && step.current) {
      map[edgeKey(step.current, step.conflictWith)] = 'conflict';
    }
    return map;
  }, [step]);

  const nodeFill = (id) => {
    // While trying / conflict, paint the current node with the candidate colour
    if (step.current === id && (step.kind === 'try' || step.kind === 'conflict')) {
      return `var(${COLOR_TOKENS[step.tryColor - 1]})`;
    }
    const c = step.colors[id];
    if (c >= 1) return `var(${COLOR_TOKENS[c - 1]})`;
    return 'var(--surface)';
  };

  const nodeClass = (id) => {
    const classes = ['gcviz-node'];
    if (step.colors[id] >= 1) classes.push('gcviz-node-colored');
    else classes.push('gcviz-node-empty');
    if (step.current === id) {
      classes.push('gcviz-node-current');
      if (step.kind === 'try') classes.push('gcviz-node-trying');
      if (step.kind === 'ok') classes.push('gcviz-node-ok');
      if (step.kind === 'conflict') classes.push('gcviz-node-conflict');
      if (step.kind === 'backtrack') classes.push('gcviz-node-backtrack');
      if (step.kind === 'fail') classes.push('gcviz-node-conflict');
    }
    return classes.join(' ');
  };

  return (
    <div className="gcviz">
      <div className="gcviz-header">
        <div className="gcviz-title">Graph colouring (backtracking)</div>
        <div className="gcviz-k">
          <label htmlFor="gcviz-k-range">k = {k}</label>
          <input
            id="gcviz-k-range"
            type="range"
            min={2}
            max={5}
            step={1}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            aria-label="Number of colours"
          />
        </div>
      </div>

      <div className="gcviz-legend">
        {COLOR_TOKENS.slice(0, k).map((token, i) => (
          <span key={token} className="gcviz-legend-item">
            <span
              className="gcviz-dot"
              style={{ background: `var(${token})`, borderColor: `var(${token})` }}
            />
            {COLOR_LABELS[i]}
          </span>
        ))}
        <span className="gcviz-legend-item">
          <span className="gcviz-dot gcviz-dot-empty" /> uncoloured
        </span>
        <span className="gcviz-legend-item">
          <span className="gcviz-dot gcviz-dot-current" /> considering
        </span>
      </div>

      <div className="gcviz-stage">
        <svg
          className="gcviz-svg"
          viewBox="0 0 560 440"
          role="img"
          aria-label="Graph colouring backtracking visualization"
        >
          <g className="gcviz-edges">
            {EDGES.map(([u, v]) => {
              const a = NODES.find((n) => n.id === u);
              const b = NODES.find((n) => n.id === v);
              const key = edgeKey(u, v);
              const state = edgeState[key];
              return (
                <line
                  key={key}
                  className={`gcviz-edge gcviz-edge-${state}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              );
            })}
          </g>
          <g className="gcviz-nodes">
            {NODES.map((n) => {
              const fill = nodeFill(n.id);
              const className = nodeClass(n.id);
              const isCurrent = step.current === n.id;
              return (
                <g
                  key={n.id}
                  className={className}
                  transform={`translate(${n.x},${n.y})`}
                  aria-label={`Node ${n.id}`}
                >
                  {isCurrent && (
                    <circle className="gcviz-node-ring" r="30" />
                  )}
                  {isCurrent && step.kind === 'ok' && (
                    <circle className="gcviz-flash gcviz-flash-ok" r="26" />
                  )}
                  {isCurrent && (step.kind === 'conflict' || step.kind === 'fail') && (
                    <circle className="gcviz-flash gcviz-flash-bad" r="26" />
                  )}
                  <circle
                    className="gcviz-node-circle"
                    r="22"
                    style={{ fill }}
                  />
                  <text textAnchor="middle" dominantBaseline="central">{n.id}</text>
                </g>
              );
            })}
          </g>
        </svg>
        {isDone && (
          <div className="gcviz-banner gcviz-banner-ok" role="status">
            Valid {k}-colouring found in {idx} steps.
          </div>
        )}
        {isFail && (
          <div className="gcviz-banner gcviz-banner-bad" role="status">
            Graph is not {k}-colourable. Raise k and try again.
          </div>
        )}
      </div>

      <div className="gcviz-status">
        <div className="gcviz-status-row">
          <span className="gcviz-status-label">Step</span>
          <span className="gcviz-status-value">{idx} / {steps.length - 1}</span>
        </div>
        <div className="gcviz-status-row">
          <span className="gcviz-status-label">Node</span>
          <span className="gcviz-status-value">
            {step.current ?? <span className="gcviz-muted">—</span>}
          </span>
        </div>
        <div className="gcviz-status-row">
          <span className="gcviz-status-label">Try</span>
          <span className="gcviz-status-value">
            {step.tryColor >= 1
              ? COLOR_LABELS[step.tryColor - 1]
              : <span className="gcviz-muted">—</span>}
          </span>
        </div>
      </div>

      <div className="gcviz-stack">
        <div className="gcviz-stack-label">Recursion stack (bottom → top)</div>
        <div className="gcviz-stack-chips">
          {step.stack.length === 0 ? (
            <span className="gcviz-muted">empty</span>
          ) : (
            step.stack.map((frame, i) => (
              <span
                key={`${frame.nodeId}-${i}`}
                className={`gcviz-chip ${i === step.stack.length - 1 ? 'gcviz-chip-top' : ''}`}
                style={{
                  borderColor: `var(${COLOR_TOKENS[frame.color - 1]})`,
                  color: `var(${COLOR_TOKENS[frame.color - 1]})`,
                }}
              >
                {frame.nodeId}:{COLOR_LABELS[frame.color - 1]}
              </span>
            ))
          )}
        </div>
      </div>

      <p className="gcviz-caption">{step.caption}</p>

      <div className="gcviz-controls">
        <button
          type="button"
          className="gcviz-btn gcviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="gcviz-btn gcviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="gcviz-btn gcviz-btn-secondary"
          onClick={next}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
      </div>
    </div>
  );
}
