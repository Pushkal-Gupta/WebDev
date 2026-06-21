import React, { useState, useEffect, useLayoutEffect, Suspense, lazy, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { queryClient } from './lib/queryClient';
import { loadCustomColors, applyCustomColors } from './lib/customColors';
import { useProfile, qk } from './lib/queries';
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
            padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--text-dim)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
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
const CompanyGroup = lazy(() => import('./components/company/CompanyGroup'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const AdminCompleteness = lazy(() => import('./components/admin/AdminCompleteness'));
const ContestsIndex = lazy(() => import('./components/contests/ContestsIndex'));
const CompeteHub = lazy(() => import('./components/compete/CompeteHub'));
const ContestDetail = lazy(() => import('./components/contests/ContestDetail'));
const LcProblemsBrowser = lazy(() => import('./components/compete/LcProblemsBrowser'));
const LcProblemDetail = lazy(() => import('./components/compete/LcProblemDetail'));
const LcContestList = lazy(() => import('./components/compete/LcContestList'));
const LcHub = lazy(() => import('./components/compete/LcHub'));
const CompetitionsSection = lazy(() => import('./components/compete/CompetitionsSection'));
const HackathonsSection = lazy(() => import('./components/compete/HackathonsSection'));
const ConferencesSection = lazy(() => import('./components/compete/ConferencesSection'));
const GsocExplorer = lazy(() => import('./components/compete/gsoc/GsocExplorer'));
const KaggleCompetitions = lazy(() => import('./components/compete/kaggle/KaggleCompetitions'));
const LcLlmBenchmark = lazy(() => import('./components/compete/leetcode/LcLlmBenchmark'));
const CompeteResources = lazy(() => import('./components/compete/resources/CompeteResources'));
const PracticeHistory = lazy(() => import('./components/PracticeHistory'));
const MyLists = lazy(() => import('./components/MyLists'));
const PublicListView = lazy(() => import('./components/PublicListView'));
const Assessments = lazy(() => import('./components/Assessments'));
const DsaTutorial = lazy(() => import('./components/DsaTutorial'));
const DsaTutorialTopic = lazy(() => import('./components/DsaTutorialTopic'));
const ProblemList = lazy(() => import('./components/ProblemList'));
const ReviewQueue = lazy(() => import('./components/ReviewQueue'));
const Playground = lazy(() => import('./components/Playground'));
const Workspace = lazy(() => import('./components/Workspace'));
const SolutionPage = lazy(() => import('./components/SolutionPage'));
const LearnIndex = lazy(() => import('./components/learn/LearnIndex'));
const LearningHub = lazy(() => import('./components/learn/LearningHub'));
const MLHub = lazy(() => import('./components/ml/MLHub'));
const PGForgeHub = lazy(() => import('./components/ml/forge/PGForgeHub'));
const PGForgePapers = lazy(() => import('./components/ml/forge/PGForgePapers'));
const PGForgeProjects = lazy(() => import('./components/ml/forge/PGForgeProjects'));
const PGForgeProjectDetail = lazy(() => import('./components/ml/forge/PGForgeProjectDetail'));
const PGForgeRoadmaps = lazy(() => import('./components/ml/forge/PGForgeRoadmaps'));
const PGForgeProblems = lazy(() => import('./components/ml/forge/PGForgeProblems'));
const PGForgeProblemDetail = lazy(() => import('./components/ml/forge/PGForgeProblemDetail'));
const PGForgeMath = lazy(() => import('./components/ml/forge/PGForgeMath'));
const PGForgeStudyPlans = lazy(() => import('./components/ml/forge/PGForgeStudyPlans'));
const PGForgeStudyPlanDetail = lazy(() => import('./components/ml/forge/PGForgeStudyPlanDetail'));
const PGForgeArena = lazy(() => import('./components/ml/forge/PGForgeArena'));
const PGForgeCuda = lazy(() => import('./components/ml/forge/PGForgeCuda'));
const PGForgeCudaDetail = lazy(() => import('./components/ml/forge/PGForgeCudaDetail'));
const PGForgeProgress = lazy(() => import('./components/ml/forge/PGForgeProgress'));
const PGForgeSheets = lazy(() => import('./components/ml/forge/PGForgeSheets'));
const PGForgeSheetDetail = lazy(() => import('./components/ml/forge/PGForgeSheetDetail'));
const PGVaultHub = lazy(() => import('./components/vault/PGVaultHub'));
const MLGroup = lazy(() => import('./components/ml/MLGroup'));
const MLPillar = lazy(() => import('./components/ml/MLPillar'));
const MLLesson = lazy(() => import('./components/ml/MLLesson'));
const ConceptPage = lazy(() => import('./components/learn/ConceptPage'));
const VisualizeIndex = lazy(() => import('./components/learn/VisualizeIndex'));
const CoursesIndex = lazy(() => import('./components/courses/CoursesIndex'));
const CoursePage = lazy(() => import('./components/courses/CoursePage'));
const Achievements = lazy(() => import('./components/Achievements'));
const Notebook = lazy(() => import('./components/Notebook'));
const ProgressDashboard = lazy(() => import('./components/ProgressDashboard'));
const QuizIndex = lazy(() => import('./components/QuizIndex'));
const QuizRunner = lazy(() => import('./components/QuizRunner'));
const PublicProfile = lazy(() => import('./components/profile/PublicProfile'));
const ShareableCard = lazy(() => import('./components/ShareableCard'));

const VALID_THEMES = ['dark', 'light', 'midnight', 'midnight-light', 'solarized', 'solarized-dark', 'dracula', 'dracula-light'];
const normalizeTheme = (t) => (VALID_THEMES.includes(t) ? t : 'dark');

// Intercept Supabase OAuth callback errors (?error=…&error_description=…) and
// show a friendly explanation instead of leaving the user staring at a raw
// query string. Strips the noise from the URL so reload doesn't show it again.
function AuthErrorBanner() {
  const [errMsg, setErrMsg] = useState(() => {
    if (typeof window === 'undefined') return null;
    const sp = new URLSearchParams(window.location.search);
    const code = sp.get('error_code') || sp.get('error');
    const desc = sp.get('error_description');
    if (!code && !desc) return null;
    const decoded = desc ? decodeURIComponent(desc.replace(/\+/g, ' ')) : code;
    if (/multiple accounts.*same email/i.test(decoded)) {
      return 'That email is already linked to a different sign-in method on this site. Sign in with the original method, then attach this one from Settings → Profile → Link.';
    }
    return decoded;
  });

  useEffect(() => {
    if (!errMsg) return;
    const url = new URL(window.location.href);
    if (!url.search) return;
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  }, [errMsg]);

  if (!errMsg) return null;
  return (
    <div role="alert" style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: 'var(--hard)', color: '#fff',
      padding: '0.7rem 1rem', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', fontFamily: 'var(--sans, system-ui, sans-serif)', fontSize: '0.88rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
    }}>
      <span style={{ flex: 1 }}>{errMsg}</span>
      <button
        type="button"
        onClick={() => setErrMsg(null)}
        style={{
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6,
          padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
        }}
      >Dismiss</button>
    </div>
  );
}

