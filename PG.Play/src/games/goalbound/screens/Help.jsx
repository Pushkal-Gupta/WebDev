// Help — controls, mode explanations, tips, reset progress.

import { Icon } from '../../../icons.jsx';
import { CONTROLS } from '../content.js';
import { setRoute, clearProgress } from '../store.js';
import { BackBar, ScreenHead, Kbd } from '../ui/primitives.jsx';

const MODES = [
  { title:'Quick Match',      body:'One minute. 1v1 vs AI. First to three wins; otherwise timer decides, golden goal on a tie.' },
  { title:'Tournament',       body:'Pick a format (mini cup, continental, or straight knockouts). Standings update after every match.' },
  { title:'Local Versus',     body:'Two players, one keyboard. Desktop only — mobile quietly hides the entry.' },
  { title:'Penalty Shootout', body:'Five alternating kicks. Works on one phone — no simultaneous input.' },
  { title:'Challenges',       body:'Scenario-based runs. Each earns 1–3 stars. No penalty for retries.' },
  { title:'Practice',         body:'Free play. No clock, no AI pressure. Figure the ball out.' },
];

const TIPS = [
  'Hold kick to charge. A fully charged strike curls and hits with extra lift.',
  'Jumping keepers clear deep crosses but leave the line open. Mix jumping with timed low strikes.',
  'Wall bounces are legal. If the enemy is camping the center, angle through the top corner.',
  'Golden goal starts fresh — both teams can go front-foot. Don\'t defend a tie you could win.',
  'On Legend AI, don\'t let the ball settle. The keeper reads stationary kicks perfectly.',
];

export default function Help() {
  const reset = () => {
    if (!confirm('Reset all Goalbound progress? Stats, tournaments, and challenges will clear. This cannot be undone.')) return;
    clearProgress();
    setRoute('menu');
  };
  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker="Help"
        title="Learn the pitch in a minute."
        blurb="Controls, modes, and tips. Reset progress lives at the bottom."/>

      <section className="gb-help-grid">
        <div className="gb-help-panel">
          <h2 className="gb-section-title">{Icon.keyboard} Controls</h2>
          <div className="gb-help-controls">
            <ControlGroup title="Player 1" items={CONTROLS.p1}/>
            <ControlGroup title="Player 2" items={CONTROLS.p2}/>
            <ControlGroup title="Shell"    items={CONTROLS.shell}/>
          </div>
        </div>

        <div className="gb-help-panel">
          <h2 className="gb-section-title">Modes</h2>
          <ul className="gb-help-modes">
            {MODES.map((m) => (
              <li key={m.title}>
                <div className="gb-help-modes-title">{m.title}</div>
                <div className="gb-help-modes-body">{m.body}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="gb-help-panel">
          <h2 className="gb-section-title">Tips</h2>
          <ul className="gb-help-tips">
            {TIPS.map((t, i) => <li key={i}><span className="gb-help-bullet">{Icon.sparkle}</span>{t}</li>)}
          </ul>
        </div>
      </section>

      <section className="gb-danger">
        <div>
          <div className="gb-kicker gb-kicker-danger">Danger zone</div>
          <h2 className="gb-section-title">Reset Goalbound progress</h2>
          <p>Clears stats, trophies, selections, tournament state, and challenge stars. Platform-wide bests are kept separately.</p>
        </div>
        <button className="btn btn-danger" onClick={reset}>
          {Icon.close} Reset progress
        </button>
      </section>
    </div>
  );
}

function ControlGroup({ title, items }) {
  return (
    <div className="gb-help-controls-group">
      <div className="gb-help-controls-title">{title}</div>
      {items.map((it, i) => (
        <div key={i} className="gb-help-controls-row">
          <span className="gb-help-controls-keys">
            {it.keys.map((k, j) => <Kbd key={j}>{k}</Kbd>)}
          </span>
          <span className="gb-help-controls-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
