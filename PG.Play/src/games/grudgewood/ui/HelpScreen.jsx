// HelpScreen — controls, philosophy, accessibility hints.

import { Icon } from '../../../icons.jsx';

export default function HelpScreen({ onBack }) {
  return (
    <div className="gw-menu">
      <div className="gw-menu-card gw-menu-card--wide">
        <div className="gw-menu-title">Help</div>
        <div className="gw-menu-sub">A short walk. The forest is going to lie to you.</div>

        <div className="gw-help-grid">
          <section>
            <h4>Move</h4>
            <ul>
              <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> — walk</li>
              <li><kbd>Shift</kbd> — sprint</li>
              <li><kbd>Space</kbd> — jump</li>
              <li><kbd>P</kbd> — pause</li>
              <li><kbd>R</kbd> — retry from last checkpoint</li>
              <li><kbd>Esc</kbd> — main menu</li>
            </ul>
          </section>
          <section>
            <h4>Read the forest</h4>
            <ul>
              <li>Wind-up matters. A creak means a strike is coming.</li>
              <li>Standing still is a tell. Roots listen for it.</li>
              <li>Anything labelled <em>SAFE</em> is not.</li>
              <li>Mushrooms pop on contact. Cute is loaded.</li>
            </ul>
          </section>
          <section>
            <h4>Checkpoints</h4>
            <ul>
              <li>Glowing pylons activate when you step into them.</li>
              <li>Death respawns you at the latest one. Quickly.</li>
              <li>Each biome ends with a checkpoint. Survive that long.</li>
            </ul>
          </section>
          <section>
            <h4>Accessibility</h4>
            <ul>
              <li>Reduce camera shake in Settings.</li>
              <li>Casual mode keeps the comedy and softens the cost.</li>
              <li>The audio cue is intentional — many traps tell on themselves.</li>
            </ul>
          </section>
        </div>

        <div className="gw-menu-foot">
          <button className="gw-link" onClick={onBack}><span className="gw-hud-icon">{Icon.back}</span> Back</button>
        </div>
      </div>
    </div>
  );
}
