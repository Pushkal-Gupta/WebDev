import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import './OnlineLearningSystemsViz.css';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TICK_MS = 700;
const N = 22;

// Vertical pipeline stages (top -> bottom).
const STAGES = [
  { id: 'events', label: 'Event stream', sub: 'impressions + delayed labels' },
  { id: 'join', label: 'Label join', sub: 'wait for click / chargeback' },
  { id: 'replay', label: 'Replay buffer', sub: 'reservoir mix old + new' },
  { id: 'update', label: 'SGD / FTRL step', sub: 'tiny lr, clipped grad' },
  { id: 'drift', label: 'Drift detector', sub: 'ADWIN / PSI on error' },
  { id: 'model', label: 'Live model', sub: 'serves next prediction' },
];

function buildSeries(seed, withDrift) {
  const rng = mulberry32(seed);
  const errs = [];
  let base = 0.12;
  for (let i = 0; i < N; i += 1) {
    if (withDrift && i === 11) base = 0.34; // regime change
    if (withDrift && i > 11) base = Math.max(0.14, base - 0.018); // recovery as model adapts
    const e = Math.max(0.02, base + (rng() - 0.5) * 0.05);
    errs.push(e);
  }
  return errs;
}

export default function OnlineLearningSystemsViz({ seed = 9 }) {
  const [withDrift, setWithDrift] = useState(true);
  const errs = useMemo(() => buildSeries(seed * 17, withDrift), [seed, withDrift]);

  const [t, setT] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const [prev, setPrev] = useState(errs);
  if (prev !== errs) {
    setPrev(errs);
    setT(0);
    setPlaying(false);
  }

  const atEnd = t >= N - 1;
  const playing = playingRaw && !atEnd;

  const next = useCallback(() => {
    setT((x) => (x >= N - 1 ? x : x + 1));
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    timerRef.current = setTimeout(() => {
      setT((x) => Math.min(x + 1, N - 1));
    }, Math.round(TICK_MS / speed));
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [playing, t, speed]);

  const threshold = 0.25;
  const driftFired = withDrift && t >= 11 && errs[t] > threshold;
  const activeStage = STAGES[t % STAGES.length].id;

  // Pipeline SVG (vertical)
  const PW = 260;
  const boxH = 38;
  const vgap = 16;
  const PH = STAGES.length * (boxH + vgap) + 20;

  // Error chart SVG
  const CW = 260;
  const CH = PH;
  const cPadL = 26;
  const cPadB = 22;
  const cPadT = 14;
  const plotW = CW - cPadL - 8;
  const plotH = CH - cPadT - cPadB;
  const maxE = 0.42;
  const xOf = (i) => cPadL + (i / (N - 1)) * plotW;
  const yOf = (e) => cPadT + plotH - (e / maxE) * plotH;
  const visible = errs.slice(0, t + 1);
  const path = visible.map((e, i) => `${i ? 'L' : 'M'}${xOf(i)},${yOf(e)}`).join(' ');
  const threshY = yOf(threshold);

  return (
    <div className="olsviz">
      <div className="olsviz-header">
        <div className="olsviz-head-left">
          <span className="olsviz-iconbox">
            <Activity size={16} aria-hidden="true" />
          </span>
          <div>
            <div className="olsviz-title">Online learning loop</div>
            <div className="olsviz-sub">Events stream through; the model trains while it serves</div>
          </div>
        </div>
        <button
          type="button"
          className={`olsviz-toggle ${withDrift ? 'olsviz-toggle-on' : ''}`}
          onClick={() => setWithDrift((d) => !d)}
          aria-pressed={withDrift}
        >
          {withDrift ? <AlertTriangle size={14} aria-hidden="true" /> : <ShieldCheck size={14} aria-hidden="true" />}
          <span>{withDrift ? 'Inject drift' : 'Stable traffic'}</span>
        </button>
      </div>

      <div className="olsviz-grid">
        <div className="olsviz-stage">
          <svg viewBox={`0 0 ${PW} ${PH}`} className="olsviz-svg" role="img" aria-label="Vertical pipeline">
            {STAGES.map((s, i) => {
              const y = 8 + i * (boxH + vgap);
              const active = s.id === activeStage;
              const isDrift = s.id === 'drift' && driftFired;
              let cls = 'olsviz-box';
              if (active) cls += ' olsviz-box-active';
              if (isDrift) cls += ' olsviz-box-drift';
              return (
                <g key={s.id}>
                  {i < STAGES.length - 1 && (
                    <line
                      x1={PW / 2}
                      y1={y + boxH}
                      x2={PW / 2}
                      y2={y + boxH + vgap}
                      className="olsviz-flow"
                    />
                  )}
                  {i < STAGES.length - 1 && (
                    <path
                      d={`M ${PW / 2 - 4} ${y + boxH + vgap - 6} L ${PW / 2} ${y + boxH + vgap} L ${PW / 2 + 4} ${y + boxH + vgap - 6} Z`}
                      className="olsviz-flow-head"
                    />
                  )}
                  <rect x={24} y={y} width={PW - 48} height={boxH} rx={7} className={cls} />
                  <text x={PW / 2} y={y + 16} className="olsviz-box-label" textAnchor="middle">
                    {s.label}
                  </text>
                  <text x={PW / 2} y={y + 29} className="olsviz-box-sub" textAnchor="middle">
                    {s.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="olsviz-stage">
          <svg viewBox={`0 0 ${CW} ${CH}`} className="olsviz-svg" role="img" aria-label="Error over time">
            {[0, 0.5, 1].map((f) => {
              const yy = cPadT + plotH - f * plotH;
              return <line key={f} x1={cPadL} y1={yy} x2={CW - 8} y2={yy} className="olsviz-grid-line" />;
            })}
            <line x1={cPadL} y1={threshY} x2={CW - 8} y2={threshY} className="olsviz-thresh" />
            <text x={CW - 10} y={threshY - 4} className="olsviz-thresh-label" textAnchor="end">
              drift threshold
            </text>
            <text x={cPadL - 6} y={cPadT + 4} className="olsviz-axis" textAnchor="end">
              {maxE.toFixed(2)}
            </text>
            <text x={cPadL - 6} y={cPadT + plotH} className="olsviz-axis" textAnchor="end">
              0
            </text>
            <path d={path} className="olsviz-errline" />
            {visible.map((e, i) => (
              <circle
                key={i}
                cx={xOf(i)}
                cy={yOf(e)}
                r={i === t ? 4 : 2}
                className={e > threshold ? 'olsviz-pt olsviz-pt-hot' : 'olsviz-pt'}
              />
            ))}
            <text x={cPadL} y={CH - 6} className="olsviz-axis">
              events →
            </text>
          </svg>
        </div>
      </div>

      <div className="olsviz-stats">
        <div className="olsviz-stat">
          <span className="olsviz-stat-k">events processed</span>
          <span className="olsviz-stat-v">{t + 1}</span>
        </div>
        <div className="olsviz-stat">
          <span className="olsviz-stat-k">live error</span>
          <span className={`olsviz-stat-v ${errs[t] > threshold ? 'olsviz-stat-hot' : ''}`}>
            {(errs[t] * 100).toFixed(1)}%
          </span>
        </div>
        <div className="olsviz-stat">
          <span className="olsviz-stat-k">drift monitor</span>
          <span className={`olsviz-stat-v ${driftFired ? 'olsviz-stat-hot' : 'olsviz-stat-ok'}`}>
            {driftFired ? 'FIRED' : 'calm'}
          </span>
        </div>
      </div>

      <p className={`olsviz-caption ${driftFired ? 'olsviz-caption-bad' : ''}`}>
        {driftFired && <AlertTriangle size={14} aria-hidden="true" />}
        <span>
          {driftFired
            ? 'Error crossed the threshold: the detector fires, the system bumps the learning rate and widens the replay buffer to capture the new regime — then error recovers.'
            : withDrift
              ? 'Each event flows down the loop: join labels, mix into the replay buffer, take one gradient step, and the drift monitor watches the moving error rate.'
              : 'Stable traffic: the moving error rate stays well under the threshold, so the model keeps taking small, safe gradient steps.'}
        </span>
      </p>

      <div className="olsviz-controls">
        <button
          type="button"
          className="olsviz-btn olsviz-btn-ghost"
          onClick={() => {
            setPlaying(false);
            setT(0);
          }}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="olsviz-btn olsviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setT(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button type="button" className="olsviz-btn olsviz-btn-ghost" onClick={next} disabled={atEnd}>
          <SkipForward size={15} aria-hidden="true" />
          <span>Step</span>
        </button>
        <label className="olsviz-speed">
          <span className="olsviz-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="olsviz-speed-range"
          />
          <span className="olsviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="olsviz-step">{t + 1} / {N}</span>
      </div>
    </div>
  );
}
