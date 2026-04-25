// Sidebar v2 — boutique arcade left rail.
//
// Surface: `.glass-strong` so the body atmosphere bleeds through.
// Wordmark uses the display font with a CSS-keyframe pulsing dot
// (paused under reduced-motion via media query). Section headers are
// mono kickers with a tinted dot. Each nav item nudges 2px on hover
// via framer-motion. The Originals row gets four genre dots that
// echo the hero tiles. Footer cleanly splits signed-in / signed-out.

import { motion, useReducedMotion } from 'framer-motion';
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
  { id: 'originals', label: 'Originals', icon: Icon.sparkle },
];

// Genre swatches mirroring the four originals (matches data.js order:
// grudgewood = action, goalbound = sports, slither = arcade, slipshot = action).
// To get four distinct hues we surface action + sports + arcade + puzzle —
// the colour set already bound to PG.Play.
const ORIGINAL_GENRES = ['action', 'sports', 'arcade', 'puzzle'];

function NavItem({ id, label, icon, count, onClick, isActive, reduced, extra }) {
  return (
    <motion.button
      key={id}
      type="button"
      className={'side-item side-item-v2' + (isActive ? ' is-active' : '')}
      onClick={onClick}
      whileHover={reduced ? undefined : { x: 2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      data-nav-id={id}
    >
      <span className="side-icon-tile" aria-hidden="true">
        <span className="side-icon">{icon}</span>
      </span>
      <span className="side-label">{label}</span>
      {extra}
      {count !== undefined && <span className="side-count numeric">{count}</span>}
    </motion.button>
  );
}

function GroupLabel({ children }) {
  return (
    <div className="side-group-label side-group-label-v2">
      <span className="side-group-dot" aria-hidden="true" />
      <span className="side-group-text">{children}</span>
    </div>
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
  const reduced = useReducedMotion();

  const close = () => { if (onClose) onClose(); };
  const handle = (fn) => () => { fn?.(); close(); };

  const libraryActive = favoritesOnly ? 'favorites' : null;
  const emailShort = user ? (user.email || '').split('@')[0] : null;
  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    emailShort ||
    'Signed in';

  const originalsExtra = (
    <span className="side-genre-dots" aria-hidden="true">
      {ORIGINAL_GENRES.map((g) => (
        <span key={g} className={`side-genre-dot side-genre-dot-${g}`} />
      ))}
    </span>
  );

  return (
    <aside className="sidebar sidebar-v2 glass-strong" aria-label="Primary">
      <div className="side-brand side-brand-v2">
        <span className="side-brand-wordmark">
          <span className="side-brand-name">PG</span>
          <span className="side-brand-dot" aria-hidden="true"/>
          <span className="side-brand-suffix">Play</span>
        </span>
      </div>

      <nav className="side-nav side-nav-v2" aria-label="Sections">
        <GroupLabel>Browse</GroupLabel>
        {FILTERS.map((f) => (
          <NavItem
            key={f.id}
            id={f.id}
            label={f.label}
            icon={NAV_ICONS[f.id] || Icon.home}
            count={games.filter(f.match).length}
            onClick={handle(() => onFilter(f.id))}
            isActive={!favoritesOnly && !activeCollection && activeFilter === f.id}
            reduced={reduced}
          />
        ))}

        <GroupLabel>Collections</GroupLabel>
        {COLLECTION_NAV.map((c) => (
          <NavItem
            key={c.id}
            id={c.id}
            label={c.label}
            icon={c.icon}
            count={collectionCounts[c.id]}
            onClick={handle(() => onOpenCollection?.(c.id))}
            isActive={activeCollection === c.id}
            reduced={reduced}
            extra={c.id === 'originals' ? originalsExtra : null}
          />
        ))}

        <GroupLabel>Library</GroupLabel>
        <NavItem
          id="favorites"
          label="Favorites"
          icon={Icon.heart}
          count={favCount}
          onClick={handle(onOpenFavorites)}
          isActive={libraryActive === 'favorites'}
          reduced={reduced}
        />
        <NavItem
          id="profile"
          label="Profile"
          icon={Icon.solo}
          onClick={handle(onOpenProfile)}
          isActive={false}
          reduced={reduced}
        />
      </nav>

      <div className="side-foot side-foot-v2">
        {user ? (
          <div className="side-account">
            <button
              type="button"
              className="side-avatar glass"
              aria-label="Open profile"
              onClick={handle(onOpenProfile)}
            >
              {monogramFor(user)}
            </button>
            <div className="side-account-text">
              <div className="side-account-name">{displayName}</div>
              <div className="side-account-email" title={user.email}>{user.email}</div>
            </div>
            <button
              type="button"
              className="side-account-signout"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="side-signin-v2"
            onClick={handle(onOpenAuth)}
          >
            <span className="side-signin-label">Sign in to sync</span>
            <span className="side-signin-icon" aria-hidden="true">{Icon.chevronRight}</span>
          </button>
        )}
        <div className="side-foot-divider" aria-hidden="true" />
        <motion.button
          type="button"
          className="side-item side-item-v2 side-item-settings"
          onClick={handle(onOpenSettings)}
          whileHover={reduced ? undefined : { x: 2 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        >
          <span className="side-icon-tile" aria-hidden="true">
            <span className="side-icon">{Icon.settings}</span>
          </span>
          <span className="side-label">Settings</span>
        </motion.button>
      </div>
    </aside>
  );
}
