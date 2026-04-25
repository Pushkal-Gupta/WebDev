// Home — the lobby surface. Sidebar + filter bar + hero + rails + grid.
//
// State that lives here is browse-only: search query, filter, favorites
// view, collection view, and the various drawer / modal toggles.
// Game launching is now a navigation, not a modal — `onOpen(game)` calls
// `navigate('/game/:id')` and the GamePage owns everything from there.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES, FILTERS, COLLECTIONS, EDITORS_PICKS } from '../data.js';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';
import Card from '../components/Card.jsx';
import FeaturedHero from '../components/FeaturedHero.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SettingsDrawer from '../components/SettingsDrawer.jsx';
import AuthModal from '../components/AuthModal.jsx';
import Collection from '../components/Collection.jsx';
import ProfilePanel from '../components/ProfilePanel.jsx';
import { useSession } from '../hooks/useSession.js';
import { useFavorites } from '../hooks/useFavorites.js';
import { useBests } from '../hooks/useBests.js';
import { useAchievements } from '../hooks/useAchievements.js';
import { useTheme } from '../hooks/useTheme.js';
import { supabase } from '../supabase.js';
import { sfx } from '../sound.js';

const readJSON = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
};

const FEATURED = GAMES.find((g) => g.featured) || GAMES[0];

