import { supabase } from './supabase';

// Codolio-style external account connections. `stats` platforms pull live numbers;
// `link` platforms store a verified public profile URL. `url(handle)` builds the
// public link. Kept data-only (no JSX) so it can be imported anywhere.
export const PLATFORMS = [
  // Competitive / coding
  { id: 'leetcode',    name: 'LeetCode',       group: 'Coding',       hue: '--warning',    kind: 'stats', ph: 'username',    url: (h) => `https://leetcode.com/u/${h}/` },
  { id: 'github',      name: 'GitHub',         group: 'Coding',       hue: '--hue-violet', kind: 'stats', ph: 'username',    url: (h) => `https://github.com/${h}` },
  { id: 'codeforces',  name: 'Codeforces',     group: 'Coding',       hue: '--hue-sky',    kind: 'stats', ph: 'handle',      url: (h) => `https://codeforces.com/profile/${h}` },
  { id: 'codechef',    name: 'CodeChef',       group: 'Coding',       hue: '--hard',       kind: 'stats', ph: 'username',    url: (h) => `https://www.codechef.com/users/${h}` },
  { id: 'hackerrank',  name: 'HackerRank',     group: 'Coding',       hue: '--easy',       kind: 'stats', ph: 'username',    url: (h) => `https://www.hackerrank.com/profile/${h}` },
  { id: 'gfg',         name: 'GeeksforGeeks',  group: 'Coding',       hue: '--easy',       kind: 'stats', ph: 'username',    url: (h) => `https://www.geeksforgeeks.org/user/${h}/` },
  { id: 'atcoder',     name: 'AtCoder',        group: 'Coding',       hue: '--text-dim',   kind: 'link',  ph: 'username',    url: (h) => `https://atcoder.jp/users/${h}` },
  { id: 'hackerearth', name: 'HackerEarth',    group: 'Coding',       hue: '--hue-violet', kind: 'link',  ph: 'username',    url: (h) => `https://www.hackerearth.com/@${h}` },
  { id: 'kaggle',      name: 'Kaggle',         group: 'Coding',       hue: '--hue-sky',    kind: 'link',  ph: 'username',    url: (h) => `https://www.kaggle.com/${h}` },
  { id: 'stackoverflow', name: 'Stack Overflow', group: 'Coding',     hue: '--warning',    kind: 'link',  ph: 'user id',     url: (h) => `https://stackoverflow.com/users/${h}` },
  { id: 'gitlab',      name: 'GitLab',         group: 'Coding',       hue: '--hard',       kind: 'link',  ph: 'username',    url: (h) => `https://gitlab.com/${h}` },
  { id: 'codolio',     name: 'Codolio',        group: 'Coding',       hue: '--hue-pink',   kind: 'link',  ph: 'username',    url: (h) => `https://codolio.com/profile/${h}` },
  // Professional / social
  { id: 'linkedin',    name: 'LinkedIn',       group: 'Professional', hue: '--hue-sky',    kind: 'link',  ph: 'profile id',  url: (h) => `https://www.linkedin.com/in/${h}/` },
  { id: 'naukri',      name: 'Naukri',         group: 'Professional', hue: '--hue-sky',    kind: 'link',  ph: 'profile URL', url: (h) => (/^https?:\/\//.test(h) ? h : `https://${h}`) },
  { id: 'twitter',     name: 'X / Twitter',    group: 'Social',       hue: '--text-dim',   kind: 'link',  ph: 'handle',      url: (h) => `https://x.com/${h}` },
  { id: 'discord',     name: 'Discord',        group: 'Social',       hue: '--hue-violet', kind: 'link',  ph: 'user id',     url: (h) => `https://discord.com/users/${h}` },
  { id: 'instagram',   name: 'Instagram',      group: 'Social',       hue: '--hue-pink',   kind: 'link',  ph: 'username',    url: (h) => `https://instagram.com/${h}` },
  { id: 'youtube',     name: 'YouTube',        group: 'Social',       hue: '--hard',       kind: 'link',  ph: '@handle',     url: (h) => `https://youtube.com/${h.startsWith('@') ? h : '@' + h}` },
  { id: 'telegram',    name: 'Telegram',       group: 'Social',       hue: '--hue-sky',    kind: 'link',  ph: 'username',    url: (h) => `https://t.me/${h}` },
  { id: 'reddit',      name: 'Reddit',         group: 'Social',       hue: '--warning',    kind: 'link',  ph: 'username',    url: (h) => `https://reddit.com/user/${h}` },
  { id: 'medium',      name: 'Medium',         group: 'Social',       hue: '--text-main',  kind: 'link',  ph: '@handle',     url: (h) => `https://medium.com/${h.startsWith('@') ? h : '@' + h}` },
  { id: 'devto',       name: 'Dev.to',         group: 'Social',       hue: '--text-main',  kind: 'link',  ph: 'username',    url: (h) => `https://dev.to/${h}` },
  { id: 'website',     name: 'Website',        group: 'Social',       hue: '--accent',     kind: 'link',  ph: 'https://…',   url: (h) => (/^https?:\/\//.test(h) ? h : `https://${h}`) },
];
export const platformById = (id) => PLATFORMS.find((p) => p.id === id);
export const PLATFORM_GROUPS = ['Coding', 'Professional', 'Social'];

export async function getLinkedAccounts(userId) {
  const { data } = await supabase.from('PGcode_profiles').select('linked_accounts').eq('user_id', userId).maybeSingle();
  return Array.isArray(data?.linked_accounts) ? data.linked_accounts : [];
}
export async function saveLinkedAccounts(userId, accounts) {
  const { error } = await supabase.from('PGcode_profiles').upsert({ user_id: userId, linked_accounts: accounts });
  if (error) throw error;
}

// --- Resume upload (Supabase Storage, public `resumes` bucket, files namespaced
// by user id folder so RLS scopes writes to the owner) ---
export async function uploadResume(userId, file) {
  if (!file) throw new Error('No file');
  if (file.type !== 'application/pdf') throw new Error('Please upload a PDF');
  if (file.size > 8 * 1024 * 1024) throw new Error('File too large (max 8 MB)');
  const path = `${userId}/resume-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: true, contentType: 'application/pdf' });
  if (error) throw error;
  const { data } = supabase.storage.from('resumes').getPublicUrl(path);
  const url = data.publicUrl;
  const { error: e2 } = await supabase.from('PGcode_profiles').upsert({ user_id: userId, resume_url: url });
  if (e2) throw e2;
  return url;
}
export async function getResumeUrl(userId) {
  const { data } = await supabase.from('PGcode_profiles').select('resume_url').eq('user_id', userId).maybeSingle();
  return data?.resume_url || null;
}
export async function removeResume(userId) {
  const { error } = await supabase.from('PGcode_profiles').upsert({ user_id: userId, resume_url: null });
  if (error) throw error;
}

// --- live stat fetchers → { solved?, avatar?, items: [{ label, value }] } ---
async function fetchGitHub(handle) {
  const r = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`);
  if (r.status === 404) throw new Error('user not found');
  if (!r.ok) throw new Error('GitHub unavailable');
  const d = await r.json();
  return {
    avatar: d.avatar_url,
    items: [
      { label: 'Repos', value: d.public_repos ?? 0 },
      { label: 'Followers', value: d.followers ?? 0 },
      { label: 'Following', value: d.following ?? 0 },
    ],
  };
}
async function fetchCodeforces(handle) {
  const r = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
  const d = await r.json().catch(() => ({}));
  if (d.status !== 'OK' || !d.result?.[0]) throw new Error('handle not found');
  const u = d.result[0];
  return {
    avatar: u.titlePhoto,
    items: [
      { label: 'Rating', value: u.rating ?? 'unrated' },
      { label: 'Max', value: u.maxRating ?? '—' },
      { label: 'Rank', value: u.rank || 'unrated' },
    ],
  };
}
async function fetchLeetCode(handle) {
  const { data, error } = await supabase.functions.invoke('lc-user', { body: { username: handle } });
  if (error || data?.error) throw new Error(data?.error || 'user not found');
  const s = data.submitStats || {};
  const solved = s.total ?? data.totalSolved ?? 0;
  return {
    solved,
    items: [
      { label: 'Solved', value: solved },
      { label: 'Easy', value: s.easy ?? 0 },
      { label: 'Medium', value: s.medium ?? 0 },
      { label: 'Hard', value: s.hard ?? 0 },
      { label: 'Rank', value: data.ranking ? `#${Number(data.ranking).toLocaleString()}` : '—' },
    ],
  };
}
// CodeChef / HackerRank / GeeksforGeeks block browser CORS or only expose HTML,
// so they route through the `platform-stats` edge function (server-side scrape).
async function fetchViaProxy(platform, handle) {
  const { data, error } = await supabase.functions.invoke('platform-stats', { body: { platform, handle } });
  if (error) throw new Error('service unavailable');
  if (!data?.ok) throw new Error(data?.error || 'not found');
  return data.stats;
}

const FETCHERS = {
  github: fetchGitHub,
  codeforces: fetchCodeforces,
  leetcode: fetchLeetCode,
  codechef: (h) => fetchViaProxy('codechef', h),
  hackerrank: (h) => fetchViaProxy('hackerrank', h),
  gfg: (h) => fetchViaProxy('gfg', h),
};

// Returns normalized stats, or null for link-only platforms. Throws on lookup failure.
export async function fetchPlatformStats(platformId, handle) {
  const fn = FETCHERS[platformId];
  if (!fn) return null;
  return fn(String(handle).trim());
}
