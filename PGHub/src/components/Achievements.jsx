import React, { useMemo, useState } from 'react';
import { Lock, Search, Trophy, Flame } from 'lucide-react';
import Breadcrumb from './common/Breadcrumb';
import {
  ACHIEVEMENTS,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  buildAchievementContext,
  computeEarned,
} from '../lib/achievements';
import {
  useProblemsCompact,
  useUserProgress,
  useProfile,
  useSubmissionHistory,
  useMyContestAttempts,
  useMyListSizes,
  filterByRoadmap,
} from '../lib/queries';
import ProgressRing from './vault/ProgressRing';
import './vault/vault.css';
import './Achievements.css';

const CRUMBS = [{ label: 'Vault', to: '/vault' }, { label: 'Achievements' }];

// Map a category to one of the four hue tokens so each section reads as its own
// colour family without inventing palette values.
const CATEGORY_HUE = {
  solves: 'var(--hue-mint)',
  streak: 'var(--hard)',
  monthly: 'var(--hue-violet)',
  difficulty: 'var(--medium)',
  topic: 'var(--accent)',
  language: 'var(--hue-sky)',
  contest: 'var(--hue-pink)',
  curation: 'var(--hue-violet)',
  discovery: 'var(--hue-sky)',
  habit: 'var(--easy)',
};