const HOME_RAILS = [
  { id: 'originals',       variant: 'rail' },
  { id: 'pass-the-laptop', variant: 'rail' },
  { id: 'phone-friendly',  variant: 'rail' },
  { id: 'twitch',          variant: 'rail' },
  { id: 'brainy',          variant: 'rail' },
  { id: 'mean-and-funny',  variant: 'rail' },
];

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ]                       = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeCollection, setActiveCollection] = useState(null);
  const [recent, setRecent]             = useState(() => readJSON('pd-recent', []));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [authOpen, setAuthOpen]         = useState(false);
  const [sideOpen, setSideOpen]         = useState(false);

  const [theme, setTheme] = useTheme();
  const { user } = useSession();
  const { favs, toggle: toggleFav, clear: clearFavs } = useFavorites(user);
  const { bests } = useBests(user);
  const { unlocked } = useAchievements(user, bests);

  useEffect(() => { localStorage.setItem('pd-recent', JSON.stringify(recent)); }, [recent]);

  const onOpen = (g) => {
    if (!g) return;
    sfx.open();
    setRecent((r) => [g.id, ...r.filter((x) => x !== g.id)].slice(0, 8));
    localStorage.setItem('pd-last-game', g.id);
    window.dispatchEvent(new CustomEvent('pgplay:open', { detail: { gameId: g.id } }));
    navigate(`/game/${g.id}`);
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const filterFn = FILTERS.find((f) => f.id === activeFilter)?.match ?? (() => true);

  const activeCollectionDef = useMemo(
    () => activeCollection ? COLLECTIONS.find((c) => c.id === activeCollection) : null,
    [activeCollection]
  );

  const visibleGames = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let base;
    if (favoritesOnly) {
      base = GAMES.filter((g) => favs[g.id]);
    } else if (activeCollectionDef) {
      const ids = new Set(activeCollectionDef.ids);
      base = GAMES.filter((g) => ids.has(g.id));
    } else {
      base = GAMES.filter(filterFn);
    }
    if (!needle) return base;
    return base.filter((g) =>
      g.name.toLowerCase().includes(needle) ||
      g.cat.toLowerCase().includes(needle) ||
      (g.tagline || '').toLowerCase().includes(needle)
    );
  }, [q, activeFilter, favoritesOnly, favs, activeCollectionDef]);

  const recentGames = useMemo(
    () => recent.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean),
    [recent]
  );

  const becauseGames = useMemo(() => {
    if (recentGames.length === 0) return null;
    const seed = recentGames[0];
    const seedTags = new Set(seed.skillTags || []);
    const items = GAMES
      .filter((g) => g.id !== seed.id)
      .map((g) => {
        const tagOverlap = (g.skillTags || []).filter((t) => seedTags.has(t)).length;
        const catMatch = g.cat === seed.cat ? 2 : 0;
        return { g, score: tagOverlap * 2 + catMatch + (g.playable ? 1 : 0) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.g);
    return { seed, items };
  }, [recentGames]);

  const favCount = Object.values(favs).filter(Boolean).length;

  const collectionCounts = useMemo(() => {
    const out = {};
    for (const c of COLLECTIONS) {
      out[c.id] = c.ids.filter((id) => GAMES.find((g) => g.id === id)).length;
    }
    return out;
  }, []);

  const currentLabel = favoritesOnly
    ? 'Favorites'
    : activeCollectionDef
    ? activeCollectionDef.title
    : (FILTERS.find((f) => f.id === activeFilter)?.label || 'All');

  const isHomeBrowse = !q && !favoritesOnly && !activeCollectionDef && activeFilter === 'all';
  const showHero        = isHomeBrowse;
  const showRecent      = isHomeBrowse && recentGames.length > 0;
  const showBecause     = isHomeBrowse && becauseGames && becauseGames.items?.length > 0;
  const showEditors     = isHomeBrowse;
  const showCollections = isHomeBrowse;

  const editorsGames = useMemo(
    () => EDITORS_PICKS.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean),
    []
  );

  const onFilter = (id) => {
    setFavoritesOnly(false);
    setActiveCollection(null);
    setActiveFilter(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const onOpenCollection = (id) => {
    setFavoritesOnly(false);
    setActiveCollection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-layout">
      {sideOpen && <div className="side-backdrop" onClick={() => setSideOpen(false)} aria-hidden="true"/>}
      <div className={'sidebar-wrap' + (sideOpen ? ' is-open' : '')}>
        <Sidebar
          games={GAMES}
          activeFilter={activeFilter}
          onFilter={onFilter}
          favCount={favCount}
          onOpenFavorites={() => { setActiveCollection(null); setFavoritesOnly(true); }}
          favoritesOnly={favoritesOnly}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          onSignOut={signOut}
          user={user}
          onClose={() => setSideOpen(false)}
          activeCollection={activeCollection}
          onOpenCollection={onOpenCollection}
          collectionCounts={collectionCounts}
        />
      </div>

      <main className="app-main">
        <div className="main-topbar">
          <button
            className="icon-btn main-menu"
            onClick={() => setSideOpen(true)}
            aria-label="Open navigation">
            {Icon.menu}
          </button>
          <div className="search">
            <span className="search-icon">{Icon.search}</span>
            <input
              type="search"
              placeholder="Search games, genres, skill tags"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search games"/>
            {q && (
              <button className="search-clear" onClick={() => setQ('')} aria-label="Clear search">{Icon.close}</button>
            )}
            {!q && <kbd className="search-kbd" aria-hidden="true">⌘K</kbd>}
          </div>
          {user
            ? <button className="avatar" title={user.email} onClick={() => setProfileOpen(true)}>
                {(user.email || 'U').slice(0, 2).toUpperCase()}
              </button>
            : <button className="btn btn-ghost btn-sm" onClick={() => setAuthOpen(true)}>Sign in</button>}
        </div>

        <div className="quick-filters" aria-label="Quick filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={'chip-tab' + (!favoritesOnly && !activeCollectionDef && activeFilter === f.id ? ' is-active' : '')}
              onClick={() => onFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="main-inner">
          {showHero && (
            <header className="home-lede">
              <div className="home-lede-kicker">An arcade anthology</div>
              <h1 className="home-lede-title">PG.Play</h1>
              <p className="home-lede-sub">
                {GAMES.filter((g) => g.playable).length} titles — curated, original, hand-built.
              </p>
            </header>
          )}
          {showHero && (
            <FeaturedHero
              game={FEATURED}
              fav={!!favs[FEATURED.id]}
              onFav={toggleFav}
              onOpen={() => onOpen(FEATURED)}
              best={bests[FEATURED.id]?.best}/>
          )}

          {showRecent && (
            <section className="section" aria-labelledby="continue-title">
              <div className="section-head">
                <div className="section-head-text">
                  <div className="section-kicker">Jump back in</div>
                  <h2 id="continue-title" className="section-title">Continue playing</h2>
                </div>
                <span className="section-count">{recentGames.length}</span>
              </div>
              <div className="rail">
                {recentGames.map((g) => (
                  <Card key={g.id} game={g} fav={!!favs[g.id]} onFav={toggleFav} onOpen={() => onOpen(g)} best={bests[g.id]?.best}/>
                ))}
              </div>
            </section>
          )}

          {showEditors && editorsGames.length > 0 && (
            <section className="section editors-picks" aria-labelledby="editors-title">
              <div className="section-head">
                <div className="section-head-text">
                  <div className="section-kicker">
                    <span className="section-kicker-icon">{Icon.sparkle}</span> Editor’s picks
                  </div>
                  <h2 id="editors-title" className="section-title">Four chosen this week</h2>
                  <p className="section-blurb">Curated by the team, not the algorithm. A starting point when nothing jumps out.</p>
                </div>
              </div>
              <div className="editors-grid">
                {editorsGames.map((g, i) => {
                  const Cover = GAME_COVERS[g.id];
                  return (
                    <button
                      key={g.id}
                      className={`editors-tile editors-tile-${i}`}
                      onClick={() => onOpen(g)}>
                      <div className="editors-tile-cover">{Cover && <Cover/>}</div>
                      <div className="editors-tile-shade"/>
                      <div className="editors-tile-body">
                        <div className="editors-tile-kicker">{g.cat}</div>
                        <div className="editors-tile-title">{g.name}</div>
                        <div className="editors-tile-meta">{g.tagline}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {showBecause && becauseGames.items && (
            <section className="section" aria-labelledby="because-title">
              <div className="section-head">
                <div className="section-head-text">
                  <div className="section-kicker">Because you played</div>
                  <h2 id="because-title" className="section-title">{becauseGames.seed.name}</h2>
                </div>
                <span className="section-count">{becauseGames.items.length}</span>
              </div>
              <div className="rail">
                {becauseGames.items.map((g) => (
                  <Card key={g.id} game={g} fav={!!favs[g.id]} onFav={toggleFav} onOpen={() => onOpen(g)} best={bests[g.id]?.best}/>
                ))}
              </div>
            </section>
          )}

          {showCollections && HOME_RAILS.map(({ id, variant }) => {
            const c = COLLECTIONS.find((x) => x.id === id);
            if (!c) return null;
            return (
              <Collection
                key={c.id}
                collection={c}
                games={GAMES}
                favs={favs}
                onFav={toggleFav}
                onOpen={onOpen}
                bests={bests}
                variant={variant}
                onOpenAll={onOpenCollection}/>
            );
          })}

          <section className="section section-grid" aria-labelledby="grid-title">
            <div className="section-head">
              <div className="section-head-text">
                {activeCollectionDef && (
                  <div className="section-kicker">Collection</div>
                )}
                <h2 id="grid-title" className="section-title">{currentLabel}</h2>
                {activeCollectionDef && (
                  <p className="section-blurb">{activeCollectionDef.blurb}</p>
                )}
              </div>
              <span className="section-count">
                {visibleGames.length} {visibleGames.length === 1 ? 'title' : 'titles'}
              </span>
            </div>
            {visibleGames.length === 0 ? (
              <div className="empty">
                {favoritesOnly && favCount === 0
                  ? <>No favorites yet. Tap the <strong>heart</strong> on a game to save it here.</>
                  : <>No games match <strong>“{q || currentLabel.toLowerCase()}”</strong>.</>}
              </div>
            ) : (
              <div className="grid">
                {visibleGames.map((g) => (
                  <Card
                    key={g.id}
                    game={g}
                    fav={!!favs[g.id]}
                    onFav={toggleFav}
                    onOpen={() => onOpen(g)}
                    best={bests[g.id]?.best}/>
                ))}
              </div>
            )}
          </section>

          <footer className="app-footer">
            PG.Play · {GAMES.length} games · <a href="https://pushkalgupta.com">pushkalgupta.com</a>
          </footer>
        </div>
      </main>

      {settingsOpen && (
        <SettingsDrawer
          theme={theme}
          setTheme={setTheme}
          user={user}
          onOpenAuth={() => { setAuthOpen(true); setSettingsOpen(false); }}
          onSignOut={async () => { await signOut(); }}
          onClearFavs={clearFavs}
          onClearRecent={() => setRecent([])}
          favCount={favCount}
          recentCount={recent.length}
          onClose={() => setSettingsOpen(false)}/>
      )}
      {profileOpen && (
        <ProfilePanel
          user={user}
          bests={bests}
          unlocked={unlocked}
          onOpenAuth={() => { setAuthOpen(true); setProfileOpen(false); }}
          onSignOut={async () => { await signOut(); }}
          onClose={() => setProfileOpen(false)}/>
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)}/>}
    </div>
  );
}
