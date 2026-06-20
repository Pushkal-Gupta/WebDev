import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, StepForward, Layers, Clock,
  RefreshCw, Check, X, ArrowRight, AlertTriangle, Trash2,
} from 'lucide-react';
import './PageReplacementViz.css';

// Page replacement — a fixed set of physical frames serves a reference string of
// page accesses. A reference to a resident page is a HIT; a reference to a
// non-resident page is a FAULT. On a fault with a free frame, load. On a fault
// with every frame full, EVICT one victim per the chosen policy, then load.
//
//   FIFO   evict the page that has been resident longest (insertion order).
//          Cheap, but can suffer Belady's anomaly — MORE frames can mean MORE
//          faults on adversarial strings.
//   LRU    evict the page used least recently. Approximates optimal on locality;
//          never suffers Belady (it is a stack algorithm).
//   Clock  a cheap LRU approximation. Frames sit on a ring with a reference bit.
//          The hand sweeps: bit 1 -> clear it and advance; bit 0 -> evict here.
//          A hit just sets the bit. No anomaly (stack-like second chance).

const POLICIES = [
  { key: 'fifo', label: 'FIFO', sub: 'oldest out' },
  { key: 'lru', label: 'LRU', sub: 'least recent out' },
  { key: 'clock', label: 'Clock', sub: 'second chance' },
];

const PRESETS = [
  { key: 'belady', label: 'Belady', string: '1 2 3 4 1 2 5 1 2 3 4 5' },
  { key: 'locality', label: 'Locality', string: '7 0 1 2 0 3 0 4 2 3 0 3 2' },
  { key: 'loop', label: 'Loop', string: '1 2 3 4 5 1 2 3 4 5 1 2' },
];

const TICK_MS = 1100;

function parseRefs(str) {
  return str
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && /^\d+$/.test(t))
    .map((t) => Number(t))
    .slice(0, 24);
}

// Run one policy over the whole reference string at a given frame count and
// return the per-step trace plus aggregate fault/hit/eviction counts.
// Pure + deterministic — no Math.random, no React state.
function simulate(policy, refs, frameCount) {
  const frames = []; // { page, loadOrder, lastUsed, ref } | filling slots
  const trace = [];
  let faults = 0;
  let hits = 0;
  let evictions = 0;
  let loadSeq = 0;
  let hand = 0; // clock hand index

  for (let i = 0; i < refs.length; i += 1) {
    const page = refs[i];
    const residentIdx = frames.findIndex((f) => f && f.page === page);
    let kind; let victim = null; let slot = null;

    if (residentIdx >= 0) {
      kind = 'hit';
      hits += 1;
      frames[residentIdx].lastUsed = i;
      if (policy === 'clock') frames[residentIdx].ref = 1;
    } else {
      kind = 'fault';
      faults += 1;
      const freeIdx = frames.length < frameCount
        ? frames.length
        : frames.findIndex((f) => !f);
      if (frames.length < frameCount || freeIdx >= 0) {
        slot = frames.length < frameCount ? frames.length : freeIdx;
        frames[slot] = { page, loadOrder: loadSeq, lastUsed: i, ref: 1 };
        loadSeq += 1;
      } else {
        // all full -> pick victim
        let vIdx;
        if (policy === 'fifo') {
          vIdx = 0;
          for (let k = 1; k < frames.length; k += 1) {
            if (frames[k].loadOrder < frames[vIdx].loadOrder) vIdx = k;
          }
        } else if (policy === 'lru') {
          vIdx = 0;
          for (let k = 1; k < frames.length; k += 1) {
            if (frames[k].lastUsed < frames[vIdx].lastUsed) vIdx = k;
          }
        } else {
          // clock: sweep hand, give second chance to ref=1
          while (frames[hand].ref === 1) {
            frames[hand].ref = 0;
            hand = (hand + 1) % frameCount;
          }
          vIdx = hand;
          hand = (hand + 1) % frameCount;
        }
        victim = frames[vIdx].page;
        evictions += 1;
        slot = vIdx;
        frames[vIdx] = { page, loadOrder: loadSeq, lastUsed: i, ref: 1 };
        loadSeq += 1;
      }
    }

    trace.push({
      page,
      kind,
      victim,
      slot,
      hand: policy === 'clock' ? hand : null,
      frames: frames.map((f) => (f ? { page: f.page, ref: f.ref } : null)),
      faults,
      hits,
      evictions,
    });
  }

  return { trace, faults, hits, evictions };
}

