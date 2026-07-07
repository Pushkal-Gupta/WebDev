import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScanLine, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './CompilerLexerViz.css';

// Deterministic lexer walkthrough: a fixed source string is scanned char by
// char into tokens. No randomness anywhere; every frame is precomputed.
const SOURCE = 'while count <= 42';
const KEYWORDS = new Set(['while', 'if', 'else', 'return']);

const isAlpha = (c) => /[A-Za-z_]/.test(c);
const isAlnum = (c) => /[A-Za-z0-9_]/.test(c);

// The DFA-ish states the scanner moves through, shown as a row in the SVG.
const STATES = [
  { key: 'START', label: 'START' },
  { key: 'IDENT', label: 'IDENT' },
  { key: 'NUMBER', label: 'NUMBER' },
  { key: 'OP', label: 'OP' },
  { key: 'EMIT', label: 'EMIT' },
];

// Build one frame per character-step. Each frame captures the cursor, the
// current scanner state, the tokens emitted so far, and a narration line.
function buildFrames(src) {
  const frames = [];
  const tokens = [];
  const snap = (cursor, state, building, desc) =>
    frames.push({ cursor, state, building, desc, tokens: tokens.map((t) => ({ ...t })) });

  let i = 0;
  snap(0, 'START', '', 'Cursor at the start of the source. State: START.');
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') {
      snap(i, 'START', '', `Whitespace at ${i} — consumed, no token emitted.`);
      i += 1;
      continue;
    }
    if (isAlpha(c)) {
      let building = '';
      while (i < src.length && isAlnum(src[i])) {
        building += src[i];
        snap(i, 'IDENT', building, `Reading identifier characters: "${building}".`);
        i += 1;
      }
      const isKw = KEYWORDS.has(building);
      tokens.push({ kind: isKw ? 'keyword' : 'ident', text: building });
      snap(i - 1, 'EMIT', '',
        isKw
          ? `"${building}" is in the keyword table — emit KEYWORD.`
          : `Word ended — not a keyword, emit IDENT "${building}".`);
      continue;
    }
    if (/[0-9]/.test(c)) {
      let building = '';
      while (i < src.length && /[0-9.]/.test(src[i])) {
        building += src[i];
        snap(i, 'NUMBER', building, `Reading number characters: "${building}".`);
        i += 1;
      }
      tokens.push({ kind: 'number', text: building });
      snap(i - 1, 'EMIT', '', `Number ended — emit NUMBER "${building}".`);
      continue;
    }
    if ('<>=!'.includes(c)) {
      if (i + 1 < src.length && src[i + 1] === '=') {
        const text = src.slice(i, i + 2);
        snap(i, 'OP', text, `Saw "${c}", peeked ahead — maximal munch grabs "${text}".`);
        tokens.push({ kind: 'op', text });
        snap(i + 1, 'EMIT', '', `Emit OP "${text}" (two characters, longest match).`);
        i += 2;
        continue;
      }
      tokens.push({ kind: 'op', text: c });
      snap(i, 'EMIT', '', `Emit OP "${c}".`);
      i += 1;
      continue;
    }
    tokens.push({ kind: 'op', text: c });
    snap(i, 'EMIT', '', `Emit OP "${c}".`);
    i += 1;
  }
  tokens.push({ kind: 'eof', text: 'EOF' });
  snap(src.length - 1, 'EMIT', '', 'End of source — emit the EOF token.');
  return frames;
}

const CHAR_W = 24;
const STRIP_X = 24;
const STRIP_Y = 40;
const W = 460;
const H = 250;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CompilerLexerViz() {
  const frames = useMemo(() => buildFrames(SOURCE), []);
  const total = frames.length - 1;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const cur = frames[Math.min(step, total)];

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 820) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const stateNodeW = 74;
  const stateGap = (W - 2 * STRIP_X - stateNodeW) / (STATES.length - 1);

  return (
    <div className="clex">
      <div className="clex-head">
        <div className="clex-head-icon"><ScanLine size={18} /></div>
        <div className="clex-head-text">
          <h3 className="clex-title">Scanning source into tokens</h3>
          <p className="clex-sub">
            The cursor reads one character at a time; a small state machine groups runs of
            characters into tokens, applying maximal munch and skipping whitespace.
          </p>
        </div>
        <button type="button" className="clex-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="clex-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="clex-svg" preserveAspectRatio="xMidYMid meet">
          <text x={STRIP_X} y={26} className="clex-strip-label">source</text>
          {SOURCE.split('').map((ch, idx) => {
            const consumed = idx < cur.cursor || (idx === cur.cursor && cur.state === 'EMIT');
            const isCursor = idx === cur.cursor;
            return (
              <g key={idx} className={`clex-char${isCursor ? ' is-cursor' : ''}${consumed ? ' is-consumed' : ''}`}>
                <rect x={STRIP_X + idx * CHAR_W} y={STRIP_Y} width={CHAR_W - 3} height={30} rx={5} className="clex-char-box" />
                <text x={STRIP_X + idx * CHAR_W + (CHAR_W - 3) / 2} y={STRIP_Y + 20} textAnchor="middle" className="clex-char-text">
                  {ch === ' ' ? '·' : ch}
                </text>
              </g>
            );
          })}
          {cur.cursor >= 0 && (
            <path
              d={`M ${STRIP_X + cur.cursor * CHAR_W + (CHAR_W - 3) / 2} ${STRIP_Y - 6} l -5 -8 l 10 0 z`}
              className="clex-cursor-arrow"
            />
          )}

          <text x={STRIP_X} y={STRIP_Y + 66} className="clex-strip-label">scanner state</text>
          {STATES.map((s, idx) => {
            const active = cur.state === s.key;
            const x = STRIP_X + idx * stateGap;
            return (
              <g key={s.key} className={`clex-state${active ? ' is-active' : ''} clex-state-${s.key.toLowerCase()}`}>
                <rect x={x} y={STRIP_Y + 78} width={stateNodeW} height={34} rx={8} className="clex-state-box" />
                <text x={x + stateNodeW / 2} y={STRIP_Y + 100} textAnchor="middle" className="clex-state-text">{s.label}</text>
              </g>
            );
          })}
          {cur.building && (
            <text x={W / 2} y={STRIP_Y + 140} textAnchor="middle" className="clex-building">
              building: {cur.building}
            </text>
          )}
        </svg>
      </div>

      <div className="clex-tokens">
        <span className="clex-tokens-label">tokens</span>
        <div className="clex-tokens-row">
          {cur.tokens.length === 0 && <span className="clex-token-empty">none yet</span>}
          {cur.tokens.map((t, idx) => (
            <span key={idx} className={`clex-token clex-token-${t.kind}`}>
              <span className="clex-token-kind">{t.kind}</span>
              <span className="clex-token-text">{t.text}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="clex-controls">
        <button type="button" className="clex-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="clex-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="clex-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="clex-speed-range"
          />
          <span className="clex-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="clex-progress">{Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="clex-readout">
        <div className="clex-stat is-state">
          <span className="clex-stat-label">state</span>
          <span className="clex-stat-val">{cur.state}</span>
        </div>
        <div className="clex-stat is-cursor">
          <span className="clex-stat-label">cursor</span>
          <span className="clex-stat-val">{cur.cursor}</span>
        </div>
        <div className="clex-stat is-count">
          <span className="clex-stat-label">tokens</span>
          <span className="clex-stat-val">{cur.tokens.length}</span>
        </div>
      </div>

      <div className="clex-note">
        <span className="clex-note-label">now</span>
        <span className="clex-note-body">{cur.desc}</span>
      </div>
    </div>
  );
}
