import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Turtle, Rabbit, RotateCcw, Play, Pause, SkipForward, Minus, Plus } from 'lucide-react';
import './FloydTortoiseHareViz.css';

const SVG_W = 720;
const SVG_H = 360;
const NODE_R = 17;
const STEP_MS = 850;

const MIN_N = 5;
const MAX_N = 9;

// Deterministic layout: a straight "tail" segment leading into a circular cycle.
// entry = index where the cycle begins (-1 means acyclic).
function computeLayout(n, entry) {
  const pos = new Array(n).fill(null);
  const acyclic = entry < 0 || entry >= n;

  if (acyclic) {
    const usableW = SVG_W - 110;
    const gap = usableW / Math.max(n - 1, 1);
    const y = SVG_H / 2;
    for (let i = 0; i < n; i++) {
      pos[i] = { x: 55 + i * gap, y };
    }
    return pos;
  }

  const tailLen = entry; // nodes 0..entry-1 are the straight tail
  const cycleLen = n - entry; // nodes entry..n-1 form the loop

  // Tail spans the left portion, cycle sits as a circle on the right.
  const tailStartX = 55;
  const tailSpan = Math.min(tailLen * 78, SVG_W * 0.42);
  const tailGap = tailLen > 0 ? tailSpan / tailLen : 0;
  const midY = SVG_H / 2;

  for (let i = 0; i < tailLen; i++) {
    pos[i] = { x: tailStartX + i * tailGap, y: midY };
  }

  const cx = tailLen > 0 ? tailStartX + tailLen * tailGap + 110 : SVG_W * 0.5;
  const cy = midY;
  const radius = Math.min(115, 40 + cycleLen * 13);

  // Place the cycle nodes around a circle; entry node on the left of the circle
  // so the tail flows naturally into it.
  for (let k = 0; k < cycleLen; k++) {
    const idx = entry + k;
    const angle = Math.PI - (2 * Math.PI * k) / cycleLen;
    pos[idx] = {
      x: cx + radius * Math.cos(angle),
      y: cy - radius * Math.sin(angle),
    };
  }

  return pos;
}

// Pure frame builder. Returns array of { tortoise, hare, phase, caption, meeting, entryFound }.
function buildFrames(n, entry) {
  const acyclic = entry < 0 || entry >= n;
  const frames = [];

  // next(i): the node following i. Tail links forward; last cycle node loops to entry.
  const nextOf = (i) => {
    if (i < 0) return -1;
    if (acyclic) return i + 1 >= n ? -1 : i + 1;
    if (i === n - 1) return entry; // back-edge closes the loop
    return i + 1;
  };

  const cycleLen = acyclic ? 0 : n - entry;

  frames.push({
    tortoise: 0,
    hare: 0,
    phase: 1,
    steps: 0,
    meeting: false,
    entryFound: false,
    caption: 'Both pointers start at the head. Tortoise moves one step, hare moves two.',
  });

  if (acyclic) {
    // Hare walks off the end. Tortoise trails by half.
    let slow = 0;
    let fast = 0;
    let steps = 0;
    while (fast >= 0) {
      const f1 = nextOf(fast);
      if (f1 < 0) {
        frames.push({
          tortoise: slow,
          hare: -1,
          phase: 1,
          steps,
          meeting: false,
          entryFound: false,
          caption: 'Hare reached the end (null). No back-edge exists, so there is no cycle.',
        });
        break;
      }
      const f2 = nextOf(f1);
      slow = nextOf(slow);
      fast = f2;
      steps += 1;
      if (fast < 0) {
        frames.push({
          tortoise: slow,
          hare: -1,
          phase: 1,
          steps,
          meeting: false,
          entryFound: false,
          caption: 'Hare stepped past the tail into null. No cycle to detect.',
        });
        break;
      }
      frames.push({
        tortoise: slow,
        hare: fast,
        phase: 1,
        steps,
        meeting: false,
        entryFound: false,
        caption: `Step ${steps}: tortoise at ${slow}, hare at ${fast}. Hare is racing toward the end.`,
      });
    }
    return { frames, cycleLen: 0, acyclic: true };
  }

  // Phase 1: detect — advance until slow === fast.
  let slow = 0;
  let fast = 0;
  let steps = 0;
  // Bounded loop: a meeting is guaranteed within cycleLen iterations once both are inside.
  for (let guard = 0; guard < n * 3; guard++) {
    slow = nextOf(slow);
    fast = nextOf(nextOf(fast));
    steps += 1;
    const met = slow === fast;
    frames.push({
      tortoise: slow,
      hare: fast,
      phase: 1,
      steps,
      meeting: met,
      entryFound: false,
      caption: met
        ? `They meet at node ${slow} after ${steps} steps. A cycle exists. Now find where it starts.`
        : `Step ${steps}: tortoise -> ${slow} (1 step), hare -> ${fast} (2 steps).`,
    });
    if (met) break;
  }

  // Phase 2: find entry — reset one pointer to head, advance both by 1.
  let a = 0; // from head
  let b = slow; // from meeting point
  frames.push({
    tortoise: a,
    hare: b,
    phase: 2,
    steps,
    meeting: true,
    entryFound: false,
    caption: 'Phase 2: send the tortoise back to the head. Both now move one step at a time.',
  });

  for (let guard = 0; guard < n * 3; guard++) {
    if (a === b) break;
    a = nextOf(a);
    b = nextOf(b);
    steps += 1;
    const found = a === b;
    frames.push({
      tortoise: a,
      hare: b,
      phase: 2,
      steps,
      meeting: true,
      entryFound: found,
      caption: found
        ? `Both land on node ${a} — that is the cycle entry. Distance head->entry equals meeting->entry.`
        : `Advance both by one: tortoise at ${a}, second pointer at ${b}.`,
    });
    if (found) break;
  }

  return { frames, cycleLen, acyclic: false };
}

