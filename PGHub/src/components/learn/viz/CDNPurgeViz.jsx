import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Server, Cloud, MonitorSmartphone, Tag } from 'lucide-react';
import './CDNPurgeViz.css';

// CDN cache purge / invalidation strategies.
//
// One ORIGIN holds the source of truth (a monotonic version). Three edge POPs
// each cache a copy of the asset with its own version + a TTL countdown. A client
// requests through a POP: HIT-fresh (POP has origin version, TTL > 0), HIT-stale
// (POP has an old version but still serves it), or MISS (POP empty -> fetch origin).
//
// When the origin content updates to a new version, each strategy reconciles the
// edges differently:
//
//   TTL          - passive. Origin just bumps its version. Edges keep serving the
//                  old version (STALE) until each POP's TTL counts down to 0; only
//                  then does the next request MISS and refetch the new version.
//   PURGE        - active. Origin pushes an invalidation to every POP; it arrives
//                  in hops (propagation delay). A purged POP drops its key, so the
//                  next request MISSes and fetches the fresh version immediately.
//   TAG-PURGE    - active, grouped. Origin purges by surrogate key / cache-tag, so
//                  every POP holding that tag drops it in one fan-out call.
//   SWR          - stale-while-revalidate. A stale POP serves the old version to
//                  the client INSTANTLY, then refetches the new version in the
//                  background so the *next* request is fresh — zero client wait.
//
// To make the strategy difference visible, each trace seeds all POPs with the
// origin version, bumps the origin, then drives client reads + the chosen
// reconciliation so you can watch staleness appear and clear.

const MODES = [
  { key: 'ttl', label: 'TTL EXPIRY', icon: 'ttl' },
  { key: 'purge', label: 'PURGE', icon: 'purge' },
  { key: 'tag', label: 'TAG PURGE', icon: 'tag' },
  { key: 'swr', label: 'STALE-WHILE-REVALIDATE', icon: 'swr' },
];

// Edge POPs. ttl0 = the TTL (seconds) each holds at the moment the origin updates.
// tag marks which surrogate-key group the cached object belongs to.
const POPS = [
  { id: 'e1', label: 'edge-us', region: 'us-east', ttl0: 15, tag: 'home' },
  { id: 'e2', label: 'edge-eu', region: 'eu-west', ttl0: 30, tag: 'home' },
  { id: 'e3', label: 'edge-ap', region: 'ap-south', ttl0: 45, tag: 'home' },
];

