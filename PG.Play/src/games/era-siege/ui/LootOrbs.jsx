// LootOrbs — DOM particle overlay that flies gold coins + XP orbs from
// each kill location to the HUD's gold counter / XP bar.
//
// Why DOM and not canvas?
//   The targets (gold counter span, XP bar element) live in HTML, not on
//   the canvas. Computing their absolute positions from React refs is
//   trivial; doing the inverse (sampling a canvas pixel for the HUD's
//   on-screen position) requires DPR + viewport math every frame. DOM
//   transforms also get hardware-accelerated for free.
//
// Each orb is a single <span> that gets `transform: translate(...)`
// updated once on mount (initial spawn) then once via a CSS transition
// (target). After the transition ends, the span removes itself.

import { useEffect, useRef, useState } from 'react';

const COIN_LIFE_MS = 700;
const ORB_LIFE_MS  = 800;

export default function LootOrbs({ matchRef, canvasRef, goldTargetSelector = '.es-gold-num', xpTargetSelector = '.es-xp-track' }) {
  const [orbs, setOrbs] = useState([]);
  const idRef = useRef(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    const match = matchRef?.current;
    if (!match) return;
    // Subscribe to kills. e.x / e.y are in canvas-internal coordinates;
    // convert via the canvas's getBoundingClientRect + DPR ratio so the
    // spawn lands exactly where the kill happened on screen.
    const off = match.bus.on('kill', (e) => {
      if (e.team !== 'player') return;       // only the player gets juice
      const canvas = canvasRef?.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const cRect = canvas.getBoundingClientRect();
      const wRect = wrap.getBoundingClientRect();
      // Canvas internal → CSS pixels: scale by rect.width / canvas.width.
      const sx = cRect.width  / canvas.width;
      const sy = cRect.height / canvas.height;
      const fromX = (e.x * sx) + (cRect.left - wRect.left);
      const fromY = (e.y * sy) + (cRect.top  - wRect.top);
      // Targets resolve at orb birth — the bounding rect can move on
      // resize, but for an 800 ms life that's fine.
      const goldEl = document.querySelector(goldTargetSelector);
      const xpEl   = document.querySelector(xpTargetSelector);
      const orbsAdd = [];
      if (goldEl) {
        const r = goldEl.getBoundingClientRect();
        orbsAdd.push({
          id: ++idRef.current,
          kind: 'coin',
          fromX, fromY,
          toX: r.left + r.width / 2 - wRect.left,
          toY: r.top  + r.height / 2 - wRect.top,
          life: COIN_LIFE_MS,
        });
      }
      if (xpEl) {
        const r = xpEl.getBoundingClientRect();
        orbsAdd.push({
          id: ++idRef.current,
          kind: 'orb',
          fromX, fromY,
          toX: r.left + r.width / 2 - wRect.left,
          toY: r.top  + r.height / 2 - wRect.top,
          life: ORB_LIFE_MS,
        });
      }
      if (orbsAdd.length) {
        setOrbs((cur) => [...cur, ...orbsAdd]);
        // Reap after life expires. Each orb id self-removes.
        for (const o of orbsAdd) {
          window.setTimeout(() => {
            setOrbs((cur) => cur.filter((p) => p.id !== o.id));
          }, o.life + 50);
        }
      }
    });
    return () => off?.();
  }, [matchRef, canvasRef, goldTargetSelector, xpTargetSelector]);

  return (
    <div ref={wrapRef} className="es-loot-overlay" aria-hidden="true">
      {orbs.map((o) => (
        <FlyingOrb key={o.id} orb={o}/>
      ))}
    </div>
  );
}

function FlyingOrb({ orb }) {
  const ref = useRef(null);
  // Two-phase animation: paint at fromX/fromY first frame, then on the
  // next frame paint at toX/toY. The CSS transition handles the rest.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Skip frame so the browser commits the initial transform before we
    // change it — otherwise both writes coalesce and the orb teleports.
    const raf = window.requestAnimationFrame(() => {
      el.style.transform = `translate(${orb.toX}px, ${orb.toY}px) scale(0.6)`;
      el.style.opacity = '0';
    });
    return () => window.cancelAnimationFrame(raf);
  }, [orb.toX, orb.toY]);
  return (
    <span
      ref={ref}
      className={`es-loot-orb es-loot-${orb.kind}`}
      style={{
        transform: `translate(${orb.fromX}px, ${orb.fromY}px) scale(1)`,
        transitionDuration: `${orb.life}ms`,
      }}
    />
  );
}
