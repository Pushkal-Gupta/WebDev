import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layers, Search, Play, Pause, SkipForward, RotateCcw, Check, X } from 'lucide-react';
import './PyScopeViz.css';

const SCOPES = [
  { key: 'L', label: 'Local — inner()', cls: 'is-local', names: ['i', 'temp'] },
  { key: 'E', label: 'Enclosing — outer()', cls: 'is-enclosing', names: ['factor'] },
  { key: 'G', label: 'Global — module', cls: 'is-global', names: ['total', 'data'] },
  { key: 'B', label: 'Built-in', cls: 'is-builtin', names: ['len', 'print'] },
];

const SCOPE_NAME = { L: 'Local', E: 'Enclosing', G: 'Global', B: 'Built-in' };

const LOOKUPS = ['i', 'factor', 'total', 'len', 'missing'];

function resolveAt(name) {
  for (let i = 0; i < SCOPES.length; i += 1) {
    if (SCOPES[i].names.includes(name)) return i;
  }
  return -1;
}

// Concentric nested rounded rects. Index 0 (Built-in ring) outermost; Local innermost.
const W = 620;
const H = 360;
const RINGS = [
  { x: 30, y: 24, w: 560, h: 312, scope: 3 },  // Built-in
  { x: 70, y: 70, w: 480, h: 220, scope: 2 },  // Global
  { x: 118, y: 116, w: 384, h: 128, scope: 1 }, // Enclosing
  { x: 176, y: 150, w: 268, h: 60, scope: 0 },  // Local
];

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PyScopeViz() {
  const [name, setName] = useState('factor');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const hitIdx = useMemo(() => resolveAt(name), [name]);
  // walk: one step per scope checked, stopping at hit (inclusive). total = scopes searched.
  const total = hitIdx === -1 ? SCOPES.length : hitIdx + 1;

  function pick(n) { setName(n); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), reduced() ? 320 : 820);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const checkedDepth = step; // number of scopes checked so far (0..total)
  const finished = step >= total;
  const resolved = finished && hitIdx !== -1;
  const failed = finished && hitIdx === -1;
  const showPause = playing && step < total;

  // status per scope index: 'miss' | 'hit' | 'pending' | 'cur'
  function scopeState(idx) {
    if (idx >= checkedDepth) return 'pending';
    if (idx === checkedDepth - 1) {
      if (idx === hitIdx) return 'hit';
      return checkedDepth === total ? 'miss' : 'cur';
    }
    return 'miss';
  }

  const curIdx = step > 0 ? step - 1 : -1;

  const noteText = (() => {
    if (step === 0) return `look up \`${name}\` — start in the innermost (Local) scope and walk outward`;
    const sc = SCOPES[curIdx];
    const found = curIdx === hitIdx;
    if (found) return `\`${name}\` found in ${SCOPE_NAME[sc.key]} scope — resolution stops here`;
    const next = SCOPES[curIdx + 1];
    if (next) return `\`${name}\` not in ${SCOPE_NAME[sc.key]} → walk outward to ${SCOPE_NAME[next.key]}...`;
    return `\`${name}\` not in ${SCOPE_NAME[sc.key]} — no scopes left to search`;
  })();

  const verdict = (() => {
    if (!finished) return `searching (${SCOPE_NAME[SCOPES[Math.max(0, curIdx)].key]})`;
    if (resolved) return `resolved in ${SCOPE_NAME[SCOPES[hitIdx].key]} scope`;
    return `NameError: name '${name}' is not defined`;
  })();

  return (
    <div className="pyscope">
      <div className="pyscope-head">
        <div className="pyscope-head-icon"><Layers size={18} /></div>
        <div className="pyscope-head-text">
          <h3 className="pyscope-title">LEGB — how Python resolves a name</h3>
          <p className="pyscope-sub">
            A name is looked up from the inside out: Local, then Enclosing, then Global, then Built-in.
            The first scope that defines it wins; reach the outside with no match and it&rsquo;s a NameError.
          </p>
        </div>
        <button type="button" className="pyscope-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="pyscope-chips">
        <span className="pyscope-chips-label"><Search size={12} /> look up</span>
        {LOOKUPS.map((n) => (
          <button
            key={n}
            type="button"
            className={`pyscope-chip${n === name ? ' is-active' : ''}`}
            onClick={() => pick(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="pyscope-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pyscope-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="pyscope-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="pyscope-arrow-head" />
            </marker>
          </defs>

          {RINGS.map((r) => {
            const sc = SCOPES[r.scope];
            const st = scopeState(r.scope);
            const cls = `pyscope-ring ${sc.cls} is-${st}`;
            const isHit = st === 'hit';
            const isMiss = st === 'miss';
            const isCur = st === 'cur' || st === 'hit';
            return (
              <g key={sc.key} className={cls}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={14} className="pyscope-ring-box" />
                <text x={r.x + 14} y={r.y + 20} className="pyscope-ring-label">
                  {sc.key} · {sc.label}
                </text>
                {/* names listed for this scope, placed at the top band of the ring */}
                <text x={r.x + r.w - 14} y={r.y + 20} className="pyscope-ring-names" textAnchor="end">
                  {sc.names.join('  ·  ')}
                </text>
                {/* status badge */}
                <g
                  className="pyscope-badge"
                  transform={`translate(${r.x + r.w - 26}, ${r.y + r.h - 22})`}
                  style={{ opacity: isCur || isMiss ? 1 : 0 }}
                >
                  <circle r={11} className="pyscope-badge-bg" />
                  {isHit
                    ? <Check x={-7} y={-7} size={14} className="pyscope-badge-icon" />
                    : <X x={-7} y={-7} size={14} className="pyscope-badge-icon" />}
                </g>
              </g>
            );
          })}

          {/* lookup pointer chip showing the name, sitting at the currently-checked ring center-left */}
          {step > 0 && (
            <g
              className={`pyscope-pointer${resolved ? ' is-hit' : ''}${failed ? ' is-fail' : ''}`}
              transform={`translate(${RINGS[3 - curIdx].x + 40}, ${RINGS[3 - curIdx].y + RINGS[3 - curIdx].h / 2})`}
            >
              <line x1={-30} y1={0} x2={-8} y2={0} className="pyscope-pointer-line" markerEnd="url(#pyscope-arrow)" />
              <rect x={-2} y={-13} width={64} height={26} rx={7} className="pyscope-pointer-box" />
              <text x={30} y={5} className="pyscope-pointer-text" textAnchor="middle">{name}</text>
            </g>
          )}
        </svg>
      </div>

      <div className="pyscope-controls">
        <button type="button" className="pyscope-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="pyscope-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <span className="pyscope-progress">{step} / {total} scopes searched</span>
      </div>

      <div className="pyscope-readout">
        <div className="pyscope-stat is-cur">
          <Search size={13} />
          <span className="pyscope-stat-label">searching</span>
          <span className="pyscope-stat-val">{step === 0 ? '—' : SCOPE_NAME[SCOPES[curIdx].key]}</span>
        </div>
        <div className={`pyscope-stat ${resolved ? 'is-hit' : failed ? 'is-fail' : 'is-idle'}`}>
          {resolved ? <Check size={13} /> : failed ? <X size={13} /> : <Search size={13} />}
          <span className="pyscope-stat-label">status</span>
          <span className="pyscope-stat-val">{!finished ? 'walking' : resolved ? 'found' : 'NameError'}</span>
        </div>
        <div className={`pyscope-stat ${failed ? 'is-fail' : 'is-verdict'}`}>
          <span className="pyscope-stat-label">verdict</span>
          <span className="pyscope-stat-val pyscope-verdict">{verdict}</span>
        </div>
      </div>

      <div className="pyscope-note">
        <span className="pyscope-note-label">now</span>
        <span className="pyscope-note-body">{noteText}</span>
      </div>
    </div>
  );
}
