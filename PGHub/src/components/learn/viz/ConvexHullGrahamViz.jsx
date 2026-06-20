import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './ConvexHullGrahamViz.css';

const SEED = 0xC0FFEE;
const N_POINTS = 12;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePoints(rand, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({
      x: Math.round(60 + rand() * 480),
      y: Math.round(40 + rand() * 320),
      id: i,
    });
  }
  return pts;
}

function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function buildFrames(rawPoints) {
  const frames = [];
  const points = rawPoints.map((p) => ({ ...p }));
  const n = points.length;

  let p0Idx = 0;
  for (let i = 1; i < n; i++) {
    if (points[i].y > points[p0Idx].y || (points[i].y === points[p0Idx].y && points[i].x < points[p0Idx].x)) {
      p0Idx = i;
    }
  }
  const p0 = points[p0Idx];

  frames.push({
    phase: 'pivot',
    p0Id: p0.id,
    sortedIds: [],
    stackIds: [],
    cursorIdx: -1,
    poppedId: -1,
    isRight: false,
    note: `Step 1: pick the lowest point as pivot P0 = (${p0.x}, ${p0.y}). Ties broken by smallest x.`,
  });

  const others = points.filter((p) => p.id !== p0.id);
  const withAngle = others.map((p) => ({
    ...p,
    ang: Math.atan2(p.y - p0.y, p.x - p0.x),
    dist: (p.x - p0.x) ** 2 + (p.y - p0.y) ** 2,
  }));
  withAngle.sort((a, b) => (a.ang - b.ang) || (a.dist - b.dist));

  frames.push({
    phase: 'sorted',
    p0Id: p0.id,
    sortedIds: withAngle.map((p) => p.id),
    stackIds: [],
    cursorIdx: -1,
    poppedId: -1,
    isRight: false,
    note: `Step 2: sort remaining ${withAngle.length} points by polar angle around P0.`,
  });

  const stack = [p0.id, withAngle[0].id, withAngle[1].id];
  frames.push({
    phase: 'init-stack',
    p0Id: p0.id,
    sortedIds: withAngle.map((p) => p.id),
    stackIds: [...stack],
    cursorIdx: 1,
    poppedId: -1,
    isRight: false,
    note: `Seed stack with P0 and first two sorted points (ids ${withAngle[0].id}, ${withAngle[1].id}).`,
  });

  const byId = new Map(points.map((p) => [p.id, p]));

  for (let i = 2; i < withAngle.length; i++) {
    const next = withAngle[i];
    frames.push({
      phase: 'consider',
      p0Id: p0.id,
      sortedIds: withAngle.map((p) => p.id),
      stackIds: [...stack],
      cursorIdx: i,
      poppedId: -1,
      candidateId: next.id,
      isRight: false,
      note: `Consider sorted[${i}] = id ${next.id}. Check turn from top-2, top-1, next.`,
    });

    while (stack.length >= 2) {
      const a = byId.get(stack[stack.length - 2]);
      const b = byId.get(stack[stack.length - 1]);
      const c = next;
      const cr = cross(a, b, c);
      if (cr <= 0) {
        const popped = stack.pop();
        frames.push({
          phase: 'pop',
          p0Id: p0.id,
          sortedIds: withAngle.map((p) => p.id),
          stackIds: [...stack],
          cursorIdx: i,
          poppedId: popped,
          candidateId: next.id,
          isRight: true,
          turnA: a.id,
          turnB: b.id,
          turnC: c.id,
          note: `Right turn (cross = ${cr.toFixed(0)}). Pop id ${popped} off the stack.`,
        });
      } else {
        frames.push({
          phase: 'left',
          p0Id: p0.id,
          sortedIds: withAngle.map((p) => p.id),
          stackIds: [...stack],
          cursorIdx: i,
          poppedId: -1,
          candidateId: next.id,
          isRight: false,
          turnA: a.id,
          turnB: b.id,
          turnC: c.id,
          note: `Left turn (cross = ${cr.toFixed(0)}). Keep stack and push.`,
        });
        break;
      }
    }

    stack.push(next.id);
    frames.push({
      phase: 'push',
      p0Id: p0.id,
      sortedIds: withAngle.map((p) => p.id),
      stackIds: [...stack],
      cursorIdx: i,
      poppedId: -1,
      candidateId: next.id,
      isRight: false,
      note: `Push id ${next.id} onto the stack. Stack size = ${stack.length}.`,
    });
  }

  frames.push({
    phase: 'done',
    p0Id: p0.id,
    sortedIds: withAngle.map((p) => p.id),
    stackIds: [...stack],
    cursorIdx: withAngle.length,
    poppedId: -1,
    isRight: false,
    note: `Done. Convex hull has ${stack.length} vertices.`,
  });

  return { frames, points };
}

