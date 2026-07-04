import React, { useEffect, useRef, useState } from 'react';
import { Layers, Play, Pause, SkipForward, RotateCcw, Rows3, Network, CircleDot } from 'lucide-react';
import './CppStlViz.css';

const VW = 720;
const VH = 320;

const VECTOR_FRAMES = [
  {
    cells: [10, 30, 20],
    note: 'A std::vector is a contiguous, indexed row. Reading v[i] is O(1) — the address is base + i * sizeof(T).',
    complexity: 'index v[i] -> O(1)',
  },
  {
    cells: [10, 30, 20, 50], newIdx: 3,
    note: 'push_back(50) appends at the end. Most pushes are instant; only an occasional reallocation copies — O(1) amortized.',
    complexity: 'push_back -> O(1) amortized',
  },
  {
    cells: [10, 30, 20, 50, 40], newIdx: 4,
    note: 'push_back(40) appends again. The vector grows its length while keeping every element back-to-back in memory.',
    complexity: 'push_back -> O(1) amortized',
  },
  {
    cells: [10, 30, 20, 50, 40], scan: 0,
    note: 'std::find(begin, end, 30) starts scanning at index 0. Value 10 is not 30 — keep walking right.',
    complexity: 'find -> O(n) linear scan',
  },
  {
    cells: [10, 30, 20, 50, 40], scan: 1, hit: 1,
    note: 'Index 1 holds 30 — match. std::find returns that iterator. Unsorted lookup costs O(n).',
    complexity: 'find -> O(n) linear scan',
  },
];

const MAP_NODES = {
  kiwi: { id: 'kiwi', key: 'kiwi', val: 3, x: 360, y: 62 },
  apple: { id: 'apple', key: 'apple', val: 5, x: 215, y: 152 },
  pear: { id: 'pear', key: 'pear', val: 9, x: 505, y: 152 },
  mango: { id: 'mango', key: 'mango', val: 7, x: 430, y: 244 },
};
const MAP_EDGES = [['kiwi', 'apple'], ['kiwi', 'pear'], ['pear', 'mango']];
const MAP_BASE = ['kiwi', 'apple', 'pear'];
const MAP_FULL = ['kiwi', 'apple', 'pear', 'mango'];

const MAP_FRAMES = [
  { visible: MAP_BASE, note: 'A std::map is a balanced binary search tree: keys stay sorted and every lookup is O(log n).', complexity: 'map: keyed + sorted, O(log n)' },
  { visible: MAP_BASE, active: 'kiwi', note: 'insert("mango", 7): at root "kiwi" — "mango" > "kiwi", go right.', complexity: 'insert -> O(log n)' },
  { visible: MAP_BASE, active: 'pear', visited: ['kiwi'], note: 'at "pear" — "mango" < "pear", step left to the empty slot.', complexity: 'insert -> O(log n)' },
  { visible: MAP_FULL, visited: ['kiwi', 'pear'], hit: 'mango', note: 'Inserted "mango" = 7 in its sorted position after 2 hops.', complexity: 'insert -> O(log n)' },
  { visible: MAP_FULL, active: 'kiwi', note: 'find("mango"): start at the root and compare — go right.', complexity: 'find -> O(log n)' },
  { visible: MAP_FULL, active: 'pear', visited: ['kiwi'], note: 'at "pear" — "mango" < "pear", go left.', complexity: 'find -> O(log n)' },
  { visible: MAP_FULL, visited: ['kiwi', 'pear'], hit: 'mango', note: 'Reached "mango" after touching 3 nodes — its value is 7. Keyed lookup is O(log n).', complexity: 'find -> O(log n)' },
];

const SET_NODES = {
  n30: { id: 'n30', key: 30, x: 360, y: 62 },
  n10: { id: 'n10', key: 10, x: 215, y: 152 },
  n50: { id: 'n50', key: 50, x: 505, y: 152 },
  n20: { id: 'n20', key: 20, x: 290, y: 244 },
  n40: { id: 'n40', key: 40, x: 430, y: 244 },
};
const SET_EDGES = [['n30', 'n10'], ['n30', 'n50'], ['n10', 'n20'], ['n50', 'n40']];
const SET_ALL = ['n30', 'n10', 'n50', 'n20', 'n40'];

const SET_FRAMES = [
  { visible: SET_ALL, note: 'A std::set stores unique keys in a balanced BST — sorted, with O(log n) insert and membership.', complexity: 'set: unique keys, O(log n)' },
  { visible: SET_ALL, active: 'n30', note: 'insert(20): at 30 — 20 < 30, go left.', complexity: 'insert -> O(log n)' },
  { visible: SET_ALL, active: 'n10', visited: ['n30'], note: 'at 10 — 20 > 10, go right.', complexity: 'insert -> O(log n)' },
  { visible: SET_ALL, visited: ['n30', 'n10'], reject: 'n20', note: '20 already exists — the insert is rejected. A set silently dedups duplicate keys.', complexity: 'duplicate ignored' },
  { visible: SET_ALL, active: 'n30', note: 'count(40): at 30 — 40 > 30, go right.', complexity: 'find -> O(log n)' },
  { visible: SET_ALL, active: 'n50', visited: ['n30'], note: 'at 50 — 40 < 50, go left.', complexity: 'find -> O(log n)' },
  { visible: SET_ALL, visited: ['n30', 'n50'], hit: 'n40', note: '40 is present — membership confirmed in O(log n).', complexity: 'find -> O(log n)' },
];

