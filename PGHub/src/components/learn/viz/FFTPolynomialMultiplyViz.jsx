import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './FFTPolynomialMultiplyViz.css';

const A_COEFFS = [1, 2, 3, 4];
const B_COEFFS = [5, 6, 7, 8];
const SIZE = 8; // next power of 2 ≥ deg(A) + deg(B) + 1 = 7

// Complex arithmetic on {re, im} objects.
const C = (re = 0, im = 0) => ({ re, im });
const cAdd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
const cSub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });
const cMul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });

function fmtCx(z, prec = 2) {
  const re = Math.abs(z.re) < 1e-9 ? 0 : z.re;
  const im = Math.abs(z.im) < 1e-9 ? 0 : z.im;
  if (im === 0) return `${re.toFixed(prec)}`;
  if (re === 0) return `${im.toFixed(prec)}i`;
  return `${re.toFixed(prec)}${im >= 0 ? '+' : ''}${im.toFixed(prec)}i`;
}

// Iterative Cooley-Tukey FFT. Inverse pass divides by n at the end.
function fft(a, invert = false) {
  const n = a.length;
  const arr = a.map((z) => ({ re: z.re, im: z.im }));
  // bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (2 * Math.PI) / len * (invert ? -1 : 1);
    const wn = { re: Math.cos(ang), im: Math.sin(ang) };
    for (let i = 0; i < n; i += len) {
      let w = { re: 1, im: 0 };
      for (let k = 0; k < len / 2; k++) {
        const u = arr[i + k];
        const v = cMul(arr[i + k + len / 2], w);
        arr[i + k] = cAdd(u, v);
        arr[i + k + len / 2] = cSub(u, v);
        w = cMul(w, wn);
      }
    }
  }
  if (invert) for (let i = 0; i < n; i++) { arr[i].re /= n; arr[i].im /= n; }
  return arr;
}

function buildFrames() {
  const Acx = A_COEFFS.map((v) => C(v, 0)).concat(Array.from({ length: SIZE - A_COEFFS.length }, () => C(0, 0)));
  const Bcx = B_COEFFS.map((v) => C(v, 0)).concat(Array.from({ length: SIZE - B_COEFFS.length }, () => C(0, 0)));
  const Afft = fft(Acx, false);
  const Bfft = fft(Bcx, false);
  const Pfft = Afft.map((z, i) => cMul(z, Bfft[i]));
  const P = fft(Pfft, true);
  const result = P.map((z) => Math.round(z.re));

  const frames = [];
  frames.push({
    phase: 'pad',
    A: Acx, B: Bcx,
    Afft: null, Bfft: null, Pfft: null, P: null,
    result: null,
    activeIdx: -1,
    note: `Polynomials A and B have degree 3. Their product has degree ≤ 6 → we need ≥ 7 sample points. Round up to n = 8 (next power of 2) and zero-pad both coefficient vectors.`,
  });
  frames.push({
    phase: 'fft-A',
    A: Acx, B: Bcx,
    Afft, Bfft: null, Pfft: null, P: null,
    result: null,
    activeIdx: -1,
    note: `FFT(A): evaluate A at the eight 8th roots of unity ω₈ᵏ. The butterfly diagram pairs (k, k + n/2) and combines them with a twiddle factor per stage. O(n log n) total.`,
  });
  frames.push({
    phase: 'fft-B',
    A: Acx, B: Bcx,
    Afft, Bfft, Pfft: null, P: null,
    result: null,
    activeIdx: -1,
    note: `FFT(B): same butterfly on B. Now both polynomials are in their point-value representation at the same 8 evaluation points.`,
  });

  // Pointwise multiplication, one index at a time.
  const partial = Array.from({ length: SIZE }, () => C(0, 0));
  for (let i = 0; i < SIZE; i++) {
    partial[i] = cMul(Afft[i], Bfft[i]);
    frames.push({
      phase: 'pointwise',
      A: Acx, B: Bcx,
      Afft, Bfft, Pfft: partial.map((z) => ({ re: z.re, im: z.im })), P: null,
      result: null,
      activeIdx: i,
      note: `Pointwise: C[${i}] = A[${i}] · B[${i}] = (${fmtCx(Afft[i])}) · (${fmtCx(Bfft[i])}) = ${fmtCx(partial[i])}.`,
    });
  }
  frames.push({
    phase: 'inverse',
    A: Acx, B: Bcx,
    Afft, Bfft, Pfft, P,
    result: null,
    activeIdx: -1,
    note: `Inverse FFT on C: same butterfly with conjugate roots, then divide by n. This brings us back to coefficient form (real values + tiny rounding error).`,
  });
  frames.push({
    phase: 'round',
    A: Acx, B: Bcx,
    Afft, Bfft, Pfft, P,
    result,
    activeIdx: -1,
    note: `Round each real part to the nearest integer. Final product polynomial coefficients: [${result.join(', ')}].`,
  });

  return { frames, result, Afft, Bfft, Pfft, P };
}

