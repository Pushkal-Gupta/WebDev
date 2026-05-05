// KillFeed — small scrolling ticker of recent kills.
//
// Subscribes to the match bus 'kill' event and pushes a row per kill
// into a capped FIFO. Rows fade out after KILL_FEED_LIFE_MS so the
// feed self-empties when combat lulls.
//
// Each row shows:
//   - a tiny role glyph in the killer-team's accent color
//   - the victim's display name
//   - "+Ng / +Mxp" bounty deltas (only the player side gets the xp
//     credit, but enemy kills still show as red rows so the player
//     can clock when they lose units)

import { useEffect, useRef, useState } from 'react';
import RoleIcon from './RoleIcon.jsx';

const KILL_FEED_LIFE_MS = 4500;
const KILL_FEED_MAX     = 5;

export default function KillFeed({ matchRef, matchReady }) {
  const [rows, setRows] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());

  useEffect(() => {
    const match = matchRef?.current;
    if (!match) return;

    const off = match.bus.on('kill', (e) => {
      const id = ++idRef.current;
      // The killer's team is e.team — but the *victim's* side is the
      // opposite (since the killer killed it). Show the row in the
      // killer's accent color so green rows = "I scored" and red rows
      // = "the AI scored on me".
      const row = {
        id,
        team: e.team,
        unitName: e.unitName || 'Unit',
        role: e.role || 'frontline',
        isChampion: !!e.isChampion,
        gold: e.goldGained | 0,
        xp:   e.xpGained   | 0,
        bornAt: performance.now(),
      };
      setRows((prev) => {
        const next = [row, ...prev].slice(0, KILL_FEED_MAX);
        return next;
      });
      const t = setTimeout(() => {
        setRows((prev) => prev.filter((r) => r.id !== id));
        timersRef.current.delete(id);
      }, KILL_FEED_LIFE_MS);
      timersRef.current.set(id, t);
    });

    return () => {
      off();
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
    };
  }, [matchRef, matchReady]);

  if (rows.length === 0) return null;

  return (
    <div className="es-killfeed" role="log" aria-live="polite" aria-atomic="false">
      {rows.map((r) => (
        <div key={r.id} className={`es-killfeed-row es-killfeed-${r.team}${r.isChampion ? ' es-killfeed-champion' : ''}`}>
          <span className="es-killfeed-icon" aria-hidden="true">
            <RoleIcon role={r.role}/>
          </span>
          {r.isChampion && (
            <span className="es-killfeed-tag" aria-label="Champion kill">CHAMP</span>
          )}
          <span className="es-killfeed-name">{r.unitName}</span>
          {r.team === 'player' && (
            <span className="es-killfeed-bounty">
              {r.gold > 0 && <span className="es-killfeed-gold">+{r.gold}g</span>}
              {r.xp   > 0 && <span className="es-killfeed-xp">+{r.xp}xp</span>}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
