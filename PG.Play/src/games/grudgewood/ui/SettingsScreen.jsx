// SettingsScreen — quality, audio, motion, accessibility.

import { Icon } from '../../../icons.jsx';

export default function SettingsScreen({ save, onChange, onResetProgress, onBack }) {
  const s = save.settings;
  const set = (k, v) => onChange(k, v);

  return (
    <div className="gw-menu">
      <div className="gw-menu-card gw-menu-card--wide">
        <div className="gw-menu-title">Settings</div>
        <div className="gw-menu-sub">Tune the forest. Most changes apply on the next walk.</div>

        <div className="gw-set-grid">
          <Row label="Quality">
            <Segmented value={s.quality} options={['auto','low','medium','high']} onChange={(v) => set('quality', v)} />
          </Row>
          <Row label="Master volume">
            <Slider value={s.masterVolume} onChange={(v) => set('masterVolume', v)} />
          </Row>
          <Row label="SFX volume">
            <Slider value={s.sfxVolume} onChange={(v) => set('sfxVolume', v)} />
          </Row>
          <Row label="Music volume">
            <Slider value={s.musicVolume} onChange={(v) => set('musicVolume', v)} />
          </Row>
          <Row label="Camera shake">
            <Slider value={s.cameraShake} onChange={(v) => set('cameraShake', v)} />
          </Row>
          <Row label="Reduced motion">
            <Toggle value={s.reducedMotion} onChange={(v) => set('reducedMotion', v)} />
          </Row>
          <Row label="Casual mode (softer punishment)">
            <Toggle value={s.casualMode} onChange={(v) => set('casualMode', v)} />
          </Row>
          <Row label="Show FPS">
            <Toggle value={s.showFps} onChange={(v) => set('showFps', v)} />
          </Row>
        </div>

        <div className="gw-set-danger">
          <button
            className="gw-btn gw-btn--danger"
            onClick={() => { if (confirm('Wipe all Grudgewood progress, hats, and settings?')) onResetProgress(); }}
          >Reset all progress</button>
        </div>

        <div className="gw-menu-foot">
          <button className="gw-link" onClick={onBack}><span className="gw-hud-icon">{Icon.back}</span> Back</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="gw-set-row">
      <div className="gw-set-label">{label}</div>
      <div className="gw-set-control">{children}</div>
    </div>
  );
}

function Slider({ value, onChange }) {
  return (
    <input
      type="range" min="0" max="1" step="0.05"
      value={value} onChange={(e) => onChange(Number(e.target.value))}
      className="gw-slider"
    />
  );
}

function Toggle({ value, onChange }) {
  return (
    <button className={`gw-toggle ${value ? 'gw-toggle--on' : ''}`} onClick={() => onChange(!value)}>
      <span className="gw-toggle-knob" />
    </button>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="gw-segmented">
      {options.map((o) => (
        <button key={o} className={`gw-segmented-opt ${value === o ? 'is-on' : ''}`} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}
