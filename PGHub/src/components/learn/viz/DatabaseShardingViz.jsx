import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Minus } from 'lucide-react';
import './DatabaseShardingViz.css';

const MODES = [
  { key: 'range', label: 'RANGE' },
  { key: 'hash', label: 'HASH' },
  { key: 'directory', label: 'DIRECTORY' },
];

const SHARD_COLORS = ['var(--accent)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-sky)', 'var(--medium)'];

// Fixed keyspace — range boundaries are static (like real range sharding),
// NOT derived from the current batch. New sequential rows that land near the
// top of the keyspace therefore pile into the highest range = hotspot.
const KEY_LO = 0;
const KEY_HI = 1000;

// Two workloads make the strategy trade-offs visible:
// - 'sequential' = recent auto-increment IDs / timestamps clustered high in the
//   keyspace, the classic range-sharding hotspot trigger.
// - 'random'     = scattered keys, the realistic mixed workload.
// Both sets are tuned so hash(key) % 4 lands exactly 3-per-shard (verified),
// making the HASH-vs-RANGE contrast crisp at the default 4 shards.
const SEQ_KEYS = [712, 723, 734, 745, 756, 767, 778, 789, 800, 811, 822, 833];
const RAND_KEYS = [776, 221, 538, 879, 508, 297, 274, 603, 668, 777, 410, 495];

// Static range bucket over the fixed keyspace.
function rangeBucket(key, shardCount) {
  const span = (KEY_HI - KEY_LO) / shardCount || 1;
  const idx = Math.min(shardCount - 1, Math.max(0, Math.floor((key - KEY_LO) / span)));
  return idx;
}

// Stable directory: assign keys round-robin as they are first seen, so the
// lookup table fills evenly regardless of key value (operator-controlled).
function directoryShard(key, dir, shardCount, order) {
  if (Object.prototype.hasOwnProperty.call(dir, key)) return dir[key];
  const idx = order.length % shardCount;
  return idx;
}

