import { useId, useMemo, useState } from 'react';
import { RotateCcw, Dices, Play } from 'lucide-react';
import './PowerOfTwoChoicesViz.css';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 16;

function simulate(seed, choices, requests) {
  const rng = mulberry32(seed);
  const bins = new Array(N).fill(0);
  for (let r = 0; r < requests; r += 1) {
    let best = Math.floor(rng() * N);
    for (let c = 1; c < choices; c += 1) {
      const cand = Math.floor(rng() * N);
      if (bins[cand] < bins[best]) best = cand;
    }
    bins[best] += 1;
  }
  return bins;
}

export default function PowerOfTwoChoicesViz({ seed = 7 }) {
  const uid = useId().replace(/:/g, '');
  const [choices, setChoices] = useState(2);
  const [requests, setRequests] = useState(32);
  const [nonce, setNonce] = useState(0);

  const liveSeed = seed * 131 + nonce * 977;

  const bins = useMemo(
    () => simulate(liveSeed, choices, requests),
    [liveSeed, choices, requests]
  );
  const single = useMemo(
    () => simulate(liveSeed + 1, 1, requests),
    [liveSeed, requests]
  );

  const maxLoad = Math.max(...bins, 1);
  const singleMax = Math.max(...single, 1);
  const maxBar = Math.max(maxLoad, singleMax, 4);

  const W = 560;
  const H = 240;
  const padL = 30;
  const padR = 14;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const bw = plotW / N;

  return (
    <div className="p2cviz">
      <div className="p2cviz-header">
        <div className="p2cviz-head-left">
          <span className="p2cviz-iconbox">
            <Dices size={16} aria-hidden="true" />
          </span>
          <div>
            <div className="p2cviz-title">Power of two choices</div>
            <div className="p2cviz-sub">Balls into {N} bins — sample d bins, drop into the emptier one</div>
          </div>
        </div>
        <div className="p2cviz-chip">
          max load <strong>{maxLoad}</strong>
        </div>
      </div>

      <div className="p2cviz-controls">
        <label className="p2cviz-field">
          <span>Choices d = {choices}</span>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={choices}
            onChange={(e) => setChoices(Number(e.target.value))}
          />
        </label>
        <label className="p2cviz-field">
          <span>Requests = {requests}</span>
          <input
            type="range"
            min={8}
            max={96}
            step={4}
            value={requests}
            onChange={(e) => setRequests(Number(e.target.value))}
          />
        </label>
        <button type="button" className="p2cviz-btn" onClick={() => setNonce((n) => n + 1)}>
          <Play size={14} aria-hidden="true" />
          <span>Re-roll</span>
        </button>
        <button
          type="button"
          className="p2cviz-btn p2cviz-btn-ghost"
          onClick={() => {
            setChoices(2);
            setRequests(32);
            setNonce(0);
          }}
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div className="p2cviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="p2cviz-svg" role="img" aria-label="Bin loads">
          <defs>
            <linearGradient id={`${uid}-grad`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.45)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.95)" />
            </linearGradient>
          </defs>
          {[1, 2, 3, 4].map((g) => {
            const lv = (maxBar / 4) * g;
            const y = padT + plotH - (lv / maxBar) * plotH;
            return (
              <g key={g}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  className="p2cviz-grid"
                />
                <text x={padL - 5} y={y + 3} className="p2cviz-axis" textAnchor="end">
                  {Math.round(lv)}
                </text>
              </g>
            );
          })}
          {bins.map((v, i) => {
            const bh = (v / maxBar) * plotH;
            const x = padL + i * bw + bw * 0.14;
            const y = padT + plotH - bh;
            const isMax = v === maxLoad;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={bw * 0.72}
                  height={Math.max(bh, 1)}
                  rx={2}
                  fill={isMax ? 'var(--hue-pink)' : `url(#${uid}-grad)`}
                  className="p2cviz-bar"
                />
                <text
                  x={padL + i * bw + bw / 2}
                  y={padT + plotH + 18}
                  className="p2cviz-axis"
                  textAnchor="middle"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="p2cviz-stats">
        <div className="p2cviz-stat">
          <span className="p2cviz-stat-k">d = {choices} max load</span>
          <span className="p2cviz-stat-v">{maxLoad}</span>
        </div>
        <div className="p2cviz-stat">
          <span className="p2cviz-stat-k">single-choice max</span>
          <span className="p2cviz-stat-v p2cviz-stat-warn">{singleMax}</span>
        </div>
        <div className="p2cviz-stat">
          <span className="p2cviz-stat-k">ideal (even)</span>
          <span className="p2cviz-stat-v">{Math.ceil(requests / N)}</span>
        </div>
        <div className="p2cviz-stat">
          <span className="p2cviz-stat-k">improvement</span>
          <span className="p2cviz-stat-v p2cviz-stat-good">
            {singleMax - maxLoad >= 0 ? `-${singleMax - maxLoad}` : `+${maxLoad - singleMax}`}
          </span>
        </div>
      </div>

      <p className="p2cviz-caption">
        {choices === 1
          ? 'd = 1 is plain random: lucky bins pile up, peak load grows like log n / log log n.'
          : `Sampling ${choices} bins and keeping the lighter one collapses the peak toward the even line — the exponential drop happens going from 1 to 2; 2 to 4 barely helps.`}
      </p>
    </div>
  );
}
