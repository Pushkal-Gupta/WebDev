import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './KadaneViz.css';

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
  const n = 8 + Math.floor(rnd() * 3); // 8..10
  return Array.from({ length: n }, () => Math.floor(rnd() * 19) - 9); // -9..9
}

// One frame per element. Tracks running sum (best ending here) and global best.
function buildFrames(arr) {
  const frames = [];
  let cur = arr[0];
  let best = arr[0];
  let curStart = 0;
  let bestStart = 0;
  let bestEnd = 0;

  frames.push({
    i: 0, cur, best, curStart, curEnd: 0, bestStart, bestEnd,
    reset: false,
    note: `Seed with arr[0] = ${arr[0]}. "Current" tracks the best subarray ending exactly here; "best" tracks the best seen anywhere. Both start as the first element.`,
  });

  for (let i = 1; i < arr.length; i++) {
    const extend = cur + arr[i];
    const restart = extend < arr[i];
    if (restart) {
      cur = arr[i];
      curStart = i;
    } else {
      cur = extend;
    }
    let improved = false;
    if (cur > best) {
      best = cur;
      bestStart = curStart;
      bestEnd = i;
      improved = true;
    }
    frames.push({
      i, cur, best, curStart, curEnd: i, bestStart, bestEnd,
      reset: restart, improved,
      note: restart
        ? `arr[${i}] = ${arr[i]}. Extending would give ${extend}, worse than starting fresh at ${arr[i]} — so drop the old prefix and restart current here. ${improved ? `New global best ${best}.` : `Global best stays ${best}.`}`
        : `arr[${i}] = ${arr[i]}. Extend: current = ${cur}. ${improved ? `That beats the old best → best = ${best}, window [${bestStart}..${bestEnd}].` : `Still below best ${best}.`}`,
    });
  }
  frames.push({
    i: arr.length - 1, cur, best, curStart, curEnd: arr.length - 1, bestStart, bestEnd, done: true,
    note: `Done in one pass: maximum subarray sum = ${best}, from index ${bestStart} to ${bestEnd}. O(n) time, O(1) space — never re-scans, just decides extend-or-restart at each step.`,
  });
  return frames;
}

const DEFAULT_SEED = 12;

export default function KadaneViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const arr = useMemo(() => generateArray(seed), [seed]);
  const frames = useMemo(() => buildFrames(arr), [arr]);
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
  const H = 260;
  const n = arr.length;
  const padX = 40;
  const usable = W - padX * 2;
  const gap = 10;
  const cellW = Math.min(80, (usable - gap * (n - 1)) / n);
  const cellH = 56;
  const rowY = 150;
  const startX = padX + (usable - (n * cellW + (n - 1) * gap)) / 2;
  const cellX = (i) => startX + i * (cellW + gap);

  return (
    <div className="kdn">
      <div className="kdn-head">
        <h3 className="kdn-title">Kadane&apos;s algorithm — maximum subarray sum</h3>
        <p className="kdn-sub">
          At each element, decide whether to extend the current run or restart from here. The best window
          falls out in a single pass. Step through to see current vs. best evolve.
        </p>
      </div>

      <div className="kdn-controls">
        <div className="kdn-buttons">
          <button type="button" className="kdn-btn kdn-btn-primary" onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="kdn-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="kdn-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="kdn-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="kdn-btn kdn-btn-shuffle" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        </div>
        <label className="kdn-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="kdn-speed-range" />
          <span className="kdn-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="kdn-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="kdn-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="kdn-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* best window underline */}
          {cur.bestEnd >= cur.bestStart && (
            <rect
              x={cellX(cur.bestStart) - 4} y={rowY - 8}
              width={cellX(cur.bestEnd) - cellX(cur.bestStart) + cellW + 8} height={cellH + 16}
              fill="rgba(var(--accent-rgb), 0.10)" stroke="var(--accent)" strokeWidth={1.6} rx={10} strokeDasharray="5 4"
            />
          )}

          {arr.map((v, i) => {
            const inCur = i >= cur.curStart && i <= cur.curEnd;
            const isHead = i === cur.i;
            const neg = v < 0;
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            if (isHead) { fill = cur.reset ? 'var(--hard)' : 'var(--accent)'; stroke = fill; }
            else if (inCur) { fill = 'rgba(var(--accent-rgb), 0.28)'; stroke = 'var(--accent)'; }
            return (
              <g key={`c-${i}`}>
                <rect x={cellX(i)} y={rowY} width={cellW} height={cellH} rx={7} fill={fill} stroke={stroke} strokeWidth={isHead ? 2.6 : 1.3} />
                <text x={cellX(i) + cellW / 2} y={rowY + cellH / 2 + 6} className="kdn-cell-val"
                  style={{ fill: isHead ? 'var(--bg)' : neg ? 'var(--hard)' : 'var(--text-main)' }}>{v}</text>
                <text x={cellX(i) + cellW / 2} y={rowY + cellH + 18} className="kdn-cell-idx">{i}</text>
              </g>
            );
          })}

          <text x={32} y={52} className="kdn-stat">current (best ending here): <tspan className="kdn-stat-num">{cur.cur}</tspan></text>
          <text x={32} y={78} className="kdn-stat">best (global): <tspan className="kdn-stat-best">{cur.best}</tspan> · window [{cur.bestStart}..{cur.bestEnd}]</text>
        </svg>
      </div>

      <div className="kdn-readouts">
        <div className="kdn-metric"><span className="kdn-metric-label">current</span><span className="kdn-metric-val">{cur.cur}</span></div>
        <div className="kdn-metric"><span className="kdn-metric-label">best</span><span className="kdn-metric-val kdn-best">{cur.best}</span></div>
        <div className="kdn-metric"><span className="kdn-metric-label">window</span><span className="kdn-metric-val">[{cur.bestStart}..{cur.bestEnd}]</span></div>
        <div className="kdn-metric"><span className="kdn-metric-label">last move</span><span className="kdn-metric-val">{cur.reset ? 'restart' : 'extend'}</span></div>
      </div>

      <div className="kdn-trace">
        <span className="kdn-trace-label">trace</span>
        <span className="kdn-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