export default function Achievements({ session, roadmapMode = '500', compact = false, limit = null }) {
  const userId = session?.user?.id;
  const { data: problems } = useProblemsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const { data: profile } = useProfile(userId);
  const { data: submissions = [] } = useSubmissionHistory(userId, 500);
  const { data: contestAttempts = [] } = useMyContestAttempts(userId);
  const { data: listSizes = {} } = useMyListSizes(userId);

  // Filter chip + search — full page only. Compact mode (embedded in /progress)
  // hides the controls and just shows the first `limit` items.
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const earnedIds = useMemo(() => {
    if (!userId) return new Set();
    const ctx = buildAchievementContext({
      problems: filterByRoadmap(problems, roadmapMode),
      byId: progressBundle?.byId || {},
      profile,
      submissions,
      contestAttempts,
      listSizes,
    });
    return new Set(computeEarned(ctx));
  }, [userId, problems, progressBundle, profile, roadmapMode, submissions, contestAttempts, listSizes]);

  const items = useMemo(() => {
    let list = [...ACHIEVEMENTS];
    if (statusFilter === 'earned') list = list.filter(a => earnedIds.has(a.id));
    else if (statusFilter === 'locked') list = list.filter(a => !earnedIds.has(a.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const ea = earnedIds.has(a.id) ? 0 : 1;
      const eb = earnedIds.has(b.id) ? 0 : 1;
      if (ea !== eb) return ea - eb;
      return 0;
    });
    return limit ? list.slice(0, limit) : list;
  }, [earnedIds, limit, statusFilter, search]);

  // Compact mode keeps the flat earned-first list. The full page groups by
  // category so the new Streaks and Monthly challenges land in their own
  // sections without losing the existing solve-milestone roll-up. Each section
  // carries its own earned/total tally so the heading ring is computed from the
  // full catalog, not just the post-filter slice.
  const groupedSections = useMemo(() => {
    if (compact) return null;
    const buckets = new Map();
    items.forEach(a => {
      const cat = a.category || 'misc';
      if (!buckets.has(cat)) buckets.set(cat, []);
      buckets.get(cat).push(a);
    });
    const catTotals = new Map();
    ACHIEVEMENTS.forEach(a => {
      const cat = a.category || 'misc';
      const t = catTotals.get(cat) || { earned: 0, total: 0 };
      t.total += 1;
      if (earnedIds.has(a.id)) t.earned += 1;
      catTotals.set(cat, t);
    });
    const make = (cat, entries) => {
      const t = catTotals.get(cat) || { earned: 0, total: entries.length };
      return {
        category: cat,
        label: CATEGORY_LABELS[cat] || 'Other',
        hue: CATEGORY_HUE[cat] || 'var(--accent)',
        earned: t.earned,
        total: t.total,
        entries,
      };
    };
    const ordered = [];
    CATEGORY_ORDER.forEach(cat => {
      if (buckets.has(cat)) {
        ordered.push(make(cat, buckets.get(cat)));
        buckets.delete(cat);
      }
    });
    for (const [cat, entries] of buckets) ordered.push(make(cat, entries));
    return ordered;
  }, [items, compact, earnedIds]);

  const earnedCount = earnedIds.size;
  const totalCount = ACHIEVEMENTS.length;
  const pct = totalCount ? Math.round((earnedCount / totalCount) * 100) : 0;
  const longestStreak = profile?.longest_streak || 0;

  const renderCard = (a, hue) => {
    const Icon = a.icon;
    const earned = earnedIds.has(a.id);
    const tint = hue || CATEGORY_HUE[a.category] || 'var(--accent)';
    return (
      <div
        key={a.id}
        className={`ach-card ${earned ? 'earned' : 'locked'}`}
        style={earned ? { '--ach-hue': tint } : undefined}
        title={earned ? `Earned: ${a.title}` : `Locked: ${a.title}`}
      >
        <div className="ach-card-icon">
          {earned ? <Icon size={18} /> : <Lock size={14} />}
        </div>
        <div className="ach-card-body">
          <span className="ach-card-title">{a.title}</span>
          <span className="ach-card-desc">{a.description}</span>
        </div>
        {earned && <span className="ach-card-mark" aria-hidden="true" />}
      </div>
    );
  };

  return (
    <div className={`ach ${compact ? 'ach-compact' : ''}`}>
      {!compact && <Breadcrumb items={CRUMBS} />}
      {!compact && (
        <header className="ach-header">
          <div className="ach-header-titlebar">
            <div className="ach-titlebar-text">
              <h1 className="ach-title">Achievements</h1>
              <p className="ach-sub">Badges and milestones you unlock as you solve, build streaks, and explore.</p>
            </div>
            <span className="ach-count">{earnedCount} / {totalCount} earned · {pct}%</span>
          </div>

          <div className="ach-summary">
            <div className="ach-summary-ring">
              <ProgressRing solved={earnedCount} total={totalCount} size={64} stroke={6} />
            </div>
            <div className="ach-summary-stats">
              <div className="ach-summary-stat">
                <Trophy size={14} className="ach-summary-icon" />
                <span className="ach-summary-num">{earnedCount}<span className="ach-summary-of"> / {totalCount}</span></span>
                <span className="ach-summary-label">Badges earned</span>
              </div>
              <div className="ach-summary-stat">
                <Flame size={14} className="ach-summary-icon ach-summary-flame" />
                <span className="ach-summary-num">{longestStreak}</span>
                <span className="ach-summary-label">Longest streak</span>
              </div>
            </div>
          </div>

          <div className="ach-progress-bar"><div className="ach-progress-fill" style={{ width: `${pct}%` }} /></div>
          <div className="ach-controls">
            <div className="ach-search">
              <Search size={13} />
              <input
                type="text"
                value={search}
                placeholder="Search achievements…"
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search achievements"
              />
            </div>
            <div className="ach-chips" role="tablist">
              {['all', 'earned', 'locked'].map(s => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === s}
                  className={`ach-chip ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? `All (${totalCount})` : s === 'earned' ? `Earned (${earnedCount})` : `Locked (${totalCount - earnedCount})`}
                </button>
              ))}
            </div>
          </div>
        </header>
      )}

      {items.length === 0 ? (
        <p className="ach-empty">No achievements match the current filter.</p>
      ) : compact ? (
        <div className="ach-grid">
          {items.map(renderCard)}
        </div>
      ) : (
        <div className="ach-sections">
          {groupedSections.map(section => (
            <section key={section.category} className="ach-section" style={{ '--ach-hue': section.hue }}>
              <div className="ach-section-head">
                <ProgressRing solved={section.earned} total={section.total} size={34} stroke={4} color={section.hue} />
                <h4 className="ach-section-title">{section.label}</h4>
                <span className="ach-section-count">{section.earned} / {section.total}</span>
              </div>
              <div className="ach-grid">
                {section.entries.map(a => renderCard(a, section.hue))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
