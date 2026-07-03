import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Check } from 'lucide-react';
import './PermutationsBacktrackViz.css';

const TICK_MS = 650;

function buildSteps(nums) {
  const steps = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  const results = [];

  function snap(kind, caption, extra = {}) {
    steps.push({
      kind,
      caption,
      path: [...path],
      used: [...used],
      results: results.map((r) => [...r]),
      ...extra,
    });
  }

  snap('start', `Start with empty path. ${nums.length}! = ${factorial(nums.length)} permutations to enumerate.`);

  function dfs() {
    if (path.length === nums.length) {
      results.push([...path]);
      snap('leaf', `Path length = ${nums.length}: record permutation [${path.join(', ')}].`, {
        leaf: true,
      });
      return;
    }
    for (let i = 0; i < nums.length; i += 1) {
      if (used[i]) {
        snap('skip', `${nums[i]} already used on this branch — skip.`, { hover: i });
        continue;
      }
      used[i] = true;
      path.push(nums[i]);
      snap('choose', `Choose ${nums[i]} (mark used). Path = [${path.join(', ')}].`, { hover: i });
      dfs();
      path.pop();
      used[i] = false;
      snap('unchoose', `Backtrack: undo ${nums[i]} (unmark). Path = [${path.join(', ')}].`, {
        hover: i,
      });
    }
  }

  dfs();
  snap('done', `Done. All ${results.length} permutations enumerated.`, { done: true });
  return steps;
}

function factorial(n) {
  let f = 1;
  for (let i = 2; i <= n; i += 1) f *= i;
  return f;
}

export default function PermutationsBacktrackViz() {
  const [n, setN] = useState(3);
  const nums = useMemo(() => Array.from({ length: n }, (_, i) => i + 1), [n]);
  const steps = useMemo(() => buildSteps(nums), [nums]);

  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const [prev, setPrev] = useState(steps);
  if (prev !== steps) {
    setPrev(steps);
    setIdx(0);
    setPlaying(false);
  }

  const step = steps[Math.min(idx, steps.length - 1)];
  const atEnd = idx >= steps.length - 1;
  const playing = playingRaw && !atEnd;

  const next = useCallback(() => {
    setIdx((i) => (i >= steps.length - 1 ? i : i + 1));
  }, [steps.length]);

  const delay = Math.round(TICK_MS / speed);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return undefined;
    }
    timerRef.current = setInterval(next, delay);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next, delay]);

  return (
    <div className="pbtviz">
      <div className="pbtviz-header">
        <div className="pbtviz-title">Permutations via backtracking</div>
        <div className="pbtviz-nselect">
          {[2, 3, 4].map((k) => (
            <button
              key={k}
              type="button"
              className={`pbtviz-nbtn ${n === k ? 'pbtviz-nbtn-active' : ''}`}
              onClick={() => setN(k)}
              aria-pressed={n === k}
            >
              n = {k}
            </button>
          ))}
        </div>
      </div>

      <div className="pbtviz-board">
        <div className="pbtviz-elements" aria-label="elements">
          {nums.map((x, i) => {
            const isUsed = step.used[i];
            const isHover = step.hover === i;
            let cls = 'pbtviz-el';
            if (isUsed) cls += ' pbtviz-el-used';
            if (isHover) cls += ' pbtviz-el-hover';
            return (
              <div key={i} className={cls}>
                <span className="pbtviz-el-val">{x}</span>
                <span className="pbtviz-el-tag">{isUsed ? 'used' : 'free'}</span>
              </div>
            );
          })}
        </div>

        <div className="pbtviz-path-row">
          <span className="pbtviz-path-label">path</span>
          <div className="pbtviz-path">
            {step.path.length === 0 && <span className="pbtviz-path-empty">[ ]</span>}
            {step.path.map((x, i) => (
              <span key={i} className="pbtviz-path-cell">
                {x}
              </span>
            ))}
            {Array.from({ length: n - step.path.length }).map((_, i) => (
              <span key={`s${i}`} className="pbtviz-path-slot" />
            ))}
          </div>
        </div>
      </div>

      <div className="pbtviz-results">
        <div className="pbtviz-results-head">
          permutations <span>{step.results.length}</span>
        </div>
        <div className="pbtviz-results-grid">
          {step.results.map((r, i) => (
            <span
              key={i}
              className={`pbtviz-perm ${step.leaf && i === step.results.length - 1 ? 'pbtviz-perm-new' : ''}`}
            >
              [{r.join(',')}]
            </span>
          ))}
          {step.results.length === 0 && (
            <span className="pbtviz-perm-empty">none recorded yet</span>
          )}
        </div>
      </div>

      <p className="pbtviz-caption">
        {step.done && <Check size={14} className="pbtviz-caption-icon" aria-hidden="true" />}
        <span>{step.caption}</span>
      </p>

      <div className="pbtviz-controls">
        <button
          type="button"
          className="pbtviz-btn pbtviz-btn-ghost"
          onClick={() => {
            setPlaying(false);
            setIdx(0);
          }}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="pbtviz-btn pbtviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="pbtviz-btn pbtviz-btn-ghost"
          onClick={next}
          disabled={atEnd}
        >
          <SkipForward size={15} aria-hidden="true" />
          <span>Step</span>
        </button>
        <label className="pbtviz-speed">
          <span className="pbtviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pbtviz-speed-range"
          />
          <span className="pbtviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="pbtviz-step-count">
          {idx} / {steps.length - 1}
        </span>
      </div>
    </div>
  );
}
