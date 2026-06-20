import React, { useMemo, useState } from 'react';
import { RotateCcw, ArrowRight, Ban } from 'lucide-react';
import './StatePatternViz.css';

// State pattern: a Document delegates behavior to its current state object.
// Each state defines which events it accepts and what state they lead to.
// The same publish()/reject() call does different things per state.

const STATES = {
  draft: {
    name: 'Draft',
    desc: 'Author is editing. Only editing and submitting for review are allowed.',
    actions: { edit: 'draft', submit: 'moderation' },
    hue: 'var(--hue-sky)',
  },
  moderation: {
    name: 'Moderation',
    desc: 'A reviewer holds the document. They can publish it or reject back to draft.',
    actions: { publish: 'published', reject: 'draft' },
    hue: 'var(--medium)',
  },
  published: {
    name: 'Published',
    desc: 'Live and read-only. It can be retired back to draft for a rewrite.',
    actions: { retire: 'draft' },
    hue: 'var(--easy)',
  },
};

const ALL_EVENTS = ['edit', 'submit', 'publish', 'reject', 'retire'];
const ORDER = ['draft', 'moderation', 'published'];

export default function StatePatternViz() {
  const [stateKey, setStateKey] = useState('draft');
  const [history, setHistory] = useState(['Draft']);
  const [note, setNote] = useState('The document delegates to its current state. Each state allows different events — try them and watch what is accepted vs rejected.');

  const state = STATES[stateKey];
  const allowed = useMemo(() => Object.keys(state.actions), [state]);

  const fire = (event) => {
    if (state.actions[event]) {
      const nextKey = state.actions[event];
      setStateKey(nextKey);
      setHistory((h) => [...h.slice(-6), STATES[nextKey].name]);
      setNote(`${event}() accepted in ${state.name} → transition to ${STATES[nextKey].name}. The new state object now governs behavior.`);
    } else {
      setNote(`${event}() REJECTED in ${state.name}. This state's object does not handle that event — no transition, no error thrown to the client.`);
    }
  };

  const reset = () => {
    setStateKey('draft');
    setHistory(['Draft']);
    setNote('reset — back to Draft.');
  };

  // SVG geometry
  const W = 940;
  const H = 230;
  const nodeW = 200;
  const nodeH = 96;
  const gap = (W - 60 - nodeW * 3) / 2;
  const nodeX = (i) => 30 + i * (nodeW + gap);
  const nodeY = 60;

  // edges between states (forward + back) derived from action maps
  const edges = [];
  ORDER.forEach((k) => {
    Object.entries(STATES[k].actions).forEach(([ev, to]) => {
      if (to !== k) edges.push({ from: k, to, ev });
    });
  });

  return (
    <div className="stv">
      <div className="stv-head">
        <h3 className="stv-title">State pattern — behavior changes with internal state</h3>
        <p className="stv-sub">
          A document hands each request to its current state object. The same event does different things —
          or nothing — depending on which state holds the document right now.
        </p>
      </div>

      <div className="stv-controls">
        <div className="stv-buttons">
          {ALL_EVENTS.map((ev) => {
            const ok = allowed.includes(ev);
            return (
              <button
                key={ev}
                type="button"
                className={`stv-btn ${ok ? 'is-ok' : 'is-blocked'}`}
                onClick={() => fire(ev)}
              >
                {ok ? <ArrowRight size={13} /> : <Ban size={13} />} {ev}()
              </button>
            );
          })}
        </div>
        <span className="stv-spacer" aria-hidden="true" />
        <button type="button" className="stv-btn" onClick={reset}><RotateCcw size={14} /> reset</button>
      </div>

      <div className="stv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="stv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="stv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="stv-arrow-head" />
            </marker>
          </defs>

          {edges.map((e, i) => {
            const fi = ORDER.indexOf(e.from);
            const ti = ORDER.indexOf(e.to);
            const forward = ti > fi;
            const y = forward ? nodeY + 24 : nodeY + nodeH - 24;
            const x1 = nodeX(fi) + (forward ? nodeW : 0);
            const x2 = nodeX(ti) + (forward ? 0 : nodeW);
            const live = stateKey === e.from;
            const midX = (x1 + x2) / 2;
            return (
              <g key={`e-${i}`}>
                <path
                  className={`stv-edge ${live ? 'is-live' : ''}`}
                  d={`M ${x1} ${y} L ${x2} ${y}`}
                  markerEnd="url(#stv-arrow)"
                />
                <text className={`stv-edge-label ${live ? 'is-live' : ''}`} x={midX} y={forward ? y - 6 : y + 16}>{e.ev}</text>
              </g>
            );
          })}

          {ORDER.map((k, i) => {
            const s = STATES[k];
            const active = stateKey === k;
            return (
              <g key={`n-${k}`}>
                <rect
                  className={`stv-node ${active ? 'is-active' : ''}`}
                  x={nodeX(i)}
                  y={nodeY}
                  width={nodeW}
                  height={nodeH}
                  rx={10}
                  style={active ? { stroke: s.hue } : undefined}
                />
                <rect x={nodeX(i)} y={nodeY} width={nodeW} height={6} rx={3} fill={s.hue} opacity={active ? 1 : 0.5} />
                <text className="stv-node-title" x={nodeX(i) + nodeW / 2} y={nodeY + 34}>{s.name}</text>
                <text className="stv-node-actions" x={nodeX(i) + nodeW / 2} y={nodeY + 60}>
                  {Object.keys(s.actions).join(' · ')}
                </text>
                {active && (
                  <text className="stv-node-here" x={nodeX(i) + nodeW / 2} y={nodeY + 82}>● current state</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="stv-metrics">
        <div className="stv-metric">
          <span className="stv-metric-label">current state</span>
          <span className="stv-metric-value">{state.name}</span>
        </div>
        <div className="stv-metric">
          <span className="stv-metric-label">allowed events</span>
          <span className="stv-metric-value is-allowed">{allowed.join(', ')}</span>
        </div>
        <div className="stv-metric">
          <span className="stv-metric-label">blocked events</span>
          <span className="stv-metric-value is-blocked">{ALL_EVENTS.filter((e) => !allowed.includes(e)).join(', ')}</span>
        </div>
        <div className="stv-metric">
          <span className="stv-metric-label">transition path</span>
          <span className="stv-metric-value is-path">{history.join(' → ')}</span>
        </div>
      </div>

      <div className="stv-narration">
        <span className="stv-narration-label">trace</span>
        <span className="stv-narration-body">{note}</span>
      </div>
    </div>
  );
}
