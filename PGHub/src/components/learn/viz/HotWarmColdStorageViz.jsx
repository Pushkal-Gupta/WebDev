import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Plus, Clock, Search,
  Flame, Thermometer, Snowflake, Database, Zap,
} from 'lucide-react';
import './HotWarmColdStorageViz.css';

// Hot / warm / cold tiered storage — data ages by access-recency and migrates
// down the tiers; reads from cold pay a rehydrate penalty.
//
//   hot    SSD-class. Fast (single-digit ms), expensive per GB. Holds the most
//          recently accessed objects only.
//   warm   slower disk/object store. Medium latency, medium cost. Holds data
//          that has cooled past the hot window but is still occasionally read.
//   cold   archival (tape/Glacier-class). Cheap per GB, but a read must first
//          REHYDRATE the object — minutes of latency before bytes flow.
//
// Each object carries an "age" (ticks since last access). Advancing time cools
// every object; once age crosses a tier threshold it migrates DOWN. Reading an
// object resets its age to 0 and pulls it back UP to hot (promotion). Reading a
// cold object incurs the rehydrate delay in the readout. The cost/latency panel
// totals per-tier so the trade is visible live.

const TIERS = [
  { key: 'hot', label: 'hot', sub: 'SSD · recent', readMs: 4, costGB: 0.23, demoteAt: 3 },
  { key: 'warm', label: 'warm', sub: 'disk · occasional', readMs: 45, costGB: 0.05, demoteAt: 7 },
  { key: 'cold', label: 'cold', sub: 'archive · rare', readMs: 9000, costGB: 0.004, demoteAt: Infinity },
];
const TIER_INDEX = { hot: 0, warm: 1, cold: 2 };
const OBJ_SIZE_GB = [2, 4, 1, 3, 5, 2, 4, 3]; // deterministic sizes
const TICK_MS = 1100;

let OBJ_SEQ = 0;
function makeObj() {
  const id = ++OBJ_SEQ;
  return { id, sizeGB: OBJ_SIZE_GB[(id - 1) % OBJ_SIZE_GB.length], age: 0, tier: 'hot' };
}

function seedObjs() {
  OBJ_SEQ = 0;
  return [
    { id: ++OBJ_SEQ, sizeGB: 2, age: 0, tier: 'hot' },
    { id: ++OBJ_SEQ, sizeGB: 4, age: 4, tier: 'warm' },
    { id: ++OBJ_SEQ, sizeGB: 1, age: 9, tier: 'cold' },
  ];
}

function tierForAge(age) {
  if (age <= TIERS[0].demoteAt) return 'hot';
  if (age <= TIERS[1].demoteAt) return 'warm';
  return 'cold';
}

