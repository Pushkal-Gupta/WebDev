import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Scissors, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import './NumCancellationViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// Round v to p significant decimal digits, return { value, digits (string of p sig digits), exp }.
function roundSig(v, p) {
  if (v === 0) return { value: 0, digits: '0'.repeat(p), exp: 0 };
  const exp = Math.floor(Math.log10(Math.abs(v)));
  const scale = Math.pow(10, p - 1 - exp);
  const scaled = Math.round(Math.abs(v) * scale);
  const value = Math.sign(v) * scaled / scale;
  let digits = String(scaled);
  if (digits.length > p) digits = digits.slice(0, p);        // carry overflow (e.g. 9.999 -> 10.00)
  digits = digits.padStart(p, '0').slice(0, p);
  return { value, digits, exp };
}

// Count leading significant digits shared by two rounded operands (the digits that cancel).
function sharedLeading(da, db) {
  let k = 0;
  for (let i = 0; i < da.length && i < db.length; i++) {
    if (da[i] === db[i]) k++;
    else break;
  }
  return k;
}

const STEPS = [
  { key: 'round',  title: 'Round both operands', icon: 'round' },
  { key: 'cancel', title: 'Subtract — leading digits cancel', icon: 'cancel' },
  { key: 'stable', title: 'Stable reformulation keeps every digit', icon: 'stable' },
];

const DEFAULT = { logx: 10, p: 7 };

