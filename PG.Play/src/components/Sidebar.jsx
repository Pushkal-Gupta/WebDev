// Sidebar — arcade left rail.
//
// Brand (top), search trigger, then four navigation groups:
//   • Discover     — Home, Random, New & Updated
//   • Play style   — Solo / Co-op / Versus
//   • Genres       — Action, Puzzle, Arcade, Platformer, Sports, Strategy, Casual
//   • Library      — Favorites, Profile
// Account block + Settings live in the foot.
//
// All filter clicks fire `onSelectFilter({ kind, id })` so Home can drive a
// single source of truth and scroll the catalog grid into view.

import { Icon } from '../icons.jsx';
import { FILTERS, GENRES } from '../data.js';

function NavItem({ icon, label, count, kbd, onClick, active = false, muted = false, dot }) {
  return (
    <button
      type="button"
      className={
        'sidebar-item'
        + (active ? ' is-active' : '')
        + (muted ? ' is-muted' : '')
      }
      onClick={onClick}>
      {dot != null
        ? <span className={`sidebar-item-dot sidebar-genre-${dot}`} aria-hidden="true"/>
        : <span className="sidebar-item-icon" aria-hidden="true">{icon}</span>}
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
  games = [],
  favCount = 0,
  recentCount = 0,
  newUpdatedCount = 0,
  activeMode = null,    // 'all' | 'solo' | 'coop' | 'versus' | null
  activeGenre = null,   // GENRES id | null
  activeView = 'home',  // 'home' | 'favorites' | 'new'
  onHome,
  onSearch,
  onRandom,
  onContinue,           // optional, hidden when no recents
  onShowNew,
  onSelectMode,
  onSelectGenre,
  onFavorites,
  onProfile,
  onOpenSettings,
  onOpenAuth,
  onSignOut,
  onClose,
}) {
  const close = () => { if (onClose) onClose(); };
  const fire = (fn, ...args) => () => { fn?.(...args); close(); };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Signed in');

  const countFor = (filter) => games.filter(filter.match).length;
  const countForGenre = (genre) => games.filter((g) => genre.cats.includes(g.cat)).length;

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

      <button
        type="button"
        className="sidebar-search"
        onClick={fire(onSearch)}
        aria-label="Open search">
        <span className="sidebar-search-icon" aria-hidden="true">{Icon.search}</span>
        <span className="sidebar-search-text">Search games…</span>
        <kbd className="sidebar-search-kbd" aria-hidden="true">⌘K</kbd>
      </button>

      <nav className="sidebar-nav" aria-label="Sections">
        <div className="sidebar-group">
          <div className="sidebar-group-label">Discover</div>
          <NavItem
            icon={Icon.home}
            label="Home"
            count={games.length}
            active={activeView === 'home' && !activeMode && !activeGenre}
            onClick={fire(onHome)}/>
          <NavItem
            icon={Icon.sparkle}
            label="Random pick"
            onClick={fire(onRandom)}/>
          {newUpdatedCount > 0 && (
            <NavItem
              icon={Icon.bolt}
              label="New & updated"
              count={newUpdatedCount}
              active={activeView === 'new'}
              onClick={fire(onShowNew)}/>
          )}
          {recentCount > 0 && (
            <NavItem
              icon={Icon.clock}
              label="Continue"
              count={recentCount}
              onClick={fire(onContinue)}/>
          )}
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-label">Play style</div>
          {FILTERS.filter((f) => f.id !== 'all').map((f) => (
            <NavItem
              key={f.id}
              icon={f.id === 'solo' ? Icon.solo : f.id === 'coop' ? Icon.coop : Icon.versus}
              label={f.label}
              count={countFor(f)}
              active={activeMode === f.id}
              onClick={fire(onSelectMode, f.id)}/>
          ))}
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-label">Genres</div>
          {GENRES.map((g) => {
            const c = countForGenre(g);
            if (c === 0) return null;
            return (
              <NavItem
                key={g.id}
                dot={g.id}
                label={g.label}
                count={c}
                active={activeGenre === g.id}
                onClick={fire(onSelectGenre, g.id)}/>
            );
          })}
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-label">Library</div>
          <NavItem
            icon={Icon.heart}
            label="Favorites"
            count={favCount}
            active={activeView === 'favorites'}
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