export default function HotWarmColdStorageViz() {
  const [objs, setObjs] = useState(() => seedObjs());
  const [time, setTime] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [lastRead, setLastRead] = useState(null); // { id, tier, ms, rehydrated }
  const [migrations, setMigrations] = useState(0);
  const [flash, setFlash] = useState({}); // objId -> 'down' | 'up'
  const [note, setNote] = useState('Write objects, then advance time — each object cools and migrates down to cheaper tiers. Read a recent object (hot, fast) or an old one (cold, slow rehydrate) and watch the latency change.');
  const [tone, setTone] = useState('init');

  const flashTimer = useRef(null);
  const runTimer = useRef(null);
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (runTimer.current) clearInterval(runTimer.current);
  }, []);

  const delay = useMemo(() => Math.round(TICK_MS / Math.max(speed, 0.1)), [speed]);

  const flashObj = (map) => {
    setFlash(map);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash({}), 900);
  };

  // age every object by one tick and migrate any that crossed a threshold down
  const advanceTime = () => {
    setTime((t) => t + 1);
    setObjs((prev) => {
      const flashMap = {};
      let migrated = 0;
      const next = prev.map((o) => {
        const age = o.age + 1;
        const newTier = tierForAge(age);
        if (TIER_INDEX[newTier] > TIER_INDEX[o.tier]) {
          flashMap[o.id] = 'down';
          migrated += 1;
        }
        return { ...o, age, tier: newTier };
      });
      if (migrated > 0) {
        setMigrations((m) => m + migrated);
        flashObj(flashMap);
        setTone('warn');
        setNote(`Time advanced — ${migrated} object${migrated === 1 ? '' : 's'} cooled past a tier threshold and migrated DOWN to cheaper, slower storage. Migration is automatic: the policy demotes anything not read recently enough.`);
      } else {
        setTone('run');
        setNote('Time advanced — every object aged by one tick but none crossed a tier boundary yet. Keep advancing and the oldest will slide from hot to warm to cold.');
      }
      return next;
    });
  };

  useEffect(() => {
    if (!autoplay) return undefined;
    runTimer.current = setInterval(advanceTime, delay);
    return () => {
      if (runTimer.current) { clearInterval(runTimer.current); runTimer.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- advanceTime uses functional setState; rebind only on autoplay/delay change
  }, [autoplay, delay]);

  const writeObj = () => {
    setObjs((prev) => [...prev, makeObj()]);
    setTone('ok');
    setNote('Wrote a fresh object straight into the HOT tier — newly written data is hot by definition. It stays here until it ages past the hot window without a read.');
  };

  // read promotes the object back to hot (age reset) but pays the latency of the
  // tier it was found in — cold means a rehydrate penalty first.
  const readObj = (id) => {
    setObjs((prev) => {
      const target = prev.find((o) => o.id === id);
      if (!target) return prev;
      const fromTier = target.tier;
      const tierDef = TIERS[TIER_INDEX[fromTier]];
      const rehydrated = fromTier === 'cold';
      setLastRead({ id, tier: fromTier, ms: tierDef.readMs, rehydrated });
      setTone(rehydrated ? 'warn' : 'ok');
      setNote(rehydrated
        ? `Read object #${id} from COLD. Archival storage can't serve directly — it must REHYDRATE first, so the read took ~${(tierDef.readMs / 1000).toFixed(1)}s instead of milliseconds. That latency is the price of the cheap per-GB cost. The object is now promoted back to hot.`
        : `Read object #${id} from ${fromTier.toUpperCase()} in ~${tierDef.readMs}ms. A recent read resets its age to zero and PROMOTES it back to hot, so the next read is fast — recency-based caching in action.`);
      if (fromTier !== 'hot') {
        flashObj({ [id]: 'up' });
      }
      return prev.map((o) => (o.id === id ? { ...o, age: 0, tier: 'hot' } : o));
    });
  };

  const reset = () => {
    setAutoplay(false);
    if (flashTimer.current) { clearTimeout(flashTimer.current); flashTimer.current = null; }
    setObjs(seedObjs());
    setTime(0);
    setLastRead(null);
    setMigrations(0);
    setFlash({});
    setNote('Write objects, then advance time — each object cools and migrates down to cheaper tiers. Read a recent object (hot, fast) or an old one (cold, slow rehydrate) and watch the latency change.');
    setTone('init');
  };

  // ---- per-tier aggregates ----
  const byTier = useMemo(() => {
    const m = { hot: [], warm: [], cold: [] };
    objs.forEach((o) => { m[o.tier].push(o); });
    return m;
  }, [objs]);

  const tierStats = TIERS.map((t) => {
    const items = byTier[t.key];
    const gb = items.reduce((a, o) => a + o.sizeGB, 0);
    const cost = gb * t.costGB;
    return { ...t, count: items.length, gb, cost };
  });
  const totalCost = tierStats.reduce((a, t) => a + t.cost, 0);

  // ---- SVG geometry ----
  const W = 960;
  const H = 380;
  const laneTop = 56;
  const laneH = 240;
  const laneGap = 18;
  const laneW = (W - 48 - 2 * laneGap) / 3;
  const laneX = (i) => 24 + i * (laneW + laneGap);

  const narrTone = tone === 'warn' ? 'is-warn' : tone === 'ok' ? 'is-ok' : '';

  const tierIcon = (k) => {
    if (k === 'hot') return <Flame width={15} height={15} className="hwc-tier-ic is-hot" />;
    if (k === 'warm') return <Thermometer width={15} height={15} className="hwc-tier-ic is-warm" />;
    return <Snowflake width={15} height={15} className="hwc-tier-ic is-cold" />;
  };

  return (
    <div className="hwc">
      <div className="hwc-head">
        <h3 className="hwc-title">Hot, warm, cold storage — data ages and migrates down</h3>
        <p className="hwc-sub">
          Write objects into the hot tier, advance time to watch them cool and migrate to cheaper storage,
          then read one back. A recent read is fast and promotes it; a read from cold pays a rehydrate
          penalty before any bytes flow.
        </p>
      </div>

      <div className="hwc-controls">
        <div className="hwc-buttons">
          <button type="button" className="hwc-btn hwc-btn-primary" onClick={writeObj}>
            <Plus size={14} /> Write object
          </button>
          <button type="button" className="hwc-btn" onClick={advanceTime}>
            <Clock size={14} /> Advance time
          </button>
          <button
            type="button" className={`hwc-btn ${autoplay ? 'hwc-btn-on' : ''}`}
            onClick={() => setAutoplay((v) => !v)}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
            {autoplay ? 'Stop clock' : 'Auto clock'}
          </button>
          <button type="button" className="hwc-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <label className="hwc-speed">
          <span className="hwc-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="hwc-speed-range" aria-label="Clock speed"
          />
          <span className="hwc-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="hwc-spacer" aria-hidden="true" />
        <span className="hwc-clock"><Clock size={13} /> t = {time}</span>
      </div>

      <div className="hwc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="hwc-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="hwc-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="hwc-ah" />
            </marker>
          </defs>

          {/* migrate-down arrows between lanes */}
          {[0, 1].map((i) => (
            <g key={`mig-${i}`}>
              <line
                className="hwc-migrate"
                x1={laneX(i) + laneW} y1={laneTop + 30}
                x2={laneX(i + 1)} y2={laneTop + 30}
                markerEnd="url(#hwc-arr)"
              />
              <text className="hwc-migrate-label" x={laneX(i) + laneW + laneGap / 2} y={laneTop + 20} textAnchor="middle">cools →</text>
            </g>
          ))}

          {TIERS.map((t, i) => {
            const x = laneX(i);
            const items = byTier[t.key];
            const st = tierStats[i];
            return (
              <g key={t.key}>
                <rect className={`hwc-lane is-${t.key}`} x={x} y={laneTop} width={laneW} height={laneH} rx={10} />
                <g transform={`translate(${x + 12}, ${laneTop + 12})`}>{tierIcon(t.key)}</g>
                <text className={`hwc-tier-label is-${t.key}`} x={x + 34} y={laneTop + 24} textAnchor="start">{t.label}</text>
                <text className="hwc-tier-sub" x={x + 34} y={laneTop + 38} textAnchor="start">{t.sub}</text>
                <text className={`hwc-tier-lat is-${t.key}`} x={x + laneW - 12} y={laneTop + 22} textAnchor="end">
                  {t.readMs >= 1000 ? `~${(t.readMs / 1000).toFixed(1)}s read` : `${t.readMs}ms read`}
                </text>
                <text className="hwc-tier-cost" x={x + laneW - 12} y={laneTop + 36} textAnchor="end">
                  {`$${t.costGB.toFixed(3)}/GB·mo`}
                </text>

                {/* objects as chips */}
                {items.length === 0 && (
                  <text className="hwc-empty" x={x + laneW / 2} y={laneTop + laneH / 2} textAnchor="middle">empty</text>
                )}
                {items.slice(0, 8).map((o, k) => {
                  const cols = 2;
                  const cx = x + 16 + (k % cols) * ((laneW - 32) / cols);
                  const cy = laneTop + 56 + Math.floor(k / cols) * 42;
                  const cw = (laneW - 32) / cols - 8;
                  const fl = flash[o.id];
                  const justRead = lastRead && lastRead.id === o.id;
                  return (
                    <g
                      key={o.id}
                      className="hwc-obj-g"
                      onClick={() => readObj(o.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <rect
                        className={`hwc-obj is-${t.key} ${fl === 'down' ? 'is-cooling' : ''} ${fl === 'up' ? 'is-promoting' : ''} ${justRead ? 'is-read' : ''}`}
                        x={cx} y={cy} width={cw} height={34} rx={6}
                      />
                      <text className="hwc-obj-id" x={cx + 8} y={cy + 15} textAnchor="start">#{o.id}</text>
                      <text className="hwc-obj-meta" x={cx + 8} y={cy + 27} textAnchor="start">{o.sizeGB}GB · age {o.age}</text>
                      <g transform={`translate(${cx + cw - 16}, ${cy + 10})`}>
                        <Search width={12} height={12} className="hwc-obj-read" />
                      </g>
                    </g>
                  );
                })}
                {items.length > 8 && (
                  <text className="hwc-more" x={x + laneW / 2} y={laneTop + laneH - 50} textAnchor="middle">+{items.length - 8} more</text>
                )}

                {/* per-tier footer stats */}
                <line className="hwc-lane-sep" x1={x + 10} y1={laneTop + laneH - 38} x2={x + laneW - 10} y2={laneTop + laneH - 38} />
                <text className="hwc-lane-stat" x={x + 14} y={laneTop + laneH - 22} textAnchor="start">
                  {`${st.count} obj · ${st.gb}GB`}
                </text>
                <text className={`hwc-lane-cost is-${t.key}`} x={x + laneW - 14} y={laneTop + laneH - 22} textAnchor="end">
                  {`$${st.cost.toFixed(2)}/mo`}
                </text>
              </g>
            );
          })}

          {/* read result banner */}
          {lastRead && (
            <g>
              <rect className={`hwc-read-banner ${lastRead.rehydrated ? 'is-slow' : 'is-fast'}`} x={24} y={H - 50} width={W - 48} height={36} rx={8} />
              <g transform={`translate(${38}, ${H - 41})`}>
                {lastRead.rehydrated
                  ? <Snowflake width={16} height={16} className="hwc-read-ic is-slow" />
                  : <Zap width={16} height={16} className="hwc-read-ic is-fast" />}
              </g>
              <text className={`hwc-read-text ${lastRead.rehydrated ? 'is-slow' : 'is-fast'}`} x={62} y={H - 28} textAnchor="start">
                {lastRead.rehydrated
                  ? `read #${lastRead.id} from cold → rehydrate ~${(lastRead.ms / 1000).toFixed(1)}s, then promoted to hot`
                  : `read #${lastRead.id} from ${lastRead.tier} → ~${lastRead.ms}ms, promoted to hot`}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="hwc-metrics">
        <div className="hwc-metric">
          <span className="hwc-metric-label">clock</span>
          <span className="hwc-metric-value">t = {time}</span>
        </div>
        <div className="hwc-metric">
          <span className="hwc-metric-label">objects</span>
          <span className="hwc-metric-value">{objs.length}</span>
        </div>
        <div className="hwc-metric">
          <span className="hwc-metric-label">migrations</span>
          <span className={`hwc-metric-value ${migrations > 0 ? 'is-warn' : ''}`}>{migrations}</span>
        </div>
        <div className="hwc-metric">
          <span className="hwc-metric-label">monthly cost</span>
          <span className="hwc-metric-value is-ok">${totalCost.toFixed(2)}</span>
        </div>
        <div className="hwc-metric hwc-metric-dim">
          <span className="hwc-metric-label">last read latency</span>
          <span className={`hwc-metric-value ${lastRead ? (lastRead.rehydrated ? 'is-warn' : 'is-ok') : ''}`}>
            {lastRead ? (lastRead.ms >= 1000 ? `${(lastRead.ms / 1000).toFixed(1)}s` : `${lastRead.ms}ms`) : '—'}
          </span>
        </div>
      </div>

      <div className={`hwc-narration ${narrTone}`}>
        <span className={`hwc-narration-label ${narrTone}`}>
          {tone === 'warn' ? 'cooled' : tone === 'ok' ? 'served' : 'ready'}
        </span>
        <span className="hwc-narration-body">{note}</span>
      </div>

      <div className="hwc-legend">
        <span className="hwc-legend-item"><Flame size={13} className="hwc-ic is-hot" /> hot — fast, expensive, most recent</span>
        <span className="hwc-legend-item"><Thermometer size={13} className="hwc-ic is-warm" /> warm — medium latency, medium cost</span>
        <span className="hwc-legend-item"><Snowflake size={13} className="hwc-ic is-cold" /> cold — cheap archive, slow rehydrate</span>
        <span className="hwc-legend-item"><Database size={13} className="hwc-ic" /> click an object to read it (resets age, promotes to hot)</span>
      </div>
    </div>
  );
}
