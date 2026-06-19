import React, { useMemo, useState } from 'react';
import { Binary, Calculator, AlertTriangle } from 'lucide-react';
import './FloatingPointViz.css';

// Decompose a JS number into IEEE-754 single-precision (32-bit) fields by
// round-tripping through a Float32Array. The stored value is the nearest
// representable float32, so (target - stored) is the rounding error.
function decompose(target) {
  const f32 = new Float32Array(1);
  f32[0] = target;
  const stored = f32[0];
  const bits = new Uint32Array(f32.buffer)[0];

  const sign = (bits >>> 31) & 0x1;
  const expBits = (bits >>> 23) & 0xff;
  const mantBits = bits & 0x7fffff;

  const bitStr = bits.toString(2).padStart(32, '0');
  const signStr = bitStr[0];
  const expStr = bitStr.slice(1, 9);
  const mantStr = bitStr.slice(9);

  let kind = 'normal';
  if (expBits === 0) kind = mantBits === 0 ? 'zero' : 'subnormal';
  else if (expBits === 255) kind = mantBits === 0 ? 'inf' : 'nan';

  const unbiasedExp = expBits - 127;
  // mantissa fraction value 1.bbbb (or 0.bbbb for subnormals)
  const mantFraction = mantBits / 2 ** 23;
  const significand = kind === 'subnormal' ? mantFraction : 1 + mantFraction;

  const error = target - stored;

  return {
    target, stored, bits, sign, expBits, mantBits,
    signStr, expStr, mantStr, bitStr,
    kind, unbiasedExp, mantFraction, significand, error,
  };
}

