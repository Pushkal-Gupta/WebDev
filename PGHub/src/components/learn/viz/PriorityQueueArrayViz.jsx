import { useId, useMemo, useState } from 'react';
import { RotateCcw, Gauge } from 'lucide-react';
import './PriorityQueueArrayViz.css';

// Stylized cost models (relative wall-clock units, not asymptotic only):
// heap op: log2(n) * pointerPenalty ; array insert: n * cacheFriendly factor.
const CROSSOVER = 16;

function heapCost(n) {
  return Math.max(1, Math.log2(n + 1)) * 3.2; // scattered access penalty baked in
}
function arrayCost(n) {
  return n * 0.22 + 0.6; // contiguous, cheap per element
}

const WORKLOADS = [
  { id: 'interleaved', label: 'Interleaved insert/extract' },
  { id: 'bulk', label: 'Bulk-build then drain' },
];

export default function PriorityQueueArrayViz() {
  const uid = useId().replace(/:/g, '');
  const [n, setN] = useState(8);
  const [workload, setWorkload] = useState('interleaved');

  const curve = useMemo(() => {
    const pts = [];
    for (let k = 1; k <= 64; k += 1) {
      const heap = heapCost(k);
      const arr =
        workload === 'bulk'
          ? Math.log2(k + 1) * 1.1 + 0.4 // sort once, O(1) drain — near log
          : arrayCost(k);
      pts.push({ n: k, heap, arr });
    }
    return pts;
  }, [workload]);

  const winner = useMemo(() => {
    const heap = heapCost(n);
    const arr = workload === 'bulk' ? Math.log2(n + 1) * 1.1 + 0.4 : arrayCost(n);
    return { heap, arr, arrayWins: arr <= heap };
  }, [n, workload]);

  const W = 560;
  const H = 250;
  const padL = 36;
  const padR = 16;
  const padT = 14;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxN = 64;
  const maxCost = Math.max(...curve.map((p) => Math.max(p.heap, p.arr))) * 1.05;

  const x = (k) => padL + ((k - 1) / (maxN - 1)) * plotW;
  const y = (c) => padT + plotH - (c / maxCost) * plotH;

  const heapPath = curve.map((p, i) => `${i ? 'L' : 'M'}${x(p.n)},${y(p.heap)}`).join(' ');
  const arrPath = curve.map((p, i) => `${i ? 'L' : 'M'}${x(p.n)},${y(p.arr)}`).join(' ');
  const crossX = workload === 'interleaved' ? x(CROSSOVER) : null;

  return (
    <div className="pqaviz">
      <div className="pqaviz-header">
        <div className="pqaviz-head-left">
          <span className="pqaviz-iconbox">
            <Gauge size={16} aria-hidden="true" />
          </span>
          <div>
            <div className="pqaviz-title">Sorted array vs binary heap</div>
            <div className="pqaviz-sub">Relative wall-clock cost as n grows</div>
          </div>
        </div>
        <div className={`pqaviz-chip ${winner.arrayWins ? 'pqaviz-chip-arr' : 'pqaviz-chip-heap'}`}>
          at n = {n}: {winner.arrayWins ? 'array wins' : 'heap wins'}
        </div>
      </div>

      <div className="pqaviz-controls">
        <label className="pqaviz-field">
          <span>n = {n}</span>
          <input
            type="range"
            min={1}
            max={64}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
        <div className="pqaviz-seg">
          {WORKLOADS.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`pqaviz-segbtn ${workload === w.id ? 'pqaviz-segbtn-active' : ''}`}
              onClick={() => setWorkload(w.id)}
              aria-pressed={workload === w.id}
            >
              {w.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pqaviz-btn pqaviz-btn-ghost"
          onClick={() => {
            setN(8);
            setWorkload('interleaved');
          }}
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div className="pqaviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pqaviz-svg" role="img" aria-label="Cost curves">
          <defs>
            <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const yy = padT + plotH - f * plotH;
            return (
              <line key={f} x1={padL} y1={yy} x2={W - padR} y2={yy} className="pqaviz-grid" />
            );
          })}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} className="pqaviz-axisline" />
          <line
            x1={padL}
            y1={padT + plotH}
            x2={W - padR}
            y2={padT + plotH}
            className="pqaviz-axisline"
          />
          <text x={padL} y={H - 8} className="pqaviz-axis" textAnchor="middle">
            1
          </text>
          <text x={W - padR} y={H - 8} className="pqaviz-axis" textAnchor="middle">
            64
          </text>
          <text
            x={(padL + W - padR) / 2}
            y={H - 8}
            className="pqaviz-axis pqaviz-axis-dim"
            textAnchor="middle"
          >
            n (elements) →
          </text>
          <text
            x={10}
            y={padT + plotH / 2}
            className="pqaviz-axis pqaviz-axis-dim"
            textAnchor="middle"
            transform={`rotate(-90 10 ${padT + plotH / 2})`}
          >
            cost →
          </text>

          {crossX !== null && (
            <g>
              <line
                x1={crossX}
                y1={padT}
                x2={crossX}
                y2={padT + plotH}
                className="pqaviz-cross"
              />
              <text x={crossX} y={padT + 10} className="pqaviz-crosslabel" textAnchor="middle">
                crossover ≈ {CROSSOVER}
              </text>
            </g>
          )}

          <path d={heapPath} className="pqaviz-line-heap" filter={`url(#${uid}-glow)`} />
          <path d={arrPath} className="pqaviz-line-arr" filter={`url(#${uid}-glow)`} />

          <line
            x1={x(n)}
            y1={padT}
            x2={x(n)}
            y2={padT + plotH}
            className="pqaviz-marker"
          />
          <circle cx={x(n)} cy={y(winner.heap)} r={4.5} className="pqaviz-dot-heap" />
          <circle cx={x(n)} cy={y(winner.arr)} r={4.5} className="pqaviz-dot-arr" />
        </svg>
      </div>

      <div className="pqaviz-legend">
        <span className="pqaviz-leg pqaviz-leg-heap">binary heap O(log n) · scattered</span>
        <span className="pqaviz-leg pqaviz-leg-arr">
          {workload === 'bulk' ? 'sorted array · sort once, O(1) drain' : 'sorted array O(n) · contiguous'}
        </span>
      </div>

      <p className="pqaviz-caption">
        {workload === 'interleaved'
          ? winner.arrayWins
            ? `At n = ${n} the array's contiguous-memory wins beat the heap's log factor — the crossover sits near ${CROSSOVER}.`
            : `At n = ${n} the heap's O(log n) finally dominates the array's O(n) insert; past the crossover the heap pulls ahead and stays there.`
          : 'Bulk-build then drain: sort the array once, then pop in O(1) — it tracks the heap closely and avoids per-op pointer chasing entirely.'}
      </p>
    </div>
  );
}
