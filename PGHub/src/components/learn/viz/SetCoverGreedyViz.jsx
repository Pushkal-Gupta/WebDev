import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './SetCoverGreedyViz.css';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const UNIVERSE_N = 12;
const SET_COUNT = 6;
const SET_HUES = [
  'var(--hue-violet)',
  'var(--hue-sky)',
  'var(--hue-pink)',
  'var(--hue-mint)',
  'var(--medium)',
  'var(--accent)',
];

// Build a random-but-coverable instance: SET_COUNT subsets of {0..UNIVERSE_N-1}
// whose union is the whole universe.
function makeInstance(seed) {
  const rand = mulberry32(seed);
  const sets = [];
  for (let s = 0; s < SET_COUNT; s++) {
    const members = new Set();
    const target = 2 + Math.floor(rand() * 4); // 2..5 elements
    for (let k = 0; k < target; k++) members.add(Math.floor(rand() * UNIVERSE_N));
    sets.push(members);
  }
  // Guarantee full coverage: assign every still-uncovered element to a random set.
  const covered = new Set();
  sets.forEach((m) => m.forEach((e) => covered.add(e)));
  for (let e = 0; e < UNIVERSE_N; e++) {
    if (!covered.has(e)) sets[Math.floor(rand() * SET_COUNT)].add(e);
  }
  return sets.map((m) => Array.from(m).sort((x, y) => x - y));
}

