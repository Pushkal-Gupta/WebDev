import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './ReplicationLagViz.css';

const LEVELS = [
  { id: 'eventual', label: 'EVENTUAL' },
  { id: 'ryow', label: 'READ-YOUR-OWN-WRITES' },
  { id: 'monotonic', label: 'MONOTONIC READS' },
  { id: 'bounded', label: 'BOUNDED STALENESS' },
];

const LEVEL_DESC = {
  eventual: 'replicas converge with no time bound; any replica may answer, stale or not',
  ryow: "your own session always sees your own writes; reads route to a caught-up node",
  monotonic: 'within a session you never see older data than you already saw (no time travel)',
  bounded: 'replicas are at most N ops behind; reads needing fresher data go to the primary',
};

// A read picks a replica. Where it routes / what it observes depends on the level.
// We model two replicas with independent lag. The reader has a "seen" high-water mark.
function buildFrames(level) {
  const frames = [];
  // versions: primary advances on writes; replicas trail by lag ticks.
  const snap = (extra) => ({
    level,
    primary: 1,
    r1: 1,
    r2: 1,
    writePulse: null,   // {to: 'r1'|'r2', v}
    readTarget: null,   // 'primary' | 'r1' | 'r2'
    readResult: null,
    seen: 1,            // session high-water version
    anomaly: false,
    note: '',
    ...extra,
  });

  // t0
  frames.push(snap({
    note: 'Start. Primary holds A=1, both replicas are caught up at A=1. Your session has seen version 1.',
  }));

  // write A=2 to primary
  frames.push(snap({
    primary: 2, r1: 1, r2: 1, seen: 1,
    note: 'Your session writes A=2. The primary commits immediately and acknowledges — but async replication means the replicas have NOT received it yet.',
  }));

  // partial propagation: r1 gets it, r2 still lagging
  frames.push(snap({
    primary: 2, r1: 2, r2: 1, seen: 1,
    writePulse: { to: 'r1', v: 2 },
    note: 'The write streams to replica 1 (now A=2). Replica 2 is still lagging at A=1 — its replication queue is behind.',
  }));

  // The read — diverges by level
  if (level === 'eventual') {
    frames.push(snap({
      primary: 2, r1: 2, r2: 1, seen: 1,
      readTarget: 'r2',
      readResult: 1,
      anomaly: true,
      note: "Eventual consistency: the read is load-balanced to ANY replica — it lands on replica 2, still at A=1. You wrote A=2 a moment ago but read back A=1. Stale read — the classic 'I saved my profile but it shows the old value' anomaly.",
    }));
    frames.push(snap({
      primary: 2, r1: 2, r2: 2, seen: 1,
      writePulse: { to: 'r2', v: 2 },
      note: 'Eventually replica 2 catches up to A=2 as well. The system is now consistent — but only AFTER the anomaly was already served. Eventual gives no bound on when that happens.',
    }));
  } else if (level === 'ryow') {
    frames.push(snap({
      primary: 2, r1: 2, r2: 1, seen: 2,
      readTarget: 'primary',
      readResult: 2,
      anomaly: false,
      note: 'Read-your-own-writes: because THIS session just wrote, its reads are pinned to the primary (or a replica known to have caught up) for the read-after-write window. The read routes to the primary and returns A=2 — you always see your own write.',
    }));
    frames.push(snap({
      primary: 2, r1: 2, r2: 2, seen: 2,
      writePulse: { to: 'r2', v: 2 },
      note: 'Replica 2 finishes catching up. Once the read-after-write window passes, this session can safely fan reads back out to replicas — they all hold A=2 now. RYOW prevented the stale read other sessions might still hit.',
    }));
  } else if (level === 'monotonic') {
    // first a read from r1 (fresh), then a read that must not go backwards
    frames.push(snap({
      primary: 2, r1: 2, r2: 1, seen: 2,
      readTarget: 'r1',
      readResult: 2,
      anomaly: false,
      note: 'Monotonic reads: your first read lands on replica 1 and sees A=2. The session records a high-water mark of version 2 — it must never observe anything older than this again.',
    }));
    frames.push(snap({
      primary: 3, r1: 2, r2: 1, seen: 2,
      readTarget: 'r2',
      readResult: 2,
      anomaly: false,
      note: "A second read would normally load-balance to replica 2 (still A=1) — that would be time travel backwards (2 then 1). Monotonic reads forbids it: the session is pinned to a replica at version ≥ 2, so it reads A=2, never going backwards.",
    }));
  } else {
    // bounded
    frames.push(snap({
      primary: 2, r1: 2, r2: 1, seen: 1,
      readTarget: 'r2',
      readResult: 1,
      anomaly: false,
      note: 'Bounded staleness: replica 2 is at A=1 while primary is at A=2 — exactly 1 version behind. The SLO allows up to N versions of staleness, so a read tolerant of that bound may accept A=1 from replica 2.',
    }));
    frames.push(snap({
      primary: 4, r1: 2, r2: 1, seen: 1,
      readTarget: 'primary',
      readResult: 4,
      anomaly: false,
      note: "Now the primary is at A=4 while replica 2 is still at A=1 — that's 3 versions behind, past the staleness bound. A read needing freshness is redirected to the primary and returns A=4. Bounded staleness gives you an SLO to route against.",
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 1500;

export default function ReplicationLagViz() {
  const [level, setLevel] = useState('eventual');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(level), [level]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  const switchLevel = (id) => {
    if (id === level) return;
    setIsRunning(false);
    setStep(0);
    setLevel(id);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry — primary on top, replicas below (vertical data flow)
  const W = 940;
  const H = 470;

  const priW = 220;
  const priH = 92;
  const priX = (W - priW) / 2;
  const priY = 30;

  const repW = 220;
  const repH = 92;
  const repY = 300;
  const r1X = 140;
  const r2X = W - 140 - repW;

  // reader sits to the right, issues read into whatever target
  const readerW = 180;
  const readerH = 80;
  const readerX = W - readerW - 30;
  const readerY = 180;

  const propActive = current.writePulse;
  const targetCenter = (t) => {
    if (t === 'primary') return { x: priX + priW / 2, y: priY + priH };
    if (t === 'r1') return { x: r1X + repW / 2, y: repY };
    return { x: r2X + repW / 2, y: repY };
  };

  const versionPill = (v) => `A=${v}`;

  return (
    <div className="rlv">
      <div className="rlv-head">
        <h3 className="rlv-title">Replication lag — the same timeline, four consistency levels</h3>
        <p className="rlv-sub">
          A write hits the primary and streams to async replicas after a lag. Pick a consistency level, then step
          through a read and watch whether it observes stale data or is steered to a fresh copy.
        </p>
      </div>

      <div className="rlv-controls">
        <div className="rlv-modes" role="tablist" aria-label="Consistency level">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`rlv-mode ${level === l.id ? 'is-on' : ''}`}
              onClick={() => switchLevel(l.id)}
              aria-pressed={level === l.id}
            >
              {l.label}
            </button>
          ))}
        </div>

        <label className="rlv-speed">
          <span className="rlv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rlv-speed-range"
            aria-label="Playback speed"
          />
          <span className="rlv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="rlv-spacer" aria-hidden="true" />

        <div className="rlv-buttons">
          <button
            type="button"
            className="rlv-btn rlv-btn-primary"
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
            className="rlv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="rlv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="rlv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="rlv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="rlv-level-banner">
        <span className="rlv-level-name">{LEVELS.find((l) => l.id === level).label}</span>
        <span className="rlv-level-desc">{LEVEL_DESC[level]}</span>
      </div>

      <div className="rlv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rlv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="rlv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="rlv-arrowhead" />
            </marker>
            <marker id="rlv-arrow-read" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="rlv-arrowhead-read" />
            </marker>
          </defs>

          {/* replication edges primary -> replicas (top to bottom) */}
          <line
            className={`rlv-rep-edge ${propActive && propActive.to === 'r1' ? 'is-flowing' : ''}`}
            x1={priX + priW / 2}
            y1={priY + priH}
            x2={r1X + repW / 2}
            y2={repY}
            markerEnd="url(#rlv-arrow)"
          />
          <line
            className={`rlv-rep-edge ${propActive && propActive.to === 'r2' ? 'is-flowing' : ''}`}
            x1={priX + priW / 2}
            y1={priY + priH}
            x2={r2X + repW / 2}
            y2={repY}
            markerEnd="url(#rlv-arrow)"
          />

          {/* a write token animating down the active replication edge */}
          {propActive && (() => {
            const tc = targetCenter(propActive.to);
            const sx = priX + priW / 2;
            const sy = priY + priH;
            const t = 0.55;
            return (
              <g>
                <circle className="rlv-token" cx={sx + (tc.x - sx) * t} cy={sy + (tc.y - sy) * t} r={11} />
                <text className="rlv-token-text" x={sx + (tc.x - sx) * t} y={sy + (tc.y - sy) * t + 3.5}>
                  A={propActive.v}
                </text>
              </g>
            );
          })()}

          {/* read edge reader -> target */}
          {current.readTarget && (() => {
            const tc = targetCenter(current.readTarget);
            return (
              <line
                className={`rlv-read-edge ${current.anomaly ? 'is-stale' : ''}`}
                x1={readerX}
                y1={readerY + readerH / 2}
                x2={tc.x}
                y2={current.readTarget === 'primary' ? tc.y : tc.y}
                markerEnd="url(#rlv-arrow-read)"
              />
            );
          })()}

          {/* PRIMARY (top) */}
          <rect className="rlv-node is-primary" x={priX} y={priY} width={priW} height={priH} rx={11} />
          <rect x={priX} y={priY} width={6} height={priH} rx={3} className="rlv-node-stripe is-primary" />
          <text className="rlv-node-title" x={priX + 22} y={priY + 28} textAnchor="start">PRIMARY</text>
          <text className="rlv-node-sub" x={priX + 22} y={priY + 48} textAnchor="start">accepts all writes</text>
          <g transform={`translate(${priX + priW - 70}, ${priY + 26})`}>
            <rect className="rlv-ver-pill is-primary" x={0} y={0} width={56} height={36} rx={8} />
            <text className="rlv-ver-text" x={28} y={24}>{versionPill(current.primary)}</text>
          </g>

          {/* REPLICA 1 (bottom-left) */}
          <rect className={`rlv-node is-replica ${current.r1 < current.primary ? 'is-lagging' : ''} ${current.readTarget === 'r1' ? 'is-read' : ''}`} x={r1X} y={repY} width={repW} height={repH} rx={11} />
          <rect x={r1X} y={repY} width={6} height={repH} rx={3} className="rlv-node-stripe is-r1" />
          <text className="rlv-node-title" x={r1X + 22} y={repY + 28} textAnchor="start">REPLICA 1</text>
          <text className="rlv-node-sub" x={r1X + 22} y={repY + 48} textAnchor="start">
            {current.r1 < current.primary ? 'lagging' : 'caught up'}
          </text>
          <g transform={`translate(${r1X + repW - 70}, ${repY + 26})`}>
            <rect className={`rlv-ver-pill is-r1 ${current.r1 < current.primary ? 'is-lagging' : ''}`} x={0} y={0} width={56} height={36} rx={8} />
            <text className="rlv-ver-text" x={28} y={24}>{versionPill(current.r1)}</text>
          </g>

          {/* REPLICA 2 (bottom-right) */}
          <rect className={`rlv-node is-replica ${current.r2 < current.primary ? 'is-lagging' : ''} ${current.readTarget === 'r2' ? 'is-read' : ''}`} x={r2X} y={repY} width={repW} height={repH} rx={11} />
          <rect x={r2X} y={repY} width={6} height={repH} rx={3} className="rlv-node-stripe is-r2" />
          <text className="rlv-node-title" x={r2X + 22} y={repY + 28} textAnchor="start">REPLICA 2</text>
          <text className="rlv-node-sub" x={r2X + 22} y={repY + 48} textAnchor="start">
            {current.r2 < current.primary ? 'lagging' : 'caught up'}
          </text>
          <g transform={`translate(${r2X + repW - 70}, ${repY + 26})`}>
            <rect className={`rlv-ver-pill is-r2 ${current.r2 < current.primary ? 'is-lagging' : ''}`} x={0} y={0} width={56} height={36} rx={8} />
            <text className="rlv-ver-text" x={28} y={24}>{versionPill(current.r2)}</text>
          </g>

          {/* READER */}
          <rect className="rlv-reader" x={readerX} y={readerY} width={readerW} height={readerH} rx={11} />
          <text className="rlv-reader-title" x={readerX + readerW / 2} y={readerY + 26}>reader session</text>
          <text className="rlv-reader-sub" x={readerX + readerW / 2} y={readerY + 46}>
            seen ≥ A={current.seen}
          </text>
          {current.readResult != null && (
            <text className={`rlv-reader-result ${current.anomaly ? 'is-stale' : 'is-fresh'}`} x={readerX + readerW / 2} y={readerY + 68}>
              read → A={current.readResult}
            </text>
          )}

          {/* anomaly banner */}
          {current.anomaly && (
            <g transform={`translate(${readerX - 10}, ${readerY + readerH + 14})`}>
              <rect className="rlv-anomaly" x={0} y={0} width={readerW + 10} height={30} rx={7} />
              <text className="rlv-anomaly-text" x={(readerW + 10) / 2} y={20}>STALE READ — anomaly</text>
            </g>
          )}
        </svg>
      </div>

      <div className="rlv-metrics">
        <div className="rlv-metric">
          <span className="rlv-metric-label">primary version</span>
          <span className="rlv-metric-value is-primary">A={current.primary}</span>
        </div>
        <div className="rlv-metric">
          <span className="rlv-metric-label">replica 1</span>
          <span className={`rlv-metric-value ${current.r1 < current.primary ? 'is-lag' : 'is-fresh'}`}>A={current.r1}</span>
        </div>
        <div className="rlv-metric">
          <span className="rlv-metric-label">replica 2</span>
          <span className={`rlv-metric-value ${current.r2 < current.primary ? 'is-lag' : 'is-fresh'}`}>A={current.r2}</span>
        </div>
        <div className="rlv-metric">
          <span className="rlv-metric-label">read result</span>
          <span className={`rlv-metric-value ${current.anomaly ? 'is-stale' : current.readResult != null ? 'is-fresh' : ''}`}>
            {current.readResult != null ? `A=${current.readResult}` : '—'}
          </span>
        </div>
        <div className="rlv-metric">
          <span className="rlv-metric-label">anomaly</span>
          <span className={`rlv-metric-value ${current.anomaly ? 'is-stale' : 'is-fresh'}`}>
            {current.anomaly ? 'YES' : current.readResult != null ? 'no' : '—'}
          </span>
        </div>
      </div>

      <div className="rlv-narration">
        <span className="rlv-narration-label">trace</span>
        <span className="rlv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
