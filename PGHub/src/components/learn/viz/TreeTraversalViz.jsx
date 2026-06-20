import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './TreeTraversalViz.css';

const NODES = [
  { id: 0, value: 4, x: 320, y: 60,  parent: null, left: 1, right: 2 },
  { id: 1, value: 2, x: 180, y: 160, parent: 0,    left: 3, right: 4 },
  { id: 2, value: 6, x: 460, y: 160, parent: 0,    left: 5, right: 6 },
  { id: 3, value: 1, x: 110, y: 270, parent: 1,    left: null, right: null },
  { id: 4, value: 3, x: 250, y: 270, parent: 1,    left: null, right: null },
  { id: 5, value: 5, x: 390, y: 270, parent: 2,    left: null, right: null },
  { id: 6, value: 7, x: 530, y: 270, parent: 2,    left: null, right: null },
];

const NODE_BY_ID = NODES.reduce((acc, n) => {
  acc[n.id] = n;
  return acc;
}, {});

const EDGES = NODES.flatMap((n) => {
  const out = [];
  if (n.left !== null) out.push({ from: n.id, to: n.left, key: `${n.id}-${n.left}` });
  if (n.right !== null) out.push({ from: n.id, to: n.right, key: `${n.id}-${n.right}` });
  return out;
});

const MODES = [
  { key: 'preorder',   label: 'Pre-order',   rule: 'Visit node → left → right' },
  { key: 'inorder',    label: 'In-order',    rule: 'Left → visit node → right' },
  { key: 'postorder',  label: 'Post-order',  rule: 'Left → right → visit node' },
  { key: 'level',      label: 'Level-order', rule: 'BFS: pop front, visit, enqueue children' },
];

function pushStep(steps, base, patch) {
  steps.push({ ...base, ...patch });
}

function buildPreorder() {
  const steps = [];
  const visited = [];
  const stack = [];
  const output = [];
  const root = NODES[0].id;

  pushStep(steps, {}, {
    cur: null, stack: [], queue: null, visited: [], output: [],
    caption: 'Pre-order: visit the node, then recurse left, then recurse right. Start by calling preorder(root).',
  });

  const walk = (id, depth) => {
    if (id === null) {
      pushStep(steps, {}, {
        cur: null, stack: [...stack], queue: null, visited: [...visited], output: [...output],
        caption: 'Null child — return immediately without visiting.',
      });
      return;
    }
    const node = NODE_BY_ID[id];
    stack.push(id);
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Enter preorder(${node.value}). Push call frame onto the stack.`,
    });

    visited.push(id);
    output.push(node.value);
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Visit ${node.value}. Pre-order writes the node BEFORE descending. Append to output.`,
    });

    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Recurse left from ${node.value}.`,
    });
    walk(node.left, depth + 1);

    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Recurse right from ${node.value}.`,
    });
    walk(node.right, depth + 1);

    stack.pop();
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Return from preorder(${node.value}). Pop call frame.`,
    });
  };

  walk(root, 0);

  pushStep(steps, {}, {
    cur: null, stack: [], queue: null, visited: [...visited], output: [...output],
    caption: `Done. Pre-order sequence: ${output.join(', ')}.`,
  });
  return steps;
}

function buildInorder() {
  const steps = [];
  const visited = [];
  const stack = [];
  const output = [];
  const root = NODES[0].id;

  pushStep(steps, {}, {
    cur: null, stack: [], queue: null, visited: [], output: [],
    caption: 'In-order: recurse left, then visit the node, then recurse right. For a BST this yields sorted order.',
  });

  const walk = (id) => {
    if (id === null) {
      pushStep(steps, {}, {
        cur: null, stack: [...stack], queue: null, visited: [...visited], output: [...output],
        caption: 'Null child — return without visiting.',
      });
      return;
    }
    const node = NODE_BY_ID[id];
    stack.push(id);
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Enter inorder(${node.value}). Push call frame.`,
    });

    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Recurse left from ${node.value} first.`,
    });
    walk(node.left);

    visited.push(id);
    output.push(node.value);
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Visit ${node.value}. In-order writes the node BETWEEN the two subtrees.`,
    });

    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Now recurse right from ${node.value}.`,
    });
    walk(node.right);

    stack.pop();
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Return from inorder(${node.value}). Pop call frame.`,
    });
  };

  walk(root);

  pushStep(steps, {}, {
    cur: null, stack: [], queue: null, visited: [...visited], output: [...output],
    caption: `Done. In-order sequence: ${output.join(', ')}. Sorted because the tree is a BST.`,
  });
  return steps;
}

