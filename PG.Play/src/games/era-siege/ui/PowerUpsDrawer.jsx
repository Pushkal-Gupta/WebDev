// PowerUpsDrawer — passive upgrade tree.
//
// 4 trees × 3 levels. Buying ramps cost; once maxed the row disables.
// Sim is paused while the drawer is open (the shell handles that).
//
// Each tree has an icon image at `public/games/era-siege/ui/upgrade-<id>.png`.
// If the image 404s, we fall back to a coloured chip — the colour comes
// from the powerup def (`def.color`).

import { useEffect } from 'react';
import { POWERUP_DEFS } from '../sim/powerups.js';

const ICON_BASE = '/games/era-siege/ui';

// Group the 7 powerup trees into readable sections in the drawer.
// Order matches gameplay flow: produce gold, fortify, sharpen combat,
// then specialise the troops the gold builds.
const SECTIONS = [
  { title: 'Production', ids: ['economy'] },
  { title: 'Defense',    ids: ['base'] },
  { title: 'Offense',    ids: ['special', 'turret'] },
  { title: 'Troops',     ids: ['troopDmg', 'troopHp', 'troopRng'] },
];

export default function PowerUpsDrawer({ open, gold, powerups, onBuy, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'u' || e.key === 'U') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="es-pu-scrim" role="dialog" aria-label="Power-ups">
      <aside className="es-pu-card" onClick={(e) => e.stopPropagation()}>
        <header className="es-pu-head">
          <div className="es-pu-head-text">
            <h2>Power-ups</h2>
            <p>Spend gold while the battle keeps going.</p>
          </div>
          <span className="es-pu-gold">{gold}g</span>
          <button
            type="button"
            className="es-pu-x"
            onClick={onClose}
            aria-label="Close power-ups">×</button>
        </header>

        <div className="es-pu-sections">
          {SECTIONS.map((sec) => {
            const defs = sec.ids.map((id) => POWERUP_DEFS.find((d) => d.id === id)).filter(Boolean);
            if (!defs.length) return null;
            return (
              <section key={sec.title} className="es-pu-section">
                <h3 className="es-pu-section-title">{sec.title}</h3>
                <div className="es-pu-grid">
                  {defs.map((def) => (
                    <PowerupRow
                      key={def.id}
                      def={def}
                      level={(powerups && powerups[def.id]) | 0}
                      gold={gold}
                      onBuy={() => onBuy(def.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="es-pu-foot">
          <span>Press <kbd>U</kbd> or <kbd>Esc</kbd> to close</span>
        </footer>
      </aside>
    </div>
  );
}

function PowerupRow({ def, level, gold, onBuy }) {
  const maxed = level >= def.levels.length;
  const next  = maxed ? null : def.levels[level];
  const canAfford = !!next && gold >= next.cost;
  return (
    <div className="es-pu-row" style={{ '--pu-color': def.color }}>
      <header className="es-pu-row-head">
        <PowerupIcon def={def}/>
        <div className="es-pu-row-text">
          <strong>{def.name}</strong>
          <span>{def.description}</span>
        </div>
      </header>

      <div className="es-pu-pips" aria-label={`Level ${level} of ${def.levels.length}`}>
        {def.levels.map((lvl, i) => (
          <span
            key={i}
            className={`es-pu-pip${i < level ? ' is-on' : ''}${i === level && !maxed ? ' is-next' : ''}`}
            title={lvl.effect}
          />
        ))}
      </div>

      <div className="es-pu-effect">
        {maxed ? <span>Maxed.</span> : <span>{next.effect}</span>}
      </div>

      <button
        type="button"
        className={`es-pu-buy${canAfford ? '' : ' is-disabled'}${maxed ? ' is-maxed' : ''}`}
        disabled={maxed || !canAfford}
        onClick={onBuy}>
        {maxed ? 'Maxed' : `${next.cost}g`}
      </button>
    </div>
  );
}

// Icon: try the PNG first, fall back to a coloured chip on 404. The
// fallback path keeps the UI from showing a broken-image glyph for
// trees whose art hasn't shipped yet.
function PowerupIcon({ def }) {
  // The new artwork (assets/era-siege/power_2.png cropped per-tree)
  // fills the tile with its own framed art, so we no longer want a
  // colored background bleeding through the edges. Fall back to the
  // colored chip only if the PNG fails to load.
  return (
    <span className="es-pu-icon" aria-hidden="true">
      <img
        src={`${ICON_BASE}/upgrade-${def.id}.png`}
        alt=""
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement.style.background = def.color;
        }}
      />
    </span>
  );
}
