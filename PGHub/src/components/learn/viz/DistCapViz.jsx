import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Network, Play, Pause, SkipForward, RotateCcw, Gauge, Scissors, ShieldCheck, Zap } from 'lucide-react';
import './DistCapViz.css';

// Three replicas on a ring; a partition cuts n3 off from n1/n2. A write lands on
// the majority side; a client reads from the minority side. CP mode makes the
// minority refuse (consistent, unavailable); AP mode serves stale (available,
// inconsistent). Every value is a fixed constant -- no randomness anywhere.
const NODES = [
  { id: 'n1', x: 130, y: 96, side: 'majority' },
  { id: 'n2', x: 250, y: 96, side: 'majority' },
  { id: 'n3', x: 190, y: 214, side: 'minority' },
];

// Steps are resting states of the scenario, narrated top to bottom.
const STEPS = [
  {
    key: 'healthy', partition: false, write: null, read: null,
    values: { n1: 1, n2: 1, n3: 1 },
    caption: 'All three replicas agree: x = 1. The network links are healthy.',
  },
  {
    key: 'cut', partition: true, write: null, read: null,
    values: { n1: 1, n2: 1, n3: 1 },
    caption: 'A partition cuts n3 off from n1 and n2. No messages cross the gap.',
  },
  {
    key: 'write', partition: true, write: 'n1', read: null,
    values: { n1: 2, n2: 2, n3: 1 },
    caption: 'A write sets x = 2 on the majority side (n1, n2). n3 never hears it.',
  },
  {
    key: 'read', partition: true, write: null, read: 'n3',
    values: { n1: 2, n2: 2, n3: 1 },
    caption: 'A client reads from n3 on the minority side. What should n3 do?',
  },
  {
    key: 'decide', partition: true, write: null, read: 'n3', decide: true,
    values: { n1: 2, n2: 2, n3: 1 },
    caption: 'The CAP choice: refuse to answer (CP, consistent) or serve x = 1 (AP, stale).',
  },
];

const W = 380;
const H = 300;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DistCapViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState('CP');
  const timer = useRef(null);

  const total = STEPS.length - 1;
  const safeStep = Math.min(step, total);
  const cur = STEPS[safeStep];

  const outcome = useMemo(() => {
    if (!cur.decide) return null;
    if (mode === 'CP') {
      return { kind: 'cp', text: 'n3 refuses the read — it cannot confirm the latest write. Consistent, but unavailable.' };
    }
    return { kind: 'ap', text: 'n3 returns the stale x = 1 — it always answers. Available, but inconsistent.' };
  }, [cur, mode]);

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function reset() { setStep(0); setPlaying(false); }
  function toggleMode() { setMode((m) => (m === 'CP' ? 'AP' : 'CP')); }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 380 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const clientSees = mode === 'CP'
    ? (cur.decide ? 'error (refused)' : '—')
    : (safeStep >= 3 ? 'x = 1 (stale)' : '—');

  return (
    <div className="dcap">
      <div className="dcap-head">
        <div className="dcap-head-icon"><Network size={18} /></div>
        <div className="dcap-head-text">
          <h3 className="dcap-title">A partition forces the CAP choice</h3>
          <p className="dcap-sub">
            Cut the link and a write on the majority side never reaches n3. When a client reads n3,
            the system must pick: refuse to stay consistent (CP) or answer stale to stay available (AP).
          </p>
        </div>
        <button type="button" className="dcap-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dcap-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dcap-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dcap-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="dcap-arrow-head" />
            </marker>
            <filter id="dcap-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* links between nodes; the n1-n3 / n2-n3 links get cut on partition */}
          <line x1={NODES[0].x} y1={NODES[0].y} x2={NODES[1].x} y2={NODES[1].y} className="dcap-link" />
          <line
            x1={NODES[0].x} y1={NODES[0].y} x2={NODES[2].x} y2={NODES[2].y}
            className={`dcap-link${cur.partition ? ' is-cut' : ''}`}
          />
          <line
            x1={NODES[1].x} y1={NODES[1].y} x2={NODES[2].x} y2={NODES[2].y}
            className={`dcap-link${cur.partition ? ' is-cut' : ''}`}
          />

          {/* partition marker (scissors gap) */}
          {cur.partition && (
            <g className="dcap-partition">
              <line x1={90} y1={168} x2={300} y2={168} className="dcap-cut-line" />
              <g transform="translate(185, 156)"><Scissors size={20} className="dcap-scissors" /></g>
            </g>
          )}

          {/* nodes */}
          {NODES.map((nd) => {
            const isWrite = cur.write === nd.id;
            const isRead = cur.read === nd.id;
            const refused = cur.decide && mode === 'CP' && nd.id === 'n3';
            const stale = safeStep >= 3 && nd.id === 'n3';
            return (
              <g key={nd.id} className={`dcap-node is-${nd.side}${isWrite ? ' is-write' : ''}${isRead ? ' is-read' : ''}${refused ? ' is-refused' : ''}`}>
                <circle cx={nd.x} cy={nd.y} r={30} className="dcap-node-circle" filter={isWrite || isRead ? 'url(#dcap-glow)' : undefined} />
                <text x={nd.x} y={nd.y - 4} className="dcap-node-id" textAnchor="middle">{nd.id}</text>
                <text x={nd.x} y={nd.y + 13} className={`dcap-node-val${stale ? ' is-stale' : ''}`} textAnchor="middle">
                  x={cur.values[nd.id]}
                </text>
              </g>
            );
          })}

          {/* write arrow into n1 */}
          {cur.write && (
            <line x1={40} y1={60} x2={NODES[0].x - 26} y2={NODES[0].y - 12} className="dcap-op dcap-op-write" markerEnd="url(#dcap-arrow)" />
          )}
          {cur.write && <text x={40} y={50} className="dcap-op-label">write x=2</text>}

          {/* read arrow into n3 */}
          {cur.read && (
            <line x1={330} y1={258} x2={NODES[2].x + 24} y2={NODES[2].y + 14} className="dcap-op dcap-op-read" markerEnd="url(#dcap-arrow)" />
          )}
          {cur.read && <text x={300} y={276} className="dcap-op-label" textAnchor="end">read x?</text>}
        </svg>
      </div>

      <div className="dcap-controls">
        <button type="button" className="dcap-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="dcap-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className={`dcap-btn dcap-mode is-${mode.toLowerCase()}`} onClick={toggleMode}>
          {mode === 'CP' ? <ShieldCheck size={14} /> : <Zap size={14} />} {mode === 'CP' ? 'CP (consistent)' : 'AP (available)'}
        </button>
        <label className="dcap-speed">
          <Gauge size={13} />
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="dcap-speed-range" />
          <span className="dcap-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="dcap-progress">{safeStep} / {total}</span>
      </div>

      <div className="dcap-readout">
        <div className="dcap-stat is-mode">
          <span className="dcap-stat-label">mode</span>
          <span className="dcap-stat-val">{mode}</span>
        </div>
        <div className="dcap-stat is-net">
          <span className="dcap-stat-label">network</span>
          <span className="dcap-stat-val">{cur.partition ? 'partitioned' : 'healthy'}</span>
        </div>
        <div className="dcap-stat is-client">
          <span className="dcap-stat-label">client reads</span>
          <span className="dcap-stat-val">{clientSees}</span>
        </div>
      </div>

      <div className={`dcap-note${outcome ? ` is-${outcome.kind}` : ''}`}>
        <span className="dcap-note-label">now</span>
        <span className="dcap-note-body">{outcome ? outcome.text : cur.caption}</span>
      </div>
    </div>
  );
}
