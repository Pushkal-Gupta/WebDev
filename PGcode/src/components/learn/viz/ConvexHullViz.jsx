import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './ConvexHullViz.css';

// Andrew's monotone chain. Points chosen so the hull is a clean hexagon-ish
// shape with several interior points to exercise the turn test.
const POINTS = [
  { x: 1, y: 1 },
  { x: 2, y: 5 },
  { x: 3, y: 3 },
  { x: 4, y: 8 },
  { x: 5, y: 2 },
  { x: 6, y: 6 },
  { x: 7, y: 4 },
  { x: 8, y: 9 },
  { x: 9, y: 1 },
  { x: 9, y: 7 },
];

// cross product of OA x OB where O,A,B are points. >0 left/ccw turn, <0 right/cw.
function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function buildFrames(raw) {
  // sort by x then y; remember original index for labels.
  const pts = raw.map((p, i) => ({ ...p, idx: i }));
  pts.sort((a, b) => (a.x - b.x) || (a.y - b.y));

  const frames = [];
  const snap = (extra) => ({
    phase: 'init',
    chain: 'lower',
    hull: [],
    activeIdx: null,
    crossSign: null,
    crossVal: null,
    testTriple: null,
    popped: null,
    finalHull: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'sort',
    note: `Sorted ${pts.length} points by x (ties by y). Build the lower hull left-to-right, then the upper hull right-to-left.`,
  }));

  // LOWER HULL
  const lower = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    frames.push(snap({
      phase: 'consider', chain: 'lower', activeIdx: p.idx, hull: lower.map((q) => q.idx),
      note: `Lower hull: consider point P${p.idx} (${p.x}, ${p.y}).`,
    }));
    while (lower.length >= 2) {
      const o = lower[lower.length - 2];
      const a = lower[lower.length - 1];
      const c = cross(o, a, p);
      if (c <= 0) {
        frames.push(snap({
          phase: 'pop', chain: 'lower', activeIdx: p.idx,
          hull: lower.map((q) => q.idx),
          testTriple: [o.idx, a.idx, p.idx], crossSign: c < 0 ? 'cw' : 'collinear', crossVal: c,
          popped: a.idx,
          note: `cross(P${o.idx}, P${a.idx}, P${p.idx}) = ${c} ${c < 0 ? '< 0 (clockwise turn)' : '= 0 (collinear)'} → pop P${a.idx}.`,
        }));
        lower.pop();
      } else {
        frames.push(snap({
          phase: 'keep', chain: 'lower', activeIdx: p.idx,
          hull: lower.map((q) => q.idx),
          testTriple: [o.idx, a.idx, p.idx], crossSign: 'ccw', crossVal: c,
          note: `cross(P${o.idx}, P${a.idx}, P${p.idx}) = ${c} > 0 (counter-clockwise) → keep, stop popping.`,
        }));
        break;
      }
    }
    lower.push(p);
    frames.push(snap({
      phase: 'push', chain: 'lower', activeIdx: p.idx, hull: lower.map((q) => q.idx),
      note: `Push P${p.idx} onto the lower chain. Lower so far: [${lower.map((q) => 'P' + q.idx).join(', ')}].`,
    }));
  }

  // UPPER HULL
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    frames.push(snap({
      phase: 'consider', chain: 'upper', activeIdx: p.idx,
      hull: [...lower.slice(0, -1).map((q) => q.idx), ...upper.map((q) => q.idx)],
      note: `Upper hull (right-to-left): consider point P${p.idx} (${p.x}, ${p.y}).`,
    }));
    while (upper.length >= 2) {
      const o = upper[upper.length - 2];
      const a = upper[upper.length - 1];
      const c = cross(o, a, p);
      if (c <= 0) {
        frames.push(snap({
          phase: 'pop', chain: 'upper', activeIdx: p.idx,
          hull: [...lower.slice(0, -1).map((q) => q.idx), ...upper.map((q) => q.idx)],
          testTriple: [o.idx, a.idx, p.idx], crossSign: c < 0 ? 'cw' : 'collinear', crossVal: c,
          popped: a.idx,
          note: `cross(P${o.idx}, P${a.idx}, P${p.idx}) = ${c} ${c < 0 ? '< 0 (clockwise turn)' : '= 0 (collinear)'} → pop P${a.idx}.`,
        }));
        upper.pop();
      } else {
        frames.push(snap({
          phase: 'keep', chain: 'upper', activeIdx: p.idx,
          hull: [...lower.slice(0, -1).map((q) => q.idx), ...upper.map((q) => q.idx)],
          testTriple: [o.idx, a.idx, p.idx], crossSign: 'ccw', crossVal: c,
          note: `cross(P${o.idx}, P${a.idx}, P${p.idx}) = ${c} > 0 (counter-clockwise) → keep, stop popping.`,
        }));
        break;
      }
    }
    upper.push(p);
    frames.push(snap({
      phase: 'push', chain: 'upper', activeIdx: p.idx,
      hull: [...lower.slice(0, -1).map((q) => q.idx), ...upper.map((q) => q.idx)],
      note: `Push P${p.idx} onto the upper chain. Upper so far: [${upper.map((q) => 'P' + q.idx).join(', ')}].`,
    }));
  }

  // concatenate, dropping the last point of each (shared endpoints).
  const hullPts = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  const hullIdx = hullPts.map((q) => q.idx);
  frames.push(snap({
    phase: 'done', finalHull: hullIdx, hull: hullIdx,
    note: `Done. Convex hull = ${hullIdx.length} vertices [${hullIdx.map((i) => 'P' + i).join(', ')}] in counter-clockwise order. O(n log n) dominated by the sort.`,
  }));

  return { frames, sorted: pts, hullIdx };
}

