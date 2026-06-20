import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, User, Lock, Database, Shield, ShieldOff } from 'lucide-react';
import './DistributedLockViz.css';

// Distributed lock — single-Redis mutual exclusion via SET key val NX PX ttl, the
// TTL-expiry split-brain hazard, and the fencing-token fix.
//
// SINGLE-NODE LOCK:
//   acquire = SET lock <client-token> NX PX <ttl>
//   NX => the SET only succeeds if the key does not already exist, so exactly one
//   client wins; every other client's SET returns nil and it must back off + retry.
//   PX <ttl> => the key auto-expires, so a crashed holder never deadlocks the lock.
//
// THE TTL HAZARD (split brain):
//   The TTL is a guess. If holder A is paused (GC pause, slow disk, network stall)
//   for longer than the TTL, Redis silently expires A's key while A still believes
//   it holds the lock. Client B's SET NX now succeeds. For a window, TWO clients
//   both think they own the lock and both write to the shared resource -> corruption.
//
// THE FENCING FIX (Martin Kleppmann):
//   Each successful acquire returns a strictly INCREASING fencing token. Every write
//   to the protected resource carries the token. The resource remembers the highest
//   token it has accepted and REJECTS any write whose token is <= that high-water
//   mark. So when paused A wakes up and writes with its stale token 33, the resource
//   has already seen B's token 34 and refuses A's write. Mutual exclusion is enforced
//   at the resource, not merely assumed from the lock — the lock can be wrong, the
//   fence cannot.

// ---------------------------------------------------------------------------
// Scenario trace builders. Each returns a list of immutable frames.
// Shared frame shape (snap):
//   clients : [{ id, state, token }]   state: idle|acquiring|holding|working|expired|woke|retry|done|rejected
//   store   : { holder: clientIdx|null, token: number|null, ttl: number|null }   (single-node)
//   nodes   : [{ holder }]   (redlock majority view; null when single-node)
//   resource: { highWater: number, lastWrite: {client,token}|null, rejected: number }
//   inCS    : [clientIdx,...]   clients currently believing they're in the critical section
//   active  : clientIdx | -1
//   msg     : short edge label for the active client
//   note    : caption
// ---------------------------------------------------------------------------

const CNAMES = ['A', 'B', 'C'];
const TTL0 = 10;
const NODES = 5;

function freshClients() {
  return CNAMES.map((id) => ({ id, state: 'idle', token: null }));
}

