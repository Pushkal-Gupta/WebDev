import React, { useMemo, useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import './StrategyPatternViz.css';

const INPUT = [5, 2, 8, 1, 9, 3];

const STRATEGIES = {
  bubble: {
    label: 'BubbleSort',
    hue: 'var(--hue-sky)',
    note: 'adjacent swaps, O(n²)',
    run: (arr) => {
      const a = [...arr];
      let passes = 0;
      for (let i = 0; i < a.length; i += 1) {
        for (let j = 0; j < a.length - 1 - i; j += 1) {
          passes += 1;
          if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
        }
      }
      return { result: a, detail: `${passes} comparisons` };
    },
  },
  quick: {
    label: 'QuickSort',
    hue: 'var(--hue-mint)',
    note: 'pivot partition, O(n log n) avg',
    run: (arr) => {
      let partitions = 0;
      const qs = (a) => {
        if (a.length <= 1) return a;
        partitions += 1;
        const [p, ...rest] = a;
        return [...qs(rest.filter((x) => x < p)), p, ...qs(rest.filter((x) => x >= p))];
      };
      return { result: qs([...arr]), detail: `${partitions} partitions` };
    },
  },
  merge: {
    label: 'MergeSort',
    hue: 'var(--hue-violet)',
    note: 'divide & merge, O(n log n)',
    run: (arr) => {
      let merges = 0;
      const ms = (a) => {
        if (a.length <= 1) return a;
        const mid = Math.floor(a.length / 2);
        const l = ms(a.slice(0, mid));
        const r = ms(a.slice(mid));
        merges += 1;
        const out = [];
        let i = 0;
        let j = 0;
        while (i < l.length && j < r.length) out.push(l[i] <= r[j] ? l[i++] : r[j++]);
        return [...out, ...l.slice(i), ...r.slice(j)];
      };
      return { result: ms([...arr]), detail: `${merges} merges` };
    },
  },
};

const KEYS = Object.keys(STRATEGIES);

export default function StrategyPatternViz() {
  const [key, setKey] = useState('bubble');
  const [runId, setRunId] = useState(0);

  const strat = STRATEGIES[key];
  const output = useMemo(() => strat.run(INPUT), [strat, runId]); // eslint-disable-line react-hooks/exhaustive-deps

  // SVG geometry
  const W = 940;
  const H = 320;

  return (
    <div className="spv">
      <div className="spv-head">
        <h3 className="spv-title">Strategy — swap the algorithm, keep the caller</h3>
        <p className="spv-sub">
          The context calls one method: <code>strategy.sort(data)</code>. Pick a different strategy from the dropdown
          and the same context call produces different behavior — the context code never changes.
        </p>
      </div>

      <div className="spv-controls">
        <label className="spv-select">
          <span className="spv-input-label">strategy</span>
          <select value={key} onChange={(e) => setKey(e.target.value)} className="spv-dropdown">
            {KEYS.map((k) => (
              <option key={k} value={k}>{STRATEGIES[k].label}</option>
            ))}
          </select>
        </label>
        <button type="button" className="spv-btn spv-btn-primary" onClick={() => setRunId((r) => r + 1)}>
          <Play size={14} /> context.execute()
        </button>
        <span className="spv-spacer" aria-hidden="true" />
        <div className="spv-strat-tabs">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`spv-tab ${k === key ? 'is-active' : ''}`}
              onClick={() => setKey(k)}
              style={k === key ? { borderColor: STRATEGIES[k].hue, color: STRATEGIES[k].hue } : undefined}
            >
              {STRATEGIES[k].label}
            </button>
          ))}
        </div>
      </div>

      <div className="spv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="spv-svg" preserveAspectRatio="xMidYMid meet">
          {/* fixed context block */}
          <rect className="spv-context" x={40} y={90} width={250} height={120} rx={10} />
          <text className="spv-node-title" x={165} y={118}>Context</text>
          <text className="spv-node-sub" x={165} y={136}>(unchanged code)</text>
          <rect className="spv-code-pill" x={62} y={152} width={206} height={40} rx={6} />
          <text className="spv-code-text" x={165} y={177}>strategy.sort(data)</text>

          {/* arrow context -> strategy */}
          <line className="spv-edge" x1={290} y1={150} x2={400} y2={150} style={{ stroke: strat.hue }} />
          <polygon className="spv-arrow" points="400,144 412,150 400,156" style={{ fill: strat.hue }} />

          {/* interchangeable strategy slot */}
          <rect className="spv-strategy" x={412} y={90} width={250} height={120} rx={10} style={{ stroke: strat.hue }} />
          <text className="spv-node-title" x={537} y={118} style={{ fill: strat.hue }}>{strat.label}</text>
          <text className="spv-node-sub" x={537} y={136}>{strat.note}</text>
          <rect className="spv-code-pill" x={434} y={152} width={206} height={40} rx={6} style={{ stroke: strat.hue }} />
          <text className="spv-code-text" x={537} y={177} style={{ fill: strat.hue }}>{strat.detail}</text>

          {/* the other strategies waiting in the bench */}
          {KEYS.map((k) => {
            if (k === key) return null;
            const slot = KEYS.filter((x) => x !== key).indexOf(k);
            return (
              <g key={`bench-${k}`} className="spv-bench">
                <rect x={700} y={92 + slot * 52} width={200} height={42} rx={7} />
                <text x={800} y={92 + slot * 52 + 26}>{STRATEGIES[k].label}</text>
              </g>
            );
          })}
          <text className="spv-bench-label" x={800} y={80}>interchangeable</text>

          {/* input + output rows */}
          <text className="spv-row-label" x={40} y={250}>input</text>
          {INPUT.map((v, i) => (
            <g key={`in-${i}`}>
              <rect className="spv-cell" x={120 + i * 44} y={236} width={36} height={26} rx={5} />
              <text className="spv-cell-text" x={120 + i * 44 + 18} y={254}>{v}</text>
            </g>
          ))}
          <text className="spv-row-label" x={40} y={296}>output</text>
          {output.result.map((v, i) => (
            <g key={`out-${i}`}>
              <rect className="spv-cell is-out" x={120 + i * 44} y={282} width={36} height={26} rx={5} style={{ stroke: strat.hue }} />
              <text className="spv-cell-text" x={120 + i * 44 + 18} y={300} style={{ fill: strat.hue }}>{v}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="spv-metrics">
        <div className="spv-metric">
          <span className="spv-metric-label">active strategy</span>
          <span className="spv-metric-value" style={{ color: strat.hue }}>{strat.label}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">context call</span>
          <span className="spv-metric-value">strategy.sort(data)</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">work done</span>
          <span className="spv-metric-value" style={{ color: strat.hue }}>{output.detail}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">result</span>
          <span className="spv-metric-value">[{output.result.join(', ')}]</span>
        </div>
      </div>

      <div className="spv-narration">
        <span className="spv-narration-label"><Shuffle size={12} /> trace</span>
        <span className="spv-narration-body">
          Context invoked <code>strategy.sort(data)</code> with the <strong>{strat.label}</strong> strategy plugged in
          ({strat.detail}) and got [{output.result.join(', ')}]. Switching strategy swaps only the plugged-in object —
          the line in the context that calls it is identical for all three.
        </span>
      </div>
    </div>
  );
}
