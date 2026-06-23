import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Check } from 'lucide-react';
import './PalindromeEertreeViz.css';

const TICK_MS = 850;
const PRESETS = ['abba', 'ababa', 'aabaa'];

// Build eertree, recording a snapshot after each character append.
function buildEertree(s) {
  // node: { id, len, suffix:linkId, label }
  const ODD = 0;
  const EVEN = 1;
  const nodes = [
    { id: ODD, len: -1, suffix: ODD, label: 'odd(-1)' },
    { id: EVEN, len: 0, suffix: ODD, label: 'even(0)' },
  ];
  const to = [new Map(), new Map()]; // transitions per node
  let last = EVEN;
  const steps = [];

  steps.push({
    i: -1,
    ch: null,
    nodes: nodes.map((n) => ({ ...n })),
    edges: [],
    newId: null,
    distinct: 0,
    caption: 'Two imaginary roots: odd-root (len -1) and even-root (len 0). Append characters one at a time.',
  });

  function getLink(curId, idx) {
    let cur = curId;
    while (true) {
      const length = nodes[cur].len;
      const j = idx - length - 1;
      if (j >= 0 && s[j] === s[idx]) return cur;
      cur = nodes[cur].suffix;
    }
  }

  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    let cur = getLink(last, i);
    if (to[cur].has(c)) {
      last = to[cur].get(c);
      steps.push({
        i,
        ch: c,
        nodes: nodes.map((n) => ({ ...n })),
        edges: buildEdges(nodes, to),
        newId: null,
        reuse: last,
        distinct: nodes.length - 2,
        caption: `Append '${c}': palindrome "${nodes[last].label}" already exists — reuse, no new node.`,
      });
      continue;
    }
    const newLen = nodes[cur].len + 2;
    const center = s.slice(i - newLen + 1, i + 1);
    const newId = nodes.length;
    let suffixLink;
    if (newLen === 1) {
      suffixLink = EVEN;
    } else {
      const q = getLink(nodes[cur].suffix, i);
      suffixLink = to[q].get(c);
    }
    nodes.push({ id: newId, len: newLen, suffix: suffixLink, label: center });
    to.push(new Map());
    to[cur].set(c, newId);
    last = newId;
    steps.push({
      i,
      ch: c,
      nodes: nodes.map((n) => ({ ...n })),
      edges: buildEdges(nodes, to),
      newId,
      distinct: nodes.length - 2,
      caption: `Append '${c}': new palindrome "${center}" (len ${newLen}). Suffix link → "${nodes[suffixLink].label}".`,
    });
  }

  const lastStep = steps[steps.length - 1];
  steps.push({
    ...lastStep,
    i: s.length,
    ch: null,
    newId: null,
    reuse: null,
    done: true,
    caption: `Done: ${lastStep.distinct} distinct palindromic substrings stored in ${lastStep.distinct} nodes — linear in |S|.`,
  });
  return steps;
}

function buildEdges(nodes, to) {
  const edges = [];
  for (let from = 0; from < to.length; from += 1) {
    to[from].forEach((child, ch) => {
      edges.push({ from, to: child, ch });
    });
  }
  // suffix links for real nodes (id >= 2)
  for (let i = 2; i < nodes.length; i += 1) {
    edges.push({ from: i, to: nodes[i].suffix, ch: null, suffix: true });
  }
  return edges;
}

// Layered layout: roots on top, then by length.
function layout(nodes) {
  const byLen = new Map();
  nodes.forEach((n) => {
    const key = n.len < 1 ? n.len : n.len;
    if (!byLen.has(key)) byLen.set(key, []);
    byLen.get(key).push(n);
  });
  const lens = [...byLen.keys()].sort((a, b) => a - b);
  const pos = new Map();
  const W = 460;
  const rowH = 66;
  lens.forEach((len, row) => {
    const group = byLen.get(len);
    const gap = W / (group.length + 1);
    group.forEach((n, k) => {
      pos.set(n.id, { x: 20 + gap * (k + 1), y: 36 + row * rowH });
    });
  });
  return { pos, height: 36 + lens.length * rowH + 10 };
}