export default function FloydTortoiseHareViz() {
  const [n, setN] = useState(7);
  const [entry, setEntry] = useState(2);
  const [acyclic, setAcyclic] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const delay = Math.round(STEP_MS / speed);
  const effectiveEntry = acyclic ? -1 : Math.min(entry, n - 1);

  const built = useMemo(() => buildFrames(n, effectiveEntry), [n, effectiveEntry]);
  const frames = built.frames;
  const positions = useMemo(() => computeLayout(n, effectiveEntry), [n, effectiveEntry]);

  const safeIdx = Math.min(idx, frames.length - 1);
  const frame = frames[safeIdx];

  const atEnd = safeIdx >= frames.length - 1;
  const playing = playingRaw && safeIdx < frames.length - 1;

  const next = useCallback(() => {
    setIdx((i) => (i >= frames.length - 1 ? i : i + 1));
  }, [frames.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(next, delay);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next, delay]);

  const resetRun = useCallback(() => {
    setPlaying(false);
    setIdx(0);
  }, []);

  const changeN = (delta) => {
    setN((cur) => {
      const v = Math.max(MIN_N, Math.min(MAX_N, cur + delta));
      setEntry((e) => Math.min(e, v - 1));
      return v;
    });
    resetRun();
  };

  const changeEntry = (delta) => {
    setEntry((cur) => Math.max(0, Math.min(n - 1, cur + delta)));
    resetRun();
  };

  const toggleAcyclic = () => {
    setAcyclic((a) => !a);
    resetRun();
  };

  // Edges to draw: i -> nextOf(i), excluding null targets.
  const edges = useMemo(() => {
    const list = [];
    const isAcyclic = effectiveEntry < 0;
    for (let i = 0; i < n; i++) {
      let to;
      if (isAcyclic) to = i + 1 >= n ? -1 : i + 1;
      else if (i === n - 1) to = effectiveEntry;
      else to = i + 1;
      if (to >= 0) {
        list.push({ from: i, to, key: `${i}->${to}`, back: !isAcyclic && i === n - 1 });
      }
    }
    return list;
  }, [n, effectiveEntry]);

  const tort = frame.tortoise;
  const hare = frame.hare;

  const phaseLabel = built.acyclic
    ? 'Phase 1: detect'
    : frame.phase === 1
      ? 'Phase 1: detect'
      : 'Phase 2: find entry';

  const meetingText = built.acyclic
    ? 'no cycle'
    : frame.entryFound
      ? `entry @ ${tort}`
      : frame.meeting
        ? `met @ ${tort}`
        : 'not yet';

  return (
    <div className="fthviz">
      <div className="fthviz-header">
        <div className="fthviz-title">Floyd&apos;s tortoise &amp; hare cycle detection</div>
        <div className="fthviz-stats">
          <span className="fthviz-stat-label">Phase</span>
          <span className="fthviz-stat-value">{built.acyclic ? '—' : frame.phase}</span>
        </div>
      </div>

      <div className="fthviz-ops">
        <div className="fthviz-op">
          <span className="fthviz-op-label">Nodes</span>
          <button
            type="button"
            className="fthviz-step-btn"
            onClick={() => changeN(-1)}
            disabled={n <= MIN_N}
            aria-label="Fewer nodes"
          >
            <Minus size={13} />
          </button>
          <span className="fthviz-readout">{n}</span>
          <button
            type="button"
            className="fthviz-step-btn"
            onClick={() => changeN(1)}
            disabled={n >= MAX_N}
            aria-label="More nodes"
          >
            <Plus size={13} />
          </button>
        </div>

        <div className="fthviz-op">
          <span className="fthviz-op-label">Cycle entry</span>
          <button
            type="button"
            className="fthviz-step-btn"
            onClick={() => changeEntry(-1)}
            disabled={acyclic || entry <= 0}
            aria-label="Earlier entry"
          >
            <Minus size={13} />
          </button>
          <span className="fthviz-readout">{acyclic ? 'none' : effectiveEntry}</span>
          <button
            type="button"
            className="fthviz-step-btn"
            onClick={() => changeEntry(1)}
            disabled={acyclic || entry >= n - 1}
            aria-label="Later entry"
          >
            <Plus size={13} />
          </button>
        </div>

        <button
          type="button"
          className={`fthviz-btn ${acyclic ? 'fthviz-btn-primary' : 'fthviz-btn-secondary'}`}
          onClick={toggleAcyclic}
        >
          <span>{acyclic ? 'Acyclic list' : 'Make acyclic'}</span>
        </button>
      </div>

      <div className="fthviz-body">
        <div className="fthviz-stage">
          <svg
            className="fthviz-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Floyd cycle detection visualization"
          >
            <defs>
              <marker
                id="fthviz-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className="fthviz-arrow-head" />
              </marker>
              <marker
                id="fthviz-arrow-back"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className="fthviz-arrow-head-back" />
              </marker>
            </defs>

            <g className="fthviz-edges">
              {edges.map((e) => {
                const a = positions[e.from];
                const b = positions[e.to];
                if (!a || !b) return null;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const len = Math.max(Math.hypot(dx, dy), 1);
                const ux = dx / len;
                const uy = dy / len;
                const x1 = a.x + ux * NODE_R;
                const y1 = a.y + uy * NODE_R;
                const x2 = b.x - ux * NODE_R;
                const y2 = b.y - uy * NODE_R;
                if (e.back) {
                  // Curved back-edge so the loop closure reads clearly.
                  const mx = (x1 + x2) / 2 - uy * 38;
                  const my = (y1 + y2) / 2 + ux * 38;
                  return (
                    <path
                      key={e.key}
                      className="fthviz-edge fthviz-edge-back"
                      d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                      markerEnd="url(#fthviz-arrow-back)"
                    />
                  );
                }
                return (
                  <line
                    key={e.key}
                    className="fthviz-edge"
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    markerEnd="url(#fthviz-arrow)"
                  />
                );
              })}
            </g>

            {/* null sink marker for the acyclic tail end */}
            {built.acyclic && positions[n - 1] && (
              <g
                className="fthviz-null"
                transform={`translate(${positions[n - 1].x + 60}, ${positions[n - 1].y})`}
              >
                <line
                  className="fthviz-edge"
                  x1={-43}
                  y1={0}
                  x2={-12}
                  y2={0}
                  markerEnd="url(#fthviz-arrow)"
                />
                <text className="fthviz-null-text" textAnchor="middle" dominantBaseline="central">
                  null
                </text>
              </g>
            )}

            <g className="fthviz-nodes">
              {positions.map((p, id) => {
                if (!p) return null;
                const isTort = id === tort;
                const isHare = id === hare;
                const isEntry = !built.acyclic && id === effectiveEntry;
                const cls = [
                  'fthviz-node',
                  isEntry ? 'fthviz-node-entry' : '',
                  isTort && isHare ? 'fthviz-node-both' : isTort ? 'fthviz-node-tort' : isHare ? 'fthviz-node-hare' : '',
                  frame.entryFound && isEntry ? 'fthviz-node-found' : '',
                ].join(' ');
                return (
                  <g key={id} className={cls} transform={`translate(${p.x}, ${p.y})`}>
                    {(isTort || isHare) && <circle className="fthviz-node-ring" r={NODE_R + 6} />}
                    <circle className="fthviz-node-circle" r={NODE_R} />
                    <text className="fthviz-node-text" textAnchor="middle" dominantBaseline="central">
                      {id}
                    </text>
                    {isEntry && (
                      <text className="fthviz-tag fthviz-tag-entry" x="0" y={NODE_R + 15} textAnchor="middle">
                        entry
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Pointer chips ride above their node */}
            {tort >= 0 && positions[tort] && (
              <g
                className="fthviz-chip fthviz-chip-tort"
                transform={`translate(${positions[tort].x}, ${positions[tort].y - NODE_R - 22})`}
              >
                <rect className="fthviz-chip-bg" x={-26} y={-11} width={52} height={22} rx={6} />
                <text className="fthviz-chip-text" textAnchor="middle" dominantBaseline="central">
                  slow
                </text>
              </g>
            )}
            {hare >= 0 && positions[hare] && (
              <g
                className="fthviz-chip fthviz-chip-hare"
                transform={`translate(${positions[hare].x}, ${positions[hare].y + NODE_R + 22})`}
              >
                <rect className="fthviz-chip-bg" x={-26} y={-11} width={52} height={22} rx={6} />
                <text className="fthviz-chip-text" textAnchor="middle" dominantBaseline="central">
                  fast
                </text>
              </g>
            )}
          </svg>
        </div>

        <aside className="fthviz-sidebar">
          <div className="fthviz-panel">
            <div className="fthviz-panel-label">Phase</div>
            <div className="fthviz-panel-value">{phaseLabel}</div>
          </div>
          <div className="fthviz-readrow">
            <div className="fthviz-panel fthviz-panel-tort">
              <div className="fthviz-panel-label">
                <Turtle size={13} /> Tortoise
              </div>
              <div className="fthviz-panel-value">{tort >= 0 ? tort : '—'}</div>
            </div>
            <div className="fthviz-panel fthviz-panel-hare">
              <div className="fthviz-panel-label">
                <Rabbit size={13} /> Hare
              </div>
              <div className="fthviz-panel-value">{hare >= 0 ? hare : 'null'}</div>
            </div>
          </div>
          <div className="fthviz-readrow">
            <div className="fthviz-panel">
              <div className="fthviz-panel-label">Steps</div>
              <div className="fthviz-panel-value">{frame.steps}</div>
            </div>
            <div className="fthviz-panel">
              <div className="fthviz-panel-label">Cycle len</div>
              <div className="fthviz-panel-value">{built.acyclic ? '0' : built.cycleLen}</div>
            </div>
          </div>
          <div className="fthviz-panel">
            <div className="fthviz-panel-label">Meeting</div>
            <div className="fthviz-panel-value">{meetingText}</div>
          </div>
        </aside>
      </div>

      <p className="fthviz-caption">{frame.caption}</p>

      <div className="fthviz-controls">
        <button
          type="button"
          className="fthviz-btn fthviz-btn-ghost"
          onClick={resetRun}
          disabled={safeIdx === 0 && !playing}
        >
          <RotateCcw size={14} />
          <span>Restart</span>
        </button>
        <button
          type="button"
          className="fthviz-btn fthviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="fthviz-btn fthviz-btn-ghost"
          onClick={next}
          disabled={atEnd}
        >
          <SkipForward size={14} />
          <span>Step</span>
        </button>
        <label className="fthviz-speed">
          <span className="fthviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="fthviz-speed-range"
          />
          <span className="fthviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>
    </div>
  );
}