export default function FloatingPointViz() {
  // slider drives a 0..1000 index mapped to a friendly value range
  const [raw, setRaw] = useState(314);
  const value = useMemo(() => (raw - 500) / 50, [raw]); // -10 .. +10, step 0.02

  const d = useMemo(() => decompose(value), [value]);

  // SVG geometry
  const W = 940;
  const H = 250;
  const left = 28;
  const top = 64;
  const rowH = 52;
  const gap = 6;
  // field widths proportional to bit count: 1 / 8 / 23
  const usable = W - left * 2;
  const unit = usable / 32;
  const signW = unit * 1;
  const expW = unit * 8;
  const mantW = unit * 23;
  const signX = left;
  const expX = signX + signW + gap;
  const mantX = expX + expW + gap;

  const renderBits = (str, x0, fieldW, cls) => {
    const n = str.length;
    const bw = (fieldW - gap * (n - 1)) / n;
    return str.split('').map((b, i) => {
      const bx = x0 + i * (bw + gap);
      return (
        <g key={`${cls}-${i}`}>
          <rect x={bx} y={top} width={bw} height={rowH} rx={3}
            className={`fpv-bit ${cls} ${b === '1' ? 'is-set' : ''}`} />
          <text x={bx + bw / 2} y={top + rowH / 2 + 5} className="fpv-bit-glyph" textAnchor="middle">{b}</text>
        </g>
      );
    });
  };

  const fmt = (n) => {
    if (!Number.isFinite(n)) return String(n);
    if (n === 0) return '0';
    const a = Math.abs(n);
    if (a >= 1e-4 && a < 1e7) return Number(n.toPrecision(9)).toString();
    return n.toExponential(6);
  };

  const errMag = Math.abs(d.error);
  const exactErr = errMag === 0;

  return (
    <div className="fpv">
      <div className="fpv-head">
        <h3 className="fpv-title">IEEE-754 single precision — anatomy of a 32-bit float</h3>
        <p className="fpv-sub">
          One sign bit, an 8-bit biased exponent, and a 23-bit mantissa. The value is
          (-1)^s · 1.mantissa · 2^(e-127). Most decimals are not exactly representable — the gap is rounding error.
        </p>
      </div>

      <div className="fpv-controls">
        <label className="fpv-slider">
          <span className="fpv-input-label">value</span>
          <input type="range" min={0} max={1000} step={1} value={raw}
            onChange={(e) => setRaw(Number(e.target.value))} className="fpv-range" aria-label="Pick a number" />
          <span className="fpv-slider-val">{fmt(value)}</span>
        </label>
      </div>

      <div className="fpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fpv-svg" preserveAspectRatio="xMidYMid meet"
          role="img" aria-label="IEEE-754 32-bit float bit layout">
          <text x={signX + signW / 2} y={42} className="fpv-field-label fpv-l-sign" textAnchor="middle">sign</text>
          <text x={expX + expW / 2} y={42} className="fpv-field-label fpv-l-exp" textAnchor="middle">
            exponent (8b, bias 127)
          </text>
          <text x={mantX + mantW / 2} y={42} className="fpv-field-label fpv-l-mant" textAnchor="middle">
            mantissa (23b)
          </text>

          {renderBits(d.signStr, signX, signW, 'fpv-f-sign')}
          {renderBits(d.expStr, expX, expW, 'fpv-f-exp')}
          {renderBits(d.mantStr, mantX, mantW, 'fpv-f-mant')}

          {/* decomposition line */}
          <text x={signX + signW / 2} y={top + rowH + 26} className="fpv-under fpv-l-sign" textAnchor="middle">
            (-1)^{d.sign}
          </text>
          <text x={expX + expW / 2} y={top + rowH + 26} className="fpv-under fpv-l-exp" textAnchor="middle">
            e = {d.expBits} - 127 = {d.unbiasedExp}
          </text>
          <text x={mantX + mantW / 2} y={top + rowH + 26} className="fpv-under fpv-l-mant" textAnchor="middle">
            {d.kind === 'subnormal' ? '0' : '1'}.{d.mantBits.toString(2).padStart(23, '0')}₂ = {d.significand.toPrecision(8)}
          </text>

          <text x={W / 2} y={top + rowH + 64} className="fpv-recon" textAnchor="middle">
            {d.kind === 'normal' || d.kind === 'subnormal'
              ? `(-1)^${d.sign} · ${d.significand.toPrecision(8)} · 2^${d.unbiasedExp} = ${fmt(d.stored)}`
              : `special value: ${d.kind.toUpperCase()}`}
          </text>
          <text x={W / 2} y={top + rowH + 88} className={`fpv-err-line ${exactErr ? 'is-exact' : 'is-approx'}`} textAnchor="middle">
            {exactErr
              ? 'stored exactly — no rounding error'
              : `you asked for ${fmt(d.target)}; stored ${fmt(d.stored)}; error ${d.error >= 0 ? '+' : ''}${d.error.toExponential(3)}`}
          </text>
        </svg>
      </div>

      <div className="fpv-metrics">
        <div className="fpv-metric">
          <span className="fpv-metric-label"><Binary size={11} /> 32 bits</span>
          <span className="fpv-metric-value fpv-bits">
            <span className="fpv-l-sign">{d.signStr}</span>{' '}
            <span className="fpv-l-exp">{d.expStr}</span>{' '}
            <span className="fpv-l-mant">{d.mantStr}</span>
          </span>
        </div>
        <div className="fpv-metric">
          <span className="fpv-metric-label">sign · exp · mant</span>
          <span className="fpv-metric-value">{d.sign} · {d.expBits} · {d.mantBits}</span>
        </div>
        <div className="fpv-metric">
          <span className="fpv-metric-label"><Calculator size={11} /> reconstructed</span>
          <span className="fpv-metric-value is-ok">{fmt(d.stored)}</span>
        </div>
        <div className="fpv-metric">
          <span className="fpv-metric-label"><AlertTriangle size={11} /> rounding error</span>
          <span className={`fpv-metric-value ${exactErr ? 'is-ok' : 'is-warn'}`}>
            {exactErr ? '0 (exact)' : `${d.error >= 0 ? '+' : ''}${d.error.toExponential(3)}`}
          </span>
        </div>
      </div>

      <div className="fpv-narration">
        <span className="fpv-narration-label">trace</span>
        <span className="fpv-narration-body">
          {d.kind === 'normal' || d.kind === 'subnormal'
            ? `${fmt(value)} → (-1)^${d.sign}·${d.significand.toPrecision(6)}·2^${d.unbiasedExp} = ${fmt(d.stored)}. ${exactErr ? 'Exact in binary.' : `Nearest float32 differs by ${errMag.toExponential(2)} — that residual is why 0.1+0.2 ≠ 0.3.`}`
            : `${fmt(value)} encodes the special value ${d.kind.toUpperCase()} (exponent all-ones or all-zeros).`}
        </span>
      </div>
    </div>
  );
}
