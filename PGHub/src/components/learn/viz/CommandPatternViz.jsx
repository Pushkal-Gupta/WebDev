import React, { useMemo, useState } from 'react';
import { Plus, Trash2, MoveRight, Undo2, Redo2, RotateCcw } from 'lucide-react';
import './CommandPatternViz.css';

// Each user action becomes a Command object with do()/undo() captured as data.
// The invoker keeps a history stack (executed) and a redo stack (undone).
const GRID = 5;
const SEED_ID = 7;

function makeCommand(kind, payload) {
  return { kind, ...payload };
}

// Apply a command forward against a shapes map -> returns the next map.
function applyForward(shapes, cmd) {
  const next = { ...shapes };
  if (cmd.kind === 'add') next[cmd.id] = { id: cmd.id, x: cmd.x, y: cmd.y };
  else if (cmd.kind === 'delete') delete next[cmd.id];
  else if (cmd.kind === 'move') next[cmd.id] = { ...next[cmd.id], x: cmd.toX, y: cmd.toY };
  return next;
}

function labelFor(cmd) {
  if (cmd.kind === 'add') return `add(#${cmd.id} @${cmd.x},${cmd.y})`;
  if (cmd.kind === 'delete') return `delete(#${cmd.id})`;
  return `move(#${cmd.id} →${cmd.toX},${cmd.toY})`;
}

