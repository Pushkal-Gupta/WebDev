// TurretBuildModal — opens when the player taps an empty turret slot.
//
// Two modes, switched by `spotBuilt`:
//   - !spotBuilt  → "Lay Spot" — small commitment that earmarks the slot.
//                   No turret stats shown; just the spot price.
//   - spotBuilt   → "Build Turret" — full preview of the era-current
//                   turret with stats, blurb, and silhouette art.
//
// The two-stage flow exists so the player can earmark slots early
// (cheap) and decide which turret to actually drop in once they've
// scouted the matchup.

import { useEffect, useState } from 'react';
import { getEraByIndex } from '../content/eras.js';
import { getTurretForEra, getTurretsForEra } from '../content/turrets.js';
import { BALANCE } from '../content/balance.js';

export default function TurretBuildModal({ open, slotIndex, eraIndex, gold, spotBuilt, onBuild, onBuildSpot, onClose }) {
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

  // ── Stage 1: Lay Spot ────────────────────────────────────────────
  if (!spotBuilt) {
    const spotCost = BALANCE.TURRET_SPOT_COST;
    const canAfford = gold >= spotCost;
    return (
      <div className="es-tb-scrim" role="dialog" aria-label="Lay turret spot" onClick={onClose}>
        <div className="es-tb-card" onClick={(e) => e.stopPropagation()}>
          <header className="es-tb-head">
            <span className="es-tb-eyebrow">Slot {slotIndex + 1} · Stage 1 of 2</span>
            <h2>Lay Foundation</h2>
            <p>Stake the slot. After the foundation is laid you can build any era-current turret here.</p>
          </header>

          <div className="es-tb-art" aria-hidden="true">
            <SpotSilhouette/>
          </div>

          <ul className="es-tb-stats">
            <li><span>Slot lock</span><b>permanent</b></li>
            <li><span>Refund on sell</span><b>turret only</b></li>
            <li><span>Time to lay</span><b>instant</b></li>
          </ul>

          <footer className="es-tb-foot">
            <button type="button" className="es-tb-cancel" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className={`es-tb-build${canAfford ? '' : ' is-disabled'}`}
              disabled={!canAfford}
              onClick={() => canAfford && onBuildSpot(slotIndex)}
              title={canAfford ? 'Lay foundation now' : `Need ${spotCost}g`}>
              Lay Spot · {spotCost}g
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // ── Stage 2: Build Turret — picker for the era's three tiers ─────
  return (
    <BuildTurretPicker
      eraIndex={eraIndex}
      slotIndex={slotIndex}
      gold={gold}
      onBuild={onBuild}
      onClose={onClose}
    />
  );
}

// Three-tier picker: light / medium / heavy. Defaults to medium —
// the era's signature pick — since that's the existing one-button flow.
function BuildTurretPicker({ eraIndex, slotIndex, gold, onBuild, onClose }) {
  const era = getEraByIndex(eraIndex);
  const choices = era ? getTurretsForEra(era.id) : [];
  // Order light → medium → heavy.
  const TIER_ORDER = { light: 0, medium: 1, heavy: 2 };
  const sorted = [...choices].sort((a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99));
  const [selectedId, setSelectedId] = useState(() => {
    const med = sorted.find((d) => d.tier === 'medium');
    return med ? med.id : (sorted[0]?.id);
  });
  const def = sorted.find((d) => d.id === selectedId) || sorted[0];
  if (!def) return null;
  const canAfford = gold >= def.buildCost;
  const dps = (def.damage / (def.cooldownMs / 1000)).toFixed(1);

  return (
    <div className="es-tb-scrim" role="dialog" aria-label="Build turret" onClick={onClose}>
      <div className="es-tb-card es-tb-card-wide" onClick={(e) => e.stopPropagation()}>
        <header className="es-tb-head">
          <span className="es-tb-eyebrow">Slot {slotIndex + 1} · Pick a turret</span>
          <h2>{def.name}</h2>
          <p>{def.blurb || TURRET_BLURBS[def.id] || 'Era-current emplacement.'}</p>
        </header>

        {/* Tier picker — three cards, click to select. */}
        <div className="es-tb-tier-grid">
          {sorted.map((d) => {
            const sel = d.id === selectedId;
            const tooPoor = gold < d.buildCost;
            return (
              <button
                key={d.id}
                type="button"
                className={`es-tb-tier${sel ? ' is-selected' : ''}${tooPoor ? ' is-poor' : ''}`}
                onClick={() => setSelectedId(d.id)}
                title={d.blurb || d.name}>
                <span className="es-tb-tier-eyebrow">{d.tier?.toUpperCase()}</span>
                <span className="es-tb-tier-name">{d.name}</span>
                <span className="es-tb-tier-cost">{d.buildCost}g</span>
              </button>
            );
          })}
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
            onClick={() => canAfford && onBuild(slotIndex, def.id)}
            title={canAfford ? 'Build now' : `Need ${def.buildCost}g`}>
            Build {def.name} · {def.buildCost}g
          </button>
        </footer>
      </div>
    </div>
  );
}

function SpotSilhouette() {
  return (
    <svg viewBox="0 0 84 84">
      <rect x="14" y="56" width="56" height="10" fill="#3a3f48"/>
      <rect x="14" y="64" width="56" height="3"  fill="#1c2128"/>
      <rect x="20" y="50" width="6"  height="6"  fill="#3a3f48"/>
      <rect x="58" y="50" width="6"  height="6"  fill="#3a3f48"/>
      <line x1="14" y1="56" x2="70" y2="56" stroke="#0a0d0e" strokeWidth="1"/>
    </svg>
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
