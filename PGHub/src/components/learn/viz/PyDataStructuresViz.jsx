import React, { useMemo, useState, useEffect, useRef } from 'react';
import { List, KeyRound, Boxes, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import './PyDataStructuresViz.css';

const LIST_STEPS = [
  {
    op: 'lst = [10, 20, 30]',
    note: 'Ordered boxes — every slot carries an index. Duplicates are allowed; position is meaningful.',
    items: [10, 20, 30],
    hi: -1,
  },
  {
    op: 'lst.append(40)',
    note: 'append adds 40 at the end — it lands at index 3. Nothing else moves.',
    items: [10, 20, 30, 40],
    hi: 3,
  },
  {
    op: 'lst.insert(1, 15)',
    note: 'insert(1, 15): 15 takes index 1, and 20 · 30 · 40 each shift one slot to the right.',
    items: [10, 15, 20, 30, 40],
    hi: 1,
  },
];

const DICT_STEPS = [
  {
    op: 'd = {"a": 1, "b": 2}',
    note: 'Keys map to values. Access is by key, not position — and each key is unique.',
    pairs: [['a', 1], ['b', 2]],
    hiKey: null,
    mode: 'init',
  },
  {
    op: 'd["b"]',
    note: "d['b']: hashing jumps straight to b's slot — O(1) direct access, no scanning the keys.",
    pairs: [['a', 1], ['b', 2]],
    hiKey: 'b',
    mode: 'lookup',
  },
  {
    op: 'd["c"] = 3',
    note: "d['c'] = 3 stores a brand-new unique key/value pair.",
    pairs: [['a', 1], ['b', 2], ['c', 3]],
    hiKey: 'c',
    mode: 'add',
  },
];

const SET_STEPS = [
  {
    op: 's = {3, 7, 1}',
    note: 'Unordered, unique elements. The structure tracks membership, not position.',
    items: [3, 7, 1],
    hi: null,
    mode: 'init',
  },
  {
    op: 's.add(7)',
    note: '7 is already in the set -> add is a no-op, sets dedupe automatically.',
    items: [3, 7, 1],
    hi: 7,
    mode: 'dup',
  },
  {
    op: 's.add(9)',
    note: '9 is not a member yet -> it gets added to the set.',
    items: [3, 7, 1, 9],
    hi: 9,
    mode: 'add',
  },
];

const STRUCTS = [
  { id: 'list', label: 'list', Icon: List, prop: 'ordered · indexed · duplicates ok', steps: LIST_STEPS },
  { id: 'dict', label: 'dict', Icon: KeyRound, prop: 'keyed · unique keys · O(1) access', steps: DICT_STEPS },
  { id: 'set', label: 'set', Icon: Boxes, prop: 'unordered · unique · membership', steps: SET_STEPS },
];

const W = 760;
const H = 240;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PyDataStructuresViz() {
  const [structId, setStructId] = useState('list');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const active = useMemo(() => STRUCTS.find((s) => s.id === structId), [structId]);
  const steps = active.steps;
  const total = steps.length;
  const cur = steps[Math.min(step, total - 1)];
  const finished = step >= total - 1;
  const ActiveIcon = active.Icon;

  function pickStruct(id) {
    setStructId(id);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => {
        const next = Math.min(total - 1, s + 1);
        if (next >= total - 1) setPlaying(false);
        return next;
      });
    }, reduced() ? 520 : 1150);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const contentsStr = useMemo(() => {
    if (structId === 'list') return `[${cur.items.join(', ')}]`;
    if (structId === 'set') return `{${cur.items.join(', ')}}`;
    return `{${cur.pairs.map(([k, v]) => `'${k}': ${v}`).join(', ')}}`;
  }, [structId, cur]);

  const count = structId === 'dict' ? cur.pairs.length : cur.items.length;
  const countLabel = structId === 'list' ? 'len' : 'size';

  function renderList() {
    const cw = 70;
    const ch = 58;
    const gap = 12;
    const y = 78;
    const n = cur.items.length;
    const rowW = n * cw + (n - 1) * gap;
    const sx = (W - rowW) / 2;
    return (
      <g>
        {cur.items.map((v, i) => {
          const x = sx + i * (cw + gap);
          const isHi = i === cur.hi && step > 0;
          return (
            <g key={i} className={`pyds-cell is-list${isHi ? ' is-hi' : ''}`}>
              <rect x={x} y={y} width={cw} height={ch} rx={9} className="pyds-cell-box" />
              <text x={x + cw / 2} y={y + ch / 2 + 7} className="pyds-cell-val" textAnchor="middle">{v}</text>
              <text x={x + cw / 2} y={y + ch + 24} className="pyds-idx" textAnchor="middle">{i}</text>
            </g>
          );
        })}
        <text x={sx} y={y + ch + 48} className="pyds-axis">index &rarr;</text>
      </g>
    );
  }

  function renderDict() {
    const kw = 84;
    const vw = 84;
    const kh = 46;
    const gap = 16;
    const n = cur.pairs.length;
    const blockH = n * kh + (n - 1) * gap;
    const sy = (H - blockH) / 2 - 6;
    const kx = W / 2 - 150;
    const vx = W / 2 + 66;
    return (
      <g>
        {cur.pairs.map(([k, val], i) => {
          const y = sy + i * (kh + gap);
          const cy = y + kh / 2;
          const isHi = k === cur.hiKey && step > 0;
          return (
            <g key={k} className={`pyds-pair is-dict${isHi ? ` is-hi is-${cur.mode}` : ''}`}>
              <rect x={kx} y={y} width={kw} height={kh} rx={9} className="pyds-key-box" />
              <text x={kx + kw / 2} y={cy + 5} className="pyds-key" textAnchor="middle">&apos;{k}&apos;</text>
              <line x1={kx + kw} y1={cy} x2={vx} y2={cy} className="pyds-arrow" />
              <polygon points={`${vx - 7},${cy - 5} ${vx},${cy} ${vx - 7},${cy + 5}`} className="pyds-arrowhead" />
              <rect x={vx} y={y} width={vw} height={kh} rx={9} className="pyds-val-box" />
              <text x={vx + vw / 2} y={cy + 5} className="pyds-val" textAnchor="middle">{val}</text>
            </g>
          );
        })}
        <text x={kx} y={sy - 14} className="pyds-axis">key</text>
        <text x={vx} y={sy - 14} className="pyds-axis">value</text>
      </g>
    );
  }

  function renderSet() {
    const r = 30;
    const gap = 22;
    const y = 124;
    const n = cur.items.length;
    const cwid = 2 * r;
    const rowW = n * cwid + (n - 1) * gap;
    const sx = (W - rowW) / 2;
    return (
      <g>
        <rect x={sx - 26} y={y - r - 26} width={rowW + 52} height={2 * r + 52} rx={22} className="pyds-bag" />
        <text x={sx - 26} y={y - r - 36} className="pyds-axis">no order &mdash; membership only</text>
        {cur.items.map((v, i) => {
          const cx = sx + r + i * (cwid + gap);
          const isHi = v === cur.hi && step > 0;
          const dup = isHi && cur.mode === 'dup';
          return (
            <g key={i} className={`pyds-node is-set${isHi ? ` is-hi ${dup ? 'is-dup' : 'is-add'}` : ''}`}>
              <circle cx={cx} cy={y} r={r} className="pyds-node-circle" />
              <text x={cx} y={y + 6} className="pyds-node-val" textAnchor="middle">{v}</text>
              {dup && <text x={cx} y={y - r - 8} className="pyds-node-tag" textAnchor="middle">dedupe</text>}
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <div className={`pyds is-${structId}`}>
      <div className="pyds-head">
        <div className="pyds-head-icon"><ActiveIcon size={18} /></div>
        <div className="pyds-head-text">
          <h3 className="pyds-title">list · dict · set — three structures, three behaviours</h3>
          <p className="pyds-sub">
            Same data, different rules. Pick a structure and step through the operation that defines it.
          </p>
        </div>
      </div>

      <div className="pyds-chips">
        <span className="pyds-chips-label">structure</span>
        {STRUCTS.map((s) => {
          const ChipIcon = s.Icon;
          return (
            <button
              key={s.id}
              type="button"
              className={`pyds-chip is-${s.id}${s.id === structId ? ' is-active' : ''}`}
              onClick={() => pickStruct(s.id)}
            >
              <ChipIcon size={14} /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="pyds-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pyds-svg" preserveAspectRatio="xMidYMid meet">
          <text x={20} y={26} className="pyds-stage-label">{active.label}</text>
          <text x={W - 20} y={26} className="pyds-stage-label" textAnchor="end">{countLabel} = {count}</text>
          {structId === 'list' && renderList()}
          {structId === 'dict' && renderDict()}
          {structId === 'set' && renderSet()}
        </svg>
      </div>

      <div className="pyds-controls">
        <button type="button" className="pyds-btn" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="pyds-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <button
          type="button"
          className="pyds-btn"
          onClick={() => { setStep(0); setPlaying(false); }}
        >
          <RotateCcw size={14} /> Reset
        </button>
        <span className="pyds-progress">{step + 1} / {total} steps</span>
      </div>

      <div className="pyds-readout">
        <div className={`pyds-stat is-contents is-${structId}`}>
          <ActiveIcon size={13} />
          <span className="pyds-stat-label">contents</span>
          <span className="pyds-stat-val">{contentsStr}</span>
        </div>
        <div className={`pyds-stat is-prop is-${structId}`}>
          <span className="pyds-stat-label">key property</span>
          <span className="pyds-stat-val">{active.prop}</span>
        </div>
        <div className={`pyds-stat is-op is-${structId}`}>
          <span className="pyds-stat-label">operation</span>
          <span className="pyds-stat-val">{cur.op}</span>
        </div>
      </div>

      <div className="pyds-note">
        <span className="pyds-note-label">now</span>
        <span className="pyds-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
