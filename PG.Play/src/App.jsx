import { useEffect, useMemo, useState } from 'react';
import { GAMES, FILTERS } from './data.js';
import { Icon } from './icons.jsx';
import Card from './components/Card.jsx';
import FeaturedHero from './components/FeaturedHero.jsx';
import FilterTabs from './components/FilterTabs.jsx';
import GameIntro from './components/GameIntro.jsx';
import SettingsDrawer from './components/SettingsDrawer.jsx';

const readJSON = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
};

const FEATURED = GAMES.find((g) => g.featured) || GAMES[0];

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('pd-theme') || 'dark');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [active, setActive] = useState(null);
  const [favs, setFavs] = useState(() => readJSON('pd-favs', {}));
  const [recent, setRecent] = useState(() => readJSON('pd-recent', []));
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pd-theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('pd-favs', JSON.stringify(favs)); }, [favs]);
  useEffect(() => { localStorage.setItem('pd-recent', JSON.stringify(recent)); }, [recent]);

  const onOpen = (g) => {
    setActive(g);
    setRecent((r) => [g.id, ...r.filter((x) => x !== g.id)].slice(0, 8));
  };
  const onFav = (id) => setFavs((f) => ({ ...f, [id]: !f[id] }));

  const filterFn = FILTERS.find((f) => f.id === activeFilter)?.match ?? (() => true);

  const visibleGames = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GAMES.filter(filterFn).filter((g) => {
      if (!needle) return true;
      return (
        g.name.toLowerCase().includes(needle) ||
        g.cat.toLowerCase().includes(needle) ||
        (g.tagline || '').toLowerCase().includes(needle)
      );
    });
  }, [q, activeFilter]);

  const recentGames = useMemo(
    () => recent.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean),
    [recent]
  );

  const favCount = Object.values(favs).filter(Boolean).length;

  const activeFilterLabel = FILTERS.find((f) => f.id === activeFilter)?.label || 'All';
  const showRecent = recentGames.length > 0 && !q && activeFilter === 'all';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <a className="brand" href="#">
            <span className="brand-mark" aria-hidden="true"/>
            PG<span className="brand-suffix">.Play</span>
          </a>
          <div className="search">
            <span className="search-icon">{Icon.search}</span>
            <input
              type="search"
              placeholder="Search games"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search games"/>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings">
              {Icon.settings}
            </button>
            <div className="avatar" aria-hidden="true">PG</div>
          </div>
        </div>
      </header>

      <FeaturedHero
        game={FEATURED}
        fav={!!favs[FEATURED.id]}
        onFav={onFav}
        onOpen={() => onOpen(FEATURED)}/>

      <FilterTabs
        games={GAMES}
        active={activeFilter}
        onChange={setActiveFilter}/>

      {showRecent && (
        <section className="section" aria-labelledby="continue-title">
          <div className="section-head">
            <h2 id="continue-title" className="section-title">Continue playing</h2>
            <span className="section-count">{recentGames.length}</span>
          </div>
          <div className="rail">
            {recentGames.map((g) => (
              <Card key={g.id} game={g} fav={!!favs[g.id]} onFav={onFav} onOpen={() => onOpen(g)}/>
            ))}
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="grid-title">
        <div className="section-head">
          <h2 id="grid-title" className="section-title">
            {activeFilter === 'all' ? 'All games' : activeFilterLabel}
          </h2>
          <span className="section-count">
            {visibleGames.length} {visibleGames.length === 1 ? 'title' : 'titles'}
          </span>
        </div>
        {visibleGames.length === 0 ? (
          <div className="empty">
            No games match <strong>“{q || activeFilterLabel.toLowerCase()}”</strong>.
          </div>
        ) : (
          <div className="grid">
            {visibleGames.map((g) => (
              <Card key={g.id} game={g} fav={!!favs[g.id]} onFav={onFav} onOpen={() => onOpen(g)}/>
            ))}
          </div>
        )}
      </section>

      <footer className="app-footer">
        PG.Play · {GAMES.length} games · <a href="https://pushkalgupta.com">pushkalgupta.com</a>
      </footer>

      {active && <GameIntro game={active} onClose={() => setActive(null)}/>}
      {settingsOpen && (
        <SettingsDrawer
          theme={theme}
          setTheme={setTheme}
          onClearFavs={() => setFavs({})}
          onClearRecent={() => setRecent([])}
          favCount={favCount}
          recentCount={recent.length}
          onClose={() => setSettingsOpen(false)}/>
      )}
    </div>
  );
}
