import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Send, Hash, Shuffle, Layers, KeyRound, AlertTriangle } from 'lucide-react';
import './KafkaPartitionsViz.css';

// Kafka topic — one topic split into P append-only partition logs. A keyed
// message is hashed (FNV-1a 32-bit) and routed by hash(key) % P, so the SAME KEY
// always lands on the SAME partition, preserving per-key ordering. An unkeyed
// message round-robins across partitions. Each partition is drawn as a row of
// offset cells (0,1,2,...); producing appends one cell and advances the offset.
// A hot key concentrates on one partition -> a visibly longer log = skew.

const KEYS = ['user-A', 'user-B', 'user-C', 'user-D'];
const KEY_HUE = ['--hue-violet', '--hue-sky', '--hue-pink', '--hue-mint'];
const VISIBLE_CELLS = 10;          // offset cells drawn before "+N more"
const STREAM_MS = 850;             // base auto-stream tick; divided by speed
const STREAM_KEYS = ['user-A', 'user-A', 'user-B', 'user-A', 'user-C', null, 'user-A', 'user-B'];

// Deterministic 32-bit string hash (FNV-1a). No Math.random for routing.
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function freshState(p) {
  return {
    partitions: Array.from({ length: p }, () => []),  // each = list of { key, hue, fresh }
    total: 0,
    rr: 0,                                             // next round-robin target
    keyCounts: {},                                     // produced count per key (for skew framing)
    last: null,                                        // { key, hash, mod, partition, offset }
    note: 'A topic split into partitions, each an append-only log. Produce a keyed message — its key hashes to one partition and always routes there, so that key keeps its order. Unkeyed messages round-robin to spread load.',
    tone: 'init',
  };
}

// Append one message. keyLabel === null => round-robin via the rr counter.
function produce(prev, p, keyLabel) {
  const partitions = prev.partitions.map((log) => log.map((m) => ({ ...m, fresh: false })));
  let { rr } = prev;
  const keyCounts = { ...prev.keyCounts };

  let partition;
  let hashVal = null;
  let routed;
  let label;

  if (keyLabel == null) {
    partition = rr % p;
    rr = (rr + 1) % p;
    routed = 'round-robin';
    label = 'unkeyed';
    partitions[partition].push({ key: null, hue: '--text-dim', fresh: true });
  } else {
    hashVal = hash32(keyLabel);
    partition = hashVal % p;
    routed = 'hash(key) % P';
    const hue = KEY_HUE[KEYS.indexOf(keyLabel) % KEY_HUE.length];
    label = keyLabel;
    keyCounts[keyLabel] = (keyCounts[keyLabel] || 0) + 1;
    partitions[partition].push({ key: keyLabel, hue, fresh: true });
  }

  const offset = partitions[partition].length - 1;

  // Skew framing: the busiest partition versus the average.
  const counts = partitions.map((log) => log.length);
  const max = Math.max(...counts);
  const hotIdx = counts.indexOf(max);
  const avg = (prev.total + 1) / p;
  const skewed = max >= 3 && max > avg * 1.7;

  let note;
  let tone = 'run';
  if (keyLabel == null) {
    note = `Unkeyed message round-robined to partition ${partition} (offset ${offset}). With no key, Kafka spreads load evenly — but messages carry no ordering guarantee across partitions.`;
  } else {
    note = `Key "${keyLabel}" hashed to ${hashVal >>> 0}; ${hashVal >>> 0} % ${p} = partition ${partition} — appended at offset ${offset}. The same key always routes here, so its messages stay strictly ordered.`;
    if (skewed && hotIdx === partition) {
      note += ` Partition ${hotIdx} is now the hot log (${max} messages) — a single busy key skews the topic.`;
      tone = 'warn';
    }
  }

  return {
    partitions,
    total: prev.total + 1,
    rr,
    keyCounts,
    last: { key: label, hash: hashVal, mod: p, partition, offset, routed },
    note,
    tone,
  };
}

