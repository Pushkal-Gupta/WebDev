// EraPreviewCards — horizontal strip of the 5 ages shown on the
// intro screen so the player knows what they're stepping into. Each
// card displays the era's name, blurb, the heavy unit's silhouette,
// the era palette accent, and the XP threshold to evolve into it.
//
// Pure presentational — reads from `content/eras.js` only. No bus
// access, no stats. Lives next to <EraSiegeIntroStats/> on the intro
// page.

import { ERAS, paletteFor } from '../content/eras.js';
import { getUnit } from '../content/units.js';
import { eraDisplayName } from '../utils/themeDisplay.js';
import '../styles.css';

export default function EraPreviewCards() {
  return (
    <section className="es-era-preview" aria-label="Era progression">
      <header className="es-era-preview-head">
        <h3>Five ages</h3>
        <span className="es-era-preview-sub">Evolve to unlock new troops, generals, turrets, and specials.</span>
      </header>
      <div className="es-era-preview-strip">
        {ERAS.map((era) => (
          <EraCard key={era.id} era={era}/>
        ))}
      </div>
    </section>
  );
}

function EraCard({ era }) {
  const pal = paletteFor(era.id);
  const heavyId = era.unitIds.find((id) => /heavy|bastion|hauler|walker|colossus/i.test(id))
               || era.unitIds[era.unitIds.length - 1];
  const eraN = era.index + 1;
  // Sprite path: same shape as the in-game UnitDock so cache is shared.
  const portraitSrc = `games/era-siege/unit/era${eraN}/heavy.png`;
  // Era 1 is free-to-start; the rest require XP + gold to evolve into.
  const requirement = era.index === 0
    ? 'Starting age'
    : `${era.xpToEvolve}xp · ${era.evolveCost}g`;
  return (
    <article
      className="es-era-card"
      style={{ '--era-accent': pal.hudAccent || '#ffb070' }}>
      <div className="es-era-card-head">
        <span className="es-era-card-num">AGE {eraN}</span>
        <span className="es-era-card-req">{requirement}</span>
      </div>
      <div className="es-era-card-portrait" aria-hidden="true">
        <img
          src={portraitSrc}
          alt=""
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div className="es-era-card-body">
        <h4 className="es-era-card-name">{eraDisplayName(era)}</h4>
        <p className="es-era-card-blurb">{era.blurb}</p>
      </div>
      <ul className="es-era-card-units">
        {era.unitIds.map((id) => {
          const def = getUnit(id);
          if (!def) return null;
          return (
            <li key={id}>
              <span className="es-era-card-unit-role" aria-hidden="true"/>
              <span className="es-era-card-unit-name">{def.name}</span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
