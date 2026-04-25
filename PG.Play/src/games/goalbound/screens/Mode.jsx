// Mode — secondary picker used when jumping into Quick from non-menu
// routes. Kept for completeness; the main menu already shows modes
// as tiles.

import { useIsMobile } from '../../../input/useVirtualControls.jsx';
import { Icon } from '../../../icons.jsx';
import { setRoute, setSelections } from '../store.js';
import { sfx } from '../../../sound.js';
import { BackBar, ScreenHead, Choice } from '../ui/primitives.jsx';

const MODES = [
  { id:'quick',      title:'Quick Match',      sub:'1P vs AI · arcade feel.',           tone:'primary' },
  { id:'tournament', title:'Tournament',       sub:'Cup run · standings + bracket.',    tone:'accent' },
  { id:'2p',         title:'Local Versus',     sub:'Two players · same keyboard.',      tone:'default', desktopOnly:true },
  { id:'shootout',   title:'Penalty Shootout', sub:'Five alternating kicks · mobile-safe.', tone:'default' },
  { id:'challenge',  title:'Challenges',       sub:'Scenarios to earn stars.',          tone:'default' },
  { id:'practice',   title:'Practice',         sub:'Free play · no clock.',             tone:'default' },
];

export default function ModeSelect() {
  const isMobile = useIsMobile();
  const pick = (id, blocked) => {
    if (blocked) return;
    sfx.click();
    setSelections({ mode: id });
    if (id === 'tournament')       setRoute('tournament-setup');
    else if (id === 'shootout')    setRoute('shootout');
    else if (id === 'challenge')   setRoute('challenges');
    else                           setRoute('team-select');
  };
  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker="Mode"
        title="Pick your match."
        blurb="Each mode has its own rhythm. Tournament and challenges earn meta rewards."/>
      <div className="gb-choice-grid">
        {MODES.map((m) => {
          const blocked = m.desktopOnly && isMobile;
          return (
            <Choice
              key={m.id}
              tone={m.tone}
              title={m.title}
              subtitle={m.sub}
              disabled={blocked}
              onClick={() => pick(m.id, blocked)}
              meta={blocked ? <span className="gb-pill gb-pill-ghost">desktop</span> : Icon.chevronRight}
            />
          );
        })}
      </div>
    </div>
  );
}
