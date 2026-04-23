import { FILTERS } from '../data.js';
import { Icon } from '../icons.jsx';

const NAV_ICONS = {
  all:      Icon.home,
  solo:     Icon.solo,
  coop:     Icon.coop,
  versus:   Icon.versus,
  playable: Icon.star,
};

export default function Sidebar({
  games,
  activeFilter,
  onFilter,
  favCount,
  onOpenFavorites,
  favoritesOnly,
  onOpenSettings,
  onOpenAuth,
  onSignOut,
  user,
  onClose,
}) {
  const item = (id, label, icon, count) => {
    const isActive = id === (favoritesOnly ? 'favorites' : activeFilter);
    return (
      <button
        key={id}
        className={'side-item' + (isActive ? ' is-active' : '')}
        onClick={() => {
          if (id === 'favorites') onOpenFavorites();
          else onFilter(id);
          if (onClose) onClose();
        }}>
        <span className="side-icon">{icon}</span>
        <span className="side-label">{label}</span>
        {count !== undefined && <span className="side-count">{count}</span>}
      </button>
    );
  };

  const emailShort = user ? (user.email || '').split('@')[0] : null;

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="side-brand">
        <span className="brand-mark" aria-hidden="true"/>
        PG<span className="brand-suffix">.Play</span>
      </div>

      <nav className="side-nav">
        <div className="side-group-label">Browse</div>
        {FILTERS.map((f) => item(f.id, f.label, NAV_ICONS[f.id], games.filter(f.match).length))}

        <div className="side-group-label side-group-spaced">Library</div>
        {item('favorites', 'Favorites', Icon.heart, favCount)}
      </nav>

      <div className="side-foot">
        {user ? (
          <div className="side-profile">
            <div className="avatar avatar-sm" aria-hidden="true">
              {(emailShort || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="side-profile-text">
              <div className="side-profile-name">{emailShort}</div>
              <button className="link side-profile-signout" onClick={onSignOut}>Sign out</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm side-signin" onClick={onOpenAuth}>
            Sign in to sync
          </button>
        )}
        <button className="side-item" onClick={() => { onOpenSettings(); if (onClose) onClose(); }}>
          <span className="side-icon">{Icon.settings}</span>
          <span className="side-label">Settings</span>
        </button>
      </div>
    </aside>
  );
}