export default function NumCancellationViz() {
  const [logx, setLogx] = useState(DEFAULT.logx);
  const [p, setP] = useState(DEFAULT.p);
  const [step, setStep] = useState(0);

  const reset = () => { setLogx(DEFAULT.logx); setP(DEFAULT.p); setStep(0); };

  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const d = useMemo(() => {
    const x = Math.pow(10, logx);
    const aTrue = Math.sqrt(x + 1);
    const bTrue = Math.sqrt(x);
    const ra = roundSig(aTrue, p);
    const rb = roundSig(bTrue, p);

    const naive = ra.value - rb.value;                 // difference of rounded operands
    const stable = 1 / (ra.value + rb.value);          // conjugate form, no subtraction
    const exact = 1 / (aTrue + bTrue);                 // full-precision reference

    const relNaive = exact !== 0 ? Math.abs(naive - exact) / Math.abs(exact) : 0;
    const relStable = exact !== 0 ? Math.abs(stable - exact) / Math.abs(exact) : 0;

    const shared = sharedLeading(ra.digits, rb.digits);
    const lost = shared;                               // shared leading digits are wiped by subtraction
    const kept = Math.max(0, p - shared);

    return { x, aTrue, bTrue, ra, rb, naive, stable, exact, relNaive, relStable, shared, lost, kept };
  }, [logx, p]);

  // Digit strip geometry
  const CELL = 34;
  const GAP = 6;
  const stripW = p * CELL + (p - 1) * GAP;
  const LABEL_W = 128;
  const W = LABEL_W + stripW + 40;
  const ROW_H = 46;
  const rows = step >= 2 ? 3 : 2;
  const H = 34 + rows * (ROW_H + 10) + 10;

  const cellX = (i) => LABEL_W + i * (CELL + GAP);

  const showResult = step >= 1;

  const relTex = (r) => {
    if (r === 0) return '0';
    const exp = Math.floor(Math.log10(r));
    const mant = r / Math.pow(10, exp);
    return `${mant.toFixed(1)}\\times10^{${exp}}`;
  };

  const renderStrip = (label, digits, exp, kind) => {
    // kind: 'a' | 'b' | 'result'
    return (
      <g>
        <text x={LABEL_W - 12} y={0} className="numcanc-strip-label" textAnchor="end">{label}</text>
        {digits.split('').map((ch, i) => {
          const isShared = i < d.shared;
          const cls = kind === 'result'
            ? (i < d.lost ? 'numcanc-cell numcanc-cell-void' : 'numcanc-cell numcanc-cell-kept')
            : (isShared ? 'numcanc-cell numcanc-cell-cancel' : 'numcanc-cell numcanc-cell-live');
          const digitShown = kind === 'result' && i < d.lost ? '0' : ch;
          return (
            <g key={i} transform={`translate(${cellX(i)}, -${ROW_H - 6})`}>
              <rect width={CELL} height={ROW_H - 8} rx="6"
                className={reduced ? cls : `${cls} numcanc-anim`} />
              <text x={CELL / 2} y={(ROW_H - 8) / 2} className="numcanc-digit"
                textAnchor="middle" dominantBaseline="central">{digitShown}</text>
              {i === 0 && (
                <text x={CELL / 2} y={ROW_H + 4} className="numcanc-place" textAnchor="middle">
                  10^{exp}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  const stepIcon = (k) => {
    if (k === 'round') return <ChevronRight size={14} />;
    if (k === 'cancel') return <Scissors size={14} />;
    return <ShieldCheck size={14} />;
  };

  return (
    <div className="numcanc">
      <div className="numcanc-head">
        <div className="numcanc-head-icon"><Scissors size={18} /></div>
        <div className="numcanc-head-text">
          <h3 className="numcanc-title">Catastrophic cancellation, digit by digit</h3>
          <p className="numcanc-sub">
            Subtracting two nearly-equal numbers held to{' '}
            <b>{p} significant digits</b> makes their leading digits cancel — the round-off in the
            trailing digits is promoted to the front, so the relative error explodes. The
            conjugate form{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\tfrac{1}{\\sqrt{x+1}+\\sqrt{x}}') }} />{' '}
            avoids the subtraction entirely.
          </p>
        </div>
        <button type="button" className="numcanc-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="numcanc-controls">
        <label className="numcanc-slider">
          <span className="numcanc-slider-key" dangerouslySetInnerHTML={{ __html: km('x=10^{k}') }} />
          <input type="range" min={2} max={14} step={1} value={logx}
            onChange={(e) => setLogx(parseInt(e.target.value, 10))} />
          <span className="numcanc-slider-val">k = {logx}</span>
        </label>
        <label className="numcanc-slider">
          <span className="numcanc-slider-key">sig. digits p</span>
          <input type="range" min={3} max={10} step={1} value={p}
            onChange={(e) => setP(parseInt(e.target.value, 10))} />
          <span className="numcanc-slider-val">p = {p}</span>
        </label>
      </div>

      <div className="numcanc-steps">
        {STEPS.map((s, i) => (
          <button key={s.key} type="button"
            className={`numcanc-step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}
            onClick={() => setStep(i)}>
            <span className="numcanc-step-ic">{stepIcon(s.icon)}</span>
            <span className="numcanc-step-txt">{i + 1}. {s.title}</span>
          </button>
        ))}
      </div>

      <div className="numcanc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="numcanc-svg" preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(0, ${34 + ROW_H})`}>
            {renderStrip('√(x+1) ≈', d.ra.digits, d.ra.exp, 'a')}
          </g>
          <g transform={`translate(0, ${34 + 2 * ROW_H + 10})`}>
            {renderStrip('√x ≈', d.rb.digits, d.rb.exp, 'b')}
          </g>
          {step >= 2 && (
            <g transform={`translate(0, ${34 + 3 * ROW_H + 20})`}>
              {renderStrip('naive a−b =', d.ra.digits, d.ra.exp, 'result')}
            </g>
          )}
          {showResult && d.shared > 0 && (
            <g>
              <rect x={cellX(0) - 3} y={30} width={d.shared * (CELL + GAP) - GAP + 6}
                height={2 * ROW_H + 12} rx="8" className="numcanc-cancel-box" />
              <text x={cellX(0) + (d.shared * (CELL + GAP) - GAP) / 2} y={24}
                className="numcanc-cancel-tag" textAnchor="middle">
                {d.shared} leading digits identical → cancel to 0
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="numcanc-stats">
        <div className="numcanc-statcard numcanc-hero">
          <span className="numcanc-stat-label"><AlertTriangle size={12} /> significant digits lost</span>
          <span className="numcanc-stat-val">{d.lost} of {p}</span>
          <span className="numcanc-stat-sub">only {d.kept} trustworthy digit{d.kept === 1 ? '' : 's'} survive the subtraction</span>
        </div>
        <div className="numcanc-statcard numcanc-bad">
          <span className="numcanc-stat-label">relative error — naive</span>
          <span className="numcanc-stat-val"
            dangerouslySetInnerHTML={{ __html: km(relTex(d.relNaive)) }} />
          <span className="numcanc-stat-sub numcanc-mono">a − b, difference of rounded roots</span>
        </div>
        <div className="numcanc-statcard numcanc-good">
          <span className="numcanc-stat-label">relative error — stable</span>
          <span className="numcanc-stat-val"
            dangerouslySetInnerHTML={{ __html: km(relTex(d.relStable)) }} />
          <span className="numcanc-stat-sub numcanc-mono">1 / (√(x+1) + √x)</span>
        </div>
      </div>

      <div className="numcanc-formula">
        <span className="numcanc-formula-label">
          {step < 2 ? <><Scissors size={12} /> the unstable form</> : <><ShieldCheck size={12} /> the stable rewrite</>}
        </span>
        <span className="numcanc-formula-math"
          dangerouslySetInnerHTML={{ __html: km(
            step < 2
              ? '\\sqrt{x+1}-\\sqrt{x}\\;=\\;\\underbrace{1.41421356\\ldots-1.41414284\\ldots}_{\\text{leading digits cancel}}'
              : '\\sqrt{x+1}-\\sqrt{x}\\;=\\;\\frac{(x+1)-x}{\\sqrt{x+1}+\\sqrt{x}}\\;=\\;\\frac{1}{\\sqrt{x+1}+\\sqrt{x}}',
            true) }} />
      </div>

      <div className="numcanc-trace">
        <span className="numcanc-trace-label">reading</span>
        <span className="numcanc-trace-body">
          {step === 0 && `Both roots agree to their first ${d.shared} significant digits when x = 10^${logx}. Held to ${p} digits, √(x+1) and √x look almost identical — highlighted in violet below. Advance to subtract them.`}
          {step === 1 && `The ${d.shared} matching leading digits cancel to zero. What's left is built from the last ${d.kept} digit${d.kept === 1 ? '' : 's'} of each operand — digits already corrupted by rounding — so the naive difference carries a relative error of about ${d.relNaive === 0 ? '0' : d.relNaive.toExponential(1)}, roughly ${d.lost} lost digits.`}
          {step === 2 && `Computing 1 / (√(x+1) + √x) never subtracts close numbers: the denominator is a sum of positives and the numerator is exactly 1. All ${p} digits stay trustworthy — relative error ~${d.relStable === 0 ? '0' : d.relStable.toExponential(1)}, at the rounding floor. Same math, ${d.lost === 0 ? 'far' : d.lost}× better answer.`}
        </span>
      </div>
    </div>
  );
}
