import { useId, useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Bird, AlertTriangle, Dices } from 'lucide-react';
import './PigeonholePrincipleViz.css';

const km = (expr, display = false) =>
  katex.renderToString(expr, { throwOnError: false, displayMode: display });

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

function distribute(seed, pigeons, boxes) {
  const rng = mulberry32(seed);
  const assign = new Array(boxes).fill(0).map(() => []);
  // Spread as evenly as the count allows first (worst case for collisions),
  // then a deterministic shuffle of leftovers — illustrates "can't avoid" pigeonhole.
  const order = Array.from({ length: pigeons }, (_, i) => i);
  // light shuffle
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // round-robin to keep it as even as possible (still forces overflow when p>b)
  order.forEach((pid, k) => {
    assign[k % boxes].push(pid);
  });
  return assign;
}

export default function PigeonholePrincipleViz({ seed = 11 }) {
  const uid = useId().replace(/:/g, '');
  const [boxes, setBoxes] = useState(5);
  const [pigeons, setPigeons] = useState(6);
  const [nonce, setNonce] = useState(0);

  const assign = useMemo(
    () => distribute(seed * 101 + nonce * 53, pigeons, boxes),
    [seed, nonce, pigeons, boxes]
  );

  const forced = pigeons > boxes;
  const guaranteed = Math.ceil(pigeons / boxes);
  const overfull = assign.filter((b) => b.length >= 2).length;

  const W = 560;
  const boxW = (W - (boxes + 1) * 10) / boxes;
  const maxStack = Math.max(...assign.map((b) => b.length), 1);
  const rowH = 24;
  const headH = 26;
  const H = headH + maxStack * rowH + 18;

  return (
    <div className="phpviz">
      <div className="phpviz-header">
        <div className="phpviz-head-left">
          <span className="phpviz-iconbox">
            <Bird size={16} aria-hidden="true" />
          </span>
          <div>
            <div className="phpviz-title">Pigeonhole principle</div>
            <div className="phpviz-sub">
              {pigeons} pigeons into {boxes} boxes
            </div>
          </div>
        </div>
        <div className={`phpviz-verdict ${forced ? 'phpviz-verdict-forced' : 'phpviz-verdict-ok'}`}>
          {forced ? (
            <>
              <AlertTriangle size={14} aria-hidden="true" />
              <span>collision forced</span>
            </>
          ) : (
            <span>no collision required</span>
          )}
        </div>
      </div>

      <div className="phpviz-controls">
        <label className="phpviz-field">
          <span>Pigeons = {pigeons}</span>
          <input
            type="range"
            min={1}
            max={14}
            value={pigeons}
            onChange={(e) => setPigeons(Number(e.target.value))}
          />
        </label>
        <label className="phpviz-field">
          <span>Boxes = {boxes}</span>
          <input
            type="range"
            min={1}
            max={10}
            value={boxes}
            onChange={(e) => setBoxes(Number(e.target.value))}
          />
        </label>
        <button type="button" className="phpviz-btn" onClick={() => setNonce((x) => x + 1)}>
          <Dices size={14} aria-hidden="true" />
          <span>Re-deal</span>
        </button>
        <button
          type="button"
          className="phpviz-btn phpviz-btn-ghost"
          onClick={() => {
            setBoxes(5);
            setPigeons(6);
            setNonce(0);
          }}
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div className="phpviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="phpviz-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Pigeons in boxes">
          <defs>
            <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.9)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.55)" />
            </linearGradient>
          </defs>
          {assign.map((box, bi) => {
            const x = 10 + bi * (boxW + 10);
            const over = box.length >= 2;
            return (
              <g key={bi}>
                <rect
                  x={x}
                  y={headH}
                  width={boxW}
                  height={H - headH - 6}
                  rx={6}
                  className={`phpviz-box ${over ? 'phpviz-box-over' : ''}`}
                />
                <text x={x + boxW / 2} y={16} textAnchor="middle" className="phpviz-boxlabel">
                  box {bi + 1}
                </text>
                {box.map((pid, k) => {
                  const cy = H - 6 - (k + 1) * rowH + rowH / 2;
                  return (
                    <g key={pid} transform={`translate(${x + boxW / 2}, ${cy})`}>
                      <circle
                        r={9}
                        fill={over ? 'var(--hue-pink)' : `url(#${uid}-g)`}
                        className="phpviz-pigeon"
                      />
                      <text textAnchor="middle" dy={3} className="phpviz-pid">
                        {pid + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="phpviz-stats">
        <div className="phpviz-stat">
          <span className="phpviz-stat-k">guaranteed in some box</span>
          <span
            className="phpviz-stat-v"
            dangerouslySetInnerHTML={{ __html: km(`\\geq ${guaranteed}`) }}
          />
        </div>
        <div className="phpviz-stat">
          <span className="phpviz-stat-k">boxes with ≥ 2</span>
          <span className={`phpviz-stat-v ${overfull > 0 ? 'phpviz-stat-warn' : ''}`}>{overfull}</span>
        </div>
        <div className="phpviz-stat">
          <span className="phpviz-stat-k">fullest box bound</span>
          <span
            className="phpviz-stat-v"
            dangerouslySetInnerHTML={{
              __html: km(`\\left\\lceil \\tfrac{${pigeons}}{${boxes}} \\right\\rceil = ${guaranteed}`),
            }}
          />
        </div>
      </div>

      <p className="phpviz-caption">
        {forced
          ? `With ${pigeons} > ${boxes}, no arrangement avoids it: at least one box must hold ⌈${pigeons}/${boxes}⌉ = ${guaranteed} pigeons. Spread them as evenly as you like — overflow is unavoidable.`
          : `${pigeons} ≤ ${boxes}, so a one-per-box arrangement exists; the principle only forces a collision once pigeons exceed boxes.`}
      </p>
    </div>
  );
}
