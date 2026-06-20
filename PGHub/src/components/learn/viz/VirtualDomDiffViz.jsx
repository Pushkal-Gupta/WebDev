import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  GitCompare, Plus, Minus, Pencil, Check, FileCode2, Layers,
} from 'lucide-react';
import './VirtualDomDiffViz.css';

// Virtual DOM diff / reconcile — an OLD vdom tree vs a NEW vdom tree.
// The diff walks both trees position-by-position and classifies each node:
//   UNCHANGED — identical type, props, and text → skip, no DOM touch
//   CHANGED   — same node, but text or a prop differs → patch IN PLACE
//   ADDED     — present in NEW, absent in OLD → insert a real DOM node
//   REMOVED   — present in OLD, absent in NEW → delete the real DOM node
// The walk accumulates a minimal PATCH LIST. Only the changed nodes are then
// applied to the real DOM; every unchanged node stays untouched — that skip
// is the whole win over re-rendering the page from scratch.
//
// Everything is deterministic: each preset hardcodes a small old/new tree and
// the diff is computed by id, never by Math.random.

// Node ids are stable across a preset's old/new tree. A node living in old but
// not new is REMOVED; in new but not old is ADDED; in both but differing text
// or props is CHANGED; otherwise UNCHANGED.
const PRESETS = [
  {
    key: 'text',
    label: 'change text',
    icon: 'pencil',
    blurb: 'Edit one leaf’s text — a single in-place patch.',
    // a small card: root > [title, body, footer]
    old: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '3 unread', props: '' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta"' },
    ],
    new: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '5 unread', props: '' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta"' },
    ],
  },
  {
    key: 'prop',
    label: 'change prop',
    icon: 'pencil',
    blurb: 'Flip an attribute — patch the prop, keep the node.',
    old: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '3 unread', props: '' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta"' },
    ],
    new: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '3 unread', props: '' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta" disabled' },
    ],
  },
  {
    key: 'add',
    label: 'add a node',
    icon: 'plus',
    blurb: 'Insert one child — insert a node, touch nothing else.',
    old: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '3 unread', props: '' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta"' },
    ],
    new: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '3 unread', props: '' },
      { id: 'badge', tag: 'span.new', depth: 1, text: 'NEW', props: 'class="badge"' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta"' },
    ],
  },
  {
    key: 'remove',
    label: 'remove a node',
    icon: 'minus',
    blurb: 'Drop one child — delete a node, touch nothing else.',
    old: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '3 unread', props: '' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta"' },
    ],
    new: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta"' },
    ],
  },
  {
    key: 'mixed',
    label: 'mixed edit',
    icon: 'pencil',
    blurb: 'Text change, an add, and a remove in one pass.',
    old: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '3 unread', props: '' },
      { id: 'btn', tag: 'button', depth: 1, text: 'Open', props: 'class="cta"' },
    ],
    new: [
      { id: 'card', tag: 'div.card', depth: 0, text: '', props: 'class="card"' },
      { id: 'title', tag: 'h2', depth: 1, text: 'Inbox', props: '' },
      { id: 'count', tag: 'span', depth: 1, text: '7 unread', props: '' },
      { id: 'badge', tag: 'span.new', depth: 1, text: 'NEW', props: 'class="badge"' },
    ],
  },
];

