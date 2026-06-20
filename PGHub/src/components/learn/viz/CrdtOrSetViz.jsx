import React, { useMemo, useState } from 'react';
import { Plus, Minus, GitMerge, RotateCcw, Unplug, Link2, Beaker } from 'lucide-react';
import './CrdtOrSetViz.css';

const ELEMENTS = ['x', 'y', 'z'];

function fnvTag(seed) {
  let h = 2166136261 >>> 0;
  const s = `tag#${seed}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 9000) + 1000;
}

function liveByElement(state) {
  const removed = new Set(state.removes);
  const map = new Map();
  for (const e of state.adds) {
    if (removed.has(e.tag)) continue;
    if (!map.has(e.el)) map.set(e.el, []);
    map.get(e.el).push(e.tag);
  }
  return map;
}

function mergeState(a, b) {
  const adds = new Map();
  for (const e of [...a.adds, ...b.adds]) adds.set(e.tag, e);
  const removes = new Set([...a.removes, ...b.removes]);
  return { adds: [...adds.values()], removes: [...removes] };
}

const EMPTY = () => ({
  A: { adds: [], removes: [] },
  B: { adds: [], removes: [] },
  merged: false,
});

export default function CrdtOrSetViz() {
  const [partitioned, setPartitioned] = useState(true);
  const [tagSeed, setTagSeed] = useState(0);
  const [pick, setPick] = useState('x');
  const [state, setState] = useState(EMPTY);
  const [lastOp, setLastOp] = useState('cleared');

  const reset = () => {
    setState(EMPTY());
    setTagSeed(0);
    setPartitioned(true);
    setPick('x');
    setLastOp('cleared');
  };

  const linkAfter = (next) => {
    if (partitioned) return next;
    const m = mergeState(next.A, next.B);
    return {
      A: { adds: [...m.adds], removes: [...m.removes] },
      B: { adds: [...m.adds], removes: [...m.removes] },
      merged: true,
    };
  };

  const addTo = (replica, el) => {
    const seed = tagSeed + 1;
    const tag = fnvTag(seed);
    setTagSeed(seed);
    setState((s) => {
      const next = {
        A: { adds: [...s.A.adds], removes: [...s.A.removes] },
        B: { adds: [...s.B.adds], removes: [...s.B.removes] },
        merged: false,
      };
      next[replica].adds.push({ el, tag, origin: replica });
      return linkAfter(next);
    });
    setLastOp(`add-${replica}-${el}`);
  };

  const removeFrom = (replica, el) => {
    setState((s) => {
      const observed = s[replica].adds
        .filter((e) => e.el === el && !s[replica].removes.includes(e.tag))
        .map((e) => e.tag);
      const next = {
        A: { adds: [...s.A.adds], removes: [...s.A.removes] },
        B: { adds: [...s.B.adds], removes: [...s.B.removes] },
        merged: false,
      };
      next[replica].removes = [...next[replica].removes, ...observed];
      return linkAfter(next);
    });
    setLastOp(`rem-${replica}-${el}`);
  };

  const doMerge = () => {
    setState((s) => {
      const m = mergeState(s.A, s.B);
      return {
        A: { adds: [...m.adds], removes: [...m.removes] },
        B: { adds: [...m.adds], removes: [...m.removes] },
        merged: true,
      };
    });
    setLastOp('merge');
  };

  const togglePartition = () => {
    const goingLinked = partitioned;
    setPartitioned((p) => !p);
    if (goingLinked) doMerge();
  };

  const runDemo = () => {
    const t1 = fnvTag(1);
    const t2 = fnvTag(2);
    setTagSeed(2);
    setPartitioned(true);
    setPick('x');
    setState({
      A: { adds: [{ el: 'x', tag: t1, origin: 'A' }], removes: [t1] },
      B: {
        adds: [
          { el: 'x', tag: t1, origin: 'A' },
          { el: 'x', tag: t2, origin: 'B' },
        ],
        removes: [],
      },
      merged: false,
    });
    setLastOp('demo');
  };

  const mergedPreview = useMemo(() => mergeState(state.A, state.B), [state]);
  const liveA = useMemo(() => liveByElement(state.A), [state]);
  const liveB = useMemo(() => liveByElement(state.B), [state]);
  const liveMerged = useMemo(() => liveByElement(mergedPreview), [mergedPreview]);

  const memberA = useMemo(() => [...liveA.keys()].sort(), [liveA]);
  const memberB = useMemo(() => [...liveB.keys()].sort(), [liveB]);
  const memberMerged = useMemo(() => [...liveMerged.keys()].sort(), [liveMerged]);

  const converged = state.merged;
  const diverged = !converged && memberA.join(',') !== memberB.join(',');

  const narration = (() => {
    if (lastOp === 'cleared') {
      return 'Each ADD tags the element with a unique (element, tag) pair. A REMOVE deletes only the tags that replica has already OBSERVED. Run concurrent ops while partitioned, then MERGE.';
    }
    if (lastOp === 'demo') {
      return 'Demo: A removed "x" (observing its one tag), then B concurrently added "x" with a FRESH tag B never shared. The remove on A could not have seen B\'s tag. Press MERGE — x survives.';
    }
    if (lastOp === 'merge') {
      const present = memberMerged.length ? `{ ${memberMerged.join(', ')} }` : 'the empty set';
      return `MERGE = union of adds minus union of removes. Both replicas converge to ${present}. A concurrent add whose tag no remove observed always survives — ADD WINS.`;
    }
    if (lastOp.startsWith('add-')) {
      const [, r, el] = lastOp.split('-');
      return partitioned
        ? `Replica ${r} tagged "${el}" with a fresh unique tag. Until MERGE this add is invisible to the peer, so a peer remove cannot observe it.`
        : `Replica ${r} added "${el}"; linked replicas merged the tagged add into both states immediately.`;
    }
    if (lastOp.startsWith('rem-')) {
      const [, r, el] = lastOp.split('-');
      return partitioned
        ? `Replica ${r} removed "${el}" by tombstoning only the tags it currently observes. Tags added elsewhere are untouched and will survive the merge.`
        : `Replica ${r} removed "${el}"; the observed tags were tombstoned and propagated to both replicas.`;
    }
    return '';
  })();

  const W = 940;
  const H = 470;
  const panelW = 256;
  const panelH = 252;
  const ax = 40;
  const bx = W - panelW - 40;
  const panelY = 56;
  const mergedY = panelY + panelH + 34;
  const mergedW = 420;
  const mergedX = (W - mergedW) / 2;

  const renderChips = (state2, x, role) => {
    const removed = new Set(state2.removes);
    const entries = state2.adds;
    if (entries.length === 0) {
      return <text className="cors-empty" x={x + panelW / 2} y={panelY + 150}>{'∅ no add tags'}</text>;
    }
    const chipW = 66;
    const chipH = 42;
    const gap = 12;
    const perRow = 3;
    const startX = x + 16;
    const sy = panelY + 78;
    return entries.map((e, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const cx = startX + col * (chipW + gap);
      const cy = sy + row * (chipH + gap);
      const isRem = removed.has(e.tag);
      return (
        <g key={`chip-${x}-${e.tag}-${i}`}>
          <rect className={`cors-chip ${isRem ? 'is-removed' : `is-${role}`}`} x={cx} y={cy} width={chipW} height={chipH} rx={8} />
          <text className={`cors-chip-label ${isRem ? 'is-removed' : ''}`} x={cx + chipW / 2} y={cy + 19}>{e.el}</text>
          <text className="cors-chip-tag" x={cx + chipW / 2} y={cy + 33}>#{e.tag}</text>
        </g>
      );
    });
  };

  const memberLine = (members, live) =>
    members.length
      ? members.map((el) => `${el}→[${live.get(el).map((t) => `#${t}`).join(',')}]`).join('   ')
      : '∅';

  const renderPanel = (which, st, x, role, members, live) => (
    <g key={`panel-${which}`}>
      <rect className={`cors-panel is-${role}`} x={x} y={panelY} width={panelW} height={panelH} rx={12} />
      <text className={`cors-panel-tag is-${role}`} x={x + 18} y={panelY + 26}>Replica {which}</text>
      <text className="cors-panel-sub" x={x + 18} y={panelY + 44}>add tags (element, tag)</text>
      {renderChips(st, x, role)}
      <line x1={x + 16} y1={panelY + 196} x2={x + panelW - 16} y2={panelY + 196} className="cors-divider" />
      <text className="cors-value-cap" x={x + 18} y={panelY + 214}>live members</text>
      <text className="cors-member-line" x={x + 18} y={panelY + 236}>{memberLine(members, live)}</text>
    </g>
  );

  return (
    <div className="cors">
      <div className="cors-head">
        <h3 className="cors-title">OR-Set — observed-remove, where a concurrent add wins</h3>
        <p className="cors-sub">
          Every add stamps a unique tag; a remove only tombstones the tags it has already seen. Remove "x" on A while
          B concurrently re-adds "x" with a fresh tag, then MERGE — x stays present because no remove ever observed
          B&apos;s tag.
        </p>
      </div>

      <div className="cors-controls">
        <div className="cors-pickrow">
          <span className="cors-input-label">element</span>
          <div className="cors-picker" role="tablist" aria-label="element to act on">
            {ELEMENTS.map((el) => (
              <button
                key={el}
                type="button"
                className={`cors-pick ${pick === el ? 'is-on' : ''}`}
                onClick={() => setPick(el)}
                aria-pressed={pick === el}
              >
                {el}
              </button>
            ))}
          </div>
        </div>

        <div className="cors-group">
          <button type="button" className="cors-btn cors-btn-a" onClick={() => addTo('A', pick)}>
            <Plus size={13} /> add {pick} @A
          </button>
          <button type="button" className="cors-btn cors-btn-a" onClick={() => removeFrom('A', pick)}>
            <Minus size={13} /> rm {pick} @A
          </button>
          <button type="button" className="cors-btn cors-btn-b" onClick={() => addTo('B', pick)}>
            <Plus size={13} /> add {pick} @B
          </button>
          <button type="button" className="cors-btn cors-btn-b" onClick={() => removeFrom('B', pick)}>
            <Minus size={13} /> rm {pick} @B
          </button>
        </div>

        <button
          type="button"
          className={`cors-toggle ${partitioned ? 'is-partitioned' : 'is-linked'}`}
          onClick={togglePartition}
          aria-pressed={partitioned}
        >
          {partitioned ? <Unplug size={13} /> : <Link2 size={13} />}
          {partitioned ? 'partitioned' : 'linked'}
        </button>

        <span className="cors-spacer" aria-hidden="true" />

        <div className="cors-group">
          <button type="button" className="cors-btn cors-btn-demo" onClick={runDemo}>
            <Beaker size={13} /> concurrent demo
          </button>
          <button type="button" className="cors-btn cors-btn-merge" onClick={doMerge} disabled={converged}>
            <GitMerge size={14} /> MERGE
          </button>
          <button type="button" className="cors-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="cors-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cors-svg" preserveAspectRatio="xMidYMid meet">
          <text className="cors-row-label" x={ax + 4} y={40}>Replica A</text>
          <text className="cors-row-label" x={bx + 4} y={40}>Replica B</text>

          <line
            className={`cors-link ${partitioned && !converged ? 'is-cut' : ''}`}
            x1={ax + panelW}
            y1={panelY + panelH / 2}
            x2={bx}
            y2={panelY + panelH / 2}
          />
          {partitioned && !converged && (
            <text className="cors-mark is-warn" x={W / 2} y={panelY + panelH / 2 - 10}>partitioned</text>
          )}
          {converged && (
            <text className="cors-mark" x={W / 2} y={panelY + panelH / 2 - 10}>converged</text>
          )}

          {renderPanel('A', state.A, ax, 'a', memberA, liveA)}
          {renderPanel('B', state.B, bx, 'b', memberB, liveB)}

          <line className="cors-link" x1={ax + panelW / 2} y1={panelY + panelH} x2={mergedX + mergedW / 2} y2={mergedY} opacity={converged ? 0.7 : 0.25} />
          <line className="cors-link" x1={bx + panelW / 2} y1={panelY + panelH} x2={mergedX + mergedW / 2} y2={mergedY} opacity={converged ? 0.7 : 0.25} />

          <rect className="cors-panel is-merged" x={mergedX} y={mergedY} width={mergedW} height={140} rx={12} />
          <text className="cors-panel-tag is-merged" x={mergedX + 18} y={mergedY + 26}>
            merged set = {'∪'} adds {'−'} {'∪'} removes
          </text>
          <text className="cors-value-cap" x={mergedX + 18} y={mergedY + 56}>live membership</text>
          <text className="cors-merged-set" x={mergedX + 18} y={mergedY + 86}>
            {'{ '}{memberMerged.join(', ') || '∅'}{' }'}
          </text>
          <text className="cors-member-line" x={mergedX + 18} y={mergedY + 116}>
            {memberLine(memberMerged, liveMerged)}
          </text>
          <text className="cors-value-cap" x={mergedX + mergedW - 18} y={mergedY + 56} style={{ textAnchor: 'end' }}>live count</text>
          <text className="cors-value is-merged" x={mergedX + mergedW - 18} y={mergedY + 96} style={{ textAnchor: 'end' }}>
            {memberMerged.length}
          </text>
        </svg>
      </div>

      <div className="cors-metrics">
        <div className="cors-metric">
          <span className="cors-metric-label">A members</span>
          <span className="cors-metric-value is-a">{memberA.length}</span>
        </div>
        <div className="cors-metric">
          <span className="cors-metric-label">B members</span>
          <span className="cors-metric-value is-b">{memberB.length}</span>
        </div>
        <div className="cors-metric">
          <span className="cors-metric-label">merged members</span>
          <span className="cors-metric-value is-merged">{memberMerged.length}</span>
        </div>
        <div className="cors-metric">
          <span className="cors-metric-label">tombstones</span>
          <span className="cors-metric-value">{mergedPreview.removes.length}</span>
        </div>
        <div className="cors-metric">
          <span className="cors-metric-label">state</span>
          <span className={`cors-metric-value ${converged ? 'is-merged' : diverged ? 'is-diverged' : ''}`}>
            {converged ? 'converged' : diverged ? 'diverged' : 'equal'}
          </span>
        </div>
        <div className="cors-metric">
          <span className="cors-metric-label">link</span>
          <span className={`cors-metric-value ${partitioned ? 'is-diverged' : 'is-merged'}`}>
            {partitioned ? 'partitioned' : 'linked'}
          </span>
        </div>
      </div>

      <div className="cors-narration">
        <span className="cors-narration-label">trace</span>
        <span className="cors-narration-body">{narration}</span>
      </div>
    </div>
  );
}
