import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './RenderPipelineViz.css';

// The browser rendering (critical) path:
//   HTML  -> DOM
//   CSS   -> CSSOM
//   DOM + CSSOM -> Render Tree
//   Layout (reflow) -> Paint -> Composite
//
// The key intuition the reader should leave with: not every visual change costs
// the whole pipeline. The change you make decides which stages re-run.
//   - geometry  (width/top/display)  -> Layout + Paint + Composite   (most expensive)
//   - paint     (color/background)   ->          Paint + Composite   (medium)
//   - composite (transform/opacity)  ->                  Composite    (cheapest, GPU)

const STAGES = [
  { key: 'dom', title: 'DOM', sub: 'parse HTML', accent: 'var(--hue-sky)' },
  { key: 'cssom', title: 'CSSOM', sub: 'parse CSS', accent: 'var(--hue-violet)' },
  { key: 'render', title: 'Render Tree', sub: 'DOM + CSSOM', accent: 'var(--hue-pink)' },
  { key: 'layout', title: 'Layout', sub: 'reflow / geometry', accent: 'var(--warning)' },
  { key: 'paint', title: 'Paint', sub: 'fill pixels', accent: 'var(--medium)' },
  { key: 'composite', title: 'Composite', sub: 'GPU layers', accent: 'var(--hue-mint)' },
];

// which stages re-run for each change type (during the "live change" phase)
const CHANGES = {
  geometry: {
    label: 'Geometry (width / top / display)',
    short: 'geometry',
    rerun: ['layout', 'paint', 'composite'],
    cost: 'expensive',
    costPct: 100,
    example: 'el.style.width = "320px"',
    narrate: 'A geometry change moves boxes, so the browser must re-run Layout, then Paint, then Composite. Full reflow — the most expensive path.',
  },
  paint: {
    label: 'Paint (color / background / shadow)',
    short: 'paint',
    rerun: ['paint', 'composite'],
    cost: 'medium',
    costPct: 60,
    example: 'el.style.color = "crimson"',
    narrate: 'A color change does not move anything, so Layout is skipped. Only Paint (re-fill pixels) and Composite run — medium cost.',
  },
  composite: {
    label: 'Transform / opacity',
    short: 'composite',
    rerun: ['composite'],
    cost: 'cheap',
    costPct: 20,
    example: 'el.style.transform = "translateX(40px)"',
    narrate: 'transform & opacity are composited on the GPU. Layout and Paint are both skipped — Composite only. The cheapest change you can make.',
  },
};

// a tiny DOM tree we "build" node by node during the parse phase
const DOM_NODES = [
  { id: 'html', label: 'html', x: 230, y: 56, parent: null },
  { id: 'body', label: 'body', x: 230, y: 110, parent: 'html' },
  { id: 'h1', label: 'h1', x: 130, y: 168, parent: 'body' },
  { id: 'p', label: 'p', x: 330, y: 168, parent: 'body' },
];

// CSS rules we "build" during CSSOM parse
const CSS_RULES = [
  'body { font: 16px; }',
  'h1 { color: navy; }',
  'p { margin: 8px; }',
];

