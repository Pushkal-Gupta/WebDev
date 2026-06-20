import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Binary, FlipVertical2 } from 'lucide-react';
import './GrayCodeViz.css';

function bits(n, width) {
  let s = '';
  for (let i = width - 1; i >= 0; i--) s += (n >> i) & 1;
  return s;
}

// index of the single differing bit between two equal-length bit strings (0 = LSB), or -1.
function flippedBit(prev, cur, width) {
  if (prev == null) return -1;
  const x = prev ^ cur;
  if (x === 0) return -1;
  for (let i = 0; i < width; i++) if ((x >> i) & 1) return i;
  return -1;
}

// Mode A: gray = i ^ (i >> 1), stepping through each i.
function buildFormulaFrames(width) {
  const frames = [];
  const total = 1 << width;
  const rows = [];

  const snap = (extra) => ({
    width,
    rows: rows.map((r) => ({ ...r })),
    activeI: -1,
    flipped: -1,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `n=${width}: walk i from 0 to ${total - 1}. For each i, gray(i) = i ^ (i >> 1). Consecutive gray codes always differ by exactly one bit.`,
  }));

  let prevGray = null;
  for (let i = 0; i < total; i++) {
    const shifted = i >> 1;
    const gray = i ^ shifted;
    const flip = flippedBit(prevGray, gray, width);
    rows.push({ i, gray, shifted });
    frames.push(snap({
      phase: 'compute', activeI: i, flipped: flip,
      note: i === 0
        ? `i=0: 0 ^ (0>>1) = 0 -> ${bits(gray, width)}. First code, no previous to compare.`
        : `i=${i}: ${i} ^ ${shifted} = ${gray} -> ${bits(gray, width)}; flipped bit ${flip} vs previous ${bits(prevGray, width)}.`,
    }));
    prevGray = gray;
  }

  frames.push(snap({
    phase: 'done',
    note: `All ${total} codes built. Every adjacent pair (including last->first, it wraps) differs by exactly one bit — a Hamming distance of 1.`,
  }));

  return frames;
}

// Mode B: reflect-and-prefix. Start from 1-bit list, mirror + prefix 0s then 1s, repeat.
function buildReflectFrames(width) {
  const frames = [];

  const snap = (extra) => ({
    width,
    level: 1,
    list: ['0', '1'],
    mirrored: null,
    prefixedTop: null,
    prefixedBot: null,
    ...extra,
  });

  let list = ['0', '1'];
  frames.push(snap({
    phase: 'seed', level: 1, list: [...list],
    note: 'Base case (1 bit): the list is just 0, 1. Build up by reflecting and prefixing.',
  }));

  for (let lvl = 2; lvl <= width; lvl++) {
    const mirrored = [...list].reverse();
    frames.push(snap({
      phase: 'mirror', level: lvl, list: [...list], mirrored: [...mirrored],
      note: `Level ${lvl}: take the ${lvl - 1}-bit list and mirror it (reverse order). The mirror image guarantees the seam stays 1-bit apart.`,
    }));

    const prefixedTop = list.map((s) => `0${s}`);
    const prefixedBot = mirrored.map((s) => `1${s}`);
    frames.push(snap({
      phase: 'prefix', level: lvl, list: [...list], mirrored: [...mirrored],
      prefixedTop: [...prefixedTop], prefixedBot: [...prefixedBot],
      note: `Prefix 0 to the original half and 1 to the mirrored half. The new MSB flips exactly once, at the join — so neighbours still differ by one bit.`,
    }));

    list = [...prefixedTop, ...prefixedBot];
    frames.push(snap({
      phase: 'concat', level: lvl, list: [...list],
      note: `Concatenate: the ${lvl}-bit Gray list now has ${list.length} codes. Repeat until ${width} bits.`,
    }));
  }

  frames.push(snap({
    phase: 'done', level: width, list: [...list],
    note: `Done. The ${width}-bit reflected list matches i ^ (i>>1) exactly, and every adjacent pair differs by one bit.`,
  }));

  return frames;
}

const N_OPTIONS = [2, 3, 4];

