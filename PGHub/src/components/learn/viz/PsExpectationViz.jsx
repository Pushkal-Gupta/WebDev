import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { Scale, RotateCcw, Move } from 'lucide-react';
import './PsExpectationViz.css';

const VALUES = [1, 2, 3, 4, 5, 6];
const MIN_W = 0.02;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function normalize(weights) {
  const clamped = weights.map((w) => Math.max(MIN_W, w));
  const sum = clamped.reduce((a, b) => a + b, 0);
  return clamped.map((w) => w / sum);
}

const PRESETS = {
  Uniform: normalize([1, 1, 1, 1, 1, 1]),
  'Skewed right': normalize([0.6, 1, 1.6, 2.4, 3.4, 4.6]),
  'Two peaks': normalize([3, 1.2, 0.4, 0.4, 1.2, 3]),
  Concentrated: normalize([0.3, 0.5, 4.2, 4.2, 0.5, 0.3]),
};

export default function PsExpectationViz() {
  const [weights, setWeights] = useState(PRESETS.Uniform);
  const [active, setActive] = useState('Uniform');
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef(null);

  const W = 760;
  const H = 430;
  const padL = 46;
  const padR = 26;
  const padTop = 26;
  const baseY = 312;
  const fulcrumY = baseY + 18;
  const plotW = W - padL - padR;
  const maxBarH = baseY - padTop;

  const xMin = VALUES[0] - 0.7;
  const xMax = VALUES[VALUES.length - 1] + 0.7;

  const sx = useCallback(
    (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW,
    [plotW, xMin, xMax],
  );

  const stats = useMemo(() => {
    const mean = VALUES.reduce((acc, v, i) => acc + v * weights[i], 0);
    const variance = VALUES.reduce((acc, v, i) => acc + weights[i] * (v - mean) * (v - mean), 0);
    const std = Math.sqrt(variance);
    return { mean, variance, std };
  }, [weights]);

  const maxW = useMemo(() => Math.max(...weights), [weights]);

  const reset = () => {
    setWeights(PRESETS.Uniform);
    setActive('Uniform');
  };

  const applyPreset = (name) => {
    setWeights(PRESETS[name]);
    setActive(name);
  };

  const clientToWeight = useCallback(
    (clientY) => {
      const rect = svgRef.current.getBoundingClientRect();
      const scale = H / rect.height;
      const svgY = (clientY - rect.top) * scale;
      const h = Math.max(0, baseY - svgY);
      return Math.max(MIN_W, h / maxBarH);
    },
    [baseY, maxBarH],
  );

  const onPointerDown = (i) => (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(i);
    setActive(null);
    const raw = clientToWeight(e.clientY);
    setWeights((prev) => normalize(prev.map((w, idx) => (idx === i ? raw : w))));
  };

  const onPointerMove = (i) => (e) => {
    if (dragging !== i) return;
    const raw = clientToWeight(e.clientY);
    setWeights((prev) => normalize(prev.map((w, idx) => (idx === i ? raw : w))));
  };

  const onPointerUp = (e) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(null);
  };

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fmt = (n) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(2));
  const pct = (p) => `${(p * 100).toFixed(0)}%`;

  const meanX = sx(stats.mean);
  const stdLeftX = sx(Math.max(xMin, stats.mean - stats.std));
  const stdRightX = sx(Math.min(xMax, stats.mean + stats.std));
  const barW = (plotW / (xMax - xMin)) * 0.62;

  return (
    <div className="pse">
      <div className="pse-head">
        <div className="pse-head-icon"><Scale size={18} /></div>
        <div className="pse-head-text">
          <h3 className="pse-title">Expectation is the balance point</h3>
          <p className="pse-sub">
            Drag any bar to reshape the distribution — weights re-normalize to sum to 1. The
            triangle marks{' '}
            <span dangerouslySetInnerHTML={{ __html: km('E[X]=\\sum_i x_i\\,p_i') }} />, the point
            where the bars balance. The shaded band shows one standard deviation of spread.
          </p>
        </div>
        <button type="button" className="pse-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="pse-presets">
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            type="button"
            className={active === name ? 'pse-chip pse-chip-on' : 'pse-chip'}
            onClick={() => applyPreset(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="pse-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="pse-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="pse-bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-sky)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--hue-violet)" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="pse-band-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-mint)" stopOpacity="0.05" />
              <stop offset="50%" stopColor="var(--hue-mint)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--hue-mint)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <rect
            x={stdLeftX}
            y={padTop}
            width={Math.max(0, stdRightX - stdLeftX)}
            height={baseY - padTop}
            fill="url(#pse-band-grad)"
            className="pse-band"
          />
          <line x1={stdLeftX} y1={padTop} x2={stdLeftX} y2={baseY} className="pse-band-edge" />
          <line x1={stdRightX} y1={padTop} x2={stdRightX} y2={baseY} className="pse-band-edge" />
          <text x={(stdLeftX + stdRightX) / 2} y={padTop + 12} className="pse-band-label">
            ± 1 std
          </text>

          {VALUES.map((v, i) => {
            const h = (weights[i] / maxW) * maxBarH;
            const x = sx(v) - barW / 2;
            const topY = baseY - h;
            const isMax = weights[i] === maxW;
            return (
              <g key={v}>
                <rect
                  x={x}
                  y={topY}
                  width={barW}
                  height={h}
                  rx={4}
                  fill="url(#pse-bar-grad)"
                  className={
                    reduced ? 'pse-bar' : isMax ? 'pse-bar pse-bar-anim pse-bar-peak' : 'pse-bar pse-bar-anim'
                  }
                />
                <text x={sx(v)} y={topY - 8} className="pse-bar-pct">
                  {pct(weights[i])}
                </text>
                <g
                  className="pse-handle-hit"
                  onPointerDown={onPointerDown(i)}
                  onPointerMove={onPointerMove(i)}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <circle cx={sx(v)} cy={topY} r={14} className="pse-handle-halo" />
                  <circle cx={sx(v)} cy={topY} r={6} className="pse-handle" />
                  <Move
                    x={sx(v) - 5}
                    y={topY - 5}
                    width={10}
                    height={10}
                    className="pse-handle-icon"
                  />
                </g>
              </g>
            );
          })}

          <line x1={padL - 6} y1={baseY} x2={W - padR + 6} y2={baseY} className="pse-axis" />
          {VALUES.map((v) => (
            <text key={`t${v}`} x={sx(v)} y={baseY + 16} className="pse-axis-label">
              {v}
            </text>
          ))}

          <line
            x1={padL - 6}
            y1={fulcrumY}
            x2={W - padR + 6}
            y2={fulcrumY}
            className={reduced ? 'pse-beam' : 'pse-beam pse-beam-anim'}
          />

          <g className={reduced ? 'pse-fulcrum' : 'pse-fulcrum pse-fulcrum-anim'}>
            <polygon
              points={`${meanX},${fulcrumY} ${meanX - 13},${fulcrumY + 24} ${meanX + 13},${fulcrumY + 24}`}
              className="pse-fulcrum-tri"
            />
            <line x1={meanX} y1={padTop} x2={meanX} y2={fulcrumY} className="pse-mean-line" />
            <circle cx={meanX} cy={fulcrumY} r={3.5} className="pse-fulcrum-pivot" />
            <text x={meanX} y={fulcrumY + 40} className="pse-mean-label">
              E[X] = {fmt(stats.mean)}
            </text>
          </g>
        </svg>
      </div>

      <div className="pse-stats">
        <div className="pse-statcard pse-accent">
          <span className="pse-stat-label">expectation</span>
          <span
            className="pse-stat-val"
            dangerouslySetInnerHTML={{ __html: km(`E[X] = ${fmt(stats.mean)}`) }}
          />
          <span
            className="pse-stat-sub"
            dangerouslySetInnerHTML={{ __html: km('\\textstyle\\sum_i x_i\\,p_i') }}
          />
        </div>
        <div className="pse-statcard pse-violet">
          <span className="pse-stat-label">variance</span>
          <span
            className="pse-stat-val"
            dangerouslySetInnerHTML={{ __html: km(`\\mathrm{Var}(X) = ${fmt(stats.variance)}`) }}
          />
          <span
            className="pse-stat-sub"
            dangerouslySetInnerHTML={{ __html: km('\\textstyle\\sum_i p_i\\,(x_i-\\mu)^2') }}
          />
        </div>
        <div className="pse-statcard pse-mint">
          <span className="pse-stat-label">std deviation</span>
          <span
            className="pse-stat-val"
            dangerouslySetInnerHTML={{ __html: km(`\\sigma = ${fmt(stats.std)}`) }}
          />
          <span
            className="pse-stat-sub"
            dangerouslySetInnerHTML={{ __html: km('\\sqrt{\\mathrm{Var}(X)}') }}
          />
        </div>
      </div>

      <div className="pse-note">
        <span
          dangerouslySetInnerHTML={{
            __html: km('E[X+c] = E[X] + c'),
          }}
        />
        <span className="pse-note-text">
          {' '}— linearity: shift every outcome by a constant and the balance point slides by the
          same amount, while the spread stays fixed.
        </span>
      </div>

      <div className="pse-trace">
        <span className="pse-trace-label"><Move size={12} /> reading</span>
        <span className="pse-trace-body">
          Picture the number line as a seesaw and each bar as a stack of mass at that outcome. The
          single point where it balances — heavier bars pulling it toward themselves — is{' '}
          {fmt(stats.mean)}. That is the expectation: a probability-weighted center of mass, not
          necessarily an outcome you can ever observe. The shaded band of width{' '}
          {fmt(2 * stats.std)} ({'±'} {fmt(stats.std)}) shows how far outcomes typically sit
          from that pivot — pile the weight onto one bar and the seesaw tips toward it as the band
          narrows; split it to the extremes and the band widens while the pivot may sit over thin
          air.
        </span>
      </div>
    </div>
  );
}