// Small integer hash so hash-sharding spreads keys regardless of their order.
function hashInt(key) {
  let h = key >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

function routeKey(mode, key, shardCount, ctx) {
  if (mode === 'hash') {
    const h = hashInt(key);
    return { shard: h % shardCount, formula: `hash(${key}) % ${shardCount} = ${h % shardCount}` };
  }
  if (mode === 'range') {
    const idx = rangeBucket(key, shardCount);
    const span = (KEY_HI - KEY_LO) / shardCount;
    const a = Math.round(KEY_LO + idx * span);
    const b = Math.round(KEY_LO + (idx + 1) * span);
    return { shard: idx, formula: `${key} in [${a}, ${b}) -> shard ${idx}` };
  }
  // directory
  const idx = directoryShard(key, ctx.dir, shardCount, ctx.order);
  return { shard: idx, formula: `lookup[${key}] = shard ${idx}` };
}

function buildFrames(mode, shardCount, keys) {
  const frames = [];
  const counts = new Array(shardCount).fill(0);
  const dir = {};
  const order = [];

  const snap = (extra) => ({
    counts: [...counts],
    placed: [],
    routingKey: null,
    targetShard: null,
    formula: '',
    dirSize: order.length,
    note: '',
    ...extra,
  });

  const seqHint = mode === 'range'
    ? ' Sequential keys all fall in the highest range — watch the last shard turn into a hotspot.'
    : '';
  frames.push(snap({
    note: `${MODES.find((m) => m.key === mode).label} sharding across ${shardCount} shards. Each incoming row carries a shard key; route it, then watch per-shard load fill.${seqHint}`,
  }));

  const placed = [];
  keys.forEach((key, i) => {
    const ctx = { dir, order };
    const { shard, formula } = routeKey(mode, key, shardCount, ctx);
    if (mode === 'directory' && !Object.prototype.hasOwnProperty.call(dir, key)) {
      dir[key] = shard;
      order.push(key);
    }
    // routing frame (in flight)
    frames.push(snap({
      routingKey: key,
      targetShard: shard,
      placed: [...placed],
      formula,
      note: `Row ${i + 1}/${keys.length} (key ${key}): ${formula}.`,
    }));
    // land frame
    counts[shard] += 1;
    placed.push({ key, shard });
    frames.push(snap({
      routingKey: null,
      targetShard: shard,
      placed: [...placed],
      formula,
      note: `Key ${key} lands on shard ${shard}. Shard ${shard} now holds ${counts[shard]} row(s).`,
    }));
  });

  // closing balance assessment
  const total = counts.reduce((a, b) => a + b, 0);
  const ideal = total / shardCount;
  const peak = Math.max(...counts);
  const hot = ideal > 0 ? Math.round(((peak - ideal) / ideal) * 100) : 0;
  let tail;
  if (mode === 'range') {
    tail = hot > 40
      ? `Peak shard carries +${hot}% over the ideal ${ideal.toFixed(1)}/shard — a hotspot. Range sharding keeps scans cheap but skews under sequential keys.`
      : `Spread is even here, but range sharding stays fragile: any sequential key burst floods one shard.`;
  } else if (mode === 'hash') {
    tail = `Peak shard is only +${hot}% over ideal — hashing scatters even sequential keys evenly. Cost: range scans must fan out to every shard.`;
  } else {
    tail = `Directory keeps balance under operator control (+${hot}% peak) and lets you move any key, but every route pays a lookup and the table is a bottleneck / single point of failure.`;
  }
  frames.push(snap({
    placed: [...placed],
    note: `Done. ${total} rows placed. ${tail}`,
  }));

  return frames;
}

// Resharding demo: route the SAME keys under N shards, then N+1, and count how
// many keys change shard. Hash remaps almost everything; directory moves none.
function reshardImpact(mode, shardCount, keys) {
  if (mode === 'directory') return { moved: 0, total: keys.length };
  const before = keys.map((k) => routeKey(mode, k, shardCount, { dir: {}, order: [] }).shard);
  const after = keys.map((k) => routeKey(mode, k, shardCount + 1, { dir: {}, order: [] }).shard);
  let moved = 0;
  for (let i = 0; i < keys.length; i++) if (before[i] !== after[i]) moved += 1;
  return { moved, total: keys.length };
}

export default function DatabaseShardingViz() {
  const [mode, setMode] = useState('hash');
  const [shardCount, setShardCount] = useState(4);
  const [workload, setWorkload] = useState('sequential');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const keys = workload === 'sequential' ? SEQ_KEYS : RAND_KEYS;

  const frames = useMemo(
    () => buildFrames(mode, shardCount, keys),
    [mode, shardCount, keys],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1000 / speed);

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

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const switchWorkload = (w) => {
    if (w === workload) return;
    setIsRunning(false);
    setStep(0);
    setWorkload(w);
  };

  const setShards = (delta) => {
    const next = Math.max(2, Math.min(6, shardCount + delta));
    if (next === shardCount) return;
    setIsRunning(false);
    setStep(0);
    setShardCount(next);
  };

  const colorOf = (i) => SHARD_COLORS[i % SHARD_COLORS.length];

  // SVG geometry
  const W = 940;
  const H = 440;
  const sourceX = 60;
  const sourceY = H / 2;
  const shardTop = 70;
  const shardBottom = H - 60;
  const shardX = W - 360;
  const shardW = 300;
  const slotH = (shardBottom - shardTop) / shardCount;
  const barMax = 168;

  const counts = current.counts;
  const total = counts.reduce((a, b) => a + b, 0);
  const ideal = total > 0 ? total / shardCount : 0;
  const peak = counts.length ? Math.max(...counts) : 0;
  const valley = counts.length ? Math.min(...counts) : 0;
  const hot = ideal > 0 ? Math.round(((peak - ideal) / ideal) * 100) : 0;
  const balancePct = peak > 0 ? Math.round((valley / peak) * 100) : 100;
  const hotspot = hot > 40;

  const reshard = useMemo(() => reshardImpact(mode, shardCount, keys), [mode, shardCount, keys]);
  const reshardPct = reshard.total ? Math.round((reshard.moved / reshard.total) * 100) : 0;

  const shardYCenter = (i) => shardTop + slotH * i + slotH / 2;
  const routing = current.routingKey;
  const target = current.targetShard;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="dsv">
      <div className="dsv-head">
        <h3 className="dsv-title">Database sharding — routing a shard key to N shards</h3>
        <p className="dsv-sub">
          Each incoming row carries a shard key. Pick a strategy and watch how it routes rows, how the
          per-shard load fills, and how many keys move when you add a shard.
        </p>
      </div>

      <div className="dsv-controls">
        <div className="dsv-modes" role="tablist" aria-label="Sharding strategy">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`dsv-mode ${mode === m.key ? 'is-on' : ''}`}
              onClick={() => switchMode(m.key)}
              aria-pressed={mode === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="dsv-workload" role="tablist" aria-label="Workload">
          <button
            type="button"
            className={`dsv-wl ${workload === 'sequential' ? 'is-on' : ''}`}
            onClick={() => switchWorkload('sequential')}
            aria-pressed={workload === 'sequential'}
          >
            sequential keys
          </button>
          <button
            type="button"
            className={`dsv-wl ${workload === 'random' ? 'is-on' : ''}`}
            onClick={() => switchWorkload('random')}
            aria-pressed={workload === 'random'}
          >
            random keys
          </button>
        </div>

        <div className="dsv-shards">
          <span className="dsv-input-label">shards</span>
          <button type="button" className="dsv-btn dsv-btn-step" onClick={() => setShards(-1)} disabled={shardCount <= 2}>
            <Minus size={12} />
          </button>
          <span className="dsv-shards-val">{shardCount}</span>
          <button type="button" className="dsv-btn dsv-btn-step" onClick={() => setShards(1)} disabled={shardCount >= 6}>
            <Plus size={12} />
          </button>
        </div>

        <label className="dsv-speed">
          <span className="dsv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dsv-speed-range"
            aria-label="Playback speed"
          />
          <span className="dsv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="dsv-spacer" aria-hidden="true" />

        <div className="dsv-buttons">
          <button
            type="button"
            className="dsv-btn dsv-btn-primary"
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
            className="dsv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dsv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dsv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="dsv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dsv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dsv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="dsv-arrow-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border)" />
            </marker>
          </defs>

          {/* incoming source / router */}
          <rect className="dsv-source" x={sourceX - 38} y={sourceY - 54} width={120} height={108} rx={12} />
          <text x={sourceX + 22} y={sourceY - 30} className="dsv-source-title" textAnchor="middle">rows in</text>
          <text x={sourceX + 22} y={sourceY - 12} className="dsv-source-sub" textAnchor="middle">router</text>
          <text x={sourceX + 22} y={sourceY + 16} className="dsv-source-key" textAnchor="middle">
            {routing != null ? `key ${routing}` : (current.placed.length === keys.length ? 'all routed' : 'idle')}
          </text>
          <text x={sourceX + 22} y={sourceY + 38} className="dsv-source-strat" textAnchor="middle">
            {MODES.find((m) => m.key === mode).label}
          </text>

          {/* directory lookup table (only in directory mode) */}
          {mode === 'directory' && (
            <g>
              <rect className="dsv-dir" x={sourceX + 110} y={shardTop + 6} width={120} height={shardBottom - shardTop - 12} rx={10} />
              <text x={sourceX + 170} y={shardTop + 28} className="dsv-dir-title" textAnchor="middle">lookup table</text>
              <line x1={sourceX + 126} y1={shardTop + 38} x2={sourceX + 214} y2={shardTop + 38} className="dsv-dir-rule" />
              {current.placed.slice(-9).map((p, i) => (
                <text key={`dir-${p.key}-${i}`} x={sourceX + 170} y={shardTop + 56 + i * 17} className="dsv-dir-row" textAnchor="middle">
                  {p.key} {String.fromCharCode(8594)} s{p.shard}
                </text>
              ))}
            </g>
          )}

          {/* in-flight key routing to its target shard */}
          {routing != null && target != null && (() => {
            const x1 = sourceX + 84;
            const y1 = sourceY;
            const x2 = shardX - 8;
            const y2 = shardYCenter(target);
            const mx = (x1 + x2) / 2;
            return (
              <g>
                <path
                  className="dsv-flight-path"
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  markerEnd="url(#dsv-arrow)"
                />
                <g className="dsv-flight-token" transform={`translate(${x2 - 26}, ${y2})`}>
                  <rect x={-22} y={-13} width={44} height={26} rx={7} style={{ fill: colorOf(target) }} />
                  <text x={0} y={5} className="dsv-flight-key" textAnchor="middle">{routing}</text>
                </g>
              </g>
            );
          })()}

          {/* idle connector lines source -> each shard */}
          {counts.map((_, i) => {
            const x1 = sourceX + 84;
            const y1 = sourceY;
            const x2 = shardX - 8;
            const y2 = shardYCenter(i);
            const mx = (x1 + x2) / 2;
            const active = target === i;
            return (
              <path
                key={`link-${i}`}
                className={`dsv-link ${active ? 'is-active' : ''}`}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                markerEnd={active ? undefined : 'url(#dsv-arrow-dim)'}
              />
            );
          })}

          {/* shards with load bars */}
          {counts.map((c, i) => {
            const y = shardTop + slotH * i + 6;
            const h = slotH - 12;
            const col = colorOf(i);
            const isTarget = target === i;
            const span = (KEY_HI - KEY_LO) / shardCount;
            const a = Math.round(KEY_LO + i * span);
            const b = Math.round(KEY_LO + (i + 1) * span);
            const isHot = hotspot && c === peak && c > 0;
            const barW = peak ? Math.max(2, (c / peak) * barMax) : 2;
            return (
              <g key={`shard-${i}`}>
                <rect
                  className={`dsv-shard ${isTarget ? 'is-target' : ''} ${isHot ? 'is-hot' : ''}`}
                  x={shardX}
                  y={y}
                  width={shardW}
                  height={h}
                  rx={10}
                  style={{ stroke: isTarget || isHot ? col : undefined }}
                />
                <rect x={shardX + 12} y={y + 10} width={14} height={14} rx={4} style={{ fill: col }} />
                <text x={shardX + 34} y={y + 22} className="dsv-shard-label">shard {i}</text>
                {mode === 'range' && (
                  <text x={shardX + shardW - 12} y={y + 22} className="dsv-shard-range" textAnchor="end">[{a}, {b})</text>
                )}
                {/* load bar */}
                <rect className="dsv-bar-bg" x={shardX + 34} y={y + h - 26} width={barMax} height={14} rx={4} />
                <rect className="dsv-bar" x={shardX + 34} y={y + h - 26} width={barW} height={14} rx={4} style={{ fill: col }} />
                <text x={shardX + 34 + barMax + 10} y={y + h - 15} className="dsv-bar-count">{c}</text>
                {isHot && (
                  <text x={shardX + shardW - 12} y={y + h - 15} className="dsv-shard-hot" textAnchor="end">hotspot</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dsv-metrics">
        <div className="dsv-metric">
          <span className="dsv-metric-label">strategy</span>
          <span className="dsv-metric-value">{MODES.find((m) => m.key === mode).label}</span>
        </div>
        <div className="dsv-metric">
          <span className="dsv-metric-label">rows placed</span>
          <span className="dsv-metric-value">{total} / {keys.length}</span>
        </div>
        <div className="dsv-metric">
          <span className="dsv-metric-label">spread</span>
          <span className="dsv-metric-value">{valley}–{peak}</span>
        </div>
        <div className="dsv-metric">
          <span className="dsv-metric-label">balance</span>
          <span className="dsv-metric-value">{balancePct}%</span>
        </div>
        <div className="dsv-metric">
          <span className="dsv-metric-label">peak over ideal</span>
          <span className={`dsv-metric-value ${hotspot ? 'is-hot' : ''}`}>{ideal > 0 ? `+${hot}%` : '—'}</span>
        </div>
        <div className="dsv-metric">
          <span className="dsv-metric-label">{shardCount}{String.fromCharCode(8594)}{shardCount + 1} remap</span>
          <span className={`dsv-metric-value ${reshardPct > 50 ? 'is-hot' : ''}`}>{reshardPct}%</span>
        </div>
      </div>

      {hotspot && (
        <div className="dsv-warn">
          <span className="dsv-warn-label">hotspot</span>
          <span className="dsv-warn-body">
            Shard {counts.indexOf(peak)} holds {peak} of {total} rows (+{hot}% over ideal). One shard absorbs the
            write load while others idle — switch to HASH to scatter these keys evenly.
          </span>
        </div>
      )}

      <div className="dsv-reshard">
        <span className="dsv-reshard-label">resharding</span>
        <span className="dsv-reshard-body">
          {mode === 'directory'
            ? `Adding a shard moves 0% of keys — the directory just points new/rebalanced keys at the new shard. Cost is the lookup on every route.`
            : mode === 'hash'
              ? `Add one shard (${shardCount}${String.fromCharCode(8594)}${shardCount + 1}) and hash(key) % N changes for ~${reshardPct}% of keys — almost the whole dataset reshuffles. Consistent hashing fixes this by moving only ~1/N of keys.`
              : `Add one shard and ${reshardPct}% of keys land in a different range bucket — range boundaries shift, forcing large data movement.`}
        </span>
      </div>

      <div className="dsv-narration">
        <span className="dsv-narration-label">trace</span>
        <span className="dsv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
