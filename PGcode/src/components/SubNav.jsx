import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Map, List, Terminal, Building2, Trophy, Swords,
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
const TABS = [
  { to: '/',             end: true, icon: Map,           brand: ['PG', 'Path'] },
  { to: '/practice',                icon: List,          brand: ['PG', 'Code'], prefetch: true },
  { to: '/playground',              icon: Terminal,      brand: ['PG', 'Lab'] },
  { to: '/learning',                icon: GraduationCap, brand: ['PG', 'Learn'],
    // PGLearn groups Tutorial + Concepts + Courses + Visualize, so light up the
    // tab anywhere under those routes too.
    matches: ['/learning', '/tutorial', '/learn', '/courses', '/visualize'] },
  // PGForge sits right after PGLearn and before PGBattle, per user (2026-06-16).
  { to: '/ml',                      icon: Brain,         brand: ['PG', 'Forge'],
    matches: ['/ml'] },
  { to: '/compete',                 icon: Swords,        brand: ['PG', 'Battle'],
    matches: ['/compete'] },
  { to: '/company',                 icon: Building2,     brand: ['PG', 'Career'] },
  { to: '/contests',                icon: Trophy,        brand: ['PG', 'Arena'] },
  { to: '/vault',                   icon: Vault,         brand: ['PG', 'Vault'], badge: true,
    matches: ['/vault', '/review', '/lists', '/notebook', '/progress'] },
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
              <Icon size={16} />
              {item.brand
                ? <span className="sub-nav-brand"><span className="sub-nav-pg">{item.brand[0]}</span>{item.brand[1]}</span>
                : <span>{item.label}</span>}
              {item.badge && reviewCount > 0 && <span className="sub-nav-badge">{reviewCount}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
