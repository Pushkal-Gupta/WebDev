import React, { useMemo, useState } from 'react';
import { Server, Cloud, Play, ChevronRight, RotateCcw, Zap, Snowflake } from 'lucide-react';
import './ServerlessVsContainersViz.css';

// Serverless (FaaS) vs Containers — the same traffic, two cost models.
//
// A fixed traffic timeline drives both. Containers keep a baseline of
// always-on instances running across EVERY slot — including idle slots where
// zero requests arrive — so you pay for that idle capacity, but there is no
// cold start once the instances are warm. Serverless scales each slot to match
// requests and scales to zero when a slot is empty, so idle slots cost nothing;
// the price is a cold start whenever a slot has requests right after an idle gap
// (or on the very first active slot).
//
// All unit costs are fixed integers so the running totals are clean and
// deterministic — there is no randomness anywhere.

// Requests per time slot across a fixed 12-slot window — two bursts, two idle gaps.
const TRAFFIC = [3, 5, 2, 0, 0, 0, 4, 6, 1, 0, 0, 2];

// Containers hold a baseline that never drops below this, scaling up to load.
const BASELINE = 2;
// One running container costs this per slot, whether busy or idle.
const RUN_COST_PER_SLOT = 2;
// Each serverless invocation (one request) costs this.
const INVOKE_COST = 1;
// A cold start adds this one-off penalty to the slot that incurs it.
const COLD_START_PENALTY = 3;

// Bar color by load bucket so the eye reads traffic shape at a glance.
const loadTag = (r) => {
  if (r === 0) return 'var(--text-dim)';
  if (r <= 2) return 'var(--hue-mint)';
  if (r <= 4) return 'var(--hue-sky)';
  return 'var(--hue-pink)';
};

// Containers running in a given slot: baseline floor, scaled up to meet load.
const containerInstances = (r) => Math.max(BASELINE, r);
// Serverless instances in a given slot: one per request, zero when idle.
const serverlessInstances = (r) => r;
// A serverless cold start happens when a slot has requests and the previous slot had none.
const isColdStart = (s) => TRAFFIC[s] > 0 && (s === 0 || TRAFFIC[s - 1] === 0);

