import React, { useMemo, useState } from 'react';
import { Plus, Lock, Hammer, RotateCcw, Undo2, Play } from 'lucide-react';
import './BuilderPatternViz.css';

// Each addable part: key, the fluent method it appends, the field it sets on the
// builder's internal state, and a hue token for the SVG pill.
const PARTS = [
  { key: 'bun', method: 'addBun', field: 'bun', value: 'sesame', hue: 'var(--medium)' },
  { key: 'patty', method: 'addPatty', field: 'patty', value: 'beef', hue: 'var(--hard)' },
  { key: 'cheese', method: 'addCheese', field: 'cheese', value: true, hue: 'var(--warning)' },
  { key: 'sauce', method: 'addSauce', field: 'sauce', value: 'house', hue: 'var(--hue-pink)' },
  { key: 'lettuce', method: 'addLettuce', field: 'lettuce', value: true, hue: 'var(--hue-mint)' },
  { key: 'bacon', method: 'addBacon', field: 'bacon', value: true, hue: 'var(--hue-violet)' },
];

// Positional/boolean order the telescoping constructor would demand — the
// anti-pattern this whole exercise argues against.
const TELESCOPE_ORDER = ['bun', 'patty', 'cheese', 'sauce', 'lettuce', 'bacon'];

// A sensible scripted burger for the one-click demo.
const DEMO = ['bun', 'patty', 'cheese', 'sauce', 'lettuce'];

const partOf = (key) => PARTS.find((p) => p.key === key);

function deriveState(steps) {
  const fields = {};
  steps.forEach((key) => {
    const p = partOf(key);
    fields[p.field] = p.value;
  });
  return fields;
}

function deriveChain(steps) {
  if (steps.length === 0) return 'new BurgerBuilder()';
  return `new BurgerBuilder()${steps.map((k) => `.${partOf(k).method}()`).join('')}`;
}

function deriveTelescope(steps) {
  const set = new Set(steps);
  const args = TELESCOPE_ORDER.map((key) => {
    const p = partOf(key);
    if (!set.has(key)) return p.value === true ? 'false' : 'null';
    return p.value === true ? 'true' : `"${p.value}"`;
  });
  return `new Burger(${args.join(', ')})`;
}

const FIELD_FMT = (v) => (v === true ? 'true' : `"${v}"`);