export default function ConvexHullGrahamViz() {
  const [seed, setSeed] = useState(SEED);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [showAngles, setShowAngles] = useState(false);
  const runTimer = useRef(null);

  const rand = useMemo(() => mulberry32(seed), [seed]);
  const { frames, points } = useMemo(() => {
    const pts = generatePoints(rand, N_POINTS);
    return buildFrames(pts);
  }, [rand]);

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

  const reseed = () => {
    reset();
    setSeed((s) => (s + 1) >>> 0);
  };

  const byId = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);
  const p0 = byId.get(current.p0Id);
  const W = 900;
  const H = 380;
  const planeW = 580;
  const stackX = 620;
  const stackY = 40;
  const stackCellH = 26;

  const stackPts = current.stackIds.map((id) => byId.get(id));
  const turnA = current.turnA != null ? byId.get(current.turnA) : null;
  const turnB = current.turnB != null ? byId.get(current.turnB) : null;
  const turnC = current.turnC != null ? byId.get(current.turnC) : null;

  return (
    <div className="chgv">
      <div className="chgv-head">
        <h3 className="chgv-title">Graham scan — convex hull in O(n log n)</h3>
        <p className="chgv-sub">
          Pick the lowest point P0, sort the rest by polar angle around it, then walk the sorted list keeping a stack.
          Pop while the top three points make a right (or collinear) turn.
        </p>
      </div>

      <div className="chgv-controls">
        <div className="chgv-actions">
          <div className="chgv-buttons">
            <button
              type="button"
              className="chgv-btn chgv-btn-primary"
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
              className="chgv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="chgv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="chgv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="chgv-btn" onClick={reseed}>
              Reseed
            </button>
          </div>
          <label className="chgv-toggle">
            <input
              type="checkbox"
              checked={showAngles}
              onChange={(e) => setShowAngles(e.target.checked)}
            />
            <span>show angles</span>
          </label>
          <label className="chgv-speed">
            <span className="chgv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="chgv-speed-range"
            />
            <span className="chgv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="chgv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="chgv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="chgv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={planeW} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={30} y={36} className="chgv-row-label">plane</text>

          {showAngles && p0 && current.sortedIds.length > 0 && current.sortedIds.map((id) => {
            const p = byId.get(id);
            return (
              <line
                key={`ang-${id}`}
                x1={p0.x}
                y1={p0.y}
                x2={p.x}
                y2={p.y}
                stroke="var(--text-dim)"
                strokeWidth={0.5}
                strokeDasharray="2 3"
                opacity={0.5}
              />
            );
          })}

          {stackPts.length >= 2 && stackPts.slice(0, -1).map((p, i) => {
            const next = stackPts[i + 1];
            return (
              <line
                key={`hull-${i}`}
                x1={p.x}
                y1={p.y}
                x2={next.x}
                y2={next.y}
                stroke="var(--accent)"
                strokeWidth={2}
              />
            );
          })}

          {current.phase === 'done' && stackPts.length >= 2 && (
            <line
              x1={stackPts[stackPts.length - 1].x}
              y1={stackPts[stackPts.length - 1].y}
              x2={stackPts[0].x}
              y2={stackPts[0].y}
              stroke="var(--accent)"
              strokeWidth={2}
            />
          )}

          {turnA && turnB && turnC && (
            <g>
              <line x1={turnA.x} y1={turnA.y} x2={turnB.x} y2={turnB.y} stroke={current.isRight ? 'var(--hard)' : 'var(--easy)'} strokeWidth={2.5} />
              <line x1={turnB.x} y1={turnB.y} x2={turnC.x} y2={turnC.y} stroke={current.isRight ? 'var(--hard)' : 'var(--easy)'} strokeWidth={2.5} strokeDasharray={current.isRight ? '4 3' : '0'} />
            </g>
          )}

          {points.map((p) => {
            const onStack = current.stackIds.includes(p.id);
            const isP0 = p.id === current.p0Id;
            const isCandidate = p.id === current.candidateId;
            const isPopped = p.id === current.poppedId;
            const fill = isP0 ? 'var(--hue-pink)'
              : isCandidate ? 'var(--accent)'
              : isPopped ? 'var(--hard)'
              : onStack ? 'var(--accent)'
              : 'var(--text-dim)';
            const r = isP0 || isCandidate ? 6 : onStack ? 5 : 3.5;
            return (
              <g key={`pt-${p.id}`}>
                <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke="var(--bg)" strokeWidth={1.5} />
                <text x={p.x + 8} y={p.y - 6} className="chgv-pt-label">
                  {p.id}
                </text>
              </g>
            );
          })}

          <rect x={stackX - 10} y={20} width={W - stackX} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={stackX} y={36} className="chgv-row-label">stack (bottom → top)</text>

          {current.stackIds.map((id, i) => {
            const y = stackY + 8 + i * stackCellH;
            return (
              <g key={`sk-${id}-${i}`}>
                <rect
                  x={stackX}
                  y={y}
                  width={W - stackX - 20}
                  height={stackCellH - 4}
                  fill={i === current.stackIds.length - 1 ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={i === current.stackIds.length - 1 ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={1}
                  rx={4}
                />
                <text x={stackX + 10} y={y + (stackCellH - 4) / 2 + 4} className="chgv-stack-text">
                  id {id}{i === 0 ? '  (P0)' : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chgv-metrics">
        <div className="chgv-metric">
          <span className="chgv-metric-label">phase</span>
          <span className="chgv-metric-value">{current.phase}</span>
        </div>
        <div className="chgv-metric">
          <span className="chgv-metric-label">stack size</span>
          <span className="chgv-metric-value">{current.stackIds.length}</span>
        </div>
        <div className="chgv-metric">
          <span className="chgv-metric-label">cursor</span>
          <span className="chgv-metric-value">
            {current.cursorIdx < 0 ? '—' : `${current.cursorIdx + 1} / ${current.sortedIds.length}`}
          </span>
        </div>
        <div className="chgv-metric chgv-metric-dim">
          <span className="chgv-metric-label">points</span>
          <span className="chgv-metric-value chgv-metric-dimval">{points.length}</span>
        </div>
      </div>

      <div className="chgv-arith">
        <span className="chgv-arith-label">trace</span>
        <span className="chgv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
