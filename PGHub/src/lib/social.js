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

const PROFILE_COLS = 'user_id, display_name, username, bio, avatar_url, background_preset, background_url, banner_url, total_solved, linked_accounts, resume_url';
export async function getMyProfile(userId) {
  const { data } = await supabase.from('PGcode_profiles').select(PROFILE_COLS).eq('user_id', userId).maybeSingle();
  return data || { user_id: userId };
}
// Any user's public profile (profiles are public-read via RLS).
export async function getProfileById(userId) {
  const { data } = await supabase.from('PGcode_profiles').select(PROFILE_COLS).eq('user_id', userId).maybeSingle();
  return data || { user_id: userId };
}
export async function updateMyProfile(userId, fields) {
  const clean = {};
  for (const k of ['display_name', 'username', 'bio', 'background_preset', 'background_url', 'banner_url']) {
    if (k in fields) clean[k] = fields[k];
  }
  const { error } = await supabase.from('PGcode_profiles').upsert({ user_id: userId, ...clean });
  if (error) throw error;
}
