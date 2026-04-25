// ChallengesScreen — challenge picker. Lists each challenge with its rule,
// target tiers, and best-medal badge from the save profile.

import { Icon } from '../../../icons.jsx';
import { CHALLENGES, targetLabel } from '../challenges.js';

const MEDAL_LABEL = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

export default function ChallengesScreen({ save, onPick, onBack }) {
  const order = ['mosswake', 'trickster', 'rotbog', 'cliffside', 'heart', 'sanctum'];
  const reachedIdx = order.indexOf(save.furthestBiome);

  return (
    <div className="gw-menu">
      <div className="gw-menu-card gw-menu-card--wide">
        <div className="gw-menu-title">Challenges</div>
        <div className="gw-menu-sub">Short remixes. Different rules. Medals stay on your save.</div>

        <div className="gw-chal-list">
          {CHALLENGES.map((c) => {
            const locked = order.indexOf(c.biome) > reachedIdx;
            const medal = save.challengeMedals?.[c.id];
            return (
              <button
                key={c.id}
                className={`gw-chal-row ${locked ? 'gw-chal-row--locked' : ''} ${medal ? `gw-chal-row--${medal}` : ''}`}
                disabled={locked}
                onClick={() => !locked && onPick(c)}
              >
                <div className="gw-chal-rank">
                  {medal ? (
                    <span className={`gw-chal-medal gw-chal-medal--${medal}`}>{MEDAL_LABEL[medal]}</span>
                  ) : (
                    <span className="gw-chal-medal gw-chal-medal--none">—</span>
                  )}
                </div>
                <div className="gw-chal-meta">
                  <div className="gw-chal-name">{c.name}</div>
                  <div className="gw-chal-blurb">{c.blurb}</div>
                  <div className="gw-chal-target">{targetLabel(c)}</div>
                </div>
                <div className="gw-chal-cta">
                  {locked ? 'Locked' : 'Run'}
                </div>
              </button>
            );
          })}
        </div>

        <div className="gw-menu-foot">
          <button className="gw-link" onClick={onBack}><span className="gw-hud-icon">{Icon.back}</span> Back</button>
        </div>
      </div>
    </div>
  );
}