const DEFAULT_STRING = PRESETS[0].string;

export default function PageReplacementViz() {
  const [policy, setPolicy] = useState('fifo');
  const [frameCount, setFrameCount] = useState(3);
  const [refString, setRefString] = useState(DEFAULT_STRING);
  const [step, setStep] = useState(-1); // -1 = before first access
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);

  const runTimer = useRef(null);
  useEffect(() => () => { if (runTimer.current) clearInterval(runTimer.current); }, []);

  const refs = useMemo(() => parseRefs(refString), [refString]);
  const total = refs.length;
  const delay = useMemo(() => Math.round(TICK_MS / Math.max(speed, 0.1)), [speed]);

  // active-policy simulation drives the stage
  const sim = useMemo(
    () => simulate(policy, refs, frameCount),
    [policy, refs, frameCount],
  );

  // silent comparison across all three policies on the same string + frames
  const compare = useMemo(() => ({
    fifo: simulate('fifo', refs, frameCount).faults,
    lru: simulate('lru', refs, frameCount).faults,
    clock: simulate('clock', refs, frameCount).faults,
  }), [refs, frameCount]);

  // Belady check: does FIFO get worse (>= faults) with one MORE frame?
  const belady = useMemo(() => {
    if (refs.length === 0 || frameCount >= 5) return null;
    const here = simulate('fifo', refs, frameCount).faults;
    const more = simulate('fifo', refs, frameCount + 1).faults;
    if (more >= here && more > 0) {
      return { from: frameCount, to: frameCount + 1, here, more };
    }
    return null;
  }, [refs, frameCount]);

  const atEnd = step >= total - 1;
  const current = step >= 0 && step < sim.trace.length ? sim.trace[step] : null;

  const stepForward = () => {
    setStep((s) => (s < total - 1 ? s + 1 : s));
  };

  useEffect(() => {
    if (!running) return undefined;
    runTimer.current = setInterval(() => {
      setStep((s) => {
        if (s >= total - 1) {
          if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, delay);
    return () => {
      if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    };
  }, [running, delay, total]);

  const reset = () => {
    setRunning(false);
    if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    setStep(-1);
  };

  const togglePlay = () => {
    if (atEnd) { setStep(-1); setRunning(true); return; }
    setRunning((v) => !v);
  };

  const changePolicy = (p) => { setPolicy(p); reset(); };
  const changeFrames = (n) => { setFrameCount(n); reset(); };
  const changeString = (s) => { setRefString(s); reset(); };
  const loadPreset = (s) => { setRefString(s); reset(); };

  // ---- live readouts (derive from current trace row) ----
  const hits = current ? current.hits : 0;
  const faults = current ? current.faults : 0;
  const evictions = current ? current.evictions : 0;
  const seen = step + 1;
  const faultRate = seen > 0 ? Math.round((faults / seen) * 100) : null;

  const tone = current ? (current.kind === 'hit' ? 'ok' : (current.victim != null ? 'warn' : 'fault')) : 'init';
  const narrTone = tone === 'warn' ? 'is-warn' : tone === 'ok' ? 'is-ok' : tone === 'fault' ? 'is-fault' : '';

  const note = (() => {
    if (!current) {
      return 'Pick a policy and frame count, then Step or Play. Each access is a hit if the page is already resident, or a fault if it must be loaded — and when every frame is full, one page is evicted per the policy.';
    }
    if (current.kind === 'hit') {
      return `Access ${current.page} — HIT. The page is already resident, so no frame changes. ${policy === 'clock' ? 'Clock just sets its reference bit to 1, giving it a second chance on the next sweep.' : policy === 'lru' ? 'LRU marks it as most-recently used, so it moves to the back of the eviction queue.' : 'FIFO leaves insertion order untouched — a hit does not reset the clock on when this page entered.'}`;
    }
    if (current.victim != null) {
      const why = policy === 'fifo'
        ? `FIFO evicts page ${current.victim} — it has been resident the longest, regardless of recent use.`
        : policy === 'lru'
          ? `LRU evicts page ${current.victim} — it went the longest without being referenced.`
          : `Clock's hand swept past any second-chance pages (clearing their bits) and landed on page ${current.victim} with a 0 bit — evicted.`;
      return `Access ${current.page} — FAULT, frames full. ${why} Page ${current.page} loads into the freed slot.`;
    }
    return `Access ${current.page} — FAULT. A frame was free, so page ${current.page} loads with no eviction. Cold-start faults like this are unavoidable; the policy only matters once all frames are full.`;
  })();

  // ---- SVG geometry ----
  const W = 960;
  const H = 360;
  const refTop = 44;
  const cellW = total > 0 ? Math.min(56, (W - 64) / total) : 56;
  const refStartX = 32 + (W - 64 - cellW * total) / 2;
  const refX = (i) => refStartX + i * cellW;

  const frameTop = 138;
  const frameH = 50;
  const frameGap = 14;
  const frameW = 150;
  const frameStartX = 32 + (W - 64 - frameW * frameCount - frameGap * (frameCount - 1)) / 2;
  const frameX = (i) => frameStartX + i * (frameW + frameGap);

  const liveFrames = current ? current.frames : Array.from({ length: frameCount }, () => null);
  const handIdx = current && policy === 'clock' ? current.hand : null;

  const policyMeta = POLICIES.find((p) => p.key === policy);

  return (
    <div className="pgr">
      <div className="pgr-head">
        <h3 className="pgr-title">Page replacement — FIFO vs LRU vs Clock</h3>
        <p className="pgr-sub">
          Step a reference string through a fixed set of frames. A resident page is a hit; a missing one
          faults and, when frames are full, evicts a victim chosen by the policy. Compare fault counts across
          all three on the same string.
        </p>
      </div>

      <div className="pgr-controls">
        <div className="pgr-policies" role="group" aria-label="Replacement policy">
          {POLICIES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`pgr-policy ${policy === p.key ? 'is-on' : ''}`}
              onClick={() => changePolicy(p.key)}
              aria-pressed={policy === p.key}
            >
              {p.key === 'fifo' ? <ArrowRight size={12} /> : p.key === 'lru' ? <Layers size={12} /> : <Clock size={12} />}
              {p.label}
            </button>
          ))}
        </div>

        <label className="pgr-field">
          <span className="pgr-input-label">frames</span>
          <input
            type="range" min={3} max={5} step={1} value={frameCount}
            onChange={(e) => changeFrames(Number(e.target.value))}
            className="pgr-range" aria-label="Frame count"
          />
          <span className="pgr-field-value">{frameCount}</span>
        </label>

        <label className="pgr-field">
          <span className="pgr-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pgr-range" aria-label="Play speed"
          />
          <span className="pgr-field-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="pgr-buttons">
          <button type="button" className="pgr-btn" onClick={stepForward} disabled={atEnd}>
            <StepForward size={14} /> Step
          </button>
          <button type="button" className="pgr-btn pgr-btn-primary" onClick={togglePlay} disabled={total === 0}>
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pause' : atEnd ? 'Replay' : 'Play'}
          </button>
          <button type="button" className="pgr-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="pgr-string-row">
        <span className="pgr-input-label">reference string</span>
        <input
          type="text"
          className="pgr-string-input"
          value={refString}
          onChange={(e) => changeString(e.target.value)}
          aria-label="Reference string"
          spellCheck={false}
        />
        <div className="pgr-presets">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`pgr-preset ${refString.trim() === p.string ? 'is-on' : ''}`}
              onClick={() => loadPreset(p.string)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pgr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pgr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="pgr-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pgr-ah" />
            </marker>
          </defs>

          <text className="pgr-section-label" x={32} y={refTop - 14} textAnchor="start">reference string</text>

          {refs.map((page, i) => {
            const isPast = i < step;
            const isCur = i === step;
            return (
              <g key={`ref-${i}`}>
                <rect
                  className={`pgr-ref ${isCur ? `is-cur ${current ? `is-${current.kind}` : ''}` : ''} ${isPast ? 'is-past' : ''}`}
                  x={refX(i)} y={refTop} width={cellW - 6} height={36} rx={6}
                />
                <text className={`pgr-ref-num ${isCur ? 'is-cur' : ''}`} x={refX(i) + (cellW - 6) / 2} y={refTop + 23} textAnchor="middle">{page}</text>
              </g>
            );
          })}
          {/* cursor under current position */}
          {step >= 0 && step < total && (
            <polygon
              className="pgr-cursor"
              points={`${refX(step) + (cellW - 6) / 2 - 6},${refTop + 44} ${refX(step) + (cellW - 6) / 2 + 6},${refTop + 44} ${refX(step) + (cellW - 6) / 2},${refTop + 52}`}
            />
          )}

          <text className="pgr-section-label" x={32} y={frameTop - 12} textAnchor="start">
            physical frames · {policyMeta.label}
          </text>

          {/* FIFO queue arrow under the frames */}
          {policy === 'fifo' && frameCount > 1 && (
            <g>
              <line
                className="pgr-queue-line"
                x1={frameX(0) + 8} y1={frameTop + frameH + 18}
                x2={frameX(frameCount - 1) + frameW - 8} y2={frameTop + frameH + 18}
                markerEnd="url(#pgr-arr)"
              />
              <text className="pgr-queue-label" x={frameStartX} y={frameTop + frameH + 34} textAnchor="start">oldest in</text>
              <text className="pgr-queue-label" x={frameX(frameCount - 1) + frameW} y={frameTop + frameH + 34} textAnchor="end">newest in</text>
            </g>
          )}

          {Array.from({ length: frameCount }).map((_, i) => {
            const f = liveFrames[i] || null;
            const isVictimSlot = current && current.kind === 'fault' && current.victim != null && current.slot === i;
            const isLoadSlot = current && current.kind === 'fault' && current.slot === i;
            const isHitSlot = current && current.kind === 'hit' && f && f.page === current.page;
            const isHand = handIdx === i;
            const cls = isVictimSlot ? 'is-evicting' : isLoadSlot ? 'is-loading' : isHitSlot ? 'is-hitting' : f ? 'is-filled' : 'is-empty';
            return (
              <g key={`frame-${i}`}>
                <rect className={`pgr-frame ${cls}`} x={frameX(i)} y={frameTop} width={frameW} height={frameH} rx={8} />
                <text className="pgr-frame-idx" x={frameX(i) + 10} y={frameTop + 16} textAnchor="start">f{i}</text>
                {f ? (
                  <text className={`pgr-frame-page ${isHitSlot ? 'is-hit' : ''} ${isLoadSlot ? 'is-load' : ''}`} x={frameX(i) + frameW / 2} y={frameTop + 36} textAnchor="middle">{f.page}</text>
                ) : (
                  <text className="pgr-frame-empty" x={frameX(i) + frameW / 2} y={frameTop + 34} textAnchor="middle">empty</text>
                )}
                {/* clock reference bit */}
                {policy === 'clock' && f && (
                  <text className={`pgr-frame-bit ${f.ref ? 'is-set' : ''}`} x={frameX(i) + frameW - 10} y={frameTop + 16} textAnchor="end">
                    bit {f.ref}
                  </text>
                )}
                {/* clock hand marker */}
                {policy === 'clock' && isHand && (
                  <g>
                    <polygon
                      className="pgr-hand"
                      points={`${frameX(i) + frameW / 2 - 7},${frameTop - 6} ${frameX(i) + frameW / 2 + 7},${frameTop - 6} ${frameX(i) + frameW / 2},${frameTop + 2}`}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* victim leaving banner */}
          {current && current.kind === 'fault' && current.victim != null && (
            <g>
              <g transform={`translate(${W / 2 - 96}, ${frameTop + frameH + 30})`}>
                <Trash2 width={14} height={14} className="pgr-evict-ic" />
              </g>
              <text className="pgr-evict-text" x={W / 2 - 76} y={frameTop + frameH + 42} textAnchor="start">
                evicted page {current.victim}, loaded {current.page}
              </text>
            </g>
          )}

          {/* comparison panel */}
          <text className="pgr-section-label" x={32} y={H - 78} textAnchor="start">
            faults over the full string ({total} accesses, {frameCount} frames)
          </text>
          {POLICIES.map((p, i) => {
            const val = compare[p.key];
            const best = Math.min(compare.fifo, compare.lru, compare.clock);
            const isBest = total > 0 && val === best;
            const bw = (W - 64) / 3 - 12;
            const bx = 32 + i * ((W - 64) / 3);
            return (
              <g key={`cmp-${p.key}`}>
                <rect className={`pgr-cmp ${p.key === policy ? 'is-active' : ''} ${isBest ? 'is-best' : ''}`} x={bx} y={H - 62} width={bw} height={42} rx={7} />
                <text className="pgr-cmp-name" x={bx + 14} y={H - 44} textAnchor="start">{p.label}</text>
                <text className="pgr-cmp-sub" x={bx + 14} y={H - 30} textAnchor="start">{p.sub}</text>
                <text className={`pgr-cmp-val ${isBest ? 'is-best' : ''}`} x={bx + bw - 14} y={H - 36} textAnchor="end">
                  {total > 0 ? `${val}` : '—'}
                </text>
                <text className="pgr-cmp-unit" x={bx + bw - 14} y={H - 24} textAnchor="end">faults</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pgr-metrics">
        <div className="pgr-metric">
          <span className="pgr-metric-label">policy</span>
          <span className="pgr-metric-value">{policyMeta.label}</span>
        </div>
        <div className="pgr-metric">
          <span className="pgr-metric-label">position</span>
          <span className="pgr-metric-value">{step < 0 ? '—' : `${seen} / ${total}`}</span>
        </div>
        <div className="pgr-metric">
          <span className="pgr-metric-label">hits</span>
          <span className="pgr-metric-value is-ok">{hits}</span>
        </div>
        <div className="pgr-metric">
          <span className="pgr-metric-label">faults</span>
          <span className="pgr-metric-value is-fault">{faults}</span>
        </div>
        <div className="pgr-metric">
          <span className="pgr-metric-label">evictions</span>
          <span className="pgr-metric-value is-warn">{evictions}</span>
        </div>
        <div className="pgr-metric pgr-metric-dim">
          <span className="pgr-metric-label">fault rate</span>
          <span className="pgr-metric-value">{faultRate == null ? '—' : `${faultRate}%`}</span>
        </div>
      </div>

      <div className={`pgr-narration ${narrTone}`}>
        <span className={`pgr-narration-label ${narrTone}`}>
          {tone === 'ok' ? 'hit' : tone === 'warn' ? 'evict' : tone === 'fault' ? 'fault' : 'ready'}
        </span>
        <span className="pgr-narration-body">{note}</span>
      </div>

      {belady && (
        <div className="pgr-belady">
          <AlertTriangle size={15} className="pgr-belady-ic" />
          <span className="pgr-belady-body">
            {`Belady's anomaly on this string: FIFO takes ${belady.here} faults with ${belady.from} frames but ${belady.more} with ${belady.to} — adding a frame does not help, it hurts. LRU and Clock are stack algorithms and never get worse with more frames.`}
          </span>
        </div>
      )}

      <div className="pgr-legend">
        <span className="pgr-legend-item"><Check size={13} className="pgr-ic is-ok" /> hit — page already resident</span>
        <span className="pgr-legend-item"><X size={13} className="pgr-ic is-fault" /> fault — page loaded into a frame</span>
        <span className="pgr-legend-item"><Trash2 size={13} className="pgr-ic is-warn" /> evict — a victim leaves when frames are full</span>
        <span className="pgr-legend-item"><RefreshCw size={13} className="pgr-ic" /> FIFO can fault MORE with more frames (Belady); LRU and Clock never do</span>
      </div>
    </div>
  );
}
