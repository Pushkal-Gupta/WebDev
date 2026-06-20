import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Send, AlertTriangle, Gauge, Target,
  Activity, BellRing, ShieldCheck,
} from 'lucide-react';
import './ObservabilitySloViz.css';

// SLI / SLO / error budget. One SLI here is success rate: of the requests in a
// rolling window, what fraction returned 2xx. The SLO is a target on that SLI,
// e.g. 99.9% success over the window. The ERROR BUDGET is the allowance of
// failures the SLO permits: budget = (1 - SLO) * total requests. Every failed
// request burns budget; the budget gauge depletes. The BURN RATE is how fast
// you're spending it relative to "even" spend — a burn rate well above 1 means
// you'll exhaust a multi-week budget in hours, which is what should page someone.
//
// Interactive: fire requests one at a time or auto-stream them; flip "inject
// failures" to make a fraction of requests fail, and raise the failure rate.
// Watch the live SLI line track against the SLO threshold, the error-budget bar
// drain, and a fast-burn ALERT fire when the recent burn rate crosses 2x.

const WINDOW = 40; // rolling window of recent requests for the SLI
const BUDGET_TOTAL = WINDOW; // budget expressed in "request slots"; depletes per failure beyond allowance
const SLO_OPTIONS = [0.99, 0.995, 0.999];
const TICK_MS = 650;
const FAST_BURN = 2; // burn-rate multiple that trips the alert
const MAX_POINTS = 60; // SLI history points kept for the line

// Deterministic failure pattern: given the running index and a failure rate,
// decide success/failure without Math.random so runs are reproducible.
// We space failures evenly: fail when (idx * rate) crosses an integer boundary.
function isFailure(idx, ratePct, inject) {
  if (!inject || ratePct <= 0) return false;
  const r = ratePct / 100;
  return Math.floor(idx * r) !== Math.floor((idx - 1) * r);
}

function freshState() {
  return {
    total: 0,
    failures: 0,
    recent: [], // last WINDOW booleans, true = success
    history: [], // SLI samples for the line, %
    note: 'Fire requests. Each one is a success or a failure; the SLI tracks the success rate over a rolling window, measured against the SLO. Inject failures to drain the error budget and trip a fast-burn alert.',
    tone: 'init',
    lastFailed: false,
  };
}

