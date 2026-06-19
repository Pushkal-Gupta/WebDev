import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Lock, Pencil } from 'lucide-react';
import './TemplateMethodViz.css';

const TEMPLATE = [
  { key: 'boil', label: 'Boil water', kind: 'fixed', fixedDetail: 'bring water to 100°C' },
  { key: 'brew', label: 'Brew / steep', kind: 'hook', hookSlot: 'brew' },
  { key: 'pour', label: 'Pour into cup', kind: 'fixed', fixedDetail: 'transfer to the mug' },
  { key: 'condiments', label: 'Add condiments', kind: 'hook', hookSlot: 'condiments' },
];

const SUBCLASSES = [
  {
    name: 'Tea',
    accent: 'var(--hue-mint)',
    steps: { brew: 'steep the tea bag', condiments: 'add lemon' },
  },
  {
    name: 'Coffee',
    accent: 'var(--hue-sky)',
    steps: { brew: 'drip through filter', condiments: 'add sugar & milk' },
  },
  {
    name: 'HotChocolate',
    accent: 'var(--hue-pink)',
    steps: { brew: 'dissolve cocoa', condiments: 'add marshmallows' },
  },
];

function resolveStep(row, subclass) {
  if (row.kind === 'fixed') {
    return { detail: row.fixedDetail, source: 'base template' };
  }
  return { detail: subclass.steps[row.hookSlot], source: subclass.name };
}

