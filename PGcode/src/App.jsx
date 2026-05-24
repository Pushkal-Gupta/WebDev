import React, { useState, useEffect, useLayoutEffect, Suspense, lazy, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { queryClient } from './lib/queryClient';
import { loadCustomColors, applyCustomColors } from './lib/customColors';
import { useReviewCount, useProfile, qk } from './lib/queries';
import Navbar from './components/Navbar';
import SubNav from './components/SubNav';
import MobileBottomNav from './components/MobileBottomNav';
import RouteFallback from './components/RouteFallback';
import CommandPalette from './components/CommandPalette';
import './styles/theme.css';

// ErrorBoundary so a render crash inside one route doesn't blank #root and
// strand the user with no nav. Reset on route change via key={pathname}.
class RouteErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('Route crashed:', err, info?.componentStack); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: '3rem 2rem', maxWidth: 720, margin: '0 auto', color: 'var(--text-main)' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '0.6rem' }}>
            Something broke on this page.
          </h1>
          <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
            We logged the error. The rest of the app is fine — head back and try a different route.
          </p>
          <pre style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.8rem 1rem', fontSize: '0.75rem', overflow: 'auto', color: 'var(--text-dim)',
          }}>{String(this.state.err?.message || this.state.err)}</pre>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <Link to="/" style={{ color: 'var(--accent)' }}>Back to roadmap</Link>
            <Link to="/practice" style={{ color: 'var(--accent)' }}>Browse problems</Link>
            <button
              type="button"
              onClick={() => this.setState({ err: null })}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.2rem 0.6rem', borderRadius: 4, cursor: 'pointer' }}
            >Retry</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Everything route-level is lazy. RoadmapView is the landing route so it preloads