export default function KafkaPartitionsViz() {
  const [partitionCount, setPartitionCount] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [state, setState] = useState(() => freshState(4));

  const runTimer = useRef(null);
  const streamIdx = useRef(0);
  // refs mirror live config so the interval reads current values without re-subscribing.
  const partitionRef = useRef(partitionCount);
  useEffect(() => { partitionRef.current = partitionCount; }, [partitionCount]);

  const delay = useMemo(() => Math.round(STREAM_MS / speed), [speed]);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setInterval(() => {
      const next = STREAM_KEYS[streamIdx.current % STREAM_KEYS.length];
      streamIdx.current += 1;
      setState((prev) => produce(prev, partitionRef.current, next));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearInterval(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
  }, []);

  const emit = (keyLabel) => {
    setState((prev) => produce(prev, partitionCount, keyLabel));
  };

  const changePartitions = (value) => {
    setIsRunning(false);
    streamIdx.current = 0;
    setPartitionCount(value);
    setState(freshState(value));
  };

  const reset = () => {
    setIsRunning(false);
    streamIdx.current = 0;
    setState(freshState(partitionCount));
  };

  // Derived readouts.
  const counts = state.partitions.map((log) => log.length);
  const maxCount = counts.length ? Math.max(...counts) : 0;
  const hotIdx = counts.indexOf(maxCount);
  const avg = partitionCount ? state.total / partitionCount : 0;
  const skewed = maxCount >= 3 && maxCount > avg * 1.7;

  // SVG geometry — one row per partition, offset cells laid left to right.
  const W = 960;
  const rowH = 58;
  const rowGap = 12;
  const topPad = 30;
  const botPad = 14;
  const labelW = 132;                                  // left gutter for partition label
  const H = topPad + partitionCount * (rowH + rowGap) - rowGap + botPad;

  const cellGap = 6;
  const trackX = labelW + 14;
  const trackRight = W - 80;                            // room for "+N more"
  const trackW = trackRight - trackX;
  const cellW = (trackW - (VISIBLE_CELLS - 1) * cellGap) / VISIBLE_CELLS;
  const cellH = 30;

  const last = state.last;

  return (
    <div className="kpv">
      <div className="kpv-head">
        <h3 className="kpv-title">Kafka partitions — keyed routing keeps order, round-robin spreads load</h3>
        <p className="kpv-sub">
          A topic splits into partitions, each an append-only log. A keyed message hashes to one partition
          and always returns there; an unkeyed message round-robins. Send messages and watch a hot key skew one log.
        </p>
      </div>

      <div className="kpv-controls">
        <label className="kpv-slider">
          <span className="kpv-input-label">partitions</span>
          <input
            type="range"
            min={2}
            max={6}
            step={1}
            value={partitionCount}
            onChange={(e) => changePartitions(Number(e.target.value))}
            className="kpv-slider-range"
            aria-label="Partition count"
          />
          <span className="kpv-slider-value">{partitionCount}</span>
        </label>

        <div className="kpv-keys" role="group" aria-label="Produce a keyed message">
          <span className="kpv-input-label">produce key</span>
          {KEYS.map((k, i) => (
            <button
              key={k}
              type="button"
              className="kpv-keybtn"
              onClick={() => emit(k)}
              style={{ '--kpv-key-hue': `var(${KEY_HUE[i % KEY_HUE.length]})` }}
              title={`Produce a message keyed "${k}" — routes to hash("${k}") % ${partitionCount}`}
            >
              <KeyRound size={12} /> {k}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="kpv-btn"
          onClick={() => emit(null)}
          title="Produce an unkeyed message — round-robins to the next partition"
        >
          <Shuffle size={14} /> Produce unkeyed
        </button>

        <span className="kpv-spacer" aria-hidden="true" />

        <label className="kpv-slider">
          <span className="kpv-input-label">stream speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="kpv-slider-range"
            aria-label="Auto-stream speed"
          />
          <span className="kpv-slider-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="kpv-buttons">
          <button
            type="button"
            className="kpv-btn kpv-btn-primary"
            onClick={() => setIsRunning((v) => !v)}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Stream'}
          </button>
          <button type="button" className="kpv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="kpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="kpv-svg" preserveAspectRatio="xMidYMid meet">
          {/* topic-level label */}
          <text className="kpv-topic-label" x={labelW + 14} y={18} textAnchor="start">
            {`topic "events" — ${partitionCount} append-only logs (offset 0, 1, 2, ... grows right)`}
          </text>

          {state.partitions.map((log, pi) => {
            const y = topPad + pi * (rowH + rowGap);
            const overflow = Math.max(0, log.length - VISIBLE_CELLS);
            // keep the newest cells visible: window the tail.
            const startIdx = Math.max(0, log.length - VISIBLE_CELLS);
            const visible = log.slice(startIdx);
            const isHot = skewed && pi === hotIdx;
            const isTarget = last && last.partition === pi;
            return (
              <g key={`part-${pi}`}>
                {/* partition label box (left gutter) */}
                <rect
                  className={`kpv-part-box ${isHot ? 'is-hot' : ''} ${isTarget ? 'is-target' : ''}`}
                  x={0}
                  y={y}
                  width={labelW}
                  height={rowH}
                  rx={8}
                />
                <g transform={`translate(12, ${y + 14})`}>
                  <Layers width={13} height={13} className="kpv-ic" />
                </g>
                <text className="kpv-part-name" x={32} y={y + 22}>{`partition ${pi}`}</text>
                <text className={`kpv-part-count ${isHot ? 'is-hot' : ''}`} x={12} y={y + 42}>
                  {`${log.length} msg${log.length === 1 ? '' : 's'}`}
                </text>

                {/* log track baseline */}
                <line
                  className="kpv-track"
                  x1={trackX}
                  y1={y + rowH / 2}
                  x2={trackRight}
                  y2={y + rowH / 2}
                />

                {/* offset cells (windowed to the tail) */}
                {Array.from({ length: VISIBLE_CELLS }).map((_, i) => {
                  const m = visible[i];
                  const cx = trackX + i * (cellW + cellGap);
                  const cy = y + (rowH - cellH) / 2;
                  const realOffset = startIdx + i;
                  if (!m) {
                    return (
                      <rect
                        key={`empty-${pi}-${i}`}
                        className="kpv-cell is-empty"
                        x={cx}
                        y={cy}
                        width={cellW}
                        height={cellH}
                        rx={5}
                      />
                    );
                  }
                  return (
                    <g key={`cell-${pi}-${i}`}>
                      <rect
                        className={`kpv-cell is-filled ${m.fresh ? 'is-fresh' : ''} ${m.key == null ? 'is-rr' : ''}`}
                        x={cx}
                        y={cy}
                        width={cellW}
                        height={cellH}
                        rx={5}
                        style={{ '--kpv-cell-hue': `var(${m.hue})` }}
                      />
                      <text className="kpv-cell-off" x={cx + cellW / 2} y={cy + 12}>{realOffset}</text>
                      <text className="kpv-cell-key" x={cx + cellW / 2} y={cy + 24}>
                        {m.key == null ? 'rr' : m.key.replace('user-', '')}
                      </text>
                    </g>
                  );
                })}

                {overflow > 0 && (
                  <text className="kpv-overflow" x={trackRight + 8} y={y + rowH / 2 + 4} textAnchor="start">
                    {`+${overflow}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="kpv-metrics">
        <div className="kpv-metric">
          <span className="kpv-metric-label">total messages</span>
          <span className="kpv-metric-value">{state.total}</span>
        </div>
        <div className="kpv-metric">
          <span className="kpv-metric-label">partitions</span>
          <span className="kpv-metric-value">{partitionCount}</span>
        </div>
        <div className="kpv-metric">
          <span className="kpv-metric-label">next round-robin</span>
          <span className="kpv-metric-value is-accent">{`partition ${state.rr % partitionCount}`}</span>
        </div>
        <div className="kpv-metric">
          <span className="kpv-metric-label">busiest partition</span>
          <span className={`kpv-metric-value ${skewed ? 'is-warn' : ''}`}>
            {state.total > 0 ? `partition ${hotIdx} · ${maxCount}` : '—'}
          </span>
        </div>
        <div className="kpv-metric kpv-metric-dim">
          <span className="kpv-metric-label">last route</span>
          <span className="kpv-metric-value">
            {last
              ? `${last.key === 'unkeyed' ? 'unkeyed' : last.hash >>> 0} ${last.routed === 'round-robin' ? '→ rr' : `% ${last.mod}`} = ${last.partition}`
              : '—'}
          </span>
        </div>
        <div className="kpv-metric kpv-metric-dim">
          <span className="kpv-metric-label">last offset</span>
          <span className="kpv-metric-value">{last ? `p${last.partition} @ ${last.offset}` : '—'}</span>
        </div>
      </div>

      <div className={`kpv-narration ${state.tone === 'warn' ? 'is-warn' : ''}`}>
        <span className={`kpv-narration-label ${state.tone === 'warn' ? 'is-warn' : state.tone === 'run' ? 'is-ok' : ''}`}>
          {state.tone === 'warn' ? 'skew' : state.tone === 'init' ? 'ready' : 'append'}
        </span>
        <span className="kpv-narration-body">{state.note}</span>
      </div>

      <div className="kpv-legend">
        <span className="kpv-legend-item"><Hash size={13} className="kpv-ic" /> keyed: hash(key) % P picks one partition — order preserved</span>
        <span className="kpv-legend-item"><Shuffle size={13} className="kpv-ic is-dim" /> unkeyed: round-robins across partitions</span>
        <span className="kpv-legend-item"><Send size={13} className="kpv-ic" /> each append advances that partition's offset</span>
        <span className="kpv-legend-item"><AlertTriangle size={13} className="kpv-ic is-warn" /> a hot key skews one log longer</span>
      </div>
    </div>
  );
}
