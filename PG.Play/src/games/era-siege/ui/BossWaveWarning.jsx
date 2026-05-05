// BossWaveWarning — full-width banner that slides in 5 s before a
// boss wave fires, then again briefly when the champion actually
// spawns. Subscribes to the match bus so it survives mounts/unmounts
// without state leaking across matches.
//
// The banner sits below the action bar and above the canvas, so it's
// always visible regardless of what overlay is open.

import { useEffect, useRef, useState } from 'react';

const WARN_VISIBLE_MS = 4500;
const SPAWN_VISIBLE_MS = 1800;

export default function BossWaveWarning({ matchRef, matchReady }) {
  const [banner, setBanner] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const match = matchRef?.current;
    if (!match) return;
    const show = (next, ms) => {
      setBanner(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setBanner(null), ms);
    };
    const offWarn = match.bus.on('boss_wave_warning', (e) => {
      show({
        kind: 'warn',
        wave: (e.waveIndex | 0) + 1,
        unit: e.unitId || '',
      }, WARN_VISIBLE_MS);
    });
    const offSpawn = match.bus.on('boss_wave_spawned', (e) => {
      show({
        kind: 'spawned',
        wave: (e.waveIndex | 0) + 1,
        unit: e.unitId || '',
      }, SPAWN_VISIBLE_MS);
    });
    return () => {
      offWarn();
      offSpawn();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [matchRef, matchReady]);

  if (!banner) return null;
  const isWarn = banner.kind === 'warn';
  return (
    <div className={`es-boss-banner es-boss-banner-${banner.kind}`} role="alert">
      <span className="es-boss-tag">{isWarn ? 'WAVE INCOMING' : 'CHAMPION DEPLOYED'}</span>
      <span className="es-boss-msg">
        {isWarn
          ? `Wave ${banner.wave} — Champion ${prettyUnit(banner.unit)} approaches`
          : `Wave ${banner.wave} — Champion has entered the lane`}
      </span>
    </div>
  );
}

function prettyUnit(id) {
  if (!id) return '';
  return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
