// Difficulty selection — applies to AI opponent (Quick/Tournament).

import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { DIFFICULTIES } from '../content.js';
import { setRoute, setSelections, useSelection } from '../store.js';
import { BackBar, ScreenHead, Choice } from '../ui/primitives.jsx';

export default function DifficultyScreen() {
  const sel = useSelection();
  const pick = (id) => {
    sfx.click();
    setSelections({ difficulty: id });
  };
  const next = () => {
    sfx.confirm();
    setRoute('match-settings');
  };

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('team-select')}/>
      <ScreenHead
        kicker="Difficulty"
        title="How sharp should the keeper be?"
        blurb="Higher tiers react faster, close angles, and punish neutral touches."/>

      <div className="gb-diff-grid">
        {DIFFICULTIES.map((d) => (
          <Choice
            key={d.id}
            tone={d.id === sel.difficulty ? 'accent' : 'default'}
            selected={d.id === sel.difficulty}
            onClick={() => pick(d.id)}
            title={d.label}
            subtitle={d.blurb}
            meta={<div className="gb-diff-meta">
              <div className="gb-diff-bar">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ opacity: (d.reactTime <= [0.3,0.2,0.13,0.09,0.06][i] ? 1 : 0.15) }}/>
                ))}
              </div>
              <div className="gb-diff-meta-label">React speed</div>
            </div>}>
            <div className="gb-diff-blob" style={{ background: d.tint }}/>
          </Choice>
        ))}
      </div>

      <div className="gb-ctabar">
        <button className="btn btn-primary" onClick={next}>
          {Icon.check} Continue
        </button>
      </div>
    </div>
  );
}
