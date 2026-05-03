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
import { isAdminVerified, setAdminVerified, verifyAdminPassword } from '../utils/admin.js';

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
  // Phase 21 — only render the admin section when the URL contains
  // `?admin` (or `?admin=1` etc). Anyone without that query string
  // can't see the section at all; with it, the password gate is the
  // actual lock. Computed once on mount; toggling it requires reload.
  const adminQueryEnabled = (() => {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('admin');
    } catch { return false; }
  })();
  // Admin gate state. `revealed` flips the password row open; the
  // gate doesn't open the section itself (it's always rendered when
  // ?admin is in the URL).
  const [adminRevealed, setAdminRevealed] = useState(() => isAdminVerified());
  const [adminPwd, setAdminPwd]           = useState('');
  const [adminPwdShown, setAdminPwdShown] = useState(false);
  const [adminBusy, setAdminBusy]         = useState(false);
  const [adminError, setAdminError]       = useState(null);
  const [adminVerified, setAdminVerifiedState] = useState(() => isAdminVerified());
  const [ffUnlockAll, setFfUnlockAll]     = useState(() => {
    try { return sessionStorage.getItem('pgplay-ff-admin-all') === '1'; }
    catch { return false; }
  });

  const trySubmitAdmin = async (e) => {
    if (e) e.preventDefault();
    if (!adminPwd || adminBusy) return;
    setAdminBusy(true);
    setAdminError(null);
    const { ok } = await verifyAdminPassword(adminPwd);
    setAdminBusy(false);
    if (ok) {
      setAdminVerified(true);
      setAdminVerifiedState(true);
      setAdminPwd('');
      setAdminPwdShown(false);
    } else {
      setAdminError('Wrong password.');
    }
  };

  const signOutAdmin = () => {
    setAdminVerified(false);
    setAdminVerifiedState(false);
    setFfUnlockAll(false);
    try { sessionStorage.removeItem('pgplay-ff-admin-all'); }
    catch { /* ignore */ }
  };

  const toggleFfUnlockAll = () => {
    setFfUnlockAll((v) => {
      const next = !v;
      try {
        if (next) sessionStorage.setItem('pgplay-ff-admin-all', '1');
        else sessionStorage.removeItem('pgplay-ff-admin-all');
      } catch { /* ignore */ }
      return next;
    });
  };
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

          {/* Admin — gated by a server-verified password AND a `?admin`
              URL flag. Without ?admin in the query string the section
              is not rendered at all (anyone hitting plain /home doesn't
              see it). With it, the password is the real lock. */}
          {adminQueryEnabled && (
          <section className="settings-v2-section">
            <div className="settings-v2-kicker">Admin</div>
            {!adminRevealed && !adminVerified && (
              <div className="settings-v2-row">
                <div className="settings-v2-row-text">
                  <div className="settings-v2-row-title">Admin tools</div>
                  <div className="settings-v2-row-desc">Hidden by default. Enter the password to unlock dev shortcuts.</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAdminRevealed(true)}>
                  Show
                </button>
              </div>
            )}
            {adminRevealed && !adminVerified && (
              <form className="settings-admin-gate" onSubmit={trySubmitAdmin}>
                <label className="settings-admin-label" htmlFor="settings-admin-pwd">
                  Admin password
                </label>
                <div className="settings-admin-row">
                  <div className="settings-admin-input-wrap">
                    <input
                      id="settings-admin-pwd"
                      className="settings-admin-input"
                      type={adminPwdShown ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={adminPwd}
                      onChange={(e) => { setAdminPwd(e.target.value); setAdminError(null); }}
                      placeholder="Enter password"
                      disabled={adminBusy}
                    />
                    <button
                      type="button"
                      className="settings-admin-eye"
                      onClick={() => setAdminPwdShown((v) => !v)}
                      aria-label={adminPwdShown ? 'Hide password' : 'Show password'}
                      aria-pressed={adminPwdShown}
                      tabIndex={0}>
                      {adminPwdShown ? Icon.eyeOff : Icon.eye}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={adminBusy || !adminPwd}>
                    {adminBusy ? 'Verifying…' : 'Unlock'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setAdminRevealed(false); setAdminPwd(''); setAdminError(null); setAdminPwdShown(false); }}>
                    Cancel
                  </button>
                </div>
                {adminError && <div className="settings-admin-error">{adminError}</div>}
                <div className="settings-admin-hint">
                  Verified server-side when the edge function is deployed; a
                  one-way PBKDF2 digest in the bundle handles the local case.
                  The plaintext password is never stored client-side.
                </div>
              </form>
            )}
            {adminVerified && (
              <>
                <div className="settings-v2-row settings-admin-status">
                  <div className="settings-v2-row-text">
                    <div className="settings-v2-row-title">Admin unlocked</div>
                    <div className="settings-v2-row-desc">Tools below are session-scoped. Closing the tab signs you out.</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={signOutAdmin}>Sign out</button>
                </div>
                <div className="settings-v2-row">
                  <div className="settings-v2-row-text">
                    <div className="settings-v2-row-title">Frost Fight — unlock every room</div>
                    <div className="settings-v2-row-desc">Bypasses the cleared-rooms gate in the Frost Fight lobby.</div>
                  </div>
                  <PillToggle
                    ariaLabel="Unlock all Frost Fight rooms"
                    value={ffUnlockAll ? 'on' : 'off'}
                    options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]}
                    onChange={(v) => {
                      if ((v === 'on') !== ffUnlockAll) toggleFfUnlockAll();
                    }}
                  />
                </div>
              </>
            )}
          </section>
          )}

          {/* About */}
          <section className="settings-v2-section">
            <div className="settings-v2-kicker">About</div>
            <div className="settings-v2-about">
              <div className="settings-v2-wordmark">PG.Play</div>
              <p className="settings-v2-blurb">
                A boutique arcade by Pushkal Gupta. Twenty hand-built games,
                instant in the browser, polished as time allows.
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
