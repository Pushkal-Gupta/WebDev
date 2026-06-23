import { useId, useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, StepForward, Layers, CheckCircle2 } from 'lucide-react';
import './SetCoverGreedy.css';

const km = (expr, display = false) =>
  katex.renderToString(expr, { throwOnError: false, displayMode: display });

// Fixed instance: universe of 12 elements, 6 candidate subsets.
// Greedy set cover: each round, pick the subset covering the most still-uncovered
// elements. Greedy is an H(n) ~= ln(n) + 1 approximation of the optimum.
const UNIVERSE = Array.from({ length: 12 }, (_, i) => i);

const SETS = [
  { id: 'A', hue: 'var(--hue-violet)', members: [0, 1, 2, 3, 4] },
  { id: 'B', hue: 'var(--hue-sky)', members: [4, 5, 6, 7] },
  { id: 'C', hue: 'var(--hue-pink)', members: [0, 5, 8, 9] },
  { id: 'D', hue: 'var(--hue-mint)', members: [8, 9, 10, 11] },
  { id: 'E', hue: 'var(--accent)', members: [2, 6, 10] },
  { id: 'F', hue: 'var(--warning)', members: [1, 7, 11] },
];

// Precompute the greedy trace deterministically (ties broken by set order).
function buildTrace() {
  const covered = new Set();
  const chosen = [];
  const steps = [];
  const remainingSets = SETS.map((s) => s.id);
  while (covered.size < UNIVERSE.length && remainingSets.length) {
    let best = null;
    let bestGain = -1;
    for (const sid of remainingSets) {
      const s = SETS.find((x) => x.id === sid);
      const gain = s.members.filter((m) => !covered.has(m)).length;
      if (gain > bestGain) {
        bestGain = gain;
        best = s;
      }
    }
    if (!best || bestGain <= 0) break;
    const newlyCovered = best.members.filter((m) => !covered.has(m));
    newlyCovered.forEach((m) => covered.add(m));
    chosen.push(best.id);
    remainingSets.splice(remainingSets.indexOf(best.id), 1);
    steps.push({
      pick: best.id,
      gain: bestGain,
      newlyCovered: [...newlyCovered],
      coveredAfter: new Set(covered),
      chosenAfter: [...chosen],
    });
  }
  return steps;
}

const TRACE = buildTrace();

