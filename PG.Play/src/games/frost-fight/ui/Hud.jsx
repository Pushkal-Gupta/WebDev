// Frost Fight — top HUD chips.
//
// Four chips, three tiers:
//   primary   — Room (level), Fruit (progress)
//   secondary — Deaths, Time
// Tabular numerics, value-pop on change. Fruit chip pulses cyan when
// the count hits zero so the player notices the exit is now live.

import { motion, useReducedMotion } from 'framer-motion';

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${pad2(s)}` : `0:${pad2(s)}`;
}

function PopNumber({ value, className }) {
  const reduced = useReducedMotion();
  return (
    <motion.b
      className={className}
      key={String(value)}
      initial={reduced ? false : { scale: 1.18 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
      {value}
    </motion.b>
  );
}

export default function Hud({
  levelIdx,
  levelCount,
  levelName,
  gemsGot,
  gemsTotal,
  deaths,
  levelDeaths,
  time,
  roomBest,
  exitLive,
  difficulty,
  activePower,
}) {
  // Phase 19: lives are a RUN-WIDE pool that scales with theme length.
  // `livesFor(L)` from the picked difficulty resolves the cap; Easy
  // returns Infinity (chip shows ∞), Insane returns 0 (chip shows
  // "0/0" with is-danger). Out of pool → game-over (handled by the
  // game's death pipeline, not the chip).
  const livesCap = difficulty && typeof difficulty.livesFor === 'function'
    ? difficulty.livesFor(typeof levelCount === 'number' ? levelCount : 15)
    : null;
  const isUnlimited = livesCap === Infinity;
  const livesRemaining = isUnlimited ? Infinity
    : (livesCap === null ? null : Math.max(0, livesCap - deaths));
  const livesLow = livesRemaining !== null && !isUnlimited && livesRemaining <= 1;
  // Pace marker — show the player's recorded best for this room as a
  // ghost line under the room name. Gives a target without nagging.
  const paceLabel = roomBest && typeof roomBest.time === 'number'
    ? `best ${roomBest.time}s${roomBest.deaths > 0 ? ` · ${roomBest.deaths}d` : ''}`
    : null;
  return (
    <div className="ff-hud-row">
      <div className="ff-chip ff-chip-primary">
        <span className="ff-chip-label">Room</span>
        <span className="ff-chip-value">
          <PopNumber value={Math.min(levelCount, levelIdx + 1)} className="ff-chip-num"/>
          <span className="ff-chip-unit">/{levelCount}</span>
        </span>
        <span className="ff-chip-sub">{levelName}</span>
        {paceLabel && <span className="ff-chip-pace">{paceLabel}</span>}
      </div>

      <div
        className={'ff-chip ff-chip-primary ff-chip-fruit' + (exitLive ? ' is-cleared' : '')}
        data-cleared={exitLive ? '1' : '0'}>
        <span className="ff-chip-label">{exitLive ? 'Exit live' : 'Fruit'}</span>
        <span className="ff-chip-value">
          <PopNumber value={gemsGot} className="ff-chip-num"/>
          <span className="ff-chip-unit">/{gemsTotal}</span>
        </span>
      </div>

      <div className={'ff-chip ff-chip-sec' + (livesLow ? ' is-danger' : '')}>
        <span className="ff-chip-label">{livesCap !== null ? 'Lives' : 'Deaths'}</span>
        <span className="ff-chip-value">
          {isUnlimited ? (
            <b className="ff-chip-num">∞</b>
          ) : livesCap !== null ? (
            <>
              <PopNumber value={livesRemaining} className="ff-chip-num"/>
              <span className="ff-chip-unit">/{livesCap}</span>
            </>
          ) : (
            <PopNumber value={deaths} className="ff-chip-num"/>
          )}
        </span>
      </div>

      <div className="ff-chip ff-chip-sec">
        <span className="ff-chip-label">Time</span>
        <span className="ff-chip-value">
          <b className="ff-chip-num">{fmtTime(time)}</b>
        </span>
      </div>

      {activePower && (
        <div className={'ff-chip ff-chip-power ff-chip-power-' + activePower.id}>
          <span className="ff-chip-label">Power</span>
          <span className="ff-chip-value">
            <b className="ff-chip-num">{activePower.label}</b>
            {activePower.total > 0 && (
              <span className="ff-chip-power-bar" aria-hidden="true">
                <span
                  className="ff-chip-power-bar-fill"
                  style={{ width: `${Math.max(0, Math.min(1, activePower.t / activePower.total)) * 100}%` }}/>
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
