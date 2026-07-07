import React, { useState, useEffect, useRef } from 'react';
import { Layers, Play, Pause, SkipForward, RotateCcw, Zap } from 'lucide-react';
import './ArchMemoryHierarchyViz.css';

// Vertical memory pyramid: narrow at top (registers), widest at bottom (disk).
// Each level carries a realistic size, latency in ns, and an approximate cost
// in "cycles" the access pays to reach it.
const LEVELS = [
  { id: 'reg',  name: 'Registers',      size: '~1 KB',   lat: '<1 ns',   cyc: 1,      hue: 'var(--hue-mint)' },
  { id: 'l1',   name: 'L1 cache',       size: '~32 KB',  lat: '~1 ns',   cyc: 4,      hue: 'var(--easy)' },
  { id: 'l2',   name: 'L2 cache',       size: '~256 KB', lat: '~4 ns',   cyc: 12,     hue: 'var(--hue-sky)' },
  { id: 'l3',   name: 'L3 cache',       size: '~8 MB',   lat: '~15 ns',  cyc: 40,     hue: 'var(--hue-violet)' },
  { id: 'ram',  name: 'Main memory',    size: '~16 GB',  lat: '~90 ns',  cyc: 200,    hue: 'var(--warning)' },
  { id: 'disk', name: 'Disk / SSD',     size: '~1 TB',   lat: '~100 µs', cyc: 100000, hue: 'var(--hard)' },
];

const IDX = LEVELS.reduce((m, l, i) => { m[l.id] = i; return m; }, {});

// Deterministic scenarios: the access descends level by level, missing until it
// hits at `hitAt`, then the value travels back up. Steps are generated from hitAt.
function buildSteps(hitAt) {
  const target = IDX[hitAt];
  const steps = [];
  steps.push({
    phase: 'start', level: -1,
    note: 'CPU issues a load. The access starts at the top of the hierarchy and descends until the data is found.',
  });
  for (let i = 0; i <= target; i += 1) {
    const L = LEVELS[i];
    if (i < target) {
      steps.push({
        phase: 'miss', level: i,
        note: `${L.name} MISS — the line is not here. Pay ${L.lat} (~${L.cyc} cycles) and descend one level.`,
      });
    } else {
      steps.push({
        phase: 'hit', level: i,
        note: `${L.name} HIT — data found. Latency is ${L.lat} (~${L.cyc.toLocaleString()} cycles). The value now travels back up.`,
      });
    }
  }
  steps.push({
    phase: 'return', level: target,
    note: `Value delivered to the registers. Total cost accumulated across every level touched: ${accum(target)} cycles.`,
  });
  return steps;
}

// Accumulated cost paid when the access had to descend through levels 0..target.
function accum(target) {
  let sum = 0;
  for (let i = 0; i <= target; i += 1) sum += LEVELS[i].cyc;
  return sum.toLocaleString();
}

const SCENARIOS = [
  { id: 'l1',   label: 'L1 hit' },
  { id: 'l3',   label: 'L3 hit' },
  { id: 'ram',  label: 'RAM hit' },
  { id: 'disk', label: 'Disk (page) hit' },
];

const W = 760;
const H = 300;

// Pyramid geometry: each level bar grows wider top-to-bottom.
const BAR_H = 38;
const GAP = 6;
const TOP_Y = 18;
const CX = 250;
const MIN_W = 150;
const MAX_W = 430;

