import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Plus, Box, Layers, Share2, Lock,
  AlertTriangle, Zap, Check, Cpu, GitBranch,
} from 'lucide-react';
import './ProcessVsThreadViz.css';

// Process vs thread — isolation versus sharing, and what each costs to switch.
//
//   PROCESS model. Each process owns a full address space: its own code, heap,
//   stack and file descriptors. Nothing is shared. One process cannot read or
//   corrupt another's memory — total isolation. The price is paid on creation
//   (the kernel duplicates the whole address space) and on every context switch
//   (the CPU swaps page tables and flushes the TLB — expensive).
//
//   THREAD model. Threads live INSIDE one process. They share the process's heap
//   and file descriptors; only the stack is per-thread. Spawning a thread costs
//   almost nothing — just a new stack. Switching between threads of the same
//   process keeps the address space, so no TLB flush — cheap. But sharing the
//   heap means two threads can race on the same memory: read→increment→write can
//   interleave so one update is lost.
//
// Interactive: spawn processes (each draws a full new address space) vs spawn
// threads (each adds only a stack); run a deterministic lost-update race on a
// shared counter; compare context-switch cost. No Math.random — the race
// interleave is scripted so the lost update is reproducible.

const PROC_SWITCH_COST = 1000; // arbitrary cost units — full address-space swap + TLB flush
const THREAD_SWITCH_COST = 50; // arbitrary cost units — same address space, no TLB flush
const SEG_LABELS = ['code', 'heap', 'stack', 'fds'];

// scripted lost-update interleave on a shared counter starting at 5.
// T1 and T2 both read 5, both compute 6, both write 6 — expected 7, got 6.
const RACE_STEPS = [
  { who: 't1', op: 'read', reads: 5, note: 'T1 reads the shared counter: it sees 5.' },
  { who: 't2', op: 'read', reads: 5, note: 'Before T1 writes back, the scheduler switches to T2. T2 also reads 5 — the same stale value.' },
  { who: 't1', op: 'inc', reads: 5, computes: 6, note: 'T1 computes 5 + 1 = 6 in its own register.' },
  { who: 't2', op: 'inc', reads: 5, computes: 6, note: 'T2 computes 5 + 1 = 6 too — both threads hold 6, unaware of each other.' },
  { who: 't1', op: 'write', computes: 6, wrote: 6, note: 'T1 writes 6 back to the shared heap. Counter is now 6.' },
  { who: 't2', op: 'write', computes: 6, wrote: 6, note: 'T2 writes 6 as well — overwriting, not adding. Two increments happened but the counter only moved by one. The second increment is the LOST UPDATE.' },
];

