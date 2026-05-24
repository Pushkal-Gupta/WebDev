import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Map, BookOpen, List, RotateCcw, Terminal, TrendingUp, Building2, Trophy,
  ListPlus, Play, GraduationCap,
  Notebook as NotebookIcon,
} from 'lucide-react';
import { usePrefetch } from '../lib/queries';
import './SubNav.css';

// /assessments, /history, /achievements are intentionally absent — they were
// folded into /practice (Generate practice set) and /progress (tabbed view).
// The routes remain registered in App.jsx so existing bookmarks still resolve.
const TABS = [
  { to: '/',             end: true, icon: Map,           label: 'Roadmap' },
  { to: '/practice',                icon: List,          label: 'Practice', prefetch: true },
  { to: '/playground',              icon: Terminal,      label: 'Playground' },
  { to: '/tutorial',                icon: BookOpen,      label: 'Tutorial' },
  { to: '/learn',                   icon: BookOpen,      label: 'Concepts' },
  { to: '/courses',                 icon: GraduationCap, label: 'Courses' },
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

  return (
    <nav className="sub-nav">
      <div className="sub-nav-inner">
        {TABS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sub-nav-link ${isActive ? 'active' : ''}`}
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
