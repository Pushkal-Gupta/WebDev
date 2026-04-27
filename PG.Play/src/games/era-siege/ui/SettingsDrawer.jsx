// In-game settings drawer. Right-edge slide-in card. The shell pauses
// the sim while the drawer is open so settings tweaks aren't punished
// by an active match.
//
// Rows:
//   · Mute (delegates to platform mute via src/sound.js)
//   · Reduce motion (override)
//   · Low effects (override the auto-detector)
//   · Speed (1× / 2×)

import { useEffect, useState } from 'react';
import { isMuted, setMuted, subscribeMute } from '../../../sound.js';
import { Icon } from '../../../icons.jsx';
import { readSettings, writeSettings } from '../utils/settings.js';
import { resetStats } from '../utils/stats.js';

export default function SettingsDrawer({ open, onClose }) {
  const [settings, setSettings] = useState(() => readSettings());
  const [mutedState, setMutedState] = useState(() => isMuted());
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    return subscribeMute((m) => setMutedState(m));
  }, []);

  useEffect(() => { if (!open) setConfirmReset(false); }, [open]);

  const onReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetStats();
    setConfirmReset(false);
    onClose();
  };

  // ESC closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const update = (patch) => setSettings(writeSettings(patch));

  if (!open) return null;
  return (
    <div className="es-settings-scrim" role="dialog" aria-label="Settings" onClick={onClose}>
      <aside className="es-settings-card" onClick={(e) => e.stopPropagation()}>
        <header className="es-settings-head">
          <h2>Settings</h2>
          <button type="button" className="es-settings-x" onClick={onClose} aria-label="Close settings">
            <span aria-hidden="true">{Icon.close}</span>
          </button>
        </header>

        <Row label="Audio">
          <button
            type="button"
            className={`es-toggle${mutedState ? '' : ' is-on'}`}
            onClick={() => setMuted(!mutedState)}
            aria-pressed={!mutedState}>
            {mutedState ? 'Muted' : 'Unmuted'}
          </button>
        </Row>

        <Row label="Reduce motion" hint="Disables era flash + screen shake">
          <Tri
            value={settings.reduceMotion}
            options={[
              { value: null,  label: 'Auto' },
              { value: false, label: 'Off' },
              { value: true,  label: 'On'  },
            ]}
            onChange={(v) => update({ reduceMotion: v })}/>
        </Row>

        <Row label="Low effects" hint="Halves particles + damage numbers">
          <Tri
            value={settings.lowFxOverride}
            options={[
              { value: null,  label: 'Auto' },
              { value: false, label: 'Off' },
              { value: true,  label: 'On'  },
            ]}
            onChange={(v) => update({ lowFxOverride: v })}/>
        </Row>

        <Row label="Game speed">
          <div className="es-segmented" role="radiogroup" aria-label="Game speed">
            {[1, 2].map((v) => (
              <button
                key={v}
                type="button"
                className={`es-seg${settings.speed === v ? ' is-on' : ''}`}
                onClick={() => update({ speed: v })}
                aria-pressed={settings.speed === v}>
                {v}×
              </button>
            ))}
          </div>
        </Row>

        <Row label="Color-safe palette" hint="Blue-amber-magenta HP bars">
          <button
            type="button"
            className={`es-toggle${settings.cbSafePalette ? ' is-on' : ''}`}
            onClick={() => update({ cbSafePalette: !settings.cbSafePalette })}
            aria-pressed={settings.cbSafePalette}>
            {settings.cbSafePalette ? 'On' : 'Off'}
          </button>
        </Row>

        <Row label="Reset stats" hint="Clears bests, unlocks, daily streak">
          <button
            type="button"
            className={`es-toggle${confirmReset ? ' is-on' : ''}`}
            onClick={onReset}
            aria-label="Reset Era Siege stats">
            {confirmReset ? 'Tap to confirm' : 'Reset…'}
          </button>
        </Row>

        <footer className="es-settings-foot">
          <span>Press <kbd>P</kbd> to pause · <kbd>Esc</kbd> to close · <kbd>?</kbd> for shortcuts</span>
        </footer>
      </aside>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="es-settings-row">
      <div className="es-settings-row-text">
        <div className="es-settings-row-label">{label}</div>
        {hint && <div className="es-settings-row-hint">{hint}</div>}
      </div>
      <div className="es-settings-row-control">{children}</div>
    </div>
  );
}

function Tri({ value, options, onChange }) {
  return (
    <div className="es-segmented" role="radiogroup">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={`es-seg${value === opt.value ? ' is-on' : ''}`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
