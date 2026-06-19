import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './PrefixSumViz.css';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateArray(seed) {
  const rnd = mulberry32(seed);
  const n = 7 + Math.floor(rnd() * 2); // 7..8
  return Array.from({ length: n }, () => Math.floor(rnd() * 9) + 1); // 1..9
}

// Build the prefix table one cell at a time, then answer a range query.
function buildFrames(arr) {
  const frames = [];
  const prefix = [0];
  frames.push({
    phase: 'build', filled: 1, prefix: prefix.slice(), active: 0,
    note: `prefix[0] = 0 by convention — the sum of zero elements. Defining this sentinel is what lets every range query become a single subtraction with no special-casing for ranges that start at index 0.`,
  });
  for (let i = 0; i < arr.length; i++) {
    prefix.push(prefix[i] + arr[i]);
    frames.push({
      phase: 'build', filled: i + 2, prefix: prefix.slice(), active: i + 1,
      note: `prefix[${i + 1}] = prefix[${i}] + arr[${i}] = ${prefix[i]} + ${arr[i]} = ${prefix[i + 1]}. Each entry is the sum of all elements strictly before that boundary.`,
    });
  }
  return { frames, prefix };
}

const DEFAULT_SEED = 21;

export default function PrefixSumViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [ql, setQl] = useState(1);
  const [qr, setQr] = useState(4);
  const timer = useRef(null);

  const arr = useMemo(() => generateArray(seed), [seed]);
  const { frames, prefix } = useMemo(() => buildFrames(arr), [arr]);
  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];
  const built = step >= total - 1;

  const isRunning = running && step < total - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, total]);

  // keep query bounds valid for the current array
  const L = Math.min(ql, arr.length - 1);
  const R = Math.min(Math.max(qr, L), arr.length - 1);
  const rangeSum = prefix[R + 1] - prefix[L];

  const reset = () => { setRunning(false); setStep(0); };
  const shuffle = () => { setRunning(false); setStep(0); setSeed((s) => (s * 1664525 + 1013904223) >>> 0); };

  const W = 940;
  const H = 280;
  const n = arr.length;
  const padX = 40;
  const usable = W - padX * 2;
  const gap = 10;
  const cellW = Math.min(80, (usable - gap * n) / (n + 1));
  const aRowY = 96;
  const pRowY = 196;
  const cellH = 50;
  const aStartX = padX + (usable - (n * cellW + (n - 1) * gap)) / 2;
  const aX = (i) => aStartX + i * (cellW + gap);
  const pStartX = padX + (usable - ((n + 1) * cellW + n * gap)) / 2;
  const pX = (i) => pStartX + i * (cellW + gap);

  return (
    <div className="pfx">
      <div className="pfx-head">
        <h3 className="pfx-title">Prefix sums — range queries in O(1)</h3>
        <p className="pfx-sub">
          Precompute cumulative sums once, then answer any range sum with a single subtraction:
          sum(l..r) = prefix[r+1] &minus; prefix[l]. Build the table, then drag the range.
        </p>
      </div>

      <div className="pfx-controls">
        <div className="pfx-buttons">
          <button type="button" className="pfx-btn pfx-btn-primary" onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="pfx-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="pfx-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}><SkipForward size={14} /> Build all</button>
          <button type="button" className="pfx-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="pfx-btn pfx-btn-shuffle" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        </div>
        <label className="pfx-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="pfx-speed-range" />
          <span className="pfx-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="pfx-stepcount">step <strong>{Math.min(step + 1, total)}</strong> / {total}</div>
      </div>

      <div className="pfx-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pfx-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />

          <text x={32} y={72} className="pfx-rowlabel">arr</text>
          {arr.map((v, i) => {
            const inRange = built && i >= L && i <= R;
            return (
              <g key={`a-${i}`}>
                <rect x={aX(i)} y={aRowY} width={cellW} height={cellH} rx={7}
                  fill={inRange ? 'rgba(var(--accent-rgb), 0.22)' : 'var(--bg)'}
                  stroke={inRange ? 'var(--accent)' : 'var(--border)'} strokeWidth={inRange ? 2.2 : 1.2} />
                <text x={aX(i) + cellW / 2} y={aRowY + cellH / 2 + 6} className="pfx-cell-val">{v}</text>
                <text x={aX(i) + cellW / 2} y={aRowY - 8} className="pfx-cell-idx">{i}</text>
              </g>
            );
          })}

          <text x={32} y={pRowY - 24} className="pfx-rowlabel">prefix</text>
          {prefix.map((v, i) => {
            const shown = i < cur.filled;
            const justFilled = i === cur.active;
            const isBoundL = built && i === L;
            const isBoundR = built && i === R + 1;
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            if (justFilled) { fill = 'var(--accent)'; stroke = 'var(--accent)'; }
            else if (isBoundL || isBoundR) { fill = 'rgba(var(--accent-rgb), 0.18)'; stroke = 'var(--hue-pink)'; }
            return (
              <g key={`p-${i}`} opacity={shown ? 1 : 0.18}>
                <rect x={pX(i)} y={pRowY} width={cellW} height={cellH} rx={7} fill={fill} stroke={stroke} strokeWidth={justFilled || isBoundL || isBoundR ? 2.4 : 1.2} />
                <text x={pX(i) + cellW / 2} y={pRowY + cellH / 2 + 6} className="pfx-cell-val"
                  style={{ fill: justFilled ? 'var(--bg)' : 'var(--text-main)' }}>{shown ? v : '?'}</text>
                <text x={pX(i) + cellW / 2} y={pRowY + cellH + 16} className="pfx-cell-idx">{i}</text>
                {(isBoundL || isBoundR) && (
                  <text x={pX(i) + cellW / 2} y={pRowY - 8} className="pfx-bound">{isBoundL ? 'l' : 'r+1'}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pfx-query">
        <div className="pfx-query-row">
          <label className="pfx-query-label">l
            <input type="range" min={0} max={arr.length - 1} value={L} onChange={(e) => setQl(Number(e.target.value))} disabled={!built} className="pfx-query-range" />
            <span className="pfx-query-num">{L}</span>
          </label>
          <label className="pfx-query-label">r
            <input type="range" min={0} max={arr.length - 1} value={R} onChange={(e) => setQr(Number(e.target.value))} disabled={!built} className="pfx-query-range" />
            <span className="pfx-query-num">{R}</span>
          </label>
        </div>
        <div className="pfx-query-result">
          {built
            ? <>sum({L}..{R}) = prefix[{R + 1}] &minus; prefix[{L}] = {prefix[R + 1]} &minus; {prefix[L]} = <strong>{rangeSum}</strong></>
            : <>Build the prefix table first, then drag l and r.</>}
        </div>
      </div>

      <div className="pfx-trace">
        <span className="pfx-trace-label">trace</span>
        <span className="pfx-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
