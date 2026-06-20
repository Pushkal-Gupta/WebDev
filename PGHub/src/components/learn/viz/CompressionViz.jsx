import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, FileText, Archive } from 'lucide-react';
import './CompressionViz.css';

const PRESETS = [
  { id: 'abra', label: 'ABRACADABRA', text: 'abracadabra abracadabra' },
  { id: 'runs', label: 'RUNS', text: 'aaaaaabbbbbbcccccc' },
  { id: 'fox', label: 'REPEAT PHRASE', text: 'the quick brown the quick brown' },
  { id: 'json', label: 'JSON-ISH', text: '{"a":1,"a":1,"a":1}' },
];

const MIN_MATCH = 3;
const WINDOW = 18;

function buildFrames(text) {
  const frames = [];
  const tokens = [];
  let i = 0;
  let literalBytes = 0;
  let refBytes = 0;

  const compressedSize = () => literalBytes + refBytes;

  const snap = (extra) => ({
    pos: i,
    tokens: tokens.slice(),
    matchStart: -1,
    matchLen: 0,
    srcStart: -1,
    decision: null,
    isRun: false,
    token: null,
    literalBytes,
    refBytes,
    compressed: compressedSize(),
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `Scan left to right over ${text.length} characters. At each spot, look back into the window for the longest run of characters already seen, and emit a back-reference instead of repeating them.`,
  }));

  while (i < text.length) {
    const lookStart = Math.max(0, i - WINDOW);
    let bestLen = 0;
    let bestSrc = -1;
    for (let s = lookStart; s < i; s += 1) {
      let len = 0;
      while (i + len < text.length && text[s + len] === text[i + len] && len < 255) len += 1;
      if (len > bestLen) {
        bestLen = len;
        bestSrc = s;
      }
    }

    if (bestLen >= MIN_MATCH) {
      const offset = i - bestSrc;
      const run = offset === 1;
      tokens.push({ kind: 'ref', offset, length: bestLen, run });
      refBytes += 2;
      const slice = text.slice(i, i + bestLen);
      frames.push(snap({
        matchStart: i,
        matchLen: bestLen,
        srcStart: bestSrc,
        decision: 'ref',
        isRun: run,
        token: { kind: 'ref', offset, length: bestLen, run },
        note: run
          ? `Run detected at position ${i}: "${slice}" — the same byte from offset ${offset} repeats ${bestLen} times. Emit a run-length back-reference ref(${offset},${bestLen}) for 2 bytes instead of ${bestLen} literals.`
          : `Longest match at position ${i}: "${slice}" already appears ${offset} chars back. Emit back-reference ref(${offset},${bestLen}) — 2 bytes replace ${bestLen} literals.`,
      }));
      i += bestLen;
    } else {
      const ch = text[i];
      tokens.push({ kind: 'lit', char: ch });
      literalBytes += 1;
      frames.push(snap({
        matchStart: i,
        matchLen: 1,
        srcStart: -1,
        decision: 'lit',
        token: { kind: 'lit', char: ch },
        note: `No back-reference of length ${MIN_MATCH}+ found at position ${i}. Emit the literal '${ch === ' ' ? '␣' : ch}' for 1 byte and advance one character.`,
      }));
      i += 1;
    }
  }

  frames.push(snap({
    pos: text.length,
    note: `Done. ${tokens.length} tokens encode ${text.length} bytes: ${tokens.filter((t) => t.kind === 'lit').length} literals + ${tokens.filter((t) => t.kind === 'ref').length} back-references. Estimated ${compressedSize()} bytes — every reference replaced a repeated substring with a tiny pointer.`,
  }));

  return frames;
}