function buildFrames(subclass) {
  const frames = [];
  const executed = [];

  const snap = (extra) => ({
    activeIndex: -1,
    executed: executed.map((e) => ({ ...e })),
    note: '',
    phase: 'run',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `The template method prepareBeverage() defines the algorithm skeleton once. ${subclass.name} inherits it and supplies only the hook steps. The fixed steps are never rewritten — they run identically for every subclass.`,
  }));

  for (let i = 0; i < TEMPLATE.length; i += 1) {
    const row = TEMPLATE[i];
    const resolved = resolveStep(row, subclass);
    executed.push({
      key: row.key,
      label: row.label,
      kind: row.kind,
      detail: resolved.detail,
      source: resolved.source,
    });
    const reason = row.kind === 'fixed'
      ? `Step ${i + 1} "${row.label}" is invariant — it lives in the base class, so ${subclass.name} runs the exact same code. Fixed steps guarantee the algorithm's shape never drifts between subclasses.`
      : `Step ${i + 1} "${row.label}" is a hook. The base template calls it but leaves it empty; ${subclass.name} overrides it with "${resolved.detail}". Only this line changes per subclass.`;
    frames.push(snap({ activeIndex: i, note: reason }));
  }

  const seq = executed.map((e) => e.detail).join(' -> ');
  frames.push(snap({
    phase: 'done',
    activeIndex: -1,
    note: `Done. ${subclass.name} ran the full skeleton: ${seq}. The two fixed steps were shared with every other beverage; only the two hooks bound to ${subclass.name}. Same template, swappable hooks.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function TemplateMethodViz() {
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const subclass = SUBCLASSES[selected];
  const frames = useMemo(() => buildFrames(subclass), [subclass]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  const pickSubclass = (idx) => {
    setIsRunning(false);
    setStep(0);
    setSelected(idx);
  };

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const W = 940;
  const H = 440;
  const rowX = 24;
  const rowW = W - 48;
  const rowTop = 64;
  const rowH = 70;
  const rowGap = 12;

  const fixedCount = current.executed.filter((e) => e.kind === 'fixed').length;
  const hookCount = current.executed.filter((e) => e.kind === 'hook').length;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="tmv">
      <div className="tmv-head">
        <h3 className="tmv-title">Template Method — one skeleton, swappable hook steps</h3>
        <p className="tmv-sub">
          prepareBeverage() fixes the algorithm: boil, brew, pour, add condiments. The boil and pour steps are
          invariant for every drink; brew and add-condiments are hooks each subclass overrides. Pick a beverage
          and watch the same template run top to bottom, changing only the hooks.
        </p>
      </div>

      <div className="tmv-controls">
        <div className="tmv-subclass-pick" role="group" aria-label="Concrete subclass">
          {SUBCLASSES.map((s, i) => (
            <button
              key={s.name}
              type="button"
              className={`tmv-chip ${i === selected ? 'is-active' : ''}`}
              onClick={() => pickSubclass(i)}
              style={i === selected ? { borderColor: s.accent, color: s.accent } : undefined}
            >
              <span className="tmv-chip-dot" style={{ background: s.accent }} />
              {s.name}
            </button>
          ))}
        </div>

        <span className="tmv-spacer" aria-hidden="true" />

        <label className="tmv-speed">
          <span className="tmv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="tmv-speed-range"
            aria-label="Playback speed"
          />
          <span className="tmv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="tmv-buttons">
          <button
            type="button"
            className="tmv-btn tmv-btn-primary"
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
            className="tmv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="tmv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="tmv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="tmv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="tmv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tmv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="tmv-skeleton-label" x={rowX} y={40}>
            prepareBeverage() — running as {subclass.name}
          </text>

          {TEMPLATE.map((row, i) => {
            const y = rowTop + i * (rowH + rowGap);
            const active = current.activeIndex === i;
            const done = current.executed.length > i + 1 || (current.phase === 'done');
            const reachedRow = current.executed.some((e) => e.key === row.key) && current.activeIndex !== i;
            const isHook = row.kind === 'hook';
            const stripe = isHook ? subclass.accent : 'var(--accent)';
            const resolved = resolveStep(row, subclass);
            const showDetail = active || reachedRow || done;
            return (
              <g key={row.key}>
                <rect
                  className={`tmv-row ${active ? 'is-active' : ''} ${isHook ? 'is-hook' : 'is-fixed'}`}
                  x={rowX}
                  y={y}
                  width={rowW}
                  height={rowH}
                  rx={10}
                  style={active ? { stroke: stripe } : undefined}
                />
                <rect x={rowX} y={y} width={6} height={rowH} rx={3} fill={stripe} opacity={active ? 1 : 0.6} />

                <g transform={`translate(${rowX + 26}, ${y + rowH / 2})`}>
                  {isHook ? (
                    <Pencil size={18} color={stripe} x={-9} y={-9} />
                  ) : (
                    <Lock size={18} color="var(--text-dim)" x={-9} y={-9} />
                  )}
                </g>

                <text className="tmv-row-index" x={rowX + 54} y={y + 28}>step {i + 1}</text>
                <text className="tmv-row-label" x={rowX + 54} y={y + 50}>{row.label}</text>

                <text
                  className={`tmv-row-tag ${isHook ? 'is-hook' : 'is-fixed'}`}
                  x={rowX + rowW - 16}
                  y={y + 26}
                  style={isHook ? { fill: stripe } : undefined}
                >
                  {isHook ? 'HOOK · overridden' : 'FIXED · invariant'}
                </text>

                <text
                  className="tmv-row-detail"
                  x={rowX + rowW - 16}
                  y={y + 50}
                  style={{ opacity: showDetail ? 1 : 0.25 }}
                >
                  {showDetail ? `${resolved.detail}  (${resolved.source})` : '…'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tmv-metrics">
        <div className="tmv-metric">
          <span className="tmv-metric-label">subclass</span>
          <span className="tmv-metric-value" style={{ color: subclass.accent }}>{subclass.name}</span>
        </div>
        <div className="tmv-metric">
          <span className="tmv-metric-label">phase</span>
          <span className="tmv-metric-value">{current.phase}</span>
        </div>
        <div className="tmv-metric">
          <span className="tmv-metric-label">fixed run</span>
          <span className="tmv-metric-value">{fixedCount} / 2</span>
        </div>
        <div className="tmv-metric">
          <span className="tmv-metric-label">hooks bound</span>
          <span className="tmv-metric-value">{hookCount} / 2</span>
        </div>
        <div className="tmv-metric tmv-metric-wide">
          <span className="tmv-metric-label">executed sequence</span>
          <span className="tmv-metric-value tmv-seq">
            [{current.executed.map((e) => e.detail).join('  ->  ') || '—'}]
          </span>
        </div>
      </div>

      <div className="tmv-narration">
        <span className="tmv-narration-label">trace</span>
        <span className="tmv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
