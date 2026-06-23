import React, { useMemo, useState } from 'react';
import { Inbox, Send, ArrowDownUp, Plus, ArrowRightFromLine, RotateCcw } from 'lucide-react';
import './QueueUsingStacksViz.css';

// A FIFO queue built from two LIFO stacks.
//
// inbox  — every enqueue pushes here (newest on top).
// outbox — every dequeue pops here (oldest on top).
// When dequeue is called and outbox is empty, we DRAIN inbox into outbox,
// popping each element off inbox and pushing onto outbox. That single reversal
// flips newest-on-top into oldest-on-top, so the front of the queue surfaces.
// Each element is moved at most twice (in, then transfer), so dequeue is
// amortized O(1) even though one transfer pass is O(n).

// Deterministic value generator — a fixed cycle, never Math.random.
const SEED_VALUES = [10, 23, 47, 8, 31, 19, 64, 5, 42, 17];

function freshState() {
  return {
    inbox: [],
    outbox: [],
    nextIdx: 0,
    transferring: false,
    enqueues: 0,
    dequeues: 0,
    transfers: 0,
    moves: 0,
    note: 'Empty queue. Enqueue pushes onto inbox; dequeue pops from outbox, draining inbox first if needed.',
    last: null, // 'enqueue' | 'dequeue' | 'transfer'
  };
}

