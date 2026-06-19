import React, { useCallback, useMemo, useState } from 'react';
import { Dices, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 540;
const H = 360;

// deterministic PRNG
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// network shape: input 3, hidden1 5, hidden2 5, output 2
const LAYERS = [3, 5, 5, 2];
const DROPPABLE = [false, true, true, false]; // only hidden layers drop

function nodePositions() {
  const cols = LAYERS.length;
  const colGap = (W - 120) / (cols - 1);
  const out = [];
  LAYERS.forEach((count, ci) => {
    const x = 60 + ci * colGap;
    const colNodes = [];
    const rowGap = (H - 80) / (count + 1);
    for (let r = 0; r < count; r++) {
      const y = 40 + rowGap * (r + 1);
      colNodes.push({ x, y, ci, r });
    }
    out.push(colNodes);
  });
  return out;
}

function fmt(v, p = 2) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

function superFmt(exp) {
  if (exp <= 0) return '1';
  if (exp <= 18) return Math.pow(2, exp).toLocaleString();
  // approximate in scientific notation for large exponents
  const log10 = exp * Math.log10(2);
  const mant = Math.pow(10, log10 - Math.floor(log10));
  return `${mant.toFixed(1)}×10^${Math.floor(log10)}`;
}

export default function DropoutExplorerViz({ rate = 0.4 }) {
  const [p, setP] = useState(rate);
  const [mode, setMode] = useState('train'); // 'train' | 'test'
  const [step, setStep] = useState(1);

  const positions = useMemo(() => nodePositions(), []);

  // sample mask per droppable node, deterministically from (step, p, layer, row)
  const masks = useMemo(() => {
    const rng = mulberry32(step * 2654435761);
    return positions.map((col, ci) =>
      col.map(() => {
        if (!DROPPABLE[ci]) return true;
        return rng() >= p; // alive with prob (1-p)
      })
    );
  }, [positions, p, step]);

  const testMode = mode === 'test';

  const totalHidden = LAYERS.reduce((s, c, i) => (DROPPABLE[i] ? s + c : s), 0);

  const aliveHidden = useMemo(() => {
    let n = 0;
    masks.forEach((col, ci) => {
      if (!DROPPABLE[ci]) return;
      col.forEach((m) => {
        if (m) n += 1;
      });
    });
    return n;
  }, [masks]);

  const scale = testMode ? 1 : 1 / Math.max(1e-6, 1 - p);

  // a node is shown alive when: test mode (all alive) OR its mask is true
  const isAlive = (ci, r) => testMode || masks[ci][r];

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resample = useCallback(() => setStep((s) => s + 1), []);
  const reset = useCallback(() => {
    setP(rate);
    setMode('train');
    setStep(1);
  }, [rate]);

  // build edges between consecutive layers
  const edges = [];
  for (let ci = 0; ci < positions.length - 1; ci++) {
    positions[ci].forEach((a, ar) => {
      positions[ci + 1].forEach((b, br) => {
        const live = isAlive(ci, ar) && isAlive(ci + 1, br);
        edges.push({ a, b, live, key: `${ci}-${ar}-${br}` });
      });
    });
  }

  const ID = 'dropex';

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Dices size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Dropout explorer</span>
          <span className="aev-head-sub">
            each Step samples a fresh Bernoulli mask — a brand-new subnetwork
          </span>
        </span>
        <span className="aev-chip">p = {fmt(p, 2)}</span>
      </div>

      <div className="aev-toggles">
        <button
          type="button"
          className={`mlviz-toggle${!testMode ? ' is-on' : ''}`}
          style={{ '--toggle-color': 'var(--hue-pink)' }}
          onClick={() => setMode('train')}
        >
          <span className="mlviz-toggle-dot" />
          Train (mask + ×{fmt(scale, 2)})
        </button>
        <button
          type="button"
          className={`mlviz-toggle${testMode ? ' is-on' : ''}`}
          style={{ '--toggle-color': 'var(--hue-mint)' }}
          onClick={() => setMode('test')}
        >
          <span className="mlviz-toggle-dot" />
          Test (all alive, ×1)
        </button>
      </div>

      <div className="aev-body eigex-body">
        <div className="mlviz-stage aev-stage">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg dropex-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id={`${ID}-glow`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.6" />
              </filter>
            </defs>

            {/* edges */}
            {edges.map((e) => (
              <line
                key={e.key}
                x1={e.a.x}
                y1={e.a.y}
                x2={e.b.x}
                y2={e.b.y}
                stroke={e.live ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={e.live ? 1 : 0.6}
                opacity={e.live ? 0.4 : 0.12}
                strokeDasharray={e.live ? undefined : '2 3'}
                style={{ transition: reduced ? 'none' : 'opacity 0.2s ease' }}
              />
            ))}

            {/* nodes */}
            {positions.map((col, ci) =>
              col.map((node, r) => {
                const alive = isAlive(ci, r);
                const dropp = DROPPABLE[ci];
                const color = !dropp
                  ? 'var(--hue-sky)'
                  : alive
                  ? 'var(--hue-mint)'
                  : 'var(--text-dim)';
                return (
                  <g key={`n-${ci}-${r}`} style={{ transition: reduced ? 'none' : 'opacity 0.2s ease' }}>
                    {alive && dropp && (
                      <circle cx={node.x} cy={node.y} r="13" fill="var(--hue-mint)" opacity="0.16" filter={`url(#${ID}-glow)`} />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="9"
                      fill={alive ? color : 'transparent'}
                      stroke={color}
                      strokeWidth={alive ? 1 : 1.4}
                      strokeDasharray={alive ? undefined : '3 2.5'}
                      opacity={alive ? 0.92 : 0.55}
                    />
                    {/* cross out dead nodes */}
                    {!alive && (
                      <g stroke="var(--hard)" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
                        <line x1={node.x - 5} y1={node.y - 5} x2={node.x + 5} y2={node.y + 5} />
                        <line x1={node.x - 5} y1={node.y + 5} x2={node.x + 5} y2={node.y - 5} />
                      </g>
                    )}
                  </g>
                );
              })
            )}

            {/* layer captions */}
            {['input', 'hidden', 'hidden', 'output'].map((lbl, ci) => (
              <text
                key={`lbl-${ci}`}
                x={positions[ci][0].x}
                y={22}
                fontSize="9"
                fontFamily="var(--mono)"
                fill="var(--text-dim)"
                textAnchor="middle"
                letterSpacing="0.08em"
              >
                {lbl}
              </text>
            ))}
          </svg>
        </div>

        <div className="mlviz-statcol eigex-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">drop rate p</span>
            <span className="mlviz-statcard-val">{fmt(p, 2)}</span>
            <span className="eig-card-sub">{testMode ? 'mask off at test' : `keep ${fmt(1 - p, 2)}`}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">alive units</span>
            <span className="mlviz-statcard-val">
              {testMode ? totalHidden : aliveHidden}/{totalHidden}
            </span>
            <span className="eig-card-sub">{testMode ? 'every neuron on' : `${totalHidden - aliveHidden} dropped`}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">subnetworks</span>
            <span className="mlviz-statcard-val">2^{totalHidden}</span>
            <span className="eig-card-sub">≈ {superFmt(totalHidden)}</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">drop p</span>
          <input
            type="range"
            min={0}
            max={0.9}
            step="0.05"
            value={p}
            onChange={(e) => setP(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{fmt(p, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={resample} disabled={testMode}>
            <Dices size={13} />
            <span>Step — sample new mask</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {testMode
            ? 'test time: no mask, scale ×1 — the full ensemble averages in one pass'
            : `train time: dead units are crossed out · survivors scale by ×${fmt(scale, 2)} = 1/(1−p) to keep the expected magnitude`}
        </div>
      </div>
    </div>
  );
}