export default function PalindromeEertreeViz() {
  const [word, setWord] = useState('abba');
  const steps = useMemo(() => buildEertree(word), [word]);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const [prev, setPrev] = useState(steps);
  if (prev !== steps) {
    setPrev(steps);
    setIdx(0);
    setPlaying(false);
  }

  const atEnd = idx >= steps.length - 1;
  const playing = playingRaw && !atEnd;
  const step = steps[Math.min(idx, steps.length - 1)];

  const next = useCallback(() => {
    setIdx((i) => (i >= steps.length - 1 ? i : i + 1));
  }, [steps.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return undefined;
    }
    timerRef.current = setInterval(next, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  const { pos, height } = useMemo(() => layout(step.nodes), [step.nodes]);
  const W = 480;

  return (
    <div className="eerviz">
      <div className="eerviz-header">
        <div className="eerviz-title">Eertree — building palindromic tree</div>
        <div className="eerviz-presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`eerviz-pbtn ${word === p ? 'eerviz-pbtn-active' : ''}`}
              onClick={() => setWord(p)}
              aria-pressed={word === p}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="eerviz-string">
        {word.split('').map((c, i) => {
          let cls = 'eerviz-char';
          if (i === step.i) cls += ' eerviz-char-cur';
          else if (i < step.i || (step.done && true)) cls += ' eerviz-char-done';
          return (
            <span key={i} className={cls}>
              {c}
            </span>
          );
        })}
      </div>

      <div className="eerviz-stage">
        <svg viewBox={`0 0 ${W} ${height}`} className="eerviz-svg" role="img" aria-label="Eertree structure">
          {step.edges.map((e, k) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            if (e.suffix) {
              const mx = (a.x + b.x) / 2 + 28;
              return (
                <path
                  key={`s${k}`}
                  d={`M ${a.x} ${a.y} Q ${mx} ${(a.y + b.y) / 2} ${b.x} ${b.y}`}
                  className="eerviz-suffix"
                />
              );
            }
            return (
              <g key={`e${k}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="eerviz-edge" />
                <text
                  x={(a.x + b.x) / 2 - 6}
                  y={(a.y + b.y) / 2}
                  className="eerviz-edge-ch"
                  textAnchor="middle"
                >
                  {e.ch}
                </text>
              </g>
            );
          })}
          {step.nodes.map((n) => {
            const p = pos.get(n.id);
            if (!p) return null;
            const isRoot = n.id < 2;
            const isNew = step.newId === n.id;
            const isReuse = step.reuse === n.id;
            let cls = 'eerviz-node';
            if (isRoot) cls += ' eerviz-node-root';
            if (isNew) cls += ' eerviz-node-new';
            if (isReuse) cls += ' eerviz-node-reuse';
            return (
              <g key={n.id}>
                <rect
                  x={p.x - 24}
                  y={p.y - 14}
                  width={48}
                  height={28}
                  rx={7}
                  className={cls}
                />
                <text x={p.x} y={p.y + 4} className="eerviz-node-label" textAnchor="middle">
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="eerviz-stats">
        <div className="eerviz-stat">
          <span className="eerviz-stat-k">distinct palindromes</span>
          <span className="eerviz-stat-v">{step.distinct}</span>
        </div>
        <div className="eerviz-stat">
          <span className="eerviz-stat-k">nodes (+2 roots)</span>
          <span className="eerviz-stat-v">{step.nodes.length}</span>
        </div>
        <div className="eerviz-stat">
          <span className="eerviz-stat-k">bound ≤ |S|+2</span>
          <span className="eerviz-stat-v">{word.length + 2}</span>
        </div>
      </div>

      <div className="eerviz-legend">
        <span className="eerviz-leg eerviz-leg-edge">parent (extend by c)</span>
        <span className="eerviz-leg eerviz-leg-suf">suffix link</span>
      </div>

      <p className="eerviz-caption">
        {step.done && <Check size={14} className="eerviz-cap-icon" aria-hidden="true" />}
        <span>{step.caption}</span>
      </p>

      <div className="eerviz-controls">
        <button
          type="button"
          className="eerviz-btn eerviz-btn-ghost"
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
          className="eerviz-btn eerviz-btn-primary"
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
        <button type="button" className="eerviz-btn eerviz-btn-ghost" onClick={next} disabled={atEnd}>
          <SkipForward size={15} aria-hidden="true" />
          <span>Step</span>
        </button>
        <span className="eerviz-step">{idx} / {steps.length - 1}</span>
      </div>
    </div>
  );
}
