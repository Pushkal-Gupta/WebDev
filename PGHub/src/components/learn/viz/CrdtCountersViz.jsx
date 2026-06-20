import React, { useMemo, useState } from 'react';
import { Plus, GitMerge, RotateCcw, Unplug, Link2 } from 'lucide-react';
import './CrdtCountersViz.css';

const MODES = ['G-Counter', 'OR-Set'];
const SET_ELEMENTS = ['x', 'y', 'z', 'w'];

function fnvTag(seed) {
  let h = 2166136261 >>> 0;
  const s = `tag#${seed}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 9000) + 1000;
}

const EMPTY_COUNTER = { A: { A: 0, B: 0 }, B: { A: 0, B: 0 } };

function mergeCounter(a, b) {
  return { A: Math.max(a.A, b.A), B: Math.max(a.B, b.B) };
}

function counterValue(v) {
  return v.A + v.B;
}

function mergeSet(setA, setB) {
  const adds = new Map();
  for (const e of [...setA.adds, ...setB.adds]) adds.set(e.tag, e);
  const removes = new Set([...setA.removes, ...setB.removes]);
  const live = [...adds.values()].filter((e) => !removes.has(e.tag));
  return { adds: [...adds.values()], removes: [...removes], live };
}

function liveSet(s) {
  const rem = new Set(s.removes);
  return s.adds.filter((e) => !rem.has(e.tag));
}

export default function CrdtCountersViz() {
  const [mode, setMode] = useState(MODES[0]);
  const [partitioned, setPartitioned] = useState(true);
  const [tagSeed, setTagSeed] = useState(0);

  const [counter, setCounter] = useState({
    A: { A: 0, B: 0 },
    B: { A: 0, B: 0 },
    merged: false,
  });
  const [orset, setOrset] = useState({
    A: { adds: [], removes: [] },
    B: { adds: [], removes: [] },
    merged: false,
  });
  const [lastOp, setLastOp] = useState('cleared');

  const reset = () => {
    setCounter({ A: { A: 0, B: 0 }, B: { A: 0, B: 0 }, merged: false });
    setOrset({ A: { adds: [], removes: [] }, B: { adds: [], removes: [] }, merged: false });
    setTagSeed(0);
    setPartitioned(true);
    setLastOp('cleared');
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    setLastOp('cleared');
  };

  const incCounter = (replica) => {
    setCounter((c) => {
      const next = { ...c, A: { ...c.A }, B: { ...c.B }, merged: false };
      next[replica][replica] += 1;
      if (!partitioned) {
        const m = mergeCounter(next.A, next.B);
        next.A = { ...m };
        next.B = { ...m };
        next.merged = true;
      }
      return next;
    });
    setLastOp(`inc-${replica}`);
  };

  const addToSet = (replica) => {
    const used = new Set([
      ...orset.A.adds.map((e) => e.el),
      ...orset.B.adds.map((e) => e.el),
    ]);
    const el = SET_ELEMENTS.find((e) => !used.has(`${e}@${replica}`)) || SET_ELEMENTS[(orset[replica].adds.length) % SET_ELEMENTS.length];
    const seed = tagSeed + 1;
    const tag = fnvTag(seed);
    setTagSeed(seed);
    setOrset((s) => {
      const entry = { el, tag, origin: replica };
      const next = {
        ...s,
        A: { adds: [...s.A.adds], removes: [...s.A.removes] },
        B: { adds: [...s.B.adds], removes: [...s.B.removes] },
        merged: false,
      };
      next[replica].adds.push(entry);
      if (!partitioned) {
        const m = mergeSet(next.A, next.B);
        next.A = { adds: [...m.adds], removes: [...m.removes] };
        next.B = { adds: [...m.adds], removes: [...m.removes] };
        next.merged = true;
      }
      return next;
    });
    setLastOp(`add-${replica}-${el}`);
  };

  const doMerge = () => {
    if (mode === 'G-Counter') {
      setCounter((c) => {
        const m = mergeCounter(c.A, c.B);
        return { A: { ...m }, B: { ...m }, merged: true };
      });
    } else {
      setOrset((s) => {
        const m = mergeSet(s.A, s.B);
        return {
          A: { adds: [...m.adds], removes: [...m.removes] },
          B: { adds: [...m.adds], removes: [...m.removes] },
          merged: true,
        };
      });
    }
    setLastOp('merge');
  };

  const togglePartition = () => {
    const goingLinked = partitioned;
    setPartitioned((p) => !p);
    if (goingLinked) doMerge();
  };

  const mergedCounter = useMemo(() => mergeCounter(counter.A, counter.B), [counter]);
  const mergedSet = useMemo(() => mergeSet(orset.A, orset.B), [orset]);

  const isCounter = mode === 'G-Counter';

  const valA = isCounter ? counterValue(counter.A) : liveSet(orset.A).length;
  const valB = isCounter ? counterValue(counter.B) : liveSet(orset.B).length;
  const valMerged = isCounter ? counterValue(mergedCounter) : mergedSet.live.length;
  const converged = isCounter ? counter.merged : orset.merged;
  const diverged = !converged && (valA !== valMerged || valB !== valMerged);

  const narration = (() => {
    if (lastOp === 'cleared') {
      return isCounter
        ? 'Each replica holds a per-replica vector {A, B}. Increment bumps only that replica’s own slot. Value = sum of the vector. While partitioned, the vectors diverge.'
        : 'Each replica holds a set of (element, unique tag) adds. While partitioned, adds happen independently on each side.';
    }
    if (lastOp === 'merge') {
      return isCounter
        ? `MERGE = element-wise MAX of the two vectors. Both replicas converge to {A:${mergedCounter.A}, B:${mergedCounter.B}}, value ${valMerged}. Merge is commutative + idempotent — either order, same result.`
        : `MERGE = union of adds minus union of removes. Both replicas converge to the same ${mergedSet.live.length}-element set, regardless of operation order.`;
    }
    if (lastOp.startsWith('inc-')) {
      const r = lastOp.split('-')[1];
      return partitioned
        ? `Replica ${r} incremented its own slot. Its vector now diverges from the peer until you MERGE.`
        : `Replica ${r} incremented; replicas are linked so the bump merged immediately into both.`;
    }
    if (lastOp.startsWith('add-')) {
      const parts = lastOp.split('-');
      return partitioned
        ? `Replica ${parts[1]} added "${parts[2]}" with a unique tag. The sets differ until you MERGE.`
        : `Replica ${parts[1]} added "${parts[2]}"; linked replicas merged the add into both sets immediately.`;
    }
    return '';
  })();

  const W = 940;
  const H = 430;
  const panelW = 256;
  const panelH = 250;
  const ax = 40;
  const bx = W - panelW - 40;
  const panelY = 56;
  const mergedY = panelY + panelH + 30;
  const mergedX = (W - 360) / 2;

  const renderVector = (vec, x, bumpedKey) => {
    const cellW = 56;
    const cellH = 46;
    const gap = 16;
    const startX = x + 24;
    const vy = panelY + 96;
    return ['A', 'B'].map((k, i) => {
      const cx = startX + i * (cellW + gap);
      const bumped = bumpedKey === k;
      return (
        <g key={`vec-${x}-${k}`}>
          <text className="crdt-vec-k" x={cx + 4} y={vy - 8}>slot {k}</text>
          <rect className={`crdt-vec-cell ${bumped ? 'is-bumped' : ''}`} x={cx} y={vy} width={cellW} height={cellH} rx={7} />
          <text className={`crdt-vec-v ${bumped ? 'is-bumped' : ''}`} x={cx + cellW / 2} y={vy + cellH / 2 + 6}>{vec[k]}</text>
        </g>
      );
    });
  };

  const renderCounterPanel = (which, vec, x, role) => {
    const bumpedKey = lastOp === `inc-${which}` && !converged ? which : null;
    return (
      <g key={`panel-${which}`}>
        <rect className={`crdt-panel is-${role}`} x={x} y={panelY} width={panelW} height={panelH} rx={12} />
        <text className={`crdt-panel-tag is-${role}`} x={x + 18} y={panelY + 26}>Replica {which}</text>
        <text className="crdt-panel-sub" x={x + 18} y={panelY + 44}>vector {'{A, B}'}</text>
        {renderVector(vec, x, bumpedKey)}
        <text className="crdt-value-cap" x={x + panelW / 2} y={panelY + 178}>value = A + B</text>
        <text className="crdt-value" x={x + panelW / 2} y={panelY + 214}>{counterValue(vec)}</text>
      </g>
    );
  };

  const renderChips = (entries, x, role, removedTags) => {
    const remSet = new Set(removedTags || []);
    if (entries.length === 0) {
      return <text className="crdt-empty" x={x + panelW / 2} y={panelY + 150}>{'∅ empty set'}</text>;
    }
    const chipW = 56;
    const chipH = 40;
    const gap = 12;
    const perRow = 3;
    const startX = x + 20;
    const sy = panelY + 80;
    return entries.map((e, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const cx = startX + col * (chipW + gap);
      const cy = sy + row * (chipH + gap);
      const removed = remSet.has(e.tag);
      return (
        <g key={`chip-${x}-${e.tag}`}>
          <rect className={`crdt-chip ${removed ? 'is-removed' : `is-${role}`}`} x={cx} y={cy} width={chipW} height={chipH} rx={8} />
          <text className={`crdt-chip-label ${removed ? 'is-removed' : ''}`} x={cx + chipW / 2} y={cy + 18}>{e.el}</text>
          <text className="crdt-chip-tag" x={cx + chipW / 2} y={cy + 32}>#{e.tag}</text>
        </g>
      );
    });
  };

  const renderSetPanel = (which, state, x, role) => {
    const live = liveSet(state);
    return (
      <g key={`panel-${which}`}>
        <rect className={`crdt-panel is-${role}`} x={x} y={panelY} width={panelW} height={panelH} rx={12} />
        <text className={`crdt-panel-tag is-${role}`} x={x + 18} y={panelY + 26}>Replica {which}</text>
        <text className="crdt-panel-sub" x={x + 18} y={panelY + 44}>adds (element, tag)</text>
        {renderChips(state.adds, x, role, state.removes)}
        <text className="crdt-value-cap" x={x + panelW / 2} y={panelY + 200}>live elements</text>
        <text className="crdt-value" x={x + panelW / 2} y={panelY + 234}>{live.length}</text>
      </g>
    );
  };

  return (
    <div className="crdt">
      <div className="crdt-head">
        <h3 className="crdt-title">CRDTs — two replicas that always converge on merge</h3>
        <p className="crdt-sub">
          Increment or add on each replica while partitioned so they diverge, then MERGE. Both replicas reach the
          identical state no matter the operation order — that is the conflict-free guarantee.
        </p>
      </div>

      <div className="crdt-controls">
        <div className="crdt-modes" role="tablist" aria-label="CRDT type">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={`crdt-mode ${mode === m ? 'is-on' : ''}`}
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="crdt-group">
          {isCounter ? (
            <>
              <button type="button" className="crdt-btn crdt-btn-a" onClick={() => incCounter('A')}>
                <Plus size={13} /> increment A
              </button>
              <button type="button" className="crdt-btn crdt-btn-b" onClick={() => incCounter('B')}>
                <Plus size={13} /> increment B
              </button>
            </>
          ) : (
            <>
              <button type="button" className="crdt-btn crdt-btn-a" onClick={() => addToSet('A')}>
                <Plus size={13} /> add to A
              </button>
              <button type="button" className="crdt-btn crdt-btn-b" onClick={() => addToSet('B')}>
                <Plus size={13} /> add to B
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className={`crdt-toggle ${partitioned ? 'is-partitioned' : 'is-linked'}`}
          onClick={togglePartition}
          aria-pressed={partitioned}
        >
          {partitioned ? <Unplug size={13} /> : <Link2 size={13} />}
          {partitioned ? 'partitioned' : 'linked'}
        </button>

        <span className="crdt-spacer" aria-hidden="true" />

        <div className="crdt-group">
          <button
            type="button"
            className="crdt-btn crdt-btn-merge"
            onClick={doMerge}
            disabled={converged}
          >
            <GitMerge size={14} /> MERGE
          </button>
          <button type="button" className="crdt-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="crdt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="crdt-svg" preserveAspectRatio="xMidYMid meet">
          <text className="crdt-row-label" x={ax + 4} y={40}>Replica A</text>
          <text className="crdt-row-label" x={bx + 4} y={40}>Replica B</text>

          <line
            className={`crdt-link ${partitioned && !converged ? 'is-cut' : ''}`}
            x1={ax + panelW}
            y1={panelY + panelH / 2}
            x2={bx}
            y2={panelY + panelH / 2}
          />
          {partitioned && !converged && (
            <text className="crdt-merge-mark" x={W / 2} y={panelY + panelH / 2 - 10} style={{ fill: 'var(--warning)' }}>
              partitioned
            </text>
          )}
          {converged && (
            <text className="crdt-merge-mark" x={W / 2} y={panelY + panelH / 2 - 10}>
              converged
            </text>
          )}

          {isCounter
            ? renderCounterPanel('A', counter.A, ax, 'a')
            : renderSetPanel('A', orset.A, ax, 'a')}
          {isCounter
            ? renderCounterPanel('B', counter.B, bx, 'b')
            : renderSetPanel('B', orset.B, bx, 'b')}

          <line className="crdt-link" x1={ax + panelW / 2} y1={panelY + panelH} x2={mergedX + 180} y2={mergedY} opacity={converged ? 0.7 : 0.25} />
          <line className="crdt-link" x1={bx + panelW / 2} y1={panelY + panelH} x2={mergedX + 180} y2={mergedY} opacity={converged ? 0.7 : 0.25} />

          <rect className="crdt-panel is-merged" x={mergedX} y={mergedY} width={360} height={130} rx={12} />
          <text className="crdt-panel-tag is-merged" x={mergedX + 18} y={mergedY + 26}>
            <tspan>{isCounter ? 'merged vector = element-wise MAX' : 'merged set = ∪ adds − ∪ removes'}</tspan>
          </text>
          {isCounter ? (
            <>
              <text className="crdt-vec-v" x={mergedX + 70} y={mergedY + 78}>{`{A:${mergedCounter.A}, B:${mergedCounter.B}}`}</text>
              <text className="crdt-value-cap" x={mergedX + 270} y={mergedY + 56}>converged value</text>
              <text className="crdt-value is-merged" x={mergedX + 270} y={mergedY + 92}>{valMerged}</text>
            </>
          ) : (
            <>
              <text className="crdt-value-cap" x={mergedX + 80} y={mergedY + 56}>live</text>
              <text className="crdt-value is-merged" x={mergedX + 80} y={mergedY + 96}>{mergedSet.live.length}</text>
              <text className="crdt-chip-tag" x={mergedX + 250} y={mergedY + 80} style={{ fontSize: 13 }}>
                {'{ '}{mergedSet.live.map((e) => e.el).join(', ') || '∅'}{' }'}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="crdt-metrics">
        <div className="crdt-metric">
          <span className="crdt-metric-label">{isCounter ? 'Replica A value' : 'Replica A live'}</span>
          <span className="crdt-metric-value is-a">{valA}</span>
        </div>
        <div className="crdt-metric">
          <span className="crdt-metric-label">{isCounter ? 'Replica B value' : 'Replica B live'}</span>
          <span className="crdt-metric-value is-b">{valB}</span>
        </div>
        <div className="crdt-metric">
          <span className="crdt-metric-label">merged value</span>
          <span className="crdt-metric-value is-merged">{valMerged}</span>
        </div>
        <div className="crdt-metric">
          <span className="crdt-metric-label">state</span>
          <span className={`crdt-metric-value ${converged ? 'is-merged' : diverged ? 'is-diverged' : ''}`}>
            {converged ? 'converged' : diverged ? 'diverged' : 'equal'}
          </span>
        </div>
        <div className="crdt-metric">
          <span className="crdt-metric-label">link</span>
          <span className={`crdt-metric-value ${partitioned ? 'is-diverged' : 'is-merged'}`}>
            {partitioned ? 'partitioned' : 'linked'}
          </span>
        </div>
      </div>

      <div className="crdt-narration">
        <span className="crdt-narration-label">trace</span>
        <span className="crdt-narration-body">{narration}</span>
      </div>
    </div>
  );
}
