import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import RoadmapView from './components/RoadmapView';
import Workspace from './components/Workspace';
import './styles/theme.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('pg-theme') || 'dark'
  );
  const [roadmapMode, setRoadmapMode] = useState('200');

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

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('pg-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <HashRouter>
      <Navbar
        session={session}
        theme={theme}
        toggleTheme={toggleTheme}
        roadmapMode={roadmapMode}
        setRoadmapMode={setRoadmapMode}
      />
      <Routes>
        <Route path="/" element={<RoadmapView roadmapMode={roadmapMode} session={session} />} />
        <Route path="/category/:categoryId" element={<Workspace session={session} theme={theme} roadmapMode={roadmapMode} />} />
        <Route path="/category/:categoryId/:problemId" element={<Workspace session={session} theme={theme} roadmapMode={roadmapMode} />} />
      </Routes>
    </HashRouter>
  );
}
