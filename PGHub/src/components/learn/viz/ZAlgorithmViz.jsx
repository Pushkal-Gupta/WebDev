import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './ZAlgorithmViz.css';

const DEFAULT_S = 'aabxaabxcaabxaabxay';

function buildFrames(s) {
  const n = s.length;
  const frames = [];
  const Z = new Array(n).fill(0);
  let l = 0;
  let r = 0;

  frames.push({
    phase: 'init',
    i: -1,
    l: 0,
    r: 0,
    Z: [...Z],
    compI: -1,
    compJ: -1,
    note: 'Start: l = r = 0, Z[0] := 0 by convention.',
  });

  for (let i = 1; i < n; i++) {
    if (i < r) {
      const copy = Math.min(r - i, Z[i - l]);
      Z[i] = copy;
      frames.push({
        phase: 'copy',
        i, l, r,
        Z: [...Z],
        compI: -1,
        compJ: -1,
        note: `i = ${i} is inside the Z-box [${l}, ${r - 1}]. Copy Z[i − l] = Z[${i - l}] = ${Z[i - l]}, capped by r − i = ${r - i} → Z[${i}] := ${copy}.`,
      });
    } else {
      Z[i] = 0;
      frames.push({
        phase: 'reset',
        i, l, r,
        Z: [...Z],
        compI: -1,
        compJ: -1,
        note: `i = ${i} is past r = ${r}. Start a fresh match from scratch.`,
      });
    }

    while (i + Z[i] < n && s[Z[i]] === s[i + Z[i]]) {
      Z[i]++;
      frames.push({
        phase: 'extend',
        i, l, r,
        Z: [...Z],
        compI: i + Z[i] - 1,
        compJ: Z[i] - 1,
        note: `Match: s[${Z[i] - 1}] = '${s[Z[i] - 1]}' = s[${i + Z[i] - 1}]. Extend Z[${i}] → ${Z[i]}.`,
      });
    }

    frames.push({
      phase: 'mismatch',
      i, l, r,
      Z: [...Z],
      compI: i + Z[i] < n ? i + Z[i] : -1,
      compJ: Z[i] < n ? Z[i] : -1,
      note: i + Z[i] < n
        ? `Mismatch: s[${Z[i]}] = '${s[Z[i]]}' ≠ s[${i + Z[i]}] = '${s[i + Z[i]]}'. Stop extending.`
        : `Walked off end of string. Stop extending.`,
    });

    if (i + Z[i] > r) {
      l = i;
      r = i + Z[i];
      frames.push({
        phase: 'box-update',
        i, l, r,
        Z: [...Z],
        compI: -1,
        compJ: -1,
        note: `New rightmost Z-box: [l, r) = [${l}, ${r}).`,
      });
    }
  }

  frames.push({
    phase: 'done',
    i: n,
    l, r,
    Z: [...Z],
    compI: -1,
    compJ: -1,
    note: `Done. Z-array fully built in O(n).`,
  });

  return frames;
}