export default function CompressionViz() {
  const [preset, setPreset] = useState('abra');
  const [algo, setAlgo] = useState('gzip');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const text = useMemo(
    () => PRESETS.find((p) => p.id === preset).text,
    [preset],
  );
  const frames = useMemo(() => buildFrames(text), [text]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchPreset = (id) => {
    if (id === preset) return;
    setIsRunning(false);
    setStep(0);
    setPreset(id);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const originalBytes = text.length;
  const gzipBytes = Math.max(1, current.compressed);
  const brotliBytes = Math.max(1, Math.round(gzipBytes * 0.88));
  const shownBytes = algo === 'gzip' ? gzipBytes : brotliBytes;
  const ratio = originalBytes / shownBytes;
  const saved = Math.round((1 - shownBytes / originalBytes) * 100);

  const tokenLabel = (t) => {
    if (!t) return '—';
    if (t.kind === 'lit') return `literal '${t.char === ' ' ? '␣' : t.char}'`;
    return `ref(${t.offset},${t.length})`;
  };

  // SVG geometry — character row
  const W = 940;
  const H = 420;
  const cellSize = 34;
  const cellGap = 4;
  const rowPad = 30;
  const perRow = Math.max(1, Math.floor((W - rowPad * 2) / (cellSize + cellGap)));
  const cellXY = (idx) => {
    const r = Math.floor(idx / perRow);
    const c = idx % perRow;
    return {
      x: rowPad + c * (cellSize + cellGap),
      y: 64 + r * (cellSize + 30),
      r,
      c,
    };
  };

  // bar chart geometry
  const chartX = 200;
  const chartY = 320;
  const chartW = W - chartX - rowPad;
  const barH = 26;
  const maxBytes = Math.max(originalBytes, 1);
  const barLen = (b) => Math.max(2, (b / maxBytes) * chartW);

  const inMatch = (idx) => current.matchStart >= 0
    && idx >= current.matchStart && idx < current.matchStart + current.matchLen;
  const inSrc = (idx) => current.srcStart >= 0
    && idx >= current.srcStart && idx < current.srcStart + current.matchLen;

  const arrow = (() => {
    if (current.decision !== 'ref' || current.srcStart < 0) return null;
    const a = cellXY(current.srcStart);
    const b = cellXY(current.matchStart);
    const x1 = a.x + cellSize / 2;
    const x2 = b.x + cellSize / 2;
    const sameRow = a.r === b.r;
    const y1 = a.y - 4;
    const y2 = b.y - 4;
    const lift = sameRow ? 30 + Math.abs(x2 - x1) * 0.18 : 22;
    const midX = (x1 + x2) / 2;
    const midY = Math.min(y1, y2) - lift;
    return { x1, y1, x2, y2, midX, midY };
  })();

  return (
    <div className="cmv">
      <div className="cmv-head">
        <h3 className="cmv-title">LZ77 dictionary compression — and why brotli beats gzip</h3>
        <p className="cmv-sub">
          Step a sliding window across the text. Each repeated substring becomes a back-reference (offset, length)
          instead of raw bytes, and the bar chart tracks how small the result gets.
        </p>
      </div>

      <div className="cmv-controls">
        <div className="cmv-modes" role="tablist" aria-label="Sample text">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`cmv-mode ${preset === p.id ? 'is-on' : ''}`}
              onClick={() => switchPreset(p.id)}
              aria-pressed={preset === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="cmv-modes cmv-algos" role="tablist" aria-label="Algorithm estimate">
          <button
            type="button"
            className={`cmv-mode ${algo === 'gzip' ? 'is-on' : ''}`}
            onClick={() => setAlgo('gzip')}
            aria-pressed={algo === 'gzip'}
          >
            <Archive size={13} /> GZIP
          </button>
          <button
            type="button"
            className={`cmv-mode ${algo === 'brotli' ? 'is-on' : ''}`}
            onClick={() => setAlgo('brotli')}
            aria-pressed={algo === 'brotli'}
          >
            <FileText size={13} /> BROTLI
          </button>
        </div>

        <label className="cmv-slider">
          <span className="cmv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cmv-range" aria-label="Playback speed"
          />
          <span className="cmv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="cmv-spacer" aria-hidden="true" />

        <div className="cmv-buttons">
          <button
            type="button"
            className="cmv-btn cmv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="cmv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cmv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cmv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cmv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cmv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cmv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="cmv-row-label" x={rowPad} y={38}>
            input text · sky = source, accent = current match, dim = already emitted
          </text>

          {text.split('').map((ch, idx) => {
            const { x, y } = cellXY(idx);
            const emitted = idx < current.pos;
            const cls = [
              'cmv-cell',
              inMatch(idx) && 'is-match',
              inSrc(idx) && 'is-src',
              !inMatch(idx) && !inSrc(idx) && emitted && 'is-emitted',
            ].filter(Boolean).join(' ');
            return (
              <g key={`c-${idx}`}>
                <rect className={cls} x={x} y={y} width={cellSize} height={cellSize} rx={5} />
                <text className="cmv-cell-text" x={x + cellSize / 2} y={y + cellSize / 2 + 5}>
                  {ch === ' ' ? '␣' : ch}
                </text>
                <text className="cmv-cell-idx" x={x + cellSize / 2} y={y + cellSize + 12}>{idx}</text>
              </g>
            );
          })}

          {arrow && (
            <g>
              <path
                className="cmv-arrow"
                d={`M ${arrow.x1} ${arrow.y1} Q ${arrow.midX} ${arrow.midY} ${arrow.x2} ${arrow.y2}`}
              />
              <path
                className="cmv-arrow-head"
                d={`M ${arrow.x2} ${arrow.y2} l -5 -7 l 10 0 Z`}
              />
              <text className="cmv-arrow-label" x={arrow.midX} y={arrow.midY + 2} textAnchor="middle">
                ref({current.matchStart - current.srcStart},{current.matchLen})
              </text>
            </g>
          )}

          <text className="cmv-row-label" x={rowPad} y={chartY - 18}>
            estimated size · original vs compressed
          </text>

          <text className="cmv-bar-name" x={chartX - 12} y={chartY + barH / 2 + 4} textAnchor="end">original</text>
          <rect className="cmv-bar cmv-bar-orig" x={chartX} y={chartY} width={barLen(originalBytes)} height={barH} rx={4} />
          <text className="cmv-bar-val" x={chartX + barLen(originalBytes) + 8} y={chartY + barH / 2 + 4}>{originalBytes} B</text>

          <text className="cmv-bar-name" x={chartX - 12} y={chartY + (barH + 12) + barH / 2 + 4} textAnchor="end">gzip</text>
          <rect className={`cmv-bar cmv-bar-gzip ${algo === 'gzip' ? 'is-on' : ''}`} x={chartX} y={chartY + (barH + 12)} width={barLen(gzipBytes)} height={barH} rx={4} />
          <text className="cmv-bar-val" x={chartX + barLen(gzipBytes) + 8} y={chartY + (barH + 12) + barH / 2 + 4}>{gzipBytes} B</text>

          <text className="cmv-bar-name" x={chartX - 12} y={chartY + (barH + 12) * 2 + barH / 2 + 4} textAnchor="end">brotli</text>
          <rect className={`cmv-bar cmv-bar-brotli ${algo === 'brotli' ? 'is-on' : ''}`} x={chartX} y={chartY + (barH + 12) * 2} width={barLen(brotliBytes)} height={barH} rx={4} />
          <text className="cmv-bar-val" x={chartX + barLen(brotliBytes) + 8} y={chartY + (barH + 12) * 2 + barH / 2 + 4}>{brotliBytes} B</text>
        </svg>
      </div>

      <div className="cmv-metrics">
        <div className="cmv-metric">
          <span className="cmv-metric-label">original</span>
          <span className="cmv-metric-value">{originalBytes} B</span>
        </div>
        <div className="cmv-metric">
          <span className="cmv-metric-label">compressed ({algo})</span>
          <span className="cmv-metric-value">{shownBytes} B</span>
        </div>
        <div className="cmv-metric">
          <span className="cmv-metric-label">ratio</span>
          <span className="cmv-metric-value is-good">{ratio.toFixed(1)}× · {saved}% saved</span>
        </div>
        <div className="cmv-metric">
          <span className="cmv-metric-label">tokens</span>
          <span className="cmv-metric-value">{current.tokens.length}</span>
        </div>
        <div className="cmv-metric">
          <span className="cmv-metric-label">current token</span>
          <span className={`cmv-metric-value ${current.decision === 'ref' ? 'is-ref' : current.decision === 'lit' ? 'is-lit' : ''}`}>
            {tokenLabel(current.token)}
          </span>
        </div>
      </div>

      <div className="cmv-narration">
        <span className="cmv-narration-label">trace</span>
        <span className="cmv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
