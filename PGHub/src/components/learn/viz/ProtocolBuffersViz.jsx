import React, { useMemo, useState } from 'react';
import { Binary, Hash, Type, ChevronUp, ChevronDown, ChevronRight, RotateCcw, Play } from 'lucide-react';
import './ProtocolBuffersViz.css';

// How a small protobuf message lands on the wire.
//
// Schema:
//   message Person { int32 id = 1; string name = 2; }
//
// Each field is prefixed by a tag byte = (field_number << 3) | wire_type.
//   wire_type 0 = varint           (int32)
//   wire_type 2 = length-delimited (string / bytes)
// Field 1 (id):   tag = (1<<3)|0 = 0x08
// Field 2 (name): tag = (2<<3)|2 = 0x12
//
// Varints are little-endian base-128: each byte carries 7 value bits, the high
// bit (0x80) is a continuation flag (1 = more bytes follow, 0 = final byte).
// Strings encode as: tag, varint length, raw UTF-8 bytes.

const NAME = 'Tom';

// Deterministic id presets chosen to show 1-, 2- and 3-byte varints — never random.
const PRESETS = [1, 150, 300, 16384, 2097152];

// One color token per field so the eye tracks which bytes belong where.
const FIELD_TAG = {
  1: 'var(--hue-violet)',
  2: 'var(--hue-sky)',
};

