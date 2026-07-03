import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layers, Play, Pause, SkipForward, RotateCcw, ArrowDown, ArrowUp, Cable } from 'lucide-react';
import './NetEncapsulationViz.css';

// Five-layer TCP/IP stack, top -> bottom. Deterministic; no randomness anywhere.
const STACK = [
  { key: 'app', name: 'Application', pdu: 'data', cls: 'is-app' },
  { key: 'transport', name: 'Transport', pdu: 'segment', cls: 'is-transport' },
  { key: 'network', name: 'Network', pdu: 'datagram', cls: 'is-network' },
  { key: 'link', name: 'Link', pdu: 'frame', cls: 'is-link' },
  { key: 'physical', name: 'Physical', pdu: 'bits', cls: 'is-physical' },
];

// Header byte costs (illustrative, fixed).
const BYTES = { DATA: 16, Th: 20, Nh: 20, Lh: 14, Lt: 4 };
const segClass = { Th: 'is-transport-seg', Nh: 'is-network-seg', Lh: 'is-link-seg', Lt: 'is-link-seg', DATA: 'is-app-seg' };

function bytesOf(headers, payload, trailer) {
  let b = payload ? BYTES.DATA : 0;
  headers.forEach((h) => { b += BYTES[h]; });
  if (trailer) b += BYTES.Lt;
  return b;
}

// Each step is a resting state of the message somewhere in the journey.
function buildSteps() {
  const mk = (side, layer, headers, payload, trailer, bits, dir, action) => ({
    side, layer, headers, payload, trailer, bits, dir, action,
    pdu: STACK[layer].pdu,
    bytes: bits ? bytesOf(['Lh', 'Nh', 'Th'], true, true) : bytesOf(headers, payload, trailer),
    hcount: headers.length + (trailer ? 1 : 0),
  });
  return [
    mk('sender', 0, [], true, false, false, 'down', 'Application produces the message as raw data.'),
    mk('sender', 1, ['Th'], true, false, false, 'down', 'Transport prepends ports + checksum: the data is now a segment.'),
    mk('sender', 2, ['Nh', 'Th'], true, false, false, 'down', 'Network prepends source / destination IP: a datagram.'),
    mk('sender', 3, ['Lh', 'Nh', 'Th'], true, true, false, 'down', 'Link adds a MAC header and a CRC trailer: a frame.'),
    mk('sender', 4, ['Lh', 'Nh', 'Th'], true, true, true, 'down', 'Physical encodes the whole frame as a signal: bits.'),
    mk('wire', 4, ['Lh', 'Nh', 'Th'], true, true, true, 'wire', 'Bits travel the medium; routers forward on the datagram header.'),
    mk('receiver', 4, ['Lh', 'Nh', 'Th'], true, true, true, 'up', 'Receiver recovers the frame bits off the wire.'),
    mk('receiver', 3, ['Lh', 'Nh', 'Th'], true, true, false, 'up', 'Link verifies the CRC, then strips its frame header + trailer.'),
    mk('receiver', 2, ['Nh', 'Th'], true, false, false, 'up', 'Network strips the IP header, exposing the segment.'),
    mk('receiver', 1, ['Th'], true, false, false, 'up', 'Transport checks the checksum, strips its header.'),
    mk('receiver', 0, [], true, false, false, 'up', 'Application receives the original message, unchanged.'),
  ];
}

const STEPS = buildSteps();
const BITS = '10110100 01101110 01010011 10110100 01001011 10100110';

// Geometry
const W = 720;
const H = 392;
const ROW_X = 24;
const ROW_W = 158;
const PITCH = 70;
const ROW_TOP = 18;
const ROW_H = 50;
const PDU_CX = 460; // center of the PDU drawing region
const WIRE_Y = ROW_TOP + 4 * PITCH + ROW_H + 18;

const rowTop = (i) => ROW_TOP + i * PITCH;
const rowMid = (i) => rowTop(i) + ROW_H / 2;

