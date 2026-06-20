import React, { useMemo, useState } from 'react';
import { Server, RefreshCw, Flame } from 'lucide-react';
import './DbPartitioningViz.css';

// Deterministic LCG — keeps the generated key population stable per (count, skew, seed).
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Small string-ish hash for hash partitioning (here keys are ints, hash mixes bits).
function hashKey(k) {
  let h = 2166136261 >>> 0;
  h ^= k & 0xff; h = Math.imul(h, 16777619) >>> 0;
  h ^= (k >> 8) & 0xff; h = Math.imul(h, 16777619) >>> 0;
  return h >>> 0;
}

const STRATEGIES = ['Range', 'Hash', 'Round-robin'];
const KEY_SPACE = 1000;
const KEY_COUNT = 60;

// Generate the key population. `skew` concentrates keys into the low range to
// expose range-partitioning hot spots.
function buildKeys(skew, seed) {
  const rand = lcg(7 + seed * 17);
  const out = [];
  for (let i = 0; i < KEY_COUNT; i++) {
    let v;
    if (skew) {
      // 75% of keys land in the bottom 20% of the keyspace.
      v = rand() < 0.75
        ? Math.floor(rand() * (KEY_SPACE * 0.2))
        : Math.floor(rand() * KEY_SPACE);
    } else {
      v = Math.floor(rand() * KEY_SPACE);
    }
    out.push({ id: i, key: v });
  }
  return out;
}

// Which shard does a key land in, under each strategy?
function shardOf(strategy, key, shards, arrivalIndex) {
  if (strategy === 'Range') {
    const span = KEY_SPACE / shards;
    return Math.min(shards - 1, Math.floor(key / span));
  }
  if (strategy === 'Hash') {
    return hashKey(key) % shards;
  }
  return arrivalIndex % shards; // Round-robin by arrival order
}

