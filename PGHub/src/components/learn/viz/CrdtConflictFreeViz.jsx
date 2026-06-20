import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Database, Check } from 'lucide-react';
import './CrdtConflictFreeViz.css';

// Grow-only set (G-Set) CRDT. Two replicas edit while disconnected, then merge by
// set union. Union is commutative (A∪B = B∪A), associative ((A∪B)∪C = A∪(B∪C)),
// and idempotent (A∪A = A) — so any merge order converges to the same final set.

const BASE = ['x'];
const A_ADDS = ['a', 'b', 'x'];
const B_ADDS = ['b', 'c', 'd'];

const FINAL = [...new Set([...BASE, ...A_ADDS, ...B_ADDS])].sort();

const ORDERS = [
  { id: 'AB', label: 'A then B', seq: ['A', 'B'] },
  { id: 'BA', label: 'B then A', seq: ['B', 'A'] },
  { id: 'ABA', label: 'A then B then A', seq: ['A', 'B', 'A'] },
];

const uni = (a, b) => [...new Set([...a, ...b])].sort();
const fmt = (s) => (s.length ? `{ ${s.join(', ')} }` : '{ }');

function buildFrames(orderId) {
  const order = ORDERS.find((o) => o.id === orderId) || ORDERS[0];
  const frames = [];

  const aSet = uni(BASE, A_ADDS);
  const bSet = uni(BASE, B_ADDS);

  const snap = (extra) => ({
    a: [...aSet],
    b: [...bSet],
    merged: [],
    foldFrom: null,
    added: [],
    phase: 'edit',
    commutative: false,
    associative: false,
    idempotent: false,
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Both replicas start from the shared set ${fmt(BASE)}. A grow-only set only ever ADDS elements — it never removes. The merge operation is plain set UNION, which is what makes conflicts impossible.`,
  }));

  frames.push(snap({
    phase: 'edit',
    note: `Disconnected, Replica A adds ${fmt(A_ADDS)} locally, so A holds ${fmt(aSet)}. Replica B adds ${fmt(B_ADDS)}, so B holds ${fmt(bSet)}. They overlap on { b } and on the base { x } — that overlap is exactly where union's idempotence matters.`,
  }));

  let merged = [];
  order.seq.forEach((side, k) => {
    const incoming = side === 'A' ? aSet : bSet;
    const before = [...merged];
    const next = uni(merged, incoming);
    const added = next.filter((e) => !before.includes(e));
    merged = next;
    const repeated = added.length === 0 && before.length > 0;
    frames.push(snap({
      phase: 'merge',
      merged: [...merged],
      foldFrom: side,
      added,
      note: repeated
        ? `Fold Replica ${side} (${fmt(incoming)}) into the result AGAIN. Every element is already present, so the union adds NOTHING — result stays ${fmt(merged)}. This is idempotence: merging the same state twice changes nothing.`
        : `Fold Replica ${side} (${fmt(incoming)}) into the result by union. New elements ${fmt(added)} join; result is now ${fmt(merged)}.${k === 0 ? ' Order of folding will not matter — watch.' : ''}`,
    }));
  });

  const converged = uni(merged, []);
  const matches = JSON.stringify(converged) === JSON.stringify(FINAL);

  frames.push(snap({
    phase: 'done',
    merged: [...merged],
    foldFrom: null,
    added: [],
    commutative: true,
    associative: true,
    idempotent: order.seq.length > 2,
    note: `Converged to ${fmt(merged)}${matches ? '' : ' (!)'} — the SAME set every other order produces. Commutative: A∪B = B∪A. Associative: grouping of folds is free. Idempotent: re-folding A changed nothing. Switch the merge order above and replay: the result is identical every time. That guarantee is the whole point of a CRDT — replicas merge with zero coordination and never conflict.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1150;

export default function CrdtConflictFreeViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [orderId, setOrderId] = useState('AB');
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(orderId), [orderId]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
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

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const chooseOrder = (id) => {
    setOrderId(id);
    setIsRunning(false);
    setStep(0);
  };

  // SVG geometry — two replica panels on top, merged result panel below.
  const W = 960;
  const H = 470;
  const panW = 280;
  const aX = 60;
  const bX = W - 60 - panW;
  const topY = 50;
  const panH = 150;
  const mergeX = (W - panW) / 2;
  const mergeY = topY + panH + 70;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const renderSet = (items, x, y, w, highlight) => {
    const chipW = 46;
    const chipH = 32;
    const gap = 10;
    const perRow = Math.floor((w - 28) / (chipW + gap));
    return items.map((e, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const cx = x + 14 + col * (chipW + gap);
      const cy = y + 14 + row * (chipH + gap);
      const isNew = highlight && highlight.includes(e);
      return (
        <g key={`chip-${e}-${i}`}>
          <rect className={`ccv-chip ${isNew ? 'is-new' : ''}`} x={cx} y={cy} width={chipW} height={chipH} rx={7} />
          <text className="ccv-chip-text" x={cx + chipW / 2} y={cy + chipH / 2 + 5}>{e}</text>
        </g>
      );
    });
  };

  const props = [
    { key: 'commutative', label: 'commutative', detail: 'A∪B = B∪A', on: current.commutative },
    { key: 'associative', label: 'associative', detail: '(A∪B)∪C = A∪(B∪C)', on: current.associative },
    { key: 'idempotent', label: 'idempotent', detail: 'A∪A = A', on: current.idempotent },
  ];

  return (
    <div className="ccv">
      <div className="ccv-head">
        <h3 className="ccv-title">CRDTs — why a grow-only set merges without conflict</h3>
        <p className="ccv-sub">
          Two replicas add elements while disconnected, then merge by set union. Replay the merge in any order —
          the converged set is identical every time, because union is commutative, associative, and idempotent.
        </p>
      </div>

      <div className="ccv-controls">
        <div className="ccv-orders" role="group" aria-label="Merge order">
          <span className="ccv-input-label">merge order</span>
          {ORDERS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`ccv-order-btn ${orderId === o.id ? 'is-on' : ''}`}
              onClick={() => chooseOrder(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <span className="ccv-spacer" aria-hidden="true" />

        <label className="ccv-speed">
          <span className="ccv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ccv-speed-range"
            aria-label="Playback speed"
          />
          <span className="ccv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="ccv-buttons">
          <button
            type="button"
            className="ccv-btn ccv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="ccv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="ccv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="ccv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="ccv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="ccv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ccv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ccv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="ccv-ah" />
            </marker>
          </defs>

          {/* fold arrows from replicas into merged panel */}
          {['A', 'B'].map((side) => {
            const fromX = side === 'A' ? aX + panW / 2 : bX + panW / 2;
            const hot = current.foldFrom === side;
            return (
              <path
                key={`fold-${side}`}
                className={`ccv-fold ${hot ? 'is-hot' : ''}`}
                d={`M ${fromX} ${topY + panH} C ${fromX} ${topY + panH + 40}, ${mergeX + panW / 2} ${mergeY - 40}, ${mergeX + panW / 2} ${mergeY}`}
                markerEnd="url(#ccv-arrow)"
              />
            );
          })}

          {/* Replica A */}
          <g>
            <rect className={`ccv-panel ${current.foldFrom === 'A' ? 'is-active' : ''}`} x={aX} y={topY} width={panW} height={panH} rx={10} />
            <rect className="ccv-panel-bar ccv-bar-a" x={aX} y={topY} width={panW} height={5} rx={2.5} />
            <g transform={`translate(${aX + 12}, ${topY + 12})`}>
              <Database width={15} height={15} className="ccv-ic" />
            </g>
            <text className="ccv-panel-title" x={aX + 34} y={topY + 24}>Replica A</text>
            <text className="ccv-panel-set" x={aX + panW - 12} y={topY + 24}>{fmt(current.a)}</text>
            {renderSet(current.a, aX, topY + 40, panW, current.foldFrom === 'A' ? current.added : null)}
          </g>

          {/* Replica B */}
          <g>
            <rect className={`ccv-panel ${current.foldFrom === 'B' ? 'is-active' : ''}`} x={bX} y={topY} width={panW} height={panH} rx={10} />
            <rect className="ccv-panel-bar ccv-bar-b" x={bX} y={topY} width={panW} height={5} rx={2.5} />
            <g transform={`translate(${bX + 12}, ${topY + 12})`}>
              <Database width={15} height={15} className="ccv-ic" />
            </g>
            <text className="ccv-panel-title" x={bX + 34} y={topY + 24}>Replica B</text>
            <text className="ccv-panel-set" x={bX + panW - 12} y={topY + 24}>{fmt(current.b)}</text>
            {renderSet(current.b, bX, topY + 40, panW, current.foldFrom === 'B' ? current.added : null)}
          </g>

          {/* Merged result */}
          <g>
            <rect className={`ccv-panel ccv-merged ${current.phase === 'done' ? 'is-converged' : ''}`} x={mergeX} y={mergeY} width={panW} height={panH} rx={10} />
            <rect className="ccv-panel-bar ccv-bar-m" x={mergeX} y={mergeY} width={panW} height={5} rx={2.5} />
            <text className="ccv-panel-title" x={mergeX + 14} y={mergeY + 24}>Merged (union)</text>
            <text className="ccv-panel-set" x={mergeX + panW - 12} y={mergeY + 24}>{fmt(current.merged)}</text>
            {current.merged.length === 0
              ? <text className="ccv-panel-empty" x={mergeX + panW / 2} y={mergeY + panH / 2 + 16}>empty — fold replicas in</text>
              : renderSet(current.merged, mergeX, mergeY + 40, panW, current.added)}
          </g>

          <text className="ccv-hint" x={W / 2} y={H - 10} textAnchor="middle">
            chosen order: {(ORDERS.find((o) => o.id === orderId) || ORDERS[0]).label} — converges to {fmt(FINAL)}
          </text>
        </svg>
      </div>

      <div className="ccv-metrics">
        <div className="ccv-metric">
          <span className="ccv-metric-label">replica A</span>
          <span className="ccv-metric-value is-a">{fmt(current.a)}</span>
        </div>
        <div className="ccv-metric">
          <span className="ccv-metric-label">replica B</span>
          <span className="ccv-metric-value is-b">{fmt(current.b)}</span>
        </div>
        <div className="ccv-metric">
          <span className="ccv-metric-label">merged result</span>
          <span className="ccv-metric-value is-m">{fmt(current.merged)}</span>
        </div>
        <div className="ccv-metric ccv-metric-wide">
          <span className="ccv-metric-label">union properties</span>
          <span className="ccv-props">
            {props.map((p) => (
              <span key={p.key} className={`ccv-prop ${p.on ? 'is-on' : ''}`}>
                <Check size={12} className="ccv-prop-check" />
                {p.label}
                <span className="ccv-prop-detail">{p.detail}</span>
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="ccv-narration">
        <span className={`ccv-narration-label ccv-phase-${current.phase}`}>{current.phase}</span>
        <span className="ccv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
