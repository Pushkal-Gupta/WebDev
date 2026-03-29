import { create } from 'zustand';
import { supabase } from '../utils/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  username: null,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({
        user: session.user,
        token: session.access_token,
        username: session.user.email?.split('@')[0] || session.user.email,
      });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        set({
          user: session.user,
          token: session.access_token,
          username: session.user.email?.split('@')[0] || session.user.email,
        });
      } else {
        set({ user: null, token: null, username: null });
      }
    });
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signup: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, token: null, username: null });
  },
}));

export default useAuthStore;
