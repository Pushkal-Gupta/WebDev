import { create } from 'zustand';
import { supabase } from '../utils/supabase';

let _realtimeChannel = null;

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount:   0,

  // ── Load existing notifications ────────────────────────────────────────────
  async loadNotifications(userId) {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const notifs = data || [];
    set({ notifications: notifs, unreadCount: notifs.filter(n => !n.read).length });
  },

  // ── Subscribe to new notifications via Realtime ───────────────────────────
  subscribe(userId) {
    if (!userId || _realtimeChannel) return;

    _realtimeChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotif = payload.new;
          set(state => ({
            notifications: [newNotif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        }
      )
      .subscribe();
  },

  // ── Unsubscribe (on logout) ───────────────────────────────────────────────
  unsubscribe() {
    if (_realtimeChannel) {
      supabase.removeChannel(_realtimeChannel);
      _realtimeChannel = null;
    }
    set({ notifications: [], unreadCount: 0 });
  },

  // ── Mark a single notification as read ───────────────────────────────────
  async markRead(notificationId) {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  // ── Mark all as read ──────────────────────────────────────────────────────
  async markAllRead(userId) {
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', userId).eq('read', false);
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));

export default useNotificationStore;
