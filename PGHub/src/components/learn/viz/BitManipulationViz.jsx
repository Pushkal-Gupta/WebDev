import React, { useMemo, useState } from 'react';
import { Lightbulb, Eraser, Repeat, ScanSearch, Crosshair, Trash2, Sigma, CircleDot } from 'lucide-react';
import './BitManipulationViz.css';

const BITS = 8;

function toBits(n) {
  const out = [];
  for (let i = BITS - 1; i >= 0; i--) out.push((n >> i) & 1);
  return out;
}

function bitsStr(n) {
  return toBits(n).join('');
}

function popcount(n) {
  let c = 0;
  let x = n;
  while (x !== 0) {
    x &= x - 1;
    c += 1;
  }
  return c;
}

function lowestSetIndex(n) {
  if (n === 0) return -1;
  let i = 0;
  while (((n >> i) & 1) === 0) i += 1;
  return i;
}

function clampN(v, min, max) {
  if (!Number.isFinite(v)) return min;
  const i = Math.trunc(v);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

// Each op returns the after-value plus metadata: which bit positions changed,
// which positions to highlight (no change), a formula string, and a result line.
function computeOp(op, x, i) {
  const before = x & 0xff;
  switch (op) {
    case 'set': {
      const after = (before | (1 << i)) & 0xff;
      return {
        name: `Set bit ${i}`,
        formula: `x | (1 << ${i})`,
        after,
        changed: before === after ? [] : [i],
        highlight: [i],
        result: `bit ${i} forced to 1`,
      };
    }
    case 'clear': {
      const after = (before & ~(1 << i)) & 0xff;
      return {
        name: `Clear bit ${i}`,
        formula: `x & ~(1 << ${i})`,
        after,
        changed: before === after ? [] : [i],
        highlight: [i],
        result: `bit ${i} forced to 0`,
      };
    }
    case 'toggle': {
      const after = (before ^ (1 << i)) & 0xff;
      return {
        name: `Toggle bit ${i}`,
        formula: `x ^ (1 << ${i})`,
        after,
        changed: [i],
        highlight: [i],
        result: `bit ${i} flipped`,
      };
    }
    case 'check': {
      const bit = (before >> i) & 1;
      return {
        name: `Check bit ${i}`,
        formula: `(x >> ${i}) & 1`,
        after: before,
        changed: [],
        highlight: [i],
        result: `bit ${i} = ${bit}`,
      };
    }
    case 'lowest': {
      const after = (before & -before) & 0xff;
      const idx = lowestSetIndex(before);
      return {
        name: 'Lowest set bit',
        formula: 'x & -x',
        after,
        changed: [],
        highlight: idx >= 0 ? [idx] : [],
        result: before === 0 ? 'no set bits → 0' : `isolates bit ${idx} (value ${1 << idx})`,
      };
    }
    case 'clearlow': {
      const after = (before & (before - 1)) & 0xff;
      const idx = lowestSetIndex(before);
      return {
        name: 'Clear lowest set bit',
        formula: 'x & (x - 1)',
        after,
        changed: idx >= 0 ? [idx] : [],
        highlight: idx >= 0 ? [idx] : [],
        result: before === 0 ? 'already 0' : `cleared lowest 1-bit at ${idx}`,
      };
    }
    case 'popcount': {
      return {
        name: 'Count set bits',
        formula: 'popcount(x)',
        after: before,
        changed: [],
        highlight: toBits(before).map((v, c) => (v === 1 ? BITS - 1 - c : -1)).filter((p) => p >= 0),
        result: `${popcount(before)} bits set`,
      };
    }
    case 'pow2': {
      const isPow = before !== 0 && (before & (before - 1)) === 0;
      const idx = lowestSetIndex(before);
      return {
        name: 'Is power of two',
        formula: 'x != 0 && (x & (x-1)) == 0',
        after: before,
        changed: [],
        highlight: isPow && idx >= 0 ? [idx] : [],
        result: isPow ? `true — single bit at ${idx} (2^${idx})` : 'false',
      };
    }
    default:
      return {
        name: '—',
        formula: '',
        after: before,
        changed: [],
        highlight: [],
        result: '',
      };
  }
}

const OPS = [
  { key: 'set', label: 'Set bit i', icon: Lightbulb, needsI: true, mutates: true },
  { key: 'clear', label: 'Clear bit i', icon: Eraser, needsI: true, mutates: true },
  { key: 'toggle', label: 'Toggle bit i', icon: Repeat, needsI: true, mutates: true },
  { key: 'check', label: 'Check bit i', icon: ScanSearch, needsI: true, mutates: false },
  { key: 'lowest', label: 'Lowest set bit', icon: Crosshair, needsI: false, mutates: false },
  { key: 'clearlow', label: 'Clear lowest', icon: Trash2, needsI: false, mutates: true },
  { key: 'popcount', label: 'Count set bits', icon: Sigma, needsI: false, mutates: false },
  { key: 'pow2', label: 'Power of two?', icon: CircleDot, needsI: false, mutates: false },
];

const DEFAULT_X = 22; // 00010110

export default function BitManipulationViz() {
  const [x, setX] = useState(DEFAULT_X);
  const [bitIndex, setBitIndex] = useState(0);
  const [op, setOp] = useState('set');

  const meta = useMemo(() => OPS.find((o) => o.key === op), [op]);
  const result = useMemo(() => computeOp(op, x, bitIndex), [op, x, bitIndex]);

  const beforeBits = useMemo(() => toBits(x & 0xff), [x]);
  const afterBits = useMemo(() => toBits(result.after), [result.after]);

  const changedSet = useMemo(() => new Set(result.changed), [result.changed]);
  const highlightSet = useMemo(() => new Set(result.highlight), [result.highlight]);

  const applyOp = (key) => {
    const m = OPS.find((o) => o.key === key);
    setOp(key);
    if (m && m.mutates) {
      const r = computeOp(key, x, bitIndex);
      setX(r.after);
    }
  };

  const W = 940;
  const H = 348;
  const cellGap = 8;
  const bitsLeft = 176;
  const bitsRight = W - 56;
  const bitsUsable = bitsRight - bitsLeft;
  const cellW = (bitsUsable - cellGap * (BITS - 1)) / BITS;
  const cellX = (c) => bitsLeft + c * (cellW + cellGap);
  const cellH = 56;
  const posOfCol = (c) => BITS - 1 - c;

  const rowBeforeY = 92;
  const rowAfterY = 200;

  const renderRow = (bits, y, kind) => bits.map((v, c) => {
    const pos = posOfCol(c);
    const isChanged = changedSet.has(pos);
    const isHi = highlightSet.has(pos);
    let fill = 'var(--bg)';
    let stroke = 'var(--border)';
    let textFill = v === 1 ? 'var(--bg)' : 'var(--text-dim)';
    if (kind === 'before') {
      if (isHi) { fill = 'var(--hue-sky)'; stroke = 'var(--hue-sky)'; textFill = 'var(--bg)'; }
      else if (v === 1) { fill = 'rgba(var(--accent-rgb), 0.55)'; stroke = 'var(--accent)'; textFill = 'var(--bg)'; }
    } else {
      if (isChanged) { fill = 'var(--hue-pink)'; stroke = 'var(--hue-pink)'; textFill = 'var(--bg)'; }
      else if (isHi) { fill = 'var(--hue-mint)'; stroke = 'var(--hue-mint)'; textFill = 'var(--bg)'; }
      else if (v === 1) { fill = 'var(--easy)'; stroke = 'var(--easy)'; textFill = 'var(--bg)'; }
    }
    return (
      <g key={`${kind}-${c}`} className={isChanged && kind === 'after' ? 'bmv-cell-flip' : ''}>
        <rect x={cellX(c)} y={y} width={cellW} height={cellH} rx={6}
          fill={fill} stroke={stroke} strokeWidth={isChanged || isHi ? 2.6 : 1.2} />
        <text x={cellX(c) + cellW / 2} y={y + cellH / 2 + 7} className="bmv-bit"
          style={{ fill: textFill }}>{v}</text>
      </g>
    );
  });

  const decimal = x & 0xff;

  return (
    <div className="bmv">
      <div className="bmv-head">
        <h3 className="bmv-title">Bit manipulation tricks — 8-bit register</h3>
        <p className="bmv-sub">
          Pick a number 0&ndash;255 and a bit index, then fire common one-liners. Mutating ops rewrite
          x in place; query ops just highlight. Changed cells flash pink, examined cells glow.
        </p>
      </div>

      <div className="bmv-controls">
        <div className="bmv-sliders">
          <label className="bmv-slider">
            <span className="bmv-slider-label">x = {decimal}</span>
            <input
              type="range"
              min={0}
              max={255}
              step={1}
              value={decimal}
              onChange={(e) => setX(clampN(Number(e.target.value), 0, 255))}
              className="bmv-range"
              aria-label="value x, 0 to 255"
            />
            <span className="bmv-slider-bin">{bitsStr(decimal)}</span>
          </label>
          <label className="bmv-slider">
            <span className="bmv-slider-label">bit i = {bitIndex}</span>
            <input
              type="range"
              min={0}
              max={BITS - 1}
              step={1}
              value={bitIndex}
              onChange={(e) => setBitIndex(clampN(Number(e.target.value), 0, BITS - 1))}
              className="bmv-range bmv-range-narrow"
              aria-label="bit index 0 to 7"
            />
            <span className="bmv-slider-bin">place {1 << bitIndex}</span>
          </label>
        </div>

        <div className="bmv-ops">
          {OPS.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.key}
                type="button"
                className={`bmv-op ${op === o.key ? 'bmv-op-active' : ''}`}
                onClick={() => applyOp(o.key)}
              >
                <Icon size={14} /> {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bmv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bmv-svg" preserveAspectRatio="xMidYMid meet"
          role="img" aria-label="8-bit register bit manipulation">
          <rect x={20} y={20} width={W - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={44} className="bmv-row-label">8-bit register (MSB left, place values 128 .. 1)</text>

          {meta && meta.needsI && (
            <rect
              x={cellX(BITS - 1 - bitIndex) - 4}
              y={rowBeforeY - 28}
              width={cellW + 8}
              height={rowAfterY + cellH - rowBeforeY + 34}
              fill="rgba(var(--accent-rgb), 0.10)"
              stroke="var(--hue-pink)"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              rx={6}
            />
          )}

          {Array.from({ length: BITS }).map((_, c) => (
            <text key={`pv-${c}`} x={cellX(c) + cellW / 2} y={rowBeforeY - 12} className="bmv-place">
              {1 << posOfCol(c)}
            </text>
          ))}

          <text x={36} y={rowBeforeY + cellH / 2 + 6} className="bmv-reg-label">
            x = {decimal}
          </text>
          {renderRow(beforeBits, rowBeforeY, 'before')}

          <text x={bitsLeft - 28} y={(rowBeforeY + rowAfterY) / 2 + cellH / 2 + 4} className="bmv-op-glyph">
            {meta && meta.mutates ? '↓' : '≡'}
          </text>
          <text x={36} y={rowAfterY + cellH / 2 + 6} className="bmv-reg-label bmv-reg-res">
            {meta && meta.mutates ? 'x′' : 'view'} = {result.after}
          </text>
          {renderRow(afterBits, rowAfterY, 'after')}

          <text x={32} y={rowAfterY + cellH + 34} className="bmv-formula-svg">
            {result.name}: {result.formula}
          </text>
        </svg>
      </div>

      <div className="bmv-metrics">
        <div className="bmv-metric">
          <span className="bmv-metric-label">operation</span>
          <span className="bmv-metric-value">{result.name}</span>
        </div>
        <div className="bmv-metric">
          <span className="bmv-metric-label">formula</span>
          <span className="bmv-metric-value">{result.formula}</span>
        </div>
        <div className="bmv-metric">
          <span className="bmv-metric-label">before</span>
          <span className="bmv-metric-value">{bitsStr(decimal)} · {decimal}</span>
        </div>
        <div className="bmv-metric">
          <span className="bmv-metric-label">after</span>
          <span className="bmv-metric-value">{bitsStr(result.after)} · {result.after}</span>
        </div>
        <div className="bmv-metric bmv-metric-dim">
          <span className="bmv-metric-label">result</span>
          <span className="bmv-metric-value bmv-metric-dimval">{result.result}</span>
        </div>
      </div>

      <div className="bmv-trace">
        <span className="bmv-trace-label">trace</span>
        <span className="bmv-trace-vals">
          {meta && meta.mutates
            ? `${result.formula} = ${bitsStr(decimal)} → ${bitsStr(result.after)} (${result.after}). ${result.result}.`
            : `${result.formula} on ${bitsStr(decimal)} (${decimal}) → ${result.result}. x unchanged.`}
        </span>
      </div>
    </div>
  );
}
