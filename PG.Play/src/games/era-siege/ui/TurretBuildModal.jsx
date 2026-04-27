// TurretBuildModal — opens when the player taps an empty turret slot.
// Shows the era's turret with stats, a tactical hint, and Build / Cancel.
// Architected to support multiple turret choices when content adds them.

import { useEffect } from 'react';
import { getEraByIndex } from '../content/eras.js';
import { getTurretForEra } from '../content/turrets.js';

export default function TurretBuildModal({ open, slotIndex, eraIndex, gold, onBuild, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const era = getEraByIndex(eraIndex);
  const def = era ? getTurretForEra(era.id) : null;
  if (!def) return null;
  const canAfford = gold >= def.buildCost;
  const dps = (def.damage / (def.cooldownMs / 1000)).toFixed(1);

  return (
    <div className="es-tb-scrim" role="dialog" aria-label="Build turret" onClick={onClose}>
      <div className="es-tb-card" onClick={(e) => e.stopPropagation()}>
        <header className="es-tb-head">
          <span className="es-tb-eyebrow">Slot {slotIndex + 1}</span>
          <h2>{def.name}</h2>
          <p>{TURRET_BLURBS[def.id] || 'Era-current emplacement.'}</p>
        </header>

        <div className="es-tb-art" aria-hidden="true">
          <TurretSilhouette def={def}/>
        </div>

        <ul className="es-tb-stats">
          <li><span>Damage</span><b>{def.damage}</b></li>
          <li><span>Range</span><b>{def.range}px</b></li>
          <li><span>Cooldown</span><b>{(def.cooldownMs / 1000).toFixed(1)}s</b></li>
          <li><span>DPS</span><b>{dps}</b></li>
        </ul>

        <footer className="es-tb-foot">
          <button type="button" className="es-tb-cancel" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`es-tb-build${canAfford ? '' : ' is-disabled'}`}
            disabled={!canAfford}
            onClick={() => canAfford && onBuild(slotIndex)}
            title={canAfford ? 'Build now' : `Need ${def.buildCost}g`}>
            Build · {def.buildCost}g
          </button>
        </footer>
      </div>
    </div>
  );
}

const TURRET_BLURBS = {
  'bone-crossbow':  'Long pike of split bone. Pins approaching frontliners.',
  'iron-ballista':  'Heavy bolt thrower. Strong against ranks; reloads slow.',
  'brass-mortar':   'Steam-fed shells. Lobs through cover; AOE on impact.',
  'volt-cannon':    'Capacitor arc gun. Punches heavy units, fast cadence.',
  'void-lance':     'Resonance lance. Slow, decisive; cuts through armour.',
};

function TurretSilhouette({ def }) {
  // Inline SVG silhouette — replaced by the asset manifest's PNG when
  // dropped into public/games/era-siege/turret/era<N>.png.
  const v = def.visual;
  return (
    <svg viewBox="0 0 84 84">
      <rect x="22" y="58" width="40" height="14" fill={v.baseColor}/>
      <rect x="40" y="34" width="4"  height="24" fill="#0a0d0e"/>
      {v.kind === 'crossbow' && (<>
        <rect x="14" y="32" width="56" height="4" fill={v.barrelColor}/>
        <rect x="14" y="36" width="56" height="2" fill="#0a0d0e"/>
      </>)}
      {v.kind === 'bell' && (<>
        <polygon points="32,30 52,30 60,40 24,40" fill={v.barrelColor}/>
      </>)}
      {v.kind === 'cannon' && (<>
        <rect x="14" y="26" width="56" height="14" fill={v.barrelColor}/>
        <rect x="10" y="32" width="6"  height="8"  fill={v.barrelColor}/>
      </>)}
      {v.kind === 'tesla' && (<>
        <rect x="34" y="20" width="3" height="18" fill={v.barrelColor}/>
        <rect x="40" y="16" width="3" height="22" fill={v.barrelColor}/>
        <rect x="46" y="20" width="3" height="18" fill={v.barrelColor}/>
        <line x1="34" y1="14" x2="49" y2="14" stroke={v.barrelColor} strokeWidth="1.5"/>
      </>)}
      {v.kind === 'lance' && (<>
        <polygon points="34,18 50,18 76,38 34,38" fill={v.barrelColor}/>
      </>)}
    </svg>
  );
}