export default function ProcessVsThreadViz() {
  const [model, setModel] = useState('process'); // 'process' | 'thread'
  const [procCount, setProcCount] = useState(2);
  const [threadCount, setThreadCount] = useState(2);

  // shared-counter race state
  const [counter, setCounter] = useState(5);
  const [raceStep, setRaceStep] = useState(-1); // -1 = idle, 0..n active, n = done
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(1.4);
  const [lostUpdates, setLostUpdates] = useState(0);
  const [t1Reg, setT1Reg] = useState(null);
  const [t2Reg, setT2Reg] = useState(null);

  // context-switch state
  const [lastSwitch, setLastSwitch] = useState(null); // { kind, cost, tlb }

  const [note, setNote] = useState('Toggle between the process model (each owns a full, isolated address space) and the thread model (threads share one heap). Spawn either, then run the race or compare a context switch.');
  const [tone, setTone] = useState('init');

  const runTimer = useRef(null);
  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const totalRace = RACE_STEPS.length;
  const raceDone = raceStep >= totalRace;
  const delay = useMemo(() => Math.round(1500 / Math.max(speed, 0.1)), [speed]);

  // apply one race step to the derived register/counter readouts
  const applyRaceStep = (idx) => {
    const s = RACE_STEPS[idx];
    if (!s) return;
    if (s.who === 't1') {
      if (s.op === 'read') setT1Reg(s.reads);
      else if (s.op === 'inc') setT1Reg(s.computes);
      else if (s.op === 'write') setCounter(s.wrote);
    } else {
      if (s.op === 'read') setT2Reg(s.reads);
      else if (s.op === 'inc') setT2Reg(s.computes);
      else if (s.op === 'write') setCounter(s.wrote);
    }
    setTone(idx === totalRace - 1 ? 'warn' : 'run');
    setNote(s.note);
  };

  const stepRace = () => {
    setRaceStep((prev) => {
      if (model !== 'thread') return prev;
      const next = prev < 0 ? 0 : prev + 1;
      if (next >= totalRace) {
        setAutoplay(false);
        return prev; // already done
      }
      applyRaceStep(next);
      if (next === totalRace - 1) {
        setLostUpdates((l) => l + 1);
      }
      return next;
    });
  };

  // autoplay the race interleave
  useEffect(() => {
    if (!autoplay) return undefined;
    if (model !== 'thread') return undefined;
    if (raceStep >= totalRace - 1) return undefined;
    runTimer.current = setTimeout(() => {
      setRaceStep((prev) => {
        const next = prev < 0 ? 0 : prev + 1;
        if (next >= totalRace) return prev;
        applyRaceStep(next);
        if (next === totalRace - 1) setLostUpdates((l) => l + 1);
        return next;
      });
    }, delay);
    return () => {
      if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyRaceStep uses functional setState; rebind only on autoplay/step/delay/model
  }, [autoplay, raceStep, delay, model]);

  const startRace = () => {
    if (model !== 'thread') {
      setTone('ok');
      setNote('A race needs shared memory. Separate processes do not share a heap, so there is nothing to race on — switch to the thread model to trigger a lost update.');
      return;
    }
    setCounter(5);
    setT1Reg(null);
    setT2Reg(null);
    setRaceStep(0);
    applyRaceStep(0);
  };

  const spawnProcess = () => {
    setProcCount((c) => Math.min(c + 1, 4));
    setModel('process');
    setTone('ok');
    setNote('Spawned a process. The kernel allocates an ENTIRE new address space — fresh code, heap, stack and file-descriptor table — so this process is fully isolated. That duplication is why processes are heavier to create than threads.');
  };

  const spawnThread = () => {
    setThreadCount((c) => Math.min(c + 1, 5));
    setModel('thread');
    setTone('ok');
    setNote('Spawned a thread. It joins the existing process and gets only its OWN stack — the heap and file descriptors are shared. No new address space, so creation is cheap. The flip side: every thread can touch the same heap.');
  };

  const ctxSwitch = (kind) => {
    if (kind === 'process') {
      setLastSwitch({ kind: 'process', cost: PROC_SWITCH_COST, tlb: true });
      setTone('warn');
      setNote('Process context switch: the CPU must load a different page-table base and FLUSH the TLB, because the next process has a completely different address space. Caches go cold. This is the expensive switch — roughly an order of magnitude more than a thread switch.');
    } else {
      setLastSwitch({ kind: 'thread', cost: THREAD_SWITCH_COST, tlb: false });
      setTone('ok');
      setNote('Thread context switch (same process): only the registers and stack pointer change. The address space stays identical, so NO TLB flush and the cache stays warm. This is the cheap switch — that locality is a big reason threads are used for fine-grained concurrency.');
    }
  };

  const reset = () => {
    setAutoplay(false);
    if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; }
    setModel('process');
    setProcCount(2);
    setThreadCount(2);
    setCounter(5);
    setRaceStep(-1);
    setLostUpdates(0);
    setT1Reg(null);
    setT2Reg(null);
    setLastSwitch(null);
    setNote('Toggle between the process model (each owns a full, isolated address space) and the thread model (threads share one heap). Spawn either, then run the race or compare a context switch.');
    setTone('init');
  };

  const expected = 7; // two increments from 5 should land on 7
  const isThread = model === 'thread';
  const raceActive = raceStep >= 0;
  const curRace = raceActive && raceStep < totalRace ? RACE_STEPS[raceStep] : null;

  const narrTone = tone === 'warn' ? 'is-warn' : tone === 'ok' ? 'is-ok' : '';

  // ---- SVG geometry ----
  const W = 960;
  const H = 420;

  // process model: N isolated address-space boxes across the stage
  const procBoxW = 196;
  const procGap = 18;
  const procRows = useMemo(() => {
    const n = procCount;
    const totalW = n * procBoxW + (n - 1) * procGap;
    const startX = Math.max(24, (W - totalW) / 2);
    return Array.from({ length: n }, (_, i) => startX + i * (procBoxW + procGap));
  }, [procCount]);

  // thread model: one wide process box with shared heap + per-thread stacks
  const tProcX = 70;
  const tProcW = W - 140;

  return (
    <div className="pvt">
      <div className="pvt-head">
        <h3 className="pvt-title">Process vs thread — isolation versus a shared heap</h3>
        <p className="pvt-sub">
          A process owns its whole address space, so nothing leaks between processes. Threads share one process&apos;s
          heap, which makes them cheap to spawn and switch — but lets two of them race on the same memory and lose
          an update.
        </p>
      </div>

      <div className="pvt-controls">
        <div className="pvt-modes" role="group" aria-label="Memory model">
          <button
            type="button"
            className={`pvt-mode ${!isThread ? 'is-on' : ''}`}
            onClick={() => { setModel('process'); }}
            aria-pressed={!isThread}
          >
            <Box size={13} /> process model
          </button>
          <button
            type="button"
            className={`pvt-mode ${isThread ? 'is-on' : ''}`}
            onClick={() => { setModel('thread'); }}
            aria-pressed={isThread}
          >
            <Layers size={13} /> thread model
          </button>
        </div>

        <div className="pvt-buttons">
          <button type="button" className="pvt-btn" onClick={spawnProcess} disabled={procCount >= 4}>
            <Plus size={14} /> Spawn process
          </button>
          <button type="button" className="pvt-btn" onClick={spawnThread} disabled={threadCount >= 5}>
            <Plus size={14} /> Spawn thread
          </button>
          <button
            type="button"
            className={`pvt-btn pvt-btn-primary ${autoplay ? 'pvt-btn-on' : ''}`}
            onClick={() => {
              if (!isThread) { startRace(); return; }
              if (raceStep < 0 || raceDone) { startRace(); }
              setAutoplay((v) => !v);
            }}
            disabled={isThread && raceDone}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            Run race
          </button>
          <button type="button" className="pvt-btn" onClick={stepRace} disabled={!isThread || raceDone}>
            <GitBranch size={14} /> Step
          </button>
          <button type="button" className="pvt-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <label className="pvt-speed">
          <span className="pvt-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pvt-speed-range" aria-label="Race speed"
          />
          <span className="pvt-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>

      <div className="pvt-switch-row">
        <span className="pvt-switch-label">context switch:</span>
        <button type="button" className="pvt-switch-btn is-proc" onClick={() => ctxSwitch('process')}>
          <Cpu size={13} /> process switch <span className="pvt-switch-cost">~{PROC_SWITCH_COST}u · TLB flush</span>
        </button>
        <button type="button" className="pvt-switch-btn is-thread" onClick={() => ctxSwitch('thread')}>
          <Zap size={13} /> thread switch <span className="pvt-switch-cost">~{THREAD_SWITCH_COST}u · no flush</span>
        </button>
      </div>

      <div className="pvt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pvt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="pvt-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pvt-ah" />
            </marker>
          </defs>

          {!isThread && (
            <g>
              <text className="pvt-stage-title" x={W / 2} y={28} textAnchor="middle">
                {procCount} isolated processes — no shared memory between them
              </text>
              {procRows.map((px, i) => (
                <g key={`proc-${i}`}>
                  <rect className="pvt-proc" x={px} y={48} width={procBoxW} height={300} rx={12} />
                  <g transform={`translate(${px + 12}, ${62})`}>
                    <Box width={14} height={14} className="pvt-proc-ic" />
                  </g>
                  <text className="pvt-proc-label" x={px + 32} y={74} textAnchor="start">process {i + 1}</text>
                  <text className="pvt-proc-sub" x={px + procBoxW - 12} y={74} textAnchor="end">own address space</text>

                  {SEG_LABELS.map((seg, k) => {
                    const sy = 92 + k * 58;
                    return (
                      <g key={seg}>
                        <rect className={`pvt-seg is-${seg}`} x={px + 14} y={sy} width={procBoxW - 28} height={46} rx={7} />
                        <text className="pvt-seg-label" x={px + 24} y={sy + 19} textAnchor="start">{seg}</text>
                        <text className="pvt-seg-sub" x={px + 24} y={sy + 35} textAnchor="start">
                          {seg === 'heap' ? 'private 0x…' : seg === 'fds' ? 'own table' : seg === 'stack' ? 'per process' : 'read-only'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ))}

              {/* isolation barriers between processes */}
              {procRows.slice(0, -1).map((px, i) => (
                <g key={`bar-${i}`}>
                  <line className="pvt-barrier" x1={px + procBoxW + procGap / 2} y1={60} x2={px + procBoxW + procGap / 2} y2={336} />
                  <g transform={`translate(${px + procBoxW + procGap / 2 - 6}, ${H / 2 - 6})`}>
                    <Lock width={12} height={12} className="pvt-barrier-ic" />
                  </g>
                </g>
              ))}
            </g>
          )}

          {isThread && (
            <g>
              <text className="pvt-stage-title" x={W / 2} y={28} textAnchor="middle">
                one process · {threadCount} threads share the heap &amp; file descriptors
              </text>
              <rect className="pvt-tproc" x={tProcX} y={48} width={tProcW} height={300} rx={12} />
              <g transform={`translate(${tProcX + 12}, ${62})`}>
                <Box width={14} height={14} className="pvt-proc-ic" />
              </g>
              <text className="pvt-proc-label" x={tProcX + 32} y={74} textAnchor="start">process (shared address space)</text>

              {/* shared heap holding the contended counter */}
              <rect className={`pvt-shared is-heap ${curRace && curRace.op === 'write' ? 'is-touched' : ''}`} x={tProcX + 16} y={96} width={tProcW - 32} height={72} rx={9} />
              <g transform={`translate(${tProcX + 28}, ${112})`}>
                <Share2 width={13} height={13} className="pvt-shared-ic" />
              </g>
              <text className="pvt-shared-label" x={tProcX + 48} y={123} textAnchor="start">shared heap</text>
              <text className="pvt-shared-sub" x={tProcX + 48} y={138} textAnchor="start">every thread can read &amp; write this memory</text>
              <g>
                <rect className={`pvt-counter ${raceDone ? 'is-lost' : ''}`} x={tProcX + tProcW - 156} y={108} width={140} height={48} rx={8} />
                <text className="pvt-counter-label" x={tProcX + tProcW - 146} y={124} textAnchor="start">counter</text>
                <text className={`pvt-counter-val ${raceDone ? 'is-lost' : ''}`} x={tProcX + tProcW - 28} y={142} textAnchor="end">{counter}</text>
              </g>

              {/* shared fds strip */}
              <rect className="pvt-shared is-fds" x={tProcX + 16} y={178} width={tProcW - 32} height={34} rx={8} />
              <text className="pvt-shared-label" x={tProcX + 28} y={199} textAnchor="start">shared file descriptors</text>
              <text className="pvt-shared-sub" x={tProcX + tProcW - 28} y={199} textAnchor="end">one open-file table for all threads</text>

              {/* per-thread stacks */}
              {Array.from({ length: threadCount }, (_, i) => {
                const n = threadCount;
                const stackW = (tProcW - 48 - (n - 1) * 14) / n;
                const sx = tProcX + 24 + i * (stackW + 14);
                const isT1 = i === 0;
                const isT2 = i === 1;
                const active = curRace && ((curRace.who === 't1' && isT1) || (curRace.who === 't2' && isT2));
                const reg = isT1 ? t1Reg : isT2 ? t2Reg : null;
                return (
                  <g key={`th-${i}`}>
                    <rect className={`pvt-stack ${active ? 'is-active' : ''}`} x={sx} y={228} width={stackW} height={104} rx={8} />
                    <g transform={`translate(${sx + 10}, ${244})`}>
                      <Layers width={12} height={12} className="pvt-stack-ic" />
                    </g>
                    <text className="pvt-stack-label" x={sx + 28} y={254} textAnchor="start">T{i + 1}</text>
                    <text className="pvt-stack-sub" x={sx + 10} y={278} textAnchor="start">own stack</text>
                    {reg !== null && (isT1 || isT2) && (
                      <text className={`pvt-stack-reg ${active ? 'is-active' : ''}`} x={sx + 10} y={304} textAnchor="start">
                        reg = {reg}
                      </text>
                    )}
                    {/* link from thread up into the shared heap */}
                    {(isT1 || isT2) && (
                      <line
                        className={`pvt-link ${active ? 'is-active' : ''}`}
                        x1={sx + stackW / 2} y1={228}
                        x2={sx + stackW / 2} y2={212}
                        markerEnd="url(#pvt-arr)"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* outcome banner for the race */}
          {isThread && raceDone && (
            <g>
              <rect className="pvt-banner is-bad" x={tProcX} y={H - 40} width={tProcW} height={32} rx={8} />
              <g transform={`translate(${tProcX + 14}, ${H - 32})`}>
                <AlertTriangle width={16} height={16} className="pvt-banner-ic is-bad" />
              </g>
              <text className="pvt-banner-text is-bad" x={tProcX + 38} y={H - 19} textAnchor="start">
                two increments, expected {expected}, counter shows {counter} — one update was lost to the data race
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="pvt-metrics">
        <div className="pvt-metric">
          <span className="pvt-metric-label">processes</span>
          <span className="pvt-metric-value">{procCount}</span>
        </div>
        <div className="pvt-metric">
          <span className="pvt-metric-label">threads</span>
          <span className="pvt-metric-value">{threadCount}</span>
        </div>
        <div className="pvt-metric">
          <span className="pvt-metric-label">shared counter</span>
          <span className={`pvt-metric-value ${raceDone ? 'is-warn' : ''}`}>{counter}</span>
        </div>
        <div className="pvt-metric">
          <span className="pvt-metric-label">expected</span>
          <span className="pvt-metric-value is-ok">{expected}</span>
        </div>
        <div className="pvt-metric">
          <span className="pvt-metric-label">lost updates</span>
          <span className={`pvt-metric-value ${lostUpdates > 0 ? 'is-warn' : ''}`}>{lostUpdates}</span>
        </div>
        <div className="pvt-metric pvt-metric-dim">
          <span className="pvt-metric-label">last switch cost</span>
          <span className={`pvt-metric-value ${lastSwitch ? (lastSwitch.kind === 'process' ? 'is-warn' : 'is-ok') : ''}`}>
            {lastSwitch ? `~${lastSwitch.cost}u ${lastSwitch.kind === 'process' ? '(TLB flush)' : '(no flush)'}` : '—'}
          </span>
        </div>
      </div>

      <div className={`pvt-narration ${narrTone}`}>
        <span className={`pvt-narration-label ${narrTone}`}>
          {tone === 'warn' ? 'race' : tone === 'ok' ? 'note' : 'ready'}
        </span>
        <span className="pvt-narration-body">{note}</span>
      </div>

      <div className="pvt-legend">
        <span className="pvt-legend-item"><Box size={13} className="pvt-ic is-proc" /> process — full address space, fully isolated</span>
        <span className="pvt-legend-item"><Layers size={13} className="pvt-ic is-thread" /> thread — own stack only, shares the heap</span>
        <span className="pvt-legend-item"><Share2 size={13} className="pvt-ic is-shared" /> shared heap — where threads can race</span>
        <span className="pvt-legend-item"><Lock size={13} className="pvt-ic is-proc" /> isolation barrier — processes can&apos;t touch each other</span>
        <span className="pvt-legend-item"><AlertTriangle size={13} className="pvt-ic is-warn" /> lost update — two writes collapse into one</span>
        <span className="pvt-legend-item"><Check size={13} className="pvt-ic is-ok" /> thread switch — no TLB flush, cache stays warm</span>
      </div>
    </div>
  );
}
