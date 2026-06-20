import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Binary, Layers } from 'lucide-react';
import './XorPropertiesViz.css';

const BITS = 8;

function toBits(n) {
  const out = [];
  for (let i = BITS - 1; i >= 0; i--) out.push((n >> i) & 1);
  return out;
}

function bitsStr(n) {
  return toBits(n).join('');
}

// Mode A: a XOR b, one column (bit position) at a time, MSB -> LSB.
function buildBitFrames(a, b) {
  const frames = [];
  const aBits = toBits(a);
  const bBits = toBits(b);
  const accBits = new Array(BITS).fill(null);

  const snap = (extra) => ({
    a, b,
    aBits: [...aBits],
    bBits: [...bBits],
    accBits: [...accBits],
    activeCol: -1,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Line up ${a} = ${bitsStr(a)} over ${b} = ${bitsStr(b)}. XOR works one column at a time: output 1 only when the two bits differ.`,
  }));

  for (let c = 0; c < BITS; c++) {
    const av = aBits[c];
    const bv = bBits[c];
    const r = av ^ bv;
    accBits[c] = r;
    frames.push(snap({
      phase: 'column', activeCol: c,
      note: `Column ${BITS - 1 - c} (value ${1 << (BITS - 1 - c)}): ${av} ^ ${bv} = ${r}. ${av === bv ? 'Equal bits cancel to 0.' : 'Differing bits give 1.'}`,
    }));
  }

  frames.push(snap({
    phase: 'done',
    note: `${a} ^ ${b} = ${a ^ b} (${bitsStr(a ^ b)}). XOR is its own inverse: ${a ^ b} ^ ${b} = ${a} brings the original back.`,
  }));

  return frames;
}

// Mode B: fold XOR across the whole array; pairs cancel, the lone value survives.
function buildSingleFrames(nums) {
  const frames = [];
  let acc = 0;

  const snap = (extra) => ({
    nums: [...nums],
    acc,
    accBits: toBits(acc),
    activeIdx: -1,
    folded: [],
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `acc = 0 (${bitsStr(0)}). Fold XOR left to right over every element. Any value seen twice will cancel itself out, leaving only the lone number.`,
  }));

  for (let i = 0; i < nums.length; i++) {
    const prev = acc;
    acc = acc ^ nums[i];
    const cancelled = acc === 0 && prev !== 0;
    frames.push(snap({
      phase: 'fold', activeIdx: i,
      folded: nums.slice(0, i + 1),
      note: cancelled
        ? `XOR ${nums[i]}: ${bitsStr(prev)} ^ ${bitsStr(nums[i])} = ${bitsStr(acc)} -> acc is 0 again. A duplicate just cancelled its partner.`
        : `XOR ${nums[i]}: acc ${bitsStr(prev)} ^ ${bitsStr(nums[i])} = ${bitsStr(acc)} (value ${acc}).`,
    }));
  }

  frames.push(snap({
    phase: 'done',
    folded: [...nums],
    note: `All paired values cancelled to 0. The single number is ${acc} (${bitsStr(acc)}) — O(n) time, O(1) space, no hash set needed.`,
  }));

  return frames;
}

function parseArray(text) {
  const parsed = text
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => Number(t))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 255);
  return parsed.slice(0, 12);
}

const DEFAULT_A = 6;
const DEFAULT_B = 4;
const DEFAULT_ARR = [4, 1, 2, 1, 2];

export default function XorPropertiesViz() {
  const [mode, setMode] = useState('bits');
  const [a] = useState(DEFAULT_A);
  const [b] = useState(DEFAULT_B);
  const [arrText, setArrText] = useState(DEFAULT_ARR.join(', '));
  const [nums, setNums] = useState(DEFAULT_ARR);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'bits' ? buildBitFrames(a, b) : buildSingleFrames(nums)),
    [mode, a, b, nums],
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

  const applyArray = (text) => {
    setArrText(text);
    const parsed = parseArray(text);
    if (parsed.length > 0) {
      setIsRunningRaw(false);
      setStep(0);
      setNums(parsed);
    }
  };

  const W = 940;
  const H = 360;
  const cellGap = 8;

  // ---- bit-mode geometry ----
  const bitsLeft = 150;
  const bitsRight = W - 40;
  const bitsUsable = bitsRight - bitsLeft;
  const cellW = (bitsUsable - cellGap * (BITS - 1)) / BITS;
  const cellX = (c) => bitsLeft + c * (cellW + cellGap);
  const rowAY = 70;
  const rowBY = 150;
  const rowAccY = 250;
  const cellH = 54;

  // ---- single-mode geometry ----
  const arrLeft = 40;
  const arrTop = 96;
  const arrCount = current.nums ? current.nums.length : 0;
  const arrUsable = W - 80;
  const aCellW = arrCount > 0 ? Math.min(96, (arrUsable - cellGap * (arrCount - 1)) / arrCount) : 60;
  const aCellX = (i) => arrLeft + i * (aCellW + cellGap);

  const cellFill = (v, active) => {
    if (active) return 'var(--hue-pink)';
    if (v === 1) return 'rgba(var(--accent-rgb), 0.55)';
    return 'var(--bg)';
  };
  const cellStroke = (active) => (active ? 'var(--hue-pink)' : 'var(--border)');

  return (
    <div className="xpv">
      <div className="xpv-head">
        <h3 className="xpv-title">XOR properties — cancel pairs, keep the odd one out</h3>
        <p className="xpv-sub">
          XOR compares two numbers bit by bit and outputs 1 only where they differ. Equal bits cancel to 0, so
          a value XOR&apos;d with itself vanishes — the trick behind finding the lone unpaired number in O(1) space.
        </p>
      </div>

      <div className="xpv-controls">
        <div className="xpv-modes">
          <button
            type="button"
            className={`xpv-mode ${mode === 'bits' ? 'xpv-mode-active' : ''}`}
            onClick={() => switchMode('bits')}
          >
            <Binary size={14} /> a ^ b by column
          </button>
          <button
            type="button"
            className={`xpv-mode ${mode === 'single' ? 'xpv-mode-active' : ''}`}
            onClick={() => switchMode('single')}
          >
            <Layers size={14} /> find the single number
          </button>
        </div>

        <div className="xpv-actions">
          <div className="xpv-buttons">
            <button
              type="button"
              className="xpv-btn xpv-btn-primary"
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
              className="xpv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="xpv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="xpv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="xpv-speed">
            <span className="xpv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="xpv-speed-range"
            />
            <span className="xpv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="xpv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>

        {mode === 'single' && (
          <label className="xpv-array">
            <span className="xpv-array-label">array</span>
            <input
              type="text"
              value={arrText}
              onChange={(e) => applyArray(e.target.value)}
              className="xpv-array-input"
              spellCheck={false}
              aria-label="array values, every value paired except one"
            />
            <span className="xpv-array-hint">0–255, every value twice except one</span>
          </label>
        )}
      </div>

      <div className="xpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="xpv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={W - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />

          {mode === 'bits' ? (
            <g>
              <text x={32} y={38} className="xpv-row-label">bit registers (MSB left, value 128 .. 1)</text>

              {/* column highlight band */}
              {current.activeCol >= 0 && (
                <rect
                  x={cellX(current.activeCol) - 4}
                  y={rowAY - 30}
                  width={cellW + 8}
                  height={rowAccY + cellH - rowAY + 36}
                  fill="rgba(var(--accent-rgb), 0.10)"
                  stroke="var(--hue-pink)"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  rx={6}
                />
              )}

              {/* row labels + decimal values */}
              <text x={36} y={rowAY + cellH / 2 + 5} className="xpv-reg-label">a = {current.a}</text>
              <text x={36} y={rowBY + cellH / 2 + 5} className="xpv-reg-label">b = {current.b}</text>
              <text x={36} y={rowAccY + cellH / 2 + 5} className="xpv-reg-label xpv-reg-acc">a^b</text>

              {/* operator glyph */}
              <text x={bitsLeft - 22} y={(rowBY + rowAY) / 2 + cellH / 2 + 6} className="xpv-op">^</text>
              <line x1={bitsLeft - 8} y1={rowBY + cellH + 14} x2={bitsRight} y2={rowBY + cellH + 14} stroke="var(--border)" strokeWidth={1.6} />

              {/* place-value header */}
              {Array.from({ length: BITS }).map((_, c) => (
                <text key={`pv-${c}`} x={cellX(c) + cellW / 2} y={rowAY - 12} className="xpv-place">
                  {1 << (BITS - 1 - c)}
                </text>
              ))}

              {/* a row */}
              {current.aBits.map((v, c) => {
                const active = c === current.activeCol;
                return (
                  <g key={`a-${c}`}>
                    <rect x={cellX(c)} y={rowAY} width={cellW} height={cellH} rx={6}
                      fill={cellFill(v, active)} stroke={cellStroke(active)} strokeWidth={active ? 2.4 : 1.2} />
                    <text x={cellX(c) + cellW / 2} y={rowAY + cellH / 2 + 6} className="xpv-bit"
                      style={{ fill: v === 1 || active ? 'var(--bg)' : 'var(--text-dim)' }}>{v}</text>
                  </g>
                );
              })}
              {/* b row */}
              {current.bBits.map((v, c) => {
                const active = c === current.activeCol;
                return (
                  <g key={`b-${c}`}>
                    <rect x={cellX(c)} y={rowBY} width={cellW} height={cellH} rx={6}
                      fill={cellFill(v, active)} stroke={cellStroke(active)} strokeWidth={active ? 2.4 : 1.2} />
                    <text x={cellX(c) + cellW / 2} y={rowBY + cellH / 2 + 6} className="xpv-bit"
                      style={{ fill: v === 1 || active ? 'var(--bg)' : 'var(--text-dim)' }}>{v}</text>
                  </g>
                );
              })}
              {/* acc row */}
              {current.accBits.map((v, c) => {
                const active = c === current.activeCol;
                const filled = v !== null;
                const fill = !filled ? 'var(--surface)' : active ? 'var(--hue-mint)' : v === 1 ? 'var(--easy)' : 'var(--bg)';
                return (
                  <g key={`acc-${c}`}>
                    <rect x={cellX(c)} y={rowAccY} width={cellW} height={cellH} rx={6}
                      fill={fill} stroke={active ? 'var(--hue-mint)' : 'var(--border)'} strokeWidth={active ? 2.4 : 1.2} />
                    <text x={cellX(c) + cellW / 2} y={rowAccY + cellH / 2 + 6} className="xpv-bit"
                      style={{ fill: !filled ? 'var(--text-dim)' : v === 1 || active ? 'var(--bg)' : 'var(--text-dim)' }}>
                      {filled ? v : '·'}
                    </text>
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              <text x={32} y={38} className="xpv-row-label">array — fold acc = acc ^ nums[i] left to right</text>

              {/* array cells */}
              {current.nums.map((v, i) => {
                const active = i === current.activeIdx;
                const isFolded = i <= current.activeIdx || current.phase === 'done';
                const fill = active ? 'var(--hue-pink)' : isFolded ? 'rgba(var(--accent-rgb), 0.28)' : 'var(--bg)';
                const stroke = active ? 'var(--hue-pink)' : isFolded ? 'var(--accent)' : 'var(--border)';
                return (
                  <g key={`arr-${i}`}>
                    <rect x={aCellX(i)} y={arrTop} width={aCellW} height={50} rx={6}
                      fill={fill} stroke={stroke} strokeWidth={active ? 2.6 : 1.2} />
                    <text x={aCellX(i) + aCellW / 2} y={arrTop + 30} className="xpv-arr-val"
                      style={{ fill: active ? 'var(--bg)' : 'var(--text-main)' }}>{v}</text>
                    <text x={aCellX(i) + aCellW / 2} y={arrTop + 68} className="xpv-arr-idx">{i}</text>
                  </g>
                );
              })}

              {/* accumulator register */}
              <text x={40} y={232} className="xpv-row-label">accumulator (8-bit)</text>
              {current.accBits.map((v, c) => {
                const fill = v === 1 ? 'var(--easy)' : 'var(--bg)';
                return (
                  <g key={`sacc-${c}`}>
                    <rect x={cellX(c)} y={246} width={cellW} height={cellH} rx={6}
                      fill={fill} stroke="var(--border)" strokeWidth={1.2} />
                    <text x={cellX(c) + cellW / 2} y={246 + cellH / 2 + 6} className="xpv-bit"
                      style={{ fill: v === 1 ? 'var(--bg)' : 'var(--text-dim)' }}>{v}</text>
                  </g>
                );
              })}
              {Array.from({ length: BITS }).map((_, c) => (
                <text key={`spv-${c}`} x={cellX(c) + cellW / 2} y={238} className="xpv-place">
                  {1 << (BITS - 1 - c)}
                </text>
              ))}
              <text x={36} y={246 + cellH / 2 + 5} className="xpv-reg-label xpv-reg-acc">acc</text>
              <text x={bitsRight + 4} y={246 + cellH / 2 + 6} className="xpv-acc-dec" textAnchor="end" dx={-2}>
                = {current.acc}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="xpv-metrics">
        <div className="xpv-metric">
          <span className="xpv-metric-label">phase</span>
          <span className="xpv-metric-value">{current.phase}</span>
        </div>
        {mode === 'bits' ? (
          <>
            <div className="xpv-metric">
              <span className="xpv-metric-label">column</span>
              <span className="xpv-metric-value">
                {current.activeCol >= 0 ? BITS - 1 - current.activeCol : '—'}
              </span>
            </div>
            <div className="xpv-metric">
              <span className="xpv-metric-label">a ^ b</span>
              <span className="xpv-metric-value">{current.a ^ current.b}</span>
            </div>
            <div className="xpv-metric xpv-metric-dim">
              <span className="xpv-metric-label">identity</span>
              <span className="xpv-metric-value xpv-metric-dimval">x ^ x = 0, x ^ 0 = x</span>
            </div>
          </>
        ) : (
          <>
            <div className="xpv-metric">
              <span className="xpv-metric-label">acc value</span>
              <span className="xpv-metric-value">{current.acc}</span>
            </div>
            <div className="xpv-metric">
              <span className="xpv-metric-label">acc bits</span>
              <span className="xpv-metric-value">{bitsStr(current.acc)}</span>
            </div>
            <div className="xpv-metric xpv-metric-dim">
              <span className="xpv-metric-label">elements folded</span>
              <span className="xpv-metric-value xpv-metric-dimval">
                {current.phase === 'done' ? current.nums.length : Math.max(0, current.activeIdx + 1)} of {current.nums.length}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="xpv-arith">
        <span className="xpv-arith-label">trace</span>
        <span className="xpv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
