import React, { useMemo, useState } from 'react';
import { Clock, Timer, Check, AlertTriangle, RotateCcw, StepForward } from 'lucide-react';
import './SpannerTruetimeViz.css';

// Google Spanner TrueTime — physical clocks are never exact, so TrueTime.now()
// returns an INTERVAL [earliest, latest] with the truth somewhere inside, bounded
// by uncertainty epsilon (e). To guarantee external consistency (if T1 commits
// before T2 starts, T1's timestamp < T2's), a transaction picks a commit
// timestamp s and then COMMIT-WAITS: it sleeps until TrueTime says s is definitely
// in the past everywhere (now.earliest > s), so no later reader can disagree.

// Deterministic timeline. Two transactions on a fixed schedule (ms).
// T1 acquires its commit timestamp, then waits out epsilon before releasing.
const T1_PICK = 100; // ms — T1 chooses commit timestamp s1 = T1_PICK
const T2_START = 100; // ms — T2 begins right as T1 picks (the contended case)

const PHASES = [
  { label: 'idle', desc: 'No transaction running yet.' },
  { label: 'T1 picks s', desc: 'T1 reads TrueTime.now() and sets commit timestamp s = now.latest.' },
  { label: 'T1 commit-wait', desc: 'T1 sleeps until now.earliest > s — s is now in the past everywhere.' },
  { label: 'T1 released', desc: 'T1 visible. T2 reads TrueTime; its timestamp must exceed s.' },
];

