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

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) throw error;
  },

  resetPasswordForEmail: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  verifyOtp: async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
    if (error) throw error;
  },

  updatePassword: async (newPass) => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, token: null, username: null });
  },
}));

export default useAuthStore;