export default function ZAlgorithmViz() {
  const [sInput, setSInput] = useState(DEFAULT_S);
  const [s, setS] = useState(DEFAULT_S);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(s), [s]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStep((s2) => Math.min(s2 + 1, totalSteps - 1));
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

  const apply = () => {
    const next = sInput.trim();
    if (!next || next === s) return;
    reset();
    setS(next);
  };

  const n = s.length;
  const cellW = Math.min(40, Math.max(22, 640 / Math.max(n, 6)));
  const padX = 30;
  const rowY = 60;
  const zRowY = rowY + cellW + 18;
  const W = padX * 2 + cellW * n;
  const H = zRowY + cellW + 60;

  const inBox = (idx) => current.l !== current.r && idx >= current.l && idx < current.r;
  const isCompS = current.compJ >= 0;
  const isCompT = current.compI >= 0;

  return (
    <div className="zalg">
      <div className="zalg-head">
        <h3 className="zalg-title">Z-algorithm — build Z[i] in linear time</h3>
        <p className="zalg-sub">
          Z[i] is the longest substring starting at i that matches a prefix of s. Maintain the rightmost
          Z-box [l, r) so each character is touched O(1) times amortized.
        </p>
      </div>

      <div className="zalg-controls">
        <div className="zalg-field">
          <span className="zalg-label">string s</span>
          <input
            className="zalg-input"
            value={sInput}
            onChange={(e) => setSInput(e.target.value)}
            spellCheck={false}
          />
        </div>
        <button type="button" className="zalg-btn" onClick={apply} disabled={!sInput.trim() || sInput.trim() === s}>
          Apply
        </button>

        <div className="zalg-actions">
          <div className="zalg-buttons">
            <button
              type="button"
              className="zalg-btn zalg-btn-primary"
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
              className="zalg-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="zalg-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="zalg-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="zalg-speed">
            <span className="zalg-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="zalg-speed-range"
            />
            <span className="zalg-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="zalg-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="zalg-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="zalg-svg" preserveAspectRatio="xMidYMid meet">
          <text x={padX} y={32} className="zalg-row-label">s</text>
          <text x={padX} y={zRowY - 4} className="zalg-row-label">Z</text>

          {current.l !== current.r && (
            <rect
              x={padX + current.l * cellW - 2}
              y={rowY - 4}
              width={(current.r - current.l) * cellW + 4}
              height={cellW + 8}
              fill="rgba(var(--accent-rgb), 0.12)"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              rx="4"
            />
          )}

          {[...s].map((ch, idx) => {
            const x = padX + idx * cellW;
            const highlight = idx === current.i;
            const isPrefixCompare = isCompS && idx === current.compJ;
            const isWindowCompare = isCompT && idx === current.compI;
            return (
              <g key={`s-${idx}`}>
                <rect
                  x={x}
                  y={rowY}
                  width={cellW - 2}
                  height={cellW}
                  className="zalg-cell-rect"
                  fill={
                    isPrefixCompare || isWindowCompare
                      ? (current.phase === 'mismatch' ? 'rgba(var(--accent-rgb), 0.0)' : 'rgba(var(--accent-rgb), 0.18)')
                      : highlight
                      ? 'rgba(var(--accent-rgb), 0.10)'
                      : inBox(idx)
                      ? 'var(--surface)'
                      : 'var(--bg)'
                  }
                  stroke={
                    isPrefixCompare && current.phase === 'mismatch' ? 'var(--hard)' :
                    isWindowCompare && current.phase === 'mismatch' ? 'var(--hard)' :
                    isPrefixCompare || isWindowCompare ? 'var(--easy)' :
                    highlight ? 'var(--accent)' : 'var(--border)'
                  }
                  strokeWidth={highlight || isPrefixCompare || isWindowCompare ? 2 : 1}
                />
                <text x={x + (cellW - 2) / 2} y={rowY + cellW / 2 + 4} className="zalg-cell-value">{ch}</text>
                <text x={x + (cellW - 2) / 2} y={rowY + cellW + 14} className="zalg-cell-index">{idx}</text>
              </g>
            );
          })}

          {current.i >= 0 && current.i < n && (
            <g>
              <line
                x1={padX + current.i * cellW + (cellW - 2) / 2}
                y1={rowY - 14}
                x2={padX + current.i * cellW + (cellW - 2) / 2}
                y2={rowY - 4}
                stroke="var(--hue-pink)"
                strokeWidth="2"
                markerEnd="url(#zalg-iarrow)"
              />
              <text x={padX + current.i * cellW + (cellW - 2) / 2} y={rowY - 18} fontSize="10" fontFamily="var(--mono)" fill="var(--hue-pink)" textAnchor="middle" fontWeight="700">
                i = {current.i}
              </text>
            </g>
          )}

          <defs>
            <marker id="zalg-iarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {current.Z.map((z, idx) => {
            const x = padX + idx * cellW;
            const isCurrent = idx === current.i;
            return (
              <g key={`z-${idx}`}>
                <rect
                  x={x}
                  y={zRowY}
                  width={cellW - 2}
                  height={cellW}
                  className="zalg-cell-rect"
                  fill={z > 0 ? 'rgba(var(--easy-rgb, 34, 197, 94), 0.10)' : 'var(--bg)'}
                  stroke={isCurrent ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isCurrent ? 2 : 1}
                  style={z > 0 ? { fill: 'rgba(var(--accent-rgb), 0.07)' } : {}}
                />
                <text x={x + (cellW - 2) / 2} y={zRowY + cellW / 2 + 4} className="zalg-cell-value" fill={z > 0 ? 'var(--accent)' : 'var(--text-dim)'}>
                  {z}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="zalg-metrics">
        <div className="zalg-metric">
          <span className="zalg-metric-label">i</span>
          <span className="zalg-metric-value">{current.i < 0 ? '—' : current.i}</span>
        </div>
        <div className="zalg-metric">
          <span className="zalg-metric-label">l</span>
          <span className="zalg-metric-value">{current.l}</span>
        </div>
        <div className="zalg-metric">
          <span className="zalg-metric-label">r</span>
          <span className="zalg-metric-value">{current.r}</span>
        </div>
        <div className="zalg-metric">
          <span className="zalg-metric-label">Z[i]</span>
          <span className="zalg-metric-value">{current.i >= 0 && current.i < n ? current.Z[current.i] : '—'}</span>
        </div>
        <div className="zalg-metric zalg-metric-dim">
          <span className="zalg-metric-label">phase</span>
          <span className="zalg-metric-value zalg-metric-dimval">{current.phase}</span>
        </div>
      </div>

      <div className="zalg-arith">
        <span className="zalg-arith-label">trace</span>
        <span className="zalg-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
