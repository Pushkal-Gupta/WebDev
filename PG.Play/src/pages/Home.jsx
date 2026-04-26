// Home — boutique arcade lobby.
//
// Six playable games. The four originals occupy 2×2 hero tiles; the two
// classics sit in a side rail. Above the bento, a strong typographic hero
// section and a command-palette-style search.
//
// Browse-only state: search query, drawer toggles, sign-in, settings.
// Filters and editorial rails were removed — with six titles the bento
// is the editorial layout.

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { GAMES, EDITORS_PICKS, FILTERS, COLLECTIONS } from '../data.js';
import { Icon } from '../icons.jsx';
import Card from '../components/Card.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SettingsDrawer from '../components/SettingsDrawer.jsx';
import AuthModal from '../components/AuthModal.jsx';
import ProfilePanel from '../components/ProfilePanel.jsx';
import HomeLeaderboard from '../components/HomeLeaderboard.jsx';
import SearchPalette from '../components/SearchPalette.jsx';
import Footer from '../components/Footer.jsx';
import Onboarding from '../components/Onboarding.jsx';
import { useCanRender3D } from '../hooks/useCanRender3D.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { useRecent } from '../hooks/useRecent.js';

// Lazy-loaded so the homepage's first paint doesn't pay for r3f / three.
const HomeHero3D = lazy(() => import('../components/three/HomeHero3D.jsx'));
import { useSession } from '../hooks/useSession.js';
import { useFavorites } from '../hooks/useFavorites.js';
import { useBests } from '../hooks/useBests.js';
import { useAchievements } from '../hooks/useAchievements.js';
import { useTheme } from '../hooks/useTheme.js';
import { supabase } from '../supabase.js';
import { sfx } from '../sound.js';

// The four originals get the bento hero tiles; the two headline classics
// fill the small slots. Everything else playable lives in the "More games"
// grid below the bento. Order: editorial via EDITORS_PICKS.
const HERO_IDS = EDITORS_PICKS;
const CLASSIC_IDS = ['g2048', 'connect4'];

// Hero copy options (pick one).
const HERO_HEADLINES = [
  'A small arcade. Big appetite for one more run.',
  'Twenty games. Zero downloads. One arcade.',
  'Hand-built games for the couple of minutes you have.',
];
const HERO_HEADLINE = HERO_HEADLINES[0];

