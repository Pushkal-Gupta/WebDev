import React, { useState } from 'react';
import { RotateCcw, ChevronRight, Repeat, ListOrdered } from 'lucide-react';
import './IteratorIterableViz.css';

const SOURCE = [10, 20, 30, 40];

function Cursor({ pos, color }) {
  if (pos == null) return null;
  return (
    <div className="iiv-cursors">
      {SOURCE.map((_, i) => (
        <span key={i} className="iiv-cursor-slot">
          {pos === i ? <ChevronRight size={16} style={{ color }} /> : null}
        </span>
      ))}
      <span className="iiv-cursor-slot">{pos >= SOURCE.length ? <span className="iiv-stop" style={{ color }}>stop</span> : null}</span>
    </div>
  );
}

export default function IteratorIterableViz() {
  // Two independent cursors over the SAME iterable to show fresh-iterator semantics.
  const [cursorA, setCursorA] = useState(0); // index of next value to yield, or SOURCE.length = exhausted
  const [cursorB, setCursorB] = useState(null); // null = not yet created
  const [logA, setLogA] = useState([]);
  const [logB, setLogB] = useState([]);

  const nextA = () => {
    if (cursorA >= SOURCE.length) { setLogA((l) => [...l, 'StopIteration']); return; }
    setLogA((l) => [...l, String(SOURCE[cursorA])]);
    setCursorA((c) => c + 1);
  };
  const makeB = () => { setCursorB(0); setLogB([]); };
  const nextB = () => {
    if (cursorB == null) return;
    if (cursorB >= SOURCE.length) { setLogB((l) => [...l, 'StopIteration']); return; }
    setLogB((l) => [...l, String(SOURCE[cursorB])]);
    setCursorB((c) => c + 1);
  };
  const reset = () => { setCursorA(0); setCursorB(null); setLogA([]); setLogB([]); };

  const aExhausted = cursorA >= SOURCE.length;

  return (
    <div className="iiv">
      <div className="iiv-head">
        <h3 className="iiv-title">Iterable vs iterator — one source, independent cursors</h3>
        <p className="iiv-sub">
          The iterable <code>[10, 20, 30, 40]</code> can hand out many iterators. Each iterator is a stateful
          cursor: calling <code>next()</code> consumes one value and never rewinds.
        </p>
      </div>

      <div className="iiv-source">
        <span className="iiv-source-tag"><ListOrdered size={13} /> iterable (the list — stateless, reusable)</span>
        <div className="iiv-source-row">
          {SOURCE.map((v, i) => (
            <div key={i} className="iiv-cell">{v}</div>
          ))}
        </div>
      </div>

      <div className="iiv-grid">
        <div className="iiv-panel">
          <div className="iiv-panel-head">
            <span className="iiv-panel-title">iterator A = iter(list)</span>
            <span className={`iiv-badge ${aExhausted ? 'iiv-badge-dead' : 'iiv-badge-live'}`}>{aExhausted ? 'exhausted' : 'live'}</span>
          </div>
          <Cursor pos={cursorA} color="var(--hue-sky)" />
          <button type="button" className="iiv-btn" onClick={nextA}>
            <ChevronRight size={14} /> next(A)
          </button>
          <div className="iiv-log">
            {logA.length === 0 ? <span className="iiv-log-empty">no calls yet</span>
              : logA.map((v, i) => <span key={i} className={`iiv-tok ${v === 'StopIteration' ? 'iiv-tok-stop' : ''}`}>{v}</span>)}
          </div>
          {aExhausted && <p className="iiv-warn">Re-calling next(A) keeps raising StopIteration — the cursor is spent. This is the classic &ldquo;for loop ran zero times&rdquo; bug.</p>}
        </div>

        <div className="iiv-panel">
          <div className="iiv-panel-head">
            <span className="iiv-panel-title">iterator B = iter(list)</span>
            <span className={`iiv-badge ${cursorB == null ? 'iiv-badge-idle' : (cursorB >= SOURCE.length ? 'iiv-badge-dead' : 'iiv-badge-live')}`}>
              {cursorB == null ? 'not created' : (cursorB >= SOURCE.length ? 'exhausted' : 'live')}
            </span>
          </div>
          <Cursor pos={cursorB} color="var(--hue-mint)" />
          {cursorB == null
            ? <button type="button" className="iiv-btn iiv-btn-primary" onClick={makeB}><Repeat size={14} /> iter(list) — fresh cursor</button>
            : <button type="button" className="iiv-btn" onClick={nextB}><ChevronRight size={14} /> next(B)</button>}
          <div className="iiv-log">
            {cursorB == null ? <span className="iiv-log-empty">call iter(list) to get a new cursor</span>
              : logB.length === 0 ? <span className="iiv-log-empty">no calls yet</span>
              : logB.map((v, i) => <span key={i} className={`iiv-tok ${v === 'StopIteration' ? 'iiv-tok-stop' : ''}`}>{v}</span>)}
          </div>
          {cursorB != null && <p className="iiv-warn iiv-warn-ok">B starts at 10 again — the iterable produced an independent cursor. Generators differ: re-running a spent generator yields nothing.</p>}
        </div>
      </div>

      <div className="iiv-controls">
        <button type="button" className="iiv-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        <span className="iiv-hint">Drain A to StopIteration, then create B to see the iterable hand out a brand-new cursor.</span>
      </div>
    </div>
  );
}
