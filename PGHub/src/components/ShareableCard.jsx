import React, { useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, Trophy, ArrowLeft, Download, Link2, Check, GitBranch, Globe, Code2, ExternalLink, Award, TrendingUp } from 'lucide-react';
// Lucide dropped brand icons (Linkedin, Twitter, Github) in recent versions —
// fall back to Globe so the link still renders cleanly.
const Linkedin = Globe;
const Twitter = Globe;
import { supabase } from '../lib/supabase';
import { useTopics, useProblemsCompact, useLeetCodeUser } from '../lib/queries';
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
function buildSvg({ displayName, handle, solved, totalProblems, streak, byDifficulty, topTopics, dateStr, learn, githubStats, leetcodeStats, leetcodeSpark, leetcodeTopPct, leetcodeHandle }) {
  const W = 1200;
  const PAD = 60;            // inner content left/right margin from the card edge
  const LEFT = PAD;          // left content edge
  const RIGHT = W - PAD;     // right content edge (1140)
  const COL_GAP = 60;        // gap between left and right columns of the middle band
  const COL_W = (RIGHT - LEFT - COL_GAP) / 2; // each column width (510)
  const RCOL = LEFT + COL_W + COL_GAP;        // right column left edge (630)
  const BLOCK_GAP = 44;      // vertical gap between stacked blocks
  const FOOTER_H = 56;       // space reserved for the footer rows
  const BOTTOM_PAD = 40;     // padding below the footer to the card edge

  const bg = readToken('--bg', '#0b0b10');
  const surface = readToken('--surface', '#16161d');
  const accent = readToken('--accent', '#7c5cff');
  const text = readToken('--text-main', '#f4f4f6');
  const dim = readToken('--text-dim', '#a0a0aa');
  const border = readToken('--border', '#26262e');
  const easy = readToken('--easy', '#22c55e');
  const medium = readToken('--medium', '#eab308');
  const hard = readToken('--hard', '#ef4444');

  const FONT = 'Inter,system-ui,sans-serif';

  // ---- Middle band: DIFFICULTY (left column) + TOP TOPICS (right column) ----
  const BAND_Y = 340;        // top of the middle band (eyebrow baseline)
  const e = byDifficulty.Easy || 0;
  const m = byDifficulty.Medium || 0;
  const h = byDifficulty.Hard || 0;
  const maxDiff = Math.max(1, e, m, h);
  const barX = LEFT;
  const barW = COL_W;        // bars now span the full left column
  const eW = Math.max(6, (e / maxDiff) * barW);
  const mW = Math.max(6, (m / maxDiff) * barW);
  const hW = Math.max(6, (h / maxDiff) * barW);
  const diffRows = [
    { label: 'Easy', val: e, w: eW, color: easy },
    { label: 'Medium', val: m, w: mW, color: medium },
    { label: 'Hard', val: h, w: hW, color: hard },
  ];
  const diffRowSvg = diffRows.map((r, i) => {
    const y = BAND_Y + 28 + i * 56;
    return `
      <text x="${barX}" y="${y - 6}" font-family="${FONT}" font-size="14" fill="${text}">${r.label}</text>
      <text x="${barX + barW}" y="${y - 6}" font-family="${FONT}" font-size="14" fill="${dim}" text-anchor="end">${r.val}</text>
      <rect x="${barX}" y="${y}" width="${barW}" height="8" rx="4" fill="${bg}" />
      <rect x="${barX}" y="${y}" width="${r.w}" height="8" rx="4" fill="${r.color}" />`;
  }).join('');
  const diffSvg = `
    <text x="${barX}" y="${BAND_Y}" font-family="${FONT}" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">DIFFICULTY</text>
    ${diffRowSvg}`;

  // TOP TOPICS — right column, full-width chips stacked one per row.
  const topicRows = topTopics.slice(0, 5);
  const topicChipW = COL_W;
  const topicSvg = `
    <text x="${RCOL}" y="${BAND_Y}" font-family="${FONT}" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">TOP TOPICS</text>
    ${topicRows.length === 0
      ? `<text x="${RCOL}" y="${BAND_Y + 36}" font-family="${FONT}" font-size="14" fill="${dim}">Start solving to unlock topic stats</text>`
      : topicRows.map((t, i) => {
        const y = BAND_Y + 16 + i * 40;
        const label = (t.label || '').slice(0, 24);
        return `
      <g transform="translate(${RCOL},${y})">
        <rect width="${topicChipW}" height="32" rx="10" fill="${bg}" stroke="${border}" />
        <text x="14" y="21" font-family="${FONT}" font-size="14" fill="${text}" font-weight="600">${escapeXml(label)}</text>
        <text x="${topicChipW - 14}" y="21" font-family="${FONT}" font-size="13" fill="${dim}" text-anchor="end">${t.count}</text>
      </g>`;
      }).join('')}`;
  // Band height = taller of the two columns.
  const diffBandH = 28 + diffRows.length * 56;            // from eyebrow to last bar bottom
  const topicBandH = topicRows.length === 0 ? 48 : 16 + topicRows.length * 40;
  const bandBottom = BAND_Y + Math.max(diffBandH, topicBandH);

  // ---- Stacked blocks below the band, tracked by a running Y cursor ----
  // Each builder returns { svg, height } where height is measured from its
  // eyebrow baseline (cursor) to the bottom of its last drawn element.
  const blocks = [];

  // Learning — eyebrow + 3 stat columns.
  {
    const learnSafe = learn || { mastered: 0, concepts: 0, achievements: 0 };
    const cols = [
      { num: learnSafe.mastered ?? 0, label: 'concepts mastered' },
      { num: learnSafe.concepts ?? 0, label: 'lessons opened' },
      { num: learnSafe.achievements ?? 0, label: 'achievements' },
    ];
    const colW = (RIGHT - LEFT) / 3;
    blocks.push((y) => ({
      height: 68,
      svg: `
        <text x="${LEFT}" y="${y}" font-family="${FONT}" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">LEARNING</text>
        ${cols.map((c, i) => {
          const x = LEFT + i * colW;
          return `
          <text x="${x}" y="${y + 44}" font-family="${FONT}" font-size="34" font-weight="800" fill="${text}">${c.num}</text>
          <text x="${x}" y="${y + 68}" font-family="${FONT}" font-size="14" fill="${dim}">${escapeXml(c.label)}</text>`;
        }).join('')}`,
    }));
  }

  // GitHub — eyebrow + 4 stat columns + language chip row.
  if (githubStats) {
    const cols = [
      { num: githubStats.publicRepos ?? 0, label: 'repos' },
      { num: githubStats.stars ?? 0, label: 'stars' },
      { num: githubStats.followers ?? 0, label: 'followers' },
      { num: githubStats.following ?? 0, label: 'following' },
    ];
    const colW = (RIGHT - LEFT) / 4;
    const langs = Array.isArray(githubStats.topLangs) ? githubStats.topLangs.slice(0, 6) : [];
    const eyebrow = `GITHUB · @${escapeXml(githubStats.login || '')}`;
    blocks.push((y) => {
      const stats = cols.map((c, i) => {
        const x = LEFT + i * colW;
        return `
          <text x="${x}" y="${y + 40}" font-family="${FONT}" font-size="30" font-weight="800" fill="${text}">${c.num}</text>
          <text x="${x}" y="${y + 62}" font-family="${FONT}" font-size="13" fill="${dim}">${escapeXml(c.label)}</text>`;
      }).join('');
      let langSvg = '';
      let height = 62;
      if (langs.length > 0) {
        const langY = y + 80;
        let cx = LEFT;
        langSvg = langs.map(l => {
          const label = String(l || '').slice(0, 16);
          const w = Math.max(70, 18 + label.length * 8);
          const out = `
          <g transform="translate(${cx},${langY})">
            <rect width="${w}" height="28" rx="14" fill="${bg}" stroke="${border}" />
            <text x="${w / 2}" y="19" font-family="${FONT}" font-size="13" fill="${text}" text-anchor="middle">${escapeXml(label)}</text>
          </g>`;
          cx += w + 10;
          return out;
        }).join('');
        height = 108;
      }
      return { height, svg: `
        <text x="${LEFT}" y="${y}" font-family="${FONT}" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">${eyebrow}</text>
        ${stats}
        ${langSvg}` };
    });
  }

  // LeetCode — eyebrow + big rating (left) + 4 stats + sparkline (right).
  if (leetcodeStats) {
    const eyebrow = `LEETCODE · @${escapeXml(leetcodeStats.username || leetcodeHandle || '')}`;
    const rating = formatRating(leetcodeStats.rating);
    const cols = [
      { val: typeof leetcodeStats.globalRanking === 'number' ? `#${leetcodeStats.globalRanking.toLocaleString()}` : '—', label: 'global rank' },
      { val: leetcodeTopPct || '—', label: 'top percentile' },
      { val: String(leetcodeStats.attendedContestsCount ?? 0), label: 'contests' },
      { val: leetcodeStats.submitStats?.total != null ? String(leetcodeStats.submitStats.total) : '—', label: 'solved' },
    ];
    const statColW = (RIGHT - RCOL) / 2; // 4 stats in a 2x2 grid in the right area
    blocks.push((y) => {
      const stats = cols.map((c, i) => {
        const x = RCOL + (i % 2) * statColW;
        const sy = y + 44 + Math.floor(i / 2) * 56;
        return `
          <text x="${x}" y="${sy}" font-family="${FONT}" font-size="26" font-weight="800" fill="${text}">${escapeXml(c.val)}</text>
          <text x="${x}" y="${sy + 22}" font-family="${FONT}" font-size="13" fill="${dim}">${escapeXml(c.label)}</text>`;
      }).join('');
      const badgeSvg = leetcodeStats.badge?.name
        ? `<text x="${LEFT}" y="${y + 92}" font-family="${FONT}" font-size="14" fill="${accent}" font-weight="600">${escapeXml(leetcodeStats.badge.name)}</text>`
        : '';
      let sparkSvg = '';
      if (leetcodeSpark) {
        const sx = RCOL;
        const sy = y + 128;
        const sw = RIGHT - RCOL;
        const sh = 36;
        const pts = leetcodeSpark.line.split(' ').map(p => {
          const [px, py] = p.split(',').map(Number);
          const nx = sx + (px / leetcodeSpark.w) * sw;
          const ny = sy + (py / leetcodeSpark.h) * sh;
          return `${nx.toFixed(1)},${ny.toFixed(1)}`;
        }).join(' ');
        sparkSvg = `
          <text x="${RCOL}" y="${y + 116}" font-family="${FONT}" font-size="12" fill="${dim}">rating history</text>
          <polyline points="${pts}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />`;
      }
      // Left column reaches y+76 (rating + label); right reaches y+122 (stats);
      // sparkline reaches y+164. Block height = the tallest of these.
      const height = leetcodeSpark ? 164 : 122;
      return { height, svg: `
        <text x="${LEFT}" y="${y}" font-family="${FONT}" font-size="13" fill="${dim}" font-weight="600" letter-spacing="2">${eyebrow}</text>
        <text x="${LEFT}" y="${y + 54}" font-family="${FONT}" font-size="56" font-weight="800" fill="url(#accentGrad)">${escapeXml(rating)}</text>
        <text x="${LEFT}" y="${y + 76}" font-family="${FONT}" font-size="14" fill="${dim}">contest rating</text>
        ${badgeSvg}
        ${stats}
        ${sparkSvg}` };
    });
  }

  // Walk the cursor through the band then each block, accumulating SVG + height.
  let cursor = bandBottom + BLOCK_GAP;
  let stackedSvg = '';
  blocks.forEach((build, i) => {
    if (i > 0) cursor += BLOCK_GAP;
    const { svg, height } = build(cursor);
    stackedSvg += svg;
    cursor += height;
  });

  const H = Math.round(cursor + BLOCK_GAP + FOOTER_H + BOTTOM_PAD);
  const footerY = H - BOTTOM_PAD - 18;

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
  <text x="120" y="142" font-family="${FONT}" font-size="34" font-weight="700" fill="${accent}" text-anchor="middle">${escapeXml(initialFor(displayName))}</text>

  <text x="190" y="118" font-family="${FONT}" font-size="32" font-weight="700" fill="${text}">${escapeXml(displayName)}</text>
  <text x="190" y="152" font-family="${FONT}" font-size="18" fill="${dim}">${escapeXml(handle)}</text>

  <!-- Big solved number -->
  <text x="${LEFT}" y="260" font-family="${FONT}" font-size="96" font-weight="800" fill="url(#accentGrad)">${solved}</text>
  <text x="${LEFT}" y="300" font-family="${FONT}" font-size="18" fill="${dim}">of ${totalProblems.toLocaleString()} problems solved</text>

  <!-- Streak chip -->
  <g transform="translate(${RIGHT - 380},90)">
    <rect width="380" height="100" rx="20" fill="${bg}" stroke="${border}" />
    <circle cx="50" cy="50" r="26" fill="${accent}" opacity="0.18" />
    <path d="M50 32 C 58 42, 64 50, 56 60 C 64 56, 70 62, 64 70 C 54 76, 42 70, 42 60 C 42 50, 50 48, 50 32 Z" fill="${accent}" />
    <text x="96" y="46" font-family="${FONT}" font-size="38" font-weight="800" fill="${text}">${streak}</text>
    <text x="96" y="74" font-family="${FONT}" font-size="16" fill="${dim}">day streak</text>
  </g>

  <!-- Middle band: difficulty (left) + top topics (right) -->
  ${diffSvg}
  ${topicSvg}

  <!-- Stacked blocks (learning, github, leetcode) -->
  ${stackedSvg}

  <!-- Footer / branding -->
  <text x="${LEFT}" y="${footerY + 18}" font-family="${FONT}" font-size="14" fill="${dim}">${escapeXml(dateStr)}</text>
  <text x="${RIGHT}" y="${footerY}" font-family="${FONT}" font-size="18" font-weight="700" fill="${accent}" text-anchor="end">PG Hub</text>
  <text x="${RIGHT}" y="${footerY + 22}" font-family="${FONT}" font-size="12" fill="${dim}" text-anchor="end">pushkalgupta.com/PGHub</text>
</svg>`;
}

function escapeXml(s) {
  return String(s || '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}
function initialFor(name) {
  const s = String(name || '?').trim();
  return s ? s.charAt(0).toUpperCase() : '?';
}

// Build a normalized polyline path for a rating sparkline over a fixed viewBox.
// Returns null when there aren't enough attended contests to draw a trend.
function sparklinePath(history, w = 200, h = 44, pad = 4) {
  const pts = (Array.isArray(history) ? history : [])
    .filter(p => p && p.attended && typeof p.rating === 'number')
    .map(p => p.rating);
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (pts.length - 1);
  const coords = pts.map((r, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((r - min) / span) * (h - pad * 2);
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const last = coords[coords.length - 1];
  return { line, last, w, h };
}

function formatRating(n) {
  return typeof n === 'number' ? Math.round(n).toLocaleString() : '—';
}
function formatTopPct(n) {
  if (typeof n !== 'number' || n <= 0) return null;
  return `${n < 1 ? n.toFixed(2) : n.toFixed(1)}%`;
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
    const vb = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
    const w = vb ? Number(vb[1]) : 1200;
    const h = vb ? Number(vb[2]) : 820;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
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

export default function ShareableCard({ embedded = false, presetUsername = null, presetUserId = null, presetDisplayName = null, githubStats = null, leetcodeHandle = null }) {
  const params = useParams();
  const username = presetUsername || params.username;

  const { data: profile, isLoading } = useProfileByUsername(username);
  const ownerId = presetUserId || profile?.user_id || null;

  const { data: solves } = useProfileSolves(ownerId);
  const { data: streakData } = useProfileStreak(ownerId);
  const { data: learn } = useProfileLearn(ownerId);
  const { data: topics = [] } = useTopics();
  const { data: allProblems = [] } = useProblemsCompact();

  // Prefer an explicit prop (live settings preview) over the stored handle.
  const lcHandle = ((leetcodeHandle ?? profile?.leetcode_handle) || '').trim();
  const { data: lcData } = useLeetCodeUser(lcHandle || undefined);
  // Only render the block when we have a contest rating to show.
  const lcStats = lcData && typeof lcData.rating === 'number' ? lcData : null;

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

  const lcSpark = useMemo(() => (lcStats ? sparklinePath(lcStats.history) : null), [lcStats]);
  const lcTopPct = lcStats ? formatTopPct(lcStats.topPercentage) : null;

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
    const svg = buildSvg({ displayName, handle, solved, totalProblems, streak, byDifficulty, topTopics, dateStr, learn, githubStats, leetcodeStats: lcStats, leetcodeSpark: lcSpark, leetcodeTopPct: lcTopPct, leetcodeHandle: lcHandle });
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
    return `${window.location.origin}/PGHub/dist/index.html#/u/${uname}/card`;
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
    const url = `https://twitter.com/intent/tweet?text=Check%20out%20my%20PG%20Hub%20stats!&url=${encodeURIComponent(cardUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading && !embedded) {
    return <div className="sc-shell"><div className="sc-loading">Building your card…</div></div>;
  }

  const card = (
    <div className={`sc-card${lcStats ? ' sc-card--lc' : ''}`} ref={cardRef} style={{ '--easy-h': '142', '--med-h': '45', '--hard-h': '0' }}>
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

      {lcStats && (
        <div className="sc-lc">
          <div className="sc-eyebrow">
            <Code2 size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            LeetCode · @{lcStats.username || lcHandle}
          </div>
          <div className="sc-lc-grid">
            <div className="sc-lc-rating">
              <div className="sc-lc-rating-num">{formatRating(lcStats.rating)}</div>
              <div className="sc-lc-rating-label">contest rating</div>
              {lcStats.badge?.name && (
                <div className="sc-lc-badge"><Award size={13} /> {lcStats.badge.name}</div>
              )}
            </div>
            <div className="sc-lc-stats">
              <div className="sc-lc-stat">
                <strong>{typeof lcStats.globalRanking === 'number' ? `#${lcStats.globalRanking.toLocaleString()}` : '—'}</strong>
                <span>global rank</span>
              </div>
              <div className="sc-lc-stat">
                <strong>{lcTopPct || '—'}</strong>
                <span>top percentile</span>
              </div>
              <div className="sc-lc-stat">
                <strong>{lcStats.attendedContestsCount ?? 0}</strong>
                <span>contests</span>
              </div>
              <div className="sc-lc-stat">
                <strong>{lcStats.submitStats?.total ?? '—'}</strong>
                <span>solved</span>
              </div>
            </div>
            <div className="sc-lc-spark">
              <div className="sc-lc-spark-head"><TrendingUp size={12} /> rating history</div>
              {lcSpark ? (
                <svg
                  className="sc-lc-spark-svg"
                  viewBox={`0 0 ${lcSpark.w} ${lcSpark.h}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    points={lcSpark.line}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle cx={lcSpark.last[0]} cy={lcSpark.last[1]} r="3" fill="var(--accent)" />
                </svg>
              ) : (
                <div className="sc-lc-spark-empty">Not enough contests yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sc-foot">
        <span className="sc-date">{dateStr}</span>
        <div className="sc-brand">
          <Trophy size={14} />
          <span>PG Hub</span>
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
      <p className="sc-hint">1200px wide, height adapts to your stats — ready for LinkedIn, X, and personal-site embeds. The downloaded PNG renders in your active theme.</p>
    </div>
  );
}
