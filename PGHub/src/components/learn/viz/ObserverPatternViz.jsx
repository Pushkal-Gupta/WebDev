import React, { useMemo, useState } from 'react';
import { Bell, Plus, Minus, Send } from 'lucide-react';
import './ObserverPatternViz.css';

const OBSERVERS = [
  { id: 'mobile', label: 'MobileApp', hue: 'var(--hue-sky)' },
  { id: 'email', label: 'EmailService', hue: 'var(--hue-mint)' },
  { id: 'logger', label: 'AuditLogger', hue: 'var(--hue-violet)' },
  { id: 'dashboard', label: 'Dashboard', hue: 'var(--hue-pink)' },
];

const STATES = ['IDLE', 'WARMING', 'ACTIVE', 'COOLING'];

export default function ObserverPatternViz() {
  const [subscribed, setSubscribed] = useState({ mobile: true, email: true, logger: false, dashboard: true });
  const [stateIdx, setStateIdx] = useState(0);
  const [lastNotified, setLastNotified] = useState([]);

  const subject = STATES[stateIdx];

  const subscribers = useMemo(
    () => OBSERVERS.filter((o) => subscribed[o.id]),
    [subscribed],
  );

  const observerValue = useMemo(() => {
    const map = {};
    OBSERVERS.forEach((o) => {
      map[o.id] = lastNotified.includes(o.id) ? subject : '—';
    });
    return map;
  }, [lastNotified, subject]);

  const toggle = (id) => {
    setSubscribed((s) => ({ ...s, [id]: !s[id] }));
  };

  const changeState = () => {
    const next = (stateIdx + 1) % STATES.length;
    setStateIdx(next);
    setLastNotified(OBSERVERS.filter((o) => subscribed[o.id]).map((o) => o.id));
  };

  // SVG geometry
  const W = 940;
  const H = 360;
  const subjX = 90;
  const subjY = 130;
  const subjW = 200;
  const subjH = 100;
  const obsX = 560;
  const obsW = 320;
  const obsH = 54;
  const obsGap = 16;
  const obsTop = 40;

  return (
    <div className="opv">
      <div className="opv-head">
        <h3 className="opv-title">Observer — one subject, many auto-updated listeners</h3>
        <p className="opv-sub">
          The subject holds state and a subscriber list. Change the state and the notification fans out to every
          subscribed observer; each updates its own displayed value. Subscribe or unsubscribe to change who hears it.
        </p>
      </div>

      <div className="opv-controls">
        <button type="button" className="opv-btn opv-btn-primary" onClick={changeState}>
          <Send size={14} /> setState → notify all
        </button>
        <span className="opv-spacer" aria-hidden="true" />
        <div className="opv-toggles">
          {OBSERVERS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`opv-toggle ${subscribed[o.id] ? 'is-on' : ''}`}
              onClick={() => toggle(o.id)}
              style={subscribed[o.id] ? { borderColor: o.hue, color: o.hue } : undefined}
            >
              {subscribed[o.id] ? <Minus size={12} /> : <Plus size={12} />}
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="opv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="opv-svg" preserveAspectRatio="xMidYMid meet">
          {/* edges from subject to each subscribed observer */}
          {OBSERVERS.map((o, i) => {
            if (!subscribed[o.id]) return null;
            const oy = obsTop + i * (obsH + obsGap) + obsH / 2;
            const notified = lastNotified.includes(o.id);
            return (
              <line
                key={`edge-${o.id}`}
                className={`opv-edge ${notified ? 'is-live' : ''}`}
                x1={subjX + subjW}
                y1={subjY + subjH / 2}
                x2={obsX}
                y2={oy}
                style={notified ? { stroke: o.hue } : undefined}
              />
            );
          })}

          {/* subject */}
          <rect className="opv-subject" x={subjX} y={subjY} width={subjW} height={subjH} rx={10} />
          <text className="opv-node-title" x={subjX + subjW / 2} y={subjY + 26}>Subject</text>
          <text className="opv-node-sub" x={subjX + subjW / 2} y={subjY + 44}>state</text>
          <rect className="opv-state-pill" x={subjX + 30} y={subjY + 56} width={subjW - 60} height={30} rx={6} />
          <text className="opv-state-text" x={subjX + subjW / 2} y={subjY + 76}>{subject}</text>
          <text className="opv-node-count" x={subjX + subjW / 2} y={subjY + subjH + 22}>
            {subscribers.length} subscriber{subscribers.length === 1 ? '' : 's'}
          </text>

          {/* observers */}
          {OBSERVERS.map((o, i) => {
            const oy = obsTop + i * (obsH + obsGap);
            const on = subscribed[o.id];
            const notified = lastNotified.includes(o.id);
            return (
              <g key={`obs-${o.id}`} className={on ? '' : 'opv-faded'}>
                <rect
                  className={`opv-observer ${notified ? 'is-notified' : ''}`}
                  x={obsX}
                  y={oy}
                  width={obsW}
                  height={obsH}
                  rx={8}
                  style={notified ? { stroke: o.hue } : undefined}
                />
                <circle cx={obsX + 22} cy={oy + obsH / 2} r={7} fill={on ? o.hue : 'var(--border)'} />
                <text className="opv-obs-label" x={obsX + 40} y={oy + 22}>{o.label}</text>
                <text className="opv-obs-state" x={obsX + 40} y={oy + 40}>
                  received: {observerValue[o.id]}
                </text>
                <text className="opv-obs-flag" x={obsX + obsW - 14} y={oy + obsH / 2 + 4} style={{ fill: on ? o.hue : 'var(--text-dim)' }}>
                  {on ? 'subscribed' : 'detached'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="opv-metrics">
        <div className="opv-metric">
          <span className="opv-metric-label">subject state</span>
          <span className="opv-metric-value">{subject}</span>
        </div>
        <div className="opv-metric">
          <span className="opv-metric-label">subscribers</span>
          <span className="opv-metric-value is-sky">[{subscribers.map((o) => o.label).join(', ') || '—'}]</span>
        </div>
        <div className="opv-metric">
          <span className="opv-metric-label">last notified</span>
          <span className="opv-metric-value is-mint">
            [{lastNotified.map((id) => OBSERVERS.find((o) => o.id === id)?.label).join(', ') || 'none yet'}]
          </span>
        </div>
      </div>

      <div className="opv-narration">
        <span className="opv-narration-label"><Bell size={12} /> trace</span>
        <span className="opv-narration-body">
          {lastNotified.length === 0
            ? 'No notification sent yet. Subscribe observers, then press "setState → notify all" — only attached observers will receive the new state.'
            : `Subject changed to "${subject}". notify() iterated the subscriber list and called update() on ${lastNotified.length} observer${lastNotified.length === 1 ? '' : 's'}; each pulled the new state into its own field. Detached observers stayed on their old value.`}
        </span>
      </div>
    </div>
  );
}