function polyToString(coeffs) {
  const terms = [];
  for (let i = 0; i < coeffs.length; i++) {
    const c = coeffs[i];
    if (c === 0) continue;
    let s = '';
    if (terms.length === 0) s = `${c}`;
    else s = c > 0 ? ` + ${c}` : ` − ${Math.abs(c)}`;
    if (i === 0) s += '';
    else if (i === 1) s += 'x';
    else s += `x^${i}`;
    terms.push(s);
  }
  return terms.length ? terms.join('') : '0';
}

// Butterfly stage layout: 8 inputs on left, 8 outputs on right, 3 internal columns.
// For visualization we draw the static structure (3 log2(8) stages) and highlight current phase.
function ButterflyDiagram({ phase }) {
  const n = SIZE;
  const stages = 3; // log2(8)
  const W = 720;
  const H = 240;
  const padX = 60;
  const padY = 30;
  const colW = (W - padX * 2) / stages;
  const rowH = (H - padY * 2) / (n - 1);

  // x positions for nodes per column (0..stages)
  const xs = Array.from({ length: stages + 1 }, (_, c) => padX + c * colW);
  const ys = Array.from({ length: n }, (_, r) => padY + r * rowH);

  // bit reversal mapping for first column ordering
  const bitRev = (x, bits) => {
    let r = 0;
    for (let i = 0; i < bits; i++) if (x & (1 << i)) r |= 1 << (bits - 1 - i);
    return r;
  };
  const initialOrder = Array.from({ length: n }, (_, i) => bitRev(i, stages));

  const active = phase === 'fft-A' || phase === 'fft-B' || phase === 'inverse';
  const accent = phase === 'inverse' ? 'var(--hue-pink)' : 'var(--accent)';

  // Build edges: at stage s (0-indexed, going to col s+1), butterflies of size 2^(s+1).
  const edges = [];
  for (let s = 0; s < stages; s++) {
    const len = 1 << (s + 1);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < half; k++) {
        const top = i + k;
        const bot = i + k + half;
        // straight + crossing lines
        edges.push({ from: [s, top], to: [s + 1, top] });
        edges.push({ from: [s, bot], to: [s + 1, top] });
        edges.push({ from: [s, top], to: [s + 1, bot] });
        edges.push({ from: [s, bot], to: [s + 1, bot] });
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fftv-svg" preserveAspectRatio="xMidYMid meet">
      <text x={padX} y={14} className="fftv-butterfly-stage-label" textAnchor="start">input (bit-reversed)</text>
      <text x={W - padX} y={14} className="fftv-butterfly-stage-label" textAnchor="end">output (k = 0..7)</text>

      {edges.map((e, i) => (
        <line
          key={`be-${i}`}
          x1={xs[e.from[0]]}
          y1={ys[e.from[1]]}
          x2={xs[e.to[0]]}
          y2={ys[e.to[1]]}
          stroke={active ? accent : 'var(--border)'}
          strokeWidth={active ? 1.4 : 0.9}
          opacity={active ? 0.85 : 0.55}
          className="fftv-butterfly-edge"
        />
      ))}

      {/* Stage column labels */}
      {Array.from({ length: stages }, (_, s) => (
        <text key={`sl-${s}`} x={(xs[s] + xs[s + 1]) / 2} y={H - 4} className="fftv-butterfly-stage-label">
          stage {s + 1} (size {1 << (s + 1)})
        </text>
      ))}

      {/* Nodes */}
      {Array.from({ length: stages + 1 }, (_, c) =>
        Array.from({ length: n }, (_, r) => (
          <g key={`bn-${c}-${r}`}>
            <circle
              cx={xs[c]}
              cy={ys[r]}
              r={9}
              fill="var(--surface)"
              stroke={active ? accent : 'var(--border)'}
              strokeWidth={1.5}
            />
            {c === 0 && (
              <text x={xs[c] - 14} y={ys[r]} className="fftv-butterfly-node" textAnchor="end">
                a[{initialOrder[r]}]
              </text>
            )}
            {c === stages && (
              <text x={xs[c] + 14} y={ys[r]} className="fftv-butterfly-node" textAnchor="start">
                ŷ[{r}]
              </text>
            )}
          </g>
        ))
      )}
    </svg>
  );
}

