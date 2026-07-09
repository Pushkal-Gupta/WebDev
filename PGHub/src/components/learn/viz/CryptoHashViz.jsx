import React, { useMemo, useState } from 'react';
import { Hash, RotateCcw, Shuffle, Shield } from 'lucide-react';
import './CryptoHashViz.css';

// Teaching stand-in only: an FNV-1a variant folded to 32 bits (8 hex chars).
// This is NOT a real cryptographic hash — it just has enough avalanche to make
// the "flip one character, flip about half the bits" idea visible. Fully
// deterministic; there is no randomness anywhere in this file.
const DEMO_SALT = 'x7Qk';
const BITS = 32;
const REFERENCE_INPUT = 'hello';

function demoHash(str) {
  let h = 0x811c9dc5 >>> 0;              // FNV offset basis (32-bit)
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;  // FNV prime
  }
  // extra avalanche mixing so single-char edits spread across the word
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

function toHex(n) {
  return n.toString(16).padStart(8, '0');
}

function toBits(n) {
  const out = [];
  for (let i = BITS - 1; i >= 0; i -= 1) out.push((n >>> i) & 1);
  return out;
}

function countFlipped(a, b) {
  let x = (a ^ b) >>> 0;
  let c = 0;
  while (x) { c += x & 1; x >>>= 1; }
  return c;
}

// grid geometry — 4 rows of 8 nibble-grouped bits
const COLS = 8;
const ROWS = BITS / COLS;
const CELL = 34;
const GAP = 6;
const PAD = 14;
const GW = PAD * 2 + COLS * CELL + (COLS - 1) * GAP;
const GH = PAD * 2 + ROWS * CELL + (ROWS - 1) * GAP;

const HUES = ['var(--hue-sky)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-mint)'];

export default function CryptoHashViz() {
  const [input, setInput] = useState(REFERENCE_INPUT);
  const [salted, setSalted] = useState(false);

  const reference = useMemo(() => demoHash(REFERENCE_INPUT), []);

  const message = salted ? DEMO_SALT + input : input;
  const digest = useMemo(() => demoHash(message), [message]);
  const bits = useMemo(() => toBits(digest), [digest]);
  const refBits = useMemo(() => toBits(reference), [reference]);
  const flipped = countFlipped(digest, reference);
  const flipPct = Math.round((flipped / BITS) * 100);

  function reset() {
    setInput(REFERENCE_INPUT);
    setSalted(false);
  }

  const noteBody = salted
    ? `Salt "${DEMO_SALT}" is prepended before hashing, so the stored digest for "${input}" differs from the unsalted one — identical passwords no longer collide.`
    : input === REFERENCE_INPUT
      ? `Baseline: this input is the reference, so 0 bits differ. Change one character to watch the avalanche.`
      : `${flipped} of ${BITS} bits (${flipPct}%) flipped versus the reference "${REFERENCE_INPUT}" — a one-character edit scrambles roughly half the output.`;

  return (
    <div className="chv">
      <div className="chv-head">
        <div className="chv-head-icon"><Hash size={18} /></div>
        <div className="chv-head-text">
          <h3 className="chv-title">Avalanche &amp; salting, one bit at a time</h3>
          <p className="chv-sub">
            Type into the message and watch the fixed-length digest churn. A single
            character change flips about half the output bits; toggle salt to see the
            stored hash shift entirely.
          </p>
        </div>
        <button type="button" className="chv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="chv-controls">
        <label className="chv-field">
          <span className="chv-field-label">message</span>
          <input
            type="text"
            className="chv-input"
            value={input}
            spellCheck={false}
            maxLength={24}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={`chv-btn chv-salt${salted ? ' is-on' : ''}`}
          onClick={() => setSalted((s) => !s)}
        >
          <Shield size={14} /> Salt {salted ? 'on' : 'off'}
        </button>
        <span className="chv-hashed" title="value actually fed to the hash">
          <Shuffle size={13} /> hashing: {salted ? `"${DEMO_SALT}" + ` : ''}&quot;{input}&quot;
        </span>
      </div>

      <div className="chv-stage">
        <svg viewBox={`0 0 ${GW} ${GH}`} className="chv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="chv-on" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="color-mix(in srgb, var(--accent) 85%, white)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="chv-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {bits.map((bit, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            const x = PAD + col * (CELL + GAP);
            const y = PAD + row * (CELL + GAP);
            const changed = bit !== refBits[i];
            const nibble = Math.floor(i / 4) % HUES.length;
            return (
              <g key={i} className={`chv-cell${bit ? ' is-on' : ''}${changed ? ' is-flip' : ''}`}>
                <rect
                  x={x} y={y} width={CELL} height={CELL} rx={7}
                  className="chv-cell-box"
                  style={bit ? { fill: HUES[nibble] } : undefined}
                  filter={bit ? 'url(#chv-glow)' : undefined}
                />
                <text x={x + CELL / 2} y={y + CELL / 2 + 4} className="chv-cell-txt" textAnchor="middle">
                  {bit}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chv-readout">
        <div className="chv-stat is-len">
          <span className="chv-stat-label">input len</span>
          <span className="chv-stat-val">{input.length} chars</span>
        </div>
        <div className="chv-stat is-digest">
          <span className="chv-stat-label">digest</span>
          <span className="chv-stat-val chv-mono">{toHex(digest)}</span>
        </div>
        <div className="chv-stat is-flip">
          <span className="chv-stat-label">bits flipped</span>
          <span className="chv-stat-val">{flipped} / {BITS} ({flipPct}%)</span>
        </div>
        <div className="chv-stat is-salt">
          <span className="chv-stat-label">salt</span>
          <span className="chv-stat-val">{salted ? `on — "${DEMO_SALT}"` : 'off'}</span>
        </div>
      </div>

      <div className="chv-note">
        <span className="chv-note-label">now</span>
        <span className="chv-note-body">{noteBody}</span>
      </div>
    </div>
  );
}