const toHexByte = (b) => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`;
const toBits = (b) => b.toString(2).padStart(8, '0');

// Correct base-128 little-endian varint encoder.
function toVarint(n) {
  const out = [];
  let v = n >>> 0;
  do {
    let byte = v & 0x7f;
    v = Math.floor(v / 128);
    if (v > 0) byte |= 0x80; // set continuation bit when more bytes follow
    out.push(byte);
  } while (v > 0);
  return out;
}

// Build the full byte stream as an array of annotated byte descriptors.
function buildStream(id) {
  const bytes = [];

  // Field 1 — id (varint, wire type 0)
  const tag1 = (1 << 3) | 0;
  bytes.push({ value: tag1, field: 1, role: 'tag', note: 'tag · field 1 · varint' });
  const idVar = toVarint(id);
  idVar.forEach((b) => {
    const cont = (b & 0x80) !== 0;
    bytes.push({
      value: b,
      field: 1,
      role: cont ? 'varint-cont' : 'varint-end',
      note: cont ? `id varint · continues` : `id varint · final`,
    });
  });

  // Field 2 — name (length-delimited, wire type 2)
  const tag2 = (2 << 3) | 2;
  bytes.push({ value: tag2, field: 2, role: 'tag', note: 'tag · field 2 · len-delimited' });
  const nameBytes = Array.from(new TextEncoder().encode(NAME));
  const lenVar = toVarint(nameBytes.length);
  lenVar.forEach((b) => {
    bytes.push({ value: b, field: 2, role: 'length', note: `length = ${nameBytes.length}` });
  });
  nameBytes.forEach((b, i) => {
    bytes.push({
      value: b,
      field: 2,
      role: 'char',
      note: `UTF-8 '${NAME[i]}'`,
    });
  });

  return { bytes, idVar, nameBytes, tag1, tag2 };
}

export default function ProtocolBuffersViz() {
  const [id, setId] = useState(150);
  const [step, setStep] = useState(0);

  const model = useMemo(() => buildStream(id), [id]);
  const total = model.bytes.length;

  // step 0 = nothing highlighted yet; step k highlights byte index k-1.
  const cursor = step === 0 ? -1 : step - 1;
  const current = cursor >= 0 && cursor < total ? model.bytes[cursor] : null;

  const jsonStr = `{"id":${id},"name":"${NAME}"}`;
  const jsonBytes = new TextEncoder().encode(jsonStr).length;

  const reset = () => {
    setId(150);
    setStep(0);
  };

  const stepPreset = (dir) => {
    const idx = PRESETS.indexOf(id);
    const base = idx === -1 ? 0 : idx;
    const next = (base + dir + PRESETS.length) % PRESETS.length;
    setId(PRESETS[next]);
    setStep(0);
  };

  const advance = () => {
    setStep((s) => (s >= total ? 0 : s + 1));
  };

  const pickId = (p) => {
    setId(p);
    setStep(0);
  };

  // SVG geometry — vertical flow: schema/message header on top, byte row below.
  const W = 940;
  const cols = 7; // wrap the byte row when it grows past 7 cells
  const rows = Math.ceil(total / cols);
  const headH = 150;
  const cellW = 116;
  const cellH = 132;
  const cellGap = 12;
  const gridY = headH + 28;
  const gridW = cols * cellW + (cols - 1) * cellGap;
  const gridX = (W - gridW) / 2;
  const H = gridY + rows * (cellH + cellGap) + 8;

  const wireType = current ? (current.field === 1 ? 0 : 2) : null;

  return (
    <div className="pbv">
      <div className="pbv-head">
        <h3 className="pbv-title">Protocol Buffers — encoding a message to bytes</h3>
        <p className="pbv-sub">
          A two-field message becomes a compact byte stream. Each field starts with a tag byte that packs its
          number and wire type, then the value follows — varints for ints, a length plus raw bytes for strings.
        </p>
      </div>

      <div className="pbv-controls">
        <div className="pbv-presets">
          <span className="pbv-input-label">id</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`pbv-chip ${id === p ? 'is-active' : ''}`}
              onClick={() => pickId(p)}
            >
              {p}
            </button>
          ))}
          <span className="pbv-stepper">
            <button type="button" className="pbv-step-btn" onClick={() => stepPreset(1)} aria-label="Next id">
              <ChevronUp size={13} />
            </button>
            <button type="button" className="pbv-step-btn" onClick={() => stepPreset(-1)} aria-label="Previous id">
              <ChevronDown size={13} />
            </button>
          </span>
        </div>

        <span className="pbv-spacer" aria-hidden="true" />

        <button type="button" className="pbv-btn pbv-btn-primary" onClick={advance}>
          {step === 0 ? <Play size={14} /> : <ChevronRight size={14} />}
          {step === 0 ? 'Walk bytes' : step >= total ? 'Restart' : `Next byte (${step}/${total})`}
        </button>
        <button type="button" className="pbv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="pbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pbv-svg" preserveAspectRatio="xMidYMid meet">
          {/* schema + decoded message */}
          <g transform="translate(24, 20)">
            <Type width={15} height={15} className="pbv-ic" />
          </g>
          <text className="pbv-schema-label" x={46} y={32}>schema</text>
          <text className="pbv-schema" x={46} y={54}>message Person {'{'} int32 id = 1; string name = 2; {'}'}</text>

          <g transform="translate(24, 78)">
            <Binary width={15} height={15} className="pbv-ic" />
          </g>
          <text className="pbv-schema-label" x={46} y={90}>message</text>
          <text className="pbv-msg" x={46} y={112}>
            {'{'} id: <tspan style={{ fill: FIELD_TAG[1] }}>{id}</tspan>, name: <tspan style={{ fill: FIELD_TAG[2] }}>&quot;{NAME}&quot;</tspan> {'}'}
          </text>
          <text className="pbv-stream-label" x={W - 24} y={112}>
            {total} bytes on the wire
          </text>

          {/* divider */}
          <line className="pbv-divider" x1={24} y1={headH - 8} x2={W - 24} y2={headH - 8} />
          <text className="pbv-flow-label" x={24} y={headH + 14}>encoded byte stream (read top-to-bottom, left-to-right)</text>

          {/* byte cells */}
          {model.bytes.map((b, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const cx = gridX + c * (cellW + cellGap);
            const cy = gridY + r * (cellH + cellGap);
            const tag = FIELD_TAG[b.field];
            const isActive = i === cursor;
            const cont = b.role === 'varint-cont';
            return (
              <g key={`byte-${i}`} className={isActive ? 'pbv-cell-active' : ''}>
                <rect
                  className={`pbv-cell ${isActive ? 'is-active' : ''}`}
                  x={cx}
                  y={cy}
                  width={cellW}
                  height={cellH}
                  rx={9}
                  style={{ stroke: isActive ? 'var(--accent)' : tag }}
                />
                <rect x={cx} y={cy} width={cellW} height={6} rx={3} fill={tag} />
                <text className="pbv-cell-idx" x={cx + 10} y={cy + 26}>[{i}]</text>
                <text className="pbv-cell-hex" x={cx + cellW / 2} y={cy + 46} style={{ fill: tag }}>
                  {toHexByte(b.value)}
                </text>
                {/* binary with continuation bit emphasized */}
                <text className="pbv-cell-bits" x={cx + cellW / 2} y={cy + 70}>
                  <tspan
                    className={cont || b.role === 'varint-end' ? 'pbv-bit-cont' : ''}
                    style={cont ? { fill: 'var(--warning)' } : b.role === 'varint-end' ? { fill: 'var(--easy)' } : undefined}
                  >
                    {toBits(b.value)[0]}
                  </tspan>
                  <tspan>{toBits(b.value).slice(1)}</tspan>
                </text>
                <text
                  className="pbv-cell-note"
                  x={cx + cellW / 2}
                  y={cy + 96}
                  textLength={Math.max(20, cellW - 8)}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {b.note}
                </text>
                <text className="pbv-cell-field" x={cx + cellW / 2} y={cy + 116} style={{ fill: tag }}>
                  field {b.field}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pbv-metrics">
        <div className="pbv-metric">
          <span className="pbv-metric-label">protobuf size</span>
          <span className="pbv-metric-value is-pb">{total} bytes</span>
        </div>
        <div className="pbv-metric">
          <span className="pbv-metric-label">JSON size</span>
          <span className="pbv-metric-value is-json">{jsonBytes} bytes</span>
        </div>
        <div className="pbv-metric">
          <span className="pbv-metric-label">id varint</span>
          <span className="pbv-metric-value">
            {model.idVar.length} byte{model.idVar.length > 1 ? 's' : ''} · {model.idVar.map(toHexByte).join(' ')}
          </span>
        </div>
        <div className="pbv-metric">
          <span className="pbv-metric-label">current step</span>
          <span className="pbv-metric-value">
            {current
              ? `field ${current.field} · wire ${wireType} · ${current.note}`
              : 'press Walk bytes'}
          </span>
        </div>
        <div className="pbv-metric">
          <span className="pbv-metric-label">tag breakdown</span>
          <span className="pbv-metric-value">
            {current
              ? current.role === 'tag'
                ? `${toHexByte(current.value)} = (${current.field}<<3)|${wireType}`
                : `belongs to field ${current.field}`
              : `0x08 / 0x12`}
          </span>
        </div>
      </div>

      <div className="pbv-narration">
        <span className="pbv-narration-label">why it matters</span>
        <span className="pbv-narration-body">
          The same record costs {total} bytes in protobuf versus {jsonBytes} as JSON text — no field names, no
          quotes, no braces travel on the wire because the schema already fixes them. Varints make small numbers
          tiny: an id of {id} takes {model.idVar.length} byte{model.idVar.length > 1 ? 's' : ''}, not a fixed 4,
          since each byte carries 7 value bits and only spends more when the number grows. Schema-driven binary
          encoding is how RPC systems stay compact and fast at scale.
        </span>
      </div>
    </div>
  );
}
