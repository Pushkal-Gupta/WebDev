import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronsLeft, ChevronsRight, Wand2, Keyboard } from 'lucide-react';
import { friendlyError } from '../../lib/errors';
import './AlgoVisualizer.css';

const SPEED_MAP = { 0.5: 2000, 1: 1200, 1.5: 800, 2: 500 };

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
      setErr(friendlyError(e));
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
  const initialSpeedX = useMemo(() => {
    const match = Object.entries(SPEED_MAP).find(([, ms]) => ms === speed);
    return match ? Number(match[0]) : 1;
  }, [speed]);
  const [speedX, setSpeedX] = useState(initialSpeedX);
  const tempo = SPEED_MAP[speedX] ?? 1200;
  const [showHelp, setShowHelp] = useState(false);
  const timerRef = useRef(null);
  const rootRef = useRef(null);
  const tablistRef = useRef(null);
  const [underline, setUnderline] = useState({ left: 0, width: 0, visible: false });

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
  const step = useCallback((delta) => {
    setPlaying(false);
    setI(p => Math.max(0, Math.min(activeFrames.length - 1, p + delta)));
  }, [activeFrames.length]);
  const seek = useCallback((idx) => { setPlaying(false); setI(idx); }, []);

  // Keyboard shortcuts — only active when the viz container has focus or
  // contains the focused element. Avoids hijacking shortcuts from inputs.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKey = (e) => {
      const active = document.activeElement;
      if (!root.contains(active)) return;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active?.isContentEditable) return;
      if (!activeFrames.length) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        step(-Infinity);
      } else if (e.key === 'End') {
        e.preventDefault();
        step(Infinity);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHelp(h => !h);
      } else if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeFrames.length, step, showHelp]);

  // Slide the underline pill under the active tab. Measurement-after-layout
  // genuinely requires writing state from an effect — there is no way to know
  // the DOM rect without reading it post-paint.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    const list = tablistRef.current;
    if (!list) { setUnderline(u => ({ ...u, visible: false })); return; }
    const idx = isCustom ? tabs.length : tabIdx;
    const btn = list.querySelectorAll('.viz-case')[idx];
    if (!btn) { setUnderline(u => ({ ...u, visible: false })); return; }
    const listRect = list.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setUnderline({
      left: btnRect.left - listRect.left,
      width: btnRect.width,
      visible: true,
    });
  }, [tabIdx, isCustom, tabs.length]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!tabs.length) return null;

  const showCustomTab = !!(build && inputSchema);

  return (
    <div className="viz" ref={rootRef} tabIndex={-1}>
      {title && <h4 className="viz-title">{title}</h4>}

      {(tabs.length > 1 || showCustomTab) && (
        <div className="viz-cases" role="tablist" ref={tablistRef}>
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
          {underline.visible && (
            <span
              className="viz-case-underline"
              style={{ left: `${underline.left}px`, width: `${underline.width}px` }}
              aria-hidden="true"
            />
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
          <div className="viz-workspace">
            <div className="viz-canvas-col">
              <div className="viz-stage">
                <div key={`${tabIdx}-${safeIdx}`} className="viz-stage-frame">
                  {render(frame, safeIdx)}
                </div>
              </div>
              {activeFrames.length > 0 && (
                <div className="viz-progress-bar" aria-hidden="true">
                  <div
                    className="viz-progress-bar-fill"
                    style={{ width: `${((safeIdx + 1) / activeFrames.length) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <aside className="viz-explain" aria-live="polite">
              <div className="viz-explain-head">
                <span className="viz-explain-kicker">Step</span>
                <span className="viz-explain-count">
                  <strong>{safeIdx + 1}</strong> / {activeFrames.length}
                </span>
              </div>
              {frame.caption ? (
                <p key={`cap-${tabIdx}-${safeIdx}`} className="viz-explain-body">
                  {frame.caption}
                </p>
              ) : (
                <p className="viz-explain-body viz-explain-empty">
                  Step through the animation to follow each operation.
                </p>
              )}
            </aside>
          </div>
        </>
      )}

      {isCustom && !customFrames && !customErr && (
        <p className="viz-caption">Enter input above and press Visualize.</p>
      )}

      {activeFrames.length > 0 && (
        <div className="viz-controls">
          <button onClick={() => step(-Infinity)} aria-label="First step" title="First step (Home)">
            <ChevronsLeft size={13} />
          </button>
          <button onClick={() => step(-1)} aria-label="Previous step" title="Previous (Left)">
            <SkipBack size={13} />
          </button>
          <button
            className="viz-play"
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
            title={playing ? 'Pause (Space)' : 'Play (Space)'}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={() => step(1)} aria-label="Next step" title="Next (Right)">
            <SkipForward size={13} />
          </button>
          <button onClick={() => step(Infinity)} aria-label="Last step" title="Last step (End)">
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
          <div className="viz-tempo">
            <span className="viz-tempo-label">Speed</span>
            <div className="viz-tempo-buttons" role="group">
              {[0.5, 1, 1.5, 2].map(x => (
                <button
                  key={x}
                  type="button"
                  className={`viz-tempo-btn ${speedX === x ? 'active' : ''}`}
                  onClick={() => setSpeedX(x)}
                >
                  {x}x
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="viz-help-btn"
            onClick={() => setShowHelp(h => !h)}
            aria-label="Keyboard shortcuts"
            aria-expanded={showHelp}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={12} />
            <span>?</span>
          </button>
          {showHelp && (
            <div className="viz-help-popover" role="dialog" aria-label="Keyboard shortcuts">
              <div className="viz-help-row"><kbd>Space</kbd><span>Play / Pause</span></div>
              <div className="viz-help-row"><kbd>{'←'}</kbd><kbd>{'→'}</kbd><span>Step</span></div>
              <div className="viz-help-row"><kbd>Home</kbd><kbd>End</kbd><span>Jump to start / end</span></div>
              <div className="viz-help-row"><kbd>?</kbd><span>Toggle this help</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Reusable renderers — pass them as the `render` prop.
// Each renderer expects a specific frame shape.
// ─────────────────────────────────────────────────────────────────────────

// Frame: {
//   array,
//   highlights?: { [index]: 'left'|'right'|'mid'|'low'|'high'|'match'|'compared'|'pivot'|'visited'|'current'|'frontier'|'done'|'tree' },
//   eliminated?: Set<number> | number[],
//   pointers?: { [index]: string | string[] }   // labels above cells (lo / hi / i / j / mid)
//   chip?: { label: string, value: string|number } | Array  // floating stat chip
//   subRow?: { values: (string|number)[], label?: string }   // parallel row (p[] for Manacher, etc.)
//   arcs?: [{ center: number, radius: number, color?: 'accent'|'mint'|'sky'|'pink'|'violet' }]
// }
// Rows align by sharing one CSS grid: `repeat(count, 1fr)`. Every cell is an
// equal fraction of the available width, so the whole array shrinks to fit the
// container (no fixed px width => no horizontal scrollbar) and pointers / arcs /
// sub-rows stay perfectly in column with the bars or cells above/below them.
function PointerLabels({ pointers, count, gap }) {
  if (!pointers || count === 0) return null;
  // Stack identical-cell labels vertically so they don't overlap.
  const byIdx = {};
  Object.entries(pointers).forEach(([k, v]) => {
    const idx = Number(k);
    if (!Number.isFinite(idx) || idx < 0 || idx >= count) return;
    const labels = Array.isArray(v) ? v : [v];
    byIdx[idx] = labels;
  });
  if (Object.keys(byIdx).length === 0) return null;
  return (
    <div
      className="viz-pointer-row"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: `${gap}px` }}
    >
      {Array.from({ length: count }).map((_, idx) => {
        const labels = byIdx[idx];
        return (
          <div key={idx} className="viz-pointer-slot">
            {labels && (
              <div className="viz-pointer-stack">
                {labels.map((label, li) => (
                  <span key={li} className="viz-pointer-label">{label}</span>
                ))}
                <span className="viz-pointer-arrow" aria-hidden="true" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatChip({ chip }) {
  if (!chip) return null;
  const list = Array.isArray(chip) ? chip : [chip];
  if (!list.length) return null;
  return (
    <div className="viz-chip-row">
      {list.map((c, i) => (
        <span key={i} className={`viz-chip viz-chip-${c.tone || 'accent'}`}>
          <span className="viz-chip-label">{c.label}</span>
          <span className="viz-chip-value">{c.value}</span>
        </span>
      ))}
    </div>
  );
}

function PalindromeArcs({ arcs, count }) {
  if (!arcs || !arcs.length || count === 0) return null;
  // Internal coordinate space: unit cell = 100 wide. CSS width:100% scales the
  // whole layer down to match the array row above it; no px overflow possible.
  const cellWidth = 100;
  const totalW = count * cellWidth;
  const height = 30;
  const cx = (idx) => idx * cellWidth + cellWidth / 2;
  return (
    <svg
      className="viz-arc-layer"
      viewBox={`0 0 ${totalW} ${height}`}
      width="100%"
      height={height}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {arcs.map((a, i) => {
        const center = a.center;
        const radius = a.radius;
        if (!Number.isFinite(center) || !Number.isFinite(radius) || radius < 0) return null;
        const lo = Math.max(0, center - radius);
        const hi = Math.min(count - 1, center + radius);
        const x1 = cx(lo);
        const x2 = cx(hi);
        const mx = (x1 + x2) / 2;
        const my = height - 4;
        const top = 4;
        const tone = a.color || 'accent';
        return (
          <path
            key={i}
            d={`M ${x1} ${my} Q ${mx} ${top} ${x2} ${my}`}
            className={`viz-arc viz-arc-${tone}`}
          />
        );
      })}
    </svg>
  );
}

function SubRow({ subRow, count, gap }) {
  if (!subRow || !Array.isArray(subRow.values) || count === 0) return null;
  return (
    <div className="viz-subrow-wrap">
      {subRow.label && <span className="viz-subrow-label">{subRow.label}</span>}
      <div
        className="viz-subrow"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: `${gap}px`, width: '100%' }}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="viz-subrow-cell">
            {subRow.values[idx] ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArrayBarRenderer({ frame }) {
  // Accept several frame shapes and normalize to a values array + a per-index
  // role map so one renderer covers every producer:
  //  - `array` of raw values, or `array`/`cells` of cell-objects ({value, role|state})
  //  - `highlights` as an index→role map, a per-index role array, or a list of indices.
  const source = Array.isArray(frame.array) ? frame.array
    : (Array.isArray(frame.cells) ? frame.cells : []);
  const isCellObj = (c) => c && typeof c === 'object' && !Array.isArray(c);
  const arr = source.map(c => (isCellObj(c) ? c.value : c));
  let highlights = frame.highlights;
  if (Array.isArray(highlights) && highlights.every(h => typeof h === 'number')) {
    const m = {}; for (const i of highlights) m[i] = 'current'; highlights = m;
  }
  // Fold any per-cell role/state (from cell-objects) into the role map. A
  // 'default'/'highlight' role maps to no-op / the styled 'current' class.
  if (source.some(isCellObj)) {
    const m = Array.isArray(highlights) ? { ...highlights } : { ...(highlights || {}) };
    source.forEach((c, i) => {
      if (!isCellObj(c)) return;
      const role = c.role ?? c.state;
      if (role && role !== 'default') m[i] = role === 'highlight' ? 'current' : role;
    });
    highlights = m;
  }
  // Heuristic: if every value parses as a finite number, render as a bar chart;
  // otherwise render labeled tiles (used by viz like treap, quickhull, persistent
  // segment tree where each entry is a structured string).
  const numeric = arr.length > 0 && arr.every(v => typeof v === 'number' && Number.isFinite(v));
  if (numeric) {
    const max = Math.max(1, ...arr.map(v => Math.abs(v)));
    const gap = 8;
    const cols = `repeat(${arr.length}, minmax(0, 1fr))`;
    return (
      <div className="viz-array-block">
        <StatChip chip={frame.chip} />
        <PointerLabels pointers={frame.pointers} count={arr.length} gap={gap} />
        <div className="viz-array" style={{ display: 'grid', gridTemplateColumns: cols, gap: `${gap}px` }}>
          {arr.map((v, idx) => {
            const role = highlights?.[idx];
            const eliminated = frame.eliminated?.has?.(idx) || frame.eliminated?.includes?.(idx);
            const heightPct = Math.max(6, Math.round((Math.abs(v) / max) * 100));
            return (
              <div
                key={idx}
                className={`viz-bar ${role ? 'viz-bar-' + role : ''} ${eliminated ? 'viz-bar-eliminated' : ''}`}
                style={{ height: `${heightPct}%` }}
                title={`arr[${idx}] = ${v}`}
              >
                <span className="viz-bar-value">{v}</span>
                <span className="viz-bar-idx">{idx}</span>
              </div>
            );
          })}
        </div>
        <PalindromeArcs arcs={frame.arcs} count={arr.length} />
        <SubRow subRow={frame.subRow} count={arr.length} gap={gap} />
      </div>
    );
  }
  const gap = 10;
  const cols = `repeat(${arr.length}, minmax(0, 1fr))`;
  return (
    <div className="viz-array-block">
      <StatChip chip={frame.chip} />
      <PointerLabels pointers={frame.pointers} count={arr.length} gap={gap} />
      <div className="viz-tiles" style={{ display: 'grid', gridTemplateColumns: cols, gap: `${gap}px` }}>
        {arr.map((v, idx) => {
          const role = highlights?.[idx];
          const eliminated = frame.eliminated?.has?.(idx) || frame.eliminated?.includes?.(idx);
          return (
            <div
              key={idx}
              className={`viz-tile ${role ? 'viz-tile-' + role : ''} ${eliminated ? 'viz-tile-eliminated' : ''}`}
              title={`[${idx}] ${v}`}
            >
              <span className="viz-tile-value">{String(v)}</span>
              <span className="viz-tile-idx">{idx}</span>
            </div>
          );
        })}
      </div>
      <PalindromeArcs arcs={frame.arcs} count={arr.length} />
      <SubRow subRow={frame.subRow} count={arr.length} gap={gap} />
    </div>
  );
}

// Frame: { nodes: [{ id, label, state? }], edges: [{ a, b, state?, w? }], chip? }
export function GraphRenderer({ frame }) {
  const nodes = frame.nodes || [];
  const edges = frame.edges || [];
  if (nodes.length === 0) return null;
  // Place nodes in a circle. Radius scales with node count so a 23-node graph
  // spreads out instead of overlapping; the viewBox is then computed from the
  // actual node extents (below) so CSS width:100% scales the whole thing to fit.
  const PAD = 40;
  const R = Math.max(120, Math.min(360, nodes.length * 16));
  const cx = R + PAD, cy = R + PAD;
  const positioned = nodes.map((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return { ...n, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
  const posById = Object.fromEntries(positioned.map(n => [n.id, n]));
  // Content-fit viewBox: bound to the nodes (single node => fixed box).
  const xs = positioned.map(n => n.x), ys = positioned.map(n => n.y);
  const minX = Math.min(...xs) - PAD, maxX = Math.max(...xs) + PAD;
  const minY = Math.min(...ys) - PAD, maxY = Math.max(...ys) + PAD;
  const vbW = Math.max(120, maxX - minX), vbH = Math.max(120, maxY - minY);
  const viewBox = `${minX} ${minY} ${vbW} ${vbH}`;
  // Tolerate the legacy frame shape some producers still emit: edges keyed
  // {from,to,weight} instead of {a,b,w}, node highlighting via a
  // frame.highlightedNodes map instead of per-node state, and active edges via
  // a frame.highlightedEdges list. Without this normalization those vizzes
  // (e.g. bellman-ford) render nodes with no edges and no highlights.
  const edgeA = (e) => e.a ?? e.from;
  const edgeB = (e) => e.b ?? e.to;
  const edgeW = (e) => (e.w ?? e.weight);
  const ekey = (x, y) => `${x}->${y}`;
  const hlEdges = new Set((frame.highlightedEdges || []).map(h => ekey(h.a ?? h.from, h.b ?? h.to)));
  const edgeState = (e) => e.state ?? (hlEdges.has(ekey(edgeA(e), edgeB(e))) ? 'current' : null);
  const nodeState = (n) => n.state ?? frame.highlightedNodes?.[n.id] ?? null;
  return (
    <div className="viz-graph-block">
      <StatChip chip={frame.chip} />
      <svg
        className="viz-graph"
        viewBox={viewBox}
        style={{ aspectRatio: `${vbW} / ${vbH}` }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="graph"
      >
        {/* Edges first (under nodes). */}
        {edges.map((e, i) => {
          const a = posById[edgeA(e)]; const b = posById[edgeB(e)];
          if (!a || !b) return null;
          const st = edgeState(e);
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              className={`viz-edge ${st ? 'viz-edge-' + st : ''}`} />
          );
        })}
        {edges.map((e, i) => {
          const a = posById[edgeA(e)]; const b = posById[edgeB(e)];
          const wv = edgeW(e);
          if (!a || !b || wv == null) return null;
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const text = String(wv);
          const w = Math.max(16, 8 + text.length * 6);
          return (
            <g key={`w-${i}`} className={`viz-edge-weight-group ${edgeState(e) ? 'viz-edge-weight-' + edgeState(e) : ''}`}>
              <rect x={mx - w / 2} y={my - 8} width={w} height={14} rx={7} className="viz-edge-weight-bg" />
              <text x={mx} y={my} dy=".34em" textAnchor="middle" className="viz-edge-weight">{text}</text>
            </g>
          );
        })}
        {/* Nodes with optional accent ring for current. */}
        {positioned.map(n => {
          const lines = String(n.label ?? n.id).split('\n');
          const r = lines.length > 1 ? 22 : 18;
          const st = nodeState(n);
          const isCurrent = st === 'current';
          const isFrontier = st === 'frontier';
          return (
            <g key={n.id} className={`viz-node ${st ? 'viz-node-' + st : ''}`}>
              {isCurrent && <circle cx={n.x} cy={n.y} r={r + 6} className="viz-node-ring" />}
              {isFrontier && <circle cx={n.x} cy={n.y} r={r + 4} className="viz-node-pulse" />}
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
    </div>
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
      <div
        className="viz-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `min(100%, ${cols * 42}px)` }}
      >
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
    <div
      className="viz-grid"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `min(100%, ${cols * 42}px)` }}
    >
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

// Frame: { tree: { value, state?, left, right }, traversal?: (string|number)[], chip?, caption? }
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
  // Fixed per-node/per-level spacing in an internal coordinate space; the
  // viewBox is then sized to the actual content so a 9-node tree and a 2-node
  // tree both fill their stage once CSS scales the SVG to the container width.
  const PAD = 28;
  const xStep = 56;
  const yStep = 78;
  const NODE_R = 16;

  // Map each node to its computed center.
  const pos = new Map();
  for (const s of slots) {
    pos.set(s.node, { x: PAD + (s.slot + 0.5) * xStep, y: PAD + NODE_R + s.depth * yStep });
  }
  const vbW = Math.max(120, slots.length * xStep + PAD);
  const vbH = Math.max(120, (maxDepth * yStep) + NODE_R * 2 + PAD * 2);
  const viewBox = `0 0 ${vbW} ${vbH}`;

  const edges = [];
  const walk = (node) => {
    if (!node) return;
    for (const child of [node.left, node.right]) {
      if (child) edges.push({ a: pos.get(node), b: pos.get(child), state: child.state });
      walk(child);
    }
  };
  walk(root);

  // Curved edges look more "treelike" than straight lines.
  const edgePath = (a, b) => {
    const my = (a.y + b.y) / 2;
    return `M ${a.x} ${a.y} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
  };

  return (
    <div className="viz-tree-block">
      <StatChip chip={frame.chip} />
      <svg
        className="viz-graph viz-tree-svg"
        viewBox={viewBox}
        style={{ aspectRatio: `${vbW} / ${vbH}` }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="tree"
      >
        {edges.map((e, i) => (
          <path key={i} d={edgePath(e.a, e.b)} fill="none"
            className={`viz-edge ${e.state === 'current' || e.state === 'visited' ? 'viz-edge-tree' : ''}`} />
        ))}
        {slots.map(({ node }) => {
          const p = pos.get(node);
          const isCurrent = node.state === 'current';
          return (
            <g key={node._id ?? `${p.x}-${p.y}`} className={`viz-node ${node.state ? 'viz-node-' + node.state : ''}`}>
              {isCurrent && <circle cx={p.x} cy={p.y} r={NODE_R + 5} className="viz-node-ring" />}
              <circle cx={p.x} cy={p.y} r={NODE_R} />
              <text x={p.x} y={p.y} dy=".34em" textAnchor="middle">{node.value}</text>
            </g>
          );
        })}
      </svg>
      {Array.isArray(frame.traversal) && frame.traversal.length > 0 && (
        <div className="viz-traversal-row">
          <span className="viz-traversal-label">Traversal</span>
          <div className="viz-traversal-chips">
            {frame.traversal.map((v, i) => (
              <span key={i} className={`viz-traversal-chip ${i === frame.traversal.length - 1 ? 'viz-traversal-chip-last' : ''}`}>{v}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Frame: { array, window: [l, r] (inclusive), chip?, pointers? }
export function SlidingWindowRenderer({ frame }) {
  const arr = frame.array || [];
  // `window` may be a [l, r] tuple or a { start, end } object (both producers exist).
  const w = frame.window;
  const [l, r] = Array.isArray(w)
    ? w
    : (w && typeof w === 'object' ? [w.start ?? 0, w.end ?? -1] : [0, -1]);
  // Auto-add l/r labels if no explicit pointers provided.
  const pointers = frame.pointers || (() => {
    const auto = {};
    if (l >= 0 && l < arr.length) auto[l] = l === r ? ['l', 'r'] : 'l';
    if (r >= 0 && r < arr.length && r !== l) auto[r] = 'r';
    return auto;
  })();
  const gap = 8;
  const cols = `repeat(${arr.length}, minmax(0, 1fr))`;
  return (
    <div className="viz-window-block">
      <StatChip chip={frame.chip} />
      <PointerLabels pointers={pointers} count={arr.length} gap={gap} />
      <div className="viz-window" style={{ display: 'grid', gridTemplateColumns: cols, gap: `${gap}px` }}>
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
    </div>
  );
}
