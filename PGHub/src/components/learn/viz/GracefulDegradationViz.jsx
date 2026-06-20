import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Database, Image, PenSquare, ShieldCheck } from 'lucide-react';
import './GracefulDegradationViz.css';

const TIERS = [
  { id: 'reco', label: 'Personalized recommendations', short: 'recommendations', degradeAt: 60, offAt: 75, degLabel: 'generic top picks', offLabel: 'hidden', icon: Sparkles },
  { id: 'fresh', label: 'Live / fresh content', short: 'live content', degradeAt: 75, offAt: 90, degLabel: 'served from cache (stale)', offLabel: 'snapshot only', icon: Database },
  { id: 'media', label: 'Rich media & images', short: 'rich media', degradeAt: 85, offAt: 100, degLabel: 'low-quality placeholders', offLabel: 'text-only', icon: Image },
  { id: 'writes', label: 'Write operations', short: 'writes', degradeAt: 95, offAt: 110, degLabel: 'queued / delayed', offLabel: 'read-only mode', icon: PenSquare },
  { id: 'core', label: 'Core read / checkout', short: 'core path', degradeAt: 115, offAt: 135, degLabel: 'throttled queue', offLabel: 'overloaded', icon: ShieldCheck },
];

const CAP_MAX = 150;

function stateFor(tier, load) {
  if (load >= tier.offAt) return 'off';
  if (load >= tier.degradeAt) return 'degraded';
  return 'on';
}

function deriveModel(load) {
  const tiers = TIERS.map((t) => {
    const state = stateFor(t, load);
    const detail = state === 'off' ? t.offLabel : state === 'degraded' ? t.degLabel : 'full quality';
    return { ...t, state, detail };
  });
  const on = tiers.filter((t) => t.state === 'on').length;
  const degraded = tiers.filter((t) => t.state === 'degraded').length;
  const off = tiers.filter((t) => t.state === 'off').length;

  const core = tiers.find((t) => t.id === 'core');
  const coreAvailable = core.state !== 'off';
  const coreState = core.state;

  let note;
  if (load < 60) {
    note = `Load ${load}% — comfortably under capacity. Every feature runs at full quality; nothing is shed.`;
  } else if (load < 75) {
    note = `Load ${load}% — first pressure. Recommendations drop personalization and serve generic top picks to free compute for the core path.`;
  } else if (load < 85) {
    note = `Load ${load}% — recommendations are off and live content now serves from cache (stale-but-fast). The core read path is untouched.`;
  } else if (load < 95) {
    note = `Load ${load}% — rich media degrades to low-quality placeholders. Shedding non-essential bandwidth keeps checkout responsive.`;
  } else if (load < 110) {
    note = `Load ${load}% — writes are queued and delayed; the site leans read-heavy. Reads and checkout still complete.`;
  } else if (load < 115) {
    note = `Load ${load}% — read-only mode: writes are rejected, all extras shed. The core path is the last thing standing — and it is.`;
  } else if (load < 135) {
    note = `Load ${load}% — even the core path is throttled into a queue. Requests slow but succeed; the system bends, not breaks.`;
  } else {
    note = `Load ${load}% — capacity exhausted. With every non-essential tier already shed, the core finally saturates. Degrade-first bought every percent of headroom before this point.`;
  }

  return { tiers, on, degraded, off, coreAvailable, coreState, note };
}

