import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Package, Download, Database, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import './PyImportViz.css';

const MODULE_NAMES = ['pi', 'sqrt', 'floor'];

const IMPORT_STEPS = [
  {
    op: 'import math',
    binds: [{ name: 'math', kind: 'module' }],
    pulled: ['math'],
    moduleGlow: [],
    access: 'math.sqrt(144)',
    cache: ['math'],
    cacheHit: false,
    fresh: true,
    note: 'Python finds math, runs it once, and files it in sys.modules. Just ONE name — `math` — is bound here; the whole drawer of tools sits behind that single label.',
  },
  {
    op: 'math.sqrt(144)',
    binds: [{ name: 'math', kind: 'module' }],
    pulled: [],
    moduleGlow: ['sqrt'],
    access: 'math.sqrt(144)  ->  12.0',
    cache: ['math'],
    cacheHit: false,
    fresh: false,
    note: 'Only `math` lives in your namespace, so every tool is reached through the dotted name: math.sqrt, math.pi, math.floor. No collisions, a little more typing.',
  },
];

const FROM_STEPS = [
  {
    op: 'from math import sqrt, pi',
    binds: [{ name: 'sqrt', kind: 'name' }, { name: 'pi', kind: 'name' }],
    pulled: ['sqrt', 'pi'],
    moduleGlow: ['sqrt', 'pi'],
    access: 'sqrt(144)   pi',
    cache: ['math'],
    cacheHit: false,
    fresh: true,
    note: 'The names sqrt and pi are copied straight into your namespace. The module still ran and is cached, but the name `math` itself is NOT bound — only the two names you asked for.',
  },
  {
    op: 'sqrt(144)',
    binds: [{ name: 'sqrt', kind: 'name' }, { name: 'pi', kind: 'name' }],
    pulled: [],
    moduleGlow: [],
    access: 'sqrt(144)  ->  12.0',
    cache: ['math'],
    cacheHit: false,
    fresh: false,
    note: 'Because sqrt is bound directly, you call it with no prefix. Cleaner call sites — but if another name `sqrt` exists, one silently shadows the other.',
  },
];

const CACHE_STEPS = [
  {
    op: 'import math   # 1st time',
    binds: [{ name: 'math', kind: 'module' }],
    pulled: ['math'],
    moduleGlow: [],
    access: 'module body runs once',
    cache: ['math'],
    cacheHit: false,
    fresh: true,
    note: 'First import: the module file executes top to bottom, and the resulting object is stored in sys.modules under the key "math".',
  },
  {
    op: 'import math   # again',
    binds: [{ name: 'math', kind: 'module' }],
    pulled: [],
    moduleGlow: [],
    access: 'cache hit — body NOT re-run',
    cache: ['math'],
    cacheHit: true,
    fresh: false,
    note: 'Second import: Python finds "math" already in sys.modules and skips re-running the file. You get the very same object back — module-level code runs exactly once.',
  },
];

const MODES = [
  { id: 'import', label: 'import math', Icon: Package, prop: 'binds the module · use math.name', steps: IMPORT_STEPS },
  { id: 'from', label: 'from import', Icon: Download, prop: 'binds names directly · no prefix', steps: FROM_STEPS },
  { id: 'cache', label: 'sys.modules', Icon: Database, prop: 'runs once · re-import = cache hit', steps: CACHE_STEPS },
];

const W = 760;
const H = 300;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pillWidth(txt) {
  return Math.max(46, txt.length * 8.6 + 22);
}

function layoutPills(names, boxX, boxW) {
  const gap = 10;
  const widths = names.map(pillWidth);
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, names.length - 1);
  let x = boxX + (boxW - total) / 2;
  return names.map((n, i) => {
    const out = { x, w: widths[i] };
    x += widths[i] + gap;
    return out;
  });
}

