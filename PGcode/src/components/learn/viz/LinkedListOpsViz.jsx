import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Search, RotateCcw } from 'lucide-react';
import './LinkedListOpsViz.css';

const DEFAULT_VALUES = [3, 7, 12, 4, 9];
const NULL_LABEL = 'NULL';
const TICK_MS = 520;
const NODE_WIDTH = 78;
const NODE_HEIGHT = 56;
const NODE_GAP = 56;
const PADDING = 36;
const ROW_Y = 96;

let nodeIdSeq = 1;
const makeNode = (value) => ({ id: `n${nodeIdSeq++}`, value });
const buildInitial = () => DEFAULT_VALUES.map(makeNode);

const clampInt = (raw, lo, hi) => {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
};

function LinkedListOpsViz() {
  const [nodes, setNodes] = useState(buildInitial);
  const [highlight, setHighlight] = useState({
    findIdx: -1,
    insertingId: null,
    deletingId: null,
    foundId: null,
    notFound: false,
    nullHit: false,
    rerouteFromId: null,
    rerouteToId: null,
  });
  const [lastOp, setLastOp] = useState('initialised list [3, 7, 12, 4, 9]');
  const [busy, setBusy] = useState(false);

  const [insertValue, setInsertValue] = useState('15');
  const [insertPos, setInsertPos] = useState('2');
  const [deletePos, setDeletePos] = useState('1');
  const [findValue, setFindValue] = useState('12');

  const timeouts = useRef([]);
  const queueTimeout = useCallback((fn, delay) => {
    const id = window.setTimeout(fn, delay);
    timeouts.current.push(id);
    return id;
  }, []);
  const clearQueued = useCallback(() => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
  }, []);

  useEffect(() => () => clearQueued(), [clearQueued]);

  const resetHighlight = useCallback(() => {
    setHighlight({
      findIdx: -1,
      insertingId: null,
      deletingId: null,
      foundId: null,
      notFound: false,
      nullHit: false,
      rerouteFromId: null,
      rerouteToId: null,
    });
  }, []);

  const handleReset = () => {
    if (busy) return;
    clearQueued();
    resetHighlight();
    setNodes(buildInitial());
    setLastOp('reset to [3, 7, 12, 4, 9]');
  };

  const handleInsert = () => {
    if (busy) return;
    const value = clampInt(insertValue, -999, 999);
    if (value === null) {
      setLastOp('insert failed: value is not a number');
      return;
    }
    const pos = clampInt(insertPos, 0, nodes.length);
    if (pos === null) {
      setLastOp('insert failed: position is not a number');
      return;
    }

    clearQueued();
    resetHighlight();
    const fresh = makeNode(value);

    setHighlight((h) => ({ ...h, insertingId: fresh.id }));

    setNodes((prev) => {
      const copy = prev.slice();
      copy.splice(pos, 0, fresh);
      return copy;
    });

    setLastOp(`insert ${value} at position ${pos}`);
    setBusy(true);
    queueTimeout(() => {
      resetHighlight();
      setBusy(false);
    }, 900);
  };

  const handleDelete = () => {
    if (busy) return;
    if (nodes.length === 0) {
      setLastOp('delete failed: list is empty');
      return;
    }
    const pos = clampInt(deletePos, 0, nodes.length - 1);
    if (pos === null) {
      setLastOp('delete failed: position is not a number');
      return;
    }

    clearQueued();
    resetHighlight();

    const target = nodes[pos];
    const beforeId = pos > 0 ? nodes[pos - 1].id : null;
    const afterId = pos < nodes.length - 1 ? nodes[pos + 1].id : null;

    setHighlight((h) => ({
      ...h,
      deletingId: target.id,
      rerouteFromId: beforeId,
      rerouteToId: afterId,
    }));

    setLastOp(`delete node at position ${pos} (value ${target.value})`);
    setBusy(true);

    queueTimeout(() => {
      setNodes((prev) => prev.filter((n) => n.id !== target.id));
    }, 620);

    queueTimeout(() => {
      resetHighlight();
      setBusy(false);
    }, 1180);
  };

  const handleFind = () => {
    if (busy) return;
    const value = clampInt(findValue, -999, 999);
    if (value === null) {
      setLastOp('find failed: value is not a number');
      return;
    }

    clearQueued();
    resetHighlight();
    setBusy(true);

    const snapshot = nodes.slice();
    let foundIdx = -1;
    const stepCount = snapshot.length;

    for (let i = 0; i < stepCount; i++) {
      const idx = i;
      queueTimeout(() => {
        setHighlight((h) => ({ ...h, findIdx: idx, notFound: false, foundId: null, nullHit: false }));
      }, i * TICK_MS);
      if (snapshot[i].value === value && foundIdx === -1) {
        foundIdx = i;
        queueTimeout(() => {
          setHighlight((h) => ({ ...h, findIdx: idx, foundId: snapshot[idx].id }));
          setLastOp(`find ${value}: found at position ${idx}`);
        }, i * TICK_MS + Math.floor(TICK_MS * 0.5));
        queueTimeout(() => {
          resetHighlight();
          setBusy(false);
        }, i * TICK_MS + TICK_MS + 900);
        return;
      }
    }

    queueTimeout(() => {
      setHighlight((h) => ({ ...h, findIdx: stepCount, notFound: true, nullHit: true }));
      setLastOp(`find ${value}: not found, reached NULL`);
    }, stepCount * TICK_MS);
    queueTimeout(() => {
      resetHighlight();
      setBusy(false);
    }, stepCount * TICK_MS + 1100);
  };

  const n = nodes.length;
  const svgWidth = PADDING * 2 + Math.max(1, n) * NODE_WIDTH + Math.max(0, n - 1) * NODE_GAP + 110;
  const svgHeight = 220;

  const nodeX = (i) => PADDING + i * (NODE_WIDTH + NODE_GAP);
  const nodeCenterX = (i) => nodeX(i) + NODE_WIDTH / 2;
  const nodeCenterY = ROW_Y + NODE_HEIGHT / 2;
  const nullX = PADDING + n * (NODE_WIDTH + NODE_GAP) + 14;

  const edges = useMemo(() => {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const fromId = nodes[i].id;
      const fromX = nodeX(i) + NODE_WIDTH;
      const toX = i < n - 1 ? nodeX(i + 1) : nullX;
      const isTail = i === n - 1;
      const isReroute =
        highlight.rerouteFromId === fromId &&
        ((highlight.rerouteToId !== null && i < n - 1 && nodes[i + 1].id === highlight.rerouteToId) ||
          (highlight.rerouteToId === null && isTail));
      arr.push({
        key: `e-${fromId}`,
        fromX,
        fromY: nodeCenterY,
        toX,
        toY: nodeCenterY,
        isTail,
        isReroute,
      });
    }
    return arr;
  }, [nodes, n, nullX, highlight.rerouteFromId, highlight.rerouteToId]);

  const findCursorX =
    highlight.findIdx >= 0 && highlight.findIdx < n
      ? nodeCenterX(highlight.findIdx)
      : highlight.findIdx >= n
        ? nullX + 18
        : null;

  return (
    <div className="llo-viz">
      <div className="llo-viz-header">
        <h3 className="llo-viz-title">Singly-linked list: insert, delete, find</h3>
        <p className="llo-viz-subtitle">
          Watch the head pointer walk the list. Inserts splice a fresh node in, deletes reroute the previous next pointer past
          the target, and find traverses left to right until the value matches or the chain hits NULL.
        </p>
      </div>

      <div className="llo-viz-stage" role="img" aria-label="Linked list operations visualization">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          className="llo-viz-svg"
        >
          <defs>
            <marker
              id="llo-arrow-default"
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
              id="llo-arrow-reroute"
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
              id="llo-arrow-find"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-sky)" />
            </marker>
          </defs>

          {n > 0 && (
            <g className="llo-head-label" style={{ transform: `translateX(${nodeCenterX(0)}px)` }}>
              <text x={0} y={ROW_Y - 36} textAnchor="middle" className="llo-head-text">
                head
              </text>
              <line
                x1={0}
                y1={ROW_Y - 28}
                x2={0}
                y2={ROW_Y - 4}
                className="llo-head-line"
                markerEnd="url(#llo-arrow-reroute)"
              />
            </g>
          )}

          {edges.map((e) => {
            const midX = (e.fromX + e.toX) / 2;
            const arc = e.isReroute ? -26 : 0;
            const d = `M ${e.fromX} ${e.fromY} Q ${midX} ${e.fromY + arc} ${e.toX} ${e.toY}`;
            const cls = `llo-edge${e.isReroute ? ' llo-edge-reroute' : ''}${e.isTail ? ' llo-edge-tail' : ''}`;
            const markerId = e.isReroute ? 'llo-arrow-reroute' : 'llo-arrow-default';
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

          <g className="llo-null" style={{ opacity: highlight.nullHit ? 1 : 0.7 }}>
            <rect
              x={nullX - 6}
              y={nodeCenterY - 14}
              width={48}
              height={28}
              rx={6}
              ry={6}
              className={`llo-null-rect${highlight.nullHit ? ' llo-null-rect-hit' : ''}`}
            />
            <text
              x={nullX + 18}
              y={nodeCenterY + 5}
              textAnchor="middle"
              className={`llo-null-text${highlight.nullHit ? ' llo-null-text-hit' : ''}`}
            >
              {NULL_LABEL}
            </text>
          </g>

          {nodes.map((node, i) => {
            const x = nodeX(i);
            const isInserting = node.id === highlight.insertingId;
            const isDeleting = node.id === highlight.deletingId;
            const isScanning = highlight.findIdx === i && highlight.foundId === null && !highlight.notFound;
            const isFound = node.id === highlight.foundId;
            const isMissed =
              highlight.notFound &&
              highlight.findIdx >= i &&
              !isFound;
            let cls = 'llo-node';
            if (isInserting) cls += ' llo-node-inserting';
            if (isDeleting) cls += ' llo-node-deleting';
            if (isScanning) cls += ' llo-node-scanning';
            if (isFound) cls += ' llo-node-found';
            if (isMissed) cls += ' llo-node-missed';
            return (
              <g key={node.id} className={cls}>
                <rect
                  x={x}
                  y={ROW_Y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={8}
                  ry={8}
                  className="llo-node-rect"
                />
                <line
                  x1={x + NODE_WIDTH - 22}
                  y1={ROW_Y + 6}
                  x2={x + NODE_WIDTH - 22}
                  y2={ROW_Y + NODE_HEIGHT - 6}
                  className="llo-node-divider"
                />
                <text
                  x={x + (NODE_WIDTH - 22) / 2}
                  y={ROW_Y + NODE_HEIGHT / 2 + 5}
                  textAnchor="middle"
                  className="llo-node-value"
                >
                  {node.value}
                </text>
                <text
                  x={x + NODE_WIDTH - 11}
                  y={ROW_Y + NODE_HEIGHT / 2 + 4}
                  textAnchor="middle"
                  className="llo-node-nextfield"
                >
                  *
                </text>
                <text
                  x={x + NODE_WIDTH / 2}
                  y={ROW_Y - 12}
                  textAnchor="middle"
                  className="llo-node-index"
                >
                  {i}
                </text>
              </g>
            );
          })}

          {findCursorX !== null && (
            <g
              className="llo-find-cursor"
              style={{ transform: `translateX(${findCursorX}px)` }}
            >
              <line
                x1={0}
                y1={ROW_Y + NODE_HEIGHT + 36}
                x2={0}
                y2={ROW_Y + NODE_HEIGHT + 8}
                className="llo-find-line"
                markerEnd="url(#llo-arrow-find)"
              />
              <text
                x={0}
                y={ROW_Y + NODE_HEIGHT + 56}
                textAnchor="middle"
                className="llo-find-label"
              >
                {highlight.notFound ? 'NULL' : 'scan'}
              </text>
            </g>
          )}

          {n === 0 && (
            <text
              x={svgWidth / 2}
              y={nodeCenterY + 5}
              textAnchor="middle"
              className="llo-empty"
            >
              head -> NULL (list is empty)
            </text>
          )}
        </svg>
      </div>

      <div className="llo-viz-readout">
        <div className="llo-viz-readout-row">
          <span className="llo-viz-readout-label">length</span>
          <span className="llo-viz-readout-value llo-mono">{n}</span>
          <span className="llo-viz-readout-label">head</span>
          <span className="llo-viz-readout-value llo-mono">{n > 0 ? nodes[0].value : 'NULL'}</span>
          <span className="llo-viz-readout-label">tail</span>
          <span className="llo-viz-readout-value llo-mono">{n > 0 ? nodes[n - 1].value : 'NULL'}</span>
          <span className="llo-viz-readout-label">last op</span>
          <span className="llo-viz-readout-value llo-mono llo-last-op">{lastOp}</span>
        </div>
      </div>

      <div className="llo-viz-controls">
        <div className="llo-control-group">
          <label className="llo-control-label" htmlFor="llo-insert-value">
            insert
          </label>
          <input
            id="llo-insert-value"
            type="number"
            className="llo-control-input"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            placeholder="value"
            disabled={busy}
            aria-label="insert value"
          />
          <span className="llo-control-at">at</span>
          <input
            id="llo-insert-pos"
            type="number"
            className="llo-control-input llo-control-input-small"
            value={insertPos}
            onChange={(e) => setInsertPos(e.target.value)}
            placeholder="pos"
            min={0}
            max={n}
            disabled={busy}
            aria-label="insert position"
          />
          <button
            type="button"
            className="llo-viz-btn llo-viz-btn-primary"
            onClick={handleInsert}
            disabled={busy}
          >
            <Plus size={14} />
            Insert
          </button>
        </div>

        <div className="llo-control-group">
          <label className="llo-control-label" htmlFor="llo-delete-pos">
            delete at
          </label>
          <input
            id="llo-delete-pos"
            type="number"
            className="llo-control-input llo-control-input-small"
            value={deletePos}
            onChange={(e) => setDeletePos(e.target.value)}
            placeholder="pos"
            min={0}
            max={Math.max(0, n - 1)}
            disabled={busy}
            aria-label="delete position"
          />
          <button
            type="button"
            className="llo-viz-btn"
            onClick={handleDelete}
            disabled={busy || n === 0}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>

        <div className="llo-control-group">
          <label className="llo-control-label" htmlFor="llo-find-value">
            find
          </label>
          <input
            id="llo-find-value"
            type="number"
            className="llo-control-input"
            value={findValue}
            onChange={(e) => setFindValue(e.target.value)}
            placeholder="value"
            disabled={busy}
            aria-label="find value"
          />
          <button
            type="button"
            className="llo-viz-btn"
            onClick={handleFind}
            disabled={busy || n === 0}
          >
            <Search size={14} />
            Find
          </button>
        </div>

        <div className="llo-control-group">
          <button
            type="button"
            className="llo-viz-btn llo-viz-btn-ghost"
            onClick={handleReset}
            disabled={busy}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default LinkedListOpsViz;
