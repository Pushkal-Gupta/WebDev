import { supabase } from './supabase';

// PGConnect social data layer: posts/feed, likes, follows, and profile customization.
// Posts reference auth.users (not PGcode_profiles), so author info is merged client-side
// with a single profiles lookup rather than a PostgREST embed.

async function attachAuthors(posts, viewerId) {
  if (!posts.length) return [];
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const [{ data: profs }, likeRes] = await Promise.all([
    supabase.from('PGcode_profiles').select('user_id, display_name, username, avatar_url').in('user_id', authorIds),
    viewerId
      ? supabase.from('PGcode_post_likes').select('post_id').eq('user_id', viewerId).in('post_id', posts.map((p) => p.id))
      : Promise.resolve({ data: [] }),
  ]);
  const byId = new Map((profs || []).map((p) => [p.user_id, p]));
  const liked = new Set((likeRes.data || []).map((l) => l.post_id));
  return posts.map((p) => {
    const a = byId.get(p.author_id);
    return {
      ...p,
      authorName: a?.display_name || 'Coder',
      authorUsername: a?.username || null,
      authorAvatar: a?.avatar_url || null,
      likedByMe: liked.has(p.id),
    };
  });
}

// Recent top-level posts (scope 'all' or 'following'), newest first.
export async function getFeed(viewerId, { scope = 'all', limit = 40 } = {}) {
  let authorFilter = null;
  if (scope === 'following' && viewerId) {
    const { data: f } = await supabase.from('PGcode_follows').select('followee_id').eq('follower_id', viewerId);
    authorFilter = [...(f || []).map((x) => x.followee_id), viewerId];
    if (authorFilter.length === 0) return [];
  }
  let q = supabase.from('PGcode_posts').select('*').is('reply_to', null).order('created_at', { ascending: false }).limit(limit);
  if (authorFilter) q = q.in('author_id', authorFilter);
  const { data, error } = await q;
  if (error) throw error;
  return attachAuthors(data || [], viewerId);
}

export async function getUserPosts(authorId, viewerId, limit = 40) {
  const { data, error } = await supabase.from('PGcode_posts').select('*').eq('author_id', authorId).is('reply_to', null).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return attachAuthors(data || [], viewerId);
}

export async function getReplies(postId, viewerId) {
  const { data, error } = await supabase.from('PGcode_posts').select('*').eq('reply_to', postId).order('created_at', { ascending: true });
  if (error) throw error;
  return attachAuthors(data || [], viewerId);
}

export async function createPost(authorId, body, replyTo = null) {
  const text = (body || '').trim();
  if (!authorId || !text) return null;
  const { data, error } = await supabase.from('PGcode_posts')
    .insert({ author_id: authorId, body: text.slice(0, 2000), reply_to: replyTo })
    .select('*').single();
  if (error) throw error;
  return (await attachAuthors([data], authorId))[0];
}

export async function deletePost(postId) {
  const { error } = await supabase.from('PGcode_posts').delete().eq('id', postId);
  if (error) throw error;
}

