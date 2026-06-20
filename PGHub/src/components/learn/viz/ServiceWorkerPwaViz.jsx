import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Download, Send, Wifi, WifiOff,
  ServerCog, HardDrive, Cloud, CheckCircle2, AlertTriangle, Inbox,
} from 'lucide-react';
import './ServiceWorkerPwaViz.css';

// Service worker as a programmable proxy between the page and the network.
//
// Every fetch the page makes is intercepted by the SW. The SW applies a CACHING
// STRATEGY: cache-first (serve the cached copy, fall back to the network on a
// miss) or network-first (try the network, fall back to the cache when offline).
// Toggle the connection OFFLINE and the network node goes dark — now the SW
// keeps the app alive by serving from cache; a resource that was never cached
// shows a hard miss. A POST while offline gets QUEUED into a background-sync
// store; flip back online and the queue drains to the network.
//
// The lifecycle strip (install -> activate -> controlling) runs once: install
// pre-caches the shell, activate clears old caches, and only a controlling SW
// intercepts fetches — before that the page talks to the network directly.

// Resources the page can request. `cached` flips true once install pre-caches
// the shell; `/api/feed` is dynamic and only enters the cache after a live
// network fetch, so it can miss while offline.
const RESOURCES = [
  { key: 'index.html', label: '/index.html', kind: 'shell', preCached: true },
  { key: 'app.js', label: '/app.js', kind: 'shell', preCached: true },
  { key: 'styles.css', label: '/styles.css', kind: 'shell', preCached: true },
  { key: 'api-feed', label: '/api/feed', kind: 'dynamic', preCached: false },
];

const LIFECYCLE = [
  { key: 'install', label: 'install', note: 'pre-cache the app shell' },
  { key: 'activate', label: 'activate', note: 'clear stale caches' },
  { key: 'controlling', label: 'controlling', note: 'intercepting fetches' },
];

const TICK_MS = 1100; // base interval; divided by speed
// Token travel is split into legs along the request path. Each leg is one tick.
const QUEUE_CAP = 5; // visible queued writes before the oldest collapses

function freshCache() {
  // Map resource key -> in cache? Pre-cached shell entries seed once installed.
  const m = {};
  RESOURCES.forEach((r) => { m[r.key] = false; });
  return m;
}

function freshState() {
  return {
    lifecycle: 0, // index into LIFECYCLE; 3 == fully controlling
    cache: freshCache(),
    online: true,
    // in-flight request animation
    flow: null, // { kind:'get'|'post', resKey, path:[...legs], leg, outcome, label }
    queue: [], // queued POST writes while offline: [{ id, label }]
    // counters
    served: 0,
    cacheHits: 0,
    netHits: 0,
    offlineServed: 0,
    misses: 0,
    queuedTotal: 0,
    flushed: 0,
    nextWriteId: 1,
    resIndex: 0, // round-robins GET targets deterministically
    note: 'Install the service worker, then fire a fetch. The SW sits between the page and the network and applies your chosen caching strategy to every request.',
    tone: 'init',
  };
}

// Build the path legs + outcome for a GET under the current strategy/online/cache.
// Legs are node ids the token visits in order; the last leg is where the response
// originates. outcome is one of 'cache' | 'network' | 'offline-cache' | 'miss'.
function planGet(resKey, strategy, online, cache) {
  const inCache = !!cache[resKey];
  if (strategy === 'cache-first') {
    if (inCache) {
      return { path: ['page', 'sw', 'cache', 'sw', 'page'], outcome: 'cache' };
    }
    // cache miss -> go to network
    if (online) {
      return { path: ['page', 'sw', 'network', 'sw', 'page'], outcome: 'network' };
    }
    return { path: ['page', 'sw', 'network'], outcome: 'miss' };
  }
  // network-first
  if (online) {
    return { path: ['page', 'sw', 'network', 'sw', 'page'], outcome: 'network' };
  }
  // offline -> fall back to cache
  if (inCache) {
    return { path: ['page', 'sw', 'cache', 'sw', 'page'], outcome: 'offline-cache' };
  }
  return { path: ['page', 'sw', 'cache'], outcome: 'miss' };
}

