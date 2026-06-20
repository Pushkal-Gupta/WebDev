import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, RefreshCw } from 'lucide-react';
import './CacheEvictionViz.css';

const POLICIES = ['LRU', 'LFU', 'FIFO'];
const DEFAULT_SEQ = [1, 2, 3, 1, 4, 2, 5, 1, 2, 3];
const DEFAULT_CAP = 3;
const RUN_DELAY_MS = 950;

// Build the full step trace for a given access sequence + capacity + policy.
// Each slot tracks: key, insertOrder (t inserted), lastUsed (t last hit/inserted), freq.
function buildFrames(seq, capacity, policy) {
  const frames = [];
  const slots = []; // {key, insertOrder, lastUsed, freq}
  let hits = 0;
  let misses = 0;

  const snap = (extra) => ({
    slots: slots.map((s) => ({ ...s })),
    hits,
    misses,
    t: -1,
    accessKey: null,
    result: null,
    activeKey: null,
    evictKey: null,
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Empty ${policy} cache, capacity ${capacity}. Each access is a HIT if the key is already cached, else a MISS that inserts it (evicting one entry when full).`,
  }));

  // Choose the victim slot index per policy. All ties broken by oldest insertOrder.
  const pickVictim = () => {
    let victim = 0;
    for (let i = 1; i < slots.length; i++) {
      const a = slots[i];
      const b = slots[victim];
      if (policy === 'LRU') {
        if (a.lastUsed < b.lastUsed) victim = i;
      } else if (policy === 'FIFO') {
        if (a.insertOrder < b.insertOrder) victim = i;
      } else { // LFU: least freq, tie -> least recently used
        if (a.freq < b.freq || (a.freq === b.freq && a.lastUsed < b.lastUsed)) victim = i;
      }
    }
    return victim;
  };

  for (let t = 0; t < seq.length; t++) {
    const key = seq[t];
    const idx = slots.findIndex((s) => s.key === key);

    if (idx >= 0) {
      // HIT — update recency + frequency.
      hits += 1;
      slots[idx].lastUsed = t;
      slots[idx].freq += 1;
      const reason = policy === 'LFU'
        ? `freq[${key}] rises to ${slots[idx].freq}`
        : policy === 'LRU'
          ? `${key} is now most-recently-used (t${t})`
          : `FIFO insert order unchanged on a hit`;
      frames.push(snap({
        phase: 'hit', t, accessKey: key, result: 'HIT', activeKey: key,
        note: `access ${key} (t${t}): HIT — already cached. ${reason}.`,
      }));
    } else {
      // MISS
      misses += 1;
      if (slots.length < capacity) {
        slots.push({ key, insertOrder: t, lastUsed: t, freq: 1 });
        frames.push(snap({
          phase: 'miss-insert', t, accessKey: key, result: 'MISS', activeKey: key,
          note: `access ${key} (t${t}): MISS — cache has room (${slots.length}/${capacity}). Insert ${key}.`,
        }));
      } else {
        const v = pickVictim();
        const victim = slots[v];
        let why;
        if (policy === 'LRU') {
          why = `LRU evicts ${victim.key} — least recently used, last touched at t${victim.lastUsed}`;
        } else if (policy === 'FIFO') {
          why = `FIFO evicts ${victim.key} — oldest by insertion (entered at t${victim.insertOrder})`;
        } else {
          why = `LFU evicts ${victim.key} — lowest frequency (${victim.freq}), tie broken by least-recent use (t${victim.lastUsed})`;
        }
        // Eviction-decision frame (show victim highlighted, before replacing).
        frames.push(snap({
          phase: 'evict', t, accessKey: key, result: 'MISS', activeKey: key, evictKey: victim.key,
          note: `access ${key} (t${t}): MISS, cache full (${capacity}/${capacity}) -> evict ${victim.key} (${why}).`,
        }));
        // Replace.
        slots[v] = { key, insertOrder: t, lastUsed: t, freq: 1 };
        frames.push(snap({
          phase: 'miss-insert', t, accessKey: key, result: 'MISS', activeKey: key,
          note: `Insert ${key} into the freed slot. ${key} starts with freq 1, last used t${t}.`,
        }));
      }
    }
  }

  const total = hits + misses;
  const ratio = total ? Math.round((hits / total) * 100) : 0;
  frames.push(snap({
    phase: 'done',
    note: `Done. ${hits} hits, ${misses} misses over ${total} accesses -> hit ratio ${ratio}%. ${policy} keeps the ${policy === 'LFU' ? 'most frequently used' : policy === 'LRU' ? 'most recently used' : 'most recently inserted'} entries resident.`,
  }));

  return frames;
}

function randomSeq(len) {
  const out = [];
  for (let i = 0; i < len; i++) out.push(1 + Math.floor(Math.random() * 6));
  return out;
}

export default function CacheEvictionViz() {
  const [policy, setPolicy] = useState('LRU');
  const [seq, setSeq] = useState(DEFAULT_SEQ);
  const [capacity, setCapacity] = useState(DEFAULT_CAP);
  const [draft, setDraft] = useState(DEFAULT_SEQ.join(','));
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(seq, capacity, policy), [seq, capacity, policy]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const switchPolicy = (p) => {
    if (p === policy) return;
    setIsRunning(false);
    setStep(0);
    setPolicy(p);
  };

  const applyDraft = () => {
    const parsed = draft
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map(Number)
      .filter((x) => Number.isFinite(x) && Number.isInteger(x) && x >= 0);
    if (parsed.length === 0) return;
    if (parsed.length > 20) parsed.length = 20;
    setIsRunning(false);
    setSeq(parsed);
    setStep(0);
  };

  const changeCap = (delta) => {
    const next = Math.max(1, Math.min(6, capacity + delta));
    if (next === capacity) return;
    setIsRunning(false);
    setCapacity(next);
    setStep(0);
  };

  const randomize = () => {
    const next = randomSeq(10 + Math.floor(Math.random() * 3));
    setIsRunning(false);
    setSeq(next);
    setDraft(next.join(','));
    setStep(0);
  };

  // SVG geometry
  const W = 940;
  const seqRowY = 70;
  const cellW = 46;
  const cellGap = 8;
  const seqPadX = 32;
  const slotsTop = 168;
  const slotW = 150;
  const slotH = 110;
  const slotGap = 26;
  const slotsRowW = capacity * slotW + (capacity - 1) * slotGap;
  const slotsLeft = (W - slotsRowW) / 2;
  const H = slotsTop + slotH + 56;

  const seqCellX = (i) => seqPadX + i * (cellW + cellGap);
  const seqFits = seqPadX * 2 + seq.length * (cellW + cellGap) <= W;
  const seqScale = seqFits ? 1 : (W - seqPadX * 2) / (seq.length * (cellW + cellGap));

  const total = current.hits + current.misses;
  const ratio = total ? Math.round((current.hits / total) * 100) : 0;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="cev">
      <div className="cev-head">
        <h3 className="cev-title">Cache eviction — LRU vs LFU vs FIFO</h3>
        <p className="cev-sub">
          Step a fixed-capacity cache through an access sequence. Each access is a hit or a miss; when the
          cache is full a miss evicts one entry, and the policy decides which one.
        </p>
      </div>

      <div className="cev-controls">
        <div className="cev-modes" role="tablist" aria-label="Eviction policy">
          {POLICIES.map((p) => (
            <button
              key={p}
              type="button"
              className={`cev-mode ${policy === p ? 'is-on' : ''}`}
              onClick={() => switchPolicy(p)}
              aria-pressed={policy === p}
            >
              {p}
            </button>
          ))}
        </div>

        <label className="cev-input-group">
          <span className="cev-input-label">sequence</span>
          <input
            className="cev-input"
            type="text"
            value={draft}
            placeholder="1,2,3,1,4,2,5"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyDraft(); }}
            aria-label="Comma-separated access keys"
          />
          <button type="button" className="cev-btn" onClick={applyDraft}>apply</button>
        </label>

        <div className="cev-cap">
          <span className="cev-input-label">capacity</span>
          <button type="button" className="cev-btn cev-btn-step" onClick={() => changeCap(-1)} disabled={capacity <= 1}>−</button>
          <span className="cev-cap-val">{capacity}</span>
          <button type="button" className="cev-btn cev-btn-step" onClick={() => changeCap(1)} disabled={capacity >= 6}>+</button>
        </div>

        <button type="button" className="cev-btn" onClick={randomize}>
          <RefreshCw size={12} /> random
        </button>

        <label className="cev-speed">
          <span className="cev-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cev-speed-range"
            aria-label="Playback speed"
          />
          <span className="cev-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="cev-spacer" aria-hidden="true" />

        <div className="cev-buttons">
          <button
            type="button"
            className="cev-btn cev-btn-primary"
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
            className="cev-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cev-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cev-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cev-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cev-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cev-svg" preserveAspectRatio="xMidYMid meet">
          <text x={seqPadX} y={34} className="cev-row-label">access sequence (pointer = current access)</text>

          <g transform={seqFits ? undefined : `translate(${seqPadX - seqPadX * seqScale}, 0) scale(${seqScale}, 1)`}>
            {seq.map((k, i) => {
              const x = seqCellX(i);
              const isCur = current.t === i;
              const done = current.t > i || current.phase === 'done';
              const cls = [
                'cev-seq-cell',
                isCur && (current.result === 'HIT' ? 'is-hit' : 'is-miss'),
                done && !isCur && 'is-done',
              ].filter(Boolean).join(' ');
              return (
                <g key={`seq-${i}`}>
                  <rect className={cls} x={x} y={seqRowY} width={cellW} height={cellW} rx={7} />
                  <text className="cev-seq-val" x={x + cellW / 2} y={seqRowY + cellW / 2 + 5}>{k}</text>
                  <text className="cev-seq-idx" x={x + cellW / 2} y={seqRowY + cellW + 16}>t{i}</text>
                  {isCur && (
                    <path
                      className={`cev-seq-ptr ${current.result === 'HIT' ? 'is-hit' : 'is-miss'}`}
                      d={`M ${x + cellW / 2} ${seqRowY - 6} L ${x + cellW / 2 - 7} ${seqRowY - 18} L ${x + cellW / 2 + 7} ${seqRowY - 18} Z`}
                    />
                  )}
                </g>
              );
            })}
          </g>

          <text x={slotsLeft} y={slotsTop - 14} className="cev-row-label">
            cache slots (capacity {capacity})
          </text>

          {Array.from({ length: capacity }).map((_, i) => {
            const x = slotsLeft + i * (slotW + slotGap);
            const s = current.slots[i];
            const isEvict = s && current.evictKey === s.key && current.phase === 'evict';
            const isActive = s && current.activeKey === s.key && current.phase !== 'evict' && current.result;
            const cls = [
              'cev-slot',
              !s && 'is-empty',
              isEvict && 'is-evict',
              isActive && (current.result === 'HIT' ? 'is-hit' : 'is-insert'),
            ].filter(Boolean).join(' ');
            return (
              <g key={`slot-${i}`}>
                <rect className={cls} x={x} y={slotsTop} width={slotW} height={slotH} rx={10} />
                <text className="cev-slot-idx" x={x + 12} y={slotsTop + 20}>slot {i}</text>
                {s ? (
                  <>
                    <text className="cev-slot-key" x={x + slotW / 2} y={slotsTop + 58}>{s.key}</text>
                    <text className="cev-slot-meta" x={x + slotW / 2} y={slotsTop + 82}>
                      freq {s.freq} · in t{s.insertOrder} · used t{s.lastUsed}
                    </text>
                    {isEvict && (
                      <text className="cev-slot-tag is-evict" x={x + slotW / 2} y={slotsTop + 102}>evicting</text>
                    )}
                    {isActive && (
                      <text className={`cev-slot-tag ${current.result === 'HIT' ? 'is-hit' : 'is-insert'}`} x={x + slotW / 2} y={slotsTop + 102}>
                        {current.result === 'HIT' ? 'hit' : 'inserted'}
                      </text>
                    )}
                  </>
                ) : (
                  <text className="cev-slot-empty" x={x + slotW / 2} y={slotsTop + slotH / 2 + 6}>empty</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cev-metrics">
        <div className="cev-metric">
          <span className="cev-metric-label">policy</span>
          <span className="cev-metric-value">{policy}</span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">result</span>
          <span className={`cev-metric-value ${current.result === 'HIT' ? 'is-hit' : current.result === 'MISS' ? 'is-miss' : ''}`}>
            {current.result || '—'}
          </span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">hits</span>
          <span className="cev-metric-value is-hit">{current.hits}</span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">misses</span>
          <span className="cev-metric-value is-miss">{current.misses}</span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">hit ratio</span>
          <span className="cev-metric-value">{ratio}%</span>
        </div>
      </div>

      <div className="cev-narration">
        <span className="cev-narration-label">trace</span>
        <span className="cev-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
