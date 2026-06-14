import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './SubsetEnumerationViz.css';

function maskBits(mask, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push((mask >> i) & 1);
  return out;
}

function maskStr(mask, n) {
  return maskBits(mask, n).join('');
}

function subsetOf(mask, labels) {
  const n = labels.length;
  const picked = [];
  for (let i = 0; i < n; i++) {
    if ((mask >> i) & 1) picked.push(labels[i]);
  }
  return picked;
}

function setText(picked) {
  return picked.length ? `{ ${picked.join(', ')} }` : '{ } (empty set)';
}

// One frame per mask value 0 .. 2^n - 1.
function buildFrames(labels) {
  const n = labels.length;
  const total = 1 << n;
  const frames = [];
  const collected = [];

  for (let mask = 0; mask < total; mask++) {
    const picked = subsetOf(mask, labels);
    collected.push(picked.slice());
    frames.push({
      n,
      mask,
      total,
      bits: maskBits(mask, n),
      picked: picked.slice(),
      // snapshot of every subset assembled up to and including this mask
      collected: collected.map((s) => s.slice()),
      note: `mask ${maskStr(mask, n)} (decimal ${mask}) -> ${setText(picked)}. ${
        mask + 1 === total
          ? `All ${total} = 2^${n} subsets enumerated — that is the full power set.`
          : `Each bit i answers "is element ${labels[0]}.. in?" — bit set means include element i.`
      }`,
    });
  }
  return frames;
}

const DEFAULT_LABELS_3 = ['a', 'b', 'c'];
const DEFAULT_LABELS_4 = ['a', 'b', 'c', 'd'];

function sanitizeLabel(raw, fallback) {
  const t = (raw || '').trim().slice(0, 3);
  return t.length ? t : fallback;
}