function segWidth(label) {
  if (label === 'DATA') return 122;
  if (label === 'Lt') return 42;
  return 58;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function NetEncapsulationViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);
  const total = STEPS.length - 1;

  const cur = STEPS[step];

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), Math.round((reduced() ? 360 : 900) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  // Build the composite bar segments (outermost header first ... payload ... trailer).
  const segments = useMemo(() => {
    const segs = cur.headers.map((h) => ({ label: h, w: segWidth(h) }));
    if (cur.payload) segs.push({ label: 'DATA', w: segWidth('DATA') });
    if (cur.trailer) segs.push({ label: 'Lt', w: segWidth('Lt') });
    return segs;
  }, [cur]);

  const totalW = segments.reduce((s, x) => s + x.w, 0);
  const barY = cur.side === 'wire' ? WIRE_Y - 22 : rowMid(cur.layer) - 21;
  const startX = PDU_CX - totalW / 2;

  const phase = cur.dir === 'down' ? 'Encapsulating'
    : cur.dir === 'up' ? 'Decapsulating' : 'On the wire';
  const PhaseIcon = cur.dir === 'down' ? ArrowDown : cur.dir === 'up' ? ArrowUp : Cable;

  return (
    <div className="neten">
      <div className="neten-head">
        <div className="neten-head-icon"><Layers size={18} /></div>
        <div className="neten-head-text">
          <h3 className="neten-title">Encapsulation: wrapping the message</h3>
          <p className="neten-sub">
            A message descends the stack, each layer prepending a header &mdash; then ascends at the
            receiver, each peer layer stripping exactly its own header back off.
          </p>
        </div>
        <button type="button" className="neten-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="neten-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="neten-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="neten-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="neten-arrow-head" />
            </marker>
          </defs>

          {/* layer rows */}
          {STACK.map((L, i) => {
            const active = cur.side !== 'wire' && cur.layer === i;
            return (
              <g key={L.key} className={`neten-row ${L.cls}${active ? ' is-active' : ''}`}>
                <rect x={ROW_X} y={rowTop(i)} width={ROW_W} height={ROW_H} rx={9} className="neten-row-box" />
                <text x={ROW_X + 14} y={rowTop(i) + 21} className="neten-row-name">{L.name}</text>
                <text x={ROW_X + 14} y={rowTop(i) + 38} className="neten-row-pdu">PDU: {L.pdu}</text>
              </g>
            );
          })}

          {/* direction arrow in the gutter between rows and PDU region */}
          {cur.side !== 'wire' && cur.layer < 4 && (
            <line
              x1={ROW_X + ROW_W + 16}
              x2={ROW_X + ROW_W + 16}
              y1={cur.dir === 'down' ? rowMid(cur.layer) - 16 : rowMid(cur.layer) + 16}
              y2={cur.dir === 'down' ? rowMid(cur.layer) + 16 : rowMid(cur.layer) - 16}
              className="neten-dir"
              markerEnd="url(#neten-arrow)"
            />
          )}

          {/* the wire */}
          <line x1={ROW_X} y1={WIRE_Y} x2={W - 24} y2={WIRE_Y} className={`neten-wire${cur.side === 'wire' ? ' is-hot' : ''}`} />
          <rect x={W / 2 - 96} y={WIRE_Y - 8} width={26} height={16} rx={3} className="neten-router" />
          <rect x={W / 2 + 70} y={WIRE_Y - 8} width={26} height={16} rx={3} className="neten-router" />

          {/* the PDU itself */}
          {cur.bits ? (
            <text x={PDU_CX} y={barY + 24} className="neten-bits" textAnchor="middle">{BITS}</text>
          ) : (
            <g className="neten-bar">
              {segments.map((s, i) => {
                let x = startX;
                for (let k = 0; k < i; k += 1) x += segments[k].w;
                return (
                  <g key={`${s.label}-${i}`} className={`neten-seg ${segClass[s.label]}`}>
                    <rect x={x + 1.5} y={barY} width={s.w - 3} height={42} rx={5} className="neten-seg-box" />
                    <text x={x + s.w / 2} y={barY + 26} className="neten-seg-text" textAnchor="middle">{s.label}</text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="neten-controls">
        <button type="button" className="neten-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="neten-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="neten-speed">
          <span className="neten-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="neten-speed-range"
          />
          <span className="neten-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="neten-progress">{step} / {total}</span>
        <span className={`neten-phase neten-phase-${cur.dir}`}>
          <PhaseIcon size={13} /> {phase}
        </span>
      </div>

      <div className="neten-readout">
        <div className="neten-stat is-layer">
          <span className="neten-stat-label">layer</span>
          <span className="neten-stat-val">{cur.side === 'wire' ? 'wire' : STACK[cur.layer].name}</span>
        </div>
        <div className="neten-stat is-pdu">
          <span className="neten-stat-label">PDU</span>
          <span className="neten-stat-val">{cur.bits ? 'bits' : cur.pdu}</span>
        </div>
        <div className="neten-stat is-bytes">
          <span className="neten-stat-label">bytes</span>
          <span className="neten-stat-val">{cur.bytes}</span>
        </div>
        <div className="neten-stat is-hdr">
          <span className="neten-stat-label">headers</span>
          <span className="neten-stat-val">{cur.hcount}</span>
        </div>
      </div>

      <div className="neten-note">
        <span className="neten-note-label">now</span>
        <span className="neten-note-body">{cur.action}</span>
      </div>
    </div>
  );
}
