import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link2, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import './DbRelationalViz.css';

const USERS = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Linus' },
  { id: 3, name: 'Grace' },
];

const ORDERS = [
  { id: 101, uid: 1, amount: 40 },
  { id: 102, uid: 1, amount: 75 },
  { id: 103, uid: 2, amount: 120 },
  { id: 104, uid: 4, amount: 60 },
];

const JOINS = ['INNER', 'LEFT', 'RIGHT'];

// Each plan entry references a user-index (l) and order-index (r); null = unmatched.
function buildPlan(join) {
  const rows = [];
  if (join === 'RIGHT') {
    ORDERS.forEach((o, r) => {
      const l = USERS.findIndex((u) => u.id === o.uid);
      rows.push({ l: l === -1 ? null : l, r });
    });
  } else {
    USERS.forEach((u, l) => {
      const matches = ORDERS.map((o, r) => ({ o, r })).filter((x) => x.o.uid === u.id);
      if (matches.length) matches.forEach((m) => rows.push({ l, r: m.r }));
      else if (join === 'LEFT') rows.push({ l, r: null });
    });
  }
  return rows;
}

const W = 760;
const H = 304;
const ROW_H = 34;
const U_X = 36;
const U_W = 188;
const O_X = 300;
const O_W = 236;
const TOP = 56;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DbRelationalViz() {
  const [join, setJoin] = useState('INNER');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const plan = useMemo(() => buildPlan(join), [join]);
  const total = plan.length;

  function pickJoin(j) { setJoin(j); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), reduced() ? 280 : 760);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const showPause = playing && step < total;

  const current = step > 0 && step <= total ? plan[step - 1] : null;
  const revealed = plan.slice(0, step);

  const uRowY = (i) => TOP + i * ROW_H + ROW_H / 2;
  const oRowY = (i) => TOP + i * ROW_H + ROW_H / 2;

  const sql = `SELECT u.name, o.id, o.amount\nFROM users u\n${join} JOIN orders o ON o.user_id = u.id;`;

  return (
    <div className="dbrel">
      <div className="dbrel-head">
        <div className="dbrel-head-icon"><Link2 size={18} /></div>
        <div className="dbrel-head-text">
          <h3 className="dbrel-title">Joining rows across tables</h3>
          <p className="dbrel-sub">
            A join pairs each row of <b>users</b> with the matching rows of <b>orders</b> on the foreign key.
            Pick a join type and step through the matches.
          </p>
        </div>
        <button type="button" className="dbrel-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dbrel-chips">
        {JOINS.map((j) => (
          <button
            key={j}
            type="button"
            className={`dbrel-chip${j === join ? ' is-active' : ''}`}
            onClick={() => pickJoin(j)}
          >
            {j} JOIN
          </button>
        ))}
      </div>

      <div className="dbrel-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dbrel-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dbrel-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* users table */}
          <text x={U_X} y={36} className="dbrel-tname">users</text>
          {USERS.map((u, i) => {
            const active = current && current.l === i;
            return (
              <g key={u.id} className={`dbrel-row${active ? ' is-hit' : ''}`}>
                <rect x={U_X} y={TOP + i * ROW_H} width={U_W} height={ROW_H - 4} rx={7} className="dbrel-cell" />
                <text x={U_X + 14} y={uRowY(i) + 4} className="dbrel-key">{u.id}</text>
                <text x={U_X + 58} y={uRowY(i) + 4} className="dbrel-val">{u.name}</text>
              </g>
            );
          })}

          {/* orders table */}
          <text x={O_X} y={36} className="dbrel-tname">orders</text>
          {ORDERS.map((o, i) => {
            const active = current && current.r === i;
            const orphan = USERS.findIndex((u) => u.id === o.uid) === -1;
            return (
              <g key={o.id} className={`dbrel-row${active ? ' is-hit' : ''}`}>
                <rect x={O_X} y={TOP + i * ROW_H} width={O_W} height={ROW_H - 4} rx={7}
                  className={`dbrel-cell${orphan ? ' is-orphan' : ''}`} />
                <text x={O_X + 14} y={oRowY(i) + 4} className="dbrel-key">{o.id}</text>
                <text x={O_X + 70} y={oRowY(i) + 4} className="dbrel-val">uid {o.uid}</text>
                <text x={O_X + 168} y={oRowY(i) + 4} className="dbrel-val">${o.amount}</text>
              </g>
            );
          })}

          {/* link for the current match */}
          {current && current.l !== null && current.r !== null && (
            <line
              x1={U_X + U_W} y1={uRowY(current.l)}
              x2={O_X} y2={oRowY(current.r)}
              className="dbrel-link" markerEnd="url(#dbrel-arrow)"
            />
          )}
          {current && current.r === null && current.l !== null && (
            <text x={U_X + U_W + 16} y={uRowY(current.l) + 4} className="dbrel-nullnote">→ NULL (no order)</text>
          )}
          {current && current.l === null && current.r !== null && (
            <text x={O_X - 16} y={oRowY(current.r) + 4} className="dbrel-nullnote" textAnchor="end">NULL ←</text>
          )}
        </svg>
      </div>

      <div className="dbrel-controls">
        <button type="button" className="dbrel-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="dbrel-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <span className="dbrel-progress">{step} / {total} matches</span>
      </div>

      <div className="dbrel-readout">
        <pre className="dbrel-sql">{sql}</pre>
        <div className="dbrel-result">
          <div className="dbrel-result-head">result set</div>
          <div className="dbrel-result-cols"><span>name</span><span>order</span><span>amount</span></div>
          {revealed.length === 0 && <div className="dbrel-result-empty">step to build the result…</div>}
          {revealed.map((p, i) => {
            const u = p.l !== null ? USERS[p.l] : null;
            const o = p.r !== null ? ORDERS[p.r] : null;
            return (
              <div key={i} className="dbrel-result-row">
                <span>{u ? u.name : <em className="dbrel-null">NULL</em>}</span>
                <span>{o ? o.id : <em className="dbrel-null">NULL</em>}</span>
                <span>{o ? `$${o.amount}` : <em className="dbrel-null">NULL</em>}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
