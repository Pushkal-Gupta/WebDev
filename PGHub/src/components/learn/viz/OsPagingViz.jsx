import React, { useState, useEffect, useRef } from 'react';
import { MemoryStick, Play, Pause, SkipForward, RotateCcw, Zap, AlertTriangle } from 'lucide-react';
import './OsPagingViz.css';

const hx = (n) => `0x${n.toString(16).toUpperCase()}`;

// Three deterministic translation scenarios. Page size 4 KB => 12-bit offset.
const SCEN = {
  hit: {
    va: 0x1a2c8, vpn: 0x1a, offset: 0x2c8, frame: 0x07, pa: 0x072c8,
    steps: [
      { focus: 'va', note: 'Split the virtual address: high bits are the VPN (0x1A), low 12 bits the offset (0x2C8).' },
      { focus: 'tlb', result: 'hit', note: 'TLB lookup: VPN 0x1A is cached → TLB HIT, resolved in one cycle.' },
      { focus: 'pa', note: 'Frame 0x07 with offset 0x2C8 gives physical 0x072C8 — no page-table walk needed.' },
    ],
  },
  walk: {
    va: 0x2b040, vpn: 0x2b, offset: 0x040, frame: 0x0d, pa: 0x0d040,
    steps: [
      { focus: 'va', note: 'Split the virtual address into VPN (0x2B) and offset (0x040).' },
      { focus: 'tlb', result: 'miss', note: 'TLB lookup: VPN 0x2B is not cached → TLB MISS. Walk the page table.' },
      { focus: 'pt', result: 'present', note: 'Page-table entry for 0x2B: present = 1, frame 0x0D. Page is in RAM.' },
      { focus: 'tlb', result: 'fill', note: 'Install VPN 0x2B → frame 0x0D in the TLB so the next access is a hit.' },
      { focus: 'pa', note: 'Frame 0x0D with offset 0x040 gives physical 0x0D040.' },
    ],
  },
  fault: {
    va: 0x3c100, vpn: 0x3c, offset: 0x100, frame: 0x12, pa: 0x12100,
    steps: [
      { focus: 'va', note: 'Split the virtual address into VPN (0x3C) and offset (0x100).' },
      { focus: 'tlb', result: 'miss', note: 'TLB lookup: VPN 0x3C is not cached → TLB MISS. Walk the page table.' },
      { focus: 'pt', result: 'fault', note: 'Entry for 0x3C has present = 0 → PAGE FAULT. The page lives on disk, not in RAM.' },
      { focus: 'load', result: 'loaded', note: 'OS traps in, reads the page from disk into free frame 0x12, sets present = 1.' },
      { focus: 'tlb', result: 'fill', note: 'Install VPN 0x3C → frame 0x12 in the TLB, then restart the faulting instruction.' },
      { focus: 'pa', note: 'Frame 0x12 with offset 0x100 gives physical 0x12100.' },
    ],
  },
};

const SCENARIOS = [
  { id: 'hit', label: 'TLB hit' },
  { id: 'walk', label: 'Table walk' },
  { id: 'fault', label: 'Page fault' },
];

