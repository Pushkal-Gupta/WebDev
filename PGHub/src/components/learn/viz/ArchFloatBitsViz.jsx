import React, { useState, useEffect, useRef } from 'react';
import { Binary, Play, Pause, SkipForward, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import './ArchFloatBitsViz.css';

// Read the true IEEE-754 single-precision encoding of a value straight from
// a real Float32Array — deterministic, no randomness, exactly what the CPU stores.
function encode(value) {
  const f = new Float32Array([value]);
  const bits = new Uint32Array(f.buffer)[0];
  const sign = (bits >>> 31) & 1;
  const exp = (bits >>> 23) & 0xff;
  const mant = bits & 0x7fffff;
  return { bits, sign, exp, mant, stored: f[0] };
}

const SCENARIOS = [
  { id: 'one', label: '1.0', value: 1.0, requested: 1.0 },
  { id: 'half', label: '0.5', value: 0.5, requested: 0.5 },
  { id: 'tenth', label: '0.1', value: 0.1, requested: 0.1 },
  { id: 'fifth', label: '0.2', value: 0.2, requested: 0.2 },
  { id: 'sum', label: '0.1 + 0.2', value: 0.1 + 0.2, requested: 0.3, isSum: true },
];

const STEPS = [
  { focus: 'split', note: 'Split the 32 bits into three fields: 1 sign bit, 8 exponent bits, 23 mantissa (fraction) bits.' },
  { focus: 'sign', note: 'The sign bit: 0 for positive, 1 for negative.' },
  { focus: 'exp', note: 'The 8-bit exponent is stored biased by 127. Subtract 127 to get the real power-of-two.' },
  { focus: 'mant', note: 'The 23-bit mantissa holds the fraction after an implicit leading 1. Value = 1.fraction × 2^exponent.' },
  { focus: 'decode', note: 'Decode the fields back to a number — and read off how far the stored float drifted from what you asked for.' },
];
const TOTAL = STEPS.length;

const W = 760;
const H = 244;
const X0 = 16;
const CS = (W - 2 * X0) / 32;
const CW = CS - 2.2;
const CY = 54;
const CH = 46;
const cellX = (i) => X0 + i * CS;

function fmt(n) {
  if (Object.is(n, -0)) return '0';
  if (n === 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e-4 && a < 1e7) return String(n);
  return n.toExponential(3);
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ArchFloatBitsViz() {
  const [scen, setScen] = useState('one');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const conf = SCENARIOS.find((s) => s.id === scen);
  const enc = encode(conf.value);
  const ref = encode(conf.requested);

  function pickScen(id) { setScen(id); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= TOTAL) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= TOTAL) return undefined;
    timer.current = setTimeout(
      () => setStep((s2) => Math.min(TOTAL, s2 + 1)),
      Math.round((reduced() ? 360 : 980) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, speed]);

  const cur = step > 0 ? STEPS[step - 1] : null;
  const focus = cur ? cur.focus : null;
  const finished = step >= TOTAL;
  const showPause = playing && step < TOTAL;

  const signRevealed = step >= 2;
  const expRevealed = step >= 3;
  const mantRevealed = step >= 4;
  const decoded = step >= 5;

  const expUnbiased = enc.exp - 127;
  const mantFraction = enc.mant / 0x800000;
  const error = enc.stored - conf.requested;
  const exact = enc.stored === conf.requested;

  // Low mantissa bits carry the rounding when a value has no finite binary form.
  const roundingTail = !exact ? [20, 21, 22] : [];
  // Bits of the stored value that differ from the float32 of the requested decimal.
  const diffMant = new Set();
  if (conf.isSum) {
    for (let j = 0; j < 23; j += 1) {
      const bs = (enc.mant >>> (22 - j)) & 1;
      const br = (ref.mant >>> (22 - j)) & 1;
      if (bs !== br) diffMant.add(j);
    }
  }

  function bitAt(i) {
    if (i === 0) return enc.sign;
    if (i <= 8) return (enc.exp >>> (8 - i)) & 1;
    const j = i - 9;
    return (enc.mant >>> (22 - j)) & 1;
  }

  function fieldOf(i) {
    if (i === 0) return 'sign';
    if (i <= 8) return 'exp';
    return 'mant';
  }

  const signC = cellX(0) + CW / 2;
  const expC = (cellX(1) + cellX(8) + CW) / 2;
  const mantC = (cellX(9) + cellX(31) + CW) / 2;

  const doubleSum = 0.1 + 0.2;

  return (
    <div className="archfb">
      <div className="archfb-head">
        <div className="archfb-head-icon"><Binary size={18} /></div>
        <div className="archfb-head-text">
          <h3 className="archfb-title">Inside a 32-bit float</h3>
          <p className="archfb-sub">
            Every IEEE-754 single-precision number is a sign, an 8-bit exponent, and a 23-bit
            fraction. Read the real stored bits and watch why 0.1 + 0.2 is not exactly 0.3.
          </p>
        </div>
        <button type="button" className="archfb-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="archfb-chips">
        {SCENARIOS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`archfb-chip${c.id === scen ? ' is-active' : ''}`}
            onClick={() => pickScen(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="archfb-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="archfb-svg" preserveAspectRatio="xMidYMid meet">
          {/* field labels + brackets */}
          <g className={`archfb-fieldlab archfb-l-sign${focus === 'sign' ? ' is-active' : ''}${signRevealed ? ' is-shown' : ''}`}>
            <text x={signC} y={26} textAnchor="middle" className="archfb-lab">sign</text>
            <text x={signC} y={38} textAnchor="middle" className="archfb-labsub">1 bit</text>
          </g>
          <g className={`archfb-fieldlab archfb-l-exp${focus === 'exp' ? ' is-active' : ''}${expRevealed ? ' is-shown' : ''}`}>
            <text x={expC} y={26} textAnchor="middle" className="archfb-lab">exponent</text>
            <text x={expC} y={38} textAnchor="middle" className="archfb-labsub">8 bits · bias 127</text>
          </g>
          <g className={`archfb-fieldlab archfb-l-mant${focus === 'mant' ? ' is-active' : ''}${mantRevealed ? ' is-shown' : ''}`}>
            <text x={mantC} y={26} textAnchor="middle" className="archfb-lab">mantissa</text>
            <text x={mantC} y={38} textAnchor="middle" className="archfb-labsub">23 bits · fraction</text>
          </g>

          {/* bit cells */}
          {Array.from({ length: 32 }, (_, i) => {
            const field = fieldOf(i);
            const bit = bitAt(i);
            const j = i - 9;
            const isTail = field === 'mant' && roundingTail.includes(j);
            const isDiff = field === 'mant' && diffMant.has(j);
            const active = focus === field || focus === 'split';
            const cls = [
              'archfb-cell',
              `archfb-c-${field}`,
              bit ? 'is-set' : 'is-clear',
              active ? 'is-active' : 'is-dim',
              isDiff ? 'is-diff' : '',
              isTail && !isDiff ? 'is-tail' : '',
            ].join(' ').trim();
            return (
              <g key={i} className={cls}>
                <rect x={cellX(i)} y={CY} width={CW} height={CH} rx={3} className="archfb-cell-box" />
                <text x={cellX(i) + CW / 2} y={CY + CH / 2 + 4} textAnchor="middle" className="archfb-cell-t">{bit}</text>
              </g>
            );
          })}

          {/* per-field decoded annotations */}
          <g className={`archfb-ann${signRevealed ? ' is-shown' : ''}`}>
            <text x={signC} y={CY + CH + 20} textAnchor="middle" className="archfb-ann-t archfb-t-sign">
              {enc.sign === 0 ? '+' : '−'}
            </text>
          </g>
          <g className={`archfb-ann${expRevealed ? ' is-shown' : ''}`}>
            <text x={expC} y={CY + CH + 20} textAnchor="middle" className="archfb-ann-t archfb-t-exp">
              {enc.exp} − 127 = {expUnbiased}
            </text>
          </g>
          <g className={`archfb-ann${mantRevealed ? ' is-shown' : ''}`}>
            <text x={mantC} y={CY + CH + 20} textAnchor="middle" className="archfb-ann-t archfb-t-mant">
              1 + {mantFraction.toFixed(7)} = {(1 + mantFraction).toFixed(7)}
            </text>
          </g>

          {/* decoded value line */}
          <g className={`archfb-decode${decoded ? ' is-shown' : ''}`}>
            <rect x={X0} y={CY + CH + 34} width={W - 2 * X0} height={44} rx={8} className="archfb-decode-box" />
            <text x={W / 2} y={CY + CH + 54} textAnchor="middle" className="archfb-decode-t">
              ({enc.sign === 0 ? '+' : '−'}1) × {(1 + mantFraction).toFixed(7)} × 2^{expUnbiased} = {fmt(enc.stored)}
            </text>
            <text x={W / 2} y={CY + CH + 71} textAnchor="middle" className={`archfb-decode-e ${exact ? 'is-exact' : 'is-off'}`}>
              {exact
                ? 'stored exactly — no rounding needed'
                : `requested ${fmt(conf.requested)} · stored ${fmt(enc.stored)} · off by ${error.toExponential(2)}`}
            </text>
          </g>
        </svg>
      </div>

      <div className="archfb-controls">
        <button type="button" className="archfb-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="archfb-btn" onClick={() => setStep((x) => Math.min(TOTAL, x + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="archfb-speed">
          <span className="archfb-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="archfb-speed-range"
          />
          <span className="archfb-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="archfb-progress">{step} / {TOTAL} steps</span>
      </div>

      <div className="archfb-readout">
        <div className="archfb-stat is-sign">
          <span className="archfb-stat-label">sign</span>
          <span className="archfb-stat-val">{enc.sign} ({enc.sign === 0 ? '+' : '−'})</span>
        </div>
        <div className="archfb-stat is-exp">
          <span className="archfb-stat-label">exponent</span>
          <span className="archfb-stat-val">{enc.exp} → 2^{expUnbiased}</span>
        </div>
        <div className="archfb-stat is-mant">
          <span className="archfb-stat-label">stored</span>
          <span className="archfb-stat-val">{fmt(enc.stored)}</span>
        </div>
        <div className={`archfb-stat ${exact ? 'is-good' : 'is-bad'}`}>
          {exact ? <Check size={13} /> : <AlertTriangle size={13} />}
          <span className="archfb-stat-label">error</span>
          <span className="archfb-stat-val">{exact ? '0 (exact)' : error.toExponential(2)}</span>
        </div>
      </div>

      <div className="archfb-note">
        <span className="archfb-note-label">now</span>
        <span className="archfb-note-body">
          {cur ? cur.note : 'press Step or Play to peel apart the 32 bits'}
          {conf.isSum && decoded && (
            <>
              {' '}In 64-bit doubles the gap is starker: <code className="archfb-code">0.1 + 0.2 === {String(doubleSum)}</code>,
              off from 0.3 by {(doubleSum - 0.3).toExponential(2)}. Neither 0.1 nor 0.2 has a finite binary form,
              so their rounded bits never sum back to a clean 0.3.
            </>
          )}
        </span>
      </div>
    </div>
  );
}
