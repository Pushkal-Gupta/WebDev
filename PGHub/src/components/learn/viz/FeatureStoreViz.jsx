import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck, AlertTriangle, Database, Zap } from 'lucide-react';
import './FeatureStoreViz.css';

const MODES = [
  { id: 'shared', label: 'SHARED TRANSFORM' },
  { id: 'dup', label: 'DUPLICATED LOGIC' },
];

const FEATURE = 'user_avg_purchase_7d';

const PIT_EVENTS = [
  { t: 1, amt: 40 },
  { t: 2, amt: 55 },
  { t: 4, amt: 30 },
  { t: 5, amt: 70 },
  { t: 7, amt: 25 },
];
const LABEL_CUTOFF = 6;
const T_MAX = 8;

function buildFrames(mode) {
  const frames = [];
  const skew = mode === 'dup';

  const inWindow = PIT_EVENTS.filter((e) => e.t <= LABEL_CUTOFF);
  const offlineVal = inWindow.reduce((s, e) => s + e.amt, 0) / inWindow.length;
  const onlineVal = skew
    ? PIT_EVENTS.reduce((s, e) => s + e.amt, 0) / PIT_EVENTS.length
    : offlineVal;

  const snap = (extra) => ({
    stage: 'idle',
    offlineLit: false,
    onlineLit: false,
    trainLit: false,
    serveLit: false,
    pitLit: false,
    offlineVal,
    onlineVal,
    skew,
    ...extra,
  });

  frames.push(snap({
    stage: 'define',
    note: skew
      ? `One feature definition — ${FEATURE} — but the serving path re-implements its own ad-hoc version. The two computations will drift apart.`
      : `One feature definition — ${FEATURE} — written once. The same transformation will feed both training and serving, so the model never sees two different versions of it.`,
  }));

  frames.push(snap({
    stage: 'materialize',
    offlineLit: true,
    onlineLit: true,
    note: `Materialize: the transformation runs once over the event log and writes ${offlineVal.toFixed(1)} to BOTH stores. Offline (columnar warehouse) keeps full history; online (key-value) keeps only the latest value per key.`,
  }));

  frames.push(snap({
    stage: 'pit',
    offlineLit: true,
    pitLit: true,
    note: `Training reads the OFFLINE store with a point-in-time join: only events at or before the label cutoff (t=${LABEL_CUTOFF}) count, so feature value ${offlineVal.toFixed(1)} carries no future leakage from t=7.`,
  }));

  frames.push(snap({
    stage: 'train',
    offlineLit: true,
    pitLit: true,
    trainLit: true,
    note: `Train: the model learns on ${offlineVal.toFixed(1)} from the offline store. High latency, large throughput, freshness measured in hours — fine for batch training.`,
  }));

  frames.push(snap({
    stage: 'serve',
    onlineLit: true,
    serveLit: true,
    note: skew
      ? `Serve: the request path recomputes its own value ${onlineVal.toFixed(1)} (it forgot the t=${LABEL_CUTOFF} cutoff and averaged all events). The model trained on ${offlineVal.toFixed(1)} but sees ${onlineVal.toFixed(1)} in production.`
      : `Serve: inference reads the ONLINE store in milliseconds and gets ${onlineVal.toFixed(1)} — the exact value materialized from the same transformation. Latest value only, sub-millisecond lookup.`,
  }));

  frames.push(snap({
    stage: 'verdict',
    offlineLit: true,
    onlineLit: true,
    trainLit: true,
    serveLit: true,
    pitLit: true,
    note: skew
      ? `Train/serve SKEW: training saw ${offlineVal.toFixed(1)}, serving saw ${onlineVal.toFixed(1)}. The model degrades silently in production because the feature it relies on no longer matches what it learned.`
      : `No skew: training and serving both consume ${offlineVal.toFixed(1)} from one shared transformation. The model sees identical feature values in training and production — the whole point of a feature store.`,
  }));

  return frames;
}

