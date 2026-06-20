import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './CyclicSortViz.css';

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

// A permutation of 1..n, shuffled — the classic cyclic-sort setup.
function generateArray(seed) {
  const rnd = mulberry32(seed);
  const n = 7 + Math.floor(rnd() * 2); // 7..8
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One frame per comparison/swap. Value v belongs at index v-1.
function buildFrames(input) {
  const arr = input.slice();
  const frames = [];
  let i = 0;
  let swaps = 0;

  frames.push({ arr: arr.slice(), i, target: -1, action: 'start', swaps,
    note: `Numbers are 1..${arr.length} in some order, so each value v has a fixed home at index v-1. Walk left to right: whenever arr[i] is not home, swap it there. Each swap places at least one number correctly.` });

  while (i < arr.length) {
    const v = arr[i];
    const home = v - 1;
    if (arr[i] !== arr[home]) {
      frames.push({ arr: arr.slice(), i, target: home, action: 'swap', swaps,
        note: `arr[${i}] = ${v} belongs at index ${home}, but index ${home} holds ${arr[home]}. Swap them — ${v} goes home. Do NOT advance i yet: the value that just arrived at index ${i} still needs checking.` });
      [arr[i], arr[home]] = [arr[home], arr[i]];
      swaps++;
    } else {
      frames.push({ arr: arr.slice(), i, target: home, action: 'settled', swaps,
        note: `arr[${i}] = ${v} is already at its home index ${home}. Nothing to do — advance i.` });
      i++;
    }
  }
  frames.push({ arr: arr.slice(), i: arr.length - 1, target: -1, action: 'done', swaps,
    note: `Sorted in ${swaps} swaps — at most n swaps total because each one settles a number for good. O(n) time, O(1) space. The same index-as-home idea finds missing or duplicate numbers in a single pass.` });
  return frames;
}

const DEFAULT_SEED = 5;

export default function CyclicSortViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const input = useMemo(() => generateArray(seed), [seed]);
  const frames = useMemo(() => buildFrames(input), [input]);
  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];

  const isRunning = running && step < total - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, total]);

  const reset = () => { setRunning(false); setStep(0); };
  const shuffle = () => { setRunning(false); setStep(0); setSeed((s) => (s * 1664525 + 1013904223) >>> 0); };

  const W = 940;
  const H = 230;
  const n = cur.arr.length;
  const padX = 40;
  const usable = W - padX * 2;
  const gap = 10;
  const cellW = Math.min(82, (usable - gap * (n - 1)) / n);
  const cellH = 60;
  const rowY = 110;
  const startX = padX + (usable - (n * cellW + (n - 1) * gap)) / 2;
  const cellX = (i) => startX + i * (cellW + gap);

  return (
    <div className="cyc">
      <div className="cyc-head">
        <h3 className="cyc-title">Cyclic sort — place each number at its index</h3>
        <p className="cyc-sub">
          For a permutation of 1..n, value v&apos;s home is index v&minus;1. Repeatedly swap whatever sits at
          i to its home until it&apos;s settled, then advance. Step through to watch it converge.
        </p>
      </div>

      <div className="cyc-controls">
        <div className="cyc-buttons">
          <button type="button" className="cyc-btn cyc-btn-primary" onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="cyc-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="cyc-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="cyc-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="cyc-btn cyc-btn-shuffle" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        </div>
        <label className="cyc-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="cyc-speed-range" />
          <span className="cyc-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="cyc-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="cyc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cyc-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={32} y={52} className="cyc-info">swaps: {cur.swaps} · i = {cur.i}</text>

          {/* swap arc between i and target */}
          {cur.action === 'swap' && cur.target >= 0 && (() => {
            const x1 = cellX(cur.i) + cellW / 2;
            const x2 = cellX(cur.target) + cellW / 2;
            const midX = (x1 + x2) / 2;
            return <path d={`M ${x1} ${rowY - 6} Q ${midX} ${rowY - 46} ${x2} ${rowY - 6}`} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" />;
          })()}

          {cur.arr.map((v, idx) => {
            const settled = v - 1 === idx;
            const isI = idx === cur.i;
            const isTarget = idx === cur.target && cur.action === 'swap';
            let fill = settled ? 'rgba(var(--accent-rgb), 0.16)' : 'var(--bg)';
            let stroke = settled ? 'var(--accent)' : 'var(--border)';
            if (isI) { stroke = 'var(--hue-pink)'; }
            if (isTarget) { stroke = 'var(--accent)'; fill = 'rgba(var(--accent-rgb), 0.28)'; }
            return (
              <g key={`c-${idx}`}>
                <rect x={cellX(idx)} y={rowY} width={cellW} height={cellH} rx={8} fill={fill} stroke={stroke} strokeWidth={isI || isTarget ? 2.6 : settled ? 1.8 : 1.2} />
                <text x={cellX(idx) + cellW / 2} y={rowY + cellH / 2 + 7} className="cyc-cell-val"
                  style={{ fill: settled ? 'var(--accent)' : 'var(--text-main)' }}>{v}</text>
                <text x={cellX(idx) + cellW / 2} y={rowY + cellH + 18} className="cyc-cell-idx">{idx}</text>
                {settled && <text x={cellX(idx) + cellW / 2} y={rowY - 10} className="cyc-home">home</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cyc-trace">
        <span className="cyc-trace-label">trace</span>
        <span className="cyc-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
