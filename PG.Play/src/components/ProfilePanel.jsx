import { useEffect } from 'react';
import { Icon } from '../icons.jsx';
import { ACHIEVEMENTS } from '../hooks/useAchievements.js';

export default function ProfilePanel({
  user, bests, unlocked, onOpenAuth, onSignOut, onClose,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const totalBests = Object.keys(bests || {}).length;
  const totalPlays = Object.values(bests || {}).reduce((s, b) => s + (b.plays || 0), 0);
  const unlockedCount = Object.values(unlocked || {}).filter(Boolean).length;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true"/>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="drawer-head">
          <h2 id="profile-title" className="drawer-title">Profile</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close profile">{Icon.close}</button>
        </div>

        <div className="drawer-body">
          {user ? (
            <div className="profile-hero">
              <div className="avatar profile-avatar" aria-hidden="true">
                {(user.email || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="profile-name">{user.email}</div>
                <button className="link" onClick={onSignOut}>Sign out</button>
              </div>
            </div>
          ) : (
            <div className="profile-hero">
              <div className="avatar profile-avatar" aria-hidden="true">PG</div>
              <div>
                <div className="profile-name">Guest</div>
                <button className="link" onClick={onOpenAuth}>Sign in to sync progress</button>
              </div>
            </div>
          )}

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-v">{totalBests}</div>
              <div className="profile-stat-l">Personal bests</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-v">{totalPlays}</div>
              <div className="profile-stat-l">Runs recorded</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-v">{unlockedCount}/{ACHIEVEMENTS.length}</div>
              <div className="profile-stat-l">Achievements</div>
            </div>
          </div>

          <div>
            <div className="settings-group-label">Achievements</div>
            <div className="ach-list">
              {ACHIEVEMENTS.map((a) => (
                <div key={a.id} className={'ach-item' + (unlocked[a.id] ? ' is-unlocked' : '')}>
                  <div className="ach-icon" aria-hidden="true">
                    {unlocked[a.id] ? '✓' : '•'}
                  </div>
                  <div className="ach-text">
                    <div className="ach-label">{a.label}</div>
                    <div className="ach-desc">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalBests > 0 && (
            <div>
              <div className="settings-group-label">Personal bests</div>
              <div className="bests-list">
                {Object.entries(bests).map(([id, b]) => (
                  <div key={id} className="bests-row">
                    <span className="bests-id">{id}</span>
                    <span className="bests-v">{b.best}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