function buildFrames(mode) {
  const frames = [];

  const origin = { version: 4 };
  // every POP starts warm, holding the current origin version with its TTL.
  const pops = POPS.map((p) => ({
    id: p.id,
    label: p.label,
    region: p.region,
    tag: p.tag,
    version: origin.version, // cached object version
    ttl: p.ttl0,             // seconds remaining
    cached: true,
  }));
  let staleServed = 0;

  const snap = (extra) => ({
    mode,
    originVersion: origin.version,
    pops: pops.map((p) => ({ ...p })),
    staleServed,
    active: null,        // pop id touched this frame
    flow: null,          // { from, to, kind, label }
    readResult: null,    // { pop, version, kind: 'hit-fresh'|'hit-stale'|'miss' }
    phase: 'run',
    note: '',
    ...extra,
  });

  const popFreshness = (p) => {
    if (!p.cached) return 'empty';
    if (p.version < origin.version) return 'stale';
    return p.ttl > 0 ? 'fresh' : 'expired';
  };

  const modeLabel = MODES.find((m) => m.key === mode).label;

  frames.push(snap({
    phase: 'init',
    note: `${modeLabel}. Origin holds v${origin.version}; all three edge POPs are warm with v${origin.version} and a live TTL. Every client request near a POP is a fast HIT. Step forward to update the origin and watch how this strategy reconciles the edges.`,
  }));

  // ---- a client read served by a chosen POP ----
  const doRead = (pid, opts = {}) => {
    const p = pops.find((x) => x.id === pid);
    const fresh = popFreshness(p);
    if (fresh === 'empty' || fresh === 'expired') {
      // MISS -> fetch origin -> repopulate fresh
      frames.push(snap({
        phase: 'read-miss', active: pid,
        flow: { from: pid, to: 'origin', kind: 'miss', label: 'MISS · fetch' },
        readResult: { pop: pid, version: origin.version, kind: 'miss' },
        note: `Client hits ${p.label}: ${fresh === 'empty' ? 'the key was purged' : 'TTL expired'} -> cache MISS. ${p.label} fetches v${origin.version} from origin (one round trip to the source).`,
      }));
      p.version = origin.version;
      p.ttl = POPS.find((x) => x.id === pid).ttl0;
      p.cached = true;
      frames.push(snap({
        phase: 'read-fill', active: pid,
        flow: { from: 'origin', to: pid, kind: 'fill', label: `v${origin.version}` },
        readResult: { pop: pid, version: origin.version, kind: 'miss' },
        note: `Origin returns v${origin.version}; ${p.label} repopulates and serves it. The slow first request paid for the refresh — every later request near ${p.label} hits fresh.`,
      }));
      return;
    }
    if (fresh === 'stale') {
      staleServed += 1;
      frames.push(snap({
        phase: 'read-stale', active: pid,
        flow: { from: pid, to: 'client', kind: 'hit-stale', label: `v${p.version} stale` },
        readResult: { pop: pid, version: p.version, kind: 'hit-stale' },
        note: `Client hits ${p.label}: it still holds v${p.version} while origin is at v${origin.version}. ${p.label} serves the STALE copy (fast, but out of date). Stale-served count is now ${staleServed}.${opts.swr ? ' Because this is stale-while-revalidate, a background refresh kicks off next.' : ''}`,
      }));
      if (opts.swr) {
        p.version = origin.version;
        p.ttl = POPS.find((x) => x.id === pid).ttl0;
        frames.push(snap({
          phase: 'swr-revalidate', active: pid,
          flow: { from: 'origin', to: pid, kind: 'fill', label: `v${origin.version} (bg)` },
          readResult: null,
          note: `Background revalidation: ${p.label} quietly refetches v${origin.version} from origin AFTER answering the client. The reader waited zero extra time; the NEXT request near ${p.label} will be a fresh hit.`,
        }));
      }
      return;
    }
    // fresh hit
    frames.push(snap({
      phase: 'read-hit', active: pid,
      flow: { from: pid, to: 'client', kind: 'hit-fresh', label: `v${p.version} fresh` },
      readResult: { pop: pid, version: p.version, kind: 'hit-fresh' },
      note: `Client hits ${p.label}: it holds v${p.version} = origin and TTL is live -> fast fresh HIT. Origin is never touched.`,
    }));
  };

  // ---- origin content update ----
  const doUpdate = () => {
    origin.version += 1;
    frames.push(snap({
      phase: 'origin-update', active: null,
      flow: { from: 'client', to: 'origin', kind: 'write', label: `publish v${origin.version}` },
      note: `Content updated at origin: v${origin.version - 1} -> v${origin.version}. The edges still cache v${origin.version - 1} and don't know yet — every POP is now logically STALE. What happens next is the whole point of the strategy.`,
    }));
  };

  // ---- TTL countdown step: decrement every POP's TTL by `dt`, expire at 0 ----
  const tickTTL = (dt, label) => {
    pops.forEach((p) => {
      if (p.cached && p.ttl > 0) p.ttl = Math.max(0, p.ttl - dt);
      if (p.cached && p.ttl === 0 && p.version < origin.version) p.cached = false;
    });
    const expired = pops.filter((p) => !p.cached).map((p) => p.label);
    frames.push(snap({
      phase: 'ttl-tick', active: null,
      note: `${label} TTLs tick down ${dt}s. ${expired.length ? `Expired and dropped: ${expired.join(', ')} — their next request will MISS and refetch v${origin.version}.` : `No POP has hit 0 yet — they keep serving stale v${origin.version - 1}.`}`,
    }));
  };

  // ---- active purge to a list of POPs, arriving in hops ----
  const purge = (ids, kind, headline) => {
    ids.forEach((pid, hop) => {
      const p = pops.find((x) => x.id === pid);
      p.cached = false;
      frames.push(snap({
        phase: 'purge', active: pid,
        flow: { from: 'origin', to: pid, kind: 'purge', label: `purge (hop ${hop + 1})` },
        note: `${headline} Invalidation reaches ${p.label} (hop ${hop + 1}). ${p.label} drops its cached key — it now holds nothing for this object. The next request there MISSes and pulls v${origin.version}.`,
      }));
    });
  };

  // ===== mode-specific traces =====
  if (mode === 'ttl') {
    doRead('e1');                 // warm fresh hit, establishes baseline
    doUpdate();                   // origin -> v5, all POPs now stale
    doRead('e2');                 // edge-eu serves stale v4
    tickTTL(15, 'A few seconds pass —'); // e1(15->0 expires), e2(30->15), e3(45->30)
    doRead('e1');                 // e1 expired -> MISS -> v5
    doRead('e3');                 // e3 still stale v4
    tickTTL(30, 'More time passes —');   // e2(15->0 expire), e3(30->0 expire)
    doRead('e2');                 // MISS -> v5
    frames.push(snap({
      phase: 'done',
      note: `Done. TTL is passive: the origin never told the edges anything. Each POP served stale v4 until its own TTL lapsed, then refetched v5 on the next MISS. Total stale responses: ${staleServed}. Cheap and simple, but the staleness window equals the TTL — here up to 45s for ap-south.`,
    }));
  } else if (mode === 'purge') {
    doRead('e1');
    doUpdate();                   // origin -> v5
    doRead('e2');                 // stale before purge arrives
    purge(['e1', 'e2', 'e3'], 'purge', 'PURGE issued: origin actively pushes an invalidation to every POP.');
    doRead('e3');                 // now empty -> MISS -> v5
    doRead('e2');                 // empty -> MISS -> v5
    frames.push(snap({
      phase: 'done',
      note: `Done. PURGE is active: instead of waiting for TTLs, the origin pushed an invalidation that reached all edges in a few hops (propagation delay, not a full TTL). After the purge every POP MISSes once and converges on v5. One stale read slipped through before the purge landed — total stale: ${staleServed}.`,
    }));
  } else if (mode === 'tag') {
    doRead('e1');
    doUpdate();                   // origin -> v5
    purge(['e1', 'e2', 'e3'], 'purge', `TAG PURGE: origin purges surrogate-key "home" — every POP holding that tag drops it in one fan-out.`);
    doRead('e2');                 // MISS -> v5
    doRead('e3');                 // MISS -> v5
    frames.push(snap({
      phase: 'done',
      note: `Done. TAG / surrogate-key purge invalidated a whole GROUP at once: all three POPs cached the "home" tag, so a single tag purge dropped every copy without naming each URL. Ideal when one content change touches many cached objects. No stale reads slipped through this run — total stale: ${staleServed}.`,
    }));
  } else {
    // swr
    doRead('e1');
    doUpdate();                   // origin -> v5
    doRead('e2', { swr: true });  // serve stale v4 instantly, then bg-refresh to v5
    doRead('e2');                 // next request now fresh v5
    doRead('e3', { swr: true });  // another POP: stale then refresh
    doRead('e3');                 // fresh
    frames.push(snap({
      phase: 'done',
      note: `Done. Stale-while-revalidate optimizes for latency: a stale POP answers the client instantly with v4, THEN refreshes to v5 in the background. The reader never waits on origin; only the first request after an update sees stale data, and the next one is fresh. Stale served (but instant): ${staleServed}.`,
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 1200;

const ICONS = { ttl: Cloud, purge: Server, tag: Tag, swr: MonitorSmartphone };

export default function CDNPurgeViz() {
  const [mode, setMode] = useState('ttl');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode), [mode]);
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

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  // SVG geometry
  const W = 940;
  const H = 470;

  const originW = 220;
  const originH = 96;
  const originX = (W - originW) / 2;
  const originY = 22;
  const originCx = originX + originW / 2;

  const popW = 248;
  const popGap = 34;
  const popsTotal = POPS.length * popW + (POPS.length - 1) * popGap;
  const popLeft = (W - popsTotal) / 2;
  const popY = 210;
  const popH = 120;
  const popX = (i) => popLeft + i * (popW + popGap);
  const popCx = (i) => popX(i) + popW / 2;

  const clientY = 396;
  const clientH = 50;

  const freshnessOf = (p, originVersion) => {
    if (!p.cached) return 'empty';
    if (p.version < originVersion) return 'stale';
    return p.ttl > 0 ? 'fresh' : 'expired';
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');
  const flow = current.flow;
  const readRes = current.readResult;

  const flowAnchor = (key, side) => {
    if (key === 'origin') return { x: originCx, y: originY + originH };
    if (key === 'client') {
      const idx = POPS.findIndex((p) => p.id === current.active) ?? 1;
      const safeIdx = idx >= 0 ? idx : 1;
      return { x: popCx(safeIdx), y: clientY };
    }
    const idx = POPS.findIndex((p) => p.id === key);
    return { x: popCx(idx), y: side === 'bottom' ? popY + popH : popY };
  };

  const flowTone = (kind) => {
    if (kind === 'hit-fresh' || kind === 'fill') return 'fresh';
    if (kind === 'hit-stale') return 'stale';
    if (kind === 'miss') return 'miss';
    if (kind === 'purge') return 'purge';
    return 'write';
  };

  return (
    <div className="cpv">
      <div className="cpv-head">
        <h3 className="cpv-title">CDN purge strategies — how an origin update reaches the edge</h3>
        <p className="cpv-sub">
          One origin, three edge POPs caching a versioned asset with a TTL. Update the origin, then watch how each
          strategy reconciles the edges — passive TTL expiry, an active purge that propagates in hops, a grouped
          tag purge, or stale-while-revalidate that serves instantly and refreshes in the background.
        </p>
      </div>

      <div className="cpv-controls">
        <div className="cpv-modes" role="tablist" aria-label="Purge strategy">
          {MODES.map((m) => {
            const Ic = ICONS[m.icon];
            return (
              <button
                key={m.key}
                type="button"
                className={`cpv-mode ${mode === m.key ? 'is-on' : ''}`}
                onClick={() => switchMode(m.key)}
                aria-pressed={mode === m.key}
              >
                <Ic size={13} /> {m.label}
              </button>
            );
          })}
        </div>

        <label className="cpv-speed">
          <span className="cpv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cpv-speed-range"
            aria-label="Playback speed"
          />
          <span className="cpv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="cpv-spacer" aria-hidden="true" />

        <div className="cpv-buttons">
          <button
            type="button"
            className="cpv-btn cpv-btn-primary"
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
            className="cpv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cpv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cpv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cpv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cpv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            {['fresh', 'stale', 'miss', 'purge', 'write'].map((t) => (
              <marker
                key={t}
                id={`cpv-arrow-${t}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" className={`cpv-ah is-${t}`} />
              </marker>
            ))}
          </defs>

          {/* static origin -> POP links */}
          {POPS.map((p, i) => (
            <path
              key={`base-${p.id}`}
              className="cpv-edge is-base"
              d={`M ${originCx} ${originY + originH} C ${originCx} ${originY + originH + 50}, ${popCx(i)} ${popY - 50}, ${popCx(i)} ${popY}`}
            />
          ))}

          {/* active flow */}
          {flow && (() => {
            const tone = flowTone(flow.kind);
            let p1; let p2;
            if (flow.kind === 'hit-fresh' || flow.kind === 'hit-stale') {
              p1 = flowAnchor(flow.from, 'bottom');
              p2 = { x: p1.x, y: clientY };
            } else if (flow.kind === 'miss') {
              p1 = flowAnchor(flow.from, 'top');
              p2 = flowAnchor('origin');
            } else if (flow.kind === 'fill' || flow.kind === 'purge') {
              p1 = flowAnchor('origin');
              p2 = flowAnchor(flow.to, 'top');
            } else {
              // write / publish: client area to origin
              p1 = { x: originCx, y: originY + originH + 6 };
              p2 = flowAnchor('origin');
            }
            const midY = (p1.y + p2.y) / 2;
            const lx = (p1.x + p2.x) / 2;
            return (
              <g>
                <path
                  className={`cpv-edge is-${tone}`}
                  d={`M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`}
                  markerEnd={`url(#cpv-arrow-${tone})`}
                />
                <rect className={`cpv-msg-pill is-${tone}`} x={lx - 52} y={midY - 12} width={104} height={22} rx={11} />
                <text className="cpv-msg-text" x={lx} y={midY + 3}>{flow.label}</text>
              </g>
            );
          })()}

          {/* origin */}
          <g>
            <rect
              className={`cpv-node cpv-origin ${current.phase === 'origin-update' ? 'is-active' : ''}`}
              x={originX}
              y={originY}
              width={originW}
              height={originH}
              rx={12}
            />
            <g transform={`translate(${originX + 16}, ${originY + 14})`}>
              <Server width={18} height={18} className="cpv-ic" />
            </g>
            <text className="cpv-node-title" x={originX + 44} y={originY + 29}>origin</text>
            <text className="cpv-node-sub" x={originX + originW - 16} y={originY + 29}>source of truth</text>
            <line className="cpv-node-rule" x1={originX + 16} y1={originY + 42} x2={originX + originW - 16} y2={originY + 42} />
            <text className="cpv-node-k" x={originX + 16} y={originY + 72}>current version</text>
            <text className="cpv-node-ver" x={originX + originW - 16} y={originY + 72}>v{current.originVersion}</text>
          </g>

          {/* POPs */}
          {current.pops.map((p, i) => {
            const x = popX(i);
            const fresh = freshnessOf(p, current.originVersion);
            const active = current.active === p.id;
            const rr = readRes && readRes.pop === p.id ? readRes.kind : null;
            return (
              <g key={`pop-${p.id}`}>
                <rect
                  className={`cpv-node cpv-pop is-${fresh} ${active ? 'is-active' : ''}`}
                  x={x}
                  y={popY}
                  width={popW}
                  height={popH}
                  rx={12}
                />
                <g transform={`translate(${x + 16}, ${popY + 14})`}>
                  <Cloud width={17} height={17} className="cpv-ic" />
                </g>
                <text className="cpv-node-title" x={x + 42} y={popY + 28}>{p.label}</text>
                <text className={`cpv-pop-state is-${fresh}`} x={x + popW - 16} y={popY + 28}>
                  {fresh === 'empty' ? 'purged' : fresh === 'expired' ? 'expired' : fresh}
                </text>
                <line className="cpv-node-rule" x1={x + 16} y1={popY + 40} x2={x + popW - 16} y2={popY + 40} />

                <text className="cpv-node-k" x={x + 16} y={popY + 62}>cached</text>
                <text className={`cpv-node-v ${p.cached && fresh === 'stale' ? 'is-stale' : p.cached && fresh === 'fresh' ? 'is-fresh' : 'is-dim'}`} x={x + popW - 16} y={popY + 62}>
                  {p.cached ? `v${p.version}` : 'empty'}
                </text>

                <text className="cpv-node-k" x={x + 16} y={popY + 84}>TTL</text>
                <text className={`cpv-node-v ${p.cached && p.ttl > 0 ? '' : 'is-dim'}`} x={x + popW - 16} y={popY + 84}>
                  {p.cached ? `${p.ttl}s` : '—'}
                </text>

                <text className="cpv-node-k" x={x + 16} y={popY + 106}>tag</text>
                <text className="cpv-node-tag" x={x + popW - 16} y={popY + 106}>{p.tag}</text>

                {/* client below the active POP */}
                {rr && (
                  <g>
                    <rect
                      className={`cpv-client is-${rr}`}
                      x={popCx(i) - 90}
                      y={clientY}
                      width={180}
                      height={clientH}
                      rx={10}
                    />
                    <g transform={`translate(${popCx(i) - 76}, ${clientY + 15})`}>
                      <MonitorSmartphone width={16} height={16} className="cpv-ic" />
                    </g>
                    <text className="cpv-client-title" x={popCx(i) - 50} y={clientY + 20}>client</text>
                    <text className={`cpv-client-verdict is-${rr}`} x={popCx(i) - 50} y={clientY + 38}>
                      {rr === 'hit-fresh' ? `HIT v${readRes.version} fresh`
                        : rr === 'hit-stale' ? `HIT v${readRes.version} STALE`
                        : `MISS -> v${readRes.version}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cpv-metrics">
        <div className="cpv-metric">
          <span className="cpv-metric-label">strategy</span>
          <span className="cpv-metric-value">{MODES.find((m) => m.key === mode).label}</span>
        </div>
        <div className="cpv-metric">
          <span className="cpv-metric-label">origin version</span>
          <span className="cpv-metric-value is-fresh">v{current.originVersion}</span>
        </div>
        {current.pops.map((p) => {
          const fresh = freshnessOf(p, current.originVersion);
          return (
            <div className="cpv-metric" key={`m-${p.id}`}>
              <span className="cpv-metric-label">{p.label}</span>
              <span className={`cpv-metric-value ${fresh === 'fresh' ? 'is-fresh' : fresh === 'stale' ? 'is-stale' : fresh === 'empty' ? 'is-dim' : 'is-warn'}`}>
                {p.cached ? `v${p.version} · ${p.ttl}s` : 'empty'}
              </span>
            </div>
          );
        })}
        <div className="cpv-metric">
          <span className="cpv-metric-label">stale served</span>
          <span className={`cpv-metric-value ${current.staleServed > 0 ? 'is-stale' : ''}`}>{current.staleServed}</span>
        </div>
        <div className="cpv-metric">
          <span className="cpv-metric-label">last result</span>
          <span className={`cpv-metric-value ${readRes ? `is-${readRes.kind === 'hit-fresh' ? 'fresh' : readRes.kind === 'hit-stale' ? 'stale' : 'warn'}` : ''}`}>
            {readRes
              ? (readRes.kind === 'hit-fresh' ? `HIT v${readRes.version} fresh`
                : readRes.kind === 'hit-stale' ? `HIT v${readRes.version} stale`
                : `MISS v${readRes.version}`)
              : '—'}
          </span>
        </div>
      </div>

      <div className="cpv-narration">
        <span className={`cpv-narration-label ${current.phase === 'read-stale' ? 'is-stale' : current.phase === 'purge' ? 'is-purge' : ''}`}>
          {current.phase === 'origin-update' ? 'update'
            : current.phase.startsWith('read') ? 'request'
            : current.phase === 'purge' ? 'purge'
            : current.phase === 'ttl-tick' ? 'ttl'
            : current.phase === 'swr-revalidate' ? 'revalidate'
            : 'setup'}
        </span>
        <span className="cpv-narration-body">{current.note}</span>
      </div>

      <div className="cpv-legend">
        <span className="cpv-legend-item"><span className="cpv-swatch is-fresh" /> fresh hit</span>
        <span className="cpv-legend-item"><span className="cpv-swatch is-stale" /> stale hit</span>
        <span className="cpv-legend-item"><span className="cpv-swatch is-miss" /> miss → origin</span>
        <span className="cpv-legend-item"><span className="cpv-swatch is-purge" /> purge / invalidate</span>
      </div>
    </div>
  );
}