function levelRect(i) {
  const t = LEVELS.length > 1 ? i / (LEVELS.length - 1) : 0;
  const w = MIN_W + (MAX_W - MIN_W) * t;
  const y = TOP_Y + i * (BAR_H + GAP);
  return { x: CX - w / 2, y, w, h: BAR_H };
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ArchMemoryHierarchyViz() {
  const [scen, setScen] = useState('l1');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const steps = buildSteps(scen);
  const total = steps.length;

  function pickScen(id) { setScen(id); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s2) => Math.min(total, s2 + 1)),
      Math.round((reduced() ? 340 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const revealed = steps.slice(0, step);
  const cur = step > 0 ? steps[step - 1] : null;
  const finished = step >= total;
  const showPause = playing && step < total;

  const target = IDX[scen];
  const curLevel = cur ? cur.level : -1;
  const phase = cur ? cur.phase : null;

  // Accumulated cost so far, based on the deepest level visited.
  let costSoFar = 0;
  let deepest = -1;
  revealed.forEach((r) => { if (r.level > deepest) deepest = r.level; });
  for (let i = 0; i <= deepest; i += 1) costSoFar += LEVELS[i].cyc;

  const hitReached = revealed.some((r) => r.phase === 'hit');
  const returned = revealed.some((r) => r.phase === 'return');

  function statusFor(i) {
    if (curLevel === i && phase === 'miss') return 'miss';
    if (curLevel === i && phase === 'hit') return 'hit';
    if (i === target && hitReached) return 'hit';
    if (i < deepest && !hitReached) return 'passed';
    if (i < target && hitReached) return 'passed';
    return 'idle';
  }

  return (
    <div className="archmh">
      <div className="archmh-head">
        <div className="archmh-head-icon"><Layers size={18} /></div>
        <div className="archmh-head-text">
          <h3 className="archmh-title">The memory hierarchy: closer is faster, smaller</h3>
          <p className="archmh-sub">
            Data lives in tiers. Registers are tiny and instant; disk is vast and glacial.
            A miss at one level drops the access to the next — and the latency bill grows
            the deeper it has to go.
          </p>
        </div>
        <button type="button" className="archmh-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="archmh-chips">
        {SCENARIOS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`archmh-chip${c.id === scen ? ' is-active' : ''}`}
            onClick={() => pickScen(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="archmh-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="archmh-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="archmh-ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" className="archmh-ah" />
            </marker>
          </defs>

          {/* descending / returning access arrow on the trunk between levels */}
          {LEVELS.map((L, i) => {
            if (i === 0) return null;
            const active = (phase === 'miss' && curLevel === i - 1)
              || (phase === 'hit' && curLevel === i && !returned);
            const r0 = levelRect(i - 1);
            const r1 = levelRect(i);
            return (
              <line
                key={`d-${L.id}`}
                x1={CX} y1={r0.y + r0.h}
                x2={CX} y2={r1.y}
                className={`archmh-flow${active ? ' is-on' : ''}`}
                markerEnd="url(#archmh-ah)"
              />
            );
          })}

          {/* return arrow up the left gutter once the value is found */}
          {returned && (
            <line
              x1={CX - MAX_W / 2 - 18}
              y1={levelRect(target).y + BAR_H / 2}
              x2={CX - MAX_W / 2 - 18}
              y2={levelRect(0).y + BAR_H / 2}
              className="archmh-return is-on"
              markerEnd="url(#archmh-ah)"
            />
          )}

          {/* level bars */}
          {LEVELS.map((L, i) => {
            const r = levelRect(i);
            const st = statusFor(i);
            return (
              <g key={L.id} className={`archmh-level is-${st}`} style={{ '--lvl-hue': L.hue }}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={7} className="archmh-bar" />
                <text x={r.x + 12} y={r.y + 16} className="archmh-name">{L.name}</text>
                <text x={r.x + 12} y={r.y + 30} className="archmh-size">{L.size}</text>
                <text x={r.x + r.w - 12} y={r.y + 16} textAnchor="end" className="archmh-lat">{L.lat}</text>
                <text x={r.x + r.w - 12} y={r.y + 30} textAnchor="end" className="archmh-cyc">
                  ~{L.cyc.toLocaleString()} cyc
                </text>
                {st === 'miss' && <text x={r.x + r.w / 2} y={r.y + 25} textAnchor="middle" className="archmh-badge is-miss">MISS</text>}
                {st === 'hit' && <text x={r.x + r.w / 2} y={r.y + 25} textAnchor="middle" className="archmh-badge is-hit">HIT</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="archmh-controls">
        <button type="button" className="archmh-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="archmh-btn" onClick={() => setStep((x) => Math.min(total, x + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="archmh-speed">
          <span className="archmh-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="archmh-speed-range"
          />
          <span className="archmh-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="archmh-progress">{step} / {total} steps</span>
      </div>

      <div className="archmh-readout">
        <div className={`archmh-stat ${hitReached ? 'is-good' : 'is-warn'}`}>
          <Zap size={13} />
          <span className="archmh-stat-label">found at</span>
          <span className="archmh-stat-val">{hitReached ? LEVELS[target].name : 'searching…'}</span>
        </div>
        <div className="archmh-stat is-lat">
          <span className="archmh-stat-label">hit latency</span>
          <span className="archmh-stat-val">{LEVELS[target].lat}</span>
        </div>
        <div className={`archmh-stat ${deepest >= IDX.ram ? 'is-bad' : 'is-cost'}`}>
          <span className="archmh-stat-label">cost so far</span>
          <span className="archmh-stat-val">{costSoFar.toLocaleString()} cyc</span>
        </div>
      </div>

      <div className="archmh-note">
        <span className="archmh-note-label">now</span>
        <span className="archmh-note-body">{cur ? cur.note : 'press Step or Play to issue a load and watch it descend the hierarchy'}</span>
      </div>
    </div>
  );
}
