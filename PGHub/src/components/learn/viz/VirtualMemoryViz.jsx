import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Cpu, HardDrive, Table, Zap,
  Search, AlertTriangle, Check, MemoryStick,
} from 'lucide-react';
import './VirtualMemoryViz.css';

// Virtual -> physical address translation. The CPU emits a virtual page number;
// translation walks three layers in order:
//
//   TLB         a tiny cache of recent VP -> frame translations. A hit skips the
//               page-table walk entirely — single-cycle, the fast path.
//   page table  one entry per virtual page mapping it to a physical frame, or
//               marking it "on disk" (not resident). The walk is slower than the
//               TLB but still in-memory.
//   page fault  the page table says the page is on disk. The OS picks a free
//               frame (FIFO-evicts the oldest-loaded frame if memory is full),
//               loads the page from disk (slow — milliseconds), maps it, fills
//               the TLB, and retries the access.
//
// Interactive: access any virtual page and watch the path light up step by step,
// or auto-run a deterministic reference string. Hit / miss / fault counters and a
// live TLB hit-rate make the trade visible.

const VPAGES = 8; // VP0..VP7
const FRAMES = 4; // PF0..PF3
const TLB_SIZE = 3;
const STEP_MS = 850;
// deterministic reference string for auto mode — mixes hits, misses, faults
const REF_STRING = [0, 1, 0, 4, 2, 0, 5, 1, 6, 4, 7, 2, 0, 3];

// initial page table: some pages resident (frame index), some on disk (null)
function seedTable() {
  // VP -> frame (or null for on-disk). 3 resident at start, one free frame (PF3).
  return [0, null, 1, null, null, 2, null, null]; // VP0->PF0, VP2->PF1, VP5->PF2
}

// frames hold which VP currently lives there (or null when free), plus a
// monotonically increasing load-order so FIFO eviction can pick the oldest.
function seedFrames() {
  return [
    { vp: 0, loadedAt: 1 },
    { vp: 2, loadedAt: 2 },
    { vp: 5, loadedAt: 3 },
    { vp: null, loadedAt: 0 },
  ];
}

function seedTlb() {
  // most-recent-first; mirrors the seeded resident pages
  return [
    { vp: 0, frame: 0 },
    { vp: 5, frame: 2 },
  ];
}