export default function SubsetEnumerationViz() {
  const [n, setN] = useState(3);
  const [labels3, setLabels3] = useState(DEFAULT_LABELS_3);
  const [labels4, setLabels4] = useState(DEFAULT_LABELS_4);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const labels = n === 3 ? labels3 : labels4;

  const frames = useMemo(() => buildFrames(labels), [labels]);

  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
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

  const switchN = (next) => {
    if (next === n) return;
    setIsRunningRaw(false);
    setStep(0);
    setN(next);
  };

  const updateLabel = (idx, value) => {
    const fallback = String.fromCharCode(97 + idx);
    const clean = sanitizeLabel(value, fallback);
    if (n === 3) {
      setLabels3((prev) => prev.map((l, i) => (i === idx ? clean : l)));
    } else {
      setLabels4((prev) => prev.map((l, i) => (i === idx ? clean : l)));
    }
    setIsRunningRaw(false);
    setStep(0);
  };

  // ---- geometry ----
  const W = 940;
  const H = 380;
  const cellGap = 12;

  // bit register: n cells centered
  const regLeft = 200;
  const regRight = W - 60;
  const regUsable = regRight - regLeft;
  const cellW = Math.min(96, (regUsable - cellGap * (n - 1)) / n);
  const regSpan = cellW * n + cellGap * (n - 1);
  const regStart = regLeft + (regUsable - regSpan) / 2;
  const cellX = (c) => regStart + c * (cellW + cellGap);
  const regY = 96;
  const cellH = 58;

  // power-set grid of all 2^n masks as small chips
  const total = current.total;
  const chipTop = 226;
  const chipBottom = H - 30;
  const cols = total <= 8 ? 8 : 8;
  const rows = Math.ceil(total / cols);
  const chipAreaLeft = 36;
  const chipAreaRight = W - 36;
  const chipUsable = chipAreaRight - chipAreaLeft;
  const chipGap = 8;
  const chipW = (chipUsable - chipGap * (cols - 1)) / cols;
  const chipH = Math.min(44, (chipBottom - chipTop - chipGap * (rows - 1)) / rows);
  const chipX = (i) => chipAreaLeft + (i % cols) * (chipW + chipGap);
  const chipY = (i) => chipTop + Math.floor(i / cols) * (chipH + chipGap);

  return (
    <div className="sev">
      <div className="sev-head">
        <h3 className="sev-title">Power set by bitmask — count 0 to 2^n and read off the subset</h3>
        <p className="sev-sub">
          Every subset of an n-element set maps to one n-bit number. Bit i set means &ldquo;include element
          i&rdquo;. Counting a mask from 0 up to 2^n&minus;1 walks through all 2^n subsets exactly once.
        </p>
      </div>

      <div className="sev-controls">
        <div className="sev-nrow">
          <div className="sev-modes">
            <button
              type="button"
              className={`sev-mode ${n === 3 ? 'sev-mode-active' : ''}`}
              onClick={() => switchN(3)}
            >
              n = 3 (8 subsets)
            </button>
            <button
              type="button"
              className={`sev-mode ${n === 4 ? 'sev-mode-active' : ''}`}
              onClick={() => switchN(4)}
            >
              n = 4 (16 subsets)
            </button>
          </div>

          <div className="sev-labels">
            <span className="sev-labels-tag">elements</span>
            {labels.map((l, i) => (
              <input
                key={`lbl-${i}`}
                type="text"
                value={l}
                onChange={(e) => updateLabel(i, e.target.value)}
                className="sev-label-input"
                spellCheck={false}
                aria-label={`element ${i} label`}
              />
            ))}
          </div>
        </div>

        <div className="sev-actions">
          <div className="sev-buttons">
            <button
              type="button"
              className="sev-btn sev-btn-primary"
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
              className="sev-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="sev-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="sev-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="sev-speed">
            <span className="sev-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="sev-speed-range"
            />
            <span className="sev-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="sev-stepcount">
            mask <strong>{safeStep}</strong> / {totalSteps - 1}
          </div>
        </div>
      </div>

      <div className="sev-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sev-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={W - 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />

          <text x={32} y={44} className="sev-row-label">
            current mask = {current.mask} = {maskStr(current.mask, n)} (bit i selects element i)
          </text>

          {/* element-label header above each bit */}
          {labels.map((l, idx) => {
            // column c (0 = MSB / highest bit) maps to bit position n-1-c
            const c = n - 1 - idx;
            return (
              <text key={`hl-${idx}`} x={cellX(c) + cellW / 2} y={regY - 14} className="sev-elem">
                {l}
              </text>
            );
          })}

          {/* bit register row: MSB (bit n-1) on the left */}
          <text x={40} y={regY + cellH / 2 + 6} className="sev-reg-label">
            mask
          </text>
          {current.bits.map((v, c) => {
            const pos = n - 1 - c;
            const on = v === 1;
            return (
              <g key={`bit-${c}`}>
                <rect
                  x={cellX(c)}
                  y={regY}
                  width={cellW}
                  height={cellH}
                  rx={8}
                  fill={on ? 'var(--accent)' : 'var(--bg)'}
                  stroke={on ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={on ? 2.4 : 1.2}
                />
                <text
                  x={cellX(c) + cellW / 2}
                  y={regY + cellH / 2 + 7}
                  className="sev-bit"
                  style={{ fill: on ? 'var(--bg)' : 'var(--text-dim)' }}
                >
                  {v}
                </text>
                <text x={cellX(c) + cellW / 2} y={regY + cellH + 18} className="sev-place">
                  2^{pos} = {1 << pos}
                </text>
              </g>
            );
          })}

          {/* assembled subset readout */}
          <text x={regRight + 8} y={regY + cellH / 2 + 6} className="sev-subset" textAnchor="end">
            {setText(current.picked)}
          </text>

          {/* power-set grid: every mask 0..2^n-1 as a chip, filled as we count past it */}
          <text x={36} y={chipTop - 10} className="sev-row-label">
            power set — {total} subsets, one per mask (filled = enumerated so far)
          </text>
          {Array.from({ length: total }).map((_, i) => {
            const isCurrent = i === current.mask;
            const done = i <= current.mask;
            const fill = isCurrent
              ? 'var(--hue-pink)'
              : done
                ? 'rgba(var(--accent-rgb), 0.30)'
                : 'var(--bg)';
            const stroke = isCurrent ? 'var(--hue-pink)' : done ? 'var(--accent)' : 'var(--border)';
            const picked = subsetOf(i, labels);
            const txt = picked.length ? picked.join('') : 'Ø';
            return (
              <g key={`chip-${i}`}>
                <rect
                  x={chipX(i)}
                  y={chipY(i)}
                  width={chipW}
                  height={chipH}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCurrent ? 2.4 : 1}
                />
                <text
                  x={chipX(i) + chipW / 2}
                  y={chipY(i) + chipH / 2 - 2}
                  className="sev-chip-mask"
                  style={{ fill: isCurrent || done ? 'var(--bg)' : 'var(--text-dim)' }}
                >
                  {maskStr(i, n)}
                </text>
                <text
                  x={chipX(i) + chipW / 2}
                  y={chipY(i) + chipH / 2 + 13}
                  className="sev-chip-set"
                  style={{ fill: isCurrent || done ? 'var(--bg)' : 'var(--text-dim)' }}
                >
                  {txt}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sev-metrics">
        <div className="sev-metric">
          <span className="sev-metric-label">mask (binary)</span>
          <span className="sev-metric-value">{maskStr(current.mask, n)}</span>
        </div>
        <div className="sev-metric">
          <span className="sev-metric-label">mask (decimal)</span>
          <span className="sev-metric-value">{current.mask}</span>
        </div>
        <div className="sev-metric">
          <span className="sev-metric-label">subset</span>
          <span className="sev-metric-value">{setText(current.picked)}</span>
        </div>
        <div className="sev-metric sev-metric-dim">
          <span className="sev-metric-label">subsets so far</span>
          <span className="sev-metric-value sev-metric-dimval">
            {current.mask + 1} of {total} = 2^{n}
          </span>
        </div>
      </div>

      <div className="sev-arith">
        <span className="sev-arith-label">trace</span>
        <span className="sev-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
