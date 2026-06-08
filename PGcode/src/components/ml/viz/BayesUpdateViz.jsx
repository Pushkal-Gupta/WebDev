import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { RotateCcw, Dice5 } from 'lucide-react';
import './MLViz.css';

const W = 420;
const H = 300;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 32;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const CURVE_N = 240;
const Y_HEADROOM = 1.18;
const TWEEN_MS = 420;
const SWEEP_FLIP_MS = 160;
const SWEEP_N = 20;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function thetaToPx(t) {
  return PAD_L + t * PLOT_W;
}

function yToPx(y, yMax) {
  const cap = Math.max(yMax, 1e-9);
  return PAD_T + (1 - y / cap) * PLOT_H;
}

// log Beta(a, b) = lgamma(a) + lgamma(b) - lgamma(a+b)
// Lanczos approximation for log-gamma.
function lgamma(z) {
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    // reflection
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  }
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function logBeta(a, b) {
  return lgamma(a) + lgamma(b) - lgamma(a + b);
}

// Beta PDF on (0,1). Handles edge α=1 or β=1 cleanly (no log(0) explosions for θ in interior).
function betaPdf(theta, a, b) {
  if (theta <= 0) return a > 1 ? 0 : a === 1 ? (b === 1 ? 1 : 0) : Infinity;
  if (theta >= 1) return b > 1 ? 0 : b === 1 ? (a === 1 ? 1 : 0) : Infinity;
  const lp =
    (a - 1) * Math.log(theta) +
    (b - 1) * Math.log(1 - theta) -
    logBeta(a, b);
  return Math.exp(lp);
}

// Numeric peak of Beta on [0,1]: closed form for a,b > 1 is (a-1)/(a+b-2).
function betaMode(a, b) {
  if (a > 1 && b > 1) return (a - 1) / (a + b - 2);
  if (a <= 1 && b > 1) return 0;
  if (a > 1 && b <= 1) return 1;
  // both <= 1 (e.g. 1,1 uniform) — pick midpoint
  return 0.5;
}

// Robust upper bound on Beta PDF over [0,1] via scanning (handles uniform and skewed).
function peakDensity(a, b) {
  // Avoid evaluating exactly at 0 or 1 to skip singular points (a<1 or b<1).
  const samples = 51;
  let m = 0;
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    const v = betaPdf(t, a, b);
    if (Number.isFinite(v) && v > m) m = v;
  }
  // Also test mode if interior
  const mode = betaMode(a, b);
  if (mode > 0 && mode < 1) {
    const v = betaPdf(mode, a, b);
    if (Number.isFinite(v) && v > m) m = v;
  }
  return m;
}

