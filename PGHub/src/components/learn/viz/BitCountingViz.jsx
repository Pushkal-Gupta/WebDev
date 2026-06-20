import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Binary, Crosshair } from 'lucide-react';
import './BitCountingViz.css';

const BITS = 8;

function toBits(n) {
  const out = [];
  for (let i = BITS - 1; i >= 0; i--) out.push((n >> i) & 1);
  return out;
}

function bitsStr(n) {
  return toBits(n).join('');
}

function lowestSetIndex(n) {
  if (n === 0) return -1;
  let i = 0;
  while (((n >> i) & 1) === 0) i += 1;
  return i;
}

// Mode A: Brian Kernighan — n &= (n-1) clears the lowest set bit each loop.
function buildKernighanFrames(start) {
  const frames = [];
  let n = start;
  let count = 0;
  let iter = 0;

  const snap = (extra) => ({
    nBits: toBits(n),
    n,
    count,
    iter,
    activeBit: -1,
    minusBits: null,
    minusVal: null,
    cleared: null,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Start: n = ${bitsStr(start)} (${start}). Brian Kernighan's trick: n & (n-1) clears the lowest set 1-bit. Loop until n hits 0; the loop count equals the number of set bits.`,
  }));

  while (n !== 0) {
    iter += 1;
    const low = lowestSetIndex(n);
    const prev = n;
    const minus = n - 1;
    // show the n-1 mask and which bit will clear before applying
    frames.push(snap({
      phase: 'mask',
      n: prev,
      nBits: toBits(prev),
      activeBit: low,
      minusBits: toBits(minus),
      minusVal: minus,
      count,
      iter,
      note: `Iteration ${iter}: lowest set bit is position ${low} (value ${1 << low}). Subtracting 1 flips that bit to 0 and sets every lower 0-bit to 1: n-1 = ${bitsStr(minus)} (${minus}).`,
    }));

    n = n & minus;
    count += 1;
    frames.push(snap({
      phase: 'and',
      n,
      nBits: toBits(n),
      activeBit: low,
      minusBits: toBits(minus),
      minusVal: minus,
      cleared: low,
      count,
      iter,
      note: `n & (n-1) = ${bitsStr(prev)} & ${bitsStr(minus)} = ${bitsStr(n)} (${n}). Cleared bit ${low}; set-bit count = ${count}.`,
    }));
  }

  frames.push(snap({
    phase: 'done',
    n: 0,
    nBits: toBits(0),
    count,
    iter,
    note: `n reached 0 after ${count} iteration${count === 1 ? '' : 's'}. popcount(${start}) = ${count}. Kernighan loops once per set bit — O(set bits), not O(width).`,
  }));

  return frames;
}

// Mode B: lowest-set-bit isolation — n & -n keeps only the rightmost 1-bit.
function buildIsolateFrames(start) {
  const frames = [];
  const n = start;

  const snap = (extra) => ({
    nBits: toBits(n),
    n,
    activeBit: -1,
    negBits: null,
    negVal: null,
    isoBits: null,
    isoVal: null,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Start: n = ${bitsStr(n)} (${n}). To isolate the lowest set bit, compute n & -n. Two's-complement negation flips every bit then adds 1, which lines a single 1 up with n's rightmost set bit.`,
  }));

  if (n === 0) {
    frames.push(snap({
      phase: 'done',
      negBits: toBits(0),
      negVal: 0,
      isoBits: toBits(0),
      isoVal: 0,
      note: `n = 0 has no set bit, so n & -n = 0. Every other value yields a single power of two — the rightmost 1-bit's place value.`,
    }));
    return frames;
  }

  const low = lowestSetIndex(n);
  const neg = (-n) & 0xff;
  frames.push(snap({
    phase: 'neg',
    activeBit: low,
    negBits: toBits(neg),
    negVal: neg,
    note: `-n in two's complement (8-bit): ~n + 1 = ${bitsStr(neg)} (${neg} as unsigned). Notice it shares exactly one 1-bit with n — at position ${low}, the lowest set bit.`,
  }));

  const iso = n & neg;
  frames.push(snap({
    phase: 'and',
    activeBit: low,
    negBits: toBits(neg),
    negVal: neg,
    isoBits: toBits(iso),
    isoVal: iso,
    note: `n & -n = ${bitsStr(n)} & ${bitsStr(neg)} = ${bitsStr(iso)} (${iso}). Only bit ${low} survives — value ${1 << low}. This is the rightmost set bit isolated in O(1).`,
  }));

  return frames;
}

function clampN(v) {
  if (!Number.isFinite(v)) return 0;
  const i = Math.trunc(v);
  if (i < 0) return 0;
  if (i > 255) return 255;
  return i;
}

const DEFAULT_N = 22; // 00010110 -> 3 set bits