export default function ObservabilitySloViz() {
  const [slo, setSlo] = useState(0.999);
  const [inject, setInject] = useState(false);
  const [failPct, setFailPct] = useState(20);
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [st, setSt] = useState(() => freshState());

  const runTimer = useRef(null);
  const injectRef = useRef(inject);
  const failRef = useRef(failPct);
  const sloRef = useRef(slo);
  useEffect(() => { injectRef.current = inject; }, [inject]);
  useEffect(() => { failRef.current = failPct; }, [failPct]);
  useEffect(() => { sloRef.current = slo; }, [slo]);

  const delay = useMemo(() => Math.round(TICK_MS / Math.max(speed, 0.1)), [speed]);

  // One request reducer. Pure-ish over prev state.
  const fireOne = (prev) => {
    const s = { ...prev, recent: [...prev.recent], history: [...prev.history] };
    const idx = s.total + 1;
    const failed = isFailure(idx, failRef.current, injectRef.current);
    s.total = idx;
    if (failed) s.failures += 1;
    s.lastFailed = failed;
    s.recent.push(!failed);
    if (s.recent.length > WINDOW) s.recent.shift();

    const succ = s.recent.filter(Boolean).length;
    const sli = s.recent.length ? (succ / s.recent.length) * 100 : 100;
    s.history.push(sli);
    if (s.history.length > MAX_POINTS) s.history.shift();

    const sloPct = sloRef.current * 100;
    // allowed failures in window = (1 - slo) * window
    const allowed = (1 - sloRef.current) * s.recent.length;
    const windowFails = s.recent.filter((ok) => !ok).length;
    const burn = allowed > 0 ? windowFails / allowed : (windowFails > 0 ? Infinity : 0);

    if (sli < sloPct) {
      if (burn >= FAST_BURN) {
        s.tone = 'alert';
        s.note = `Fast burn. The window success rate ${sli.toFixed(1)}% is below the ${sloPct.toFixed(1)}% SLO and failures are arriving ${burn === Infinity ? 'far' : `${burn.toFixed(1)}x`} faster than the budget can absorb. A multi-week error budget at this rate is gone in hours — this is what pages an on-call engineer.`;
      } else {
        s.tone = 'warn';
        s.note = `SLO breached. Success rate ${sli.toFixed(1)}% has dipped under the ${sloPct.toFixed(1)}% target. The error budget is draining; if the burn rate stays under ${FAST_BURN}x it is a slow leak, not yet a page.`;
      }
    } else {
      s.tone = failed ? 'warn' : 'ok';
      s.note = failed
        ? `A request failed, nudging the SLI down to ${sli.toFixed(1)}% — still above the ${sloPct.toFixed(1)}% SLO, so the failure is absorbed by the error budget rather than breaching it.`
        : `Request #${idx} succeeded. Window SLI ${sli.toFixed(1)}% sits comfortably above the ${sloPct.toFixed(1)}% SLO; the error budget is intact.`;
    }
    return s;
  };

  // autoplay stream
  useEffect(() => {
    if (!autoplay) return undefined;
    runTimer.current = setInterval(() => {
      setSt((prev) => fireOne(prev));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearInterval(runTimer.current);
        runTimer.current = null;
      }
    };
    // fireOne reads live config via refs.
  }, [autoplay, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
  }, []);

  const reset = () => {
    setAutoplay(false);
    if (runTimer.current) {
      clearInterval(runTimer.current);
      runTimer.current = null;
    }
    setSt(freshState());
  };

  // ---- derived ----
  const sloPct = slo * 100;
  const succWin = st.recent.filter(Boolean).length;
  const sli = st.recent.length ? (succWin / st.recent.length) * 100 : 100;
  const windowFails = st.recent.filter((ok) => !ok).length;
  const allowed = (1 - slo) * Math.max(st.recent.length, 1);
  const budgetUsed = allowed > 0 ? Math.min(1, windowFails / allowed) : (windowFails > 0 ? 1 : 0);
  const budgetLeft = Math.max(0, 1 - budgetUsed);
  const burn = allowed > 0 ? windowFails / allowed : (windowFails > 0 ? Infinity : 0);
  const burning = burn >= FAST_BURN && sli < sloPct;
  const breached = sli < sloPct;

  // ---- SVG geometry ----
  const W = 960;
  const H = 420;

  // SLI line chart region (left/main)
  const chartX0 = 60;
  const chartY0 = 50;
  const chartW = 560;
  const chartH = 250;
  const chartX1 = chartX0 + chartW;
  const chartY1 = chartY0 + chartH;
  // y maps a % in [yMin..100] to pixels. Zoom into the high range so the SLO
  // threshold and SLI dips are visible.
  const yMin = Math.min(sloPct - 1.5, 95);
  const pctToY = (p) => {
    const clamped = Math.max(yMin, Math.min(100, p));
    return chartY1 - ((clamped - yMin) / Math.max(0.001, 100 - yMin)) * chartH;
  };
  const sloY = pctToY(sloPct);

  const points = st.history;
  const linePath = points.length > 1
    ? points.map((p, i) => {
      const x = chartX0 + (i / Math.max(1, points.length - 1)) * chartW;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${pctToY(p).toFixed(1)}`;
    }).join(' ')
    : '';

  // error budget gauge (right)
  const gx = chartX1 + 70;
  const gw = W - gx - 40;
  const gyTop = chartY0 + 24;
  const gaugeH = 150;
  const fillH = gaugeH * budgetLeft;

  const narrTone = st.tone === 'alert' ? 'is-bad' : st.tone === 'warn' ? 'is-warn' : st.tone === 'ok' ? 'is-ok' : '';
  const narrLabel = st.tone === 'alert' ? 'fast burn alert'
    : st.tone === 'warn' ? 'budget burning'
      : st.tone === 'ok' ? 'within SLO' : 'ready';

  return (
    <div className="oslo">
      <div className="oslo-head">
        <h3 className="oslo-title">SLO and error budget — measuring reliability you can spend</h3>
        <p className="oslo-sub">
          The SLI tracks success rate over a rolling window against an SLO target. Failures burn the error
          budget; when they arrive faster than the budget can absorb, a fast-burn alert fires. Inject
          failures and watch all three move together.
        </p>
      </div>

      <div className="oslo-controls">
        <div className="oslo-slo" role="group" aria-label="SLO target">
          <span className="oslo-input-label">slo</span>
          {SLO_OPTIONS.map((o) => (
            <button
              key={o}
              type="button"
              className={`oslo-slo-btn ${slo === o ? 'is-on' : ''}`}
              onClick={() => { setSlo(o); }}
              aria-pressed={slo === o}
            >
              {(o * 100).toFixed(o >= 0.999 ? 1 : 1)}%
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`oslo-toggle ${inject ? 'is-on is-bad' : ''}`}
          onClick={() => setInject((v) => !v)}
          aria-pressed={inject}
          title="Make a fraction of requests fail"
        >
          <AlertTriangle size={13} /> inject failures
        </button>

        <label className="oslo-fail">
          <span className="oslo-input-label">fail %</span>
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={failPct}
            onChange={(e) => setFailPct(Number(e.target.value))}
            className="oslo-fail-range"
            disabled={!inject}
            aria-label="Failure rate percent"
          />
          <span className="oslo-fail-value">{failPct}%</span>
        </label>

        <label className="oslo-speed">
          <span className="oslo-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="oslo-speed-range"
            aria-label="Stream speed"
          />
          <span className="oslo-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="oslo-spacer" aria-hidden="true" />

        <div className="oslo-buttons">
          <button
            type="button"
            className="oslo-btn oslo-btn-primary"
            onClick={() => setSt((prev) => fireOne(prev))}
            disabled={autoplay}
            title="Send one request through"
          >
            <Send size={14} /> Fire request
          </button>
          <button
            type="button"
            className={`oslo-btn ${autoplay ? 'oslo-btn-on' : ''}`}
            onClick={() => setAutoplay((v) => !v)}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Stop stream' : 'Auto stream'}
          </button>
          <button type="button" className="oslo-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="oslo-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="oslo-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- SLI line chart ---- */}
          <text className="oslo-region-label" x={chartX0} y={chartY0 - 18} textAnchor="start">
            SLI — success rate over the rolling window
          </text>
          {/* axes */}
          <line className="oslo-axis" x1={chartX0} y1={chartY0} x2={chartX0} y2={chartY1} />
          <line className="oslo-axis" x1={chartX0} y1={chartY1} x2={chartX1} y2={chartY1} />
          {/* y ticks */}
          {[100, (100 + yMin) / 2, yMin].map((p, i) => (
            <g key={`yt-${i}`}>
              <line className="oslo-grid" x1={chartX0} y1={pctToY(p)} x2={chartX1} y2={pctToY(p)} />
              <text className="oslo-axis-tick" x={chartX0 - 6} y={pctToY(p) + 3} textAnchor="end">{`${p.toFixed(2)}%`}</text>
            </g>
          ))}

          {/* SLO threshold line */}
          <line className="oslo-slo-line" x1={chartX0} y1={sloY} x2={chartX1} y2={sloY} />
          <text className="oslo-slo-label" x={chartX1 - 4} y={sloY - 6} textAnchor="end">{`SLO ${sloPct.toFixed(1)}%`}</text>

          {/* shaded breach band below SLO */}
          <rect className="oslo-breach-band" x={chartX0} y={sloY} width={chartW} height={Math.max(0, chartY1 - sloY)} />

          {/* SLI line */}
          {linePath && <path className={`oslo-sli-line ${breached ? 'is-breach' : ''}`} d={linePath} fill="none" />}
          {/* current point */}
          {points.length > 0 && (
            <circle
              className={`oslo-sli-dot ${breached ? 'is-breach' : 'is-ok'}`}
              cx={chartX0 + chartW}
              cy={pctToY(points[points.length - 1])}
              r={5}
            />
          )}
          {points.length === 0 && (
            <text className="oslo-empty" x={chartX0 + 14} y={chartY0 + 30} textAnchor="start">
              fire requests — the SLI line builds left to right
            </text>
          )}

          {/* ---- error budget gauge ---- */}
          <text className="oslo-region-label" x={gx} y={chartY0 - 18} textAnchor="start">error budget</text>
          <rect className="oslo-gauge-track" x={gx} y={gyTop} width={gw} height={gaugeH} rx={8} />
          <rect
            className={`oslo-gauge-fill ${burning ? 'is-burning' : budgetLeft < 0.34 ? 'is-low' : ''}`}
            x={gx}
            y={gyTop + (gaugeH - fillH)}
            width={gw}
            height={fillH}
            rx={8}
          />
          <text className="oslo-gauge-pct" x={gx + gw / 2} y={gyTop + gaugeH / 2} textAnchor="middle">
            {`${(budgetLeft * 100).toFixed(0)}%`}
          </text>
          <text className="oslo-gauge-sub" x={gx + gw / 2} y={gyTop + gaugeH + 18} textAnchor="middle">
            {`${windowFails} / ${allowed.toFixed(1)} allowed fails`}
          </text>

          {/* burn-rate readout + alert badge */}
          <text className="oslo-region-label" x={gx} y={gyTop + gaugeH + 48} textAnchor="start">burn rate</text>
          <text className={`oslo-burn ${burning ? 'is-bad' : ''}`} x={gx} y={gyTop + gaugeH + 76} textAnchor="start">
            {burn === Infinity ? '∞' : `${burn.toFixed(1)}x`}
          </text>
          {burning && (
            <g>
              <rect className="oslo-alert" x={gx + 70} y={gyTop + gaugeH + 54} width={gw - 70} height={30} rx={6} />
              <text className="oslo-alert-t" x={gx + 70 + (gw - 70) / 2} y={gyTop + gaugeH + 73} textAnchor="middle">
                PAGE: fast burn
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="oslo-metrics">
        <div className="oslo-metric">
          <span className="oslo-metric-label">requests</span>
          <span className="oslo-metric-value">{st.total}</span>
        </div>
        <div className="oslo-metric">
          <span className="oslo-metric-label">window SLI</span>
          <span className={`oslo-metric-value ${breached ? 'is-bad' : 'is-ok'}`}>{`${sli.toFixed(2)}%`}</span>
        </div>
        <div className="oslo-metric">
          <span className="oslo-metric-label">SLO target</span>
          <span className="oslo-metric-value">{`${sloPct.toFixed(1)}%`}</span>
        </div>
        <div className="oslo-metric">
          <span className="oslo-metric-label">budget left</span>
          <span className={`oslo-metric-value ${budgetLeft < 0.34 ? 'is-bad' : budgetLeft < 0.67 ? 'is-warn' : 'is-ok'}`}>{`${(budgetLeft * 100).toFixed(0)}%`}</span>
        </div>
        <div className="oslo-metric">
          <span className="oslo-metric-label">burn rate</span>
          <span className={`oslo-metric-value ${burning ? 'is-bad' : ''}`}>{burn === Infinity ? '∞' : `${burn.toFixed(1)}x`}</span>
        </div>
        <div className="oslo-metric oslo-metric-dim">
          <span className="oslo-metric-label">alert</span>
          <span className={`oslo-metric-value ${burning ? 'is-bad' : 'is-ok'}`}>{burning ? 'firing' : 'quiet'}</span>
        </div>
      </div>

      <div className={`oslo-narration ${narrTone}`}>
        <span className={`oslo-narration-label ${narrTone}`}>{narrLabel}</span>
        <span className="oslo-narration-body">{st.note}</span>
      </div>

      <div className="oslo-legend">
        <span className="oslo-legend-item"><Activity size={13} className="oslo-ic" /> SLI — the measured success rate</span>
        <span className="oslo-legend-item"><Target size={13} className="oslo-ic is-accent" /> SLO — the target the SLI must clear</span>
        <span className="oslo-legend-item"><Gauge size={13} className="oslo-ic is-warn" /> error budget = (1 − SLO) × window</span>
        <span className="oslo-legend-item"><BellRing size={13} className="oslo-ic is-bad" /> fast burn (≥ 2x) pages on-call</span>
        <span className="oslo-legend-item"><ShieldCheck size={13} className="oslo-ic is-ok" /> within SLO — budget intact</span>
      </div>
    </div>
  );
}
