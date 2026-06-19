import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

/*
 * Autoregressive generation, one token at a time.
 * A 6-token vocabulary. At each step the model has emitted a prefix; a small
 * deterministic "model" produces logits for the next token as a function of the
 * last emitted token (a fixed transition table). We apply temperature, softmax,
 * show the probability bar over the vocab, and greedily emit the argmax (with a
 * deterministic tie-break). A causal mask grid shows that step t attends only to
 * positions <= t. No Math.random — fully reproducible.
 */

const W = 600;
const H = 360;

const VOCAB = ['<s>', 'the', 'cat', 'sat', 'on', 'mat'];
const V = VOCAB.length;
const MAX_LEN = 9;

const COLOR_ACTIVE = 'var(--accent)';
const COLOR_PAST = 'var(--hue-sky)';
const COLOR_MASK = 'var(--hue-pink)';

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fixed transition logits: row = previous token, col = next token.
// Built once from a deterministic seed so it's reproducible and reads "language-like".
const TRANSITION = (() => {
  const rand = mulberry32(7);
  const m = [];
  for (let i = 0; i < V; i++) {
    const row = [];
    for (let j = 0; j < V; j++) row.push(0.2 + rand() * 0.6);
    m.push(row);
  }
  // bias a plausible chain: <s>->the->cat->sat->on->mat->the ...
  const chain = [1, 2, 3, 4, 5, 1];
  for (let i = 0; i < V; i++) m[i][chain[i]] += 2.4;
  // never re-emit <s>
  for (let i = 0; i < V; i++) m[i][0] -= 5;
  return m;
})();