function buildPostorder() {
  const steps = [];
  const visited = [];
  const stack = [];
  const output = [];
  const root = NODES[0].id;

  pushStep(steps, {}, {
    cur: null, stack: [], queue: null, visited: [], output: [],
    caption: 'Post-order: recurse left, then recurse right, then visit the node. Children print before their parent.',
  });

  const walk = (id) => {
    if (id === null) {
      pushStep(steps, {}, {
        cur: null, stack: [...stack], queue: null, visited: [...visited], output: [...output],
        caption: 'Null child — return without visiting.',
      });
      return;
    }
    const node = NODE_BY_ID[id];
    stack.push(id);
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Enter postorder(${node.value}). Push call frame.`,
    });

    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Recurse left from ${node.value}.`,
    });
    walk(node.left);

    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Recurse right from ${node.value}.`,
    });
    walk(node.right);

    visited.push(id);
    output.push(node.value);
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Visit ${node.value}. Post-order writes the node AFTER both subtrees finish.`,
    });

    stack.pop();
    pushStep(steps, {}, {
      cur: id, stack: [...stack], queue: null, visited: [...visited], output: [...output],
      caption: `Return from postorder(${node.value}). Pop call frame.`,
    });
  };

  walk(root);

  pushStep(steps, {}, {
    cur: null, stack: [], queue: null, visited: [...visited], output: [...output],
    caption: `Done. Post-order sequence: ${output.join(', ')}.`,
  });
  return steps;
}

function buildLevelOrder() {
  const steps = [];
  const visited = [];
  const output = [];
  const queue = [NODES[0].id];
  const root = NODES[0].id;
  const rootNode = NODE_BY_ID[root];

  pushStep(steps, {}, {
    cur: null, stack: null, queue: [...queue], visited: [], output: [],
    caption: `Level-order (BFS): enqueue the root (${rootNode.value}). Process the queue front-to-back.`,
  });

  while (queue.length) {
    const id = queue.shift();
    const node = NODE_BY_ID[id];

    pushStep(steps, {}, {
      cur: id, stack: null, queue: [...queue], visited: [...visited], output: [...output],
      caption: `Dequeue ${node.value} from the front. Visit it.`,
    });

    visited.push(id);
    output.push(node.value);
    pushStep(steps, {}, {
      cur: id, stack: null, queue: [...queue], visited: [...visited], output: [...output],
      caption: `Append ${node.value} to the output. Next: enqueue its children left-to-right.`,
    });

    const added = [];
    if (node.left !== null) { queue.push(node.left); added.push(NODE_BY_ID[node.left].value); }
    if (node.right !== null) { queue.push(node.right); added.push(NODE_BY_ID[node.right].value); }

    if (added.length) {
      pushStep(steps, {}, {
        cur: id, stack: null, queue: [...queue], visited: [...visited], output: [...output],
        caption: `Enqueue children of ${node.value}: ${added.join(', ')}.`,
      });
    } else {
      pushStep(steps, {}, {
        cur: id, stack: null, queue: [...queue], visited: [...visited], output: [...output],
        caption: `${node.value} is a leaf — no children to enqueue.`,
      });
    }
  }

  pushStep(steps, {}, {
    cur: null, stack: null, queue: [], visited: [...visited], output: [...output],
    caption: `Queue empty. Level-order sequence: ${output.join(', ')}.`,
  });
  return steps;
}

const BUILDERS = {
  preorder: buildPreorder,
  inorder: buildInorder,
  postorder: buildPostorder,
  level: buildLevelOrder,
};