// Pure: ordered frames, one per greedy pick.
function buildFrames(sets) {
  const frames = [];
  const remaining = new Set();
  for (let e = 0; e < UNIVERSE_N; e++) remaining.add(e);
  const chosen = []; // [{idx, gained:[elements]}]
  const coveredBy = new Array(UNIVERSE_N).fill(-1); // set index that covered each element

  const gainsNow = () => sets.map((s) => s.filter((e) => remaining.has(e)).length);

  const snap = (extra) => ({
    coveredBy: coveredBy.slice(),
    remaining: Array.from(remaining),
    chosen: chosen.map((c) => ({ ...c, gained: c.gained.slice() })),
    gains: gainsNow(),
    bestIdx: -1,
    pickStep: chosen.length,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `Start: ${UNIVERSE_N} elements, all uncovered. Greedy will repeatedly take the set covering the most still-uncovered elements.`,
  }));

  let guard = 0;
  while (remaining.size > 0 && guard < SET_COUNT + 2) {
    guard += 1;
    const gains = gainsNow();
    let bestIdx = -1;
    let bestGain = 0;
    for (let i = 0; i < sets.length; i++) {
      if (gains[i] > bestGain) {
        bestGain = gains[i];
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;

    // highlight frame: show the winner before applying
    frames.push(snap({
      gains,
      bestIdx,
      note: `Step ${chosen.length + 1}: S${bestIdx + 1} covers ${bestGain} new element${bestGain === 1 ? '' : 's'} — the most of any set. Pick it.`,
    }));

    const gained = sets[bestIdx].filter((e) => remaining.has(e));
    gained.forEach((e) => {
      remaining.delete(e);
      coveredBy[e] = bestIdx;
    });
    chosen.push({ idx: bestIdx, gained });

    const coveredCount = UNIVERSE_N - remaining.size;
    frames.push(snap({
      bestIdx,
      note: remaining.size === 0
        ? `S${bestIdx + 1} added. ${coveredCount}/${UNIVERSE_N} covered — universe complete with ${chosen.length} set${chosen.length === 1 ? '' : 's'}.`
        : `S${bestIdx + 1} added — its ${gained.length} element${gained.length === 1 ? '' : 's'} are now filled in. ${coveredCount}/${UNIVERSE_N} covered.`,
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 1200;

export default function SetCoverGreedyViz({ seed = 11 }) {
  const [instanceSeed, setInstanceSeed] = useState(seed);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const sets = useMemo(() => makeInstance(instanceSeed), [instanceSeed]);
  const frames = useMemo(() => buildFrames(sets), [sets]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  const maxGain = useMemo(() => Math.max(1, ...current.gains), [current.gains]);
  const coveredCount = UNIVERSE_N - current.remaining.length;
  const bestGainNow = current.bestIdx >= 0 ? current.gains[current.bestIdx] : Math.max(0, ...current.gains);

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

  const newInstance = () => {
    setIsRunning(false);
    setStep(0);
    setInstanceSeed((s) => (s * 1664525 + 1013904223) >>> 0);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 460;

  // universe row across the top
  const uniTop = 56;
  const uniPad = 50;
  const uniGap = (W - uniPad * 2) / (UNIVERSE_N - 1);
  const uniX = (e) => uniPad + e * uniGap;
  const uniR = 17;

  // candidate set rows on the left
  const setLeft = 30;
  const setTop = 130;
  const setRowH = 50;
  const setRowY = (i) => setTop + i * setRowH;
  const setLabelW = 200;
  const barTrackX = setLeft + setLabelW + 24; // bars start right of the set chip
  const barTrackW = 150;

  const chosenIdxs = new Set(current.chosen.map((c) => c.idx));

  return (
    <div className="scg">
      <div className="scg-head">
        <h3 className="scg-title">Greedy set cover — always grab the most uncovered elements</h3>
        <p className="scg-sub">
          Twelve elements need covering by candidate sets S1–S6. Each step takes the set with the largest marginal
          gain (newly-covered count). The chosen sets stack on the right; elements fill with the winner&apos;s color.
        </p>
      </div>

      <div className="scg-controls">
        <div className="scg-modes" role="group" aria-label="Instance">
          <button type="button" className="scg-mode scg-shuffle" onClick={newInstance}>
            <Shuffle size={13} /> new instance
          </button>
        </div>

        <label className="scg-speed">
          <span className="scg-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="scg-speed-range"
            aria-label="Playback speed"
          />
          <span className="scg-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="scg-spacer" aria-hidden="true" />

        <div className="scg-buttons">
          <button
            type="button"
            className="scg-btn scg-btn-primary"
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
            className="scg-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="scg-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="scg-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="scg-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="scg-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="scg-svg" preserveAspectRatio="xMidYMid meet">
          <text className="scg-section-label" x={uniPad} y={30} textAnchor="start">universe · {coveredCount}/{UNIVERSE_N} covered</text>
          {Array.from({ length: UNIVERSE_N }).map((_, e) => {
            const owner = current.coveredBy[e];
            const filled = owner >= 0;
            return (
              <g key={`u-${e}`}>
                <circle
                  className={`scg-elt ${filled ? 'is-covered' : ''}`}
                  cx={uniX(e)}
                  cy={uniTop}
                  r={uniR}
                  style={filled ? { fill: SET_HUES[owner], stroke: SET_HUES[owner] } : undefined}
                />
                <text className={`scg-elt-text ${filled ? 'is-covered' : ''}`} x={uniX(e)} y={uniTop + 4}>{e + 1}</text>
              </g>
            );
          })}

          <text className="scg-section-label" x={setLeft} y={setTop - 14} textAnchor="start">candidate sets · marginal gain</text>

          {sets.map((members, i) => {
            const gain = current.gains[i];
            const isBest = current.bestIdx === i;
            const isChosen = chosenIdxs.has(i);
            const y = setRowY(i);
            const barW = (gain / maxGain) * barTrackW;
            return (
              <g key={`set-${i}`} className={`scg-setrow ${isBest ? 'is-best' : ''} ${isChosen ? 'is-chosen' : ''}`}>
                <rect
                  className="scg-set-chip"
                  x={setLeft}
                  y={y}
                  width={setLabelW}
                  height={setRowH - 12}
                  rx={7}
                  style={isBest || isChosen ? { stroke: SET_HUES[i] } : undefined}
                />
                <rect x={setLeft} y={y} width={5} height={setRowH - 12} rx={2.5} fill={SET_HUES[i]} opacity={isChosen || isBest ? 1 : 0.55} />
                <text className="scg-set-name" x={setLeft + 16} y={y + 17} style={{ fill: SET_HUES[i] }}>S{i + 1}</text>
                <text className="scg-set-members" x={setLeft + 16} y={y + 31}>
                  {`{${members.map((m) => m + 1).join(', ')}}`}
                </text>

                {/* marginal-gain bar */}
                <rect
                  className="scg-bar-track"
                  x={barTrackX}
                  y={y + (setRowH - 12) / 2 - 8}
                  width={barTrackW}
                  height={16}
                  rx={5}
                />
                <rect
                  className="scg-gain-bar"
                  x={barTrackX}
                  y={y + (setRowH - 12) / 2 - 7}
                  width={Math.max(2, barW)}
                  height={14}
                  rx={4}
                  style={{ fill: SET_HUES[i], opacity: isChosen ? 0.35 : 1 }}
                />
                <text
                  className="scg-gain-num"
                  x={barTrackX + barTrackW + 12}
                  y={y + (setRowH - 12) / 2 + 4}
                >
                  {isChosen ? 'taken' : `+${gain}`}
                </text>
              </g>
            );
          })}

          {/* chosen cover column on the right */}
          <text className="scg-section-label" x={W - 200} y={setTop - 14} textAnchor="start">chosen cover</text>
          {current.chosen.length === 0 ? (
            <text className="scg-empty" x={W - 200} y={setTop + 20} textAnchor="start">none yet</text>
          ) : (
            current.chosen.map((c, ci) => {
              const y = setTop + ci * 40;
              return (
                <g key={`chosen-${ci}`}>
                  <rect
                    className="scg-chosen-chip"
                    x={W - 200}
                    y={y}
                    width={170}
                    height={30}
                    rx={7}
                    style={{ stroke: SET_HUES[c.idx] }}
                  />
                  <rect x={W - 200} y={y} width={5} height={30} rx={2.5} fill={SET_HUES[c.idx]} />
                  <text className="scg-chosen-name" x={W - 200 + 16} y={y + 19} style={{ fill: SET_HUES[c.idx] }}>S{c.idx + 1}</text>
                  <text className="scg-chosen-sub" x={W - 200 + 52} y={y + 19}>+{c.gained.length} new</text>
                </g>
              );
            })
          )}
        </svg>
      </div>

      <div className="scg-metrics">
        <div className="scg-metric">
          <span className="scg-metric-label">covered</span>
          <span className="scg-metric-value is-mint">{coveredCount} / {UNIVERSE_N}</span>
        </div>
        <div className="scg-metric">
          <span className="scg-metric-label">sets chosen</span>
          <span className="scg-metric-value is-violet">{current.chosen.length}</span>
        </div>
        <div className="scg-metric">
          <span className="scg-metric-label">best marginal gain</span>
          <span className="scg-metric-value is-pink">{bestGainNow > 0 ? `+${bestGainNow}` : '—'}</span>
        </div>
        <div className="scg-metric">
          <span className="scg-metric-label">step</span>
          <span className="scg-metric-value">{current.remaining.length === 0 ? 'done' : current.pickStep + 1}</span>
        </div>
      </div>

      <div className="scg-narration">
        <span className="scg-narration-label">trace</span>
        <span className="scg-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
