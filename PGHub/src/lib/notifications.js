import { supabase } from './supabase';

// All reads degrade to empty if migration 96 (PGcode_notifications) isn't applied.
export async function getNotifications(userId, limit = 30) {
  if (!userId) return [];
  const { data, error } = await supabase.from('PGcode_notifications')
    .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  if (error || !data?.length) return [];
  const actorIds = [...new Set(data.map((n) => n.actor_id).filter(Boolean))];
  const postIds = [...new Set(data.map((n) => n.post_id).filter(Boolean))];
  const [{ data: profs }, { data: posts }] = await Promise.all([
    actorIds.length ? supabase.from('PGcode_profiles').select('user_id, display_name, username, avatar_url').in('user_id', actorIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from('PGcode_posts').select('id, body').in('id', postIds) : Promise.resolve({ data: [] }),
  ]);
  const pById = new Map((profs || []).map((p) => [p.user_id, p]));
  const postById = new Map((posts || []).map((p) => [p.id, p.body]));
  return data.map((n) => ({
    ...n,
    actorName: pById.get(n.actor_id)?.display_name || 'Someone',
    actorUsername: pById.get(n.actor_id)?.username || null,
    actorAvatar: pById.get(n.actor_id)?.avatar_url || null,
    postSnippet: n.post_id ? (postById.get(n.post_id) || '').slice(0, 80) : null,
  }));
}

export async function getUnreadCount(userId) {
  if (!userId) return 0;
  const { count, error } = await supabase.from('PGcode_notifications')
    .select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false);
  if (error) return 0;
  return count || 0;
}

export async function markAllRead(userId) {
  const { error } = await supabase.from('PGcode_notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw error;
}

// Best-effort single-row read (row click); swallow errors — it's non-critical.
export async function markOneRead(userId, id) {
  try { await supabase.from('PGcode_notifications').update({ read: true }).eq('id', id).eq('user_id', userId); } catch { /* ignore */ }
}

export async function clearNotifications(userId) {
  const { error } = await supabase.from('PGcode_notifications').delete().eq('user_id', userId);
  if (error) throw error;
}