export default function GracefulDegradationViz() {
  const [load, setLoad] = useState(35);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const model = useMemo(() => deriveModel(load), [load]);
  const isRunning = isRunningRaw && load < CAP_MAX;
  const delay = Math.round(180 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setLoad((l) => Math.min(l + 1, CAP_MAX));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, load, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setLoad(35);
  };

  const playLabel = isRunningRaw && load < CAP_MAX ? 'Pause' : (load >= CAP_MAX ? 'Replay' : 'Ramp load');

  const W = 940;
  const H = 88 + TIERS.length * 56;
  const gaugeX = 60;
  const gaugeRight = W - 40;
  const gaugeW = gaugeRight - gaugeX;
  const gaugeY = 40;
  const gaugeH = 22;
  const lx = (pct) => gaugeX + (pct / CAP_MAX) * gaugeW;
  const fillW = (load / CAP_MAX) * gaugeW;
  const capX = lx(100);

  const rowsTop = 96;
  const rowH = 48;
  const rowGap = 8;
  const rowX = 60;
  const rowW = W - 100;

  return (
    <div className="gdv">
      <div className="gdv-head">
        <h3 className="gdv-title">Graceful degradation — shed extras, keep the core</h3>
        <p className="gdv-sub">
          Drag the load past each threshold. Non-essential features degrade then drop in priority order
          so the core read / checkout path survives instead of the whole service failing at once.
        </p>
      </div>

      <div className="gdv-controls">
        <label className="gdv-slider">
          <span className="gdv-input-label">load</span>
          <input
            type="range" min={0} max={CAP_MAX} step={1} value={load}
            onChange={(e) => { setIsRunning(false); setLoad(Number(e.target.value)); }}
            className="gdv-range" aria-label="System load percent of capacity"
          />
          <span className="gdv-slider-val">{load}%</span>
        </label>

        <label className="gdv-slider">
          <span className="gdv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="gdv-range" aria-label="Ramp speed"
          />
          <span className="gdv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="gdv-spacer" aria-hidden="true" />

        <div className="gdv-buttons">
          <button
            type="button"
            className="gdv-btn gdv-btn-primary"
            onClick={() => {
              if (load >= CAP_MAX) setLoad(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && load < CAP_MAX ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button type="button" className="gdv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="gdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gdv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="gdv-row-label" x={gaugeX} y={26}>load vs capacity</text>
          <rect className="gdv-gauge-track" x={gaugeX} y={gaugeY} width={gaugeW} height={gaugeH} rx={6} />
          <rect
            className={`gdv-gauge-fill ${load > 100 ? 'is-over' : ''}`}
            x={gaugeX} y={gaugeY} width={Math.max(0, fillW)} height={gaugeH} rx={6}
          />
          <line className="gdv-cap-line" x1={capX} y1={gaugeY - 6} x2={capX} y2={gaugeY + gaugeH + 6} />
          <text className="gdv-cap-label" x={capX} y={gaugeY - 10}>100% capacity</text>

          {TIERS.map((t) => (
            <line
              key={`tick-${t.id}`}
              className="gdv-thresh-tick"
              x1={lx(t.degradeAt)} y1={gaugeY} x2={lx(t.degradeAt)} y2={gaugeY + gaugeH}
            />
          ))}
          <text className="gdv-gauge-val" x={gaugeRight} y={gaugeY + gaugeH + 18} textAnchor="end">
            {load}% of capacity
          </text>

          {model.tiers.map((t, i) => {
            const y = rowsTop + i * (rowH + rowGap);
            const cls = `gdv-tier is-${t.state}${t.id === 'core' ? ' is-core' : ''}`;
            const stateText = t.state === 'on' ? 'ON' : t.state === 'degraded' ? 'DEGRADED' : 'OFF';
            return (
              <g key={t.id}>
                <rect className={cls} x={rowX} y={y} width={rowW} height={rowH} rx={8} />
                <text className="gdv-tier-name" x={rowX + 16} y={y + 20}>{t.label}</text>
                <text className="gdv-tier-detail" x={rowX + 16} y={y + 38}>{t.detail}</text>
                <text className="gdv-tier-thresh" x={rowX + rowW - 130} y={y + rowH / 2 + 4} textAnchor="end">
                  sheds at {t.degradeAt}%
                </text>
                <rect
                  className={`gdv-tier-badge is-${t.state}`}
                  x={rowX + rowW - 110} y={y + rowH / 2 - 13} width={94} height={26} rx={13}
                />
                <text className={`gdv-tier-badge-text is-${t.state}`} x={rowX + rowW - 63} y={y + rowH / 2 + 5}>
                  {stateText}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="gdv-metrics">
        <div className="gdv-metric">
          <span className="gdv-metric-label">load</span>
          <span className="gdv-metric-value">{load}%</span>
        </div>
        <div className="gdv-metric">
          <span className="gdv-metric-label">features on</span>
          <span className="gdv-metric-value is-on">{model.on}</span>
        </div>
        <div className="gdv-metric">
          <span className="gdv-metric-label">degraded</span>
          <span className="gdv-metric-value is-degraded">{model.degraded}</span>
        </div>
        <div className="gdv-metric">
          <span className="gdv-metric-label">off</span>
          <span className="gdv-metric-value is-off">{model.off}</span>
        </div>
        <div className="gdv-metric">
          <span className="gdv-metric-label">core availability</span>
          <span className={`gdv-metric-value ${model.coreAvailable ? (model.coreState === 'degraded' ? 'is-degraded' : 'is-on') : 'is-off'}`}>
            {model.coreAvailable ? (model.coreState === 'degraded' ? 'At risk' : 'Available') : 'Down'}
          </span>
        </div>
      </div>

      <div className="gdv-narration">
        <span className="gdv-narration-label">what just shed</span>
        <span className="gdv-narration-body">{model.note}</span>
      </div>
    </div>
  );
}
