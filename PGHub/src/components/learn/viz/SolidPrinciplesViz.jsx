import React, { useMemo, useState } from 'react';
import { ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';
import './SolidPrinciplesViz.css';

// The five SOLID principles, each shown as a vertical class-diagram pair:
// the "before" graph violates the rule, the "after" graph fixes it. Boxes are
// classes/interfaces, downward arrows are dependency direction (A -> B means
// "A depends on B"). Everything is a fixed preset — no randomness.

// Each node: { id, label, kind: 'class'|'iface', col, row, tag }
// Each edge: { from, to, kind: 'dep'|'impl', label? }
// Layout uses a coarse (col,row) grid mapped to SVG coords below.
const HUES = {
  violet: 'var(--hue-violet)',
  sky: 'var(--hue-sky)',
  pink: 'var(--hue-pink)',
  mint: 'var(--hue-mint)',
};

const PRINCIPLES = [
  {
    key: 'S',
    name: 'Single Responsibility',
    rule: 'A class should have exactly one reason to change.',
    example: 'Report knows formatting, persistence, and email — three jobs in one box.',
    fix: 'Split into Report (data), Formatter, and Mailer — each changes for one reason.',
    before: {
      nodes: [
        { id: 'god', label: 'Report', sub: 'render() · save() · email()', col: 1, row: 0, tag: 'pink' },
      ],
      edges: [],
      note: '1 class · 3 reasons to change',
    },
    after: {
      nodes: [
        { id: 'rep', label: 'Report', sub: 'data only', col: 1, row: 0, tag: 'mint' },
        { id: 'fmt', label: 'Formatter', sub: 'render()', col: 0, row: 1, tag: 'sky' },
        { id: 'mail', label: 'Mailer', sub: 'email()', col: 2, row: 1, tag: 'violet' },
      ],
      edges: [
        { from: 'fmt', to: 'rep', kind: 'dep' },
        { from: 'mail', to: 'rep', kind: 'dep' },
      ],
      note: '3 classes · 1 reason each',
    },
  },
  {
    key: 'O',
    name: 'Open / Closed',
    rule: 'Open for extension, closed for modification.',
    example: 'AreaCalc has a switch over shape types — every new shape edits this class.',
    fix: 'Each shape implements area(); AreaCalc calls the interface and never changes.',
    before: {
      nodes: [
        { id: 'calc', label: 'AreaCalc', sub: 'switch(type){…}', col: 1, row: 0, tag: 'pink' },
        { id: 'sq', label: 'Square', sub: 'data', col: 0, row: 1, tag: 'sky' },
        { id: 'ci', label: 'Circle', sub: 'data', col: 2, row: 1, tag: 'sky' },
      ],
      edges: [
        { from: 'calc', to: 'sq', kind: 'dep' },
        { from: 'calc', to: 'ci', kind: 'dep' },
      ],
      note: 'new shape → edit AreaCalc',
    },
    after: {
      nodes: [
        { id: 'calc', label: 'AreaCalc', sub: 'sum(s.area())', col: 1, row: 0, tag: 'mint' },
        { id: 'shape', label: 'Shape', sub: 'area()', col: 1, row: 1, tag: 'violet', iface: true },
        { id: 'sq', label: 'Square', sub: 'area()', col: 0, row: 2, tag: 'sky' },
        { id: 'ci', label: 'Circle', sub: 'area()', col: 2, row: 2, tag: 'sky' },
      ],
      edges: [
        { from: 'calc', to: 'shape', kind: 'dep' },
        { from: 'sq', to: 'shape', kind: 'impl' },
        { from: 'ci', to: 'shape', kind: 'impl' },
      ],
      note: 'new shape → implement Shape',
    },
  },
  {
    key: 'L',
    name: 'Liskov Substitution',
    rule: 'A subtype must honor its base type’s contract.',
    example: 'Square extends Rectangle but breaks setWidth/setHeight — substituting it fails.',
    fix: 'Drop the false is-a; both implement Shape with their own valid area().',
    before: {
      nodes: [
        { id: 'rect', label: 'Rectangle', sub: 'setW · setH', col: 1, row: 0, tag: 'sky' },
        { id: 'sq', label: 'Square', sub: 'breaks setW/setH', col: 1, row: 1, tag: 'pink' },
      ],
      edges: [
        { from: 'sq', to: 'rect', kind: 'impl', label: 'extends ✗' },
      ],
      note: 'Square ⊄ Rectangle contract',
    },
    after: {
      nodes: [
        { id: 'shape', label: 'Shape', sub: 'area()', col: 1, row: 0, tag: 'violet', iface: true },
        { id: 'rect', label: 'Rectangle', sub: 'area()', col: 0, row: 1, tag: 'mint' },
        { id: 'sq', label: 'Square', sub: 'area()', col: 2, row: 1, tag: 'mint' },
      ],
      edges: [
        { from: 'rect', to: 'shape', kind: 'impl' },
        { from: 'sq', to: 'shape', kind: 'impl' },
      ],
      note: 'each substitutable for Shape',
    },
  },
  {
    key: 'I',
    name: 'Interface Segregation',
    rule: 'No client should depend on methods it never uses.',
    example: 'Robot implements Worker but is forced to define eat() it doesn’t need.',
    fix: 'Split Worker into Workable + Feedable; Robot implements only Workable.',
    before: {
      nodes: [
        { id: 'worker', label: 'Worker', sub: 'work() · eat()', col: 1, row: 0, tag: 'pink', iface: true },
        { id: 'human', label: 'Human', sub: 'work · eat', col: 0, row: 1, tag: 'sky' },
        { id: 'robot', label: 'Robot', sub: 'eat() = stub ✗', col: 2, row: 1, tag: 'pink' },
      ],
      edges: [
        { from: 'human', to: 'worker', kind: 'impl' },
        { from: 'robot', to: 'worker', kind: 'impl' },
      ],
      note: 'Robot forced to stub eat()',
    },
    after: {
      nodes: [
        { id: 'workable', label: 'Workable', sub: 'work()', col: 0, row: 0, tag: 'violet', iface: true },
        { id: 'feedable', label: 'Feedable', sub: 'eat()', col: 2, row: 0, tag: 'violet', iface: true },
        { id: 'human', label: 'Human', sub: 'work · eat', col: 0, row: 1, tag: 'mint' },
        { id: 'robot', label: 'Robot', sub: 'work', col: 2, row: 1, tag: 'mint' },
      ],
      edges: [
        { from: 'human', to: 'workable', kind: 'impl' },
        { from: 'human', to: 'feedable', kind: 'impl' },
        { from: 'robot', to: 'workable', kind: 'impl' },
      ],
      note: 'Robot needs only Workable',
    },
  },
  {
    key: 'D',
    name: 'Dependency Inversion',
    rule: 'Depend on abstractions, not concretions.',
    example: 'OrderService news up MySQLDb directly — high-level glued to a concrete driver.',
    fix: 'OrderService depends on a Store interface; MySQLDb implements it.',
    before: {
      nodes: [
        { id: 'svc', label: 'OrderService', sub: 'new MySQLDb()', col: 1, row: 0, tag: 'pink' },
        { id: 'db', label: 'MySQLDb', sub: 'concrete', col: 1, row: 1, tag: 'sky' },
      ],
      edges: [
        { from: 'svc', to: 'db', kind: 'dep' },
      ],
      note: 'high-level → concrete driver',
    },
    after: {
      nodes: [
        { id: 'svc', label: 'OrderService', sub: 'store.save()', col: 1, row: 0, tag: 'mint' },
        { id: 'store', label: 'Store', sub: 'save()', col: 1, row: 1, tag: 'violet', iface: true },
        { id: 'db', label: 'MySQLDb', sub: 'save()', col: 1, row: 2, tag: 'sky' },
      ],
      edges: [
        { from: 'svc', to: 'store', kind: 'dep' },
        { from: 'db', to: 'store', kind: 'impl' },
      ],
      note: 'both depend on Store',
    },
  },
];

export default function SolidPrinciplesViz() {
  const [activeKey, setActiveKey] = useState('S');
  const [showFix, setShowFix] = useState(false);

  const principle = useMemo(
    () => PRINCIPLES.find((p) => p.key === activeKey),
    [activeKey],
  );

  const graph = showFix ? principle.after : principle.before;

  const reset = () => {
    setActiveKey('S');
    setShowFix(false);
  };

  // SVG geometry — three logical columns, rows stack downward (vertical flow).
  const W = 940;
  const H = 470;
  const cols = 3;
  const colW = (W - 80) / cols;
  const boxW = 200;
  const boxH = 72;
  const rowH = 130;
  const top = 40;

  const nodeX = (col) => 40 + col * colW + (colW - boxW) / 2;
  const nodeY = (row) => top + row * rowH;
  const center = (n) => ({ x: nodeX(n.col) + boxW / 2, y: nodeY(n.row) + boxH / 2 });

  const nodeById = (id) => graph.nodes.find((n) => n.id === id);

  return (
    <div className="spv">
      <div className="spv-head">
        <h3 className="spv-title">SOLID — five rules that keep classes changeable</h3>
        <p className="spv-sub">
          Pick a principle, then toggle the before/after. Boxes are classes or interfaces; a downward arrow
          means the upper box depends on the lower one — the fix always points dependencies at an abstraction.
        </p>
      </div>

      <div className="spv-controls">
        <div className="spv-tabs">
          {PRINCIPLES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`spv-tab ${activeKey === p.key ? 'is-active' : ''}`}
              onClick={() => { setActiveKey(p.key); setShowFix(false); }}
              title={p.name}
            >
              <span className="spv-tab-letter">{p.key}</span>
              <span className="spv-tab-name">{p.name}</span>
            </button>
          ))}
        </div>

        <span className="spv-spacer" aria-hidden="true" />

        <button
          type="button"
          className={`spv-btn ${showFix ? 'spv-btn-primary' : ''}`}
          onClick={() => setShowFix((v) => !v)}
        >
          {showFix ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
          {showFix ? 'After (fixed)' : 'Before (violation)'}
        </button>
        <button type="button" className="spv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="spv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="spv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="spv-arrow-dep"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="spv-arrowhead" />
            </marker>
            <marker
              id="spv-arrow-impl"
              viewBox="0 0 12 12"
              refX="11"
              refY="6"
              markerWidth="9"
              markerHeight="9"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L12,6 L0,12 z" className="spv-arrowhead-impl" />
            </marker>
          </defs>

          {/* state banner */}
          <g transform={`translate(40, ${H - 26})`}>
            <circle cx="6" cy="-4" r="5" className={`spv-state-dot ${showFix ? 'is-fix' : 'is-bad'}`} />
            <text className="spv-state-text" x="20" y="0">
              {showFix ? `Fixed — ${graph.note}` : `Violation — ${graph.note}`}
            </text>
          </g>

          {/* edges first so boxes sit on top */}
          {graph.edges.map((e, i) => {
            const a = nodeById(e.from);
            const b = nodeById(e.to);
            if (!a || !b) return null;
            const ca = center(a);
            const cb = center(b);
            // anchor at box borders along the vertical-ish run
            const x1 = ca.x;
            const y1 = nodeY(a.row) + (b.row > a.row ? boxH : 0);
            const x2 = cb.x;
            const y2 = nodeY(b.row) + (b.row > a.row ? 0 : boxH);
            const midY = (y1 + y2) / 2;
            const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
            const marker = e.kind === 'impl' ? 'spv-arrow-impl' : 'spv-arrow-dep';
            return (
              <g key={`e-${i}`}>
                <path
                  d={path}
                  className={`spv-edge ${e.kind === 'impl' ? 'is-impl' : ''}`}
                  markerEnd={`url(#${marker})`}
                />
                {e.label && (
                  <text className="spv-edge-label" x={(x1 + x2) / 2} y={midY - 4}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {graph.nodes.map((n) => {
            const x = nodeX(n.col);
            const y = nodeY(n.row);
            const tag = HUES[n.tag];
            return (
              <g key={n.id}>
                <rect
                  className={`spv-box ${n.iface ? 'is-iface' : ''}`}
                  x={x}
                  y={y}
                  width={boxW}
                  height={boxH}
                  rx={10}
                  style={{ stroke: tag }}
                />
                <rect x={x} y={y} width={boxW} height={6} rx={3} fill={tag} />
                {n.iface && (
                  <text className="spv-box-stereotype" x={x + boxW / 2} y={y + 22}>
                    «interface»
                  </text>
                )}
                <text
                  className="spv-box-label"
                  x={x + boxW / 2}
                  y={y + (n.iface ? 42 : 34)}
                  style={{ fill: tag }}
                >
                  {n.label}
                </text>
                <text className="spv-box-sub" x={x + boxW / 2} y={y + (n.iface ? 60 : 54)}>
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="spv-metrics">
        <div className="spv-metric">
          <span className="spv-metric-label">principle</span>
          <span className="spv-metric-value">{principle.key} — {principle.name}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">the rule</span>
          <span className="spv-metric-value is-rule">{principle.rule}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">{showFix ? 'the fix' : 'the smell'}</span>
          <span className={`spv-metric-value ${showFix ? 'is-fix' : 'is-bad'}`}>
            {showFix ? principle.fix : principle.example}
          </span>
        </div>
      </div>

      <div className="spv-narration">
        <span className="spv-narration-label">why it matters</span>
        <span className="spv-narration-body">
          Every SOLID rule trades a brittle direct dependency for a stable one pointed at an abstraction.
          {showFix
            ? ` Here, ${principle.name} is satisfied: the boxes depend on small, stable interfaces, so a new requirement adds a class instead of editing existing, tested code.`
            : ` Here, ${principle.name} is broken: a change to one concern forces edits across boxes that should be independent — exactly the coupling that makes code expensive to grow. Toggle to After to see the repair.`}
        </span>
      </div>
    </div>
  );
}
