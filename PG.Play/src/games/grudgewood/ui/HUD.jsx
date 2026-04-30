// HUD — biome name, current distance, deaths, near-miss flash, death overlay.
// Pure presentational — driven by props from the main game state.

import { Icon } from '../../../icons.jsx';

export default function HUD({
  biomeName,
  distance,
  furthest,
  deaths,
  flashKey,
  deathState,
  onRetry,
  paused,
  toast,
}) {
  return (
    <div className="gw-hud" data-flash={flashKey || 0}>
      <div className="gw-hud-top">
        <div className="gw-hud-biome">
          <div className="gw-hud-biome-name">{biomeName}</div>
          <div className="gw-hud-biome-sub">
            {distance}m · best {Math.max(furthest || 0, distance || 0)}m
          </div>
        </div>
        <div className="gw-hud-stats">
          <div className="gw-hud-stat" title="Deaths">
            <span className="gw-hud-icon">{Icon.heartF}</span><span>{deaths}</span>
          </div>
          <div className="gw-hud-stat" title="Distance">
            <span className="gw-hud-icon">{Icon.bolt}</span><span>{distance}m</span>
          </div>
        </div>
      </div>

      {toast ? <div className="gw-toast">{toast}</div> : null}

      {deathState ? (
        <div className="gw-death">
          <div className="gw-death-card">
            <div className="gw-death-cause">{deathState.kind || 'You died.'}</div>
            <div className="gw-death-epitaph">{deathState.epitaph}</div>
            <div className="gw-death-meta">
              Reached {deathState.distance || 0}m · Respawn at {deathState.respawnAt || 0}m
            </div>
            <button className="gw-btn gw-btn--primary" onClick={onRetry} autoFocus>
              <span className="gw-hud-icon">{Icon.restart}</span> Retry — Space
            </button>
          </div>
        </div>
      ) : null}

      {paused && !deathState ? (
        <div className="gw-paused">PAUSED — press P to resume</div>
      ) : null}
    </div>
  );
}
