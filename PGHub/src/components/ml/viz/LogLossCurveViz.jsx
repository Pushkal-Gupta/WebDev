import React, { useState, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 520;
const H = 320;
const PAD_L = 50;
const PAD_R = 24;
const PAD_T = 22;
const PAD_B = 44;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const Q_MIN = 0.01;
const Q_MAX = 1.0;
const LOSS_MAX = 5.0;

const xToPx = (q) => PAD_L + ((q - Q_MIN) / (Q_MAX - Q_MIN)) * PLOT_W;
const yToPx = (l) => PAD_T + (1 - Math.min(l, LOSS_MAX) / LOSS_MAX) * PLOT_H;

function buildPath() {
  const N = 200;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const q = Q_MIN + ((Q_MAX - Q_MIN) * i) / N;
    const loss = -Math.log(q);
    pts.push(`${i === 0 ? 'M' : 'L'}${xToPx(q).toFixed(2)},${yToPx(loss).toFixed(2)}`);
  }
  return pts.join(' ');
}

const PATH = buildPath();
const FILL = `${PATH} L${xToPx(Q_MAX).toFixed(2)},${yToPx(0).toFixed(2)} L${xToPx(Q_MIN).toFixed(2)},${yToPx(0).toFixed(2)} Z`;

const XTICKS = [0.1, 0.25, 0.5, 0.75, 1.0];
const YTICKS = [0, 1, 2, 3, 4, 5];

const PRESETS = [
  { label: 'confident right', q: 0.95 },
  { label: 'unsure', q: 0.5 },
  { label: 'wrong', q: 0.2 },
  { label: 'overconfident wrong', q: 0.02 },
];

function toneFor(loss) {
  if (loss < 0.3) return 'var(--easy, #2dd4bf)';
  if (loss < 1.5) return 'var(--warning, #facc15)';
  return 'var(--hard, #f87171)';
}

export default function LogLossCurveViz() {
  const [q, setQ] = useState(0.5);
  const svgRef = useRef(null);

  const loss = -Math.log(q);
  const tone = toneFor(loss);

  const onSvgMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const localX = local.x;
    if (localX < PAD_L || localX > W - PAD_R) return;
    const newQ = Q_MIN + ((localX - PAD_L) / PLOT_W) * (Q_MAX - Q_MIN);
    setQ(Math.max(Q_MIN, Math.min(Q_MAX, newQ)));
  };

  const cx = xToPx(q);
  const cy = yToPx(Math.min(loss, LOSS_MAX));

  return (
    <div className="mlviz-wrap">
      <div className="llc-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="llc-svg"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={onSvgMove}
          onClick={onSvgMove}
        >
          <defs>
            <linearGradient id="llc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {YTICKS.map((y) => (
            <line
              key={`gy-${y}`}
              x1={PAD_L}
              y1={yToPx(y)}
              x2={W - PAD_R}
              y2={yToPx(y)}
              stroke="var(--border)"
              strokeWidth="0.6"
              opacity="0.45"
            />
          ))}
          {XTICKS.map((x) => (
            <line
              key={`gx-${x}`}
              x1={xToPx(x)}
              y1={PAD_T}
              x2={xToPx(x)}
              y2={H - PAD_B}
              stroke="var(--border)"
              strokeWidth="0.6"
              opacity="0.35"
            />
          ))}

          <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="var(--text-dim)" strokeWidth="1" />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="var(--text-dim)" strokeWidth="1" />

          {YTICKS.map((y) => (
            <text
              key={`yt-${y}`}
              x={PAD_L - 8}
              y={yToPx(y) + 4}
              fontSize="11"
              fontFamily="var(--mono)"
              fill="var(--text-dim)"
              textAnchor="end"
            >
              {y}
            </text>
          ))}
          {XTICKS.map((x) => (
            <text
              key={`xt-${x}`}
              x={xToPx(x)}
              y={H - PAD_B + 16}
              fontSize="11"
              fontFamily="var(--mono)"
              fill="var(--text-dim)"
              textAnchor="middle"
            >
              {x}
            </text>
          ))}

          <text x={PAD_L - 38} y={PAD_T + 8} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)">
            loss
          </text>
          <text x={W - PAD_R} y={H - PAD_B + 32} fontSize="11" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="end">
            q (predicted prob. of true class)
          </text>

          <path d={FILL} fill="url(#llc-fill)" />
          <path d={PATH} fill="none" stroke="var(--accent)" strokeWidth="2.2" />

          <line x1={cx} y1={PAD_T} x2={cx} y2={H - PAD_B} stroke={tone} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
          <line x1={PAD_L} y1={cy} x2={cx} y2={cy} stroke={tone} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />

          <circle cx={cx} cy={cy} r="6" fill={tone} stroke="var(--bg)" strokeWidth="2" />

          <text
            x={cx + 10}
            y={Math.max(PAD_T + 14, cy - 10)}
            fontSize="12"
            fontFamily="var(--mono)"
            fontWeight="700"
            fill={tone}
          >
            −log({q.toFixed(2)}) = {loss.toFixed(2)}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>q</span>
          <span className="mlviz-val">= {q.toFixed(3)}</span>
          <span className="mlviz-sub">predicted probability assigned to the true class</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: tone }}>loss</span>
          <span className="mlviz-val">= −log(q) = {loss.toFixed(3)}</span>
          <span className="mlviz-sub">
            {loss < 0.3 && 'confident and right — barely any penalty'}
            {loss >= 0.3 && loss < 1.5 && 'unsure — moderate penalty'}
            {loss >= 1.5 && 'overconfident wrong — loss blows up'}
          </span>
        </div>
      </div>

      <div className="mt-controls">
        <div className="mlviz-slider" style={{ flex: 1, minWidth: 200 }}>
          <span className="mlviz-slider-label">q</span>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={q}
            onChange={(e) => setQ(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{q.toFixed(2)}</span>
        </div>
        <div className="mt-presets">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="mt-preset-btn" onClick={() => setQ(p.q)}>
              {p.label}
            </button>
          ))}
        </div>
        <button type="button" className="mlviz-btn" onClick={() => setQ(0.5)}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
