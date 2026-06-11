import React, { useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, Trophy, ArrowLeft, Download, Link2, Check, GitBranch, Globe, Code2, ExternalLink } from 'lucide-react';
// Lucide dropped brand icons (Linkedin, Twitter, Github) in recent versions —
// fall back to Globe so the link still renders cleanly.
const Linkedin = Globe;
const Twitter = Globe;
import { supabase } from '../lib/supabase';
import { useTopics, useProblemsCompact } from '../lib/queries';
import { primaryTopicLabel } from '../lib/topicLabel';
import './ShareableCard.css';

// Public-read profile by username — same shape PublicProfile uses.
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

function useProfileSolves(userId) {
  return useQuery({
    queryKey: ['cardSolves', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return { byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }, topicCounts: {}, total: 0 };
      const { data: progress, error: e1 } = await supabase
        .from('PGcode_user_progress')
        .select('problem_id, is_completed')
        .eq('user_id', userId)
        .eq('is_completed', true);
      if (e1) throw e1;
      const ids = (progress || []).map(r => r.problem_id);
      if (!ids.length) return { byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }, topicCounts: {}, total: 0 };
      const { data: probs, error: e2 } = await supabase
        .from('PGcode_problems')
        .select('id, topic_id, difficulty')
        .in('id', ids);
      if (e2) throw e2;
      const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
      const topicCounts = {};
      (probs || []).forEach(p => {
        if (byDifficulty[p.difficulty] !== undefined) byDifficulty[p.difficulty]++;
        const k = p.topic_id || 'misc';
        topicCounts[k] = (topicCounts[k] || 0) + 1;
      });
      return { byDifficulty, topicCounts, total: (probs || []).length };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

function useProfileStreak(userId) {
  return useQuery({
    queryKey: ['cardStreak', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('pgcode_user_streak', { uid: userId });
      if (error) return null;
      return data || null;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

function useProfileLearn(userId) {
  return useQuery({
    queryKey: ['cardLearn', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return { concepts: 0, mastered: 0, achievements: 0 };
      let concepts = 0;
      let mastered = 0;
      let achievements = 0;
      try {
        const { data: cp } = await supabase
          .from('PGcode_user_concept_progress')
          .select('status')
          .eq('user_id', userId);
        if (cp) {
          concepts = cp.length;
          mastered = cp.filter(r => r.status === 'mastered').length;
        }
      } catch { /* table absent / RLS */ }
      try {
        const { count } = await supabase
          .from('PGcode_user_achievements')
          .select('achievement_id', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (typeof count === 'number') achievements = count;
      } catch { /* table absent / RLS */ }
      return { concepts, mastered, achievements };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// Resolves a theme-token CSS variable from the live DOM. Falls back to a
// reasonable hex so SVG export works even outside a themed shell.
function readToken(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// Render the card as a static SVG string — used for PNG export. Keeps tokens
// resolved at export time so the downloaded image matches the active theme.
function buildSvg({ displayName, handle, solved, totalProblems, streak, byDifficulty, topTopics, dateStr, learn, githubStats }) {
  const W = 1200;
  const H = 820;
  const bg = readToken('--bg', '#0b0b10');
  const surface = readToken('--surface', '#16161d');
  const accent = readToken('--accent', '#7c5cff');
  const text = readToken('--text-main', '#f4f4f6');
  const dim = readToken('--text-dim', '#a0a0aa');
  const border = readToken('--border', '#26262e');
  const easy = readToken('--easy', '#22c55e');
  const medium = readToken('--medium', '#eab308');
  const hard = readToken('--hard', '#ef4444');

  const e = byDifficulty.Easy || 0;
  const m = byDifficulty.Medium || 0;
  const h = byDifficulty.Hard || 0;
  const maxDiff = Math.max(1, e, m, h);
  const barW = 280;
  const barX = 60;
  const eW = Math.max(6, (e / maxDiff) * barW);
  const mW = Math.max(6, (m / maxDiff) * barW);
  const hW = Math.max(6, (h / maxDiff) * barW);

  const chips = topTopics.slice(0, 5).map((t, i) => {
    const x = 60 + (i % 3) * 230;
    const y = 470 + Math.floor(i / 3) * 56;
    const label = (t.label || '').slice(0, 18);
    return `
      <g transform="translate(${x},${y})">
        <rect width="210" height="44" rx="12" fill="${surface}" stroke="${border}" />
        <text x="16" y="28" font-family="Inter,system-ui,sans-serif" font-size="15" fill="${text}" font-weight="600">${escapeXml(label)}</text>
        <text x="194" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${dim}" text-anchor="end">${t.count}</text>
      </g>`;
  }).join('');

  // Learning row — three stats, full-width, sits below topics/diff block.
  const learnSafe = learn || { mastered: 0, concepts: 0, achievements: 0 };
  const learnY = 600;
  const learnCols = [
    { num: learnSafe.mastered ?? 0, label: 'concepts mastered' },
    { num: learnSafe.concepts ?? 0, label: 'lessons opened' },
    { num: learnSafe.achievements ?? 0, label: 'achievements' },
  ];
  const learnColW = 360;
  const learnBlock = `
    <text x="60" y="${learnY}" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">LEARNING</text>
    ${learnCols.map((c, i) => {
      const x = 60 + i * learnColW;
      return `
        <text x="${x}" y="${learnY + 44}" font-family="Inter,system-ui,sans-serif" font-size="34" font-weight="800" fill="${text}">${c.num}</text>
        <text x="${x}" y="${learnY + 68}" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${dim}">${escapeXml(c.label)}</text>
      `;
    }).join('')}
  `;

  // GitHub row — eyebrow + 4 stats + language chips. Skip entirely if no stats.
  let githubBlock = '';
  if (githubStats) {
    const ghY = 700;
    const ghCols = [
      { num: githubStats.publicRepos ?? 0, label: 'repos' },
      { num: githubStats.stars ?? 0, label: 'stars' },
      { num: githubStats.followers ?? 0, label: 'followers' },
      { num: githubStats.following ?? 0, label: 'following' },
    ];
    const ghColW = 270;
    const ghEyebrow = `GITHUB · @${escapeXml(githubStats.login || '')}`;
    const statsSvg = ghCols.map((c, i) => {
      const x = 60 + i * ghColW;
      return `
        <text x="${x}" y="${ghY + 40}" font-family="Inter,system-ui,sans-serif" font-size="30" font-weight="800" fill="${text}">${c.num}</text>
        <text x="${x}" y="${ghY + 62}" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${dim}">${escapeXml(c.label)}</text>
      `;
    }).join('');
    let langSvg = '';
    const langs = Array.isArray(githubStats.topLangs) ? githubStats.topLangs.slice(0, 6) : [];
    if (langs.length > 0) {
      let cx = 60;
      const langChipY = ghY + 82;
      langSvg = langs.map(l => {
        const label = String(l || '').slice(0, 16);
        const w = Math.max(70, 18 + label.length * 8);
        const out = `
          <g transform="translate(${cx},${langChipY})">
            <rect width="${w}" height="28" rx="14" fill="${bg}" stroke="${border}" />
            <text x="${w / 2}" y="19" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${text}" text-anchor="middle">${escapeXml(label)}</text>
          </g>`;
        cx += w + 10;
        return out;
      }).join('');
    }
    githubBlock = `
      <text x="60" y="${ghY}" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">${ghEyebrow}</text>
      ${statsSvg}
      ${langSvg}
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}" />
      <stop offset="1" stop-color="${surface}" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}" />
      <stop offset="1" stop-color="${accent}" stop-opacity="0.6" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)" />
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="24" fill="${surface}" stroke="${border}" />

  <!-- Avatar circle -->
  <circle cx="120" cy="130" r="42" fill="${accent}" opacity="0.18" />
  <circle cx="120" cy="130" r="42" fill="none" stroke="${accent}" stroke-width="2" />
  <text x="120" y="142" font-family="Inter,system-ui,sans-serif" font-size="34" font-weight="700" fill="${accent}" text-anchor="middle">${escapeXml(initialFor(displayName))}</text>

  <text x="190" y="118" font-family="Inter,system-ui,sans-serif" font-size="32" font-weight="700" fill="${text}">${escapeXml(displayName)}</text>
  <text x="190" y="152" font-family="Inter,system-ui,sans-serif" font-size="18" fill="${dim}">${escapeXml(handle)}</text>

  <!-- Big solved number -->
  <text x="60" y="260" font-family="Inter,system-ui,sans-serif" font-size="96" font-weight="800" fill="url(#accentGrad)">${solved}</text>
  <text x="60" y="300" font-family="Inter,system-ui,sans-serif" font-size="18" fill="${dim}">of ${totalProblems.toLocaleString()} problems solved</text>

  <!-- Streak chip -->
  <g transform="translate(720,90)">
    <rect width="380" height="100" rx="20" fill="${bg}" stroke="${border}" />
    <circle cx="50" cy="50" r="26" fill="${accent}" opacity="0.18" />
    <path d="M50 32 C 58 42, 64 50, 56 60 C 64 56, 70 62, 64 70 C 54 76, 42 70, 42 60 C 42 50, 50 48, 50 32 Z" fill="${accent}" transform="translate(0,0)" />
    <text x="96" y="46" font-family="Inter,system-ui,sans-serif" font-size="38" font-weight="800" fill="${text}">${streak}</text>
    <text x="96" y="74" font-family="Inter,system-ui,sans-serif" font-size="16" fill="${dim}">day streak</text>
  </g>

  <!-- Difficulty bars -->
  <g transform="translate(0,340)">
    <text x="${barX}" y="0" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">DIFFICULTY</text>

    <text x="${barX}" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${text}">Easy</text>
    <text x="${barX + barW}" y="28" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${dim}" text-anchor="end">${e}</text>
    <rect x="${barX}" y="34" width="${barW}" height="8" rx="4" fill="${bg}" />
    <rect x="${barX}" y="34" width="${eW}" height="8" rx="4" fill="${easy}" />

    <text x="${barX}" y="66" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${text}">Medium</text>
    <text x="${barX + barW}" y="66" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${dim}" text-anchor="end">${m}</text>
    <rect x="${barX}" y="72" width="${barW}" height="8" rx="4" fill="${bg}" />
    <rect x="${barX}" y="72" width="${mW}" height="8" rx="4" fill="${medium}" />

    <text x="${barX}" y="104" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${text}">Hard</text>
    <text x="${barX + barW}" y="104" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${dim}" text-anchor="end">${h}</text>
    <rect x="${barX}" y="110" width="${barW}" height="8" rx="4" fill="${bg}" />
    <rect x="${barX}" y="110" width="${hW}" height="8" rx="4" fill="${hard}" />
  </g>

  <!-- Top topics label -->
  <text x="60" y="450" font-family="Inter,system-ui,sans-serif" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">TOP TOPICS</text>
  ${chips}

  <!-- Learning row -->
  ${learnBlock}

  <!-- GitHub row (skipped when githubStats is null) -->
  ${githubBlock}

  <!-- Footer / branding -->
  <text x="60" y="${H - 40}" font-family="Inter,system-ui,sans-serif" font-size="14" fill="${dim}">${escapeXml(dateStr)}</text>
  <text x="${W - 60}" y="${H - 40}" font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="700" fill="${accent}" text-anchor="end">PGcode</text>
  <text x="${W - 60}" y="${H - 18}" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${dim}" text-anchor="end">pushkalgupta.com/PGcode</text>
</svg>`;
}

function escapeXml(s) {
  return String(s || '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}
function initialFor(name) {
  const s = String(name || '?').trim();
  return s ? s.charAt(0).toUpperCase() : '?';
}

// Convert the SVG string into a PNG download via a hidden canvas.
async function downloadAsPng(svgString, filename) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 820;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1200, 820);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ShareableCard({ embedded = false, presetUsername = null, presetUserId = null, presetDisplayName = null, githubStats = null }) {
  const params = useParams();
  const username = presetUsername || params.username;

  const { data: profile, isLoading } = useProfileByUsername(username);
  const ownerId = presetUserId || profile?.user_id || null;

  const { data: solves } = useProfileSolves(ownerId);
  const { data: streakData } = useProfileStreak(ownerId);
  const { data: learn } = useProfileLearn(ownerId);
  const { data: topics = [] } = useTopics();
  const { data: allProblems = [] } = useProblemsCompact();

  const topicLabelById = useMemo(() => {
    const m = {};
    topics.forEach(t => { m[t.id] = primaryTopicLabel(t.name); });
    return m;
  }, [topics]);

  const topTopics = useMemo(() => {
    const counts = solves?.topicCounts || {};
    return Object.entries(counts)
      .map(([topicId, count]) => ({ topicId, label: topicLabelById[topicId] || 'Other', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [solves, topicLabelById]);

  const displayName = presetDisplayName || profile?.display_name || (username ? `@${username}` : 'PGcoder');
  const handle = profile?.username ? `@${profile.username}` : (username ? `@${username}` : '@anonymous');
  const solved = solves?.total ?? 0;
  const totalProblems = allProblems.length || 3788;
  const streak = streakData?.current ?? 0;
  const byDifficulty = solves?.byDifficulty || { Easy: 0, Medium: 0, Hard: 0 };
  const dateStr = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  const handleDownload = async () => {
    const svg = buildSvg({ displayName, handle, solved, totalProblems, streak, byDifficulty, topTopics, dateStr, learn, githubStats });
    await downloadAsPng(svg, `pgcode-${(profile?.username || username || 'card')}.png`);
  };

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.href.split('#')[0];
    return `${base}#/u/${profile?.username || username || ''}/card`;
  }, [profile, username]);

  const cardUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const uname = profile?.username || username || '';
    return `${window.location.origin}/PGcode/dist/index.html#/u/${uname}/card`;
  }, [profile, username]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=Check%20out%20my%20PGcode%20stats!&url=${encodeURIComponent(cardUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading && !embedded) {
    return <div className="sc-shell"><div className="sc-loading">Building your card…</div></div>;
  }

  const card = (
    <div className="sc-card" ref={cardRef} style={{ '--easy-h': '142', '--med-h': '45', '--hard-h': '0' }}>
      <div className="sc-card-bg" aria-hidden="true" />
      <div className="sc-card-head">
        <div className="sc-avatar">{initialFor(displayName)}</div>
        <div>
          <div className="sc-name">{displayName}</div>
          <div className="sc-handle">{handle}</div>
        </div>
        <div className="sc-streak-chip">
          <Flame size={22} />
          <div>
            <div className="sc-streak-num">{streak}</div>
            <div className="sc-streak-label">day streak</div>
          </div>
        </div>
      </div>

      <div className="sc-big">
        <div className="sc-big-num">{solved}</div>
        <div className="sc-big-sub">of {totalProblems.toLocaleString()} problems solved</div>
      </div>

      <div className="sc-diff">
        <div className="sc-eyebrow">Difficulty</div>
        {[
          { k: 'Easy', cls: 'easy', v: byDifficulty.Easy || 0 },
          { k: 'Medium', cls: 'medium', v: byDifficulty.Medium || 0 },
          { k: 'Hard', cls: 'hard', v: byDifficulty.Hard || 0 },
        ].map(row => {
          const max = Math.max(1, byDifficulty.Easy || 0, byDifficulty.Medium || 0, byDifficulty.Hard || 0);
          const pct = Math.max(4, Math.round((row.v / max) * 100));
          return (
            <div key={row.k} className="sc-diff-row">
              <span className="sc-diff-label">{row.k}</span>
              <div className="sc-diff-track"><div className={`sc-diff-fill sc-diff-${row.cls}`} style={{ width: `${pct}%` }} /></div>
              <span className="sc-diff-num">{row.v}</span>
            </div>
          );
        })}
      </div>

      <div className="sc-topics">
        <div className="sc-eyebrow">Top Topics</div>
        <div className="sc-chip-grid">
          {topTopics.length === 0 && <div className="sc-chip sc-chip-empty">Start solving to unlock topic stats</div>}
          {topTopics.map(t => (
            <div key={t.topicId} className="sc-chip">
              <span className="sc-chip-label">{t.label}</span>
              <span className="sc-chip-count">{t.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sc-learn">
        <div className="sc-eyebrow">Learning</div>
        <div className="sc-mini-row">
          <div className="sc-mini">
            <div className="sc-mini-num">{learn?.mastered ?? 0}</div>
            <div className="sc-mini-label">concepts mastered</div>
          </div>
          <div className="sc-mini">
            <div className="sc-mini-num">{learn?.concepts ?? 0}</div>
            <div className="sc-mini-label">lessons opened</div>
          </div>
          <div className="sc-mini">
            <div className="sc-mini-num">{learn?.achievements ?? 0}</div>
            <div className="sc-mini-label">achievements</div>
          </div>
        </div>
      </div>

      {githubStats && (
        <div className="sc-github">
          <div className="sc-eyebrow">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true" style={{ verticalAlign: '-1px', marginRight: 4 }}>
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
            </svg>
            GitHub · @{githubStats.login}
          </div>
          <div className="sc-gh-row">
            {githubStats.avatar && <img src={githubStats.avatar} alt="" className="sc-gh-avatar" crossOrigin="anonymous" />}
            <div className="sc-gh-stats">
              <div className="sc-gh-stat"><strong>{githubStats.publicRepos ?? 0}</strong><span>repos</span></div>
              <div className="sc-gh-stat"><strong>{githubStats.stars ?? 0}</strong><span>stars</span></div>
              <div className="sc-gh-stat"><strong>{githubStats.followers ?? 0}</strong><span>followers</span></div>
              <div className="sc-gh-stat"><strong>{githubStats.following ?? 0}</strong><span>following</span></div>
            </div>
          </div>
          {githubStats.topLangs?.length > 0 && (
            <div className="sc-gh-langs">
              {githubStats.topLangs.map(l => <span key={l} className="sc-gh-lang">{l}</span>)}
            </div>
          )}
        </div>
      )}

      <div className="sc-foot">
        <span className="sc-date">{dateStr}</span>
        <div className="sc-brand">
          <Trophy size={14} />
          <span>PGcode</span>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="sc-embed">
        <div className="sc-preview-wrap">{card}</div>
        <div className="sc-actions">
          <button type="button" className="sc-btn sc-btn-primary" onClick={handleDownload}>
            <Download size={14} /> Download PNG
          </button>
          <button type="button" className="sc-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? 'Copied' : 'Copy share link'}
          </button>
          <button type="button" className="sc-btn" onClick={handleShareLinkedIn}>
            <Linkedin size={14} /> Share on LinkedIn
          </button>
          <button type="button" className="sc-btn" onClick={handleShareTwitter}>
            <Twitter size={14} /> Share on X
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-shell">
      <div className="sc-toolbar">
        <Link to={profile?.username ? `/u/${profile.username}` : '/'} className="sc-back">
          <ArrowLeft size={14} /> Back to profile
        </Link>
        <div className="sc-toolbar-actions">
          <button type="button" className="sc-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? 'Copied' : 'Copy link'}
          </button>
          <button type="button" className="sc-btn" onClick={handleShareLinkedIn}>
            <Linkedin size={14} /> Share on LinkedIn
          </button>
          <button type="button" className="sc-btn" onClick={handleShareTwitter}>
            <Twitter size={14} /> Share on X
          </button>
          <button type="button" className="sc-btn sc-btn-primary" onClick={handleDownload}>
            <Download size={14} /> Download PNG
          </button>
        </div>
      </div>
      <div className="sc-preview-wrap">{card}</div>
      <p className="sc-hint">1200 by 820, ready for LinkedIn, X, and personal-site embeds. The downloaded PNG renders in your active theme.</p>
    </div>
  );
}