// Build the single-node TTL-expiry split-brain scenario.
// `fencing` toggles whether the resource enforces fencing tokens.
function buildSingleNode(fencing) {
  const frames = [];
  const clients = freshClients();
  const store = { holder: null, token: null, ttl: null };
  const resource = { highWater: 0, lastWrite: null, rejected: 0 };
  let inCS = [];
  let tokenSeq = 32; // monotonic token counter; first acquire mints 33

  const snap = (extra) => ({
    clients: clients.map((c) => ({ ...c })),
    store: { ...store },
    nodes: null,
    resource: { ...resource, lastWrite: resource.lastWrite ? { ...resource.lastWrite } : null },
    inCS: [...inCS],
    active: -1,
    msg: '',
    phase: 'run',
    fencing,
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Single Redis lock. acquire = SET lock <token> NX PX ttl. NX lets exactly one client win; PX gives the lock a ${TTL0}s TTL so a dead holder cannot deadlock it. `
      + (fencing
        ? 'Fencing is ON: every acquire mints a strictly increasing token, and the resource rejects any write carrying a stale token.'
        : 'Fencing is OFF: the resource trusts whoever writes. Watch what a long pause does.'),
  }));

  // A acquires.
  tokenSeq += 1; // 33
  clients[0].state = 'acquiring';
  frames.push(snap({
    active: 0,
    msg: 'SET NX PX',
    note: `Client A runs SET lock A NX PX ${TTL0}. The key does not exist, so NX succeeds.`,
  }));
  store.holder = 0;
  store.token = tokenSeq;
  store.ttl = TTL0;
  clients[0].state = 'holding';
  clients[0].token = tokenSeq;
  frames.push(snap({
    active: 0,
    note: `A wins the lock with token ${tokenSeq}, TTL ${TTL0}s. A is the sole holder.`,
  }));

  // B tries, fails (NX).
  clients[1].state = 'acquiring';
  frames.push(snap({
    active: 1,
    msg: 'SET NX -> nil',
    note: 'Client B runs SET lock B NX while A holds it. The key already exists, so NX returns nil — B did NOT acquire. B backs off and will retry later.',
  }));
  clients[1].state = 'retry';
  frames.push(snap({
    active: 1,
    note: 'B failed to acquire and enters a back-off retry loop. Only ONE holder so far: mutual exclusion holds.',
  }));

  // A enters the critical section and writes once, safely.
  clients[0].state = 'working';
  inCS = [0];
  frames.push(snap({
    active: 0,
    note: 'A enters the critical section and begins its work (e.g. read-modify-write of a shared row).',
  }));
  resource.highWater = fencing ? clients[0].token : resource.highWater;
  resource.lastWrite = { client: 0, token: clients[0].token };
  frames.push(snap({
    active: 0,
    msg: fencing ? `write tok ${clients[0].token}` : 'write',
    note: fencing
      ? `A writes to the resource with fencing token ${clients[0].token}. The resource records high-water = ${resource.highWater} and accepts the write.`
      : 'A writes to the resource. The resource has no fence and simply accepts it.',
  }));

  // A pauses (GC / stall) longer than the TTL. Redis expires the key.
  clients[0].state = 'paused';
  frames.push(snap({
    active: 0,
    note: 'DANGER SETUP. A suffers a long stop-the-world GC pause (or a slow syscall). A is frozen mid-critical-section but still believes it holds the lock.',
  }));
  store.ttl = 0;
  store.holder = null;
  store.token = null;
  clients[0].state = 'expired';
  frames.push(snap({
    active: 0,
    msg: 'TTL -> 0',
    note: 'While A is paused, the TTL reaches 0 and Redis SILENTLY expires the lock key. A is not notified. The lock is now free — but A does not know that.',
  }));

  // B retries and now wins.
  tokenSeq += 1; // 34
  clients[1].state = 'acquiring';
  frames.push(snap({
    active: 1,
    msg: 'SET NX PX',
    note: 'B retries SET lock B NX. The key is gone (expired), so NX now SUCCEEDS. B acquires the lock.',
  }));
  store.holder = 1;
  store.token = tokenSeq;
  store.ttl = TTL0;
  clients[1].state = 'working';
  clients[1].token = tokenSeq;
  inCS = [1];
  frames.push(snap({
    active: 1,
    note: `B wins the lock with token ${tokenSeq} and enters the critical section. From the lock's point of view there is one holder — but A is still paused believing it holds it.`,
  }));

  // B writes with its (newer) token.
  resource.highWater = fencing ? clients[1].token : resource.highWater;
  resource.lastWrite = { client: 1, token: clients[1].token };
  frames.push(snap({
    active: 1,
    msg: fencing ? `write tok ${clients[1].token}` : 'write',
    note: fencing
      ? `B writes with fencing token ${clients[1].token}. The resource bumps high-water to ${resource.highWater} and accepts it.`
      : 'B writes to the resource; it is accepted. So far so good — but A is about to wake up.',
  }));

  // A wakes up — split brain. Both A and B think they hold the lock.
  clients[0].state = 'woke';
  inCS = fencing ? [1] : [0, 1];
  frames.push(snap({
    active: 0,
    phase: 'danger',
    note: 'SPLIT BRAIN. A resumes from its pause with NO idea the lock expired. A still thinks it is the holder and proceeds to finish its critical-section write. For this instant, A and B BOTH believe they own the lock.',
  }));

  // A attempts its stale write — the moment fencing matters.
  const aTok = clients[0].token; // 33, stale
  if (fencing) {
    // resource rejects: aTok <= highWater
    clients[0].state = 'rejected';
    resource.rejected += 1;
    inCS = [1];
    frames.push(snap({
      active: 0,
      phase: 'danger',
      msg: `write tok ${aTok} -> REJECT`,
      note: `A tries to write with its STALE token ${aTok}. The resource's high-water mark is ${resource.highWater} (from B's token ${clients[1].token}). Since ${aTok} <= ${resource.highWater}, the resource REJECTS A's write. The fence held: only B's effects survive. No corruption.`,
    }));
  } else {
    // no fence: A's stale write overwrites B's — corruption
    resource.lastWrite = { client: 0, token: aTok };
    clients[0].state = 'working';
    frames.push(snap({
      active: 0,
      phase: 'corrupt',
      msg: 'write (no fence)',
      note: `A writes with its stale data and the resource — having no fence — ACCEPTS it, clobbering B's update. Two holders both wrote: the shared state is now CORRUPT. This is exactly the bug fencing tokens exist to prevent.`,
    }));
  }

  // Done.
  clients[0].state = fencing ? 'rejected' : 'done';
  clients[1].state = 'holding';
  inCS = fencing ? [1] : [];
  frames.push(snap({
    phase: fencing ? 'safe' : 'corrupt',
    note: fencing
      ? `RESULT — SAFE. The lock alone was not enough (it expired under A), but the monotonic fencing token let the resource reject the stale writer. Rejected writes: ${resource.rejected}. Exactly one writer's effects (B, token ${clients[1].token}) are durable.`
      : `RESULT — CORRUPT. Two clients were in the critical section at once and both wrote. Without a fence, the resource could not tell the stale writer from the live one. Turn fencing ON and replay to see the rejection.`,
  }));

  return frames;
}