export default function TreeTraversalViz() {
  const [mode, setMode] = useState('preorder');
  const steps = useMemo(() => BUILDERS[mode](), [mode]);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const [prevMode, setPrevMode] = useState(mode);
  if (prevMode !== mode) {
    setPrevMode(mode);
    setIdx(0);
    setPlaying(false);
  }

  const step = steps[idx];

  // Derive `playing` so the interval effect never has to setPlaying(false) on
  // reaching the last step — avoids cascading-render lint.
  const playing = playingRaw && idx < steps.length - 1;

  const next = useCallback(() => {
    setIdx((i) => (i >= steps.length - 1 ? i : i + 1));
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
    }, 850);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const nodeState = useMemo(() => {
    const map = {};
    NODES.forEach((n) => { map[n.id] = 'idle'; });
    (step.visited || []).forEach((id) => { map[id] = 'visited'; });
    if (step.cur !== null && step.cur !== undefined) map[step.cur] = 'current';
    return map;
  }, [step]);

  const edgeState = useMemo(() => {
    const map = {};
    EDGES.forEach((e) => { map[e.key] = 'idle'; });
    const visitedSet = new Set(step.visited || []);
    EDGES.forEach((e) => {
      if (visitedSet.has(e.from) && visitedSet.has(e.to)) map[e.key] = 'visited';
      else if (step.cur === e.to && visitedSet.has(e.from)) map[e.key] = 'active';
    });
    return map;
  }, [step]);

  const atEnd = idx >= steps.length - 1;
  const activeMode = MODES.find((m) => m.key === mode);
  const useQueue = mode === 'level';

  return (
    <div className="ttviz">
      <div className="ttviz-header">
        <div className="ttviz-title">Binary Tree Traversals</div>
        <div className="ttviz-rule">{activeMode.rule}</div>
      </div>

      <div className="ttviz-modes" role="tablist" aria-label="Traversal mode">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            className={`ttviz-mode ${mode === m.key ? 'ttviz-mode-active' : ''}`}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="ttviz-legend">
        <span className="ttviz-legend-item">
          <span className="ttviz-dot ttviz-dot-idle" /> unvisited
        </span>
        <span className="ttviz-legend-item">
          <span className="ttviz-dot ttviz-dot-current" /> visiting
        </span>
        <span className="ttviz-legend-item">
          <span className="ttviz-dot ttviz-dot-visited" /> visited
        </span>
      </div>

      <div className="ttviz-stage">
        <svg
          className="ttviz-svg"
          viewBox="0 0 640 340"
          role="img"
          aria-label="Binary tree traversal visualization"
        >
          <g className="ttviz-edges">
            {EDGES.map((e) => {
              const a = NODE_BY_ID[e.from];
              const b = NODE_BY_ID[e.to];
              const state = edgeState[e.key];
              return (
                <line
                  key={e.key}
                  className={`ttviz-edge ttviz-edge-${state}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              );
            })}
          </g>
          <g className="ttviz-nodes">
            {NODES.map((n) => {
              const state = nodeState[n.id];
              return (
                <g
                  key={n.id}
                  className={`ttviz-node ttviz-node-${state}`}
                  transform={`translate(${n.x},${n.y})`}
                  aria-label={`Node ${n.value}, ${state}`}
                >
                  {state === 'current' && (
                    <circle className="ttviz-node-ring" r="30" />
                  )}
                  <circle className="ttviz-node-circle" r="23" />
                  <text textAnchor="middle" dominantBaseline="central">{n.value}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="ttviz-status">
        <div className="ttviz-status-row">
          <span className="ttviz-status-label">Step</span>
          <span className="ttviz-status-value">{idx} / {steps.length - 1}</span>
        </div>
        <div className="ttviz-status-row">
          <span className="ttviz-status-label">Visiting</span>
          <span className="ttviz-status-value">
            {step.cur !== null && step.cur !== undefined
              ? NODE_BY_ID[step.cur].value
              : <span className="ttviz-muted">—</span>}
          </span>
        </div>
        <div className="ttviz-status-row">
          <span className="ttviz-status-label">Mode</span>
          <span className="ttviz-status-value">{activeMode.label}</span>
        </div>
      </div>

      <div className="ttviz-panel">
        <div className="ttviz-panel-label">
          {useQueue ? 'Queue (front → back)' : 'Call stack (bottom → top)'}
        </div>
        <div className="ttviz-panel-chips">
          {useQueue ? (
            (step.queue || []).length === 0 ? (
              <span className="ttviz-muted">empty</span>
            ) : (
              step.queue.map((id, i) => (
                <span
                  key={`q-${id}-${i}`}
                  className={`ttviz-chip ttviz-chip-queue ${i === 0 ? 'ttviz-chip-head' : ''}`}
                >
                  {NODE_BY_ID[id].value}
                </span>
              ))
            )
          ) : (
            (step.stack || []).length === 0 ? (
              <span className="ttviz-muted">empty</span>
            ) : (
              step.stack.map((id, i, arr) => (
                <span
                  key={`s-${id}-${i}`}
                  className={`ttviz-chip ttviz-chip-stack ${i === arr.length - 1 ? 'ttviz-chip-head' : ''}`}
                >
                  {NODE_BY_ID[id].value}
                </span>
              ))
            )
          )}
        </div>
      </div>

      <div className="ttviz-panel">
        <div className="ttviz-panel-label">Output sequence</div>
        <div className="ttviz-panel-chips">
          {(step.output || []).length === 0 ? (
            <span className="ttviz-muted">empty</span>
          ) : (
            step.output.map((v, i) => (
              <span key={`o-${i}`} className="ttviz-chip ttviz-chip-output">{v}</span>
            ))
          )}
        </div>
      </div>

      <p className="ttviz-caption">{step.caption}</p>

      <div className="ttviz-controls">
        <button
          type="button"
          className="ttviz-btn ttviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="ttviz-btn ttviz-btn-primary"
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
          className="ttviz-btn ttviz-btn-secondary"
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
