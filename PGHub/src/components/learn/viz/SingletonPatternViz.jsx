import React, { useMemo, useState } from 'react';
import { Plus, Box, Boxes, RotateCcw } from 'lucide-react';
import './SingletonPatternViz.css';

// Singleton: getInstance() lazily creates ONE object the first time, then hands
// that same reference to every later caller. `new Config()` instead makes a
// distinct object each time — a shared counter proves which calls see each other.

const CALL_SITES = ['ServiceA', 'ServiceB', 'ServiceC', 'Worker', 'Router'];

export default function SingletonPatternViz() {
  // The one shared instance lives here once created.
  const [instance, setInstance] = useState(null); // { addr, count }
  const [distinct, setDistinct] = useState([]);   // each `new` call -> its own object
  const [log, setLog] = useState([]);             // call-site -> which object it got
  const [note, setNote] = useState('getInstance() returns the SAME object to every caller. new builds a fresh one each time.');

  const callCount = log.length;

  const getInstance = () => {
    const site = CALL_SITES[callCount % CALL_SITES.length];
    if (instance === null) {
      const fresh = { addr: '0x1A0', count: 0 };
      setInstance(fresh);
      setLog((l) => [...l, { site, addr: fresh.addr, fresh: true, kind: 'singleton' }]);
      setNote(`getInstance() — first call: lazily constructs the one instance at ${fresh.addr}, caches it, returns it to ${site}.`);
    } else {
      setLog((l) => [...l, { site, addr: instance.addr, fresh: false, kind: 'singleton' }]);
      setNote(`getInstance() — instance already exists: ${site} receives the cached ${instance.addr}. No new object made.`);
    }
  };

  const bump = () => {
    if (instance === null) { setNote('no instance yet — call getInstance() first.'); return; }
    setInstance((inst) => ({ ...inst, count: inst.count + 1 }));
    setNote(`mutated shared state: count -> ${instance.count + 1}. EVERY holder of getInstance() sees this — it is one object.`);
  };

  const newObject = () => {
    const site = CALL_SITES[callCount % CALL_SITES.length];
    const addr = `0x${(0x2B0 + distinct.length * 0x40).toString(16).toUpperCase()}`;
    setDistinct((d) => [...d, { addr, count: 0 }]);
    setLog((l) => [...l, { site, addr, fresh: true, kind: 'new' }]);
    setNote(`new Config() — ${site} gets a brand-new distinct object at ${addr}. Its state is isolated from all others.`);
  };

  const reset = () => {
    setInstance(null);
    setDistinct([]);
    setLog([]);
    setNote('reset — no instance constructed yet.');
  };

  const singletonRefs = useMemo(() => log.filter((e) => e.kind === 'singleton'), [log]);

  // SVG geometry
  const W = 940;
  const H = 340;
  const siteX = 40;
  const siteW = 150;
  const singletonX = 470;
  const singletonY = 70;
  const distinctX = 720;

  return (
    <div className="spv">
      <div className="spv-head">
        <h3 className="spv-title">Singleton — one shared instance for every caller</h3>
        <p className="spv-sub">
          getInstance() lazily builds a single object the first time and returns that same reference forever
          after. Calling new makes a distinct object each time. A shared counter proves identity.
        </p>
      </div>

      <div className="spv-controls">
        <button type="button" className="spv-btn spv-btn-primary" onClick={getInstance}><Box size={14} /> getInstance()</button>
        <button type="button" className="spv-btn" onClick={bump} disabled={instance === null}><Plus size={14} /> instance.count++</button>
        <span className="spv-spacer" aria-hidden="true" />
        <button type="button" className="spv-btn" onClick={newObject}><Boxes size={14} /> new Config()</button>
        <button type="button" className="spv-btn" onClick={reset}><RotateCcw size={14} /> reset</button>
      </div>

      <div className="spv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="spv-svg" preserveAspectRatio="xMidYMid meet">
          {/* call sites */}
          <text className="spv-region-sub spv-anchor-start" x={siteX} y={40}>call sites</text>
          {singletonRefs.slice(-5).map((e, i) => {
            const y = 56 + i * 42;
            return (
              <g key={`site-${i}`}>
                <rect className="spv-site" x={siteX} y={y} width={siteW} height={32} rx={7} />
                <text className="spv-site-text" x={siteX + siteW / 2} y={y + 21}>{e.site}.cfg</text>
                <line className="spv-link" x1={siteX + siteW} y1={y + 16} x2={singletonX} y2={singletonY + 50} />
              </g>
            );
          })}
          {singletonRefs.length === 0 && (
            <text className="spv-region-empty spv-anchor-start" x={siteX} y={90}>none yet</text>
          )}

          {/* the single shared instance */}
          <text className="spv-region-sub" x={singletonX + 90} y={singletonY - 14}>the one instance</text>
          <rect className={`spv-singleton ${instance ? 'is-live' : ''}`} x={singletonX} y={singletonY} width={180} height={104} rx={10} />
          {instance ? (
            <>
              <text className="spv-singleton-addr" x={singletonX + 90} y={singletonY + 32}>{instance.addr}</text>
              <text className="spv-singleton-label" x={singletonX + 90} y={singletonY + 58}>shared count</text>
              <text className="spv-singleton-count" x={singletonX + 90} y={singletonY + 88}>{instance.count}</text>
            </>
          ) : (
            <text className="spv-region-empty" x={singletonX + 90} y={singletonY + 58}>not created</text>
          )}

          {/* distinct new objects */}
          <text className="spv-region-sub spv-anchor-start" x={distinctX} y={40}>new Config() objects</text>
          {distinct.slice(-5).map((o, i) => {
            const y = 56 + i * 42;
            return (
              <g key={`d-${i}`}>
                <rect className="spv-distinct" x={distinctX} y={y} width={170} height={32} rx={7} />
                <text className="spv-distinct-text" x={distinctX + 12} y={y + 21}>{o.addr} · count {o.count}</text>
              </g>
            );
          })}
          {distinct.length === 0 && (
            <text className="spv-region-empty spv-anchor-start" x={distinctX} y={90}>none</text>
          )}
        </svg>
      </div>

      <div className="spv-metrics">
        <div className="spv-metric">
          <span className="spv-metric-label">instance addr</span>
          <span className="spv-metric-value">{instance ? instance.addr : '—'}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">shared count</span>
          <span className="spv-metric-value is-count">{instance ? instance.count : '—'}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">getInstance calls</span>
          <span className="spv-metric-value is-calls">{singletonRefs.length}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">distinct new objects</span>
          <span className="spv-metric-value is-distinct">{distinct.length}</span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">all refs identical?</span>
          <span className="spv-metric-value is-same">{singletonRefs.length === 0 ? '—' : 'yes — same 0x1A0'}</span>
        </div>
      </div>

      <div className="spv-narration">
        <span className="spv-narration-label">trace</span>
        <span className="spv-narration-body">{note}</span>
      </div>
    </div>
  );
}