export default function SetCoverGreedyViz() {
  const uid = useId().replace(/:/g, '');
  // step 0 = nothing chosen; step k = after k greedy picks.
  const [step, setStep] = useState(0);

  const state = useMemo(() => {
    if (step === 0) {
      return {
        covered: new Set(),
        chosen: [],
        lastPick: null,
        lastGain: 0,
        newlyCovered: [],
      };
    }
    const s = TRACE[step - 1];
    return {
      covered: s.coveredAfter,
      chosen: s.chosenAfter,
      lastPick: s.pick,
      lastGain: s.gain,
      newlyCovered: s.newlyCovered,
    };
  }, [step]);

  const done = state.covered.size === UNIVERSE.length;
  const canStep = step < TRACE.length && !done;

  // SVG geometry — universe grid on top, candidate sets as rows below.
  const W = 940;
  const padX = 28;
  const gridY = 50;
  const cols = 6;
  const cellGap = 12;
  const cellW = (W - padX * 2 - cellGap * (cols - 1)) / cols;
  const cellH = 44;
  const gridRows = Math.ceil(UNIVERSE.length / cols);
  const gridH = gridRows * (cellH + cellGap) - cellGap;

  const setsY = gridY + gridH + 56;
  const setRowH = 30;
  const setGap = 8;
  const H = setsY + SETS.length * (setRowH + setGap) + 10;

  const cellPos = (idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    return {
      x: padX + c * (cellW + cellGap),
      y: gridY + r * (cellH + cellGap),
    };
  };

  return (
    <div className="scg">
      <div className="scg-head">
        <h3 className="scg-title">Greedy set cover — always grab the set covering the most new elements</h3>
        <p className="scg-sub">
          Each round picks the candidate set covering the most still-uncovered elements. It never reaches the true
          optimum in general, but stays within a{' '}
          <span dangerouslySetInnerHTML={{ __html: km('H_n \\approx \\ln n') }} /> factor of it.
        </p>
      </div>

      <div className="scg-controls">
        <span className="scg-progress-label">
          step {step} / {TRACE.length}
        </span>
        <span className="scg-spacer" aria-hidden="true" />
        <button type="button" className="scg-btn scg-btn-primary" onClick={() => canStep && setStep((s) => s + 1)} disabled={!canStep}>
          <StepForward size={14} /> {done ? 'Covered' : 'Step'}
        </button>
        <button type="button" className="scg-btn" onClick={() => setStep(0)}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="scg-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="scg-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <text className="scg-section" x={padX} y={gridY - 16}>
            universe · {state.covered.size}/{UNIVERSE.length} covered
          </text>
          {UNIVERSE.map((el) => {
            const { x, y } = cellPos(el);
            const isCovered = state.covered.has(el);
            const isNew = state.newlyCovered.includes(el);
            return (
              <g key={`el-${el}`} filter={isNew ? `url(#${uid}-glow)` : undefined}>
                <rect
                  className={`scg-cell ${isCovered ? 'is-covered' : ''} ${isNew ? 'is-new' : ''}`}
                  x={x}
                  y={y}
                  width={cellW}
                  height={cellH}
                  rx={8}
                />
                <text className={`scg-cell-id ${isCovered ? 'is-covered' : ''}`} x={x + cellW / 2} y={y + cellH / 2 + 5}>
                  {el}
                </text>
              </g>
            );
          })}

          <text className="scg-section" x={padX} y={setsY - 14}>
            candidate sets
          </text>
          {SETS.map((s, i) => {
            const y = setsY + i * (setRowH + setGap);
            const isChosen = state.chosen.includes(s.id);
            const isLast = state.lastPick === s.id;
            const gain = s.members.filter((m) => !state.covered.has(m)).length;
            const labelW = 30;
            const memArea = W - padX * 2 - labelW - 12 - 96;
            return (
              <g key={`set-${s.id}`}>
                <rect
                  className={`scg-set-row ${isChosen ? 'is-chosen' : ''} ${isLast ? 'is-last' : ''}`}
                  x={padX}
                  y={y}
                  width={W - padX * 2}
                  height={setRowH}
                  rx={7}
                  style={isLast ? { stroke: s.hue } : undefined}
                />
                <rect x={padX} y={y} width={5} height={setRowH} rx={2.5} fill={s.hue} />
                <text className="scg-set-id" x={padX + 16} y={y + setRowH / 2 + 5} style={{ fill: s.hue }}>
                  {s.id}
                </text>
                {s.members.map((m, mi) => {
                  const mx = padX + labelW + 12 + (mi / s.members.length) * memArea + memArea / s.members.length / 2;
                  const memCovered = state.covered.has(m);
                  return (
                    <g key={`sm-${s.id}-${m}`} transform={`translate(${mx}, ${y + setRowH / 2})`}>
                      <circle
                        className="scg-set-dot"
                        r={9}
                        style={{ fill: memCovered ? s.hue : 'var(--surface)', stroke: s.hue }}
                      />
                      <text className="scg-set-dot-id" x={0} y={3} style={{ fill: memCovered ? 'var(--bg)' : 'var(--text-dim)' }}>
                        {m}
                      </text>
                    </g>
                  );
                })}
                <text className="scg-set-gain" x={W - padX - 10} y={y + setRowH / 2 + 5}>
                  {isChosen ? 'chosen' : `+${gain} new`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="scg-metrics">
        <div className="scg-metric">
          <span className="scg-metric-label">elements covered</span>
          <span className="scg-metric-value">
            {state.covered.size} / {UNIVERSE.length}
          </span>
        </div>
        <div className="scg-metric">
          <span className="scg-metric-label">sets chosen</span>
          <span className="scg-metric-value">
            {state.chosen.length ? state.chosen.join(', ') : '—'}
          </span>
        </div>
        <div className="scg-metric">
          <span className="scg-metric-label">last pick gain</span>
          <span className="scg-metric-value">
            {state.lastPick ? `${state.lastPick} → +${state.lastGain}` : '—'}
          </span>
        </div>
        <div className="scg-metric">
          <span className="scg-metric-label">approx. ratio</span>
          <span
            className="scg-metric-math"
            dangerouslySetInnerHTML={{ __html: km('H_n = \\textstyle\\sum_{k=1}^{n}\\tfrac1k \\le \\ln n + 1') }}
          />
        </div>
      </div>

      <div className={`scg-verdict ${done ? 'is-done' : ''}`}>
        {done ? <CheckCircle2 size={15} /> : <Layers size={15} />}
        <span>
          {done
            ? `Universe covered with ${state.chosen.length} sets: ${state.chosen.join(' → ')}. Greedy stopped as soon as every element was hit.`
            : state.lastPick
              ? `Picked ${state.lastPick} for +${state.lastGain} new elements — the largest gain available this round.`
              : 'Nothing chosen yet. Step to let greedy grab the set with the biggest uncovered overlap.'}
        </span>
      </div>

      <div className="scg-narration">
        <span className="scg-narration-label">why it matters</span>
        <span className="scg-narration-body">
          Set cover is NP-hard, so we settle for a fast heuristic with a proven guarantee. Greedy — take the most
          new coverage each step — is the canonical example of a logarithmic approximation: its solution is never
          worse than{' '}
          <span dangerouslySetInnerHTML={{ __html: km('(\\ln n + 1)') }} /> times the optimum, and that factor is
          essentially the best any polynomial algorithm can promise. The same pattern drives sensor placement,
          test-suite minimization, and feature-selection problems.
        </span>
      </div>
    </div>
  );
}