export default function VirtualMemoryViz() {
  const [table, setTable] = useState(() => seedTable());
  const [frames, setFrames] = useState(() => seedFrames());
  const [tlb, setTlb] = useState(() => seedTlb());
  const [loadSeq, setLoadSeq] = useState(3);
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [, setRefIdx] = useState(0);
  const [selVp, setSelVp] = useState(1);

  const [active, setActive] = useState(null); // VP currently being translated
  const [phase, setPhase] = useState('idle'); // idle|tlb|tlb-hit|walk|hit|fault|disk|retry
  const [litFrame, setLitFrame] = useState(null);

  const [stats, setStats] = useState({ accesses: 0, tlbHits: 0, tlbMisses: 0, faults: 0 });
  const [note, setNote] = useState('Pick a virtual page and translate it. The CPU checks the TLB first, then walks the page table; an unmapped page triggers a page fault that loads from disk into a free frame.');
  const [tone, setTone] = useState('init');

  const stepTimer = useRef(null);
  const busyRef = useRef(false);
  useEffect(() => () => {
    if (stepTimer.current) clearTimeout(stepTimer.current);
  }, []);

  const delay = useMemo(() => Math.round(STEP_MS / Math.max(speed, 0.1)), [speed]);

  const schedule = (fn, ms) => {
    if (stepTimer.current) clearTimeout(stepTimer.current);
    stepTimer.current = setTimeout(fn, ms);
  };

  // run one full translation as a small state machine; updates state via the
  // functional setters so it never goes stale between scheduled steps.
  const translate = (vp) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setActive(vp);
    setLitFrame(null);
    setStats((s) => ({ ...s, accesses: s.accesses + 1 }));

    // STEP 1 — TLB lookup
    setPhase('tlb');
    setTone('run');
    setNote(`Access VP${vp}: the CPU first checks the TLB — a tiny cache of recent translations. Scanning its ${TLB_SIZE} slots…`);

    schedule(() => {
      setTlb((curTlb) => {
        const hitEntry = curTlb.find((e) => e.vp === vp);
        if (hitEntry) {
          // TLB HIT — fast path, no page-table walk
          setStats((s) => ({ ...s, tlbHits: s.tlbHits + 1 }));
          setPhase('tlb-hit');
          setLitFrame(hitEntry.frame);
          setTone('ok');
          setNote(`TLB hit. VP${vp} was cached, so translation resolves to physical frame PF${hitEntry.frame} in a single cycle — the page-table walk is skipped entirely. This is the fast path that makes virtual memory cheap.`);
          schedule(() => { busyRef.current = false; setPhase('idle'); }, delay * 2);
          return curTlb;
        }

        // TLB MISS — fall through to the page-table walk
        setStats((s) => ({ ...s, tlbMisses: s.tlbMisses + 1 }));
        setPhase('walk');
        setNote(`TLB miss — VP${vp} isn't cached. Fall through to the page-table walk: look up entry ${vp} to find its frame (or learn it's on disk).`);

        schedule(() => {
          setTable((curTable) => {
            const frame = curTable[vp];
            if (frame !== null && frame !== undefined) {
              // RESIDENT — page table maps it; fill the TLB and finish
              setPhase('hit');
              setLitFrame(frame);
              setTone('ok');
              setNote(`Page table says VP${vp} is resident in frame PF${frame}. Translation done — and the OS fills the TLB with VP${vp} -> PF${frame} so the next access to this page hits the fast path.`);
              setTlb((t) => [{ vp, frame }, ...t.filter((e) => e.vp !== vp)].slice(0, TLB_SIZE));
              schedule(() => { busyRef.current = false; setPhase('idle'); }, delay * 2);
              return curTable;
            }

            // PAGE FAULT — page is on disk, must be loaded
            setStats((s) => ({ ...s, faults: s.faults + 1 }));
            setPhase('fault');
            setTone('warn');
            setNote(`Page fault. The page table marks VP${vp} as on disk — it isn't in physical memory. The CPU traps to the OS, which must load the page before the access can complete.`);

            schedule(() => {
              setPhase('disk');
              setNote(`Loading VP${vp} from disk… this is the slow path — milliseconds, not nanoseconds. The OS picks a physical frame to hold it.`);

              schedule(() => {
                // choose a frame: prefer a free one, else FIFO-evict the oldest
                setFrames((curFrames) => {
                  let slot = curFrames.findIndex((f) => f.vp === null);
                  let evicted = null;
                  if (slot === -1) {
                    // FIFO: smallest loadedAt among occupied frames
                    let oldest = Infinity;
                    curFrames.forEach((f, i) => {
                      if (f.vp !== null && f.loadedAt < oldest) { oldest = f.loadedAt; slot = i; }
                    });
                    evicted = curFrames[slot].vp;
                  }

                  const newSeq = loadSeq + 1;
                  setLoadSeq(newSeq);

                  // update page table: unmap evicted page, map the faulting page
                  setTable((t) => {
                    const nt = [...t];
                    if (evicted !== null && evicted !== undefined) nt[evicted] = null;
                    nt[vp] = slot;
                    return nt;
                  });

                  // evicting a page also invalidates its TLB entry
                  if (evicted !== null && evicted !== undefined) {
                    setTlb((t) => t.filter((e) => e.vp !== evicted));
                  }

                  const nf = curFrames.map((f, i) => (i === slot ? { vp, loadedAt: newSeq } : f));
                  setLitFrame(slot);
                  setPhase('retry');
                  setTone('ok');
                  setNote(evicted !== null && evicted !== undefined
                    ? `Memory was full, so FIFO evicted the oldest-loaded page (VP${evicted}) from PF${slot} — its page-table entry and TLB line are invalidated. VP${vp} is loaded into PF${slot}, mapped, and cached. Retrying the access: it now hits.`
                    : `Free frame PF${slot} was available. VP${vp} is loaded into it, the page table is updated, and the TLB is filled. Retrying the access: it now resolves to PF${slot} — fault handled.`);

                  // fill TLB with the freshly mapped page
                  setTlb((t) => [{ vp, frame: slot }, ...t.filter((e) => e.vp !== vp)].slice(0, TLB_SIZE));

                  schedule(() => { busyRef.current = false; setPhase('idle'); }, delay * 2);
                  return nf;
                });
              }, delay * 2);
            }, delay);

            return curTable;
          });
        }, delay);
      });
    }, delay);
  };

  // auto mode: walk the deterministic reference string one access at a time.
  // depends only on [autoplay, delay] like the reference HotWarmCold effect; uses
  // functional setState so it never reads a stale access from closure.
  useEffect(() => {
    if (!autoplay) return undefined;
    const tick = setInterval(() => {
      if (busyRef.current) return;
      setRefIdx((i) => {
        const vp = REF_STRING[i % REF_STRING.length];
        translate(vp);
        return i + 1;
      });
    }, delay * 5);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- translate uses functional setState; rebind only on autoplay/delay change
  }, [autoplay, delay]);

  const reset = () => {
    setAutoplay(false);
    if (stepTimer.current) { clearTimeout(stepTimer.current); stepTimer.current = null; }
    busyRef.current = false;
    setTable(seedTable());
    setFrames(seedFrames());
    setTlb(seedTlb());
    setLoadSeq(3);
    setRefIdx(0);
    setActive(null);
    setPhase('idle');
    setLitFrame(null);
    setStats({ accesses: 0, tlbHits: 0, tlbMisses: 0, faults: 0 });
    setNote('Pick a virtual page and translate it. The CPU checks the TLB first, then walks the page table; an unmapped page triggers a page fault that loads from disk into a free frame.');
    setTone('init');
  };

  const hitRate = stats.accesses > 0
    ? `${Math.round((stats.tlbHits / stats.accesses) * 100)}%`
    : '—';

  const narrTone = tone === 'warn' ? 'is-warn' : tone === 'ok' ? 'is-ok' : '';

  // ---- SVG geometry ----
  const W = 960;
  const H = 392;

  const cpuX = 28;
  const cpuY = 150;
  const cpuW = 120;
  const cpuH = 92;

  const tlbX = 196;
  const tlbY = 40;
  const tlbW = 220;
  const tlbH = 132;
  const tlbRowH = 30;

  const ptX = 196;
  const ptY = 196;
  const ptW = 220;
  const ptH = 168;
  const ptRowH = (ptH - 30) / VPAGES;

  const memX = 470;
  const memY = 40;
  const memW = 180;
  const memH = 324;
  const memRowH = (memH - 30) / FRAMES;

  const diskX = 712;
  const diskY = 150;
  const diskW = 220;
  const diskH = 132;

  // path-active flags for lighting up the translation route
  const tlbActive = phase === 'tlb' || phase === 'tlb-hit';
  const walkActive = phase === 'walk' || phase === 'hit' || phase === 'fault';
  const faultActive = phase === 'fault' || phase === 'disk' || phase === 'retry';
  const diskActive = phase === 'disk' || phase === 'retry';

  return (
    <div className="vmt">
      <div className="vmt-head">
        <h3 className="vmt-title">Virtual memory — address translation, TLB, and page faults</h3>
        <p className="vmt-sub">
          Access a virtual page and follow the translation path: the TLB is checked first, then the page
          table is walked. An unmapped page triggers a page fault that loads it from disk into a physical frame.
        </p>
      </div>

      <div className="vmt-controls">
        <div className="vmt-pages" role="group" aria-label="Access a virtual page">
          {Array.from({ length: VPAGES }, (_, vp) => (
            <button
              key={vp}
              type="button"
              className={`vmt-page ${selVp === vp ? 'is-sel' : ''} ${active === vp ? 'is-active' : ''}`}
              onClick={() => { setSelVp(vp); translate(vp); }}
              aria-pressed={selVp === vp}
            >
              VP{vp}
            </button>
          ))}
        </div>

        <span className="vmt-spacer" aria-hidden="true" />

        <label className="vmt-speed">
          <span className="vmt-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="vmt-speed-range" aria-label="Animation speed"
          />
          <span className="vmt-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="vmt-buttons">
          <button
            type="button" className={`vmt-btn ${autoplay ? 'vmt-btn-on' : ''}`}
            onClick={() => setAutoplay((v) => !v)}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Stop' : 'Auto'}
          </button>
          <button type="button" className="vmt-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="vmt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="vmt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="vmt-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="vmt-ah" />
            </marker>
            <marker id="vmt-arr-on" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="vmt-ah is-on" />
            </marker>
          </defs>

          {/* ---- routes ---- */}
          {/* CPU -> TLB */}
          <line
            className={`vmt-route ${tlbActive ? 'is-on' : ''}`}
            x1={cpuX + cpuW} y1={cpuY + 18} x2={tlbX} y2={tlbY + tlbH / 2}
            markerEnd={tlbActive ? 'url(#vmt-arr-on)' : 'url(#vmt-arr)'}
          />
          {/* CPU -> page table */}
          <line
            className={`vmt-route ${walkActive ? 'is-on' : ''}`}
            x1={cpuX + cpuW} y1={cpuY + cpuH - 18} x2={ptX} y2={ptY + 40}
            markerEnd={walkActive ? 'url(#vmt-arr-on)' : 'url(#vmt-arr)'}
          />
          {/* TLB -> memory (fast path) */}
          <line
            className={`vmt-route ${phase === 'tlb-hit' ? 'is-on' : ''}`}
            x1={tlbX + tlbW} y1={tlbY + tlbH / 2} x2={memX} y2={memY + 50}
            markerEnd={phase === 'tlb-hit' ? 'url(#vmt-arr-on)' : 'url(#vmt-arr)'}
          />
          {/* page table -> memory (resolved walk) */}
          <line
            className={`vmt-route ${phase === 'hit' || phase === 'retry' ? 'is-on' : ''}`}
            x1={ptX + ptW} y1={ptY + ptH / 2} x2={memX} y2={memY + memH - 50}
            markerEnd={phase === 'hit' || phase === 'retry' ? 'url(#vmt-arr-on)' : 'url(#vmt-arr)'}
          />
          {/* memory <-> disk (page fault load) */}
          <line
            className={`vmt-route is-fault ${faultActive ? 'is-on' : ''}`}
            x1={memX + memW} y1={memY + memH - 40} x2={diskX} y2={diskY + diskH / 2}
            markerEnd={faultActive ? 'url(#vmt-arr-on)' : 'url(#vmt-arr)'}
          />
          {faultActive && (
            <text className="vmt-route-label is-fault" x={(memX + memW + diskX) / 2} y={memY + memH - 8} textAnchor="middle">
              page fault: load
            </text>
          )}

          {/* ---- CPU ---- */}
          <rect className={`vmt-box vmt-cpu ${active !== null && phase !== 'idle' ? 'is-on' : ''}`} x={cpuX} y={cpuY} width={cpuW} height={cpuH} rx={10} />
          <g transform={`translate(${cpuX + 12}, ${cpuY + 12})`}>
            <Cpu width={15} height={15} className="vmt-ic-head" />
          </g>
          <text className="vmt-box-label" x={cpuX + 34} y={cpuY + 24} textAnchor="start">CPU</text>
          <text className="vmt-box-sub" x={cpuX + 14} y={cpuY + 48} textAnchor="start">virtual addr</text>
          <text className={`vmt-box-val ${active !== null ? 'is-on' : ''}`} x={cpuX + 14} y={cpuY + 70} textAnchor="start">
            {active !== null ? `VP${active}` : 'idle'}
          </text>

          {/* ---- TLB ---- */}
          <rect className={`vmt-box vmt-tlb ${tlbActive ? 'is-on' : ''}`} x={tlbX} y={tlbY} width={tlbW} height={tlbH} rx={10} />
          <g transform={`translate(${tlbX + 12}, ${tlbY + 11})`}>
            <Zap width={14} height={14} className="vmt-ic-head is-tlb" />
          </g>
          <text className="vmt-box-label is-tlb" x={tlbX + 32} y={tlbY + 22} textAnchor="start">TLB</text>
          <text className="vmt-box-sub" x={tlbX + tlbW - 12} y={tlbY + 22} textAnchor="end">recent translations</text>
          {Array.from({ length: TLB_SIZE }, (_, i) => {
            const e = tlb[i];
            const ry = tlbY + 34 + i * tlbRowH;
            const isHit = phase === 'tlb-hit' && e && e.vp === active;
            const isScan = phase === 'tlb' && e;
            return (
              <g key={`tlb-${i}`}>
                <rect className={`vmt-slot ${isHit ? 'is-hit' : ''} ${isScan ? 'is-scan' : ''}`} x={tlbX + 12} y={ry} width={tlbW - 24} height={tlbRowH - 6} rx={5} />
                {e ? (
                  <>
                    <text className="vmt-slot-key" x={tlbX + 24} y={ry + 16} textAnchor="start">VP{e.vp}</text>
                    <text className="vmt-slot-arr" x={tlbX + tlbW / 2} y={ry + 16} textAnchor="middle">{'->'}</text>
                    <text className="vmt-slot-val" x={tlbX + tlbW - 24} y={ry + 16} textAnchor="end">PF{e.frame}</text>
                  </>
                ) : (
                  <text className="vmt-slot-empty" x={tlbX + tlbW / 2} y={ry + 16} textAnchor="middle">empty</text>
                )}
              </g>
            );
          })}

          {/* ---- page table ---- */}
          <rect className={`vmt-box vmt-pt ${walkActive ? 'is-on' : ''}`} x={ptX} y={ptY} width={ptW} height={ptH} rx={10} />
          <g transform={`translate(${ptX + 12}, ${ptY + 11})`}>
            <Table width={14} height={14} className="vmt-ic-head is-pt" />
          </g>
          <text className="vmt-box-label is-pt" x={ptX + 32} y={ptY + 22} textAnchor="start">page table</text>
          {table.map((frame, vp) => {
            const ry = ptY + 30 + vp * ptRowH;
            const isWalk = (phase === 'walk' || phase === 'hit' || phase === 'fault') && vp === active;
            const resident = frame !== null && frame !== undefined;
            return (
              <g key={`pt-${vp}`}>
                <rect className={`vmt-pt-row ${isWalk ? 'is-walk' : ''} ${resident ? '' : 'is-disk'}`} x={ptX + 10} y={ry} width={ptW - 20} height={ptRowH - 2} rx={4} />
                <text className="vmt-pt-key" x={ptX + 20} y={ry + ptRowH / 2 + 3} textAnchor="start">VP{vp}</text>
                <text className={`vmt-pt-val ${resident ? '' : 'is-disk'}`} x={ptX + ptW - 18} y={ry + ptRowH / 2 + 3} textAnchor="end">
                  {resident ? `PF${frame}` : 'on disk'}
                </text>
              </g>
            );
          })}

          {/* ---- physical memory (frames) ---- */}
          <rect className="vmt-box vmt-mem" x={memX} y={memY} width={memW} height={memH} rx={10} />
          <g transform={`translate(${memX + 12}, ${memY + 11})`}>
            <MemoryStick width={14} height={14} className="vmt-ic-head is-mem" />
          </g>
          <text className="vmt-box-label is-mem" x={memX + 32} y={memY + 22} textAnchor="start">physical memory</text>
          {frames.map((f, pf) => {
            const ry = memY + 30 + pf * memRowH;
            const lit = litFrame === pf;
            const free = f.vp === null;
            return (
              <g key={`pf-${pf}`}>
                <rect className={`vmt-frame ${lit ? 'is-lit' : ''} ${free ? 'is-free' : ''}`} x={memX + 12} y={ry} width={memW - 24} height={memRowH - 8} rx={6} />
                <text className="vmt-frame-id" x={memX + 24} y={ry + 18} textAnchor="start">PF{pf}</text>
                <text className={`vmt-frame-val ${free ? 'is-free' : ''}`} x={memX + memW - 24} y={ry + 18} textAnchor="end">
                  {free ? 'free' : `VP${f.vp}`}
                </text>
                {!free && (
                  <text className="vmt-frame-meta" x={memX + 24} y={ry + memRowH - 16} textAnchor="start">loaded #{f.loadedAt}</text>
                )}
              </g>
            );
          })}

          {/* ---- disk ---- */}
          <rect className={`vmt-box vmt-disk ${diskActive ? 'is-on' : ''}`} x={diskX} y={diskY} width={diskW} height={diskH} rx={10} />
          <g transform={`translate(${diskX + 12}, ${diskY + 12})`}>
            <HardDrive width={15} height={15} className="vmt-ic-head is-disk" />
          </g>
          <text className="vmt-box-label is-disk" x={diskX + 34} y={diskY + 24} textAnchor="start">disk (backing store)</text>
          <text className="vmt-box-sub" x={diskX + 14} y={diskY + 50} textAnchor="start">non-resident pages</text>
          <text className={`vmt-disk-state ${diskActive ? 'is-on' : ''}`} x={diskX + 14} y={diskY + 78} textAnchor="start">
            {diskActive ? `transferring VP${active}…` : 'idle'}
          </text>
          <text className="vmt-box-sub" x={diskX + 14} y={diskY + 104} textAnchor="start">slow path · ~ms</text>
        </svg>
      </div>

      <div className="vmt-metrics">
        <div className="vmt-metric">
          <span className="vmt-metric-label">accesses</span>
          <span className="vmt-metric-value">{stats.accesses}</span>
        </div>
        <div className="vmt-metric">
          <span className="vmt-metric-label">TLB hits</span>
          <span className="vmt-metric-value is-ok">{stats.tlbHits}</span>
        </div>
        <div className="vmt-metric">
          <span className="vmt-metric-label">TLB misses</span>
          <span className="vmt-metric-value">{stats.tlbMisses}</span>
        </div>
        <div className="vmt-metric">
          <span className="vmt-metric-label">page faults</span>
          <span className={`vmt-metric-value ${stats.faults > 0 ? 'is-warn' : ''}`}>{stats.faults}</span>
        </div>
        <div className="vmt-metric vmt-metric-dim">
          <span className="vmt-metric-label">TLB hit-rate</span>
          <span className={`vmt-metric-value ${stats.accesses > 0 ? 'is-ok' : ''}`}>{hitRate}</span>
        </div>
      </div>

      <div className={`vmt-narration ${narrTone}`}>
        <span className={`vmt-narration-label ${narrTone}`}>
          {tone === 'warn' ? 'page fault' : tone === 'ok' ? 'resolved' : 'ready'}
        </span>
        <span className="vmt-narration-body">{note}</span>
      </div>

      <div className="vmt-legend">
        <span className="vmt-legend-item"><Zap size={13} className="vmt-ic is-tlb" /> TLB — cached translation, the fast path</span>
        <span className="vmt-legend-item"><Table size={13} className="vmt-ic is-pt" /> page table — VP to frame, or on disk</span>
        <span className="vmt-legend-item"><MemoryStick size={13} className="vmt-ic is-mem" /> physical memory — {FRAMES} frames, FIFO eviction</span>
        <span className="vmt-legend-item"><HardDrive size={13} className="vmt-ic is-disk" /> disk — backing store for non-resident pages</span>
        <span className="vmt-legend-item"><Check size={13} className="vmt-ic is-ok" /> hit</span>
        <span className="vmt-legend-item"><Search size={13} className="vmt-ic" /> miss / walk</span>
        <span className="vmt-legend-item"><AlertTriangle size={13} className="vmt-ic is-warn" /> fault — slow disk load + retry</span>
      </div>
    </div>
  );
}
