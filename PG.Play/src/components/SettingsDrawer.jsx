// SettingsDrawer — slide-in drawer with tightened rhythm.
//
// Sections: Account, Appearance, Sound, Data, About.
// Section headers are mono uppercase kickers. Theme + sound use the same
// pill-toggle component with a sliding indicator. Spacing matches the
// GameIntro right column. Esc closes; framer-motion entrance + reduced.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '../icons.jsx';
import { isMuted, setMuted } from '../sound.js';

function PillToggle({ ariaLabel, value, options, onChange }) {
  const reduced = useReducedMotion();
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="settings-pill-toggle" role="radiogroup" aria-label={ariaLabel}>
      <motion.span
        className="settings-pill-thumb"
        aria-hidden="true"
        animate={{ x: `${idx * 100}%` }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 36 }}
        style={{ width: `${100 / options.length}%` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={'settings-pill-opt' + (value === o.value ? ' is-active' : '')}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsDrawer({
  theme, setTheme,
  user,
  onOpenAuth, onSignOut,
  onClearFavs,
  favCount,
  onClose,
}) {
  const reduced = useReducedMotion();
  const [muted, setMutedState] = useState(() => isMuted());
  const drawerRef = useRef(null);
  const setSound = (v) => {
    const wantMute = v === 'off';
    if (wantMute !== muted) { setMuted(wantMute); setMutedState(wantMute); }
  };

  // Esc-to-close + Tab-trap inside the drawer so focus stays scoped to
  // the dialog while the underlying page is hidden behind the backdrop.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="settings-backdrop"
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.aside
        key="settings-drawer"
        ref={drawerRef}
        className="drawer settings-v2 glass-strong"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        initial={reduced ? { opacity: 0 } : { opacity: 0, x: 32 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, x: 32 }}
        transition={{ duration: reduced ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="drawer-head">
          <h2 id="settings-title" className="drawer-title">Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings">{Icon.close}</button>
        </div>

        <div className="drawer-body">
          {/* Account */}
          <section className="settings-v2-section">
            <div className="settings-v2-kicker">Account</div>
            {user ? (
              <div className="settings-v2-row">
                <div className="settings-v2-row-text">
                  <div className="settings-v2-row-title">{user.email}</div>
                  <div className="settings-v2-row-desc">Bests and favorites sync across devices.</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={onSignOut}>Sign out</button>
              </div>
            ) : (
              <div className="settings-v2-row">
                <div className="settings-v2-row-text">
                  <div className="settings-v2-row-title">Not signed in</div>
                  <div className="settings-v2-row-desc">Sign in to sync favorites and personal bests.</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>Sign in</button>
              </div>
            )}
          </section>

          {/* Appearance */}
          <section className="settings-v2-section">
            <div className="settings-v2-kicker">Appearance</div>
            <div className="settings-v2-row">
              <div className="settings-v2-row-text">
                <div className="settings-v2-row-title">Theme</div>
                <div className="settings-v2-row-desc">Switch between light and dark.</div>
              </div>
              <PillToggle
                ariaLabel="Theme"
                value={theme}
                options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
                onChange={setTheme}
              />
            </div>
          </section>

          {/* Sound */}
          <section className="settings-v2-section">
            <div className="settings-v2-kicker">Sound</div>
            <div className="settings-v2-row">
              <div className="settings-v2-row-text">
                <div className="settings-v2-row-title">UI sounds</div>
                <div className="settings-v2-row-desc">Tiny synth cues for clicks, wins, achievements.</div>
              </div>
              <PillToggle
                ariaLabel="Sound"
                value={muted ? 'off' : 'on'}
                options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]}
                onChange={setSound}
              />
            </div>
          </section>

          {/* Data */}
          <section className="settings-v2-section">
            <div className="settings-v2-kicker">Data</div>
            <div className="settings-v2-row">
              <div className="settings-v2-row-text">
                <div className="settings-v2-row-title">Favorites</div>
                <div className="settings-v2-row-desc">
                  {favCount === 0 ? 'No games saved yet.' : `${favCount} game${favCount === 1 ? '' : 's'} saved.`}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onClearFavs}
                disabled={favCount === 0}>
                Clear
              </button>
            </div>
          </section>

          {/* About */}
          <section className="settings-v2-section">
            <div className="settings-v2-kicker">About</div>
            <div className="settings-v2-about">
              <div className="settings-v2-wordmark">PG.Play</div>
              <p className="settings-v2-blurb">
                A boutique arcade by Pushkal Gupta. Four hand-built originals,
                two quiet classics, and the polish to keep them playable.
              </p>
              <div className="settings-v2-version">
                <span className="settings-v2-version-k">Build</span>
                <span className="numeric">v0.1.0</span>
              </div>
            </div>
          </section>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
