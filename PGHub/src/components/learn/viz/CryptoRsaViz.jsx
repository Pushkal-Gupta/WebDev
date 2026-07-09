import React, { useMemo, useState, useEffect, useRef } from 'react';
import { KeyRound, Lock, Unlock, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './CryptoRsaViz.css';

// Fixed textbook RSA values — deterministic, no randomness anywhere.
const P = 3;
const Q = 11;
const N = P * Q;                 // 33
const PHI = (P - 1) * (Q - 1);  // 20
const E = 7;
const D = 3;
const M = 4;

// Tiny modular exponentiation (numbers are small; plain math is exact here).
function modpow(base, exp, mod) {
  let result = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return result;
}

const RAW_ENC = Math.pow(M, E);            // 16384
const CIPHER = modpow(M, E, N);            // 16
const RAW_DEC = Math.pow(CIPHER, D);       // 4096
const PLAIN = modpow(CIPHER, D, N);        // 4

// Each step is a resting state of the walkthrough.
const STEPS = [
  {
    phase: 'keygen', hue: 'is-primes',
    title: 'Pick two secret primes',
    value: `p = ${P},  q = ${Q}`,
    math: `Choose primes p = ${P} and q = ${Q}. Kept secret — the whole scheme rests on these staying hidden.`,
  },
  {
    phase: 'keygen', hue: 'is-mod',
    title: 'Multiply into the modulus',
    value: `n = p·q = ${N}`,
    math: `n = ${P} × ${Q} = ${N}. Easy forward; factoring ${N} back into its primes is the hard direction (trivial here, hopeless at 2048 bits).`,
  },
  {
    phase: 'keygen', hue: 'is-phi',
    title: 'Compute the totient',
    value: `φ(n) = (p−1)(q−1) = ${PHI}`,
    math: `φ(n) = (${P}−1)(${Q}−1) = ${P - 1} × ${Q - 1} = ${PHI}. Secret helper number used to derive the private exponent.`,
  },
  {
    phase: 'keygen', hue: 'is-e',
    title: 'Choose the public exponent',
    value: `e = ${E}`,
    math: `Pick e = ${E}, which shares no common factor with φ(n) = ${PHI} (gcd = 1).`,
  },
  {
    phase: 'keygen', hue: 'is-d',
    title: 'Find the private exponent',
    value: `d = ${D}`,
    math: `Solve e·d ≡ 1 (mod φ). Here ${E} × ${D} = ${E * D} = ${PHI} + 1 ≡ 1 (mod ${PHI}), so d = ${D}.`,
  },
  {
    phase: 'keys', hue: 'is-keys',
    title: 'The key pair is ready',
    value: `pub (${N},${E}) · priv (${N},${D})`,
    math: `Public key (n=${N}, e=${E}) is published to everyone. Private key (n=${N}, d=${D}) never leaves your pocket.`,
  },
  {
    phase: 'encrypt', hue: 'is-enc',
    title: 'Encrypt the message',
    value: `c = m^e mod n = ${CIPHER}`,
    math: `${M}^${E} mod ${N} = ${RAW_ENC} mod ${N} = ${CIPHER}. Anyone with the public key can lock the message m = ${M} into ciphertext ${CIPHER}.`,
  },
  {
    phase: 'decrypt', hue: 'is-dec',
    title: 'Decrypt with the private key',
    value: `m = c^d mod n = ${PLAIN}`,
    math: `${CIPHER}^${D} mod ${N} = ${RAW_DEC} mod ${N} = ${PLAIN}. The private exponent undoes the encryption — original message ${PLAIN} recovered, matching m.`,
  },
];

// Geometry — vertical column, top to bottom.
const W = 380;
const H = 452;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CryptoRsaViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = STEPS.length - 1;
  const safeStep = Math.min(step, total);
  const cur = STEPS[safeStep];

  const phaseIndex = useMemo(() => {
    if (cur.phase === 'encrypt') return 1;
    if (cur.phase === 'decrypt') return 2;
    return 0;
  }, [cur.phase]);

  const recovered = cur.phase === 'decrypt';

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  // Message token position along the encrypt -> decrypt flow.
  const flowX = phaseIndex === 0 ? 190 : phaseIndex === 1 ? 190 : 190;
  const tokenLabel = phaseIndex === 2 ? PLAIN : phaseIndex === 1 ? M : M;

  return (
    <div className="crv">
      <div className="crv-head">
        <div className="crv-head-icon"><KeyRound size={18} /></div>
        <div className="crv-head-text">
          <h3 className="crv-title">Textbook RSA, step by step</h3>
          <p className="crv-sub">
            Two tiny primes become a public/private key pair, then a message is locked with the
            public key and opened with the private one &mdash; the padlock made of arithmetic.
          </p>
        </div>
        <button type="button" className="crv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="crv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="crv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="crv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="crv-arrow-head" />
            </marker>
            <filter id="crv-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* key pair panel */}
          <g className={`crv-keys${safeStep >= 5 ? ' is-ready' : ''}`}>
            <g className="crv-key crv-key-pub">
              <rect x={26} y={16} width={148} height={72} rx={11} className="crv-key-box" />
              <Lock x={40} y={30} width={16} height={16} className="crv-key-glyph" />
              <text x={64} y={43} className="crv-key-kind">PUBLIC</text>
              <text x={40} y={64} className="crv-key-val">n = {N}</text>
              <text x={40} y={80} className="crv-key-val">e = {E}</text>
            </g>
            <g className="crv-key crv-key-priv">
              <rect x={206} y={16} width={148} height={72} rx={11} className="crv-key-box" />
              <KeyRound x={220} y={30} width={16} height={16} className="crv-key-glyph" />
              <text x={244} y={43} className="crv-key-kind">PRIVATE</text>
              <text x={220} y={64} className="crv-key-val">n = {N}</text>
              <text x={220} y={80} className="crv-key-val">d = {D}</text>
            </g>
          </g>

          {/* trunk */}
          <line x1={190} y1={100} x2={190} y2={410} className="crv-trunk" />

          {/* message node */}
          <g className={`crv-node crv-node-msg${phaseIndex === 0 ? ' is-active' : ''}`}>
            <line x1={190} y1={100} x2={190} y2={126} className="crv-trunk-seg" markerEnd="url(#crv-arrow)" />
            <rect x={132} y={130} width={116} height={44} rx={10} className="crv-node-box" />
            <text x={190} y={150} className="crv-node-title" textAnchor="middle">message m</text>
            <text x={190} y={167} className="crv-node-val" textAnchor="middle">m = {M}</text>
          </g>

          {/* encrypt node */}
          <g className={`crv-node crv-node-enc${phaseIndex === 1 ? ' is-active' : ''}${phaseIndex >= 1 ? ' is-done' : ''}`}>
            <line x1={190} y1={174} x2={190} y2={200} className="crv-trunk-seg" markerEnd="url(#crv-arrow)" />
            <rect x={112} y={204} width={156} height={52} rx={10} className="crv-node-box" />
            <Lock x={126} y={218} width={15} height={15} className="crv-node-glyph" />
            <text x={150} y={230} className="crv-node-title">encrypt (public)</text>
            <text x={190} y={248} className="crv-node-val" textAnchor="middle">c = m^e mod n = {CIPHER}</text>
          </g>

          {/* ciphertext node */}
          <g className={`crv-node crv-node-cipher${phaseIndex >= 1 ? ' is-active' : ''}`}>
            <line x1={190} y1={256} x2={190} y2={282} className="crv-trunk-seg" markerEnd="url(#crv-arrow)" />
            <rect x={140} y={286} width={100} height={40} rx={10} className="crv-node-box" />
            <text x={190} y={304} className="crv-node-title" textAnchor="middle">ciphertext c</text>
            <text x={190} y={320} className="crv-node-val" textAnchor="middle">c = {CIPHER}</text>
          </g>

          {/* decrypt node */}
          <g className={`crv-node crv-node-dec${phaseIndex === 2 ? ' is-active' : ''}`}>
            <line x1={190} y1={326} x2={190} y2={352} className="crv-trunk-seg" markerEnd="url(#crv-arrow)" />
            <rect x={112} y={356} width={156} height={52} rx={10} className={`crv-node-box${recovered ? ' is-match' : ''}`} />
            <Unlock x={126} y={370} width={15} height={15} className="crv-node-glyph" />
            <text x={150} y={382} className="crv-node-title">decrypt (private)</text>
            <text x={190} y={400} className="crv-node-val" textAnchor="middle">m = c^d mod n = {PLAIN}</text>
          </g>

          {/* travelling token */}
          <g className={`crv-token${recovered ? ' is-match' : ''}`} filter="url(#crv-glow)">
            <circle
              cx={flowX}
              cy={phaseIndex === 0 ? 152 : phaseIndex === 1 ? 306 : 382}
              r={11}
              className="crv-token-dot"
            />
            <text
              x={flowX}
              y={(phaseIndex === 0 ? 152 : phaseIndex === 1 ? 306 : 382) + 4}
              className="crv-token-label"
              textAnchor="middle"
            >
              {tokenLabel}
            </text>
          </g>
        </svg>
      </div>

      <div className="crv-controls">
        <button type="button" className="crv-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="crv-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={safeStep >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="crv-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="crv-speed-range"
          />
          <span className="crv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="crv-progress">{safeStep} / {total}</span>
      </div>

      <div className="crv-readout">
        <div className="crv-stat is-mod">
          <span className="crv-stat-label">modulus n</span>
          <span className="crv-stat-val">{N}</span>
        </div>
        <div className="crv-stat is-exp">
          <span className="crv-stat-label">e / d</span>
          <span className="crv-stat-val">{E} / {D}</span>
        </div>
        <div className={`crv-stat is-cur ${cur.hue}`}>
          <span className="crv-stat-label">current</span>
          <span className="crv-stat-val">{cur.value}</span>
        </div>
      </div>

      <div className="crv-note">
        <span className="crv-note-label">{cur.title}</span>
        <span className="crv-note-body">{cur.math}</span>
      </div>
    </div>
  );
}