export default function SpannerTruetimeViz() {
  const [epsilon, setEpsilon] = useState(7); // ms uncertainty bound
  const [phase, setPhase] = useState(0);

  const model = useMemo(() => {
    // s = T1's chosen commit timestamp = latest bound at pick time.
    const s = T1_PICK + epsilon;
    // commit-wait runs until now.earliest > s, i.e. (wallClock - e) > s
    // => wallClock > s + e => release at s + e = T1_PICK + 2e.
    const commitWait = 2 * epsilon; // duration from pick to release
    const releaseAt = T1_PICK + commitWait;
    // T2 starts at T2_START; it can only commit after T1 released and with
    // a timestamp strictly greater than s.
    const ordered = releaseAt <= T2_START + 1000; // always true here; guarantee holds when commit-wait completes
    const guaranteed = phase >= 3;
    return { s, commitWait, releaseAt, ordered, guaranteed };
  }, [epsilon, phase]);

  const reset = () => {
    setEpsilon(7);
    setPhase(0);
  };

  const step = () => setPhase((p) => (p + 1) % PHASES.length);

  // SVG geometry — vertical time axis flowing TOP (t=0) to BOTTOM (later).
  const W = 940;
  const H = 470;
  const axisX = 150;
  const topY = 56;
  const botY = H - 40;
  const tMax = 160; // ms shown
  const yOf = (t) => topY + ((botY - topY) * t) / tMax;

  const bandW = 240; // uncertainty band width on the axis
  const bandX = axisX - bandW / 2;

  // T1 pick instant and its uncertainty band [s-? , s] — at pick, now in [pick, pick+e]
  const pickY = yOf(T1_PICK);
  const sY = yOf(model.s);
  const releaseY = yOf(model.releaseAt);
  const t2Y = yOf(T2_START);

  const showWaitBand = phase >= 2;
  const showRelease = phase >= 3;

  return (
    <div className="stt">
      <div className="stt-head">
        <h3 className="stt-title">TrueTime — commit-wait turns clock uncertainty into ordering</h3>
        <p className="stt-sub">
          TrueTime returns an interval, not an instant: the true moment lies within ±e. A commit waits out that
          uncertainty so its timestamp is in the past everywhere before the write is released.
        </p>
      </div>

      <div className="stt-controls">
        <button type="button" className="stt-btn stt-btn-primary" onClick={step}>
          <StepForward size={14} /> Step ({PHASES[phase].label})
        </button>

        <span className="stt-slider">
          <span className="stt-input-label">uncertainty e</span>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={epsilon}
            onChange={(ev) => setEpsilon(Number(ev.target.value))}
            className="stt-range"
            aria-label="Uncertainty bound epsilon"
          />
          <span className="stt-slider-val">{epsilon} ms</span>
        </span>

        <span className="stt-spacer" aria-hidden="true" />

        <button type="button" className="stt-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="stt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="stt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="stt-band-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-pink)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--hue-pink)" stopOpacity="0.28" />
            </linearGradient>
          </defs>

          {/* vertical time axis (top = t0, downward = later) */}
          <text className="stt-axis-cap" x={axisX} y={topY - 18}>t = 0</text>
          <line className="stt-axis" x1={axisX} y1={topY} x2={axisX} y2={botY} />
          <polygon
            className="stt-axis-arrow"
            points={`${axisX - 5},${botY - 2} ${axisX + 5},${botY - 2} ${axisX},${botY + 8}`}
          />
          <text className="stt-axis-cap" x={axisX} y={botY + 26}>time →</text>

          {/* T1 pick instant + its uncertainty interval [pick, s] */}
          <rect
            className="stt-uncert"
            x={bandX}
            y={pickY}
            width={bandW}
            height={Math.max(2, sY - pickY)}
            rx={6}
          />
          <line className="stt-event stt-event-pick" x1={bandX} y1={pickY} x2={bandX + bandW} y2={pickY} />
          <text className="stt-evt-label" x={bandX + bandW + 12} y={pickY + 4}>
            now.earliest (pick) = {T1_PICK} ms
          </text>
          <line className="stt-event stt-event-s" x1={bandX} y1={sY} x2={bandX + bandW} y2={sY} />
          <text className="stt-evt-label is-s" x={bandX + bandW + 12} y={sY + 4}>
            s = commit timestamp = {model.s} ms
          </text>

          {/* commit-wait band [s, releaseAt] */}
          {showWaitBand && (
            <>
              <rect
                className="stt-wait"
                x={bandX}
                y={sY}
                width={bandW}
                height={Math.max(2, releaseY - sY)}
                rx={6}
              />
              <text className="stt-wait-label" x={bandX + bandW / 2} y={(sY + releaseY) / 2 + 4}>
                commit-wait {model.commitWait} ms
              </text>
            </>
          )}

          {/* release line */}
          {showRelease && (
            <>
              <line
                className="stt-event stt-event-rel"
                x1={bandX}
                y1={releaseY}
                x2={bandX + bandW}
                y2={releaseY}
              />
              <text className="stt-evt-label is-rel" x={bandX + bandW + 12} y={releaseY + 4}>
                released — now.earliest &gt; s = {model.releaseAt} ms
              </text>
            </>
          )}

          {/* T2 marker on the right gutter */}
          <line className="stt-event stt-event-t2" x1={axisX - bandW / 2 - 30} y1={t2Y} x2={axisX - 12} y2={t2Y} />
          <text className="stt-evt-label is-t2" x={axisX - bandW / 2 - 36} y={t2Y + 4} textAnchor="end">
            T2 starts {T2_START} ms
          </text>

          {/* legend / current phase */}
          <text className="stt-phase" x={W - 24} y={topY - 18}>
            {PHASES[phase].desc}
          </text>
        </svg>
      </div>

      <div className="stt-metrics">
        <div className="stt-metric">
          <span className="stt-metric-label">uncertainty e</span>
          <span className="stt-metric-value">±{epsilon} ms</span>
        </div>
        <div className="stt-metric">
          <span className="stt-metric-label">commit timestamp s</span>
          <span className="stt-metric-value is-s">{model.s} ms</span>
        </div>
        <div className="stt-metric">
          <span className="stt-metric-label">commit-wait</span>
          <span className="stt-metric-value is-wait">{model.commitWait} ms (2e)</span>
        </div>
        <div className="stt-metric">
          <span className="stt-metric-label">released at</span>
          <span className="stt-metric-value is-rel">{model.releaseAt} ms</span>
        </div>
        <div className="stt-metric">
          <span className="stt-metric-label">ordering guaranteed?</span>
          <span className={`stt-metric-value ${model.guaranteed ? 'is-ok' : 'is-warn'}`}>
            {model.guaranteed ? (
              <><Check size={13} /> yes</>
            ) : (
              <><AlertTriangle size={13} /> not yet</>
            )}
          </span>
        </div>
      </div>

      <div className="stt-narration">
        <span className="stt-narration-label">why it matters</span>
        <span className="stt-narration-body">
          A single timestamp from an imperfect clock can lie — two servers a few ms apart could disagree on
          which write came first. TrueTime makes the error explicit as an interval ±{epsilon} ms, and commit-wait
          spends exactly {model.commitWait} ms (2e) so that by release time every node's clock has moved past s.
          Any later transaction therefore reads a timestamp strictly greater than s, giving Spanner external
          consistency — a global ordering that matches real wall-clock order — at the cost of a small,
          tunable commit latency that shrinks as e shrinks.
        </span>
      </div>
    </div>
  );
}
