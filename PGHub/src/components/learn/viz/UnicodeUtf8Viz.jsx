import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Binary, ChevronRight } from 'lucide-react';
import './UnicodeUtf8Viz.css';

// UTF-8 layout: leading-byte prefix encodes length, continuation bytes start with 10.
const LAYOUTS = {
  1: [{ prefix: '0', payload: 7 }],
  2: [{ prefix: '110', payload: 5 }, { prefix: '10', payload: 6 }],
  3: [{ prefix: '1110', payload: 4 }, { prefix: '10', payload: 6 }, { prefix: '10', payload: 6 }],
  4: [{ prefix: '11110', payload: 3 }, { prefix: '10', payload: 6 }, { prefix: '10', payload: 6 }, { prefix: '10', payload: 6 }],
};

const RANGES = [
  { len: 1, lo: 0x0, hi: 0x7f, label: 'U+0000..U+007F', name: 'ASCII', payloadBits: 7 },
  { len: 2, lo: 0x80, hi: 0x7ff, label: 'U+0080..U+07FF', name: 'Latin / symbols', payloadBits: 11 },
  { len: 3, lo: 0x800, hi: 0xffff, label: 'U+0800..U+FFFF', name: 'BMP', payloadBits: 16 },
  { len: 4, lo: 0x10000, hi: 0x10ffff, label: 'U+10000..U+10FFFF', name: 'astral planes', payloadBits: 21 },
];

const PRESETS = [
  { cp: 0x0041, glyph: 'A', tag: 'A' },
  { cp: 0x00a9, glyph: '©', tag: 'copyright' },
  { cp: 0x20ac, glyph: '€', tag: 'euro' },
  { cp: 0x0905, glyph: 'अ', tag: 'devanagari a' },
  { cp: 0x4e2d, glyph: '中', tag: 'zhong' },
  { cp: 0x1f600, glyph: '\u{1F600}', tag: 'grinning' },
];

const BOUNDARIES = [0x7f, 0x80, 0x7ff, 0x800, 0xffff, 0x10000, 0x10ffff];

const MAX_CP = 0x10ffff;

function rangeFor(cp) {
  return RANGES.find((r) => cp >= r.lo && cp <= r.hi) || RANGES[3];
}

function hexCP(cp) {
  let h = cp.toString(16).toUpperCase();
  if (h.length < 4) h = h.padStart(4, '0');
  return `U+${h}`;
}

// Encode a code point to UTF-8, returning a per-byte breakdown of prefix + payload bits.
function encode(cp) {
  const r = rangeFor(cp);
  const len = r.len;
  const layout = LAYOUTS[len];
  const totalPayload = layout.reduce((s, b) => s + b.payload, 0);
  const cpBits = cp.toString(2).padStart(totalPayload, '0'); // big-endian, right-aligned
  let cursor = 0;
  const bytes = layout.map((b) => {
    const payloadBits = cpBits.slice(cursor, cursor + b.payload).split('');
    cursor += b.payload;
    const bits = [
      ...b.prefix.split('').map((bit, i) => ({ kind: 'prefix', bit, key: `p${i}` })),
      ...payloadBits.map((bit, i) => ({ kind: 'payload', bit, key: `x${i}` })),
    ];
    const byteVal = parseInt(bits.map((x) => x.bit).join(''), 2);
    return { bits, hex: `0x${byteVal.toString(16).toUpperCase().padStart(2, '0')}`, dec: byteVal };
  });
  const usedBits = cp === 0 ? 1 : cp.toString(2).length;
  return { len, range: r, totalPayload, usedBits, cpBits, bytes };
}

