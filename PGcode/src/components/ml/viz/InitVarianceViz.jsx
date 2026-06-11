import React, { useMemo, useState } from 'react';
import { Layers, RotateCcw, ToggleLeft, ToggleRight } from 'lucide-react';
import './MLViz.css';

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const SCHEMES = [
  { key: 'zero',   label: 'all-zero',     color: 'var(--text-dim)',  desc: 'symmetry never breaks' },
  { key: 'tiny',   label: 'N(0, 0.01²)',  color: 'var(--hue-pink)',  desc: 'signal collapses' },
  { key: 'xavier', label: 'Xavier 1/n',   color: 'var(--hue-violet)', desc: 'right for tanh, halves on ReLU' },
  { key: 'he',     label: 'He 2/n',       color: 'var(--hue-mint)',  desc: 'variance preserved' },
];

function sigmaFor(scheme, n) {
  if (scheme === 'zero') return 0;
  if (scheme === 'tiny') return 0.01;
  if (scheme === 'xavier') return Math.sqrt(1 / n);
  if (scheme === 'he') return Math.sqrt(2 / n);
  return 0;
}

function simulate(scheme, depth, width, useReLU, seed) {
  const rng = mulberry32(seed + (scheme === 'zero' ? 1 : scheme === 'tiny' ? 2 : scheme === 'xavier' ? 3 : 4));
  let x = new Array(width).fill(0).map(() => gaussian(rng));
  const stds = [];
  const mean0 = x.reduce((a, b) => a + b, 0) / width;
  const v0 = x.reduce((a, b) => a + (b - mean0) ** 2, 0) / width;
  stds.push(Math.sqrt(v0));
  for (let l = 1; l <= depth; l++) {
    const sigmaW = sigmaFor(scheme, width);
    const next = new Array(width).fill(0);
    for (let i = 0; i < width; i++) {
      let z = 0;
      for (let j = 0; j < width; j++) {
        const w = scheme === 'zero' ? 0 : sigmaW * gaussian(rng);
        z += w * x[j];
      }
      next[i] = useReLU ? Math.max(0, z) : Math.tanh(z);
    }
    const m = next.reduce((a, b) => a + b, 0) / width;
    const v = next.reduce((a, b) => a + (b - m) ** 2, 0) / width;
    stds.push(Math.sqrt(v));
    x = next;
  }
  return stds;
}

const W_SVG = 720;
const H_SVG = 380;
const PAD_L = 56;
const PAD_R = 24;
const PAD_T = 28;
const PAD_B = 44;

function logScale(v) {
  const eps = 1e-6;
  return Math.log10(Math.max(eps, v));
}

export default function InitVarianceViz() {
  const [depth, setDepth] = useState(10);
  const [useReLU, setUseReLU] = useState(true);
  const [seed, setSeed] = useState(7);
  const width = 64;

  const series = useMemo(() => {
    return SCHEMES.map((s) => ({
      ...s,
      stds: simulate(s.key, depth, width, useReLU, seed),
    }));
  }, [depth, useReLU, seed]);

  const plotW = W_SVG - PAD_L - PAD_R;
  const plotH = H_SVG - PAD_T - PAD_B;
  const xAt = (l) => PAD_L + (l / depth) * plotW;

  const yMin = -3;
  const yMax = 1;
  const yAt = (v) => PAD_T + plotH * (1 - (logScale(v) - yMin) / (yMax - yMin));

  const yTicks = [-3, -2, -1, 0, 1];
  const tickLabel = (e) => (e === 0 ? '1' : e === 1 ? '10' : `10${e < 0 ? '⁻' : ''}${Math.abs(e) === 1 ? '¹' : Math.abs(e) === 2 ? '²' : '³'}`);

  const reset = () => {
    setDepth(10);
    setUseReLU(true);
    setSeed(7);
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <text x={W_SVG / 2} y={18} fontFamily="var(--mono)" fontSize="11" fill="var(--text-dim)" textAnchor="middle" letterSpacing="0.08em">
            PER-LAYER ACTIVATION STD &nbsp;·&nbsp; {useReLU ? 'ReLU' : 'tanh'} &nbsp;·&nbsp; width {width}
          </text>

          {yTicks.map((e) => (
            <g key={`gy${e}`}>
              <line x1={PAD_L} y1={yAt(Math.pow(10, e))} x2={W_SVG - PAD_R} y2={yAt(Math.pow(10, e))} stroke="var(--border)" strokeWidth="0.6" opacity="0.45" />
              <text x={PAD_L - 8} y={yAt(Math.pow(10, e)) + 4} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">{tickLabel(e)}</text>
            </g>
          ))}

          {Array.from({ length: depth + 1 }, (_, l) => l).filter((l) => l % Math.max(1, Math.round(depth / 10)) === 0).map((l) => (
            <g key={`gx${l}`}>
              <line x1={xAt(l)} y1={PAD_T} x2={xAt(l)} y2={H_SVG - PAD_B} stroke="var(--border)" strokeWidth="0.6" opacity="0.25" />
              <text x={xAt(l)} y={H_SVG - PAD_B + 16} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="middle">{l}</text>
            </g>
          ))}

          <line x1={PAD_L} y1={yAt(1)} x2={W_SVG - PAD_R} y2={yAt(1)} stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <text x={W_SVG - PAD_R - 4} y={yAt(1) - 6} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">unit variance</text>

          <text x={PAD_L - 38} y={PAD_T - 4} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)">σ(a)</text>
          <text x={W_SVG - PAD_R} y={H_SVG - PAD_B + 32} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">layer index</text>

          {series.map((s) => {
            const pts = s.stds.map((v, l) => `${l === 0 ? 'M' : 'L'} ${xAt(l).toFixed(2)} ${yAt(v).toFixed(2)}`).join(' ');
            return (
              <g key={s.key}>
                <path d={pts} fill="none" stroke={s.color} strokeWidth="2.2" opacity="0.95" />
                {s.stds.map((v, l) => (
                  <circle key={`p-${s.key}-${l}`} cx={xAt(l)} cy={yAt(v)} r="3" fill={s.color} />
                ))}
                <text
                  x={xAt(depth) + 6}
                  y={yAt(s.stds[depth]) + 4}
                  fontSize="10.5"
                  fontFamily="var(--mono)"
                  fill={s.color}
                  fontWeight="700"
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        {series.map((s) => (
          <div key={s.key} className="mlviz-row">
            <span className="mlviz-tag" style={{ color: s.color }}>{s.label}</span>
            <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>
              σ(L={depth}) = {s.stds[depth] < 1e-4 ? s.stds[depth].toExponential(1) : s.stds[depth].toFixed(3)}
            </span>
            <span className="mlviz-sub">{s.desc}</span>
          </div>
        ))}
      </div>

      <div className="mlviz-controls">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <Layers size={13} />
          depth
          <input
            type="range"
            min={2}
            max={20}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            style={{ width: 160, accentColor: 'var(--accent)' }}
          />
          <span style={{ color: 'var(--text-main)', minWidth: '3ch' }}>{depth}</span>
        </label>
        <button type="button" className="mlviz-btn" onClick={() => setUseReLU((v) => !v)} title="Toggle activation function">
          {useReLU ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          activation: {useReLU ? 'ReLU' : 'tanh'}
        </button>
        <button type="button" className="mlviz-btn" onClick={() => setSeed((s) => s + 1)}>
          new sample
        </button>
        <button type="button" className="mlviz-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
