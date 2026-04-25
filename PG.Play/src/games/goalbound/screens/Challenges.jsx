// Challenges — list all challenges, show stars, launch one.

import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { CHALLENGES } from '../content.js';
import {
  setRoute, setChallenge, setSelections, useGoalboundStore,
} from '../store.js';
import { BackBar, ScreenHead, Stars, Pill } from '../ui/primitives.jsx';

export default function Challenges() {
  const stars = useGoalboundStore((s) => s.stats.challengeStars || {});
  const total = Object.values(stars).reduce((a, b) => a + b, 0);
  const maxStars = CHALLENGES.reduce((a, c) => a + c.stars, 0);

  const launch = (c) => {
    sfx.confirm();
    setChallenge(c.id);
    // Apply challenge modifier overrides on top of current selections.
    const patch = { mode: 'challenge' };
    if (c.modifiers?.duration) {
      const id = String(c.modifiers.duration);
      patch.duration = ['45','60','90','120'].includes(id) ? id : '60';
    }
    if (c.modifiers?.weather)   patch.weather = c.modifiers.weather;
    if (c.modifiers?.difficulty) patch.difficulty = c.modifiers.difficulty;
    setSelections(patch);
    setRoute('match-intro');
  };

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker="Challenges"
        title="Scenarios designed to break your habits."
        blurb="Each run applies temporary modifiers. Clear the conditions to earn stars.">
        <Pill tone="accent">{total}/{maxStars} ★</Pill>
      </ScreenHead>

      <div className="gb-challenge-grid">
        {CHALLENGES.map((c) => {
          const have = stars[c.id] || 0;
          const done = have > 0;
          return (
            <button key={c.id} className={`gb-challenge-card ${done ? 'is-done' : ''}`} onClick={() => launch(c)}>
              <div className="gb-challenge-card-head">
                <div className="gb-challenge-card-title">{c.label}</div>
                <Stars filled={have} total={c.stars}/>
              </div>
              <div className="gb-challenge-card-goal">{c.goal}</div>
              <div className="gb-challenge-card-mods">
                {c.modifiers?.duration   && <Pill tone="ghost">{c.modifiers.duration}s</Pill>}
                {c.modifiers?.difficulty && <Pill tone="warm">{c.modifiers.difficulty}</Pill>}
                {c.modifiers?.weather    && <Pill tone="ghost">{c.modifiers.weather}</Pill>}
                {c.modifiers?.noJump     && <Pill tone="warm">no jump</Pill>}
                {c.modifiers?.enemyHead  && <Pill tone="warm">down 0–{c.modifiers.enemyHead}</Pill>}
                {c.modifiers?.goldenOnly && <Pill tone="accent">golden only</Pill>}
              </div>
              <div className="gb-challenge-card-launch">
                {Icon.play} <span>Start</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