export default function CommandPatternViz() {
  const [history, setHistory] = useState([]); // executed commands
  const [redoStack, setRedoStack] = useState([]); // undone commands
  const [nextId, setNextId] = useState(1);
  const [note, setNote] = useState('Issue commands. Each is an object pushed onto the history stack — undo replays its inverse.');

  // Derive current canvas state purely from the history stack.
  const shapes = useMemo(() => {
    let s = {};
    for (const cmd of history) s = applyForward(s, cmd);
    return s;
  }, [history]);

  const shapeList = useMemo(() => Object.values(shapes).sort((a, b) => a.id - b.id), [shapes]);

  const issue = (cmd) => {
    setHistory((h) => [...h, cmd]);
    setRedoStack([]);
    setNote(`execute ${labelFor(cmd)} — pushed to history, redo stack cleared.`);
  };

  const onAdd = () => {
    // deterministic placement from a seeded LCG so layout is stable
    const k = (nextId * SEED_ID) % (GRID * GRID);
    const x = k % GRID;
    const y = Math.floor(k / GRID);
    if (shapes[nextId] || shapeList.some((s) => s.x === x && s.y === y)) {
      // find first free cell deterministically
      let placed = false;
      for (let c = 0; c < GRID * GRID && !placed; c += 1) {
        const cx = c % GRID;
        const cy = Math.floor(c / GRID);
        if (!shapeList.some((s) => s.x === cx && s.y === cy)) {
          issue(makeCommand('add', { id: nextId, x: cx, y: cy }));
          placed = true;
        }
      }
      if (!placed) { setNote('canvas full — delete a shape first.'); return; }
    } else {
      issue(makeCommand('add', { id: nextId, x, y }));
    }
    setNextId((n) => n + 1);
  };

  const onMove = () => {
    if (shapeList.length === 0) { setNote('nothing to move — add a shape first.'); return; }
    const target = shapeList[(history.length) % shapeList.length];
    // next free cell to the right, deterministic
    let dest = null;
    for (let c = 0; c < GRID * GRID; c += 1) {
      const cx = c % GRID;
      const cy = Math.floor(c / GRID);
      if (!shapeList.some((s) => s.x === cx && s.y === cy)) { dest = { x: cx, y: cy }; break; }
    }
    if (!dest) { setNote('no free cell to move into.'); return; }
    issue(makeCommand('move', { id: target.id, fromX: target.x, fromY: target.y, toX: dest.x, toY: dest.y }));
  };

  const onDelete = () => {
    if (shapeList.length === 0) { setNote('nothing to delete.'); return; }
    const target = shapeList[shapeList.length - 1];
    issue(makeCommand('delete', { id: target.id, x: target.x, y: target.y }));
  };

  const undo = () => {
    if (history.length === 0) { setNote('history empty — nothing to undo.'); return; }
    const cmd = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setRedoStack((r) => [...r, cmd]);
    setNote(`undo ${labelFor(cmd)} — its inverse is replayed, command moved to redo stack.`);
  };

  const redo = () => {
    if (redoStack.length === 0) { setNote('redo stack empty.'); return; }
    const cmd = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setHistory((h) => [...h, cmd]);
    setNote(`redo ${labelFor(cmd)} — re-executed and pushed back onto history.`);
  };

  const reset = () => {
    setHistory([]);
    setRedoStack([]);
    setNextId(1);
    setNote('reset — empty history, empty canvas.');
  };

  // SVG geometry
  const W = 940;
  const H = 360;
  const cell = 56;
  const gridX = 30;
  const gridY = 56;

  return (
    <div className="cpv">
      <div className="cpv-head">
        <h3 className="cpv-title">Command pattern — actions as undoable objects</h3>
        <p className="cpv-sub">
          Every action becomes a command object holding how to do and undo itself. The invoker pushes
          executed commands onto a history stack; undo pops one and replays its inverse.
        </p>
      </div>

      <div className="cpv-controls">
        <div className="cpv-buttons">
          <button type="button" className="cpv-btn cpv-btn-primary" onClick={onAdd}><Plus size={14} /> add</button>
          <button type="button" className="cpv-btn" onClick={onMove}><MoveRight size={14} /> move</button>
          <button type="button" className="cpv-btn" onClick={onDelete}><Trash2 size={14} /> delete</button>
        </div>
        <span className="cpv-spacer" aria-hidden="true" />
        <div className="cpv-buttons">
          <button type="button" className="cpv-btn" onClick={undo} disabled={history.length === 0}><Undo2 size={14} /> undo</button>
          <button type="button" className="cpv-btn" onClick={redo} disabled={redoStack.length === 0}><Redo2 size={14} /> redo</button>
          <button type="button" className="cpv-btn" onClick={reset}><RotateCcw size={14} /> reset</button>
        </div>
      </div>

      <div className="cpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cpv-svg" preserveAspectRatio="xMidYMid meet">
          {/* canvas grid */}
          <text className="cpv-region-sub cpv-anchor-start" x={gridX} y={gridY - 14}>canvas</text>
          {Array.from({ length: GRID }).map((_, r) => (
            Array.from({ length: GRID }).map((__, c) => (
              <rect
                key={`g-${r}-${c}`}
                className="cpv-cell"
                x={gridX + c * cell}
                y={gridY + r * cell}
                width={cell - 6}
                height={cell - 6}
                rx={7}
              />
            ))
          ))}
          {shapeList.map((s) => (
            <g key={`s-${s.id}`}>
              <rect
                className="cpv-shape"
                x={gridX + s.x * cell + 6}
                y={gridY + s.y * cell + 6}
                width={cell - 18}
                height={cell - 18}
                rx={8}
              />
              <text
                className="cpv-shape-text"
                x={gridX + s.x * cell + (cell - 6) / 2}
                y={gridY + s.y * cell + (cell - 6) / 2 + 4}
              >{s.id}</text>
            </g>
          ))}

          {/* history stack column */}
          <text className="cpv-region-sub cpv-anchor-start" x={gridX + GRID * cell + 28} y={gridY - 14}>history stack (top = newest)</text>
          {history.slice(-7).reverse().map((cmd, i) => {
            const isTop = i === 0;
            const x = gridX + GRID * cell + 28;
            const y = gridY + i * 34;
            return (
              <g key={`h-${history.length - 1 - i}`}>
                <rect className={`cpv-hist ${isTop ? 'is-top' : ''}`} x={x} y={y} width={300} height={28} rx={6} />
                <text className="cpv-hist-text" x={x + 12} y={y + 19}>{labelFor(cmd)}</text>
              </g>
            );
          })}
          {history.length === 0 && (
            <text className="cpv-region-empty" x={gridX + GRID * cell + 28 + 150} y={gridY + 60}>empty</text>
          )}
          {history.length > 7 && (
            <text className="cpv-region-empty cpv-anchor-start" x={gridX + GRID * cell + 28} y={gridY + 7 * 34 + 16}>… {history.length - 7} older</text>
          )}
        </svg>
      </div>

      <div className="cpv-metrics">
        <div className="cpv-metric">
          <span className="cpv-metric-label">history depth</span>
          <span className="cpv-metric-value">{history.length}</span>
        </div>
        <div className="cpv-metric">
          <span className="cpv-metric-label">redo depth</span>
          <span className="cpv-metric-value is-redo">{redoStack.length}</span>
        </div>
        <div className="cpv-metric">
          <span className="cpv-metric-label">shapes on canvas</span>
          <span className="cpv-metric-value is-shapes">{shapeList.length}</span>
        </div>
        <div className="cpv-metric">
          <span className="cpv-metric-label">last command</span>
          <span className="cpv-metric-value is-cmd">{history.length ? labelFor(history[history.length - 1]) : '—'}</span>
        </div>
      </div>

      <div className="cpv-narration">
        <span className="cpv-narration-label">trace</span>
        <span className="cpv-narration-body">{note}</span>
      </div>
    </div>
  );
}
