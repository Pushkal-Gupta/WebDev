import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronsLeft, ChevronsRight, Wand2 } from 'lucide-react';
import Select from '../Select';
import './AlgoVisualizer.css';

// Generic stepwise visualizer for concept-page algorithm walkthroughs.
//
// Props:
//   - frames: Array<{ caption?: string, ...payload }>  — single-case shortcut
//   - cases?: Array<{ label, frames }>                  — multiple precomputed cases
//   - build?: (inputObj) => frames                       — generator for custom input
//   - inputSchema?: { fields: [{ name, label, type, default, max? }] }
//   - render: (frame, index) => JSX                    — per-frame painter
//   - title?: string
//   - autoPlay?: boolean (default false)
//   - speed?: number (ms between frames, default 1200)

const MAX_INT_ARRAY = 30;
const MAX_STR_LEN = 30;

function parseIntArray(raw) {
  if (!raw.trim()) return [];
  return raw.split(/[\s,]+/).filter(Boolean).map(s => {
    const n = Number(s);
    if (!Number.isFinite(n)) throw new Error(`"${s}" is not a number`);
    return n;
  });
}
function parseField(field, raw) {
  if (field.type === 'intArray') {
    const arr = parseIntArray(String(raw));
    if (arr.length > (field.max || MAX_INT_ARRAY)) {
      throw new Error(`${field.label}: too many values (max ${field.max || MAX_INT_ARRAY})`);
    }
    return arr;
  }
  if (field.type === 'int') {
    const n = Number(raw);
    if (!Number.isInteger(n)) throw new Error(`${field.label}: must be an integer`);
    return n;
  }
  if (field.type === 'string') {
    const s = String(raw);
    if (s.length > (field.max || MAX_STR_LEN)) {
      throw new Error(`${field.label}: too long (max ${field.max || MAX_STR_LEN} chars)`);
    }
    return s;
  }
  return raw;
}
function stringifyField(field, value) {
  if (field.type === 'intArray') return (value || []).join(', ');
  return String(value ?? '');
}

