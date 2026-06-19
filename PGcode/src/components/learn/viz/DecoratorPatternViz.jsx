import React, { useMemo, useState } from 'react';
import { Layers, Coffee } from 'lucide-react';
import './DecoratorPatternViz.css';

const BASE = { label: 'Espresso', cost: 2.0 };

const DECORATORS = [
  { id: 'milk', label: 'Milk', cost: 0.5, hue: 'var(--hue-sky)' },
  { id: 'sugar', label: 'Sugar', cost: 0.25, hue: 'var(--hue-mint)' },
  { id: 'whip', label: 'Whip', cost: 0.75, hue: 'var(--hue-pink)' },
  { id: 'caramel', label: 'Caramel', cost: 0.6, hue: 'var(--hue-violet)' },
];

export default function DecoratorPatternViz() {
  const [active, setActive] = useState({ milk: true, sugar: false, whip: true, caramel: false });

  const chain = useMemo(() => DECORATORS.filter((d) => active[d.id]), [active]);

  const computed = useMemo(() => {
    let cost = BASE.cost;
    let desc = BASE.label;
    const steps = [{ label: BASE.label, cost: BASE.cost, running: BASE.cost }];
    chain.forEach((d) => {
      cost += d.cost;
      desc = `${desc} + ${d.label}`;
      steps.push({ label: d.label, cost: d.cost, running: cost });
    });
    return { cost, desc, steps };
  }, [chain]);

  const toggle = (id) => setActive((s) => ({ ...s, [id]: !s[id] }));

  // SVG geometry — concentric nested wrappers
  const W = 940;
  const H = 340;
  const cx = 250;
  const cy = 170;
  const layers = chain.length + 1; // base + decorators
  const maxR = 150;
  const baseR = 38;
  const ringStep = layers > 1 ? (maxR - baseR) / (layers - 1) : 0;

  return (
    <div className="dpv">
      <div className="dpv-head">
        <h3 className="dpv-title">Decorator — stack behavior by wrapping</h3>
        <p className="dpv-sub">
          Start with a base component, then wrap it in decorators. Each wrapper adds to the description and cost,
          delegating to the thing it wraps. Toggle decorators to grow or shrink the nested chain.
        </p>
      </div>

      <div className="dpv-controls">
        <span className="dpv-base-chip"><Coffee size={13} /> base: {BASE.label} (${BASE.cost.toFixed(2)})</span>
        <span className="dpv-spacer" aria-hidden="true" />
        <div className="dpv-toggles">
          {DECORATORS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`dpv-toggle ${active[d.id] ? 'is-on' : ''}`}
              onClick={() => toggle(d.id)}
              style={active[d.id] ? { borderColor: d.hue, color: d.hue } : undefined}
            >
              {d.label} +${d.cost.toFixed(2)}
            </button>
          ))}
        </div>
      </div>

      <div className="dpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dpv-svg" preserveAspectRatio="xMidYMid meet">
          {/* nested rings: outermost decorator first */}
          {chain.map((d, i) => {
            const ringIdx = chain.length - i; // outer rings = later wraps
            const r = baseR + ringIdx * ringStep;
            return (
              <g key={`ring-${d.id}`}>
                <circle className="dpv-ring" cx={cx} cy={cy} r={r} style={{ stroke: d.hue }} />
                <text className="dpv-ring-label" x={cx} y={cy - r + 16} style={{ fill: d.hue }}>{d.label}</text>
              </g>
            );
          })}
          <circle className="dpv-core" cx={cx} cy={cy} r={baseR} />
          <text className="dpv-core-label" x={cx} y={cy - 4}>{BASE.label}</text>
          <text className="dpv-core-cost" x={cx} y={cy + 14}>${BASE.cost.toFixed(2)}</text>

          {/* accumulation ledger on the right */}
          <text className="dpv-ledger-title" x={470} y={36}>wrapper chain (cost accumulates)</text>
          {computed.steps.map((s, i) => {
            const y = 56 + i * 40;
            const isBase = i === 0;
            const hue = isBase ? 'var(--accent)' : chain[i - 1].hue;
            return (
              <g key={`led-${i}`}>
                <rect className="dpv-led-row" x={470} y={y} width={420} height={32} rx={6} style={{ stroke: hue }} />
                <text className="dpv-led-step" x={484} y={y + 21} style={{ fill: hue }}>{isBase ? 'new' : 'wrap'}</text>
                <text className="dpv-led-label" x={538} y={y + 21}>{s.label}</text>
                <text className="dpv-led-add" x={742} y={y + 21}>+${s.cost.toFixed(2)}</text>
                <text className="dpv-led-run" x={876} y={y + 21} style={{ fill: hue }}>${s.running.toFixed(2)}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dpv-metrics">
        <div className="dpv-metric">
          <span className="dpv-metric-label">wrappers</span>
          <span className="dpv-metric-value is-sky">{chain.length}</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">description</span>
          <span className="dpv-metric-value">{computed.desc}</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">total cost</span>
          <span className="dpv-metric-value is-pink">${computed.cost.toFixed(2)}</span>
        </div>
      </div>

      <div className="dpv-narration">
        <span className="dpv-narration-label"><Layers size={12} /> trace</span>
        <span className="dpv-narration-body">
          {chain.length === 0
            ? `Just the bare ${BASE.label} at $${BASE.cost.toFixed(2)} — no decorators. Each wrapper you add nests around this core and forwards the cost() / describe() calls outward.`
            : `${chain.map((d) => d.label).join(' wraps ')} wraps ${BASE.label}. cost() bubbles inside-out: ${computed.steps.map((s) => `$${s.cost.toFixed(2)}`).join(' + ')} = $${computed.cost.toFixed(2)}. The core never changed — behavior was added by composition, not subclassing.`}
        </span>
      </div>
    </div>
  );
}