export default function ServiceWorkerPwaViz() {
  const [strategy, setStrategy] = useState('cache-first');
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [st, setSt] = useState(() => freshState());

  const runTimer = useRef(null);
  const stratRef = useRef(strategy);
  const autoRef = useRef(autoplay);
  useEffect(() => { stratRef.current = strategy; }, [strategy]);
  useEffect(() => { autoRef.current = autoplay; }, [autoplay]);

  const delay = useMemo(() => Math.round(TICK_MS / Math.max(speed, 0.1)), [speed]);

  const installed = st.lifecycle >= LIFECYCLE.length;

  // ---- pure state transitions (no Math.random — deterministic) ----

  // Advance one lifecycle phase; on install, pre-cache the shell.
  const stepLifecycle = (prev) => {
    if (prev.lifecycle >= LIFECYCLE.length) return prev;
    const s = { ...prev, cache: { ...prev.cache } };
    const phase = LIFECYCLE[s.lifecycle];
    if (phase.key === 'install') {
      RESOURCES.forEach((r) => { if (r.preCached) s.cache[r.key] = true; });
      s.note = 'Install fired: the service worker pre-caches the app shell (/index.html, /app.js, /styles.css). Those now live in the cache store, ready to serve offline.';
    } else if (phase.key === 'activate') {
      s.note = 'Activate fired: the SW clears any stale caches from older versions. It is registered but does not yet control the page.';
    }
    s.lifecycle += 1;
    if (s.lifecycle >= LIFECYCLE.length) {
      s.tone = 'run';
      s.note = 'The service worker is now controlling the page. From here every fetch is intercepted by the SW before it ever reaches the network.';
    } else {
      s.tone = 'run';
    }
    return s;
  };

  // Start a GET. If the SW is not controlling yet, the page hits the network
  // directly (no interception). Otherwise the SW applies the strategy.
  const startGet = (prev) => {
    if (prev.flow) return prev;
    const s = { ...prev, cache: { ...prev.cache } };
    const res = RESOURCES[s.resIndex % RESOURCES.length];
    s.resIndex += 1;
    const controlling = s.lifecycle >= LIFECYCLE.length;

    if (!controlling) {
      // page -> network directly (or fail offline)
      if (s.online) {
        s.flow = { kind: 'get', resKey: res.key, label: res.label, path: ['page', 'network', 'page'], leg: 0, outcome: 'uncontrolled' };
        s.note = `No service worker is controlling the page yet, so the GET ${res.label} goes straight to the network. Install the SW to start intercepting.`;
        s.tone = 'warn';
      } else {
        s.flow = { kind: 'get', resKey: res.key, label: res.label, path: ['page', 'network'], leg: 0, outcome: 'miss' };
        s.note = `Offline and no SW controlling the page: GET ${res.label} hits a dead network and fails. This is exactly what a service worker is meant to prevent.`;
        s.tone = 'bad';
      }
      return s;
    }

    const plan = planGet(res.key, stratRef.current, s.online, s.cache);
    s.flow = { kind: 'get', resKey: res.key, label: res.label, path: plan.path, leg: 0, outcome: plan.outcome };
    const stratName = stratRef.current === 'cache-first' ? 'cache-first' : 'network-first';
    if (plan.outcome === 'miss') {
      s.note = `GET ${res.label} under ${stratName}: offline and ${res.label} was never cached, so the SW has nothing to serve — a hard miss. Dynamic data like this needs at least one online fetch first.`;
    } else if (plan.outcome === 'offline-cache') {
      s.note = `Offline. The SW tried the network, found it dark, and fell back to the cached copy of ${res.label}. The app keeps working with no connection.`;
    } else if (plan.outcome === 'cache') {
      s.note = `GET ${res.label} under cache-first: the SW finds it already in the cache and serves it instantly — no network round trip.`;
    } else {
      s.note = `GET ${res.label} under network-first: the SW goes to the network for the freshest copy, returns it, and writes it back into the cache.`;
    }
    s.tone = plan.outcome === 'miss' ? 'bad' : 'run';
    return s;
  };

  // Start a POST (write). Online -> straight to network. Offline -> queued for
  // background sync.
  const startPost = (prev) => {
    if (prev.flow) return prev;
    const s = { ...prev, queue: [...prev.queue] };
    const controlling = s.lifecycle >= LIFECYCLE.length;
    if (s.online) {
      s.flow = { kind: 'post', resKey: null, label: 'POST /comment', path: ['page', 'sw', 'network'], leg: 0, outcome: 'write-net' };
      s.note = controlling
        ? 'POST /comment while online: the SW passes the write straight through to the network. It commits immediately.'
        : 'POST /comment while online goes to the network and commits.';
      s.tone = 'run';
      if (!controlling) s.flow.path = ['page', 'network'];
    } else {
      const id = s.nextWriteId;
      s.nextWriteId += 1;
      s.flow = { kind: 'post', resKey: null, label: `POST /comment #${id}`, path: ['page', 'sw', 'queue'], leg: 0, outcome: 'queued', writeId: id };
      s.note = `Offline write: the SW cannot reach the network, so POST /comment #${id} is QUEUED for background sync. The user sees it accepted; it will flush when the connection returns.`;
      s.tone = 'warn';
    }
    return s;
  };

  // Advance the in-flight token one leg. When it reaches the end, commit the
  // outcome to counters and clear the flow.
  const advanceFlow = (prev) => {
    const f = prev.flow;
    if (!f) return prev;
    if (f.leg < f.path.length - 1) {
      return { ...prev, flow: { ...f, leg: f.leg + 1 } };
    }
    // commit outcome
    const s = { ...prev, cache: { ...prev.cache }, queue: [...prev.queue], flow: null };
    if (f.kind === 'get') {
      if (f.outcome === 'cache') {
        s.served += 1; s.cacheHits += 1;
      } else if (f.outcome === 'network') {
        s.served += 1; s.netHits += 1; s.cache[f.resKey] = true; // network read warms the cache
      } else if (f.outcome === 'offline-cache') {
        s.served += 1; s.cacheHits += 1; s.offlineServed += 1;
      } else if (f.outcome === 'uncontrolled') {
        s.served += 1; s.netHits += 1; s.cache[f.resKey] = true;
      } else if (f.outcome === 'miss') {
        s.misses += 1;
      }
    } else if (f.kind === 'post') {
      if (f.outcome === 'write-net') {
        s.netHits += 1;
      } else if (f.outcome === 'queued') {
        s.queue = [...s.queue, { id: f.writeId, label: `#${f.writeId}` }].slice(-QUEUE_CAP);
        s.queuedTotal += 1;
      }
    }
    return s;
  };

  // Flush one queued write to the network (called repeatedly when back online).
  const flushOne = (prev) => {
    if (prev.flow || prev.queue.length === 0 || !prev.online) return prev;
    const s = { ...prev, queue: [...prev.queue] };
    const item = s.queue[0];
    s.flow = { kind: 'post', resKey: null, label: `flush ${item.label}`, path: ['queue', 'sw', 'network'], leg: 0, outcome: 'flush', flushId: item.id };
    s.queue = s.queue.slice(1);
    s.flushed += 1;
    s.note = `Back online: background sync drains the queue, replaying queued write ${item.label} to the network. ${s.queue.length} still pending.`;
    s.tone = 'run';
    return s;
  };

  // One scheduler tick: prioritise finishing an in-flight flow, then draining a
  // queue when online, otherwise (autoplay) kick a new GET.
  const tick = (prev) => {
    if (prev.flow) return advanceFlow(prev);
    if (prev.online && prev.queue.length > 0) return flushOne(prev);
    if (autoRef.current) {
      if (prev.lifecycle < LIFECYCLE.length) return stepLifecycle(prev);
      return startGet(prev);
    }
    return prev;
  };

  useEffect(() => {
    if (!autoplay && st.queue.length === 0) return undefined;
    // run the interval whenever autoplay is on OR there is work to drain/animate
    const needsTimer = autoplay || st.flow != null || (st.online && st.queue.length > 0);
    if (!needsTimer) return undefined;
    runTimer.current = setInterval(() => setSt((prev) => tick(prev)), delay);
    return () => {
      if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    };
    // tick reads live config via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, delay, st.flow, st.online, st.queue.length]);

  useEffect(() => () => { if (runTimer.current) clearInterval(runTimer.current); }, []);

  // ---- manual controls ----
  const doInstall = () => setSt((prev) => stepLifecycle(prev));
  const doFetch = () => setSt((prev) => startGet(prev));
  const doWrite = () => setSt((prev) => startPost(prev));
  const toggleOnline = () => setSt((prev) => {
    const next = { ...prev, online: !prev.online };
    if (next.online && prev.queue.length > 0) {
      next.note = `Connection restored. ${prev.queue.length} queued write${prev.queue.length === 1 ? '' : 's'} will now flush to the network via background sync.`;
      next.tone = 'run';
    } else if (!next.online) {
      next.note = 'Offline. The network node is dark — network requests fail. The SW now serves cached resources and queues any writes for later.';
      next.tone = 'warn';
    }
    return next;
  });
  const toggleAutoplay = () => setAutoplay((v) => !v);
  const reset = () => {
    setAutoplay(false);
    if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    setSt(freshState());
  };
  const pickStrategy = (s) => setStrategy(s);

  // ---- derived ----
  const cachedCount = RESOURCES.filter((r) => st.cache[r.key]).length;
  const hitRate = st.served > 0 ? Math.round((st.cacheHits / st.served) * 100) : 0;
  const flow = st.flow;
  const flowNode = flow ? flow.path[flow.leg] : null;

  // ---- SVG geometry ----
  const W = 960;
  const H = 470;

  // node centres
  const pageC = { x: 130, y: 200 };
  const swC = { x: 420, y: 200 };
  const netC = { x: 720, y: 110 };
  const cacheC = { x: 720, y: 290 };
  const queueC = { x: 420, y: 392 };

  const nodeXY = (id) => ({
    page: pageC, sw: swC, network: netC, cache: cacheC, queue: queueC,
  }[id] || swC);

  const boxW = 150;
  const boxH = 86;
  const halfW = boxW / 2;
  const halfH = boxH / 2;

  // token position: interpolate between the previous and current leg nodes so it
  // glides along the edge. Deterministic — no random.
  const token = (() => {
    if (!flow) return null;
    const cur = nodeXY(flow.path[flow.leg]);
    const prevLeg = flow.leg > 0 ? nodeXY(flow.path[flow.leg - 1]) : cur;
    // draw the token AT the current node (already advanced); show a faint trail
    return { x: cur.x, y: cur.y, fromX: prevLeg.x, fromY: prevLeg.y };
  })();

  const tone = st.tone;
  const narrTone = tone === 'bad' ? 'is-bad' : tone === 'warn' ? 'is-warn' : '';
  const narrLabel = tone === 'bad' ? 'fail' : tone === 'warn' ? 'queued' : tone === 'init' ? 'ready' : 'flow';

  // node active highlight
  const isActive = (id) => flowNode === id;
  // an edge is "live" if the token is currently on its destination node and the
  // previous leg was the source.
  const edgeLive = (a, b) => {
    if (!flow || flow.leg === 0) return false;
    return flow.path[flow.leg - 1] === a && flow.path[flow.leg] === b;
  };

  return (
    <div className="swp">
      <div className="swp-head">
        <h3 className="swp-title">Service worker — a programmable proxy for every fetch</h3>
        <p className="swp-sub">
          The service worker sits between the page and the network. Fire a fetch and watch it apply your
          caching strategy; go offline and the SW serves from cache and queues writes until the connection returns.
        </p>
      </div>

      <div className="swp-controls">
        <div className="swp-seg" role="group" aria-label="Caching strategy">
          <button
            type="button"
            className={`swp-seg-btn ${strategy === 'cache-first' ? 'is-on' : ''}`}
            onClick={() => pickStrategy('cache-first')}
            aria-pressed={strategy === 'cache-first'}
            title="Serve from cache, fall back to the network on a miss"
          >
            cache-first
          </button>
          <button
            type="button"
            className={`swp-seg-btn ${strategy === 'network-first' ? 'is-on' : ''}`}
            onClick={() => pickStrategy('network-first')}
            aria-pressed={strategy === 'network-first'}
            title="Try the network, fall back to the cache when offline"
          >
            network-first
          </button>
        </div>

        <button
          type="button"
          className={`swp-toggle ${st.online ? 'is-on' : 'is-on is-bad'}`}
          onClick={toggleOnline}
          aria-pressed={!st.online}
          title="Toggle the network connection"
        >
          {st.online ? <Wifi size={13} /> : <WifiOff size={13} />}
          {st.online ? 'online' : 'offline'}
        </button>

        <label className="swp-speed">
          <span className="swp-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="swp-speed-range" aria-label="Animation speed"
          />
          <span className="swp-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="swp-spacer" aria-hidden="true" />

        <div className="swp-buttons">
          <button
            type="button"
            className="swp-btn"
            onClick={doInstall}
            disabled={installed}
            title={installed ? 'The service worker is already controlling the page' : 'Advance the service worker lifecycle'}
          >
            <Download size={14} /> {installed ? 'Installed' : 'Install SW'}
          </button>
          <button
            type="button"
            className="swp-btn swp-btn-primary"
            onClick={doFetch}
            disabled={!!flow}
            title="Fire a GET request through the service worker"
          >
            <Send size={14} /> Fetch (GET)
          </button>
          <button
            type="button"
            className="swp-btn"
            onClick={doWrite}
            disabled={!!flow}
            title="Fire a POST — queued for background sync when offline"
          >
            <Inbox size={14} /> Write (POST)
          </button>
          <button
            type="button"
            className={`swp-btn ${autoplay ? 'swp-btn-on' : ''}`}
            onClick={toggleAutoplay}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Stop' : 'Auto stream'}
          </button>
          <button type="button" className="swp-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* lifecycle strip */}
      <div className="swp-lifecycle" role="group" aria-label="Service worker lifecycle">
        {LIFECYCLE.map((p, i) => {
          const done = st.lifecycle > i;
          const current = st.lifecycle === i;
          return (
            <React.Fragment key={p.key}>
              <div className={`swp-life ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}>
                <span className="swp-life-dot">
                  {done ? <CheckCircle2 size={13} /> : <ServerCog size={13} />}
                </span>
                <span className="swp-life-text">
                  <span className="swp-life-label">{p.label}</span>
                  <span className="swp-life-note">{p.note}</span>
                </span>
              </div>
              {i < LIFECYCLE.length - 1 && <span className={`swp-life-sep ${st.lifecycle > i ? 'is-done' : ''}`} />}
            </React.Fragment>
          );
        })}
        <span className={`swp-life-state ${installed ? 'is-ok' : ''}`}>
          {installed ? 'controlling fetches' : `phase ${Math.min(st.lifecycle + 1, LIFECYCLE.length)} / ${LIFECYCLE.length}`}
        </span>
      </div>

      <div className="swp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="swp-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="swp-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="swp-ah" />
            </marker>
            <marker id="swp-arr-live" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="swp-ah is-live" />
            </marker>
          </defs>

          {/* ---- edges ---- */}
          {/* page <-> sw */}
          <line
            className={`swp-edge ${edgeLive('page', 'sw') || edgeLive('sw', 'page') ? 'is-live' : ''}`}
            x1={pageC.x + halfW} y1={pageC.y}
            x2={swC.x - halfW} y2={swC.y}
            markerEnd={edgeLive('page', 'sw') || edgeLive('sw', 'page') ? 'url(#swp-arr-live)' : 'url(#swp-arr)'}
          />
          {/* page -> network (uncontrolled bypass) */}
          {flow && (flow.path.includes('network') && flow.path[0] === 'page' && !flow.path.includes('sw')) && (
            <line
              className={`swp-edge is-bypass ${edgeLive('page', 'network') ? 'is-live' : ''}`}
              x1={pageC.x + halfW} y1={pageC.y - 20}
              x2={netC.x - halfW} y2={netC.y + halfH}
              markerEnd="url(#swp-arr-live)"
            />
          )}
          {/* sw <-> network */}
          <line
            className={`swp-edge ${st.online ? '' : 'is-dead'} ${edgeLive('sw', 'network') || edgeLive('network', 'sw') ? 'is-live' : ''}`}
            x1={swC.x + halfW} y1={swC.y - 24}
            x2={netC.x - halfW} y2={netC.y + halfH - 8}
            markerEnd={edgeLive('sw', 'network') || edgeLive('network', 'sw') ? 'url(#swp-arr-live)' : 'url(#swp-arr)'}
          />
          {/* sw <-> cache */}
          <line
            className={`swp-edge ${edgeLive('sw', 'cache') || edgeLive('cache', 'sw') ? 'is-live' : ''}`}
            x1={swC.x + halfW} y1={swC.y + 24}
            x2={cacheC.x - halfW} y2={cacheC.y - halfH + 8}
            markerEnd={edgeLive('sw', 'cache') || edgeLive('cache', 'sw') ? 'url(#swp-arr-live)' : 'url(#swp-arr)'}
          />
          {/* sw <-> queue */}
          <line
            className={`swp-edge ${edgeLive('sw', 'queue') || edgeLive('queue', 'sw') ? 'is-live' : ''}`}
            x1={swC.x} y1={swC.y + halfH}
            x2={queueC.x} y2={queueC.y - halfH}
            markerEnd={edgeLive('sw', 'queue') || edgeLive('queue', 'sw') ? 'url(#swp-arr-live)' : 'url(#swp-arr)'}
          />
          {/* queue -> network (flush) */}
          {flow && flow.outcome === 'flush' && (
            <line
              className={`swp-edge is-flush ${edgeLive('queue', 'sw') || edgeLive('sw', 'network') ? 'is-live' : ''}`}
              x1={queueC.x + halfW - 6} y1={queueC.y - 10}
              x2={netC.x - halfW + 6} y2={netC.y + halfH}
              markerEnd="url(#swp-arr-live)"
            />
          )}

          {/* ---- page node ---- */}
          <g className={`swp-node ${isActive('page') ? 'is-active' : ''}`}>
            <rect className="swp-box is-page" x={pageC.x - halfW} y={pageC.y - halfH} width={boxW} height={boxH} rx={11} />
            <text className="swp-box-title" x={pageC.x} y={pageC.y - 18} textAnchor="middle">Page</text>
            <text className="swp-box-sub" x={pageC.x} y={pageC.y + 2} textAnchor="middle">browser tab</text>
            <text className="swp-box-meta" x={pageC.x} y={pageC.y + 22} textAnchor="middle">makes fetch() calls</text>
          </g>

          {/* ---- service worker node ---- */}
          <g className={`swp-node ${isActive('sw') ? 'is-active' : ''}`}>
            <rect className={`swp-box is-sw ${installed ? 'is-controlling' : 'is-idle'}`} x={swC.x - halfW} y={swC.y - halfH} width={boxW} height={boxH} rx={11} />
            <g transform={`translate(${swC.x - 10}, ${swC.y - halfH + 12})`}>
              <ServerCog width={18} height={18} className="swp-box-ic is-sw" />
            </g>
            <text className="swp-box-title" x={swC.x} y={swC.y + 6} textAnchor="middle">Service Worker</text>
            <text className="swp-box-meta" x={swC.x} y={swC.y + 24} textAnchor="middle">
              {installed ? `${strategy}` : 'not controlling yet'}
            </text>
          </g>

          {/* ---- network node ---- */}
          <g className={`swp-node ${isActive('network') ? 'is-active' : ''}`}>
            <rect className={`swp-box is-net ${st.online ? '' : 'is-dark'}`} x={netC.x - halfW} y={netC.y - halfH} width={boxW} height={boxH} rx={11} />
            <g transform={`translate(${netC.x - 10}, ${netC.y - halfH + 12})`}>
              {st.online
                ? <Cloud width={18} height={18} className="swp-box-ic is-net" />
                : <WifiOff width={18} height={18} className="swp-box-ic is-dead" />}
            </g>
            <text className="swp-box-title" x={netC.x} y={netC.y + 6} textAnchor="middle">Network</text>
            <text className={`swp-box-meta ${st.online ? '' : 'is-dead'}`} x={netC.x} y={netC.y + 24} textAnchor="middle">
              {st.online ? 'origin server' : 'offline — dark'}
            </text>
            {!st.online && (
              <g className="swp-x">
                <line x1={netC.x - 18} y1={netC.y - 14} x2={netC.x + 18} y2={netC.y + 18} />
                <line x1={netC.x + 18} y1={netC.y - 14} x2={netC.x - 18} y2={netC.y + 18} />
              </g>
            )}
          </g>

          {/* ---- cache node ---- */}
          <g className={`swp-node ${isActive('cache') ? 'is-active' : ''}`}>
            <rect className="swp-box is-cache" x={cacheC.x - halfW} y={cacheC.y - halfH} width={boxW} height={boxH} rx={11} />
            <g transform={`translate(${cacheC.x - 10}, ${cacheC.y - halfH + 11})`}>
              <HardDrive width={18} height={18} className="swp-box-ic is-cache" />
            </g>
            <text className="swp-box-title" x={cacheC.x} y={cacheC.y + 2} textAnchor="middle">Cache store</text>
            <text className="swp-box-meta" x={cacheC.x} y={cacheC.y + 20} textAnchor="middle">{`${cachedCount} / ${RESOURCES.length} cached`}</text>
          </g>

          {/* cached resource chips under the cache */}
          {RESOURCES.map((r, i) => {
            const chipW = 150;
            const cx = cacheC.x + halfW + 18;
            const cy = cacheC.y - halfH + 6 + i * 19;
            const cached = st.cache[r.key];
            return (
              <g key={r.key}>
                <rect className={`swp-chip ${cached ? 'is-cached' : ''}`} x={cx} y={cy} width={chipW} height={15} rx={4} />
                <text className={`swp-chip-t ${cached ? 'is-cached' : ''}`} x={cx + 7} y={cy + 11} textAnchor="start">
                  {`${r.label}${cached ? ' (cached)' : ''}`}
                </text>
              </g>
            );
          })}

          {/* ---- queue / background sync node ---- */}
          <g className={`swp-node ${isActive('queue') ? 'is-active' : ''}`}>
            <rect className={`swp-box is-queue ${st.queue.length > 0 ? 'is-pending' : ''}`} x={queueC.x - halfW} y={queueC.y - halfH} width={boxW} height={boxH} rx={11} />
            <g transform={`translate(${queueC.x - halfW + 12}, ${queueC.y - halfH + 11})`}>
              <Inbox width={16} height={16} className="swp-box-ic is-queue" />
            </g>
            <text className="swp-box-title" x={queueC.x - halfW + 36} y={queueC.y - halfH + 23} textAnchor="start">sync queue</text>
            <text className="swp-box-meta" x={queueC.x} y={queueC.y + 6} textAnchor="middle">
              {st.queue.length > 0 ? `${st.queue.length} write${st.queue.length === 1 ? '' : 's'} pending` : 'empty — flushed'}
            </text>
          </g>
          {/* queued write chips stacked to the right of the queue box */}
          {st.queue.map((q, i) => {
            const qx = queueC.x + halfW + 10 + i * 30;
            const qy = queueC.y - 9;
            return (
              <g key={q.id}>
                <rect className="swp-qchip" x={qx} y={qy} width={26} height={18} rx={4} />
                <text className="swp-qchip-t" x={qx + 13} y={qy + 13} textAnchor="middle">{q.label}</text>
              </g>
            );
          })}

          {/* ---- request token ---- */}
          {token && (
            <g className="swp-token-g">
              <line className="swp-token-trail" x1={token.fromX} y1={token.fromY} x2={token.x} y2={token.y} />
              <circle
                className={`swp-token ${flow.kind === 'post' ? 'is-write' : ''} ${flow.outcome === 'miss' ? 'is-miss' : ''} ${flow.outcome === 'queued' ? 'is-queued' : ''}`}
                cx={token.x}
                cy={token.y}
                r={13}
              />
              <text className="swp-token-t" x={token.x} y={token.y + 4} textAnchor="middle">
                {flow.kind === 'post' ? 'W' : 'R'}
              </text>
            </g>
          )}

          {/* labels for the two paths into the right column */}
          <text className="swp-edge-label" x={(swC.x + netC.x) / 2 + 6} y={(swC.y + netC.y) / 2 - 18} textAnchor="middle">network</text>
          <text className="swp-edge-label" x={(swC.x + cacheC.x) / 2 + 6} y={(swC.y + cacheC.y) / 2 + 26} textAnchor="middle">cache</text>

          {/* in-flight banner */}
          {flow && (
            <text className="swp-flow-banner" x={W / 2} y={H - 12} textAnchor="middle">
              {`${flow.label} → ${flow.outcome === 'cache' ? 'served from cache'
                : flow.outcome === 'offline-cache' ? 'served from cache (offline)'
                  : flow.outcome === 'network' ? 'served from network'
                    : flow.outcome === 'write-net' ? 'written to network'
                      : flow.outcome === 'queued' ? 'queued for sync'
                        : flow.outcome === 'flush' ? 'flushing to network'
                          : flow.outcome === 'uncontrolled' ? 'straight to network (no SW)'
                            : 'miss — nothing to serve'}`}
            </text>
          )}
        </svg>
      </div>

      <div className="swp-metrics">
        <div className="swp-metric">
          <span className="swp-metric-label">requests served</span>
          <span className="swp-metric-value">{st.served}</span>
        </div>
        <div className="swp-metric">
          <span className="swp-metric-label">cache hits</span>
          <span className={`swp-metric-value ${st.cacheHits > 0 ? 'is-ok' : ''}`}>{st.cacheHits}</span>
        </div>
        <div className="swp-metric">
          <span className="swp-metric-label">network hits</span>
          <span className={`swp-metric-value ${st.netHits > 0 ? 'is-sky' : ''}`}>{st.netHits}</span>
        </div>
        <div className="swp-metric">
          <span className="swp-metric-label">served offline</span>
          <span className={`swp-metric-value ${st.offlineServed > 0 ? 'is-ok' : ''}`}>{st.offlineServed}</span>
        </div>
        <div className="swp-metric">
          <span className="swp-metric-label">cache hit rate</span>
          <span className="swp-metric-value">{`${hitRate}%`}</span>
        </div>
        <div className="swp-metric">
          <span className="swp-metric-label">misses</span>
          <span className={`swp-metric-value ${st.misses > 0 ? 'is-bad' : ''}`}>{st.misses}</span>
        </div>
        <div className="swp-metric">
          <span className="swp-metric-label">queued / flushed</span>
          <span className={`swp-metric-value ${st.queue.length > 0 ? 'is-warn' : ''}`}>{`${st.queue.length} / ${st.flushed}`}</span>
        </div>
        <div className="swp-metric swp-metric-dim">
          <span className="swp-metric-label">lifecycle</span>
          <span className={`swp-metric-value ${installed ? 'is-ok' : ''}`}>{installed ? 'controlling' : LIFECYCLE[Math.min(st.lifecycle, LIFECYCLE.length - 1)].label}</span>
        </div>
      </div>

      <div className={`swp-narration ${narrTone}`}>
        <span className={`swp-narration-label ${tone === 'bad' ? 'is-bad' : tone === 'warn' ? 'is-warn' : tone === 'run' ? 'is-ok' : ''}`}>
          {narrLabel}
        </span>
        <span className="swp-narration-body">{st.note}</span>
      </div>

      <div className="swp-legend">
        <span className="swp-legend-item"><ServerCog size={13} className="swp-ic is-violet" /> service worker — proxies every fetch</span>
        <span className="swp-legend-item"><HardDrive size={13} className="swp-ic is-ok" /> cache hit — served without the network</span>
        <span className="swp-legend-item"><Cloud size={13} className="swp-ic is-sky" /> network — live origin fetch</span>
        <span className="swp-legend-item"><Inbox size={13} className="swp-ic is-warn" /> queued write — flushed when back online</span>
        <span className="swp-legend-item"><AlertTriangle size={13} className="swp-ic is-bad" /> miss — offline and uncached</span>
      </div>
    </div>
  );
}