export default function BuilderPatternViz() {
  const [steps, setSteps] = useState([]);
  const [built, setBuilt] = useState(false);

  const state = useMemo(() => deriveState(steps), [steps]);
  const chain = useMemo(() => deriveChain(steps), [steps]);
  const telescope = useMemo(() => deriveTelescope(steps), [steps]);
  const fieldList = useMemo(
    () => Object.entries(state).map(([k, v]) => `${k}: ${FIELD_FMT(v)}`),
    [state],
  );

  const addPart = (key) => {
    if (built) return;
    setSteps((s) => [...s, key]);
  };
  const undo = () => {
    if (built) return;
    setSteps((s) => s.slice(0, -1));
  };
  const reset = () => {
    setBuilt(false);
    setSteps([]);
  };
  const build = () => {
    if (steps.length === 0) return;
    setBuilt(true);
  };
  const runDemo = () => {
    setBuilt(false);
    setSteps(DEMO.slice());
  };

  // SVG geometry
  const W = 940;
  const H = 470;
  const pad = 24;

  // chain pills wrap onto rows inside the SVG
  const pillStartX = pad;
  const pillRowY = 64;
  const pillH = 30;
  const pillGap = 8;
  const rowGap = 10;
  const pills = ['new BurgerBuilder()', ...steps.map((k) => `.${partOf(k).method}()`)];
  const pillW = (label) => Math.max(96, label.length * 8.2 + 22);

  const pillLayout = [];
  let cx = pillStartX;
  let cy = pillRowY;
  pills.forEach((label, i) => {
    const w = pillW(label);
    if (cx + w > W - pad && i > 0) {
      cx = pillStartX;
      cy += pillH + rowGap;
    }
    pillLayout.push({ label, x: cx, y: cy, w, i });
    cx += w + pillGap;
  });
  const lastPillBottom = (pillLayout[pillLayout.length - 1]?.y ?? pillRowY) + pillH;

  // builder/result box geometry
  const boxTop = lastPillBottom + 34;
  const boxW = (W - pad * 2 - 24) / 2;
  const builderX = pad;
  const resultX = pad + boxW + 24;
  const boxH = 178;
  const lineH = 22;

  // telescoping comparison wraps to fit
  const teleTop = boxTop + boxH + 30;
  const teleChars = Math.floor((W - pad * 2 - 16) / 7.3);
  const teleLines = [];
  for (let i = 0; i < telescope.length; i += teleChars) {
    teleLines.push(telescope.slice(i, i + teleChars));
  }

  return (
    <div className="bpv">
      <div className="bpv-head">
        <h3 className="bpv-title">The builder pattern — construct a complex object step by step</h3>
        <p className="bpv-sub">
          Click parts to append fluent calls. Watch the builder&apos;s internal state grow, then build() to
          freeze an immutable Burger — and compare the readable chain against a telescoping constructor.
        </p>
      </div>

      <div className="bpv-controls">
        <div className="bpv-parts" role="group" aria-label="Add burger part">
          {PARTS.map((p) => (
            <button
              key={p.key}
              type="button"
              className="bpv-part"
              onClick={() => addPart(p.key)}
              disabled={built}
              style={{ borderColor: p.hue, color: p.hue }}
            >
              <Plus size={13} /> {p.method}()
            </button>
          ))}
        </div>

        <span className="bpv-spacer" aria-hidden="true" />

        <div className="bpv-buttons">
          <button
            type="button"
            className="bpv-btn bpv-btn-primary"
            onClick={build}
            disabled={built || steps.length === 0}
          >
            <Hammer size={14} /> build()
          </button>
          <button
            type="button"
            className="bpv-btn"
            onClick={undo}
            disabled={built || steps.length === 0}
          >
            <Undo2 size={14} /> Undo
          </button>
          <button type="button" className="bpv-btn" onClick={runDemo}>
            <Play size={14} /> Demo
          </button>
          <button type="button" className="bpv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="bpv-stepcount">
          parts <strong>{steps.length}</strong> · {built ? 'built' : 'building'}
        </div>
      </div>

      <div className="bpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bpv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="bpv-row-label" x={pad} y={40}>fluent call chain</text>
          {pillLayout.map((pl) => (
            <g key={`pill-${pl.i}`}>
              <rect
                className={`bpv-pill ${pl.i === 0 ? 'is-root' : 'is-call'}`}
                x={pl.x}
                y={pl.y}
                width={pl.w}
                height={pillH}
                rx={6}
              />
              <text className="bpv-pill-text" x={pl.x + pl.w / 2} y={pl.y + pillH / 2 + 4}>
                {pl.label}
              </text>
            </g>
          ))}
          {built && (
            <g>
              <rect
                className="bpv-pill is-build"
                x={pillLayout[pillLayout.length - 1].x + pillLayout[pillLayout.length - 1].w + pillGap > W - pad - 96
                  ? pillStartX
                  : pillLayout[pillLayout.length - 1].x + pillLayout[pillLayout.length - 1].w + pillGap}
                y={pillLayout[pillLayout.length - 1].x + pillLayout[pillLayout.length - 1].w + pillGap > W - pad - 96
                  ? lastPillBottom + rowGap
                  : pillLayout[pillLayout.length - 1].y}
                width={96}
                height={pillH}
                rx={6}
              />
            </g>
          )}

          {/* builder internal state box (mutable while building) */}
          <rect
            className={`bpv-box ${built ? 'is-spent' : 'is-mutable'}`}
            x={builderX}
            y={boxTop}
            width={boxW}
            height={boxH}
            rx={9}
          />
          <text className="bpv-box-title" x={builderX + 14} y={boxTop + 24}>
            builder.state {built ? '(consumed)' : '(mutable)'}
          </text>
          <text className="bpv-box-brace" x={builderX + 14} y={boxTop + 46}>{'{'}</text>
          {fieldList.length === 0 && (
            <text className="bpv-box-empty" x={builderX + boxW / 2} y={boxTop + boxH / 2 + 8}>
              no fields yet
            </text>
          )}
          {fieldList.map((f, i) => (
            <text
              key={`bf-${f}`}
              className="bpv-box-field"
              x={builderX + 30}
              y={boxTop + 66 + i * lineH}
            >
              {f},
            </text>
          ))}
          <text className="bpv-box-brace" x={builderX + 14} y={boxTop + 70 + fieldList.length * lineH}>
            {'}'}
          </text>

          {/* build() result card — frozen + locked once built */}
          <rect
            className={`bpv-box ${built ? 'is-frozen' : 'is-pending'}`}
            x={resultX}
            y={boxTop}
            width={boxW}
            height={boxH}
            rx={9}
            style={built ? { stroke: 'var(--easy)' } : undefined}
          />
          <text className={`bpv-box-title ${built ? 'is-frozen' : ''}`} x={resultX + 14} y={boxTop + 24}>
            Burger {built ? '(immutable)' : '(call build to create)'}
          </text>
          {built ? (
            <>
              <g transform={`translate(${resultX + boxW - 34}, ${boxTop + 12})`}>
                <rect className="bpv-lock-badge" x={0} y={0} width={22} height={22} rx={5} />
                <Lock x={4} y={4} width={14} height={14} className="bpv-lock-icon" />
              </g>
              <text className="bpv-box-brace is-frozen" x={resultX + 14} y={boxTop + 46}>
                Object.freeze({'{'}
              </text>
              {fieldList.map((f, i) => (
                <text
                  key={`rf-${f}`}
                  className="bpv-box-field is-frozen"
                  x={resultX + 30}
                  y={boxTop + 66 + i * lineH}
                >
                  {f},
                </text>
              ))}
              <text
                className="bpv-box-brace is-frozen"
                x={resultX + 14}
                y={boxTop + 70 + fieldList.length * lineH}
              >
                {'})'}
              </text>
            </>
          ) : (
            <text className="bpv-box-empty" x={resultX + boxW / 2} y={boxTop + boxH / 2 + 8}>
              not built — builder is still mutable
            </text>
          )}

          {/* telescoping-constructor anti-pattern comparison */}
          <text className="bpv-row-label is-anti" x={pad} y={teleTop - 8}>
            the telescoping-constructor equivalent (hard to read — what is each arg?)
          </text>
          {teleLines.map((ln, i) => (
            <text
              key={`tele-${i}`}
              className="bpv-tele"
              x={pad}
              y={teleTop + 16 + i * lineH}
            >
              {ln}
            </text>
          ))}
        </svg>
      </div>

      <div className="bpv-metrics">
        <div className="bpv-metric">
          <span className="bpv-metric-label">parts added</span>
          <span className="bpv-metric-value">{steps.length}</span>
        </div>
        <div className="bpv-metric">
          <span className="bpv-metric-label">state</span>
          <span className={`bpv-metric-value ${built ? 'is-frozen' : ''}`}>
            {built ? 'frozen' : 'mutable'}
          </span>
        </div>
        <div className="bpv-metric">
          <span className="bpv-metric-label">fields set</span>
          <span className="bpv-metric-value is-mint">{fieldList.length}</span>
        </div>
        <div className="bpv-metric">
          <span className="bpv-metric-label">chain</span>
          <span className="bpv-metric-value is-chain">{chain}</span>
        </div>
        <div className="bpv-metric">
          <span className="bpv-metric-label">telescoping args</span>
          <span className="bpv-metric-value is-anti">{TELESCOPE_ORDER.length}</span>
        </div>
      </div>

      <div className="bpv-narration">
        <span className="bpv-narration-label">why builder</span>
        <span className="bpv-narration-body">
          {built
            ? `Built. The Burger is now immutable — Object.freeze locks ${fieldList.length} field${fieldList.length === 1 ? '' : 's'} so nothing can mutate it after construction. The builder did its job and is spent. Compare the named chain to ${telescope} — the builder names every part at the call site, the constructor leaves you counting positional args.`
            : steps.length === 0
              ? 'Add parts to start a chain. Each method returns the builder itself, so calls fluently stack. The builder holds a mutable partial state until build() finalizes an immutable result. A telescoping constructor would force every argument up front, in a fixed positional order, even for optional toppings.'
              : `The builder accumulates state: ${chain}. Each call sets one named field and returns this, so order is flexible and only the parts you want appear. The telescoping version forces all ${TELESCOPE_ORDER.length} positional args — note how ${telescope} buries meaning in unlabeled true/false/null slots. Call build() to freeze the result.`}
        </span>
      </div>
    </div>
  );
}
