import { useEffect, useMemo, useState } from 'react';
import { GAMES, STORY_GAMES, VS_GAMES, PALETTES, hexToRgbStr } from './data.js';
import { Icon } from './icons.jsx';
import Card from './components/Card.jsx';
import HeroMosaic from './components/HeroMosaic.jsx';
import MatchLog from './components/MatchLog.jsx';
import GameIntro from './components/GameIntro.jsx';
import TweaksPanel from './components/TweaksPanel.jsx';

const readJSON = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
};

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('pd-theme') || 'dark');
  const [tweaks, setTweaks] = useState(() => readJSON('pd-tweaks', { palette:'Cyan', shape:'default', crt:'on' }));
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(null);
  const [favs, setFavs] = useState(() => readJSON('pd-favs', {}));
  const [recent, setRecent] = useState(() => readJSON('pd-recent', []));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-shape', tweaks.shape);
    document.documentElement.setAttribute('data-crt', tweaks.crt);
    const p = PALETTES.find(x => x.name === tweaks.palette);
    if (p) {
      document.documentElement.style.setProperty('--accent', p.accent);
      document.documentElement.style.setProperty('--accent-2', p.a2);
      document.documentElement.style.setProperty('--accent-rgb', hexToRgbStr(p.accent));
    }
    localStorage.setItem('pd-theme', theme);
    localStorage.setItem('pd-tweaks', JSON.stringify(tweaks));
    localStorage.setItem('pd-favs', JSON.stringify(favs));
    localStorage.setItem('pd-recent', JSON.stringify(recent));
  }, [theme, tweaks, favs, recent]);

  const onOpen = (g) => {
    setActive(g);
    setRecent(r => [g.id, ...r.filter(x => x !== g.id)].slice(0, 8));
  };
  const onFav = (id) => setFavs(f => ({...f, [id]: !f[id]}));

  const filterBy = (list) => {
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter(g =>
      g.name.toLowerCase().includes(needle) ||
      g.cat.toLowerCase().includes(needle) ||
      (g.tagline || '').toLowerCase().includes(needle)
    );
  };
  const storyFiltered = useMemo(() => filterBy(STORY_GAMES), [q]);
  const vsFiltered    = useMemo(() => filterBy(VS_GAMES), [q]);
  const recentGames   = recent.map(id => GAMES.find(g => g.id === id)).filter(Boolean);

  return (
    <div className="pd-shell">
      <div className="scene-bloom"/>

      <header className="pd-header">
        <div className="pd-header-inner">
          <a className="pd-brand" href="#">
            PG<span className="pd-brand-suffix">.Play</span>
          </a>
          <div className="pd-search">
            <span>{Icon.search}</span>
            <input
              type="text"
              placeholder="Search Connect 4, Fireboy, 2048…"
              value={q}
              onChange={e => setQ(e.target.value)}/>
            <span className="pd-search-kbd">⌘K</span>
          </div>
          <div className="pd-head-right">
            <button className="pd-icon-btn" onClick={() => setTheme(theme==='dark'?'light':'dark')} aria-label="Theme">
              {theme === 'dark' ? Icon.sun : Icon.moon}
            </button>
            <button className="pd-icon-btn" onClick={() => setTweaksOpen(v => !v)} aria-label="Tweaks">
              {Icon.sparkle}
            </button>
            <div className="pd-avatar">PG</div>
          </div>
        </div>
      </header>

      <section className="pd-hero">
        <HeroMosaic games={STORY_GAMES} onOpen={onOpen} favs={favs} onFav={onFav}/>
      </section>

      <MatchLog/>

      {recentGames.length > 0 && (
        <section className="pd-section">
          <div className="pd-section-head">
            <h2 className="pd-section-title">
              <span className="pd-section-num">01</span>
              Recently played
            </h2>
            <a className="pd-section-more" onClick={() => setRecent([])}>Clear →</a>
          </div>
          <div className="pd-rail">
            {recentGames.map(g => (
              <Card key={g.id} game={g} fav={favs[g.id]} onFav={onFav} onOpen={() => onOpen(g)}/>
            ))}
          </div>
        </section>
      )}

      <section className="pd-section">
        <div className="pd-section-head">
          <h2 className="pd-section-title">
            <span className="pd-section-num">{recentGames.length > 0 ? '02' : '01'}</span>
            Story & Co-op
            <span className="pd-section-count">{storyFiltered.length} titles</span>
          </h2>
          <span className="pd-section-more" style={{pointerEvents:'none'}}>1-player · same-team co-op</span>
        </div>
        {storyFiltered.length === 0 ? (
          <div className="pd-empty">No story games match "{q}"</div>
        ) : (
          <div className="pd-grid">
            {storyFiltered.map(g => (
              <Card key={g.id} game={g} fav={favs[g.id]} onFav={onFav} onOpen={() => onOpen(g)}/>
            ))}
          </div>
        )}
      </section>

      <section className="pd-section">
        <div className="pd-section-head">
          <h2 className="pd-section-title">
            <span className="pd-section-num">{recentGames.length > 0 ? '03' : '02'}</span>
            Head-to-head
            <span className="pd-section-count">{vsFiltered.length} titles</span>
          </h2>
          <span className="pd-section-more" style={{pointerEvents:'none'}}>vs Bot · 2-player local</span>
        </div>
        {vsFiltered.length === 0 ? (
          <div className="pd-empty">No head-to-head games match "{q}"</div>
        ) : (
          <div className="pd-grid">
            {vsFiltered.map(g => (
              <Card key={g.id} game={g} fav={favs[g.id]} onFav={onFav} onOpen={() => onOpen(g)}/>
            ))}
          </div>
        )}
      </section>

      <footer className="pd-footer">
        <div>{GAMES.length} games · {STORY_GAMES.length} story · {VS_GAMES.length} versus</div>
        <div className="pd-footer-links">
          <a>About</a><a>Submit a game</a>
        </div>
      </footer>

      {active && <GameIntro game={active} onClose={() => setActive(null)}/>}
      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)}/>}
    </div>
  );
}
