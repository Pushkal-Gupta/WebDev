import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User2, Pencil, MapPin, Code, AtSign, Briefcase, Globe, Mail, ExternalLink,
  Plus, Trash2, Save, X, Lock, Award, Flame, Trophy, Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { qk, useTopics } from '../../lib/queries';
import { ACHIEVEMENT_BY_ID } from '../../lib/achievements';
import { primaryTopicLabel } from '../../lib/topicLabel';
import './PublicProfile.css';

// Known hosts → Lucide icon. Matched against the parsed hostname (suffix), not a
// raw substring, so "evil-github.com" can't masquerade as GitHub.
const HOST_ICONS = [
  [['github.com', 'gitlab.com', 'bitbucket.org'], Code],
  [['twitter.com', 'x.com'], AtSign],
  [['linkedin.com'], Briefcase],
];

function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

// Map a URL to a Lucide icon. Falls back to ExternalLink.
function iconForUrl(url, label) {
  const raw = (url || '').trim();
  if (raw.startsWith('mailto:') || (!/^https?:\/\//i.test(raw) && raw.includes('@'))) return Mail;
  const host = hostOf(raw);
  if (host) {
    for (const [hosts, Icon] of HOST_ICONS) {
      if (hosts.some((h) => host === h || host.endsWith(`.${h}`))) return Icon;
    }
    return Globe;
  }
  // No parseable URL — fall back to a loose label hint for the icon only.
  const lbl = (label || '').toLowerCase();
  if (['github', 'gitlab', 'bitbucket'].some((k) => lbl.includes(k))) return Code;
  if (lbl.includes('linkedin')) return Briefcase;
  return ExternalLink;
}

function relativeJoinedLabel(ts) {
  if (!ts) return '—';
  const then = new Date(ts).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const days = Math.max(0, Math.floor(diffMs / 86_400_000));
  if (days < 1) return 'Joined today';
  if (days < 30) return `Joined ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Joined ${months}mo ago`;
  const years = Math.floor(months / 12);
  const remMo = months % 12;
  return remMo ? `Joined ${years}y ${remMo}mo ago` : `Joined ${years}y ago`;
}

// Reusable hook: profile-by-username. Public-read RLS lets anon read this.
function useProfileByUsername(username) {
  return useQuery({
    queryKey: ['profileByUsername', username || 'none'],
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await supabase
        .from('PGcode_profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
    staleTime: 60 * 1000,
  });
}

// Aggregated solves grouped by difficulty + topic for the profile owner.
// Uses the same PGcode_user_progress table the rest of the app does.
function useProfileSolves(userId) {
  return useQuery({
    queryKey: ['profileSolves', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return { rows: [], topicCounts: {}, total: 0 };
      const { data: progress, error: e1 } = await supabase
        .from('PGcode_user_progress')
        .select('problem_id, is_completed, last_solved_at')
        .eq('user_id', userId)
        .eq('is_completed', true);
      if (e1) throw e1;
      const ids = (progress || []).map(r => r.problem_id);
      if (!ids.length) return { rows: [], topicCounts: {}, total: 0 };
      const { data: probs, error: e2 } = await supabase
        .from('PGcode_problems')
        .select('id, name, topic_id, difficulty')
        .in('id', ids);
      if (e2) throw e2;
      const topicCounts = {};
      (probs || []).forEach(p => {
        const k = p.topic_id || 'misc';
        topicCounts[k] = (topicCounts[k] || 0) + 1;
      });
      return { rows: probs || [], topicCounts, total: (probs || []).length };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

function useProfileAchievements(userId) {
  return useQuery({
    queryKey: ['profileAchievements', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('PGcode_user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

function useProfileStreak(userId) {
  return useQuery({
    queryKey: ['profileStreak', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('pgcode_user_streak', { uid: userId });
      if (error) throw error;
      return data || null;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export default function PublicProfile() {
  const { username } = useParams();
  const queryClient = useQueryClient();

  const [authUserId, setAuthUserId] = useState(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setAuthUserId(session?.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthUserId(s?.user?.id || null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const { data: profile, isLoading, error } = useProfileByUsername(username);
  const ownerId = profile?.user_id || null;
  const isOwner = !!authUserId && authUserId === ownerId;

  const { data: solves } = useProfileSolves(ownerId);
  const { data: streak } = useProfileStreak(ownerId);
  const { data: achievements = [] } = useProfileAchievements(ownerId);
  const { data: topics = [] } = useTopics();

  const topicLabelById = useMemo(() => {
    const m = {};
    topics.forEach(t => { m[t.id] = primaryTopicLabel(t.name); });
    return m;
  }, [topics]);

  const masteryRows = useMemo(() => {
    const counts = solves?.topicCounts || {};
    return Object.entries(counts)
      .map(([topicId, count]) => ({
        topicId,
        label: topicLabelById[topicId] || 'Other',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [solves, topicLabelById]);

  const maxTopic = masteryRows[0]?.count || 1;

  // ---- Edit mode ----------------------------------------------------------
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (profile && form === null) {
      setForm({
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        personal_links: Array.isArray(profile.personal_links) ? profile.personal_links : [],
        profile_public: profile.profile_public !== false,
      });
    }
  }, [profile, form]);

  const startEdit = () => {
    setForm({
      display_name: profile.display_name || '',
      username: profile.username || '',
      bio: profile.bio || '',
      location: profile.location || '',
      personal_links: Array.isArray(profile.personal_links) ? profile.personal_links : [],
      profile_public: profile.profile_public !== false,
    });
    setSaveError('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setSaveError(''); };

  const updateLink = (i, key, val) => {
    setForm(f => {
      const next = [...(f.personal_links || [])];
      next[i] = { ...(next[i] || { label: '', url: '' }), [key]: val };
      return { ...f, personal_links: next };
    });
  };
  const addLink = () => setForm(f => ({ ...f, personal_links: [...(f.personal_links || []), { label: '', url: '' }] }));
  const removeLink = (i) => setForm(f => ({ ...f, personal_links: (f.personal_links || []).filter((_, idx) => idx !== i) }));

  const validateUsername = (u) => /^[a-z0-9-]{3,32}$/.test(u);

  const save = async () => {
    if (!isOwner || !form) return;
    setSaving(true);
    setSaveError('');
    try {
      const nextUsername = (form.username || '').trim().toLowerCase();
      if (!validateUsername(nextUsername)) {
        throw new Error('Username must be 3–32 lowercase letters, digits, or dashes.');
      }
      const cleanLinks = (form.personal_links || [])
        .map(l => ({ label: (l.label || '').trim(), url: (l.url || '').trim() }))
        .filter(l => l.url);
      const bio = (form.bio || '').slice(0, 500);
      const payload = {
        user_id: ownerId,
        display_name: (form.display_name || '').trim() || null,
        username: nextUsername,
        bio: bio || null,
        location: (form.location || '').trim() || null,
        personal_links: cleanLinks,
        profile_public: !!form.profile_public,
      };
      const { error: upErr } = await supabase
        .from('PGcode_profiles')
        .update(payload)
        .eq('user_id', ownerId);
      if (upErr) throw upErr;

      // Optimistically refresh cached profile data so the page reflects the change
      // without waiting on a refetch round-trip.
      queryClient.setQueryData(['profileByUsername', username], (prev) => ({ ...(prev || {}), ...payload }));
      queryClient.setQueryData(qk.profile(ownerId), (prev) => ({ ...(prev || {}), ...payload }));
      queryClient.invalidateQueries({ queryKey: ['profileByUsername'] });
      queryClient.invalidateQueries({ queryKey: qk.profile(ownerId) });

      setEditing(false);
      // If the username changed, jump to the new URL.
      if (nextUsername !== username) {
        window.location.hash = `#/u/${nextUsername}`;
      }
    } catch (e) {
      setSaveError(e?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Render -------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="pp-shell">
        <div className="pp-loading">Loading profile…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-shell">
        <div className="pp-empty">
          <h1>Couldn't load this profile.</h1>
          <p>{String(error?.message || error)}</p>
          <Link to="/" className="pp-back-link">Back to roadmap</Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pp-shell">
        <div className="pp-empty">
          <h1>No profile for @{username}.</h1>
          <p>This username isn't claimed yet. If it's yours, sign in and set a username under Edit profile.</p>
          <Link to="/" className="pp-back-link">Back to roadmap</Link>
        </div>
      </div>
    );
  }

  if (!profile.profile_public && !isOwner) {
    return (
      <div className="pp-shell">
        <div className="pp-empty">
          <Lock size={28} />
          <h1>This profile is private.</h1>
          <p>The owner has hidden their public profile.</p>
          <Link to="/" className="pp-back-link">Back to roadmap</Link>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || `@${profile.username || username}`;
  const handle = profile.username ? `@${profile.username}` : `@${username}`;
  const solvedCount = solves?.total ?? 0;
  const streakDays = streak?.current ?? 0;
  const longest = streak?.longest ?? 0;
  const score = solvedCount * 5;

  return (
    <div className="pp-shell">
      <div className="pp-card">
        <div className="pp-banner" aria-hidden="true" />

        <div className="pp-head">
          <div className="pp-avatar">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" />
              : <User2 size={42} />}
          </div>

          {!editing && (
            <div className="pp-head-body">
              <div className="pp-name-row">
                <h1 className="pp-name">{displayName}</h1>
                {isOwner && (
                  <button type="button" className="pp-edit-btn" onClick={startEdit}>
                    <Pencil size={13} /> Edit profile
                  </button>
                )}
              </div>
              <div className="pp-meta">
                <span className="pp-handle">{handle}</span>
                {profile.location && (
                  <>
                    <span className="pp-dot">·</span>
                    <span className="pp-location"><MapPin size={12} /> {profile.location}</span>
                  </>
                )}
              </div>
              {profile.bio && <p className="pp-bio">{profile.bio}</p>}
              {Array.isArray(profile.personal_links) && profile.personal_links.length > 0 && (
                <div className="pp-links">
                  {profile.personal_links.map((link, i) => {
                    const Icon = iconForUrl(link.url, link.label);
                    return (
                      <a
                        key={`${link.url}-${i}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pp-link"
                      >
                        <Icon size={13} />
                        <span>{link.label || link.url.replace(/^https?:\/\//, '')}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {editing && form && (
            <form
              className="pp-edit-form"
              onSubmit={(e) => { e.preventDefault(); save(); }}
            >
              <div className="pp-field-row">
                <label className="pp-field">
                  <span className="pp-field-label">Display name</span>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    maxLength={80}
                    placeholder="Your full name"
                  />
                </label>
                <label className="pp-field">
                  <span className="pp-field-label">Username</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    maxLength={32}
                    placeholder="your-handle"
                  />
                </label>
              </div>

              <label className="pp-field">
                <span className="pp-field-label">Bio <span className="pp-counter">{form.bio.length}/500</span></span>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 500) })}
                  rows={3}
                  placeholder="A line or two about you. Keep it sharp."
                />
              </label>

              <label className="pp-field">
                <span className="pp-field-label">Location</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  maxLength={80}
                  placeholder="Bangalore, India"
                />
              </label>

              <div className="pp-field">
                <span className="pp-field-label">Personal links</span>
                <div className="pp-links-edit">
                  {(form.personal_links || []).map((link, i) => (
                    <div key={i} className="pp-link-row">
                      <input
                        type="text"
                        value={link.label || ''}
                        onChange={(e) => updateLink(i, 'label', e.target.value)}
                        placeholder="Label (e.g. GitHub)"
                      />
                      <input
                        type="url"
                        value={link.url || ''}
                        onChange={(e) => updateLink(i, 'url', e.target.value)}
                        placeholder="https://…"
                      />
                      <button
                        type="button"
                        className="pp-icon-btn"
                        onClick={() => removeLink(i)}
                        aria-label="Remove link"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="pp-ghost-btn" onClick={addLink}>
                    <Plus size={13} /> Add link
                  </button>
                </div>
              </div>

              <label className="pp-checkbox-row">
                <input
                  type="checkbox"
                  checked={!!form.profile_public}
                  onChange={(e) => setForm({ ...form, profile_public: e.target.checked })}
                />
                <span>Make this profile publicly visible at /u/{form.username || 'your-handle'}</span>
              </label>

              {saveError && <div className="pp-error">{saveError}</div>}

              <div className="pp-edit-actions">
                <button type="button" className="pp-ghost-btn" onClick={cancelEdit} disabled={saving}>
                  <X size={13} /> Cancel
                </button>
                <button type="submit" className="pp-primary-btn" disabled={saving}>
                  <Save size={13} /> {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="pp-stats">
          <div className="pp-stat">
            <span className="pp-stat-num">{solvedCount}</span>
            <span className="pp-stat-label">Problems solved</span>
          </div>
          <div className="pp-stat">
            <span className="pp-stat-num">{streakDays}<span className="pp-stat-unit">d</span></span>
            <span className="pp-stat-label">Current streak</span>
          </div>
          <div className="pp-stat">
            <span className="pp-stat-num">{score}</span>
            <span className="pp-stat-label">Score</span>
          </div>
          <div className="pp-stat">
            <span className="pp-stat-num pp-stat-num-small">{relativeJoinedLabel(profile.created_at)}</span>
            <span className="pp-stat-label">Longest streak {longest}d</span>
          </div>
        </div>

        <section className="pp-section">
          <header className="pp-section-head">
            <div className="pp-section-eyebrow">
              <Award size={13} />
              <span>Recent achievements</span>
            </div>
            <span className="pp-section-meta">Last 6 earned</span>
          </header>
          {achievements.length === 0 ? (
            <div className="pp-section-empty">
              <Sparkles size={14} />
              <span>No badges yet. Solve a problem to earn the first one.</span>
            </div>
          ) : (
            <div className="pp-badge-grid">
              {achievements.map(({ achievement_id, earned_at }) => {
                const def = ACHIEVEMENT_BY_ID[achievement_id];
                const Icon = def?.icon || Trophy;
                return (
                  <div key={achievement_id} className={`pp-badge pp-badge-${def?.color || 'accent'}`}>
                    <div className="pp-badge-icon"><Icon size={16} /></div>
                    <div className="pp-badge-body">
                      <span className="pp-badge-title">{def?.title || achievement_id}</span>
                      <span className="pp-badge-date">
                        {earned_at ? new Date(earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="pp-section">
          <header className="pp-section-head">
            <div className="pp-section-eyebrow">
              <Flame size={13} />
              <span>Topic mastery</span>
            </div>
            <span className="pp-section-meta">Top {masteryRows.length} topics</span>
          </header>
          {masteryRows.length === 0 ? (
            <div className="pp-section-empty">
              <span>No solves yet — the chart will populate as problems get checked off.</span>
            </div>
          ) : (
            <ul className="pp-mastery-list">
              {masteryRows.map(row => {
                const pct = Math.round((row.count / maxTopic) * 100);
                return (
                  <li key={row.topicId} className="pp-mastery-row">
                    <span className="pp-mastery-label">{row.label}</span>
                    <div className="pp-mastery-bar">
                      <div className="pp-mastery-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="pp-mastery-count">{row.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
