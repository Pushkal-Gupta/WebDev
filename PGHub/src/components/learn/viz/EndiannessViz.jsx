import React, { useMemo, useState } from 'react';
import { Binary, Cpu, Network, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import './EndiannessViz.css';

// How a 32-bit integer lands in memory under each byte order.
//
// A value like 0xDEADBEEF is four bytes: B3=DE (most significant) .. B0=EF
// (least significant). Memory is addressed one byte at a time. The CPU's
// "endianness" decides which byte goes at the lowest address:
//   big-endian    -> MSB first: [0x00]=DE [0x01]=AD [0x02]=BE [0x03]=EF
//   little-endian -> LSB first: [0x00]=EF [0x01]=BE [0x02]=AD [0x03]=DE
// Network byte order (used on the wire by TCP/IP) is big-endian, so a
// little-endian host must byte-swap before sending and after receiving.

// Deterministic presets + a stepper that walks a fixed cycle — never random.
const PRESETS = [0xdeadbeef, 0x12345678, 0x0000ff00, 0xcafebabe, 0x00000001];

// One color token per byte position so the eye tracks each byte across layouts.
const BYTE_TAGS = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

const toHexByte = (b) => b.toString(16).toUpperCase().padStart(2, '0');
const toHexWord = (v) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;

export default function EndiannessViz() {
  const [value, setValue] = useState(0xdeadbeef);
  const [wire, setWire] = useState(true);

  // Derived layout: byte split (B3..B0) + the address->byte maps for each order.
  const model = useMemo(() => {
    const v = value >>> 0;
    // bytes indexed by significance: bytes[3] = MSB, bytes[0] = LSB.
    const bytes = [
      v & 0xff,
      (v >>> 8) & 0xff,
      (v >>> 16) & 0xff,
      (v >>> 24) & 0xff,
    ];
    // address 0x00..0x03 -> { byteIdx, hex } for each order.
    const big = [3, 2, 1, 0].map((bi) => ({ byteIdx: bi, hex: toHexByte(bytes[bi]) }));
    const little = [0, 1, 2, 3].map((bi) => ({ byteIdx: bi, hex: toHexByte(bytes[bi]) }));
    return { v, bytes, big, little };
  }, [value]);

  const reset = () => {
    setValue(0xdeadbeef);
    setWire(true);
  };

  const stepPreset = (dir) => {
    const idx = PRESETS.indexOf(value);
    if (idx === -1) {
      setValue(PRESETS[0]);
      return;
    }
    const next = (idx + dir + PRESETS.length) % PRESETS.length;
    setValue(PRESETS[next]);
  };

  // SVG geometry
  const W = 940;
  const H = 470;
  const wordX = 24;
  const wordY = 56;
  const wordW = W - 48;
  const cellGap = 14;
  const srcCellW = (wordW - cellGap * 3) / 4;

  const layoutY = 224;
  const layoutW = (wordW - 40) / 2;
  const bigX = wordX;
  const litX = wordX + layoutW + 40;
  const memCellW = (layoutW - cellGap * 3) / 4;
  const cellH = 96;

  const bigStr = model.big.map((c, i) => `[0${i}]=${c.hex}`).join(' ');
  const litStr = model.little.map((c, i) => `[0${i}]=${c.hex}`).join(' ');

  // source byte boxes, labelled B3..B0 left to right (MSB..LSB)
  const srcBytes = [3, 2, 1, 0];

  const renderLayout = (label, sub, cells, x, isWire) => (
    <g>
      <rect
        className={`edv-layout ${isWire && wire ? 'is-wire' : ''}`}
        x={x}
        y={layoutY}
        width={layoutW}
        height={cellH + 78}
        rx={11}
      />
      <g transform={`translate(${x + 14}, ${layoutY + 13})`}>
        {isWire
          ? <Network width={16} height={16} className="edv-ic" />
          : <Cpu width={16} height={16} className="edv-ic" />}
      </g>
      <text className="edv-layout-title" x={x + 38} y={layoutY + 26}>{label}</text>
      <text className="edv-layout-sub" x={x + layoutW - 12} y={layoutY + 26}>{sub}</text>
      {isWire && wire && (
        <text className="edv-wire-tag" x={x + layoutW - 12} y={layoutY + cellH + 64}>
          network byte order — sent on the wire
        </text>
      )}
      {cells.map((c, i) => {
        const cx = x + 14 + i * (memCellW + cellGap);
        const cy = layoutY + 44;
        const tag = BYTE_TAGS[c.byteIdx];
        return (
          <g key={`${label}-${i}`}>
            <rect
              className="edv-mem-cell"
              x={cx}
              y={cy}
              width={memCellW}
              height={cellH}
              rx={8}
              style={{ stroke: tag }}
            />
            <rect x={cx} y={cy} width={memCellW} height={6} rx={3} fill={tag} />
            <text className="edv-mem-addr" x={cx + memCellW / 2} y={cy + 28}>
              0x0{i}
            </text>
            <text className="edv-mem-byte" x={cx + memCellW / 2} y={cy + 64} style={{ fill: tag }}>
              {c.hex}
            </text>
            <text className="edv-mem-tag" x={cx + memCellW / 2} y={cy + 86}>
              B{c.byteIdx}
            </text>
          </g>
        );
      })}
    </g>
  );

  return (
    <div className="edv">
      <div className="edv-head">
        <h3 className="edv-title">Endianness — one integer, two byte orders in memory</h3>
        <p className="edv-sub">
          A 32-bit value is four bytes. Big-endian stores the most significant byte at the lowest address;
          little-endian stores the least significant first. Track each color across both layouts to see the reversal.
        </p>
      </div>

      <div className="edv-controls">
        <div className="edv-presets">
          <span className="edv-input-label">value</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`edv-chip ${value === p ? 'is-active' : ''}`}
              onClick={() => setValue(p)}
            >
              {toHexWord(p)}
            </button>
          ))}
          <span className="edv-stepper">
            <button type="button" className="edv-step-btn" onClick={() => stepPreset(1)} aria-label="Next value">
              <ChevronUp size={13} />
            </button>
            <button type="button" className="edv-step-btn" onClick={() => stepPreset(-1)} aria-label="Previous value">
              <ChevronDown size={13} />
            </button>
          </span>
        </div>

        <span className="edv-spacer" aria-hidden="true" />

        <button
          type="button"
          className={`edv-btn ${wire ? 'edv-btn-primary' : ''}`}
          onClick={() => setWire((v) => !v)}
        >
          <Network size={14} /> {wire ? 'Wire = big-endian' : 'Mark wire format'}
        </button>
        <button type="button" className="edv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="edv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="edv-svg" preserveAspectRatio="xMidYMid meet">
          {/* source word: 0xXXXXXXXX split into 4 color-tagged bytes B3..B0 */}
          <g transform={`translate(${wordX + 2}, 24)`}>
            <Binary width={16} height={16} className="edv-ic" />
          </g>
          <text className="edv-word-title" x={wordX + 26} y={37}>
            {toHexWord(model.v)}
          </text>
          <text className="edv-word-sub" x={wordX + wordW} y={37}>
            32-bit value · {model.v} (unsigned)
          </text>
          {srcBytes.map((bi, i) => {
            const cx = wordX + i * (srcCellW + cellGap);
            const tag = BYTE_TAGS[bi];
            return (
              <g key={`src-${bi}`}>
                <rect
                  className="edv-src-cell"
                  x={cx}
                  y={wordY}
                  width={srcCellW}
                  height={88}
                  rx={9}
                  style={{ stroke: tag }}
                />
                <rect x={cx} y={wordY} width={srcCellW} height={6} rx={3} fill={tag} />
                <text className="edv-src-label" x={cx + srcCellW / 2} y={wordY + 28}>
                  B{bi}
                </text>
                <text className="edv-src-byte" x={cx + srcCellW / 2} y={wordY + 62} style={{ fill: tag }}>
                  {toHexByte(model.bytes[bi])}
                </text>
                <text className="edv-src-sig" x={cx + srcCellW / 2} y={wordY + 80}>
                  {bi === 3 ? 'MSB' : bi === 0 ? 'LSB' : `bits ${bi * 8}–${bi * 8 + 7}`}
                </text>
              </g>
            );
          })}

          {/* low / high address axis hint */}
          <text className="edv-axis" x={bigX + 14} y={layoutY - 6}>low addr →</text>
          <text className="edv-axis edv-axis-end" x={bigX + layoutW - 4} y={layoutY - 6}>→ high addr</text>
          <text className="edv-axis" x={litX + 14} y={layoutY - 6}>low addr →</text>
          <text className="edv-axis edv-axis-end" x={litX + layoutW - 4} y={layoutY - 6}>→ high addr</text>

          {renderLayout('Big-endian', 'MSB at 0x00', model.big, bigX, true)}
          {renderLayout('Little-endian', 'LSB at 0x00', model.little, litX, false)}
        </svg>
      </div>

      <div className="edv-metrics">
        <div className="edv-metric">
          <span className="edv-metric-label">value (hex)</span>
          <span className="edv-metric-value">{toHexWord(model.v)}</span>
        </div>
        <div className="edv-metric">
          <span className="edv-metric-label">value (decimal)</span>
          <span className="edv-metric-value">{model.v}</span>
        </div>
        <div className="edv-metric">
          <span className="edv-metric-label">bytes (MSB→LSB)</span>
          <span className="edv-metric-value">
            {[3, 2, 1, 0].map((bi) => toHexByte(model.bytes[bi])).join(' ')}
          </span>
        </div>
        <div className="edv-metric">
          <span className="edv-metric-label">big-endian (wire)</span>
          <span className="edv-metric-value is-be">BE: {bigStr}</span>
        </div>
        <div className="edv-metric">
          <span className="edv-metric-label">little-endian (x86)</span>
          <span className="edv-metric-value is-le">LE: {litStr}</span>
        </div>
      </div>

      <div className="edv-narration">
        <span className="edv-narration-label">why it matters</span>
        <span className="edv-narration-body">
          The same four bytes sit in opposite order under each scheme — reading {toHexWord(model.v)} from a
          little-endian dump byte-by-byte looks backwards. TCP/IP fixes a single wire convention: network byte
          order is big-endian, so a little-endian host (x86, most ARM) must byte-swap with htonl/ntohl before
          sending and after receiving, or the peer decodes a scrambled integer.
        </span>
      </div>
    </div>
  );
}