export default function GrayCodeViz() {
  const [mode, setMode] = useState('formula');
  const [width, setWidth] = useState(3);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'formula' ? buildFormulaFrames(width) : buildReflectFrames(width)),
    [mode, width],
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

  const switchWidth = (next) => {
    if (next === width) return;
    setIsRunningRaw(false);
    setStep(0);
    setWidth(next);
  };

  const W = 940;
  const H = 380;

  // ---- formula-mode geometry: a table of rows i | binary(i) | gray ----
  const total = 1 << width;
  const tableTop = 64;
  const tableBottom = H - 44;
  const rowH = (tableBottom - tableTop) / total;
  const colIx = 120;
  const colBin = 340;
  const colGrayBox = 560;
  const grayBitW = 42;
  const grayBitGap = 8;
  const rowY = (i) => tableTop + i * rowH + rowH / 2;

  // ---- reflect-mode geometry ----
  const rlist = current.list || [];
  const rTop = 70;
  const rRowH = Math.min(34, (H - rTop - 40) / Math.max(1, rlist.length));
  const rBitW = 30;
  const rCol0 = 180;

  return (
    <div className="gcv">
      <div className="gcv-head">
        <h3 className="gcv-title">Gray code — reorder so neighbours differ by one bit</h3>
        <p className="gcv-sub">
          A Gray code lists every n-bit value so each step flips a single bit. Two ways to build it: the
          formula gray = i ^ (i &gt;&gt; 1), or reflect-and-prefix construction. Both give the same sequence.
        </p>
      </div>

      <div className="gcv-controls">
        <div className="gcv-modes">
          <button
            type="button"
            className={`gcv-mode ${mode === 'formula' ? 'gcv-mode-active' : ''}`}
            onClick={() => switchMode('formula')}
          >
            <Binary size={14} /> i ^ (i &gt;&gt; 1)
          </button>
          <button
            type="button"
            className={`gcv-mode ${mode === 'reflect' ? 'gcv-mode-active' : ''}`}
            onClick={() => switchMode('reflect')}
          >
            <FlipVertical2 size={14} /> reflect &amp; prefix
          </button>
          <div className="gcv-nsel">
            <span className="gcv-nsel-label">n bits</span>
            {N_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`gcv-nbtn ${width === opt ? 'gcv-nbtn-active' : ''}`}
                onClick={() => switchWidth(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="gcv-actions">
          <div className="gcv-buttons">
            <button
              type="button"
              className="gcv-btn gcv-btn-primary"
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
              className="gcv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="gcv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="gcv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="gcv-speed">
            <span className="gcv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="gcv-speed-range"
            />
            <span className="gcv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="gcv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="gcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gcv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={W - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />

          {mode === 'formula' ? (
            <g>
              {/* column headers */}
              <text x={colIx} y={44} className="gcv-col-head" textAnchor="middle">i (decimal)</text>
              <text x={colBin} y={44} className="gcv-col-head" textAnchor="middle">i ^ (i &gt;&gt; 1)</text>
              <text x={colGrayBox + (grayBitW * width + grayBitGap * (width - 1)) / 2} y={44} className="gcv-col-head" textAnchor="middle">
                gray code
              </text>

              {current.rows.map((r) => {
                const active = r.i === current.activeI;
                const y = rowY(r.i);
                const grayStr = bits(r.gray, width);
                const showFlip = active && current.flipped >= 0;
                return (
                  <g key={`row-${r.i}`}>
                    {active && (
                      <rect
                        x={70}
                        y={y - rowH / 2 + 2}
                        width={W - 140}
                        height={rowH - 4}
                        fill="rgba(var(--accent-rgb), 0.12)"
                        stroke="var(--hue-pink)"
                        strokeDasharray="4 4"
                        strokeWidth={1.2}
                        rx={5}
                      />
                    )}
                    <text x={colIx} y={y + 5} className="gcv-cell" textAnchor="middle"
                      style={{ fill: active ? 'var(--accent)' : 'var(--text-main)' }}>
                      {r.i} = {bits(r.i, width)}
                    </text>
                    <text x={colBin} y={y + 5} className="gcv-cell-mono" textAnchor="middle"
                      style={{ fill: active ? 'var(--text-main)' : 'var(--text-dim)' }}>
                      {r.i} ^ {r.shifted} = {r.gray}
                    </text>
                    {/* gray bit boxes */}
                    {grayStr.split('').map((ch, bi) => {
                      const bitPos = width - 1 - bi; // bit index, 0 = LSB
                      const isFlip = showFlip && bitPos === current.flipped;
                      const x = colGrayBox + bi * (grayBitW + grayBitGap);
                      const on = ch === '1';
                      const fill = isFlip ? 'var(--hue-pink)' : on ? 'rgba(var(--accent-rgb), 0.55)' : 'var(--bg)';
                      return (
                        <g key={`gb-${r.i}-${bi}`}>
                          <rect x={x} y={y - rowH / 2 + 3} width={grayBitW} height={rowH - 6} rx={4}
                            fill={fill}
                            stroke={isFlip ? 'var(--hue-pink)' : on ? 'var(--accent)' : 'var(--border)'}
                            strokeWidth={isFlip ? 2.4 : 1.1} />
                          <text x={x + grayBitW / 2} y={y + 5} className="gcv-bit" textAnchor="middle"
                            style={{ fill: isFlip || on ? 'var(--bg)' : 'var(--text-dim)' }}>{ch}</text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              <text x={32} y={44} className="gcv-col-head">
                level {current.level} — {current.phase === 'prefix' ? 'prefix 0 to top half, 1 to mirrored bottom' : current.phase === 'mirror' ? 'mirror the list (reverse order)' : 'reflected Gray list'}
              </text>

              {(() => {
                const showPrefix = current.phase === 'prefix';
                const mirrored = current.mirrored;
                const half = mirrored ? mirrored.length : 0;
                const items = current.list;
                return items.map((code, idx) => {
                  const y = rTop + idx * rRowH;
                  // in prefix phase show the source list + mirror side by side, then prefixed columns
                  const isBottomHalf = showPrefix && idx >= 0; // every row gets a prefix preview in prefix phase via mirrored mapping
                  const chars = code.split('');
                  return (
                    <g key={`rl-${idx}`}>
                      <text x={rCol0 - 24} y={y + rRowH / 2 + 4} className="gcv-ridx" textAnchor="end">{idx}</text>
                      {chars.map((ch, ci) => {
                        const on = ch === '1';
                        const x = rCol0 + ci * (rBitW + 6);
                        const isNewMsb = current.phase === 'concat' && ci === 0;
                        const fill = isNewMsb && on ? 'var(--hue-mint)' : on ? 'rgba(var(--accent-rgb), 0.55)' : 'var(--bg)';
                        return (
                          <g key={`rlb-${idx}-${ci}`}>
                            <rect x={x} y={y + 3} width={rBitW} height={rRowH - 6} rx={4}
                              fill={fill}
                              stroke={isNewMsb && on ? 'var(--hue-mint)' : on ? 'var(--accent)' : 'var(--border)'}
                              strokeWidth={1.1} />
                            <text x={x + rBitW / 2} y={y + rRowH / 2 + 4} className="gcv-bit" textAnchor="middle"
                              style={{ fill: on ? 'var(--bg)' : 'var(--text-dim)' }}>{ch}</text>
                          </g>
                        );
                      })}
                      {isBottomHalf && idx === half - 1 && mirrored && (
                        <line
                          x1={rCol0 - 40}
                          y1={y + rRowH}
                          x2={rCol0 + (current.level) * (rBitW + 6) + 20}
                          y2={y + rRowH}
                          stroke="var(--hue-pink)"
                          strokeDasharray="5 4"
                          strokeWidth={1.6}
                        />
                      )}
                    </g>
                  );
                });
              })()}

              {/* mirror preview column when mirroring */}
              {current.phase === 'mirror' && current.mirrored && (
                <g>
                  <text x={rCol0 + (current.level - 1) * (rBitW + 6) + 70} y={rTop - 12} className="gcv-mirror-head">
                    mirrored
                  </text>
                  {current.mirrored.map((code, idx) => {
                    const y = rTop + idx * rRowH;
                    const baseX = rCol0 + (current.level - 1) * (rBitW + 6) + 70;
                    return (
                      <g key={`mir-${idx}`}>
                        {code.split('').map((ch, ci) => {
                          const on = ch === '1';
                          const x = baseX + ci * (rBitW + 6);
                          return (
                            <g key={`mirb-${idx}-${ci}`}>
                              <rect x={x} y={y + 3} width={rBitW} height={rRowH - 6} rx={4}
                                fill={on ? 'rgba(var(--hue-sky-rgb, var(--accent-rgb)), 0.4)' : 'var(--bg)'}
                                stroke="var(--hue-sky)" strokeWidth={1.1} />
                              <text x={x + rBitW / 2} y={y + rRowH / 2 + 4} className="gcv-bit" textAnchor="middle"
                                style={{ fill: on ? 'var(--bg)' : 'var(--text-dim)' }}>{ch}</text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          )}
        </svg>
      </div>

      <div className="gcv-metrics">
        <div className="gcv-metric">
          <span className="gcv-metric-label">phase</span>
          <span className="gcv-metric-value">{current.phase}</span>
        </div>
        {mode === 'formula' ? (
          <>
            <div className="gcv-metric">
              <span className="gcv-metric-label">current i</span>
              <span className="gcv-metric-value">
                {current.activeI >= 0 ? `${current.activeI} (${bits(current.activeI, width)})` : '—'}
              </span>
            </div>
            <div className="gcv-metric">
              <span className="gcv-metric-label">gray code</span>
              <span className="gcv-metric-value">
                {current.activeI >= 0
                  ? bits(current.activeI ^ (current.activeI >> 1), width)
                  : '—'}
              </span>
            </div>
            <div className="gcv-metric gcv-metric-dim">
              <span className="gcv-metric-label">flipped bit</span>
              <span className="gcv-metric-value gcv-metric-dimval">
                {current.flipped >= 0 ? `bit ${current.flipped}` : current.activeI === 0 ? 'none (first)' : '—'}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="gcv-metric">
              <span className="gcv-metric-label">level</span>
              <span className="gcv-metric-value">{current.level} of {width}</span>
            </div>
            <div className="gcv-metric">
              <span className="gcv-metric-label">codes</span>
              <span className="gcv-metric-value">{(current.list || []).length}</span>
            </div>
            <div className="gcv-metric gcv-metric-dim">
              <span className="gcv-metric-label">invariant</span>
              <span className="gcv-metric-value gcv-metric-dimval">adjacent Hamming dist = 1</span>
            </div>
          </>
        )}
      </div>

      <div className="gcv-arith">
        <span className="gcv-arith-label">trace</span>
        <span className="gcv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
