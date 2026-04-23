import { useEffect, useMemo, useState } from 'react';
import { GAMES, FILTERS, COLLECTIONS } from './data.js';
import { Icon } from './icons.jsx';
import Card from './components/Card.jsx';
import FeaturedHero from './components/FeaturedHero.jsx';
import Sidebar from './components/Sidebar.jsx';
import GameIntro from './components/GameIntro.jsx';
import SettingsDrawer from './components/SettingsDrawer.jsx';
import AuthModal from './components/AuthModal.jsx';
import Collection from './components/Collection.jsx';
import ProfilePanel from './components/ProfilePanel.jsx';
import AchievementToast from './components/AchievementToast.jsx';
import { useSession } from './hooks/useSession.js';
import { useFavorites } from './hooks/useFavorites.js';
import { useBests } from './hooks/useBests.js';
import { useAchievements } from './hooks/useAchievements.js';
import { supabase } from './supabase.js';
import { sfx } from './sound.js';

const readJSON = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
};

const FEATURED = GAMES.find((g) => g.featured) || GAMES[0];

// Show two rotating collection rails on the home surface, not all six at once —
// the other four live as filter destinations or on dedicated pages later.
const HOME_COLLECTIONS = ['start-in-ten', 'pass-the-laptop'];

export default function App() {
  const [theme, setTheme]         = useState(() => localStorage.getItem('pd-theme') || 'dark');
  const [q, setQ]                 = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [active, setActive]       = useState(null);
  const [recent, setRecent]       = useState(() => readJSON('pd-recent', []));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [sideOpen, setSideOpen]   = useState(false);

  const { user } = useSession();
  const { favs, toggle: toggleFav, clear: clearFavs } = useFavorites(user);
  const { bests, submit: submitBest } = useBests(user);
  const { unlocked, toast } = useAchievements(user, bests);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pd-theme', theme);
  }, [theme]);
  useEffect(() => { localStorage.setItem('pd-recent', JSON.stringify(recent)); }, [recent]);

  // Score bus → persist + (optionally) play win chime
  useEffect(() => {
    const onScore = (e) => {
      const { gameId, score, meta } = e.detail || {};
      if (!gameId || typeof score !== 'number') return;
      submitBest(gameId, score, meta);
      sfx.win();
    };
    window.addEventListener('pgplay:score', onScore);
    return () => window.removeEventListener('pgplay:score', onScore);
  }, [submitBest]);

  const onOpen = (g) => {
    sfx.open();
    setActive(g);
    setRecent((r) => [g.id, ...r.filter((x) => x !== g.id)].slice(0, 8));
    window.dispatchEvent(new CustomEvent('pgplay:open', { detail: { gameId: g.id } }));
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const filterFn = FILTERS.find((f) => f.id === activeFilter)?.match ?? (() => true);

  const visibleGames = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = favoritesOnly
      ? GAMES.filter((g) => favs[g.id])
      : GAMES.filter(filterFn);
    if (!needle) return base;
    return base.filter((g) =>
      g.name.toLowerCase().includes(needle) ||
      g.cat.toLowerCase().includes(needle) ||
      (g.tagline || '').toLowerCase().includes(needle)
    );
  }, [q, activeFilter, favoritesOnly, favs]);

  const recentGames = useMemo(
    () => recent.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean),
    [recent]
  );

  const favCount = Object.values(favs).filter(Boolean).length;

  const currentLabel = favoritesOnly
    ? 'Favorites'
    : (FILTERS.find((f) => f.id === activeFilter)?.label || 'All');

  const showHero         = !q && !favoritesOnly && activeFilter === 'all';
  const showRecent       = recentGames.length > 0 && !q && !favoritesOnly && activeFilter === 'all';
  const showCollections  = !q && !favoritesOnly && activeFilter === 'all';

  const onFilter = (id) => { setFavoritesOnly(false); setActiveFilter(id); };

  return (
    <div className="app-layout">
      {sideOpen && <div className="side-backdrop" onClick={() => setSideOpen(false)} aria-hidden="true"/>}
      <div className={'sidebar-wrap' + (sideOpen ? ' is-open' : '')}>
        <Sidebar
          games={GAMES}
          activeFilter={activeFilter}
          onFilter={onFilter}
          favCount={favCount}
          onOpenFavorites={() => setFavoritesOnly(true)}
          favoritesOnly={favoritesOnly}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          onSignOut={signOut}
          user={user}
          onClose={() => setSideOpen(false)}
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
              placeholder="Search games"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search games"/>
          </div>
          {user
            ? <button className="avatar" title={user.email} onClick={() => setProfileOpen(true)}>
                {(user.email || 'U').slice(0, 2).toUpperCase()}
              </button>
            : <button className="btn btn-ghost btn-sm" onClick={() => setAuthOpen(true)}>Sign in</button>}
        </div>

        <div className="main-inner">
          {showHero && (
            <FeaturedHero
              game={FEATURED}
              fav={!!favs[FEATURED.id]}
              onFav={toggleFav}
              onOpen={() => onOpen(FEATURED)}/>
          )}

          {showRecent && (
            <section className="section" aria-labelledby="continue-title">
              <div className="section-head">
                <h2 id="continue-title" className="section-title">Continue playing</h2>
                <span className="section-count">{recentGames.length}</span>
              </div>
              <div className="rail">
                {recentGames.map((g) => (
                  <Card key={g.id} game={g} fav={!!favs[g.id]} onFav={toggleFav} onOpen={() => onOpen(g)} best={bests[g.id]?.best}/>
                ))}
              </div>
            </section>
          )}

          {showCollections && HOME_COLLECTIONS.map((id) => {
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
                bests={bests}/>
            );
          })}

          <section className="section" aria-labelledby="grid-title">
            <div className="section-head">
              <h2 id="grid-title" className="section-title">{currentLabel}</h2>
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
                  <Card key={g.id} game={g} fav={!!favs[g.id]} onFav={toggleFav} onOpen={() => onOpen(g)} best={bests[g.id]?.best}/>
                ))}
              </div>
            )}
          </section>

          <footer className="app-footer">
            PG.Play · {GAMES.length} games · <a href="https://pushkalgupta.com">pushkalgupta.com</a>
          </footer>
        </div>
      </main>

      {active && <GameIntro game={active} best={bests[active.id]?.best} onClose={() => setActive(null)}/>}
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
      <AchievementToast toast={toast}/>
    </div>
  );
}
