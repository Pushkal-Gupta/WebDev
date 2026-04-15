import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, Settings, RotateCcw, HelpCircle, Flame, Trophy, Play } from 'lucide-react';
import './SidePanel.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['S','M','T','W','T','F','S'];

export default function SidePanel({ session, roadmapMode, setRoadmapMode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [progress, setProgress] = useState({ easy: 0, easyTotal: 0, med: 0, medTotal: 0, hard: 0, hardTotal: 0, completed: 0, total: 0 });
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [solveDates, setSolveDates] = useState(new Set());
  const [recentProblems, setRecentProblems] = useState([]);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  useEffect(() => {
    // Reset immediately so ring doesn't show stale counts
    setProgress({ easy: 0, easyTotal: 0, med: 0, medTotal: 0, hard: 0, hardTotal: 0, completed: 0, total: 0 });
    setStreak({ current: 0, best: 0 });
    fetchProgress();
  }, [roadmapMode, session]);

  async function fetchProgress() {
    try {
      const { data: problems } = await supabase
        .from('PGcode_problems')
        .select('id, topic_id, difficulty, roadmap_set');

      const filtered = (problems || []).filter(p => {
        if (roadmapMode === '100') return p.roadmap_set === '100';
        if (roadmapMode === '200') return p.roadmap_set === '100' || p.roadmap_set === '200' || p.roadmap_set === 'both' || !p.roadmap_set;
        if (roadmapMode === '300') return p.roadmap_set === '100' || p.roadmap_set === '200' || p.roadmap_set === '300' || p.roadmap_set === 'both' || !p.roadmap_set;
        return true; // PGcode 500 shows all
      });

      let easyTotal = 0, medTotal = 0, hardTotal = 0;
      filtered.forEach(p => {
        if (p.difficulty === 'Easy') easyTotal++;
        else if (p.difficulty === 'Medium') medTotal++;
        else if (p.difficulty === 'Hard') hardTotal++;
      });

      let easy = 0, med = 0, hard = 0, dates = new Set();
      if (session?.user) {
        const { data: userProg } = await supabase
          .from('PGcode_user_progress')
          .select('problem_id, is_completed, last_solved_at')
          .eq('user_id', session.user.id)
          .eq('is_completed', true);

        if (userProg) {
          const completedIds = new Set(userProg.map(p => p.problem_id));
          const diffMap = {};
          filtered.forEach(p => { diffMap[p.id] = p.difficulty; });

          completedIds.forEach(id => {
            if (diffMap[id] === 'Easy') easy++;
            else if (diffMap[id] === 'Medium') med++;
            else if (diffMap[id] === 'Hard') hard++;
          });

          userProg.forEach(p => {
            if (p.last_solved_at) {
              dates.add(new Date(p.last_solved_at).toDateString());
            }
          });
        }

        // Fetch streak
        const { data: profile } = await supabase
          .from('PGcode_profiles')
          .select('current_streak, longest_streak')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          setStreak({ current: profile.current_streak || 0, best: profile.longest_streak || 0 });
        }

        // Fetch recent problems for "Continue" section
        const { data: recentProg } = await supabase
          .from('PGcode_user_progress')
          .select('problem_id, updated_at')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
          .limit(3);

        if (recentProg && recentProg.length > 0) {
          const recentIds = recentProg.map(r => r.problem_id);
          const { data: recentData } = await supabase
            .from('PGcode_problems')
            .select('id, name, topic_id, difficulty')
            .in('id', recentIds);

          if (recentData) {
            // Preserve order from progress query
            const map = {};
            recentData.forEach(p => { map[p.id] = p; });
            setRecentProblems(recentIds.map(id => map[id]).filter(Boolean));
          }
        }
      }

      setSolveDates(dates);
      setProgress({
        easy, easyTotal, med, medTotal, hard, hardTotal,
        completed: easy + med + hard,
        total: easyTotal + medTotal + hardTotal,
      });
    } catch (err) {
      // non-critical
    }
  }

  // Calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);

  const today = now.getDate();
  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();

  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPercent / 100) * ringCircumference;

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
  };

  return (
    <div className="side-panel">
      {/* Progress Section */}
      <div className="sp-progress">
        <div className="sp-diff-breakdown">
          <div className="sp-diff-row"><span className="sp-diff-label sp-easy">Easy</span><span className="sp-diff-count">{progress.easy}/{progress.easyTotal}</span></div>
          <div className="sp-diff-row"><span className="sp-diff-label sp-med">Med</span><span className="sp-diff-count">{progress.med}/{progress.medTotal}</span></div>
          <div className="sp-diff-row"><span className="sp-diff-label sp-hard">Hard</span><span className="sp-diff-count">{progress.hard}/{progress.hardTotal}</span></div>
        </div>

        <div className="sp-ring-wrap">
          <svg className="sp-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="var(--accent)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset}
              transform="rotate(-90 60 60)" className="sp-ring-fill" />
          </svg>
          <div className="sp-ring-text">
            <span className="sp-ring-num">{progress.completed}</span>
            <span className="sp-ring-denom">/{progress.total}</span>
            <span className="sp-ring-label">Solved</span>
          </div>
        </div>
      </div>

      {/* Mode Dropdown */}
      <div className="sp-dropdown-wrap">
        <button className="sp-dropdown-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
          PGcode {roadmapMode}
          <ChevronDown size={14} className={`sp-chevron ${dropdownOpen ? 'open' : ''}`} />
        </button>
        {dropdownOpen && (
          <div className="sp-dropdown-menu">
            <button className={`sp-dropdown-item ${roadmapMode === '100' ? 'active' : ''}`}
              onClick={() => { setRoadmapMode('100'); setDropdownOpen(false); }}>
              PGcode 100
            </button>
            <button className={`sp-dropdown-item ${roadmapMode === '200' ? 'active' : ''}`}
              onClick={() => { setRoadmapMode('200'); setDropdownOpen(false); }}>
              PGcode 200
            </button>
            <button className={`sp-dropdown-item ${roadmapMode === '300' ? 'active' : ''}`}
              onClick={() => { setRoadmapMode('300'); setDropdownOpen(false); }}>
              PGcode 300
            </button>
            <button className={`sp-dropdown-item ${roadmapMode === '500' ? 'active' : ''}`}
              onClick={() => { setRoadmapMode('500'); setDropdownOpen(false); }}>
              PGcode 500
            </button>
          </div>
        )}
      </div>

      {/* Continue Where You Left Off */}
      {session?.user && recentProblems.length > 0 && (
        <div className="sp-continue">
          <div className="sp-continue-title">
            <Play size={12} /> Continue
          </div>
          {recentProblems.map(p => (
            <Link key={p.id} to={`/category/${p.topic_id}/${p.id}`} className="sp-continue-item">
              <span className="sp-continue-name">{p.name}</span>
              <span className={`sp-continue-diff sp-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div className="sp-calendar">
        <div className="sp-cal-header">
          <button className="sp-cal-nav" onClick={prevMonth}>&lsaquo;</button>
          <span className="sp-cal-title">{MONTHS[calMonth]} {calYear}</span>
          <button className="sp-cal-nav" onClick={nextMonth}>&rsaquo;</button>
        </div>

        <div className="sp-cal-days">
          {DAYS.map((d, i) => <span key={i} className="sp-cal-day-label">{d}</span>)}
        </div>

        <div className="sp-cal-grid">
          {calendarGrid.map((day, i) => {
            if (day === null) return <span key={i} className="sp-cal-empty" />;
            const dateStr = new Date(calYear, calMonth, day).toDateString();
            const isSolved = solveDates.has(dateStr);
            const isToday = isCurrentMonth && day === today;
            return (
              <span key={i} className={`sp-cal-cell ${isToday ? 'today' : ''} ${isSolved ? 'solved' : ''}`}>
                {day}
              </span>
            );
          })}
        </div>
      </div>

      {/* Streak */}
      <div className="sp-streak-row">
        <div className="sp-streak-card">
          <span className="sp-streak-label">Current Streak</span>
          <div className="sp-streak-val"><Flame size={14} className="sp-streak-icon" /> {streak.current} <span className="sp-streak-unit">days</span></div>
        </div>
        <div className="sp-streak-card">
          <span className="sp-streak-label">Best Streak</span>
          <div className="sp-streak-val"><Trophy size={14} className="sp-streak-icon sp-trophy" /> {streak.best} <span className="sp-streak-unit">days</span></div>
        </div>
      </div>

      <p className="sp-motivational">Solve one problem a day to keep your streak</p>
    </div>
  );
}
