import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Key, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './CryptoSymmetricViz.css';

// Fixed, deterministic example — no Math.random anywhere. A short plaintext is
// split into blocks and run through a TOY reversible block transform: each
// block byte is XORed with a key-derived value. XOR is its own inverse, so the
// SAME key both encrypts and (applied again in the decrypt pass) recovers the
// original plaintext. This is a teaching stand-in, NOT real AES.
const PLAINTEXT = 'CRYPTOGRAPHY';           // 12 chars -> six 2-char blocks
const KEY_LABEL = 'K7';                      // shown as the shared key chip
const KEY_STREAM = [0x1f, 0x2a, 0x3c, 0x4d, 0x5e, 0x6b]; // one byte per block

function blocksOf(str) {
  const out = [];
  for (let i = 0; i < str.length; i += 2) out.push(str.slice(i, i + 2));
  return out;
}

// Reversible per-block transform: XOR every char code with the block's key byte.
function transform(block, keyByte) {
  let s = '';
  for (let i = 0; i < block.length; i += 1) {
    const v = (block.charCodeAt(i) ^ keyByte) & 0xff;
    s += v.toString(16).padStart(2, '0');
  }
  return s.toUpperCase();
}

const BLOCKS = blocksOf(PLAINTEXT);
const CIPHER = BLOCKS.map((b, i) => transform(b, KEY_STREAM[i]));

// A step is a resting state: which block, which direction, what it shows.
function buildSteps() {
  const out = [];
  BLOCKS.forEach((b, i) => {
    out.push({
      dir: 'enc', idx: i,
      inTxt: b, outTxt: CIPHER[i],
      note: `Encrypt block ${i + 1}: plaintext "${b}" XOR key ${KEY_LABEL} -> ciphertext ${CIPHER[i]}.`,
    });
  });
  BLOCKS.forEach((b, i) => {
    out.push({
      dir: 'dec', idx: i,
      inTxt: CIPHER[i], outTxt: b,
      note: `Decrypt block ${i + 1}: ciphertext ${CIPHER[i]} XOR the SAME key ${KEY_LABEL} -> "${b}".`,
    });
  });
  return out;
}

// Geometry — a single centered vertical column of blocks.
const W = 360;
const H = 468;
const COL_X = 118;
const COL_W = 124;
const ROW_H = 40;
const PITCH = 62;
const ROW_TOP = 20;
const KEY_X = 300;

const rowTop = (i) => ROW_TOP + i * PITCH;
const rowMid = (i) => rowTop(i) + ROW_H / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CryptoSymmetricViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const steps = useMemo(() => buildSteps(), []);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];
  const encrypting = cur.dir === 'enc';
  const doneCount = safeStep + 1;

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

  return (
    <div className="csv">
      <div className="csv-head">
        <div className="csv-head-icon"><Key size={18} /></div>
        <div className="csv-head-text">
          <h3 className="csv-title">One key, both directions</h3>
          <p className="csv-sub">
            A block cipher scrambles each plaintext block under a shared key, then the very
            same key runs in reverse to recover it &mdash; a teaching stand-in for AES.
          </p>
        </div>
        <button type="button" className="csv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="csv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="csv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="csv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="csv-arrow-head" />
            </marker>
            <filter id="csv-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* the shared key chip, wired to every block */}
          <g className={`csv-key ${encrypting ? 'is-enc' : 'is-dec'}`}>
            <line
              x1={KEY_X} y1={rowMid(cur.idx)} x2={COL_X + COL_W} y2={rowMid(cur.idx)}
              className="csv-key-wire" markerEnd="url(#csv-arrow)"
            />
            <rect x={KEY_X - 26} y={rowMid(cur.idx) - 15} width={52} height={30} rx={8} className="csv-key-box" filter="url(#csv-glow)" />
            <text x={KEY_X} y={rowMid(cur.idx) - 1} className="csv-key-icon" textAnchor="middle">key</text>
            <text x={KEY_X} y={rowMid(cur.idx) + 11} className="csv-key-val" textAnchor="middle">{KEY_LABEL}</text>
          </g>

          {/* block rows */}
          {BLOCKS.map((b, i) => {
            const active = cur.idx === i;
            const shown = encrypting
              ? (safeStep >= i ? CIPHER[i] : b)
              : (safeStep - BLOCKS.length >= i ? b : CIPHER[i]);
            const isCipher = encrypting ? safeStep >= i : safeStep - BLOCKS.length < i;
            return (
              <g
                key={`blk-${i}`}
                className={`csv-row${active ? ' is-active' : ''}${isCipher ? ' is-cipher' : ' is-plain'}`}
              >
                <rect x={COL_X} y={rowTop(i)} width={COL_W} height={ROW_H} rx={9} className="csv-row-box" />
                <text x={COL_X + COL_W / 2} y={rowTop(i) + 18} className="csv-row-txt" textAnchor="middle">{shown}</text>
                <text x={COL_X + COL_W / 2} y={rowTop(i) + 31} className="csv-row-tag" textAnchor="middle">
                  {isCipher ? 'cipher' : 'plain'}
                </text>
                <text x={COL_X - 10} y={rowTop(i) + 24} className="csv-row-idx" textAnchor="end">{i + 1}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="csv-controls">
        <button type="button" className="csv-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button" className="csv-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={safeStep >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="csv-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="csv-speed-range"
          />
          <span className="csv-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="csv-progress">{safeStep + 1} / {steps.length}</span>
      </div>

      <div className="csv-readout">
        <div className="csv-stat is-block">
          <span className="csv-stat-label">block</span>
          <span className="csv-stat-val">{cur.idx + 1} / {BLOCKS.length}</span>
        </div>
        <div className={`csv-stat is-dir ${encrypting ? 'is-enc' : 'is-dec'}`}>
          <span className="csv-stat-icon">{encrypting ? <Lock size={13} /> : <Unlock size={13} />}</span>
          <span className="csv-stat-label">direction</span>
          <span className="csv-stat-val">{encrypting ? 'encrypt' : 'decrypt'}</span>
        </div>
        <div className="csv-stat is-key">
          <span className="csv-stat-label">key</span>
          <span className="csv-stat-val">{KEY_LABEL}</span>
        </div>
        <div className="csv-stat is-done">
          <span className="csv-stat-label">blocks done</span>
          <span className="csv-stat-val">{doneCount} / {steps.length}</span>
        </div>
      </div>

      <div className="csv-note">
        <span className="csv-note-label">now</span>
        <span className="csv-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
