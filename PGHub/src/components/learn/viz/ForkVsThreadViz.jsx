import React, { useMemo, useState } from 'react';
import { GitFork, Layers, RotateCcw, Cpu } from 'lucide-react';
import './ForkVsThreadViz.css';

// fork() vs pthread — separate vs shared address space.
//
// fork(): the child gets a COPY of the parent's entire address space and a new
// PID. Pages are copy-on-write: parent and child share physical pages read-only
// until one writes, which triggers a page split so each has its own copy. A write
// in the child is INVISIBLE to the parent — separate memory.
//
// pthread_create(): the new thread shares the SAME address space (same heap, same
// globals, same PID) and only gets its own STACK + registers. A write to a shared
// variable is seen by every thread — which is exactly why threads need locks
// (the race).
//
// This viz lets the reader pick a model, then perform a write to the shared
// counter `x` and watch what each side sees: forked child diverges (COW split),
// threads see one shared value (race-prone). Live readout shows the address-space
// layout and the post-write value each side observes.

const INITIAL_X = 5;

export default function ForkVsThreadViz() {
  const [model, setModel] = useState('fork'); // fork | thread
  const [written, setWritten] = useState(false);
  const [writer, setWriter] = useState('child'); // who performs x = 99

  const NEW_VAL = 99;

  const view = useMemo(() => {
    if (model === 'fork') {
      // separate address spaces after a write (COW split)
      const parentX = written && writer === 'parent' ? NEW_VAL : INITIAL_X;
      const childX = written && writer === 'child' ? NEW_VAL : INITIAL_X;
      return {
        parentX,
        childX,
        shared: written ? false : true, // before write, COW shares page read-only
        layout: 'two address spaces (COW)',
        pidA: 4021,
        pidB: 4088,
        seenNote: written
          ? `${writer === 'child' ? 'child' : 'parent'} wrote x=${NEW_VAL}; COW split the page. parent sees x=${parentX}, child sees x=${childX} — the change does NOT cross.`
          : 'before any write, parent and child share the same physical page read-only (copy-on-write). Both read x=5.',
      };
    }
    // threads share one address space
    const sharedX = written ? NEW_VAL : INITIAL_X;
    return {
      parentX: sharedX,
      childX: sharedX,
      shared: true,
      layout: 'one shared address space',
      pidA: 4021,
      pidB: 4021,
      seenNote: written
        ? `${writer === 'child' ? 'thread B' : 'thread A'} wrote x=${NEW_VAL} to the shared heap; BOTH threads now read x=${NEW_VAL}. With no lock this is a data race.`
        : 'both threads point at the same heap variable x=5. Only their stacks are private.',
    };
  }, [model, written, writer]);

  const isThread = model === 'thread';
  const labelA = isThread ? 'thread A' : 'parent';
  const labelB = isThread ? 'thread B' : 'child';

  const W = 940;
  const H = 380;

  // Two process/thread columns + the heap.
  const boxW = 250;
  const ax = 70;
  const bx = W - 70 - boxW;
  const boxTop = 70;
  const boxH = 250;

  // shared heap region (center for threads) / two heaps (fork)
  const reset = () => { setWritten(false); };

  return (
    <div className="fvt">
      <div className="fvt-head">
        <h3 className="fvt-title">fork() vs pthread — separate vs shared address space</h3>
        <p className="fvt-sub">
          fork gives the child its own copy-on-write memory and a new PID; a pthread shares the heap and PID,
          getting only a private stack. Write to x and watch what each side sees.
        </p>
      </div>

      <div className="fvt-controls">
        <div className="fvt-modes" role="group" aria-label="concurrency model">
          <span className="fvt-input-label">model</span>
          <button type="button" className={`fvt-chip ${model === 'fork' ? 'is-on' : ''}`} onClick={() => { setModel('fork'); setWritten(false); }}>
            <GitFork size={13} /> fork()
          </button>
          <button type="button" className={`fvt-chip ${model === 'thread' ? 'is-on' : ''}`} onClick={() => { setModel('thread'); setWritten(false); }}>
            <Layers size={13} /> pthread
          </button>
        </div>

        <div className="fvt-modes" role="group" aria-label="writer">
          <span className="fvt-input-label">writer</span>
          <button type="button" className={`fvt-chip ${writer === 'parent' ? 'is-on' : ''}`} onClick={() => { setWriter('parent'); setWritten(false); }}>
            {labelA}
          </button>
          <button type="button" className={`fvt-chip ${writer === 'child' ? 'is-on' : ''}`} onClick={() => { setWriter('child'); setWritten(false); }}>
            {labelB}
          </button>
        </div>

        <span className="fvt-spacer" aria-hidden="true" />

        <div className="fvt-buttons">
          <button type="button" className="fvt-btn fvt-btn-primary" onClick={() => setWritten(true)} disabled={written}>
            <Cpu size={14} /> {writer === 'parent' ? labelA : labelB}: x = {NEW_VAL}
          </button>
          <button type="button" className="fvt-btn" onClick={reset} disabled={!written}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="fvt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fvt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="fvt-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {/* two side boxes */}
          {[{ x: ax, label: labelA, pid: view.pidA, xval: view.parentX, side: 'a' },
            { x: bx, label: labelB, pid: view.pidB, xval: view.childX, side: 'b' }].map((col) => {
            const writerSide = (col.side === 'a' && writer === 'parent') || (col.side === 'b' && writer === 'child');
            return (
              <g key={col.side}>
                <rect x={col.x} y={boxTop} width={boxW} height={boxH} rx={10} className={`fvt-procbox ${writerSide && written ? 'is-writer' : ''}`} />
                <text x={col.x + 14} y={boxTop + 24} className="fvt-proc-name">{col.label}</text>
                <text x={col.x + boxW - 14} y={boxTop + 24} className="fvt-proc-pid" textAnchor="end">PID {col.pid}</text>

                {/* stack (always private) */}
                <rect x={col.x + 18} y={boxTop + 42} width={boxW - 36} height={48} rx={7} className="fvt-mem fvt-mem-stack" />
                <text x={col.x + 30} y={boxTop + 64} className="fvt-mem-label">stack (private)</text>
                <text x={col.x + 30} y={boxTop + 80} className="fvt-mem-sub">local regs · frames</text>

                {/* heap — fork: each its own (with own x); thread: pointer into shared heap */}
                {model === 'fork' ? (
                  <>
                    <rect x={col.x + 18} y={boxTop + 100} width={boxW - 36} height={66} rx={7} className={`fvt-mem fvt-mem-heap ${written && !view.shared ? 'is-split' : 'is-cow'}`} />
                    <text x={col.x + 30} y={boxTop + 122} className="fvt-mem-label">heap {written ? '(own copy)' : '(COW shared)'}</text>
                    <text x={col.x + 30} y={boxTop + 146} className="fvt-mem-x">x = {col.xval}</text>
                  </>
                ) : (
                  <>
                    <rect x={col.x + 18} y={boxTop + 100} width={boxW - 36} height={66} rx={7} className="fvt-mem fvt-mem-heapref" />
                    <text x={col.x + 30} y={boxTop + 122} className="fvt-mem-label">heap ref -&gt; shared</text>
                    <text x={col.x + 30} y={boxTop + 146} className="fvt-mem-x">reads x = {col.xval}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* center: shared heap for threads, or COW link for fork */}
          {model === 'thread' ? (
            <g>
              <rect x={W / 2 - 90} y={H - 78} width={180} height={56} rx={9} className="fvt-shared" />
              <text x={W / 2} y={H - 56} className="fvt-shared-label" textAnchor="middle">shared heap</text>
              <text x={W / 2} y={H - 36} className={`fvt-shared-x ${written ? 'is-changed' : ''}`} textAnchor="middle">x = {view.parentX}</text>
              <line x1={ax + boxW / 2} y1={boxTop + boxH} x2={W / 2 - 60} y2={H - 78} className="fvt-link" markerEnd="url(#fvt-arrow)" />
              <line x1={bx + boxW / 2} y1={boxTop + boxH} x2={W / 2 + 60} y2={H - 78} className="fvt-link" markerEnd="url(#fvt-arrow)" />
            </g>
          ) : (
            <g>
              {!written ? (
                <>
                  <line x1={ax + boxW} y1={boxTop + 133} x2={bx} y2={boxTop + 133} className="fvt-cowlink" />
                  <text x={W / 2} y={boxTop + 126} className="fvt-cow-tag" textAnchor="middle">shared page (read-only, COW)</text>
                </>
              ) : (
                <text x={W / 2} y={boxTop + 133} className="fvt-split-tag" textAnchor="middle">page split — independent copies</text>
              )}
            </g>
          )}
        </svg>
      </div>

      <div className="fvt-metrics">
        <div className="fvt-metric">
          <span className="fvt-metric-label">layout</span>
          <span className="fvt-metric-value">{view.layout}</span>
        </div>
        <div className="fvt-metric">
          <span className="fvt-metric-label">{labelA} PID / sees x</span>
          <span className="fvt-metric-value">{view.pidA} · {view.parentX}</span>
        </div>
        <div className="fvt-metric">
          <span className="fvt-metric-label">{labelB} PID / sees x</span>
          <span className="fvt-metric-value">{view.pidB} · {view.childX}</span>
        </div>
        <div className="fvt-metric">
          <span className="fvt-metric-label">heap</span>
          <span className="fvt-metric-value">{view.shared ? 'shared' : 'separate'}</span>
        </div>
      </div>

      <div className="fvt-caption">
        <span className="fvt-caption-label">trace</span>
        <span className="fvt-caption-body">{view.seenNote}</span>
      </div>
    </div>
  );
}