function buildBetaPath(a, b, yMax) {
  const pts = [];
  for (let i = 0; i <= CURVE_N; i++) {
    const t = i / CURVE_N;
    // Pull slightly off the boundary so PDF stays finite when a<1 or b<1.
    const tc = i === 0 ? 0.001 : i === CURVE_N ? 0.999 : t;
    const y = Math.min(betaPdf(tc, a, b), yMax);
    const px = thetaToPx(t);
    const py = yToPx(y, yMax);
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return pts.join(' ');
}

function buildFillPath(a, b, yMax) {
  const linePath = buildBetaPath(a, b, yMax);
  const baseY = yToPx(0, yMax);
  // Close to baseline.
  return `${linePath} L${thetaToPx(1).toFixed(2)},${baseY.toFixed(2)} L${thetaToPx(0).toFixed(2)},${baseY.toFixed(2)} Z`;
}

// linear interpolation between two (alpha, beta) pairs for tween
function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function BayesUpdateViz() {
  // Prior parameters chosen by sliders.
  const [priorAlpha, setPriorAlpha] = useState(2);
  const [priorBeta, setPriorBeta] = useState(2);

  // Posterior is prior + observed flips. We track the *target* (alpha, beta).
  const [target, setTarget] = useState({ a: 2, b: 2 });
  // Tween-displayed (alpha, beta) — interpolates toward target over TWEEN_MS.
  const [shown, setShown] = useState({ a: 2, b: 2 });
  const [heads, setHeads] = useState(0);
  const [tails, setTails] = useState(0);

  // Sweep "flip many" coin bias.
  const [coinP, setCoinP] = useState(0.7);
  const [sweeping, setSweeping] = useState(false);

  const sweepTimer = useRef(null);
  const tweenRaf = useRef(null);
  const tweenStartRef = useRef(null);
  const fromRef = useRef({ a: 2, b: 2 });

  // When prior sliders change AND no flips yet, sync target & shown to slider values.
  // After flips occur, slider changes shift both prior and target by the same delta
  // (keeping the observed deltas).
  const flipsLockedRef = useRef(false);

  useEffect(() => {
    // If no flips yet, sliders directly drive target & shown.
    if (!flipsLockedRef.current) {
      setTarget({ a: priorAlpha, b: priorBeta });
      setShown({ a: priorAlpha, b: priorBeta });
    } else {
      // After flips: target = priorAlpha + heads, priorBeta + tails.
      setTarget({ a: priorAlpha + heads, b: priorBeta + tails });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorAlpha, priorBeta]);

  // Tween shown toward target whenever target changes.
  useEffect(() => {
    if (tweenRaf.current) cancelAnimationFrame(tweenRaf.current);
    fromRef.current = { a: shown.a, b: shown.b };
    tweenStartRef.current = performance.now();
    const from = fromRef.current;
    const to = target;

    const step = (now) => {
      const elapsed = now - tweenStartRef.current;
      const t = Math.min(1, elapsed / TWEEN_MS);
      // ease-out cubic
      const e = 1 - Math.pow(1 - t, 3);
      setShown({ a: lerp(from.a, to.a, e), b: lerp(from.b, to.b, e) });
      if (t < 1) {
        tweenRaf.current = requestAnimationFrame(step);
      } else {
        tweenRaf.current = null;
      }
    };
    tweenRaf.current = requestAnimationFrame(step);
    return () => {
      if (tweenRaf.current) cancelAnimationFrame(tweenRaf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.a, target.b]);

  useEffect(() => () => {
    if (tweenRaf.current) cancelAnimationFrame(tweenRaf.current);
    if (sweepTimer.current) clearTimeout(sweepTimer.current);
  }, []);

  const flipHead = useCallback(() => {
    flipsLockedRef.current = true;
    setHeads((h) => {
      const nh = h + 1;
      setTarget((prev) => ({ a: prev.a + 1, b: prev.b }));
      return nh;
    });
  }, []);

  const flipTail = useCallback(() => {
    flipsLockedRef.current = true;
    setTails((t) => {
      const nt = t + 1;
      setTarget((prev) => ({ a: prev.a, b: prev.b + 1 }));
      return nt;
    });
  }, []);

  const handleReset = useCallback(() => {
    if (sweepTimer.current) {
      clearTimeout(sweepTimer.current);
      sweepTimer.current = null;
    }
    setSweeping(false);
    flipsLockedRef.current = false;
    setHeads(0);
    setTails(0);
    setTarget({ a: priorAlpha, b: priorBeta });
  }, [priorAlpha, priorBeta]);

  const flipMany = useCallback(() => {
    if (sweeping) {
      if (sweepTimer.current) clearTimeout(sweepTimer.current);
      sweepTimer.current = null;
      setSweeping(false);
      return;
    }
    setSweeping(true);
    let remaining = SWEEP_N;
    const tick = () => {
      if (remaining <= 0) {
        setSweeping(false);
        sweepTimer.current = null;
        return;
      }
      const isHead = Math.random() < coinP;
      if (isHead) flipHead();
      else flipTail();
      remaining -= 1;
      sweepTimer.current = setTimeout(tick, SWEEP_FLIP_MS);
    };
    tick();
  }, [sweeping, coinP, flipHead, flipTail]);

  // Y scale: pick max across prior and shown posterior so the tween fits.
  const yMax = useMemo(() => {
    const pk1 = peakDensity(priorAlpha, priorBeta);
    const pk2 = peakDensity(shown.a, shown.b);
    const pk3 = peakDensity(target.a, target.b);
    return Math.max(0.5, pk1, pk2, pk3) * Y_HEADROOM;
  }, [priorAlpha, priorBeta, shown.a, shown.b, target.a, target.b]);

  const priorPath = useMemo(
    () => buildBetaPath(priorAlpha, priorBeta, yMax),
    [priorAlpha, priorBeta, yMax]
  );
  const postPath = useMemo(
    () => buildBetaPath(shown.a, shown.b, yMax),
    [shown.a, shown.b, yMax]
  );
  const postFill = useMemo(
    () => buildFillPath(shown.a, shown.b, yMax),
    [shown.a, shown.b, yMax]
  );

  const map = useMemo(() => betaMode(shown.a, shown.b), [shown.a, shown.b]);
  const mean = useMemo(() => shown.a / (shown.a + shown.b), [shown.a, shown.b]);

  const yAxisBase = yToPx(0, yMax);
  const xTicks = [0, 0.25, 0.5, 0.75, 1];

  const totalFlips = heads + tails;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <linearGradient id="bayes-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* baseline grid: light vertical guides at quartiles */}
          {xTicks.slice(1, -1).map((t) => (
            <line
              key={`g${t}`}
              x1={thetaToPx(t)}
              y1={PAD_T}
              x2={thetaToPx(t)}
              y2={yAxisBase}
              stroke="var(--border)"
              strokeWidth="0.6"
              strokeDasharray="2 4"
              opacity="0.5"
            />
          ))}

          {/* axes */}
          <line
            x1={PAD_L}
            y1={yAxisBase}
            x2={W - PAD_R}
            y2={yAxisBase}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1={PAD_L}
            y1={PAD_T}
            x2={PAD_L}
            y2={yAxisBase}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* x ticks */}
          {xTicks.map((t) => {
            const px = thetaToPx(t);
            return (
              <g key={`xt${t}`}>
                <line
                  x1={px}
                  y1={yAxisBase}
                  x2={px}
                  y2={yAxisBase + 4}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={px}
                  y={yAxisBase + 15}
                  fontSize="9.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {t.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* axis labels */}
          <text
            x={W - PAD_R}
            y={yAxisBase + 26}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            θ — P(heads)
          </text>
          <text
            x={PAD_L - 4}
            y={PAD_T + 2}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            p(θ)
          </text>

          {/* Prior curve — drawn underneath as a faint reference. */}
          <path
            d={priorPath}
            fill="none"
            stroke="var(--text-dim)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.7"
          />

          {/* Posterior fill + line (tweened) */}
          <path d={postFill} fill="url(#bayes-fill)" />
          <path
            d={postPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.1"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* MAP vertical line */}
          {map > 0 && map < 1 && (
            <g>
              <line
                x1={thetaToPx(map)}
                y1={PAD_T}
                x2={thetaToPx(map)}
                y2={yAxisBase}
                stroke="var(--hue-pink, #ff66cc)"
                strokeWidth="1.4"
                strokeDasharray="4 3"
                opacity="0.95"
              />
              <text
                x={thetaToPx(map)}
                y={PAD_T - 4}
                fontSize="10"
                fill="var(--hue-pink, #ff66cc)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
                fontWeight="700"
              >
                MAP
              </text>
            </g>
          )}

          {/* Mean marker (small tick on axis) */}
          {mean > 0 && mean < 1 && (
            <g>
              <line
                x1={thetaToPx(mean)}
                y1={yAxisBase - 5}
                x2={thetaToPx(mean)}
                y2={yAxisBase + 5}
                stroke="var(--hue-sky, #5ecbff)"
                strokeWidth="1.4"
              />
              <text
                x={thetaToPx(mean)}
                y={yAxisBase + 26}
                fontSize="9.5"
                fill="var(--hue-sky, #5ecbff)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                E[θ]
              </text>
            </g>
          )}

          {/* Legend strip */}
          <g transform={`translate(${PAD_L + 6}, ${PAD_T + 4})`}>
            <line
              x1={0}
              y1={6}
              x2={18}
              y2={6}
              stroke="var(--text-dim)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.8"
            />
            <text
              x={22}
              y={9}
              fontSize="9.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >
              prior
            </text>
            <line
              x1={70}
              y1={6}
              x2={88}
              y2={6}
              stroke="var(--accent)"
              strokeWidth="2.1"
            />
            <text
              x={92}
              y={9}
              fontSize="9.5"
              fill="var(--accent)"
              fontFamily="var(--mono, monospace)"
            >
              posterior
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">α prior</span>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.1"
              value={priorAlpha}
              onChange={(e) => setPriorAlpha(parseFloat(e.target.value))}
              disabled={sweeping}
            />
            <span className="mlviz-slider-val">{snap(priorAlpha, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">β prior</span>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.1"
              value={priorBeta}
              onChange={(e) => setPriorBeta(parseFloat(e.target.value))}
              disabled={sweeping}
            />
            <span className="mlviz-slider-val">{snap(priorBeta, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">p (coin bias)</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={coinP}
              onChange={(e) => setCoinP(parseFloat(e.target.value))}
              disabled={sweeping}
            />
            <span className="mlviz-slider-val">{snap(coinP, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>posterior</span>
          <span className="mlviz-val">α = {snap(target.a, 2)}</span>
          <span className="mlviz-val">β = {snap(target.b, 2)}</span>
          <span className="mlviz-sub">MAP = {snap(map, 3)}</span>
          <span className="mlviz-sub">E[θ] = {snap(mean, 3)}</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink, #ff66cc)' }}>observed</span>
          <span className="mlviz-val">{heads} heads</span>
          <span className="mlviz-val">{tails} tails</span>
          {totalFlips > 0 ? (
            <span className="mlviz-sub">
              empirical = {snap(heads / totalFlips, 3)} (n = {totalFlips})
            </span>
          ) : (
            <span className="mlviz-sub">flip the coin to update</span>
          )}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={flipHead}
            disabled={sweeping}
          >
            <span>Flip H</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={flipTail}
            disabled={sweeping}
          >
            <span>Flip T</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={flipMany}
          >
            <Dice5 size={13} />
            <span>{sweeping ? 'Stop' : `Flip ${SWEEP_N} at p=${snap(coinP, 2)}`}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={totalFlips === 0 && !sweeping}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          Beta(α, β) is conjugate to Bernoulli — each H bumps α by 1, each T bumps β by 1.
        </div>
      </div>
    </div>
  );
}
