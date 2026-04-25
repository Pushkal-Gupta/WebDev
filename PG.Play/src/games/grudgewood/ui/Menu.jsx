// Menu — atmospheric main menu shell. Cycles through screens internally
// (main → continue / new → hats → settings → help). The 3D scene keeps
// running behind in 'menu' camera mode for visual continuity.

import { useState } from 'react';
import { Icon } from '../../../icons.jsx';
import HatsScreen from './HatsScreen.jsx';
import SettingsScreen from './SettingsScreen.jsx';
import HelpScreen from './HelpScreen.jsx';
import StatsScreen from './StatsScreen.jsx';
import ChallengesScreen from './ChallengesScreen.jsx';

export default function Menu({
  save,
  onContinue,
  onNewGame,
  onPickSegment,
  onPickChallenge,
  onEquipHat,
  onSettingsChange,
  onResetProgress,
  onUnlockAudio,
}) {
  const [screen, setScreen] = useState('main');

  const Btn = ({ onClick, primary, children, disabled }) => (
    <button
      className={`gw-btn ${primary ? 'gw-btn--primary' : ''}`}
      onClick={() => { onUnlockAudio?.(); onClick?.(); }}
      disabled={disabled}
    >{children}</button>
  );

  if (screen === 'hats') return <HatsScreen save={save} onEquip={onEquipHat} onBack={() => setScreen('main')} />;
  if (screen === 'settings') return <SettingsScreen save={save} onChange={onSettingsChange} onResetProgress={onResetProgress} onBack={() => setScreen('main')} />;
  if (screen === 'help') return <HelpScreen onBack={() => setScreen('main')} />;
  if (screen === 'stats') return <StatsScreen save={save} onBack={() => setScreen('main')} />;
  if (screen === 'select') {
    return <SelectScreen save={save} onPick={onPickSegment} onBack={() => setScreen('main')} />;
  }
  if (screen === 'challenges') {
    return <ChallengesScreen save={save} onPick={onPickChallenge} onBack={() => setScreen('main')} />;
  }

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
          <Btn onClick={() => setScreen('select')} disabled={save.furthestSegment === 0 && save.furthestBiome === 'mosswake'}>
            <span className="gw-hud-icon">{Icon.bookmark}</span> Biome Select
          </Btn>
          <Btn onClick={() => setScreen('challenges')} disabled={save.furthestSegment === 0 && save.furthestBiome === 'mosswake'}>
            <span className="gw-hud-icon">{Icon.target}</span> Challenges
          </Btn>
          <Btn onClick={() => setScreen('hats')}>
            <span className="gw-hud-icon">{Icon.trophy}</span> Hats
          </Btn>
          <Btn onClick={() => setScreen('stats')}>
            <span className="gw-hud-icon">{Icon.star}</span> Stats
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

function SelectScreen({ save, onPick, onBack }) {
  const order = ['mosswake', 'trickster', 'rotbog', 'cliffside', 'heart', 'sanctum'];
  const current = order.indexOf(save.furthestBiome);
  const items = [
    { id: 'mosswake',  name: 'Mosswake',         seg: 0 },
    { id: 'trickster', name: 'Trickster Grove',  seg: 2 },
    { id: 'rotbog',    name: 'The Rotbog',       seg: 4 },
    { id: 'cliffside', name: 'Cliffside Pines',  seg: 6 },
    { id: 'heart',     name: 'The Heart',        seg: 8 },
    { id: 'sanctum',   name: 'Axe Sanctum',      seg: 10 },
  ];

  return (
    <div className="gw-menu">
      <div className="gw-menu-card gw-menu-card--wide">
        <div className="gw-menu-title">Biome Select</div>
        <div className="gw-menu-sub">Pick a biome you've reached. Your save isn't lost — this is a side trip.</div>
        <div className="gw-select-grid">
          {items.map((it, i) => {
            const reached = order.indexOf(it.id) <= current;
            return (
              <button key={it.id} className={`gw-select-tile ${reached ? '' : 'gw-select-tile--locked'}`}
                disabled={!reached}
                onClick={() => onPick(it.seg)}>
                <div className="gw-select-tile-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="gw-select-tile-name">{it.name}</div>
                <div className="gw-select-tile-foot">{reached ? 'Reached' : 'Locked'}</div>
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
