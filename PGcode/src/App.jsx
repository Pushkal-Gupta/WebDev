import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import SubNav from './components/SubNav';
import RoadmapView from './components/RoadmapView';
import Workspace from './components/Workspace';
import SolutionPage from './components/SolutionPage';
import ProblemList from './components/ProblemList';
import ReviewQueue from './components/ReviewQueue';
import './styles/theme.css';

function AppContent({ session, theme, toggleTheme, roadmapMode, setRoadmapMode, reviewCount }) {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/category') || location.pathname.startsWith('/solution');

  return (
    <>
      <Navbar session={session} theme={theme} toggleTheme={toggleTheme} isWorkspace={isWorkspace} />
      {!isWorkspace && <SubNav reviewCount={reviewCount} />}
      <Routes>
        <Route path="/" element={
          <RoadmapView roadmapMode={roadmapMode} setRoadmapMode={setRoadmapMode} session={session} />
        } />
        <Route path="/problems" element={<ProblemList session={session} roadmapMode={roadmapMode} />} />
        <Route path="/review" element={<ReviewQueue session={session} />} />
        <Route path="/category/:categoryId" element={<Workspace session={session} theme={theme} roadmapMode={roadmapMode} />} />
        <Route path="/category/:categoryId/:problemId" element={<Workspace session={session} theme={theme} roadmapMode={roadmapMode} />} />
        <Route path="/solution/:problemId" element={<SolutionPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('pg-theme') || 'dark'
  );
  const [roadmapMode, setRoadmapMode] = useState('200');
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [theme]);

  // Fetch review count for badge
  useEffect(() => {
    if (!session?.user) { setReviewCount(0); return; }
    supabase
      .from('PGcode_user_progress')
      .select('problem_id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_completed', true)
      .not('next_review_at', 'is', null)
      .lte('next_review_at', new Date().toISOString())
      .then(({ count }) => setReviewCount(count || 0));
  }, [session]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('pg-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <HashRouter>
      <AppContent
        session={session}
        theme={theme}
        toggleTheme={toggleTheme}
        roadmapMode={roadmapMode}
        setRoadmapMode={setRoadmapMode}
        reviewCount={reviewCount}
      />
    </HashRouter>
  );
}