export default function UnicodeUtf8Viz() {
  const [cp, setCp] = useState(0x20ac);
  const [revealed, setRevealed] = useState(0); // how many payload slots are filled (animation)
  const timer = useRef(null);

  const enc = useMemo(() => encode(cp), [cp]);

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // Animate bits filling into the x-slots, left-to-right across bytes.
  useEffect(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    const totalSlots = enc.totalPayload;
    if (reduceMotion) {
      timer.current = setTimeout(() => setRevealed(totalSlots), 0);
      return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
    }
    let n = 0;
    timer.current = setInterval(() => {
      setRevealed(n); // first tick reveals 0, then climbs
      n += 1;
      if (n > totalSlots) { clearInterval(timer.current); timer.current = null; }
    }, 110);
    return () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  }, [enc, reduceMotion]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const selectCp = (value) => {
    const next = Math.max(0, Math.min(MAX_CP, Math.round(value)));
    setCp(next);
  };

  const reset = () => setCp(0x20ac);

  // SVG geometry: widest case is 4 bytes x 8 bits. Size viewBox so it never scrolls.
  const W = 940;
  const byteGap = 22;
  const cellW = 26;
  const cellH = 34;
  const startX = 30;
  const startY = 64;
  const byteW = cellW * 8;
  const totalBytesW = enc.len * byteW + (enc.len - 1) * byteGap;
  const gridLeft = (W - totalBytesW) / 2;

  // Precompute a global payload index per slot so the animation reveals across byte boundaries
  // without mutating a counter during render.
  const slotMeta = useMemo(() => {
    const payloadBefore = enc.bytes.map((byte, bi) => enc.bytes
      .slice(0, bi)
      .reduce((s, b) => s + b.bits.filter((x) => x.kind === 'payload').length, 0));
    return enc.bytes.map((byte, bi) => {
      const seenPayload = byte.bits.map((slot, si) => byte.bits
        .slice(0, si)
        .filter((x) => x.kind === 'payload').length);
      return byte.bits.map((slot, si) => (
        slot.kind === 'payload'
          ? { ...slot, payloadIndex: payloadBefore[bi] + seenPayload[si] }
          : { ...slot, payloadIndex: null }
      ));
    });
  }, [enc]);

  const glyph = useMemo(() => {
    try { return String.fromCodePoint(cp); } catch { return ''; }
  }, [cp]);

  const hueByByte = ['--hue-sky', '--hue-mint', '--hue-violet', '--hue-pink'];

  return (
    <div className="uutf">
      <div className="uutf-head">
        <div className="uutf-icon"><Binary size={18} /></div>
        <div className="uutf-head-text">
          <h3 className="uutf-title">UTF-8 encoder — code point to bytes</h3>
          <p className="uutf-sub">
            Pick a character; watch its code point binary flow into the variable x-slots of the
            UTF-8 byte template, big-endian and right-aligned.
          </p>
        </div>
        <button type="button" className="uutf-reset" onClick={reset} aria-label="Reset to euro sign">
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="uutf-chips" role="group" aria-label="Preset characters">
        {PRESETS.map((p) => (
          <button
            key={p.cp}
            type="button"
            className={`uutf-chip ${cp === p.cp ? 'is-on' : ''}`}
            onClick={() => selectCp(p.cp)}
            title={`${p.tag} ${hexCP(p.cp)}`}
          >
            <span className="uutf-chip-glyph">{p.glyph}</span>
            <span className="uutf-chip-cp">{hexCP(p.cp)}</span>
          </button>
        ))}
        <span className="uutf-chip-sep" aria-hidden="true" />
        {BOUNDARIES.map((b) => (
          <button
            key={b}
            type="button"
            className={`uutf-chip is-boundary ${cp === b ? 'is-on' : ''}`}
            onClick={() => selectCp(b)}
            title={`boundary ${hexCP(b)}`}
          >
            <span className="uutf-chip-cp">{hexCP(b)}</span>
          </button>
        ))}
      </div>

      <label className="uutf-slider">
        <span className="uutf-slider-label">code point</span>
        <input
          type="range"
          min={0}
          max={MAX_CP}
          step={1}
          value={cp}
          onChange={(e) => selectCp(Number(e.target.value))}
          className="uutf-range"
          aria-label="Code point value"
        />
        <span className="uutf-slider-val">{hexCP(cp)}</span>
      </label>

      <div className="uutf-ranges">
        {RANGES.map((r) => (
          <button
            key={r.len}
            type="button"
            className={`uutf-rangecard ${enc.len === r.len ? 'is-on' : ''}`}
            onClick={() => selectCp(r.lo)}
          >
            <span className="uutf-range-len">{r.len} byte{r.len > 1 ? 's' : ''}</span>
            <span className="uutf-range-label">{r.label}</span>
            <span className="uutf-range-name">{r.name} · {r.payloadBits} payload bits</span>
          </button>
        ))}
      </div>

      <div className="uutf-stage">
        <svg viewBox={`0 0 ${W} 220`} className="uutf-svg" preserveAspectRatio="xMidYMid meet">
          {enc.bytes.map((byte, bi) => {
            const bx = gridLeft + bi * (byteW + byteGap);
            const hue = `var(${hueByByte[bi]})`;
            return (
              <g key={`byte-${bi}`}>
                <rect
                  className="uutf-byteframe"
                  x={bx - 5}
                  y={startY - 5}
                  width={byteW + 10}
                  height={cellH + 10}
                  rx={8}
                  style={{ stroke: hue }}
                />
                {slotMeta[bi].map((slot, si) => {
                  const cx = bx + si * cellW;
                  const isPrefix = slot.kind === 'prefix';
                  const filled = isPrefix || slot.payloadIndex < revealed;
                  return (
                    <g key={`${bi}-${slot.key}`}>
                      <rect
                        className={`uutf-bit ${isPrefix ? 'is-prefix' : 'is-payload'} ${filled ? 'is-filled' : 'is-empty'}`}
                        x={cx}
                        y={startY}
                        width={cellW - 2}
                        height={cellH}
                        rx={4}
                        style={isPrefix ? undefined : { stroke: filled ? hue : 'var(--border)' }}
                      />
                      <text
                        className={`uutf-bit-text ${isPrefix ? 'is-prefix' : 'is-payload'}`}
                        x={cx + (cellW - 2) / 2}
                        y={startY + cellH / 2 + 5}
                        textAnchor="middle"
                        style={!isPrefix && filled ? { fill: hue } : undefined}
                      >
                        {isPrefix ? slot.bit : (filled ? slot.bit : 'x')}
                      </text>
                    </g>
                  );
                })}
                <text
                  className="uutf-byte-hex"
                  x={bx + byteW / 2}
                  y={startY + cellH + 28}
                  textAnchor="middle"
                  style={{ fill: hue }}
                >
                  {byte.hex}
                </text>
                <text
                  className="uutf-byte-role"
                  x={bx + byteW / 2}
                  y={startY - 14}
                  textAnchor="middle"
                >
                  {bi === 0 ? 'leading byte' : 'continuation'}
                </text>
                {bi < enc.bytes.length - 1 && (
                  <ChevronRight
                    x={bx + byteW + 2}
                    y={startY + cellH / 2 - 8}
                    width={16}
                    height={16}
                    className="uutf-byte-arrow"
                  />
                )}
              </g>
            );
          })}

          <text className="uutf-legend-pre" x={startX} y={194}>
            prefix bits (length tag)
          </text>
          <text className="uutf-legend-pay" x={startX + 220} y={194}>
            payload x-slots (code point bits)
          </text>
        </svg>
      </div>

      <div className="uutf-readouts">
        <div className="uutf-stat">
          <span className="uutf-stat-label">character</span>
          <span className="uutf-stat-value uutf-glyph">{glyph || '·'}</span>
        </div>
        <div className="uutf-stat">
          <span className="uutf-stat-label">code point</span>
          <span className="uutf-stat-value">{hexCP(cp)} · {cp}</span>
        </div>
        <div className="uutf-stat">
          <span className="uutf-stat-label">binary</span>
          <span className="uutf-stat-value is-bin">{cp === 0 ? '0' : cp.toString(2)}</span>
        </div>
        <div className="uutf-stat">
          <span className="uutf-stat-label">byte count</span>
          <span className="uutf-stat-value is-len">{enc.len}</span>
        </div>
        <div className="uutf-stat">
          <span className="uutf-stat-label">payload bits</span>
          <span className="uutf-stat-value">{enc.usedBits} used / {enc.totalPayload} avail</span>
        </div>
        <div className="uutf-stat">
          <span className="uutf-stat-label">UTF-8 hex</span>
          <span className="uutf-stat-value is-hex">{enc.bytes.map((b) => b.hex).join(' ')}</span>
        </div>
      </div>

      <div className="uutf-narration">
        <span className="uutf-narration-label">trace</span>
        <span className="uutf-narration-body">
          {hexCP(cp)} falls in {enc.range.label} ({enc.range.name}) &rarr; {enc.len}{' '}
          byte{enc.len > 1 ? 's' : ''}; {enc.totalPayload} payload bits available, {enc.usedBits}{' '}
          used. The code point&rsquo;s binary fills the x-slots big-endian, right-aligned, giving{' '}
          {enc.bytes.map((b) => b.hex).join(' ')}.
        </span>
      </div>
    </div>
  );
}
