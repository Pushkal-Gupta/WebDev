import React, { useMemo, useState } from 'react';
import {
  Type,
  List as ListIcon,
  Hash as HashIcon,
  Layers,
  Trophy,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Play,
} from 'lucide-react';
import './RedisDataStructuresViz.css';

// The five core Redis data types and the access patterns each one is built for.
//
// Each type ships with a fixed preset command sequence. A step index decides how
// many of those commands have been applied, so "Run command" advances one step
// and replays the structure deterministically — never random. The structure is
// rebuilt from scratch up to `step` every render, so the SVG always matches state.

// One color token per member slot so the eye tracks each value as the structure grows.
const HUES = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

const TYPES = [
  {
    key: 'string',
    label: 'String',
    icon: Type,
    tip: 'cache values · counters · flags',
    commands: [
      { cmd: 'SET user:1 "Tom"', result: 'OK' },
      { cmd: 'APPEND user:1 "!"', result: '(integer) 4' },
    ],
  },
  {
    key: 'list',
    label: 'List',
    icon: ListIcon,
    tip: 'queues · timelines · stacks',
    commands: [
      { cmd: 'LPUSH q a', result: '(integer) 1' },
      { cmd: 'RPUSH q b', result: '(integer) 2' },
      { cmd: 'LPUSH q c', result: '(integer) 3' },
    ],
  },
  {
    key: 'hash',
    label: 'Hash',
    icon: HashIcon,
    tip: 'objects · records · sessions',
    commands: [
      { cmd: 'HSET user:1 name Tom', result: '(integer) 1' },
      { cmd: 'HSET user:1 age 29', result: '(integer) 1' },
    ],
  },
  {
    key: 'set',
    label: 'Set',
    icon: Layers,
    tip: 'tags · uniqueness · membership',
    commands: [
      { cmd: 'SADD tags redis', result: '(integer) 1' },
      { cmd: 'SADD tags db', result: '(integer) 1' },
      { cmd: 'SADD tags redis', result: '(integer) 0' },
    ],
  },
  {
    key: 'zset',
    label: 'ZSet',
    icon: Trophy,
    tip: 'leaderboards · priority queues',
    commands: [
      { cmd: 'ZADD board 100 alice', result: '(integer) 1' },
      { cmd: 'ZADD board 250 bob', result: '(integer) 1' },
      { cmd: 'ZADD board 175 cara', result: '(integer) 1' },
      { cmd: 'ZRANGE board 0 -1 WITHSCORES', result: 'sorted ascending' },
    ],
  },
];

// Replay the first `step` commands of a type into a concrete structure description.
function buildModel(typeKey, step) {
  if (typeKey === 'string') {
    let val = '';
    if (step >= 1) val = 'Tom';
    if (step >= 2) val = 'Tom!';
    return { kind: 'string', key: 'user:1', value: val, count: val.length };
  }
  if (typeKey === 'list') {
    let list = [];
    if (step >= 1) list = ['a', ...list];
    if (step >= 2) list = [...list, 'b'];
    if (step >= 3) list = ['c', ...list];
    return { kind: 'list', key: 'q', items: list, count: list.length };
  }
  if (typeKey === 'hash') {
    const rows = [];
    if (step >= 1) rows.push({ field: 'name', value: 'Tom' });
    if (step >= 2) rows.push({ field: 'age', value: '29' });
    return { kind: 'hash', key: 'user:1', rows, count: rows.length };
  }
  if (typeKey === 'set') {
    const members = [];
    const add = (m) => { if (!members.includes(m)) members.push(m); };
    if (step >= 1) add('redis');
    if (step >= 2) add('db');
    if (step >= 3) add('redis');
    return { kind: 'set', key: 'tags', members, count: members.length };
  }
  // zset
  const entries = [];
  if (step >= 1) entries.push({ member: 'alice', score: 100 });
  if (step >= 2) entries.push({ member: 'bob', score: 250 });
  if (step >= 3) entries.push({ member: 'cara', score: 175 });
  const sorted = [...entries].sort((a, b) => a.score - b.score);
  return { kind: 'zset', key: 'board', entries: sorted, count: sorted.length };
}