function CustomInputForm({ schema, build, onFrames, onError }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(schema.fields.map(f => [f.name, stringifyField(f, f.default)]))
  );
  const [err, setErr] = useState(null);

  const apply = () => {
    try {
      const parsed = {};
      for (const f of schema.fields) parsed[f.name] = parseField(f, values[f.name]);
      const frames = build(parsed);
      if (!Array.isArray(frames) || frames.length === 0) {
        throw new Error('Generator returned no frames for this input.');
      }
      setErr(null);
      onError(null);
      onFrames(frames);
    } catch (e) {
      setErr(e.message);
      onError(e.message);
    }
  };

  return (
    <div className="viz-custom">
      {schema.fields.map(f => (
        <label key={f.name} className="viz-custom-field">
          <span className="viz-custom-label">{f.label}</span>
          <input
            type="text"
            value={values[f.name] ?? ''}
            onChange={(e) => setValues(v => ({ ...v, [f.name]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') apply(); }}
            placeholder={f.placeholder || ''}
            spellCheck={false}
          />
        </label>
      ))}
      <button type="button" className="viz-custom-apply" onClick={apply}>
        <Wand2 size={12} /> Visualize
      </button>
      {err && <div className="viz-custom-error">{err}</div>}
    </div>
  );
}

export default function AlgoVisualizer({
  frames, cases, build, inputSchema,
  render, title, autoPlay = false, speed = 1200,
}) {
  // Normalize: build a single "tabs" array of { label, frames } even if the
  // caller passed plain `frames` (single-case mode).
  const tabs = useMemo(() => {
    if (Array.isArray(cases) && cases.length) return cases;
    if (Array.isArray(frames) && frames.length) return [{ label: 'Default', frames }];
    return [];
  }, [cases, frames]);

  const [tabIdx, setTabIdxRaw] = useState(0);
  const [customFrames, setCustomFramesRaw] = useState(null);
  const [customErr, setCustomErr] = useState(null);
  const isCustom = tabIdx === tabs.length;
  const activeFrames = isCustom ? (customFrames || []) : (tabs[tabIdx]?.frames || []);

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(!!autoPlay);
  const [tempo, setTempo] = useState(speed);
  const timerRef = useRef(null);

  // Switching tab or re-running custom input resets the playback head.
  // Done inline (not via useEffect) to avoid a cascading-render warning.
  const setTabIdx = (next) => { setTabIdxRaw(next); setI(0); setPlaying(false); };
  const setCustomFrames = (next) => { setCustomFramesRaw(next); setI(0); setPlaying(false); };

  const safeIdx = activeFrames.length ? Math.max(0, Math.min(activeFrames.length - 1, i)) : 0;
  const frame = activeFrames[safeIdx];

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setI(prev => {
        if (prev >= activeFrames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, tempo);
    return () => clearInterval(timerRef.current);
  }, [playing, tempo, activeFrames.length]);

  const reset = useCallback(() => { setI(0); setPlaying(false); }, []);
  const step = (delta) => { setPlaying(false); setI(p => Math.max(0, Math.min(activeFrames.length - 1, p + delta))); };
  const seek = (idx) => { setPlaying(false); setI(idx); };

  if (!tabs.length) return null;

  const showCustomTab = !!(build && inputSchema);

  return (
    <div className="viz">
      {title && <h4 className="viz-title">{title}</h4>}

      {(tabs.length > 1 || showCustomTab) && (
        <div className="viz-cases" role="tablist">
          {tabs.map((c, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={tabIdx === idx}
              className={`viz-case ${tabIdx === idx ? 'active' : ''}`}
              onClick={() => setTabIdx(idx)}
            >
              {c.label || `Case ${idx + 1}`}
            </button>
          ))}
          {showCustomTab && (
            <button
              type="button"
              role="tab"
              aria-selected={isCustom}
              className={`viz-case ${isCustom ? 'active' : ''}`}
              onClick={() => setTabIdx(tabs.length)}
            >
              <Wand2 size={11} /> Custom
            </button>
          )}
        </div>
      )}

      {isCustom && (
        <CustomInputForm
          schema={inputSchema}
          build={build}
          onFrames={setCustomFrames}
          onError={setCustomErr}
        />
      )}

      {frame && !customErr && (
        <>
          <div className="viz-stage">
            {render(frame, safeIdx)}
          </div>
          {frame.caption && <p className="viz-caption">{frame.caption}</p>}
        </>
      )}

      {isCustom && !customFrames && !customErr && (
        <p className="viz-caption">Enter input above and press Visualize.</p>
      )}

      {activeFrames.length > 0 && (
        <div className="viz-controls">
          <button onClick={() => step(-Infinity)} aria-label="First step" title="First step">
            <ChevronsLeft size={13} />
          </button>
          <button onClick={() => step(-1)} aria-label="Previous step" title="Previous">
            <SkipBack size={13} />
          </button>
          <button
            className="viz-play"
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={() => step(1)} aria-label="Next step" title="Next">
            <SkipForward size={13} />
          </button>
          <button onClick={() => step(Infinity)} aria-label="Last step" title="Last step">
            <ChevronsRight size={13} />
          </button>
          <button onClick={reset} aria-label="Reset" title="Reset">
            <RotateCcw size={13} />
          </button>
          <div className="viz-progress">
            <input
              type="range"
              min={0}
              max={Math.max(0, activeFrames.length - 1)}
              value={safeIdx}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
            />
            <span className="viz-step-label">
              Step <strong>{safeIdx + 1}</strong> / {activeFrames.length}
            </span>
          </div>
          <Select
            value={String(tempo)}
            onChange={(v) => setTempo(Number(v))}
            options={[
              { value: '2000', label: '0.5×' },
              { value: '1200', label: '1×' },
              { value: '800',  label: '1.5×' },
              { value: '400',  label: '3×' },
            ]}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Reusable renderers — pass them as the `render` prop.
// Each renderer expects a specific frame shape.
// ─────────────────────────────────────────────────────────────────────────

// Frame: { array, highlights?: { [index]: 'left'|'right'|'mid'|'low'|'high'|'match' }, eliminated?: Set<number> }
export function ArrayBarRenderer({ frame }) {
  const arr = frame.array || [];
  const max = Math.max(1, ...arr.map(Math.abs));
  return (
    <div className="viz-array">
      {arr.map((v, idx) => {
        const role = frame.highlights?.[idx];
        const eliminated = frame.eliminated?.has?.(idx) || frame.eliminated?.includes?.(idx);
        const height = Math.max(8, Math.round((Math.abs(v) / max) * 120));
        return (
          <div
            key={idx}
            className={`viz-bar ${role ? 'viz-bar-' + role : ''} ${eliminated ? 'viz-bar-eliminated' : ''}`}
            style={{ height: `${height}px` }}
            title={`arr[${idx}] = ${v}`}
          >
            <span className="viz-bar-value">{v}</span>
            <span className="viz-bar-idx">{idx}</span>
          </div>
        );
      })}
    </div>
  );
}

// Frame: { nodes: [{ id, label, state? }], edges: [{ a, b, state? }] }
export function GraphRenderer({ frame }) {
  const nodes = frame.nodes || [];
  const edges = frame.edges || [];
  if (nodes.length === 0) return null;
  // Place nodes in a circle for stability across frames.
  const cx = 160, cy = 110, R = 80;
  const positioned = nodes.map((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return { ...n, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
  const posById = Object.fromEntries(positioned.map(n => [n.id, n]));
  return (
    <svg className="viz-graph" viewBox="0 0 320 220" role="img" aria-label="graph">
      {edges.map((e, i) => {
        const a = posById[e.a]; const b = posById[e.b];
        if (!a || !b) return null;
        return (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            className={`viz-edge ${e.state ? 'viz-edge-' + e.state : ''}`} />
        );
      })}
      {edges.map((e, i) => {
        const a = posById[e.a]; const b = posById[e.b];
        if (!a || !b || e.w == null) return null;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        return (
          <text key={`w-${i}`} x={mx} y={my} dy="-4" textAnchor="middle" className="viz-edge-weight">
            {e.w}
          </text>
        );
      })}
      {positioned.map(n => {
        const lines = String(n.label ?? n.id).split('\n');
        const r = lines.length > 1 ? 20 : 16;
        return (
          <g key={n.id} className={`viz-node ${n.state ? 'viz-node-' + n.state : ''}`}>
            <circle cx={n.x} cy={n.y} r={r} />
            <text x={n.x} y={n.y} dy={lines.length > 1 ? '-0.2em' : '.34em'} textAnchor="middle">
              {lines.map((line, i) => (
                <tspan key={i} x={n.x} dy={i === 0 ? 0 : '1em'}>{line}</tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Frame: { numbers: number[], state: { [n]: 'prime'|'composite'|'current'|'cross' }, cols?: number }
//   — flat form (sieve etc.)
// Frame: { grid: [[cell]], rows, cols, cellLabel?, caption? }
//   — 2D form. Each cell is a short token; reused state classes via viz-num-*.
//   Default mapping: '.' (open path) → none, '#' (wall) → composite, 'S' → current,
//   'G' → prime, 'O' (frontier) → cross, 'C' (closed) → composite, '*' (path) → current.
export function NumberGridRenderer({ frame }) {
  if (Array.isArray(frame.grid)) {
    const grid = frame.grid;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    const defaultMap = {
      '.': null,
      '#': 'composite',
      'S': 'current',
      'G': 'prime',
      'O': 'cross',
      'C': 'composite',
      '*': 'current',
    };
    const labelMap = frame.cellLabel || {
      '.': '·', '#': '█', 'S': 'S', 'G': 'G', 'O': 'O', 'C': 'C', '*': '*',
    };
    return (
      <div className="viz-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: `${cols * 32}px` }}>
        {Array.from({ length: rows * cols }, (_, k) => {
          const r = Math.floor(k / cols), c = k % cols;
          const raw = grid[r][c];
          const role = defaultMap[raw];
          const display = Object.prototype.hasOwnProperty.call(labelMap, raw) ? labelMap[raw] : raw;
          return (
            <div key={`${r}-${c}`} className={`viz-num ${role ? 'viz-num-' + role : ''}`} title={`(${r},${c}) ${raw}`}>
              {display}
            </div>
          );
        })}
      </div>
    );
  }
  const nums = frame.numbers || [];
  const cols = frame.cols || 10;
  return (
    <div className="viz-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {nums.map((n) => {
        const role = frame.state?.[n];
        return (
          <div key={n} className={`viz-num ${role ? 'viz-num-' + role : ''}`} title={`${n}`}>
            {n}
          </div>
        );
      })}
    </div>
  );
}

// Frame: { tree: { value, state?, left, right }, caption? }
// Each node's `value` is shown inside the circle; `state` matches viz-node-* states.
export function TreeRenderer({ frame }) {
  const root = frame.tree;
  if (!root) return null;

  // First pass: compute depth + horizontal slot via in-order traversal so
  // nodes spread evenly without crossing edges.
  const slots = [];
  const collect = (node, depth) => {
    if (!node) return;
    collect(node.left, depth + 1);
    slots.push({ node, depth, slot: slots.length });
    collect(node.right, depth + 1);
  };
  collect(root, 0);
  if (slots.length === 0) return null;
  const maxDepth = Math.max(...slots.map(s => s.depth));
  const xStep = 320 / Math.max(slots.length, 1);
  const yStep = maxDepth === 0 ? 0 : 180 / maxDepth;

  // Map each node to its computed center.
  const pos = new Map();
  for (const s of slots) {
    pos.set(s.node, { x: 20 + (s.slot + 0.5) * xStep, y: 30 + s.depth * yStep });
  }

  const edges = [];
  const walk = (node) => {
    if (!node) return;
    for (const child of [node.left, node.right]) {
      if (child) edges.push({ a: pos.get(node), b: pos.get(child), state: child.state });
      walk(child);
    }
  };
  walk(root);

  return (
    <svg className="viz-graph" viewBox="0 0 360 240" role="img" aria-label="tree">
      {edges.map((e, i) => (
        <line key={i} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
          className={`viz-edge ${e.state === 'current' || e.state === 'visited' ? 'viz-edge-tree' : ''}`} />
      ))}
      {slots.map(({ node }) => {
        const p = pos.get(node);
        return (
          <g key={node._id ?? `${p.x}-${p.y}`} className={`viz-node ${node.state ? 'viz-node-' + node.state : ''}`}>
            <circle cx={p.x} cy={p.y} r={14} />
            <text x={p.x} y={p.y} dy=".34em" textAnchor="middle">{node.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Frame: { array, window: [l, r] (inclusive), state? }
export function SlidingWindowRenderer({ frame }) {
  const arr = frame.array || [];
  const [l, r] = frame.window || [0, -1];
  return (
    <div className="viz-window">
      {arr.map((v, idx) => {
        const inWindow = idx >= l && idx <= r;
        const isL = idx === l;
        const isR = idx === r;
        return (
          <div
            key={idx}
            className={`viz-cell ${inWindow ? 'viz-cell-window' : ''} ${isL ? 'viz-cell-l' : ''} ${isR ? 'viz-cell-r' : ''}`}
            title={`arr[${idx}] = ${v}`}
          >
            <span className="viz-cell-value">{v}</span>
            <span className="viz-cell-idx">{idx}</span>
          </div>
        );
      })}
    </div>
  );
}
