import { useEffect } from 'react';
import { Icon } from '../icons.jsx';

export default function SettingsDrawer({
  theme, setTheme,
  user,
  onOpenAuth, onSignOut,
  onClearFavs, onClearRecent,
  favCount, recentCount,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true"/>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="drawer-head">
          <h2 id="settings-title" className="drawer-title">Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings">
            {Icon.close}
          </button>
        </div>

        <div className="drawer-body">
          <div>
            <div className="settings-group-label">Account</div>
            {user ? (
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">{user.email}</div>
                  <div className="settings-row-desc">Favorites and scores sync across devices.</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={onSignOut}>Sign out</button>
              </div>
            ) : (
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-title">Not signed in</div>
                  <div className="settings-row-desc">Sign in to sync favorites and personal bests.</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>Sign in</button>
              </div>
            )}
          </div>

          <div>
            <div className="settings-group-label">Appearance</div>
            <div className="settings-row">
              <div className="settings-row-text">
                <div className="settings-row-title">Theme</div>
                <div className="settings-row-desc">Switch between light and dark.</div>
              </div>
              <div className="seg" role="radiogroup" aria-label="Theme">
                <button className={theme === 'light' ? 'is-active' : ''} onClick={() => setTheme('light')} role="radio" aria-checked={theme === 'light'}>Light</button>
                <button className={theme === 'dark' ? 'is-active' : ''} onClick={() => setTheme('dark')} role="radio" aria-checked={theme === 'dark'}>Dark</button>
              </div>
            </div>
          </div>

          <div>
            <div className="settings-group-label">Data</div>
            <div className="settings-row">
              <div className="settings-row-text">
                <div className="settings-row-title">Favorites</div>
                <div className="settings-row-desc">
                  {favCount === 0 ? 'No games saved yet.' : `${favCount} game${favCount === 1 ? '' : 's'} saved.`}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={onClearFavs} disabled={favCount === 0}>Clear</button>
            </div>
            <div className="settings-row">
              <div className="settings-row-text">
                <div className="settings-row-title">Recently played</div>
                <div className="settings-row-desc">
                  {recentCount === 0 ? 'No recent activity.' : `${recentCount} game${recentCount === 1 ? '' : 's'} in history.`}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={onClearRecent} disabled={recentCount === 0}>Clear</button>
            </div>
          </div>

          <div>
            <div className="settings-group-label">About</div>
            <div className="settings-about">
              <strong>PG.Play</strong> v0.3 — a curated arcade by Pushkal Gupta.
              Auth, favorites, and scores sync via Supabase. Connect 4, 8-Ball Pool,
              2048, Cut the Rope, Stickman Hook, Raycaster FPS, Trees Hate You and
              the multiplayer Arena are playable today.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
