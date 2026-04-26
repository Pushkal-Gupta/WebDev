// SHORT ORDER — original kitchen workflow / order-assembly game.
//
//  • Orders arrive in a queue. Each order is a sequence of steps
//    (DOUGH → SAUCE → PEPPERONI → OVEN → BOX, etc).
//  • You have one active order at a time — the leftmost. Tap the action
//    buttons in the correct order to build it. Wrong tap costs 4 s off
//    the order's timer. Right taps light up on the ticket.
//  • Each order has its own countdown. Run it out and you lose a life.
//    Three lives. Orders complete when you finish assembly; the next
//    ticket slides over. You get a tip equal to `10 + remainingSeconds`.
//  • A 90-second shift. Orders arrive faster as time progresses.
//
//  DOM-based, not canvas — touch targets are the point here. Big buttons,
//  legible tickets, no mouse-precision required.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const SHIFT_SECONDS = 90;

const ACTIONS = {
  DOUGH:     { label: 'Dough',     emoji: '●',  color: '#e4c99b' },
  SAUCE:     { label: 'Sauce',     emoji: '~',  color: '#d83f3f' },
  CHEESE:    { label: 'Cheese',    emoji: '▤',  color: '#ffd65a' },
  PEPPERONI: { label: 'Pepperoni', emoji: '•',  color: '#c93636' },
  VEGGIES:   { label: 'Veggies',   emoji: '✿',  color: '#5fbf3a' },
  OVEN:      { label: 'Oven',      emoji: '♨',  color: '#ff8a3a' },
  SLICE:     { label: 'Slice',     emoji: '✂',  color: '#c0c0c0' },
  BOX:       { label: 'Box',       emoji: '⧉',  color: '#7a5a2a' },
};
const ACTION_ORDER = ['DOUGH', 'SAUCE', 'CHEESE', 'PEPPERONI', 'VEGGIES', 'OVEN', 'SLICE', 'BOX'];

const TOPPINGS = ['SAUCE', 'CHEESE', 'PEPPERONI', 'VEGGIES'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Recipe generator. Always starts with DOUGH, always ends with BOX.
function makeRecipe() {
  const steps = ['DOUGH'];
  // Random 2-3 toppings (from 4 options)
  const n = 2 + Math.floor(Math.random() * 2);
  const pool = [...TOPPINGS];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    steps.push(pool.splice(idx, 1)[0]);
  }
  steps.push('OVEN');
  // 50% include SLICE between OVEN and BOX
  if (Math.random() < 0.5) steps.push('SLICE');
  steps.push('BOX');
  return steps;
}

let _id = 0;
const nextId = () => ++_id;

function makeOrder(baseSeconds) {
  const recipe = makeRecipe();
  // Timer scales slightly with recipe length.
  const timer = Math.max(8, baseSeconds + (recipe.length - 4) * 2);
  return {
    id: nextId(),
    recipe,
    progress: 0,
    timer,
  };
}

