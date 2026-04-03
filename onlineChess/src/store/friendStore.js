import { create } from 'zustand';
import { supabase } from '../utils/supabase';

const useFriendStore = create((set, get) => ({
  friends:         [],   // accepted friendships with enriched data
  incoming:        [],   // pending requests where I am friend_id
  outgoing:        [],   // pending requests where I am user_id
  searchResults:   [],
  loading:         false,
  searchLoading:   false,

  // ── Load all friendship data for the current user ──────────────────────────
  async loadFriends(userId) {
    if (!userId) return;
    set({ loading: true });

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error || !data) { set({ loading: false }); return; }

      const accepted = data.filter(r => r.status === 'accepted');
      const pending  = data.filter(r => r.status === 'pending');

      // Enrich accepted friendships with the other person's rating info
      const friendIds = accepted.map(r => r.user_id === userId ? r.friend_id : r.user_id);
      let ratingMap = {};
      if (friendIds.length > 0) {
        const { data: ratings } = await supabase
          .from('user_ratings')
          .select('user_id, username, rating, category')
          .in('user_id', friendIds);
        // Keep best rating per user (by category priority)
        const priority = ['bullet','blitz','rapid','classical'];
        (ratings || []).forEach(r => {
          const existing = ratingMap[r.user_id];
          if (!existing || priority.indexOf(r.category) < priority.indexOf(existing.category)) {
            ratingMap[r.user_id] = r;
          }
        });
      }

      const friends = accepted.map(r => {
        const otherId = r.user_id === userId ? r.friend_id : r.user_id;
        const info = ratingMap[otherId] || {};
        return { id: r.id, userId: otherId, username: info.username || 'Unknown', rating: info.rating || null, friendshipId: r.id };
      });

      set({
        friends,
        incoming: pending.filter(r => r.friend_id === userId),
        outgoing: pending.filter(r => r.user_id  === userId),
        loading: false,
      });
    } catch (err) {
      console.error('Failed to load friends:', err);
      set({ loading: false });
    }
  },

  // ── Send a friend request ──────────────────────────────────────────────────
  async sendRequest(myUserId, targetUserId) {
    const { error } = await supabase.from('friendships').insert({
      user_id: myUserId, friend_id: targetUserId, status: 'pending',
    });
    if (error) throw new Error(error.message);
    await get().loadFriends(myUserId);
  },

  // ── Accept an incoming request ────────────────────────────────────────────
  async acceptRequest(friendshipId, myUserId) {
    const { error } = await supabase
      .from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    if (error) throw new Error(error.message);
    await get().loadFriends(myUserId);
  },

  // ── Decline / cancel / unfriend ───────────────────────────────────────────
  async removeRequest(friendshipId, myUserId) {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (error) throw new Error(error.message);
    await get().loadFriends(myUserId);
  },

  // ── Search players by username prefix (uses search_players RPC) ─────────
  async searchPlayers(query) {
    if (!query.trim()) { set({ searchResults: [] }); return; }
    set({ searchLoading: true });
    const { data, error } = await supabase.rpc('search_players', {
      p_query: query.trim(),
      p_limit: 10,
    });
    set({ searchResults: error ? [] : (data || []), searchLoading: false });
  },

  clearSearch() { set({ searchResults: [], searchLoading: false }); },

  // ── Check friendship status with a target user ────────────────────────────
  getFriendshipStatus(targetUserId) {
    const { friends, incoming, outgoing } = get();
    if (friends.some(f => f.userId === targetUserId)) return 'friends';
    if (incoming.some(r => r.user_id === targetUserId)) return 'incoming';  // sender is user_id in incoming rows
    if (outgoing.some(r => r.friend_id === targetUserId)) return 'outgoing'; // target is friend_id in outgoing rows
    return 'none';
  },

  getFriendshipId(targetUserId) {
    const { friends, incoming, outgoing } = get();
    const f = friends.find(f => f.userId === targetUserId);
    if (f) return f.friendshipId;
    const i = incoming.find(r => r.user_id === targetUserId);
    if (i) return i.id;
    const o = outgoing.find(r => r.friend_id === targetUserId);
    if (o) return o.id;
    return null;
  },
}));

export default useFriendStore;