export default function ConvexHullViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames } = useMemo(() => buildFrames(POINTS), []);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
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

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const W = 760;
  const H = 380;
  const pad = 50;
  const maxX = 10;
  const maxY = 10;
  const sx = (x) => pad + (x / maxX) * (W - 2 * pad);
  const sy = (y) => H - pad - (y / maxY) * (H - 2 * pad);

  const hullSet = new Set(current.hull);
  const tripleSet = new Set(current.testTriple || []);

  // build polyline path for current chain progress + final
  const hullPoints = current.hull.map((i) => `${sx(POINTS[i].x)},${sy(POINTS[i].y)}`).join(' ');
  const closed = current.phase === 'done';

  return (
    <div className="chv">
      <div className="chv-head">
        <h3 className="chv-title">Convex hull — Andrew's monotone chain — O(n log n)</h3>
        <p className="chv-sub">
          Sort points by x, then sweep building the lower then upper chain. The cross-product turn test pops any vertex
          that makes a clockwise (right) turn, leaving only counter-clockwise corners.
        </p>
      </div>

      <div className="chv-controls">
        <div className="chv-actions">
          <div className="chv-buttons">
            <button
              type="button"
              className="chv-btn chv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="chv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="chv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="chv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="chv-speed">
            <span className="chv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="chv-speed-range"
            />
            <span className="chv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="chv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="chv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="chv-svg" preserveAspectRatio="xMidYMid meet">
          {/* grid */}
          {Array.from({ length: maxX + 1 }, (_, i) => (
            <line key={`gx-${i}`} x1={sx(i)} y1={sy(0)} x2={sx(i)} y2={sy(maxY)} stroke="var(--border)" strokeWidth={0.6} opacity={0.4} />
          ))}
          {Array.from({ length: maxY + 1 }, (_, i) => (
            <line key={`gy-${i}`} x1={sx(0)} y1={sy(i)} x2={sx(maxX)} y2={sy(i)} stroke="var(--border)" strokeWidth={0.6} opacity={0.4} />
          ))}

          {/* current hull chain */}
          {current.hull.length >= 2 && (
            closed ? (
              <polygon points={hullPoints} fill="rgba(var(--accent-rgb), 0.12)" stroke="var(--accent)" strokeWidth={2.5} />
            ) : (
              <polyline points={hullPoints} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" />
            )
          )}

          {/* turn-test triple highlight */}
          {current.testTriple && (
            <polyline
              points={current.testTriple.map((i) => `${sx(POINTS[i].x)},${sy(POINTS[i].y)}`).join(' ')}
              fill="none"
              stroke={current.crossSign === 'ccw' ? 'var(--easy)' : 'var(--hard)'}
              strokeWidth={3}
              strokeDasharray="5 4"
            />
          )}

          {/* points */}
          {POINTS.map((p, i) => {
            const isActive = current.activeIdx === i;
            const inHull = hullSet.has(i);
            const inTriple = tripleSet.has(i);
            const isPopped = current.popped === i;
            const fill = isPopped ? 'var(--hard)'
              : isActive ? 'var(--hue-pink)'
              : inHull ? 'var(--accent)'
              : inTriple ? 'var(--medium)'
              : 'var(--bg)';
            const stroke = isActive ? 'var(--hue-pink)'
              : inHull ? 'var(--accent)'
              : isPopped ? 'var(--hard)'
              : 'var(--border)';
            return (
              <g key={`p-${i}`}>
                <circle cx={sx(p.x)} cy={sy(p.y)} r={isActive ? 8 : 6} fill={fill} stroke={stroke} strokeWidth={2} />
                <text x={sx(p.x)} y={sy(p.y) - 12} className="chv-pt-label" style={{ fill: isActive ? 'var(--hue-pink)' : 'var(--text-dim)' }}>
                  P{i}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chv-metrics">
        <div className="chv-metric">
          <span className="chv-metric-label">phase</span>
          <span className="chv-metric-value">{current.phase}</span>
        </div>
        <div className="chv-metric">
          <span className="chv-metric-label">chain</span>
          <span className="chv-metric-value">{current.chain}</span>
        </div>
        <div className="chv-metric">
          <span className="chv-metric-label">cross sign</span>
          <span className="chv-metric-value">{current.crossVal == null ? '—' : `${current.crossVal} (${current.crossSign})`}</span>
        </div>
        <div className="chv-metric chv-metric-dim">
          <span className="chv-metric-label">hull vertices</span>
          <span className="chv-metric-value chv-metric-dimval">
            {current.finalHull ? current.finalHull.map((i) => 'P' + i).join(' ') : `${hullSet.size} so far`}
          </span>
        </div>
      </div>

      <div className="chv-arith">
        <span className="chv-arith-label">trace</span>
        <span className="chv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