export default function FeatureStoreViz() {
  const [mode, setMode] = useState('shared');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode), [mode]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const W = 940;
  const H = 380;

  const axisLeft = 110;
  const axisRight = W - 40;
  const axisY = 330;
  const axisW = axisRight - axisLeft;
  const tx = (t) => axisLeft + (t / T_MAX) * axisW;

  const srcX = 70;
  const srcY = 90;
  const srcW = 150;
  const srcH = 64;

  const offX = 360;
  const offY = 40;
  const onX = 360;
  const onY = 150;
  const storeW = 200;
  const storeH = 70;

  const trainX = 700;
  const serveX = 700;
  const sinkW = 170;
  const sinkH = 70;

  const skewActive = current.skew && current.stage === 'verdict';

  return (
    <div className="fsv">
      <div className="fsv-head">
        <h3 className="fsv-title">Feature store — one transformation, two paths</h3>
        <p className="fsv-sub">
          Step a single feature from definition through materialization into the offline and online
          stores, then watch training and serving consume it — and see what breaks when the logic is duplicated.
        </p>
      </div>

      <div className="fsv-controls">
        <div className="fsv-modes" role="tablist" aria-label="Feature pipeline mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`fsv-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="fsv-slider">
          <span className="fsv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="fsv-range" aria-label="Playback speed"
          />
          <span className="fsv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="fsv-spacer" aria-hidden="true" />

        <div className="fsv-buttons">
          <button
            type="button"
            className="fsv-btn fsv-btn-primary"
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
            className="fsv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="fsv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="fsv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="fsv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="fsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fsv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="fsv-row-label" x={srcX} y={28}>feature definition</text>

          <rect
            className={`fsv-node fsv-node-src ${current.stage === 'define' || current.stage === 'materialize' ? 'is-active' : ''}`}
            x={srcX} y={srcY} width={srcW} height={srcH} rx={10}
          />
          <text className="fsv-node-title" x={srcX + srcW / 2} y={srcY + 26}>transform</text>
          <text className="fsv-node-sub" x={srcX + srcW / 2} y={srcY + 46}>{FEATURE}</text>

          {/* split edge to both stores */}
          <path
            className={`fsv-edge ${current.offlineLit ? 'is-lit' : ''}`}
            d={`M ${srcX + srcW} ${srcY + srcH / 2} C ${offX - 70} ${srcY + srcH / 2}, ${offX - 70} ${offY + storeH / 2}, ${offX} ${offY + storeH / 2}`}
          />
          <path
            className={`fsv-edge ${current.onlineLit ? 'is-lit' : ''} ${current.skew ? 'is-skew' : ''}`}
            d={`M ${srcX + srcW} ${srcY + srcH / 2} C ${onX - 70} ${srcY + srcH / 2}, ${onX - 70} ${onY + storeH / 2}, ${onX} ${onY + storeH / 2}`}
          />

          {/* offline store */}
          <rect
            className={`fsv-store fsv-store-offline ${current.offlineLit ? 'is-lit' : ''}`}
            x={offX} y={offY} width={storeW} height={storeH} rx={9}
          />
          <Database className="fsv-icon" x={offX + 14} y={offY + 14} width={22} height={22} />
          <text className="fsv-store-title" x={offX + 46} y={offY + 26}>OFFLINE store</text>
          <text className="fsv-store-sub" x={offX + 46} y={offY + 44}>columnar · full history · hours</text>
          <text className="fsv-store-val" x={offX + storeW - 14} y={offY + 44}>{current.offlineVal.toFixed(1)}</text>

          {/* online store */}
          <rect
            className={`fsv-store fsv-store-online ${current.onlineLit ? 'is-lit' : ''} ${current.skew ? 'is-skew' : ''}`}
            x={onX} y={onY} width={storeW} height={storeH} rx={9}
          />
          <Zap className="fsv-icon" x={onX + 14} y={onY + 14} width={22} height={22} />
          <text className="fsv-store-title" x={onX + 46} y={onY + 26}>ONLINE store</text>
          <text className="fsv-store-sub" x={onX + 46} y={onY + 44}>key-value · latest only · ms</text>
          <text className="fsv-store-val" x={onX + storeW - 14} y={onY + 44}>{current.onlineVal.toFixed(1)}</text>

          {/* edges to sinks */}
          <path
            className={`fsv-edge ${current.trainLit ? 'is-lit' : ''}`}
            d={`M ${offX + storeW} ${offY + storeH / 2} L ${trainX} ${offY + storeH / 2}`}
          />
          <path
            className={`fsv-edge ${current.serveLit ? 'is-lit' : ''} ${current.skew ? 'is-skew' : ''}`}
            d={`M ${onX + storeW} ${onY + storeH / 2} L ${serveX} ${onY + storeH / 2}`}
          />

          {/* train sink */}
          <rect
            className={`fsv-node fsv-node-train ${current.trainLit ? 'is-active' : ''}`}
            x={trainX} y={offY} width={sinkW} height={sinkH} rx={10}
          />
          <text className="fsv-node-title" x={trainX + sinkW / 2} y={offY + 26}>TRAINING</text>
          <text className="fsv-node-sub" x={trainX + sinkW / 2} y={offY + 46}>batch · point-in-time</text>

          {/* serve sink */}
          <rect
            className={`fsv-node fsv-node-serve ${current.serveLit ? 'is-active' : ''} ${current.skew ? 'is-skew' : ''}`}
            x={serveX} y={onY} width={sinkW} height={sinkH} rx={10}
          />
          <text className="fsv-node-title" x={serveX + sinkW / 2} y={onY + 26}>INFERENCE</text>
          <text className="fsv-node-sub" x={serveX + sinkW / 2} y={onY + 46}>request · millisecond</text>

          {/* point-in-time timeline */}
          <text className="fsv-row-label" x={axisLeft} y={axisY - 56}>point-in-time join (offline) — events at or before label cutoff</text>
          <line className="fsv-axis" x1={axisLeft} y1={axisY} x2={axisRight} y2={axisY} />
          {Array.from({ length: T_MAX + 1 }).map((_, t) => (
            <g key={`tick-${t}`}>
              <line className="fsv-tick" x1={tx(t)} y1={axisY} x2={tx(t)} y2={axisY + 6} />
              <text className="fsv-tick-label" x={tx(t)} y={axisY + 20}>{t}</text>
            </g>
          ))}

          {current.pitLit && (
            <rect
              className="fsv-pit-band"
              x={axisLeft}
              y={axisY - 40}
              width={tx(LABEL_CUTOFF) - axisLeft}
              height={40}
              rx={5}
            />
          )}
          <line
            className={`fsv-cutoff ${current.pitLit ? 'is-lit' : ''}`}
            x1={tx(LABEL_CUTOFF)} y1={axisY - 48} x2={tx(LABEL_CUTOFF)} y2={axisY + 6}
          />
          <text className={`fsv-cutoff-label ${current.pitLit ? 'is-lit' : ''}`} x={tx(LABEL_CUTOFF)} y={axisY - 52}>
            label t={LABEL_CUTOFF}
          </text>

          {PIT_EVENTS.map((e, i) => {
            const included = e.t <= LABEL_CUTOFF;
            const cls = [
              'fsv-event',
              current.pitLit && included && 'is-in',
              current.pitLit && !included && 'is-leak',
            ].filter(Boolean).join(' ');
            return (
              <g key={`ev-${i}`}>
                <circle className={cls} cx={tx(e.t)} cy={axisY - 20} r={7} />
                <text className="fsv-event-amt" x={tx(e.t)} y={axisY - 16}>{e.amt}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fsv-metrics">
        <div className="fsv-metric">
          <span className="fsv-metric-label">mode</span>
          <span className="fsv-metric-value">{mode === 'shared' ? 'shared transform' : 'duplicated logic'}</span>
        </div>
        <div className="fsv-metric">
          <span className="fsv-metric-label">offline freshness</span>
          <span className="fsv-metric-value">~hours</span>
        </div>
        <div className="fsv-metric">
          <span className="fsv-metric-label">online freshness</span>
          <span className="fsv-metric-value">~seconds</span>
        </div>
        <div className="fsv-metric">
          <span className="fsv-metric-label">train latency</span>
          <span className="fsv-metric-value">batch</span>
        </div>
        <div className="fsv-metric">
          <span className="fsv-metric-label">serve latency</span>
          <span className="fsv-metric-value">~2 ms</span>
        </div>
        <div className="fsv-metric">
          <span className="fsv-metric-label">train value</span>
          <span className="fsv-metric-value">{current.offlineVal.toFixed(1)}</span>
        </div>
        <div className="fsv-metric">
          <span className="fsv-metric-label">serve value</span>
          <span className={`fsv-metric-value ${skewActive ? 'is-skew' : ''}`}>{current.onlineVal.toFixed(1)}</span>
        </div>
        <div className="fsv-metric">
          <span className="fsv-metric-label">skew status</span>
          <span className={`fsv-metric-value fsv-skew-tag ${current.skew ? 'is-skew' : 'is-clean'}`}>
            {current.skew ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
            {current.skew ? 'present' : 'none'}
          </span>
        </div>
      </div>

      <div className={`fsv-narration ${skewActive ? 'is-skew' : ''}`}>
        <span className="fsv-narration-label">trace</span>
        <span className="fsv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
