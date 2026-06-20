// TurretBuildModal — single-screen flow.
//
// Always shows the three-tier picker plus a footer that adapts to
// whether the foundation is laid. Earlier the modal was two-stage
// (Lay Spot, then close, then click slot again for tier picker);
// players reported "where are the new turrets" because the second
// click was never discovered. Now it's one modal: pick tier first
// (or not), lay foundation, build — without ever closing.

import { useEffect, useState } from 'react';
import { getEraByIndex } from '../content/eras.js';
import { getTurretsForEra } from '../content/turrets.js';
import { BALANCE } from '../content/balance.js';

const TIER_ORDER = { light: 0, medium: 1, heavy: 2 };

// Approximate footprint of the wide build card, used to clamp the
// anchored position inside the viewport. The real card is
// width: min(560px, 94vw); height varies but stays under ~320px.
const CARD_W = 560;
const CARD_H = 320;
const VIEW_MARGIN = 8;

// Translate a slot's on-screen point into a clamped {left, top} for the
// modal scrim. Offset up-and-left of the pylon so the card doesn't cover
// the slot it belongs to, then clamp so it never leaves the viewport.
function anchorStyle(anchor) {
  if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return null;
  const w = Math.min(CARD_W, window.innerWidth * 0.94);
  // Center the card horizontally over the pylon; sit it above the slot.
  let left = anchor.x - w / 2;
  let top  = anchor.y - CARD_H - 24;
  const maxLeft = window.innerWidth  - w - VIEW_MARGIN;
  const maxTop  = window.innerHeight - CARD_H - VIEW_MARGIN;
  left = Math.max(VIEW_MARGIN, Math.min(left, Math.max(VIEW_MARGIN, maxLeft)));
  top  = Math.max(VIEW_MARGIN, Math.min(top,  Math.max(VIEW_MARGIN, maxTop)));
  // Inline left/top must beat the stylesheet's bottom/right fallback —
  // explicitly clear those so the two positioning schemes don't conflict.
  return { left, top, right: 'auto', bottom: 'auto' };
}

export default function TurretBuildModal({
  open, slotIndex, anchor, eraIndex, gold, spotBuilt,
  onBuild, onBuildSpot, onCancelSpot, onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const era = getEraByIndex(eraIndex);
  const choices = era ? getTurretsForEra(era.id) : [];
  const sorted = [...choices].sort((a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99));
  const [selectedId, setSelectedId] = useState(() => {
    const med = sorted.find((d) => d.tier === 'medium');
    return med ? med.id : (sorted[0]?.id);
  });

  if (!open) return null;
  const def = sorted.find((d) => d.id === selectedId) || sorted[0];
  if (!def) return null;

  const spotCost     = BALANCE.TURRET_SPOT_COST;
  const totalCost    = (spotBuilt ? 0 : spotCost) + def.buildCost;
  const canBuild     = spotBuilt && gold >= def.buildCost;
  const canLay       = !spotBuilt && gold >= spotCost;
  const dps          = (def.damage / (def.cooldownMs / 1000)).toFixed(1);

  // When an anchor is supplied, float near the clicked pylon (clamped to
  // the viewport). Otherwise leave style undefined so the stylesheet's
  // bottom-right fallback applies — preserves 2D / off-screen behavior.
  const scrimStyle = anchorStyle(anchor) || undefined;

  return (
    <div className="es-tb-scrim" style={scrimStyle} role="dialog" aria-label="Build turret" onClick={onClose}>
      <div className="es-tb-card es-tb-card-wide" onClick={(e) => e.stopPropagation()}>
        <header className="es-tb-head">
          <span className="es-tb-eyebrow">
            Slot {slotIndex + 1} · {spotBuilt ? 'Pick a turret' : 'Foundation + turret'}
          </span>
          <h2>{def.name}</h2>
          <p>{def.blurb || TURRET_BLURBS[def.id] || 'Era-current emplacement.'}</p>
        </header>

        {/* Tier picker is always visible. When the spot isn't laid yet,
            the cards still work as "select your intended tier" so the
            player sees their options up front; the footer's "Lay
            Foundation" button is the unlock. */}
        <div className="es-tb-tier-grid">
          {sorted.map((d) => {
            const sel = d.id === selectedId;
            const tooPoor = gold < d.buildCost;
            const recommended = d.tier === 'medium';
            return (
              <button
                key={d.id}
                type="button"
                className={`es-tb-tier${sel ? ' is-selected' : ''}${tooPoor ? ' is-poor' : ''}`}
                onClick={() => setSelectedId(d.id)}
                title={d.blurb || d.name}>
                <span className="es-tb-tier-eyebrow">
                  {d.tier?.toUpperCase()}{recommended ? ' · RECOMMENDED' : ''}
                </span>
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

        {!spotBuilt && (
          <div className="es-tb-foundation-note">
            <b>Foundation required first.</b> Lay it once ({spotCost}g) — then build any tier on it.
            Total to deploy {def.name}: <b>{totalCost}g</b>.
          </div>
        )}

        <footer className="es-tb-foot">
          {spotBuilt && onCancelSpot && (
            <button
              type="button"
              className="es-tb-cancel-spot"
              onClick={() => onCancelSpot(slotIndex)}
              title="Refund foundation and abandon this slot">
              Refund Foundation
            </button>
          )}
          <button type="button" className="es-tb-cancel" onClick={onClose}>Close</button>
          {spotBuilt ? (
            <button
              type="button"
              className={`es-tb-build${canBuild ? '' : ' is-disabled'}`}
              disabled={!canBuild}
              onClick={() => canBuild && onBuild(slotIndex, def.id)}
              title={canBuild ? `Build ${def.name}` : `Need ${def.buildCost}g`}>
              Build {def.name} · {def.buildCost}g
            </button>
          ) : (
            <button
              type="button"
              className={`es-tb-build${canLay ? '' : ' is-disabled'}`}
              disabled={!canLay}
              onClick={() => canLay && onBuildSpot(slotIndex)}
              title={canLay ? 'Lay the foundation' : `Need ${spotCost}g`}>
              Lay Foundation · {spotCost}g
            </button>
          )}
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