function softmaxTemp(logits, temp) {
  const t = Math.max(0.05, temp);
  const scaled = logits.map((l) => l / t);
  const mx = Math.max(...scaled);
  const ex = scaled.map((x) => Math.exp(x - mx));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

function nextDistribution(prevIdx, temp) {
  const logits = TRANSITION[prevIdx];
  return { logits, probs: softmaxTemp(logits, temp) };
}

export default function AutoregressiveViz() {
  const [temp, setTemp] = useState(0.8);
  const [seq, setSeq] = useState([0]); // start with <s>
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const timerRef = useRef(null);
  const seqRef = useRef([0]);
  const tempRef = useRef(temp);
  useEffect(() => { tempRef.current = temp; }, [temp]);

  const prevIdx = seq[seq.length - 1];
  const { probs } = useMemo(() => nextDistribution(prevIdx, temp), [prevIdx, temp]);

  // deterministic greedy pick (argmax, first-index tie-break)
  const pickIdx = useMemo(() => {
    let best = 0;
    for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
    return best;
  }, [probs]);

  const done = seq.length >= MAX_LEN;

  const emit = useCallback(() => {
    setSeq((prev) => {
      if (prev.length >= MAX_LEN) return prev;
      const last = prev[prev.length - 1];
      const { probs: p } = nextDistribution(last, tempRef.current);
      let best = 0;
      for (let i = 1; i < p.length; i++) if (p[i] > p[best]) best = i;
      const next = [...prev, best];
      seqRef.current = next;
      return next;
    });
  }, []);

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  const handlePlay = useCallback(() => {
    if (runningRef.current) {
      runningRef.current = false; setRunning(false); clearTimer(); return;
    }
    runningRef.current = true; setRunning(true);
    const tick = () => {
      if (!runningRef.current) return;
      if (seqRef.current.length >= MAX_LEN) { runningRef.current = false; setRunning(false); clearTimer(); return; }
      emit();
      timerRef.current = setTimeout(tick, 650);
    };
    timerRef.current = setTimeout(tick, 200);
  }, [emit]);

  const reset = useCallback(() => {
    runningRef.current = false; setRunning(false); clearTimer();
    seqRef.current = [0];
    setSeq([0]);
  }, []);

  // --- layout ---
  const cellW = 52;
  const cellH = 34;
  const seqY = 36;
  const seqX0 = 24;

  // causal mask grid
  const maskN = Math.min(seq.length + (done ? 0 : 1), MAX_LEN);
  const gx0 = 24;
  const gy0 = 150;
  const gcell = 18;

  // probability bars
  const barX0 = gx0 + maskN * gcell + 56;
  const barTop = 150;
  const barRowH = 28;
  const barMaxW = W - barX0 - 60;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" style={{ maxWidth: '820px' }}>
          <text x={seqX0} y={20} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            GENERATED SEQUENCE (left to right)
          </text>

          {/* emitted tokens */}
          {seq.map((idx, t) => {
            const x = seqX0 + t * (cellW + 6);
            const isLast = t === seq.length - 1;
            return (
              <g key={`tok${t}`}>
                <rect x={x} y={seqY} width={cellW} height={cellH} rx="6"
                  fill={isLast ? COLOR_ACTIVE : COLOR_PAST} opacity={isLast ? 0.85 : 0.4}
                  stroke={isLast ? COLOR_ACTIVE : 'var(--border)'} strokeWidth="1" />
                <text x={x + cellW / 2} y={seqY + cellH / 2 + 4} fontSize="11" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="middle" fontWeight={isLast ? 700 : 400}>
                  {VOCAB[idx]}
                </text>
                <text x={x + cellW / 2} y={seqY + cellH + 12} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">t={t}</text>
              </g>
            );
          })}
          {/* next-slot placeholder */}
          {!done && (
            <g>
              <rect x={seqX0 + seq.length * (cellW + 6)} y={seqY} width={cellW} height={cellH} rx="6"
                fill="none" stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
              <text x={seqX0 + seq.length * (cellW + 6) + cellW / 2} y={seqY + cellH / 2 + 4} fontSize="14" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">?</text>
            </g>
          )}

          {/* causal mask */}
          <text x={gx0} y={gy0 - 8} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.08em">CAUSAL MASK (row attends to col)</text>
          {Array.from({ length: maskN }).map((_, r) =>
            Array.from({ length: maskN }).map((__, c) => {
              const allowed = c <= r;
              return (
                <rect key={`m${r}-${c}`} x={gx0 + c * gcell} y={gy0 + r * gcell} width={gcell - 1.5} height={gcell - 1.5} rx="2"
                  fill={allowed ? COLOR_PAST : COLOR_MASK} opacity={allowed ? 0.5 : 0.12}
                  stroke={allowed ? 'none' : COLOR_MASK} strokeWidth="0.5" strokeDasharray={allowed ? '' : '1.5 1.5'} />
              );
            }),
          )}
          {Array.from({ length: maskN }).map((_, i) => (
            <text key={`mc${i}`} x={gx0 + i * gcell + gcell / 2 - 0.75} y={gy0 + maskN * gcell + 9} fontSize="6.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">{i}</text>
          ))}

          {/* next-token probability bars */}
          <text x={barX0} y={barTop - 8} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.08em">
            P(next | prefix) · τ = {snap(temp, 2)}
          </text>
          {probs.map((p, i) => {
            const y = barTop + i * barRowH;
            const isPick = i === pickIdx;
            return (
              <g key={`bar${i}`}>
                <text x={barX0 - 6} y={y + barRowH / 2 + 1} fontSize="9" fill={isPick ? COLOR_ACTIVE : 'var(--text-dim)'} fontFamily="var(--mono)" textAnchor="end" fontWeight={isPick ? 700 : 400}>{VOCAB[i]}</text>
                <rect x={barX0} y={y + 3} width={barMaxW} height={barRowH - 12} rx="3" fill="var(--border)" opacity="0.25" />
                <rect x={barX0} y={y + 3} width={Math.max(1, p * barMaxW)} height={barRowH - 12} rx="3" fill={isPick ? COLOR_ACTIVE : 'var(--hue-violet)'} opacity={isPick ? 0.9 : 0.55} />
                <text x={barX0 + Math.max(1, p * barMaxW) + 5} y={y + barRowH / 2 + 1} fontSize="8" fill="var(--text-main)" fontFamily="var(--mono)">{snap(p, 2)}</text>
              </g>
            );
          })}
          {!done && (
            <text x={barX0} y={barTop + V * barRowH + 4} fontSize="7.5" fill={COLOR_ACTIVE} fontFamily="var(--mono)">greedy pick → {VOCAB[pickIdx]}</text>
          )}
          {done && (
            <text x={barX0} y={barTop + 12} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">sequence complete</text>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">temperature τ</span>
          <input type="range" min="0.1" max="2" step="0.05" value={temp} onChange={(e) => setTemp(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(temp, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">prefix</span>
            <span className="mlviz-val">{seq.map((i) => VOCAB[i]).join(' ')}</span>
            <span className="mlviz-sub">length {seq.length} / {MAX_LEN}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">argmax</span>
            <span className="mlviz-val">{VOCAB[pickIdx]} @ p = {snap(probs[pickIdx], 3)}</span>
            <span className="mlviz-sub">low τ sharpens this peak; high τ flattens it</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">cond.</span>
            <span className="mlviz-val">P(x_t | x_&lt;t) factorises the joint by the chain rule</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={emit} disabled={running || done}>
            <StepForward size={13} />
            <span>Emit token</span>
          </button>
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={handlePlay} disabled={done && !running}>
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Generate'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          each step conditions only on already-emitted tokens (the causal mask blocks the future) · the model scores every vocab item, softmax with temperature τ turns scores into P(next) · we emit greedily and feed the result back in
        </div>
      </div>
    </div>
  );
}
