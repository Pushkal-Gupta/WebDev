import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './InsertionSortViz.css';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomArray(seed, n = 8) {
  const rng = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(2 + Math.floor(rng() * 18));
  return out;
}

// Build the full frame-by-frame trace of insertion sort.
function buildFrames(start) {
  const a = start.slice();
  const frames = [];
  let comparisons = 0;
  let shifts = 0;

  frames.push({
    arr: a.slice(), sortedTo: 0, key: null, keyIdx: null, cmpIdx: null,
    comparisons, shifts,
    note: 'Sorted prefix is empty. Take each element in turn and slide it left into place.',
  });

  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    frames.push({
      arr: a.slice(), sortedTo: i, key, keyIdx: i, cmpIdx: j,
      comparisons, shifts,
      note: `Take a[${i}] = ${key} as the key. Compare it leftward through the sorted prefix.`,
    });
    while (j >= 0 && a[j] > key) {
      comparisons++;
      frames.push({
        arr: a.slice(), sortedTo: i, key, keyIdx: null, cmpIdx: j,
        comparisons, shifts,
        note: `a[${j}] = ${a[j]} > ${key} -> shift it right.`,
      });
      a[j + 1] = a[j];
      shifts++;
      j--;
      frames.push({
        arr: a.slice(), sortedTo: i, key, keyIdx: null, cmpIdx: j,
        comparisons, shifts,
        note: `Shifted. Gap is now at index ${j + 1}. Keep comparing.`,
      });
    }
    if (j >= 0) comparisons++;
    a[j + 1] = key;
    frames.push({
      arr: a.slice(), sortedTo: i + 1, key: null, keyIdx: j + 1, cmpIdx: null,
      comparisons, shifts,
      note: `${j >= 0 ? `a[${j}] = ${a[j]} <= ${key} — stop. ` : 'Hit the front. '}Drop ${key} into index ${j + 1}. Prefix a[0..${i}] is sorted.`,
    });
  }

  frames.push({
    arr: a.slice(), sortedTo: a.length, key: null, keyIdx: null, cmpIdx: null,
    comparisons, shifts,
    note: `Done. ${comparisons} comparisons, ${shifts} shifts. Cost scales with the number of inversions in the input.`,
  });
  return frames;
}

export default function InsertionSortViz({ seed = 7 }) {
  const [base, setBase] = useState(() => randomArray(seed));
  const [frames, setFrames] = useState(() => buildFrames(randomArray(seed)));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const seedRef = useRef(seed);
  const timer = useRef(null);

  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];
  const delay = Math.round(800 / speed);
  const running = playing && step < total - 1;

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [running, step, delay, total]);

  const max = useMemo(() => Math.max(...base, 1), [base]);

  const reset = () => {
    setPlaying(false);
    setFrames(buildFrames(base));
    setStep(0);
  };

  const shuffle = () => {
    setPlaying(false);
    seedRef.current += 101;
    const next = randomArray(seedRef.current);
    setBase(next);
    setFrames(buildFrames(next));
    setStep(0);
  };

  const W = 920;
  const H = 300;
  const n = cur.arr.length;
  const slotW = (W - 60) / n;
  const barMaxH = 190;

  return (
    <div className="isv">
      <div className="isv-head">
        <h3 className="isv-title">Insertion sort — grow a sorted prefix one card at a time</h3>
        <p className="isv-sub">
          Each pass lifts the next element as a key and slides it left until a smaller element blocks it.
          Already-sorted input does zero shifts (O(n)); reverse-sorted shifts maximally (O(n&sup2;)).
        </p>
      </div>

      <div className="isv-controls">
        <button type="button" className="isv-btn" onClick={() => { if (step >= total - 1) return; setPlaying((p) => !p); }} disabled={step >= total - 1}>
          {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="isv-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}>
          <ChevronRight size={14} /> Step
        </button>
        <button type="button" className="isv-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}>
          <SkipForward size={14} /> Skip
        </button>
        <button type="button" className="isv-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        <button type="button" className="isv-btn" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        <label className="isv-speed">
          <span className="isv-speed-label">speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="isv-range" />
          <span className="isv-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <div className="isv-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="isv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="isv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={8} y={8} width={W - 16} height={H - 16} fill="var(--surface)" stroke="var(--border)" rx={8} />
          {/* sorted prefix band */}
          {cur.sortedTo > 0 && (
            <rect
              x={30} y={40}
              width={Math.max(0, cur.sortedTo * slotW)} height={barMaxH + 36}
              fill="rgba(var(--accent-rgb), 0.08)" stroke="var(--accent)" strokeWidth={1} strokeDasharray="4 3" rx={6}
            />
          )}
          {cur.arr.map((v, i) => {
            const x = 30 + i * slotW;
            const h = (v / max) * barMaxH;
            const y = 40 + 36 + (barMaxH - h);
            const isKey = i === cur.keyIdx;
            const isCmp = i === cur.cmpIdx;
            const inSorted = i < cur.sortedTo;
            let fill = inSorted ? 'rgba(var(--accent-rgb), 0.45)' : 'var(--bg)';
            let stroke = 'var(--border)';
            if (isCmp) { fill = 'var(--medium)'; stroke = 'var(--medium)'; }
            if (isKey) { fill = 'var(--hue-violet)'; stroke = 'var(--hue-violet)'; }
            return (
              <g key={i}>
                <rect x={x + 6} y={y} width={slotW - 12} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={isKey || isCmp ? 2.4 : 1.4} />
                <text x={x + slotW / 2} y={y - 6} className="isv-bar-label">{v}</text>
                <text x={x + slotW / 2} y={H - 22} className="isv-idx-label">{i}</text>
              </g>
            );
          })}
          {cur.key != null && (
            <g>
              <rect x={W - 150} y={22} width={128} height={28} rx={6} fill="var(--bg)" stroke="var(--hue-violet)" strokeWidth={1.5} />
              <text x={W - 138} y={40} className="isv-key-label">key = {cur.key}</text>
            </g>
          )}
        </svg>
      </div>

      <div className="isv-metrics">
        <div className="isv-metric"><span className="isv-metric-label">sorted prefix</span><span className="isv-metric-value">a[0..{Math.max(0, cur.sortedTo - 1)}]</span></div>
        <div className="isv-metric"><span className="isv-metric-label">comparisons</span><span className="isv-metric-value">{cur.comparisons}</span></div>
        <div className="isv-metric"><span className="isv-metric-label">shifts</span><span className="isv-metric-value">{cur.shifts}</span></div>
        <div className="isv-metric isv-metric-dim"><span className="isv-metric-label">key</span><span className="isv-metric-value isv-metric-dimval">{cur.key == null ? '—' : cur.key}</span></div>
      </div>

      <div className="isv-note">
        <span className="isv-note-label">trace</span>
        <span className="isv-note-text">{cur.note}</span>
      </div>
    </div>
  );
}
