import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProblemsCompact, useUserProgress, useProfile, useRecentProblems, filterByRoadmap } from '../lib/queries';
import { ChevronDown, Settings, RotateCcw, HelpCircle, Flame, Trophy, Play } from 'lucide-react';
import './SidePanel.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['S','M','T','W','T','F','S'];

export default function SidePanel({ session, roadmapMode, setRoadmapMode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userId = session?.user?.id;

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const { data: problemsData } = useProblemsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const { data: profile } = useProfile(userId);
  const { data: recentProblems = [] } = useRecentProblems(userId);

  const streak = useMemo(() => ({
    current: profile?.current_streak || 0,
    best: profile?.longest_streak || 0,
  }), [profile]);

  // Problem of the Day — deterministic by UTC date so the same problem
  // surfaces all day, then rotates at midnight UTC. Prefer the rich-content
  // flagships (presence of test_cases) when available.
  const potd = useMemo(() => {
    const pool = (problemsData || []).filter(p => Array.isArray(p.test_cases) && p.test_cases.length >= 5);
    const list = pool.length > 0 ? pool : (problemsData || []).slice(0, 100);
    if (list.length === 0) return null;
    // Days since unix epoch as the seed; deterministic per UTC day.
    const days = Math.floor(Date.now() / 86400000);
    const idx = days % list.length;
    return list[idx];
  }, [problemsData]);

  // Per-mode counts so the dropdown can show the real number of problems
  // each mode includes. Avoids the old confusion where "PGcode 100" did NOT
  // mean 100 problems.
  const modeCounts = useMemo(() => {
    const all = problemsData || [];
    return {
      '100': filterByRoadmap(all, '100').length,
      '200': filterByRoadmap(all, '200').length,
      '300': filterByRoadmap(all, '300').length,
      '400': filterByRoadmap(all, '400').length,
      '500': filterByRoadmap(all, '500').length,
      all:   all.length,
    };
  }, [problemsData]);

  const { progress, solveDates } = useMemo(() => {
    const filtered = filterByRoadmap(problemsData, roadmapMode);
    let easyTotal = 0, medTotal = 0, hardTotal = 0;
    const diffMap = {};
    filtered.forEach(p => {
      diffMap[p.id] = p.difficulty;
      if (p.difficulty === 'Easy') easyTotal++;
      else if (p.difficulty === 'Medium') medTotal++;
      else if (p.difficulty === 'Hard') hardTotal++;
    });

    let easy = 0, med = 0, hard = 0;
    const dates = new Set();
    (progressBundle?.rows || []).forEach(p => {
      if (!p.is_completed) return;
      if (diffMap[p.problem_id] === 'Easy') easy++;
      else if (diffMap[p.problem_id] === 'Medium') med++;
      else if (diffMap[p.problem_id] === 'Hard') hard++;
      if (p.last_solved_at) dates.add(new Date(p.last_solved_at).toDateString());
    });

    return {
      progress: {
        easy, easyTotal, med, medTotal, hard, hardTotal,
        completed: easy + med + hard,
        total: easyTotal + medTotal + hardTotal,
      },
      solveDates: dates,
    };
  }, [problemsData, progressBundle, roadmapMode]);

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

      {/* Mode Dropdown — label shows real per-mode counts so users aren't
          confused when "PGcode 200" used to actually return 263 problems. */}
      <div className="sp-dropdown-wrap">
        <button className="sp-dropdown-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
          {roadmapMode === 'all' ? 'PGcode All' : `PGcode ${roadmapMode}`}
          <span style={{ marginLeft: '0.4rem', opacity: 0.6, fontSize: '0.7em' }}>
            {modeCounts[roadmapMode] || 0}
          </span>
          <ChevronDown size={14} className={`sp-chevron ${dropdownOpen ? 'open' : ''}`} />
        </button>
        {dropdownOpen && (
          <div className="sp-dropdown-menu">
            {['100', '200', '300', '400', '500', 'all'].map(mode => (
              <button
                key={mode}
                className={`sp-dropdown-item ${roadmapMode === mode ? 'active' : ''}`}
                onClick={() => { setRoadmapMode(mode); setDropdownOpen(false); }}
              >
                {mode === 'all' ? 'PGcode All' : `PGcode ${mode}`}
                <span style={{ marginLeft: 'auto', opacity: 0.5, fontFamily: 'var(--mono)', fontSize: '0.72em' }}>
                  {modeCounts[mode] || 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Problem of the Day — deterministic by date so it changes daily but
          stays stable within the day. Picks from the rich-content flagships
          if available, otherwise the first 100 problems. */}
      {potd && (
        <Link
          to={`/category/${encodeURIComponent(potd.topic_id)}/${encodeURIComponent(potd.id)}`}
          className="sp-potd"
        >
          <span className="sp-potd-label">Problem of the Day</span>
          <span className="sp-potd-name">{potd.name}</span>
          <span className="sp-potd-foot">
            <span className={`sp-potd-diff sp-${potd.difficulty?.toLowerCase()}`}>{potd.difficulty}</span>
            <span className="sp-potd-cta">Solve →</span>
          </span>
        </Link>
      )}

      {/* Continue Where You Left Off */}
      {session?.user && recentProblems.length > 0 && (
        <div className="sp-continue">
          <div className="sp-continue-title">
            <Play size={12} /> Continue
          </div>
          {recentProblems.map(p => (
            <Link key={p.id} to={`/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`} className="sp-continue-item">
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