// quickly via the prefetch links elsewhere.
const RoadmapView = lazy(() => import('./components/RoadmapView'));
const RoadmapsIndex = lazy(() => import('./components/roadmaps/RoadmapsIndex'));
const RoadmapTrack = lazy(() => import('./components/roadmaps/RoadmapTrack'));
const WebSandbox = lazy(() => import('./components/WebSandbox'));
const SqlPlayground = lazy(() => import('./components/SqlPlayground'));
const CompaniesIndex = lazy(() => import('./components/company/CompaniesIndex'));
const CompanyDetail = lazy(() => import('./components/company/CompanyDetail'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const AdminCompleteness = lazy(() => import('./components/admin/AdminCompleteness'));
const ContestsIndex = lazy(() => import('./components/contests/ContestsIndex'));
const ContestDetail = lazy(() => import('./components/contests/ContestDetail'));
const PracticeHistory = lazy(() => import('./components/PracticeHistory'));
const MyLists = lazy(() => import('./components/MyLists'));
const PublicListView = lazy(() => import('./components/PublicListView'));
const Assessments = lazy(() => import('./components/Assessments'));
const DsaTutorial = lazy(() => import('./components/DsaTutorial'));
const ProblemList = lazy(() => import('./components/ProblemList'));
const ReviewQueue = lazy(() => import('./components/ReviewQueue'));
const Playground = lazy(() => import('./components/Playground'));
const Workspace = lazy(() => import('./components/Workspace'));
const SolutionPage = lazy(() => import('./components/SolutionPage'));
const LearnIndex = lazy(() => import('./components/learn/LearnIndex'));
const ConceptPage = lazy(() => import('./components/learn/ConceptPage'));
const VisualizeIndex = lazy(() => import('./components/learn/VisualizeIndex'));
const CoursesIndex = lazy(() => import('./components/courses/CoursesIndex'));
const CoursePage = lazy(() => import('./components/courses/CoursePage'));
const Achievements = lazy(() => import('./components/Achievements'));
const Notebook = lazy(() => import('./components/Notebook'));
const ProgressDashboard = lazy(() => import('./components/ProgressDashboard'));

const VALID_THEMES = ['dark', 'light', 'midnight', 'midnight-light', 'solarized', 'solarized-dark', 'dracula', 'dracula-light'];
const normalizeTheme = (t) => (VALID_THEMES.includes(t) ? t : 'dark');

function AppContent({ session, theme, setTheme, roadmapMode, setRoadmapMode }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const isWorkspace = location.pathname.startsWith('/category') || location.pathname.startsWith('/solution');
  const { data: reviewCount = 0 } = useReviewCount(session?.user?.id);
  const { data: profile } = useProfile(session?.user?.id);

  useEffect(() => {
    if (profile?.theme_preset) {
      const fromProfile = normalizeTheme(profile.theme_preset);
      if (fromProfile !== theme) {
        setTheme(fromProfile);
        localStorage.setItem('pg-theme', fromProfile);
        document.documentElement.setAttribute('data-theme', fromProfile);
      }
    }
  }, [profile, theme, setTheme]);

  // Each preset has a mode (dark|light) and a pair pointing to its
  // opposite-mode sibling. Toggling flips to the pair so palette identity
  // is preserved (dracula → dracula-light, midnight → midnight-light, etc.).
  const THEME_META = {
    dark:            { mode: 'dark',  pair: 'light' },
    light:           { mode: 'light', pair: 'dark' },
    midnight:        { mode: 'dark',  pair: 'midnight-light' },
    'midnight-light':{ mode: 'light', pair: 'midnight' },
    solarized:       { mode: 'light', pair: 'solarized-dark' },
    'solarized-dark':{ mode: 'dark',  pair: 'solarized' },
    dracula:         { mode: 'dark',  pair: 'dracula-light' },
    'dracula-light': { mode: 'light', pair: 'dracula' },
  };

  const applyTheme = (newTheme) => {
    const normalized = normalizeTheme(newTheme);
    setTheme(normalized);
    localStorage.setItem('pg-theme', normalized);
    const mode = THEME_META[normalized]?.mode || 'dark';
    localStorage.setItem(`pg-theme-last-${mode}`, normalized);
    document.documentElement.setAttribute('data-theme', normalized);
    const uid = session?.user?.id;
    if (uid) {
      queryClient.setQueryData(qk.profile(uid), (prev) => ({ ...(prev || { user_id: uid }), theme_preset: normalized }));
      supabase.from('PGcode_profiles').upsert({ user_id: uid, theme_preset: normalized }).then(() => {
        queryClient.invalidateQueries({ queryKey: qk.profile(uid) });
      });
    }
  };

  const toggleTheme = () => {
    // Always flip to the paired sibling so palette identity is preserved
    // (midnight-light ↔ midnight, dracula-light ↔ dracula, etc.). The old
    // "last used in this mode" lookup overrode the pair and broke this.
    const meta = THEME_META[theme] || THEME_META.dark;
    const nextMode = meta.mode === 'dark' ? 'light' : 'dark';
    applyTheme(meta.pair || nextMode);
  };

  const setPreferredLang = (lang) => {
    const uid = session?.user?.id;
    if (!uid) return;
    queryClient.setQueryData(qk.profile(uid), (prev) => ({ ...(prev || { user_id: uid }), preferred_lang: lang }));
    supabase.from('PGcode_profiles').upsert({ user_id: uid, preferred_lang: lang }).then(() => {
      queryClient.invalidateQueries({ queryKey: qk.profile(uid) });
    });
  };

  return (
    <>
      <Navbar
        session={session}
        theme={theme}
        toggleTheme={toggleTheme}
        applyTheme={applyTheme}
        setPreferredLang={setPreferredLang}
        preferredLang={profile?.preferred_lang || 'python'}
      />
      {!isWorkspace && <SubNav reviewCount={reviewCount} />}
      {!isWorkspace && <MobileBottomNav />}
      <CommandPalette />
      <Suspense fallback={<RouteFallback />}>
        <RouteErrorBoundary key={location.pathname}>
        <Routes>
          <Route
            path="/"
            element={<RoadmapView roadmapMode={roadmapMode} setRoadmapMode={setRoadmapMode} session={session} />}
          />
          <Route path="/dashboard" element={<PracticeHistory session={session} roadmapMode={roadmapMode} />} />
          <Route path="/roadmaps" element={<RoadmapsIndex />} />
          <Route
            path="/roadmaps/dsa-fundamentals"
            element={<RoadmapView roadmapMode={roadmapMode} setRoadmapMode={setRoadmapMode} session={session} />}
          />
          <Route path="/roadmaps/:slug" element={<RoadmapTrack session={session} />} />
          {/* Legacy alias for the original single-roadmap experience */}
          <Route
            path="/roadmap"
            element={<RoadmapView roadmapMode={roadmapMode} setRoadmapMode={setRoadmapMode} session={session} />}
          />
          <Route path="/practice" element={<ProblemList session={session} roadmapMode={roadmapMode} />} />
          {/* Legacy alias */}
          <Route path="/problems" element={<ProblemList session={session} roadmapMode={roadmapMode} />} />
          <Route path="/learn" element={<LearnIndex session={session} />} />
          <Route path="/learn/:moduleSlug" element={<LearnIndex session={session} />} />
          <Route path="/learn/:moduleSlug/:conceptSlug" element={<ConceptPage session={session} />} />
          <Route path="/visualize" element={<VisualizeIndex />} />
          <Route path="/visualize/:slug" element={<VisualizeIndex />} />
          <Route path="/courses" element={<CoursesIndex />} />
          <Route path="/courses/:slug" element={<CoursePage />} />
          <Route path="/courses/:slug/:lessonId" element={<CoursePage />} />
          <Route path="/achievements" element={<Achievements session={session} />} />
          <Route path="/notebook" element={<Notebook session={session} />} />
          <Route path="/review" element={<ReviewQueue session={session} />} />
          <Route path="/progress" element={<ProgressDashboard session={session} roadmapMode={roadmapMode} />} />
          <Route path="/playground" element={<Playground theme={theme} preferredLang={profile?.preferred_lang} session={session} />} />
          <Route path="/playground/share/:slug" element={<Playground theme={theme} preferredLang={profile?.preferred_lang} session={session} />} />
          <Route path="/playground/web" element={<WebSandbox theme={theme} />} />
          <Route path="/playground/sql" element={<SqlPlayground theme={theme} />} />
          <Route path="/playground/sql/:courseSlug" element={<SqlPlayground theme={theme} />} />
          <Route path="/company" element={<CompaniesIndex />} />
          <Route path="/company/:slug" element={<CompanyDetail session={session} />} />
          <Route path="/contests" element={<ContestsIndex />} />
          <Route path="/contests/:slug" element={<ContestDetail session={session} />} />
          <Route path="/history" element={<PracticeHistory session={session} roadmapMode={roadmapMode} />} />
          <Route path="/lists" element={<MyLists session={session} />} />
          <Route path="/lists/share/:slug" element={<PublicListView session={session} />} />
          <Route path="/assessments" element={<Assessments session={session} roadmapMode={roadmapMode} />} />
          <Route path="/tutorial" element={<DsaTutorial session={session} />} />
          <Route path="/admin" element={<AdminPanel session={session} />} />
          <Route path="/admin/completeness" element={<AdminCompleteness session={session} />} />
          <Route
            path="/category/:categoryId"
            element={<Workspace session={session} theme={theme} roadmapMode={roadmapMode} preferredLang={profile?.preferred_lang} />}
          />
          <Route
            path="/category/:categoryId/:problemId"
            element={<Workspace session={session} theme={theme} roadmapMode={roadmapMode} preferredLang={profile?.preferred_lang} />}
          />
          <Route path="/solution/:problemId" element={<SolutionPage />} />
        </Routes>
        </RouteErrorBoundary>
      </Suspense>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(
    () => normalizeTheme(localStorage.getItem('pg-theme'))
  );
  // Default: show all 500+ problems. Users were confused why /practice was
  // showing 263 instead of the full 551 catalog — the toggle pre-filtered too
  // aggressively. They can still narrow via the roadmap-mode picker.
  const [roadmapMode, setRoadmapMode] = useState(
    () => localStorage.getItem('pg-roadmap-mode') || 'all'
  );
  // Persist user's choice so subsequent visits don't snap back to '500'.
  useEffect(() => { localStorage.setItem('pg-roadmap-mode', roadmapMode); }, [roadmapMode]);
  const prevUserIdRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Base palette wins via [data-theme] cascade; re-apply user overrides on
    // top so a Custom accent etc. survives palette flips.
    applyCustomColors(loadCustomColors());
  }, [theme]);

  // Apply once on mount before first paint — avoids a flash of the base theme.
  useLayoutEffect(() => {
    applyCustomColors(loadCustomColors());
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      prevUserIdRef.current = session?.user?.id || null;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id || null;
      // Privacy: if the auth user changed (including signed out), nuke per-user
      // caches and the persisted localStorage cache. Otherwise a second user on
      // the same browser would see the previous user's progress, profile, etc.
      if (prevUserIdRef.current !== nextId) {
        try {
          queryClient.clear();
          localStorage.removeItem('pgcode-query-cache');
        } catch { /* ignore */ }
      }
      prevUserIdRef.current = nextId;
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <HashRouter>
      <AppContent
        session={session}
        theme={theme}
        setTheme={setTheme}
        roadmapMode={roadmapMode}
        setRoadmapMode={setRoadmapMode}
      />
    </HashRouter>
  );
}
