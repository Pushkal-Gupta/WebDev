import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './MatrixExpoViz.css';

const M = [[1, 1], [1, 0]];
const IDENT = [[1, 0], [0, 1]];

function matMul(a, b) {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
}

function cloneMat(m) {
  return [[m[0][0], m[0][1]], [m[1][0], m[1][1]]];
}

// Bits of n, least-significant first — the order binary exponentiation consumes them.
function bitsLSB(n) {
  if (n === 0) return [0];
  const out = [];
  let e = n;
  while (e > 0) {
    out.push(e & 1);
    e = Math.floor(e / 2);
  }
  return out;
}

function bitsStr(n) {
  if (n === 0) return '0';
  return n.toString(2);
}

// The four scalar dot products that form a 2x2 product, with operand labels.
function dotProducts(a, b) {
  return [
    { r: 0, c: 0, terms: `${a[0][0]}·${b[0][0]} + ${a[0][1]}·${b[1][0]}`, val: a[0][0] * b[0][0] + a[0][1] * b[1][0] },
    { r: 0, c: 1, terms: `${a[0][0]}·${b[0][1]} + ${a[0][1]}·${b[1][1]}`, val: a[0][0] * b[0][1] + a[0][1] * b[1][1] },
    { r: 1, c: 0, terms: `${a[1][0]}·${b[0][0]} + ${a[1][1]}·${b[1][0]}`, val: a[1][0] * b[0][0] + a[1][1] * b[1][0] },
    { r: 1, c: 1, terms: `${a[1][0]}·${b[0][1]} + ${a[1][1]}·${b[1][1]}`, val: a[1][0] * b[0][1] + a[1][1] * b[1][1] },
  ];
}

