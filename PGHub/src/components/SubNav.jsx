import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  Map, List, Terminal, Building2, Trophy, Swords, Target,
  GraduationCap, Brain, Vault, Network, GripVertical,
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
  { to: '/arena',                icon: Target,        brand: ['PG', 'Arena'] },
  { to: '/connect',                 icon: Network, brand: ['PG', 'Connect'], matches: ['/connect'] },
  { to: '/vault',                   icon: Vault,         brand: ['PG', 'Vault'],
    matches: ['/vault', '/review', '/lists', '/notebook', '/progress'] },
];


const DEFAULT_ORDER = TABS.map(t => t.to);
const ORDER_KEY = 'pg-subnav-order';
function loadOrder() {
  try { const s = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null'); if (Array.isArray(s) && s.length) return s; } catch { /* ignore */ }
  return DEFAULT_ORDER;
}

export default function SubNav() {
  const { prefetchProblems } = usePrefetch();
  const location = useLocation();
  const [order, setOrder] = useState(loadOrder);
  const [dragTo, setDragTo] = useState(null);
  const dragFrom = useRef(null);

  const pathMatches = (item) => {
    if (!item.matches) return false;
    return item.matches.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  };

  // Apply the saved order; any tab missing from it (e.g. a newly-added one) appends
  // at the end so the nav never silently drops a destination.
  const orderedTabs = useMemo(() => {
    const byTo = Object.fromEntries(TABS.map(t => [t.to, t]));
    const seen = new Set();
    const out = [];
    for (const to of order) if (byTo[to] && !seen.has(to)) { out.push(byTo[to]); seen.add(to); }
    for (const t of TABS) if (!seen.has(t.to)) out.push(t);
    return out;
  }, [order]);

  const commit = useCallback((next) => {
    setOrder(next);
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  // Settings can reset the nav back to the shipped order.
  useEffect(() => {
    const reset = () => { try { localStorage.removeItem(ORDER_KEY); } catch { /* ignore */ } setOrder(DEFAULT_ORDER); };
    window.addEventListener('pg:reset-navbar', reset);
    return () => window.removeEventListener('pg:reset-navbar', reset);
  }, []);

  const onDrop = useCallback((targetTo) => {
    const from = dragFrom.current;
    dragFrom.current = null; setDragTo(null);
    if (!from || from === targetTo) return;
    const cur = orderedTabs.map(t => t.to);
    const fi = cur.indexOf(from), ti = cur.indexOf(targetTo);
    if (fi < 0 || ti < 0) return;
    cur.splice(ti, 0, cur.splice(fi, 1)[0]);
    commit(cur);
  }, [orderedTabs, commit]);

  return (
    <nav className="sub-nav">
      <div className="sub-nav-inner">
        {orderedTabs.map(item => {
          const Icon = item.icon;
          const matched = pathMatches(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              draggable
              onDragStart={(e) => { dragFrom.current = item.to; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', item.to); } catch { /* ignore */ } }}
              onDragEnd={() => { dragFrom.current = null; setDragTo(null); }}
              onDragOver={(e) => { e.preventDefault(); if (dragTo !== item.to) setDragTo(item.to); }}
              onDrop={(e) => { e.preventDefault(); onDrop(item.to); }}
              className={({ isActive }) => `sub-nav-link ${isActive || matched ? 'active' : ''}${dragTo === item.to ? ' drag-over' : ''}`}
              onMouseEnter={item.prefetch ? prefetchProblems : undefined}
              title="Drag to reorder"
            >
              <GripVertical size={12} className="sub-nav-grip" aria-hidden="true" />
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