export default function ShortOrderGame() {
  const [orders, setOrders]   = useState([]);
  const [lives, setLives]     = useState(3);
  const [score, setScore]     = useState(0);
  const [shiftT, setShiftT]   = useState(SHIFT_SECONDS);
  const [tip, setTip]         = useState(null);        // transient { at, amount }
  const [wrong, setWrong]     = useState(null);        // transient { at, key }
  // 'ready' is the spawn-safety gate — tickets don't tick down until
  // the first action / start tap. Prevents an order from expiring while
  // the player is still reading the first ticket.
  const [status, setStatus]   = useState('ready');     // ready | playing | won | lost

  // Mutable runtime state kept in a ref so the animation loop doesn't
  // re-subscribe every React render.
  const runRef = useRef({
    elapsed: 0,
    nextSpawn: 1.5,
    orderBaseT: 18,
    spawnIntervalFn: (elapsed) => Math.max(4.0, 9 - elapsed * 0.045),
    submittedRef: false,
  });

  const reset = () => {
    runRef.current = {
      elapsed: 0,
      nextSpawn: 1.2,
      orderBaseT: 18,
      spawnIntervalFn: (el) => Math.max(4.0, 9 - el * 0.045),
      submittedRef: false,
    };
    setOrders([makeOrder(18), makeOrder(18)]);
    setLives(3);
    setScore(0);
    setShiftT(SHIFT_SECONDS);
    setTip(null);
    setWrong(null);
    setStatus('ready');
  };

  // Boot with two tickets so it never looks empty.
  useEffect(() => {
    setOrders([makeOrder(18), makeOrder(18)]);
  }, []);

  // Main loop — advances timers, spawns orders, ends shift.
  useEffect(() => {
    if (status !== 'playing') return;
    let raf = 0;
    let last = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = runRef.current;
      r.elapsed += dt;

      // Shift clock
      setShiftT((t) => {
        const next = Math.max(0, t - dt);
        if (next <= 0 && status === 'playing') {
          setStatus('won');
        }
        return next;
      });

      // Order timers
      setOrders((curr) => {
        let lost = 0;
        const next = curr
          .map((o) => ({ ...o, timer: o.timer - dt }))
          .filter((o) => {
            if (o.timer > 0) return true;
            lost += 1;
            return false;
          });
        if (lost > 0) {
          // Each missed order deducts a life.
          setLives((lv) => {
            const nl = lv - lost;
            if (nl <= 0) setStatus('lost');
            return Math.max(0, nl);
          });
        }
        // Spawn logic — always keep at least 2 visible, with a cap.
        r.nextSpawn -= dt;
        let q = next;
        const shouldSpawn = r.nextSpawn <= 0 || q.length < 2;
        if (shouldSpawn && q.length < 5) {
          q = [...q, makeOrder(r.orderBaseT)];
          r.nextSpawn = r.spawnIntervalFn(r.elapsed);
        }
        return q;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // Submit score when the shift ends (once).
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      const r = runRef.current;
      if (!r.submittedRef) {
        r.submittedRef = true;
        submitScore('papa', Math.max(0, score), { lives, status });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Keyboard shortcuts — letters below + number row for power users.
  useEffect(() => {
    const KEY_TO_ACTION = {
      'd': 'DOUGH',   '1': 'DOUGH',
      's': 'SAUCE',   '2': 'SAUCE',
      'c': 'CHEESE',  '3': 'CHEESE',
      'p': 'PEPPERONI','4': 'PEPPERONI',
      'v': 'VEGGIES', '5': 'VEGGIES',
      'o': 'OVEN',    '6': 'OVEN',
      'x': 'SLICE',   '7': 'SLICE',
      'b': 'BOX',     '8': 'BOX',
    };
    const kd = (e) => {
      const k = e.key.toLowerCase();
      const action = KEY_TO_ACTION[k];
      if (action) { e.preventDefault(); onAction(action); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onAction = (key) => {
    // First input from the spawn-safety gate flips us to 'playing' and
    // also acts on the first ticket so the tap isn't wasted.
    if (status === 'ready') {
      setStatus('playing');
      // Fall through so this same tap counts as the first action.
    } else if (status !== 'playing') return;
    setOrders((curr) => {
      if (curr.length === 0) return curr;
      const [active, ...rest] = curr;
      const expected = active.recipe[active.progress];
      if (expected === key) {
        const nextProgress = active.progress + 1;
        // Completed the order?
        if (nextProgress >= active.recipe.length) {
          const reward = 10 + Math.max(0, Math.floor(active.timer));
          setScore((s) => s + reward);
          setTip({ at: performance.now(), amount: reward });
          return rest;
        }
        return [{ ...active, progress: nextProgress }, ...rest];
      } else {
        // Wrong tap — 4s penalty to current order, no life loss.
        setWrong({ at: performance.now(), key });
        return [{ ...active, timer: Math.max(0.2, active.timer - 4) }, ...rest];
      }
    });
  };

  const active = orders[0];
  const now = performance.now();
  const tipAge  = tip   ? (now - tip.at)  / 1000 : 99;
  const wrongAge = wrong ? (now - wrong.at) / 1000 : 99;

  return (
    <div className="so" style={{ position: 'relative' }}>
      {status === 'ready' && (
        <div
          onClick={() => setStatus('playing')}
          style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)', cursor: 'pointer',
            color: '#fff', textAlign: 'center', padding: 16,
          }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.5 }}>Tap to start the shift</div>
            <div style={{ marginTop: 6, opacity: 0.85, fontSize: 14 }}>90s clock and ticket timers stay frozen until you do.</div>
          </div>
        </div>
      )}
      <div className="so-bar">
        <span>Shift <b>{Math.ceil(shiftT)}s</b></span>
        <span>Lives <b style={{color: lives <= 1 ? '#ff4d6d' : 'var(--text)'}}>{'♥'.repeat(Math.max(0, lives))}</b></span>
        <span>Tip jar <b style={{color:'var(--accent)'}}>${score}</b></span>
        <span style={{marginLeft:'auto'}}>
          {(status === 'won' || status === 'lost') && <button className="btn btn-primary btn-sm" onClick={reset}>New shift</button>}
        </span>
      </div>

      <div className="so-queue" aria-label="Order queue">
        {orders.slice(0, 4).map((o, i) => (
          <OrderTicket key={o.id} order={o} isActive={i === 0}/>
        ))}
        {orders.length === 0 && status === 'playing' && (
          <div className="so-ticket so-ticket-empty">Kitchen caught up — a new order in a second.</div>
        )}
      </div>

      <div className="so-grid">
        {ACTION_ORDER.map((k) => {
          const act = ACTIONS[k];
          const needed = active?.recipe[active.progress] === k;
          const flashWrong = wrong && wrong.key === k && wrongAge < 0.35;
          return (
            <button
              key={k}
              className={`so-btn${needed ? ' is-needed' : ''}${flashWrong ? ' is-wrong' : ''}`}
              style={{ '--btn-color': act.color }}
              onClick={() => onAction(k)}
              disabled={status === 'won' || status === 'lost'}
              aria-label={act.label}>
              <span className="so-btn-ico">{act.emoji}</span>
              <span className="so-btn-label">{act.label}</span>
            </button>
          );
        })}
      </div>

      {tipAge < 1.4 && tip && (
        <div className="so-tip-pop">+${tip.amount} tip</div>
      )}

      {status === 'won' && (
        <div className="so-result" style={{color:'var(--accent)'}}>
          Shift over · ${score} in tips · {lives} lives left
        </div>
      )}
      {status === 'lost' && (
        <div className="so-result" style={{color:'#ff4d6d'}}>
          Kitchen’s gone under · ${score} in tips before it went quiet
        </div>
      )}

      <div className="so-hint">
        Tap buttons in the order shown on the leftmost ticket · keyboard: D S C P V O X B · R is not here, restart via the button above
      </div>
    </div>
  );
}

function OrderTicket({ order, isActive }) {
  const urgent = order.timer < 6;
  return (
    <div className={`so-ticket${isActive ? ' is-active' : ''}${urgent ? ' is-urgent' : ''}`}>
      <div className="so-ticket-head">
        <span className="so-ticket-id">#{order.id.toString().padStart(3, '0')}</span>
        <span className="so-ticket-t">{order.timer.toFixed(1)}s</span>
      </div>
      <div className="so-ticket-steps">
        {order.recipe.map((k, idx) => {
          const done = idx < order.progress;
          const cur  = idx === order.progress && isActive;
          const act = ACTIONS[k];
          return (
            <span
              key={idx}
              className={`so-step${done ? ' is-done' : ''}${cur ? ' is-current' : ''}`}
              style={{ '--btn-color': act.color }}
              title={act.label}>
              <span className="so-step-ico">{act.emoji}</span>
            </span>
          );
        })}
      </div>
      <div className="so-ticket-bar">
        <div className="so-ticket-fill" style={{ width: `${Math.min(100, Math.max(0, (order.timer / 18) * 100))}%` }}/>
      </div>
    </div>
  );
}