export default function ServerlessVsContainersViz() {
  const [mode, setMode] = useState('serverless'); // 'serverless' | 'containers'
  const [slot, setSlot] = useState(0);

  // Cumulative model up to and including the current slot, for the active mode.
  const model = useMemo(() => {
    let cost = 0;
    let coldStarts = 0;
    let idleWaste = 0;
    for (let i = 0; i <= slot; i += 1) {
      const r = TRAFFIC[i];
      if (mode === 'containers') {
        cost += containerInstances(r) * RUN_COST_PER_SLOT;
        if (r === 0) idleWaste += 1; // paying for baseline with zero requests
      } else {
        cost += r * INVOKE_COST;
        if (isColdStart(i)) {
          coldStarts += 1;
          cost += COLD_START_PENALTY;
        }
      }
    }
    // Whole-timeline cost ceiling for the meter scale (use the pricier model per slot so the bar never overflows).
    let maxCost = 0;
    for (let i = 0; i < TRAFFIC.length; i += 1) {
      const r = TRAFFIC[i];
      const c = containerInstances(r) * RUN_COST_PER_SLOT;
      const s = r * INVOKE_COST + (isColdStart(i) ? COLD_START_PENALTY : 0);
      maxCost += Math.max(c, s);
    }
    const curReq = TRAFFIC[slot];
    const curInstances = mode === 'containers' ? containerInstances(curReq) : serverlessInstances(curReq);
    const curCold = mode === 'serverless' && isColdStart(slot);
    const curIdle = mode === 'containers' && curReq === 0;
    return { cost, coldStarts, idleWaste, maxCost, curReq, curInstances, curCold, curIdle };
  }, [mode, slot]);

  const reset = () => {
    setMode('serverless');
    setSlot(0);
  };

  const stepTime = () => setSlot((s) => (s + 1) % TRAFFIC.length);

  // SVG geometry
  const W = 940;
  const H = 470;
  const padX = 24;
  const chartY = 52;
  const chartH = 130;
  const chartW = W - padX * 2;
  const colGap = 10;
  const colW = (chartW - colGap * (TRAFFIC.length - 1)) / TRAFFIC.length;
  const maxReq = Math.max(...TRAFFIC);

  const instY = chartY + chartH + 72;
  const instRowH = 120;
  const boxSize = 26;
  const boxGap = 8;

  // Cost meter geometry — bottom band.
  const meterY = instY + instRowH + 40;
  const meterX = padX;
  const meterW = chartW;
  const meterH = 22;
  const meterFill = model.maxCost > 0 ? Math.min(1, model.cost / model.maxCost) : 0;

  const maxBoxes = Math.max(BASELINE, maxReq);
  const cur = model;
  const idleCount = TRAFFIC.filter((r) => r === 0).length;

  return (
    <div className="svc">
      <div className="svc-head">
        <h3 className="svc-title">Serverless vs Containers — the same traffic, two cost models</h3>
        <p className="svc-sub">
          Step through a fixed traffic timeline. Containers keep a warm baseline running every slot — paying for idle
          time, no cold starts; serverless scales to zero on idle slots — paying nothing, but pays a cold start when a
          burst follows a gap.
        </p>
      </div>

      <div className="svc-controls">
        <div className="svc-modes">
          <span className="svc-input-label">mode</span>
          <button
            type="button"
            className={`svc-chip ${mode === 'serverless' ? 'is-active' : ''}`}
            onClick={() => setMode('serverless')}
          >
            <Cloud size={13} /> Serverless
          </button>
          <button
            type="button"
            className={`svc-chip ${mode === 'containers' ? 'is-active' : ''}`}
            onClick={() => setMode('containers')}
          >
            <Server size={13} /> Containers
          </button>
        </div>

        <span className="svc-spacer" aria-hidden="true" />

        <button type="button" className="svc-btn svc-btn-primary" onClick={stepTime}>
          {slot === TRAFFIC.length - 1 ? <Play size={14} /> : <ChevronRight size={14} />} Step time
        </button>
        <button type="button" className="svc-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="svc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="svc-svg" preserveAspectRatio="xMidYMid meet">
          {/* traffic bar chart — horizontal time axis is fine for a chart over time */}
          <text className="svc-section-label" x={padX} y={chartY - 18}>traffic — requests per time slot</text>
          <line className="svc-axis-line" x1={padX} y1={chartY + chartH} x2={padX + chartW} y2={chartY + chartH} />
          {TRAFFIC.map((r, i) => {
            const bx = padX + i * (colW + colGap);
            const barH = maxReq > 0 ? (r / maxReq) * (chartH - 24) : 0;
            const by = chartY + chartH - barH;
            const tag = loadTag(r);
            const isCur = i === slot;
            const cold = mode === 'serverless' && isColdStart(i) && i <= slot;
            const idle = mode === 'containers' && r === 0 && i <= slot;
            return (
              <g key={`bar-${i}`}>
                {isCur && (
                  <rect className="svc-cur-band" x={bx - 3} y={chartY - 6} width={colW + 6} height={chartH + 14} rx={7} />
                )}
                {idle && (
                  <rect className="svc-idle-band" x={bx - 3} y={chartY - 6} width={colW + 6} height={chartH + 14} rx={7} />
                )}
                {r > 0 && (
                  <>
                    <rect x={bx} y={by} width={colW} height={barH} rx={5} fill={tag} opacity={isCur ? 1 : 0.55} />
                    <text className="svc-bar-val" x={bx + colW / 2} y={by - 5} style={{ fill: tag }}>{r}</text>
                  </>
                )}
                {r === 0 && (
                  <text className="svc-bar-zero" x={bx + colW / 2} y={chartY + chartH - 6}>0</text>
                )}
                {cold && (
                  <g transform={`translate(${bx + colW / 2 - 7}, ${chartY + 2})`}>
                    <Snowflake width={14} height={14} className="svc-cold-ic" />
                  </g>
                )}
                <text className="svc-slot-label" x={bx + colW / 2} y={chartY + chartH + 18}>t{i}</text>
              </g>
            );
          })}

          {/* current-slot instances — vertical-stacked panel, data flows downward from header to boxes */}
          <text className="svc-section-label" x={padX} y={instY - 16}>
            {mode === 'containers' ? 'containers running this slot' : 'serverless instances this slot'}
          </text>
          <g transform={`translate(${padX}, ${instY})`}>
            <rect
              className={`svc-inst-panel ${cur.curCold ? 'is-cold' : ''} ${cur.curIdle ? 'is-idle' : ''}`}
              x={0}
              y={0}
              width={chartW}
              height={instRowH}
              rx={10}
            />
            <g transform="translate(18, 18)">
              {mode === 'containers'
                ? <Server width={16} height={16} className="svc-mode-ic" />
                : <Cloud width={16} height={16} className="svc-mode-ic" />}
            </g>
            <text className="svc-inst-title" x={42} y={31}>
              slot t{slot} · {cur.curReq} request{cur.curReq === 1 ? '' : 's'}
            </text>
            {cur.curCold && (
              <g transform={`translate(${chartW - 150}, 17)`}>
                <Zap width={14} height={14} className="svc-cold-ic" />
                <text className="svc-tag-cold" x={20} y={12}>cold start</text>
              </g>
            )}
            {cur.curIdle && (
              <text className="svc-tag-idle" x={chartW - 18} y={29}>paying for idle baseline</text>
            )}
            {Array.from({ length: maxBoxes }).map((_, i) => {
              const on = i < cur.curInstances;
              const bx = 18 + i * (boxSize + boxGap);
              const by = 52;
              // for containers, boxes beyond the live request count are idle-but-paid baseline
              const baselineIdle = mode === 'containers' && on && i >= cur.curReq;
              return (
                <g key={`inst-${i}`}>
                  <rect
                    className={`svc-inst-box ${on ? 'is-on' : ''} ${baselineIdle ? 'is-baseline' : ''}`}
                    x={bx}
                    y={by}
                    width={boxSize}
                    height={boxSize}
                    rx={6}
                  />
                  {on && (
                    <g transform={`translate(${bx + 6}, ${by + 6})`}>
                      {mode === 'containers'
                        ? <Server width={14} height={14} className="svc-box-ic" />
                        : <Cloud width={14} height={14} className="svc-box-ic" />}
                    </g>
                  )}
                </g>
              );
            })}
            {cur.curInstances === 0 && (
              <text className="svc-zero-inst" x={18} y={74}>scaled to zero — no cost this slot</text>
            )}
          </g>

          {/* cumulative cost meter */}
          <text className="svc-section-label" x={meterX} y={meterY - 12}>cumulative cost</text>
          <rect className="svc-meter-track" x={meterX} y={meterY} width={meterW} height={meterH} rx={meterH / 2} />
          <rect
            className={`svc-meter-fill ${mode === 'serverless' ? 'is-sl' : 'is-ct'}`}
            x={meterX}
            y={meterY}
            width={Math.max(meterH, meterFill * meterW)}
            height={meterH}
            rx={meterH / 2}
          />
          <text className="svc-meter-val" x={meterX + meterW - 10} y={meterY + meterH - 6}>
            {cur.cost} units
          </text>
        </svg>
      </div>

      <div className="svc-metrics">
        <div className="svc-metric">
          <span className="svc-metric-label">current slot</span>
          <span className="svc-metric-value">t{slot} · {cur.curReq} req</span>
        </div>
        <div className="svc-metric">
          <span className="svc-metric-label">mode</span>
          <span className={`svc-metric-value ${mode === 'serverless' ? 'is-sl' : 'is-ct'}`}>
            {mode === 'serverless' ? 'Serverless (FaaS)' : 'Containers'}
          </span>
        </div>
        <div className="svc-metric">
          <span className="svc-metric-label">cumulative cost</span>
          <span className="svc-metric-value">{cur.cost} units</span>
        </div>
        <div className="svc-metric">
          <span className="svc-metric-label">cold starts so far</span>
          <span className="svc-metric-value is-cold">{mode === 'serverless' ? cur.coldStarts : 0}</span>
        </div>
        <div className="svc-metric">
          <span className="svc-metric-label">idle waste (slots)</span>
          <span className="svc-metric-value is-idle">{mode === 'containers' ? cur.idleWaste : 0}</span>
        </div>
        <div className="svc-metric">
          <span className="svc-metric-label">when it wins</span>
          <span className={`svc-metric-value is-when ${mode === 'serverless' ? 'is-sl' : 'is-ct'}`}>
            {mode === 'serverless' ? 'spiky · low-volume · unpredictable' : 'steady · high-throughput · latency-sensitive'}
          </span>
        </div>
      </div>

      <div className="svc-narration">
        <span className="svc-narration-label">why it matters</span>
        <span className="svc-narration-body">
          The bill follows the traffic shape, not the workload size. Containers bill for every warm instance every
          slot, so idle gaps quietly accumulate cost — but a request always hits a hot process, so latency stays low.
          Serverless bills only per invocation and pays nothing during the {idleCount} idle slots here, at the price of
          a cold start each time a burst follows a gap. Pick serverless for spiky or low-volume traffic where idle
          dominates; pick containers for steady high throughput where cold starts and per-request pricing would hurt.
        </span>
      </div>
    </div>
  );
}
