import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Triangle, FunctionSquare, Code2,
} from 'lucide-react';
import './VisitorPatternViz.css';

const PI = Math.PI;

const NODES = [
  { kind: 'circle', label: 'Circle', r: 3, accent: 'var(--hue-sky)' },
  { kind: 'rect', label: 'Rectangle', w: 4, h: 2, accent: 'var(--hue-mint)' },
  { kind: 'triangle', label: 'Triangle', b: 6, h: 4, accent: 'var(--hue-violet)' },
  { kind: 'circle', label: 'Circle', r: 2, accent: 'var(--hue-sky)' },
  { kind: 'rect', label: 'Rectangle', w: 3, h: 5, accent: 'var(--hue-mint)' },
];

const VISITORS = {
  area: {
    label: 'AreaVisitor',
    unit: 'area',
    methods: {
      circle: 'visitCircle → π·r²',
      rect: 'visitRectangle → w·h',
      triangle: 'visitTriangle → ½·b·h',
    },
    value: (n) => {
      if (n.kind === 'circle') return PI * n.r * n.r;
      if (n.kind === 'rect') return n.w * n.h;
      return 0.5 * n.b * n.h;
    },
    fmt: (n) => {
      if (n.kind === 'circle') return `π·${n.r}² = ${(PI * n.r * n.r).toFixed(2)}`;
      if (n.kind === 'rect') return `${n.w}·${n.h} = ${n.w * n.h}`;
      return `½·${n.b}·${n.h} = ${0.5 * n.b * n.h}`;
    },
    combine: (acc, v) => acc + v,
    init: 0,
    show: (acc) => acc.toFixed(2),
  },
  perimeter: {
    label: 'PerimeterVisitor',
    unit: 'perimeter',
    methods: {
      circle: 'visitCircle → 2·π·r',
      rect: 'visitRectangle → 2(w+h)',
      triangle: 'visitTriangle → 3 sides',
    },
    value: (n) => {
      if (n.kind === 'circle') return 2 * PI * n.r;
      if (n.kind === 'rect') return 2 * (n.w + n.h);
      const side = Math.hypot(n.b / 2, n.h);
      return n.b + 2 * side;
    },
    fmt: (n) => {
      if (n.kind === 'circle') return `2π·${n.r} = ${(2 * PI * n.r).toFixed(2)}`;
      if (n.kind === 'rect') return `2(${n.w}+${n.h}) = ${2 * (n.w + n.h)}`;
      const side = Math.hypot(n.b / 2, n.h);
      return `${n.b}+2·${side.toFixed(2)} = ${(n.b + 2 * side).toFixed(2)}`;
    },
    combine: (acc, v) => acc + v,
    init: 0,
    show: (acc) => acc.toFixed(2),
  },
  export: {
    label: 'ExportVisitor',
    unit: 'json',
    methods: {
      circle: 'visitCircle → {"t":"circle"…}',
      rect: 'visitRectangle → {"t":"rect"…}',
      triangle: 'visitTriangle → {"t":"tri"…}',
    },
    value: (n) => {
      if (n.kind === 'circle') return `{"t":"circle","r":${n.r}}`;
      if (n.kind === 'rect') return `{"t":"rect","w":${n.w},"h":${n.h}}`;
      return `{"t":"tri","b":${n.b},"h":${n.h}}`;
    },
    fmt: (n) => {
      if (n.kind === 'circle') return `{"t":"circle","r":${n.r}}`;
      if (n.kind === 'rect') return `{"t":"rect","w":${n.w},"h":${n.h}}`;
      return `{"t":"tri","b":${n.b},"h":${n.h}}`;
    },
    combine: (acc, v) => [...acc, v],
    init: [],
    show: (acc) => `[${acc.join(', ')}]`,
  },
};

function methodKey(kind) {
  return kind === 'triangle' ? 'triangle' : kind;
}

