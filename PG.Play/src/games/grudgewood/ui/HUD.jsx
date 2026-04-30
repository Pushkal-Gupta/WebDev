// HUD — biome name, current level, distance to next flag, deaths, and a
// loud death card that names exactly what killed you.

import { Icon } from '../../../icons.jsx';

// Spell out trap kinds in CAPS for the death card so the player can
// instantly read what hit them. The KIND_LABEL strings live in epitaphs.js
// for the supporting line — this map is just the headline noun.
const KIND_NOUN = {
  whip:     'BRANCH WHIP',
  snare:    'ROOT SNARE',
  mushroom: 'MUSHROOM POP',
  log:      'ROLLING LOG',
  pit:      'HIDDEN PIT',
  predator: 'PREDATOR TREE',
  stump:    'FAKE STUMP',
  embers:   'EMBER RAIN',
  wind:     'WIND GUST',
  acorn:    'ACORN CANNON',
  boar:     'CHARGING BOAR TREE',
  vine:     'CARNIVOROUS VINE',
  boulder:  'BOULDER DROP',
  geyser:   'TAR GEYSER',
  lash:     'BRANCH LASH COMBO',
  mirror:   'MIRROR TREE',
  unknown:  'THE FOREST',
};

export default function HUD({
  biomeName,
  level,
  nextLevel,
  toNextFlag,
  waypointAngle,
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
            Level {level || 0} · next flag {toNextFlag || 0}m
          </div>
        </div>
        <div className="gw-hud-stats">
          <div className="gw-hud-stat" title="Deaths">
            <span className="gw-hud-icon">{Icon.heartF}</span><span>{deaths}</span>
          </div>
          <div className="gw-hud-stat" title={`Flag ${nextLevel || 1}`}>
            <div
              className="gw-waypoint-arrow"
              style={{ transform: `rotate(${waypointAngle || 0}deg)` }}
              aria-label="Direction of next flag"
            />
            <span>{toNextFlag || 0}m</span>
          </div>
        </div>
      </div>

      {toast ? <div className="gw-toast">{toast}</div> : null}

      {deathState ? (
        <div className="gw-death">
          <div className="gw-death-card">
            <div className="gw-death-killed-by">KILLED BY</div>
            <div className="gw-death-trap-name">
              {KIND_NOUN[deathState.kindRaw] || KIND_NOUN.unknown}
            </div>
            <div className="gw-death-cause">{deathState.kindLabel || 'You died.'}</div>
            <div className="gw-death-epitaph">{deathState.epitaph}</div>
            <div className="gw-death-meta">
              Respawn at flag {deathState.level || 0}
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
