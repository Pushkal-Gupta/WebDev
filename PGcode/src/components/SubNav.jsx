import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Map, BookOpen, List, RotateCcw, Terminal, TrendingUp, Building2, Trophy,
  History, ListPlus, ClipboardList, Play, GraduationCap, Award,
  Notebook as NotebookIcon,
} from 'lucide-react';
import { usePrefetch } from '../lib/queries';
import './SubNav.css';

const TABS = [
  { to: '/',             end: true, icon: Map,           label: 'Roadmap' },
  { to: '/tutorial',                icon: BookOpen,      label: 'Tutorial' },
  { to: '/learn',                   icon: BookOpen,      label: 'Concepts' },
  { to: '/courses',                 icon: GraduationCap, label: 'Courses' },
  { to: '/visualize',               icon: Play,          label: 'Visualize' },
  { to: '/practice',                icon: List,          label: 'Practice', prefetch: true },
  { to: '/review',                  icon: RotateCcw,     label: 'Review', badge: true },
  { to: '/playground',              icon: Terminal,      label: 'Playground' },
  { to: '/company',                 icon: Building2,     label: 'Companies' },
  { to: '/contests',                icon: Trophy,        label: 'Contests' },
  { to: '/assessments',             icon: ClipboardList, label: 'Assess' },
  { to: '/lists',                   icon: ListPlus,      label: 'Lists' },
  { to: '/history',                 icon: History,       label: 'History' },
  { to: '/notebook',                icon: NotebookIcon,  label: 'Notes' },
  { to: '/progress',                icon: TrendingUp,    label: 'Progress' },
  { to: '/achievements',            icon: Award,         label: 'Awards' },
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