// Build the diff plan: a position-ordered list of node steps. We walk by id, in
// the union order that the reconciler visits — old order first, with added nodes
// slotted where they appear in the new tree. Each step is a verdict the stepper
// reveals one at a time.
function buildDiff(preset) {
  const oldById = Object.fromEntries(preset.old.map((n) => [n.id, n]));
  const newById = Object.fromEntries(preset.new.map((n) => [n.id, n]));

  // Visit order: walk the NEW tree (so inserts appear in place), then append any
  // OLD-only nodes (removals) right after where they used to sit.
  const order = [];
  const seen = new Set();
  preset.new.forEach((n, i) => {
    // emit any old node that sat before this new node and is now gone
    const oldIdx = preset.old.findIndex((o) => o.id === n.id);
    if (oldIdx > 0) {
      preset.old.slice(0, oldIdx).forEach((o) => {
        if (!newById[o.id] && !seen.has(o.id)) {
          order.push(o.id);
          seen.add(o.id);
        }
      });
    }
    if (!seen.has(n.id)) {
      order.push(n.id);
      seen.add(n.id);
    }
    void i;
  });
  // trailing old-only nodes
  preset.old.forEach((o) => {
    if (!newById[o.id] && !seen.has(o.id)) {
      order.push(o.id);
      seen.add(o.id);
    }
  });

  const steps = order.map((id) => {
    const o = oldById[id];
    const n = newById[id];
    let verdict;
    let detail;
    if (o && !n) {
      verdict = 'removed';
      detail = `removeChild(<${o.tag}>)`;
    } else if (!o && n) {
      verdict = 'added';
      detail = `insertBefore(<${n.tag}>)`;
    } else if (o.text !== n.text) {
      verdict = 'changed';
      detail = `setText("${o.text}" → "${n.text}")`;
    } else if (o.props !== n.props) {
      verdict = 'changed';
      detail = `setProps(${o.props || '—'} → ${n.props || '—'})`;
    } else {
      verdict = 'unchanged';
      detail = 'identical — skip';
    }
    const label = (n || o).tag;
    return { id, verdict, detail, label };
  });

  const counts = steps.reduce(
    (acc, s) => { acc[s.verdict] += 1; return acc; },
    { unchanged: 0, changed: 0, added: 0, removed: 0 },
  );
  return { steps, counts };
}

const VERDICT_NOTE = {
  unchanged: (label) => `<${label}> has the same type, text, and props in both trees. The diff records nothing and the real DOM node is left exactly as it was — no work done here.`,
  changed: (label) => `<${label}> is the same node, but its text or a prop differs. The diff queues an in-place patch — the existing DOM node is updated, not replaced.`,
  added: (label) => `<${label}> appears in the new tree but not the old one. The diff queues an insert — one fresh DOM node is created and slotted into place.`,
  removed: (label) => `<${label}> was in the old tree but is gone from the new one. The diff queues a delete — that real DOM node is removed.`,
};

const ICONS = { pencil: Pencil, plus: Plus, minus: Minus };