const MODES = {
  vector: { label: 'vector', icon: Rows3, frames: VECTOR_FRAMES, summary: 'push_back O(1)*  ·  index O(1)  ·  find O(n)' },
  map: { label: 'map', icon: Network, frames: MAP_FRAMES, nodes: MAP_NODES, edges: MAP_EDGES, summary: 'insert / find O(log n)  ·  keys kept sorted' },
  set: { label: 'set', icon: CircleDot, frames: SET_FRAMES, nodes: SET_NODES, edges: SET_EDGES, summary: 'unique keys  ·  insert / membership O(log n)' },
};

const MODE_ORDER = ['vector', 'map', 'set'];

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CppStlViz() {
  const [mode, setMode] = useState('vector');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const conf = MODES[mode];
  const frames = conf.frames;
  const total = frames.length;
  const cur = frames[step];
  const finished = step >= total - 1;
  const showPause = playing && !finished;

  function pickMode(m) {
    setMode(m);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  const delay = Math.round((reduced() ? 400 : 1150) / speed);

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), delay);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, delay]);

  const visited = cur.visited || [];

  return (
    <div className="cppstl">
      <div className="cppstl-head">
        <div className="cppstl-head-icon"><Layers size={18} /></div>
        <div className="cppstl-head-text">
          <h3 className="cppstl-title">Containers, iterators, algorithms</h3>
          <p className="cppstl-sub">
            Pick a container and watch how it stores data and answers queries. A vector is a
            contiguous indexed row; a map and a set are balanced search trees keyed for O(log n) lookup.
          </p>
        </div>
        <button type="button" className="cppstl-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cppstl-picker" role="tablist" aria-label="container">
        {MODE_ORDER.map((m) => {
          const Icon = MODES[m].icon;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`cppstl-pick${mode === m ? ' is-on' : ''}`}
              onClick={() => pickMode(m)}
            >
              <Icon size={14} /> std::{MODES[m].label}
            </button>
          );
        })}
      </div>

      <div className="cppstl-stage">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="cppstl-svg" preserveAspectRatio="xMidYMid meet">
          {mode === 'vector' && (() => {
            const cells = cur.cells;
            const n = cells.length;
            const cw = 92;
            const ch = 64;
            const gap = 14;
            const totalW = n * cw + (n - 1) * gap;
            const x0 = (VW - totalW) / 2;
            const y = 132;
            return cells.map((v, i) => {
              const cx = x0 + i * (cw + gap);
              const mid = cx + cw / 2;
              let cls = 'cppstl-cell';
              if (cur.newIdx === i) cls += ' is-new';
              if (cur.scan === i) cls += ' is-scan';
              if (cur.hit === i) cls += ' is-hit';
              return (
                <g key={`cell-${i}`} className={cls}>
                  <text x={mid} y={y - 16} textAnchor="middle" className="cppstl-cell-idx">{i}</text>
                  <rect x={cx} y={y} width={cw} height={ch} rx={10} className="cppstl-cell-rect" />
                  <text x={mid} y={y + ch / 2 + 7} textAnchor="middle" className="cppstl-cell-val">{v}</text>
                  {cur.scan === i && (
                    <path d={`M${mid - 9},${y - 34} L${mid + 9},${y - 34} L${mid},${y - 20} Z`} className="cppstl-scan-ptr" />
                  )}
                </g>
              );
            });
          })()}

          {mode !== 'vector' && (
            <>
              {conf.edges.map(([a, b]) => {
                if (!cur.visible.includes(a) || !cur.visible.includes(b)) return null;
                const na = conf.nodes[a];
                const nb = conf.nodes[b];
                return <line key={`e-${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} className="cppstl-edge" />;
              })}
              {cur.visible.map((id) => {
                const nd = conf.nodes[id];
                let cls = 'cppstl-node';
                if (cur.active === id) cls += ' is-active';
                else if (visited.includes(id)) cls += ' is-visited';
                if (cur.hit === id) cls += ' is-hit';
                if (cur.reject === id) cls += ' is-reject';
                return (
                  <g key={`node-${id}`} className={cls}>
                    <circle cx={nd.x} cy={nd.y} r={32} className="cppstl-node-circle" />
                    <text x={nd.x} y={mode === 'map' ? nd.y - 1 : nd.y + 6} textAnchor="middle" className="cppstl-node-key">{nd.key}</text>
                    {mode === 'map' && (
                      <text x={nd.x} y={nd.y + 15} textAnchor="middle" className="cppstl-node-val">= {nd.val}</text>
                    )}
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      <div className="cppstl-controls">
        <button type="button" className="cppstl-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="cppstl-btn" onClick={() => setStep((s) => Math.min(total - 1, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="cppstl-speed">
          <span className="cppstl-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cppstl-speed-range"
          />
          <span className="cppstl-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="cppstl-progress">{step + 1} / {total}</span>
        <code className="cppstl-chip">{cur.complexity}</code>
      </div>

      <div className="cppstl-readout">
        <span className="cppstl-readout-label">std::{conf.label}</span>
        <span className="cppstl-readout-body">{conf.summary}</span>
      </div>

      <div className="cppstl-note">
        <span className="cppstl-note-label">now</span>
        <span className="cppstl-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
