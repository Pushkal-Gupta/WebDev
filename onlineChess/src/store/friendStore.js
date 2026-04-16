import { create } from 'zustand';
import { supabase } from '../utils/supabase';

const useFriendStore = create((set, get) => ({
  friends:         [],   // accepted friendships with enriched data
  incoming:        [],   // pending requests where I am friend_id
  outgoing:        [],   // pending requests where I am user_id
  searchResults:   [],
  searchError:     null,
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

      // Collect ALL other-user IDs (accepted + pending) to enrich in one query
      const allOtherIds = data.map(r => r.user_id === userId ? r.friend_id : r.user_id);
      const uniqueIds = [...new Set(allOtherIds)];
      let ratingMap = {};
      if (uniqueIds.length > 0) {
        const { data: ratings } = await supabase
          .from('user_ratings')
          .select('user_id, username, rating, category')
          .in('user_id', uniqueIds);
        // Keep best rating per user (by category priority)
        const priority = ['bullet','blitz','rapid','classical'];
        (ratings || []).forEach(r => {
          const existing = ratingMap[r.user_id];
          if (!existing || priority.indexOf(r.category) < priority.indexOf(existing.category)) {
            ratingMap[r.user_id] = r;
          }
        });
      }

      const enrichRow = (r) => {
        const otherId = r.user_id === userId ? r.friend_id : r.user_id;
        const info = ratingMap[otherId] || {};
        return { ...r, otherId, otherUsername: info.username || null, otherRating: info.rating || null };
      };

      const friends = accepted.map(r => {
        const enriched = enrichRow(r);
        return { id: r.id, userId: enriched.otherId, username: enriched.otherUsername || 'Unknown', rating: enriched.otherRating, friendshipId: r.id };
      });

      set({
        friends,
        incoming: pending.filter(r => r.friend_id === userId).map(enrichRow),
        outgoing: pending.filter(r => r.user_id  === userId).map(enrichRow),
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

  // ── Search players ─────────────────────────────────────────────────────
  // Tries the `search_players` RPC first (case-insensitive server-side match
  // across username / display_name / email). If the RPC is missing, fails, or
  // returns empty, falls back to a direct `user_profiles` ilike query so a
  // user typing an exact display name still finds their friend.
  async searchPlayers(query) {
    const q = query.trim();
    if (!q) { set({ searchResults: [], searchError: null }); return; }
    set({ searchLoading: true, searchError: null });

    // 1) Try the RPC first.
    const rpc = await supabase.rpc('search_players', { p_query: q, p_limit: 10 });
    let rows = !rpc.error ? (rpc.data || []) : [];

    // 2) Fallback: direct table scan on user_profiles by display_name.
    //    Skips if the RPC already returned rows.
    if (rows.length === 0) {
      const { data: profileRows } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .ilike('display_name', `%${q}%`)
        .limit(10);
      if (profileRows && profileRows.length) {
        rows = profileRows.map((r) => ({
          user_id: r.user_id,
          username: r.display_name,
        }));
      }
    }

    set({
      searchResults: rows,
      searchLoading: false,
      searchError: rpc.error && rows.length === 0 ? (rpc.error.message || 'Search failed') : null,
    });
    if (rpc.error) {}
  },

  clearSearch() { set({ searchResults: [], searchLoading: false, searchError: null }); },

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