export default function Home() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const can3D = useCanRender3D();

  useDocumentMeta({
    title: 'PG.Play — a hand-built arcade',
    description: 'Twenty hand-built browser games. No accounts, no downloads — one click and you are in.',
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [authOpen, setAuthOpen]         = useState(false);
  const [sideOpen, setSideOpen]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const [theme, setTheme] = useTheme();
  const { user } = useSession();
  const { favs, toggle: toggleFav, clear: clearFavs } = useFavorites(user);
  const { bests } = useBests(user);
  const { unlocked } = useAchievements(user, bests);
  const { recent } = useRecent();

  const onOpen = (g) => {
    if (!g) return;
    sfx.open();
    window.dispatchEvent(new CustomEvent('pgplay:open', { detail: { gameId: g.id } }));
    navigate(`/game/${g.id}`);
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  // Cmd-K / Ctrl-K opens the command palette. Esc closes the mobile drawer.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && sideOpen) {
        setSideOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sideOpen]);

  // Playable catalog, sorted: 4 originals → 2 headline classics → rest.
  const playable = useMemo(() => GAMES.filter((g) => g.playable), []);
  const heroes = useMemo(
    () => HERO_IDS.map((id) => playable.find((g) => g.id === id)).filter(Boolean),
    [playable]
  );
  const classics = useMemo(
    () => CLASSIC_IDS.map((id) => playable.find((g) => g.id === id)).filter(Boolean),
    [playable]
  );
  const more = useMemo(
    () => playable.filter((g) => !HERO_IDS.includes(g.id) && !CLASSIC_IDS.includes(g.id)),
    [playable]
  );

  const filterFn = FILTERS.find((f) => f.id === activeFilter)?.match ?? (() => true);
  const visibleMore = useMemo(() => more.filter(filterFn), [more, filterFn]);

  // Continue-playing rail: resolve recent ids → playable game objects.
  // We render the rail only when there are at least two recents so a
  // single open doesn't visually weight the page.
  const recentGames = useMemo(
    () => recent
      .map((id) => playable.find((g) => g.id === id))
      .filter(Boolean),
    [recent, playable],
  );

  // Pick a small set of editorial collections to surface as rails. The
  // "New & updated" rail comes first (drives discovery of fresh ships).
  // Then taste-curated rails. Skip collections whose ids aren't playable.
  const railCollections = useMemo(() => {
    const wanted = ['new-updated', 'start-in-ten', 'twitch', 'brainy'];
    return wanted
      .map((id) => COLLECTIONS.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({
        ...c,
        items: c.ids
          .map((id) => playable.find((g) => g.id === id))
          .filter(Boolean),
      }))
      .filter((c) => c.items.length >= 3);
  }, [playable]);

  const editorsGames = heroes; // bento hero tiles

  // The "Play featured" CTA prefers the data.js `featured: true` game so
  // a new ship can take centre stage without rewriting EDITORS_PICKS.
  // Falls back to the first hero, then the first playable, so the CTA is
  // never dead.
  const featuredGame = useMemo(
    () => playable.find((g) => g.featured) || editorsGames[0] || playable[0],
    [playable, editorsGames],
  );

  const favCount = Object.values(favs).filter(Boolean).length;

  const onPlayFeatured = () => {
    if (featuredGame) onOpen(featuredGame);
  };

  // "Surprise me" — picks a random playable game that isn't the one
  // currently featured. With 21 games this is a real second-CTA option
  // for anyone who can't decide.
  const onRandom = () => {
    const pool = playable.filter((g) => g.id !== featuredGame?.id);
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    onOpen(pick);
  };

  // Bento slot id for each hero (CSS grid-area). Order matches HERO_IDS.
  const HERO_SLOT_BY_INDEX = ['hero-1', 'hero-2', 'hero-3', 'hero-4'];

  return (
    <div className="app-layout">
      {sideOpen && <div className="side-backdrop" onClick={() => setSideOpen(false)} aria-hidden="true"/>}
      <div className={'sidebar-wrap' + (sideOpen ? ' is-open' : '')}>
        <motion.div
          className="sidebar-shell"
          // Desktop: this just renders. Mobile drawer: when sideOpen flips
          // true, key changes and the slide-in (x: -20 -> 0, opacity 0.6 -> 1)
          // plays. 240ms with the in-house ease curve.
          key={sideOpen ? 'open' : 'closed'}
          initial={reduced || !sideOpen ? false : { x: -20, opacity: 0.6 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <Sidebar
            games={playable}
            activeFilter="all"
            onFilter={() => {}}
            favCount={favCount}
            onOpenFavorites={() => {}}
            favoritesOnly={false}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenAuth={() => setAuthOpen(true)}
            onSignOut={signOut}
            user={user}
            onClose={() => setSideOpen(false)}
            activeCollection={null}
            onOpenCollection={() => {}}
            collectionCounts={{ originals: heroes.length }}
          />
        </motion.div>
      </div>

      <main id="main" className="app-main">
        <div className="main-topbar">
          <button
            className="icon-btn main-menu"
            onClick={() => setSideOpen(true)}
            aria-label="Open navigation">
            {Icon.menu}
          </button>
          <button
            type="button"
            className="search search-cmdk search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search palette"
            aria-haspopup="dialog">
            <span className="search-icon">{Icon.search}</span>
            <span className="search-trigger-text">Search games, genres…</span>
            <kbd className="search-kbd" aria-hidden="true">⌘K</kbd>
          </button>
          {user
            ? <button className="avatar" title={user.email} onClick={() => setProfileOpen(true)}>
                {(user.email || 'U').slice(0, 2).toUpperCase()}
              </button>
            : <button className="btn btn-ghost btn-sm" onClick={() => setAuthOpen(true)}>Sign in</button>}
        </div>

        <div className="main-inner">
          {can3D && (
            <Suspense fallback={null}>
              <HomeHero3D/>
            </Suspense>
          )}

          <motion.header
            className="home-hero"
            initial={reduced ? { opacity: 0 } : { y: 12, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="home-hero-eyebrow">
              <span className="home-hero-dot"/>
              <span>The PG.Play arcade</span>
            </div>
            <h1 className="home-hero-title">{HERO_HEADLINE}</h1>
            <p className="home-hero-sub">
              Originals, classics, and odd little experiments. Everything plays
              in your browser. No accounts, no downloads, just a click.
            </p>
            <div className="home-hero-actions">
              <button className="btn btn-lg btn-primary" onClick={onPlayFeatured}>
                {Icon.play}
                <span>Play {featuredGame?.name || 'featured'}</span>
              </button>
              <button
                type="button"
                className="btn btn-lg btn-ghost"
                onClick={() => setSearchOpen(true)}>
                {Icon.search}
                <span>Browse all</span>
                <kbd className="search-kbd" aria-hidden="true">⌘K</kbd>
              </button>
              <button
                type="button"
                className="btn btn-lg btn-subtle"
                onClick={onRandom}
                title="Pick a random game">
                {Icon.sparkle}
                <span>Surprise me</span>
              </button>
              <span className="home-hero-count">
                <span className="numeric">{playable.length}</span> playable today
              </span>
            </div>
          </motion.header>

          <section className="bento" aria-label="Headline games">
            {heroes.map((g, i) => (
              <div
                key={g.id}
                className={`bento-slot bento-slot-${HERO_SLOT_BY_INDEX[i]}`}
                style={{ gridArea: HERO_SLOT_BY_INDEX[i] }}
              >
                <Card
                  game={g}
                  index={i}
                  variant="hero"
                  fav={!!favs[g.id]}
                  onFav={toggleFav}
                  onOpen={() => onOpen(g)}/>
              </div>
            ))}
            {classics.map((g, i) => (
              <div
                key={g.id}
                className={`bento-slot bento-slot-classic-${i + 1}`}
                style={{ gridArea: `classic-${i + 1}` }}
              >
                <Card
                  game={g}
                  index={heroes.length + i}
                  variant="standard"
                  fav={!!favs[g.id]}
                  onFav={toggleFav}
                  onOpen={() => onOpen(g)}/>
              </div>
            ))}
          </section>

          {recentGames.length >= 2 && (
            <section className="section section-collection" aria-labelledby="continue-title">
              <div className="section-head">
                <div>
                  <h2 id="continue-title" className="section-title">Continue playing</h2>
                  <p className="section-blurb">Where you left off.</p>
                </div>
                <span className="section-count numeric">{recentGames.length}</span>
              </div>
              <div className="rail">
                {recentGames.map((g, i) => (
                  <Card
                    key={g.id}
                    game={g}
                    index={i}
                    variant="standard"
                    fav={!!favs[g.id]}
                    onFav={toggleFav}
                    onOpen={() => onOpen(g)}/>
                ))}
              </div>
            </section>
          )}

          {railCollections.map((c) => (
            <section key={c.id} className="section section-collection" aria-labelledby={`coll-${c.id}`}>
              <div className="section-head">
                <div>
                  <h2 id={`coll-${c.id}`} className="section-title">{c.title}</h2>
                  <p className="section-blurb">{c.blurb}</p>
                </div>
                <span className="section-count numeric">{c.items.length}</span>
              </div>
              <div className="rail">
                {c.items.map((g, i) => (
                  <Card
                    key={g.id}
                    game={g}
                    index={i}
                    variant="standard"
                    fav={!!favs[g.id]}
                    onFav={toggleFav}
                    onOpen={() => onOpen(g)}/>
                ))}
              </div>
            </section>
          ))}

          {more.length > 0 && (
            <section className="section section-more" aria-labelledby="more-title">
              <div className="section-head">
                <div>
                  <h2 id="more-title" className="section-title">More games</h2>
                  <p className="section-blurb">
                    The rest of the catalog. <span className="numeric">{more.length}</span> titles.
                  </p>
                </div>
                <div className="filter-chips" role="tablist" aria-label="Filter games">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={activeFilter === f.id}
                      className={'chip-tab' + (activeFilter === f.id ? ' is-active' : '')}
                      onClick={() => setActiveFilter(f.id)}>
                      {f.label}
                      <span className="chip-tab-count numeric">
                        {more.filter(f.match).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {visibleMore.length === 0 ? (
                <div className="empty">
                  Nothing matches this filter. Try <strong>All</strong> or hit the search.
                </div>
              ) : (
                <div className="more-grid">
                  {visibleMore.map((g, i) => (
                    <Card
                      key={g.id}
                      game={g}
                      index={i}
                      variant="standard"
                      fav={!!favs[g.id]}
                      onFav={toggleFav}
                      onOpen={() => onOpen(g)}/>
                  ))}
                </div>
              )}
            </section>
          )}

          <HomeLeaderboard/>

          <Footer
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
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
          favCount={favCount}
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
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)}/>
      <Onboarding featuredName={featuredGame?.name}/>
    </div>
  );
}
