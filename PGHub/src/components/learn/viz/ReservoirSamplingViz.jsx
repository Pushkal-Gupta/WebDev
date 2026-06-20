import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './ReservoirSamplingViz.css';

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

const K = 3;

// Algorithm R: first k items fill the reservoir; item i (0-based) replaces a
// random slot with probability k/(i+1).
function buildFrames(seed) {
  const rnd = mulberry32(seed);
  const n = 11;
  const stream = Array.from({ length: n }, (_, i) => i + 1);
  const frames = [];
  const res = [];
  for (let i = 0; i < n; i++) {
    const item = stream[i];
    if (i < K) {
      res.push(item);
      frames.push({
        i, item, reservoir: res.slice(), replacedSlot: -1, kept: true, prob: '1',
        note: `Item ${item} (#${i + 1}): the reservoir isn't full yet (need ${K}), so just drop it in at slot ${i}. The first ${K} items always go straight in.`,
      });
    } else {
      const j = Math.floor(rnd() * (i + 1)); // 0..i
      const accept = j < K;
      let replacedSlot = -1;
      if (accept) { replacedSlot = j; res[j] = item; }
      frames.push({
        i, item, reservoir: res.slice(), replacedSlot, kept: accept, j, prob: `${K}/${i + 1}`,
        note: accept
          ? `Item ${item} (#${i + 1}): roll j = ${j} in [0,${i}]. j < ${K}, so item ${item} is accepted with probability ${K}/${i + 1} and overwrites slot ${j}.`
          : `Item ${item} (#${i + 1}): roll j = ${j} in [0,${i}]. j ≥ ${K}, so item ${item} is rejected. Probability of acceptance was ${K}/${i + 1}.`,
      });
    }
  }
  frames.push({
    i: n - 1, item: -1, reservoir: res.slice(), replacedSlot: -1, kept: null, done: true,
    note: `Single pass, O(n) time, O(${K}) space — and the stream length n was never needed in advance. Every one of the ${n} items ended with an equal ${K}/${n} chance of being in the final sample.`,
  });
  return { frames, stream, n };
}

const DEFAULT_SEED = 3;

export default function ReservoirSamplingViz() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const { frames, stream, n } = useMemo(() => buildFrames(seed), [seed]);
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
  const H = 250;
  const padX = 40;
  const usable = W - padX * 2;
  const gap = 8;
  const sCellW = Math.min(64, (usable - gap * (n - 1)) / n);
  const sCellH = 44;
  const sRowY = 70;
  const sStartX = padX + (usable - (n * sCellW + (n - 1) * gap)) / 2;
  const sX = (i) => sStartX + i * (sCellW + gap);

  const rCellW = 84;
  const rGap = 16;
  const rRowY = 168;
  const rStartX = padX + (usable - (K * rCellW + (K - 1) * rGap)) / 2;
  const rX = (i) => rStartX + i * (rCellW + rGap);

  return (
    <div className="rsv">
      <div className="rsv-head">
        <h3 className="rsv-title">Reservoir sampling — fair sample from a stream</h3>
        <p className="rsv-sub">
          Pick {K} items uniformly at random from a stream of unknown length in one pass.
          Item i replaces a random reservoir slot with probability {K}/i — that&apos;s exactly what keeps every item equally likely.
        </p>
      </div>

      <div className="rsv-controls">
        <div className="rsv-buttons">
          <button type="button" className="rsv-btn rsv-btn-primary" onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="rsv-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="rsv-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="rsv-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button type="button" className="rsv-btn rsv-btn-shuffle" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>
        </div>
        <label className="rsv-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rsv-speed-range" />
          <span className="rsv-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="rsv-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="rsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rsv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={32} y={48} className="rsv-rowlabel">stream</text>
          {stream.map((v, i) => {
            const seen = i <= cur.i;
            const isCur = i === cur.i && !cur.done;
            return (
              <g key={`s-${i}`} opacity={seen ? 1 : 0.28}>
                <rect x={sX(i)} y={sRowY} width={sCellW} height={sCellH} rx={6}
                  fill={isCur ? 'var(--accent)' : 'var(--bg)'} stroke={isCur ? 'var(--accent)' : 'var(--border)'} strokeWidth={isCur ? 2.4 : 1.2} />
                <text x={sX(i) + sCellW / 2} y={sRowY + sCellH / 2 + 5} className="rsv-cell-val"
                  style={{ fill: isCur ? 'var(--bg)' : 'var(--text-main)' }}>{v}</text>
              </g>
            );
          })}

          {/* flow line from current stream item to reservoir */}
          {!cur.done && cur.kept && cur.replacedSlot >= 0 && (
            <path d={`M ${sX(cur.i) + sCellW / 2} ${sRowY + sCellH} L ${rX(cur.replacedSlot) + rCellW / 2} ${rRowY}`}
              stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" fill="none" />
          )}

          <text x={32} y={rRowY - 14} className="rsv-rowlabel">reservoir (k = {K})</text>
          {Array.from({ length: K }).map((_, slot) => {
            const v = cur.reservoir[slot];
            const justReplaced = slot === cur.replacedSlot;
            return (
              <g key={`r-${slot}`}>
                <rect x={rX(slot)} y={rRowY} width={rCellW} height={56} rx={9}
                  fill={justReplaced ? 'rgba(var(--accent-rgb), 0.3)' : 'var(--bg)'}
                  stroke={justReplaced ? 'var(--accent)' : 'var(--border)'} strokeWidth={justReplaced ? 2.6 : 1.4} />
                <text x={rX(slot) + rCellW / 2} y={rRowY + 34} className="rsv-res-val">{v != null ? v : ''}</text>
                <text x={rX(slot) + rCellW / 2} y={rRowY + 72} className="rsv-slot">slot {slot}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rsv-readouts">
        <div className="rsv-metric"><span className="rsv-metric-label">item</span><span className="rsv-metric-val">{cur.done ? '—' : cur.item}</span></div>
        <div className="rsv-metric"><span className="rsv-metric-label">P(accept)</span><span className="rsv-metric-val">{cur.done ? '—' : cur.prob}</span></div>
        <div className="rsv-metric"><span className="rsv-metric-label">outcome</span><span className="rsv-metric-val">{cur.done ? 'final' : cur.kept ? 'accepted' : 'rejected'}</span></div>
        <div className="rsv-metric"><span className="rsv-metric-label">reservoir</span><span className="rsv-metric-val">[{cur.reservoir.join(', ')}]</span></div>
      </div>

      <div className="rsv-trace">
        <span className="rsv-trace-label">trace</span>
        <span className="rsv-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
