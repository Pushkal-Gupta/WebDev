import React, { useMemo, useState } from 'react';
import { Radio, Send, Plus, X, Inbox, AlertTriangle, RotateCcw } from 'lucide-react';
import './EventBusViz.css';

// Publish/subscribe event bus. Publishers emit TYPED events onto a topic; the
// bus fans them out to whichever subscribers registered for that topic. The
// publisher never names a subscriber — that is the whole point of the pattern.
// An event published to a topic with zero live subscribers falls into the
// dead-letter region instead of vanishing.

const TOPICS = [
  { id: 'OrderPlaced', accent: 'var(--hue-sky)' },
  { id: 'PaymentReceived', accent: 'var(--hue-mint)' },
  { id: 'UserSignedup', accent: 'var(--hue-pink)' },
];

const TOPIC_ACCENT = Object.fromEntries(TOPICS.map((t) => [t.id, t.accent]));

// Fixed roster of subscribers, each bound to one topic. Toggled on/off live.
const ROSTER = [
  { id: 'EmailService', topic: 'OrderPlaced' },
  { id: 'Warehouse', topic: 'OrderPlaced' },
  { id: 'Ledger', topic: 'PaymentReceived' },
  { id: 'Analytics', topic: 'PaymentReceived' },
  { id: 'WelcomeMailer', topic: 'UserSignedup' },
  { id: 'CrmSync', topic: 'UserSignedup' },
];

// Deterministic, repeatable publish script (one event id per click), so a
// "publish OrderPlaced" always produces the same payload — no Math.random.
const SAMPLE_PAYLOADS = {
  OrderPlaced: ['#A1042', '#A1043', '#A1044', '#A1045'],
  PaymentReceived: ['$59.00', '$12.50', '$240.00', '$8.99'],
  UserSignedup: ['ada@x.io', 'lin@x.io', 'rey@x.io', 'mo@x.io'],
};