export default function QueueUsingStacksViz() {
  const [st, setSt] = useState(freshState);

  const front = useMemo(() => {
    if (st.outbox.length) return st.outbox[st.outbox.length - 1];
    if (st.inbox.length) return st.inbox[0];
    return null;
  }, [st.inbox, st.outbox]);

  const size = st.inbox.length + st.outbox.length;

  const enqueue = () => {
    setSt((s) => {
      const v = SEED_VALUES[s.nextIdx % SEED_VALUES.length];
      return {
        ...s,
        inbox: [...s.inbox, v],
        nextIdx: s.nextIdx + 1,
        enqueues: s.enqueues + 1,
        transferring: false,
        last: 'enqueue',
        note: `Enqueue ${v}: push onto inbox (top). Inbox holds ${s.inbox.length + 1} item${s.inbox.length === 0 ? '' : 's'}, newest on top.`,
      };
    });
  };

  const dequeue = () => {
    setSt((s) => {
      if (!s.inbox.length && !s.outbox.length) {
        return { ...s, last: null, transferring: false, note: 'Queue is empty — nothing to dequeue.' };
      }
      // outbox has items: pop directly, O(1).
      if (s.outbox.length) {
        const out = s.outbox.slice();
        const v = out.pop();
        return {
          ...s,
          outbox: out,
          dequeues: s.dequeues + 1,
          transferring: false,
          last: 'dequeue',
          note: `Dequeue ${v}: outbox top is the oldest element — pop it directly in O(1). No transfer needed.`,
        };
      }
      // outbox empty: drain inbox -> outbox (reverse), then pop.
      const moved = s.inbox.length;
      const newOutbox = s.inbox.slice().reverse();
      const v = newOutbox.pop();
      return {
        ...s,
        inbox: [],
        outbox: newOutbox,
        dequeues: s.dequeues + 1,
        transfers: s.transfers + 1,
        moves: s.moves + moved,
        transferring: true,
        last: 'transfer',
        note: `Outbox empty — drain all ${moved} inbox item${moved === 1 ? '' : 's'} into outbox (reversing order), then pop the oldest: ${v}. Each item moves at most twice, giving amortized O(1).`,
      };
    });
  };

  const reset = () => setSt(freshState());

  // SVG geometry — two vertical stacks side by side.
  const W = 940;
  const H = 420;
  const colTop = 64;
  const slotH = 42;
  const slotGap = 8;
  const maxSlots = 7;
  const cellW = 150;
  const inboxX = 150;
  const outboxX = W - 150 - cellW;
  const floorY = colTop + maxSlots * (slotH + slotGap) + 8;

  // inbox drawn bottom-up: index 0 (oldest) at the floor, newest on top.
  const renderStack = (items, x, hueVar, topLabel) => {
    const shown = items.slice(-maxSlots);
    const overflow = items.length - shown.length;
    return (
      <g>
        {shown.map((v, i) => {
          // i=0 is the bottom-most of the shown slice.
          const fromBottom = i;
          const y = floorY - (fromBottom + 1) * (slotH + slotGap) + slotGap;
          const isTop = i === shown.length - 1;
          return (
            <g key={`${x}-${i}-${v}`}>
              <rect
                className={`qus-slot ${isTop ? 'is-top' : ''}`}
                x={x}
                y={y}
                width={cellW}
                height={slotH}
                rx={8}
                style={{ stroke: hueVar }}
              />
              <rect x={x} y={y} width={5} height={slotH} rx={2.5} fill={hueVar} />
              <text className="qus-slot-val" x={x + cellW / 2} y={y + slotH / 2 + 6} style={{ fill: hueVar }}>
                {v}
              </text>
              {isTop && (
                <text className="qus-slot-tag" x={x + cellW - 8} y={y + slotH / 2 + 5}>
                  top
                </text>
              )}
            </g>
          );
        })}
        {overflow > 0 && (
          <text className="qus-overflow" x={x + cellW / 2} y={colTop - 8}>
            +{overflow} more below
          </text>
        )}
        <line className="qus-floor" x1={x - 6} y1={floorY + 2} x2={x + cellW + 6} y2={floorY + 2} />
        <text className="qus-stack-label" x={x + cellW / 2} y={floorY + 24}>
          {topLabel}
        </text>
      </g>
    );
  };

  return (
    <div className="qus">
      <div className="qus-head">
        <h3 className="qus-title">Queue from two stacks — FIFO out of two LIFO containers</h3>
        <p className="qus-sub">
          Enqueue pushes onto the inbox; dequeue pops the outbox, draining the inbox into it (reversing order) only
          when the outbox runs dry. The reversal is what turns last-in into first-out.
        </p>
      </div>

      <div className="qus-controls">
        <button type="button" className="qus-btn qus-btn-primary" onClick={enqueue}>
          <Plus size={14} /> Enqueue
        </button>
        <button
          type="button"
          className="qus-btn"
          onClick={dequeue}
          disabled={size === 0}
        >
          <ArrowRightFromLine size={14} /> Dequeue
        </button>
        <button type="button" className="qus-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
        <span className="qus-spacer" aria-hidden="true" />
        <span className="qus-size">size {size}</span>
      </div>

      <div className="qus-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="qus-svg" preserveAspectRatio="xMidYMid meet">
          {/* inbox header */}
          <g transform={`translate(${inboxX}, ${colTop - 40})`}>
            <Inbox width={16} height={16} className="qus-ic" style={{ color: 'var(--hue-sky)' }} />
          </g>
          <text className="qus-col-title" x={inboxX + 24} y={colTop - 27} style={{ fill: 'var(--hue-sky)' }}>
            inbox
          </text>
          <text className="qus-col-sub" x={inboxX + cellW} y={colTop - 27}>
            push enqueues here
          </text>

          {/* outbox header */}
          <g transform={`translate(${outboxX}, ${colTop - 40})`}>
            <Send width={16} height={16} className="qus-ic" style={{ color: 'var(--hue-mint)' }} />
          </g>
          <text className="qus-col-title" x={outboxX + 24} y={colTop - 27} style={{ fill: 'var(--hue-mint)' }}>
            outbox
          </text>
          <text className="qus-col-sub" x={outboxX + cellW} y={colTop - 27}>
            pop dequeues here
          </text>

          {/* transfer arrow between the two stacks */}
          <g
            transform={`translate(${(inboxX + cellW + outboxX) / 2}, ${colTop + (floorY - colTop) / 2 - 12})`}
            className={st.transferring ? 'qus-xfer is-active' : 'qus-xfer'}
          >
            <ArrowDownUp width={26} height={26} />
          </g>
          <text
            className={`qus-xfer-label ${st.transferring ? 'is-active' : ''}`}
            x={(inboxX + cellW + outboxX) / 2 + 13}
            y={colTop + (floorY - colTop) / 2 + 26}
          >
            drain + reverse
          </text>

          {renderStack(st.inbox, inboxX, 'var(--hue-sky)', 'LIFO · newest on top')}
          {renderStack(st.outbox, outboxX, 'var(--hue-mint)', 'LIFO · oldest on top')}
        </svg>
      </div>

      <div className="qus-metrics">
        <div className="qus-metric">
          <span className="qus-metric-label">front of queue</span>
          <span className="qus-metric-value is-mint">{front == null ? '—' : front}</span>
        </div>
        <div className="qus-metric">
          <span className="qus-metric-label">inbox / outbox</span>
          <span className="qus-metric-value is-sky">{st.inbox.length} / {st.outbox.length}</span>
        </div>
        <div className="qus-metric">
          <span className="qus-metric-label">enqueues</span>
          <span className="qus-metric-value">{st.enqueues}</span>
        </div>
        <div className="qus-metric">
          <span className="qus-metric-label">dequeues</span>
          <span className="qus-metric-value">{st.dequeues}</span>
        </div>
        <div className="qus-metric">
          <span className="qus-metric-label">transfers · total moves</span>
          <span className="qus-metric-value is-warn">{st.transfers} · {st.moves}</span>
        </div>
      </div>

      <div className="qus-step-note">
        <span className="qus-step-note-label">now</span>
        <span className="qus-step-note-body">{st.note}</span>
      </div>

      <div className="qus-narration">
        <span className="qus-narration-label">why it matters</span>
        <span className="qus-narration-body">
          A single transfer is O(n), so one dequeue can look slow — but every element is pushed onto inbox once and
          moved to outbox at most once, so over any sequence of operations the cost averages to O(1) per call. This
          amortized argument is the whole point of the two-stack queue: you pay for the reversal in bulk, then enjoy
          cheap pops until the outbox empties again.
        </span>
      </div>
    </div>
  );
}