export default function PyImportViz() {
  const [modeId, setModeId] = useState('import');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const active = useMemo(() => MODES.find((m) => m.id === modeId), [modeId]);
  const steps = active.steps;
  const total = steps.length;
  const cur = steps[Math.min(step, total - 1)];
  const finished = step >= total - 1;
  const ActiveIcon = active.Icon;

  function pickMode(id) {
    setModeId(id);
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
    }, reduced() ? 560 : 1200);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const bindsStr = useMemo(
    () => cur.binds.map((b) => b.name).join(', ') || '(none)',
    [cur],
  );

  // module box
  const modX = 60;
  const modY = 46;
  const modW = 320;
  const modH = 104;
  const modPills = layoutPills(MODULE_NAMES, modX, modW);

  // namespace box
  const nsX = 60;
  const nsY = 200;
  const nsW = 320;
  const nsH = 82;
  const nsNames = cur.binds.map((b) => b.name);
  const nsPills = layoutPills(nsNames, nsX, nsW);

  // cache box
  const cacheX = 432;
  const cacheY = 46;
  const cacheW = 268;
  const cacheH = 104;
  const cachePills = layoutPills(cur.cache.map((c) => `'${c}'`), cacheX, cacheW);

  const trunkX = modX + modW / 2;
  const arrowTop = modY + modH;
  const arrowBot = nsY;

  return (
    <div className={`pyimp is-${modeId}`}>
      <div className="pyimp-head">
        <div className="pyimp-head-icon"><ActiveIcon size={18} /></div>
        <div className="pyimp-head-text">
          <h3 className="pyimp-title">import — pulling names from a module into your namespace</h3>
          <p className="pyimp-sub">
            Pick an import style and step through what lands in your namespace, plus the sys.modules cache that runs each module once.
          </p>
        </div>
      </div>

      <div className="pyimp-chips">
        <span className="pyimp-chips-label">style</span>
        {MODES.map((m) => {
          const ChipIcon = m.Icon;
          return (
            <button
              key={m.id}
              type="button"
              className={`pyimp-chip is-${m.id}${m.id === modeId ? ' is-active' : ''}`}
              onClick={() => pickMode(m.id)}
            >
              <ChipIcon size={14} /> {m.label}
            </button>
          );
        })}
      </div>

      <div className="pyimp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pyimp-svg" preserveAspectRatio="xMidYMid meet">
          {/* module file box */}
          <rect x={modX} y={modY} width={modW} height={modH} rx={12} className="pyimp-modbox" />
          <text x={modX + 16} y={modY + 24} className="pyimp-box-title">math.py</text>
          <text x={modX + modW - 16} y={modY + 24} className="pyimp-box-tag" textAnchor="end">module file</text>
          {MODULE_NAMES.map((name, i) => {
            const p = modPills[i];
            const glow = cur.moduleGlow.includes(name) && step > 0
              ? ' is-glow'
              : (cur.pulled.includes(name) ? ' is-glow' : '');
            return (
              <g key={name} className={`pyimp-pill is-mod${glow}`}>
                <rect x={p.x} y={modY + 50} width={p.w} height={34} rx={8} className="pyimp-pill-box" />
                <text x={p.x + p.w / 2} y={modY + 72} className="pyimp-pill-txt" textAnchor="middle">{name}</text>
              </g>
            );
          })}

          {/* downward trunk: module -> namespace (vertical flow) */}
          <line x1={trunkX} y1={arrowTop} x2={trunkX} y2={arrowBot - 6} className="pyimp-trunk" />
          <polygon
            points={`${trunkX - 6},${arrowBot - 12} ${trunkX + 6},${arrowBot - 12} ${trunkX},${arrowBot - 2}`}
            className="pyimp-trunk-head"
          />
          <text x={trunkX + 14} y={(arrowTop + arrowBot) / 2 + 4} className="pyimp-trunk-label">{active.label}</text>

          {/* namespace box */}
          <rect x={nsX} y={nsY} width={nsW} height={nsH} rx={12} className="pyimp-nsbox" />
          <text x={nsX + 16} y={nsY + 24} className="pyimp-box-title">namespace</text>
          <text x={nsX + nsW - 16} y={nsY + 24} className="pyimp-box-tag" textAnchor="end">__main__</text>
          {nsNames.length === 0 && (
            <text x={nsX + nsW / 2} y={nsY + 56} className="pyimp-empty" textAnchor="middle">(nothing bound yet)</text>
          )}
          {cur.binds.map((b, i) => {
            const p = nsPills[i];
            const glow = cur.pulled.includes(b.name) ? ' is-glow' : '';
            return (
              <g key={b.name} className={`pyimp-pill is-${b.kind}${glow}`}>
                <rect x={p.x} y={nsY + 42} width={p.w} height={30} rx={8} className="pyimp-pill-box" />
                <text x={p.x + p.w / 2} y={nsY + 62} className="pyimp-pill-txt" textAnchor="middle">{b.name}</text>
              </g>
            );
          })}

          {/* sys.modules cache box (side annotation) */}
          <rect x={cacheX} y={cacheY} width={cacheW} height={cacheH} rx={12}
            className={`pyimp-cachebox${cur.cacheHit ? ' is-hit' : ''}`} />
          <text x={cacheX + 16} y={cacheY + 24} className="pyimp-box-title">sys.modules</text>
          <text x={cacheX + cacheW - 16} y={cacheY + 24} className="pyimp-box-tag" textAnchor="end">cache</text>
          {cur.cache.map((name, i) => {
            const p = cachePills[i];
            const glow = cur.fresh ? ' is-glow' : (cur.cacheHit ? ' is-hit' : '');
            return (
              <g key={name} className={`pyimp-pill is-cache${glow}`}>
                <rect x={p.x} y={cacheY + 46} width={p.w} height={30} rx={8} className="pyimp-pill-box" />
                <text x={p.x + p.w / 2} y={cacheY + 66} className="pyimp-pill-txt" textAnchor="middle">&apos;{name}&apos;</text>
              </g>
            );
          })}
          <text x={cacheX + cacheW / 2} y={cacheY + cacheH - 8} className="pyimp-cache-status" textAnchor="middle">
            {cur.cacheHit ? 'cache hit — not re-run' : (cur.fresh ? 'module body ran once' : 'cached')}
          </text>
        </svg>
      </div>

      <div className="pyimp-controls">
        <button type="button" className="pyimp-btn" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="pyimp-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <button
          type="button"
          className="pyimp-btn"
          onClick={() => { setStep(0); setPlaying(false); }}
        >
          <RotateCcw size={14} /> Reset
        </button>
        <span className="pyimp-progress">{step + 1} / {total} steps</span>
      </div>

      <div className="pyimp-readout">
        <div className={`pyimp-stat is-${modeId}`}>
          <ActiveIcon size={13} />
          <span className="pyimp-stat-label">statement</span>
          <span className="pyimp-stat-val">{cur.op}</span>
        </div>
        <div className={`pyimp-stat is-${modeId}`}>
          <span className="pyimp-stat-label">binds in namespace</span>
          <span className="pyimp-stat-val">{bindsStr}</span>
        </div>
        <div className={`pyimp-stat is-${modeId}`}>
          <span className="pyimp-stat-label">access</span>
          <span className="pyimp-stat-val">{cur.access}</span>
        </div>
      </div>

      <div className="pyimp-note">
        <span className="pyimp-note-label">now</span>
        <span className="pyimp-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
