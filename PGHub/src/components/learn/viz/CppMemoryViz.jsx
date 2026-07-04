import React, { useState, useEffect, useRef } from 'react';
import {
  Layers, Database, Play, Pause, SkipForward, RotateCcw,
  AlertTriangle, ShieldCheck, ArrowRight,
} from 'lucide-react';
import './CppMemoryViz.css';

const SCENARIOS = {
  raii: {
    label: 'RAII',
    steps: [
      {
        code: 'int main() {',
        stack: [{ name: 'main()', vars: 'int x = 7' }],
        heap: [],
        note: 'main()’s frame sits on the stack. x is a plain local — it will pop automatically at scope end.',
      },
      {
        code: 'make_widget();',
        stack: [{ name: 'main()', vars: 'int x = 7' }, { name: 'make_widget()', vars: 'unique_ptr up' }],
        heap: [],
        note: 'Calling make_widget() pushes a new frame on top. Frames always pop in reverse order.',
      },
      {
        code: 'auto up = make_unique<Widget>(99);',
        stack: [{ name: 'main()', vars: 'int x = 7' }, { name: 'make_widget()', vars: 'unique_ptr up', ptr: 'up' }],
        heap: [{ id: 'h1', label: 'Widget{99}', state: 'live', owner: 1 }],
        note: 'new allocates a Widget on the heap; the stack-resident unique_ptr up becomes its sole owner.',
      },
      {
        code: 'return; // ~unique_ptr() runs',
        stack: [{ name: 'main()', vars: 'int x = 7' }],
        heap: [{ id: 'h1', label: 'Widget{99}', state: 'freed', owner: null }],
        note: 'As the frame pops, up’s destructor fires and frees the Widget. RAII cleanup — no manual delete.',
      },
    ],
  },
  leak: {
    label: 'Leak',
    steps: [
      {
        code: 'int main() {',
        stack: [{ name: 'main()', vars: 'int x = 7' }],
        heap: [],
        note: 'Same start: main()’s frame holds local x, which will clean itself up at scope end.',
      },
      {
        code: 'leak_demo();',
        stack: [{ name: 'main()', vars: 'int x = 7' }, { name: 'leak_demo()', vars: 'int* p' }],
        heap: [],
        note: 'leak_demo() pushes a frame holding a raw pointer p — a plain pointer with no destructor.',
      },
      {
        code: 'int* p = new int(42);',
        stack: [{ name: 'main()', vars: 'int x = 7' }, { name: 'leak_demo()', vars: 'int* p', ptr: 'p' }],
        heap: [{ id: 'h1', label: 'int 42', state: 'live', owner: 1 }],
        note: 'new returns a heap block; the raw pointer p points at it, but p does not OWN it in any enforced way.',
      },
      {
        code: 'return; // forgot delete',
        stack: [{ name: 'main()', vars: 'int x = 7' }],
        heap: [{ id: 'h1', label: 'int 42', state: 'leaked', owner: null }],
        note: 'The frame pops and p vanishes — but the heap block stays. The key is lost: a memory leak.',
      },
    ],
  },
};

const W = 760;
const H = 360;
const STACK_X = 36;
const STACK_Y = 72;
const STACK_W = 300;
const STACK_H = 260;
const FRAME_X = 52;
const FRAME_W = 268;
const FRAME_H = 58;
const FRAME_GAP = 10;
const STACK_BASE = STACK_Y + STACK_H - 12;

const HEAP_X = 424;
const HEAP_Y = 72;
const HEAP_W = 300;
const HEAP_H = 260;
const BLOCK_X = 470;
const BLOCK_W = 208;
const BLOCK_H = 62;
const BLOCK_TOP = 132;
const BLOCK_SLOT = 84;

