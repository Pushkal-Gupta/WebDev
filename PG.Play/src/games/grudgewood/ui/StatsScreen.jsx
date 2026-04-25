// StatsScreen — death tally, time, hats earned, biomes reached.

import { Icon } from '../../../icons.jsx';
import { HATS } from '../hats.js';

export default function StatsScreen({ save, onBack }) {
  const earned = Object.keys(save.hats).filter((k) => save.hats[k]).length;
  const trapKills = Object.entries(save.stats.traps || {});
  const fmt = (s) => {
    const m = Math.floor(s / 60), r = Math.floor(s - m * 60);
    return `${m}m ${r}s`;
  };
  return (
    <div className="gw-menu">
      <div className="gw-menu-card gw-menu-card--wide">
        <div className="gw-menu-title">Stats</div>
        <div className="gw-menu-sub">Bragging rights and confessions.</div>
        <div className="gw-stats-grid">
          <Stat label="Total deaths" value={save.stats.deaths} />
          <Stat label="Total time"   value={fmt(save.stats.runtime || 0)} />
          <Stat label="Hats earned"  value={`${earned} / ${Object.keys(HATS).length}`} />
          <Stat label="Furthest biome" value={save.furthestBiome} />
          <Stat label="Axe found" value={save.axeUnlocked ? 'Yes' : 'No'} />
        </div>
        <div className="gw-stats-deaths">
          <h4>Deaths by trap</h4>
          {trapKills.length === 0 ? (
            <div className="gw-stats-empty">None yet. Keep walking.</div>
          ) : (
            <ul>
              {trapKills.sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <li key={k}><span>{k}</span><span>{v}</span></li>
              ))}
            </ul>
          )}
        </div>
        <div className="gw-menu-foot">
          <button className="gw-link" onClick={onBack}><span className="gw-hud-icon">{Icon.back}</span> Back</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="gw-stat-card">
      <div className="gw-stat-label">{label}</div>
      <div className="gw-stat-value">{value}</div>
    </div>
  );
}
