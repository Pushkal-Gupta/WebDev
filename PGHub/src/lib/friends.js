// Friends + direct challenges for PGBattle. Friendships live in PGcode_friends
// (user_id = requester, friend_id = target, status pending|accepted|rejected).
// A challenge is an ephemeral Realtime broadcast on the RECIPIENT's channel — no
// row is written; if they're online with the app open they get an instant invite.
import { supabase } from './supabase';

async function profilesFor(ids) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return {};
  const { data } = await supabase.from('PGcode_profiles')
    .select('user_id, display_name, username, avatar_url').in('user_id', uniq);
  return Object.fromEntries((data || []).map((p) => [p.user_id, p]));
}

function label(p, fallback = 'Coder') {
  return p?.display_name || p?.username || fallback;
}

// Search users by username or display name (excluding self + non-named rows).
export async function searchUsers(query, selfId) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase.from('PGcode_profiles')
    .select('user_id, display_name, username, avatar_url')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(12);
  if (error) throw error;
  return (data || []).filter((p) => p.user_id !== selfId && (p.display_name || p.username))
    .map((p) => ({ id: p.user_id, name: label(p), username: p.username, avatar: p.avatar_url }));
}

// Accepted friends (either direction), with their profile.
export async function getFriends(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from('PGcode_friends')
    .select('id, user_id, friend_id, status')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');
  if (error) throw error;
  const rows = data || [];
  const others = rows.map((r) => (r.user_id === userId ? r.friend_id : r.user_id));
  const profs = await profilesFor(others);
  return rows.map((r) => {
    const otherId = r.user_id === userId ? r.friend_id : r.user_id;
    return { rowId: r.id, id: otherId, name: label(profs[otherId]), username: profs[otherId]?.username, avatar: profs[otherId]?.avatar_url };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

// Pending requests sent TO me.
export async function getIncomingRequests(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from('PGcode_friends')
    .select('id, user_id').eq('friend_id', userId).eq('status', 'pending');
  if (error) throw error;
  const rows = data || [];
  const profs = await profilesFor(rows.map((r) => r.user_id));
  return rows.map((r) => ({ rowId: r.id, id: r.user_id, name: label(profs[r.user_id]), username: profs[r.user_id]?.username }));
}

// Pending requests I have sent (so the UI can show "requested").
export async function getOutgoingRequests(userId) {
  if (!userId) return [];
  const { data } = await supabase.from('PGcode_friends')
    .select('friend_id').eq('user_id', userId).eq('status', 'pending');
  return (data || []).map((r) => r.friend_id);
}

export async function sendFriendRequest(userId, friendId) {
  if (!userId || !friendId || userId === friendId) return;
  // upsert so a re-request (or an existing rejected row) becomes pending again
  const { error } = await supabase.from('PGcode_friends')
    .upsert({ user_id: userId, friend_id: friendId, status: 'pending' }, { onConflict: 'user_id,friend_id' });
  if (error) throw error;
}

export async function respondFriendRequest(rowId, accept) {
  const { error } = await supabase.from('PGcode_friends')
    .update({ status: accept ? 'accepted' : 'rejected' }).eq('id', rowId);
  if (error) throw error;
}

export async function removeFriend(rowId) {
  const { error } = await supabase.from('PGcode_friends').delete().eq('id', rowId);
  if (error) throw error;
}

// ── Direct challenges (ephemeral broadcast on the recipient's personal channel) ──
export function challengeChannel(userId) {
  return supabase.channel(`challenge:${userId}`, { config: { broadcast: { self: false } } });
}

// Fire a challenge at a friend. Opens the recipient's channel, sends, tears down.
export async function sendChallenge(toUserId, payload) {
  const ch = challengeChannel(toUserId);
  await new Promise((resolve) => {
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        ch.send({ type: 'broadcast', event: 'challenge', payload }).then(resolve).catch(resolve);
      }
    });
    setTimeout(resolve, 2500);
  });
  setTimeout(() => supabase.removeChannel(ch), 800);
}
