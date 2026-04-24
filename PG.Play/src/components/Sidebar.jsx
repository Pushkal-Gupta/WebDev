import { FILTERS } from '../data.js';
import { Icon } from '../icons.jsx';

const NAV_ICONS = {
  all:      Icon.home,
  solo:     Icon.solo,
  coop:     Icon.coop,
  versus:   Icon.versus,
  playable: Icon.star,
};

const COLLECTION_NAV = [
  { id: 'originals',       label: 'Originals',      icon: Icon.sparkle },
  { id: 'new-updated',     label: 'New & updated',  icon: Icon.bolt },
  { id: 'pass-the-laptop', label: 'Pass the laptop',icon: Icon.versus },
  { id: 'phone-friendly',  label: 'Mobile friendly',icon: Icon.phone },
  { id: 'twitch',          label: 'Fast twitch',    icon: Icon.target },
];

export default function Sidebar({
  games,
  activeFilter,
  onFilter,
  favCount,
  onOpenFavorites,
  favoritesOnly,
  onOpenSettings,
  onOpenProfile,
  onOpenAuth,
  onSignOut,
  user,
  onClose,
  activeCollection,
  onOpenCollection,
  collectionCounts = {},
}) {
  const item = (id, label, icon, count, onClick, isActive) => (
    <button
      key={id}
      className={'side-item' + (isActive ? ' is-active' : '')}
      onClick={() => {
        onClick?.();
        if (onClose) onClose();
      }}>
      <span className="side-icon">{icon}</span>
      <span className="side-label">{label}</span>
      {count !== undefined && <span className="side-count">{count}</span>}
    </button>
  );

  const emailShort = user ? (user.email || '').split('@')[0] : null;
  const libraryActive = favoritesOnly ? 'favorites' : null;

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="side-brand">
        <span className="brand-mark" aria-hidden="true"/>
        PG<span className="brand-suffix">.Play</span>
      </div>

      <nav className="side-nav">
        <div className="side-group-label">Browse</div>
        {FILTERS.map((f) => item(
          f.id,
          f.label,
          NAV_ICONS[f.id],
          games.filter(f.match).length,
          () => onFilter(f.id),
          !favoritesOnly && !activeCollection && activeFilter === f.id,
        ))}

        <div className="side-group-label side-group-spaced">Collections</div>
        {COLLECTION_NAV.map((c) => item(
          c.id,
          c.label,
          c.icon,
          collectionCounts[c.id],
          () => onOpenCollection?.(c.id),
          activeCollection === c.id,
        ))}

        <div className="side-group-label side-group-spaced">Library</div>
        {item('favorites', 'Favorites', Icon.heart, favCount, onOpenFavorites, libraryActive === 'favorites')}
        {item('profile',   'Profile',   Icon.solo,  undefined, onOpenProfile, false)}
      </nav>

      <div className="side-foot">
        {user ? (
          <div className="side-profile">
            <button className="avatar avatar-sm" aria-label="Open profile" onClick={() => { onOpenProfile(); if (onClose) onClose(); }}>
              {(emailShort || 'U').slice(0, 2).toUpperCase()}
            </button>
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