// Optimistic-friendly like toggle. `like` = desired next state.
export async function setLike(postId, userId, like) {
  if (like) {
    const { error } = await supabase.from('PGcode_post_likes').insert({ post_id: postId, user_id: userId });
    if (error && error.code !== '23505') throw error; // ignore duplicate
  } else {
    const { error } = await supabase.from('PGcode_post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
  }
}

export async function getFollowSet(userId) {
  if (!userId) return new Set();
  const { data } = await supabase.from('PGcode_follows').select('followee_id').eq('follower_id', userId);
  return new Set((data || []).map((f) => f.followee_id));
}
export async function setFollow(followerId, followeeId, follow) {
  if (follow) {
    const { error } = await supabase.from('PGcode_follows').insert({ follower_id: followerId, followee_id: followeeId });
    if (error && error.code !== '23505') throw error;
  } else {
    const { error } = await supabase.from('PGcode_follows').delete().eq('follower_id', followerId).eq('followee_id', followeeId);
    if (error) throw error;
  }
}
export async function getFollowCounts(userId) {
  const [followers, following] = await Promise.all([
    supabase.from('PGcode_follows').select('*', { count: 'exact', head: true }).eq('followee_id', userId),
    supabase.from('PGcode_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return { followers: followers.count || 0, following: following.count || 0 };
}

// Base columns exist on every deploy. linked_accounts/resume_url arrive with
// migration 95, so they're fetched separately and degrade to empty if absent —
// otherwise one 400 on the missing column would blank the whole profile.
const PROFILE_COLS = 'user_id, display_name, username, bio, avatar_url, background_preset, background_url, banner_url, total_solved';
async function getProfileExtras(userId) { // migration 95
  const { data, error } = await supabase.from('PGcode_profiles').select('linked_accounts, resume_url').eq('user_id', userId).maybeSingle();
  if (error) return {};
  return { linked_accounts: data?.linked_accounts || [], resume_url: data?.resume_url || null };
}
async function getSocialExtras(userId) { // migration 96 — separate so a missing 96 col can't drop 95's
  const { data, error } = await supabase.from('PGcode_profiles').select('location, company, website_url, skills, pinned_post_id').eq('user_id', userId).maybeSingle();
  if (error) return {};
  return { location: data?.location ?? null, company: data?.company ?? null, website_url: data?.website_url ?? null, skills: data?.skills ?? null, pinned_post_id: data?.pinned_post_id ?? null };
}
async function fetchProfile(userId) {
  const [{ data }, extra, social] = await Promise.all([
    supabase.from('PGcode_profiles').select(PROFILE_COLS).eq('user_id', userId).maybeSingle(),
    getProfileExtras(userId),
    getSocialExtras(userId),
  ]);
  return { ...(data || { user_id: userId }), ...extra, ...social };
}
export const getMyProfile = fetchProfile;
// Any user's public profile (profiles are public-read via RLS).
export const getProfileById = fetchProfile;
export async function updateMyProfile(userId, fields) {
  // Base columns exist everywhere; extras arrive with migration 96. Save base
  // first (must succeed), then extras best-effort so a pre-migration DB can't
  // block saving name/bio.
  const base = {}, extra = {};
  for (const k of ['display_name', 'username', 'bio', 'background_preset', 'background_url', 'banner_url']) {
    if (k in fields) base[k] = fields[k];
  }
  for (const k of ['location', 'company', 'website_url', 'skills', 'pinned_post_id']) {
    if (k in fields) extra[k] = fields[k];
  }
  const { error } = await supabase.from('PGcode_profiles').upsert({ user_id: userId, ...base });
  if (error) throw error;
  if (Object.keys(extra).length) {
    const { error: e2 } = await supabase.from('PGcode_profiles').update(extra).eq('user_id', userId);
    if (e2 && !/does not exist|schema cache|column/i.test(e2.message || '')) throw e2;
  }
}

// ---- Bookmarks (migration 96; degrade to empty if absent) ----
export async function getBookmarkSet(userId) {
  if (!userId) return new Set();
  const { data, error } = await supabase.from('PGcode_post_bookmarks').select('post_id').eq('user_id', userId);
  if (error) return new Set();
  return new Set((data || []).map((b) => b.post_id));
}
export async function setBookmark(userId, postId, on) {
  if (on) {
    const { error } = await supabase.from('PGcode_post_bookmarks').insert({ user_id: userId, post_id: postId });
    if (error && error.code !== '23505') throw error;
  } else {
    const { error } = await supabase.from('PGcode_post_bookmarks').delete().eq('user_id', userId).eq('post_id', postId);
    if (error) throw error;
  }
}
export async function getBookmarkedPosts(userId, viewerId, limit = 40) {
  const { data, error } = await supabase.from('PGcode_post_bookmarks')
    .select('post_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  if (error || !data?.length) return [];
  const ids = data.map((b) => b.post_id);
  const { data: posts } = await supabase.from('PGcode_posts').select('*').in('id', ids);
  const order = new Map(ids.map((id, i) => [id, i]));
  const sorted = (posts || []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return attachAuthors(sorted, viewerId);
}

// ---- Explore / discovery ----
export async function getTopPosts(viewerId, limit = 20) {
  const { data, error } = await supabase.from('PGcode_posts').select('*')
    .is('reply_to', null).order('like_count', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
  if (error) return [];
  return attachAuthors((data || []).filter((p) => (p.like_count || 0) > 0), viewerId);
}
export async function getPostsByTag(tag, viewerId, limit = 40) {
  const clean = String(tag).replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean) return [];
  // Escape the LIKE special chars completely — the backslash escape-char FIRST, then the
  // `_`/`%` wildcards — so #a_b doesn't match #axb; broad-match in SQL then post-filter for
  // the exact whole tag so #react no longer returns #reactive.
  const pattern = `%#${clean.replace(/[\\%_]/g, '\\$&')}%`;
  const exact = new RegExp(`(^|[^\\w])#${clean}([^\\w]|$)`, 'i');
  const { data, error } = await supabase.from('PGcode_posts').select('*')
    .is('reply_to', null).ilike('body', pattern).order('created_at', { ascending: false }).limit(limit);
  if (error) return [];
  return attachAuthors((data || []).filter((p) => exact.test(p.body || '')), viewerId);
}
export async function getSuggestedPeople(viewerId, limit = 12) {
  const { data, error } = await supabase.from('PGcode_profiles')
    .select('user_id, display_name, username, avatar_url, total_solved')
    .not('username', 'is', null).order('total_solved', { ascending: false }).limit(limit + 8);
  if (error) return [];
  let following = new Set();
  try { following = await getFollowSet(viewerId); } catch { /* ignore */ }
  return (data || []).filter((p) => p.user_id !== viewerId && !following.has(p.user_id)).slice(0, limit);
}
export async function getLeaderboard(limit = 15) {
  const { data, error } = await supabase.from('PGcode_profiles')
    .select('user_id, display_name, username, avatar_url, total_solved, linked_accounts')
    .order('total_solved', { ascending: false }).limit(limit + 20);
  if (error) {
    const base = await supabase.from('PGcode_profiles').select('user_id, display_name, username, avatar_url, total_solved').order('total_solved', { ascending: false }).limit(limit);
    return (base.data || []).map((p) => ({ ...p, solved: p.total_solved || 0 })).filter((p) => p.solved > 0);
  }
  return (data || [])
    .map((p) => {
      const across = Array.isArray(p.linked_accounts) ? p.linked_accounts.reduce((s, a) => s + (Number(a.stats?.solved) || 0), 0) : 0;
      return { ...p, solved: Math.max(p.total_solved || 0, across) };
    })
    .filter((p) => p.solved > 0)
    .sort((a, b) => b.solved - a.solved)
    .slice(0, limit);
}