export default function VirtualDomDiffViz() {
  const [presetKey, setPresetKey] = useState(PRESETS[0].key);
  const [step, setStep] = useState(0); // 0 = nothing diffed; steps[0..n-1]; n = patches applied
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const preset = useMemo(
    () => PRESETS.find((p) => p.key === presetKey) || PRESETS[0],
    [presetKey],
  );
  const { steps, counts } = useMemo(() => buildDiff(preset), [preset]);

  // total stepper positions: one per diff step + one final "apply patches" frame
  const totalSteps = steps.length + 1;
  const appliedStep = totalSteps - 1; // index where patches hit the real DOM
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1700 / Math.max(speed, 0.1));

  // how many diff steps have been classified so far
  const classified = Math.min(step, steps.length);
  const applied = step >= appliedStep;

  // verdict of each node id revealed so far (id -> verdict), for tree colouring
  const verdictById = useMemo(() => {
    const m = {};
    for (let i = 0; i < classified; i += 1) m[steps[i].id] = steps[i].verdict;
    return m;
  }, [classified, steps]);

  // running patch list (the changed/added/removed steps seen so far)
  const patchList = useMemo(
    () => steps.slice(0, classified).filter((s) => s.verdict !== 'unchanged'),
    [classified, steps],
  );

  const curStep = step < steps.length ? steps[step] : null;

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(
      () => setStep((s) => Math.min(s + 1, totalSteps - 1)),
      delay,
    );
    return () => {
      if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => { if (runTimer.current) clearTimeout(runTimer.current); }, []);

  const reset = () => { setIsRunning(false); setStep(0); };

  const pickPreset = (key) => {
    setIsRunning(false);
    if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; }
    setStep(0);
    setPresetKey(key);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ---- live readouts ----
  const nodesCompared = classified;
  const patchesGenerated = applied
    ? counts.changed + counts.added + counts.removed
    : patchList.length;
  const nodesUntouched = applied
    ? counts.unchanged
    : patchList.length === 0
      ? classified
      : steps.slice(0, classified).filter((s) => s.verdict === 'unchanged').length;

  // narration
  let note;
  let tone = 'flow';
  if (step === 0) {
    note = `Pick an edit and step the diff. It walks the old and new trees together, classifying each node as unchanged, changed, added, or removed — building a minimal patch list before touching the real DOM.`;
    tone = 'ready';
  } else if (curStep) {
    note = VERDICT_NOTE[curStep.verdict](curStep.label);
    tone = curStep.verdict === 'unchanged' ? 'skip'
      : curStep.verdict === 'removed' ? 'bad'
        : curStep.verdict === 'added' ? 'ok' : 'warn';
  } else {
    const p = patchesGenerated;
    note = `Diff complete. The ${p} patch${p === 1 ? '' : 'es'} are applied to the real DOM — only those nodes change. The ${counts.unchanged} unchanged node${counts.unchanged === 1 ? '' : 's'} ${counts.unchanged === 1 ? 'is' : 'are'} never touched. That skip is the whole point of reconciliation.`;
    tone = 'apply';
  }

  // ---- SVG geometry ----
  const W = 960;
  const H = 470;

  const colGap = 24;
  const colX0 = 20;
  const colW = (W - colX0 * 2 - colGap * 2) / 3;
  const oldX = colX0;
  const newX = colX0 + colW + colGap;
  const domX = colX0 + (colW + colGap) * 2;

  const treeTop = 78;
  const rowH = 46;
  const nodeH = 36;

  // node x within a column, indented by depth
  const nodeX = (baseX, depth) => baseX + 14 + depth * 18;
  const nodeW = (depth) => colW - 28 - depth * 18;

  const verdictTone = (v) => {
    if (v === 'unchanged') return 'is-skip';
    if (v === 'changed') return 'is-changed';
    if (v === 'added') return 'is-added';
    if (v === 'removed') return 'is-removed';
    return '';
  };

  // render one tree column: list of nodes, each coloured by its revealed verdict
  const renderTree = (nodes, baseX, side) => nodes.map((n, i) => {
    const y = treeTop + i * rowH;
    const v = verdictById[n.id];
    // a node is "lit" once the diff has reached it
    const lit = v != null;
    const isCurrent = curStep && curStep.id === n.id;
    let tone = '';
    if (side === 'old') {
      // old column: highlight removed + changed; added nodes do not exist here
      if (v === 'removed') tone = 'is-removed';
      else if (v === 'changed') tone = 'is-changed';
      else if (v === 'unchanged') tone = 'is-skip';
    } else if (side === 'new') {
      if (v === 'added') tone = 'is-added';
      else if (v === 'changed') tone = 'is-changed';
      else if (v === 'unchanged') tone = 'is-skip';
    } else {
      // real dom: only show changes after apply; removed nodes vanish
      if (!applied) tone = lit ? 'is-skip' : '';
      else if (v === 'removed') return null;
      else if (v === 'added') tone = 'is-added';
      else if (v === 'changed') tone = 'is-changed';
      else tone = 'is-untouched';
    }
    const x = nodeX(baseX, n.depth);
    const w = nodeW(n.depth);
    const textVal = n.text ? ` "${n.text}"` : '';
    return (
      <g key={`${side}-${n.id}`}>
        {n.depth > 0 && (
          <line
            className={`vdd-edge ${lit ? 'is-lit' : ''}`}
            x1={baseX + 14 + (n.depth - 1) * 18 + 6}
            y1={y - rowH + nodeH / 2}
            x2={x}
            y2={y + nodeH / 2}
          />
        )}
        <rect
          className={`vdd-node ${tone} ${isCurrent ? 'is-current' : ''} ${!lit && side !== 'dom' ? 'is-dim' : ''}`}
          x={x}
          y={y}
          width={w}
          height={nodeH}
          rx={7}
        />
        <text className="vdd-node-tag" x={x + 10} y={y + 15} textAnchor="start">{n.tag}</text>
        <text className="vdd-node-text" x={x + 10} y={y + 28} textAnchor="start">
          {n.props ? n.props : textVal || '—'}
        </text>
      </g>
    );
  });

  return (
    <div className="vdd">
      <div className="vdd-head">
        <h3 className="vdd-title">Virtual DOM diff — find the minimal patch, touch only what changed</h3>
        <p className="vdd-sub">
          The reconciler walks the old tree against the new one, tags each node unchanged, changed, added, or removed,
          and collects a patch list. Only those patches reach the real DOM — every unchanged node is skipped.
        </p>
      </div>

      <div className="vdd-controls">
        <div className="vdd-presets" role="group" aria-label="Pick an edit">
          {PRESETS.map((p) => {
            const Ic = ICONS[p.icon] || Pencil;
            return (
              <button
                key={p.key}
                type="button"
                className={`vdd-preset ${presetKey === p.key ? 'is-on' : ''}`}
                onClick={() => pickPreset(p.key)}
                aria-pressed={presetKey === p.key}
                title={p.blurb}
              >
                <Ic size={12} /> {p.label}
              </button>
            );
          })}
        </div>

        <label className="vdd-speed">
          <span className="vdd-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="vdd-speed-range" aria-label="Playback speed"
          />
          <span className="vdd-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="vdd-spacer" aria-hidden="true" />

        <div className="vdd-buttons">
          <button
            type="button" className="vdd-btn vdd-btn-primary"
            onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunning((v) => !v); }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button" className="vdd-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button" className="vdd-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Apply
          </button>
          <button type="button" className="vdd-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="vdd-stepcount">
          step <strong>{Math.min(step + 1, totalSteps)}</strong> / {totalSteps}
        </div>
      </div>

      <div className="vdd-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="vdd-svg" preserveAspectRatio="xMidYMid meet">
          {/* column headers */}
          <text className="vdd-col-label is-old" x={oldX + 4} y={40} textAnchor="start">OLD vdom tree</text>
          <text className="vdd-col-label is-new" x={newX + 4} y={40} textAnchor="start">NEW vdom tree</text>
          <text className="vdd-col-label is-dom" x={domX + 4} y={40} textAnchor="start">REAL DOM</text>
          <text className="vdd-col-sub" x={oldX + 4} y={56} textAnchor="start">what is mounted now</text>
          <text className="vdd-col-sub" x={newX + 4} y={56} textAnchor="start">what render produced</text>
          <text className="vdd-col-sub" x={domX + 4} y={56} textAnchor="start">{applied ? 'after patching' : 'awaiting patches'}</text>

          {/* column frames */}
          <rect className="vdd-col-frame" x={oldX} y={66} width={colW} height={H - 80} rx={9} />
          <rect className="vdd-col-frame" x={newX} y={66} width={colW} height={H - 80} rx={9} />
          <rect className={`vdd-col-frame is-dom ${applied ? 'is-applied' : ''}`} x={domX} y={66} width={colW} height={H - 80} rx={9} />

          {renderTree(preset.old, oldX, 'old')}
          {renderTree(preset.new, newX, 'new')}
          {renderTree(preset.new.filter((n) => verdictById[n.id] !== 'removed'), domX, 'dom')}

          {/* footer note inside dom column when applied */}
          {applied && (
            <text className="vdd-dom-foot" x={domX + colW / 2} y={H - 22} textAnchor="middle">
              {`${counts.unchanged} node${counts.unchanged === 1 ? '' : 's'} untouched`}
            </text>
          )}
          {!applied && (
            <text className="vdd-dom-foot is-dim" x={domX + colW / 2} y={H - 22} textAnchor="middle">
              {step === 0 ? 'patches not applied yet' : 'collecting patches…'}
            </text>
          )}
        </svg>
      </div>

      <div className="vdd-lower">
        <div className="vdd-patchpanel">
          <div className="vdd-patch-head">
            <GitCompare size={13} className="vdd-ic" />
            <span className="vdd-patch-title">patch list</span>
            <span className="vdd-patch-count">{patchesGenerated} patch{patchesGenerated === 1 ? '' : 'es'}</span>
          </div>
          <div className="vdd-patch-body">
            {(applied ? steps.filter((s) => s.verdict !== 'unchanged') : patchList).length === 0 ? (
              <div className="vdd-patch-empty">No patches yet — step the diff to collect them.</div>
            ) : (
              (applied ? steps.filter((s) => s.verdict !== 'unchanged') : patchList).map((s, i) => (
                <div key={`${s.id}-${i}`} className={`vdd-patch-row ${verdictTone(s.verdict)}`}>
                  <span className="vdd-patch-verdict">
                    {s.verdict === 'added' && <Plus size={11} />}
                    {s.verdict === 'removed' && <Minus size={11} />}
                    {s.verdict === 'changed' && <Pencil size={11} />}
                    {s.verdict}
                  </span>
                  <span className="vdd-patch-node">{s.label}</span>
                  <span className="vdd-patch-op">{s.detail}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="vdd-metrics">
          <div className="vdd-metric">
            <span className="vdd-metric-label">nodes compared</span>
            <span className="vdd-metric-value">{nodesCompared}</span>
          </div>
          <div className="vdd-metric">
            <span className="vdd-metric-label">patches generated</span>
            <span className={`vdd-metric-value ${patchesGenerated > 0 ? 'is-changed' : ''}`}>{patchesGenerated}</span>
          </div>
          <div className="vdd-metric">
            <span className="vdd-metric-label">nodes untouched</span>
            <span className="vdd-metric-value is-ok">{nodesUntouched}</span>
          </div>
          <div className="vdd-metric">
            <span className="vdd-metric-label">changed</span>
            <span className={`vdd-metric-value ${counts.changed ? 'is-changed' : ''}`}>{applied || classified === steps.length ? counts.changed : steps.slice(0, classified).filter((s) => s.verdict === 'changed').length}</span>
          </div>
          <div className="vdd-metric">
            <span className="vdd-metric-label">added</span>
            <span className={`vdd-metric-value ${counts.added ? 'is-added' : ''}`}>{applied || classified === steps.length ? counts.added : steps.slice(0, classified).filter((s) => s.verdict === 'added').length}</span>
          </div>
          <div className="vdd-metric">
            <span className="vdd-metric-label">removed</span>
            <span className={`vdd-metric-value ${counts.removed ? 'is-removed' : ''}`}>{applied || classified === steps.length ? counts.removed : steps.slice(0, classified).filter((s) => s.verdict === 'removed').length}</span>
          </div>
        </div>
      </div>

      <div className={`vdd-narration ${tone === 'bad' ? 'is-bad' : tone === 'warn' ? 'is-warn' : tone === 'ok' || tone === 'apply' ? 'is-ok' : tone === 'skip' ? 'is-skip' : ''}`}>
        <span className={`vdd-narration-label ${tone === 'bad' ? 'is-bad' : tone === 'warn' ? 'is-warn' : tone === 'ok' || tone === 'apply' ? 'is-ok' : tone === 'skip' ? 'is-skip' : ''}`}>
          {tone === 'ready' ? 'diff' : tone === 'skip' ? 'skip' : tone === 'warn' ? 'patch' : tone === 'ok' ? 'insert' : tone === 'bad' ? 'delete' : tone === 'apply' ? 'applied' : 'diff'}
        </span>
        <span className="vdd-narration-body">{note}</span>
      </div>

      <div className="vdd-legend">
        <span className="vdd-legend-item"><Check size={13} className="vdd-ic is-dim" /> unchanged — skipped, never touched</span>
        <span className="vdd-legend-item"><Pencil size={13} className="vdd-ic is-changed" /> changed — patched in place</span>
        <span className="vdd-legend-item"><Plus size={13} className="vdd-ic is-added" /> added — node inserted</span>
        <span className="vdd-legend-item"><Minus size={13} className="vdd-ic is-removed" /> removed — node deleted</span>
        <span className="vdd-legend-item"><Layers size={13} className="vdd-ic" /> minimal patch, then apply</span>
        <span className="vdd-legend-item"><FileCode2 size={13} className="vdd-ic" /> the skip is the win</span>
      </div>
    </div>
  );
}
