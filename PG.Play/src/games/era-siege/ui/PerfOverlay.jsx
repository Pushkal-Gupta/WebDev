// FPS + p99 overlay. Mounts only when ?perf is in the URL.

import { useEffect, useState } from 'react';

export default function PerfOverlay({ perfMon, deviceClass, lowFx }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, []);

  if (!perfMon) return null;
  const avg = perfMon.avgMs();
  const p99 = perfMon.p99Ms();
  const fps = avg > 0 ? Math.round(1000 / avg) : 0;
  return (
    <div className="es-perf" aria-hidden="true" data-tick={tick}>
      <div><b>{fps}</b> fps</div>
      <div>avg <b>{avg.toFixed(1)}</b>ms</div>
      <div>p99 <b>{p99.toFixed(1)}</b>ms</div>
      <div>{deviceClass}{lowFx ? ' · low-fx' : ''}</div>
    </div>
  );
}
