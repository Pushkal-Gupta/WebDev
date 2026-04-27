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
  time,
  exitLive,
}) {
  return (
    <div className="ff-hud-row">
      <div className="ff-chip ff-chip-primary">
        <span className="ff-chip-label">Room</span>
        <span className="ff-chip-value">
          <PopNumber value={Math.min(levelCount, levelIdx + 1)} className="ff-chip-num"/>
          <span className="ff-chip-unit">/{levelCount}</span>
        </span>
        <span className="ff-chip-sub">{levelName}</span>
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

      <div className="ff-chip ff-chip-sec">
        <span className="ff-chip-label">Deaths</span>
        <span className="ff-chip-value">
          <PopNumber value={deaths} className="ff-chip-num"/>
        </span>
      </div>

      <div className="ff-chip ff-chip-sec">
        <span className="ff-chip-label">Time</span>
        <span className="ff-chip-value">
          <b className="ff-chip-num">{fmtTime(time)}</b>
        </span>
      </div>
    </div>
  );
}
