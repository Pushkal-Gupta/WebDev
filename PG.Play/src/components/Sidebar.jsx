// Sidebar — left rail.
//
// Brand at top, real navigation in the middle, account + settings at
// the bottom. Persistent rail on desktop, overlay drawer on mobile.
// Behavior is owned by Home.jsx; this component is purely presentational
// + dispatches the handlers it's given.

import { Icon } from '../icons.jsx';

function NavItem({ icon, label, count, kbd, onClick, active = false, muted = false }) {
  return (
    <button
      type="button"
      className={
        'sidebar-item'
        + (active ? ' is-active' : '')
        + (muted ? ' is-muted' : '')
      }
      onClick={onClick}>
      <span className="sidebar-item-icon" aria-hidden="true">{icon}</span>
      <span className="sidebar-item-label">{label}</span>
      {kbd && <kbd className="sidebar-item-kbd" aria-hidden="true">{kbd}</kbd>}
      {count != null && <span className="sidebar-item-count numeric">{count}</span>}
    </button>
  );
}

function monogramFor(user) {
  if (!user) return 'PG';
  const name = user.user_metadata?.display_name || user.user_metadata?.full_name;
  const source = name || user.email || '';
  if (!source) return 'PG';
  const parts = source.replace(/@.*$/, '').split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function Sidebar({
  user,
  favCount = 0,
  activeSection = 'home',
  onHome,
  onSearch,
  onRandom,
  onFavorites,
  onProfile,
  onOpenSettings,
  onOpenAuth,
  onSignOut,
  onClose,
}) {
  const close = () => { if (onClose) onClose(); };
  const fire = (fn) => () => { fn?.(); close(); };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Signed in');

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <span className="sidebar-brand-name">PG</span>
          <span className="sidebar-brand-dot" aria-hidden="true"/>
          <span className="sidebar-brand-suffix">Play</span>
        </span>
        <button
          type="button"
          className="sidebar-close"
          onClick={close}
          aria-label="Close navigation">
          {Icon.close}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Sections">
        <div className="sidebar-group">
          <div className="sidebar-group-label">Browse</div>
          <NavItem
            icon={Icon.home}
            label="Home"
            active={activeSection === 'home'}
            onClick={fire(onHome)}/>
          <NavItem
            icon={Icon.search}
            label="Search"
            kbd="⌘K"
            onClick={fire(onSearch)}/>
          <NavItem
            icon={Icon.sparkle}
            label="Surprise me"
            onClick={fire(onRandom)}/>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-label">Library</div>
          <NavItem
            icon={Icon.heart}
            label="Favorites"
            count={favCount}
            active={activeSection === 'favorites'}
            onClick={fire(onFavorites)}/>
          <NavItem
            icon={Icon.solo}
            label="Profile"
            onClick={fire(onProfile)}/>
        </div>
      </nav>

      <div className="sidebar-foot">
        {user ? (
          <div className="sidebar-account">
            <button
              type="button"
              className="sidebar-avatar"
              onClick={fire(onProfile)}
              aria-label="Open profile">
              {monogramFor(user)}
            </button>
            <div className="sidebar-account-text">
              <div className="sidebar-account-name">{displayName}</div>
              <div className="sidebar-account-email" title={user.email}>{user.email}</div>
            </div>
            <button
              type="button"
              className="sidebar-account-signout"
              onClick={onSignOut}
              aria-label="Sign out">
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="sidebar-signin"
            onClick={fire(onOpenAuth)}>
            <span className="sidebar-signin-text">
              <span className="sidebar-signin-title">Sign in to sync</span>
              <span className="sidebar-signin-sub">Favorites, bests, achievements</span>
            </span>
            <span className="sidebar-signin-arrow" aria-hidden="true">{Icon.chevronRight}</span>
          </button>
        )}

        <NavItem
          icon={Icon.settings}
          label="Settings"
          muted
          onClick={fire(onOpenSettings)}/>
      </div>
    </aside>
  );
}