export default function EventBusViz() {
  // subscribers that are currently live (subscribed to the bus)
  const [live, setLive] = useState(() => new Set(['EmailService', 'Ledger', 'WelcomeMailer']));
  // delivery mode
  const [mode, setMode] = useState('sync'); // 'sync' | 'async'
  // per-subscriber delivery counters
  const [deliveries, setDeliveries] = useState(() => Object.fromEntries(ROSTER.map((s) => [s.id, 0])));
  const [deadLetters, setDeadLetters] = useState(0);
  // monotonic per-topic publish counter, drives deterministic payload pick
  const [seq, setSeq] = useState(() => ({ OrderPlaced: 0, PaymentReceived: 0, UserSignedup: 0 }));
  // async queue of pending events waiting to be drained
  const [queue, setQueue] = useState([]);
  // ids highlighted on the last publish (for edge/subscriber flash)
  const [flash, setFlash] = useState({ topic: null, targets: [], dead: false, payload: null });
  const [eventId, setEventId] = useState(0);
  const [note, setNote] = useState('A publisher emits to a TOPIC, never to a subscriber. Toggle subscribers, then publish — watch the bus route by topic. Topics with no live subscriber land in the dead-letter box.');

  // routing table: topic -> live subscriber ids (derived)
  const routing = useMemo(() => {
    const map = Object.fromEntries(TOPICS.map((t) => [t.id, []]));
    ROSTER.forEach((s) => {
      if (live.has(s.id)) map[s.topic].push(s.id);
    });
    return map;
  }, [live]);

  const liveCount = live.size;
  const totalDelivered = useMemo(
    () => Object.values(deliveries).reduce((a, b) => a + b, 0),
    [deliveries],
  );

  const toggleSub = (id) => {
    setLive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    const sub = ROSTER.find((s) => s.id === id);
    setNote(
      live.has(id)
        ? `${id} unsubscribed from ${sub.topic}. The bus simply stops routing to it — publishers are unaffected and never knew it existed.`
        : `${id} subscribed to ${sub.topic}. Future ${sub.topic} events now fan out to it. The publisher's code does not change.`,
    );
  };

  // deliver an event to its live subscribers (or dead-letter), updating counters
  const fanOut = (topic, payload) => {
    const targets = routing[topic];
    if (targets.length === 0) {
      setDeadLetters((d) => d + 1);
      setFlash({ topic, targets: [], dead: true, payload });
      setNote(`Published ${topic} ${payload}, but no live subscriber is bound to ${topic}. The event is NOT lost — the bus routes it to the dead-letter box for later inspection.`);
      return;
    }
    setDeliveries((prev) => {
      const next = { ...prev };
      targets.forEach((t) => { next[t] += 1; });
      return next;
    });
    setFlash({ topic, targets, dead: false, payload });
    setNote(`Published ${topic} ${payload}. The bus matched the topic and fanned out to ${targets.length} subscriber${targets.length > 1 ? 's' : ''}: ${targets.join(', ')}. ${mode === 'sync' ? 'Sync delivery: each handler ran inline before publish returned.' : 'Async delivery: drained from the queue, decoupled from the publisher.'}`);
  };

  const publish = (topic) => {
    const idx = seq[topic] % SAMPLE_PAYLOADS[topic].length;
    const payload = SAMPLE_PAYLOADS[topic][idx];
    setSeq((prev) => ({ ...prev, [topic]: prev[topic] + 1 }));
    setEventId((e) => e + 1);
    if (mode === 'async') {
      const id = eventId + 1;
      setQueue((q) => [...q, { id, topic, payload }]);
      setFlash({ topic, targets: [], dead: false, payload });
      setNote(`Queued ${topic} ${payload}. Async mode: publish returns immediately and the bus delivers later. Drain the queue to fan out.`);
      return;
    }
    fanOut(topic, payload);
  };

  const drainOne = () => {
    if (queue.length === 0) return;
    const [head, ...rest] = queue;
    setQueue(rest);
    fanOut(head.topic, head.payload);
  };

  const reset = () => {
    setLive(new Set(['EmailService', 'Ledger', 'WelcomeMailer']));
    setMode('sync');
    setDeliveries(Object.fromEntries(ROSTER.map((s) => [s.id, 0])));
    setDeadLetters(0);
    setSeq({ OrderPlaced: 0, PaymentReceived: 0, UserSignedup: 0 });
    setQueue([]);
    setFlash({ topic: null, targets: [], dead: false, payload: null });
    setEventId(0);
    setNote('Reset. A publisher emits to a TOPIC, never to a subscriber. Toggle subscribers, then publish — the bus routes by topic.');
  };

  // SVG geometry
  const W = 940;
  const H = 470;

  const pubX = 24; const pubW = 196;
  const busX = 372; const busW = 196;
  const subX = 720; const subW = 196;

  const pubY = (i) => 70 + i * 116;
  const busRowY = (i) => 96 + i * 90;
  const subY = (i) => 60 + i * 64;

  // bus row centre for a topic (right edge), to draw fan-out edges
  const busRowAnchor = (topic) => {
    const i = TOPICS.findIndex((t) => t.id === topic);
    return busRowY(i) + 28;
  };

  const deadActive = flash.dead;

  return (
    <div className="ebv">
      <div className="ebv-head">
        <h3 className="ebv-title">Event bus — publish/subscribe routing by topic</h3>
        <p className="ebv-sub">
          Publishers emit typed events to a topic; the bus fans out to whichever subscribers registered for that
          topic. Toggle subscribers, switch sync vs async delivery, and publish — events with no live subscriber
          land in the dead-letter box instead of disappearing.
        </p>
      </div>

      <div className="ebv-controls">
        <div className="ebv-pub-buttons">
          {TOPICS.map((t) => (
            <button
              key={`pub-${t.id}`}
              type="button"
              className="ebv-btn ebv-btn-pub"
              style={{ borderColor: t.accent, color: t.accent }}
              onClick={() => publish(t.id)}
            >
              <Send size={13} /> {t.id}
            </button>
          ))}
        </div>

        <span className="ebv-spacer" aria-hidden="true" />

        <div className="ebv-mode" role="group" aria-label="Delivery mode">
          <span className="ebv-input-label">delivery</span>
          <button
            type="button"
            className={`ebv-toggle ${mode === 'sync' ? 'is-on' : ''}`}
            onClick={() => setMode('sync')}
          >
            sync
          </button>
          <button
            type="button"
            className={`ebv-toggle ${mode === 'async' ? 'is-on' : ''}`}
            onClick={() => setMode('async')}
          >
            async
          </button>
        </div>

        <div className="ebv-buttons">
          <button
            type="button"
            className="ebv-btn ebv-btn-primary"
            onClick={drainOne}
            disabled={mode !== 'async' || queue.length === 0}
          >
            <Inbox size={14} /> Drain ({queue.length})
          </button>
          <button type="button" className="ebv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="ebv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ebv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ebv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="ebv-arrowhead" />
            </marker>
          </defs>

          {/* edges: publishers -> bus (always present, hot on publish) */}
          {TOPICS.map((t, i) => {
            const sy = pubY(i) + 44;
            const ey = busRowAnchor(t.id);
            const hot = flash.topic === t.id;
            return (
              <path
                key={`pe-${t.id}`}
                className={`ebv-edge ${hot ? 'is-hot' : ''}`}
                style={hot ? { stroke: t.accent } : undefined}
                d={`M ${pubX + pubW} ${sy} C ${pubX + pubW + 60} ${sy}, ${busX - 60} ${ey}, ${busX} ${ey}`}
                markerEnd="url(#ebv-arrow)"
              />
            );
          })}

          {/* edges: bus topic row -> each live subscriber for that topic */}
          {ROSTER.map((s, i) => {
            if (!live.has(s.id)) return null;
            const sy = busRowAnchor(s.topic);
            const ey = subY(i) + 24;
            const hot = flash.topic === s.topic && flash.targets.includes(s.id);
            return (
              <path
                key={`se-${s.id}`}
                className={`ebv-edge ${hot ? 'is-hot' : ''}`}
                style={hot ? { stroke: TOPIC_ACCENT[s.topic] } : undefined}
                d={`M ${busX + busW} ${sy} C ${busX + busW + 60} ${sy}, ${subX - 60} ${ey}, ${subX} ${ey}`}
                markerEnd="url(#ebv-arrow)"
              />
            );
          })}

          {/* edge: bus -> dead letter (hot when a no-subscriber event lands) */}
          <path
            className={`ebv-edge ebv-edge-dead ${deadActive ? 'is-hot' : ''}`}
            d={`M ${busX + busW / 2} ${busRowY(2) + 56} C ${busX + busW / 2} ${H - 80}, ${subX + subW / 2} ${H - 80}, ${subX + subW / 2} ${H - 64}`}
            markerEnd="url(#ebv-arrow)"
          />

          {/* publishers column */}
          <text className="ebv-col-label" x={pubX + pubW / 2} y={42}>publishers</text>
          {TOPICS.map((t, i) => {
            const y = pubY(i);
            const hot = flash.topic === t.id;
            return (
              <g key={`pub-node-${t.id}`}>
                <rect
                  className={`ebv-pub ${hot ? 'is-hot' : ''}`}
                  style={hot ? { stroke: t.accent } : undefined}
                  x={pubX} y={y} width={pubW} height={64} rx={10}
                />
                <g transform={`translate(${pubX + 14}, ${y + 14})`}><Radio width={16} height={16} className="ebv-ic" style={{ color: t.accent }} /></g>
                <text className="ebv-pub-title" x={pubX + 38} y={y + 26}>emit</text>
                <text className="ebv-pub-topic" x={pubX + 38} y={y + 45} style={{ fill: t.accent }}>{t.id}</text>
              </g>
            );
          })}

          {/* central bus */}
          <rect className="ebv-bus" x={busX} y={56} width={busW} height={H - 150} rx={12} />
          <text className="ebv-col-label" x={busX + busW / 2} y={42}>event bus</text>
          <text className="ebv-bus-tag" x={busX + busW / 2} y={78}>topic routing table</text>
          {TOPICS.map((t, i) => {
            const y = busRowY(i);
            const subs = routing[t.id];
            const hot = flash.topic === t.id;
            return (
              <g key={`bus-row-${t.id}`}>
                <rect
                  className={`ebv-bus-row ${hot ? 'is-hot' : ''} ${subs.length === 0 ? 'is-orphan' : ''}`}
                  style={hot ? { stroke: t.accent } : undefined}
                  x={busX + 12} y={y} width={busW - 24} height={56} rx={8}
                />
                <circle cx={busX + 26} cy={y + 18} r={4.5} fill={t.accent} />
                <text className="ebv-bus-topic" x={busX + 38} y={y + 22}>{t.id}</text>
                <text className="ebv-bus-count" x={busX + busW - 24} y={y + 22}>{subs.length} sub{subs.length === 1 ? '' : 's'}</text>
                <text className="ebv-bus-subs" x={busX + 26} y={y + 42}>
                  {subs.length ? subs.join(', ') : 'no subscribers · dead-letter'}
                </text>
              </g>
            );
          })}

          {/* subscribers column */}
          <text className="ebv-col-label" x={subX + subW / 2} y={42}>subscribers</text>
          {ROSTER.map((s, i) => {
            const y = subY(i);
            const on = live.has(s.id);
            const hot = flash.targets.includes(s.id);
            const acc = TOPIC_ACCENT[s.topic];
            return (
              <g key={`sub-node-${s.id}`}>
                <rect
                  className={`ebv-sub ${on ? 'is-live' : 'is-off'} ${hot ? 'is-hot' : ''}`}
                  style={(on || hot) ? { stroke: acc } : undefined}
                  x={subX} y={y} width={subW} height={48} rx={9}
                />
                <circle cx={subX + 18} cy={y + 24} r={5} fill={on ? acc : 'var(--text-dim)'} opacity={on ? 1 : 0.5} />
                <text className="ebv-sub-name" x={subX + 34} y={y + 20}>{s.id}</text>
                <text className="ebv-sub-topic" x={subX + 34} y={y + 37} style={{ fill: acc }}>{s.topic}</text>
                <text className={`ebv-sub-count ${on ? '' : 'is-off'}`} x={subX + subW - 14} y={y + 30}>{deliveries[s.id]}</text>
              </g>
            );
          })}

          {/* dead-letter box */}
          <g>
            <rect
              className={`ebv-dead ${deadActive ? 'is-hot' : ''}`}
              x={subX} y={H - 64} width={subW} height={48} rx={9}
            />
            <g transform={`translate(${subX + 12}, ${H - 64 + 14})`}><AlertTriangle width={16} height={16} className="ebv-ic-warn" /></g>
            <text className="ebv-dead-name" x={subX + 36} y={H - 64 + 20}>dead-letter</text>
            <text className="ebv-dead-sub" x={subX + 36} y={H - 64 + 37}>unrouted events</text>
            <text className="ebv-dead-count" x={subX + subW - 14} y={H - 64 + 30}>{deadLetters}</text>
          </g>
        </svg>
      </div>

      <div className="ebv-roster">
        <span className="ebv-roster-label">subscribers</span>
        {ROSTER.map((s) => {
          const on = live.has(s.id);
          return (
            <button
              key={`chip-${s.id}`}
              type="button"
              className={`ebv-chip ${on ? 'is-on' : ''}`}
              style={on ? { borderColor: TOPIC_ACCENT[s.topic], color: TOPIC_ACCENT[s.topic] } : undefined}
              onClick={() => toggleSub(s.id)}
            >
              {on ? <X size={12} /> : <Plus size={12} />}
              {s.id}
              <span className="ebv-chip-topic">{s.topic}</span>
            </button>
          );
        })}
      </div>

      <div className="ebv-metrics">
        <div className="ebv-metric">
          <span className="ebv-metric-label">live subscribers</span>
          <span className="ebv-metric-value">{liveCount} / {ROSTER.length}</span>
        </div>
        <div className="ebv-metric">
          <span className="ebv-metric-label">delivery mode</span>
          <span className="ebv-metric-value is-mode">{mode}</span>
        </div>
        <div className="ebv-metric">
          <span className="ebv-metric-label">total delivered</span>
          <span className="ebv-metric-value">{totalDelivered}</span>
        </div>
        <div className="ebv-metric">
          <span className="ebv-metric-label">queued (async)</span>
          <span className="ebv-metric-value is-queue">{queue.length}</span>
        </div>
        <div className="ebv-metric">
          <span className="ebv-metric-label">dead letters</span>
          <span className="ebv-metric-value is-dead">{deadLetters}</span>
        </div>
      </div>

      <div className="ebv-narration">
        <span className={`ebv-narration-label ${deadActive ? 'is-dead' : ''}`}>
          {deadActive ? 'dead-letter' : 'bus'}
        </span>
        <span className="ebv-narration-body">{note}</span>
      </div>
    </div>
  );
}
