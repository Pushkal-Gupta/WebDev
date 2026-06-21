import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Map, List, Terminal, Building2, Trophy, Swords,
  GraduationCap, Brain, Vault, Bell, RotateCcw, ArrowRight,
} from 'lucide-react';
import { usePrefetch, useReviewDueItems, useReviewCount } from '../lib/queries';
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
  { to: '/vault',                   icon: Vault,         brand: ['PG', 'Vault'],
    matches: ['/vault', '/review', '/lists', '/notebook', '/progress'] },
];

function overdueLabel(dateStr) {
  if (!dateStr) return 'Due now';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'Due today';
  if (days === 1) return 'Overdue 1 day';
  return `Overdue ${days} days`;
}

// Notifications bell — surfaces the spaced-repetition review queue (problems
// solved that are now due for revisit). The count badge used to sit on the
// PGVault tab with nowhere to view the items; this opens a panel listing them.
function NotificationsBell({ userId }) {
  const navigate = useNavigate();
  const { data: dueItems = [] } = useReviewDueItems(userId);
  const { data: count = 0 } = useReviewCount(userId);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  // dueItems is capped (panel preview); count is the true total due.
  const more = count - dueItems.length;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); btnRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // Nothing due and signed-out users: no bell at all (no dead badge).
  if (!userId) return null;

  const go = (path) => { navigate(path); close(); };

  return (
    <div className="sub-nav-notif-wrap" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={`sub-nav-notif-btn ${open ? 'open' : ''}`}
        aria-label={count > 0 ? `Notifications, ${count} review${count === 1 ? '' : 's'} due` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <Bell size={16} />
        {count > 0 && <span className="sub-nav-badge">{count}</span>}
      </button>

      {open && (
        <div className="sub-nav-notif-panel" role="menu" aria-label="Notifications">
          <div className="sub-nav-notif-head">
            <span className="sub-nav-notif-title">Notifications</span>
            {count > 0 && <span className="sub-nav-notif-count">{count} due</span>}
          </div>

          {count === 0 ? (
            <div className="sub-nav-notif-empty">
              <RotateCcw size={22} />
              <p>You&apos;re all caught up.</p>
              <span>No problems are due for review right now.</span>
            </div>
          ) : (
            <>
              <div className="sub-nav-notif-list">
                {dueItems.map((item) => (
                  <button
                    key={item.problem_id}
                    type="button"
                    role="menuitem"
                    className="sub-nav-notif-item"
                    onClick={() => go(`/category/${item.problem.topic_id}/${item.problem.id}`)}
                  >
                    <span className="sub-nav-notif-item-icon"><RotateCcw size={14} /></span>
                    <span className="sub-nav-notif-item-body">
                      <span className="sub-nav-notif-item-name">{item.problem.name}</span>
                      <span className="sub-nav-notif-item-meta">
                        <span className="sub-nav-notif-item-topic">{item.problem.topic_id}</span>
                        <span className="sub-nav-notif-item-time">{overdueLabel(item.next_review_at)}</span>
                      </span>
                    </span>
                    <ArrowRight size={13} className="sub-nav-notif-item-arrow" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                role="menuitem"
                className="sub-nav-notif-foot"
                onClick={() => go('/review')}
              >
                {more > 0 ? `View all ${count} in review queue` : 'View review queue'}
                <ArrowRight size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SubNav({ userId }) {
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
        <NotificationsBell userId={userId} />
      </div>
    </nav>
  );
}