export default function BitCountingViz() {
  const [mode, setMode] = useState('kernighan');
  const [nInput, setNInput] = useState(DEFAULT_N);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'kernighan' ? buildKernighanFrames(nInput) : buildIsolateFrames(nInput)),
    [mode, nInput],
  );

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
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

  const switchMode = (next) => {
    if (next === mode) return;
    setIsRunningRaw(false);
    setStep(0);
    setMode(next);
  };

  const applyN = (raw) => {
    const v = clampN(Number(raw));
    setIsRunningRaw(false);
    setStep(0);
    setNInput(v);
  };

  const W = 940;
  const H = 360;
  const cellGap = 8;

  const bitsLeft = 168;
  const bitsRight = W - 56;
  const bitsUsable = bitsRight - bitsLeft;
  const cellW = (bitsUsable - cellGap * (BITS - 1)) / BITS;
  const cellX = (c) => bitsLeft + c * (cellW + cellGap);
  const cellH = 54;

  // column index c (0 = MSB) maps to bit position
  const posOfCol = (c) => BITS - 1 - c;
  const colOfPos = (p) => BITS - 1 - p;

  const isKern = mode === 'kernighan';

  // row layout
  const rowMainY = isKern ? 80 : 80;
  const rowMaskY = isKern ? 168 : 168;
  const rowResY = 256;

  const renderRow = (bits, y, opts) => {
    const { activePos, kind } = opts;
    if (!bits) return null;
    return bits.map((v, c) => {
      const pos = posOfCol(c);
      const active = activePos >= 0 && pos === activePos;
      let fill = 'var(--bg)';
      let stroke = 'var(--border)';
      let textFill = v === 1 ? 'var(--bg)' : 'var(--text-dim)';
      if (kind === 'main') {
        if (active) { fill = 'var(--hue-pink)'; stroke = 'var(--hue-pink)'; textFill = 'var(--bg)'; }
        else if (v === 1) { fill = 'rgba(var(--accent-rgb), 0.55)'; stroke = 'var(--accent)'; textFill = 'var(--bg)'; }
      } else if (kind === 'mask') {
        if (active) { fill = 'var(--hue-sky)'; stroke = 'var(--hue-sky)'; textFill = 'var(--bg)'; }
        else if (v === 1) { fill = 'rgba(var(--accent-rgb), 0.30)'; stroke = 'var(--border)'; textFill = 'var(--text-main)'; }
      } else if (kind === 'result') {
        if (active) { fill = 'var(--hue-mint)'; stroke = 'var(--hue-mint)'; textFill = 'var(--bg)'; }
        else if (v === 1) { fill = 'var(--easy)'; stroke = 'var(--easy)'; textFill = 'var(--bg)'; }
      }
      return (
        <g key={`${kind}-${c}`}>
          <rect x={cellX(c)} y={y} width={cellW} height={cellH} rx={6}
            fill={fill} stroke={stroke} strokeWidth={active ? 2.6 : 1.2} />
          <text x={cellX(c) + cellW / 2} y={y + cellH / 2 + 7} className="bcv-bit"
            style={{ fill: textFill }}>{v}</text>
        </g>
      );
    });
  };

  const activePos = current.activeBit;

  return (
    <div className="bcv">
      <div className="bcv-head">
        <h3 className="bcv-title">Bit counting tricks — clear and isolate the lowest set bit</h3>
        <p className="bcv-sub">
          Counting set bits one loop per bit (Kernighan&apos;s n &amp; (n-1)) and isolating the rightmost
          1-bit with n &amp; -n. Type a number 0&ndash;255 and step through the bit arithmetic.
        </p>
      </div>

      <div className="bcv-controls">
        <div className="bcv-modes">
          <button
            type="button"
            className={`bcv-mode ${isKern ? 'bcv-mode-active' : ''}`}
            onClick={() => switchMode('kernighan')}
          >
            <Binary size={14} /> Kernighan n &amp; (n-1)
          </button>
          <button
            type="button"
            className={`bcv-mode ${!isKern ? 'bcv-mode-active' : ''}`}
            onClick={() => switchMode('isolate')}
          >
            <Crosshair size={14} /> isolate n &amp; -n
          </button>
        </div>

        <div className="bcv-actions">
          <div className="bcv-buttons">
            <button
              type="button"
              className="bcv-btn bcv-btn-primary"
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
              className="bcv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bcv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bcv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="bcv-speed">
            <span className="bcv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bcv-speed-range"
            />
            <span className="bcv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bcv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>

        <label className="bcv-num">
          <span className="bcv-num-label">n</span>
          <input
            type="number"
            min={0}
            max={255}
            value={nInput}
            onChange={(e) => applyN(e.target.value)}
            className="bcv-num-input"
            aria-label="number 0 to 255"
          />
          <span className="bcv-num-hint">0&ndash;255 (8-bit register)</span>
        </label>
      </div>

      <div className="bcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bcv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={W - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={32} y={40} className="bcv-row-label">8-bit register (MSB left, place values 128 .. 1)</text>

          {/* active-bit highlight band */}
          {activePos >= 0 && (
            <rect
              x={cellX(colOfPos(activePos)) - 4}
              y={rowMainY - 26}
              width={cellW + 8}
              height={rowResY + cellH - rowMainY + 32}
              fill="rgba(var(--accent-rgb), 0.10)"
              stroke="var(--hue-pink)"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              rx={6}
            />
          )}

          {/* place-value header */}
          {Array.from({ length: BITS }).map((_, c) => (
            <text key={`pv-${c}`} x={cellX(c) + cellW / 2} y={rowMainY - 12} className="bcv-place">
              {1 << posOfCol(c)}
            </text>
          ))}

          {/* MAIN row (n) */}
          <text x={36} y={rowMainY + cellH / 2 + 6} className="bcv-reg-label">
            n = {current.n}
          </text>
          {renderRow(current.nBits, rowMainY, { activePos, kind: 'main' })}

          {/* MASK / NEG row */}
          {isKern ? (
            current.minusBits && (
              <>
                <text x={bitsLeft - 24} y={(rowMainY + rowMaskY) / 2 + cellH / 2 + 8} className="bcv-op">&amp;</text>
                <text x={36} y={rowMaskY + cellH / 2 + 6} className="bcv-reg-label bcv-reg-mask">
                  n-1 = {current.minusVal}
                </text>
                {renderRow(current.minusBits, rowMaskY, { activePos, kind: 'mask' })}
                <line x1={bitsLeft - 8} y1={rowMaskY + cellH + 14} x2={bitsRight} y2={rowMaskY + cellH + 14} stroke="var(--border)" strokeWidth={1.6} />
              </>
            )
          ) : (
            current.negBits && (
              <>
                <text x={bitsLeft - 24} y={(rowMainY + rowMaskY) / 2 + cellH / 2 + 8} className="bcv-op">&amp;</text>
                <text x={36} y={rowMaskY + cellH / 2 + 6} className="bcv-reg-label bcv-reg-mask">
                  -n = {current.negVal}
                </text>
                {renderRow(current.negBits, rowMaskY, { activePos, kind: 'mask' })}
                <line x1={bitsLeft - 8} y1={rowMaskY + cellH + 14} x2={bitsRight} y2={rowMaskY + cellH + 14} stroke="var(--border)" strokeWidth={1.6} />
              </>
            )
          )}

          {/* RESULT row */}
          {isKern ? (
            current.phase === 'and' || current.phase === 'done' ? (
              <>
                <text x={36} y={rowResY + cellH / 2 + 6} className="bcv-reg-label bcv-reg-res">
                  n&apos; = {current.n}
                </text>
                {renderRow(current.nBits, rowResY, { activePos: current.cleared >= 0 ? current.cleared : -1, kind: 'result' })}
              </>
            ) : null
          ) : (
            current.isoBits && (
              <>
                <text x={36} y={rowResY + cellH / 2 + 6} className="bcv-reg-label bcv-reg-res">
                  n &amp; -n = {current.isoVal}
                </text>
                {renderRow(current.isoBits, rowResY, { activePos, kind: 'result' })}
              </>
            )
          )}
        </svg>
      </div>

      <div className="bcv-metrics">
        <div className="bcv-metric">
          <span className="bcv-metric-label">phase</span>
          <span className="bcv-metric-value">{current.phase}</span>
        </div>
        <div className="bcv-metric">
          <span className="bcv-metric-label">n (binary)</span>
          <span className="bcv-metric-value">{bitsStr(current.n)}</span>
        </div>
        <div className="bcv-metric">
          <span className="bcv-metric-label">n (decimal)</span>
          <span className="bcv-metric-value">{current.n}</span>
        </div>
        {isKern ? (
          <>
            <div className="bcv-metric">
              <span className="bcv-metric-label">set bits so far</span>
              <span className="bcv-metric-value">{current.count}</span>
            </div>
            <div className="bcv-metric bcv-metric-dim">
              <span className="bcv-metric-label">iterations</span>
              <span className="bcv-metric-value bcv-metric-dimval">{current.iter}</span>
            </div>
          </>
        ) : (
          <>
            <div className="bcv-metric">
              <span className="bcv-metric-label">lowest set bit</span>
              <span className="bcv-metric-value">
                {current.isoVal != null ? current.isoVal : (activePos >= 0 ? (1 << activePos) : '—')}
              </span>
            </div>
            <div className="bcv-metric bcv-metric-dim">
              <span className="bcv-metric-label">identity</span>
              <span className="bcv-metric-value bcv-metric-dimval">n &amp; -n = rightmost 1</span>
            </div>
          </>
        )}
      </div>

      <div className="bcv-arith">
        <span className="bcv-arith-label">trace</span>
        <span className="bcv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