// Build the Redlock majority-acquire scenario across N independent Redis nodes.
// A client must lock a strict majority (> N/2) of nodes to hold the lock.
function buildRedlock() {
  const frames = [];
  const clients = freshClients();
  const nodes = Array.from({ length: NODES }, () => ({ holder: null }));
  const store = { holder: null, token: null, ttl: TTL0 };
  const resource = { highWater: 0, lastWrite: null, rejected: 0 };
  let inCS = [];
  const majority = Math.floor(NODES / 2) + 1;

  const snap = (extra) => ({
    clients: clients.map((c) => ({ ...c })),
    store: { ...store },
    nodes: nodes.map((n) => ({ ...n })),
    resource: { ...resource, lastWrite: resource.lastWrite ? { ...resource.lastWrite } : null },
    inCS: [...inCS],
    active: -1,
    msg: '',
    phase: 'run',
    fencing: true,
    majority,
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Redlock spreads the lock across ${NODES} independent Redis nodes. A client must SET NX on a strict majority — at least ${majority} of ${NODES} — to hold the lock. A single node failing or being slow no longer loses the lock, and two clients cannot both win a majority of the same ${NODES} nodes.`,
  }));

  // A and B race node by node. A grabs nodes 0,1,2 ; B grabs 3,4 then collides.
  const grab = [
    { c: 0, n: 0 }, { c: 1, n: 4 }, { c: 0, n: 1 }, { c: 1, n: 3 }, { c: 0, n: 2 },
  ];
  for (const g of grab) {
    nodes[g.n].holder = g.c;
    clients[g.c].state = 'acquiring';
    const aCount = nodes.filter((n) => n.holder === 0).length;
    const bCount = nodes.filter((n) => n.holder === 1).length;
    frames.push(snap({
      active: g.c,
      msg: `SET node ${g.n + 1}`,
      note: `Client ${CNAMES[g.c]} locks node ${g.n + 1} (NX succeeds). Tally — A: ${aCount}/${NODES}, B: ${bCount}/${NODES}. Need ${majority} for a majority.`,
    }));
  }

  // B tries to grab one of A's nodes -> NX fails.
  clients[1].state = 'acquiring';
  frames.push(snap({
    active: 1,
    msg: 'SET node 3 -> nil',
    note: `B needs one more node and tries node 3, but A already holds it (NX returns nil). B has only 2/${NODES} and cannot reach ${majority}. B releases its nodes and backs off.`,
  }));
  nodes[3].holder = nodes[3].holder === 1 ? null : nodes[3].holder;
  nodes[4].holder = null;
  clients[1].state = 'retry';

  // A reaches majority and holds.
  const aCount = nodes.filter((n) => n.holder === 0).length;
  store.holder = 0;
  store.token = 34;
  clients[0].state = 'holding';
  clients[0].token = 34;
  frames.push(snap({
    active: 0,
    note: `A holds ${aCount}/${NODES} nodes >= majority ${majority}, so A wins the Redlock with token 34. B has fewer than a majority and did not acquire. Exactly one holder.`,
  }));

  // A enters CS and writes with its fencing token.
  clients[0].state = 'working';
  inCS = [0];
  resource.highWater = 34;
  resource.lastWrite = { client: 0, token: 34 };
  frames.push(snap({
    active: 0,
    phase: 'safe',
    msg: 'write tok 34',
    note: 'A enters the critical section and writes with fencing token 34; the resource accepts it (high-water 34). One majority-holder, one writer — mutual exclusion holds across the cluster.',
  }));

  frames.push(snap({
    phase: 'safe',
    note: `RESULT — SAFE. Because a lock needs a strict majority and any two majorities of ${NODES} nodes must overlap on at least one node, two clients can never both hold the Redlock. Pair it with fencing tokens to also survive the pause-past-TTL hazard.`,
  }));

  return frames;
}

const SCENARIOS = {
  'TTL expiry (split brain)': 'single',
  'Redlock majority (N nodes)': 'redlock',
};
const SCEN_KEYS = Object.keys(SCENARIOS);

const STATE_LABEL = {
  idle: 'idle',
  acquiring: 'acquiring',
  holding: 'holds lock',
  working: 'in crit. section',
  paused: 'paused (GC)',
  expired: 'lock expired',
  woke: 'woke up',
  retry: 'retry / backoff',
  rejected: 'write rejected',
  done: 'done',
};

const RUN_DELAY_MS = 1200;

export default function DistributedLockViz() {
  const [scenario, setScenario] = useState(SCEN_KEYS[0]);
  const [fencing, setFencing] = useState(true);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const mode = SCENARIOS[scenario];
  const frames = useMemo(
    () => (mode === 'single' ? buildSingleNode(fencing) : buildRedlock()),
    [mode, fencing],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchScenario = (s) => {
    if (s === scenario) return;
    setIsRunning(false);
    setStep(0);
    setScenario(s);
  };

  const toggleFencing = () => {
    setIsRunning(false);
    setStep(0);
    setFencing((v) => !v);
  };

  // SVG geometry
  const W = 940;
  const H = 470;
  const isRedlock = mode === 'redlock';

  // clients column (left)
  const cliW = 196;
  const cliH = 78;
  const cliX = 28;
  const cliGap = 22;
  const cliTop = 92;
  const cliY = (i) => cliTop + i * (cliH + cliGap);

  // lock store (center)
  const storeW = 220;
  const storeX = (W - storeW) / 2 + 20;
  const storeY = 96;
  const storeH = isRedlock ? 220 : 132;

  // resource (right)
  const resW = 196;
  const resX = W - resW - 28;
  const resH = 150;
  const resY = 150;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const holder = current.store.holder;
  const inCSset = current.inCS;
  const danger = inCSset.length > 1;

  const stateTone = (st) => {
    if (st === 'working' || st === 'holding') return 'ok';
    if (st === 'rejected' || st === 'expired') return 'bad';
    if (st === 'paused' || st === 'woke' || st === 'retry') return 'warn';
    return 'neutral';
  };

  const cliCx = cliX + cliW;
  const storeCx = storeX + storeW / 2;
  const resCx = resX;

  // edge from active client toward its target (store, or resource)
  const activeTargetsResource = /write/i.test(current.msg);

  return (
    <div className="dlv">
      <div className="dlv-head">
        <h3 className="dlv-title">Distributed lock — SET NX, the TTL hazard, and fencing tokens</h3>
        <p className="dlv-sub">
          One Redis key gives mutual exclusion with SET NX PX, but a TTL is a guess: a holder paused past its TTL
          can wake into a split brain where two clients write at once. Step it, toggle fencing on or off to see the
          resource reject the stale writer, or switch to Redlock&apos;s majority across N nodes.
        </p>
      </div>

      <div className="dlv-controls">
        <div className="dlv-modes" role="tablist" aria-label="Scenario">
          {SCEN_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              className={`dlv-mode ${scenario === s ? 'is-on' : ''}`}
              onClick={() => switchScenario(s)}
              aria-pressed={scenario === s}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`dlv-toggle ${current.fencing ? 'is-on' : 'is-off'}`}
          onClick={toggleFencing}
          disabled={isRedlock}
          title={isRedlock ? 'Redlock here always fences' : 'Toggle fencing tokens'}
          aria-pressed={current.fencing}
        >
          {current.fencing ? <Shield size={14} /> : <ShieldOff size={14} />}
          fencing {current.fencing ? 'ON' : 'OFF'}
        </button>

        <label className="dlv-speed">
          <span className="dlv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dlv-speed-range"
            aria-label="Playback speed"
          />
          <span className="dlv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="dlv-spacer" aria-hidden="true" />

        <div className="dlv-buttons">
          <button
            type="button"
            className="dlv-btn dlv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="dlv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dlv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dlv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="dlv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dlv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dlv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dlv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="dlv-ah" />
            </marker>
            <marker id="dlv-arrow-bad" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="dlv-ah-bad" />
            </marker>
          </defs>

          {/* column captions */}
          <text className="dlv-col-label" x={cliX} y={64} textAnchor="start">clients</text>
          <text className="dlv-col-label" x={storeCx} y={64} textAnchor="middle">
            {isRedlock ? `lock cluster (${NODES} Redis nodes)` : 'Redis lock'}
          </text>
          <text className="dlv-col-label" x={resX + resW} y={64} textAnchor="end">protected resource</text>

          {/* active edge: client -> store or store -> resource */}
          {current.active >= 0 && current.msg && (() => {
            const y = cliY(current.active) + cliH / 2;
            const bad = /REJECT|nil/.test(current.msg);
            if (activeTargetsResource) {
              const sy = resY + 30;
              return (
                <g>
                  <path
                    className={`dlv-edge ${bad ? 'is-bad' : ''}`}
                    d={`M ${cliCx} ${y} C ${cliCx + 120} ${y}, ${resCx - 120} ${sy}, ${resCx} ${sy}`}
                    markerEnd={`url(#dlv-arrow${bad ? '-bad' : ''})`}
                  />
                  <rect className={`dlv-pill ${bad ? 'is-bad' : ''}`} x={(cliCx + resCx) / 2 - 56} y={(y + sy) / 2 - 26} width={112} height={20} rx={10} />
                  <text className="dlv-pill-text" x={(cliCx + resCx) / 2} y={(y + sy) / 2 - 12}>{current.msg}</text>
                </g>
              );
            }
            const sx = storeX;
            const sy = storeY + 40;
            return (
              <g>
                <path
                  className={`dlv-edge ${bad ? 'is-bad' : ''}`}
                  d={`M ${cliCx} ${y} C ${cliCx + 70} ${y}, ${sx - 70} ${sy}, ${sx} ${sy}`}
                  markerEnd={`url(#dlv-arrow${bad ? '-bad' : ''})`}
                />
                <rect className={`dlv-pill ${bad ? 'is-bad' : ''}`} x={(cliCx + sx) / 2 - 52} y={(y + sy) / 2 - 26} width={104} height={20} rx={10} />
                <text className="dlv-pill-text" x={(cliCx + sx) / 2} y={(y + sy) / 2 - 12}>{current.msg}</text>
              </g>
            );
          })()}

          {/* clients */}
          {current.clients.map((c, i) => {
            const active = current.active === i;
            const tone = stateTone(c.state);
            const inCrit = inCSset.includes(i);
            const y = cliY(i);
            return (
              <g key={`cli-${i}`} className={active ? 'is-active' : ''}>
                <rect
                  className={`dlv-cli is-${tone} ${active ? 'is-active' : ''} ${inCrit ? 'is-incs' : ''}`}
                  x={cliX}
                  y={y}
                  width={cliW}
                  height={cliH}
                  rx={11}
                />
                <g transform={`translate(${cliX + 14}, ${y + 13})`}>
                  <User width={16} height={16} className="dlv-ic" />
                </g>
                <text className="dlv-cli-title" x={cliX + 38} y={y + 26}>{`client ${c.id}`}</text>
                <text className={`dlv-cli-state is-${tone}`} x={cliX + cliW - 12} y={y + 26}>
                  {STATE_LABEL[c.state]}
                </text>
                <line className="dlv-rule" x1={cliX + 14} y1={y + 38} x2={cliX + cliW - 14} y2={y + 38} />
                <text className="dlv-cli-k" x={cliX + 14} y={y + 60}>token</text>
                <text className="dlv-cli-v" x={cliX + 70} y={y + 60}>{c.token == null ? '—' : c.token}</text>
                {inCrit && (
                  <text className={`dlv-cli-cs ${danger ? 'is-bad' : 'is-ok'}`} x={cliX + cliW - 12} y={y + 60}>
                    {danger ? 'in CS (!)' : 'in CS'}
                  </text>
                )}
              </g>
            );
          })}

          {/* lock store */}
          {!isRedlock && (
            <g>
              <rect
                className={`dlv-store ${holder != null ? 'is-held' : ''} ${current.store.ttl === 0 ? 'is-expired' : ''}`}
                x={storeX}
                y={storeY}
                width={storeW}
                height={storeH}
                rx={12}
              />
              <g transform={`translate(${storeX + 14}, ${storeY + 13})`}>
                <Lock width={16} height={16} className="dlv-ic" />
              </g>
              <text className="dlv-store-title" x={storeX + 38} y={storeY + 26}>SET lock NX PX</text>
              <line className="dlv-rule" x1={storeX + 14} y1={storeY + 40} x2={storeX + storeW - 14} y2={storeY + 40} />
              <text className="dlv-store-k" x={storeX + 14} y={storeY + 64}>holder</text>
              <text className="dlv-store-v" x={storeX + storeW - 14} y={storeY + 64}>
                {holder == null ? '(free)' : current.clients[holder].id}
              </text>
              <text className="dlv-store-k" x={storeX + 14} y={storeY + 90}>token</text>
              <text className="dlv-store-v" x={storeX + storeW - 14} y={storeY + 90}>
                {current.store.token == null ? '—' : current.store.token}
              </text>
              <text className="dlv-store-k" x={storeX + 14} y={storeY + 116}>ttl</text>
              <text
                className={`dlv-store-v ${current.store.ttl === 0 ? 'is-bad' : ''}`}
                x={storeX + storeW - 14}
                y={storeY + 116}
              >
                {current.store.ttl == null ? '—' : `${current.store.ttl}s`}
              </text>
            </g>
          )}

          {/* redlock node grid */}
          {isRedlock && (
            <g>
              <rect className="dlv-store" x={storeX} y={storeY} width={storeW} height={storeH} rx={12} />
              {current.nodes.map((n, i) => {
                const cols = 3;
                const cw = 60;
                const ch = 52;
                const gx = 12;
                const gy = 12;
                const col = i % cols;
                const row = Math.floor(i / cols);
                const nx = storeX + 16 + col * (cw + gx);
                const ny = storeY + 18 + row * (ch + gy);
                const hb = n.holder;
                return (
                  <g key={`node-${i}`}>
                    <rect
                      className={`dlv-node ${hb != null ? 'is-held' : ''}`}
                      x={nx}
                      y={ny}
                      width={cw}
                      height={ch}
                      rx={8}
                    />
                    <text className="dlv-node-id" x={nx + cw / 2} y={ny + 20}>{`n${i + 1}`}</text>
                    <text className="dlv-node-h" x={nx + cw / 2} y={ny + 40}>
                      {hb == null ? 'free' : current.clients[hb].id}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* resource */}
          <g>
            <rect
              className={`dlv-res ${current.phase === 'corrupt' ? 'is-corrupt' : ''} ${current.resource.rejected > 0 ? 'is-fenced' : ''}`}
              x={resX}
              y={resY}
              width={resW}
              height={resH}
              rx={12}
            />
            <g transform={`translate(${resX + 14}, ${resY + 13})`}>
              <Database width={16} height={16} className="dlv-ic" />
            </g>
            <text className="dlv-res-title" x={resX + 38} y={resY + 26}>resource</text>
            <line className="dlv-rule" x1={resX + 14} y1={resY + 40} x2={resX + resW - 14} y2={resY + 40} />
            <text className="dlv-res-k" x={resX + 14} y={resY + 64}>high-water</text>
            <text className="dlv-res-v" x={resX + resW - 14} y={resY + 64}>
              {current.fencing ? current.resource.highWater : 'n/a'}
            </text>
            <text className="dlv-res-k" x={resX + 14} y={resY + 90}>last write</text>
            <text className="dlv-res-v" x={resX + resW - 14} y={resY + 90}>
              {current.resource.lastWrite
                ? `${current.clients[current.resource.lastWrite.client].id}·${current.resource.lastWrite.token ?? '—'}`
                : '—'}
            </text>
            <text className="dlv-res-k" x={resX + 14} y={resY + 116}>rejected</text>
            <text className={`dlv-res-v ${current.resource.rejected > 0 ? 'is-ok' : ''}`} x={resX + resW - 14} y={resY + 116}>
              {current.resource.rejected}
            </text>
          </g>
        </svg>
      </div>

      <div className="dlv-metrics">
        <div className="dlv-metric">
          <span className="dlv-metric-label">lock holder</span>
          <span className="dlv-metric-value">{holder == null ? '(free)' : current.clients[holder].id}</span>
        </div>
        <div className="dlv-metric">
          <span className="dlv-metric-label">ttl</span>
          <span className={`dlv-metric-value ${current.store.ttl === 0 ? 'is-bad' : ''}`}>
            {isRedlock ? `${TTL0}s` : current.store.ttl == null ? '—' : `${current.store.ttl}s`}
          </span>
        </div>
        <div className="dlv-metric">
          <span className="dlv-metric-label">fencing token</span>
          <span className="dlv-metric-value">{current.store.token == null ? '—' : current.store.token}</span>
        </div>
        <div className="dlv-metric">
          <span className="dlv-metric-label">in crit. section</span>
          <span className={`dlv-metric-value ${danger ? 'is-bad' : inCSset.length === 1 ? 'is-ok' : ''}`}>
            {inCSset.length === 0 ? 'none' : inCSset.map((i) => current.clients[i].id).join(' + ')}
            {danger ? ' (split!)' : ''}
          </span>
        </div>
        <div className="dlv-metric">
          <span className="dlv-metric-label">rejected writes</span>
          <span className={`dlv-metric-value ${current.resource.rejected > 0 ? 'is-ok' : ''}`}>
            {current.resource.rejected}
          </span>
        </div>
        <div className="dlv-metric dlv-metric-dim">
          <span className="dlv-metric-label">resource</span>
          <span className={`dlv-metric-value ${current.phase === 'corrupt' ? 'is-bad' : current.phase === 'safe' ? 'is-ok' : ''}`}>
            {current.phase === 'corrupt' ? 'CORRUPT' : current.phase === 'safe' ? 'consistent' : '—'}
          </span>
        </div>
      </div>

      <div className={`dlv-narration ${current.phase === 'danger' || current.phase === 'corrupt' ? 'is-bad' : ''}`}>
        <span className={`dlv-narration-label ${current.phase === 'danger' || current.phase === 'corrupt' ? 'is-bad' : current.phase === 'safe' ? 'is-ok' : ''}`}>
          {current.phase === 'danger' ? 'split brain'
            : current.phase === 'corrupt' ? 'corruption'
              : current.phase === 'safe' ? 'safe'
                : current.phase === 'init' ? 'setup'
                  : 'trace'}
        </span>
        <span className="dlv-narration-body">{current.note}</span>
      </div>

      <div className="dlv-legend">
        <span className="dlv-legend-item"><Lock size={13} className="dlv-ic" /> SET NX = one winner</span>
        <span className="dlv-legend-item"><ShieldOff size={13} className="dlv-ic is-bad" /> no fence: stale write corrupts</span>
        <span className="dlv-legend-item"><Shield size={13} className="dlv-ic is-ok" /> fence: stale token rejected</span>
      </div>
    </div>
  );
}
