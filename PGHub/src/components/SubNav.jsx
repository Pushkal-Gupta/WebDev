import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Map, List, Terminal, Building2, Trophy, Swords, Flag,
  GraduationCap, Brain, Vault,
} from 'lucide-react';
import { usePrefetch } from '../lib/queries';
import './SubNav.css';

// /assessments, /history, /achievements are intentionally absent — they were
// folded into /practice (Generate practice set) and /progress (tabbed view).
// The routes remain registered in App.jsx so existing bookmarks still resolve.
// Learning groups Tutorial + Concepts + Courses under a single hub (/learning)
// to free up two top-level slots. ML is the new top-level area for the planned
// expansion (linear algebra, optimization, attention, RL, numerical methods).
// Renamed tabs carry a two-part `brand: [prefix, suffix]` — the "PG" prefix
// renders small + dim, the suffix gets the emphasis. PGVault consolidates the
// old Review / Lists / Notes / Progress tabs into one hub (those routes stay
// registered; the tab lights up anywhere under them).
// Tab order locked by user (2026-07-17): Path · Code · Lab · Battle · Learn ·
// Forge · Compete · Career · Arena · Vault. Routes renamed to match the tab names
// (2026-07-18): Battle=/battle, Forge=/forge, Career=/career, Arena=/arena — old
// paths (/versus, /ml, /company, /contests) still redirect (App.jsx PrefixRedirect).
// PGBattle is the head-to-head race; PGCompete (/compete) is the contest/LC hub.
const TABS = [
  { to: '/',             end: true, icon: Map,           brand: ['PG', 'Path'] },
  { to: '/practice',                icon: List,          brand: ['PG', 'Code'], prefetch: true },
  { to: '/playground',              icon: Terminal,      brand: ['PG', 'Lab'] },
  { to: '/battle',                  icon: Swords,        brand: ['PG', 'Battle'], matches: ['/battle'] },
  { to: '/learning',                icon: GraduationCap, brand: ['PG', 'Learn'],
    // PGLearn groups Tutorial + Concepts + Courses + Visualize, so light up the
    // tab anywhere under those routes too.
    matches: ['/learning', '/tutorial', '/learn', '/courses', '/visualize'] },
  { to: '/forge',                      icon: Brain,         brand: ['PG', 'Forge'],
    matches: ['/forge'] },
  { to: '/compete',                 icon: Trophy,        brand: ['PG', 'Compete'],
    matches: ['/compete'] },
  { to: '/career',                 icon: Building2,     brand: ['PG', 'Career'] },
  { to: '/arena',                icon: Flag,          brand: ['PG', 'Arena'] },
  { to: '/vault',                   icon: Vault,         brand: ['PG', 'Vault'],
    matches: ['/vault', '/review', '/lists', '/notebook', '/progress'] },
];


export default function SubNav() {
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
              <Icon size={16} />
              {item.brand
                ? <span className="sub-nav-brand"><span className="sub-nav-pg">{item.brand[0]}</span>{item.brand[1]}</span>
                : <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
