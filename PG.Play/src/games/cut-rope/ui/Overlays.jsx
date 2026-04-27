// Cut the Rope — overlays. Five small components; one file because each
// is short and they share styling tokens.

import { LEVELS, WORLDS } from '../levels.js';

export function StartScreen({ progress, onPlay, onLevelSelect }) {
  const totalStars = Object.values(progress.levels || {}).reduce((a, l) => a + (l.bestStars || 0), 0);
  return (
    <div className="cr-overlay cr-start">
      <div className="cr-card">
        <div className="cr-eyebrow">PG.Play original</div>
        <h1 className="cr-title">Sweet Strand</h1>
        <p className="cr-tagline">Cut the rope. Steer the candy. Feed Mochi.</p>
        <div className="cr-cta">
          <button className="btn btn-primary" onClick={onPlay}>Play</button>
          <button className="btn btn-ghost"   onClick={onLevelSelect}>Levels ({totalStars} ★)</button>
        </div>
        <p className="cr-fineprint">Drag across a rope to cut it. Tap a bubble to pop it.</p>
      </div>
    </div>
  );
}

export function LevelSelect({ progress, onPick, onClose }) {
  return (
    <div className="cr-overlay">
      <div className="cr-card cr-card-wide">
        <div className="cr-card-bar">
          <h2 className="cr-card-title">Levels</h2>
          <button className="cr-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {WORLDS.map((world) => (
          <div key={world.id} className="cr-world">
            <div className="cr-world-name">{world.name}</div>
            <div className="cr-world-grid">
              {LEVELS.filter((l) => l.world === world.id).map((l) => {
                const prev = progress.levels[l.id];
                const cleared = prev?.cleared;
                const stars = prev?.bestStars || 0;
                const locked = !cleared && !isUnlocked(progress, l);
                return (
                  <button
                    key={l.id}
                    className={`cr-level-tile ${locked ? 'locked' : ''}`}
                    disabled={locked}
                    onClick={() => onPick(l.id)}>
                    <div className="cr-level-num">{l.world}-{l.number}</div>
                    <div className="cr-level-name">{l.name}</div>
                    <div className="cr-level-stars">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={`cr-star-pip ${i < stars ? 'on' : ''}`}>★</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isUnlocked(progress, level) {
  // Level 1 always unlocked. Otherwise the prior level must be cleared.
  if (level.world === 1 && level.number === 1) return true;
  const idx = LEVELS.findIndex((l) => l.id === level.id);
  if (idx <= 0) return true;
  const prior = LEVELS[idx - 1];
  return progress.levels[prior.id]?.cleared === true;
}

export function PauseMenu({ onResume, onRetry, onMenu }) {
  return (
    <div className="cr-overlay">
      <div className="cr-card">
        <h2 className="cr-card-title">Paused</h2>
        <div className="cr-stack">
          <button className="btn btn-primary" onClick={onResume}>Resume</button>
          <button className="btn btn-ghost"   onClick={onRetry}>Retry level</button>
          <button className="btn btn-ghost"   onClick={onMenu}>Levels</button>
        </div>
      </div>
    </div>
  );
}

export function LevelComplete({ stars, level, onRetry, onNext, onMenu, hasNext }) {
  return (
    <div className="cr-overlay cr-success">
      <div className="cr-card">
        <div className="cr-eyebrow">Level cleared</div>
        <h2 className="cr-card-title">{level.name}</h2>
        <div className="cr-stars-big">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`cr-star-big ${i < stars ? 'on' : ''}`}>★</span>
          ))}
        </div>
        <div className="cr-stack">
          {hasNext
            ? <button className="btn btn-primary" onClick={onNext}>Next level</button>
            : <button className="btn btn-primary" onClick={onMenu}>Levels</button>}
          <button className="btn btn-ghost" onClick={onRetry}>Replay</button>
        </div>
      </div>
    </div>
  );
}

export function LevelFail({ reason, onRetry, onMenu }) {
  return (
    <div className="cr-overlay cr-fail">
      <div className="cr-card">
        <div className="cr-eyebrow cr-eyebrow-fail">Missed</div>
        <p className="cr-fail-msg">
          {reason === 'spike'  ? 'Sharp! Steer around the spikes.'
           : reason === 'oob'   ? 'Out of bounds. Try a tighter swing.'
           : reason === 'floor' ? 'Mochi missed. Time the cut sooner.'
           : 'Try again.'}
        </p>
        <div className="cr-stack">
          <button className="btn btn-primary" onClick={onRetry}>Retry</button>
          <button className="btn btn-ghost"   onClick={onMenu}>Levels</button>
        </div>
      </div>
    </div>
  );
}

export function HintPill({ text }) {
  return <div className="cr-hint">{text}</div>;
}