function buildFrames(visitorKey) {
  const v = VISITORS[visitorKey];
  const frames = [];
  let acc = v.init;

  const snap = (extra) => ({
    visitorKey,
    nodeIndex: -1,
    dispatched: null,
    perNode: '',
    accShow: v.show(acc),
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `${v.label} selected. The object structure is fixed — the visitor walks it node by node. Each node calls accept(visitor), which dispatches back to the right visit() method (double-dispatch).`,
  }));

  for (let i = 0; i < NODES.length; i += 1) {
    const n = NODES[i];
    const mk = methodKey(n.kind);
    frames.push(snap({
      nodeIndex: i,
      dispatched: mk,
      perNode: '',
      note: `Node ${i + 1} is a ${n.label}. It calls accept(visitor), which dispatches to ${v.methods[mk].split(' →')[0]} — the node's type picks the method, the visitor supplies the behaviour.`,
    }));
    const val = v.value(n);
    acc = v.combine(acc, val);
    frames.push(snap({
      nodeIndex: i,
      dispatched: mk,
      perNode: v.fmt(n),
      accShow: v.show(acc),
      note: `${v.methods[mk].split(' →')[0]} runs: ${v.fmt(n)}. The result folds into the accumulator. Same node, different visitor would compute something else here.`,
    }));
  }

  frames.push(snap({
    nodeIndex: -1,
    dispatched: null,
    accShow: v.show(acc),
    note: `Walk complete. ${v.label} produced ${v.unit} = ${v.show(acc)}. Swapping the visitor reruns the identical traversal with a different operation per node type — no node class changed.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function VisitorPatternViz() {
  const [visitorKey, setVisitorKey] = useState('area');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(visitorKey), [visitorKey]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);
  const visitor = VISITORS[visitorKey];

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const pickVisitor = (key) => {
    setIsRunning(false);
    setStep(0);
    setVisitorKey(key);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const W = 940;
  const H = 360;
  const cardGap = 12;
  const cardW = 150;
  const nodeTop = 70;
  const nodeH = 110;
  const structW = NODES.length * cardW + (NODES.length - 1) * cardGap;
  const structX = 24;
  const visitorX = structX + structW + 28;
  const visitorW = W - visitorX - 24;

  const renderGlyph = (n, cx, cy, active) => {
    const stroke = active ? n.accent : 'var(--border)';
    if (n.kind === 'circle') {
      return <circle className="vpv-glyph" cx={cx} cy={cy} r={16} style={{ stroke }} />;
    }
    if (n.kind === 'rect') {
      const w = 34;
      const h = 22;
      return <rect className="vpv-glyph" x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={2} style={{ stroke }} />;
    }
    return (
      <path
        className="vpv-glyph"
        d={`M${cx} ${cy - 16} L ${cx + 18} ${cy + 14} L ${cx - 18} ${cy + 14} Z`}
        style={{ stroke }}
      />
    );
  };

  const methodEntries = ['circle', 'rect', 'triangle'];

  return (
    <div className="vpv">
      <div className="vpv-head">
        <h3 className="vpv-title">Visitor — one traversal, swappable operations via double-dispatch</h3>
        <p className="vpv-sub">
          A fixed list of shapes. Pick a visitor and walk it: each node&apos;s type selects the visit() method, the
          visitor supplies the behaviour. Change the visitor, not the shapes.
        </p>
      </div>

      <div className="vpv-controls">
        <div className="vpv-toggle-group">
          <span className="vpv-input-label">visitor</span>
          <div className="vpv-seg" role="tablist" aria-label="Visitor">
            {Object.entries(VISITORS).map(([key, v]) => (
              <button
                key={key}
                type="button"
                className={`vpv-seg-btn ${visitorKey === key ? 'is-on' : ''}`}
                onClick={() => pickVisitor(key)}
                aria-pressed={visitorKey === key}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <label className="vpv-slider">
          <span className="vpv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="vpv-range"
            aria-label="Playback speed"
          />
          <span className="vpv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="vpv-spacer" aria-hidden="true" />

        <div className="vpv-buttons">
          <button
            type="button"
            className="vpv-btn vpv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((r) => !r);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="vpv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="vpv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="vpv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="vpv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="vpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="vpv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="vpv-section-label" x={structX} y={nodeTop - 18}>object structure (fixed)</text>
          <text className="vpv-section-label" x={visitorX} y={nodeTop - 18}>{visitor.label}</text>

          {NODES.map((n, i) => {
            const x = structX + i * (cardW + cardGap);
            const active = current.nodeIndex === i;
            const cx = x + cardW / 2;
            return (
              <g key={`node-${i}`}>
                <rect
                  className={`vpv-node ${active ? 'is-active' : ''}`}
                  x={x}
                  y={nodeTop}
                  width={cardW}
                  height={nodeH}
                  rx={9}
                  style={active ? { stroke: n.accent } : undefined}
                />
                <rect x={x} y={nodeTop} width={cardW} height={5} rx={2.5} fill={n.accent} opacity={active ? 1 : 0.5} />
                <text className="vpv-node-title" x={cx} y={nodeTop + 24}>{n.label}</text>
                {renderGlyph(n, cx, nodeTop + 58, active)}
                <text className="vpv-node-params" x={cx} y={nodeTop + nodeH - 12}>
                  {n.kind === 'circle' && `r = ${n.r}`}
                  {n.kind === 'rect' && `${n.w} × ${n.h}`}
                  {n.kind === 'triangle' && `b=${n.b} h=${n.h}`}
                </text>
              </g>
            );
          })}

          <rect
            className="vpv-visitor-card"
            x={visitorX}
            y={nodeTop}
            width={visitorW}
            height={nodeH}
            rx={9}
          />
          <g transform={`translate(${visitorX + 14}, ${nodeTop + 14})`}>
            {visitorKey === 'export'
              ? <Code2 size={15} color="var(--accent)" />
              : <FunctionSquare size={15} color="var(--accent)" />}
          </g>
          {methodEntries.map((mk, mi) => {
            const on = current.dispatched === mk;
            return (
              <text
                key={`m-${mk}`}
                className={`vpv-method ${on ? 'is-on' : ''}`}
                x={visitorX + 14}
                y={nodeTop + 40 + mi * 22}
              >
                {visitor.methods[mk]}
              </text>
            );
          })}

          <text className="vpv-section-label" x={structX} y={nodeTop + nodeH + 44}>accumulator · {visitor.unit}</text>
          <rect
            className="vpv-acc"
            x={structX}
            y={nodeTop + nodeH + 54}
            width={W - structX - 24}
            height={56}
            rx={9}
          />
          <text className="vpv-acc-pernode" x={structX + 16} y={nodeTop + nodeH + 80}>
            {current.perNode ? `last visit: ${current.perNode}` : 'walk a node to compute its contribution'}
          </text>
          <text className="vpv-acc-value" x={structX + 16} y={nodeTop + nodeH + 100}>
            result = {current.accShow}
          </text>
        </svg>
      </div>

      <div className="vpv-metrics">
        <div className="vpv-metric">
          <span className="vpv-metric-label">current node</span>
          <span className="vpv-metric-value">
            {current.nodeIndex >= 0 ? `${current.nodeIndex + 1} · ${NODES[current.nodeIndex].label}` : '—'}
          </span>
        </div>
        <div className="vpv-metric">
          <span className="vpv-metric-label">dispatched</span>
          <span className="vpv-metric-value is-accent">
            {current.dispatched ? visitor.methods[current.dispatched].split(' →')[0] : '—'}
          </span>
        </div>
        <div className="vpv-metric">
          <span className="vpv-metric-label">per-node</span>
          <span className="vpv-metric-value">{current.perNode || '—'}</span>
        </div>
        <div className="vpv-metric">
          <span className="vpv-metric-label">{visitor.unit}</span>
          <span className="vpv-metric-value is-good">{current.accShow}</span>
        </div>
      </div>

      <div className="vpv-narration">
        <span className="vpv-narration-label">
          {visitorKey === 'export' ? <Code2 size={13} /> : <Triangle size={13} />} trace
        </span>
        <span className="vpv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