export default function DbPartitioningViz() {
  const [strategy, setStrategy] = useState('Range');
  const [shards, setShards] = useState(4);
  const [skew, setSkew] = useState(true);
  const [seed, setSeed] = useState(0);
  const [probeKey, setProbeKey] = useState(120);

  const keys = useMemo(() => buildKeys(skew, seed), [skew, seed]);

  // Assign every key, count per shard.
  const assignment = useMemo(() => {
    const buckets = Array.from({ length: shards }, () => []);
    keys.forEach((k, i) => {
      const s = shardOf(strategy, k.key, shards, i);
      buckets[s].push(k);
    });
    return buckets;
  }, [keys, strategy, shards]);

  const counts = assignment.map((b) => b.length);
  const maxCount = Math.max(1, ...counts);
  const minCount = Math.min(...counts);
  const ideal = KEY_COUNT / shards;
  const imbalance = Math.round(((maxCount - ideal) / ideal) * 100);
  const hottest = counts.indexOf(maxCount);

  // Where does the probed key land?
  const probeShard = shardOf(strategy, probeKey, shards, 0);

  // SVG geometry.
  const W = 940;
  const shardTop = 60;
  const shardGap = 18;
  const shardW = (W - 60 - (shards - 1) * shardGap) / shards;
  const shardLeft = 30;
  const barMaxH = 150;
  const dotZoneTop = shardTop + barMaxH + 22;
  const dotsPerRow = Math.max(1, Math.floor((shardW - 12) / 13));
  const dotRows = Math.ceil(maxCount / dotsPerRow);
  const dotZoneH = Math.max(40, dotRows * 12 + 8);
  const H = dotZoneTop + dotZoneH + 36;

  const shardX = (i) => shardLeft + i * (shardW + shardGap);

  return (
    <div className="dpv">
      <div className="dpv-head">
        <h3 className="dpv-title">Partitioning strategies — Range vs Hash vs Round-robin</h3>
        <p className="dpv-sub">
          Spread {KEY_COUNT} keys across shards three ways. Range keeps keys ordered but hot-spots under
          skew; hash and round-robin spread load evenly but scatter ranges.
        </p>
      </div>

      <div className="dpv-controls">
        <div className="dpv-modes" role="tablist" aria-label="Partition strategy">
          {STRATEGIES.map((m) => (
            <button
              key={m}
              type="button"
              className={`dpv-mode ${strategy === m ? 'is-on' : ''}`}
              onClick={() => setStrategy(m)}
              aria-pressed={strategy === m}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="dpv-shards">
          <span className="dpv-input-label">shards</span>
          <button type="button" className="dpv-btn dpv-btn-step" onClick={() => setShards((s) => Math.max(2, s - 1))} disabled={shards <= 2}>−</button>
          <span className="dpv-shards-val">{shards}</span>
          <button type="button" className="dpv-btn dpv-btn-step" onClick={() => setShards((s) => Math.min(8, s + 1))} disabled={shards >= 8}>+</button>
        </div>

        <button
          type="button"
          className={`dpv-btn ${skew ? 'is-on' : ''}`}
          onClick={() => setSkew((v) => !v)}
          aria-pressed={skew}
        >
          <Flame size={13} /> skewed keys {skew ? 'on' : 'off'}
        </button>

        <button type="button" className="dpv-btn" onClick={() => setSeed((s) => s + 1)}>
          <RefreshCw size={12} /> reshuffle
        </button>

        <label className="dpv-probe">
          <span className="dpv-input-label">probe key</span>
          <input
            type="range"
            min={0}
            max={KEY_SPACE - 1}
            step={1}
            value={probeKey}
            onChange={(e) => setProbeKey(Number(e.target.value))}
            className="dpv-range"
            aria-label="Key to look up"
          />
          <span className="dpv-probe-val">{probeKey}</span>
        </label>
      </div>

      <div className="dpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dpv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={shardLeft} y={32} className="dpv-row-label">
            key load per shard ({strategy}) — bar height = count, dots = individual keys
          </text>

          {assignment.map((bucket, i) => {
            const x = shardX(i);
            const c = counts[i];
            const barH = (c / maxCount) * barMaxH;
            const isHot = i === hottest && imbalance > 25;
            const isProbe = i === probeShard;
            return (
              <g key={`shard-${i}`}>
                {/* bar */}
                <rect className="dpv-bar-bg" x={x} y={shardTop} width={shardW} height={barMaxH} rx={6} />
                <rect
                  className={`dpv-bar ${isHot ? 'is-hot' : ''} ${isProbe ? 'is-probe' : ''}`}
                  x={x}
                  y={shardTop + barMaxH - barH}
                  width={shardW}
                  height={barH}
                  rx={6}
                />
                <text className="dpv-bar-count" x={x + shardW / 2} y={shardTop + barMaxH - barH - 6}>{c}</text>

                {/* shard label */}
                <g transform={`translate(${x + 6}, ${shardTop + 16})`}>
                  <Server x={0} y={-11} width={13} height={13} className="dpv-icon" />
                </g>
                <text className="dpv-shard-name" x={x + 24} y={shardTop + 16}>S{i}</text>
                {isHot && <text className="dpv-hot-tag" x={x + shardW - 6} y={shardTop + 16}>hot</text>}

                {/* per-key dots */}
                {bucket.slice(0, maxCount).map((k, j) => {
                  const r = Math.floor(j / dotsPerRow);
                  const cc = j % dotsPerRow;
                  const dx = x + 8 + cc * 13;
                  const dy = dotZoneTop + r * 12;
                  const isProbed = k.key === probeKey;
                  return (
                    <circle
                      key={`dot-${i}-${k.id}`}
                      className={`dpv-dot ${isHot ? 'is-hot' : ''} ${isProbed ? 'is-probed' : ''}`}
                      cx={dx}
                      cy={dy}
                      r={isProbed ? 4.5 : 3.2}
                    />
                  );
                })}
              </g>
            );
          })}

          <text x={shardLeft} y={dotZoneTop + dotZoneH + 22} className="dpv-row-label">
            ideal {ideal.toFixed(1)}/shard · spread {minCount}–{maxCount} · key {probeKey} → shard S{probeShard}
          </text>
        </svg>
      </div>

      <div className="dpv-metrics">
        <div className="dpv-metric">
          <span className="dpv-metric-label">strategy</span>
          <span className="dpv-metric-value">{strategy}</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">probe key → shard</span>
          <span className="dpv-metric-value">S{probeShard}</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">hottest shard</span>
          <span className="dpv-metric-value is-hot">S{hottest} ({maxCount})</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">coldest shard</span>
          <span className="dpv-metric-value">{minCount}</span>
        </div>
        <div className="dpv-metric">
          <span className="dpv-metric-label">peak imbalance</span>
          <span className={`dpv-metric-value ${imbalance > 25 ? 'is-hot' : ''}`}>+{imbalance}%</span>
        </div>
      </div>

      <div className="dpv-narration">
        <span className="dpv-narration-label">trace</span>
        <span className="dpv-narration-body">
          {strategy === 'Range'
            ? `Range splits the keyspace into ${shards} equal bands. ${skew ? `With skewed keys, the low band (S0..) overflows — peak +${imbalance}% over ideal, a hot shard.` : 'With uniform keys load is fairly even, but any real-world skew would pile onto one band.'} Key ${probeKey} sits in band S${probeShard}, so range scans stay local.`
            : strategy === 'Hash'
              ? `Hash mixes each key's bits then mods by ${shards}, scattering even skewed keys evenly (spread ${minCount}–${maxCount}). Key ${probeKey} hashes to S${probeShard} — but neighbours land elsewhere, so range queries fan out to every shard.`
              : `Round-robin assigns by arrival order (i mod ${shards}), giving the flattest load (spread ${minCount}–${maxCount}) regardless of key values. But there's no way to locate a key without checking shards — key ${probeKey}'s shard depends on when it arrived.`}
        </span>
      </div>
    </div>
  );
}
