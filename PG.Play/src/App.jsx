// App — Router shell.
//
// Why HashRouter: PG.Play deploys as static files on GitHub Pages
// (pushkalgupta.com/PG.Play/dist/). HashRouter survives any reload on a
// static host without a 404 fallback or basename trickery. URLs become:
//
//   #/             → home (lobby)
//   #/game/<id>    → individual game (full SPA route, reload-safe)
//
// One-off effects that should outlive route changes (theme, score bus,
// achievement toast, auth session) live here so they don't unmount when
// navigating between Home and GamePage.

import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import GamePage from './pages/GamePage.jsx';
import AchievementToast from './components/AchievementToast.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import LoadingBar from './components/states/LoadingBar.jsx';
import { GAMES } from './data.js';
import { useSession } from './hooks/useSession.js';
import { useFavorites } from './hooks/useFavorites.js';
import { useBests } from './hooks/useBests.js';
import { useAchievements } from './hooks/useAchievements.js';
import { useTheme } from './hooks/useTheme.js';
import { sfx } from './sound.js';

// RouteProgress — paints the top LoadingBar for a short window whenever the
// route changes. HashRouter doesn't expose `useNavigation` (that's a data-
// router feature), so we approximate with a useLocation listener that
// toggles `active` on for ~200ms after each pathname change. Cheap, honest,
// and good enough for static-host SPA navigation where transitions are
// effectively instant.
function RouteProgress() {
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const t = setTimeout(() => setActive(false), 220);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return <LoadingBar active={active} />;
}

export default function App() {
  // Theme is global — both Home and GamePage style off [data-theme].
  // useTheme() is the single source of truth (localStorage + DOM mirror +
  // cross-tab sync). Home/Settings call the same hook.
  const [, setTheme] = useTheme();

  // Optional dev hook: console.setTheme('light' | 'dark') — handy when QA-ing.
  useEffect(() => {
    if (typeof window !== 'undefined') window.__pgplay_setTheme = setTheme;
  }, []);

  // Honest tab title: show the count of actually-playable titles, not a
  // marketing claim that might go stale as the roster moves.
  useEffect(() => {
    const playable = GAMES.filter((g) => g.playable).length;
    document.title = `PG.Play — ${playable} playable titles`;
  }, []);

  // Score bus + achievements should run regardless of route so a game can
  // submit at any time and the toast shows on the next page transition.
  const { user } = useSession();
  useFavorites(user);
  const { bests, submit: submitBest } = useBests(user);
  const { toast } = useAchievements(user, bests);

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

  return (
    <HashRouter>
      {/* First Tab stop on every route — keyboard users can skip past the
          sidebar/topbar and land directly inside the page's main region. */}
      <a className="skip-link" href="#main">Skip to main content</a>
      <RouteProgress/>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/game/:id" element={<GamePage/>}/>
          <Route path="*" element={<Home/>}/>
        </Routes>
      </ErrorBoundary>
      <AchievementToast toast={toast}/>
    </HashRouter>
  );
}
