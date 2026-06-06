import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Map, BookOpen, List, RotateCcw, Terminal, TrendingUp, Building2, Trophy,
  ListPlus, Play, GraduationCap, Brain,
  Notebook as NotebookIcon,
} from 'lucide-react';
import { usePrefetch } from '../lib/queries';
import './SubNav.css';

// /assessments, /history, /achievements are intentionally absent — they were
// folded into /practice (Generate practice set) and /progress (tabbed view).
// The routes remain registered in App.jsx so existing bookmarks still resolve.
// Learning groups Tutorial + Concepts + Courses under a single hub (/learning)
// to free up two top-level slots. ML is the new top-level area for the planned
// expansion (linear algebra, optimization, attention, RL, numerical methods).
const TABS = [
  { to: '/',             end: true, icon: Map,           label: 'Roadmap' },
  { to: '/practice',                icon: List,          label: 'Practice', prefetch: true },
  { to: '/playground',              icon: Terminal,      label: 'Playground' },
  { to: '/learning',                icon: GraduationCap, label: 'Learning',
    // Learning hub groups Tutorial + Concepts + Courses, so light up the tab
    // anywhere under those routes too.
    matches: ['/learning', '/tutorial', '/learn', '/courses'] },
  { to: '/ml',                      icon: Brain,         label: 'ML-DL-AI' },
  { to: '/visualize',               icon: Play,          label: 'Visualize' },
  { to: '/review',                  icon: RotateCcw,     label: 'Review', badge: true },
  { to: '/company',                 icon: Building2,     label: 'Companies' },
  { to: '/contests',                icon: Trophy,        label: 'Contests' },
  { to: '/lists',                   icon: ListPlus,      label: 'Lists' },
  { to: '/notebook',                icon: NotebookIcon,  label: 'Notes' },
  { to: '/progress',                icon: TrendingUp,    label: 'Progress' },
];

export default function SubNav({ reviewCount }) {
  const { prefetchProblems } = usePrefetch();
  const location = useLocation();

  const pathMatches = (item) => {
    if (!item.matches) return false;
    return item.matches.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  };

  return (
    <nav className="sub-nav">
      <div className="sub-nav-inner">
        {TABS.map(item => {
          const Icon = item.icon;
          const matched = pathMatches(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sub-nav-link ${isActive || matched ? 'active' : ''}`}
              onMouseEnter={item.prefetch ? prefetchProblems : undefined}
            >
              <Icon size={14} />
              <span>{item.label}</span>
              {item.badge && reviewCount > 0 && <span className="sub-nav-badge">{reviewCount}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
