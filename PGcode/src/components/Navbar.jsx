import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import LoginModal from './LoginModal';
import AccountModal from './AccountModal';
import './Navbar.css';

export default function Navbar({ session, theme, toggleTheme, roadmapMode, setRoadmapMode }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  // Fetch overall progress
  useEffect(() => {
    async function fetchProgress() {
      try {
        // Get total problems for current mode
        const { data: problems } = await supabase
          .from('PGcode_problems')
          .select('id, roadmap_set');

        const filtered = (problems || []).filter(p => {
          if (roadmapMode === '200') return p.roadmap_set === '200' || p.roadmap_set === 'both' || !p.roadmap_set;
          return true;
        });

        let completed = 0;
        if (session?.user) {
          const { data: userProgress } = await supabase
            .from('PGcode_user_progress')
            .select('problem_id')
            .eq('user_id', session.user.id)
            .eq('is_completed', true);

          if (userProgress) {
            const completedIds = new Set(userProgress.map(p => p.problem_id));
            completed = filtered.filter(p => completedIds.has(p.id)).length;
          }
        }

        setProgress({ completed, total: filtered.length });
      } catch (err) {
        // Silently fail — progress is non-critical
      }
    }
    fetchProgress();
  }, [roadmapMode, session]);

  const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <header className="pg-header">
      <div className="pg-wrap">
        <div className="nav-group">
          <div className="nav-left">
            <a href="../PG/main.html" className="brand-link">
              Pushkal Gupta <span className="brand-suffix">Code</span>
            </a>
          </div>

          <div className="header-right">
            <div className="toggle-wrap" onClick={toggleTheme}>
              <span className="toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              <div className="switch-base"></div>
            </div>

            <div className="roadmap-tabs">
              <button
                className={`tab-btn ${roadmapMode === '200' ? 'active' : ''}`}
                onClick={() => setRoadmapMode('200')}
              >
                200
              </button>
              <button
                className={`tab-btn ${roadmapMode === '300' ? 'active' : ''}`}
                onClick={() => setRoadmapMode('300')}
              >
                300
              </button>
            </div>

            <div className="nav-progress">
              <div className="nav-progress-bar">
                <div className="nav-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="nav-progress-text">{progress.completed}/{progress.total}</span>
            </div>

            {session ? (
              <button className="auth-btn" onClick={() => setShowAccount(true)}>
                ACCOUNT
              </button>
            ) : (
              <button className="auth-btn" onClick={() => setShowLogin(true)}>
                LOGIN
              </button>
            )}
          </div>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showAccount && <AccountModal session={session} onClose={() => setShowAccount(false)} />}
    </header>
  );
}
