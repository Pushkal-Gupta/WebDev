import { useEffect } from 'react';
import { Icon } from '../icons.jsx';

export default function SettingsDrawer({
  theme, setTheme,
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
            <div className="settings-group-label">Appearance</div>
            <div className="settings-row">
              <div className="settings-row-text">
                <div className="settings-row-title">Theme</div>
                <div className="settings-row-desc">Switch between light and dark.</div>
              </div>
              <div className="seg" role="radiogroup" aria-label="Theme">
                <button
                  className={theme === 'light' ? 'is-active' : ''}
                  onClick={() => setTheme('light')}
                  role="radio"
                  aria-checked={theme === 'light'}>
                  Light
                </button>
                <button
                  className={theme === 'dark' ? 'is-active' : ''}
                  onClick={() => setTheme('dark')}
                  role="radio"
                  aria-checked={theme === 'dark'}>
                  Dark
                </button>
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
              <button className="btn btn-ghost" onClick={onClearFavs} disabled={favCount === 0}>
                Clear
              </button>
            </div>
            <div className="settings-row">
              <div className="settings-row-text">
                <div className="settings-row-title">Recently played</div>
                <div className="settings-row-desc">
                  {recentCount === 0 ? 'No recent activity.' : `${recentCount} game${recentCount === 1 ? '' : 's'} in history.`}
                </div>
              </div>
              <button className="btn btn-ghost" onClick={onClearRecent} disabled={recentCount === 0}>
                Clear
              </button>
            </div>
          </div>

          <div>
            <div className="settings-group-label">About</div>
            <div className="settings-about">
              <strong>PG.Play</strong> v0.2 — sixteen classic titles wrapped in a clean launcher.
              Part of <strong>pushkalgupta.com</strong>. Connect 4 and 8-Ball Pool are live;
              the rest ship as playable chapters in future updates.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