function frameY(i) {
  return STACK_BASE - (i + 1) * FRAME_H - i * FRAME_GAP;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CppMemoryViz() {
  const [mode, setMode] = useState('raii');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const steps = SCENARIOS[mode].steps;
  const total = steps.length;
  const finished = step >= total;
  const showPause = playing && step < total;

  const state = step > 0 ? steps[step - 1] : null;
  const stack = state ? state.stack : [];
  const heap = state ? state.heap : [];

  const stackDepth = stack.length;
  const liveCount = heap.filter((b) => b.state === 'live').length;
  const leakedCount = heap.filter((b) => b.state === 'leaked').length;

  function pick(next) {
    setMode(next);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  const delay = Math.round((reduced() ? 400 : 1200) / speed);

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), delay);
    return () => clearTimeout(timer.current);
  }, [playing, step, total, delay]);

  const noteText = state ? state.note : 'Pick a path, then press Play or Step to walk a function call from new to cleanup.';
  const codeLine = state ? state.code : (mode === 'raii' ? 'auto up = make_unique<Widget>(99);' : 'int* p = new int(42);');

  return (
    <div className="cppmem">
      <div className="cppmem-head">
        <div className="cppmem-head-icon"><Layers size={18} /></div>
        <div className="cppmem-head-text">
          <h3 className="cppmem-title">Stack frames vs heap blocks</h3>
          <p className="cppmem-sub">
            Stack frames pop automatically at scope end. A heap block from <code>new</code> only goes away when
            someone frees it &mdash; a leaked raw pointer forgets, a <code>unique_ptr</code> destructor remembers.
          </p>
        </div>
        <button type="button" className="cppmem-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cppmem-modes">
        <button
          type="button"
          className={`cppmem-mode is-raii${mode === 'raii' ? ' is-active' : ''}`}
          onClick={() => pick('raii')}
        >
          <ShieldCheck size={14} /> RAII path
        </button>
        <button
          type="button"
          className={`cppmem-mode is-leak${mode === 'leak' ? ' is-active' : ''}`}
          onClick={() => pick('leak')}
        >
          <AlertTriangle size={14} /> Leak path
        </button>
      </div>

      <div className="cppmem-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cppmem-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="cppmem-arrowhead"
              markerWidth="9"
              markerHeight="9"
              refX="7"
              refY="4.5"
              orient="auto"
            >
              <path d="M1,1 L8,4.5 L1,8 Z" className="cppmem-arrowfill" />
            </marker>
            <linearGradient id="cppmem-livegrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" className="cppmem-livestop-a" />
              <stop offset="100%" className="cppmem-livestop-b" />
            </linearGradient>
          </defs>

          {/* region frames */}
          <rect x={STACK_X} y={STACK_Y} width={STACK_W} height={STACK_H} rx={12} className="cppmem-region" />
          <rect x={HEAP_X} y={HEAP_Y} width={HEAP_W} height={HEAP_H} rx={12} className="cppmem-region" />

          <Layers size={13} x={STACK_X + 12} y={STACK_Y - 22} className="cppmem-region-icon" />
          <text x={STACK_X + 32} y={STACK_Y - 11} className="cppmem-region-label">stack &mdash; auto, pops at scope end</text>
          <Database size={13} x={HEAP_X + 12} y={HEAP_Y - 22} className="cppmem-region-icon" />
          <text x={HEAP_X + 32} y={HEAP_Y - 11} className="cppmem-region-label">heap &mdash; manual, new / delete</text>

          {/* ownership arrows */}
          {heap.map((b) => {
            if (b.state !== 'live' || b.owner == null || b.owner >= stack.length) return null;
            const fy = frameY(b.owner) + FRAME_H / 2;
            const bi = heap.indexOf(b);
            const by = BLOCK_TOP + bi * BLOCK_SLOT + BLOCK_H / 2;
            return (
              <path
                key={`own-${b.id}`}
                d={`M${FRAME_X + FRAME_W + 4},${fy} C${FRAME_X + FRAME_W + 70},${fy} ${BLOCK_X - 70},${by} ${BLOCK_X - 6},${by}`}
                className="cppmem-own"
                markerEnd="url(#cppmem-arrowhead)"
                fill="none"
              />
            );
          })}

          {/* stack frames */}
          {stack.map((f, i) => {
            const y = frameY(i);
            const isTop = i === stack.length - 1;
            return (
              <g key={`frame-${f.name}-${i}`} className={`cppmem-frame${isTop ? ' is-top' : ''}`}>
                <rect x={FRAME_X} y={y} width={FRAME_W} height={FRAME_H} rx={10} className="cppmem-frame-rect" />
                <text x={FRAME_X + 16} y={y + 24} className="cppmem-frame-name">{f.name}</text>
                <text x={FRAME_X + 16} y={y + 44} className="cppmem-frame-vars">{f.vars}</text>
                {f.ptr && (
                  <text x={FRAME_X + FRAME_W - 14} y={y + 36} className="cppmem-frame-ptr" textAnchor="end">
                    {f.ptr} &rarr;
                  </text>
                )}
              </g>
            );
          })}
          {stackDepth === 0 && (
            <text x={STACK_X + STACK_W / 2} y={STACK_BASE - 90} className="cppmem-empty" textAnchor="middle">
              (no frames yet)
            </text>
          )}

          {/* heap blocks */}
          {heap.map((b, i) => {
            const y = BLOCK_TOP + i * BLOCK_SLOT;
            return (
              <g key={`block-${b.id}`} className={`cppmem-block is-${b.state}`}>
                <rect x={BLOCK_X} y={y} width={BLOCK_W} height={BLOCK_H} rx={11} className="cppmem-block-rect" />
                <text x={BLOCK_X + 16} y={y + 26} className="cppmem-block-label">{b.label}</text>
                <text x={BLOCK_X + 16} y={y + 47} className="cppmem-block-tag">
                  {b.state === 'live' && 'owned'}
                  {b.state === 'leaked' && 'leaked — key lost'}
                  {b.state === 'freed' && 'freed — cleaned up'}
                </text>
                <g className="cppmem-block-badge">
                  {b.state === 'leaked' && <AlertTriangle size={15} x={BLOCK_X + BLOCK_W - 26} y={y + 12} />}
                  {b.state === 'freed' && <ShieldCheck size={15} x={BLOCK_X + BLOCK_W - 26} y={y + 12} />}
                </g>
              </g>
            );
          })}
          {heap.length === 0 && (
            <text x={HEAP_X + HEAP_W / 2} y={HEAP_Y + HEAP_H / 2} className="cppmem-empty" textAnchor="middle">
              (heap empty — no new yet)
            </text>
          )}
        </svg>
      </div>

      <div className="cppmem-controls">
        <button type="button" className="cppmem-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="cppmem-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="cppmem-speed">
          <span className="cppmem-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cppmem-speed-range"
          />
          <span className="cppmem-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="cppmem-progress">{step} / {total}</span>
        <code className="cppmem-curline">{codeLine}</code>
      </div>

      <div className="cppmem-readout">
        <div className="cppmem-stat is-depth">
          <Layers size={14} className="cppmem-stat-icon" />
          <span className="cppmem-stat-label">stack depth</span>
          <span className="cppmem-stat-val">{stackDepth}</span>
        </div>
        <div className="cppmem-stat is-live">
          <Database size={14} className="cppmem-stat-icon" />
          <span className="cppmem-stat-label">heap live</span>
          <span className="cppmem-stat-val">{liveCount}</span>
        </div>
        <div className={`cppmem-stat is-leak${leakedCount > 0 ? ' is-hot' : ''}`}>
          <AlertTriangle size={14} className="cppmem-stat-icon" />
          <span className="cppmem-stat-label">leaked</span>
          <span className="cppmem-stat-val">{leakedCount}</span>
        </div>
      </div>

      <div className={`cppmem-note${leakedCount > 0 ? ' is-warn' : ''}`}>
        <span className="cppmem-note-label">
          <ArrowRight size={12} /> now
        </span>
        <span className="cppmem-note-body">{noteText}</span>
      </div>
    </div>
  );
}
