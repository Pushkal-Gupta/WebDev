import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './FastExponentiationViz.css';

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

function generate(seed) {
  const rnd = mulberry32(seed);
  const base = 2 + Math.floor(rnd() * 4); // 2..5
  const exp = 9 + Math.floor(rnd() * 14); // 9..22
  return { base, exp };
}

// Binary exponentiation: walk exponent bits low→high, square base each step,
// multiply into result when the bit is 1.
function buildFrames(base, exp) {
  const frames = [];
  const bits = exp.toString(2).split('').reverse(); // LSB first
  let result = 1;
  let b = base;
  frames.push({ idx: -1, bit: null, result, b, exp,
    note: `Compute ${base}^${exp}. Write the exponent in binary: ${exp} = ${exp.toString(2)}₂. Walk the bits from least to most significant: square the base each step, and fold it into the result wherever a bit is 1.` });
  for (let i = 0; i < bits.length; i++) {
    const bit = bits[i] === '1';
    const place = 1 << i;
    let newResult = result;
    if (bit) newResult = result * b;
    frames.push({ idx: i, bit, place, result: newResult, prevResult: result, b, used: bit,
      note: bit
        ? `Bit ${i} is 1 (value ${place}). The running square is ${b} = ${base}^${place}. Multiply it into the result: ${result} × ${b} = ${newResult}.`
        : `Bit ${i} is 0. Skip the multiply — but still square the base for the next bit.` });
    result = newResult;
    b = b * b;
  }
  frames.push({ idx: bits.length, bit: null, result, b, done: true,
    note: `All ${bits.length} bits consumed. ${base}^${exp} = ${result}. Only ${bits.length} squarings instead of ${exp} multiplications — O(log exp) work.` });
  return { frames, bits };
}

const DEFAULT_SEED = 8;

export default function FastExponentiationViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const { base, exp } = useMemo(() => generate(seed), [seed]);
  const { frames, bits } = useMemo(() => buildFrames(base, exp), [base, exp]);
  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];

  const isRunning = running && step < total - 1;
  const delay = Math.round(1000 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, total]);

  const reset = () => { setRunning(false); setStep(0); };
  const shuffle = () => { setRunning(false); setStep(0); setSeed((s) => (s * 1664525 + 1013904223) >>> 0); };

  const W = 940;
  const H = 200;
  const n = bits.length;
  const padX = 56;
  const usable = W - padX * 2;
  const gap = 12;
  const cellW = Math.min(64, (usable - gap * (n - 1)) / n);
  const cellH = 56;
  const rowY = 80;
  // bits are LSB-first in the model; display MSB-first (reverse index)
  const startX = padX + (usable - (n * cellW + (n - 1) * gap)) / 2;
  const cellX = (displayPos) => startX + displayPos * (cellW + gap);

  return (
    <div className="fex">
      <div className="fex-head">
        <h3 className="fex-title">Fast exponentiation — square and multiply</h3>
        <p className="fex-sub">
          Raising to a power costs O(log n), not O(n): read the exponent&apos;s bits, square the base each
          step, and multiply into the result only on a 1-bit. Step through to watch the bits drive it.
        </p>
      </div>

      <div className="fex-controls">
        <div className="fex-buttons">
          <button type="button" className="fex-btn fex-btn-primary" onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="fex-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="fex-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="fex-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="fex-btn fex-btn-shuffle" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        </div>
        <label className="fex-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="fex-speed-range" />
          <span className="fex-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="fex-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="fex-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fex-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={32} y={50} className="fex-eqn">{base}^{exp} · exponent = {exp.toString(2)}₂</text>

          {bits.map((bitChar, i) => {
            // display MSB on the left: displayPos = n-1-i
            const displayPos = n - 1 - i;
            const isActive = i === cur.idx;
            const consumed = cur.idx >= 0 && i < cur.idx;
            const isOne = bitChar === '1';
            let stroke = 'var(--border)';
            let fill = 'var(--bg)';
            if (isActive) { stroke = isOne ? 'var(--accent)' : 'var(--text-dim)'; fill = isOne ? 'rgba(var(--accent-rgb), 0.28)' : 'var(--hover-box)'; }
            else if (consumed && isOne) { fill = 'rgba(var(--accent-rgb), 0.1)'; stroke = 'var(--accent)'; }
            return (
              <g key={i}>
                <rect x={cellX(displayPos)} y={rowY} width={cellW} height={cellH} rx={7} fill={fill} stroke={stroke} strokeWidth={isActive ? 2.6 : 1.3} />
                <text x={cellX(displayPos) + cellW / 2} y={rowY + cellH / 2 + 7} className="fex-bit"
                  style={{ fill: isOne ? 'var(--accent)' : 'var(--text-dim)' }}>{bitChar}</text>
                <text x={cellX(displayPos) + cellW / 2} y={rowY + cellH + 18} className="fex-place">{1 << i}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fex-readouts">
        <div className="fex-metric"><span className="fex-metric-label">result</span><span className="fex-metric-val fex-result">{cur.result}</span></div>
        <div className="fex-metric"><span className="fex-metric-label">running square</span><span className="fex-metric-val">{cur.b}</span></div>
        <div className="fex-metric"><span className="fex-metric-label">bit</span><span className="fex-metric-val">{cur.idx < 0 || cur.done ? '—' : (cur.bit ? '1 · multiply' : '0 · skip')}</span></div>
      </div>

      <div className="fex-trace">
        <span className="fex-trace-label">trace</span>
        <span className="fex-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
