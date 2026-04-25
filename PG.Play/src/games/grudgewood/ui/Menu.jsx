// Menu — atmospheric main menu shell. Cycles through screens internally
// (main → settings → help). The 3D scene keeps running behind in 'menu'
// camera mode for visual continuity.
//
// Phase 10E trim: the menu now exposes only the four options players
// actually use — Continue, New Walk, Settings, Help. The hats / stats /
// challenges / biome-select screens still exist on disk so the underlying
// systems (hat unlocks, challenge medals, etc.) keep working, but they
// aren't reachable from this surface.

import { useState } from 'react';
import { Icon } from '../../../icons.jsx';
import SettingsScreen from './SettingsScreen.jsx';
import HelpScreen from './HelpScreen.jsx';

export default function Menu({
  save,
  onContinue,
  onNewGame,
  onSettingsChange,
  onResetProgress,
  onUnlockAudio,
}) {
  const [screen, setScreen] = useState('main');

  const Btn = ({ onClick, primary, children, disabled }) => (
    <button
      type="button"
      className={`gw-btn ${primary ? 'gw-btn--primary' : ''}`}
      onClick={() => { onUnlockAudio?.(); onClick?.(); }}
      disabled={disabled}
    >{children}</button>
  );

  if (screen === 'settings') return <SettingsScreen save={save} onChange={onSettingsChange} onResetProgress={onResetProgress} onBack={() => setScreen('main')} />;
  if (screen === 'help') return <HelpScreen onBack={() => setScreen('main')} />;

  const cont = save.checkpoint && (save.checkpoint.segment > 0 || save.furthestSegment > 0);

  return (
    <div className="gw-menu">
      <div className="gw-menu-card">
        <div className="gw-menu-title">Grudgewood</div>
        <div className="gw-menu-sub">The forest remembers.</div>
        <div className="gw-menu-list">
          <Btn primary onClick={onContinue} disabled={!cont}>
            <span className="gw-hud-icon">{Icon.play}</span> Continue
          </Btn>
          <Btn onClick={onNewGame}>
            <span className="gw-hud-icon">{Icon.sparkle}</span> New Walk
          </Btn>
          <Btn onClick={() => setScreen('settings')}>
            <span className="gw-hud-icon">{Icon.settings}</span> Settings
          </Btn>
          <Btn onClick={() => setScreen('help')}>
            <span className="gw-hud-icon">{Icon.help}</span> Help
          </Btn>
        </div>
        <div className="gw-menu-foot">
          <span className="gw-menu-hint">Use the toolbar above to leave the forest.</span>
        </div>
      </div>
    </div>
  );
}
