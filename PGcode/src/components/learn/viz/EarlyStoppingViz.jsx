import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Flag, OctagonX, Save, TrendingDown } from 'lucide-react';
import './EarlyStoppingViz.css';

const TOTAL_EPOCHS = 40;

function mulberry32(a) {
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCurves() {
  const rng = mulberry32(20260615);
  const train = [];
  const val = [];
  for (let e = 0; e <= TOTAL_EPOCHS; e += 1) {
    const t = e / TOTAL_EPOCHS;
    // train loss: monotonically decreasing exponential toward a low floor
    const trainBase = 0.12 + 1.55 * Math.exp(-3.2 * t);
    const trainNoise = (rng() - 0.5) * 0.012;
    train.push(Math.max(0.05, trainBase + trainNoise));
    // val loss: U-shape — decreasing exponential + small increasing (overfitting) term
    const valDown = 0.28 + 1.45 * Math.exp(-3.6 * t);
    const valUp = 0.62 * t * t;
    const valNoise = (rng() - 0.5) * 0.03;
    val.push(Math.max(0.05, valDown + valUp + valNoise));
  }
  return { train, val };
}

export default function EarlyStoppingViz() {
  const [patience, setPatience] = useState(5);
  const [epoch, setEpoch] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { train, val } = useMemo(() => buildCurves(), []);

  const bestEpoch = useMemo(() => {
    let bi = 0;
    for (let e = 1; e < val.length; e += 1) {
      if (val[e] < val[bi]) bi = e;
    }
    return bi;
  }, [val]);

  const stopEpoch = useMemo(
    () => Math.min(bestEpoch + patience, TOTAL_EPOCHS),
    [bestEpoch, patience],
  );

  // The live decision at the current scrubbed epoch.
  const live = useMemo(() => {
    let runningBest = 0;
    let bestSoFar = val[0];
    for (let e = 1; e <= epoch; e += 1) {
      if (val[e] < bestSoFar) {
        bestSoFar = val[e];
        runningBest = e;
      }
    }
    const sinceBest = epoch - runningBest;
    const stopped = epoch >= stopEpoch && epoch >= bestEpoch;
    return { runningBest, bestSoFar, sinceBest, stopped };
  }, [epoch, val, stopEpoch, bestEpoch]);

  const isRunning = isRunningRaw && epoch < stopEpoch;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setEpoch((e) => Math.min(e + 1, stopEpoch));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, epoch, delay, stopEpoch]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setEpoch(0);
  };

  const changePatience = (value) => {
    const next = Math.max(0, Math.min(15, value));
    setIsRunning(false);
    setEpoch(0);
    setPatience(next);
  };

  const playLabel = isRunningRaw && epoch < stopEpoch ? 'Pause' : (epoch >= stopEpoch ? 'Replay' : 'Train');

  // ---- SVG layout ----
  const W = 940;
  const H = 400;
  const padL = 56;
  const padR = 150;
  const padT = 34;
  const padB = 48;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const allVals = train.concat(val);
  const yMax = Math.max(...allVals) * 1.05;
  const yMin = 0;

  const xOf = (e) => padL + (e / TOTAL_EPOCHS) * plotW;
  const yOf = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const pointsUpTo = (arr, upto) =>
    arr.slice(0, upto + 1).map((v, e) => `${xOf(e).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');

  const trainPts = pointsUpTo(train, epoch);
  const valPts = pointsUpTo(val, epoch);

  const yTicks = 5;
  const xTicks = 8;

  const bestX = xOf(live.runningBest);
  const stopX = xOf(stopEpoch);
  const epochX = xOf(epoch);

  const revealedBest = epoch >= 1 ? live.runningBest : 0;
  const showZone = epoch >= revealedBest;

  return (
    <div className="esv">
      <div className="esv-head">
        <h3 className="esv-title">Early stopping — quit while validation loss is at its minimum</h3>
        <p className="esv-sub">
          Train loss keeps falling, but validation loss bottoms out then climbs as the model overfits. Save the best
          checkpoint and stop after patience epochs without improvement.
        </p>
      </div>

      <div className="esv-controls">
        <label className="esv-slider">
          <span className="esv-input-label">patience</span>
          <input
            type="range" min={0} max={15} step={1} value={patience}
            onChange={(e) => changePatience(Number(e.target.value))}
            className="esv-range" aria-label="Patience epochs"
          />
          <span className="esv-slider-val">{patience}</span>
        </label>
        <label className="esv-slider">
          <span className="esv-input-label">epoch</span>
          <input
            type="range" min={0} max={TOTAL_EPOCHS} step={1} value={epoch}
            onChange={(e) => { setIsRunning(false); setEpoch(Number(e.target.value)); }}
            className="esv-range" aria-label="Current epoch scrubber"
          />
          <span className="esv-slider-val">{epoch}</span>
        </label>
        <label className="esv-slider">
          <span className="esv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="esv-range" aria-label="Playback speed"
          />
          <span className="esv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="esv-spacer" aria-hidden="true" />

        <div className="esv-buttons">
          <button
            type="button"
            className="esv-btn esv-btn-primary"
            onClick={() => {
              if (epoch >= stopEpoch) setEpoch(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && epoch < stopEpoch ? <Pause size={14} /> : (epoch >= stopEpoch ? <Play size={14} /> : <TrendingDown size={14} />)}
            {playLabel}
          </button>
          <button
            type="button"
            className="esv-btn"
            onClick={() => setEpoch((e) => Math.min(e + 1, TOTAL_EPOCHS))}
            disabled={epoch >= TOTAL_EPOCHS}
          >
            <ChevronRight size={14} /> Epoch
          </button>
          <button
            type="button"
            className="esv-btn"
            onClick={() => { setIsRunning(false); setEpoch(stopEpoch); }}
            disabled={epoch >= stopEpoch}
          >
            <SkipForward size={14} /> To stop
          </button>
          <button type="button" className="esv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="esv-stepcount">
          epoch <strong>{epoch}</strong> / {TOTAL_EPOCHS}
        </div>
      </div>

      <div className="esv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="esv-svg" preserveAspectRatio="xMidYMid meet">
          {/* gridlines + y axis ticks */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const v = yMin + (i / yTicks) * (yMax - yMin);
            const y = yOf(v);
            return (
              <g key={`yt-${i}`}>
                <line className="esv-grid" x1={padL} y1={y} x2={padL + plotW} y2={y} />
                <text className="esv-axis-lbl" x={padL - 8} y={y + 3} textAnchor="end">{v.toFixed(1)}</text>
              </g>
            );
          })}
          {/* x axis ticks */}
          {Array.from({ length: xTicks + 1 }, (_, i) => {
            const e = Math.round((i / xTicks) * TOTAL_EPOCHS);
            const x = xOf(e);
            return (
              <g key={`xt-${i}`}>
                <line className="esv-tick" x1={x} y1={padT + plotH} x2={x} y2={padT + plotH + 5} />
                <text className="esv-axis-lbl" x={x} y={padT + plotH + 18} textAnchor="middle">{e}</text>
              </g>
            );
          })}

          {/* axes */}
          <line className="esv-axis" x1={padL} y1={padT} x2={padL} y2={padT + plotH} />
          <line className="esv-axis" x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} />
          <text className="esv-axis-title" x={padL + plotW / 2} y={H - 6} textAnchor="middle">epoch</text>
          <text className="esv-axis-title" x={16} y={padT + plotH / 2} textAnchor="middle" transform={`rotate(-90 16 ${padT + plotH / 2})`}>loss</text>

          {/* patience zone shade (best -> stop) */}
          {showZone && stopEpoch > revealedBest && (
            <rect
              className="esv-zone"
              x={bestX}
              y={padT}
              width={Math.max(0, stopX - bestX)}
              height={plotH}
            />
          )}

          {/* best checkpoint vertical line */}
          {epoch >= 1 && (
            <g>
              <line className="esv-best-line" x1={bestX} y1={padT} x2={bestX} y2={padT + plotH} />
              <text className="esv-best-tag" x={bestX} y={padT - 8} textAnchor="middle">
                best · e{revealedBest}
              </text>
            </g>
          )}

          {/* stop vertical line — only once we've reached / passed it */}
          {epoch >= stopEpoch && stopEpoch > revealedBest && (
            <g>
              <line className="esv-stop-line" x1={stopX} y1={padT} x2={stopX} y2={padT + plotH} />
              <text className="esv-stop-tag" x={stopX} y={padT + plotH + 34} textAnchor="middle">
                STOP · e{stopEpoch}
              </text>
            </g>
          )}

          {/* curves */}
          <polyline className="esv-train" points={trainPts} />
          <polyline className="esv-val" points={valPts} />

          {/* current epoch marker on val curve */}
          {epoch >= 0 && (
            <circle className="esv-cursor" cx={epochX} cy={yOf(val[epoch])} r={4.5} />
          )}

          {/* best checkpoint dot */}
          {epoch >= 1 && (
            <g>
              <circle className="esv-best-dot" cx={bestX} cy={yOf(val[revealedBest])} r={6} />
              <Save size={13} x={bestX - 6.5} y={yOf(val[revealedBest]) - 24} className="esv-best-icon" />
            </g>
          )}

          {/* legend */}
          <g transform={`translate(${padL + plotW + 16}, ${padT + 6})`}>
            <line className="esv-train" x1={0} y1={0} x2={24} y2={0} />
            <text className="esv-legend" x={30} y={4}>train loss</text>
            <line className="esv-val" x1={0} y1={22} x2={24} y2={22} />
            <text className="esv-legend" x={30} y={26}>val loss</text>
            <circle className="esv-best-dot" cx={12} cy={48} r={5} />
            <text className="esv-legend" x={30} y={52}>best ckpt</text>
            <rect className="esv-zone-key" x={2} y={66} width={20} height={12} rx={2} />
            <text className="esv-legend" x={30} y={76}>patience zone</text>
            <line className="esv-stop-line" x1={0} y1={96} x2={24} y2={96} />
            <text className="esv-legend" x={30} y={100}>stop epoch</text>
          </g>
        </svg>
      </div>

      <div className="esv-metrics">
        <div className="esv-metric">
          <span className="esv-metric-label">best epoch</span>
          <span className="esv-metric-value is-good">{epoch >= 1 ? revealedBest : '—'}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">best val loss</span>
          <span className="esv-metric-value is-good">{epoch >= 1 ? live.bestSoFar.toFixed(3) : '—'}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">current epoch</span>
          <span className="esv-metric-value">{epoch}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">epochs since best</span>
          <span className={`esv-metric-value ${live.sinceBest >= patience && patience > 0 ? 'is-bad' : ''}`}>
            {live.sinceBest} / {patience}
          </span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">decision</span>
          <span className={`esv-metric-value ${live.stopped ? 'is-bad' : 'is-hi'}`}>
            {live.stopped ? `STOPPED · restore e${revealedBest}` : 'training…'}
          </span>
        </div>
      </div>

      <div className="esv-narration">
        <span className="esv-narration-label">trace</span>
        <span className="esv-narration-body">
          {live.stopped ? (
            <>
              <OctagonX size={13} className="esv-narr-icon" />{' '}
              Stopped at epoch {stopEpoch}: validation loss has not improved on epoch {revealedBest}&apos;s value of{' '}
              {live.bestSoFar.toFixed(3)} for {patience} straight epoch{patience === 1 ? '' : 's'}. Weights are restored
              to the saved best checkpoint — the {stopEpoch - revealedBest} extra epochs were pure overfitting.
            </>
          ) : (
            <>
              <Flag size={13} className="esv-narr-icon" />{' '}
              {epoch === 0
                ? `Press Train. Validation loss is tracked each epoch; the lowest-so-far value is checkpointed, and training halts ${patience} epoch${patience === 1 ? '' : 's'} after the last improvement.`
                : `Epoch ${epoch}: val loss ${val[epoch].toFixed(3)}. Best is epoch ${revealedBest} at ${live.bestSoFar.toFixed(3)} (${live.sinceBest} epoch${live.sinceBest === 1 ? '' : 's'} ago). ${live.sinceBest === 0 ? 'New best — checkpoint saved.' : `Need ${patience - live.sinceBest} more without improvement to trigger the stop.`}`}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