const W = 760;
const H = 232;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function OsPagingViz() {
  const [scen, setScen] = useState('hit');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const s = SCEN[scen];
  const steps = s.steps;
  const total = steps.length;

  function pickScen(id) { setScen(id); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s2) => Math.min(total, s2 + 1)), Math.round((reduced() ? 340 : 900) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const revealed = steps.slice(0, step);
  const cur = step > 0 ? steps[step - 1] : null;
  const focus = cur ? cur.focus : null;
  const finished = step >= total;
  const showPause = playing && step < total;

  const tlbResult = cur && cur.focus === 'tlb' ? cur.result : null;
  const pageFaulted = revealed.some((x) => x.result === 'fault');
  const pageLoaded = revealed.some((x) => x.result === 'loaded');
  const tlbInstalled = revealed.some((x) => x.result === 'fill');
  const paShown = revealed.some((x) => x.focus === 'pa');

  const ptPresent = scen === 'fault' ? (pageLoaded ? 1 : 0) : 1;
  const ptFrame = scen === 'fault' ? (pageLoaded ? hx(s.frame) : 'disk') : hx(s.frame);

  // static panel geometry
  const tlbRows = [
    { vpn: '0x1A', frame: '0x07', self: scen === 'hit' },
    { vpn: hx(s.vpn), frame: hx(s.frame), self: true, dynamic: scen !== 'hit' },
  ];

  return (
    <div className="ospg">
      <div className="ospg-head">
        <div className="ospg-head-icon"><MemoryStick size={18} /></div>
        <div className="ospg-head-text">
          <h3 className="ospg-title">Virtual to physical: the address walk</h3>
          <p className="ospg-sub">
            A virtual address splits into a page number and an offset. The TLB caches hot
            translations; a miss walks the page table; a missing page faults in from disk.
          </p>
        </div>
        <button type="button" className="ospg-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="ospg-chips">
        {SCENARIOS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`ospg-chip${c.id === scen ? ' is-active' : ''}`}
            onClick={() => pickScen(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="ospg-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ospg-svg" preserveAspectRatio="xMidYMid meet">
          {/* arrows */}
          <line x1={196} y1={116} x2={266} y2={70} className={`ospg-arrow${focus === 'tlb' ? ' is-on' : ''}`} markerEnd="url(#ospg-ah)" />
          <line x1={196} y1={132} x2={266} y2={170} className={`ospg-arrow${focus === 'pt' || focus === 'load' ? ' is-on' : ''}`} markerEnd="url(#ospg-ah)" />
          <line x1={500} y1={124} x2={576} y2={124} className={`ospg-arrow${focus === 'pa' ? ' is-on' : ''}`} markerEnd="url(#ospg-ah)" />
          <defs>
            <marker id="ospg-ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" className="ospg-ah" />
            </marker>
          </defs>

          {/* virtual address box */}
          <g className={`ospg-vabox${focus === 'va' ? ' is-on' : ''}`}>
            <text x={36} y={86} className="ospg-cap">virtual address</text>
            <rect x={28} y={94} width={86} height={56} rx={7} className="ospg-cell ospg-vpn" />
            <rect x={114} y={94} width={66} height={56} rx={7} className="ospg-cell ospg-off" />
            <text x={71} y={114} className="ospg-cell-k" textAnchor="middle">VPN</text>
            <text x={71} y={134} className="ospg-cell-v" textAnchor="middle">{hx(s.vpn)}</text>
            <text x={147} y={114} className="ospg-cell-k" textAnchor="middle">offset</text>
            <text x={147} y={134} className="ospg-cell-v" textAnchor="middle">{hx(s.offset)}</text>
          </g>

          {/* TLB panel */}
          <g className={`ospg-panel${focus === 'tlb' ? ' is-on' : ''}`}>
            <rect x={272} y={28} width={222} height={64} rx={9} className="ospg-panel-box" />
            <text x={282} y={44} className="ospg-panel-title">TLB (cache)</text>
            {tlbRows.map((r, i) => {
              const visible = !r.dynamic || tlbInstalled;
              const active = r.self && focus === 'tlb';
              return (
                <g key={i} className={`ospg-row${visible ? '' : ' is-faded'}${active ? ' is-active' : ''}`}>
                  <text x={284} y={62 + i * 18} className="ospg-row-t">{r.vpn} → {visible ? r.frame : '—'}</text>
                </g>
              );
            })}
            {tlbResult && (
              <text x={486} y={44} textAnchor="end" className={`ospg-badge ${tlbResult === 'hit' ? 'is-hit' : tlbResult === 'fill' ? 'is-fill' : 'is-miss'}`}>
                {tlbResult === 'hit' ? 'HIT' : tlbResult === 'fill' ? 'INSTALLED' : 'MISS'}
              </text>
            )}
          </g>

          {/* page table panel */}
          <g className={`ospg-panel${focus === 'pt' || focus === 'load' ? ' is-on' : ''}`}>
            <rect x={272} y={124} width={222} height={84} rx={9} className="ospg-panel-box" />
            <text x={282} y={140} className="ospg-panel-title">page table</text>
            <text x={284} y={158} className="ospg-row-t">0x1A → 0x07 · present</text>
            <text x={284} y={176} className="ospg-row-t">0x2B → 0x0D · present</text>
            <g className={focus === 'pt' || focus === 'load' ? 'ospg-row is-active' : 'ospg-row'}>
              <text x={284} y={194} className={`ospg-row-t${pageFaulted && !pageLoaded ? ' is-fault' : ''}`}>
                {hx(s.vpn)} → {ptFrame} · present {ptPresent}
              </text>
            </g>
            {pageFaulted && !pageLoaded && (
              <text x={486} y={140} textAnchor="end" className="ospg-badge is-fault"><tspan>FAULT</tspan></text>
            )}
          </g>

          {/* physical address box */}
          <g className={`ospg-pabox${paShown ? ' is-on' : ''}`}>
            <text x={584} y={86} className="ospg-cap">physical address</text>
            <rect x={580} y={94} width={86} height={56} rx={7} className="ospg-cell ospg-pfn" />
            <rect x={666} y={94} width={66} height={56} rx={7} className="ospg-cell ospg-off" />
            <text x={623} y={114} className="ospg-cell-k" textAnchor="middle">frame</text>
            <text x={623} y={134} className="ospg-cell-v" textAnchor="middle">{paShown ? hx(s.frame) : '?'}</text>
            <text x={699} y={114} className="ospg-cell-k" textAnchor="middle">offset</text>
            <text x={699} y={134} className="ospg-cell-v" textAnchor="middle">{hx(s.offset)}</text>
          </g>

          {/* disk (page fault load) */}
          <g className={`ospg-disk${focus === 'load' ? ' is-on' : ''}`}>
            <rect x={350} y={216} width={64} height={14} rx={4} className="ospg-disk-box" />
            <text x={382} y={226} textAnchor="middle" className="ospg-disk-t">disk</text>
            {focus === 'load' && <line x1={382} y1={216} x2={382} y2={208} className="ospg-arrow is-on" markerEnd="url(#ospg-ah)" />}
          </g>
        </svg>
      </div>

      <div className="ospg-controls">
        <button type="button" className="ospg-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="ospg-btn" onClick={() => setStep((x) => Math.min(total, x + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="ospg-speed">
          <span className="ospg-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="ospg-speed-range"
          />
          <span className="ospg-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="ospg-progress">{step} / {total} steps</span>
      </div>

      <div className="ospg-readout">
        <div className={`ospg-stat ${scen === 'hit' ? 'is-good' : 'is-warn'}`}>
          <Zap size={13} />
          <span className="ospg-stat-label">TLB</span>
          <span className="ospg-stat-val">{scen === 'hit' ? 'hit' : 'miss → walk'}</span>
        </div>
        <div className={`ospg-stat ${scen === 'fault' ? 'is-bad' : 'is-good'}`}>
          <AlertTriangle size={13} />
          <span className="ospg-stat-label">page</span>
          <span className="ospg-stat-val">{scen === 'fault' ? (pageLoaded ? 'faulted → loaded' : 'on disk') : 'resident'}</span>
        </div>
        <div className="ospg-stat is-pa">
          <span className="ospg-stat-label">physical</span>
          <span className="ospg-stat-val">{paShown ? hx(s.pa) : '—'}</span>
        </div>
      </div>

      <div className="ospg-note">
        <span className="ospg-note-label">now</span>
        <span className="ospg-note-body">{cur ? cur.note : 'press Step or Play to translate the address'}</span>
      </div>
    </div>
  );
}