function AppContent({ session, theme, setTheme, roadmapMode, setRoadmapMode }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const isWorkspace = location.pathname.startsWith('/category') || location.pathname.startsWith('/solution');
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
    document.documentElement.setAttribute('data-theme-mode', mode);
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
      <AuthErrorBanner />
      <Navbar
        session={session}
        theme={theme}
        toggleTheme={toggleTheme}
        applyTheme={applyTheme}
        setPreferredLang={setPreferredLang}
        preferredLang={profile?.preferred_lang || 'python'}
      />
      {!isWorkspace && <SubNav userId={session?.user?.id} />}
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
          <Route path="/learning" element={<LearningHub />} />
          <Route path="/ml" element={<PGForgeHub />} />
          <Route path="/ml/learn" element={<MLHub />} />
          <Route path="/ml/papers" element={<PGForgePapers />} />
          <Route path="/ml/projects" element={<PGForgeProjects />} />
          <Route path="/ml/projects/:slug" element={<PGForgeProjectDetail />} />
          <Route path="/ml/roadmaps" element={<PGForgeRoadmaps />} />
          <Route path="/ml/problems" element={<PGForgeProblems />} />
          <Route path="/ml/problems/:slug" element={<PGForgeProblemDetail />} />
          <Route path="/ml/math" element={<PGForgeMath />} />
          <Route path="/ml/study-plans" element={<PGForgeStudyPlans />} />
          <Route path="/ml/study-plans/:slug" element={<PGForgeStudyPlanDetail />} />
          <Route path="/ml/arena" element={<PGForgeArena />} />
          <Route path="/ml/cuda" element={<PGForgeCuda />} />
          <Route path="/ml/cuda/:slug" element={<PGForgeCudaDetail />} />
          <Route path="/ml/progress" element={<PGForgeProgress session={session} />} />
          <Route path="/ml/sheets" element={<PGForgeSheets />} />
          <Route path="/ml/sheets/:slug" element={<PGForgeSheetDetail />} />
          <Route path="/ml/g/:groupSlug" element={<MLGroup />} />
          <Route path="/ml/:pillarSlug" element={<MLPillar />} />
          <Route path="/ml/:pillarSlug/:lessonSlug" element={<MLLesson />} />
          <Route path="/vault" element={<PGVaultHub session={session} />} />
          <Route path="/learn" element={<LearnIndex session={session} />} />
          <Route path="/learn/:moduleSlug" element={<LearnIndex session={session} />} />
          <Route path="/learn/:moduleSlug/:conceptSlug" element={<ConceptPage session={session} />} />
          <Route path="/visualize" element={<VisualizeIndex />} />
          <Route path="/visualize/c/:category" element={<VisualizeIndex />} />
          <Route path="/visualize/:slug" element={<VisualizeIndex />} />
          <Route path="/courses" element={<CoursesIndex />} />
          <Route path="/courses/:slug" element={<CoursePage />} />
          <Route path="/courses/:slug/:lessonId" element={<CoursePage />} />
          <Route path="/achievements" element={<Achievements session={session} />} />
          <Route path="/notebook" element={<Notebook session={session} />} />
          <Route path="/review" element={<ReviewQueue session={session} />} />
          <Route path="/progress" element={<ProgressDashboard session={session} roadmapMode={roadmapMode} />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/u/:username/card" element={<ShareableCard />} />
          <Route path="/playground" element={<Playground theme={theme} preferredLang={profile?.preferred_lang} session={session} />} />
          <Route path="/playground/share/:slug" element={<Playground theme={theme} preferredLang={profile?.preferred_lang} session={session} />} />
          <Route path="/playground/web" element={<WebSandbox theme={theme} />} />
          <Route path="/playground/sql" element={<SqlPlayground theme={theme} />} />
          <Route path="/playground/sql/:courseSlug" element={<SqlPlayground theme={theme} />} />
          <Route path="/company" element={<CompaniesIndex />} />
          {/* Plural alias — both /company and /companies land on the index */}
          <Route path="/companies" element={<Navigate to="/company" replace />} />
          <Route path="/company/g/:groupSlug" element={<CompanyGroup />} />
          <Route path="/company/:slug" element={<CompanyDetail session={session} />} />
          <Route path="/contests" element={<ContestsIndex />} />
          <Route path="/compete" element={<CompeteHub />} />
          <Route path="/compete/leetcode" element={<LcHub />} />
          <Route path="/compete/leetcode/problems" element={<LcProblemsBrowser />} />
          <Route path="/compete/leetcode/problems/:slug" element={<LcProblemDetail />} />
          <Route path="/compete/leetcode/contests" element={<LcContestList />} />
          <Route path="/compete/leetcode/llms" element={<LcLlmBenchmark />} />
          <Route path="/compete/gsoc" element={<GsocExplorer />} />
          <Route path="/compete/kaggle" element={<KaggleCompetitions />} />
          <Route path="/compete/resources" element={<CompeteResources />} />
          <Route path="/compete/competitions" element={<CompetitionsSection />} />
          <Route path="/compete/hackathons" element={<HackathonsSection />} />
          <Route path="/compete/conferences" element={<ConferencesSection />} />
          <Route path="/contests/:slug" element={<ContestDetail session={session} />} />
          <Route path="/history" element={<PracticeHistory session={session} roadmapMode={roadmapMode} />} />
          <Route path="/lists" element={<MyLists session={session} />} />
          <Route path="/lists/share/:slug" element={<PublicListView session={session} />} />
          <Route path="/assessments" element={<Assessments session={session} roadmapMode={roadmapMode} />} />
          <Route path="/quiz" element={<QuizIndex />} />
          <Route path="/quiz/:id" element={<QuizRunner />} />
          <Route path="/tutorial" element={<DsaTutorial session={session} />} />
          <Route path="/tutorial/:topicSlug" element={<DsaTutorialTopic session={session} />} />
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
          {/* Catch-all: any unknown hash route redirects to the roadmap instead
              of rendering a blank void under the nav. */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
    // OAuth providers redirect back with `?error=...&error_description=...` (or in
    // the hash) when the round-trip fails. detectSessionInUrl swallows these, so
    // capture them here for the LoginModal to display, then strip from the URL.
    try {
      const search = new URLSearchParams(window.location.search);
      const hashStr = window.location.hash.includes('=') ? window.location.hash.replace(/^#\/?/, '') : '';
      const hash = new URLSearchParams(hashStr);
      const errCode = search.get('error') || search.get('error_code') || hash.get('error') || hash.get('error_code');
      const errDesc = search.get('error_description') || hash.get('error_description');
      if (errCode || errDesc) {
        const msg = (errDesc || errCode || 'OAuth sign-in failed').replace(/\+/g, ' ');
        sessionStorage.setItem('pgcode-oauth-error', msg);
        console.error('[auth] OAuth redirect returned an error:', errCode, errDesc);
        const url = window.location.pathname + (window.location.hash.startsWith('#/') ? window.location.hash : '');
        window.history.replaceState({}, '', url);
      }
    } catch { /* non-fatal: error surfacing is best-effort */ }

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
