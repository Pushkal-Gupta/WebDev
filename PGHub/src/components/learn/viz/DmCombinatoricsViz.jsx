import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { Play, Pause, StepForward, RotateCcw, Triangle, ArrowLeftRight } from 'lucide-react';
import './DmCombinatoricsViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const ALL = ['A', 'B', 'C', 'D', 'E'];
const PASCAL_DEPTH = 6; // rows 0..6, covers n up to 5

function binom(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

function combinations(arr, k) {
  const res = [];
  const combo = [];
  const rec = (start) => {
    if (combo.length === k) { res.push(combo.slice()); return; }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      rec(i + 1);
      combo.pop();
    }
  };
  rec(0);
  return res;
}

function permutations(arr, k) {
  const res = [];
  const used = new Array(arr.length).fill(false);
  const cur = [];
  const rec = () => {
    if (cur.length === k) { res.push(cur.slice()); return; }
    for (let i = 0; i < arr.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(arr[i]);
      rec();
      cur.pop();
      used[i] = false;
    }
  };
  rec();
  return res;
}

export default function DmCombinatoricsViz() {
  const [n, setN] = useState(4);
  const [k, setK] = useState(2);
  const [mode, setMode] = useState('perm'); // 'perm' | 'comb'
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5); // 1..10
  const timer = useRef(null);

  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const elements = useMemo(() => ALL.slice(0, n), [n]);

  const list = useMemo(
    () => (mode === 'perm' ? permutations(elements, k) : combinations(elements, k)),
    [elements, k, mode],
  );

  useEffect(() => {
    if (!playing || idx >= list.length - 1) return undefined;
    const ms = reduced ? 90 : 1150 - speed * 100;
    timer.current = setTimeout(() => {
      const next = Math.min(idx + 1, list.length - 1);
      setIdx(next);
      if (next >= list.length - 1) setPlaying(false);
    }, ms);
    return () => clearTimeout(timer.current);
  }, [playing, idx, list.length, speed, reduced]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const applyN = (v) => {
    setN(v);
    if (k > v) setK(v);
    setIdx(0);
    setPlaying(false);
  };
  const applyK = (v) => { setK(v); setIdx(0); setPlaying(false); };
  const applyMode = (m) => { setMode(m); setIdx(0); setPlaying(false); };

  const atEnd = idx >= list.length - 1;
  const togglePlay = () => {
    if (atEnd) { setIdx(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  };
  const step = () => { setPlaying(false); setIdx((i) => Math.min(i + 1, list.length - 1)); };
  const reset = () => { setPlaying(false); setIdx(0); };

  const total = list.length;
  const current = list[Math.min(idx, total - 1)] || [];

  // ---- count formula (numbers plugged in) ----
  const nf = (x) => {
    let r = 1;
    for (let i = 2; i <= x; i++) r *= i;
    return r;
  };
  const countTex = mode === 'perm'
    ? `P(${n},${k})=\\dfrac{${n}!}{(${n}-${k})!}=\\dfrac{${nf(n)}}{${nf(n - k)}}=${total}`
    : `\\binom{${n}}{${k}}=\\dfrac{${n}!}{${k}!\\,(${n}-${k})!}=\\dfrac{${nf(n)}}{${nf(k)}\\cdot ${nf(n - k)}}=${total}`;

  // ---- Pascal triangle geometry ----
  const PW = 440;
  const PH = 300;
  const topY = 30;
  const gapY = (PH - topY - 24) / PASCAL_DEPTH;
  const gapX = 58;
  const cx = PW / 2;
  const nodes = [];
  for (let r = 0; r <= PASCAL_DEPTH; r++) {
    for (let c = 0; c <= r; c++) {
      nodes.push({
        r,
        c,
        val: binom(r, c),
        x: cx + (c - r / 2) * gapX,
        y: topY + r * gapY,
        active: mode === 'comb' && r === n && c === k,
        onRow: r === n,
      });
    }
  }

  const nChips = [3, 4, 5];
  const kChips = [];
  for (let i = 0; i <= n; i++) kChips.push(i);

  return (
    <div className="dmcb">
      <div className="dmcb-head">
        <div className="dmcb-head-icon"><Triangle size={18} /></div>
        <div className="dmcb-head-text">
          <h3 className="dmcb-title">Permutations vs combinations: enumerate every selection</h3>
          <p className="dmcb-sub">
            Pick <span dangerouslySetInnerHTML={{ __html: km('n') }} /> elements and a size{' '}
            <span dangerouslySetInnerHTML={{ __html: km('k') }} />, then step through every ordered
            arrangement or unordered subset in lexicographic order. Order matters for{' '}
            <span dangerouslySetInnerHTML={{ __html: km('P(n,k)') }} />; it is ignored for{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\binom{n}{k}') }} />.
          </p>
        </div>
        <button type="button" className="dmcb-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dmcb-config">
        <div className="dmcb-pickrow">
          <span className="dmcb-pick-label" dangerouslySetInnerHTML={{ __html: km('n=') }} />
          {nChips.map((v) => (
            <button
              key={v}
              type="button"
              className={`dmcb-chip ${n === v ? 'dmcb-chip-on' : ''}`}
              onClick={() => applyN(v)}
            >
              {v}
            </button>
          ))}
          <span className="dmcb-pick-set">{`{ ${elements.join(', ')} }`}</span>
        </div>
        <div className="dmcb-pickrow">
          <span className="dmcb-pick-label" dangerouslySetInnerHTML={{ __html: km('k=') }} />
          {kChips.map((v) => (
            <button
              key={v}
              type="button"
              className={`dmcb-chip ${k === v ? 'dmcb-chip-on' : ''}`}
              onClick={() => applyK(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="dmcb-modes">
          <button
            type="button"
            className={`dmcb-mode ${mode === 'perm' ? 'dmcb-mode-on' : ''}`}
            onClick={() => applyMode('perm')}
          >
            Permutations <span dangerouslySetInnerHTML={{ __html: km('P(n,k)') }} />
          </button>
          <button type="button" className="dmcb-swap" onClick={() => applyMode(mode === 'perm' ? 'comb' : 'perm')}>
            <ArrowLeftRight size={14} />
          </button>
          <button
            type="button"
            className={`dmcb-mode ${mode === 'comb' ? 'dmcb-mode-on' : ''}`}
            onClick={() => applyMode('comb')}
          >
            Combinations <span dangerouslySetInnerHTML={{ __html: km('\\binom{n}{k}') }} />
          </button>
        </div>
      </div>

      <div className="dmcb-body">
        <div className="dmcb-left">
          <div className="dmcb-formula" dangerouslySetInnerHTML={{ __html: km(countTex, true) }} />

          <div className="dmcb-current">
            <span className="dmcb-current-cap">
              {mode === 'perm' ? 'arrangement' : 'subset'} {Math.min(idx + 1, total)} of {total}
            </span>
            <div className="dmcb-current-chips">
              {current.length === 0
                ? <span className="dmcb-empty">{'{ }'}</span>
                : current.map((el, i) => (
                  <span key={i} className={`dmcb-tok ${reduced ? '' : 'dmcb-tok-anim'}`}>{el}</span>
                ))}
            </div>
          </div>

          <div className="dmcb-enum">
            {list.map((item, i) => (
              <span
                key={i}
                className={`dmcb-item ${i === idx ? 'dmcb-item-on' : ''} ${i < idx ? 'dmcb-item-done' : ''}`}
              >
                {mode === 'perm' ? item.join('') : item.join('')}
              </span>
            ))}
          </div>

          <div className="dmcb-controls">
            <button type="button" className="dmcb-btn dmcb-btn-primary" onClick={togglePlay}>
              {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : (atEnd ? 'Replay' : 'Play')}
            </button>
            <button type="button" className="dmcb-btn" onClick={step} disabled={atEnd}>
              <StepForward size={14} /> Step
            </button>
            <label className="dmcb-speed">
              <span>slow</span>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
              />
              <span>fast</span>
            </label>
          </div>
        </div>

        <div className="dmcb-right">
          <div className="dmcb-pascal-cap">
            Pascal&rsquo;s triangle &mdash; entry <span dangerouslySetInnerHTML={{ __html: km('\\binom{n}{k}') }} />
            {mode === 'comb'
              ? <> highlights the current <span dangerouslySetInnerHTML={{ __html: km(`\\binom{${n}}{${k}}=${binom(n, k)}`) }} /></>
              : <> (switch to combinations to highlight a cell)</>}
          </div>
          <svg viewBox={`0 0 ${PW} ${PH}`} className="dmcb-pascal-svg" preserveAspectRatio="xMidYMid meet">
            {nodes.map((nd, i) => {
              const parents = [];
              if (nd.r > 0) {
                if (nd.c > 0) parents.push({ x: nd.x - gapX / 2, y: nd.y - gapY });
                if (nd.c < nd.r) parents.push({ x: nd.x + gapX / 2, y: nd.y - gapY });
              }
              return (
                <g key={i}>
                  {parents.map((pa, j) => (
                    <line key={j} x1={pa.x} y1={pa.y} x2={nd.x} y2={nd.y} className="dmcb-edge" />
                  ))}
                </g>
              );
            })}
            {nodes.map((nd, i) => (
              <g key={`c${i}`}>
                <circle
                  cx={nd.x}
                  cy={nd.y}
                  r="15"
                  className={`dmcb-node ${nd.active ? 'dmcb-node-active' : ''} ${nd.onRow && mode === 'comb' ? 'dmcb-node-row' : ''}`}
                />
                <text x={nd.x} y={nd.y} className={`dmcb-node-txt ${nd.active ? 'dmcb-node-txt-active' : ''}`} textAnchor="middle" dominantBaseline="central">
                  {nd.val}
                </text>
              </g>
            ))}
          </svg>
          <div className="dmcb-pascal-note" dangerouslySetInnerHTML={{ __html: km('\\binom{n}{k}=\\binom{n-1}{k-1}+\\binom{n-1}{k}') }} />
        </div>
      </div>
    </div>
  );
}