function buildFrames(change) {
  const frames = [];
  const ch = CHANGES[change];

  const snap = (extra) => ({
    active: null,        // which stage box is lit
    domBuilt: 0,         // how many DOM nodes drawn
    cssBuilt: 0,         // how many CSS rules drawn
    merged: false,       // render tree merged?
    laidOut: false,      // layout boxes placed?
    painted: false,      // paint fill shown?
    composited: false,   // composite layers shown?
    phase: 'build',      // build | done-first | change
    rerun: [],           // stages re-running (highlighted) in change phase
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: 'A browser turns bytes into pixels through a fixed pipeline. Step through it on a tiny page: an h1 and a p with three CSS rules.',
  }));

  // DOM build
  for (let i = 1; i <= DOM_NODES.length; i += 1) {
    frames.push(snap({
      active: 'dom', domBuilt: i,
      note: i === 1
        ? 'HTML is parsed top to bottom into the DOM — a tree of nodes. The root <html> node appears first.'
        : `Parsing continues. <${DOM_NODES[i - 1].label}> is attached to its parent. The DOM tree grows node by node.`,
    }));
  }

  // CSSOM build
  for (let i = 1; i <= CSS_RULES.length; i += 1) {
    frames.push(snap({
      active: 'cssom', domBuilt: DOM_NODES.length, cssBuilt: i,
      note: i === 1
        ? 'In parallel, CSS is parsed into the CSSOM — the style rules, also as a tree. Selectors map to declarations.'
        : `Rule "${CSS_RULES[i - 1]}" is added to the CSSOM. Styles are not yet attached to any node.`,
    }));
  }

  // Render tree
  frames.push(snap({
    active: 'render', domBuilt: DOM_NODES.length, cssBuilt: CSS_RULES.length, merged: true,
    note: 'DOM + CSSOM merge into the Render Tree: only the nodes that will be drawn, each carrying its computed style. (display:none nodes are dropped here.)',
  }));

  // Layout
  frames.push(snap({
    active: 'layout', domBuilt: DOM_NODES.length, cssBuilt: CSS_RULES.length, merged: true, laidOut: true,
    note: 'Layout (a.k.a. reflow) computes the exact box geometry — x, y, width, height of every render-tree node, relative to the viewport.',
  }));

  // Paint
  frames.push(snap({
    active: 'paint', domBuilt: DOM_NODES.length, cssBuilt: CSS_RULES.length, merged: true, laidOut: true, painted: true,
    note: 'Paint fills in the pixels for each box: text, colors, borders, shadows — drawn into layers but not yet on screen.',
  }));

  // Composite
  frames.push(snap({
    active: 'composite', domBuilt: DOM_NODES.length, cssBuilt: CSS_RULES.length, merged: true, laidOut: true, painted: true, composited: true,
    phase: 'done-first',
    note: 'Composite assembles the painted layers (on the GPU) and draws the final frame to the screen. First paint is complete.',
  }));

  // ---- Live change phase: only the stages this change touches re-run ----
  frames.push(snap({
    domBuilt: DOM_NODES.length, cssBuilt: CSS_RULES.length, merged: true, laidOut: true, painted: true, composited: true,
    phase: 'change', rerun: [],
    note: `Now a script mutates the page: ${ch.example}. Which stages must re-run?`,
  }));

  ch.rerun.forEach((stageKey, i) => {
    frames.push(snap({
      domBuilt: DOM_NODES.length, cssBuilt: CSS_RULES.length, merged: true, laidOut: true, painted: true, composited: true,
      active: stageKey, phase: 'change', rerun: ch.rerun.slice(0, i + 1),
      note: `Re-run ${STAGES.find((s) => s.key === stageKey).title}.`,
    }));
  });

  const skipped = ['layout', 'paint', 'composite'].filter((k) => !ch.rerun.includes(k));
  const skipTitles = skipped.map((k) => STAGES.find((s) => s.key === k).title).join(' & ');
  frames.push(snap({
    domBuilt: DOM_NODES.length, cssBuilt: CSS_RULES.length, merged: true, laidOut: true, painted: true, composited: true,
    phase: 'change', rerun: ch.rerun,
    note: `${ch.short} change -> ${skipped.length ? `skip ${skipTitles} -> ` : ''}${ch.rerun.map((k) => STAGES.find((s) => s.key === k).title).join(' + ')} (${ch.cost}). ${ch.narrate}`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function RenderPipelineViz() {
  const [change, setChange] = useState('composite');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(change), [change]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);
  const ch = CHANGES[change];

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

  const pickChange = (key) => {
    setChange(key);
    setIsRunning(false);
    setStep(0);
  };

  // SVG geometry
  const W = 940;
  const H = 470;

  // pipeline stage row
  const stageY = 30;
  const stageH = 58;
  const stageGap = 12;
  const stageW = (W - 40 - stageGap * (STAGES.length - 1)) / STAGES.length;
  const stageX = (i) => 20 + i * (stageW + stageGap);

  // example-page panels
  const panelTop = 130;
  const panelH = 300;
  const panelGap = 16;
  const panelW = (W - 40 - panelGap * 2) / 3;
  const panelX = (i) => 20 + i * (panelW + panelGap);

  const reRunSet = new Set(current.rerun);
  const isChangePhase = current.phase === 'change';

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // box positions inside the "rendered page" panel — geometry change widens the bar
  const boxBaseW = 90;
  const movedW = change === 'geometry' && reRunSet.has('layout') ? 150 : boxBaseW;
  const movedX = change === 'composite' && reRunSet.has('composite') ? 40 : 0;
  const boxOpacity = change === 'composite' && reRunSet.has('composite') ? 0.55 : 1;
  const boxFill = change === 'paint' && reRunSet.has('paint') ? 'var(--hue-pink)' : 'var(--accent)';

  return (
    <div className="rpv">
      <div className="rpv-head">
        <h3 className="rpv-title">The browser rendering pipeline — what each change re-runs</h3>
        <p className="rpv-sub">
          Step a tiny page through HTML to pixels: DOM, CSSOM, Render Tree, Layout, Paint, Composite. Then pick a
          change type and watch which stages re-run — geometry forces a full reflow, color skips Layout, transform
          is Composite-only.
        </p>
      </div>

      <div className="rpv-controls">
        <div className="rpv-changes">
          <span className="rpv-input-label">change type</span>
          <div className="rpv-change-btns">
            {Object.entries(CHANGES).map(([key, c]) => (
              <button
                key={key}
                type="button"
                className={`rpv-chip ${change === key ? 'is-active' : ''}`}
                onClick={() => pickChange(key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="rpv-speed">
          <span className="rpv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rpv-speed-range"
            aria-label="Playback speed"
          />
          <span className="rpv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="rpv-buttons">
          <button
            type="button"
            className="rpv-btn rpv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="rpv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="rpv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="rpv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="rpv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="rpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rpv-svg" preserveAspectRatio="xMidYMid meet">
          {/* pipeline stage row */}
          {STAGES.map((s, i) => {
            const x = stageX(i);
            const lit = current.active === s.key;
            const rerunning = isChangePhase && reRunSet.has(s.key);
            const skipped = isChangePhase && ['layout', 'paint', 'composite'].includes(s.key) && !reRunSet.has(s.key);
            return (
              <g key={`stg-${s.key}`}>
                <rect
                  className={`rpv-stage-box ${lit ? 'is-lit' : ''} ${rerunning ? 'is-rerun' : ''} ${skipped ? 'is-skip' : ''}`}
                  x={x}
                  y={stageY}
                  width={stageW}
                  height={stageH}
                  rx={8}
                  style={(lit || rerunning) ? { stroke: s.accent } : undefined}
                />
                <rect x={x} y={stageY} width={stageW} height={4} rx={2} fill={s.accent} opacity={(lit || rerunning) ? 1 : 0.5} />
                <text className="rpv-stage-title" x={x + stageW / 2} y={stageY + 28}>{s.title}</text>
                <text className="rpv-stage-sub" x={x + stageW / 2} y={stageY + 44}>{s.sub}</text>
                {i < STAGES.length - 1 && (
                  <text className="rpv-stage-arrow" x={x + stageW + stageGap / 2} y={stageY + stageH / 2 + 5}>›</text>
                )}
                {skipped && (
                  <text className="rpv-skip-tag" x={x + stageW / 2} y={stageY + stageH + 14}>skipped</text>
                )}
                {rerunning && (
                  <text className="rpv-rerun-tag" x={x + stageW / 2} y={stageY + stageH + 14}>re-run</text>
                )}
              </g>
            );
          })}

          {/* Panel 1: DOM tree */}
          <g>
            <rect className={`rpv-panel ${current.active === 'dom' ? 'is-lit' : ''}`} x={panelX(0)} y={panelTop} width={panelW} height={panelH} rx={9}
              style={current.active === 'dom' ? { stroke: 'var(--hue-sky)' } : undefined} />
            <text className="rpv-panel-title" x={panelX(0) + 14} y={panelTop + 22}>DOM tree</text>
            {DOM_NODES.map((n, ni) => {
              if (ni >= current.domBuilt) return null;
              const px = panelX(0);
              const cx = px + 20 + (n.x - 100);
              const cy = panelTop + 30 + (n.y);
              const parent = n.parent ? DOM_NODES.find((p) => p.id === n.parent) : null;
              const showEdge = parent && DOM_NODES.indexOf(parent) < current.domBuilt;
              return (
                <g key={`dn-${n.id}`}>
                  {showEdge && (
                    <line className="rpv-edge"
                      x1={px + 20 + (parent.x - 100)} y1={panelTop + 30 + parent.y + 13}
                      x2={cx} y2={cy - 13} />
                  )}
                  <circle className="rpv-node" cx={cx} cy={cy} r={15} />
                  <text className="rpv-node-text" x={cx} y={cy + 4}>{n.label}</text>
                </g>
              );
            })}
          </g>

          {/* Panel 2: CSSOM rules */}
          <g>
            <rect className={`rpv-panel ${current.active === 'cssom' ? 'is-lit' : ''}`} x={panelX(1)} y={panelTop} width={panelW} height={panelH} rx={9}
              style={current.active === 'cssom' ? { stroke: 'var(--hue-violet)' } : undefined} />
            <text className="rpv-panel-title" x={panelX(1) + 14} y={panelTop + 22}>CSSOM rules</text>
            {CSS_RULES.map((r, ri) => {
              if (ri >= current.cssBuilt) return null;
              const ry = panelTop + 48 + ri * 40;
              return (
                <g key={`cr-${ri}`}>
                  <rect className="rpv-rule" x={panelX(1) + 14} y={ry} width={panelW - 28} height={30} rx={6} />
                  <text className="rpv-rule-text" x={panelX(1) + 24} y={ry + 20}>{r}</text>
                </g>
              );
            })}
            {current.merged && (
              <text className="rpv-merge-note" x={panelX(1) + panelW / 2} y={panelTop + panelH - 16}>
                + DOM = Render Tree
              </text>
            )}
          </g>

          {/* Panel 3: rendered page (layout/paint/composite) */}
          <g>
            <rect className={`rpv-panel ${['render', 'layout', 'paint', 'composite'].includes(current.active) ? 'is-lit' : ''}`}
              x={panelX(2)} y={panelTop} width={panelW} height={panelH} rx={9}
              style={['render', 'layout', 'paint', 'composite'].includes(current.active) ? { stroke: 'var(--hue-pink)' } : undefined} />
            <text className="rpv-panel-title" x={panelX(2) + 14} y={panelTop + 22}>rendered page</text>

            {!current.laidOut && (
              <text className="rpv-empty" x={panelX(2) + panelW / 2} y={panelTop + panelH / 2 + 4}>awaiting layout</text>
            )}

            {current.laidOut && (
              <g transform={`translate(${movedX}, 0)`} opacity={boxOpacity}>
                {/* h1 box */}
                <rect className={`rpv-laybox ${current.painted ? 'is-painted' : ''}`}
                  x={panelX(2) + 24} y={panelTop + 50} width={panelW - 48} height={40} rx={5}
                  style={current.painted ? { fill: change === 'paint' && reRunSet.has('paint') ? 'rgba(var(--accent-rgb), 0.15)' : undefined } : undefined} />
                <text className="rpv-laytext" x={panelX(2) + 36} y={panelTop + 74}
                  style={current.painted ? { fill: boxFill } : undefined}>h1: Title</text>

                {/* p box — its width reflows on a geometry change */}
                <rect className={`rpv-laybox ${current.painted ? 'is-painted' : ''}`}
                  x={panelX(2) + 24} y={panelTop + 110} width={movedW} height={70} rx={5} />
                <text className="rpv-laytext-dim" x={panelX(2) + 36} y={panelTop + 134}>p: paragraph</text>
                <text className="rpv-laytext-dim" x={panelX(2) + 36} y={panelTop + 152}>text content…</text>

                {current.composited && (
                  <text className="rpv-laybadge" x={panelX(2) + panelW / 2} y={panelTop + panelH - 16}>on screen</text>
                )}
              </g>
            )}
          </g>
        </svg>
      </div>

      <div className="rpv-metrics">
        <div className="rpv-metric">
          <span className="rpv-metric-label">current stage</span>
          <span className="rpv-metric-value">
            {current.active ? STAGES.find((s) => s.key === current.active).title : '—'}
          </span>
        </div>
        <div className="rpv-metric">
          <span className="rpv-metric-label">change type</span>
          <span className="rpv-metric-value">{ch.short}</span>
        </div>
        <div className="rpv-metric">
          <span className="rpv-metric-label">stages re-run</span>
          <span className="rpv-metric-value is-rerun">
            {isChangePhase && current.rerun.length
              ? current.rerun.map((k) => STAGES.find((s) => s.key === k).title).join(' + ')
              : '—'}
          </span>
        </div>
        <div className="rpv-metric">
          <span className="rpv-metric-label">relative cost</span>
          <span className={`rpv-metric-value rpv-cost-${ch.cost}`}>{ch.cost}</span>
          <div className="rpv-cost-bar">
            <div className={`rpv-cost-fill rpv-cost-${ch.cost}`} style={{ width: `${ch.costPct}%` }} />
          </div>
        </div>
      </div>

      <div className="rpv-narration">
        <span className="rpv-narration-label">trace</span>
        <span className="rpv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