export default function FFTPolynomialMultiplyViz() {
  const built = useMemo(() => buildFrames(), []);
  const frames = built.frames;
  const totalSteps = frames.length;

  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

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

  const showFftA = !!current.Afft;
  const showFftB = !!current.Bfft;
  const showPfft = !!current.Pfft;
  const showP = !!current.P;
  const showResult = !!current.result;

  return (
    <div className="fftv">
      <div className="fftv-head">
        <h3 className="fftv-title">FFT polynomial multiplication</h3>
        <p className="fftv-sub">
          Multiply A(x) = 1 + 2x + 3x² + 4x³ by B(x) = 5 + 6x + 7x² + 8x³ in O(n log n): pad to n = 8, FFT each, multiply pointwise, inverse FFT, round.
        </p>
      </div>

      <div className="fftv-controls">
        <span className="fftv-phase-pill">{current.phase}</span>

        <div className="fftv-actions">
          <div className="fftv-buttons">
            <button type="button" className="fftv-btn fftv-btn-primary" onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}>
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="fftv-btn" onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
              <ChevronRight size={14} /> Step
            </button>
            <button type="button" className="fftv-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="fftv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="fftv-speed">
            <span className="fftv-speed-label">speed</span>
            <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="fftv-speed-range" />
            <span className="fftv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="fftv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="fftv-stage">
        <ButterflyDiagram phase={current.phase} />
      </div>

      <div className="fftv-arrays">
        <div className="fftv-array-card">
          <span className="fftv-array-title">A — padded coefficients</span>
          <div className="fftv-array-row">
            {current.A.map((z, i) => (
              <div key={`A-${i}`} className="fftv-cx">
                <span>{fmtCx(z, 0)}</span>
                <span className="fftv-cx-idx">a[{i}]</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fftv-array-card">
          <span className="fftv-array-title">B — padded coefficients</span>
          <div className="fftv-array-row">
            {current.B.map((z, i) => (
              <div key={`B-${i}`} className="fftv-cx">
                <span>{fmtCx(z, 0)}</span>
                <span className="fftv-cx-idx">b[{i}]</span>
              </div>
            ))}
          </div>
        </div>

        {showFftA && (
          <div className="fftv-array-card">
            <span className="fftv-array-title">FFT(A) — point-value at ω₈ᵏ</span>
            <div className="fftv-array-row">
              {current.Afft.map((z, i) => (
                <div key={`Af-${i}`} className={`fftv-cx ${current.phase === 'pointwise' && current.activeIdx === i ? 'fftv-cx-active' : ''}`}>
                  <span>{fmtCx(z, 1)}</span>
                  <span className="fftv-cx-idx">k={i}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showFftB && (
          <div className="fftv-array-card">
            <span className="fftv-array-title">FFT(B) — point-value at ω₈ᵏ</span>
            <div className="fftv-array-row">
              {current.Bfft.map((z, i) => (
                <div key={`Bf-${i}`} className={`fftv-cx ${current.phase === 'pointwise' && current.activeIdx === i ? 'fftv-cx-active' : ''}`}>
                  <span>{fmtCx(z, 1)}</span>
                  <span className="fftv-cx-idx">k={i}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPfft && (
          <div className="fftv-array-card">
            <span className="fftv-array-title">C = FFT(A) · FFT(B) — pointwise</span>
            <div className="fftv-array-row">
              {current.Pfft.map((z, i) => {
                const filled = !(z.re === 0 && z.im === 0) || current.phase !== 'pointwise' || i <= current.activeIdx;
                return (
                  <div key={`Cf-${i}`} className={`fftv-cx ${current.phase === 'pointwise' && current.activeIdx === i ? 'fftv-cx-active' : ''}`}>
                    <span>{filled ? fmtCx(z, 1) : '—'}</span>
                    <span className="fftv-cx-idx">k={i}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showP && (
          <div className="fftv-array-card">
            <span className="fftv-array-title">IFFT(C) — back to coefficients (real ≈ integer)</span>
            <div className="fftv-array-row">
              {current.P.map((z, i) => (
                <div key={`P-${i}`} className="fftv-cx fftv-cx-result">
                  <span>{z.re.toFixed(2)}</span>
                  <span className="fftv-cx-idx">x^{i}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showResult && (
          <div className="fftv-array-card">
            <span className="fftv-array-title">result coefficients (rounded)</span>
            <div className="fftv-array-row">
              {current.result.map((c, i) => (
                <div key={`R-${i}`} className="fftv-cx fftv-cx-result">
                  <span>{c}</span>
                  <span className="fftv-cx-idx">x^{i}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fftv-polys">
        <div className="fftv-poly-card">
          <span className="fftv-poly-label">A(x)</span>
          <span className="fftv-poly-value">{polyToString(A_COEFFS)}</span>
        </div>
        <div className="fftv-poly-card">
          <span className="fftv-poly-label">B(x)</span>
          <span className="fftv-poly-value">{polyToString(B_COEFFS)}</span>
        </div>
        <div className="fftv-poly-card fftv-poly-card-result">
          <span className="fftv-poly-label">A(x) · B(x)</span>
          <span className="fftv-poly-value">{showResult ? polyToString(current.result) : '— computing —'}</span>
        </div>
      </div>

      <div className="fftv-arith">
        <span className="fftv-arith-label">trace</span>
        <span className="fftv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