// Build the full square-and-multiply trace for M^n with M = [[1,1],[1,0]].
function buildFrames(n) {
  const frames = [];
  const bits = bitsLSB(n);
  let result = cloneMat(IDENT);
  let base = cloneMat(M);

  const snap = (extra) => ({
    result: cloneMat(result),
    base: cloneMat(base),
    bitIndex: -1,
    bits,
    op: null,
    products: null,
    operandA: null,
    operandB: null,
    target: null,
    fib: result[0][1],
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Fibonacci satisfies [F(k+1), F(k)] = M · [F(k), F(k-1)] with M = [[1,1],[1,0]]. So M^n = [[F(n+1), F(n)], [F(n), F(n-1)]], and Fib(n) = (M^n)[0][1]. Compute M^${n} by squaring base and multiplying into result over the bits of n = ${bitsStr(n)}.`,
  }));

  for (let bi = 0; bi < bits.length; bi += 1) {
    const bit = bits[bi];
    const place = 1 << bi;

    frames.push(snap({
      phase: 'read',
      bitIndex: bi,
      note: `Bit ${bi} of n (value ${place}) is ${bit}. ${bit ? `Set — fold the current base (= M^${place}) into result, then square base.` : `Zero — skip the multiply; just square base to advance to M^${place * 2}.`}`,
    }));

    if (bit === 1) {
      const prods = dotProducts(result, base);
      frames.push(snap({
        phase: 'mul',
        bitIndex: bi,
        op: 'multiply',
        operandA: cloneMat(result),
        operandB: cloneMat(base),
        products: prods,
        target: 'result',
        note: `result = result · base. Each output cell is a row·column dot product of the two 2x2 matrices (shown below). base here equals M^${place}.`,
      }));
      result = matMul(result, base);
      frames.push(snap({
        phase: 'mul-done',
        bitIndex: bi,
        op: 'multiply',
        target: 'result',
        note: `result updated. Fib so far = result[0][1] = ${result[0][1]}. Now square the base.`,
      }));
    }

    const isLast = bi === bits.length - 1;
    const sqProds = dotProducts(base, base);
    frames.push(snap({
      phase: 'square',
      bitIndex: bi,
      op: 'square',
      operandA: cloneMat(base),
      operandB: cloneMat(base),
      products: sqProds,
      target: 'base',
      note: `base = base · base — squaring doubles the exponent (M^${place} -> M^${place * 2}).${isLast ? ' This is the last bit; after squaring we are done.' : ''}`,
    }));
    base = matMul(base, base);
    frames.push(snap({
      phase: 'square-done',
      bitIndex: bi,
      op: 'square',
      target: 'base',
      note: `base squared -> now M^${place * 2}. ${isLast ? 'No higher bits remain.' : `Move to bit ${bi + 1}.`}`,
    }));
  }

  frames.push(snap({
    phase: 'done',
    note: `Done. result = M^${n}, so Fib(${n}) = result[0][1] = ${result[0][1]}. Only ${bits.length} bit${bits.length === 1 ? '' : 's'} processed -> O(log n) matrix multiplies versus O(n) for the naive loop.`,
  }));

  return frames;
}

function clampN(v) {
  if (!Number.isFinite(v)) return 0;
  const i = Math.trunc(v);
  if (i < 0) return 0;
  if (i > 30) return 30;
  return i;
}

const DEFAULT_N = 13;

export default function MatrixExpoViz() {
  const [nInput, setNInput] = useState(DEFAULT_N);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(nInput), [nInput]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const applyN = (raw) => {
    const v = clampN(Number(raw));
    setIsRunningRaw(false);
    setStep(0);
    setNInput(v);
  };

  const W = 940;
  const H = 360;

  // Three matrix slots: M (constant), result, base. Layout boxes.
  const cellW = 58;
  const cellH = 44;
  const matW = cellW * 2 + 10;
  const matH = cellH * 2 + 10;

  const slotY = 78;
  const slots = useMemo(() => {
    const gap = 40;
    const totalW = matW * 3 + gap * 2;
    const startX = (W - totalW) / 2;
    return {
      M: startX,
      result: startX + matW + gap,
      base: startX + (matW + gap) * 2,
    };
  }, [matW]);

  const renderMatrix = (mat, x, opts) => {
    const { highlight, dim, ringColor } = opts || {};
    return (
      <g>
        {ringColor && (
          <rect
            x={x - 6}
            y={slotY - 6}
            width={matW + 12}
            height={matH + 12}
            rx={10}
            fill="none"
            stroke={ringColor}
            strokeWidth={2.4}
            strokeDasharray="5 4"
          />
        )}
        {/* bracket cues */}
        <path d={`M ${x + 6} ${slotY} L ${x} ${slotY} L ${x} ${slotY + matH} L ${x + 6} ${slotY + matH}`}
          fill="none" stroke="var(--text-dim)" strokeWidth={1.6} />
        <path d={`M ${x + matW - 6} ${slotY} L ${x + matW} ${slotY} L ${x + matW} ${slotY + matH} L ${x + matW - 6} ${slotY + matH}`}
          fill="none" stroke="var(--text-dim)" strokeWidth={1.6} />
        {[0, 1].map((r) => [0, 1].map((c) => {
          const cx = x + 8 + c * (cellW + 2);
          const cy = slotY + 5 + r * (cellH + 2);
          const isHi = highlight && highlight.r === r && highlight.c === c;
          let fill = 'var(--bg)';
          let stroke = 'var(--border)';
          let textFill = 'var(--text-main)';
          if (isHi) { fill = 'var(--hue-mint)'; stroke = 'var(--hue-mint)'; textFill = 'var(--bg)'; }
          else if (dim) { textFill = 'var(--text-dim)'; }
          return (
            <g key={`${r}-${c}`}>
              <rect x={cx} y={cy} width={cellW} height={cellH} rx={6}
                fill={fill} stroke={stroke} strokeWidth={isHi ? 2.4 : 1.2} />
              <text x={cx + cellW / 2} y={cy + cellH / 2 + 6} className="mxv-cell"
                style={{ fill: textFill }}>{mat[r][c]}</text>
            </g>
          );
        }))}
      </g>
    );
  };

  // Which matrices are operands / target this step.
  const op = current.op;
  const target = current.target;
  const products = current.products;

  // The product cell currently emphasized (cycle through 4 over the mul/square frame is static;
  // emphasize whole grid — but we highlight target ring).
  const resultRing = target === 'result' ? 'var(--accent)' : null;
  const baseRing = target === 'base' || op === 'square' ? 'var(--hue-sky)' : null;

  const bits = current.bits;
  const activeBit = current.bitIndex;

  // bit strip layout (LSB on the right to read like a normal binary number)
  const bitBoxW = 30;
  const bitGap = 6;
  const bitStripW = bits.length * bitBoxW + (bits.length - 1) * bitGap;
  const bitStartX = (W - bitStripW) / 2;
  const bitY = H - 96;

  return (
    <div className="mxv">
      <div className="mxv-head">
        <h3 className="mxv-title">Matrix exponentiation — Fibonacci in O(log n)</h3>
        <p className="mxv-sub">
          M = [[1,1],[1,0]] raised to the n-th power gives Fib(n) in its top-right cell. Compute M^n by
          square-and-multiply over the bits of n. Type n (0&ndash;30) and step through every 2x2 multiply.
        </p>
      </div>

      <div className="mxv-controls">
        <div className="mxv-actions">
          <div className="mxv-buttons">
            <button
              type="button"
              className="mxv-btn mxv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="mxv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="mxv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="mxv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="mxv-speed">
            <span className="mxv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="mxv-speed-range"
            />
            <span className="mxv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="mxv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>

        <label className="mxv-num">
          <span className="mxv-num-label">n</span>
          <input
            type="number"
            min={0}
            max={30}
            value={nInput}
            onChange={(e) => applyN(e.target.value)}
            className="mxv-num-input"
            aria-label="exponent n from 0 to 30"
          />
          <span className="mxv-num-hint">0&ndash;30 — fits in 32-bit Fibonacci</span>
        </label>
      </div>

      <div className="mxv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mxv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* slot labels */}
          <text x={slots.M + matW / 2} y={slotY - 18} className="mxv-mat-label">M (fixed)</text>
          <text x={slots.result + matW / 2} y={slotY - 18} className="mxv-mat-label mxv-mat-result">result</text>
          <text x={slots.base + matW / 2} y={slotY - 18} className="mxv-mat-label mxv-mat-base">base</text>

          {renderMatrix(M, slots.M, { dim: true })}
          {renderMatrix(current.result, slots.result, { ringColor: resultRing })}
          {renderMatrix(current.base, slots.base, { ringColor: baseRing })}

          {/* exponent annotation under each matrix */}
          <text x={slots.M + matW / 2} y={slotY + matH + 22} className="mxv-mat-note">base case</text>
          <text x={slots.result + matW / 2} y={slotY + matH + 22} className="mxv-mat-note">
            Fib(n) lives in [0][1]
          </text>
          <text x={slots.base + matW / 2} y={slotY + matH + 22} className="mxv-mat-note">
            squared each bit
          </text>

          {/* operation glyph between result and base when multiplying into result */}
          {op === 'multiply' && (
            <text x={(slots.result + matW + slots.base) / 2} y={slotY + matH / 2 + 8} className="mxv-op">·</text>
          )}

          {/* dot-product panel */}
          {products && (
            <g>
              <text x={W / 2} y={slotY + matH + 50} className="mxv-dot-title">
                {op === 'square' ? 'base · base — four row·column dot products' : 'result · base — four row·column dot products'}
              </text>
              {products.map((p, i) => {
                const colW = (W - 120) / 4;
                const px = 60 + i * colW + colW / 2;
                const py = slotY + matH + 74;
                return (
                  <g key={`dp-${i}`}>
                    <rect x={px - colW / 2 + 6} y={py - 16} width={colW - 12} height={30} rx={6}
                      fill="var(--bg)" stroke="var(--hue-mint)" strokeWidth={1.2} />
                    <text x={px} y={py + 4} className="mxv-dot">
                      [{p.r}][{p.c}] = {p.terms} = {p.val}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* bit strip — only show when no product panel to avoid overlap */}
          {!products && (
            <g>
              <text x={W / 2} y={bitY - 14} className="mxv-bits-title">
                n = {nInput} = ({bitsStr(nInput)})&#8322; — consumed least-significant bit first
              </text>
              {bits.map((_, i) => {
                // display MSB left: column 0 is the highest index bit
                const dispIdx = bits.length - 1 - i;
                const b = bits[dispIdx];
                const bx = bitStartX + i * (bitBoxW + bitGap);
                const active = dispIdx === activeBit;
                let fill = 'var(--bg)';
                let stroke = 'var(--border)';
                let textFill = b === 1 ? 'var(--accent)' : 'var(--text-dim)';
                if (active) {
                  fill = b === 1 ? 'var(--accent)' : 'var(--hover-box)';
                  stroke = 'var(--accent)';
                  textFill = b === 1 ? 'var(--bg)' : 'var(--text-main)';
                }
                return (
                  <g key={`bit-${i}`}>
                    <rect x={bx} y={bitY} width={bitBoxW} height={36} rx={6}
                      fill={fill} stroke={stroke} strokeWidth={active ? 2.6 : 1.2} />
                    <text x={bx + bitBoxW / 2} y={bitY + 23} className="mxv-bit"
                      style={{ fill: textFill }}>{b}</text>
                    <text x={bx + bitBoxW / 2} y={bitY + 50} className="mxv-bit-place">
                      2{dispIdx === 0 ? '⁰' : `^${dispIdx}`}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="mxv-metrics">
        <div className="mxv-metric">
          <span className="mxv-metric-label">phase</span>
          <span className="mxv-metric-value">{current.phase}</span>
        </div>
        <div className="mxv-metric">
          <span className="mxv-metric-label">current bit</span>
          <span className="mxv-metric-value">
            {activeBit >= 0 ? `#${activeBit} = ${bits[activeBit]}` : '—'}
          </span>
        </div>
        <div className="mxv-metric">
          <span className="mxv-metric-label">result [0][1]</span>
          <span className="mxv-metric-value">{current.result[0][1]}</span>
        </div>
        <div className="mxv-metric mxv-metric-dim">
          <span className="mxv-metric-label">base [0][0]</span>
          <span className="mxv-metric-value mxv-metric-dimval">{current.base[0][0]}</span>
        </div>
        <div className="mxv-metric">
          <span className="mxv-metric-label">Fib({nInput}) so far</span>
          <span className="mxv-metric-value mxv-metric-fib">{current.fib}</span>
        </div>
      </div>

      <div className="mxv-arith">
        <span className="mxv-arith-label">trace</span>
        <span className="mxv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