export default function RedisDataStructuresViz() {
  const [typeKey, setTypeKey] = useState('list');
  const [step, setStep] = useState(0);

  const type = useMemo(() => TYPES.find((t) => t.key === typeKey), [typeKey]);
  const total = type.commands.length;
  const model = useMemo(() => buildModel(typeKey, step), [typeKey, step]);

  const lastCommand = step > 0 ? type.commands[step - 1] : null;

  const selectType = (key) => {
    setTypeKey(key);
    setStep(0);
  };

  const stepType = (dir) => {
    const idx = TYPES.findIndex((t) => t.key === typeKey);
    const next = (idx + dir + TYPES.length) % TYPES.length;
    setTypeKey(TYPES[next].key);
    setStep(0);
  };

  const runCommand = () => {
    setStep((s) => (s >= total ? total : s + 1));
  };

  const reset = () => {
    setStep(0);
  };

  // SVG geometry
  const W = 940;
  const H = 470;
  const stageX = 24;
  const stageW = W - 48;
  const titleY = 40;
  const bodyTop = 78;

  // shared column geometry for vertical structures (list / hash / set / zset)
  const colCx = W / 2;
  const cellH = 58;
  const cellGap = 12;
  const cellW = 300;

  const renderString = () => {
    const boxW = 540;
    const boxX = colCx - boxW / 2;
    const boxY = 150;
    const tag = HUES[0];
    return (
      <g>
        <text className="rdv-keylabel" x={colCx} y={130}>
          key  {model.key}
        </text>
        <rect
          className="rdv-cell"
          x={boxX}
          y={boxY}
          width={boxW}
          height={120}
          rx={12}
          style={{ stroke: tag }}
        />
        <rect x={boxX} y={boxY} width={boxW} height={7} rx={3.5} fill={tag} />
        <text className="rdv-slot-tag" x={boxX + 16} y={boxY + 34}>STRING</text>
        <text className="rdv-string-val" x={colCx} y={boxY + 80} style={{ fill: tag }}>
          {model.value ? `"${model.value}"` : '(empty)'}
        </text>
        <text className="rdv-axis" x={colCx} y={boxY + 150}>
          one flat value addressed by a single key
        </text>
      </g>
    );
  };

  const renderList = () => {
    const n = Math.max(model.items.length, 1);
    const startY = bodyTop + 40;
    return (
      <g>
        <text className="rdv-keylabel" x={colCx} y={bodyTop + 8}>
          key  {model.key}
        </text>
        {model.items.length === 0 && (
          <text className="rdv-axis" x={colCx} y={startY + 80}>empty list — run a command</text>
        )}
        {model.items.map((item, i) => {
          const tag = HUES[i % HUES.length];
          const cy = startY + i * (cellH + cellGap);
          return (
            <g key={`li-${i}`}>
              <rect
                className="rdv-cell"
                x={colCx - cellW / 2}
                y={cy}
                width={cellW}
                height={cellH}
                rx={9}
                style={{ stroke: tag }}
              />
              <rect x={colCx - cellW / 2} y={cy} width={7} height={cellH} rx={3.5} fill={tag} />
              <text className="rdv-cell-idx" x={colCx - cellW / 2 + 26} y={cy + cellH / 2 + 5}>
                {i}
              </text>
              <text className="rdv-cell-val" x={colCx} y={cy + cellH / 2 + 6} style={{ fill: tag }}>
                {item}
              </text>
              {i === 0 && (
                <text className="rdv-edge-tag" x={colCx + cellW / 2 + 12} y={cy + cellH / 2 + 4}>
                  HEAD
                </text>
              )}
              {i === model.items.length - 1 && (
                <text className="rdv-edge-tag" x={colCx + cellW / 2 + 12} y={cy + cellH / 2 + 4}>
                  {i === 0 ? '' : 'TAIL'}
                </text>
              )}
            </g>
          );
        })}
        {Array.from({ length: Math.max(0, n - 1) }).map((_, i) => {
          if (i >= model.items.length - 1) return null;
          const y1 = startY + i * (cellH + cellGap) + cellH;
          return (
            <line
              key={`lk-${i}`}
              className="rdv-link"
              x1={colCx}
              y1={y1}
              x2={colCx}
              y2={y1 + cellGap}
            />
          );
        })}
      </g>
    );
  };

  const renderHash = () => {
    const startY = bodyTop + 40;
    const fieldW = 150;
    const valW = 200;
    const gap = 14;
    const rowW = fieldW + valW + gap;
    const rowX = colCx - rowW / 2;
    return (
      <g>
        <text className="rdv-keylabel" x={colCx} y={bodyTop + 8}>
          key  {model.key}
        </text>
        {model.rows.length === 0 && (
          <text className="rdv-axis" x={colCx} y={startY + 80}>empty hash — run a command</text>
        )}
        {model.rows.map((row, i) => {
          const tag = HUES[i % HUES.length];
          const cy = startY + i * (cellH + cellGap);
          return (
            <g key={`hr-${i}`}>
              <rect
                className="rdv-cell rdv-cell-field"
                x={rowX}
                y={cy}
                width={fieldW}
                height={cellH}
                rx={9}
              />
              <text className="rdv-hash-field" x={rowX + fieldW / 2} y={cy + cellH / 2 + 5}>
                {row.field}
              </text>
              <line
                className="rdv-link"
                x1={rowX + fieldW}
                y1={cy + cellH / 2}
                x2={rowX + fieldW + gap}
                y2={cy + cellH / 2}
              />
              <rect
                className="rdv-cell"
                x={rowX + fieldW + gap}
                y={cy}
                width={valW}
                height={cellH}
                rx={9}
                style={{ stroke: tag }}
              />
              <rect x={rowX + fieldW + gap} y={cy} width={7} height={cellH} rx={3.5} fill={tag} />
              <text
                className="rdv-cell-val"
                x={rowX + fieldW + gap + valW / 2}
                y={cy + cellH / 2 + 6}
                style={{ fill: tag }}
              >
                {row.value}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const renderSet = () => {
    const startY = bodyTop + 50;
    const r = 56;
    const total2 = model.members.length;
    const spacing = 150;
    const totalW = (total2 - 1) * spacing;
    const startX = colCx - totalW / 2;
    return (
      <g>
        <text className="rdv-keylabel" x={colCx} y={bodyTop + 8}>
          key  {model.key}  ·  unordered, unique
        </text>
        {model.members.length === 0 && (
          <text className="rdv-axis" x={colCx} y={startY + 80}>empty set — run a command</text>
        )}
        {model.members.map((m, i) => {
          const tag = HUES[i % HUES.length];
          const cx = total2 === 1 ? colCx : startX + i * spacing;
          const cy = startY + 80;
          return (
            <g key={`sm-${i}`}>
              <circle
                className="rdv-set-node"
                cx={cx}
                cy={cy}
                r={r}
                style={{ stroke: tag }}
              />
              <circle cx={cx} cy={cy - r + 6} r={5} fill={tag} />
              <text className="rdv-cell-val" x={cx} y={cy + 6} style={{ fill: tag }}>
                {m}
              </text>
            </g>
          );
        })}
        <text className="rdv-axis" x={colCx} y={startY + 200}>
          adding "redis" twice is a no-op — the second SADD returns 0
        </text>
      </g>
    );
  };

  const renderZSet = () => {
    const startY = bodyTop + 44;
    const maxScore = 250;
    const barMaxW = 480;
    const labelW = 90;
    const barX = colCx - barMaxW / 2 + labelW / 2;
    return (
      <g>
        <text className="rdv-keylabel" x={colCx} y={bodyTop + 8}>
          key  {model.key}  ·  sorted by score ascending
        </text>
        {model.entries.length === 0 && (
          <text className="rdv-axis" x={colCx} y={startY + 80}>empty sorted set — run a command</text>
        )}
        {model.entries.map((e, i) => {
          const tag = HUES[i % HUES.length];
          const cy = startY + i * (cellH + cellGap);
          const w = Math.max(60, (e.score / maxScore) * barMaxW);
          return (
            <g key={`zs-${i}`}>
              <text className="rdv-zset-rank" x={barX - 18} y={cy + cellH / 2 + 5}>
                #{i + 1}
              </text>
              <rect
                className="rdv-cell rdv-zset-track"
                x={barX}
                y={cy}
                width={barMaxW}
                height={cellH}
                rx={9}
              />
              <rect
                className="rdv-zset-bar"
                x={barX}
                y={cy}
                width={w}
                height={cellH}
                rx={9}
                style={{ fill: tag }}
              />
              <text className="rdv-zset-member" x={barX + 16} y={cy + cellH / 2 + 6}>
                {e.member}
              </text>
              <text className="rdv-zset-score" x={barX + barMaxW - 16} y={cy + cellH / 2 + 6}>
                {e.score}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const renderStructure = () => {
    switch (model.kind) {
      case 'string': return renderString();
      case 'list': return renderList();
      case 'hash': return renderHash();
      case 'set': return renderSet();
      case 'zset': return renderZSet();
      default: return null;
    }
  };

  const lengthLabel =
    model.kind === 'string' ? 'length (chars)'
      : model.kind === 'list' ? 'length'
        : model.kind === 'hash' ? 'fields'
          : model.kind === 'set' ? 'cardinality'
            : 'members';

  return (
    <div className="rdv">
      <div className="rdv-head">
        <h3 className="rdv-title">Redis core data structures — one key, five shapes</h3>
        <p className="rdv-sub">
          String, List, Hash, Set and Sorted Set each model a different access pattern. Pick a type, then run its
          command sequence and watch the structure update one step at a time.
        </p>
      </div>

      <div className="rdv-controls">
        <div className="rdv-presets">
          <span className="rdv-input-label">type</span>
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                className={`rdv-chip ${typeKey === t.key ? 'is-active' : ''}`}
                onClick={() => selectType(t.key)}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
          <span className="rdv-stepper">
            <button type="button" className="rdv-step-btn" onClick={() => stepType(1)} aria-label="Next type">
              <ChevronUp size={13} />
            </button>
            <button type="button" className="rdv-step-btn" onClick={() => stepType(-1)} aria-label="Previous type">
              <ChevronDown size={13} />
            </button>
          </span>
        </div>

        <span className="rdv-spacer" aria-hidden="true" />

        <button
          type="button"
          className={`rdv-btn ${step < total ? 'rdv-btn-primary' : ''}`}
          onClick={runCommand}
          disabled={step >= total}
        >
          <Play size={14} /> {step < total ? `Run command (${step + 1}/${total})` : 'Sequence done'}
        </button>
        <button type="button" className="rdv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rdv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="rdv-stage-title" x={stageX} y={titleY}>
            {type.label}
          </text>
          <text className="rdv-stage-cmd" x={stageX + stageW} y={titleY}>
            {lastCommand ? `> ${lastCommand.cmd}` : '> (no command run yet)'}
          </text>
          {renderStructure()}
        </svg>
      </div>

      <div className="rdv-metrics">
        <div className="rdv-metric">
          <span className="rdv-metric-label">selected type</span>
          <span className="rdv-metric-value">{type.label}</span>
        </div>
        <div className="rdv-metric">
          <span className="rdv-metric-label">last command</span>
          <span className="rdv-metric-value is-cmd">{lastCommand ? lastCommand.cmd : '—'}</span>
        </div>
        <div className="rdv-metric">
          <span className="rdv-metric-label">result</span>
          <span className="rdv-metric-value is-result">{lastCommand ? lastCommand.result : '—'}</span>
        </div>
        <div className="rdv-metric">
          <span className="rdv-metric-label">{lengthLabel}</span>
          <span className="rdv-metric-value">{model.count}</span>
        </div>
        <div className="rdv-metric">
          <span className="rdv-metric-label">use it for…</span>
          <span className="rdv-metric-value is-tip">{type.tip}</span>
        </div>
      </div>

      <div className="rdv-narration">
        <span className="rdv-narration-label">why it matters</span>
        <span className="rdv-narration-body">
          Redis is fast because each type is a specialised structure, not a generic blob — so picking the right one is
          picking the right access pattern. Reach for a String to cache or count, a List when order and ends matter
          (queues, recent-items feeds), a Hash to store an object's fields under one key, a Set when you only care
          whether a member exists, and a Sorted Set when you need members ranked by a score (leaderboards, schedulers).
          Match the type to how you'll read the data and most operations stay O(1) or O(log n).
        </span>
      </div>
    </div>
  );
}
